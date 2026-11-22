// Run with --live to use SpecialEffect's language picker in a fresh local profile.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAppsServer} from '../../software/apps-bridge/server.mjs';
import {renderGame} from '../../software/apps-bridge/game-renderer.mjs';

const require=createRequire(new URL('../../software/apps-bridge/package.json',import.meta.url));
const {chromium}=require('playwright-core');
const profile=await mkdtemp(join(tmpdir(),'toki-os-game-'));
const live=process.argv.includes('--live');
let player;
const site=createAppsServer({stateDir:profile,renderGame:settings=>renderGame(settings,async context=>{
  player=context.pages()[0];
  if(!live) await context.route(settings.url,route=>route.fulfill({contentType:'text/html; charset=utf-8',body:`
    <button title="Spanish" style="position:absolute;left:63%;top:58%;width:100px;height:60px"
      onclick="if(event.isTrusted){this.hidden=true;document.querySelector('#create').hidden=false}">Español</button>
    <button id="create" hidden style="position:absolute;left:24%;top:34%;width:120px;height:60px"
      onclick="if(event.isTrusted)this.replaceWith('Partida iniciada')">Crear usuario</button>`}));
})});
const browser=await chromium.launch({channel:'chrome'});
try {
  await new Promise(resolve=>site.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${site.address().port}`;
  const page=await browser.newPage({viewport:{width:1400,height:880}});
  if(!live){
    await page.route('**/*',route=>new URL(route.request().url()).origin===origin ? route.continue() : route.abort());
    await page.routeWebSocket('**/*',socket=>socket.close());
  }
  await page.goto(`${origin}/woki-os.html?escucha=manual#games`);
  await page.locator('[data-c="mouse"]').click();
  const catalog=page.locator('#s-games');
  assert.equal(await catalog.locator('.external-card').count(),6);
  assert.equal(await catalog.locator('.game-footer').count(),0);
  const game=page.locator('[data-act="external:play:0"]');
  if(!live){
    // Hold the first response so a slow startup is observable, then exercise the normal retry.
    let firstRequest;
    const requested=new Promise(resolve=>{firstRequest=resolve;});
    await page.route('**/api/games/play',route=>firstRequest(route),{times:1});
    await game.click();
    const route=await requested;
    await page.getByRole('status').filter({hasText:'Abriendo Eye Drive…'}).waitFor();
    assert.ok(await page.locator('img#externalGame').isHidden(),'the empty image must stay hidden');
    await route.fulfill({contentType:'application/x-ndjson',body:JSON.stringify({frame:'bm90LWEtaW1hZ2U='})+'\n'});
    await page.getByText('No se pudo mostrar la primera imagen de la partida.').waitFor();
    await page.getByRole('button',{name:'Reintentar'}).click();
  } else {
    await game.click();
  }
  await page.locator('img#externalGame').waitFor({timeout:60000});
  assert.equal(await page.locator('.external-loading').count(),0);

  // Supply nose samples to the official OS at the same boundary used by the camera.
  await page.evaluate(()=>{
    NOSE.on=true; NOSE.mode='nose'; NOSE.raw={dx:0,dy:0};
    window.tracking=true;
    window.feed=setInterval(()=>{if(tracking)NOSE.lastFace=performance.now();},30);
    MYO.mouse.x=1; MYO.mouse.y=1;
  });
  await page.waitForFunction(()=>document.querySelector('img#externalGame')?.naturalWidth>0 && TOKI_EXTERNAL.connected,null,{timeout:60000});
  const flag=player.locator('button[title="Spanish"]');
  await flag.waitFor({timeout:60000});
  const box=await flag.boundingBox(), viewport=player.viewportSize();
  const x=(box.x+box.width/2)/viewport.width, y=(box.y+box.height/2)/viewport.height;
  await page.evaluate(()=>{window.tracking=false; NOSE.lastFace=0;});
  await page.waitForFunction(()=>!tabletGameInput().point);
  await page.evaluate(({x,y})=>{
    const r=document.querySelector('#externalGame').getBoundingClientRect();
    MYO.mouse.x=r.left+x*r.width; MYO.mouse.y=r.top+y*r.height;
  },{x,y});
  await page.waitForTimeout(3300);
  assert.ok(await flag.isVisible(),'tracking loss must cancel dwell');

  // Nothing fixed below the player: SOS and Descansar are Inicio tiles, and Home is a slide-up button
  // hidden under the bottom edge until the gaze reaches it.
  assert.equal(await page.locator('#s-games .global-actions').count(),0,'no fixed footer under the game');
  const gameBox=await page.locator('#externalGame').boundingBox();
  assert.ok(gameBox);
  assert.ok(Math.abs(gameBox.width/gameBox.height - 16/9) < 0.01,'show the complete game at its native proportions');
  assert.ok(gameBox.height > page.viewportSize().height*.72,'the game should fill most of the window');
  assert.ok(await page.evaluate(()=>!document.querySelector('#homeDock')?.classList.contains('open')),'the slide-up Home button is off or hidden');

  // Pause and resume the same player, then select with tracked input.
  // Descansar es una tarjeta de Inicio: se activa igual que al elegirla.
  await page.evaluate(()=>activate(document.querySelector('#s-home [data-act="rest"]')));
  assert.ok(await page.evaluate(()=>S.rest && tabletGameInput().blocked));
  assert.ok(await flag.isVisible());
  await page.locator('#restWake').click();
  assert.ok(await page.evaluate(()=>!S.rest && !document.querySelector('#s-games').inert));
  await page.locator('#rest').waitFor({state:'hidden'});
  await page.evaluate(()=>{window.tracking=true;});
  if(!live){
    const clicks=[];
    page.on('request',request=>{
      if(request.url().endsWith('/api/games/input') && request.postDataJSON()?.type==='click') clicks.push(request);
    });
    await page.waitForFunction(()=>Boolean(TOKI_EXTERNAL.capturePoint()));
    await page.evaluate(()=>{window.tracking=false; NOSE.lastFace=0;});
    await page.waitForFunction(()=>!TOKI_EXTERNAL.capturePoint());
    await page.keyboard.press('Space');
    assert.equal(clicks.length,0,'a confirmation with stale tracking must not click');

    await page.evaluate(()=>{window.tracking=true;});
    await page.waitForFunction(()=>Boolean(TOKI_EXTERNAL.capturePoint()));
    const pause=page.locator('[data-act="external:pause"]');
    await pause.click();
    await page.locator('#externalCurtain').waitFor();
    await page.evaluate(()=>document.activeElement?.blur());
    await page.keyboard.press('Space');
    assert.equal(clicks.length,0,'a confirmation while the game control is paused must not click');
    await pause.click();
    await page.waitForFunction(()=>Boolean(TOKI_EXTERNAL.capturePoint()));

    // Explicit confirmation clicks on the down edge, not release or later pointer movement.
    await page.evaluate(()=>document.activeElement?.blur());
    await page.keyboard.down('Space');
    await page.evaluate(()=>{MYO.mouse.x+=90;});
    await flag.waitFor({state:'hidden',timeout:2200}); // Before the 3 s dwell.
    await page.keyboard.up('Space');
    assert.equal(clicks.length,1,'one explicit confirmation must produce exactly one click');
  }
  await flag.waitFor({state:'hidden',timeout:12000});
  const frame=player.frames().find(f=>f.url().includes('eyegazegames.com'));
  await frame.getByText('Crear usuario',{exact:false}).first().waitFor({timeout:15000});
  if(!live){
    const create=await player.locator('#create').boundingBox();
    await page.mouse.click(gameBox.x+(create.x+create.width/2)*gameBox.width/viewport.width,
      gameBox.y+(create.y+create.height/2)*gameBox.height/viewport.height);
    await player.getByText('Partida iniciada').waitFor({timeout:2200});
  }
  assert.equal(page.context().pages().length,1);
  await page.locator('[data-act="external:catalog"]').click();
  await game.waitFor();
  assert.equal(await page.locator('#externalGame').count(),0);
  console.log((live?'Eye Drive real':'Partida de prueba')+' · se eligió Español con el puntero del SO y apareció Crear usuario.');
} finally {
  await browser.close();
  await new Promise(resolve=>site.close(resolve));
  await rm(profile,{recursive:true,force:true});
}
