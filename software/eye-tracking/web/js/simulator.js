/**
 * Fuente simulada: la mirada es el mouse y la cabeza se mueve con el teclado.
 * Usa el mismo generador realista que los tests (synth.js): ARKit comprime el giro del ojo
 * (~0,45×) y agrega ruido, así que el simulador reproduce los problemas reales.
 *
 * Teclas (solo en simulación): flechas = mover cabeza · +/- = acercar/alejar ·
 * J/L = girar · I/K = inclinar · U/O = ladear · Y = micro-movimientos automáticos · 0 = centrar.
 * Durante la fase de movimiento de la calibración la cabeza se mueve sola.
 */
import { exampleScreen, synthFrame } from "./synth.js";

const BASE = Object.freeze({ head: [0, 0.05, -0.5], yaw: 0, pitch: 0, roll: 0 });

export function createSimulator({ onFrame }) {
  let mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  let pose = { ...BASE, head: [...BASE.head] };
  let sway = false;
  let timer = null;
  const t0 = performance.now();

  const onMove = (e) => { mouse = { x: e.clientX, y: e.clientY }; };
  const onKey = (e) => {
    if (e.target instanceof HTMLInputElement) return;
    const h = [...pose.head];
    const k = e.key.toLowerCase();
    const map = {
      arrowleft: () => { h[0] -= 0.01; }, arrowright: () => { h[0] += 0.01; },
      arrowup: () => { h[1] += 0.01; }, arrowdown: () => { h[1] -= 0.01; },
      "+": () => { h[2] += 0.02; }, "=": () => { h[2] += 0.02; }, "-": () => { h[2] -= 0.02; },
      j: () => { pose = { ...pose, yaw: pose.yaw - 2 }; }, l: () => { pose = { ...pose, yaw: pose.yaw + 2 }; },
      i: () => { pose = { ...pose, pitch: pose.pitch + 2 }; }, k: () => { pose = { ...pose, pitch: pose.pitch - 2 }; },
      u: () => { pose = { ...pose, roll: pose.roll - 2 }; }, o: () => { pose = { ...pose, roll: pose.roll + 2 }; },
      y: () => { sway = !sway; },
      0: () => { pose = { ...BASE, head: [...BASE.head] }; sway = false; },
    };
    if (!map[k]) return;
    map[k]();
    if (!["j", "l", "i", "k", "u", "o", "y", "0"].includes(k)) pose = { ...pose, head: h };
    if (k === "0") return;
  };

  function currentPose(now) {
    const auto = sway || document.querySelector("#target.motion") !== null;
    if (!auto) return pose;
    const a = (now / 1000) * 1.6;
    return {
      head: [pose.head[0] + 0.025 * Math.sin(a), pose.head[1] + 0.015 * Math.sin(a * 1.3), pose.head[2] + 0.03 * Math.sin(a * 0.7)],
      yaw: pose.yaw + 7 * Math.sin(a * 0.9),
      pitch: pose.pitch + 5 * Math.cos(a * 1.1),
      roll: pose.roll + 3 * Math.sin(a * 0.5),
    };
  }

  function tick() {
    const now = performance.now();
    const screen = exampleScreen({ widthPx: innerWidth, heightPx: innerHeight });
    const p = currentPose(now);
    const blink = Math.random() < 0.004 ? 0.9 : 0.05;
    const frame = synthFrame({ ...p, target: mouse, screen, noiseDeg: 0.3, blinkL: blink, blinkR: blink });
    // timestamp de sesión como en el iPhone
    onFrame(Object.freeze({ ...frame, t: (now - t0) / 1000 }));
  }

  return {
    start() {
      addEventListener("mousemove", onMove);
      addEventListener("keydown", onKey);
      timer = setInterval(tick, 1000 / 60);
    },
    stop() {
      removeEventListener("mousemove", onMove);
      removeEventListener("keydown", onKey);
      clearInterval(timer);
    },
    /** Estado de la cabeza simulada (para pruebas). */
    pose: () => currentPose(performance.now()),
    stats: () => ({ fps: 60, rttMs: 0, invalidPackets: 0, stale: false }),
    send() {},
  };
}
