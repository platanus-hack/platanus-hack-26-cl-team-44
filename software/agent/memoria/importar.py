"""Importa la memoria de la usuaria desde un chat exportado de WhatsApp.

Parte determinista, sin red y sin modelo:
  leer()      archivo .zip o _chat.txt → mensajes [{fecha, hora, autor, texto}]
  lexico()    palabras, risa y emojis que la usuaria usa más que la otra persona
  estilo()    frases cortas reales de la usuaria (sin números, links ni correos)
  medidas()   largo típico de sus mensajes y uso de mayúsculas

Todo sale como memorias en estado "propuesta": la usuaria o su cuidadora las aprueba.
El texto del chat nunca va al repo: la salida se guarda en software/agent/data/.
"""
from __future__ import annotations

import collections
import re
import statistics
import zipfile
from pathlib import Path

from . import store

# iOS:     [22/06/25, 1:05:06 PM] Nombre: texto
# Android: 22/06/25, 13:05 - Nombre: texto
_IOS = re.compile(r"^\[(\d{1,2}/\d{1,2}/\d{2,4}),? ([\d:]+)(?:[\s ]?([AaPp])\.?\s?[Mm]\.?)?\] ([^:]{1,60}): (.*)$")
_AND = re.compile(r"^(\d{1,2}/\d{1,2}/\d{2,4}),? ([\d:]+)(?:[\s ]?([AaPp])\.?\s?[Mm]\.?)? - ([^:]{1,60}): (.*)$")
_INVISIBLES = dict.fromkeys(map(ord, "‎‏‪‬﻿"), None)

# Mensajes que no son texto escrito por la persona.
_RUIDO = re.compile(
    r"(omitid|omitted|<adjunto|<attached|eliminaste|se elimin|deleted|editado>|edited>|"
    r"llamada (perdida|de voz|de video)|missed (voice|video)|ubicaci[oó]n:|location:|\.vcf|"
    r"voice call|video call|no answer|cambi[oó] (el|su)|cifrad|encrypted|ver una vez|view once|^null$)", re.I)
_SENSIBLE = re.compile(r"\d|https?://|www\.|@|\.com|\.cl|\.co\b", re.I)
_EMOJI = re.compile("[\U0001F300-\U0001F3FA\U0001F400-\U0001FAFF\u2600-\u27BF]")  # sin tonos de piel ni selectores
_PALABRA = re.compile(r"[a-záéíóúñü]+", re.I)
_RISA = re.compile(r"\b(?:ja|je|ji|ha|ka|js){2,}j?\b|\bjsj\w*", re.I)

# Palabras frecuentes del español que no dicen nada del estilo de nadie.
STOP = set("""
a al algo algun alguna alguno ahi ahora alla asi aun aunque bien cada casi como con contra cual cuando
de del desde donde dos el ella ellas ellos en entre era eran es esa esas ese eso esos esta estaba estas
este esto estos estoy estas esta fue fui ha hace hacer hay hasta la las le les lo los mas me mi mis mucho
muy nada ni no nos nosotros o otra otro para pero poco por porque que quien se sea ser si sin sobre solo
son su sus tambien te tengo tiene tienes ti todo todos tu tus un una uno unos va vamos voy y ya yo
tan sea fue van ver vez dia hoy mañana igual entonces pues cosa cosas tipo sus mismo misma algo
estar estas esta eres soy hacer hago hizo dice dijo creo puedo puede quiero quieres sabes se sé
""".split())


def _norm(texto: str) -> str:
    return store.norm(texto)


def _fecha_iso(fecha: str) -> str:
    d, m, a = fecha.split("/")
    a = ("20" + a) if len(a) == 2 else a
    return f"{a}-{int(m):02d}-{int(d):02d}"


def _hora_24(hora: str, ampm: str | None) -> str:
    h, mi = (hora.split(":") + ["0"])[:2]
    h = int(h)
    if ampm:
        ampm = ampm.lower()
        h = (h % 12) + (12 if ampm == "p" else 0)
    return f"{h:02d}:{int(mi):02d}"


def _texto_chat(origen: Path) -> str:
    if origen.suffix.lower() == ".zip":
        with zipfile.ZipFile(origen) as z:
            nombre = next((n for n in z.namelist() if n.endswith(".txt") and not n.startswith("__MACOSX")), None)
            if not nombre:
                raise ValueError("El .zip no trae el .txt del chat")
            return z.read(nombre).decode("utf-8", errors="replace")
    return origen.read_text(encoding="utf-8", errors="replace")


def parsear(texto: str) -> list[dict]:
    """Líneas del chat → mensajes. Une las líneas de continuación al mensaje anterior."""
    msgs: list[dict] = []
    for linea in texto.translate(_INVISIBLES).splitlines():
        m = _IOS.match(linea) or _AND.match(linea)
        if m:
            fecha, hora, ampm, autor, cuerpo = m.groups()
            msgs.append({"fecha": _fecha_iso(fecha), "hora": _hora_24(hora, ampm),
                         "autor": autor.strip(), "texto": cuerpo.strip()})
        elif msgs and linea.strip():
            msgs[-1]["texto"] += "\n" + linea.strip()
    return [m for m in msgs if m["texto"] and not _RUIDO.search(m["texto"])]


def leer(origen: str | Path) -> list[dict]:
    return parsear(_texto_chat(Path(origen)))


def autores(msgs: list[dict]) -> collections.Counter:
    return collections.Counter(m["autor"] for m in msgs)


_CODIGO = re.compile(r"[<>{};=]|\b(def|const|function|select|http)\b", re.I)
_VOCAL = re.compile(r"[aeiou]")


