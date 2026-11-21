const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync('software/toki-os/woki-os.html','utf8');
const gestures = html.slice(html.indexOf('function goBack('), html.indexOf('function targetLayer('));

function setup() {
  let now = 0, id = 0;
  const timers = new Map(), actions = [];
  const S = { focus: {}, screen: 'home', emoRingFor: null, kb: { level: 1, text: 'Hola' }, rest: false };
  const history = { state: { wokiStep: 0 }, back: () => actions.push('back') };
  const flags = { calib: false, alarm: false, panel: false };
  const app = vm.createContext({
    S, history, trackerOnly: false, document: { visibilityState: 'visible', body: { classList: { contains: name => flags[name] } } },
    CFG: { faceBrowMaxMs: Number(html.match(/\bfaceBrowMaxMs:\s*(\d+)/)[1]) },
    $: selector => ({ classList: { contains: () => flags[selector.slice(1)] } }),
    flashPill() {}, confirmFocus: () => actions.push('confirm'),
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
  assert.match(html, /class="t pill glass back-nav" data-t data-act="back">‹ Volver/);
  assert.match(html, /case 'back': goBack\(\); break/);
  assert.doesNotMatch(html, /id="quickDialog"/);
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
