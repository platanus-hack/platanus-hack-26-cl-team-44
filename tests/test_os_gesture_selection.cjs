const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync('software/toki-os/woki-os.html','utf8');
const gestures = html.slice(html.indexOf('function goBack('), html.indexOf('function targetLayer('));

function setup({ myoware = true, wheel = false } = {}) {
  let now = 0, id = 0;
  const timers = new Map(), actions = [];
  const S = { focus: {}, screen: 'home', emoRingFor: null, kb: { level: 1, text: 'Hola' }, rest: false };
  const history = { state: { wokiStep: 0 }, back: () => actions.push('back') };
  const flags = { calib: false, alarm: false, panel: false };
  const careWheel = wheel ? { active: false, back() { actions.push('wheel-back'); } } : null;
  const app = vm.createContext({
    S, history, trackerOnly: false, document: { visibilityState: 'visible', body: { classList: { contains: name => flags[name] } } },
    CFG: { faceBrowMaxMs: Number(html.match(/\bfaceBrowMaxMs:\s*(\d+)/)[1]) },
    $: selector => ({ classList: { contains: () => flags[selector.slice(1)] } }),
    flashGesture() {}, confirmFocus: () => actions.push('confirm'),
    myowareConfirming: () => myoware, targetLayer: () => S.screen,
    careWheel, openCareWheel() { careWheel.active = true; actions.push('wheel'); },
    renderKeys: () => actions.push('keys'), go: name => actions.push(name),
    closeEmoRing: () => actions.push('emotions'), setRest: () => actions.push('wake'),
    setTimeout(fn, ms) { timers.set(++id, { fn, at: now + ms }); return id; },
    clearTimeout(key) { timers.delete(key); }
  });
  vm.runInContext(gestures, app);
  return { app, S, history, flags, actions, advance(ms) {
    const end = now + ms;
    for (;;) {
      const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > end) break;
      timers.delete(next[0]); now = next[1].at; next[1].fn();
    }
    now = end;
  } };
}

test('a detected brow confirms immediately; holding or releasing it does not confirm again', () => {
  const { app, actions } = setup();
  app.pressSrc('ceja', 'keyboard', 0);
  assert.deepEqual(actions, ['confirm']);
  app.pressSrc('ceja', 'keyboard', 100);
  assert.deepEqual(actions, ['confirm']);
  app.releaseSrc('ceja', 'keyboard', 200);
  assert.deepEqual(actions, ['confirm']);
  app.pressSrc('ceja', 'keyboard', 400);
  assert.deepEqual(actions, ['confirm', 'confirm']);
});

test('only gaze-dwell modes fill progress and select timed targets', () => {
  const code = html.slice(html.indexOf('function tick(now)'), html.indexOf('/* ===================== Alarma'));
  function simulate({ myoware = false, iphone = false, dwell = false, rest = false, strict = false }) {
    let now = 0, selections = 0, progress = 0;
    const target = { dataset: { dwell: '2000' }, isConnected: true,
      classList: { add() {}, toggle() {}, contains() { return false; } },
      matches: selector => strict && selector === '.sos-nav,.rest-nav',
      getBoundingClientRect: () => ({ left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 }),
      style: { setProperty(key, value) { if (key === '--p') progress = value; } } };
    const S = { rest, scale: 1, focus: null };
    const context = {
      S, CFG: { settleMs: 350, mode: dwell ? 'dwell' : 'click' },
      document: { body: target, elementFromPoint: () => ({ closest: () => target }) },
      $: () => target, mouse: { x: 50, y: 50 }, gz: { x: 50, y: 50 }, noise: { x: 0, y: 0 },
      gauss: () => 0, myowareConfirming: () => myoware, iphonePointing: () => iphone, iphoneDwell: () => iphone && dwell,
      window: {
        createMagneticPointer: () => ({ aim: (_point, _now, accepts) => ({ target: accepts(target) ? target : null }), reset() {} }),
        createPointerDwell: () => ({ sample: () => 0, reset() {} }),
      }, tabletComposer: false, trackerOnly: false, SNAP_PX: 0, MAGNET: 0,
      careWheel: null, menuPointer: { reset() {}, resolve: () => ({ target, inside: true }) },
       menuDwell: {
         started: null,
         sample(_el, now, inside) { if (!inside) { this.reset(); return -1; } this.started ??= now; return now - this.started; },
         reset() { this.started = null; }
       }, menuOutline: { clear() {}, paint() {} },
      setFocus(el) { if (S.focus !== el) { S.focus = el; S.fStart = now; } }, targetLayer: () => ({ contains: () => true }),
      activate() { selections++; if (S.rest) S.rest = false; }, clearFocus() { S.focus = null; }, island() {}, log() {}, alarmTick() {},
      requestAnimationFrame() {}, suggestionExitAt: null,
    };
    vm.createContext(context);
    vm.runInContext(code, context);
    for (now of [10, 500, 2500]) context.tick(now);
    return { selections, progress, resting: S.rest };
  }
  for (const mode of [{ myoware: true }, { iphone: true }]) {
    assert.deepEqual(simulate(mode), { selections: 0, progress: 0, resting: false });
    assert.deepEqual(simulate({ ...mode, rest: true }), { selections: 0, progress: 0, resting: true });
  }
  for (const mode of [{ dwell: true }, { iphone: true, dwell: true }]) {
    assert.deepEqual(simulate(mode), { selections: 1, progress: 1, resting: false });
  }
  assert.deepEqual(simulate({ iphone: true, dwell: true, strict: true }), { selections: 1, progress: 1, resting: false });
  assert.deepEqual(simulate({ iphone: true, strict: true }), { selections: 0, progress: 0, resting: false });
});

