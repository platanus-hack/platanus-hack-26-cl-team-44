// Pitido corto con Web Audio. woki-os.html:2145-2148
let actx: AudioContext | null = null;

export function beep(muted: boolean, f = 880, ms = 220, vol = 0.08): void {
  if (muted) return;
  try {
    actx ??= new AudioContext();
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0, actx.currentTime);
    g.gain.linearRampToValueAtTime(vol, actx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + ms / 1000);
    o.connect(g);
    g.connect(actx.destination);
    o.start();
    o.stop(actx.currentTime + ms / 1000 + 0.02);
  } catch {
    // sin audio
  }
}
