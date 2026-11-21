import { test } from "node:test";
import assert from "node:assert/strict";
import { placementHint, evaluateSetup } from "../js/setup.js";

// Cuadro mínimo: la cara en headPos (espacio de cámara del iPhone horizontal: x a tu derecha, y arriba, -z hacia ti).
const frame = (headPos, extra = {}) => ({
  tracked: true, headPos, headFwd: [0, 0, 1], blinkL: 0.1, blinkR: 0.1, squint: 0.1,
  ambient: 800, thermal: 0, gravity: [-0.65, 0, -0.75], ...extra,
});

test("sin cara: estado 'buscando' con un consejo accionable", () => {
  const h = placementHint(null);
  assert.equal(h.state, "searching");
  assert.match(h.message, /iPhone/);
});

test("cara centrada a 50 cm: bien ubicado", () => {
  const h = placementHint(frame([0.01, 0.01, -0.5]));
  assert.equal(h.state, "ok");
  assert.equal(h.inZone, true);
});

test("cara a tu derecha del iPhone: pide mover el iPhone a tu derecha", () => {
  const h = placementHint(frame([0.12, 0, -0.5])); // ~14°
  assert.equal(h.inZone, false);
  assert.match(h.message, /derecha/);
});

test("cara a tu izquierda del iPhone: pide mover el iPhone a tu izquierda", () => {
  const h = placementHint(frame([-0.12, 0, -0.5]));
  assert.match(h.message, /izquierda/);
});

test("muy cerca o muy lejos se avisa antes que el centrado", () => {
  assert.match(placementHint(frame([0, 0, -0.2])).message, /cerca/);
  assert.match(placementHint(frame([0, 0, -0.9])).message, /lejos|acerca/i);
});

test("la zona del esquema coincide con el check 'iPhone frente a tu cara'", () => {
  // Si el esquema dice "dentro", el check no puede estar en rojo (antes la zona era ±20 cm y el check ±7°).
  for (const x of [-0.15, -0.08, -0.05, 0, 0.05, 0.08, 0.15]) {
    const f = frame([x, 0, -0.5]);
    const centered = evaluateSetup(f, { fps: 60 }, [], null).find((c) => c.id === "centered");
    if (placementHint(f).inZone) assert.equal(centered.status, "ok", `x=${x}`);
  }
});

test("iPhone vertical: se pide ponerlo horizontal (los ejes del esquema asumen horizontal)", () => {
  const checks = evaluateSetup(frame([0, 0, -0.5], { gravity: [0, -0.7, -0.7] }), { fps: 60 }, [], null);
  const o = checks.find((c) => c.id === "orientation");
  assert.equal(o.status, "warn");
  const ok = evaluateSetup(frame([0, 0, -0.5]), { fps: 60 }, [], null).find((c) => c.id === "orientation");
  assert.equal(ok.status, "ok");
});
