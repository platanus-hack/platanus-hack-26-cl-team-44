// WhatsApp en la TV (puente woki-bridge → wapi). Port de software/toki-os/woki-os.html:849-1223.
// Mismo contrato: REST y SSE en <base>/wa/api/*, token en el header X-Myo-Token.
import { tokenHeaders } from '../config';
import { fold, initialsOf } from '../domain/keyboard';
import { type Card, DEFAULT, EMO, GENERIC, GROUPS, isEmo, REACTS, RULES, toCard, WORDS } from '../domain/phrases';
import { type Api, createApi } from '../net/api';
import { openSse, type SseConnection } from '../net/sse';
import type { Tv } from './tv';
import { CTX0, type WaContact, type WaMsg } from './types';

export const FACE = [
  'linear-gradient(160deg,#5BE584,#1FA348)',
  'linear-gradient(160deg,#64D2FF,#0A84FF)',
  'linear-gradient(160deg,#FF9F0A,#FF375F)',
  'linear-gradient(160deg,#BF5AF2,#5E5CE6)',
  'linear-gradient(160deg,#FFD60A,#FF9F0A)',
  'linear-gradient(160deg,#FF6482,#BF5AF2)',
];
export const digitsOf = (s: unknown) => String(s || '').replace(/\D/g, '');
export const initial = (n: unknown) => (String(n || '?').trim()[0] || '?').toUpperCase();
export const faceOf = (c: { phone?: string; name?: string } | null | undefined) =>
  FACE[
    Math.abs([...(digitsOf(c?.phone) || String(c?.name))].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) | 0, 7)) %
      FACE.length
  ];
export const TICKS: Record<number, string> = { 1: '🕓', 2: '✓', 3: '✓✓', 4: 'leído' };
export const hhmmOf = (t: number) => new Date(t).toTimeString().slice(0, 5);

interface AiSuggestion {
  text: string;
  tone?: string;
  emo?: string;
  traza?: Card['traza'];
}

interface Mention {
  id?: string;
  from: string;
  group: string;
  groupJid?: string;
  mentionJid?: string;
  text: string;
  resumen?: string;
  opciones?: AiSuggestion[];
  estado?: string;
  at?: number;
}

interface IniAi {
  ini: string;
  list: Card[] | null;
  p: Promise<void> | null;
}

const aiCard = (x: AiSuggestion): Card => ({
  text: x.text,
  tone: x.tone || 'sugerida',
  emo: isEmo(x.emo) ? x.emo : 'seria',
  ai: true,
  traza: x.traza || { origen: 'whatsapp' },
});

