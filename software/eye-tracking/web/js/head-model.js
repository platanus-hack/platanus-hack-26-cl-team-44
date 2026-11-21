/**
 * Modelo 3D cabeza + ojo + pantalla ("head3d"). Robusto a girar, inclinar, acercar y alejar la cabeza.
 *
 * Por qué: ARKit mide la POSE DE LA CABEZA con precisión (TrueDepth), pero COMPRIME el giro del
 * OJO dentro de la cabeza (~0,4–0,5×). Los modelos anteriores corregían el rayo ya combinado
 * (cabeza + ojo), amplificando también el giro de la cabeza: cada micro-giro movía el cursor.
 * Aquí se separan:
 *   1. ángulos del ojo en coordenadas de la cara  →  mapeo calibrado (ganancia, sesgo, curvatura)
 *   2. dirección resultante  →  rotada por la pose REAL de la cabeza
 *   3. rayo desde la posición REAL de los ojos  ∩  plano 3D de la pantalla (tamaño físico conocido)
 * Así un movimiento de cabeza cambia el rayo exactamente lo que debe cambiar.
 *
 * Ajuste: Levenberg–Marquardt sobre [mapeo del ojo, pose 3D de la pantalla], multi-arranque.
 */
import { solveLinear } from "./linalg.js";
import { add, col, cross, dot, matToRotvec, mulMV, mulMtV, normalize, quatToMat, rotvecToMat, scale, sub } from "./geometry.js";
import { median } from "./robust.js";

const BLINK = 0.45;
const MAX_ROWS_PER_POINT = 24;
const BAD_RESIDUAL_PX = 1500;
const GAIN_PRIOR = 2.1;
const GAIN_PRIOR_WEIGHT = 150;

/** Peso de cada ojo según su apertura: con ptosis o un ojo cerrado, manda el otro. */
const openness = (b) => Math.max(0.02, Math.min(1, 1 - 1.6 * Math.max(0, b - 0.1)));

/**
 * Features geométricas de un cuadro (o null si no sirve).
 * @returns {{e:number[], R:number[][], yaw:number, pitch:number}|null}
 */
export function headFeatures(frame) {
  if (!frame?.tracked || !frame.headQuat) return null;
  if (Math.min(frame.blinkL, frame.blinkR) >= BLINK) return null; // parpadeo (ambos ojos cerrados)
  const wl = openness(frame.blinkL), wr = openness(frame.blinkR);
  const dl = normalize(frame.leftEyeDir), dr = normalize(frame.rightEyeDir);
  if (!dl || !dr) return null;
  const d = normalize(add(scale(dl, wl), scale(dr, wr)));
  const e = scale(add(scale(frame.leftEyePos, wl), scale(frame.rightEyePos, wr)), 1 / (wl + wr));
  const R = quatToMat(frame.headQuat);
  const l = mulMtV(R, d); // dirección del ojo en coordenadas de la cara
  return { e, R, yaw: Math.atan2(l[0], l[2]), pitch: Math.atan2(l[1], Math.hypot(l[0], l[2])) };
}

const fromAngles = (yaw, pitch) => [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];

/* ---------------- parámetros ----------------
 * p = [m0..m5 (afín) | m6..m11 (cuadrático, opcional) , rv(3), O(3), (logS)]
 *   yaw'   = m0 + m1·yaw + m2·pitch [+ m6·yaw² + m7·yaw·pitch + m8·pitch²]
 *   pitch' = m3 + m4·yaw + m5·pitch [+ m9·yaw² + m10·yaw·pitch + m11·pitch²]
 */
const layout = (quad, freeScale) => {
  const nm = quad ? 12 : 6;
  return { nm, rv: nm, O: nm + 3, logS: freeScale ? nm + 6 : -1, n: nm + 6 + (freeScale ? 1 : 0) };
};

function screenOf(p, L, fixedS) {
  const Rs = rotvecToMat([p[L.rv], p[L.rv + 1], p[L.rv + 2]]);
  return { X: col(Rs, 0), Y: col(Rs, 1), N: col(Rs, 2), O: [p[L.O], p[L.O + 1], p[L.O + 2]], s: L.logS >= 0 ? Math.exp(p[L.logS]) : fixedS };
}

