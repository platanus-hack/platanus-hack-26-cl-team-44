function createMyoMessaging({
  $, $$, S, CFG, esc, EMO, RULES, DEFAULT, REACTS, GROUPS, WORDS, pickVariants,
  getMemory, go, renderCards, renderStatus, renderKbText, stagger, decorate, log, beep, island, clearFocus,
}) {
  const digitsOf=s=>String(s||'').replace(/\D/g,'');
  const initial=n=>(String(n||'?').trim()[0]||'?').toUpperCase();
  const FACE=['linear-gradient(160deg,#5BE584,#1FA348)','linear-gradient(160deg,#64D2FF,#0A84FF)','linear-gradient(160deg,#FF9F0A,#FF375F)',
    'linear-gradient(160deg,#BF5AF2,#5E5CE6)','linear-gradient(160deg,#FFD60A,#FF9F0A)','linear-gradient(160deg,#FF6482,#BF5AF2)'];
  const faceOf=c=>FACE[Math.abs([...digitsOf(c&&c.phone)||String(c&&c.name)].reduce((a,ch)=>(a*31+ch.charCodeAt(0))|0,7))%FACE.length];
  const WA={ online:false, session:null, favs:[], to:null, text:'', idem:null, inKey:null, sending:false, lastMsg:null, hist:{}, mention:null, sug:{} };
  const HINT0='<b>Ceja</b> decir';
  const hhmm=t=>new Date(t).toTimeString().slice(0,5);
  const TICKS={1:'🕓',2:'✓',3:'✓✓',4:'leído'};
  // Chat con el contacto actual: últimos mensajes (lo que llega, lo que Emmy envía y lo que se escribe desde el celular).
  function renderChat(){
    const on=!!WA.to; $('#s-talk').classList.toggle('chatmode',on);
    $('#talkHint').innerHTML= on? '<b>Ceja</b> elegir respuesta' : HINT0;
    if(!on) return;
    const c=WA.to, list=(WA.hist[c.id]||[]).slice(-10);
    $('#chatH').innerHTML=`<span class="live"></span>Chat con ${esc(c.name)}`;
    $('#chatList').innerHTML= list.length? list.map(m=>{
        const meta= m.dir==='in'? hhmm(m.at) : `${m.via==='phone'?'desde el celular · ':''}${hhmm(m.at)}${m.status&&TICKS[m.status]?' · '+TICKS[m.status]:''}`;
        return `<div class="msg ${m.dir}">${esc(m.text)}<span class="meta">${meta}</span></div>`; }).join('')
      : `<div class="chat-empty">Todavía no hay mensajes con ${esc(c.name)}.</div>`;
  }
  function waAddMsg(cid,m){
    const a=WA.hist[cid]||(WA.hist[cid]=[]);
    if(a.some(x=>x.id===m.id)) return;
    a.push(m); if(a.length>60) a.splice(0,a.length-60);
    if(WA.to && WA.to.id===cid) renderChat();
  }
  async function waLoadHistory(cid){
    if(String(cid).startsWith('g:')){ if(WA.to && WA.to.id===cid) renderChat(); return; }   // grupo: el historial lo trae la mención
    try{ const j=await waApi('/api/wa/history?contactId='+encodeURIComponent(cid)); WA.hist[cid]=j.messages||[]; }catch(_){}
    if(WA.to && WA.to.id===cid) renderChat();
  }
  /* ---- Respuestas del chat: 2 contextuales + «Pregúntele a…» + «Otro» + teclado de iniciales ---- */
  const GENERIC=[['Sí, me parece bien.','de acuerdo','seria'],['No estoy segura.','duda','seria']];
  const toCard=([text,tone,emo])=>({text,tone,emo:EMO[emo]?emo:'seria'});
  function waHelper(){   // el acompañante: un contacto principal con relación de cuidado; si no hay, ''
    const h=WA.favs.find(c=>/cuidador|acompa|enfermer/i.test(c.relation||''));
    return h? h.name.split(' ')[0] : '';
  }
  function waSetPool(cards,generic){
    const seen=new Set(), pool=[];
    for(const c of [...(generic? GENERIC.map(toCard):[]), ...cards, ...(generic?[]:GENERIC.map(toCard)), ...pickVariants('wa-default',DEFAULT).map(toCard)])
      if(!seen.has(c.text)){ seen.add(c.text); pool.push(c); }
    S.pool=pool; S.poolPage=0; waPage();
  }
  function waPage(){
    const n=Math.max(1,Math.ceil(S.pool.length/2)), p=S.poolPage%n;
    const two=S.pool.slice(p*2,p*2+2);
    const quien=waHelper();   // sin acompañante en los contactos: una frase neutra (antes salía «Camila», del perfil de prueba)
    S.cards=[...two, quien? {text:`Pregúntele a ${quien}.`, tone:'lo decide tu acompañante', emo:'seria', plain:true}
                           : {text:'Después te respondo.', tone:'lo dejo para después', emo:'seria', plain:true}];
  }

  /* ---- Claude (vía el puente): respuestas según la conversación y predicción por iniciales ---- */
  const aiCard=x=>({text:x.text, tone:(x.tone||'sugerida'), emo:EMO[x.emo]?x.emo:'seria', ai:true, traza:x.traza||{origen:'whatsapp'}});
  const lastKey=cid=>{ const h=WA.hist[cid]||[]; return h.length? h[h.length-1].id : '-'; };
  async function waAi(body,ms=15000){
    const ctl=new AbortController(); const t=setTimeout(()=>ctl.abort(),ms);
    try{ const j=await waApi('/api/wa/suggest',{method:'POST',body:JSON.stringify(body),signal:ctl.signal}); return j; }
    finally{ clearTimeout(t); }
  }
  // Las 2 tarjetas contextuales: primero lo local (al instante) y cuando Claude responde, se reemplazan.
  async function waAiReplies(){
    const c=WA.to; if(!c || !CFG.WA_AI || !CFG.WA_URL) return;
    const key=lastKey(c.id), cached=WA.sug[c.id];
    if(cached && cached.key===key) return waApplyAi(c.id, cached.list);
    const ctx=$('#ctxIn').value.trim(), last=(WA.hist[c.id]||[]).slice(-1)[0];
    const extra = ctx && !(last && last.text===ctx) ? ctx : '';
    S.aiWait=true; renderCards();
    try{ const j=await waAi({contactId:c.id, context:extra});
      if(j.suggestions && j.suggestions.length){ WA.sug[c.id]={key:j.key, list:j.suggestions}; waApplyAi(c.id, j.suggestions); } }
    catch(e){ log('Claude no respondió: quedan las sugerencias locales'); }
    finally{ S.aiWait=false; if(S.screen==='talk') renderCards(); }
  }
  function waApplyAi(cid,list){
    if(!WA.to || WA.to.id!==cid || S.kb.mode==='ini') return;
    if(S.poolAi && S.poolAi===list) return;
    S.poolAi=list; waSetPool(list.map(aiCard), false); S.aiWait=false;
    if(S.screen==='talk') renderCards();
  }
  // Predicción paso a paso: con cada letra se pide a Claude (300 ms de espera para no pedir de más).
  function iniAsk(){
    const c=WA.to, ini=S.kb.ini||'';
    clearTimeout(S.iniT);
    if(!c || !ini || !CFG.WA_AI || !CFG.WA_URL){ S.kb.ai=null; return; }
    if(S.kb.ai && S.kb.ai.ini===ini) return;
    S.kb.ai={ini, list:null, p:null};
    S.iniT=setTimeout(()=>{ const ai=S.kb.ai; if(!ai || ai.ini!==ini) return;
      ai.p=waAi({contactId:c.id, initials:ini}).then(j=>{ ai.list=(j.suggestions||[]).map(aiCard); })
        .catch(()=>{ ai.list=[]; }).finally(()=>{ if(S.screen==='keyboard' && S.kb.mode==='ini' && S.kb.ai===ai){ renderKbText(); markLikelyKeys(); } });
    },300);
  }
  function iniCandidates(){   // Claude primero (si ya llegó para estas letras), luego lo local
    const ini=S.kb.ini||'', ai=S.kb.ai && S.kb.ai.ini===ini && S.kb.ai.list ? S.kb.ai.list : [];
    const seen=new Set(), out=[];
    for(const c of [...ai, ...iniLocal(ini)]) if(!seen.has(c.text)){ seen.add(c.text); out.push(c); }
    return out;
  }
  // Imán dirigido: los grupos de letras que contienen la próxima inicial más probable quedan marcados y atraen más.
  function markLikelyKeys(){
    if(S.kb.mode!=='ini' || S.kb.level!==1) return;
    const ini=fold(S.kb.ini||''), next=new Map();
    iniCandidates().slice(0,6).forEach((c,i)=>{ const k=initialsOf(c.text); if(k.startsWith(ini) && k.length>ini.length){ const l=k[ini.length]; next.set(l,(next.get(l)||0)+(6-i)); } });
    const keys=$$('#keys .key[data-act^="grp:"]'), ws=keys.map(el=>{ const g=fold(GROUPS[+el.dataset.act.slice(4)]); let w=0; for(const [l,v] of next) if(g.includes(l)) w+=v; return w; });
    const top=Math.max(0,...ws);
    keys.forEach((el,i)=>{ el.dataset.prior = ws[i]? (1+Math.min(.8,ws[i]/12)).toFixed(2) : '1';
      el.classList.toggle('likely', ws[i]===top && top>=4); });   // solo el grupo más probable se marca
  }

  /* ---- Teclado por iniciales: Emmy elige la primera letra de cada palabra y Myo completa la frase ---- */
  const fold=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  const initialsOf=t=>(fold(t).match(/[a-zñ0-9]+/g)||[]).map(w=>w[0]).join('');
  function kbIni(){ S.kb={level:1,group:null,text:'',mode:'ini',ini:''}; go('keyboard'); }
  function iniCorpus(){
    const out=[], add=(t,tone,emo,w)=>{ if(t && !out.some(x=>x.text===t)) out.push({text:t,tone,emo,w}); };
    for(const m of Object.values(WA.hist).flat()) if(m.dir==='out') add(m.text,'ya lo escribiste','seria',3);   // lo que Emmy ya mandó
    for(const p of getMemory().m.phrases) add(p.t,'ya lo dijiste','seria',2);
    for(const r of RULES) for(const s of r.s.flat()) add(s[0],s[1],s[2],1);   // todas las formas de cada posición
    for(const s of [...GENERIC,...DEFAULT.flat()]) add(s[0],s[1],s[2],1);
    for(const r of REACTS) add(r[1][0].toUpperCase()+r[1].slice(1),'reacción',r[2],0);
    return out;
  }
  function iniLocal(ini){
    const q=fold(ini); if(!q) return [];
    const hits=iniCorpus().map(c=>{ const k=initialsOf(c.text); return {c, exact:k===q, pre:k.startsWith(q)}; })
      .filter(x=>x.pre).sort((a,b)=>(b.exact-a.exact)||(b.c.w-a.c.w)).map(x=>x.c);
    if(hits.length<4){   // palabra por palabra con las palabras más usadas que empiezan con cada letra
      const words=[...q].map(l=>{ const mine=getMemory().top(l)[0]; return mine || WORDS.find(w=>fold(w)[0]===l) || l; });
      const t=words.join(' '); hits.push({text:t[0].toUpperCase()+t.slice(1)+'.', tone:'palabra por palabra', emo:'seria'});
    }
    return hits.slice(0,6);
  }
  async function kbExpand(){
    const ini=S.kb.ini||''; if(!ini){ island('🔤','Elige al menos una letra',true); return; }
    let out=null;
    if(CFG.WA_AI && WA.to && CFG.WA_URL){
      if(!S.kb.ai || S.kb.ai.ini!==ini || (!S.kb.ai.p && !S.kb.ai.list)){ clearTimeout(S.iniT);
        const ai=S.kb.ai={ini,list:null,p:null}; ai.p=waAi({contactId:WA.to.id, initials:ini}).then(j=>{ ai.list=(j.suggestions||[]).map(aiCard); }).catch(()=>{ ai.list=[]; }); }
      if(!S.kb.ai.list){ island('✨','Completando la frase…',false,0);
        await Promise.race([S.kb.ai.p, new Promise(r=>setTimeout(r,9000))]); island('✨','Listo',false,600); }
      const c=iniCandidates(); if(c.length) out=c.slice(0,6).map(x=>({text:x.text,tone:x.tone,emo:EMO[x.emo]?x.emo:'seria',ai:x.ai,traza:x.traza||(x.ai?null:{origen:'local',nota:'frases locales por iniciales'})}));
    }
    if(!out && CFG.EXPAND_URL){ try{ const ctl=new AbortController(); setTimeout(()=>ctl.abort(),2500);
        const r=await fetch(CFG.EXPAND_URL,{method:'POST',headers:{'Content-Type':'application/json'},signal:ctl.signal,
          body:JSON.stringify({initials:ini,context:$('#ctxIn').value.trim(),contactId:WA.to&&WA.to.id})});
        out=(await r.json()).suggestions.slice(0,6).map(x=>({text:x.text,tone:x.tone||'por iniciales',emo:EMO[x.emo]?x.emo:'seria'})); }
      catch(e){ log('Claude no respondió, completo con frases locales'); } }
    if(!out||!out.length) out=iniLocal(ini).map(c=>({text:c.text,tone:c.tone,emo:EMO[c.emo]?c.emo:'seria'}));
    S.kb.mode='text'; S.pool=out; S.poolPage=0; waPage(); log('iniciales '+ini.toUpperCase()+' → '+out.length+' frases');
    go('talk');
  }

  // Mención en un grupo. Si el grupo tiene un disparador activo, el agente manda opciones y el grupo
  // se abre como un chat más: se responde con la misma confirmación de doble ceja. Si no, solo aviso.
  // El puente es la fuente de verdad: cada mención trae id y estado. La TV no repite una que ya mostró.
  WA.menciones={};   // id → mención (con estado: pendiente | respondida)
  function waMention(ev){
    if(ev.id){ if(WA.menciones[ev.id]) return; WA.menciones[ev.id]=ev; }
    if(ev.estado==='respondida') return;
    WA.mention={...ev, at:Date.now()};
    beep(988,140,.05); setTimeout(()=>beep(1318,160,.05),170);
    island('@',`${ev.from} te mencionó en «${ev.group}»: ${ev.resumen||ev.text}`,false,10000);
    log(`mención en «${ev.group}»${ev.opciones?' · el agente preparó respuestas':''}`); renderStatus();
    if(!(ev.opciones && ev.opciones.length && ev.groupJid)) return;
    const g={id:'g:'+ev.groupJid, name:ev.group, relation:'grupo', phone:'', group:ev.groupJid, mention:ev.mentionJid||'', mentionId:ev.id||''};
    WA.mentionPend=g;   // si la TV está ocupada (calibración, alarma), se abre al terminar
    const mid='mention-'+WA.mention.at;
    WA.hist[g.id]=[{id:mid, dir:'in', text:`${ev.from}: ${ev.text}`, at:WA.mention.at}];
    WA.sug[g.id]={key:mid, list:ev.opciones};
    const busy=S.alarm || S.rest || $('#calib').classList.contains('on') || document.body.classList.contains('panel') || (S.screen==='agent' && S.agentPending);
    if(busy) return;                                                          // nunca interrumpe una alarma ni una confirmación en curso
    waAbrirMencion(g);
  }
  function waAbrirMencion(g){
    const ev=WA.menciones[g.mentionId]||WA.mention; WA.mentionPend=null;
    if(ev && ev.estado==='respondida') return;
    waStart(g,{text:ev.text, key:WA.sug[g.id]?.key});
    setCtx(`${ev.from} te mencionó en ${ev.group}`, initial(ev.from), ev.text, CTX0.ph, faceOf({name:ev.from}));
  }
  // Pide al puente las menciones de los últimos 10 minutos. Se llama al conectarse y al salir de la calibración.
  async function waRevisarMenciones(){
    if(!CFG.WA_URL) return;
    let lista=[]; try{ lista=(await waApi('/api/wa/mentions')).mentions||[]; }catch(e){ log('WhatsApp menciones: '+e.message); return; }
    for(const m of lista) if(WA.menciones[m.id] && m.estado==='respondida' && WA.menciones[m.id].estado!=='respondida') waMencionRespondida(m.id);
    // Solo cuenta la más reciente que esta TV no vio; las más viejas quedan como vistas (ya no vienen al caso).
    const nuevas=lista.filter(m=>m.estado==='pendiente' && !WA.menciones[m.id]);
    for(const m of nuevas.slice(1)) WA.menciones[m.id]=m;
    if(nuevas[0] && (!WA.mentionPend || nuevas[0].at>(WA.menciones[WA.mentionPend.mentionId]?.at||0))){ waMention(nuevas[0]); return; }
    const g=WA.mentionPend;
    const busy=S.alarm || S.rest || $('#calib').classList.contains('on') || document.body.classList.contains('panel') || (S.screen==='agent' && S.agentPending);
    if(g && !busy) waAbrirMencion(g);
  }
  // Otra TV respondió: esta la marca como respondida y no deja enviar otra vez.
  function waMencionRespondida(id){
    const m=WA.menciones[id]; if(m) m.estado='respondida';
    if(WA.mentionPend && WA.mentionPend.mentionId===id) WA.mentionPend=null;
    if(!WA.to || WA.to.mentionId!==id || WA.sending) return;
    WA.to.respondida=true;
    island('✓',`Ya se respondió en «${WA.to.name}»`,false,5000); log('mención respondida desde otra pantalla');
    if(S.screen==='agent' || S.screen==='talk'){ waReset(); go('home'); }
  }
  const CTX0={ label:'Sofía dice', av:'S', val:'¿Vienes a cenar el domingo?', ph:'El acompañante escribe y aprieta Enter' };

  async function waApi(path,opts={}){
    const r=await fetch(CFG.WA_URL+path,{...opts, headers: { ...(opts.body? {'Content-Type':'application/json'} : {}), ...(CFG.WA_TOKEN? {'X-Myo-Token':CFG.WA_TOKEN} : {}) }});
    let j={}; try{ j=await r.json(); }catch(_){}
    if(!r.ok || j.ok===false) throw new Error(j.reason || ('HTTP '+r.status));
    return j;
  }
  async function waLoadFavs(){
    if(!CFG.WA_URL) return;
    try{ WA.favs=(await waApi('/api/wa/favorites')).contacts||[]; }catch(e){ log('WhatsApp: '+e.message); }
    if(S.screen==='contacts') renderPeople();
  }
  function renderPeople(){
    const f=WA.favs.slice(0,6); let html='';
    if(!CFG.WA_URL) html='<div class="empty-favs glass" style="border-radius:var(--r-lg)">WhatsApp no está configurado<small>Falta CFG.WA_URL</small></div>';
    else if(!f.length) html='<div class="empty-favs glass" style="border-radius:var(--r-lg)">Aún no hay contactos principales<small>El acompañante los elige con la tecla K o con «Ajustar».</small></div>';
    html+=f.map((c,i)=>`<div class="t person" data-t data-act="waTo:${i}"><div class="face" style="background:${faceOf(c)}">${esc(initial(c.name))}</div><div class="lb">${esc(c.name)}</div><div class="sb">${esc(c.relation||'WhatsApp')}</div></div>`).join('');
    html+='<div class="t person tool" data-t data-act="waPanel"><div class="face">＋</div><div class="lb">Ajustar</div><div class="sb">lo hace el acompañante</div></div>';
    html+='<div class="t person tool" data-t data-act="go:home"><div class="face">←</div><div class="lb">Volver</div><div class="sb">Inicio</div></div>';
    $('#people').innerHTML=html; stagger($('#people')); decorate($('#people'));
  }
  function setCtx(label,av,val,ph,bg){
    $('#s-talk .ctx label').textContent=label; const a=$('#s-talk .ctx .avatar'); a.textContent=av; a.style.background=bg||'';
    $('#ctxIn').value=val; $('#ctxIn').placeholder=ph;
  }
  // Empieza un mensaje para un contacto principal (elegido por Emmy o porque ese contacto escribió).
  function waStart(c,{text='',key=null}={}){
    if(!c) return;
    WA.to=c; WA.inKey=key; WA.idem=null;
    setCtx(key? `${c.name} dice` : `Para ${c.name}`, initial(c.name), text,
      key? CTX0.ph : 'Contexto (opcional)', faceOf(c));
    S.cards=[]; S.poolAi=null; renderChat(); waLoadHistory(c.id).then(()=>{ if(WA.to===c && S.screen==='talk') waAiReplies(); }); go('talk');
  }
  function waReset(){
    if(!WA.to) return;
    WA.to=null; WA.inKey=null; WA.idem=null; setCtx(CTX0.label,CTX0.av,CTX0.val,CTX0.ph); S.cards=[]; S.kb.mode='text'; renderChat();
  }
  // Pantalla de confirmación: destinatario y texto en grande; se envía solo con la doble ceja.
  function openAgent(text){
    const c=WA.to; if(!c) return;
    WA.text=text; WA.idem=crypto.randomUUID();
    $('#agAv').textContent=initial(c.name); $('#agAv').style.background=faceOf(c);
    $('#agTitle').textContent=(WA.inKey?'Responder a ':'Escribir a ')+c.name;
    $('#agTo').textContent=c.name+(c.relation?` (${c.relation})`:'');
    $('#agentMsg').textContent=text;
    go('agent');
  }
  async function waSend(){
    const c=WA.to;
    if(!c){ island('⚠️','Primero elige a quién escribir',true); go('contacts'); return; }
    if(c.respondida){ island('✓',`Ya se respondió en «${c.name}»`,false,4000); go('home'); return; }
    if(WA.sending) return; WA.sending=true;
    island('…',`Enviando a ${c.name}…`,false,0);
    try{
      const msg = c.group ? {groupJid:c.group, mention:c.mention, mentionId:c.mentionId||undefined, text:WA.text, idemKey:WA.idem} : {contactId:c.id, text:WA.text, idemKey:WA.idem};
      const j=await waApi('/api/wa/send',{method:'POST',body:JSON.stringify(msg)});
      WA.lastMsg={id:j.msgId,name:c.name};
      if(window.MYO_SELECCION) window.MYO_SELECCION(WA.text, c.group?'grupo':'whatsapp');   // registro sin texto: origen, posición, editada
      island('✓', j.dry? `Enviado a ${c.name} (prueba)` : `Enviado a ${c.name}`); getMemory().add(WA.text); log('WhatsApp → '+c.name);
      if(c.mentionId && WA.menciones[c.mentionId]) WA.menciones[c.mentionId].estado='respondida';
      go('home');
    }catch(e){
      if(c.mentionId && /Ya se respondió|Otra pantalla/.test(e.message)){ c.respondida=true; island('✓',e.message,false,5000); go('home'); }
      else island('⚠️','No se envió: '+e.message,true,5000);
      log('WhatsApp error: '+e.message);
    }
    finally{ WA.sending=false; }
  }
  function waIncoming(ev){
    const c=WA.favs.find(x=>x.id===ev.contactId) || {id:ev.contactId,name:ev.name,relation:ev.relation,phone:''};
    log('WhatsApp ← '+c.name); beep(880,120,.04);
    island('💬',`${c.name}: ${ev.text}`,false,6000);
    const busy=S.alarm || S.rest || $('#calib').classList.contains('on') || document.body.classList.contains('panel') || (S.screen==='agent' && S.agentPending);
    if(!busy) waStart(c,{text:ev.text,key:ev.key});   // nunca interrumpe una alarma ni una confirmación en curso
  }
  function waListen(){
    if(!CFG.WA_URL || !window.tokiSSE) return;
    const es={};   // toki-sse.js: fetch con el token en un header (EventSource solo podría mandarlo en la URL)
    let revision=0;
    es.onopen=()=>{
      const current=++revision;
      WA.online=true; WA.session=null; renderStatus(); waLoadFavs(); waRevisarMenciones();
      waApi('/api/wa/health').then(health=>{
        if(revision===current){ WA.session=health.session; renderStatus(); }
      }).catch(()=>{});
    };
    es.onerror=()=>{ ++revision; WA.session=null; if(WA.online) log('WhatsApp sin conexión'); WA.online=false; renderStatus(); };   // reconecta solo a los 3 s
    es.onmessage=m=>{ let ev; try{ ev=JSON.parse(m.data); }catch(_){ return; }
      if(ev.type==='chat' && ev.msg) waAddMsg(ev.contactId, ev.msg);
      if(ev.type==='mention') waMention(ev);
      if(ev.type==='mention_estado' && ev.estado==='respondida') waMencionRespondida(ev.id);
      if(ev.type==='suggest' && ev.suggestions){ WA.sug[ev.contactId]={key:ev.key, list:ev.suggestions};
        if(S.screen==='talk' && WA.to && WA.to.id===ev.contactId && lastKey(ev.contactId)===ev.key) waApplyAi(ev.contactId, ev.suggestions); }
      if(ev.type==='incoming') waIncoming(ev);
      if(ev.type==='status'){ const h=(WA.hist[ev.contactId]||[]).find(x=>x.msgId===ev.msgId); if(h){ h.status=ev.status; if(WA.to && WA.to.id===ev.contactId) renderChat(); } }
      if(ev.type==='status' && WA.lastMsg && ev.msgId===WA.lastMsg.id){
        if(ev.status===4) island('✓✓',`${WA.lastMsg.name} lo leyó`);
        if(ev.status===0) island('⚠️','WhatsApp no pudo entregar el mensaje',true,4000); }
      if(ev.type==='session' && ev.status){
        ++revision; WA.session=ev.status; renderStatus();
        // Aviso solo si sigue desconectado a los 15 s: un reinicio del puente o de wapi se recupera en ~3 s.
        clearTimeout(WA.avisoDesc);
        if(ev.status!=='connected') WA.avisoDesc=setTimeout(()=>{ if(WA.session!=='connected') island('⚠️','WhatsApp se desconectó',true,5000); },15000);
      }
    };
    window.tokiSSE(CFG.WA_URL+'/api/wa/events', CFG.WA_TOKEN? {'X-Myo-Token':CFG.WA_TOKEN} : {}, es);
    // Al salir de la calibración (la cierran varios caminos): revisa si quedó una mención por responder.
    let enCalib=$('#calib').classList.contains('on');
    new MutationObserver(()=>{ const on=$('#calib').classList.contains('on'); if(enCalib && !on) setTimeout(waRevisarMenciones,400); enCalib=on; })
      .observe($('#calib'),{attributes:true,attributeFilter:['class']});
  }

  /* ---- Panel del acompañante: elegir contactos principales ---- */
  const WAP={ all:[], sel:[], q:'' };
  async function openPanel(){
    if(!CFG.WA_URL){ island('⚠️','WhatsApp no está configurado',true); return; }
    document.body.classList.add('panel'); $('#waPanel').classList.add('on'); clearFocus();
    WAP.q=''; $('#wapQ').value=''; WAP.sel=[]; renderSel(); $('#wapList').innerHTML=''; $('#wapNote').textContent='';
    const msg=$('#wapMsg'); msg.className=''; msg.textContent='Trayendo tus contactos de WhatsApp…';
    try{
      const [book,favs]=await Promise.all([waApi('/api/wa/contacts'),waApi('/api/wa/favorites')]);
      WAP.all=book.contacts||[];
      const has=new Set(WAP.all.map(c=>digitsOf(c.phone)));
      WAP.sel=(favs.contacts||[]).filter(c=>has.has(digitsOf(c.phone))).map(c=>({phone:c.phone,name:c.name,relation:c.relation||''}));
      const dropped=(favs.contacts||[]).length-WAP.sel.length;
      msg.textContent= dropped? `${dropped} contacto${dropped>1?'s':''} de prueba no está${dropped>1?'n':''} en tu WhatsApp y se quitará${dropped>1?'n':''} al guardar.` : '';
      renderList(); renderSel(); $('#wapQ').focus();
    }catch(e){ msg.textContent='No pude traer tus contactos: '+e.message; msg.className='err'; }
  }
  function closePanel(){ $('#waPanel').classList.remove('on'); document.body.classList.remove('panel'); }
  function renderList(){
    const q=WAP.q.trim().toLowerCase(), qd=digitsOf(q);
    const m=WAP.all.filter(c=>!q || c.name.toLowerCase().includes(q) || (qd.length>2 && digitsOf(c.phone).includes(qd)));
    const shown=m.slice(0,80), picked=new Set(WAP.sel.map(s=>digitsOf(s.phone))), full=WAP.sel.length>=6;
    $('#wapList').innerHTML=shown.map(c=>{ const on=picked.has(digitsOf(c.phone));
      return `<button class="wap-row${on?' on':''}" data-ph="${esc(c.phone)}" role="option" aria-selected="${on}"${!on&&full?' disabled':''}>
        <span class="av" style="background:${faceOf(c)}">${esc(initial(c.name))}</span>
        <span style="min-width:0"><div class="nm">${esc(c.name)}</div><div class="ph">${esc(c.phone)}</div></span>
        <span class="ck">${on?'✓':''}</span></button>`; }).join('') || '<div class="wap-note">Nada coincide con la búsqueda.</div>';
    $('#wapNote').textContent= m.length>shown.length? `Mostrando ${shown.length} de ${m.length}. Escribe para afinar.` : `${m.length} contacto${m.length===1?'':'s'}${full?' · ya elegiste 6':''}`;
  }
  function renderSel(){
    $('#wapCount').textContent=`${WAP.sel.length}/6`;
    $('#wapSel').innerHTML= WAP.sel.map((s,i)=>`<div class="wap-chip">
        <span style="grid-row:1 / span 2;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:15px;font-weight:700;color:#fff;background:${faceOf(s)}">${esc(initial(s.name))}</span>
        <div class="nm">${esc(s.name)}</div>
        <input data-i="${i}" value="${esc(s.relation)}" placeholder="Relación: hija, cuidadora…" maxlength="30" aria-label="Relación con ${esc(s.name)}">
        <button class="rm" data-rm="${i}" aria-label="Quitar a ${esc(s.name)}">✕</button></div>`).join('')
      || '<div class="wap-note">Elige contactos de la lista de la izquierda.</div>';
  }
  $('#wapQ').addEventListener('input',e=>{ WAP.q=e.target.value; renderList(); });
  $('#wapList').addEventListener('click',e=>{
    const b=e.target.closest('.wap-row'); if(!b || b.disabled) return;
    const d=digitsOf(b.dataset.ph), i=WAP.sel.findIndex(s=>digitsOf(s.phone)===d);
    if(i>=0) WAP.sel.splice(i,1);
    else if(WAP.sel.length<6){ const c=WAP.all.find(x=>digitsOf(x.phone)===d); if(c) WAP.sel.push({phone:c.phone,name:c.name,relation:''}); }
    renderList(); renderSel();
  });
  $('#wapSel').addEventListener('input',e=>{ const i=e.target.dataset.i; if(i!=null && WAP.sel[+i]) WAP.sel[+i].relation=e.target.value; });
  $('#wapSel').addEventListener('click',e=>{ const b=e.target.closest('[data-rm]'); if(!b) return; WAP.sel.splice(+b.dataset.rm,1); renderList(); renderSel(); });
  $('#wapClose').onclick=$('#wapCancel').onclick=closePanel;
  $('#waPanel').addEventListener('click',e=>{ if(e.target.id==='waPanel') closePanel(); });
  $('#wapSave').onclick=async()=>{
    const b=$('#wapSave'), msg=$('#wapMsg'); b.disabled=true; msg.className=''; msg.textContent='Guardando…';
    try{
      const j=await waApi('/api/wa/favorites',{method:'POST',body:JSON.stringify({contacts:WAP.sel})});
      WA.favs=j.contacts||[]; closePanel(); island('👥',`${WA.favs.length} contacto${WA.favs.length===1?'':'s'} principal${WA.favs.length===1?'':'es'} guardado${WA.favs.length===1?'':'s'}`);
      if(S.screen==='contacts') renderPeople();
    }catch(e){ msg.textContent='No se guardó: '+e.message; msg.className='err'; }
    finally{ b.disabled=false; }
  };

  return {
    WA, waSetPool, waPage, waAiReplies, iniAsk, iniCandidates, markLikelyKeys, kbIni, kbExpand, waLoadFavs,
    renderPeople, setCtx, waStart, waReset, openAgent, waSend, waListen, openPanel, closePanel,
  };
}
