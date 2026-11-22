// Estado de la alarma de emergencia en disco (alarma.ts). Datos falsos en una carpeta temporal.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EstadoAlarma, estadoLlamada, INICIADA_MAX_MS, type Llamada } from "../alarma.ts";

const MIN = 60_000;
function carpeta(t: any) { const d = mkdtempSync(join(tmpdir(), "myo-alarma-")); t.after(() => rmSync(d, { recursive: true, force: true })); return join(d, "emergencia.json"); }
const llamada = (nombre: string, conversationId: string): Llamada =>
  ({ nombre, numero: "+56900000000", conversationId, error: "", contestoAt: 0, confirmo: null });

test("sin archivo empieza vacío y deja llamar", (t) => {
  const s = new EstadoAlarma(carpeta(t), MIN);
  assert.equal(s.ultima.at, 0);
  assert.equal(s.revisar("a1"), "ok");
  assert.equal(s.buscar("conv-1"), null);
});

test("la alarma sobrevive a una recarga desde el disco (archivo 0600, sin temporal)", (t) => {
  const f = carpeta(t);
  const s = new EstadoAlarma(f, MIN);
  const a = s.iniciar("a1", "10:00", "la casa", 1_000);
  a.llamadas = [llamada("Ana", "conv-ana"), { ...llamada("Beto", ""), error: "no se pudo llamar" }];
  a.llamadas[0].contestoAt = 2_000; a.llamadas[0].confirmo = true;
  s.guardar();
  assert.equal(statSync(f).mode & 0o777, 0o600);
  assert.equal(existsSync(f + ".tmp"), false);

  const r = new EstadoAlarma(f, MIN);
  assert.deepEqual(r.ultima, s.ultima);
  assert.equal(r.buscar("conv-ana")?.llamada.confirmo, true);
  assert.equal(r.buscar(""), null);                       // la llamada fallida (sin conversationId) no se encuentra con ""
  assert.equal(r.revisar("a1", 1_500), "repetida");
});

test("se guarda al iniciar, antes de marcar: un reinicio a mitad de la llamada respeta el cooldown", (t) => {
  const f = carpeta(t);
  new EstadoAlarma(f, MIN).iniciar("a1", "10:00", "la casa", 1_000);
  const r = new EstadoAlarma(f, MIN);
  assert.equal(r.revisar("a1", 2_000), "repetida");
  assert.equal(r.revisar("a2", 2_000), "espera");
});

test("cooldown e idempotencia por alarmId", (t) => {
  const s = new EstadoAlarma(carpeta(t), MIN);
  s.iniciar("a1", "10:00", "la casa", 1_000);
  assert.equal(s.revisar("a1", 1_000 + MIN - 1), "repetida");
  assert.equal(s.revisar("a2", 1_000 + MIN - 1), "espera");
  assert.equal(s.revisar("a2", 1_000 + MIN), "ok");
  assert.equal(s.revisar("a1", 1_000 + 10 * MIN), "repetida");   // la misma alarma nunca llama dos veces
});

test("guarda las anteriores (con tope) y las encuentra por conversationId", (t) => {
  const f = carpeta(t);
  const s = new EstadoAlarma(f, MIN, 3);
  for (let i = 1; i <= 5; i++) s.iniciar("a" + i, "10:0" + i, "la casa", i * 2 * MIN).llamadas = [llamada("Ana", "conv-" + i)];
  s.guardar();
  const r = new EstadoAlarma(f, MIN, 3);
  assert.equal(r.ultima.alarmId, "a5");
  assert.deepEqual(r.anteriores.map((a) => a.alarmId), ["a4", "a3", "a2"]);
  assert.equal(r.buscar("conv-5")?.alarma.alarmId, "a5");
  assert.equal(r.buscar("conv-2")?.alarma.alarmId, "a2");
  assert.equal(r.buscar("conv-1"), null);                 // salió del historial
});

test("un archivo dañado no rompe el puente ni se imprime", (t) => {
  const f = carpeta(t);
  writeFileSync(f, '{"ultima": {"alarmId": "dato-privado-+56911112222"');
  const warn = t.mock.method(console, "warn", () => {});
  const s = new EstadoAlarma(f, MIN);
  assert.equal(s.ultima.at, 0);
  assert.equal(s.revisar("a1"), "ok");
  assert.equal(warn.mock.callCount(), 1);
  assert.doesNotMatch(String(warn.mock.calls[0].arguments[0]), /privado|5691111/);
});

test("campos con tipos raros se normalizan al cargar", (t) => {
  const f = carpeta(t);
  writeFileSync(f, JSON.stringify({ ultima: { at: "ayer", alarmId: 7, llamadas: [null, { nombre: "Ana", conversationId: "c1", confirmo: "si" }] }, anteriores: "x" }));
  const s = new EstadoAlarma(f, MIN);
  assert.equal(s.ultima.at, 0);
  assert.equal(s.ultima.alarmId, "");
  assert.deepEqual(s.ultima.llamadas, [{ nombre: "Ana", numero: "", conversationId: "c1", error: "", contestoAt: 0, confirmo: null }]);
  assert.deepEqual(s.anteriores, []);
});

test("si no se puede guardar, sigue sin lanzar error", (t) => {
  const err = t.mock.method(console, "error", () => {});
  const s = new EstadoAlarma(join(tmpdir(), "no-existe-" + process.pid, "x", "emergencia.json"), MIN);
  assert.doesNotThrow(() => s.iniciar("a1", "10:00", "la casa"));
  assert.equal(s.revisar("a1"), "repetida");              // en memoria sigue valiendo
  assert.equal(err.mock.callCount(), 1);
});

test("regla de los 75 s: 'initiated' pasa a 'failed'", () => {
  const at = 1_000_000;
  assert.equal(estadoLlamada("initiated", at, at + INICIADA_MAX_MS), "initiated");
  assert.equal(estadoLlamada("initiated", at, at + INICIADA_MAX_MS + 1), "failed");
  assert.equal(estadoLlamada("in-progress", at, at + 10 * INICIADA_MAX_MS), "in-progress");
  assert.equal(estadoLlamada("done", at, at + 10 * INICIADA_MAX_MS), "done");
  assert.equal(INICIADA_MAX_MS, 75_000);
});
