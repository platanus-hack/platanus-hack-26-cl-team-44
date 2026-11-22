// Cliente JSON para el puente de WhatsApp y el agente. Mismo contrato que waApi (woki-os.html:1054-1059):
// el token va en el header X-Myo-Token y un `ok:false` del servidor cuenta como error.
import { tokenHeaders } from '../config';

export interface ApiOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
}

export type Api = <T = Record<string, unknown>>(path: string, opts?: ApiOptions) => Promise<T>;

export function createApi(base: string, token: string, fetchImpl: typeof fetch = (...a) => fetch(...a)): Api {
  return async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
    const hasBody = opts.body !== undefined;
    const r = await fetchImpl(base + path, {
      method: opts.method ?? (hasBody ? 'POST' : 'GET'),
      body: hasBody ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
      headers: tokenHeaders(token, hasBody ? { 'Content-Type': 'application/json' } : {}),
    });
    let j: Record<string, unknown> = {};
    try {
      j = await r.json();
    } catch {
      // sin cuerpo JSON
    }
    if (!r.ok || j.ok === false) throw new Error(String(j.reason || j.error || `HTTP ${r.status}`));
    return j as T;
  };
}
