/**
 * Toki OS · predicción de palabras (español, sin conexión, en el dispositivo).
 *
 * Cómo predice (n-gramas con "Stupid Backoff", Brants et al. 2007 — el método de Google para
 * modelos de lenguaje grandes; con modelos chicos rinde casi igual que Kneser-Ney):
 *   - Con contexto: P(palabra | anterior) de bigramas (lo que la persona dijo + frases base).
 *   - Sin contexto conocido: 0,4 × P(palabra), mezcla de la frecuencia de la persona y la del
 *     diccionario base (frecuencias del español).
 * Cómo aprende (la idea simple de Gboard/QuickType: un caché personal en el dispositivo):
 *   - Cada frase dicha suma a unigramas y bigramas propios, con olvido lento (vida media 60 días).
 *   - Las palabras con mayúscula que no están en el diccionario y no inician frase se recuerdan
 *     como nombres (Camila, Lucía…) y se sugieren con mayúscula.
 * Comodidad para escribir con la mirada:
 *   - Sin tildes: "como" ofrece "cómo". La ñ sí cuenta ("año" ≠ "ano"); "manana" llega a
 *     "mañana" por la tolerancia a un error.
 *   - Tolera un error de tipeo en prefijos de 4+ letras ("graxi" → "gracias").
 *
 * Script clásico (window.TokiPredict) y módulo CommonJS (tests en Node).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TokiPredict = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const STORE_KEY = "woki.pred.v1";
  const BACKOFF = 0.4;            // factor de Stupid Backoff
  const HALF_LIFE_DAYS = 60;      // olvido lento de lo personal
  const TYPO_PENALTY = 0.15;
  const TYPO_MIN_LEN = 4;
  const MAX_UNI = 4000, MAX_BI = 12000; // tope del caché personal (localStorage)
  const START = "<s>";
  const DAY = 864e5;

  /** minúsculas y sin tildes (á→a, ü→u) para comparar; la ñ se conserva: "año" ≠ "ano" */
  const DIACRITICS_EXCEPT_TILDE = new RegExp("(?!\\u0303)[\\u0300-\\u036f]", "g");
  function normalize(s) {
    return String(s).toLowerCase().normalize("NFD").replace(DIACRITICS_EXCEPT_TILDE, "").normalize("NFC");
  }
  const WORD_RE = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g;
  const capitalize = (w) => w.charAt(0).toLocaleUpperCase("es") + w.slice(1);

  /** distancia de Damerau-Levenshtein acotada (¿≤ 1?) entre dos cadenas cortas */
  function withinOneEdit(a, b) {
    if (a === b) return true;
    const la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    let i = 0;
    while (i < la && i < lb && a[i] === b[i]) i++;
    if (la === lb) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
    return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
  }

  function emptyState() { return { v: 1, uni: {}, bi: {}, total: 0 }; }

  function loadState(storage) {
    if (!storage) return emptyState();
    try {
      const s = JSON.parse(storage.getItem(STORE_KEY));
      if (s && s.v === 1 && s.uni && typeof s.uni === "object" && s.bi && typeof s.bi === "object") return s;
    } catch { /* datos corruptos: se empieza de cero */ }
    return emptyState();
  }

  /**
   * @param {{base?:[string,number][], corpus?:string[], storage?:{getItem:Function,setItem:Function}|null, now?:()=>number}} opts
   *   base: [palabra, frecuencia] del español · corpus: frases base para bigramas iniciales
   */
  function createPredictor({ base = [], corpus = [], storage = null, now = () => Date.now() } = {}) {
    // diccionario base: normalizada → { w: forma con tildes, f }
    const baseMap = new Map();
    let baseTotal = 0;
    for (const [w, f] of base) {
      const n = normalize(w);
      const prev = baseMap.get(n);
      // varias formas con la misma normalización (como/cómo): se guardan todas
      if (prev) prev.forms.set(w, (prev.forms.get(w) ?? 0) + f);
      else baseMap.set(n, { forms: new Map([[w, f]]) });
      baseTotal += f;
    }
    // bigramas y unigramas de las frases base (no se guardan; se reconstruyen al iniciar)
    const corpusUni = new Map(), corpusBi = new Map(), corpusPrev = new Map();
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

    const decay = (e) => (e ? e.c * Math.pow(0.5, Math.max(0, now() - e.t) / (HALF_LIFE_DAYS * DAY)) : 0);

    function save() {
      if (!storage) return;
      // tope de tamaño: se conserva lo más usado y reciente
      const prune = (obj, max) => {
        const keys = Object.keys(obj);
        if (keys.length <= max) return obj;
        return Object.fromEntries(keys.sort((a, b) => decay(obj[b]) - decay(obj[a])).slice(0, max).map((k) => [k, obj[k]]));
      };
      state = { ...state, uni: prune(state.uni, MAX_UNI), bi: prune(state.bi, MAX_BI) };
      try { storage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* almacenamiento lleno o bloqueado */ }
    }

    /** Aprende de una frase dicha o escrita por la persona. */
    function learn(text) {
      const raw = String(text ?? "");
      let prev = START;
      let sentenceStart = true;
      const re = new RegExp(WORD_RE.source + "|[.!?¿¡]", "g");
      const t = now();
      for (const m of raw.matchAll(re)) {
        const tok = m[0];
        if (/^[.!?¿¡]$/.test(tok)) { sentenceStart = true; prev = START; continue; }
        const n = normalize(tok);
        const cur = state.uni[n];
        // Mayúsculas aprendidas del uso (como los teclados de los celulares): a mitad de frase,
        // ¿la persona la escribe con mayúscula más veces que en minúscula? → es un nombre.
        // Así "Camila" se aprende aunque el diccionario (todo en minúscula) tenga "camila".
        const cap = (cur?.cap ?? 0) + (!sentenceStart && /^[A-ZÁÉÍÓÚÜÑ]/.test(tok) ? 1 : 0);
        const low = (cur?.low ?? 0) + (!sentenceStart && /^[a-záéíóúüñ]/.test(tok) ? 1 : 0);
        const isName = cap > low;
        const capForm = /^[A-ZÁÉÍÓÚÜÑ]/.test(tok) ? tok : cur?.name ? cur.w : capitalize(tok);
        const display = isName ? capForm : (bestBaseForm(n) ?? (cur?.name ? tok.toLowerCase() : cur?.w ?? tok.toLowerCase()));
        state.uni[n] = { w: display, c: decay(cur) + 1, t, cap, low, ...(isName ? { name: true } : {}) };
        const k = `${prev}\t${n}`;
        state.bi[k] = { c: decay(state.bi[k]) + 1, t };
        state.total = (state.total ?? 0) + 1;
        prev = n;
        sentenceStart = false;
      }
      save();
    }

    function bestBaseForm(n) {
      const e = baseMap.get(n);
      if (!e) return null;
      let best = null, bf = -1;
      for (const [w, f] of e.forms) if (f > bf) { bf = f; best = w; }
      return best;
    }

    /** total decaído de la persona como "anterior" de un bigrama */
    function userPrevTotal(prevN) {
      let s = 0;
      const pre = `${prevN}\t`;
      for (const k in state.bi) if (k.startsWith(pre)) s += decay(state.bi[k]);
      return s;
    }

    /**
     * Sugerencias para la palabra en curso.
     * @param {string} prevWord palabra anterior ("" al inicio)
     * @param {string} prefix lo escrito de la palabra actual ("" = predecir la siguiente)
     * @returns {{word:string, name:boolean, score:number}[]}
     */
    function suggest(prevWord, prefix, limit = 7) {
      const p = normalize(prefix ?? "");
      const typed = String(prefix ?? "").toLowerCase();
      const prevN = prevWord ? normalize(prevWord) : START;
      const userTotal = Object.values(state.uni).reduce((a, e) => a + decay(e), 0);
      const lam = userTotal / (userTotal + 20); // cuánto pesa lo personal frente al diccionario
      const pPrev = userPrevTotal(prevN);
      const cPrev = corpusPrev.get(prevN) ?? 0;
      const out = new Map(); // forma visible → {word, name, score}

      const scoreOf = (n) => {
        const ub = pPrev > 0 ? decay(state.bi[`${prevN}\t${n}`]) / pPrev : 0;
        const cb = cPrev > 0 ? (corpusBi.get(`${prevN}\t${n}`) ?? 0) / cPrev : 0;
        const ctx = Math.max(ub, 0.7 * cb);
        if (ctx > 0) return ctx; // hay contexto: se usa el orden mayor (Stupid Backoff)
        const uu = userTotal > 0 ? decay(state.uni[n]) / userTotal : 0;
        const ubase = baseTotal > 0 ? (baseMap.get(n) ? [...baseMap.get(n).forms.values()].reduce((a, b) => a + b, 0) / baseTotal : 0) : 0;
        const uc = corpusUni.size ? (corpusUni.get(n) ?? 0) / 200 : 0;
        return BACKOFF * (lam * uu + (1 - lam) * ubase + 0.1 * uc);
      };
      const add = (n, penalty = 1) => {
        const s = scoreOf(n) * penalty;
        if (!(s > 0)) return;
        const user = state.uni[n];
        const forms = user?.name ? [[user.w, 1]] : baseMap.has(n) ? [...baseMap.get(n).forms] : [[user?.w ?? n, 1]];
        const fsum = forms.reduce((a, [, f]) => a + f, 0) || 1;
        for (const [w, f] of forms) {
          if (w.toLowerCase() === typed) continue; // no sugerir exactamente lo ya escrito
          const sc = s * (forms.length > 1 ? 0.5 + 0.5 * (f / fsum) : 1);
          const prevBest = out.get(w);
          if (!prevBest || prevBest.score < sc) out.set(w, { word: w, name: Boolean(user?.name), score: sc });
        }
      };

      const keys = new Set([...Object.keys(state.uni), ...baseMap.keys(), ...corpusUni.keys()]);
      if (p) {
        for (const n of keys) if (n.startsWith(p)) add(n);
        if (p.length >= TYPO_MIN_LEN && out.size < limit) {
          for (const n of keys) if (!n.startsWith(p) && n.length >= p.length && withinOneEdit(n.slice(0, p.length), p)) add(n, TYPO_PENALTY);
        }
      } else {
        for (const n of keys) add(n);
      }
      return [...out.values()].sort((a, b) => b.score - a.score).slice(0, limit);
    }

    /** Forma a insertar: nombre → tal cual; inicio de frase → Mayúscula; resto → minúscula. */
    function format(word, { sentenceStart = false, name = false } = {}) {
      if (name) return word;
      return sentenceStart ? capitalize(word.toLowerCase()) : word.toLowerCase();
    }

    return { suggest, learn, format, stats: () => ({ userWords: Object.keys(state.uni).length, userBigrams: Object.keys(state.bi).length, base: baseMap.size }) };
  }

  return { createPredictor, normalize, withinOneEdit };
});
