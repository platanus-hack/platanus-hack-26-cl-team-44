// Casos de software/eye-tracking/web/tests/math.test.mjs, corridos a través de la fachada de la v2.
import { describe, expect, it } from 'vitest';
import { eyeEngine, IPHONE_FIT, type Sample, type Vec3 } from './eyeEngine';
import { createOneEuro } from './oneEuro';

const PITCH = 0.0002;
const SCREEN = { w: 1440, h: 900, left: -0.144, top: 0.2 };
const { FRAME_FLOATS, FRAME_VERSION, IDX, decodeFrame, fitBest, predict } = eyeEngine;

const screenToWorld = (px: number, py: number): Vec3 => [SCREEN.left + px * PITCH, SCREEN.top - py * PITCH, 0];
const norm = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};

function syntheticFrame(eye: Vec3, target: { x: number; y: number }, noise = 0) {
  const s = screenToWorld(target.x, target.y);
  const jitter = () => (Math.random() - 0.5) * noise;
  const d = norm([s[0] - eye[0] + jitter(), s[1] - eye[1] + jitter(), s[2] - eye[2]]);
  const f = new Float32Array(FRAME_FLOATS);
  f[IDX.version] = FRAME_VERSION;
  f[IDX.tracked] = 1;
  f.set([eye[0] - 0.031, eye[1], eye[2]], IDX.leftEyePos);
  f.set(d, IDX.leftEyeDir);
  f.set([eye[0] + 0.031, eye[1], eye[2]], IDX.rightEyePos);
  f.set(d, IDX.rightEyeDir);
  f.set([eye[0] + d[0] * 0.5, eye[1] + d[1] * 0.5, eye[2] + d[2] * 0.5], IDX.lookAt);
  f.set(eye, IDX.headPos);
  return decodeFrame(f.buffer)!;
}

function grid(cols: number, rows: number) {
  const pts: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      pts.push({ x: 100 + (c * (SCREEN.w - 200)) / (cols - 1), y: 80 + (r * (SCREEN.h - 160)) / (rows - 1) });
  return pts;
}

const samplesFor = (eye: Vec3, points: { x: number; y: number }[], perPoint = 20, noise = 0.004): Sample[] =>
  points.flatMap((target, pointId) =>
    Array.from({ length: perPoint }, () => ({ pointId, target, frame: syntheticFrame(eye, target, noise) })),
  );

describe('motor de mirada compartido', () => {
  it('One Euro suaviza el ruido y sigue movimientos grandes', () => {
    const f = createOneEuro({ minCutoff: 1, beta: 0.01 });
    let out = 0;
    for (let i = 0; i < 120; i++) out = f(100 + (i % 2 ? 5 : -5), i / 60);
    expect(Math.abs(out - 100)).toBeLessThan(3);
    for (let i = 120; i < 150; i++) out = f(400, i / 60);
    expect(out).toBeGreaterThan(380);
  });

  it('decodeFrame rechaza tamaño o versión incorrectos', () => {
    expect(decodeFrame(new ArrayBuffer(12))).toBeNull();
    const bad = new Float32Array(FRAME_FLOATS);
    bad[IDX.version] = 99;
    expect(decodeFrame(bad.buffer)).toBeNull();
  });

  it('calibra con error bajo en datos sintéticos, con el contrato del iPhone', () => {
    const eye: Vec3 = [0, 0.11, 0.55];
    const result = fitBest(samplesFor(eye, grid(4, 3)), IPHONE_FIT);
    expect(result.cvErrorPx).toBeLessThan(25);
    const p = predict(result.model, syntheticFrame(eye, { x: 500, y: 300 }));
    expect(p).not.toBeNull();
    if (p) expect(Math.hypot(p.x - 500, p.y - 300)).toBeLessThan(25);
  });

  it('predict devuelve null si la cara no está siendo seguida', () => {
    const result = fitBest(samplesFor([0, 0.11, 0.55], grid(4, 3)));
    const f = new Float32Array(FRAME_FLOATS);
    f[IDX.version] = FRAME_VERSION;
    expect(predict(result.model, decodeFrame(f.buffer)!)).toBeNull();
  });

  it('expone los puntos de calibración y valida direcciones del iPhone', () => {
    expect(eyeEngine.TRAIN_POINTS.length).toBeGreaterThanOrEqual(9);
    expect(eyeEngine.VALIDATION_POINTS.length).toBeGreaterThanOrEqual(3);
    expect(eyeEngine.toSocketUrl('192.168.1.23:8788')).toMatch(/^ws:\/\//);
    expect(eyeEngine.toSocketUrl('')).toBeNull();
  });
});
