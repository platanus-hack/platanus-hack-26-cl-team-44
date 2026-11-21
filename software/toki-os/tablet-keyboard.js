if (guidedSetup) {
  const calibration = document.getElementById('calib');
  document.getElementById('calBtns').hidden = true;
  // La tablet presenta las opciones. Este marco solo mide el control elegido.
  for (const sibling of calibration.parentElement.children) {
    if (sibling !== calibration) sibling.inert = true;
  }
  document.getElementById('legend').inert = true;
  const title = document.getElementById('calTitle');
  title.tabIndex = -1;
  title.setAttribute('role','heading');
  title.setAttribute('aria-level','1');
  title.focus({preventScroll:true});
  window.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    parent.postMessage({type:'toki-control-back'},location.origin);
  }, true);
} else if (tabletComposer) {
  CFG.mode = 'dwell';
  CFG.jitter = false;
  go('keyboard');
  const heading = document.querySelector('#s-keyboard .status');
  heading.hidden = true;
  const instructions = document.querySelector('#s-keyboard .hint');
  instructions.textContent = 'Apunta y mantén, o haz clic.';
  const phrasePanel = document.querySelector('#s-keyboard .msgline');
  const recipient = document.createElement('span');
  recipient.className = 'draft-recipient';
  recipient.textContent = 'Tu borrador';
  const review = document.createElement('button');
  review.className = 't use-phrase';
  review.dataset.act = 'usePhrase';
  review.textContent = 'Revisar mensaje →';
  review.hidden = true;
  phrasePanel.prepend(recipient);
  phrasePanel.append(review);
  const modes = [
    ['gaze', 'Mirada', 'Sigue los puntos con los ojos.', '<path d="M8 32q24-30 48 0-24 30-48 0Z"/><circle cx="32" cy="32" r="8"/>'],
    ['start', 'Nariz', 'Apunta moviendo la cabeza.', '<path d="M17 54v-8c-6-6-9-13-6-22 3-10 11-15 21-14 11 0 17 8 18 19l5 10-7 2v4q0 5-6 5h-5v6"/><path d="M38 27h5"/>'],
    ['mouse', 'Mouse', 'Prueba el teclado sin cámara.', '<rect x="16" y="8" width="32" height="48" rx="16"/><path d="M32 9v14m-15 5h30"/>']
  ];
  const buttons = document.getElementById('calBtns');
  for (const [mode, label, hint, drawing] of modes) {
    const button = buttons.querySelector('[data-c="' + mode + '"]');
    button.style.removeProperty('background');
    button.innerHTML = `<span class="mode-symbol"><svg viewBox="0 0 64 64" aria-hidden="true">${drawing}</svg></span>
      <strong>${label}</strong><small>${hint}</small><span class="mode-arrow" aria-hidden="true">↗</span>`;
    buttons.append(button);
  }
  buttons.append(document.getElementById('calSaved'));
  const title = document.getElementById('calTitle');
  title.tabIndex = -1;
  title.focus({preventScroll:true});
  title.textContent = '¿Cómo quieres apuntar?';
  title.setAttribute('role','heading');
  title.setAttribute('aria-level','1');
  document.getElementById('calText').textContent = trackerOnly ? 'Usarás este control para elegir opciones en la tablet.' : 'Elige un control para escribir por bloques.';
  // Deja Enter y Espacio al botón enfocado durante la elección del control.
  window.addEventListener('keydown', event => {
    if (event.target.closest?.('#calBtns button') && ['Enter', ' '].includes(event.key)) {
      event.stopImmediatePropagation();
    }
  }, true);
  window.addEventListener('message', event => {
    if(event.origin === location.origin && event.source === parent && event.data?.type === 'toki-initial-text' && typeof event.data.text === 'string') {
      if (typeof event.data.recipient === 'string' && event.data.recipient) {
        recipient.textContent = 'Borrador · ' + event.data.recipient;
      }
      S.kb.text = event.data.text.slice(0,300);
      renderKeys();
    }
  });
  if (parent !== window) parent.postMessage({type:'toki-keyboard-ready'},location.origin);
}
