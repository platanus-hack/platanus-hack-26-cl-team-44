/* ===================== Configuración ===================== */
const trackerOnly = new URLSearchParams(location.search).has('controlGlobal');
const tabletComposer = new URLSearchParams(location.search).get('entrada') === 'teclado';
const requestedMethod = trackerOnly ? new URLSearchParams(location.search).get('metodo') : null;
const guidedSetup = requestedMethod === 'gaze' || requestedMethod === 'nose';
const DWELL_OPTIONS = [800,1000,1200,1500];
// Tres formas de abrir la TV. El token nunca va en una URL.
// · Escenario: la sirve el monitor MyoWare (127.0.0.1:8766). El monitor lee TOKI_REMOTO y TOKI_WA_TOKEN del entorno
//   y los entrega en toki-config.js (window.TOKI_ENV). WhatsApp y agente son los de la VPS; el token va en un header.
// · Equipo: https://<dominio>/equipo/ pide usuario y contraseña (Caddy) y Caddy agrega el token por dentro.
// · Público (jueces): https://<dominio>/ con WhatsApp simulado y sin datos de la usuaria.
// · Desarrollo: localhost con el puente local (8788).
const LOCAL = ['localhost','127.0.0.1'].includes(location.hostname);
const EQUIPO = !LOCAL && location.pathname.startsWith('/equipo/');
const REMOTO = LOCAL ? ((window.TOKI_ENV||{}).remoto || '') : '';
const WA_TOKEN = REMOTO ? ((window.TOKI_ENV||{}).waToken || '') : '';
try{ localStorage.removeItem('woki_wa_token'); localStorage.removeItem('woki_remoto'); }catch(_){}   // restos de la versión con ?wa_token=
const CFG = {
  // Default dwell time for modes that support dwell selection.
  // la elección en Ajustes se recuerda en el navegador
  dwellMs: (()=>{ try{ const v=+localStorage.getItem('woki.dwell'); return DWELL_OPTIONS.includes(v)? v : 1200; }catch(_){ return 1200; } })(),
  settleMs: 350,         // la mirada se asienta antes de aceptar el clic
  emoDwellMs: 1200,      // sostener la mirada en el emoji abre el anillo (sigue al tiempo de mirada)
  mode: 'click',         // 'click' = mirada + ceja · 'dwell' = solo mirada
  jitter: false,         // simular error de webcam
  scanMs: 1300,          // escaneo cuando no hay mirada
  faceBrowMaxMs: 900,
  SUGGEST_URL: '',       // endpoint opcional: POST {context} → {suggestions:[{text,tone,emo}]}
  EMG_WS: LOCAL ? 'ws://localhost:8765' : '', // puente EMG opcional: {"src":"ceja|mandibula","edge":"down|up"}
  WA_URL: REMOTO ? REMOTO+'/wa' : EQUIPO ? location.origin+'/equipo/wa' : LOCAL ? 'http://localhost:8788' : '', // woki-bridge (WhatsApp vía wapi). '' = mensajes simulados
  AGENTE_URL: REMOTO ? REMOTO+'/agente' : EQUIPO ? location.origin+'/equipo/agente' : '',   // modo dev: agente de la VPS en vez del local
  WA_TOKEN,              // header X-Myo-Token hacia el puente (también lo usa woki-voz.js)
  EXPAND_URL: '',        // opcional (otro servicio): POST {initials, context, contactId} → {suggestions:[{text,tone,emo}]}
  WA_AI: true,           // en un chat, el puente pide respuestas y predicción por iniciales a Claude (/api/wa/suggest)
  magnet: true,          // imán: si la mirada cae en un hueco, el foco va al objetivo más probable cercano (tecla I)
  magnetR: .09,          // radio de captura: 9 % del lado menor de la pantalla (~3° de ángulo visual en la TV)
  magnetPull: .3         // cuánto se acerca el cursor visible al centro del objetivo (débil: la gente lo prefiere así)
};
CFG.emoDwellMs=CFG.dwellMs;
// Nombre de la usuaria: viene de la memoria del agente (/api/salud), no del código. Sin agente, los textos quedan neutros.
let USUARIA='';
if(CFG.AGENTE_URL) fetch(CFG.AGENTE_URL+'/api/salud',{headers:WA_TOKEN?{'X-Myo-Token':WA_TOKEN}:{}}).then(r=>r.ok?r.json():{}).then(j=>{
  USUARIA=j.usuaria||''; const t=document.getElementById('typingWho'); if(t && USUARIA) t.textContent=USUARIA+' está escribiendo';
}).catch(()=>{});   // el emoji usa el mismo tiempo de mirada que el resto
// Sugerencias del teclado: 'fila' = 3 fijas arriba a 1 mirada (más rápido, tarjetas de ~4 cm de alto)
// · 'lista' = una tecla que abre la lista (2 miradas, tarjetas más grandes). Ajustes › Teclado.
CFG.sugMode=(()=>{ try{ return localStorage.getItem('woki.sugmode')==='lista'? 'lista' : 'fila'; }catch(_){ return 'fila'; } })();

/* ===================== Datos ===================== */
const TILES = [
  ['go:talk','g-blue','i-chat','Hablar','Respuestas sugeridas'],
  ['go:keyboard','g-indigo','i-keys','Escribir','Teclado por grupos'],
  ['go:contacts','g-green','i-send','Mensajes','WhatsApp a los tuyos'],
  ['sos','g-red','i-alert','SOS','Pedir ayuda ya',2000],   // mirada 2 s: que no se active sin querer
  ['go:apps','g-white','i-apps','Apps','Música, compras y noticias'],
  ['go:games','g-white','i-gamepad','Juegos','Eye Gaze Games'],
  ['rest','g-purple','i-moon','Descansar','Pausa la mirada'],
  ['go:settings','g-gray','i-gear','Ajustes','Tiempo, voz, modo']];
const EMOS = [
  {id:'ironica',e:'😏',n:'irónica',  rate:.95,pitch:1.05,vol:1},
  {id:'alegre', e:'😄',n:'alegre',   rate:1.08,pitch:1.2,vol:1},
  {id:'carinosa',e:'🥰',n:'cariñosa',rate:.9, pitch:1.12,vol:.95},
  {id:'susurro',e:'🤫',n:'susurro',  rate:.88,pitch:1,  vol:.45},
  {id:'seria',  e:'😐',n:'seria',    rate:.95,pitch:.9, vol:1},
  {id:'entusiasta',e:'🤩',n:'entusiasta',rate:1.18,pitch:1.3,vol:1}];
const EMO = Object.fromEntries(EMOS.map(e=>[e.id,e]));
// Frases locales (sin internet). Cada tema tiene 4 POSICIONES con una intención fija —el "sí"
// siempre en el mismo lugar, el "no" siempre en el suyo— y varias formas de decir esa intención.
// Cada vez que se abre Hablar sale otra forma, sin repetir la de la vez anterior.
// Así las tarjetas varían pero Emmy no tiene que volver a buscar dónde está cada respuesta.
const RULES = [
  {k:/cena|comer|almuerz|domingo|once/i, s:[
    [['¡Obvio! Guárdame del postre de la abuela.','cariñosa','carinosa'],['¡Claro que voy! Me encanta cenar con ustedes.','cariñosa','carinosa'],['¡Sí! Ya me estaba haciendo falta verlos.','cariñosa','alegre']],
    [['Sí, llego a las 8.','breve','seria'],['Dale, ahí estaré.','breve','alegre'],['Cuenta conmigo.','breve','seria']],
    [['Si cocina tu papá, lo pienso.','con humor','ironica'],['Voy, pero yo no lavo los platos.','con humor','ironica'],['¿Hay postre? Entonces sí.','con humor','alegre']],
    [['Este domingo no puedo, ¿el próximo?','neutra','seria'],['Hoy estoy cansada, ¿lo dejamos para otro día?','honesta','seria'],['Mejor vengan ustedes a la casa.','propuesta','carinosa']]]},
  {k:/c[oó]mo est[aá]s|c[oó]mo te sientes|qu[eé] tal/i, s:[
    [['Bien, con ganas de verte.','cariñosa','carinosa'],['Feliz de que estés aquí.','cariñosa','carinosa'],['Mejor ahora que llegaste.','cariñosa','carinosa']],
    [['Cansada, pero contenta de que vinieras.','honesta','seria'],['Más o menos, hoy fue un día largo.','honesta','seria'],['Tranquila, sin novedad.','breve','seria']],
    [['Mejor que tu equipo de fútbol.','con humor','ironica'],['Divina, como siempre.','con humor','ironica'],['Lista para una maratón… de series.','con humor','alegre']],
    [['Un poco adolorida hoy.','breve','seria'],['Me duele la espalda, pero bien.','honesta','seria'],['Con sueño, dormí mal.','breve','seria']]]},
  {k:/duele|dolor|molest/i, s:[
    [['Sí, me duele la espalda.','directa','seria'],['Sí, me duelen las piernas.','directa','seria'],['Sí, me duele el cuello.','directa','seria']],
    [['Un poco, ¿me cambias de posición?','pedido','seria'],['¿Me acomodas la almohada?','pedido','seria'],['¿Me subes un poco la cama?','pedido','seria']],
    [['No, estoy bien, tranquila.','calma','carinosa'],['Ya se me pasó, gracias.','calma','carinosa'],['Nada grave, no te preocupes.','calma','carinosa']],
    [['Me duele la cabeza, ¿me das algo?','pedido','seria'],['¿Me toca el remedio?','pedido','seria'],['Llama a la enfermera, porfa.','pedido','seria']]]},
  {k:/fr[ií]o|calor|tapo|ventana/i, s:[
    [['Tengo frío, ¿me tapas?','pedido','carinosa'],['¿Me pasas la manta?','pedido','carinosa'],['Tengo los pies helados.','pedido','seria']],
    [['Abre la ventana, porfa.','pedido','seria'],['¿Me prendes el ventilador?','pedido','seria'],['Sácame una frazada, porfa.','pedido','seria']],
    [['Estoy perfecta así.','breve','alegre'],['Así está bien, gracias.','breve','seria'],['No cambies nada, estoy cómoda.','breve','alegre']],
    [['Hace un calor de infierno.','con humor','ironica'],['Parece que vivo en el Polo Norte.','con humor','ironica'],['¿Quién apagó el sol?','con humor','ironica']]]},
  {k:/agua|sed|tomar|caf[eé]/i, s:[
    [['Sí, agua por favor.','breve','seria'],['Agua fresca, porfa.','breve','seria'],['Un vaso de agua, gracias.','breve','seria']],
    [['Un café, si hay.','pedido','alegre'],['Un té con limón.','pedido','alegre'],['Un jugo, porfa.','pedido','alegre']],
    [['No, gracias.','breve','seria'],['Ahora no, después.','breve','seria'],['Estoy bien así.','breve','seria']],
    [['Una cerveza, pero no le digas al doctor.','con humor','ironica'],['Un pisco sour, por si cuela.','con humor','ironica'],['Champaña, que hoy celebramos.','con humor','alegre']]]}];
