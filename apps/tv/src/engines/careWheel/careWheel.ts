// Rueda de cuidados: sectores por dirección de la mirada y escaneo por turnos. La ceja confirma.
// Port de software/toki-os/care-wheel.js. Mismas opciones, mismos textos y mismo orden de escaneo.

type Slot = 'north' | 'east' | 'south' | 'west' | 'center';
type Option = [string, string, Slot];

const MAIN: Option[] = [
  ['urgent', 'Ayuda urgente', 'north'],
  ['attention', 'Avisar a mi cuidador', 'east'],
  ['phrases', 'Frases rápidas', 'south'],
  ['back', 'Volver', 'west'],
  ['close', 'Cerrar', 'center'],
];
const PHRASES: Option[] = [
  ['position', 'Necesito cambiar de postura', 'north'],
  ['pain', 'Me duele', 'east'],
  ['bathroom', 'Necesito ir al baño', 'south'],
  ['moment', 'Dame un momento', 'west'],
  ['main', 'Volver a la rueda', 'center'],
];
const URGENT: Option[] = [
  ['sos', 'Iniciar SOS de prueba', 'north'],
  ['main', 'Cancelar', 'center'],
];

export interface ButtonLike {
  type: string;
  dataset: Record<string, string | undefined>;
  textContent: string | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  addEventListener(name: string, fn: () => void): void;
  focus(): void;
  click(): void;
}

export interface DialogLike {
  open: boolean;
  showModal(): void;
  close(): void;
  querySelector(selector: string): unknown;
  addEventListener(name: string, fn: (event: Event) => void): void;
}

export interface CareWheelOptions {
  announce(text: string): void;
  silence(): void;
  onAttention(): void;
  onSOS(): void;
  onPhrase(text: string): void;
  onBack(): void;
  scanMs: number;
  doc?: {
    hidden: boolean;
    createElement(tag: 'button'): ButtonLike;
    addEventListener(name: string, fn: () => void): void;
  };
  win?: { addEventListener(name: string, fn: () => void): void };
  timers?: { setInterval(fn: () => void, ms: number): unknown; clearInterval(id: unknown): void };
}

export interface CareWheel {
  readonly active: boolean;
  open(): void;
  close(): void;
  back(): void;
  updateGaze(point: { x: number; y: number } | null, now: number): void;
  confirm(): void;
  destroy(): void;
}

interface Container {
  getBoundingClientRect(): { left: number; top: number; width: number; height: number };
  replaceChildren(...nodes: unknown[]): void;
  dataset: Record<string, string | undefined>;
}

