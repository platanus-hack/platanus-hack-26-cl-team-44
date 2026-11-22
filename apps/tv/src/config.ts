// Configuración de la TV. Mismas reglas que software/toki-os/woki-os.html:691-722.
// Formas de abrir la TV. El token nunca va en una URL.
// · Escenario: la sirve el monitor MyoWare (127.0.0.1:8766) y entrega toki-config.js con window.TOKI_ENV.
// · Equipo: https://<dominio>/equipo/ pide usuario y contraseña. Caddy agrega el token por dentro.
// · Público: https://<dominio>/ con WhatsApp simulado y sin datos de la usuaria.
// · Desarrollo: localhost con el puente local (8788).

export interface TokiEnv {
  remoto?: string;
  waToken?: string;
}

declare global {
  interface Window {
    TOKI_ENV?: TokiEnv;
  }
}

export interface LocationLike {
  hostname: string;
  pathname: string;
  origin: string;
}

export interface TvConfig {
  local: boolean;
  equipo: boolean;
  /** Puente de WhatsApp. '' = mensajes simulados. */
  waUrl: string;
  /** Agente de la VPS (escenario o equipo). '' en público y en desarrollo. */
  agenteUrl: string;
  /** Agente que usa el panel dev (Shift+D). dev-agente.js:13 */
  devAgentUrl: string;
  /** Header X-Myo-Token. Solo lo usa el escenario. */
  waToken: string;
  /** Puente EMG opcional. */
  emgWs: string;
}

export function readConfig(
  loc: LocationLike = window.location,
  env: TokiEnv = window.TOKI_ENV ?? {},
  devOverride: string | null = safeGet('toki.dev.url'),
): TvConfig {
  const local = ['localhost', '127.0.0.1'].includes(loc.hostname);
  const equipo = !local && loc.pathname.startsWith('/equipo/');
  const remoto = local ? env.remoto || '' : '';
  const waToken = remoto ? env.waToken || '' : '';
  const waUrl = remoto ? `${remoto}/wa` : equipo ? `${loc.origin}/equipo/wa` : local ? 'http://localhost:8788' : '';
  const agenteUrl = remoto ? `${remoto}/agente` : equipo ? `${loc.origin}/equipo/agente` : '';
  const devAgentUrl =
    devOverride ||
    agenteUrl ||
    (local
      ? 'http://127.0.0.1:8790'
      : `${loc.origin}${loc.pathname.startsWith('/equipo/') ? '/equipo/agente' : '/agente'}`);
  return { local, equipo, waUrl, agenteUrl, devAgentUrl, waToken, emgWs: local ? 'ws://localhost:8765' : '' };
}

export function tokenHeaders(token: string, extra: Record<string, string> = {}): Record<string, string> {
  return token ? { ...extra, 'X-Myo-Token': token } : extra;
}

export function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // sin almacenamiento: no es crítico
  }
}

export function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // sin almacenamiento
  }
}
