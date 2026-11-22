import { calibrationPoints, motionMetrics, rehearsalGoal, rehearsalOrder, scoreFirstTile, scoreTarget, summarize, targets } from './metrics.js';
import { createWebEyeTrackClient } from '../webeyetrack-client.js';

const get = id => document.getElementById(id);
const start = get('start'), retry = get('retry'), trial = get('trial'), stop = get('stop'), target = get('target');
const phase = get('phase'), error = get('error'), results = get('results'), video = get('camera');
const rehearse = get('rehearse'), rehearsalResults = get('rehearsal-results'), cue = get('rehearsal-cue');
const compareCalibration = get('compare-calibration'), calibrationResults = get('calibration-results');
const abortError = () => new DOMException('Cancelled', 'AbortError');
let session, reference;
const canReuseReference = () => reference && reference.width === innerWidth && reference.height === innerHeight;

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const cancel = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', cancel); resolve(); }, ms);
    signal.addEventListener('abort', cancel, { once: true });
  });
}

function openCamera(video, signal) {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const cancel = () => reject(signal.reason);
    signal.addEventListener('abort', cancel, { once: true });
    navigator.mediaDevices.getUserMedia({ video, audio: false }).then(stream => {
      if (signal.aborted) stream.getTracks().forEach(track => track.stop());
      else resolve(stream);
    }, reject).finally(() => signal.removeEventListener('abort', cancel));
  });
}

function showTarget({ x, y, w, h }) {
  Object.assign(target.style, { left: `${100 * x}%`, top: `${100 * y}%`, width: `${100 * w}%`, height: `${100 * h}%` });
  target.hidden = false;
}

function viewportPoint(point, stage) {
  if (!stage) return point;
  const { x, y, w, h } = point;
  return {
    x: (stage.left + x * stage.width) / innerWidth,
    y: (stage.top + y * stage.height) / innerHeight,
    w: w * stage.width / innerWidth,
    h: h * stage.height / innerHeight,
  };
}

function createToki() {
  const frame = document.createElement('iframe');
  frame.title = 'Calibración de Myo';
  frame.allow = 'camera';
  frame.src = '/woki-os.html?entrada=teclado&controlGlobal=1&metodo=gaze&gazeEngine=ridge';
  let previous;
  return {
    async ready(signal) {
      await new Promise((resolve, reject) => {
        signal.throwIfAborted();
        const finish = (fn, value) => {
          clearTimeout(timer);
          removeEventListener('message', onMessage);
          signal.removeEventListener('abort', cancel);
          fn(value);
        };
        const cancel = () => finish(reject, signal.reason);
        const timer = setTimeout(() => finish(reject, new Error('Myo no terminó de calibrar.')), 90_000);
        const onMessage = ({ source, origin, data }) => {
          if (source !== frame.contentWindow || origin !== location.origin) return;
          if (data?.type === 'toki-control-ready' && data.mode === 'Mirada') finish(resolve);
          if (data?.type === 'toki-control-error') finish(reject, new Error(data.message));
          if (data?.type === 'toki-control-back') finish(reject, abortError());
        };
        addEventListener('message', onMessage);
        signal.addEventListener('abort', cancel, { once: true });
        trial.append(frame);
      });
      frame.classList.add('scoring');
      frame.inert = true;
      frame.setAttribute('aria-hidden', 'true');
      frame.contentWindow.MYO.CFG.jitter = false;
      stop.focus({ preventScroll: true });
    },
    read() {
      const w = frame.contentWindow;
      const cur = w.GAZE?.cur;
      if (!cur || previous === cur.t) return;
      previous = cur.t;
      if (cur.blink || w.MYO.S.gazeLost || w.performance.now() - w.NOSE.lastFace > 200) return { t: performance.now() };
      const stage = w.document.querySelector('#stage').getBoundingClientRect();
      const { x, y } = w.MYO.gz;
      return { x: (x - stage.left) / stage.width, y: (y - stage.top) / stage.height, t: performance.now() };
    },
    device() { return frame.contentWindow.NOSE.stream?.getVideoTracks()[0]?.getSettings().deviceId; },
    close() { frame.contentWindow?.NOSE?.stop(); frame.remove(); },
  };
}

