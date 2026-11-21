/**
 * fitBest asíncrono: usa un Web Worker de módulo si está disponible; si no, corre en el
 * hilo principal (mismo resultado, solo bloquea más).
 */
import { fitBest } from "./model.js";

let worker = null;
let nextId = 1;
const pending = new Map();

function getWorker() {
  if (worker !== null) return worker;
  try {
    worker = new Worker(new URL("./fit-worker.js", import.meta.url), { type: "module" });
    worker.onmessage = ({ data }) => {
      const p = pending.get(data.id);
      if (!p) return;
      pending.delete(data.id);
      if (data.ok) p.resolve(data.result);
      else p.reject(new Error(data.error));
    };
    worker.onerror = (e) => {
      // Si el worker muere, rechazamos lo pendiente y caemos al hilo principal en adelante.
      for (const p of pending.values()) p.reject(new Error(e.message || "El worker de calibración falló"));
      pending.clear();
      worker = false;
    };
  } catch {
    worker = false;
  }
  return worker;
}

/**
 * @param {{pointId:number, target:{x:number,y:number}, frame:object}[]} samples
 * @returns {Promise<ReturnType<typeof fitBest>>}
 */
export function fitBestAsync(samples, opts = {}) {
  const w = getWorker();
  if (!w) return Promise.resolve().then(() => fitBest(samples, opts));
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, samples, opts });
  }).catch(() => fitBest(samples, opts)); // último recurso: mismo cálculo en el hilo principal
}
