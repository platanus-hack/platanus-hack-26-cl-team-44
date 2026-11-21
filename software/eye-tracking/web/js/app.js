/**
 * Orquestación: Conectar → Ubicarse → Calibrar + validar (+ Afinar) → Resultado → Demo.
 * Toda la sesión queda registrada en software/eye-tracking/logs/<sesión>.json (ver telemetry.js).
 */
import { createConnection } from "./connection.js";
import { createSimulator } from "./simulator.js";
import { evaluateSetup, readyToCalibrate, renderChecks, renderViz } from "./setup.js";
import {
  collectMotion, collectSequence, showIntro, drawValidation, evaluateValidation, gazeRangeRatio, qualityLabel,
  MOTION_POINTS, MOTION_VALIDATION_POINTS, REFINE_POINTS, TRAIN_POINTS, VALIDATION_POINTS, VALIDATION_POINTS_B,
} from "./calibration.js";
import { isUsable, pxToDegrees } from "./model.js";
import { fitBestAsync } from "./fitter.js";
import { median } from "./robust.js";
import { createDemo } from "./demo.js";
import { createSession, serializeSamples } from "./telemetry.js";
import { renderStabilityList, runStabilityTest, takeDiagnosticPhoto } from "./placement.js";
import { createDoublePress, installKeyGuard } from "./keyguard.js";

const resultRecalKey = createDoublePress(1500);

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SCREENS = ["connect", "setup", "calib", "result", "demo"];
const HOST_KEY = "soy-gaze-host";

let current = "connect";
let source = null;
let latest = null;
let calibration = null;
let demo = null;
let calibAbort = null;
let lastFitOpts = {};
let pool = { train: [], round: 0, viewport: null }; // muestras acumuladas de la calibración actual
const stabilityResults = [];
const gravityHistory = [];

/* ---------- bus de cuadros ---------- */
const listeners = new Set();
const hub = {
  subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); },
  emit(frame) { for (const cb of listeners) cb(frame); },
};
hub.subscribe((f) => {
  latest = f;
  gravityHistory.push(f.gravity);
  if (gravityHistory.length > 60) gravityHistory.shift();
});

const stats = () => source?.stats() ?? { fps: 0, rttMs: null, stale: true };
const session = createSession({ hub, connStats: stats });
session.start();

/* ---------- teclas fantasma (iPhone apoyado sobre el teclado) ---------- */
let keyWarnTimer = 0;
installKeyGuard({
  onStuck: (key) => {
    const el = $("keywarn");
    el.textContent = `Algo está apretando la tecla «${key}». ¿El iPhone está apoyado sobre el teclado? Ponlo delante del teclado o en un soporte: si toca las teclas, lanza pruebas y recalibraciones solas.`;
    el.hidden = false;
    clearTimeout(keyWarnTimer);
    keyWarnTimer = setTimeout(() => { el.hidden = true; }, 6000);
    session.event("tecla_sostenida", { key });
  },
});

// Escala física de la pantalla (px CSS por metro) para expresar errores en grados reales.
let physicalPxPerMeter = null;
// Puede haber varias pantallas (p. ej. un monitor externo): usamos la que coincide con esta ventana.
// La escala es (resolución ACTUAL de esta pantalla) / (ancho físico): vale con cualquier escalado.
const INCHES_KEY = "soy-screen-inches";
function applyManualInches(inches) {
  const w = screen.width, h = screen.height;
  const widthM = inches * 0.0254 * (w / Math.hypot(w, h));
  physicalPxPerMeter = w / widthM;
  session.setDisplay({ manualInches: inches, screen: { w, h } });
}
fetch("/api/display").then((r) => r.json()).then(({ displays }) => {
  const list = displays ?? [];
  const aspect = screen.width / screen.height;
  const exact = list.find((d) => Math.abs(d.widthPt - screen.width) <= 2 && Math.abs(d.heightPt - screen.height) <= 2);
  const sameAspect = list.filter((d) => Math.abs(d.widthMm / d.heightMm - aspect) < 0.03);
  // Con una sola pantalla no hay duda (el zoom del navegador cambia screen.width, no el ancho físico).
  const match = exact ?? (list.length === 1 ? list[0] : sameAspect.length === 1 ? sameAspect[0] : null);
  session.setDisplay({ all: list, used: match, screen: { w: screen.width, h: screen.height } });
  if (match && match.widthMm > 0) {
    physicalPxPerMeter = screen.width / (match.widthMm / 1000);
    return;
  }
  let saved = null;
  try { saved = Number(localStorage.getItem(INCHES_KEY)); } catch { /* sin almacenamiento */ }
  if (saved > 5) applyManualInches(saved);
  $("screen-size").hidden = false; // no reconocimos esta pantalla: pedimos la diagonal
  if (saved > 5) $("screen-in").value = String(saved);
}).catch(() => { $("screen-size").hidden = false; });
$("screen-in").addEventListener("change", () => {
  const inches = Number($("screen-in").value);
  if (!(inches > 5 && inches < 100)) return;
  applyManualInches(inches);
  try { localStorage.setItem(INCHES_KEY, String(inches)); } catch { /* no crítico */ }
});

