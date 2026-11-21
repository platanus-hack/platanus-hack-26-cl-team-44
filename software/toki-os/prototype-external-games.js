window.addEventListener('load',()=>{
 const root='https://www.eyegazegames.com';
 const games=[
  {id:'eye_drive',name:'Eye Drive',image:'eyedrive',tag:'CARRERAS',desc:'Conduce un coche con controles accesibles.',route:'gamesource'},
  {id:'gazey_golf',name:'Gazey Golf',image:'gazeygolf',tag:'PUNTERÍA',desc:'Elige la dirección y prepara tu golpe.',route:'gamesource'},
  {id:'mole_miners',name:'Mole Miners',image:'moleminers',tag:'ARCADE',desc:'Un juego de bolas de colores.',route:'game'},
  {id:'open_drive',name:'Open Drive',image:'opendrive',tag:'EXPLORACIÓN · BETA',desc:'Explora conduciendo a tu ritmo.',route:'gamesource'},
  {id:'solitaire',name:'Solitario',image:'solitaire',tag:'CARTAS',desc:'Una partida individual de cartas.',route:'game'},
  {id:'sudoku',name:'Sudoku',image:'sudoku',tag:'LÓGICA',desc:'Resuelve el tablero a tu ritmo.',route:'game'}
 ];
 const params=new URLSearchParams(location.hash.slice(1));
 if(params.has('tokiBridge')){sessionStorage.setItem('toki.bridge.token',params.get('tokiBridge'));sessionStorage.setItem('toki.bridge.port',params.get('bridgePort'));history.replaceState(null,'',location.pathname+location.search);}
 const token=sessionStorage.getItem('toki.bridge.token'),port=sessionStorage.getItem('toki.bridge.port');
 let connected=false,inFlight=false,frame=null,paused=true,lastSend=0,anchor=null,didClick=false,autoClick=false,lastTracking=null;
 let launching=false, lastGame=null, lastPoint=null, pointerInGame=false, bridgeError=false;
 const managed=Boolean(token && /^\d+$/.test(port||''));
 if (tabletAccess && managed) autoClick=true;
 const b=(a,t)=>`<button class="t game-button" data-t data-dwell="1200" data-act="external:${a}">${t}</button>`;
 const oldGo=go,oldActivate=activate;
 async function request(path,data={}){
  if(!token||!/^\d+$/.test(port||''))throw Error('No local bridge');
  const r=await fetch(`http://127.0.0.1:${port}/${path}`,{method:'POST',headers:{'Content-Type':'application/json','X-Toki-Token':token},body:JSON.stringify(data),signal:AbortSignal.timeout(2000)});
  if(!r.ok)throw Error('Bridge disconnected');return r.json();
 }
 async function check(){
  if(managed) {
   try { await request('status'); connected=true;bridgeError=false; }
   catch { connected=false;bridgeError=true; }
  }
  updateStatus();
 }
 function controls(){if(tabletAccess||window.TOKI_OS_SHELL)return '<div class="external-controls"><span id="externalStatus" role="status"></span></div>';return `<div class="external-controls">${b('nose','Nariz')}${b('gaze','Mirada')}${b('calibrate','Calibrar')}${b('mouse','Mouse')}<span id="externalStatus"></span></div>`;}
 function updateStatus(){const e=document.querySelector('#externalStatus');if(!e)return;
  if(tabletAccess){const mode=tabletGameInput()?.mode || 'Mouse';e.textContent=launching?'Abriendo la partida…':frame && managed && !connected?(bridgeError?'Control desconectado. Elige Reintentar.':'Conectando el control del juego…'):'Control de Toki · '+mode;return;}
  e.textContent=connected?`Puente conectado · ${NOSE.label()}`:'Mouse disponible · Cámara: abrir sesión Toki';}
 addEventListener('toki-tablet-control',()=>{
  updateStatus();
  if (frame && lastGame && tabletGameInput()?.camera && !managed) open(lastGame);
 });
 addEventListener('toki-camera-change',()=>{if(!tabletAccess&&!NOSE.on&&frame)pause(true);updateStatus();});
 function render(html){clearFocus();document.querySelector('#gameContent').innerHTML=html;decorate(document.querySelector('#gameContent'));updateStatus();}
 function catalog(){
  frame=null;paused=true;pointerInGame=false;lastPoint=null;document.body.classList.remove('external-playing');
  render(`<div class="game-heading"><div><p class="game-eyebrow">SPECIALEFFECT · EYE GAZE GAMES</p><h1>Elige tu próxima partida.</h1></div>${b('help','Cómo jugar')}</div>${controls()}<div class="external-catalog">${games.map((g,i)=>`<button class="t external-card" data-t data-dwell="1200" data-act="external:play:${i}"><img src="${root}/images/game-tiles/${g.image}.png" alt=""><div><small>${g.tag}</small><strong>${g.name}</strong><span>${g.desc}</span></div></button>`).join('')}</div><div class="game-footer">${window.TOKI_OS_SHELL?b('toki','← Juegos'):''}${b('all','Todos los juegos')}${b('setup','Configurar Eye Gaze Games')}<p>Juegos originales de SpecialEffect. Sus ajustes y progreso se gestionan en su servicio.</p></div>`);
  check();
 }
 function help(){if(tabletAccess){render(`<div class="game-heading"><h1>Cómo jugar</h1>${b('catalog','← Juegos')}</div><p class="game-instruction">Elige un juego con el control de Toki. En la primera partida, Eye Gaze Games te pedirá el idioma y el perfil. Puedes cambiar tu forma de apuntar en Ajustes.</p>`);return;}render(`<div class="game-heading"><h1>Juegos originales, dentro de Toki.</h1>${b('catalog','← Juegos')}</div><div class="game-external"><p>1. Entra en «Configurar Eye Gaze Games»: elige español y crea tu perfil del servicio.</p><p>2. Usa Mouse, o abre la sesión Toki para que la mirada y la nariz controlen también el juego.</p><p>3. «Clic por permanencia» sirve para los menús. Si activas el control ocular propio del juego, apágalo para evitar dos confirmaciones.</p><p class="game-note">Para abrir la sesión con cámara, ejecuta en el proyecto:</p><code>node toki/software/browser-bridge/start.mjs</code><p class="game-note">La cámara se calibra en Toki. El juego puede necesitar además su propia configuración. El leaderboard compartido de Toki aún no está implementado.</p></div>`);}
 function open(game) {
  const g=games.find(item=>item.id===game);
  if (!g && !['setup','all'].includes(game)) return;
  lastGame=game;
  if (tabletGameInput()?.camera && !managed) {
   if (launching) return;
   launching=true;updateStatus();
   tabletAccess.openGameWindow(game).then(()=>{
    if(S.screen==='games') catalog();
   }).catch(()=>{
    if(S.screen==='games') render(`<div class="game-heading"><h1>No se pudo abrir la partida</h1></div><p class="game-instruction">Comprueba que Chrome y el servidor local de Toki estén disponibles.</p><div class="game-inputs">${b('retry','Reintentar')}${b('catalog','Elegir otro juego')}</div>`);
   }).finally(()=>{launching=false;updateStatus();});
   return;
  }
  if (g) play(`${root}/${g.route}?id=${g.id}`,g.name);
  else play(root+'/carousel',game==='all'?'Eye Gaze Games':'Configurar juegos');
 }
 function play(url,title){
  document.body.classList.add('external-playing');paused=false;anchor=null;didClick=false;lastPoint=null;lastTracking=null;pointerInGame=false;
  if(window.TOKI_OS_SHELL){
   // Prioridad: el juego. Barra de una fila; pausar y clic extra solo existen con el puente de control.
   render(`<div class="external-toolbar">${b('catalog','← Juegos')}<div class="external-title"><strong>${title}</strong><small>Primera vez: toca la bandera de España y luego «Crear usuario».</small></div>${b('reload','Reintentar')}${managed?b('pause','Pausar control')+b('clicks',`Clic extra: ${autoClick?'sí':'no'}`):''}</div><div class="external-frame-wrap"><iframe id="externalGame" title="${title} · SpecialEffect" src="${url}" allow="autoplay; fullscreen; gamepad" referrerpolicy="strict-origin-when-cross-origin"></iframe><div id="externalCurtain" hidden><h2>Control en pausa</h2><p>El juego sigue abierto. Usa su menú para pausar la partida.</p></div></div>`);
   frame=document.querySelector('#externalGame');check();return;
  }
  render(`<div class="external-toolbar">${b('catalog','← Juegos')}<strong>${title}</strong>${b('pause','Pausar control')}${b('clicks',`Clic extra: ${autoClick?'sí':'no'}`)}${b('help','Ayuda')}</div>${controls()}<div class="external-frame-wrap"><iframe id="externalGame" title="${title} · SpecialEffect" src="${url}" allow="autoplay; fullscreen; gamepad" referrerpolicy="strict-origin-when-cross-origin"></iframe><div id="externalCurtain" hidden><h2>Control en pausa</h2><p>El juego sigue abierto. Usa su menú para pausar la partida.</p></div></div><p class="game-note">Si aparece la bienvenida, configura tu perfil y luego elige el juego. Si no carga, ${b('reload','Reintentar')} ${b('all','Abrir catálogo')}</p>`);
  frame=document.querySelector('#externalGame');
  check();
 }
 function pause(value){paused=value;anchor=null;document.querySelector('#externalCurtain')?.toggleAttribute('hidden',!paused);const e=document.querySelector('[data-act="external:pause"]');if(e)e.firstChild.textContent=paused?'Continuar control':'Pausar control';}
 go=function(name){if(S.screen==='games'){frame=null;paused=true;document.body.classList.remove('external-playing');}oldGo(name);if(name==='games'&&!window.TOKI_OS_SHELL)catalog();};
 activate=function(el,calibrate=true){
  if(!el?.dataset.act?.startsWith('external:'))return oldActivate(el,calibrate);
  const [,act,arg]=el.dataset.act.split(':');
  if(act==='catalog')return catalog();
  if(act==='toki')return window.TOKI_GAMES?.lobby();
  if(act==='play'){const g=games[Number(arg)];if(g)return open(g.id);}
  if(act==='all'||act==='setup')return open(act);
  if(act==='retry')return open(lastGame);
  if(act==='help'){frame=null;paused=true;document.body.classList.remove('external-playing');return help();}
  if(act==='pause')return pause(!paused);
  if(act==='clicks'){autoClick=!autoClick;el.firstChild.textContent=`Clic extra: ${autoClick?'sí':'no'}`;anchor=null;return;}
  if(act==='reload'&&frame){frame.src=frame.src;void check().then(()=>{if(connected)pause(false);});return;}
  if(act==='calibrate'){pause(true);CAL.open(NOSE.mode==='gaze'?'gaze':undefined);return;}
  if(['nose','gaze','mouse'].includes(act)){NOSE.setMode(act).then(updateStatus);return;}
 };
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&frame)pause(true);});
 async function tickExternal(now){
  requestAnimationFrame(tickExternal);
  if(!frame||S.screen!=='games')return;
  const shared=tabletGameInput();
  const tracking=shared ? shared.camera && !shared.blocked && Boolean(shared.point) :
    NOSE.on && !S.gazeLost && NOSE.raw && now-NOSE.lastFace<240 && (NOSE.mode!=='gaze' || (GAZE.cur && !GAZE.cur.blink));
  const cameraPresent=NOSE.on && !S.gazeLost;
  if(!shared && lastTracking===true && !cameraPresent) pause(true);
  lastTracking=cameraPresent;
  if(S.rest||S.alarm||document.querySelector('#calib').classList.contains('on')) pause(true);
  if(!connected || inFlight || now-lastSend<40) return;
  const r=frame.getBoundingClientRect(), point=shared?.point || gz;
  const inside=tracking && !paused && !document.hidden && point.x>=r.left && point.x<r.right && point.y>=r.top && point.y<r.bottom;
  let x=point.topX ?? point.x, y=point.topY ?? point.y;
  let type='move';
  if (!inside) {
   anchor=null; didClick=false; lastPoint=null;
   if (!pointerInGame) return;
   // Leave the external surface so its own hover timer also stops.
   const host=window.frameElement?.getBoundingClientRect();
   x=(host?.left || 0)+r.left; y=(host?.top || 0)+Math.max(0,r.top-4);
   pointerInGame=false;
  } else {
   if(!anchor || Math.hypot(x-anchor.x,y-anchor.y)>28){anchor={x,y,t:now};didClick=false;}
   if(autoClick && !shared?.muscle && !didClick && now-anchor.t >= (shared?.dwellMs || 1200)){type='click';didClick=true;}
   if(type==='move' && lastPoint && Math.hypot(x-lastPoint.x,y-lastPoint.y)<.7) return;
   lastPoint={x,y};pointerInGame=true;
  }
  inFlight=true;lastSend=now;
  try{await request('input',{x,y,type});}catch{connected=false;bridgeError=true;pause(true);updateStatus();}finally{inFlight=false;}
 }
 requestAnimationFrame(tickExternal);
 function switchTarget() {
  const input=tabletGameInput();
  if (!input || input.blocked || (input.camera && !input.point)) return null;
  const p=input.point || gz;
  const hit=document.elementFromPoint(p.x,p.y);
  if(frame && hit===frame && connected && !paused && input.point) return frame;
  const target=hit?.closest('[data-t]');
  return target && target===S.focus ? target : null;
 }
 function confirmSwitch(target) {
  if(!target || switchTarget()!==target) return;
  if(target===frame) {
   const {topX:x,topY:y}=tabletGameInput().point;
   void request('input',{x,y,type:'click'}).catch(()=>{connected=false;pause(true);updateStatus();});
  } else activate(target);
 }
 window.TOKI_EXTERNAL={check,open,catalog,switchTarget,confirmSwitch,get connected(){return connected;}};
});