const DEFAULT = [
  [['Sí, claro.','breve','seria'],['Obvio.','breve','alegre'],['Me parece bien.','breve','seria']],
  [['Cuéntame más.','interés','alegre'],['¿Y qué pasó después?','interés','alegre'],['No te creo, ¿en serio?','interés','entusiasta']],
  [['Dame un segundo, lo estoy pensando.','pausa','seria'],['Espera, que estoy escribiendo.','pausa','seria'],['Déjame pensarlo.','pausa','seria']],
  [['Jajaja, no puedo contigo.','con humor','alegre'],['Te pasaste, jajaja.','con humor','alegre'],['Eres un caso perdido.','con humor','ironica']]];
// Elige una forma por posición: nunca la misma de la vez anterior, y un poco más seguido las que Emmy ya usa (su estilo).
const LAST_PICK = {};
function pickVariants(key, slots){
  const usos = t => (MEM.m.phrases||[]).filter(p=>p.t===t).length;
  return slots.map((vars,i)=>{
    const k=key+':'+i, pool = vars.length>1 ? vars.filter(v=>v[0]!==LAST_PICK[k]) : vars;
    const pesos = pool.map(v=>1+Math.min(2,usos(v[0])));
    let r = Math.random()*pesos.reduce((a,b)=>a+b,0), elegida = pool[0];
    for(let n=0;n<pool.length;n++){ r-=pesos[n]; if(r<=0){ elegida=pool[n]; break; } }
    LAST_PICK[k]=elegida[0]; return elegida; });
}
const REACTS = [
  ['😂','jajaja','alegre'],['😱','¡no!','entusiasta'],['🤔','mmm…','seria'],['❤️','te quiero','carinosa'],
  ['🙄','¿en serio?','ironica'],['✋','espera','seria'],['😋','¡qué rico!','alegre'],['👍','dale','alegre']];
const GROUPS = ['ABCDE','FGHIJ','KLMNÑ','OPQRS','TUVWXYZ'];
const REACT_PAGE = 4; // reacciones por página (3×2 con Más y Volver)
const WORDS = ('que de no a la el es y en lo un por me una te los se con para mi está si pero las bien sí más ya muy hola gracias quiero puedo hoy mañana domingo cena casa ahora después tengo frío calor agua dolor espalda cabeza posición ayuda cansada contenta mamá hija hijo nieto sofía camila amor también nunca siempre llámame ven espera favor porfa listo bueno vale dale claro obvio todo nada algo mucho poco feliz triste rico tele música película dormir comer baño luz ventana').split(' ');

/* ===================== Estado ===================== */
const S = { screen:'home', focus:null, fStart:0, blocked:null, armed:false,
  gazeLost:false, scanIdx:-1, scanT:0, rest:false, emoRingFor:null,
  cards:[], kb:{level:1,group:null,text:''}, reactPage:0,
  alarm:null, agentPending:0, agentIdle:0, muted:false, voiceIdx:0, voices:[], scale:1 };
const $ = s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function iphonePointing(){ return document.body.classList.contains('iphone-pointer'); }
function iphoneDwell(){ return iphonePointing() && CFG.mode==='dwell'; }
let myowareConfirm = false;
function myowareConfirming(){ return myowareConfirm && !iphonePointing(); }
function setMyoWareConfirmation(on){
  myowareConfirm = on;
  document.body.classList.toggle('myoware-confirm',on);
  if(on) CFG.mode='click';
  restDwell.reset();
  $$('#rest [data-t]').forEach(el=>el.style.setProperty('--p',0));
  menuDwell.reset();
  menuOutline.clear();
}
const SNAP_PX = 70;   // la mirada en el hueco entre tarjetas toma la más cercana (px del lienzo)
const MAGNET = .35;   // el cursor se acerca al centro de la tarjeta enfocada (como en la demo)
// Tras elegir algo, nada empieza a cargarse durante este tiempo: si aparece otra pantalla o capa,
// la tarjeta que queda bajo la mirada no se elige "en cadena" (la demo usaba 500 ms).
const LOCKOUT_MS = 700;
const CEJA_FALLBACK_MS = 3000; // Optional dwell fallback for games without a MyoWare switch.
window.iphoneConfirm = () => { try{ return localStorage.getItem('woki.iphone.confirm')==='dwell' ? 'dwell' : 'click'; }catch(_){ return 'click'; } };

/* ===================== Tema y panel de atajos (desarrollo) ===================== */
const store={ get:k=>{ try{ return localStorage.getItem(k); }catch(_){ return null; } }, set:(k,v)=>{ try{ localStorage.setItem(k,v); }catch(_){} } };
// El panel recuerda la preferencia del acompañante en el SO oficial.
document.body.classList.toggle('official-os', !tabletComposer && !trackerOnly);
document.body.classList.toggle('legend-off', tabletComposer || trackerOnly || store.get('woki.legend')==='off');
function syncDevbar(){
  const light=document.documentElement.dataset.theme==='light', open=!document.body.classList.contains('legend-off');
  $('#themeToggle').setAttribute('aria-checked',String(light));
  $('#legendToggle').setAttribute('aria-expanded',String(open));
  $('#legendToggle').title=open?'Ocultar controles':'Mostrar controles';
}
function setTheme(light){ if(light) document.documentElement.dataset.theme='light'; else delete document.documentElement.dataset.theme;
  store.set('woki.theme',light?'light':'dark'); syncDevbar(); }
function toggleLegend(){ const open=document.body.classList.toggle('legend-off'); store.set('woki.legend',open?'off':'on'); syncDevbar(); fit(); }
$('#themeToggle').addEventListener('click',e=>{ e.currentTarget.blur(); setTheme(document.documentElement.dataset.theme!=='light'); });  // blur: Espacio = ceja
$('#legendToggle').addEventListener('click',e=>{ e.currentTarget.blur(); toggleLegend(); });
syncDevbar();

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const {
  WA, waSetPool, waPage, waAiReplies, iniAsk, iniCandidates, markLikelyKeys, kbIni, kbExpand, waLoadFavs,
  renderPeople, setCtx, waStart, waReset, openAgent, waSend, waListen, openPanel, closePanel,
} = createMyoMessaging({
  $, $$, S, CFG, esc, EMO, RULES, DEFAULT, REACTS, GROUPS, WORDS, pickVariants,
  getMemory: () => MEM, go: (...args) => go(...args), renderCards, renderStatus,
  renderKbText: () => renderKbText(),
  stagger, decorate, log, beep: (...args) => beep(...args), island, clearFocus,
});
let roomInitials;
function requestInitials() {
  return roomInitials?.isActive() ? roomInitials.ask() : iniAsk();
}
function expandInitials() {
  return roomInitials?.isActive() ? roomInitials.expand() : kbExpand();
}

/* ===================== Escalado de la TV ===================== */
// Con los atajos visibles se reserva su altura; ocultos, solo una franja para la barra de desarrollo.
function gameFillsWindow(){
  return document.body.matches('.official-os.external-playing:not(.panel)') &&
    !document.querySelector('#rest.on, #calib.on, #alarm.on');
}
function fit(){
  const immersive=gameFillsWindow();
  document.body.classList.toggle('game-immersive',immersive);
  const reserve=tabletComposer ? 16 : document.body.classList.contains('legend-off') ? 60 : $('#legend').offsetHeight + 48;
  const s=immersive ? 1 : Math.min((innerWidth-16)/1920,(innerHeight-reserve)/1080);
  S.scale=s;
  const w=$('#wrap'); w.style.transform=immersive ? 'none' : `scale(${s})`;
  w.style.left=immersive ? '0px' : ((innerWidth-1920*s)/2)+'px';
}
// Rest and calibration use the same stage and scale as the rest of the OS.
const gameLayoutObserver=new MutationObserver(()=>{
  if(document.body.classList.contains('game-immersive')!==gameFillsWindow()) fit();
});
for(const el of [document.body,$('#rest'),$('#calib'),$('#alarm')]){
  gameLayoutObserver.observe(el,{attributes:true,attributeFilter:['class']});
}
addEventListener('resize',fit); fit();

