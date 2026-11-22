"""Etapa 4 de la capa determinista: revisa las opciones del modelo antes de mostrarlas."""
from __future__ import annotations

import re
import sqlite3

from . import filtros, store

MAX_PALABRAS = 15
# Palabras que la familia pidió no mostrar, con su reemplazo. "shi" (por "sí") viene del léxico del chat (m1).
REEMPLAZOS = {"shi": "sí"}


def limpiar(texto: str) -> str:
    """Cambia las palabras de REEMPLAZOS, con la mayúscula del original."""
    def cambio(m: re.Match) -> str:
        nuevo = REEMPLAZOS[m.group(0).lower()]
        return nuevo[:1].upper() + nuevo[1:] if m.group(0)[:1].isupper() else nuevo
    return re.sub(r"\b(" + "|".join(REEMPLAZOS) + r")\b", cambio, texto, flags=re.IGNORECASE)
N_OPCIONES = 4
NEUTRAL = {"text": "Después te respondo", "tone": "neutral", "emo": "seria", "fuentes": [], "origen": "regla"}
RELLENO = [
    {"text": "Sí", "tone": "directo", "emo": "seria", "fuentes": [], "origen": "regla"},
    {"text": "No", "tone": "directo", "emo": "seria", "fuentes": [], "origen": "regla"},
    {"text": "Déjame pensarlo", "tone": "tranquilo", "emo": "seria", "fuentes": [], "origen": "regla"},
    {"text": "Gracias", "tone": "cálido", "emo": "carinosa", "fuentes": [], "origen": "regla"},
    {"text": "Te quiero", "tone": "cálido", "emo": "carinosa", "fuentes": [], "origen": "regla"},
    {"text": "¿Me lo repites?", "tone": "pregunta", "emo": "seria", "fuentes": [], "origen": "regla"},
]


def validar(c: sqlite3.Connection, opciones: list[dict], persona: dict | None, n: int = N_OPCIONES,
            max_palabras: int = MAX_PALABRAS, neutral: bool = True,
            extra: set[str] | None = None) -> tuple[list[dict], list[dict]]:
    """Devuelve exactamente n opciones válidas (con neutral=True la última es "Después te respondo")
    y las descartadas con su motivo."""
    bloqueados = filtros.temas_bloqueados(store.limites(c), persona) | (extra or set())
    tms = store.temas(c)
    ok, fuera, vistos = [], [], set()
    for o in opciones or []:
        texto = limpiar(str(o.get("text", "")).strip())
        clave = store.norm(texto)
        if not texto:
            continue
        if clave in vistos:
            fuera.append({**o, "motivo": "repetida"})
        elif len(texto.split()) > max_palabras:
            fuera.append({**o, "motivo": f"más de {max_palabras} palabras"})
        elif filtros.temas_de_texto(texto, tms) & bloqueados:
            fuera.append({**o, "motivo": "toca un tema con límite para este interlocutor"})
        else:
            vistos.add(clave)
            ok.append({"text": texto, "tone": o.get("tone", ""), "emo": o.get("emo", "seria"),
                       "fuentes": list(o.get("fuentes", [])), "origen": o.get("origen", "agente")})
    cupo = n - 1 if neutral else n
    ok = ok[:cupo]
    for r in RELLENO:
        if len(ok) >= cupo:
            break
        if store.norm(r["text"]) not in vistos:
            ok.append(dict(r))
    if neutral:
        ok.append(dict(NEUTRAL))
    return ok, fuera
