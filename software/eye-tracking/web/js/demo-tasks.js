/**
 * Modos de medición y mejora con datos REALES de uso (no solo de calibración):
 *
 * - Entrenador con mouse: haces clic donde estás mirando. Cada clic es un dato verdadero
 *   (posición exacta del mouse + lo que veía el iPhone justo antes). Antes de aprender, mide el
 *   error honesto en ese punto; cada 4 clics re-ajusta el modelo con todo (en otro hilo).
 *   Reemplaza la "corrección implícita" anterior, que aprendía de selecciones equivocadas.
 *
 * - Tarea de palabras: pide mirar palabras concretas de la rejilla, en orden aleatorio, y mide
 *   aciertos, errores y tiempo por celda: precisión REAL de uso, no de laboratorio.
 */
import { median } from "./robust.js";
import { isUsable, predict } from "./model.js";

const CLICK_WINDOW_MS = 450; // cuadros justo antes del clic: la vista ya está sobre el punto
const REFIT_EVERY = 4;
const TASK_TRIALS = 10;

export function createTrainer({ getModel, refit, session, onModel }) {
  const recent = []; // { at, frame }
  const samples = [];
  const errors = [];
  let clicks = 0;
  let refitting = false;
  let lastMsg = "";

  return {
    pushFrame(frame) {
      const at = performance.now();
      recent.push({ at, frame });
      while (recent.length && at - recent[0].at > 1000) recent.shift();
    },
    /** @returns {string} mensaje para la persona */
    click(x, y) {
      const now = performance.now();
      const frames = recent.filter((r) => now - r.at <= CLICK_WINDOW_MS && isUsable(r.frame)).map((r) => r.frame);
      if (frames.length < 8) return (lastMsg = "No te vi bien: mira el puntero del mouse y vuelve a hacer clic");
      const preds = frames.map((f) => predict(getModel(), f)).filter(Boolean);
      const err = preds.length ? Math.hypot(median(preds.map((p) => p.x)) - x, median(preds.map((p) => p.y)) - y) : Number.NaN;
      if (Number.isFinite(err)) errors.push(err);
      clicks += 1;
      recent.length = 0; // un cuadro pertenece a un solo clic (con clics rápidos se mezclaban miradas)
      const pointId = 1000 + clicks;
      const added = frames.map((frame) => ({ pointId, target: { x, y }, frame }));
      samples.push(...added);
      session?.addTraining({ x: Math.round(x), y: Math.round(y), errPx: Math.round(err), samples: added });
      if (clicks % REFIT_EVERY === 0 && !refitting) {
        refitting = true;
        refit(samples)
          .then((model) => { onModel(model); session?.event("entrenamiento_reajuste", { clicks }); })
          .catch((e) => session?.event("entrenamiento_error", { error: String(e.message ?? e) }))
          .finally(() => { refitting = false; });
      }
      return (lastMsg = `Clic ${clicks}: error antes de aprender ${Math.round(err)} px${clicks % REFIT_EVERY === 0 ? " · re-ajustando…" : ""}`);
    },
    stats() {
      const last = errors.slice(-10);
      return { clicks, meanLast10: last.length ? last.reduce((a, b) => a + b, 0) / last.length : null, message: lastMsg };
    },
  };
}

export function createTask({ labels, session }) {
  let trials = [];
  let i = 0;
  let startedAt = 0;
  const results = [];

  const pickTrials = () => Array.from({ length: TASK_TRIALS }, () => labels[Math.floor(Math.random() * labels.length)]);

  return {
    start() {
      trials = pickTrials();
      i = 0;
      results.length = 0;
      startedAt = performance.now();
      session?.event("tarea_inicio", { trials });
    },
    /** Tras una pausa: el tiempo en pausa no cuenta para el ensayo actual. */
    resetTimer() { startedAt = performance.now(); },
    get active() { return i < trials.length && trials.length > 0; },
    get current() { return trials[i] ?? null; },
    /** Registra una selección; devuelve true si acertó. */
    select(label) {
      if (!this.active) return false;
      const wanted = trials[i];
      const hit = label === wanted;
      results.push({ trial: i, wanted, got: label, hit, ms: Math.round(performance.now() - startedAt) });
      if (hit) {
        i += 1;
        startedAt = performance.now();
        if (i === trials.length) session?.event("tarea_fin", this.summary());
      }
      return hit;
    },
    summary() {
      const hits = results.filter((r) => r.hit);
      const misses = results.filter((r) => !r.hit);
      const perCell = {};
      for (const r of misses) perCell[r.wanted] = (perCell[r.wanted] ?? 0) + 1;
      return {
        trials: trials.length,
        done: i,
        errores: misses.length,
        // Por ENSAYO terminado (antes contaba etiquetas distintas: dos fallos en ensayos distintos
        // de la misma palabra contaban como uno, y daba negativo con el primer ensayo pendiente).
        aciertoPrimerIntento: i ? Math.round((100 * (i - new Set(misses.filter((m) => m.trial < i).map((m) => m.trial)).size)) / i) : 0,
        msMedio: hits.length ? Math.round(hits.reduce((a, r) => a + r.ms, 0) / hits.length) : null,
        fallosPorCelda: perCell,
      };
    },
  };
}
