// Historical check for the first local minigames. Superseded by external-games-check.mjs.
async page => {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:8000/prototype-motion.html?motion=spatial');
  await page.waitForTimeout(800);
  await page.locator('[data-act="go:games"]').click();
  await page.waitForTimeout(800);
  await page.locator('[data-act="game:stars"]').click();
  await page.locator('[data-act="game:pause"]').click();
  await page.waitForTimeout(2400);
  if(await page.locator('[data-act="game:pause"]').innerText()!=='Continuar') throw Error('Pause toggled under stationary pointer');
  await page.locator('[data-act="game:pause"]').click();
  for(let i=0;i<10;i++) {
    const target=page.locator('[data-act^="game:pick:"]');
    const r=await target.boundingBox();
    await page.evaluate(({x,y})=>window.setGaze(x,y),{x:r.x+r.width/2,y:r.y+r.height/2});
    await page.waitForTimeout(1350);
  }
  if(!await page.locator('.game-finish').count()) throw Error('Gaze dwell did not finish stars');
  await page.mouse.move(0,0);
  await page.locator('[data-act="game:lobby"]').click();
  await page.evaluate(()=>{window.savedRandom=Math.random;Math.random=()=>.999;});
  await page.locator('[data-act="game:memory"]').click();
  await page.evaluate(()=>{Math.random=window.savedRandom;});
  // Mismatch must remain visible until explicitly continued.
  await page.locator('[data-act="game:pick:0"]').click();
  await page.locator('[data-act="game:pick:2"]').click();
  await page.mouse.move(0,0); await page.waitForTimeout(1500);
  if(await page.locator('.game-revealed').count()!==2) throw Error('Mismatch not preserved');
  await page.locator('[data-act="game:next"]').click();
  for(const pair of [[0,1],[2,3],[4,5]]) {
    for(const i of pair) await page.locator(`[data-act="game:pick:${i}"]`).click();
    if(pair[0]!==4) await page.locator('[data-act="game:next"]').click();
  }
  if(!await page.locator('.game-score').innerText().then(x=>x.includes('290'))) throw Error('Memory score incorrect');
  await page.reload(); await page.waitForTimeout(800);
  await page.locator('[data-act="go:games"]').click();await page.waitForTimeout(800);
  await page.locator('[data-act="game:records"]').click();
  if(!await page.locator('.game-records').innerText().then(x=>x.includes('290')&&x.includes('100'))) throw Error('Records not persisted');
  await page.locator('[data-act="game:lobby"]').click();
  await page.locator('[data-act="game:stars"]').click();
  await page.evaluate(()=>setGazeLost(true));await page.waitForTimeout(1800);
  if(await page.locator('#gameContent [data-t]').count()) throw Error('Targets active while tracking lost');
  await page.evaluate(()=>setGazeLost(false));await page.waitForTimeout(100);
  if(!await page.locator('[data-act="game:pause"]').innerText().then(x=>x==='Continuar')) throw Error('Not paused after loss');
  await page.locator('[data-act="game:lobby"]').click();
  await page.locator('[data-act="game:external"]').click();
  if(!await page.locator('.game-external').innerText().then(x=>x.includes('No controla automáticamente'))) throw Error('Missing external limitation');
  await page.locator('[data-act="game:lobby"]').click();
  await page.mouse.move(0,0);
  if(errors.length) throw Error(errors.join('\n'));
  return 'PASS: gaze dwell completion, pause stability, memory mismatch/score, record persistence, tracking-loss pause, external explanation; no page errors.';
}
