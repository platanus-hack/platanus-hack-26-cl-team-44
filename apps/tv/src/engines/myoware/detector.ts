// Detector de gestos MyoWare (ceja en A3, mandíbula en A0). Funciones puras, sin DOM.
// Port de software/toki-os/myoware-click.js:1-236. Mismos umbrales y mismos textos.

const REST_MS = 5000;
const PREP_MS = 1500;
const GESTURE_MS = 2000;
export const TRIALS = 5;
export const MIN_DETECTIONS = 3;
export const MAX_AGE_MS = 250;
const MAX_GAP_MS = 150;
const JAW_PRIORITY_MS = 150;
const ACTIVATE_MS = 90;
const RELEASE_MS = 120;
export const MYOWARE_PROFILE_KEY = 'toki.myoware.gestures.v3';

/** [tiempo, a0, a3] */
export type Frame = [number, number, number];
export type Gesture = 'brow' | 'jaw';
export type Edge = 'down' | 'up' | 'cancel';

export interface Channel {
  direction: 1 | -1;
  release: number;
  trigger: number;
  center?: number;
}

export interface GestureProfile {
  brow: Channel;
  jaw: Channel;
}

export interface SavedProfile {
  profile: GestureProfile;
  source: string;
}

export interface Packet {
  source?: string;
  sequence?: number;
  age?: number | null;
  frames: Frame[];
}

const quantile = (values: number[], q: number): number =>
  [...values].sort((a, b) => a - b)[Math.floor(q * (values.length - 1))];

function medianFilter() {
  const samples: number[] = [];
  return (value: number): number | null => {
    samples.push(value);
    if (samples.length > 5) samples.shift();
    return samples.length === 5 ? quantile(samples, 0.5) : null;
  };
}

function activityFilter(center: number) {
  const window: number[] = [];
  return (value: number): number | null => {
    window.push(Math.abs(value - center));
    if (window.length > 7) window.shift();
    return window.length === 7 ? window.reduce((sum, distance) => sum + distance, 0) / window.length : null;
  };
}

function fitChannel(rest: number[], trials: number[][], minimumMargin = 2): Channel | null {
  const lowRest = quantile(rest, 0.02);
  const highRest = quantile(rest, 0.98);
  const q = (MIN_DETECTIONS - 1) / (TRIALS - 1);
  const lowGesture = quantile(
    trials.map((values) => quantile(values, 0.15)),
    q,
  );
  const highGesture = quantile(
    trials.map((values) => quantile(values, 0.85)),
    1 - q,
  );
  const downward = lowRest - lowGesture;
  const upward = highGesture - highRest;
  if (Math.max(downward, upward) < minimumMargin) return null;
  const direction = downward > upward ? -1 : 1;
  const release = direction === -1 ? lowRest : highRest;
  return { direction, release, trigger: release + (direction * Math.max(downward, upward)) / 2 };
}

/** Filas [jaw, brow] ya filtradas. */
type Row = [number, number];

export function fitGestureProfile(
  rest: Row[],
  brow: Row[][],
  jaw: Row[][],
  minimumJawMargin = 2,
): GestureProfile | null {
  if (
    rest.length < 50 ||
    brow.length !== TRIALS ||
    jaw.length !== TRIALS ||
    [...brow, ...jaw].some((trial) => trial.length < 20)
  )
    return null;
  const browProfile = fitChannel(
    rest.map((row) => row[1]),
    brow.map((trial) => trial.map((row) => row[1])),
  );
  const jawProfile = fitChannel(
    [...rest, ...brow.flat()].map((row) => row[0]),
    jaw.map((trial) => trial.map((row) => row[0])),
    minimumJawMargin,
  );
  return browProfile && jawProfile ? { brow: browProfile, jaw: jawProfile } : null;
}

function features(frames: Frame[], since: number, center: number | undefined): Row[] {
  const jawFilter = center === undefined ? medianFilter() : activityFilter(center);
  const browFilter = medianFilter();
  const values: Row[] = [];
  for (const [time, a0, a3] of frames) {
    const jaw = jawFilter(a0);
    const brow = browFilter(a3);
    if (time >= since && jaw !== null && brow !== null) values.push([jaw, brow]);
  }
  return values;
}

interface Recording {
  frames: Frame[];
  cue: number;
}

export interface CalibrationOutcome {
  profile: GestureProfile | null;
  summary?: string;
  error?: string;
}