export function createCareWheel(dialog: DialogLike, opts: CareWheelOptions): CareWheel {
  const { announce, silence, onAttention, onSOS, onPhrase, onBack, scanMs } = opts;
  const doc = opts.doc ?? (document as unknown as NonNullable<CareWheelOptions['doc']>);
  const win = opts.win ?? window;
  const timers = opts.timers ?? {
    setInterval: (fn: () => void, ms: number) => setInterval(fn, ms),
    clearInterval: (id: unknown) => clearInterval(id as ReturnType<typeof setInterval>),
  };
  const title = dialog.querySelector('h2') as { textContent: string | null };
  const hint = dialog.querySelector('#care-hint') as { textContent: string | null };
  const choices = dialog.querySelector('#care-choices') as Container;
  const label = dialog.querySelector('#care-current') as { textContent: string | null };
  const pause = dialog.querySelector('#care-pause') as ButtonLike;
  let view: 'main' | 'urgent' | 'phrases' = 'main';
  let selected: ButtonLike | null = null;
  let timer: unknown = null;
  let buttons: ButtonLike[] = [];
  let paused = false;
  let bounds: { left: number; top: number; width: number; height: number } | null = null;
  let direction: Slot | null = null;
  let blockedDirection: Slot | null = null;
  let missingSince: number | null = null;

  function gazeSlot(x: number, y: number): Slot | null {
    const horizontal = Math.abs(x);
    const vertical = Math.abs(y);
    const distance = Math.max(horizontal, vertical);
    if (distance < 0.22) return 'center';
    if (distance < 0.34) return direction;
    const side: Slot = x < 0 ? 'west' : 'east';
    const height: Slot = y < 0 ? 'north' : 'south';
    // Conserva el sector anterior cerca de las diagonales en vez de cambiar por ruido.
    if (direction === side && horizontal >= 0.8 * vertical) return side;
    if (direction === height && vertical >= 0.8 * horizontal) return height;
    return horizontal >= vertical ? side : height;
  }

  function highlight(index: number) {
    selected?.removeAttribute('data-scanned');
    selected = buttons[index];
    selected.setAttribute('data-scanned', '');
    label.textContent = selected.textContent;
    announce(selected.textContent ?? '');
  }

  function stopScan() {
    if (timer !== null) timers.clearInterval(timer);
    timer = null;
    silence();
  }

  function startScan(index: number) {
    stopScan();
    highlight(index);
    if (!paused && !doc.hidden) {
      timer = timers.setInterval(
        () => highlight((buttons.indexOf(selected as ButtonLike) + 1) % buttons.length),
        scanMs,
      );
    }
  }

  function updateGaze(point: { x: number; y: number } | null, now: number) {
    if (!dialog.open || doc.hidden) return;
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      missingSince ??= now;
      if (direction && now - missingSince >= 350) {
        direction = blockedDirection = null;
        startScan(buttons.length - 1);
      }
      return;
    }
    missingSince = null;
    bounds ??= choices.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = ((point.x - bounds.left) * 2) / bounds.width - 1;
    const y = ((point.y - bounds.top) * 2) / bounds.height - 1;
    const slot = gazeSlot(x, y);
    if (!slot || slot === blockedDirection) return;
    blockedDirection = null;
    if (slot === 'center') {
      if (direction) {
        direction = null;
        startScan(buttons.length - 1);
      }
      return;
    }
    const index = buttons.findIndex((button) => button.dataset.slot === slot);
    if (index === -1) {
      if (direction) {
        direction = null;
        startScan(buttons.length - 1);
      }
      return;
    }
    if (direction === slot) return;
    direction = slot;
    stopScan();
    highlight(index);
  }

  function show(next: 'main' | 'urgent' | 'phrases') {
    // Mirar arriba para entrar a Urgente no debe resaltar también su confirmación.
    blockedDirection = direction;
    direction = null;
    bounds = null;
    view = next;
    title.textContent =
      next === 'urgent' ? 'Ayuda urgente' : next === 'phrases' ? 'Frases rápidas' : 'Rueda de cuidados';
    hint.textContent =
      next === 'urgent'
        ? 'Es una simulación. No se llamará ni se enviará ningún mensaje.'
        : 'Mira hacia un sector o escucha el escaneo. Levanta la ceja para confirmar.';
    const options = next === 'urgent' ? URGENT : next === 'phrases' ? PHRASES : MAIN;
    buttons = options.map(([id, text, slot]) => {
      const button = doc.createElement('button');
      button.type = 'button';
      button.dataset.slot = slot;
      button.textContent = text;
      button.addEventListener('click', () => choose(id, text));
      return button;
    });
    choices.replaceChildren(...buttons);
    choices.dataset.view = next;
    buttons[buttons.length - 1].focus();
    startScan(buttons.length - 1);
  }

  function close() {
    if (!dialog.open) return;
    stopScan();
    direction = blockedDirection = missingSince = null;
    selected = null;
    dialog.close();
  }

  function choose(id: string, text: string) {
    if (!dialog.open) return;
    if (id === 'urgent' || id === 'phrases' || id === 'main') {
      show(id);
      return;
    }
    close();
    if (id === 'sos') onSOS();
    else if (id === 'attention') onAttention();
    else if (id === 'back') onBack();
    else if (id !== 'close') onPhrase(text);
  }

  const onPause = () => {
    paused = !paused;
    pause.textContent = paused ? 'Reanudar escaneo' : 'Pausar escaneo';
    if (paused) stopScan();
    else {
      blockedDirection = direction;
      direction = null;
      startScan(buttons.indexOf(selected as ButtonLike));
    }
  };
  pause.addEventListener('click', onPause);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  const onVisibility = () => {
    if (!dialog.open) return;
    if (doc.hidden) stopScan();
    else {
      direction = blockedDirection = missingSince = null;
      startScan(buttons.length - 1);
    }
  };
  doc.addEventListener('visibilitychange', onVisibility);
  const resetBounds = () => {
    bounds = null;
  };
  win.addEventListener('resize', resetBounds);
  dialog.addEventListener('scroll', resetBounds);

  return {
    get active() {
      return dialog.open;
    },
    open() {
      if (dialog.open) return;
      paused = false;
      pause.textContent = 'Pausar escaneo';
      dialog.showModal();
      show('main');
    },
    close,
    back() {
      if (view === 'main') close();
      else show('main');
    },
    updateGaze,
    confirm() {
      if (dialog.open) selected?.click();
    },
    destroy() {
      stopScan();
      (doc as unknown as Document).removeEventListener?.('visibilitychange', onVisibility);
      (win as unknown as Window).removeEventListener?.('resize', resetBounds);
    },
  };
}
