"""Instancia demo del agente (TV pública): su propia carpeta, su token y las rutas que escriben, rechazadas.

Sin modelo: no llama a /api/sugerir, /api/iniciales, /api/pedido ni /api/simular.
"""
import importlib.util
import json
import os
import re
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest import mock

AGENT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AGENT))

import tarjetas  # noqa: E402
from memoria import store  # noqa: E402

SEMILLA_DEMO = AGENT / "ejemplos" / "semilla.demo.json"
TOKEN = "demo-t0k"


def cargar_server(env: dict):
    """Ejecuta server.py como un módulo aparte con ese entorno (lee la configuración al importarse)."""
    with mock.patch.dict(os.environ, env):
        spec = importlib.util.spec_from_file_location("server_demo", AGENT / "server.py")
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
    return mod


class Demo(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.data = Path(cls.tmp.name)
        c = store.conectar(cls.data / "memoria.db")
        store.cargar_semilla(c, json.loads(SEMILLA_DEMO.read_text(encoding="utf-8")))
        c.close()
        cls.srv = cargar_server({"TOKI_DATA": str(cls.data), "TOKI_DEMO": "1", "TOKI_TOKEN": TOKEN,
                                 "TOKI_ORIGENES": "https://demo.example"})
        # server usa tarjetas.USUARIA y tarjetas.USO al atender: en la prueba, la carpeta temporal
        cls.antes = (tarjetas.USUARIA, tarjetas.USO)
        tarjetas.USUARIA, tarjetas.USO = cls.data / "tarjetas.json", cls.data / "tarjetas_uso.jsonl"
        cls.httpd = ThreadingHTTPServer(("127.0.0.1", 0), cls.srv.Handler)
        cls.httpd.daemon_threads = True
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()
        cls.base = f"http://127.0.0.1:{cls.httpd.server_address[1]}"

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        tarjetas.USUARIA, tarjetas.USO = cls.antes
        cls.tmp.cleanup()

    def pedir(self, path: str, body: dict | None = None, proxy: bool = True, token: str | None = TOKEN) -> tuple[int, dict]:
        h = {"Content-Type": "application/json"}
        if proxy:   # como llega por Caddy
            h["X-Forwarded-For"] = "203.0.113.7"
        if token:
            h["X-Myo-Token"] = token
        req = urllib.request.Request(self.base + path, data=None if body is None else json.dumps(body).encode(),
                                     method="GET" if body is None else "POST", headers=h)
        try:
            with urllib.request.urlopen(req, timeout=5) as r:
                return r.status, json.loads(r.read() or b"{}")
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read() or b"{}")

    def test_salud_dice_demo_y_usa_la_memoria_ficticia(self):
        code, j = self.pedir("/api/salud", proxy=False, token=None)   # local directo, como toki.sh estado
        self.assertEqual(code, 200)
        self.assertTrue(j["demo"])
        self.assertEqual(j["usuaria"], "Ana")
        self.assertEqual(j["disparadores"], [])

    def test_por_el_proxy_exige_su_propio_token(self):
        self.assertEqual(self.pedir("/api/personas", token=None)[0], 401)
        self.assertEqual(self.pedir("/api/personas", token="otro")[0], 401)
        code, personas = self.pedir("/api/personas")
        self.assertEqual(code, 200)
        self.assertIn("pedro", [p["id"] for p in personas])

    def test_rutas_que_escriben_o_usan_voces_dan_403(self):
        for path, body in [("/api/tarjetas/uso", {"tarjeta_id": "x", "tema": "comida"}),
                           ("/api/seleccion", {"canal": "voz", "origen": "agente"}),
                           ("/api/disparadores/estado", {"id": "familia", "estado": "activo"}),
                           ("/api/grupo", {"grupo_jid": "1@g.us", "texto": "hola @Ana", "menciona": True}),
                           ("/api/voces/registrar", {"persona": "pedro", "audio": ""}),
                           ("/api/voces/borrar", {"persona": "pedro"}),
                           ("/api/voces/quien", {"audio": ""})]:
            with self.subTest(path=path):
                code, j = self.pedir(path, body)
                self.assertEqual(code, 403)
                self.assertFalse(j["ok"])
        for path in ("/api/voces/config", "/api/voces/huella"):
            with self.subTest(path=path):
                self.assertEqual(self.pedir(path)[0], 403)
        escritos = sorted(p.name for p in self.data.iterdir() if p.name != "memoria.db")
        self.assertEqual(escritos, [], "la demo no escribe archivos")

    def test_lista_de_voces_vacia_sin_preguntar_al_servicio_de_voces(self):
        def nunca(*a, **k):
            raise AssertionError("la demo no debe llamar al servicio de voces")
        with mock.patch.object(self.srv, "a_voces", nunca):
            for path in ("/api/voces/lista", "/api/voces/lista?x=1"):
                with self.subTest(path=path):
                    self.assertEqual(self.pedir(path), (200, {"ok": True, "personas": []}))
            self.assertEqual(self.pedir("/api/voces/registrar", {"persona": "pedro", "audio": ""})[0], 403)

    def test_tarjetas_por_tema_siguen_funcionando(self):
        code, j = self.pedir("/api/tarjetas", {"texto": "¿Tienes hambre? ¿Quieres comer algo?", "persona": "sofi"})
        self.assertEqual(code, 200)
        self.assertTrue(j["tarjetas"])

    def test_sin_demo_no_bloquea_nada(self):
        self.assertFalse(self.srv.fuera_de_demo("/api/tarjetas/uso", demo=False))
        self.assertTrue(self.srv.fuera_de_demo("/api/voces/lista", demo=True))
        self.assertFalse(self.srv.fuera_de_demo("/api/sugerir", demo=True))
        self.assertFalse(self.srv.fuera_de_demo("/api/tarjetas", demo=True))

    def test_demo_nunca_arranca_con_la_carpeta_real(self):
        with mock.patch.object(self.srv, "DATA", self.srv.DATA_REAL):
            with self.assertRaises(SystemExit):
                self.srv.main()


class SemillaDemo(unittest.TestCase):
    def test_ficticia_neutral_y_con_las_personas_del_panel_dev(self):
        texto = SEMILLA_DEMO.read_text(encoding="utf-8")
        semilla = json.loads(texto)
        ids = {p["id"] for p in semilla["personas"]}
        self.assertTrue({"pedro", "sofi", "tomas", "dra_perez"} <= ids)   # ejemplos de toki-os/dev-agente.js
        self.assertFalse(any(p.get("telefono") for p in semilla["personas"]))
        self.assertNotIn("+56", texto)
        self.assertIsNone(re.search(r"\b(arriendo|kine|cachai|once|po)\b", texto.lower()))   # sin chilenismos


if __name__ == "__main__":
    unittest.main()
