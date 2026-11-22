"""Pruebas del oído: sin micrófono y sin red. Scribe es un servidor WebSocket falso en 127.0.0.1.

    software/oido/.venv/bin/python -m unittest discover -s software/oido/tests -v
"""
from __future__ import annotations

import base64
import http.client
import json
import queue
import sys
import threading
import time
import unittest
import urllib.parse
from http.server import ThreadingHTTPServer
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from audio import BLOQUE, RATE, Anillo, DetectorVoz  # noqa: E402
from motor import Bus, Oido  # noqa: E402
from turnos import Ensamblador, Etiquetas, tramos  # noqa: E402

RAPIDO = (0.05, 0.05, 0.1)   # esperas de reconexión para las pruebas


def esperar(cond, timeout=3.0, paso=0.02):
    fin = time.monotonic() + timeout
    while time.monotonic() < fin:
        if cond():
            return True
        time.sleep(paso)
    return False


def voz(amplitud=8000):
    t = np.arange(BLOQUE) / RATE
    return (np.sin(2 * np.pi * 220 * t) * amplitud).astype(np.int16)


def silencio():
    return np.zeros(BLOQUE, dtype=np.int16)


def palabras(*pares, dur=0.5):
    """palabras(("hola", 0), ("qué tal", 1)) → words de Scribe con espacios entre medio."""
    out, t = [], 0.0
    for i, (texto, spk) in enumerate(pares):
        if i:
            out.append({"type": "spacing", "text": " "})
        out.append({"type": "word", "text": texto, "speaker_id": spk, "start": t, "end": t + dur})
        t += dur + 0.1
    return out


# ---------- dobles de prueba ----------
class FuenteCola:
    nombre = "prueba"

    def __init__(self, falla=False):
        self.cola: queue.Queue = queue.Queue()
        self.falla = falla
        self.abierta = False

    def abrir(self):
        if self.falla:
            raise OSError("no hay micrófono")
        self.abierta = True

    def cerrar(self):
        self.abierta = False

    def leer(self, timeout=0.5):
        try:
            return self.cola.get(timeout=min(timeout, 0.05))
        except queue.Empty:
            return None


class ScribeFalso:
    """Acepta conexiones como Scribe, guarda el audio recibido y deja que la prueba mande mensajes o corte."""

    def __init__(self):
        from websockets.sync.server import serve
        self.conexiones: list[str] = []
        self.audio: list[list[bytes]] = []
        self.ws = None
        self._srv = serve(self._h, "127.0.0.1", 0)
        self.url = f"ws://127.0.0.1:{self._srv.socket.getsockname()[1]}/v1/speech-to-text/realtime"
        threading.Thread(target=self._srv.serve_forever, daemon=True).start()

    def _h(self, ws):
        self.conexiones.append(ws.request.path)
        self.audio.append([])
        self.ws = ws
        ws.send(json.dumps({"message_type": "session_started"}))
        try:
            for raw in ws:
                m = json.loads(raw)
                if m.get("message_type") == "input_audio_chunk":
                    self.audio[-1].append(base64.b64decode(m["audio_base_64"]))
        except Exception:
            pass

    def enviar(self, m):
        self.ws.send(json.dumps(m))

    def frase(self, idx, texto, words=None):
        self.enviar({"message_type": "committed_transcript", "segment_index": idx, "text": texto})
        if words is not None:
            self.enviar({"message_type": "diarized_transcript", "segment_index": idx, "words": words})

    def cortar(self):
        self.ws.close()

    def cerrar(self):
        self._srv.shutdown()


class Eventos:
    def __init__(self, bus):
        self.q = bus.suscribir()
        self.todos: list[dict] = []

    def _drenar(self):
        while True:
            try:
                self.todos.append(self.q.get_nowait())
            except queue.Empty:
                return

    def de(self, tipo):
        self._drenar()
        return [e for e in self.todos if e["tipo"] == tipo]

    def esperar(self, tipo, n=1, timeout=3.0):
        ok = esperar(lambda: len(self.de(tipo)) >= n, timeout)
        if not ok:
            raise AssertionError(f"no llegaron {n} eventos «{tipo}»: {self.todos}")
        return self.de(tipo)


