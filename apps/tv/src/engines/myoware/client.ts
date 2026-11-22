// Cliente MyoWare: lee /emg/gestures del monitor, calibra, detecta la ceja y la mandíbula y avisa cortes.
// Port de setupMyoWareGestures (software/toki-os/myoware-click.js:238-481) sin DOM: el estado sale por
// onChange y React lo pinta. Mismos tiempos, mismos textos y misma clave de almacenamiento.
import {
  createCalibration,
  createGestureCursor,
  createGestureDetector,
  MAX_AGE_MS,
  MYOWARE_PROFILE_KEY,
  type Packet,
  type SavedProfile,
  validMyoWareProfile,
} from './detector';

const ACTIVE_POLL_MS = 30;
const RETRY_POLL_MS = 120;
const OUTAGE_NOTICE_MS = 1500;
const OUTAGE_POLL_MS = 500;

export type MyoMode = 'off' | 'calibrating' | 'active';
export type MyoSource = 'ceja' | 'mandibula';
export type MyoEdge = 'down' | 'up' | 'cancel' | 'alive';

export interface MyoView {
  mode: MyoMode;
  saved: boolean;
  status: string;
  result: string;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface MyoWareOptions {
  onInput?: (src: MyoSource | null, edge: MyoEdge, time?: number) => void;
  onChange?: (view: MyoView) => void;
  onActivate?: () => void;
  onUnavailable?: (message: string) => void;
  onRecovered?: () => void;
  url?: string;
  fetchImpl?: (url: string, init?: RequestInit) => Promise<Pick<Response, 'ok' | 'json'>>;
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  storage?: StorageLike | null;
  tabStorage?: StorageLike | null;
  visible?: () => boolean;
}

function readProfile(storage: StorageLike): SavedProfile | null {
  const value = JSON.parse(storage.getItem(MYOWARE_PROFILE_KEY) ?? 'null');
  return validMyoWareProfile(value) ? value : null;
}

const safe = <T>(fn: () => T): T | null => {
  try {
    return fn();
  } catch {
    return null;
  }
};

export class MyoWareClient {
  private saved: SavedProfile | null;
  private mode: MyoMode = 'off';
  private runId = 0;
  private resume = false;
  private counts = { brow: 0, jaw: 0 };
  private status = 'Gestos desactivados. Confirma que ambos sensores estén en modo ENV.';
  private result = 'Último gesto: —';
  private readonly o: Required<Omit<MyoWareOptions, 'onInput' | 'onActivate' | 'onUnavailable' | 'onRecovered'>> &
    MyoWareOptions;

  constructor(opts: MyoWareOptions = {}) {
    this.o = {
      url: '/emg/gestures',
      fetchImpl: (url, init) => fetch(url, init),
      now: () => performance.now(),
      setTimer: (fn, ms) => setTimeout(fn, ms),
      storage: safe(() => localStorage),
      tabStorage: safe(() => sessionStorage),
      visible: () => document.visibilityState === 'visible',
      onChange: () => {},
      ...opts,
    };
    this.saved = this.loadSaved();
    if (this.saved) this.status = 'Calibración guardada. Activa los gestos o la prueba para usarla.';
  }

  get view(): MyoView {
    return { mode: this.mode, saved: !!this.saved, status: this.status, result: this.result };
  }

  private emit() {
    this.o.onChange(this.view);
  }

  private setStatus(text: string) {
    if (this.status === text) return;
    this.status = text;
    this.emit();
  }

  private loadSaved(): SavedProfile | null {
    const { storage, tabStorage } = this.o;
    const local = storage ? safe(() => readProfile(storage)) : null;
    if (local) return local;
    const previous = tabStorage ? safe(() => readProfile(tabStorage)) : null;
    if (previous) this.save(previous);
    return previous;
  }

