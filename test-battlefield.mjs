import assert from 'node:assert/strict';
import * as T from './dist/vendor/three.module.js';
import {Game,DEFS} from './dist/engine.js';
import {FIELD,ENTRANCES,deploymentCells,validDeployment,waveEntrances,invasionPoint,constrainSoldier,barFraction} from './dist/battlefield.js';
import {makeDeploymentGrid,HealthOverlay,prepareKeepOcclusion,updateKeepOcclusion} from './dist/battle-visuals.js';
import {World} from './dist/world.js';
import {createKeep} from './dist/art.js';
import {bindFormation} from './dist/formation.js';
let checks=0;const test=(name,fn)=>{fn();console.log('PASS '+name);checks++;};
test('Expanded board exposes 76 legal cells and preserves the 34-cell classic board',()=>{
 assert.equal(deploymentCells().length,76);assert.equal(deploymentCells(true).length,34);
 const g=new Game(1);for(const p of deploymentCells())assert.ok(g.placement('u1',p.x,p.z).ok);for(const p of[{x:19.2,z:0},{x:0,z:12.8},{x:0,z:0},{x:NaN,z:0},{x:1,z:1}])assert.equal(validDeployment(p),false);
 assert.ok(g.deploy('u1',16,9.6).ok);g.saveFormation();const restored=Game.restore(g.serialize());assert.deepEqual(restored.state.units[0].slot,{x:16,z:3*3.2});restored.deploy('u1',3.2,0);assert.ok(restored.restoreFormation().ok);assert.deepEqual(restored.state.units[0].slot,{x:16,z:3*3.2});
 const legacy=new Game(1,{legacy:true});assert.equal(legacy.deploy('u1',16,9.6).ok,false);const old=JSON.parse(g.serialize());old.version=1;assert.equal(Game.restore(JSON.stringify(old)),null);
});
test('Every announced entrance has three broad lanes, including southern reinforcements',()=>{
 for(let round=1;round<=8;round++){
  const entries=waveEntrances(round),points=Array.from({length:entries.length*9},(_,i)=>invasionPoint(round,i,.5));
  assert.deepEqual([...new Set(points.map(p=>p.entrance))],entries.map(e=>e.id));
  for(const entry of entries){const lanes=points.filter(p=>p.entrance===entry.id).map(p=>entry.x?p.z:p.x);assert.equal(new Set(lanes).size,3);assert.ok(Math.max(...lanes)-Math.min(...lanes)>10);}
  const g=new Game(44);g.state.round=round;assert.deepEqual(g.wave().dirs,entries.map(e=>[e.x,e.z]));for(let i=0;i<g.wave().count;i++)g.spawn();assert.ok(g.state.enemies.every(e=>e.approach&&entries.some(a=>a.id===e.entrance)));
 }
 assert.ok(waveEntrances(3).some(e=>e.id==='south'));assert.equal(waveEntrances(4).length,4);
});
test('Guard leash and hunt boundary survive sustained crowd pressure without camping spawns',()=>{
 const g=new Game(2);g.deploy('u1',-16,0);g.state.units[1].stance='hunt';g.startNight();g.state.spawnTimer=999;g.state.enemies=[];
 for(const unit of g.state.units){unit.hp=unit.maxHp=1e6;unit.cd=999;}
 g.state.enemies=Array.from({length:8},(_,i)=>({id:'foe'+i,kind:'enemy',x:-30,z:i*.5,hp:1e8,maxHp:1e8,damage:0,speed:0,range:1,cd:999,stun:0,slow:0,abilityCd:999}));
 for(let i=0;i<900;i++){g.update(.1);for(const u of g.state.units){assert.ok(Math.hypot(u.x/FIELD.armyX,u.z/FIELD.armyZ)<=1.000001);if(u.stance!=='hunt')assert.ok(Math.hypot(u.x-u.slot.x,u.z-u.slot.z)<=3.500001);}}
 for(const slot of deploymentCells()){const u={slot,stance:'guard',x:slot.x*3,z:slot.z*3};constrainSoldier(u);assert.ok(Math.hypot(u.x-slot.x,u.z-slot.z)<=3.500001);}
});
test('Broad approaches resolve and siege enemies enter the island instead of firing from their spawn',()=>{
 const g=new Game(6);g.state.round=3;g.state.units=[];g.startNight();g.state.spawnTimer=999;g.spawn();const e=g.state.enemies[0],start={x:e.x,z:e.z};
 for(let i=0;i<800&&e.approach;i++)g.update(.1);assert.equal(e.approach,null);assert.ok(Math.hypot(e.x-start.x,e.z-start.z)>8);assert.ok(Math.hypot(e.x/33.6,e.z/25.06)<1);
});
test('Hero movement and dash reach expanded territory and stay within the coastline',()=>{
 const g=new Game(1);for(let i=0;i<150;i++)g.update(.1,{x:1,z:1});assert.ok(g.state.hero.x>19||g.state.hero.z>13);for(let i=0;i<20;i++){g.state.hero.dash=0;g.dash(1,1);assert.ok(Math.hypot(g.state.hero.x/29,g.state.hero.z/21)<=1.000001);}
});
global.innerWidth=1280;global.innerHeight=720;
function cameraWorld(){const w={camera:new T.OrthographicCamera(),renderer:{setSize(){}},zoom:1,pan:{x:0,z:0},raycaster:new T.Raycaster(),groundPlane:new T.Plane(new T.Vector3(0,1,0),0),canvas:{getBoundingClientRect:()=>({left:0,top:0,width:1280,height:720})}};for(const m of['resize','setSceneView','panBy','groundAt','screenAt','dragCamera','changeZoom','recenter'])w[m]=World.prototype[m];w.setSceneView();return w;}
test('Camera drag keeps grabbed ground under pointer at different zooms, clamps and restores after viewing',()=>{
 const w=cameraWorld();for(const zoom of[.55,1,2.4]){w.recenter();w.changeZoom(zoom-w.zoom);const anchor=w.groundAt(700,400);w.dragCamera(anchor,770,350);const point=w.groundAt(770,350);assert.ok(Math.hypot(point.x-anchor.x,point.z-anchor.z)<1e-6,JSON.stringify({zoom,anchor,point,pan:w.pan}));}
 const pan={...w.pan},position=w.camera.position.clone(),zoom=w.zoom;w.setSceneView('side');w.setSceneView();assert.deepEqual(w.pan,pan);assert.ok(position.distanceTo(w.camera.position)<1e-6);assert.equal(w.camera.zoom,zoom);
 w.panBy(1000,-1000);assert.deepEqual(w.pan,{x:24,z:-18});w.recenter();assert.deepEqual(w.pan,{x:0,z:0});w.changeZoom(100);assert.equal(w.zoom,2.4);w.changeZoom(-100);assert.equal(w.zoom,.55);
});
test('Snow grid uses dark continuous borders and three batches for all cells',()=>{
 const scene=new T.Scene(),grid=makeDeploymentGrid(scene),g=new Game(1,{biome:'frost'});grid.sync(g.state,null,false);assert.equal(grid.group.children.length,3);assert.ok(grid.ink.geometry.index.count>=24);assert.equal(grid.fill.count,76);
 const ink=grid.ink.material.color;assert.ok(ink.r*.2126+ink.g*.7152+ink.b*.0722<.07);g.state.legacy=true;grid.sync(g.state,null,false);let visible=0;const m=new T.Matrix4();for(let i=0;i<76;i++){grid.fill.getMatrixAt(i,m);if(Math.abs(m.determinant())>.1)visible++;}assert.equal(visible,34);grid.sync(g.state,null,true);assert.equal(grid.group.visible,false);
});
test('Castle cutaway has private materials, reveals selection and returns opaque in scene view',()=>{
 const w=cameraWorld();w.castle=createKeep();const shared=[];w.castle.traverse(o=>{if(o.isMesh)shared.push(o.material);});prepareKeepOcclusion(w.castle);w.motion=false;const state={hero:{hp:0},units:[],enemies:[]};updateKeepOcclusion(w,state,'u1',.1);assert.ok(Math.abs(w.castleOpacity-.2)<1e-9);w.castle.traverse(o=>{if(o.isMesh){assert.equal(o.material.depthWrite,false);assert.ok(!shared.includes(o.material));}});w.sceneView='wide';updateKeepOcclusion(w,state,'u1',.1);assert.equal(w.castleOpacity,1);for(const material of shared)assert.equal(material.opacity,1);
});
class FakeElement{
 closest(){return null;}
 constructor(){this.listeners={};this.style={};this.hidden=false;this.children=[];this.classList={add(){},remove(){},toggle(){}};this.captures=new Set();}
 addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
 emit(name,event={}){for(const fn of this.listeners[name]||[])fn({preventDefault(){},button:0,isPrimary:true,pointerType:'mouse',pointerId:1,...event});}
 setPointerCapture(id){this.captures.add(id);}hasPointerCapture(id){return this.captures.has(id);}releasePointerCapture(id){this.captures.delete(id);}
 append(node){this.children.push(node);node.parent=this;}remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);}
 set innerHTML(value){this.children=[new FakeElement(),new FakeElement(),new FakeElement()];this.children[1].firstChild=new FakeElement();}
}
function inputHarness(){
 const canvas=new FakeElement(),bench=new FakeElement(),label=new FakeElement(),doc=new FakeElement();doc.body=new FakeElement();doc.querySelector=()=>label;doc.elementFromPoint=()=>canvas;global.document=doc;global.window=new FakeElement();
 const g=new Game(1);let selected=null,clicks=0,pans=0;const world={screenAt:(x,z)=>({x:500+x*10,y:300+z*10}),groundAt:(x,y)=>({x:(x-500)/10,z:(y-300)/10}),setPlacementPreview(){},dragCamera(){pans++;}};
 const control=bindFormation({canvas,bench,world,game:()=>g,ready:()=>true,getSelected:()=>selected,select:id=>selected=id,inspect(){},act(){},close(){},clickGround(){clicks++;},toast(){},defs:DEFS});
 const drag=(x,y,tx,ty,button=0)=>{canvas.emit('pointerdown',{clientX:x,clientY:y,button});doc.emit('pointermove',{clientX:tx,clientY:ty,button});doc.emit('pointerup',{clientX:tx,clientY:ty,button});};
 return {canvas,doc,g,control,drag,get clicks(){return clicks;},get pans(){return pans;}};
}
test('Empty-space drag pans without moving units or clicking; unit drag still deploys to expanded cells',()=>{
 const h=inputHarness(),before=JSON.stringify(h.g.state);h.drag(780,450,850,480);assert.equal(h.pans,1);assert.equal(h.clicks,0);assert.equal(JSON.stringify(h.g.state),before);
 h.drag(436,300,628,396);assert.deepEqual(h.g.state.units[0].slot,{x:12.8,z:9.600000000000001});assert.equal(h.pans,1);assert.equal(h.clicks,0);
});
test('Middle/right drag over units pans, foreign pointers and cancellation cannot place or click',()=>{
 for(const button of[1,2]){const h=inputHarness(),before=JSON.stringify(h.g.state);h.drag(436,300,520,350,button);assert.equal(h.pans,1);assert.equal(h.clicks,0);assert.equal(JSON.stringify(h.g.state),before);}
 const h=inputHarness(),before=JSON.stringify(h.g.state);h.canvas.emit('pointerdown',{clientX:436,clientY:300});h.doc.emit('pointermove',{pointerId:2,clientX:900,clientY:500});h.doc.emit('pointercancel');h.doc.emit('pointerup',{clientX:700,clientY:420});assert.equal(h.control.active(),false);assert.equal(JSON.stringify(h.g.state),before);assert.equal(h.clicks,0);
});
test('Nighttime unit drag pans the battlefield without changing formation',()=>{const h=inputHarness();h.g.startNight();const slots=JSON.stringify(h.g.state.units.map(u=>u.slot));h.drag(436,300,520,350);assert.equal(h.pans,1);assert.equal(h.clicks,0);assert.equal(JSON.stringify(h.g.state.units.map(u=>u.slot)),slots);});
test('Full-health allies, hero, castle, buildings and enemies get bars; deaths clean up and values clamp',()=>{
 const root=new FakeElement();global.document={querySelector:()=>root,createElement:()=>new FakeElement()};const health=new HealthOverlay(),g=new Game(1);g.build(0,'tower');g.spawn();const w={screenAt:()=>({x:500,y:300}),castleOpacity:1};health.sync(w,g.state,null);assert.equal(health.items.size,6);assert.equal(root.children.length,6);g.state.enemies[0].hp=0;health.sync(w,g.state,'u1');assert.equal(health.items.size,5);assert.equal(root.children.length,5);assert.ok(health.items.get('u1').node.className.includes('selected'));w.sceneView='wide';health.sync(w,g.state,null);assert.equal(root.hidden,true);assert.equal(barFraction(-4,100),0);assert.equal(barFraction(200,100),1);assert.equal(barFraction(5,0),0);
});
console.log(checks+' battlefield checks passed.');
