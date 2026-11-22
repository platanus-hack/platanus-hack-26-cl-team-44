function createMyoCare({
  $, $$, S, cancelGestures, clearFocus, targetLayer, setFocus, point, elementAt,
  island, log, renderStatus, updateLCD, callEmergency, now = () => performance.now(),
}) {
  const setBackgroundInert = inert => {
    for (const el of $$('#stage > .screen, #emoRing, #rest, #calib')) el.inert = inert;
  };
  let audioContext;
  function beep(frequency = 880, durationMs = 220, volume = 0.08) {
    if (S.muted) return;
    try {
      audioContext ??= new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const start = audioContext.currentTime;
      const end = start + durationMs / 1000;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(end + 0.02);
    } catch {
      // Visual feedback remains available if audio is blocked or unavailable.
    }
  }

  function startAlarm(level, { fromCareWheel = false } = {}) {
    if (S.alarm?.level === 'emergencia') return;
    S.alarm = { level, t0: now(), ack: 0, lastBeep: 0, fromCareWheel };
    log(`SIMULACIÓN: ${level}`);
    if (level === 'emergencia') {
      cancelGestures();
      clearFocus();
      const { classList } = $('#alarm');
      classList.remove('ack');
      classList.add('on');
      setBackgroundInert(true);
      $('#alSym').innerHTML = '<svg><use href="#i-alert"/></svg>';
      $('#alBig').textContent = 'SOS de prueba';
      $('#alSub').textContent = 'No se contactó a nadie.';
      $('#alDismiss').focus();
    } else {
      island('🔔', 'Aviso no urgente simulado · no se contactó a nadie', true);
      beep(660, 300, 0.05);
      S.alarm.lastBeep = now();
    }
    renderStatus();
    updateLCD();
  }
  function alarmTick(time) {
    const alarm = S.alarm;
    if (!alarm || alarm.ack) return;
    if (alarm.level === 'emergencia') {
      // The care wheel only runs the local simulation.
      if (!alarm.fromCareWheel && !alarm.called) {
        alarm.called = true;
        callEmergency(alarm);
      }
      const seconds = (time - alarm.t0) / 1000;
      $('#alCancel').textContent = alarm.real
        ? `Llamada de emergencia · ${Math.floor(seconds)} s · R = llegó alguien (llavero)`
        : `Sin respuesta simulada · ${Math.floor(seconds)} s · R para simular recepción`;
      const escalating = seconds >= 30;
      if (time - alarm.lastBeep > (escalating ? 600 : 1000)) {
        beep(escalating ? 990 : 880, 260, escalating ? 0.14 : 0.09);
        alarm.lastBeep = time;
      }
    } else if (alarm.level === 'atencion' && time - alarm.lastBeep > 20000) {
      beep(660, 300, 0.05);
      alarm.lastBeep = time;
    }
  }

  function rfid() {
    const alarm = S.alarm;
    if (!alarm) {
      island('🔑', 'Llavero: no hay alarma activa');
      return;
    }
    if (alarm.ack) {
      stopAlarm('Resuelto');
      updateLCD();
      return;
    }
    const seconds = Math.round((now() - alarm.t0) / 1000);
    alarm.ack = now();
    log(`RFID: llegó alguien (${seconds} s)`);
    if (alarm.level === 'emergencia') {
      $('#alarm').classList.add('ack');
      $('#alSym').innerHTML = '<svg><use href="#i-check"/></svg>';
      $('#alBig').textContent = alarm.real ? 'Llegó alguien' : 'Respuesta simulada';
      $('#alSub').textContent = alarm.real ? `Confirmado con el llavero en ${seconds} s` : 'No se contactó a nadie.';
      $('#alCancel').textContent = alarm.real ? 'R o Cerrar alarma' : 'R o Cerrar simulación';
    } else {
      island('✅', `Respuesta simulada en ${seconds} s`);
      setTimeout(() => { if (S.alarm === alarm) stopAlarm(); }, 4000);
    }
    updateLCD();
  }

  function stopAlarm(message) {
    const fromCareWheel = S.alarm?.fromCareWheel;
    if (fromCareWheel) silenceCareCue();
    S.alarm = null;
    $('#alarm').classList.remove('on', 'ack');
    const dismiss = $('#alDismiss');
    dismiss.blur();
    dismiss.textContent = 'Cerrar simulación';
    setBackgroundInert(false);
    if (S.rest) {
      $('.screen.on').inert = true;
      $('#restWake').focus();
    } else if (fromCareWheel) {
      $('#care-open').focus();
    }
    // The pointer must leave SOS before it can activate it again.
    const sos = targetLayer()?.querySelector('[data-act="sos"]');
    if (sos) {
      const { x, y } = point();
      if (sos.contains(elementAt(x, y))) {
        setFocus(sos);
        S.blocked = sos;
      }
    }
    if (message) island('✓', message);
    log('alarma cerrada');
    renderStatus();
    updateLCD();
  }
  $('#alDismiss').addEventListener('click', () => stopAlarm(S.alarm?.real ? 'Alarma cerrada' : 'Simulación cerrada'));

  let careSpeech;
  function silenceCareCue(){
    if(!careSpeech) return;
    careSpeech=null;
    speechSynthesis.cancel();
  }
  function announceCare(text){
    silenceCareCue();
    if(!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    const utterance=new SpeechSynthesisUtterance(text);
    const voice=speechSynthesis.getVoices().find(v=>v.localService && /^es/i.test(v.lang));
    utterance.lang='es-CL';
    if(voice) utterance.voice=voice;
    careSpeech=utterance;
    utterance.onend=utterance.onerror=()=>{ if(careSpeech===utterance) careSpeech=null; };
    speechSynthesis.speak(utterance);
  }

  return { startAlarm, alarmTick, stopAlarm, rfid, beep, announceCare, silenceCareCue };
}
