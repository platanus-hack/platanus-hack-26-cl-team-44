const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');

const source = readFileSync('software/toki-os/myoware-click.js');
const modulePromise = import(`data:text/javascript;base64,${source.toString('base64')}`);
const trials = (a0, a3) => Array.from({ length: 5 }, () => Array.from({ length: 40 }, () => [a0, a3]));
const profile = {
  brow: { direction: -1, trigger: 508, release: 511 },
  jaw: { direction: 1, trigger: 120, release: 105 }
};

test('calibration accepts overlap on A3 but requires independent jaw evidence on A0', async () => {
  const { fitGestureProfile } = await modulePromise;
  const rest = Array.from({ length: 50 }, (_, i) => [100 + i % 3, 511 + i % 3]);
  assert.deepEqual(fitGestureProfile(rest, trials(105, 505), trials(135, 502)), profile);
  assert.equal(fitGestureProfile(rest, trials(105, 505), trials(104, 502)), null);
  assert.equal(fitGestureProfile(rest, trials(105, 510), trials(135, 502)), null);
  assert.equal(fitGestureProfile(rest, [...trials(105, 505).slice(0, 2), ...trials(105, 512).slice(0, 3)], trials(135, 502)), null);
  assert.deepEqual(fitGestureProfile([...rest, [100, 504]], trials(105, 505), trials(135, 502)), profile);
});

test('guided calibration checks all ten trials and rejects a jaw onset outside the priority window', async () => {
  const { createCalibration } = await modulePromise;
  function run(jawDelay, { bipolar = false, misses = 0, noisyRest = false } = {}) {
    const calibration = createCalibration();
    let time = 0, result;
    const feed = (duration, a0 = 100, a3 = 512) => {
      const end = time + duration;
      for (; time < end; time += 10) {
        const value = typeof a0 === 'function' ? a0(time) : a0;
        result = calibration.sample(time, value, a3);
      }
    };
    if (noisyRest) {
      feed(1000);
      feed(180, 100, 504);
      feed(3830);
    } else feed(5010);
    for (const label of ['Ceja', 'Mandíbula']) {
      for (let attempt = 1; attempt <= 5; attempt++) {
        assert.match(calibration.message(), new RegExp(`${label} ${attempt} de 5.*espera`));
        feed(1500);
        assert.match(calibration.message(), /ahora/);
        if (label === 'Mandíbula') feed(jawDelay, 100, 504);
        const jaw = bipolar ? time => time % 20 === 0 ? 106 : 94 : 140;
        const missed = label === 'Ceja' && attempt <= misses;
        feed(600, label === 'Ceja' ? 100 : jaw, missed ? 512 : 504);
        feed(1400 - (label === 'Mandíbula' ? jawDelay : 0));
      }
    }
    return result;
  }
  assert.deepEqual(run(140), { profile: {
    brow: { direction: -1, trigger: 508, release: 512 },
    jaw: { direction: 1, trigger: 120, release: 100 },
  }, summary: 'Ceja: 5/5. Mandíbula: 5/5.' });
  assert.equal(run(220).profile, null);
  assert.equal(run(100, { bipolar: true }).profile.jaw.center, 100, 'oscillating A0 needs activity relative to rest');
  assert.equal(run(220, { bipolar: true }).profile, null, 'fallback also rejects a delayed jaw that appears to be a brow');
  assert.equal(run(140, { misses: 2 }).summary, 'Ceja: 3/5. Mandíbula: 5/5.');
  assert.equal(run(140, { misses: 3 }).profile, null);
  assert.equal(run(140, { noisyRest: true }).profile, null, 'a gesture during rest prevents enabling clicks');
});

test('jaw wins with simultaneous or late A0, and neither gesture repeats before both release', async () => {
  const { createGestureDetector } = await modulePromise;
  const detect = createGestureDetector(profile);
  let time = 0;
  const feed = (a0, a3, count) => {
    const events = [];
    for (let i = 0; i < count; i++, time += 10) {
      const event = detect(time, a0, a3);
      if (event) events.push(event);
    }
    return events;
  };
  assert.deepEqual(feed(100, 504, 50), [], 'held gesture at startup');
  assert.deepEqual(feed(100, 512, 20), []);
  assert.deepEqual(feed(100, 504, 4), [], 'spike');
  assert.deepEqual(feed(100, 512, 20), []);
  assert.deepEqual(feed(100, 504, 14), [], 'A3 waits for possible jaw onset');
  assert.deepEqual(feed(140, 504, 30), ['jaw'], 'A0 arrives 140ms later and wins after debounce');
  assert.deepEqual(feed(100, 504, 40), [], 'brow remaining active prevents rearm');
  assert.deepEqual(feed(140, 512, 40), [], 'jaw remaining active prevents rearm');
  assert.deepEqual(feed(100, 512, 20), []);
  assert.deepEqual(feed(100, 504, 40), ['brow']);
  assert.deepEqual(feed(100, 512, 20), []);
  assert.deepEqual(feed(140, 504, 40), ['jaw'], 'simultaneous signals');
  assert.deepEqual(feed(100, 512, 20), []);
  assert.deepEqual(feed(140, 512, 40), ['jaw'], 'A0 alone');
});

