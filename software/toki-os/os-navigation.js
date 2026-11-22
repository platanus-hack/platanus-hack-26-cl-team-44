function createMyoNavigation({
  state, $, $$, getById, location, history, closeEmotions, leaveRest,
  clearFocus, renderKeys, navigate, onScreenChanged,
}) {
  function findScreen(name) {
    const screen = getById(`s-${name}`);
    return screen?.classList.contains('screen') ? screen : null;
  }

  function screenFromUrl() {
    const name = location.hash.slice(1);
    return findScreen(name) ? name : 'home';
  }

  function go(name, writeHistory = true) {
    const next = findScreen(name);
    if (!next) return;
    if (state.screen !== name) {
      if (writeHistory) {
        const url = name === 'home' ? location.pathname + location.search : `#${name}`;
        history.pushState({ wokiStep: (history.state?.wokiStep || 0) + 1 }, '', url);
      }
      if (state.emoRingFor !== null) closeEmotions();
      if (state.rest) leaveRest();
    }
    const previous = $('.screen.on');
    if (previous && previous !== next) {
      previous.classList.add('leaving');
      setTimeout(() => previous.classList.remove('leaving'), 320);
    }
    state.screen = name;
    for (const screen of $$('.screen')) screen.classList.toggle('on', screen === next);
    clearFocus();
    onScreenChanged(name);
  }

  function goBack() {
    if (state.emoRingFor !== null) {
      closeEmotions();
    } else if (state.rest) {
      leaveRest();
    } else if (state.screen === 'keyboard' && state.kb.mode === 'ini' && state.kb.level === 1) {
      state.kb.mode = 'text';
      navigate('talk');
    } else if (state.screen === 'keyboard' && state.kb.level !== 1) {
      state.kb.level = 1;
      renderKeys();
    } else if (history.state?.wokiStep > 0) {
      history.back();
    } else if (state.screen !== 'home') {
      navigate('home');
    }
  }

  return { go, goBack, screenFromUrl };
}
