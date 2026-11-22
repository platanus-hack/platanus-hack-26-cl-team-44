import {createHash} from 'node:crypto';
import {XMLParser} from 'fast-xml-parser';

const fault = (message, status = 502) => Object.assign(new Error(message), {status});
// Con atributos activados, un elemento con atributos llega como {'#text', '@_attr'}.
const scalar = value => typeof value === 'string' ? value : typeof value?.['#text'] === 'string' ? value['#text'] : '';
const entities = {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',hellip:'…',ndash:'–',mdash:'—'};
function decode(text) {
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match,key)=>{
    if (key[0] !== '#') return entities[key] ?? match;
    const n = key[1].toLowerCase()==='x' ? parseInt(key.slice(2),16) : Number(key.slice(1));
    return n>0 && n<=0x10ffff && !(n>=0xd800 && n<=0xdfff) ? String.fromCodePoint(n) : '';
  });
}
function plain(value) {
  return decode(scalar(value)).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
}
function articleURL(value, spec) {
  try {
    const url = new URL(scalar(value));
    if (url.protocol!=='https:' || !spec.articleHosts.includes(url.hostname) || url.port || url.username || url.password || !url.pathname.startsWith(spec.articlePathPrefix || '/')) return null;
    url.hash='';url.search='';return url.href;
  } catch {return null;}
}
// Miniaturas: solo https público, sin credenciales ni puertos, y del dominio permitido si el medio lo fija.
export function imageURL(value, hosts) {
  const text = typeof value === 'string' ? decode(value.trim()) : '';
  if (!text || text.length > 2048) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (!url.hostname.includes('.') || /^[\d.]+$/.test(url.hostname) || url.hostname.startsWith('[')) return null;
    if (hosts?.length && !hosts.includes(url.hostname)) return null;
    if (/\/images\/core\/emoji\//.test(url.pathname)) return null;
    url.hash = ''; return url.href;
  } catch { return null; }
}
const list = value => Array.isArray(value) ? value : value ? [value] : [];
// enclosure, media:content, media:thumbnail y, en último caso, la primera <img> del contenido (sin emojis).
export function itemImage(row, hosts) {
  const candidates = [
    ...list(row.enclosure).filter(e => /^image\//i.test(e?.['@_type'] || '')).map(e => e['@_url']),
    ...list(row['media:content']).filter(m => (m?.['@_medium'] || 'image') === 'image' && /^(image\/|$)/i.test(m?.['@_type'] || '')).map(m => m['@_url']),
    ...list(row['media:thumbnail']).map(m => m?.['@_url']),
    ...list(row['media:group']).flatMap(g => [...list(g?.['media:thumbnail']), ...list(g?.['media:content'])].map(m => m?.['@_url'])),
  ];
  for (const html of [row['content:encoded'], row.description].map(scalar)) {
    for (const tag of decode(html).match(/<img\b[^>]*>/gi) || []) {
      if (/wp-smiley|emoji/i.test(tag)) continue;
      candidates.push(tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1]);
    }
  }
  for (const candidate of candidates) { const url = imageURL(candidate, hosts); if (url) return url; }
  return null;
}
const ARTICLE_MAX_CHARS = 15000; // una noticia completa (BioBio: 200–600 palabras), con tope ante textos anómalos
const isoDate = value => Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
export function readingPages(text, limit = 180) {
  const words = text.split(/\s+/), pages=[];let page='';
  for (const word of words) {
    if (page && page.length+word.length+1>limit) {pages.push(page);page='';}
    // Feed text is bounded, but an abnormal long token must not overflow a screen.
    for(let i=0;i<word.length;i+=limit){const part=word.slice(i,i+limit);if(i){pages.push(page);page='';}page+=(page?' ':'')+part;}
  }
  if(page)pages.push(page);return pages;
}
export function parseRssFeed(xml, spec) {
  if (typeof xml!=='string' || Buffer.byteLength(xml)>2_000_000 || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw fault('El formato de noticias no es válido.');
  let channel;
  try {channel=new XMLParser({processEntities:false,parseTagValue:false,ignoreAttributes:false,attributeNamePrefix:'@_'}).parse(xml).rss?.channel;} catch {throw fault('No se pudo leer la fuente de noticias.');}
  if (!channel || plain(channel.title)!==spec.channelTitle) throw fault('La fuente no corresponde al medio configurado.');
  const rows=Array.isArray(channel.item)?channel.item:channel.item?[channel.item]:[];
  const unique=new Map();
  for (const row of rows.slice(0,60)) {
    const url=articleURL(row.link, spec),title=plain(row.title).slice(0,220);
    if (!url || !title) continue;
    const clean=text=>text.replace(/(?:Contin[uú]a leyendo|Leer m[aá]s|The post)\b[\s\S]*$/i,'').trim();
    // Only the publisher's own text from its feed: the full article (content:encoded) when it is
    // published there, otherwise its summary. Never a generated article.
    const full=clean(plain(row['content:encoded']))||clean(plain(row.description));
    const excerpt=full.length>ARTICLE_MAX_CHARS?full.slice(0,ARTICLE_MAX_CHARS).replace(/\s+\S*$/,'')+'…':full;
    const id=createHash('sha256').update(url).digest('hex').slice(0,24);
    unique.set(id,{id,title,url,image:itemImage(row,spec.imageHosts),publishedAt:isoDate(row.pubDate),source:spec.name,titlePages:readingPages(title),pages:readingPages(excerpt || 'Esta noticia no incluye un extracto en la fuente.'),excerptAvailable:!!excerpt});
  }
  if(!unique.size)throw fault('La fuente no entregó noticias. Puedes volver a intentarlo.');
  return {source:spec.name,sourceUrl:spec.feedUrl,publishedAt:isoDate(channel.lastBuildDate),items:[...unique.values()].slice(0,30)};
}
export async function limitedText(response, signal, max = 2_000_000) {
  if(Number(response.headers?.get('content-length'))>max)throw fault('La fuente de noticias es demasiado grande.');
  const reader=response.body.getReader();const chunks=[];let size=0;
  try {while(true){signal.throwIfAborted();const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max)throw fault('La fuente de noticias es demasiado grande.');chunks.push(value);}} finally {await reader.cancel().catch(()=>{});}
  return Buffer.concat(chunks).toString('utf8');
}
export function rssManifest(spec) {
  return {
    schemaVersion:1,id:spec.id,name:spec.name,aliases:[],version:spec.version,
    interface:{kind:'news',entry:'news'},auth:{type:'none'},dependencies:['Internet'],source:spec.feedUrl,
    requiredEvidence:['list','read'],
    actions:[{id:'list',mutates:false,requiresAccount:false},{id:'read',mutates:false,requiresAccount:false}]
  };
}
export function inspectRssFeed(xml) {
  if(typeof xml!=='string' || Buffer.byteLength(xml)>2_000_000 || /<!DOCTYPE|<!ENTITY/i.test(xml))throw fault('El formato de noticias no es válido.');
  let channel;
  try {channel=new XMLParser({processEntities:false,parseTagValue:false,ignoreAttributes:true}).parse(xml).rss?.channel;}catch{}
  const title=plain(channel?.title);
  if(!title || title.length>300)throw fault('La fuente debe publicar RSS con un nombre de medio.');
  return {channelTitle:title};
}
export async function downloadRss(spec, fetcher, signal) {
  const timeout=AbortSignal.any([signal,AbortSignal.timeout(12000)]);
  const response=await fetcher(spec.feedUrl,{signal:timeout,redirect:'error',headers:{Accept:'application/rss+xml, application/xml, text/xml','User-Agent':'Toki-accessible-reader/1.0'}});
  if(!response.ok)throw fault('El medio no respondió. Puedes volver a intentarlo.');
  const xml=await limitedText(response,timeout);timeout.throwIfAborted();return xml;
}
// images: índice opcional {url de la noticia → miniatura} del mismo medio; si falla, las noticias se muestran sin imagen.
export function createRssAdapter(spec,{fetcher=fetch,now=Date.now,images}={}) {
  let cache=null,fetchedAt=0;const articles=new Map();
  async function feed(signal) {
    if(cache && now()-fetchedAt<300000)return cache;
    const [xml,index]=await Promise.all([downloadRss(spec,fetcher,signal),images?images(fetcher,signal).catch(()=>null):null]);
    const parsed=parseRssFeed(xml,spec);
    if(index)for(const item of parsed.items)item.image??=imageURL(index.get(item.url),spec.imageHosts);
    cache=parsed;fetchedAt=now();
    for(const article of cache.items)articles.set(article.id,article);
    while(articles.size>120)articles.delete(articles.keys().next().value);
    return cache;
  }
  return {
    manifest:rssManifest(spec),
    errorMessage:()=> 'No se pudieron cargar las noticias. Comprueba Internet y vuelve a intentarlo.',
    async prepare({signal,report}) {
      report({stage:1,connector:'publisher-rss',message:`Conectando con ${spec.name}…`});
      await feed(signal);
      return {stage:3,status:'needs_test',message:'Noticias conectadas sin cuenta. Falta probar elegir y leer contigo.'};
    },
    async execute(action,payload,ctx) {
      if(action==='list') {
        const data=await feed(ctx.signal);ctx.evidence('list');
        const sourceTime=Date.parse(data.publishedAt || data.items[0]?.publishedAt);
        return {...data,items:data.items.map(({pages,titlePages,excerptAvailable,...item})=>item),fetchedAt:new Date(fetchedAt).toISOString(),stale:!Number.isFinite(sourceTime)||now()-sourceTime>48*3600000};
      }
      if(action==='read') {
        if(!/^[a-f0-9]{24}$/.test(payload.articleId||''))throw fault('Noticia no válida.',400);
        if(!articles.has(payload.articleId))await feed(ctx.signal);
        const article=articles.get(payload.articleId);
        if(!article)throw fault('La noticia ya no está en la lista. Vuelve a elegir una noticia.',404);
        ctx.evidence('read');return {article};
      }
      throw fault('Acción no disponible.',404);
    }
  };
}
