async page => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const check=(c,m)=>{if(!c)throw Error(m);};
  const base='http://127.0.0.1:8791';
  const token=(await(await page.request.get(base+'/api/session')).json()).token;
  const headers={'x-toki-token':token,'Content-Type':'application/json'};
  const post=async(path,data={})=>{const r=await page.request.post(base+path,{headers,data});check(r.ok(),await r.text());return r.json();};
  const click=async a=>page.locator(`[data-app-action="${a}"]`).first().click();
  const preset=async id=>page.locator(`[data-app-action="preset"][data-value="${id}"]`).click();
  const layout=async label=>{
    const faults=await page.locator('#lobbyApps').evaluate(root=>{
      const bad=[];
      for(const el of [document.documentElement,root,root.querySelector('.ta-screen'),...root.querySelectorAll('button')]){
        const r=el.getBoundingClientRect();
        if(el.scrollWidth>el.clientWidth+2||el.scrollHeight>el.clientHeight+2)bad.push((el.className||el.tagName)+' overflows');
        if(el.tagName==='BUTTON'&&(r.bottom>innerHeight||r.left<0||r.right>innerWidth||r.height<55))bad.push(el.textContent+' outside/too small');
      }
      return bad;
    });check(!faults.length,label+': '+faults.join(', '));
    check(await page.locator('#lobbyApps input,#lobbyApps textarea').count()===0,label+': form in patient route');
  };
  const prior=(await(await page.request.get(base+'/api/jobs',{headers})).json()).jobs;
  for(const j of prior)await post(`/api/jobs/${j.id}/cancel`);
  await page.setViewportSize({width:1280,height:800});
  await page.goto(base+'/prototype-lobby.html?start=apps');
  await page.waitForFunction(()=>TokiApps.active.online);
  check(await page.locator('.ta-app-card').count()===5,'Expected the five built-in patient services');
  check(await page.locator('[data-value="whatsapp"],.ta-pagination').count()===0,'Unexpected WhatsApp card or pagination');await layout('catalog');
  await preset('rappi');await layout('request preview');await click('prepare');
  await page.waitForFunction(()=>TokiApps.active.job?.status==='needs_adapter');
  await layout('pending');check(!(await page.locator('#lobbyApps').innerText()).includes('github.com'),'Technical links in patient route');
  await click('cancel');await page.getByRole('button',{name:'Volver a preparar',exact:true}).waitFor();
  await page.reload();await page.waitForFunction(()=>TokiApps.active.online);
  check(await page.evaluate(()=>TokiApps.active.jobs.some(j=>j.name==='Rappi'&&j.status==='cancelled')),'Cancellation not persisted');
  await preset('spotify');
  await page.waitForFunction(()=>TokiApps.active.job?.status==='needs_connection' && TokiApps.active.playback?.item);
  await layout('local playback');
  check(await page.locator('[data-song]').innerText()==='Canción de prueba','Missing automatic track status');
  check(await page.locator('[data-app-action="connect"],[data-app-action="status"]').count()===0,'Manual synchronization in patient player');
  const transport=page.locator('[data-app-action="transport"]');
  await click('next');
  await transport.waitFor();
  await page.waitForFunction(()=>!TokiApps.active.busy);
  const jobId=await page.evaluate(()=>TokiApps.active.id);
  await post('/api/spotify/connect',{jobId,browser:'chrome'});
  await page.waitForFunction(()=>TokiApps.active.job?.status==='needs_test');
  await click('music');await layout('music choices');await click('music-search');
  await page.locator('[data-app-action="play-track"]:not([disabled])').waitFor();await layout('results');
  await click('play-track');await page.waitForFunction(()=>TokiApps.active.playback?.is_playing===true);await layout('playing');
  await click('transport');await page.waitForFunction(()=>TokiApps.active.playback?.is_playing===false);
  check(await page.evaluate(()=>TokiApps.active.job.status==='needs_test'),'Patient flow bypassed personal acceptance');
  check(await page.locator('[data-app-action="review"]').count()===0,'Review checklist in patient route');
  for(const size of [{width:1024,height:768},{width:390,height:844}]){
    await page.setViewportSize(size);await layout('player '+size.width);
    await click('music');await layout('music '+size.width);await click('music-search');await page.locator('[data-app-action="play-track"]:not([disabled])').waitFor();await layout('results '+size.width);
    await click('store');await layout('store '+size.width);
    await preset('youtube');await layout('detail '+size.width);await click('back');await preset('spotify');await page.waitForFunction(()=>!!TokiApps.active.playback);
  }
  await page.setViewportSize({width:1280,height:800});
  await page.getByRole('button',{name:'Servicios',exact:true}).click();
  await page.locator('#settings').click();await page.locator('#selection').click();await page.locator('#finish-settings').click();
  const aim=async selector=>{await page.mouse.move(5,5);await page.waitForTimeout(150);const r=await page.locator(selector).boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.waitForTimeout(100);};
  await aim('[data-app-action="preset"][data-value="youtube"]');await page.waitForTimeout(1100);
  check(await page.evaluate(()=>TokiApps.active.view==='store'),'Muscle mode activated by dwell');
  await page.keyboard.press('Space');await page.waitForTimeout(400);
  check(await page.evaluate(()=>TokiApps.active.view==='detail'),'Muscle click did not select');
  await page.waitForTimeout(1100);check(await page.evaluate(()=>TokiApps.active.view==='detail'),'Stationary gaze activated new screen');
  await page.keyboard.press('Space');await page.waitForTimeout(80);await page.keyboard.press('Space');await page.waitForTimeout(400);
  check(await page.evaluate(()=>TokiApps.active.view==='store'),'Double contraction did not go back within Apps');
  await aim('[data-app-action="preset"][data-value="youtube"]');await page.keyboard.down('Space');
  await page.mouse.move(5,5);await page.waitForTimeout(300);await page.keyboard.up('Space');await page.waitForTimeout(400);
  check(await page.evaluate(()=>TokiApps.active.view==='store'),'Selection survived pointer loss');
  await page.screenshot({path:'/tmp/toki-apps-new.png'});
  check(!errors.length,errors.join('\n'));
  return 'PASS: preset requests/persistence, honest pending states, Spotify synthetic search/play/pause, review gate, no patient forms or scroll at 1280/1024/390, shared muscle selection, no dwell/repeat activation, double-click back and pointer loss. Physical gaze/MyoWare and patient comfort remain untested.';
}
