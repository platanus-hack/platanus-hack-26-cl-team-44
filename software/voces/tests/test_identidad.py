import base64
import stat
import struct
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np

import identidad


class VoiceIdentityTest(unittest.TestCase):
    def setUp(self):
        directory = self.enterContext(tempfile.TemporaryDirectory())
        self.path = Path(directory) / "voces.json"
        self.enterContext(patch.object(identidad, "DATOS", self.path))
        self.enterContext(patch.object(identidad, "UMBRAL", 0.75))
        self.enterContext(patch.object(identidad, "MARGEN", 0.05))

    def test_enrollment_averages_samples_and_can_be_withdrawn(self):
        self.assertEqual(identidad.registrar("Fixture", np.array([1, 0]), 8.0, "Consent"), 1)
        self.assertEqual(identidad.registrar("Fixture", np.array([0, 1]), 8.5, "Consent"), 2)
        item = identidad.leer()["Fixture"]
        self.assertEqual(item["huella"], [0.707107, 0.707107])
        self.assertEqual(item["segundos"], 16.5)
        self.assertEqual(item["consentimiento"]["texto"], "Consent")
        self.assertEqual(stat.S_IMODE(self.path.stat().st_mode), 0o600)
        self.assertTrue(identidad.borrar("Fixture"))
        self.assertFalse(identidad.borrar("Fixture"))
        self.assertEqual(identidad.leer(), {})

    def test_matching_requires_a_clear_winner(self):
        identidad.registrar("A", np.array([1, 0]), 8.0, "Consent")
        with patch.object(identidad, "huella", return_value=(np.array([1, 0]), 1.0)):
            self.assertEqual(identidad.quien(np.array([]))["persona"], "A")
            identidad.registrar("B", np.array([1, 0]), 8.0, "Consent")
            result = identidad.quien(np.array([]))
        self.assertIsNone(result["persona"])
        self.assertEqual(result["motivo"], "se parece a dos personas")

    def test_pcm_is_signed_little_endian_with_normalized_values(self):
        audio = base64.b64encode(struct.pack("<hhh", -32768, 0, 16384) + b"\xff").decode()
        np.testing.assert_array_equal(identidad.pcm(audio), [-1, 0, 0.5])
