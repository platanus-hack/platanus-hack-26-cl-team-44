"""De los mensajes de Scribe a turnos con hablante. Lógica pura: sin red, sin micrófono, sin hilos.

Scribe v3 Live (commit_strategy=vad, diarize) manda por cada frase:
  committed_transcript {segment_index, text}            → la frase, sin hablante
  diarized_transcript  {segment_index, words[speaker_id]} → la misma frase separada por voces (llega después)
  speakers_merged      {from_speaker_id, to_speaker_id}  → Scribe juntó dos voces

Etiquetas: Scribe numera las voces desde 0 en CADA sesión. Si una sesión nueva reutilizara «S1», heredaría la persona
asignada a otra voz (y su privacidad). Por eso cada (sesión, voz) recibe una etiqueta nueva y única: S1, S2, S3…
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable

DIAR_ESPERA_S = 1.5   # cuánto se espera la versión con voces antes de publicar la frase sin hablante


class Etiquetas:
    def __init__(self) -> None:
        self._mapa: dict[tuple[int, object], str] = {}
        self._siguiente = 1

    def de(self, sesion: int, spk) -> str:
        if spk is None:
            return ""
        k = (sesion, spk)
        if k not in self._mapa:
            self._mapa[k] = f"S{self._siguiente}"
            self._siguiente += 1
        return self._mapa[k]

    def fusionar(self, sesion: int, de_spk, a_spk) -> tuple[str, str]:
        """La voz de_spk pasa a ser a_spk. Devuelve (etiqueta vieja, etiqueta que queda)."""
        vieja, nueva = self.de(sesion, de_spk), self.de(sesion, a_spk)
        self._mapa[(sesion, de_spk)] = nueva
        return vieja, nueva


def tramos(words: list | None, etq: Callable[[object], str]) -> list[dict]:
    """Un tramo por hablante. Una palabra sin hablante (espacios, puntuación) se queda con el tramo anterior.
    ini/fin en segundos desde el inicio de la sesión (None si Scribe no los mandó)."""
    out: list[dict] = []
    for w in words or []:
        spk = w.get("speaker_id") if w.get("type") == "word" else None
        ini = w.get("start") if isinstance(w.get("start"), (int, float)) else None
        fin = w.get("end") if isinstance(w.get("end"), (int, float)) else None
        last = out[-1] if out else None
        if last is None or (spk is not None and last["spk"] is not None and spk != last["spk"]):
            out.append({"spk": spk, "t": str(w.get("text", "")), "ini": ini, "fin": fin})
        else:
            last["t"] += str(w.get("text", ""))
            if last["spk"] is None:
                last["spk"] = spk
            if last["ini"] is None:
                last["ini"] = ini
            if fin is not None:
                last["fin"] = fin
    return [{"hablante": etq(x["spk"]), "texto": x["t"].strip(), "ini": x["ini"], "fin": x["fin"]}
            for x in out if x["t"].strip()]


@dataclass
class _Pendiente:
    texto: str
    rango: tuple[int, int]   # muestras absolutas en el anillo de audio
    vence: float


@dataclass
class Ensamblador:
    """Junta committed + diarized en turnos. emitir(texto, hablante, rango) se llama una vez por tramo."""
    emitir: Callable[[str, str, tuple[int, int] | None], None]
    etiquetas: Etiquetas = field(default_factory=Etiquetas)
    espera_s: float = DIAR_ESPERA_S
    sesion: int = 0
    inicio_sesion: int = 0   # muestra absoluta donde empezó la sesión (para pasar segundos de Scribe a muestras)
    rate: int = 16000
    _pend: dict[int, _Pendiente] = field(default_factory=dict)

    def nueva_sesion(self, inicio_muestra: int) -> None:
        self.vaciar()
        self.sesion += 1
        self.inicio_sesion = inicio_muestra

    def committed(self, idx: int, texto: str, rango: tuple[int, int], ahora: float) -> None:
        if (texto or "").strip():
            self._pend[idx] = _Pendiente(texto, rango, ahora + self.espera_s)

    def diarized(self, idx: int, words: list | None) -> None:
        p = self._pend.pop(idx, None)
        if p is None:
            return
        ts = tramos(words, lambda spk: self.etiquetas.de(self.sesion, spk))
        if not ts:
            self.emitir(p.texto.strip(), "", p.rango)
            return
        for x in ts:
            if x["ini"] is not None and x["fin"] is not None:
                rango = (self.inicio_sesion + int(x["ini"] * self.rate), self.inicio_sesion + int(x["fin"] * self.rate))
            else:
                rango = p.rango if len(ts) == 1 else None
            self.emitir(x["texto"], x["hablante"], rango)

    def tick(self, ahora: float) -> None:
        """Publica sin hablante las frases cuya versión con voces no llegó a tiempo."""
        for idx in [i for i, p in self._pend.items() if p.vence <= ahora]:
            p = self._pend.pop(idx)
            self.emitir(p.texto.strip(), "", p.rango)

    def vaciar(self) -> None:
        """Al cerrar una sesión, lo pendiente se publica sin hablante (no se pierde una frase)."""
        for p in self._pend.values():
            self.emitir(p.texto.strip(), "", p.rango)
        self._pend.clear()
