import {createGameSessions} from './game-session.mjs';
import http from 'node:http';
import {createAdapterRegistry} from './adapters/registry.mjs';
import {createSpotifyAdapter} from './adapters/spotify.mjs';
import {createBioBioAdapter} from './adapters/biobio.mjs';
import {createYouTubeAdapter} from './adapters/youtube.mjs';
import {createPackageStore,createReaderBuilder,packageAdapter,readerId} from './generator/packages.mjs';
import {publicFetch,publicFeedURL} from './generator/public-fetch.mjs';
import {randomBytes, randomUUID} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync, renameSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {dirname, join, extname, resolve} from 'node:path';
import {homedir} from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = resolve(here, '../toki-os');
const defaultDir = join(homedir(), 'Library/Application Support/Toki/apps');
const phases = ['Integración encontrada', 'Interfaz preparada', 'Cuenta conectada', 'Funciones comprobadas', 'Prueba y revisión'];
const fault = (message, code = 400) => Object.assign(new Error(message), {status: code});
export {safeMessage, runSpogo, normalizeTracks} from './adapters/spotify.mjs';

export function createAppsServer({stateDir = defaultDir, run, fetcher = fetch, installed, hasSpotify, adapters, generate, launchGameWindow, readerFetch = publicFetch} = {}) {
  const gameSessions = createGameSessions(launchGameWindow);
  const registry = createAdapterRegistry(adapters || [createSpotifyAdapter({run,installed,hasSpotify}),createBioBioAdapter({fetcher}),createYouTubeAdapter({fetcher})]);
  mkdirSync(stateDir, {recursive: true, mode: 0o700});
  const packageStore=createPackageStore(stateDir),loaded=packageStore.load();
  for(const pkg of loaded.packages){try{registry.register(packageAdapter(pkg.spec,{fetcher:readerFetch}));}catch{loaded.errors.push({id:pkg.spec.id});}}
  const buildReader=createReaderBuilder({generate,fetcher:readerFetch});
  const stateFile = join(stateDir, 'requests.json');
  let jobs = [];
  try { const saved = JSON.parse(readFileSync(stateFile, 'utf8')); if (Array.isArray(saved)) jobs = saved; } catch (e) { if (e.code !== 'ENOENT') throw fault('No se pudo leer el registro de solicitudes. Conserva el archivo antes de repararlo.', 500); }
  for (const job of jobs) if (['preparing','queued'].includes(job.status)) { job.status = 'interrupted'; job.message = 'La preparación se interrumpió. Puedes reintentar.'; }
  for(const job of jobs){const adapter=registry.find(job.name);if(adapter && job.app==='custom'){job.app=adapter.manifest.id;job.status='interrupted';job.message='Hay una adaptación disponible. Vuelve a prepararla.';}if(job.app==='spotify' && !job.adapterVersion)job.adapterVersion='1.0.0';}
  for(const job of jobs)if(loaded.errors.some(e=>e.id===job.app)){job.status='error';job.evidence={};job.message='El paquete guardado no superó la validación. Vuelve a prepararlo.';}
  const token = randomBytes(32).toString('hex');
  const running = new Map();
  const busyAdapters = new Set(), operations = new Map();
  const save = () => { const tmp = stateFile + '.tmp'; writeFileSync(tmp, JSON.stringify(jobs, null, 2), {mode: 0o600}); renameSync(tmp, stateFile); };
  save();
  function update(job, patch) { Object.assign(job, patch, {updatedAt: new Date().toISOString()}); save(); }
  function getJob(id) { const job = jobs.find(j => j.id === id); if (!job) throw fault('Solicitud no encontrada.', 404); return job; }
  function evidence(job, key, generation) {
    const adapter=job && registry.get(job.app);
    if (!adapter || job.generation!==generation || ['cancelled','error','interrupted'].includes(job.status)) return;
    if (!adapter.manifest.requiredEvidence.includes(key)) return;
    job.evidence[key]=new Date().toISOString();
    const checked=adapter.manifest.requiredEvidence.every(k=>job.evidence[k]);
    update(job,checked && job.status==='needs_test'?{stage:4,message:'Funciones comprobadas. Falta la revisión y la prueba con la persona.'}:{});
  }
  async function prepare(job) {
    const controller = new AbortController(); running.set(job.id, controller);
    const current = () => running.get(job.id) === controller && !controller.signal.aborted;
    update(job, {generation:(job.generation||0)+1,status: 'preparing', stage: 0, message: 'Buscando una integración para tus tareas…'});
    try {
      const adapter=registry.get(job.app);
      if (!adapter && job.sourceUrl) {
        update(job,{buildStep:'queued',message:'Esperando turno para preparar la adaptación…'});
        const result=await buildReader({name:job.name,tasks:job.tasks,sourceUrl:job.sourceUrl},{signal:controller.signal,report:patch=>{if(current())update(job,patch);}});
        if(!current())return;
        if(result.unsupported){update(job,{status:'needs_adapter',stage:1,message:result.message,unsupportedTasks:result.unsupportedTasks});return;}
        const m=result.adapter.manifest;
        if(registry.get(m.id)||registry.find(m.name))throw fault('Esta fuente o nombre ya tiene una adaptación. Abre la app existente.',409);
        const receipt=packageStore.install(result.pkg);
        registry.register(result.adapter);
        update(job,{app:m.id,adapterVersion:m.version,packageDigest:receipt.digest,status:'needs_test',stage:4,buildStep:'installed',evidence:result.evidence,message:'Adaptación instalada y funciones comprobadas. Falta probarla contigo.'});
        return;
      }
      if (!adapter) {
        const query = `${job.name} cli`;
        const timeout = AbortSignal.timeout(12000);
        const response = await fetcher(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=4`, {headers: {Accept: 'application/vnd.github+json', 'User-Agent': 'Toki-app-adapter'}, signal: AbortSignal.any([controller.signal, timeout])});
        if (!response.ok) throw fault('La búsqueda de integraciones no respondió. Reintenta más tarde.');
        const data = await response.json();
        if (!current()) return;
        const candidates = (data.items || []).map(x => ({name: x.full_name, url: x.html_url, description: String(x.description || '').slice(0, 250)}));
        update(job, {status: 'needs_adapter', stage: 0, candidates, message: candidates.length ? 'Encontramos posibles integraciones. El equipo debe comprobarlas y crear tu adaptación.' : 'Solicitud guardada. El equipo investigará cómo conectar esta app.'});
        return;
      }
      if (!['music','news','video'].includes(adapter.manifest.interface.kind) || !existsSync(join(site,'toki-apps.js'))) throw fault('Falta la interfaz de la adaptación.');
      const result=await adapter.prepare({signal:controller.signal,report:patch=>{if(current())update(job,patch);}});
      if(current())update(job,{...result,adapterVersion:adapter.manifest.version});
    } catch (e) { if (current()) update(job, {status:'error',message:e.status?e.message:(registry.get(job.app)?.errorMessage?.(e)||'No se pudo preparar esta app. Vuelve a intentarlo.')}); }
    finally { if (running.get(job.id) === controller) running.delete(job.id); }
  }
  async function dispatch(appId, action, payload, legacy = false) {
    const adapter=registry.get(appId), capability=adapter?.manifest.actions.find(a=>a.id===action);
    if(!adapter || !capability)throw fault('Acción no disponible.',404);
    const job=payload.jobId?getJob(payload.jobId):undefined;
    if(!legacy && !job)throw fault('Prepara esta adaptación antes de usarla.',409);
    if(job && (job.app!==appId || !['needs_connection','needs_test','ready'].includes(job.status)))throw fault('Prepara esta adaptación antes de usar sus controles.',409);
    if(job && capability.requiresAccount && job.status==='needs_connection')throw fault('Conecta la cuenta antes de usar esta función.',409);
    if(job?.adapterVersion && job.adapterVersion!==adapter.manifest.version)throw fault('La adaptación cambió de versión. Vuelve a prepararla.',409);
    if(capability.mutates && busyAdapters.has(appId))throw fault('Hay una operación en curso. Espera un momento.',409);
    if(capability.mutates)busyAdapters.add(appId);
    const generation=job?.generation;
    const controller=new AbortController();
    const pending=operations.get(job?.id)||new Set();pending.add(controller);operations.set(job?.id,pending);
    const current=()=>job && job.generation===generation && !['cancelled','error','interrupted'].includes(job.status);
    try {
      return await adapter.execute(action,payload,{
        signal:controller.signal,generation,
        evidence:key=>evidence(job,key,generation),
        connected:()=>{if(current())update(job,{stage:3,status:'needs_test',message:'Cuenta conectada. Prueba las funciones con tu control.'});},
        disconnected:()=>{for(const j of jobs.filter(j=>j.app===appId&&j.status!=='cancelled'))update(j,{generation:(j.generation||0)+1,status:'needs_connection',stage:2,evidence:{},message:'Sesión desconectada.'});}
      });
    } catch(e) {if(e.status)throw e;throw fault(adapter.errorMessage?.(e)||'No se pudo completar la operación. Vuelve a intentarlo.',502);}
    finally {if(capability.mutates)busyAdapters.delete(appId);pending.delete(controller);if(!pending.size)operations.delete(job?.id);}
  }
  const server = http.createServer(async (req, res) => {
    const port = server.address().port;
    const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
    if (!hosts.includes(req.headers.host)) { res.writeHead(403); res.end(); return; }
    const allowed = [`http://127.0.0.1:${port}`, `http://localhost:${port}`, 'http://localhost:8000', 'http://127.0.0.1:8000'];
    const origin = req.headers.origin;
    if (req.url.startsWith('/api/') && ((origin && !allowed.includes(origin)) || (!origin && req.headers['sec-fetch-site'] === 'cross-site'))) { res.writeHead(403); res.end(); return; }
    if (origin && allowed.includes(origin)) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'content-type,x-toki-token'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); res.writeHead(204); res.end(); return; }
    const url = new URL(req.url, `http://${req.headers.host}`);
    const send = (data, status = 200) => { res.writeHead(status, {'Content-Type': 'application/json', 'Cache-Control': 'no-store'}); res.end(JSON.stringify(data)); };
    try {
      if (url.pathname.startsWith('/api/')) {
        if (url.pathname === '/api/session' && req.method === 'GET') return send({token});
        if (req.headers['x-toki-token'] !== token) throw fault('Vuelve a abrir Apps para conectar el servicio local.', 401);
        if (req.method === 'GET' && url.pathname === '/api/jobs') return send({jobs, phases});
        if (req.method === 'GET' && url.pathname === '/api/adapters') return send({adapters:registry.manifests()});
        if (req.method !== 'POST' || req.headers['content-type'] !== 'application/json') throw fault('Solicitud no válida.', 405);
        let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 16384) throw fault('Solicitud demasiado grande.', 413); }
        let payload; try { payload = JSON.parse(body || '{}'); } catch { throw fault('Solicitud no válida.'); }
        if (!payload || Array.isArray(payload) || typeof payload !== 'object') throw fault('Solicitud no válida.');
        if (url.pathname === '/api/games/open') return send(await gameSessions.open(payload,port));
        if (url.pathname === '/api/games/resume') return send(gameSessions.take(payload.id));
        if (url.pathname === '/api/jobs') {
          const name = String(payload.name || '').trim();
          const tasks = String(payload.tasks || '').trim();
          if (!name || name.length > 160 || tasks.length > 600) throw fault('Indica la app y sus tareas con un texto breve.');
          const sourceUrl=payload.sourceUrl===undefined?null:publicFeedURL(String(payload.sourceUrl)).href;
          const known=registry.find(name);
          if(sourceUrl && known && (!known.manifest.generated || known.manifest.source!==sourceUrl))throw fault('Ese nombre ya pertenece a otra adaptación.',409);
          if(sourceUrl && registry.get(readerId(sourceUrl)) && registry.get(readerId(sourceUrl))!==known)throw fault('Esa fuente ya tiene una adaptación con otro nombre.',409);
          if(sourceUrl && jobs.some(j=>j.sourceUrl===sourceUrl && j.name.toLowerCase()!==name.toLowerCase() && !['cancelled','error'].includes(j.status)))throw fault('Esa fuente ya tiene una solicitud. Abre la app existente.',409);
          const app = known?.manifest.id || 'custom';
          const existing = jobs.find(j => j.name.toLowerCase() === name.toLowerCase() && !['cancelled', 'error'].includes(j.status));
          if (existing) {if(sourceUrl && existing.sourceUrl!==sourceUrl)throw fault('Ya existe una solicitud con ese nombre. Cancélala antes de cambiar su fuente.',409);return send({job: existing});}
          if (jobs.length >= 100) throw fault('El registro está lleno. Pide al equipo que archive solicitudes anteriores.', 409);
          const job = {id: randomUUID(), app, name, tasks, ...(sourceUrl?{sourceUrl}:{}), status: 'queued', stage: 0, evidence: {}, createdAt: new Date().toISOString(), message: 'Solicitud recibida.'};
          jobs.unshift(job); save(); void prepare(job); return send({job}, 201);
        }
        const match = url.pathname.match(/^\/api\/jobs\/([a-f0-9-]+)\/(cancel|retry|review)$/);
        if (match) {
          const job = getJob(match[1]); const action = match[2];
          if (action === 'cancel') { running.get(job.id)?.abort(); running.delete(job.id); for(const c of operations.get(job.id)||[])c.abort(); update(job, {generation:(job.generation||0)+1,status: 'cancelled', message: 'Preparación cancelada. Puedes retomarla cuando quieras.'}); }
          if (action === 'retry') { if (running.has(job.id)) throw fault('La preparación ya está en curso.', 409); job.evidence = {}; void prepare(job); }
          if (action === 'review') {
            const manifest=registry.get(job.app)?.manifest;
            if (!manifest || job.adapterVersion!==manifest.version || job.status !== 'needs_test' || !manifest.requiredEvidence.every(k => job.evidence[k]) || payload.functional !== true || payload.personal !== true) throw fault('Completa las pruebas y la revisión con la persona antes de habilitar.', 409);
            update(job, {stage: 5, status: 'ready', reviewedAt: new Date().toISOString(), message: 'Adaptación habilitada tras la prueba y revisión.'});
          }
          return send({job});
        }
        const route=url.pathname.match(/^\/api\/apps\/([a-z][a-z0-9-]*)\/actions\/([a-z][a-z0-9-]*)$/);
        if(route)return send(await dispatch(route[1],route[2],payload));
        // Compatibility for the existing Spotify shell and earlier clients.
        const action=url.pathname.match(/^\/api\/spotify\/([a-z-]+)$/)?.[1];
        if(action)return send(await dispatch('spotify',action,payload,true));
        throw fault('Acción no disponible.', 404);
      }
      if (url.pathname === '/favicon.ico') { res.writeHead(204); return res.end(); }
      if (req.method !== 'GET' && req.method !== 'HEAD') throw fault('Método no permitido.', 405);
      if (url.pathname === '/prototype-lobby.html') {
        res.writeHead(302, {Location: '/' + url.search, 'Cache-Control': 'no-store'});
        res.end();
        return;
      }
      const path = resolve(site, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
      const preset = /^\/presets\/[\w-]+\.json$/.test(url.pathname);
      if (!path.startsWith(site + '/') || (!preset && !['.html', '.js', '.css', '.svg', '.png', '.jpg', '.webp', '.woff2'].includes(extname(path)))) throw fault('No encontrado.', 404);
      const data = await readFile(path);
      const mime = {'.json': 'application/json', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2'}[extname(path)];
      res.writeHead(200, {'Content-Type': mime, 'Cache-Control': 'no-cache'}); res.end(req.method === 'HEAD' ? undefined : data);
    } catch (e) { send({error: e.status ? e.message : 'No se pudo completar la solicitud.'}, e.status || (e.code === 'ENOENT' ? 404 : 500)); }
  });
  server.on('close', () => { for (const c of running.values()) c.abort(); for(const list of operations.values())for(const c of list)c.abort(); });
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.TOKI_APPS_PORT || 8790);
  const server = createAppsServer({stateDir: process.env.TOKI_APPS_STATE_DIR || defaultDir});
  server.listen(port, '127.0.0.1', () => console.log(`Toki OS: http://127.0.0.1:${server.address().port}/`));
  server.on('error', e => { console.error(e.code === 'EADDRINUSE' ? 'El servicio Apps ya está usando ese puerto.' : e.message); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.close(); server.closeAllConnections(); });
}
