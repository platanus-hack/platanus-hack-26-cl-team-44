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
  if(!live) await context.route(settings.url,route=>route.fulfill({contentType:'text/html',body:
    '<button title="Spanish" style="position:absolute;left:63%;top:58%;width:100px;height:60px" onclick="if(event.isTrusted)this.replaceWith(\'Crear usuario\')">Español</button>'}));
})});
const browser=await chromium.launch({channel:'chrome'});
try {
  await new Promise(resolve=>site.listen(0,'127.0.0.1',resolve));
  const page=await browser.newPage({viewport:{width:1400,height:880}});
  await page.goto('http://127.0.0.1:'+site.address().port+'/woki-os.html#games');
  await page.locator('[data-c="mouse"]').click();
  const game=page.locator('[data-act="external:play:0"]');
  await game.click();
  await page.locator('iframe#externalGame').waitFor();

  // Supply nose samples to the official OS at the same boundary used by the camera.
  await page.evaluate(()=>{
    NOSE.on=true; NOSE.mode='nose'; NOSE.raw={dx:0,dy:0};
    window.tracking=true;
    window.feed=setInterval(()=>{if(tracking)NOSE.lastFace=performance.now();},30);
    WOKI.mouse.x=1; WOKI.mouse.y=1;
  });
  await page.waitForFunction(()=>document.querySelector('img#externalGame')?.naturalWidth>0 && TOKI_EXTERNAL.connected,null,{timeout:60000});
  const flag=player.frameLocator('iframe').locator('button[title="Spanish"]');
  await flag.waitFor({timeout:60000});
  const box=await flag.boundingBox(), viewport=player.viewportSize();
  const x=(box.x+box.width/2)/viewport.width, y=(box.y+box.height/2)/viewport.height;
  await page.evaluate(()=>{window.tracking=false; NOSE.lastFace=0;});
  await page.waitForFunction(()=>!tabletGameInput().point);
  await page.evaluate(({x,y})=>{
    const r=document.querySelector('#externalGame').getBoundingClientRect();
    WOKI.mouse.x=r.left+x*r.width; WOKI.mouse.y=r.top+y*r.height;
  },{x,y});
  await page.waitForTimeout(3300);
  assert.ok(await flag.isVisible(),'tracking loss must cancel dwell');

  // Pause and resume the same player, then select with tracked input.
  const rest=page.locator('#s-games .rest-nav');
  await rest.click();
  assert.ok(await page.evaluate(()=>S.rest && tabletGameInput().blocked));
  assert.ok(await flag.isVisible());
  await page.locator('#restWake').click();
  assert.ok(await page.evaluate(()=>!S.rest && !document.querySelector('#s-games').inert));
  await page.locator('#rest').waitFor({state:'hidden'});
  await page.evaluate(()=>{window.tracking=true;});
  if(!live){
    await page.waitForFunction(()=>Boolean(TOKI_EXTERNAL.capturePoint()));
    await page.keyboard.press('Space');
    await flag.waitFor({state:'hidden',timeout:2200}); // Before the 3 s dwell.
  }
  await flag.waitFor({state:'hidden',timeout:12000});
  const frame=player.frames().find(f=>f.url().includes('eyegazegames.com'));
  await frame.getByText('Crear usuario',{exact:false}).first().waitFor({timeout:15000});
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
