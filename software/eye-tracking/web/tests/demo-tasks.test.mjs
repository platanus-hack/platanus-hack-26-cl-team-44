import { test } from "node:test";
import assert from "node:assert/strict";

import { createTask, createTrainer } from "../js/demo-tasks.js";
import { exampleScreen, synthFrame } from "../js/synth.js";
import { fitBest } from "../js/model.js";

const SCREEN = exampleScreen();

test("la tarea avanza solo con aciertos y cuenta errores por celda", () => {
  const task = createTask({ labels: ["Sí", "No"] });
  task.start();
  assert.ok(task.active);
  const wanted = task.current;
  const other = wanted === "Sí" ? "No" : "Sí";
  assert.equal(task.select(other), false);
  assert.equal(task.current, wanted, "un error no avanza");
  assert.equal(task.select(wanted), true);
  const s = task.summary();
  assert.equal(s.errores, 1);
  assert.equal(s.fallosPorCelda[wanted], 1);
});

test("el entrenador exige ver la cara antes del clic y re-ajusta cada 4 clics", async () => {
  const calib = [];
  for (const [i, fx] of [0.1, 0.3, 0.5, 0.7, 0.9].entries()) {
    for (const [j, fy] of [0.15, 0.5, 0.85].entries()) {
      const target = { x: fx * SCREEN.widthPx, y: fy * SCREEN.heightPx };
      for (let k = 0; k < 15; k++) calib.push({ pointId: i * 3 + j, target, frame: synthFrame({ target, screen: SCREEN, noiseDeg: 0.2 }) });
    }
  }
  let model = fitBest(calib, { metersPerPx: SCREEN.s }).model;
  let refits = 0;
  const trainer = createTrainer({
    getModel: () => model,
    refit: async (extra) => { refits += 1; return fitBest([...calib, ...extra], { metersPerPx: SCREEN.s }).model; },
    onModel: (m) => { model = m; },
  });
  assert.match(trainer.click(100, 100), /No te vi/);
  for (let c = 0; c < 4; c++) {
    const target = { x: 200 + c * 300, y: 300 + c * 100 };
    for (let k = 0; k < 20; k++) trainer.pushFrame(synthFrame({ target, screen: SCREEN, noiseDeg: 0.2 }));
    const msg = trainer.click(target.x, target.y);
    assert.match(msg, /error antes de aprender/);
  }
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(refits, 1);
  assert.equal(trainer.stats().clicks, 4);
  assert.ok(trainer.stats().meanLast10 < 60, `error medio ${trainer.stats().meanLast10}`);
});

test("con ≥4 clics de Entrenar el modelo incluye el mapa de zonas y lo aplica", () => {
  const samples = [];
  for (const [i, fx] of [0.1, 0.5, 0.9].entries()) for (const [j, fy] of [0.15, 0.5, 0.85].entries()) {
    const target = { x: fx * SCREEN.widthPx, y: fy * SCREEN.heightPx };
    for (let k = 0; k < 12; k++) samples.push({ pointId: i * 3 + j, target, frame: synthFrame({ target, screen: SCREEN, noiseDeg: 0.2 }) });
  }
  const sinClics = fitBest(samples, { metersPerPx: SCREEN.s }).model;
  assert.equal(sinClics.residual, undefined, "sin clics no hay mapa");
  for (let c = 0; c < 5; c++) {
    const target = { x: 150 + c * 280, y: 820 };
    for (let k = 0; k < 10; k++) samples.push({ pointId: 1001 + c, target, frame: synthFrame({ target, screen: SCREEN, noiseDeg: 0.2 }) });
  }
  const conClics = fitBest(samples, { metersPerPx: SCREEN.s }).model;
  assert.ok(conClics.residual && conClics.residual.anchors.length >= 9);
});

test("acierto al primer intento cuenta ensayos, no palabras", () => {
  // una sola etiqueta: todos los ensayos piden "A"; se fallan los dos primeros antes de acertar
  const task = createTask({ labels: ["A"], session: null });
  task.start();
  task.select("B"); task.select("A");
  task.select("B"); task.select("A");
  assert.equal(task.summary().aciertoPrimerIntento, 0, "2 ensayos terminados, ambos con fallo previo");
});

test("acierto al primer intento nunca es negativo con un ensayo pendiente", async () => {
  const task = createTask({ labels: ["A", "B"], session: null });
  task.start();
  const wrong = task.current === "A" ? "B" : "A";
  task.select(wrong);
  assert.ok(task.summary().aciertoPrimerIntento >= 0);
});
