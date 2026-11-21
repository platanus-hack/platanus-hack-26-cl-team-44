/**
 * Telemetría y log de sesión.
 * - Registra en continuo la salud de la señal (1 muestra/s) y eventos de falla.
 * - Guarda cada calibración con sus cuadros crudos, para poder re-analizarla offline
 *   (tools/analyze.mjs) y mejorar modelos sin repetir pruebas.
 * - Autoguarda en el servidor local (software/eye-tracking/logs/<sesión>.json). Nunca sale de este Mac.
 */
import { isUsable, gazeRay } from "./model.js";

const FLUSH_MS = 20_000;
const LOST_MIN_MS = 300;
const GAP_MS = 120;
const R = (x) => Math.round(x * 1e5) / 1e5;
const R3 = (v) => [R(v[0]), R(v[1]), R(v[2])];

const DEG = 180 / Math.PI;

/**
 * Cómo veía el iPhone la cara en un cuadro: sirve para explicar por qué se perdió.
 * offH/offV: cuánto está la cara fuera del eje de la cámara · facing: ángulo cabeza→cámara.
 */
export function faceContext(f) {
  if (!f) return null;
  const [x, y, z] = f.headPos;
  const to = [-x, -y, -z];
  const lt = Math.hypot(...to), lf = Math.hypot(...f.headFwd);
  const facing = lt && lf ? Math.acos(Math.max(-1, Math.min(1, (to[0] * f.headFwd[0] + to[1] * f.headFwd[1] + to[2] * f.headFwd[2]) / (lt * lf)))) * DEG : null;
  return {
    distCm: Math.round(Math.hypot(x, y, z) * 100),
    offH: Math.round(Math.atan2(x, -z) * DEG),
    offV: Math.round(Math.atan2(y, -z) * DEG),
    facing: facing != null ? Math.round(facing) : null,
    blink: Math.round(Math.max(f.blinkL, f.blinkR) * 100) / 100,
  };
}

/** Cuadro → objeto compacto para el log. */
export function serializeFrame(f) {
  return {
    t: R(f.t), k: f.tracked ? 1 : 0,
    le: R3(f.leftEyePos), ld: R3(f.leftEyeDir), re: R3(f.rightEyePos), rd: R3(f.rightEyeDir),
    la: R3(f.lookAt), hp: R3(f.headPos), hf: R3(f.headFwd),
    bl: R(f.blinkL), br: R(f.blinkR), sq: R(f.squint), am: Math.round(f.ambient), th: f.thermal, g: R3(f.gravity),
    lk: f.look ? f.look.map((x) => Math.round(x * 1000) / 1000) : undefined,
    q: f.headQuat ? f.headQuat.map((x) => Math.round(x * 1e6) / 1e6) : undefined,
  };
}

/** Objeto compacto → cuadro con la misma forma que decodeFrame(). */
export function deserializeFrame(o) {
  return Object.freeze({
    t: o.t, seq: 0, tracked: o.k === 1,
    leftEyePos: o.le, leftEyeDir: o.ld, rightEyePos: o.re, rightEyeDir: o.rd,
    lookAt: o.la, headPos: o.hp, headFwd: o.hf,
    blinkL: o.bl, blinkR: o.br, squint: o.sq, ambient: o.am, thermal: o.th, fps: 0, gravity: o.g, battery: -1,
    rescues: 0, look: o.lk ?? null, headQuat: o.q ?? null,
  });
}

export const serializeSamples = (samples) => samples.map((s) => ({ p: s.pointId, x: s.target.x, y: s.target.y, m: s.motion ? 1 : undefined, f: serializeFrame(s.frame) }));
export const deserializeSamples = (rows) => rows.map((r) => ({ pointId: r.p, target: { x: r.x, y: r.y }, motion: r.m === 1, frame: deserializeFrame(r.f) }));

/**
 * Precisión (dispersión) de la mirada mientras la persona fija un punto:
 * RMS angular respecto de la dirección media, en grados. Menor = señal más estable.
 * @param {object[]} frames
 * @param {string} source
 */
