// Kiosco de Myo: la TV en una app propia en vez de una pestaña de Chrome.
//
//   npx electron software/kiosco                          # abre http://127.0.0.1:8766/woki-os.html en pantalla completa
//   npx electron software/kiosco --url http://…           # otra dirección (debe ser 127.0.0.1 o localhost)
//   npx electron software/kiosco --ventana                # en ventana, para ensayar sin tapar la pantalla
//   npx electron software/kiosco --sin-red                # ensayo sin internet: solo 127.0.0.1 y la copia local
//   npx electron software/kiosco --prueba                 # autoprueba sin red: MediaPipe desde la copia local
//
// Qué hace que una pestaña no hace:
//   · MediaPipe y su modelo salen de la copia local verificada (software/toki-os/vendor): sin CDN ni internet.
//   · Cámara y micrófono solo para 127.0.0.1/localhost, sin aviso; cualquier otro permiso u origen, no.
//   · No navega fuera de 127.0.0.1/localhost ni abre ventanas nuevas.
//   · Si la página se cuelga o su proceso muere, la recarga. Si el monitor aún no está, espera y reintenta.
//   · La pantalla no se apaga mientras está abierta.
// Teclas del operador: Ctrl+Shift+Q cierra · Ctrl+Shift+R recarga · Ctrl+Shift+I herramientas (con KIOSCO_DEVTOOLS=1).
import { app, BrowserWindow, powerSaveBlocker, session, systemPreferences } from 'electron';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { esLocal, iniciarServidorLocal, patrones, redireccion, servirPagina } from './servidor-local.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const arg = (nombre) => { const i = process.argv.indexOf(nombre); return i > 0 ? process.argv[i + 1] : undefined; };
const PRUEBA = process.argv.includes('--prueba');
const OCULTO = process.argv.includes('--oculto') || PRUEBA;   // sin ventana visible (pruebas automáticas)
const VENTANA = process.argv.includes('--ventana') || OCULTO;
const SIN_RED = process.argv.includes('--sin-red') || PRUEBA;
const URL_TV = arg('--url') || process.env.KIOSCO_URL || 'http://127.0.0.1:8766/woki-os.html';
const VENDOR = arg('--vendor') || process.env.TOKI_VENDOR_DIR || undefined;
const log = (...m) => console.log(new Date().toISOString().slice(11, 19), ...m);

if (!esLocal(URL_TV)) { console.error(`El kiosco solo abre 127.0.0.1 o localhost, no ${URL_TV}`); process.exit(2); }
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');   // la voz de Myo suena sin esperar un clic
if (!PRUEBA && !app.requestSingleInstanceLock()) app.exit(0);

let ventana;
let local;
let caidas = [];

function permisos(ses) {
  const permitidos = new Set(['media', 'fullscreen', 'speaker-selection', 'clipboard-sanitized-write']);
  ses.setPermissionRequestHandler((wc, permiso, responder, detalle) => {
    const ok = permitidos.has(permiso) && esLocal(detalle.requestingUrl || wc.getURL());
    if (!ok) log(`permiso negado: ${permiso} a ${detalle.requestingUrl || wc.getURL()}`);
    responder(ok);
  });
  ses.setPermissionCheckHandler((wc, permiso, origen) => permitidos.has(permiso) && esLocal(origen));
}

function redirecciones(ses) {
  // Sin red se mira todo, para cortar internet; en la TV normal solo los hosts de la CDN.
  const filtro = SIN_RED ? { urls: ['<all_urls>'] } : { urls: patrones() };
  ses.webRequest.onBeforeRequest(filtro, (d, cb) => {
    const destino = redireccion(d.url, local.base, local.verificadas);
    if (destino) return cb({ redirectURL: destino });
    if (SIN_RED && /^(https?|wss?):/.test(d.url) && !esLocal(d.url.replace(/^ws/, 'http'))) {
      return cb({ cancel: true });   // sin internet: si algo no está en la copia local, falla aquí y se ve
    }
    cb({});
  });
}

