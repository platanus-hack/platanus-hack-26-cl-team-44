/**
 * Toki OS · puntero con la mirada usando el iPhone (Face ID) como sensor.
 *
 * El iPhone corre la app Eye Tracking (software/eye-tracking/ios) y envía la geometría de los ojos
 * por WebSocket (:8788). Este módulo usa el MISMO motor que la demo (./eye-engine es un enlace a
 * ../eye-tracking/web/js): misma calibración, mismo modelo, mismo filtro.
 *
 * Diferencia deliberada con la demo: SIN movimiento de cabeza. La calibración se hace solo con la
 * cabeza quieta y el modelo se ajusta con headCorrection:false y solo el plano lineal, la opción
 * más estable con datos reales (2,9° de media y 5,3° en el peor caso, en 24 calibraciones).
 *
 * Integración con el OS (woki-os.html): escribe en WOKI.mouse como los otros punteros; si se
 * pierde la cara o la señal 1,5 s activa el escaneo con EMG (setGazeLost), igual que la nariz.
 */
import { createConnection, toSocketUrl } from "./eye-engine/connection.js";
import { createSimulator } from "./eye-engine/simulator.js";
import { collectSequence, evaluateValidation, TRAIN_POINTS, VALIDATION_POINTS } from "./eye-engine/calibration.js";
import { fitBestAsync } from "./eye-engine/fitter.js";
import { predict } from "./eye-engine/model.js";
import { createOneEuro2D } from "./eye-engine/one-euro.js";
import { addPreset, fromFile, listPresets, migrateSaved, toFile } from "./iphone-presets.js";

const STORE_KEY = "woki.iphone.v1";
// Contrato del OS: sin movimiento de cabeza (headCorrection:false) y solo el modelo plano LINEAL.
// Con 24 calibraciones reales, la media fue igual que con el cuadrático (2,9°), pero el peor caso
// bajó de 10,9° a 5,3°: el lineal no puede "curvarse" y desfasarse en los bordes.
const FIT_OPTS = Object.freeze({ headCorrection: false, kinds: ["planeLinear"] });
const SMOOTHING = Object.freeze({ minCutoff: 0.9, beta: 0.006 }); // nivel "Medio" de la demo
const LOST_MS = 1500; // sin cara o sin señal → escaneo con EMG (mismo criterio que la nariz)
const BACK_MS = 1500; // la cara debe volver estable antes de aceptar clics
const CONNECT_TIMEOUT_MS = 6000;
const FACE_WAIT_MS = 3000;
// Error de validación en fracción del ANCHO (mismos niveles que la mirada por webcam del OS)
const LEVEL_GREEN = 0.08;
const LEVEL_AMBER = 0.14;

const W = window.WOKI;
const $ = (s) => document.querySelector(s);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* ---------- bus de cuadros (la calibración de la demo se suscribe aquí) ---------- */
const listeners = new Set();
const hub = { subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); } };

function readStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || null; } catch { return null; }
}
function writeStore(data) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch { /* sin almacenamiento: no es crítico */ }
}

