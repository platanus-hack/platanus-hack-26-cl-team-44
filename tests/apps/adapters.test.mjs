import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAppsServer} from '../../software/apps-bridge/server.mjs';
import {createBioBioAdapter,parseBioBioFeed,parseBioBioImages,BIOBIO_FEED,BIOBIO_IMAGES} from '../../software/apps-bridge/adapters/biobio.mjs';
import {imageURL,parseRssFeed} from '../../software/apps-bridge/adapters/rss-reader.mjs';
import {createAdapterRegistry} from '../../software/apps-bridge/adapters/registry.mjs';
import {newsFixture} from './news-fixture.mjs';
async function fixture(t,options={}){
 const dir=mkdtempSync(join(tmpdir(),'toki-adapters-'));
 const server=createAppsServer({stateDir:dir,installed:async()=>({stdout:'fixture'}),hasSpotify:()=>true,fetcher:async()=>new Response(newsFixture),...options});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));rmSync(dir,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+server.address().port,token=(await(await fetch(base+'/api/session')).json()).token;
 const api=async(path,data)=>{const r=await fetch(base+'/api/'+path,{method:data===undefined?'GET':'POST',headers:{'x-toki-token':token,...(data===undefined?{}:{'Content-Type':'application/json'})},...(data===undefined?{}:{body:JSON.stringify(data)})});return {status:r.status,...await r.json()};};
 return api;
}
async function settle(api,id){for(let n=0;n<100;n++){const job=(await api('jobs')).jobs.find(j=>j.id===id);if(!['queued','preparing'].includes(job.status))return job;await new Promise(r=>setTimeout(r,5));}throw Error('Did not settle');}
test('two real adapter contracts share preparation, dispatch, evidence and acceptance',async t=>{
 const api=await fixture(t);
 assert.deepEqual((await api('adapters')).adapters.map(a=>a.id),['spotify','biobio','youtube','rappi']);
 const j=(await api('jobs',{name:'BioBioChile',tasks:'Leer extractos'})).job;
 assert.equal((await settle(api,j.id)).status,'needs_test');
 assert.equal((await settle(api,j.id)).adapterVersion,'1.0.0');
 const list=await api('apps/biobio/actions/list',{jobId:j.id});assert.equal(list.items.length,8);
 assert.ok(!('pages' in list.items[0]));
 assert.equal((await api(`jobs/${j.id}/review`,{functional:true,personal:true})).status,409);
 const result=await api('apps/biobio/actions/read',{jobId:j.id,articleId:list.items[0].id});
 assert.ok(result.article.pages.length>1);assert.ok(result.article.pages.every(p=>p.length<=180));
 assert.equal((await settle(api,j.id)).stage,4);
 assert.equal((await api(`jobs/${j.id}/review`,{functional:true,personal:false})).status,409);
 assert.equal((await api(`jobs/${j.id}/review`,{functional:true,personal:true})).job.status,'ready');
 assert.equal((await api('apps/spotify/actions/play',{jobId:j.id})).status,409);
 assert.equal((await api('apps/biobio/actions/shell',{jobId:j.id})).status,404);
 assert.equal((await api('apps/biobio/actions/read',{jobId:j.id,articleId:'https://127.0.0.1/secret'})).status,400);
 await api(`jobs/${j.id}/cancel`,{});
 assert.equal((await api('apps/biobio/actions/list',{jobId:j.id})).status,409);
});
test('a third bundled adapter needs no app-specific HTTP routes or review logic',async t=>{
 const adapter={manifest:{schemaVersion:1,id:'example',name:'Example',version:'1.2.0',interface:{kind:'news',entry:'news'},actions:[{id:'list',mutates:false}],requiredEvidence:['list']},prepare:async()=>({status:'needs_test',stage:3}),execute:async(action,payload,ctx)=>{ctx.evidence('list');return {items:[]};}};
 const api=await fixture(t,{adapters:[adapter]});const j=(await api('jobs',{name:'Example'})).job;
 await settle(api,j.id);await api('apps/example/actions/list',{jobId:j.id});
 assert.equal((await api(`jobs/${j.id}/review`,{functional:true,personal:true})).job.status,'ready');
 adapter.manifest.version='2.0.0';assert.equal((await api('apps/example/actions/list',{jobId:j.id})).status,409);
 assert.throws(()=>createAdapterRegistry([adapter,adapter]),/Duplicate/);
});
test('cancelled action cannot add evidence or revive connection after a retry',async t=>{
 let release;
 const adapter={manifest:{id:'delayed',name:'Delayed',version:'1',interface:{kind:'news',entry:'news'},actions:[{id:'read',mutates:false}],requiredEvidence:['read']},prepare:async()=>({status:'needs_test',stage:3}),execute:async(a,p,c)=>{await new Promise(r=>release=r);c.evidence('read');c.connected();return {};}};
 const api=await fixture(t,{adapters:[adapter]});const id=(await api('jobs',{name:'Delayed'})).job.id;await settle(api,id);
 const pending=api('apps/delayed/actions/read',{jobId:id});while(!release)await new Promise(r=>setTimeout(r,5));
 await api(`jobs/${id}/cancel`,{});await api(`jobs/${id}/retry`,{});await settle(api,id);release();await pending;
 assert.deepEqual((await settle(api,id)).evidence,{});assert.equal((await settle(api,id)).stage,3);
});
test('RSS strips markup, rejects foreign URLs/entities/oversize and exposes source age',async()=>{
 const evil=newsFixture.replace('Este es un extracto','<script>alert(1)</script>Texto &amp; seguro').replace('https://www.biobiochile.cl/noticias/prueba/2.shtml','https://evil.test/article');
 const parsed=parseBioBioFeed(evil);assert.equal(parsed.items.length,7);assert.ok(!parsed.items[0].pages.join('').includes('alert('));assert.ok(parsed.items[0].pages.join('').includes('Texto & seguro'));
 assert.throws(()=>parseBioBioFeed('<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///etc/passwd">]>'+newsFixture));
 assert.throws(()=>parseBioBioFeed('x'.repeat(2_000_001)));
 assert.throws(()=>parseBioBioFeed('<html>unavailable</html>'));
 let calls=0;const ctx={signal:new AbortController().signal,evidence:()=>{},report:()=>{}};
 // The image index (BIOBIO_IMAGES) is a separate, optional request; only feed downloads count for the cache.
 const a=createBioBioAdapter({fetcher:async(url,options)=>{assert.equal(options.redirect,'error');if(url===BIOBIO_IMAGES)return new Response('',{status:404});calls++;assert.equal(url,BIOBIO_FEED);return new Response(newsFixture.replace(/<lastBuildDate>.*?<\/lastBuildDate>/,'<lastBuildDate>Mon, 01 Jan 2001 00:00:00 GMT</lastBuildDate>'));}});
 assert.equal((await a.execute('list',{},ctx)).stale,true);await a.execute('list',{},ctx);assert.equal(calls,1);
});
test('network failures stay recoverable and do not fabricate articles or readiness',async t=>{
 const api=await fixture(t,{fetcher:async()=>{throw Error('private-token=do-not-expose');}});
 const j=(await api('jobs',{name:'BioBioChile'})).job,result=await settle(api,j.id);
 assert.equal(result.status,'error');assert.ok(!result.message.includes('private-token'));
 assert.equal((await api(`jobs/${j.id}/review`,{functional:true,personal:true})).status,409);
});
test('thumbnail URLs: only public https, no credentials, ports, emoji or odd schemes',()=>{
 assert.equal(imageURL('https://cdn.example.org/a.jpg?w=750&amp;h=400#x'),'https://cdn.example.org/a.jpg?w=750&h=400');
 for(const bad of ['http://cdn.example.org/a.jpg','javascript:alert(1)','data:image/png;base64,AAAA','https://user:pw@cdn.example.org/a.jpg','https://cdn.example.org:8443/a.jpg','https://127.0.0.1/a.jpg','https://localhost/a.jpg','https://s.w.org/images/core/emoji/14.0.0/72x72/1f680.png','//cdn.example.org/a.jpg','https://cdn.example.org/'+'a'.repeat(2100)])assert.equal(imageURL(bad),null,bad);
 assert.equal(imageURL('https://cdn.example.org/a.jpg',['media.biobiochile.cl']),null);
});
test('RSS thumbnail comes from enclosure, media:content, media:thumbnail or the first non-emoji <img>',()=>{
 const spec={id:'demo',name:'Demo',channelTitle:'Demo',feedUrl:'https://news.example.org/rss',articleHosts:['news.example.org'],articlePathPrefix:'/'};
 const item=(n,extra)=>`<item><title>Nota ${n}</title><link>https://news.example.org/${n}</link>${extra}</item>`;
 const xml=`<?xml version="1.0"?><rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>Demo</title>${[
  item(1,'<enclosure url="https://cdn.example.org/1.jpg" type="image/jpeg" length="1"/>'),
  item(2,'<media:content url="https://cdn.example.org/2.jpg" medium="image"/>'),
  item(3,'<media:thumbnail url="https://cdn.example.org/3.jpg"/>'),
  item(4,'<description><![CDATA[<p><img class="wp-smiley" src="https://s.w.org/images/core/emoji/14.0.0/72x72/1f680.png"><img src="https://cdn.example.org/4.jpg"> Texto</p>]]></description>'),
  item(5,'<enclosure url="https://cdn.example.org/5.mp3" type="audio/mpeg"/><description>&lt;img src=&quot;javascript:alert(1)&quot;&gt; sin imagen</description>'),
  item(6,'<media:thumbnail url="http://cdn.example.org/6.jpg"/>'),
  item(7,'<description><![CDATA[<img src="https://cdn.example.org/7.jpg" onerror="alert(1)">"]]></description>')
 ].join('')}</channel></rss>`;
 const images=parseRssFeed(xml,spec).items.map(i=>i.image);
 assert.deepEqual(images,['https://cdn.example.org/1.jpg','https://cdn.example.org/2.jpg','https://cdn.example.org/3.jpg','https://cdn.example.org/4.jpg',null,null,'https://cdn.example.org/7.jpg']);
 assert.ok(parseRssFeed(xml,{...spec,imageHosts:['media.example.org']}).items.every(i=>i.image===null));
});
test('BioBioChile thumbnails come from the publisher JSON list; its failure keeps the news',async()=>{
 const index=parseBioBioImages(JSON.stringify([
  {post_URL:'https://www.biobiochile.cl/noticias/prueba/1.shtml',post_image:{URL:'2026/11/a.png',thumbnails:{medium:{URL:'2026/11/a-750x400.png'}}}},
  {post_URL:'https://www.biobiochile.cl/noticias/prueba/2.shtml',post_image:{URL:'../../etc/passwd'}},
  {post_URL:'https://www.biobiochile.cl/noticias/prueba/3.shtml',post_image:{URL:'https://evil.test/x.png'}}]));
 assert.deepEqual([...index],[['https://www.biobiochile.cl/noticias/prueba/1.shtml','https://media.biobiochile.cl/wp-content/uploads/2026/11/a-750x400.png']]);
 const ctx={signal:new AbortController().signal,evidence:()=>{}};
 const json=JSON.stringify([{post_URL:'https://www.biobiochile.cl/noticias/prueba/1.shtml',post_image:{thumbnails:{medium:{URL:'2026/11/a-750x400.png'}}}}]);
 const ok=createBioBioAdapter({fetcher:async url=>new Response(url===BIOBIO_IMAGES?json:newsFixture)});
 const items=(await ok.execute('list',{},ctx)).items;
 assert.equal(items[0].image,'https://media.biobiochile.cl/wp-content/uploads/2026/11/a-750x400.png');assert.equal(items[1].image,null);
 const broken=createBioBioAdapter({fetcher:async url=>{if(url===BIOBIO_IMAGES)throw Error('offline');return new Response(newsFixture);}});
 const list=await broken.execute('list',{},ctx);assert.equal(list.items.length,8);assert.ok(list.items.every(i=>i.image===null));
});