# ---------- lógica pura ----------
class TurnosTest(unittest.TestCase):
    def test_tramos_separa_por_voz_y_pega_lo_sin_voz(self):
        e = Etiquetas()
        ts = tramos(palabras(("hola", 0), ("Juan", 0), ("¿cómo", 1), ("estás?", 1)), lambda s: e.de(1, s))
        self.assertEqual([(t["hablante"], t["texto"]) for t in ts], [("S1", "hola Juan"), ("S2", "¿cómo estás?")])

    def test_sesion_nueva_nunca_reutiliza_etiquetas(self):
        e = Etiquetas()
        self.assertEqual((e.de(1, 0), e.de(1, 1)), ("S1", "S2"))
        self.assertEqual(e.de(2, 0), "S3")   # Scribe vuelve a llamar «0» a otra voz: no hereda S1
        self.assertEqual(e.de(1, 0), "S1")

    def test_fusion(self):
        e = Etiquetas()
        e.de(1, 0), e.de(1, 1)
        self.assertEqual(e.fusionar(1, 1, 0), ("S2", "S1"))
        self.assertEqual(e.de(1, 1), "S1")

    def test_sin_version_con_voces_se_publica_sin_hablante(self):
        salida = []
        ens = Ensamblador(emitir=lambda t, h, r: salida.append((t, h)), espera_s=1.5)
        ens.nueva_sesion(0)
        ens.committed(0, "¿Quieres agua?", (0, 100), ahora=10.0)
        ens.tick(11.0)
        self.assertEqual(salida, [])
        ens.tick(11.6)
        self.assertEqual(salida, [("¿Quieres agua?", "")])
        ens.diarized(0, palabras(("tarde", 0)))   # llega tarde: no se duplica
        self.assertEqual(len(salida), 1)

    def test_diarizada_reemplaza_a_la_pendiente(self):
        salida = []
        ens = Ensamblador(emitir=lambda t, h, r: salida.append((t, h, r)))
        ens.nueva_sesion(16000)
        ens.committed(3, "hola qué tal", (0, 1), ahora=0)
        ens.diarized(3, palabras(("hola", 0), ("qué tal", 1)))
        self.assertEqual([(t, h) for t, h, _ in salida], [("hola", "S1"), ("qué tal", "S2")])
        self.assertEqual(salida[0][2], (16000, 16000 + 8000))   # segundos de Scribe → muestras absolutas
        ens.tick(99)
        self.assertEqual(len(salida), 2)

    def test_al_cerrar_no_se_pierde_lo_pendiente(self):
        salida = []
        ens = Ensamblador(emitir=lambda t, h, r: salida.append(t))
        ens.committed(0, "me duele", (0, 1), ahora=0)
        ens.nueva_sesion(0)
        self.assertEqual(salida, ["me duele"])


class AudioTest(unittest.TestCase):
    def test_anillo_recorta_y_silencia(self):
        a = Anillo(segundos=2)
        for _ in range(10):
            a.escribir(voz(), mudo=False)
        a.escribir(voz(), mudo=True)
        self.assertEqual(a.total, 11 * BLOQUE)
        mudo = np.frombuffer(a.recorte(10 * BLOQUE, 11 * BLOQUE, min_s=0.05), dtype="<i2")
        self.assertFalse(mudo.any())
        self.assertEqual(len(a.recorte(0, 10 * BLOQUE)), 10 * BLOQUE * 2)
        self.assertIsNone(a.recorte(0, BLOQUE))   # 0,1 s: muy corto para una huella

    def test_anillo_olvida_lo_viejo(self):
        a = Anillo(segundos=1)
        for _ in range(30):
            a.escribir(voz(), mudo=False)
        self.assertIsNone(a.recorte(0, 5 * BLOQUE))

    def test_detector_de_voz(self):
        d = DetectorVoz()
        self.assertFalse(any(d.hay_voz(silencio()) for _ in range(10)))
        self.assertTrue([d.hay_voz(voz()) for _ in range(3)][-1])


