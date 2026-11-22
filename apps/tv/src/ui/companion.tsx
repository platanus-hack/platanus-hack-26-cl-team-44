// Capa del acompañante: rueda de cuidados, barra inferior y panel de Controles.
// woki-os.html:589-655 y 1296-1329.
import { useEffect, useRef } from 'react';
import { useTv, useTvState } from './context';

export function CareWheelDialog() {
  const tv = useTv();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    return tv.attachCareWheel(ref.current);
  }, [tv]);
  return (
    <dialog id="care-wheel" ref={ref} aria-labelledby="care-title" aria-describedby="care-hint">
      <h2 id="care-title">Rueda de cuidados</h2>
      <p id="care-hint" />
      <div id="care-choices" />
      <footer>
        <span id="care-current" />
        <button type="button" id="care-pause">
          Pausar escaneo
        </button>
      </footer>
    </dialog>
  );
}

export function Devbar() {
  const tv = useTv();
  const light = useTvState((s) => s.theme === 'light');
  const open = useTvState((s) => s.legendOpen);
  return (
    <div id="devbar">
      <span className="v2-tag">v2</span>
      <button
        id="care-open"
        className="dbtn"
        type="button"
        aria-haspopup="dialog"
        onClick={(e) => {
          e.currentTarget.blur();
          tv.openCareWheel();
        }}
      >
        Cuidados
      </button>
      <button
        id="themeToggle"
        className="dbtn"
        type="button"
        role="switch"
        aria-checked={light}
        aria-label="Tema claro"
        title="Tema claro / oscuro (T)"
        onClick={(e) => {
          e.currentTarget.blur(); // Espacio = ceja
          tv.setTheme(!light);
        }}
      >
        <span className="track" aria-hidden="true">
          <span>☾</span>
          <span>☀︎</span>
          <span className="knob" />
        </span>
      </button>
      <button
        id="legendToggle"
        className="dbtn"
        type="button"
        aria-expanded={open}
        aria-controls="legend"
        title={open ? 'Ocultar controles' : 'Mostrar controles'}
        onClick={(e) => {
          e.currentTarget.blur();
          tv.toggleLegend();
        }}
      >
        <span>Controles</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 15l6-6 6 6" />
        </svg>
      </button>
    </div>
  );
}

const pad = (s: string) => `${s}                `.slice(0, 16);

