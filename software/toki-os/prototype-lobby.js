(() => {
'use strict';
const $=s=>document.querySelector(s);
const paths={services:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',home:'m3 11 9-8 9 8M5 10v11h14V10M9 21v-8h6v8',fullscreen:'M4 9V4h5m6 0h5v5m0 6v5h-5M9 20H4v-5',message:'M4 5h16v11H9l-5 4V5Z M8 9h8m-8 4h5',voice:'M8 10v4m4-8v12m4-10v8m4-5v2M4 11v2',music:'M9 18V5l11-2v13M9 7l11-2M9 18c0 4-6 4-6 1s6-4 6-1m11-2c0 4-6 4-6 1s6-4 6-1',games:'M7 7h10c4 0 6 12 3 13-2 1-4-4-5-4H9c-1 0-3 5-5 4C1 19 3 7 7 7Z M6 11h5m-2.5-2.5v5m8-2h.1m2 3h.1',rest:'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z',help:'M6 17h12l-2-3V9a4 4 0 0 0-8 0v5l-2 3Z M10 20h4',arrow:'M4 12h15m-6-6 6 6-6 6',back:'M20 12H5m6-6-6 6 6 6',check:'m5 12 5 5L20 7',sound:'M4 9h4l5-4v14l-5-4H4V9Zm12-1c3 2 3 6 0 8m3-11c5 4 5 10 0 14',mute:'M4 9h4l5-4v14l-5-4H4V9Zm13 1 4 4m0-4-4 4',motion:'m13 3-7 10h6l-1 8 7-11h-6l1-7Z',play:'m9 5 11 7-11 7V5Z',pause:'M8 5v14m8-14v14',edit:'m5 16 11-11 3 3L8 19H5v-3Zm9-9 3 3'};
const icon=(name,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]||paths.message}"/></svg>`;
const items=[
{id:'messages',label:'Mensajes',sub:'Cerca de los tuyos',icon:'message',number:'01',title:'Un mensaje.<br><em>Más cerca.</em>',intro:'Hay cosas que solo tú puedes decir. Encuentra las palabras y hazlas tuyas.',cta:'Crear un mensaje',accent:'#d8f197'},
{id:'talk',label:'Hablar',sub:'Tu propia voz',icon:'voice',number:'02',title:'Lo que piensas.<br><em>En voz alta.</em>',intro:'Una frase, una idea, una conversación. Tu espacio para tomar la palabra.',cta:'Quiero decir algo',accent:'#9ee3db'},
{id:'games',label:'Juegos',sub:'Un mundo por explorar',icon:'games',number:'04',title:'Tu siguiente<br><em>gran momento.</em>',intro:'Conduce, explora o resuelve una partida. Elige lo que te apetece jugar.',cta:'Explorar juegos',accent:'#bbbeff'},
{id:'help',label:'Compañía',sub:'Alguien cerca',icon:'help',number:'05',title:'A veces, basta<br><em>con estar.</em>',intro:'Prepara una invitación para compartir este momento con alguien.',cta:'Pedir compañía',accent:'#f1b8a8'},
{id:'apps',label:'Servicios',sub:'Música, videos y noticias',icon:'services',accent:'#d8f197'}];
let selected='messages',screen='home',draft='',companyDraft='',speechDraft='',reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,sound=false,audioCtx=null,ambient=null,volume=.18,transitionId=0,sendTimer=null,toastTimer=null;
let composing = false, letterGroup = '', reviewing = false;
const ease='cubic-bezier(.16,1,.3,1)';
function escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function announce(s){$('#announcer').textContent=s}
function tone(kind='hover'){if(!sound)return;try{audioCtx??=new AudioContext();audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=kind==='confirm'?660:kind==='back'?330:440;g.gain.setValueAtTime(.025,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.12);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.14)}catch{}}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2600)}
function animate(el,frames,options={}){if(reduce)return;return el.animate(frames,{duration:420,easing:ease,...options})}
function artwork(id){
const defs=`<defs><linearGradient id="stone" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b4c9c8"/><stop offset=".5" stop-color="#667f88"/><stop offset="1" stop-color="#304854"/></linearGradient><linearGradient id="glass" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#e8fbf5" stop-opacity=".85"/><stop offset=".6" stop-color="#98c2c4" stop-opacity=".65"/><stop offset="1" stop-color="#456e80" stop-opacity=".9"/></linearGradient><linearGradient id="dark" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#243e4b"/><stop offset="1" stop-color="#0b202e"/></linearGradient><linearGradient id="edge"><stop stop-color="#e5f2e9"/><stop offset=".5" stop-color="#789eaa"/><stop offset="1" stop-color="#a6c9ca"/></linearGradient><linearGradient id="accent" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${items.find(x=>x.id===id).accent}"/><stop offset="1" stop-color="#77998b"/></linearGradient><radialGradient id="shade"><stop stop-color="#000d"/><stop offset="1" stop-color="#00131d00"/></radialGradient><pattern id="grille" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.5" fill="#0b2432"/></pattern></defs>`;
const base=`<ellipse cx="570" cy="580" rx="350" ry="90" fill="url(#shade)"/><path d="m215 500 375-130 260 135-372 150Z" fill="#132b39" stroke="#9fbec54a"/><path d="m215 500 263 127 372-122v24L478 657 215 527Z" fill="url(#dark)"/><path d="m240 499 352-119 229 124-343 112Z" fill="url(#stone)" opacity=".55"/><path d="m278 511 200 94 304-101" fill="none" stroke="#d3e5df55"/><path class="signal-trace" d="m260 517 218 102 330-112" fill="none" stroke="currentColor" stroke-width="2"/>`;
const messages=`<g class="art-panel"><path d="m386 442-3-244q0-20 21-27l258-89q24-8 27 17l6 266q0 20-18 27l-268 93q-22 7-23-43Z" fill="url(#dark)" stroke="url(#edge)" stroke-width="3"/><path d="m404 193 265-91 6 275-265 93Z" fill="url(#glass)"/><path d="m419 210 239-82" stroke="#e4f2e7" stroke-width="2" opacity=".7"/><circle cx="643" cy="149" r="4" fill="currentColor"/><path d="m435 238 124-43m-124 58 190-65" stroke="#163c4e" stroke-width="6" stroke-linecap="round" opacity=".55"/><path d="m481 447 2 51 83-28-2-51" fill="url(#stone)"/><path d="m422 514 105-36 63 26-106 38Z" fill="url(#edge)"/></g><g class="art-float"><path d="m532 246 215-73q17-6 18 13l2 125q0 17-17 22l-161 55-51 45v-27q-16 4-17-12l-2-127q0-16 13-21Z" fill="url(#accent)" stroke="#eff9c9" stroke-width="1.5"/><path d="m553 277 155-52m-155 77 122-41m-121 67 70-24" stroke="#315244" stroke-width="9" stroke-linecap="round" opacity=".7"/><circle cx="729" cy="303" r="12" fill="#ecf6d9"/><path d="m725 304 4 3 6-10" fill="none" stroke="#315244" stroke-width="2"/></g><g class="art-float-delayed"><path d="m260 348 176-60q15-5 15 11v106q0 12-13 17l-131 44-40 31v-20q-16 3-16-13V366q0-14 9-18Z" fill="#345563" stroke="#bad3d48c"/><path d="m275 376 140-47m-140 67 89-30" stroke="#a9c9cd" stroke-width="7" stroke-linecap="round"/></g><g><ellipse cx="694" cy="487" rx="56" ry="23" fill="#102837"/><path d="M638 469v18c0 30 112 30 112 0v-18" fill="url(#dark)"/><ellipse cx="694" cy="469" rx="56" ry="22" fill="url(#stone)" stroke="#bad4d0"/><path d="m669 469 17 6 30-13" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></g>`;
const games=`<g class="art-panel"><path d="m339 315 238-78 174 120v162l-238 81-174-130Z" fill="url(#dark)" stroke="#aec5c16b"/><path d="m339 315 238-78 174 120-238 82Z" fill="url(#stone)"/><path d="m382 300 5-159 207-62 101 78-3 162-207 70Z" fill="url(#dark)" stroke="url(#edge)" stroke-width="3"/><path d="m406 156 173-53 88 63-176 56Z" fill="#a2bcbe"/><path d="m404 169 181-55v151l-181 60Z" fill="#193b52"/><path d="m415 300 42-70 36 15 41-83 39 70" fill="none" stroke="currentColor" stroke-width="5"/><path d="m457 270 38 25 76-25" stroke="#f3f0cd" stroke-width="3" fill="none"/><path d="m492 222 175-56-1 143-175 62Z" fill="url(#glass)" opacity=".3"/><path d="m395 354 156-51 110 75-158 53Z" fill="url(#accent)"/><ellipse cx="464" cy="365" rx="24" ry="11" fill="#183644"/><path d="M464 361v-40" stroke="#d3e8dc" stroke-width="8"/><circle cx="464" cy="315" r="15" fill="currentColor"/><ellipse cx="574" cy="367" rx="15" ry="8" fill="#304654"/><ellipse cx="610" cy="355" rx="15" ry="8" fill="#e5dfc6"/><path d="m533 465 160-55v51l-160 56Z" fill="url(#grille)"/></g><g class="art-float" fill="currentColor"><path d="m730 156 8 19 20 1-16 13 5 19-17-11-17 11 5-19-16-13 20-1Z"/><path d="m290 291 6 13 14 1-11 9 3 13-12-7-12 7 3-13-11-9 14-1Z" opacity=".7"/></g>`;
const talk=`<g class="art-panel"><path d="m425 490 1-269q1-74 96-102 99-28 101 47v265q-3 58-99 88-98 28-99-29Z" fill="url(#stone)" stroke="url(#edge)" stroke-width="3"/><path d="m447 254 154-50v193l-154 51Z" fill="url(#grille)"/><path d="m447 230 154-50" stroke="#d4e4df" stroke-width="2"/><path d="m450 465 149-47" stroke="currentColor" stroke-width="4"/><ellipse cx="524" cy="510" rx="50" ry="15" fill="#0b2835"/><path d="m494 516 1 26 48-15v-26" fill="url(#edge)"/><path d="m439 553 81-28 83 25-82 28Z" fill="url(#stone)"/></g><g class="art-float"><path d="m601 285 150-49q24-9 24 16v95q0 18-18 24l-151 51-22 27V311q0-19 17-26Z" fill="url(#accent)" stroke="#e8f7e9"/><path d="M617 337v24m25-49v62m25-81v77m25-88v60m25-62v30m25-42v27" stroke="#2a5553" stroke-width="8" stroke-linecap="round"/></g><g class="art-float-delayed" fill="none" stroke="currentColor"><path d="M351 256q-44 45-17 93" stroke-width="4"/><path d="M324 240q-60 62-22 130" stroke-width="2" opacity=".6"/></g>`;
const company=`<g class="art-panel"><path d="m305 388-6-172q0-30 28-40l93-33q36-12 39 25l9 193" fill="url(#glass)" stroke="url(#edge)" stroke-width="3"/><path d="m301 375 162-55 87 75-164 59Z" fill="url(#accent)"/><path d="m301 375 85 79v92l-17-9v-72l-68-63Z" fill="url(#stone)"/><path d="m463 320 87 75v90l-17 7v-83l-70-62Z" fill="url(#dark)"/><path d="m585 330-5-172q0-30 28-40l93-33q36-12 39 25l9 193" fill="url(#glass)" stroke="url(#edge)" stroke-width="3"/><path d="m581 317 162-55 87 75-164 59Z" fill="url(#accent)"/><path d="m581 317 85 79v92l-17-9v-72l-68-63Z" fill="url(#stone)"/><path d="m743 262 87 75v90l-17 7v-83l-70-62Z" fill="url(#dark)"/><ellipse cx="555" cy="460" rx="90" ry="31" fill="url(#stone)"/><path d="M548 481v57l18-6v-51" fill="url(#edge)"/><path d="m480 549 76-27 54 22-76 28Z" fill="url(#dark)"/><path d="M496 244q34-42 74-29" stroke="currentColor" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="486" cy="257" r="9" fill="currentColor"/><circle cx="583" cy="223" r="9" fill="currentColor"/></g>`;
return `<svg viewBox="0 0 960 720" xmlns="http://www.w3.org/2000/svg">${defs}${base}${id==='help'?company:id==='games'?games:id==='talk'?talk:messages}<circle class="light-dot" cx="478" cy="638" r="3" fill="currentColor"/></svg>`;
}
function setArt(id){$('#art').dataset.scene=id;}
function tileArt(id){if(id==='apps')return `<span class="service-mosaic">${['spotify','youtube','biobio','mercadolibre'].map(id => window.TokiApps.brandLogo(id)).join('')}</span>`;return artwork(id).replace(/id="([^"]+)"/g,`id="tile-${id}-$1"`).replace(/url\(#([^)]+)\)/g,`url(#tile-${id}-$1)`)}
function renderHome(){
const descriptions={talk:'Frases y voz',messages:draft?'Borrador disponible':'Elegir una frase o letras',games:'Mi colección',help:'Pedir compañía',apps:'Música, videos y noticias'};
const order=['talk','messages','help','apps','games'];
$('#content').innerHTML=`<div class="app-grid">${order.map(id=>{const i=items.find(x=>x.id===id);return `<button class="app-tile app-${id}" data-open="${id}" style="--tile-accent:${i.accent}"><span class="tile-art" aria-hidden="true">${tileArt(id)}</span><span class="tile-label">${icon(i.icon)}<span><strong>${i.label}</strong><small>${descriptions[id]}</small></span></span><span class="tile-corner" aria-hidden="true">${icon('arrow')}</span></button>`}).join('')}</div>`;
$('#location').textContent='Inicio';document.documentElement.style.setProperty('--accent','#d8f197');
}
function move(next,focus=true){if(screen==='talk'&&next!=='talk')stopVoice();transitionId++;const token=transitionId;screen=next;$('#return-home').disabled=next==='home';composing=false;letterGroup='';reviewing=false;document.body.classList.toggle('work',next!=='home');$('#location').textContent=next==='home'?'Inicio':items.find(x=>x.id===selected).label;render();animate($('#content'),[{opacity:.65},{opacity:1}],{duration:450});const panel=$('#content .panel');if(panel)animate(panel,[{opacity:.2,transform:'translateX(28px) scale(.97)'},{opacity:1,transform:'translateX(0) scale(1)'}],{duration:540});if(innerWidth<761)window.scrollTo(0,0);if(focus)requestAnimationFrame(()=>{if(token!==transitionId)return;const t=next==='home' ? document.querySelector('[data-open="'+selected+'"]') : $('#location');if(t){if(t.id==='location')t.tabIndex=-1;t.focus({preventScroll:true})}})}
window.addEventListener('message', event => {
  if (event.origin === location.origin && event.source === $('.catalog-frame')?.contentWindow && event.data === 'toki-games-home') back();
});
function back() {
  if (!$('#visual-rest').hidden) { $('#resume-rest').click(); return; }
  if (!$('#tablet-settings').hidden) { $('#finish-settings').click(); return; }
  if (screen === 'apps' && window.TokiApps?.active?.back?.()) return;
  if (screen === 'messages' || screen === 'help') {
    if (letterGroup) { letterGroup=''; render(); return; }
    if (composing || reviewing) { composing=false; reviewing=false; render(); return; }
  }
  tone('back'); move('home');
}
window.addEventListener('toki-back',back);
function serviceHeader(root, app) {
  const player = app.view === 'player' && !app.admin;
  const nav = $('#return-home');
  const label = player ? 'Servicios' : 'Inicio';
  if (nav.getAttribute('aria-label') !== label) {
    nav.setAttribute('aria-label', label);
    nav.innerHTML = icon(player ? 'back' : 'home') + label;
  }
  const title = player ? 'Spotify' : 'Servicios';
  if ($('#location').textContent !== title) $('#location').textContent = title;
  document.body.classList.toggle('spotify-open',player);
}
$('#return-home').onclick = () => {
  if (!$('#tablet-settings').hidden) $('#finish-settings').click();
  if (document.body.classList.contains('spotify-open')) back();
  else move('home');
};
function contact() {
  const name = screen === 'help' ? 'Camila' : 'Sofía';
  return `<div class="panel-head"><span class="avatar">${name[0]}</span><strong>Para ${name}</strong><small>WhatsApp · simulación</small></div>`;
}
function renderTalk() {
  const tab = conversation.tab;
  const tabs = [['respuestas','Responder'], ['escribir','Escribir'], ['rapidas','Frases rápidas']];
  const chooser = tabs.map(([id, label]) => `<button class="secondary" data-mode="${id}" aria-pressed="${id === tab}">${label}</button>`).join('');
  let controls;
  if (tab === 'respuestas') {
    const cards = replies().map(([text, , initial], i) => {
      const selected = conversation.tones[i] || initial;
      return `<div class="reply"><button class="phrase" data-reply="${i}">${escape(text)}</button><button class="secondary" data-tone-cycle="${i}">Tono · ${escape(EMO[selected].n)}</button></div>`;
    }).join('');
    controls = `<p class="chosen">Sofía · ${escape(conversation.context)}</p><button class="secondary" data-action="change-context">Cambiar pregunta</button><details><summary>Pregunta del acompañante</summary><form id="context-form"><label for="context">Pregunta</label><input id="context" maxlength="300" value="${escape(conversation.context)}"><button class="secondary">Ver respuestas</button></form></details><div class="reply-grid">${cards}</div>`;
  } else if (tab === 'escribir') {
    const keys = conversation.group ? [...conversation.group].map(c => key('letter', c)) : GROUPS.map(group => key('group', group));
    controls = `<p class="composed-text">${escape(speechDraft) || "Elige una letra para empezar"}</p><div class="keys">${keys.join('')}${conversation.group ? key('reset','Grupos') : ''}${key('space','Espacio')}${key('delete','Borrar')}</div><div id="predictions" class="keys"></div>`;
  } else {
    controls = `<div class="speech-shortcuts">${['Sí','No','Un momento, por favor','Tengo sed','Quiero cambiar de posición','Me duele algo', ...REACTS.map(r=>r[1])].map(t=>`<button data-quick="${escape(t)}">${escape(t)}</button>`).join('')}</div>`;
  }
  $('#content').innerHTML = `<div class="mode-row">${chooser}</div>${controls}<div class="actions">${tab === 'escribir' ? '<button class="primary" data-action="speak">Decir frase</button>' : ''}<button class="secondary" data-action="stop-speech">Detener voz</button><span id="voice-state" role="status"></span></div><div id="handoff"></div>`;
  refreshHandoff();
  refreshPredictions();
}
function key(kind, value) {
  return `<button class="secondary" data-key="${kind}" data-value="${escape(value)}">${escape(value)}</button>`;
}
function refreshPredictions() {
  if ($('#predictions')) $('#predictions').innerHTML = predictions(speechDraft).map(w => key('word', w)).join('');
}
function refreshHandoff() {
  const text = conversation.tab === 'escribir' ? speechDraft : conversation.selectedText;
  if ($('#handoff')) $('#handoff').innerHTML = text.trim() ? `<p class="chosen">${escape(text)}</p><button class="secondary" data-action="share">Usar en Mensajes</button>` : '';
}
function chooseReply(text, toneId) {
  conversation.selectedText = text;
  conversation.selectedTone = toneId;
  draft = text;
  say(text, toneId);
  refreshHandoff();
}
function render() {
  document.body.classList.toggle('apps-open',screen==='apps');
  if (screen !== 'apps') {
    window.TokiApps?.active?.destroy();
    if (document.body.classList.contains('spotify-open')) {
      document.body.classList.remove('spotify-open');
      $('#return-home').setAttribute('aria-label','Inicio');
      $('#return-home').innerHTML = icon('home') + 'Inicio';
    }
  }
  if (screen === 'apps') { $('#content').innerHTML='<div id="lobbyApps"></div>'; window.TokiApps.mount($('#lobbyApps'),{home:back,shellHome:true,afterPaint:serviceHeader}); return; }
  if (screen === 'home') return renderHome();
  if (screen === 'talk') return renderTalk();
  if (screen === 'messages' || screen === 'help') {
    const text = screen === 'help' ? companyDraft : draft;
    const action = (id,label,cls='secondary') => `<button class="${cls}" data-action="${id}">${label}</button>`;
    const phrases = screen === 'help' ? ['¿Puedes acompañarme un momento?', 'Necesito ayuda', 'Ven, por favor'] : ['Quiero agua', '¿Puedes venir un momento?', 'Gracias por estar aquí'];
    const choices = phrases.map(phrase=>`<button class="phrase" data-message="${escape(phrase)}">${escape(phrase)}</button>`).join('');
    const preview = text.trim() ? `<p class="composed-text">${escape(text)}</p>` : '';
    if (reviewing) {
      $('#content').innerHTML = contact() + preview + '<div class="actions">' + action('send','Confirmar envío simulado','primary') + action('compose','Cambiar mensaje') + action('phrases','Ver frases') + '</div>';
    } else if (composing) {
      const keys = letterGroup ? [...letterGroup].map(letter=>key('letter',letter)) : GROUPS.map(group=>key('group',group));
      const words = predictions(text).map(word=>key('word',word)).join('');
      $('#content').innerHTML = contact() + `<div class="draft-line">${preview || '<p class="composed-text muted">Elige una letra para empezar</p>'}${text.trim()?action('review','Revisar mensaje','primary'):''}</div>
        <div class="word-options">${words}</div><div class="letter-tiles">${keys.join('')}${letterGroup?key('reset','Grupos'):''}${key('space','Espacio')}${key('delete','Borrar')}</div>${action('phrases','Ver frases')}`;
    } else {
      $('#content').innerHTML = contact() + '<h2>¿Qué quieres decir?</h2><div class="phrase-list">' + choices + '</div><div class="actions">' + action('compose',text.trim()?'Continuar por letras':'Elegir letras','primary') + (text.trim()?action('review','Revisar mi frase'):'') + '</div>' + preview;
    }
  } else if (screen === 'games') {
    $('#content').innerHTML = '<iframe class="catalog-frame" title="Catálogo de juegos" src="prototype-motion.html?motion=spatial&amp;start=games&amp;tablet=1&amp;v=25" allow="fullscreen; autoplay; gamepad; camera"></iframe>';
  }
}
function enter(id=selected){selected=id;document.documentElement.style.setProperty('--accent',items.find(x=>x.id===id).accent);setArt(id);tone('confirm');move(id)}
function updateAmbientControls() {
  $('#ambient-toggle').textContent = ambient ? 'Pausar sonido ambiente' : 'Escuchar sonido ambiente';
  $('#ambient-volume').hidden = !ambient;
  $('#ambient-quieter').disabled = volume <= 0;
  $('#ambient-louder').disabled = volume >= .4;
}
function stopAmbient() {
  if (!ambient) return;
  const {gain, oscs} = ambient;
  ambient = null;
  gain.gain.setTargetAtTime(0, audioCtx.currentTime, .1);
  oscs.forEach(osc => osc.stop(audioCtx.currentTime + .5));
  updateAmbientControls();
}
$('#ambient-toggle').onclick = async () => {
  if (ambient) return stopAmbient();
  try {
    audioCtx ??= new AudioContext();
    await audioCtx.resume();
    if (ambient || document.hidden || $('#tablet-settings').hidden) return;
    const gain = audioCtx.createGain();
    gain.gain.value = 0;
    gain.connect(audioCtx.destination);
    const oscs = [130.81, 196, 261.63].map((frequency, i) => {
      const osc = audioCtx.createOscillator(), level = audioCtx.createGain();
      osc.frequency.value = frequency;
      level.gain.value = [.35, .15, .1][i];
      osc.connect(level).connect(gain);
      osc.start();
      return osc;
    });
    gain.gain.setTargetAtTime(volume, audioCtx.currentTime, .6);
    ambient = {gain, oscs};
    updateAmbientControls();
  } catch { toast('No se pudo iniciar el audio.'); }
};
for (const [id, step] of [['ambient-quieter', -.04], ['ambient-louder', .04]]) {
  document.getElementById(id).onclick = () => {
    if (!ambient) return;
    volume = Math.max(0, Math.min(.4, Math.round((volume + step) * 100) / 100));
    ambient.gain.gain.setTargetAtTime(volume, audioCtx.currentTime, .1);
    updateAmbientControls();
  };
}
$('#take-rest').addEventListener('click', () => { stopAmbient(); stopVoice(); });
const content = $('#content');
content.addEventListener('submit', event => {
  if (event.target.id !== 'context-form') return;
  event.preventDefault();
  conversation.context = $('#context').value.trim();
  conversation.tones = {};
  renderTalk();
  $('.reply button').focus();
});
content.addEventListener('change', event => {
  if (event.target.matches('[data-tone]')) conversation.tones[event.target.dataset.tone] = event.target.value;
});
content.addEventListener('input', event => {
  const field = event.target;
  if (field.id === 'speech') {
    speechDraft = field.value;
    refreshPredictions();
    refreshHandoff();
  }
});
function typeKey(kind, value) {
  if (kind === 'group') conversation.group = value;
  else {
    conversation.group = '';
    if (kind === 'letter') speechDraft += speechDraft ? value.toLowerCase() : value;
    if (kind === 'space') speechDraft += ' ';
    if (kind === 'delete') speechDraft = speechDraft.slice(0, -1);
    if (kind === 'word') speechDraft = speechDraft.replace(/[^\s]*$/u, value + ' ');
    speechDraft = speechDraft.slice(0, 300);
  }
  renderTalk();
  $('[data-key]').focus();
}
content.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  const data = button.dataset;
  if (data.open) return enter(data.open);
  if (data.toneCycle !== undefined) {
    const i=Number(data.toneCycle), current=conversation.tones[i] || replies()[i][2];
    conversation.tones[i]=EMOS[(EMOS.findIndex(e=>e.id===current)+1)%EMOS.length].id;
    return renderTalk();
  }
  if (data.mode) {
    conversation.tab = data.mode;
    renderTalk();
    $('[data-mode="' + data.mode + '"]').focus();
    return;
  }
  if ('reply' in data) {
    const [text, , defaultTone] = replies()[Number(data.reply)];
    return chooseReply(text, conversation.tones[data.reply] || defaultTone);
  }
  if (data.quick) return chooseReply(data.quick, REACTS.find(r => r[1] === data.quick)?.[2] || 'seria');
  if (screen === 'messages' || screen === 'help') {
    let text = screen === 'help' ? companyDraft : draft;
    if (data.message) {text=data.message; reviewing=true;}
    else if (data.key) {
      switch(data.key) {
        case 'group': letterGroup=data.value; break;
        case 'reset': letterGroup=''; break;
        case 'letter': text += text ? data.value.toLowerCase() : data.value; letterGroup=''; break;
        case 'word': text=text.replace(/[^\s]*$/u, () => data.value + ' ');letterGroup='';break;
        case 'space': text+=' ';letterGroup='';break;
        case 'delete': text=text.slice(0,-1);break;
      }
    }
    if (data.message || data.key) {
      if(screen==='help') companyDraft=text.slice(0,300); else draft=text.slice(0,300);
      render();return;
    }
  }
  if (data.key) return typeKey(data.key, data.value);
  switch (data.action) {
    case 'change-context': {
      const list=['¿Vienes a cenar el domingo?', '¿Cómo estás?', '¿Quieres agua?', '¿Tienes frío?', '¿Te duele algo?'];
      conversation.context=list[(list.indexOf(conversation.context)+1)%list.length];conversation.tones={};return renderTalk();
    }
    case 'compose': reviewing=false;composing=true;letterGroup='';return render();
    case 'review': reviewing=true;composing=false;return render();
    case 'phrases': reviewing=false;composing=false;letterGroup='';return render();
    case 'share':
      draft = conversation.tab === 'escribir' ? speechDraft : conversation.selectedText;
      return enter('messages');
    case 'send':
      if(!reviewing) return;
      if(screen==='messages') draft=''; else companyDraft='';
      move('home');toast('Envío simulado completado.');return;
    case 'speak':
      if (speechDraft.trim()) chooseReply(speechDraft, 'seria');
      else $('[data-key]')?.focus();
      return;
    case 'stop-speech': return stopVoice();
  }
});
let voiceToken=0;
function stopVoice(){voiceToken++;if('speechSynthesis' in window)speechSynthesis.cancel();if($('#voice-state'))$('#voice-state').textContent='Voz en reposo';document.body.classList.remove('speaking')}
function say(text, toneId='seria'){stopVoice();if(!('speechSynthesis' in window)){toast('Voz no disponible en este navegador.');return}const token=voiceToken;const u=new SpeechSynthesisUtterance(text);u.lang='es-CL';const voiceTone=EMO[toneId] || EMO.seria;u.rate=voiceTone.rate;u.pitch=voiceTone.pitch;u.volume=voiceTone.vol;u.onstart=()=>{if(token!==voiceToken)return;if($('#voice-state'))$('#voice-state').textContent='Hablando…';document.body.classList.add('speaking')};u.onend=()=>{if(token===voiceToken)stopVoice()};u.onerror=()=>{if(token===voiceToken){stopVoice();toast('No se pudo reproducir la voz.')}};speechSynthesis.speak(u);rememberSpokenWords(text);announce(text)}