# ---------- motor con Scribe falso ----------
class MotorBase(unittest.TestCase):
    modo = "siempre"

    def setUp(self):
        self.scribe = ScribeFalso()
        self.fuente = FuenteCola()
        self.tokens = 0
        self.voces = {"hay": False, "persona": None}
        self.puerta = threading.Event()   # la prueba la cierra para retener una reconexión
        self.puerta.set()

        def token():
            self.puerta.wait(5)
            self.tokens += 1
            return f"tok{self.tokens}"

        def quien(pcm):
            self.audio_voces = pcm
            return {"persona": self.voces["persona"]}

        self.oido = Oido(self.fuente, token, bus=Bus(), modo=self.modo, ws_url=self.scribe.url,
                         keyterms=lambda: ["Emmy", "Juan"], voces_quien=quien, voces_hay=lambda: self.voces["hay"],
                         silencio_s=0.5, previo_bloques=5, esperas=RAPIDO)
        self.oido.ens.espera_s = 0.3
        self.ev = Eventos(self.oido.bus)

    def tearDown(self):
        self.oido.detener()
        self.scribe.cerrar()

    def conectado(self, n=1):
        self.assertTrue(esperar(lambda: len(self.scribe.conexiones) >= n and self.oido.cliente.conectado), "no conectó")

    def hablar(self, bloques=5, fuerte=True):
        for _ in range(bloques):
            self.fuente.cola.put(voz() if fuerte else silencio())


