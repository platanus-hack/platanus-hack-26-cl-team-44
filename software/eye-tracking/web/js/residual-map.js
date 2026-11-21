/**
 * Mapa de corrección local (por zonas de la pantalla).
 *
 * El modelo global (2D o 3D) deja errores sistemáticos por zona: en datos reales, las esquinas
 * inferiores se "encogen" hacia el centro (~250 px) porque ARKit se satura al mirar abajo y a un
 * lado. Este mapa guarda el error medio del modelo en cada punto conocido (calibración y clics de
 * Entrenar) y lo corrige suavemente alrededor (núcleo gaussiano). Lejos de todo punto conocido la
 * corrección tiende a 0, así que no inventa.
 */
import { median } from "./robust.js";

const SIGMA_FRACTION = 0.13; // ancho de influencia: 13 % de la diagonal de la pantalla
const SHRINK = 0.35;         // peso "sin corrección": evita sobre-corregir con un solo punto
const MAX_CORRECTION_PX = 400;

/**
 * Construye el mapa a partir de muestras y de una función de predicción del modelo global.
 * @param {{pointId:number, target:{x:number,y:number}, frame:object, motion?:boolean}[]} samples
 * @param {(frame:object)=>({x:number,y:number}|null)} predictFn
 * @returns {{anchors:{x:number,y:number,dx:number,dy:number}[], sigma:number}|null}
 */
export function buildResidualMap(samples, predictFn) {
  const groups = new Map();
  for (const s of samples) {
    if (s.motion) continue; // la fase con movimiento mide robustez, no la forma de la pantalla
    if (!groups.has(s.pointId)) groups.set(s.pointId, []);
    groups.get(s.pointId).push(s);
  }
  const anchors = [];
  let maxX = 0, maxY = 0;
  for (const g of groups.values()) {
    const preds = g.map((s) => predictFn(s.frame)).filter(Boolean);
    if (preds.length < 5) continue;
    const t = g[0].target;
    const px = median(preds.map((p) => p.x)), py = median(preds.map((p) => p.y));
    anchors.push({ x: t.x, y: t.y, dx: t.x - px, dy: t.y - py });
    maxX = Math.max(maxX, t.x);
    maxY = Math.max(maxY, t.y);
  }
  if (anchors.length < 4) return null;
  return { anchors, sigma: SIGMA_FRACTION * Math.hypot(maxX, maxY) };
}

/** Aplica la corrección a un punto predicho por el modelo global. */
export function applyResidualMap(map, p) {
  if (!map || !p) return p;
  let wx = 0, wy = 0, wsum = SHRINK;
  const inv = 1 / (2 * map.sigma * map.sigma);
  for (const a of map.anchors) {
    const d2 = (p.x - a.x) ** 2 + (p.y - a.y) ** 2;
    const k = Math.exp(-d2 * inv);
    wx += k * a.dx;
    wy += k * a.dy;
    wsum += k;
  }
  const cx = Math.max(-MAX_CORRECTION_PX, Math.min(MAX_CORRECTION_PX, wx / wsum));
  const cy = Math.max(-MAX_CORRECTION_PX, Math.min(MAX_CORRECTION_PX, wy / wsum));
  return { x: p.x + cx, y: p.y + cy };
}
