import {randomBytes} from 'node:crypto';
import {join} from 'node:path';
import {renderGame} from './game-renderer.mjs';

const routes = new Map([
  ['eye_drive','gamesource'], ['gazey_golf','gamesource'], ['open_drive','gamesource'],
  ['mole_miners','game'], ['solitaire','game'], ['sudoku','game'], ['all','carousel'], ['setup','carousel']
]);
const fault = (message,status) => Object.assign(new Error(message),{status});

export function createGameSessions(profile, launch = renderGame) {
  let active;
  async function play({game,width,height,owner}, origin, res) {
    if (!/^[a-f0-9-]{36}$/.test(owner) || !routes.has(game) || ![width,height].every(n => Number.isInteger(n) && n > 0 && n <= 16000))
      throw fault('Elige un juego del catálogo.',400);
    if (active?.owner === owner) active.controller.abort();
    if (active?.controller.signal.aborted) await active.finished;
    if (active) throw fault('Ya hay una partida abierta. Vuelve a su pestaña.',409);
    if (res.destroyed) return;
    const route = routes.get(game);
    const scale = Math.min(1,1280/width,900/height);
    const viewport = {width:Math.max(64,Math.round(width*scale)),height:Math.max(64,Math.round(height*scale))};
    const url = 'https://www.eyegazegames.com/'+route+(route === 'carousel' ? '' : '?id='+game);
    const controller = new AbortController();
    const session = {id:randomBytes(24).toString('hex'),owner,controller};
    active = session;
    const stop = () => controller.abort();
    res.once('close', stop);
    res.writeHead(200, {'Content-Type':'application/x-ndjson','Cache-Control':'no-store'});
    res.flushHeaders();
    const write = object => res.write(JSON.stringify(object)+'\n');
    let latestFrame, ending;
    const sendFrame = frame => {
      if (!session.renderer || res.writableNeedDrain) { latestFrame=frame; return; }
      if (!controller.signal.aborted) write({frame});
    };
    res.on('drain', () => { if (latestFrame) { const frame=latestFrame;latestFrame=null;sendFrame(frame); } });
    const ended = new Promise(resolve => { ending=resolve; });
    controller.signal.addEventListener('abort', ending, {once:true});
    session.finished = (async () => {
      try {
        session.renderer = await launch({url,profile:join(profile,'juegos'),viewport,origin,signal:controller.signal,
          onFrame:sendFrame,onEnded:ending});
        if (!controller.signal.aborted) {
          write({id:session.id});
          if (latestFrame) { const frame=latestFrame;latestFrame=null;sendFrame(frame); }
        }
        await ended;
      } catch {
        if (!res.destroyed) write({error:'No se pudo cargar la partida. Comprueba que Chrome esté instalado y vuelve a intentarlo.'});
      } finally {
        stop();
        await session.renderer?.close();
        if (!res.destroyed) res.end();
        if (active===session) active=null;
      }
    })();
    await session.finished;
  }
  async function input({id,type,x,y}) {
    const session=active;
    if (!session?.renderer || session.id!==id || session.controller.signal.aborted) throw fault('La partida se cerró.',404);
    if (!['move','click','leave'].includes(type) || (type!=='leave' && ![x,y].every(n=>Number.isFinite(n)&&n>=0&&n<=1)))
      throw fault('Posición fuera del juego.',400);
    await session.renderer.input({type,x,y});
    return {ok:true};
  }
  return {play,input,close(){active?.controller.abort();}};
}
