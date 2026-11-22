"""Pruebas de la escucha: privacidad según quién habla y tarjetas por tema. Sin red y sin modelo.

    python3 -m unittest discover software/agent/tests
"""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

AGENT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AGENT))

import hablantes  # noqa: E402
import tarjetas  # noqa: E402
from memoria import store  # noqa: E402
from memoria.filtros import VISIBLE  # noqa: E402

SEMILLA = json.loads((AGENT / "ejemplos" / "semilla.example.json").read_text(encoding="utf-8"))
NADA = Path("/nonexistent")


class Base(unittest.TestCase):
    def setUp(self):
        self.c = store.conectar(":memory:")
        store.cargar_semilla(self.c, SEMILLA)

    def aud(self, body):
        return hablantes.audiencia(self.c, body, hablantes.persona_escucha(self.c, body, lambda c, b: None))


class TestAudiencia(Base):
    def test_sin_hablantes_no_cambia_nada(self):
        p = store.persona(self.c, "sofi")
        self.assertEqual(hablantes.audiencia(self.c, {}, p), (p, "familia"))

    def test_familia_sola(self):
        p, tipo = self.aud({"persona": "sofi", "hablantes": ["sofi"]})
        self.assertEqual((p["id"], tipo), ("sofi", "familia"))

    def test_familia_con_medico_baja_a_medico(self):
        p, tipo = self.aud({"persona": "sofi", "hablantes": ["sofi", "dra_perez"]})
        self.assertEqual(tipo, "medico")
        self.assertEqual(p["id"], "sofi")                    # sigue siendo Sofía (trato, encuentros)
        self.assertEqual(p["tipo_interlocutor"], "medico")   # pero no ve más que la médica

    def test_voz_sin_identificar_es_desconocido(self):
        p, tipo = self.aud({"persona": "sofi", "hablantes": ["sofi", None]})
        self.assertEqual(tipo, "desconocido")
        self.assertEqual(p["tipo_interlocutor"], "desconocido")

    def test_persona_inexistente_cuenta_como_desconocido(self):
        _, tipo = self.aud({"persona": "sofi", "hablantes": ["sofi", "nadie"]})
        self.assertEqual(tipo, "desconocido")

    def test_con_hablantes_no_adivina_por_nombres(self):
        """Si nadie dijo quién habla, nombrar a Sofía en el texto no da acceso de familia."""
        p, tipo = self.aud({"texto": "Sofía dijo que viene", "hablantes": [None]})
        self.assertIsNone(p)
        self.assertEqual(tipo, "desconocido")

    def test_nunca_amplia_privacidad(self):
        for a in ["sofi", "dra_perez", None]:
            for b in ["sofi", "dra_perez", None]:
                pid = a or "sofi"
                p, tipo = self.aud({"persona": pid, "hablantes": [a, b]})
                visto = set(VISIBLE[p["tipo_interlocutor"]]) if p else set(VISIBLE["desconocido"])
                for h in (a, b):
                    q = store.persona(self.c, h) if h else None
                    self.assertTrue(visto <= set(VISIBLE[q["tipo_interlocutor"] if q else "desconocido"]))


class TestTemasNombresPropios(unittest.TestCase):
    """Un tema por comienzo de palabra no debe marcar un nombre propio («plata» ≠ «Platanus»)."""
    T = {"dinero": ["plata"], "salud": ["endocrin", "mounjaro"]}

    def temas(self, t):
        from memoria import filtros
        return filtros.temas_de_texto(t, self.T)

    def test_nombre_propio_no_calza_por_prefijo(self):
        self.assertEqual(self.temas("Fueron a la final de Platanus Hack."), set())

    def test_palabra_comun_y_comienzo_de_oracion_si(self):
        self.assertEqual(self.temas("No hay plata."), {"dinero"})
        self.assertEqual(self.temas("Plata no hay."), {"dinero"})

    def test_prefijo_en_palabra_comun_y_nombre_exacto(self):
        self.assertEqual(self.temas("Empezó con endocrinología."), {"salud"})
        self.assertEqual(self.temas("Usa Mounjaro."), {"salud"})


class TestIniciales(unittest.TestCase):
    def test_iniciales_de(self):
        from agente import iniciales_de   # noqa: PLC0415 (agente importa el SDK solo al consultar)
        self.assertEqual(iniciales_de("¿Ya voy, amor?"), "yva")
        self.assertEqual(iniciales_de("Sí, ñoño"), "sn")   # igual que fold() en la TV: la ñ cuenta como n


class TestTarjetas(unittest.TestCase):
    def ordenar(self, texto, tipo="familia", usuaria=NADA, uso=NADA, presentes=(), ultima=None):
        return tarjetas.ordenar([{"speaker": "partner", "text": texto}], tipo, set(VISIBLE[tipo]), usuaria, uso,
                                list(presentes), ultima)

    def test_tema_y_palabras(self):
        r = self.ordenar("Buenas tardes, ¿le duele mucho la espalda hoy?")
        self.assertEqual(r["tema"]["id"], "dolor")
        self.assertEqual(r["tarjetas"][0]["texto"], "Me duele la espalda")

    def test_sin_tema_no_inventa(self):
        self.assertEqual(self.ordenar("Mira esta foto")["tarjetas"], [])

    def test_tarjeta_propia_por_persona_y_privacidad(self):
        with tempfile.TemporaryDirectory() as d:
            u = Path(d) / "tarjetas.json"
            u.write_text(json.dumps({"tarjetas": [
                {"id": "u1", "tema": "dolor", "texto": "Me duele la espalda baja", "personas": ["camila"], "privacidad": "salud"}]}))
            arriba = self.ordenar("¿Le duele la espalda?", "familia", u, presentes=["camila"], ultima="camila")
            self.assertEqual(arriba["tarjetas"][0]["id"], "u1")
            otra = self.ordenar("¿Le duele la espalda?", "familia", u, presentes=["sofi"], ultima="sofi")
            self.assertNotIn("u1", [t["id"] for t in otra["tarjetas"]])     # Camila no está
            extrano = self.ordenar("¿Le duele la espalda?", "desconocido", u, presentes=["camila"], ultima="camila")
            self.assertNotIn("u1", [t["id"] for t in extrano["tarjetas"]])  # salud no sale con un desconocido

    def test_aprende_con_el_uso(self):
        with tempfile.TemporaryDirectory() as d:
            uso = Path(d) / "uso.jsonl"
            antes = [t["id"] for t in self.ordenar("¿Quieres tomar algo?", uso=uso)["tarjetas"]]
            elegida = antes[-1]
            for _ in range(3):
                tarjetas.registrar_uso(elegida, "bebida", "sofi", uso)
            despues = [t["id"] for t in self.ordenar("¿Quieres tomar algo?", uso=uso, presentes=["sofi"], ultima="sofi")["tarjetas"]]
            self.assertLess(despues.index(elegida), antes.index(elegida))


if __name__ == "__main__":
    unittest.main()
