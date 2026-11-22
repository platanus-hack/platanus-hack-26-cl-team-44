// Voz: la TV nunca manda más de 2 pedidos de audio a la vez (ElevenLabs acepta 5 por cuenta, sumando
// todas las pantallas) y lo que Emmy elige pasa antes que la precarga.
// Ejecutar desde la raíz: node tests/test_voz_cola.cjs
const fs = require("node:fs"), vm = require("node:vm"), assert = require("node:assert/strict");
const source = fs.readFileSync("software/toki-os/woki-voz.js", "utf8");

// Puente falso: registra el orden de los pedidos y cuántos van en vuelo; cada uno termina cuando la prueba lo suelta.
let enVuelo = 0, maximo = 0;
const orden = [], pendientes = [], audios = [];
const fetch = (url, init) => {
  if (!url.endsWith("/api/voz/tts")) return Promise.reject(new Error("sin red en la prueba"));
  const { text } = JSON.parse(init.body);
  orden.push(text);
  enVuelo++; maximo = Math.max(maximo, enVuelo);
  return new Promise((ok) => pendientes.push(() => { enVuelo--; ok({ ok: true, status: 200, blob: async () => text }); }));
};
class Audio {
  constructor(u) { audios.push(u); }
  play() { setImmediate(() => this.onended && this.onended()); return Promise.resolve(); }
  pause() {}
}
const ctx = vm.createContext({
  window: {}, fetch, Audio, console: { log() {} },
  document: { readyState: "complete", addEventListener() {}, getElementById: () => null },
  setTimeout: () => 0, setInterval: () => 0,   // sin V.init: la prueba no consulta el estado del puente
  URL: { createObjectURL: (b) => "blob:" + b, revokeObjectURL() {} },
  CFG: { VOZ_URL: "http://puente", WA_TOKEN: "" },
});
vm.runInContext(source, ctx);
const V = ctx.window.VOZ;
V.on = true; V.actual = "voz";

const tick = async () => { for (let i = 0; i < 4; i++) await new Promise((r) => setImmediate(r)); };
(async () => {
  // Precarga de 12 frases (8 reacciones + 4 tarjetas): solo 2 salen de inmediato.
  V.prefetch(Array.from({ length: 12 }, (_, i) => [`frase ${i}`, "seria"]));
  await tick();
  assert.deepEqual(orden, ["frase 0", "frase 1"], "la precarga respeta el límite de 2");

  // Emmy elige «frase 9», que todavía esperaba en la cola de precarga.
  const hablar = V.speak("frase 9", "seria");
  await tick();
  assert.equal(orden.length, 2, "con el cupo lleno no sale nadie más");
  pendientes.shift()();            // termina «frase 0» y libera un lugar
  await tick();
  assert.equal(orden[2], "frase 9", "lo que Emmy elige sale antes que el resto de la precarga");

  // Se vacía la cola: nunca hubo más de 2 en vuelo y cada frase se pidió una sola vez.
  while (pendientes.length) { pendientes.shift()(); await tick(); }
  await hablar;
  assert.equal(maximo, 2, "nunca más de 2 pedidos simultáneos");
  assert.equal(orden.length, 12);
  assert.equal(new Set(orden).size, 12, "sin pedidos duplicados");
  assert.deepEqual(audios, ["blob:frase 9"], "suena la frase elegida");
  console.log("Voz: máximo 2 pedidos a la vez, lo elegido pasa primero, sin duplicados.");
})().catch((e) => { console.error(e); process.exit(1); });
