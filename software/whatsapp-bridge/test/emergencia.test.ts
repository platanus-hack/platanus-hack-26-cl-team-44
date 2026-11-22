// Rutas /api/emergencia/* de voz.ts con ElevenLabs simulado: nada sale a la red y los contactos son falsos.
// Cada "puente" es una copia nueva de voz.ts (como un reinicio) que lee el mismo archivo de estado.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";

const XI = "http://elevenlabs.invalid";
Object.assign(process.env, {
  ELEVENLABS_API_KEY: "xi-prueba", ELEVENLABS_BASE_URL: XI, ELEVENLABS_AGENT_ID: "agente-prueba", ELEVENLABS_PHONE_NUMBER_ID: "tel-prueba",
  EMERGENCY_CONTACTS: "Ana:+56900000001,Beto:+56900000002,Caro:+56900000003", WOKI_NOMBRE: "Emmy", WOKI_DIRECCION: "Calle Falsa 123",
});

// ---------- ElevenLabs simulado ----------
type Pedido = { url: string; body: any };
let responder: (p: Pedido) => Response | Promise<Response> = () => { throw new Error("sin respuesta simulada"); };
const pedidos: Pedido[] = [];
globalThis.fetch = (async (url: any, init: any = {}) => {
  const p = { url: String(url), body: typeof init.body === "string" ? JSON.parse(init.body) : undefined };
  if (!p.url.startsWith(XI + "/")) throw new Error("red no permitida en las pruebas: " + p.url);
  pedidos.push(p);
  return responder(p);
}) as typeof fetch;
const resp = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const marcadas = () => pedidos.filter((p) => p.url.endsWith("/v1/convai/twilio/outbound-call"));
const todasOk = (p: Pedido) => resp({ success: true, conversation_id: "conv-" + p.body.to_number.slice(-1) });

// ---------- puente ----------
let copia = 0;
async function puente(file: string) {
  process.env.EMERGENCY_STATE_FILE = file;
  const { handleVoz } = await import(`../voz.ts?copia=${++copia}`);
  return (method: string, path: string, body?: unknown) => new Promise<{ status: number; data: any }>((ok, ko) => {
    const req: any = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))]);
    req.method = method; req.headers = {};
    let status = 0, out = "";
    const res: any = { headersSent: false,
      writeHead(c: number) { status = c; this.headersSent = true; return this; },
      write(x: any) { out += x; return true; },
      end(x?: any) { if (x) out += x; ok({ status, data: out ? JSON.parse(out) : null }); } };
    handleVoz(req, res, new URL(path, "http://127.0.0.1"), "http://localhost:8000").catch(ko);
  });
}
function archivo(t: any) {
  const d = mkdtempSync(join(tmpdir(), "myo-emergencia-"));
  t.after(() => rmSync(d, { recursive: true, force: true }));
  pedidos.length = 0;
  return join(d, "emergencia.json");
}
const leer = (f: string) => JSON.parse(readFileSync(f, "utf8"));

test("llama a todos en paralelo: si unas fallan, las otras siguen y todo queda en disco", async (t) => {
  const f = archivo(t);
  // Las respuestas salen solo cuando llegaron las 3 llamadas: si fueran una tras otra, la prueba se colgaría.
  let soltar!: () => void, fallar!: (e: Error) => void;
  const juntas = new Promise<void>((ok, ko) => { soltar = ok; fallar = ko; }); juntas.catch(() => {});
  const limite = setTimeout(() => fallar(new Error("no fueron en paralelo")), 2_000);
  t.after(() => clearTimeout(limite));
  responder = async (p) => {
    if (marcadas().length === 3) { clearTimeout(limite); soltar(); }
    await juntas;
    const n = p.body.to_number;
    if (n.endsWith("1")) return resp({ success: true, conversation_id: "conv-ana" });
    if (n.endsWith("2")) return resp({ detail: { message: "Twilio rechazó" } }, 500);
    return resp({ success: false, message: "número inválido" });
  };
  const api = await puente(f);
  const r = await api("POST", "/api/emergencia/llamar", { alarmId: "a1", motivo: "prueba" });
  assert.equal(r.status, 200);
  assert.deepEqual(r.data, { ok: true, llamadas: [
    { nombre: "Ana", ok: true }, { nombre: "Beto", ok: false, reason: "Twilio rechazó" }, { nombre: "Caro", ok: false, reason: "número inválido" }] });
  assert.deepEqual(marcadas().map((p) => p.body.to_number), ["+56900000001", "+56900000002", "+56900000003"]);
  assert.equal(marcadas()[0].body.conversation_initiation_client_data.dynamic_variables.direccion, "Calle Falsa 123");

  assert.equal(statSync(f).mode & 0o777, 0o600);
  const s = leer(f);
  assert.equal(s.ultima.alarmId, "a1");
  assert.deepEqual(s.ultima.llamadas.map((l: any) => [l.nombre, l.conversationId, l.error]),
    [["Ana", "conv-ana", ""], ["Beto", "", "Twilio rechazó"], ["Caro", "", "número inválido"]]);
});

