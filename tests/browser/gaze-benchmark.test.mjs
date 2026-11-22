import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calibrationPoints, motionMetrics, rehearsalGoal, rehearsalOrder, scoreFirstTile, scoreTarget, summarize, targets } from '../../software/toki-os/gaze-benchmark/metrics.js';

const target = { x: .5, y: .5, w: .1, h: .2 };
const center = t => ({ x: .5, y: .5, t });

test('uses different locations for calibration and scoring', () => {
  assert.equal(targets.length, 12);
  assert.equal(calibrationPoints.length, 15);
  assert.ok(targets.every(({x, y}) => !calibrationPoints.some(point => point.x === x && point.y === y)));
});

test('a hit requires 180 ms of continuous predictions inside the target', () => {
  const samples = [center(20), center(110), center(190), { x: .7, y: .5, t: 200 }, center(240), center(330), center(410), center(430)];
  assert.deepEqual(scoreTarget(samples.slice(0, -1), target), { hit: false, time: null, hasSignal: true });
  assert.deepEqual(scoreTarget(samples, target), { hit: true, time: 430, hasSignal: true });
});

test('invalid samples and tracking gaps break the hit timer', () => {
  assert.equal(scoreTarget([center(10), { t: 100 }, center(190)], target).hit, false);
  assert.equal(scoreTarget([center(10), center(200)], target).hit, false);
  assert.deepEqual(scoreTarget([{ t: 0 }, { x: NaN, y: .5, t: 190 }], target), { hit: false, time: null, hasSignal: false });
});

test('aggregate separates misses with a signal and computes median time from hits only', () => {
  const scores = [
    { hit: true, time: 400, hasSignal: true }, { hit: false, time: null, hasSignal: true },
    { hit: false, time: null, hasSignal: false }, { hit: true, time: 900, hasSignal: true },
  ];
  assert.deepEqual(summarize(scores), { hits: 2, total: 4, missing: 1, median: 650 });
  assert.equal(summarize([scores[1]]).median, null);
});

const tiles = [{ ...target, id: 'talk' }, { ...target, x: .7, id: 'games' }];
const neighbor = t => ({ x: .7, y: .5, t });

test('the first stable tile wins even if a later tile matches the cue', () => {
  const wrongThenRight = [neighbor(0), neighbor(100), neighbor(200), center(300), center(400), center(500)];
  assert.deepEqual(scoreFirstTile(wrongThenRight, tiles, 'talk'), { hit: false, time: 200, hasSignal: true, chosen: 'games' });
  const crossingThenRight = [neighbor(0), neighbor(100), center(170), center(270), center(370)];
  assert.deepEqual(scoreFirstTile(crossingThenRight, tiles, 'talk'), { hit: true, time: 370, hasSignal: true, chosen: 'talk' });
});

test('rehearsal covers all five real cards without repeating adjacent cues', () => {
  assert.equal(rehearsalGoal, 10);
  assert.equal(rehearsalOrder.length, 12);
  assert.deepEqual([...new Set(rehearsalOrder)].sort(), ['apps', 'games', 'help', 'messages', 'talk']);
  assert.ok(rehearsalOrder.every((id, i) => id !== rehearsalOrder[i - 1]));
});

test('stillness spread and capture-to-prediction latency are independent of acquisition', () => {
  const frames = Array.from({length: 10}, (_, i) => ({
    x: i === 9 ? .9 : .5, y: .5, capturedAt: i * 100, t: i * 100 + 20,
  }));
  assert.deepEqual(motionMetrics(frames, 1000, 800), { spread: 0, frameMs: 20 });
  assert.equal(motionMetrics(frames.slice(0, 3), 1000, 800), null);
});
