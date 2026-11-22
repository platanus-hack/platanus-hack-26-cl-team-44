// woki-bridge/agente.ts — cliente del agente de Myo (software/agent/server.py).
// El agente usa la memoria de la usuaria (privacidad por persona, límites, últimos encuentros).
// Si el agente no está, falla o tarda, todo sigue como antes: sugerir.ts con `claude -p`.
//   AGENT_URL  (por defecto http://127.0.0.1:8790) · AGENT=off lo apaga
import type { Sug, Line } from "./sugerir.ts";

const URL_AGENTE = process.env.AGENT_URL ?? "http://127.0.0.1:8790";
export const agenteOn = process.env.AGENT !== "off";
const EMOS = ["seria", "alegre", "carinosa", "ironica", "susurro", "entusiasta"];

export type Traza = { origen?: string; fuentes?: { id: string; tipo?: string }[]; inventadas?: string[]; sin_memoria?: boolean };
export type Opcion = { text: string; tone: string; emo: string; fuentes?: string[]; origen?: string; traza?: Traza & { fuentes?: { id: string; tipo?: string; texto?: string }[] } };
export type RespuestaGrupo = {
  accion: "ignorar" | "guardado" | "repetido" | "mencion";
  motivo?: string;
  resumen?: string;
  ultimo_encuentro?: string;
  opciones?: Opcion[];
  grupo_nombre?: string;
  origen?: string;
};

async function post<T>(path: string, body: unknown, ms: number): Promise<T> {
  const r = await fetch(URL_AGENTE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(ms),
  });
  if (!r.ok) throw new Error(`agente HTTP ${r.status}`);
  return (await r.json()) as T;
}

// Igual que sugerir.ts: el texto viene de un modelo que lee mensajes de terceros.
const limpia = (o: Opcion): Sug => ({
  text: String(o.text ?? "").replace(/[<>]/g, "").trim().slice(0, 160),
  tone: String(o.tone ?? "").replace(/[<>]/g, "").slice(0, 30),
  emo: EMOS.includes(o.emo) ? o.emo : "seria",
  // De dónde sale la opción (modo dev de la TV): solo ids y tipos de memoria; el texto de la memoria no viaja por el SSE.
  traza: { origen: o.traza?.origen ?? o.origen ?? "agente", fuentes: (o.traza?.fuentes ?? (o.fuentes ?? []).map((id) => ({ id, tipo: undefined as string | undefined })))
    .map((f) => ({ id: String(f.id), tipo: f.tipo })), inventadas: o.traza?.inventadas ?? [], sin_memoria: o.traza?.sin_memoria },
});

/** 6 respuestas para el chat 1 a 1. [] si el agente no está o no respondió con el modelo. */
export async function agenteChat(phone: string, name: string, lines: Line[]): Promise<Sug[]> {
  if (!agenteOn) return [];
  const ultimo = [...lines].reverse().find((l) => l.dir === "in")?.text ?? lines.at(-1)?.text ?? "";
  if (!ultimo) return [];
  try {
    const r = await post<{ origen: string; opciones: Opcion[] }>("/api/sugerir", {
      modo: "chat",
      traza: true,
      telefono: phone,
      texto: ultimo,
      historial: lines.slice(-14).map((l) => `${l.dir === "in" ? name : "Yo"}: ${l.text.replace(/\s+/g, " ").slice(0, 300)}`),
    }, 12_000);
    return r.origen === "agente" ? r.opciones.map(limpia).filter((x) => x.text) : [];
  } catch (e: any) {
    console.log(`[agente] sin respuesta para el chat (${e?.message})`);
    return [];
  }
}

/** Pasa un mensaje de grupo al agente. Con mención y disparador activo devuelve opciones. */
export async function agenteGrupo(ev: {
  id?: string; grupo_jid: string; grupo_nombre?: string | null; autor_tel?: string; autor_nombre?: string;
  texto: string; menciona: boolean;
}): Promise<RespuestaGrupo | null> {
  if (!agenteOn) return null;
  try {
    const r = await post<RespuestaGrupo>("/api/grupo", ev, ev.menciona ? 15_000 : 3_000);
    if (r.opciones) r.opciones = r.opciones.map((o) => ({ ...o, ...limpia(o) }));
    return r;
  } catch (e: any) {
    console.log(`[agente] sin respuesta para el grupo (${e?.message})`);
    return null;
  }
}

/** ¿El grupo tiene un disparador activo? Solo a esos grupos se puede responder desde la TV. */
export async function grupoActivo(jid: string): Promise<boolean> {
  if (!agenteOn) return false;
  try {
    const r = await fetch(URL_AGENTE + "/api/disparadores", { signal: AbortSignal.timeout(3_000) });
    const ds = (await r.json()) as { grupo_jid: string; estado: string }[];
    return ds.some((d) => d.grupo_jid === jid && d.estado === "activo");
  } catch {
    return false;
  }
}