function show(name) {
  current = name;
  SCREENS.forEach((s) => { $(s).hidden = s !== name; });
}

/* ---------- 1 · conectar ---------- */
const store = {
  get: () => { try { return localStorage.getItem(HOST_KEY) ?? ""; } catch { return ""; } },
  set: (v) => { try { localStorage.setItem(HOST_KEY, v); } catch { /* almacenamiento bloqueado: no es crítico */ } },
};
$("host").value = new URLSearchParams(location.search).get("host") ?? store.get();

$("connect-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const host = $("host").value;
  source?.close?.();
  source?.stop?.();
  source = createConnection({ onFrame: hub.emit, onStatus: handleStatus });
  if (source.connect(host)) {
    store.set(host.trim());
    session.setSource("iphone");
  }
});

$("simulate").addEventListener("click", () => {
  source?.close?.();
  source = createSimulator({ onFrame: hub.emit });
  source.start();
  session.setSource("simulador");
  $("setup-link").textContent = "Modo simulación: la mirada es tu mouse";
  show("setup");
});

let lastStatus = "";
function handleStatus({ state, detail }) {
  const messages = {
    connecting: `Conectando a ${detail}…`,
    open: "Conectado",
    reconnecting: `Se cortó la conexión. ${detail}`,
    stale: "Conectado, pero no llegan datos. ¿La app está en primer plano y desbloqueada?",
    error: detail,
  };
  const text = messages[state] ?? state;
  $("connect-status").textContent = text;
  $("connect-status").classList.toggle("error", state === "error");
  $("setup-link").textContent = text;
  if (state !== lastStatus && state !== "connecting") session.event(`conexion_${state}`, detail ? { detail } : {});
  lastStatus = state;
  if (state === "open" && current === "connect") show("setup");
}

/* ---------- 2 · ubicarse ---------- */
setInterval(() => {
  if (current !== "setup") return;
  const checks = evaluateSetup(latest, stats(), gravityHistory, placement);
  renderChecks($("checks"), checks);
  renderViz($("viz"), latest, $("viz-msg"));
  $("start-calib").disabled = !readyToCalibrate(checks);
}, 200);

let placement = null;

/* Paso "mueve la cabeza": opcional. En 11 calibraciones reales, quitarlo subió el error medio
   de 2,6° a 3,7° (solo 2D) o 5,8° (3D, con casos de 21°): por eso viene marcado, y si se salta
   se usa el modelo 2D, que falla menos en el peor caso. Pedirlo NO es seguro en ELA (debilidad
   de cuello frecuente), por eso se puede desmarcar. */
const MOTION_KEY = "soy-motion-step";
try { if (localStorage.getItem(MOTION_KEY) === "0") $("motion-opt").checked = false; } catch { /* sin almacenamiento */ }
const withMotion = () => $("motion-opt").checked;
function renderCalibTime() {
  $("calib-time").textContent = withMotion() ? "Toma ~70 s." : "Toma ~40 s. Mantén la cabeza cómoda y quieta.";
}
renderCalibTime();
$("motion-opt").addEventListener("change", () => {
  try { localStorage.setItem(MOTION_KEY, withMotion() ? "1" : "0"); } catch { /* no crítico */ }
  renderCalibTime();
});
document.querySelectorAll("[data-place]").forEach((b) => b.addEventListener("click", () => {
  placement = b.dataset.place;
  document.querySelectorAll("[data-place]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  session.setPlacement(placement);
}));

let measuring = false; // una prueba a la vez: antes se podían lanzar decenas superpuestas
async function measureStability() {
  if (current !== "setup" || measuring) return;
  measuring = true;
  try {
    const result = await runStabilityTest({ hub, stage: $("stab"), counter: $("stab-count") });
    const entry = { placement, ...result };
    stabilityResults.push(entry);
    session.addStability(entry);
    renderStabilityList($("stability-list"), stabilityResults);
  } finally {
    measuring = false;
  }
}
$("stability").addEventListener("click", measureStability);

$("photo").addEventListener("click", async () => {
  $("photo-status").textContent = "Tomando foto con la cámara del Mac…";
  try {
    await takeDiagnosticPhoto(session.id);
    $("photo-status").textContent = "Foto guardada en software/eye-tracking/logs para revisar luz y reflejos.";
    session.event("foto_diagnostico");
  } catch (err) {
    $("photo-status").textContent = `No se pudo tomar la foto: ${err.message}`;
  }
});

$("start-calib").addEventListener("click", () => startCalibration());

/* ---------- 3 · calibrar + validar ---------- */
const calibUi = () => ({ target: $("target"), msg: $("calib-msg"), warn: $("calib-warn"), progress: $("calib-progress") });

async function enterStage() {
  demo?.stop();
  demo = null;
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
  } catch {
    /* el navegador puede negarlo: seguimos en ventana y avisamos en el resultado */
  }
  await new Promise((r) => setTimeout(r, 450)); // deja que la ventana termine de cambiar de tamaño
  show("calib");
  calibAbort = new AbortController();
}

