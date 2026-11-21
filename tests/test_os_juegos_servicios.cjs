// Juegos, Servicios y colores dentro de Toki OS (woki-os.html).
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
assert.ok(order.every((i) => i > 0), "Woki OS carga los tres módulos y la conexión");
assert.deepEqual([...order].sort((a, b) => a - b), order, "orden: módulos primero, conexión al final");

// 2. Inicio: 10 tarjetas en 5×2 (Servicios antes de Juegos, nada se quita).
{
  const tilesSrc = html.slice(html.indexOf("const TILES = ["), html.indexOf("];", html.indexOf("const TILES = [")) + 2);
  const TILES = vm.runInNewContext(tilesSrc.replace("const TILES =", "TILES =") + ";TILES", {});
  TILES.splice(6, 0, ["go:games", "g-purple", "i-game", "Juegos", "A tu ritmo"]); // lo que hace prototype-games.js
  const gi = TILES.findIndex((t) => t[0] === "go:games");
  TILES[gi] = ["go:games", "g-teal", "i-gamepad", "Juegos", "A tu ritmo"];
  TILES.splice(TILES.findIndex((t) => t[0] === "go:games"), 0, ["go:apps", "g-white", "i-apps", "Servicios", ""]);
  assert.equal(TILES.length, 10);
  assert.equal(TILES.map((t) => t[3]).slice(5).join(" · "), "Música · Servicios · Juegos · Descansar · Ajustes");
  assert.match(glue, /\$\('#tiles'\)\.className = 'grid5x2'/, "el inicio pasa a 5×2");
  assert.match(fs.readFileSync(dir + "layout.css", "utf8"), /\.grid5x2 \{ grid-template-columns: var\(--edge\)/, "5×2 con bordes más anchos");
}

// 3. Siempre hay salida grande: "‹ Inicio" en la barra, "← Inicio" en Juegos y "← Juegos" en el catálogo externo.
assert.match(glue, /home-nav" data-t data-act="go:home"/);
assert.match(games, /window\.TOKI_OS_SHELL\?button\('home','← Inicio'\)/);
assert.match(games, /if\(act==='home'\) return go\('home'\);/);
assert.match(external, /window\.TOKI_OS_SHELL\?b\('toki','← Juegos'\)/);
assert.match(external, /if\(act==='toki'\)return window\.TOKI_GAMES\?\.lobby\(\);/);

// 4. Dentro del SO el puntero se elige en Ajustes (no hay botones Nariz/Mirada/Mouse que apaguen el iPhone).
assert.match(games, /if \(window\.TOKI_OS_SHELL\) return `<p class="game-note">/);
assert.match(external, /if\(tabletAccess\|\|window\.TOKI_OS_SHELL\)return/);

// 5. Con el iPhone nada se elige en cadena en Juegos y Servicios (mismo bloqueo que el resto del SO).
assert.match(glue, /if \(iphoneDwell\(\)\) S\.lockUntil = performance\.now\(\) \+ LOCKOUT_MS;/);
assert.match(glue, /return innerActivate\(el, calibrate, immediate\)/);

// 5b. Juegos de Toki con íconos de app del SO; partida externa grande con aviso de una línea; al salir se cierra.
assert.match(games, /window\.TOKI_GAME_ART\?\.\[kind\]/);
assert.match(glue, /window\.TOKI_GAME_ART = \{ stars: .*memory: .*external: /);
assert.match(external, /Primera vez: toca la bandera de España y luego «Crear usuario»\./);
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

// 5c. Parejas sin «Continuar» (las tarjetas distintas giran solas); Constelaciones guarda tiempo sin contar pausas;
//     Música abre Spotify en Servicios.
assert.ok(!/act==='next'/.test(games), "Parejas ya no necesita «Continuar»");
assert.match(games, /setTimeout\(\(\)=>\{ if\(state!==s\|\|s\.done\) return; s\.open=\[\]; s\.flipBack=pair; renderGame\(\); \}, 1200\)/);
assert.match(games, /function clock\(s, now=performance\.now\(\)\)/);
assert.match(games, /'¡Nuevo récord de tiempo!'/);
assert.match(glue, /if \(act === 'music'\) \{[^]*?go\('apps'\);\s*void app\?\.openSpotify\(\);/);

// 6. Ajustes › Tema y color: tema y 5 colores, todos definidos en claro y oscuro, y se recuerda.
for (const p of ["bosque", "oceano", "atardecer", "lavanda"]) {
  assert.match(colors, new RegExp(`:root\\[data-palette="${p}"\\] #stage`), `falta ${p} oscuro`);
  assert.match(colors, new RegExp(`:root\\[data-theme="light"\\]\\[data-palette="${p}"\\] #stage`), `falta ${p} claro`);
}
assert.match(html, /\['noche','Noche'\],\['bosque','Bosque'\],\['oceano','Océano'\],\['atardecer','Atardecer'\],\['lavanda','Lavanda'\]/);
assert.match(html, /localStorage\.getItem\('woki\.palette'\)/, "el color se aplica antes de pintar");
assert.match(html, /case 'look':/);

console.log("Juegos y Servicios en Toki OS: módulos del equipo, 10 tarjetas en 5×2, salidas grandes, sin elección en cadena y colores.");
