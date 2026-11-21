/**
 * Herramientas para encontrar la mejor ubicación del iPhone:
 * - Prueba de estabilidad (3 s mirando un punto) → precisión angular en grados.
 *   Compara posiciones con un número, no a ojo.
 * - Foto de diagnóstico opcional con la webcam del Mac (luz, reflejos en lentes, encuadre),
 *   guardada solo en software/eye-tracking/logs/ para revisión.
 */
import { angularPrecision } from "./telemetry.js";

const STAB_MS = 3000;
const STAB_SKIP_MS = 500; // primer medio segundo: la vista llega al punto

export function rateStability(deg) {
  if (!Number.isFinite(deg)) return { key: "bad", text: "Sin datos: el iPhone no te vio bien" };
  if (deg < 0.5) return { key: "ok", text: "Excelente" };
  if (deg < 1) return { key: "ok", text: "Bien" };
  if (deg < 1.8) return { key: "warn", text: "Regular: acerca el iPhone o mejora la luz" };
  return { key: "bad", text: "Inestable: revisa reflejos, distancia y ángulo" };
}

/**
 * Corre la prueba de estabilidad en pantalla completa.
 * @returns {Promise<{precisionDeg:number, usablePct:number, distCm:number|null, n:number}>}
 */
export async function runStabilityTest({ hub, stage, counter }) {
  stage.hidden = false;
  const frames = [];
  const start = performance.now();
  const unsub = hub.subscribe((f) => {
    if (performance.now() - start > STAB_SKIP_MS) frames.push(f);
  });
  try {
    for (let left = Math.ceil(STAB_MS / 1000); left > 0; left--) {
      counter.textContent = String(left);
      await new Promise((r) => setTimeout(r, 1000));
    }
  } finally {
    unsub();
    stage.hidden = true;
  }
  const { precisionDeg, n } = angularPrecision(frames, "eyes");
  const tracked = frames.filter((f) => f.tracked);
  const dist = tracked.length ? tracked.reduce((a, f) => a + Math.hypot(...f.headPos), 0) / tracked.length : null;
  return {
    precisionDeg,
    usablePct: frames.length ? Math.round((100 * n) / frames.length) : 0,
    distCm: dist ? Math.round(dist * 100) : null,
    n,
  };
}

export function renderStabilityList(list, results) {
  const valid = results.filter((r) => Number.isFinite(r.precisionDeg));
  const best = valid.length ? valid.reduce((a, b) => (b.precisionDeg < a.precisionDeg ? b : a)) : null;
  list.replaceChildren(
    ...results.map((r) => {
      const li = document.createElement("li");
      if (r === best && valid.length > 1) li.className = "best";
      const name = document.createElement("span");
      name.textContent = `${r === best && valid.length > 1 ? "★ " : ""}${r.placement ?? "sin etiqueta"} · ${r.distCm ?? "—"} cm`;
      const val = document.createElement("span");
      val.textContent = `${Number.isFinite(r.precisionDeg) ? r.precisionDeg.toFixed(2) + "°" : "—"} · ${rateStability(r.precisionDeg).text}`;
      li.append(name, val);
      return li;
    })
  );
}

/** Toma una foto con la webcam del Mac y la guarda en el servidor local. */
export async function takeDiagnosticPhoto(sessionId) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("Este navegador no permite usar la cámara");
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
  try {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    await video.play();
    await new Promise((r) => setTimeout(r, 600)); // deja que la exposición se ajuste
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const res = await fetch("/api/snapshot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, dataUrl }) });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
    return json.file;
  } finally {
    stream.getTracks().forEach((t) => t.stop());
  }
}
