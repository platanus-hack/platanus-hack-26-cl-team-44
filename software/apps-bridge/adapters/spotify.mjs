import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {existsSync} from 'node:fs';
const exec = promisify(execFile);
const fault = (message, status = 400) => Object.assign(new Error(message), {status});
export function safeMessage(error) {
  const raw = `${error.stderr || ''} ${error.message || ''}`;
  // -1743: macOS no dio permiso de Automatización (antes caía en el filtro de 'auth' y pedía conectar la sesión)
  if (/-1743|not authorized to send apple events/i.test(raw)) return 'macOS no dio permiso para controlar Spotify. Ajustes › Privacidad y seguridad › Automatización › Terminal › activa Spotify.';
  if (/cookie|keychain|auth|token|login|401|403/i.test(raw)) return 'Conecta tu sesión de Spotify. Si macOS pide acceso al llavero, revisa el diálogo en tu computador.';
  if (/ENOENT/i.test(raw)) return 'El conector de Spotify todavía no está instalado en este computador.';
  if (/429|rate.limit/i.test(raw)) return 'Spotify pide esperar. Vuelve a intentarlo más tarde.';
  if (/timeout|timed out|abort|killed/i.test(raw)) return 'La operación tardó demasiado. Puedes volver a intentarlo.';
  return 'No se pudo completar la operación. Comprueba que Spotify esté abierto y vuelve a intentarlo.';
}
// Canción, carátula y posición en milisegundos ENTEROS: `spogo status` deja progress_ms en 0
// cuando macOS usa coma decimal (AppleScript entrega "73,92"), y la línea de tiempo no avanzaba.
const META_SCRIPT = 'if application "Spotify" is running then tell application "Spotify" to return (spotify url of current track) & linefeed & (artwork url of current track) & linefeed & ((round ((player position) * 1000)) as text)';

/** Aplica la salida de META_SCRIPT al estado de spogo, solo si es la misma canción. Devuelve una copia. */
export function applySpotifyMeta(result, stdout) {
  const track = result?.item?.uri;
  const [uri, url, position] = String(stdout || '').trim().split(/\r?\n/);
  if (!track || uri !== track) return result;
  const duration = Number(result.item.duration_ms) || Infinity;
  const ms = /^\d+$/.test(position || '') ? Number(position) : NaN;
  const progress = Number.isFinite(ms) && ms <= duration + 2000 ? Math.min(ms, duration) : result.progress_ms;
  const artwork = /^https:\/\/i\.scdn\.co\/image\/[a-z0-9]+$/i.test(url || '') ? url : '';
  return {...result, progress_ms: progress, item: {...result.item, artwork}};
}

export async function runSpogo(args, {signal} = {}) {
  const isStatus = args.includes('applescript') && args.includes('status');
  // En paralelo con spogo: la consulta de posición no suma tiempo a reproducir/pausar.
  const meta = isStatus ? exec('/usr/bin/osascript', ['-e', META_SCRIPT], {timeout: 1800, signal}).catch(() => null) : null;
  const {stdout} = await exec('spogo', ['--no-input', '--timeout', '12s', ...args], {timeout: 18000, maxBuffer: 1024 * 1024, signal});
  const result = stdout.trim() ? JSON.parse(stdout) : {};
  if (!isStatus || !result.item?.uri) return result;
  return applySpotifyMeta(result, (await meta)?.stdout);
}
export function normalizeTracks(data) {
  const rows = data.items || data.tracks?.items || data.tracks || [];
  return (Array.isArray(rows) ? rows : []).map(x => x.track || x).filter(x => /^spotify:track:[a-zA-Z0-9]{22}$/.test(x.uri || '')).slice(0, 5).map(x => ({
    uri: x.uri, name: String(x.name || 'Canción'), artists: (x.artists || []).map(a => typeof a === 'string' ? a : a.name).filter(Boolean).join(', '),
    album: typeof x.album === 'string' ? x.album : x.album?.name || ''
  }));
}