test('stream cursor skips history, consumes each frame once and rejects broken streams', async () => {
  const { createGestureCursor } = await modulePromise;
  const packet = { source: 'uno', sequence: 2, age: 5, frames: [[100, 100, 512], [110, 100, 510]] };
  const read = createGestureCursor('uno');
  assert.deepEqual(read(packet, 10), []);
  const next = { ...packet, sequence: 3, frames: [...packet.frames, [120, 100, 505]] };
  assert.deepEqual(read(next, 10), [[120, 100, 505]]);
  assert.deepEqual(read(next, 10), []);
  assert.equal(read(next, 260), null);
  assert.equal(read({ ...next, age: null }, 10), null);
  assert.equal(read({ ...next, source: 'reopened' }, 10), null);
  assert.equal(read({ ...next, sequence: 4, frames: [[300, 100, 505]] }, 10), null);
  assert.equal(read({ ...next, sequence: 6, frames: [[130, 100, 505]] }, 10), null);
  assert.equal(read({ ...next, sequence: 4, frames: [[130, 100, null]] }, 10), null);
});

test('jaw is available at its original detection edge and a clean brow still confirms on the same frame', async () => {
  const { createGestureDetector } = await modulePromise;
  const profile = { jaw: { direction: 1, trigger: 120, release: 105 }, brow: { direction: -1, trigger: 508, release: 511 } };
  const events = [];
  let time = 0;
  const detect = createGestureDetector(profile, (...edge) => events.push(edge));
  const feed = (duration, a0 = 100, a3 = 512) => {
    for (let elapsed = 0; elapsed < duration; elapsed += 10) detect(time += 10, a0, a3);
  };
  feed(300);
  feed(180, 100, 504);
  assert.deepEqual(events, [['brow', 'down', 480]], 'two raw settle frames plus the original 150 ms window');
  feed(250);
  const started = time;
  feed(110, 145, 504);
  assert.notEqual(events.at(-1)?.[0], 'jaw');
  feed(10, 145, 504);
  assert.deepEqual(events.at(-1), ['jaw', 'down', started + 120], 'no separate hold needed for the shortcut');
  feed(750, 145, 504);
  assert.equal(events.filter(([name, edge]) => name === 'jaw' && edge === 'down').length, 1, 'holding does not repeat');
  assert.equal(events.filter(([name, edge]) => name === 'brow' && edge === 'down').length, 1, 'jaw overlap cannot click');
});

test('confirmation only accepts available focus on the current layer', () => {
  const html = readFileSync('software/toki-os/woki-os.html', 'utf8');
  const functions = html.slice(html.indexOf('function targetLayer('), html.indexOf('/* Clic directo'));
  const element = { dataset: { act: 'go:settings' }, classList: { add() {} } };
  const S = { focus: element, armed: true, blocked: null };
  const CFG = { mode: 'click' };
  const flags = { inside: true, iphone: false, myoware: false };
  const window = {};
  let clicks = 0;
  const context = vm.createContext({
    S, CFG, window, performance: { now: () => 100 }, activate: () => clicks++, iphonePointing: () => flags.iphone,
    careWheel: null, myowareConfirming: () => flags.myoware,
    $: id => ({ contains: () => flags.inside && (id !== '#rest' || element.dataset.act === 'wake') })
  });
  vm.runInContext(functions, context);
  context.confirmFocus();
  assert.equal(clicks, 1);
  context.confirmFocus();
  S.blocked = null;
  S.rest = true; context.confirmFocus(); S.rest = false;
  S.armed = false; context.confirmFocus(); S.armed = true;
  flags.inside = false; context.confirmFocus(); flags.inside = true;
  CFG.mode = 'dwell'; context.confirmFocus(); CFG.mode = 'click';
  assert.equal(clicks, 1);
  context.confirmFocus();
  assert.equal(clicks, 2);
  S.blocked = null;
  S.rest = true;
  element.dataset.act = 'wake';
  context.confirmFocus();
  assert.equal(clicks, 3);
  S.rest = false;
  S.blocked = null;
  S.armed = false;
  CFG.mode = 'dwell';
  flags.iphone = true;
  context.confirmFocus();
  assert.equal(clicks, 4, 'physical brow may confirm without dwell in iPhone mode');
  S.blocked = null;
  S.armed = true;
  CFG.mode = 'click';
  flags.iphone = false;
  window.NOSE = { on: true, mode: 'gaze' };
  window.GAZE = { blocksPointer: () => true };
  context.confirmFocus();
  assert.equal(clicks, 4, 'stale webcam gaze cannot confirm the previous focus');
  window.GAZE.blocksPointer = () => false;
  context.confirmFocus();
  assert.equal(clicks, 5);
  flags.myoware = true;
  S.blocked = null;
  S.armed = false;
  context.confirmFocus();
  context.confirmFocus();
  assert.equal(clicks, 6, 'MyoWare accepts a new focus immediately but cannot repeat its click');
  S.rest = true;
  element.dataset.act = 'wake';
  S.blocked = null;
  context.confirmFocus();
  assert.equal(clicks, 7, 'MyoWare wakes from rest without arming');
  S.rest = false;
  element.dataset.act = 'agentSend';
  S.agentPending = 1;
  context.confirmFocus();
  assert.equal(clicks, 8, 'the separate confirmation can use the same send target');
});

