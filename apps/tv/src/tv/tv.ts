// Controlador de la TV: estado, navegación y acciones. Port de la lógica de software/toki-os/woki-os.html.
// React pinta el estado. El motor del puntero trabaja sobre el DOM y llama a onAct() al elegir.
import { beep } from '../audio/beep';
import { createVoz, type Voz } from '../audio/voz';
import { readConfig, safeGet, safeSet, type TvConfig, tokenHeaders } from '../config';
import { DEL_STREAK_MS, deleteStep, typeLetter } from '../domain/keyboard';
import { createMemory, type Memory } from '../domain/memory';
import {
  type Card,
  createVariantPicker,
  DEFAULT,
  EMO,
  type EmoId,
  isEmo,
  localSuggestions,
  REACT_PAGE,
  REACTS,
  RULES,
  toCard,
} from '../domain/phrases';
import { type CareWheel, createCareWheel, type DialogLike } from '../engines/careWheel/careWheel';
import { createGestures, type Gestures, type Source } from '../engines/gestures/gestures';
import { MyoWareClient } from '../engines/myoware/client';
import { MYOWARE_PROFILE_KEY } from '../engines/myoware/detector';
import { PointerEngine } from '../engines/pointer/engine';
import { createPredictor, type Predictor, type Suggestion } from '../engines/predict/predict';
import { createStore, type Store } from './store';
import { CTX0, type Ctx, SCREENS, type Screen, type TvState } from './types';
import { WhatsApp } from './whatsapp';

export const DWELL_OPTIONS = [800, 1000, 1200, 1500];
export const SUG_ROW = 3;
export const SUG_MORE = 7;
const SETTLE_MS = 350;
const SCAN_MS = 1300;
const LOCKOUT_MS = 700;

const hhmmss = () => new Date().toTimeString().slice(0, 8);
const hhmm = () => new Date().toTimeString().slice(0, 5);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface AlarmRuntime {
  level: 'emergencia' | 'atencion';
  t0: number;
  ack: number;
  lastBeep: number;
  fromCareWheel: boolean;
  called: boolean;
  real: boolean;
}

function initialState(): TvState {
  const dwell = Number(safeGet('woki.dwell'));
  return {
    screen: 'home',
    calibOpen: true,
    calibTitle: 'Elige tu control',
    calibText: '',
    rest: false,
    alarm: null,
    emoRingFor: null,
    cards: [],
    cardsLoading: false,
    aiWait: false,
    ctx: CTX0,
    kb: { level: 1, group: 0, text: '', mode: 'text', ini: '', delAt: 0, delStreak: 0 },
    kbTick: 0,
    reactPage: 0,
    setPage: 'main',
    agent: { pending: false, title: '', to: '', msg: '', av: '', bg: '' },
    theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
    palette: document.documentElement.dataset.palette || 'noche',
    legendOpen: safeGet('woki.legend') !== 'off',
    island: { ic: '', txt: '', warn: false, on: false },
    speaking: { emo: '🗣️', txt: '', on: false },
    devOpen: false,
    devMeta: '',
    gazeLost: false,
    dwellMs: DWELL_OPTIONS.includes(dwell) ? dwell : 1200,
    mode: 'click',
    magnet: true,
    jitter: false,
    sugMode: safeGet('woki.sugmode') === 'lista' ? 'lista' : 'fila',
    muted: false,
    sensIdx: 1,
    faceClick: false,
    clock: hhmm(),
    usuaria: '',
    wa: { online: false, session: null, favs: [], to: null, hist: {}, mention: null },
    panelOpen: false,
    careOpen: false,
    log: [],
    voiceLabel: '',
    voiceCount: 0,
    myowareConfirm: false,
    myo: { mode: 'off', saved: false, status: '', result: 'Último gesto: —' },
    emgChannels: [],
    scale: 1,
  };
}

export class Tv {
  readonly cfg: TvConfig;
  readonly store: Store<TvState>;
  readonly pointer: PointerEngine;
  readonly gestures: Gestures;
  readonly mem: Memory;
  readonly voz: Voz;
  readonly wa: WhatsApp;
  readonly myoware: MyoWareClient;
  /** ?myoware=1: el monitor pasó la calibración; se activa al cerrar la elección de control. */
  private fromMonitor = new URLSearchParams(location.search).has('myoware');
  predictor: Predictor;
  careWheel: CareWheel | null = null;
  private readonly pick: ReturnType<typeof createVariantPicker>;
  private alarmRt: AlarmRuntime | null = null;
  private agentPending = 0;
  private agentIdle = 0;
  private islandTimer: ReturnType<typeof setTimeout> | null = null;
  private speakTimer: ReturnType<typeof setTimeout> | null = null;
  private delTimer: ReturnType<typeof setTimeout> | null = null;
  private cleanup: (() => void)[] = [];
  private systemVoices: SpeechSynthesisVoice[] = [];
  private voiceIdx = 0;
  private careSpeech: SpeechSynthesisUtterance | null = null;
  private started = false;
  lockUntil = 0;

