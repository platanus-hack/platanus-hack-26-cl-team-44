// Official YouTube SDK. No autoplay, URL entry, proxy streaming or injected player controls.
let apiPromise;
function loadAPI(){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(apiPromise)return apiPromise;
 apiPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.referrerPolicy='strict-origin-when-cross-origin';
  const previous=window.onYouTubeIframeAPIReady;
  const finish=()=>{clearTimeout(timer);window.YT?.Player?resolve(window.YT):reject(Error('YouTube no pudo iniciar el reproductor.'));};
  window.onYouTubeIframeAPIReady=()=>{previous?.();finish();};
  const timer=setTimeout(()=>{script.remove();reject(Error('YouTube tardó demasiado. Puedes reintentar o elegir otro video.'));},15000);
  script.onerror=()=>{clearTimeout(timer);script.remove();reject(Error('No se pudo conectar con YouTube. Puedes reintentar.'));};
  document.head.append(script);
 }).catch(error=>{apiPromise=null;throw error;});return apiPromise;
}
export function mountVideo(host,{videoId,onState,onMessage,onReady}){
 let player,disposed=false,ready=false,played=false,watchdog;
 const message=(text,error=false)=>{if(!disposed)onMessage(text,error);};
 const clear=()=>{clearTimeout(watchdog);watchdog=null;};
 loadAPI().then(YT=>{
  if(disposed||!host.isConnected)return;
  player=new YT.Player(host,{width:'100%',height:'100%',videoId,playerVars:{autoplay:0,playsinline:1,origin:location.origin,disablekb:1,fs:0,rel:0},events:{
   onReady:()=>{if(disposed)return;ready=true;clear();onReady();message('Listo para reproducir');},
   onStateChange:event=>{
    if(disposed)return;
    const id=player.getVideoData?.().video_id;
    if(id!==videoId)return;
    clear();
    const labels={'-1':'Listo para reproducir',0:'Video terminado',1:'Reproduciendo',2:'En pausa',3:'Cargando video…',5:'Listo para reproducir'};
    message(labels[event.data]||'Conectando…');
    if(event.data===3)watchdog=setTimeout(()=>message('La carga del video se detuvo. Reintenta o elige otro video.',true),15000);
    if(event.data===1){played=true;onState(1);}
    else if(event.data===2&&played)onState(2);
   },
   onError:event=>{clear();ready=false;onReady(false);message([101,150].includes(event.data)?'Este video no permite reproducirse aquí. Elige otro.':event.data===153?'YouTube no pudo verificar este reproductor. Reintenta desde Servicios.':'No se puede reproducir este video ahora. Elige otro o reintenta.',true);},
   onAutoplayBlocked:()=>{clear();message('El navegador bloqueó la reproducción. Pulsa Reproducir para intentarlo otra vez.',true);}
  }});
  watchdog=setTimeout(()=>{if(!ready)message('YouTube no respondió. Puedes reintentar o elegir otro video.',true);},15000);
 }).catch(error=>message(error.message,true));
 return {
  toggle(){if(!ready||disposed)return;const state=player.getPlayerState();clear();message(state===1?'Pausando…':'Iniciando video…');watchdog=setTimeout(()=>message('YouTube no confirmó la acción. Reintenta o elige otro video.',true),12000);state===1?player.pauseVideo():player.playVideo();},
  destroy(){disposed=true;clear();try{player?.destroy();}catch{}},
  get state(){return ready?player.getPlayerState():null;}
 };
}
