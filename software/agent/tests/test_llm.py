"""llm.py: qué backend se elige y qué devuelve cada backend. Sin red, sin modelo y sin keys reales.

    python3 -m unittest discover software/agent/tests

El backend api se prueba con el SDK `anthropic` real y un transporte HTTP falso (httpx2.MockTransport).
Sin el paquete `anthropic` instalado, esas pruebas se saltan.
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
import types
import unittest
from pathlib import Path
from unittest import mock

AGENT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AGENT))

import agente  # noqa: E402
import llm  # noqa: E402
from memoria import store  # noqa: E402

try:
    import anthropic
    import httpx2
except ImportError:
    anthropic = None

ESQUEMA = {"type": "object", "additionalProperties": False, "required": ["query"],
           "properties": {"query": {"type": "string"}}}
MODELO = "claude-sonnet-5-5"
KEY_FALSA = "sk-ant-prueba-falsa"
CREDENCIALES = ("TOKI_LLM", "CLAUDE_CODE_OAUTH_TOKEN", "ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN")


def entorno(**variables):
    """El entorno de la prueba, sin las credenciales de la máquina."""
    base = {k: v for k, v in os.environ.items() if k not in CREDENCIALES}
    return mock.patch.dict(os.environ, {**base, **variables}, clear=True)


class BackendTest(unittest.TestCase):
    def test_sin_credenciales_usa_la_sesion_de_la_maquina(self):
        with entorno():
            self.assertEqual(llm.backend(), "suscripcion")

    def test_token_de_suscripcion(self):
        with entorno(CLAUDE_CODE_OAUTH_TOKEN="x"):
            self.assertEqual(llm.backend(), "suscripcion")

    def test_solo_api_key(self):
        with entorno(ANTHROPIC_API_KEY="x"):
            self.assertEqual(llm.backend(), "api")

    def test_con_las_dos_gana_la_suscripcion(self):
        # Así las instalaciones de hoy (agente.env con CLAUDE_CODE_OAUTH_TOKEN) siguen igual
        with entorno(CLAUDE_CODE_OAUTH_TOKEN="x", ANTHROPIC_API_KEY="y"):
            self.assertEqual(llm.backend(), "suscripcion")

    def test_toki_llm_manda(self):
        with entorno(TOKI_LLM="api", CLAUDE_CODE_OAUTH_TOKEN="x"):
            self.assertEqual(llm.backend(), "api")
        with entorno(TOKI_LLM="suscripcion", ANTHROPIC_API_KEY="y"):
            self.assertEqual(llm.backend(), "suscripcion")
        with entorno(TOKI_LLM=" Suscripción "):
            self.assertEqual(llm.backend(), "suscripcion")

    def test_toki_llm_desconocido_es_error(self):
        with entorno(TOKI_LLM="otro"), self.assertRaises(llm.ErrorLLM):
            llm.backend()


class _Opciones:
    def __init__(self, **kw):
        self.kw = kw


class _Resultado:
    def __init__(self, **kw):
        self.__dict__.update(kw)


def sdk_falso(mensajes: list, vistos: list) -> types.SimpleNamespace:
    """Un claude_agent_sdk de mentira: guarda el pedido y devuelve los mensajes dados."""
    async def query(prompt, options):
        vistos.append((prompt, options))
        for m in mensajes:
            yield m
    return types.SimpleNamespace(ClaudeAgentOptions=_Opciones, ResultMessage=_Resultado, query=query)


class SuscripcionTest(unittest.TestCase):
    def consultar(self, mensajes):
        vistos = []
        with entorno(CLAUDE_CODE_OAUTH_TOKEN="x"), mock.patch.dict(sys.modules, {"claude_agent_sdk": sdk_falso(mensajes, vistos)}):
            r = asyncio.run(llm.consultar("Eres Myo.", "hola", ESQUEMA, MODELO))
        return r, vistos

    def test_mismas_opciones_que_antes(self):
        resultado = _Resultado(structured_output={"query": "pizza"}, subtype="success", duration_ms=812, num_turns=1,
                               total_cost_usd=0.01, is_error=False)
        (datos, meta), vistos = self.consultar([object(), resultado])
        self.assertEqual(datos, {"query": "pizza"})
        self.assertEqual(meta, {"backend": "suscripcion", "subtype": "success", "duration_ms": 812, "num_turns": 1,
                                "cost_usd_estimado": 0.01, "error": False})
        prompt, opciones = vistos[0]
        self.assertEqual(prompt, "hola")
        self.assertEqual(opciones.kw, {
            "system_prompt": "Eres Myo.", "model": MODELO, "tools": [], "allowed_tools": [], "setting_sources": [],
            "strict_mcp_config": True, "max_turns": 2, "effort": "low",
            "output_format": {"type": "json_schema", "schema": ESQUEMA},
            "env": {"CLAUDE_CODE_DISABLE_AUTO_MEMORY": "1"},
        })

    def test_sin_resultado_devuelve_none(self):
        (datos, meta), _ = self.consultar([])
        self.assertIsNone(datos)
        self.assertEqual(meta, {"backend": "suscripcion"})


def mensaje(stop_reason="end_turn", texto='{"query": "pizza"}', stop_details=None) -> dict:
    content = [{"type": "thinking", "thinking": "", "signature": "firma"}]
    if texto is not None:
        content.append({"type": "text", "text": texto})
    return {"id": "msg_prueba", "type": "message", "role": "assistant", "model": MODELO, "content": content,
            "stop_reason": stop_reason, "stop_sequence": None, "stop_details": stop_details,
            "usage": {"input_tokens": 40, "output_tokens": 12, "cache_read_input_tokens": 700,
                      "cache_creation_input_tokens": 0}}


@unittest.skipUnless(anthropic, "falta el paquete anthropic")
class ApiTest(unittest.TestCase):
    def consultar(self, responder):
        pedidos = []

        def transporte(request):
            pedidos.append(request)
            return responder(request)

        real = anthropic.AsyncAnthropic

        def cliente(**kw):   # key falsa y transporte falso: nada sale a la red
            return real(api_key=KEY_FALSA, max_retries=0,
                        http_client=anthropic.DefaultAsyncHttpxClient(transport=httpx2.MockTransport(transporte)), **kw)

        with entorno(ANTHROPIC_API_KEY=KEY_FALSA), mock.patch.object(anthropic, "AsyncAnthropic", side_effect=cliente):
            r = asyncio.run(llm.consultar("Eres Myo.", "hola", ESQUEMA, MODELO))
        return r, pedidos

    def test_mismo_pedido_y_misma_forma_de_respuesta(self):
        (datos, meta), pedidos = self.consultar(lambda req: httpx2.Response(200, json=mensaje()))
        self.assertEqual(datos, {"query": "pizza"})
        self.assertEqual(meta["backend"], "api")
        self.assertEqual(meta["subtype"], "success")
        self.assertFalse(meta["error"])
        self.assertIsInstance(meta["duration_ms"], int)
        self.assertEqual(meta["uso"]["cache_read_input_tokens"], 700)
        self.assertEqual(len(pedidos), 1)
        self.assertEqual(pedidos[0].url.path, "/v1/messages")
        cuerpo = json.loads(pedidos[0].content)
        self.assertEqual(cuerpo["model"], MODELO)
        self.assertEqual(cuerpo["max_tokens"], llm.MAX_TOKENS)
        self.assertEqual(cuerpo["system"], [{"type": "text", "text": "Eres Myo.", "cache_control": {"type": "ephemeral"}}])
        self.assertEqual(cuerpo["messages"], [{"role": "user", "content": "hola"}])
        self.assertEqual(cuerpo["output_config"], {"effort": "low", "format": {"type": "json_schema", "schema": ESQUEMA}})
        for campo in ("tools", "temperature", "thinking"):
            self.assertNotIn(campo, cuerpo)

    def test_rechazo_devuelve_none(self):
        detalles = {"type": "refusal", "category": "general_harms", "explanation": "prueba"}
        (datos, meta), _ = self.consultar(lambda req: httpx2.Response(
            200, json=mensaje("refusal", texto=None, stop_details=detalles)))
        self.assertIsNone(datos)
        self.assertTrue(meta["error"])
        self.assertEqual(meta["subtype"], "refusal")
        self.assertEqual(meta["rechazo"], "general_harms")

    def test_json_cortado_devuelve_none(self):
        (datos, meta), _ = self.consultar(lambda req: httpx2.Response(200, json=mensaje("max_tokens", '{"query": "piz')))
        self.assertIsNone(datos)
        self.assertEqual(meta["subtype"], "max_tokens")
        (datos, meta), _ = self.consultar(lambda req: httpx2.Response(200, json=mensaje(texto="no es json")))
        self.assertIsNone(datos)
        self.assertTrue(meta["error"])

    def test_errores_http_dicen_que_revisar(self):
        casos = {401: ("authentication_error", "401"), 404: ("not_found_error", MODELO),
                 429: ("rate_limit_error", "429"), 500: ("api_error", "api 500")}
        for estado, (tipo, esperado) in casos.items():
            cuerpo = {"type": "error", "error": {"type": tipo, "message": "prueba"}}
            with self.subTest(estado=estado), self.assertRaises(llm.ErrorLLM) as e:
                self.consultar(lambda req, c=cuerpo, s=estado: httpx2.Response(s, json=c))
            self.assertIn(esperado, str(e.exception))

    def test_sin_conexion(self):
        def caido(req):
            raise httpx2.ConnectError("sin red", request=req)
        with self.assertRaises(llm.ErrorLLM) as e:
            self.consultar(caido)
        self.assertIn("sin conexión", str(e.exception))


class AgenteUsaLlmTest(unittest.TestCase):
    """El agente sigue igual: con datos usa el modelo y con un error del modelo usa reglas."""

    def setUp(self):
        semilla = json.loads((AGENT / "ejemplos" / "semilla.example.json").read_text(encoding="utf-8"))
        self.c = store.conectar(":memory:")
        store.cargar_semilla(self.c, semilla)

    def test_con_datos_del_modelo(self):
        datos = {"resumen": "Te invitan", "opciones": [
            {"text": "Sí, vamos", "tone": "", "emo": "alegre", "fuentes": []},
            {"text": "Mejor otro día", "tone": "", "emo": "seria", "fuentes": []},
            {"text": "¿A qué hora?", "tone": "", "emo": "entusiasta", "fuentes": []},
            {"text": "Gracias por avisar", "tone": "", "emo": "carinosa", "fuentes": []}]}

        async def falso(*_a, **_k):
            return datos, {"backend": "api", "duration_ms": 5, "error": False}
        with mock.patch.object(llm, "consultar", side_effect=falso) as consultar:
            r = agente.run_agent(self.c, None, "¿Vamos al cine?", modo="voz")
        self.assertEqual(r["origen"], "agente")
        self.assertEqual(r["resumen"], "Te invitan")
        self.assertEqual(consultar.call_args.args[3], agente.MODELO)

    def test_error_del_modelo_usa_reglas(self):
        async def falla(*_a, **_k):
            raise llm.ErrorLLM("api 401: falta ANTHROPIC_API_KEY o no es válida")
        with mock.patch.object(llm, "consultar", side_effect=falla):
            r = agente.run_agent(self.c, None, "¿Vamos al cine?", modo="voz")
        self.assertEqual(r["origen"], "reglas")
        self.assertIn("ErrorLLM: api 401", r["meta"]["error"])
        self.assertTrue(r["opciones"])


if __name__ == "__main__":
    unittest.main()