  constructor(cfg: TvConfig = readConfig()) {
    this.cfg = cfg;
    this.store = createStore(initialState());
    this.mem = createMemory();
    this.pick = createVariantPicker((t) => this.mem.uses(t));
    this.voz = createVoz(cfg.waUrl, cfg.waToken);
    this.predictor = this.makePredictor();
    this.pointer = new PointerEngine(
      {
        layer: () => this.targetLayer(),
        busy: () => this.busy(),
        resting: () => this.s.rest,
        gazeLost: () => this.s.gazeLost,
        careWheelActive: () => !!this.careWheel?.active,
        myowareConfirming: () => this.s.myowareConfirm,
        mode: () => this.s.mode,
        dwellMs: () => this.s.dwellMs,
        magnet: () => this.s.magnet,
        jitter: () => this.s.jitter,
        scale: () => this.s.scale,
        scanMs: SCAN_MS,
        settleMs: SETTLE_MS,
        activate: (el, o) => this.onAct(el, o),
        frame: (now) => this.frame(now),
        faceBrowActive: () => this.gestures.browOrigin === 'face',
      },
      () => document.getElementById('gaze'),
    );
    this.gestures = createGestures({
      blocked: () => this.gestureBlocked(),
      focus: () => this.pointer.focus,
      confirmFocus: () => this.confirmFocus(),
      careWheelActive: () => !!this.careWheel?.active,
      careWheelBack: () => this.careWheel?.back(),
      openCareWheel: () => this.openCareWheel(),
      canOpenCareWheel: () =>
        this.s.screen === 'home' && !this.s.rest && this.s.emoRingFor === null && !!this.careWheel,
      myowareConfirming: () => this.s.myowareConfirm,
      emergency: () => this.s.alarm?.level === 'emergencia',
      goBack: () => this.goBack(),
      flash: () => {},
    });
    this.wa = new WhatsApp(this);
    // MyoWare: la ceja solo hace clic y la mandíbula es el atajo. woki-os.html:2265-2306
    this.myoware = new MyoWareClient({
      onInput: (src, edge, time) => this.gestures.receiveMyoWare(src, edge, time ?? performance.now()),
      onChange: (myo) => this.set({ myo }),
      onActivate: () => this.setMyoWareConfirmation(true),
      onUnavailable: (message) => {
        if (this.s.myowareConfirm) this.island('⚠️', message, true, 6000);
      },
      onRecovered: () => {
        if (this.s.myowareConfirm) this.island('✓', 'Señal MyoWare recuperada');
      },
    });
    this.set({ myo: this.myoware.view });
  }

  /** «Usar mouse + gestos MyoWare» en la elección de control. */
  startMouseWithMyoWare() {
    this.myoware.enterWithMouse(() => {
      this.fromMonitor = false;
      this.setMyoWareConfirmation(true);
      this.closeCalibration();
    });
  }

  get s(): TvState {
    return this.store.get();
  }

  set(patch: Partial<TvState> | ((s: TvState) => Partial<TvState>)) {
    this.store.set(patch);
  }

  // ---------- arranque ----------