/* ===================== Plantillas ===================== */
const RING = '<svg class="ring" viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="25"/><circle class="fg" cx="32" cy="32" r="25"/></svg>';
function decorate(root){ (root||document).querySelectorAll('[data-t]').forEach(el=>{
  if(!el.querySelector(':scope > .ring')) el.insertAdjacentHTML('beforeend', RING + (el.classList.contains('emo')?'':'<span class="badge" aria-hidden="true">'+(el.classList.contains('tile')?'Listo':'Listo · ceja o clic')+'</span>')); }); }
function stagger(container){ [...container.children].forEach((c,i)=>{ c.classList.add('stag'); c.style.setProperty('--i',i); }); }
function renderTiles(){ $('#tiles').innerHTML=TILES.map(([act,g,ic,lb,sb,dw])=>
  `<button type="button" class="t tile" data-t data-act="${act}"${dw?` data-dwell="${dw}"`:''}><span class="app ${g}" aria-hidden="true"><svg><use href="#${ic}"/></svg></span><span class="lb">${lb}</span><span class="sb">${sb}</span></button>`).join('');
  stagger($('#tiles')); decorate($('#tiles')); }
function sendBtn(pending){ $('#btnSend').classList.toggle('pending',!!pending);
  $('#btnSend').innerHTML = pending ? '<svg><use href="#i-check"/></svg>Otra ceja<small>para enviar · 3 s</small>' : '<svg><use href="#i-check"/></svg>Enviar<small>Ceja, y otra ceja en 3 s</small>';
  decorate($('#btnSend').parentElement); }

/* ===================== Barra de estado ===================== */
function initStatus(bar){
  const screen=bar.closest('.screen');
  const home=screen.id==='s-home' ? '' : '<button type="button" class="t nav-action home-nav" data-t data-act="go:home">‹ Inicio</button>';
  const back=screen.id==='s-home' ? '' : '<button type="button" class="t nav-action back-nav" data-t data-act="back">‹ Volver</button>';
  bar.innerHTML=home+back+`<span class="screen-name">${esc(screen.dataset.title)}</span>
    <time class="clock"></time>`;
  const actions=`<button type="button" class="t nav-action sos-nav" data-t data-act="sos" data-dwell="2000" aria-controls="alarm"><svg class="nav-icon" aria-hidden="true"><use href="#i-alert"/></svg>SOS</button>
    <button type="button" class="t nav-action rest-nav" data-t data-act="rest" aria-controls="rest"><svg class="nav-icon" aria-hidden="true"><use href="#i-moon"/></svg>Descansar</button>`;
  if(document.body.classList.contains('official-os')){
    // SOS y Descansar son tarjetas grandes de Inicio (TILES). Para volver a Inicio: "‹ Inicio" arriba
    // (y el botón deslizable homeDock, desactivado por ahora). Nada fijo abajo en ninguna vista.
    return;
  }else{
    bar.insertAdjacentHTML('beforeend',actions);
  }
}
const emgChannels=new Set();
function statusGroup(label,value,hint=''){
  return `<div class="status-group"${hint?` title="${esc(hint)}"`:''}><span class="status-key">${label}</span><span class="status-reading">${value}</span></div>`;
}
function statusSignal(label,state){
  return `<span class="status-signal" data-state="${state}">${label}</span>`;
}
function renderStatus(){
  const time=new Date().toTimeString().slice(0,5);
  const bar=$('.screen.on .status');
  if(!bar) return;
  if(!bar.firstElementChild) initStatus(bar);
  const clock=bar.querySelector('.clock');
  if(clock.textContent!==time) clock.textContent=time;
  if($('#restClock').textContent!==time) $('#restClock').textContent=time;
  if($('#diagnostics').open && !document.body.classList.contains('legend-off')) renderDiagnostics();
}
$('#diagnostics').addEventListener('toggle',()=>{ if($('#diagnostics').open) renderDiagnostics(); });
function renderDiagnostics(){
  const nose=window.NOSE, phone=window.IPHONE, state=$('#cameraStatus').dataset.state;
  const device=pointerLabel();
  const tracking=phone?.active ? phone.latest?.tracked && performance.now()-phone.lastFaceAt<400 : nose?.on && state==='found';
  let pointer=device, signal=tracking?'on':'off';
  if(S.gazeLost){ pointer='Escaneo'; signal='wait'; }
  else if(state==='starting' && !phone?.active){ pointer='Activando cámara'; signal='wait'; }
  else if((phone?.active || nose?.on) && !tracking){ pointer='Buscando rostro'; signal='wait'; }
  const selection=myowareConfirming() ? 'MyoWare · ceja' : CFG.mode==='click' ? 'Confirmar con la ceja' : 'Mantener el puntero '+(CFG.dwellMs/1000).toLocaleString('es')+' s para elegir';
  const cameraLabel=tracking ? 'Rostro detectado' : state==='error' && !phone?.active ? 'Cámara no disponible' : !nose?.on && !phone?.active && state!=='starting' ? 'Cámara apagada' : 'Puntero';
  const cameraGestures=nose?.on && nose.faceClick && state==='found';
  const myowareSignal = hasMyoWareSignal();
  const gestures=myowareSignal || emgChannels.size ? 'EMG' : cameraGestures ? 'Cámara' : 'Teclado';
  function channel(id,label){
    const active=myowareSignal || cameraGestures || emgChannels.has(id);
    return `<span class="status-signal" data-p="${id}" data-state="${active?'on':'off'}">${label}</span>`;
  }
  let sos=window.VOZ?.llamadaLista ? statusSignal('Listo','on') : statusSignal('De prueba','off');
  if(S.alarm?.level==='emergencia') sos=S.alarm.real?statusSignal('Alerta activa','alert'):statusSignal('Prueba activa','wait');
  else if(S.alarm) sos=statusSignal('Aviso de prueba','wait');
  let wa='';
  if(CFG.WA_URL){
    let value=statusSignal('Sin conexión','off');
    if(WA.online && WA.session==='connected') value=statusSignal('Conectado','on');
    else if(WA.online && WA.session==='dry') value=statusSignal('De prueba','off');
    else if(WA.online && !WA.session) value=statusSignal('Conectando','wait');
    const mn=WA.mention;
    if(mn && Date.now()-mn.at<15*60e3) value+=`<span class="status-mention" title="${esc(mn.from)} te mencionó en ${esc(mn.group)}">@${esc(mn.from)}</span>`;
    wa=statusGroup('WhatsApp',value);
  }
  const readings=statusGroup(cameraLabel,statusSignal(pointer,signal),selection)+
    statusGroup('Gestos · '+gestures,channel('ceja','Ceja')+channel('mandibula','Mandíbula'))+statusGroup('SOS',sos)+wa;
  const info=$('#diagnosticReadings');
  if(info._readings!==readings){ info.innerHTML=readings; info._readings=readings; }
}
function flashGesture(src){
  const indicator=$(`#diagnostics[open] [data-p="${src}"]`);
  if(indicator){ indicator.classList.add('flash'); setTimeout(()=>indicator.classList.remove('flash'),200); }
}
setInterval(()=>{renderStatus();updateLCD()},1000);

/* ===================== Navegación ===================== */
const navigation = createMyoNavigation({
  state: S, $, $$, getById: id => document.getElementById(id), location, history,
  closeEmotions: closeEmoRing, leaveRest: () => setRest(false),
  clearFocus, renderKeys: () => renderKeys(), navigate: (...args) => go(...args), onScreenChanged,
});
const { goBack, screenFromUrl } = navigation;
// Games and Apps still wrap this entry point to mount and unmount their screens.
function go(name, writeHistory) {
  return navigation.go(name, writeHistory);
}

function onScreenChanged(name) {
  if(name==='home'){ waReset(); renderTiles(); }
  if(name==='contacts'){ renderPeople(); waLoadFavs(); }
  if(name==='talk'){ if(!S.cards.length || !WA.to) genSuggestions(); else renderCards(); }   // fuera de un chat, cada vez que se abre salen otras formas
  if(name==='keyboard'){ S.kb.level=1; renderKeys(); }
  if(name==='reactions'){ S.reactPage=0; renderReacts(); }
  if(name==='settings'){ S.setPage='main'; renderSettings(); }
  if(name==='agent'){ S.agentPending=0; S.agentIdle=performance.now(); sendBtn(false); }
  renderStatus(); log('pantalla → '+name);
}
addEventListener('popstate',()=>{const name=screenFromUrl(); if(name!==S.screen) go(name,false);});

