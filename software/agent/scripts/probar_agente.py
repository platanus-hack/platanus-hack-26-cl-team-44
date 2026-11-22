"""Prueba el agente de 1 turno desde la terminal. TOKI_LLM elige la suscripción de Claude Code o la API (llm.py).

    software/agent/.venv/bin/python software/agent/scripts/probar_agente.py \\
        --texto "Hola Anita, soy Pedrito. ¿Vamos al cumple de Tomi el sábado?"
    ... --persona tomas --texto "Abuela, ¿por qué no puedes hablar?"
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

AGENT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AGENT))

import llm  # noqa: E402
from agente import run_agent  # noqa: E402
from memoria import store  # noqa: E402

DB = AGENT / "data" / "memoria.db"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--persona")
    ap.add_argument("--texto", required=True)
    a = ap.parse_args()
    modo = llm.backend()
    print(f"llm: {modo}")
    if modo == "suscripcion" and os.environ.get("ANTHROPIC_API_KEY"):
        print("Aviso: ANTHROPIC_API_KEY está definida; en modo suscripcion, Claude Code la usa en vez de la suscripción.")
    if not DB.exists():
        sys.exit("Falta la base. Corre primero: python3 software/agent/scripts/semilla.py")
    c = store.conectar(DB)
    pid = a.persona or next(iter(store.detectar_personas(c, a.texto)), None)
    p = store.persona(c, pid) if pid else None
    r = run_agent(c, p, a.texto)
    print(f"Interlocutor: {r['persona'] or 'desconocido'}  ·  origen: {r['origen']}  ·  {r['meta']}")
    print(f"Resumen: {r['resumen']}")
    if r["ultimo_encuentro"]:
        print(r["ultimo_encuentro"])
    for i, o in enumerate(r["opciones"], 1):
        f = f"  fuentes: {', '.join(o['fuentes'])}" if o["fuentes"] else ""
        print(f"  {i}. [{o['emo']}] {o['text']}  ({o['origen']}){f}")
    for o in r["descartadas"]:
        print(f"  ✗ {o.get('text')}  ← {o['motivo']}")


if __name__ == "__main__":
    main()
