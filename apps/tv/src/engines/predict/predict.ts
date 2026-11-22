/**
 * Predicción de palabras en español, sin conexión y en el dispositivo.
 * Port de software/toki-os/predict.js. Mismo algoritmo y misma clave de almacenamiento.
 *
 * - Con contexto: bigramas (lo que la persona dijo y las frases base), con "Stupid Backoff".
 * - Sin contexto: 0,4 × P(palabra), mezcla de la frecuencia de la persona y la del diccionario.
 * - Aprende cada frase dicha, con olvido lento (vida media de 60 días).
 * - Recuerda nombres propios con mayúscula. Ignora tildes al comparar. Tolera un error de tipeo.
 */

const STORE_KEY = 'woki.pred.v1';
const BACKOFF = 0.4;
const HALF_LIFE_DAYS = 60;
const TYPO_PENALTY = 0.15;
const TYPO_MIN_LEN = 4;
const VARIANT_MIN_SHARE = 0.25;
const MAX_UNI = 4000;
const MAX_BI = 12000;
const START = '<s>';
const DAY = 864e5;

const DIACRITICS_EXCEPT_TILDE = /(?!̃)[̀-ͯ]/g;

/** Minúsculas y sin tildes (á→a, ü→u). La ñ se conserva: "año" ≠ "ano". */
export function normalize(s: string): string {
  return String(s).toLowerCase().normalize('NFD').replace(DIACRITICS_EXCEPT_TILDE, '').normalize('NFC');
}

const WORD_RE = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g;
const capitalize = (w: string) => w.charAt(0).toLocaleUpperCase('es') + w.slice(1);

/** Distancia de Damerau-Levenshtein acotada: ¿a y b están a 1 edición o menos? */
export function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  while (i < la && i < lb && a[i] === b[i]) i++;
  if (la === lb)
    return (
      a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2))
    );
  return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

