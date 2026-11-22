import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { CAMPOS, PERFILES, estadisticas, idOpaco } from "../../tools/resumen.mjs";

const AQUI = fileURLToPath(new URL(".", import.meta.url));
const SCRIPT = join(AQUI, "..", "..", "tools", "resumen.mjs");
const LOGS = join(AQUI, "fixtures", "logs"); // sintéticos: ver fixtures/generar-logs.mjs
const LOG_IPHONE = "20000101-120000-canar1.json";

const correr = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });

function generar() {
  const dir = mkdtempSync(join(tmpdir(), "resumen-"));
  const r = correr(LOGS, "--salida", dir);
  assert.equal(r.status, 0, r.stderr);
  return { dir, json: JSON.parse(readFileSync(join(dir, "calibraciones.json"), "utf8")), md: readFileSync(join(dir, "calibraciones.md"), "utf8") };
}

function todasLasClaves(x, acc = new Set()) {
  if (Array.isArray(x)) x.forEach((v) => todasLasClaves(v, acc));
  else if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) { acc.add(k); todasLasClaves(v, acc); }
  return acc;
}

// Todo lo que puede aparecer en el resumen. Cualquier otra clave es una fuga.
const PERMITIDAS = new Set([
  ...CAMPOS.raiz, ...CAMPOS.calibracion, ...CAMPOS.puntos, ...CAMPOS.perfil,
  "titulo", "descripcion", "opciones", "headCorrection", "kinds",
  "logs", "excluidas", "simulador", "sinFuente",
  "sesiones", "calibraciones", "conEscalaFisica", "n", "media", "mediana", "p90", "peor",
]);
// Campos del log crudo que nunca deben salir: cuadros, cara, navegador, pantalla, textos libres.
const PROHIBIDAS = ["train", "valid", "motionValid", "f", "le", "ld", "re", "rd", "la", "hp", "hf", "q", "lk", "userAgent", "sessionId", "startedAt",
  "screen", "display", "telemetry", "events", "stability", "probes", "perPoint", "pointStats", "candidates", "placement", "viewport", "distanceCm", "notaNueva"];

test("resumen.mjs resume los logs sintéticos con solo los campos permitidos", () => {
  const { json, md } = generar();
  assert.deepEqual(json.entrada, { logs: 3, excluidas: { simulador: 1, sinFuente: 0 } });
  assert.equal(json.agregado.sesiones, 1);
  assert.equal(json.agregado.calibraciones, 1);
  assert.equal(json.calibraciones.length, 1);

  const [fila] = json.calibraciones;
  assert.deepEqual(Object.keys(fila).sort(), [...CAMPOS.calibracion].sort());
  assert.equal(fila.sesion, idOpaco(LOG_IPHONE));
  assert.match(fila.sesion, /^[0-9a-f]{10}$/);
  assert.equal(fila.fecha, "2000-01-01");
  assert.equal(fila.fuente, "iphone");
  assert.equal(fila.tipo, "inicial");
  assert.equal(fila.escala, "fisica");
  assert.deepEqual(fila.puntos, { entrenamiento: 13, validacion: 5, movimiento: 2 });
  assert.match(fila.so.modelo, /^planeLinear\//);
  assert.ok(fila.so.quietoDeg > 0 && fila.so.quietoDeg < 2, `so quieto ${fila.so.quietoDeg}`);
  assert.equal("movimientoDeg" in fila.so, false, "Myo OS no mide con movimiento");
  assert.ok(fila.demo.quietoDeg > 0 && fila.demo.quietoDeg < 2, `demo quieto ${fila.demo.quietoDeg}`);
  assert.ok(fila.demo.movimientoDeg > 0 && fila.demo.movimientoDeg < 5, `demo movimiento ${fila.demo.movimientoDeg}`);
  assert.equal(json.agregado.so.quietoDeg.media, fila.so.quietoDeg);
  assert.match(md, new RegExp(`\\| ${fila.sesion} \\| 1 \\| 2000-01-01 \\| iphone \\| inicial \\| física \\| 13/5/2 \\|`));
});

test("el resumen no filtra campos ni textos del log crudo", () => {
  const { json, md } = generar();
  const claves = todasLasClaves(json);
  for (const k of claves) assert.ok(PERMITIDAS.has(k), `clave no permitida en el JSON: ${k}`);
  for (const k of PROHIBIDAS) assert.equal(claves.has(k), false, `se filtró ${k}`);
  for (const texto of [JSON.stringify(json), md]) {
    assert.equal(texto.includes("CANARIO"), false, "se copió un texto libre del log");
    assert.equal(texto.includes("canar1"), false, "se copió el nombre del archivo o el id de sesión");
    assert.equal(texto.includes("20000101-12"), false, "se copió la hora de la sesión");
    assert.equal(/T\d{2}:\d{2}/.test(texto), false, "se copió una hora");
  }
});

test("--verificar acepta el resumen generado y da la frase del README", () => {
  const { dir } = generar();
  const r = correr("--verificar", "--salida", dir);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /✔ El agregado coincide/);
  assert.match(r.stdout, /- \*\*Mirada con un iPhone:\*\* \d+,\d° de error medio \(p90: \d+,\d°\) sobre puntos que el modelo no vio, en 1 calibraciones del equipo\./);
});

