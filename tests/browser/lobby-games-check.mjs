// Run with the existing localhost:8000 prototype server and desktop Chrome.
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAppsServer} from '../../software/apps-bridge/server.mjs';

const directory=mkdtempSync(join(tmpdir(),'toki-game-test-'));
process.env.TOKI_BRIDGE_SESSION_DIR=join(directory,'driver');
const bridge=await import('../../software/browser-bridge/start.mjs');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const events=[];
let aim='idle';
const sink=http.createServer((req,res)=>{
  if (req.method==='POST') {
    let data=''; req.on('data',chunk=>data+=chunk);
    req.on('end',()=>{events.push(JSON.parse(data));res.end();}); return;
  }
  res.setHeader('Content-Type','text/html');
  res.end(`<style>*{margin:0}canvas{width:100vw;height:100vh}</style><canvas></canvas><script>
    for(const type of ['mousemove','click']) document.addEventListener(type,e=>fetch('/',{method:'POST',body:JSON.stringify({type,x:e.clientX/innerWidth,y:e.clientY/innerHeight,trusted:e.isTrusted})}));
  </script>`);
});
await new Promise(resolve=>sink.listen(0,'127.0.0.1',resolve));
const foreign='http://localhost:'+sink.address().port;
const site=createAppsServer({stateDir:directory});
const handler=site.listeners('request')[0];
site.removeListener('request',handler);
site.on('request',(req,res)=>{
  if(req.url==='/test-aim'){res.end(aim);return;}
  if(!req.url.startsWith('/woki-os.html?')){handler(req,res);return;}
  res.setHeader('Content-Type','text/html');
  res.end(`<style>*{margin:0}#stage{width:100vw;height:100vh}</style><div id="stage"></div><script>
    const mode=new URLSearchParams(location.search).get('metodo')==='nose'?'Nariz':'Mirada';
    window.WOKI={S:{gazeLost:false},gz:{x:1,y:1}};
    window.NOSE={on:true,mode:mode==='Nariz'?'nose':'gaze',raw:{},cal:{n:{dx:0,dy:0},L:1,R:1,U:1,D:1},stop(){this.on=false}};
    window.GAZE={cur:{blink:false},model:{wx:[1]}};
    addEventListener('load',()=>parent.postMessage({type:'toki-control-ready',mode},location.origin));
    let target='';
    setInterval(async()=>{target=await(await fetch('/test-aim')).text()},80);
    function feed(){
      if(target==='close' && parent.sessionStorage.getItem('toki.bridge.token')) parent.close();
      NOSE.lastFace=performance.now(); WOKI.S.gazeLost=target==='lost';
      const f=parent.document.querySelector('.catalog-frame'), doc=f?.contentDocument;
      const game=doc?.querySelector('#externalGame');
      if(game && parent.sessionStorage.getItem('toki.bridge.token') && !game.dataset.fixture) {
        game.dataset.fixture='1'; game.src=${JSON.stringify(foreign)};
      }
      const el=game || (target==='catalog' && doc?.querySelector('[data-act="external:play:1"]'));
      if(el && target!=='idle') {
        const g=el.getBoundingClientRect(),r=f.getBoundingClientRect();
        WOKI.gz={x:(r.left+g.left+g.width*(target==="other" ? .32 : .65))*innerWidth/parent.innerWidth,y:(r.top+g.top+g.height*.38)*innerHeight/parent.innerHeight};
      }
      requestAnimationFrame(feed);
    } feed();
  </script>`);
});
await new Promise(resolve=>site.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+site.address().port;
const run=async expression=>{
  const result=await bridge.cdp('Runtime.evaluate',{expression,returnByValue:true},bridge.sessionId);
  if(result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
async function until(fn,ms=16000){const start=Date.now();while(Date.now()-start<ms){if(await fn())return;await wait(100);}throw Error('Tiempo agotado: '+fn);}
try {
  await bridge.cdp('Page.navigate',{url:origin+'/prototype-lobby.html?start=games&acceso=elegir'},bridge.sessionId);
  await until(()=>run('!!document.querySelector(".catalog-frame")?.contentWindow?.TOKI_EXTERNAL'));
  for(const mode of ['Mirada','Nariz']){
    await run(`document.querySelector('[data-pointer="${mode}"]').click()`);
    aim='catalog';
    await until(()=>run('!!document.querySelector(".catalog-frame").contentDocument.querySelector(\'[data-act="external:play:1"] .dwell-outline\')'));
    await wait(550);
    assert.equal(await run('document.querySelector(".catalog-frame").contentDocument.querySelector(".dwell-outline rect:last-child").getAttribute("stroke-dashoffset")'),'1');
    if(mode==='Mirada'){
      aim='lost';
      await until(()=>run('!document.querySelector(".catalog-frame").contentDocument.querySelector(".dwell-outline")'));
      await wait(3100); assert.equal(events.length,0);
      aim='idle'; await run('document.querySelector("#tracking").click()');
    }
  }
  // Actual launcher receives the selection, opens an isolated lobby and delivers
  // native input to a different origin. No mouse events are fed into either tab.
  process.env.TOKI_BRIDGE_SESSION_DIR=join(directory,'player');
  await until(()=>events.some(e=>e.trusted && e.type==='mousemove' && Math.abs(e.x-.65)<.04 && Math.abs(e.y-.38)<.04),25000);
  aim='lost';const clicks=events.filter(e=>e.type==='click').length;
  await wait(3300);assert.equal(events.filter(e=>e.type==='click').length,clicks);
  aim='play';
  await until(()=>events.some(e=>e.trusted && e.type==='click' && Math.abs(e.x-.65)<.04 && Math.abs(e.y-.38)<.04),8000);
  await wait(3200);assert.equal(events.filter(e=>e.type==='click').length,clicks+1);
  aim='other';
  await until(()=>events.some(e=>e.trusted && e.type==='mousemove' && Math.abs(e.x-.32)<.04),4000);
  console.log('PASS: eye/nose catalog dwell, tracking loss, ordinary lobby handoff, calibrated movement and a single trusted click on a cross-origin canvas.');
} catch (error) { console.error(error); process.exitCode=1; } finally {
  // The test-only calibration frame can close its own isolated tab.
  aim='close';
  await wait(250);
  site.close();site.closeAllConnections();sink.close();sink.closeAllConnections();
  bridge.shutdown();
  rmSync(directory,{recursive:true,force:true});
}