function createWebEyeTrack(signal) {
  const client = createWebEyeTrackClient(video, { signal });
  let stream;
  function close() {
    client.close();
    stream?.getTracks().forEach(track => track.stop());
    video.srcObject = null;
    signal.removeEventListener('abort', close);
  }
  signal.addEventListener('abort', close, { once: true });
  return {
    get deviceId() { return stream?.getVideoTracks()[0]?.getSettings().deviceId; },
    async ready(deviceId, label = 'WebEyeTrack') {
      await client.load();
      const camera = await openCamera({
        width: 640, height: 480, ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' }),
      }, signal);
      if (signal.aborted) {
        camera.getTracks().forEach(track => track.stop());
        signal.throwIfAborted();
      }
      stream = video.srcObject = camera;
      await video.play();
      phase.textContent = `${label} · preparando la cámara. Mira al centro.`;
      await client.warmUp();
    },
    async calibrate({ mode, stage, label = 'WebEyeTrack' } = {}) {
      for (const [i, position] of calibrationPoints.entries()) {
        let captured = false;
        for (let attempt = 0; attempt < 2 && !captured; attempt++) {
          const count = `${label} · calibración ${i + 1} de ${calibrationPoints.length}`;
          phase.textContent = attempt ? `${count}. Vuelve a mirar el mismo punto.` : count;
          showTarget(viewportPoint(position, stage));
          await wait(700, signal);
          await client.target(position);
          await wait(stage ? 1300 : 1000, signal);
          captured = await client.capture(mode);
        }
        if (!captured) throw new Error('WebEyeTrack no detectó tus ojos en un punto. Revisa la luz y la posición de la cámara.');
      }
      target.hidden = true;
      phase.textContent = `${label} · ajustando el modelo…`;
      await client.adjust();
      phase.textContent = `${label} · preparando la prueba. Mira al centro.`;
      await client.warmUp();
    },
    read: client.read,
    close,
  };
}

async function measure(model, label, signal) {
  target.hidden = true;
  phase.textContent = `${label} · mira el centro de cada recuadro.`;
  await wait(1800, signal);
  const scores = [];
  for (const [i, position] of targets.entries()) {
    phase.textContent = `${label} · prueba ${i + 1} de ${targets.length}`;
    showTarget(position);
    scores.push(scoreTarget(await collectSamples(model, 2000, signal), position));
    target.hidden = true;
    await wait(180, signal);
  }
  return summarize(scores);
}

async function collectSamples(model, duration, signal, settle = 0) {
  const started = performance.now();
  if (settle) await wait(settle, signal);
  const samples = [];
  while (performance.now() - started < duration) {
    const sample = model.read();
    const capturedAt = sample?.capturedAt ?? sample?.t;
    if (sample && capturedAt >= started + settle) {
      samples.push({ ...sample, t: sample.t - started, capturedAt: capturedAt - started });
    }
    await wait(16, signal);
  }
  return samples;
}

