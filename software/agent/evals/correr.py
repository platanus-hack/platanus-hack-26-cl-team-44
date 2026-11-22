"""Evals de la conversación en la sala: quién habla → memorias → plantillas → opciones del agente.

    python3 software/agent/evals/correr.py                       # dry run: capas 1-3, sin modelo y sin costo
    python3 software/agent/evals/correr.py --agente              # también la capa 4 (llama al agente: usa la suscripción)
    python3 software/agent/evals/correr.py --casos data/evals.jsonl --db data/memoria.db --tarjetas data/tarjetas.json
                                                                 # casos, memoria y tarjetas reales

Cada caso (JSONL):
  {"id", "turnos": [{"persona": id | null, "texto"}],              null = voz sin identificar
   "esperado": {"tipo": familia|medico|desconocido, "memorias": [fragmentos que deben estar en el contexto],
                "no_memorias": [fragmentos que no deben verse], "tema": id o "", "aceptables": [respuestas buenas],
                "prohibidas": [palabras que nunca deben salir]}}

Capas:
  1 privacidad   el tipo efectivo según quién habla (hablantes.audiencia) es el esperado
  2 memorias     recall de las memorias esperadas en el contexto (con la compuerta de relevancia, como el agente)
                 y 0 memorias prohibidas visibles
  3 plantillas   el tema es el esperado y una respuesta aceptable está entre las 4 tarjetas visibles
  4 agente       un juez (el modelo del agente) decide si alguna opción tiene la misma intención que una aceptable; ninguna dice algo prohibido
  5 iniciales    con las iniciales de la primera aceptable, el agente (modo iniciales) propone algo que dice lo mismo
Los casos reales (con memorias de la usuaria) van en data/, fuera de git.
"""

from __future__ import annotations

import argparse
import os
import difflib
import json
import sys
import time
import unicodedata
from pathlib import Path

AGENT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AGENT))

import hablantes  # noqa: E402
import tarjetas  # noqa: E402
from memoria import contexto, store  # noqa: E402
from memoria.filtros import VISIBLE  # noqa: E402

PRECIO = {"in": 2.0, "out": 10.0}   # claude-sonnet-5-5, US$ por millón de tokens (TOKI_MODELO por defecto)
JUEZ = os.environ.get("TOKI_JUEZ", os.environ.get("TOKI_MODELO", "claude-sonnet-5-5"))   # sin Haiku: dio malos resultados como juez
JUEZ_ESQUEMA = {"type": "object", "additionalProperties": False, "required": ["calza", "cual", "contenido"],
                "properties": {"calza": {"type": "boolean"}, "cual": {"type": "integer"}, "contenido": {"type": "boolean"}}}


def juzgar(pregunta: str, opciones: list[str], aceptables: list[str]) -> tuple[bool, int, bool]:
    """¿Alguna opción tiene la misma intención que alguna respuesta aceptable? No exige los mismos datos: exigirlos premiaba
    las opciones específicas (auditoría con llamadas reales). Devuelve (misma intención, índice, mismo contenido):
    el contenido es solo informativo (casos reales: cuánto se acerca al dato que ella dio), no cuenta como acierto."""
    import asyncio

    from claude_agent_sdk import ClaudeAgentOptions, ResultMessage, query
    if not opciones:
        return False, -1, False
    prompt = (f"Le dijeron: «{pregunta}»\nRespuestas aceptables (cualquiera sirve):\n" + "\n".join(f"- {a}" for a in aceptables)
              + "\n\nOpciones propuestas:\n" + "\n".join(f"{i}. {o}" for i, o in enumerate(opciones))
              + "\n\n¿Alguna opción tiene la misma intención que alguna aceptable? No hace falta que traiga los mismos datos; el estilo puede cambiar. "
              "calza = true o false; cual = índice de la mejor (o -1). "
              "Aparte, solo como dato: contenido = true si alguna además trae los mismos datos.")
    op = ClaudeAgentOptions(model=JUEZ, tools=[], allowed_tools=[], setting_sources=[], strict_mcp_config=True, max_turns=2,
                            effort="low", output_format={"type": "json_schema", "schema": JUEZ_ESQUEMA},
                            env={"CLAUDE_CODE_DISABLE_AUTO_MEMORY": "1"},
                            system_prompt="Eres un evaluador estricto y breve. Respondes solo con el JSON pedido.")

    async def correr():
        async for m in query(prompt=prompt, options=op):
            if isinstance(m, ResultMessage):
                return m.structured_output or {}
        return {}
    r = asyncio.run(correr())
    return bool(r.get("calza")), int(r.get("cual", -1)), bool(r.get("calza")) and bool(r.get("contenido"))


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", str(s).lower())
    return " ".join("".join(c if c.isalnum() else " " for c in s if not unicodedata.combining(c)).split())


