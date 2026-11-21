/**
 * Generador sintético realista de cuadros (protocolo v2) para tests y para el simulador.
 * Imita lo que medimos en datos reales: ARKit mide bien la pose de la cabeza pero
 * COMPRIME el giro del ojo dentro de la cabeza (ganancia ~0,4–0,5) y agrega ruido.
 *
 * Mundo = coordenadas de cámara del iPhone: x derecha, y arriba, la cámara mira hacia -z
 * (la cara está en z < 0 y su eje +z apunta de vuelta a la cámara).
 */
import { FRAME_FLOATS, FRAME_VERSION, IDX, decodeFrame } from "./protocol.js";
import { add, eulerToMat, matToQuat, mulMV, mulMtV, normalize, scale, sub } from "./geometry.js";

/** Pantalla de ejemplo: 1512×982 px de 0,199 mm, encima y un poco detrás del iPhone, algo inclinada. */
export function exampleScreen({ widthPx = 1512, heightPx = 982, metersPerPx = 0.000199, tiltDeg = 12, centerY = 0.16, centerZ = 0.04 } = {}) {
  const t = (tiltDeg * Math.PI) / 180;
  const X = [1, 0, 0];
  const Y = [0, -Math.cos(t), -Math.sin(t)]; // "abajo" en la pantalla, inclinada hacia atrás
  const C = [0, centerY, centerZ];
  const O = sub(C, scale(add(scale(X, widthPx / 2), scale(Y, heightPx / 2)), metersPerPx));
  return Object.freeze({ O, X, Y, s: metersPerPx, widthPx, heightPx });
}

export const screenPoint = (scr, u, v) => add(scr.O, scale(add(scale(scr.X, u), scale(scr.Y, v)), scr.s));

const deg = (d) => (d * Math.PI) / 180;
const angles = (l) => [Math.atan2(l[0], l[2]), Math.atan2(l[1], Math.hypot(l[0], l[2]))];
const fromAngles = (yaw, pitch) => [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];

/**
 * @param {{head?:number[], yaw?:number, pitch?:number, roll?:number, target:{x:number,y:number}, screen:object,
 *          gain?:number[], noiseDeg?:number, blinkL?:number, blinkR?:number, rand?:()=>number}} o
 *   head: punto medio entre los ojos (m); yaw/pitch/roll de la cabeza en grados (0 = mirando a la cámara).
 */
export function synthFrame(o) {
  const { head = [0, 0.05, -0.5], yaw = 0, pitch = 0, roll = 0, target, screen, gain = [0.45, 0.45], noiseDeg = 0, blinkL = 0.05, blinkR = 0.05, rand = Math.random } = o;
  // Orientación base: la cara mira hacia la cámara (+z en cámara).
  const R = eulerToMat(deg(yaw), deg(pitch), deg(roll));
  const P = screenPoint(screen, target.x, target.y);
  const eyeOff = mulMV(R, [0.031, 0, 0]);
  const eyes = [sub(head, eyeOff), add(head, eyeOff)];
  const jitter = () => deg((rand() - 0.5) * 2 * noiseDeg);
  const reported = eyes.map((e) => {
    const trueLocal = mulMtV(R, normalize(sub(P, e)));
    const [ty, tp] = angles(trueLocal);
    const local = fromAngles(gain[0] * ty + jitter(), gain[1] * tp + jitter()); // compresión tipo ARKit
    return mulMV(R, local);
  });
  const f = new Float32Array(FRAME_FLOATS);
  f[IDX.version] = FRAME_VERSION;
  f[IDX.tracked] = 1;
  f.set(eyes[0], IDX.leftEyePos);
  f.set(reported[0], IDX.leftEyeDir);
  f.set(eyes[1], IDX.rightEyePos);
  f.set(reported[1], IDX.rightEyeDir);
  const mid = normalize(add(reported[0], reported[1]));
  f.set(add(head, scale(mid, 0.5)), IDX.lookAt);
  f.set(head, IDX.headPos);
  f.set([R[0][2], R[1][2], R[2][2]], IDX.headFwd);
  f[IDX.blinkL] = blinkL;
  f[IDX.blinkR] = blinkR;
  f[IDX.ambient] = 1000;
  f[IDX.fps] = 60;
  f.set([-0.65, 0, -0.76], IDX.gravity); // iPhone horizontal, reclinado (como en las sesiones reales)
  f[IDX.battery] = 0.8;
  f.set(matToQuat(R), IDX.headQuat);
  return decodeFrame(f.buffer);
}
