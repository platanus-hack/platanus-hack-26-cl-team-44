/* Modo dev del agente para Myo OS.
 *
 * Se activa con ?dev=1 en la URL o con Shift+D. Se apaga con Shift+D.
 * Simula un mensaje (grupo de WhatsApp o voz en la sala), lo manda a software/agent/server.py
 * y muestra las 4 opciones del agente en la pantalla Hablar de siempre.
 *
 * No toca la lógica de la TV: usa window.MYO.S y las funciones globales go(), renderCards() y log().
 * El panel no tiene data-t, así que la mirada y la ceja no lo seleccionan.
 */
(() => {
  const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);
  const REMOTO = (typeof CFG !== 'undefined' && CFG.AGENTE_URL) || '';   // CFG es global léxico (const), no está en window
  const URL_AGENTE = localStorage.getItem('toki.dev.url') || REMOTO || (LOCAL ? 'http://127.0.0.1:8790' : location.origin + (location.pathname.startsWith('/equipo/') ? '/equipo/agente' : '/agente'));
  // Solo el escenario manda el token (viene de toki-config.js). En /equipo/ lo agrega Caddy; en local no hace falta.
  const TOKEN = (typeof CFG !== 'undefined' && CFG.WA_TOKEN) || '';
  const hdr = (h = {}) => TOKEN ? { ...h, 'X-Myo-Token': TOKEN } : h;
  const api = (path, opts = {}) => fetch(URL_AGENTE + path, { ...opts, headers: hdr(opts.headers) });
  const EMOS = ['ironica', 'alegre', 'carinosa', 'susurro', 'seria', 'entusiasta'];
  let panel = null, sse = null;

  const css = `
  #tokiDev{position:fixed;right:16px;bottom:16px;z-index:9999;width:380px;max-height:86vh;overflow:auto;
    background:rgba(20,20,24,.94);color:#eee;border:1px solid rgba(255,255,255,.15);border-radius:14px;
    font:13px/1.4 -apple-system,system-ui,sans-serif;padding:12px 14px;box-shadow:0 10px 40px rgba(0,0,0,.5)}
  #tokiDev h3{margin:0 0 8px;font-size:13px;display:flex;justify-content:space-between;align-items:center}
  #tokiDev .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#888;margin-right:6px}
  #tokiDev .dot.ok{background:#30d158} #tokiDev .dot.ko{background:#ff453a}
  #tokiDev label{display:block;margin:6px 0 2px;color:#aaa;font-size:11px}
  #tokiDev select,#tokiDev input{width:100%;box-sizing:border-box;background:#111;color:#eee;border:1px solid #333;border-radius:8px;padding:6px 8px;font:inherit}
  #tokiDev button{margin-top:8px;width:100%;padding:8px;border:0;border-radius:8px;background:#0a84ff;color:#fff;font-weight:600;cursor:pointer}
  #tokiDev button:disabled{opacity:.5;cursor:default}
  #tokiDev .ej{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
  #tokiDev .ej span{background:#222;border:1px solid #333;border-radius:20px;padding:2px 8px;cursor:pointer;font-size:11px}
  #tokiDev pre{white-space:pre-wrap;background:#0b0b0d;border-radius:8px;padding:8px;margin:8px 0 0;font-size:11px;color:#cfcfcf;max-height:260px;overflow:auto}
  #tokiDev .disp{display:flex;justify-content:space-between;align-items:center;gap:6px;background:#111;border:1px solid #333;border-radius:8px;padding:6px 8px;margin-top:4px}
  #tokiDev .disp button{width:auto;margin:0;padding:4px 8px;font-size:11px}
  #tokiDev .est{font-size:10px;padding:1px 6px;border-radius:10px;background:#333}
  #tokiDev .est.activo{background:#30d158;color:#000} #tokiDev .est.pendiente{background:#ff9f0a;color:#000}
  #devMeta{font-size:22px;color:var(--txt2,#aaa);margin-top:6px}`;

  const EJEMPLOS = [
    ['pedro', 'grupo', '@Anita ¿vamos al cumple de Tomi el sábado?'],
    ['tomas', 'voz', 'Abuela, ¿por qué no puedes hablar? ¿Estás enferma?'],
    ['dra_perez', 'voz', '¿Cómo ha dormido con el remedio nuevo?'],
    ['', 'voz', 'Hola, soy Sofi. ¿Te traigo algo del súper?'],
  ];

  const $ = (s, r = document) => r.querySelector(s);
  const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const traza = (t) => { const p = $('#devTraza'); if (p) p.textContent = t + '\n' + p.textContent.slice(0, 4000); };

  async function salud() {
    const dot = $('#devDot'), st = $('#devEstado');
    try {
      const r = await api('/api/salud'); const j = await r.json();
      dot.className = 'dot ok'; st.textContent = `${j.usuaria} · ${j.personas} personas · ${j.modelo}`;
      const ps = await (await api('/api/personas')).json();
      $('#devPersona').innerHTML = '<option value="">(detectar por nombre)</option>' +
        ps.map((p) => `<option value="${esc(p.id)}">${esc(p.nombre)} · ${esc(p.relacion)} · ${esc(p.tipo_interlocutor)}</option>`).join('');
      await cargarDisparadores();
      conectarSSE();
    } catch (e) {
      dot.className = 'dot ko'; st.textContent = `Sin agente en ${URL_AGENTE}. Corre software/agent/server.py`;
    }
  }

  let DISP = [];
  async function cargarDisparadores() {
    DISP = await (await api('/api/disparadores')).json();
    $('#devDisp').innerHTML = DISP.length ? DISP.map((d) => `
      <div class="disp"><span>${esc(d.grupo_nombre)} · mención <span class="est ${esc(d.estado)}">${esc(d.estado)}</span></span>
      <button data-did="${esc(d.id)}" data-est="${d.estado === 'activo' ? 'pausado' : 'activo'}">${d.estado === 'activo' ? 'Pausar' : 'Aprobar'}</button></div>`).join('')
      : '<div style="color:#888">Sin disparadores</div>';
    $('#devDisp').querySelectorAll('[data-did]').forEach((b) => b.onclick = async () => {
      await api('/api/disparadores/estado', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: b.dataset.did, estado: b.dataset.est }) });
      traza(`disparador ${b.dataset.did} → ${b.dataset.est}`); cargarDisparadores();
    });
  }

  function conectarSSE() {
    if (sse) return;
    const h = {};   // toki-sse.js: el token va en un header, nunca en la URL
    h.onmessage = (m) => { const ev = JSON.parse(m.data); if (ev.tipo === 'pensando') pensando(ev); if (ev.tipo === 'opciones') opciones(ev); if (ev.tipo === 'disparador') cargarDisparadores(); if (ev.tipo === 'error') { traza('ERROR ' + ev.error); $('#devBtn').disabled = false; } };
    h.onerror = () => { $('#devDot').className = 'dot ko'; };
    h.onopen = () => { $('#devDot').className = 'dot ok'; };
    sse = tokiSSE(URL_AGENTE + '/api/eventos', hdr(), h);
  }

  function contexto(ev) {
    const ctx = $('#s-talk .ctx'); if (!ctx) return;
    $('.avatar', ctx).textContent = (ev.inicial || ev.etiqueta || '?').slice(0, 1);
    $('label', ctx).textContent = ev.etiqueta || '';
    $('#ctxIn').value = ev.texto;
    let meta = $('#devMeta'); if (!meta) { meta = document.createElement('div'); meta.id = 'devMeta'; ctx.after(meta); }
    meta.textContent = [ev.resumen, ev.ultimo_encuentro].filter(Boolean).join('  ·  ');
  }

  function pensando(ev) {
    traza(`… ${ev.etiqueta}: "${ev.texto}"`);
    contexto(ev);
    go('talk'); $('#cards').classList.add('loading');
    log('agente pensando · ' + ev.etiqueta);
  }

  function opciones(ev) {
    const W = window.MYO;
    W.S.cards = ev.opciones.map((o) => ({ text: o.text, tone: o.tone || o.origen, emo: EMOS.includes(o.emo) ? o.emo : 'seria', traza: o.traza || { origen: o.origen } }));
    contexto(ev);
    $('#cards').classList.remove('loading');
    if (W.S.screen === 'talk') renderCards(); else go('talk');
    $('#devBtn').disabled = false;
    const m = ev.meta || {};
    traza([
      `✓ ${ev.origen} · ${m.ms_total ?? '?'} ms total · ${m.duration_ms ?? '-'} ms modelo${m.error ? ' · ' + m.error : ''}`,
      ...(ev.traza ? [`contexto: ${ev.traza.privacidad} · ${Object.entries(ev.traza.memorias_en_contexto || {}).map(([t, ids]) => t + ' ' + ids.length).join(', ')} · ${ev.traza.fuera_por_privacidad} fuera por privacidad${ev.traza.temas_bloqueados?.length ? ' · bloqueados: ' + ev.traza.temas_bloqueados.join(', ') : ''}`] : []),
      ...ev.opciones.map((o, i) => `  ${i + 1}. [${o.emo}] ${o.text}\n     ${window.trazaTexto ? trazaTexto(o.traza || { origen: o.origen }, true) : (o.fuentes || []).join(',')}`),
      ...(ev.descartadas || []).map((o) => `  ✗ ${o.text}  ← ${o.motivo}`),
    ].join('\n'));
    log(`agente · ${ev.origen} · ${m.ms_total ?? '?'} ms`);
  }

  async function simular() {
    const texto = $('#devTexto').value.trim(); if (!texto) return;
    $('#devBtn').disabled = true;
    if ($('#devCanal').value === 'grupo') return simularGrupo(texto);
    try {
      const r = await api('/api/simular', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto, persona: $('#devPersona').value || null, canal: $('#devCanal').value }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || r.status);
      traza(`→ enviado ${j.id} · en bandeja ${j.en_bandeja} · TVs ${j.tvs}`);
    } catch (e) { traza('ERROR ' + e.message); $('#devBtn').disabled = false; }
  }

  async function simularGrupo(texto) {
    const d = DISP[0];
    if (!d) { traza('No hay disparador de grupo'); $('#devBtn').disabled = false; return; }
    const sel = $('#devPersona');
    const nombre = sel.value ? sel.options[sel.selectedIndex].text.split(' · ')[0] : 'Alguien';
    pensando({ etiqueta: `${nombre} te mencionó en ${d.grupo_nombre}`, texto });
    try {
      const r = await api('/api/grupo', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'dev-' + Date.now(), grupo_jid: d.grupo_jid, grupo_nombre: d.grupo_nombre,
          persona: sel.value || null, autor_nombre: nombre, texto, menciona: true }) });
      const j = await r.json();
      if (j.accion !== 'mencion') { traza(`grupo → ${j.accion}${j.motivo ? ' · ' + j.motivo : ''}`); $('#cards').classList.remove('loading'); $('#devBtn').disabled = false; }
    } catch (e) { traza('ERROR ' + e.message); $('#devBtn').disabled = false; }
  }

  function abrir() {
    if (panel) return;
    if (!$('#tokiDevCss')) { const s = document.createElement('style'); s.id = 'tokiDevCss'; s.textContent = css; document.head.append(s); }
    panel = document.createElement('div'); panel.id = 'tokiDev';
    panel.innerHTML = `
      <h3><span><span class="dot" id="devDot"></span>Modo dev · agente</span><span style="color:#888">Shift+D cierra</span></h3>
      <div id="devEstado" style="color:#aaa;font-size:11px">conectando…</div>
      <label>Disparadores</label><div id="devDisp"></div>
      <label>Quién habla</label><select id="devPersona"></select>
      <label>Canal</label>
      <select id="devCanal"><option value="grupo">Mención en el grupo (usa el disparador)</option><option value="voz">Voz en la sala</option></select>
      <label>Mensaje</label><input id="devTexto" placeholder="Escribe y aprieta Enter">
      <div class="ej">${EJEMPLOS.map((e, i) => `<span data-ej="${i}">${esc(e[2].slice(0, 28))}…</span>`).join('')}</div>
      <button id="devBtn">Simular</button>
      <pre id="devTraza"></pre>`;
    document.body.append(panel);
    document.body.classList.add('myo-dev'); if (W0().S.screen === 'talk') renderCards();   // cada tarjeta muestra de dónde sale
    // El teclado del panel no llega a la TV (Espacio = ceja, Enter = genSuggestions).
    panel.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' && e.target.id === 'devTexto') simular(); });
    $('#devBtn').onclick = simular;
    panel.querySelectorAll('[data-ej]').forEach((el) => el.onclick = () => {
      const [p, c, t] = EJEMPLOS[+el.dataset.ej]; $('#devPersona').value = p; $('#devCanal').value = c; $('#devTexto').value = t;
    });
    salud();
  }

  function cerrar() { panel?.remove(); panel = null; sse?.close(); sse = null; document.body.classList.remove('myo-dev'); if (W0().S.screen === 'talk') renderCards(); }
  function W0() { return window.MYO || { S: {} }; }

  addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key.toLowerCase() === 'd' && !(document.activeElement && /INPUT|SELECT/.test(document.activeElement.tagName))) {
      panel ? cerrar() : abrir();
    }
  });
  if (new URLSearchParams(location.search).get('dev') === '1') abrir();
})();
