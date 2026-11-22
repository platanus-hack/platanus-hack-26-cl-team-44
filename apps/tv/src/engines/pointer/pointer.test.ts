// Mismos casos que tests/browser/pointer-dwell.test.mjs, sobre el port en TypeScript.
import { describe, expect, it } from 'vitest';
import { createPointerDwell } from './dwell';
import { type Bounds, createMagneticPointer, type HitTester, type RectLike, type TargetLike } from './magnet';

const button = {};

describe('permanencia', () => {
  it('cuenta desde que el puntero entra al objetivo', () => {
    const dwell = createPointerDwell();
    for (let t = 0; t <= 1000; t += 10) expect(dwell.sample(button, t, true)).toBe(t);
  });

  it('el borde magnético no inicia el conteo y salir un instante lo pausa', () => {
    const dwell = createPointerDwell();
    for (let t = 0; t < 2000; t += 20) expect(dwell.sample(button, t, false)).toBe(-1);
    for (let t = 2000; t <= 2900; t += 20) dwell.sample(button, t, true);
    for (let t = 2920; t <= 3020; t += 20) expect(dwell.sample(button, t, false)).toBe(900);
    expect(dwell.sample(button, 3040, true)).toBe(900);
    expect(dwell.sample(button, 3060, true)).toBe(920);
    expect(dwell.sample(button, 3300, false)).toBe(-1);
    expect(dwell.sample(button, 3320, true)).toBe(0);
  });

  it('un cruce, otro objetivo o una muestra vieja no arrastran el tiempo', () => {
    const dwell = createPointerDwell();
    for (let t = 0; t <= 800; t += 20) dwell.sample(button, t, true);
    expect(dwell.sample({}, 820, true)).toBe(0);
    expect(dwell.sample(null, 840, false)).toBe(-1);
    expect(dwell.sample(button, 860, true)).toBe(0);
    expect(dwell.sample(button, 1300, true)).toBe(0);
  });
});

function rectOf([left, top, right, bottom]: number[]): RectLike {
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function fixture(rects: number[][]) {
  const cards: TargetLike[] = rects.map((r) => ({ getBoundingClientRect: () => rectOf(r) }));
  const doc: HitTester<TargetLike> = {
    elementFromPoint: (x, y) => ({
      closest: () =>
        cards.find((card) => {
          const r = card.getBoundingClientRect();
          return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
        }) ?? null,
    }),
    querySelectorAll: () => cards,
  };
  return { cards, magnet: createMagneticPointer('button', doc) };
}

const gazeBounds: Bounds = { left: 0, top: 0, width: 1000, height: 800 };

describe('imán', () => {
  it('atrae hacia adentro y moverse por la tarjeta conserva la permanencia', () => {
    const { cards, magnet } = fixture([[10, 10, 410, 160]]);
    const card = cards[0];
    const dwell = createPointerDwell();
    const approach = magnet.aim({ x: 0, y: 85 }, 0, Boolean);
    expect(approach.x).toBeGreaterThan(0);
    expect(approach.x).toBeLessThan(10);
    expect(dwell.sample(approach.target, 0, approach.inside)).toBe(-1);
    for (let t = 0; t <= 1000; t += 20) {
      const point = { x: t % 40 === 0 ? 30 : 385, y: 85 };
      const aim = magnet.aim(point, t + 50, Boolean);
      expect(aim.target).toBe(card);
      expect(Math.abs(210 - aim.x)).toBeLessThan(Math.abs(210 - point.x));
      expect(dwell.sample(aim.target, t + 50, aim.inside)).toBe(t);
    }
    expect(magnet.aim({ x: 440, y: 85 }, 1100, Boolean).target).toBeNull();
  });

  it('la ganancia de la webcam llega a las cuatro esquinas sin cambiar un acierto directo', () => {
    const { cards, magnet } = fixture([
      [15, 15, 72, 64],
      [928, 15, 985, 64],
      [15, 736, 72, 785],
      [928, 736, 985, 785],
      [80, 80, 120, 120],
    ]);
    const positions = [
      { x: 104, y: 91 },
      { x: 895, y: 91 },
      { x: 105, y: 709 },
      { x: 895, y: 709 },
    ];
    for (const [i, point] of positions.entries()) {
      const eligible = (card: TargetLike | null) => !!card && card !== cards[4];
      const aim = magnet.aim(point, i * 100, eligible, { gazeBounds });
      expect(aim.target).toBe(i === 0 ? null : cards[i]);
      if (i) expect(aim.inside).toBe(true);
    }
    expect(magnet.aim({ x: 78, y: 91 }, 410, Boolean, { gazeBounds }).target).toBe(cards[0]);
    expect(magnet.aim(positions[0], 420, Boolean, { gazeBounds }).target).toBe(cards[4]);
    const disabled = magnet.aim(positions[1], 430, Boolean, { gazeBounds, magnetic: false });
    expect(disabled.target).toBeNull();
    expect(disabled.x).toBe(positions[1].x);
  });

  it('un imán más fuerte de webcam muestra un objetivo cercano sin iniciar su permanencia', () => {
    const { cards, magnet } = fixture([[300, 300, 400, 400]]);
    const approach = magnet.aim({ x: 440, y: 350 }, 0, Boolean, { gazeBounds });
    expect(approach.target).toBe(cards[0]);
    expect(approach.inside).toBe(false);
    expect(createPointerDwell().sample(approach.target, 0, approach.inside)).toBe(-1);
  });

  it('la ganancia del borde no pasa el alcance del imán cerca de una esquina inferior', () => {
    const { cards, magnet } = fixture([[815, 420, 920, 715]]);
    const aim = magnet.aim({ x: 875, y: 726 }, 0, Boolean, { gazeBounds });
    expect(aim.target).toBe(cards[0]);
    expect(aim.inside).toBe(false);
    expect(aim.y).toBeGreaterThan(715);
    expect(aim.y).toBeLessThan(726);
  });
});
