/**
 * Presets de calibración del iPhone: calibraciones que NO se sobrescriben al recalibrar.
 *
 * - "woki.iphone.v1" es la última calibración (cambia cada vez que se calibra).
 * - "woki.iphone.presets.v1" son los presets: solo cambian con una acción explícita
 *   (guardar como preset o cargar un archivo). Ninguna calibración los toca.
 * - La primera vez que corre esta versión, la calibración guardada se protege sola como
 *   "Mi calibración · fecha" (así la calibración que ya se usa no se pierde al recalibrar).
 *
 * Funciones puras sobre un `storage` con getItem/setItem (localStorage o un doble en tests).
 */
const SAVED_KEY = "woki.iphone.v1";
const PRESETS_KEY = "woki.iphone.presets.v1";
const MIGRATED_KEY = "woki.iphone.presets.migrated";
const FILE_KIND = "toki-calibracion-iphone";

const KINDS = Object.freeze({ planeLinear: 2, plane: 5 }); // columnas de la regresión por tipo
const SOURCES = Object.freeze(["lookAt", "eyes", "hybrid", "binocular"]);

const readJSON = (storage, key, fallback) => {
  try { return JSON.parse(storage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const fmtDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("es", { day: "numeric", month: "short" });
};

function numbers(arr, n, what) {
  if (!Array.isArray(arr) || arr.length !== n) throw new Error(`${what}: tamaño inválido`);
  if (!arr.every((v) => typeof v === "number" && Number.isFinite(v))) throw new Error(`${what}: debe ser número`);
  return arr.slice();
}

/** Valida un modelo de un archivo o almacenamiento no confiable; devuelve una copia limpia. */
export function validateModel(m) {
  if (!m || typeof m !== "object") throw new Error("modelo vacío");
  if (m.head || m.residual) throw new Error("modelo con corrección de cabeza o de zonas: no permitido");
  const k = KINDS[m.kind];
  if (!k) throw new Error(`tipo de modelo no permitido: ${m.kind}`);
  if (!SOURCES.includes(m.source)) throw new Error(`fuente desconocida: ${m.source}`);
  const ridge = (r, name) => ({ mean: numbers(r?.mean, k, `${name}.mean`), std: numbers(r?.std, k, `${name}.std`), w: numbers(r?.w, k + 1, `${name}.w`) });
  const lambda = typeof m.lambda === "number" && Number.isFinite(m.lambda) ? m.lambda : null;
  return { kind: m.kind, source: m.source, lambda, mx: ridge(m.mx, "mx"), my: ridge(m.my, "my") };
}

function cleanPreset(p) {
  const name = String(p?.name ?? "").trim().slice(0, 60) || "Preset";
  const host = typeof p?.host === "string" ? p.host.slice(0, 120) : "";
  const vp = p?.viewport;
  const viewport = vp && Number.isFinite(vp.w) && Number.isFinite(vp.h) ? { w: vp.w, h: vp.h } : null;
  const at = typeof p?.at === "string" ? p.at : new Date().toISOString();
  return { id: typeof p?.id === "string" ? p.id : `p${Date.now().toString(36)}`, name, host, viewport, at, model: validateModel(p?.model) };
}

/** Presets guardados (los inválidos se ignoran). */
export function listPresets(storage) {
  return readJSON(storage, PRESETS_KEY, []).flatMap((p) => { try { return [cleanPreset(p)]; } catch { return []; } });
}

/** Agrega un preset (acción explícita). Devuelve el preset limpio. */
export function addPreset(storage, preset) {
  const p = cleanPreset({ ...preset, id: undefined });
  storage.setItem(PRESETS_KEY, JSON.stringify([...listPresets(storage), p]));
  return p;
}

/**
 * Protege UNA vez la calibración guardada como preset. Devuelve el preset creado o null
 * (ya migrado, nada guardado, calibración del simulador o datos inválidos).
 */
export function migrateSaved(storage) {
  if (storage.getItem(MIGRATED_KEY)) return null;
  storage.setItem(MIGRATED_KEY, "1");
  const saved = readJSON(storage, SAVED_KEY, null);
  if (!saved?.model || !saved.host || saved.host === "sim") return null;
  try {
    return addPreset(storage, { ...saved, name: `Mi calibración · ${fmtDate(saved.at)}`.replace(/ · $/, "") });
  } catch {
    return null;
  }
}

/** Contenido del archivo para descargar. */
export function toFile(preset) {
  return JSON.stringify({ kind: FILE_KIND, version: 1, preset: cleanPreset(preset) }, null, 2);
}

/** Lee un archivo descargado antes; lanza un error legible si no sirve. */
export function fromFile(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("El archivo no es una calibración de Toki (JSON inválido)"); }
  if (data?.kind !== FILE_KIND || !data.preset) throw new Error("El archivo no es una calibración de Toki");
  return cleanPreset(data.preset);
}
