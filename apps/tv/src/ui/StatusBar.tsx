// Barra de estado del SO oficial: «‹ Inicio» y «‹ Volver» fuera de Inicio, nombre y reloj.
// woki-os.html:1262-1277. SOS y Descansar son tarjetas de Inicio, no van aquí.
import { SCREEN_TITLES, type Screen } from '../tv/types';
import { useTvState } from './context';
import { Target } from './Target';

export function StatusBar({ screen }: { screen: Screen }) {
  const clock = useTvState((s) => s.clock);
  return (
    <div className="status">
      {screen !== 'home' && (
        <>
          <Target as="button" act="go:home" className="nav-action home-nav" ring={false}>
            ‹ Inicio
          </Target>
          <Target as="button" act="back" className="nav-action back-nav" ring={false}>
            ‹ Volver
          </Target>
        </>
      )}
      <span className="screen-name">{SCREEN_TITLES[screen]}</span>
      <time className="clock">{clock}</time>
    </div>
  );
}
