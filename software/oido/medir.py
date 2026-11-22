"""Mide el oído completo (audio → Scribe → turnos con hablante) contra guiones de referencia.

    ELEVENLABS_API_KEY=… software/oido/.venv/bin/python software/oido/medir.py                  # todos, 1 vez
    … medir.py --repeticiones 3                      # cada escenario 3 veces (Scribe no es determinista)
    … medir.py hombre_mujer con_tele                 # solo esos
    … medir.py --dir mis_grabaciones                 # audios propios: <dir>/<nombre>/{audio.wav, guion.json}

Cada escenario pasa por el MISMO camino que en la demo: FuenteArchivo en tiempo real → Oido → Scribe v3 Live (VAD 0,6 s,
diarización) → ensamblador de turnos. No hay atajos: si el oído pierde una frase al conectar, aquí también se pierde.

Métricas por corrida:
  turnos ok   turnos del guion cuyo hablante quedó bien, tras elegir la mejor correspondencia entre etiquetas
              (S1, S2…) y personas del guion. Un turno que no llegó cuenta como mal.
  base        lo que acertaría un sistema que pone la MISMA etiqueta a todos (la persona que más habla):
              el piso con el que hay que comparar «turnos ok»
  voces       etiquetas distintas que salieron / personas reales
  texto       parecido del texto transcrito con el guion (0-100)
  latencia    desde que termina la frase en el audio hasta que la TV recibe el turno con hablante (s)
  extra       turnos que no corresponden a ninguna frase del guion (la TV de fondo, ruido)

Costo: Scribe cobra ~US$0,22 por hora de audio; los 6 escenarios suman ~2 min (menos de un centavo por repetición).
Resultado: pruebas/resultados/medicion-<fecha>.json con TODOS los turnos crudos (se puede recalcular todo).
"""
from __future__ import annotations

import argparse
import difflib
import itertools
import json
import os
import statistics
import sys
import threading
import time
import unicodedata
from pathlib import Path

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI))

from audio import FuenteArchivo  # noqa: E402
from motor import Bus, Oido  # noqa: E402
from scribe import token_elevenlabs  # noqa: E402

ESCENARIOS = AQUI / "pruebas" / "escenarios"
RESULTADOS = AQUI / "pruebas" / "resultados"
COLA_S = 6.0          # se sigue escuchando silencio tras el final del audio, para que lleguen los últimos turnos
MIN_PARECIDO = 0.35   # por debajo, un turno no corresponde a ninguna frase del guion


