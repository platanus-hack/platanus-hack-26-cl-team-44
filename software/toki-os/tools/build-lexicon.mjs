// Genera lexicon-es.js (diccionario base de la predicción) desde una lista de frecuencias.
//
// Fuente recomendada: hermitdave/FrequencyWords, es_50k.txt (OpenSubtitles 2018, registro coloquial,
// adecuado para CAA). Licencia de los datos: CC BY-SA 4.0 → el archivo generado lleva la atribución.
//   https://github.com/hermitdave/FrequencyWords/blob/master/content/2018/es/es_50k.txt
//
// Uso (desde la raíz del repo):
//   node software/toki-os/tools/build-lexicon.mjs <ruta/a/es_50k.txt> [cantidad=20000]
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const [src, countArg] = process.argv.slice(2);
if (!src) {
  console.error("Uso: node software/toki-os/tools/build-lexicon.mjs <es_50k.txt> [cantidad]");
  process.exit(1);
}
const COUNT = Math.max(1000, Math.min(50000, Number(countArg) || 20000));
// Como Gboard ("bloquear palabras ofensivas", activo por defecto): no se SUGIEREN desde el
// diccionario base. Si la persona las usa, el aprendizaje personal las incorpora igual.
const BLOCK = new Set(["mierda", "puta", "puto", "joder", "coño", "carajo", "cabrón", "cabron", "pendejo", "pendeja", "verga", "culo", "polla", "gilipollas", "maricón", "maricon", "chingada", "chingar", "hijueputa", "huevón", "weón", "conchetumare", "putas", "putos", "mierdas"]);
const WORD = /^[a-záéíóúüñ]+$/;

const rows = [];
for (const line of readFileSync(src, "utf8").split(/\r?\n/)) {
  const [w, f] = line.trim().split(/\s+/);
  const freq = Number(f);
  if (!w || !Number.isFinite(freq) || !WORD.test(w) || BLOCK.has(w)) continue;
  if (w.length === 1 && !["a", "y", "o", "e", "u"].includes(w)) continue; // letras sueltas de subtítulos
  rows.push([w, freq]);
  if (rows.length >= COUNT) break;
}
if (rows.length < 1000) throw new Error(`Muy pocas palabras válidas (${rows.length}): ¿es la lista correcta?`);

const out = `/* Diccionario base de la predicción de Myo OS (${rows.length} palabras, por frecuencia).
 * Datos: hermitdave/FrequencyWords (OpenSubtitles 2018), CC BY-SA 4.0
 * https://github.com/hermitdave/FrequencyWords · Este archivo derivado se distribuye bajo CC BY-SA 4.0.
 * Generado con software/toki-os/tools/build-lexicon.mjs (sin palabras ofensivas en las sugerencias). */
window.TOKI_LEXICON=${JSON.stringify(rows)};
`;
const dest = fileURLToPath(new URL("../lexicon-es.js", import.meta.url));
writeFileSync(dest, out);
console.log(`lexicon-es.js: ${rows.length} palabras, ${(out.length / 1024).toFixed(0)} KB`);
