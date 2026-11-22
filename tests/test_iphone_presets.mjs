// Presets de calibración del iPhone (Myo OS). Ejecutar desde la raíz: node tests/test_iphone_presets.mjs
import assert from "node:assert/strict";
import { addPreset, fromFile, listPresets, migrateSaved, toFile, validateModel } from "../software/toki-os/iphone-presets.js";

const memStorage = (init = {}) => {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), dump: () => Object.fromEntries(m) };
};
const ridge = (k) => ({ mean: Array(k).fill(0.1), std: Array(k).fill(1), w: Array(k + 1).fill(2) });
const MODEL = { kind: "planeLinear", source: "lookAt", lambda: 0.001, mx: ridge(2), my: ridge(2) };
const SAVED = { host: "172.16.1.29:8788", model: MODEL, viewport: { w: 1512, h: 982 }, at: "2026-11-21T22:00:00.000Z" };

// 1. La calibración guardada se protege UNA vez como preset; recalibrar después no la toca.
{
  const st = memStorage({ "woki.iphone.v1": JSON.stringify(SAVED) });
  const p = migrateSaved(st);
  assert.ok(p, "se crea el preset protegido");
  assert.match(p.name, /^Mi calibración/);
  assert.equal(listPresets(st).length, 1);
  st.setItem("woki.iphone.v1", JSON.stringify({ ...SAVED, at: "2026-11-22T10:00:00.000Z", model: { ...MODEL, lambda: 0.1 } })); // nueva calibración
  assert.equal(migrateSaved(st), null, "la migración no se repite");
  assert.equal(listPresets(st).length, 1);
  assert.equal(listPresets(st)[0].model.lambda, 0.001, "el preset conserva la calibración original");
}

// 2. Calibraciones del simulador no se protegen (no son de una persona).
{
  const st = memStorage({ "woki.iphone.v1": JSON.stringify({ ...SAVED, host: "sim" }) });
  assert.equal(migrateSaved(st), null);
  assert.equal(listPresets(st).length, 0);
}

// 3. Guardar como preset y exportar/importar por archivo (ida y vuelta).
{
  const st = memStorage();
  const p = addPreset(st, { name: "Tarde con luz", host: SAVED.host, model: MODEL, viewport: SAVED.viewport });
  const back = fromFile(toFile(p));
  assert.equal(back.name, "Tarde con luz");
  assert.deepEqual(back.model, validateModel(MODEL));
}

// 4. Un archivo no confiable se valida: ni movimiento de cabeza, ni 3D, ni números inválidos, ni campos extra.
{
  assert.throws(() => validateModel({ ...MODEL, kind: "head3d" }), /tipo/);
  assert.throws(() => validateModel({ ...MODEL, head: { coef: [] } }), /cabeza/);
  assert.throws(() => validateModel({ ...MODEL, mx: { ...MODEL.mx, w: [1, "x", 3] } }), /número/);
  assert.throws(() => validateModel({ ...MODEL, mx: ridge(5) }), /tamaño/);
  assert.throws(() => fromFile("{no es json"), /archivo/);
  const clean = validateModel({ ...MODEL, extra: "<script>" });
  assert.equal(clean.extra, undefined, "los campos desconocidos se descartan");
}

console.log("Presets de calibración: protección única, sin simulador, archivo validado.");
