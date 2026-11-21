import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAppsServer, normalizeTracks} from '../../software/apps-bridge/server.mjs';

const uri='spotify:track:0123456789ABCDEFGHIJKL';
async function setup(t, extra={}) {
  const dir=mkdtempSync(join(tmpdir(),'toki-apps-test-')); let playing=false; const calls=[];
  const run=async args=>{
    calls.push(args);
    if(args.includes('search'))return {items:[{uri,name:'Canción de prueba',artists:['Artista']}]};
    if(args.includes('play'))playing=true;
    if(args.includes('pause'))playing=false;
    return {is_playing:playing,item:{name:'Canción de prueba',uri}};
  };
  const options={stateDir:dir,run,installed:async()=>({stdout:'test-version'}),hasSpotify:()=>true,...extra};
  let server=createAppsServer(options);
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let base=`http://127.0.0.1:${server.address().port}`;
  let token=(await (await fetch(base+'/api/session')).json()).token;
  const api=async(path,data)=>{
    const response=await fetch(base+'/api/'+path,{method:data===undefined?'GET':'POST',headers:{'x-toki-token':token,...(data===undefined?{}:{'Content-Type':'application/json'})},...(data===undefined?{}:{body:JSON.stringify(data)})});
    return {status:response.status,data:await response.json()};
  };
  t.after(async()=>{await new Promise(r=>server.close(r));rmSync(dir,{recursive:true,force:true});});
  return {api,calls,get base(){return base;},async restart(){await new Promise(r=>server.close(r));server=createAppsServer(options);await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;token=(await(await fetch(base+'/api/session')).json()).token;}};
}
async function settled(api,id){for(let i=0;i<80;i++){const job=(await api('jobs')).data.jobs.find(j=>j.id===id);if(job.status!=='preparing')return job;await new Promise(r=>setTimeout(r,10));}throw Error('Job did not settle');}

test('real evidence and both reviews are required; sessions and progress survive reload',async t=>{
  const {api,restart}=await setup(t);
  const id=(await api('jobs',{name:'Spotify',tasks:'Buscar y escuchar'})).data.job.id;
  assert.equal((await settled(api,id)).status,'needs_connection');
  assert.equal((await api(`jobs/${id}/review`,{functional:true,personal:true})).status,409);
  await api('spotify/connect',{jobId:id,browser:'chrome'});
  assert.equal((await settled(api,id)).status,'needs_test');
  await api('spotify/search',{jobId:id,query:'Canción'});
  await api('spotify/play',{jobId:id,uri});
  assert.equal((await api(`jobs/${id}/review`,{functional:true,personal:true})).status,409);
  await api('spotify/pause',{jobId:id});
  assert.equal((await api(`jobs/${id}/review`,{functional:true,personal:false})).status,409);
  assert.equal((await api(`jobs/${id}/review`,{functional:true,personal:true})).data.job.status,'ready');
  await restart();
  assert.equal((await settled(api,id)).status,'ready');
  await api('spotify/disconnect',{});
  assert.equal((await settled(api,id)).status,'needs_connection');
  assert.deepEqual((await settled(api,id)).evidence,{});
});

test('cancelled discovery cannot reappear as completed; retry is explicit',async t=>{
  let complete;
  const {api}=await setup(t,{fetcher:()=>new Promise(r=>{complete=r;})});
  const id=(await api('jobs',{name:'Una app',tasks:'Escribir'})).data.job.id;
  await api(`jobs/${id}/cancel`,{});
  complete({ok:true,json:async()=>({items:[{full_name:'vendor/cli',html_url:'https://github.com/vendor/cli'}]})});
  await new Promise(r=>setTimeout(r,20));
  assert.equal((await settled(api,id)).status,'cancelled');
  await api(`jobs/${id}/retry`,{});
  complete({ok:true,json:async()=>({items:[]})});
  assert.equal((await settled(api,id)).status,'needs_adapter');
});

test('bridge rejects foreign origins, missing tokens, arbitrary commands and malformed tracks',async t=>{
  const {base,api,calls}=await setup(t);
  assert.equal((await fetch(base+'/api/session',{headers:{Origin:'https://example.com'}})).status,403);
  assert.equal((await fetch(base+'/api/jobs')).status,401);
  assert.equal((await api('spotify/shell',{command:'echo hello'})).status,404);
  assert.equal((await api('spotify/play',{uri:'spotify:track:bad; touch /tmp/x'})).status,400);
  assert.equal(calls.length,0);
  const input='--timeout=1 $(touch /tmp/x)';
  await api('spotify/search',{query:input});
  assert.deepEqual(calls[0].slice(-2),['--',input]);
});

test('Spotify errors never leak cookie values to the interface',async t=>{
  const {api}=await setup(t,{run:async()=>{throw Object.assign(Error('auth failed'),{stderr:'cookie sp_dc=SECRET_TOKEN'});}});
  const response=await api('spotify/search',{query:'Música'});
  assert.equal(response.status,502); assert.match(response.data.error,/Conecta/); assert.ok(!JSON.stringify(response).includes('SECRET_TOKEN'));
});

test('catalog normalization accepts supported shapes and rejects untrusted identifiers',()=>{
  assert.equal(normalizeTracks({tracks:{items:[{uri,name:'A',artists:[{name:'B'}]}]}})[0].artists,'B');
  assert.equal(normalizeTracks({items:[{uri:'https://evil.test',name:'Bad'}]}).length,0);
});

test('playback acknowledgement alone is not evidence; wait for actual Spotify state',async t=>{
  let reads=0;
  const {api}=await setup(t,{run:async args=>args.includes('status')?{is_playing:++reads>=3,item:{uri}}:{status:'ok'}});
  const response=await api('spotify/play',{uri});
  assert.equal(response.status,200);
  assert.equal(response.data.is_playing,true);
  assert.equal(reads,3);
});
