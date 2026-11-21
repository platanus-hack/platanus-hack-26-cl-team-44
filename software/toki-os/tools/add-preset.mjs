// Agrega una calibración descargada desde Toki OS a los presets del repo.
// Uso (desde la raíz): node software/toki-os/tools/add-preset.mjs <archivo.json> [nombre-de-archivo.json]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import { fromFile, toFile } from "../iphone-presets.js";

const [src, wanted] = process.argv.slice(2);
if (!src) {
  console.error("Uso: node software/toki-os/tools/add-preset.mjs <archivo.json> [nombre.json]");
  process.exit(1);
}
const preset = fromFile(readFileSync(src, "utf8")); // valida: solo modelos planos, sin movimiento de cabeza
const name = (wanted ?? basename(src)).toLowerCase().replace(/[^\w.-]+/g, "-");
if (!/^[\w.-]+\.json$/.test(name)) throw new Error(`Nombre inválido: ${name}`);

const dir = fileURLToPath(new URL("../presets/", import.meta.url));
const indexPath = `${dir}index.json`;
const index = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, "utf8")) : { presets: [] };
// Sin la dirección del iPhone: es de una red local (y el repo puede ser público); en el panel manda la escrita.
writeFileSync(`${dir}${name}`, toFile({ ...preset, host: "" })); // se reescribe limpio (sin campos extra)
if (!index.presets.includes(name)) index.presets.push(name);
writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);
console.log(`Preset «${preset.name}» agregado como presets/${name} (${index.presets.length} en el repo)`);
