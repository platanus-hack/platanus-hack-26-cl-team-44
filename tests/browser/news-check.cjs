async page=>{
 const check=(c,m)=>{if(!c)throw Error(m);},base='http://127.0.0.1:8791';
 const click=a=>page.locator(`[data-app-action="${a}"]`).first().click();
 const layout=async name=>{const faults=await page.locator('#lobbyApps').evaluate(root=>[root,root.querySelector('.ta-screen'),...root.querySelectorAll('button,.news-reading')].flatMap(el=>{const r=el.getBoundingClientRect();return el.scrollWidth>el.clientWidth+2||el.scrollHeight>el.clientHeight+2||r.bottom>innerHeight?[el.className]:[];}));check(!faults.length,name+': '+faults.join(','));};
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const token=(await(await page.request.get(base+'/api/session')).json()).token,headers={'x-toki-token':token,'Content-Type':'application/json'};
 const jobs=(await(await page.request.get(base+'/api/jobs',{headers})).json()).jobs;
 for(const j of jobs.filter(j=>j.app==='biobio'))await page.request.post(base+`/api/jobs/${j.id}/cancel`,{headers,data:{}});
 await page.goto(base+'/prototype-lobby.html?start=apps');await page.setViewportSize({width:1280,height:800});await page.waitForFunction(()=>TokiApps.active.adapters.some(a=>a.id==='biobio'));
 await page.locator('[data-value="biobio"]').click();
 if(await page.locator('[data-app-action="prepare"]').count())await click('prepare');
 await page.waitForFunction(()=>TokiApps.active.job?.status==='needs_test');await click('open-adapter');
 await page.locator('[data-app-action="read-news"]').first().waitFor();
 for(const size of [{width:1280,height:800},{width:1024,height:768},{width:390,height:844}]){
  await page.setViewportSize(size);await layout('list '+size.width);check(await page.locator('[data-app-action="read-news"]').count()===2,'Two headlines per page');
  await click('news-next');await layout('second list '+size.width);await click('news-prev');await click('read-news');
  await page.locator('.news-reading').waitFor();await layout('title '+size.width);
  while(await page.locator('[data-app-action="article-next"]').isEnabled()){await click('article-next');await layout('extract '+size.width);}
  await click('back');check(await page.locator('.news-list').count()===1,'Back must return to headlines');
 }
 const id=await page.evaluate(()=>TokiApps.active.id);
 check(await page.evaluate(()=>TokiApps.active.job.status==='needs_test'),'Did not preserve personal review gate');
 await page.setViewportSize({width:1280,height:800});
 await page.locator('#settings').click();await page.locator('#selection').click();await page.locator('#finish-settings').click();
 const target=page.locator('[data-app-action="read-news"]').first(),r=await target.boundingBox();await page.mouse.move(3,3);await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.waitForTimeout(1100);
 check(await page.locator('.news-list').count()===1,'Dwell activated in muscle mode');await page.keyboard.press('Space');await page.waitForTimeout(500);check(await page.locator('.news-reading').count()===1,'Muscle did not choose article');
 await page.keyboard.press('Space');await page.waitForTimeout(70);await page.keyboard.press('Space');await page.waitForTimeout(400);check(await page.locator('.news-list').count()===1,'Double muscle did not return to list');
 // Declared outage, then recovery, without leaving the accessible journey.
 await page.route('**/api/apps/biobio/actions/list',route=>route.fulfill({status:502,contentType:'application/json',body:JSON.stringify({error:'No se pudieron cargar las noticias.'})}));
 await page.reload();await page.waitForFunction(()=>TokiApps.active.online);await page.locator('[data-value="biobio"]').click();await click('open-adapter');await page.locator('[data-app-action="reload-news"]:not([disabled])').waitFor();
 check((await page.locator('.ta-feedback').innerText()).includes('No se pudieron'),'No visible recovery message');
 await page.unroute('**/api/apps/biobio/actions/list');await click('reload-news');await page.locator('[data-app-action="read-news"]').first().waitFor();
 // Acceptance is isolated to the team view; synthetic test declarations only.
 await page.goto(base+'/prototype-lobby.html?start=apps&appsAdmin=1');await page.waitForFunction(()=>TokiApps.active.online);await page.locator('[data-value="biobio"]').click();
 await page.locator('[data-app-action="functional"]').waitFor();await click('functional');check(await page.locator('[data-app-action="review"]').isDisabled(),'Personal review bypassed');await click('personal');await click('review');await page.waitForFunction(()=>TokiApps.active.job.status==='ready');
 await page.goto(base+'/prototype-lobby.html?start=apps');await page.waitForFunction(()=>TokiApps.active.online);await page.locator('[data-value="biobio"]').click();await page.locator('[data-app-action="read-news"]').first().waitFor();check(await page.evaluate(()=>TokiApps.active.id)===id,'Ready app lost persisted request');
 check(!errors.length,errors.join('\n'));
 return 'PASS: real-contract news fixture, preparation/list/reading/pagination/back, 3 viewport sizes without scroll, muscle/double-back, outage/retry, persisted review and ready launch. No actual patient acceptance performed.';
}
