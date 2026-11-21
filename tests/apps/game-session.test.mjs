import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameSessions} from '../../software/apps-bridge/game-session.mjs';

const config={mode:'Nariz',game:'gazey_golf',dwellMs:3000,calibration:{n:{dx:0,dy:0},L:.1,R:.1,U:.1,D:.1}};

test('only the requested game window can claim a handoff once', async () => {
  let key;
  const sessions=createGameSessions(async (id,port)=>{key=id;assert.equal(port,8790);});
  await assert.rejects(sessions.open({...config,game:'https://example.com'},8790),{status:400});
  assert.equal(key,undefined);
  await sessions.open(config,8790);
  assert.throws(()=>sessions.take('missing'),{status:404});
  assert.deepEqual(sessions.take(key),config);
  assert.throws(()=>sessions.take(key),{status:404});
});

test('a failed launch discards the calibration and allows retry', async () => {
  let key, fail=true;
  const sessions=createGameSessions(async id=>{key=id;if(fail)throw Error('Chrome unavailable');});
  await assert.rejects(sessions.open(config,8790),{status:503});
  assert.throws(()=>sessions.take(key),{status:404});
  fail=false;
  await sessions.open(config,8790);
  assert.deepEqual(sessions.take(key),config);
});