const IPHONE = {
  source: null, host: null, latest: null, lastFrameAt: 0, pointAt: null,
  model: null, viewport: null, filter: null,
  active: false, calibrating: false, abort: null, prevMode: null,
  lastFaceAt: 0, backSince: null,

  label() { return "iPhone"; },
  hasSaved() { const s = readStore(); return Boolean(s && s.model && s.host); },

  /* ---------- conexión ---------- */
  connect(input) {
    this.disconnect();
    const host = String(input || "").trim();
    const isSim = host === "sim";
    if (!isSim && !toSocketUrl(host)) return Promise.reject(new Error("Dirección inválida. Ejemplo: 192.168.1.23:8788"));
    this.host = host;
    return new Promise((resolve, reject) => {
      let settled = false;
      const settle = (fn, arg) => { if (!settled) { settled = true; clearTimeout(timer); fn(arg); } };
      const timer = setTimeout(() => {
        this.disconnect();
        settle(reject, new Error(`El iPhone no responde en ${host}. ¿Eye Tracking está abierta, desbloqueada y en la misma red?`));
      }, CONNECT_TIMEOUT_MS);
      const onFrame = (f) => { this.onFrame(f); settle(resolve); };
      if (isSim) {
        this.source = createSimulator({ onFrame });
        this.source.start();
        return;
      }
      this.source = createConnection({
        onFrame,
        onStatus: ({ state, detail }) => {
          if (state === "error") settle(reject, new Error(detail || "No se pudo conectar"));
          if (state === "reconnecting" && settled) log(`iPhone: se cortó la señal · ${detail ?? ""}`);
        },
      });
      if (!this.source.connect(host)) settle(reject, new Error("Dirección inválida. Ejemplo: 192.168.1.23:8788"));
    });
  },
  disconnect() {
    this.source?.close?.();
    this.source?.stop?.();
    this.source = null;
    this.latest = null;
  },

  /** Espera a ver la cara (máx. FACE_WAIT_MS). Devuelve el último cuadro con cara o null. */
  async waitForFace() {
    const t0 = performance.now();
    while (performance.now() - t0 < FACE_WAIT_MS) {
      if (this.latest?.tracked) return this.latest;
      await sleep(100);
    }
    return null;
  },

  /* ---------- cada cuadro del iPhone ---------- */
  onFrame(f) {
    this.latest = f;
    this.lastFrameAt = performance.now();
    this.pointAt = null;
    for (const cb of listeners) cb(f);
    if (!this.active || !this.model) return;
    const now = this.lastFrameAt;
    if (!f.tracked) {
      this.backSince = null;
      if (now - this.lastFaceAt > LOST_MS && !W.S.gazeLost) setGazeLost(true);
      return;
    }
    this.lastFaceAt = now;
    if (W.S.gazeLost) {
      this.backSince ??= now;
      if (now - this.backSince < BACK_MS) return;
      setGazeLost(false);
      this.backSince = null;
    }
    const p = predict(this.model, f);
    if (!p) return; // parpadeo: el puntero se queda donde estaba
    this.pointAt = now;
    const g = this.filter(p, f.t);
    W.mouse.x = clamp(g.x, 0, innerWidth);
    W.mouse.y = clamp(g.y, 0, innerHeight);
  },

  /* ---------- activar / desactivar el puntero ---------- */
  activate() {
    if (!this.model || !this.source) return;
    if (window.NOSE?.on || window.NOSE?.starting) NOSE.stop();
    this.active = true;
    // Clic manteniendo la mirada (dwell, como en la demo): el anillo se llena y se elige. No hace
    // falta ceja ni EMG. Se restaura el modo anterior al cambiar de puntero.
    if (this.prevMode === null) this.prevMode = W.CFG.mode;
    // Por defecto "dwell". En Ajustes › Confirmar con se puede pasar a "Ceja" (window.iphoneConfirm, se recuerda).
    W.CFG.mode = window.iphoneConfirm?.() === "click" ? "click" : "dwell";
    // Modo mirada con iPhone: mantener la mirada O ceja (al instante); mandíbula y escaneo como siempre;
    // imán, huecos y relleno de progreso en las tarjetas (ver gazeOnly() en woki-os.html y layout.css).
    document.body.classList.add("gaze-only");
    if (W.S.screen === "agent") sendBtn(false);
    this.filter = createOneEuro2D(SMOOTHING);
    this.lastFaceAt = performance.now();
    try { localStorage.setItem("woki.ptr", "iphone"); } catch { /* no crítico */ }
    const moved = this.viewport && (this.viewport.w !== innerWidth || this.viewport.h !== innerHeight);
    if (moved) island("↺", "Cambió el tamaño de la pantalla: recalibra el iPhone (Ajustes › Calibrar)", true, 4000);
    else island("📱", `Mirada con iPhone · mantén la mirada ${(W.CFG.dwellMs / 1000).toLocaleString("es")} s para elegir`);
    log("puntero: mirada con iPhone");
    renderStatus();
    if (W.S.screen === "settings") renderSettings();
  },
  deactivate() {
    if (!this.active && !this.source) return;
    this.active = false;
    if (this.prevMode !== null) { W.CFG.mode = this.prevMode; this.prevMode = null; }
    document.body.classList.remove("gaze-only");
    renderStatus();
    if (W.S.screen === "agent") sendBtn(false);
    if (W.S.gazeLost) setGazeLost(false);
    this.disconnect(); // sin Mac conectado el iPhone baja a 30 fps y se calienta menos
    if (W.S.screen === "settings") renderSettings();
  },

  /* ---------- calibración (misma secuencia que la demo, sin fase de movimiento) ---------- */
  async calibrate() {
    if (this.calibrating) return null;
    this.calibrating = true;
    this.active = false; // durante la calibración el puntero no se mueve
    const ui = overlay();
    this.abort = new AbortController();
    try {
      try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.(); } catch { /* el navegador puede negarlo */ }
      await sleep(450); // deja que la ventana termine de cambiar de tamaño
      ui.root.hidden = false;
      const viewport = { w: innerWidth, h: innerHeight };
      ui.msg.innerHTML = "<b>Sigue el punto con los ojos</b><span>Deja la cabeza quieta y cómoda. Son 13 puntos.</span>";
      const train = await collectSequence({ ui, hub, points: TRAIN_POINTS, idOffset: 0, label: "Punto", signal: this.abort.signal, showIntro: true });
      const firstPromise = fitBestAsync(train.samples, FIT_OPTS); // corre en otro hilo mientras se comprueba
      firstPromise.catch(() => {});
      ui.msg.innerHTML = "<b>Ahora 5 puntos para comprobar</b><span>En lugares que el modelo aún no vio.</span>";
      const valid = await collectSequence({ ui, hub, points: VALIDATION_POINTS, idOffset: 100, label: "Comprobación", signal: this.abort.signal, showIntro: true });
      ui.progress.textContent = "Calculando…";
      const first = await firstPromise;
      const validation = evaluateValidation(first.model, valid.samples); // error honesto: puntos no vistos
      // Sin datos suficientes en la comprobación el error es NaN: NO se acepta una calibración sin medir.
      if (!Number.isFinite(validation.meanPx)) {
        throw new Error("No pude medir la precisión: faltaron datos de tus ojos en los puntos de comprobación. Revisa que el iPhone te vea bien y repite.");
      }
      const fixed = { kind: first.model.kind, source: first.model.source, lambda: first.model.lambda };
      const final = await fitBestAsync([...train.samples, ...valid.samples], { ...FIT_OPTS, fixed }).catch(() => first);
      if (final.model.head || final.model.kind === "head3d") throw new Error("modelo con movimiento de cabeza: no permitido en Toki OS");
      this.model = final.model;
      this.viewport = viewport;
      writeStore({ host: this.host, model: this.model, viewport, at: new Date().toISOString() });
      const pct = validation.meanPx / viewport.w;
      log(`calibración iPhone: modelo ${final.model.kind}/${final.model.source} · error ${(pct * 100).toFixed(1)}% del ancho (${Math.round(validation.meanPx)} px)`);
      return { pct, px: validation.meanPx };
    } finally {
      ui.root.hidden = true;
      this.calibrating = false;
      this.abort = null;
    }
  },

  /* ---------- panel en la tarjeta de inicio ---------- */
  openPanel() {
    const panel = ensurePanel();
    CAL.steps(["Conectar", "Puntos", "Comprobación", "Listo"]);
    CAL.ui("Mirada con iPhone", "Abre Eye Tracking en el iPhone (Face ID) y escribe la dirección que muestra. Misma red Wi-Fi. Ponlo abajo y centrado, a 40–60 cm de la cara.", 0, false);
    $("#calBtns").style.display = "none";
    panel.hidden = false;
    $("#ipSaved").hidden = !this.hasSaved();
    $("#ipForm").hidden = false;
    $("#ipMainRow").hidden = false;
    $("#ipPresetsView").hidden = true;
    const fromUrl = new URLSearchParams(location.search).get("iphone");
    const input = $("#ipHost");
    input.value = fromUrl || this.host || readStore()?.host || "";
    setStatus("");
    setTimeout(() => input.focus(), 50);
  },
  /** Ventana de presets: elegir uno guardado (repo o navegador), guardar, descargar o cargar. */
  openPresets() {
    ensurePanel();
    CAL.steps(["Presets"]);
    CAL.ui("Presets de calibración", "Elige una calibración guardada. Los presets no cambian al recalibrar; los del repo están en software/toki-os/presets/.", 0, false);
    $("#ipForm").hidden = true;
    $("#ipMainRow").hidden = true;
    $("#ipPresetsView").hidden = false;
    setStatus("");
    renderPresets();
  },

  closePanel() {
    const panel = $("#calIphone");
    if (panel) panel.hidden = true;
    $("#calBtns").style.display = "";
    CAL.open();
  },

  async connectAndCalibrate(host) {
    try {
      setStatus("Conectando…");
      await this.connect(host);
      const face = await this.waitForFace();
      if (!face) throw new Error("Conectado, pero el iPhone no te ve: que su cámara frontal apunte a tu cara.");
      setStatus(`Conectado · te veo a ${Math.round(Math.hypot(...face.headPos) * 100)} cm`, "ok");
      await sleep(900);
      CAL.ui("Calibrando con el iPhone", "Sigue los puntos con los ojos, sin mover la cabeza.", 1, true);
      const res = await this.calibrate();
      if (!res) return;
      const pct = (res.pct * 100).toFixed(1);
      if (res.pct >= LEVEL_AMBER) {
        CAL.ui("La mirada no quedó estable", `Error ${pct}% del ancho. Revisa la luz, que el iPhone esté firme frente a tu cara y repite.`, 2, false);
        setStatus("Puedes repetir la calibración.", "err");
        return;
      }
      CAL.ui(res.pct < LEVEL_GREEN ? "Listo · muy estable" : "Listo · usable", `Error ${pct}% del ancho. Mantén la cabeza cómoda donde calibraste.`, 3);
      await sleep(2200);
      $("#calIphone").hidden = true;
      $("#calBtns").style.display = "";
      CAL.close();
      this.activate();
    } catch (err) {
      const cancelled = err?.name === "AbortError";
      CAL.ui(cancelled ? "Calibración cancelada" : "No pudimos usar el iPhone", cancelled ? "Puedes intentarlo de nuevo." : String(err?.message ?? err), 0, false);
      setStatus(cancelled ? "" : String(err?.message ?? err), cancelled ? "" : "err");
      if (!cancelled) this.disconnect();
    }
  },

  async useSaved() {
    const saved = readStore();
    if (!saved?.model || !saved.host) return false;
    return this.useModel(saved, saved.host);
  },

  /** Usa un preset protegido. La dirección escrita en el panel manda (la IP del iPhone puede cambiar). */
  async usePreset(id) {
    await loadRepoPresets();
    const preset = allPresets().find((p) => p.id === id);
    if (!preset) return false;
    const host = ($("#ipHost")?.value || "").trim() || preset.host;
    const ok = await this.useModel(preset, host);
    if (ok) {
      writeStore({ host, model: preset.model, viewport: preset.viewport, at: new Date().toISOString() });
      log(`calibración iPhone: preset «${preset.name}»`);
    }
    return ok;
  },

  async useModel(saved, host) {
    try {
      setStatus("Conectando…");
      await this.connect(host);
      this.model = saved.model;
      this.viewport = saved.viewport ?? null;
      $("#calIphone") && ($("#calIphone").hidden = true);
      $("#calBtns").style.display = "";
      CAL.close();
      this.activate();
      return true;
    } catch (err) {
      setStatus(String(err?.message ?? err), "err");
      return false;
    }
  },

  /** Recalibrar desde Ajustes sin salir del modo mirada: misma dirección, vuelve solo al terminar. */
  async recalibrate() {
    const host = this.host;
    if (!host) return;
    const wasActive = this.active;
    $("#calib").classList.add("on");
    ensurePanel();
    $("#calBtns").style.display = "none";
    $("#calIphone").hidden = false;
    await this.connectAndCalibrate(host);
    // si la calibración falló o se canceló y había un modelo previo, se vuelve a él (nunca sin puntero)
    if (!this.active && wasActive && this.model) {
      try { if (!this.source) await this.connect(host); } catch { /* sin iPhone: el acompañante decide */ }
      if (!this.source) return;
      $("#calIphone").hidden = true;
      $("#calBtns").style.display = "";
      CAL.close();
      this.activate();
    }
  },

  /** Desde Ajustes › Puntero: con calibración guardada se activa directo; si no, abre el panel. */
  async select() {
    if (this.hasSaved() && (await this.useSaved())) return;
    $("#calib").classList.add("on");
    this.openPanel();
  },
};

