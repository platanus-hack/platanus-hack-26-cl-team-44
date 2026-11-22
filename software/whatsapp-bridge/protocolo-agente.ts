// software/whatsapp-bridge/protocolo-agente.ts · configura el PROTOCOLO de la llamada de emergencia en el agente de ElevenLabs.
// No llama a nadie: solo cambia la configuración del agente (saludo, prompt y dos herramientas).
//
// Protocolo: el SOS llama a todos los contactos en paralelo. Quien contesta oye el saludo; al responder, el agente
// le pregunta al puente su rol (/api/emergencia/protocolo) y dice el mensaje exacto:
//   - el primero en contestar: el aviso completo;
//   - los siguientes: "X ya contestó" o "X ya va en camino", y que igual se acerquen si pueden ayudar.
// Cuando alguien dice que va (o que no puede), el agente lo avisa al puente (/api/emergencia/confirmar) y la TV se entera al instante.
//
// Uso (una vez, o cada vez que cambie el texto):
//   TOKI_PUBLIC_URL=https://179-66-157-161.sslip.io/wa npx tsx --env-file=.env protocolo-agente.ts
// Necesita ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID y WOKI_API_TOKEN (el token del puente público; se guarda
// como secreto en ElevenLabs y nunca va en una URL).
const KEY = process.env.ELEVENLABS_API_KEY, AGENT = process.env.ELEVENLABS_AGENT_ID, TOKEN = process.env.WOKI_API_TOKEN;
const BASE = (process.env.TOKI_PUBLIC_URL ?? "").replace(/\/+$/, "");
if (!KEY || !AGENT) throw new Error("Faltan ELEVENLABS_API_KEY o ELEVENLABS_AGENT_ID");
if (!/^https:\/\//.test(BASE)) throw new Error("TOKI_PUBLIC_URL debe ser la URL pública HTTPS del puente, p. ej. https://179-66-157-161.sslip.io/wa");
if (!TOKEN) throw new Error("Falta WOKI_API_TOKEN (el token del puente público)");
const XI = "https://api.elevenlabs.io";

async function call(method: string, path: string, body?: unknown) {
  const r = await fetch(XI + path, { method, headers: { "xi-api-key": KEY!, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${method} ${path} → HTTP ${r.status}: ${JSON.stringify(j).slice(0, 500)}`);
  return j;
}

// 1) El token del puente, como secreto del workspace (no llega al modelo ni a los logs de la conversación).
const secretos: any = await call("GET", "/v1/convai/secrets").catch(() => ({ secrets: [] }));
const previo = (secretos.secrets ?? []).find((x: any) => x.name === "myo_puente_token");
const secretId = previo?.secret_id ?? (await call("POST", "/v1/convai/secrets", { type: "new", name: "myo_puente_token", value: TOKEN })).secret_id;

// 2) Herramientas (GET: el puente no exige Origin en GET; sí exige el token y el id de una llamada activa).
const conv = { conv: { type: "string", dynamic_variable: "system__conversation_id" } };
const headers = { "X-Woki-Token": { secret_id: secretId } };
const protocolo = await call("POST", "/v1/convai/tools", { tool_config: {
  type: "webhook", name: "protocolo_emergencia",
  description: "Llámala apenas la persona responda al saludo. Devuelve 'mensaje': el aviso exacto que debes decir, según si esta persona fue la primera en contestar o si otra ya respondió.",
  response_timeout_secs: 6, pre_tool_speech: "off",
  api_schema: { url: `${BASE}/api/emergencia/protocolo`, method: "GET", query_params_schema: { properties: conv, required: ["conv"] }, request_headers: headers },
} });
const confirmar = await call("POST", "/v1/convai/tools", { tool_config: {
  type: "webhook", name: "confirmar_ayuda",
  description: "Llámala apenas la persona diga claramente si va a ir (o conseguir ayuda) o si no puede. viene='si' o viene='no'.",
  response_timeout_secs: 6, pre_tool_speech: "off",
  api_schema: { url: `${BASE}/api/emergencia/confirmar`, method: "GET", query_params_schema: {
    properties: { ...conv, viene: { type: "string", description: "'si' si va a ir o conseguir ayuda; 'no' si no puede", enum: ["si", "no"] } },
    required: ["conv", "viene"] }, request_headers: headers },
} });

// 3) Agente: saludo corto (no se puede interrumpir) y el protocolo en el prompt.
const PROMPT = `Eres Myo, el asistente de comunicación de {{persona}}. {{persona}} tiene ELA y no puede hablar. Llamas a sus contactos de emergencia porque {{persona}} {{motivo}}. Llamaste a varias personas al mismo tiempo.

Protocolo:
1. Ya saludaste. Apenas la persona responda (aunque solo diga "aló" o "sí"), llama a la herramienta protocolo_emergencia y di su campo "mensaje" tal cual, sin volver a saludar.
2. Si la herramienta falla, di: "{{persona}} activó su alarma de emergencia a las {{hora}}, en {{direccion}}. Necesita ayuda ahora. ¿Puedes ir?"
3. Si confirma que va o que consigue ayuda: llama a confirmar_ayuda con viene="si", di la dirección una vez ({{direccion}}), di "Gracias, le aviso a {{persona}}" y termina la llamada de inmediato.
4. Si dice que no puede ayudar: llama a confirmar_ayuda con viene="no", di solo "Entendido, estamos llamando a otras personas. Gracias." y termina la llamada de inmediato. No insistas, no pidas nada más, no repitas la dirección.
5. Si pregunta qué le pasa: no lo sabes; {{persona}} solo pudo activar la alarma con un gesto. Luego pregunta otra vez si puede ir.
6. Si contesta un buzón de voz: deja el aviso completo con la hora y la dirección y corta.

La llamada debe durar lo mínimo: solo necesitas saber si puede ir. Español latinoamericano, tono calmado y firme, una o dos frases cortas por turno. Nunca digas que eres {{persona}}. No inventes datos médicos. Si no te entienden, repite solo lo esencial.`;
const END_CALL = { end_call: { name: "end_call", description: "Cuelga apenas la persona confirmó que va (después de decir la dirección y agradecer), apenas dijo que no puede ayudar (después de decir que estamos llamando a otras personas), o después de dejar el aviso en un buzón de voz.", params: { system_tool_type: "end_call" } } };

const ag: any = await call("GET", `/v1/convai/agents/${AGENT}`);
const viejas = (ag.conversation_config?.agent?.prompt?.tool_ids ?? []).filter((id: string) => id !== protocolo.id && id !== confirmar.id);
await call("PATCH", `/v1/convai/agents/${AGENT}`, { conversation_config: { agent: {
  first_message: "Hola, te llamo de Myo, el asistente de {{persona}}. ¿Me escuchas?",
  disable_first_message_interruptions: true,
  prompt: { prompt: PROMPT, tool_ids: [...viejas, protocolo.id, confirmar.id], built_in_tools: END_CALL },
}, conversation: { max_duration_seconds: 120 } } });   // tope: ninguna llamada pasa de 2 minutos
console.log(`✓ Protocolo configurado en el agente ${AGENT}: herramientas ${protocolo.id} y ${confirmar.id} → ${BASE}`);

export {};
