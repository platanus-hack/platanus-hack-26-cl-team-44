import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const launcher = fileURLToPath(new URL('../browser-bridge/start.mjs', import.meta.url));
const games = new Set(['eye_drive','gazey_golf','mole_miners','open_drive','solitaire','sudoku','setup','all']);

function openWindow(id, port) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [launcher], {
      env:{...process.env, TOKI_GAME_HANDOFF:id, TOKI_GAME_PORT:String(port)},
      stdio:['ignore','ignore','ignore','ipc']
    });
    let settled = false;
    const timeout = setTimeout(() => { child.kill(); finish(false); }, 15000);
    const finish = ok => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (child.connected) child.disconnect();
      child.unref();
      if (ok) resolve(); else reject(Error('No se pudo abrir Chrome'));
    };
    child.once('message', msg => finish(msg === 'ready'));
    child.once('error', () => finish(false));
    child.once('exit', () => finish(false));
  });
}

export function createGameSessions(launch = openWindow) {
  const pending = new Map();
  const fault = (message,status) => Object.assign(new Error(message),{status});
  return {
    async open(config, port) {
      if (!games.has(config.game) || !['Nariz','Mirada'].includes(config.mode) ||
          ![2000,3000,4000,6000].includes(config.dwellMs)) throw fault('Juego o control desconocido.',400);
      const id = randomBytes(24).toString('hex');
      for (const [key, entry] of pending) if (Date.now() >= entry.expires) pending.delete(key);
      if (pending.size >= 8) throw fault('Hay una sesión de juego pendiente.',409);
      const timer = setTimeout(() => pending.delete(id),60000);
      timer.unref();
      pending.set(id,{config:{game:config.game,mode:config.mode,dwellMs:config.dwellMs,calibration:config.calibration},expires:Date.now()+60000,timer});
      try { await launch(id,port); }
      catch { clearTimeout(timer); pending.delete(id); throw fault('No se pudo abrir Chrome para jugar. Puedes reintentarlo.',503); }
      return {opened:true};
    },
    take(id) {
      const entry = pending.get(id);
      if (!entry || Date.now() >= entry.expires) throw fault('Vuelve a elegir el juego desde Toki.',404);
      clearTimeout(entry.timer);
      pending.delete(id);
      return entry.config;
    }
  };
}
