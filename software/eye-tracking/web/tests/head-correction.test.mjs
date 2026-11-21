import { test } from "node:test";
import assert from "node:assert/strict";
import { applyHeadCorrection, fitHeadCorrection, headVec } from "../js/head-correction.js";

// Cuadro mínimo: cabeza mirando a la cámara, girada `yaw` grados y desplazada `dx` cm.
const frame = (yaw = 0, dx = 0) => {
  const r = (yaw * Math.PI) / 180;
  return { tracked: true, blinkL: 0, blinkR: 0, headFwd: [Math.sin(r), 0, Math.cos(r)], headPos: [dx / 100, 0, -0.5] };
};
// Modelo base "plano" que se equivoca 20 px por grado de giro (como un modelo sin corrección).
const truth = { x: 500, y: 400 };
const base = (f) => ({ x: truth.x - 20 * headVec(f)[0], y: truth.y });

function samples({ withMotion }) {
  const out = [];
  for (let k = 0; k < 40; k++) out.push({ pointId: 1, target: truth, frame: frame(0, 0) });
  if (withMotion) for (let k = 0; k < 60; k++) out.push({ pointId: 50 + (k % 3), target: truth, frame: frame(-6 + (12 * k) / 59, 0), motion: true });
  return out;
}

test("headVec da giro en grados y posición en cm", () => {
  const v = headVec(frame(10, 3));
  assert.ok(Math.abs(v[0] - 10) < 1e-6);
  assert.ok(Math.abs(v[2] - 3) < 1e-6);
});

test("sin fase de movimiento no hay corrección (queda el modelo plano tal cual)", () => {
  assert.equal(fitHeadCorrection(samples({ withMotion: false }), base), null);
});

test("con movimiento aprende a compensar el giro", () => {
  const corr = fitHeadCorrection(samples({ withMotion: true }), base);
  assert.ok(corr);
  const f = frame(5, 0);
  const before = Math.abs(base(f).x - truth.x);
  const after = Math.abs(applyHeadCorrection(corr, f, base(f)).x - truth.x);
  assert.ok(before > 90, `antes ${before}`);
  assert.ok(after < before * 0.3, `antes ${before} px, después ${after} px`);
});

test("nunca corrige más de lo visto en la calibración (giros enormes no disparan el cursor)", () => {
  const corr = fitHeadCorrection(samples({ withMotion: true }), base);
  const f = frame(40, 0); // mucho más que los ±6° calibrados
  const p = base(f);
  const shift = Math.abs(applyHeadCorrection(corr, f, p).x - p.x);
  assert.ok(shift <= corr.maxShift.x + 1e-6, `corrigió ${shift} px; tope ${corr.maxShift.x}`);
  assert.ok(corr.maxShift.x < 20 * 6 * 1.5 + 1, "el tope es ~1,5× lo observado");
});

test("si el cuadro no sirve, devuelve el punto sin tocar", () => {
  const corr = fitHeadCorrection(samples({ withMotion: true }), base);
  assert.equal(applyHeadCorrection(corr, { tracked: false }, null), null);
  assert.deepEqual(applyHeadCorrection(null, frame(3), { x: 1, y: 2 }), { x: 1, y: 2 });
});
