function createMyoGestureController({
  isBlocked, getFocus, faceBrowMaxMs, flashGesture, confirmFocus, confirmGamePoint,
  canUseJaw, onJaw, setTimer = setTimeout, clearTimer = clearTimeout,
}) {
  const signalTimeoutMs = 250;
  let brow = null;
  let jawHeld = false;
  let watchdog = null;

  function cancel(origin) {
    if (!origin || brow?.origin === origin) brow = null;
    if (!origin || origin === 'myoware') {
      jawHeld = false;
      clearTimer(watchdog);
      watchdog = null;
    }
  }

  function press(src, origin, time) {
    if (src !== 'ceja' || brow || isBlocked()) return;
    brow = { origin, time, focus: getFocus() };
    flashGesture(src);
    if (origin !== 'face' && !confirmGamePoint()) confirmFocus();
  }

  function release(src, origin, time) {
    if (src !== 'ceja' || brow?.origin !== origin) return;
    const { time: pressedAt, focus } = brow;
    brow = null;
    const elapsed = time - pressedAt;
    if (origin === 'face' && elapsed >= 0 && elapsed < faceBrowMaxMs && focus === getFocus() && !isBlocked()) {
      confirmFocus();
    }
  }

  function jaw(edge) {
    if (edge === 'up' || edge === 'cancel') {
      jawHeld = false;
      return;
    }
    if (edge !== 'down' || jawHeld || !canUseJaw() || isBlocked()) return;
    jawHeld = true;
    flashGesture('mandibula');
    onJaw();
  }

  function receiveMyoWare(src, edge, time) {
    if (edge === 'alive') {
      clearTimer(watchdog);
      watchdog = setTimer(() => cancel('myoware'), signalTimeoutMs);
    } else if (edge === 'cancel' && (!src || src === 'ceja')) {
      cancel('myoware');
    } else if (src === 'mandibula') {
      jaw(edge);
    } else if (edge === 'down') {
      press(src, 'myoware', time);
    } else if (edge === 'up') {
      release(src, 'myoware', time);
    }
  }

  return {
    press, release, cancel, receiveMyoWare,
    isBrowHeld: () => brow !== null,
    isCameraBrowHeld: () => brow?.origin === 'face',
    hasMyoWareSignal: () => watchdog !== null,
  };
}
