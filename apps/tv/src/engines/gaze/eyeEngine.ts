// Fachada tipada del motor de mirada compartido (software/eye-tracking/web/js).
// La v2 importa el mismo motor que la demo y que la mirada con iPhone de la TV actual
// (software/toki-os/iphone-gaze.js:15-20). No lo copia: una sola fuente de verdad.
// @ts-expect-error: módulo JavaScript sin tipos; los tipos de abajo describen lo que usa la v2.
import * as calibration from '../../../../../software/eye-tracking/web/js/calibration.js';
// @ts-expect-error: idem
import * as connection from '../../../../../software/eye-tracking/web/js/connection.js';
// @ts-expect-error: idem
import * as model from '../../../../../software/eye-tracking/web/js/model.js';
// @ts-expect-error: idem
import * as protocol from '../../../../../software/eye-tracking/web/js/protocol.js';

export type Vec3 = [number, number, number];

export interface EyeFrame {
  tracked: boolean;
  [key: string]: unknown;
}

export interface Sample {
  pointId: number;
  target: { x: number; y: number };
  frame: EyeFrame;
}

export interface FitResult {
  model: unknown;
  cvErrorPx: number;
  [key: string]: unknown;
}

export interface FitOptions {
  headCorrection?: boolean;
  kinds?: readonly ('plane' | 'planeLinear')[];
}

interface EyeEngine {
  FRAME_FLOATS: number;
  FRAME_VERSION: number;
  IDX: Record<string, number>;
  decodeFrame(buf: ArrayBuffer): EyeFrame | null;
  fitBest(samples: Sample[], opts?: FitOptions): FitResult;
  predict(model: unknown, frame: EyeFrame): { x: number; y: number } | null;
  TRAIN_POINTS: readonly [number, number][];
  VALIDATION_POINTS: readonly [number, number][];
  toSocketUrl(input: string): string | null;
}

export const eyeEngine: EyeEngine = {
  FRAME_FLOATS: protocol.FRAME_FLOATS,
  FRAME_VERSION: protocol.FRAME_VERSION,
  IDX: protocol.IDX,
  decodeFrame: protocol.decodeFrame,
  fitBest: model.fitBest,
  predict: model.predict,
  TRAIN_POINTS: calibration.TRAIN_POINTS,
  VALIDATION_POINTS: calibration.VALIDATION_POINTS,
  toSocketUrl: connection.toSocketUrl,
};

/** Contrato de la TV con el iPhone: sin movimiento de cabeza y solo el plano lineal. iphone-gaze.js:24-27 */
export const IPHONE_FIT: FitOptions = Object.freeze({ headCorrection: false, kinds: ['planeLinear'] as const });