/* ===================== Hablar ===================== */
async function genSuggestions(){
  const ctx=$('#ctxIn').value.trim();
  $('#cards').classList.add('loading');
  let out=null;
  if(CFG.SUGGEST_URL){ try{ const ctl=new AbortController(); setTimeout(()=>ctl.abort(),2500);
      const r=await fetch(CFG.SUGGEST_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({context:ctx}),signal:ctl.signal});
      const j=await r.json(); out=j.suggestions.slice(0,4).map(x=>[x.text,x.tone,x.emo]); }catch(e){ log('Claude no respondió, uso sugerencias locales'); } }
  let generic=false;
  if(!out){ await new Promise(r=>setTimeout(r,220)); const r=RULES.find(r=>r.k.test(ctx)); out=pickVariants(r?String(r.k):'default', r?r.s:DEFAULT); generic=!r; }
  const cards=out.map(([text,tone,emo])=>({text,tone,emo:EMO[emo]?emo:'seria'}));
  if(WA.to){ S.poolAi=null; waSetPool(cards,generic); } else S.cards=cards;   // en un chat: 2 contextuales + «Pregúntele a…» + «Otro»
  $('#cards').classList.remove('loading'); renderCards();
  if(WA.to) waAiReplies();                                                   // Claude lee el chat y reemplaza las 2 de arriba
}
/* Modo dev (Shift+D): bajo cada tarjeta, de dónde sale. Sin traza = frase local de la TV (reglas y plantillas del navegador). */
window.trazaTexto=function(t,largo){
  if(!t) return '💻 local de la TV (reglas y plantillas, sin modelo ni memoria)';
  const fu=(t.fuentes||[]), inv=(t.inventadas||[]);
  const mem=fu.map(f=>f.id+(f.tipo?' '+f.tipo:'')+(largo&&f.texto?' «'+f.texto+'»':'')).join(' · ');
  const avisos=inv.length? ' ⚠ citó '+inv.join(',')+' sin tenerla en su contexto' : '';
  switch(t.origen){
    case 'agente': return (fu.length? '🧠 '+mem : '🤖 modelo, sin memoria')+(t.iniciales?' · iniciales '+t.iniciales.toUpperCase():'')+avisos;
    case 'regla': case 'reglas': return '📏 regla fija de respaldo (el modelo no respondió o faltaban opciones)';
    case 'tarjeta': return '🗂 tarjeta '+(t.de==='usuario'?'propia':'del catálogo')+' · tema '+t.tema+(t.fuente?' · de '+t.fuente:'')+(largo&&t.motivo?' · '+t.motivo:'');
    case 'respaldo': return '🛟 respaldo: claude -p sin memoria (el agente no respondió)';
    case 'whatsapp': return '💬 sugerencia del chat (sin traza)';
    case 'local': return '💻 '+(t.nota||'local de la TV');
    default: return '❔ '+(t.origen||'sin origen')+avisos;
  }
};
const trazaHtml=c=> document.body.classList.contains('myo-dev') ? `<div class="traza" title="${esc(trazaTexto(c.traza,true))}">${esc(trazaTexto(c.traza,false))}</div>` : '';
function renderCards(){
  const card=(c,i)=> c.plain ? `
    <div class="t card plain" data-t data-act="say:${i}"><div class="ph">${esc(c.text)}</div><div class="tone">${esc(c.tone)}</div>${trazaHtml(c)}</div>` : `
    <div class="t card" data-t data-act="say:${i}"${i===0&&WA.to?' data-prior="1.25"':''}>
      <div class="ph">${esc(c.text)}</div><div class="tone">${c.ai?'<span class="ai">✨</span> ':''}${c.tone===EMO[c.emo].n ? esc(c.tone) : esc(c.tone)+' · '+EMO[c.emo].n}</div>
      <div class="t emo" data-t data-dwell="${CFG.emoDwellMs}" data-act="emo:${i}">${EMO[c.emo].e}</div>${trazaHtml(c)}
    </div>`;
  // fila 1: frase, frase, Escribir · fila 2: frase, frase, Volver (siempre hay salida sin gestos)
  // En un chat de WhatsApp: "Escribir" pasa a iniciales y la 4ª tarjeta es "Otro" (más respuestas de Claude)
  const side=[WA.to
      ? `<div class="t side" data-t data-act="waKb"><svg><use href="#i-keys"/></svg>Escribir<small>con iniciales</small></div>`
      : `<div class="t side" data-t data-act="go:keyboard"><svg><use href="#i-keys"/></svg>Escribir<small>con letras</small></div>`,
              `<div class="t side" data-t data-act="go:home"><svg><use href="#i-back"/></svg>Volver<small>al inicio</small></div>`];
  const c=S.cards.slice(0,4);
  const otro=`<div class="t card plain" data-t data-act="waMore"><div class="ph">Otro</div><div class="tone">${S.aiWait?'<span class="ai-wait">✨ Claude está leyendo el chat…</span>':'más respuestas'}</div></div>`;
  $('#cards').innerHTML=[c[0]&&card(c[0],0), c[1]&&card(c[1],1), side[0], c[2]&&card(c[2],2), WA.to? otro : c[3]&&card(c[3],3), side[1]].filter(Boolean).join('');
  stagger($('#cards')); decorate($('#cards'));
  if(window.VOZ && !WA.to) VOZ.prefetch(S.cards.map(c=>[c.text,c.emo]));   // el audio ya está listo cuando elige
}

const {
  memory: MEM, learn: learnPhrase, DEL_STREAK_MS, deleteStep, delStreakActive,
  sugs, acceptSuggestion, renderKeys, renderKbText,
} = createMyoKeyboard({
  S, CFG, $, GROUPS, WORDS, RULES, DEFAULT, REACTS, tabletComposer,
  decorate, stagger, esc, iniAsk: requestInitials, iniCandidates, markLikelyKeys, iphoneDwell, iphonePointing,
});

/* ===================== Reacciones ===================== */
function renderReacts(){
  const page=REACTS.slice(S.reactPage*REACT_PAGE, S.reactPage*REACT_PAGE+REACT_PAGE);
  $('#reacts').innerHTML=page.map((r,i)=>`<div class="t react" data-t data-act="react:${S.reactPage*REACT_PAGE+i}"><span>${r[0]}</span>${r[1]}</div>`).join('')+
   `<div class="t react" data-t data-act="reactMore" style="color:var(--txt2)"><span>→</span>Más</div>`+
   `<div class="t react" data-t data-act="go:home" style="color:var(--txt2)"><span>←</span>Volver</div>`;
  stagger($('#reacts')); decorate($('#reacts'));
}

/* ===================== Ajustes ===================== */
function pointerLabel(){ if(window.IPHONE && IPHONE.active) return 'iPhone'; const N=window.NOSE||{}; return N.label? N.label():'Mouse'; }
const PALETTES=[['noche','Noche'],['bosque','Bosque'],['oceano','Océano'],['atardecer','Atardecer'],['lavanda','Lavanda']];
function paletteName(){ const p=document.documentElement.dataset.palette||'noche'; return (PALETTES.find(x=>x[0]===p)||PALETTES[0])[1]; }
function setPalette(id){ if(id==='noche'||!PALETTES.some(x=>x[0]===id)){ delete document.documentElement.dataset.palette; store.set('woki.palette','noche'); }
  else { document.documentElement.dataset.palette=id; store.set('woki.palette',id); } }
function renderLook(){
  const light=document.documentElement.dataset.theme==='light', pal=document.documentElement.dataset.palette||'noche';
  const card=(act,sw,lb,on,extra='')=>`<div class="t set${on?' chosen':''}${extra}" data-t data-act="${act}"><span class="swatch swatch-${sw}"></span><div class="val">${lb}</div></div>`;
  $('#sets').innerHTML=[card('look:oscuro','oscuro','Oscuro',!light), card('look:claro','claro','Claro',light),
    `<div class="t set span3" data-t data-act="look:volver"><div class="val">← Volver</div><div class="lb">a Ajustes</div></div>`,
    ...PALETTES.map(([id,lb])=>card('look:'+id,id,lb,pal===id))].join('');
  stagger($('#sets')); decorate($('#sets'));
}
function renderSettings(){
  if(S.setPage==='look') return renderLook();
  const v=S.voices[S.voiceIdx], N=window.NOSE||{}, iphone=iphonePointing(), browOnly=(iphone && !iphoneDwell()) || myowareConfirming();
  const items=[
    ['Tiempo de mirada', browOnly?'Desactivado':CFG.dwellMs+' ms', 'set:dwell',browOnly?'modo ceja':'toca para cambiar'],
    ['Confirmar con', myowareConfirming()?'Ceja (MyoWare)':CFG.mode==='click'?'Ceja':iphone?'Mirada':'Solo mirada','set:mode',iphoneDwell()?'o ceja':''],
    window.VOZ && VOZ.opciones.length
      ? ['Voz', (VOZ.nombre()||'ElevenLabs').slice(0,14), 'set:voice', `${VOZ.opciones.length} opciones · suena al cambiar`]
      : ['Voz', v? v.name.slice(0,14):'Del sistema','set:voice','suena al cambiar'],
    ['Puntero', pointerLabel(),'set:pointer','mouse · nariz · mirada · iPhone'],
    ['Sensibilidad', ['Baja','Media','Alta'][N.sensIdx??1],'set:sens',''],
    ['Calibrar','De nuevo','set:calib','C = solo recentrar'],
    ['Clic con cara', N.faceClick?'Cejas + boca':'No','set:faceclick','respaldo sin EMG'],
    ['Teclado', CFG.sugMode==='fila'?'Sugerencias fijas':'Sugerencias en lista','set:sugmode', CFG.sugMode==='fila'?'3 arriba · 1 mirada':'1 botón · más grande'],
    ['Tema y color', (document.documentElement.dataset.theme==='light'?'Claro':'Oscuro')+' · '+paletteName(),'set:theme','claro u oscuro y fondo'],
    ['Volver','Inicio','go:home','']];
  $('#sets').innerHTML=items.map(([lb,val,act,sub])=>`<div class="t set" data-t data-act="${act}"><div class="lb">${lb}</div><div class="val">${val}</div>${sub?`<div class="lb">${sub}</div>`:''}</div>`).join('');
  stagger($('#sets')); decorate($('#sets'));
}

/* ===================== Anillo de emociones ===================== */
function openEmoRing(i){
  S.emoRingFor=i; const c=S.cards[i];
  $('#emoC').innerHTML=`<div class="mid glass">“${esc(c.text)}”<br><br>Propuesta: ${EMO[c.emo].e} ${esc(EMO[c.emo].n)}</div>`+
    EMOS.map((e,k)=>`<div class="t" data-t data-act="setEmo:${e.id}" style="--i:${k}"><span>${e.e}</span>${e.n}</div>`).join('')+
    `<div class="t" data-t data-act="emoBack" style="--i:6;color:var(--txt2)"><span>←</span>Volver</div>`;
  decorate($('#emoC')); $('#emoRing').classList.add('on'); clearFocus(); log('anillo de emociones');
}
function closeEmoRing(){ $('#emoRing').classList.remove('on'); S.emoRingFor=null; clearFocus(); }

