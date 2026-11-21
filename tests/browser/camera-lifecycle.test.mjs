import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../../software/toki-os/prototype-motion.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('const NOSE = window.NOSE = {'),html.indexOf('/* ===================== Sesión de calibración'));
function setup(){
 let now=0, sequence=0, captures=0, detections=0, modelClosed=0;
 const frames=new Map(), events=new Map(), tracks=[];
 const video={readyState:2,currentTime:0,srcObject:null,async play(){},pause(){}};
 const dummy={textContent:'',classList:{add(){},remove(){}},getContext:()=>({clearRect(){}})};
 const model=()=>({detectForVideo(){detections++;return {faceLandmarks:[]};},close(){modelClosed++;}});
 const state={hidden:false,addEventListener:(name,fn)=>events.set(name,fn)};
 const context=vm.createContext({
  window:{},document:state,performance:{now:()=>now},console,Event,
  navigator:{mediaDevices:{async getUserMedia(){captures++;const track={stopped:false,stop(){this.stopped=true;}};tracks.push(track);return {getTracks:()=>[track]};}}},
  $:selector=>selector==='#cam'?video:dummy,OneEuro:class{},W:{S:{screen:'home',gazeLost:false}},
  GAZE:{cur:null,recent:[],model:{}},localStorage:{setItem(){}},
  island(){},log(){},clearFocus(){},setGazeLost(){},renderSettings(){},
  dispatchEvent(){},addEventListener:(name,fn)=>events.set(name,fn),
  requestAnimationFrame:fn=>{frames.set(++sequence,fn);return sequence;},cancelAnimationFrame:id=>frames.delete(id),
  clearTimeout,setTimeout,
 });
 vm.runInContext(source,context);
 const nose=context.window.NOSE;
 nose.lm=model();
 return {nose,context,video,tracks,frames,events,state,model,
  stats:()=>({captures,detections,modelClosed}),
  frame(ms,time){now=ms;video.currentTime=time;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn());},
 };
}

test('Mouse releases camera, model, animation and pending gesture even after repeated starts',async()=>{
 const h=setup();
 await Promise.all([h.nose.start(),h.nose.start(),h.nose.start()]);
 assert.equal(h.stats().captures,1);assert.equal(h.frames.size,1);
 h.nose.fc.ceja.pend=setTimeout(()=>assert.fail('gesture after stop'),20);
 await h.nose.setMode('mouse');
 assert.ok(h.tracks.every(t=>t.stopped));assert.equal(h.video.srcObject,null);
 assert.equal(h.stats().modelClosed,1);assert.equal(h.frames.size,0);assert.equal(h.nose.on,false);
 assert.equal(h.nose.fc.ceja.pend,null);
});

test('Mouse cancels a pending camera permission request and releases its late stream',async()=>{
 const h=setup();let grant;
 const track={stopped:false,stop(){this.stopped=true;}};
 h.context.navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>{grant=resolve;});
 const pending=h.nose.start();
 await h.nose.setMode('mouse');grant({getTracks:()=>[track]});await pending;
 assert.ok(track.stopped);assert.equal(h.nose.on,false);assert.equal(h.frames.size,0);
});

test('Hidden page releases capture; returning resumes only previously enabled tracking',async()=>{
 const h=setup();await h.nose.start();
 h.state.hidden=true;await h.events.get('visibilitychange')();
 assert.ok(h.tracks[0].stopped);assert.equal(h.frames.size,0);assert.equal(h.nose.on,false);
 h.nose.lm=h.model();h.state.hidden=false;await h.events.get('visibilitychange')();
 assert.equal(h.nose.on,true);assert.equal(h.stats().captures,2);
 await h.nose.setMode('mouse');
 h.state.hidden=true;await h.events.get('visibilitychange')();
 h.state.hidden=false;await h.events.get('visibilitychange')();
 assert.equal(h.nose.on,false);assert.equal(h.stats().captures,2);
});

test('Capture is limited to 24 detections per second and skips duplicate video frames',async()=>{
 const h=setup();await h.nose.start();
 for(let i=1;i<=240;i++)h.frame(i*1000/240,i/240);
 assert.ok(h.stats().detections<=25); // Includes the initial frame at t=0.
 assert.ok(h.stats().detections>=20);
 const before=h.stats().detections;
 for(let i=1;i<=60;i++)h.frame(1000+i*1000/60,1);
 assert.ok(h.stats().detections<=before+1);
 h.events.get('pagehide')();assert.ok(h.tracks[0].stopped);assert.equal(h.frames.size,0);
});

test('Model startup failure also releases the camera',async()=>{
 const h=setup();h.nose.lm=null;
 // Dynamic import is deliberately unavailable in this isolated test context.
 h.context.console={warn(){}};
 await h.nose.start();
 assert.equal(h.nose.on,false);assert.ok(h.tracks[0].stopped);assert.equal(h.video.srcObject,null);
});
