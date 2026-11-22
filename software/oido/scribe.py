"""Cliente de ElevenLabs Scribe v3 Live con reconexión.

Flujo igual al que ya funciona en la TV (whatsapp-bridge/voz.ts): con la llave se pide un token de un solo uso y con
el token se abre el WebSocket. La diferencia es que todo pasa en este proceso: la llave nunca sale del computador
y ninguna página puede pedir tokens.

Reconexión: espera creciente (0,5 → 1 → 2 → 4 → 8 → 10 s, con algo de azar) mientras se quiera escuchar. Una
conexión que duró más de ESTABLE_S reinicia la espera. Tras FALLOS_SIN_CONEXION fallos seguidos el estado pasa a
«sin_conexion» (la TV lo muestra), pero se sigue intentando.
"""
from __future__ import annotations

import base64
import json
import os
import random
import threading
import time
import urllib.parse
import urllib.request
from typing import Callable

WS_URL = os.environ.get("ELEVENLABS_WS_URL", "wss://api.elevenlabs.io/v1/speech-to-text/realtime")
API_URL = os.environ.get("ELEVENLABS_BASE_URL", "https://api.elevenlabs.io")
ESPERAS = (0.5, 1.0, 2.0, 4.0, 8.0, 10.0)
ESTABLE_S = 10.0
FALLOS_SIN_CONEXION = 3


def parametros(silencio_s: str | None = None) -> dict:
    """Los mismos que la TV (medidos: VAD de 0,6 s separa bien los turnos, ~0,65 s de latencia)."""
    return {"model_id": "scribe_v3_live", "audio_format": "pcm_16000", "diarize": "true", "language_code": "es",
            "commit_strategy": "vad", "vad_silence_threshold_secs": silencio_s or os.environ.get("MYO_ESCUCHA_SILENCIO", "0.6")}


def token_elevenlabs(llave: str, api_url: str = API_URL, timeout: float = 10.0) -> str:
    req = urllib.request.Request(api_url + "/v1/single-use-token/realtime_scribe", method="POST", data=b"",
                                 headers={"xi-api-key": llave})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        tok = json.loads(r.read() or b"{}").get("token")
    if not tok:
        raise RuntimeError("ElevenLabs no entregó el token")
    return tok


def mensaje_audio(pcm: bytes, rate: int = 16000) -> str:
    return json.dumps({"message_type": "input_audio_chunk", "audio_base_64": base64.b64encode(pcm).decode(),
                       "commit": False, "sample_rate": rate})


class ClienteScribe:
    def __init__(self, pedir_token: Callable[[], str], params: dict,
                 al_mensaje: Callable[[dict], None],
                 al_estado: Callable[[str, dict], None],
                 al_abrir: Callable[[], None] = lambda: None,
                 keyterms: Callable[[], list[str]] = lambda: [],
                 ws_url: str = WS_URL, esperas: tuple[float, ...] = ESPERAS, estable_s: float = ESTABLE_S) -> None:
        self.pedir_token, self.params = pedir_token, params
        self.al_mensaje, self.al_estado, self.al_abrir, self.keyterms = al_mensaje, al_estado, al_abrir, keyterms
        self.ws_url, self.esperas, self.estable_s = ws_url, esperas, estable_s
        self._ws = None
        self._hilo: threading.Thread | None = None
        self._deseado = False
        self._despertar = threading.Event()
        self._lock = threading.Lock()
        self.sesiones = 0
        self.ms_conectado = 0
        self.ultimo_error = ""

    # ---------- control (desde el motor) ----------
    @property
    def conectado(self) -> bool:
        return self._ws is not None

    def abrir(self) -> None:
        with self._lock:
            self._deseado = True
            if self._hilo is None or not self._hilo.is_alive():
                self._hilo = threading.Thread(target=self._bucle, name="scribe", daemon=True)
                self._hilo.start()

    def cerrar(self) -> None:
        with self._lock:
            self._deseado = False
            self._despertar.set()
            ws = self._ws
        if ws is not None:
            try:
                ws.close()
            except Exception:
                pass

    def esperar_fin(self, timeout: float = 5.0) -> None:
        h = self._hilo
        if h is not None:
            h.join(timeout)

    def enviar(self, pcm: bytes) -> bool:
        ws = self._ws
        if ws is None:
            return False
        try:
            ws.send(mensaje_audio(pcm))
            return True
        except Exception:
            return False   # se cerró en el medio: el bucle reconecta

    # ---------- hilo ----------
    def _url(self, token: str) -> str:
        q = [("token", token), *self.params.items()]
        vistos: set[str] = set()
        for n in self.keyterms():   # nombres de la casa: sin ellos, «Emmy» salía «Emi»
            if n and n.lower() not in vistos and len(vistos) < 50:
                vistos.add(n.lower())
                q.append(("keyterms", n))
        return self.ws_url + "?" + urllib.parse.urlencode(q)

    def _bucle(self) -> None:
        from websockets.sync.client import connect

        fallos = 0
        while self._deseado:
            self.al_estado("conectando", {"intento": fallos + 1})
            t0 = 0.0
            try:
                ws = connect(self._url(self.pedir_token()), open_timeout=10, close_timeout=2, max_size=2**22)
                if not self._deseado:
                    ws.close()
                    break
                self._ws, t0 = ws, time.monotonic()
                self.sesiones += 1
                self.al_abrir()
                self.al_estado("escuchando", {"sesion": self.sesiones})
                for raw in ws:
                    try:
                        m = json.loads(raw)
                    except (TypeError, ValueError):
                        continue
                    self.al_mensaje(m)
                self.ultimo_error = ""
            except Exception as e:   # red, token, cierre del servidor: todo termina en reintento
                self.ultimo_error = f"{type(e).__name__}: {e}"[:200]
            finally:
                self._ws = None
                if t0:
                    self.ms_conectado += int((time.monotonic() - t0) * 1000)
            if not self._deseado:
                break
            duro = time.monotonic() - t0 if t0 else 0.0
            fallos = 0 if duro >= self.estable_s else fallos + 1
            espera = self.esperas[min(max(fallos - 1, 0), len(self.esperas) - 1)] * random.uniform(0.8, 1.2)
            estado = "sin_conexion" if fallos >= FALLOS_SIN_CONEXION else "reconectando"
            self.al_estado(estado, {"intento": fallos, "espera_s": round(espera, 2), "error": self.ultimo_error})
            self._despertar.wait(espera)
            self._despertar.clear()
        self.al_estado("cerrado", {})
