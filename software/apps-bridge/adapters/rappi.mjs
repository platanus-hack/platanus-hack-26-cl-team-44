import {randomUUID} from 'node:crypto';
import {createRappiClient,createRappiSession,createRappiGuest,RAPPI_DEFAULT_LOCATION,rappiFault as fault} from '../connectors/rappi-client.mjs';
import {createRappiLogin} from '../connectors/rappi-login.mjs';

const departments = [
 {id:'restaurants',name:'Restaurantes',terms:[['pizza','Pizza'],['hamburguesa','Hamburguesas'],['sushi','Sushi'],['empanadas','Empanadas']]},
 {id:'market',name:'Supermercado',terms:[['frutas','Frutas'],['leche','Lácteos'],['pan','Panadería'],['limpieza','Limpieza']]},
 {id:'care',name:'Farmacia y cuidado',terms:[['shampoo','Champú'],['protector solar','Protección solar'],['pañales','Pañales'],['pasta dental','Higiene dental']]},
 {id:'pets',name:'Mascotas',terms:[['alimento para perro','Alimento para perros'],['alimento para gato','Alimento para gatos'],['arena para gato','Arena para gatos'],['juguete para perro','Juguetes para perros']]},
 {id:'gifts',name:'Flores y regalos',terms:[['flores','Flores'],['chocolates','Chocolates'],['peluches','Peluches'],['globos','Globos']]}
];
export const rappiCategories=departments.flatMap(({id:department,terms})=>terms.map(([id,name])=>({id,name,department})));
const catalog={departments:departments.map(({id,name})=>({id,name})),categories:rappiCategories};
const text=(s,n=150)=>typeof s==='string'?s.slice(0,n):'';
const number=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
const id=n=>Number.isSafeInteger(n)&&n>0;
function image(value,prefix='products'){
 if(typeof value!=='string'||!value)return '';
 try{const url=new URL(value.startsWith('https:')?value:`https://images.rappi.cl/${prefix}/${value}`);return url.protocol==='https:'&&['images.rappi.cl','images.rappi.com'].includes(url.hostname)?url.href:'';}catch{return '';}
}
function catalogStore(store, department){
 const restaurant=store.store_type==='restaurant';
 if(!id(store.store_id)||!store.store_type||typeof store.store_name!=='string')return null;
 if(department && (department==='restaurants')!==restaurant)return null;
 const products=[];
 for(const item of Array.isArray(store.products)?store.products:[]){
  const productId=typeof item.product_id==='string' && /^\d+$/.test(item.product_id)?Number(item.product_id):item.product_id;
  if(!id(productId)||item.store_id!==store.store_id||typeof item.name!=='string'||!number(item.price))continue;
  products.push({id:productId,storeId:store.store_id,name:text(item.name),price:item.price,image:image(item.image),available:item.in_stock===true,hasOptions:item.has_toppings===true});
  if(products.length===60)break;
 }
 if(!products.length)return null;
 return {id:store.store_id,name:text(store.store_name),restaurant,image:restaurant?image(store.logo,'restaurants_logo'):products.find(p=>p.image)?.image||'',eta:text(store.eta,40),products};
}
export const rappiManifest={schemaVersion:1,id:'rappi',name:'Rappi',aliases:['Rappi Chile'],version:'0.1.0',interface:{kind:'food',entry:'food'},auth:{type:'local-session',optionalFor:['search','products','select']},dependencies:['Internet','Cuenta Rappi Chile para carrito'],source:'https://github.com/crafter-station/rappi-cli/tree/5c4e5b03e7df8f275a6e4b0dbef74a589e842515',requiredEvidence:['search','products','select','cart','quote','order','tracking'],actions:[...['status','search','products','select','connect','connection','disconnect','cart','quote'].map(action=>({id:action,mutates:['connect','disconnect','quote'].includes(action),requiresAccount:['cart','quote'].includes(action)})),{id:'add',mutates:true,requiresAccount:true}],limitations:['La compra y el pago aún no están habilitados.']};