$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{toast('Usa la opción de pantalla completa del navegador.')}};
document.addEventListener('fullscreenchange',()=>$('#fullscreen').setAttribute('aria-label',document.fullscreenElement?'Salir de pantalla completa':'Pantalla completa'));
$('#sound').textContent='Sonido desactivado';$('#sound').onclick=()=>{sound=!sound;$('#sound').textContent=sound?'Sonido activado':'Sonido desactivado';$('#sound').setAttribute('aria-pressed',sound);$('#sound').setAttribute('aria-label',sound?'Desactivar sonido de interfaz':'Activar sonido de interfaz');tone('confirm');toast(sound?'Sonido de interfaz activado.':'Sonido de interfaz desactivado.')};
function syncMotion(){ $('#motion').textContent=reduce?'Movimiento reducido':'Movimiento completo';document.body.classList.toggle('reduced',reduce);document.body.classList.toggle('motion-allowed',!reduce);$('#motion').setAttribute('aria-pressed',reduce);$('#motion').setAttribute('aria-label',reduce?'Activar movimiento':'Reducir movimiento');if(reduce)document.getAnimations().forEach(a=>a.cancel())}
$('#motion').textContent='Reducir movimiento';$('#motion').onclick=()=>{reduce=!reduce;syncMotion();toast(reduce?'Movimiento reducido.':'Movimiento activado.')};syncMotion();
document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();back()}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopAmbient();stopVoice()}});
document.addEventListener('pointermove',e=>{if(reduce||e.pointerType!=='mouse')return;const art=$('#art');art.style.setProperty('--rx',((.5-e.clientY/innerHeight)*3)+'deg');art.style.setProperty('--ry',((e.clientX/innerWidth-.5)*5)+'deg')},{passive:true});
setArt(selected);renderHome();animate($('#content'),[{opacity:0,translate:'0 25px'},{opacity:1,translate:'0 0'}],{duration:650});
const launchParams = new URLSearchParams(location.search);
const keyboardEntry = launchParams.get('entrada') === 'teclado';
if (keyboardEntry) enter('messages');
window.TOKI_LOBBY={get state(){return {screen,selected,draft,reduce,playing:!!ambient}}};
const start = launchParams.get('start');
if (start === 'apps' || start === 'spotify') enter('apps');
if (start === 'spotify') void window.TokiApps.active.openSpotify();
window.TokiAccess.start({
  choose: keyboardEntry || launchParams.get('acceso') === 'elegir',
  direct: start === 'apps' || start === 'spotify' || launchParams.get('acceso') === 'iman'
});
$('#return-home').disabled=screen==='home';
})();
