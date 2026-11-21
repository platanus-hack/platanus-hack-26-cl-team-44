/* =========================================================
   Juegos y Servicios dentro de Toki OS (woki-os.html)

   Reutiliza los módulos del equipo sin copiarlos:
   - prototype-games.js            Juegos de Toki (Constelaciones, Parejas, récords)
   - prototype-external-games.js   catálogo de Eye Gaze Games (SpecialEffect)
   - toki-apps.js                  Servicios (Spotify, BioBioChile, YouTube…) vía apps-bridge
   Este archivo solo los conecta al SO: tarjetas del inicio, pantalla de Servicios,
   bloqueo tras elegir (como el resto del SO) y salidas grandes en cada pantalla.
   Se carga después de los tres módulos.
   ========================================================= */
window.TOKI_OS_SHELL = true;
// Los módulos de juegos los esperan; en la tablet los define prototype-motion.html.
const tabletAccess = null;
function tabletGameInput() { return null; }

window.addEventListener('load', () => {
  'use strict';
  const OWN = /^(game|external|apps):/;
  const SERVICE_LOGOS = ['spotify', 'youtube', 'biobio', 'mercadolibre'];

  /* ---------- íconos en el estilo de Woki (trazo, 24×24) ---------- */
  document.querySelector('svg defs').insertAdjacentHTML('beforeend',
    '<symbol id="i-gamepad" viewBox="0 0 24 24"><path d="M7 7.5h10a4.5 4.5 0 0 1 4.4 5.4l-.8 4a2.6 2.6 0 0 1-4.5 1.2L14.5 16h-5l-1.6 2.1a2.6 2.6 0 0 1-4.5-1.2l-.8-4A4.5 4.5 0 0 1 7 7.5z"/><path d="M8 10.5v3M6.5 12h3M15.5 11h.01M17.5 13h.01"/></symbol>' +
    '<symbol id="i-apps" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></symbol>' +
    '<symbol id="i-stars" viewBox="0 0 24 24"><path d="M10 3.5l1.6 4.4 4.4 1.6-4.4 1.6L10 15.5l-1.6-4.4L4 9.5l4.4-1.6z"/><path d="M17.5 13.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/><path d="M18 3.5v3M16.5 5h3"/></symbol>' +
    '<symbol id="i-pairs" viewBox="0 0 24 24"><rect x="2.8" y="5.5" width="9.4" height="13" rx="2.2"/><rect x="11.8" y="5.5" width="9.4" height="13" rx="2.2"/><path d="M7.5 10.2l1.6 1.8-1.6 1.8-1.6-1.8zM16.5 10.2l1.6 1.8-1.6 1.8-1.6-1.8z"/></symbol>' +
    '<symbol id="i-eyegame" viewBox="0 0 24 24"><path d="M2.5 12s3.6-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.6 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3.2"/><path d="M12 10.6v2.8M10.6 12h2.8"/></symbol>');
  // Íconos de los Juegos de Toki con el mismo estilo de app del inicio (los lee prototype-games.js).
  const gameIcon = (color, icon) => `<span class="app ${color} game-icon"><svg><use href="#${icon}"/></svg></span>`;
  window.TOKI_GAME_ART = { stars: gameIcon('g-indigo', 'i-stars'), memory: gameIcon('g-orange', 'i-pairs'), external: gameIcon('g-teal', 'i-eyegame') };

  /* ---------- inicio: 10 tarjetas en 5×2 (bordes 1,2×, ver layout.css) ---------- */
  const gi = TILES.findIndex(t => t[0] === 'go:games');   // la agregó prototype-games.js
  const games = ['go:games', 'g-teal', 'i-gamepad', 'Juegos', 'A tu ritmo'];
  if (gi >= 0) TILES[gi] = games; else TILES.splice(6, 0, games);
  TILES.splice(TILES.findIndex(t => t[0] === 'go:games'), 0, ['go:apps', 'g-white', 'i-apps', 'Servicios', 'Música, videos, noticias']);
  $('#tiles').className = 'grid5x2';
  const baseTiles = renderTiles;
  renderTiles = function () {
    baseTiles();
    // Servicios muestra los logos reales (como en el inicio de la tablet), cada uno con su fondo de marca.
    const app = $('#tiles [data-act="go:apps"] .app');
    if (app && window.TokiApps) app.innerHTML = `<span class="service-mosaic">${SERVICE_LOGOS.map(id => TokiApps.brandLogo(id)).join('')}</span>`;
  };
  renderTiles();

  /* ---------- pantalla de Servicios ---------- */
  const section = document.createElement('section');
  section.id = 's-apps'; section.className = 'screen'; section.dataset.title = 'Servicios';
  section.innerHTML = '<div class="status"></div><div id="appsContent"></div>';
  $('#stage').append(section);
  const root = $('#appsContent');
  let app = null, latch = null, suspended = false;
  const unavailable = () => document.hidden || S.gazeLost || S.rest || !!S.alarm || $('#calib').classList.contains('on');
  function targets() {
    if (!app) return;
    for (const el of root.querySelectorAll('[data-app-action]')) {
      el.classList.add('t');   // mismo aspecto, foco y anillo que el resto del SO
      const stop = el.dataset.appAction === 'input-pause';
      if (el.disabled || unavailable() || (app.paused && !stop)) el.removeAttribute('data-t');
      else el.setAttribute('data-t', '');
    }
  }
  function mount() {
    app = TokiApps.mount(root, {
      motion: true, dwell: () => CFG.dwellMs, home: () => go('home'),
      beforePaint: () => clearFocus(),
      afterPaint: () => { decorate(root); targets(); },
      input: async (action, instance) => {
        if (action === 'input-pause') { instance.paused = !instance.paused; instance.render(); return; }
        if (action === 'scroll-up' || action === 'scroll-down') { root.scrollBy({ top: action === 'scroll-up' ? -450 : 450, behavior: 'instant' }); clearFocus(); }
      },
    });
  }

  /* ---------- navegación y elección ---------- */
  // Barra superior como en las demás pantallas: "‹ Inicio" grande + estado.
  for (const el of $$('#s-games .status, #s-apps .status')) {
    el.innerHTML = '<button type="button" class="t pill glass home-nav" data-t data-act="go:home">‹ Inicio</button><div class="status-info"></div>';
  }
  renderStatus();

  const innerGo = go;
  go = function (name, ...rest) {
    if (name === 'apps' && S.screen !== 'apps') mount();
    innerGo(name, ...rest);
    // Al salir de Juegos se cierra la partida externa (si no, sigue corriendo y sonando oculta).
    if (name !== 'games') $('#externalGame')?.remove();
    if (name !== 'apps') { app?.destroy(); app = null; }
  };
  const innerActivate = activate;
  activate = function (el, calibrate = true) {
    const act = el?.dataset.act || '';
    if (!OWN.test(act)) return innerActivate(el, calibrate);
    // Igual que el resto del SO: se ve la pulsación y, con el iPhone, nada se elige en cadena.
    press(el);
    if (gazeOnly()) S.lockUntil = performance.now() + LOCKOUT_MS;
    if (!act.startsWith('apps:')) return innerActivate(el, calibrate);
    if (!app || S.screen !== 'apps' || el.disabled || unavailable() || (app.paused && el.dataset.appAction !== 'input-pause')) return;
    if (calibrate && latch) return;   // al repintar, la mirada quieta no elige otra cosa
    latch = el.getBoundingClientRect();
    if (calibrate && window.GAZE) GAZE.onConfirm(el);
    void app.act(el);
  };
  function loop() {
    if (app) {
      if (latch && (gz.x < latch.left - 8 || gz.x > latch.right + 8 || gz.y < latch.top - 8 || gz.y > latch.bottom + 8)) latch = null;
      const blocked = unavailable();
      if (blocked !== suspended) { suspended = blocked; clearFocus(); targets(); }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Al recargar en #games o #apps, esas pantallas aún no existían cuando el SO leyó la dirección.
  const fromUrl = screenFromUrl();
  if (fromUrl === 'games' || fromUrl === 'apps') go(fromUrl, false);
});