function predictWith(p, L, scr, f) {
  const y = f.yaw, q = f.pitch;
  let yt = p[0] + p[1] * y + p[2] * q;
  let pt = p[3] + p[4] * y + p[5] * q;
  if (L.nm === 12) {
    yt += p[6] * y * y + p[7] * y * q + p[8] * q * q;
    pt += p[9] * y * y + p[10] * y * q + p[11] * q * q;
  }
  const d = mulMV(f.R, fromAngles(yt, pt));
  const den = dot(scr.N, d);
  if (Math.abs(den) < 1e-6) return null;
  const t = dot(scr.N, sub(scr.O, f.e)) / den;
  if (!(t > 0)) return null;
  const rel = sub(add(f.e, scale(d, t)), scr.O);
  return { x: dot(scr.X, rel) / scr.s, y: dot(scr.Y, rel) / scr.s };
}

/** Residuos (px) ponderados + priors suaves. */
function residuals(p, L, rows, fixedS) {
  const scr = screenOf(p, L, fixedS);
  const r = new Array(rows.length * 2 + 4 + (L.nm === 12 ? 6 : 0));
  let k = 0;
  for (const row of rows) {
    const pr = predictWith(p, L, scr, row.f);
    if (pr) {
      r[k++] = (pr.x - row.tx) * row.w;
      r[k++] = (pr.y - row.ty) * row.w;
    } else {
      r[k++] = BAD_RESIDUAL_PX * row.w;
      r[k++] = BAD_RESIDUAL_PX * row.w;
    }
  }
  // Prior: el iPhone está cerca del plano de la pantalla (< 35 cm). Sin esto, con la cabeza
  // quieta, "pantalla lejos + ganancia baja" y "pantalla cerca + ganancia alta" se confunden.
  const off = Math.abs(dot(scr.N, scr.O));
  r[k++] = Math.max(0, off - 0.35) * 3000;
  // Prior: ganancia del ojo plausible (ARKit comprime, no expande más de ~4×).
  r[k++] = (Math.max(0, Math.abs(p[1]) - 4) + Math.max(0, Math.abs(p[5]) - 4)) * 300;
  // Prior suave hacia la compresión medida en datos reales (~0,45 → ganancia ~2,1). Con la cabeza
  // quieta la ganancia se confunde con la distancia a la pantalla; sin esto cada calibración
  // caía en una solución distinta (ganancias de 0,3 a 4 en tus logs).
  r[k++] = (p[1] - GAIN_PRIOR) * GAIN_PRIOR_WEIGHT;
  r[k++] = (p[5] - GAIN_PRIOR) * GAIN_PRIOR_WEIGHT;
  if (L.nm === 12) for (let j = 6; j < 12; j++) r[k++] = p[j] * 40; // curvatura solo si los datos la piden
  return r;
}

const sq = (r) => r.reduce((a, x) => a + x * x, 0);

/** Levenberg–Marquardt con Jacobiano numérico. */
function levenberg(p0, L, rows, fixedS, iters = 40) {
  let p = [...p0];
  let r = residuals(p, L, rows, fixedS);
  let cost = sq(r);
  let mu = 1e-2;
  for (let it = 0; it < iters; it++) {
    const J = [];
    for (let j = 0; j < L.n; j++) {
      const h = 1e-6 * Math.max(1, Math.abs(p[j]));
      const pj = [...p];
      pj[j] += h;
      const rj = residuals(pj, L, rows, fixedS);
      J.push(rj.map((v, i) => (v - r[i]) / h)); // columna j
    }
    const A = Array.from({ length: L.n }, (_, a) => Array.from({ length: L.n }, (_, b) => J[a].reduce((s, v, i) => s + v * J[b][i], 0)));
    const g = J.map((cj) => cj.reduce((s, v, i) => s + v * r[i], 0));
    let improved = false;
    for (let tries = 0; tries < 6 && !improved; tries++) {
      const M = A.map((row, a) => row.map((v, b) => (a === b ? v + mu * (v + 1e-9) : v)));
      let delta;
      try {
        delta = solveLinear(M, g.map((v) => -v));
      } catch {
        mu *= 10;
        continue;
      }
      const pn = p.map((v, j) => v + delta[j]);
      const rn = residuals(pn, L, rows, fixedS);
      const cn = sq(rn);
      if (cn < cost) {
        const rel = (cost - cn) / cost;
        p = pn; r = rn; cost = cn; mu = Math.max(1e-7, mu / 3); improved = true;
        if (rel < 1e-7) return { p, cost };
      } else {
        mu *= 8;
      }
    }
    if (!improved) break;
  }
  return { p, cost };
}

