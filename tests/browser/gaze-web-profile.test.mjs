import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createGazeWebProfile, freshWebPoint } from '../../software/toki-os/gaze-web-profile.js';

const profile = { version: 2, affine: [1, 0, 0, 0, 1, 0] };
const video = deviceId => ({
  videoWidth: 640, videoHeight: 480,
  srcObject: { getVideoTracks: () => [{ getSettings: () => ({ deviceId }) }] },
});
const point = { x: .5, y: .4, capturedAt: 100 };

function setup({ failLoad = false } = {}) {
  const store = new Map(), calls = [];
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: key => store.delete(key),
  } });
  let fail;
  const gaze = createGazeWebProfile({
    enabled: true,
    createClient(_, { onFailure }) {
      fail = onFailure;
      return {
        async load(saved) {
          calls.push(['load', saved]);
          if (failLoad) throw new Error('unavailable');
        },
        async warmUp() { calls.push('warm'); },
        peek: () => point,
        close: () => calls.push('close'),
      };
    },
    onFailure: error => calls.push(error.message),
  });
  return { gaze, calls, fail: () => fail(new Error('worker stopped')) };
}

test('uses only fresh, valid frames from the current fixation', () => {
  assert.equal(freshWebPoint(point, 340), point);
  assert.equal(freshWebPoint(point, 341), null);
  assert.equal(freshWebPoint(point, 130, 101), null);
  assert.equal(freshWebPoint({ ...point, x: NaN }, 130), null);
});

test('saved calibration restores on the same camera, never a different camera', async () => {
  const { gaze, calls } = setup();
  gaze.save(video('back'), profile);
  const saved = gaze.load();
  assert.equal(await gaze.start(video('front'), saved), null);
  assert.deepEqual(calls, []);

  const client = await gaze.start(video('back'), saved);
  assert.deepEqual(calls, [['load', profile], 'warm']);
  assert.equal(gaze.point(140), null, 'unvalidated candidate must not control the cursor');
  assert.equal(gaze.use(client), true);
  assert.equal(gaze.point(140), point);
  gaze.stop();
  assert.equal(gaze.point(140), null);
});

test('worker loss clears its cursor and switches back without deleting calibration', async () => {
  const { gaze, calls, fail } = setup();
  const cam = video('webcam');
  gaze.save(cam, profile);
  const client = await gaze.start(cam, gaze.load());
  gaze.use(client);
  fail();
  assert.deepEqual(calls.slice(-2), ['close', 'worker stopped']);
  assert.equal(gaze.active, false);
  assert.deepEqual(gaze.load().profile, profile);
});

test('missing assets abandon the candidate without affecting the fallback', async () => {
  const { gaze, calls } = setup({ failLoad: true });
  assert.equal(await gaze.start(video('webcam')), null);
  assert.deepEqual(calls, [['load', undefined], 'close']);
  assert.equal(gaze.active, false);
});
