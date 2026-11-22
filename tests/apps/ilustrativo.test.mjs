// Modo ilustrativo de Servicios: sin apps-bridge (URL pública), las apps muestran datos de ejemplo del JSON.
// Comprueba el puente de ejemplo (toki-apps-ilustrativo.js) y que toki-apps.js lo usa sin pedir nada a la red.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createIllustrativeBridge, LABEL} from '../../software/toki-os/toki-apps-ilustrativo.js';

const fixtureText = readFileSync(new URL('../../software/toki-os/toki-apps-ilustrativo.json', import.meta.url), 'utf8');
const fixture = JSON.parse(fixtureText);
const source = readFileSync(new URL('../../software/toki-os/toki-apps.js', import.meta.url), 'utf8');

test('the fixture is sample data only: no URLs to real services', () => {
  assert.doesNotMatch(fixtureText, /https?:\/\//);
  assert.equal(fixture.etiqueta, LABEL);
  assert.deepEqual(fixture.catalogo.map(a => a.id), ['spotify', 'youtube', 'noticias', 'rappi']);
});

test('Rappi: categories, restaurant, options and cart end before payment', async () => {
  const b = createIllustrativeBridge(fixture);
  const call = (action, body = {}) => b.handle(`/api/apps/rappi/actions/${action}`, body);
  const status = await call('status');
  assert.equal(status.connected, true);
  assert.ok(status.categories.some(c => c.id === 'pizza'));
  const {stores} = await call('search', {category: 'pizza'});
  assert.ok(stores.length >= 2);
  const {items} = await call('products', {storeId: stores[0].id});
  const selection = await call('select', {storeId: stores[0].id, productId: items[0].id});
  assert.equal(selection.groups[0].name, 'Tamaño');
  const familiar = selection.groups[0].items.find(i => i.name === 'Familiar');
  const champinones = selection.groups[1].items.find(i => i.name === 'Champiñones');
  const cart = await call('add', {ticket: selection.ticket, options: [familiar.id, champinones.id]});
  assert.equal(cart.productsTotal, items[0].price + familiar.price + champinones.price);
  await call('tip', {tip: 2000});
  const quote = await call('quote');
  assert.equal(quote.ticket, undefined, 'sin ticket el botón de pagar queda desactivado');
  assert.equal(quote.notice, fixture.rappi.aviso_final);
  assert.equal(quote.total, quote.productsTotal + quote.shippingTotal + fixture.rappi.servicio + 2000);
  await assert.rejects(call('order', {ticket: 'x'}), /no se paga/);
});

test('Spotify: play, pause, next and the clock moves on its own', async () => {
  let now = 1000;
  const b = createIllustrativeBridge(fixture, {now: () => now});
  const call = (action, body = {}) => b.handle(`/api/apps/spotify/actions/${action}`, body);
  const {tracks} = await call('search', {query: 'boleros'});
  assert.ok(tracks.length >= 2);
  let state = await call('play', {uri: tracks[1].uri});
  assert.equal(state.is_playing, true);
  assert.equal(state.item.name, tracks[1].name);
  now += 30000;
  state = await call('status');
  assert.equal(state.progress_ms, 30000);
  state = await call('pause');
  assert.equal(state.is_playing, false);
  now += 60000;
  assert.equal((await call('status')).progress_ms, 30000, 'en pausa no avanza');
  state = await call('next');
  assert.notEqual(state.item.name, tracks[1].name);
});

test('news and videos come from the fixture, with local thumbnails', async () => {
  const b = createIllustrativeBridge(fixture);
  const news = await b.handle('/api/apps/noticias/actions/list', {});
  assert.equal(news.items.length, fixture.noticias.items.length);
  const {article} = await b.handle('/api/apps/noticias/actions/read', {articleId: news.items[0].id});
  assert.ok(article.pages.length >= 2);
  const videos = await b.handle('/api/apps/youtube/actions/list', {});
  assert.ok(videos.items.every(v => v.thumbnail.startsWith('data:image/svg+xml,')));
  const selection = await b.handle('/api/apps/youtube/actions/select', {videoId: videos.items[0].id});
  assert.equal(selection.video.label, fixture.videos.items[0].label);
});

function load({origin = 'https://myo.example', session = null} = {}) {
  const calls = [];
  const fetch = async url => {
    calls.push(url);
    if (session && url.endsWith('/api/session')) return session();
    throw Error('red no disponible: ' + url);
  };
  const root = {innerHTML:'',isConnected:true,classList:{add(){},toggle(){}},addEventListener(){},removeEventListener(){},querySelector:()=>null,querySelectorAll:()=>[]};
  const window = {};
  const context = vm.createContext({window,fetch,location:{port:'',origin,search:''},document:{hidden:false,activeElement:null},
    AbortSignal,URLSearchParams,setTimeout,clearTimeout,setInterval,clearInterval,Intl,Date,JSON,Promise,Error,Map,Set,Math,Number,String,Array,Object,RegExp});
  vm.runInContext(source, context);
  const app = window.TokiApps.mount(root, {motion:true, illustrative: async () => createIllustrativeBridge(fixture)});
  const press = (action, value = '') => app.act({disabled:false,dataset:{appAction:action,value}});
  const until = async (check, label) => { for (let i = 0; i < 100; i++) { if (check()) return; await new Promise(r => setTimeout(r, 30)); } assert.fail(label + '\n' + root.innerHTML); };
  return {app, root, calls, press, until};
}

test('public URL: Servicios opens in illustrative mode without any network call', async t => {
  const {app, root, calls, press, until} = load();
  t.after(() => app.destroy());
  await until(() => app.online, 'sincroniza');
  assert.deepEqual(calls, [], 'en la URL pública no hay puente que probar');
  assert.match(root.innerHTML, /class="ta-ilustrativo"[^>]*>Ilustrativo: así se vería una app nativa en Myo OS</);
  assert.match(root.innerHTML, /Pedir comida/);
  assert.doesNotMatch(root.innerHTML, /BioBioChile|Mercado Libre|Sin conexión/);
  await press('preset', 'rappi');
  await until(() => app.view === 'food' && root.innerHTML.includes('Pizza'), 'abre Rappi');
  await press('food-search', 'pizza');
  await until(() => app.view === 'food-stores', 'muestra restaurantes');
  await press('food-store', '1');
  await press('food-product', '103');
  await press('food-add');
  await until(() => app.view === 'food-cart' && root.innerHTML.includes('Limonada'), 'agrega al carrito');
  await press('food-to-tip');
  await press('food-tip', '0');
  await until(() => app.view === 'food-review', 'llega a revisar el total');
  assert.match(root.innerHTML, /data-app-action="food-pay"[^>]*disabled/);
  assert.match(root.innerHTML, /En esta demo el pago está desactivado/);
  assert.match(root.innerHTML, /no se paga nada/);
  assert.deepEqual(calls, []);
});

test('local bridge down: illustrative mode, and the real bridge takes over when it answers', async t => {
  let up = false;
  const {app, root, until} = load({origin:'http://127.0.0.1:8793', session: async () => {
    if (!up) throw Error('connection refused');
    return {ok:true,status:200,json:async()=>({token:'real'})};
  }});
  t.after(() => app.destroy());
  await until(() => app.online && app.demo, 'pasa al modo ilustrativo');
  assert.match(root.innerHTML, /ta-ilustrativo/);
  up = true; app.probeAt = 0;
  await app.probeBridge();
  assert.equal(app.demo, null);
  assert.equal(app.token, 'real');
  assert.equal(app.reached, true);
});