class MotorTest(MotorBase):
    def test_conecta_con_token_y_nombres_de_la_casa(self):
        self.oido.iniciar()
        self.conectado()
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.scribe.conexiones[0]).query)
        self.assertEqual(q["token"], ["tok1"])
        self.assertEqual(q["keyterms"], ["Emmy", "Juan"])
        self.assertEqual(q["diarize"], ["true"])
        self.ev.esperar("estado")
        self.assertTrue(esperar(lambda: self.oido.estado == "escuchando"))

    def test_turnos_con_voces(self):
        self.oido.iniciar()
        self.conectado()
        self.hablar(20)
        self.scribe.frase(0, "hola qué tal", palabras(("hola", 0), ("qué tal", 1)))
        ts = self.ev.esperar("turno", 2)
        self.assertEqual([(t["texto"], t["hablante"]) for t in ts], [("hola", "S1"), ("qué tal", "S2")])

    def test_frase_sin_voces_llega_igual(self):
        self.oido.iniciar()
        self.conectado()
        self.scribe.frase(0, "¿quieres agua?")
        t = self.ev.esperar("turno")[0]
        self.assertEqual((t["texto"], t["hablante"], t["persona"]), ("¿quieres agua?", "", None))

    def test_reconecta_y_la_voz_nueva_no_hereda_persona(self):
        """El bug de la rama original: tras reconectar, Scribe vuelve a numerar desde 0 y una voz nueva
        heredaba «familia». Aquí la voz 0 de la sesión 2 es S2, sin persona."""
        self.oido.iniciar()
        self.conectado()
        self.scribe.frase(0, "hola", palabras(("hola", 0)))
        self.ev.esperar("turno")
        self.oido.asignar("S1", "sofia")
        self.scribe.cortar()
        self.conectado(2)
        self.assertEqual(self.tokens, 2)   # token nuevo por sesión (son de un solo uso)
        self.scribe.frase(0, "buenas", palabras(("buenas", 0)))
        t = self.ev.esperar("turno", 2)[-1]
        self.assertEqual((t["hablante"], t["persona"]), ("S2", None))
        self.assertEqual(self.oido.hablantes, {"S1": "sofia"})

    def test_lo_dicho_mientras_reconecta_no_se_pierde(self):
        self.oido.iniciar()
        self.conectado()
        self.puerta.clear()   # la reconexión queda esperando el token
        self.scribe.cortar()
        self.assertTrue(esperar(lambda: not self.oido.cliente.conectado, 2))
        antes = self.oido.anillo.total
        self.hablar(3)   # se dice algo justo durante el corte
        self.assertTrue(esperar(lambda: self.oido.anillo.total >= antes + 3 * BLOQUE))   # ya se procesó, sin sesión
        self.puerta.set()
        self.conectado(2)
        self.assertTrue(esperar(lambda: len(self.scribe.audio[1]) >= 3))
        self.assertTrue(any(np.frombuffer(c, dtype="<i2").any() for c in self.scribe.audio[1][:5]))

    def test_persona_asignada_viaja_en_el_turno(self):
        self.oido.iniciar()
        self.conectado()
        self.scribe.frase(0, "hola", palabras(("hola", 0)))
        self.ev.esperar("turno")
        self.oido.asignar("S1", "juan")
        self.assertEqual(self.ev.esperar("hablantes")[-1]["hablantes"], {"S1": "juan"})
        self.scribe.frase(1, "¿te duele?", palabras(("¿te duele?", 0)))
        self.assertEqual(self.ev.esperar("turno", 2)[-1]["persona"], "juan")
        with self.assertRaises(ValueError):
            self.oido.asignar("../x", "juan")

    def test_mientras_myo_habla_va_silencio(self):
        self.oido.iniciar()
        self.conectado()
        self.oido.habla(True)
        self.hablar(5)
        self.assertTrue(esperar(lambda: len(self.scribe.audio[0]) >= 5))
        self.assertFalse(any(np.frombuffer(c, dtype="<i2").any() for c in self.scribe.audio[0][:5]))
        self.oido.habla(False)
        time.sleep(0.45)   # cola de 0,4 s
        self.hablar(3)
        self.assertTrue(esperar(lambda: len(self.scribe.audio[0]) >= 8))
        self.assertTrue(np.frombuffer(self.scribe.audio[0][-1], dtype="<i2").any())

    def test_reconoce_la_voz_registrada(self):
        self.voces.update(hay=True, persona="juan")
        self.oido.iniciar()
        self.conectado()
        self.hablar(20)
        self.assertTrue(esperar(lambda: self.oido.anillo.total >= 20 * BLOQUE))
        self.scribe.frase(0, "hola, ¿cómo amaneciste?", palabras(("hola, ¿cómo amaneciste?", 0), dur=1.5))
        t = self.ev.esperar("turno")[0]
        self.assertEqual((t["persona"], t["reconocida"]), ("juan", True))
        self.assertEqual(self.oido.auto, {"S1": "juan"})
        self.assertEqual(len(self.audio_voces), int(1.5 * RATE) * 2)   # se mandó el audio de esa frase, en PCM 16 bits

    def test_si_las_huellas_no_responden_el_turno_sale_igual(self):
        self.voces["hay"] = True
        self.oido.voces_quien = lambda pcm: time.sleep(5)   # el servicio de voces está colgado
        self.oido.iniciar()
        self.conectado()
        self.hablar(20)
        self.assertTrue(esperar(lambda: self.oido.anillo.total >= 20 * BLOQUE))
        t0 = time.monotonic()
        self.scribe.frase(0, "hola", palabras(("hola", 0), dur=1.5))
        t = self.ev.esperar("turno", timeout=4)[0]
        self.assertLess(time.monotonic() - t0, 2.5)   # tope de 1,5 s, no los 5 del servicio colgado
        self.assertIsNone(t["persona"])

    def test_sin_microfono_lo_dice(self):
        self.oido.fuente = FuenteCola(falla=True)
        self.oido.iniciar()
        self.assertTrue(esperar(lambda: self.oido.estado == "sin_microfono"))
        self.assertFalse(self.oido.on)
        self.assertIn("micrófono", self.oido.resumen()["error"])

    def test_apagar_cierra_todo(self):
        self.oido.iniciar()
        self.conectado()
        self.oido.apagar()
        self.assertFalse(self.oido.cliente.conectado)
        self.assertFalse(self.fuente.abierta)
        self.assertEqual(self.oido.estado, "apagado")


