// Synthetic UI-only account/cart contract. Does not authenticate or write to Rappi.
async page=>{
 const check=(c,m)=>{if(!c)throw Error(m);};let writes=0;
 const product={id:123,storeId:456,name:'Pizza de prueba',price:8500,available:true,image:''};
 const cart={productsTotal:8500,shippingTotal:1000,paymentEnabled:false,stores:[{id:456,name:'Restaurante de prueba',items:[{id:'456_123',name:'Pizza de prueba',quantity:1,price:8500}]}]};
 await page.route('**/api/apps/rappi/actions/**',async route=>{
  const action=new URL(route.request().url()).pathname.split('/').pop();let data;
  if(action==='status')data={connected:true,locationLabel:'Dirección de prueba',categories:[{id:'pizza',name:'Pizza'}],paymentEnabled:false};
  else if(action==='search')data={category:'Pizza',stores:[{id:456,name:'Restaurante de prueba',eta:'20 min'}]};
  else if(action==='products')data={store:{id:456,name:'Restaurante de prueba'},items:[product]};
  else if(action==='select')data={ticket:'fixture-only',product,store:{id:456,name:'Restaurante de prueba'},canAdd:true,groups:[{id:1,name:'Elige la masa',min:1,max:1,items:[{id:2,name:'Delgada',price:0,available:true},{id:3,name:'Gruesa',price:500,available:true}]}]};
  else if(action==='add'){writes++;await new Promise(resolve=>setTimeout(resolve,500));data=cart;}
  else if(action==='cart'||action==='quote')data=cart;
  else throw Error('Unexpected UI action: '+action);
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('http://127.0.0.1:8792/?start=apps');await page.waitForFunction(()=>window.TokiApps?.active?.online);
 await page.locator('[data-value="rappi"]').click();await page.locator('[data-app-action="open-adapter"]').click();
 await page.locator('[data-app-action="food-search"]').click();await page.locator('[data-app-action="food-store"]').click();await page.locator('[data-app-action="food-product"]').click();
 await page.locator('[data-app-action="food-options"]').click();
 check(await page.locator('[data-app-action="food-options-next"]').isDisabled(),'Required option skipped');
 await page.locator('[data-app-action="food-option"][data-value="2"]').click();
 check(await page.locator('[data-app-action="food-option"][data-value="3"]').isDisabled(),'Maximum option count not enforced');
 await page.locator('[data-app-action="food-options-next"]').click();
 await page.waitForFunction(()=>TokiApps.active.view==='food-cart');check(writes===1,'Cart action repeated');
 for(const size of [{width:1280,height:800},{width:390,height:844}]){
  await page.setViewportSize(size);
  const overflow=await page.locator('#lobbyApps').evaluate(root=>[root.querySelector('.ta-screen'),...root.querySelectorAll('button')].some(el=>{const r=el.getBoundingClientRect();return r.bottom>innerHeight+1||el.scrollHeight>el.clientHeight+2;}));
  check(!overflow,'Cart overflow at '+size.width);
 }
 check(await page.locator('#lobbyApps').innerText().then(s=>s.includes('No se ha realizado ninguna compra')),'Misleading purchase status');
 check(await page.getByRole('button',{name:'Comprar',exact:true}).count()===0,'Unverified payment exposed');
 await page.unroute('**/api/apps/rappi/actions/**');
 return 'PASS: synthetic account/cart UI; required options, maximum selection, single write, desktop/mobile, no payment action. Not real cart evidence.';
}
