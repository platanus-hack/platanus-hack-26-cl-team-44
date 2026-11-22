import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { MYOWARE_PROFILE_KEY, validMyoWareProfile } from '../toki-os/myoware-click.js';

const monitorOrigin = 'http://127.0.0.1:8766';
const monitorHTML = new URL('../myoware-monitor/index.html', import.meta.url);
const legacyOrigins = new Set([monitorOrigin, 'http://localhost:8766']);
const routes = new Map([
  ['/myoware', 'view'],
  ['/myoware/', 'view'],
  ['/myoware/data', '/data'],
  ['/emg/gestures', '/emg/gestures'],
  ['/myoware/handoff', 'handoff'],
]);
const maxProfileBytes = 2048;

function calibrationPayload(text) {
  const profile = JSON.parse(new URLSearchParams(text).get('calibration'));
  if (!validMyoWareProfile(profile) || !/^[a-f0-9]{32}$/.test(profile.source)) return null;
  const channel = ({ direction, trigger, release, center }) => ({ direction, trigger, release, center });
  return { source: profile.source, profile: { brow: channel(profile.profile.brow), jaw: channel(profile.profile.jaw) } };
}

export function createMyoWareRoutes(fetcher = fetch) {
  async function sensor(path) {
    const response = await fetcher(monitorOrigin + path, { signal: AbortSignal.timeout(450), redirect: 'error' });
    if (!response.ok) throw new Error('Monitor unavailable');
    return response.text();
  }

  return async (req, res, url) => {
    const route = routes.get(url.pathname);
    if (!route) return false;
    const respond = (status, body, type = 'text/plain', headers = {}) => {
      res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store', ...headers });
      res.end(req.method === 'HEAD' ? undefined : body);
      return true;
    };
    if (route === 'handoff') {
      if (req.method !== 'POST') return respond(405, 'Usa el enlace desde el monitor MyoWare.');
      if (!legacyOrigins.has(req.headers.origin)) return respond(403, 'Origen del monitor no permitido.');
      if (req.headers['content-type']?.split(';')[0] !== 'application/x-www-form-urlencoded') return respond(415, 'Formato de calibración no válido.');
      if (Number(req.headers['content-length']) > maxProfileBytes) return respond(413, 'Calibración demasiado grande.');
      let calibration;
      try {
        let body = '', bytes = 0;
        for await (const chunk of req.iterator({ destroyOnReturn: false })) {
          bytes += chunk.length;
          if (bytes > maxProfileBytes) return respond(413, 'Calibración demasiado grande.');
          body += chunk;
        }
        calibration = calibrationPayload(body);
      } catch { /* Malformed calibration. */ }
      if (!calibration) return respond(400, 'La calibración no es válida. Vuelve al monitor.');
      try {
        const packet = JSON.parse(await sensor('/emg/gestures'));
        if (packet.source !== calibration.source) {
          return respond(409, 'Cambió la conexión del sensor. Vuelve a calibrar en el monitor.');
        }
        if (!Number.isFinite(packet.age) || packet.age > 250) return respond(503, 'Los sensores no están enviando datos recientes.');
      } catch { return respond(503, 'No se pudo conectar con el monitor MyoWare.'); }
      const nonce = randomBytes(16).toString('base64');
      const value = JSON.stringify(JSON.stringify(calibration));
      return respond(200, `<!doctype html><html lang="es"><meta charset="utf-8"><title>Abrir Myo con MyoWare</title>
        <p>Abriendo Myo con la calibración de MyoWare…</p><script nonce="${nonce}">
        try { localStorage.setItem(${JSON.stringify(MYOWARE_PROFILE_KEY)}, ${value}); }
        catch { try { sessionStorage.setItem(${JSON.stringify(MYOWARE_PROFILE_KEY)}, ${value}); } catch {} }
        location.replace('/woki-os.html?myoware=1');
        </script></html>`, 'text/html', {
        'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; frame-ancestors 'none'; base-uri 'none'`,
      });
    }

    if (!['GET', 'HEAD'].includes(req.method)) return respond(405, 'Método no permitido.');
    if (route === 'view') return respond(200, await readFile(monitorHTML), 'text/html');
    if ((req.headers.origin && req.headers.origin !== url.origin) || req.headers['sec-fetch-site'] === 'cross-site') {
      return respond(403, 'La señal MyoWare solo se usa en el sitio local.');
    }
    try { return respond(200, await sensor(route), 'application/json'); }
    catch { return respond(503, 'No se pudo conectar con el monitor MyoWare.'); }
  };
}
