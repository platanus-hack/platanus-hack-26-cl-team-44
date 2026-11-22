import { describe, expect, it, vi } from 'vitest';
import { createGestures, type GestureHost } from './gestures';

function setup(over: Partial<GestureHost> = {}) {
  const calls: string[] = [];
  let focus: unknown = 'tarjeta';
  const state = { blocked: false, care: false, myoware: true, emergency: false, home: false };
  const host: GestureHost = {
    blocked: () => state.blocked,
    focus: () => focus,
    confirmFocus: () => calls.push('confirmar'),
    careWheelActive: () => state.care,
    careWheelBack: () => calls.push('rueda:volver'),
    openCareWheel: () => calls.push('rueda:abrir'),
    canOpenCareWheel: () => state.home,
    myowareConfirming: () => state.myoware,
    emergency: () => state.emergency,
    goBack: () => calls.push('volver'),
    flash: () => {},
    ...over,
  };
  const g = createGestures(host);
  return {
    g,
    calls,
    state,
    setFocus: (f: unknown) => {
      focus = f;
    },
  };
}

describe('gestos', () => {
  it('Espacio (teclado) confirma al bajar y no repite hasta soltar', () => {
    const { g, calls } = setup();
    g.press('ceja', 'keyboard', 0);
    g.press('ceja', 'keyboard', 10);
    expect(calls).toEqual(['confirmar']);
    g.release('ceja', 'keyboard', 50);
    g.press('ceja', 'keyboard', 60);
    expect(calls).toEqual(['confirmar', 'confirmar']);
  });

  it('con la cara confirma al soltar si fue breve y con el mismo foco', () => {
    const { g, calls, setFocus } = setup();
    g.press('ceja', 'face', 0);
    expect(calls).toEqual([]);
    g.release('ceja', 'face', 300);
    expect(calls).toEqual(['confirmar']);
    g.press('ceja', 'face', 1000);
    g.release('ceja', 'face', 2000);
    expect(calls).toEqual(['confirmar']);
    g.press('ceja', 'face', 3000);
    setFocus('otra');
    g.release('ceja', 'face', 3100);
    expect(calls).toEqual(['confirmar']);
  });

  it('una capa bloqueante impide la ceja', () => {
    const { g, calls, state } = setup();
    state.blocked = true;
    g.press('ceja', 'keyboard', 0);
    expect(calls).toEqual([]);
  });

  it('mandíbula: en Inicio abre Cuidados, en la rueda vuelve y en otra pantalla vuelve', () => {
    const { g, calls, state } = setup();
    state.home = true;
    g.receiveMyoWare('mandibula', 'down', 0);
    g.receiveMyoWare('mandibula', 'down', 10);
    g.receiveMyoWare('mandibula', 'up', 20);
    state.home = false;
    state.care = true;
    g.receiveMyoWare('mandibula', 'down', 30);
    g.receiveMyoWare('mandibula', 'up', 40);
    state.care = false;
    g.receiveMyoWare('mandibula', 'down', 50);
    expect(calls).toEqual(['rueda:abrir', 'rueda:volver', 'volver']);
  });

  it('la mandíbula no actúa sin MyoWare ni durante una emergencia', () => {
    const { g, calls, state } = setup();
    state.myoware = false;
    g.receiveMyoWare('mandibula', 'down', 0);
    state.myoware = true;
    state.emergency = true;
    g.receiveMyoWare('mandibula', 'down', 10);
    expect(calls).toEqual([]);
  });

  it('sin latido de MyoWare en 250 ms se cancela la ceja pendiente', () => {
    vi.useFakeTimers();
    const { g, calls } = setup();
    g.receiveMyoWare(null, 'alive', 0);
    g.receiveMyoWare('ceja', 'down', 0);
    expect(g.browActive).toBe(true);
    vi.advanceTimersByTime(260);
    expect(g.browActive).toBe(false);
    expect(calls).toEqual(['confirmar']);
    vi.useRealTimers();
  });
});
