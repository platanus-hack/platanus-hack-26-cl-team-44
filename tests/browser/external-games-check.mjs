import {writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const sessionDirectory=mkdtempSync(join(tmpdir(),'toki-test-'));
process.env.TOKI_BRIDGE_SESSION_DIR=sessionDirectory;
process.once('exit',()=>rmSync(sessionDirectory,{recursive:true,force:true}));
const {cdp,sessionId,shutdown}=await import('../../software/browser-bridge/start.mjs');
const deadline=setTimeout(()=>{console.error('FAIL: test timeout');process.exitCode=1;shutdown();},120000);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const run=async(expression,s=sessionId)=>{const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},s);if(r.exceptionDetails)throw Error(r.exceptionDetails.text+': '+r.exceptionDetails.exception?.description);return r.result.value;};
async function until(fn,seconds=30){const end=Date.now()+seconds*1000;while(Date.now()<end){const r=await fn();if(r)return r;await sleep(300);}throw Error('Timed out');}
try{
 await until(()=>run('!!window.TOKI_EXTERNAL'));
 console.log('Toki loaded'); await run("go('games')");await sleep(900);
 await run("activate(document.querySelector('[data-act=\"external:setup\"]'),false)");
 await until(()=>run('TOKI_EXTERNAL.connected')); console.log('Bridge connected');
 const iframeTarget=await until(async()=> (await cdp('Target.getTargets')).targetInfos.find(t=>t.type==='iframe'&&t.url.includes('eyegazegames.com')));
 console.log('Iframe target found'); const {sessionId:inner}=await cdp('Target.attachToTarget',{targetId:iframeTarget.targetId,flatten:true});
 await until(()=>run('!!document.querySelector("button[title=Spanish]")',inner));
 await run('window.bridgeEvents=[];document.addEventListener("mousemove",e=>bridgeEvents.push({type:e.type,trusted:e.isTrusted}));document.addEventListener("click",e=>bridgeEvents.push({type:e.type,trusted:e.isTrusted}));',inner);
 await run("activate(document.querySelector('[data-act=\"external:clicks\"]'),false)");
 await cdp('Page.bringToFront',{},sessionId); await sleep(800);
 const p=await run('(()=>{const r=document.querySelector("button[title=Spanish]").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()',inner);
 const outer=await run('(()=>{const r=document.querySelector("#externalGame").getBoundingClientRect();return {x:r.x,y:r.y,scale:S.scale}})()');
 await run(`NOSE.on=true;NOSE.mode='nose';NOSE.raw={dx:0,dy:0};NOSE.lastFace=performance.now();window.testTracker=setInterval(()=>NOSE.lastFace=performance.now(),25);setGaze(${outer.x+p.x*outer.scale},${outer.y+p.y*outer.scale});`);
 await sleep(3200);
 const events=await run('bridgeEvents',inner);
 if(!events.some(e=>e.type==='mousemove'&&e.trusted)||!events.some(e=>e.type==='click'&&e.trusted))throw Error('Bridge did not deliver trusted pointer and dwell click');
 await run('clearInterval(window.testTracker);NOSE.on=false;setGaze(0,0)');
 console.log('PASS: cross-origin iframe receives trusted pointer movement and dwell click from Toki.');
 await run("activate(document.querySelector('[data-act=\"external:pause\"]'),false)");
 // Continue through the real external profile setup, then load a Unity game inside Toki.
 await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0},sessionId); await run("location.href='https://www.eyegazegames.com/'",inner);await sleep(2000); await until(()=>run('!!document.querySelector("button[title=Spanish]")',inner)); await run('document.querySelector("button[title=Spanish]").click()',inner);await sleep(1000);
 await until(()=>run('document.body.innerText.includes("Crear usuario")',inner));
 await run('[...document.querySelectorAll("button")].find(b=>b.innerText.includes("Crear usuario")||b.title==="Crear usuario").click()',inner);
 await until(()=>run('document.body.innerText.includes("¡Éxito!")',inner));
 await run("activate(document.querySelector('[data-act=\"external:catalog\"]'),false)");
 await run("activate(document.querySelector('[data-act=\"external:play:1\"]'),false)");
 const golfTarget=await until(async()=> (await cdp('Target.getTargets')).targetInfos.find(t=>t.type==='iframe'&&t.url.includes('gamesource?id=gazey_golf')));
 const {sessionId:golf}=await cdp('Target.attachToTarget',{targetId:golfTarget.targetId,flatten:true});
 await until(()=>run('!!document.querySelector("canvas[tabindex]")',golf),60);
 console.log('PASS: Gazey Golf Unity canvas loaded inside Toki after real onboarding.');
 // Save evidence, then always release the browser (including on failed assertions).
 const shot=await cdp('Page.captureScreenshot',{format:'png'},sessionId);writeFileSync('/tmp/toki-external.png',Buffer.from(shot.data,'base64'));
 console.log('Screenshot: /tmp/toki-external.png');
}catch(e){process.exitCode=1;console.error('FAIL:',e.message);
 try{const shot=await cdp('Page.captureScreenshot',{format:'png'},sessionId);writeFileSync('/tmp/toki-external-fail.png',Buffer.from(shot.data,'base64'));}catch{}
}finally{clearTimeout(deadline);shutdown();}
