"""Arma el contexto que recibe el agente para un evento.

Dos capas, en orden:
1. Privacidad (filtros.visibles): qué puede ver este interlocutor.
2. Compuerta de relevancia (solo si se pasa el mensaje): un hecho (perfil, rutina, episodio) entra solo si el
   mensaje o los últimos turnos nombran a su persona, su tema o una palabra suya (un lugar, un nombre). Si nada
   aplica, no entra ningún hecho: con todo el contexto, el modelo mete datos en respuestas donde no vienen al caso
   (auditoría con llamadas reales: 64% de las opciones que citaban perfil eran demasiado específicas).
El estilo y el léxico no entran como frases para copiar: se resumen en un perfil de tono (largo, muletillas, risa).
Sin mensaje (pedido de Rappi, generar tarjetas) se manda todo lo visible, como antes.
"""
from __future__ import annotations

import re
import sqlite3
import unicodedata
from collections import Counter
from pathlib import Path

from . import filtros, store

ORDEN = ("perfil", "rutina", "episodio")          # hechos: pasan por la compuerta
TONO = ("estilo", "lexico")                       # tono: se resume, no se cita
N_ENCUENTROS = 3
VENTANA = 2                                       # turnos anteriores que también cuentan para la compuerta
GENERICOS = {"saludo", "despedida"}               # temas que no bastan para que entre un hecho
# Temas del catálogo que también cuentan como otro más amplio (el campo "temas" de una memoria usa los amplios).
AMPLIOS = {"dolor": {"salud"}, "postura": {"salud"}, "bano": {"salud"}, "descanso": {"salud"}, "bebida": {"comida"}}
STOP = set("""que de no la el es en lo un por me una te los se con para mi esta si pero las bien mas ya muy hola gracias
quiero puedo hoy cuando como donde porque tambien todo nada algo eso esto aqui ahora despues antes otra otro mucho poco
estoy estas tengo tienes tiene vamos hacer quieres sabes creo luego claro bueno buena siempre nunca cosa favor mejor tiempo
casa dias semana noche tarde verdad hiciste estas quieres puedes tienes viene vienes fuiste ellas ellos usted ustedes
amor mama papa esto contigo conmigo nosotros gusta gustan gusto encanta encantan quiere prefiere""".split())
_CATALOGO = Path(__file__).resolve().parents[1] / "catalogo" / "temas.json"
_temas_cache: dict | None = None


def _norm(s: str) -> str:
    s = unicodedata.normalize("NFD", (s or "").lower())
    return "".join(ch for ch in s if unicodedata.category(ch) != "Mn")


def _raices(texto: str) -> set[str]:
    """Raíces (5 letras) de las palabras con contenido: 'perro'/'perrito' → 'perro', 'Corral' → 'corra'."""
    return {w[:5] for w in re.findall(r"[a-zñ]+", _norm(texto)) if len(w) >= 5 and w not in STOP}


def _temas() -> dict:
    global _temas_cache
    if _temas_cache is None:
        import json
        d = json.loads(_CATALOGO.read_text(encoding="utf-8"))
        _temas_cache = {t["id"]: [_norm(w).strip() for w in t.get("palabras") or [] if w] for t in d.get("temas", [])}
    return _temas_cache


def temas_de(texto: str) -> set[str]:
    """Temas del catálogo que nombra un texto (mismas reglas que tarjetas.detectar_temas)."""
    toks = re.findall(r"[a-zñ0-9]+", _norm(texto))
    plano = " " + " ".join(toks) + " "
    out = set()
    for tid, palabras in _temas().items():
        for w in palabras:
            if (" " in w and f" {w} " in plano) or (len(w) >= 5 and any(t.startswith(w) for t in toks)) or w in toks:
                out.add(tid)
                break
    return out


def compuerta(c: sqlite3.Connection, hechos: list[dict], texto: str, historial: list[str] | None) -> tuple[list[dict], dict]:
    """Devuelve (hechos que pasan, {id: motivo}). Motivos: persona nombrada, tema común o palabra común."""
    ventana = " ".join([texto] + [h.split(":", 1)[-1] for h in (historial or [])[-VENTANA:]])
    nombradas = set(store.detectar_personas(c, ventana))
    temas_turno = temas_de(ventana) - GENERICOS
    temas_turno |= {a for t in temas_turno for a in AMPLIOS.get(t, ())}
    raices_turno = _raices(ventana)
    pasan, motivos = [], {}
    for m in hechos:
        motivo = ""
        if nombradas & set(m.get("personas") or []):
            motivo = "nombra a " + ", ".join(sorted(nombradas & set(m["personas"])))
        elif temas_turno & (temas_de(m["texto"]) | set(m.get("temas") or [])):
            motivo = "tema " + ", ".join(sorted(temas_turno & (temas_de(m["texto"]) | set(m.get("temas") or []))))
        elif raices_turno & _raices(m["texto"]):
            motivo = "palabra " + ", ".join(sorted(raices_turno & _raices(m["texto"]))[:3])
        if motivo:
            pasan.append(m)
            motivos[m["id"]] = motivo
    return pasan, motivos


