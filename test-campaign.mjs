import assert from 'node:assert/strict';
import {Game,DEFS} from './dist/engine.js';
import {BIOMES,CHAPTERS,GEAR,DAY_EVENTS,BRANCHES,TERRAIN} from './dist/content.js';
let checks=0;
const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
const equal=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const foe=(x=0,z=0)=>({id:'e999',kind:'enemy',x,z,hp:1000,maxHp:1000,damage:10,range:1,speed:0,cd:99,stun:0});

test('New campaigns have eight nights and distinct biome rules',()=>{
  for(const [biome,d]of Object.entries(BIOMES)){const g=new Game(3,{biome});assert.equal(g.totalNights(),8);assert.equal(g.state.castle.maxHp,d.castle);assert.equal(g.income().base,12+d.income);assert.equal(g.state.essence,3);assert.ok(g.state.dayEvent);}
  const g=new Game(3,{difficulty:'veteran'});g.spawn();const basic=new Game(3);basic.spawn();equal(g.state.enemies[0].hp,basic.state.enemies[0].hp*1.25);equal(g.state.enemies[0].damage,basic.state.enemies[0].damage*1.2);
});
test('Twelve units provide three distinct units in each faction',()=>{assert.equal(Object.keys(DEFS).length,12);for(const faction of ['ember','grove','storm','iron'])assert.equal(Object.values(DEFS).filter(d=>d.faction===faction).length,3);});
test('Eight wave forecasts agree with actual spawned archetypes',()=>{
  const found=new Set();for(let round=1;round<=8;round++){const g=new Game(1);g.state.round=round;const count=g.wave().count;for(let i=0;i<count;i++)g.spawn();const actual={};for(const e of g.state.enemies){actual[e.archetype]=(actual[e.archetype]||0)+1;found.add(e.archetype);}assert.deepEqual(actual,g.intel());assert.equal(g.state.enemies.filter(e=>e.boss).length,[4,8].includes(round)?1:0);}for(const type of ['siege','healer','assassin','boss','fast','armored','ranged'])assert.ok(found.has(type));
});
test('Shop odds total 100 and measured tier frequencies follow disclosure',()=>{
  const g=new Game(44);g.state.round=2;g.state.level=6;const counts=[0,0,0];for(let i=0;i<2000;i++){g.rollShop(true);for(const key of g.state.shop)counts[DEFS[key].cost<=3?0:DEFS[key].cost===4?1:2]++;}assert.equal(g.shopOdds().reduce((a,b)=>a+b,0),100);for(let i=0;i<3;i++)assert.ok(Math.abs(counts[i]/100-g.shopOdds()[i])<2);
});
test('Forge and equipment replacement conserve inventory and enforce costs',()=>{
  const g=new Game(2),u=g.state.units[0];assert.ok(g.forge('plate').ok);assert.equal(g.state.essence,0);assert.equal(g.forge('edge').ok,false);assert.equal(g.equip(u.id,99).ok,false);assert.ok(g.equip(u.id,0).ok);assert.equal(u.gear,'plate');g.state.essence=3;g.forge('edge');g.equip(u.id,0);assert.deepEqual(g.state.inventory,['plate']);assert.equal(u.gear,'edge');g.unequip(u.id);assert.deepEqual(g.state.inventory,['plate','edge']);
});
test('Merge and sale return every consumed equipment item',()=>{
  const g=new Game(2);g.state.units=[];for(const gear of ['plate','edge','echo']){const u=g.makeUnit('sentinel');u.gear=gear;g.state.units.push(u);}g.merge();assert.equal(g.state.units.length,1);assert.equal(g.state.units[0].gear,'plate');assert.deepEqual(g.state.inventory,['edge','echo']);g.sell(g.state.units[0].id);assert.deepEqual(g.state.inventory,['edge','echo','plate']);
});
test('Equipment changes effective health, range, damage, and armor',()=>{
  const g=new Game(3),u=g.state.units[0],base=g.unitStats(u);u.gear='plate';equal(g.unitStats(u).hp,base.hp*1.35);g.startNight();const hp=u.hp;g.hurtAlly(u,100);equal(hp-u.hp,88);u.gear='edge';equal(g.unitStats(u).damage,base.damage*1.25);u.gear='lens';equal(g.unitStats(u).range,base.range+2);
});
test('Lifesteal uses actual damage and cannot heal dead units',()=>{
  const g=new Game(3),u=g.state.units[0];g.startNight();u.gear='leech';u.hp=100;const e=foe();e.hp=10;g.damage(e,999,u);equal(u.hp,101.8);u.hp=0;g.heal(u,100,u);assert.equal(u.hp,0);assert.equal(g.state.report.damage[u.id].amount,10);
});
test('All campaign economic actions reject nighttime atomically',()=>{
  const g=new Game(3);g.build(0,'tower');g.startNight();const state=JSON.stringify(g.state);for(const result of [g.forge('edge'),g.equip('u1',0),g.unequip('u1'),g.specialize('fury'),g.branch(0,'frost'),g.repairBuilding(0),g.resolveEvent('mend'),g.setStance('u1','hunt'),g.saveFormation(),g.restoreFormation()])assert.equal(result.ok,false);assert.equal(JSON.stringify(g.state),state);
});
test('Core specialization unlocks on day two and cannot be purchased twice',()=>{
  const g=new Game(1);assert.equal(g.specialize('network').ok,false);g.state.round=2;assert.ok(g.specialize('network').ok);assert.equal(g.state.core.radius,11);assert.equal(g.specialize('fury').ok,false);assert.equal(g.state.core.radius,11);g.build(5,'tower');assert.ok(g.buildingStats(g.state.buildings[0]).interval<1.1);
});
test('Branches require level two, matching building, and enough gold',()=>{
  const g=new Game(1);g.state.gold=100;g.build(0,'tower');assert.equal(g.branch(0,'frost').ok,false);g.upgrade(0);assert.equal(g.branch(0,'market').ok,false);const base=g.buildingStats(g.state.buildings[0]);assert.ok(g.branch(0,'ballista').ok);const after=g.buildingStats(g.state.buildings[0]);equal(after.damage,base.damage*1.65);equal(after.range,base.range+3);assert.equal(g.branch(0,'frost').ok,false);
});
test('Market adds income only while the farm survives',()=>{
  const g=new Game(1);g.state.gold=100;g.build(0,'farm');g.upgrade(0);g.branch(0,'market');assert.equal(g.income().farm,11);g.state.buildings[0].hp=0;assert.equal(g.income().farm,0);
});
test('Day events apply once, reject unaffordable choices and persist',()=>{
  const g=new Game(1);g.state.dayEvent={id:'caravan',resolved:false,choice:null};g.state.gold=5;assert.equal(g.resolveEvent('trade').ok,false);assert.equal(g.state.dayEvent.resolved,false);assert.ok(g.resolveEvent('escort').ok);assert.equal(g.state.gold,10);assert.equal(g.state.dayBuff.risk,1.12);const after=g.serialize();assert.equal(g.resolveEvent('escort').ok,false);assert.equal(g.serialize(),after);const restored=Game.restore(after);assert.equal(restored.state.dayEvent.choice,'escort');
});
test('Dawn awards essence, clears one-night effects and creates next event',()=>{
  const g=new Game(1);g.state.dayBuff={risk:1.12,damage:1.12};g.startNight();g.dawn();assert.equal(g.state.essence,5);g.choosePerk(g.state.reward[0]);assert.deepEqual(g.state.dayBuff,{});assert.equal(g.state.dayEvent.resolved,false);g.state.round=4;g.startNight();g.dawn();assert.equal(g.state.essence,8);
});
test('Save preserves new systems and rejects invalid placements and equipment',()=>{
  const g=new Game(73,{biome:'frost',difficulty:'veteran'});g.forge('plate');g.equip('u1',0);g.setStance('u1','hunt');g.saveFormation();g.state.round=2;g.specialize('sanctuary');const raw=g.serialize(),restored=Game.restore(raw);assert.deepEqual(restored.state,g.state);for(const change of [d=>d.state.units[0].slot.x=NaN,d=>d.state.inventory=['invalid'],d=>d.state.gold=-1,d=>d.state.units[1].id='u1',d=>d.state.level=99,d=>d.state.biome='bad']){const data=JSON.parse(raw);change(data);assert.equal(Game.restore(JSON.stringify(data)),null);}
});
test('Genuine version-one saves migrate to the classic six-night campaign',()=>{
  const g=new Game(3,{legacy:true}),data=JSON.parse(g.serialize());data.version=1;for(const key of ['legacy','biome','difficulty','essence','inventory','dayEvent','dayBuff','eventHistory','hazards','formation'])delete data.state[key];for(const u of data.state.units){delete u.stance;delete u.gear;delete u.attacks;}const restored=Game.restore(JSON.stringify(data));assert.ok(restored);assert.equal(restored.totalNights(),6);assert.equal(restored.state.units[0].stance,'guard');assert.equal(restored.state.gold,32);restored.startNight();restored.update(.1);
});
test('Formation restore preserves exact slots and tolerates a merged or sold ID',()=>{
  const g=new Game(1);g.saveFormation();const before=g.deployed().map(u=>({...u.slot}));g.deploy('u1',6.4,6.4);g.recall('u2');assert.ok(g.restoreFormation().ok);assert.deepEqual(g.deployed().map(u=>u.slot),before);g.sell('u1');assert.ok(g.restoreFormation().ok);assert.equal(g.deployed().length,1);
});
test('High ground provides a real effective range bonus',()=>{const g=new Game(1),u=g.state.units[1],base=g.unitStats(u).range;g.deploy(u.id,TERRAIN[0].x,TERRAIN[0].z);equal(g.unitStats(u).range,base+1.5);});
test('Guard stays near the assigned slot while hunt intercepts distant enemies',()=>{
  function simulate(stance){const g=new Game(1);g.state.units=[g.state.units[0]];g.setStance('u1',stance);g.startNight();g.state.spawnTimer=100;g.state.hero.x=19;g.state.hero.z=13;const e=foe(17,0);g.state.enemies=[e];for(let i=0;i<40;i++){g.update(.1);g.events=[];}return g.state.units[0];}const guard=simulate('guard'),hunt=simulate('hunt');assert.ok(Math.hypot(guard.x-guard.slot.x,guard.z-guard.slot.z)<3.6);assert.ok(hunt.x>guard.x+5);
});
test('Boss warnings delay damage, cancel on nova and expire after source death',()=>{
  const g=new Game(1);g.state.round=4;g.startNight();g.state.spawnTimer=100;const e={...foe(2.5,3.5),boss:true,abilityCd:99};g.state.enemies=[e];const hp=g.state.hero.hp;g.addHazard(e,g.state.hero);g.updateHazards(1);assert.equal(g.state.hero.hp,hp);g.nova();assert.equal(g.state.hazards.length,0);g.addHazard(e,g.state.hero);g.updateHazards(2.3);assert.ok(g.state.hero.hp<hp);g.addHazard(e,g.state.hero);e.hp=0;const after=g.state.hero.hp;g.updateHazards(3);assert.equal(g.state.hero.hp,after);assert.equal(g.state.hazards.length,0);
});
test('Siege targets buildings while assassins pursue ranged troops',()=>{
  const g=new Game(1);g.build(0,'tower');g.startNight();g.state.spawnTimer=100;const b=g.state.buildings[0],e={...foe(b.x+4,b.z),siege:true,range:11,cd:0};g.state.enemies=[e];const hp=b.hp;g.update(.1);assert.equal(b.hp,hp-10);
  const h=new Game(1);h.startNight();h.state.spawnTimer=100;h.state.hero.hp=0;h.state.hero.respawn=99;const archer=h.state.units[1],a={...foe(archer.x+4,archer.z),assassin:true,speed:2.6};h.state.enemies=[a];const old=Math.hypot(a.x-archer.x,a.z-archer.z);h.update(.1);assert.ok(Math.hypot(a.x-archer.x,a.z-archer.z)<old);
});
test('New caster attacks burn and thorn arrows slow surviving enemies',()=>{
  for(const key of ['pyromancer','thorn']){const g=new Game(1);g.state.units=[g.makeUnit(key,{x:3.2,z:3.2})];g.startNight();g.state.spawnTimer=100;g.state.units[0].cd=0;g.state.enemies=[foe(5,3.2)];g.update(.1);assert.ok(key==='thorn'?g.state.enemies[0].slow>0:g.state.enemies[0].burn>0);}
});

