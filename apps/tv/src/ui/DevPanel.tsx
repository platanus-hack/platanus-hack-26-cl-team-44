// Modo dev del agente: ?dev=1 o Shift+D. Simula un mensaje, lo manda al agente y muestra sus 4 opciones
// en Hablar. Port de software/toki-os/dev-agente.js. El panel no tiene data-t: la mirada no lo elige.
import { useCallback, useEffect, useRef, useState } from 'react';
import { tokenHeaders } from '../config';
import { type Card, isEmo, type Trace } from '../domain/phrases';
import { traceText } from '../domain/trace';
import { openSse, type SseConnection } from '../net/sse';
import { useTv, useTvState } from './context';

interface Persona {
  id: string;
  nombre: string;
  relacion?: string;
  tipo_interlocutor?: string;
}
interface Disparador {
  id: string;
  grupo_nombre: string;
  grupo_jid: string;
  estado: string;
}
interface AgentOption {
  text: string;
  tone?: string;
  origen?: string;
  emo?: string;
  traza?: Trace;
}
interface AgentEvent {
  tipo: string;
  etiqueta?: string;
  inicial?: string;
  texto?: string;
  resumen?: string;
  ultimo_encuentro?: string;
  opciones?: AgentOption[];
  descartadas?: { text: string; motivo: string }[];
  origen?: string;
  meta?: { ms_total?: number; duration_ms?: number; error?: string };
  traza?: {
    privacidad?: string;
    memorias_en_contexto?: Record<string, string[]>;
    fuera_por_privacidad?: number;
    temas_bloqueados?: string[];
  };
  error?: string;
}

const EJEMPLOS: [string, string, string][] = [
  ['pedro', 'grupo', '@Anita ¿vamos al cumple de Tomi el sábado?'],
  ['tomas', 'voz', 'Abuela, ¿por qué no puedes hablar? ¿Estás enferma?'],
  ['dra_perez', 'voz', '¿Cómo ha dormido con el remedio nuevo?'],
  ['', 'voz', 'Hola, soy Sofi. ¿Te traigo algo del súper?'],
];

export function DevPanel() {
  const open = useTvState((s) => s.devOpen);
  useEffect(() => {
    document.body.classList.toggle('myo-dev', open);
  }, [open]);
  return open ? <DevPanelBody /> : null;
}

