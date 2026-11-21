// Runs with installed Chrome and isolated camera, game and storage fixtures.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAppsServer} from '../../software/apps-bridge/server.mjs';

const directory=mkdtempSync(join(tmpdir(),'toki-game-test-'));
const require=createRequire(new URL('../../software/apps-bridge/package.json',import.meta.url));
const {chromium}=require('playwright-core');
const {renderGame}=await import('../../software/apps-bridge/game-renderer.mjs');
const browser=await chromium.launch({channel:'chrome'});
const host=await browser.newContext();
const page=await host.newPage();
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const events=[];
let aim='idle';
let launches=0;
const site=createAppsServer({stateDir:directory,renderGame:opts=>renderGame(opts,async context=>{
  launches++;
  await context.exposeBinding('recordGameInput',(_,event)=>events.push(event));
  await context.route(opts.url,route=>route.fulfill({contentType:'text/html',body:`
    <style>*{margin:0}canvas{width:100vw;height:100vh;background:#246}</style><canvas></canvas>
    <script>for(const type of ['mousemove','click'])document.addEventListener(type,e=>
    recordGameInput({type,x:e.clientX/innerWidth,y:e.clientY/innerHeight,trusted:e.isTrusted}));</script>`}));

})});
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
      NOSE.lastFace=performance.now(); WOKI.S.gazeLost=target==='lost';
      const f=parent.document.querySelector('.catalog-frame'), doc=f?.contentDocument;
      const game=doc?.querySelector('#externalGame');
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
const run=expression=>page.evaluate(expression);
async function until(fn,ms=16000){const start=Date.now();while(Date.now()-start<ms){if(await fn())return;await wait(100);}throw Error('Tiempo agotado: '+fn);}
try {
  await page.goto(origin+'/?start=games&acceso=elegir', {waitUntil:'domcontentloaded'});
  const originalURL=page.url();
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
  await until(()=>events.some(e=>e.trusted && e.type==='mousemove' && Math.abs(e.x-.65)<.04 && Math.abs(e.y-.38)<.04),25000);
  aim='lost';const clicks=events.filter(e=>e.type==='click').length;
  await wait(3300);assert.equal(events.filter(e=>e.type==='click').length,clicks);
  aim='play';
  await until(()=>events.some(e=>e.trusted && e.type==='click' && Math.abs(e.x-.65)<.04 && Math.abs(e.y-.38)<.04),8000);
  await wait(3200);assert.equal(events.filter(e=>e.type==='click').length,clicks+1);
  aim='other';
  await until(()=>events.some(e=>e.trusted && e.type==='mousemove' && Math.abs(e.x-.32)<.04),4000);
  assert.equal(launches,1);assert.equal(host.pages().length,1);assert.equal(page.url(),originalURL);
  const catalog=page.frameLocator('.catalog-frame');
  const gameImage = catalog.locator('img#externalGame');
  async function checkGameImage() {
    const sizes = await gameImage.evaluate(img => {
      const panel = img.parentElement.getBoundingClientRect();
      return {width:img.naturalWidth, height:img.naturalHeight, panelWidth:panel.width, panelHeight:panel.height};
    });
    assert.ok(sizes.width >= Math.min(1280, Math.floor(sizes.panelWidth) - 1),
      `Game frame is only ${sizes.width}px wide in a ${Math.round(sizes.panelWidth)}px panel`);
    assert.ok(Math.abs(sizes.width / sizes.height - sizes.panelWidth / sizes.panelHeight) < .02,
      'The decoded game frame should have the same proportions as the pointer surface');
  }
  await checkGameImage();
  await page.setViewportSize({width:960,height:640});
  await checkGameImage();
  await page.locator('#take-rest').click();
  await page.locator('#resume-rest').waitFor();
  const beforeRest=events.filter(e=>e.type==='click').length;
  await wait(3200);assert.equal(events.filter(e=>e.type==='click').length,beforeRest);
  await page.locator('#resume-rest').click();
  await page.locator('#return-home').click();
  await page.locator('[data-open="games"]').waitFor();
  assert.equal(host.pages().length,1);
  console.log('PASS: same tab and URL, eye/nose catalog selection, decoded game frames, trusted movement and dwell click, tracking loss, rest and return home.');
} catch (error) { console.error(error, {launches, events:events.slice(-4), frame:await run('({body:document.querySelector(".catalog-frame")?.contentDocument?.querySelector("#gameContent")?.innerText, point:TokiAccess.gameInput(document.querySelector(".catalog-frame")?.contentWindow), visible:document.hasFocus()})')}); process.exitCode=1; } finally {
  await browser.close();
  site.close();site.closeAllConnections();
  rmSync(directory,{recursive:true,force:true});
}
