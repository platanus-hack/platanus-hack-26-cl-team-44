"""Servidor del agente. Lo llaman el puente de WhatsApp y la TV.

    software/agent/.venv/bin/python software/agent/server.py        # http://127.0.0.1:8790

Rutas para el puente (respuesta síncrona, el puente reenvía a la TV por su SSE):
  POST /api/sugerir    {modo: "chat" | "voz" | "mencion", texto, telefono?, persona?, historial?: [str]}
  POST /api/grupo      {id, grupo_jid, grupo_nombre, autor_tel, autor_nombre, texto, menciona}

Disparadores (la TV los muestra y la usuaria los aprueba):
  GET  /api/disparadores
  POST /api/disparadores/estado   {id, estado: "activo" | "pausado" | "pendiente"}
  POST /api/pedido     {para, ocasion, presupuesto?} → qué pedir por Rappi según la memoria (pedido.py)

Modo dev de la TV:
  GET  /api/salud, /api/personas, /api/eventos (SSE)
  POST /api/simular    {texto, persona?, canal?: "grupo" | "voz"} → 202, resultado por SSE

Solo escucha en 127.0.0.1. Un POST con un Origin que no está en TOKI_ORIGENES se rechaza (CSRF).
Con TOKI_TOKEN, lo que llega por el proxy (trae X-Forwarded-For) exige el header X-Myo-Token.
Nunca en la URL: la TV lee el SSE con fetch (toki-sse.js). El puente local entra sin token.
"""
from __future__ import annotations

import hmac
import json
import os
import queue
import shutil
import sys
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

AGENT = Path(__file__).resolve().parent
sys.path.insert(0, str(AGENT))

import grupos  # noqa: E402
import pedido  # noqa: E402
from agente import MODELO, MODOS, run_agent  # noqa: E402
from memoria import store  # noqa: E402

PORT = int(os.environ.get("TOKI_AGENTE_PORT", "8790"))
DATA = AGENT / "data"
DB = DATA / "memoria.db"
DISPARADORES = grupos.Disparadores(DATA / "disparadores.json")
ORIGENES = {o.strip() for o in os.environ.get(
    "TOKI_ORIGENES", "http://localhost:8000,http://127.0.0.1:8000,http://localhost:8766,http://127.0.0.1:8766").split(",")}
MAX_DIA = int(os.environ.get("TOKI_MAX_DIA", "0"))   # 0 = sin tope. En la URL pública protege la suscripción.
_uso = {"dia": time.strftime("%Y-%m-%d"), "n": 0}
_uso_lock = threading.Lock()
CANALES = {"grupo": ("mencion", "escribe en Familia"), "voz": ("voz", "dice")}

_clientes: set[queue.Queue] = set()
_clientes_lock = threading.Lock()
_bandeja: queue.Queue = queue.Queue()
_agente_lock = threading.Lock()   # un solo trabajo del agente a la vez


def emitir(ev: dict) -> int:
    with _clientes_lock:
        for q in list(_clientes):
            q.put(ev)
        return len(_clientes)


class TopeDiario(Exception):
    pass


def contar() -> None:
    """Suma una llamada al modelo; pasa el tope diario → TopeDiario."""
    with _uso_lock:
        hoy = time.strftime("%Y-%m-%d")
        if _uso["dia"] != hoy:
            _uso.update(dia=hoy, n=0)
        if MAX_DIA and _uso["n"] >= MAX_DIA:
            raise TopeDiario(f"se alcanzó el tope de {MAX_DIA} llamadas de hoy")
        _uso["n"] += 1


def ejecutar(*a, **k) -> dict:
    contar()
    with _agente_lock:
        return run_agent(*a, **k)


def resolver_persona(c, body: dict) -> dict | None:
    if body.get("persona"):
        return store.persona(c, body["persona"])
    if body.get("telefono"):
        p = store.persona_por_telefono(c, body["telefono"])
        if p:
            return p
    nombradas = store.detectar_personas(c, str(body.get("texto", "")))
    return store.persona(c, nombradas[0]) if nombradas else None


