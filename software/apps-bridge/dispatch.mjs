export function createAdapterDispatcher({registry, jobs, fault}) {
  const busyAdapters = new Set();

  return async function dispatch(appId, action, payload, legacy = false) {
    const adapter = registry.get(appId);
    const capability = adapter?.manifest.actions.find(item => item.id === action);
    if (!adapter || !capability) throw fault('Acción no disponible.', 404);
    const job = payload.jobId ? jobs.getJob(payload.jobId) : undefined;
    if (!legacy && !job) throw fault('Prepara esta adaptación antes de usarla.', 409);
    if (job && (job.app !== appId || !['needs_connection','needs_test','ready'].includes(job.status))) {
      throw fault('Prepara esta adaptación antes de usar sus controles.', 409);
    }
    if (job && capability.requiresAccount && job.status === 'needs_connection') throw fault('Conecta la cuenta antes de usar esta función.', 409);
    if (job?.adapterVersion && job.adapterVersion !== adapter.manifest.version) throw fault('La adaptación cambió de versión. Vuelve a prepararla.', 409);
    if (capability.mutates && busyAdapters.has(appId)) throw fault('Hay una operación en curso. Espera un momento.', 409);
    if (capability.mutates) busyAdapters.add(appId);
    const generation = job?.generation;
    const controller = new AbortController();
    const pending = jobs.operations.get(job?.id) || new Set();
    pending.add(controller);
    jobs.operations.set(job?.id, pending);
    const current = () => job && job.generation === generation && !['cancelled','error','interrupted'].includes(job.status);
    try {
      return await adapter.execute(action, payload, {
        signal: controller.signal,
        generation,
        evidence: key => jobs.evidence(job, key, generation),
        connected: () => {
          if (current()) jobs.update(job, {stage: 3, status: 'needs_test', message: 'Cuenta conectada. Prueba las funciones con tu control.'});
        },
        disconnected: () => {
          for (const item of jobs.jobs.filter(candidate => candidate.app === appId && candidate.status !== 'cancelled')) {
            jobs.update(item, {generation: (item.generation || 0) + 1, status: 'needs_connection', stage: 2, evidence: {}, message: 'Sesión desconectada.'});
          }
        }
      });
    } catch (error) {
      if (error.status) throw error;
      throw fault(adapter.errorMessage?.(error) || 'No se pudo completar la operación. Vuelve a intentarlo.', 502);
    } finally {
      if (capability.mutates) busyAdapters.delete(appId);
      pending.delete(controller);
      if (!pending.size) jobs.operations.delete(job?.id);
    }
  };
}
