// TV de Myo v2: lienzo de 1920×1080 escalado a la ventana, pantallas, capas y capa del acompañante.
// Mismo marcado e ids que software/toki-os/woki-os.html, para reutilizar su CSS y sus pruebas.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Tv } from './tv/tv';
import { CareWheelDialog, Devbar, Legend } from './ui/companion';
import { TvContext, useTv, useTvState } from './ui/context';
import { DevPanel } from './ui/DevPanel';
import { Icons } from './ui/Icons';
import { Alarm, Calibration, EmoRing, Island, Rest, Speaking } from './ui/overlays';
import { AgentConfirm, Contacts, Home, Pending, Reactions } from './ui/screens/basic';
import { KeyboardScreen } from './ui/screens/Keyboard';
import { Settings } from './ui/screens/Settings';
import { Talk } from './ui/screens/Talk';
import { WaPanel } from './ui/WaPanel';

/** Escala el lienzo a la ventana. Con Controles abiertos se reserva su altura. woki-os.html:1231-1239 */
function Stage() {
  const tv = useTv();
  const legendOpen = useTvState((s) => s.legendOpen);
  const wrap = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const fit = () => {
      const legend = document.getElementById('legend');
      const reserve = legendOpen ? (legend?.offsetHeight ?? 0) + 48 : 60;
      const s = Math.min((innerWidth - 16) / 1920, (innerHeight - reserve) / 1080);
      const w = wrap.current;
      if (w) {
        w.style.transform = `scale(${s})`;
        w.style.left = `${(innerWidth - 1920 * s) / 2}px`;
      }
      if (tv.s.scale !== s) tv.set({ scale: s });
    };
    fit();
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, [legendOpen, tv]);
  useEffect(() => {
    if (tv.s.calibOpen) document.getElementById('calib')?.focus({ preventScroll: true });
  }, [tv]);
  return (
    <div id="wrap" ref={wrap}>
      <div id="stage">
        <Home />
        <Talk />
        <KeyboardScreen />
        <Reactions />
        <AgentConfirm />
        <Contacts />
        <Settings />
        <Pending id="apps" name="Apps" />
        <Pending id="games" name="Juegos" />
        <EmoRing />
        <Alarm />
        <Rest />
        <Calibration />
        <Island />
        <Speaking />
      </div>
    </div>
  );
}

export function App() {
  const [tv] = useState(() => new Tv());
  useEffect(() => {
    tv.start();
    return () => tv.stop();
  }, [tv]);
  return (
    <TvContext.Provider value={tv}>
      <Icons />
      <Stage />
      <CareWheelDialog />
      <div id="gaze" />
      <Devbar />
      <Legend />
      <WaPanel />
      <DevPanel />
    </TvContext.Provider>
  );
}