/* ---------- UI ---------- */
function overlay() {
  let root = $("#ipCal");
  if (!root) {
    root = document.createElement("div");
    root.id = "ipCal";
    root.className = "ip-cal";
    root.hidden = true;
    root.innerHTML = `
      <div class="target is-hidden" aria-hidden="true"><svg viewBox="0 0 64 64"><circle class="track" cx="32" cy="32" r="28"/><circle class="ip-ring" cx="32" cy="32" r="28"/><circle class="core" cx="32" cy="32" r="7"/></svg></div>
      <div class="ip-msg" role="status"></div>
      <div class="ip-warn" hidden></div>
      <div class="ip-progress"></div>`;
    document.body.append(root);
  }
  return { root, target: root.querySelector(".target"), msg: root.querySelector(".ip-msg"), warn: root.querySelector(".ip-warn"), progress: root.querySelector(".ip-progress") };
}

function ensurePanel() {
  let panel = $("#calIphone");
  if (panel) return panel;
  panel = document.createElement("div");
  panel.id = "calIphone";
  panel.className = "cal-iphone";
  panel.hidden = true;
  panel.innerHTML = `
    <form class="ip-form" id="ipForm" autocomplete="off">
      <input id="ipHost" spellcheck="false" inputmode="url" placeholder="192.168.1.23:8788" aria-label="Dirección del iPhone">
      <button class="cbtn pri" type="submit">Conectar y calibrar</button>
    </form>
    <div class="ip-status" id="ipStatus" role="status"></div>
    <div class="ip-row" id="ipMainRow">
      <button class="cbtn" type="button" id="ipSaved" hidden>Usar la última calibración</button>
      <button class="cbtn" type="button" id="ipPresetsBtn">Presets…</button>
      <button class="cbtn" type="button" id="ipBack">Volver</button>
    </div>
    <div class="ip-presets" id="ipPresetsView" hidden>
      <div class="ip-list" id="ipPresetList"></div>
      <div class="ip-row wrap">
        <button class="cbtn sm" type="button" id="ipSavePreset">Guardar la actual como preset</button>
        <button class="cbtn sm" type="button" id="ipExport">Descargar archivo</button>
        <button class="cbtn sm" type="button" id="ipImportBtn">Cargar archivo</button>
        <input type="file" id="ipImport" accept="application/json,.json" hidden>
      </div>
      <div class="ip-row"><button class="cbtn" type="button" id="ipPresetsClose">Volver</button></div>
    </div>`;
  $("#calBtns").after(panel);
  const input = panel.querySelector("#ipHost");
  // Las teclas del campo no deben llegar a los atajos del OS (E = mirada webcam, Enter = nariz, Espacio = ceja…).
  input.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Escape") IPHONE.closePanel();
  });
  panel.querySelector("#ipForm").addEventListener("submit", (e) => {
    e.preventDefault();
    input.blur();
    IPHONE.connectAndCalibrate(input.value);
  });
  panel.querySelector("#ipSaved").addEventListener("click", (e) => { e.currentTarget.blur(); IPHONE.useSaved(); });
  panel.querySelector("#ipBack").addEventListener("click", (e) => { e.currentTarget.blur(); IPHONE.closePanel(); });
  panel.querySelector("#ipPresetsBtn").addEventListener("click", (e) => { e.currentTarget.blur(); IPHONE.openPresets(); });
  panel.querySelector("#ipPresetsClose").addEventListener("click", (e) => { e.currentTarget.blur(); IPHONE.openPanel(); });
  panel.querySelector("#ipPresetList").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-preset]");
    if (!b) return;
    b.blur();
    IPHONE.usePreset(b.dataset.preset);
  });
  panel.querySelector("#ipSavePreset").addEventListener("click", (e) => { e.currentTarget.blur(); savePresetFromCurrent(); });
  panel.querySelector("#ipExport").addEventListener("click", (e) => { e.currentTarget.blur(); exportPreset(); });
  panel.querySelector("#ipImportBtn").addEventListener("click", (e) => { e.currentTarget.blur(); panel.querySelector("#ipImport").click(); });
  panel.querySelector("#ipImport").addEventListener("change", (e) => importPreset(e.currentTarget));
  return panel;
}

