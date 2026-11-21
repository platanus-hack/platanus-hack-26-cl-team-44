import { test } from "node:test";
import assert from "node:assert/strict";

import { ridgeFit, ridgePredict, solveLinear } from "../js/linalg.js";
import { createOneEuro } from "../js/one-euro.js";
import { inlierMask, median, robustAggregate } from "../js/robust.js";
import { decodeFrame, FRAME_FLOATS, FRAME_VERSION, IDX } from "../js/protocol.js";
import { cleanSamples, fitBest, predict, gazeRay, planePoint } from "../js/model.js";

/* ---------- helpers: escena sintética (cámara en el origen, pantalla en z=0) ---------- */
const PITCH = 0.0002; // 0,2 mm por px CSS (MacBook típico)
const SCREEN = { w: 1440, h: 900, left: -0.144, top: 0.20 };

function screenToWorld(px, py) {
  return [SCREEN.left + px * PITCH, SCREEN.top - py * PITCH, 0];
}

function norm(v) {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
}

function syntheticFrame(eye, target, noise = 0) {
  const s = screenToWorld(target.x, target.y);
  const jitter = () => (Math.random() - 0.5) * noise;
  const d = norm([s[0] - eye[0] + jitter(), s[1] - eye[1] + jitter(), s[2] - eye[2]]);
  const f = new Float32Array(FRAME_FLOATS);
  f[IDX.version] = FRAME_VERSION;
  f[IDX.tracked] = 1;
  const le = [eye[0] - 0.031, eye[1], eye[2]];
  const re = [eye[0] + 0.031, eye[1], eye[2]];
  f.set(le, IDX.leftEyePos); f.set(d, IDX.leftEyeDir);
  f.set(re, IDX.rightEyePos); f.set(d, IDX.rightEyeDir);
  f.set([eye[0] + d[0] * 0.5, eye[1] + d[1] * 0.5, eye[2] + d[2] * 0.5], IDX.lookAt);
  f.set(eye, IDX.headPos);
  return decodeFrame(f.buffer);
}

function grid(cols, rows) {
  const pts = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      pts.push({ x: 100 + (c * (SCREEN.w - 200)) / (cols - 1), y: 80 + (r * (SCREEN.h - 160)) / (rows - 1) });
    }
  }
  return pts;
}

function samplesFor(eye, points, perPoint = 20, noise = 0.004) {
  return points.flatMap((target, pointId) =>
    Array.from({ length: perPoint }, () => ({ pointId, target, frame: syntheticFrame(eye, target, noise) }))
  );
}

/* ---------- linalg ---------- */
test("solveLinear resuelve un sistema 3x3", () => {
  const x = solveLinear([[2, 1, 0], [1, 3, 1], [0, 1, 4]], [3, 5, 5]);
  assert.ok(Math.abs(x[0] - 1) < 1e-9 && Math.abs(x[1] - 1) < 1e-9 && Math.abs(x[2] - 1) < 1e-9);
});

test("ridgeFit recupera una relación lineal", () => {
  const rows = Array.from({ length: 50 }, (_, i) => [i / 10, Math.sin(i)]);
  const ys = rows.map(([a, b]) => 3 + 2 * a - 5 * b);
  const m = ridgeFit(rows, ys, 1e-8);
  assert.ok(Math.abs(ridgePredict(m, [1, 0.5]) - (3 + 2 - 2.5)) < 1e-4);
});

test("ridgeFit no explota con una columna constante", () => {
  const rows = Array.from({ length: 10 }, (_, i) => [i, 7]);
  const m = ridgeFit(rows, rows.map(([a]) => a * 2), 1e-3);
  assert.ok(Number.isFinite(ridgePredict(m, [3, 7])));
});

/* ---------- robust ---------- */
test("median y robustAggregate descartan atípicos", () => {
  assert.equal(median([3, 1, 2]), 2);
  const agg = robustAggregate([[1, 1], [1.1, 0.9], [0.9, 1.05], [50, -40]]);
  assert.ok(Math.abs(agg[0] - 1) < 0.15 && Math.abs(agg[1] - 1) < 0.15);
});

/* ---------- one euro ---------- */
test("One Euro suaviza el ruido y sigue movimientos grandes", () => {
  const f = createOneEuro({ minCutoff: 1, beta: 0.01 });
  let out = 0;
  for (let i = 0; i < 120; i++) out = f(100 + (i % 2 ? 5 : -5), i / 60);
  assert.ok(Math.abs(out - 100) < 3, `ruido no suavizado: ${out}`);
  for (let i = 120; i < 150; i++) out = f(400, i / 60);
  assert.ok(out > 380, `no siguió el salto: ${out}`);
});

/* ---------- protocol ---------- */
test("decodeFrame rechaza tamaño o versión incorrectos", () => {
  assert.equal(decodeFrame(new ArrayBuffer(12)), null);
  const bad = new Float32Array(FRAME_FLOATS);
  bad[IDX.version] = 99;
  assert.equal(decodeFrame(bad.buffer), null);
});

test("decodeFrame rechaza NaN en campos de geometría", () => {
  const f = new Float32Array(FRAME_FLOATS);
  f[IDX.version] = FRAME_VERSION;
  f[IDX.tracked] = 1;
  f[IDX.leftEyePos] = Number.NaN;
  assert.equal(decodeFrame(f.buffer).tracked, false);
});

/* ---------- geometría ---------- */
test("planePoint intersecta el rayo con z=0", () => {
  const p = planePoint({ o: [0, 0.1, 0.5], d: norm([0, -0.1, -0.5]) }, 0);
  assert.ok(Math.abs(p[0]) < 1e-9 && Math.abs(p[1]) < 1e-9);
});

