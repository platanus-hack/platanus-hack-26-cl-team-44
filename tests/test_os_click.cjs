const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const shell=fs.readFileSync('software/toki-os/os-shell.js','utf8');
const code=shell.slice(shell.indexOf('function targetLayer('),shell.indexOf('function confirmFocus('))+
  shell.slice(shell.indexOf('function handleDirectClick('),shell.indexOf("document.addEventListener('click',handleDirectClick)"));
let calls=[],flags={calib:false,alarm:false},inside=true;
const el={classList:{add(){}},dataset:{act:'go:reactions'}};
const state={rest:false,emoRingFor:null};
const context={S:state,$:selector=>selector==='#calib'||selector==='#alarm'?{classList:{contains:()=>flags[selector.slice(1)]}}:{contains:()=>inside&&(selector!=='#rest'||['wake','sos'].includes(el.dataset.act))},setFocus:()=>{},activate:(...a)=>calls.push(a)};
vm.createContext(context);vm.runInContext(code,context);
const click=()=>context.handleDirectClick({target:{closest:()=>el},preventDefault(){}});
click();assert.equal(calls.length,1);assert.equal(calls[0][1],false);assert.equal(state.blocked,el);
for(const flag of ['calib','alarm']){flags[flag]=true;click();flags[flag]=false;}
state.rest=true;click();state.rest=false;inside=false;click();assert.equal(calls.length,1);
inside=true;state.emoRingFor=0;click();assert.equal(calls.length,2);
state.rest=true;el.dataset.act='wake';click();assert.equal(calls.length,3);
el.dataset.act='sos';click();assert.equal(calls.length,4);
console.log('Direct click: visible targets accepted; wake and SOS are available in rest; no gaze calibration.');
