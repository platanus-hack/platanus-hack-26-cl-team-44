import type { ReactNode } from 'react';
import { SCREEN_TITLES, type Screen } from '../tv/types';
import { useTvState } from './context';
import { StatusBar } from './StatusBar';

/** Pantalla del lienzo. Queda inerte detrás de la alarma y del descanso (woki-os.html:2106, 2155). */
export function ScreenSection({
  id,
  extraClass = '',
  attrs,
  children,
}: {
  id: Screen;
  extraClass?: string;
  attrs?: Record<`data-${string}`, string>;
  children: ReactNode;
}) {
  const on = useTvState((s) => s.screen === id);
  const inert = useTvState((s) => s.alarm?.level === 'emergencia' || (s.rest && s.screen === id));
  return (
    <section
      className={`screen${on ? ' on' : ''}${extraClass ? ` ${extraClass}` : ''}`}
      id={`s-${id}`}
      data-title={SCREEN_TITLES[id]}
      inert={inert || undefined}
      {...attrs}
    >
      <StatusBar screen={id} />
      {children}
    </section>
  );
}
