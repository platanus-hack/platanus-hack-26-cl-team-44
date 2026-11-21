/**
 * Secuencia de calibración y validación.
 * 13 puntos de entrenamiento (cubren bordes, donde más falla un tracker)
 * + 5 de validación en lugares distintos, para medir el error REAL.
 */
import { gazeRay, isUsable, predict } from "./model.js";
import { median } from "./robust.js";

// Fracciones de la ventana, en orden "serpiente" para minimizar saltos largos de la vista.
export const TRAIN_POINTS = Object.freeze([
  [0.06, 0.08], [0.5, 0.08], [0.94, 0.08],
  [0.72, 0.29], [0.28, 0.29],
  [0.06, 0.5], [0.5, 0.5], [0.94, 0.5],
  [0.72, 0.71], [0.28, 0.71],
  [0.06, 0.92], [0.5, 0.92], [0.94, 0.92],
]);
export const VALIDATION_POINTS = Object.freeze([
  [0.5, 0.24], [0.82, 0.5], [0.5, 0.78], [0.18, 0.5], [0.38, 0.42],
]);
// Segundo set de validación: tras "Afinar", el error se mide en lugares aún no vistos.
export const VALIDATION_POINTS_B = Object.freeze([
  [0.62, 0.18], [0.15, 0.35], [0.85, 0.65], [0.4, 0.85], [0.6, 0.55],
]);
// Fase de movimiento: mirar un punto mientras se mueve la cabeza. Enseña al modelo 3D cómo
// separar el giro de la cabeza del giro del ojo, y luego mide el error con movimiento.
export const MOTION_POINTS = Object.freeze([[0.5, 0.5], [0.2, 0.25], [0.8, 0.75]]);
export const MOTION_VALIDATION_POINTS = Object.freeze([[0.75, 0.3], [0.3, 0.7]]);
const MOTION_MS = 4200;
const MOTION_SKIP_MS = 500;

// "Afinar": densifica bordes, donde los trackers suelen fallar más.
export const REFINE_POINTS = Object.freeze([
  [0.28, 0.08], [0.72, 0.08], [0.94, 0.29], [0.94, 0.71],
  [0.72, 0.92], [0.28, 0.92], [0.06, 0.71], [0.06, 0.29],
]);

export const INTRO_MS = 4000; // tiempo para LEER cada instrucción antes de que empiece la fase

const showIntroCountdown = (ui, signal) => showIntro(ui, signal);
const FADE_MS = 250; // el texto se desvanece antes de que aparezca el punto
export const APPEAR_MS = 700; // el punto "se encoge" hasta su tamaño: atrae la mirada y le da tiempo de llegar

/**
 * Muestra la instrucción SOLA (el punto oculto: si se ve, la vista se va al punto y no se lee),
 * con la cuenta regresiva bajo el texto, donde ya están mirando. Luego el texto se desvanece.
 */
export async function showIntro(ui, signal, ms = INTRO_MS) {
  hideTarget(ui);
  ui.progress.textContent = "";
  ui.msg.classList.remove("is-leaving");
  ui.msg.hidden = false;
  let count = ui.msg.querySelector(".stage__count");
  if (!count) {
    count = document.createElement("em");
    count.className = "stage__count";
    ui.msg.append(count);
  }
  for (let left = Math.ceil(ms / 1000); left > 0; left--) {
    count.textContent = `Empieza en ${left}`;
    await sleep(1000, signal);
  }
  ui.msg.classList.add("is-leaving");
  await sleep(FADE_MS, signal);
  ui.msg.hidden = true;
  ui.msg.classList.remove("is-leaving");
}

function hideTarget(ui) {
  ui.target.classList.remove("collect", "appear");
  ui.target.classList.add("is-hidden");
}

/**
 * Lleva el punto a `target`. Si estaba oculto (después de un texto) aparece ahí directamente,
 * encogiéndose, y se espera APPEAR_MS: la vista viene del texto y necesita ~200 ms de latencia
 * más el salto. Si estaba visible, se desliza y se espera a que la vista lo siga.
 */
