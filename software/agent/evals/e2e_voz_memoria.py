"""E2E: voz → huella → persona → privacidad y memoria → sugerencias, contra el agente real.

    python3 software/agent/evals/e2e_voz_memoria.py --agente http://127.0.0.1:18790 \
        --voz-prueba /tmp/e2evoz/Jorge.raw --voz-otra /tmp/e2evoz/Paulina.raw --persona-prueba roberto

Usa audio PCM 16 kHz mono s16le. La voz de prueba (sintética) se registra un momento con --persona-prueba
y se borra al final. La huella de la persona real (--persona-real, por defecto juan) ya debe estar registrada.
Hace llamadas reales al modelo (unas 4). Pensado para un túnel SSH al agente: sin proxy no pide token.
No imprime memorias completas: solo ids, conteos y el texto de las opciones.
"""
from __future__ import annotations

import argparse
import base64
import json
import sys
import urllib.request

RATE = 16000 * 2   # bytes por segundo


def post(base: str, path: str, body: dict, timeout: int = 60) -> dict:
    req = urllib.request.Request(base + path, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def get(base: str, path: str) -> dict:
    with urllib.request.urlopen(base + path, timeout=15) as r:
        return json.loads(r.read())


def trozo(raw: bytes, desde: float, hasta: float | None = None) -> str:
    a, b = int(desde * RATE), (int(hasta * RATE) if hasta else len(raw))
    return base64.b64encode(raw[a - a % 2: b - b % 2]).decode()


class Resultado:
    def __init__(self):
        self.filas: list[tuple[str, bool, str]] = []

    def check(self, nombre: str, ok: bool, detalle: str = ""):
        self.filas.append((nombre, bool(ok), detalle))
        print(f"{'✅' if ok else '❌'} {nombre}" + (f" · {detalle}" if detalle else ""), flush=True)


def sugerir(base: str, texto: str, persona: str | None) -> dict:
    body = {"texto": texto, "modo": "voz", "traza": True}
    if persona:
        body["persona"] = persona
    return post(base, "/api/sugerir", body, timeout=90)


def resumen(r: dict) -> dict:
    t = r.get("traza") or {}
    fuentes = sorted({f for o in r.get("opciones", []) for f in (o.get("fuentes") or [])})
    return {"interlocutor": t.get("interlocutor"), "privacidad": t.get("privacidad"),
            "visibles": len(t.get("visibles_por_privacidad") or []), "fuera_privacidad": t.get("fuera_por_privacidad"),
            "pasan_compuerta": (t.get("compuerta") or {}).get("pasan"), "tono_de": t.get("tono_de"),
            "origen": r.get("origen"), "fuentes": fuentes, "opciones": [o.get("text") for o in r.get("opciones", [])]}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--agente", required=True)
    ap.add_argument("--voz-prueba", required=True, help="PCM de una voz que se registra solo durante la prueba")
    ap.add_argument("--voz-otra", required=True, help="PCM de una voz que nunca se registra")
    ap.add_argument("--persona-prueba", required=True, help="id de persona de la memoria para la voz de prueba")
    ap.add_argument("--persona-real", default="juan")
    a = ap.parse_args()
    R = Resultado()
    prueba, otra = open(a.voz_prueba, "rb").read(), open(a.voz_otra, "rb").read()

    print("\n== 1. Huellas")
    lista = get(a.agente, "/api/voces/lista").get("personas", [])
    R.check(f"{a.persona_real} tiene huella registrada", any(p["persona"] == a.persona_real for p in lista),
            f"{len(lista)} persona(s) con huella")
    previa = any(p["persona"] == a.persona_prueba for p in lista)
    R.check(f"{a.persona_prueba} no tenía huella antes de la prueba", not previa)
    if previa:
        return 1
    try:
        reg = post(a.agente, "/api/voces/registrar", {"persona": a.persona_prueba, "audio": trozo(prueba, 0, 9.5),
                   "consentimiento": {"acepta": True, "texto": "voz sintética de prueba e2e, se borra al terminar"}})
        R.check("registrar la voz de prueba", reg.get("ok"), f"{reg.get('segundos')} s de voz")
        q1 = post(a.agente, "/api/voces/quien", {"audio": trozo(prueba, 9.5)})
        R.check(f"la voz de prueba se reconoce como {a.persona_prueba}", q1.get("persona") == a.persona_prueba,
                f"parecido {q1.get('score')}")
        q2 = post(a.agente, "/api/voces/quien", {"audio": trozo(otra, 0)})
        R.check("una voz no registrada queda sin nombre", q2.get("persona") is None, f"parecido {q2.get('score')}")
        R.check(f"ninguna de las 2 voces sale como {a.persona_real}",
                a.persona_real not in (q1.get("persona"), q2.get("persona")))

        print("\n== 2. La persona reconocida cambia el contexto del agente")
        texto = "¿Qué le pedimos para el aniversario?"
        casos = {a.persona_real: sugerir(a.agente, texto, a.persona_real),
                 a.persona_prueba: sugerir(a.agente, texto, q1.get("persona")),
                 "sin nombre": sugerir(a.agente, texto, None)}
        res = {k: resumen(v) for k, v in casos.items()}
        for k, s in res.items():
            print(f"   [{k}] interlocutor={s['interlocutor']} privacidad={s['privacidad']} visibles={s['visibles']} "
                  f"fuera_por_privacidad={s['fuera_privacidad']} tono_de={s['tono_de']} origen={s['origen']} fuentes={s['fuentes']}")
            for o in s["opciones"]:
                print(f"       · {o}")
        R.check(f"con {a.persona_real}, el agente sabe que habla {a.persona_real}", res[a.persona_real]["interlocutor"] == a.persona_real)
        R.check(f"con {a.persona_prueba}, el agente sabe que habla {a.persona_prueba}", res[a.persona_prueba]["interlocutor"] == a.persona_prueba)
        R.check("sin nombre, el agente no supone a nadie", res["sin nombre"]["interlocutor"] in (None, "", "desconocido"))
        R.check("las 3 respuestas salen del agente (no de reglas)", all(s["origen"] == "agente" for s in res.values()))
        R.check("la privacidad cambia según quién habla",
                len({(s["privacidad"], s["visibles"]) for s in res.values()}) > 1,
                ", ".join(f"{k}: {s['privacidad']}/{s['visibles']}" for k, s in res.items()))

        print("\n== 3. Una memoria de la persona entra cuando el turno la pide")
        r = resumen(sugerir(a.agente, f"¿Qué le pedimos a {a.persona_real.capitalize()} para el aniversario?", a.persona_real))
        print(f"   fuentes={r['fuentes']} pasan_compuerta={r['pasan_compuerta']}")
        for o in r["opciones"]:
            print(f"       · {o}")
        R.check("al menos 1 opción cita una memoria", bool(r["fuentes"]))
        R.check("como mucho 1 opción con dato de memoria", len(r["fuentes"]) <= 1, f"fuentes={r['fuentes']}")
    finally:
        b = post(a.agente, "/api/voces/borrar", {"persona": a.persona_prueba})
        quedan = [p["persona"] for p in get(a.agente, "/api/voces/lista").get("personas", [])]
        R.check("la huella de prueba se borró al final", b.get("ok") and a.persona_prueba not in quedan, f"quedan: {quedan}")

    ok = sum(1 for _, x, _ in R.filas if x)
    print(f"\n{ok} de {len(R.filas)} comprobaciones OK")
    return 0 if ok == len(R.filas) else 1


if __name__ == "__main__":
    sys.exit(main())
