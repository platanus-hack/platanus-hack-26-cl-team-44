/**
 * Ajuste de calibración en un hilo aparte: fitBest prueba ~72 candidatos con validación
 * cruzada y puede tardar ~1 s con muchas muestras. En el hilo principal congelaría el
 * cursor y falsearía la telemetría (cortes de señal inexistentes).
 */
import { fitBest } from "./model.js";

self.onmessage = (event) => {
  const { id, samples, opts } = event.data;
  try {
    const t0 = performance.now();
    const result = fitBest(samples, opts);
    self.postMessage({ id, ok: true, result, ms: Math.round(performance.now() - t0) });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err?.message ?? err) });
  }
};
