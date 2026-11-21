/**
 * Protocolo binario iPhone → Mac (v2, acepta v1). Debe coincidir con ios/SoyGaze/Packet.swift.
 * v2: 56 × Float32 little-endian = 224 bytes (v1: 48 = 192 bytes, sin cuaternión).
 * Coordenadas en el espacio de la CÁMARA del iPhone, en metros.
 */

export const FRAME_VERSION = 2;
export const FRAME_FLOATS = 56; // v2: + cuaternión de la cabeza (47–50)
export const FRAME_BYTES = FRAME_FLOATS * 4;
const V1_FLOATS = 48; // compatibilidad con la app anterior (sin cuaternión)

export const IDX = Object.freeze({
  version: 0,
  timestamp: 1,
  tracked: 2,
  seq: 3,
  leftEyePos: 4,
  leftEyeDir: 7,
  rightEyePos: 10,
  rightEyeDir: 13,
  lookAt: 16,
  headPos: 19,
  headFwd: 22,
  blinkL: 25,
  blinkR: 26,
  lookUpL: 27, lookDownL: 28, lookInL: 29, lookOutL: 30,
  lookUpR: 31, lookDownR: 32, lookInR: 33, lookOutR: 34,
  squintL: 35, squintR: 36, wideL: 37, wideR: 38,
  ambient: 39,
  thermal: 40,
  fps: 41,
  gravity: 42,
  battery: 45,
  rescues: 46,
  headQuat: 47,
});

const vec3 = (f, i) => Object.freeze([f[i], f[i + 1], f[i + 2]]);
const GEOMETRY = [IDX.leftEyePos, IDX.leftEyeDir, IDX.rightEyePos, IDX.rightEyeDir, IDX.lookAt, IDX.headPos];

/**
 * Valida y decodifica un cuadro. Devuelve null si el paquete es inválido.
 * @param {ArrayBuffer} buf
 */
export function decodeFrame(buf) {
  if (!(buf instanceof ArrayBuffer)) return null;
  const f = new Float32Array(buf);
  const isV2 = buf.byteLength === FRAME_BYTES && f[IDX.version] === 2;
  const isV1 = buf.byteLength === V1_FLOATS * 4 && f[IDX.version] === 1;
  if (!isV2 && !isV1) return null;
  const q = isV2 ? [f[IDX.headQuat], f[IDX.headQuat + 1], f[IDX.headQuat + 2], f[IDX.headQuat + 3]] : null;
  const quatOk = q && q.every(Number.isFinite) && Math.abs(Math.hypot(...q) - 1) < 0.05;
  const geometryOk = GEOMETRY.every((i) => Number.isFinite(f[i]) && Number.isFinite(f[i + 1]) && Number.isFinite(f[i + 2]));
  return Object.freeze({
    t: f[IDX.timestamp],
    seq: f[IDX.seq],
    tracked: f[IDX.tracked] > 0.5 && geometryOk,
    leftEyePos: vec3(f, IDX.leftEyePos),
    leftEyeDir: vec3(f, IDX.leftEyeDir),
    rightEyePos: vec3(f, IDX.rightEyePos),
    rightEyeDir: vec3(f, IDX.rightEyeDir),
    lookAt: vec3(f, IDX.lookAt),
    headPos: vec3(f, IDX.headPos),
    headFwd: vec3(f, IDX.headFwd),
    blinkL: f[IDX.blinkL],
    blinkR: f[IDX.blinkR],
    squint: (f[IDX.squintL] + f[IDX.squintR]) / 2,
    ambient: f[IDX.ambient],
    thermal: f[IDX.thermal],
    fps: f[IDX.fps],
    gravity: vec3(f, IDX.gravity),
    battery: f[IDX.battery],
    rescues: isV2 || isV1 ? f[IDX.rescues] : 0,
    headQuat: quatOk ? Object.freeze(q) : null, // null en v1: el modelo 3D no está disponible
    // blendshapes crudos de los ojos (0–1): fuente de lo que ARKit cree que hace cada ojo
    look: Object.freeze([f[IDX.lookUpL], f[IDX.lookDownL], f[IDX.lookInL], f[IDX.lookOutL], f[IDX.lookUpR], f[IDX.lookDownR], f[IDX.lookInR], f[IDX.lookOutR]]),
  });
}
