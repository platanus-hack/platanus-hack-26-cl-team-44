// woki-bridge/server.ts
import http from "node:http";
import { readFileSync } from "node:fs";
import { createHmac, timingSafeEqual } from "node:crypto";
import { WapiClient } from "./wapi-sdk/index.ts";

// ---------- configuración ----------
type Mode = "off" | "dry" | "sandbox" | "live";
const MODE = (process.env.WA_MODE ?? "dry") as Mode;
const PORT = Number(process.env.PORT ?? 8787);
const ORIGIN = process.env.ALLOWED_ORIGIN ?? "http://localhost:8000";
const SECRET = process.env.WAPI_WEBHOOK_SECRET ?? "";
const MAX_PER_DAY = 30;
const MIN_GAP_MS = 5_000;
const MAX_LEN = 500;

const needsWapi = MODE === "sandbox" || MODE === "live";
if (needsWapi && !process.env.WAPI_API_KEY) throw new Error("Falta WAPI_API_KEY en .env");
const wapi = needsWapi
  ? new WapiClient({ apiKey: process.env.WAPI_API_KEY!, baseUrl: process.env.WAPI_BASE_URL })
  : null;

// ---------- lista blanca ----------
type Contact = { id: string; name: string; relation: string; phone: string; tone: string; lid?: string };
const profileFile = process.env.PROFILE ?? "profile.json";
const { contacts } = JSON.parse(readFileSync(new URL(profileFile, import.meta.url), "utf8")) as { contacts: Contact[] };
const byId = new Map(contacts.map((c) => [c.id, c]));
const digits = (s: string) => s.replace(/\D/g, "");
const user = (jid?: string) => (jid ?? "").split("@")[0].split(":")[0];

async function resolveLids() {
  if (!wapi) return;
  for (const c of contacts) {
    try { c.lid = user(await wapi.contacts.lid.fromPhone(digits(c.phone))); }
    catch { console.warn(`[lid] sin LID para ${c.id} (no es grave: se reconoce por teléfono)`); }
  }
}

function findSender(key: { remoteJid?: string; remoteJidAlt?: string }) {
  const ids = [key.remoteJid, key.remoteJidAlt].filter(Boolean).map(user);
  return contacts.find((c) => ids.includes(digits(c.phone)) || (c.lid && ids.includes(c.lid)));
}

// ---------- SSE hacia la TV ----------
const tvs = new Set<http.ServerResponse>();
function emit(ev: Record<string, unknown>) {
  const line = `data: ${JSON.stringify(ev)}\n\n`;
  for (const r of tvs) r.write(line);
}

// ---------- límites ----------
const usedIdem = new Set<string>();
const seenInbound = new Set<string>();
let day = new Date().toDateString(), sentToday = 0, lastSendAt = 0;
function quotaOk() {
  const d = new Date().toDateString();
  if (d !== day) { day = d; sentToday = 0; }
  if (sentToday >= MAX_PER_DAY) return "Se alcanzó el tope de mensajes de hoy";
  if (Date.now() - lastSendAt < MIN_GAP_MS) return "Espera unos segundos entre mensajes";
  return null;
}

// Un envío nunca se reintenta: se consulta su estado (0 error · 1 pendiente · 2 enviado · 3 entregado · 4 leído)
function trackStatus(msgId: number, contactId: string) {
  let last = -1, tries = 0;
  const t = setInterval(async () => {
    if (++tries > 20 || !wapi) return clearInterval(t);
    try {
      const info = await wapi.messages.info(msgId);
      const s = Number(info.status);
      if (s !== last) { last = s; emit({ type: "status", msgId, contactId, status: s }); }
      if (s === 0 || s === 4) clearInterval(t);
    } catch { /* se reintenta la consulta, no el envío */ }
  }, 3_000);
}

// ---------- utilidades HTTP ----------
const readBody = (req: http.IncomingMessage) =>
  new Promise<string>((ok, ko) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => ok(b)); req.on("error", ko); });
function json(res: http.ServerResponse, code: number, body: unknown) {
  res.writeHead(code, { "Content-Type": "application/json", "Access-Control-Allow-Origin": ORIGIN });
  res.end(JSON.stringify(body));
}
const safeEqual = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };
const verify = (raw: string, sig?: string) =>
  !!SECRET && !!sig && (safeEqual(sig, SECRET) || safeEqual(sig, createHmac("sha256", SECRET).update(raw).digest("hex")));

