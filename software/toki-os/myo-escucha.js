/* Escuchar la sala para Myo OS: voces separadas (ElevenLabs Scribe v3 Live) → tarjetas por tema → opciones del agente.
 *
 * El acompañante aprieta «Escuchar» en Hablar (no tiene data-t: la mirada y la ceja no lo eligen).
 * - El puente entrega un token de un solo uso (POST /api/voz/escucha). La llave de ElevenLabs nunca llega a la TV.
 * - Scribe separa las voces: cada turno llega con «Voz 1», «Voz 2»… El acompañante elige de quién es cada voz
 *   (una vez por sesión) y eso corrige los turnos anteriores de esa voz.
 * - Por cada turno: setCtx("Juan dice", …), tarjetas por tema al instante (POST agente /api/tarjetas, sin modelo)
 *   y luego las opciones del agente (POST /api/sugerir, modo voz). Quedan 3 del agente + la mejor tarjeta del tema.
 * - Privacidad: el agente recibe quiénes hablan (hablantes) y usa la del que ve menos. Una voz sin identificar
 *   cuenta como desconocido.
 * - Mientras Myo habla, al micrófono se le manda silencio: no se transcribe su propia voz.
 *
 * Room context and initials are integrated through window.MYO.conversation.
 * Medido (pruebas con voces sintéticas): sin ruido de fondo, 100 % de turnos con el hablante correcto y ~0,65 s de
 * latencia; con la TV del cuarto a volumen medio o alto los turnos se atrasan 8-14 s. Aviso de privacidad: en el plan
 * actual de ElevenLabs (no Enterprise) el audio queda registrado en sus servidores.
 */
