// woki-bridge/voz.ts · ElevenLabs: voz de Emmy (TTS), clonación/elección de voz y llamada de emergencia.
// La API key vive SOLO aquí (en .env). La TV y la página de onboarding hablan con el bridge, nunca con ElevenLabs.
import type http from "node:http";
import { readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";

const XI = process.env.ELEVENLABS_BASE_URL ?? "https://api.elevenlabs.io";
const KEY = process.env.ELEVENLABS_API_KEY ?? "";
// eleven_multilingual_v2: el que mejor respeta el acento de una voz clonada (con v3 la voz colombiana de Emmy salía con acento argentino).
// eleven_v3 = más expresivo (etiquetas de emoción) pero pierde el acento en clones instantáneos; eleven_flash_v2_5 = más rápido.
const TTS_MODEL = process.env.ELEVENLABS_TTS_MODEL ?? "eleven_multilingual_v2";
const V3 = TTS_MODEL.startsWith("eleven_v3");
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID ?? "";
const PHONE_ID = process.env.ELEVENLABS_PHONE_NUMBER_ID ?? "";
const PERSONA = process.env.WOKI_NOMBRE ?? "Emmy";
const DIRECCION = process.env.WOKI_DIRECCION ?? "";
const NUM_EMERGENCIAS = process.env.WOKI_NUM_EMERGENCIAS ?? "el SAMU, ciento treinta y uno";   // lo que dice el agente si nadie puede ir (Colombia: "la línea ciento veintitrés")
const MAX_TTS = 400;
const MAX_AUDIO_B64 = 14_000_000; // ~10 MB de audio
const CALL_COOLDOWN_MS = 60_000;

// ---------- estado persistente: qué voz usa Myo y cuáles se le ofrecen a Emmy ----------
type Voz = { id: string; name: string; kind: "clonada" | "biblioteca"; preview?: string };
type VozState = { actual: string | null; opciones: Voz[] };
const stateUrl = new URL("voz.json", import.meta.url);
let st: VozState = existsSync(stateUrl) ? JSON.parse(readFileSync(stateUrl, "utf8")) : { actual: null, opciones: [] };
function save() {
  const tmp = new URL("voz.json.tmp", import.meta.url);
  writeFileSync(tmp, JSON.stringify(st, null, 2) + "\n");
  renameSync(tmp, stateUrl);
}

// ---------- utilidades ----------
const xi = (path: string, init: RequestInit = {}) =>
  fetch(XI + path, { ...init, headers: { "xi-api-key": KEY, ...(init.headers ?? {}) } });
async function xiJson(path: string, init: RequestInit = {}) {
  const r = await xi(path, init);
  const t = await r.text();
  let j: any = {}; try { j = JSON.parse(t); } catch { j = { raw: t }; }
  if (!r.ok) throw Object.assign(new Error(j?.detail?.message ?? j?.detail ?? `ElevenLabs HTTP ${r.status}`), { status: r.status });
  return j;
}
function readBody(req: http.IncomingMessage, max: number) {
  return new Promise<string>((ok, ko) => {
    let b = "", n = 0;
    req.on("data", (c) => { n += c.length; if (n > max) { ko(Object.assign(new Error("muy grande"), { status: 413 })); req.destroy(); } else b += c; });
    req.on("end", () => ok(b)); req.on("error", ko);
  });
}
const clean = (s: unknown, n: number) => String(s ?? "").replace(/[<>]/g, "").trim().slice(0, n);
const digits = (s: string) => s.replace(/\D/g, "");

// Emoción de la tarjeta → cómo suena. Mismos ids que EMOS en woki-os.html.
// v3: etiqueta de emoción al inicio del texto (la entiende el modelo y no se pronuncia).
// Otros modelos: solo ajustes (menos estabilidad = más expresiva).
const EMO: Record<string, { tag: string; stability: number; style: number; speed: number }> = {
  seria:      { tag: "",                 stability: 0.6,  style: 0.1,  speed: 0.97 },
  alegre:     { tag: "[cheerfully]",     stability: 0.35, style: 0.55, speed: 1.06 },
  carinosa:   { tag: "[warmly]",         stability: 0.5,  style: 0.4,  speed: 0.94 },
  ironica:    { tag: "[sarcastically]",  stability: 0.35, style: 0.6,  speed: 0.98 },
  susurro:    { tag: "[whispers]",       stability: 0.7,  style: 0.2,  speed: 0.9 },
  entusiasta: { tag: "[excited]",        stability: 0.3,  style: 0.75, speed: 1.12 },
};

// ---------- llamada de emergencia ----------
// El SOS llama a TODOS los contactos a la vez y gana el primero que confirma que va.
//   EMERGENCY_CONTACTS=Jhomar:+51XXXXXXXXX,Juan:+57XXXXXXXXXX,Paolo:+569XXXXXXXX   (máx. 5)
// Si no está, se usa un solo contacto: EMERGENCY_NAME + EMERGENCY_NUMBER (como antes).
// Números cortos (131, 133, 911, 123…) quedan fuera: un robot no debe llamar a la ambulancia.
type Contacto = { nombre: string; numero: string };
const esServicioPublico = (n: string) => digits(n).length < 8;
const CONTACTOS: Contacto[] = (() => {
  const lista = process.env.EMERGENCY_CONTACTS
    ? process.env.EMERGENCY_CONTACTS.split(",").map((x) => { const i = x.lastIndexOf(":"); return { nombre: clean(x.slice(0, i), 30), numero: "+" + digits(x.slice(i + 1)) }; })
    : process.env.EMERGENCY_NUMBER ? [{ nombre: process.env.EMERGENCY_NAME ?? "Tu contacto", numero: "+" + digits(process.env.EMERGENCY_NUMBER) }] : [];
  const ok = lista.filter((c) => c.nombre && !esServicioPublico(c.numero) && digits(c.numero).length <= 15).slice(0, 5);
  if (ok.length < lista.length) console.warn(`[emergencia] ${lista.length - ok.length} contacto(s) descartado(s): sin nombre, número de servicio público o mal escrito`);
  return ok;
})();
// contestoAt: cuándo esta persona contestó y el agente pidió el protocolo · confirmo: lo que dijo en la llamada (herramienta del agente)
type Llamada = Contacto & { conversationId: string; error: string; contestoAt: number; confirmo: boolean | null };
let lastCall: { at: number; alarmId: string; hora: string; direccion: string; llamadas: Llamada[] } = { at: 0, alarmId: "", hora: "", direccion: "", llamadas: [] };

// Protocolo de la llamada: el PRIMERO que contesta recibe el aviso completo; los que contestan después
// saben que alguien ya respondió (o ya va) y se les pide igual que ayuden si pueden.
function protocolo(l: Llamada) {
  const hora = lastCall.hora || new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });
  const dir = lastCall.direccion || DIRECCION || "la casa";
  if (!l.contestoAt) l.contestoAt = Date.now();
  const otras = lastCall.llamadas.filter((x) => x !== l);
  const van = otras.filter((x) => x.confirmo === true).map((x) => x.nombre);
  const antes = otras.filter((x) => x.contestoAt && x.contestoAt < l.contestoAt).sort((a, b) => a.contestoAt - b.contestoAt).map((x) => x.nombre);
  if (van.length) return { rol: "ya_viene", quien: juntar(van), mensaje: `${PERSONA} activó su alarma de emergencia a las ${hora}. ${juntar(van)} ya ${van.length > 1 ? "van" : "va"} en camino. Igual, si puedes brindar ayuda, acércate a ${dir}. ¿Puedes ir?` };
  if (antes.length) return { rol: "ya_contesto", quien: antes[0], mensaje: `${PERSONA} activó su alarma de emergencia a las ${hora}. ${antes[0]} ya contestó el aviso. Igual, si puedes brindar ayuda, acércate a ${dir}. ¿Puedes ir?` };
  return { rol: "primero", quien: "", mensaje: `${PERSONA} activó su alarma de emergencia a las ${hora}, en ${dir}. Necesita ayuda ahora. ¿Puedes ir?` };
}
const juntar = (n: string[]) => (n.length < 2 ? n[0] ?? "" : `${n.slice(0, -1).join(", ")} y ${n[n.length - 1]}`);

