/**
 * Modelos de mirada → pantalla.
 *
 * El iPhone puede estar en cualquier lugar (abajo, arriba, al lado, al frente):
 * no asumimos su posición, la calibración la aprende. Probamos varios modelos
 * candidatos y elegimos el de menor error con validación cruzada "deja un punto
 * fuera" (LOPO), que mide cómo predice zonas de la pantalla que no vio.
 *
 *  - plane:       rayo de mirada ∩ plano z=0 de la cámara (≈ plano de la pantalla
 *                 cuando el iPhone está junto a ella) + deformación cuadrática.
 *                 Físicamente correcto ante movimientos de cabeza.
 *  - planeLinear: igual pero afín (robusto con pocos datos).
 *  - direct:      regresión sobre ángulos de mirada + posición del ojo.
 *                 Mejor cuando el iPhone está lejos del plano de la pantalla.
 */
import { ridgeFit, ridgePredict } from "./linalg.js";
import { inlierMask, median } from "./robust.js";
import { fitHead3d, foldKey, lopoHead3d, predictHead3d } from "./head-model.js";
import { applyResidualMap, buildResidualMap } from "./residual-map.js";
import { applyHeadCorrection, fitHeadCorrection } from "./head-correction.js";

// El mapa de corrección por zonas solo se activa con datos de uso real (clics de Entrenar):
// con clics mejoró en tus logs (198→146 y 240→114 px); solo con calibración no mejoró de forma consistente.
const CLICK_POINT_ID = 1000;
const MIN_CLICKS_FOR_MAP = 4;

// El modelo 3D (cabeza + ojo + pantalla) se prefiere si su error CV no es mucho peor que el
// del mejor modelo 2D: los modelos 2D solo son buenos con la cabeza inmóvil (ver head-model.js).
const HEAD3D_TOLERANCE = 1.25;

// lookAt: punto de convergencia de ARKit · eyes: bisectriz de ambos ojos · hybrid: promedio de ambos
// (promediar dos estimaciones con ruido parcialmente independiente suele bajar el error).
// binocular: cada ojo con su propio origen y dirección corta el plano; se promedian los dos puntos.
export const SOURCES = Object.freeze(["lookAt", "eyes", "hybrid", "binocular"]);
// "direct" (regresión sobre ángulos) queda fuera de la selección: en 17 calibraciones reales dio
// 7,5° de media y hasta 27° (extrapola mal cuando la cabeza se mueve entre puntos); el plano, 2,2°.
export const KINDS = Object.freeze(["plane", "planeLinear"]);
const LAMBDAS = Object.freeze([1e-6, 1e-5, 1e-4, 1e-3, 1e-2, 1e-1]);
/** Complejidad creciente: ante empate estadístico gana el modelo más simple (generaliza mejor). */
const COMPLEXITY = Object.freeze({ planeLinear: 0, plane: 1, direct: 2 });
/** Dos candidatos dentro de este margen relativo de error CV se consideran empatados. */
const TIE_MARGIN = 0.03;
export const BLINK_THRESHOLD = 0.45;

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
const normalize = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return l > 1e-9 ? [v[0] / l, v[1] / l, v[2] / l] : null;
};

/**
 * ¿El cuadro sirve para estimar mirada? Cara seguida y AL MENOS un ojo abierto:
 * un parpadeo cierra ambos; con ptosis (párpado caído, frecuente en ELA) uno solo basta.
 */
export function isUsable(frame) {
  return Boolean(frame && frame.tracked && Math.min(frame.blinkL, frame.blinkR) < BLINK_THRESHOLD);
}

/**
 * Rayo de mirada en coordenadas de cámara.
 * @param {object} frame cuadro decodificado
 * @param {"lookAt"|"eyes"} source
 * @returns {{o:number[], d:number[]}|null}
 */
export function gazeRay(frame, source) {
  const o = mid(frame.leftEyePos, frame.rightEyePos);
  const dLook = source === "eyes" ? null : normalize(sub(frame.lookAt, o));
  const dEyes = source === "lookAt" ? null : normalize(add(frame.leftEyeDir, frame.rightEyeDir));
  const d = source === "hybrid" ? (dLook && dEyes ? normalize(add(dLook, dEyes)) : (dLook ?? dEyes)) : (dLook ?? dEyes);
  return d ? { o, d } : null;
}

/** Intersección del rayo con el plano z = z0 (metros). null si el rayo se aleja del plano. */
export function planePoint(ray, z0 = 0) {
  if (!ray || Math.abs(ray.d[2]) < 1e-4) return null;
  const t = (z0 - ray.o[2]) / ray.d[2];
  if (!(t > 0)) return null; // mirando en sentido contrario al plano: no hay punto válido
  return [ray.o[0] + t * ray.d[0], ray.o[1] + t * ray.d[1]];
}

