import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createRappiLogin} from '../../software/apps-bridge/connectors/rappi-login.mjs';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function browserFixture(){
 const context=new EventEmitter(),browser=new EventEmitter();let visits=[];
 context.newPage=async()=>({goto:async url=>visits.push(url)});
 browser.newContext=async()=>context;browser.close=async()=>browser.emit('disconnected');
 return {context,browser,visits};
}
const response=(origin='https://services.rappi.cl',user={id:123})=>({url:()=>origin+'/ms/application-user/auth',status:()=>200,request:()=>({allHeaders:async()=>({authorization:'Bearer test-only-secret-token',deviceid:'fixture-device'})}),json:async()=>user});
test('Rappi login captures only successful official Chile user auth, verifies it and never returns credentials',async()=>{
 const f=browserFixture(),saved=[];let checks=0;
 const login=createRappiLogin({launch:async()=>f.browser,sessionStore:{save:async s=>saved.push(s)},request:async path=>{assert.equal(path,'/ms/application-user/auth');checks++;return {id:123};}});
 assert.deepEqual(await login.start(),{state:'waiting'});assert.deepEqual(f.visits,['https://www.rappi.cl/login']);
 f.context.emit('response',response('https://services.rappi.cl.evil.example'));await tick();assert.equal(saved.length,0);
 f.context.emit('response',response(undefined,{}));await tick();assert.equal(saved.length,0);
 f.context.emit('response',response());await tick();assert.equal(saved.length,1);assert.equal(checks,1);
 assert.deepEqual(login.status(),{state:'connected'});assert.ok(!JSON.stringify(login.status()).includes('secret'));
 await login.close();
});
test('Disconnect during verification prevents a late session from being saved',async()=>{
 const f=browserFixture(),saved=[];let release;
 const login=createRappiLogin({launch:async()=>f.browser,sessionStore:{save:async s=>saved.push(s)},request:()=>new Promise(resolve=>release=resolve)});
 await login.start();f.context.emit('response',response());await tick();
 const closing=login.close();release({id:123});await closing;assert.deepEqual(saved,[]);
});
