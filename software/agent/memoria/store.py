"""Acceso a la base SQLite de la memoria."""
from __future__ import annotations

import json
import re
import sqlite3
import unicodedata
from pathlib import Path

SCHEMA = Path(__file__).with_name("schema.sql")


def norm(texto: str) -> str:
    """Minúscula y sin tildes."""
    t = unicodedata.normalize("NFKD", texto or "")
    return "".join(c for c in t if not unicodedata.combining(c)).lower()


def conectar(path: str | Path) -> sqlite3.Connection:
    c = sqlite3.connect(str(path))
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA foreign_keys = ON")
    c.executescript(SCHEMA.read_text(encoding="utf-8"))
    return c


def _fila(r: sqlite3.Row) -> dict:
    d = dict(r)
    for k in ("apodos", "personas", "temas", "palabras"):
        if k in d and isinstance(d[k], str):
            d[k] = json.loads(d[k] or "[]")
    return d


def cargar_semilla(c: sqlite3.Connection, semilla: dict) -> dict:
    """Reemplaza el contenido de la base con la semilla. Devuelve los conteos."""
    with c:
        for t in ("limites", "memorias", "temas", "personas", "meta"):
            c.execute(f"DELETE FROM {t}")
        for clave, defecto in (("usuaria", "la usuaria"), ("variante", "español latino neutro, con tuteo"), ("genero", "femenino")):
            c.execute("INSERT INTO meta (clave, valor) VALUES (?, ?)", (clave, semilla.get(clave, defecto)))
        # Ajustes propios de cada usuaria (por ejemplo pedido_para, pedido_ocasion): datos, no código.
        for clave, valor in (semilla.get("ajustes") or {}).items():
            c.execute("INSERT OR REPLACE INTO meta (clave, valor) VALUES (?, ?)", (str(clave), str(valor)))
        for p in semilla.get("personas", []):
            c.execute(
                "INSERT INTO personas (id, nombre, relacion, apodos, tipo_interlocutor, telefono, trato) VALUES (?,?,?,?,?,?,?)",
                (p["id"], p["nombre"], p.get("relacion", ""), json.dumps(p.get("apodos", []), ensure_ascii=False),
                 p.get("tipo_interlocutor", "desconocido"), p.get("telefono", ""), p.get("trato", "tú")))
        for tema, palabras in semilla.get("temas", {}).items():
            c.execute("INSERT INTO temas (tema, palabras) VALUES (?,?)",
                      (tema, json.dumps([norm(w) for w in palabras], ensure_ascii=False)))
        for m in semilla.get("memorias", []):
            c.execute(
                "INSERT INTO memorias (tipo, subtipo, texto, personas, temas, privacidad, estado, fecha, hora, dias, fuente)"
                " VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                (m["tipo"], m.get("subtipo", ""), m["texto"], json.dumps(m.get("personas", [])),
                 json.dumps(m.get("temas", [])), m.get("privacidad", "familia"), m.get("estado", "aprobada"),
                 m.get("fecha", ""), m.get("hora", ""), m.get("dias", ""), m.get("fuente", "onboarding")))
        for l in semilla.get("limites", []):
            c.execute("INSERT INTO limites (persona_id, tipo_interlocutor, tema, motivo) VALUES (?,?,?,?)",
                      (l.get("persona_id"), l.get("tipo_interlocutor"), l["tema"], l.get("motivo", "")))
    return {t: c.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0] for t in ("personas", "memorias", "limites", "temas")}


def personas(c: sqlite3.Connection) -> list[dict]:
    return [_fila(r) for r in c.execute("SELECT * FROM personas ORDER BY id")]


def persona(c: sqlite3.Connection, pid: str) -> dict | None:
    r = c.execute("SELECT * FROM personas WHERE id = ?", (pid,)).fetchone()
    return _fila(r) if r else None


def persona_por_telefono(c: sqlite3.Connection, telefono: str) -> dict | None:
    dig = re.sub(r"\D", "", telefono or "")
    if not dig:
        return None
    for p in personas(c):
        if p["telefono"] and re.sub(r"\D", "", p["telefono"]) == dig:
            return p
    return None


def detectar_personas(c: sqlite3.Connection, texto: str) -> list[str]:
    """Ids de personas nombradas en el texto, por nombre o apodo (palabra completa)."""
    t = f" {norm(texto)} "
    t = re.sub(r"[^a-z0-9ñ ]", " ", t)
    out = []
    for p in personas(c):
        nombres = [p["nombre"].split()[0]] + p["apodos"]
        if any(re.search(rf"\b{re.escape(norm(n))}\b", t) for n in nombres if n):
            out.append(p["id"])
    return out


def memorias_aprobadas(c: sqlite3.Connection) -> list[dict]:
    return [_fila(r) for r in c.execute("SELECT * FROM memorias WHERE estado = 'aprobada' ORDER BY id")]


def temas(c: sqlite3.Connection) -> dict[str, list[str]]:
    return {r["tema"]: json.loads(r["palabras"]) for r in c.execute("SELECT * FROM temas")}


def limites(c: sqlite3.Connection) -> list[dict]:
    return [dict(r) for r in c.execute("SELECT * FROM limites")]


def meta(c: sqlite3.Connection, clave: str, defecto: str = "") -> str:
    r = c.execute("SELECT valor FROM meta WHERE clave = ?", (clave,)).fetchone()
    return r["valor"] if r else defecto


def usuaria(c: sqlite3.Connection) -> str:
    return meta(c, "usuaria", "la usuaria")
