// Firma del webhook de wapi: solo HMAC-SHA256 del cuerpo crudo, en hex.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { Readable } from "node:stream";
import { firmaValida, leerCrudo } from "../firma.ts";

const SECRETO = "secreto-de-prueba";
// Igual que el webhook-worker de wapi con webhook_hmac = true: HMAC del cuerpo (texto JSON) en hex.
const hmac = (body: string | Buffer, secreto = SECRETO) => createHmac("sha256", secreto).update(body).digest("hex");
const cuerpo = JSON.stringify({ event: "messages.received", sessionId: 1, timestamp: 1, data: { message: { conversation: "¿Vienes mañana? 👋" } } });

test("acepta el HMAC-SHA256 en hex del cuerpo crudo", () => {
  assert.equal(firmaValida(SECRETO, Buffer.from(cuerpo), hmac(cuerpo)), true);
  assert.equal(firmaValida(SECRETO, cuerpo, hmac(cuerpo)), true);                 // texto o bytes: mismo resultado
  assert.equal(firmaValida(SECRETO, cuerpo, hmac(cuerpo).toUpperCase()), true);   // hex en mayúsculas
});

test("rechaza el secreto en texto plano como firma", () => {
  assert.equal(firmaValida(SECRETO, cuerpo, SECRETO), false);
  const hexSecreto = "ab".repeat(32);                                             // un secreto con forma de HMAC tampoco pasa
  assert.equal(firmaValida(hexSecreto, cuerpo, hexSecreto), false);
});

test("rechaza firma ausente, vacía o repetida en varios headers", () => {
  assert.equal(firmaValida(SECRETO, cuerpo, undefined), false);
  assert.equal(firmaValida(SECRETO, cuerpo, ""), false);
  assert.equal(firmaValida(SECRETO, cuerpo, [hmac(cuerpo), hmac(cuerpo)]), false);
});

test("rechaza firmas mal formadas o de otro cuerpo u otro secreto", () => {
  const ok = hmac(cuerpo);
  for (const mala of [ok.slice(1), ok + "0", "z" + ok.slice(1), `sha256=${ok}`, ok.replace(/./g, "0"),
    hmac(cuerpo + " "), hmac(cuerpo, "otro-secreto"), Buffer.from(ok, "hex").toString("base64")])
    assert.equal(firmaValida(SECRETO, cuerpo, mala), false, `debió rechazar: ${mala}`);
});

test("sin secreto configurado no acepta nada", () => {
  assert.equal(firmaValida("", cuerpo, hmac(cuerpo, "")), false);
});

test("leerCrudo une los bytes: una letra o un emoji partido entre trozos no rompe la firma", async () => {
  const bytes = Buffer.from(cuerpo);
  const corte = bytes.indexOf(Buffer.from("ñ")) + 1;                              // parte la "ñ" (2 bytes) en dos trozos
  const trozos = () => Readable.from([bytes.subarray(0, corte), bytes.subarray(corte)]);
  const crudo = await leerCrudo(trozos() as any);
  assert.deepEqual(crudo, bytes);
  assert.equal(firmaValida(SECRETO, crudo, hmac(cuerpo)), true);
  // Unir como texto (lo que hacía readBody) cambia el cuerpo y la firma ya no coincide.
  let texto = ""; for await (const c of trozos()) texto += c;
  assert.notEqual(texto, cuerpo);
  assert.equal(firmaValida(SECRETO, texto, hmac(cuerpo)), false);
});
