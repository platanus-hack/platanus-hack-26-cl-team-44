async page=>{
 const check=(c,m)=>{if(!c)throw Error(m);},base='http://127.0.0.1:8791';
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const token=(await(await page.request.get(base+'/api/session')).json()).token,headers={'x-toki-token':token,'Content-Type':'application/json'};
 // Names deliberately contain markup. Installed data must remain text in every screen.
 const name='Diario <em>de prueba</em>';
 const response=await page.request.post(base+'/api/jobs',{headers,data:{name,sourceUrl:'https://news.example.org/feed.xml',tasks:'Elegir titulares y leer extractos RSS.'}});
 check(response.ok(),'Could not start generation');
 await page.goto(base+'/prototype-lobby.html?start=apps');
 await page.waitForFunction(()=>TokiApps.active.adapters.some(a=>a.generated));
 check(await page.evaluate(()=>TokiApps.active.catalog.length)===6,'Generated app missing from catalog');
 check(await page.locator('.ta-pagination').count()===0,'Six services should share one page');
 const card=page.locator('.ta-app-card').filter({hasText:name});await card.click();
 await page.waitForFunction(()=>TokiApps.active.job?.status==='needs_test');
 check(await page.locator('#lobbyApps em').count()===0,'Markup executed in app name');
 await page.locator('[data-app-action="open-adapter"]').click();await page.locator('[data-app-action="read-news"]').first().waitFor();
 for(const size of [{width:1280,height:800},{width:1024,height:768},{width:390,height:844}]){
   await page.setViewportSize(size);
   for(const mode of ['list','reading']){
     if(mode==='reading'){await page.locator('[data-app-action="read-news"]').first().click();await page.locator('.news-reading').waitFor();}
     const faults=await page.locator('#lobbyApps').evaluate(root=>[root,root.querySelector('.ta-screen'),...root.querySelectorAll('button,.news-reading')].flatMap(el=>{const r=el.getBoundingClientRect();return el.scrollWidth>el.clientWidth+2||el.scrollHeight>el.clientHeight+2||r.bottom>innerHeight?[el.className]:[];}));
     check(!faults.length,mode+' '+size.width+': '+faults.join(','));
     check(await page.locator('#lobbyApps input,#lobbyApps textarea').count()===0,'Patient must not type');
     check((await page.locator('.ta-heading').innerText()).includes(name),'Wrong source shown');
     check(await page.locator('#lobbyApps em').count()===0,'Source markup not escaped');
   }
   await page.locator('[data-app-action="back"]').click();
 }
 check(await page.evaluate(()=>TokiApps.active.job.status)==='needs_test','Automated checks bypassed personal review');
 await page.locator('[data-app-action="store"]').click();
 await page.reload();await page.waitForFunction(()=>TokiApps.active.adapters.some(a=>a.generated));
 check(await page.locator('.ta-pagination').count()===0,'Six services should share one page');check(await page.locator('.ta-app-card').filter({hasText:name}).count()===1,'Installed app missing after reload');
 // A seventh service creates a second page without duplicating a tile.
 await page.route('**/api/adapters',async route=>{
   const response=await route.fetch(), manifest=await response.json();
   manifest.adapters.push({id:'overflow-reader',name:'Otro medio',generated:true,source:'https://example.org/rss'});
   await route.fulfill({json:manifest});
 });
 await page.reload();await page.waitForFunction(()=>TokiApps.active.catalog.length===7);
 check(await page.locator('.ta-app-card').count()===6,'First page capacity');
 await page.locator('[data-app-action="catalog-next"]').click();
 check(await page.locator('.ta-app-card').count()===1 && await page.locator('[data-value="overflow-reader"]').isVisible(),'Incorrect overflow page');
 await page.locator('[data-app-action="catalog-prev"]').click();
 check(await page.locator('.ta-app-card').filter({hasText:name}).count()===1,'Previous page lost a service');
 check(!errors.length,errors.join('\n'));
 return 'PASS: generated package appears without UI code, escaped labels, list/read at three sizes, no patient forms, review still pending, persists on reload.';
}
