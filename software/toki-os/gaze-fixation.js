const sampleInterval = .08; // Video time is in seconds.
const maxCandidates = 16;
const inlierRadius = .06; // Screen widths, with Myo's 16:9 aspect.

function median(values) {
  values.sort((a, b) => a - b);
  return (values[Math.floor(values.length / 2)] + values[Math.floor((values.length - 1) / 2)]) / 2;
}

export function createFixation() {
  const candidates = [];
  let latest;
  return {
    push(sample, t) {
      if (!Number.isFinite(t) || t <= latest?.t) return;
      latest = { ...sample, t };
      if (t - (candidates.at(-1)?.t ?? -Infinity) >= sampleInterval) {
        if (candidates.length === maxCandidates) candidates.shift();
        candidates.push(latest);
      }
    },
    select(mode) {
      if (mode === 'last-frame') return latest ? [latest] : [];
      if (candidates.length < 3) return [];

      // Compare against the fixation, not the intended label: an otherwise
      // steady prediction can be offset before the user's model is fitted.
      const x = median(candidates.map(p => p.normPog[0]));
      const y = median(candidates.map(p => p.normPog[1]));
      const inliers = candidates.filter(p => Math.hypot(p.normPog[0] - x, (p.normPog[1] - y) * 9 / 16) <= inlierRadius);
      if (inliers.length < 3 || inliers.length * 2 <= candidates.length) return [];

      // Every target contributes three distinct frames, regardless of FPS.
      return [inliers[0], inliers[Math.floor(inliers.length / 2)], inliers.at(-1)];
    },
  };
}
