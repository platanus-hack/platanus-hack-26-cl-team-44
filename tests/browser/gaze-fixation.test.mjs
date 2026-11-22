import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { createFixation } from '../../software/toki-os/gaze-fixation.js';

const sample = (x, y = 0) => ({ normPog: [x, y] });

test('stable sampling removes a late outlier without treating calibration bias as noise', () => {
  const fixation = createFixation();
  [0.31, 0.32, 0.30, 0.33, -0.45].forEach((x, i) => fixation.push(sample(x, -.31), i * .1));
  assert.deepEqual(fixation.select().map(p => p.normPog[0]), [.31, .30, .33]);
  assert.deepEqual(fixation.select('last-frame').map(p => p.normPog[0]), [-.45]);
});

test('one or two frames, duplicates and mixed fixations do not pass training capture', () => {
  const fixation = createFixation();
  for (const t of [0, 0, .1, .1]) fixation.push(sample(.2), t);
  assert.deepEqual(fixation.select(), []);
  for (const [i, x] of [.2, -.3, -.3, -.3].entries()) fixation.push(sample(x), (i + 2) * .1);
  assert.deepEqual(fixation.select(), [], 'two equally common clusters are not a stable fixation');
});

test('three temporal anchors always contribute equally even after a long capture', () => {
  const fixation = createFixation();
  for (let i = 0; i < 200; i++) fixation.push(sample(.2), i * .1);
  const frames = fixation.select();
  assert.equal(frames.length, 3);
  assert.ok(frames[0].t > 18, 'candidate memory is a bounded window');
  assert.ok(frames[0].t < frames[1].t && frames[1].t < frames[2].t);
});

test('worker trains on three frames per point and ignores an in-flight frame from before a target', async () => {
  let adaptation, completeFrame;
  const replies = new Map();
  const self = {
    WebEyeTrack: class {
      initialize() {}
      adapt(...samples) { adaptation = samples; }
      step(image) { return image; }
    },
    postMessage({ id, result, error }) { replies.set(id, { result, error }); },
  };
  const workerSource = readFileSync(new URL('../../software/toki-os/webeyetrack-worker.js', import.meta.url), 'utf8')
    .replace("({ createFixation } = await import('./gaze-fixation.js'));", 'createFixation = loadFixation;');
  runInNewContext(workerSource, { self, importScripts() {}, loadFixation: createFixation });
  let id = 0;
  const send = async (action, value) => {
    const key = ++id;
    await self.onmessage({ data: { id: key, action, value } });
    assert.equal(replies.get(key).error, undefined);
    return replies.get(key).result;
  };
  const gaze = eyePatch => ({
    gazeState: 'open', normPog: [.2, .1], facialLandmarks: [{}],
    eyePatch, headVector: [0, 0, 1], faceOrigin3D: [0, 0, 50],
  });

  await send('start');
  await send('target', { x: .25, y: .25 });
  const late = send('frame', { image: new Promise(resolve => { completeFrame = resolve; }), t: .1 });
  await send('target', { x: .75, y: .75 });
  completeFrame(gaze('old point'));
  await late;
  assert.equal(await send('capture', 'last-frame'), false);

  for (const [index, x] of [.25, .75].entries()) {
    await send('target', { x, y: .25 });
    for (let i = 0; i < 4; i++) await send('frame', { image: gaze(10 * index + i), t: 1 + index + i * .11 });
    assert.equal(await send('capture'), true);
  }
  await send('calibrate');
  assert.deepEqual(Array.from(adaptation[0]), [0, 2, 3, 10, 12, 13]);
  assert.deepEqual(Array.from(adaptation[3], label => Array.from(label)), [
    [-.25, -.25], [-.25, -.25], [-.25, -.25], [.25, -.25], [.25, -.25], [.25, -.25],
  ]);
});
