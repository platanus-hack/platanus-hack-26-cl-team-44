#!/usr/bin/env node
/**
 * Resumen anónimo de las calibraciones reales, para revisar la cifra de precisión sin los logs.
 *   node software/eye-tracking/tools/resumen.mjs                → lee software/eye-tracking/logs
 *   node software/eye-tracking/tools/resumen.mjs ruta/a/logs    → otra carpeta, o un solo log
 *   node software/eye-tracking/tools/resumen.mjs --verificar    → revisa resultados/ sin los logs
 *   --salida <carpeta>   escribe o verifica en otra carpeta (lo usan los tests)
 *
 * Vuelve a calibrar cada calibración con el código actual, igual que analyze.mjs, y escribe
 * resultados/calibraciones.json y resultados/calibraciones.md. Solo guarda los campos de CAMPOS:
 * ni cuadros, ni puntos de la cara, ni fotos, ni nombres, ni navegador, ni datos de la pantalla.
 */
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

import { fitBest, isUsable, pxToDegrees } from "../web/js/model.js";
import { evaluateValidation } from "../web/js/calibration.js";
import { deserializeSamples } from "../web/js/telemetry.js";
import { median } from "../web/js/robust.js";

const AQUI = fileURLToPath(new URL(".", import.meta.url));
const LOGS = resolve(AQUI, "..", "logs");
const RESULTADOS = resolve(AQUI, "..", "resultados");
const DATOS_MD = "software/eye-tracking/resultados/calibraciones.md"; // enlace desde el README raíz

// Sal fija: el id queda igual en cada corrida y no deja leer el nombre del archivo.
export const SAL = "myo-eye-resumen-v1";
export const idOpaco = (nombreArchivo) => createHash("sha256").update(`${SAL}:${nombreArchivo}`).digest("hex").slice(0, 10);

/** Cada calibración se ajusta con las mismas opciones que usa cada producto. */
export const PERFILES = Object.freeze({
  so: Object.freeze({
    titulo: "Myo OS",
    descripcion: "Igual que software/toki-os/iphone-gaze.js. Cabeza quieta, solo plano lineal y sin corrección de cabeza.",
    opciones: Object.freeze({ headCorrection: false, kinds: Object.freeze(["planeLinear"]) }),
    movimiento: false,
  }),
  demo: Object.freeze({
    titulo: "Demo web",
    descripcion: "Igual que web/js/app.js y tools/analyze.mjs. Todos los candidatos y corrección de cabeza si hubo paso de movimiento.",
    opciones: Object.freeze({}),
    movimiento: true,
  }),
});

/** Lista cerrada de campos del resumen. --verificar rechaza cualquier otro. */
export const CAMPOS = Object.freeze({
  raiz: Object.freeze(["version", "herramienta", "metodo", "perfiles", "entrada", "agregado", "calibraciones"]),
  calibracion: Object.freeze(["sesion", "calibracion", "fecha", "fuente", "tipo", "escala", "puntos", ...Object.keys(PERFILES)]),
  puntos: Object.freeze(["entrenamiento", "validacion", "movimiento"]),
  perfil: Object.freeze(["modelo", "quietoDeg", "movimientoDeg"]),
});

const METODO = Object.freeze([
  "Error en los puntos de validación, que el modelo no vio al calibrar, en grados visuales.",
  "Cada calibración se ajusta de nuevo con el código actual de web/js/model.js.",
  "Escala física: se conoce el tamaño real de la pantalla. Escala estimada: sale del ajuste y los grados son aproximados.",
  "Quedan fuera las sesiones del simulador y las que no conectaron ninguna fuente.",
  "p90: el valor que no supera el 90 % de las calibraciones (rango más cercano). Peor: el máximo.",
]);

const TIPOS = new Set(["inicial", "afinar"]);
const r2 = (x) => (Number.isFinite(x) ? Math.round(x * 100) / 100 : null);
const distintos = (xs) => new Set(xs.map((s) => s.pointId)).size;

