const REST_MS = 5000;
const PREP_MS = 1500;
const GESTURE_MS = 2000;
const TRIALS = 5;
const MIN_DETECTIONS = 3;
const MAX_AGE_MS = 250;
const MAX_GAP_MS = 150;
const ACTIVE_POLL_MS = 30;
const RETRY_POLL_MS = 120;
const OUTAGE_NOTICE_MS = 1500;
const OUTAGE_POLL_MS = 500;
const JAW_PRIORITY_MS = 150;
const ACTIVATE_MS = 90;
const RELEASE_MS = 120;
export const MYOWARE_PROFILE_KEY = 'toki.myoware.gestures.v3';
const PROFILE_KEY = MYOWARE_PROFILE_KEY;

const quantile = (values, q) => [...values].sort((a, b) => a - b)[Math.floor(q * (values.length - 1))];

function medianFilter() {
  const samples = [];
  return value => {
    samples.push(value);
    if (samples.length > 5) samples.shift();
    return samples.length === 5 ? quantile(samples, 0.5) : null;
  };
}

function activityFilter(center) {
  const window = [];
  return value => {
    window.push(Math.abs(value - center));
    if (window.length > 7) window.shift();
    return window.length === 7 ? window.reduce((sum, distance) => sum + distance, 0) / window.length : null;
  };
}

function fitChannel(rest, trials, minimumMargin = 2) {
  const lowRest = quantile(rest, 0.02), highRest = quantile(rest, 0.98);
  const q = (MIN_DETECTIONS - 1) / (TRIALS - 1);
  const lowGesture = quantile(trials.map(values => quantile(values, 0.15)), q);
  const highGesture = quantile(trials.map(values => quantile(values, 0.85)), 1 - q);
  const downward = lowRest - lowGesture, upward = highGesture - highRest;
  if (Math.max(downward, upward) < minimumMargin) return null;
  const direction = downward > upward ? -1 : 1;
  const release = direction === -1 ? lowRest : highRest;
  return { direction, release, trigger: release + direction * Math.max(downward, upward) / 2 };
}

export function fitGestureProfile(rest, brow, jaw, minimumJawMargin = 2) {
  if (rest.length < 50 || brow.length !== TRIALS || jaw.length !== TRIALS ||
      [...brow, ...jaw].some(trial => trial.length < 20)) return null;
  const browProfile = fitChannel(rest.map(row => row[1]), brow.map(trial => trial.map(row => row[1])));
  const jawProfile = fitChannel(
    [...rest, ...brow.flat()].map(row => row[0]),
    jaw.map(trial => trial.map(row => row[0])),
    minimumJawMargin
  );
  return browProfile && jawProfile ? { brow: browProfile, jaw: jawProfile } : null;
}

function features(frames, since, center) {
  const jawFilter = center === undefined ? medianFilter() : activityFilter(center);
  const browFilter = medianFilter();
  const values = [];
  for (const [time, a0, a3] of frames) {
    const jaw = jawFilter(a0), brow = browFilter(a3);
    if (time >= since && jaw !== null && brow !== null) values.push([jaw, brow]);
  }
  return values;
}