export function vozHealth() {
  return {
    tts: !!KEY, voz: st.actual, opciones: st.opciones.length,
    llamada: !!(KEY && AGENT_ID && PHONE_ID && CONTACTOS.length), contactos: CONTACTOS.map((c) => c.nombre),
  };
}

// Devuelve true si atendió la ruta. Las comprobaciones de seguridad de /api/* ya pasaron en server.ts.
export async function handleVoz(req: http.IncomingMessage, res: http.ServerResponse, url: URL, origin: string): Promise<boolean> {
  const p = url.pathname;
  if (!p.startsWith("/api/voz/") && !p.startsWith("/api/emergencia/")) return false;
  const json = (code: number, body: unknown) => {
    res.writeHead(code, { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin });
    res.end(JSON.stringify(body));
  };
  if (!KEY && p !== "/api/voz/estado") { json(503, { ok: false, reason: "Falta ELEVENLABS_API_KEY en .env" }); return true; }

  try {
    // Estado: qué voz está activa y qué se puede elegir
    if (req.method === "GET" && p === "/api/voz/estado") {
      json(200, { ok: true, ...vozHealth(), actual: st.actual, opciones: st.opciones });
      return true;
    }

    // Texto → voz. Devuelve audio/mpeg en streaming (la TV lo reproduce apenas llegan los primeros bytes).
    if (req.method === "POST" && p === "/api/voz/tts") {
      const { text, emo, voiceId } = JSON.parse((await readBody(req, 4_000)) || "{}");
      const t = String(text ?? "").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim();
      const vid = clean(voiceId, 64) || st.actual;
      if (!t || t.length > MAX_TTS) { json(400, { ok: false, reason: "Texto vacío o muy largo" }); return true; }
      if (!vid) { json(409, { ok: false, reason: "Todavía no hay una voz elegida" }); return true; }
      const e = EMO[emo] ?? EMO.seria;
      const r = await xi(`/v1/text-to-speech/${encodeURIComponent(vid)}/stream?output_format=mp3_44100_128`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: V3 && e.tag ? `${e.tag} ${t}` : t, model_id: TTS_MODEL,
          // multilingual_v2 no acepta language_code (detecta el idioma del texto)
          ...(TTS_MODEL === "eleven_multilingual_v2" ? {} : { language_code: "es" }),
          // v3 trabaja mejor con estabilidad 0,5 ("natural"): la emoción la pone la etiqueta.
          voice_settings: V3 ? { stability: 0.5, similarity_boost: 0.8, use_speaker_boost: true }
                             : { stability: e.stability, similarity_boost: 0.9, style: e.style, use_speaker_boost: true, speed: e.speed },   // 0,9: lo más cerca posible de la voz clonada
        }),
      });
      if (!r.ok || !r.body) { console.error("[voz] tts", r.status, (await r.text()).slice(0, 300)); json(502, { ok: false, reason: "ElevenLabs no devolvió audio" }); return true; }
      res.writeHead(200, { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "Access-Control-Allow-Origin": origin });
      const reader = r.body.getReader();
      for (;;) { const { done, value } = await reader.read(); if (done) break; res.write(value); }
      res.end();
      return true;
    }

    // Voces para elegir: las de la cuenta (prediseñadas + clonadas). Se filtran a las que sirven en español.
    if (req.method === "GET" && p === "/api/voz/voces") {
      const j = await xiJson(`/v2/voices?page_size=100&sort=name&include_total_count=false`);
      const voces = (j.voices ?? []).map((v: any) => ({
        id: v.voice_id, name: v.name, category: v.category, preview: v.preview_url,
        gender: v.labels?.gender ?? "", age: v.labels?.age ?? "", accent: v.labels?.accent ?? "",
        desc: v.labels?.description ?? v.description ?? "",
        es: (v.verified_languages ?? []).some((l: any) => String(l.language).startsWith("es")) || /espa|latin|mexic|chile|colomb|argent/i.test(JSON.stringify(v.labels ?? {})),
      }));
      json(200, { ok: true, voces });
      return true;
    }

    // Clonar la voz de Emmy (clonación instantánea). Llega en JSON con los audios en base64:
    // { nombre, consentimiento: true, audios: [{ b64, mime, nombre }] }
    if (req.method === "POST" && p === "/api/voz/clonar") {
      const body = JSON.parse((await readBody(req, MAX_AUDIO_B64 + 10_000)) || "{}");
      if (body.consentimiento !== true) { json(400, { ok: false, reason: "Falta el consentimiento" }); return true; }
      const audios: any[] = Array.isArray(body.audios) ? body.audios.slice(0, 10) : [];
      if (!audios.length) { json(400, { ok: false, reason: "No llegó ningún audio" }); return true; }
      const fd = new FormData();
      const nombre = clean(body.nombre, 40) || `${PERSONA} (Myo)`;
      fd.append("name", nombre);
      fd.append("description", "Voz clonada para Myo con consentimiento de la persona.");
      fd.append("remove_background_noise", body.limpiarRuido ? "true" : "false");
      fd.append("labels", JSON.stringify({ language: "es" }));
      audios.forEach((a, i) => {
        const mime = clean(a.mime, 60) || "audio/webm";
        const ext = mime.includes("mp4") || mime.includes("m4a") ? "m4a" : mime.includes("mpeg") ? "mp3" : mime.includes("ogg") ? "ogg" : mime.includes("wav") ? "wav" : "webm";
        fd.append("files", new Blob([Buffer.from(String(a.b64 ?? ""), "base64")], { type: mime }), clean(a.nombre, 60) || `muestra-${i + 1}.${ext}`);
      });
      const j = await xiJson("/v1/voices/add", { method: "POST", body: fd });
      const v: Voz = { id: j.voice_id, name: nombre, kind: "clonada" };
      st.opciones = [v, ...st.opciones.filter((o) => o.id !== v.id)];
      st.actual = v.id; save();
      console.log(`[voz] clonada ${nombre} → ${v.id}${j.requires_verification ? " (requiere verificación)" : ""}`);
      json(200, { ok: true, voz: v, requiresVerification: !!j.requires_verification });
      return true;
    }

    // Guardar las voces candidatas (máx. 6, caben en la TV) y cuál queda activa.
    // { opciones: [{id,name,kind,preview}], actual }
    if (req.method === "POST" && p === "/api/voz/opciones") {
      const body = JSON.parse((await readBody(req, 20_000)) || "{}");
      const ops: Voz[] = (Array.isArray(body.opciones) ? body.opciones : []).slice(0, 6).map((o: any) => ({
        id: clean(o.id, 64), name: clean(o.name, 40), kind: o.kind === "clonada" ? "clonada" : "biblioteca", preview: clean(o.preview, 400) || undefined,
      })).filter((o: Voz) => o.id);
      st.opciones = ops;
      const actual = clean(body.actual, 64);
      st.actual = ops.some((o) => o.id === actual) ? actual : ops[0]?.id ?? null;
      save();
      json(200, { ok: true, actual: st.actual, opciones: st.opciones });
      return true;
    }

    // Emmy elige la voz desde la TV (solo entre las candidatas).
    if (req.method === "POST" && p === "/api/voz/elegir") {
      const { id } = JSON.parse((await readBody(req, 2_000)) || "{}");
      if (!st.opciones.some((o) => o.id === id)) { json(400, { ok: false, reason: "Esa voz no está entre las opciones" }); return true; }
      st.actual = id; save();
      json(200, { ok: true, actual: id });
      return true;
    }

    // Alarma de emergencia → un agente de ElevenLabs llama a todos los contactos de emergencia en paralelo.
    // { alarmId } · una tanda por alarma, y como mucho una por minuto.
    if (req.method === "POST" && p === "/api/emergencia/llamar") {
      const { alarmId, motivo } = JSON.parse((await readBody(req, 2_000)) || "{}");
      if (!AGENT_ID || !PHONE_ID || !CONTACTOS.length) { json(503, { ok: false, reason: "Llamada no configurada (agente, número o contactos)" }); return true; }
      const id = clean(alarmId, 64);
      if (!id) { json(400, { ok: false, reason: "Falta alarmId" }); return true; }
      if (id === lastCall.alarmId) { json(200, { ok: true, repetida: true }); return true; }
      if (Date.now() - lastCall.at < CALL_COOLDOWN_MS) { json(429, { ok: false, reason: "Ya se llamó hace menos de un minuto" }); return true; }
      const hora = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });
      lastCall = { at: Date.now(), alarmId: id, hora, direccion: DIRECCION || "la casa", llamadas: [] };
      const vars = { persona: PERSONA, direccion: DIRECCION || "la casa", hora, motivo: clean(motivo, 80) || "activó la alarma de emergencia", emergencias: NUM_EMERGENCIAS };
      const res2 = await Promise.allSettled(CONTACTOS.map((c) => xiJson("/v1/convai/twilio/outbound-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: AGENT_ID, agent_phone_number_id: PHONE_ID, to_number: c.numero,
          conversation_initiation_client_data: { dynamic_variables: vars },
          telephony_call_config: { ringing_timeout_secs: 45 },
        }),
      })));
      lastCall.llamadas = CONTACTOS.map((c, n) => {
        const r = res2[n];
        const j: any = r.status === "fulfilled" ? r.value : null;
        const error = !j ? String((r as PromiseRejectedResult).reason?.message ?? "error") : j.success ? "" : String(j.message ?? "no se pudo llamar");
        console.log(`[emergencia] ${c.nombre} …${digits(c.numero).slice(-4)} → ${error || "ok"}${j?.conversation_id ? " conv=" + j.conversation_id : ""}`);
        return { ...c, conversationId: j?.conversation_id ?? "", error, contestoAt: 0, confirmo: null };
      });
      const ok = lastCall.llamadas.filter((l) => !l.error);
      json(ok.length ? 200 : 502, { ok: !!ok.length, llamadas: lastCall.llamadas.map((l) => ({ nombre: l.nombre, ok: !l.error, reason: l.error || undefined })) });
      return true;
    }

    // Herramientas del agente durante la llamada (GET: ElevenLabs no manda Origin). Exigen el id de una llamada activa,
    // que no se puede adivinar, y en el VPS además el token (X-Woki-Token, guardado como secreto en ElevenLabs).
    // protocolo: qué decirle a quien contestó · confirmar: si viene o no (la TV se entera al instante)
    if (req.method === "GET" && p === "/api/emergencia/protocolo") {
      const conv = clean(url.searchParams.get("conv"), 80);
      const l = lastCall.llamadas.find((x) => x.conversationId && x.conversationId === conv);
      // Sin una llamada activa no se entrega nada (dirección, quién contestó): falla cerrado. El agente, si la
      // herramienta falla, da el aviso completo con las variables que recibió al marcar.
      if (!l) { json(404, { ok: false, reason: "llamada desconocida" }); return true; }
      const r = protocolo(l);
      console.log(`[emergencia] protocolo ${l.nombre} → ${r.rol}`);
      json(200, { ok: true, ...r });
      return true;
    }
    if (req.method === "GET" && p === "/api/emergencia/confirmar") {
      const conv = clean(url.searchParams.get("conv"), 80);
      const l = lastCall.llamadas.find((x) => x.conversationId && x.conversationId === conv);
      if (!l) { json(404, { ok: false, reason: "llamada desconocida" }); return true; }
      const v = String(url.searchParams.get("viene") ?? "").toLowerCase();
      l.confirmo = v === "si" || v === "sí" || v === "true";
      console.log(`[emergencia] ${l.nombre} ${l.confirmo ? "VIENE" : "no puede ir"}`);
      json(200, { ok: true, registrado: l.confirmo ? "viene" : "no_viene" });
      return true;
    }

    // Estado de las llamadas, resumido para la TV: quién suena, quién contestó y quién viene.
    if (req.method === "GET" && p === "/api/emergencia/estado") {
      if (!lastCall.llamadas.length) { json(200, { ok: true, estado: "sin_llamada" }); return true; }
      const ls = await Promise.all(lastCall.llamadas.map(async (l) => {
        if (l.error || !l.conversationId) return { nombre: l.nombre, estado: "failed", viene: null as boolean | null, respuesta: "" };
        try {
          const j = await xiJson(`/v1/convai/conversations/${encodeURIComponent(l.conversationId)}`);
          // Si el operador rechaza la llamada, ElevenLabs la deja en "initiated" para siempre: pasado el timbre (45 s) + margen, es un fallo.
          const estado = j.status === "initiated" && Date.now() - lastCall.at > 75_000 ? "failed" : String(j.status);
          // Al terminar, ElevenLabs extrae si viene y qué respondió (data_collection del agente; ver setup-emergencia.ts). Llega segundos después de "done".
          const dc = j.analysis?.data_collection_results ?? {};
          // Lo que el agente avisó durante la llamada (confirmar) vale al instante; el análisis de ElevenLabs llega al terminar.
          const viene = typeof dc.viene?.value === "boolean" ? dc.viene.value : l.confirmo;
          return { nombre: l.nombre, estado, viene, respuesta: typeof dc.respuesta?.value === "string" ? clean(dc.respuesta.value, 140) : l.confirmo === true ? "Confirmó por teléfono que va" : "" };
        } catch { return { nombre: l.nombre, estado: "initiated", viene: null, respuesta: "" }; }
      }));
      const de = (f: (l: (typeof ls)[number]) => boolean) => ls.filter(f);
      const vienen = de((l) => l.viene === true), hablando = de((l) => l.estado === "in-progress"), sonando = de((l) => l.estado === "initiated");
      const pendientes = de((l) => l.estado === "processing" || (l.estado === "done" && l.viene === null)), noVan = de((l) => l.viene === false);
      let r: { estado: string; grupo: typeof ls; viene: boolean | null };
      if (vienen.length) r = { estado: "done", grupo: vienen, viene: true };                // el primero que confirma gana
      else if (hablando.length) r = { estado: "in-progress", grupo: hablando, viene: null };
      else if (sonando.length) r = { estado: "initiated", grupo: sonando, viene: null };
      else if (pendientes.length) r = { estado: "processing", grupo: pendientes, viene: null };
      else if (noVan.length) r = { estado: "done", grupo: noVan, viene: false };
      else r = { estado: "failed", grupo: ls, viene: null };
      const respuesta = r.viene === true ? r.grupo[0].respuesta : r.viene === false ? r.grupo.map((l) => `${l.nombre}: ${l.respuesta || "no puede"}`).join(" · ") : "";
      json(200, { ok: true, estado: r.estado, contacto: juntar(r.grupo.map((l) => l.nombre)), varios: r.grupo.length > 1, viene: r.viene, respuesta, llamadas: ls });
      return true;
    }
  } catch (e: any) {
    console.error("[voz] error", e?.status, e?.message);
    if (!res.headersSent) json(e?.status === 413 ? 413 : 502, { ok: false, reason: e?.message ?? "Error con ElevenLabs" });
    else res.end();
    return true;
  }

  json(404, { ok: false, reason: "ruta de voz desconocida" });
  return true;
}
