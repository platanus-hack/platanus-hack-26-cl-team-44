"""Pruebas de disparadores de grupo y del modo chat. Sin red y sin modelo (agente falso)."""
from __future__ import annotations

import json
import shutil
import sys
import tempfile
import unittest
from collections import deque
from pathlib import Path

AGENT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AGENT))

import grupos  # noqa: E402
from memoria import contexto, salida, store  # noqa: E402

SEMILLA = json.loads((AGENT / "ejemplos" / "semilla.example.json").read_text(encoding="utf-8"))
GID = "120363000000000000@g.us"


class AgenteFalso:
    """Guarda con qué lo llamaron y devuelve el contexto que habría visto el modelo."""

    def __init__(self):
        self.llamadas = []

    def __call__(self, c, persona, texto, historial=None, modo="voz", extra=None):
        ctx = contexto.armar(c, persona, extra)
        self.llamadas.append({"persona": persona, "texto": texto, "historial": historial, "modo": modo,
                              "extra": extra, "ctx": contexto.a_texto(ctx)})
        return {"modo": modo, "resumen": texto, "persona": persona and persona.get("id"), "opciones": [],
                "descartadas": [], "origen": "falso", "meta": {}, "ultimo_encuentro": ""}


class TestGrupos(unittest.TestCase):
    def setUp(self):
        self.c = store.conectar(":memory:")
        store.cargar_semilla(self.c, SEMILLA)
        self.dir = Path(tempfile.mkdtemp())
        shutil.copy(AGENT / "ejemplos" / "disparadores.example.json", self.dir / "d.json")
        self.d = grupos.Disparadores(self.dir / "d.json")
        grupos._contexto.clear()
        grupos._vistos.clear()
        self.agente = AgenteFalso()

    def tearDown(self):
        shutil.rmtree(self.dir)

    def ev(self, i, texto, tel="+56900000001", menciona=False):
        return {"id": f"m{i}", "grupo_jid": GID, "grupo_nombre": "Familia", "autor_tel": tel,
                "texto": texto, "menciona": menciona}

    def test_pendiente_no_procesa_ni_guarda(self):
        r = grupos.procesar(self.c, self.ev(1, "@Ana ¿vienes?", menciona=True), self.d, self.agente)
        self.assertEqual(r, {"accion": "ignorar", "motivo": "disparador pendiente de aprobación"})
        self.assertEqual(grupos.contexto_de(GID), [])
        self.assertEqual(self.agente.llamadas, [])

    def test_otro_grupo_se_ignora(self):
        self.d.cambiar_estado("familia", "activo")
        r = grupos.procesar(self.c, {**self.ev(1, "hola"), "grupo_jid": "otro@g.us"}, self.d, self.agente)
        self.assertEqual(r["motivo"], "grupo sin disparador activo")

    def test_activo_guarda_contexto_y_responde_la_mencion(self):
        self.d.cambiar_estado("familia", "activo")
        self.assertEqual(grupos.procesar(self.c, self.ev(1, "El sábado es el cumple de Tomi"), self.d, self.agente)["accion"], "guardado")
        self.assertEqual(grupos.procesar(self.c, self.ev(1, "repetido"), self.d, self.agente)["accion"], "repetido")
        r = grupos.procesar(self.c, self.ev(2, "@Ana ¿vienes?", menciona=True), self.d, self.agente)
        self.assertEqual(r["accion"], "mencion")
        self.assertEqual(r["autor"], "Pedro")
        llamada = self.agente.llamadas[0]
        self.assertEqual(llamada["modo"], "mencion")
        self.assertEqual(llamada["historial"], ["Pedro: El sábado es el cumple de Tomi"])
        self.assertEqual(llamada["persona"]["tipo_interlocutor"], "familia")

    def test_limites_de_los_miembros_aplican_en_el_grupo(self):
        """Pedro puede ver el diagnóstico en privado, pero en Familia está Tomás: no sale."""
        self.d.cambiar_estado("familia", "activo")
        grupos.procesar(self.c, self.ev(3, "@Ana ¿cómo sigues?", menciona=True), self.d, self.agente)
        llamada = self.agente.llamadas[0]
        self.assertIn("diagnostico", llamada["extra"])
        self.assertNotIn("ELA", llamada["ctx"])
        privado = contexto.a_texto(contexto.armar(self.c, store.persona(self.c, "pedro")))
        self.assertIn("ELA", privado)

    def test_autor_desconocido_en_grupo(self):
        self.d.cambiar_estado("familia", "activo")
        r = grupos.procesar(self.c, {**self.ev(4, "@Ana hola", tel="+56999999999", menciona=True), "autor_nombre": "Primo Juan"},
                            self.d, self.agente)
        self.assertEqual(r["autor"], "Primo Juan")
        self.assertIsNone(self.agente.llamadas[0]["persona"]["id"])

    def test_estado_invalido(self):
        with self.assertRaises(ValueError):
            self.d.cambiar_estado("familia", "borrado")
        with self.assertRaises(KeyError):
            self.d.cambiar_estado("no-existe", "activo")


class TestModoChat(unittest.TestCase):
    def setUp(self):
        self.c = store.conectar(":memory:")
        store.cargar_semilla(self.c, SEMILLA)

    def test_chat_entrega_6_sin_neutral_y_maximo_8_palabras(self):
        ops = [{"text": "Sí, obvio"}, {"text": "una frase que tiene muchas más de ocho palabras en total"}]
        ok, fuera = salida.validar(self.c, ops, None, n=6, max_palabras=8, neutral=False)
        self.assertEqual(len(ok), 6)
        self.assertNotIn("Después te respondo", [o["text"] for o in ok])
        self.assertEqual(fuera[0]["motivo"], "más de 8 palabras")

    def test_meta_variante_y_genero(self):
        self.assertEqual(store.meta(self.c, "variante"), "español de Chile, con tuteo")
        self.assertEqual(store.meta(self.c, "genero"), "femenino")


if __name__ == "__main__":
    unittest.main()


class Token(unittest.TestCase):
    def test_local_sin_proxy_pasa_y_por_proxy_exige_token(self):
        import server
        self.assertTrue(server.autorizado({}, "/api/salud", token="t0k"))
        proxy = {"X-Forwarded-For": "1.2.3.4"}
        self.assertFalse(server.autorizado(proxy, "/api/salud", token="t0k"))
        self.assertTrue(server.autorizado({**proxy, "X-Woki-Token": "t0k"}, "/api/salud", token="t0k"))
        self.assertFalse(server.autorizado(proxy, "/api/eventos?token=t0k", token="t0k"))   # nunca por la URL
        self.assertFalse(server.autorizado(proxy, "/api/personas?token=t0k", token="t0k"))
        self.assertTrue(server.autorizado(proxy, "/api/salud", token=""))
