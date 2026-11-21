async page=>{
 const check=(condition,message)=>{if(!condition)throw Error(message);};
 await page.route('https://www.youtube.com/iframe_api',route=>route.fulfill({contentType:'text/javascript',body:`window.YT={Player:class{
 constructor(host,options){this.options=options;this.state=-1;this.host=host;this.id=options.videoId;this.frame=document.createElement('iframe');this.frame.title='YouTube fixture';host.replaceWith(this.frame);setTimeout(()=>options.events.onReady({target:this}),10);}
 getPlayerState(){return this.state;} getVideoData(){return {video_id:this.id};}
 playVideo(){if(window.failYouTube){this.options.events.onError({data:150});return;}this.state=1;this.options.events.onStateChange({data:1,target:this});}
 pauseVideo(){this.state=2;this.options.events.onStateChange({data:2,target:this});}
 destroy(){this.frame.remove();}
 }};window.onYouTubeIframeAPIReady();`}));
 const base='http://127.0.0.1:8791';await page.goto(base+'/prototype-lobby.html?start=apps');await page.setViewportSize({width:1280,height:800});
 await page.waitForFunction(()=>window.TokiApps?.active?.online);
 await page.locator('[data-value="youtube"]').click();if(await page.locator('[data-app-action="prepare"]').count())await page.locator('[data-app-action="prepare"]').click();
 await page.waitForFunction(()=>TokiApps.active.job?.status==='needs_test');await page.locator('[data-app-action="open-adapter"]').click();
 await page.locator('[data-app-action="choose-video"]').first().waitFor();check(await page.locator('[data-app-action="choose-video"]').count()===6,'Choice list');
 for(const size of [{width:1280,height:800},{width:1024,height:768},{width:390,height:844}]){
  await page.setViewportSize(size);
  check(await page.locator('.video-card img').count()===6,'Missing thumbnails');
  const last=await page.locator('.video-card').last().boundingBox();
  check(last.y+last.height<=size.height && last.width>=44 && last.height>=44,'Catalog fit '+size.width);
  await page.locator('[data-app-action="choose-video"]').first().click();
  const toggle=page.locator('[data-app-action="video-toggle"]');await toggle.waitFor();await page.waitForFunction(()=>!document.querySelector('[data-app-action="video-toggle"]').disabled);
  const before=await page.evaluate(()=>Object.keys(TokiApps.active.job.evidence));

  await toggle.click();await page.waitForFunction(()=>document.querySelector('.ta-video-status').textContent==='Reproduciendo');
  await page.locator('.ta-video-frame iframe').evaluate(el=>el.dataset.retained='yes');
  await page.waitForTimeout(2800);check(await page.locator('.ta-video-frame iframe').getAttribute('data-retained')==='yes','Sync recreated player');
  await toggle.click();await page.waitForFunction(()=>document.querySelector('.ta-video-status').textContent==='En pausa');
  const faults=await page.locator('#lobbyApps').evaluate(root=>[root,root.querySelector('.ta-screen'),...root.querySelectorAll('button,iframe')].flatMap(el=>{const r=el.getBoundingClientRect();return el.scrollWidth>el.clientWidth+2||el.scrollHeight>el.clientHeight+2||r.bottom>innerHeight?[el.className||el.tagName]:[];}));check(!faults.length,'Layout '+size.width+': '+faults.join(','));
  await page.locator('[data-app-action="back"]').click();check(await page.locator('.ta-video-frame iframe').count()===0,'Back left playback alive');
 }
 await page.waitForFunction(()=>TokiApps.active.job.evidence.play&&TokiApps.active.job.evidence.pause);
 check(await page.evaluate(()=>TokiApps.active.job.status)==='needs_test','Personal review bypassed');
 check(await page.locator('#lobbyApps input,#lobbyApps textarea').count()===0,'Patient typing required');
 // Simulate an unavailable embedded video and confirm native recovery navigation stays usable.
 await page.evaluate(()=>window.failYouTube=true);
 await page.locator('[data-app-action="choose-video"]').last().click();await page.waitForFunction(()=>document.querySelector('[data-app-action="video-toggle"]')?.disabled===false);
 await page.locator('[data-app-action="video-toggle"]').click();await page.waitForFunction(()=>document.querySelector('.ta-video-status').classList.contains('has-error'));
 await page.route('**/api/apps/youtube/actions/select',route=>route.fulfill({status:502,contentType:'application/json',body:JSON.stringify({error:'Prueba: conexión interrumpida.'})}));
 await page.locator('[data-app-action="retry-video"]').click();await page.waitForFunction(()=>document.querySelector('.ta-feedback').textContent.includes('conexión interrumpida'));
 await page.unroute('**/api/apps/youtube/actions/select');
 await page.evaluate(()=>window.failYouTube=false);await page.locator('[data-app-action="retry-video"]').click();await page.waitForFunction(()=>document.querySelector('[data-app-action="video-toggle"]')?.disabled===false);
 await page.locator('[data-app-action="video-toggle"]').click();await page.waitForFunction(()=>document.querySelector('.ta-video-status').textContent==='Reproduciendo');
 await page.locator('[data-app-action="store"]').click();check(await page.locator('.ta-app-card').count()>0,'No exit to services');check(await page.locator('.ta-video-frame iframe').count()===0,'Services left iframe alive');
 return 'PASS: synthetic official-player contract, choose/play/pause, stable iframe, three viewports, back/exit cleanup, no forms, personal acceptance pending.';
}