/* ===================== Voz ===================== */
function loadVoices(){ const all=speechSynthesis.getVoices(); const es=all.filter(v=>/^es/i.test(v.lang));
  const pref=['es-CL','es-419','es-MX','es-US','es-ES']; const rank=v=>{const i=pref.indexOf(v.lang);return i<0?99:i};
  es.sort((a,b)=>rank(a)-rank(b)); S.voices=es.length?es:all; }
speechSynthesis.onvoiceschanged=loadVoices; loadVoices();
function speak(text, emoId='seria'){
  const e=EMO[emoId]||EMO.seria; speechSynthesis.cancel(); if(window.VOZ) VOZ.stop();
  $('#spEmo').textContent=e.e; $('#spTxt').textContent=text; $('#speaking').classList.add('on');
  const off=()=>$('#speaking').classList.remove('on'); setTimeout(off, 1200+text.length*90);
  const local=()=>{ const u=new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}]/gu,''));
    const v=S.voices[S.voiceIdx]; if(v){u.voice=v;u.lang=v.lang}else u.lang='es-CL';
    u.rate=e.rate; u.pitch=e.pitch; u.volume=e.vol; u.onend=u.onerror=off; speechSynthesis.speak(u); };
  // ElevenLabs (su voz clonada o elegida) y, si falla o no hay red, la voz del sistema: nunca se queda muda
  if(window.VOZ && VOZ.on) VOZ.speak(text,emoId).then(off,err=>{ log('ElevenLabs falló ('+err.message+'), uso la voz del sistema'); local(); });
  else local();
  MEM.add(text); learnPhrase(text); log(`voz (${e.n}): ${text}`);
}

/* ===================== Acciones ===================== */
function press(el){ el.classList.add('pressed'); setTimeout(()=>el.classList.remove('pressed'),140); }
function activate(el, calibrateGaze=true, immediate=false){
  if (calibrateGaze) menuPointer.confirm(gz, el);
  if(iphoneDwell()) S.lockUntil=performance.now()+LOCKOUT_MS;
  if(tabletComposer && el.closest('#s-keyboard')) composerLock = el.getBoundingClientRect();
  press(el);
  if(calibrateGaze && window.GAZE) GAZE.onConfirm(el);   // la selección confirmada corrige la deriva de la mirada
  const [a,arg]=el.dataset.act.split(':');
  if(el.dataset.act!=='kb:del') S.kb.delAt=0;
  log('elegido → '+el.dataset.act);
  switch(a){
    case 'go':
      if(immediate) go(arg);
      else setTimeout(()=>go(arg),90);
      break;
    case 'back': goBack(); break;
    case 'say': { const c=S.cards[+arg];
      if(WA.to){ openAgent(c.plain || c.emo==='seria' ? c.text : c.text+' '+EMO[c.emo].e); break; }   // WhatsApp: se confirma, no se dice en voz alta; el emoji solo si la emoción no es neutra
      speak(c.text,c.emo); $('#agentMsg').textContent=c.text+' '+EMO[c.emo].e; break; }
    case 'waTo': waStart(WA.favs[+arg]); break;
    case 'waPanel': openPanel(); break;
    case 'emo': openEmoRing(+arg); break;
    case 'emoBack': closeEmoRing(); break;
    case 'setEmo': { S.cards[S.emoRingFor].emo=arg; closeEmoRing(); renderCards(); island(EMO[arg].e,'Emoción: '+EMO[arg].n); break; }
    case 'grp': S.kb.level=2; S.kb.group=+arg; renderKeys(); break;
    case 'complete':
      if (tabletComposer) {
        acceptSuggestion(sugs().find(sg => sg.word === arg));
        S.kb.level = 1;
        renderKeys();
      }
      break;
    case 'usePhrase':
      if (tabletComposer && S.kb.text.trim()) parent.postMessage({type:'toki-phrase',text:S.kb.text},location.origin);
      break;
    case 'sug': { const sg=(S.kb.sugList||[])[+arg]; acceptSuggestion(sg); S.kb.level=1; renderKeys(); break; }
    case 'chr': if(S.kb.mode==='ini'){ S.kb.ini=(S.kb.ini||'')+arg.toLowerCase(); S.kb.level=1; renderKeys(); break; }
      if(tabletComposer && S.kb.text.length>=300) break;
      S.kb.text+= (S.kb.text===''||/[.!?]\s$/.test(S.kb.text))? arg : arg.toLowerCase(); S.kb.level=1; renderKeys(); break;
    case 'waMore': S.poolPage=(S.poolPage||0)+1; waPage(); renderCards(); break;
    case 'waKb': kbIni(); break;
    case 'kb':
      if(S.kb.mode==='ini'){
        if(arg==='del') S.kb.ini=(S.kb.ini||'').slice(0,-1);
        if(arg==='back') S.kb.level=1;
        if(arg==='expand'){ expandInitials(); break; }
        if(arg==='exit'){ S.kb.mode='text'; go('talk'); break; }
        renderKeys(); break; }
      if(arg==='space' && (!tabletComposer || S.kb.text.length<300)) S.kb.text+=' ';
      if(arg==='del'){
        S.kb.delStreak = delStreakActive()? (S.kb.delStreak||0)+1 : 1;
        S.kb.delAt=performance.now();
        S.kb.text=deleteStep(S.kb.text, S.kb.delStreak);
        // al terminar la racha, la tecla vuelve a decir "Borrar"
        clearTimeout(S.kb.delTimer); S.kb.delTimer=setTimeout(()=>{ if(S.screen==='keyboard' && S.kb.level===1) renderKeys(); }, DEL_STREAK_MS+50);
      }
      if(arg==='back') S.kb.level=1;
      if(arg==='pred') acceptSuggestion(sugs()[0]);
      if(arg==='sug') S.kb.level=3;
      if(arg==='say' && S.kb.text.trim()){ const t=S.kb.text.trim(); S.kb.text=''; if(WA.to) openAgent(t); else speak(t); }
      renderKeys(); break;
    case 'react': { const r=REACTS[+arg]; speak(r[1],r[2]); break; }
    case 'reactMore': S.reactPage=(S.reactPage+1)%Math.ceil(REACTS.length/REACT_PAGE); renderReacts(); break;
    case 'attention': startAlarm('atencion'); break;
    case 'sos': startAlarm('emergencia'); break;
    case 'rest': setRest(true); break;
    case 'wake': setRest(false); break;
    case 'agentSend':
      if(S.agentPending && performance.now()-S.agentPending<3000){
        S.agentPending=0; sendBtn(false);
        if(CFG.WA_URL) waSend(); else { island('✓','Enviado (simulado)'); go('home'); } }
      else { S.agentPending=performance.now(); sendBtn(true);
        // Sin alejar la mirada: el botón se vuelve a habilitar y el conteo de permanencia empieza de nuevo (antes solo en «solo mirada»).
        // menuPointer guarda la última elección e ignora ese objetivo hasta que la mirada se aleja: para confirmar se limpia.
        setTimeout(()=>menuPointer.reset(),0);   // justo después de que activate() la registra: el foco no se pierde
        setTimeout(()=>{ if(S.blocked===el){ el.classList.remove('blocked'); S.blocked=null; } S.fStart=performance.now(); menuDwell.reset(); },350);
        setTimeout(()=>{ if(S.agentPending && performance.now()-S.agentPending>=3000 && S.screen==='agent'){ S.agentPending=0; sendBtn(false); island('⏱','No se envió: faltó la segunda ceja'); } },3100); }
      S.agentIdle=performance.now(); break;
    case 'look':
      if(arg==='volver') S.setPage='main';
      else if(arg==='oscuro'||arg==='claro') setTheme(arg==='claro');
      else setPalette(arg);
      setTimeout(()=>{ if(S.screen==='settings') renderSettings(); },150); break;
    case 'set':
       if((iphonePointing() && (arg==='pointer' || arg==='faceclick' || (arg==='dwell' && !iphoneDwell()))) ||
          (myowareConfirming() && arg==='dwell')){
        island('🔒', arg==='dwell' ? 'El tiempo de mirada no se usa en modo Ceja' : 'El puntero lo cambia el acompañante (barra inferior o teclado)');
        setTimeout(()=>{ if(S.screen==='settings') renderSettings(); },150); break; }
      if(iphonePointing() && arg==='calib'){ IPHONE.recalibrate(); break; }
      if(arg==='sugmode'){ CFG.sugMode=CFG.sugMode==='fila'?'lista':'fila'; try{ localStorage.setItem('woki.sugmode',CFG.sugMode); }catch(_){}
        island('⌨️', CFG.sugMode==='fila'?'Sugerencias fijas arriba del teclado':'Sugerencias en un botón que abre la lista'); }
      if(arg==='theme'){ S.setPage='look'; renderSettings(); break; }
      if(arg==='dwell'){ CFG.dwellMs=DWELL_OPTIONS[(DWELL_OPTIONS.indexOf(CFG.dwellMs)+1)%DWELL_OPTIONS.length]; CFG.emoDwellMs=CFG.dwellMs;
        try{ localStorage.setItem('woki.dwell',String(CFG.dwellMs)); }catch(_){} if(S.cards.length) renderCards(); }
       if(arg==='mode'){ if(myowareConfirming()) setMyoWareConfirmation(false);
         CFG.mode=CFG.mode==='click'?'dwell':'click';
        if(iphonePointing()){ try{ localStorage.setItem('woki.iphone.confirm',CFG.mode); }catch(_){}
          document.body.classList.toggle('iphone-hold',iphoneDwell());
          island(CFG.mode==='click'?'🤨':'👁', CFG.mode==='click'?'La mirada apunta, la ceja elige':'Mantener la mirada para elegir (o ceja)'); } }
      if(arg==='voice'){
        if(window.VOZ && VOZ.opciones.length) VOZ.siguiente().then(()=>{ speak('Hola, esta es mi voz.','alegre'); if(S.screen==='settings') renderSettings(); });
        else { S.voiceIdx=(S.voiceIdx+1)%Math.max(1,S.voices.length); speak('Hola, esta es mi voz.','alegre'); } }
      if(arg==='pointer' && window.NOSE){ const nx={Mouse:'nose',Nariz:'gaze',Mirada:'iphone',iPhone:'mouse'}[pointerLabel()];
        if(nx==='iphone' && window.IPHONE) IPHONE.select(); else { if(window.IPHONE) IPHONE.deactivate(); NOSE.setMode(nx==='iphone'?'mouse':nx); } }
      if(arg==='sens' && window.NOSE){ NOSE.sensIdx=(NOSE.sensIdx+1)%3; island('🎯','Sensibilidad '+['baja','media','alta'][NOSE.sensIdx]); }
      if(arg==='calib' && window.IPHONE && IPHONE.active){ $('#calib').classList.add('on'); IPHONE.openPanel(); }
      else if(arg==='calib' && window.CAL) CAL.open(window.NOSE && NOSE.on && NOSE.mode==='gaze' ? 'gaze' : undefined);
       if(arg==='faceclick' && window.NOSE){ NOSE.faceClick=!NOSE.faceClick; island('🙂',NOSE.faceClick?'Clic con cara: levanta la ceja para elegir':'Clic con cara apagado'); }
      setTimeout(()=>{ if(S.screen==='settings') renderSettings(); },150); renderStatus(); break;
  }
}

