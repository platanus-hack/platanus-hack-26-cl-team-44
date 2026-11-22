"""Tarjetas por tema, ordenadas según quién habla.

Dos capas:
  catalogo/temas.json      tarjetas generales (en git), iguales para toda usuaria, sin nombres
  data/tarjetas.json       tarjetas propias de la usuaria (fuera de git, en la VPS); un id igual reemplaza a la general
                           {"tarjetas": [{"id", "tema", "texto", "personas"?: [id], "privacidad"?: publico|salud|familia}]}
  data/tarjetas_uso.jsonl  qué tarjeta eligió y con quién (aprende el orden)

Sin modelo de lenguaje: el tema sale de palabras clave del interlocutor, así las tarjetas aparecen al instante,
antes que las respuestas de Claude.

Orden de una tarjeta (más alto primero):
  tema           10 por el tema principal, 5 por el segundo (según lo que dijo el interlocutor)
  palabras       +2 por cada palabra de la tarjeta que dijo el interlocutor en su último turno («espalda»)
  persona        +6 si la tarjeta es para quien habló último, +3 si es para alguien presente
  aprendizaje    +3·log(1+veces elegida con esa persona) +1·log(1+veces elegida en total)   (data/tarjetas_uso.jsonl)
Filtro: privacidad visible para el interlocutor efectivo y solo_para, igual que la memoria (memoria/filtros.py).
"""

from __future__ import annotations

import json
import math
import unicodedata
from collections import Counter
from pathlib import Path

AGENT = Path(__file__).resolve().parent
CATALOGO = AGENT / "catalogo" / "temas.json"
USUARIA = AGENT / "data" / "tarjetas.json"
USO = AGENT / "data" / "tarjetas_uso.jsonl"
N_TARJETAS = 6


