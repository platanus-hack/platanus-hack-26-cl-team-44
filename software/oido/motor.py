"""El oído de Myo: micrófono → Scribe → turnos con hablante → eventos para la TV.

Todo el estado de la escucha vive aquí, no en la pestaña: recargar la TV no borra quién es cada voz ni la sesión,
y una sesión nueva de Scribe nunca hereda la persona de otra voz (ver turnos.Etiquetas).

Modos (los mismos de la TV):
  siempre  la sesión de Scribe queda abierta mientras la escucha esté encendida
  voz      el micrófono queda abierto solo en este computador; la sesión se abre al detectar voz (con 1,5 s de audio
           previo, así no se pierde el comienzo de la frase) y se cierra tras `silencio_s` sin voz
  manual   como «siempre», pero no se enciende sola al arrancar
"""
from __future__ import annotations

import collections
import queue
import re
import threading
import time
from typing import Callable

import numpy as np

from audio import BLOQUE, RATE, Anillo, DetectorVoz
from scribe import ClienteScribe, parametros
from turnos import Ensamblador

MODOS = ("siempre", "voz", "manual")
MAX_TURNOS = 8
COLA_VAD_S = 0.6        # Scribe corta la frase tras 0,6 s de silencio: el audio de la frase termina antes
COLA_HABLA_S = 0.4      # tras terminar de hablar Myo, se sigue mandando silencio un momento (eco del cuarto)
MAX_HABLA_S = 30.0      # si la TV avisa que Myo habla y nunca avisa que terminó, se vuelve a escuchar igual
VOCES_ESPERA_S = 1.5    # reconocer la voz no puede atrasar el turno más que esto
HABLANTE_RE = re.compile(r"^S\d{1,4}$")


class Bus:
    """Eventos para la TV (SSE). Cada suscriptor tiene su cola; si no lee, se descartan sus eventos viejos."""

    def __init__(self) -> None:
        self._subs: list[queue.Queue] = []
        self._lock = threading.Lock()
        self.ultimo_estado: dict | None = None

    def suscribir(self) -> queue.Queue:
        q: queue.Queue = queue.Queue(maxsize=200)
        with self._lock:
            self._subs.append(q)
        if self.ultimo_estado:
            q.put_nowait(self.ultimo_estado)
        return q

    def desuscribir(self, q: queue.Queue) -> None:
        with self._lock:
            if q in self._subs:
                self._subs.remove(q)

    def publicar(self, ev: dict) -> None:
        ev = {**ev, "ts": round(time.time(), 3)}
        if ev.get("tipo") == "estado":
            self.ultimo_estado = ev
        with self._lock:
            subs = list(self._subs)
        for q in subs:
            try:
                q.put_nowait(ev)
            except queue.Full:
                try:
                    q.get_nowait()
                    q.put_nowait(ev)
                except (queue.Empty, queue.Full):
                    pass