function createRehearsalHome() {
  const frame = document.createElement('iframe');
  frame.title = 'Inicio de Myo · solo ensayo visual';
  // The actual home renders without opening the access chooser or a second camera.
  frame.src = '/index.html?acceso=iman';
  frame.allow = "camera 'none'; microphone 'none'";
  frame.inert = true;
  frame.setAttribute('aria-hidden', 'true');
  frame.className = 'rehearsal-home scoring';
  trial.append(frame);
  return {
    async show(signal) {
      const deadline = performance.now() + 8000;
      let tiles = [];
      while (performance.now() < deadline) {
        tiles = [...(frame.contentDocument?.querySelectorAll('.app-tile[data-open]') ?? [])];
        if (tiles.length === new Set(rehearsalOrder).size) break;
        await wait(40, signal);
      }
      if (!rehearsalOrder.every(id => tiles.some(tile => tile.dataset.open === id))) {
        throw new Error('No se pudieron cargar las tarjetas de Inicio de Myo.');
      }
      frame.classList.remove('scoring');
      trial.classList.add('rehearsal-view');
      const viewport = frame.contentDocument.querySelector('#content').getBoundingClientRect();
      return tiles.map(tile => {
        const r = tile.getBoundingClientRect();
        const left = Math.max(0, r.left, viewport.left), right = Math.min(innerWidth, r.right, viewport.right);
        const top = Math.max(0, r.top, viewport.top), bottom = Math.min(innerHeight, r.bottom, viewport.bottom);
        if (right <= left || bottom <= top) throw new Error('Amplía la ventana para que todas las tarjetas estén a la vista.');
        return {
          id: tile.dataset.open,
          label: tile.querySelector('strong').textContent,
          x: (left + right) / (2 * innerWidth), y: (top + bottom) / (2 * innerHeight),
          w: (right - left) / innerWidth, h: (bottom - top) / innerHeight,
        };
      });
    },
    close() { frame.remove(); trial.classList.remove('rehearsal-view'); },
  };
}

async function measureRehearsal(model, tiles, signal, { order = rehearsalOrder, stage, label } = {}) {
  phase.textContent = 'Mira el punto blanco de la tarjeta indicada. No hagas clic.';
  await wait(1800, signal);
  const attempts = [];
  for (const [i, id] of order.entries()) {
    const tile = tiles.find(current => current.id === id);
    phase.textContent = `${label ? `${label} · ` : ''}${i + 1} de ${order.length} · Mira ${tile.label}`;
    const point = viewportPoint(tile, stage);
    Object.assign(cue.style, { left: `${100 * point.x}%`, top: `${100 * point.y}%` });
    cue.hidden = false;
    const score = scoreFirstTile(await collectSamples(model, 2000, signal, 220), tiles, id);
    attempts.push({ ...score, label: tile.label, chosenLabel: tiles.find(current => current.id === score.chosen)?.label });
    cue.hidden = true;
    phase.textContent = score.hit ? 'Acierto' : 'Siguiente objetivo';
    await wait(400, signal);
  }
  return attempts;
}

function showRehearsalResult(attempts, motion) {
  const score = summarize(attempts);
  get('rehearsal-verdict').textContent = `${score.hits}/${score.total} al primer intento · ${score.hits >= rehearsalGoal ? 'Meta alcanzada' : 'Aún no alcanza la meta'}`;
  const wrong = attempts.filter(attempt => !attempt.hit && attempt.chosen).length;
  get('rehearsal-summary').textContent = `${wrong} tarjeta(s) equivocada(s) · ${score.missing} sin señal · ${score.median === null ? 'Sin aciertos para medir tiempo' : `${Math.round(score.median)} ms de mediana en aciertos`}.`;
  get('rehearsal-motion').textContent = motion
    ? `Al mirar fijo: ${Math.round(motion.spread)} px de dispersión (90 % de las muestras)${motion.frameMs === null ? '' : ` · ${Math.round(motion.frameMs)} ms de procesamiento mediano por fotograma`}.`
    : 'No hubo suficientes muestras para medir la fluidez.';
  get('rehearsal-attempts').replaceChildren(...attempts.map(attempt => {
    const item = document.createElement('li');
    const outcome = attempt.hit ? `acierto (${Math.round(attempt.time)} ms)` : attempt.chosenLabel ? `primero detectó ${attempt.chosenLabel}` : attempt.hasSignal ? 'sin fijación en una tarjeta' : 'sin señal';
    item.textContent = `${attempt.label}: ${outcome}`;
    return item;
  }));
  rehearsalResults.hidden = false;
}

function beginTrial() {
  if (session) return null;
  if (innerWidth < 640 || innerHeight < 480) {
    error.textContent = 'Abre la prueba en una ventana de al menos 640 × 480.';
    return null;
  }
  session = new AbortController();
  start.closest('main').inert = true;
  error.textContent = '';
  trial.hidden = false;
  stop.focus();
  return session.signal;
}

