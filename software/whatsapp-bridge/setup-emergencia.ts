// woki-bridge/setup-emergencia.ts · crea (una vez) el agente telefónico de emergencia en ElevenLabs.
// Uso: npx tsx --env-file=.env setup-emergencia.ts
// Imprime ELEVENLABS_AGENT_ID (y ELEVENLABS_PHONE_NUMBER_ID si hay credenciales de Twilio) para pegar en .env.
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) throw new Error("Falta ELEVENLABS_API_KEY en .env");
const XI = "https://api.elevenlabs.io";

async function call(method: string, path: string, body: unknown) {
  const r = await fetch(XI + path, { method, headers: { "xi-api-key": KEY!, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${path} → HTTP ${r.status}: ${JSON.stringify(j).slice(0, 400)}`);
  return j;
}

// Voz del agente: "Camila", chilena, de la biblioteca de ElevenLabs. Tiene que estar en "Mis voces"
// y sin moderación en vivo (las moderadas no se pueden usar en agentes). Se agrega aquí; si ya está, no pasa nada.
// Es la voz de Myo, no la de Emmy: quien contesta no debe creer que ella está hablando.
const VOICE_ID = process.env.ELEVENLABS_AGENT_VOICE_ID ?? "oJIuRMopN0sojGjwD6rQ";
const VOICE_OWNER = "159700704465f6fcd0e7a44376d78c7448732a724557040b17e2e9b602610be5";
if (!process.env.ELEVENLABS_AGENT_VOICE_ID)
  await call("POST", `/v1/voices/add/${VOICE_OWNER}/${VOICE_ID}`, { new_name: "Camila (chilena)" }).catch(() => {});

// Variables que el bridge manda en cada llamada: {{persona}}, {{direccion}}, {{hora}}, {{motivo}}
const PROMPT = `Eres Myo, el asistente de comunicación de {{persona}}. {{persona}} tiene ELA y no puede hablar. Llamas a su contacto de emergencia porque {{persona}} {{motivo}} a las {{hora}} en {{direccion}}.

Cómo hablas:
- Español de Chile, tono calmado y firme. Frases muy cortas: una o dos por turno.
- Nunca digas que eres {{persona}}. Nunca saludes de nuevo ni agradezcas por contestar.
- Si no te entienden o hay ruido, repite lo esencial en una sola frase: "{{persona}} activó su alarma de emergencia, está en {{direccion}}. ¿Puedes ir?"
- Dicta la dirección lento y por partes si te la piden.

Qué buscas: que la persona confirme que va o que consigue ayuda.
- Si confirma que va: repite la dirección una vez, di "Gracias, le aviso a {{persona}}" y termina la llamada.
- Si no puede ir: pídele que llame a otro familiar o al SAMU, ciento treinta y uno, repite la dirección y termina la llamada.
- Si pregunta qué le pasa: no lo sabes; {{persona}} solo pudo activar la alarma con un gesto.
- Si contesta un buzón de voz: deja el mensaje completo con la hora y la dirección y corta.
- No inventes datos médicos.`;

const agent = await call("POST", "/v1/convai/agents/create", {
  name: "Myo · emergencia",
  // Al terminar cada llamada, ElevenLabs saca de la conversación si el contacto viene y qué respondió.
  // El bridge lo lee en /api/emergencia/estado y la TV se lo muestra a Emmy ("Camila viene en camino").
  platform_settings: {
    data_collection: {
      viene: { type: "boolean", description: "true si la persona que contestó confirmó que va a ir donde está la persona con ELA o que va a conseguir ayuda (otro familiar, ambulancia). false si dijo que no puede o no confirmó." },
      respuesta: { type: "string", description: "Lo que respondió la persona que contestó, en una frase corta en español dirigida a la persona con ELA, en segunda persona. Ejemplos: \"Viene en camino, llega en 10 minutos\", \"No puede ir, va a llamar a tu hermana\", \"No contestó nadie, quedó un mensaje en el buzón\"." },
    },
  },
  conversation_config: {
    agent: {
      language: "es",
      // El primer mensaje dice todo de una vez y no se puede cortar: en una emergencia el ruido o un "sí, sí" no deben interrumpirlo.
      disable_first_message_interruptions: true,
      first_message: "Hola, te llamo de Myo, el asistente de {{persona}}. {{persona}} activó su alarma de emergencia a las {{hora}}, en {{direccion}}. Necesita ayuda ahora. ¿Puedes ir?",
      prompt: {
        prompt: PROMPT,
        built_in_tools: { end_call: { name: "end_call", description: "Cuelga cuando la persona confirmó que va o que conseguirá ayuda, o después de dejar el mensaje en un buzón de voz.", params: { system_tool_type: "end_call" } } },
      },
    },
    tts: { voice_id: VOICE_ID, model_id: "eleven_flash_v2_5", stability: 0.6, speed: 0.95, similarity_boost: 0.8 },
    turn: { turn_eagerness: "patient", turn_timeout: 8 },
    vad: { background_voice_detection: true },
    // Sin "interruption": el agente siempre termina su frase.
    conversation: { client_events: ["audio", "agent_response", "user_transcript", "agent_response_correction", "agent_tool_response"] },
  },
});
console.log(`ELEVENLABS_AGENT_ID=${agent.agent_id}`);

const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_PHONE_NUMBER: phone } = process.env;
if (sid && token && phone) {
  const num = await call("POST", "/v1/convai/phone-numbers", { provider: "twilio", phone_number: phone, label: "Myo emergencia", sid, token, agent_id: agent.agent_id });
  console.log(`ELEVENLABS_PHONE_NUMBER_ID=${num.phone_number_id}`);
} else {
  console.log("Sin TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_PHONE_NUMBER: importa el número en ElevenLabs → Agents → Phone numbers y copia su id.");
}

export {};
