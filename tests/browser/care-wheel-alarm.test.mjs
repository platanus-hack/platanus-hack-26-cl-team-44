import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../../software/toki-os/woki-os.html', import.meta.url), 'utf8');

test('wheel SOS never reaches the voice bridge, but the explicit SOS keeps the real path', () => {
  const alarmCode = source.slice(source.indexOf('function startAlarm('), source.indexOf('function rfid('));
  const element = { textContent: '', classList: { add() {}, remove() {} }, focus() {} };
  const state = { alarm: null };
  const calls = [];
  const voice = { emergencia(alarm) { calls.push(alarm); } };
  const context = {
    S: state, window: { VOZ: voice }, VOZ: voice, $: () => element, $$: () => [],
    performance: { now: () => 100 },
    cancelGestures() {}, clearFocus() {}, log() {}, beep() {}, island() {}, renderStatus() {}, updateLCD() {},
  };
  runInNewContext(alarmCode, context);
  context.startAlarm('emergencia', { fromCareWheel: true });
  context.alarmTick(2000);
  context.alarmTick(3000);
  assert.equal(calls.length, 0);
  assert.match(element.textContent, /simulada/);

  state.alarm = null;
  context.startAlarm('emergencia');
  context.alarmTick(2000);
  context.alarmTick(3000);
  assert.deepEqual(calls, [state.alarm]);
});