test('monitor shares persistent calibration and Myo receives fresh edges for both channels', async () => {
  const elements = Object.fromEntries(['controls', 'calibrate', 'toggle', 'status', 'result', 'open-woki', 'use-woki', 'use-gaze'].map(name => [
    `myoware-${name}`, { addEventListener(_, listener) { this.click = listener; }, blur() {} }
  ]));
  const calibration = elements['myoware-calibrate'], toggle = elements['myoware-toggle'];
  const status = elements['myoware-status'];
  const timers = [], delays = [], frames = [[0, 100, 512]], storage = new Map(), tabStorage = new Map();
  const storageApi = map => ({ getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) });
  const events = [], unavailable = [];
  const browDowns = () => events.filter(([src, edge]) => src === 'ceja' && edge === 'down').length;
  let sequence = 1, entries = 0, gazeEntries = 0, age = 0, usbSource = 'uno';
  let now = 0, recovered = 0, transportAvailable = true;
  const listeners = {};
  const register = (name, listener) => { listeners[name] = listener; };
  const document = { visibilityState: 'visible', getElementById: id => elements[id], addEventListener: register };
  const context = vm.createContext({
    document, window: { addEventListener: register },
    performance: { now: () => now },
    AbortSignal: { timeout() {} },
    localStorage: storageApi(storage), sessionStorage: storageApi(tabStorage),
    fetch: async () => ({ ok: transportAvailable, json: async () => ({ source: usbSource, sequence, age, frames }) }),
    setTimeout(poll, delay) { timers.push(poll); delays.push(delay); },
  });
  vm.runInContext(source.toString().replace(/^export (?=(function|const) )/gm, ''), context);
  context.setupMyoWareGestures();
  assert.equal(toggle.hidden, true);
  assert.equal(elements['myoware-use-gaze'].hidden, true);
  calibration.click();
  await new Promise(setImmediate);

  function queueSamples(a0, a3, count) {
    for (let i = 0; i < count; i++) {
      frames.push([frames.at(-1)[0] + 10, a0, a3]);
      sequence++;
    }
  }

  async function sample(a0 = 100, a3 = 512, count = 10) {
    queueSamples(a0, a3, count);
    await timers.shift()();
  }

  let trialAt = 0, previousPrompt = '';
  for (let i = 0; i < 420 && toggle.hidden; i++) {
    const prompt = status.textContent;
    if (prompt !== previousPrompt) trialAt = i;
    previousPrompt = prompt;
    const brow = prompt.includes('Levanta') && i - trialAt < 6;
    const jaw = prompt.includes('Junta') && i - trialAt < 6;
    await sample(jaw ? 140 : 100, brow || jaw ? 504 : 512);
  }
  assert.match(status.textContent, /Calibración lista/);
  assert.equal(elements['myoware-open-woki'].textContent, 'Abrir Myo OS con esta calibración');
  const [savedKey, savedProfile] = storage.entries().next().value;
  assert.equal(tabStorage.size, 0, 'calibration lives beyond this tab');
  assert.equal(browDowns(), 0);
  toggle.click();
  await new Promise(setImmediate);
  await sample();
  await sample();
  await sample(140, 504, 25);
  assert.match(elements['myoware-result'].textContent, /Último gesto: Mandíbula.*Mandíbula: 1/);
  toggle.click();
  await timers.shift()();
  const myoware = context.setupMyoWareGestures((...event) => events.push(event), () => entries++, {
    enterGaze: () => gazeEntries++,
    onUnavailable: message => unavailable.push(message),
    onRecovered: () => recovered++,
  });
  assert.equal(toggle.hidden, false);
  assert.equal(toggle.textContent, 'Activar gestos');
  assert.equal(elements['myoware-use-woki'].hidden, false);
  assert.equal(elements['myoware-use-gaze'].hidden, false);
  elements['myoware-use-gaze'].click();
  assert.equal(gazeEntries, 1);
  assert.equal(entries, 0);
  assert.equal(toggle.textContent, 'Activar gestos', 'gaze must finish setup before activating gestures');
  elements['myoware-use-woki'].click();
  assert.equal(entries, 1);
  assert.equal(elements['myoware-use-woki'].hidden, true);
  await new Promise(setImmediate);
  await sample();
  await sample();
  await sample(140, 504, 25);
  assert.equal(browDowns(), 0);
  assert.ok(events.some(([src, edge]) => src === 'mandibula' && edge === 'down'));
  await sample(100, 512, 25);
  await sample(100, 505, 30);
  assert.equal(browDowns(), 1);

  document.visibilityState = 'hidden';
  listeners.visibilitychange();
  listeners.pagehide();
  assert.match(status.textContent, /En pausa/);
  queueSamples(100, 512, 25);
  queueSamples(100, 504, 50);
  await timers.shift()();
  document.visibilityState = 'visible';
  listeners.pageshow();
  listeners.visibilitychange();
  await new Promise(setImmediate);
  await sample(100, 504, 30);
  assert.equal(browDowns(), 1, 'cannot start a gesture with hidden or held samples after returning');
  await sample(100, 512, 25);
  await sample(100, 504, 30);
  assert.equal(browDowns(), 2, 'fresh eyebrow after release still works');

  age = null;
  await timers.shift()();
  assert.match(status.textContent, /Recuperando la señal/);
  assert.equal(unavailable.length, 0, 'a transient failure is not a banner');
  assert.deepEqual(events.at(-1), [null, 'cancel']);
  assert.equal(toggle.textContent, 'Desactivar gestos', 'recovery keeps the previous intent');
  assert.equal(storage.get(savedKey), savedProfile);
  age = 0;
  await sample(100, 505, 25);
  assert.match(status.textContent, /Recuperando la señal/, 'a snapshot alone does not establish live input');
  await sample(100, 505, 30);
  assert.equal(browDowns(), 2, 'a brow held through the outage cannot replay');
  await sample(100, 512, 25);
  await sample(100, 505, 30);
  assert.equal(browDowns(), 3, 'same source resumes without a click on the toggle');
  assert.equal(recovered, 0, 'no recovery toast for a brief interruption');

  now += 400;
  queueSamples(100, 512, 25);
  await sample(100, 505, 30);
  await sample(100, 505, 30);
  assert.equal(browDowns(), 3, 'no stale gesture if the browser was too slow to poll');
  await sample(100, 512, 25);
  await sample(100, 505, 30);
  assert.equal(browDowns(), 4);

  transportAvailable = false;
  await timers.shift()();
  assert.equal(delays.at(-1), 120);
  now += 1500;
  await timers.shift()();
  assert.match(status.textContent, /Revisa la conexión/);
  assert.equal(unavailable.at(-1), status.textContent);
  assert.equal(delays.at(-1), 500);
  await timers.shift()();
  assert.equal(unavailable.length, 1, 'one alert per sustained outage');
  transportAvailable = true;
  await sample(100, 505, 25);
  await sample(100, 505, 30);
  assert.equal(recovered, 1);
  assert.equal(browDowns(), 4);

  age = null;
  await timers.shift()();
  toggle.click();
  await timers.shift()();
  assert.equal(timers.length, 0, 'manual disable stops automatic retries');
  age = 0;
  usbSource = 'reopened';
  toggle.click();
  await new Promise(setImmediate);
  assert.match(status.textContent, /Cambió la conexión del sensor/);
  assert.equal(unavailable.at(-1), status.textContent);
  assert.equal(toggle.hidden, true);
  assert.equal(storage.has(savedKey), false, 'new USB source invalidates persistent calibration');
  assert.equal(timers.length, 0);
  assert.equal(browDowns(), 4);

  tabStorage.set(savedKey, savedProfile);
  listeners.pageshow();
  assert.equal(elements['myoware-use-woki'].hidden, false, 'restored page reads the legacy tab calibration');
  assert.equal(tabStorage.has(savedKey), false);
  assert.equal(storage.get(savedKey), savedProfile, 'existing tab profiles migrate without a new calibration');
  storage.set(savedKey, 'invalid');
  listeners.storage({ key: savedKey });
  assert.equal(elements['myoware-use-woki'].hidden, true, 'invalid stored data cannot enable a click');
  assert.equal(elements['myoware-use-gaze'].hidden, true);
  elements['myoware-use-gaze'].click();
  assert.equal(gazeEntries, 1);
  assert.equal(myoware.enable(), false, 'iPhone cannot enable an invalid profile');
});
