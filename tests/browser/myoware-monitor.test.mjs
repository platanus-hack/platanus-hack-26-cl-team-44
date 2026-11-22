import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { createAppsServer } from '../../software/apps-bridge/server.mjs';

const require = createRequire(new URL('../../software/apps-bridge/package.json', import.meta.url));
const { chromium } = require('playwright-core');

function readCSV(source) {
  const [header, ...rows] = source.trimEnd().split(/\r?\n/);
  return {
    header,
    samples: rows.map(line => line.split(',').map(value => value === '' ? null : Number(value))),
  };
}

test('the live monitor breaks the trace across a gap and exports missing channels unchanged', async t => {
  const fixture = new URL('../../software/myoware-monitor/examples/senal-env-sintetica.csv', import.meta.url);
  const { header, samples } = readCSV(await readFile(fixture, 'utf8'));
  assert.equal(header, 'unix_seconds,a0_env_adc,a3_env_adc');
  const last = samples.at(-1)[0];
  const stateDir = await mkdtemp(join(tmpdir(), 'myoware-plot-test-'));
  const server = createAppsServer({
    stateDir,
    myowareFetch: async url => String(url).endsWith('/data')
      ? Response.json({ samples, last, now: last, connected: true, transport: 'serial' })
      : Response.json({ age: null, frames: [] }),
  });
  t.after(async () => {
    const closed = new Promise(resolve => server.close(resolve));
    server.closeAllConnections();
    await closed;
    await rm(stateDir, { recursive: true, force: true });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const browser = await chromium.launch({ channel: 'chrome' });
  t.after(() => browser.close());
  const page = await browser.newPage();
  page.setDefaultTimeout(8000);
  await page.addInitScript(() => {
    const ctx = CanvasRenderingContext2D.prototype;
    const { beginPath, moveTo, lineTo, stroke } = ctx;
    let commands = [];
    // Record only the sample traces, not the grid or threshold guides.
    window.sampleTraces = {};
    ctx.beginPath = function () { commands = []; return beginPath.call(this); };
    ctx.moveTo = function (x, y) { commands.push('move'); return moveTo.call(this, x, y); };
    ctx.lineTo = function (x, y) { commands.push('line'); return lineTo.call(this, x, y); };
    ctx.stroke = function () {
      if (this.canvas.id === 'plot' && this.lineWidth === 2 && this.globalAlpha === 1) {
        window.sampleTraces[this.getLineDash().length ? 'a3' : 'a0'] = commands;
      }
      return stroke.call(this);
    };
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/myoware/`);
  await page.getByText('Recibiendo señal', { exact: false }).waitFor();
  assert.equal(await page.locator('#value-a0').textContent(), '511');
  assert.equal(await page.locator('#activity-a3').textContent(), 'Sin datos de este canal');

  const traces = await page.evaluate(() => window.sampleTraces);
  assert.deepEqual(traces.a0.flatMap((command, index) => command === 'move' ? [index] : []), [0, 17]);
  assert.equal(traces.a3.length, 17, 'the missing A3 readings must not be drawn as zero');

  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Guardar muestras CSV' }).click();
  const download = await downloadEvent;
  assert.deepEqual(readCSV(await readFile(await download.path(), 'utf8')), { header, samples });
});