/** Día de la sesión (sin hora): del id de sesión, que usa la hora local, o de startedAt. */
function fecha(log) {
  const m = /^(\d{4})(\d{2})(\d{2})-/.exec(String(log.sessionId ?? ""));
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(String(log.startedAt ?? ""));
  return iso ? iso[0] : null;
}

/** px por metro de la pantalla, solo si el log trae su tamaño físico (misma regla que analyze.mjs). */
export function escalaFisica(log) {
  const disp = log.display?.used ?? (log.display?.widthMm ? log.display : null);
  return disp?.widthMm && Math.abs(disp.widthPt - log.screen?.w) <= 2 ? disp.widthPt / (disp.widthMm / 1000) : null;
}

const nombreModelo = (m) => `${m.kind}/${m.source}${m.head ? "+cabeza" : ""}`;

function ajustar(perfil, datos, ppm) {
  try {
    const res = fitBest(datos.train, { ...perfil.opciones, metersPerPx: ppm ? 1 / ppm : null });
    const escala = ppm ?? res.pxPerMeter;
    const grados = (samples) => (samples.length ? pxToDegrees(evaluateValidation(res.model, samples).meanPx, escala, datos.distancia) : null);
    const salida = { modelo: nombreModelo(res.model), quietoDeg: r2(grados(datos.valid)) };
    if (perfil.movimiento) salida.movimientoDeg = r2(grados(datos.motionValid));
    return salida;
  } catch {
    return null; // pocas muestras útiles o sistema singular: no cuenta para este perfil
  }
}

/** Filas anónimas de un log. Las sesiones sin fuente o del simulador solo se cuentan. */
export function resumirLog(nombreArchivo, log) {
  const cals = Array.isArray(log.calibrations) ? log.calibrations : [];
  if (!log.source) return { filas: [], simulador: 0, sinFuente: cals.length };
  if (log.source === "simulador") return { filas: [], simulador: cals.length, sinFuente: 0 };
  const ppm = escalaFisica(log);
  const filas = cals.map((cal, i) => {
    const train = deserializeSamples(cal.train ?? []);
    const valid = deserializeSamples(cal.valid ?? []);
    const motionValid = deserializeSamples(cal.motionValid ?? []);
    const distancia = median(train.filter((s) => isUsable(s.frame)).map((s) => Math.hypot(...s.frame.headPos)));
    const datos = { train, valid, motionValid, distancia };
    const fila = {
      sesion: idOpaco(nombreArchivo),
      calibracion: i + 1,
      fecha: fecha(log),
      fuente: /^[a-z0-9-]{1,20}$/.test(log.source) ? log.source : "otra",
      tipo: TIPOS.has(cal.kind) ? cal.kind : null,
      escala: ppm ? "fisica" : "estimada",
      puntos: { entrenamiento: distintos(train.filter((s) => !s.motion)), validacion: distintos(valid), movimiento: distintos(motionValid) },
    };
    for (const [clave, perfil] of Object.entries(PERFILES)) fila[clave] = ajustar(perfil, datos, ppm);
    return fila;
  });
  return { filas, simulador: 0, sinFuente: 0 };
}

export function estadisticas(valores) {
  const xs = valores.filter(Number.isFinite).sort((a, b) => a - b);
  if (!xs.length) return { n: 0, media: null, mediana: null, p90: null, peor: null };
  return {
    n: xs.length,
    media: r2(xs.reduce((a, b) => a + b, 0) / xs.length),
    mediana: r2(median(xs)),
    p90: xs[Math.ceil(0.9 * xs.length) - 1], // rango más cercano: siempre es un valor medido
    peor: xs.at(-1),
  };
}

/** Agregado calculado SOLO con las filas: --verificar lo repite con el JSON publicado. */
export function agregar(filas) {
  const agregado = {
    sesiones: new Set(filas.map((f) => f.sesion)).size,
    calibraciones: filas.length,
    conEscalaFisica: filas.filter((f) => f.escala === "fisica").length,
  };
  for (const [clave, perfil] of Object.entries(PERFILES)) {
    agregado[clave] = { quietoDeg: estadisticas(filas.map((f) => f[clave]?.quietoDeg)) };
    if (perfil.movimiento) agregado[clave].movimientoDeg = estadisticas(filas.map((f) => f[clave]?.movimientoDeg));
  }
  return agregado;
}

