const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync('software/toki-os/woki-os.html','utf8');
const gestures = html.slice(html.indexOf('const G={'), html.indexOf('function targetLayer('));

function setup(){
  let now=0, id=0, calib=false;
  const timers=new Map(), actions=[];
  const S={focus:{},quick:null,alarm:null};
  const document={visibilityState:'visible'};
  const app=vm.createContext({
    S, document, CFG:{doubleMs:500,tapMs:900,holdMs:3000},
    $:()=>({classList:{contains:()=>calib},firstElementChild:{},lastElementChild:{}}), $$:()=>[],
    flashPill(){}, confirmFocus(){ actions.push('confirm'); }, goBack(){ actions.push('back'); },
    startAlarm(){ actions.push('sos'); S.alarm={level:'emergencia'}; },
    openQuick(origin){ actions.push('open'); S.quick={opener:origin}; },
    unlockQuick(){ actions.push('unlock'); S.quick.opener=null; },
    closeQuick(){ actions.push('close'); S.quick=null; },
    setTimeout(fn,ms){ timers.set(++id,{fn,at:now+ms}); return id; },
    clearTimeout(key){ timers.delete(key); },
  });
  vm.runInContext(gestures,app);
  return {app,S,document,actions,calibrate(){ calib=true; }, advance(ms){
    const end=now+ms;
    for(;;){
      const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];
      if(!next || next[1].at>end) break;
      timers.delete(next[0]); now=next[1].at; next[1].fn();
    }
    now=end;
  }};
}

test('short brow confirms once, double goes back without selecting, and focus changes cancel selection', ()=>{
  const {app,S,actions,advance}=setup();
  app.pressSrc('ceja','keyboard',0);
  app.releaseSrc('ceja','keyboard',200);
  advance(499); assert.deepEqual(actions,[]);
  advance(1); assert.deepEqual(actions,['confirm']);
  app.pressSrc('ceja','keyboard',900);
  app.releaseSrc('ceja','keyboard',1000);
  app.pressSrc('ceja','keyboard',1400);
  advance(600); assert.deepEqual(actions,['confirm']);
  app.releaseSrc('ceja','keyboard',1650);
  assert.deepEqual(actions,['confirm','back']);
  app.pressSrc('ceja','keyboard',1800);
  app.releaseSrc('ceja','keyboard',1900);
  S.focus={};
  advance(500); assert.deepEqual(actions,['confirm','back']);
});

test('jaw opens after 3 s, only arms on release and cannot trigger SOS', ()=>{
  const {app,actions}=setup();
  app.pressSrc('mandibula','keyboard',0);
  app.updateHold('mandibula','keyboard',2999);
  assert.deepEqual(actions,[]);
  app.updateHold('mandibula','keyboard',3000);
  app.updateHold('mandibula','keyboard',4000);
  assert.deepEqual(actions,['open']);
  app.releaseSrc('mandibula','keyboard',4500);
  assert.deepEqual(actions,['open','unlock']);
  app.pressSrc('ceja','keyboard',5000);
  app.updateHold('ceja','keyboard',8000);
  app.releaseSrc('ceja','keyboard',8100);
  assert.deepEqual(actions,['open','unlock','sos']);
});

test('a 3 s brow takes priority; early release, missing samples, and calibration never send SOS', ()=>{
  const {app,actions,advance,calibrate}=setup();
  app.pressSrc('ceja','keyboard',0);
  app.releaseSrc('ceja','keyboard',2900);
  advance(5000);
  assert.deepEqual(actions,[]);
  app.receiveMyoWare(null,'alive');
  app.receiveMyoWare('ceja','down',5000);
  advance(3000);
  app.receiveMyoWare('ceja','hold',8000);
  assert.deepEqual(actions,[]);
  app.pressSrc('mandibula','keyboard',9000);
  app.pressSrc('ceja','keyboard',9100);
  app.updateHold('mandibula','keyboard',12000);
  assert.deepEqual(actions,[]);
  app.updateHold('ceja','keyboard',12100);
  assert.deepEqual(actions,['sos']);
  const blocked=setup(); blocked.calibrate(); blocked.app.pressSrc('ceja','keyboard',0);
  blocked.app.updateHold('ceja','keyboard',3000);
  assert.deepEqual(blocked.actions,[]);
});

test('connection watchdog cancels both a waiting tap and a wheel waiting for jaw release', ()=>{
  const {app,actions,advance}=setup();
  app.receiveMyoWare('ceja','down',0);
  app.receiveMyoWare('ceja','up',100);
  app.receiveMyoWare(null,'alive');
  advance(500);
  assert.deepEqual(actions,[]);
  app.receiveMyoWare('mandibula','down',1000);
  app.receiveMyoWare('mandibula','hold',3999);
  app.receiveMyoWare('mandibula','break',4000);
  app.receiveMyoWare('mandibula','hold',4040);
  app.receiveMyoWare('mandibula','hold',7039);
  assert.deepEqual(actions,[]);
  app.receiveMyoWare('mandibula','hold',7040);
  app.receiveMyoWare(null,'alive');
  advance(250);
  assert.deepEqual(actions,['open','close']);
});

test('paired ENV samples at 20 Hz route jaw cross-talk to the wheel, then independent brow to SOS', async ()=>{
  const source=readFileSync('software/toki-os/myoware-click.js');
  const {createGestureDetector}=await import(`data:text/javascript;base64,${source.toString('base64')}`);
  const {app,actions,advance}=setup();
  const profile={jaw:{direction:1,trigger:120,release:105},brow:{direction:-1,trigger:508,release:511}};
  const detect=createGestureDetector(profile,(name,edge,time)=>{
    app.receiveMyoWare(name==='jaw'?'mandibula':'ceja',edge,time);
  });
  let time=0;
  function feed(count,a0=100,a3=512){
    for(let i=0;i<count;i++){
      advance(50); time+=50;
      detect(time,a0,a3); app.receiveMyoWare(null,'alive');
    }
  }
  feed(12);
  feed(60,140,504);
  assert.deepEqual(actions,[],'debounced elapsed time has not reached 3 s yet');
  feed(12,140,504);
  assert.deepEqual(actions,['open'],'jaw activates A3 too, but it must never turn into SOS');
  feed(10);
  assert.deepEqual(actions,['open','unlock']);
  feed(72,100,504);
  assert.deepEqual(actions,['open','unlock','sos']);
});