async function presentTarget(ui, target, signal, settleMs) {
  const wasHidden = ui.target.classList.contains("is-hidden");
  ui.target.classList.remove("collect");
  if (!wasHidden) {
    ui.target.style.transform = `translate(${target.x}px, ${target.y}px)`;
    await sleep(settleMs, signal);
    return;
  }
  ui.target.classList.add("no-move"); // sin deslizar desde la posición anterior
  ui.target.style.transform = `translate(${target.x}px, ${target.y}px)`;
  void ui.target.offsetWidth;
  ui.target.classList.remove("no-move", "is-hidden");
  ui.target.classList.add("appear");
  await sleep(APPEAR_MS, signal);
  ui.target.classList.remove("appear");
}

const TIMING = Object.freeze({ firstIntroMs: INTRO_MS, moveMs: 450, settleMs: 250, fixMaxMs: 900, collectMs: 1000, maxWaitMs: 5000, minUsable: 20 });
const FIXATION_DEG = 1.2; // dispersión angular máx. de los últimos cuadros para considerar "mirada quieta"
const FIXATION_FRAMES = 8;

/** Dispersión angular (°) máxima entre la dirección media y cada uno de los cuadros. */
export function dispersionDeg(frames) {
  const dirs = frames.filter(isUsable).map((f) => gazeRay(f, "eyes")?.d).filter(Boolean);
  if (dirs.length < Math.min(FIXATION_FRAMES, frames.length) || dirs.length === 0) return Number.POSITIVE_INFINITY;
  const m = [0, 1, 2].map((i) => dirs.reduce((a, d) => a + d[i], 0) / dirs.length);
  const ml = Math.hypot(...m);
  return dirs.reduce((mx, d) => {
    const c = Math.max(-1, Math.min(1, (d[0] * m[0] + d[1] * m[1] + d[2] * m[2]) / ml));
    return Math.max(mx, (Math.acos(c) * 180) / Math.PI);
  }, 0);
}
const EDGE = 44;

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(id); reject(new DOMException("Calibración cancelada", "AbortError")); }, { once: true });
  });

export function toPixels([fx, fy], w = innerWidth, h = innerHeight) {
  return { x: Math.round(Math.max(EDGE, Math.min(w - EDGE, fx * w))), y: Math.round(Math.max(EDGE, Math.min(h - EDGE, fy * h))) };
}

/**
 * Recoge muestras mirando una secuencia de puntos.
 * @param {{ui:{target:HTMLElement, msg:HTMLElement, warn:HTMLElement, progress:HTMLElement},
 *          hub:{subscribe:(cb:Function)=>Function}, points:number[][], idOffset:number,
 *          label:string, signal:AbortSignal, showIntro:boolean}} opts
 */
export async function collectSequence({ ui, hub, points, idOffset, label, signal, showIntro }) {
  const samples = [];
  const pointStats = []; // por punto: tiempo hasta fijar, muestras útiles, reintentos (para el log)
  let latest = null;
  const unsubscribe = hub.subscribe((f) => { latest = f; });
  try {
    if (showIntro) await showIntroCountdown(ui, signal);
    else ui.msg.hidden = true;
    for (let i = 0; i < points.length; i++) {
      const target = toPixels(points[i]);
      ui.progress.textContent = `${label} ${i + 1} de ${points.length}`;
      await presentTarget(ui, target, signal, TIMING.moveMs + TIMING.settleMs);

      let got = await collectPoint({ hub, target, pointId: idOffset + i, ui, signal, getLatest: () => latest });
      let retried = false;
      if (got.filter((s) => isUsable(s.frame)).length < TIMING.minUsable) {
        retried = true;
        ui.warn.textContent = "Repitamos este punto: mira el centro sin mover la cabeza";
        ui.warn.hidden = false;
        await sleep(600, signal);
        got = await collectPoint({ hub, target, pointId: idOffset + i, ui, signal, getLatest: () => latest });
      }
      ui.warn.hidden = true;
      pointStats.push({
        pointId: idOffset + i, target, retried,
        fixationMs: got.fixationMs ?? null,
        usable: got.filter((s) => isUsable(s.frame)).length,
        total: got.length,
      });
      samples.push(...got);
    }
    return { samples, pointStats };
  } finally {
    unsubscribe();
    ui.target.classList.remove("collect");
  }
}