/* ===================== Eyebrow selection and jaw shortcuts ===================== */
function gestureBlocked(){
  return trackerOnly || document.visibilityState!=='visible' ||
    document.body.classList.contains('panel') ||
    ($('#alarm').classList.contains('on') && !S.alarm?.fromCareWheel) || $('#calib').classList.contains('on');
}
const {
  press: pressSrc, release: releaseSrc, cancel: cancelGestures, receiveMyoWare,
  isBrowHeld, isCameraBrowHeld, hasMyoWareSignal,
} = createMyoGestureController({
  isBlocked: gestureBlocked,
  getFocus: () => S.focus,
  faceBrowMaxMs: CFG.faceBrowMaxMs,
  flashGesture,
  confirmFocus,
  confirmGamePoint() {
    if (careWheel?.active || S.alarm || S.rest) return false;
    const game = globalThis.TOKI_EXTERNAL;
    const point = game?.capturePoint?.();
    if (!point) return false;
    game.confirmPoint(point);
    return true;
  },
  canUseJaw: () => myowareConfirming() && S.alarm?.level !== 'emergencia',
  onJaw() {
    if (careWheel?.active) careWheel.back();
    else if (S.screen === 'home' && !S.rest && S.emoRingFor === null && careWheel) openCareWheel();
    else goBack();
  },
});
function targetLayer(){
  return S.rest ? $('#rest') : S.emoRingFor!==null ? $('#emoRing') : $('.screen.on');
}
function confirmFocus(){
  if(careWheel?.active) return careWheel.confirm();
  if(S.alarm?.fromCareWheel) return stopAlarm('Simulación cerrada');
  const f=S.focus;
  if(!f || !targetLayer()?.contains(f)) return;
  const gestureOnly=myowareConfirming();
  // Sending still requires a second, separate eyebrow gesture on the same target.
  if(S.blocked===f && !(gestureOnly && S.agentPending && f.dataset.act==='agentSend')) return;
  if(!S.gazeLost){
    const now=performance.now();
    if(window.NOSE?.on && window.NOSE.mode==='gaze' && window.GAZE?.blocksPointer(now)) return;
    if(f.dataset.act==='sos' && (!controlPointFresh(now) || !withinActionMargin(f))) return;
  }
  if(S.gazeLost || gestureOnly || iphonePointing() || (CFG.mode==='click' && S.armed)){
    S.blocked=f; f.classList.add('blocked'); activate(f,true,true); return true;
  }
}

/* Clic directo como alternativa al gesto; respeta la capa visible y sus confirmaciones. */
function handleDirectClick(e){
  const el=e.target.closest('[data-t][data-act]');
  if(!el || $('#calib').classList.contains('on') || $('#alarm').classList.contains('on')) return;
  const layer=targetLayer();
  if(!layer || !layer.contains(el)) return;
  e.preventDefault();
  setFocus(el);
  S.blocked=el;
  el.classList.add('blocked');
  // Un clic de mouse no debe entrenar la calibración de la mirada.
  activate(el, false);
}
document.addEventListener('click',handleDirectClick);

/* teclado del computador = sensores simulados */
addEventListener('keydown',e=>{
  if(careWheel?.active) return;
  if(document.body.classList.contains('panel')){ if(e.key==='Escape') closePanel(); return; }   // el panel usa teclado normal
  if(e.key==='Escape' && S.alarm?.level==='emergencia'){ stopAlarm('Simulación cerrada'); return; }
  if(S.alarm?.level==='emergencia' && e.key!=='r' && e.key!=='R'){
    if(e.key==='Tab'){ e.preventDefault(); $('#alDismiss').focus(); }
    return;
  }
  if(document.activeElement && document.activeElement.tagName==='INPUT'){
    if(e.key==='Enter' && document.activeElement.id==='ctxIn'){ S.cards=[]; genSuggestions(); document.activeElement.blur(); }
    if(e.key==='Escape') document.activeElement.blur(); return; }
  if(e.repeat) return;
  if(e.code==='Space' && document.activeElement?.tagName!=='BUTTON'){
    e.preventDefault(); pressSrc('ceja','keyboard',performance.now());
  }
  if(e.key==='r'||e.key==='R') rfid();
  if(e.key==='k'||e.key==='K') openPanel();
  if(e.key==='g'||e.key==='G') setGazeLost(!S.gazeLost);
  if(e.key==='n'||e.key==='N') window.NOSE && NOSE.toggle();
  if(e.key==='c'||e.key==='C') window.NOSE && NOSE.center();
  if(e.key==='w'||e.key==='W'){ CFG.jitter=!CFG.jitter; island('〰️',CFG.jitter?'Simulando error de webcam':'Sin error simulado'); }
  if(e.key==='t'||e.key==='T') setTheme(document.documentElement.dataset.theme!=='light');
  if((e.key==='i'||e.key==='I') && !$('#calib').classList.contains('on')){ CFG.magnet=!CFG.magnet; island('🧲', CFG.magnet?'Imán activado: el foco va al objetivo más cercano':'Imán desactivado'); }
  if(e.key==='m'||e.key==='M'){ S.muted=!S.muted; island(S.muted?'🔕':'🔔', S.muted?'Alarma en silencio':'Sonido de alarma activo'); }
  if((e.key==='f'||e.key==='F') && !e.metaKey && !e.ctrlKey && !e.altKey){
    const pedir = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
    Promise.resolve(pedir).catch(()=>island('⛶','Usa la opción de pantalla completa del navegador'));
  }
});
addEventListener('keyup',e=>{
  if(e.code==='Space') releaseSrc('ceja','keyboard',performance.now());
});
addEventListener('blur',()=>cancelGestures());
document.addEventListener('visibilitychange',()=>{ if(document.hidden) cancelGestures(); });

/* puente opcional con los sensores reales */
(function(){ if(trackerOnly) return; try{ const ws=new WebSocket(CFG.EMG_WS);
  ws.onopen=()=>log('EMG real conectado');
  ws.onmessage=m=>{ try{ const d=JSON.parse(m.data), now=performance.now();
    if((d.src==='ceja' || d.src==='mandibula') && (d.edge==='down' || d.edge==='up')) emgChannels.add(d.src);
    if(d.edge==='down') pressSrc(d.src,'ws',now);
    else if(d.edge==='up') releaseSrc(d.src,'ws',now);
    else if(d.edge==='cancel'){ emgChannels.clear(); cancelGestures('ws'); }
    if(d.gaze && Number.isFinite(d.gaze.x) && Number.isFinite(d.gaze.y)) setGaze(d.gaze.x,d.gaze.y);
  }catch(_){} };
  ws.onclose=()=>{ emgChannels.clear(); cancelGestures('ws'); };
  ws.onerror=()=>{}; }catch(_){} })();

/* ===================== Mirada ===================== */
let mouse={x:innerWidth/2,y:innerHeight/2}, noise={x:0,y:0}, gz={x:innerWidth/2,y:innerHeight/2};
addEventListener('mousemove',e=>{ if((window.NOSE && NOSE.on) || (window.IPHONE && IPHONE.active)) return; mouse.x=e.clientX;mouse.y=e.clientY});
function setGazeLost(v){
  if(S.gazeLost===v) return; S.gazeLost=v; document.body.classList.toggle('scan',v); clearFocus(); S.scanIdx=-1;
  island(v?'👀':'👁', v?'No te veo · sigue con la ceja':'Te veo de nuevo', v); log(v?'cara perdida → EMG con escaneo':'cara recuperada'); renderStatus(); updateLCD();
}
window.setGaze=(x,y)=>{mouse.x=x;mouse.y=y}; // para conectar un eye tracker real
const gauss=()=>Math.random()+Math.random()+Math.random()-1.5;
function visibleTargets(){
  return [...(targetLayer()?.querySelectorAll('[data-t]') ?? [])].filter(el=>!el.classList.contains('emo'));
}
function clearFocus(){ if(S.focus) S.focus.classList.remove('focus','armed'); $$('.blocked').forEach(b=>b.classList.remove('blocked')); S.focus=null; S.blocked=null; S.armed=false; }
/* Botón Inicio deslizable (DESACTIVADO por ahora: DOCK.enabled): escondido bajo el borde inferior; sube cuando la mirada se acerca al centro
   de abajo, se elige como cualquier botón y vuelve a esconderse al alejarse. No aparece en Inicio. */
