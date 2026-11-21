import { test } from "node:test";
import assert from "node:assert/strict";

// createSession usa APIs del navegador: stubs mínimos para correr en Node.
globalThis.screen ??= { width: 1440, height: 900 };
globalThis.devicePixelRatio ??= 2;
globalThis.addEventListener ??= () => {};
globalThis.removeEventListener ??= () => {};
globalThis.fetch = async () => ({ ok: true });

const { createSession } = await import("../js/telemetry.js");

function fakeHub() {
  const subs = new Set();
  return { subscribe: (cb) => (subs.add(cb), () => subs.delete(cb)), emit: (f) => subs.forEach((cb) => cb(f)) };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const face = (tracked) => ({ tracked, blinkL: 0.1, blinkR: 0.1, headPos: [0, 0, -0.5], headFwd: [0, 0, 1], rescues: 0, ambient: 500, thermal: 0 });

test("en pausa, mirar a otro lado (cara perdida) no se registra como falla", async () => {
  const hub = fakeHub();
  const session = createSession({ hub, connStats: () => ({ fps: 60, rttMs: 10 }) });
  session.start();
  let types;
  try {
    hub.emit(face(true));
    session.setPaused(true);
    hub.emit(face(false));
    await sleep(700); // más que el mínimo para contar una pérdida
    hub.emit(face(true));
    session.setPaused(false);
    hub.emit(face(true));
    types = session.snapshot().events.map((e) => e.type);
  } finally {
    session.stop();
  }
  assert.ok(!types.includes("cara_perdida"), `eventos: ${types}`);
  assert.deepEqual(types.filter((t) => t === "pausa" || t === "reanudar"), ["pausa", "reanudar"]);
});

test("sin pausa, la misma pérdida sí se registra (control)", async () => {
  const hub = fakeHub();
  const session = createSession({ hub, connStats: () => ({ fps: 60, rttMs: 10 }) });
  session.start();
  let types;
  try {
    hub.emit(face(true));
    hub.emit(face(false));
    await sleep(700);
    hub.emit(face(true));
    types = session.snapshot().events.map((e) => e.type);
  } finally {
    session.stop();
  }
  assert.ok(types.includes("cara_perdida"), `eventos: ${types}`);
});