function Diagnostics() {
  const tv = useTv();
  const s = useTvState((st) => st);
  const A = s.alarm;
  // LCD y LEDs de la pantalla junto a la cama. woki-os.html:2242-2251
  let l1: string;
  let l2: string;
  let led = 'g';
  if (A && A.level === 'emergencia') {
    l1 = A.ack ? 'AYUDA EN CAMINO' : 'EMERGENCIA';
    l2 = A.ack ? 'RESPONDIO' : 'FALTA CONFIRMAR';
    led = A.ack ? 'a' : 'r';
  } else if (A) {
    l1 = 'ATENCION';
    l2 = A.ack ? 'AYUDA EN CAMINO' : s.usuaria ? `${s.usuaria.toUpperCase()} LLAMA` : 'PIDE AYUDA';
    led = 'a';
  } else if (s.gazeLost) {
    l1 = `${'OK'.padEnd(11)}${s.clock}`;
    l2 = 'MIRADA: SIN CARA';
    led = 'a';
  } else {
    l1 = `${'OK'.padEnd(11)}${s.clock}`;
    l2 = 'SENSORES OK';
  }
  const selection = s.myowareConfirm
    ? 'MyoWare · ceja'
    : s.mode === 'click'
      ? 'Confirmar con la ceja'
      : `Mantener el puntero ${(s.dwellMs / 1000).toLocaleString('es')} s para elegir`;
  const pointer = s.gazeLost ? 'Escaneo' : 'Mouse';
  const signal = s.gazeLost ? 'wait' : 'off';
  const gestures = s.emgChannels.length ? 'EMG' : 'Teclado';
  let sos = tv.voz.callReady ? ['Listo', 'on'] : ['De prueba', 'off'];
  if (A?.level === 'emergencia') sos = A.real ? ['Alerta activa', 'alert'] : ['Prueba activa', 'wait'];
  else if (A) sos = ['Aviso de prueba', 'wait'];
  let wa: [string, string] | null = null;
  if (tv.cfg.waUrl) {
    wa = ['Sin conexión', 'off'];
    if (s.wa.online && s.wa.session === 'connected') wa = ['Conectado', 'on'];
    else if (s.wa.online && s.wa.session === 'dry') wa = ['De prueba', 'off'];
    else if (s.wa.online && !s.wa.session) wa = ['Conectando', 'wait'];
  }
  const mn = s.wa.mention;
  return (
    <div className="tool-content">
      <div id="diagnosticReadings" role="group" aria-label="Estado del sistema">
        <div className="status-group" title={selection}>
          <span className="status-key">Cámara apagada</span>
          <span className="status-reading">
            <span className="status-signal" data-state={signal}>
              {pointer}
            </span>
          </span>
        </div>
        <div className="status-group">
          <span className="status-key">Gestos · {gestures}</span>
          <span className="status-reading">
            <span className="status-signal" data-p="ceja" data-state={s.emgChannels.includes('ceja') ? 'on' : 'off'}>
              Ceja
            </span>
            <span
              className="status-signal"
              data-p="mandibula"
              data-state={s.emgChannels.includes('mandibula') ? 'on' : 'off'}
            >
              Mandíbula
            </span>
          </span>
        </div>
        <div className="status-group">
          <span className="status-key">SOS</span>
          <span className="status-reading">
            <span className="status-signal" data-state={sos[1]}>
              {sos[0]}
            </span>
          </span>
        </div>
        {wa && (
          <div className="status-group">
            <span className="status-key">WhatsApp</span>
            <span className="status-reading">
              <span className="status-signal" data-state={wa[1]}>
                {wa[0]}
              </span>
              {mn && Date.now() - mn.at < 15 * 60e3 && (
                <span className="status-mention" title={`${mn.from} te mencionó en ${mn.group}`}>
                  @{mn.from}
                </span>
              )}
            </span>
          </div>
        )}
      </div>
      <p>
        <strong>Pantalla junto a la cama (UNO)</strong>
      </p>
      <div className="lcd" id="lcd">
        {`${pad(l1)}\n${pad(l2)}`}
      </div>
      <div className="leds">
        <div
          className={`led${led === 'g' ? ' on' : ''}`}
          id="ledG"
          style={{ background: '#30D158', color: '#30D158' }}
        />
        <div
          className={`led${led === 'a' ? ' on' : ''}`}
          id="ledA"
          style={{ background: '#FF9F0A', color: '#FF9F0A' }}
        />
        <div
          className={`led${led === 'r' ? ' on' : ''}`}
          id="ledR"
          style={{ background: '#FF453A', color: '#FF453A' }}
        />
      </div>
      <p>
        <strong>Últimos eventos</strong>
      </p>
      <div id="evlog">{s.log.join('\n')}</div>
    </div>
  );
}

export function Legend() {
  const tv = useTv();
  return (
    <aside id="legend" aria-label="Controles del acompañante">
      <div className="legend-inner">
        <section className="camera-panel" aria-labelledby="cameraTitle">
          <div className="camera-preview" id="cameraPreview">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="2" y="5" width="14" height="14" rx="3" />
              <path d="m16 10 6-4v12l-6-4" />
            </svg>
          </div>
          <div>
            <h3 id="cameraTitle">Cámara</h3>
            <p id="cameraStatus" role="status" data-state="off">
              Cámara apagada
            </p>
            <button
              id="noseBtn"
              className="nbtn"
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                tv.island('📷', 'La cámara todavía no está en la v2. Usa la TV actual.');
              }}
            >
              Activar cámara
            </button>
          </div>
        </section>
        <div className="panel-tools">
          <details name="panel-tools">
            <summary>Atajos de teclado</summary>
            <div className="tool-content">
              <p>
                <strong>Al iniciar</strong> · <kbd>Enter</kbd> nariz · <kbd>E</kbd> mirada · <kbd>I</kbd> iPhone
              </p>
              <p>
                <strong>Puntero</strong> · <kbd>N</kbd> nariz o mouse · <kbd>E</kbd> mirada · <kbd>C</kbd> centrar nariz
                · <kbd>V</kbd> centrar mirada
              </p>
              <p>
                <strong>Gestos con teclado</strong> · <kbd>Espacio</kbd> elegir · <kbd>Esc</kbd> cerrar Cuidados
              </p>
              <p>
                <strong>Acompañante</strong> · <kbd>K</kbd> contactos de WhatsApp · <kbd>R</kbd> simular el llavero RFID
                · <kbd>M</kbd> silenciar la alarma · <kbd>Esc</kbd> salir del campo de texto
              </p>
              <p>
                <strong>Pruebas y pantalla</strong> · <kbd>G</kbd> simular pérdida del rostro · <kbd>W</kbd> simular
                temblor · <kbd>T</kbd> cambiar tema · <kbd>F</kbd> pantalla completa
              </p>
            </div>
          </details>
          <details name="panel-tools" id="diagnostics">
            <summary>Diagnóstico</summary>
            <Diagnostics />
          </details>
        </div>
      </div>
    </aside>
  );
}
