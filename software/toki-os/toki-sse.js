// Eventos del servidor (SSE) leídos con fetch, para mandar el token en un header y nunca en la URL.
// EventSource no admite headers; esto sí. Reconecta solo a los 3 s si se corta.
//   const s = tokiSSE(url, { 'X-Woki-Token': t }, { onopen, onerror, onmessage: (data) => ... });  s.close();
(function () {
  window.tokiSSE = function (url, headers, h) {
    let cerrado = false, ctrl = null;
    async function conectar() {
      if (cerrado) return;
      ctrl = new AbortController();
      try {
        const r = await fetch(url, { headers: { Accept: 'text/event-stream', ...(headers || {}) }, signal: ctrl.signal, cache: 'no-store' });
        if (!r.ok || !r.body) throw new Error('HTTP ' + r.status);
        h.onopen && h.onopen();
        const lector = r.body.getReader(), dec = new TextDecoder();
        let buf = '';
        for (;;) {
          const { value, done } = await lector.read();
          if (done) break;
          buf += dec.decode(value, { stream: true }).replace(/\r\n/g, '\n');
          let i;
          while ((i = buf.indexOf('\n\n')) >= 0) {
            const bloque = buf.slice(0, i); buf = buf.slice(i + 2);
            const data = bloque.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).replace(/^ /, '')).join('\n');
            if (data) h.onmessage && h.onmessage({ data });
          }
        }
      } catch (e) {
        if (cerrado) return;
      }
      if (cerrado) return;
      h.onerror && h.onerror();
      setTimeout(conectar, 3000);
    }
    conectar();
    return { close() { cerrado = true; ctrl && ctrl.abort(); } };
  };
})();
