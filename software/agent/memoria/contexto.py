"""Arma el contexto que recibe el agente para un evento.

Con 20 a 50 recuerdos no hace falta ranking: se manda todo lo visible,
ordenado por tipo, más los últimos 3 encuentros con el interlocutor.
"""
from __future__ import annotations

import sqlite3

from . import filtros, store

ORDEN = ("perfil", "rutina", "episodio", "estilo", "lexico")
N_ENCUENTROS = 3


def armar(c: sqlite3.Connection, persona: dict | None) -> dict:
    ok, fuera = filtros.visibles(c, persona)
    pid = persona["id"] if persona else None
    encuentros = sorted((m for m in ok if m["tipo"] == "episodio" and pid in m["personas"]),
                        key=lambda m: m["fecha"], reverse=True)[:N_ENCUENTROS]
    por_tipo = {t: [m for m in ok if m["tipo"] == t] for t in ORDEN}
    return {
        "usuaria": store.usuaria(c),
        "interlocutor": persona,
        "ultimos_encuentros": encuentros,
        "memorias": por_tipo,
        "bloqueados": sorted(filtros.temas_bloqueados(store.limites(c), persona)),
        "descartadas": [{"id": m["id"], "motivo": m["motivo"]} for m in fuera],
    }


def a_texto(ctx: dict) -> str:
    """Contexto legible para el prompt. Cada línea lleva su id como fuente: [m12]."""
    p = ctx["interlocutor"]
    quien = f"{p['nombre']} ({p['relacion']}, trato {p['trato']})" if p else "una persona desconocida"
    lineas = [f"Hablas como {ctx['usuaria']}. Te habla {quien}."]
    if ctx["ultimos_encuentros"]:
        lineas.append("Últimos encuentros con esta persona:")
        lineas += [f"- [m{m['id']}] {m['fecha']}: {m['texto']}" for m in ctx["ultimos_encuentros"]]
    titulos = {"perfil": "Perfil", "rutina": "Rutinas", "episodio": "Otros episodios",
               "estilo": "Frases propias (imita su estilo)", "lexico": "Palabras que usa"}
    vistos = {m["id"] for m in ctx["ultimos_encuentros"]}
    for t in ORDEN:
        ms = [m for m in ctx["memorias"][t] if m["id"] not in vistos]
        if ms:
            lineas.append(f"{titulos[t]}:")
            lineas += [f"- [m{m['id']}] {m['texto']}" + (f" ({m['hora']} {m['dias']})" if m["hora"] else "") for m in ms]
    return "\n".join(lineas)


def ultimo_encuentro(ctx: dict) -> str:
    """Una línea para la TV: 'Último encuentro: 2026-11-16 · Fueron al cine...'."""
    e = ctx["ultimos_encuentros"]
    return f"Último encuentro: {e[0]['fecha']} · {e[0]['texto']}" if e else ""