function calibrateRecordings(rest: Frame[], trials: Record<Gesture, Recording[]>): CalibrationOutcome {
  const center = quantile(
    rest.map(([, a0]) => a0),
    0.5,
  );
  const fit = (c: number | undefined, minimumMargin: number) => {
    const gesture = (name: Gesture) => trials[name].map(({ frames, cue }) => features(frames, cue, c));
    const profile = fitGestureProfile(features(rest, -Infinity, c), gesture('brow'), gesture('jaw'), minimumMargin);
    if (profile && c !== undefined) profile.jaw.center = c;
    return profile;
  };
  const candidates = [fit(undefined, 2), fit(center, 0.5)].filter((p): p is GestureProfile => !!p);
  let best: { quality: number; hits: Record<Gesture, number>; restTriggered: boolean; conflicts: number } | null = null;
  for (const profile of candidates) {
    const detectRest = createGestureDetector(profile);
    const restTriggered = rest.some((row) => detectRest(...row));
    const hits: Record<Gesture, number> = { brow: 0, jaw: 0 };
    let conflicts = 0;
    for (const [expected, attempts] of Object.entries(trials) as [Gesture, Recording[]][]) {
      for (const { frames, cue } of attempts) {
        const detect = createGestureDetector(profile);
        const events = frames
          .map((row) => ({ time: row[0], gesture: detect(...row) }))
          .filter((event) => event.gesture);
        if (!events.length) continue;
        if (events.length === 1 && events[0].time >= cue && events[0].gesture === expected) hits[expected]++;
        else conflicts++;
      }
    }
    const quality = Number(restTriggered) + conflicts;
    if (
      !best ||
      quality < best.quality ||
      (quality === best.quality && hits.brow + hits.jaw > best.hits.brow + best.hits.jaw)
    ) {
      best = { quality, hits, restTriggered, conflicts };
    }
    const summary = `Ceja: ${hits.brow}/${TRIALS}. Mandíbula: ${hits.jaw}/${TRIALS}.`;
    if (!quality && hits.brow >= MIN_DETECTIONS && hits.jaw >= MIN_DETECTIONS) return { profile, summary };
  }
  if (best) {
    const summary = `Ceja: ${best.hits.brow}/${TRIALS}. Mandíbula: ${best.hits.jaw}/${TRIALS}.`;
    const reason = best.restTriggered
      ? 'Hubo activación durante el reposo, el parpadeo o el habla.'
      : best.conflicts
        ? `Hubo ${best.conflicts} ${best.conflicts === 1 ? 'intento con un gesto incorrecto, adelantado o repetido' : 'intentos con gestos incorrectos, adelantados o repetidos'}.`
        : `Hace falta detectar al menos ${MIN_DETECTIONS} intentos de cada gesto.`;
    return { profile: null, error: `Calibración no aceptada. ${summary} ${reason}` };
  }
  return {
    profile: null,
    error:
      'No encontré un umbral que separe los gestos del reposo. La gráfica sigue mostrando las lecturas sin clasificar.',
  };
}

export interface Calibration {
  message(): string;
  sample(time: number, a0: number, a3: number): CalibrationOutcome | undefined;
}

export function createCalibration(): Calibration {
  const rest: Frame[] = [];
  const trials: Record<Gesture, Recording[]> = { brow: [], jaw: [] };
  let gesture: Gesture = 'brow';
  let phase: 'rest' | 'prep' | 'gesture' = 'rest';
  let start: number | null = null;
  let cue = 0;
  let recording: Frame[] = [];
  return {
    message() {
      if (phase === 'rest')
        return 'Parpadea y habla normalmente durante 5 segundos. No levantes la ceja ni aprietes los dientes.';
      const label = gesture === 'brow' ? 'Ceja' : 'Mandíbula';
      const cueText = gesture === 'brow' ? 'Levanta la ceja ahora' : 'Junta los dientes suavemente ahora';
      return `${label} ${trials[gesture].length + 1} de ${TRIALS} · ${
        phase === 'prep' ? 'Relaja la cara y espera.' : `${cueText} una vez, mantén medio segundo y relaja.`
      }`;
    },
    sample(time, a0, a3) {
      start ??= time;
      const duration = phase === 'rest' ? REST_MS : phase === 'prep' ? PREP_MS : GESTURE_MS;
      if (time - start < duration) {
        (phase === 'rest' ? rest : recording).push([time, a0, a3]);
        return;
      }
      start = time;
      if (phase === 'rest') phase = 'prep';
      else if (phase === 'prep') {
        phase = 'gesture';
        cue = time;
      } else {
        trials[gesture].push({ frames: recording, cue });
        recording = [];
        if (trials.jaw.length === TRIALS) return calibrateRecordings(rest, trials);
        if (trials.brow.length === TRIALS) gesture = 'jaw';
        phase = 'prep';
      }
      return;
    },
  };
}

