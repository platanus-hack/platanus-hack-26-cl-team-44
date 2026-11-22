/* A local game stream lives exactly as long as its visible surface. */
const tokiGameOwner = crypto.randomUUID();
window.createTokiGameSurface = function(image, game, onReady, onError) {
  const controller = new AbortController();
  const base = location.port === '8000' ? 'http://127.0.0.1:8790' : location.origin;
  let id, headers;
  async function start() {
    const session = await fetch(base+'/api/session',{signal:controller.signal});
    if (!session.ok) throw Error('No se pudo conectar con el servidor de Toki.');
    headers = {'Content-Type':'application/json','x-toki-token':(await session.json()).token};
    // Before the first frame the image can be only as large as its alt text.
    // Use the panel's layout size, before the lobby scales it for the screen.
    const {clientWidth:width, clientHeight:height} = image.parentElement;
    const response = await fetch(base+'/api/games/play', {method:'POST',headers,signal:controller.signal,
      body:JSON.stringify({game,owner:tokiGameOwner,width,height})});
    if (!response.ok) throw Error((await response.json()).error || 'No se pudo abrir la partida.');
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer='', ready=false;
    while (true) {
      const {done,value} = await reader.read();
      if (done) throw Error('Se interrumpió la partida. Puedes volver a intentarlo.');
      buffer+=value;
      let end;
      while ((end=buffer.indexOf('\n'))!==-1) {
        const item=JSON.parse(buffer.slice(0,end)); buffer=buffer.slice(end+1);
        if (item.error) throw Error(item.error);
        if (item.id) id=item.id;
        if (item.frame) {
          image.src='data:image/jpeg;base64,'+item.frame;
          if (!ready) { ready=true; onReady(); }
        }
      }
    }
  }
  void start().catch(error => {
    if (!controller.signal.aborted) { controller.abort(); onError(error.message); }
  });
  return {
    stop(){controller.abort();},
    async input(type,x,y) {
      if (!id || controller.signal.aborted) return;
      const response=await fetch(base+'/api/games/input',{method:'POST',headers,signal:controller.signal,
        body:JSON.stringify({id,type,x,y})});
      if (!response.ok) throw Error('El control del juego se desconectó.');
    }
  };
};
