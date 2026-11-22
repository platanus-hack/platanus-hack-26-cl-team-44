import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {renderGame} from '../../software/apps-bridge/game-renderer.mjs';

test('a game samples a held click before queued gaze movements resume', async t => {
  const profile = await mkdtemp(join(tmpdir(), 'toki-game-pointer-'));
  const controller = new AbortController();
  const viewport = {width:301, height:201};
  let page, renderer;
  t.after(async () => {
    await renderer?.close();
    await rm(profile, {recursive:true, force:true});
  });
  renderer = await renderGame({
    url:'data:text/html,<canvas style="position:fixed;inset:0;width:100%;height:100%"></canvas>',
    viewport, profile, signal:controller.signal, onEnded() {}, onFrame() {}
  }, context => { page = context.pages()[0]; });

  await page.evaluate(() => {
    window.inputLog = [];
    let pressed = false, sampled = false;
    function frame() {
      if (pressed) sampled = true;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    document.addEventListener('pointerdown', e => {
      pressed = true;
      sampled = false;
      inputLog.push(['down', e.clientX]);
    });
    document.addEventListener('pointerup', e => {
      pressed = false;
      inputLog.push(['up', e.clientX, sampled]);
    });
    document.addEventListener('pointermove', e => inputLog.push(['move', e.clientX, e.buttons]));
  });

  const send = (type, x) => renderer.input({type, x, y:0.5});
  await Promise.all([
    send('click', 0.2),
    send('move', 0.4), send('move', 0.5),
    send('click', 0.7),
    send('move', 0.8), send('move', 0.9)
  ]);
  const events = await page.evaluate(() => inputLog);
  assert.deepEqual(events.filter(([type]) => type !== 'move'), [
    ['down', 60], ['up', 60, true], ['down', 210], ['up', 210, true]
  ]);
  const moves = events.filter(([type]) => type === 'move');
  assert.ok(moves.every(([, , buttons]) => buttons === 0), 'gaze jitter must not drag the game target');
  assert.deepEqual(moves.map(([, x]) => x), [60, 150, 210, 270]);
});
