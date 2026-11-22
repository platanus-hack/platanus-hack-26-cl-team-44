// woki-bridge/vistos.ts · Conjunto con vencimiento y tope: ids ya vistos (reintentos de wapi) y claves de envío usadas.
// Solo en memoria. Cada id vale ttlMs desde que entra; si se pasa de max, sale primero el más viejo.
export class Vistos {
  private m = new Map<string, number>();   // id → cuándo entró; el Map guarda el orden de entrada (el más viejo primero)
  constructor(private ttlMs: number, private max: number, private now: () => number = Date.now) {}
  has(id: string) {
    const at = this.m.get(id);
    if (at === undefined) return false;
    if (this.now() - at < this.ttlMs) return true;
    this.m.delete(id); return false;
  }
  add(id: string) {
    const t = this.now();
    this.m.delete(id); this.m.set(id, t);
    for (const [k, at] of this.m) { if (t - at < this.ttlMs) break; this.m.delete(k); }   // vencidos: siempre al inicio
    while (this.m.size > this.max) this.m.delete(this.m.keys().next().value!);
  }
  get size() { return this.m.size; }
}
