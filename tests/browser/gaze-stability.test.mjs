import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createGazeStabilizer } from '../../software/toki-os/gaze-stability.js';

const frame = (x, y, capturedAt) => ({ x, y, capturedAt });
const displacement = (p, x, y) => Math.hypot(p.x - x, p.y - y);

test('fixation noise is reduced without replaying one frame at the UI rate', () => {
  const gaze = createGazeStabilizer();
  gaze.sample(frame(.5, .5, 0));
  let peak = 0;
  for (let i = 1; i <= 30; i++) {
    const raw = frame(.5 + (i % 2 ? .032 : -.032), .5 + (i % 3 ? -.02 : .02), i * 33);
    const point = gaze.sample(raw);
    assert.equal(gaze.sample(raw), point);
    peak = Math.max(peak, displacement(point, .5, .5));
  }
  assert.ok(peak < .018, `peak fixation error was ${peak}`);
});

test('one bad frame barely moves the cursor, but a deliberate jump settles quickly', () => {
  const gaze = createGazeStabilizer();
  gaze.sample(frame(.14, .16, 0));
  assert.ok(displacement(gaze.sample(frame(.86, .86, 33)), .14, .16) <= .016);
  assert.ok(displacement(gaze.sample(frame(.14, .16, 66)), .14, .16) <= .016);
  gaze.reset();
  gaze.sample(frame(.14, .16, 0));
  let point;
  for (let i = 1; i <= 4; i++) point = gaze.sample(frame(.86, .86, i * 33));
  assert.ok(displacement(point, .86, .86) < .05, `the jump was still lagging at ${JSON.stringify(point)}`);
});

test('a signal gap or reset does not drag the pointer from the previous fixation', () => {
  const gaze = createGazeStabilizer();
  gaze.sample(frame(.1, .1, 100));
  assert.deepEqual(gaze.sample(frame(.9, .8, 400)), { x: .9, y: .8 });
  gaze.reset();
  assert.deepEqual(gaze.sample(frame(.2, .3, 430)), { x: .2, y: .3 });
});
