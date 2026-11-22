#!/usr/bin/env node
/**
 * Genera los logs SINTÉTICOS de tests/fixtures/logs/ con el mismo formato que telemetry.js.
 *   node software/eye-tracking/web/tests/fixtures/generar-logs.mjs
 *
 * Ningún dato viene de una persona: los cuadros salen de synth.js con una semilla fija.
 * Los textos "CANARIO-…" sirven para comprobar que tools/resumen.mjs no los copia.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { exampleScreen, synthFrame } from "../../js/synth.js";
import { serializeSamples } from "../../js/telemetry.js";
import { MOTION_POINTS, MOTION_VALIDATION_POINTS, TRAIN_POINTS, VALIDATION_POINTS, evaluateValidation, toPixels } from "../../js/calibration.js";
import { fitBest, pxToDegrees } from "../../js/model.js";

const OUT = join(fileURLToPath(new URL(".", import.meta.url)), "logs");
const VIEWPORT = { w: 1440, h: 900 };
const SCREEN = exampleScreen({ widthPx: VIEWPORT.w, heightPx: VIEWPORT.h });
const PX_PER_M = 1 / SCREEN.s;
const FRAMES = 6; // cuadros por punto quieto: lo mínimo para el filtro de atípicos y la validación
const MOTION_FRAMES = 10;

// Generador con semilla (mulberry32): el archivo sale igual en cada corrida.
let seed = 20000101;
function rand() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const around = (x, d) => x + (rand() - 0.5) * 2 * d;

let clock = 0;
function frame(target, { motion = false } = {}) {
  clock += 1 / 60;
  const head = motion ? [around(0, 0.03), around(0.05, 0.02), around(-0.5, 0.04)] : [around(0, 0.002), around(0.05, 0.002), around(-0.5, 0.002)];
  const f = synthFrame({
    head, target, screen: SCREEN, rand, noiseDeg: 0.3,
    yaw: motion ? around(0, 10) : 0, pitch: motion ? around(0, 6) : 0,
  });
  return { ...f, t: clock, look: null, headQuat: null }; // sin blendshapes ni cuaternión: el log queda chico
}

function collect(points, idOffset, { motion = false } = {}) {
  return points.flatMap((p, i) => {
    const target = toPixels(p, VIEWPORT.w, VIEWPORT.h);
    const n = motion ? MOTION_FRAMES : FRAMES;
    return Array.from({ length: n }, () => ({ pointId: idOffset + i, target, motion, frame: frame(target, { motion }) }));
  });
}

/** Una calibración "inicial" con paso de movimiento, con los mismos campos que app.js › finishRound. */
function calibration() {
  const train = [...collect(TRAIN_POINTS, 0), ...collect(MOTION_POINTS, 50, { motion: true })];
  const valid = collect(VALIDATION_POINTS, 100);
  const motionValid = collect(MOTION_VALIDATION_POINTS, 150, { motion: true });
  const first = fitBest(train, { metersPerPx: SCREEN.s });
  const validation = evaluateValidation(first.model, valid);
  const motionValidation = evaluateValidation(first.model, motionValid);
  return {
    at: 42_000, placement: "CANARIO-UBICACION",
    kind: "inicial", round: 0, viewport: VIEWPORT, distanceCm: 50,
    chosen: `${first.model.kind}/${first.model.source}/λ${first.model.lambda}`,
    cvErrorPx: Math.round(first.cvErrorPx), validationPx: Math.round(validation.meanPx),
    validationDeg: pxToDegrees(validation.meanPx, PX_PER_M, 0.5),
    pxPerMeter: Math.round(PX_PER_M), physicalScale: true, range: null,
    motionValidationPx: Math.round(motionValidation.meanPx), motionValidationDeg: pxToDegrees(motionValidation.meanPx, PX_PER_M, 0.5),
    finalModel: `${first.model.kind}/${first.model.source}`,
    candidates: first.candidates.slice(0, 3),
    perPoint: validation.perPoint.map((p) => ({ target: p.target, predicted: p.predicted, error: Math.round(p.error) })),
    pointStats: [{ pointId: 0, target: toPixels(TRAIN_POINTS[0], VIEWPORT.w, VIEWPORT.h), retried: false, fixationMs: 300 }],
    notaNueva: "CANARIO-CAMPO-NUEVO", // un campo que resumen.mjs no conoce: no debe aparecer en el resumen
    train: serializeSamples(train),
    valid: serializeSamples(valid),
    motionValid: serializeSamples(motionValid),
  };
}

function baseLog(sessionId, startedAt, source) {
  return {
    sessionId, version: 1, startedAt,
    userAgent: "CANARIO-USER-AGENT (navegador sintético)",
    screen: { w: VIEWPORT.w, h: VIEWPORT.h, dpr: 2 },
    source, placement: source ? "CANARIO-UBICACION" : null,
    display: source ? { all: [{ widthMm: SCREEN.s * VIEWPORT.w * 1000, heightMm: SCREEN.s * VIEWPORT.h * 1000, widthPt: VIEWPORT.w, heightPt: VIEWPORT.h, main: true }], screen: { w: VIEWPORT.w, h: VIEWPORT.h } } : null,
    events: [], stability: [], calibrations: [], probes: [], telemetry: [],
  };
}

const logs = {};

// 1) iPhone con una calibración completa: la única que entra al resumen.
const iphone = baseLog("20000101-120000-canar1", "2000-01-01T15:00:00.000Z", "iphone");
iphone.display.used = iphone.display.all[0];
iphone.events.push({ at: 1000, type: "ubicacion", label: "CANARIO-UBICACION" }, { at: 30_000, type: "cara_perdida", ms: 400, antes: { distCm: 50, offH: 2, offV: -3, facing: 5, blink: 0.1 }, despues: null });
iphone.stability.push({ at: 20_000, placement: "CANARIO-UBICACION", precisionDeg: 0.6, distCm: 50, usablePct: 97 });
iphone.calibrations.push(calibration());
iphone.probes.push({ at: 60_000, errPx: 35, deg: 0.4 });
iphone.telemetry.push({ at: 1000, fps: 60, trackedPct: 100, usablePct: 98, blinks: 0, gaps: 0, rttMs: 12, distCm: 50, ambient: 1000, thermal: 0 });
logs["20000101-120000-canar1.json"] = iphone;

// 2) Simulador (mirada con el mouse): no es una calibración real, debe quedar fuera.
const sim = baseLog("20000101-130000-canar2", "2000-01-01T16:00:00.000Z", "simulador");
sim.calibrations.push({ at: 5000, placement: null, kind: "inicial", round: 0, viewport: VIEWPORT, train: [], valid: [], motionValid: [] });
logs["20000101-130000-canar2.json"] = sim;

// 3) Página abierta sin conectar ninguna fuente: nada que resumir.
logs["20000102-090000-canar3.json"] = baseLog("20000102-090000-canar3", "2000-01-02T12:00:00.000Z", null);

await mkdir(OUT, { recursive: true });
for (const [name, log] of Object.entries(logs)) {
  await writeFile(join(OUT, name), JSON.stringify(log)); // igual que serve.mjs: JSON en una línea
  process.stdout.write(`${join(OUT, name)}\n`);
}
