"""Servidor del agente: recibe eventos, corre el agente y manda las opciones a la TV por SSE.

    software/agent/.venv/bin/python software/agent/server.py        # http://127.0.0.1:8790

Rutas:
  GET  /api/salud      estado, usuaria, modelo
  GET  /api/personas   personas de la memoria
  GET  /api/eventos    SSE: {tipo: "pensando" | "opciones" | "error", ...}
  POST /api/simular    {texto, persona?, canal?: "grupo" | "voz"} → 202, el resultado llega por SSE

Solo escucha en 127.0.0.1. Un solo trabajador: los eventos se atienden de a uno.
"""
from __future__ import annotations

import json
import os
import queue
import sys
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

AGENT = Path(__file__).resolve().parent
sys.path.insert(0, str(AGENT))

from agente import MODELO, run_agent  # noqa: E402
from memoria import store  # noqa: E402

PORT = int(os.environ.get("TOKI_AGENTE_PORT", "8790"))
DB = AGENT / "data" / "memoria.db"
ORIGENES = {o.strip() for o in os.environ.get(
    "TOKI_ORIGENES", "http://localhost:8000,http://127.0.0.1:8000").split(",")}
CANALES = {"grupo": "escribe en Familia", "voz": "dice"}

_clientes: set[queue.Queue] = set()
_clientes_lock = threading.Lock()
_bandeja: queue.Queue = queue.Queue()


def emitir(ev: dict) -> int:
    with _clientes_lock:
        for q in list(_clientes):
            q.put(ev)
        return len(_clientes)


def trabajador() -> None:
    """Un solo trabajador: atiende los eventos de a uno, en orden de llegada."""
    while True:
        ev = _bandeja.get()
        c = store.conectar(DB)
        try:
            pid = ev.get("persona") or next(iter(store.detectar_personas(c, ev["texto"])), None)
            p = store.persona(c, pid) if pid else None
            quien = p["nombre"] if p else "Alguien"
            emitir({"tipo": "pensando", "id": ev["id"], "canal": ev["canal"], "texto": ev["texto"],
                    "persona": pid, "etiqueta": f"{quien} {CANALES[ev['canal']]}"})
            r = run_agent(c, p, ev["texto"])
            emitir({"tipo": "opciones", "id": ev["id"], "canal": ev["canal"], "texto": ev["texto"],
                    "etiqueta": f"{quien} {CANALES[ev['canal']]}", "inicial": quien[:1].upper(), **r})
            print(f"[{ev['id']}] {pid or 'desconocido'} · {r['origen']} · {r['meta'].get('ms_total')} ms", flush=True)
        except Exception as e:
            emitir({"tipo": "error", "id": ev["id"], "error": f"{type(e).__name__}: {e}"[:300]})
        finally:
            c.close()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):  # menos ruido en la terminal
        pass

    def _cors(self):
        o = self.headers.get("Origin", "")
        if o in ORIGENES:
            self.send_header("Access-Control-Allow-Origin", o)
            self.send_header("Vary", "Origin")

    def _json(self, code: int, body) -> None:
        data = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self._cors()
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.send_header("Access-Control-Allow-Methods", "GET, POST")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/salud":
            c = store.conectar(DB)
            body = {"ok": True, "usuaria": store.usuaria(c), "personas": len(store.personas(c)),
                    "modelo": MODELO, "bandeja": _bandeja.qsize()}
            c.close()
            return self._json(200, body)
        if self.path == "/api/personas":
            c = store.conectar(DB)
            body = [{k: p[k] for k in ("id", "nombre", "relacion", "tipo_interlocutor")} for p in store.personas(c)]
            c.close()
            return self._json(200, body)
        if self.path == "/api/eventos":
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self._cors()
            self.end_headers()
            q: queue.Queue = queue.Queue()
            with _clientes_lock:
                _clientes.add(q)
            try:
                self.wfile.write(b'data: {"tipo": "hola"}\n\n')
                self.wfile.flush()
                while True:
                    try:
                        ev = q.get(timeout=15)
                        self.wfile.write(f"data: {json.dumps(ev, ensure_ascii=False)}\n\n".encode())
                    except queue.Empty:
                        self.wfile.write(b": latido\n\n")
                    self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                pass
            finally:
                with _clientes_lock:
                    _clientes.discard(q)
            return
        self._json(404, {"error": "no existe"})

    def do_POST(self):
        if self.path != "/api/simular":
            return self._json(404, {"error": "no existe"})
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)) or b"{}")
        except json.JSONDecodeError:
            return self._json(400, {"error": "JSON inválido"})
        texto = str(body.get("texto", "")).strip()[:1000]
        canal = body.get("canal") if body.get("canal") in CANALES else "grupo"
        if not texto:
            return self._json(400, {"error": "falta el texto"})
        ev = {"id": uuid.uuid4().hex[:8], "texto": texto, "canal": canal,
              "persona": body.get("persona") or None, "t": time.time()}
        _bandeja.put(ev)
        return self._json(202, {"ok": True, "id": ev["id"], "en_bandeja": _bandeja.qsize(), "tvs": len(_clientes)})


def main() -> None:
    if not DB.exists():
        sys.exit("Falta la base. Corre primero: python3 software/agent/scripts/semilla.py --ejemplo")
    threading.Thread(target=trabajador, daemon=True).start()
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    srv.daemon_threads = True
    print(f"toki-agent · http://127.0.0.1:{PORT} · modelo {MODELO} · orígenes {', '.join(sorted(ORIGENES))}", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
