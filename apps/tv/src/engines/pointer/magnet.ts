// Imán tipo burbuja: atrae al borde al acercarse y al centro después de entrar.
// La coordenada del sensor sigue mandando para la permanencia y para cambiar de vecino.
// Port de software/toki-os/magnetic-pointer.js:25-95. Mismo comportamiento.

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface RectLike {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface TargetLike {
  getBoundingClientRect(): RectLike;
}

/** Lo mínimo del documento que usa el imán. En las pruebas se reemplaza por un doble. */
export interface HitTester<T extends TargetLike> {
  elementFromPoint(x: number, y: number): { closest(selector: string): T | null } | null;
  querySelectorAll(selector: string): Iterable<T>;
}

export interface AimOptions {
  magnetic?: boolean;
  gazeBounds?: Bounds;
}

export interface Aim<T> extends Point {
  target: T | null;
  inside: boolean;
}

export interface MagneticPointer<T> {
  aim(raw: Point, now: number, eligible: (el: T | null) => boolean, options?: AimOptions): Aim<T>;
  reset(): void;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function extendEdge(value: number, start: number, size: number): number {
  const fraction = (value - start) / size;
  if (fraction < 0 || fraction > 1) return value;
  const shift = Math.abs(0.5 - fraction);
  const outer = Math.max(0, (shift - 0.26) / 0.24);
  return start + clamp(fraction + Math.sign(fraction - 0.5) * 0.1 * outer ** 1.35, 0, 1) * size;
}

interface Approach extends Point {
  distance: number;
  from: Point;
}

function nearest(point: Point, rect: RectLike): Approach {
  const x = clamp(point.x, rect.left, rect.right);
  const y = clamp(point.y, rect.top, rect.bottom);
  return { x, y, distance: Math.hypot(x - point.x, y - point.y), from: point };
}

export function createMagneticPointer<T extends TargetLike>(
  selector: string,
  doc: HitTester<T> = document as unknown as HitTester<T>,
): MagneticPointer<T> {
  const hit = (x: number, y: number): T | null => doc.elementFromPoint(x, y)?.closest(selector) ?? null;
  let previous: T | null = null;
  function reset() {
    previous = null;
  }
  function aim(raw: Point, _now: number, eligible: (el: T | null) => boolean, options: AimOptions = {}): Aim<T> {
    const { magnetic = true, gazeBounds } = options;
    let p = raw;
    let direct = hit(raw.x, raw.y);
    if (!magnetic) {
      reset();
      const target = eligible(direct) ? direct : null;
      return { ...raw, target, inside: !!target };
    }
    const gaze = !!gazeBounds && gazeBounds.width > 0 && gazeBounds.height > 0;
    const reach = gaze && gazeBounds ? clamp(0.08 * Math.min(gazeBounds.width, gazeBounds.height), 32, 68) : 24;
    // Nunca roba un acierto directo. Un punto de webcam que se queda corto del borde gana un poco
    // de recorrido; el centro de la pantalla no cambia.
    if (
      gaze &&
      gazeBounds &&
      !direct &&
      raw.x >= gazeBounds.left &&
      raw.x < gazeBounds.left + gazeBounds.width &&
      raw.y >= gazeBounds.top &&
      raw.y < gazeBounds.top + gazeBounds.height
    ) {
      p = {
        x: Math.min(gazeBounds.left + gazeBounds.width - 1, extendEdge(raw.x, gazeBounds.left, gazeBounds.width)),
        y: Math.min(gazeBounds.top + gazeBounds.height - 1, extendEdge(raw.y, gazeBounds.top, gazeBounds.height)),
      };
      direct = hit(p.x, p.y);
    }
    let target = eligible(direct) ? direct : null;
    let edge: Approach | undefined;
    if (!direct) {
      let best = reach;
      for (const el of doc.querySelectorAll(selector)) {
        if (!eligible(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        let approach = nearest(p, r);
        if (p !== raw) {
          const original = nearest(raw, r);
          if (original.distance < approach.distance) approach = original;
        }
        const { x, y, distance } = approach;
        const score = distance - (el === previous ? 4 : 0);
        if (distance >= reach || score >= best) continue;
        if (hit(clamp(x, r.left + 1, r.right - 1), clamp(y, r.top + 1, r.bottom - 1)) !== el) continue;
        best = score;
        target = el;
        edge = approach;
      }
    }
    previous = target;
    if (!target) return { ...p, target: null, inside: false };
    if (edge) {
      const pull = 0.85 * (1 - edge.distance / reach);
      const from = edge.from;
      return { x: from.x + (edge.x - from.x) * pull, y: from.y + (edge.y - from.y) * pull, target, inside: false };
    }
    const r = target.getBoundingClientRect();
    const dx = r.left + r.width / 2 - p.x;
    const dy = r.top + r.height / 2 - p.y;
    const strength = Math.min(gaze ? 0.72 : 0.48, (gaze ? 100 : 58) / (Math.hypot(dx, dy) || 1));
    return { x: p.x + dx * strength, y: p.y + dy * strength, target, inside: true };
  }
  return { aim, reset };
}
