function createMyoKeyboard({
  S, CFG, $, GROUPS, WORDS, RULES, DEFAULT, REACTS, tabletComposer,
  decorate, stagger, esc, iniAsk, iniCandidates, markLikelyKeys, iphoneDwell, iphonePointing,
}) {
  /* memoria local: palabras y frases que Emmy ya usó (primer paso del plan de memoria) */
  const MEM=(()=>{ let m={words:{},phrases:[]}; try{ m=JSON.parse(localStorage.getItem('woki.mem.v1'))||m; }catch(_){}
    return { m,
      add(text){ for(const w of (text.toLowerCase().match(/[a-záéíóúñü]+/g)||[])) if(w.length>2) m.words[w]=(m.words[w]||0)+1;
        m.phrases.unshift({t:text,at:Date.now()}); m.phrases=m.phrases.slice(0,300);
        try{ localStorage.setItem('woki.mem.v1',JSON.stringify(m)); }catch(_){} },
      top(prefix){ return Object.entries(m.words).filter(([w])=>w.startsWith(prefix)&&w!==prefix).sort((a,b)=>b[1]-a[1]).map(([w])=>w); } }; })();
  /* Predicción: TokiPredict (predict.js) con el diccionario base (lexicon-es.js), las frases del
     sistema como contexto inicial y lo que la persona dice (aprende en el dispositivo). */
  // Fila fija (opción A): 3 sugerencias siempre en el mismo lugar, a 1 mirada (como Gboard). Una fila
  // fija junto al teclado es lo que mejor rinde en tecleo por mirada (MacKenzie y Zhang, ETRA 2008).
  const SUG_ROW = 3;
  // "Más": las 7 siguientes (4.ª a 10.ª) + Volver (4×2), sin repetir la fila. Es una segunda oportunidad,
  // no la vía principal: el ahorro casi no crece más allá de ~6 sugerencias (Adhikary et al. 2022).
  const SUG_MORE = 7;
  const PRED = window.TokiPredict.createPredictor({
    base: (window.TOKI_LEXICON || WORDS.map((w,i)=>[w, 1000/(i+1)])),
    corpus: [...RULES.flatMap(r=>r.s.flat().map(x=>x[0])), ...DEFAULT.flat().map(x=>x[0]), ...REACTS.map(r=>r[1])],
    storage: (()=>{ try{ return localStorage; }catch(_){ return null; } })(),
  });
  // lo que ya se había dicho antes de este motor también enseña (una sola vez)
  try{ if(!localStorage.getItem('woki.pred.migrated')){ [...MEM.m.phrases].reverse().forEach(p=>PRED.learn(p.t)); localStorage.setItem('woki.pred.migrated','1'); } }catch(_){}
  function curWord(){ const m=S.kb.text.match(/([^\s]*)$/); return m?m[1]:''; }
  function prevWord(){ const m=S.kb.text.replace(/[^\s]*$/,'').match(/([^\s.!?]+)[\s]*$/); return m?m[1]:''; }
  function atSentenceStart(){ const before=S.kb.text.replace(/[^\s]*$/,''); return /^\s*$/.test(before) || /[.!?]\s*$/.test(before); }
  /** sugerencias como objetos {word,name}; la palabra en curso puede estar vacía (= predecir la siguiente) */
  function sugs(){ return PRED.suggest(prevWord(), curWord(), SUG_ROW+SUG_MORE); }
  function preds(){ return sugs().map(s=>s.word); }
  const showWord=w=>w.charAt(0).toLocaleUpperCase('es')+w.slice(1);   // en pantalla: con mayúscula
  /* "Borrar" que acelera, como la tecla de borrar del iPhone: la 1.ª vez borra una letra; si se sigue
     (mirándola o pulsándola dentro de DEL_STREAK_MS), borra el resto de la palabra y luego palabra a
     palabra. Mirar otra tecla vuelve a letra por letra. */
  const DEL_STREAK_MS = 2600;   // > bloqueo (0,7 s) + tiempo de mirada (1,2–1,5 s): seguir mirando cuenta como seguir
  function deleteStep(text, streak){
    if(streak<=1) return text.slice(0,-1);
    return text.replace(/\s+$/,'').replace(/[^\s]+$/,'');
  }
  function delStreakActive(){ return performance.now()-(S.kb.delAt||0) < DEL_STREAK_MS; }
  function delLabel(){ return delStreakActive()? 'Borrar palabra<small>sigue mirando: otra</small>' : 'Borrar<small>sigue mirando: palabra</small>'; }
  function acceptSuggestion(sg){
    if(!sg) return;
    const before=S.kb.text.replace(/[^\s]*$/,'');
    const text=before+PRED.format(sg.word,{sentenceStart:atSentenceStart(),name:sg.name})+' ';
    S.kb.text = tabletComposer ? text.slice(0,300) : text;
  }
  function renderKeys(){
    const kb=S.kb; let html='';
    if(kb.mode==='ini' && kb.level===1){
      html=GROUPS.map((g,i)=>`<div class="t key" data-t data-act="grp:${i}">${g}</div>`).join('')+
        `<div class="t key small act" data-t data-act="kb:del">Borrar</div>${completarKey()}<div class="t key small act" data-t data-act="kb:exit">Volver</div>`;
    } else if (tabletComposer && kb.level === 1) {
      html = GROUPS.map((g,i)=>`<div class="t key" data-t data-act="grp:${i}">${g}</div>`).join('') +
        `<div class="t key small act" data-t data-act="kb:space">Espacio</div><div class="t key small act" data-t data-act="kb:del">${delLabel()}</div><div class="t key small act" data-t data-act="kb:say">Decir</div>`;
    } else if(kb.level===3){   // lista de sugerencias ("Más" en modo fila; todas en modo lista) + Volver
      const list=sugs(), from=CFG.sugMode==='fila'? SUG_ROW : 0, more=list.slice(from, from+SUG_MORE);
      html=more.map((sg,i)=>`<div class="t key sug" data-t data-act="sug:${i+from}">${showWord(sg.word)}</div>`).join('');
      for(let i=more.length;i<SUG_MORE;i++) html+='<div></div>';
      html+=`<div class="t key small act" data-t data-act="kb:back">Volver</div>`;
      kb.sugList=list;
    } else if(kb.level===1 && CFG.sugMode==='lista'){
      // Modo lista: un solo botón "Sugerencias" (con las 2 primeras de muestra) que abre la lista
      const list=sugs();
      kb.sugList=list;
      html=GROUPS.map((g,i)=>`<div class="t key" data-t data-act="grp:${i}">${g}</div>`).join('')+
        (list.length? `<div class="t key pred" data-t data-act="kb:sug">Sugerencias<small>${list.slice(0,2).map(x=>showWord(x.word)).join(' · ')}${list.length>2?' · …':''}</small></div>` : `<div class="key pred ghost">Sin sugerencias</div>`)+
        `<div class="t key small act" data-t data-act="kb:space">Espacio</div><div class="t key small act" data-t data-act="kb:del">${delLabel()}</div><div class="t key small act" data-t data-act="kb:say">Decir</div>`+
        `<div class="t key small act" data-t data-act="go:home">Volver</div>`;
    } else if(kb.level===1){
      // Fila fija de sugerencias (opción A): las 3 mejores a 1 mirada, siempre en el mismo lugar
      // (los huecos vacíos se conservan para que las posiciones no salten), y "Más" con el resto.
      const list=sugs(), top=list.slice(0,SUG_ROW);
      kb.sugList=list;
      let r1=top.map((sg,i)=>`<div class="t key sug row-sug${i===0?' best':''}" data-t data-act="sug:${i}">${showWord(sg.word)}</div>`).join('');
      for(let i=top.length;i<SUG_ROW;i++) r1+=`<div class="key sug row-sug ghost">${i===0 && !list.length? 'Sin sugerencias' : ''}</div>`;
      r1+= list.length>SUG_ROW
        ? `<div class="t key small act row-sug" data-t data-act="kb:sug">Más ▸<small>${list.length-SUG_ROW} más</small></div>`
        : `<div class="key small row-sug ghost">Más ▸</div>`;
      const r2=GROUPS.map((g,i)=>`<div class="t key row-grp" data-t data-act="grp:${i}">${g}</div>`).join('');
      const r3=`<div class="t key small act row-act" data-t data-act="kb:space">Espacio</div><div class="t key small act row-act" data-t data-act="kb:del">${delLabel()}</div><div class="t key small act row-act" data-t data-act="kb:say">Decir</div>`+
        `<div class="t key small act row-act" data-t data-act="go:home">Volver</div>`;
      html=`<div class="kbrow c4">${r1}</div><div class="kbrow c5">${r2}</div><div class="kbrow c4">${r3}</div>`;
    } else {
      const L=GROUPS[kb.group].split('');
      html=L.map(c=>`<div class="t key" data-t data-act="chr:${c}">${c}</div>`).join('');
      const extra = kb.mode==='ini' && (kb.ini||'') && L.length<7 ? completarKey() : '';   // las frases a 1 mirada también desde aquí
      if(extra) html+=extra;
      for(let i=L.length+(extra?1:0);i<7;i++) html+='<div></div>';
      html+=`<div class="t key small act" data-t data-act="kb:back">Volver</div>`;
    }
    $('#keys').className = (kb.mode==='ini' || tabletComposer || kb.level!==1)? 'grid4x2' : CFG.sugMode==='fila'? 'kbrows' : 'grid5x2';
    $('#s-keyboard').dataset.level=kb.level;
    $('#s-keyboard').dataset.sug=tabletComposer ? 'tablet' : CFG.sugMode;
    $('#keys').innerHTML=html; stagger($('#keys')); decorate($('#keys'));
    if(kb.mode==='ini') iniAsk();
    renderKbText(); markLikelyKeys();
  }
  // «Completar» con la frase más probable a la vista: la persona ve qué va a obtener antes de elegirla.
  function completarKey(){
    const c=(S.kb.ini||'') ? iniCandidates()[0] : null;
    return c ? `<div class="t key small act best completar" data-t data-act="kb:expand">✨ Completar<small>${esc(c.text)}</small></div>`
             : `<div class="t key small act completar" data-t data-act="kb:expand">✨ Completar<small>elige letras primero</small></div>`;
  }
  const KBHINT0=document.getElementById('kbHint').innerHTML;
  function renderKbText(){
    $('#kbHint').innerHTML = S.kb.mode==='ini'
      ? '<span><b>Ceja</b> elegir letra</span><span><b>Completar</b> frases con Claude</span><span><b>Volver</b> regresar al chat</span>'
      : KBHINT0;
    if(S.kb.mode==='ini'){
      const L=[...(S.kb.ini||'')].map(c=>esc(c.toUpperCase()));
      $('#kbTxt').innerHTML= L.length? `<span class="ini-letters">${L.join('<span class="dotsep">·</span>')}</span><span class="caret"></span>`
        : '<span class="ini-hint">Primera letra de cada palabra</span><span class="caret"></span>';
      const cand=iniCandidates().slice(0,3), ai=S.kb.ai;
      const top=cand.map(c=>(c.ai?'<span class="ai">✨</span>':'')+esc(c.text));
      const wait= ai && ai.ini===(S.kb.ini||'') && !ai.list ? ' <span class="ai-wait">· ✨ Claude pensando…</span>' : '';
      const ck=document.querySelector('#keys .completar small'), best=cand[0];   // la frase de «Completar» sigue a Claude
      if(ck){ ck.textContent= best? best.text : 'elige letras primero'; ck.parentElement.classList.toggle('best', !!best); }
      $('#kbPred').innerHTML= top.length? 'Podría ser: '+top.map((x,i)=>i?x:`<b>${x}</b>`).join(' · ')+wait+' · mira <b>✨ Completar</b> para elegir una' : 'Ejemplo: S · M · P · B → «Sí, me parece bien»';
      return;
    }
    const p=preds(), w=curWord();
    const line = $('#kbTxt');
    line.textContent = S.kb.text;
    line.insertAdjacentHTML('beforeend','<span class="caret"></span>');
    if (p[0] && w && window.TokiPredict.normalize(p[0]).startsWith(window.TokiPredict.normalize(w))) {
      const completion = document.createElement('span');
      completion.className = 'ghost';
      completion.textContent = p[0].slice(w.length);
      line.append(completion);
    }
    const suggestions = $('#kbPred');
    if (tabletComposer) {
      const words = p.slice(0, SUG_ROW);
      if (words.join(' ') !== suggestions.dataset.words) {
        suggestions.dataset.words = words.join(' ');
        suggestions.replaceChildren();
        for (const word of words) {
          const key = document.createElement('button');
          key.className = 't suggestion';
          key.dataset.t = '';
          key.dataset.act = 'complete:' + word;
          key.textContent = word;
          suggestions.append(key);
        }
      }
      const review = document.querySelector('#s-keyboard .use-phrase');
      if (review) {
        review.hidden = !S.kb.text.trim();
        review.toggleAttribute('data-t', !review.hidden);
      }
    } else {
      const how = iphoneDwell() ? 'mantén la mirada o confirma con la ceja' : iphonePointing() ? 'enfoca una sugerencia y confirma con la ceja' : 'confirma con la ceja o haz clic';
      suggestions.textContent = S.kb.level === 3 ? 'Elige una palabra' : p.length ? 'Sugerencias: ' + p.slice(0,4).map(showWord).join(' · ') + ' — ' + how : 'Elige un grupo de letras';
    }
  }

  return {
    memory: MEM, learn: PRED.learn, DEL_STREAK_MS, deleteStep, delStreakActive,
    sugs, acceptSuggestion, renderKeys, renderKbText,
  };
}
