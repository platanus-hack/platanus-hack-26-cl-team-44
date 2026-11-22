import {readFile} from 'node:fs/promises';
import {extname, resolve} from 'node:path';

export function createStaticFileHandler({site, gazeAsset, fault}) {
  return async function serveStatic(req, res, url) {
    if (url.pathname === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return true;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') throw fault('Método no permitido.', 405);
    if (await gazeAsset(req, res, url.pathname)) return true;
    if ((url.pathname === '/' || url.pathname === '/index.html') && !url.search) {
      res.writeHead(302, {Location: '/woki-os.html', 'Cache-Control': 'no-store'});
      res.end();
      return true;
    }
    const path = resolve(site, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    const preset = /^\/presets\/[\w-]+\.json$/.test(url.pathname);
    if (!path.startsWith(site + '/') || (!preset && !['.html', '.js', '.css', '.svg', '.png', '.jpg', '.webp', '.woff2'].includes(extname(path)))) {
      throw fault('No encontrado.', 404);
    }
    const data = await readFile(path);
    const mime = {'.json': 'application/json', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2'}[extname(path)];
    res.writeHead(200, {'Content-Type': mime, 'Cache-Control': 'no-cache'});
    res.end(req.method === 'HEAD' ? undefined : data);
    return true;
  };
}
