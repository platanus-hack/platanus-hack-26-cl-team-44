// Partes del caso «monitor shares persistent calibration…» de tests/test_myoware_click.cjs, sobre el cliente portado.
import { describe, expect, it } from 'vitest';
import { type MyoView, MyoWareClient } from './client';
import { MYOWARE_PROFILE_KEY } from './detector';

function setup() {
  const timers: (() => Promise<void> | void)[] = [];
  const delays: number[] = [];
  const frames: [number, number, number][] = [[0, 100, 512]];
  const storage = new Map<string, string>();
  const tabStorage = new Map<string, string>();
  const api = (map: Map<string, string>) => ({
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  });
  const events: [string | null, string][] = [];
  const unavailable: string[] = [];
  const state = { sequence: 1, age: 0 as number | null, source: 'uno', ok: true, now: 0, visible: true, recovered: 0 };
  let view: MyoView | null = null;
  const make = (withInput: boolean) =>
    new MyoWareClient({
      onInput: withInput ? (src, edge) => events.push([src, edge]) : undefined,
      onChange: (v) => {
        view = v;
      },
      onUnavailable: (m) => unavailable.push(m),
      onRecovered: () => state.recovered++,
      fetchImpl: async () => ({
        ok: state.ok,
        json: async () => ({ source: state.source, sequence: state.sequence, age: state.age, frames: [...frames] }),
      }),
      now: () => state.now,
      setTimer: (fn, ms) => {
        timers.push(fn as () => void);
        delays.push(ms);
      },
      storage: api(storage),
      tabStorage: api(tabStorage),
      visible: () => state.visible,
    });
  const flush = () => new Promise((r) => setTimeout(r, 0));
  const queue = (a0: number, a3: number, count: number) => {
    for (let i = 0; i < count; i++) {
      frames.push([frames[frames.length - 1][0] + 10, a0, a3]);
      state.sequence++;
    }
  };
  const sample = async (a0 = 100, a3 = 512, count = 10) => {
    queue(a0, a3, count);
    await timers.shift()?.();
    await flush();
  };
  const browDowns = () => events.filter(([s, e]) => s === 'ceja' && e === 'down').length;
  return {
    make,
    state,
    storage,
    tabStorage,
    events,
    unavailable,
    sample,
    queue,
    timers,
    delays,
    flush,
    browDowns,
    view: () => view,
  };
}

describe('cliente MyoWare', () => {
  it('calibra, guarda el perfil y entrega bordes frescos de ambos canales', async () => {
    const t = setup();
    const monitor = t.make(false);
    expect(monitor.view.saved).toBe(false);
    monitor.calibrate();
    await t.flush();
    let trialAt = 0;
    let previous = '';
    for (let i = 0; i < 420 && !monitor.view.saved; i++) {
      const prompt = monitor.view.status;
      if (prompt !== previous) trialAt = i;
      previous = prompt;
      const brow = prompt.includes('Levanta') && i - trialAt < 6;
      const jaw = prompt.includes('Junta') && i - trialAt < 6;
      await t.sample(jaw ? 140 : 100, brow || jaw ? 504 : 512);
    }
    expect(monitor.view.status).toMatch(/Calibración lista/);
    expect(t.storage.has(MYOWARE_PROFILE_KEY)).toBe(true);
    expect(t.tabStorage.size).toBe(0);

    // La TV abre con la calibración guardada y activa los gestos.
    t.timers.length = 0;
    const tv = t.make(true);
    expect(tv.view.saved).toBe(true);
    expect(tv.view.status).toBe('Calibración guardada. Activa los gestos o la prueba para usarla.');
    expect(tv.enable()).toBe(true);
    await t.flush();
    await t.sample();
    await t.sample();
    await t.sample(140, 504, 25);
    expect(t.browDowns()).toBe(0);
    expect(t.events.some(([s, e]) => s === 'mandibula' && e === 'down')).toBe(true);
    expect(tv.view.result).toMatch(/Último gesto: Mandíbula/);
    await t.sample(100, 512, 25);
    await t.sample(100, 505, 30);
    expect(t.browDowns()).toBe(1);
    expect(tv.view.status).toBe('Gestos activos: levanta la ceja para elegir. Suéltala antes del siguiente clic.');

    // Corte breve: recupera sin aviso; corte largo: un solo aviso.
    t.state.age = null;
    await t.timers.shift()?.();
    expect(tv.view.status).toMatch(/Recuperando la señal/);
    expect(t.unavailable.length).toBe(0);
    expect(t.events.at(-1)).toEqual([null, 'cancel']);
    t.state.age = 0;
    t.state.ok = false;
    await t.timers.shift()?.();
    t.state.now += 1500;
    await t.timers.shift()?.();
    expect(tv.view.status).toMatch(/Revisa la conexión/);
    expect(t.unavailable.length).toBe(1);
    expect(t.delays.at(-1)).toBe(500);
    t.state.ok = true;
    await t.sample(100, 505, 25);
    await t.sample(100, 505, 30);
    expect(t.state.recovered).toBe(1);
    expect(t.browDowns()).toBe(1);

    // Otra conexión del sensor invalida la calibración.
    tv.toggle();
    await t.timers.shift()?.();
    t.state.source = 'reopened';
    tv.toggle();
    await t.flush();
    expect(tv.view.status).toMatch(/Cambió la conexión del sensor/);
    expect(tv.view.saved).toBe(false);
    expect(t.storage.has(MYOWARE_PROFILE_KEY)).toBe(false);
  });

  it('pausa con la página oculta y no repite un gesto sostenido al volver', async () => {
    const t = setup();
    t.storage.set(
      MYOWARE_PROFILE_KEY,
      JSON.stringify({
        source: 'uno',
        profile: {
          brow: { direction: -1, trigger: 508, release: 511 },
          jaw: { direction: 1, trigger: 120, release: 105 },
        },
      }),
    );
    const tv = t.make(true);
    tv.enable();
    await t.flush();
    await t.sample();
    await t.sample(100, 512, 25);
    await t.sample(100, 505, 30);
    expect(t.browDowns()).toBe(1);
    t.state.visible = false;
    tv.pause();
    expect(tv.view.status).toMatch(/En pausa/);
    t.queue(100, 504, 50);
    await t.timers.shift()?.();
    t.state.visible = true;
    tv.restore();
    await t.flush();
    await t.sample(100, 504, 30);
    expect(t.browDowns()).toBe(1);
    await t.sample(100, 512, 25);
    await t.sample(100, 504, 30);
    expect(t.browDowns()).toBe(2);
  });
});
