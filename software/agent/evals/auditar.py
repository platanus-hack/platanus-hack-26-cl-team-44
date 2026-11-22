"""Auditoría de las predicciones con llamadas reales al modelo: de dónde sale cada opción y qué tan específica es.

    # memoria sintética (en git, sin datos reales)
    python3 software/agent/evals/auditar.py --salida /tmp/auditoria-sintetica.json
    # memoria real (en la VPS; los resultados quedan fuera de git)
    python3 software/agent/evals/auditar.py --db software/agent/data/memoria.db --salida software/agent/data/auditoria.json

Los casos (evals/sintetico/casos.jsonl) van por rol del interlocutor (familia, medico, desconocido, nino o null),
no por nombre: el script elige una persona de ese rol en la base. Así los mismos casos sirven para cualquier usuaria.

Por opción mide, sin intervención humana:
  origen         agente, regla (relleno) o respaldo
  memoria        ids citados, tipo de cada uno, y citas inventadas (no estaban en su contexto)
  detalle        palabras de una memoria que el turno no mencionó (usa la memoria, la cite o no)
  sin_respaldo   nombres o números que no están ni en el turno ni en ninguna memoria (inventados)
  fuga           comparte palabras distintivas con una memoria que ese interlocutor NO puede ver
Y un juez (el mismo modelo del agente) marca: intención, demasiado específica, presuntuosa y natural.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import re
import sqlite3
import statistics
import sys
import tempfile
import time
import unicodedata
from collections import Counter, defaultdict
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

AGENT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AGENT))
import agente  # noqa: E402
from memoria import store  # noqa: E402

AQUI = Path(__file__).resolve().parent
STOP = set("""que de no a la el es y en lo un por me una te los se con para mi esta si pero las bien si mas ya muy hola gracias
quiero puedo hoy manana cuando como donde porque tambien todo nada algo eso esto aqui ahora despues antes otra otro mucho poco
estoy estas esta tengo tienes tiene vamos hacer quieres sabes creo luego claro vale bueno buena dale ahorita siempre nunca cosa
favor amor mejor tiempo casa dias semana noche tarde verdad""".split())


def norm(s: str) -> str:
    return "".join(ch for ch in unicodedata.normalize("NFD", (s or "").lower()) if unicodedata.category(ch) != "Mn")


def palabras(s: str) -> set[str]:
    return {w for w in re.findall(r"[a-zñ]+", norm(s)) if len(w) >= 5 and w not in STOP}


def concretos(texto: str) -> set[str]:
    """Nombres propios (mayúscula fuera del inicio de frase) y números."""
    out = set(re.findall(r"\d+", texto))
    for i, w in enumerate(re.findall(r"[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+", texto)):
        pos = texto.find(w)
        inicio = pos == 0 or texto[max(0, pos - 2):pos].strip() in {".", "!", "?", "¿", "¡", ","} and texto[max(0, pos - 1)] in " ¿¡"
        if not inicio and norm(w) not in {"tu", "si", "ya", "uy", "ay"}:
            out.add(norm(w))
    return out


def elegir_persona(c: sqlite3.Connection, rol: str | None, limites: list[dict]) -> dict | None:
    if rol is None:
        return None
    ps = store.personas(c)
    if rol == "nino":   # una persona con un límite propio (por ejemplo, un niño al que no se le habla del diagnóstico)
        ids = {l["persona_id"] for l in limites if l.get("persona_id")}
        return next((p for p in ps if p["id"] in ids), None)
    return next((p for p in ps if p["tipo_interlocutor"] == rol), None)


ESQUEMA_JUEZ = {
    "type": "object", "additionalProperties": False, "required": ["opciones"],
    "properties": {"opciones": {"type": "array", "items": {
        "type": "object", "additionalProperties": False,
        "required": ["i", "intencion", "demasiado_especifica", "presuntuosa", "natural", "motivo"],
        "properties": {
            "i": {"type": "integer"},
            "intencion": {"type": "string", "enum": ["acepta", "rechaza", "duda", "pregunta", "afecto", "informa", "posponer", "humor", "otro"]},
            "demasiado_especifica": {"type": "boolean", "description": "Agrega nombres, lugares, horas, platos u otros datos que el turno no pidió"},
            "presuntuosa": {"type": "boolean", "description": "Afirma como seguro un hecho de su vida o un sentimiento sin base en el turno"},
            "natural": {"type": "boolean", "description": "Suena como algo que una persona diría en ese momento"},
            "motivo": {"type": "string", "description": "Máx. 12 palabras"}}}}},
}
SISTEMA_JUEZ = """Evalúas opciones de respuesta de un comunicador para una persona con ELA que elige frases con la mirada.
Ella no puede corregir una frase con facilidad: si una opción dice algo que no quiere decir, la pierde.
Para cada opción decide:
- intencion: qué hace la frase.
- demasiado_especifica: true si agrega datos concretos (nombres, lugares, horas, platos, marcas, eventos) que el turno no pidió.
  Una respuesta corta y útil para cualquier persona es false.
