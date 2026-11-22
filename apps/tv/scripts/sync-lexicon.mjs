// Copia el diccionario base de la TV actual (software/toki-os/lexicon-es.js) a src/data/lexicon-es.json.
// La v2 no lee archivos de software/ al compilar: así no depende de cambios en esa carpeta.
// Datos: hermitdave/FrequencyWords (OpenSubtitles 2018), CC BY-SA 4.0. El JSON derivado sigue esa licencia.
//   node scripts/sync-lexicon.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../../../software/toki-os/lexicon-es.js');
const target = resolve(here, '../src/data/lexicon-es.json');
const text = readFileSync(source, 'utf8');
const start = text.indexOf('[', text.indexOf('window.TOKI_LEXICON'));
const end = text.lastIndexOf(']');
const words = JSON.parse(text.slice(start, end + 1));
if (!Array.isArray(words) || words.length < 1000) throw new Error('Diccionario inesperado');
writeFileSync(target, `${JSON.stringify(words)}\n`);
console.log(`${words.length} palabras → ${target}`);
