"""Propone memorias de la usuaria a partir de un chat exportado de WhatsApp.

    # Ver quién escribe en el chat (no imprime mensajes)
    python3 software/agent/scripts/importar_whatsapp.py chat.zip --autores

    # Léxico y estilo, sin modelo
    python3 software/agent/scripts/importar_whatsapp.py chat.zip --yo "Emms" --persona juan

    # Además, perfil, episodios y rutinas de los últimos 90 días con Claude (suscripción)
    python3 software/agent/scripts/importar_whatsapp.py chat.zip --yo "Emms" --persona juan --resumir 90

La salida va a software/agent/data/importado-<persona>.json (git la ignora).
Para cargarla, agrégala a "importar" en data/semilla.json y corre scripts/semilla.py.
Las memorias quedan en "propuesta" salvo con --aprobar.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from datetime import date, timedelta
from pathlib import Path

AGENT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AGENT))

import llm  # noqa: E402
from memoria import importar  # noqa: E402

DATA = AGENT / "data"
MODELO = os.environ.get("TOKI_MODELO", "claude-sonnet-5-5")
TROZO = 60_000  # caracteres por llamada al modelo

ESQUEMA = {
    "type": "object", "additionalProperties": False, "required": ["personas", "memorias"],
    "properties": {
        "personas": {"type": "array", "items": {
            "type": "object", "additionalProperties": False, "required": ["nombre", "relacion"],
            "properties": {"nombre": {"type": "string"}, "relacion": {"type": "string"},
                           "apodos": {"type": "array", "items": {"type": "string"}}}}},
        "memorias": {"type": "array", "items": {
            "type": "object", "additionalProperties": False, "required": ["tipo", "texto", "privacidad"],
            "properties": {
                "tipo": {"type": "string", "enum": ["perfil", "episodio", "rutina"]},
                "subtipo": {"type": "string", "enum": ["identidad", "personalidad", "gusto", "salud", "trabajo", "otro", ""]},
                "texto": {"type": "string"},
                "privacidad": {"type": "string", "enum": ["publico", "familia", "salud"]},
                "fecha": {"type": "string", "description": "episodio: AAAA-MM-DD"},
                "hora": {"type": "string", "description": "rutina: HH:MM"},
                "dias": {"type": "string", "description": "rutina: lun,mar,mie,jue,vie,sab,dom"},
                "personas": {"type": "array", "items": {"type": "string"}, "description": "nombres de las personas que aparecen"}}}},
    },
}


def _sistema(nombre: str, otra: str) -> str:
    return f"""Lees un trozo de un chat de WhatsApp entre {nombre} y {otra}.
Tu trabajo: proponer datos de la memoria personal de {nombre}, para un comunicador que le sugiere frases.

Devuelve:
- personas: gente que {nombre} nombra (familia, amigos, trabajo), con su relación con ella.
- memorias de 3 tipos, cada una en 1 frase de hasta 20 palabras, en tercera persona y en español:
  - perfil: datos estables de {nombre} (identidad, personalidad, gustos, trabajo, salud).
  - episodio: algo que pasó, con su fecha AAAA-MM-DD. Solo los que vale la pena recordar en una conversación.
  - rutina: algo que hace en un día y hora fijos.
- privacidad: "publico" si lo puede saber cualquiera; "familia" si es personal o de pareja; "salud" para salud.

