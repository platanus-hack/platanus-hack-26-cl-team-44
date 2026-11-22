import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWebEyeTrackAssetHandler } from './webeyetrack-assets.mjs';

const root = fileURLToPath(new URL('../', import.meta.url)).slice(0, -1);
const asset = createWebEyeTrackAssetHandler();
const types = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
};
createServer(async (req, res) => {
  const send = (status, type, body, cacheControl = 'no-store') => {
    res.writeHead(status, { 'Content-Type': type, 'Cache-Control': cacheControl, 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : body);
  };
  if (!['GET', 'HEAD'].includes(req.method)) return send(405, 'text/plain', 'Method not allowed');
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path === '/favicon.ico') return send(204, 'text/plain', '');
    if (await asset(req, res, path)) return;
    const file = resolve(root, `.${path === '/' ? '/gaze-benchmark/index.html' : path}`);
    const type = types[extname(file)];
    if (!file.startsWith(root + sep) || !type) return send(404, 'text/plain', 'Not found');
    return send(200, `${type}; charset=utf-8`, await readFile(file));
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EISDIR' || error instanceof URIError) return send(404, 'text/plain', 'Not found');
    console.error(error.message);
    return send(502, 'text/plain', 'Could not load the benchmark asset');
  }
}).listen(Number(process.env.GAZE_BENCHMARK_PORT || 8791), '127.0.0.1', function () {
  console.log(`Gaze benchmark: http://127.0.0.1:${this.address().port}/`);
});
