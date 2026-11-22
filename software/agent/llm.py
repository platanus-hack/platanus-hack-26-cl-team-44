"""Una llamada de 1 turno al modelo, con salida estructurada. Todo el código que llama a Claude pasa por acá.

    datos, meta = await llm.consultar(sistema, prompt, esquema, modelo)

datos: el JSON del esquema como dict, o None si el modelo no lo entregó.
meta: {"backend", "subtype", "duration_ms", "num_turns", "cost_usd_estimado", "error", ...}.
Quien llama pone el tope de tiempo (TOKI_AGENTE_TOPE_S) y usa reglas si datos es None o si hay una excepción.

Dos backends, elegidos con TOKI_LLM:
  suscripcion  claude-agent-sdk con la sesión de Claude Code (CLAUDE_CODE_OAUTH_TOKEN). Es para uso personal:
               una persona que corre Myo para sí misma, con su propia suscripción.
  api          SDK oficial `anthropic` (Messages API) con ANTHROPIC_API_KEY. Es para un servicio que atiende a otras personas.
Sin TOKI_LLM: suscripcion si existe CLAUDE_CODE_OAUTH_TOKEN; si no, api si existe ANTHROPIC_API_KEY;
si no, suscripcion con la sesión de Claude Code de la máquina.

Los 2 backends usan el mismo prompt de sistema, el mismo prompt, el mismo esquema, el mismo modelo y effort="low".
"""
from __future__ import annotations

import json
import os
import time

BACKENDS = ("suscripcion", "api")
MAX_TOKENS = 16000   # sin streaming: ~16000 deja la respuesta dentro del tope de tiempo HTTP del SDK


class ErrorLLM(RuntimeError):
    """La llamada al modelo falló. El mensaje dice qué revisar."""


def backend() -> str:
    elegido = os.environ.get("TOKI_LLM", "").strip().lower().replace("ó", "o")
    if elegido:
        if elegido not in BACKENDS:
            raise ErrorLLM(f"TOKI_LLM={elegido!r} no existe: usa suscripcion o api")
        return elegido
    if os.environ.get("CLAUDE_CODE_OAUTH_TOKEN"):
        return "suscripcion"
    if os.environ.get("ANTHROPIC_API_KEY"):
        return "api"
    return "suscripcion"


async def consultar(sistema: str, prompt: str, esquema: dict, modelo: str,
                    effort: str = "low") -> tuple[dict | None, dict]:
    b = backend()
    llamar = _api if b == "api" else _suscripcion
    datos, meta = await llamar(sistema, prompt, esquema, modelo, effort)
    return datos, {"backend": b, **meta}


async def _suscripcion(sistema: str, prompt: str, esquema: dict, modelo: str, effort: str) -> tuple[dict | None, dict]:
    from claude_agent_sdk import ClaudeAgentOptions, ResultMessage, query

    opciones = ClaudeAgentOptions(
        system_prompt=sistema,
        model=modelo,
        tools=[],                    # sin herramientas integradas (Bash, archivos, web)
        allowed_tools=[],
        setting_sources=[],          # sin CLAUDE.md, hooks ni ajustes de la máquina
        strict_mcp_config=True,      # sin conectores externos
        max_turns=2,
        effort=effort,
        output_format={"type": "json_schema", "schema": esquema},
        env={"CLAUDE_CODE_DISABLE_AUTO_MEMORY": "1"},
    )
    datos, meta = None, {}
    async for msg in query(prompt=prompt, options=opciones):  # sin return adentro: el SDK cierra solo
        if isinstance(msg, ResultMessage):
            datos = msg.structured_output
            meta = {"subtype": msg.subtype, "duration_ms": msg.duration_ms, "num_turns": msg.num_turns,
                    "cost_usd_estimado": msg.total_cost_usd, "error": msg.is_error}
    return datos, meta


async def _api(sistema: str, prompt: str, esquema: dict, modelo: str, effort: str) -> tuple[dict | None, dict]:
    import anthropic

    t0 = time.monotonic()
    try:
        async with anthropic.AsyncAnthropic() as cliente:   # credencial: ANTHROPIC_API_KEY
            r = await cliente.messages.create(
                model=modelo,
                max_tokens=MAX_TOKENS,
                # El sistema es igual en cada llamada del mismo modo: se cachea. Con menos de 512 tokens
                # (mínimo de Sonnet 5.5) la API no lo guarda y no cobra la escritura.
                system=[{"type": "text", "text": sistema, "cache_control": {"type": "ephemeral"}}],
                messages=[{"role": "user", "content": prompt}],
                # Sin `thinking`: el modelo usa el pensamiento adaptativo, como Claude Code.
                output_config={"effort": effort, "format": {"type": "json_schema", "schema": esquema}},
            )
    except anthropic.AuthenticationError as e:
        raise ErrorLLM("api 401: falta ANTHROPIC_API_KEY o no es válida") from e
    except anthropic.PermissionDeniedError as e:
        raise ErrorLLM(f"api 403: la key no tiene permiso ({e.message})") from e
    except anthropic.NotFoundError as e:
        raise ErrorLLM(f"api 404: el modelo {modelo} no existe o la key no tiene acceso") from e
    except anthropic.RateLimitError as e:
        raise ErrorLLM(f"api 429: límite de uso o de gasto ({e.message})") from e
    except anthropic.APIStatusError as e:
        raise ErrorLLM(f"api {e.status_code}: {e.message}") from e
    except anthropic.APITimeoutError as e:
        raise ErrorLLM("api: pasó el tiempo de espera del SDK") from e
    except anthropic.APIConnectionError as e:
        raise ErrorLLM("api: sin conexión con la API de Anthropic") from e

    u = r.usage
    meta = {"subtype": "success" if r.stop_reason == "end_turn" else r.stop_reason,
            "duration_ms": int((time.monotonic() - t0) * 1000), "num_turns": 1, "cost_usd_estimado": None,
            "error": r.stop_reason != "end_turn",
            "uso": {"input_tokens": u.input_tokens, "output_tokens": u.output_tokens,
                    "cache_read_input_tokens": u.cache_read_input_tokens,
                    "cache_creation_input_tokens": u.cache_creation_input_tokens}}
    if r.stop_reason == "refusal" and r.stop_details:
        meta["rechazo"] = r.stop_details.category
    if r.stop_reason != "end_turn":   # refusal o max_tokens: el JSON no viene o viene cortado
        return None, meta
    texto = next((b.text for b in r.content if b.type == "text"), "")
    try:
        return json.loads(texto), meta
    except json.JSONDecodeError:
        meta["error"] = True
        return None, meta
