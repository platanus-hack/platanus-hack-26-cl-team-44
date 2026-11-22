// Eventos del servidor (SSE) leídos con fetch, para mandar el token en un header y nunca en la URL.
// EventSource no admite headers. Reconecta solo a los 3 s si se corta. Port de software/toki-os/toki-sse.js.

export interface SseHandlers {
  onopen?: () => void;
  onerror?: () => void;
  onmessage?: (event: { data: string }) => void;
}

export interface SseConnection {
  close(): void;
}

export interface SseOptions {
  fetchImpl?: typeof fetch;
  retryMs?: number;
  setTimer?: (fn: () => void, ms: number) => unknown;
}

export function openSse(
  url: string,
  headers: Record<string, string>,
  h: SseHandlers,
  { fetchImpl = fetch, retryMs = 3000, setTimer = setTimeout }: SseOptions = {},
): SseConnection {
  let closed = false;
  let ctrl: AbortController | null = null;
  async function connect() {
    if (closed) return;
    ctrl = new AbortController();
    try {
      const r = await fetchImpl(url, {
        headers: { Accept: 'text/event-stream', ...headers },
        signal: ctrl.signal,
        cache: 'no-store',
      });
      if (!r.ok || !r.body) throw new Error(`HTTP ${r.status}`);
      h.onopen?.();
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true }).replace(/\r\n/g, '\n');
        let i = buf.indexOf('\n\n');
        while (i >= 0) {
          const block = buf.slice(0, i);
          buf = buf.slice(i + 2);
          const data = block
            .split('\n')
            .filter((l) => l.startsWith('data:'))
            .map((l) => l.slice(5).replace(/^ /, ''))
            .join('\n');
          if (data) h.onmessage?.({ data });
          i = buf.indexOf('\n\n');
        }
      }
    } catch {
      if (closed) return;
    }
    if (closed) return;
    h.onerror?.();
    setTimer(connect, retryMs);
  }
  void connect();
  return {
    close() {
      closed = true;
      ctrl?.abort();
    },
  };
}
