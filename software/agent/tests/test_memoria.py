"""Pruebas de la memoria mínima. Sin red y sin modelo.

    python3 -m unittest discover software/agent/tests
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

AGENT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AGENT))

from memoria import contexto, filtros, salida, store  # noqa: E402

SEMILLA = json.loads((AGENT / "ejemplos" / "semilla.example.json").read_text(encoding="utf-8"))


class Base(unittest.TestCase):
    def setUp(self):
        self.c = store.conectar(":memory:")
        store.cargar_semilla(self.c, SEMILLA)

    def ctx(self, pid):
        return contexto.armar(self.c, store.persona(self.c, pid) if pid else None)

    def textos(self, ctx):
        return " ".join(m["texto"] for ms in ctx["memorias"].values() for m in ms)


class TestFiltros(Base):
    def test_deny_nunca_sale_con_ninguna_persona(self):
        """Para cada persona, ninguna memoria visible toca un tema bloqueado para ella."""
        tms = store.temas(self.c)
        for p in store.personas(self.c) + [None]:
            bloqueados = filtros.temas_bloqueados(store.limites(self.c), p)
            ok, _ = filtros.visibles(self.c, p)
            for m in ok:
                tocados = (set(m["temas"]) | filtros.temas_de_texto(m["texto"], tms)) & bloqueados
                self.assertFalse(tocados, f"{p and p['id']} ve m{m['id']} con {tocados}")

    def test_nieto_no_ve_diagnostico(self):
        self.assertNotIn("ELA", self.textos(self.ctx("tomas")))

    def test_medico_ve_salud_y_no_familia(self):
        t = self.textos(self.ctx("dra_perez"))
        self.assertIn("dosis", t)
        self.assertNotIn("pastel de choclo", t)

    def test_desconocido_solo_publico_y_sin_dinero(self):
        ok, _ = filtros.visibles(self.c, None)
        self.assertTrue(all(m["privacidad"] == "publico" for m in ok))
        self.assertNotIn("arriendo", self.textos(self.ctx(None)))

    def test_propuestas_no_aprobadas_no_salen(self):
        self.assertNotIn("sushi", self.textos(self.ctx("pedro")))


class TestContexto(Base):
    def test_ultimos_encuentros_ordenados_y_filtrados(self):
        e = self.ctx("pedro")["ultimos_encuentros"]
        self.assertEqual([m["fecha"] for m in e], ["2026-11-16", "2026-11-09", "2026-10-22"])

    def test_texto_lleva_fuentes(self):
        txt = contexto.a_texto(self.ctx("pedro"))
        self.assertIn("Hablas como Ana. Te habla Pedro (pareja", txt)
        self.assertRegex(txt, r"\[m\d+\] 2026-11-16")

    def test_detecta_persona_por_apodo(self):
        self.assertEqual(store.detectar_personas(self.c, "Hola, soy la Sofi"), ["sofi"])
        self.assertEqual(store.detectar_personas(self.c, "¿Vamos al cumple de Tomi?"), ["tomas"])
        self.assertEqual(store.detectar_personas(self.c, "Hola"), [])

    def test_persona_por_telefono(self):
        self.assertEqual(store.persona_por_telefono(self.c, "+56 9 0000 0001")["id"], "pedro")


class TestSalida(Base):
    def test_quita_tema_bloqueado_y_completa_a_4(self):
        p = store.persona(self.c, "tomas")
        ok, fuera = salida.validar(self.c, [{"text": "Tengo ELA, Tomi"}, {"text": "¡Obvio voy a tu cumple!"}], p)
        self.assertEqual(len(ok), 4)
        self.assertEqual(ok[-1]["text"], "Después te respondo")
        self.assertEqual(fuera[0]["motivo"], "toca un tema con límite para este interlocutor")
        self.assertIn("¡Obvio voy a tu cumple!", [o["text"] for o in ok])

    def test_largas_y_repetidas(self):
        larga = " ".join(["palabra"] * 16)
        ok, fuera = salida.validar(self.c, [{"text": larga}, {"text": "Sí"}, {"text": "sí"}], None)
        self.assertEqual({f["motivo"] for f in fuera}, {"más de 15 palabras", "repetida"})
        self.assertEqual(len(ok), 4)

    def test_sin_opciones_del_modelo(self):
        ok, _ = salida.validar(self.c, [], None)
        self.assertEqual([o["text"] for o in ok], ["Sí", "No", "Déjame pensarlo", "Después te respondo"])


if __name__ == "__main__":
    unittest.main()


class Pedido(Base):
    """Pedido proactivo sin modelo: si el agente falla, vuelve a las categorías de siempre."""
    def test_sin_modelo_devuelve_reglas(self):
        import pedido

        async def falla(*a, **k):
            raise RuntimeError("sin red")
        original = pedido._consultar
        pedido._consultar = falla
        try:
            r = pedido.plan(self.c, para="pedro", ocasion="aniversario")
        finally:
            pedido._consultar = original
        self.assertEqual((r["origen"], r["query"], r["para"]), ("reglas", "", "pedro"))

    def test_persona_desconocida(self):
        import pedido
        with self.assertRaises(ValueError):
            pedido.plan(self.c, para="nadie")
