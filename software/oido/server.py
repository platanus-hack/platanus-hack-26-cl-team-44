"""Oído de Myo: servicio local que escucha la sala. Corre en el computador que tiene el micrófono, no en la VPS.

    software/oido/.venv/bin/python software/oido/server.py      # http://127.0.0.1:8792

Reemplaza la parte de audio de toki-os/myo-escucha.js (micrófono, Scribe, voces) por un proceso supervisado:
la llave de ElevenLabs no sale de aquí, la sesión sobrevive a una recarga de la TV y se reconecta sola.

Rutas (la TV):
  GET  /api/oido/estado          resumen: estado, modo, micrófono, sesiones, hablantes, últimos turnos
  GET  /api/oido/eventos         SSE: estado · parcial · turno · hablantes · fusion · error
  POST /api/oido/encender | /api/oido/apagar
  POST /api/oido/modo            {modo: "siempre" | "voz" | "manual"}
  POST /api/oido/asignar         {hablante: "S2", persona: "juan" | ""}   de quién es una voz
  POST /api/oido/habla           {hablando: true | false, max_s?}         Myo está hablando: al micrófono va silencio

Seguridad (igual que el puente): solo 127.0.0.1; Host exacto (anti DNS rebinding); los POST solo con
Content-Type JSON y un Origin de TOKI_ORIGENES (anti CSRF); con OIDO_TOKEN, además el header X-Myo-Token.

Variables: ELEVENLABS_API_KEY · OIDO_PUERTO (8792) · OIDO_MODO (siempre) · OIDO_MICROFONO (nombre o número; vacío =
el predeterminado) · OIDO_FUENTE=archivo:/ruta.wav (ensayo sin micrófono) · TOKI_AGENTE_URL · TOKI_VOCES_URL ·
TOKI_ORIGENES · OIDO_TOKEN · MYO_ESCUCHA_SILENCIO (0.6) · OIDO_SILENCIO_S (45, modo voz) ·
TOKI_WA_TOKEN (header X-Myo-Token hacia el agente y las huellas cuando están en la VPS)
"""
from __future__ import annotations

import base64
import hmac
import json
import os
import queue
import sys
import time
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from audio import FuenteArchivo, FuenteMic  # noqa: E402
from motor import MODOS, Bus, Oido  # noqa: E402
from scribe import token_elevenlabs  # noqa: E402

PUERTO = int(os.environ.get("OIDO_PUERTO", "8792"))
ORIGENES = {o.strip() for o in os.environ.get(
    "TOKI_ORIGENES", "http://localhost:8000,http://127.0.0.1:8000,http://localhost:8766,http://127.0.0.1:8766,"
    "http://localhost:8790,http://127.0.0.1:8790").split(",") if o.strip()}
TOKEN = os.environ.get("OIDO_TOKEN", "")
AGENTE = os.environ.get("TOKI_AGENTE_URL", "http://127.0.0.1:8790")
VOCES = os.environ.get("TOKI_VOCES_URL", "http://127.0.0.1:8791")
MAX_BODY = 4096
# Token para hablar con el agente y las huellas cuando están en la VPS (escena.sh: TOKI_AGENTE_URL=…/agente).
SALIDA = {"X-Myo-Token": os.environ["TOKI_WA_TOKEN"]} if os.environ.get("TOKI_WA_TOKEN") else {}


# ---------- servicios vecinos (con tope de tiempo; si no responden, se sigue sin ellos) ----------
def _get(url: str, timeout: float = 2.0) -> dict | list:
    with urllib.request.urlopen(urllib.request.Request(url, headers=SALIDA), timeout=timeout) as r:
        return json.loads(r.read() or b"{}")


def keyterms() -> list[str]:
    """Nombres de la casa para que Scribe los escriba bien. La usuaria primero."""
    nombres: list[str] = []
    try:
        nombres.append(str(_get(AGENTE + "/api/salud").get("usuaria") or ""))
    except Exception:
        pass
    try:
        nombres += [str(p.get("nombre") or "") for p in _get(AGENTE + "/api/personas")]
    except Exception:
        pass
    return [n for n in nombres if n]


_voces_cache = {"t": 0.0, "hay": False}


def voces_hay() -> bool:
    if time.monotonic() - _voces_cache["t"] > 60:
        try:
            _voces_cache["hay"] = bool(_get(VOCES + "/api/voces/lista", 1.0).get("personas"))
        except Exception:
            _voces_cache["hay"] = False
        _voces_cache["t"] = time.monotonic()
    return _voces_cache["hay"]


def voces_quien(pcm: bytes) -> dict:
    req = urllib.request.Request(VOCES + "/api/voces/quien", method="POST",
                                 data=json.dumps({"audio": base64.b64encode(pcm).decode()}).encode(),
                                 headers={"Content-Type": "application/json", **SALIDA})
    with urllib.request.urlopen(req, timeout=1.5) as r:
        return json.loads(r.read() or b"{}")


