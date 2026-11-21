import test from 'node:test';
import assert from 'node:assert/strict';
import {createYouTubeAdapter,youtubeVideos} from '../../software/apps-bridge/adapters/youtube.mjs';
const fixture=()=>createYouTubeAdapter({fetcher:async()=>new Response(JSON.stringify({title:'Video de prueba',author_name:'Canal de prueba'}))});
test('YouTube preparation and selection never claim playback; state observations are scoped to selection and generation',async()=>{
 const adapter=fixture(),evidence=[],ctx={signal:new AbortController().signal,generation:1,evidence:key=>evidence.push(key)};
 const prepared=await adapter.prepare({...ctx,report:()=>{}});assert.equal(prepared.status,'needs_test');assert.deepEqual(evidence,[]);
 const list=await adapter.execute('list',{},ctx);assert.equal(list.items.length,2);assert.deepEqual(evidence,['list']);
 const selection=await adapter.execute('select',{jobId:'one',videoId:youtubeVideos[0].id},ctx);assert.deepEqual(evidence,['list']);
 const payload={jobId:'one',videoId:youtubeVideos[0].id,ticket:selection.ticket,state:2};
 await assert.rejects(adapter.execute('observe',payload,ctx),/Primero/);
 await assert.rejects(adapter.execute('observe',{...payload,state:1,ticket:'invented'},ctx));
 await assert.rejects(adapter.execute('observe',{...payload,state:1},{...ctx,generation:2}));
 await adapter.execute('observe',{...payload,state:1},ctx);await adapter.execute('observe',payload,ctx);assert.deepEqual(evidence,['list','play','pause']);
 await adapter.execute('select',{jobId:'one',videoId:youtubeVideos[1].id},ctx);
 await assert.rejects(adapter.execute('observe',payload,ctx),/Vuelve/);
 await assert.rejects(adapter.execute('select',{jobId:'one',videoId:'https://evil.test'},ctx),/Elige/);
});
test('YouTube unavailable metadata fails recoverably without fabricated videos',async()=>{
 const adapter=createYouTubeAdapter({fetcher:async()=>new Response('{}',{status:503})});
 await assert.rejects(adapter.prepare({signal:new AbortController().signal,report:()=>{}}),/No se pudieron cargar/);
});
