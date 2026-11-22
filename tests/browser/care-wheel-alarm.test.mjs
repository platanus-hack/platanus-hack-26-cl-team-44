import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../../software/toki-os/os-care.js', import.meta.url), 'utf8');

test('wheel SOS never reaches the voice bridge, but the explicit SOS keeps the real path', () => {
  const element = { textContent: '', classList: { add() {}, remove() {} }, focus() {}, addEventListener() {} };
  const state = { alarm: null };
  const calls = [];
  const createCare = runInNewContext(`${source}\ncreateMyoCare`);
  const care = createCare({
    S: state, $: () => element, $$: () => [],
    now: () => 100, callEmergency: alarm => calls.push(alarm),
    cancelGestures() {}, clearFocus() {}, log() {}, island() {}, renderStatus() {}, updateLCD() {},
  });
  care.startAlarm('emergencia', { fromCareWheel: true });
  care.alarmTick(2000);
  care.alarmTick(3000);
  assert.equal(calls.length, 0);
  assert.match(element.textContent, /simulada/);

  state.alarm = null;
  care.startAlarm('emergencia');
  care.alarmTick(2000);
  care.alarmTick(3000);
  assert.deepEqual(calls, [state.alarm]);
});