/** Promedio de las intersecciones de cada ojo con el plano z=0 (null si alguno falla). */
export function binocularPoint(frame) {
  const dl = normalize(frame.leftEyeDir);
  const dr = normalize(frame.rightEyeDir);
  if (!dl || !dr) return null;
  const pl = planePoint({ o: [...frame.leftEyePos], d: dl });
  const pr = planePoint({ o: [...frame.rightEyePos], d: dr });
  return pl && pr ? [(pl[0] + pr[0]) / 2, (pl[1] + pr[1]) / 2] : null;
}

/** Vector de features para un tipo de modelo, o null si no se puede calcular. */
export function featuresFor(kind, frame, source) {
  const ray = gazeRay(frame, source);
  if (!ray) return null;
  if (kind === "direct") {
    if (Math.abs(ray.d[2]) < 1e-4) return null;
    const gx = ray.d[0] / ray.d[2];
    const gy = ray.d[1] / ray.d[2];
    return [gx, gy, gx * gx, gy * gy, gx * gy, ray.o[0], ray.o[1], ray.o[2]];
  }
  const p = source === "binocular" ? binocularPoint(frame) : planePoint(ray);
  if (!p || !Number.isFinite(p[0]) || Math.abs(p[0]) > 5 || Math.abs(p[1]) > 5) return null;
  return kind === "planeLinear" ? p : [p[0], p[1], p[0] * p[0], p[1] * p[1], p[0] * p[1]];
}

/**
 * Limpia muestras: quita parpadeos, pérdidas de seguimiento y atípicos por punto
 * (p. ej. una mirada que llegó tarde al punto).
 * @param {{pointId:number, target:{x:number,y:number}, frame:object}[]} samples
 */
export function cleanSamples(samples) {
  const usable = samples.filter((s) => isUsable(s.frame));
  const byPoint = groupBy(usable, (s) => s.pointId);
  return [...byPoint.values()].flatMap((group) => {
    const pts = group.map((s) => {
      const p = planePoint(gazeRay(s.frame, "lookAt")) ?? [Number.NaN, Number.NaN];
      return { x: p[0], y: p[1] };
    });
    // En la fase de movimiento la cabeza se mueve a propósito: no son atípicos, son la señal.
    if (group.length < 5 || group[0].motion) return group;
    // Un rayo que no corta la pantalla ya no desactiva el filtro de todo el punto: se descarta solo él.
    const idx = pts.map((p, i) => (Number.isFinite(p.x) && Number.isFinite(p.y) ? i : -1)).filter((i) => i >= 0);
    if (idx.length < 5) return group;
    const mask = inlierMask(idx.map((i) => pts[i]));
    return idx.filter((_, k) => mask[k]).map((i) => group[i]);
  });
}

function groupBy(xs, keyFn) {
  const m = new Map();
  for (const x of xs) {
    const k = keyFn(x);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(x);
  }
  return m;
}

/** Filas con peso 1/n_punto: cada punto de calibración cuenta igual aunque tenga más cuadros. */
function buildRows(kind, source, samples) {
  const rows = [];
  const counts = new Map();
  for (const s of samples) {
    const f = featuresFor(kind, s.frame, source);
    if (!f) continue;
    rows.push({ f, s, w: 1 });
    counts.set(s.pointId, (counts.get(s.pointId) ?? 0) + 1);
  }
  return rows.map((r) => ({ ...r, w: 1 / counts.get(r.s.pointId) }));
}

function fitRows(rows, lambda) {
  const X = rows.map((r) => r.f);
  const W = rows.map((r) => r.w);
  return {
    mx: ridgeFit(X, rows.map((r) => r.s.target.x), lambda, W),
    my: ridgeFit(X, rows.map((r) => r.s.target.y), lambda, W),
  };
}

/** Error medio (px) por punto dejado fuera, usando la mediana de sus predicciones. */
function lopoError(rows, lambda) {
  const groups = groupBy(rows, (r) => foldKey(r.s.target)); // pliegue por LUGAR (ver foldKey)
  if (groups.size < 5) return { mean: Number.POSITIVE_INFINITY, perPoint: [] };
  const perPoint = [];
  for (const [key, held] of groups) {
    const train = rows.filter((r) => foldKey(r.s.target) !== key);
    if (train.length < 10) return { mean: Number.POSITIVE_INFINITY, perPoint: [] };
    const fit = fitRows(train, lambda);
    const px = median(held.map((r) => ridgePredict(fit.mx, r.f)));
    const py = median(held.map((r) => ridgePredict(fit.my, r.f)));
    const t = held[0].s.target;
    perPoint.push({ pointId: held[0].s.pointId, target: t, predicted: { x: px, y: py }, error: Math.hypot(px - t.x, py - t.y) });
  }
  return { mean: perPoint.reduce((a, p) => a + p.error, 0) / perPoint.length, perPoint };
}

