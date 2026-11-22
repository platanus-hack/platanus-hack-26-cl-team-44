/* woki-voz.js · ElevenLabs en la TV (vía woki-bridge; la API key nunca llega al navegador).
   - VOZ.speak(texto, emo): habla con la voz elegida o clonada. Si falla, woki-os.html usa la voz del sistema.
   - VOZ.prefetch(frases): pide el audio de las 4 tarjetas antes de que Marta elija → suena al instante.
   - VOZ.emergencia(alarma): llamada telefónica del agente de emergencia + estado en la pantalla de alarma.
   - VOZ.siguiente(): Marta recorre las voces candidatas desde Ajustes y escucha cada una. */
(function(){
  // CFG es un const de woki-os.html: no cuelga de window, se lee por nombre.
  const base = () => (typeof CFG!=='undefined' && (CFG.VOZ_URL ?? CFG.WA_URL)) || 'http://localhost:8788';
  const V = { on:false, llamadaLista:false, actual:null, opciones:[], audio:null, cache:new Map(), PREFETCH:true };

  async function api(path, body){
    const r = await fetch(base()+path, body ? { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) } : {});
    let j = {}; try { j = await r.json(); } catch(_){}
    if(!r.ok || j.ok===false) throw new Error(j.reason || ('HTTP '+r.status));
    return j;
  }

  V.init = async function(){
    try{
      let j = await api('/api/voz/estado');
      // Nadie eligió voces todavía (voz.html) → se ofrecen las prediseñadas de ElevenLabs aptas para español, primero las de mujer.
      // Las clonadas de la cuenta quedan fuera: son voces de personas reales y solo se usan si la familia las elige.
      if(j.tts && !(j.opciones||[]).length && !V._sembrado){
        V._sembrado = true;
        const vs = (await api('/api/voz/voces')).voces.filter(v => v.es && v.category==='premade')
          .sort((a,b) => (b.gender==='female') - (a.gender==='female'))
          .slice(0, 6).map(v => ({ id:v.id, name:v.name.split(' - ')[0].trim(), kind: v.category==='cloned' ? 'clonada' : 'biblioteca', preview:v.preview }));
        if(vs.length){ const r = await api('/api/voz/opciones', { opciones:vs, actual:vs[0].id }); j = { ...j, actual:r.actual, opciones:r.opciones }; }
      }
      V.actual = j.actual; V.opciones = j.opciones || []; V.llamadaLista = !!j.llamada;
      V.on = !!(j.tts && j.actual);
      // Reacciones (8 frases cortas): audio listo de antemano. La caché evita repetir el pedido cada 30 s.
      if(V.on && typeof REACTS!=='undefined') V.prefetch(REACTS.map(r=>[r[1], r[2]]));
      console.log('[voz] ElevenLabs', V.on ? 'activa: '+V.nombre() : 'sin voz elegida', '· llamada', V.llamadaLista ? 'lista' : 'no configurada');
    }catch(e){ V.on = false; console.log('[voz] bridge sin ElevenLabs:', e.message); }
    if(typeof renderSettings==='function' && window.S && S.screen==='settings') renderSettings();
  };
  V.nombre = () => (V.opciones.find(o=>o.id===V.actual)||{}).name || '';

  // ---------- texto a voz ----------
  const key = (t,e) => V.actual+'|'+e+'|'+t;
  function fetchAudio(text, emo){
    const k = key(text, emo);
    if(V.cache.has(k)) return V.cache.get(k);
    const p = fetch(base()+'/api/voz/tts', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ text, emo }) })
      .then(async r => { if(!r.ok) throw new Error('tts HTTP '+r.status); return URL.createObjectURL(await r.blob()); });
    p.catch(()=>V.cache.delete(k));
    V.cache.set(k, p);
    if(V.cache.size>60){ const [old] = V.cache.keys(); V.cache.get(old).then(u=>URL.revokeObjectURL(u),()=>{}); V.cache.delete(old); }
    return p;
  }
  V.prefetch = function(items){ if(!V.on || !V.PREFETCH) return; items.forEach(([t,e]) => { if(t) fetchAudio(t, e).catch(()=>{}); }); };
  V.stop = function(){ if(V.audio){ V.audio.pause(); V.audio = null; } };
  V.speak = async function(text, emo='seria'){
    const clean = String(text).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,'').trim();
    if(!clean) return;
    const url = await fetchAudio(clean, emo);
    V.stop();
    const a = new Audio(url); V.audio = a;
    await new Promise((ok, ko) => { a.onended = ok; a.onerror = () => ko(new Error('audio')); a.play().catch(ko); });
    if(V.audio===a) V.audio = null;
  };

  // ---------- Marta elige su voz desde la TV ----------
  V.siguiente = async function(){
    if(!V.opciones.length) return false;
    const i = V.opciones.findIndex(o=>o.id===V.actual);
    const next = V.opciones[(i+1) % V.opciones.length];
    try{ await api('/api/voz/elegir', { id:next.id }); V.actual = next.id; V.on = true; }
    catch(e){ if(window.island) island('⚠️','No pude cambiar la voz: '+e.message); return true; }
    return true;
  };

  // ---------- alarma → llamada de emergencia ----------
  V.emergencia = async function(A){
    const sub = document.getElementById('alSub');
    const set = t => { if(S.alarm===A && !A.ack && sub) sub.textContent = t; };
    if(!V.llamadaLista) return;   // sin llamada configurada (URL pública, sin Twilio): la alarma sigue siendo una simulación y lo dice
    // Llamada real: la pantalla deja de decir "simulación".
    A.real = true;
    const big = document.getElementById('alBig'), cerrar = document.getElementById('alDismiss');
    if(big) big.textContent = 'Pidiendo ayuda';
    if(cerrar) cerrar.textContent = 'Cerrar alarma';
    set('📞 Llamando al contacto de emergencia…');
    try{
      const j = await api('/api/emergencia/llamar', { alarmId:String(A.t0), motivo:'activó la alarma de emergencia' });
      if(typeof log==='function') log('llamada de emergencia: '+(j.conversationId||'ok'));
      let esperas = 0;
      const poll = setInterval(async () => {
        if(S.alarm!==A || A.ack){ clearInterval(poll); return; }
        try{
          const e = await api('/api/emergencia/estado'), quien = e.contacto || 'Tu contacto';
          if(e.estado==='failed'){ set(`⚠️ ${quien} no contestó · la llamada falló`); clearInterval(poll); return; }
          if(e.estado==='done' && e.viene===true){ clearInterval(poll); confirmada(A, quien, e.respuesta); return; }
          if(e.estado==='done' && e.viene===false){ clearInterval(poll);
            set(`⚠️ ${quien} no puede ir${e.respuesta ? ': '+e.respuesta : ''}`);
            if(window.island) island('⚠️', `${quien} no puede ir. La alarma sigue activa.`); return; }
          set({ initiated:`📤 Llamada enviada a ${quien} · sonando…`,
                'in-progress':`📞 ${quien} contestó · está escuchando el aviso`,
                processing:'📞 Llamada terminada · confirmando la respuesta…',
                done:'📞 Llamada terminada · confirmando la respuesta…' }[e.estado] || '');
          if(e.estado==='done' && ++esperas>8){ set(`📞 ${quien} recibió el aviso · falta confirmar con el llavero`); clearInterval(poll); }
        }catch(_){}
      }, 4000);
    }catch(e){
      set('⚠️ No se pudo llamar: '+e.message);
      if(window.island) island('⚠️','Llamada de emergencia falló: '+e.message);
    }
  };

  // El contacto confirmó por teléfono que viene: misma confirmación que el llavero (pantalla verde).
  // Un segundo toque del llavero marca la emergencia como resuelta, igual que hoy.
  function confirmada(A, quien, respuesta){
    if(S.alarm!==A || A.ack) return;
    A.ack = performance.now(); const secs = Math.round((A.ack-A.t0)/1000);
    const $ = s => document.querySelector(s);
    $('#alarm').classList.add('ack'); $('#alSym').innerHTML = '<svg><use href="#i-check"/></svg>';
    $('#alBig').textContent = `${quien} viene en camino`;
    $('#alSub').textContent = respuesta ? `“${respuesta}” · respondió por teléfono en ${secs} s` : `Confirmó por teléfono en ${secs} s`;
    const tl = $('#alTl'); if(tl) tl.style.display = 'none';   // la línea de tiempo no existe en todas las versiones de la TV
    $('#alCancel').textContent = 'Toque del llavero = resuelto';
    if(typeof log==='function') log(`emergencia: ${quien} confirmó por teléfono (${secs} s)`);
    if(typeof beep==='function'){ beep(660,160,.08); setTimeout(()=>beep(880,220,.08),180); }
    // Aviso hablado con la voz del sistema (no con la de Marta: es WOKI quien le avisa).
    try{ speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(`${quien} viene en camino`); u.lang = 'es-CL'; speechSynthesis.speak(u); }catch(_){}
    if(typeof renderStatus==='function') renderStatus();
    if(typeof updateLCD==='function') updateLCD();
  }

  window.VOZ = V;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', V.init); else setTimeout(V.init, 0);
  setInterval(V.init, 30000);   // recoge las voces que la familia guarde desde voz.html
})();
