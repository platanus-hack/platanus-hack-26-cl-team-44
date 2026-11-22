// Servidor estático para las pruebas de paridad. Imita a Caddy en producción:
//   /      → software/toki-os (la TV actual, sin cambios)
//   /v2/   → apps/tv/dist (la TV v2 compilada)
// Solo escucha en 127.0.0.1. No hay backends: las pruebas los simulan con page.route().
//   node e2e/serve.mjs [puerto]
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OLD = resolve(here, '../../../software/toki-os');
const V2 = resolve(here, '../dist');
const PORT = Number(process.argv[2] || process.env.TV_E2E_PORT || 8123);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.task': 'application/octet-stream',
  '.wasm': 'application/wasm',
};

function fileFor(urlPath) {
  const path = decodeURIComponent(urlPath.split('?')[0]);
  const [root, rest] = path === '/v2' || path.startsWith('/v2/') ? [V2, path.slice(3) || '/'] : [OLD, path];
  const rel = normalize(rest).replace(/^(\.\.[/\\])+/, '');
  let file = join(root, rel);
  if (!file.startsWith(root)) return null;
  try {
    if (statSync(file).isDirectory()) file = join(file, 'index.html');
    statSync(file);
    return file;
  } catch {
    return null;
  }
}

createServer((req, res) => {
  if (req.url === '/v2') {
    res.writeHead(302, { Location: '/v2/' });
    res.end();
    return;
  }
  const file = fileFor(req.url || '/');
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404');
    return;
  }
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  createReadStream(file).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log(`TV actual en http://localhost:${PORT}/woki-os.html · v2 en /v2/`));