export function armarResumen(filas, entrada) {
  const orden = [...filas].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)) || a.sesion.localeCompare(b.sesion) || a.calibracion - b.calibracion);
  return {
    version: 1,
    herramienta: "software/eye-tracking/tools/resumen.mjs",
    metodo: METODO,
    perfiles: Object.fromEntries(Object.entries(PERFILES).map(([k, p]) => [k, { titulo: p.titulo, descripcion: p.descripcion, opciones: p.opciones }])),
    entrada,
    agregado: agregar(orden),
    calibraciones: orden,
  };
}

const num = (x) => (Number.isFinite(x) ? `${x.toFixed(2).replace(".", ",")}°` : "n/d");
const ETIQUETAS = Object.freeze([["quietoDeg", "quieto"], ["movimientoDeg", "con movimiento"]]);

/** El .md sale entero del JSON: así --verificar puede compararlo línea a línea. */
export function renderMd(r) {
  const a = r.agregado;
  const perfiles = Object.keys(r.perfiles);
  const lineas = [
    "# Calibraciones del eye-tracking",
    "",
    "Archivo generado por `node software/eye-tracking/tools/resumen.mjs` a partir de los logs de sesión. Los logs no están en git porque tienen datos biométricos.",
    "",
    "No lo edites a mano. Para revisarlo sin los logs: `node software/eye-tracking/tools/resumen.mjs --verificar`.",
    "",
    "## Método",
    "",
    ...r.metodo.map((m) => `- ${m}`),
    ...perfiles.map((k) => `- Perfil \`${k}\` (${r.perfiles[k].titulo}). ${r.perfiles[k].descripcion}`),
    "",
    "## Agregado",
    "",
    `${a.sesiones} sesiones · ${a.calibraciones} calibraciones · ${a.conEscalaFisica} con escala física · ${r.entrada.logs} logs leídos · fuera: ${r.entrada.excluidas.simulador} calibraciones del simulador y ${r.entrada.excluidas.sinFuente} sin fuente.`,
    "",
    "| Perfil | Error | n | Media | Mediana | p90 | Peor |",
    "|---|---|---:|---:|---:|---:|---:|",
  ];
  for (const k of perfiles) {
    for (const [campo, etiqueta] of ETIQUETAS) {
      const s = a[k]?.[campo];
      if (s) lineas.push(`| ${k} | ${etiqueta} | ${s.n} | ${num(s.media)} | ${num(s.mediana)} | ${num(s.p90)} | ${num(s.peor)} |`);
    }
  }
  // Por perfil: modelo elegido y una columna por cada error que tiene agregado.
  const columnas = perfiles.flatMap((k) => [[k, "modelo"], ...ETIQUETAS.filter(([c]) => a[k]?.[c]).map(([c, e]) => [k, c, e])]);
  lineas.push(
    "",
    "## Por calibración",
    "",
    `| Sesión | Cal. | Fecha | Fuente | Tipo | Escala | Puntos (entr./valid./mov.) | ${columnas.map(([k, c, e]) => `${k}: ${e ?? c}`).join(" | ")} |`,
    `|---|---:|---|---|---|---|---|${columnas.map(([, c]) => (c === "modelo" ? "---" : "---:")).join("|")}|`,
  );
  for (const f of r.calibraciones) {
    const p = f.puntos;
    const celdas = columnas.map(([k, c]) => (c === "modelo" ? (f[k]?.modelo ?? "n/d") : num(f[k]?.[c])));
    lineas.push(`| ${f.sesion} | ${f.calibracion} | ${f.fecha ?? "n/d"} | ${f.fuente} | ${f.tipo ?? "n/d"} | ${f.escala === "fisica" ? "física" : "estimada"} | ${p.entrenamiento}/${p.validacion}/${p.movimiento} | ${celdas.join(" | ")} |`);
  }
  return `${lineas.join("\n")}\n`;
}