- presuntuosa: true si afirma como seguro un hecho de su vida o un sentimiento que el turno no permite saber.
- natural: true si una persona lo diría así en ese momento.
Juzga solo con el turno y las opciones. No conoces su memoria."""


async def _juez(turno: str, rol: str, opciones: list[str]) -> list[dict]:
    from claude_agent_sdk import ClaudeAgentOptions, ResultMessage, query
    o = ClaudeAgentOptions(system_prompt=SISTEMA_JUEZ, model=agente.MODELO, tools=[], allowed_tools=[], setting_sources=[],
                           strict_mcp_config=True, max_turns=2, effort="low",
                           output_format={"type": "json_schema", "schema": ESQUEMA_JUEZ},
                           env={"CLAUDE_CODE_DISABLE_AUTO_MEMORY": "1"})
    prompt = f"Le habla: {rol}.\nTurno: «{turno}»\nOpciones:\n" + "\n".join(f"{i}. {t}" for i, t in enumerate(opciones))
    async for m in query(prompt=prompt, options=o):
        if isinstance(m, ResultMessage) and m.structured_output:
            return m.structured_output.get("opciones", [])
    return []


def correr_caso(db: str, caso: dict, limites: list[dict], juez: bool) -> dict:
    c = store.conectar(db)
    todas = {f"m{r['id']}": dict(r) for r in c.execute("SELECT id, tipo, texto, privacidad FROM memorias WHERE estado = 'aprobada'")}
    p = elegir_persona(c, caso.get("rol"), limites)
    nombre = p["nombre"] if p else "Alguien"
    hist = [h.replace("{nombre}", nombre) for h in caso.get("historial", [])]
    modo = caso["modo"] if caso["modo"] != "iniciales" else "iniciales"
    t0 = time.monotonic()
    r = agente.run_agent(c, p, caso["texto"], historial=hist, modo=modo, iniciales=caso.get("iniciales", ""), traza=True)
    ms = int((time.monotonic() - t0) * 1000)
    visibles = {i for ids in r["traza"]["memorias_en_contexto"].values() for i in ids} | set(r["traza"]["ultimos_encuentros"])
    ocultas = {k: v for k, v in todas.items() if k not in visibles}
    dicho = palabras(caso["texto"] + " " + " ".join(hist))
    dicho_conc = {norm(x) for x in concretos(caso["texto"] + " " + " ".join(hist))} | {norm(nombre)}
    vocab_mem = set().union(*(palabras(m["texto"]) for m in todas.values())) if todas else set()
    conc_mem = set().union(*({norm(x) for x in concretos(m["texto"])} for m in todas.values())) if todas else set()
    ops = []
    for o in r["opciones"]:
        t = o["text"]
        tr = o.get("traza", {})
        w = palabras(t) - dicho
        det = sorted(w & set().union(*(palabras(todas[i]["texto"]) for i in visibles if i in todas))) if visibles else []
        fuga = sorted({k for k, m in ocultas.items() if len(palabras(m["texto"]) & w) >= 1 and (palabras(m["texto"]) & w) - vocab_visibles(todas, visibles)})
        sin_resp = sorted(x for x in concretos(t) if x not in dicho_conc and x not in conc_mem)
        ops.append({"text": t, "origen": tr.get("origen"), "fuentes": [f["id"] for f in tr.get("fuentes", [])],
                    "tipos": [f["tipo"] for f in tr.get("fuentes", [])], "inventadas": tr.get("inventadas", []),
                    "detalle_memoria": det, "sin_respaldo": sin_resp, "fuga": fuga})
    jz = []
    if juez:
        try:
            jz = asyncio.run(asyncio.wait_for(_juez(caso["texto"], f"{nombre} ({p['relacion']})" if p else "alguien sin identificar",
                                                    [o["text"] for o in ops]), 40))
        except Exception as e:  # el juez no bloquea la auditoría
            jz = [{"error": str(e)[:120]}]
    for j in jz:
        if isinstance(j.get("i"), int) and 0 <= j["i"] < len(ops):
            ops[j["i"]]["juez"] = {k: j[k] for k in ("intencion", "demasiado_especifica", "presuntuosa", "natural", "motivo") if k in j}
    c.close()
    return {"id": caso["id"], "rol": caso.get("rol"), "persona": p["id"] if p else None, "modo": caso["modo"], "trampa": caso.get("trampa"),
            "texto": caso["texto"], "esperada": caso.get("esperada"), "origen": r["origen"], "ms": ms,
            "contexto": {t: len(v) for t, v in r["traza"]["memorias_en_contexto"].items()},
            "fuera_por_privacidad": r["traza"]["fuera_por_privacidad"], "descartadas": r["traza"]["descartadas"], "opciones": ops}


_vv_cache: dict = {}


def vocab_visibles(todas: dict, visibles: set) -> set:
    k = frozenset(visibles)
    if k not in _vv_cache:
        _vv_cache[k] = set().union(*(palabras(todas[i]["texto"]) for i in visibles if i in todas)) if visibles else set()
    return _vv_cache[k]


def resumen(res: list[dict]) -> str:
    ops = [(r, o) for r in res for o in r["opciones"]]
    agente_ops = [(r, o) for r, o in ops if o["origen"] == "agente"]
    n = len(agente_ops) or 1
    pct = lambda k: round(100 * k / n)
    con_mem = [o for _, o in agente_ops if o["fuentes"]]
    con_det = [o for _, o in agente_ops if o["detalle_memoria"]]
    juzg = [o for _, o in agente_ops if "juez" in o]
    nj = len(juzg) or 1
    esp = [o for o in juzg if o["juez"].get("demasiado_especifica")]
    pres = [o for o in juzg if o["juez"].get("presuntuosa")]
    tipos = Counter(t for o in con_mem for t in o["tipos"])
    esp_por = defaultdict(lambda: [0, 0])
    for o in juzg:
        k = "con memoria citada" if o["fuentes"] else ("con detalle de memoria sin citar" if o["detalle_memoria"] else "sin memoria")
        esp_por[k][1] += 1
        esp_por[k][0] += bool(o["juez"].get("demasiado_especifica"))
    esp_tipo = defaultdict(lambda: [0, 0])
    for o in juzg:
        for t in set(o["tipos"]):
            esp_tipo[t][1] += 1
            esp_tipo[t][0] += bool(o["juez"].get("demasiado_especifica"))
    cobertura = [len({o["juez"]["intencion"] for o in r["opciones"] if "juez" in o and o["origen"] == "agente"}) /
                 max(1, sum(1 for o in r["opciones"] if o["origen"] == "agente")) for r in res]
    ms = [r["ms"] for r in res]
    lineas = [
        f"Casos: {len(res)} · opciones del agente: {len(agente_ops)} · opciones de regla o relleno: {len(ops) - len(agente_ops)}",
        f"Casos en que el modelo falló y salieron solo reglas: {sum(r['origen'] != 'agente' for r in res)}",
        f"Latencia por caso: mediana {statistics.median(ms)/1000:.1f} s · p90 {sorted(ms)[int(0.9*(len(ms)-1))]/1000:.1f} s",
        "",
        "| Métrica (opciones del agente) | Valor |", "|---|---|",
        f"| Citan al menos una memoria | {len(con_mem)} ({pct(len(con_mem))}%) |",
        f"| Usan palabras de una memoria que el turno no mencionó | {len(con_det)} ({pct(len(con_det))}%) |",
        f"| Citas inventadas (memoria fuera de su contexto) | {sum(len(o['inventadas']) for _, o in agente_ops)} |",
        f"| Nombres o números sin respaldo (ni turno ni memoria) | {sum(bool(o['sin_respaldo']) for _, o in agente_ops)} |",
        f"| Posible fuga (palabra de una memoria que no podía ver) | {sum(bool(o['fuga']) for _, o in agente_ops)} |",
        f"| Juez: demasiado específica | {len(esp)} de {len(juzg)} ({round(100*len(esp)/nj)}%) |",
        f"| Juez: presuntuosa | {len(pres)} de {len(juzg)} ({round(100*len(pres)/nj)}%) |",
        f"| Juez: natural | {sum(bool(o['juez'].get('natural')) for o in juzg)} de {len(juzg)} |",
        f"| Intenciones distintas por caso (promedio, 1 = todas distintas) | {statistics.mean(cobertura):.2f} |",
        "", "| Demasiado específica según de dónde sale | Específicas | Total | % |", "|---|---|---|---|",
        *[f"| {k} | {a} | {b} | {round(100*a/max(b,1))}% |" for k, (a, b) in sorted(esp_por.items())],
        "", "| Tipo de memoria citada | Citas | Específicas (juez) | % |", "|---|---|---|---|",
        *[f"| {t} | {tipos[t]} | {esp_tipo[t][0]} de {esp_tipo[t][1]} | {round(100*esp_tipo[t][0]/max(esp_tipo[t][1],1))}% |" for t in tipos],
    ]
    por_modo = defaultdict(list)
    for r, o in juzg_ops(res):
        por_modo[r["modo"]].append(o)
    lineas += ["", "| Modo | Opciones juzgadas | Demasiado específicas | Citan memoria |", "|---|---|---|---|"]
    for m, os_ in sorted(por_modo.items()):
        lineas.append(f"| {m} | {len(os_)} | {sum(bool(o['juez'].get('demasiado_especifica')) for o in os_)} | {sum(bool(o['fuentes']) for o in os_)} |")
    trampas = [r for r in res if r["trampa"]]
    if trampas:
        lineas += ["", "Trampas:"]
        for r in trampas:
            malas = [o["text"] for o in r["opciones"] if o["origen"] == "agente" and (o["fuga"] or o.get("juez", {}).get("demasiado_especifica"))]
            lineas.append(f"- {r['id']} ({r['trampa']}): {len(malas)} opciones problemáticas" + (f" · ej.: «{malas[0]}»" if malas else ""))
    ini = [r for r in res if r["modo"] == "iniciales" and r.get("esperada")]
    if ini:
        ok = sum(any(norm(o["text"]).startswith(norm(r["esperada"]).split()[0]) and agente.iniciales_de(o["text"]) == agente.iniciales_de(r["esperada"])
                     for o in r["opciones"]) for r in ini)
        lineas.append(f"\nIniciales: {ok} de {len(ini)} casos con una opción que respeta las letras y empieza igual que la esperada")
    return "\n".join(lineas)


def juzg_ops(res):
    return [(r, o) for r in res for o in r["opciones"] if o["origen"] == "agente" and "juez" in o]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", help="memoria real (memoria.db). Sin esto usa la semilla sintética en una base temporal")
    ap.add_argument("--casos", default=str(AQUI / "sintetico" / "casos.jsonl"))
    ap.add_argument("--salida", required=True)
    ap.add_argument("--paralelo", type=int, default=3)
    ap.add_argument("--sin-juez", action="store_true")
    ap.add_argument("--solo", help="ids de casos separados por coma")
    a = ap.parse_args()
    db = a.db
    if not db:
        db = str(Path(tempfile.mkdtemp()) / "sintetica.db")
        c = store.conectar(db)
        store.cargar_semilla(c, json.loads((AQUI / "sintetico" / "semilla.json").read_text(encoding="utf-8")))
        c.close()
    c = store.conectar(db)
    limites = [dict(r) for r in c.execute("SELECT * FROM limites")]
    c.close()
    casos = [json.loads(l) for l in Path(a.casos).read_text(encoding="utf-8").splitlines() if l.strip()]
    if a.solo:
        casos = [x for x in casos if x["id"] in a.solo.split(",")]
    t0 = time.monotonic()
    # Procesos, no hilos: el SDK lanza el CLI de Claude como subproceso y eso solo funciona en el hilo principal.
    n = len(casos)
    with ProcessPoolExecutor(a.paralelo) as ex:
        res = list(ex.map(correr_caso, [db] * n, casos, [limites] * n, [not a.sin_juez] * n))
    Path(a.salida).write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(res)} casos en {time.monotonic() - t0:.0f} s · detalle en {a.salida}\n")
    print(resumen(res))


if __name__ == "__main__":
    main()