def perfil_tono(estilo: list[dict], lexico: list[dict], pid: str | None) -> dict:
    """Resume el estilo en rasgos de tono. Una frase con dueño (campo personas) solo cuenta para esa persona."""
    frases = [m["texto"] for m in estilo if not m.get("personas") or (pid and pid in m["personas"])]
    largos = [len(f.split()) for f in frases]
    inicios = Counter(_norm(f).split()[0].strip("¡¿,.!?") for f in frases if f.split())
    return {
        "ids": [m["id"] for m in estilo if m["texto"] in frases] + [m["id"] for m in lexico],
        "palabras": [l["texto"] for l in lexico][:3],
        "largo": round(sum(largos) / len(largos)) if largos else 0,
        "inicios": [w for w, n in inicios.most_common(4) if n >= 2],
    }


def armar(c: sqlite3.Connection, persona: dict | None, extra: set[str] | None = None,
          texto: str | None = None, historial: list[str] | None = None) -> dict:
    ok, fuera = filtros.visibles(c, persona, extra)
    pid = persona["id"] if persona else None
    hechos = [m for m in ok if m["tipo"] in ORDEN]
    motivos: dict = {}
    if texto is not None:
        hechos, motivos = compuerta(c, hechos, texto, historial)
    encuentros = sorted((m for m in hechos if m["tipo"] == "episodio" and pid in m["personas"]),
                        key=lambda m: m["fecha"], reverse=True)[:N_ENCUENTROS]
    return {
        "usuaria": store.usuaria(c),
        "interlocutor": persona,
        "ultimos_encuentros": encuentros,
        "memorias": {t: [m for m in hechos if m["tipo"] == t] for t in ORDEN},
        "tono": perfil_tono([m for m in ok if m["tipo"] == "estilo"], [m for m in ok if m["tipo"] == "lexico"], pid),
        "compuerta": {"activa": texto is not None, "pasan": {f"m{k}": v for k, v in motivos.items()},
                      "fuera": sum(1 for m in ok if m["tipo"] in ORDEN) - len(hechos)},
        "visibles": [f"m{m['id']}" for m in ok],
        "bloqueados": sorted(filtros.temas_bloqueados(store.limites(c), persona) | (extra or set())),
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
    titulos = {"perfil": "Datos que vienen al caso", "rutina": "Rutinas que vienen al caso", "episodio": "Episodios que vienen al caso"}
    vistos = {m["id"] for m in ctx["ultimos_encuentros"]}
    for t in ORDEN:
        ms = [m for m in ctx["memorias"][t] if m["id"] not in vistos]
        if ms:
            lineas.append(f"{titulos[t]}:")
            lineas += [f"- [m{m['id']}] {m['texto']}" + (f" ({m['hora']} {m['dias']})" if m["hora"] else "") for m in ms]
    if ctx.get("compuerta", {}).get("activa") and not any(ctx["memorias"].values()):
        lineas.append("Ningún dato de su memoria viene al caso con este mensaje: responde sin datos personales.")
    t = ctx.get("tono") or {}
    rasgos = []
    if t.get("largo"):
        rasgos.append(f"frases de unas {t['largo']} palabras")
    if t.get("inicios"):
        rasgos.append("a veces empieza con: " + ", ".join(t["inicios"]))
    rasgos += t.get("palabras", [])
    if rasgos:
        lineas.append("Su tono (es un estilo, no un dato: no lo cites ni lo uses en todas las opciones): " + " · ".join(rasgos))
    return "\n".join(lineas)


def ultimo_encuentro(ctx: dict) -> str:
    """Una línea para la TV: 'Último encuentro: 2026-11-16 · Fueron al cine...'."""
    e = ctx["ultimos_encuentros"]
    return f"Último encuentro: {e[0]['fecha']} · {e[0]['texto']}" if e else ""
