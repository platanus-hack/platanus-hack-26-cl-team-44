import { test } from "node:test";
import assert from "node:assert/strict";

import { serializeFrame, deserializeFrame, serializeSamples, deserializeSamples, angularPrecision } from "../js/telemetry.js";
import { decodeFrame, FRAME_FLOATS, FRAME_VERSION, IDX } from "../js/protocol.js";
import { binocularPoint, fitBest } from "../js/model.js";

function frameWith(dir, { eye = [0, 0.1, -0.5], blink = 0.05, tracked = 1 } = {}) {
  const l = Math.hypot(...dir);
  const d = dir.map((x) => x / l);
  const f = new Float32Array(FRAME_FLOATS);
  f[IDX.version] = FRAME_VERSION;
  f[IDX.tracked] = tracked;
  f.set([eye[0] - 0.031, eye[1], eye[2]], IDX.leftEyePos);
  f.set(d, IDX.leftEyeDir);
  f.set([eye[0] + 0.031, eye[1], eye[2]], IDX.rightEyePos);
  f.set(d, IDX.rightEyeDir);
  f.set([eye[0] + d[0] * 0.5, eye[1] + d[1] * 0.5, eye[2] + d[2] * 0.5], IDX.lookAt);
  f.set(eye, IDX.headPos);
  f.set([0, 0, 1], IDX.headFwd);
  f[IDX.blinkL] = blink;
  f[IDX.blinkR] = blink;
  f[IDX.ambient] = 900;
  f.set([0, -1, 0], IDX.gravity);
  return decodeFrame(f.buffer);
}

test("serializar y deserializar un cuadro conserva la geometría", () => {
  const f = frameWith([0.1, -0.2, 1]);
  const back = deserializeFrame(JSON.parse(JSON.stringify(serializeFrame(f))));
  assert.equal(back.tracked, true);
  for (let i = 0; i < 3; i++) assert.ok(Math.abs(back.leftEyeDir[i] - f.leftEyeDir[i]) < 1e-4);
  assert.equal(back.ambient, 900);
});

test("serializeSamples hace ida y vuelta con pointId y objetivo", () => {
  const rows = serializeSamples([{ pointId: 3, target: { x: 10, y: 20 }, frame: frameWith([0, 0, 1]) }]);
  const [s] = deserializeSamples(JSON.parse(JSON.stringify(rows)));
  assert.deepEqual([s.pointId, s.target.x, s.target.y], [3, 10, 20]);
});

test("angularPrecision ≈ 0 con mirada fija y crece con ruido", () => {
  const still = Array.from({ length: 30 }, () => frameWith([0, 0, 1]));
  assert.ok(angularPrecision(still).precisionDeg < 0.01);
  const noisy = Array.from({ length: 200 }, () => frameWith([(Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.06, 1]));
  const p = angularPrecision(noisy).precisionDeg;
  assert.ok(p > 0.5 && p < 2, `precisión inesperada: ${p}`);
});

test("angularPrecision ignora parpadeos y devuelve NaN con pocos datos", () => {
  const blinks = Array.from({ length: 30 }, () => frameWith([0, 0, 1], { blink: 0.9 }));
  assert.ok(Number.isNaN(angularPrecision(blinks).precisionDeg));
});

test("binocularPoint promedia la intersección de cada ojo", () => {
  const p = binocularPoint(frameWith([0, -0.2, 1], { eye: [0, 0.1, -0.5] }));
  // cada ojo baja 0,1 m en 0,5 m de recorrido → y = 0
  assert.ok(Math.abs(p[0]) < 1e-6 && Math.abs(p[1]) < 1e-6);
});

test("fitBest funciona con muestras reconstruidas desde un log", () => {
  const PITCH = 0.0002;
  const eye = [0, 0.11, -0.55];
  const samples = [];
  let id = 0;
  for (const fx of [0.1, 0.5, 0.9]) {
    for (const fy of [0.1, 0.5, 0.9]) {
      const target = { x: fx * 1440, y: fy * 900 };
      const s = [-0.144 + target.x * PITCH, 0.2 - target.y * PITCH, 0];
      for (let k = 0; k < 15; k++) {
        const dir = [s[0] - eye[0] + (Math.random() - 0.5) * 0.002, s[1] - eye[1], s[2] - eye[2]];
        samples.push({ pointId: id, target, frame: frameWith(dir, { eye }) });
      }
      id += 1;
    }
  }
  const restored = deserializeSamples(JSON.parse(JSON.stringify(serializeSamples(samples))));
  const res = fitBest(restored);
  assert.ok(res.cvErrorPx < 30, `error alto: ${res.cvErrorPx}`);
});

/* ---------- rango de mirada y contexto de pérdida ---------- */
import { gazeRangeRatio } from "../js/calibration.js";
import { faceContext } from "../js/telemetry.js";

function rangeSamples(gain) {
  const PITCH = 0.0002, eye = [0, 0.11, -0.55], out = [];
  let id = 0;
  for (const fx of [0.1, 0.5, 0.9]) for (const fy of [0.1, 0.5, 0.9]) {
    const target = { x: fx * 1440, y: fy * 900 };
    const s = [-0.144 + target.x * PITCH, 0.2 - target.y * PITCH, 0];
    const true_ = [s[0] - eye[0], s[1] - eye[1], s[2] - eye[2]];
    const c = [0, 0.11 - 0.2 + 0.45 * 900 * PITCH, 0.55]; // centro aprox. de la pantalla visto desde el ojo
    const d = [c[0] + (true_[0] - c[0]) * gain, c[1] + (true_[1] - c[1]) * gain, true_[2]];
    for (let k = 0; k < 8; k++) out.push({ pointId: id, target, frame: frameWith(d, { eye }) });
    id += 1;
  }
  return out;
}

test("gazeRangeRatio ≈ 1 con mirada fiel y baja con mirada comprimida", () => {
  const fiel = gazeRangeRatio(rangeSamples(1), 5000, 0.55);
  assert.ok(fiel.h > 0.85 && fiel.h < 1.15, `h fiel ${fiel.h}`);
  const comp = gazeRangeRatio(rangeSamples(0.3), 5000, 0.55);
  assert.ok(comp.h < 0.4 && comp.v < 0.4, `comprimido ${comp.h},${comp.v}`);
});

test("faceContext describe distancia, desvío y orientación", () => {
  const ctx = faceContext(frameWith([0, 0, 1], { eye: [0.1, 0, -0.5] }));
  assert.equal(ctx.distCm, 51);
  assert.ok(ctx.offH > 10 && ctx.offH < 13);
  assert.equal(faceContext(null), null);
});
