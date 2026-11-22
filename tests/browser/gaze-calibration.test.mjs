import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gazeCalibrationPoints, gazeValidationPoints, gazeValidation } from '../../software/toki-os/gaze-calibration.js';

test('fresh webcam calibration covers all four corners in a continuous path', () => {
  const points = gazeCalibrationPoints;
  assert.equal(points.length, 15);
  assert.equal(new Set(points.map(String)).size, 15);
  for (const x of [.08, .92]) {
    for (const y of [.12, .88]) assert.ok(points.some(p => p[0] === x && p[1] === y));
  }
  assert.ok(points.slice(1).every(([x,y], i) => x === points[i][0] || y === points[i][1]));
  assert.equal(gazeValidationPoints.length, 6);
  assert.ok(gazeValidationPoints.every(p => !points.some(q => String(p) === String(q))));
});

test('validation resists one noisy frame but does not accept a missing region', () => {
  const samples = gazeValidationPoints.map(([x, y]) => [{ x, y }, { x, y }, { x: x+.2, y: y+.2 }]);
  assert.deepEqual(gazeValidation(gazeValidationPoints, samples), { error: 0, hits: 6 });
  samples[0] = [];
  assert.deepEqual(gazeValidation(gazeValidationPoints, samples), { error: 1/6, hits: 5 });
});
