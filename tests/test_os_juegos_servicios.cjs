// Juegos, Servicios y colores dentro de Myo OS (woki-os.html).
// Ejecutar desde la raíz: node tests/test_os_juegos_servicios.cjs
const fs = require("node:fs"), vm = require("node:vm"), assert = require("node:assert/strict");
const dir = "software/toki-os/";
const html = fs.readFileSync(dir + "woki-os.html", "utf8");
const glue = fs.readFileSync(dir + "os-juegos-servicios.js", "utf8");
const games = fs.readFileSync(dir + "prototype-games.js", "utf8");
const external = fs.readFileSync(dir + "prototype-external-games.js", "utf8");
const colors = fs.readFileSync(dir + "os-colores.css", "utf8");

// 1. Los módulos del equipo se cargan tal cual y la conexión va después de ellos.
const order = ["toki-apps.js", "prototype-games.js", "prototype-external-games.js", "os-juegos-servicios.js"].map((f) => html.indexOf(`<script src="${f}"`));
assert.ok(order.every((i) => i > 0), "Myo OS carga los tres módulos y la conexión");
assert.deepEqual([...order].sort((a, b) => a - b), order, "orden: módulos primero, conexión al final");

// 2. El SO declara seis tarjetas y el SOS global.
{
  const tilesSrc = html.slice(html.indexOf("const TILES = ["), html.indexOf("];", html.indexOf("const TILES = [")) + 2);
  const tiles = vm.runInNewContext(tilesSrc + " TILES");
  assert.deepEqual(Array.from(tiles, ([action]) => action), [
    "go:talk", "go:keyboard", "go:contacts",
    "go:apps", "go:games", "go:settings",
  ]);
  assert.match(html, /class="grid3x2" id="tiles"/);
  assert.match(fs.readFileSync(dir + "layout.css", "utf8"), /\.grid4x2 \{ grid-template-columns: var\(--edge\) 1fr 1fr var\(--edge\)/);
}

// 3. Juegos abre el catálogo externo directamente. La partida permite volver al catálogo.
assert.match(html, /home-nav" data-t data-act="go:home"/);
assert.match(html, /sos-nav" data-t data-act="sos" data-dwell="2000"/);
assert.match(html, /rest-sos" data-t data-act="sos" data-dwell="2000"/);
assert.match(html, /rest-nav" data-t data-act="rest"/);
assert.match(external, /if\(name==='games'\)catalog\(\)/);
assert.match(external, /b\('catalog','← Juegos'\)/);
assert.doesNotMatch(external, /external:toki|b\('toki'/);
assert.match(games, /baseGo\(name, \.\.\.args\)/, "el envoltorio conserva argumentos de historial");
assert.match(external, /oldGo\(name,\.\.\.args\)/, "el envoltorio externo conserva argumentos de historial");

// 4. Dentro del SO el puntero se elige en Ajustes (no hay botones Nariz/Mirada/Mouse que apaguen el iPhone).
assert.match(games, /if \(window\.TOKI_OS_SHELL\) return `<p class="game-note">/);
assert.match(external, /if\(tabletAccess\|\|window\.TOKI_OS_SHELL\)return/);

// 5. Con el iPhone nada se elige en cadena en Juegos y Servicios (mismo bloqueo que el resto del SO).
assert.match(glue, /if \(iphoneDwell\(\)\) S\.lockUntil = performance\.now\(\) \+ LOCKOUT_MS;/);
assert.match(glue, /return innerActivate\(el, calibrate, immediate\)/);
assert.match(external, /oldActivate\(el,calibrate,immediate\)/, "el control externo conserva activación inmediata");
assert.match(glue, /confirming: Boolean\(G\.brow\)/, "la confirmación usa el estado de ceja vigente");
assert.match(glue, /careWheel\?\.active/, "la rueda de cuidado suspende el control del juego");
assert.match(glue, /controlPointFresh\(now\)/, "la entrada de cámara solo usa puntos frescos");
assert.match(external, /!shared\?\.confirming && !shared\?\.muscle/, "la ceja o el modo MyoWare desactivan el clic automático");

// 5b. Miniaturas del inicio y navegación en la partida.
assert.match(glue, /SERVICE_LOGOS = \['spotify', 'rappi', 'biobio', 'mercadolibre'\]/);
for (const [, cover] of external.matchAll(/image:'([^']+)'/g)) {
  assert.ok(fs.existsSync(dir + 'game-covers/' + cover + '.webp'), cover);
}
assert.match(external, /Apunta y confirma con Espacio/);
assert.ok(!/if\(window\.TOKI_OS_SHELL\)\{[^]*?Si aparece la bienvenida[^]*?return;\n  \}/.test(external), "dentro del SO no aparece el aviso largo");
assert.match(glue, /if \(name !== 'games'\) \$\('#externalGame'\)\?\.remove\(\);/);
const css = fs.readFileSync(dir + "os-juegos-servicios.css", "utf8");
assert.match(css, /#s-apps \.toki-apps, #s-apps \.ta-screen, #s-apps \.ta-catalog, #s-apps \.ta-nav \{ overflow: visible; \}/, "el zoom del foco no se recorta en Servicios");
assert.match(css, /#s-apps \.food-card strong \{ font-size: 38px;/, "comida (Rappi): nombres grandes en el lienzo de 1920");
assert.match(css, /#s-apps \.food-note \{ font-size: 28px; line-height: 1\.3; color: var\(--txt2\); \}/, "comida: la nota usa el tema, no 16 px fijos");
assert.match(css, /#s-apps \.video-choices \.video-card \{ display: grid;/, "YouTube: la tarjeta de video recupera su rejilla");
assert.match(css, /#s-apps \.news-card\.has-thumb \{ display: grid; grid-template-columns: minmax\(0, 1fr\) auto;/, "BioBío: titular a la izquierda y miniatura a la derecha");
assert.match(css, /#s-apps \.news-pagebar \.ta-button \{ min-height: 120px;/, "BioBío: paginación con objetivos de 120 px");
assert.match(glue, /new MutationObserver\(targets\)\.observe\(root, \{ subtree: true, attributes: true, attributeFilter: \['disabled'\] \}\)/, "un botón habilitado sin repintar («Reproducir») se puede elegir con la mirada");

// 5c. Parejas sin «Continuar» (las tarjetas distintas giran solas); Constelaciones guarda tiempo sin contar pausas.
assert.ok(!/act==='next'/.test(games), "Parejas ya no necesita «Continuar»");
assert.match(games, /setTimeout\(\(\)=>\{ if\(state!==s\|\|s\.done\) return; s\.open=\[\]; s\.flipBack=pair; renderGame\(\); \}, 1200\)/);
assert.match(games, /function clock\(s, now=performance\.now\(\)\)/);
assert.match(games, /'¡Nuevo récord de tiempo!'/);

// 6. Ajustes › Tema y color: tema y 5 colores, todos definidos en claro y oscuro, y se recuerda.
for (const p of ["bosque", "oceano", "atardecer", "lavanda"]) {
  assert.match(colors, new RegExp(`:root\\[data-palette="${p}"\\] #stage`), `falta ${p} oscuro`);
  assert.match(colors, new RegExp(`:root\\[data-theme="light"\\]\\[data-palette="${p}"\\] #stage`), `falta ${p} claro`);
}
assert.match(html, /\['noche','Noche'\],\['bosque','Bosque'\],\['oceano','Océano'\],\['atardecer','Atardecer'\],\['lavanda','Lavanda'\]/);
assert.match(html, /localStorage\.getItem\('woki\.palette'\)/, "el color se aplica antes de pintar");
assert.match(html, /case 'look':/);

console.log("Juegos y Servicios en Myo OS: módulos del equipo, 6 tarjetas y SOS y descanso globales, salidas grandes, sin elección en cadena y colores.");
