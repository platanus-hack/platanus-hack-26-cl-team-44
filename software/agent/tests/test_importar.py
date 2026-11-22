"""Pruebas del importador de WhatsApp con un chat ficticio. Sin red y sin modelo.

    python3 -m unittest discover software/agent/tests
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

AGENT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AGENT))

from memoria import importar  # noqa: E402

IOS = """‎[01/10/26, 9:05:06 PM] Ana: Ya voy para la casa
[01/10/26, 9:05:10 PM] Pedro: dale
[01/10/26, 9:06:00 PM] Ana: oye, traes pan?
segunda línea del mismo mensaje
‎[01/10/26, 9:07:00 PM] Ana: imagen omitida
[01/10/26, 9:08:00 PM] Ana: mi número es 56912345678
[01/10/26, 9:09:00 PM] Ana: mira https://ejemplo.cl/x
[02/10/26, 8:00:00 AM] Ana: jajaja obvio que sí ✨
[02/10/26, 8:01:00 AM] Ana: <td valign=top>tabla</td>
"""
ANDROID = """01/10/26, 21:05 - Ana: Ya voy para la casa
01/10/26, 21:06 - Pedro: ok
"""


class Parseo(unittest.TestCase):
    def test_ios(self):
        ms = importar.parsear(IOS)
        self.assertEqual(ms[0], {"fecha": "2026-10-01", "hora": "21:05", "autor": "Ana", "texto": "Ya voy para la casa"})
        self.assertIn("segunda línea", ms[2]["texto"])
        self.assertFalse(any("omitida" in m["texto"] for m in ms))
        self.assertEqual(ms[-2]["hora"], "08:00")

    def test_android(self):
        ms = importar.parsear(ANDROID)
        self.assertEqual([m["autor"] for m in ms], ["Ana", "Pedro"])
        self.assertEqual(ms[0]["hora"], "21:05")


class Extraccion(unittest.TestCase):
    def setUp(self):
        self.ms = importar.parsear(IOS)

    def test_estilo_sin_datos_sensibles(self):
        frases = importar.estilo(self.ms, "Ana", min_pal=2)
        self.assertIn("Ya voy para la casa", frases)
        self.assertFalse(any(ch.isdigit() for f in frases for ch in f))
        self.assertFalse(any("http" in f or "<" in f for f in frases))

    def test_lexico_risa_y_emoji(self):
        lex = importar.lexico(self.ms, "Ana", minimo=1, min_dias=1)
        self.assertEqual(lex["risa"], "jajaja")
        self.assertIn("✨", lex["emojis"])
        self.assertNotIn("valign", lex["palabras"])

    def test_memorias_quedan_en_propuesta(self):
        mems = importar.a_memorias(importar.lexico(self.ms, "Ana", minimo=1, min_dias=1),
                                   ["Ya voy para la casa"], importar.medidas(self.ms, "Ana"), "pedro")
        self.assertTrue(all(m["estado"] == "propuesta" and m["fuente"] == "whatsapp" for m in mems))
        frase = next(m for m in mems if m["texto"] == "Ya voy para la casa")
        self.assertEqual((frase["privacidad"], frase["personas"]), ("familia", ["pedro"]))


if __name__ == "__main__":
    unittest.main()