def trabajador_dev() -> None:
    """Atiende /api/simular de a uno y manda el resultado por SSE."""
    while True:
        ev = _bandeja.get()
        c = store.conectar(DB)
        try:
            modo, verbo = CANALES[ev["canal"]]
            p = resolver_persona(c, ev)
            quien = p["nombre"] if p else "Alguien"
            etiqueta = f"{quien} {verbo}"
            emitir({"tipo": "pensando", "id": ev["id"], "canal": ev["canal"], "texto": ev["texto"],
                    "persona": p and p["id"], "etiqueta": etiqueta})
            r = ejecutar(c, p, ev["texto"], modo=modo)
            emitir({"tipo": "opciones", "id": ev["id"], "canal": ev["canal"], "texto": ev["texto"],
                    "etiqueta": etiqueta, "inicial": quien[:1].upper(), **r})
            print(f"[dev {ev['id']}] {r['persona'] or 'desconocido'} · {modo} · {r['origen']} · {r['meta'].get('ms_total')} ms", flush=True)
        except Exception as e:
            emitir({"tipo": "error", "id": ev["id"], "error": f"{type(e).__name__}: {e}"[:300]})
        finally:
            c.close()


TOKEN = os.environ.get("TOKI_TOKEN", "")


def autorizado(headers, path: str, token: str = TOKEN) -> bool:
    """Sin token configurado, o pedido local directo (sin proxy): pasa. Por el proxy: exige el token."""
    if not token or not headers.get("X-Forwarded-For"):
        return True
    dado = headers.get("X-Myo-Token") or headers.get("X-Woki-Token") or ""   # solo header; X-Woki-Token es el nombre viejo
    return hmac.compare_digest(dado.encode(), token.encode())


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
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

    def _body(self) -> dict | None:
        try:
            return json.loads(self.rfile.read(int(self.headers.get("Content-Length") or 0)) or b"{}")
        except json.JSONDecodeError:
            return None

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.send_header("Access-Control-Allow-Methods", "GET, POST")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Myo-Token, X-Woki-Token")
        self.end_headers()

    def do_GET(self):
        if not autorizado(self.headers, self.path):
            return self._json(401, {"error": "falta el token"})
        self.path = urlparse(self.path).path
        if self.path == "/api/salud":
            c = store.conectar(DB)
            body = {"ok": True, "usuaria": store.usuaria(c), "personas": len(store.personas(c)), "modelo": MODELO,
                    "uso_hoy": _uso["n"], "tope_dia": MAX_DIA or None,
                    "modos": list(MODOS), "disparadores": [{k: d.get(k) for k in ("id", "grupo_nombre", "estado")}
                                                          for d in DISPARADORES.listar()]}
            c.close()
            return self._json(200, body)
        if self.path == "/api/personas":
            c = store.conectar(DB)
            body = [{k: p[k] for k in ("id", "nombre", "relacion", "tipo_interlocutor")} for p in store.personas(c)]
            c.close()
            return self._json(200, body)
        if self.path == "/api/disparadores":
            return self._json(200, DISPARADORES.listar())
        if self.path == "/api/eventos":
            return self._sse()
        self._json(404, {"error": "no existe"})

    def _sse(self):
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
                    self.wfile.write(f"data: {json.dumps(q.get(timeout=15), ensure_ascii=False)}\n\n".encode())
                except queue.Empty:
                    self.wfile.write(b": latido\n\n")
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass
        finally:
            with _clientes_lock:
                _clientes.discard(q)

    def do_POST(self):
        if not autorizado(self.headers, self.path):
            return self._json(401, {"error": "falta el token"})
        o = self.headers.get("Origin")
        if o and o not in ORIGENES:
            return self._json(403, {"error": "origen no permitido"})
        if self.headers.get("Content-Type", "").split(";")[0].strip() != "application/json":
            return self._json(415, {"error": "solo application/json"})
        body = self._body()
        if body is None:
            return self._json(400, {"error": "JSON inválido"})

        if self.path == "/api/sugerir":
            texto = str(body.get("texto", "")).strip()[:2000]
            modo = body.get("modo") if body.get("modo") in MODOS else "chat"
            if not texto:
                return self._json(400, {"error": "falta el texto"})
            historial = [str(h)[:500] for h in (body.get("historial") or [])][-30:]
            c = store.conectar(DB)
            try:
                p = resolver_persona(c, body)
                r = ejecutar(c, p, texto, historial=historial, modo=modo)
            except TopeDiario as e:
                return self._json(429, {"error": str(e)})
            finally:
                c.close()
            motivos = ", ".join(d["motivo"] for d in r["descartadas"]) or "ninguna"
            print(f"[sugerir] {modo} · {r['persona'] or 'desconocido'} · {r['origen']} · {r['meta'].get('ms_total')} ms · descartadas: {motivos}", flush=True)
            return self._json(200, r)

        if self.path == "/api/pedido":
            # Pedido proactivo por Rappi: qué buscar según la memoria de la persona (pedido.py)
            c = store.conectar(DB)
            try:
                contar()
                r = pedido.plan(c, para=str(body.get("para") or "juan")[:40], ocasion=str(body.get("ocasion") or "aniversario"),
                                presupuesto=int(body["presupuesto"]) if str(body.get("presupuesto") or "").isdigit() else None)
            except TopeDiario as e:
                return self._json(429, {"error": str(e)})
            except ValueError as e:
                return self._json(400, {"error": str(e)})
            finally:
                c.close()
            print(f"[pedido] {r['para']} · {r['origen']} · {r['meta'].get('ms_total')} ms · fuentes {len(r['fuentes'])}", flush=True)
            return self._json(200, r)

        if self.path == "/api/grupo":
            if not body.get("grupo_jid") or not str(body.get("texto", "")).strip():
                return self._json(400, {"error": "faltan grupo_jid o texto"})
            c = store.conectar(DB)
            try:
                r = grupos.procesar(c, body, DISPARADORES, ejecutar)
            except TopeDiario as e:
                return self._json(429, {"error": str(e)})
            finally:
                c.close()
            if r["accion"] == "mencion":
                emitir({"tipo": "opciones", "id": body.get("id") or uuid.uuid4().hex[:8], "canal": "grupo",
                        "texto": r["texto"], "etiqueta": f"{r['autor']} te mencionó en {r['grupo_nombre']}",
                        "inicial": r["autor"][:1].upper(), **r})
                motivos = ", ".join(d["motivo"] for d in r["descartadas"]) or "ninguna"
                print(f"[grupo] mención en {r['grupo_nombre']} · {r['origen']} · {r['meta'].get('ms_total')} ms · descartadas: {motivos}", flush=True)
            return self._json(200, r)

        if self.path == "/api/disparadores/estado":
            try:
                d = DISPARADORES.cambiar_estado(str(body.get("id", "")), str(body.get("estado", "")))
            except KeyError:
                return self._json(404, {"error": "no existe ese disparador"})
            except ValueError as e:
                return self._json(400, {"error": str(e)})
            emitir({"tipo": "disparador", **d})
            return self._json(200, d)

        if self.path == "/api/simular":
            texto = str(body.get("texto", "")).strip()[:1000]
            canal = body.get("canal") if body.get("canal") in CANALES else "grupo"
            if not texto:
                return self._json(400, {"error": "falta el texto"})
            ev = {"id": uuid.uuid4().hex[:8], "texto": texto, "canal": canal,
                  "persona": body.get("persona") or None, "t": time.time()}
            _bandeja.put(ev)
            return self._json(202, {"ok": True, "id": ev["id"], "en_bandeja": _bandeja.qsize(), "tvs": len(_clientes)})

        return self._json(404, {"error": "no existe"})


def main() -> None:
    if not DB.exists():
        sys.exit("Falta la base. Corre primero: python3 software/agent/scripts/semilla.py --ejemplo")
    if not DISPARADORES.path.exists():
        shutil.copy(AGENT / "ejemplos" / "disparadores.example.json", DISPARADORES.path)
        print(f"Copié el disparador de ejemplo a {DISPARADORES.path.relative_to(AGENT)} (estado pendiente)")
    threading.Thread(target=trabajador_dev, daemon=True).start()
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    srv.daemon_threads = True
    print(f"toki-agent · http://127.0.0.1:{PORT} · modelo {MODELO} · orígenes {', '.join(sorted(ORIGENES))}", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
