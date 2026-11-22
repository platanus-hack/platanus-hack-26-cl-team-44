"""Pruebas de normalización de solicitudes HTTP, sin red ni modelo."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import solicitudes  # noqa: E402


class TestSolicitudes(unittest.TestCase):
    def test_texto_limpia_y_limita(self):
        self.assertEqual(solicitudes.texto({"texto": "  hola  "}, 20), "hola")
        self.assertEqual(solicitudes.texto({"texto": "abcdef"}, 3), "abc")
        self.assertEqual(solicitudes.texto({}, 3), "")

    def test_historial_limita_elementos_y_caracteres(self):
        body = {"historial": ["a" * 510, "dos", "tres", "cuatro"]}
        self.assertEqual(solicitudes.historial(body, 3), ["dos", "tres", "cuatro"])
        self.assertEqual(len(solicitudes.historial({"historial": ["x" * 510]})[0]), 500)

    def test_excluir_limita_elementos_y_caracteres(self):
        result = solicitudes.excluir({"excluir": ["x" * 210, "dos"] * 11})
        self.assertEqual(len(result), 20)
        self.assertEqual(len(result[0]), 200)

    def test_iniciales_filtra_y_limita(self):
        self.assertEqual(solicitudes.iniciales({"iniciales": " ¡Áb-c_Ñ! "}), "ábcñ")
        self.assertEqual(len(solicitudes.iniciales({"iniciales": "a" * 30})), 16)


if __name__ == "__main__":
    unittest.main()