export function angularPrecision(frames, source = "eyes") {
  const dirs = frames.filter(isUsable).map((f) => gazeRay(f, source)?.d).filter(Boolean);
  if (dirs.length < 10) return { precisionDeg: Number.NaN, n: dirs.length };
  const m = [0, 1, 2].map((i) => dirs.reduce((a, d) => a + d[i], 0) / dirs.length);
  const ml = Math.hypot(...m);
  const mean = m.map((x) => x / ml);
  const sq = dirs.reduce((a, d) => {
    const c = Math.max(-1, Math.min(1, d[0] * mean[0] + d[1] * mean[1] + d[2] * mean[2]));
    return a + Math.acos(c) ** 2;
  }, 0);
  return { precisionDeg: (Math.sqrt(sq / dirs.length) * 180) / Math.PI, n: dirs.length };
}

function newSessionId() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `${stamp}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {{hub:{subscribe:Function}, connStats:()=>object}} deps
 */
export function createSession({ hub, connStats }) {
  const log = {
    sessionId: newSessionId(),
    version: 1,
    startedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    screen: { w: screen.width, h: screen.height, dpr: devicePixelRatio },
    source: null,
    placement: null,
    display: null,
    events: [],
    stability: [],
    calibrations: [],
    probes: [],
    telemetry: [],
  };
  const t0 = performance.now();
  const now = () => Math.round(performance.now() - t0);

  // ventana de 1 s
  let win = { frames: 0, tracked: 0, usable: 0, blinks: 0, gaps: 0 };
  let lastArrival = 0;
  let wasBlink = false;
  let lostSince = null;
  let lostContext = null;
  let lastTracked = null;
  let lastRescues = null;
  let latest = null;
  let dirty = true;
  const totals = { blinks: 0, lostEvents: 0, gaps: 0 };
  const recent = []; // últimos 60 s para el panel
  // En pausa (la persona se cansó, mira a otro lado, se depura algo) nada se cuenta como falla:
  // ni pérdidas de cara, ni rescates, ni segundos de telemetría. Quedan marcadas "pausa"/"reanudar".
  let paused = false;

  const event = (type, detail = {}) => {
    log.events.push({ at: now(), type, ...detail });
    dirty = true;
  };

  function onFrame(f) {
    latest = f;
    if (paused) return;
    const arrival = performance.now();
    if (lastArrival && arrival - lastArrival > GAP_MS) { win.gaps += 1; totals.gaps += 1; }
    lastArrival = arrival;
    latest = f;
    win.frames += 1;
    if (f.tracked) win.tracked += 1;
    if (isUsable(f)) win.usable += 1;
    const blink = f.tracked && (f.blinkL > 0.45 || f.blinkR > 0.45);
    if (blink && !wasBlink) { win.blinks += 1; totals.blinks += 1; }
    wasBlink = blink;
    if (f.tracked) lastTracked = f;
    if (!f.tracked && lostSince === null) {
      lostSince = arrival;
      lostContext = faceContext(lastTracked); // cómo estaba la cara justo antes de perderse
    }
    if (f.tracked && lostSince !== null) {
      const ms = arrival - lostSince;
      if (ms >= LOST_MIN_MS) { totals.lostEvents += 1; event("cara_perdida", { ms: Math.round(ms), antes: lostContext, despues: faceContext(f) }); }
      lostSince = null;
    }
    if (Number.isFinite(f.rescues) && lastRescues !== null && f.rescues > lastRescues) event("iphone_rescate", { total: f.rescues });
    if (Number.isFinite(f.rescues)) lastRescues = f.rescues;
  }

  function tick() {
    if (paused) return;
    const s = connStats();
    const sample = {
      at: now(),
      fps: win.frames,
      trackedPct: win.frames ? Math.round((100 * win.tracked) / win.frames) : 0,
      usablePct: win.frames ? Math.round((100 * win.usable) / win.frames) : 0,
      blinks: win.blinks,
      gaps: win.gaps,
      rttMs: s.rttMs != null ? Math.round(s.rttMs) : null,
      distCm: latest?.tracked ? Math.round(Math.hypot(...latest.headPos) * 100) : null,
      ambient: latest ? Math.round(latest.ambient) : null,
      thermal: latest?.thermal ?? null,
    };
    log.telemetry.push(sample);
    if (log.telemetry.length > 7200) log.telemetry.shift(); // tope: 2 h
    recent.push(sample);
    if (recent.length > 60) recent.shift();
    win = { frames: 0, tracked: 0, usable: 0, blinks: 0, gaps: 0 };
    dirty = true;
  }

  async function flush({ beacon = false } = {}) {
    if (!dirty) return;
    dirty = false;
    const body = JSON.stringify(log);
    try {
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon("/api/log", new Blob([body], { type: "application/json" }));
        return;
      }
      const res = await fetch("/api/log", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: body.length < 60_000 });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      dirty = true; // se reintenta en el próximo ciclo
      log.events.push({ at: now(), type: "log_no_guardado", error: String(err.message ?? err) });
    }
  }

  let unsub = null;
  let tickTimer = null;
  let flushTimer = null;
  const onHide = () => flush({ beacon: true });

  return {
    id: log.sessionId,
    event,
    setSource(kind) { log.source = kind; dirty = true; },
    setPaused(value) {
      if (value === paused) return;
      paused = value;
      event(paused ? "pausa" : "reanudar");
      // al reanudar se empieza limpio: sin "corte de señal" ni pérdida arrastrada desde la pausa
      lastArrival = 0;
      lostSince = null;
      wasBlink = false;
      win = { frames: 0, tracked: 0, usable: 0, blinks: 0, gaps: 0 };
      lastRescues = Number.isFinite(latest?.rescues) ? latest.rescues : lastRescues;
    },
    get paused() { return paused; },
    /** Copia del log (para tests y diagnóstico). */
    snapshot() { return structuredClone(log); },
    setDisplay(info) { log.display = info; dirty = true; },
    setPlacement(label) { log.placement = label; event("ubicacion", { label }); },
    addStability(result) { log.stability.push({ at: now(), ...result }); dirty = true; flush(); },
    addTraining({ samples, ...rest }) {
      log.training = log.training ?? [];
      log.training.push({ at: now(), ...rest, samples: serializeSamples(samples) });
      dirty = true;
    },
    addProbe(errPx, deg) { log.probes.push({ at: now(), errPx: Math.round(errPx), deg: deg != null ? R(deg) : null }); dirty = true; },
    addCalibration(entry) {
      log.calibrations.push({ at: now(), placement: log.placement, ...entry });
      dirty = true;
      flush();
    },
    /** Resumen de los últimos 60 s para el panel de diagnóstico. */
    live() {
      const n = recent.length || 1;
      const avg = (k) => recent.reduce((a, s) => a + (s[k] ?? 0), 0) / n;
      return {
        fps: recent.at(-1)?.fps ?? 0,
        trackedPct: Math.round(avg("trackedPct")),
        usablePct: Math.round(avg("usablePct")),
        blinksPerMin: Math.round(recent.reduce((a, s) => a + s.blinks, 0) * (60 / n)),
        gapsPerMin: Math.round(recent.reduce((a, s) => a + s.gaps, 0) * (60 / n)),
        lostEvents: totals.lostEvents,
      };
    },
    start() {
      unsub = hub.subscribe(onFrame);
      tickTimer = setInterval(tick, 1000);
      flushTimer = setInterval(() => flush(), FLUSH_MS);
      addEventListener("pagehide", onHide);
    },
    stop() {
      unsub?.();
      clearInterval(tickTimer);
      clearInterval(flushTimer);
      removeEventListener("pagehide", onHide);
      flush();
    },
    flush,
  };
}
