"""Pedido proactivo: con la memoria, el agente propone qué pedir por Rappi para una ocasión.

    plan(c, para, ocasion="una ocasión especial", presupuesto=None)

Para quién y la ocasión vienen del pedido o de los ajustes de la memoria (meta pedido_para, pedido_ocasion).
    → {mensaje, query, preferir, evitar, presupuesto, nota, fuentes, origen, meta}

El código arma el contexto con la memoria visible para esa persona (mismos filtros de privacidad).
El modelo solo elige qué buscar. La búsqueda, el carrito y el pago los hace otra pieza:
apps-bridge busca y arma el carrito; el pago lo hace una persona en su celular.
"""
from __future__ import annotations

import asyncio
import os
import re
import sqlite3
import time

from memoria import contexto, store

MODELO = os.environ.get("TOKI_MODELO", "claude-sonnet-5-5")
TOPE_S = float(os.environ.get("TOKI_AGENTE_TOPE_S", "20"))

ESQUEMA = {
    "type": "object", "additionalProperties": False,
    "required": ["mensaje", "query", "preferir", "evitar", "presupuesto", "nota", "fuentes"],
    "properties": {
        "mensaje": {"type": "string", "description": "Frase corta para la usuaria: qué propones y por qué (máx. 20 palabras)"},
        "query": {"type": "string", "description": "Texto para buscar en Rappi: restaurante o plato (máx. 4 palabras)"},
        "preferir": {"type": "array", "items": {"type": "string"}, "description": "Palabras del producto preferido, en minúscula"},
        "evitar": {"type": "array", "items": {"type": "string"}, "description": "Palabras de productos a evitar, en minúscula"},
        "presupuesto": {"type": "integer", "description": "Tope en pesos de la moneda local; 0 si la memoria no dice"},
        "nota": {"type": "string", "description": "Mensaje corto para acompañar el pedido, en primera persona (máx. 12 palabras)"},
        "fuentes": {"type": "array", "items": {"type": "string"}, "description": "ids de memoria usados, por ejemplo m9"},
    },
}


def _sistema(c: sqlite3.Connection) -> str:
    return f"""Ayudas a {store.usuaria(c)}, una persona con ELA que se comunica eligiendo con la mirada.
Ella quiere pedir algo por Rappi para otra persona, en una ocasión especial. Tú propones qué buscar.

Reglas:
- Usa solo datos del contexto. Si un dato dice qué le gusta a esa persona, búscalo primero.
- Pon en "fuentes" los ids de memoria que usaste (por ejemplo "m9").
- "query" es lo que se escribe en el buscador de Rappi: el nombre del restaurante o del plato.
- "mensaje" va para {store.usuaria(c)}, en español y en segunda persona, con el dato que lo justifica.
- "nota" la firma ella, en primera persona, con su estilo.
- Si el contexto no trae un gusto claro, propone algo general para compartir y dilo en "mensaje"."""


def _limpio(s: str, n: int) -> str:
    return re.sub(r"\s+", " ", str(s or "")).strip()[:n]


async def _consultar(sistema: str, prompt: str) -> tuple[dict | None, dict]:
    from claude_agent_sdk import ClaudeAgentOptions, ResultMessage, query

    opciones = ClaudeAgentOptions(
        system_prompt=sistema, model=MODELO, tools=[], allowed_tools=[], setting_sources=[],
        strict_mcp_config=True, max_turns=2, effort="low",
        output_format={"type": "json_schema", "schema": ESQUEMA},
        env={"CLAUDE_CODE_DISABLE_AUTO_MEMORY": "1"},
    )
    datos, meta = None, {}
    async for msg in query(prompt=prompt, options=opciones):
        if isinstance(msg, ResultMessage):
            datos, meta = msg.structured_output, {"duration_ms": msg.duration_ms, "error": msg.is_error}
    return datos, meta


def plan(c: sqlite3.Connection, para: str, ocasion: str = "una ocasión especial",
         presupuesto: int | None = None) -> dict:
    persona = store.persona(c, para)
    if not persona:
        raise ValueError(f"no conozco a '{para}'")
    ctx = contexto.armar(c, persona)
    prompt = (contexto.a_texto(ctx)
              + f"\n\nOcasión: {_limpio(ocasion, 60)}. El pedido es para {persona['nombre']} ({persona['relacion']})."
              + (f"\nPresupuesto máximo: {int(presupuesto)} pesos." if presupuesto else ""))
    t0 = time.monotonic()
    datos, meta, origen = None, {}, "agente"
    try:
        datos, meta = asyncio.run(asyncio.wait_for(_consultar(_sistema(c), prompt), TOPE_S))
    except asyncio.TimeoutError:
        meta = {"error": f"pasó el tope de {TOPE_S:.0f} s"}
    except Exception as e:  # el demo sigue: la TV muestra las categorías de siempre
        meta = {"error": f"{type(e).__name__}: {e}"[:300]}
    if not datos or not _limpio(datos.get("query"), 40):
        origen, datos = "reglas", {"mensaje": f"No encontré un gusto de {persona['nombre']} en la memoria. Elige una categoría.",
                                   "query": "", "preferir": [], "evitar": [], "presupuesto": 0, "nota": "", "fuentes": []}
    tope = int(presupuesto or datos.get("presupuesto") or 0)
    meta["ms_total"] = int((time.monotonic() - t0) * 1000)
    return {
        "para": persona["id"], "para_nombre": persona["nombre"], "ocasion": _limpio(ocasion, 60),
        "mensaje": _limpio(datos["mensaje"], 160), "query": _limpio(datos["query"], 40),
        "preferir": [_limpio(w, 30).lower() for w in datos.get("preferir", [])][:5],
        "evitar": [_limpio(w, 30).lower() for w in datos.get("evitar", [])][:5],
        "presupuesto": max(tope, 0), "nota": _limpio(datos.get("nota"), 100),
        "fuentes": [f for f in datos.get("fuentes", []) if re.fullmatch(r"m\d+", str(f))][:5],
        "origen": origen, "meta": meta,
    }