test("gazeRay usa el punto medio de los ojos como origen", () => {
  const fr = syntheticFrame([0, 0.1, 0.5], { x: 720, y: 450 });
  const r = gazeRay(fr, "eyes");
  assert.ok(Math.abs(r.o[0]) < 1e-6 && Math.abs(r.o[1] - 0.1) < 1e-6);
});

/* ---------- calibración end-to-end ---------- */
test("fitBest calibra con error bajo en datos sintéticos", () => {
  const eye = [0, 0.11, 0.55];
  const result = fitBest(samplesFor(eye, grid(4, 3)));
  assert.ok(result.cvErrorPx < 25, `error CV muy alto: ${result.cvErrorPx}`);
  const p = predict(result.model, syntheticFrame(eye, { x: 500, y: 300 }));
  assert.ok(Math.hypot(p.x - 500, p.y - 300) < 25);
});

test("el modelo de plano tolera mover la cabeza tras calibrar", () => {
  const result = fitBest(samplesFor([0, 0.11, 0.55], grid(4, 3), 20, 0.002));
  const moved = [0.03, 0.12, 0.58];
  const p = predict(result.model, syntheticFrame(moved, { x: 900, y: 500 }));
  assert.ok(Math.hypot(p.x - 900, p.y - 500) < 60, `no compensó la cabeza: ${p.x},${p.y}`);
});

test("predict devuelve null si la cara no está siendo seguida", () => {
  const result = fitBest(samplesFor([0, 0.11, 0.55], grid(4, 3)));
  const f = new Float32Array(FRAME_FLOATS);
  f[IDX.version] = FRAME_VERSION;
  assert.equal(predict(result.model, decodeFrame(f.buffer)), null);
});

/* ---------- regresiones de la revisión ---------- */
test("ridgeFit con peso 0 ignora esa muestra", () => {
  const rows = [[0], [1], [2], [3], [100]];
  const ys = [0, 1, 2, 3, -500]; // el último es un atípico absurdo
  const m = ridgeFit(rows, ys, 1e-9, [1, 1, 1, 1, 0]);
  assert.ok(Math.abs(ridgePredict(m, [10]) - 10) < 1e-4);
});

test("ridgeFit trata una columna casi constante (ruido de redondeo) como constante", () => {
  const rows = Array.from({ length: 20 }, (_, i) => [i, 5 + (i % 2) * 1e-14]);
  const m = ridgeFit(rows, rows.map(([a]) => a), 1e-6);
  assert.ok(Math.abs(ridgePredict(m, [7, 5]) - 7) < 1e-3);
});

test("planePoint rechaza rayos que se alejan del plano", () => {
  assert.equal(planePoint({ o: [0, 0, 0.5], d: [0, 0, 1] }, 0), null);
});

test("inlierMask descarta una mirada tardía pero conserva el cúmulo", () => {
  const pts = Array.from({ length: 30 }, (_, i) => ({ x: Math.cos(i) * 0.002, y: Math.sin(i * 1.7) * 0.002 }));
  pts.push({ x: 0.08, y: -0.05 });
  const mask = inlierMask(pts);
  assert.equal(mask[30], false);
  assert.ok(mask.slice(0, 30).filter(Boolean).length >= 28);
});

test("cleanSamples quita el atípico de un punto", () => {
  const eye = [0, 0.11, 0.55];
  const target = { x: 700, y: 400 };
  const good = Array.from({ length: 20 }, () => ({ pointId: 0, target, frame: syntheticFrame(eye, target, 0.002) }));
  const late = { pointId: 0, target, frame: syntheticFrame(eye, { x: 100, y: 100 }) };
  const cleaned = cleanSamples([...good, late]);
  assert.ok(!cleaned.includes(late));
  assert.ok(cleaned.length >= 18);
});

test("gazeRay hybrid queda entre lookAt y eyes y es unitario", () => {
  const fr = syntheticFrame([0, 0.1, 0.5], { x: 720, y: 450 });
  const r = gazeRay(fr, "hybrid");
  assert.ok(Math.abs(Math.hypot(...r.d) - 1) < 1e-9);
  assert.ok(Math.abs(r.d[0] - gazeRay(fr, "eyes").d[0]) < 1e-3);
});

test("fitBest con conteos desiguales por punto sigue siendo preciso", () => {
  const eye = [0, 0.11, 0.55];
  const pts = grid(4, 3);
  const samples = pts.flatMap((target, pointId) =>
    Array.from({ length: pointId === 0 ? 80 : 15 }, () => ({ pointId, target, frame: syntheticFrame(eye, target, 0.003) }))
  );
  const result = fitBest(samples);
  assert.ok(result.cvErrorPx < 30, `error CV: ${result.cvErrorPx}`);
});

test("fitBest no se cae si un candidato es singular (todos los cuadros idénticos)", () => {
  const eye = [0, 0.11, 0.55];
  const samples = grid(3, 2).flatMap((target, pointId) =>
    Array.from({ length: 10 }, () => ({ pointId, target, frame: syntheticFrame(eye, grid(3, 2)[0], 0) }))
  );
  // Datos degenerados: puede lanzar un error claro, pero nunca uno de álgebra no controlado.
  try {
    fitBest(samples);
  } catch (err) {
    assert.match(err.message, /muestras|modelo/i);
  }
});

test("One Euro ignora cuadros con timestamp repetido sin reiniciarse", () => {
  const f = createOneEuro({ minCutoff: 1, beta: 0 });
  f(0, 0);
  const a = f(10, 0.016);
  assert.equal(f(1000, 0.016), a);
});
