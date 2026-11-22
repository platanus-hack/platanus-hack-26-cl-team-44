// Stage-normalized coordinates. Five columns cover the top and bottom rows
// of tiles; the inset leaves the full fixation dot visible in the corners.
const columns = [.08, .29, .5, .71, .92];
export const gazeCalibrationPoints = [.12, .5, .88].flatMap((y, row) =>
  (row % 2 ? [...columns].reverse() : columns).map(x => [x, y]));

export const gazeValidationPoints = [
  [.16, .24], [.47, .24], [.84, .24],
  [.84, .76], [.53, .76], [.16, .76],
];

export function gazeValidation(points, samples, aspect = 1080 / 1920) {
  let hits = 0, sum = 0;
  for (const [i, [x, y]] of points.entries()) {
    const ps = samples[i];
    if (!ps?.length) { sum += 1; continue; }
    const median = key => ps.map(p => p[key]).sort((a, b) => a - b)[Math.floor(ps.length / 2)];
    const error = Math.hypot(median('x') - x, (median('y') - y) * aspect);
    sum += error;
    if (error < .14) hits++;
  }
  return { error: sum / points.length, hits };
}
