(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const panel = $('#tablet-settings'), layer = $('#access-layer'), cursor = $('#access-cursor');
  const chooser = $('#access-chooser'), cancelCalibration = $('#cancel-tracking');
  const cameraMethods = {Mirada: 'gaze', Nariz: 'nose'};
  const preferenceKey = 'toki.tablet.pointer';
  let welcome = true;
  let frame, configuring = false, pointing = 'Mouse', active = false, muscle = false;
  const selector = 'button, a[href]';
  const magnet = window.createMagneticPointer(selector);
  let magnetic = true, shown, lastFrame = 0;
  const rest = $('#visual-rest'), resume = $('#resume-rest');
  const dwell = window.createPointerDwell();
  const outline = window.createDwellOutline();
  const dwellChoices = [...panel.querySelectorAll('[data-dwell-ms]')];
  const dwellKey = 'toki.tablet.dwellMs';
  let dwellMs = 3000;
  try {
    const saved = localStorage.getItem(dwellKey);
    if (dwellChoices.some(button => button.dataset.dwellMs === saved)) dwellMs = Number(saved);
  } catch {}
  function dwellProgress(elapsed, minimumMs = 0) {
    const previewMs = 1000;
    const totalMs = Math.max(dwellMs, minimumMs);
    return Math.max(0, Math.min(1, (elapsed - previewMs) / (totalMs - previewMs)));
  }
  let paused = false, lockPoint, lockedButton, keyboardPoint;
  const pauseControl = el => ['settings','pause-access','take-rest','resume-rest'].includes(el.id);
  function eligible(el) {
    return !!el?.isConnected && !el.disabled && !el.closest('[inert],[hidden],[aria-disabled="true"]') &&
      (!paused || pauseControl(el));
  }
  function resetAim() {
    clearTarget(); magnet.reset(); dwell.reset(); shown = null;
  }
  $('#magnet').onclick = () => {
    magnetic = !magnetic;
    resetAim(); resetGesture();
    $('#magnet').textContent = 'Imán del puntero ' + (magnetic ? 'activado' : 'desactivado');
    $('#magnet').setAttribute('aria-pressed', String(magnetic));
  };
  let pointer, focused, locked;
  let port, reader, phase = 'off', downAt = 0, pending = 0, pressedTarget;
  const state = text => { $('#input-state').textContent = text; };

  function clearTarget() {
    outline.clear();
    focused?.classList.remove('access-focus');
    focused = null;
  }
  function settings(open) {
    panel.hidden = !open;
    $('#stage').inert = open;
    $('#settings').setAttribute('aria-expanded', String(open));
    resetAim();
    (open ? $('#tracking') : $('#settings')).focus();
  }
  $('#settings').onclick = () => settings(panel.hidden);
  $('#finish-settings').onclick = () => settings(false);
  function sync() {
    document.body.classList.toggle('assist-pointing', active);
    $('#selection').textContent = muscle ? 'Confirmación por contracción' : 'Selección por permanencia';
    $('#selection').setAttribute('aria-pressed', String(muscle));
    for (const button of dwellChoices) {
      button.setAttribute('aria-pressed', String(Number(button.dataset.dwellMs) === dwellMs));
    }
    $('#active-control').textContent = active ? pointing + (muscle ? ' · Contracción para elegir' : ' · Mantén ' + dwellMs / 1000 + ' s para elegir') : 'Control táctil o mouse';
  }
  for (const button of dwellChoices) {
    button.onclick = () => {
      dwellMs = Number(button.dataset.dwellMs);
      try { localStorage.setItem(dwellKey, String(dwellMs)); } catch {}
      resetAim();
      sync();
    };
  }
  function resetGesture() {
    clearTimeout(pending); pending = 0; downAt = 0; pressedTarget = null;
  }
  function swapSelection() {
    active = true; muscle = !muscle; resetGesture(); resetAim(); sync();
    state(muscle ? 'Una contracción elige. Dos rápidas vuelven. Espacio simula el músculo.' : 'Deja el puntero sobre una opción. Se abrirá cuando se complete el borde.');
  }
  $('#selection').onclick = swapSelection;
  $('#pause-access').onclick = () => {
    paused=!paused;resetGesture();resetAim();$('#pause-access').setAttribute('aria-pressed',String(paused));
    $('#pause-access').textContent=paused?'Reanudar selección':'Pausar selección';
    state(paused?'Selección en pausa. Elige Reanudar selección para continuar.':'Selección activa.');
  };

  function setRest(on) {
    rest.hidden = !on;
    $('.shell').inert = on;
    resetGesture();
    resetAim();
    const game = $('.catalog-frame');
    game?.contentWindow?.postMessage({type:'toki-visual-rest', on}, location.origin);
    (on ? resume : $('#take-rest')).focus({preventScroll:true});
  }
  $('#take-rest').onclick = () => setRest(true);
  resume.onclick = () => setRest(false);
  document.addEventListener('keydown', e => {
    if (e.repeat && ['Enter','Space','Escape'].includes(e.code) &&
        (e.target === resume || e.target.id === 'take-rest')) e.preventDefault();
    if (e.key === 'Tab') {
      keyboardPoint = currentPoint();
      document.body.classList.add('keyboard-nav');
      resetAim();
      resetGesture();
    }
  }, true);
  document.addEventListener('pointerdown', () => document.body.classList.remove('keyboard-nav'), true);

  function releaseCamera() {
    frame?.contentWindow?.NOSE?.stop();
    frame?.remove();
    frame = null;
  }
  function leaveSetup() {
    configuring = false;
    chooser.hidden = true;
    cancelCalibration.hidden = true;
    layer.classList.toggle('tracking', !!frame);
    layer.hidden = !frame;
    layer.inert = true;
    if (frame) { frame.inert = true; frame.setAttribute('aria-hidden','true'); }
    $('.shell').inert = false;
    pointer = null;
    resetAim();
    resetGesture();
    updateScroll();
  }
  function useControl(mode) {
    if (mode === 'Mouse') releaseCamera();
    pointing = mode;
    active = true;
    try { localStorage.setItem(preferenceKey, mode); } catch {}
    leaveSetup();
    sync();
    $('#location').focus({preventScroll:true});
  }
  function showChoices(message = '') {
    configuring = false;
    layer.hidden = false;
    layer.inert = false;
    layer.classList.remove('tracking');
    chooser.hidden = false;
    cancelCalibration.hidden = true;
    $('.shell').inert = true;
    $('#choice-error').textContent = message;
    $('#choice-error').hidden = !message;
    $('#dismiss-chooser').hidden = welcome || (pointing !== 'Mouse' && !frame);
    $('#choice-title').focus({preventScroll:true});
  }
  function setup(initial = false) {
    welcome = initial;
    settings(false);
    resetGesture();
    showChoices();
  }
  function calibrate(mode, resume = false) {
    releaseCamera();
    configuring = true;
    resetAim();
    resetGesture();
    cursor.hidden = true;
    chooser.hidden = true;
    cancelCalibration.hidden = false;
    layer.hidden = false;
    layer.inert = false;
    layer.classList.remove('tracking');
    $('.shell').inert = true;
    frame = document.createElement('iframe');
    frame.title = 'Calibrar ' + mode.toLowerCase();
    frame.allow = 'camera';
    const params = new URLSearchParams({entrada:'teclado', controlGlobal:'1', metodo:cameraMethods[mode], v:'25'});
    if (resume) params.set('reanudar','1');
    frame.src = 'woki-os.html?' + params;
    layer.append(frame);
    cancelCalibration.focus({preventScroll:true});
  }
  function backToChoices(message = '') {
    releaseCamera();
    showChoices(message);
  }
  function start({choose, direct}) {
    if (choose) { setup(true); return; }
    const params = new URLSearchParams(location.search);
    if (params.get('acceso') === 'iman' || (direct && params.get('appsAdmin') === '1')) return;
    let saved;
    try { saved = localStorage.getItem(preferenceKey); } catch {}
    if (saved === 'Mouse') useControl(saved);
    else if (Object.hasOwn(cameraMethods, saved)) calibrate(saved, true);
    else if (direct) { active = true; sync(); }
    else setup(true);
  }
  chooser.addEventListener('click', e => {
    const mode = e.target.closest('[data-pointer]')?.dataset.pointer;
    if (mode === 'Mouse') useControl(mode);
    else if (Object.hasOwn(cameraMethods, mode)) calibrate(mode);
  });
  $('#tracking').onclick = () => setup(false);
  $('#dismiss-chooser').onclick = () => { leaveSetup(); settings(true); };
  cancelCalibration.onclick = () => backToChoices();
  window.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || layer.hidden || layer.inert) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (configuring) backToChoices();
    else if (!$('#dismiss-chooser').hidden) $('#dismiss-chooser').click();
  }, true);
  window.addEventListener('message', e => {
    if (!configuring || e.origin !== location.origin || !frame || e.source !== frame.contentWindow) return;
    if (e.data?.type === 'toki-control-ready' && Object.hasOwn(cameraMethods, e.data.mode)) useControl(e.data.mode);
    if (e.data?.type === 'toki-control-back') backToChoices();
    if (e.data?.type === 'toki-control-error') backToChoices(e.data.message);
  });
  window.addEventListener('pointermove', e=>{
    if(!configuring && pointing==='Mouse' && e.pointerType==='mouse') pointer={x:e.clientX,y:e.clientY};
  });
  document.addEventListener('pointerout',e=>{if(!e.relatedTarget && pointing==='Mouse'){pointer=null;clearTarget();}});
  document.addEventListener('click',e=>{
    const button=e.target.closest('button,a[href]');
    if (active && button) {
      lockedButton = button; locked = button.getBoundingClientRect(); lockPoint = currentPoint();
      resetAim();
    }
  },true);
  function currentPoint() {
    if(pointing==='Mouse') return pointer;
    const w=frame?.contentWindow, n=w?.NOSE;
    if(!n?.on || !n.raw || w.WOKI.S.gazeLost || w.performance.now()-n.lastFace>240) return null;
    if(n.mode==='gaze' && (!w.GAZE.cur || w.GAZE.cur.blink)) return null;
    const r=w.document.querySelector('#stage').getBoundingClientRect(), p=w.WOKI.gz;
    return {x:Math.max(1,Math.min(innerWidth-2,(p.x-r.left)/r.width*innerWidth)),y:Math.max(1,Math.min(innerHeight-2,(p.y-r.top)/r.height*innerHeight))};
  }
  function activate(button) {
    if(!button?.isConnected || button.disabled || button.closest('[inert],[hidden]')) return;
    document.body.classList.remove('keyboard-nav');
    button.click();
  }
  function tick(now) {
    requestAnimationFrame(tick);
    const p = active && !configuring && !document.hidden && document.hasFocus() && currentPoint();
    const dt = Math.max(0, now - lastFrame);
    lastFrame = now;
    if (!p) {
      if (focused) resetGesture();
      resetAim();
      cursor.hidden = true;
      document.body.classList.remove('draws-mouse');
      return;
    }
    if (document.body.classList.contains('keyboard-nav')) {
      keyboardPoint ??= {...p};
      if (Math.hypot(p.x - keyboardPoint.x, p.y - keyboardPoint.y) < 22) {
        cursor.hidden = true;
        document.body.classList.remove('draws-mouse');
        return;
      }
      document.body.classList.remove('keyboard-nav');
    }
    const assisted = magnetic;
    const direct = !assisted && document.elementFromPoint(p.x, p.y)?.closest(selector);
    const aim = assisted ? magnet.aim(p, now, eligible) :
      {...p, target:eligible(direct) ? direct : null, inside:eligible(direct)};
    // Re-arm after leaving a used button. A newly painted view also requires
    // deliberate travel, so it cannot accept a second action at the old point.
    if (locked && lockPoint) {
      const near = p.x >= locked.left-8 && p.x <= locked.right+8 &&
        p.y >= locked.top-8 && p.y <= locked.bottom+8;
      if (near && (aim.target === lockedButton || Math.hypot(p.x-lockPoint.x,p.y-lockPoint.y)<28)) {
        aim.target = null;
      } else { locked = null; lockedButton = null; }
    }
    const el = aim.target;
    cursor.hidden = !rest.hidden && el !== resume;
    document.body.classList.toggle('draws-mouse', pointing === 'Mouse' && !cursor.hidden);
    if (!cursor.hidden) {
      const tau = pointing === 'Mouse' ? 38 : 58;
      const ease = !assisted || document.body.classList.contains('reduced') ? 1 : 1-Math.exp(-dt/tau);
      shown = shown ? {x:shown.x+(aim.x-shown.x)*ease, y:shown.y+(aim.y-shown.y)*ease} : {...aim};
      cursor.style.transform = 'translate('+shown.x+'px,'+shown.y+'px)';
    }
    if (el !== focused) { clearTarget(); focused = el; }
    const elapsed = dwell.sample(el, now, aim.inside);
    const autoSelect = !muscle || (paused && ['settings','pause-access'].includes(el?.id));
    const progress = autoSelect ? dwellProgress(elapsed) : 0;
    el?.classList.toggle('access-focus', muscle);
    outline.paint(autoSelect && elapsed >= 0 ? el : null, progress);
    if (aim.inside && progress === 1) activate(el);
  }
  requestAnimationFrame(tick);

  function edge(down) {
    if(!muscle || configuring || document.hidden)return;
    if(down) {if(!downAt){downAt=performance.now();pressedTarget=focused;}return;}
    if(!downAt)return;
    downAt=0;
    if(pending) {resetGesture();if(!rest.hidden)return;if(!chooser.hidden && !layer.inert){if(!$('#dismiss-chooser').hidden)$('#dismiss-chooser').click();return;}if(panel.hidden)window.dispatchEvent(new Event('toki-back'));else settings(false);return;}
    const chosen=pressedTarget;
    pending=setTimeout(()=>{
      pending=0;
      if(chosen && chosen===focused && currentPoint())activate(chosen);
    },300);
  }
  for(const type of ['keydown','keyup']) window.addEventListener(type,e=>{
    if(!muscle || configuring || document.body.classList.contains('keyboard-nav') || e.code!=='Space' || e.target.matches('textarea,input'))return;
    e.preventDefault();if(!e.repeat)edge(type==='keydown');
  },true);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){resetAim();resetGesture();pointer=null;}});
  window.addEventListener('blur', () => { resetGesture(); resetAim(); pointer = null; });

  async function connect() {
    if(port){await reader?.cancel();return;}
    if(!navigator.serial){state('Para conectar el Uno por USB, abre esta prueba en Chrome.');return;}
    const button=$('#sensor');button.disabled=true;
    try {
      port=await navigator.serial.requestPort();
      await port.open({baudRate:115200});
      reader=port.readable.getReader();button.disabled=false;button.textContent='Desconectar MyoWare';
      phase='rest';state('Relaja el músculo. Midiendo el reposo…');
      let buffer='', samples=[], start=0, baseline=0, noise=0, high=0, low=0, pressed=false, armed=false;
      const decoder=new TextDecoder();
      while(true) {
        const {done,value}=await reader.read();if(done)break;
        buffer+=decoder.decode(value,{stream:true});
        const lines=buffer.split('\n');buffer=lines.pop().slice(-128);
        for(const line of lines){
          const match=/^(?:ENV:)?(\d{1,4})$/.exec(line.trim());
          if(!match || Number(match[1])>1023)continue;
          const v=Number(match[1]),now=performance.now();
          if(phase!=='ready'){
            start ||= now;samples.push(v);
            if(now-start<(phase==='rest'?2500:4000) || samples.length<20)continue;
            samples.sort((a,b)=>a-b);
            const q=f=>samples[Math.floor((samples.length-1)*f)];
            if(phase==='rest'){
              baseline=q(.5);noise=q(.95)-q(.05);phase='flex';state('Contrae el músculo un momento y vuelve a relajarlo.');
            }else{
              const span=q(.90)-baseline;
              if(span<Math.max(8,noise*2)){phase='rest';state('La contracción no se distinguió. Relaja el músculo para repetir.');}
              else{high=baseline+span*.55;low=baseline+span*.30;phase='ready';muscle=true;active=true;sync();state('MyoWare listo. Una contracción elige. Dos rápidas vuelven.');}
            }
            start=0;samples=[];continue;
          }
          if(!armed){if(v<=low)armed=true;continue;}
          if(!pressed && v>=high){pressed=true;edge(true);}
          if(pressed && v<=low){pressed=false;edge(false);}
        }
      }
      state('MyoWare desconectado.');
    }catch(error){state(error.name==='NotFoundError'?'Conexión cancelada.':'No se pudo leer el Uno. Comprueba el puerto y cierra otros monitores serie.');}
    finally{
      resetGesture();reader?.releaseLock();reader=null;
      if(port)try{await port.close();}catch{}
      port=null;phase='off';button.disabled=false;button.textContent='Conectar MyoWare USB';
    }
  }
  $('#sensor').onclick=connect;
  const scrollArea = () => document.querySelector('#lobbyApps') || $('#content');
  function updateScroll() {
    const box=scrollArea(), enabled=active && panel.hidden && !configuring;
    $('#page-up').hidden=!enabled || box.scrollTop<2;
    $('#page-down').hidden=!enabled || box.scrollTop+box.clientHeight>=box.scrollHeight-2;
  }
  for(const [id,dir] of [['page-up',-1],['page-down',1]]) {
    $('#'+id).onclick=()=>{const box=scrollArea();box.scrollBy(0,dir*box.clientHeight*.72);updateScroll();};
  }
  new MutationObserver(updateScroll).observe($('#content'),{childList:true,subtree:true});
  for(const event of ['resize','scroll','click','message']) window.addEventListener(event,updateScroll,true);
  state('Mantén el puntero para elegir. Puedes cambiar a confirmación por contracción.');
  if (new URLSearchParams(location.search).get('acceso') === 'iman') {
    active = true;
    state('Mantén el mouse sobre una opción hasta que se complete el borde.');
  }
  sync();window.TokiAccess={setup,start,dwellProgress,get magnetEnabled(){return magnetic;}};
})();
