// woki-bridge/alarma.ts · Estado de la llamada de emergencia, en disco: sobrevive a un reinicio del puente.
// Guarda la última alarma (cooldown e idempotencia por alarmId) y las anteriores (máx. 20), así las herramientas
// del agente encuentran su llamada por conversationId aunque el puente se haya reiniciado.
// Tiene nombres y teléfonos de los contactos: archivo solo del dueño (0600), fuera de git y nunca se imprime.
import { readFileSync, writeFileSync, renameSync, existsSync, chmodSync } from "node:fs";

export type Contacto = { nombre: string; numero: string };
// contestoAt: cuándo esta persona contestó y el agente pidió el protocolo · confirmo: lo que dijo en la llamada (herramienta del agente)
export type Llamada = Contacto & { conversationId: string; error: string; contestoAt: number; confirmo: boolean | null };
export type Alarma = { at: number; alarmId: string; hora: string; direccion: string; llamadas: Llamada[] };
export const INICIADA_MAX_MS = 75_000;
export const REPETIDA_MS = 10 * 60_000;
const vacia = (): Alarma => ({ at: 0, alarmId: "", hora: "", direccion: "", llamadas: [] });

// Si el operador rechaza la llamada, ElevenLabs la deja en "initiated" para siempre: pasado el timbre (45 s) + margen, es un fallo.
export const estadoLlamada = (status: unknown, at: number, now = Date.now()) =>
  status === "initiated" && now - at > INICIADA_MAX_MS ? "failed" : String(status);

export class EstadoAlarma {
  ultima: Alarma = vacia();
  anteriores: Alarma[] = [];   // la más nueva primero
  constructor(private file: string, private cooldownMs: number, private maxAnteriores = 20) {
    try {
      if (existsSync(file)) {
        const j = JSON.parse(readFileSync(file, "utf8"));
        this.ultima = alarma(j?.ultima);
        this.anteriores = (Array.isArray(j?.anteriores) ? j.anteriores : []).map(alarma).slice(0, maxAnteriores);
      }
    } catch (e: any) {   // nunca e.message: el error de JSON.parse trae un trozo del archivo
      console.warn(`[emergencia] no pude leer el estado guardado (${e?.code ?? "JSON inválido"}): empiezo sin alarmas`);
    }
  }
  // "repetida": ya hubo una tanda para esta alarma · "espera": la última tanda fue hace menos del cooldown
  revisar(alarmId: string, now = Date.now()): "ok" | "repetida" | "espera" {
    // Mismo id solo cuenta como repetida dentro de 10 min: el id de la TV sale de performance.now() y se repite al recargar.
    if (alarmId === this.ultima.alarmId && now - this.ultima.at < REPETIDA_MS) return "repetida";
    if (now - this.ultima.at < this.cooldownMs) return "espera";
    return "ok";
  }
  // Nueva tanda. Se guarda ANTES de marcar: un reinicio a mitad de la llamada no deja llamar otra vez.
  iniciar(alarmId: string, hora: string, direccion: string, now = Date.now()): Alarma {
    if (this.ultima.at) this.anteriores = [this.ultima, ...this.anteriores].slice(0, this.maxAnteriores);
    this.ultima = { at: now, alarmId, hora, direccion, llamadas: [] };
    this.guardar();
    return this.ultima;
  }
  // La llamada de esa conversación y su alarma (la última o una anterior). Sin id no hay llamada.
  buscar(conv: string): { alarma: Alarma; llamada: Llamada } | null {
    if (!conv) return null;
    for (const a of [this.ultima, ...this.anteriores]) {
      const l = a.llamadas.find((x) => x.conversationId === conv);
      if (l) return { alarma: a, llamada: l };
    }
    return null;
  }
  // Escritura atómica (temporal + rename), solo dueño. Si falla, la llamada sigue: solo se pierde el estado al reiniciar.
  guardar() {
    try {
      const tmp = this.file + ".tmp";
      writeFileSync(tmp, JSON.stringify({ ultima: this.ultima, anteriores: this.anteriores }), { mode: 0o600 });
      renameSync(tmp, this.file); chmodSync(this.file, 0o600);
    } catch (e: any) { console.error(`[emergencia] no pude guardar el estado (${e?.code ?? "error"})`); }
  }
}

// Lo que viene del disco, con los tipos de siempre: un archivo editado a mano no rompe el puente.
function alarma(a: any): Alarma {
  if (!a || typeof a !== "object") return vacia();
  const s = (v: unknown) => (typeof v === "string" ? v : ""), n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const ls: any[] = Array.isArray(a.llamadas) ? a.llamadas.filter((l: any) => l && typeof l === "object") : [];
  return { at: n(a.at), alarmId: s(a.alarmId), hora: s(a.hora), direccion: s(a.direccion), llamadas: ls.map((l) => ({
    nombre: s(l.nombre), numero: s(l.numero), conversationId: s(l.conversationId), error: s(l.error),
    contestoAt: n(l.contestoAt), confirmo: typeof l.confirmo === "boolean" ? l.confirmo : null })) };
}
