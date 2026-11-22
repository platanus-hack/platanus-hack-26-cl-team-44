import { gazeCalibrationPoints } from '../gaze-calibration.js';

// Alternating large and small targets, with distinct positions from the calibration grid.
export const targets = [
  [.27,.32], [.83,.74], [.48,.18], [.18,.72], [.72,.36], [.45,.79],
  [.13,.41], [.66,.63], [.84,.25], [.31,.58], [.61,.43], [.39,.38],
].map(([x, y], i) => ({ x, y, w: i % 2 ? .08 : .14, h: i % 2 ? .08 : .12 }));

export const calibrationPoints = gazeCalibrationPoints.map(([x,y]) => ({ x, y, w: .045, h: .06 }));

const contains = (target, x, y) => Math.abs(x - target.x) <= target.w / 2 && Math.abs(y - target.y) <= target.h / 2;

function firstStableTarget(samples, locate) {
  let active = null;
  let enteredAt = null;
  let lastAt = null;
  let hasSignal = false;
  for (const { x, y, t } of samples) {
    if (lastAt !== null && t - lastAt > 150) active = null;
    lastAt = t;
    if (!Number.isFinite(x) || !Number.isFinite(y)) { active = null; continue; }
    hasSignal = true;
    const target = locate(x, y);
    if (target !== active) { active = target; enteredAt = t; }
    if (active && t - enteredAt >= 180) return { chosen: active, time: t, hasSignal };
  }
  return { chosen: null, time: null, hasSignal };
}

export function scoreTarget(samples, target) {
  const { chosen, time, hasSignal } = firstStableTarget(samples, (x, y) => contains(target, x, y) ? target : null);
  return { hit: chosen !== null, time, hasSignal };
}

export const rehearsalOrder = [
  'talk', 'games', 'messages', 'apps', 'help', 'talk',
  'apps', 'messages', 'games', 'help', 'talk', 'messages',
];
export const rehearsalGoal = 10;

export function scoreFirstTile(samples, tiles, expected) {
  const { chosen, time, hasSignal } = firstStableTarget(samples, (x, y) => tiles.find(tile => contains(tile, x, y)) ?? null);
  return { hit: chosen?.id === expected, time, hasSignal, chosen: chosen?.id ?? null };
}

export function motionMetrics(samples, width, height) {
  const frames = samples.filter(({ x, y }) => Number.isFinite(x) && Number.isFinite(y));
  if (frames.length < 5) return null;
  const median = values => {
    values.sort((a, b) => a - b);
    return (values[Math.floor(values.length / 2)] + values[Math.floor((values.length - 1) / 2)]) / 2;
  };
  const x = median(frames.map(point => point.x)), y = median(frames.map(point => point.y));
  const distances = frames.map(point => Math.hypot((point.x - x) * width, (point.y - y) * height)).sort((a, b) => a - b);
  const durations = frames.map(point => point.t - point.capturedAt).filter(ms => Number.isFinite(ms) && ms >= 0);
  return {
    spread: distances[Math.ceil(.9 * distances.length) - 1],
    frameMs: durations.length >= 5 ? median(durations) : null,
  };
}

export function summarize(scores) {
  const times = scores.flatMap(score => score.hit ? [score.time] : []).sort((a, b) => a - b);
  const middle = Math.floor(times.length / 2);
  const median = !times.length ? null : (times[middle] + times[Math.floor((times.length - 1) / 2)]) / 2;
  return { hits: times.length, total: scores.length, missing: scores.filter(score => !score.hasSignal).length, median };
}
