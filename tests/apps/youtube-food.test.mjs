// YouTube con más videos (feed del canal Chile Travel, de a 6 por página) e íconos en Elegir comida.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseChannelFeed} from '../../software/apps-bridge/adapters/youtube.mjs';

const entry = (id, title) => `<entry><yt:videoId>${id}</yt:videoId><title>${title}</title></entry>`;

test('lee los videos del feed del canal, sin repetir ni aceptar ids inválidos', () => {
  const xml = '<feed><title>Chile Travel</title>' + entry('-m7BvwKJGgI', 'Los spots secretos 🇨🇱 #ChileSecreto') +
    entry('7sxH2C-N9mY', 'Ya está en la lista fija') + entry('mal', 'Id inválido') + entry('kNRLhuhGpKs', '&quot;ChileNos Encanta&quot; &amp; más') + '</feed>';
  const items = parseChannelFeed(xml, new Set(['7sxH2C-N9mY']));
  assert.deepEqual(items.map((v) => v.id), ['-m7BvwKJGgI', 'kNRLhuhGpKs']);
  assert.equal(items[0].label, 'Los spots secretos 🇨🇱');
  assert.equal(items[1].label, '"ChileNos Encanta" & más');
  assert.equal(items[0].thumbnail, 'https://i.ytimg.com/vi/-m7BvwKJGgI/mqdefault.jpg');
});

test('acorta títulos largos y tolera un feed vacío o roto', () => {
  const [v] = parseChannelFeed(entry('abcdefghijk', 'x'.repeat(90)));
  assert.equal(v.label.length, 58);
  assert.ok(v.label.endsWith('…'));
  assert.deepEqual(parseChannelFeed(''), []);
  assert.deepEqual(parseChannelFeed('<html>error</html>'), []);
});

const ui = readFileSync(new URL('../../software/toki-os/toki-apps.js', import.meta.url), 'utf8');

test('Videos se pagina de a 6 con Anteriores / Más y vuelve a la página 1 al entrar', () => {
  assert.match(ui, /perPage=6/);
  assert.match(ui, /this\.btn\('video-prev','← Anteriores'/);
  assert.match(ui, /this\.btn\('video-next','Más →'/);
  assert.match(ui, /entry==='videos'\)\{this\.view='videos';this\.videoPage=0;/);
});

test('cada categoría de comida tiene ícono', () => {
  for (const icon of ["pizza:'🍕'", "hamburguesa:'🍔'", "sushi:'🍣'", "empanadas:'🥟'"]) assert.ok(ui.includes(icon), icon);
  assert.match(ui, /food-cat-icon/);
});
