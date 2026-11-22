// Pedido real en Rappi solo con llamadas a la API, en el mismo orden que la web oficial (grabado el 22-nov-2026):
//   1. GET  /api/ms/shopping-cart/v1/{tipo}/checkout/detail
//   2. POST /api/ms/checkout-component/{tipo}            {delivery_method, scheduled, store_ids}
//   3. POST /api/ms/shopping-cart/v1/{tipo}/recalculate  {store_type}  → carrito recalculado completo
//   4. POST /api/ms/shopping-cart-proxy/{tipo}/checkout  con ESE carrito como cuerpo y los headers de dispositivo
// El CLI de Crafter mandaba solo {return_key} y Rappi creaba el pedido sin cobrar (rappi-cli issue #2).
// La web además corre el perfil antifraude de ThreatMetrix en el navegador (cybs-fp-id); aquí solo va el ID.
// Reglas: un intento, sin reintentos; el total recalculado no puede pasar el tope.
import {randomUUID} from 'node:crypto';
import {RAPPI_PAIS,rappiFault as fault} from './rappi-client.mjs';

const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export async function pedirPorApi({request,session,storeType='restaurant',maxTotal,signal,report=()=>{},simular=false}){
 if(!session)throw fault(`Falta conectar la cuenta de ${RAPPI_PAIS.nombre}.`,409);
 if(!Number.isSafeInteger(maxTotal)||maxTotal<=0)throw fault('Falta el tope del pedido.');
 const base=`/api/ms/shopping-cart/v1/${storeType}`;
 report('Revisando el checkout…');
 const detalle=await request(`${base}/checkout/detail`,{session,signal});
 const carritos=await request('/api/ms/shopping-cart/v1/all/get',{method:'POST',body:{},session,signal});
 const carrito=Array.isArray(carritos)?carritos.find(c=>c.store_type===storeType):null;
 const tiendas=(carrito?.stores||[]).filter(s=>Array.isArray(s.products)&&s.products.length).map(s=>s.id);
 if(!tiendas.length)throw fault('El carrito está vacío.',409);
 await request(`/api/ms/checkout-component/${storeType}`,{method:'POST',body:{delivery_method:'delivery',scheduled:false,store_ids:tiendas},session,signal});
 const rec=await request(`${base}/recalculate`,{method:'POST',body:{store_type:storeType},session,signal});
 const total=Number(rec?.total);
 if(!Number.isFinite(total))throw fault('Rappi no devolvió el total del pedido. No hice el pedido.',502);
 if(total>maxTotal)throw fault(`El total ($${total}) pasa el tope ($${maxTotal}). No hice el pedido.`,409);
 if(!rec.payment_method)throw fault('La cuenta no tiene medio de pago elegido en Rappi.',409);
 const medio=String(rec.payment_method?.type||rec.payment_method?.payment_method_type||rec.payment_method?.name||'medio de pago').slice(0,30);
 if(simular)return {simulado:true,total,medio,returnKey:!!detalle?.return_key};
 report(`Total $${total}. Haciendo el pedido…`);
 const id=()=>randomUUID();
 const headers={
  'user-agent':UA,needappsflyerid:'true','af-web-id':id(),appsflyer_id:`${Date.now()}-${Math.floor(Math.random()*1e19)}`,
  'singular-device-id':id(),'google-client-id':`GA1.1.${Math.floor(Math.random()*1e10)}.${Math.floor(Date.now()/1000)}`,
  'amplitude-session-id':String(Date.now()),'cybs-fp-id':id(),referer:`${RAPPI_PAIS.web}/checkout/${storeType}`,
 };
 const r=await request(`/api/ms/shopping-cart-proxy/${storeType}/checkout`,{method:'POST',body:rec,session,signal,headers,raw:true});   // un solo envío
 const orden=Array.isArray(r.body)?r.body[0]:r.body;
 if(r.status>=200&&r.status<300&&orden?.id)return {orderId:String(orden.id),state:String(orden.state||''),total,medio,splitPaymentGate:orden.split_payment_gate===true,splitDelay:orden.split_delay_order===true,via:'api'};
 const codigo=String(orden?.code||orden?.error?.code||r.status);
 throw fault(`Rappi no aceptó el pedido por API (${codigo}).`,r.status>=500?502:409);
}
