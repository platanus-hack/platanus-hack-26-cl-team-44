/** Estadística robusta para limpiar muestras de calibración. */

/** @param {number[]} xs */
export function median(xs) {
  if (xs.length === 0) return Number.NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * Mediana por componente tras descartar puntos a > k·MAD de la mediana.
 * @param {number[][]} vecs
 * @param {number} k
 */
export function robustAggregate(vecs, k = 3) {
  const dims = vecs[0].length;
  const med = Array.from({ length: dims }, (_, d) => median(vecs.map((v) => v[d])));
  const mad = Array.from({ length: dims }, (_, d) => median(vecs.map((v) => Math.abs(v[d] - med[d]))) || 1e-9);
  const kept = vecs.filter((v) => v.every((x, d) => Math.abs(x - med[d]) <= k * 1.4826 * mad[d]));
  const src = kept.length >= Math.max(3, vecs.length * 0.3) ? kept : vecs;
  return Array.from({ length: dims }, (_, d) => median(src.map((v) => v[d])));
}

/** Mediana de una distribución de Rayleigh (distancia 2D de una gaussiana isótropa) = 1,1774·σ. */
const RAYLEIGH_MEDIAN = 1.1774;

/**
 * Índices de las muestras que NO son atípicas respecto de la mediana 2D.
 * La distancia 2D sigue una Rayleigh, no una normal: estimamos σ = mediana(dist)/1,1774 y
 * cortamos a k·σ (k=3,5 ⇒ ~0,2 % de muestras buenas rechazadas). Antes se usaba 4,45·mediana
 * (≈3,8σ), demasiado laxo para atrapar una mirada que llegó tarde al punto.
 * @param {{x:number,y:number}[]} pts
 */
export function inlierMask(pts, k = 3.5) {
  const mx = median(pts.map((p) => p.x));
  const my = median(pts.map((p) => p.y));
  const dist = pts.map((p) => Math.hypot(p.x - mx, p.y - my));
  const sigma = median(dist) / RAYLEIGH_MEDIAN || 1e-9;
  return dist.map((d) => d <= k * sigma + 1e-12);
}
