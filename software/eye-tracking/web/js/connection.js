/**
 * Conexión WebSocket al iPhone con reconexión, medición de latencia (ping/pong)
 * y detección de señal congelada.
 */
import { decodeFrame } from "./protocol.js";

const PING_MS = 2000;
const STALE_MS = 700;
const MAX_BACKOFF_MS = 5000;

/**
 * Normaliza lo que escribe la persona: "192.168.1.5", "192.168.1.5:8788", "ws://…".
 * @returns {string|null} URL ws:// válida o null
 */
export function toSocketUrl(input) {
  const raw = String(input || "").trim();
  if (!raw) return null;
  const withScheme = /^wss?:\/\//i.test(raw) ? raw : `ws://${raw}`;
  try {
    const url = new URL(withScheme);
    if (!url.port) url.port = "8788";
    if (!/^[a-z0-9.\-[\]:]+$/i.test(url.hostname)) return null;
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

/**
 * @param {{onFrame:(f:object)=>void, onStatus:(s:{state:string, detail?:string})=>void}} handlers
 */
export function createConnection({ onFrame, onStatus }) {
  let ws = null;
  let url = null;
  let wantOpen = false;
  let backoff = 500;
  let pingTimer = null;
  let staleTimer = null;
  let reconnectTimer = null;
  let lastFrameAt = 0;
  let rttMs = null;
  let invalidPackets = 0;
  const arrivals = [];

  const stats = () => {
    const now = performance.now();
    while (arrivals.length && now - arrivals[0] > 1000) arrivals.shift();
    return { fps: arrivals.length, rttMs, invalidPackets, stale: now - lastFrameAt > STALE_MS };
  };

  function open() {
    clearTimeout(reconnectTimer);
    onStatus({ state: "connecting", detail: url });
    try {
      ws = new WebSocket(url);
    } catch (err) {
      onStatus({ state: "error", detail: `Dirección inválida: ${err.message}` });
      return;
    }
    ws.binaryType = "arraybuffer";
    ws.onopen = () => {
      backoff = 500;
      onStatus({ state: "open", detail: url });
      clearInterval(pingTimer);
      pingTimer = setInterval(() => send(`ping:${performance.now().toFixed(1)}`), PING_MS);
      clearInterval(staleTimer);
      staleTimer = setInterval(() => {
        if (stats().stale) onStatus({ state: "stale" });
      }, STALE_MS);
    };
    ws.onmessage = (ev) => {
      if (typeof ev.data === "string") {
        if (ev.data.startsWith("pong:")) rttMs = performance.now() - Number(ev.data.slice(5));
        return;
      }
      const frame = decodeFrame(ev.data);
      if (!frame) {
        invalidPackets += 1;
        return;
      }
      lastFrameAt = performance.now();
      arrivals.push(lastFrameAt);
      onFrame(frame);
    };
    ws.onerror = () => onStatus({
      state: "error",
      detail: /\.local(:\d+)?$/i.test(new URL(url).host)
        ? "No se pudo conectar con el nombre .local. Usa la IP que muestra la app en el iPhone (ej. 192.168.x.x:8788)."
        : "No se pudo conectar. ¿Misma red Wi-Fi? ¿La app está abierta y desbloqueada?",
    });
    ws.onclose = () => {
      clearInterval(pingTimer);
      clearInterval(staleTimer);
      if (!wantOpen) return;
      onStatus({ state: "reconnecting", detail: `Reintentando en ${Math.round(backoff / 100) / 10} s` });
      reconnectTimer = setTimeout(open, backoff);
      backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
    };
  }

  function send(text) {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(text);
  }

  return {
    connect(input) {
      const next = toSocketUrl(input);
      if (!next) {
        onStatus({ state: "error", detail: "Escribe una dirección como 192.168.1.23:8788" });
        return false;
      }
      this.close();
      url = next;
      wantOpen = true;
      open();
      return true;
    },
    close() {
      wantOpen = false;
      clearTimeout(reconnectTimer);
      clearInterval(pingTimer);
      clearInterval(staleTimer);
      if (ws) ws.close();
      ws = null;
    },
    send,
    stats,
  };
}
