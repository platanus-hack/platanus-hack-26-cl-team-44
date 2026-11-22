"""Carga una semilla en la base de la memoria.

    python3 software/agent/scripts/semilla.py            # data/semilla.json si existe, si no el ejemplo
    python3 software/agent/scripts/semilla.py --ejemplo  # siempre el ejemplo ficticio
    TOKI_DATA=/ruta python3 software/agent/scripts/semilla.py --semilla software/agent/ejemplos/semilla.demo.json
                                                         # otra carpeta y otra semilla (la demo pública)

La semilla puede traer "importar": ["importado-juan.json"], archivos de data/ hechos con
scripts/importar_whatsapp.py. Sus memorias se suman a las de la semilla.
Cargar dos veces la misma semilla deja la misma base: reemplaza todo el contenido.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

AGENT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AGENT))

from memoria import store  # noqa: E402

DATA = Path(os.environ.get("TOKI_DATA") or AGENT / "data")
EJEMPLO = AGENT / "ejemplos" / "semilla.example.json"
REAL = DATA / "semilla.json"
DB = DATA / "memoria.db"


def corta(p: Path) -> str:
    try:
        return str(p.resolve().relative_to(AGENT))
    except ValueError:
        return str(p)


def main() -> None:
    args = sys.argv[1:]
    if "--semilla" in args:
        i = args.index("--semilla") + 1
        if i >= len(args):
            sys.exit("Falta el archivo después de --semilla")
        origen = Path(args[i])
    else:
        origen = EJEMPLO if "--ejemplo" in args or not REAL.exists() else REAL
    DATA.mkdir(parents=True, exist_ok=True)
    c = store.conectar(DB)
    semilla = json.loads(origen.read_text(encoding="utf-8"))
    for nombre in semilla.get("importar", []):
        extra = json.loads((DATA / nombre).read_text(encoding="utf-8"))
        semilla.setdefault("memorias", []).extend(extra.get("memorias", []))
        print(f"  + {nombre}: {len(extra.get('memorias', []))} memorias")
    conteo = store.cargar_semilla(c, semilla)
    print(f"Semilla: {corta(origen)} → {corta(DB)}")
    print("  " + " · ".join(f"{k} {v}" for k, v in conteo.items()))


if __name__ == "__main__":
    main()