/** Filas de ajuste: submuestreo por punto + peso para que cada punto cuente lo mismo. */
function buildRows(samples) {
  const groups = new Map();
  for (const s of samples) {
    const f = headFeatures(s.frame);
    if (!f) continue;
    if (!groups.has(s.pointId)) groups.set(s.pointId, []);
    groups.get(s.pointId).push({ f, tx: s.target.x, ty: s.target.y, pointId: s.pointId });
  }
  const rows = [];
  for (const g of groups.values()) {
    // Submuestreo repartido en TODA la ventana (antes, con 25–47 cuadros solo se usaban los
    // primeros 24: justo cuando la vista aún se está asentando).
    const n = Math.min(g.length, MAX_ROWS_PER_POINT);
    const picked = Array.from({ length: n }, (_, i) => g[Math.floor((i * g.length) / n)]);
    const w = 1 / Math.sqrt(picked.length);
    for (const row of picked) rows.push({ ...row, w });
  }
  return { rows, points: groups.size };
}

/** Arranques: orientación de la pantalla inferida de cómo cambian los rayos con u y v. */
function initialGuesses(rows, quad, fixedS, freeScale) {
  const L = layout(quad, freeScale);
  const sGuess = fixedS ?? 0.00025;
  const guesses = [];
  for (const gain of [1.7, 2.4]) {
    // rayos aproximados con esta ganancia
    const pts = rows.map((r) => ({ d: mulMV(r.f.R, fromAngles(gain * r.f.yaw, gain * r.f.pitch)), e: r.f.e, u: r.tx, v: r.ty }));
    // d ≈ a + b·u + c·v  (por componente)
    const fit = [0, 1, 2].map((k) => {
      const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], bvec = [0, 0, 0];
      for (const q of pts) {
        const z = [1, q.u, q.v];
        for (let i = 0; i < 3; i++) { bvec[i] += z[i] * q.d[k]; for (let j = 0; j < 3; j++) A[i][j] += z[i] * z[j]; }
      }
      try { return solveLinear(A, bvec); } catch { return null; }
    });
    if (fit.some((x) => !x)) continue;
    const bU = fit.map((c) => c[1]), bV = fit.map((c) => c[2]);
    const X = normalize(bU);
    const Yraw = normalize(sub(bV, scale(X, dot(bV, X ?? [0, 0, 0]))));
    if (!X || !Yraw) continue;
    const N = cross(X, Yraw);
    const uc = median(pts.map((q) => q.u)), vc = median(pts.map((q) => q.v));
    const dc = normalize(fit.map((c) => c[0] + c[1] * uc + c[2] * vc));
    const eMean = [0, 1, 2].map((k) => median(pts.map((q) => q.e[k])));
    const D0 = Math.hypot(...eMean);
    for (const k of [0.85, 1.0, 1.25]) {
      const C = add(eMean, scale(dc, D0 * k));
      const O = sub(C, scale(add(scale(X, uc), scale(Yraw, vc)), sGuess));
      const rv = matToRotvec([[X[0], Yraw[0], N[0]], [X[1], Yraw[1], N[1]], [X[2], Yraw[2], N[2]]]);
      const p = new Array(L.n).fill(0);
      p[1] = gain; p[5] = gain;
      p[L.rv] = rv[0]; p[L.rv + 1] = rv[1]; p[L.rv + 2] = rv[2];
      p[L.O] = O[0]; p[L.O + 1] = O[1]; p[L.O + 2] = O[2];
      if (freeScale) p[L.logS] = Math.log(sGuess);
      guesses.push(p);
    }
  }
  return guesses;
}

/**
 * Ajusta el modelo 3D.
 * @param {{pointId:number, target:{x:number,y:number}, frame:object}[]} samples
 * @param {{metersPerPx?:number|null, quad?:boolean}} opts
 * @returns {{kind:"head3d", quad:boolean, p:number[], s:number|null, freeScale:boolean, rmsPx:number}}
 */
export function fitHead3d(samples, { metersPerPx = null, quad = false } = {}) {
  const { rows, points } = buildRows(samples);
  if (points < 6 || rows.length < 40) throw new Error("head3d: faltan datos con pose de cabeza (¿app del iPhone actualizada?)");
  const freeScale = !(metersPerPx > 0);
  return fitRows(rows, { fixedS: freeScale ? null : metersPerPx, freeScale, quad });
}

