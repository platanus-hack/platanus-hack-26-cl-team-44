import { setupMyoWareGestures } from './myoware-click.js';

export function createMyoWareHandoff({
  fromMonitor, trackerOnly, tabletComposer, getMode, pointingWithIPhone,
  setConfirmation, receiveInput, useMouse, calibrateWithSavedGaze, notify,
  isConfirming, setup = setupMyoWareGestures,
}) {
  let pendingHandoff = !trackerOnly && fromMonitor;
  let openingGaze = false;

  const myoware = setup(receiveInput, () => {
    pendingHandoff = false;
    useMouse();
  }, {
    onActivate: trackerOnly ? undefined : () => {
      if (!pointingWithIPhone()) setConfirmation(true);
    },
    enterGaze: trackerOnly ? undefined : async () => {
      if (openingGaze) return;
      openingGaze = true;
      try {
        await calibrateWithSavedGaze();
      } finally {
        openingGaze = false;
      }
    },
    onUnavailable(message) {
      if (isConfirming()) notify('⚠️', message, true, 6000);
    },
    onRecovered() {
      if (isConfirming()) notify('✓', 'Señal MyoWare recuperada');
    },
  });

  function startConfirmation() {
    if (!myoware.enable()) return false;
    pendingHandoff = false;
    if (!pointingWithIPhone()) setConfirmation(true);
    return true;
  }

  return {
    enableMyoWare: myoware.enable,
    resumeMyoWareHandoff() {
      if (pendingHandoff) startConfirmation();
    },
    resumeMyoWareForGaze(requested) {
      if (trackerOnly || (!requested && !pendingHandoff && (tabletComposer || getMode() === 'dwell'))) return false;
      return startConfirmation();
    },
  };
}
