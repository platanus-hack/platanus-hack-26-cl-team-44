import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source = readFileSync(new URL('../../software/toki-os/magnetic-pointer.js', import.meta.url), 'utf8');
const api = {};
runInNewContext(source, {window:api});
const button = {};

test('dwell time starts when the pointer enters the target', () => {
  const dwell = api.createPointerDwell();
  for (let t = 0; t <= 1000; t += 10) {
    assert.equal(dwell.sample(button, t, true), t);
  }
});

test('the magnetic fringe cannot start a dwell and briefly leaving pauses the clock', () => {
  const dwell = api.createPointerDwell();
  for (let t = 0; t < 2000; t += 20) assert.equal(dwell.sample(button,t,false), -1);
  for (let t = 2000; t <= 2900; t += 20) dwell.sample(button,t,true);
  for (let t = 2920; t <= 3020; t += 20) assert.equal(dwell.sample(button,t,false), 900);
  assert.equal(dwell.sample(button,3040,true), 900);
  assert.equal(dwell.sample(button,3060,true), 920);
  assert.equal(dwell.sample(button,3300,false), -1);
  assert.equal(dwell.sample(button,3320,true), 0);
});

test('a crossing, new target or stale sample never carries over its time', () => {
  const dwell = api.createPointerDwell();
  for (let t = 0; t <= 800; t += 20) dwell.sample(button,t,true);
  assert.equal(dwell.sample({},820,true), 0);
  assert.equal(dwell.sample(null,840,false), -1);
  assert.equal(dwell.sample(button,860,true), 0);
  assert.equal(dwell.sample(button,1300,true), 0);
});

test('the magnet pulls inward while movement across a card keeps its dwell', () => {
  const card = {getBoundingClientRect:() => ({left:10,right:410,top:10,bottom:160,width:400,height:150})};
  const document = {
    elementFromPoint:(x,y) => ({closest:() => x>=10 && x<=410 && y>=10 && y<=160 ? card : null}),
    querySelectorAll:() => [card]
  };
  const window = {};
  runInNewContext(source, {window,document});
  const magnet = window.createMagneticPointer('button');
  const dwell = window.createPointerDwell();
  const approach = magnet.aim({x:0,y:85}, 0, Boolean);
  assert.ok(approach.x>0 && approach.x<10);
  assert.equal(dwell.sample(approach.target, 0, approach.inside), -1);
  for (let t=0; t<=1000; t+=20) {
    const point = {x:t%40===0 ? 30 : 385, y:85};
    const aim = magnet.aim(point, t+50, Boolean);
    assert.equal(aim.target,card);
    assert.ok(Math.abs(210-aim.x)<Math.abs(210-point.x));
    assert.equal(dwell.sample(aim.target,t+50,aim.inside),t);
  }
  const outside = magnet.aim({x:440,y:85}, 1100, Boolean);
  assert.equal(outside.target,null);
});