def normal(t: str) -> str:
    t = unicodedata.normalize("NFKD", t.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    return " ".join("".join(c if c.isalnum() else " " for c in t).split())


def parecido(a: str, b: str) -> float:
    return difflib.SequenceMatcher(None, normal(a), normal(b)).ratio()


def evaluar(guion: dict, salida: list[dict]) -> dict:
    """salida: [{texto, hablante, t}] con t = segundos desde que empezó el audio. Pura: se recalcula desde el JSON."""
    ref = guion["turnos"]
    # 1) cada turno de salida → la frase del guion que más se le parece (o ninguna: extra)
    asignados: dict[int, list[dict]] = {i: [] for i in range(len(ref))}
    extra = 0
    for o in salida:
        notas = [(parecido(o["texto"], r["texto"]), i) for i, r in enumerate(ref)]
        # un turno de salida puede ser parte de una frase: comparar también contra el comienzo de cada frase
        notas += [(parecido(o["texto"], r["texto"][: max(len(o["texto"]), 1) + 10]) * 0.9, i) for i, r in enumerate(ref)]
        mejor, i = max(notas)
        if mejor >= MIN_PARECIDO:
            asignados[i].append(o)
        else:
            extra += 1
    # 2) etiqueta de cada frase del guion = la mayoritaria (por largo de texto) entre sus turnos
    pred: list[str | None] = []
    for i in range(len(ref)):
        votos: dict[str, int] = {}
        for o in asignados[i]:
            votos[o["hablante"] or "?"] = votos.get(o["hablante"] or "?", 0) + len(o["texto"])
        pred.append(max(votos, key=votos.get) if votos else None)
    # 3) mejor correspondencia etiqueta → persona (sin repetir personas)
    etiquetas = sorted({p for p in pred if p and p != "?"})
    personas = sorted({r["hablante"] for r in ref})
    mejor_ok, mejor_mapa = 0, {}
    for perm in itertools.permutations(personas + [None] * max(0, len(etiquetas) - len(personas)), len(etiquetas)):
        mapa = dict(zip(etiquetas, perm))
        ok = sum(1 for p, r in zip(pred, ref) if p and mapa.get(p) == r["hablante"])
        if ok > mejor_ok:
            mejor_ok, mejor_mapa = ok, mapa
    base = max(sum(1 for r in ref if r["hablante"] == p) for p in personas)
    latencias = [round(min(o["t"] for o in asignados[i]) - r["fin"], 2) for i, r in enumerate(ref) if asignados[i]]
    texto = parecido(" ".join(o["texto"] for o in salida), " ".join(r["texto"] for r in ref))
    return {"turnos_ok": mejor_ok, "turnos": len(ref), "base": base, "voces": len({o["hablante"] for o in salida if o["hablante"]}),
            "voces_reales": len(personas), "texto": round(100 * texto), "latencias": latencias,
            "latencia_mediana": round(statistics.median(latencias), 2) if latencias else None,
            "latencia_max": max(latencias) if latencias else None, "extra": extra, "sin_llegar": sum(1 for p in pred if p is None),
            "mapa": mejor_mapa}


def correr(nombre: str, carpeta: Path, llave: str) -> dict:
    guion = json.loads((carpeta / "guion.json").read_text(encoding="utf-8"))
    fuente = FuenteArchivo(carpeta / "audio.wav", tiempo_real=True)
    bus = Bus()
    q = bus.suscribir()
    oido = Oido(fuente, lambda: token_elevenlabs(llave), bus=bus, modo="siempre", keyterms=lambda: ["Emmy"])
    oido.iniciar()
    fin = time.time() + guion["duracion_s"] + COLA_S
    eventos: list[dict] = []
    while time.time() < fin:
        try:
            eventos.append(q.get(timeout=0.2))
        except Exception:
            pass
    oido.detener()
    t0 = getattr(fuente, "t0_reloj", fin - guion["duracion_s"] - COLA_S)
    salida = [{"texto": e["texto"], "hablante": e["hablante"], "t": round(e["ts"] - t0, 2)} for e in eventos if e["tipo"] == "turno"]
    errores = sorted({e.get("error", "") for e in eventos if e["tipo"] in ("error",) or e.get("error")} - {""})
    return {"escenario": nombre, "salida": salida, "errores": errores, "sesiones": oido.cliente.sesiones, **evaluar(guion, salida)}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("escenarios", nargs="*")
    ap.add_argument("--dir", default=str(ESCENARIOS))
    ap.add_argument("--repeticiones", type=int, default=1)
    a = ap.parse_args()
    llave = os.environ.get("ELEVENLABS_API_KEY", "")
    if not llave:
        sys.exit("falta ELEVENLABS_API_KEY")
    base = Path(a.dir)
    nombres = a.escenarios or sorted(p.name for p in base.iterdir() if (p / "guion.json").exists())
    corridas: list[dict] = []
    for rep in range(1, a.repeticiones + 1):
        res: list[dict] = []
        hilos = [threading.Thread(target=lambda n=n: res.append({"repeticion": rep, **correr(n, base / n, llave)})) for n in nombres]
        for h in hilos:   # los escenarios de una repetición van en paralelo (cada uno es una sesión de Scribe)
            h.start()
        for h in hilos:
            h.join()
        corridas += sorted(res, key=lambda r: r["escenario"])
        print(f"repetición {rep}/{a.repeticiones} lista", flush=True)

    print(f"\n{'escenario':16} {'rep':>3} {'turnos ok':>9} {'base':>5} {'voces':>6} {'texto':>5} {'lat. med':>8} {'lat. máx':>8} {'extra':>5}")
    for r in corridas:
        print(f"{r['escenario']:16} {r['repeticion']:>3} {r['turnos_ok']:>4}/{r['turnos']:<4} {r['base']:>2}/{r['turnos']:<2} "
              f"{r['voces']:>2}/{r['voces_reales']:<3} {r['texto']:>4}% {str(r['latencia_mediana']):>8} {str(r['latencia_max']):>8} {r['extra']:>5}"
              + (f"  ⚠ {'; '.join(r['errores'])[:80]}" if r["errores"] else ""))
    RESULTADOS.mkdir(parents=True, exist_ok=True)
    out = RESULTADOS / f"medicion-{time.strftime('%Y%m%d-%H%M')}.json"
    out.write_text(json.dumps({"fecha": time.strftime("%Y-%m-%d %H:%M"), "repeticiones": a.repeticiones,
                               "config": {"modelo": "scribe_v3_live", "vad_s": os.environ.get("MYO_ESCUCHA_SILENCIO", "0.6"), "diarize": True},
                               "corridas": corridas}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n→ {out.relative_to(AQUI.parents[1])}")


if __name__ == "__main__":
    main()
