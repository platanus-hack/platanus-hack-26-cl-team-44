/* =========================================================
   Juegos y Servicios dentro de Toki OS (woki-os.html)

   Reutiliza los módulos del equipo sin copiarlos:
   - prototype-games.js            pantalla de Juegos y bloqueo de selección al perder el seguimiento
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
  const SERVICE_LOGOS = ['spotify', 'rappi', 'biobio', 'mercadolibre'];

  /* ---------- íconos en el estilo de Woki (trazo, 24×24) ---------- */
  document.querySelector('svg defs').insertAdjacentHTML('beforeend',
    '<symbol id="i-gamepad" viewBox="0 0 24 24"><path d="M7 7.5h10a4.5 4.5 0 0 1 4.4 5.4l-.8 4a2.6 2.6 0 0 1-4.5 1.2L14.5 16h-5l-1.6 2.1a2.6 2.6 0 0 1-4.5-1.2l-.8-4A4.5 4.5 0 0 1 7 7.5z"/><path d="M8 10.5v3M6.5 12h3M15.5 11h.01M17.5 13h.01"/></symbol>' +
    '<symbol id="i-apps" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></symbol>');

  const baseTiles = renderTiles;
  renderTiles = function () {
    baseTiles();
    // Servicios muestra los logos reales (como en el inicio de la tablet), cada uno con su fondo de marca.
    const app = $('#tiles [data-act="go:apps"] .app');
    if (app && window.TokiApps) app.innerHTML = `<span class="home-mosaic" aria-hidden="true">${SERVICE_LOGOS.map(id => TokiApps.brandLogo(id)).join('')}</span>`;
    const games = $('#tiles [data-act="go:games"] .app');
    if (games && window.TOKI_EXTERNAL) {
      const covers = TOKI_EXTERNAL.covers.slice(0, 4);
      games.innerHTML = `<span class="home-mosaic" aria-hidden="true">${covers.map(src => `<img src="${src}" alt="" draggable="false">`).join('')}</span>`;
    }
  };
  renderTiles();

  /* ---------- pantalla de Servicios ---------- */
  const section = document.createElement('section');
  section.id = 's-apps'; section.className = 'screen'; section.dataset.title = 'Apps';
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
  // Algunos botones se habilitan sin repintar (p. ej. "Reproducir" cuando el video de YouTube está listo).
  new MutationObserver(targets).observe(root, { subtree: true, attributes: true, attributeFilter: ['disabled'] });
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
