import assert from 'node:assert/strict';
import {Game, DEFS, WAVES, waveIntel} from './dist/engine.js';
import {createMarkupWriter, DragGesture} from './dist/interaction.js';
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('PASS ' + name); }

test('Repeated UI ticks preserve card identity after HTML normalization', () => {
  let writes = 0, markup = '', identity;
  const element = {
    get innerHTML() { return markup; },
    set innerHTML(value) { writes++; identity = {}; markup = value.replace('disabled ', 'disabled="" ').replace('  title', ' title'); }
  };
  const html = createMarkupWriter();
  html(element, '<button disabled  title="Recruit">Recruit</button>');
  const pressedCard = identity;
  for (let i=0;i<60;i++) html(element, '<button disabled  title="Recruit">Recruit</button>');
  assert.equal(writes, 1);
  assert.equal(identity, pressedCard);
  html(element, '<button title="Recruit">Recruit</button>');
  assert.equal(writes, 2);
});
test('Drag threshold, foreign pointers, release without move, and cancellation', () => {
  const drag = new DragGesture();
  drag.begin(4, 10, 10, 'u1', 'world');
  assert.equal(drag.begin(9, 1, 1, 'u2', 'world'), false);
  assert.equal(drag.move(9, 300, 300), null);
  assert.equal(drag.move(4, 14, 14).dragging, false);
  assert.equal(drag.end(9, 100, 100), null);
  assert.equal(drag.end(4, 100, 100).dragging, true);
  assert.equal(drag.current, null);
  drag.begin(8, 0, 0, 'u2', 'bench');
  drag.cancel();
  assert.equal(drag.end(8, 40, 40), null);
});
test('Preview does not mutate, deployed swaps work at capacity, invalid drops keep positions', () => {
  const g = new Game(4,{legacy:true}), [a,b] = g.deployed();
  g.state.level = 2;
  const before = g.serialize();
  assert.equal(g.placement(a.id, b.slot.x, b.slot.z).otherId, b.id);
  assert.equal(g.serialize(), before);
  assert.equal(g.deploy(a.id, 0, 0).ok, false);
  assert.equal(g.deploy(a.id, NaN, 0).ok, false);
  assert.equal(g.serialize(), before);
  const originalA = {...a.slot}, originalB = {...b.slot};
  g.deploy(a.id, b.slot.x, b.slot.z);
  assert.deepEqual(a.slot, originalB);
  assert.deepEqual(b.slot, originalA);
  assert.equal(g.state.gold, 32);
});
test('Bench swaps at full population and full bench recall are atomic', () => {
  const g = new Game(4,{legacy:true});
  g.state.level = 2;
  for(let i=0;i<8;i++) g.state.units.push(g.makeUnit('warden'));
  const bench = g.state.units[2], deployed = g.deployed()[0], slot = {...deployed.slot};
  assert.equal(g.recall(deployed.id).ok, false);
  assert.deepEqual(deployed.slot, slot);
  assert.equal(g.deploy(bench.id, 6.4, 6.4).ok, false);
  assert.equal(g.deploy(bench.id, slot.x, slot.z).ok, true);
  assert.equal(deployed.slot, null);
  assert.equal(g.state.units.filter(u=>!u.slot).length, 8);
});
test('Night rejects placement previews, moves, recalls and shop locking', () => {
  const g = new Game(2,{legacy:true});
  g.startNight();
  const before = JSON.stringify(g.state.units);
  assert.equal(g.placement('u1', 6.4, 0).ok, false);
  assert.equal(g.deploy('u1', 6.4, 0).ok, false);
  assert.equal(g.recall('u1').ok, false);
  assert.equal(g.toggleShopLock().ok, false);
  assert.equal(JSON.stringify(g.state.units), before);
});
test('Shop lock persists across dawn and saved games without reviving sold cards', () => {
  const g = new Game(8,{legacy:true});
  g.buy(0);g.toggleShopLock();
  const shop = [...g.state.shop];
  const restored = Game.restore(g.serialize());
  assert.equal(restored.state.shopLocked, true);
  restored.startNight();restored.dawn();restored.choosePerk(restored.state.reward[0]);
  assert.deepEqual(restored.state.shop, shop);
  restored.toggleShopLock();restored.startNight();restored.dawn();restored.choosePerk(restored.state.reward[0]);
  assert.ok(restored.state.shop.every(key=>DEFS[key]));
});
test('v1.1 saves gain defaults while preserving army, economy and progression', () => {
  const g = new Game(2,{legacy:true});g.buy(0);
  const old = JSON.parse(g.serialize());
  delete old.state.shopLocked;delete old.state.report;delete old.state.lastReport;
  const r = Game.restore(JSON.stringify(old));
  assert.equal(r.state.shopLocked, false);
  assert.equal(r.state.lastReport, null);
  assert.equal(r.state.gold, 30);
  assert.deepEqual(r.state.units, g.state.units);
});
test('Wave composition agrees with spawned enemies for all six nights', () => {
  for(let round=1;round<=6;round++) {
    const g = new Game(3,{legacy:true});g.state.round=round;
    for(let i=0;i<WAVES[round-1].count;i++)g.spawn();
    const actual={boss:0,ranged:0,armored:0,fast:0,regular:0};
    for(const e of g.state.enemies) actual[e.boss?'boss':e.armored?'armored':e.ranged?'ranged':e.speed===2.7?'fast':'regular']++;
    assert.deepEqual(actual, waveIntel(round));
  }
});
test('Damage report excludes overkill, duplicate deaths, friendly damage and healing', () => {
  const g = new Game(3,{legacy:true});g.startNight();
  const enemy={id:'enemy-test',kind:'enemy',hp:10},unit=g.deployed()[0];
  g.damage(enemy, 500, unit);g.damage(enemy, 50, unit);
  assert.equal(g.state.report.damage[unit.id].amount, 10);
  g.damage(g.state.castle, 15);assert.equal(g.state.report.castleDamage, 15);
  g.damage(unit, 999);g.damage(unit, 999);
  assert.deepEqual(g.state.report.fallen, [unit.id]);
  assert.equal(Object.keys(g.state.report.damage).length, 1);
  g.damage(g.state.castle, -20);assert.equal(g.state.report.castleDamage, 15);
  g.finishReport();g.state.report.damage[unit.id].amount=100;
  assert.equal(g.state.lastReport.damage[unit.id].amount, 10);
});
test('Nova contributes actual damage; a new night resets current report only', () => {
  const g=new Game(4,{legacy:true});g.startNight();
  g.state.enemies=[{id:'near',kind:'enemy',hp:25,x:3,z:3},{id:'far',kind:'enemy',hp:100,x:20,z:20}];
  g.nova();assert.equal(g.state.report.damage.hero.amount,25);
  g.dawn();const report=g.state.lastReport;
  assert.deepEqual(report.income,{base:12,interest:3,farm:0});
  g.choosePerk(g.state.reward[0]);g.startNight();
  assert.deepEqual(g.state.report.damage,{});
  assert.equal(g.state.lastReport,report);
});
console.log(`${checks} interaction and tactics checks passed.`);
