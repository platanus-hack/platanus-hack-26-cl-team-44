import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,stat,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRappiAdapter} from '../../software/apps-bridge/adapters/rappi.mjs';
import {createRappiClient,createRappiSession} from '../../software/apps-bridge/connectors/rappi-client.mjs';

const product={product_id:123,store_id:456,name:'Pizza de prueba',price:8500,image:'pizza.png',in_stock:true,has_toppings:true};
const search={stores:[{store_id:456,store_name:'Local de prueba',store_type:'restaurant',logo:'logo.png',eta:'20 min',products:[product]}]};
const options={categories:[{id:1,description:'Masa',min_toppings_for_categories:1,max_toppings_for_categories:1,toppings:[{id:2,description:'Delgada',price:0,is_available:true}]}]};
const context=()=>({signal:new AbortController().signal,generation:1,evidence:()=>{},connected:()=>{},disconnected:()=>{},report:()=>{}});
function fixture({connected=false,now=Date.now}={}){
 let session=connected?{token:'test-only-secret',deviceId:'fixture',connectedAt:'fixture'}:null,cart=[],failed=false;const calls=[];
 const fetcher=async(url,init)=>{
  calls.push({url,init});let data;
  if(url.includes('unified-search'))data=search;
  else if(url.endsWith('/guest/passport/'))data={token:'guest-passport-test-only'};
  else if(url.endsWith('/v2/guest'))data={access_token:'guest-test-only'};
  else if(url.endsWith('/ms/application-user/auth'))data={id:1};
  else if(url.includes('/user-addresses/active'))data={id:1,country:'CL',title:'Dirección de prueba',lat:-33.4,lng:-70.6};
  else if(url.includes('/toppings/'))data=options;
  else if(url.endsWith('/all/get'))data=cart;
  else if(url.endsWith('/restaurant/store')){
   cart=[{store_type:'restaurant',product_total:8500,shipping_total:1000,stores:[{id:456,name:'Local de prueba',valid:true,products:[{id:'456_123',name:'Pizza de prueba',units:1,price:8500,total:8500}]}]}];
   if(failed)throw Error('Network failed after write test-only-secret');data={};
  }else throw Error('Unexpected request '+url);
  return new Response(JSON.stringify(data));
 };
 const adapter=createRappiAdapter({fetcher,now,sessionStore:{read:async()=>session,clear:async()=>{session=null;}},login:{start:async()=>({state:'waiting'}),status:()=>({state:'waiting'}),close:async()=>{}}});
 return {adapter,calls,setFailure:()=>failed=true,changeSession:()=>session={...session,connectedAt:'new'}};
}
test('Rappi guest exploration is real-shaped, scoped to job/generation and never enables purchases',async()=>{
 const {adapter,calls}=fixture(),ctx=context(),payload={jobId:'one'};
 assert.equal((await adapter.prepare(ctx)).status,'needs_test');
 const found=await adapter.execute('search',{...payload,category:'pizza'},ctx);assert.equal(found.stores.length,1);
 const result=await adapter.execute('products',{...payload,storeId:456},ctx);assert.equal(result.items[0].price,8500);
 const selected=await adapter.execute('select',{...payload,storeId:456,productId:123},ctx);assert.equal(selected.canAdd,false);
 await assert.rejects(adapter.execute('products',{jobId:'another',storeId:456},ctx),/categoría/);
 await assert.rejects(adapter.execute('products',{...payload,storeId:456},{...ctx,generation:2}));
 await assert.rejects(adapter.execute('search',{...payload,category:'; shell command'},ctx),/categoría/);
 await assert.rejects(adapter.execute('cart',payload,ctx),/cuenta/);
 // Pedir exige cuenta conectada y la confirmación de importes (ticket de 'quote'); sin eso, se rechaza.
 await assert.rejects(adapter.execute('order',payload,ctx),/Falta conectar|Vuelve a revisar/);
 assert.ok(adapter.manifest.actions.some(a=>a.id==='order'&&a.mutates&&a.requiresAccount));assert.ok(adapter.manifest.requiredEvidence.includes('order'));
 assert.ok(calls.every(c=>new URL(c.url).origin==='https://services.rappi.cl'));
 assert.ok(calls.every(c=>!c.init.headers.authorization||c.init.headers.authorization==='Bearer guest-test-only'));
 assert.equal(selected.groups.length,1);
});
test('Rappi requires exact options, ignores client prices, refuses duplicate/replayed cart writes and invalidates session selections',async()=>{
 const f=fixture({connected:true}),ctx=context(),payload={jobId:'one'};
 await f.adapter.execute('search',{...payload,category:'pizza'},ctx);
 const selected=await f.adapter.execute('select',{...payload,storeId:456,productId:123},ctx);
 await assert.rejects(f.adapter.execute('add',{...payload,ticket:selected.ticket,options:[]},ctx),/opciones/);
 await assert.rejects(f.adapter.execute('add',{...payload,ticket:selected.ticket,options:[999]},ctx),/opciones/);
 await assert.rejects(f.adapter.execute('add',{...payload,ticket:'invented',options:[2]},ctx));
 const cart=await f.adapter.execute('add',{...payload,ticket:selected.ticket,options:[2],price:1},ctx);assert.equal(cart.productsTotal,8500);
 const write=f.calls.find(c=>c.init.method==='PUT');assert.equal(JSON.parse(write.init.body)[0].products[0].price,8500);
 await assert.rejects(f.adapter.execute('add',{...payload,ticket:selected.ticket,options:[2]},ctx),/ya se envió/);
 assert.equal(f.calls.filter(c=>c.init.method==='PUT').length,1);
 const another=await f.adapter.execute('select',{...payload,storeId:456,productId:123},ctx);
 await assert.rejects(f.adapter.execute('add',{...payload,ticket:another.ticket,options:[2]},ctx),/Ya tienes un carrito/);
 f.changeSession();await assert.rejects(f.adapter.execute('products',{...payload,storeId:456},ctx),/categoría/);
});
test('Rappi uncertain writes are not repeated or reported as success; cart can be read for recovery',async()=>{
 const f=fixture({connected:true}),ctx=context(),p={jobId:'one'};
 await f.adapter.execute('search',{...p,category:'pizza'},ctx);const selected=await f.adapter.execute('select',{...p,storeId:456,productId:123},ctx);
 f.setFailure();const add={...p,ticket:selected.ticket,options:[2]};
 await assert.rejects(f.adapter.execute('add',add,ctx),e=>!e.message.includes('secret')&&e.status===409);
 await assert.rejects(f.adapter.execute('add',add,ctx));assert.equal(f.calls.filter(c=>c.init.method==='PUT').length,1);
 assert.equal((await f.adapter.execute('cart',p,ctx)).stores[0].items.length,1);
});
test('Rappi transport sanitizes service failures, rejects oversized responses and respects cancellation',async()=>{
 for(const code of [401,403,429,500]){
  const client=createRappiClient({fetcher:async()=>new Response('private credentials',{status:code})});
  await assert.rejects(client('/test'),e=>!e.message.includes('credentials'));
 }
 const oversized=createRappiClient({fetcher:async()=>new Response('x'.repeat(6*1024*1024+1))});await assert.rejects(oversized('/test'),/demasiado grande/);
 const controller=new AbortController();controller.abort();
 const client=createRappiClient({fetcher:async(_url,init)=>{init.signal.throwIfAborted();}});
 await assert.rejects(client('/test',{signal:controller.signal}));
});
test('Rappi credentials persist only in a restricted local file and clear cleanly',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'toki-rappi-session-'));try{
  const store=createRappiSession(dir);assert.equal(await store.read(),null);
  await store.save({token:'test-only-secret',deviceId:'fixture',email:'not persisted'});
  const file=join(dir,'rappi-session.json');assert.equal((await stat(file)).mode&0o777,0o600);assert.ok(!(await readFile(file,'utf8')).includes('not persisted'));
  assert.equal((await store.read()).country,'CL');await store.clear();assert.equal(await store.read(),null);
 }finally{await rm(dir,{recursive:true,force:true});}
});
