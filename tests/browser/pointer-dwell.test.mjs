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

function menuFixture(rects) {
  const cards = rects.map(([left, top, right, bottom]) => ({
    getBoundingClientRect: () => ({ left, top, right, bottom, width: right-left, height: bottom-top }),
  }));
  const document = {
    elementFromPoint(x, y) {
      return { closest: () => cards.find(card => {
        const r = card.getBoundingClientRect();
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
      }) };
    },
    querySelectorAll: () => cards,
  };
  const window = {};
  runInNewContext(source, { window, document });
  return { cards, magnet: window.createMagneticPointer('button') };
}

const gazeBounds = { left: 0, top: 0, width: 1000, height: 800 };

test('bounded webcam gain reaches all four corner tiles without changing a direct hit', () => {
  const { cards, magnet } = menuFixture([
    [15, 15, 72, 64], [928, 15, 985, 64], [15, 736, 72, 785], [928, 736, 985, 785],
    [80, 80, 120, 120],
  ]);
  const positions = [{x:104,y:91}, {x:895,y:91}, {x:105,y:709}, {x:895,y:709}];
  for (const [i, point] of positions.entries()) {
    const eligible = card => card && card !== cards[4];
    const aim = magnet.aim(point, i*100, eligible, { gazeBounds });
    assert.equal(aim.target, i === 0 ? null : cards[i], 'a disabled surface is not stolen by a corner');
    if(i) assert.equal(aim.inside, true);
  }
  assert.equal(magnet.aim({ x: 78, y: 91 }, 410, Boolean, { gazeBounds }).target, cards[0]);
  assert.equal(magnet.aim(positions[0], 420, Boolean, { gazeBounds }).target, cards[4]);
  const disabled = magnet.aim(positions[1], 430, Boolean, { gazeBounds, magnetic: false });
  assert.equal(disabled.target, null);
  assert.equal(disabled.x, positions[1].x);
});

test('a stronger webcam magnet can preview a nearby target, not start its dwell', () => {
  const { cards, magnet } = menuFixture([[300, 300, 400, 400]]);
  const approach = magnet.aim({ x: 440, y: 350 }, 0, Boolean, { gazeBounds });
  assert.equal(approach.target, cards[0]);
  assert.equal(approach.inside, false);
  assert.equal(api.createPointerDwell().sample(approach.target, 0, approach.inside), -1);
});

test('edge gain cannot overshoot the magnetic reach of a card near a bottom corner', () => {
  const { cards, magnet } = menuFixture([[815, 420, 920, 715]]);
  const aim = magnet.aim({ x: 875, y: 726 }, 0, Boolean, { gazeBounds });
  assert.equal(aim.target, cards[0]);
  assert.equal(aim.inside, false);
  assert.ok(aim.y > 715 && aim.y < 726);
});
