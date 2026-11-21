async page=>{
 const check=(c,m)=>{if(!c)throw Error(m)};
 const base='http://127.0.0.1:8791';
 await page.goto(base+'/prototype-lobby.html?start=apps');
 await page.locator('#settings').click();
 await page.getByRole('button',{name:'6 segundos',exact:true}).click();
 await page.reload();
 await page.locator('#settings').click();
 check(await page.getByRole('button',{name:'6 segundos',exact:true}).getAttribute('aria-pressed')==='true','Dwell preference lost on reload');
 await page.getByRole('button',{name:'3 segundos',exact:true}).click();
 const timing=await page.evaluate(()=>[900,1000,2000,2999,3000].map(ms=>TokiAccess.dwellProgress(ms)));
 check(timing[0]===0 && timing[1]===0 && timing[2]===.5 && timing[3]<1 && timing[4]===1,'Exploration and confirmation timing');
 await page.locator('#finish-settings').click();
 await page.locator('#settings').click();await page.locator('#selection').click();await page.locator('#pause-access').click();await page.locator('#finish-settings').click();
 const a=page.locator('[data-value="youtube"]');const r=await a.boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.waitForTimeout(1000);await page.keyboard.press('Space');await page.waitForTimeout(400);
 check(await page.evaluate(()=>TokiApps.active.view==='store'),'Paused Apps activated');
 await page.locator('#settings').click();await page.locator('#pause-access').click();await page.locator('#finish-settings').click();
 await page.goto(base+'/prototype-lobby.html?start=apps&appsAdmin=1');await page.waitForFunction(()=>TokiApps.active.online);await page.locator('[data-value="spotify"]').click();await page.locator('[data-app-action="open-adapter"]').click();
 check(await page.locator('[data-app-action="review"]').isDisabled(),'Missing review gate');
 await page.locator('[data-app-action="functional"]').click();await page.locator('[data-app-action="personal"]').click();await page.locator('[data-app-action="review"]').click();await page.waitForFunction(()=>TokiApps.active.job.status==='ready');
 await page.goto(base+'/prototype-lobby.html?start=apps');await page.waitForFunction(()=>TokiApps.active.online);await page.locator('[data-value="spotify"]').click();
 check(await page.evaluate(()=>TokiApps.active.view==='player'),'Ready app not directly opened');
 // A slow request may finish after navigating away; it must not pull the user back.
 await page.route('**/api/apps/spotify/actions/search',async route=>{await new Promise(r=>setTimeout(r,900));await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({tracks:Array.from({length:5},(_,i)=>({uri:'spotify:track:0123456789ABCDEFGHIJKL',name:'Canción '+(i+1),artists:'Artista'}))})});});
 await page.locator('[data-app-action="music"]').click();await page.locator('[data-app-action="music-search"]').first().click();await page.locator('[data-app-action="store"]').click();await page.waitForTimeout(1200);check(await page.evaluate(()=>TokiApps.active.view==='store'),'Late request stole navigation');
 await page.locator('[data-value="spotify"]').click();await page.locator('[data-app-action="music"]').click();await page.locator('[data-app-action="music-search"]').first().click();await page.locator('[data-app-action="play-track"]').first().waitFor();
 check(await page.locator('[data-app-action="play-track"]').count()===3,'First results page');await page.locator('[data-app-action="page"]').click();check(await page.locator('[data-app-action="play-track"]').count()===2,'Second results page');
 return 'PASS: shared pause/resume, team review, ready app opens directly, late requests preserve navigation, 3+2 results pagination.';
}
