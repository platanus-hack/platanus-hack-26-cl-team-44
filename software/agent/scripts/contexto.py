"""Muestra qué ve el agente para un interlocutor y un mensaje, sin llamar a ningún modelo.

    python3 software/agent/scripts/contexto.py --persona pedro --texto "¿Vamos al cumple de Tomi el sábado?"
    python3 software/agent/scripts/contexto.py --texto "Hola, soy Sofi"        # detecta a la persona por nombre
    python3 software/agent/scripts/contexto.py --persona tomas --opciones "Tengo ELA|¡Obvio voy!|Sí"
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

AGENT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AGENT))

from memoria import contexto, salida, store  # noqa: E402

DB = AGENT / "data" / "memoria.db"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--persona", help="id de la persona (pedro, sofi, tomas, dra_perez...)")
    ap.add_argument("--texto", default="", help="lo que dijo o escribió el interlocutor")
    ap.add_argument("--opciones", help="opciones del modelo separadas por |, para probar el filtro de salida")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()

    if not DB.exists():
        sys.exit("Falta la base. Corre primero: python3 software/agent/scripts/semilla.py")
    c = store.conectar(DB)
    pid = a.persona
    if not pid and a.texto:
        nombradas = store.detectar_personas(c, a.texto)
        pid = nombradas[0] if nombradas else None
        print(f"Identidad por nombre en el texto: {pid or 'nadie'}")
    p = store.persona(c, pid) if pid else None
    if pid and not p:
        sys.exit(f"No existe la persona '{pid}'. Hay: {', '.join(x['id'] for x in store.personas(c))}")

    ctx = contexto.armar(c, p)
    if a.json:
        print(json.dumps(ctx, ensure_ascii=False, indent=2))
        return
    print("\n=== Contexto para el agente ===")
    print(contexto.a_texto(ctx))
    print("\n=== Para la TV ===")
    print(contexto.ultimo_encuentro(ctx) or "(sin encuentros previos)")
    print(f"\nTemas bloqueados: {', '.join(ctx['bloqueados']) or 'ninguno'}")
    print(f"Descartadas ({len(ctx['descartadas'])}):")
    for d in ctx["descartadas"]:
        print(f"  - m{d['id']}: {d['motivo']}")
    if a.opciones:
        ops = [{"text": t.strip(), "fuentes": []} for t in a.opciones.split("|")]
        ok, fuera = salida.validar(c, ops, p)
        print("\n=== Filtro de salida ===")
        for o in ok:
            print(f"  ✓ {o['text']}  ({o['origen']})")
        for o in fuera:
            print(f"  ✗ {o['text']}  ← {o['motivo']}")


if __name__ == "__main__":
    main()