/** Ajuste completo (varios arranques + LM) sobre filas ya construidas. */
function fitRows(rows, { fixedS, freeScale, quad, fast = false }) {
  // 1) afín desde varios arranques, 2) opcionalmente cuadrático desde el mejor afín.
  // `fast` (pliegues de validación cruzada): todos los arranques avanzan pocas iteraciones y solo
  // el mejor sigue hasta el final. Mismo resultado en los logs reales, ~3× menos cálculo.
  const La = layout(false, freeScale);
  let best = null;
  for (const g of initialGuesses(rows, false, fixedS, freeScale)) {
    const res = levenberg(g, La, rows, fixedS, fast ? 8 : 35);
    if (!best || res.cost < best.cost) best = res;
  }
  if (best && fast) best = levenberg(best.p, La, rows, fixedS, 27);
  if (!best) throw new Error("head3d: no se pudo inicializar la geometría de la pantalla");
  let L = La, p = best.p;
  if (quad) {
    L = layout(true, freeScale);
    const pq = new Array(L.n).fill(0);
    for (let j = 0; j < 6; j++) pq[j] = p[j];
    for (let j = 0; j < 6 + (freeScale ? 1 : 0); j++) pq[L.rv + j] = p[La.rv + j];
    p = levenberg(pq, L, rows, fixedS, 30).p;
  }
  const errs = rows.map((r) => {
    const pr = predictWith(p, L, screenOf(p, L, fixedS), r.f);
    return pr ? Math.hypot(pr.x - r.tx, pr.y - r.ty) : BAD_RESIDUAL_PX;
  });
  return { kind: "head3d", quad, p, s: fixedS, freeScale, rmsPx: Math.sqrt(errs.reduce((a, x) => a + x * x, 0) / errs.length) };
}

/** Predicción en px CSS, o null si el cuadro no sirve. */
export function predictHead3d(model, frame) {
  const f = headFeatures(frame);
  if (!f) return null;
  const L = layout(model.quad, model.freeScale);
  const pr = predictWith(model.p, L, screenOf(model.p, L, model.s), f);
  return pr && Number.isFinite(pr.x) && Number.isFinite(pr.y) ? pr : null;
}

/** Clave de pliegue: el LUGAR de la pantalla, no el pointId (el centro aparece como punto fijo
 *  y como punto de movimiento; con pointId uno quedaba en el entrenamiento del otro). */
export const foldKey = (target) => `${Math.round(target.x)},${Math.round(target.y)}`;

/**
 * Validación cruzada "deja un lugar fuera", con un ajuste NUEVO por pliegue.
 * Antes cada pliegue arrancaba desde la solución que ya había visto el punto apartado: el error
 * salía optimista (hasta 25 % en un log real) y podía elegir un modelo 3D malo.
 * @returns {{mean:number, perPoint:{pointId:number, target:object, predicted:object, error:number}[]}}
 */
export function lopoHead3d(samples, full) {
  const { rows } = buildRows(samples);
  const L = layout(full.quad, full.freeScale);
  const keys = [...new Set(rows.map((r) => foldKey({ x: r.tx, y: r.ty })))];
  const perPoint = [];
  for (const key of keys) {
    const isHeld = (r) => foldKey({ x: r.tx, y: r.ty }) === key;
    const train = rows.filter((r) => !isHeld(r));
    const held = rows.filter(isHeld);
    let p;
    try {
      p = fitRows(train, { fixedS: full.s, freeScale: full.freeScale, quad: full.quad, fast: true }).p;
    } catch {
      continue;
    }
    const scr = screenOf(p, L, full.s);
    const preds = held.map((r) => predictWith(p, L, scr, r.f)).filter(Boolean);
    if (preds.length < 3) continue;
    const predicted = { x: median(preds.map((q) => q.x)), y: median(preds.map((q) => q.y)) };
    perPoint.push({ pointId: held[0].pointId, target: { x: held[0].tx, y: held[0].ty }, predicted, error: Math.hypot(predicted.x - held[0].tx, predicted.y - held[0].ty) });
  }
  if (perPoint.length < 5) return { mean: Number.POSITIVE_INFINITY, perPoint };
  return { mean: perPoint.reduce((a, x) => a + x.error, 0) / perPoint.length, perPoint };
}

/** Ganancia del ojo estimada (cuánto comprimía ARKit): útil para diagnóstico. */
export const eyeGain = (model) => ({ h: model.p[1], v: model.p[5] });
