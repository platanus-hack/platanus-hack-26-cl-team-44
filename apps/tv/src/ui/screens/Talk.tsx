// Hablar: contexto, chat de WhatsApp y cuatro respuestas. woki-os.html:475-487, 1394-1412.
import type { ReactNode } from 'react';
import { type Card, EMO } from '../../domain/phrases';
import { traceText } from '../../domain/trace';
import { hhmmOf, TICKS } from '../../tv/whatsapp';
import { useTv, useTvState } from '../context';
import { Use } from '../Icons';
import { ScreenSection } from '../Screen';
import { Target } from '../Target';

function Trace({ c }: { c: Card }) {
  return (
    <div className="traza" title={traceText(c.traza, true)}>
      {traceText(c.traza, false)}
    </div>
  );
}

function CardView({
  c,
  i,
  k,
  chat,
  dev,
  emoDwell,
}: {
  c: Card;
  i: number;
  k: number;
  chat: boolean;
  dev: boolean;
  emoDwell: number;
}) {
  if (c.plain)
    return (
      <Target act={`say:${i}`} className="card plain" i={k}>
        <div className="ph">{c.text}</div>
        <div className="tone">{c.tone}</div>
        {dev && <Trace c={c} />}
      </Target>
    );
  const e = EMO[c.emo];
  return (
    <Target act={`say:${i}`} className="card" prior={i === 0 && chat ? '1.25' : undefined} i={k}>
      <div className="ph">{c.text}</div>
      <div className="tone">
        {c.ai && (
          <>
            <span className="ai">✨</span>{' '}
          </>
        )}
        {c.tone === e.n ? c.tone : `${c.tone} · ${e.n}`}
      </div>
      <Target act={`emo:${i}`} className="emo" dwell={emoDwell} badge={null}>
        {e.e}
      </Target>
      {dev && <Trace c={c} />}
    </Target>
  );
}

function Chat() {
  const to = useTvState((s) => s.wa.to);
  const hist = useTvState((s) => s.wa.hist);
  if (!to) return null;
  const list = (hist[to.id] || []).slice(-10);
  return (
    <>
      <div className="chat-h" id="chatH">
        <span className="live" />
        Chat con {to.name}
      </div>
      <div className="chat-list" id="chatList">
        {list.length ? (
          list.map((m) => {
            const meta =
              m.dir === 'in'
                ? hhmmOf(m.at)
                : `${m.via === 'phone' ? 'desde el celular · ' : ''}${hhmmOf(m.at)}${m.status && TICKS[m.status] ? ` · ${TICKS[m.status]}` : ''}`;
            return (
              <div key={m.id} className={`msg ${m.dir}`}>
                {m.text}
                <span className="meta">{meta}</span>
              </div>
            );
          })
        ) : (
          <div className="chat-empty">Todavía no hay mensajes con {to.name}.</div>
        )}
      </div>
    </>
  );
}

export function Talk() {
  const tv = useTv();
  const ctx = useTvState((s) => s.ctx);
  const cards = useTvState((s) => s.cards);
  const loading = useTvState((s) => s.cardsLoading);
  const aiWait = useTvState((s) => s.aiWait);
  const chat = useTvState((s) => !!s.wa.to);
  const dev = useTvState((s) => s.devOpen);
  const devMeta = useTvState((s) => s.devMeta);
  const usuaria = useTvState((s) => s.usuaria);
  const emoDwell = useTvState((s) => s.dwellMs);
  const c = cards.slice(0, 4);
  const card = (i: number, k: number) =>
    c[i] ? <CardView key={`say:${i}`} c={c[i]} i={i} k={k} chat={chat} dev={dev} emoDwell={emoDwell} /> : null;
  // fila 1: frase, frase, Escribir · fila 2: frase, frase, Volver (siempre hay salida sin gestos).
  // En un chat: «Escribir» pasa a iniciales y la 4.ª tarjeta es «Otro».
  const items: ReactNode[] = [
    card(0, 0),
    card(1, 1),
    chat ? (
      <Target key="waKb" act="waKb" className="side" i={2}>
        <Use id="i-keys" />
        Escribir<small>con iniciales</small>
      </Target>
    ) : (
      <Target key="kb" act="go:keyboard" className="side" i={2}>
        <Use id="i-keys" />
        Escribir<small>con letras</small>
      </Target>
    ),
    card(2, 3),
    chat ? (
      <Target key="waMore" act="waMore" className="card plain" i={4}>
        <div className="ph">Otro</div>
        <div className="tone">
          {aiWait ? <span className="ai-wait">✨ Claude está leyendo el chat…</span> : 'más respuestas'}
        </div>
      </Target>
    ) : (
      card(3, 4)
    ),
    <Target key="home" act="go:home" className="side" i={5}>
      <Use id="i-back" />
      Volver<small>al inicio</small>
    </Target>,
  ];
  return (
    <ScreenSection id="talk" extraClass={chat ? 'chatmode' : ''}>
      <div className="ctx glass">
        <div className="avatar" style={{ background: ctx.bg || undefined }}>
          {ctx.av}
        </div>
        <label htmlFor="ctxIn">{ctx.label}</label>
        <input
          id="ctxIn"
          placeholder={ctx.ph}
          value={ctx.val}
          autoComplete="off"
          onChange={(e) => tv.setCtxValue(e.target.value)}
        />
        <div className="typing" id="typing">
          <i />
          <i />
          <i />
          <span id="typingWho">{usuaria ? `${usuaria} está escribiendo` : 'Escribiendo'}</span>
        </div>
      </div>
      {dev && devMeta && <div id="devMeta">{devMeta}</div>}
      <div className="talkbody">
        <div className="chat glass" id="chat" aria-live="polite">
          <Chat />
        </div>
        <div className={`talkgrid${loading ? ' loading' : ''}`} id="cards">
          {items}
        </div>
      </div>
      <div className="hint">
        <span id="talkHint">
          <b>Ceja</b> {chat ? 'elegir respuesta' : 'decir'}
        </span>
        <span>
          <b>Emoji</b> cambiar emoción
        </span>
      </div>
    </ScreenSection>
  );
}
