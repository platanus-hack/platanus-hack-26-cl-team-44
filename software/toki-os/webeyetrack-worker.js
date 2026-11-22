let tracker;
const support = [];
let pendingPoint = null;
let fixation = null, createFixation;

// The pinned WebEyeTrack release has no model export API. Save only adapted
// numeric parameters, not the frozen encoder or any captured frames.
function head() { return tracker.blazeGaze.model.getLayer('gaze_mlp'); }

function snapshot() {
  return {
    version: 2,
    weights: head().getWeights().map(tensor => Array.from(tensor.dataSync())),
    affine: Array.from(tracker.affineMatrix.dataSync()),
    faceWidth: tracker.faceWidthCm,
    depth: tracker.latestGazeResult?.faceOrigin3D[2],
  };
}

function restore(profile) {
  const layer = head();
  const templates = layer.getWeights();
  const numeric = (values, size) => Array.isArray(values) && values.length === size && values.every(Number.isFinite);
  if (profile.version !== 2 || !Number.isFinite(profile.faceWidth) || profile.faceWidth <= 0 ||
      !Number.isFinite(profile.depth) || !numeric(profile.affine, 6) || !Array.isArray(profile.weights) ||
      profile.weights.length !== templates.length ||
      !templates.every((tensor, i) => numeric(profile.weights[i], tensor.size))) {
    throw new Error('Invalid WebEyeTrack calibration profile');
  }
  const fromValues = (template, values) => {
    const buffer = template.bufferSync();
    buffer.values.set(values);
    return buffer.toTensor();
  };
  const trained = templates.map((tensor, i) => fromValues(tensor, profile.weights[i]));
  const flat = templates[0].flatten();
  const slice = flat.slice([0], [6]);
  const matrix = slice.reshape([2, 3]);
  try {
    layer.setWeights(trained);
    tracker.affineMatrix = fromValues(matrix, profile.affine);
    tracker.faceWidthCm = profile.faceWidth;
    tracker.faceWidthComputed = true;
    tracker.latestGazeResult = { faceOrigin3D: [0, 0, profile.depth] };
  } finally {
    for (const tensor of [...trained, matrix, slice, flat]) tensor.dispose();
  }
}

self.onmessage = async ({ data: { id, action, value } }) => {
  try {
    let result;
    switch (action) {
      case 'start':
        importScripts('/web/tracker.js');
        ({ createFixation } = await import('./gaze-fixation.js'));
        tracker = new self.WebEyeTrack();
        await tracker.initialize();
        if (value) restore(value);
        break;
      case 'target':
        pendingPoint = value;
        fixation = createFixation();
        break;
      case 'frame': {
        const current = fixation;
        const gaze = await tracker.step(value.image, value.t);
        result = { tracked: gaze.facialLandmarks.length > 0 };
        if (gaze.gazeState === 'open' && gaze.normPog.every(Number.isFinite)) {
          Object.assign(result, { x: gaze.normPog[0] + .5, y: gaze.normPog[1] + .5 });
          if (current && current === fixation) {
            const { normPog, eyePatch, headVector, faceOrigin3D } = gaze;
            current.push({ normPog, eyePatch, headVector, faceOrigin3D }, value.t);
          }
        }
        break;
      }
      case 'capture': {
        const frames = fixation?.select(value) ?? [];
        result = frames.length > 0;
        if (result) {
          const label = [pendingPoint.x - .5, pendingPoint.y - .5];
          support.push(...frames.map(frame => ({ ...frame, label })));
        }
        pendingPoint = fixation = null;
        break;
      }
      case 'calibrate': {
        const pick = key => support.map(sample => sample[key]);
        tracker.adapt(pick('eyePatch'), pick('headVector'), pick('faceOrigin3D'), pick('label'));
        support.length = 0;
        if (value?.saveProfile) result = snapshot();
        break;
      }
      default: throw new Error(`Unknown benchmark action: ${action}`);
    }
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error: error?.message || String(error) });
  }
};