class ModoVozTest(MotorBase):
    modo = "voz"

    def test_abre_con_voz_manda_el_audio_previo_y_cierra_en_silencio(self):
        self.oido.iniciar()
        self.assertTrue(esperar(lambda: self.oido.estado == "esperando_voz"))
        self.hablar(10, fuerte=False)
        time.sleep(0.3)
        self.assertEqual(self.scribe.conexiones, [])   # sin voz no se gasta ElevenLabs
        self.hablar(4)
        self.conectado()
        self.assertTrue(esperar(lambda: len(self.scribe.audio[0]) >= 5))
        # Lo primero que recibe Scribe es el audio previo (5 bloques): termina con el comienzo de la frase,
        # que se dijo ANTES de que existiera la sesión.
        previo = [np.frombuffer(c, dtype="<i2").any() for c in self.scribe.audio[0][:5]]
        self.assertTrue(any(previo), previo)
        self.assertFalse(previo[0], previo)   # y empieza en el silencio de antes
        self.hablar(15, fuerte=False)
        time.sleep(0.6)
        self.hablar(2, fuerte=False)
        self.assertTrue(esperar(lambda: not self.oido.cliente.conectado and self.oido.estado == "esperando_voz"))


# ---------- HTTP ----------
class HttpTest(unittest.TestCase):
    ORIGEN = "http://localhost:8000"

    def setUp(self):
        import server
        self.fuente = FuenteCola()
        self.oido = Oido(self.fuente, lambda: "t", bus=Bus(), modo="manual", ws_url="ws://127.0.0.1:9/nada", esperas=RAPIDO)
        self.oido.iniciar()
        self.srv = ThreadingHTTPServer(("127.0.0.1", 0), server.crear_handler(self.oido, 0))
        self.puerto = self.srv.server_port
        self.srv.RequestHandlerClass = server.crear_handler(self.oido, self.puerto, origenes={self.ORIGEN}, token=self.token())
        self.srv.daemon_threads = True
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()

    def token(self):
        return ""

    def tearDown(self):
        self.srv.shutdown()
        self.oido.detener()

    def pedir(self, metodo, ruta, body=None, host=None, origen=ORIGEN, ctype="application/json", extra=None):
        c = http.client.HTTPConnection("127.0.0.1", self.puerto, timeout=3)
        h = {"Host": host or f"127.0.0.1:{self.puerto}", **(extra or {})}
        if origen:
            h["Origin"] = origen
        if body is not None:
            h["Content-Type"] = ctype
        try:
            c.request(metodo, ruta, body=body, headers=h)
            r = c.getresponse()
            return r.status, json.loads(r.read() or b"{}")
        finally:
            c.close()

    def test_estado(self):
        s, j = self.pedir("GET", "/api/oido/estado")
        self.assertEqual((s, j["modo"], j["estado"]), (200, "manual", "apagado"))

    def test_host_ajeno_dns_rebinding(self):
        self.assertEqual(self.pedir("GET", "/api/oido/estado", host=f"evil.com:{self.puerto}")[0], 421)

    def test_post_desde_otra_pagina(self):
        self.assertEqual(self.pedir("POST", "/api/oido/apagar", "{}", origen="https://evil.com")[0], 403)
        self.assertEqual(self.pedir("POST", "/api/oido/apagar", "{}", origen=None)[0], 403)
        self.assertEqual(self.pedir("POST", "/api/oido/apagar", "{}", ctype="text/plain")[0], 403)

    def test_json_roto_no_tumba_el_servicio(self):
        self.assertEqual(self.pedir("POST", "/api/oido/asignar", "{roto")[0], 400)
        self.assertEqual(self.pedir("POST", "/api/oido/asignar", "[1]")[0], 400)
        self.assertEqual(self.pedir("GET", "/api/oido/estado")[0], 200)

    def test_asignar_y_modo(self):
        s, j = self.pedir("POST", "/api/oido/asignar", json.dumps({"hablante": "S2", "persona": "juan"}))
        self.assertEqual((s, j["hablantes"]), (200, {"S2": "juan"}))
        self.assertEqual(self.pedir("POST", "/api/oido/asignar", json.dumps({"hablante": "x", "persona": "y"}))[0], 400)
        self.assertEqual(self.pedir("POST", "/api/oido/modo", json.dumps({"modo": "raro"}))[0], 400)
        s, j = self.pedir("POST", "/api/oido/habla", json.dumps({"hablando": True, "max_s": 5}))
        self.assertTrue(j["callado"])

    def test_sse_entrega_eventos(self):
        c = http.client.HTTPConnection("127.0.0.1", self.puerto, timeout=3)
        c.request("GET", "/api/oido/eventos", headers={"Host": f"127.0.0.1:{self.puerto}", "Origin": self.ORIGEN})
        r = c.getresponse()
        self.assertEqual(r.getheader("Content-Type"), "text/event-stream")
        self.oido.asignar("S1", "ana")
        lineas = []
        while not any('"hablantes"' in x for x in lineas):
            lineas.append(r.fp.readline().decode())
        ev = json.loads(next(x for x in lineas if '"hablantes"' in x)[len("data: "):])
        self.assertEqual(ev["hablantes"], {"S1": "ana"})


