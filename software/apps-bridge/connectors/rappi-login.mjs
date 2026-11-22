import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {homedir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {createRappiSession,createRappiClient,RAPPI_ORIGIN,RAPPI_PAIS} from './rappi-client.mjs';
import {perfilChrome} from './rappi-checkout.mjs';

// Only the official user-auth response of the configured country can yield a session. No credentials
// are returned to the UI, copied to the clipboard, or printed to the terminal.
// Sin 'launch' (uso real) abre el perfil de Chrome de Toki: la sesión web queda guardada para el checkout oficial.
export function createRappiLogin({sessionStore,request=createRappiClient(),launch,stateDir}={}){
 let browser=null,pending=null,state='idle',timer=null,checking=false,generation=0,captureTask=Promise.resolve();
 async function close(){clearTimeout(timer);timer=null;const current=browser;browser=null;await current?.close().catch(()=>{});}
 async function start(){
  if(pending)return {state};
  const run=++generation;state='opening';
  pending=(async()=>{
   try{
    let context;
    if(launch||!stateDir){
     const chromium=launch?null:(await import('playwright-core')).chromium;
     const opened=await (launch?launch():chromium.launch({channel:'chrome',headless:false,args:['--window-size=1050,850']}));
     if(run!==generation){await opened.close();return;}
     browser=opened;
     browser.on('disconnected',()=>{if(run===generation&&state==='waiting')state='closed';});
     context=await browser.newContext({viewport:{width:1000,height:760},locale:RAPPI_PAIS.lang});
    }else{
     const {chromium}=await import('playwright-core');
     context=await chromium.launchPersistentContext(perfilChrome(stateDir),{channel:'chrome',headless:false,locale:RAPPI_PAIS.lang,viewport:{width:1000,height:760},args:['--window-size=1050,850']});
     if(run!==generation){await context.close();return;}
     browser=context;
     context.on('close',()=>{if(run===generation&&state==='waiting')state='closed';});
    }
    context.on('response',response=>{
     let url;try{url=new URL(response.url());}catch{return;}
     if(checking||run!==generation||url.origin!==RAPPI_ORIGIN||url.pathname!=='/ms/application-user/auth'||response.status()!==200)return;
     checking=true;
     captureTask=(async()=>{try{
     const headers=await response.request().allHeaders();const auth=headers.authorization;
     if(!auth?.startsWith('Bearer ')||auth.length<20||auth.length>16400)return;
      const user=await response.json();if(!user?.id)return;
      const session={token:auth.slice(7),deviceId:headers.deviceid||randomUUID()};
      const verified=await request('/ms/application-user/auth',{session});
      if(!verified?.id||run!==generation)return;
      await sessionStore.save(session);state='connected';await close();
     }catch{if(run===generation)state='waiting';}finally{checking=false;}})();
    });
    const page=context.pages?.()[0]||await context.newPage();state='waiting';
    timer=setTimeout(()=>{if(run===generation){state='expired';void close();}},10*60*1000);timer.unref?.();
    await page.goto(RAPPI_PAIS.web+'/login',{waitUntil:'domcontentloaded',timeout:30000});
   }catch{if(run===generation){state='error';await close();}}
  })();
  await pending;pending=null;
  return {state};
 }
 return {start:async()=>{if(browser)return {state};return start();},status:()=>({state}),async close(){generation++;state='closed';await close();await captureTask;}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const stateDir=process.env.TOKI_APPS_STATE_DIR||resolve(homedir(),'Library/Application Support/Toki/apps');
 const login=createRappiLogin({sessionStore:createRappiSession(stateDir),stateDir});
 const result=await login.start();console.log(JSON.stringify({rappiLogin:result.state,message:`Inicia sesión en la ventana oficial de ${RAPPI_PAIS.nombre}. No compartas contraseña ni código por el chat.`}));
 const interval=setInterval(()=>{const {state}=login.status();if(!['opening','waiting'].includes(state)){console.log(JSON.stringify({rappiLogin:state}));clearInterval(interval);void login.close();}},1000);
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{clearInterval(interval);void login.close();});
}
