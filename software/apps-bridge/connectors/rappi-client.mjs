// Transport for the operations audited in crafter-station/rappi-cli@5c4e5b0.
// País por TOKI_RAPPI_PAIS: cl (por defecto, verificado contra www.rappi.cl en nov-2026) o co (Colombia,
// valores originales de rappi-cli: services.grability.rappi.com y www.rappi.com.co).
import {readFile,writeFile,mkdir,rename,chmod,unlink} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {randomUUID} from 'node:crypto';

const PAISES={
 cl:{country:'CL',countries:['CL','CHL','Chile'],origin:'https://services.rappi.cl',web:'https://www.rappi.cl',lang:'es-CL',images:'images.rappi.cl',location:{lat:-33.4147039,lng:-70.6023703},ciudad:'Santiago',nombre:'Rappi Chile',moneda:'CLP',formato:'es-CL'},
 co:{country:'CO',countries:['CO','COL','Colombia'],origin:'https://services.grability.rappi.com',web:'https://www.rappi.com.co',lang:'es-CO',images:'images.rappi.com',location:{lat:4.624335,lng:-74.063644},ciudad:'Bogotá',nombre:'Rappi Colombia',moneda:'COP',formato:'es-CO'},
};
export const RAPPI_PAIS=PAISES[String(process.env.TOKI_RAPPI_PAIS||'cl').toLowerCase()]||PAISES.cl;
export const RAPPI_ORIGIN=RAPPI_PAIS.origin;
export const RAPPI_DEFAULT_LOCATION=RAPPI_PAIS.location;
export const rappiFault=(message,status=400)=>Object.assign(new Error(message),{status});
export function createRappiSession(stateDir){
 const file=join(stateDir,'rappi-session.json');
 return {
  async read(){
   try{const s=JSON.parse(await readFile(file,'utf8'));if(s.country!==RAPPI_PAIS.country||typeof s.token!=='string'||!s.token||s.token.length>16384||typeof s.deviceId!=='string'||s.deviceId.length>256)throw Error();return s;}
   catch(e){if(e.code==='ENOENT')return null;throw rappiFault('La sesión de Rappi no se pudo leer. Vuelve a conectarla.',409);}
  },
  async save(s){
   await mkdir(dirname(file),{recursive:true,mode:0o700});
   const tmp=file+'.'+randomUUID()+'.tmp';
   await writeFile(tmp,JSON.stringify({country:RAPPI_PAIS.country,token:s.token,deviceId:s.deviceId,connectedAt:new Date().toISOString()}),{mode:0o600});
   await rename(tmp,file);await chmod(file,0o600);
  },
  async clear(){await unlink(file).catch(e=>{if(e.code!=='ENOENT')throw e;});}
 };
}
export function createRappiClient({fetcher=fetch}={}){
 return async function request(path,{method='GET',body,session,signal,deviceId,guestKey,headers:extra={},raw=false}={}){
  if(!path.startsWith('/')||path.startsWith('//')||path.includes('://'))throw rappiFault('Ruta de Rappi no válida.');
  const response=await fetcher(RAPPI_ORIGIN+path,{method,redirect:'error',signal:AbortSignal.any([signal||new AbortController().signal,AbortSignal.timeout(15000)]),headers:{accept:'application/json','accept-language':RAPPI_PAIS.lang,origin:RAPPI_PAIS.web,referer:RAPPI_PAIS.web+'/',vendor:'rappi','x-application-id':'lite-mobile-web/2.0.0','app-version-name':'web_8.0.0',...(deviceId?{deviceid:deviceId}:{}),...(guestKey?{'x-guest-api-key':guestKey}:{}),...(session?{authorization:'Bearer '+session.token,deviceid:session.deviceId}:{}),...(body===undefined?{}:{'content-type':'application/json'}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});
  if(raw){const t=await response.text();let j=null;try{j=JSON.parse(t);}catch{}return {status:response.status,body:j,text:t.slice(0,500)};}
  if(response.status===401||response.status===403)throw rappiFault(`Conecta tu cuenta de ${RAPPI_PAIS.nombre} para continuar.`,401);
  if(response.status===429)throw rappiFault('Rappi pide esperar. Vuelve a intentarlo más tarde.',429);
  if(!response.ok)throw rappiFault('Rappi no pudo completar la consulta. Vuelve a intentarlo.',502);
  if(response.status===204)return null;
  const reader=response.body.getReader();let size=0;const chunks=[];
  try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>6*1024*1024)throw rappiFault('La respuesta de Rappi es demasiado grande.',502);chunks.push(value);}}
  finally{await reader.cancel().catch(()=>{});}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw rappiFault('Rappi devolvió una respuesta no reconocida.',502);}
 };
}

// Same anonymous guest flow used by the current Rappi website. Never persisted
// as a personal session and never accepted by account-only cart operations.
export function createRappiGuest(request,{now=Date.now}={}){
 let cached=null,expires=0;
 return async signal=>{
  if(cached&&now()<expires)return cached;
  const deviceId=randomUUID();
  const passport=await request('/api/rocket/v2/guest/passport/',{deviceId,signal});
  if(typeof passport?.token!=='string'||!passport.token)throw rappiFault('No se pudo abrir la exploración de Rappi.',502);
  const guest=await request('/api/rocket/v2/guest',{method:'POST',body:{},deviceId,guestKey:passport.token,signal});
  if(typeof guest?.access_token!=='string'||!guest.access_token)throw rappiFault('No se pudo abrir la exploración de Rappi.',502);
  signal?.throwIfAborted();cached={token:guest.access_token,deviceId};expires=now()+Math.min(Number(guest.expires_in)||300,300)*1000;return cached;
 };
}