interface UniEntry {
  w: string;
  c: number;
  t: number;
  cap?: number;
  low?: number;
  name?: boolean;
}
interface BiEntry {
  c: number;
  t: number;
}
interface State {
  v: 1;
  uni: Record<string, UniEntry>;
  bi: Record<string, BiEntry>;
  total: number;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface Suggestion {
  word: string;
  name: boolean;
  score: number;
}

export interface Predictor {
  suggest(prevWord: string, prefix: string, limit?: number): Suggestion[];
  learn(text: string): void;
  format(word: string, opts?: { sentenceStart?: boolean; name?: boolean }): string;
  stats(): { userWords: number; userBigrams: number; base: number };
}

// Mapas sin prototipo: "constructor" o "valueof" no deben chocar con propiedades internas.
function dict<V>(entries: [string, V][] = []): Record<string, V> {
  return Object.assign(Object.create(null) as Record<string, V>, Object.fromEntries(entries));
}
function emptyState(): State {
  return { v: 1, uni: dict(), bi: dict(), total: 0 };
}

function loadState(storage: StorageLike | null): State {
  if (!storage) return emptyState();
  try {
    const s = JSON.parse(storage.getItem(STORE_KEY) ?? 'null');
    if (s && s.v === 1 && s.uni && typeof s.uni === 'object' && s.bi && typeof s.bi === 'object') {
      return {
        v: 1,
        uni: dict(Object.entries(s.uni) as [string, UniEntry][]),
        bi: dict(Object.entries(s.bi) as [string, BiEntry][]),
        total: Number(s.total) || 0,
      };
    }
  } catch {
    // datos corruptos: se empieza de cero
  }
  return emptyState();
}

export interface PredictorOptions {
  base?: Array<[string, number]>;
  corpus?: string[];
  storage?: StorageLike | null;
  now?: () => number;
}

export function createPredictor({
  base = [],
  corpus = [],
  storage = null,
  now = () => Date.now(),
}: PredictorOptions = {}): Predictor {
  const baseMap = new Map<string, { forms: Map<string, number> }>();
  let baseTotal = 0;
  for (const [w, f] of base) {
    const n = normalize(w);
    const prev = baseMap.get(n);
    if (prev) prev.forms.set(w, (prev.forms.get(w) ?? 0) + f);
    else baseMap.set(n, { forms: new Map([[w, f]]) });
    baseTotal += f;
  }
  const corpusUni = new Map<string, number>();
  const corpusBi = new Map<string, number>();
  const corpusPrev = new Map<string, number>();
  for (const phrase of corpus) {
    let prev = START;
    for (const tok of String(phrase).match(WORD_RE) ?? []) {
      const n = normalize(tok);
      corpusUni.set(n, (corpusUni.get(n) ?? 0) + 1);
      const k = `${prev}\t${n}`;
      corpusBi.set(k, (corpusBi.get(k) ?? 0) + 1);
      corpusPrev.set(prev, (corpusPrev.get(prev) ?? 0) + 1);
      prev = n;
    }
  }
  let state = loadState(storage);

  const decay = (e: { c: number; t: number } | undefined) =>
    e ? e.c * 0.5 ** (Math.max(0, now() - e.t) / (HALF_LIFE_DAYS * DAY)) : 0;

  function save() {
    if (!storage) return;
    const prune = <V extends { c: number; t: number }>(obj: Record<string, V>, max: number) => {
      const keys = Object.keys(obj);
      if (keys.length <= max) return obj;
      return dict(
        keys
          .sort((a, b) => decay(obj[b]) - decay(obj[a]))
          .slice(0, max)
          .map((k) => [k, obj[k]] as [string, V]),
      );
    };
    state = { ...state, uni: prune(state.uni, MAX_UNI), bi: prune(state.bi, MAX_BI) };
    try {
      storage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {
      // almacenamiento lleno o bloqueado
    }
  }

  function bestBaseForm(n: string): string | null {
    const e = baseMap.get(n);
    if (!e) return null;
    let best: string | null = null;
    let bf = -1;
    for (const [w, f] of e.forms)
      if (f > bf) {
        bf = f;
        best = w;
      }
    return best;
  }

  function learn(text: string) {
    const raw = String(text ?? '');
    let prev = START;
    let sentenceStart = true;
    const re = new RegExp(`${WORD_RE.source}|[.!?¿¡]`, 'g');
    const t = now();
    for (const m of raw.matchAll(re)) {
      const tok = m[0];
      if (/^[.!?¿¡]$/.test(tok)) {
        sentenceStart = true;
        prev = START;
        continue;
      }
      const n = normalize(tok);
      const cur = state.uni[n];
      const cap = (cur?.cap ?? 0) + (!sentenceStart && /^[A-ZÁÉÍÓÚÜÑ]/.test(tok) ? 1 : 0);
      const low = (cur?.low ?? 0) + (!sentenceStart && /^[a-záéíóúüñ]/.test(tok) ? 1 : 0);
      const isName = cap > low;
      const capForm = /^[A-ZÁÉÍÓÚÜÑ]/.test(tok) ? tok : cur?.name ? cur.w : capitalize(tok);
      const display = isName
        ? capForm
        : (bestBaseForm(n) ?? (cur?.name ? tok.toLowerCase() : (cur?.w ?? tok.toLowerCase())));
      state.uni[n] = { w: display, c: decay(cur) + 1, t, cap, low, ...(isName ? { name: true } : {}) };
      const k = `${prev}\t${n}`;
      state.bi[k] = { c: decay(state.bi[k]) + 1, t };
      state.total = (state.total ?? 0) + 1;
      prev = n;
      sentenceStart = false;
    }
    save();
  }

  /** "cómo" y "como" son frecuentes. "unico" junto a "único" es una falta: se muestra si llega al 25 %. */
  function mainForms(forms: Map<string, number>): [string, number][] {
    const all = [...forms];
    const max = Math.max(...all.map(([, f]) => f));
    return all.filter(([, f]) => f >= VARIANT_MIN_SHARE * max);
  }

  function userPrevTotal(prevN: string) {
    let s = 0;
    const pre = `${prevN}\t`;
    for (const k in state.bi) if (k.startsWith(pre)) s += decay(state.bi[k]);
    return s;
  }

  function suggest(prevWord: string, prefix: string, limit = 7): Suggestion[] {
    const p = normalize(prefix ?? '');
    const typed = String(prefix ?? '').toLowerCase();
    const prevN = prevWord ? normalize(prevWord) : START;
    const userTotal = Object.values(state.uni).reduce((a, e) => a + decay(e), 0);
    const lam = userTotal / (userTotal + 20);
    const pPrev = userPrevTotal(prevN);
    const cPrev = corpusPrev.get(prevN) ?? 0;
    const out = new Map<string, Suggestion>();

    const scoreOf = (n: string) => {
      const ub = pPrev > 0 ? decay(state.bi[`${prevN}\t${n}`]) / pPrev : 0;
      const cb = cPrev > 0 ? (corpusBi.get(`${prevN}\t${n}`) ?? 0) / cPrev : 0;
      const ctx = Math.max(ub, 0.7 * cb);
      if (ctx > 0) return ctx;
      const uu = userTotal > 0 ? decay(state.uni[n]) / userTotal : 0;
      const entry = baseMap.get(n);
      const ubase = baseTotal > 0 && entry ? [...entry.forms.values()].reduce((a, b) => a + b, 0) / baseTotal : 0;
      const uc = corpusUni.size ? (corpusUni.get(n) ?? 0) / 200 : 0;
      return BACKOFF * (lam * uu + (1 - lam) * ubase + 0.1 * uc);
    };
    const add = (n: string, penalty = 1) => {
      const s = scoreOf(n) * penalty;
      if (!(s > 0)) return;
      const user = state.uni[n];
      const entry = baseMap.get(n);
      const forms: [string, number][] = user?.name
        ? [[user.w, 1]]
        : entry
          ? mainForms(entry.forms)
          : [[user?.w ?? n, 1]];
      const fsum = forms.reduce((a, [, f]) => a + f, 0) || 1;
      for (const [w, f] of forms) {
        if (w.toLowerCase() === typed) continue;
        const sc = s * (forms.length > 1 ? 0.5 + 0.5 * (f / fsum) : 1);
        const prevBest = out.get(w);
        if (!prevBest || prevBest.score < sc) out.set(w, { word: w, name: Boolean(user?.name), score: sc });
      }
    };

    const keys = new Set([...Object.keys(state.uni), ...baseMap.keys(), ...corpusUni.keys()]);
    if (p) {
      for (const n of keys) if (n.startsWith(p)) add(n);
      if (p.length >= TYPO_MIN_LEN && out.size < limit) {
        for (const n of keys)
          if (!n.startsWith(p) && n.length >= p.length && withinOneEdit(n.slice(0, p.length), p)) add(n, TYPO_PENALTY);
      }
    } else {
      for (const n of keys) add(n);
    }
    return [...out.values()].sort((a, b) => b.score - a.score).slice(0, limit);
  }

  function format(word: string, { sentenceStart = false, name = false } = {}) {
    if (name) return word;
    return sentenceStart ? capitalize(word.toLowerCase()) : word.toLowerCase();
  }

  return {
    suggest,
    learn,
    format,
    stats: () => ({
      userWords: Object.keys(state.uni).length,
      userBigrams: Object.keys(state.bi).length,
      base: baseMap.size,
    }),
  };
}