export function createRappiAdapter({stateDir,fetcher=fetch,sessionStore=createRappiSession(stateDir),login,now=Date.now}={}){
 const request=createRappiClient({fetcher});
 const auth=login||createRappiLogin({sessionStore,request});
 const selections=new Map(),guest=createRappiGuest(request,{now});
 async function location(session,signal){
  if(!session)return {...RAPPI_DEFAULT_LOCATION,label:'Explorando Santiago',confirmed:false};
  const a=await request('/api/ms/consumer-address/v2/user-addresses/active',{session,signal});
  if(!a||!Number.isFinite(a.lat)||!Number.isFinite(a.lng)||!id(a.id)||!['CL','CHL','Chile'].includes(a.country))throw fault('Elige una dirección de Chile en Rappi y vuelve a comprobar la conexión.',409);
  return {lat:a.lat,lng:a.lng,id:a.id,label:text(a.title||a.address||a.subtitle),confirmed:true};
 }
 function state(payload,ctx,session){
  const s=selections.get(payload.jobId);
  if(!s||s.generation!==ctx.generation||s.sessionAt!==(session?.connectedAt||'')||now()-s.at>10*60*1000)throw fault('Vuelve a elegir una categoría para actualizar los productos.',409);
  return s;
 }
 async function account(){const session=await sessionStore.read();if(!session)throw fault('Falta conectar la cuenta de Rappi Chile desde la configuración del equipo.',409);return session;}
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
   report({stage:1,connector:'crafter-rappi-chile',message:'Comprobando la búsqueda de Rappi Chile…'});
   const data=await request('/api/pns-global-search-api/v1/unified-search?is_prime=false',{method:'POST',body:{query:'pizza',...RAPPI_DEFAULT_LOCATION},signal});
   if(!Array.isArray(data.stores)||!data.stores.some(s=>s.store_type==='restaurant'&&id(s.store_id)&&s.products?.length))throw fault('Rappi no devolvió restaurantes. Puedes reintentar.',502);
   return {stage:2,status:'needs_test',message:'Catálogo de Rappi disponible. El carrito de restaurantes requiere una cuenta conectada.'};
  },
  async execute(action,payload,ctx){
   if(action==='connect')return auth.start();
   if(action==='connection')return {...auth.status(),connected:!!await sessionStore.read()};
   if(action==='disconnect'){await auth.close();await sessionStore.clear();selections.clear();ctx.disconnected();return {connected:false};}
   const session=await sessionStore.read();
   if(action==='status'){
    if(!session)return {connected:false,locationLabel:'Explorando Santiago · sin dirección de entrega',...catalog,paymentEnabled:false};
    await request('/ms/application-user/auth',{session,signal:ctx.signal});
    const loc=await location(session,ctx.signal);
    ctx.connected();
    return {connected:true,locationLabel:loc.label,...catalog,paymentEnabled:false};
   }
   if(action==='search'){
    const category=rappiCategories.find(c=>c.id===payload.category);
    const query=category?.id||(!payload.category && typeof payload.query==='string' && payload.query.trim());
    if(!query||query.length>160)throw fault('Elige una categoría o escribe un producto.');
    const loc=await location(session,ctx.signal);
    const data=await request('/api/pns-global-search-api/v1/unified-search?is_prime=false',{method:'POST',body:{query,lat:loc.lat,lng:loc.lng},session,signal:ctx.signal});
    if(!Array.isArray(data.stores))throw fault('No se pudieron leer las tiendas de Rappi.',502);
    const stores=data.stores.map(store=>catalogStore(store,category?.department)).filter(Boolean).slice(0,60);
    ctx.signal.throwIfAborted();
    if(selections.size>=100)selections.delete(selections.keys().next().value);
    selections.set(payload.jobId,{generation:ctx.generation,at:now(),sessionAt:session?.connectedAt||'',location:loc,stores});
    if(stores.length)ctx.evidence('search');
    return {category:category?.name||query,locationLabel:loc.label,stores:stores.map(({products,...s})=>({...s,productCount:products.length})),paymentEnabled:false};
   }
   if(action==='products'){
    const s=state(payload,ctx,session),store=s.stores.find(s=>s.id===payload.storeId);if(!store)throw fault('Elige una tienda de la lista.');
    ctx.evidence('products');return {store:{id:store.id,name:store.name},items:store.products,notice:'Productos que coinciden con la búsqueda.'};
   }
   if(action==='select'){
    const s=state(payload,ctx,session),store=s.stores.find(s=>s.id===payload.storeId),product=store?.products.find(p=>p.id===payload.productId);if(!product)throw fault('Elige un producto de la lista.');
    if(!store.restaurant){
     s.selected=null;
     ctx.evidence('select');
     return {product,store:{id:store.id,name:store.name},groups:[],catalogOnly:true,canAdd:false,paymentEnabled:false};
    }
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
    const loc=await location(session,ctx.signal);if(loc.id!==s.location.id)throw fault('La dirección cambió. Vuelve a seleccionar el producto.',409);
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
    return {...result,notice:'Importes del carrito, sin compra realizada. El total final y el pago requieren verificación.'};
   }
   throw fault('La compra y el pago todavía no están habilitados.',409);
  }
 };
}