/* ---------- presets (ver iphone-presets.js) ---------- */
const stamp = () => new Date().toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/* Presets del repo: software/toki-os/presets/index.json lista archivos .json (mismo formato que
   "Descargar archivo"). Son de solo lectura y se validan igual que un archivo cargado a mano. */
let repoPresets = null;
async function loadRepoPresets() {
  if (repoPresets) return repoPresets;
  try {
    const res = await fetch("presets/index.json", { cache: "no-store" });
    if (!res.ok) return (repoPresets = []);
    const files = (await res.json())?.presets ?? [];
    const out = [];
    for (const file of files) {
      if (typeof file !== "string" || !/^[\w.-]+\.json$/.test(file)) continue; // solo nombres simples dentro de presets/
      try {
        const r = await fetch(`presets/${file}`, { cache: "no-store" });
        if (r.ok) out.push({ ...fromFile(await r.text()), id: `repo:${file}`, repo: true });
      } catch { /* un archivo inválido no impide cargar los demás */ }
    }
    repoPresets = out;
  } catch { repoPresets = []; }
  return repoPresets;
}
const allPresets = () => [...(repoPresets ?? []), ...listPresets(localStorage)];

async function renderPresets() {
  const list = $("#ipPresetList");
  if (!list) return;
  await loadRepoPresets();
  const presets = allPresets();
  list.replaceChildren(...presets.map((p) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cbtn sm pri";
    b.dataset.preset = p.id;
    b.textContent = `${p.name}${p.repo ? " · repo" : ""}`; // textContent: el nombre viene de un archivo, nunca se interpreta como HTML
    return b;
  }));
  if (!presets.length) {
    const empty = document.createElement("span");
    empty.className = "ip-empty";
    empty.textContent = "Aún no hay presets.";
    list.append(empty);
  }
  $("#ipSavePreset").disabled = !(IPHONE.model || readStore()?.model);
  $("#ipExport").disabled = !(IPHONE.model || readStore()?.model || presets.length);
}

