/* Individual games using the existing calibrated pointer and target activation. */
window.addEventListener('load', () => {
  const button = (action, label, extra = '') => `<button type="button" class="t game-button" data-t data-dwell="1100" data-act="game:${action}" ${extra}>${label}</button>`;
  const section = document.createElement('section');
  section.id = 's-games'; section.className = 'screen'; section.dataset.title = 'Juegos';
  section.innerHTML = '<div class="status"></div><div id="gameContent"></div>';
  document.querySelector('#stage').append(section);
  document.querySelector('svg defs')?.insertAdjacentHTML('beforeend', '<symbol id="i-game" viewBox="0 0 80 80"><rect x="10" y="20" width="60" height="40" rx="16"/><path d="M23 40h18m-9-9v18M55 35h1m5 12h1"/></symbol>');
  TILES.splice(6, 0, ['go:games', 'g-purple', 'i-game', 'Juegos', 'A tu ritmo']);
  document.body.classList.add('has-games');
  renderTiles();
  let state = null, paused = false, suspended = false, inputPending = false, latch = null;
  const content = document.querySelector('#gameContent');
  const KEY = 'toki.games.records.v1';
  const records = () => { try { const r = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(r) ? r.filter(x => ['stars','memory'].includes(x.kind) && Number.isFinite(x.score)).slice(0,20) : []; } catch { return []; } };
  function mode() { return NOSE.on ? (NOSE.mode === 'gaze' ? 'Mirada' : 'Nariz') : 'Mouse'; }
  function inputControls() { if (window.TOKI_OS_SHELL) return `<p class="game-note">Mantén la mirada sobre una opción para elegirla. El puntero se cambia en Ajustes.</p>`; return `<div class="game-inputs">${button('nose','👃 Nariz')}${button('gaze','👁 Mirada')}${button('mouse','Mouse')}${button('calibrate','Calibrar')}</div><p class="game-note" id="gameInputStatus">Control: ${mode()}. Mantén el puntero 1,1 s sobre una opción. También puedes hacer clic.</p>`; }
  function paint(html) {
    const blockedAction=S.blocked?.dataset.act;
    clearFocus(); content.innerHTML=html; decorate(content);
    // A label change (Pause → Continue) must not activate again under a stationary gaze.
    const replacement=[...content.querySelectorAll('[data-t]')].find(el=>el.dataset.act===blockedAction);
    if(replacement) { setFocus(replacement); S.blocked=replacement; replacement.classList.add('blocked'); }
  }
  const art = (kind, fallback) => window.TOKI_GAME_ART?.[kind] || `<span class="game-art">${fallback}</span>`;
  function lobby() {
    state = null; paused = false;
    paint(`<div class="game-heading"><div><p class="game-eyebrow">UN MOMENTO PARA TI</p><h1>Juega a tu ritmo.</h1></div><span>Sin cronómetro</span></div>${inputControls()}<div class="game-catalog">${button('stars',art('stars','✦')+'<strong>Constelaciones</strong><small>Encuentra 10 estrellas con tu puntero.</small>')}${button('memory',art('memory','▦')+'<strong>Parejas</strong><small>Descubre tres parejas. Sin prisa.</small>')}${button('external',art('external','↗')+'<strong>Eye Gaze Games</strong><small>Explora los juegos de SpecialEffect.</small>')}</div><div class="game-footer">${window.TOKI_OS_SHELL?button('home','← Inicio'):''}${button('records','Ver récords locales')}<p>Juegos individuales · Los récords se guardan solo en este navegador.</p></div>`);
  }
  function start(kind) {
    paused = false;
    const deck = ['☀','☀','☂','☂','♫','♫'];
    for (let i=deck.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [deck[i],deck[j]]=[deck[j],deck[i]]; }
    state = {kind, count:0, target:Math.floor(Math.random()*6), deck, open:[], matched:[], attempts:0, done:false, input:mode()};
    renderGame();
  }
  function renderGame() {
    const s=state; if (!s) return;
    const title=s.kind==='stars'?'Constelaciones':'Parejas';
    const progress=s.kind==='stars'?`${s.count} / 10 estrellas`:`${s.matched.length/2} / 3 parejas · ${s.attempts} intentos`;
    const revealed=s.open.length===2;
    paint(`<div class="game-heading"><div><p class="game-eyebrow">${progress}</p><h1>${title}</h1></div>${button('pause',paused?'Continuar':'Pausa')}</div><p class="game-instruction" aria-live="polite">${paused?'Descansa. La partida te espera.':s.kind==='stars'?'Mira la estrella y mantén el puntero sobre ella.':revealed?'Observa las dos figuras. Cuando quieras, continúa.':'Elige dos tarjetas para encontrar una pareja.'}</p>${paused?'<div class="game-pause">☾</div>':`<div class="game-board">${Array.from({length:6},(_,i)=> {
      if(s.kind==='stars') return i===s.target?button('pick:'+i,'✦',`aria-label="Recoger estrella"`):'<div class="game-empty" aria-hidden="true">·</div>';
      if(s.matched.includes(i)) return `<div class="game-matched" aria-label="Pareja encontrada">${s.deck[i]}<small>✓</small></div>`;
      if(s.open.includes(i)) return `<div class="game-revealed">${s.deck[i]}</div>`;
      return revealed?'<div class="game-empty">?</div>':button('pick:'+i,'?',`aria-label="Tarjeta ${i+1}"`);
    }).join('')}</div>`}<div class="game-footer">${button('lobby','← Juegos')}${!paused&&s.kind==='memory'&&revealed?button('next','Continuar'):''}<p>${s.kind==='stars'?'Sin fallos ni penalizaciones.':'Cada pareja vale 100 puntos. Los intentos extra descuentan 10.'}</p></div>`);
  }
  function finish() {
    if(state.done) return; state.done=true;
    const score=state.kind==='stars'?100:Math.max(0,300-Math.max(0,state.attempts-3)*10);
    let stored=true;
    try { localStorage.setItem(KEY,JSON.stringify([{kind:state.kind,score,input:state.input,date:new Date().toISOString()},...records()].slice(0,20))); } catch { stored=false; }
    paint(`<div class="game-finish"><p class="game-eyebrow">PARTIDA COMPLETADA</p><h1>¡Lo conseguiste!</h1><div class="game-score">${score}<small>puntos</small></div><p>${stored?'Récord guardado en este navegador.':'No se pudo guardar el récord en este navegador.'}</p><div class="game-inputs">${button(state.kind,'Otra partida')}${button('records','Ver récords')}${button('lobby','← Juegos')}</div></div>`);
  }
  function showRecords() {
    const rows=records();
    paint(`<div class="game-heading"><div><p class="game-eyebrow">SOLO EN ESTE NAVEGADOR</p><h1>Tus récords</h1></div>${button('lobby','← Juegos')}</div><p class="game-note">Aún no hay clasificación pública ni sincronización con otras laptops.</p><div class="game-records">${['stars','memory'].map(kind=>`<article><h2>${kind==='stars'?'Constelaciones':'Parejas'}</h2><ol>${rows.filter(x=>x.kind===kind).sort((a,b)=>b.score-a.score).slice(0,5).map(x=>`<li><strong>${x.score} puntos</strong><span>${['Mouse','Nariz','Mirada'].includes(x.input)?x.input:'Puntero'}</span></li>`).join('')||'<li>Todavía no hay partidas.</li>'}</ol></article>`).join('')}</div>`);
  }
  function external() {
    paint(`<div class="game-heading"><div><p class="game-eyebrow">SPECIALEFFECT</p><h1>Eye Gaze Games</h1></div>${button('lobby','← Juegos')}</div><div class="game-external"><p>Una colección externa de juegos accesibles, con sus propios ajustes de control.</p><p>El puntero de mirada o nariz de Toki funciona dentro de esta página. No controla automáticamente la web de SpecialEffect.</p><p>Para probar tu cámara con Toki, vuelve a Constelaciones o Parejas. Para los juegos externos necesitarás configurar allí un método compatible.</p>${button('visit','Abrir Eye Gaze Games ↗')}<p class="game-note">Abre en esta pestaña. Puedes regresar con el botón Atrás del navegador.</p></div>`);
  }
  window.TOKI_GAMES={lobby};
  const baseActivate=activate;
  activate=function(el, calibrate=true) {
    if(!el?.dataset.act?.startsWith('game:')) return baseActivate(el,calibrate);
    if(S.screen!=='games'||S.rest||S.alarm||document.querySelector('#calib').classList.contains('on')||suspended||inputPending) return;
    if(calibrate && latch?.action===el.dataset.act) return;
    latch={action:el.dataset.act, rect:el.getBoundingClientRect()};
    const [,act,arg]=el.dataset.act.split(':');
    if(act==='lobby') return lobby();
    if(act==='home') return go('home');
    if(act==='stars'||act==='memory') return start(act);
    if(act==='records') return showRecords();
    if(act==='external') return window.TOKI_EXTERNAL?.catalog ? window.TOKI_EXTERNAL.catalog() : external();
    if(act==='visit') { location.href='https://www.eyegazegames.com/'; return; }
    if(['nose','gaze','mouse'].includes(act)) {
      inputPending=true;
      NOSE.setMode(act).finally(()=>{inputPending=false; const status=document.querySelector('#gameInputStatus'); if(status) status.textContent=`Control: ${mode()}. Mantén el puntero 1,1 s sobre una opción.`; renderStatus();}); return;
    }
    if(act==='calibrate') { CAL.open(NOSE.mode==='gaze'?'gaze':undefined); return; }
    if(!state||state.done) return;
    if(act==='pause') {paused=!paused; renderGame();return;}
    if(paused) return;
    if(act==='next'&&state.open.length===2) {state.open=[]; renderGame();return;}
    if(act==='pick') {
      const i=Number(arg); if(!Number.isInteger(i)||i<0||i>5) return;
      if(state.kind==='stars') {
        if(i!==state.target) return;
        state.count++; if(state.count===10) return finish();
        state.target=(i+1+Math.floor(Math.random()*5))%6;
      } else {
        if(state.open.length===2||state.open.includes(i)||state.matched.includes(i)) return;
        state.open.push(i);
        if(state.open.length===2) {state.attempts++; if(state.deck[state.open[0]]===state.deck[i]) state.matched.push(...state.open);}
        if(state.matched.length===6) return finish();
      }
      renderGame();
    }
  };
  const baseGo=go;
  go=function(name) { if(name==='games') lobby(); baseGo(name); };
  // Losing face, hiding the page or opening calibration must never collect a target.
  function syncSuspension() {
    if(latch) {
      const r=latch.rect;
      if(mouse.x<r.left-10||mouse.x>r.right+10||mouse.y<r.top-10||mouse.y>r.bottom+10) latch=null;
    }
    const blocked=S.screen==='games'&&(document.hidden||S.gazeLost||S.rest||!!S.alarm||document.querySelector('#calib').classList.contains('on'));
    if(blocked&&!suspended) {
      suspended=true; clearFocus();
      content.querySelectorAll('[data-t]').forEach(el=>{el.removeAttribute('data-t');el.dataset.gameSuspended='true';});
      if(state&&!state.done) paused=true;
    } else if(!blocked&&suspended) {
      suspended=false;
      if(state&&!state.done) renderGame();
      else content.querySelectorAll('[data-game-suspended]').forEach(el=>{el.setAttribute('data-t','');delete el.dataset.gameSuspended;});
    }
    requestAnimationFrame(syncSuspension);
  }
  requestAnimationFrame(syncSuspension);
});