export type EdgeListener = (gesture: Gesture, edge: Edge, time: number) => void;

export function createGestureDetector(
  { brow, jaw }: GestureProfile,
  onEdge?: EdgeListener,
): (time: number, a0: number, a3: number) => Gesture | undefined {
  const smoothJaw = jaw.center === undefined ? medianFilter() : activityFilter(jaw.center);
  const smoothBrow = medianFilter();
  const crossed = (value: number, profile: Channel) => (value - profile.trigger) * profile.direction >= 0;
  const rested = (value: number, profile: Channel) => (value - profile.release) * profile.direction <= 0;
  let armed = false;
  let restSince: number | null = null;
  let jawSince: number | null = null;
  let browSince: number | null = null;
  let browDeadline: number | null = null;
  let active: Gesture | null = null;
  return (time, a0, a3) => {
    const jawValue = smoothJaw(a0);
    const browValue = smoothBrow(a3);
    if (jawValue === null || browValue === null) return;
    if (!armed) {
      if (active === 'brow' && crossed(jawValue, jaw)) {
        onEdge?.(active, 'cancel', time);
        active = null;
      }
      if (!rested(jawValue, jaw) || !rested(browValue, brow)) {
        restSince = null;
        return;
      }
      restSince ??= time;
      if (time - restSince >= RELEASE_MS) {
        if (active) onEdge?.(active, 'up', restSince);
        active = null;
        armed = true;
        jawSince = browSince = browDeadline = null;
      }
      return;
    }
    jawSince = crossed(jawValue, jaw) ? (jawSince ?? time) : null;
    browSince = crossed(browValue, brow) ? (browSince ?? time) : null;
    if (browSince !== null && time - browSince >= ACTIVATE_MS) browDeadline ??= browSince + JAW_PRIORITY_MS;

    // Una mandíbula dentro de la ventana tiene prioridad, aunque todavía le falte el antirrebote.
    const gesture: Gesture | null =
      jawSince !== null && time - jawSince >= ACTIVATE_MS
        ? 'jaw'
        : browDeadline !== null && time >= browDeadline && jawSince === null
          ? 'brow'
          : null;
    if (gesture) {
      armed = false;
      restSince = null;
      active = gesture;
      onEdge?.(gesture, 'down', time);
      return gesture;
    }
    return;
  };
}

export function createGestureCursor(expectedSource: string | null = null) {
  let source: string | null = null;
  let sequence: number | null = null;
  let lastTime = 0;
  const isPair = (row: unknown): row is Frame => {
    if (!Array.isArray(row)) return false;
    const [time, a0, a3] = row as unknown[];
    return (
      Number.isFinite(time) &&
      [a0, a3].every((value) => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 1023)
    );
  };
  return (packet: Packet, roundTrip: number): Frame[] | null => {
    const { source: nextSource, sequence: nextSequence, age, frames } = packet;
    if (
      !nextSource ||
      (expectedSource && nextSource !== expectedSource) ||
      (source && source !== nextSource) ||
      !Number.isSafeInteger(nextSequence) ||
      typeof age !== 'number' ||
      !Number.isFinite(age) ||
      age < 0 ||
      age + roundTrip > MAX_AGE_MS
    )
      return null;
    const next = nextSequence as number;
    const latest = frames.at(-1);
    if (!latest || !isPair(latest)) return null;
    const newest = latest[0];
    if (sequence === null) {
      source = nextSource;
      sequence = next;
      lastTime = newest;
      return [];
    }
    const count = next - sequence;
    if (count < 0 || count > frames.length) return null;
    if (!count) return [];
    const batch = frames.slice(-count);
    for (const row of batch) {
      if (!isPair(row)) return null;
      const [time] = row;
      if (time < lastTime || time - lastTime > MAX_GAP_MS) return null;
      lastTime = time;
    }
    sequence = next;
    return batch;
  };
}

export function validMyoWareProfile(value: unknown): value is SavedProfile {
  const validChannel = (channel: Partial<Channel> | undefined) =>
    !!channel &&
    (channel.direction === 1 || channel.direction === -1) &&
    Number.isFinite(channel.trigger) &&
    Number.isFinite(channel.release) &&
    ((channel.trigger as number) - (channel.release as number)) * channel.direction > 0 &&
    (channel.center === undefined || Number.isFinite(channel.center));
  const v = value as Partial<SavedProfile> | null;
  return typeof v?.source === 'string' && !!v.source && validChannel(v.profile?.brow) && validChannel(v.profile?.jaw);
}
