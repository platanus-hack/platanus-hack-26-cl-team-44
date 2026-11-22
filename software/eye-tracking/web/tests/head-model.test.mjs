import { test } from "node:test";
import assert from "node:assert/strict";

import { fitHead3d, predictHead3d, lopoHead3d, headFeatures, eyeGain } from "../js/head-model.js";
import { exampleScreen, synthFrame } from "../js/synth.js";
import { fitBest, predict } from "../js/model.js";
import { decodeFrame, FRAME_FLOATS, IDX } from "../js/protocol.js";

// RNG determinista para que los tests no sean frágiles.
function rng(seed = 7) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const SCREEN = exampleScreen();
const GRID = [];
for (const fy of [0.08, 0.5, 0.92]) for (const fx of [0.06, 0.28, 0.5, 0.72, 0.94]) GRID.push({ x: fx * SCREEN.widthPx, y: fy * SCREEN.heightPx });

function calibSamples({ rand, head = [0, 0.05, -0.5], perPoint = 20, motion = false, noiseDeg = 0.25 }) {
  const out = [];
  GRID.forEach((target, pointId) => {
    for (let k = 0; k < perPoint; k++) out.push({ pointId, target, frame: synthFrame({ head, target, screen: SCREEN, noiseDeg, rand }) });
  });
  if (motion) {
    // fase "mueve la cabeza mirando el punto"
    [{ x: 756, y: 491 }, { x: 300, y: 250 }, { x: 1200, y: 750 }].forEach((target, i) => {
      for (let k = 0; k < 60; k++) {
        const a = (k / 60) * Math.PI * 2;
        out.push({
          pointId: 50 + i, target,
          frame: synthFrame({ head: [head[0] + 0.03 * Math.cos(a), head[1] + 0.02 * Math.sin(a), head[2] + 0.03 * Math.sin(2 * a)], yaw: 8 * Math.sin(a), pitch: 6 * Math.cos(a), target, screen: SCREEN, noiseDeg, rand }),
        });
      }
    });
  }
  return out;
}

/** Error medio (px) con la cabeza en otra pose, mirando los mismos objetivos. */
function poseError(predictFn, pose, rand) {
  const targets = [{ x: 300, y: 200 }, { x: 1200, y: 300 }, { x: 756, y: 491 }, { x: 400, y: 800 }, { x: 1100, y: 850 }];
  const errs = targets.map((target) => {
    const ps = Array.from({ length: 10 }, () => predictFn(synthFrame({ ...pose, target, screen: SCREEN, noiseDeg: 0.25, rand }))).filter(Boolean);
    const x = ps.reduce((a, p) => a + p.x, 0) / ps.length, y = ps.reduce((a, p) => a + p.y, 0) / ps.length;
    return Math.hypot(x - target.x, y - target.y);
  });
  return errs.reduce((a, b) => a + b, 0) / errs.length;
}

const MOVES = [
  { name: "giro 7° derecha", pose: { head: [0, 0.05, -0.5], yaw: 7 } },
  { name: "inclinar 6° abajo", pose: { head: [0, 0.05, -0.5], pitch: -6 } },
  { name: "desplazar 3 cm", pose: { head: [0.03, 0.06, -0.5] } },
  { name: "acercarse 8 cm", pose: { head: [0, 0.05, -0.42] } },
  { name: "alejarse 10 cm", pose: { head: [0, 0.05, -0.6] } },
  { name: "giro + inclinación", pose: { head: [0.01, 0.04, -0.52], yaw: -5, pitch: 4, roll: 3 } },
];

test("headFeatures exige cuaternión y usa el ojo abierto si el otro está caído", () => {
  const f = synthFrame({ target: { x: 700, y: 400 }, screen: SCREEN, blinkL: 0.7, blinkR: 0.05 });
  const feat = headFeatures(f);
  assert.ok(feat && Number.isFinite(feat.yaw));
  const both = synthFrame({ target: { x: 700, y: 400 }, screen: SCREEN, blinkL: 0.8, blinkR: 0.8 });
  assert.equal(headFeatures(both), null, "parpadeo de ambos ojos = sin dato");
  const v1 = new Float32Array(48); v1[IDX.version] = 1; v1[IDX.tracked] = 1;
  assert.equal(headFeatures(decodeFrame(v1.buffer)), null, "v1 sin cuaternión");
  assert.equal(FRAME_FLOATS, 56);
});

test("head3d calibra con ARKit comprimido (ganancia 0,45) y recupera la compresión", () => {
  const rand = rng(1);
  const model = fitHead3d(calibSamples({ rand }), { metersPerPx: SCREEN.s });
  const err = poseError((f) => predictHead3d(model, f), { head: [0, 0.05, -0.5] }, rand);
  assert.ok(err < 20, `error con la cabeza quieta: ${err.toFixed(1)} px`);
  const g = eyeGain(model);
  assert.ok(g.h > 1.6 && g.h < 2.9, `ganancia horizontal ${g.h}`);
});

