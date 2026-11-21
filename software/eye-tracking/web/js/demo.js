/**
 * Demo: cursor de mirada con suavizado, magnetismo, dwell, corrección implícita de deriva
 * y tres modos (Rejilla · Libre · Precisión).
 * El procesamiento ocurre al llegar cada cuadro; el dibujo, en requestAnimationFrame.
 */
import { predict, isUsable, pxToDegrees } from "./model.js";
import { createOneEuro2D } from "./one-euro.js";
import { median } from "./robust.js";
import { createTask, createTrainer } from "./demo-tasks.js";
import { createDoublePress } from "./keyguard.js";

export const SMOOTHING = Object.freeze([
  { name: "Suave", minCutoff: 0.45, beta: 0.003 },
  { name: "Medio", minCutoff: 0.9, beta: 0.006 },
  { name: "Rápido", minCutoff: 1.8, beta: 0.012 },
]);
const GRIDS = Object.freeze([
  { cols: 4, rows: 3, labels: ["Sí", "No", "Agua", "Gracias", "Posición", "Te quiero", "Espera", "Rascar", "Dolor", "Música", "Lucía", "Más"] },
  { cols: 3, rows: 2, labels: ["Sí", "No", "Agua", "Posición", "Te quiero", "Más"] },
]);
const DWELL_MS = 800;
const LOCKOUT_MS = 500;
const MAGNET = 0.35;
const HYSTERESIS = 24;


/**
 * @param {{els:object, hub:object, connStats:()=>object, calibration:object, onRecalibrate:()=>void}} deps
 */
