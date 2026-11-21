import {createRssAdapter, parseRssFeed, rssManifest} from './rss-reader.mjs';
export {readingPages} from './rss-reader.mjs';
export const BIOBIO_FEED = 'https://www.biobiochile.cl/static/feed-rss';
const spec={id:'biobio',name:'BioBioChile',version:'1.0.0',feedUrl:BIOBIO_FEED,channelTitle:'BioBioChile',articleHosts:['www.biobiochile.cl'],articlePathPrefix:'/noticias/'};
export const biobioManifest={...rssManifest(spec),aliases:['Bio Bio Chile']};
export const parseBioBioFeed=xml=>parseRssFeed(xml,spec);
export function createBioBioAdapter(options){return {...createRssAdapter(spec,options),manifest:biobioManifest};}