test("--verificar falla si el .md o el JSON no coinciden, o si el JSON trae campos de más", () => {
  const a = generar();
  writeFileSync(join(a.dir, "calibraciones.md"), a.md.replace("| so | quieto | 1 |", "| so | quieto | 2 |"));
  const r1 = correr("--verificar", "--salida", a.dir);
  assert.equal(r1.status, 1);
  assert.match(r1.stderr, /calibraciones\.md no coincide/);

  const b = generar();
  b.json.calibraciones[0].so.quietoDeg = 9.99;
  writeFileSync(join(b.dir, "calibraciones.json"), JSON.stringify(b.json));
  const r2 = correr("--verificar", "--salida", b.dir);
  assert.equal(r2.status, 1);
  assert.match(r2.stderr, /agregado del JSON no coincide/);

  const c = generar();
  c.json.calibraciones[0].userAgent = "x";
  writeFileSync(join(c.dir, "calibraciones.json"), JSON.stringify(c.json));
  const r3 = correr("--verificar", "--salida", c.dir);
  assert.equal(r3.status, 1);
  assert.match(r3.stderr, /Campo no permitido.*userAgent/);
});

test("--verificar sin resumen explica quién lo genera", () => {
  const r = correr("--verificar", "--salida", mkdtempSync(join(tmpdir(), "resumen-vacio-")));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Lo genera quien tiene los logs/);
});

test("estadisticas: media, mediana, p90 por rango más cercano y peor caso", () => {
  assert.deepEqual(estadisticas([10, 1, 2, 3, 4, 5, 6, 7, 8, 9, null]), { n: 10, media: 5.5, mediana: 5.5, p90: 9, peor: 10 });
  assert.deepEqual(estadisticas([null]), { n: 0, media: null, mediana: null, p90: null, peor: null });
});

test("el perfil so usa las mismas opciones de ajuste que Myo OS", (t) => {
  const os = join(AQUI, "..", "..", "..", "toki-os", "iphone-gaze.js");
  if (!existsSync(os)) return t.skip("sin software/toki-os en este checkout");
  const m = /const FIT_OPTS = Object\.freeze\((\{[^}]*\})\);/.exec(readFileSync(os, "utf8"));
  assert.ok(m, "no encontré FIT_OPTS en iphone-gaze.js");
  const opciones = JSON.parse(m[1].replace(/(\w+):/g, '"$1":'));
  assert.deepEqual(opciones, JSON.parse(JSON.stringify(PERFILES.so.opciones)));
});
