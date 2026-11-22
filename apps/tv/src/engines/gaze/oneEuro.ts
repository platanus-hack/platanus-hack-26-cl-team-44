/**
 * Filtro One Euro (Casiez et al., CHI 2012): suaviza mucho cuando la mirada está quieta
 * y casi nada cuando se mueve rápido. Port de software/eye-tracking/web/js/one-euro.js.
 */

const alpha = (cutoff: number, dt: number) => {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
};

export interface OneEuroOptions {
  minCutoff?: number;
  beta?: number;
  dCutoff?: number;
}

/** Devuelve un filtro (valor, tiempo en segundos) → valor suavizado. */
export function createOneEuro({ minCutoff = 1.0, beta = 0.01, dCutoff = 1.0 }: OneEuroOptions = {}) {
  let prev: { t: number; x: number; dx: number } | null = null;
  return (value: number, t: number): number => {
    if (!Number.isFinite(value)) return prev ? prev.x : value;
    if (prev !== null && t === prev.t) return prev.x; // cuadro duplicado: no reinicia el filtro
    if (prev === null || t < prev.t) {
      prev = { t, x: value, dx: 0 };
      return value;
    }
    const dt = Math.min(t - prev.t, 0.25); // tras una pausa larga no salta
    const dxRaw = (value - prev.x) / dt;
    const dx = prev.dx + alpha(dCutoff, dt) * (dxRaw - prev.dx);
    const cutoff = minCutoff + beta * Math.abs(dx);
    const x = prev.x + alpha(cutoff, dt) * (value - prev.x);
    prev = { t, x, dx };
    return x;
  };
}

/** Par de filtros para un punto 2D. */
export function createOneEuro2D(opts?: OneEuroOptions) {
  const fx = createOneEuro(opts);
  const fy = createOneEuro(opts);
  return (p: { x: number; y: number }, t: number) => ({ x: fx(p.x, t), y: fy(p.y, t) });
}
