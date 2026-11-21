import {createRssAdapter, parseRssFeed, rssManifest, limitedText} from './rss-reader.mjs';
export {readingPages} from './rss-reader.mjs';
export const BIOBIO_FEED = 'https://www.biobiochile.cl/static/feed-rss';
// El RSS de BioBioChile no trae imágenes (sin enclosure ni media:*). El propio medio publica la misma lista
// de noticias en JSON con su foto destacada: una sola petición, que solo aporta miniaturas.
export const BIOBIO_IMAGES = 'https://www.biobiochile.cl/lista/api/get-todo';
const MEDIA = 'https://media.biobiochile.cl/wp-content/uploads/';
const spec={id:'biobio',name:'BioBioChile',version:'1.0.0',feedUrl:BIOBIO_FEED,channelTitle:'BioBioChile',articleHosts:['www.biobiochile.cl'],articlePathPrefix:'/noticias/',imageHosts:['media.biobiochile.cl']};
export const biobioManifest={...rssManifest(spec),aliases:['Bio Bio Chile']};
export const parseBioBioFeed=xml=>parseRssFeed(xml,spec);
// Devuelve {url de la noticia → miniatura}. Las rutas relativas se resuelven en el CDN del medio; rss-reader valida el resultado.
export function parseBioBioImages(text) {
  const rows = JSON.parse(text), index = new Map();
  if (!Array.isArray(rows)) return index;
  for (const row of rows.slice(0, 60)) {
    const link = typeof row?.post_URL === 'string' ? row.post_URL : '';
    const thumbs = row?.post_image?.thumbnails || {};
    const path = [thumbs.medium?.URL, thumbs.thumbnail?.URL, row?.post_image?.URL].find(p => typeof p === 'string' && /^[\w\-./]+$/.test(p) && !p.includes('..'));
    if (link && path) index.set(link.split(/[?#]/)[0], MEDIA + path);
  }
  return index;
}
async function biobioImages(fetcher, signal) {
  const timeout = AbortSignal.any([signal, AbortSignal.timeout(6000)]);
  const response = await fetcher(BIOBIO_IMAGES, {signal:timeout, redirect:'error', headers:{Accept:'application/json', 'User-Agent':'Toki-accessible-reader/1.0'}});
  if (!response.ok) return null;
  return parseBioBioImages(await limitedText(response, timeout, 3_000_000));
}
export function createBioBioAdapter(options){return {...createRssAdapter(spec,{images:biobioImages,...options}),manifest:biobioManifest};}
