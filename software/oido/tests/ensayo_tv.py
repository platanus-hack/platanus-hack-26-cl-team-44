"""Ensayo de la TV con el oído, sin micrófono ni ElevenLabs: Scribe falso + oído real + toki-os servido en local.

    software/oido/.venv/bin/python software/oido/tests/ensayo_tv.py      # TV en http://127.0.0.1:18000/woki-os.html

Guion (avanza solo; imprime cada paso):
  1. espera a que la TV se conecte al SSE del oído
  2. Scribe «oye» una frase con dos voces → la TV debe mostrar dos turnos (S1 y S2)
  3. espera a que alguien asigne S1 en la TV (o MYO_ESCUCHA.asignar('S1', 'x'))
  4. Scribe corta la conexión → el oído reconecta → la voz 0 de la sesión nueva debe llegar como S3, sin persona
El oído usa el puerto 8792 (el que busca la TV en local): no correrlo con otro oído encendido.
"""
from __future__ import annotations

import functools
import json
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI.parent))
sys.path.insert(0, str(AQUI))

import server  # noqa: E402
from motor import Bus, Oido  # noqa: E402
from test_oido import RAPIDO, FuenteCola, ScribeFalso, esperar, palabras, silencio  # noqa: E402

TV_PUERTO, OIDO_PUERTO = 18000, 8792
TOKI_OS = AQUI.parents[1] / "toki-os"


def paso(msg: str, **datos) -> None:
    print(json.dumps({"paso": msg, **datos}, ensure_ascii=False), flush=True)


def main() -> None:
    tv = ThreadingHTTPServer(("127.0.0.1", TV_PUERTO), functools.partial(SimpleHTTPRequestHandler, directory=str(TOKI_OS)))
    tv.RequestHandlerClass.log_message = lambda *a: None
    threading.Thread(target=tv.serve_forever, daemon=True).start()

    scribe, fuente = ScribeFalso(), FuenteCola()
    oido = Oido(fuente, lambda: "tok", bus=Bus(), modo="siempre", ws_url=scribe.url, esperas=RAPIDO)
    oido.ens.espera_s = 0.5
    srv = ThreadingHTTPServer(("127.0.0.1", OIDO_PUERTO),
                              server.crear_handler(oido, OIDO_PUERTO, origenes={f"http://127.0.0.1:{TV_PUERTO}"}, token=""))
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    oido.iniciar()

    def microfono():   # silencio continuo: el anillo avanza como con un micrófono real
        while True:
            fuente.cola.put(silencio())
            time.sleep(0.1)
    threading.Thread(target=microfono, daemon=True).start()
    paso("listo", tv=f"http://127.0.0.1:{TV_PUERTO}/woki-os.html", oido=f"http://127.0.0.1:{OIDO_PUERTO}")

    if not esperar(lambda: len(oido.bus._subs) > 0, timeout=120):
        paso("la TV no se conectó al oído")
        return
    paso("tv_conectada")
    esperar(lambda: oido.cliente.conectado, 5)
    time.sleep(1.5)
    scribe.frase(0, "Hola mamá, ¿cómo dormiste? Bien, gracias.", palabras(("Hola mamá, ¿cómo dormiste?", 0), ("Bien, gracias.", 1)))
    paso("frase_dos_voces_enviada")

    if not esperar(lambda: "S1" in oido.hablantes, timeout=60):
        paso("nadie asignó S1")
    else:
        paso("s1_asignada", hablantes=oido.hablantes)
        scribe.cortar()
        esperar(lambda: len(scribe.conexiones) >= 2 and oido.cliente.conectado, 5)
        paso("reconectado", sesiones=oido.cliente.sesiones)
        time.sleep(0.5)
        scribe.frase(0, "Buenas tardes.", palabras(("Buenas tardes.", 0)))
        time.sleep(1.5)
        paso("fin", turnos=list(oido.turnos), hablantes=oido.hablantes)
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        oido.detener()
        scribe.cerrar()


if __name__ == "__main__":
    main()