def parecido(a: str, b: str) -> float:
    return difflib.SequenceMatcher(None, norm(a).split(), norm(b).split()).ratio()


def textos_contexto(ctx: dict) -> str:
    partes = [m["texto"] for ms in ctx["memorias"].values() for m in ms]
    partes += [m["texto"] for m in ctx.get("ultimos_encuentros") or []]
    return norm(" ".join(partes))


def evaluar(c, caso: dict, con_agente: bool, path_tarjetas: Path = Path("/nonexistent")) -> dict:
    esp = caso["esperado"]
    turnos = caso["turnos"]
    ult = turnos[-1]
    otros = [t for t in turnos if not t.get("yo")]   # «yo» = mensajes de ella en el contexto (casos reales de un chat)
    body = {"texto": ult["texto"], "persona": ult["persona"], "hablantes": [t["persona"] for t in otros]}
    p, tipo = hablantes.audiencia(c, body, hablantes.persona_escucha(c, body, lambda *_: None))
    r = {"id": caso["id"], "tipo": tipo, "ok_tipo": tipo == esp["tipo"]}

    yo = store.usuaria(c)
    hist = [f"{yo if x.get('yo') else (x['persona'] or 'Alguien')}: {x['texto']}" for x in turnos[:-1]]
    ctx = contexto.armar(c, p, texto=ult["texto"], historial=hist)   # como el agente: con la compuerta de relevancia
    vis = textos_contexto(ctx)
    hits = [m for m in esp["memorias"] if norm(m) in vis]
    fugas = [m for m in esp["no_memorias"] if norm(m) in vis]
    r.update(recall=f"{len(hits)}/{len(esp['memorias'])}" if esp["memorias"] else "-",
             ok_mem=len(hits) == len(esp["memorias"]), fugas=fugas)

    t = tarjetas.ordenar([{"speaker": "me" if x.get("yo") else "partner", "text": x["texto"]} for x in turnos], tipo, set(VISIBLE[tipo]),
                         path_tarjetas, Path("/nonexistent"), [x["persona"] for x in otros if x["persona"]],
                         (p or {}).get("id"))
    tema = (t["tema"] or {}).get("id") or ""
    top4 = [x["texto"] for x in t["tarjetas"][:4]]
    mejor = max((parecido(a, x) for a in esp["aceptables"] for x in top4), default=0)
    r.update(tema=tema, ok_tema=(tema == esp["tema"]) if "tema" in esp else None, tarjeta_ok=mejor >= 0.6, top4=top4)
    if con_agente and top4:   # con el juez: ¿alguna de las 4 tarjetas visibles dice lo mismo que una aceptable?
        r["tarjeta_ok"], _, r["tarjeta_contenido"] = juzgar(ult["texto"], top4, esp["aceptables"])

    if con_agente:
        from agente import iniciales_de, run_agent
        t0 = time.monotonic()
        res = run_agent(c, p, ult["texto"], historial=hist, modo="voz")
        ops = [o["text"] for o in res.get("opciones") or []]
        calza, cual, contenido = juzgar(ult["texto"], ops, esp["aceptables"])
        malas = sorted({w for w in esp["prohibidas"] for o in ops if norm(w) in norm(o)})
        r.update(agente_ok=calza, agente_contenido=contenido, agente_fuga=malas, opciones=ops, elegida=ops[cual] if 0 <= cual < len(ops) else "",
                 s=round(time.monotonic() - t0, 1), origen=res.get("origen"))
        ini = iniciales_de(esp["aceptables"][0])
        ri = run_agent(c, p, ult["texto"], historial=hist, modo="iniciales", iniciales=ini)
        ops_i = [o["text"] for o in ri.get("opciones") or []]
        calza_i, cual_i, contenido_i = juzgar(ult["texto"], ops_i, esp["aceptables"])
        r.update(ini=ini, ini_ok=calza_i, ini_contenido=contenido_i, ini_exactas=sum(iniciales_de(o) == ini for o in ops_i),
                 ini_elegida=ops_i[cual_i] if 0 <= cual_i < len(ops_i) else (ops_i[0] if ops_i else ""))
    else:
        tokens_in = 800 + len(json.dumps(ctx, ensure_ascii=False)) // 3   # sistema + contexto, aprox.
        r.update(agente="(dry run: no llama)", tokens_in_aprox=tokens_in,
                 usd_aprox=round(tokens_in * PRECIO["in"] / 1e6 + 400 * PRECIO["out"] / 1e6, 4))
    return r


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--casos", default=str(AGENT / "evals" / "casos.ejemplo.jsonl"))
    ap.add_argument("--db", default="", help="memoria SQLite (por defecto, la semilla de ejemplo en memoria)")
    ap.add_argument("--agente", action="store_true", help="también las capas 4 y 5 (llama al agente y al juez)")
    ap.add_argument("--tarjetas", default="", help="tarjetas propias de la usuaria (data/tarjetas.json)")
    ap.add_argument("--salida", default="", help="guarda el detalle en JSON")
    a = ap.parse_args()
    if a.db:
        c = store.conectar(a.db)
    else:
        c = store.conectar(":memory:")
        store.cargar_semilla(c, json.loads((AGENT / "ejemplos" / "semilla.example.json").read_text(encoding="utf-8")))
    casos = [json.loads(l) for l in Path(a.casos).read_text(encoding="utf-8").splitlines() if l.strip()]
    pt = Path(a.tarjetas) if a.tarjetas else Path("/nonexistent")
    res = []
    for x in casos:
        res.append(evaluar(c, x, a.agente, pt))
        if a.agente:
            print(f"  · {x['id']} listo", flush=True)

    print(f"{'caso':26} {'1 privacidad':14} {'2 memorias':12} {'fugas':6} {'3 tema':14} {'tarjeta':8} {'4 agente':10} {'5 iniciales':12}")
    for r in res:
        ag = ("✓" if r.get("agente_ok") else "✗") + (" FUGA" if r.get("agente_fuga") else "") if "agente_ok" in r else f"~US${r['usd_aprox']}"
        ini = (("✓ " if r.get("ini_ok") else "✗ ") + r.get("ini", "")) if "ini_ok" in r else "-"
        print(f"{r['id']:26} {('✓ ' if r['ok_tipo'] else '✗ ') + r['tipo']:14} {('✓ ' if r['ok_mem'] else '✗ ') + r['recall']:12} "
              f"{len(r['fugas']):<6} {('· ' if r['ok_tema'] is None else '✓ ' if r['ok_tema'] else '✗ ') + (r['tema'] or 'ninguno'):14} {'✓' if r['tarjeta_ok'] else '✗':8} {ag:10} {ini:12}")
    n = len(res)
    print(f"\nTotal: privacidad {sum(r['ok_tipo'] for r in res)}/{n} · memorias {sum(r['ok_mem'] for r in res)}/{n} · "
          f"fugas {sum(len(r['fugas']) for r in res)} · tema {sum(bool(r['ok_tema']) for r in res)}/{sum(r['ok_tema'] is not None for r in res)} · "
          f"tarjeta aceptable en las 4 {sum(r['tarjeta_ok'] for r in res)}/{n}")
    if a.agente:
        print(f"Agente: dice lo esperado {sum(r['agente_ok'] for r in res)}/{n} · fugas en opciones {sum(bool(r['agente_fuga']) for r in res)} · "
              f"primera letra {sum(r['ini_ok'] for r in res)}/{n} · s por respuesta {sum(r['s'] for r in res) / n:.1f}")
        print(f"  (solo informativo, mismos datos que la aceptable: plantillas {sum(r.get('tarjeta_contenido', False) for r in res)}/{n} · "
              f"agente {sum(r['agente_contenido'] for r in res)}/{n} · primera letra {sum(r['ini_contenido'] for r in res)}/{n})")
    if a.salida:
        Path(a.salida).write_text(json.dumps(res, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    if not a.agente:
        print(f"Capa 4 (agente) sin correr. Costo estimado: ~US${sum(r['usd_aprox'] for r in res):.2f} con la API, "
              f"o {n} llamadas de la suscripción (tope diario TOKI_MAX_DIA en la VPS).")
    for r in res:
        if not (r["ok_tipo"] and r["ok_mem"] and not r["fugas"] and r["ok_tema"] is not False) and not a.agente:
            print(f"  · {r['id']}: tipo {r['tipo']}, recall {r['recall']}, fugas {r['fugas'] or 'ninguna'}, tema {r['tema'] or 'ninguno'}, "
                  f"tarjetas {r['top4'][:2]}")


if __name__ == "__main__":
    main()
