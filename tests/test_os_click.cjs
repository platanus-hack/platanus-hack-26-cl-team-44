const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const html=fs.readFileSync('software/toki-os/woki-os.html','utf8');
const code=html.slice(html.indexOf('function handleDirectClick('),html.indexOf("document.addEventListener('click',handleDirectClick)"));
let calls=[],flags={calib:false,alarm:false},inside=true;
const el={classList:{add(){}},dataset:{act:'go:reactions'}};
const state={rest:false,emoRingFor:null};
const context={S:state,$:selector=>selector==='#calib'||selector==='#alarm'?{classList:{contains:()=>flags[selector.slice(1)]}}:{contains:()=>inside},setFocus:()=>{},activate:(...a)=>calls.push(a)};
vm.createContext(context);vm.runInContext(code,context);
const click=()=>context.handleDirectClick({target:{closest:()=>el},preventDefault(){}});
click();assert.equal(calls.length,1);assert.equal(calls[0][1],false);assert.equal(state.blocked,el);
for(const flag of ['calib','alarm']){flags[flag]=true;click();flags[flag]=false;}
state.rest=true;click();state.rest=false;inside=false;click();assert.equal(calls.length,1);
inside=true;state.emoRingFor=0;click();assert.equal(calls.length,2);
console.log('Direct click: visible targets accepted; overlays/rest/hidden layers blocked; no gaze calibration.');