def _charla(msgs: list[dict], max_pal: int = 25) -> list[dict]:
    """Mensajes de conversación: cortos y sin código ni texto pegado."""
    return [m for m in msgs if len(m["texto"].split()) <= max_pal and not _CODIGO.search(m["texto"])]


def _palabras(msgs: list[dict]) -> collections.Counter:
    c: collections.Counter = collections.Counter()
    for m in msgs:
        c.update(w for w in (_norm(x) for x in _PALABRA.findall(m["texto"]))
                 if len(w) >= 3 and w not in STOP and _VOCAL.search(w) and not re.search(r"(.)\1\1", w))
    return c


def _dias(msgs: list[dict], extraer) -> dict[str, int]:
    """En cuántos días distintos aparece cada elemento. Filtra lo que se pegó una sola vez."""
    d: dict[str, set] = collections.defaultdict(set)
    for m in msgs:
        for x in extraer(m["texto"]):
            d[x].add(m["fecha"])
    return {x: len(f) for x, f in d.items()}


def lexico(msgs: list[dict], yo: str, n: int = 25, minimo: int = 8, min_dias: int = 5) -> dict:
    """Lo que distingue su forma de escribir: palabras que usa más que la otra persona, su risa y sus emojis.

    Solo cuenta mensajes de charla y elementos que aparecen en min_dias días distintos o más."""
    suyos = _charla([m for m in msgs if m["autor"] == yo])
    otros = _charla([m for m in msgs if m["autor"] != yo])
    a, b = _palabras(suyos), _palabras(otros)
    dias = _dias(suyos, lambda t: {_norm(x) for x in _PALABRA.findall(t)})
    ta, tb = sum(a.values()) or 1, sum(b.values()) or 1
    puntaje = {w: (k / ta) / ((b[w] + 1) / tb) for w, k in a.items()
               if k >= minimo and dias.get(w, 0) >= min_dias and not _RISA.fullmatch(w)}
    distintivas = sorted(puntaje, key=lambda w: (-puntaje[w], -a[w]))[:n]
    risas = collections.Counter(_norm(r) for m in suyos for r in _RISA.findall(m["texto"]))
    dias_e = _dias(suyos, lambda t: set(_EMOJI.findall(t)))
    emojis = collections.Counter(e for m in suyos for e in _EMOJI.findall(m["texto"]) if dias_e[e] >= min_dias)
    return {"palabras": distintivas,
            "frecuentes": [w for w, _ in a.most_common(n)],
            "risa": risas.most_common(1)[0][0] if risas else "",
            "emojis": [e for e, _ in emojis.most_common(8)]}


def estilo(msgs: list[dict], yo: str, n: int = 20, min_pal: int = 3, max_pal: int = 10,
           desde: str = "") -> list[str]:
    """Frases reales y cortas de la usuaria. Primero las que repite; después las más recientes."""
    cand = []
    for m in msgs:
        if m["autor"] != yo or m["fecha"] < desde or "\n" in m["texto"]:
            continue
        t = m["texto"].strip()
        k = len(t.split())
        if min_pal <= k <= max_pal and not _SENSIBLE.search(t) and not _CODIGO.search(t):
            cand.append(t)
    repetidas = collections.Counter(_norm(t) for t in cand)
    vistas: set[str] = set()
    orden = sorted(range(len(cand)), key=lambda i: (-repetidas[_norm(cand[i])], -i))
    out = []
    for i in orden:
        clave = _norm(cand[i]).strip(" .!?¿¡")
        if clave in vistas:
            continue
        vistas.add(clave)
        out.append(cand[i])
        if len(out) >= n:
            break
    return out


def medidas(msgs: list[dict], yo: str) -> dict:
    suyos = [m["texto"] for m in msgs if m["autor"] == yo]
    if not suyos:
        return {"mensajes": 0}
    largos = [len(t.split()) for t in suyos]
    con_letra = [t for t in suyos if re.search(r"[A-Za-zÁÉÍÓÚÑ]", t)]
    mayus = sum(1 for t in con_letra if t.lstrip("¿¡\"'")[:1].isupper()) / (len(con_letra) or 1)
    return {"mensajes": len(suyos), "mediana_palabras": statistics.median(largos),
            "empieza_con_mayuscula": round(mayus, 2)}


def a_memorias(lex: dict, frases: list[str], med: dict, persona: str | None = None,
               estado: str = "propuesta") -> list[dict]:
    """Arma las memorias tipo lexico y estilo. Las frases salen con privacidad familia."""
    base = {"estado": estado, "fuente": "whatsapp"}
    per = [persona] if persona else []
    out = []
    if lex["palabras"]:
        out.append({**base, "tipo": "lexico", "texto": "Palabras suyas: " + ", ".join(lex["palabras"]), "privacidad": "publico"})
    if lex["risa"] or lex["emojis"]:
        partes = ([f"se ríe con \"{lex['risa']}\""] if lex["risa"] else []) + \
                 ([f"emojis que usa: {' '.join(lex['emojis'])}"] if lex["emojis"] else [])
        out.append({**base, "tipo": "lexico", "texto": "Por escrito " + "; ".join(partes) + ".", "privacidad": "publico"})
    if med.get("mensajes"):
        cap = "casi siempre empieza con mayúscula" if med["empieza_con_mayuscula"] >= 0.6 else "casi siempre escribe en minúscula"
        out.append({**base, "tipo": "estilo", "privacidad": "publico",
                    "texto": f"Escribe mensajes cortos (mediana {med['mediana_palabras']:g} palabras) y {cap}."})
    for f in frases:
        out.append({**base, "tipo": "estilo", "texto": f, "privacidad": "familia", "personas": per})
    return out
