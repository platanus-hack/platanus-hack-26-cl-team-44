import { createWebEyeTrackClient } from './webeyetrack-client.js';
import { createGazeStabilizer } from './gaze-stability.js';

const profileKey = 'woki.webeyetrack.v1';
const maxAgeMs = 240;

export function freshWebPoint(frame, now, since = 0) {
  return Number.isFinite(frame?.x) && Number.isFinite(frame?.y) &&
    frame.capturedAt >= since && now >= frame.capturedAt && now - frame.capturedAt <= maxAgeMs ? frame : null;
}

export function createGazeWebProfile({ enabled, onFailure, createClient = createWebEyeTrackClient }) {
  let client = null, active = false;
  const stabilizer = createGazeStabilizer();
  const point = (now, since) => freshWebPoint(active ? client.peek() : null, now, since);
  const camera = video => [video.srcObject?.getVideoTracks()[0]?.getSettings().deviceId ?? '', video.videoWidth, video.videoHeight];
  function load() {
    if (!enabled) return null;
    try {
      const data = JSON.parse(localStorage.getItem(profileKey));
      return data?.profile?.version === 2 && Array.isArray(data.camera) && data.camera.length === 3 ? data : null;
    } catch { return null; }
  }
  function stop() {
    active = false;
    stabilizer.reset();
    client?.close();
    client = null;
  }
  async function start(video, saved) {
    stop();
    if (!enabled || (saved && !camera(video).every((value, i) => value === saved.camera[i]))) return null;
    let current;
    try {
      current = createClient(video, { onFailure(cause) {
        if (client !== current) return;
        const wasActive = active;
        stop();
        if (wasActive) onFailure(cause);
      } });
      client = current;
      await current.load(saved?.profile);
      await current.warmUp();
      return client === current ? current : null;
    } catch {
      if (client === current) stop();
      return null;
    }
  }
  return {
    get active() { return active; },
    load,
    start,
    stop,
    frame: () => active ? client.peek() : null,
    point,
    stablePoint(now) {
      const frame = point(now);
      return frame ? stabilizer.sample(frame) : null;
    },
    use(current) {
      if (!current || current !== client) return false;
      active = true;
      return true;
    },
    save(video, profile) {
      try {
        if (profile) localStorage.setItem(profileKey, JSON.stringify({ camera: camera(video), profile }));
        else localStorage.removeItem(profileKey);
      } catch { /* Calibration still works for the current session. */ }
    },
  };
}