function endTrial() {
  session = null;
  cue.hidden = target.hidden = trial.hidden = true;
  start.closest('main').inert = false;
}

const calibrationModes = [
  { mode: 'last-frame', label: 'Último fotograma' },
  { mode: 'stable-frames', label: 'Tres muestras estables' },
];

async function readWokiHome(frame, signal) {
  const deadline = performance.now() + 8000;
  while (performance.now() < deadline) {
    const doc = frame.contentDocument, elements = doc?.querySelectorAll('#tiles .tile[data-act]');
    if (elements?.length && doc.readyState === 'complete') {
      doc.querySelector('#calib').classList.remove('on');
      doc.querySelector('#gaze').style.display = 'none';
      // Wait for the normal tile entrance to settle before measuring its rects.
      await wait(700, signal);
      const stage = doc.querySelector('#stage').getBoundingClientRect();
      const tiles = [...elements].map(el => {
        const { left, top, width, height } = el.getBoundingClientRect();
        return {
          id: el.dataset.act, label: el.querySelector('.lb').textContent,
          x: (left + width / 2 - stage.left) / stage.width,
          y: (top + height / 2 - stage.top) / stage.height,
          w: width / stage.width, h: height / stage.height,
        };
      });
      return { stage, tiles };
    }
    await wait(40, signal);
  }
  throw new Error('No se pudieron cargar las tarjetas de Inicio de Myo.');
}

async function runCalibrationComparison() {
  const signal = beginTrial();
  if (!signal) return;
  calibrationResults.hidden = true;
  const scores = get('calibration-scores');
  scores.replaceChildren();
  const frame = document.createElement('iframe');
  frame.title = 'Inicio de Myo · solo prueba visual';
  frame.src = '/woki-os.html?controlGlobal=1';
  frame.allow = "camera 'none'; microphone 'none'";
  frame.inert = true;
  frame.setAttribute('aria-hidden', 'true');
  frame.className = 'rehearsal-home scoring';
  trial.append(frame);
  let model, deviceId;
  try {
    phase.textContent = 'Abriendo las tarjetas de Myo…';
    const { stage, tiles } = await readWokiHome(frame, signal);
    const order = tiles.map((_, i) => tiles[i % 2 ? tiles.length - 1 - (i >> 1) : i >> 1].id);
    const rounds = Math.random() < .5 ? calibrationModes : [...calibrationModes].reverse();
    for (const method of rounds) {
      model = createWebEyeTrack(signal);
      await model.ready(deviceId, method.label);
      deviceId ??= model.deviceId;
      if (!deviceId || model.deviceId !== deviceId) throw new Error('Usa la misma cámara para ambas rondas.');
      await model.calibrate({ ...method, stage });
      phase.textContent = `${method.label} · mira fijo el punto del centro.`;
      showTarget(viewportPoint({ x: .5, y: .5, w: .045, h: .06 }, stage));
      const motion = motionMetrics(await collectSamples(model, 2000, signal, 700), stage.width, stage.height);
      target.hidden = true;
      frame.classList.remove('scoring');
      trial.classList.add('rehearsal-view');
      const score = summarize(await measureRehearsal(model, tiles, signal, { order, stage, label: method.label }));
      const row = scores.insertRow();
      const heading = document.createElement('th');
      heading.scope = 'row';
      heading.textContent = method.label;
      row.append(heading);
      for (const value of [`${score.hits}/${score.total}`, score.missing, score.median === null ? '—' : `${Math.round(score.median)} ms`, motion ? `${Math.round(motion.spread)} px` : '—']) {
        row.insertCell().textContent = value;
      }
      calibrationResults.hidden = false;
      frame.classList.add('scoring');
      trial.classList.remove('rehearsal-view');
      model.close();
      model = null;
    }
  } catch (cause) {
    if (cause?.name !== 'AbortError') error.textContent = cause?.message || 'No se pudo terminar la comparación.';
  } finally {
    model?.close();
    frame.remove();
    trial.classList.remove('rehearsal-view');
    endTrial();
    (calibrationResults.hidden ? compareCalibration : get('calibration-title')).focus();
  }
}

