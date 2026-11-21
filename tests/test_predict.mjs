// Motor de predicción de palabras de Toki OS. Ejecutar desde la raíz: node tests/test_predict.mjs
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createPredictor, normalize } = require("../software/toki-os/predict.js");

const memStorage = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }; };
const BASE = [["año", 50], ["que", 900], ["de", 880], ["no", 800], ["cómo", 300], ["como", 280], ["casa", 120], ["cansada", 40], ["agua", 90], ["ahora", 150], ["hola", 200], ["gracias", 180], ["quiero", 160], ["mañana", 110], ["cena", 30]];
const make = (opts = {}) => createPredictor({ base: BASE, corpus: ["quiero agua por favor", "quiero ir a casa", "hola cómo estás"], storage: memStorage(), ...opts });

// sin tildes: "como" ofrece "cómo" y "como"; la ñ se conserva ("año" ≠ "ano"); "manana" llega por tolerancia a errores
assert.equal(normalize("Cómo"), "como");
assert.equal(normalize("Año pingüino"), "año pinguino");
{
  const p = make();
  const s = p.suggest("", "com").map((x) => x.word);
  assert.ok(s.includes("cómo") && s.includes("como"), s);
  assert.deepEqual(p.suggest("", "manana").map((x) => x.word), ["mañana"]);
  assert.ok(!p.suggest("", "an").some((x) => x.word === "año"), "la ñ no se confunde con n");
}

// una variante sin tilde poco frecuente (falta de ortografía) no aparece; dos formas frecuentes sí
{
  const p = createPredictor({ base: [...BASE, ["único", 100], ["unico", 9]], storage: memStorage() });
  const s = p.suggest("", "uni").map((x) => x.word);
  assert.ok(s.includes("único") && !s.includes("unico"), s);
  assert.ok(p.suggest("", "com").map((x) => x.word).includes("como"), "como/cómo siguen ambas");
}

// completa por prefijo y ordena por frecuencia
{
  const p = make();
  assert.deepEqual(p.suggest("", "ca").map((x) => x.word).slice(0, 2), ["casa", "cansada"]);
}

// predice la SIGUIENTE palabra por contexto (bigramas del corpus) aunque no haya prefijo
{
  const p = make();
  assert.equal(p.suggest("quiero", "")[0].word, "agua");
}

// aprende del usuario: lo que dice sube en el ranking y en el contexto (como Gboard/QuickType, en el dispositivo)
{
  const p = make();
  assert.equal(p.suggest("", "ca")[0].word, "casa");
  for (let i = 0; i < 3; i++) p.learn("Estoy cansada hoy");
  assert.equal(p.suggest("", "ca")[0].word, "cansada", "la palabra propia gana tras usarla");
  assert.equal(p.suggest("estoy", "")[0].word, "cansada", "y se predice después de 'estoy'");
}

// nombres propios: se recuerdan con mayúscula aunque no estén en el diccionario
{
  const p = make();
  p.learn("Llama a Camila por favor");
  const s = p.suggest("a", "cam");
  assert.equal(s[0].word, "Camila");
  assert.equal(s[0].name, true);
}

// un nombre que el diccionario tiene en minúscula se aprende igual si la persona lo escribe con mayúscula
{
  const p = createPredictor({ base: [...BASE, ["camila", 20]], storage: memStorage() });
  p.learn("Mañana viene Camila");
  assert.equal(p.suggest("", "cam")[0].word, "Camila");
  p.learn("una camila de flores"); p.learn("otra camila más");
  assert.equal(p.suggest("", "cam")[0].word, "camila", "si se escribe más en minúscula, vuelve a minúscula");
}

// palabras que coinciden con propiedades internas de JavaScript no rompen el motor (encontrado con el diccionario real)
{
  const p = createPredictor({ base: [...BASE, ["constructor", 30], ["valueof", 1], ["tostring", 1]], storage: memStorage() });
  assert.ok(p.suggest("", "cons").some((x) => x.word === "constructor"));
  p.learn("el constructor llegó"); p.learn("__proto__ constructor");
  assert.doesNotThrow(() => p.suggest("el", ""));
}

// persiste entre sesiones (localStorage) y tolera datos corruptos
{
  const storage = memStorage();
  const a = createPredictor({ base: BASE, storage });
  a.learn("quiero mi chaleco");
  const b = createPredictor({ base: BASE, storage });
  assert.equal(b.suggest("mi", "")[0].word, "chaleco");
  storage.setItem("woki.pred.v1", "{basura");
  assert.doesNotThrow(() => createPredictor({ base: BASE, storage }).suggest("", "a"));
}

// errores de tipeo: una letra cambiada sigue encontrando la palabra (prefijos de 4+ letras)
{
  const p = make();
  assert.ok(p.suggest("", "graxi").map((x) => x.word).includes("gracias"));
}

// no sugiere exactamente lo ya escrito y respeta el límite
{
  const p = make();
  assert.ok(!p.suggest("", "hola").some((x) => x.word === "hola"));
  assert.ok(p.suggest("", "", 3).length <= 3);
}

// mayúsculas al insertar: inicio de frase → Mayúscula; nombre → siempre; resto → minúscula
{
  const p = make();
  assert.equal(p.format("casa", { sentenceStart: true }), "Casa");
  assert.equal(p.format("casa", { sentenceStart: false }), "casa");
  assert.equal(p.format("Camila", { sentenceStart: false, name: true }), "Camila");
}

console.log("Predicción: sin tildes, prefijo, contexto, aprendizaje, nombres, persistencia, tipeo y mayúsculas.");
