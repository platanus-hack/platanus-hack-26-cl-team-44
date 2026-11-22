import {randomUUID} from 'node:crypto';
import {createRappiClient,createRappiSession,createRappiGuest,RAPPI_DEFAULT_LOCATION,RAPPI_PAIS,rappiFault as fault} from '../connectors/rappi-client.mjs';
import {createRappiLogin} from '../connectors/rappi-login.mjs';
import {createRappiCheckout} from '../connectors/rappi-checkout.mjs';

export const rappiCategories=[{id:'pizza',name:'Pizza'},{id:'hamburguesa',name:'Hamburguesas'},{id:'sushi',name:'Sushi'},{id:'empanadas',name:'Empanadas'}];
const text=(s,n=150)=>typeof s==='string'?s.slice(0,n):'';
const number=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
const id=n=>Number.isSafeInteger(n)&&n>0;
const plano=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
// Pedido sugerido por el agente: cada palabra (4+ letras) de "preferir" que aparece suma; el primer término pesa más
// (es el más específico, p. ej. "perro vaquero"). "evitar" y pasar el tope descartan el producto.
function puntaje(name,preferir,evitar=[]){const n=plano(name);if(evitar.some(w=>w&&n.includes(w)))return -1;
 return preferir.reduce((t,term,i)=>t+term.split(/\s+/).filter(w=>w.length>=4&&n.includes(w)).length*(preferir.length-i),0);}
const palabras=v=>Array.isArray(v)?v.filter(w=>typeof w==='string').slice(0,5).map(w=>plano(w).slice(0,30)):[];
function image(value,prefix='products'){
 if(typeof value!=='string'||!value)return '';
 try{const url=new URL(value.startsWith('https:')?value:`https://${RAPPI_PAIS.images}/${prefix}/${value}`);return url.protocol==='https:'&&['images.rappi.cl','images.rappi.com'].includes(url.hostname)?url.href:'';}catch{return '';}
}
export const rappiManifest={schemaVersion:1,id:'rappi',name:'Rappi',aliases:[RAPPI_PAIS.nombre],version:'0.1.0',interface:{kind:'food',entry:'food'},auth:{type:'local-session',optionalFor:['search','products','select']},dependencies:['Internet',`Cuenta ${RAPPI_PAIS.nombre} para carrito`],source:'https://github.com/crafter-station/rappi-cli/tree/5c4e5b03e7df8f275a6e4b0dbef74a589e842515',requiredEvidence:['search','products','select','cart','quote','order','tracking'],actions:[...['status','search','products','select','connect','connection','disconnect','cart','quote'].map(action=>({id:action,mutates:['connect','disconnect','quote'].includes(action),requiresAccount:['cart','quote'].includes(action)})),{id:'add',mutates:true,requiresAccount:true},{id:'order',mutates:true,requiresAccount:true}],limitations:['El pedido se hace por el checkout oficial de Rappi, con confirmación y tope; las verificaciones (CVV, 3DS) las completa una persona.']};

