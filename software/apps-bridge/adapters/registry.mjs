// Trusted implementations only: bundled modules or validated data using the RSS kernel.
export function createAdapterRegistry(adapters) {
  const byId = new Map(), byName = new Map();
  function register(adapter) {
    const m = adapter.manifest;
    if (!m || !/^[a-z][a-z0-9-]*$/.test(m.id) || !m.version || !m.name || !m.interface?.entry ||
        !Array.isArray(m.actions) || !Array.isArray(m.requiredEvidence) ||
        typeof adapter.prepare !== 'function' || typeof adapter.execute !== 'function') throw Error('Invalid adapter contract');
    if (byId.has(m.id) || new Set(m.actions.map(a=>a.id)).size !== m.actions.length ||
        m.actions.some(a=>! /^[a-z][a-z0-9-]*$/.test(a.id))) throw Error('Duplicate or invalid adapter/action');
    const names=[m.id,m.name,...(m.aliases||[])].map(name=>name.trim().toLowerCase());
    if(names.some(key=>byName.has(key)))throw Error('Ambiguous adapter name');
    byId.set(m.id, adapter);
    for (const name of [m.id, m.name, ...(m.aliases || [])]) {
      const key = name.trim().toLowerCase();
      if (byName.has(key) && byName.get(key) !== adapter) throw Error('Ambiguous adapter name');
      byName.set(key, adapter);
    }
  }
  for(const adapter of adapters)register(adapter);
  return {register,get:id=>byId.get(id), find:name=>byName.get(String(name).trim().toLowerCase()), manifests:()=>[...byId.values()].map(a=>a.manifest)};
}
