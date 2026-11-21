// Contrato de la integración "Mirada con iPhone" en Toki OS. Ejecutar desde la raíz: node tests/test_os_iphone.mjs
import assert from "node:assert/strict";
import { existsSync, readFileSync, realpathSync } from "node:fs";

const OS = "software/toki-os";
const html = readFileSync(`${OS}/woki-os.html`, "utf8");
const adapter = readFileSync(`${OS}/iphone-gaze.js`, "utf8");

// 1. El OS carga el adaptador y ofrece la opción al inicio.
assert.ok(html.includes('<script type="module" src="iphone-gaze.js"></script>'), "woki-os.html carga iphone-gaze.js");
assert.ok(html.includes('data-c="iphone"'), "botón 'Mirada con iPhone' en la pantalla de inicio");
assert.ok(html.includes("pointerLabel()"), "Ajustes › Puntero incluye el iPhone");
assert.ok(/W\.CFG\.mode = "dwell"/.test(adapter), "con el iPhone se elige manteniendo la mirada (dwell)");
assert.ok(html.includes('id="themeToggle"') && html.includes('id="legendToggle"'), "interruptor de tema y pestaña de atajos");
assert.ok(!/class="ring"/.test(adapter), "el círculo de calibración no usa .ring (el OS la oculta con opacity:0)");

// 2. Motor compartido con la demo (un solo código, no una copia que se desincronice).
assert.equal(realpathSync(`${OS}/eye-engine`), realpathSync("software/eye-tracking/web/js"), "eye-engine apunta al motor de la demo");
for (const m of adapter.matchAll(/from "\.\/(eye-engine\/[\w-]+\.js)"/g)) assert.ok(existsSync(`${OS}/${m[1]}`), `existe ${m[1]}`);

// 3. Sin movimiento de cabeza: ni fase de movimiento ni corrección de cabeza ni modelo 3D.
assert.ok(/FIT_OPTS = Object\.freeze\(\{ headCorrection: false, kinds: \["planeLinear"\] \}\)/.test(adapter), "el ajuste fuerza headCorrection:false y el plano lineal");
assert.ok(!/collectMotion|MOTION_POINTS|head3d:\s*true/.test(adapter), "no hay fase de movimiento ni modelo 3D");

// 4. Con el motor real: aunque lleguen muestras de movimiento, headCorrection:false no aprende nada de la cabeza.
const { fitBest } = await import(`../${OS}/eye-engine/model.js`);
const { exampleScreen, synthFrame } = await import(`../${OS}/eye-engine/synth.js`);
const screen = exampleScreen();
let seed = 3;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const samples = [];
[[0.06, 0.08], [0.5, 0.08], [0.94, 0.08], [0.06, 0.5], [0.5, 0.5], [0.94, 0.5], [0.06, 0.92], [0.5, 0.92], [0.94, 0.92]].forEach(([fx, fy], pointId) => {
  const target = { x: fx * screen.widthPx, y: fy * screen.heightPx };
  for (let k = 0; k < 20; k++) samples.push({ pointId, target, frame: synthFrame({ head: [0, 0.05, -0.5], target, screen, noiseDeg: 0.2, rand }) });
});
[[0.3, 0.3], [0.7, 0.6]].forEach(([fx, fy], i) => {
  const target = { x: fx * screen.widthPx, y: fy * screen.heightPx };
  for (let k = 0; k < 40; k++) samples.push({ pointId: 50 + i, motion: true, target, frame: synthFrame({ head: [0.02 * Math.sin(k), 0.05, -0.5], yaw: 6 * Math.sin(k / 6), target, screen, noiseDeg: 0.2, rand }) });
});
const res = fitBest(samples, { metersPerPx: screen.s, headCorrection: false, kinds: ["planeLinear"] });
assert.equal(res.model.head, undefined, "sin corrección de cabeza");
assert.equal(res.model.kind, "planeLinear", "solo el plano lineal (sin 3D ni cuadrático)");

console.log("iPhone en Toki OS: opción al inicio y en Ajustes, motor compartido, sin movimiento de cabeza.");