/** Frase para el README raíz: perfil `so`, el que usa Myo OS. */
export function fraseReadme(agregado) {
  const s = agregado.so?.quietoDeg;
  if (!s?.n) return null;
  const uno = (x) => x.toFixed(1).replace(".", ",");
  return `- **Mirada con un iPhone:** ${uno(s.media)}° de error medio (p90: ${uno(s.p90)}°) sobre puntos que el modelo no vio, en ${s.n} calibraciones del equipo. [Datos](${DATOS_MD}).`;
}

/** Problemas de forma o de privacidad en un resumen ya escrito. Lista vacía = bien. */
export function revisarCampos(r) {
  const problemas = [];
  const sobran = (obj, permitidos, donde) => {
    for (const k of Object.keys(obj ?? {})) if (!permitidos.includes(k)) problemas.push(`Campo no permitido en ${donde}: "${k}".`);
  };
  sobran(r, CAMPOS.raiz, "la raíz");
  if (!Array.isArray(r.calibraciones)) return [...problemas, "Falta la lista de calibraciones."];
  r.calibraciones.forEach((f, i) => {
    const donde = `la calibración ${i + 1}`;
    sobran(f, CAMPOS.calibracion, donde);
    sobran(f.puntos, CAMPOS.puntos, `${donde} › puntos`);
    if (!/^[0-9a-f]{10}$/.test(f.sesion)) problemas.push(`${donde}: la sesión debe ser un id opaco de 10 caracteres hex.`);
    if (f.fecha !== null && !/^\d{4}-\d{2}-\d{2}$/.test(f.fecha)) problemas.push(`${donde}: la fecha debe ser solo el día (AAAA-MM-DD).`);
    if (!/^[a-z0-9-]{1,20}$/.test(f.fuente)) problemas.push(`${donde}: fuente inválida.`);
    for (const k of Object.keys(PERFILES)) {
      if (f[k] === null || f[k] === undefined) continue;
      sobran(f[k], CAMPOS.perfil, `${donde} › ${k}`);
      if (!/^[A-Za-z0-9/+]{1,40}$/.test(String(f[k].modelo))) problemas.push(`${donde} › ${k}: nombre de modelo inválido.`);
    }
  });
  return problemas;
}

function primeraDiferencia(a, b) {
  const la = a.split("\n"), lb = b.split("\n");
  const i = la.findIndex((l, k) => l !== lb[k]);
  return (i < 0 ? Math.min(la.length, lb.length) : i) + 1;
}

async function listarLogs(entrada) {
  let info;
  try {
    info = await stat(entrada);
  } catch {
    throw new Error(`No encontré ${entrada}. Los logs no están en git: los tiene quien grabó las sesiones.`);
  }
  if (info.isFile()) return [entrada];
  const archivos = (await readdir(entrada)).filter((f) => f.endsWith(".json")).sort();
  if (!archivos.length) throw new Error(`No hay logs .json en ${entrada}.`);
  return archivos.map((f) => join(entrada, f));
}

const out = (s = "") => process.stdout.write(`${s}\n`);
const rel = (p) => relative(process.cwd(), p) || p;

function imprimirAgregado(a) {
  out(`${a.sesiones} sesiones · ${a.calibraciones} calibraciones · ${a.conEscalaFisica} con escala física`);
  for (const k of Object.keys(PERFILES)) {
    for (const [campo, etiqueta] of ETIQUETAS) {
      const s = a[k]?.[campo];
      if (s) out(`  ${k} ${etiqueta}: n=${s.n} · media ${num(s.media)} · mediana ${num(s.mediana)} · p90 ${num(s.p90)} · peor ${num(s.peor)}`);
    }
  }
}

