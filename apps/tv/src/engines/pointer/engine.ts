// Motor del puntero: mueve el cursor, enfoca objetivos [data-t], cuenta la permanencia y elige.
// Port del bucle tick() de software/toki-os/woki-os.html:1901-2142, sin las ramas de cámara e iPhone
// (todavía no portadas). Trabaja sobre el DOM que pinta React, con las mismas clases CSS.
import { createPointerDwell } from './dwell';
import { createMagneticPointer, type Point } from './magnet';
import { createMenuPointer } from './menuPointer';
import { createDwellOutline } from './outline';

export interface PointerHost {
  /** Capa visible: descanso, anillo de emociones o la pantalla activa. */
  layer(): Element | null;
  /** Alarma, calibración, panel del acompañante o página oculta. */
  busy(): boolean;
  resting(): boolean;
  gazeLost(): boolean;
  careWheelActive(): boolean;
  myowareConfirming(): boolean;
  mode(): 'click' | 'dwell';
  dwellMs(): number;
  magnet(): boolean;
  jitter(): boolean;
  scale(): number;
  scanMs: number;
  settleMs: number;
  /** Ejecuta la acción del objetivo. */
  activate(el: HTMLElement, opts: { calibrate: boolean; immediate: boolean }): void;
  /** Se llama una vez por cuadro, después del puntero (alarma, inactividad, indicadores). */
  frame(now: number): void;
  /** El puntero de la cara está enfocado y la ceja está en curso (escaneo). */
  faceBrowActive?(): boolean;
}

const MAGNET_PULL = 0.3; // cuánto se acerca el cursor visible al centro del objetivo
const LOCKOUT_PULL_PX = 20; // margen estricto de SOS y Descansar (px del lienzo)

const gauss = () => Math.random() + Math.random() + Math.random() - 1.5;

export class PointerEngine {
  readonly mouse: Point = { x: innerWidth / 2, y: innerHeight / 2 };
  readonly gz: Point = { x: innerWidth / 2, y: innerHeight / 2 };
  private noise: Point = { x: 0, y: 0 };
  focus: HTMLElement | null = null;
  blocked: HTMLElement | null = null;
  armed = false;
  private fStart = 0;
  private scanIdx = -1;
  private scanT = 0;
  private raf = 0;
  private running = false;
  private readonly menuPointer = createMenuPointer();
  private readonly menuDwell = createPointerDwell();
  private readonly outline = createDwellOutline();
  private readonly restMagnet = createMagneticPointer<HTMLElement>('#rest [data-t]');
  private readonly restDwell = createPointerDwell();

  constructor(
    private readonly host: PointerHost,
    private readonly cursor: () => HTMLElement | null,
  ) {}