  start() {
    if (this.started) return;
    this.started = true;
    document.body.classList.add('official-os');
    document.body.classList.toggle('legend-off', !this.s.legendOpen);
    this.pointer.start();
    const onKey = (e: KeyboardEvent) => this.onKeyDown(e);
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') this.gestures.release('ceja', 'keyboard', performance.now());
    };
    const onBlur = () => this.gestures.cancel();
    const onVis = () => {
      if (document.hidden) {
        this.gestures.cancel();
        this.myoware.pause();
      } else this.myoware.restore();
    };
    const onPageHide = () => this.myoware.pause();
    const onPageShow = () => this.myoware.restore();
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === MYOWARE_PROFILE_KEY) this.myoware.storageChanged();
    };
    addEventListener('pagehide', onPageHide);
    addEventListener('pageshow', onPageShow);
    addEventListener('storage', onStorage);
    this.cleanup.push(() => {
      removeEventListener('pagehide', onPageHide);
      removeEventListener('pageshow', onPageShow);
      removeEventListener('storage', onStorage);
      this.myoware.pause();
    });
    const onPop = () => {
      const name = this.screenFromUrl();
      if (name !== this.s.screen) this.go(name, false);
    };
    addEventListener('keydown', onKey);
    addEventListener('keyup', onKeyUp);
    addEventListener('blur', onBlur);
    addEventListener('popstate', onPop);
    document.addEventListener('visibilitychange', onVis);
    const clock = setInterval(() => {
      const t = hhmm();
      if (t !== this.s.clock) this.set({ clock: t });
    }, 1000);
    this.cleanup.push(() => {
      removeEventListener('keydown', onKey);
      removeEventListener('keyup', onKeyUp);
      removeEventListener('blur', onBlur);
      removeEventListener('popstate', onPop);
      document.removeEventListener('visibilitychange', onVis);
      clearInterval(clock);
    });
    this.loadSystemVoices();
    void this.loadLexicon();
    this.loadUsuaria();
    void this.voz.init().then(() => this.syncVoice());
    const vozTimer = setInterval(() => void this.voz.init().then(() => this.syncVoice()), 30000);
    this.cleanup.push(() => clearInterval(vozTimer));
    this.connectEmg();
    this.wa.listen();
    const initial = this.screenFromUrl();
    if (initial !== 'home') this.go(initial, false);
    if (new URLSearchParams(location.search).get('dev') === '1') this.set({ devOpen: true });
    this.log('Myo OS listo · mouse = mirada · Espacio = ceja');
  }

  stop() {
    this.started = false;
    this.pointer.stop();
    for (const fn of this.cleanup.splice(0)) fn();
    this.wa.stop();
    this.voz.dispose();
    this.careWheel?.destroy();
  }

  attachCareWheel(dialog: HTMLDialogElement) {
    this.careWheel?.destroy();
    this.careWheel = createCareWheel(dialog as unknown as DialogLike, {
      announce: (t) => this.announceCare(t),
      silence: () => this.silenceCareCue(),
      onAttention: () => {
        this.startAlarm('atencion');
        this.announceCare('Aviso de prueba. No se contactó a nadie.');
      },
      onSOS: () => {
        this.startAlarm('emergencia', { fromCareWheel: true });
        this.announceCare('SOS de prueba. No se contactó a nadie. Levanta la ceja para cerrar la simulación.');
      },
      onPhrase: (t) => this.announceCare(t),
      onBack: () => this.goBack(),
      scanMs: Math.max(SCAN_MS, 2200),
    });
    const onClose = () => this.set({ careOpen: false });
    dialog.addEventListener('close', onClose);
    return () => dialog.removeEventListener('close', onClose);
  }

  private makePredictor(base?: Array<[string, number]>): Predictor {
    let storage: Storage | null = null;
    try {
      storage = localStorage;
    } catch {
      storage = null;
    }
    return createPredictor({
      base: base ?? [],
      corpus: [
        ...RULES.flatMap((r) => r.s.flat().map((x) => x[0])),
        ...DEFAULT.flat().map((x) => x[0]),
        ...REACTS.map((r) => r[1]),
      ],
      storage,
    });
  }

  /** El diccionario pesa 340 KB: se carga aparte y el predictor se recrea al llegar. */
  private async loadLexicon() {
    try {
      const mod = await import('../data/lexicon-es.json');
      this.predictor = this.makePredictor(mod.default as unknown as Array<[string, number]>);
      // Lo que ya se había dicho antes de este motor también enseña (una sola vez). woki-os.html:1436
      if (!safeGet('woki.pred.migrated')) {
        for (const p of [...this.mem.m.phrases].reverse()) this.predictor.learn(p.t);
        safeSet('woki.pred.migrated', '1');
      }
      this.bumpKb();
    } catch {
      this.log('No se pudo cargar el diccionario: uso la lista corta');
    }
  }

  private loadUsuaria() {
    if (!this.cfg.agenteUrl) return;
    fetch(`${this.cfg.agenteUrl}/api/salud`, { headers: tokenHeaders(this.cfg.waToken) })
      .then((r) => (r.ok ? r.json() : {}))
      .then((j: { usuaria?: string }) => this.set({ usuaria: j.usuaria || '' }))
      .catch(() => {});
  }

  private connectEmg() {
    if (!this.cfg.emgWs) return;
    try {
      const ws = new WebSocket(this.cfg.emgWs);
      ws.onopen = () => this.log('EMG real conectado');
      ws.onmessage = (m) => {
        try {
          const d = JSON.parse(m.data);
          const now = performance.now();
          if ((d.src === 'ceja' || d.src === 'mandibula') && (d.edge === 'down' || d.edge === 'up')) {
            if (!this.s.emgChannels.includes(d.src)) this.set({ emgChannels: [...this.s.emgChannels, d.src] });
          }
          if (d.edge === 'down') this.gestures.press(d.src as Source, 'ws', now);
          else if (d.edge === 'up') this.gestures.release(d.src as Source, 'ws', now);
          else if (d.edge === 'cancel') {
            this.set({ emgChannels: [] });
            this.gestures.cancel('ws');
          }
          if (d.gaze && Number.isFinite(d.gaze.x) && Number.isFinite(d.gaze.y))
            this.pointer.setGaze(d.gaze.x, d.gaze.y);
        } catch {
          // mensaje inválido
        }
      };
      ws.onclose = () => {
        this.set({ emgChannels: [] });
        this.gestures.cancel('ws');
      };
      ws.onerror = () => {};
      this.cleanup.push(() => ws.close());
    } catch {
      // sin puente EMG
    }
  }

  // ---------- capas y estado ----------

  targetLayer(): Element | null {
    if (this.s.rest) return document.getElementById('rest');
    if (this.s.emoRingFor !== null) return document.getElementById('emoRing');
    return document.querySelector('.screen.on');
  }

  busy(): boolean {
    const s = this.s;
    return document.hidden || s.alarm?.level === 'emergencia' || s.calibOpen || s.panelOpen;
  }

  gestureBlocked(): boolean {
    const s = this.s;
    return (
      document.visibilityState !== 'visible' ||
      s.panelOpen ||
      (s.alarm?.level === 'emergencia' && !s.alarm.fromCareWheel) ||
      s.calibOpen
    );
  }

  isBusyForInterruptions(): boolean {
    const s = this.s;
    return !!s.alarm || s.rest || s.calibOpen || s.panelOpen || (s.screen === 'agent' && !!this.agentPending);
  }

  screenFromUrl(): Screen {
    const name = location.hash.slice(1) as Screen;
    return SCREENS.includes(name) ? name : 'home';
  }

  island(ic: string, txt: string, warn = false, ms = 2200) {
    this.set({ island: { ic, txt, warn, on: true } });
    if (this.islandTimer) clearTimeout(this.islandTimer);
    if (ms) this.islandTimer = setTimeout(() => this.set((s) => ({ island: { ...s.island, on: false } })), ms);
  }

  log(m: string) {
    this.set((s) => ({ log: [`${hhmmss()}  ${m}`, ...s.log].slice(0, 8) }));
  }

  private bumpKb() {
    this.set((s) => ({ kbTick: s.kbTick + 1 }));
  }

  // ---------- navegación ----------

  go(name: Screen, writeHistory = true) {
    if (!SCREENS.includes(name)) return;
    const s = this.s;
    if (writeHistory && s.screen !== name) {
      const step = ((history.state as { wokiStep?: number } | null)?.wokiStep || 0) + 1;
      history.pushState({ wokiStep: step }, '', name === 'home' ? location.pathname + location.search : `#${name}`);
    }
    if (s.screen !== name) {
      if (s.emoRingFor !== null) this.closeEmoRing();
      if (s.rest) this.setRest(false);
      const prev = document.getElementById(`s-${s.screen}`);
      if (prev) {
        prev.classList.add('leaving');
        setTimeout(() => prev.classList.remove('leaving'), 320);
      }
    }
    this.set({ screen: name });
    this.pointer.clearFocus();
    if (name === 'home') this.wa.reset();
    if (name === 'contacts') void this.wa.loadFavs();
    if (name === 'talk') {
      if (!this.s.cards.length || !this.s.wa.to) void this.genSuggestions();
      else this.prefetchCards();
    }
    if (name === 'keyboard') this.set((st) => ({ kb: { ...st.kb, level: 1 } }));
    if (name === 'reactions') this.set({ reactPage: 0 });
    if (name === 'settings') this.set({ setPage: 'main' });
    if (name === 'agent') {
      this.agentPending = 0;
      this.agentIdle = performance.now();
      this.set((st) => ({ agent: { ...st.agent, pending: false } }));
    }
    this.log(`pantalla → ${name}`);
  }

  goBack() {
    const s = this.s;
    if (s.emoRingFor !== null) this.closeEmoRing();
    else if (s.rest) this.setRest(false);
    else if (s.screen === 'keyboard' && s.kb.mode === 'ini' && s.kb.level === 1) {
      this.set({ kb: { ...s.kb, mode: 'text' } });
      this.go('talk');
    } else if (s.screen === 'keyboard' && s.kb.level !== 1) this.set({ kb: { ...s.kb, level: 1 } });
    else if (((history.state as { wokiStep?: number } | null)?.wokiStep ?? 0) > 0) history.back();
    else if (s.screen !== 'home') this.go('home');
  }

  // ---------- Hablar ----------

  setCtx(label: string, av: string, val: string, ph: string, bg = '') {
    this.set({ ctx: { label, av, val, ph, bg } });
  }

  setCtxValue(val: string) {
    this.set((s) => ({ ctx: { ...s.ctx, val } }));
  }

  setCards(cards: Card[]) {
    this.set({ cards });
    this.prefetchCards();
  }

  private prefetchCards() {
    if (!this.s.wa.to) this.voz.prefetch(this.s.cards.map((c) => [c.text, c.emo]));
  }

  async genSuggestions() {
    const ctx = this.s.ctx.val.trim();
    this.set({ cardsLoading: true });
    await sleep(220);
    const { phrases, generic } = localSuggestions(ctx, this.pick);
    const cards = phrases.map(toCard);
    if (this.s.wa.to) this.wa.setPool(cards, generic, true);
    else this.setCards(cards);
    this.set({ cardsLoading: false });
    if (this.s.wa.to) void this.wa.aiReplies();
  }

  pickVariants = (key: string, slots: Parameters<ReturnType<typeof createVariantPicker>>[1]) => this.pick(key, slots);

  openEmoRing(i: number) {
    this.set({ emoRingFor: i });
    this.pointer.clearFocus();
    this.log('anillo de emociones');
  }

  closeEmoRing() {
    this.set({ emoRingFor: null });
    this.pointer.clearFocus();
  }

  private loadSystemVoices() {
    if (!('speechSynthesis' in window)) return;
    const load = () => {
      const all = speechSynthesis.getVoices();
      const es = all.filter((v) => /^es/i.test(v.lang));
      const pref = ['es-CL', 'es-419', 'es-MX', 'es-US', 'es-ES'];
      const rank = (v: SpeechSynthesisVoice) => {
        const i = pref.indexOf(v.lang);
        return i < 0 ? 99 : i;
      };
      es.sort((a, b) => rank(a) - rank(b));
      this.systemVoices = es.length ? es : all;
      this.syncVoice();
    };
    speechSynthesis.onvoiceschanged = load;
    load();
  }

  private syncVoice() {
    const v = this.systemVoices[this.voiceIdx];
    this.set({
      voiceLabel: this.voz.options.length
        ? (this.voz.name() || 'ElevenLabs').slice(0, 14)
        : v
          ? v.name.slice(0, 14)
          : '',
      voiceCount: this.voz.options.length,
    });
  }

  speak(text: string, emoId: string = 'seria') {
    const e = EMO[isEmo(emoId) ? emoId : 'seria'];
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    this.voz.stop();
    this.set({ speaking: { emo: e.e, txt: text, on: true } });
    const off = () => this.set((s) => ({ speaking: { ...s.speaking, on: false } }));
    if (this.speakTimer) clearTimeout(this.speakTimer);
    this.speakTimer = setTimeout(off, 1200 + text.length * 90);
    const local = () => {
      if (!('speechSynthesis' in window)) return;
      const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}]/gu, ''));
      const v = this.systemVoices[this.voiceIdx];
      if (v) {
        u.voice = v;
        u.lang = v.lang;
      } else u.lang = 'es-CL';
      u.rate = e.rate;
      u.pitch = e.pitch;
      u.volume = e.vol;
      u.onend = u.onerror = off;
      speechSynthesis.speak(u);
    };
    // ElevenLabs y, si falla o no hay red, la voz del sistema: nunca se queda muda.
    if (this.voz.on)
      this.voz.speak(text, e.id).then(off, (err: Error) => {
        this.log(`ElevenLabs falló (${err.message}), uso la voz del sistema`);
        local();
      });
    else local();
    this.mem.add(text);
    this.predictor.learn(text);
    this.log(`voz (${e.n}): ${text}`);
  }

  // ---------- teclado ----------

  sugs(): Suggestion[] {
    const t = this.s.kb.text;
    return this.predictor.suggest(prevWordOf(t), curWordOf(t), SUG_ROW + SUG_MORE);
  }

  delStreakActive(): boolean {
    return performance.now() - (this.s.kb.delAt || 0) < DEL_STREAK_MS;
  }

  private acceptSuggestion(sg: Suggestion | undefined) {
    if (!sg) return;
    const t = this.s.kb.text;
    const before = t.replace(/[^\s]*$/, '');
    const sentenceStart = /^\s*$/.test(before) || /[.!?]\s*$/.test(before);
    const text = `${before}${this.predictor.format(sg.word, { sentenceStart, name: sg.name })} `;
    this.set((s) => ({ kb: { ...s.kb, text } }));
  }

  // ---------- acciones ----------

  /** La ceja confirma el foco. woki-os.html:1819-1835 */
  confirmFocus() {
    if (this.careWheel?.active) {
      this.careWheel.confirm();
      return;
    }
    if (this.s.alarm?.fromCareWheel) {
      this.stopAlarm('Simulación cerrada');
      return;
    }
    this.pointer.confirmFocus({ agentPending: !!this.agentPending });
  }

  onAct(el: HTMLElement, { immediate }: { calibrate: boolean; immediate: boolean }) {
    const act = el.dataset.act || '';
    const sep = act.indexOf(':');
    const a = sep < 0 ? act : act.slice(0, sep);
    const arg = sep < 0 ? '' : act.slice(sep + 1);
    if (act !== 'kb:del') this.set((s) => ({ kb: { ...s.kb, delAt: 0 } }));
    this.log(`elegido → ${act}`);
    const s = this.s;
    switch (a) {
      case 'go':
        if (immediate) this.go(arg as Screen);
        else setTimeout(() => this.go(arg as Screen), 90);
        break;
      case 'back':
        this.goBack();
        break;
      case 'say': {
        const c = s.cards[Number(arg)];
        if (!c) break;
        // WhatsApp: se confirma, no se dice en voz alta. El emoji solo si la emoción no es neutra.
        if (s.wa.to) this.wa.openAgent(c.plain || c.emo === 'seria' ? c.text : `${c.text} ${EMO[c.emo].e}`);
        else this.speak(c.text, c.emo);
        break;
      }
      case 'waTo': {
        const c = s.wa.favs[Number(arg)];
        if (c) this.wa.start(c);
        break;
      }
      case 'waPanel':
        void this.wa.openPanel();
        break;
      case 'emo':
        this.openEmoRing(Number(arg));
        break;
      case 'emoBack':
        this.closeEmoRing();
        break;
      case 'setEmo': {
        const i = s.emoRingFor;
        if (i === null || !isEmo(arg)) break;
        const cards = s.cards.map((c, k) => (k === i ? { ...c, emo: arg as EmoId } : c));
        this.set({ cards });
        this.closeEmoRing();
        this.island(EMO[arg].e, `Emoción: ${EMO[arg].n}`);
        break;
      }
      case 'grp':
        this.set({ kb: { ...s.kb, level: 2, group: Number(arg) } });
        break;
      case 'sug': {
        this.acceptSuggestion(this.sugs()[Number(arg)]);
        this.set((st) => ({ kb: { ...st.kb, level: 1 } }));
        break;
      }
      case 'chr':
        if (s.kb.mode === 'ini') {
          this.set({ kb: { ...s.kb, ini: s.kb.ini + arg.toLowerCase(), level: 1 } });
          this.wa.iniAsk();
          break;
        }
        this.set({ kb: { ...s.kb, text: typeLetter(s.kb.text, arg), level: 1 } });
        break;
      case 'waMore':
        this.wa.morePage();
        break;
      case 'waKb':
        this.set({ kb: { level: 1, group: 0, text: '', mode: 'ini', ini: '', delAt: 0, delStreak: 0 } });
        this.go('keyboard');
        break;
      case 'kb':
        this.keyboardAction(arg);
        break;
      case 'react': {
        const r = REACTS[Number(arg)];
        if (r) this.speak(r[1], r[2]);
        break;
      }
      case 'reactMore':
        this.set({ reactPage: (s.reactPage + 1) % Math.ceil(REACTS.length / REACT_PAGE) });
        break;
      case 'attention':
        this.startAlarm('atencion');
        break;
      case 'sos':
        this.startAlarm('emergencia');
        break;
      case 'rest':
        this.setRest(true);
        break;
      case 'wake':
        this.setRest(false);
        break;
      case 'agentSend':
        this.agentSend(el);
        break;
      case 'look':
        if (arg === 'volver') this.set({ setPage: 'main' });
        else if (arg === 'oscuro' || arg === 'claro') this.setTheme(arg === 'claro');
        else this.setPalette(arg);
        break;
      case 'set':
        this.settingsAction(arg);
        break;
    }
  }

  private keyboardAction(arg: string) {
    const kb = this.s.kb;
    if (kb.mode === 'ini') {
      if (arg === 'del') {
        this.set({ kb: { ...kb, ini: kb.ini.slice(0, -1) } });
        this.wa.iniAsk();
      }
      if (arg === 'back') this.set({ kb: { ...kb, level: 1 } });
      if (arg === 'expand') void this.wa.kbExpand();
      if (arg === 'exit') {
        this.set({ kb: { ...kb, mode: 'text' } });
        this.go('talk');
      }
      return;
    }
    if (arg === 'space') this.set({ kb: { ...kb, text: `${kb.text} ` } });
    if (arg === 'del') {
      const streak = this.delStreakActive() ? (kb.delStreak || 0) + 1 : 1;
      this.set({ kb: { ...kb, delStreak: streak, delAt: performance.now(), text: deleteStep(kb.text, streak) } });
      // Al terminar la racha, la tecla vuelve a decir "Borrar".
      if (this.delTimer) clearTimeout(this.delTimer);
      this.delTimer = setTimeout(() => this.bumpKb(), DEL_STREAK_MS + 50);
    }
    if (arg === 'back') this.set({ kb: { ...this.s.kb, level: 1 } });
    if (arg === 'pred') this.acceptSuggestion(this.sugs()[0]);
    if (arg === 'sug') this.set({ kb: { ...this.s.kb, level: 3 } });
    if (arg === 'say' && this.s.kb.text.trim()) {
      const t = this.s.kb.text.trim();
      this.set({ kb: { ...this.s.kb, text: '' } });
      if (this.s.wa.to) this.wa.openAgent(t);
      else this.speak(t);
    }
  }

  private agentSend(el: HTMLElement) {
    const now = performance.now();
    if (this.agentPending && now - this.agentPending < 3000) {
      this.agentPending = 0;
      this.set((s) => ({ agent: { ...s.agent, pending: false } }));
      if (this.cfg.waUrl) void this.wa.send();
      else {
        this.island('✓', 'Enviado (simulado)');
        this.go('home');
      }
    } else {
      this.agentPending = now;
      this.set((s) => ({ agent: { ...s.agent, pending: true } }));
      // Sin alejar la mirada: el botón se vuelve a habilitar y el conteo empieza de nuevo.
      setTimeout(() => this.pointer.forgetLastChoice(), 0);
      setTimeout(() => {
        if (this.pointer.blocked === el) {
          el.classList.remove('blocked');
          this.pointer.blocked = null;
        }
        this.pointer.restartFocusTimer();
      }, 350);
      setTimeout(() => {
        if (this.agentPending && performance.now() - this.agentPending >= 3000 && this.s.screen === 'agent') {
          this.agentPending = 0;
          this.set((s) => ({ agent: { ...s.agent, pending: false } }));
          this.island('⏱', 'No se envió: faltó la segunda ceja');
        }
      }, 3100);
    }
    this.agentIdle = now;
  }

  get agentIsPending(): boolean {
    return !!this.agentPending;
  }

  resetAgentPending() {
    this.agentPending = 0;
    this.agentIdle = performance.now();
    this.set((s) => ({ agent: { ...s.agent, pending: false } }));
  }

  private settingsAction(arg: string) {
    const s = this.s;
    if (s.myowareConfirm && arg === 'dwell') {
      this.island('🔒', 'El tiempo de mirada no se usa en modo Ceja');
      return;
    }
    if (arg === 'sugmode') {
      const sugMode = s.sugMode === 'fila' ? 'lista' : 'fila';
      this.set({ sugMode });
      safeSet('woki.sugmode', sugMode);
      this.island(
        '⌨️',
        sugMode === 'fila' ? 'Sugerencias fijas arriba del teclado' : 'Sugerencias en un botón que abre la lista',
      );
    }
    if (arg === 'theme') {
      this.set({ setPage: 'look' });
      return;
    }
    if (arg === 'dwell') {
      const dwellMs = DWELL_OPTIONS[(DWELL_OPTIONS.indexOf(s.dwellMs) + 1) % DWELL_OPTIONS.length];
      this.set({ dwellMs });
      safeSet('woki.dwell', String(dwellMs));
    }
    if (arg === 'mode') {
      if (s.myowareConfirm) this.setMyoWareConfirmation(false);
      this.set({ mode: this.s.mode === 'click' ? 'dwell' : 'click' });
    }
    if (arg === 'voice') {
      if (this.voz.options.length)
        void this.voz.next().then(() => {
          this.syncVoice();
          this.speak('Hola, esta es mi voz.', 'alegre');
        });
      else {
        this.voiceIdx = (this.voiceIdx + 1) % Math.max(1, this.systemVoices.length);
        this.syncVoice();
        this.speak('Hola, esta es mi voz.', 'alegre');
      }
    }
    if (arg === 'pointer') this.island('🖱️', 'En la v2 el puntero es el mouse por ahora');
    if (arg === 'sens') {
      const sensIdx = (s.sensIdx + 1) % 3;
      this.set({ sensIdx });
      this.island('🎯', `Sensibilidad ${['baja', 'media', 'alta'][sensIdx]}`);
    }
    if (arg === 'calib') this.openCalibration();
    if (arg === 'faceclick') {
      const faceClick = !s.faceClick;
      this.set({ faceClick });
      this.island('🙂', faceClick ? 'Clic con cara: levanta la ceja para elegir' : 'Clic con cara apagado');
    }
  }

  setMyoWareConfirmation(on: boolean) {
    document.body.classList.toggle('myoware-confirm', on);
    this.set(on ? { myowareConfirm: true, mode: 'click' } : { myowareConfirm: false });
    this.pointer.resetDwell();
  }

  // ---------- tema y barra del acompañante ----------

  setTheme(light: boolean) {
    if (light) document.documentElement.dataset.theme = 'light';
    else delete document.documentElement.dataset.theme;
    safeSet('woki.theme', light ? 'light' : 'dark');
    this.set({ theme: light ? 'light' : 'dark' });
  }

  setPalette(id: string) {
    const valid = ['bosque', 'oceano', 'atardecer', 'lavanda'];
    if (!valid.includes(id)) {
      delete document.documentElement.dataset.palette;
      safeSet('woki.palette', 'noche');
      this.set({ palette: 'noche' });
    } else {
      document.documentElement.dataset.palette = id;
      safeSet('woki.palette', id);
      this.set({ palette: id });
    }
  }

  toggleLegend() {
    const open = !this.s.legendOpen;
    document.body.classList.toggle('legend-off', !open);
    safeSet('woki.legend', open ? 'on' : 'off');
    this.set({ legendOpen: open });
  }

  toggleFullscreen() {
    const req = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
    Promise.resolve(req).catch(() => this.island('⛶', 'Usa la opción de pantalla completa del navegador'));
  }

  // ---------- calibración (elección de control) ----------

  openCalibration() {
    this.set({ calibOpen: true, calibTitle: 'Elige tu control', calibText: '' });
  }

  closeCalibration() {
    if (!this.s.calibOpen) return;
    this.set({ calibOpen: false });
    // Llegó desde el monitor MyoWare con calibración: activa los gestos. woki-os.html:2299-2301
    if (this.fromMonitor && this.myoware.enable()) {
      this.fromMonitor = false;
      this.setMyoWareConfirmation(true);
    }
    // Al salir de la calibración: revisa si quedó una mención por responder. woki-os.html:1159-1162
    setTimeout(() => void this.wa.reviewMentions(), 400);
  }

  chooseControl(c: 'start' | 'gaze' | 'iphone' | 'mouse' | 'saved') {
    if (c === 'mouse') {
      this.closeCalibration();
      this.island('🖱️', 'Modo demo: el mouse es la mirada');
      return;
    }
    const names = {
      start: 'La nariz',
      gaze: 'La mirada con webcam',
      iphone: 'La mirada con iPhone',
      saved: 'La calibración guardada',
    };
    this.set({ calibText: `${names[c]} todavía no está en la v2. Elige Mouse o usa la TV actual.` });
  }

  // ---------- descanso ----------

  setRest(on: boolean) {
    if (this.s.rest === on) return;
    this.pointer.clearFocus();
    this.set({ rest: on });
    if (this.s.screen === 'agent') this.resetAgentPending();
    requestAnimationFrame(() => {
      if (on) document.getElementById('restWake')?.focus({ preventScroll: true });
    });
    this.log(on ? 'descanso' : 'despierta');
  }

  // ---------- alarma ----------

  startAlarm(level: 'emergencia' | 'atencion', { fromCareWheel = false } = {}) {
    if (this.s.alarm?.level === 'emergencia') return;
    const now = performance.now();
    this.alarmRt = { level, t0: now, ack: 0, lastBeep: 0, fromCareWheel, called: false, real: false };
    this.set({
      alarm: {
        level,
        big: 'SOS de prueba',
        sub: 'No se contactó a nadie.',
        cancel: '',
        ack: false,
        real: false,
        dismiss: 'Cerrar simulación',
        fromCareWheel,
      },
    });
    this.log(`SIMULACIÓN: ${level}`);
    if (level === 'emergencia') {
      this.gestures.cancel();
      this.pointer.clearFocus();
      requestAnimationFrame(() => document.getElementById('alDismiss')?.focus());
    } else {
      this.island('🔔', 'Aviso no urgente simulado · no se contactó a nadie', true);
      beep(this.s.muted, 660, 300, 0.05);
      this.alarmRt.lastBeep = now;
    }
  }

  private alarmTick(now: number) {
    const A = this.alarmRt;
    const view = this.s.alarm;
    if (!A || !view) return;
    const s = (now - A.t0) / 1000;
    if (A.level === 'emergencia' && !A.ack) {
      if (!A.fromCareWheel && !A.called) {
        A.called = true;
        void this.voz.emergency(String(A.t0), {
          alive: () => this.alarmRt === A && !A.ack,
          setSub: (t) => {
            if (this.alarmRt === A && !A.ack) this.set((st) => (st.alarm ? { alarm: { ...st.alarm, sub: t } } : {}));
          },
          markReal: () => {
            A.real = true;
            this.set((st) =>
              st.alarm ? { alarm: { ...st.alarm, real: true, big: 'Pidiendo ayuda', dismiss: 'Cerrar alarma' } } : {},
            );
          },
          confirmed: (who, answer) => this.phoneConfirmed(A, who, answer),
          island: (i, t) => this.island(i, t),
          log: (t) => this.log(t),
        });
      }
      const cancel = A.real
        ? `Llamada de emergencia · ${Math.floor(s)} s · R = llegó alguien (llavero)`
        : `Sin respuesta simulada · ${Math.floor(s)} s · R para simular recepción`;
      if (cancel !== view.cancel) this.set({ alarm: { ...view, cancel } });
      const every = s >= 30 ? 600 : 1000;
      if (now - A.lastBeep > every) {
        beep(this.s.muted, s >= 30 ? 990 : 880, 260, s >= 30 ? 0.14 : 0.09);
        A.lastBeep = now;
      }
    }
    if (A.level === 'atencion' && !A.ack && now - A.lastBeep > 20000) {
      beep(this.s.muted, 660, 300, 0.05);
      A.lastBeep = now;
    }
  }

  /** El contacto confirmó por teléfono que viene: misma pantalla verde que el llavero. woki-voz.js:117-132 */
  private phoneConfirmed(A: AlarmRuntime, who: string, answer: string) {
    if (this.alarmRt !== A || A.ack) return;
    A.ack = performance.now();
    const secs = Math.round((A.ack - A.t0) / 1000);
    this.set((st) =>
      st.alarm
        ? {
            alarm: {
              ...st.alarm,
              ack: true,
              big: `${who} viene en camino`,
              sub: answer ? `“${answer}” · respondió por teléfono en ${secs} s` : `Confirmó por teléfono en ${secs} s`,
              cancel: 'Toque del llavero = resuelto',
            },
          }
        : {},
    );
    this.log(`emergencia: ${who} confirmó por teléfono (${secs} s)`);
    beep(this.s.muted, 660, 160, 0.08);
    setTimeout(() => beep(this.s.muted, 880, 220, 0.08), 180);
  }

  rfid() {
    const A = this.alarmRt;
    if (!A) {
      this.island('🔑', 'Llavero: no hay alarma activa');
      return;
    }
    const secs = Math.round((performance.now() - A.t0) / 1000);
    if (!A.ack) {
      A.ack = performance.now();
      this.log(`RFID: llegó alguien (${secs} s)`);
      if (A.level === 'emergencia') {
        this.set((st) =>
          st.alarm
            ? {
                alarm: A.real
                  ? {
                      ...st.alarm,
                      ack: true,
                      big: 'Llegó alguien',
                      sub: `Confirmado con el llavero en ${secs} s`,
                      cancel: 'R o Cerrar alarma',
                    }
                  : {
                      ...st.alarm,
                      ack: true,
                      big: 'Respuesta simulada',
                      sub: 'No se contactó a nadie.',
                      cancel: 'R o Cerrar simulación',
                    },
              }
            : {},
        );
      } else {
        this.island('✅', `Respuesta simulada en ${secs} s`);
        setTimeout(() => {
          if (this.alarmRt === A) this.stopAlarm();
        }, 4000);
      }
    } else this.stopAlarm('Resuelto');
  }

  stopAlarm(msg?: string) {
    const fromCareWheel = this.s.alarm?.fromCareWheel;
    if (fromCareWheel) this.silenceCareCue();
    this.alarmRt = null;
    this.set({ alarm: null });
    (document.getElementById('alDismiss') as HTMLElement | null)?.blur();
    requestAnimationFrame(() => {
      if (this.s.rest) document.getElementById('restWake')?.focus();
      else if (fromCareWheel) document.getElementById('care-open')?.focus();
      // Si el puntero sigue sobre SOS al cerrar la alarma, debe salir antes de repetirla.
      this.pointer.blockIfUnderPointer(this.targetLayer()?.querySelector<HTMLElement>('[data-act="sos"]') ?? null);
    });
    if (msg) this.island('✓', msg);
    this.log('alarma cerrada');
  }

  dismissAlarm() {
    this.stopAlarm(this.s.alarm?.real ? 'Alarma cerrada' : 'Simulación cerrada');
  }

  // ---------- rueda de cuidados ----------

  openCareWheel() {
    if (!this.careWheel || this.gestureBlocked() || this.s.rest || this.s.alarm?.level === 'emergencia') return;
    this.pointer.clearFocus();
    this.pointer.resetDwell();
    this.careWheel.open();
    this.set({ careOpen: true });
  }

  private silenceCareCue() {
    if (!this.careSpeech) return;
    this.careSpeech = null;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  private announceCare(text: string) {
    this.silenceCareCue();
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    const voice = speechSynthesis.getVoices().find((v) => v.localService && /^es/i.test(v.lang));
    u.lang = 'es-CL';
    if (voice) u.voice = voice;
    this.careSpeech = u;
    u.onend = u.onerror = () => {
      if (this.careSpeech === u) this.careSpeech = null;
    };
    speechSynthesis.speak(u);
  }

  // ---------- pérdida de rostro (G) ----------

  setGazeLost(v: boolean) {
    if (this.s.gazeLost === v) return;
    this.set({ gazeLost: v });
    document.body.classList.toggle('scan', v);
    this.pointer.clearFocus();
    this.pointer.resetScan();
    this.island(v ? '👀' : '👁', v ? 'No te veo · sigue con la ceja' : 'Te veo de nuevo', v);
    this.log(v ? 'cara perdida → EMG con escaneo' : 'cara recuperada');
  }

  // ---------- cuadro a cuadro ----------

  private frame(now: number) {
    const typing = document.getElementById('typing');
    if (typing) typing.classList.toggle('on', this.s.screen === 'talk' && !!this.pointer.focus && !this.s.speaking.on);
    const s = this.s;
    if (
      !s.rest &&
      s.alarm?.level !== 'emergencia' &&
      s.screen === 'agent' &&
      !this.agentPending &&
      now - this.agentIdle > 10000
    ) {
      this.island('⏱', 'Cancelado: 10 s sin respuesta');
      this.go('home');
    }
    this.alarmTick(now);
  }

  // ---------- teclado del computador = sensores simulados ----------

  private onKeyDown(e: KeyboardEvent) {
    const s = this.s;
    if (this.careWheel?.active) return;
    if (
      e.shiftKey &&
      e.key.toLowerCase() === 'd' &&
      !/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName ?? '')
    ) {
      this.set({ devOpen: !s.devOpen });
      return;
    }
    if ((e.target as Element | null)?.closest?.('#tokiDev')) return;
    if (s.panelOpen) {
      if (e.key === 'Escape') this.wa.closePanel();
      return;
    }
    // Con la elección de control abierta siguen T, F, K, R, M, G y W (woki-os.html:1853-1881 y 2899-2910).
    if (s.calibOpen) this.calibKey(e);
    if (e.key === 'Escape' && s.alarm?.level === 'emergencia') {
      this.stopAlarm('Simulación cerrada');
      return;
    }
    if (s.alarm?.level === 'emergencia' && e.key !== 'r' && e.key !== 'R') {
      if (e.key === 'Tab') {
        e.preventDefault();
        document.getElementById('alDismiss')?.focus();
      }
      return;
    }
    const active = document.activeElement as HTMLElement | null;
    if (active && active.tagName === 'INPUT') {
      if (e.key === 'Enter' && active.id === 'ctxIn') {
        this.set({ cards: [] });
        void this.genSuggestions();
        active.blur();
      }
      if (e.key === 'Escape') active.blur();
      return;
    }
    if (e.repeat) return;
    if (e.code === 'Space' && active?.tagName !== 'BUTTON') {
      e.preventDefault();
      this.gestures.press('ceja', 'keyboard', performance.now());
    }
    const k = e.key.toLowerCase();
    if (k === 'r') this.rfid();
    if (k === 'k') void this.wa.openPanel();
    if (k === 'g') this.setGazeLost(!s.gazeLost);
    if (k === 'w') {
      const jitter = !s.jitter;
      this.set({ jitter });
      this.island('〰️', jitter ? 'Simulando error de webcam' : 'Sin error simulado');
    }
    if (k === 't') this.setTheme(document.documentElement.dataset.theme !== 'light');
    if (k === 'i' && !s.calibOpen) {
      const magnet = !s.magnet;
      this.set({ magnet });
      this.island('🧲', magnet ? 'Imán activado: el foco va al objetivo más cercano' : 'Imán desactivado');
    }
    if (k === 'm') {
      const muted = !s.muted;
      this.set({ muted });
      this.island(muted ? '🔕' : '🔔', muted ? 'Alarma en silencio' : 'Sonido de alarma activo');
    }
    if (k === 'f' && !e.metaKey && !e.ctrlKey && !e.altKey) this.toggleFullscreen();
  }

  /** Teclas con la elección de control abierta. woki-os.html:2899-2910 */
  private calibKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.closeCalibration();
      return;
    }
    if ((e.target as Element | null)?.closest?.('input, #legend, #devbar')) return;
    if (e.key === 'Enter' && !(e.target as Element | null)?.closest?.('button')) {
      e.preventDefault();
      this.chooseControl('start');
    }
    if (e.key.toLowerCase() === 'e') {
      e.preventDefault();
      this.chooseControl('gaze');
    }
    if (e.key.toLowerCase() === 'i') {
      e.preventDefault();
      this.chooseControl('iphone');
    }
  }

  /** Tiempo de mirada del bloqueo tras elegir (iPhone). Se conserva para la paridad del contrato. */
  static readonly LOCKOUT_MS = LOCKOUT_MS;

  ctxOf(): Ctx {
    return this.s.ctx;
  }
}

function curWordOf(text: string): string {
  const m = text.match(/([^\s]*)$/);
  return m ? m[1] : '';
}

function prevWordOf(text: string): string {
  const m = text.replace(/[^\s]*$/, '').match(/([^\s.!?]+)[\s]*$/);
  return m ? m[1] : '';
}