function imprimirFrase(a) {
  const frase = fraseReadme(a);
  out("");
  if (!frase) return out("Sin errores medidos en el perfil so: no hay frase para el README.");
  out("Frase para README.md (perfil so, Myo OS):");
  out(frase);
}

async function generar(entrada, salida) {
  const filas = [];
  const entradaInfo = { logs: 0, excluidas: { simulador: 0, sinFuente: 0 } };
  for (const archivo of await listarLogs(entrada)) {
    let log;
    try {
      log = JSON.parse(await readFile(archivo, "utf8"));
    } catch {
      process.stderr.write(`  No pude leer ${basename(archivo)}: lo salto.\n`);
      continue;
    }
    entradaInfo.logs += 1;
    const r = resumirLog(basename(archivo), log);
    filas.push(...r.filas);
    entradaInfo.excluidas.simulador += r.simulador;
    entradaInfo.excluidas.sinFuente += r.sinFuente;
    process.stderr.write(`  ${basename(archivo)}: ${r.filas.length} calibraciones\n`); // solo en tu consola, no va al resumen
  }
  if (!filas.length) throw new Error(`Ninguna calibración real en ${entrada}: no escribo nada.`);
  const resumen = armarResumen(filas, entradaInfo);
  await mkdir(salida, { recursive: true });
  await writeFile(join(salida, "calibraciones.json"), `${JSON.stringify(resumen, null, 2)}\n`);
  await writeFile(join(salida, "calibraciones.md"), renderMd(resumen));
  out(`Escrito: ${rel(join(salida, "calibraciones.json"))} y ${rel(join(salida, "calibraciones.md"))}`);
  imprimirAgregado(resumen.agregado);
  imprimirFrase(resumen.agregado);
}

async function verificar(salida) {
  const archivoJson = join(salida, "calibraciones.json");
  let r;
  try {
    r = JSON.parse(await readFile(archivoJson, "utf8"));
  } catch {
    throw new Error(`No hay resumen en ${rel(archivoJson)}. Lo genera quien tiene los logs con: node software/eye-tracking/tools/resumen.mjs`);
  }
  const problemas = revisarCampos(r);
  const recalculado = agregar(Array.isArray(r.calibraciones) ? r.calibraciones : []);
  if (!isDeepStrictEqual(recalculado, r.agregado)) problemas.push("El agregado del JSON no coincide con sus calibraciones.");
  const md = await readFile(join(salida, "calibraciones.md"), "utf8").catch(() => null);
  const esperado = problemas.length ? null : renderMd({ ...r, agregado: recalculado });
  if (md === null) problemas.push("Falta calibraciones.md.");
  else if (esperado !== null && md !== esperado) problemas.push(`calibraciones.md no coincide con el JSON (primera diferencia en la línea ${primeraDiferencia(md, esperado)}).`);
  if (problemas.length) {
    for (const p of problemas) process.stderr.write(`✖ ${p}\n`);
    process.exitCode = 1;
    return;
  }
  out(`✔ El agregado coincide con las ${recalculado.calibraciones} calibraciones del JSON y con calibraciones.md.`);
  imprimirAgregado(recalculado);
  imprimirFrase(recalculado);
}

async function main() {
  const args = process.argv.slice(2);
  const iSalida = args.indexOf("--salida");
  if (iSalida >= 0 && !args[iSalida + 1]) throw new Error("--salida necesita una carpeta");
  const desconocidas = args.filter((a) => a.startsWith("--") && a !== "--salida" && a !== "--verificar");
  if (desconocidas.length) throw new Error(`Opción desconocida: ${desconocidas.join(", ")}`);
  const salida = iSalida >= 0 ? resolve(args[iSalida + 1]) : RESULTADOS;
  const posicionales = args.filter((a, i) => !a.startsWith("--") && (iSalida < 0 || i !== iSalida + 1));
  if (args.includes("--verificar")) return verificar(salida);
  return generar(posicionales[0] ? resolve(posicionales[0]) : LOGS, salida);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((err) => {
    process.stderr.write(`✖ ${err.message}\n`);
    process.exit(1);
  });
}
