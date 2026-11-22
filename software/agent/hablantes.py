"""Quién habla en la sala y qué privacidad resulta (escucha con diarización).

La TV escucha con ElevenLabs Scribe v3 Live, que separa las voces. Cada turno trae la persona asignada a esa
voz (un acompañante la elige en la TV) o null si nadie la identificó todavía. Con eso:
  - la privacidad es la del que ve menos de los que hablan (memoria/filtros.py VISIBLE);
  - una voz sin identificar cuenta como desconocido;
  - la persona del agente es la última que habló (trato, encuentros), con el tipo efectivo.
"""

from __future__ import annotations

from memoria import store
from memoria.filtros import VISIBLE


def audiencia(c, body: dict, p: dict | None) -> tuple[dict | None, str]:
    """Devuelve (persona para el agente, tipo efectivo). Sin body.hablantes, no cambia nada."""
    hab = body.get("hablantes")
    if not isinstance(hab, list) or not hab:
        return p, (p or {}).get("tipo_interlocutor") or "desconocido"
    tipos = []
    for h in hab[:12]:
        q = store.persona(c, str(h)) if h else None
        t = (q or {}).get("tipo_interlocutor")
        tipos.append(t if t in VISIBLE else "desconocido")
    efectivo = min(tipos, key=lambda t: len(VISIBLE[t]))
    if p is None:
        return None, efectivo
    if len(VISIBLE[efectivo]) < len(VISIBLE.get(p.get("tipo_interlocutor"), ())):
        p = {**p, "tipo_interlocutor": efectivo}
    return p, efectivo


def persona_escucha(c, body: dict, resolver) -> dict | None:
    """Con hablantes, la persona es solo la indicada: no se adivina por nombres en el texto
    (que alguien nombre a otro no lo vuelve esa persona). Sin hablantes, se usa el resolver de siempre."""
    if isinstance(body.get("hablantes"), list):
        return store.persona(c, str(body["persona"])) if body.get("persona") else None
    return resolver(c, body)