test("si fallan todas responde 502", async (t) => {
  const api = await puente(archivo(t));
  responder = () => resp({ detail: "caído" }, 503);
  const r = await api("POST", "/api/emergencia/llamar", { alarmId: "a1" });
  assert.equal(r.status, 502);
  assert.equal(r.data.ok, false);
  assert.equal(r.data.llamadas.length, 3);
});

test("idempotente por alarmId y con cooldown, también después de reiniciar", async (t) => {
  const f = archivo(t);
  responder = todasOk;
  let api = await puente(f);
  assert.equal((await api("POST", "/api/emergencia/llamar", { alarmId: "a1" })).status, 200);
  assert.equal(marcadas().length, 3);
  assert.deepEqual((await api("POST", "/api/emergencia/llamar", { alarmId: "a1" })).data, { ok: true, repetida: true });
  assert.equal((await api("POST", "/api/emergencia/llamar", { alarmId: "a2" })).status, 429);

  api = await puente(f);                                   // reinicio
  assert.deepEqual((await api("POST", "/api/emergencia/llamar", { alarmId: "a1" })).data, { ok: true, repetida: true });
  assert.equal((await api("POST", "/api/emergencia/llamar", { alarmId: "a2" })).status, 429);
  assert.equal(marcadas().length, 3);                      // nadie recibió una segunda llamada

  const s = leer(f); s.ultima.at -= 61_000; writeFileSync(f, JSON.stringify(s));   // pasó el minuto
  api = await puente(f);
  assert.equal((await api("POST", "/api/emergencia/llamar", { alarmId: "a2" })).status, 200);
  assert.equal(marcadas().length, 6);
  assert.deepEqual([leer(f).ultima.alarmId, leer(f).anteriores[0].alarmId], ["a2", "a1"]);
});

test("las herramientas del agente encuentran la llamada por conversationId después de reiniciar", async (t) => {
  const f = archivo(t);
  responder = todasOk;
  let api = await puente(f);
  await api("POST", "/api/emergencia/llamar", { alarmId: "a1" });

  api = await puente(f);
  const p1 = await api("GET", "/api/emergencia/protocolo?conv=conv-1");
  assert.equal(p1.status, 200);
  assert.equal(p1.data.rol, "primero");
  assert.match(p1.data.mensaje, /Emmy activó su alarma.*Calle Falsa 123/);
  assert.ok(leer(f).ultima.llamadas[0].contestoAt > 0);   // quién contestó primero queda en disco
  assert.deepEqual((await api("GET", "/api/emergencia/confirmar?conv=conv-1&viene=si")).data, { ok: true, registrado: "viene" });

  api = await puente(f);
  const p2 = await api("GET", "/api/emergencia/protocolo?conv=conv-2");
  assert.deepEqual([p2.data.rol, p2.data.quien], ["ya_viene", "Ana"]);
  assert.equal((await api("GET", "/api/emergencia/protocolo?conv=otra")).status, 404);
  assert.equal((await api("GET", "/api/emergencia/protocolo")).status, 404);
  assert.equal((await api("GET", "/api/emergencia/confirmar?conv=&viene=si")).status, 404);
});

test("una llamada en 'initiated' por más de 75 s se informa como fallida, también después de reiniciar", async (t) => {
  const f = archivo(t);
  const estado = (at: number) => writeFileSync(f, JSON.stringify({ anteriores: [], ultima: { at, alarmId: "a1", hora: "10:00", direccion: "la casa",
    llamadas: [{ nombre: "Ana", numero: "+56900000001", conversationId: "conv-1", error: "", contestoAt: 0, confirmo: null }] } }));
  responder = (p) => { assert.ok(p.url.endsWith("/v1/convai/conversations/conv-1")); return resp({ status: "initiated" }); };

  estado(Date.now() - 80_000);
  let r = await (await puente(f))("GET", "/api/emergencia/estado");
  assert.equal(r.data.estado, "failed");
  assert.equal(r.data.llamadas[0].estado, "failed");

  estado(Date.now() - 10_000);
  r = await (await puente(f))("GET", "/api/emergencia/estado");
  assert.equal(r.data.estado, "initiated");
  assert.equal(r.data.contacto, "Ana");
});

test("sin alarmas guardadas el estado es 'sin_llamada'", async (t) => {
  const r = await (await puente(archivo(t)))("GET", "/api/emergencia/estado");
  assert.deepEqual(r.data, { ok: true, estado: "sin_llamada" });
});