function currentCalibration() {
  if (IPHONE.model) return { host: IPHONE.host, model: IPHONE.model, viewport: IPHONE.viewport };
  return readStore();
}

function savePresetFromCurrent() {
  const cur = currentCalibration();
  if (!cur?.model) return setStatus("No hay una calibración para guardar.", "err");
  try {
    const p = addPreset(localStorage, { name: `Calibración · ${stamp()}`, host: cur.host, model: cur.model, viewport: cur.viewport });
    renderPresets();
    setStatus(`Guardado como preset «${p.name}».`, "ok");
  } catch (err) {
    setStatus(`No se pudo guardar: ${err.message}`, "err");
  }
}

function exportPreset() {
  const cur = currentCalibration();
  const presets = allPresets();
  const preset = cur?.model ? { name: `Calibración · ${stamp()}`, host: cur.host, model: cur.model, viewport: cur.viewport } : presets.at(-1);
  if (!preset) return setStatus("No hay una calibración para descargar.", "err");
  try {
    const url = URL.createObjectURL(new Blob([toFile(preset)], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `toki-calibracion-iphone-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("Archivo descargado. Guárdalo en un lugar seguro.", "ok");
  } catch (err) {
    setStatus(`No se pudo descargar: ${err.message}`, "err");
  }
}

async function importPreset(input) {
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  try {
    if (file.size > 200_000) throw new Error("El archivo es demasiado grande para ser una calibración");
    const p = addPreset(localStorage, fromFile(await file.text()));
    renderPresets();
    setStatus(`Preset «${p.name}» cargado.`, "ok");
  } catch (err) {
    setStatus(err.message, "err");
  }
}

function setStatus(text, kind = "") {
  const el = $("#ipStatus");
  if (!el) return;
  el.textContent = text;
  el.className = `ip-status${kind ? ` ${kind}` : ""}`;
}

// Escape cancela la calibración en curso (antes que cualquier otro atajo).
addEventListener("keydown", (e) => {
  if (IPHONE.calibrating && e.key === "Escape") { e.stopImmediatePropagation(); IPHONE.abort?.abort(); }
}, { capture: true });

// Sin señal del iPhone (Wi-Fi caído, app en segundo plano): mismo tratamiento que perder la cara.
setInterval(() => {
  if (IPHONE.active && performance.now() - IPHONE.lastFrameAt > LOST_MS && !W.S.gazeLost) setGazeLost(true);
}, 500);

// La calibración que ya se usa queda protegida como preset la primera vez que corre esta versión.
try {
  const protectedPreset = migrateSaved(localStorage);
  if (protectedPreset) log(`calibración iPhone protegida como preset «${protectedPreset.name}»`);
} catch { /* sin almacenamiento: no hay nada que proteger */ }

window.IPHONE = IPHONE;
// Para probar sin iPhone: woki-os.html?iphone=sim (la "mirada" es el mouse, a través del motor completo).
if (new URLSearchParams(location.search).has("iphone")) CAL.showBtns?.();
