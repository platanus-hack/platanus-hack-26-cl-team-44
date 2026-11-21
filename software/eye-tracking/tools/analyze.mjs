#!/usr/bin/env node
/**
 * Analiza un log de sesión de eye-demo y propone mejoras.
 *   node software/eye-tracking/tools/analyze.mjs                 → último log en software/eye-tracking/logs
 *   node software/eye-tracking/tools/analyze.mjs ruta/al/log.json
 *
 * Además RE-CALIBRA con el código actual (web/js/model.js) usando los cuadros crudos
 * guardados: así cada cambio al modelo se mide contra datos reales sin repetir la prueba.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { fitBest, isUsable, pxToDegrees } from "../web/js/model.js";
import { evaluateValidation, gazeRangeRatio } from "../web/js/calibration.js";
import { angularPrecision, deserializeSamples } from "../web/js/telemetry.js";
import { median } from "../web/js/robust.js";

const LOGS = resolve(fileURLToPath(new URL(".", import.meta.url)), "..", "logs");
const out = (s = "") => process.stdout.write(`${s}\n`);
const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : "—");
const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : "—");

async function latestLog() {
  const files = (await readdir(LOGS)).filter((f) => f.endsWith(".json"));
  if (!files.length) throw new Error(`No hay logs en ${LOGS}`);
  const withTime = await Promise.all(files.map(async (f) => ({ f, t: (await stat(join(LOGS, f))).mtimeMs })));
  return join(LOGS, withTime.sort((a, b) => b.t - a.t)[0].f);
}

function zone(t, vp) {
  const fx = t.x / vp.w, fy = t.y / vp.h;
  const h = fx < 0.33 ? "izq" : fx > 0.67 ? "der" : "centro";
  const v = fy < 0.33 ? "arriba" : fy > 0.67 ? "abajo" : "medio";
  return `${v}-${h}`;
}

function groupBy(xs, key) {
  const m = new Map();
  for (const x of xs) { const k = key(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); }
  return m;
}

function telemetrySummary(tel) {
  if (!tel.length) return null;
  const fps = tel.map((t) => t.fps);
  const sorted = [...fps].sort((a, b) => a - b);
  return {
    seconds: tel.length,
    fpsAvg: fps.reduce((a, b) => a + b, 0) / fps.length,
    fpsP5: sorted[Math.floor(sorted.length * 0.05)],
    trackedAvg: tel.reduce((a, t) => a + t.trackedPct, 0) / tel.length,
    usableAvg: tel.reduce((a, t) => a + t.usablePct, 0) / tel.length,
    gaps: tel.reduce((a, t) => a + t.gaps, 0),
    blinksPerMin: (tel.reduce((a, t) => a + t.blinks, 0) / tel.length) * 60,
    rttMed: median(tel.map((t) => t.rttMs).filter((x) => x != null)),
    thermalMax: Math.max(...tel.map((t) => t.thermal ?? 0)),
    ambientMed: median(tel.map((t) => t.ambient).filter((x) => x != null && x > 0)),
  };
}

function analyzeCalibration(cal, idx, recs, ppmPhysical) {
  const train = deserializeSamples(cal.train);
  const valid = deserializeSamples(cal.valid);
  const motionValid = deserializeSamples(cal.motionValid ?? []);
  const vp = cal.viewport;
  out(`\n── Calibración ${idx + 1} (${cal.kind}, ubicación: ${cal.placement ?? "sin etiqueta"}) ──`);
  out(`  Registrado: ${cal.finalModel ?? cal.chosen} · CV ${cal.cvErrorPx}px · validación ${cal.validationPx}px (${f2(cal.validationDeg)}°)${cal.motionValidationPx != null ? ` · con movimiento ${cal.motionValidationPx}px (${f2(cal.motionValidationDeg)}°)` : ""} · ${cal.distanceCm} cm`);

  // Re-cálculo con el código actual
  try {
    const res = fitBest(train, { metersPerPx: ppmPhysical ? 1 / ppmPhysical : null });
    const val = evaluateValidation(res.model, valid);
    const mval = motionValid.length ? evaluateValidation(res.model, motionValid) : null;
    const usable = train.filter((s) => isUsable(s.frame)).map((s) => s.frame);
    const dist = median(usable.map((f) => Math.hypot(...f.headPos)));
    const deg = pxToDegrees(val.meanPx, ppmPhysical ?? res.pxPerMeter, dist);
    const range = ppmPhysical ? gazeRangeRatio(train, ppmPhysical, dist) : null; // sin escala física no es confiable
    if (range) {
      out(`  Rango de mirada que ve ARKit: ${Math.round(100 * range.h)}% horizontal · ${Math.round(100 * range.v)}% vertical (100% = fiel)`);
      if (range.h < 0.5 || range.v < 0.5) recs.add(`ARKit comprime tu mirada (${Math.round(100 * Math.min(range.h, range.v))}%): pon el iPhone ABAJO y centrado frente a tu nariz; es la causa principal de imprecisión en los bordes.`);
    }
    const delta = Number.isFinite(cal.validationPx) ? val.meanPx - cal.validationPx : Number.NaN;
    out(`  Código actual: ${res.model.kind}/${res.model.source} · CV ${Math.round(res.cvErrorPx)}px · validación ${Math.round(val.meanPx)}px (${f2(deg)}°)  ${Number.isFinite(delta) ? (delta < 0 ? `✔ mejora ${Math.round(-delta)}px` : `Δ +${Math.round(delta)}px`) : ""}`);
    if (mval) out(`  Con movimiento (código actual): ${Math.round(mval.meanPx)}px (${f2(pxToDegrees(mval.meanPx, ppmPhysical ?? res.pxPerMeter, dist))}°) ${res.model.head ? "· plano + corrección de cabeza" : res.robustToHead ? "· modelo 3D" : "· plano sin corrección (no hubo fase de movimiento)"}`);
    if (!res.robustToHead) recs.add("Sin corrección de cabeza: incluye el paso de movimiento al calibrar si vas a girar la cabeza.");
    out(`  Top candidatos: ${res.candidates.slice(0, 4).map((c) => `${c.name} ${Math.round(c.cvErrorPx)}`).join(" · ")}`);
  } catch (err) {
    out(`  ✖ No se pudo re-calibrar: ${err.message}`);
  }

  // Estabilidad por punto y movimiento de cabeza
  const byPoint = groupBy(train.filter((s) => !s.motion), (s) => s.pointId);
  const prec = [...byPoint.values()].map((g) => ({ t: g[0].target, p: angularPrecision(g.map((s) => s.frame)).precisionDeg, usable: g.filter((s) => isUsable(s.frame)).length, n: g.length }));
  const precMed = median(prec.map((x) => x.p).filter(Number.isFinite));
  out(`  Temblor por punto (RMS angular): mediana ${f2(precMed)}° · peor ${f2(Math.max(...prec.map((x) => x.p).filter(Number.isFinite)))}°`);
  const lowUsable = prec.filter((x) => x.usable < x.n * 0.7);
  if (lowUsable.length) out(`  Puntos con muchos cuadros descartados: ${lowUsable.map((x) => zone(x.t, vp)).join(", ")}`);

  const heads = train.filter((s) => !s.motion && s.frame.tracked).map((s) => s.frame.headPos);
  const hm = [0, 1, 2].map((i) => median(heads.map((h) => h[i])));
  const headRange = Math.max(...heads.map((h) => Math.hypot(h[0] - hm[0], h[1] - hm[1], h[2] - hm[2]))) * 100;
  out(`  Movimiento de cabeza durante la calibración: máx ${f1(headRange)} cm`);

  const stats = cal.pointStats ?? [];
  const fix = stats.map((s) => s.fixationMs).filter((x) => x != null);
  if (fix.length) out(`  Tiempo hasta fijar la mirada: mediana ${Math.round(median(fix))} ms · reintentos ${stats.filter((s) => s.retried).length}`);

  // Errores por zona (validación registrada)
  const pp = (cal.perPoint ?? []).filter((p) => Number.isFinite(p.error)).sort((a, b) => b.error - a.error);
  if (pp.length) out(`  Error por punto de validación: ${pp.map((p) => `${zone(p.target, vp)} ${p.error}px`).join(" · ")}`);

  if (precMed > 1) recs.add("Señal temblorosa (>1°): mejora la luz frontal, evita reflejos en lentes y acerca el iPhone (35–50 cm).");
  if (headRange > 4) recs.add(`La cabeza se movió ${f1(headRange)} cm al calibrar: apoya la cabeza o el codo y vuelve a calibrar.`);
  if (lowUsable.length > 2) recs.add("Muchos cuadros descartados (parpadeo/pérdida): revisa que el iPhone vea ambos ojos sin obstáculos.");
  const edge = pp.filter((p) => /izq|der|arriba|abajo/.test(zone(p.target, vp)));
  const center = pp.filter((p) => zone(p.target, vp) === "medio-centro");
  if (edge.length && center.length && median(edge.map((p) => p.error)) > 2 * median(center.map((p) => p.error))) {
    recs.add("El error se concentra en los bordes: usa Afinar (+8 puntos) o centra el iPhone respecto de la pantalla.");
  }
}

async function main() {
  const file = process.argv[2] ? resolve(process.argv[2]) : await latestLog();
  const log = JSON.parse(await readFile(file, "utf8"));
  const recs = new Set();
  out(`Log: ${file}`);
  out(`Sesión ${log.sessionId} · fuente ${log.source ?? "—"} · ubicación ${log.placement ?? "—"} · pantalla ${log.screen?.w}×${log.screen?.h}@${log.screen?.dpr}x`);

  if (!log.source) { out("  (sesión sin fuente conectada: nada que analizar)"); return; }
  const tel = log.source === "simulador" ? null : telemetrySummary(log.telemetry ?? []); // el simulador no tiene red ni iPhone real
  if (tel) {
    out(`\n── Señal (${tel.seconds} s) ──`);
    out(`  fps media ${f1(tel.fpsAvg)} (p5 ${tel.fpsP5}) · cara ${f1(tel.trackedAvg)}% · útiles ${f1(tel.usableAvg)}% · cortes ${tel.gaps} · parpadeos ${Math.round(tel.blinksPerMin)}/min · RTT ${f1(tel.rttMed)} ms · luz ${Math.round(tel.ambientMed ?? 0)} · térmica máx ${tel.thermalMax}`);
    if (tel.fpsP5 < 45) recs.add("Caídas de fps: Wi-Fi saturado o iPhone caliente. Acerca el Mac al router o usa el iPhone con cable de carga y sin funda.");
    if (tel.trackedAvg < 95) recs.add("La cara se pierde a menudo: el iPhone debe apuntar a tu cara (ángulo < 30°) y a 35–60 cm.");
    if (tel.gaps > tel.seconds / 20) recs.add("Muchos cortes de red: cambia a una banda Wi-Fi de 5 GHz o comparte red por USB.");
    if (tel.thermalMax >= 2) recs.add("El iPhone se calentó: quita la funda, aléjalo del sol y del cargador inalámbrico.");
    if (tel.ambientMed && tel.ambientMed < 400) recs.add("Poca luz en la cara: agrega una lámpara frontal suave.");
  }

  const events = groupBy(log.events ?? [], (e) => e.type);
  if (events.size) out(`\n── Eventos ──\n  ${[...events].map(([k, v]) => `${k}×${v.length}`).join(" · ")}`);
  const lost = events.get("cara_perdida") ?? [];
  if (lost.length) {
    out(`  Pérdidas de cara: ${lost.length}, total ${Math.round(lost.reduce((a, e) => a + e.ms, 0))} ms`);
    for (const e of lost.filter((x) => x.antes)) {
      const a = e.antes;
      const why = a.facing > 30 ? "cabeza girada lejos del iPhone" : Math.abs(a.offV) > 25 || Math.abs(a.offH) > 25 ? "cara saliendo del cuadro" : a.blink > 0.5 ? "ojos cerrados" : "sin causa geométrica visible";
      out(`    ${Math.round(e.ms)} ms · antes: ${a.distCm} cm, desvío ${a.offH}°/${a.offV}°, cabeza→cámara ${a.facing}°, parpadeo ${a.blink} → ${why}`);
    }
  }
  const rescues = events.get("iphone_rescate") ?? [];
  if (rescues.length) out(`  Rescates de detección hechos por el iPhone: ${rescues.length}`);

  if (log.stability?.length) {
    out("\n── Estabilidad por ubicación ──");
    for (const s of [...log.stability].sort((a, b) => a.precisionDeg - b.precisionDeg)) {
      out(`  ${(s.placement ?? "sin etiqueta").padEnd(10)} ${f2(s.precisionDeg)}° · ${s.distCm ?? "—"} cm · útiles ${s.usablePct}%`);
    }
  }

  const disp = log.display?.used ?? (log.display?.widthMm ? log.display : null); // formato nuevo {all, used} o viejo
  const ppmPhysical = disp?.widthMm && Math.abs(disp.widthPt - log.screen?.w) <= 2 ? disp.widthPt / (disp.widthMm / 1000) : null;
  if (!ppmPhysical) out("  (sin tamaño físico de pantalla en el log: grados estimados por el modelo)");
  (log.calibrations ?? []).forEach((c, i) => analyzeCalibration(c, i, recs, ppmPhysical));

  if (log.probes?.length) {
    const px = log.probes.map((p) => p.errPx);
    const deg = log.probes.map((p) => p.deg).filter((x) => x != null);
    out(`\n── Modo Precisión ── n=${px.length} · error medio ${Math.round(px.reduce((a, b) => a + b, 0) / px.length)} px · ${deg.length ? f2(deg.reduce((a, b) => a + b, 0) / deg.length) + "°" : ""}`);
  }

  out("\n── Recomendaciones ──");
  if (!recs.size) out("  Nada crítico detectado. Para más precisión: Afinar, y repetir la prueba de estabilidad en otras ubicaciones.");
  for (const r of recs) out(`  • ${r}`);
}

main().catch((err) => {
  process.stderr.write(`✖ ${err.message}\n`);
  process.exit(1);
});
