import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const directory=mkdtempSync(join(tmpdir(),'toki-session-test-'));
process.env.TOKI_BRIDGE_SESSION_DIR=directory;
process.once('exit',()=>rmSync(directory,{recursive:true,force:true}));
const bridge=await import('../../software/browser-bridge/start.mjs');
try{
 let loaded=false;
 for(let attempt=0;attempt<50;attempt++){
  const result=await bridge.cdp('Runtime.evaluate',{expression:'Boolean(window.TOKI_EXTERNAL && window.NOSE)',returnByValue:true},bridge.sessionId);
  if(result.result.value){loaded=true;break;}
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 assert.ok(loaded,'Toki scripts did not load');
 const camera=await bridge.cdp('Runtime.evaluate',{expression:'({on:NOSE.on,stream:Boolean(NOSE.stream)})',returnByValue:true},bridge.sessionId);
 assert.deepEqual(camera.result.value,{on:false,stream:false});
 console.log('PASS: Toki loads successfully with the physical camera off.');
 const {stdout}=await promisify(execFile)(process.execPath,[fileURLToPath(new URL('../../software/browser-bridge/start.mjs',import.meta.url))],{timeout:20000});
 assert.match(stdout,/Reutilizando/);
 const targets=(await bridge.cdp('Target.getTargets')).targetInfos.filter(t=>t.type==='page');
 assert.equal(targets.length,1);assert.equal(targets[0].targetId,bridge.targetId);
 console.log('PASS: repeated launch reuses one Toki tab; no duplicate window or blank tab.');
 // Closing the only Toki tab must terminate the launcher and its owned Chrome.
 const deadline=setTimeout(()=>{console.error('FAIL: launcher survived closing its Toki tab');process.exitCode=1;bridge.shutdown();},5000);
 process.once('exit',()=>clearTimeout(deadline));
 await bridge.cdp('Target.closeTarget',{targetId:bridge.targetId});
 console.log('Closing Toki tab; verifying automatic process exit.');
}catch(e){console.error(e);process.exitCode=1;bridge.shutdown();}