export function createRappiAdapter({stateDir,fetcher=fetch,sessionStore=createRappiSession(stateDir),login,now=Date.now}={}){
 const request=createRappiClient({fetcher});
 const auth=login||createRappiLogin({sessionStore,request,stateDir});
 const pedir=createRappiCheckout({stateDir});
 let cotizacion=null;   // última revisión de importes: el pedido exige una reciente y del mismo carrito
 const selections=new Map(),guest=createRappiGuest(request,{now});
 async function location(session,signal){
  if(!session)return {...RAPPI_DEFAULT_LOCATION,label:`Explorando ${RAPPI_PAIS.ciudad}`,confirmed:false};
  const a=await request('/api/ms/consumer-address/v2/user-addresses/active',{session,signal});
  if(!a||!Number.isFinite(a.lat)||!Number.isFinite(a.lng)||!id(a.id)||!RAPPI_PAIS.countries.includes(a.country))throw fault(`Elige una dirección de ${RAPPI_PAIS.ciudad} en Rappi y vuelve a comprobar la conexión.`,409);
  return {lat:a.lat,lng:a.lng,id:a.id,label:text(a.title||a.address||a.subtitle),confirmed:true};
 }
 function state(payload,ctx,session){
  const s=selections.get(payload.jobId);
  if(!s||s.generation!==ctx.generation||s.sessionAt!==(session?.connectedAt||'')||now()-s.at>10*60*1000)throw fault('Vuelve a elegir una categoría para actualizar los productos.',409);
  return s;
 }
 async function account(){const session=await sessionStore.read();if(!session)throw fault(`Falta conectar la cuenta de ${RAPPI_PAIS.nombre} desde la configuración del equipo.`,409);return session;}
 function normalizedCart(raw){
  if(!raw||!Array.isArray(raw.stores)||!number(raw.product_total)||!number(raw.shipping_total))throw fault('Rappi devolvió un carrito no reconocido. Revísalo en Rappi.',502);
  return {productsTotal:raw.product_total,shippingTotal:raw.shipping_total,stores:raw.stores.map(s=>({id:s.id,name:text(s.name),valid:s.valid===true,items:(Array.isArray(s.products)?s.products:[]).map(p=>({id:text(p.id),name:text(p.name),quantity:p.units,price:p.price,total:p.total}))})),paymentEnabled:false};
 }
 async function cart(session,signal){
  const carts=await request('/api/ms/shopping-cart/v1/all/get',{method:'POST',body:{},session,signal});
  if(!Array.isArray(carts))throw fault('Rappi devolvió un carrito no reconocido.',502);
  const selected=carts.find(c=>c.store_type==='restaurant');
  return selected?normalizedCart(selected):{stores:[],productsTotal:0,shippingTotal:0,paymentEnabled:false};
 }
 return {manifest:rappiManifest,errorMessage:()=> 'No se pudo conectar con Rappi. Comprueba Internet y vuelve a intentarlo.',close:()=>auth.close(),
  async prepare({signal,report}){
   report({stage:1,connector:'crafter-rappi-'+RAPPI_PAIS.country.toLowerCase(),message:`Comprobando la búsqueda de ${RAPPI_PAIS.nombre}…`});
   const data=await request('/api/pns-global-search-api/v1/unified-search?is_prime=false',{method:'POST',body:{query:'pizza',...RAPPI_DEFAULT_LOCATION},signal});
   if(!Array.isArray(data.stores)||!data.stores.some(s=>s.store_type==='restaurant'&&id(s.store_id)&&s.products?.length))throw fault('Rappi no devolvió restaurantes. Puedes reintentar.',502);
   return {stage:2,status:'needs_test',message:'Puedes explorar comida real. Cuenta y dirección se conectan para el carrito; compra y pago siguen pendientes.'};
  },
  async execute(action,payload,ctx){
   if(action==='connect')return auth.start();
   if(action==='connection')return {...auth.status(),connected:!!await sessionStore.read()};
   if(action==='disconnect'){await auth.close();await sessionStore.clear();selections.clear();ctx.disconnected();return {connected:false};}
   const session=await sessionStore.read();
   if(action==='status'){
    if(!session)return {connected:false,locationLabel:`Explorando ${RAPPI_PAIS.ciudad} · sin dirección de entrega`,categories:rappiCategories,paymentEnabled:false,currency:RAPPI_PAIS.moneda,locale:RAPPI_PAIS.formato};
    await request('/ms/application-user/auth',{session,signal:ctx.signal});
    const loc=await location(session,ctx.signal);
    ctx.connected();
    return {connected:true,locationLabel:loc.label,categories:rappiCategories,paymentEnabled:false,currency:RAPPI_PAIS.moneda,locale:RAPPI_PAIS.formato};
   }
   if(action==='search'){
    // Categoría fija, o texto libre (la sugerencia del agente con memoria: query + preferir/evitar/max)
    const libre=typeof payload.query==='string'?payload.query.replace(/\s+/g,' ').trim().slice(0,60):'';
    const category=libre.length>=2?{id:libre,name:libre}:rappiCategories.find(c=>c.id===payload.category);if(!category)throw fault('Elige una categoría de comida.');
    const preferir=palabras(payload.preferir),evitar=palabras(payload.evitar),max=Number.isSafeInteger(payload.max)&&payload.max>0?payload.max:0;
    const loc=await location(session,ctx.signal);
    const data=await request('/api/pns-global-search-api/v1/unified-search?is_prime=false',{method:'POST',body:{query:category.id,lat:loc.lat,lng:loc.lng},session,signal:ctx.signal});
    if(!Array.isArray(data.stores))throw fault('No pudimos leer los restaurantes de Rappi.',502);
    const stores=data.stores.filter(s=>s.store_type==='restaurant'&&id(s.store_id)&&typeof s.store_name==='string').map(s=>({id:s.store_id,name:text(s.store_name),image:image(s.logo,'restaurants_logo'),eta:text(s.eta,40),products:(Array.isArray(s.products)?s.products:[]).filter(p=>id(p.product_id)&&p.store_id===s.store_id&&typeof p.name==='string'&&number(p.price)).slice(0,60).map(p=>({id:p.product_id,storeId:s.store_id,name:text(p.name),price:p.price,image:image(p.image),available:p.in_stock===true,hasOptions:p.has_toppings===true}))})).filter(s=>s.products.length).slice(0,60);
    if(libre&&(preferir.length||evitar.length||max)){
     for(const s of stores){s.products=s.products.map(p=>({...p,score:puntaje(p.name,preferir,evitar)})).filter(p=>p.score>=0&&(!max||p.price<=max)).sort((a,b)=>b.score-a.score);s.best=(s.products[0]?.score||0)+(puntaje(s.name,preferir)>0?1:0);}
     stores.splice(0,stores.length,...stores.filter(s=>s.products.length).sort((a,b)=>b.best-a.best));
    }
    ctx.signal.throwIfAborted();
    if(selections.size>=100)selections.delete(selections.keys().next().value);
    selections.set(payload.jobId,{generation:ctx.generation,at:now(),sessionAt:session?.connectedAt||'',location:loc,stores});
    if(stores.length)ctx.evidence('search');
    return {category:category.name,locationLabel:loc.label,stores:stores.map(({products,...s})=>({...s,productCount:products.length})),paymentEnabled:false};
   }
   if(action==='products'){
    const s=state(payload,ctx,session),store=s.stores.find(s=>s.id===payload.storeId);if(!store)throw fault('Elige un restaurante de la lista.');
    ctx.evidence('products');return {store:{id:store.id,name:store.name},items:store.products,notice:'Productos encontrados; no es el menú completo.'};
   }
   if(action==='select'){
    const s=state(payload,ctx,session),store=s.stores.find(s=>s.id===payload.storeId),product=store?.products.find(p=>p.id===payload.productId);if(!product)throw fault('Elige un producto de la lista.');
    let groups=[],optionsChecked=false;
    {
     const catalogSession=session||await guest(ctx.signal);
     // Always check requirements: a search flag alone cannot prove no options.
     const data=await request(`/api/web-gateway/web/restaurants-bus/products/toppings/${store.id}/${product.id}/`,{session:catalogSession,signal:ctx.signal});
     if(!Array.isArray(data.categories))throw fault('No se pudieron comprobar las opciones de este producto.',502);
     groups=data.categories.map(g=>{
      if(!id(g.id)||!Number.isInteger(g.min_toppings_for_categories)||!Number.isInteger(g.max_toppings_for_categories)||g.min_toppings_for_categories<0||g.max_toppings_for_categories<g.min_toppings_for_categories||!Array.isArray(g.toppings))throw fault('Las opciones del producto requieren revisión.',502);
      return {id:g.id,name:text(g.description),min:g.min_toppings_for_categories,max:g.max_toppings_for_categories,items:g.toppings.filter(t=>id(t.id)&&number(t.price)).map(t=>({id:t.id,name:text(t.description),price:t.price,available:t.is_available===true}))};
     });optionsChecked=true;
    }
    ctx.signal.throwIfAborted();
    const ticket=randomUUID();s.selected={ticket,store,product,groups,optionsChecked,attempted:false};ctx.evidence('select');
    return {ticket,product,store:{id:store.id,name:store.name},groups,canAdd:!!session&&optionsChecked&&product.available,paymentEnabled:false};
   }
   if(action==='cart'){const s=await account();const result=await cart(s,ctx.signal);ctx.evidence('cart');return result;}
   if(action==='add'){
    const s=state(payload,ctx,await account()),selection=s.selected;
    if(!selection||selection.ticket!==payload.ticket||selection.attempted)throw fault('Esta selección ya se envió o cambió. Revisa el carrito antes de continuar.',409);
    if(!selection.optionsChecked||!selection.product.available)throw fault('Primero comprueba las opciones del producto.',409);
    if(!Array.isArray(payload.options)||payload.options.some(x=>!id(x))||new Set(payload.options).size!==payload.options.length)throw fault('Opciones no válidas.');
    const chosen=selection.groups.flatMap(g=>g.items.filter(t=>payload.options.includes(t.id)));
    if(chosen.length!==payload.options.length||chosen.some(t=>!t.available)||selection.groups.some(g=>{const n=g.items.filter(t=>payload.options.includes(t.id)).length;return n<g.min||n>g.max;}))throw fault('Completa las opciones requeridas del producto.');
    const loc=await location(session,ctx.signal);if(loc.id!==s.location.id)throw fault('La dirección cambió. Vuelve a elegir la comida.',409);
    const existing=await cart(session,ctx.signal);
    if(existing.stores.some(store=>store.items.length))throw fault('Ya tienes un carrito en Rappi. Revísalo antes de preparar uno nuevo desde Toki.',409);
    if(existing.stores.some(store=>store.items.some(p=>p.id===`${selection.store.id}_${selection.product.id}`||p.id===String(selection.product.id))))throw fault('Este producto ya está en tu carrito. Revísalo antes de añadir otra vez.',409);
    selection.attempted=true;
    const p=selection.product;
    try{
     await request('/api/ms/shopping-cart/v2/restaurant/store',{method:'PUT',session,signal:ctx.signal,body:[{id:selection.store.id,place_at:'',delivery_method:'delivery',products:[{id:`${selection.store.id}_${p.id}`,product_id:p.id,name:p.name,description:p.name,comment:'',toppings:chosen.map(t=>({id:t.id,description:t.name,units:1,price:t.price})),units:1,price:p.price,real_price:p.price,markup_price:p.price,sale_type:'U',sale_type_origin:'U',unit_type:'U',category_id:0,category_name:'',pum:'0',is_sponsored:false,ad_provider_metadata:'',in_stock:true}]}]});
     const result=await cart(session,ctx.signal);
     if(!result.stores.some(st=>st.id===selection.store.id&&st.items.some(item=>item.id===`${selection.store.id}_${p.id}`||item.id===String(p.id))))throw Error();
     ctx.evidence('cart');return result;
    }catch{throw fault('No pudimos confirmar el cambio. Revisa el carrito; no se volverá a añadir automáticamente.',409);}
   }
   if(action==='quote'){
    const session=await account();
    const raw=await request('/api/ms/shopping-cart/v1/restaurant/recalculate',{method:'POST',body:{},session,signal:ctx.signal});
    const result=normalizedCart(raw);
    // This is NOT a final charge: checkout widgets/payment authorization remain unverified.
    const firma=JSON.stringify(result.stores.map(s=>[s.id,s.items.map(i=>[i.id,i.quantity])]));
    cotizacion={ticket:randomUUID(),at:now(),firma,total:result.productsTotal+result.shippingTotal};
    return {...result,ticket:cotizacion.ticket,notice:'Revisa los importes. Para pedir, confirma dos veces; el total final lo muestra Rappi en el checkout.'};
   }
   if(action==='order'){
    // Confirmación: ticket de la última revisión (5 min), mismo carrito y un tope. Un intento; sin reintentos.
    const session=await account();
    if(!cotizacion||payload.ticket!==cotizacion.ticket||now()-cotizacion.at>5*60*1000)throw fault('Vuelve a revisar los importes antes de pedir.',409);
    const actual=await cart(session,ctx.signal);
    const firma=JSON.stringify(actual.stores.map(s=>[s.id,s.items.map(i=>[i.id,i.quantity])]));
    if(firma!==cotizacion.firma||!actual.stores.some(s=>s.items.length))throw fault('El carrito cambió. Revísalo otra vez antes de pedir.',409);
    const tope=Number.isSafeInteger(payload.max)&&payload.max>0?payload.max:Math.ceil(cotizacion.total*1.3)+5000;   // envío, servicio y propina
    cotizacion=null;
    const r=await pedir({maxTotal:tope,signal:ctx.signal});
    ctx.evidence('order');
    return {...r,notice:r.orderId?`Pedido ${r.orderId} hecho. Revisa el cobro en la app de Rappi.`:'Pedido confirmado en Rappi después de la verificación.'};
   }
   throw fault('La compra y el pago todavía no están habilitados.',409);
  }
 };
}