async function collectPoint({ hub, target, pointId, ui, signal, getLatest }) {
  // Espera a que la cara esté visible antes de empezar (máx. maxWaitMs).
  const waitStart = performance.now();
  while (!getLatest()?.tracked) {
    ui.warn.textContent = "No te veo: mira la pantalla, con la cara hacia el iPhone";
    ui.warn.hidden = false;
    if (performance.now() - waitStart > TIMING.maxWaitMs) break;
    await sleep(120, signal);
  }
  ui.warn.hidden = true;

  // Puerta de fijación: espera a que la mirada se quede quieta sobre el punto (máx. fixMaxMs).
  const recent = [];
  const unsubFix = hub.subscribe((f) => { recent.push(f); if (recent.length > FIXATION_FRAMES) recent.shift(); });
  const fixStart = performance.now();
  try {
    while (performance.now() - fixStart < TIMING.fixMaxMs) {
      if (recent.length >= FIXATION_FRAMES && dispersionDeg(recent) < FIXATION_DEG) break;
      await sleep(30, signal);
    }
  } finally {
    unsubFix();
  }
  const fixationMs = Math.round(performance.now() - fixStart);

  const got = [];
  const unsubscribe = hub.subscribe((frame) => got.push({ pointId, target, frame }));
  ui.target.style.setProperty("--collect-ms", `${TIMING.collectMs}ms`);
  void ui.target.offsetWidth; // reinicia la animación del anillo
  ui.target.classList.add("collect");
  try {
    await sleep(TIMING.collectMs, signal);
  } finally {
    unsubscribe();
  }
  // Con la fijación ya confirmada basta descartar ~50 ms de margen.
  const kept = got.slice(Math.min(got.length, 3));
  kept.fixationMs = fixationMs;
  return kept;
}

/**
 * Recoge muestras mientras la persona MUEVE la cabeza mirando cada punto (todas marcadas motion=true).
 * @returns {Promise<{samples:object[], pointStats:object[]}>}
 */
export async function collectMotion({ ui, hub, points, idOffset, label, signal }) {
  const samples = [];
  const pointStats = [];
  try {
    ui.target.classList.remove("collect");
    ui.target.classList.add("motion");
    for (let i = 0; i < points.length; i++) {
      const target = toPixels(points[i]);
      const pointId = idOffset + i;
      ui.progress.textContent = `${label} ${i + 1} de ${points.length}`;
      ui.msg.hidden = true; // el mensaje ya se leyó antes; no debe tapar el punto
      await presentTarget(ui, target, signal, TIMING.moveMs);
      const start = performance.now();
      const got = [];
      const unsub = hub.subscribe((frame) => {
        if (performance.now() - start > MOTION_SKIP_MS) got.push({ pointId, target, frame, motion: true });
      });
      ui.target.style.setProperty("--collect-ms", `${MOTION_MS}ms`);
      void ui.target.offsetWidth;
      ui.target.classList.add("collect");
      try {
        await sleep(MOTION_MS, signal);
      } finally {
        unsub();
        ui.target.classList.remove("collect");
      }
      const heads = got.filter((s) => s.frame.tracked).map((s) => s.frame.headPos);
      const spanCm = heads.length > 2 ? Math.max(...[0, 1, 2].map((k) => Math.max(...heads.map((h) => h[k])) - Math.min(...heads.map((h) => h[k])))) * 100 : 0;
      pointStats.push({ pointId, target, motion: true, usable: got.filter((s) => isUsable(s.frame)).length, total: got.length, headSpanCm: Math.round(spanCm * 10) / 10 });
      samples.push(...got);
    }
    return { samples, pointStats };
  } finally {
    ui.target.classList.remove("motion");
  }
}

/**
 * Error por punto de validación: mediana de predicciones vs. objetivo.
 * @returns {{perPoint:{target:object, predicted:object|null, error:number}[], meanPx:number}}
 */
