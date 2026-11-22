// Ceja para elegir y mandíbula como atajo. Port de software/toki-os/woki-os.html:1763-1815.
// Fuentes: teclado (Espacio simula la ceja), MyoWare, puente EMG por WebSocket y clic con la cara.

export type Source = 'ceja' | 'mandibula';
export type Origin = 'keyboard' | 'myoware' | 'ws' | 'face';
export type MyoEdge = 'down' | 'up' | 'cancel' | 'alive';

export interface GestureHost {
  /** Panel abierto, alarma (salvo la de la rueda), calibración o página oculta. */
  blocked(): boolean;
  focus(): unknown;
  confirmFocus(): void;
  careWheelActive(): boolean;
  careWheelBack(): void;
  openCareWheel(): void;
  canOpenCareWheel(): boolean;
  myowareConfirming(): boolean;
  emergency(): boolean;
  goBack(): void;
  flash(src: Source): void;
  /** Juego externo: si captura el punto, la ceja confirma ahí. */
  captureGamePoint?(): boolean;
}

export const FACE_BROW_MAX_MS = 900;

export interface Gestures {
  press(src: Source, origin: Origin, time: number): void;
  release(src: Source, origin: Origin, time: number): void;
  receiveMyoWare(src: Source | null, edge: MyoEdge, time: number): void;
  cancel(origin?: Origin): void;
  readonly browActive: boolean;
  readonly browOrigin: Origin | null;
  readonly watchdogActive: boolean;
}

export function createGestures(host: GestureHost, timers = { set: setTimeout, clear: clearTimeout }): Gestures {
  let brow: { origin: Origin; time: number; focus: unknown } | null = null;
  let jaw = false;
  let watchdog: ReturnType<typeof setTimeout> | null = null;

  function cancel(origin?: Origin) {
    if (!origin || brow?.origin === origin) brow = null;
    if (!origin || origin === 'myoware') {
      jaw = false;
      if (watchdog) timers.clear(watchdog);
      watchdog = null;
    }
  }

  function press(src: Source, origin: Origin, time: number) {
    if (src !== 'ceja' || brow || host.blocked()) return;
    brow = { origin, time, focus: host.focus() };
    host.flash(src);
    if (origin !== 'face') {
      if (host.captureGamePoint?.()) return;
      host.confirmFocus();
    }
  }

  function release(src: Source, origin: Origin, time: number) {
    const b = brow;
    if (src !== 'ceja' || b?.origin !== origin) return;
    brow = null;
    const elapsed = time - b.time;
    // Con la cara, la ceja confirma al soltar, si fue breve y el foco no cambió.
    if (origin === 'face' && elapsed >= 0 && elapsed < FACE_BROW_MAX_MS && b.focus === host.focus() && !host.blocked())
      host.confirmFocus();
  }

  function jawShortcut(edge: MyoEdge) {
    if (edge === 'up' || edge === 'cancel') {
      jaw = false;
      return;
    }
    if (edge !== 'down' || jaw || !host.myowareConfirming() || host.emergency() || host.blocked()) return;
    jaw = true;
    host.flash('mandibula');
    if (host.careWheelActive()) host.careWheelBack();
    else if (host.canOpenCareWheel()) host.openCareWheel();
    else host.goBack();
  }

  function receiveMyoWare(src: Source | null, edge: MyoEdge, time: number) {
    if (edge === 'alive') {
      if (watchdog) timers.clear(watchdog);
      watchdog = timers.set(() => cancel('myoware'), 250);
    } else if (edge === 'cancel' && (!src || src === 'ceja')) cancel('myoware');
    else if (src === 'mandibula') jawShortcut(edge);
    else if (src && edge === 'down') press(src, 'myoware', time);
    else if (src && edge === 'up') release(src, 'myoware', time);
  }

  return {
    press,
    release,
    receiveMyoWare,
    cancel,
    get browActive() {
      return !!brow;
    },
    get browOrigin() {
      return brow?.origin ?? null;
    },
    get watchdogActive() {
      return !!watchdog;
    },
  };
}