export function createDemo({ els, hub, connStats, calibration, session, onRecalibrate, refit }) {
  let model = calibration.model; // puede cambiar al entrenar con el mouse
  const { pxPerMeter, gravity: calGravity, headMean, viewport: calViewport, distanceM, validationDeg, motionDeg, robustToHead } = calibration;
  // Con el modelo 3D mover la cabeza está bien; solo avisamos si te alejas mucho de donde calibraste.
  // El modelo plano ya es geométricamente robusto a desplazarse; avisamos solo ante cambios grandes.
  const HEAD_WARN_CM = robustToHead ? 15 : 10;
  let mode = "grid";
  let smoothingIdx = 1;
  let filter = createOneEuro2D(SMOOTHING[smoothingIdx]);
  let offset = { x: 0, y: 0 };
  let state = { raw: null, gaze: null, frozen: false, lost: true, frame: null };
  let cells = [];
  let active = null; // { index, since }
  let lockUntil = 0;
  const trail = [];
  let probe = null; // { x, y, shownAt, samples:[] }
  const probeErrors = [];
  let rafId = 0;
  let lostAt = 0;
  let settleUntil = 0;
  let showRaw = false;
  let showDiag = false; // oculto por defecto: no debe tapar la rejilla
  let gridIdx = 0;
  const trainer = createTrainer({
    getModel: () => model,
    refit,
    session,
    onModel: (m) => { model = m; filter = createOneEuro2D(SMOOTHING[smoothingIdx]); },
  });
  let task = null;
  let paused = false; // pausa del reconocimiento: no mueve el cursor, no selecciona, no ensucia el log
  let lastDiagAt = 0;
  const rawWindow = []; // últimas predicciones crudas: mide el temblor de la mirada
  let jitterPx = null;
  const episodes = { phone: false, head: false, viewport: false }; // para registrar cada problema una sola vez

  // ---------- procesamiento por cuadro ----------
  function onFrame(frame) {
    if (paused) { state = { ...state, frame }; return; }
    trainer.pushFrame(frame);
    const raw = predict(model, frame);
    if (!frame.tracked) {
      if (!state.lost) lostAt = performance.now();
      state = { ...state, lost: true, frozen: false, frame };
      return;
    }
    if (state.lost) {
      // Al volver la cara ARKit tarda unos cuadros en asentarse: reiniciamos el filtro y
      // esperamos 300 ms para que el cursor no salte a un punto falso.
      filter = createOneEuro2D(SMOOTHING[smoothingIdx]);
      settleUntil = performance.now() + 300;
      rawWindow.length = 0;
      session?.event("demo_recuperada", { msSinCara: Math.round(performance.now() - lostAt) });
    }
    if (performance.now() < settleUntil) {
      state = { ...state, lost: false, frozen: true, frame };
      return;
    }
    if (!raw) {
      state = { ...state, lost: false, frozen: !isUsable(frame), frame }; // parpadeo: congelar
      return;
    }
    const shifted = { x: raw.x + offset.x, y: raw.y + offset.y };
    const gaze = filter(shifted, frame.t);
    rawWindow.push(shifted);
    if (rawWindow.length > 24) rawWindow.shift();
    if (rawWindow.length === 24) {
      const mx = rawWindow.reduce((a, p) => a + p.x, 0) / 24, my = rawWindow.reduce((a, p) => a + p.y, 0) / 24;
      const rms = Math.sqrt(rawWindow.reduce((a, p) => a + (p.x - mx) ** 2 + (p.y - my) ** 2, 0) / 24);
      if (rms < 120) jitterPx = jitterPx == null ? rms : jitterPx * 0.9 + rms * 0.1; // solo durante fijaciones
    }
    state = { raw: shifted, gaze, frozen: false, lost: false, frame };
    if (mode === "free") {
      trail.push({ ...gaze, at: performance.now() });
      while (trail.length > 90) trail.shift();
    }
    if (mode === "probe" && probe && performance.now() - probe.shownAt > 700) {
      probe.samples.push(gaze);
      if (probe.samples.length >= 36) finishProbe();
    }
  }

  // ---------- rejilla ----------
  function buildGrid() {
    const g = GRIDS[gridIdx];
    els.grid.style.gridTemplateColumns = `repeat(${g.cols}, 1fr)`;
    els.grid.style.gridTemplateRows = `repeat(${g.rows}, 1fr)`;
    els.grid.innerHTML = g.labels.map((l) => `<div class="cell"><span>${l}</span></div>`).join("");
    els.gridSize.textContent = `${g.cols}×${g.rows} `;
    els.gridSize.append(Object.assign(document.createElement("kbd"), { textContent: "N" }));
    measureCells();
  }
  function measureCells() {
    cells = [...els.grid.children].map((el) => ({ el, rect: el.getBoundingClientRect(), label: el.textContent }));
  }
  const inside = (r, p, pad = 0) => p.x >= r.left - pad && p.x <= r.right + pad && p.y >= r.top - pad && p.y <= r.bottom + pad;

  function updateGrid(gaze, now) {
    if (!gaze || now < lockUntil) return gaze;
    let index = active && inside(cells[active.index].rect, gaze, HYSTERESIS) ? active.index : cells.findIndex((c) => inside(c.rect, gaze));
    if (index !== (active?.index ?? -1)) {
      if (active) { cells[active.index].el.classList.remove("is-gaze"); cells[active.index].el.style.setProperty("--p", 0); }
      active = index >= 0 ? { index, since: now } : null;
      if (active) cells[index].el.classList.add("is-gaze");
    }
    if (!active) return gaze;
    const cell = cells[active.index];
    const p = Math.min(1, (now - active.since) / DWELL_MS);
    cell.el.style.setProperty("--p", p.toFixed(3));
    const cx = (cell.rect.left + cell.rect.right) / 2, cy = (cell.rect.top + cell.rect.bottom) / 2;
    if (mode === "train") cell.el.style.setProperty("--p", 0); // entrenando: el clic manda, no el dwell
    else if (p >= 1) select(cell, cx, cy, now);
    return { x: gaze.x + (cx - gaze.x) * MAGNET, y: gaze.y + (cy - gaze.y) * MAGNET };
  }

  function select(cell, cx, cy, now) {
    session?.event("seleccion", { label: cell.label, residuoPx: Math.round(Math.hypot(cx - state.gaze.x, cy - state.gaze.y)), tarea: task?.current ?? null });
    // Ya NO corregimos la deriva asumiendo que la celda elegida era la deseada: cuando la
    // selección era equivocada, aprendía al revés y alejaba el cursor de la tarjeta buscada
    // ("antimán"). Las correcciones ahora vienen solo del entrenamiento con mouse (dato verdadero).
    if (mode === "task" && task?.active) {
      const hit = task.select(cell.label);
      cell.el.classList.add(hit ? "is-picked" : "is-wrong");
      setTimeout(() => cell.el.classList.remove("is-picked", "is-wrong"), 420);
      renderTask();
    } else {
      cell.el.classList.add("is-picked");
      setTimeout(() => cell.el.classList.remove("is-picked"), 420);
    }
    speak(cell.label);
    cell.el.style.setProperty("--p", 0);
    cell.el.classList.remove("is-gaze");
    active = null;
    lockUntil = now + LOCKOUT_MS;
  }

  // ---------- precisión ----------
  function nextProbe() {
    const m = 90;
    probe = { x: m + Math.random() * (innerWidth - 2 * m), y: 120 + Math.random() * (innerHeight - 120 - m), shownAt: performance.now(), samples: [] };
    els.probe.style.transform = `translate(${probe.x}px, ${probe.y}px)`;
  }
  function finishProbe() {
    const mx = median(probe.samples.map((s) => s.x)), my = median(probe.samples.map((s) => s.y));
    const err = Math.hypot(mx - probe.x, my - probe.y);
    probeErrors.push(err);
    session?.addProbe(err, pxToDegrees(err, pxPerMeter, distanceM));
    nextProbe();
  }

  // ---------- dibujo ----------
  function render() {
    const now = performance.now();
    if (paused) {
      els.cursor.hidden = true;
      els.raw.hidden = true;
      renderHud();
      rafId = requestAnimationFrame(render);
      return;
    }
    let shown = state.gaze;
    if (mode === "grid" || mode === "task" || mode === "train") shown = updateGrid(state.gaze, now);
    if (shown) els.cursor.style.transform = `translate(${shown.x}px, ${shown.y}px)`;
    els.cursor.classList.toggle("is-frozen", state.frozen);
    els.cursor.hidden = state.lost || !shown;
    els.raw.hidden = !showRaw || !state.raw;
    if (showRaw && state.raw) els.raw.style.transform = `translate(${state.raw.x}px, ${state.raw.y}px)`;
    if (mode === "free") drawTrail(now);
    renderHud();
    renderBanner();
    if (showDiag && now - lastDiagAt > 250) { lastDiagAt = now; renderDiag(); }
    rafId = requestAnimationFrame(render);
  }

  function drawTrail(now) {
    const c = els.trail, ctx = c.getContext("2d");
    if (c.width !== innerWidth * devicePixelRatio) { c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio; }
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.lineCap = "round";
    for (let i = 1; i < trail.length; i++) {
      const age = (now - trail[i].at) / 1500;
      if (age > 1) continue;
      ctx.strokeStyle = `rgba(50,86,245,${0.5 * (1 - age)})`;
      ctx.lineWidth = 6 * (1 - age) + 1;
      ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke();
    }
  }

  function renderHud() {
    const s = connStats();
    const parts = paused ? ["en pausa"] : [`${s.fps} fps`];
    if (s.rttMs != null) parts.push(`${Math.round(s.rttMs)} ms`);
    if (mode === "probe" && probeErrors.length) {
      const px = probeErrors.reduce((a, b) => a + b, 0) / probeErrors.length;
      const d = pxToDegrees(px, pxPerMeter, distanceM);
      parts.push(`error ${Math.round(px)} px${d ? ` · ${d.toFixed(1)}°` : ""} (n=${probeErrors.length})`);
    } else if (mode === "train") {
      const t = trainer.stats();
      const d = t.meanLast10 != null ? pxToDegrees(t.meanLast10, pxPerMeter, distanceM) : null;
      parts.push(`entrenando: ${t.clicks} clics${t.meanLast10 != null ? ` · error ${Math.round(t.meanLast10)} px${d ? ` (${d.toFixed(1)}°)` : ""}` : " · haz clic donde miras"}`);
    } else if (Math.hypot(offset.x, offset.y) > 4) {
      parts.push(`deriva corregida ${Math.round(Math.hypot(offset.x, offset.y))} px`);
    }
    const text = parts.join(" · ");
    if (els.hudStat.textContent !== text) els.hudStat.textContent = text;
  }

  const PHONE_MOVED_HOLD_MS = 1500;
  let movedSince = null;
  const phoneMovedDeg = () => (state.frame && calGravity ? angleDeg(calGravity, state.frame.gravity) : 0);
  const headMovedCm = () => (state.frame?.tracked && headMean ? Math.hypot(...[0, 1, 2].map((i) => state.frame.headPos[i] - headMean[i])) * 100 : 0);

  function trackEpisode(key, active, detail) {
    if (active && !episodes[key]) session?.event(`demo_${key}`, detail);
    episodes[key] = active;
  }

  function renderBanner() {
    if (performance.now() < trainBannerUntil) return; // mostrando el resultado del último clic
    const s = connStats();
    const f = state.frame;
    // Un golpe o el computador moviéndose da picos de gravedad de un instante; solo cuenta un
    // cambio de ángulo que se MANTIENE (el iPhone quedó en otra posición).
    const rawMoved = phoneMovedDeg();
    const now = performance.now();
    if (rawMoved > 3) movedSince ??= now; else movedSince = null;
    const moved = movedSince != null && now - movedSince > PHONE_MOVED_HOLD_MS ? rawMoved : 0;
    const head = headMovedCm();
    const vpChanged = innerWidth !== calViewport.w || innerHeight !== calViewport.h;
    trackEpisode("iphone_movido", moved > 3, { deg: Math.round(moved * 10) / 10 });
    trackEpisode("cabeza_movida", head > HEAD_WARN_CM, { cm: Math.round(head) });
    trackEpisode("ventana_cambiada", vpChanged, { w: innerWidth, h: innerHeight });
    let msg = "";
    if (s.stale) msg = "Señal del iPhone perdida. ¿Se bloqueó o cambió de red?";
    else if (state.lost) msg = lostAdvice(f);
    else if (moved > 3) msg = "Moviste el iPhone. Si el cursor se desvía, recalibra (R R)";
    else if (vpChanged) msg = "Cambió el tamaño de la ventana. Recalibra (R R)";
    else if (head > HEAD_WARN_CM) msg = `Te moviste ${Math.round(head)} cm desde la calibración: vuelve a tu posición o recalibra (R R)`;
    else if (f && f.thermal >= 2) msg = "El iPhone está caliente: bajó a 30 fps";
    els.banner.hidden = !msg;
    if (msg && els.banner.textContent !== msg) els.banner.textContent = msg;
  }

  // ---------- diagnóstico ----------
  function renderDiag() {
    const s = connStats();
    const live = session?.live() ?? {};
    const f = state.frame;
    const jDeg = jitterPx != null ? pxToDegrees(jitterPx, pxPerMeter, distanceM) : null;
    const probeAvg = probeErrors.length ? probeErrors.reduce((a, b) => a + b, 0) / probeErrors.length : null;
    const probeDeg = probeAvg != null ? pxToDegrees(probeAvg, pxPerMeter, distanceM) : null;
    const rows = [
      ["Cuadros/s", `${s.fps}`, s.fps >= 50 ? "ok" : s.fps >= 30 ? "warn" : "bad"],
      ["Latencia red", s.rttMs != null ? `${Math.round(s.rttMs)} ms` : "—", s.rttMs == null || s.rttMs < 40 ? "ok" : s.rttMs < 100 ? "warn" : "bad"],
      ["Cara detectada", `${live.trackedPct ?? "—"}%`, (live.trackedPct ?? 0) >= 95 ? "ok" : (live.trackedPct ?? 0) >= 80 ? "warn" : "bad"],
      ["Cuadros útiles", `${live.usablePct ?? "—"}%`, (live.usablePct ?? 0) >= 85 ? "ok" : "warn"],
      ["Parpadeos/min", `${live.blinksPerMin ?? "—"}`, "ok"],
      ["Pérdidas de cara", `${live.lostEvents ?? 0}`, (live.lostEvents ?? 0) === 0 ? "ok" : "warn"],
      ["Cortes de señal/min", `${live.gapsPerMin ?? 0}`, (live.gapsPerMin ?? 0) < 3 ? "ok" : "warn"],
      ["Temblor de mirada", jDeg != null ? `${jDeg.toFixed(2)}°` : jitterPx != null ? `${Math.round(jitterPx)} px` : "—", jDeg == null || jDeg < 0.6 ? "ok" : jDeg < 1.2 ? "warn" : "bad"],
      ["Error calibración", validationDeg != null ? `${validationDeg.toFixed(1)}°` : "—", validationDeg == null || validationDeg < 2.5 ? "ok" : "warn"],
      ["Error moviéndote", motionDeg != null ? `${motionDeg.toFixed(1)}°` : "—", motionDeg == null || motionDeg < 3 ? "ok" : "warn"],
      ["Error en vivo (3)", probeDeg != null ? `${probeDeg.toFixed(1)}° · n=${probeErrors.length}` : "usa modo Precisión", "ok"],
      ["Cabeza movida", `${headMovedCm().toFixed(1)} cm`, headMovedCm() < HEAD_WARN_CM / 2 ? "ok" : headMovedCm() < HEAD_WARN_CM ? "warn" : "bad"],
      ["iPhone movido", `${phoneMovedDeg().toFixed(1)}°`, phoneMovedDeg() < 1.5 ? "ok" : phoneMovedDeg() < 3 ? "warn" : "bad"],
      ["Deriva corregida", `${Math.round(Math.hypot(offset.x, offset.y))} px`, "ok"],
      ["Distancia", f?.tracked ? `${Math.round(Math.hypot(...f.headPos) * 100)} cm` : "—", "ok"],
      ["Luz", f ? `${Math.round(f.ambient)}` : "—", !f || f.ambient >= 500 || f.ambient <= 0 ? "ok" : "warn"],
      ["Temperatura iPhone", f ? ["normal", "tibio", "caliente", "crítica"][Math.round(f.thermal)] ?? "—" : "—", !f || f.thermal <= 1 ? "ok" : "bad"],
      ["Modelo", `${model.kind}/${model.source}${model.head ? " + cabeza" : ""}`, "ok"],
    ];
    const html = `<h3>Diagnóstico en vivo</h3><dl>${rows.map(([k, v, c]) => `<dt>${k}</dt><dd class="${c}">${v}</dd>`).join("")}</dl>`;
    if (els.diag.dataset.last !== html) { els.diag.innerHTML = html; els.diag.dataset.last = html; }
  }
  function toggleDiag() {
    showDiag = !showDiag;
    els.diag.hidden = !showDiag;
    els.toggleDiag.setAttribute("aria-pressed", String(showDiag));
  }

  // ---------- controles ----------
  function setMode(next) {
    mode = next;
    els.modeButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
    els.grid.hidden = !["grid", "task", "train"].includes(mode);
    els.root.classList.toggle("training", mode === "train");
    els.task.hidden = mode !== "task";
    if (mode === "task") { task = createTask({ labels: GRIDS[gridIdx].labels, session }); task.start(); renderTask(); }
    els.trail.hidden = mode !== "free";
    els.probe.hidden = mode !== "probe";
    trail.length = 0;
    if (els.grid.hidden === false) measureCells();
    if (mode === "probe") { probeErrors.length = 0; nextProbe(); }
  }
  function cycleSmoothing() {
    smoothingIdx = (smoothingIdx + 1) % SMOOTHING.length;
    filter = createOneEuro2D(SMOOTHING[smoothingIdx]);
    els.smooth.firstChild.textContent = `${SMOOTHING[smoothingIdx].name} `;
  }
  function toggleRaw() {
    showRaw = !showRaw;
    els.toggleRaw.setAttribute("aria-pressed", String(showRaw));
  }

  function setPaused(next) {
    if (next === paused) return;
    paused = next;
    session?.setPaused(paused);
    els.pause.setAttribute("aria-pressed", String(paused));
    els.pause.firstChild.textContent = paused ? "▶ Continuar " : "Ⅱ Pausa ";
    els.root.classList.toggle("is-paused", paused);
    els.pausedNote.hidden = !paused;
    if (active) { cells[active.index].el.classList.remove("is-gaze"); cells[active.index].el.style.setProperty("--p", 0); active = null; }
    if (paused) {
      els.banner.hidden = true;
      return;
    }
    // Al volver: nada de lo anterior a la pausa cuenta (filtro, temblor, dwell, punto de precisión).
    filter = createOneEuro2D(SMOOTHING[smoothingIdx]);
    rawWindow.length = 0;
    settleUntil = performance.now() + 300;
    lockUntil = performance.now() + LOCKOUT_MS;
    state = { ...state, raw: null, gaze: null };
    if (mode === "probe") nextProbe();
    task?.resetTimer?.();
  }
  const togglePause = () => setPaused(!paused);

  const onKey = (e) => {
    if (e.key === " ") {
      e.preventDefault(); // con un botón enfocado, Espacio también lo "clickearía": doble cambio
      togglePause();
      return;
    }
    if (paused && e.key.toLowerCase() !== "r") return; // en pausa solo se puede continuar o recalibrar
    // Fila inferior del teclado: con el iPhone apoyado sobre el teclado es la única visible.
    const k = e.key.toLowerCase();
    if (k === "r") {
      // Recalibrar borra la sesión: un toque accidental (iPhone sobre el teclado) no debe dispararlo.
      if (recalKey.press()) onRecalibrate();
      else flashBanner("Pulsa R otra vez para recalibrar");
    }
    else if (k === "z") setMode("grid");
    else if (k === "x") setMode("free");
    else if (k === "c") setMode("probe");
    else if (k === "v") setMode("train");
    else if (k === "b") setMode("task");
    else if (k === "n") cycleGrid();
    else if (k === "m") toggleDiag();
    else if (k === ",") toggleRaw();
    else if (k === ".") cycleSmoothing();
  };
  function cycleGrid() {
    gridIdx = (gridIdx + 1) % GRIDS.length;
    buildGrid();
    active = null;
    if (mode === "task") setMode("task");
  }
  function renderTask() {
    if (!task) return;
    if (task.active) {
      els.task.textContent = `Mira: ${task.current}`;
      return;
    }
    const s = task.summary();
    els.task.textContent = `Terminado · ${s.errores} errores en ${s.trials} · ${s.msMedio ?? "—"} ms por palabra · 5 para repetir`;
  }
  function flashBanner(text, ms = 2500) {
    els.banner.textContent = text;
    els.banner.hidden = false;
    trainBannerUntil = performance.now() + ms;
  }
  const recalKey = createDoublePress(1500);
  const onTrainClick = (e) => {
    if (paused || mode !== "train" || e.target.closest(".hud")) return;
    flashBanner(trainer.click(e.clientX, e.clientY));
  };
  let trainBannerUntil = 0;
  const clicks = [
    ...els.modeButtons.map((b) => [b, () => setMode(b.dataset.mode)]),
    [els.pause, togglePause], [els.toggleRaw, toggleRaw], [els.smooth, cycleSmoothing], [els.recal, onRecalibrate], [els.toggleDiag, toggleDiag], [els.gridSize, cycleGrid],
  ];

  let unsubscribe = null;
  return {
    start() {
      buildGrid();
      els.smooth.firstChild.textContent = `${SMOOTHING[smoothingIdx].name} `;
      setMode("grid");
      els.diag.hidden = !showDiag;
      els.toggleDiag.setAttribute("aria-pressed", String(showDiag));
      unsubscribe = hub.subscribe(onFrame);
      els.root.addEventListener("click", onTrainClick);
      addEventListener("keydown", onKey);
      addEventListener("resize", measureCells);
      clicks.forEach(([el, fn]) => el.addEventListener("click", fn));
      rafId = requestAnimationFrame(render);
    },
    stop() {
      setPaused(false);
      session?.event("demo_fin", { probes: probeErrors.length, desvioPx: Math.round(Math.hypot(offset.x, offset.y)) });
      unsubscribe?.();
      cancelAnimationFrame(rafId);
      removeEventListener("keydown", onKey);
      removeEventListener("resize", measureCells);
      clicks.forEach(([el, fn]) => el.removeEventListener("click", fn));
      els.root.removeEventListener("click", onTrainClick);
    },
  };
}


/** Mensaje de recuperación: qué hacer para que el iPhone te vuelva a ver. */
function lostAdvice(frame) {
  const secs = frame ? "" : "";
  if (frame && frame.rescues > 0) return `No te veo: mira la pantalla de frente. Estoy reintentando la detección…${secs}`;
  return "No te veo: mira la pantalla de frente, sin bajar la cabeza al teclado";
}

function angleDeg(a, b) {
  const la = Math.hypot(...a), lb = Math.hypot(...b);
  if (la < 1e-6 || lb < 1e-6) return 0;
  const c = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (la * lb);
  return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
}

let voice = null;
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  try {
    voice ??= speechSynthesis.getVoices().find((v) => v.lang.startsWith("es")) ?? null;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang ?? "es-ES";
    if (voice) u.voice = voice;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {
    /* sin voz disponible: la selección visual basta */
  }
}
