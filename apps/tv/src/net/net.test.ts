import { describe, expect, it, vi } from 'vitest';
import { readConfig } from '../config';
import { createApi } from './api';
import { openSse } from './sse';

const loc = (url: string) => {
  const u = new URL(url);
  return { hostname: u.hostname, pathname: u.pathname, origin: u.origin };
};

describe('configuración', () => {
  it('público: WhatsApp simulado y sin token', () => {
    const c = readConfig(loc('https://tv.example/v2/'), {}, null);
    expect(c.waUrl).toBe('');
    expect(c.agenteUrl).toBe('');
    expect(c.waToken).toBe('');
    expect(c.devAgentUrl).toBe('https://tv.example/agente');
  });

  it('equipo: puente y agente bajo /equipo/, el token lo pone Caddy', () => {
    const c = readConfig(loc('https://tv.example/equipo/v2/'), { remoto: 'x', waToken: 'secreto' }, null);
    expect(c.waUrl).toBe('https://tv.example/equipo/wa');
    expect(c.agenteUrl).toBe('https://tv.example/equipo/agente');
    expect(c.waToken).toBe('');
  });

  it('escenario: VPS remota y token desde toki-config.js', () => {
    const c = readConfig(loc('http://127.0.0.1:8766/v2/'), { remoto: 'https://vps', waToken: 't' }, null);
    expect(c.waUrl).toBe('https://vps/wa');
    expect(c.agenteUrl).toBe('https://vps/agente');
    expect(c.waToken).toBe('t');
  });

  it('desarrollo: puente local y agente local para el panel dev', () => {
    const c = readConfig(loc('http://localhost:5173/'), {}, null);
    expect(c.waUrl).toBe('http://localhost:8788');
    expect(c.devAgentUrl).toBe('http://127.0.0.1:8790');
    expect(c.emgWs).toBe('ws://localhost:8765');
  });
});

describe('API', () => {
  it('manda el token en un header y nunca en la URL', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: true, contacts: [] })));
    const api = createApi('https://vps/wa', 'tok', fetchImpl);
    await api('/api/wa/favorites');
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://vps/wa/api/wa/favorites');
    expect(url).not.toContain('tok');
    expect((init.headers as Record<string, string>)['X-Myo-Token']).toBe('tok');
  });

  it('un ok:false del servidor es un error con su motivo', async () => {
    const api = createApi('', '', async () => new Response(JSON.stringify({ ok: false, reason: 'Otra pantalla' })));
    await expect(api('/x', { body: {} })).rejects.toThrow('Otra pantalla');
  });
});

describe('SSE con fetch', () => {
  it('entrega cada bloque data: y reconecta al cortarse', async () => {
    const body = 'data: {"a":1}\n\ndata: {"b":2}\r\n\r\n';
    const stream = () =>
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(body));
          controller.close();
        },
      });
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200, body: stream() }) as unknown as Response);
    const messages: string[] = [];
    const retries: number[] = [];
    let opened = 0;
    const conn = openSse(
      'https://vps/wa/api/wa/events',
      { 'X-Myo-Token': 't' },
      { onopen: () => opened++, onmessage: (m) => messages.push(m.data) },
      { fetchImpl, setTimer: (_fn, ms) => retries.push(ms) },
    );
    await vi.waitFor(() => expect(retries).toEqual([3000]));
    expect(opened).toBe(1);
    expect(messages).toEqual(['{"a":1}', '{"b":2}']);
    const init = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>)['X-Myo-Token']).toBe('t');
    conn.close();
  });
});
