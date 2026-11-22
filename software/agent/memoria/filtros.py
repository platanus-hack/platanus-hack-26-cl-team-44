"""Etapa 1 de la capa determinista: filtros duros, sin pesos.

Una memoria que no pasa un filtro no llega al modelo. Un deny gana siempre.
"""
from __future__ import annotations

import re
import sqlite3

from . import store

# Qué niveles de privacidad ve cada tipo de interlocutor.
VISIBLE = {
    "familia": ("publico", "familia", "salud"),
    "medico": ("publico", "salud"),
    "desconocido": ("publico",),
}


def _palabras(texto: str) -> list[tuple[str, bool]]:
    """(palabra normalizada, es nombre propio). Nombre propio = mayúscula que no abre una oración («Platanus»)."""
    out, inicio = [], True
    for m in re.finditer(r"[^\W_]+|[.!?¿¡]", texto):
        w = m.group(0)
        if w in ".!?¿¡":
            inicio = True
            continue
        out.append((re.sub(r"[^a-z0-9ñ]", "", store.norm(w)), w[0].isupper() and not inicio))
        inicio = False
    return out


def temas_de_texto(texto: str, temas: dict[str, list[str]]) -> set[str]:
    """Temas cuyas palabras aparecen en el texto: palabra completa, o comienzo de palabra («endocrin» → endocrinología).
    Un nombre propio solo calza completo: «plata» no marca «Platanus» como dinero, pero «Mounjaro» sí es salud."""
    t = re.sub(r"[^a-z0-9ñ ]", " ", store.norm(texto))
    palabras_txt = _palabras(texto)
    encontrados = set()
    for tema, palabras in temas.items():
        for w in palabras:
            if " " in w:
                hit = re.search(rf"\b{re.escape(w)}", t) is not None
            else:
                hit = any(p == w or (p.startswith(w) and not propio) for p, propio in palabras_txt)
            if hit:
                encontrados.add(tema)
                break
    return encontrados


def temas_bloqueados(limites: list[dict], persona: dict | None) -> set[str]:
    """Temas con deny para esta persona: por su id o por su tipo de interlocutor."""
    tipo = persona["tipo_interlocutor"] if persona else "desconocido"
    pid = persona["id"] if persona else None
    return {l["tema"] for l in limites
            if (l["persona_id"] and l["persona_id"] == pid) or (l["tipo_interlocutor"] and l["tipo_interlocutor"] == tipo)}


def visibles(c: sqlite3.Connection, persona: dict | None,
             extra: set[str] | None = None) -> tuple[list[dict], list[dict]]:
    """Memorias que puede usar el modelo con este interlocutor, y las descartadas con su motivo.

    extra: temas bloqueados adicionales (por ejemplo, los de otros miembros de un grupo)."""
    tipo = persona["tipo_interlocutor"] if persona else "desconocido"
    niveles = VISIBLE.get(tipo, VISIBLE["desconocido"])
    tms = store.temas(c)
    bloqueados = temas_bloqueados(store.limites(c), persona) | (extra or set())
    ok, fuera = [], []
    for m in store.memorias_aprobadas(c):
        m_temas = set(m["temas"]) | temas_de_texto(m["texto"], tms)
        if m["privacidad"] not in niveles:
            fuera.append({**m, "motivo": f"privacidad {m['privacidad']} no visible para {tipo}"})
        elif m_temas & bloqueados:
            fuera.append({**m, "motivo": f"límite: {', '.join(sorted(m_temas & bloqueados))}"})
        else:
            ok.append({**m, "temas": sorted(m_temas)})
    return ok, fuera


def bloqueados_de(c: sqlite3.Connection, persona_ids: list[str]) -> set[str]:
    """Unión de los temas bloqueados para varias personas (los miembros de un grupo)."""
    lim = store.limites(c)
    out: set[str] = set()
    for pid in persona_ids:
        p = store.persona(c, pid)
        if p:
            out |= temas_bloqueados(lim, p)
    return out