export class WhatsApp {
  readonly api: Api;
  private sse: SseConnection | null = null;
  private revision = 0;
  private pool: Card[] = [];
  private poolPage = 0;
  private poolAi: AiSuggestion[] | null = null;
  private sug: Record<string, { key: string; list: AiSuggestion[] }> = {};
  private inKey: string | null = null;
  private idem: string | null = null;
  private text = '';
  private sending = false;
  private lastMsg: { id: string; name: string } | null = null;
  private menciones: Record<string, Mention> = {};
  private mentionPend: WaContact | null = null;
  private lastMention: (Mention & { at: number }) | null = null;
  private avisoDesc: ReturnType<typeof setTimeout> | null = null;
  ini: IniAi | null = null;
  private iniTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly tv: Tv) {
    this.api = createApi(tv.cfg.waUrl, tv.cfg.waToken);
  }

  private get to(): WaContact | null {
    return this.tv.s.wa.to;
  }

  private setWa(patch: Partial<Tv['s']['wa']>) {
    this.tv.set((s) => ({ wa: { ...s.wa, ...patch } }));
  }

  // ---------- conexión ----------

  listen() {
    const { waUrl, waToken } = this.tv.cfg;
    if (!waUrl) return;
    this.sse = openSse(`${waUrl}/api/wa/events`, tokenHeaders(waToken), {
      onopen: () => {
        const current = ++this.revision;
        this.setWa({ online: true, session: null });
        void this.loadFavs();
        void this.reviewMentions();
        this.api<{ session?: string }>('/api/wa/health')
          .then((h) => {
            if (this.revision === current) this.setWa({ session: h.session ?? null });
          })
          .catch(() => {});
      },
      onerror: () => {
        ++this.revision;
        if (this.tv.s.wa.online) this.tv.log('WhatsApp sin conexión');
        this.setWa({ online: false, session: null });
      },
      onmessage: (m) => this.onEvent(m.data),
    });
  }

  stop() {
    this.sse?.close();
    this.sse = null;
  }

  private onEvent(data: string) {
    let ev: Record<string, unknown>;
    try {
      ev = JSON.parse(data);
    } catch {
      return;
    }
    const cid = String(ev.contactId ?? '');
    if (ev.type === 'chat' && ev.msg) this.addMsg(cid, ev.msg as WaMsg);
    if (ev.type === 'mention') this.mention(ev as unknown as Mention);
    if (ev.type === 'mention_estado' && ev.estado === 'respondida') this.mentionAnswered(String(ev.id));
    if (ev.type === 'suggest' && Array.isArray(ev.suggestions)) {
      this.sug[cid] = { key: String(ev.key), list: ev.suggestions as AiSuggestion[] };
      if (this.tv.s.screen === 'talk' && this.to?.id === cid && this.lastKey(cid) === ev.key)
        this.applyAi(cid, ev.suggestions as AiSuggestion[]);
    }
    if (ev.type === 'incoming')
      this.incoming(ev as unknown as { contactId: string; name: string; relation?: string; text: string; key: string });
    if (ev.type === 'status') {
      const hist = this.tv.s.wa.hist[cid];
      const h = hist?.find((x) => x.msgId === ev.msgId);
      if (h) {
        const next = hist.map((x) => (x === h ? { ...x, status: Number(ev.status) } : x));
        this.setWa({ hist: { ...this.tv.s.wa.hist, [cid]: next } });
      }
      if (this.lastMsg && ev.msgId === this.lastMsg.id) {
        if (ev.status === 4) this.tv.island('✓✓', `${this.lastMsg.name} lo leyó`);
        if (ev.status === 0) this.tv.island('⚠️', 'WhatsApp no pudo entregar el mensaje', true, 4000);
      }
    }
    if (ev.type === 'session' && ev.status) {
      ++this.revision;
      const status = String(ev.status);
      this.setWa({ session: status });
      // Aviso solo si sigue desconectado a los 15 s: un reinicio del puente se recupera en ~3 s.
      if (this.avisoDesc) clearTimeout(this.avisoDesc);
      if (status !== 'connected')
        this.avisoDesc = setTimeout(() => {
          if (this.tv.s.wa.session !== 'connected') this.tv.island('⚠️', 'WhatsApp se desconectó', true, 5000);
        }, 15000);
    }
  }

  async loadFavs() {
    if (!this.tv.cfg.waUrl) return;
    try {
      const j = await this.api<{ contacts?: WaContact[] }>('/api/wa/favorites');
      this.setWa({ favs: j.contacts || [] });
    } catch (e) {
      this.tv.log(`WhatsApp: ${(e as Error).message}`);
    }
  }

  private addMsg(cid: string, m: WaMsg) {
    const a = this.tv.s.wa.hist[cid] || [];
    if (a.some((x) => x.id === m.id)) return;
    const next = [...a, m].slice(-60);
    this.setWa({ hist: { ...this.tv.s.wa.hist, [cid]: next } });
  }

  private async loadHistory(cid: string) {
    if (String(cid).startsWith('g:')) return; // grupo: el historial lo trae la mención
    try {
      const j = await this.api<{ messages?: WaMsg[] }>(`/api/wa/history?contactId=${encodeURIComponent(cid)}`);
      this.setWa({ hist: { ...this.tv.s.wa.hist, [cid]: j.messages || [] } });
    } catch {
      // sin historial
    }
  }

  private lastKey(cid: string) {
    const h = this.tv.s.wa.hist[cid] || [];
    return h.length ? h[h.length - 1].id : '-';
  }

  // ---------- chat ----------

  /** Empieza un mensaje para un contacto principal (elegido por la persona o porque ese contacto escribió). */
  start(c: WaContact, { text = '', key = null as string | null } = {}) {
    if (!c) return;
    this.setWa({ to: c });
    this.inKey = key;
    this.idem = null;
    this.tv.setCtx(
      key ? `${c.name} dice` : `Para ${c.name}`,
      initial(c.name),
      text,
      key ? CTX0.ph : 'Contexto (opcional)',
      faceOf(c),
    );
    this.tv.set({ cards: [] });
    this.poolAi = null;
    void this.loadHistory(c.id).then(() => {
      if (this.to === c && this.tv.s.screen === 'talk') void this.aiReplies();
    });
    this.tv.go('talk');
  }

  reset() {
    if (!this.to) return;
    this.setWa({ to: null });
    this.inKey = null;
    this.idem = null;
    this.tv.set((s) => ({ ctx: CTX0, cards: [], kb: { ...s.kb, mode: 'text' } }));
  }

  /** Persona de cuidado entre los contactos principales; si no hay, ''. */
  private helper(): string {
    const h = this.tv.s.wa.favs.find((c) => /cuidador|acompa|enfermer/i.test(c.relation || ''));
    return h ? h.name.split(' ')[0] : '';
  }

  setPool(cards: Card[], generic: boolean, fromLocal = false) {
    if (fromLocal) this.poolAi = null;
    const seen = new Set<string>();
    const pool: Card[] = [];
    const extra = this.tv.pickVariants('wa-default', DEFAULT).map(toCard);
    for (const c of [
      ...(generic ? GENERIC.map(toCard) : []),
      ...cards,
      ...(generic ? [] : GENERIC.map(toCard)),
      ...extra,
    ])
      if (!seen.has(c.text)) {
        seen.add(c.text);
        pool.push(c);
      }
    this.pool = pool;
    this.poolPage = 0;
    this.page();
  }

  setPoolDirect(cards: Card[]) {
    this.pool = cards;
    this.poolPage = 0;
    this.page();
  }

  private page() {
    const n = Math.max(1, Math.ceil(this.pool.length / 2));
    const p = this.poolPage % n;
    const two = this.pool.slice(p * 2, p * 2 + 2);
    const who = this.helper();
    this.tv.set({
      cards: [
        ...two,
        who
          ? { text: `Pregúntele a ${who}.`, tone: 'lo decide tu acompañante', emo: 'seria', plain: true }
          : { text: 'Después te respondo.', tone: 'lo dejo para después', emo: 'seria', plain: true },
      ],
    });
  }

  morePage() {
    this.poolPage += 1;
    this.page();
  }

  private async waAi(body: Record<string, unknown>, ms = 15000) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    try {
      return await this.api<{ suggestions?: AiSuggestion[]; key?: string }>('/api/wa/suggest', {
        body,
        signal: ctl.signal,
      });
    } finally {
      clearTimeout(t);
    }
  }

  /** Las 2 tarjetas del contexto: primero lo local y, cuando Claude responde, se reemplazan. */
  async aiReplies() {
    const c = this.to;
    if (!c || !this.tv.cfg.waUrl) return;
    const key = this.lastKey(c.id);
    const cached = this.sug[c.id];
    if (cached && cached.key === key) {
      this.applyAi(c.id, cached.list);
      return;
    }
    const ctx = this.tv.s.ctx.val.trim();
    const last = (this.tv.s.wa.hist[c.id] || []).slice(-1)[0];
    const extra = ctx && !(last && last.text === ctx) ? ctx : '';
    this.tv.set({ aiWait: true });
    try {
      const j = await this.waAi({ contactId: c.id, context: extra });
      if (j.suggestions?.length) {
        this.sug[c.id] = { key: String(j.key), list: j.suggestions };
        this.applyAi(c.id, j.suggestions);
      }
    } catch {
      this.tv.log('Claude no respondió: quedan las sugerencias locales');
    } finally {
      this.tv.set({ aiWait: false });
    }
  }

  private applyAi(cid: string, list: AiSuggestion[]) {
    if (!this.to || this.to.id !== cid || this.tv.s.kb.mode === 'ini') return;
    if (this.poolAi && this.poolAi === list) return;
    this.poolAi = list;
    this.setPool(list.map(aiCard), false);
    this.tv.set({ aiWait: false });
  }

  /** Pantalla de confirmación: destinatario y texto en grande. Se envía solo con la doble ceja. */
  openAgent(text: string) {
    const c = this.to;
    if (!c) return;
    this.text = text;
    this.idem = crypto.randomUUID();
    this.tv.set({
      agent: {
        pending: false,
        title: `${this.inKey ? 'Responder a ' : 'Escribir a '}${c.name}`,
        to: c.name + (c.relation ? ` (${c.relation})` : ''),
        msg: text,
        av: initial(c.name),
        bg: faceOf(c),
      },
    });
    this.tv.go('agent');
  }

  async send() {
    const c = this.to;
    const tv = this.tv;
    if (!c) {
      tv.island('⚠️', 'Primero elige a quién escribir', true);
      tv.go('contacts');
      return;
    }
    if (c.respondida) {
      tv.island('✓', `Ya se respondió en «${c.name}»`, false, 4000);
      tv.go('home');
      return;
    }
    if (this.sending) return;
    this.sending = true;
    tv.island('…', `Enviando a ${c.name}…`, false, 0);
    try {
      const msg = c.group
        ? {
            groupJid: c.group,
            mention: c.mention,
            mentionId: c.mentionId || undefined,
            text: this.text,
            idemKey: this.idem,
          }
        : { contactId: c.id, text: this.text, idemKey: this.idem };
      const j = await this.api<{ msgId: string; dry?: boolean }>('/api/wa/send', { body: msg });
      this.lastMsg = { id: j.msgId, name: c.name };
      tv.island('✓', j.dry ? `Enviado a ${c.name} (prueba)` : `Enviado a ${c.name}`);
      tv.mem.add(this.text);
      tv.log(`WhatsApp → ${c.name}`);
      if (c.mentionId && this.menciones[c.mentionId]) this.menciones[c.mentionId].estado = 'respondida';
      tv.go('home');
    } catch (e) {
      const message = (e as Error).message;
      if (c.mentionId && /Ya se respondió|Otra pantalla/.test(message)) {
        c.respondida = true;
        tv.island('✓', message, false, 5000);
        tv.go('home');
      } else tv.island('⚠️', `No se envió: ${message}`, true, 5000);
      tv.log(`WhatsApp error: ${message}`);
    } finally {
      this.sending = false;
    }
  }

  private incoming(ev: { contactId: string; name: string; relation?: string; text: string; key: string }) {
    const c = this.tv.s.wa.favs.find((x) => x.id === ev.contactId) || {
      id: ev.contactId,
      name: ev.name,
      relation: ev.relation,
      phone: '',
    };
    this.tv.log(`WhatsApp ← ${c.name}`);
    this.tv.island('💬', `${c.name}: ${ev.text}`, false, 6000);
    // Nunca interrumpe una alarma ni una confirmación en curso.
    if (!this.tv.isBusyForInterruptions()) this.start(c, { text: ev.text, key: ev.key });
  }

  // ---------- menciones en grupos ----------

  private mention(ev: Mention) {
    if (ev.id) {
      if (this.menciones[ev.id]) return;
      this.menciones[ev.id] = ev;
    }
    if (ev.estado === 'respondida') return;
    const at = Date.now();
    this.lastMention = { ...ev, at };
    this.setWa({ mention: { from: ev.from, group: ev.group, at } });
    this.tv.island('@', `${ev.from} te mencionó en «${ev.group}»: ${ev.resumen || ev.text}`, false, 10000);
    this.tv.log(`mención en «${ev.group}»${ev.opciones ? ' · el agente preparó respuestas' : ''}`);
    if (!(ev.opciones?.length && ev.groupJid)) return;
    const g: WaContact = {
      id: `g:${ev.groupJid}`,
      name: ev.group,
      relation: 'grupo',
      phone: '',
      group: ev.groupJid,
      mention: ev.mentionJid || '',
      mentionId: ev.id || '',
    };
    this.mentionPend = g;
    const mid = `mention-${at}`;
    this.setWa({
      hist: { ...this.tv.s.wa.hist, [g.id]: [{ id: mid, dir: 'in', text: `${ev.from}: ${ev.text}`, at }] },
    });
    this.sug[g.id] = { key: mid, list: ev.opciones };
    if (this.tv.isBusyForInterruptions()) return;
    this.openMention(g);
  }

  private openMention(g: WaContact) {
    const ev = (g.mentionId && this.menciones[g.mentionId]) || this.lastMention;
    this.mentionPend = null;
    if (!ev || ev.estado === 'respondida') return;
    this.start(g, { text: ev.text, key: this.sug[g.id]?.key ?? null });
    this.tv.setCtx(
      `${ev.from} te mencionó en ${ev.group}`,
      initial(ev.from),
      ev.text,
      CTX0.ph,
      faceOf({ name: ev.from }),
    );
  }

  /** Menciones de los últimos 10 minutos. Al conectarse y al salir de la calibración. */
  async reviewMentions() {
    if (!this.tv.cfg.waUrl) return;
    let list: Mention[] = [];
    try {
      list = (await this.api<{ mentions?: Mention[] }>('/api/wa/mentions')).mentions || [];
    } catch (e) {
      this.tv.log(`WhatsApp menciones: ${(e as Error).message}`);
      return;
    }
    for (const m of list)
      if (m.id && this.menciones[m.id] && m.estado === 'respondida' && this.menciones[m.id].estado !== 'respondida')
        this.mentionAnswered(m.id);
    // Solo cuenta la más reciente que esta TV no vio; las más viejas quedan como vistas.
    const nuevas = list.filter((m) => m.estado === 'pendiente' && m.id && !this.menciones[m.id]);
    for (const m of nuevas.slice(1)) if (m.id) this.menciones[m.id] = m;
    const pendAt = this.mentionPend?.mentionId ? this.menciones[this.mentionPend.mentionId]?.at || 0 : 0;
    if (nuevas[0] && (!this.mentionPend || (nuevas[0].at || 0) > pendAt)) {
      this.mention(nuevas[0]);
      return;
    }
    const g = this.mentionPend;
    if (g && !this.tv.isBusyForInterruptions()) this.openMention(g);
  }

  /** Otra TV respondió: esta la marca como respondida y no deja enviar otra vez. */
  private mentionAnswered(id: string) {
    const m = this.menciones[id];
    if (m) m.estado = 'respondida';
    if (this.mentionPend?.mentionId === id) this.mentionPend = null;
    const to = this.to;
    if (!to || to.mentionId !== id || this.sending) return;
    to.respondida = true;
    this.tv.island('✓', `Ya se respondió en «${to.name}»`, false, 5000);
    this.tv.log('mención respondida desde otra pantalla');
    if (this.tv.s.screen === 'agent' || this.tv.s.screen === 'talk') {
      this.reset();
      this.tv.go('home');
    }
  }

  // ---------- teclado por iniciales ----------

  /** Predicción paso a paso: con cada letra se pide a Claude, con 300 ms de espera. */
  iniAsk() {
    const c = this.to;
    const ini = this.tv.s.kb.ini;
    if (this.iniTimer) clearTimeout(this.iniTimer);
    if (!c || !ini || !this.tv.cfg.waUrl) {
      this.ini = null;
      return;
    }
    if (this.ini && this.ini.ini === ini) return;
    const ai: IniAi = { ini, list: null, p: null };
    this.ini = ai;
    this.iniTimer = setTimeout(() => {
      if (this.ini !== ai) return;
      ai.p = this.waAi({ contactId: c.id, initials: ini })
        .then((j) => {
          ai.list = (j.suggestions || []).map(aiCard);
        })
        .catch(() => {
          ai.list = [];
        })
        .finally(() => this.tv.set((s) => ({ kbTick: s.kbTick + 1 })));
    }, 300);
  }

  private corpus() {
    const out: { text: string; tone: string; emo: string; w: number }[] = [];
    const add = (t: string, tone: string, emo: string, w: number) => {
      if (t && !out.some((x) => x.text === t)) out.push({ text: t, tone, emo, w });
    };
    for (const m of Object.values(this.tv.s.wa.hist).flat())
      if (m.dir === 'out') add(m.text, 'ya lo escribiste', 'seria', 3);
    for (const p of this.tv.mem.m.phrases) add(p.t, 'ya lo dijiste', 'seria', 2);
    for (const r of RULES) for (const s of r.s.flat()) add(s[0], s[1], s[2], 1);
    for (const s of [...GENERIC, ...DEFAULT.flat()]) add(s[0], s[1], s[2], 1);
    for (const r of REACTS) add(r[1][0].toUpperCase() + r[1].slice(1), 'reacción', r[2], 0);
    return out;
  }

  iniLocal(ini: string): Card[] {
    const q = fold(ini);
    if (!q) return [];
    const hits = this.corpus()
      .map((c) => {
        const k = initialsOf(c.text);
        return { c, exact: k === q, pre: k.startsWith(q) };
      })
      .filter((x) => x.pre)
      .sort((a, b) => Number(b.exact) - Number(a.exact) || b.c.w - a.c.w)
      .map((x) => ({ text: x.c.text, tone: x.c.tone, emo: isEmo(x.c.emo) ? x.c.emo : 'seria' }) as Card);
    if (hits.length < 4) {
      // palabra por palabra con las palabras más usadas que empiezan con cada letra
      const words = [...q].map((l) => this.tv.mem.top(l)[0] || WORDS.find((w) => fold(w)[0] === l) || l);
      const t = words.join(' ');
      hits.push({ text: `${t[0].toUpperCase()}${t.slice(1)}.`, tone: 'palabra por palabra', emo: 'seria' });
    }
    return hits.slice(0, 6);
  }

  /** Claude primero (si ya llegó para estas letras), luego lo local. */
  iniCandidates(): Card[] {
    const ini = this.tv.s.kb.ini;
    const ai = this.ini && this.ini.ini === ini && this.ini.list ? this.ini.list : [];
    const seen = new Set<string>();
    const out: Card[] = [];
    for (const c of [...ai, ...this.iniLocal(ini)])
      if (!seen.has(c.text)) {
        seen.add(c.text);
        out.push(c);
      }
    return out;
  }

  iniWaiting(): boolean {
    return !!this.ini && this.ini.ini === this.tv.s.kb.ini && !this.ini.list;
  }

  /** Imán dirigido: peso de cada grupo según la próxima inicial más probable. woki-os.html:950-958 */
  likelyGroups(): { prior: string; likely: boolean }[] {
    const ini = fold(this.tv.s.kb.ini);
    const next = new Map<string, number>();
    this.iniCandidates()
      .slice(0, 6)
      .forEach((c, i) => {
        const k = initialsOf(c.text);
        if (k.startsWith(ini) && k.length > ini.length) {
          const l = k[ini.length];
          next.set(l, (next.get(l) || 0) + (6 - i));
        }
      });
    const ws = GROUPS.map((g) => {
      const gf = fold(g);
      let w = 0;
      for (const [l, v] of next) if (gf.includes(l)) w += v;
      return w;
    });
    const top = Math.max(0, ...ws);
    return ws.map((w) => ({ prior: w ? (1 + Math.min(0.8, w / 12)).toFixed(2) : '1', likely: w === top && top >= 4 }));
  }

  async kbExpand() {
    const tv = this.tv;
    const ini = tv.s.kb.ini;
    if (!ini) {
      tv.island('🔤', 'Elige al menos una letra', true);
      return;
    }
    let out: Card[] | null = null;
    const c = this.to;
    if (c && tv.cfg.waUrl) {
      if (!this.ini || this.ini.ini !== ini || (!this.ini.p && !this.ini.list)) {
        if (this.iniTimer) clearTimeout(this.iniTimer);
        const ai: IniAi = { ini, list: null, p: null };
        this.ini = ai;
        ai.p = this.waAi({ contactId: c.id, initials: ini })
          .then((j) => {
            ai.list = (j.suggestions || []).map(aiCard);
          })
          .catch(() => {
            ai.list = [];
          });
      }
      if (!this.ini.list) {
        tv.island('✨', 'Completando la frase…', false, 0);
        await Promise.race([this.ini.p, new Promise((r) => setTimeout(r, 9000))]);
        tv.island('✨', 'Listo', false, 600);
      }
      const cand = this.iniCandidates();
      if (cand.length)
        out = cand.slice(0, 6).map((x) => ({
          text: x.text,
          tone: x.tone,
          emo: x.emo,
          ai: x.ai,
          traza: x.traza || (x.ai ? null : { origen: 'local', nota: 'frases locales por iniciales' }),
        }));
    }
    if (!out?.length) out = this.iniLocal(ini).map((x) => ({ text: x.text, tone: x.tone, emo: x.emo }));
    tv.set((s) => ({ kb: { ...s.kb, mode: 'text' } }));
    this.setPoolDirect(out);
    tv.log(`iniciales ${ini.toUpperCase()} → ${out.length} frases`);
    tv.go('talk');
  }

  // ---------- panel del acompañante ----------

  async openPanel() {
    if (!this.tv.cfg.waUrl) {
      this.tv.island('⚠️', 'WhatsApp no está configurado', true);
      return;
    }
    this.tv.pointer.clearFocus();
    this.tv.set({ panelOpen: true });
  }

  closePanel() {
    this.tv.set({ panelOpen: false });
  }

  setFavs(favs: WaContact[]) {
    this.setWa({ favs });
  }
}

export { EMO };
