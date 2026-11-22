// Capas del lienzo: anillo de emociones, alarma, descanso, elección de control, isla y voz.
// woki-os.html:536-586.
import type { CSSProperties } from 'react';
import { EMO, EMOS } from '../domain/phrases';
import { useTv, useTvState } from './context';
import { Target } from './Target';

const iStyle = (i: number, extra: CSSProperties = {}) => ({ '--i': i, ...extra }) as CSSProperties;

export function EmoRing() {
  const i = useTvState((s) => s.emoRingFor);
  const cards = useTvState((s) => s.cards);
  const alarm = useTvState((s) => s.alarm?.level === 'emergencia');
  const c = i === null ? null : cards[i];
  return (
    <div className={`overlay${c ? ' on' : ''}`} id="emoRing" inert={alarm || undefined}>
      <div className="c" id="emoC">
        {c && (
          <>
            <div className="mid glass">
              “{c.text}”
              <br />
              <br />
              Propuesta: {EMO[c.emo].e} {EMO[c.emo].n}
            </div>
            {EMOS.map((e, k) => (
              <Target key={e.id} act={`setEmo:${e.id}`} style={iStyle(k)}>
                <span>{e.e}</span>
                {e.n}
              </Target>
            ))}
            <Target act="emoBack" style={iStyle(6, { color: 'var(--txt2)' })}>
              <span>←</span>Volver
            </Target>
          </>
        )}
      </div>
    </div>
  );
}

export function Alarm() {
  const tv = useTv();
  const a = useTvState((s) => s.alarm);
  const on = a?.level === 'emergencia';
  return (
    <div
      className={`overlay${on ? ' on' : ''}${a?.ack ? ' ack' : ''}`}
      id="alarm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alBig"
      aria-describedby="alSub"
    >
      <div className="sym" id="alSym">
        <svg aria-hidden="true">
          <use href={a?.ack ? '#i-check' : '#i-alert'} />
        </svg>
      </div>
      <div className="big" id="alBig" role="alert">
        {on ? a.big : ''}
      </div>
      <div className="sub" id="alSub">
        {a?.sub ?? 'No se contactó a nadie.'}
      </div>
      <div className="cancel" id="alCancel">
        {a?.cancel ?? ''}
      </div>
      <button
        type="button"
        className="cbtn"
        id="alDismiss"
        onClick={(e) => {
          e.currentTarget.blur();
          tv.dismissAlarm();
        }}
      >
        {a?.dismiss ?? 'Cerrar simulación'}
      </button>
    </div>
  );
}

export function Rest() {
  const rest = useTvState((s) => s.rest);
  const clock = useTvState((s) => s.clock);
  const alarm = useTvState((s) => s.alarm?.level === 'emergencia');
  return (
    <div
      className={`overlay${rest ? ' on' : ''}`}
      id="rest"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restTitle"
      inert={alarm || undefined}
    >
      <div className="big" id="restClock">
        {clock}
      </div>
      <div className="sub" id="restTitle">
        En descanso
      </div>
      <div className="rest-actions">
        <button type="button" className="t rest-wake" id="restWake" data-t="" data-act="wake" data-dwell="2000">
          <svg aria-hidden="true">
            <use href="#i-back" />
          </svg>
          <strong>Volver</strong>
          <small>Continuar en Myo</small>
          <span className="fill" />
        </button>
        <button type="button" className="t rest-sos" data-t="" data-act="sos" data-dwell="2000" aria-controls="alarm">
          <svg aria-hidden="true">
            <use href="#i-alert" />
          </svg>
          <strong>SOS</strong>
          <small>Pedir ayuda</small>
          <span className="fill" />
        </button>
      </div>
      <p className="rest-hint rest-dwell-label">Mira una opción durante 2 s o haz clic.</p>
    </div>
  );
}

const CONTROLS = [
  {
    c: 'start',
    title: 'Nariz',
    sub: 'Mueve la cabeza',
    icon: (
      <>
        <path d="M6 21v-4a8 8 0 1 1 13-6l2 4-3 1v2a2 2 0 0 1-2 2h-3v2" />
        <path d="M14 10h2" />
      </>
    ),
  },
  {
    c: 'gaze',
    title: 'Mirada con webcam',
    sub: 'Cámara del computador',
    icon: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  },
  {
    c: 'iphone',
    title: 'Mirada con iPhone',
    sub: 'Requiere Face ID',
    icon: (
      <>
        <rect x="6" y="2" width="12" height="20" rx="3" />
        <path d="M10 5h4m-3 14h2" />
      </>
    ),
  },
  {
    c: 'mouse',
    title: 'Mouse',
    sub: 'Sin cámara',
    icon: (
      <>
        <rect x="5" y="2" width="14" height="20" rx="7" />
        <path d="M12 2v7m-7 1h14" />
      </>
    ),
  },
] as const;

/** Elección de control al iniciar. woki-os.html:553-583 */
export function Calibration() {
  const tv = useTv();
  const open = useTvState((s) => s.calibOpen);
  const title = useTvState((s) => s.calibTitle);
  const text = useTvState((s) => s.calibText);
  const myo = useTvState((s) => s.myo);
  const alarm = useTvState((s) => s.alarm?.level === 'emergencia');
  return (
    <div
      className={`overlay${open ? ' on' : ''}`}
      id="calib"
      tabIndex={-1}
      aria-labelledby="calTitle"
      role="dialog"
      inert={alarm || undefined}
    >
      <div className="cal-card glass choose-control" id="calCard">
        <h1 className="cal-title" id="calTitle">
          {title}
        </h1>
        <div className="cal-text" id="calText" role="status">
          {text}
        </div>
        <div className="cal-steps" id="calSteps" />
        <div className="cal-btns" id="calBtns">
          {CONTROLS.map((o) => (
            <button
              key={o.c}
              type="button"
              className="cbtn control-option"
              data-c={o.c}
              onClick={(e) => {
                e.currentTarget.blur();
                tv.chooseControl(o.c);
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {o.icon}
              </svg>
              <span>
                <strong>{o.title}</strong>
                <small>{o.sub}</small>
              </span>
            </button>
          ))}
          <button
            type="button"
            className="cbtn resume-control"
            id="myoware-use-woki"
            hidden={!(myo.saved && myo.mode === 'off')}
            onClick={(e) => {
              e.currentTarget.blur();
              tv.startMouseWithMyoWare();
            }}
          >
            Usar mouse + gestos MyoWare
          </button>
        </div>
      </div>
      <div className="cal-dot" id="calDot">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle className="bg" cx="32" cy="32" r="28" />
          <circle className="fg" cx="32" cy="32" r="28" />
        </svg>
        <i />
      </div>
      <div className="cal-target" id="calTarget" />
    </div>
  );
}

export function Island() {
  const is = useTvState((s) => s.island);
  return (
    <div id="island" className={`${is.on ? 'on' : ''}${is.warn ? ' warn' : ''}`} role="status" aria-live="polite">
      <span className="ic" id="isIc">
        {is.ic}
      </span>
      <span id="isTx">{is.txt}</span>
    </div>
  );
}

export function Speaking() {
  const sp = useTvState((s) => s.speaking);
  return (
    <div id="speaking" className={sp.on ? 'on' : ''}>
      <span className="emo2" id="spEmo">
        {sp.emo}
      </span>
      <span className="txt" id="spTxt">
        {sp.txt}
      </span>
      <span className="wave" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}
