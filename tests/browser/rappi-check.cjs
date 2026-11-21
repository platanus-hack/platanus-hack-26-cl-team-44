// Read-only live Chile check on the isolated pilot. Never adds to a real cart.
async page=>{
 const check=(value,message)=>{if(!value)throw Error(message);};
 await page.goto('http://127.0.0.1:8792/?start=apps');
 await page.waitForFunction(()=>window.TokiApps?.active?.online);
 await page.locator('[data-value="rappi"]').click();
 if(await page.locator('[data-app-action="prepare"]').count())await page.locator('[data-app-action="prepare"]').click();
 await page.waitForFunction(()=>TokiApps.active.job?.status==='needs_test');
 await page.locator('[data-app-action="open-adapter"]').click();
 await page.locator('[data-app-action="food-search"]').first().waitFor();
 for(const size of [{width:1280,height:800},{width:1024,height:768},{width:390,height:844}]){
  await page.setViewportSize(size);
  await page.locator('[data-app-action="food-search"][data-value="pizza"]').click();
  await page.locator('[data-app-action="food-store"]').first().waitFor();
  check(await page.locator('[data-app-action="food-store"]').count()<=3,'Too many restaurant targets');
  await page.locator('[data-app-action="food-store"]').first().click();
  await page.locator('[data-app-action="food-product"]').first().waitFor();
  await page.locator('[data-app-action="food-product"]:not([disabled])').first().click();
  await page.waitForFunction(()=>TokiApps.active.view==='food-product');
  if(await page.locator('[data-app-action="food-options"]').count()){
   await page.locator('[data-app-action="food-options"]').click();
   const overflow=await page.locator('#lobbyApps').evaluate(root=>[root.querySelector('.ta-screen'),...root.querySelectorAll('button')].flatMap(el=>{const r=el.getBoundingClientRect();return r.bottom>innerHeight+1||el.scrollHeight>el.clientHeight+2?[el.dataset.appAction||el.className]:[];}));
   check(!overflow.length,'Options overflow '+size.width+': '+overflow.join(','));
   await page.locator('[data-app-action="back"]').click();
   await page.locator('[data-app-action="food-product"]:not([disabled])').first().click();
   await page.waitForFunction(()=>TokiApps.active.view==='food-product');
  }
  const problems=await page.locator('#lobbyApps').evaluate(root=>[root,root.querySelector('.ta-screen'),...root.querySelectorAll('button')].flatMap(el=>{const r=el.getBoundingClientRect();return r.bottom>innerHeight+1||r.right>innerWidth+1||el.scrollHeight>el.clientHeight+2||el.scrollWidth>el.clientWidth+2?[el.dataset.appAction||el.className]:[];}));
  check(!problems.length,'Overflow '+size.width+': '+problems.join(','));
  check(await page.locator('#lobbyApps input,#lobbyApps textarea').count()===0,'Patient form found');
  await page.locator('[data-app-action="back"]').click();
  await page.locator('[data-app-action="back"]').click();
  await page.locator('[data-app-action="back"]').click();
  check(await page.evaluate(()=>TokiApps.active.view)==='food','Back path lost');
 }
 // Deliberate synthetic delay to check navigation recovery, not service evidence.
 await page.route('**/api/apps/rappi/actions/search',async route=>{await new Promise(r=>setTimeout(r,700));await route.fulfill({status:502,contentType:'application/json',body:JSON.stringify({error:'Error simulado de red'})});});
 await page.locator('[data-app-action="food-search"]').first().click();
 await page.locator('[data-app-action="store"]').click();await page.waitForTimeout(900);
 check(await page.evaluate(()=>TokiApps.active.view==='store'&&!TokiApps.active.busy),'Late query stole navigation');
 check(await page.locator('.ta-app-card:disabled').count()===0,'Navigation stayed disabled');
 await page.unroute('**/api/apps/rappi/actions/search');
 return 'PASS: live Chile search/products/selection; no real cart writes; three viewports; no forms; back navigation and late network recovery. Personal gaze/muscle trial still pending.';
}
