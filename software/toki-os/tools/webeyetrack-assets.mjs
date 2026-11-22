import { createHash } from 'node:crypto';

const bundle = 'https://cdn.jsdelivr.net/npm/webeyetrack@0.0.2/dist/';
const weights = 'https://raw.githubusercontent.com/RedForestAI/WebEyeTrack/5c0a7548df1c70a6739debadd1e16ab795d1b5ee/js/example-app/public/web/';
const assets = new Map([
  ['/web/tracker.js', [`${bundle}index.js`, 'text/javascript', '11075aa7e0abf971ecbba41dbca935f39d283b2d4b9169070d2d33eb94f79c18']],
  ['/web/index.js.LICENSE.txt', [`${bundle}index.js.LICENSE.txt`, 'text/plain', '28e9b8f472f45d6b19c1eb4b01cc8e31adccd95ad52fb59c1edde51c57d4539f']],
  ['/web/model.json', [`${weights}model.json`, 'application/json', 'a214f074ccd4724cf4ebf008814a05485e7eaa5faf5aaeb85e66b24a1af55688']],
  ['/web/group1-shard1of1.bin', [`${weights}group1-shard1of1.bin`, 'application/octet-stream', 'c030a762a2d21ac0f3c59700a723b2d8790f2003b3f8e72fbe31129fcb234e58']],
]);

export function createWebEyeTrackAssetHandler(fetcher = fetch) {
  const cache = new Map();
  return async (req, res, path) => {
    const entry = assets.get(path);
    if (!entry || !['GET', 'HEAD'].includes(req.method)) return false;
    const [url, type, digest] = entry;
    try {
      if (!cache.has(path)) {
        cache.set(path, fetcher(url, { signal: AbortSignal.timeout(15_000) }).then(async response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const body = Buffer.from(await response.arrayBuffer());
          if (createHash('sha256').update(body).digest('hex') !== digest) throw new Error('Asset integrity mismatch');
          return body;
        }).catch(error => { cache.delete(path); throw error; }));
      }
      const body = await cache.get(path);
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.writeHead(502, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : 'WebEyeTrack asset unavailable');
    }
    return true;
  };
}
