import test from 'node:test';
import assert from 'node:assert/strict';
import {pedirPorApi} from '../../software/apps-bridge/connectors/rappi-checkout-api.mjs';

function falso({total=8100,orden=[{id:123,state:'created',split_payment_gate:true}]}={}){
 const llamadas=[];
 const request=async(path,{method='GET',body,headers,raw}={})=>{
  llamadas.push({path,method,body,headers});
  if(path.endsWith('/checkout/detail'))return {return_key:'rk',summary:{}};
  if(path.endsWith('/all/get'))return [{store_type:'restaurant',stores:[{id:9,products:[{id:'9_1'}]}]}];
  if(path.includes('/checkout-component/'))return [];
  if(path.endsWith('/recalculate'))return {id:'cart',total,payment_method:{type:'rappi_pay_gateway'},stores:[{id:9}]};
  if(path.includes('/shopping-cart-proxy/'))return raw?{status:200,body:orden}:orden;
  throw Error('ruta inesperada '+path);
 };
 return {request,llamadas};
}

test('checkout por API: manda el carrito recalculado completo, una sola vez, con headers de dispositivo',async()=>{
 const f=falso();
 const r=await pedirPorApi({request:f.request,session:{token:'t',deviceId:'d'},maxTotal:25000});
 assert.equal(r.orderId,'123');assert.equal(r.splitPaymentGate,true);assert.equal(r.via,'api');
 const envios=f.llamadas.filter(l=>l.path.includes('/shopping-cart-proxy/'));
 assert.equal(envios.length,1);
 assert.equal(envios[0].body.id,'cart');                         // el carrito recalculado, no {return_key}
 assert.ok(envios[0].headers['cybs-fp-id']&&envios[0].headers['af-web-id']);
 assert.deepEqual(f.llamadas.map(l=>l.path.split('/').slice(-2).join('/')),['checkout/detail','all/get','checkout-component/restaurant','restaurant/recalculate','restaurant/checkout']);
});

test('checkout por API: no pide si el total pasa el tope ni si el carrito está vacío',async()=>{
 const caro=falso({total:30000});
 await assert.rejects(pedirPorApi({request:caro.request,session:{token:'t'},maxTotal:25000}),/pasa el tope/);
 assert.equal(caro.llamadas.filter(l=>l.path.includes('/shopping-cart-proxy/')).length,0);
 await assert.rejects(pedirPorApi({request:falso().request,session:null,maxTotal:25000}),/Falta conectar/);
});
