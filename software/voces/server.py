"""Huellas de voz: reconoce quién habla en la sala, con consentimiento.

    /opt/toki/voces-venv/bin/python software/voces/server.py      # http://127.0.0.1:8791 (solo local)

La TV no llama aquí directo: llama al agente (/api/voces/*), que exige el token y reenvía a este servicio.

  POST /api/voces/registrar {persona, audio, consentimiento: {acepta: true, texto}} → guarda la huella
  POST /api/voces/quien     {audio} → {persona | null, score, segundo}
  GET  /api/voces/lista     → personas registradas (sin huellas)
  POST /api/voces/borrar    {persona} → retira el consentimiento y borra la huella

audio = PCM de 16 bits, 16 kHz, mono, en base64. Se guarda solo la huella (256 números, Resemblyzer),
nunca el audio. Archivo: software/agent/data/voces.json (fuera de git, solo el usuario del servicio).
"""
from __future__ import annotations

import base64
import json
import os
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parents[2]
DATOS = Path(os.environ.get("VOCES_DATOS", RAIZ / "software/agent/data/voces.json"))
PUERTO = int(os.environ.get("VOCES_PUERTO", "8791"))
RATE = 16000
UMBRAL = float(os.environ.get("VOCES_UMBRAL", "0.75"))   # parecido mínimo para decir un nombre
MARGEN = float(os.environ.get("VOCES_MARGEN", "0.05"))   # ventaja mínima sobre la segunda persona
MIN_REGISTRO_S, MIN_QUIEN_S = 8.0, 0.8
# Texto que se lee al registrar una voz. Lo particular (nombres, frases propias) va en voces-config.json, junto a voces.json.
CONFIG = DATOS.with_name("voces-config.json")
LECTURA = ("Voy a leer este texto a mi ritmo normal para que Myo reconozca mi voz. Hablo de lo que hice esta semana, "
           "de la comida que me gusta, del clima y de los planes para el fin de semana. Cuando me escuches, ya sabes quién habla.")


def config() -> dict:
    try:
        return {"lectura": LECTURA, **json.loads(CONFIG.read_text(encoding="utf-8"))}
    except (FileNotFoundError, json.JSONDecodeError):
        return {"lectura": LECTURA}

_lock = threading.Lock()
_encoder = None


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


def pcm(b64: str) -> np.ndarray:
    raw = base64.b64decode(b64 or "")
    return np.frombuffer(raw[: len(raw) // 2 * 2], dtype="<i2").astype(np.float32) / 32768.0


def huella(wav: np.ndarray, minimo: float) -> tuple[np.ndarray | None, float]:
    """Devuelve la huella normalizada y los segundos de voz usados (sin silencios)."""
    from resemblyzer import preprocess_wav
    if len(wav) < minimo * RATE:
        return None, len(wav) / RATE
    try:
        voz = preprocess_wav(wav, source_sr=RATE)   # normaliza el volumen y quita silencios largos
    except Exception:
        voz = wav
    if len(voz) < minimo * RATE * 0.6:              # si quitó casi todo, la frase era muy corta o muy baja
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


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _json(self, code: int, body) -> None:
        data = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/api/voces/lista":
            d = leer()
            return self._json(200, {"ok": True, "personas": [{"persona": p, "fecha": v.get("fecha"), "muestras": v.get("muestras", 1),
                                                              "segundos": v.get("segundos")} for p, v in d.items()]})
        if self.path == "/api/voces/config":
            return self._json(200, {"ok": True, "lectura": str(config().get("lectura", LECTURA))[:600]})
        if self.path == "/api/voces/salud":
            return self._json(200, {"ok": True, "registradas": len(leer()), "umbral": UMBRAL})
        self._json(404, {"error": "no existe"})

    def do_POST(self):
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)) or b"{}")
        except json.JSONDecodeError:
            return self._json(400, {"error": "JSON inválido"})
        t0 = time.monotonic()
        if self.path == "/api/voces/quien":
            r = quien(pcm(body.get("audio", "")))
            return self._json(200, {"ok": True, **r, "ms": int((time.monotonic() - t0) * 1000)})
        if self.path == "/api/voces/registrar":
            persona = str(body.get("persona", "")).strip()[:40]
            consentimiento = body.get("consentimiento") or {}
            if not persona:
                return self._json(400, {"error": "falta la persona"})
            if consentimiento.get("acepta") is not True:
                return self._json(400, {"error": "falta el consentimiento de la persona"})
            e, seg = huella(pcm(body.get("audio", "")), MIN_REGISTRO_S)
            if e is None:
                return self._json(400, {"error": f"hacen falta al menos {MIN_REGISTRO_S:.0f} s de voz (llegaron {seg:.1f} s)"})
            with _lock:
                d = leer()
                previa = d.get(persona)
                if previa:   # otra muestra: promedio ponderado, así la huella mejora con cada registro
                    n = previa.get("muestras", 1)
                    e = (np.array(previa["huella"]) * n + e) / (n + 1)
                    e = e / (np.linalg.norm(e) or 1.0)
                d[persona] = {"huella": [round(float(x), 6) for x in e], "muestras": (previa or {}).get("muestras", 0) + 1,
                              "segundos": round(seg + (previa or {}).get("segundos", 0), 1), "fecha": time.strftime("%Y-%m-%d %H:%M"),
                              "consentimiento": {"acepta": True, "texto": str(consentimiento.get("texto", ""))[:300],
                                                 "fecha": time.strftime("%Y-%m-%d %H:%M")}}
                guardar(d)
            print(f"[voces] huella registrada ({d[persona]['muestras']} muestras)", flush=True)   # sin nombres en el log
            return self._json(200, {"ok": True, "persona": persona, "muestras": d[persona]["muestras"], "segundos": round(seg, 1)})
        if self.path == "/api/voces/borrar":
            persona = str(body.get("persona", "")).strip()
            with _lock:
                d = leer()
                existia = d.pop(persona, None) is not None
                guardar(d)
            return self._json(200, {"ok": True, "borrada": existia})
        self._json(404, {"error": "no existe"})


if __name__ == "__main__":
    import torch
    torch.set_num_threads(2)
    encoder().embed_utterance(np.zeros(RATE, dtype=np.float32) + 1e-4)   # carga y calienta el modelo: la 1.ª huella tarda 0,7 s, las demás ~0,02 s
    print(f"voces · {len(leer())} huellas · umbral {UMBRAL} · http://127.0.0.1:{PUERTO}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", PUERTO), Handler).serve_forever()
