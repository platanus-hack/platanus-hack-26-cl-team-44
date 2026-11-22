import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const controller = readFileSync(new URL('../../software/toki-os/webeyetrack-client.js', import.meta.url), 'utf8')
  .replace('export function', 'function').replace('import.meta.url', '"http://localhost/webeyetrack-client.js"');

function setup() {
  let now = 0, delayedFrame;
  const requests = [], deadlines = [], animation = new Map();
  const video = { readyState: 2, currentTime: 0, videoWidth: 640, videoHeight: 480 };
  const options = {
    URL, DOMException,
    performance: { now: () => now },
    setTimeout: (_, ms) => deadlines.push(ms),
    clearTimeout() {},
    requestAnimationFrame(fn) { const key = Symbol(); animation.set(key, fn); return key; },
    cancelAnimationFrame(key) { animation.delete(key); },
    document: { createElement: () => ({ getContext: () => ({
      drawImage() {}, getImageData: () => ({ data: new Uint8Array(4) }),
    }) }) },
    Worker: class {
      postMessage({ id, action }) {
        requests.push(action);
        const reply = (result) => this.onmessage({ data: { id, result } });
        if (action === 'frame') delayedFrame = () => reply({ x: .5, y: .5 });
        else if (action === 'capture') {
          video.currentTime += .04;
          tick();
          reply(true);
        } else if (action === 'calibrate') {
          assert.equal(animation.size, 0, 'no live frame queued while applying the adaptation');
          video.currentTime += .04;
          reply();
        } else reply();
      }
      terminate() {}
    },
  };
  const tick = () => {
    const queue = [...animation.values()];
    animation.clear();
    queue.forEach(fn => fn());
  };
  const model = runInNewContext(`${controller}; createWebEyeTrackClient`, options)(video);
  return { model, requests, deadlines, advance(ms) { now += ms; }, answerFrame() { delayedFrame(); } };
}

const flush = () => new Promise(resolve => setImmediate(resolve));

test('initial inference gets a warm-up budget instead of the old frame deadline', async () => {
  const { model, requests, deadlines, advance, answerFrame } = setup();
  await model.load();
  const ready = model.warmUp();
  await flush();
  assert.deepEqual(requests, ['start', 'frame']);
  assert.equal(deadlines[1], 30_000);
  advance(5000);
  answerFrame();
  await ready;
  model.close();
});

test('adaptation waits for an in-flight camera frame, then warms up again', async () => {
  const { model, requests, deadlines, answerFrame } = setup();
  await model.load();
  const ready = model.warmUp();
  await flush();
  answerFrame();
  await ready;

  await model.target({ x: .5, y: .5 });
  await model.capture();
  const calibrated = model.adjust();
  await flush();
  assert.deepEqual(requests, ['start', 'frame', 'target', 'capture', 'frame']);
  assert.equal(deadlines.at(-1), 10_000);
  answerFrame();
  await calibrated;
  const rewarmed = model.warmUp();
  await flush();
  assert.deepEqual(requests.slice(-3), ['frame', 'calibrate', 'frame']);
  assert.equal(deadlines.at(-1), 30_000);
  answerFrame();
  await rewarmed;
  model.close();
});
