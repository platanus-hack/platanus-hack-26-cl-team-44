"""Etapa 4 de la capa determinista: revisa las opciones del modelo antes de mostrarlas."""
from __future__ import annotations

import sqlite3

from . import filtros, store

MAX_PALABRAS = 15
N_OPCIONES = 4
NEUTRAL = {"text": "Después te respondo", "tone": "neutral", "emo": "seria", "fuentes": [], "origen": "regla"}
RELLENO = [
    {"text": "Sí", "tone": "directo", "emo": "seria", "fuentes": [], "origen": "regla"},
    {"text": "No", "tone": "directo", "emo": "seria", "fuentes": [], "origen": "regla"},
    {"text": "Déjame pensarlo", "tone": "tranquilo", "emo": "seria", "fuentes": [], "origen": "regla"},
]


def validar(c: sqlite3.Connection, opciones: list[dict], persona: dict | None) -> tuple[list[dict], list[dict]]:
    """Devuelve exactamente 4 opciones válidas (la última es neutral) y las descartadas con motivo."""
    bloqueados = filtros.temas_bloqueados(store.limites(c), persona)
    tms = store.temas(c)
    ok, fuera, vistos = [], [], set()
    for o in opciones or []:
        texto = str(o.get("text", "")).strip()
        clave = store.norm(texto)
        if not texto:
            continue
        if clave in vistos:
            fuera.append({**o, "motivo": "repetida"})
        elif len(texto.split()) > MAX_PALABRAS:
            fuera.append({**o, "motivo": f"más de {MAX_PALABRAS} palabras"})
        elif filtros.temas_de_texto(texto, tms) & bloqueados:
            fuera.append({**o, "motivo": "toca un tema con límite para este interlocutor"})
        else:
            vistos.add(clave)
            ok.append({"text": texto, "tone": o.get("tone", ""), "emo": o.get("emo", "seria"),
                       "fuentes": list(o.get("fuentes", [])), "origen": o.get("origen", "agente")})
    ok = ok[:N_OPCIONES - 1]
    for r in RELLENO:
        if len(ok) >= N_OPCIONES - 1:
            break
        if store.norm(r["text"]) not in vistos:
            ok.append(dict(r))
    ok.append(dict(NEUTRAL))
    return ok, fuera