test('successful webcam setup enables saved MyoWare without a monitor link', () => {
  const start = html.indexOf("  import { setupMyoWareGestures } from './myoware-click.js';");
  const module = html.slice(html.indexOf('\n', start), html.indexOf('</script>', start));
  function setup({ hasProfile = true, fromMonitor = false, mode = 'click', tabletComposer = false, trackerOnly = false } = {}) {
    const CFG = { mode }, WOKI = {};
    let selected = 0;
    const context = {
      CFG, trackerOnly, tabletComposer, window: { WOKI }, URLSearchParams,
      location: { search: fromMonitor ? '?myoware=1' : '' },
      receiveMyoWare() {}, setupMyoWareGestures: () => ({ enable: () => hasProfile }),
      iphonePointing: () => false, setMyoWareConfirmation: () => { selected++; },
    };
    vm.runInNewContext(module, context);
    return { WOKI, get selected() { return selected; } };
  }
  const standard = setup();
  assert.equal(standard.WOKI.resumeMyoWareForGaze(), true);
  assert.equal(standard.selected, 1);
  for (const options of [{ hasProfile: false }, { mode: 'dwell' }, { tabletComposer: true }, { trackerOnly: true }]) {
    const app = setup(options);
    assert.equal(app.WOKI.resumeMyoWareForGaze(), false);
    assert.equal(app.selected, 0);
  }
  assert.equal(setup({ mode: 'dwell' }).WOKI.resumeMyoWareForGaze(true), true);
  assert.equal(setup({ mode: 'dwell', fromMonitor: true }).WOKI.resumeMyoWareForGaze(), true);
});

test('jaw, blocked UI, and release without a new detection do not confirm', () => {
  const { app, S, flags, actions, advance } = setup();
  app.receiveMyoWare('mandibula', 'down', 0);
  app.receiveMyoWare('mandibula', 'up', 3500);
  flags.calib = true;
  app.pressSrc('ceja', 'keyboard', 5000);
  flags.calib = false;
  app.releaseSrc('ceja', 'keyboard', 5200);
  flags.panel = true;
  app.pressSrc('ceja', 'keyboard', 5500);
  flags.panel = false;
  app.releaseSrc('ceja', 'keyboard', 5700);
  app.pressSrc('ceja', 'face', 6000);
  S.focus = {};
  app.releaseSrc('ceja', 'face', 6200);
  assert.deepEqual(actions, []);
  app.receiveMyoWare(null, 'alive');
  app.receiveMyoWare('ceja', 'down', 8500);
  assert.deepEqual(actions, ['confirm']);
  advance(250);
  app.receiveMyoWare('ceja', 'up', 8800);
  assert.deepEqual(actions, ['confirm']);
});

