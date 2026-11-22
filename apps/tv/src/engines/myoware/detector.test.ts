// Mismos casos que tests/test_myoware_click.cjs (calibración, prioridad de mandíbula y cursor).
import { describe, expect, it } from 'vitest';
import {
  createCalibration,
  createGestureCursor,
  createGestureDetector,
  type Edge,
  fitGestureProfile,
  type Gesture,
  validMyoWareProfile,
} from './detector';

const trials = (a0: number, a3: number) =>
  Array.from({ length: 5 }, () => Array.from({ length: 40 }, () => [a0, a3] as [number, number]));
const profile = {
  brow: { direction: -1 as const, trigger: 508, release: 511 },
  jaw: { direction: 1 as const, trigger: 120, release: 105 },
};

describe('calibración MyoWare', () => {
  it('acepta solapamiento en A3 pero exige evidencia propia de mandíbula en A0', () => {
    const rest = Array.from({ length: 50 }, (_, i) => [100 + (i % 3), 511 + (i % 3)] as [number, number]);
    expect(fitGestureProfile(rest, trials(105, 505), trials(135, 502))).toEqual(profile);
    expect(fitGestureProfile(rest, trials(105, 505), trials(104, 502))).toBeNull();
    expect(fitGestureProfile(rest, trials(105, 510), trials(135, 502))).toBeNull();
    expect(
      fitGestureProfile(rest, [...trials(105, 505).slice(0, 2), ...trials(105, 512).slice(0, 3)], trials(135, 502)),
    ).toBeNull();
    expect(fitGestureProfile([...rest, [100, 504]], trials(105, 505), trials(135, 502))).toEqual(profile);
  });

  it('la calibración guiada revisa los diez intentos y rechaza una mandíbula fuera de la ventana', () => {
    function run(jawDelay: number, { bipolar = false, misses = 0, noisyRest = false } = {}) {
      const calibration = createCalibration();
      let time = 0;
      let result: ReturnType<typeof calibration.sample>;
      const feed = (duration: number, a0: number | ((t: number) => number) = 100, a3 = 512) => {
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
          expect(calibration.message()).toMatch(new RegExp(`${label} ${attempt} de 5.*espera`));
          feed(1500);
          expect(calibration.message()).toMatch(/ahora/);
          if (label === 'Mandíbula') feed(jawDelay, 100, 504);
          const jaw = bipolar ? (t: number) => (t % 20 === 0 ? 106 : 94) : 140;
          const missed = label === 'Ceja' && attempt <= misses;
          feed(600, label === 'Ceja' ? 100 : jaw, missed ? 512 : 504);
          feed(1400 - (label === 'Mandíbula' ? jawDelay : 0));
        }
      }
      return result!;
    }
    expect(run(140)).toEqual({
      profile: {
        brow: { direction: -1, trigger: 508, release: 512 },
        jaw: { direction: 1, trigger: 120, release: 100 },
      },
      summary: 'Ceja: 5/5. Mandíbula: 5/5.',
    });
    expect(run(220).profile).toBeNull();
    expect(run(100, { bipolar: true }).profile?.jaw.center).toBe(100);
    expect(run(220, { bipolar: true }).profile).toBeNull();
    expect(run(140, { misses: 2 }).summary).toBe('Ceja: 3/5. Mandíbula: 5/5.');
    expect(run(140, { misses: 3 }).profile).toBeNull();
    expect(run(140, { noisyRest: true }).profile).toBeNull();
  });
});

describe('detector MyoWare', () => {
  it('la mandíbula gana si llega junto o tarde, y ningún gesto se repite antes de soltar', () => {
    const detect = createGestureDetector(profile);
    let time = 0;
    const feed = (a0: number, a3: number, count: number) => {
      const events: Gesture[] = [];
      for (let i = 0; i < count; i++, time += 10) {
        const event = detect(time, a0, a3);
        if (event) events.push(event);
      }
      return events;
    };
    expect(feed(100, 504, 50)).toEqual([]);
    expect(feed(100, 512, 20)).toEqual([]);
    expect(feed(100, 504, 4)).toEqual([]);
    expect(feed(100, 512, 20)).toEqual([]);
    expect(feed(100, 504, 14)).toEqual([]);
    expect(feed(140, 504, 30)).toEqual(['jaw']);
    expect(feed(100, 504, 40)).toEqual([]);
    expect(feed(140, 512, 40)).toEqual([]);
    expect(feed(100, 512, 20)).toEqual([]);
    expect(feed(100, 504, 40)).toEqual(['brow']);
    expect(feed(100, 512, 20)).toEqual([]);
    expect(feed(140, 504, 40)).toEqual(['jaw']);
    expect(feed(100, 512, 20)).toEqual([]);
    expect(feed(140, 512, 40)).toEqual(['jaw']);
  });

  it('la mandíbula sale en su borde original y una ceja limpia confirma en el mismo cuadro', () => {
    const events: [Gesture, Edge, number][] = [];
    let time = 0;
    const detect = createGestureDetector(profile, (...edge) => events.push(edge));
    const feed = (duration: number, a0 = 100, a3 = 512) => {
      for (let elapsed = 0; elapsed < duration; elapsed += 10) {
        time += 10;
        detect(time, a0, a3);
      }
    };
    feed(300);
    feed(180, 100, 504);
    expect(events).toEqual([['brow', 'down', 480]]);
    feed(250);
    const started = time;
    feed(110, 145, 504);
    expect(events.at(-1)?.[0]).not.toBe('jaw');
    feed(10, 145, 504);
    expect(events.at(-1)).toEqual(['jaw', 'down', started + 120]);
    feed(750, 145, 504);
    expect(events.filter(([name, edge]) => name === 'jaw' && edge === 'down').length).toBe(1);
    expect(events.filter(([name, edge]) => name === 'brow' && edge === 'down').length).toBe(1);
  });

  it('el cursor salta la historia, consume cada cuadro una vez y rechaza flujos rotos', () => {
    const packet = {
      source: 'uno',
      sequence: 2,
      age: 5,
      frames: [
        [100, 100, 512],
        [110, 100, 510],
      ] as [number, number, number][],
    };
    const read = createGestureCursor('uno');
    expect(read(packet, 10)).toEqual([]);
    const next = { ...packet, sequence: 3, frames: [...packet.frames, [120, 100, 505] as [number, number, number]] };
    expect(read(next, 10)).toEqual([[120, 100, 505]]);
    expect(read(next, 10)).toEqual([]);
    expect(read(next, 260)).toBeNull();
    expect(read({ ...next, age: null }, 10)).toBeNull();
    expect(read({ ...next, source: 'reopened' }, 10)).toBeNull();
    expect(read({ ...next, sequence: 4, frames: [[300, 100, 505]] }, 10)).toBeNull();
    expect(read({ ...next, sequence: 6, frames: [[130, 100, 505]] }, 10)).toBeNull();
    expect(
      read({ ...next, sequence: 4, frames: [[130, 100, null as unknown as number]] as [number, number, number][] }, 10),
    ).toBeNull();
  });

  it('valida el perfil guardado', () => {
    expect(validMyoWareProfile({ source: 'uno', profile })).toBe(true);
    expect(validMyoWareProfile({ source: '', profile })).toBe(false);
    expect(validMyoWareProfile({ source: 'uno', profile: { ...profile, jaw: { ...profile.jaw, trigger: 100 } } })).toBe(
      false,
    );
    expect(validMyoWareProfile('invalid')).toBe(false);
  });
});
