// Modo ilustrativo de Servicios: responde como apps-bridge, con los datos de ejemplo de toki-apps-ilustrativo.json.
// Lo usa toki-apps.js cuando no hay apps-bridge (la URL pública no lo tiene). No llama a Spotify, Rappi,
// YouTube ni a ningún medio: todo sale del JSON. El pedido de Rappi llega hasta revisar el total y no se paga.
export const LABEL = 'Ilustrativo: así se vería una app nativa en Myo OS';

export async function loadIllustrative() {
  const r = await fetch(new URL('./toki-apps-ilustrativo.json', import.meta.url), {signal: AbortSignal.timeout(8000)});
  if (!r.ok) throw Error('No se pudo cargar el modo ilustrativo.');
  return createIllustrativeBridge(await r.json());
}

const copy = value => JSON.parse(JSON.stringify(value));
const norm = text => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const escAttr = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

// Miniatura local (SVG en data:), sin pedir imágenes a otro sitio.
function thumbnail(color, emoji) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="${escAttr(color)}"/><text x="160" y="112" font-size="72" text-anchor="middle">${escAttr(emoji)}</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

export function createIllustrativeBridge(data, {now = () => Date.now()} = {}) {
  const catalog = copy(data.catalogo || []);
  const entries = {spotify: 'player', youtube: 'videos', noticias: 'news', rappi: 'food'};
  const adapters = catalog.filter(app => entries[app.id]).map(app => ({
    id: app.id, name: app.name, interface: {entry: entries[app.id]}, auth: {type: 'none'}, requiredEvidence: [], generated: false,
  }));
  const jobs = [];
  const tracks = data.musica?.canciones || [];
  const videos = data.videos?.items || [];
  const news = data.noticias?.items || [];
  const food = data.rappi || {};
  const stores = food.tiendas || [];

  // ---------- Spotify: un reproductor que avanza solo ----------
  const player = {index: 0, playing: false, base: 0, since: 0};
  const elapsed = () => {
    const track = tracks[player.index];
    if (!track) return 0;
    let ms = player.base + (player.playing ? now() - player.since : 0);
    if (ms >= track.duration_ms) {   // terminó: pasa a la siguiente
      player.index = (player.index + 1) % tracks.length; player.base = 0; player.since = now(); ms = 0;
    }
    return ms;
  };
  const playback = () => {
    const progress = elapsed(), track = tracks[player.index];
    return {is_playing: player.playing, progress_ms: progress,
      item: track ? {name: track.name, artists: [track.artists], album: track.album, duration_ms: track.duration_ms} : null};
  };
  const spotify = {
    status: () => playback(),
    play: ({uri} = {}) => {
      const i = uri ? tracks.findIndex(t => t.uri === uri) : -1;
      if (i >= 0) { player.index = i; player.base = 0; } else player.base = elapsed();
      player.playing = true; player.since = now();
      return playback();
    },
    pause: () => { player.base = elapsed(); player.playing = false; return playback(); },
    next: () => { player.index = (player.index + 1) % Math.max(1, tracks.length); player.base = 0; player.since = now(); player.playing = true; return playback(); },
    search: ({query} = {}) => {
      const q = norm(query);
      const found = tracks.filter(t => (t.tags || []).includes(q) || norm(`${t.name} ${t.artists}`).includes(q));
      return {tracks: (found.length ? found : tracks).map(t => ({name: t.name, artists: t.artists, uri: t.uri}))};
    },
    connect: () => ({state: 'connected'}),
    disconnect: () => ({}),
  };

  // ---------- YouTube: lista y un reproductor de ejemplo ----------
  const youtube = {
    list: () => ({items: videos.map(v => ({id: v.id, label: v.label, thumbnail: thumbnail(v.color, v.emoji)}))}),
    select: ({videoId} = {}) => {
      const video = videos.find(v => v.id === videoId);
      if (!video) throw Error('Ese video no está en la lista.');
      return {ticket: 'ilustrativo-' + video.id, video: {id: video.id, label: video.label}};
    },
    observe: () => ({ok: true}),
  };
  const videoModule = {
    mountVideo(host, {videoId, onState, onMessage, onReady}) {
      const video = videos.find(v => v.id === videoId) || {};
      let state = -1, disposed = false;
      host.innerHTML = `<div class="ta-ilus-video" style="background:${escAttr(video.color || '#1d3540')}"><span aria-hidden="true">${escAttr(video.emoji || '▶')}</span><p>${escAttr(video.label || '')}</p></div>`;
      Promise.resolve().then(() => { if (!disposed) { onReady(true); onMessage('Ilustrativo: aquí se vería el video.'); } });
      return {
        get state() { return state; },
        toggle() {
          if (disposed) return;
          state = state === 1 ? 2 : 1;
          onState(state); onMessage(state === 1 ? 'Reproduciendo (ilustrativo)' : 'En pausa (ilustrativo)');
        },
        destroy() { disposed = true; host.innerHTML = ''; },
      };
    },
  };

  // ---------- Noticias: titulares y lectura por partes ----------
  const noticias = {
    list: () => ({source: data.noticias?.fuente || 'Noticias', publishedAt: new Date(now()).toISOString(),
      items: news.map(n => ({id: n.id, title: n.title, image: null, publishedAt: new Date(now() - (n.horas || 0) * 3600000).toISOString()}))}),
    read: ({articleId} = {}) => {
      const n = news.find(x => x.id === articleId);
      if (!n) throw Error('Esa noticia no está en la lista.');
      return {article: {title: n.title, pages: n.pages || [], source: data.noticias?.fuente || 'Noticias',
        publishedAt: new Date(now() - (n.horas || 0) * 3600000).toISOString()}};
    },
  };

  // ---------- Rappi: restaurantes y carrito; termina antes de pagar ----------
  let cart = {lines: [], tip: 0};
  const store = id => stores.find(s => s.id === Number(id));
  const product = (s, id) => (s?.productos || []).find(p => p.id === Number(id));
  const cartView = (extra = {}) => {
    const byStore = new Map();
    for (const line of cart.lines) {
      if (!byStore.has(line.storeId)) byStore.set(line.storeId, {id: line.storeId, name: store(line.storeId)?.name || '', items: []});
      byStore.get(line.storeId).items.push({name: line.name, quantity: line.quantity, price: line.price});
    }
    const productsTotal = cart.lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const shippingTotal = byStore.size * (food.envio || 0);
    const service = cart.lines.length ? food.servicio || 0 : 0;
    return {stores: [...byStore.values()], productsTotal, shippingTotal, tip: cart.tip,
      total: productsTotal + shippingTotal + service + cart.tip, ...extra};
  };
  const storeCard = (s, match = () => true) => ({id: s.id, name: s.name, eta: s.eta,
    products: (s.productos || []).filter(match).slice(0, 1).map(p => ({id: p.id, name: p.name, price: p.price}))});
  const rappi = {
    status: () => ({connected: true, locationLabel: food.ubicacion || '', locale: food.locale, currency: food.moneda,
      categories: copy(food.categorias || [])}),
    search: ({category, query, preferir} = {}) => {
      if (category) {
        const c = (food.categorias || []).find(x => x.id === category);
        return {category: c?.name || category, stores: stores.filter(s => (s.categorias || []).includes(category)).map(s => storeCard(s))};
      }
      const words = [query, ...(preferir || [])].map(norm).filter(Boolean);
      const hit = p => words.some(w => norm(p.name).includes(w));
      const found = stores.filter(s => words.some(w => norm(s.name).includes(w)) || (s.productos || []).some(hit));
      return {category: query || 'Búsqueda', stores: (found.length ? found : stores).map(s => storeCard(s, p => !words.length || hit(p) || !(s.productos || []).some(hit)))};
    },
    products: ({storeId} = {}) => {
      const s = store(storeId);
      if (!s) throw Error('Ese restaurante no está en la lista.');
      return {store: {id: s.id, name: s.name}, items: (s.productos || []).map(p => ({id: p.id, name: p.name, price: p.price, available: true}))};
    },
    select: ({storeId, productId} = {}) => {
      const s = store(storeId), p = product(s, productId);
      if (!p) throw Error('Ese producto no está en la lista.');
      const groups = (p.grupos || []).map(g => ({name: g.name, min: g.min, max: g.max, items: g.items.map(i => ({...i, available: true}))}));
      return {store: {id: s.id, name: s.name}, product: {id: p.id, name: p.name, price: p.price}, groups,
        canAdd: true, catalogOnly: false, ticket: `${s.id}:${p.id}`};
    },
    add: ({ticket, options = []} = {}) => {
      const [storeId, productId] = String(ticket).split(':').map(Number);
      const s = store(storeId), p = product(s, productId);
      if (!p) throw Error('Ese producto no está en la lista.');
      const chosen = (p.grupos || []).flatMap(g => g.items).filter(i => options.map(Number).includes(i.id));
      const name = p.name + (chosen.length ? ' · ' + chosen.map(i => i.name).join(', ') : '');
      const price = p.price + chosen.reduce((sum, i) => sum + (i.price || 0), 0);
      const line = cart.lines.find(l => l.storeId === storeId && l.name === name);
      if (line) line.quantity++; else cart.lines.push({storeId, name, price, quantity: 1});
      return cartView();
    },
    cart: () => cartView(),
    tip: ({tip} = {}) => { cart.tip = Math.max(0, Number(tip) || 0); return cartView(); },
    quote: () => cartView({notice: food.aviso_final || LABEL}),   // sin ticket: el botón de pagar queda desactivado
    order: () => { throw Error(food.aviso_final || LABEL); },
    track: () => { throw Error(food.aviso_final || LABEL); },
    connect: () => ({state: 'connected'}),
    disconnect: () => { cart = {lines: [], tip: 0}; return {}; },
  };

  const actions = {spotify, youtube, noticias, rappi};
  const jobFor = name => {
    const app = catalog.find(a => a.name === name);
    let job = jobs.find(j => j.name === name);
    if (!job) {
      job = {id: 'ilustrativo-' + (app?.id || jobs.length), app: app?.id || 'custom', name, status: app && actions[app.id] ? 'ready' : 'needs_adapter',
        stage: app ? 5 : 1, evidence: {}, message: ''};
      jobs.unshift(job);
    }
    return job;
  };

  // Misma forma que la API de apps-bridge (software/apps-bridge/server.mjs). Un error se lanza con su mensaje.
  async function handle(path, body) {
    if (path === '/api/session') return {token: 'ilustrativo'};
    if (path === '/api/jobs' && body === undefined) return {jobs: copy(jobs), phases: []};
    if (path === '/api/adapters') return {adapters: copy(adapters)};
    if (path === '/api/jobs') return {job: copy(jobFor(String(body?.name || '')))};
    const jobRoute = path.match(/^\/api\/jobs\/([^/]+)\/(cancel|retry|review)$/);
    if (jobRoute) {
      const job = jobs.find(j => j.id === jobRoute[1]);
      if (!job) throw Error('No existe esa preparación.');
      return {job: copy(job)};
    }
    const route = path.match(/^\/api\/apps\/([a-z][a-z0-9-]*)\/actions\/([a-z][a-z0-9-]*)$/);
    const run = route && actions[route[1]]?.[route[2]];
    if (!run) throw Error('No disponible en el modo ilustrativo.');
    return copy(run(body || {}));
  }

  return {
    label: data.etiqueta || LABEL,
    catalog,
    music: data.musica?.opciones || [],
    videosLabel: data.videos?.subtitulo || 'Videos de ejemplo',
    payNote: food.nota_pago || '',
    videoModule,
    handle,
  };
}
