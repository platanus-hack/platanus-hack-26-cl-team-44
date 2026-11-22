import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import agente  # noqa: E402


class TrazaTest(unittest.TestCase):
    def test_marca_fuentes_reales_inventadas_y_sin_memoria(self):
        ctx = {"memorias": {"perfil": [{"id": 1, "tipo": "perfil", "texto": "dato uno"}], "rutina": []},
               "ultimos_encuentros": [{"id": 7, "tipo": "episodio", "texto": "encuentro"}],
               "interlocutor": {"id": "p1", "tipo_interlocutor": "familia"}, "descartadas": [{"id": 9, "motivo": "privada"}],
               "bloqueados": ["salud"]}
        ops = [{"text": "a", "fuentes": ["m1", "m99"], "origen": "agente"},
               {"text": "b", "fuentes": [], "origen": "agente"},
               {"text": "c", "fuentes": [], "origen": "regla"}]
        agente.armar_traza(ctx, ops, [{"text": "x", "motivo": "repetida"}], "agente", "voz", ["h"], "", None)
        self.assertEqual([f["id"] for f in ops[0]["traza"]["fuentes"]], ["m1"])
        self.assertEqual(ops[0]["traza"]["inventadas"], ["m99"])
        self.assertTrue(ops[1]["traza"]["sin_memoria"])
        self.assertEqual(ops[2]["traza"]["origen"], "regla")
        t = ctx["traza"]
        self.assertEqual(t["memorias_en_contexto"], {"perfil": ["m1"]})
        self.assertEqual(t["fuera_por_privacidad"], 1)
        self.assertNotIn("dato", str(t["memorias_en_contexto"]))   # el resumen del contexto lleva ids, no textos


if __name__ == "__main__":
    unittest.main()