/**
 * Prueba todos los candidatos y devuelve el mejor ya entrenado con todos los datos.
 * @returns {{model:object, cvErrorPx:number, perPoint:object[], pxPerMeter:number|null, candidates:{name:string,cvErrorPx:number}[]}}
 */
export function fitBest(rawSamples, { metersPerPx = null, head3d = false, fixed = null, kinds = KINDS, lambdas = LAMBDAS, headCorrection = true } = {}) {
  const samples = cleanSamples(rawSamples);
  if (samples.length < 30) throw new Error("Muy pocas muestras útiles: revisa que el iPhone vea bien tu cara");
  // headCorrection:false = solo modelo plano, sin aprender nada del movimiento de cabeza (Myo OS).
  const finish = (base) => (headCorrection ? withHeadCorrection(base, samples) : base);
  if (fixed) return refitFixed(samples, fixed, metersPerPx, finish);
  // El modelo base se elige y ajusta con la cabeza QUIETA; la fase de movimiento solo alimenta la
  // corrección de cabeza (head-correction.js), que es lineal, conservadora y con tope.
  const still = samples.filter((s) => !s.motion);
  const baseSamples = still.length >= 30 ? still : samples;
  const candidates = [];
  for (const source of SOURCES) {
    for (const kind of kinds) {
      const rows = buildRows(kind, source, baseSamples);
      if (rows.length < 30) continue;
      for (const lambda of lambdas) {
        let cv;
        try {
          cv = lopoError(rows, lambda);
        } catch {
          continue; // sistema singular en algún pliegue: descarta solo este candidato
        }
        if (!Number.isFinite(cv.mean)) continue;
        candidates.push({ name: `${kind}·${source}·λ${lambda}`, kind, source, lambda, rows, cv });
      }
    }
  }
  if (candidates.length === 0) throw new Error("No se pudo construir ningún modelo con estos datos");
  const best2d = pickBest(candidates);

  // Candidatos 3D (requieren el cuaternión de la cabeza: app del iPhone v2).
  const candidates3d = [];
  if (head3d) {
    for (const quad of [false, true]) {
      try {
        const m = fitHead3d(samples, { metersPerPx, quad });
        const cv = lopoHead3d(samples, m);
        if (Number.isFinite(cv.mean)) candidates3d.push({ name: `head3d${quad ? "·cuadrático" : "·afín"}`, kind: "head3d", cv, m });
      } catch {
        /* sin pose de cabeza o sin convergencia: seguimos con 2D */
      }
    }
  }
  // El cuadrático solo gana si mejora claramente (>10 %): extrapola peor en los bordes.
  const best3d = candidates3d.length ? candidates3d.reduce((a, b) => (b.cv.mean < a.cv.mean * 0.9 ? b : a)) : null;
  const use3d = best3d && best3d.cv.mean <= best2d.cv.mean * HEAD3D_TOLERANCE;

  let model, best;
  if (use3d) {
    best = best3d;
    model = Object.freeze({ kind: "head3d", source: best3d.m.quad ? "cuadrático" : "afín", quad: best3d.m.quad, p: best3d.m.p, s: best3d.m.s, freeScale: best3d.m.freeScale });
  } else {
    best = best2d;
    const fit = fitRows(best.rows, best.lambda);
    model = finish(Object.freeze({ kind: best.kind, source: best.source, lambda: best.lambda, mx: fit.mx, my: fit.my }));
  }
  const clickIds = new Set(samples.filter((x) => x.pointId >= CLICK_POINT_ID).map((x) => x.pointId));
  if (clickIds.size >= MIN_CLICKS_FOR_MAP) {
    const base = model;
    const residual = buildResidualMap(samples, (f) => predict(base, f));
    if (residual) model = Object.freeze({ ...base, residual });
  }
  const all = [...candidates, ...candidates3d];
  return {
    model,
    cvErrorPx: best.cv.mean,
    perPoint: best.cv.perPoint,
    pxPerMeter: use3d && best3d.m.s ? 1 / best3d.m.s : estimatePxPerMeter(samples),
    robustToHead: Boolean(use3d || model.head),
    candidates: all
      .map((c) => ({ name: c.name, cvErrorPx: c.cv.mean }))
      .sort((a, b) => a.cvErrorPx - b.cvErrorPx),
  };
}

