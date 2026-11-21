window.addEventListener('load', () => {
  const section = document.createElement('section');
  section.id='s-apps'; section.className='screen'; section.dataset.title='Apps';
  section.innerHTML='<div class="status"></div><div id="appsContent"></div>';
  document.querySelector('#stage').append(section);
  document.querySelector('svg defs').insertAdjacentHTML('beforeend','<symbol id="i-appstore" viewBox="0 0 80 80"><rect x="10" y="10" width="24" height="24" rx="6"/><rect x="46" y="10" width="24" height="24" rx="6"/><rect x="10" y="46" width="24" height="24" rx="6"/><path d="M46 58h24M58 46v24"/></symbol>');
  const slot = TILES.findIndex(t=>t[0]==='music');
  if (slot>=0) TILES[slot]=['go:apps','g-green','i-appstore','Apps','Tu tienda de adaptaciones'];
  else TILES.push(['go:apps','g-green','i-appstore','Apps','Tu tienda de adaptaciones']);
  renderTiles();
  const root=document.querySelector('#appsContent');
  let app, latch=null, suspended=false;
  const baseGo=go;
  function unavailable() { return document.hidden || S.gazeLost || S.rest || !!S.alarm || document.querySelector('#calib').classList.contains('on'); }
  function targets() {
    if(!app)return;
    for(const el of root.querySelectorAll('[data-app-action]')) {
      const stop=el.dataset.appAction==='input-pause';
      if(el.disabled || unavailable() || (app.paused&&!stop)) el.removeAttribute('data-t');
      else el.setAttribute('data-t','');
    }
  }
  function mount() {
    app=TokiApps.mount(root,{motion:true,dwell:()=>CFG.dwellMs,home:()=>go('home'),beforePaint:()=>clearFocus(),afterPaint:()=>{decorate(root);targets();},input:async(action, instance)=>{
      if(action==='input-pause'){instance.paused=!instance.paused;instance.render();return;}
      if(action==='scroll-up'||action==='scroll-down'){root.scrollBy({top:action==='scroll-up'?-450:450,behavior:'instant'});clearFocus();return;}
      if(action==='input-calibrate'){CAL.open(NOSE.mode==='gaze'?'gaze':undefined);return;}
      const mode=action.slice(6);
      if(['nose','gaze','mouse'].includes(mode)) {
        instance.busy=true;instance.render();
        try{await NOSE.setMode(mode);}catch{instance.error='No se pudo activar la cámara. Puedes usar el mouse.';}
        finally{instance.busy=false;instance.render();renderStatus();}
      }
    }});
  }
  go=function(name){
    if(name==='apps' && S.screen!=='apps') mount();
    baseGo(name);
    if(name!=='apps'){app?.destroy();app=null;}
  };
  const baseActivate=activate;
  activate=function(el,calibrate=true){
    if(!el?.dataset.act?.startsWith('apps:'))return baseActivate(el,calibrate);
    if(!app||S.screen!=='apps'||el.disabled||unavailable()||(app.paused&&el.dataset.appAction!=='input-pause'))return;
    // Repainting must not select a different target under a stationary gaze.
    if(calibrate&&latch)return;
    latch=el.getBoundingClientRect();
    if(calibrate&&window.GAZE)GAZE.onConfirm(el);
    void app.act(el);
  };
  document.addEventListener('keydown',e=>{
    if(S.screen!=='apps'||!e.target.matches('input,textarea'))return;
    e.stopImmediatePropagation();
    if(e.key==='Escape'){e.preventDefault();go('home');}
    if(e.key==='Enter'&&e.target.id==='ta-query'){e.preventDefault();const b=root.querySelector('[data-app-action="search"]');if(b)void app.act(b);}
  },true);
  function loop(){
    if(app){
      if(latch&&(mouse.x<latch.left-8||mouse.x>latch.right+8||mouse.y<latch.top-8||mouse.y>latch.bottom+8))latch=null;
      const blocked=unavailable();
      if(blocked!==suspended){suspended=blocked;clearFocus();targets();}
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  if(new URLSearchParams(location.search).get('start')==='apps')go('apps');
});
