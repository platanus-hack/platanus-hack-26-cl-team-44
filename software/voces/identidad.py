"""Local enrollment, extraction, and matching of voice embeddings."""
from __future__ import annotations

import base64
import json
import os
import threading
import time
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parents[2]
DATOS = Path(os.environ.get("VOCES_DATOS", RAIZ / "software/agent/data/voces.json"))
RATE = 16000
UMBRAL = float(os.environ.get("VOCES_UMBRAL", "0.75"))
MARGEN = float(os.environ.get("VOCES_MARGEN", "0.05"))
MIN_REGISTRO_S, MIN_QUIEN_S = 8.0, 0.8
CONFIG = DATOS.with_name("voces-config.json")
LECTURA = ("Voy a leer este texto a mi ritmo normal para que Myo reconozca mi voz. Hablo de lo que hice esta semana, "
           "de la comida que me gusta, del clima y de los planes para el fin de semana. Cuando me escuches, ya sabes quién habla.")

_lock = threading.Lock()
_encoder = None


def config() -> dict:
    try:
        return {"lectura": LECTURA, **json.loads(CONFIG.read_text(encoding="utf-8"))}
    except (FileNotFoundError, json.JSONDecodeError):
        return {"lectura": LECTURA}


def encoder():
    global _encoder
    if _encoder is None:
        from resemblyzer import VoiceEncoder
        _encoder = VoiceEncoder("cpu", verbose=False)
    return _encoder


def leer() -> dict:
    try:
        return json.loads(DATOS.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def guardar(d: dict) -> None:
    DATOS.parent.mkdir(parents=True, exist_ok=True)
    tmp = DATOS.with_suffix(".tmp")
    tmp.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
    os.chmod(tmp, 0o600)
    tmp.replace(DATOS)


def registrar(persona: str, embedding: np.ndarray, segundos: float, texto: str) -> int:
    with _lock:
        registro = leer()
        previa = registro.get(persona) or {}
        if previa:
            muestras = previa.get("muestras", 1)
            embedding = (np.array(previa["huella"]) * muestras + embedding) / (muestras + 1)
            embedding = embedding / (np.linalg.norm(embedding) or 1.0)
        muestras = previa.get("muestras", 0) + 1
        fecha = time.strftime("%Y-%m-%d %H:%M")
        registro[persona] = {
            "huella": [round(float(x), 6) for x in embedding],
            "muestras": muestras,
            "segundos": round(segundos + previa.get("segundos", 0), 1),
            "fecha": fecha,
            "consentimiento": {"acepta": True, "texto": texto, "fecha": fecha},
        }
        guardar(registro)
    return muestras


def borrar(persona: str) -> bool:
    with _lock:
        registro = leer()
        existia = registro.pop(persona, None) is not None
        guardar(registro)
    return existia


def pcm(b64: str) -> np.ndarray:
    raw = base64.b64decode(b64 or "")
    return np.frombuffer(raw[: len(raw) // 2 * 2], dtype="<i2").astype(np.float32) / 32768.0


def huella(wav: np.ndarray, minimo: float) -> tuple[np.ndarray | None, float]:
    """Return the normalized embedding and seconds of speech used after trimming."""
    from resemblyzer import preprocess_wav
    if len(wav) < minimo * RATE:
        return None, len(wav) / RATE
    try:
        voz = preprocess_wav(wav, source_sr=RATE)
    except Exception:
        voz = wav
    if len(voz) < minimo * RATE * 0.6:
        voz = wav
    e = encoder().embed_utterance(voz)
    return e / (np.linalg.norm(e) or 1.0), len(voz) / RATE


def quien(wav: np.ndarray) -> dict:
    e, seg = huella(wav, MIN_QUIEN_S)
    if e is None:
        return {"persona": None, "score": 0.0, "segundos": round(seg, 2), "motivo": "muy corto"}
    d = leer()
    notas = sorted(((float(np.dot(e, np.array(v["huella"]))), p) for p, v in d.items()), reverse=True)
    if not notas:
        return {"persona": None, "score": 0.0, "segundos": round(seg, 2), "motivo": "nadie registrado"}
    (s1, p1), s2 = notas[0], (notas[1][0] if len(notas) > 1 else 0.0)
    ok = s1 >= UMBRAL and s1 - s2 >= MARGEN
    return {"persona": p1 if ok else None, "score": round(s1, 3), "segundo": round(s2, 3), "segundos": round(seg, 2),
            **({} if ok else {"motivo": "parecido bajo" if s1 < UMBRAL else "se parece a dos personas"})}
