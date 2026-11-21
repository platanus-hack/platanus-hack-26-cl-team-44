import { test } from "node:test";
import assert from "node:assert/strict";
import { createDoublePress, isStuckKey, isTyping } from "../js/keyguard.js";

test("una tecla sostenida (repeat) fuera de un campo se ignora como atajo", () => {
  assert.equal(isStuckKey({ repeat: true, key: "e", target: { tagName: "BODY" } }), true);
  assert.equal(isStuckKey({ repeat: true, key: "Enter", target: { tagName: "BUTTON" } }), true);
});

test("una pulsación normal sí pasa", () => {
  assert.equal(isStuckKey({ repeat: false, key: "e", target: { tagName: "BODY" } }), false);
});

test("sostener una tecla escribiendo en un campo de texto es normal", () => {
  const e = { repeat: true, key: "Backspace", target: { tagName: "INPUT" } };
  assert.equal(isTyping(e), true);
  assert.equal(isStuckKey(e), false);
});

test("doble pulsación: la primera no confirma, la segunda dentro de la ventana sí", () => {
  let t = 0;
  const dp = createDoublePress(1500, () => t);
  assert.equal(dp.press(), false);
  t = 900;
  assert.equal(dp.press(), true);
});

test("doble pulsación: una segunda pulsación tardía vuelve a empezar", () => {
  let t = 0;
  const dp = createDoublePress(1500, () => t);
  dp.press();
  t = 2000;
  assert.equal(dp.press(), false);
  t = 2500;
  assert.equal(dp.press(), true);
  t = 2600;
  assert.equal(dp.press(), false, "tras confirmar se reinicia");
});
