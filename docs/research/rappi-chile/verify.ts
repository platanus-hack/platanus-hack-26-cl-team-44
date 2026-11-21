// Ejecutar copiado en la raíz del checkout auditado; solo consultas públicas.
import { search } from './src/services/search';
import { SearchResultSchema } from './src/schemas/search';
import { getStoreDetail, getRestaurantCatalog } from './src/services/store';
import { getProductToppings } from './src/services/product';
const config = {token:'', deviceId:crypto.randomUUID(),lat:-33.4147039,lng:-70.6023703};
const results = await search('pizza',config);
const validation=SearchResultSchema.safeParse(results);
if (!validation.success || !results.stores?.length) throw new Error('La búsqueda no devolvió tiendas compatibles');
const first=results.stores.find(s=>s.products?.length);
if (!first) throw new Error('La búsqueda no devolvió productos para comprobar');
const evidence:any={timestamp:new Date().toISOString(),country:'CL',coordinates:'Rappi Chile public default; not a delivery address',authenticated:false,upstream:'5c4e5b03e7df8f275a6e4b0dbef74a589e842515',schemaCompatible:validation.success,validationIssues:validation.success?[]:validation.error.issues.slice(0,3).map(x=>({path:x.path,message:x.message})),storeCount:results.stores?.length,examples:results.stores?.slice(0,3).map(s=>({id:s.store_id,name:s.store_name,products:s.products?.slice(0,2).map(p=>({id:p.product_id,name:p.name,price:p.price,inStock:p.in_stock}))}))};
for(const [name,fn] of Object.entries({catalog:()=>getRestaurantCatalog(config,{limit:2}),store:()=>getStoreDetail(first!.store_id,config),toppings:()=>getProductToppings(first!.store_id,first!.products[0].product_id,config)})){
 try {const data=await fn(); evidence[name]={ok:true,keys:Object.keys(data as object)};}catch(e){evidence[name]={ok:false,error:String(e)}}
}
await Bun.write('toki-chile-evidence.json',JSON.stringify(evidence,null,2));
console.log(JSON.stringify(evidence,null,2));