const DOCK = { enabled: false, band: .08, half: .2, keepPx: 60, closeMs: 700 };   // enabled:true para activarlo
const homeDock = (()=>{
  if(!DOCK.enabled) return {set(){}};
  // Vive dentro de la pantalla activa: la mirada solo elige objetivos de esa capa (targetLayer).
  const dock=document.createElement('div');
  dock.className='home-dock'; dock.id='homeDock';
  dock.innerHTML='<span class="home-dock-hint" aria-hidden="true"></span>'+
    '<button type="button" class="t nav-action home-orb" data-act="go:home" tabindex="-1" aria-label="Ir al inicio" title="Inicio"><svg class="nav-icon" aria-hidden="true"><use href="#i-home"/></svg></button>';
  $('#stage').append(dock);
  const orb=dock.querySelector('.home-orb');
  let openUntil=0;
  function set(open){
    if(dock.classList.contains('open')===open) return;
    dock.classList.toggle('open',open);
    if(open){ orb.setAttribute('data-t',''); decorate(dock); }
    else { orb.removeAttribute('data-t'); if(S.focus===orb) clearFocus(); }
  }
  function dockTick(now){
    const scr=$('.screen.on');
    if(scr && dock.parentElement!==scr){ set(false); openUntil=0; scr.append(dock); }
    const st=$('#stage').getBoundingClientRect();
    const blocked=S.screen==='home' || S.rest || !!S.alarm || document.hidden || $('#calib').classList.contains('on');
    dock.classList.toggle('off', blocked);
    const inZone=gz.y > st.bottom - st.height*DOCK.band && Math.abs(gz.x-(st.left+st.width/2)) < st.width*DOCK.half;
    const r=orb.getBoundingClientRect(), m=DOCK.keepPx;
    const onOrb=dock.classList.contains('open') && gz.x>r.left-m && gz.x<r.right+m && gz.y>r.top-m && gz.y<r.bottom+m;
    if(!blocked && (inZone||onOrb)) openUntil=now+DOCK.closeMs;
    set(!blocked && now<openUntil);
    requestAnimationFrame(dockTick);
  }
  requestAnimationFrame(dockTick);
  return {set};
})();
function setFocus(el){
  if(S.focus===el) return;
  if(S.focus){ S.focus.classList.remove('focus','armed'); if(S.blocked===S.focus){ S.blocked.classList.remove('blocked'); S.blocked=null; } }
  S.focus=el; S.fStart=performance.now(); S.armed=false;
  if(el){ el.classList.add('focus'); el.style.setProperty('--p',0); }
}
// Imán (área de captura tipo "bubble cursor"): distancia al borde de cada objetivo, dividida por su probabilidad.
function magnetTarget(x,y){
  const R=CFG.magnetR*Math.min(innerWidth,innerHeight); let best=null, bs=Infinity;
  for(const el of visibleTargets()){
    const r=el.getBoundingClientRect(); if(!r.width) continue;
    const dx=Math.max(r.left-x,0,x-r.right), dy=Math.max(r.top-y,0,y-r.bottom), d=Math.hypot(dx,dy);
    if(d>R) continue;
    const sc=d/(+el.dataset.prior||1); if(sc<bs){ bs=sc; best=el; }
  }
  return best;
}
let composerLock = null;
let suggestionExitAt = null;
const suggestionGraceMs = 200;
const menuPointer = window.createMenuPointer();
const menuDwell = window.createPointerDwell();
const menuOutline = window.createDwellOutline();
function tick(now){
  if(careWheel?.active){
    const camera=window.NOSE, gaze=window.GAZE;
    const live=camera?.on && camera.mode==='gaze' && !iphonePointing() && !S.gazeLost &&
      now-camera.lastFace<240 && gaze?.hasPoint(now);
    careWheel.updateGaze(live ? mouse : null, now);
    alarmTick(now); requestAnimationFrame(tick); return;
  }
  // punto de mirada: temblor de webcam opcional + suavizado
  const sig = CFG.jitter? 110*S.scale : 0;
  noise.x=noise.x*.88+gauss()*sig*.35; noise.y=noise.y*.88+gauss()*sig*.35;
  const tx=mouse.x+noise.x, ty=mouse.y+noise.y;
  gz.x+= (tx-gz.x)*.45; gz.y+= (ty-gz.y)*.45;   // filtro ~2 cuadros (guía: suavizado con poco retraso)
  const iphone=iphonePointing();
  const gestureOnly=myowareConfirming();
  let cx=gz.x, cy=gz.y;
  if((iphone||CFG.magnet) && S.focus && S.focus.isConnected && !S.gazeLost){ const r=S.focus.getBoundingClientRect(); const k=iphone? MAGNET : CFG.magnetPull;
    cx+= (r.left+r.width/2-gz.x)*k; cy+= (r.top+r.height/2-gz.y)*k; }
  const cur=$('#gaze'); cur.style.left='0';cur.style.top='0'; cur.style.transform=`translate(${cx}px,${cy}px)`;

  const noseCalibration = tabletComposer && document.body.classList.contains('nose-calibration');
  if (noseCalibration) {
    const nose = window.NOSE;
    const detected = nose.on && nose.raw && now - nose.lastFace < 250;
    document.body.classList.toggle('nose-detected', Boolean(detected));
    const state = !nose.on ? 'Activando la cámara…' : detected ? 'Puntero blanco · nariz detectada' : 'Buscando tu cara · mira hacia la cámara';
    const indicator = $('#noseTracking');
    if (indicator.textContent !== state) indicator.textContent = state;
  }
  const staleWebGaze = !S.gazeLost && window.NOSE?.on && window.NOSE.mode==='gaze' && window.GAZE?.blocksPointer(now);
  const webGaze = window.NOSE?.on && window.NOSE.mode==='gaze' && window.GAZE?.webActive;
  const busy = trackerOnly || document.hidden || $('#alarm').classList.contains('on') ||
    $('#calib').classList.contains('on') || document.body.classList.contains('panel');
  const resting = S.rest && !S.gazeLost;
  const playing = document.body.classList.contains('external-playing');
  const magnetic = CFG.magnet && (!window.frameElement || window.parent.TokiAccess?.magnetEnabled !== false);
  const menuAim = !iphone && !busy && !S.rest && !S.gazeLost && !playing;
  if (!menuAim) menuPointer.reset();
  if (busy || resting || S.gazeLost) { menuDwell.reset(); menuOutline.clear(); }
  if (busy || !resting || staleWebGaze) { restDwell.reset(); restMagnet.reset(); }
  if(staleWebGaze && !busy){ menuDwell.reset(); menuOutline.clear(); clearFocus(); }
  else if(!busy && resting) restWakeTick(now);
  else if(!busy){
    if(S.gazeLost){ // escaneo: la ceja elige
      if(S.focus && isCameraBrowHeld()) S.scanT=now;
      if(now-S.scanT>CFG.scanMs){ const v=visibleTargets(); if(v.length){ S.scanIdx=(S.scanIdx+1)%v.length; setFocus(v[S.scanIdx]); if(!iphone && !gestureOnly){ S.armed=true; S.focus.classList.add('armed'); S.focus.style.setProperty('--p',1); }} S.scanT=now; }
    } else {
      const hit=document.elementFromPoint(gz.x,gz.y);
      let el=hit? hit.closest('[data-t]') : null;
      if(el && !targetLayer()?.contains(el)) el=null;
      let entered=el;
      if(!el && iphone) el=nearestTarget(gz.x,gz.y,SNAP_PX*S.scale);
      if (menuAim) {
        const gazeBounds=webGaze && magnetic ? $('#stage').getBoundingClientRect() : undefined;
        const aim = menuPointer.resolve(gz, now, targetLayer(), cur, window.NOSE, window.GAZE, {magnetic,gazeBounds});
        el = aim.target;
        entered = aim.inside ? el : null;
      }
      // histéresis: el foco no salta mientras la mirada siga cerca del objetivo actual (12 % del lado menor)
      const onSuggestion = !menuAim && tabletComposer && S.focus?.isConnected && S.focus.parentElement.id === 'kbPred';
      if (onSuggestion) {
        const r = S.focus.getBoundingClientRect();
        const margin = Math.min(20, r.height * .22);
        const near = gz.x >= r.left - margin && gz.x <= r.right + margin &&
                     gz.y >= r.top - margin && gz.y <= r.bottom + margin;
        if (el !== S.focus && near) {
          suggestionExitAt ??= now;
          if (now - suggestionExitAt <= suggestionGraceMs) el = S.focus;
        } else if (el === S.focus && suggestionExitAt !== null) {
          S.fStart += now - suggestionExitAt;
          suggestionExitAt = null;
        }
      }
      if(!menuAim && !onSuggestion && S.focus && el!==S.focus && S.focus.isConnected && !S.focus.classList.contains('emo')){
        const r=S.focus.getBoundingClientRect(), m=.12*Math.min(r.width,r.height);
        if(gz.x>r.left-m && gz.x<r.right+m && gz.y>r.top-m && gz.y<r.bottom+m && !(el && el.classList.contains('emo') && S.focus.contains(el))) el=S.focus;
      }
      if(!el && magnetic && !menuAim && (!playing || !webGaze)) el=magnetTarget(gz.x,gz.y);
      if (tabletComposer && composerLock) {
        const r = composerLock;
        if (gz.x >= r.left && gz.x <= r.right && gz.y >= r.top && gz.y <= r.bottom) el = null;
        else composerLock = null;
      }
      if (!onSuggestion || el !== S.focus) suggestionExitAt = null;
      if(hit?.id==='externalGame') el=null;
      if(el?.matches?.('.sos-nav,.rest-nav') && (!controlPointFresh(now) || !withinActionMargin(el))) el=null;
      const inside = !!el && entered === el;
      const strictAction = el?.matches?.('.sos-nav,.rest-nav');
      const dwellElapsed = gestureOnly || (iphone && !strictAction) ? -1 : menuDwell.sample(el, now, inside);
      if (!el || el !== S.focus || dwellElapsed < 0) menuOutline.clear();
      setFocus(el);
      if(S.focus && !gestureOnly && (!iphone || iphoneDwell()) && suggestionExitAt === null){
        const f=S.focus, r=f.getBoundingClientRect();
        f.style.setProperty('--mx',((gz.x-r.left)/r.width*100)+'%'); f.style.setProperty('--my',((gz.y-r.top)/r.height*100)+'%');
        const forced=f.dataset.dwell? +f.dataset.dwell : null;
        const automatic = !!forced || CFG.mode === 'dwell';
        const insideDwell = automatic && (!iphone || strictAction);
        const elapsed = insideDwell ? Math.max(0, dwellElapsed) : Math.max(0, now-Math.max(S.fStart, iphone ? S.lockUntil||0 : 0));
        const target = automatic ? (forced || CFG.dwellMs) : CFG.settleMs;
        const tabletProgress = window.frameElement && window.parent.TokiAccess?.dwellProgress;
        const p = insideDwell && tabletProgress ? tabletProgress(elapsed, target) : Math.min(1, elapsed / target);
        f.style.setProperty('--p',p);
        const cardEdge=f.matches('#tiles .tile,.nav-action');
        const showEdge=insideDwell ? dwellElapsed>=0 : cardEdge;
        menuOutline.paint(showEdge ? f : null, p);
        if(p>=1 && S.blocked!==f && (!insideDwell || inside)){
          if(automatic){ S.blocked=f; f.classList.add('blocked'); activate(f); }
          else if(!S.armed){ S.armed=true; f.classList.add('armed'); }
        }
      }
    }
  }
  $('#typing').classList.toggle('on', S.screen==='talk' && !!S.focus && !$('#speaking').classList.contains('on'));
  if(!S.rest && S.alarm?.level!=='emergencia' && S.screen==='agent' && !S.agentPending && now-S.agentIdle>10000){ island('⏱','Cancelado: 10 s sin respuesta'); go('home'); }
  alarmTick(now);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/* objetivo visible más cercano a (x,y) dentro de maxDist (px de pantalla), o null */
function nearestTarget(x,y,maxDist){
  let best=null, bd=maxDist;
  for(const el of visibleTargets()){ const r=el.getBoundingClientRect();
    const dx=Math.max(r.left-x,0,x-r.right), dy=Math.max(r.top-y,0,y-r.bottom), d=Math.hypot(dx,dy);
    if(d<bd){ bd=d; best=el; } }
  return best;
}

/* ===================== Descanso ===================== */
function setRest(on){
  if(S.rest===on) return;
  clearFocus();
  S.rest=on;
  const screen=$('.screen.on'), wake=$('#restWake');
  screen.inert=on;
  $('#rest').classList.toggle('on',on);
  wake.style.setProperty('--p',0);
  if(S.screen==='agent'){ S.agentPending=0; S.agentIdle=performance.now(); sendBtn(false); }
  const next=on ? wake : screen.querySelector('.rest-nav');
  next?.focus({preventScroll:true});
  log(on?'descanso':'despierta');
}
function controlPointFresh(now){
  if(window.IPHONE?.active) return IPHONE.pointAt!=null && now-IPHONE.pointAt<250;
  if(!window.NOSE?.on) return true;
  return Boolean(NOSE.raw && now-NOSE.lastFace<250 && (NOSE.mode!=='gaze' || window.GAZE?.hasPoint(now)));
}
// A short approach margin helps aim while leaving a neutral strip between actions.
function withinActionMargin(el){
  const r=el.getBoundingClientRect();
  const d=Math.hypot(Math.max(r.left-gz.x,0,gz.x-r.right),Math.max(r.top-gz.y,0,gz.y-r.bottom));
  return d <= 20*S.scale;
}
const restMagnet=window.createMagneticPointer('#rest [data-t]');
const restDwell=window.createPointerDwell();
function restWakeTick(now){
  const direct=document.elementFromPoint(gz.x,gz.y)?.closest('#rest [data-t]') || null;
  const aim=CFG.magnet ? restMagnet.aim(gz,now,el=>Boolean(el)) : {target:direct};
  const target=aim.target && controlPointFresh(now) && withinActionMargin(aim.target) ? aim.target : null;
  if(target!==S.focus && S.focus) S.focus.style.setProperty('--p',0);
  setFocus(target);
  if(myowareConfirming() || (iphonePointing() && !iphoneDwell())) return;
  const inside=Boolean(target && target===direct);
  const elapsed=restDwell.sample(target,now,inside);
  if(!target || S.blocked===target) return;
  S.armed=elapsed>=CFG.settleMs;
  target.classList.toggle('armed',S.armed);
  const progress=Math.min(1,Math.max(0,elapsed)/Number(target.dataset.dwell));
  target.style.setProperty('--p',progress);
  if(inside && progress>=1){ S.blocked=target; activate(target,false); }
}

const { startAlarm, alarmTick, stopAlarm, rfid, beep, announceCare, silenceCareCue } = createMyoCare({
  $, $$, S, cancelGestures, clearFocus, targetLayer, setFocus,
  point: () => gz,
  elementAt: (x, y) => document.elementFromPoint(x, y),
  island, log, renderStatus, updateLCD,
  callEmergency: alarm => window.VOZ?.emergencia(alarm),
});

const careWheel=window.createCareWheel?.($('#care-wheel'), {
  announce:announceCare,
  silence:silenceCareCue,
  onAttention:()=>{
    startAlarm('atencion');
    announceCare('Aviso de prueba. No se contactó a nadie.');
  },
  onSOS:()=>{
    startAlarm('emergencia',{fromCareWheel:true});
    announceCare('SOS de prueba. No se contactó a nadie. Levanta la ceja para cerrar la simulación.');
  },
  onPhrase:announceCare,
  onBack:goBack,
  scanMs:Math.max(CFG.scanMs,2200),
});
function openCareWheel(){
  if(!careWheel || gestureBlocked() || S.rest || S.alarm?.level==='emergencia') return;
  clearFocus();
  menuDwell.reset(); menuOutline.clear();
  careWheel.open();
}
$('#care-open').hidden=trackerOnly || !careWheel;
$('#care-open').addEventListener('click',openCareWheel);

/* ===================== LCD + LEDs (Uno) ===================== */
const pad=s=>(s+'                ').slice(0,16);
function updateLCD(){
  const t=new Date().toTimeString().slice(0,5); const A=S.alarm; let l1,l2,led='g';
  if(A && A.level==='emergencia'){ const s=Math.floor((performance.now()-A.t0)/1000);
    if(A.ack){ l1='AYUDA EN CAMINO'; l2='RESPONDIO '+Math.round((A.ack-A.t0)/1000)+'s'; led='a'; } else { l1='EMERGENCIA '+s+'s'; l2='FALTA CONFIRMAR'; led='r'; } }
  else if(A){ l1='ATENCION'; l2=A.ack?'AYUDA EN CAMINO':(USUARIA? USUARIA.toUpperCase()+' LLAMA' : 'PIDE AYUDA'); led='a'; }
  else if(S.gazeLost){ l1='OK'.padEnd(11)+t; l2='MIRADA: SIN CARA'; led='a'; }
  else { l1='OK'.padEnd(11)+t; l2='SENSORES OK'; }
  $('#lcd').textContent=pad(l1)+'\n'+pad(l2);
  $('#ledG').classList.toggle('on',led==='g'); $('#ledA').classList.toggle('on',led==='a'); $('#ledR').classList.toggle('on',led==='r');
}

/* ===================== Isla y registro ===================== */
let islT; function island(ic,txt,warn=false,ms=2200){ const el=$('#island'); $('#isIc').textContent=ic; $('#isTx').textContent=txt;
  el.classList.toggle('warn',!!warn); el.classList.add('on'); clearTimeout(islT); if(ms) islT=setTimeout(()=>el.classList.remove('on'),ms); }
const LOG=[]; function log(m){ LOG.unshift(new Date().toTimeString().slice(0,8)+'  '+m); LOG.length=Math.min(LOG.length,8); $('#evlog').textContent=LOG.join('\n'); }

/* inicio */
renderTiles(); renderStatus(); updateLCD(); waListen();
if(screenFromUrl()!=='home') go(screenFromUrl(),false);
window.MYO = {
  S, CFG, mouse, gz, myowareConfirming,
  conversation: {
    setContext: setCtx, renderKbText, markLikelyKeys, iniCandidates,
    registerRoomInitials: handlers => { roomInitials = handlers; },
  },
  webcamHost: {
    trackerOnly, tabletComposer, requestedMethod, guidedSetup,
    iphonePointing, setMyoWareConfirmation, receiveMyoWare,
    pressSrc, releaseSrc, cancelGestures, hasMyoWareSignal, isCameraBrowHeld,
    clearFocus, setGazeLost, island, log, renderSettings, renderStatus,
    isCareWheelOpen: () => Boolean(careWheel?.active),
  },
};
log('Myo OS listo · mouse = mirada · Espacio = ceja');