/**
 * Re-entrena SOLO el modelo ya elegido (mismo tipo, fuente y regularización) con más datos.
 * La selección con validación cruzada ya se hizo; repetirla con todos los datos costaba ~10 s
 * de "Calculando…" al final de la calibración sin cambiar la elección.
 */
function refitFixed(samples, fixed, metersPerPx, finish) {
  let model;
  if (fixed.kind === "head3d") {
    const m = fitHead3d(samples, { metersPerPx, quad: fixed.quad });
    model = Object.freeze({ kind: "head3d", source: fixed.source, quad: m.quad, p: m.p, s: m.s, freeScale: m.freeScale });
  } else {
    const still = samples.filter((s) => !s.motion);
    const rows = buildRows(fixed.kind, fixed.source, still.length >= 30 ? still : samples);
    if (rows.length < 30) throw new Error("Muy pocas muestras útiles para re-entrenar");
    const fit = fitRows(rows, fixed.lambda);
    model = finish(Object.freeze({ kind: fixed.kind, source: fixed.source, lambda: fixed.lambda, mx: fit.mx, my: fit.my }));
  }
  const clickIds = new Set(samples.filter((x) => x.pointId >= CLICK_POINT_ID).map((x) => x.pointId));
  if (clickIds.size >= MIN_CLICKS_FOR_MAP) {
    const base = model;
    const residual = buildResidualMap(samples, (f) => predict(base, f));
    if (residual) model = Object.freeze({ ...base, residual });
  }
  return {
    model,
    cvErrorPx: Number.NaN, // sin validación cruzada: el error honesto es el de la ronda anterior
    perPoint: [],
    pxPerMeter: model.kind === "head3d" && model.s ? 1 / model.s : estimatePxPerMeter(samples),
    robustToHead: model.kind === "head3d" || Boolean(model.head),
    candidates: [],
  };
}

/** Añade la corrección de cabeza si hubo fase de movimiento (si no, el modelo queda igual). */
function withHeadCorrection(base, samples) {
  const head = fitHeadCorrection(samples, (f) => predictBase(base, f));
  return head ? Object.freeze({ ...base, head }) : base;
}

/** El de menor error CV; entre los empatados (±TIE_MARGIN) el más simple, y con más regularización. */
function pickBest(candidates) {
  const minError = Math.min(...candidates.map((c) => c.cv.mean));
  const tied = candidates.filter((c) => c.cv.mean <= minError * (1 + TIE_MARGIN));
  return tied.reduce((a, b) => {
    const byComplexity = COMPLEXITY[a.kind] - COMPLEXITY[b.kind];
    if (byComplexity !== 0) return byComplexity < 0 ? a : b;
    return b.cv.mean < a.cv.mean ? b : a;
  });
}

/** Escala px/m de la pantalla (para expresar el error en grados). */
function estimatePxPerMeter(samples) {
  const rows = buildRows("planeLinear", "lookAt", samples);
  if (rows.length < 30) return null;
  const { mx, my } = fitRows(rows, 1e-6);
  const a1 = mx.w[1] / mx.std[0], a2 = mx.w[2] / mx.std[1];
  const b1 = my.w[1] / my.std[0], b2 = my.w[2] / my.std[1];
  const det = Math.abs(a1 * b2 - a2 * b1);
  return det > 0 && Number.isFinite(det) ? Math.sqrt(det) : null;
}

/**
 * Predice el punto en pantalla (px CSS). null si no hay seguimiento o hay parpadeo.
 * @param {object} model
 * @param {object} frame
 */
export function predict(model, frame) {
  let p = predictBase(model, frame);
  if (model.head) p = applyHeadCorrection(model.head, frame, p);
  return model.residual ? applyResidualMap(model.residual, p) : p;
}

/** Predicción del modelo global, sin el mapa de zonas. */
function predictBase(model, frame) {
  if (!isUsable(frame)) return null;
  if (model.kind === "head3d") return predictHead3d(model, frame);
  const f = featuresFor(model.kind, frame, model.source);
  if (!f) return null;
  const x = ridgePredict(model.mx, f);
  const y = ridgePredict(model.my, f);
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

/** Error en px → grados visuales. */
export function pxToDegrees(px, pxPerMeter, distanceM) {
  if (!pxPerMeter || !distanceM) return null;
  return (Math.atan(px / pxPerMeter / distanceM) * 180) / Math.PI;
}