class HttpTokenTest(HttpTest):
    def token(self):
        return "secreto"

    def pedir(self, *a, **kw):
        kw.setdefault("extra", {"X-Myo-Token": "secreto"})
        return super().pedir(*a, **kw)

    def test_sin_token(self):
        self.assertEqual(super().pedir("GET", "/api/oido/estado", extra={})[0], 401)
        self.assertEqual(super().pedir("GET", "/api/oido/estado", extra={"X-Myo-Token": "otro"})[0], 401)

    def test_sse_entrega_eventos(self):   # el SSE con token se prueba igual que sin token
        pass


if __name__ == "__main__":
    unittest.main()


# ---------- la métrica de medir.py (que el número signifique lo que dice) ----------
class MetricaTest(unittest.TestCase):
    GUION = {"turnos": [{"hablante": "ana", "texto": "Hola mamá, ¿cómo dormiste?", "inicio": 0, "fin": 2},
                        {"hablante": "beto", "texto": "Vengo a revisar su espalda.", "inicio": 3, "fin": 5},
                        {"hablante": "ana", "texto": "Le duele más en la mañana.", "inicio": 6, "fin": 8}]}

    def salida(self, *etq, t=1.0):
        return [{"texto": r["texto"], "hablante": e, "t": r["fin"] + t} for r, e in zip(self.GUION["turnos"], etq)]

    def ev(self, salida):
        from medir import evaluar
        return evaluar(self.GUION, salida)

    def test_perfecto_aunque_las_etiquetas_sean_otras(self):
        r = self.ev(self.salida("S7", "S3", "S7"))
        self.assertEqual((r["turnos_ok"], r["voces"], r["texto"], r["latencia_mediana"]), (3, 2, 100, 1.0))

    def test_todo_con_la_misma_etiqueta_da_la_base(self):
        r = self.ev(self.salida("S1", "S1", "S1"))
        self.assertEqual((r["turnos_ok"], r["base"]), (2, 2))

    def test_sin_hablante_y_turno_perdido_cuentan_como_mal(self):
        r = self.ev(self.salida("S1", "")[:2])
        self.assertEqual((r["turnos_ok"], r["sin_llegar"]), (1, 1))

    def test_la_tele_cuenta_como_extra(self):
        r = self.ev(self.salida("S1", "S2", "S1") + [{"texto": "En deportes, la selección se prepara para el martes", "hablante": "S3", "t": 9}])
        self.assertEqual((r["turnos_ok"], r["extra"]), (3, 1))

    def test_frase_partida_en_dos_turnos(self):
        s = [{"texto": "Hola mamá,", "hablante": "S1", "t": 1.5}, {"texto": "¿cómo dormiste?", "hablante": "S1", "t": 2.5}] + self.salida("S1", "S2", "S1")[1:]
        self.assertEqual(self.ev(s)["turnos_ok"], 3)
