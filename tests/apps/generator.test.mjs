import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAppsServer} from '../../software/apps-bridge/server.mjs';
import {publicFeedURL,publicAddress,publicFetch} from '../../software/apps-bridge/generator/public-fetch.mjs';
import {validateRecipe,readerId} from '../../software/apps-bridge/generator/packages.mjs';
import {newsFixture} from './news-fixture.mjs';
const sourceUrl='https://news.example.org/feed.xml';
const xml=newsFixture.replaceAll('BioBioChile','Diario de prueba').replaceAll('www.biobiochile.cl','news.example.org');
const request={name:'Diario de prueba',sourceUrl,tasks:'Elegir titulares y leer extractos RSS.'};
const generated=req=>({recipe:{schemaVersion:1,kind:'rss-reader',name:req.name,sourceUrl:req.sourceUrl,capabilities:['list','read'],unsupportedTasks:[],reason:'Lectura de extractos.'},provenance:{engine:'fixture'}});
async function fixture(t,options={}){
 const dir=mkdtempSync(join(tmpdir(),'toki-generator-'));let server,api;
 async function start(){server=createAppsServer({stateDir:dir,adapters:[],readerFetch:async()=>new Response(xml),generate:async req=>generated(req),...options});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,token=(await(await fetch(base+'/api/session')).json()).token;
 api=async(path,data)=>{const r=await fetch(base+'/api/'+path,{method:data===undefined?'GET':'POST',headers:{'x-toki-token':token,...(data===undefined?{}:{'content-type':'application/json'})},...(data===undefined?{}:{body:JSON.stringify(data)})});return {status:r.status,...await r.json()};};}
 async function stop(){server.closeAllConnections();await new Promise(r=>server.close(r));}
 await start();t.after(async()=>{await stop();rmSync(dir,{recursive:true,force:true});});
 return {dir,api:(...args)=>api(...args),restart:async()=>{await stop();await start();}};
}
async function settle(api,id){for(let n=0;n<150;n++){const j=(await api('jobs')).jobs.find(j=>j.id===id);if(!['queued','preparing'].includes(j.status))return j;await new Promise(r=>setTimeout(r,5));}throw Error('Did not settle');}
test('generated reader installs verified data, survives restart, and still needs personal acceptance',async t=>{
 let calls=0;const f=await fixture(t,{generate:async req=>{calls++;return generated(req);}}),{api}=f;
 const j=(await api('jobs',request)).job,result=await settle(api,j.id);
 assert.equal(result.status,'needs_test');assert.equal(result.stage,4);assert.deepEqual(Object.keys(result.evidence).sort(),['list','read']);assert.equal(result.app,readerId(sourceUrl));
 const m=(await api('adapters')).adapters[0];assert.equal(m.generated,true);assert.equal(m.name,request.name);
 assert.equal((await api(`jobs/${j.id}/review`,{functional:true,personal:false})).status,409);
 await f.restart();assert.equal(calls,1);assert.equal((await settle(api,j.id)).status,'needs_test');
 const list=await api(`apps/${result.app}/actions/list`,{jobId:j.id});assert.equal(list.items.length,8);assert.equal(list.source,request.name);
 assert.equal((await api(`apps/${result.app}/actions/read`,{jobId:j.id,articleId:list.items[0].id})).article.source,request.name);
 assert.equal((await api(`apps/${result.app}/actions/exec`,{jobId:j.id,command:'whoami'})).status,404);
 const files=readdirSync(join(f.dir,'packages'));assert.equal(files.filter(x=>x.endsWith('.json')).length,2);
 assert.ok(!JSON.stringify(JSON.parse(readFileSync(join(f.dir,'packages',result.packageDigest+'.json')))).includes('pages'));
});
test('unsupported tasks and invalid model output never install a package',async t=>{
 let mode='unsupported';const {api,dir}=await fixture(t,{generate:async req=>{const out=generated(req);if(mode==='unsupported'){out.recipe.kind='unsupported';out.recipe.unsupportedTasks=['Enviar mensajes'];}else out.recipe.command='curl secret';return out;}});
 let j=(await api('jobs',{...request,tasks:'Leer y enviar mensajes'})).job;
 assert.equal((await settle(api,j.id)).status,'needs_adapter');assert.equal((await api('adapters')).adapters.length,0);
 assert.deepEqual(readdirSync(join(dir,'packages')),[]);
 mode='invalid';await api(`jobs/${j.id}/retry`,{});assert.equal((await settle(api,j.id)).status,'error');assert.deepEqual(readdirSync(join(dir,'packages')),[]);
 assert.throws(()=>validateRecipe({...generated(request).recipe,sourceUrl:'https://different.example.org/feed'},request));
});
test('cancellation drops late generation, serializes builders, and explicit retry works',async t=>{
 let release,calls=0,active=0,maxActive=0;
 const {api,dir}=await fixture(t,{generate:async req=>{calls++;active++;maxActive=Math.max(maxActive,active);if(calls===1)await new Promise(r=>release=r);active--;return generated(req);}});
 const a=(await api('jobs',request)).job;while(!release)await new Promise(r=>setTimeout(r,5));
 const b=(await api('jobs',{...request,name:'Otro diario',sourceUrl:'https://news.example.org/other.xml'})).job;
 await api(`jobs/${a.id}/cancel`,{});assert.equal((await settle(api,a.id)).status,'cancelled');assert.deepEqual(readdirSync(join(dir,'packages')),[]);
 release();assert.equal((await settle(api,b.id)).status,'needs_test');assert.equal((await settle(api,a.id)).status,'cancelled');
 await api(`jobs/${a.id}/retry`,{});assert.equal((await settle(api,a.id)).status,'needs_test');assert.equal(maxActive,1);assert.equal(calls,3);
});
test('failed runtime checks and corrupted package cannot be enabled',async t=>{
 let fail=true;const f=await fixture(t,{readerFetch:async()=>{if(fail){fail=false;return new Response(xml);}throw Error('private-token');}});
 const j=(await f.api('jobs',request)).job;assert.equal((await settle(f.api,j.id)).status,'error');assert.deepEqual(readdirSync(join(f.dir,'packages')),[]);
 const g=await fixture(t),created=(await g.api('jobs',request)).job,done=await settle(g.api,created.id);
 writeFileSync(join(g.dir,'packages',done.packageDigest+'.json'),'{}');await g.restart();
 assert.equal((await settle(g.api,created.id)).status,'error');assert.equal((await g.api('adapters')).adapters.length,0);
 assert.equal((await g.api(`jobs/${created.id}/review`,{functional:true,personal:true})).status,409);
});
test('source validation blocks private, credentialed and non-HTTPS destinations',async()=>{
 for(const url of ['http://news.example.org/feed','https://127.0.0.1/feed','https://[::1]/','https://localhost/','https://service.internal/rss','https://user:pass@example.org/rss','https://example.org:8080/rss','file:///etc/passwd'])assert.throws(()=>publicFeedURL(url),url);
 for(const address of ['127.0.0.1','10.0.0.1','192.168.2.4','169.254.169.254','100.64.0.1','172.31.2.1','::1','::ffff:127.0.0.1','fe80::1','fd00::1','2001:db8::1'])assert.equal(publicAddress(address),false,address);
 assert.equal(publicAddress('8.8.8.8'),true);assert.equal(publicAddress('2606:4700:4700::1111'),true);
 await assert.rejects(publicFetch('https://127.0.0.1/rss'));
});