  private save(value: SavedProfile | null) {
    this.saved = value;
    const { storage, tabStorage } = this.o;
    let persisted = false;
    if (storage)
      persisted = !!safe(() => {
        if (value) storage.setItem(MYOWARE_PROFILE_KEY, JSON.stringify(value));
        else storage.removeItem(MYOWARE_PROFILE_KEY);
        return true;
      });
    if (tabStorage)
      safe(() => {
        if (value && !persisted) tabStorage.setItem(MYOWARE_PROFILE_KEY, JSON.stringify(value));
        else tabStorage.removeItem(MYOWARE_PROFILE_KEY);
      });
  }

  /** Activa los gestos si hay calibración. Devuelve true si quedaron activos. */
  enable(): boolean {
    if (this.mode === 'off' && this.saved) this.start('active');
    return this.mode === 'active';
  }

  /** Botón «Calibrar gestos» o «Cancelar calibración». */
  calibrate() {
    if (this.mode === 'calibrating') {
      this.stop('Calibración cancelada.', true);
      return;
    }
    this.save(null);
    this.start('calibrating');
  }

  /** Botón «Activar gestos» o «Desactivar gestos». */
  toggle() {
    if (this.mode === 'active') this.stop(this.o.onInput ? 'Gestos desactivados.' : 'Prueba detenida.');
    else if (this.saved) {
      this.o.onActivate?.();
      this.start('active');
    }
  }

  /** «Usar mouse + gestos MyoWare» en la elección de control. */
  enterWithMouse(enter: () => void) {
    if (!this.saved || this.mode !== 'off') return;
    enter();
    this.start('active');
  }

  private stop(message: string, clear = false) {
    if (this.mode === 'active') this.o.onInput?.(null, 'cancel');
    this.runId++;
    this.mode = 'off';
    this.resume = false;
    if (clear) this.save(null);
    this.status = message;
    this.emit();
  }