export const spotifyManifest = {
  schemaVersion: 1, id: 'spotify', name: 'Spotify', version: '1.0.0', aliases: [],
  interface: {kind: 'music', entry: 'player'},
  auth: {type: 'local-browser-session', optionalFor: ['status','play','pause','next']},
  dependencies: ['spogo', 'Spotify.app', 'macOS'],
  source: 'https://github.com/steipete/spogo',
  requiredEvidence: ['search','play','pause'],
  actions: ['connect','disconnect','search','status','play','pause','next'].map(id=>({id,mutates: !['status','search'].includes(id),requiresAccount:id==='search'}))
};
export function createSpotifyAdapter({run = runSpogo, installed = () => exec('spogo', ['--version'], {timeout:3000}), hasSpotify = () => existsSync('/Applications/Spotify.app')} = {}) {
  return {
    manifest: spotifyManifest,
    errorMessage: safeMessage,
    async prepare({report, signal}) {
      const version = await installed(); signal.throwIfAborted();
      report({stage:1,connector:'spogo',version:String(version.stdout || version || '').trim().slice(0,40),message:'Preparando los controles de Spotify…'});
      if (!hasSpotify()) throw fault('Instala Spotify.app en este computador para continuar.');
      return {stage:2,status:'needs_connection',message:'Conecta Spotify para buscar música. Los controles locales se pueden probar.'};
    },
    async execute(action, payload, ctx) {
      const execute = (args, options = {}) => run(args, {signal:ctx.signal,...options});
      if (action === 'connect') {
        if (!['chrome', 'safari', 'firefox', 'edge', 'brave'].includes(payload.browser)) throw fault('Elige un navegador válido.');
        // Only run after the person chooses to use their Spotify browser session.
        await execute(['--profile', 'toki', 'auth', 'import', '--browser', payload.browser, '--json']);
        await execute(['--profile', 'toki', '--engine', 'connect', 'search', 'track', '--limit', '1', '--json', '--', 'Spotify']);
        ctx.connected();
        return {connected: true};
      }
      if (action === 'disconnect') {
        await execute(['--profile', 'toki', 'auth', 'clear', '--json']);
        ctx.disconnected();
        return {connected: false};
      }
      if (action === 'search') {
        const query = String(payload.query || '').trim();
        if (!query || query.length > 160) throw fault('Escribe una búsqueda de hasta 160 caracteres.');
        const data = await execute(['--profile', 'toki', '--engine', 'connect', 'search', 'track', '--limit', '5', '--json', '--', query]);
        const tracks = normalizeTracks(data);
        if (tracks.length) ctx.evidence('search');
        return {tracks};
      }
      if (action === 'status') return await execute(['--engine', 'applescript', 'status', '--json']);
      if (action === 'next') {
        await execute(['--engine', 'applescript', 'next', '--json']);
        return await execute(['--engine', 'applescript', 'status', '--json']);
      }
      if (action === 'play' || action === 'pause') {
        if (action === 'play' && payload.uri && !/^spotify:track:[a-zA-Z0-9]{22}$/.test(payload.uri)) throw fault('Canción no válida.');
        const signal = AbortSignal.any([ctx.signal, AbortSignal.timeout(14000)]);
        await execute(['--engine', 'applescript', action, ...(action === 'play' && payload.uri ? [payload.uri] : []), '--json'], {signal});
        // Spotify acknowledges AppleScript before its playback state necessarily settles.
        for (let attempt = 0; attempt < 12; attempt++) {
          const status = await execute(['--engine', 'applescript', 'status', '--json'], {signal});
          const confirmed = action === 'pause' ? status.is_playing === false : status.is_playing === true && (!payload.uri || status.item?.uri === payload.uri);
          if (confirmed) { ctx.evidence(action); return status; }
          await new Promise(resolve => setTimeout(resolve, 250));
        }
        throw fault('Spotify recibió la orden, pero no confirmó el cambio. Consulta el estado antes de volver a intentarlo.', 409);
      }
      throw fault('Acción no disponible.', 404);
    }
  };
}
