// Servidor local del kiosco (solo Node, sin Electron: se prueba con node --test).
//
// La TV pide MediaPipe a la CDN (https://cdn.jsdelivr.net/...). El kiosco redirige esas URLs exactas, y solo
// esas, a este servidor en 127.0.0.1, que entrega la copia local verificada con sha256. El HTML no cambia y
// en Chrome todo sigue igual. Si un archivo no tiene copia local, no se redirige y va a internet como antes.
import http from 'node:http';
import { MANIFIESTO, VENDOR_DIR, leerEntrada } from '../toki-os/tools/vendor-assets.mjs';

export const PREFIJO = '/v/';

/** Patrones para session.webRequest: los hosts de la CDN que aparecen en el manifiesto. */
export function patrones() {
  const hosts = [...new Set(MANIFIESTO.map(a => new URL(a.url).host))];
  return hosts.map(h => `https://${h}/*`);
}

/** La URL local a la que redirigir `url`, o null para dejarla pasar (no está en el manifiesto o no hay copia). */
export function redireccion(url, base, verificadas) {
  let u;
  try { u = new URL(url); } catch { return null; }
  if (u.protocol !== 'https:' || !verificadas.has(`${u.origin}${u.pathname}`)) return null;
  return `${base}${PREFIJO}${u.host}${u.pathname}`;
}

/**
 * Arranca el servidor en 127.0.0.1 (puerto libre). Verifica primero toda la copia local.
 * Devuelve {base, verificadas, faltan, cerrar()}.
 */
export async function iniciarServidorLocal({ dir = VENDOR_DIR, puerto = 0, archivos = MANIFIESTO } = {}) {
  const verificadas = new Set();
  const faltan = [];
  const cache = new Map();
  for (const a of archivos) {
    const v = await leerEntrada(a, dir);
    if (v) { verificadas.add(a.url); cache.set(a.url, v); } else faltan.push(a.url);
  }
  let base = '';
  const srv = http.createServer((req, res) => {
    // Solo el Host exacto (contra DNS rebinding) y solo lectura
    if (req.headers.host !== new URL(base).host) { res.writeHead(421).end(); return; }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
    const ruta = (req.url || '').split('?')[0];
    const v = ruta.startsWith(PREFIJO) ? cache.get(`https://${ruta.slice(PREFIJO.length)}`) : undefined;
    if (!v) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('sin copia local'); return; }
    res.writeHead(200, {
      'Content-Type': v.tipo,
      'Content-Length': v.body.length,
      // La TV está en otro origen (127.0.0.1:8766): import() de módulos y fetch() del wasm piden CORS
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : v.body);
  });
  await new Promise((ok, mal) => { srv.once('error', mal); srv.listen(puerto, '127.0.0.1', ok); });
  base = `http://127.0.0.1:${srv.address().port}`;
  return { base, verificadas, faltan, cerrar: () => new Promise(ok => srv.close(ok)) };
}

/** Un servidor de una sola página en 127.0.0.1 (para la autoprueba: la página queda en otro origen, como la TV). */
export async function servirPagina(html) {
  const srv = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }).end(html);
  });
  await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
  return { url: `http://127.0.0.1:${srv.address().port}/`, cerrar: () => new Promise(ok => srv.close(ok)) };
}

/** ¿Es un origen local en el que confía el kiosco (cámara, micrófono, navegación)? */
export function esLocal(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' && (u.hostname === '127.0.0.1' || u.hostname === 'localhost');
  } catch { return false; }
}
