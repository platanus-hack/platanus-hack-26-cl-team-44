import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../../software/toki-os/care-wheel.js', import.meta.url), 'utf8');

function setup() {
  class Element {
    attrs = new Set();
    dataset = {};
    listeners = {};
    children = [];
    addEventListener(name, fn) { this.listeners[name] = fn; }
    setAttribute(name) { this.attrs.add(name); }
    removeAttribute(name) { this.attrs.delete(name); }
    replaceChildren(...children) { this.children = children; }
    getBoundingClientRect() { return { left: 100, top: 100, width: 400, height: 400 }; }
    focus() {}
    click() { this.listeners.click(); }
  }
  let tick;
  const elements = new Map();
  const document = new Element();
  const dialog = new Element();
  dialog.querySelector = key => {
    if (!elements.has(key)) elements.set(key, new Element());
    return elements.get(key);
  };
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; };
  document.createElement = () => new Element();
  const window = new Element(), actions = [], cues = [];
  runInNewContext(source, {
    window, document, clearInterval() { tick = null; },
    setInterval(fn) { tick = fn; return 1; },
  });
  const wheel = window.createCareWheel(dialog, {
    announce: text => cues.push(text), silence() {},
    onAttention: () => actions.push('attention'),
    onSOS: () => actions.push('sos'),
    onBack: () => actions.push('back'),
    onPhrase: text => actions.push(text), scanMs: 2200,
  });
  return { wheel, document, actions, cues, elements, step: () => tick?.() };
}

test('scan and audio never select an action; SOS needs two explicit confirmations', () => {
  const { wheel, actions, cues, step } = setup();
  wheel.open();
  assert.equal(cues.at(-1), 'Cerrar');
  step();
  assert.equal(cues.at(-1), 'Ayuda urgente');
  assert.deepEqual(actions, []);
  wheel.confirm();
  assert.equal(cues.at(-1), 'Cancelar');
  assert.deepEqual(actions, []);
  step();
  assert.equal(cues.at(-1), 'Iniciar SOS de prueba');
  assert.deepEqual(actions, []);
  wheel.confirm();
  assert.equal(wheel.active, false);
  assert.deepEqual(actions, ['sos']);
  wheel.confirm();
  assert.deepEqual(actions, ['sos']);
});

test('scan pause, hidden pages, and jaw Back preserve safe dialog navigation', () => {
  const { wheel, actions, cues, document, elements, step } = setup();
  wheel.open();
  elements.get('#care-pause').click();
  step();
  assert.deepEqual(cues, ['Cerrar']);
  elements.get('#care-pause').click();
  step();
  step();
  step();
  assert.equal(cues.at(-1), 'Frases rápidas');
  wheel.confirm();
  step();
  assert.equal(cues.at(-1), 'Necesito cambiar de postura');
  document.hidden = true;
  document.listeners.visibilitychange();
  step();
  assert.equal(cues.at(-1), 'Necesito cambiar de postura');
  document.hidden = false;
  document.listeners.visibilitychange();
  assert.equal(cues.at(-1), 'Volver a la rueda');
  wheel.back();
  assert.equal(cues.at(-1), 'Cerrar');
  wheel.back();
  assert.equal(wheel.active, false);
  assert.deepEqual(actions, []);
});

test('gaze points at broad sectors immediately without choosing or fighting the scanner', () => {
  const { wheel, actions, cues, step } = setup();
  wheel.open();
  wheel.updateGaze({ x: 580, y: 340 }, 10);
  assert.equal(cues.at(-1), 'Avisar a mi cuidador');
  wheel.updateGaze({ x: 460, y: 470 }, 30);
  step();
  assert.equal(cues.at(-1), 'Avisar a mi cuidador', 'stay on the current sector across a slightly noisy diagonal');
  assert.deepEqual(actions, []);
  wheel.confirm();
  assert.deepEqual(actions, ['attention']);
});

test('center and missing gaze restore scan; urgent confirmation does not inherit an upward look', () => {
  const { wheel, actions, cues, step } = setup();
  const up = { x: 300, y: 85 }, center = { x: 300, y: 300 };
  wheel.open();
  wheel.updateGaze(up, 10);
  assert.equal(cues.at(-1), 'Ayuda urgente');
  wheel.confirm();
  wheel.updateGaze(up, 50);
  assert.equal(cues.at(-1), 'Cancelar');
  wheel.updateGaze(center, 60);
  wheel.updateGaze(up, 100);
  assert.equal(cues.at(-1), 'Iniciar SOS de prueba');
  wheel.updateGaze({ x: 450, y: 300 }, 150);
  assert.equal(cues.at(-1), 'Cancelar', 'an unused sector never retains the dangerous highlight');
  wheel.updateGaze(up, 500);
  wheel.updateGaze(null, 600);
  wheel.updateGaze(null, 750);
  assert.equal(cues.at(-1), 'Iniciar SOS de prueba', 'a brief blink does not change focus');
  wheel.updateGaze(null, 1000);
  assert.equal(cues.at(-1), 'Cancelar');
  step();
  assert.equal(cues.at(-1), 'Iniciar SOS de prueba', 'scanner is available without gaze');
  assert.deepEqual(actions, []);
});