test("head3d mantiene la calibración al mover la cabeza; el modelo anterior no", () => {
  const rand = rng(2);
  const samples = calibSamples({ rand, motion: true });
  const model = fitHead3d(samples, { metersPerPx: SCREEN.s });
  const old = fitBest(samples.filter((s) => s.pointId < 50), { head3d: false }).model; // modelo previo (2D)
  for (const m of MOVES) {
    const e3d = poseError((f) => predictHead3d(model, f), m.pose, rand);
    const eOld = poseError((f) => predict(old, f), m.pose, rand);
    assert.ok(e3d < 40, `${m.name}: head3d ${e3d.toFixed(0)} px`);
    if (m.pose.yaw || m.pose.pitch) assert.ok(e3d < eOld * 0.5, `${m.name}: head3d ${e3d.toFixed(0)} vs anterior ${eOld.toFixed(0)} px`);
  }
});

test("head3d funciona aunque no se conozca el tamaño físico de la pantalla", () => {
  const rand = rng(3);
  const model = fitHead3d(calibSamples({ rand, motion: true }), { metersPerPx: null });
  const err = poseError((f) => predictHead3d(model, f), { head: [0.02, 0.05, -0.47], yaw: 5 }, rand);
  assert.ok(err < 60, `sin escala física: ${err.toFixed(0)} px`);
});

test("LOPO de head3d da un error razonable", () => {
  const rand = rng(4);
  const samples = calibSamples({ rand });
  const model = fitHead3d(samples, { metersPerPx: SCREEN.s });
  const cv = lopoHead3d(samples, model);
  assert.ok(cv.mean < 30, `LOPO ${cv.mean.toFixed(1)} px`);
});

test("con head3d:true explícito, fitBest elige el modelo 3D y lo predice con predict()", () => {
  // Ya no es el predeterminado (con datos reales era peor que el plano), pero sigue disponible.
  const rand = rng(5);
  const samples = calibSamples({ rand, motion: true }).map((x) => (x.pointId >= 50 ? { ...x, motion: true } : x));
  const res = fitBest(samples, { metersPerPx: SCREEN.s, head3d: true });
  assert.equal(res.model.kind, "head3d");
  assert.equal(res.robustToHead, true);
  const err = poseError((f) => predict(res.model, f), { head: [0.02, 0.05, -0.5], yaw: 6 }, rand);
  assert.ok(err < 40, `predict con head3d: ${err.toFixed(0)} px`);
  assert.ok(Math.abs(res.pxPerMeter - 1 / SCREEN.s) < 1);
});

test("re-entrenar el modelo ya elegido (fixed) da el mismo tipo y no repite la selección", () => {
  const rand = rng(11);
  const samples = calibSamples({ rand, motion: true });
  const opts = { metersPerPx: SCREEN.s };
  const t0 = performance.now();
  const first = fitBest(samples, opts);
  const tFull = performance.now() - t0;
  const extra = calibSamples({ rand: rng(12), perPoint: 10 });
  const t1 = performance.now();
  const final = fitBest([...samples, ...extra], { ...opts, fixed: first.model });
  const tFixed = performance.now() - t1;
  assert.equal(final.model.kind, first.model.kind);
  assert.equal(final.model.source, first.model.source);
  assert.ok(tFixed < tFull / 3, `fixed ${Math.round(tFixed)} ms vs completo ${Math.round(tFull)} ms`);
  const target = GRID[7];
  const p = predict(final.model, synthFrame({ head: [0, 0.05, -0.5], target, screen: SCREEN, noiseDeg: 0, rand }));
  assert.ok(Math.hypot(p.x - target.x, p.y - target.y) < 40);
});

test("por defecto: modelo plano; con fase de movimiento suma corrección de cabeza, sin ella no", () => {
  const rand = rng(21);
  const withMotion = calibSamples({ rand, motion: true }).map((x) => (x.pointId >= 50 ? { ...x, motion: true } : x));
  const a = fitBest(withMotion, { metersPerPx: SCREEN.s });
  assert.match(a.model.kind, /^plane/);
  assert.ok(a.model.head, "con movimiento hay corrección de cabeza");
  assert.equal(a.robustToHead, true);
  const b = fitBest(calibSamples({ rand: rng(22) }), { metersPerPx: SCREEN.s });
  assert.match(b.model.kind, /^plane/);
  assert.equal(b.model.head, undefined, "sin movimiento el modelo plano queda tal cual");
});

test("headCorrection:false nunca añade corrección de cabeza, aunque haya fase de movimiento", () => {
  // Contrato de Myo OS: integra la mirada con iPhone SIN movimiento de cabeza.
  const rand = rng(31);
  const withMotion = calibSamples({ rand, motion: true }).map((x) => (x.pointId >= 50 ? { ...x, motion: true } : x));
  const a = fitBest(withMotion, { metersPerPx: SCREEN.s, headCorrection: false });
  assert.equal(a.model.head, undefined);
  assert.equal(a.robustToHead, false);
  const fixed = { kind: a.model.kind, source: a.model.source, lambda: a.model.lambda };
  const b = fitBest(withMotion, { metersPerPx: SCREEN.s, headCorrection: false, fixed });
  assert.equal(b.model.head, undefined, "también al re-entrenar el modelo elegido");
});
