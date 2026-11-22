"""Disparadores de grupo y contexto de grupos.

Un disparador dice: "cuando mencionen a la usuaria en este grupo, prepara respuestas".
Lo crea el cuidador y queda en estado "pendiente" hasta que la usuaria lo aprueba en la TV.

Solo los grupos con un disparador "activo" se procesan. De esos grupos se guardan los
últimos 30 mensajes en memoria (nunca en disco) para darle contexto al agente.
"""
from __future__ import annotations

import json
import sqlite3
import threading
import time
from collections import deque
from pathlib import Path
from typing import Callable

from memoria import filtros, store

N_CONTEXTO = 30
ESTADOS = ("pendiente", "activo", "pausado")

_lock = threading.Lock()
_contexto: dict[str, deque] = {}
_vistos: deque = deque(maxlen=500)


class Disparadores:
    """Lista de disparadores guardada en un JSON local (fuera de git)."""

    def __init__(self, path: Path):
        self.path = path

    def listar(self) -> list[dict]:
        if not self.path.exists():
            return []
        return json.loads(self.path.read_text(encoding="utf-8")).get("disparadores", [])

    def _guardar(self, ds: list[dict]) -> None:
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps({"disparadores": ds}, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(self.path)

    def cambiar_estado(self, did: str, estado: str) -> dict:
        if estado not in ESTADOS:
            raise ValueError(f"estado inválido: {estado}")
        with _lock:
            ds = self.listar()
            d = next((x for x in ds if x["id"] == did), None)
            if not d:
                raise KeyError(did)
            d["estado"] = estado
            d["actualizado_en"] = time.strftime("%Y-%m-%dT%H:%M:%S")
            self._guardar(ds)
            return d

    def activo_para(self, grupo_jid: str) -> dict | None:
        return next((d for d in self.listar()
                     if d.get("tipo") == "mencion_grupo" and d.get("grupo_jid") == grupo_jid and d.get("estado") == "activo"), None)

    def pendiente_para(self, grupo_jid: str) -> dict | None:
        return next((d for d in self.listar() if d.get("grupo_jid") == grupo_jid and d.get("estado") == "pendiente"), None)


def contexto_de(grupo_jid: str) -> list[str]:
    with _lock:
        return list(_contexto.get(grupo_jid, []))


def procesar(c: sqlite3.Connection, ev: dict, disparadores: Disparadores,
             ejecutar: Callable[..., dict]) -> dict:
    """Procesa un mensaje de grupo.

    ev: {id, grupo_jid, grupo_nombre, autor_tel | persona, autor_nombre, texto, menciona}
    Devuelve {accion: "ignorar" | "repetido" | "guardado" | "mencion", ...}.
    """
    gid = ev.get("grupo_jid", "")
    d = disparadores.activo_para(gid)
    if not d:
        motivo = "disparador pendiente de aprobación" if disparadores.pendiente_para(gid) else "grupo sin disparador activo"
        return {"accion": "ignorar", "motivo": motivo}
    mid = ev.get("id")
    with _lock:
        if mid and mid in _vistos:
            return {"accion": "repetido"}
        if mid:
            _vistos.append(mid)

    autor = store.persona(c, ev["persona"]) if ev.get("persona") else store.persona_por_telefono(c, ev.get("autor_tel", ""))
    nombre = autor["nombre"] if autor else (ev.get("autor_nombre") or "Alguien")
    texto = str(ev.get("texto", "")).strip()
    with _lock:
        hist = _contexto.setdefault(gid, deque(maxlen=N_CONTEXTO))
        previos = list(hist)
        hist.append(f"{nombre}: {texto}")
    if not ev.get("menciona"):
        return {"accion": "guardado", "en_contexto": len(previos) + 1}

    # En un grupo todos leen la respuesta: privacidad de la audiencia del grupo
    # y límites del autor más los de los miembros que el cuidador declaró (por ejemplo, un nieto).
    interlocutor = dict(autor) if autor else {"id": None, "nombre": nombre, "relacion": "", "trato": "tú"}
    interlocutor["tipo_interlocutor"] = d.get("audiencia", "familia")
    extra = filtros.bloqueados_de(c, d.get("miembros", []))
    r = ejecutar(c, interlocutor, texto, historial=previos, modo="mencion", extra=extra)
    return {"accion": "mencion", "disparador": d["id"], "grupo_jid": gid,
            "grupo_nombre": ev.get("grupo_nombre") or d.get("grupo_nombre", ""),
            "autor": nombre, "texto": texto, **r}
