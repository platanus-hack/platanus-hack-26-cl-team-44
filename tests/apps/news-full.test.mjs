// Noticias: se lee la nota completa del feed (content:encoded), y en Toki OS la lectura y la barra
// superior usan los colores y el tamaño del sistema (modo claro legible, el reloj no se sale).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseRssFeed} from '../../software/apps-bridge/adapters/rss-reader.mjs';

const spec = {name: 'Medio', channelTitle: 'Medio', articleHosts: ['www.medio.cl'], articlePathPrefix: '/noticias/'};
const feed = (item) => `<?xml version="1.0"?><rss><channel><title>Medio</title>${item}</channel></rss>`;
const item = ({description = '', content = ''}) => `<item><title>Titular</title><link>https://www.medio.cl/noticias/a.shtml</link>` +
  `<description><![CDATA[${description}]]></description>${content ? `<content:encoded><![CDATA[${content}]]></content:encoded>` : ''}</item>`;
const words = (n) => Array.from({length: n}, (_, i) => `palabra${i}`).join(' ');

test('lee la noticia completa (content:encoded), no solo el resumen', () => {
  const body = `<p>${words(400)}</p><p>The post Titular appeared first on Medio.</p>`;
  const [article] = parseRssFeed(feed(item({description: 'Resumen corto', content: body})), spec).items;
  const text = article.pages.join(' ');
  assert.ok(text.includes('palabra0') && text.includes('palabra399'), 'incluye del principio al final');
  assert.ok(!text.includes('Resumen corto'), 'usa el texto completo, no el resumen');
  assert.ok(!/appeared first/.test(text), 'quita el pie "The post … appeared first"');
  assert.ok(article.pages.every((p) => p.length <= 180), 'sigue paginado para leer con la mirada');
});

test('sin texto completo en el feed, usa el resumen como antes', () => {
  const [article] = parseRssFeed(feed(item({description: 'Este es el resumen de la nota.'})), spec).items;
  assert.equal(article.pages.join(' '), 'Este es el resumen de la nota.');
});

test('un texto anómalamente largo se corta con tope', () => {
  const [article] = parseRssFeed(feed(item({content: words(5000)})), spec).items;
  assert.ok(article.pages.join(' ').length <= 15100);
});

const css = readFileSync(new URL('../../software/toki-os/os-juegos-servicios.css', import.meta.url), 'utf8');
test('en Toki OS, Servicios usa la barra y márgenes del sistema y la lectura usa los colores del tema', () => {
  assert.match(css, /#s-apps \{ padding: 28px 48px; \}/);
  assert.match(css, /#s-apps \.status \{ position: static; height: 60px; \}/);
  assert.match(css, /#s-apps \.news-reading \{ background: var\(--glass\);/);
  assert.match(css, /#s-apps \.news-reading p \{ color: var\(--txt\); \}/);
});