// ---------- rutas ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://x");

  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": ORIGIN, "Access-Control-Allow-Methods": "GET,POST", "Access-Control-Allow-Headers": "Content-Type" });
    return res.end();
  }

  // TV → enviar
  if (req.method === "POST" && url.pathname === "/api/wa/send") {
    if (MODE === "off") return json(res, 503, { ok: false, reason: "WhatsApp apagado" });
    const { contactId, text, idemKey } = JSON.parse((await readBody(req)) || "{}");
    const c = byId.get(contactId);
    const body = String(text ?? "").trim();
    if (!c) return json(res, 403, { ok: false, reason: "Contacto fuera de la lista" });
    if (!body || body.length > MAX_LEN) return json(res, 400, { ok: false, reason: "Texto vacío o muy largo" });
    if (!idemKey || usedIdem.has(idemKey)) return json(res, 409, { ok: false, reason: "Este mensaje ya se envió" });
    const q = quotaOk(); if (q) return json(res, 429, { ok: false, reason: q });
    usedIdem.add(idemKey); lastSendAt = Date.now(); sentToday++;

    if (MODE === "dry") {
      console.log(`[dry] → ${c.name}: ${body}`);
      emit({ type: "status", msgId: -1, contactId, status: 2 });
      return json(res, 200, { ok: true, msgId: -1, dry: true });
    }
    try {
      const sent = await wapi!.messages.send({ to: "+" + digits(c.phone), text: body });
      console.log(`[send] ${c.name} msgId=${sent.msgId}`);
      trackStatus(sent.msgId, contactId);
      return json(res, 200, { ok: true, msgId: sent.msgId });
    } catch (e: any) {
      // Un error o timeout NO prueba que no llegó: no se reintenta solo.
      console.error("[send] error", e?.status, e?.message);
      return json(res, 502, { ok: false, reason: "wapi no confirmó el envío. Revisa el celular antes de reintentar" });
    }
  }

  // TV → reaccionar a un mensaje entrante
  if (req.method === "POST" && url.pathname === "/api/wa/react") {
    const { key, emoji } = JSON.parse((await readBody(req)) || "{}");
    if (!findSender(key ?? {})) return json(res, 403, { ok: false, reason: "Contacto fuera de la lista" });
    if (MODE === "dry") return json(res, 200, { ok: true, dry: true });
    try { await wapi!.messages.react(key, emoji); return json(res, 200, { ok: true }); }
    catch (e: any) { return json(res, 502, { ok: false, reason: e?.message }); }
  }

  // TV ← eventos
  if (req.method === "GET" && url.pathname === "/api/wa/events") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "Access-Control-Allow-Origin": ORIGIN });
    res.write(`data: ${JSON.stringify({ type: "hello", mode: MODE })}\n\n`);
    tvs.add(res); req.on("close", () => tvs.delete(res));
    return;
  }

  // Estado
  if (req.method === "GET" && url.pathname === "/api/wa/health") {
    let session: string = MODE;
    if (wapi) { try { session = await wapi.status(); } catch { session = "down"; } }
    return json(res, 200, { mode: MODE, session, sentToday, contacts: contacts.map((c) => c.id) });
  }

  // wapi → mensaje entrante (firmado)
  if (req.method === "POST" && url.pathname === "/webhook/wapi") {
    const raw = await readBody(req);
    if (!verify(raw, req.headers["x-webhook-signature"] as string | undefined)) { res.writeHead(401); return res.end(); }
    res.writeHead(200); res.end("ok"); // responder YA: wapi reintenta si tardamos
    setImmediate(() => handleEvent(raw));
    return;
  }

  res.writeHead(404); res.end();
});

function handleEvent(raw: string) {
  let ev: { event: string; data: any };
  try { ev = JSON.parse(raw); } catch { return; }
  if (process.env.DEBUG_WEBHOOK) console.log("[webhook]", raw.slice(0, 2000));

  if (ev.event === "session.status") return emit({ type: "session", status: ev.data?.status });
  if (ev.event !== "messages.received") return;

  const key = ev.data?.key ?? {};
  if (key.fromMe || String(key.remoteJid ?? "").endsWith("@g.us")) return;   // ni propios ni grupos
  if (key.id && seenInbound.has(key.id)) return;                              // reintento de wapi
  if (key.id) seenInbound.add(key.id);

  const c = findSender(key);
  if (!c) return;                                                             // fuera de la lista: ni se muestra ni se guarda
  const m = ev.data?.message ?? {};
  const text = m.conversation ?? m.extendedTextMessage?.text;
  if (!text) return;                                                          // por ahora solo texto
  console.log(`[in] ${c.name}: ${text}`);
  emit({ type: "incoming", contactId: c.id, name: c.name, relation: c.relation, tone: c.tone, text, key });
}

await resolveLids();
server.listen(PORT, () => console.log(`woki-bridge · modo ${MODE} · ${contacts.length} contactos · http://localhost:${PORT}`));
