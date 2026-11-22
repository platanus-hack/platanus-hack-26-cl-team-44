// Mismos casos que tests/browser/care-wheel.test.mjs, sobre el port en TypeScript.
import { describe, expect, it } from 'vitest';
import { type ButtonLike, createCareWheel, type DialogLike } from './careWheel';

class FakeElement implements ButtonLike {
  type = '';
  attrs = new Set<string>();
  dataset: Record<string, string | undefined> = {};
  listeners: Record<string, (event?: unknown) => void> = {};
  children: unknown[] = [];
  textContent: string | null = '';
  hidden = false;
  addEventListener(name: string, fn: (event?: unknown) => void) {
    this.listeners[name] = fn;
  }
  setAttribute(name: string) {
    this.attrs.add(name);
  }
  removeAttribute(name: string) {
    this.attrs.delete(name);
  }
  replaceChildren(...children: unknown[]) {
    this.children = children;
  }
  getBoundingClientRect() {
    return { left: 100, top: 100, width: 400, height: 400 };
  }
  focus() {}
  click() {
    this.listeners.click?.();
  }
}

function setup() {
  let tick: (() => void) | null = null;
  const elements = new Map<string, FakeElement>();
  const doc = Object.assign(new FakeElement(), { createElement: () => new FakeElement() });
  const dialog = Object.assign(new FakeElement(), {
    open: false,
    querySelector(key: string) {
      if (!elements.has(key)) elements.set(key, new FakeElement());
      return elements.get(key);
    },
    showModal() {
      dialog.open = true;
    },
    close() {
      dialog.open = false;
    },
  });
  const actions: string[] = [];
  const cues: string[] = [];
  const wheel = createCareWheel(dialog as unknown as DialogLike, {
    announce: (text) => cues.push(text),
    silence() {},
    onAttention: () => actions.push('attention'),
    onSOS: () => actions.push('sos'),
    onBack: () => actions.push('back'),
    onPhrase: (text) => actions.push(text),
    scanMs: 2200,
    doc: doc as never,
    win: new FakeElement(),
    timers: {
      setInterval(fn) {
        tick = fn;
        return 1;
      },
      clearInterval() {
        tick = null;
      },
    },
  });
  return { wheel, doc, actions, cues, elements, step: () => tick?.() };
}

describe('rueda de cuidados', () => {
  it('el escaneo y el audio nunca eligen; el SOS pide dos confirmaciones', () => {
    const { wheel, actions, cues, step } = setup();
    wheel.open();
    expect(cues.at(-1)).toBe('Cerrar');
    step();
    expect(cues.at(-1)).toBe('Ayuda urgente');
    expect(actions).toEqual([]);
    wheel.confirm();
    expect(cues.at(-1)).toBe('Cancelar');
    expect(actions).toEqual([]);
    step();
    expect(cues.at(-1)).toBe('Iniciar SOS de prueba');
    expect(actions).toEqual([]);
    wheel.confirm();
    expect(wheel.active).toBe(false);
    expect(actions).toEqual(['sos']);
    wheel.confirm();
    expect(actions).toEqual(['sos']);
  });

  it('pausa, página oculta y Volver con la mandíbula mantienen una navegación segura', () => {
    const { wheel, actions, cues, doc, elements, step } = setup();
    wheel.open();
    elements.get('#care-pause')?.click();
    step();
    expect(cues).toEqual(['Cerrar']);
    elements.get('#care-pause')?.click();
    step();
    step();
    step();
    expect(cues.at(-1)).toBe('Frases rápidas');
    wheel.confirm();
    step();
    expect(cues.at(-1)).toBe('Necesito cambiar de postura');
    doc.hidden = true;
    doc.listeners.visibilitychange();
    step();
    expect(cues.at(-1)).toBe('Necesito cambiar de postura');
    doc.hidden = false;
    doc.listeners.visibilitychange();
    expect(cues.at(-1)).toBe('Volver a la rueda');
    wheel.back();
    expect(cues.at(-1)).toBe('Cerrar');
    wheel.back();
    expect(wheel.active).toBe(false);
    expect(actions).toEqual([]);
  });

  it('la mirada apunta a sectores amplios sin elegir ni pelear con el escaneo', () => {
    const { wheel, actions, cues, step } = setup();
    wheel.open();
    wheel.updateGaze({ x: 580, y: 340 }, 10);
    expect(cues.at(-1)).toBe('Avisar a mi cuidador');
    wheel.updateGaze({ x: 460, y: 470 }, 30);
    step();
    expect(cues.at(-1)).toBe('Avisar a mi cuidador');
    expect(actions).toEqual([]);
    wheel.confirm();
    expect(actions).toEqual(['attention']);
  });

  it('el centro y la falta de mirada vuelven al escaneo; Urgente no hereda la mirada hacia arriba', () => {
    const { wheel, actions, cues, step } = setup();
    const up = { x: 300, y: 85 };
    const center = { x: 300, y: 300 };
    wheel.open();
    wheel.updateGaze(up, 10);
    expect(cues.at(-1)).toBe('Ayuda urgente');
    wheel.confirm();
    wheel.updateGaze(up, 50);
    expect(cues.at(-1)).toBe('Cancelar');
    wheel.updateGaze(center, 60);
    wheel.updateGaze(up, 100);
    expect(cues.at(-1)).toBe('Iniciar SOS de prueba');
    wheel.updateGaze({ x: 450, y: 300 }, 150);
    expect(cues.at(-1)).toBe('Cancelar');
    wheel.updateGaze(up, 500);
    wheel.updateGaze(null, 600);
    wheel.updateGaze(null, 750);
    expect(cues.at(-1)).toBe('Iniciar SOS de prueba');
    wheel.updateGaze(null, 1000);
    expect(cues.at(-1)).toBe('Cancelar');
    step();
    expect(cues.at(-1)).toBe('Iniciar SOS de prueba');
    expect(actions).toEqual([]);
  });
});
