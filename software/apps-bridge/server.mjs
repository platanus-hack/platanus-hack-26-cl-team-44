import {createGameSessions} from './game-session.mjs';
import http from 'node:http';
import {createAdapterRegistry} from './adapters/registry.mjs';
import {createSpotifyAdapter} from './adapters/spotify.mjs';
import {createBioBioAdapter} from './adapters/biobio.mjs';
import {createYouTubeAdapter} from './adapters/youtube.mjs';
import {createRappiAdapter} from './adapters/rappi.mjs';
import {createPackageStore,createReaderBuilder} from './generator/packages.mjs';
import {publicFetch} from './generator/public-fetch.mjs';
import {randomBytes} from 'node:crypto';
import {dirname, join, resolve} from 'node:path';
import {homedir} from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createWebEyeTrackAssetHandler} from '../toki-os/tools/webeyetrack-assets.mjs';
import {createMyoWareRoutes} from './myoware-routes.mjs';
import {createJobLifecycle, phases} from './jobs.mjs';
import {createAdapterDispatcher} from './dispatch.mjs';
import {createStaticFileHandler} from './static-files.mjs';
import {handleRequestSecurity, requireApiToken} from './request-security.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const site = resolve(here, '../toki-os');
const defaultDir = join(homedir(), 'Library/Application Support/Myo/apps');
const fault = (message, code = 400) => Object.assign(new Error(message), {status: code});
export {safeMessage, runSpogo, normalizeTracks} from './adapters/spotify.mjs';

export function createAppsServer({stateDir = defaultDir, run, fetcher = fetch, installed, hasSpotify, adapters, generate, renderGame, readerFetch = publicFetch, myowareFetch = fetch} = {}) {
  const gazeAsset = createWebEyeTrackAssetHandler();
  const serveStatic = createStaticFileHandler({site,gazeAsset,fault});
  const myoware = createMyoWareRoutes(myowareFetch);
  const gameSessions = createGameSessions(stateDir, renderGame);
  const registry = createAdapterRegistry(adapters || [createSpotifyAdapter({run,installed,hasSpotify}),createBioBioAdapter({fetcher}),createYouTubeAdapter({fetcher}),createRappiAdapter({stateDir,fetcher})]);
  const packageStore=createPackageStore(stateDir);
  const buildReader=createReaderBuilder({generate,fetcher:readerFetch});
  const lifecycle = createJobLifecycle({stateDir,registry,packageStore,readerFetch,buildReader,fetcher,site,fault});
  const {jobs} = lifecycle;
  const token = randomBytes(32).toString('hex');
  const dispatch = createAdapterDispatcher({registry,jobs:lifecycle,fault});
  const server = http.createServer(async (req, res) => {
    const port = server.address().port;
    if (handleRequestSecurity(req,res,port)) return;
    const url = new URL(req.url, `http://${req.headers.host}`);
    const send = (data, status = 200) => { res.writeHead(status, {'Content-Type': 'application/json', 'Cache-Control': 'no-store'}); res.end(JSON.stringify(data)); };
    try {
      if (await myoware(req, res, url)) return;
      if (url.pathname.startsWith('/api/')) {
        if (url.pathname === '/api/session' && req.method === 'GET') return send({token});
        requireApiToken(req,token,fault);
        if (req.method === 'GET' && url.pathname === '/api/jobs') return send({jobs, phases});
        if (req.method === 'GET' && url.pathname === '/api/adapters') return send({adapters:registry.manifests()});
        if (req.method !== 'POST' || req.headers['content-type'] !== 'application/json') throw fault('Solicitud no válida.', 405);
        let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 16384) throw fault('Solicitud demasiado grande.', 413); }
        let payload; try { payload = JSON.parse(body || '{}'); } catch { throw fault('Solicitud no válida.'); }
        if (!payload || Array.isArray(payload) || typeof payload !== 'object') throw fault('Solicitud no válida.');
        if (url.pathname === '/api/games/play') return await gameSessions.play(payload, `http://${req.headers.host}`, res);
        if (url.pathname === '/api/games/input') return send(await gameSessions.input(payload));
        if (url.pathname === '/api/jobs') {
          const result = lifecycle.create(payload);
          return send({job: result.job}, result.created ? 201 : 200);
        }
        const match = url.pathname.match(/^\/api\/jobs\/([a-f0-9-]+)\/(cancel|retry|review)$/);
        if (match) {
          const job = lifecycle.getJob(match[1]); const action = match[2];
          if (action === 'cancel') lifecycle.cancel(job);
          if (action === 'retry') lifecycle.retry(job);
          if (action === 'review') lifecycle.review(job, payload);
          return send({job});
        }
        const route=url.pathname.match(/^\/api\/apps\/([a-z][a-z0-9-]*)\/actions\/([a-z][a-z0-9-]*)$/);
        if(route)return send(await dispatch(route[1],route[2],payload));
        // Compatibility for the existing Spotify shell and earlier clients.
        const action=url.pathname.match(/^\/api\/spotify\/([a-z-]+)$/)?.[1];
        if(action)return send(await dispatch('spotify',action,payload,true));
        throw fault('Acción no disponible.', 404);
      }
      await serveStatic(req,res,url);
    } catch (e) { send({error: e.status ? e.message : 'No se pudo completar la solicitud.'}, e.status || (e.code === 'ENOENT' ? 404 : 500)); }
  });
  server.on('close', () => { for(const manifest of registry.manifests())void registry.get(manifest.id)?.close?.(); gameSessions.close(); lifecycle.close(); });
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.TOKI_APPS_PORT || 8790);
  const server = createAppsServer({stateDir: process.env.TOKI_APPS_STATE_DIR || defaultDir});
  server.listen(port, '127.0.0.1', () => console.log(`Myo OS: http://127.0.0.1:${server.address().port}/`));
  server.on('error', e => { console.error(e.code === 'EADDRINUSE' ? 'El servicio Apps ya está usando ese puerto.' : e.message); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.close(); server.closeAllConnections(); });
}