function calibrateRecordings(rest, trials) {
  const center = quantile(rest.map(([, a0]) => a0), 0.5);
  const fit = (center, minimumMargin) => {
    const gesture = name => trials[name].map(({ frames, cue }) => features(frames, cue, center));
    const profile = fitGestureProfile(features(rest, -Infinity, center), gesture('brow'), gesture('jaw'), minimumMargin);
    if (profile && center !== undefined) profile.jaw.center = center;
    return profile;
  };
  const candidates = [fit(undefined, 2), fit(center, 0.5)].filter(Boolean);
  let best = null;
  for (const profile of candidates) {
    const detectRest = createGestureDetector(profile);
    const restTriggered = rest.some(row => detectRest(...row));
    const hits = { brow: 0, jaw: 0 };
    let conflicts = 0;
    for (const [expected, attempts] of Object.entries(trials)) {
      for (const { frames, cue } of attempts) {
        const detect = createGestureDetector(profile);
        const events = frames.map(row => ({ time: row[0], gesture: detect(...row) })).filter(event => event.gesture);
        if (!events.length) continue;
        if (events.length === 1 && events[0].time >= cue && events[0].gesture === expected) hits[expected]++;
        else conflicts++;
      }
    }
    const quality = Number(restTriggered) + conflicts;
    if (!best || quality < best.quality || (quality === best.quality && hits.brow + hits.jaw > best.hits.brow + best.hits.jaw)) {
      best = { quality, hits, restTriggered, conflicts };
    }
    const summary = `Ceja: ${hits.brow}/${TRIALS}. Mandíbula: ${hits.jaw}/${TRIALS}.`;
    if (!quality && hits.brow >= MIN_DETECTIONS && hits.jaw >= MIN_DETECTIONS) return { profile, summary };
  }
  if (best) {
    const summary = `Ceja: ${best.hits.brow}/${TRIALS}. Mandíbula: ${best.hits.jaw}/${TRIALS}.`;
    const reason = best.restTriggered ? 'Hubo activación durante el reposo, el parpadeo o el habla.'
      : best.conflicts ? `Hubo ${best.conflicts} ${best.conflicts === 1 ? 'intento con un gesto incorrecto, adelantado o repetido' : 'intentos con gestos incorrectos, adelantados o repetidos'}.`
      : `Hace falta detectar al menos ${MIN_DETECTIONS} intentos de cada gesto.`;
    return { profile: null, error: `Calibración no aceptada. ${summary} ${reason}` };
  }
  return {
    profile: null,
    error: 'No encontré un umbral que separe los gestos del reposo. La gráfica sigue mostrando las lecturas sin clasificar.'
  };
}

export function createCalibration() {
  const rest = [], trials = { brow: [], jaw: [] };
  let gesture = 'brow';
  let phase = 'rest', start = null, cue = null, recording = [];
  return {
    message() {
      if (phase === 'rest') return 'Parpadea y habla normalmente durante 5 segundos. No levantes la ceja ni aprietes los dientes.';
      const label = gesture === 'brow' ? 'Ceja' : 'Mandíbula';
      const cue = gesture === 'brow' ? 'Levanta la ceja ahora' : 'Junta los dientes suavemente ahora';
      return `${label} ${trials[gesture].length + 1} de ${TRIALS} · ${phase === 'prep'
        ? 'Relaja la cara y espera.' : `${cue} una vez, mantén medio segundo y relaja.`}`;
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
      else if (phase === 'prep') { phase = 'gesture'; cue = time; }
      else {
        trials[gesture].push({ frames: recording, cue });
        recording = [];
        if (trials.jaw.length === TRIALS) return calibrateRecordings(rest, trials);
        if (trials.brow.length === TRIALS) gesture = 'jaw';
        phase = 'prep';
      }
    }
  };
}

export function createGestureDetector({ brow, jaw }, onEdge) {
  const smoothJaw = jaw.center === undefined ? medianFilter() : activityFilter(jaw.center);
  const smoothBrow = medianFilter();
  const crossed = (value, profile) => (value - profile.trigger) * profile.direction >= 0;
  const rested = (value, profile) => (value - profile.release) * profile.direction <= 0;
  let armed = false, restSince = null, jawSince = null, browSince = null, browDeadline = null;
  let active = null;
  return (time, a0, a3) => {
    const jawValue = smoothJaw(a0), browValue = smoothBrow(a3);
    if (jawValue === null || browValue === null) return;
    if (!armed) {
      if (active === 'brow' && crossed(jawValue, jaw)) {
        onEdge?.(active, 'cancel', time);
        active = null;
      }
      if (!rested(jawValue, jaw) || !rested(browValue, brow)) { restSince = null; return; }
      restSince ??= time;
      if (time - restSince >= RELEASE_MS) {
        if (active) onEdge?.(active, 'up', restSince);
        active = null;
        armed = true;
        jawSince = browSince = browDeadline = null;
      }
      return;
    }
    jawSince = crossed(jawValue, jaw) ? jawSince ?? time : null;
    browSince = crossed(browValue, brow) ? browSince ?? time : null;
    if (browSince !== null && time - browSince >= ACTIVATE_MS) browDeadline ??= browSince + JAW_PRIORITY_MS;

    // A jaw crossing inside the window takes priority, even if it still needs debounce at the deadline.
    const gesture = jawSince !== null && time - jawSince >= ACTIVATE_MS ? 'jaw'
      : browDeadline !== null && time >= browDeadline && jawSince === null ? 'brow' : null;
    if (gesture) {
      armed = false;
      restSince = null;
      active = gesture;
      onEdge?.(gesture, 'down', time);
      return gesture;
    }
  };
}