// Una calibración a la vez. Antes, Enter sobre el botón con foco disparaba el clic Y el atajo:
// dos calibraciones corriendo en paralelo sobre la misma pantalla.
let calibrating = false;
async function exclusive(fn) {
  if (calibrating) return;
  calibrating = true;
  try { await fn(); } finally { calibrating = false; }
}

function startCalibration() {
  return exclusive(async () => {
    await enterStage();
    pool = { train: [], round: 0, viewport: { w: innerWidth, h: innerHeight }, motion: withMotion() };
    session.event("calibracion_inicio", { viewport: pool.viewport, placement, movimiento: pool.motion });
    await runRound({ points: TRAIN_POINTS, idOffset: 0, intro: "<b>Sigue el punto con la mirada</b><span>Sin mover la cabeza. Puedes parpadear normal.</span>", kind: "inicial" });
  });
}

function refineCalibration() {
  if (!pool.train.length) return startCalibration();
  return exclusive(async () => {
    await enterStage();
    if (innerWidth !== pool.viewport.w || innerHeight !== pool.viewport.h) {
      calibrating = false;
      return startCalibration();
    }
    pool.round += 1;
    await runRound({ points: REFINE_POINTS, idOffset: 200 * pool.round, intro: "<b>Afinando los bordes</b><span>8 puntos más. Igual que antes.</span>", kind: "afinar" });
  });
}

