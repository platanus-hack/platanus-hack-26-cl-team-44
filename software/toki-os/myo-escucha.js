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
 * No toca la lógica de la TV: usa window.MYO.S, CFG y las funciones globales go(), setCtx(), renderCards(), log().
 * Medido (pruebas con voces sintéticas): sin ruido de fondo, 100 % de turnos con el hablante correcto y ~0,65 s de
 * latencia; con la TV del cuarto a volumen medio o alto los turnos se atrasan 8-14 s. Aviso de privacidad: en el plan
 * actual de ElevenLabs (no Enterprise) el audio queda registrado en sus servidores.
 */
(() => {
  const W = window.MYO;
  if (!W || !document.getElementById('s-talk')) return;
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

  const E = { on: false, turnos: [], personas: [], hablantes: {}, req: 0, ultimoTurno: 0 };
  try { E.hablantes = JSON.parse(sessionStorage.getItem('myo.hablantes') || '{}'); } catch (_) {}

  // ---------- interfaz: botón y barra de voces (para el acompañante) ----------
  const css = `
  #escuchaBtn{margin-left:auto;padding:10px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:inherit;font:600 18px/1 system-ui;cursor:pointer;white-space:nowrap}
  #escuchaBtn.on{background:#ff453a;border-color:#ff453a;color:#fff}
  #escuchaBar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:8px 0 0;font:17px/1.3 system-ui;opacity:.92}
  #escuchaBar:empty{display:none}
  #escuchaBar .voz{display:inline-flex;gap:6px;align-items:center;padding:3px 8px 3px 10px;border-radius:999px;background:rgba(255,255,255,.1)}
  #escuchaBar .voz.anon{outline:2px dashed rgba(255,255,255,.35);outline-offset:-2px}
  #escuchaBar select{background:#111;color:#eee;border:1px solid #444;border-radius:8px;padding:4px 8px;font:inherit}
  #escuchaBar .priv{opacity:.75}`;
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: css }));
  const ctx = document.querySelector('#s-talk .ctx');
  const btn = Object.assign(document.createElement('button'), { id: 'escuchaBtn', type: 'button', textContent: '🎙 Escuchar', title: 'Escuchar la sala y separar las voces (lo usa el acompañante)' });
  ctx.appendChild(btn);
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
      chip.append('Voz ' + h.replace(/^S/, ''));
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
    setCtx(etiqueta(t) + ' dice', etiqueta(t).slice(0, 1).toUpperCase(), t.texto, 'Escuchando la sala…', pid ? '' : 'rgba(255,255,255,.18)');
    if (W.S.screen === 'home') go('talk');
    const base = cuerpo(t);
    // 1) Tarjetas por tema: al instante.
    let tarjetas = [];
    try {
      const r = await post(URL_AGENTE, '/api/tarjetas', { ...base, historial: E.turnos.slice(-3, -1).map((x) => x.texto) });
      if (id !== E.req) return;
      pintarBarra(r);
      tarjetas = (r.tarjetas || []).map((c) => ({ text: c.texto, tone: 'Tarjeta · ' + (r.tema ? r.tema.nombre : 'tema'), emo: 'seria',
        tarjeta: { id: c.id, tema: c.tema, persona: r.persona || null } }));
      if (tarjetas.length) { W.S.cards = tarjetas.slice(0, 4); if (W.S.screen === 'talk') renderCards(); }
    } catch (e) { say('tarjetas: ' + e.message); }
    // 2) Opciones del agente (con memoria): 3 del agente + la mejor tarjeta del tema.
    document.getElementById('cards')?.classList.add('loading');
    try {
      const hist = E.turnos.slice(-MAX_TURNOS, -1).map((x) => etiqueta(x) + ': ' + x.texto);
      const r = await post(URL_AGENTE, '/api/sugerir', { ...base, modo: 'voz', historial: hist });
      if (id !== E.req) return;
      const ops = (r.opciones || []).map((o) => ({ text: o.text, tone: o.tone || o.origen, emo: EMOS.includes(o.emo) ? o.emo : 'seria' }));
      const extra = tarjetas.find((c) => !ops.some((o) => o.text.toLowerCase() === c.text.toLowerCase()));
      W.S.cards = [...ops.slice(0, extra ? 3 : 4), ...(extra ? [extra] : [])];
    } catch (e) { say('agente: ' + e.message); }
    document.getElementById('cards')?.classList.remove('loading');
    if (id === E.req && W.S.screen === 'talk') renderCards();
  }

  function turno(texto, meta = {}) {
    texto = String(texto || '').trim();
    if (!texto) return;
    const t = { texto, hablante: meta.hablante || '', persona: meta.persona || '' };
    E.ultimoTurno = Date.now();
    E.turnos.push(t);
    E.turnos = E.turnos.slice(-MAX_TURNOS);
    pintarBarra();
    mostrar(t);
  }

  // Al pasar de Inicio a Hablar, la TV genera sus propias sugerencias (genSuggestions). Si un turno escuchado
  // acaba de llegar, Hablar muestra las tarjetas de ese turno. Lo que escribe el acompañante sigue igual.
  if (typeof window.genSuggestions === 'function') {
    const origGen = window.genSuggestions;
    window.genSuggestions = function () {
      if (Date.now() - E.ultimoTurno < 3000 && !enChat()) { if (W.S.screen === 'talk') renderCards(); return Promise.resolve(); }
      return origGen.apply(this, arguments);
    };
  }

  // Aprender: cuando Myo dice una tarjeta del tema, el agente lo anota (id, tema y persona; sin texto).
  if (typeof window.speak === 'function') {
    const orig = window.speak;
    window.speak = function (text, emo) {
      const c = (W.S.cards || []).find((x) => x.tarjeta && x.text === text);
      if (c) post(URL_AGENTE, '/api/tarjetas/uso', { tarjeta_id: c.tarjeta.id, tema: c.tarjeta.tema, persona: c.tarjeta.persona || undefined }).catch(() => {});
      return orig.apply(this, arguments);
    };
  }

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

  function audio(f32) {
    const j = new Float32Array(buf.length + f32.length); j.set(buf); j.set(f32, buf.length); buf = j;
    while (buf.length >= CHUNK) {
      const out = new Int16Array(CHUNK);
      if (!callado()) for (let i = 0; i < CHUNK; i++) out[i] = Math.max(-1, Math.min(1, buf[i])) * 0x7fff;
      if (ws && ws.readyState === 1) ws.send(JSON.stringify({ message_type: 'input_audio_chunk', audio_base_64: b64(out), commit: false, sample_rate: RATE }));
      buf = buf.slice(CHUNK);
    }
  }

  function tramos(words) {   // un tramo por hablante; una palabra sin hablante se queda con el anterior
    const out = [];
    for (const w of words || []) {
      const spk = w.type === 'word' ? w.speaker_id : null, last = out[out.length - 1];
      if (!last || (spk != null && last.spk != null && spk !== last.spk)) out.push({ spk, t: w.text });
      else { last.t += w.text; if (last.spk == null) last.spk = spk; }
    }
    return out.map((x) => ({ hablante: etq(x.spk), texto: x.t.trim() })).filter((x) => x.texto);
  }

  function mensaje(m) {
    switch (m.message_type) {
      case 'session_started': say('escuchando con ElevenLabs'); break;
      case 'partial_transcript': if (m.text && !enChat()) { const i = document.getElementById('ctxIn'); if (i) i.placeholder = '… ' + m.text.slice(-80); } break;
      case 'committed_transcript': {
        if (!(m.text || '').trim()) break;
        const idx = m.segment_index;
        pendientes.set(idx, { texto: m.text, timer: setTimeout(() => { pendientes.delete(idx); turno(m.text, {}); }, DIAR_ESPERA_MS) });
        break;
      }
      case 'diarized_transcript': {
        const p = pendientes.get(m.segment_index);
        if (!p) break;
        clearTimeout(p.timer); pendientes.delete(m.segment_index);
        const ts = tramos(m.words);
        if (!ts.length) turno(p.texto, {}); else ts.forEach((x) => turno(x.texto, x.hablante ? { hablante: x.hablante } : {}));
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

  async function conectar() {
    const d = await post(URL_PUENTE, '/api/voz/escucha', {});
    const q = new URLSearchParams({ token: d.token });
    for (const [k, v] of Object.entries(d.params)) q.set(k, v);
    const vistos = new Set();
    for (const n of [W.S.usuaria, ...E.personas.map((p) => p.nombre)]) if (n && !vistos.has(n.toLowerCase()) && vistos.size < 50) { vistos.add(n.toLowerCase()); q.append('keyterms', n); }
    sesion += 1;
    ws = new WebSocket(WS_URL + '?' + q);
    ws.onmessage = (ev) => { try { mensaje(JSON.parse(ev.data)); } catch (_) {} };
    ws.onclose = () => { ws = null; if (E.on) setTimeout(() => E.on && conectar().catch((e) => say(e.message)), 600); };
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
      await abrirMic(); await conectar();
    } catch (e) { say('no se pudo escuchar: ' + e.message); apagar(); }
  }
  function apagar() {
    E.on = false; cerrar(); btn.classList.remove('on'); btn.textContent = '🎙 Escuchar';
    const i = document.getElementById('ctxIn'); if (i) i.placeholder = 'El acompañante escribe y aprieta Enter';
  }
  btn.addEventListener('click', () => { btn.blur(); E.on ? apagar() : encender(); });
  getJ(URL_AGENTE, '/api/personas').then((p) => { E.personas = p; pintarBarra(); }).catch(() => {});

  // Para probar sin micrófono: MYO_ESCUCHA.turno("¿Le duele la espalda?", {hablante: "S2"}); MYO_ESCUCHA.asignar("S2", "juan")
  window.MYO_ESCUCHA = { encender, apagar, turno, asignar, estado: () => ({ on: E.on, turnos: E.turnos.slice(), hablantes: { ...E.hablantes } }) };
})();
