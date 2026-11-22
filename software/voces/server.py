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

import json
import os
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import numpy as np

import identidad

PUERTO = int(os.environ.get("VOCES_PUERTO", "8791"))


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
            d = identidad.leer()
            return self._json(200, {"ok": True, "personas": [{"persona": p, "fecha": v.get("fecha"), "muestras": v.get("muestras", 1),
                                                              "segundos": v.get("segundos")} for p, v in d.items()]})
        if self.path == "/api/voces/config":
            return self._json(200, {"ok": True, "lectura": str(identidad.config().get("lectura", identidad.LECTURA))[:600]})
        if self.path == "/api/voces/salud":
            return self._json(200, {"ok": True, "registradas": len(identidad.leer()), "umbral": identidad.UMBRAL})
        self._json(404, {"error": "no existe"})

    def do_POST(self):
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)) or b"{}")
        except json.JSONDecodeError:
            return self._json(400, {"error": "JSON inválido"})
        t0 = time.monotonic()
        if self.path == "/api/voces/quien":
            r = identidad.quien(identidad.pcm(body.get("audio", "")))
            return self._json(200, {"ok": True, **r, "ms": int((time.monotonic() - t0) * 1000)})
        if self.path == "/api/voces/registrar":
            persona = str(body.get("persona", "")).strip()[:40]
            consentimiento = body.get("consentimiento") or {}
            if not persona:
                return self._json(400, {"error": "falta la persona"})
            if consentimiento.get("acepta") is not True:
                return self._json(400, {"error": "falta el consentimiento de la persona"})
            minimo = identidad.MIN_REGISTRO_S
            e, seg = identidad.huella(identidad.pcm(body.get("audio", "")), minimo)
            if e is None:
                return self._json(400, {"error": f"hacen falta al menos {minimo:.0f} s de voz (llegaron {seg:.1f} s)"})
            muestras = identidad.registrar(persona, e, seg, str(consentimiento.get("texto", ""))[:300])
            print(f"[voces] huella registrada ({muestras} muestras)", flush=True)
            return self._json(200, {"ok": True, "persona": persona, "muestras": muestras, "segundos": round(seg, 1)})
        if self.path == "/api/voces/borrar":
            persona = str(body.get("persona", "")).strip()
            return self._json(200, {"ok": True, "borrada": identidad.borrar(persona)})
        self._json(404, {"error": "no existe"})


if __name__ == "__main__":
    import torch
    torch.set_num_threads(2)
    identidad.encoder().embed_utterance(np.zeros(identidad.RATE, dtype=np.float32) + 1e-4)
    print(f"voces · {len(identidad.leer())} huellas · umbral {identidad.UMBRAL} · http://127.0.0.1:{PUERTO}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", PUERTO), Handler).serve_forever()