(() => {
  const W = window.MYO;
  if (!W || !document.getElementById('s-talk')) return;
  const conversation = W.conversation;
  const C = (typeof CFG !== 'undefined' && CFG) || {};
  const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);
  const EQUIPO = location.pathname.startsWith('/equipo/');
  const URL_AGENTE = localStorage.getItem('toki.dev.url') || C.AGENTE_URL || (LOCAL ? 'http://127.0.0.1:8790' : location.origin + (EQUIPO ? '/equipo/agente' : '/agente'));
  const URL_PUENTE = C.VOZ_URL ?? C.WA_URL ?? (LOCAL ? 'http://127.0.0.1:8788' : '');
  const TOKEN = C.WA_TOKEN || '';
  const hdr = (h = {}) => (TOKEN ? { ...h, 'X-Myo-Token': TOKEN } : h);
  const post = (base, path, body) => fetch(base + path, { method: 'POST', headers: hdr({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) })
    .then(async (r) => { const j = await r.json().catch(() => ({})); if (!r.ok || j.ok === false) throw new Error(j.error || j.reason || 'HTTP ' + r.status); return j; });
  const getJ = (base, path) => fetch(base + path, { headers: hdr() }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))));
  const say = (m) => { try { log('escucha: ' + m); } catch (_) {} };
  const EMOS = ['ironica', 'alegre', 'carinosa', 'susurro', 'seria', 'entusiasta'];
  const MAX_TURNOS = 8;

  const E = { on: false, turnos: [], personas: [], hablantes: {}, req: 0, ultimoTurno: 0, usuaria: '',
              pool: [], inicio: 0, pidiendoMas: false, ini: { ini: '', p: null, list: null } };
  const SALA_MS = 15 * 60 * 1000;   // modo sala: hubo un turno escuchado en los últimos 15 min
  try { E.hablantes = JSON.parse(sessionStorage.getItem('myo.hablantes') || '{}'); } catch (_) {}

  // ---------- modos de escucha (se comparan en el ensayo; queda uno) ----------
  //   siempre  la TV escucha desde que abre: micrófono y sesión de ElevenLabs abiertos todo el tiempo
  //   voz      el micrófono queda abierto solo en el navegador; la sesión se abre al detectar voz
  //            (con 1,5 s de audio previo) y se cierra tras 45 s de silencio
  //   manual   como antes: el acompañante aprieta «Escuchar»
  // Teclas del acompañante: O enciende o apaga · Mayús+O cambia de modo. También se cambia en el indicador.
  const MODOS = ['siempre', 'voz', 'manual'];
  const NOMBRE_MODO = { siempre: 'siempre encendida', voz: 'se activa con la voz', manual: 'manual' };
  // ?escucha=voz|siempre|manual en la URL elige el modo y queda guardado (escena.sh lo pasa con TOKI_ESCUCHA).
  try { const q = new URLSearchParams(location.search).get('escucha'); if (MODOS.includes(q)) localStorage.setItem('myo.escucha.modo', q); } catch (_) {}
  let modo = (() => { try { const m = localStorage.getItem('myo.escucha.modo'); return MODOS.includes(m) ? m : 'siempre'; } catch (_) { return 'siempre'; } })();
  const SILENCIO_MS = 45000, PREVIO_CHUNKS = 15;   // 15 × 100 ms = 1,5 s de audio previo
  const ST = { sesiones: 0, msConectado: 0, desde: 0 };   // para comparar el gasto de los modos

  // ---------- interfaz: botón y barra de voces (para el acompañante) ----------
  const css = `
  #escuchaBtn{margin-left:auto;padding:10px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:inherit;font:600 18px/1 system-ui;cursor:pointer;white-space:nowrap}
  #escuchaBtn.on{background:#ff453a;border-color:#ff453a;color:#fff}
  #escuchaBar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:8px 0 0;font:17px/1.3 system-ui;opacity:.92}
  #escuchaBar:empty{display:none}
  #escuchaBar .voz{display:inline-flex;gap:6px;align-items:center;padding:3px 8px 3px 10px;border-radius:999px;background:rgba(255,255,255,.1)}
  #escuchaBar .voz.anon{outline:2px dashed rgba(255,255,255,.35);outline-offset:-2px}
  #escuchaBar select{background:#111;color:#eee;border:1px solid #444;border-radius:8px;padding:4px 8px;font:inherit}
  #escuchaBar .priv{opacity:.75}
  #escuchaInd{position:fixed;top:14px;right:18px;z-index:60;display:flex;gap:8px;align-items:center;padding:6px 12px;border-radius:999px;
    background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.18);color:#fff;font:600 14px/1 system-ui;cursor:pointer;opacity:.8}
  #escuchaInd.en-barra{position:static;opacity:1;min-height:44px;padding:0 14px}
  #escuchaInd i{width:9px;height:9px;border-radius:50%;background:#8e8e93;display:inline-block}
  #escuchaInd.oye i{background:#ff9f0a}
  #escuchaInd.vivo i{background:#ff453a;box-shadow:0 0 0 0 rgba(255,69,58,.6);animation:escPulso 1.6s infinite}
  @keyframes escPulso{70%{box-shadow:0 0 0 8px rgba(255,69,58,0)}100%{box-shadow:0 0 0 0 rgba(255,69,58,0)}}`;
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: css }));
  const ctx = document.querySelector('#s-talk .ctx');
  const btn = Object.assign(document.createElement('button'), { id: 'escuchaBtn', type: 'button', textContent: '🎙 Escuchar', title: 'Escuchar la sala y separar las voces (lo usa el acompañante)' });
  ctx.appendChild(btn);
  // Indicador fijo en todas las pantallas: la sala sabe cuándo Myo escucha. Clic = encender o apagar; Mayús+clic = modo.
  const ind = Object.assign(document.createElement('div'), { id: 'escuchaInd', title: 'Escucha de la sala (O enciende o apaga · Mayús+O cambia de modo)' });
  ind.append(document.createElement('i'), document.createElement('span'));
  // En la barra de abajo, junto a «Cuidados»: arriba a la derecha tapaba el reloj y la esquina de la pantalla.
  const devbar = document.getElementById('devbar');
  if (devbar) { ind.classList.add('dbtn', 'en-barra'); devbar.prepend(ind); } else document.body.appendChild(ind);
  function pintarInd() {
    const vivo = !!(ws && ws.readyState === 1);
    ind.classList.toggle('vivo', E.on && vivo);
    ind.classList.toggle('oye', E.on && !vivo);
    ind.lastChild.textContent = !E.on ? 'Escucha apagada · ' + NOMBRE_MODO[modo]
      : vivo ? 'Escuchando' : modo === 'voz' ? 'Esperando voz' : 'Conectando…';
  }
  const bar = Object.assign(document.createElement('div'), { id: 'escuchaBar' });
  bar.setAttribute('aria-live', 'polite');
  ctx.insertAdjacentElement('afterend', bar);

  const personaDe = (t) => t.persona || E.hablantes[t.hablante] || null;
  const nombreDe = (pid) => (E.personas.find((p) => p.id === pid) || {}).nombre;
  const etiqueta = (t) => nombreDe(personaDe(t)) || (t.hablante ? 'Voz ' + t.hablante.replace(/^S/, '') : 'Alguien');

  function pintarBarra(meta) {
    const voces = [...new Set(E.turnos.map((t) => t.hablante).filter(Boolean))];
    bar.replaceChildren();
    for (const h of voces) {
      const pid = E.hablantes[h];
      const chip = Object.assign(document.createElement('span'), { className: 'voz' + (pid ? '' : ' anon') });
      chip.append('Voz ' + h.replace(/^S/, '') + (VOCES.auto[h] && VOCES.auto[h] === pid ? ' ✓' : ''));
      if (VOCES.auto[h] && VOCES.auto[h] === pid) chip.title = 'Reconocida por su voz registrada';
      const sel = document.createElement('select');
      sel.setAttribute('aria-label', '¿De quién es la voz ' + h.replace(/^S/, '') + '?');
      sel.add(new Option('¿Quién es?', ''));
      for (const p of E.personas) sel.add(new Option(p.nombre + (p.relacion ? ' (' + p.relacion + ')' : ''), p.id));
      sel.value = pid || '';
      sel.addEventListener('change', () => asignar(h, sel.value));
      chip.append(sel);
      bar.append(chip);
    }
    if (meta && meta.tipo_interlocutor) {
      bar.append(Object.assign(document.createElement('span'), { className: 'priv', textContent: 'Privacidad: ' + meta.tipo_interlocutor }));
    }
  }

  function asignar(h, pid) {
    if (pid) E.hablantes[h] = pid; else delete E.hablantes[h];
    try { sessionStorage.setItem('myo.hablantes', JSON.stringify(E.hablantes)); } catch (_) {}
    pintarBarra();
    const ult = E.turnos[E.turnos.length - 1];
    if (ult) mostrar(ult);   // corrige quién dice y vuelve a pedir con la privacidad nueva
  }

  // ---------- turno → contexto, tarjetas y agente ----------
  const enChat = () => typeof WA !== 'undefined' && WA && WA.to;
  const cuerpo = (t) => ({
    texto: t.texto,
    persona: personaDe(t) || undefined,
    hablantes: [...new Set(E.turnos.slice(-MAX_TURNOS).map((x) => x.hablante || '?'))].map((h) => (h === '?' ? null : E.hablantes[h] || null)),
  });

  async function mostrar(t) {
    if (enChat()) return;   // en un chat de WhatsApp las tarjetas son las del chat
    const id = ++E.req;
    const pid = personaDe(t);
    conversation.setContext(etiqueta(t) + ' dice', etiqueta(t).slice(0, 1).toUpperCase(), t.texto, 'Escuchando la sala…', pid ? '' : 'rgba(255,255,255,.18)');
    E.pool = []; E.inicio = 0;   // nada del turno anterior mientras llega lo nuevo
    if (W.S.screen === 'home') go('talk');
    const base = cuerpo(t);
    // 1) Tarjetas por tema: al instante.
    let tarjetas = [];
    try {
      const r = await post(URL_AGENTE, '/api/tarjetas', { ...base, historial: E.turnos.slice(-3, -1).map((x) => x.texto) });
      if (id !== E.req) return;
      pintarBarra(r);
      tarjetas = (r.tarjetas || []).map((c) => ({ text: c.texto, tone: 'Tarjeta · ' + (r.tema ? r.tema.nombre : 'tema'), emo: 'seria',
        tarjeta: { id: c.id, tema: c.tema, persona: r.persona || null },
        traza: { origen: 'tarjeta', tarjeta: c.id, tema: r.tema ? r.tema.nombre : c.tema, de: c.origen, fuente: c.fuente || '', motivo: c.motivo || '' } }));
      if (tarjetas.length) ponerPool(tarjetas);
    } catch (e) { say('tarjetas: ' + e.message); }
    // 2) Opciones del agente (con memoria) primero; las tarjetas del tema quedan detrás, en «Más».
    document.getElementById('cards')?.classList.add('loading');
    try {
      const hist = E.turnos.slice(-MAX_TURNOS, -1).map((x) => etiqueta(x) + ': ' + x.texto);
      const r = await post(URL_AGENTE, '/api/sugerir', { ...base, modo: 'voz', historial: hist });
      if (id !== E.req) return;
      ponerPool([...aCartas(r.opciones), ...tarjetas]);
    } catch (e) { say('agente: ' + e.message); }
    document.getElementById('cards')?.classList.remove('loading');
  }

  // ---------- Tres formas de comunicarse en la sala ----------
  // Plantillas con contexto (3 a la vez + «Más»), primera letra de cada palabra (con contexto) y letra por letra.
  const enSala = () => !enChat() && E.turnos.length > 0 && Date.now() - E.ultimoTurno < SALA_MS;
  const aCartas = (ops) => (ops || []).map((o) => ({ text: o.text, tone: o.tone || o.origen || 'sugerida', emo: EMOS.includes(o.emo) ? o.emo : 'seria', ai: true,
    traza: o.traza || { origen: o.origen || 'agente' } }));
  const DEV = () => document.body.classList.contains('myo-dev');   // modo dev (Shift+D): el agente devuelve de dónde sale cada opción
  const MAS = { text: 'Más', tone: 'otras respuestas', emo: 'seria', plain: true, mas: true };

  function ponerPool(cartas) {
    const vistos = new Set(), pool = [];
    for (const c of cartas) { const k = c.text.toLowerCase().trim(); if (k && !vistos.has(k)) { vistos.add(k); pool.push(c); } }
    E.pool = pool; E.inicio = 0;
    pagina();
  }
  function pagina() {   // siempre 3 tarjetas (si hay), desde E.inicio
    if (E.inicio >= E.pool.length) E.inicio = 0;
    W.S.cards = [...E.pool.slice(E.inicio, E.inicio + 3), MAS];
    if (W.S.screen === 'talk') renderCards();
  }
  async function mas() {
    if (E.inicio + 3 < E.pool.length) { E.inicio = Math.min(E.inicio + 3, Math.max(0, E.pool.length - 3)); pagina(); return; }
    const t = E.turnos[E.turnos.length - 1];
    if (!t || E.pidiendoMas) { E.inicio = 0; pagina(); return; }
    E.pidiendoMas = true;
    document.getElementById('cards')?.classList.add('loading');
    try {   // se acabaron: el agente propone otras, sin repetir las que ya vio
      const hist = E.turnos.slice(-MAX_TURNOS, -1).map((x) => etiqueta(x) + ': ' + x.texto);
      const r = await post(URL_AGENTE, '/api/sugerir', { ...cuerpo(t), modo: 'voz', historial: hist, excluir: E.pool.map((c) => c.text), traza: DEV() });
      const nuevas = aCartas(r.opciones).filter((c) => !E.pool.some((x) => x.text.toLowerCase() === c.text.toLowerCase()));
      // las nuevas al final, y la página termina en ellas: siempre se ven 3 (las nuevas + las anteriores)
      if (nuevas.length) { E.pool.push(...nuevas); E.inicio = Math.max(0, E.pool.length - 3); } else E.inicio = 0;
    } catch (e) { say('más: ' + e.message); E.inicio = 0; }
    E.pidiendoMas = false;
    document.getElementById('cards')?.classList.remove('loading');
    pagina();
  }

  // Hablar en modo sala: la 4.ª tarjeta es «Más», «Escribir» pasa a primera letra y «Volver» a letra por letra
  // (Inicio y Volver siguen en la barra de arriba).
  if (typeof window.renderCards === 'function') {
    const origRender = window.renderCards;
    window.renderCards = function () {
      const r = origRender.apply(this, arguments);
      if (!enSala()) return r;
      const g = document.getElementById('cards');
      const m = g.querySelector('[data-act="say:3"]');
      if (m && (W.S.cards[3] || {}).mas) {
        m.dataset.act = 'escuchaMas';
        m.querySelector('.ph').textContent = E.pidiendoMas ? 'Buscando…' : 'Más ▸';
        m.querySelector('.tone').textContent = E.inicio + 3 < E.pool.length ? 'otras respuestas' : 'pedir otras nuevas';
      }
      const esc = g.querySelector('.side[data-act="go:keyboard"]');
      if (esc) { esc.dataset.act = 'waKb'; esc.innerHTML = '<svg><use href="#i-keys"/></svg>Primera letra<small>con lo que te dijeron</small>'; }
      const vol = g.querySelector('.side[data-act="go:home"]');
      if (vol) { vol.dataset.act = 'go:keyboard'; vol.innerHTML = '<svg><use href="#i-keys"/></svg>Letra por letra<small>máxima precisión</small>'; }
      return r;
    };
  }
  if (typeof window.activate === 'function') {
    const origAct = window.activate;
    window.activate = function (el) {
      if (el && el.dataset && el.dataset.act === 'escuchaMas') { try { press(el); } catch (_) {} mas(); return; }
      return origAct.apply(this, arguments);
    };
  }

  // Primera letra con contexto: con cada letra se le pide al agente frases que respeten las iniciales y respondan
  // a lo que le dijeron (persona, privacidad y memoria). «Completar» las muestra en Hablar, también con «Más».
  function pedirIniciales(ini) {
    if (E.ini.ini === ini && E.ini.p) return E.ini.p;
    const t = E.turnos[E.turnos.length - 1] || { texto: '' };
    const hist = E.turnos.slice(-MAX_TURNOS, -1).map((x) => etiqueta(x) + ': ' + x.texto);
    const e = E.ini = { ini, list: null, p: null };
    e.p = post(URL_AGENTE, '/api/iniciales', { ...cuerpo(t), iniciales: ini, historial: hist, traza: DEV() })
      .then((r) => { e.list = (r.suggestions || []).map((x) => ({ text: x.text, tone: x.tone || 'por iniciales', emo: EMOS.includes(x.emo) ? x.emo : 'seria', ai: true,
        traza: x.traza || { origen: r.origen || 'agente', iniciales: ini } })); return e.list; })
      .catch((err) => { say('iniciales: ' + err.message); e.list = []; return []; });
    return e.p;
  }
  let tmr = null;
  conversation.registerRoomInitials({
    isActive: enSala,
    ask() {
      const ini = (W.S.kb && W.S.kb.ini) || '';
      clearTimeout(tmr);
      if (!ini) { W.S.kb.ai = null; return; }
      tmr = setTimeout(() => {
        const ai = W.S.kb.ai = { ini, list: null, p: null };
        ai.p = pedirIniciales(ini).then((l) => { ai.list = l; }).finally(() => {
          if (W.S.screen === 'keyboard' && W.S.kb.mode === 'ini' && W.S.kb.ai === ai) {
            conversation.renderKbText();
            conversation.markLikelyKeys();
          }
        });
      }, 300);
    },
    async expand() {
      const ini = (W.S.kb && W.S.kb.ini) || '';
      if (!ini) { try { island('🔤', 'Elige al menos una letra', true); } catch (_) {} return; }
      try { island('✨', 'Completando con lo que te dijeron…', false, 0); } catch (_) {}
      await Promise.race([pedirIniciales(ini), new Promise((r) => setTimeout(r, 20000))]);
      let out = [];
      try { out = conversation.iniCandidates().slice(0, 9).map((x) => ({ text: x.text, tone: x.tone, emo: EMOS.includes(x.emo) ? x.emo : 'seria', ai: x.ai })); } catch (_) { out = E.ini.list || []; }
      if (E.ini.ini === ini && E.ini.list) out = [...E.ini.list, ...out];
      try { island('✨', 'Listo', false, 600); } catch (_) {}
      W.S.kb.mode = 'text';
      E.ultimoTurno = Date.now();
      go('talk');
      ponerPool(out);
      say('iniciales ' + ini.toUpperCase() + ' → ' + out.length + ' frases');
    },
  });

  function turno(texto, meta = {}) {
    texto = String(texto || '').trim();
    if (!texto) return;
    const t = { texto, hablante: meta.hablante || '', persona: meta.persona || '' };
    E.ultimoTurno = Date.now();
    E.turnos.push(t);
    E.turnos = E.turnos.slice(-MAX_TURNOS);
    pintarBarra();
    return mostrar(t);
  }

  // En modo sala, Hablar muestra lo de la conversación escuchada, no las sugerencias genéricas de la TV
  // (genSuggestions corre al entrar a Hablar). Si el acompañante escribe otra cosa y aprieta Enter, cuenta como turno.
  if (typeof window.genSuggestions === 'function') {
    const origGen = window.genSuggestions;
    window.genSuggestions = function () {
      if (!enSala()) return origGen.apply(this, arguments);
      const escrito = (document.getElementById('ctxIn') || {}).value || '';
      const ult = E.turnos[E.turnos.length - 1];
      if (escrito.trim() && ult && escrito.trim() !== ult.texto) { turno(escrito, {}); return Promise.resolve(); }
      if (E.pool.length) pagina(); else if (W.S.screen === 'talk') renderCards();
      return Promise.resolve();
    };
  }

  // Registro de cada frase elegida (sin el texto): de qué origen sale, qué memorias cita, en qué posición estaba
  // y si se dijo tal cual o editada/escrita. Así cada cambio de prompt se mide contra lo que ella elige de verdad.
  function seleccion(text, canal) {
    const cards = W.S.cards || [], i = cards.findIndex((x) => x.text === text), c = cards[i];
    const t = (c && c.traza) || {};
    post(URL_AGENTE, '/api/seleccion', { canal, origen: c ? (t.origen || 'local') : 'escrita', posicion: c ? i : null, opciones: cards.length,
      fuentes: (t.fuentes || []).map((f) => f.id), tipos: (t.fuentes || []).map((f) => f.tipo).filter(Boolean),
      editada: !c, palabras: String(text || '').split(/\s+/).filter(Boolean).length }).catch(() => {});
  }
  window.MYO_SELECCION = seleccion;

  // Aprender: cuando Myo dice una tarjeta del tema, el agente lo anota (id, tema y persona; sin texto).
  if (typeof window.speak === 'function') {
    const orig = window.speak;
    window.speak = function (text, emo) {
      const c = (W.S.cards || []).find((x) => x.tarjeta && x.text === text);
      if (c) post(URL_AGENTE, '/api/tarjetas/uso', { tarjeta_id: c.tarjeta.id, tema: c.tarjeta.tema, persona: c.tarjeta.persona || undefined }).catch(() => {});
      seleccion(text, 'sala');
      return orig.apply(this, arguments);
    };
  }

  // ---------- reconocer la voz (huellas en la VPS, con consentimiento) ----------
  // Si la voz de un turno no tiene nombre, se pregunta a la VPS quién es antes de mostrar el turno: así el agente
  // recibe la persona correcta en el primer pedido (un pedido, no dos). Tope de 1,5 s: si no responde, sigue sin nombre.
  const VOCES = { registradas: [], auto: {} };   // auto: voz → persona reconocida por la huella
  const cargarVoces = () => getJ(URL_AGENTE, '/api/voces/lista').then((r) => { VOCES.registradas = r.personas || []; }).catch(() => {});
  async function turnoConVoz(texto, meta, rango) {
    const h = meta.hablante;
    const yaTiene = h ? !!E.hablantes[h] : false;
    const audio = !yaTiene && VOCES.registradas.length && rango ? recorte(rango[0], rango[1]) : null;
    if (audio) {
      try {
        const r = await Promise.race([post(URL_AGENTE, '/api/voces/quien', { audio }), new Promise((_, no) => setTimeout(() => no(new Error('tarde')), 1500))]);
        say(`voz ${h || '?'}: ${r.persona ? 'reconocida' : 'sin nombre'} (parecido ${r.score})`);
        if (r.persona) {
          if (h) { E.hablantes[h] = r.persona; VOCES.auto[h] = r.persona; try { sessionStorage.setItem('myo.hablantes', JSON.stringify(E.hablantes)); } catch (_) {} }
          else meta = { ...meta, persona: r.persona };
        }
      } catch (e) { say('reconocer voz: ' + e.message); }
    }
    turno(texto, meta);
  }

  // Registrar una voz: lo hace el acompañante con la persona presente. Se graba 20 s leyendo un texto, la VPS guarda
  // solo la huella (no el audio) y el consentimiento con la fecha. «Borrar» la elimina.
  // El texto de lectura viene de la VPS (software/voces: voces-config.json o un texto neutro), no del código.
  const reg = document.createElement('div');
  reg.id = 'vozReg'; reg.hidden = true; reg.setAttribute('role', 'dialog'); reg.setAttribute('aria-label', 'Registrar voz');
  reg.innerHTML = `<div class="vr-c"><h2>Registrar voz</h2>
    <label>¿Quién habla? <select id="vrPersona"></select></label>
    <label class="vr-ok"><input type="checkbox" id="vrAcepta"> Esta persona acepta que Myo guarde la huella de su voz (256 números, sin el audio) para reconocerla en la sala. La puede borrar cuando quiera.</label>
    <p class="vr-leer">Lee en voz alta, a ritmo normal:<br><b id="vrTexto">…</b></p>
    <p id="vrEstado" aria-live="polite"></p>
    <div class="vr-b"><button type="button" id="vrGrabar">Grabar 20 s</button><button type="button" id="vrBorrar">Borrar su voz</button><button type="button" id="vrCerrar">Cerrar</button></div>
    <p id="vrLista" class="vr-lista"></p></div>`;
  document.body.appendChild(reg);
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: `
  #vozReg{position:fixed;inset:0;z-index:80;display:grid;place-items:center;background:rgba(0,0,0,.7);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}
  #vozReg[hidden]{display:none}
  #vozReg .vr-c{width:min(760px,92vw);padding:28px 32px;border-radius:24px;background:#16181d;border:1px solid rgba(255,255,255,.14);color:#f2f2f7;font:20px/1.4 system-ui;display:grid;gap:14px}
  #vozReg h2{margin:0;font-size:28px}
  #vozReg select{font:inherit;background:#0e0f12;color:#fff;border:1px solid #444;border-radius:10px;padding:6px 10px;margin-left:8px}
  #vozReg .vr-ok{display:flex;gap:10px;align-items:flex-start;font-size:18px}
  #vozReg .vr-ok input{width:22px;height:22px;margin-top:3px}
  #vozReg .vr-leer{margin:0;padding:14px 16px;border-radius:14px;background:rgba(255,255,255,.06);font-size:18px}
  #vozReg .vr-leer b{display:block;margin-top:6px;font-size:22px;line-height:1.45}
  #vozReg .vr-b{display:flex;gap:10px;flex-wrap:wrap}
  #vozReg button{font:600 18px system-ui;padding:10px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;cursor:pointer}
  #vozReg #vrGrabar{background:#0a84ff;border-color:#0a84ff}
  #vozReg #vrGrabar:disabled{opacity:.5}
  #vozReg .vr-lista{margin:0;font-size:16px;opacity:.8}
  #vozRegBtn{min-height:44px;padding:0 14px}` }));
  const $r = (id) => document.getElementById(id);
  function pintarReg() {
    const sel = $r('vrPersona'), val = sel.value;
    sel.replaceChildren(...E.personas.map((p) => new Option(p.nombre + (p.relacion ? ' (' + p.relacion + ')' : ''), p.id)));
    if (val) sel.value = val;
    const nombres = VOCES.registradas.map((v) => (nombreDe(v.persona) || v.persona) + ` (${v.muestras} muestra${v.muestras > 1 ? 's' : ''})`);
    $r('vrLista').textContent = nombres.length ? 'Voces registradas: ' + nombres.join(', ') : 'Todavía no hay voces registradas.';
  }
  async function abrirReg() {
    if (!E.personas.length) E.personas = await getJ(URL_AGENTE, '/api/personas').catch(() => []);
    getJ(URL_AGENTE, '/api/voces/config').then((c) => { $r('vrTexto').textContent = c.lectura || ''; }).catch(() => {});
    await cargarVoces(); $r('vrEstado').textContent = ''; $r('vrAcepta').checked = false; pintarReg(); reg.hidden = false;
  }
  async function grabar20() {
    const persona = $r('vrPersona').value, est = $r('vrEstado');
    if (!persona) { est.textContent = 'Elige quién habla.'; return; }
    if (!$r('vrAcepta').checked) { est.textContent = 'Falta el consentimiento de la persona.'; return; }
    $r('vrGrabar').disabled = true;
    let s = null, c = null;
    try {
      s = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      c = new AudioContext({ sampleRate: RATE });
      const url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
      await c.audioWorklet.addModule(url); URL.revokeObjectURL(url);
      const n = new AudioWorkletNode(c, 'myo-captura'), partes = [];
      n.port.onmessage = (ev) => partes.push(ev.data);
      c.createMediaStreamSource(s).connect(n);
      for (let i = 20; i > 0; i--) { est.textContent = `Grabando… ${i} s`; await new Promise((r) => setTimeout(r, 1000)); }
      n.disconnect();
      const largo = partes.reduce((a, p) => a + p.length, 0), f = new Float32Array(largo); let o = 0;
      for (const p of partes) { f.set(p, o); o += p.length; }
      const i16 = new Int16Array(f.length); for (let i = 0; i < f.length; i++) i16[i] = Math.max(-1, Math.min(1, f[i])) * 0x7fff;
      est.textContent = 'Guardando la huella…';
      const r = await post(URL_AGENTE, '/api/voces/registrar', { persona, audio: b64(i16),
        consentimiento: { acepta: true, texto: 'Acepta que Myo guarde la huella de su voz (sin audio) para reconocerla en la sala.' } });
      est.textContent = `Listo: ${nombreDe(persona) || persona} quedó registrada (${r.segundos} s de voz, ${r.muestras} muestra${r.muestras > 1 ? 's' : ''}). Otra muestra mejora el reconocimiento.`;
      await cargarVoces(); pintarReg();
    } catch (e) { est.textContent = 'No se pudo registrar: ' + e.message; }
    finally { s && s.getTracks().forEach((t) => t.stop()); c && c.close(); $r('vrGrabar').disabled = false; }
  }
  $r('vrGrabar').addEventListener('click', grabar20);
  $r('vrCerrar').addEventListener('click', () => { reg.hidden = true; });
  $r('vrBorrar').addEventListener('click', async () => {
    const persona = $r('vrPersona').value; if (!persona) return;
    try { const r = await post(URL_AGENTE, '/api/voces/borrar', { persona }); $r('vrEstado').textContent = r.borrada ? 'Huella borrada.' : 'Esa persona no tenía una voz registrada.'; }
    catch (e) { $r('vrEstado').textContent = 'No se pudo borrar: ' + e.message; }
    for (const [h, p] of Object.entries(VOCES.auto)) if (p === persona) { delete VOCES.auto[h]; delete E.hablantes[h]; }
    await cargarVoces(); pintarReg(); pintarBarra();
  });
  const regBtn = Object.assign(document.createElement('button'), { id: 'vozRegBtn', type: 'button', className: 'dbtn', textContent: 'Registrar voz', title: 'Registrar la voz de alguien para que Myo lo reconozca (lo usa el acompañante)' });
  regBtn.addEventListener('click', abrirReg);
  if (devbar) ind.after(regBtn);
  cargarVoces();

  // ---------- Scribe v3 Live ----------
  const WS_URL = 'wss://api.elevenlabs.io/v1/speech-to-text/realtime';
  const RATE = 16000, CHUNK = RATE / 10, DIAR_ESPERA_MS = 1500;
  const WORKLET = 'class C extends AudioWorkletProcessor{process(i){const c=i[0]&&i[0][0];if(c)this.port.postMessage(c.slice(0));return true}}registerProcessor("myo-captura",C);';
  let ws = null, actx = null, stream = null, node = null, buf = new Float32Array(0), sesion = 0, siguiente = 1, hablaMyo = false;
  const etiquetas = new Map(), pendientes = new Map();

  // Mientras Myo habla (ElevenLabs o voz del sistema), al micrófono va silencio.
  if (window.VOZ && typeof VOZ.speak === 'function') {
    const o = VOZ.speak.bind(VOZ);
    VOZ.speak = (...a) => { hablaMyo = true; const p = o(...a); Promise.resolve(p).finally(() => setTimeout(() => { hablaMyo = false; }, 400)); return p; };
  }
  const callado = () => hablaMyo || (window.speechSynthesis && speechSynthesis.speaking);

  const etq = (spk) => {
    if (spk == null) return '';
    const k = sesion + ':' + spk;
    if (!etiquetas.has(k)) etiquetas.set(k, 'S' + siguiente++);
    return etiquetas.get(k);
  };
  const b64 = (i16) => { const u = new Uint8Array(i16.buffer); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };

  // Detector de voz local (modo «voz»): energía de cada bloque de 100 ms contra el ruido de fondo, que se adapta.
  const V = { piso: 0.004, ultimaVoz: 0, recientes: [], previo: [] };
  function hayVoz(f) {
    let e = 0; for (let i = 0; i < f.length; i++) e += f[i] * f[i];
    const rms = Math.sqrt(e / f.length);
    V.piso = rms < V.piso ? V.piso * 0.9 + rms * 0.1 : V.piso * 0.998 + rms * 0.002;   // baja rápido, sube lento
    V.recientes.push(rms > Math.max(V.piso * 3, 0.012)); if (V.recientes.length > 5) V.recientes.shift();
    return V.recientes.filter(Boolean).length >= 3;   // 300 ms de voz en los últimos 500 ms
  }
  // Anillo con los últimos 30 s del micrófono (solo en memoria del navegador): de aquí sale el audio de cada frase
  // para reconocer la voz. Mientras Myo habla se guarda silencio, igual que lo que va a ElevenLabs.
  const ANILLO = new Float32Array(RATE * 30);
  let total = 0, segIni = 0, inicioSesion = 0;
  function alAnillo(f32, mudo) {
    for (let i = 0; i < f32.length; i++) ANILLO[(total + i) % ANILLO.length] = mudo ? 0 : f32[i];
    total += f32.length;
  }
  function recorte(ini, fin) {
    ini = Math.max(Math.round(ini), total - ANILLO.length + 1, 0); fin = Math.min(Math.round(fin), total);
    if (fin - ini > RATE * 8) ini = fin - RATE * 8;   // con 8 s alcanza para la huella
    if (fin - ini < RATE * 0.8) return null;
    const out = new Int16Array(fin - ini);
    for (let i = ini; i < fin; i++) out[i - ini] = Math.max(-1, Math.min(1, ANILLO[i % ANILLO.length])) * 0x7fff;
    return b64(out);
  }
  function audio(f32) {
    alAnillo(f32, callado());
    const j = new Float32Array(buf.length + f32.length); j.set(buf); j.set(f32, buf.length); buf = j;
    while (buf.length >= CHUNK) {
      const bloque = buf.subarray(0, CHUNK), mudo = callado();
      const out = new Int16Array(CHUNK);
      if (!mudo) for (let i = 0; i < CHUNK; i++) out[i] = Math.max(-1, Math.min(1, bloque[i])) * 0x7fff;
      const msg = JSON.stringify({ message_type: 'input_audio_chunk', audio_base_64: b64(out), commit: false, sample_rate: RATE });
      if (modo === 'voz' && E.on) {
        if (!mudo && hayVoz(bloque)) {
          V.ultimaVoz = Date.now();
          if (!ws) conectar().catch((e) => say(e.message));
        }
        if (ws && ws.readyState === 1 && Date.now() - V.ultimaVoz > SILENCIO_MS) { say('45 s sin voz: cierro la sesión'); ws.close(); }
      }
      if (ws && ws.readyState === 1) ws.send(msg);
      else if (modo === 'voz') { V.previo.push(msg); if (V.previo.length > PREVIO_CHUNKS) V.previo.shift(); }
      buf = buf.slice(CHUNK);
    }
  }

  function tramos(words) {   // un tramo por hablante; una palabra sin hablante se queda con el anterior
    const out = [];
    for (const w of words || []) {
      const spk = w.type === 'word' ? w.speaker_id : null, last = out[out.length - 1];
      const ini = typeof w.start === 'number' ? w.start : null, fin = typeof w.end === 'number' ? w.end : null;
      if (!last || (spk != null && last.spk != null && spk !== last.spk)) out.push({ spk, t: w.text, ini, fin });
      else { last.t += w.text; if (last.spk == null) last.spk = spk; if (last.ini == null) last.ini = ini; if (fin != null) last.fin = fin; }
    }
    return out.map((x) => ({ hablante: etq(x.spk), texto: x.t.trim(),
      rango: x.ini != null && x.fin != null ? [inicioSesion + x.ini * RATE, inicioSesion + x.fin * RATE] : null })).filter((x) => x.texto);
  }

  function mensaje(m) {
    switch (m.message_type) {
      case 'session_started': say('escuchando con ElevenLabs'); break;
      case 'partial_transcript': if (m.text && !enChat()) { const i = document.getElementById('ctxIn'); if (i) i.placeholder = '… ' + m.text.slice(-80); } break;
      case 'committed_transcript': {
        if (!(m.text || '').trim()) break;
        const idx = m.segment_index;
        const rango = [segIni, total - RATE * 0.6]; segIni = total;   // la frase: desde el corte anterior hasta antes del silencio
        pendientes.set(idx, { texto: m.text, rango, timer: setTimeout(() => { pendientes.delete(idx); turnoConVoz(m.text, {}, rango); }, DIAR_ESPERA_MS) });
        break;
      }
      case 'diarized_transcript': {
        const p = pendientes.get(m.segment_index);
        if (!p) break;
        clearTimeout(p.timer); pendientes.delete(m.segment_index);
        const ts = tramos(m.words);
        if (!ts.length) turnoConVoz(p.texto, {}, p.rango);
        else ts.forEach((x) => turnoConVoz(x.texto, x.hablante ? { hablante: x.hablante } : {}, x.rango || (ts.length === 1 ? p.rango : null)));
        break;
      }
      case 'speakers_merged': {   // Scribe juntó dos voces: los turnos de una pasan a la otra
        const de = etq(m.from_speaker_id), a = etq(m.to_speaker_id);
        etiquetas.set(sesion + ':' + m.from_speaker_id, a);
        E.turnos.forEach((t) => { if (t.hablante === de) t.hablante = a; });
        if (E.hablantes[de] && !E.hablantes[a]) E.hablantes[a] = E.hablantes[de];
        delete E.hablantes[de]; pintarBarra();
        break;
      }
      default: if (m.error) say(m.message_type + ': ' + m.error);
    }
  }

  let conectando = false;   // una sola sesión a la vez: pedir el token tarda y llegan bloques de audio mientras tanto
  async function conectar() {
    if (conectando || ws) return;
    conectando = true;
    try { await abrirSesion(); } finally { conectando = false; }
  }
  async function abrirSesion() {
    const d = await post(URL_PUENTE, '/api/voz/escucha', {});
    const q = new URLSearchParams({ token: d.token });
    for (const [k, v] of Object.entries(d.params)) q.set(k, v);
    const vistos = new Set();
    // El nombre de la usuaria va primero (sin él, «Emmy» salía «Emi»).
    for (const n of [E.usuaria, ...E.personas.map((p) => p.nombre)])
      if (n && !vistos.has(n.toLowerCase()) && vistos.size < 50) { vistos.add(n.toLowerCase()); q.append('keyterms', n); }
    sesion += 1;
    const yo = ws = new WebSocket(WS_URL + '?' + q);
    yo.onopen = () => {
      ST.sesiones += 1; ST.desde = Date.now(); say(`sesión ${ST.sesiones} abierta (${modo})`);
      inicioSesion = segIni = total - V.previo.length * CHUNK;
      for (const m of V.previo.splice(0)) yo.send(m);   // modo «voz»: el inicio de la frase no se pierde
      pintarInd();
    };
    yo.onmessage = (ev) => { try { mensaje(JSON.parse(ev.data)); } catch (_) {} };
    yo.onclose = () => {
      if (ST.desde) { ST.msConectado += Date.now() - ST.desde; ST.desde = 0; }
      if (ws === yo) ws = null;
      pintarInd();
      // siempre/manual: reconecta. voz: solo si hubo voz hace poco (si no, espera la próxima).
      const seguir = E.on && (modo !== 'voz' || Date.now() - V.ultimaVoz < SILENCIO_MS);
      if (seguir) setTimeout(() => E.on && !ws && conectar().catch((e) => say(e.message)), 600);
    };
    pintarInd();
  }

  async function abrirMic() {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    actx = new AudioContext({ sampleRate: RATE });
    const url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
    await actx.audioWorklet.addModule(url); URL.revokeObjectURL(url);
    node = new AudioWorkletNode(actx, 'myo-captura');
    node.port.onmessage = (ev) => audio(ev.data);
    actx.createMediaStreamSource(stream).connect(node);
  }

  function cerrar() {
    for (const p of pendientes.values()) clearTimeout(p.timer);
    pendientes.clear();
    try { ws && ws.close(); } catch (_) {}
    ws = null; node && node.disconnect(); node = null;
    stream && stream.getTracks().forEach((t) => t.stop()); stream = null;
    actx && actx.close(); actx = null; buf = new Float32Array(0);
  }

  async function encender() {
    if (E.on) return;
    if (!URL_PUENTE) { say('falta la URL del puente (CFG.WA_URL)'); return; }
    E.on = true; btn.classList.add('on'); btn.textContent = '● Escuchando';
    try {
      if (!E.personas.length) E.personas = await getJ(URL_AGENTE, '/api/personas').catch(() => []);
      if (!E.usuaria) E.usuaria = (await getJ(URL_AGENTE, '/api/salud').catch(() => ({}))).usuaria || '';
      await abrirMic();
      if (actx && actx.state === 'suspended') say('el audio espera un clic o una tecla para empezar (política de Chrome)');
      if (modo !== 'voz') await conectar();
      pintarInd();
    } catch (e) { say('no se pudo escuchar: ' + e.message); apagar(); }
  }
  function apagar() {
    E.on = false; cerrar(); V.previo = []; btn.classList.remove('on'); btn.textContent = '🎙 Escuchar'; pintarInd();
    const i = document.getElementById('ctxIn'); if (i) i.placeholder = 'El acompañante escribe y aprieta Enter';
  }
  btn.addEventListener('click', () => { btn.blur(); E.on ? apagar() : encender(); });
  function cambiarModo() {
    modo = MODOS[(MODOS.indexOf(modo) + 1) % MODOS.length];
    try { localStorage.setItem('myo.escucha.modo', modo); } catch (_) {}
    const estaba = E.on; apagar();
    if (estaba && modo !== 'manual') encender();
    try { island('🎙', 'Escucha: ' + NOMBRE_MODO[modo]); } catch (_) {}
    say('modo ' + modo); pintarInd();
  }
  ind.addEventListener('click', (e) => { e.shiftKey ? cambiarModo() : (E.on ? apagar() : encender()); });
  addEventListener('keydown', (e) => {
    if (e.key !== 'o' && e.key !== 'O') return;
    if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    if (e.shiftKey) cambiarModo(); else E.on ? apagar() : encender();
  });
  // Chrome deja el audio en pausa hasta el primer gesto si no se abrió con --autoplay-policy: se reanuda con cualquier tecla o clic.
  const reanudar = () => { if (actx && actx.state === 'suspended') actx.resume().catch(() => {}); };
  addEventListener('pointerdown', reanudar, true); addEventListener('keydown', reanudar, true);
  getJ(URL_AGENTE, '/api/personas').then((p) => { E.personas = p; pintarBarra(); }).catch(() => {})
    .finally(() => { pintarInd(); if (modo !== 'manual') encender(); });   // sin botón: escucha sola al abrir la TV

  // Para probar sin micrófono: MYO_ESCUCHA.turno("¿Le duele la espalda?", {hablante: "S2"}); MYO_ESCUCHA.asignar("S2", "juan")
  window.MYO_ESCUCHA = { encender, apagar, turno, asignar, mas, enSala,
    modo: () => modo, cambiarModo,
    gasto: () => ({ modo, sesiones: ST.sesiones, segundos: Math.round((ST.msConectado + (ST.desde ? Date.now() - ST.desde : 0)) / 1000) }),
    estado: () => ({ on: E.on, turnos: E.turnos.slice(), hablantes: { ...E.hablantes }, pool: E.pool.map((c) => c.text), inicio: E.inicio }) };
})();
