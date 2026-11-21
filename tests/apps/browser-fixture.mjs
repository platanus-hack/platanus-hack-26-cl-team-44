// Separate, synthetic backend for browser checks. Never used by the product launcher.
import {newsFixture} from './news-fixture.mjs';
import {createAppsServer} from '../../software/apps-bridge/server.mjs';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const dir=mkdtempSync(join(tmpdir(),'toki-apps-browser-'));
let playing=false,current='spotify:track:0123456789ABCDEFGHIJKL';
const server=createAppsServer({stateDir:dir,installed:async()=>({stdout:'fixture'}),hasSpotify:()=>true,
  readerFetch:async()=>new Response(newsFixture.replaceAll('BioBioChile','Diario de prueba').replaceAll('www.biobiochile.cl','news.example.org')),
  generate:async req=>({recipe:{schemaVersion:1,kind:'rss-reader',name:req.name,sourceUrl:req.sourceUrl,capabilities:['list','read'],unsupportedTasks:[],reason:'Fixture de lectura'},provenance:{engine:'fixture'}}),
  run:async args=>{
    if(args.includes('search')) return {items:[{uri:current,name:'Canción de prueba',artists:['Artista de prueba']}]};
    if(args.includes('play')){playing=true;current=args.find(x=>x.startsWith('spotify:track:'))||current;}
    if(args.includes('pause'))playing=false;
    return {is_playing:playing,item:{uri:current,name:'Canción de prueba',artists:['Artista de prueba']}};
  },fetcher:async url=>url.includes('/static/feed-rss')?new Response(newsFixture):({ok:true,json:async()=>({items:[{full_name:'example/fixture-cli',html_url:'https://github.com/example/fixture-cli',description:'Synthetic test repository'}]})})
});
server.listen(8791,'127.0.0.1',()=>console.log('Synthetic Apps test fixture on 8791'));
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{server.close(()=>{rmSync(dir,{recursive:true,force:true});});server.closeAllConnections();});