const slots=[[-6.4,0],[-3.2,3.2],[-6.4,-3.2],[3.2,3.2],[3.2,-3.2],[6.4,0],[0,-6.4],[0,6.4]];
function field(g){for(const u of g.state.units.filter(u=>!u.slot)){if(g.deployed().length>=g.state.level)break;const p=slots.find(([x,z])=>!g.deployed().some(v=>Math.hypot(v.slot.x-x,v.slot.z-z)<.2));if(p)g.deploy(u.id,...p);}}
function campaign(seed,biome){
  const g=new Game(seed,{biome}),results=[];g.buy(0);g.buy(1);g.buy(2);g.buy(4);g.levelUp();field(g);g.build(3,'farm');
  for(let round=1;round<=8;round++){
    const event=DAY_EVENTS.find(e=>e.id===g.state.dayEvent.id);const choice=event.choices.find(c=>c.id==='spark'||c.id==='salvage'||c.id==='sell'||c.id==='pass')||event.choices[0];g.resolveEvent(choice.id);
    if(round>1){if(round===2)g.specialize('sanctuary');while(g.state.castle.hp<600&&g.state.gold>=10)g.repair();if(g.state.level<7&&g.state.gold>g.levelCost()+10)g.levelUp();
      for(let attempt=0;attempt<6;attempt++){for(let i=0;i<5;i++){const key=g.state.shop[i];if(!key)continue;const have=g.state.units.filter(u=>u.def===key);if(g.state.gold>=DEFS[key].cost+3&&(have.some(u=>u.star===1)||(g.deployed().length<g.state.level&&!have.length))){g.buy(i);field(g);}}if(g.state.gold>13&&g.state.units.some(u=>u.star===1))g.rollShop();else break;}
      for(const socket of [0,1,4]){let b=g.state.buildings.find(b=>b.socket===socket&&b.hp>0);if(!b&&g.state.gold>=13)g.build(socket,'tower');else if(b?.level===1&&g.state.gold>=14)g.upgrade(socket);else if(b&&!b.branch&&g.state.gold>=14)g.branch(socket,'frost');}
    }
    for(const u of [...g.deployed()].sort((a,b)=>b.star-a.star)){if(!u.gear&&g.state.essence>=3){const gear=DEFS[u.def].role==='guardian'?'plate':'edge';g.forge(gear);g.equip(u.id,g.state.inventory.length-1);}}
    g.startNight();let steps=0;while(g.state.phase==='night'&&steps++<6000){const foe=g.state.enemies.find(e=>e.boss)||g.state.enemies.find(e=>e.siege)||g.state.enemies[0];let input={x:0,z:0};if(foe&&g.state.nightTime>65){const h=g.state.hero,dx=foe.x-h.x,dz=foe.z-h.z,dist=Math.hypot(dx,dz);if(dist>4)input={x:dx/dist,z:dz/dist};}if(g.state.hero.skill===0)g.nova();g.update(.1,input);g.events=[];}assert.ok(steps<6000,'Night must terminate');assert.ok(g.state.gold>=0);for(const unit of g.state.units)assert.ok(Number.isFinite(unit.hp)&&Number.isFinite(unit.x));results.push({night:round,seconds:Math.round(steps/10),hp:Math.round(g.state.castle.hp),phase:g.state.phase});
    if(g.state.phase!=='reward')break;g.choosePerk(g.state.reward.includes('stone')&&g.state.castle.hp<550?'stone':g.state.reward.includes('flame')?'flame':g.state.reward.includes('wealth')?'wealth':g.state.reward[0]);
  }
  return {g,results};
}
for(const [seed,biome]of [[19,'meadow'],[73,'frost'],[2026,'ruins']])test(`Legal eight-night campaign on ${biome}, seed ${seed}`,()=>{const {g,results}=campaign(seed,biome);console.log(JSON.stringify(results));assert.equal(g.state.phase,'won');assert.equal(g.state.kills,CHAPTERS.reduce((sum,w)=>sum+w.count,0));});
console.log(`${checks} campaign checks passed.`);
