import {existsSync, mkdirSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {packageAdapter, readerId} from './generator/packages.mjs';
import {publicFeedURL} from './generator/public-fetch.mjs';

export const phases = ['Integración encontrada', 'Interfaz preparada', 'Cuenta conectada', 'Funciones comprobadas', 'Prueba y revisión'];

export function createJobLifecycle({stateDir, registry, packageStore, readerFetch, buildReader, fetcher, site, fault}) {
  mkdirSync(stateDir, {recursive: true, mode: 0o700});
  const loaded = packageStore.load();
  for (const pkg of loaded.packages) {
    try { registry.register(packageAdapter(pkg.spec, {fetcher: readerFetch})); }
    catch { loaded.errors.push({id: pkg.spec.id}); }
  }
  const stateFile = join(stateDir, 'requests.json');
  let jobs = [];
  try {
    const saved = JSON.parse(readFileSync(stateFile, 'utf8'));
    if (Array.isArray(saved)) jobs = saved;
  } catch (e) {
    if (e.code !== 'ENOENT') throw fault('No se pudo leer el registro de solicitudes. Conserva el archivo antes de repararlo.', 500);
  }
  for (const job of jobs) if (['preparing','queued'].includes(job.status)) {
    job.status = 'interrupted';
    job.message = 'La preparación se interrumpió. Puedes reintentar.';
  }
  for (const job of jobs) {
    const adapter = registry.find(job.name);
    if (adapter && job.app === 'custom') {
      job.app = adapter.manifest.id;
      job.status = 'interrupted';
      job.message = 'Hay una adaptación disponible. Vuelve a prepararla.';
    }
    if (job.app === 'spotify' && !job.adapterVersion) job.adapterVersion = '1.0.0';
  }
  for (const job of jobs) if (loaded.errors.some(error => error.id === job.app)) {
    job.status = 'error';
    job.evidence = {};
    job.message = 'El paquete guardado no superó la validación. Vuelve a prepararlo.';
  }

  const running = new Map();
  const operations = new Map();
  const save = () => {
    const tmp = stateFile + '.tmp';
    writeFileSync(tmp, JSON.stringify(jobs, null, 2), {mode: 0o600});
    renameSync(tmp, stateFile);
  };
  save();
  function update(job, patch) { Object.assign(job, patch, {updatedAt: new Date().toISOString()}); save(); }
  function getJob(id) {
    const job = jobs.find(item => item.id === id);
    if (!job) throw fault('Solicitud no encontrada.', 404);
    return job;
  }
  function evidence(job, key, generation) {
    const adapter = job && registry.get(job.app);
    if (!adapter || job.generation !== generation || ['cancelled','error','interrupted'].includes(job.status)) return;
    if (!adapter.manifest.requiredEvidence.includes(key)) return;
    job.evidence[key] = new Date().toISOString();
    const checked = adapter.manifest.requiredEvidence.every(item => job.evidence[item]);
    update(job, checked && job.status === 'needs_test'
      ? {stage: 4, message: 'Funciones comprobadas. Falta la revisión y la prueba con la persona.'}
      : {});
  }

  async function prepare(job) {
    const controller = new AbortController();
    running.set(job.id, controller);
    const current = () => running.get(job.id) === controller && !controller.signal.aborted;
    update(job, {generation: (job.generation || 0) + 1, status: 'preparing', stage: 0, message: 'Buscando una integración para tus tareas…'});
    try {
      const adapter = registry.get(job.app);
      if (!adapter && job.sourceUrl) {
        update(job, {buildStep: 'queued', message: 'Esperando turno para preparar la adaptación…'});
        const result = await buildReader({name: job.name, tasks: job.tasks, sourceUrl: job.sourceUrl}, {
          signal: controller.signal,
          report: patch => { if (current()) update(job, patch); }
        });
        if (!current()) return;
        if (result.unsupported) {
          update(job, {status: 'needs_adapter', stage: 1, message: result.message, unsupportedTasks: result.unsupportedTasks});
          return;
        }
        const manifest = result.adapter.manifest;
        if (registry.get(manifest.id) || registry.find(manifest.name)) throw fault('Esta fuente o nombre ya tiene una adaptación. Abre la app existente.', 409);
        const receipt = packageStore.install(result.pkg);
        registry.register(result.adapter);
        update(job, {app: manifest.id, adapterVersion: manifest.version, packageDigest: receipt.digest, status: 'needs_test', stage: 4, buildStep: 'installed', evidence: result.evidence, message: 'Adaptación instalada y funciones comprobadas. Falta probarla contigo.'});
        return;
      }
      if (!adapter) {
        const query = `${job.name} cli`;
        const timeout = AbortSignal.timeout(12000);
        const response = await fetcher(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=4`, {
          headers: {Accept: 'application/vnd.github+json', 'User-Agent': 'Myo-app-adapter'},
          signal: AbortSignal.any([controller.signal, timeout])
        });
        if (!response.ok) throw fault('La búsqueda de integraciones no respondió. Reintenta más tarde.');
        const data = await response.json();
        if (!current()) return;
        const candidates = (data.items || []).map(item => ({name: item.full_name, url: item.html_url, description: String(item.description || '').slice(0, 250)}));
        update(job, {status: 'needs_adapter', stage: 0, candidates, message: candidates.length
          ? 'Encontramos posibles integraciones. El equipo debe comprobarlas y crear tu adaptación.'
          : 'Solicitud guardada. El equipo investigará cómo conectar esta app.'});
        return;
      }
      if (!['music','news','video','food'].includes(adapter.manifest.interface.kind) || !existsSync(join(site, 'toki-apps.js'))) throw fault('Falta la interfaz de la adaptación.');
      const result = await adapter.prepare({signal: controller.signal, report: patch => { if (current()) update(job, patch); }});
      if (current()) update(job, {...result, adapterVersion: adapter.manifest.version});
    } catch (error) {
      if (current()) update(job, {status: 'error', message: error.status
        ? error.message
        : (registry.get(job.app)?.errorMessage?.(error) || 'No se pudo preparar esta app. Vuelve a intentarlo.')});
    } finally {
      if (running.get(job.id) === controller) running.delete(job.id);
    }
  }

  function create(payload) {
    const name = String(payload.name || '').trim();
    const tasks = String(payload.tasks || '').trim();
    if (!name || name.length > 160 || tasks.length > 600) throw fault('Indica la app y sus tareas con un texto breve.');
    const sourceUrl = payload.sourceUrl === undefined ? null : publicFeedURL(String(payload.sourceUrl)).href;
    const known = registry.find(name);
    if (sourceUrl && known && (!known.manifest.generated || known.manifest.source !== sourceUrl)) throw fault('Ese nombre ya pertenece a otra adaptación.', 409);
    if (sourceUrl && registry.get(readerId(sourceUrl)) && registry.get(readerId(sourceUrl)) !== known) throw fault('Esa fuente ya tiene una adaptación con otro nombre.', 409);
    if (sourceUrl && jobs.some(job => job.sourceUrl === sourceUrl && job.name.toLowerCase() !== name.toLowerCase() && !['cancelled','error'].includes(job.status))) {
      throw fault('Esa fuente ya tiene una solicitud. Abre la app existente.', 409);
    }
    const app = known?.manifest.id || 'custom';
    const existing = jobs.find(job => job.name.toLowerCase() === name.toLowerCase() && !['cancelled','error'].includes(job.status));
    if (existing) {
      if (sourceUrl && existing.sourceUrl !== sourceUrl) throw fault('Ya existe una solicitud con ese nombre. Cancélala antes de cambiar su fuente.', 409);
      return {job: existing, created: false};
    }
    if (jobs.length >= 100) throw fault('El registro está lleno. Pide al equipo que archive solicitudes anteriores.', 409);
    const job = {id: randomUUID(), app, name, tasks, ...(sourceUrl ? {sourceUrl} : {}), status: 'queued', stage: 0, evidence: {}, createdAt: new Date().toISOString(), message: 'Solicitud recibida.'};
    jobs.unshift(job);
    save();
    void prepare(job);
    return {job, created: true};
  }
  function cancel(job) {
    running.get(job.id)?.abort();
    running.delete(job.id);
    for (const controller of operations.get(job.id) || []) controller.abort();
    update(job, {generation: (job.generation || 0) + 1, status: 'cancelled', message: 'Preparación cancelada. Puedes retomarla cuando quieras.'});
  }
  function retry(job) {
    if (running.has(job.id)) throw fault('La preparación ya está en curso.', 409);
    job.evidence = {};
    void prepare(job);
  }
  function review(job, payload) {
    const manifest = registry.get(job.app)?.manifest;
    if (!manifest || job.adapterVersion !== manifest.version || job.status !== 'needs_test'
      || !manifest.requiredEvidence.every(key => job.evidence[key]) || payload.functional !== true || payload.personal !== true) {
      throw fault('Completa las pruebas y la revisión con la persona antes de habilitar.', 409);
    }
    update(job, {stage: 5, status: 'ready', reviewedAt: new Date().toISOString(), message: 'Adaptación habilitada tras la prueba y revisión.'});
  }
  function close() {
    for (const controller of running.values()) controller.abort();
    for (const list of operations.values()) for (const controller of list) controller.abort();
  }
  return {jobs, loaded, running, operations, getJob, update, evidence, create, prepare, cancel, retry, review, close};
}
