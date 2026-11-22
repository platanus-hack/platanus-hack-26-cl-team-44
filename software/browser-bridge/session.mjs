import net from 'node:net';
import {mkdirSync, chmodSync, unlinkSync} from 'node:fs';
import {join} from 'node:path';

// The socket is also the lock: two launchers cannot own it at the same time.
export async function claimSession(directory, activate) {
 mkdirSync(directory,{recursive:true,mode:0o700});
 const path=join(directory,'session.sock');
 const server=net.createServer(socket=>{
  socket.on('error',()=>{});
  socket.setTimeout(15000,()=>socket.destroy());
  let line = '';
  socket.setEncoding('utf8');
  socket.on('data',async part=>{
   line += part;
   if(line.length>9){socket.destroy();return;}
   if(!line.endsWith('\n')) return;
   socket.removeAllListeners('data');
   if(line!=='activate\n'){socket.destroy();return;}
   try{await activate();socket.end('ok\n');}
   catch{socket.end('error\n');}
  });
 });
 for(let attempt=0;attempt<3;attempt++){
  try{
   await new Promise((resolve,reject)=>{
    const error=e=>{server.off('listening',listening);reject(e);};
    const listening=()=>{server.off('error',error);resolve();};
    server.once('error',error);server.once('listening',listening);server.listen(path);
   });
   chmodSync(path,0o600);
   return server;
  }catch(e){
   if(e.code!=='EADDRINUSE')throw e;
   try{
    await new Promise((resolve,reject)=>{
     const client=net.createConnection(path);
     let reply='';
     client.setTimeout(15000,()=>client.destroy(Error('La sesión Myo no responde')));
     client.once('connect',()=>client.write('activate\n'));
     client.on('data',data=>reply+=data);
     client.once('error',reject);
     client.once('end',()=>reply==='ok\n'?resolve():reject(Error('No se pudo activar la sesión Myo existente')));
    });
    return null;
   }catch(e){
    // Only remove a socket with no listener; never replace a slow live session.
    if(!['ECONNREFUSED','ENOENT'].includes(e.code))throw e;
    try{unlinkSync(path);}catch(e){if(e.code!=='ENOENT')throw e;}
   }
  }
 }
 throw Error('No se pudo reservar la sesión Myo');
}