test('Back button returns a screen or keyboard level without deleting a draft', () => {
  assert.match(html, /class="t nav-action back-nav" data-t data-act="back">‹ Volver/);
  assert.match(html, /case 'back': goBack\(\); break/);
  assert.doesNotMatch(html, /id="quickDialog"/);
  assert.doesNotMatch(html, /S\.quick|G\.down|gazeOnly/);
  const { app, S, history, actions } = setup();
  S.screen = 'keyboard';
  S.kb.level = 3;
  app.goBack();
  assert.equal(S.kb.level, 1);
  assert.equal(S.kb.text, 'Hola');
  history.state.wokiStep = 1;
  app.goBack();
  assert.deepEqual(actions, ['keys', 'back']);
  history.state.wokiStep = 0;
  app.goBack();
  assert.deepEqual(actions, ['keys', 'back', 'home']);
});

test('official rest screen keeps explicit Volver and SOS targets with freshness guards', () => {
  const rest = html.match(/<div class="overlay" id="rest"[\s\S]*?<\/div>\s*<\/div>/)?.[0] || '';
  assert.match(rest, /id="restWake"[^>]*data-act="wake"/);
  assert.match(rest, /class="t rest-sos"[^>]*data-act="sos"/);
  assert.match(html, /function setRest\(on\)\{\s*if\(S\.rest===on\) return;/);
  assert.match(html, /function controlPointFresh\(now\)/);
  assert.match(html, /restDwell\.reset\(\); restMagnet\.reset\(\)/);
  assert.match(html, /if\(!A\.fromCareWheel && !A\.called\)[\s\S]{0,100}VOZ\.emergencia\(A\)/);
  assert.match(html, /onSOS:\(\)=>\{[\s\S]{0,100}fromCareWheel:true/);
  assert.match(html, /SOS de prueba\. No se contactó a nadie/);
});

test('jaw goes back immediately away from Home and opens or closes the wheel at Home', () => {
  const { app, S, flags, actions } = setup({ wheel: true });
  S.screen = 'keyboard';
  S.kb.level = 3;
  S.focus = null;
  app.receiveMyoWare('mandibula', 'down', 0);
  assert.deepEqual(actions, ['keys'], 'goes back on detection without waiting for release');
  assert.equal(S.kb.level, 1);
  assert.equal(S.kb.text, 'Hola');

  app.receiveMyoWare('mandibula', 'down', 100);
  assert.deepEqual(actions, ['keys'], 'a held jaw cannot repeat');
  app.receiveMyoWare('mandibula', 'up', 200);
  S.screen = 'home';
  app.receiveMyoWare('mandibula', 'down', 300);
  assert.deepEqual(actions, ['keys', 'wheel'], 'no target or gaze is needed to open at Home');
  app.receiveMyoWare('mandibula', 'up', 400);
  app.receiveMyoWare('mandibula', 'down', 500);
  assert.deepEqual(actions, ['keys', 'wheel', 'wheel-back']);
  app.receiveMyoWare('mandibula', 'up', 600);
  flags.calib = true;
  app.receiveMyoWare('mandibula', 'down', 700);
  assert.deepEqual(actions, ['keys', 'wheel', 'wheel-back'], 'calibration still blocks shortcuts');
});

test('jaw exits Rest to the current screen instead of opening the Home wheel', () => {
  const { app, S, actions } = setup({ wheel: true });
  S.rest = true;
  app.receiveMyoWare('mandibula', 'down', 0);
  assert.deepEqual(actions, ['wake']);
});

test('paired ENV confirms before release and gives the jaw priority inside the overlap window', async () => {
  const source = readFileSync('software/toki-os/myoware-click.js');
  const { createGestureDetector } = await import(`data:text/javascript;base64,${source.toString('base64')}`);
  const { app, actions, advance } = setup();
  const profile = { jaw: { direction: 1, trigger: 120, release: 105 }, brow: { direction: -1, trigger: 508, release: 511 } };
  const detect = createGestureDetector(profile, (name, edge, time) => {
    app.receiveMyoWare(name === 'jaw' ? 'mandibula' : 'ceja', edge, time);
  });
  let time = 0;
  function feed(count, a0 = 100, a3 = 512) {
    for (let i = 0; i < count; i++) {
      advance(50); time += 50;
      detect(time, a0, a3); app.receiveMyoWare(null, 'alive');
    }
  }
  feed(12);
  feed(3, 100, 504);
  feed(8, 140, 504);
  feed(12);
  feed(12, 140, 504);
  feed(12);
  assert.deepEqual(actions, []);
  feed(9, 100, 504);
  assert.deepEqual(actions, ['confirm']);
  feed(12, 100, 504);
  feed(6);
  assert.deepEqual(actions, ['confirm']);
});
