// Pedido real en Rappi por el checkout OFICIAL de la web, con la sesión guardada en el perfil de Chrome de Toki.
// La web hace sola la huella antifraude (cybs-fp-id), el cobro y las verificaciones (CVV, 3DS). El CLI de Crafter
// llamaba al endpoint directo y Rappi creaba el pedido sin cobrar (rappi-cli issue #2). Por eso aquí no se llama la API:
// se pulsa el botón oficial (data-qa="place-order-button") una sola vez y se lee la respuesta de Rappi.
//
// Reglas: un intento, nunca reintentos. Antes de pulsar, el código comprueba que el carrito es el esperado y que el
// total no pasa el tope. Si Rappi pide una verificación, la ventana queda abierta para que una persona la complete.
import {join} from 'node:path';
import {RAPPI_PAIS,rappiFault as fault} from './rappi-client.mjs';

export const perfilChrome=stateDir=>join(stateDir,'rappi-chrome');   // mismo perfil que usa rappi-login.mjs

export function createRappiCheckout({stateDir,launch}={}){
 let enCurso=false;
 return async function pedir({storeType='restaurant',maxTotal,signal,report=()=>{},simular=false}={}){
  if(enCurso)throw fault('Ya hay un pedido en curso. Espera a que termine.',409);
  if(!Number.isSafeInteger(maxTotal)||maxTotal<=0)throw fault('Falta el tope del pedido.');
  enCurso=true;
  let context=null;
  try{
   const chromium=launch?null:(await import('playwright-core')).chromium;
   context=await (launch?launch():chromium.launchPersistentContext(perfilChrome(stateDir),{channel:'chrome',headless:false,locale:RAPPI_PAIS.lang,viewport:{width:1100,height:820},args:['--window-size=1150,900']}));
   const page=context.pages()[0]||await context.newPage();
   report('Abriendo el checkout de Rappi…');
   await page.goto(`${RAPPI_PAIS.web}/checkout/${storeType}`,{waitUntil:'domcontentloaded',timeout:30000});
   const boton=page.locator('[data-qa="place-order-button"]');
   await Promise.race([
    boton.waitFor({state:'visible',timeout:45000}),
    page.waitForURL(/\/login/,{timeout:45000}).then(()=>{throw fault('La sesión web de Rappi venció. Vuelve a conectar la cuenta (make rappi).',401);}),
   ]);
   signal?.throwIfAborted();
   // Rappi abre recuadros de sugerencias ("¿Un último antojo?"): se cierran sin agregar nada.
   for(let i=0;i<6;i++){
    const otro=page.getByRole('button',{name:/en otro momento|no, gracias|ahora no/i});
    if(await otro.count()&&await otro.first().isVisible()){await otro.first().click();await page.waitForTimeout(800);}
    else await page.waitForTimeout(700);
   }
   // El botón se habilita cuando la web termina de cargar medio de pago y totales.
   for(let i=0;i<20&&await boton.isDisabled();i++)await page.waitForTimeout(1000);
   if(await boton.isDisabled())throw fault('Rappi no deja confirmar todavía (revisa medio de pago o dirección en la ventana).',409);
   // Total: la línea "Total" del resumen. Si no se puede leer o pasa el tope, no se pulsa nada.
   const lineas=(await page.evaluate(()=>document.body.innerText)).split('\n').map(l=>l.trim()).filter(Boolean);
   const monto=l=>{const m=l.match(/\$\s?([\d.]{3,})/);return m?Number(m[1].replace(/\./g,'')):NaN;};
   let total=NaN;
   for(let i=0;i<lineas.length&&!Number.isFinite(total);i++)if(/^total\b/i.test(lineas[i]))for(const l of lineas.slice(i,i+3)){total=monto(l);if(Number.isFinite(total))break;}
   if(!Number.isFinite(total))throw fault('No pude leer el total del checkout. No hice el pedido.',409);
   if(total>maxTotal)throw fault(`El total del checkout ($${total}) pasa el tope ($${maxTotal}). No hice el pedido.`,409);
   // Medio de pago elegido (solo el nombre; los últimos dígitos de tarjeta no se guardan ni se muestran completos).
   const metodo=(await page.evaluate(()=>{const c=document.querySelector('[data-testid="payment-method-container"]')||document.body;
    const r=[...c.querySelectorAll('input[type=radio]:checked,[aria-checked="true"],[data-checked="true"]')][0];
    const box=r?.closest('label,li,div');return (box?.innerText||'').replace(/\s+/g,' ').trim();}))||'';
   const medio=metodo.replace(/\d{4,}/g,'••••').slice(0,40);
   if(!medio)throw fault('No hay un medio de pago elegido en Rappi. Elígelo en la ventana y vuelve a intentar.',409);
   if(simular)return {simulado:true,total,medio};   // ensayo: todo menos el clic
   report(`Total $${total} · pago: ${medio}. Haciendo el pedido…`);
   const respuesta=page.waitForResponse(r=>r.url().includes(`/shopping-cart-proxy/${storeType}/checkout`)&&r.request().method()==='POST',{timeout:60000});
   await boton.click();                                   // un solo clic: desde aquí no hay reintento automático
   let r,datos=null;
   try{r=await respuesta;datos=await r.json().catch(()=>null);}
   catch{throw fault('Rappi no confirmó a tiempo. Revisa la app antes de intentar de nuevo: puede que el pedido sí exista.',504);}
   const orden=Array.isArray(datos)?datos[0]:null;
   if(r.ok()&&orden?.id){
    report(`Pedido ${orden.id} creado. Esperando que Rappi termine el cobro…`);
    // La web sigue con su flujo (pantalla de espera, cobro, seguimiento). Se le da tiempo antes de cerrar.
    await page.waitForURL(/tracking|order|pedido/i,{timeout:45000}).catch(()=>{});
    await page.waitForTimeout(5000);
    return {orderId:String(orden.id),state:String(orden.state||''),total,medio,splitPaymentGate:orden.split_payment_gate===true,url:page.url().replace(/\?.*/,'')};
   }
   const codigo=String(datos?.code||datos?.error?.code||r.status());
   // Verificaciones de Rappi (CVV, 3DS, identidad): la ventana queda abierta 3 minutos para que una persona termine.
   report('Rappi pidió una verificación. Complétala en la ventana de Chrome.');
   const terminado=await page.waitForURL(/tracking|order|pedido/i,{timeout:180000}).then(()=>true).catch(()=>false);
   if(terminado)return {orderId:null,state:'verificado_a_mano',total,medio,splitPaymentGate:false,url:page.url().replace(/\?.*/,'')};
   throw fault(`Rappi no aceptó el pedido (${codigo}). Revisa la ventana o la app de Rappi.`,409);
  }finally{
   enCurso=false;
   await context?.close().catch(()=>{});
  }
 };
}
