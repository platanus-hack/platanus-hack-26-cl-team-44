// Copia local de lo que la TV baja de internet al iniciar (MediaPipe, su modelo y WebEyeTrack).
//
//   node software/toki-os/tools/vendor-assets.mjs              # baja lo que falte o no coincida (~41 MB la primera vez)
//   node software/toki-os/tools/vendor-assets.mjs --comprobar  # solo verifica; sale con 1 si falta algo
//
// Cada archivo se guarda en software/toki-os/vendor/<host>/<ruta> (fuera de git) y solo si su sha256 coincide
// con vendor-manifest.json. Si la CDN cambia un archivo, se rechaza: nunca se sirve algo distinto a lo fijado.
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
export const VENDOR_DIR = resolve(AQUI, '..', 'vendor');
export const MANIFIESTO = JSON.parse(await readFile(join(AQUI, 'vendor-manifest.json'), 'utf8')).archivos;
const POR_URL = new Map(MANIFIESTO.map(a => [a.url, a]));

export const sha256 = buf => createHash('sha256').update(buf).digest('hex');

/** La entrada del manifiesto para esa URL (sin query ni hash), o undefined. */
export function entrada(url) {
  try {
    const u = new URL(url);
    return POR_URL.get(`${u.origin}${u.pathname}`);
  } catch { return undefined; }
}

/** Ruta en disco de una URL del manifiesto: <dir>/<host>/<ruta>. Nunca sale de <dir>. */
export function rutaLocal(url, dir = VENDOR_DIR) {
  const u = new URL(url);
  const raiz = resolve(dir);
  const ruta = resolve(raiz, u.host, ...decodeURIComponent(u.pathname).split('/').filter(Boolean));
  if (!ruta.startsWith(raiz + sep)) throw new Error('ruta fuera del directorio');
  return ruta;
}

/** Contenido de una entrada del manifiesto desde el disco, solo si su sha256 coincide; si no, null. */
export async function leerEntrada(e, dir = VENDOR_DIR) {
  try {
    const body = await readFile(rutaLocal(e.url, dir));
    return sha256(body) === e.sha256 ? { body, tipo: e.tipo } : null;
  } catch { return null; }
}

/** Contenido verificado de una URL del manifiesto desde el disco, o null si no está o no coincide. */
export async function leerVerificado(url, dir = VENDOR_DIR) {
  const e = entrada(url);
  return e ? leerEntrada(e, dir) : null;
}

/** Baja lo que falte. Devuelve {ok, bajados, fallas}. */
export async function sincronizar({ dir = VENDOR_DIR, fetcher = fetch, log = () => {}, archivos = MANIFIESTO } = {}) {
  const fallas = [];
  let bajados = 0;
  for (const e of archivos) {
    if (await leerEntrada(e, dir)) continue;
    try {
      const r = await fetcher(e.url, { signal: AbortSignal.timeout(60_000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const body = Buffer.from(await r.arrayBuffer());
      if (sha256(body) !== e.sha256) throw new Error('el sha256 no coincide con el fijado');
      const ruta = rutaLocal(e.url, dir);
      await mkdir(dirname(ruta), { recursive: true });
      await writeFile(`${ruta}.parcial`, body);
      await rename(`${ruta}.parcial`, ruta);   // nunca queda un archivo a medias con el nombre final
      bajados++;
      log(`  ↓ ${e.url}`);
    } catch (err) {
      fallas.push({ url: e.url, error: String(err.message ?? err) });
    }
  }
  return { ok: fallas.length === 0, bajados, fallas };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const comprobar = process.argv.includes('--comprobar');
  if (comprobar) {
    const faltan = [];
    for (const e of MANIFIESTO) if (!(await leerVerificado(e.url))) faltan.push(e.url);
    for (const u of faltan) console.log(`  falta ${u}`);
    console.log(faltan.length ? `${faltan.length} de ${MANIFIESTO.length} archivos sin copia local` : `${MANIFIESTO.length} archivos verificados en ${VENDOR_DIR}`);
    process.exit(faltan.length ? 1 : 0);
  }
  const r = await sincronizar({ log: console.log });
  for (const f of r.fallas) console.error(`  ✗ ${f.url}: ${f.error}`);
  console.log(r.ok ? `${MANIFIESTO.length} archivos listos en ${VENDOR_DIR} (${r.bajados} bajados ahora)` : `${r.fallas.length} archivos sin bajar`);
  process.exit(r.ok ? 0 : 1);
}
