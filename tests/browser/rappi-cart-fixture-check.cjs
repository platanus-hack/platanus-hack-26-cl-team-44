// Synthetic UI-only account/cart contract. Does not authenticate or write to Rappi.
async (page,base='http://127.0.0.1:8792')=>{
 const check=(c,m)=>{if(!c)throw Error(m);};let writes=0;
 const product={id:123,storeId:456,name:'Pizza de prueba',price:8500,available:true,image:''};
 const cart={productsTotal:8500,shippingTotal:1000,paymentEnabled:false,stores:[{id:456,name:'Restaurante de prueba',items:[{id:'456_123',name:'Pizza de prueba',quantity:1,price:8500}]}]};
 await page.route('**/api/apps/rappi/actions/**',async route=>{
  const action=new URL(route.request().url()).pathname.split('/').pop();let data;
  if(action==='status')data={connected:true,locationLabel:'Dirección de prueba',categories:[{id:'pizza',name:'Pizza'}],paymentEnabled:false};
  else if(action==='search')data={category:'Pizza',stores:Array.from({length:4},(_,i)=>({id:456+i,name:'Restaurante de prueba '+(i+1),eta:'20 min'}))};
  else if(action==='products')data={store:{id:456,name:'Restaurante de prueba'},items:[product]};
  else if(action==='select')data={ticket:'fixture-only',product,store:{id:456,name:'Restaurante de prueba'},canAdd:true,groups:[{id:1,name:'Elige la masa',min:1,max:1,items:[{id:2,name:'Delgada',price:0,available:true},{id:3,name:'Gruesa',price:500,available:true}]}]};
  else if(action==='add'){writes++;await new Promise(resolve=>setTimeout(resolve,500));data=cart;}
  else if(action==='cart'||action==='quote')data=cart;
  else throw Error('Unexpected UI action: '+action);
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto(base+'/woki-os.html#apps');
 await page.locator('[data-c="mouse"]').click();await page.waitForFunction(()=>window.TokiApps?.active?.online);
 await page.locator('[data-value="rappi"]').click();
 await page.locator('[data-app-action="food-search"]').click();
 const stores=page.locator('[data-app-action="food-store"]');
 await stores.first().waitFor();
 for(const size of [{width:1280,height:800},{width:390,height:844}]){
  await page.setViewportSize(size);
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#s-apps')).transform==='none');
  const gaps=await stores.evaluateAll(cards=>{
   const rows=cards.map(el=>el.getBoundingClientRect());
   const pager=document.querySelector('.food-pages').getBoundingClientRect();
   const navigation=document.querySelector('#appsContent .ta-nav').getBoundingClientRect();
   // Sin franja fija abajo: la navegación debe caber dentro de la pantalla.
   const screen=document.querySelector('#s-apps').getBoundingClientRect();
   return [...rows.slice(1).map((row,i)=>row.top-rows[i].bottom),pager.top-rows.at(-1).bottom,
     navigation.top-pager.bottom,screen.bottom-navigation.bottom];
  });
  check(gaps.every(gap=>gap>1),'Store rows or navigation overlap at '+size.width+': '+gaps.join(', '));
 }
 await page.setViewportSize({width:1280,height:800});
 await page.locator('[data-app-action="food-next"]').click();
 check(await stores.count()===1,'Last page should show one result');
 await page.locator('[data-app-action="food-prev"]').click();
 await stores.first().click();await page.locator('[data-app-action="food-product"]').click();
 await page.locator('[data-app-action="food-options"]').click();
 check(await page.locator('[data-app-action="food-options-next"]').isDisabled(),'Required option skipped');
 await page.locator('[data-app-action="food-option"][data-value="2"]').click();
 check(await page.locator('[data-app-action="food-option"][data-value="3"]').isDisabled(),'Maximum option count not enforced');
 await page.locator('[data-app-action="food-options-next"]').click();
 await page.waitForFunction(()=>TokiApps.active.view==='food-cart');check(writes===1,'Cart action repeated');
 for(const size of [{width:1280,height:800},{width:390,height:844}]){
  await page.setViewportSize(size);
  const overflow=await page.locator('#appsContent').evaluate(root=>[root.querySelector('.ta-screen'),...root.querySelectorAll('button')].some(el=>{const r=el.getBoundingClientRect();return r.bottom>innerHeight+1||el.scrollHeight>el.clientHeight+2;}));
  check(!overflow,'Cart overflow at '+size.width);
 }
 check(await page.locator('#appsContent').innerText().then(s=>s.includes('No se ha realizado ninguna compra')),'Misleading purchase status');
 check(await page.getByRole('button',{name:'Comprar',exact:true}).count()===0,'Unverified payment exposed');
 await page.unroute('**/api/apps/rappi/actions/**');
 return 'PASS: synthetic account/cart UI; required options, maximum selection, single write, desktop/mobile, no payment action. Not real cart evidence.';
}
