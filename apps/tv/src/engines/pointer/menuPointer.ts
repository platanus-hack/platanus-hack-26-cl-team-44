// Puntero de menú: imán sobre los objetivos [data-t] de la capa visible y bloqueo tras elegir.
// Port de software/toki-os/magnetic-pointer.js:133-155. Mismo comportamiento.
import { type Aim, type AimOptions, createMagneticPointer, type HitTester, type Point } from './magnet';

/** Sensor de cámara (nariz o mirada). Sin cámara, el puntero es el mouse. */
export interface CameraSensor {
  on: boolean;
  raw: unknown;
  lastFace: number;
  mode: 'nose' | 'gaze';
}

export interface GazeSource {
  hasPoint?(now: number): boolean;
  cur?: { blink: boolean } | null;
}

export interface MenuPointer {
  resolve(
    point: Point,
    now: number,
    layer: Element | null,
    cursor: HTMLElement | null,
    sensor?: CameraSensor | null,
    gaze?: GazeSource | null,
    options?: AimOptions,
  ): Aim<HTMLElement> | { target: null; inside?: false };
  reset(): void;
  confirm(point: Point, target: HTMLElement | null): void;
}

export function isEligible(el: HTMLElement | null, layer: Element | null): boolean {
  if (!el?.isConnected || !layer?.contains(el)) return false;
  if ((el as HTMLButtonElement).disabled) return false;
  return !el.closest('[hidden],[inert],[aria-disabled="true"]');
}

export function createMenuPointer(
  doc?: HitTester<HTMLElement>,
  isHidden: () => boolean = () => document.hidden,
): MenuPointer {
  const magnet = createMagneticPointer<HTMLElement>('[data-t]', doc);
  let lastActivation: (Point & { target: HTMLElement | null }) | null = null;
  function reset() {
    magnet.reset();
    lastActivation = null;
  }
  function resolve(
    point: Point,
    now: number,
    layer: Element | null,
    cursor: HTMLElement | null,
    sensor?: CameraSensor | null,
    gaze?: GazeSource | null,
    options?: AimOptions,
  ) {
    const gazeReady = gaze?.hasPoint ? gaze.hasPoint(now) : !!gaze?.cur && !gaze.cur.blink;
    if (
      isHidden() ||
      (sensor?.on && (!sensor.raw || now - sensor.lastFace > 240 || (sensor.mode === 'gaze' && !gazeReady)))
    ) {
      reset();
      return { target: null } as const;
    }
    const aim = magnet.aim(point, now, (el) => isEligible(el, layer), options);
    if (cursor) cursor.style.transform = `translate(${aim.x}px,${aim.y}px)`;
    if (lastActivation) {
      if (
        aim.target === lastActivation.target ||
        Math.hypot(point.x - lastActivation.x, point.y - lastActivation.y) < 24
      ) {
        return { ...aim, target: null, inside: false };
      }
      lastActivation = null;
    }
    return aim;
  }
  return {
    resolve,
    reset,
    confirm(point, target) {
      lastActivation = { x: point.x, y: point.y, target };
      magnet.reset();
    },
  };
}