class Oido:
    def __init__(self, fuente, pedir_token: Callable[[], str], *, bus: Bus | None = None,
                 modo: str = "siempre", ws_url: str | None = None, params: dict | None = None,
                 keyterms: Callable[[], list[str]] = lambda: [],
                 voces_quien: Callable[[bytes], dict] | None = None,
                 voces_hay: Callable[[], bool] = lambda: False,
                 silencio_s: float = 45.0, previo_bloques: int = 15,
                 esperas: tuple[float, ...] | None = None, reloj: Callable[[], float] = time.monotonic) -> None:
        self.fuente, self.bus, self.reloj = fuente, bus or Bus(), reloj
        self.modo = modo if modo in MODOS else "siempre"
        self.voces_quien, self.voces_hay = voces_quien, voces_hay
        self.silencio_s, self.previo_bloques = silencio_s, previo_bloques
        self._lock = threading.RLock()
        self.anillo, self.vad = Anillo(), DetectorVoz()
        self.ens = Ensamblador(emitir=self._emitir)
        self.on = False
        self.mic_abierto = False
        self.estado = "apagado"
        self.ultimo_error = ""
        self.hablantes: dict[str, str] = {}     # voz (S1…) → persona, asignada a mano o reconocida
        self.auto: dict[str, str] = {}          # las que reconoció la huella
        self.turnos: collections.deque = collections.deque(maxlen=MAX_TURNOS)
        self._n_turno = 0
        self._seg_ini = 0
        self._previo: collections.deque = collections.deque(maxlen=previo_bloques)
        self._ultima_voz = -1e9
        self._habla_hasta = 0.0
        self._parar = threading.Event()
        self._hilo: threading.Thread | None = None
        kw = {} if esperas is None else {"esperas": esperas}
        self.cliente = ClienteScribe(pedir_token, params or parametros(), al_mensaje=self._mensaje,
                                     al_estado=self._estado_cliente, al_abrir=self._al_abrir, keyterms=keyterms,
                                     **({"ws_url": ws_url} if ws_url else {}), **kw)

    # ---------- ciclo de vida ----------
    def iniciar(self, encender: bool | None = None) -> None:
        self._hilo = threading.Thread(target=self._bucle, name="oido", daemon=True)
        self._hilo.start()
        if encender if encender is not None else self.modo != "manual":
            self.encender()
        else:
            self._publicar_estado()

    def detener(self) -> None:
        self.apagar()
        self._parar.set()
        if self._hilo:
            self._hilo.join(3)

    def encender(self) -> None:
        with self._lock:
            if self.on:
                return
            self.on = True
        try:
            self.fuente.abrir()
            self.mic_abierto = True
        except Exception as e:
            with self._lock:
                self.on, self.ultimo_error = False, f"micrófono: {e}"[:200]
            self._fijar_estado("sin_microfono")
            return
        if self.modo == "voz":
            self._fijar_estado("esperando_voz")
        else:
            self.cliente.abrir()

    def apagar(self) -> None:
        with self._lock:
            if not self.on:
                return
            self.on = False
            self._previo.clear()
        self.cliente.cerrar()
        self.cliente.esperar_fin(3)
        try:
            self.fuente.cerrar()
        finally:
            self.mic_abierto = False
        with self._lock:
            self.ens.vaciar()
        self._fijar_estado("apagado")

    def cambiar_modo(self, modo: str) -> None:
        if modo not in MODOS:
            raise ValueError("modo desconocido")
        estaba = self.on
        self.apagar()
        self.modo = modo
        if estaba and modo != "manual":
            self.encender()
        else:
            self._publicar_estado()

    # ---------- desde la TV ----------
    def habla(self, hablando: bool, max_s: float = MAX_HABLA_S) -> None:
        """Mientras Myo habla, al micrófono (y a Scribe) va silencio: no se transcribe su propia voz."""
        ahora = self.reloj()
        with self._lock:
            self._habla_hasta = ahora + min(max(max_s, 0.0), MAX_HABLA_S) if hablando else ahora + COLA_HABLA_S

    def callado(self) -> bool:
        return self.reloj() < self._habla_hasta

    def asignar(self, hablante: str, persona: str) -> None:
        if not HABLANTE_RE.match(hablante or ""):
            raise ValueError("hablante inválido")
        persona = (persona or "").strip()[:40]
        with self._lock:
            if persona:
                self.hablantes[hablante] = persona
            else:
                self.hablantes.pop(hablante, None)
            self.auto.pop(hablante, None)
            hab = dict(self.hablantes)
        self.bus.publicar({"tipo": "hablantes", "hablantes": hab})

    def resumen(self) -> dict:
        with self._lock:
            return {"on": self.on, "modo": self.modo, "estado": self.estado, "microfono": getattr(self.fuente, "nombre", ""),
                    "sesiones": self.cliente.sesiones, "segundos_conectado": round(self.cliente.ms_conectado / 1000),
                    "error": self.ultimo_error or self.cliente.ultimo_error, "callado": self.callado(),
                    "hablantes": dict(self.hablantes), "reconocidas": dict(self.auto), "turnos": list(self.turnos)}

    # ---------- audio ----------
    def _bucle(self) -> None:
        while not self._parar.is_set():
            if not self.mic_abierto:
                self._parar.wait(0.1)
                with self._lock:
                    self.ens.tick(self.reloj())
                continue
            try:
                b = self.fuente.leer(0.5)
            except Exception as e:   # el micrófono se desconectó
                self.ultimo_error = f"micrófono: {e}"[:200]
                self._fijar_estado("sin_microfono")
                self._parar.wait(1.0)
                continue
            if b is not None:
                self.procesar(b)
            with self._lock:
                self.ens.tick(self.reloj())

    def procesar(self, bloque: np.ndarray) -> None:
        mudo = self.callado()
        with self._lock:
            self.anillo.escribir(bloque, mudo)
            if not self.on:
                return
        pcm = bytes(len(bloque) * 2) if mudo else bloque.astype("<i2").tobytes()
        if self.modo == "voz":
            ahora = self.reloj()
            if not mudo and self.vad.hay_voz(bloque):
                self._ultima_voz = ahora
                if not self.cliente.conectado:
                    self.cliente.abrir()
            elif self.cliente.conectado and ahora - self._ultima_voz > self.silencio_s:
                self.cliente.cerrar()
        if not self.cliente.enviar(pcm):
            # Sin sesión (conectando, reconectando o esperando voz): se guardan los últimos 1,5 s y se mandan al abrir.
            # Así un corte de Scribe no se come el comienzo de la frase que se dijo mientras reconectaba.
            with self._lock:
                self._previo.append(pcm)

    # ---------- Scribe (hilo del cliente) ----------
    def _al_abrir(self) -> None:
        with self._lock:
            previo = list(self._previo)
            self._previo.clear()
            inicio = max(self.anillo.total - len(previo) * BLOQUE, 0)
            self.ens.nueva_sesion(inicio)
            self._seg_ini = inicio
        for pcm in previo:   # modo «voz»: el comienzo de la frase no se pierde
            self.cliente.enviar(pcm)

    def _estado_cliente(self, estado: str, info: dict) -> None:
        if estado == "cerrado":
            estado = "esperando_voz" if self.on and self.modo == "voz" else ("apagado" if not self.on else "reconectando")
        if not self.on and estado != "apagado":
            return
        self._fijar_estado(estado, info)

    def _mensaje(self, m: dict) -> None:
        t = m.get("message_type")
        if t == "partial_transcript":
            if (m.get("text") or "").strip():
                self.bus.publicar({"tipo": "parcial", "texto": str(m["text"])[-120:]})
        elif t == "committed_transcript":
            with self._lock:
                fin = max(self._seg_ini, self.anillo.total - int(RATE * COLA_VAD_S))
                rango = (self._seg_ini, fin)
                self._seg_ini = self.anillo.total
                self.ens.committed(int(m.get("segment_index", -1)), str(m.get("text") or ""), rango, self.reloj())
        elif t == "diarized_transcript":
            with self._lock:
                self.ens.diarized(int(m.get("segment_index", -1)), m.get("words"))
        elif t == "speakers_merged":
            with self._lock:
                vieja, nueva = self.ens.etiquetas.fusionar(self.ens.sesion, m.get("from_speaker_id"), m.get("to_speaker_id"))
                for x in self.turnos:
                    if x["hablante"] == vieja:
                        x["hablante"] = nueva
                if vieja in self.hablantes and nueva not in self.hablantes:
                    self.hablantes[nueva] = self.hablantes[vieja]
                self.hablantes.pop(vieja, None)
                hab = dict(self.hablantes)
            self.bus.publicar({"tipo": "fusion", "de": vieja, "a": nueva, "hablantes": hab})
        elif m.get("error"):
            self.ultimo_error = f"{t}: {m.get('error')}"[:200]
            self.bus.publicar({"tipo": "error", "error": self.ultimo_error})

    # ---------- turnos ----------
    def _emitir(self, texto: str, hablante: str, rango: tuple[int, int] | None) -> None:
        """Lo llama el ensamblador (con el lock tomado). Si la voz no tiene nombre y hay huellas registradas, se pregunta
        quién es antes de publicar (en otro hilo, con tope): así la TV recibe la persona en el primer evento."""
        if not texto:
            return
        self._n_turno += 1
        turno = {"id": self._n_turno, "texto": texto, "hablante": hablante,
                 "persona": self.hablantes.get(hablante) if hablante else None, "reconocida": False}
        audio = None
        if not turno["persona"] and rango and self.voces_quien is not None:
            try:
                hay = self.voces_hay()
            except Exception:
                hay = False
            audio = self.anillo.recorte(*rango) if hay else None
        if audio is None:
            self._publicar_turno(turno)
        else:
            threading.Thread(target=self._reconocer, args=(turno, audio), daemon=True).start()

    def _reconocer(self, turno: dict, audio: bytes) -> None:
        r: dict = {}
        hilo = threading.Thread(target=lambda: r.update(self._quien_seguro(audio)), daemon=True)
        hilo.start()
        hilo.join(VOCES_ESPERA_S)
        persona = r.get("persona") if not hilo.is_alive() else None
        if persona:
            with self._lock:
                h = turno["hablante"]
                if h and h not in self.hablantes:
                    self.hablantes[h] = persona
                    self.auto[h] = persona
            turno = {**turno, "persona": persona, "reconocida": True}
        self._publicar_turno(turno)

    def _quien_seguro(self, audio: bytes) -> dict:
        try:
            return self.voces_quien(audio) or {}
        except Exception:
            return {}

    def _publicar_turno(self, turno: dict) -> None:
        with self._lock:
            self.turnos.append(turno)
            hab = dict(self.hablantes)
        self.bus.publicar({"tipo": "turno", **turno, "hablantes": hab})

    def _fijar_estado(self, estado: str, info: dict | None = None) -> None:
        with self._lock:
            self.estado = estado
        self._publicar_estado(info)

    def _publicar_estado(self, info: dict | None = None) -> None:
        self.bus.publicar({"tipo": "estado", "estado": self.estado, "on": self.on, "modo": self.modo, **(info or {})})