export function evaluateValidation(model, samples) {
  const byPoint = new Map();
  for (const s of samples) {
    if (!byPoint.has(s.pointId)) byPoint.set(s.pointId, []);
    byPoint.get(s.pointId).push(s);
  }
  const perPoint = [...byPoint.values()].map((group) => {
    const preds = group.map((s) => predict(model, s.frame)).filter(Boolean);
    const target = group[0].target;
    if (preds.length < 5) return { target, predicted: null, error: Number.NaN };
    const predicted = { x: median(preds.map((p) => p.x)), y: median(preds.map((p) => p.y)) };
    return { target, predicted, error: Math.hypot(predicted.x - target.x, predicted.y - target.y) };
  });
  const valid = perPoint.filter((p) => Number.isFinite(p.error));
  const meanPx = valid.length ? valid.reduce((a, p) => a + p.error, 0) / valid.length : Number.NaN;
  return { perPoint, meanPx };
}

/**
 * ¿Cuánto del ángulo real de la pantalla "ve" ARKit? Compara la amplitud de la mirada estimada
 * (mediana por punto) con la amplitud geométrica esperada. ~1 = fiel; < 0,4 = ARKit comprime
 * la mirada (iPhone a un lado o arriba): perderá resolución en los bordes.
 * @returns {{h:number, v:number}|null}
 */
export function gazeRangeRatio(samples, pxPerMeter, distanceM) {
  if (!pxPerMeter || !distanceM) return null;
  const byPoint = new Map();
  for (const s of samples) {
    if (!isUsable(s.frame)) continue;
    const r = gazeRay(s.frame, "eyes");
    if (!r) continue;
    if (!byPoint.has(s.pointId)) byPoint.set(s.pointId, { t: s.target, h: [], v: [] });
    const g = byPoint.get(s.pointId);
    g.h.push(Math.atan2(r.d[0], r.d[2]));
    g.v.push(Math.atan2(r.d[1], r.d[2]));
  }
  const pts = [...byPoint.values()].map((g) => ({ t: g.t, h: median(g.h), v: median(g.v) }));
  if (pts.length < 5) return null;
  const span = (xs) => Math.max(...xs) - Math.min(...xs);
  const expected = (px) => 2 * Math.atan(px / pxPerMeter / 2 / distanceM);
  const eh = expected(span(pts.map((p) => p.t.x)));
  const ev = expected(span(pts.map((p) => p.t.y)));
  return { h: eh > 0 ? span(pts.map((p) => p.h)) / eh : null, v: ev > 0 ? span(pts.map((p) => p.v)) / ev : null };
}

/** Calidad para mostrar a la persona. */
export function qualityLabel(degrees, px) {
  const v = degrees ?? px / 40; // sin escala física: ~40 px por grado a 55 cm
  if (!Number.isFinite(v)) return { key: "mala", title: "No pude medir la precisión", text: "Faltaron datos válidos. Revisa la ubicación y recalibra." };
  if (v < 1.5) return { key: "excelente", title: "Excelente precisión", text: "Al nivel de un tracker infrarrojo. Puedes usar objetivos pequeños." };
  if (v < 2.5) return { key: "buena", title: "Buena precisión", text: "Suficiente para objetivos de ~3° (los botones de Soy). El magnetismo hará el resto." };
  if (v < 4) return { key: "regular", title: "Precisión regular", text: "Usable con objetivos grandes. Mejora la luz, acerca el iPhone y recalibra." };
  return { key: "mala", title: "Precisión baja", text: "Revisa la distancia (35–60 cm), los reflejos en lentes y que el iPhone no se mueva. Recalibra." };
}

/** Dibuja objetivos (iris) vs. estimaciones (alba) a escala. */
export function drawValidation(canvas, perPoint, viewport) {
  const ctx = canvas.getContext("2d");
  const { width: W, height: H } = canvas;
  const sx = W / viewport.w, sy = H / viewport.h;
  ctx.clearRect(0, 0, W, H);
  ctx.lineWidth = 3;
  for (const p of perPoint) {
    const tx = p.target.x * sx, ty = p.target.y * sy;
    if (p.predicted) {
      const px = p.predicted.x * sx, py = p.predicted.y * sy;
      ctx.strokeStyle = "rgba(242,122,61,.7)";
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(px, py); ctx.stroke();
      ctx.fillStyle = "#f27a3d";
      ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = "#3256f5";
    ctx.beginPath(); ctx.arc(tx, ty, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#3256f5";
    ctx.beginPath(); ctx.arc(tx, ty, 4, 0, Math.PI * 2); ctx.fill();
  }
}
