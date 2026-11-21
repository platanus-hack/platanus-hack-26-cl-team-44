import https from 'node:https';
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';

const fault = message => Object.assign(new Error(message), {status:400});
export function publicFeedURL(value) {
  let url;try{url=new URL(value);}catch{throw fault('Indica una fuente RSS HTTPS válida.');}
  if(url.protocol!=='https:' || url.port || url.username || url.password || url.hash ||
     isIP(url.hostname) || !url.hostname.includes('.') || /(^|\.)(localhost|local|internal|test|invalid)$/.test(url.hostname) || url.href.length>2000)
    throw fault('La fuente debe ser una dirección HTTPS pública, sin credenciales.');
  return url;
}
export function publicAddress(address) {
  if(isIP(address)===4){
    const [a,b]=address.split('.').map(Number);
    return !(a===0 || a===10 || a===127 || a>=224 || (a===100&&b>=64&&b<=127) ||
      (a===169&&b===254) || (a===172&&b>=16&&b<=31) || (a===192&&(b===168||b===0||b===2)) ||
      (a===198&&(b===18||b===19||b===51)) || (a===203&&b===0));
  }
  // Only global unicast; exclude documentation and special-purpose 2001::/23.
  return isIP(address)===6 && /^[23][0-9a-f]{3}:/i.test(address) && !/^2001:(?:0*[01][0-9a-f]{0,2}|db8):/i.test(address);
}
export async function publicFetch(value,{signal,headers}={}) {
  const url=publicFeedURL(value);signal?.throwIfAborted();
  const addresses=await lookup(url.hostname,{all:true,verbatim:true});
  signal?.throwIfAborted();
  if(!addresses.length || addresses.some(x=>!publicAddress(x.address)))throw fault('La fuente debe resolver a un servidor público.');
  const chosen=addresses.find(x=>x.family===4)||addresses[0];
  // Pin the validated address; TLS still verifies the original hostname.
  return new Promise((resolve,reject)=>{
    const req=https.get(url,{signal,headers,lookup:(_host,options,cb)=>{
      if(options.all)cb(null,[chosen]);else cb(null,chosen.address,chosen.family);
    }},res=>{
      if(res.statusCode!==200){res.resume();reject(fault('La fuente no respondió directamente. Comprueba su dirección RSS.'));return;}
      let size=0;const chunks=[];
      res.on('data',chunk=>{size+=chunk.length;if(size>2_000_000)req.destroy(fault('La fuente de noticias es demasiado grande.'));else chunks.push(chunk);});
      res.on('error',reject);
      res.on('end',()=>resolve(new Response(Buffer.concat(chunks),{status:200,headers:{'content-type':String(res.headers['content-type']||'application/xml')}})));
    });
    req.setTimeout(12000,()=>req.destroy(fault('La fuente tardó demasiado en responder.')));
    req.on('error',reject);
  });
}
