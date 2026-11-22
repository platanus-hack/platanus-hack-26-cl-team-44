window.createCareWheel = function (dialog, { announce, silence, onAttention, onSOS, onPhrase, onBack, scanMs }) {
  const title = dialog.querySelector('h2');
  const hint = dialog.querySelector('#care-hint');
  const choices = dialog.querySelector('#care-choices');
  const label = dialog.querySelector('#care-current');
  const pause = dialog.querySelector('#care-pause');
  const main = [
    ['urgent', 'Ayuda urgente', 'north'],
    ['attention', 'Avisar a mi cuidador', 'east'],
    ['phrases', 'Frases rápidas', 'south'],
    ['back', 'Volver', 'west'],
    ['close', 'Cerrar', 'center'],
  ];
  const phrases = [
    ['position', 'Necesito cambiar de postura', 'north'],
    ['pain', 'Me duele', 'east'],
    ['bathroom', 'Necesito ir al baño', 'south'],
    ['moment', 'Dame un momento', 'west'],
    ['main', 'Volver a la rueda', 'center'],
  ];
  const urgent = [
    ['sos', 'Iniciar SOS de prueba', 'north'],
    ['main', 'Cancelar', 'center'],
  ];
  let view, selected, timer, buttons = [], paused = false;
  let bounds, direction, blockedDirection, missingSince;

  function gazeSlot(x, y) {
    const horizontal = Math.abs(x), vertical = Math.abs(y);
    const distance = Math.max(horizontal, vertical);
    if (distance < .22) return 'center';
    if (distance < .34) return direction;
    const side = x < 0 ? 'west' : 'east', height = y < 0 ? 'north' : 'south';
    // Retain the previous sector around diagonals instead of switching on noise.
    if (direction === side && horizontal >= .8 * vertical) return side;
    if (direction === height && vertical >= .8 * horizontal) return height;
    return horizontal >= vertical ? side : height;
  }

  function updateGaze(point, now) {
    if (!dialog.open || document.hidden) return;
    if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) {
      missingSince ??= now;
      if (direction && now - missingSince >= 350) {
        direction = blockedDirection = null;
        startScan(buttons.length - 1);
      }
      return;
    }
    missingSince = null;
    bounds ??= choices.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = (point.x - bounds.left) * 2 / bounds.width - 1;
    const y = (point.y - bounds.top) * 2 / bounds.height - 1;
    const slot = gazeSlot(x, y);
    if (!slot || slot === blockedDirection) return;
    blockedDirection = null;
    if (slot === 'center') {
      if (direction) {
        direction = null;
        startScan(buttons.length - 1);
      }
      return;
    }
    const index = buttons.findIndex(button => button.dataset.slot === slot);
    if (index === -1) {
      if (direction) {
        direction = null;
        startScan(buttons.length - 1);
      }
      return;
    }
    if (direction === slot) return;
    direction = slot;
    stopScan();
    highlight(index);
  }

  function highlight(index) {
    selected?.removeAttribute('data-scanned');
    selected = buttons[index];
    selected.setAttribute('data-scanned', '');
    label.textContent = selected.textContent;
    announce(selected.textContent);
  }

  function stopScan() {
    clearInterval(timer);
    silence();
  }

  function startScan(index) {
    stopScan();
    highlight(index);
    if (!paused && !document.hidden) {
      timer = setInterval(() => highlight((buttons.indexOf(selected) + 1) % buttons.length), scanMs);
    }
  }

  function show(next) {
    // Looking up to enter Urgent must not also highlight its confirmation.
    blockedDirection = direction;
    direction = bounds = null;
    view = next;
    title.textContent = next === 'urgent' ? 'Ayuda urgente' : next === 'phrases' ? 'Frases rápidas' : 'Rueda de cuidados';
    hint.textContent = next === 'urgent'
      ? 'Es una simulación. No se llamará ni se enviará ningún mensaje.'
      : 'Mira hacia un sector o escucha el escaneo. Levanta la ceja para confirmar.';
    const options = next === 'urgent' ? urgent : next === 'phrases' ? phrases : main;
    buttons = options.map(([id, text, slot]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.slot = slot;
      button.textContent = text;
      button.addEventListener('click', () => choose(id, text));
      return button;
    });
    choices.replaceChildren(...buttons);
    choices.dataset.view = next;
    buttons.at(-1).focus();
    startScan(buttons.length - 1);
  }

  function close() {
    if (!dialog.open) return;
    stopScan();
    direction = blockedDirection = missingSince = null;
    selected = null;
    dialog.close();
  }

  function choose(id, text) {
    if (!dialog.open) return;
    if (id === 'urgent' || id === 'phrases' || id === 'main') { show(id); return; }
    close();
    if (id === 'sos') onSOS();
    else if (id === 'attention') onAttention();
    else if (id === 'back') onBack();
    else if (id !== 'close') onPhrase(text);
  }

  pause.addEventListener('click', () => {
    paused = !paused;
    pause.textContent = paused ? 'Reanudar escaneo' : 'Pausar escaneo';
    if (paused) stopScan();
    else {
      blockedDirection = direction;
      direction = null;
      startScan(buttons.indexOf(selected));
    }
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  document.addEventListener('visibilitychange', () => {
    if (!dialog.open) return;
    if (document.hidden) stopScan();
    else {
      direction = blockedDirection = missingSince = null;
      startScan(buttons.length - 1);
    }
  });
  window.addEventListener('resize', () => { bounds = null; });
  dialog.addEventListener('scroll', () => { bounds = null; });

  return {
    get active() { return dialog.open; },
    open() {
      if (dialog.open) return;
      paused = false;
      pause.textContent = 'Pausar escaneo';
      dialog.showModal();
      show('main');
    },
    close,
    back() { if (view === 'main') close(); else show('main'); },
    updateGaze,
    confirm() { if (dialog.open) selected?.click(); },
  };
};
