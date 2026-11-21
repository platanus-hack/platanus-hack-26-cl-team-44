"""Carga una semilla en la base de la memoria.

    python3 software/agent/scripts/semilla.py            # data/semilla.json si existe, si no el ejemplo
    python3 software/agent/scripts/semilla.py --ejemplo  # siempre el ejemplo ficticio
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

AGENT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AGENT))

from memoria import store  # noqa: E402

DATA = AGENT / "data"
EJEMPLO = AGENT / "ejemplos" / "semilla.example.json"
REAL = DATA / "semilla.json"
DB = DATA / "memoria.db"


def main() -> None:
    origen = EJEMPLO if "--ejemplo" in sys.argv or not REAL.exists() else REAL
    DATA.mkdir(exist_ok=True)
    c = store.conectar(DB)
    conteo = store.cargar_semilla(c, json.loads(origen.read_text(encoding="utf-8")))
    print(f"Semilla: {origen.relative_to(AGENT)} → {DB.relative_to(AGENT)}")
    print("  " + " · ".join(f"{k} {v}" for k, v in conteo.items()))


if __name__ == "__main__":
    main()