export function createGestureCursor(expectedSource = null) {
  let source = null, sequence = null, lastTime = null;
  const isPair = ([time, a0, a3]) => Number.isFinite(time) && [a0, a3].every(value =>
    Number.isInteger(value) && value >= 0 && value <= 1023);
  return (packet, roundTrip) => {
    const { source: nextSource, sequence: nextSequence, age, frames } = packet;
    if (!nextSource || (expectedSource && nextSource !== expectedSource) ||
        (source && source !== nextSource) || !Number.isSafeInteger(nextSequence) ||
        !Number.isFinite(age) || age < 0 || age + roundTrip > MAX_AGE_MS) return null;
    const latest = frames.at(-1);
    if (!latest || !isPair(latest)) return null;
    const newest = latest[0];
    if (sequence === null) {
      source = nextSource;
      sequence = nextSequence;
      lastTime = newest;
      return [];
    }
    const count = nextSequence - sequence;
    if (count < 0 || count > frames.length) return null;
    if (!count) return [];
    const batch = frames.slice(-count);
    for (const row of batch) {
      const [time] = row;
      if (!isPair(row) || time < lastTime || time - lastTime > MAX_GAP_MS) return null;
      lastTime = time;
    }
    sequence = nextSequence;
    return batch;
  };
}

export function validMyoWareProfile(value) {
  const validChannel = channel => channel && [1, -1].includes(channel.direction) &&
    Number.isFinite(channel.trigger) && Number.isFinite(channel.release) &&
    (channel.trigger - channel.release) * channel.direction > 0 &&
    (channel.center === undefined || Number.isFinite(channel.center));
  return typeof value?.source === 'string' && !!value.source &&
    validChannel(value.profile?.brow) && validChannel(value.profile?.jaw);
}

function readProfile(storage) {
  const value = JSON.parse(storage.getItem(PROFILE_KEY));
  return validMyoWareProfile(value) ? value : null;
}

