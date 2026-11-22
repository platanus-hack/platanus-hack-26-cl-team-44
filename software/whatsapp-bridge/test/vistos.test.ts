// Conjunto con vencimiento y tope (seenInbound y usedIdem del puente).
import { test } from "node:test";
import assert from "node:assert/strict";
import { Vistos } from "../vistos.ts";

const HORA = 3_600_000, DIA = 24 * HORA;
const reloj = (t = 0) => { const r = { t, now: () => r.t }; return r; };

test("un reintento dentro de la ventana se reconoce", () => {
  const r = reloj(), v = new Vistos(DIA, 5_000, r.now);
  assert.equal(v.has("msg-1"), false);
  v.add("msg-1");
  r.t += 10 * 60_000;                       // wapi reintenta minutos después
  assert.equal(v.has("msg-1"), true);
  assert.equal(v.has("msg-2"), false);
});

test("cada id vence a las 24 h y sale del conjunto", () => {
  const r = reloj(), v = new Vistos(DIA, 5_000, r.now);
  v.add("a");
  r.t = DIA - 1; assert.equal(v.has("a"), true);
  r.t = DIA;     assert.equal(v.has("a"), false);
  assert.equal(v.size, 0);
});

test("al agregar se limpian los vencidos del inicio", () => {
  const r = reloj(), v = new Vistos(DIA, 5_000, r.now);
  v.add("a"); r.t = 10 * HORA; v.add("b");
  r.t = DIA + HORA; v.add("c");             // "a" venció; "b" todavía no
  assert.equal(v.size, 2);
  assert.equal(v.has("a"), false);
  assert.equal(v.has("b"), true);
});

test("con el tope lleno sale primero el más viejo", () => {
  const r = reloj(), v = new Vistos(DIA, 3, r.now);
  for (const id of ["a", "b", "c", "d"]) { v.add(id); r.t += 1; }
  assert.equal(v.size, 3);
  assert.deepEqual(["a", "b", "c", "d"].map((id) => v.has(id)), [false, true, true, true]);
});

test("volver a agregar un id lo pasa al final de la cola", () => {
  const r = reloj(), v = new Vistos(DIA, 3, r.now);
  for (const id of ["a", "b", "c", "a", "d"]) { v.add(id); r.t += 1; }
  assert.deepEqual(["a", "b", "c", "d"].map((id) => v.has(id)), [true, false, true, true]);
});

test("5.000 entradas como máximo aunque lleguen muchas más", () => {
  const v = new Vistos(DIA, 5_000);
  for (let i = 0; i < 12_000; i++) v.add("m" + i);
  assert.equal(v.size, 5_000);
  assert.equal(v.has("m6999"), false);
  assert.equal(v.has("m7000"), true);
  assert.equal(v.has("m11999"), true);
});