async function runRound({ points, idOffset, intro, kind }) {
  const ui = calibUi();
  // Cada ronda valida en lugares que el modelo NO ha visto (las validaciones previas ya se usan para entrenar).
  const valPoints = pool.round === 0 ? VALIDATION_POINTS : pool.round === 1 ? VALIDATION_POINTS_B : randomPoints(5);
  try {
    ui.msg.innerHTML = intro;
    const train = await collectSequence({ ui, hub, points, idOffset, label: "Punto", signal: calibAbort.signal, showIntro: true });
    let motion = { samples: [], pointStats: [] };
    if (pool.round === 0 && pool.motion) {
      ui.msg.innerHTML = "<b>Ahora mueve suavemente la cabeza</b><span>Sin dejar de mirar el punto: gira, inclina, acércate y aléjate un poco.</span>";
      await showIntro(ui, calibAbort.signal);
      motion = await collectMotion({ ui, hub, points: MOTION_POINTS, idOffset: 50, label: "Movimiento", signal: calibAbort.signal });
    }
    const allTrain = [...pool.train, ...train.samples, ...motion.samples];
    // Modelo plano (+ corrección de cabeza si hubo fase de movimiento). El 3D ya no se usa:
    // con 17 calibraciones reales era peor quieto (2,8° vs 1,8°) y moviéndose (3,3° vs 2,5°).
    const fitOpts = { metersPerPx: physicalPxPerMeter ? 1 / physicalPxPerMeter : null };
    lastFitOpts = fitOpts;
    // El ajuste corre en otro hilo MIENTRAS se miran los puntos de validación.
    const firstPromise = fitBestAsync(allTrain, fitOpts);
    firstPromise.catch(() => {}); // el error se maneja al hacer await (evita "unhandled rejection")
    ui.msg.innerHTML = "<b>Ahora 5 puntos para medir la precisión</b><span>En lugares que el modelo aún no vio.</span>";
    const valid = await collectSequence({ ui, hub, points: valPoints, idOffset: idOffset + 100, label: "Validación", signal: calibAbort.signal, showIntro: true });
    let motionValid = { samples: [], pointStats: [] };
    if (pool.round === 0 && pool.motion) {
      ui.msg.innerHTML = "<b>Última prueba: mueve la cabeza mirando el punto</b><span>Medimos cuánto resiste la calibración a tus movimientos.</span>";
      await showIntro(ui, calibAbort.signal);
      motionValid = await collectMotion({ ui, hub, points: MOTION_VALIDATION_POINTS, idOffset: 150, label: "Prueba con movimiento", signal: calibAbort.signal });
    }
    ui.progress.textContent = "Calculando…";
    const first = await firstPromise;
    // Mismo modelo elegido por `first`, re-entrenado con todo (sin repetir la selección: ~10 s menos).
    const fixed = { kind: first.model.kind, source: first.model.source, lambda: first.model.lambda, quad: first.model.quad };
    const final = await fitBestAsync([...allTrain, ...valid.samples, ...motionValid.samples], { ...fitOpts, fixed }).catch(() => first);
    pool.train = allTrain;
    finishRound({
      kind, train: allTrain, valid: valid.samples, motionValid: motionValid.samples,
      pointStats: [...train.pointStats, ...motion.pointStats, ...valid.pointStats, ...motionValid.pointStats], first, final,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      session.event("calibracion_cancelada");
      show("setup");
      return;
    }
    session.event("calibracion_error", { error: String(err.message) });
    show("setup");
    $("setup-link").textContent = `No se pudo calibrar: ${err.message}`;
  }
}

function randomPoints(n) {
  return Array.from({ length: n }, () => [0.12 + Math.random() * 0.76, 0.12 + Math.random() * 0.76]);
}

function finishRound({ kind, train, valid, motionValid = [], pointStats, first, final }) {
  const validation = evaluateValidation(first.model, valid);
  const motionValidation = motionValid.length ? evaluateValidation(first.model, motionValid) : null;
  const usable = train.filter((s) => !s.motion && isUsable(s.frame)).map((s) => s.frame);
  const distanceM = median(usable.map((f) => Math.hypot(...f.headPos)));
  const gravity = [0, 1, 2].map((i) => median(usable.map((f) => f.gravity[i])));
  const headMean = [0, 1, 2].map((i) => median(usable.map((f) => f.headPos[i])));
  // `final` se entrenó con entrenamiento + validación (más datos); el error reportado es el de `first` (honesto).
  const pxPerMeter = physicalPxPerMeter ?? final.pxPerMeter ?? first.pxPerMeter;
  const deg = pxToDegrees(validation.meanPx, pxPerMeter, distanceM);
  const motionDeg = motionValidation ? pxToDegrees(motionValidation.meanPx, pxPerMeter, distanceM) : null;
  const range = gazeRangeRatio(train.filter((s) => !s.motion), pxPerMeter, distanceM);
  calibration = Object.freeze({
    model: final.model, pxPerMeter, gravity, headMean, viewport: pool.viewport, distanceM,
    validationPx: validation.meanPx, validationDeg: deg, motionDeg, robustToHead: final.model.kind === "head3d" || Boolean(final.model.head),
  });
  // las muestras de validación pasan al pool: la próxima ronda (Afinar) entrena con todo
  pool.train = [...train, ...valid, ...motionValid];

  session.addCalibration({
    kind, round: pool.round, viewport: pool.viewport, distanceCm: Math.round(distanceM * 100),
    chosen: `${first.model.kind}/${first.model.source}/λ${first.model.lambda}`,
    cvErrorPx: Math.round(first.cvErrorPx), validationPx: Math.round(validation.meanPx), validationDeg: deg,
    pxPerMeter: Math.round(pxPerMeter), physicalScale: physicalPxPerMeter != null, range,
    motionValidationPx: motionValidation ? Math.round(motionValidation.meanPx) : null, motionValidationDeg: motionDeg,
    finalModel: `${final.model.kind}/${final.model.source}`,
    candidates: first.candidates.slice(0, 12),
    perPoint: validation.perPoint.map((p) => ({ target: p.target, predicted: p.predicted, error: Math.round(p.error) })),
    pointStats,
    train: serializeSamples(train),
    valid: serializeSamples(valid),
    motionValid: serializeSamples(motionValid),
  });
  renderResult({ validation, deg, motionDeg, first, final, distanceM, kind, range });
  show("result");
}

function renderResult({ validation, deg, motionDeg, first, final, distanceM, kind, range }) {
  const q = qualityLabel(deg, validation.meanPx);
  $("score").dataset.q = q.key;
  // Sin el tamaño físico de la pantalla, la escala px→° sale del ajuste y está mal identificada
  // (en logs reales variaba 2–18 mil px/m): el número en grados es solo aproximado.
  const approx = physicalPxPerMeter == null ? "≈" : "";
  $("score-deg").textContent = deg != null && Number.isFinite(deg) ? `${approx}${deg.toFixed(1)}°` : "—";
  $("score-px").textContent = Number.isFinite(validation.meanPx) ? `${Math.round(validation.meanPx)} px de error` : "sin datos";
  $("result-title").textContent = kind === "afinar" ? `${q.title} (afinada)` : q.title;
  const fs = document.fullscreenElement ? "" : " Ojo: no estás en pantalla completa; no muevas la ventana.";
  const squeezed = range && ((range.h != null && range.h < 0.5) || (range.v != null && range.v < 0.5));
  const pct = (x) => Math.round(100 * (x ?? 1));
  const rangeText = !squeezed ? ""
    : final.model.head
      ? ` ARKit ve ${pct(range.h)}% / ${pct(range.v)}% del movimiento de tus ojos; la corrección de cabeza ayuda, pero centrar el iPhone frente a tu nariz da más resolución en los bordes.`
      : ` ARKit solo está viendo ${pct(range.h)}% del movimiento horizontal y ${pct(range.v)}% del vertical de tus ojos: pon el iPhone abajo, centrado frente a tu nariz, y recalibra.`;
  const robust = Boolean(final.model.head) || final.model.kind === "head3d";
  const motionText = motionDeg != null && Number.isFinite(motionDeg) ? ` Moviendo la cabeza: ${motionDeg.toFixed(1)}°.` : "";
  const modelText = robust
    ? " Compensa giros y acercamientos suaves de la cabeza (aprendidos en el paso de movimiento)."
    : " Tolera acercarte o moverte un poco; para girar la cabeza, incluye el paso de movimiento al calibrar.";
  $("result-text").textContent = `${q.text}${motionText}${modelText}${rangeText}${fs}`;
  drawValidation($("result-canvas"), validation.perPoint, pool.viewport);
  const top = first.candidates.slice(0, 3).map((c) => `${c.name} ${Math.round(c.cvErrorPx)}px`).join(" · ");
  $("result-details").textContent = `Distancia ${Math.round(distanceM * 100)} cm · ${pool.train.length} muestras · modelo ${final.model.kind}/${final.model.source}${final.model.head ? "+cabeza" : ""} · ${top}`;
  $("log-status").textContent = `Log: software/eye-tracking/logs/${session.id}.json`;
}

/* ---------- 4 · demo ---------- */
function startDemo() {
  if (!calibration) return;
  show("demo");
  session.event("demo_inicio");
  demo = createDemo({
    els: {
      grid: $("grid"), trail: $("trail"), probe: $("probe"), raw: $("raw"), cursor: $("cursor"), banner: $("banner"),
      hudStat: $("hud-stat"), toggleRaw: $("toggle-raw"), smooth: $("smooth"), recal: $("recal"),
      diag: $("diag"), toggleDiag: $("toggle-diag"),
      pause: $("pause"), pausedNote: $("paused-note"),
      root: $("demo"), task: $("task"), gridSize: $("grid-size"),
      modeButtons: [...document.querySelectorAll("[data-mode]")],
    },
    hub,
    connStats: stats,
    calibration,
    session,
    onRecalibrate: () => startCalibration(),
    // Entrenar con mouse: re-ajusta con la calibración + los clics (dato verdadero), en otro hilo.
    refit: async (extra) => {
      const res = await fitBestAsync([...pool.train, ...extra], lastFitOpts);
      session.event("modelo_actualizado", { modelo: `${res.model.kind}/${res.model.source}`, cvPx: Math.round(res.cvErrorPx), clics: new Set(extra.map((x) => x.pointId)).size });
      return res.model;
    },
  });
  demo.start();
}

$("go-demo").addEventListener("click", startDemo);
$("redo").addEventListener("click", () => startCalibration());
$("refine").addEventListener("click", () => refineCalibration());

/* ---------- teclado ---------- */
addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLInputElement) return;
  const k = e.key.toLowerCase();
  if (current === "calib" && e.key === "Escape") calibAbort?.abort();
  else if (current === "setup" && e.key === "Enter" && !measuring && !$("start-calib").disabled) startCalibration();
  else if (current === "setup" && k === "e") measureStability();
  else if (current === "result" && e.key === "Enter") startDemo();
  else if (current === "result" && k === "r") {
    if (resultRecalKey.press()) startCalibration();
    else $("log-status").textContent = "Pulsa R otra vez para recalibrar";
  }
  else if (current === "result" && k === "a") refineCalibration();
});
