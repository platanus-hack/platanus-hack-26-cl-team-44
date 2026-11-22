// Ajustes y Tema y color. woki-os.html:1579-1611.
import { useTvState } from '../context';
import { ScreenSection } from '../Screen';
import { Target } from '../Target';

const PALETTES: [string, string][] = [
  ['noche', 'Noche'],
  ['bosque', 'Bosque'],
  ['oceano', 'Océano'],
  ['atardecer', 'Atardecer'],
  ['lavanda', 'Lavanda'],
];

function Look() {
  const light = useTvState((s) => s.theme === 'light');
  const pal = useTvState((s) => s.palette);
  const card = (act: string, sw: string, lb: string, on: boolean, i: number) => (
    <Target key={act} act={act} className={`set${on ? ' chosen' : ''}`} i={i}>
      <span className={`swatch swatch-${sw}`} />
      <div className="val">{lb}</div>
    </Target>
  );
  return (
    <>
      {card('look:oscuro', 'oscuro', 'Oscuro', !light, 0)}
      {card('look:claro', 'claro', 'Claro', light, 1)}
      <Target act="look:volver" className="set span3" i={2}>
        <div className="val">← Volver</div>
        <div className="lb">a Ajustes</div>
      </Target>
      {PALETTES.map(([id, lb], i) => card(`look:${id}`, id, lb, pal === id, 3 + i))}
    </>
  );
}

function Main() {
  const s = useTvState((st) => st);
  const browOnly = s.myowareConfirm;
  const paletteName = (PALETTES.find((p) => p[0] === s.palette) || PALETTES[0])[1];
  const items: [string, string, string, string][] = [
    [
      'Tiempo de mirada',
      browOnly ? 'Desactivado' : `${s.dwellMs} ms`,
      'set:dwell',
      browOnly ? 'modo ceja' : 'toca para cambiar',
    ],
    [
      'Confirmar con',
      s.myowareConfirm ? 'Ceja (MyoWare)' : s.mode === 'click' ? 'Ceja' : 'Solo mirada',
      'set:mode',
      '',
    ],
    s.voiceCount
      ? ['Voz', s.voiceLabel || 'ElevenLabs', 'set:voice', `${s.voiceCount} opciones · suena al cambiar`]
      : ['Voz', s.voiceLabel || 'Del sistema', 'set:voice', 'suena al cambiar'],
    ['Puntero', 'Mouse', 'set:pointer', 'mouse · nariz · mirada · iPhone'],
    ['Sensibilidad', ['Baja', 'Media', 'Alta'][s.sensIdx], 'set:sens', ''],
    ['Calibrar', 'De nuevo', 'set:calib', 'C = solo recentrar'],
    ['Clic con cara', s.faceClick ? 'Cejas + boca' : 'No', 'set:faceclick', 'respaldo sin EMG'],
    [
      'Teclado',
      s.sugMode === 'fila' ? 'Sugerencias fijas' : 'Sugerencias en lista',
      'set:sugmode',
      s.sugMode === 'fila' ? '3 arriba · 1 mirada' : '1 botón · más grande',
    ],
    [
      'Tema y color',
      `${s.theme === 'light' ? 'Claro' : 'Oscuro'} · ${paletteName}`,
      'set:theme',
      'claro u oscuro y fondo',
    ],
    ['Volver', 'Inicio', 'go:home', ''],
  ];
  return (
    <>
      {items.map(([lb, val, act, sub], i) => (
        <Target key={act} act={act} className="set" i={i}>
          <div className="lb">{lb}</div>
          <div className="val">{val}</div>
          {sub && <div className="lb">{sub}</div>}
        </Target>
      ))}
    </>
  );
}

export function Settings() {
  const page = useTvState((s) => s.setPage);
  return (
    <ScreenSection id="settings">
      <div className="grid5x2" id="sets">
        {page === 'look' ? <Look /> : <Main />}
      </div>
      <div className="hint">
        <span>
          <b>Ceja</b> cambiar
        </span>
      </div>
    </ScreenSection>
  );
}