export function setupMyoWareGestures(onInput = null, enterWoki = null, { launchOrigin, transfer = false, enterGaze, onActivate, onUnavailable, onRecovered } = {}) {
  const panel = document.getElementById('myoware-controls');
  const calibrateButton = document.getElementById('myoware-calibrate');
  const toggleButton = document.getElementById('myoware-toggle');
  const status = document.getElementById('myoware-status');
  const result = document.getElementById('myoware-result');
  const openWoki = document.getElementById('myoware-open-woki');
  const useWoki = document.getElementById('myoware-use-woki');
  const useGaze = document.getElementById('myoware-use-gaze');
  let saved = null, mode = 'off', runId = 0, resume = false;
  let counts = { brow: 0, jaw: 0 };
  function loadSaved() {
    try {
      const profile = readProfile(localStorage);
      if (profile) return profile;
    } catch {}
    try {
      const previous = readProfile(sessionStorage);
      if (previous) save(previous);
      return previous;
    } catch { return null; }
  }
  saved = loadSaved();
  const setStatus = text => { if (status.textContent !== text) status.textContent = text; };

  function enable() {
    if (mode === 'off' && saved) start('active');
    return mode === 'active';
  }

  function save(value) {
    saved = value;
    let persisted = false;
    try {
      if (value) localStorage.setItem(PROFILE_KEY, JSON.stringify(value));
      else localStorage.removeItem(PROFILE_KEY);
      persisted = true;
    } catch {}
    try {
      if (value && !persisted) sessionStorage.setItem(PROFILE_KEY, JSON.stringify(value));
      else sessionStorage.removeItem(PROFILE_KEY);
    } catch {}
  }

  function updateButtons() {
    calibrateButton.textContent = mode === 'calibrating' ? 'Cancelar calibración' : 'Calibrar gestos';
    calibrateButton.disabled = mode === 'active';
    toggleButton.hidden = !saved;
    toggleButton.textContent = onInput
      ? mode === 'active' ? 'Desactivar gestos' : 'Activar gestos'
      : mode === 'active' ? 'Detener prueba' : 'Probar gestos';
    if (openWoki) {
      openWoki.textContent = saved ? 'Abrir Myo OS con esta calibración' : 'Abrir Myo OS sin activar el sensor';
      if (launchOrigin) openWoki.href = `${launchOrigin}/woki-os.html${saved && !transfer ? '?myoware=1' : ''}`;
    }
    if (useWoki) useWoki.hidden = !saved || !enterWoki || mode !== 'off';
    if (useGaze) useGaze.hidden = !saved || !enterGaze || mode === 'calibrating';
  }

  function stop(message, clear = false) {
    if (mode === 'active') onInput?.(null, 'cancel');
    runId++;
    mode = 'off';
    resume = false;
    if (clear) save(null);
    setStatus(message);
    updateButtons();
  }

  function start(nextMode) {
    mode = nextMode;
    const id = ++runId;
    const calibration = mode === 'calibrating' ? createCalibration() : null;
    let freshAfter = Infinity, lastPollAt = null, retrySince = null, warned = false;
    const createDetector = () => createGestureDetector(saved.profile, (name, edge, time) => {
      if (edge === 'cancel' || time >= freshAfter) onInput?.(name === 'brow' ? 'ceja' : 'mandibula', edge, time);
      else onInput?.(null, 'cancel');
    });
    let read = createGestureCursor(calibration ? null : saved.source);
    let detect = calibration ? null : createDetector();
    counts = { brow: 0, jaw: 0 };
    result.textContent = 'Último gesto: —';
    setStatus(calibration ? 'Buscando ambos canales para calibrar…' : 'Relaja la frente y la mandíbula antes del primer gesto.');
    updateButtons();

    function resetActiveInput(now) {
      if (retrySince === null) {
        retrySince = now;
        onInput?.(null, 'cancel');
        setStatus('Recuperando la señal MyoWare… La calibración sigue guardada.');
      }
      // Reseed from live data. Do not reuse an armed gesture or its history.
      freshAfter = Infinity;
      lastPollAt = null;
      read = createGestureCursor(saved.source);
      detect = createDetector();
    }

    async function poll() {
      if (id !== runId) return;
      let valid = false;
      try {
        const started = performance.now();
        const response = await fetch('/emg/gestures', { cache: 'no-store', signal: AbortSignal.timeout(750) });
        if (!response.ok) throw Error();
        const packet = await response.json();
        if (id !== runId || document.visibilityState !== 'visible') return;
        if (!calibration && packet.source && packet.source !== saved.source) {
          const message = 'Cambió la conexión del sensor. Vuelve a calibrar los gestos.';
          stop(message, true);
          onUnavailable?.(message);
          return;
        }
        const now = performance.now(), roundTrip = now - started;
        if (!calibration && lastPollAt !== null && now - lastPollAt > MAX_AGE_MS) resetActiveInput(now);
        const frames = read(packet, roundTrip);
        if (!frames) throw Error();
        valid = true;
        if (calibration) {
          for (const row of frames) {
            const outcome = calibration.sample(...row);
            if (!outcome) continue;
            save(outcome.profile ? { profile: outcome.profile, source: packet.source } : null);
            stop(outcome.profile ? `Calibración lista. ${outcome.summary}` : outcome.error);
            return;
          }
          setStatus(calibration.message());
        } else {
          lastPollAt = now;
          if (frames.length) {
            retrySince = null;
            if (warned) onRecovered?.();
            warned = false;
            freshAfter = frames.at(-1)[0] + packet.age + roundTrip - MAX_AGE_MS;
          }
          for (const row of frames) {
            const gesture = detect(...row);
            if (!gesture || packet.frames.at(-1)[0] - row[0] + packet.age + roundTrip > MAX_AGE_MS) continue;
            counts[gesture]++;
            const label = gesture === 'brow' ? 'Ceja' : 'Mandíbula';
            result.textContent = `Último gesto: ${label} · Ceja: ${counts.brow} · Mandíbula: ${counts.jaw}`;
          }
          if (frames.length) onInput?.(null, 'alive');
          if (retrySince === null) setStatus(onInput ? 'Gestos activos: levanta la ceja para elegir. Suéltala antes del siguiente clic.'
            : 'Prueba activa. Relaja la cara entre gestos.');
        }
      } catch {
        if (id !== runId) return;
        if (calibration) {
          stop('No hay señal reciente de ambos canales. Revisa la conexión y vuelve a iniciar la calibración.');
          return;
        }
        resetActiveInput(performance.now());
      }
      if (id === runId) {
        const outage = retrySince === null ? 0 : performance.now() - retrySince;
        if (!valid && outage >= OUTAGE_NOTICE_MS && !warned) {
          warned = true;
          const message = 'Sin señal MyoWare. Revisa la conexión; Myo seguirá intentando.';
          setStatus(message);
          onUnavailable?.(message);
        }
        const delay = valid ? (calibration || !onInput ? 60 : ACTIVE_POLL_MS)
          : warned ? OUTAGE_POLL_MS : RETRY_POLL_MS;
        setTimeout(poll, delay);
      }
    }
    poll();
  }

  calibrateButton.addEventListener('click', () => {
    if (mode === 'calibrating') { stop('Calibración cancelada.', true); return; }
    save(null);
    start('calibrating');
  });
  toggleButton.addEventListener('click', () => {
    if (mode === 'active') stop(onInput ? 'Gestos desactivados.' : 'Prueba detenida.');
    else if (saved) {
      onActivate?.();
      start('active');
    }
  });
  if (openWoki && launchOrigin && transfer) openWoki.addEventListener('click', event => {
    if (!saved) return;
    event.preventDefault();
    const form = document.createElement('form');
    form.method = 'post';
    form.action = `${launchOrigin}/myoware/handoff`;
    form.hidden = true;
    const profile = document.createElement('input');
    profile.type = 'hidden';
    profile.name = 'calibration';
    profile.value = JSON.stringify(saved);
    form.append(profile);
    document.body.append(form);
    form.requestSubmit();
  });
  useWoki?.addEventListener('click', () => {
    if (!saved || !enterWoki || mode !== 'off') return;
    useWoki.blur();
    enterWoki();
    start('active');
  });
  useGaze?.addEventListener('click', () => {
    if (!saved || !enterGaze || mode === 'calibrating') return;
    useGaze.blur();
    enterGaze();
  });
  function pause() {
    if (mode === 'off') return;
    const wasActive = mode === 'active';
    stop(wasActive ? 'En pausa mientras la página está oculta.' : 'Se interrumpió la calibración. Vuelve a iniciarla.');
    resume = wasActive;
  }
  function restore() {
    if (document.visibilityState !== 'visible' || mode !== 'off') return;
    const previous = saved;
    saved = loadSaved();
    if (resume && saved && saved.source === previous?.source) {
      resume = false;
      start('active');
      return;
    }
    resume = false;
    if (saved && !previous) setStatus('Calibración guardada. Activa los gestos o la prueba para usarla.');
    else if (!saved && previous) setStatus('No hay una calibración guardada.');
    updateButtons();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') restore();
    else pause();
  });
  window.addEventListener('pagehide', pause);
  window.addEventListener('pageshow', restore);
  window.addEventListener('storage', event => {
    if (event.key !== null && event.key !== PROFILE_KEY) return;
    if (mode === 'active') stop('La calibración cambió en otra pestaña. Vuelve a activar cuando esté lista.');
    restore();
  });
  if (saved) setStatus('Calibración guardada. Activa los gestos o la prueba para usarla.');
  updateButtons();
  panel.hidden = false;
  return { enable };
}
