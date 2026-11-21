import {randomBytes} from 'node:crypto';
const fault=(message,status=400)=>Object.assign(new Error(message),{status});
export const youtubeVideos=[
  {id:'7sxH2C-N9mY',label:'Paisajes de Chile'},
  {id:'UC031RMDdKc',label:'Tradición y cultura'}
];
export const youtubeManifest={schemaVersion:1,id:'youtube',name:'YouTube',aliases:[],version:'1.0.0',interface:{kind:'video',entry:'videos'},auth:{type:'none'},dependencies:['Internet','YouTube IFrame Player API'],source:'https://developers.google.com/youtube/iframe_api_reference',requiredEvidence:['list','play','pause'],actions:[{id:'list',mutates:false,requiresAccount:false},{id:'select',mutates:false,requiresAccount:false},{id:'observe',mutates:false,requiresAccount:false}]};
export function createYouTubeAdapter({fetcher=fetch,now=Date.now}={}){
 let cache=null,at=0;const sessions=new Map();
 async function list(signal){
  if(cache&&now()-at<300000)return cache;
  const items=await Promise.all(youtubeVideos.map(async video=>{
   try{
    const response=await fetcher('https://www.youtube.com/oembed?url='+encodeURIComponent('https://www.youtube.com/watch?v='+video.id)+'&format=json',{signal:AbortSignal.any([signal,AbortSignal.timeout(10000)]),redirect:'error'});
    if(!response.ok)return null;const data=await response.json();
    if(typeof data.title!=='string'||typeof data.author_name!=='string')return null;
    return {...video,title:data.title.slice(0,200),author:data.author_name.slice(0,120)};
   }catch{signal.throwIfAborted();return null;}
  }));
  signal.throwIfAborted();const available=items.filter(Boolean);if(!available.length)throw fault('No se pudieron cargar los videos. Comprueba Internet y reintenta.',502);
  cache=available;at=now();return cache;
 }
 return {manifest:youtubeManifest,errorMessage:()=> 'No se pudo conectar con YouTube. Vuelve a intentarlo.',
  async prepare({signal,report}){report({stage:1,connector:'youtube-iframe-api',message:'Comprobando la selección de videos…'});await list(signal);return {stage:3,status:'needs_test',message:'Videos disponibles. Falta comprobar reproducción y pausa en este navegador.'};},
  async execute(action,payload,ctx){
   if(action==='list'){const items=await list(ctx.signal);ctx.evidence('list');return {items};}
   if(action==='select'){
    const video=(await list(ctx.signal)).find(v=>v.id===payload.videoId);if(!video)throw fault('Elige un video de la lista.');
    for(const [key,s] of sessions)if(now()-s.at>3600000)sessions.delete(key);
    if(sessions.size>=100)sessions.delete(sessions.keys().next().value);
    const ticket=randomBytes(24).toString('hex');sessions.set(payload.jobId,{ticket,videoId:video.id,generation:ctx.generation,at:now(),played:false});
    return {video,ticket,generation:ctx.generation};
   }
   if(action==='observe'){
    const session=sessions.get(payload.jobId);
    if(!session||session.ticket!==payload.ticket||session.videoId!==payload.videoId||session.generation!==ctx.generation||now()-session.at>3600000)throw fault('Vuelve a elegir el video para comprobarlo.',409);
    if(payload.state!==1&&payload.state!==2)throw fault('Estado del reproductor no válido.');
    if(payload.state===1){session.played=true;ctx.evidence('play');}
    else if(session.played)ctx.evidence('pause');else throw fault('Primero comprueba la reproducción.',409);
    return {observed:payload.state,evidenceSource:'youtube-player-event'};
   }
   throw fault('Acción no disponible.',404);
  }
 };
}
