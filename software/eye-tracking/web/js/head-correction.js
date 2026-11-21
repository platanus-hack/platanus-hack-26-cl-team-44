/**
 * Corrección conservadora del movimiento de cabeza sobre el modelo PLANO.
 *
 * El modelo plano (rayo de ARKit ∩ plano de la cámara) ya es geométricamente robusto a mover la
 * cabeza; lo que le queda es un error residual que crece con el giro/desplazamiento (ganancia del
 * ojo de ARKit y paralaje entre el plano de la cámara y el de la pantalla). Aquí se aprende ese
 * residuo como una función LINEAL de cuánto se movió la cabeza respecto de la calibración.
 *
 * Evidencia (17 calibraciones reales, 12 con fase de movimiento; error en puntos no vistos):
 *   moviéndote, cuadro a cuadro: plano 3,38° → plano+corrección 2,39° (modelo 3D: 3,34°)
 *   quieto: 2,50° → 1,99° · sin fase de movimiento la corrección no ayudaba → no se aplica.
 *
 * Reglas para "no desfasarse":
 *  1. Solo existe si hubo fase de movimiento (≥ 2 puntos): sin esos datos el efecto no se puede medir.
 *  2. Penalización en unidades físicas (px por grado / por cm): con poca evidencia, corrección ≈ 0.
 *  3. Nunca corrige más de 1,5× lo observado durante la calibración (un giro enorme no extrapola).
 */
import { solveLinear } from "./linalg.js";
import { median } from "./robust.js";

const DEG = 180 / Math.PI;
const KAPPA = 3; // elegido entre 1–10 con los logs: 1 y 10 daban resultados casi iguales
const MIN_MOTION_POINTS = 2;
const MAX_SHIFT_FACTOR = 1.5;
const DIMS = 5;

const usable = (f) => Boolean(f?.tracked && f.headFwd && f.headPos);

/** [giro horizontal °, giro vertical °, x cm, y cm, z cm] de la cabeza en el espacio de la cámara. */
export function headVec(frame) {
  const [fx, fy, fz] = frame.headFwd;
  const [px, py, pz] = frame.headPos;
  return [Math.atan2(fx, fz) * DEG, Math.atan2(fy, fz) * DEG, px * 100, py * 100, pz * 100];
}

/**
 * @param {{pointId:number, target:{x:number,y:number}, frame:object, motion?:boolean}[]} samples
 * @param {(frame:object)=>({x:number,y:number}|null)} basePredict modelo plano ya ajustado
 * @returns {{ref:number[], coef:number[][], maxShift:{x:number,y:number}}|null}
 */
export function fitHeadCorrection(samples, basePredict) {
  const motionPoints = new Set(samples.filter((s) => s.motion).map((s) => s.pointId));
  if (motionPoints.size < MIN_MOTION_POINTS) return null;
  const still = samples.filter((s) => !s.motion && usable(s.frame));
  if (still.length < 10) return null;
  const ref = Array.from({ length: DIMS }, (_, i) => median(still.map((s) => headVec(s.frame)[i])));

  const X = [], Y = [];
  for (const s of samples) {
    if (!usable(s.frame)) continue;
    const p = basePredict(s.frame);
    if (!p) continue;
    X.push(headVec(s.frame).map((v, i) => v - ref[i]));
    Y.push([s.target.x - p.x, s.target.y - p.y]);
  }
  const n = X.length;
  if (n < 20) return null;
  const A = Array.from({ length: DIMS }, (_, a) => Array.from({ length: DIMS }, (_, b) => X.reduce((t, x) => t + x[a] * x[b], 0) + (a === b ? KAPPA * n : 0)));
  let coef;
  try {
    coef = [0, 1].map((d) => solveLinear(A, Array.from({ length: DIMS }, (_, a) => X.reduce((t, x, i) => t + x[a] * Y[i][d], 0))));
  } catch {
    return null;
  }
  // Tope: lo máximo que la corrección movió el punto en los datos de calibración, ×1,5.
  const shifts = X.map((x) => shiftFor(coef, x));
  const maxShift = {
    x: MAX_SHIFT_FACTOR * Math.max(...shifts.map((s) => Math.abs(s.x))),
    y: MAX_SHIFT_FACTOR * Math.max(...shifts.map((s) => Math.abs(s.y))),
  };
  return Object.freeze({ ref, coef, maxShift });
}

function shiftFor(coef, delta) {
  return {
    x: delta.reduce((t, v, i) => t + v * coef[0][i], 0),
    y: delta.reduce((t, v, i) => t + v * coef[1][i], 0),
  };
}

const clamp = (v, m) => Math.max(-m, Math.min(m, v));

/** Aplica la corrección a un punto del modelo base. Sin corrección o sin datos, devuelve `p` igual. */
export function applyHeadCorrection(corr, frame, p) {
  if (!p || !corr || !usable(frame)) return p;
  const s = shiftFor(corr.coef, headVec(frame).map((v, i) => v - corr.ref[i]));
  return { x: p.x + clamp(s.x, corr.maxShift.x), y: p.y + clamp(s.y, corr.maxShift.y) };
}