  start() {
    if (this.running) return;
    this.running = true;
    addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('click', this.onClick);
    const loop = (now: number) => {
      if (!this.running) return;
      this.tick(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('click', this.onClick);
  }

  /** Para conectar un rastreador real (window.setGaze en la TV actual). */
  setGaze(x: number, y: number) {
    this.mouse.x = x;
    this.mouse.y = y;
  }

  private onMouseMove = (e: MouseEvent) => {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  };

  /** Clic directo como alternativa al gesto. Respeta la capa visible. woki-os.html:1838-1849 */
  private onClick = (e: MouseEvent) => {
    const el = (e.target as Element | null)?.closest?.('[data-t][data-act]') as HTMLElement | null;
    if (!el || this.host.busy()) return;
    const layer = this.host.layer();
    if (!layer?.contains(el)) return;
    e.preventDefault();
    this.setFocus(el);
    this.blocked = el;
    el.classList.add('blocked');
    // Un clic de mouse no entrena la calibración de la mirada.
    this.activate(el, false, false);
  };

  visibleTargets(): HTMLElement[] {
    return [...(this.host.layer()?.querySelectorAll<HTMLElement>('[data-t]') ?? [])].filter(
      (el) => !el.classList.contains('emo'),
    );
  }

  clearFocus() {
    if (this.focus) this.focus.classList.remove('focus', 'armed');
    for (const b of document.querySelectorAll('.blocked')) b.classList.remove('blocked');
    this.focus = null;
    this.blocked = null;
    this.armed = false;
  }

  /** Limpia el estado del puntero sin tocar el foco (por ejemplo, al cambiar de modo). */
  resetDwell() {
    this.menuDwell.reset();
    this.outline.clear();
    this.restDwell.reset();
  }

  /** El puntero de menú olvida la última elección (confirmación de envío con otra ceja). */
  forgetLastChoice() {
    this.menuPointer.reset();
  }

  /** Reinicia el conteo del foco actual (tras la primera ceja de Enviar). */
  restartFocusTimer() {
    this.fStart = performance.now();
    this.menuDwell.reset();
  }

  setFocus(el: HTMLElement | null) {
    if (this.focus === el) return;
    if (this.focus) {
      this.focus.classList.remove('focus', 'armed');
      if (this.blocked === this.focus) {
        this.blocked.classList.remove('blocked');
        this.blocked = null;
      }
    }
    this.focus = el;
    this.fStart = performance.now();
    this.armed = false;
    if (el) {
      el.classList.add('focus');
      el.style.setProperty('--p', '0');
    }
  }

  activate(el: HTMLElement, calibrate: boolean, immediate: boolean) {
    if (calibrate) this.menuPointer.confirm(this.gz, el);
    el.classList.add('pressed');
    setTimeout(() => el.classList.remove('pressed'), 140);
    this.host.activate(el, { calibrate, immediate });
  }

  /** La ceja confirma el foco de la capa visible. woki-os.html:1819-1835 */
  confirmFocus(opts: { agentPending: boolean }): boolean {
    const f = this.focus;
    if (!f || !this.host.layer()?.contains(f)) return false;
    const gestureOnly = this.host.myowareConfirming();
    // Enviar exige otra ceja separada sobre el mismo objetivo.
    if (this.blocked === f && !(gestureOnly && opts.agentPending && f.dataset.act === 'agentSend')) return false;
    if (!this.host.gazeLost()) {
      if (f.dataset.act === 'sos' && !this.withinActionMargin(f)) return false;
    }
    if (this.host.gazeLost() || gestureOnly || (this.host.mode() === 'click' && this.armed)) {
      this.blocked = f;
      f.classList.add('blocked');
      this.activate(f, true, true);
      return true;
    }
    return false;
  }

  /** Cerca del objetivo: margen corto para acercarse, con una franja neutra entre acciones. */
  withinActionMargin(el: Element): boolean {
    const r = el.getBoundingClientRect();
    const { gz } = this;
    const d = Math.hypot(Math.max(r.left - gz.x, 0, gz.x - r.right), Math.max(r.top - gz.y, 0, gz.y - r.bottom));
    return d <= LOCKOUT_PULL_PX * this.host.scale();
  }

  /** Si el puntero quedó sobre `el` al cerrar una capa, debe salir antes de repetirlo. */
  blockIfUnderPointer(el: HTMLElement | null) {
    if (!el) return;
    if (el.contains(document.elementFromPoint(this.gz.x, this.gz.y))) {
      this.setFocus(el);
      this.blocked = el;
    }
  }

  private tick(now: number) {
    const h = this.host;
    if (h.careWheelActive()) {
      h.frame(now);
      return;
    }
    const { gz, mouse, noise } = this;
    // Temblor de webcam opcional y suavizado de unos 2 cuadros.
    const sig = h.jitter() ? 110 * h.scale() : 0;
    noise.x = noise.x * 0.88 + gauss() * sig * 0.35;
    noise.y = noise.y * 0.88 + gauss() * sig * 0.35;
    gz.x += (mouse.x + noise.x - gz.x) * 0.45;
    gz.y += (mouse.y + noise.y - gz.y) * 0.45;
    const gestureOnly = h.myowareConfirming();
    const gazeLost = h.gazeLost();
    let cx = gz.x;
    let cy = gz.y;
    if (h.magnet() && this.focus?.isConnected && !gazeLost) {
      const r = this.focus.getBoundingClientRect();
      cx += (r.left + r.width / 2 - gz.x) * MAGNET_PULL;
      cy += (r.top + r.height / 2 - gz.y) * MAGNET_PULL;
    }
    const cur = this.cursor();
    if (cur) cur.style.transform = `translate(${cx}px,${cy}px)`;

    const busy = h.busy();
    const resting = h.resting() && !gazeLost;
    const magnetic = h.magnet();
    const menuAim = !busy && !h.resting() && !gazeLost;
    if (!menuAim) this.menuPointer.reset();
    if (busy || resting || gazeLost) {
      this.menuDwell.reset();
      this.outline.clear();
    }
    if (busy || !resting) {
      this.restDwell.reset();
      this.restMagnet.reset();
    }
    if (!busy && resting) this.restWakeTick(now);
    else if (!busy) {
      if (gazeLost) this.scanTick(now, gestureOnly);
      else this.aimTick(now, gestureOnly, magnetic, cur);
    }
    h.frame(now);
  }

  private aimTick(now: number, gestureOnly: boolean, magnetic: boolean, cur: HTMLElement | null) {
    const h = this.host;
    const aim = this.menuPointer.resolve(this.gz, now, h.layer(), cur, null, null, { magnetic });
    let el = aim.target;
    const entered = aim.inside ? el : null;
    if (el?.matches('.sos-nav,.rest-nav') && !this.withinActionMargin(el)) el = null;
    const inside = !!el && entered === el;
    const dwellElapsed = gestureOnly ? -1 : this.menuDwell.sample(el, now, inside);
    if (!el || el !== this.focus || dwellElapsed < 0) this.outline.clear();
    this.setFocus(el);
    const f = this.focus;
    if (!f || gestureOnly) return;
    const r = f.getBoundingClientRect();
    f.style.setProperty('--mx', `${((this.gz.x - r.left) / r.width) * 100}%`);
    f.style.setProperty('--my', `${((this.gz.y - r.top) / r.height) * 100}%`);
    const forced = f.dataset.dwell ? Number(f.dataset.dwell) : null;
    const automatic = !!forced || h.mode() === 'dwell';
    const elapsed = automatic ? Math.max(0, dwellElapsed) : Math.max(0, now - this.fStart);
    const target = automatic ? forced || h.dwellMs() : h.settleMs;
    const p = Math.min(1, elapsed / target);
    f.style.setProperty('--p', String(p));
    const cardEdge = f.matches('#tiles .tile,.nav-action');
    const showEdge = automatic ? dwellElapsed >= 0 : cardEdge;
    this.outline.paint(showEdge ? f : null, p);
    if (p >= 1 && this.blocked !== f && (!automatic || inside)) {
      if (automatic) {
        this.blocked = f;
        f.classList.add('blocked');
        this.activate(f, true, false);
      } else if (!this.armed) {
        this.armed = true;
        f.classList.add('armed');
      }
    }
  }

  /** Sin rostro: el foco recorre los objetivos y la ceja elige. woki-os.html:2015-2017 */
  private scanTick(now: number, gestureOnly: boolean) {
    if (this.focus && this.host.faceBrowActive?.()) this.scanT = now;
    if (now - this.scanT <= this.host.scanMs) return;
    const v = this.visibleTargets();
    if (v.length) {
      this.scanIdx = (this.scanIdx + 1) % v.length;
      this.setFocus(v[this.scanIdx]);
      if (!gestureOnly && this.focus) {
        this.armed = true;
        this.focus.classList.add('armed');
        this.focus.style.setProperty('--p', '1');
      }
    }
    this.scanT = now;
  }

  resetScan() {
    this.scanIdx = -1;
  }

  /** Descanso: Volver y SOS con 2 s de mirada. woki-os.html:2127-2142 */
  private restWakeTick(now: number) {
    const h = this.host;
    const direct = (document.elementFromPoint(this.gz.x, this.gz.y)?.closest('#rest [data-t]') ??
      null) as HTMLElement | null;
    const aim = h.magnet() ? this.restMagnet.aim(this.gz, now, (el) => Boolean(el)) : { target: direct };
    const target = aim.target && this.withinActionMargin(aim.target) ? aim.target : null;
    if (target !== this.focus && this.focus) this.focus.style.setProperty('--p', '0');
    this.setFocus(target);
    if (h.myowareConfirming()) return;
    const inside = Boolean(target && target === direct);
    const elapsed = this.restDwell.sample(target, now, inside);
    if (!target || this.blocked === target) return;
    this.armed = elapsed >= h.settleMs;
    target.classList.toggle('armed', this.armed);
    const progress = Math.min(1, Math.max(0, elapsed) / Number(target.dataset.dwell));
    target.style.setProperty('--p', String(progress));
    if (inside && progress >= 1) {
      this.blocked = target;
      this.activate(target, false, false);
    }
  }
}
