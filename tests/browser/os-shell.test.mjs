import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { createAppsServer } from '../../software/apps-bridge/server.mjs';

const require = createRequire(new URL('../../software/apps-bridge/package.json', import.meta.url));
const { chromium } = require('playwright-core');

async function openOS(t, configure = async () => {}) {
  const stateDir = await mkdtemp(join(tmpdir(), 'myo-os-test-'));
  t.after(() => rm(stateDir, { recursive: true, force: true }));
  const server = createAppsServer({ stateDir });
  server.listen(0, '127.0.0.1');
  t.after(() => {
    server.close();
    server.closeAllConnections();
  });
  await once(server, 'listening');

  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'chrome' });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.routeWebSocket('**/*', socket => socket.close());
  await configure(page);

  await page.goto(`${origin}/woki-os.html?escucha=manual`);
  await page.locator('[data-c="mouse"]').click();
  return { page, errors };
}

test('Myo OS loads the extracted modules and preserves navigation, drafts and Rest', async t => {
  const { page, errors } = await openOS(t);
  await page.locator('#tiles [data-act="go:keyboard"]').click();
  await page.locator('#keys [data-act="grp:0"]').click();
  await page.locator('#keys [data-act="chr:A"]').click();
  await page.waitForFunction(() => document.querySelector('#kbTxt').textContent.includes('A'));
  await page.locator('#s-keyboard .back-nav').click();
  await page.locator('#tiles [data-act="rest"]').click();
  await page.locator('#rest.on #restWake').click();
  await page.locator('#rest').waitFor({ state: 'hidden' });
  await page.locator('#tiles [data-act="go:keyboard"]').click();
  assert.match(await page.locator('#kbTxt').textContent(), /A/);
  await page.locator('#s-keyboard .back-nav').click();
  await page.locator('#s-home.on').waitFor();
  assert.deepEqual(errors, []);
});

test('a simulated room turn updates context and completes initials through the room agent', async t => {
  const requests = [];
  const { page, errors } = await openOS(t, async page => {
    await page.addInitScript(() => localStorage.setItem('toki.dev.url', `${location.origin}/fixture-agent`));
    await page.route('**/fixture-agent/api/**', route => {
      const endpoint = new URL(route.request().url()).pathname.split('/').at(-1);
      if (route.request().method() === 'POST') requests.push([endpoint, route.request().postDataJSON()]);
      const responses = {
        personas: [],
        tarjetas: { tarjetas: [{ texto: 'Gracias por preguntar.', id: 'fixture' }] },
        sugerir: { opciones: [{ text: 'Estoy bien.', emo: 'seria' }] },
        iniciales: { suggestions: [{ text: 'Ahora descanso.', emo: 'seria' }] },
      };
      return route.fulfill({ json: responses[endpoint] ?? {} });
    });
  });

  await page.evaluate(() => window.MYO_ESCUCHA.turno('¿Cómo estás?', {}));
  await page.locator('#s-talk.on').waitFor();
  assert.equal(await page.locator('#ctxIn').inputValue(), '¿Cómo estás?');
  await page.getByText('Estoy bien.', { exact: true }).waitFor();
  await page.locator('#cards [data-act="waKb"]').click();
  await page.locator('#keys [data-act="grp:0"]').click();
  const initials = page.waitForResponse('**/fixture-agent/api/iniciales');
  await page.locator('#keys [data-act="chr:A"]').click();
  await initials;
  await page.locator('#keys [data-act="kb:expand"] small', { hasText: 'Ahora descanso.' }).waitFor();
  await page.locator('#keys [data-act="kb:expand"]').click();
  await page.locator('#s-talk.on #cards').getByText('Ahora descanso.', { exact: true }).waitFor();
  assert.deepEqual(requests.filter(([endpoint]) => endpoint === 'iniciales').map(([, body]) => body.iniciales), ['a']);
  assert.deepEqual(errors, []);
});
