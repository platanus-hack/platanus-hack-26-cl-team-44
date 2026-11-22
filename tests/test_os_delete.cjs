// "Borrar" que acelera (como la tecla de borrar del iPhone): letra → resto de la palabra → palabra a palabra.
// Ejecutar desde la raíz: node tests/test_os_delete.cjs
const fs = require("node:fs"), vm = require("node:vm"), assert = require("node:assert/strict");
const source = fs.readFileSync("software/toki-os/os-keyboard.js", "utf8");
const createKeyboard = vm.runInNewContext(`${source}\ncreateMyoKeyboard`, {
  window: { TokiPredict: { createPredictor: () => ({ learn() {} }) } },
  document: { getElementById: () => ({ innerHTML: "" }) },
  localStorage: { getItem: () => null, setItem() {} },
});
const { deleteStep: del } = createKeyboard({ WORDS: [], RULES: [], DEFAULT: [], REACTS: [] });

// 1.ª vez: una letra (corregir un error)
assert.equal(del("Me duele la cabezz", 1), "Me duele la cabez");
// 2.ª seguida: el resto de la palabra en curso
assert.equal(del("Me duele la cabez", 2), "Me duele la ");
// con espacio al final (tras aceptar una sugerencia): 1.ª borra el espacio, 2.ª la palabra
assert.equal(del("Me duele ", 1), "Me duele");
assert.equal(del("Me duele", 2), "Me ");
// 3.ª y siguientes: palabra a palabra hasta vaciar
assert.equal(del("Me duele la ", 3), "Me duele ");
assert.equal(del("Me ", 3), "");
assert.equal(del("", 3), "");
// signos: se tratan como parte de la palabra
assert.equal(del("Hola, ¿cómo estás?", 2), "Hola, ¿cómo ");
console.log("Borrar: letra, resto de la palabra y palabra a palabra.");
