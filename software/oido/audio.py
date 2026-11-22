"""Audio de la sala: fuentes (micrófono o archivo), anillo de 30 s y detector de voz.

Formato único en todo el servicio: PCM de 16 bits, 16 kHz, mono, en bloques de 100 ms (1600 muestras).
Es lo que piden Scribe (audio_format=pcm_16000) y el servicio de huellas (software/voces).
"""
from __future__ import annotations

import queue
import threading
import time
import wave
from pathlib import Path

import numpy as np

RATE = 16000
BLOQUE = RATE // 10   # 100 ms


class Anillo:
    """Los últimos `segundos` del micrófono, solo en memoria. De aquí sale el audio de cada frase para reconocer
    la voz. Mientras Myo habla se guarda silencio (lo mismo que se manda a Scribe)."""

    def __init__(self, segundos: int = 30) -> None:
        self.buf = np.zeros(RATE * segundos, dtype=np.int16)
        self.total = 0   # muestras escritas desde que arrancó (posición absoluta)

    def escribir(self, bloque: np.ndarray, mudo: bool) -> None:
        n, L = len(bloque), len(self.buf)
        pos = np.arange(self.total, self.total + n) % L
        self.buf[pos] = 0 if mudo else bloque
        self.total += n

    def recorte(self, ini: int, fin: int, max_s: float = 8.0, min_s: float = 0.8) -> bytes | None:
        """Audio entre dos posiciones absolutas (como bytes PCM). None si ya no está o es muy corto."""
        L = len(self.buf)
        ini, fin = max(int(ini), self.total - L + 1, 0), min(int(fin), self.total)
        if fin - ini > RATE * max_s:
            ini = fin - int(RATE * max_s)
        if fin - ini < RATE * min_s:
            return None
        return self.buf[np.arange(ini, fin) % L].astype("<i2").tobytes()


class DetectorVoz:
    """Energía de cada bloque contra el ruido de fondo, que se adapta (baja rápido, sube lento).
    Hay voz si 3 de los últimos 5 bloques (300 ms de 500 ms) superan el umbral."""

    def __init__(self) -> None:
        self.piso = 0.004
        self.recientes: list[bool] = []

    def hay_voz(self, bloque: np.ndarray) -> bool:
        f = bloque.astype(np.float32) / 32768.0
        rms = float(np.sqrt(np.mean(f * f))) if len(f) else 0.0
        self.piso = self.piso * 0.9 + rms * 0.1 if rms < self.piso else self.piso * 0.998 + rms * 0.002
        self.recientes.append(rms > max(self.piso * 3, 0.012))
        self.recientes = self.recientes[-5:]
        return sum(self.recientes) >= 3


class FuenteMic:
    """Micrófono con sounddevice (PortAudio). Cada bloque de 100 ms va a la cola.

    Sin cancelación de eco: el navegador la daba gratis, aquí no. Dos defensas: (1) mientras Myo habla, el motor
    manda silencio (POST /api/oido/habla); (2) usar un micrófono de conferencia con cancelación de eco por hardware.
    """

    def __init__(self, dispositivo: str | int | None = None) -> None:
        self.dispositivo = int(dispositivo) if isinstance(dispositivo, str) and dispositivo.isdigit() else dispositivo
        self.cola: queue.Queue[np.ndarray] = queue.Queue(maxsize=600)   # 60 s de colchón
        self._stream = None
        self.nombre = ""

    def abrir(self) -> None:
        import sounddevice as sd   # se importa aquí: las pruebas no necesitan PortAudio

        def cb(indata, frames, t, status):   # hilo de PortAudio: solo copiar y salir
            try:
                self.cola.put_nowait(indata[:, 0].copy())
            except queue.Full:
                pass   # el motor está trabado; se pierde audio en vez de crecer sin límite

        self._stream = sd.InputStream(samplerate=RATE, channels=1, dtype="int16", blocksize=BLOQUE,
                                      device=self.dispositivo, callback=cb)
        self._stream.start()
        info = sd.query_devices(self._stream.device, "input")
        self.nombre = str(info.get("name", ""))

    def cerrar(self) -> None:
        if self._stream is not None:
            try:
                self._stream.stop()
                self._stream.close()
            finally:
                self._stream = None

    def leer(self, timeout: float = 0.5) -> np.ndarray | None:
        try:
            return self.cola.get(timeout=timeout)
        except queue.Empty:
            return None


class FuenteArchivo:
    """Un WAV de 16 kHz mono 16 bits como si fuera el micrófono (ensayos sin micrófono y pruebas).
    tiempo_real=True entrega un bloque cada 100 ms; al terminar, sigue con silencio."""

    def __init__(self, ruta: str | Path, tiempo_real: bool = True) -> None:
        self.ruta = Path(ruta)
        self.tiempo_real = tiempo_real
        self.nombre = f"archivo:{self.ruta.name}"
        self._datos = np.zeros(0, dtype=np.int16)
        self._pos = 0
        self._t0 = 0.0
        self._lock = threading.Lock()

    def abrir(self) -> None:
        with wave.open(str(self.ruta), "rb") as w:
            if w.getframerate() != RATE or w.getnchannels() != 1 or w.getsampwidth() != 2:
                raise ValueError("el WAV debe ser 16 kHz, mono, 16 bits")
            self._datos = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").copy()
        self._pos, self._t0 = 0, time.monotonic()

    def cerrar(self) -> None:
        pass

    def leer(self, timeout: float = 0.5) -> np.ndarray | None:
        with self._lock:
            if self.tiempo_real:
                espera = self._t0 + (self._pos + BLOQUE) / RATE - time.monotonic()
                if espera > 0:
                    time.sleep(min(espera, timeout))
            b = self._datos[self._pos:self._pos + BLOQUE]
            self._pos += BLOQUE
        if len(b) < BLOQUE:
            b = np.concatenate([b, np.zeros(BLOQUE - len(b), dtype=np.int16)])
        return b
