// Inicio, Reacciones, Contactos, Confirmación de envío y pantallas pendientes.
import type { CSSProperties } from 'react';
import { REACT_PAGE, REACTS, TILES } from '../../domain/phrases';
import { faceOf, initial } from '../../tv/whatsapp';
import { useTv, useTvState } from '../context';
import { Use } from '../Icons';
import { ScreenSection } from '../Screen';
import { Target } from '../Target';

/** Inicio: ocho tarjetas. woki-os.html:468-472, 1254-1256 */
export function Home() {
  return (
    <ScreenSection id="home">
      <div className="grid4x2" id="tiles">
        {TILES.map(([act, g, ic, lb, sb, dw], i) => (
          <Target as="button" key={act} act={act} dwell={dw} className="tile" badge="Listo" i={i}>
            <span className={`app ${g}`} aria-hidden="true">
              <Use id={ic} />
            </span>
            <span className="lb">{lb}</span>
            <span className="sb">{sb}</span>
          </Target>
        ))}
      </div>
      <div className="hint">
        <span>
          <b>Ceja</b> elegir
        </span>
        <span>
          <b>Mandíbula</b> cuidados
        </span>
      </div>
    </ScreenSection>
  );
}

/** Reacciones: 4 por página, Más y Volver. woki-os.html:1571-1577 */
export function Reactions() {
  const page = useTvState((s) => s.reactPage);
  const items = REACTS.slice(page * REACT_PAGE, page * REACT_PAGE + REACT_PAGE);
  return (
    <ScreenSection id="reactions">
      <div className="grid3x2" id="reacts">
        {items.map((r, i) => (
          <Target key={r[1]} act={`react:${page * REACT_PAGE + i}`} className="react" i={i}>
            <span>{r[0]}</span>
            {r[1]}
          </Target>
        ))}
        <Target act="reactMore" className="react" style={{ color: 'var(--txt2)' }} i={items.length}>
          <span>→</span>Más
        </Target>
        <Target act="go:home" className="react" style={{ color: 'var(--txt2)' }} i={items.length + 1}>
          <span>←</span>Volver
        </Target>
      </div>
      <div className="hint">
        <span>
          <b>Ceja</b> decir
        </span>
        <span>
          <b>Mirar "más"</b> otra página
        </span>
      </div>
    </ScreenSection>
  );
}

/** Contactos principales de WhatsApp. woki-os.html:1065-1073 */
export function Contacts() {
  const tv = useTv();
  const favs = useTvState((s) => s.wa.favs);
  const shown = favs.slice(0, 6);
  return (
    <ScreenSection id="contacts">
      <div className="grid4x2" id="people">
        {!tv.cfg.waUrl ? (
          <div className="empty-favs glass" style={{ borderRadius: 'var(--r-lg)' }}>
            WhatsApp no está configurado<small>Falta CFG.WA_URL</small>
          </div>
        ) : !shown.length ? (
          <div className="empty-favs glass" style={{ borderRadius: 'var(--r-lg)' }}>
            Aún no hay contactos principales<small>El acompañante los elige con la tecla K o con «Ajustar».</small>
          </div>
        ) : null}
        {shown.map((c, i) => (
          <Target key={c.id} act={`waTo:${i}`} className="person" i={i + 1}>
            <div className="face" style={{ background: faceOf(c) }}>
              {initial(c.name)}
            </div>
            <div className="lb">{c.name}</div>
            <div className="sb">{c.relation || 'WhatsApp'}</div>
          </Target>
        ))}
        <Target act="waPanel" className="person tool" i={shown.length + 1}>
          <div className="face">＋</div>
          <div className="lb">Ajustar</div>
          <div className="sb">lo hace el acompañante</div>
        </Target>
        <Target act="go:home" className="person tool" i={shown.length + 2}>
          <div className="face">←</div>
          <div className="lb">Volver</div>
          <div className="sb">Inicio</div>
        </Target>
      </div>
      <div className="hint">
        <span>
          <b>Ceja</b> escribirle
        </span>
        <span>
          <b>K</b> el acompañante ajusta los contactos
        </span>
        <span>
          <b>Volver</b> regresar
        </span>
      </div>
    </ScreenSection>
  );
}

/** Confirmación de envío: destinatario y texto; Enviar pide otra ceja en 3 s. woki-os.html:504-520 */
export function AgentConfirm() {
  const agent = useTvState((s) => s.agent);
  const iStyle = (i: number) => ({ '--i': i }) as CSSProperties;
  return (
    <ScreenSection id="agent">
      <div className="ctx glass">
        <div className="avatar" id="agAv" style={{ background: agent.bg || 'linear-gradient(160deg,#5BE584,#1FA348)' }}>
          {agent.av || 'S'}
        </div>
        <span className="ctx-label">Intención</span>
        <div id="agTitle" style={{ fontSize: 56, fontWeight: 700, letterSpacing: '-.02em' }}>
          {agent.title || 'Responder a Sofía'}
        </div>
      </div>
      <div className="plan">
        <div className="steps glass stag" style={iStyle(0)}>
          <div className="step">
            <div className="n">1</div>
            <div>
              Abrir WhatsApp → <b id="agTo">{agent.to || 'Sofía (hija)'}</b>
            </div>
          </div>
          <div className="step">
            <div className="n">2</div>
            <div>
              Escribir
              <br />
              <div className="bubble" id="agentMsg">
                {agent.msg || '¡Obvio! Guárdame del postre de la abuela 🥰'}
              </div>
            </div>
          </div>
          <div className="step">
            <div className="n">3</div>
            <div>
              Enviar <span style={{ color: 'var(--orange)' }}>· no se puede deshacer</span>
            </div>
          </div>
        </div>
        <div className="decide">
          <Target
            act="agentSend"
            id="btnSend"
            className={`btn send stag${agent.pending ? ' pending' : ''}`}
            style={iStyle(1)}
          >
            <Use id="i-check" />
            {agent.pending ? 'Otra ceja' : 'Enviar'}
            <small>{agent.pending ? 'para enviar · 3 s' : 'Ceja, y otra ceja en 3 s'}</small>
          </Target>
          <Target act="go:home" className="btn cancel stag" style={iStyle(2)}>
            <Use id="i-x" />
            Cancelar<small>o esperar 10 s sin hacer nada</small>
          </Target>
        </div>
      </div>
      <div className="hint">
        <span>
          <b>Ceja</b> elegir
        </span>
        <span>Nunca se envía por no responder</span>
      </div>
    </ScreenSection>
  );
}

/** Apps y Juegos todavía no están en la v2: aviso y salida grande. */
export function Pending({ id, name }: { id: 'apps' | 'games'; name: string }) {
  return (
    <ScreenSection id={id}>
      <div className="pending-screen">
        <div className="pending-msg glass" role="status">
          <strong>{name} todavía no está en la v2</strong>
          <p>Esta pantalla sigue en la TV actual. La v2 la sumará cuando pase su prueba de paridad.</p>
        </div>
        <Target act="go:home" className="side">
          <Use id="i-back" />
          Volver<small>al inicio</small>
        </Target>
      </div>
    </ScreenSection>
  );
}