# ---------- HTTP ----------
def crear_handler(oido: Oido, puerto: int, origenes: set[str] = ORIGENES, token: str = TOKEN):
    hosts = {f"127.0.0.1:{puerto}", f"localhost:{puerto}"}

    class Handler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def log_message(self, *a):   # sin texto de la sala en los logs
            pass

        def _cors(self) -> None:
            o = self.headers.get("Origin", "")
            if o in origenes:
                self.send_header("Access-Control-Allow-Origin", o)
                self.send_header("Vary", "Origin")

        def _json(self, code: int, body) -> None:
            data = json.dumps(body, ensure_ascii=False).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self._cors()
            self.end_headers()
            self.wfile.write(data)

        def _permitido(self, post: bool) -> bool:
            if self.headers.get("Host", "") not in hosts:
                self._json(421, {"ok": False, "error": "host no permitido"})
                return False
            if token:
                dado = self.headers.get("X-Myo-Token") or ""
                if not hmac.compare_digest(dado.encode(), token.encode()):
                    self._json(401, {"ok": False, "error": "token inválido"})
                    return False
            o = self.headers.get("Origin")
            if post:
                ctype = (self.headers.get("Content-Type") or "").split(";")[0].strip()
                if o not in origenes or ctype != "application/json":
                    self._json(403, {"ok": False, "error": "origen o content-type no permitido"})
                    return False
            elif o and o not in origenes:
                self._json(403, {"ok": False, "error": "origen no permitido"})
                return False
            return True

        def do_OPTIONS(self):
            self.send_response(204)
            self._cors()
            self.send_header("Access-Control-Allow-Methods", "GET, POST")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Myo-Token")
            self.send_header("Content-Length", "0")
            self.end_headers()

        def do_GET(self):
            if not self._permitido(post=False):
                return
            if self.path == "/api/oido/estado":
                return self._json(200, {"ok": True, **oido.resumen()})
            if self.path == "/api/oido/eventos":
                return self._sse()
            self._json(404, {"ok": False, "error": "no existe"})

        def _sse(self) -> None:
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-store")
            self._cors()
            self.end_headers()
            self.close_connection = True
            q = oido.bus.suscribir()
            try:
                self.wfile.write(b"retry: 1000\n\n")
                self.wfile.flush()
                while True:
                    try:
                        ev = q.get(timeout=15)
                        self.wfile.write(b"data: " + json.dumps(ev, ensure_ascii=False).encode() + b"\n\n")
                    except queue.Empty:
                        self.wfile.write(b": latido\n\n")   # detecta TVs que se fueron
                    self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError, OSError):
                pass
            finally:
                oido.bus.desuscribir(q)

        def do_POST(self):
            if not self._permitido(post=True):
                return
            n = int(self.headers.get("Content-Length") or 0)
            if n > MAX_BODY:
                return self._json(413, {"ok": False, "error": "cuerpo muy grande"})
            try:
                body = json.loads(self.rfile.read(n) or b"{}")
                if not isinstance(body, dict):
                    raise ValueError
            except ValueError:
                return self._json(400, {"ok": False, "error": "JSON inválido"})
            try:
                if self.path == "/api/oido/encender":
                    oido.encender()
                elif self.path == "/api/oido/apagar":
                    oido.apagar()
                elif self.path == "/api/oido/modo":
                    oido.cambiar_modo(str(body.get("modo", "")))
                elif self.path == "/api/oido/asignar":
                    oido.asignar(str(body.get("hablante", "")), str(body.get("persona") or ""))
                elif self.path == "/api/oido/habla":
                    oido.habla(body.get("hablando") is True, float(body.get("max_s", 30)))
                else:
                    return self._json(404, {"ok": False, "error": "no existe"})
            except (ValueError, TypeError) as e:
                return self._json(400, {"ok": False, "error": str(e) or "datos inválidos"})
            self._json(200, {"ok": True, **oido.resumen()})

    return Handler


def crear_fuente():
    f = os.environ.get("OIDO_FUENTE", "")
    if f.startswith("archivo:"):
        return FuenteArchivo(f.split(":", 1)[1])
    return FuenteMic(os.environ.get("OIDO_MICROFONO") or None)


def main() -> None:
    llave = os.environ.get("ELEVENLABS_API_KEY", "")
    if not llave:
        print("oido · falta ELEVENLABS_API_KEY: no se puede escuchar", file=sys.stderr, flush=True)

    def pedir_token() -> str:
        if not llave:
            raise RuntimeError("falta ELEVENLABS_API_KEY")
        return token_elevenlabs(llave)

    modo = os.environ.get("OIDO_MODO", "siempre")
    oido = Oido(crear_fuente(), pedir_token, bus=Bus(), modo=modo if modo in MODOS else "siempre",
                keyterms=keyterms, voces_quien=voces_quien, voces_hay=voces_hay,
                silencio_s=float(os.environ.get("OIDO_SILENCIO_S", "45")))
    servidor = ThreadingHTTPServer(("127.0.0.1", PUERTO), crear_handler(oido, PUERTO))
    servidor.daemon_threads = True
    oido.iniciar()
    print(f"oido · modo {oido.modo} · micrófono {getattr(oido.fuente, 'nombre', '') or 'predeterminado'} · "
          f"http://127.0.0.1:{PUERTO} · orígenes {', '.join(sorted(ORIGENES))}", flush=True)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        oido.detener()


if __name__ == "__main__":
    main()