def _norm(s: str) -> str:
    s = unicodedata.normalize("NFD", str(s or "").lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return "".join(c if c.isalnum() else " " for c in s)


def _leer(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, ValueError):
        return {}


def cargar(path_usuario: Path) -> tuple[dict[str, dict], dict[str, dict]]:
    """Devuelve (temas por id, tarjetas por id) con la capa del usuario encima del catálogo."""
    temas, cards = {}, {}
    for t in _leer(CATALOGO).get("temas") or []:
        temas[t["id"]] = {"id": t["id"], "nombre": t.get("nombre", t["id"]), "peso": float(t.get("peso", 1.0)),
                          "palabras": [_norm(w).strip() for w in t.get("palabras") or []]}
        for c in t.get("tarjetas") or []:
            cards[c["id"]] = {**c, "tema": t["id"], "origen": "catalogo"}
    for c in _leer(path_usuario).get("tarjetas") or []:
        if not c.get("id") or not c.get("texto"):
            continue
        tema = c.get("tema") or (cards.get(c["id"]) or {}).get("tema") or ""
        if tema and tema not in temas:   # un tema nuevo del usuario
            temas[tema] = {"id": tema, "nombre": c.get("tema_nombre") or tema, "peso": 1.0,
                           "palabras": [_norm(w).strip() for w in c.get("palabras") or []]}
        cards[c["id"]] = {"privacidad": "familia", **c, "tema": tema, "origen": "usuario"}
    return temas, cards


def detectar_temas(turns: list[dict], temas: dict[str, dict]) -> list[tuple[str, float]]:
    """Temas de lo que dijo el interlocutor: el último turno pesa 1, los 2 anteriores 0,5."""
    otros = [t for t in turns if t.get("speaker") != "me"][-3:]
    puntaje: Counter = Counter()
    for peso, t in zip([0.5] * (len(otros) - 1) + [1.0], otros):
        toks = _norm(t.get("text", "")).split()
        texto = " " + " ".join(toks) + " "
        for tid, tema in temas.items():
            for w in tema["palabras"]:
                if not w:
                    continue
                if " " in w:
                    hit = f" {w} " in texto
                elif len(w) >= 5:
                    hit = any(tok.startswith(w) for tok in toks)
                else:
                    hit = w in toks
                if hit:
                    puntaje[tid] += peso * tema.get("peso", 1.0)
    return [(tid, round(s, 2)) for tid, s in puntaje.most_common(2) if s > 0]


def aceptaciones(log_path: Path) -> tuple[Counter, Counter]:
    """(veces por tarjeta, veces por (tarjeta, persona)) desde data/tarjetas_uso.jsonl."""
    total, por_persona = Counter(), Counter()
    if not log_path.exists():
        return total, por_persona
    for line in log_path.read_text(encoding="utf-8").splitlines():
        try:
            r = json.loads(line)
        except ValueError:
            continue
        if not r.get("tarjeta_id"):
            continue
        total[r["tarjeta_id"]] += 1
        if r.get("persona"):
            por_persona[(r["tarjeta_id"], r["persona"])] += 1
    return total, por_persona


def ordenar(turns: list[dict], partner: str, visible: set, path_usuario: Path, log_path: Path,
            presentes: list[str], ultima: str | None, excluir: list[str] | None = None, n: int = N_TARJETAS) -> dict:
    temas, cards = cargar(path_usuario)
    detectados = detectar_temas(turns, temas)
    peso_tema = {tid: w for (tid, _), w in zip(detectados, (10, 5))}
    total, por_persona = aceptaciones(log_path)
    fuera = {_norm(x).strip() for x in (excluir or [])}
    ultimo = next((t.get("text", "") for t in reversed(turns) if t.get("speaker") != "me"), "")
    dichas = {w[:5] for w in _norm(ultimo).split() if len(w) >= 4}
    presentes_set = set(presentes)

    out = []
    for c in cards.values():
        if c.get("privacidad", "publico") not in visible:
            continue
        if c.get("solo_para") and partner not in c["solo_para"]:
            continue
        if _norm(c["texto"]).strip() in fuera:
            continue
        personas = set(c.get("personas") or [])
        s, motivos = float(peso_tema.get(c["tema"], 0)), []
        if peso_tema.get(c["tema"]):
            motivos.append(f"tema {temas[c['tema']]['nombre'].lower()}")
        comunes = {w[:5] for w in _norm(c["texto"]).split() if len(w) >= 4} & dichas
        if comunes and s > 0:
            s += 2 * len(comunes); motivos.append("usa palabras de lo que dijo")
        if ultima and ultima in personas:
            s += 6; motivos.append("para quien habla")
        elif personas & presentes_set:
            s += 3; motivos.append("para alguien presente")
        if personas and not (personas & presentes_set):
            continue   # una tarjeta para Sofía no sale si Sofía no está en la conversación
        ap = por_persona.get((c["id"], ultima), 0) if ultima else 0
        if ap:
            s += 3 * math.log1p(ap); motivos.append(f"elegida {ap} {'vez' if ap == 1 else 'veces'} con esta persona")
        if total.get(c["id"]):
            s += math.log1p(total[c["id"]])
        if s > 0:
            out.append({"id": c["id"], "texto": c["texto"], "tema": c["tema"], "origen": c["origen"],
                        "score": round(s, 2), "motivo": ", ".join(motivos)})
    out.sort(key=lambda x: (-x["score"], x["id"]))
    principal = detectados[0][0] if detectados else None
    return {"tema": {"id": principal, "nombre": temas[principal]["nombre"]} if principal else None,
            "temas": [{"id": t, "nombre": temas[t]["nombre"], "peso": w} for t, w in detectados],
            "tarjetas": out[:n]}


def registrar_uso(tarjeta_id: str, tema: str, persona: str | None, log_path: Path = USO) -> None:
    """Una línea por tarjeta dicha: id, tema y persona (id local). Sin texto de la conversación."""
    import time
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps({"ts": time.strftime("%Y-%m-%dT%H:%M:%S"), "tarjeta_id": tarjeta_id[:80],
                            "tema": tema[:40], "persona": (persona or "")[:40] or None}, ensure_ascii=False) + "\n")
