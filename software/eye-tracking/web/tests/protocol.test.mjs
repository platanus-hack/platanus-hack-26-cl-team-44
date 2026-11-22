import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decodeFrame } from '../js/protocol.js';

test('rejects malformed lengths before attempting to read floats', () => {
  for (const bytes of [0, 1, 191, 193, 223, 225]) {
    assert.equal(decodeFrame(new ArrayBuffer(bytes)), null, `invalid frame of ${bytes} bytes`);
  }
});

test('decodes the iPhone v2 layout and continues to accept v1', () => {
  // Wire offsets are fixed by Packet.swift, not derived from the decoder constants.
  const fields = [
    [1, 12.5], [2, 1], [3, 42], [4, -0.125], [5, 0.25], [6, -0.5],
    [41, 60], [43, -1], [45, 0.75], [46, 7],
  ];
  for (const [version, size] of [[1, 192], [2, 224]]) {
    const bytes = new ArrayBuffer(size);
    const view = new DataView(bytes);
    for (const [index, value] of [[0, version], ...fields]) view.setFloat32(index * 4, value, true);
    if (version === 2) view.setFloat32(50 * 4, 1, true);
    const frame = decodeFrame(bytes);
    assert.equal(frame.t, 12.5);
    assert.equal(frame.seq, 42);
    assert.equal(frame.tracked, true);
    assert.deepEqual(frame.leftEyePos, [-0.125, 0.25, -0.5]);
    assert.deepEqual(frame.gravity, [0, -1, 0]);
    assert.equal(frame.fps, 60);
    assert.equal(frame.battery, 0.75);
    assert.equal(frame.rescues, 7);
    assert.deepEqual(frame.headQuat, version === 2 ? [0, 0, 0, 1] : null);
  }
});
