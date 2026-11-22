"""Arma casos de eval reales desde un chat exportado de WhatsApp: lo que le dicen → lo que ella respondió.

    python3 software/agent/evals/desde_whatsapp.py data/chat.txt --yo "Emms" --otro "Juanito ✨" --persona juan \\
        --n 30 --salida data/evals_juan.jsonl

- Agrupa mensajes seguidos del mismo autor (menos de 3 min entre sí) en un turno.
- Un caso = un turno de la otra persona + la respuesta de ella en los 10 min siguientes, con los 4 turnos
  anteriores como contexto.
- Se queda con conversación: turnos cortos, sin enlaces, sin código y sin adjuntos; la respuesta de ella de 1 a 12 palabras.
- Elige --n casos repartidos en el tiempo y entre tipos de mensaje (preguntas primero). Semilla fija: reproducible.
- Los casos tienen datos reales: la salida va en data/, fuera de git.
"""

from __future__ import annotations

import argparse
import collections
import json
import random
import re
import statistics
import sys
from datetime import datetime
from pathlib import Path

AGENT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AGENT))

from memoria import importar  # noqa: E402

URL = re.compile(r"https?://|www\.|\.com\b|@\w", re.I)
CODIGO = re.compile(r"[<>{};=`]|\b(def|const|function|select|npm|git)\b", re.I)
SOLO_RISA = re.compile(r"^\W*(ja|je|ji|ha|xd|lol)+\W*$", re.I)
RUIDO = re.compile(r"message can.?t be displayed|mensaje no se puede mostrar|eliminaste este mensaje|se eliminó este mensaje", re.I)


def ts(m: dict) -> datetime:
    return datetime.fromisoformat(f"{m['fecha']}T{m['hora']}")


def turnos(msgs: list[dict], unir_min: float = 3) -> list[dict]:
    out = []
    for m in msgs:
        t = ts(m)
        if out and out[-1]["autor"] == m["autor"] and (t - out[-1]["fin"]).total_seconds() <= unir_min * 60:
            out[-1]["texto"] += "\n" + m["texto"]
            out[-1]["fin"] = t
        else:
            out.append({"autor": m["autor"], "texto": m["texto"], "ini": t, "fin": t})
    return out


def limpio(texto: str, max_pal: int) -> bool:
    return 1 <= len(texto.split()) <= max_pal and not URL.search(texto) and not CODIGO.search(texto)


def clase(texto: str) -> str:
    t = texto.lower()
    if "?" in t:
        return "pregunta"
    if re.search(r"\b(amor|te amo|te quiero|amorcito|mi vida|beso)\b", t):
        return "afecto"
    if re.search(r"\b(ya|llegu|voy|estoy|salgo|salí|listo|lista)\b", t):
        return "logistica"
    return "otro"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("chat")
    ap.add_argument("--yo", required=True, help="nombre de ella en el chat")
    ap.add_argument("--otro", required=True, help="nombre de la otra persona en el chat")
    ap.add_argument("--persona", required=True, help="id de esa persona en la memoria")
    ap.add_argument("--n", type=int, default=30)
    ap.add_argument("--salida", required=True)
    ap.add_argument("--semilla", type=int, default=7)
    a = ap.parse_args()

    msgs = [m for m in importar.leer(a.chat) if m["autor"] in (a.yo, a.otro)]
    ts_ = turnos(msgs)
    pares = []
    for i in range(1, len(ts_)):
        q, r = ts_[i - 1], ts_[i]
        if q["autor"] != a.otro or r["autor"] != a.yo:
            continue
        if (r["ini"] - q["fin"]).total_seconds() > 600:
            continue
        if not (limpio(q["texto"], 30) and limpio(r["texto"], 12)) or SOLO_RISA.match(r["texto"]) or RUIDO.search(q["texto"] + r["texto"]):
            continue
        ctx = [{"yo": x["autor"] == a.yo, "texto": x["texto"]} for x in ts_[max(0, i - 5):i - 1] if limpio(x["texto"], 40)]
        pares.append({"q": q, "r": r, "ctx": ctx, "clase": clase(q["texto"])})

    largos = [len(p["r"]["texto"].split()) for p in pares]
    clases = collections.Counter(p["clase"] for p in pares)
    print(f"{len(msgs)} mensajes · {len(ts_)} turnos · {len(pares)} pares limpios «{a.otro} → {a.yo}»")
    print(f"respuesta de ella: mediana {statistics.median(largos)} palabras · tipos de mensaje: {dict(clases)}")

    # Elegir: repartidos por mes y con más peso a preguntas (las que más necesitan contexto)
    random.seed(a.semilla)
    por_mes = collections.defaultdict(list)
    for p in pares:
        por_mes[p["q"]["ini"].strftime("%Y-%m")].append(p)
    elegidos, meses = [], sorted(por_mes)
    cuota = {"pregunta": 0.5, "logistica": 0.2, "afecto": 0.15, "otro": 0.15}
    for k, frac in cuota.items():
        candidatos = [p for p in pares if p["clase"] == k]
        random.shuffle(candidatos)
        candidatos.sort(key=lambda p: sum(1 for e in elegidos if e["q"]["ini"].strftime("%Y-%m") == p["q"]["ini"].strftime("%Y-%m")))
        elegidos += candidatos[:round(a.n * frac)]
    elegidos.sort(key=lambda p: p["q"]["ini"])
    with open(a.salida, "w", encoding="utf-8") as f:
        for j, p in enumerate(elegidos[:a.n]):
            f.write(json.dumps({
                "id": f"{a.persona}-{p['q']['ini']:%y%m%d}-{j}", "clase": p["clase"],
                "turnos": [{"persona": None if c["yo"] else a.persona, "yo": c["yo"], "texto": c["texto"]} for c in p["ctx"]]
                          + [{"persona": a.persona, "texto": p["q"]["texto"]}],
                "esperado": {"tipo": "familia", "memorias": [], "no_memorias": [], "aceptables": [p["r"]["texto"]], "prohibidas": []},
            }, ensure_ascii=False) + "\n")
    print(f"{min(a.n, len(elegidos))} casos en {a.salida} · meses: {meses[0]} a {meses[-1]}")


if __name__ == "__main__":
    main()