Reglas:
- Solo datos que el chat dice claro. Si dudas, no lo pongas.
- No copies teléfonos, direcciones, correos, claves, montos de dinero ni números de documentos.
- Nada íntimo o sexual. Nada de terceros que ellos no querrían que se repita.
- Máximo 25 memorias por trozo: las más útiles para conversar."""


async def _consultar(sistema: str, prompt: str) -> dict | None:
    datos, _ = await llm.consultar(sistema, prompt, ESQUEMA, MODELO)
    return datos


def _trozos(msgs: list[dict], nombre: str, yo: str, otra: str) -> list[str]:
    lineas = [f"{m['fecha']} {m['hora']} {nombre if m['autor'] == yo else otra}: {m['texto']}" for m in msgs]
    out, actual = [], ""
    for l in lineas:
        if len(actual) + len(l) > TROZO and actual:
            out.append(actual)
            actual = ""
        actual += l + "\n"
    return out + ([actual] if actual else [])


def resumir(msgs: list[dict], yo: str, nombre: str, otra: str, persona: str | None, estado: str) -> tuple[list, list]:
    personas, memorias = {}, []
    trozos = _trozos(msgs, nombre, yo, otra)
    for i, t in enumerate(trozos, 1):
        print(f"  trozo {i}/{len(trozos)} ({len(t):,} caracteres)…", file=sys.stderr)
        try:
            datos = asyncio.run(_consultar(_sistema(nombre, otra), t)) or {}
        except Exception as e:  # sigue con el resto
            print(f"  falló: {type(e).__name__}: {e}"[:200], file=sys.stderr)
            continue
        for p in datos.get("personas", []):
            personas.setdefault(importar._norm(p["nombre"]), p)
        for m in datos.get("memorias", []):
            if importar._SENSIBLE.search(m["texto"].replace(m.get("fecha", ""), "")) and m["tipo"] != "rutina":
                continue  # trae números o links: fuera
            per = [persona] if persona and importar._norm(otra) in importar._norm(" ".join(m.get("personas", []))) else []
            memorias.append({"tipo": m["tipo"], "subtipo": m.get("subtipo", ""), "texto": m["texto"],
                             "privacidad": m["privacidad"], "fecha": m.get("fecha", ""), "hora": m.get("hora", ""),
                             "dias": m.get("dias", ""), "personas": per, "estado": estado, "fuente": "whatsapp"})
    return list(personas.values()), memorias


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("chat", help="export de WhatsApp: .zip o _chat.txt")
    ap.add_argument("--autores", action="store_true", help="solo cuenta mensajes por autor")
    ap.add_argument("--yo", help="nombre de la usuaria tal como sale en el chat")
    ap.add_argument("--nombre", help="nombre de la usuaria para la memoria (por defecto, --yo)")
    ap.add_argument("--persona", help="id de la otra persona en la semilla (por ejemplo juan)")
    ap.add_argument("--otra", help="nombre de la otra persona para el modelo (por defecto, el autor del chat)")
    ap.add_argument("--desde-dias", type=int, default=180, help="frases de estilo de los últimos N días")
    ap.add_argument("--resumir", type=int, default=0, metavar="DIAS", help="perfil, episodios y rutinas de los últimos N días con Claude")
    ap.add_argument("--aprobar", action="store_true", help="deja las memorias aprobadas (para la demo)")
    ap.add_argument("--salida", help="por defecto data/importado-<persona>.json")
    a = ap.parse_args()

    msgs = importar.leer(a.chat)
    cuenta = importar.autores(msgs)
    if a.autores or not a.yo:
        for autor, k in cuenta.most_common(10):
            print(f"{k:>7}  {autor}")
        if not a.yo:
            print("\nFalta --yo con el nombre de la usuaria.", file=sys.stderr)
        return
    if a.yo not in cuenta:
        sys.exit(f"'{a.yo}' no escribe en este chat. Usa --autores para ver los nombres.")

    estado = "aprobada" if a.aprobar else "propuesta"
    otro = next((x for x, _ in cuenta.most_common() if x != a.yo), "otra persona")
    hoy = max(m["fecha"] for m in msgs)
    desde = (date.fromisoformat(hoy) - timedelta(days=a.desde_dias)).isoformat()

    lex = importar.lexico(msgs, a.yo)
    frases = importar.estilo(msgs, a.yo, desde=desde)
    med = importar.medidas(msgs, a.yo)
    memorias = importar.a_memorias(lex, frases, med, a.persona, estado)
    personas: list = []
    if a.resumir:
        corte = (date.fromisoformat(hoy) - timedelta(days=a.resumir)).isoformat()
        recientes = [m for m in msgs if m["fecha"] >= corte and m["autor"] in (a.yo, otro)]
        personas, extra = resumir(recientes, a.yo, a.nombre or a.yo, a.otra or otro, a.persona, estado)
        memorias += extra

    salida = Path(a.salida) if a.salida else DATA / f"importado-{a.persona or 'chat'}.json"
    salida.parent.mkdir(parents=True, exist_ok=True)
    salida.write_text(json.dumps({"_origen": "whatsapp", "_hasta": hoy, "personas_propuestas": personas,
                                  "memorias": memorias}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tipos = {}
    for m in memorias:
        tipos[m["tipo"]] = tipos.get(m["tipo"], 0) + 1
    print(f"{len(msgs):,} mensajes ({cuenta[a.yo]:,} de la usuaria) → {salida}")
    print("  " + " · ".join(f"{k} {v}" for k, v in sorted(tipos.items())) + f" · personas propuestas {len(personas)} · estado {estado}")


if __name__ == "__main__":
    main()