  private start(nextMode: 'calibrating' | 'active') {
    this.mode = nextMode;
    const id = ++this.runId;
    const saved = this.saved;
    const calibration = nextMode === 'calibrating' ? createCalibration() : null;
    if (!calibration && !saved) return;
    const o = this.o;
    let freshAfter = Infinity;
    let lastPollAt: number | null = null;
    let retrySince: number | null = null;
    let warned = false;
    const createDetector = () =>
      createGestureDetector((saved as SavedProfile).profile, (name, edge, time) => {
        if (edge === 'cancel' || time >= freshAfter) o.onInput?.(name === 'brow' ? 'ceja' : 'mandibula', edge, time);
        else o.onInput?.(null, 'cancel');
      });
    let read = createGestureCursor(calibration ? null : (saved as SavedProfile).source);
    let detect = calibration ? null : createDetector();
    this.counts = { brow: 0, jaw: 0 };
    this.result = 'Último gesto: —';
    this.status = calibration
      ? 'Buscando ambos canales para calibrar…'
      : 'Relaja la frente y la mandíbula antes del primer gesto.';
    this.emit();

    const resetActiveInput = (now: number) => {
      if (retrySince === null) {
        retrySince = now;
        o.onInput?.(null, 'cancel');
        this.setStatus('Recuperando la señal MyoWare… La calibración sigue guardada.');
      }
      // Se vuelve a sembrar con datos vivos: no se reusa un gesto armado ni su historia.
      freshAfter = Infinity;
      lastPollAt = null;
      read = createGestureCursor((saved as SavedProfile).source);
      detect = createDetector();
    };

    const poll = async () => {
      if (id !== this.runId) return;
      let valid = false;
      try {
        const started = o.now();
        const response = await o.fetchImpl(o.url, { cache: 'no-store', signal: AbortSignal.timeout?.(750) });
        if (!response.ok) throw Error();
        const packet = (await response.json()) as Packet;
        if (id !== this.runId || !o.visible()) return;
        if (!calibration && packet.source && packet.source !== saved?.source) {
          const message = 'Cambió la conexión del sensor. Vuelve a calibrar los gestos.';
          this.stop(message, true);
          o.onUnavailable?.(message);
          return;
        }
        const now = o.now();
        const roundTrip = now - started;
        if (!calibration && lastPollAt !== null && now - lastPollAt > MAX_AGE_MS) resetActiveInput(now);
        const frames = read(packet, roundTrip);
        if (!frames) throw Error();
        valid = true;
        if (calibration) {
          for (const row of frames) {
            const outcome = calibration.sample(...row);
            if (!outcome) continue;
            this.save(outcome.profile ? { profile: outcome.profile, source: String(packet.source) } : null);
            this.stop(outcome.profile ? `Calibración lista. ${outcome.summary}` : (outcome.error ?? ''));
            return;
          }
          this.setStatus(calibration.message());
        } else {
          lastPollAt = now;
          if (frames.length) {
            retrySince = null;
            if (warned) o.onRecovered?.();
            warned = false;
            freshAfter = frames[frames.length - 1][0] + (packet.age ?? 0) + roundTrip - MAX_AGE_MS;
          }
          const newest = packet.frames[packet.frames.length - 1][0];
          for (const row of frames) {
            const gesture = detect?.(...row);
            if (!gesture || newest - row[0] + (packet.age ?? 0) + roundTrip > MAX_AGE_MS) continue;
            this.counts[gesture]++;
            const label = gesture === 'brow' ? 'Ceja' : 'Mandíbula';
            this.result = `Último gesto: ${label} · Ceja: ${this.counts.brow} · Mandíbula: ${this.counts.jaw}`;
            this.emit();
          }
          if (frames.length) o.onInput?.(null, 'alive');
          if (retrySince === null)
            this.setStatus(
              o.onInput
                ? 'Gestos activos: levanta la ceja para elegir. Suéltala antes del siguiente clic.'
                : 'Prueba activa. Relaja la cara entre gestos.',
            );
        }
      } catch {
        if (id !== this.runId) return;
        if (calibration) {
          this.stop('No hay señal reciente de ambos canales. Revisa la conexión y vuelve a iniciar la calibración.');
          return;
        }
        resetActiveInput(o.now());
      }
      if (id === this.runId) {
        const outage = retrySince === null ? 0 : o.now() - retrySince;
        if (!valid && outage >= OUTAGE_NOTICE_MS && !warned) {
          warned = true;
          const message = 'Sin señal MyoWare. Revisa la conexión; Myo seguirá intentando.';
          this.setStatus(message);
          o.onUnavailable?.(message);
        }
        const delay = valid
          ? calibration || !o.onInput
            ? 60
            : ACTIVE_POLL_MS
          : warned
            ? OUTAGE_POLL_MS
            : RETRY_POLL_MS;
        o.setTimer(poll, delay);
      }
    };
    void poll();
  }

  /** La página se ocultó: pausa y, si estaba activo, reanuda al volver. */
  pause() {
    if (this.mode === 'off') return;
    const wasActive = this.mode === 'active';
    this.stop(
      wasActive ? 'En pausa mientras la página está oculta.' : 'Se interrumpió la calibración. Vuelve a iniciarla.',
    );
    this.resume = wasActive;
  }

  restore() {
    if (!this.o.visible() || this.mode !== 'off') return;
    const previous = this.saved;
    this.saved = this.loadSaved();
    if (this.resume && this.saved && this.saved.source === previous?.source) {
      this.resume = false;
      this.start('active');
      return;
    }
    this.resume = false;
    if (this.saved && !previous) this.status = 'Calibración guardada. Activa los gestos o la prueba para usarla.';
    else if (!this.saved && previous) this.status = 'No hay una calibración guardada.';
    this.emit();
  }

  /** Otra pestaña cambió la calibración. */
  storageChanged() {
    if (this.mode === 'active') this.stop('La calibración cambió en otra pestaña. Vuelve a activar cuando esté lista.');
    this.restore();
  }
}