function DevPanelBody() {
  const tv = useTv();
  const base = tv.cfg.devAgentUrl;
  const token = tv.cfg.waToken;
  const [dot, setDot] = useState('');
  const [estado, setEstado] = useState('conectando…');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [disp, setDisp] = useState<Disparador[]>([]);
  const [persona, setPersona] = useState('');
  const [canal, setCanal] = useState('grupo');
  const [texto, setTexto] = useState('');
  const [busy, setBusy] = useState(false);
  const [traza, setTraza] = useState('');
  const sse = useRef<SseConnection | null>(null);

  const api = useCallback(
    (path: string, opts: RequestInit = {}) =>
      fetch(base + path, { ...opts, headers: tokenHeaders(token, (opts.headers as Record<string, string>) || {}) }),
    [base, token],
  );
  const log = useCallback((t: string) => setTraza((p) => `${t}\n${p.slice(0, 4000)}`), []);

  const contexto = useCallback(
    (ev: AgentEvent) => {
      const s = tv.s;
      tv.setCtx(ev.etiqueta || '', (ev.inicial || ev.etiqueta || '?').slice(0, 1), ev.texto || '', s.ctx.ph, s.ctx.bg);
      tv.set({ devMeta: [ev.resumen, ev.ultimo_encuentro].filter(Boolean).join('  ·  ') });
    },
    [tv],
  );

  const cargarDisparadores = useCallback(async () => {
    const list: Disparador[] = await (await api('/api/disparadores')).json();
    setDisp(list);
  }, [api]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const j = await (await api('/api/salud')).json();
        if (!alive) return;
        setDot('ok');
        setEstado(`${j.usuaria} · ${j.personas} personas · ${j.modelo}`);
        setPersonas(await (await api('/api/personas')).json());
        await cargarDisparadores();
        if (!alive || sse.current) return;
        sse.current = openSse(`${base}/api/eventos`, tokenHeaders(token), {
          onopen: () => setDot('ok'),
          onerror: () => setDot('ko'),
          onmessage: (m) => {
            const ev: AgentEvent = JSON.parse(m.data);
            if (ev.tipo === 'pensando') {
              log(`… ${ev.etiqueta}: "${ev.texto}"`);
              contexto(ev);
              tv.go('talk');
              tv.set({ cardsLoading: true });
              tv.log(`agente pensando · ${ev.etiqueta}`);
            }
            if (ev.tipo === 'opciones') {
              const cards: Card[] = (ev.opciones || []).map((o) => ({
                text: o.text,
                tone: o.tone || o.origen || '',
                emo: isEmo(o.emo) ? o.emo : 'seria',
                traza: o.traza || { origen: o.origen },
              }));
              tv.setCards(cards);
              contexto(ev);
              tv.set({ cardsLoading: false });
              if (tv.s.screen !== 'talk') tv.go('talk');
              setBusy(false);
              const meta = ev.meta || {};
              const t = ev.traza;
              log(
                [
                  `✓ ${ev.origen} · ${meta.ms_total ?? '?'} ms total · ${meta.duration_ms ?? '-'} ms modelo${meta.error ? ` · ${meta.error}` : ''}`,
                  ...(t
                    ? [
                        `contexto: ${t.privacidad} · ${Object.entries(t.memorias_en_contexto || {})
                          .map(([k, ids]) => `${k} ${ids.length}`)
                          .join(
                            ', ',
                          )} · ${t.fuera_por_privacidad} fuera por privacidad${t.temas_bloqueados?.length ? ` · bloqueados: ${t.temas_bloqueados.join(', ')}` : ''}`,
                      ]
                    : []),
                  ...(ev.opciones || []).map(
                    (o, i) =>
                      `  ${i + 1}. [${o.emo}] ${o.text}\n     ${traceText(o.traza || { origen: o.origen }, true)}`,
                  ),
                  ...(ev.descartadas || []).map((o) => `  ✗ ${o.text}  ← ${o.motivo}`),
                ].join('\n'),
              );
              tv.log(`agente · ${ev.origen} · ${meta.ms_total ?? '?'} ms`);
            }
            if (ev.tipo === 'disparador') void cargarDisparadores();
            if (ev.tipo === 'error') {
              log(`ERROR ${ev.error}`);
              setBusy(false);
            }
          },
        });
      } catch {
        if (!alive) return;
        setDot('ko');
        setEstado(`Sin agente en ${base}. Corre software/agent/server.py`);
      }
    })();
    return () => {
      alive = false;
      sse.current?.close();
      sse.current = null;
    };
  }, [api, base, token, cargarDisparadores, contexto, log, tv]);

  const simularGrupo = async (t: string) => {
    const d = disp[0];
    if (!d) {
      log('No hay disparador de grupo');
      setBusy(false);
      return;
    }
    const p = personas.find((x) => x.id === persona);
    const nombre = p ? p.nombre : 'Alguien';
    contexto({ tipo: 'pensando', etiqueta: `${nombre} te mencionó en ${d.grupo_nombre}`, texto: t });
    tv.go('talk');
    tv.set({ cardsLoading: true });
    try {
      const r = await api('/api/grupo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `dev-${Date.now()}`,
          grupo_jid: d.grupo_jid,
          grupo_nombre: d.grupo_nombre,
          persona: persona || null,
          autor_nombre: nombre,
          texto: t,
          menciona: true,
        }),
      });
      const j = await r.json();
      if (j.accion !== 'mencion') {
        log(`grupo → ${j.accion}${j.motivo ? ` · ${j.motivo}` : ''}`);
        tv.set({ cardsLoading: false });
        setBusy(false);
      }
    } catch (e) {
      log(`ERROR ${(e as Error).message}`);
      setBusy(false);
    }
  };

  const simular = async () => {
    const t = texto.trim();
    if (!t) return;
    setBusy(true);
    if (canal === 'grupo') return simularGrupo(t);
    try {
      const r = await api('/api/simular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: t, persona: persona || null, canal }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || r.status);
      log(`→ enviado ${j.id} · en bandeja ${j.en_bandeja} · TVs ${j.tvs}`);
    } catch (e) {
      log(`ERROR ${(e as Error).message}`);
      setBusy(false);
    }
  };

  const toggleDisp = async (d: Disparador) => {
    const est = d.estado === 'activo' ? 'pausado' : 'activo';
    await api('/api/disparadores/estado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: d.id, estado: est }),
    });
    log(`disparador ${d.id} → ${est}`);
    void cargarDisparadores();
  };

  return (
    // El teclado del panel no llega a la TV: Espacio es la ceja y Enter pide frases.
    <div
      id="tokiDev"
      role="region"
      aria-label="Modo dev del agente"
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter' && (e.target as HTMLElement).id === 'devTexto') void simular();
      }}
    >
      <h3>
        <span>
          <span className={`dot ${dot}`} id="devDot" />
          Modo dev · agente
        </span>
        <span style={{ color: '#888' }}>Shift+D cierra</span>
      </h3>
      <div id="devEstado" style={{ color: '#aaa', fontSize: 11 }}>
        {estado}
      </div>
      <span className="dev-label">Disparadores</span>
      <div id="devDisp">
        {disp.length ? (
          disp.map((d) => (
            <div className="disp" key={d.id}>
              <span>
                {d.grupo_nombre} · mención <span className={`est ${d.estado}`}>{d.estado}</span>
              </span>
              <button type="button" onClick={() => void toggleDisp(d)}>
                {d.estado === 'activo' ? 'Pausar' : 'Aprobar'}
              </button>
            </div>
          ))
        ) : (
          <div style={{ color: '#888' }}>Sin disparadores</div>
        )}
      </div>
      <label htmlFor="devPersona">Quién habla</label>
      <select id="devPersona" value={persona} onChange={(e) => setPersona(e.target.value)}>
        <option value="">(detectar por nombre)</option>
        {personas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre} · {p.relacion} · {p.tipo_interlocutor}
          </option>
        ))}
      </select>
      <label htmlFor="devCanal">Canal</label>
      <select id="devCanal" value={canal} onChange={(e) => setCanal(e.target.value)}>
        <option value="grupo">Mención en el grupo (usa el disparador)</option>
        <option value="voz">Voz en la sala</option>
      </select>
      <label htmlFor="devTexto">Mensaje</label>
      <input
        id="devTexto"
        placeholder="Escribe y aprieta Enter"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <div className="ej">
        {EJEMPLOS.map((ej) => (
          <button
            type="button"
            key={ej[2]}
            onClick={() => {
              setPersona(ej[0]);
              setCanal(ej[1]);
              setTexto(ej[2]);
            }}
          >
            {ej[2].slice(0, 28)}…
          </button>
        ))}
      </div>
      <button type="button" id="devBtn" disabled={busy} onClick={() => void simular()}>
        Simular
      </button>
      <pre id="devTraza">{traza}</pre>
    </div>
  );
}