async function runRehearsal() {
  const signal = beginTrial();
  if (!signal) return;
  rehearsalResults.hidden = true;
  let model, home;
  try {
    phase.textContent = 'WebEyeTrack · cargando modelo…';
    home = createRehearsalHome();
    model = createWebEyeTrack(signal);
    await model.ready(canReuseReference() ? reference.deviceId : undefined);
    await model.calibrate();
    phase.textContent = 'Mira fijo el punto del centro para medir la fluidez.';
    showTarget({ x: .5, y: .5, w: .045, h: .06 });
    const motion = motionMetrics(await collectSamples(model, 2000, signal, 700), innerWidth, innerHeight);
    target.hidden = true;
    const tiles = await home.show(signal);
    showRehearsalResult(await measureRehearsal(model, tiles, signal), motion);
  } catch (cause) {
    if (cause?.name !== 'AbortError') error.textContent = cause?.message || 'No se pudo terminar el ensayo.';
  } finally {
    home?.close();
    model?.close();
    endTrial();
    (rehearsalResults.hidden ? rehearse : get('rehearsal-verdict')).focus();
  }
}

function showResult(toki, wet) {
  get('scores').replaceChildren(...[['Myo actual', toki], ['WebEyeTrack', wet]].map(([label, score]) => {
    const row = document.createElement('tr');
    const cells = score ? [`${score.hits}/${score.total}`, score.missing, score.median === null ? '—' : `${Math.round(score.median)} ms`] : ['Pendiente', '—', '—'];
    for (const [i, text] of [label, ...cells].entries()) {
      const cell = document.createElement(i === 0 ? 'th' : 'td');
      if (i === 0) cell.scope = 'row';
      cell.textContent = text;
      row.append(cell);
    }
    return row;
  }));
  results.hidden = false;
}

async function runComparison(reuse = false) {
  const signal = beginTrial();
  if (!signal) return;
  retry.hidden = true;
  results.hidden = true;
  let toki, wet;
  let complete = false;
  try {
    if (!reuse || !canReuseReference()) {
      reference = null;
      phase.textContent = 'Myo · iniciando calibración…';
      toki = createToki();
      await toki.ready(signal);
      const score = await measure(toki, 'Myo', signal);
      reference = { score, deviceId: toki.device(), width: innerWidth, height: innerHeight };
      toki.close();
      toki = null;
    }
    phase.textContent = 'WebEyeTrack · cargando modelo…';
    wet = createWebEyeTrack(signal);
    await wet.ready(reference.deviceId);
    await wet.calibrate();
    showResult(reference.score, await measure(wet, 'WebEyeTrack', signal));
    complete = true;
  } catch (cause) {
    if (cause?.name !== 'AbortError') error.textContent = cause?.message || 'No se pudo terminar la comparación.';
  } finally {
    toki?.close();
    wet?.close();
    endTrial();
    if (!complete && reference) showResult(reference.score);
    retry.hidden = complete || !canReuseReference();
    (complete ? get('result-title') : retry.hidden ? start : retry).focus();
  }
}

const cancel = () => session?.abort(abortError());
start.addEventListener('click', () => runComparison());
retry.addEventListener('click', () => runComparison(true));
rehearse.addEventListener('click', runRehearsal);
compareCalibration.addEventListener('click', runCalibrationComparison);
stop.addEventListener('click', cancel);
addEventListener('keydown', e => { if (e.key === 'Escape') cancel(); });
addEventListener('pagehide', cancel);
document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
addEventListener('resize', () => {
  if (!canReuseReference()) retry.hidden = true;
  session?.abort(new Error('Cambió el tamaño de la ventana. Empieza de nuevo sin redimensionarla.'));
});
