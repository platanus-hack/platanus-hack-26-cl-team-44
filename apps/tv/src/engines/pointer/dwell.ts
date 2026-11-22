// Permanencia: cuenta el tiempo sobre un objetivo, también al moverse dentro de él.
// Port de software/toki-os/magnetic-pointer.js:2-21. Mismo comportamiento.

export interface PointerDwell {
  /** Devuelve los ms acumulados dentro del objetivo, o -1 si no hay conteo. */
  sample(target: unknown, now: number, inside: boolean): number;
  reset(): void;
}

const GRACE_MS = 160;

export function createPointerDwell(): PointerDwell {
  let target: unknown = null;
  let lastSample = 0;
  let lastInside = 0;
  let wasInside = false;
  let elapsed = 0;
  function reset() {
    target = null;
  }
  function sample(el: unknown, now: number, inside: boolean): number {
    if (!el) {
      reset();
      return -1;
    }
    if (el !== target || now - lastSample > GRACE_MS || now - lastInside > GRACE_MS) {
      if (!inside) {
        reset();
        return -1;
      }
      target = el;
      elapsed = 0;
    } else if (inside && wasInside) {
      elapsed += now - lastSample;
    }
    if (inside) lastInside = now;
    lastSample = now;
    wasInside = inside;
    return elapsed;
  }
  return { sample, reset };
}