async function esperandoMonitor(motivo) {
  const html = (await readFile(join(AQUI, 'esperando.html'), 'utf8')).replace('{{motivo}}', motivo);
  await ventana.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`).catch(() => {});
}

async function monitorResponde() {
  try { return (await fetch(URL_TV, { signal: AbortSignal.timeout(2000) })).ok; } catch { return false; }
}

async function abrirTV() {
  if (!(await monitorResponde())) {
    await esperandoMonitor('Esperando al monitor de Myo…');
    while (!(await monitorResponde())) await new Promise(r => setTimeout(r, 1500));
  }
  log(`abriendo ${URL_TV}`);
  await ventana.loadURL(URL_TV).catch(() => {});
}

function vigilar(wc) {
  wc.on('will-navigate', (e, url) => { if (!esLocal(url)) { e.preventDefault(); log(`navegación bloqueada: ${url}`); } });
  wc.on('will-redirect', (e, url) => { if (e.isMainFrame && !esLocal(url) && !url.startsWith('data:')) { e.preventDefault(); log(`redirección bloqueada: ${url}`); } });
  wc.setWindowOpenHandler(({ url }) => { log(`ventana nueva bloqueada: ${url}`); return { action: 'deny' }; });
  wc.on('will-attach-webview', e => e.preventDefault());
  wc.on('did-fail-load', (_e, codigo, desc, url, principal) => {
    if (!principal || codigo === -3 || PRUEBA) return;   // -3: navegación abortada por otra
    log(`no cargó ${url}: ${desc}`);
    setTimeout(abrirTV, 1500);
  });
  wc.on('render-process-gone', (_e, d) => {
    if (PRUEBA) { console.log(`PRUEBA ${JSON.stringify({ error: `renderer: ${d.reason}` })}`); app.exit(1); return; }
    const ahora = Date.now();
    caidas = [...caidas.filter(t => ahora - t < 60_000), ahora];
    log(`la página se cayó (${d.reason}); ${caidas.length} en el último minuto`);
    if (caidas.length > 5) { esperandoMonitor('La TV se cayó varias veces. Revisa /tmp/myo-kiosco.log'); return; }
    setTimeout(abrirTV, 1000);
  });
  let colgada;
  wc.on('unresponsive', () => {
    log('la página no responde');
    colgada = setTimeout(() => { log('sigue sin responder: recargando'); wc.forcefullyCrashRenderer(); }, 15_000);
  });
  wc.on('responsive', () => clearTimeout(colgada));
  wc.on('before-input-event', (e, k) => {
    if (k.type !== 'keyDown' || !k.control || !k.shift) return;
    const t = k.key.toLowerCase();
    if (t === 'q') { e.preventDefault(); app.quit(); }
    if (t === 'r') { e.preventDefault(); abrirTV(); }
    if (t === 'i' && process.env.KIOSCO_DEVTOOLS === '1') { e.preventDefault(); wc.toggleDevTools(); }
  });
}

async function prueba() {
  const html = await readFile(join(AQUI, 'prueba.html'), 'utf8');
  const pagina = await servirPagina(html);
  const limite = setTimeout(() => { console.log('PRUEBA {"error":"sin respuesta en 60 s"}'); app.exit(1); }, 60_000);
  ventana.webContents.on('console-message', (e) => {
    const texto = e.message ?? '';
    if (!texto.startsWith('PRUEBA ')) return;
    clearTimeout(limite);
    console.log(texto);
    const r = JSON.parse(texto.slice(7));
    app.exit(r.red === 'bloqueada' && r.mediapipe?.ok && r.archivos?.every(a => a.ok) ? 0 : 1);
  });
  await ventana.loadURL(pagina.url);
}

app.whenReady().then(async () => {
  local = await iniciarServidorLocal(VENDOR ? { dir: VENDOR } : {});
  if (SIN_RED) log('sin red: solo 127.0.0.1 y la copia local');
  log(`copia local: ${local.verificadas.size} de ${local.verificadas.size + local.faltan.length} archivos verificados` +
      (local.faltan.length ? ' (los que faltan van a internet; corre node software/toki-os/tools/vendor-assets.mjs)' : ''));
  const ses = session.defaultSession;
  permisos(ses);
  redirecciones(ses);

  if (process.platform === 'darwin' && !OCULTO) {
    // macOS pide permiso por app: así el aviso sale al abrir el kiosco y no en medio de la demo
    for (const m of ['camera', 'microphone']) {
      if (systemPreferences.getMediaAccessStatus(m) !== 'granted') {
        systemPreferences.askForMediaAccess(m).then(ok => log(`permiso de ${m} en macOS: ${ok ? 'sí' : 'no'}`));
      }
    }
  }
  if (OCULTO && process.platform === 'darwin') app.dock?.hide();

  ventana = new BrowserWindow({
    show: !OCULTO, kiosk: !VENTANA, fullscreen: !VENTANA, width: 1280, height: 800,
    backgroundColor: '#0b0b0f', autoHideMenuBar: true, title: 'Myo',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false, devTools: process.env.KIOSCO_DEVTOOLS === '1' },
  });
  ventana.removeMenu();
  vigilar(ventana.webContents);

  if (PRUEBA) return prueba();
  powerSaveBlocker.start('prevent-display-sleep');
  await abrirTV();
});

app.on('second-instance', () => { if (ventana) { ventana.show(); ventana.focus(); } });
app.on('window-all-closed', () => app.quit());
