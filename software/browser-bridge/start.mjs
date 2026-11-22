// Isolated Chrome + loopback-only pointer transport. No browser profile or extension permissions.
import http from 'node:http';
import {spawn} from 'node:child_process';
import {randomBytes,createHash} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {claimSession} from './session.mjs';
const origin = 'http://localhost:8000';
const sessionKey=createHash('sha256').update(import.meta.url+origin).digest('hex').slice(0,12);
let readyResolve;
const ready=new Promise(resolve=>{readyResolve=resolve;});
const sessionLock=await claimSession(process.env.TOKI_BRIDGE_SESSION_DIR || join(tmpdir(),`toki-session-${process.getuid()}-${sessionKey}`),async ()=>{
 await ready;
 await cdp('Target.activateTarget',{targetId});
 await cdp('Page.bringToFront',{},sessionId);
});
if(!sessionLock){ console.log('Reutilizando la ventana de Myo que ya estaba abierta.');process.exit(0);}
const token=randomBytes(32).toString('hex');
const chrome=process.env.TOKI_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile=mkdtempSync(join(tmpdir(),'toki-browser-'));
const child=spawn(chrome,['--remote-debugging-pipe',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--window-size=1440,1000','about:blank'],{stdio:['ignore','ignore','ignore','pipe','pipe']});
let closing=false;
function shutdown(){
 if(closing)return;
 closing=true;available=false;
 for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('Sesión cerrada'));}pending.clear();
 server.close();sessionLock.close();child.kill();
}
process.once('SIGINT',shutdown);
process.once('SIGTERM',shutdown);
process.once('exit',()=>child.kill());
child.once('exit',()=>{shutdown();rmSync(profile,{recursive:true,force:true});process.exit(process.exitCode||0);});
let seq=0, buffer='', sessionId, targetId, available=false;
const pending=new Map();
child.on('error',e=>{console.error(e.message);process.exitCode=1;shutdown();});
child.stdio[4].on('data',data=>{
 buffer+=data; let idx;
 while((idx=buffer.indexOf('\0'))>=0){const raw=buffer.slice(0,idx);buffer=buffer.slice(idx+1);if(!raw)continue;const m=JSON.parse(raw);if(m.method==='Target.targetDestroyed'&&m.params.targetId===targetId){shutdown();return;}const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}}
});
function cdp(method,params={},session){return new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(Error('Browser did not respond'))},8000);pending.set(id,{resolve,reject,timer});child.stdio[3].write(JSON.stringify({id,method,params,...(session?{sessionId:session}:{})})+'\0');});}
let busy=false;
const server=http.createServer(async(req,res)=>{
 if(req.headers.host!==`127.0.0.1:${server.address().port}`||req.headers.origin!==origin){res.writeHead(403);return res.end();}
 res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');
 if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Headers','content-type,x-toki-token');res.setHeader('Access-Control-Allow-Methods','POST');res.writeHead(204);return res.end();}
 if(req.method!=='POST'||req.headers['x-toki-token']!==token){res.writeHead(403);return res.end();}
 let body='';for await(const chunk of req){body+=chunk;if(body.length>1024){res.writeHead(413);return res.end();}}
 res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
 try{
  if(!available)throw Error('Browser disconnected');
  if(req.url==='/status'){res.end(JSON.stringify({ready:true,targetId}));return;}
  if(req.url!=='/input'){res.writeHead(404);return res.end('{}');}
  if(busy){res.writeHead(429);return res.end('{}');}
  const p=JSON.parse(body);
  if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.y<0||p.x>10000||p.y>10000||!['move','click'].includes(p.type))throw Error('Invalid pointer');
  busy=true;
  const info=await cdp('Target.getTargetInfo',{targetId});
  const page=new URL(info.targetInfo.url);
  if(page.origin!==origin || page.pathname!=='/prototype-motion.html')throw Error('Myo tab navigated away');
  await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y},sessionId);
  if(p.type==='click'){
   await cdp('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,x:p.x,y:p.y},sessionId);
   await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,x:p.x,y:p.y},sessionId);
  }
  res.end('{"ok":true}');
 }catch(e){res.writeHead(503);res.end(JSON.stringify({error:e.message}));}finally{busy=false;}
});
try{
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
await cdp('Browser.getVersion');
const initialTargets=(await cdp('Target.getTargets')).targetInfos;
const url=`${origin}/prototype-motion.html?motion=spatial#tokiBridge=${token}&bridgePort=${server.address().port}`;
({targetId}=await cdp('Target.createTarget',{url}));
({sessionId}=await cdp('Target.attachToTarget',{targetId,flatten:true}));available=true;
await cdp('Target.setDiscoverTargets',{discover:true});
await cdp('Target.activateTarget',{targetId});
await cdp('Page.bringToFront',{},sessionId);
for(const target of initialTargets){if(target.type==='page'&&['about:blank','chrome://newtab/'].includes(target.url))await cdp('Target.closeTarget',{targetId:target.targetId});}
readyResolve();
console.log('Myo abierto en Chrome dedicado. El puente de mirada/nariz está listo. Ctrl+C cierra esta sesión.');
}catch(e){console.error(e.message);process.exitCode=1;shutdown();}
export {cdp,sessionId,targetId,server,child,shutdown};
