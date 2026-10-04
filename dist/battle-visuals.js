import * as T from './vendor/three.module.js';
import {deploymentCells,validDeployment,barFraction} from './battlefield.js';

function cellFrame(outer,inner){
 const shape=new T.Shape();shape.moveTo(-outer,-outer);shape.lineTo(outer,-outer);shape.lineTo(outer,outer);shape.lineTo(-outer,outer);shape.closePath();
 const hole=new T.Path();hole.moveTo(-inner,-inner);hole.lineTo(-inner,inner);hole.lineTo(inner,inner);hole.lineTo(inner,-inner);hole.closePath();shape.holes.push(hole);return new T.ShapeGeometry(shape);
}
export function makeDeploymentGrid(scene){
 const cells=deploymentCells(),group=new T.Group(),dummy=new T.Object3D();group.position.y=.15;scene.add(group);
 const material=(color,opacity)=>new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:false,side:T.DoubleSide});
 const fill=new T.InstancedMesh(new T.PlaneGeometry(2.79,2.79),material(0xffffff,.24),cells.length);
 const ink=new T.InstancedMesh(cellFrame(1.52,1.35),material(0x183c4a,.9),cells.length);
 const edge=new T.InstancedMesh(cellFrame(1.43,1.38),material(0xc8ecdc,.92),cells.length);
 group.add(fill,ink,edge);const color=new T.Color();
 return {group,cells,fill,ink,edge,sync(state,selected,hidden){
  group.visible=!hidden&&state.phase==='day';if(!group.visible)return;
  const signature=[state.legacy,state.biome,!!selected,...state.units.map(u=>u.slot?u.slot.x+','+u.slot.z:'')].join('|');if(this.signature===signature)return;this.signature=signature;
  cells.forEach((p,i)=>{
   const available=validDeployment(p,state.legacy),occupied=state.units.some(u=>u.slot&&Math.hypot(u.slot.x-p.x,u.slot.z-p.z)<.1);
   dummy.position.set(p.x,0,p.z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.setScalar(available?1:0);dummy.updateMatrix();
   fill.setMatrixAt(i,dummy.matrix);ink.setMatrixAt(i,dummy.matrix);dummy.position.y=.006;dummy.updateMatrix();edge.setMatrixAt(i,dummy.matrix);
   fill.setColorAt(i,color.set(occupied?0xf5c569:state.biome==='frost'?0x145b80:selected?0x71ddd1:0x83c6b4));
   edge.setColorAt(i,color.set(occupied?0xffd37b:state.biome==='frost'?0x83cfe3:0xd1ead2));
  });for(const mesh of [fill,ink,edge])mesh.instanceMatrix.needsUpdate=true;fill.instanceColor.needsUpdate=true;edge.instanceColor.needsUpdate=true;
 }};
}

// Pixel-sized overlays stay upright at every camera zoom. They never intercept input.
export class HealthOverlay{
 constructor(){this.root=document.querySelector('#world-health');this.items=new Map();this.values=false;}
 sync(world,state,selected){
  if(!this.root)return;this.root.hidden=!!world.sceneView;this.root.classList.toggle('show-values',this.values);if(world.sceneView)return;
  const alive=[state.castle,state.hero,...state.units.filter(u=>u.slot),...state.buildings,...state.enemies].filter(e=>e.hp>0),ids=new Set();
  for(const e of alive){
   ids.add(e.id);const type=e.id==='castle'?'keep':e.id==='hero'?'hero':e.kind?'enemy':e.type?'building':'ally';
   let item=this.items.get(e.id);if(!item){const node=document.createElement('div');node.innerHTML='<span></span><i><b></b></i><small></small>';this.root.append(node);item={node,label:node.children[0],fill:node.children[1].firstChild,value:node.children[2]};this.items.set(e.id,item);}
   const fraction=barFraction(e.hp,e.maxHp),height=type==='keep'?6.9:type==='hero'?3.15:world.objects?.get(e.id)?.userData.healthHeight||(type==='building'?3.9:e.boss?4.3:2.2+(e.star||1)*.15);
   const p=world.screenAt(e.x,e.z,height),visible=p.x>-60&&p.x<innerWidth+60&&p.y>-25&&p.y<innerHeight+25&&e.id!==world.previewId;
   item.node.hidden=!visible;if(!visible)continue;
   item.node.className='world-hp '+type+(e.boss?' boss':'')+(e.id===selected?' selected':'')+(fraction<.3?' critical':'');
   item.node.style.transform=`translate(${Math.round(p.x)}px,${Math.round(p.y)}px) translate(-50%,-100%)`;
   item.fill.style.transform=`scaleX(${fraction})`;item.value.textContent=Math.ceil(e.hp)+' / '+Math.ceil(e.maxHp);
   item.label.textContent=type==='keep'?'余烬城堡':type==='hero'?'守城者':e.boss?'首领':'';
  }
  for(const [id,item]of this.items)if(!ids.has(id)){item.node.remove();this.items.delete(id);}
 }
}

export function prepareKeepOcclusion(keep){
 keep.traverse(o=>{if(!o.isMesh)return;o.material=o.material.clone();o.material.transparent=true;});
}
export function updateKeepOcclusion(world,state,selected,dt){
 const center=world.screenAt(0,0,.1),top=world.screenAt(0,0,6.7),left=world.screenAt(-2.7,2.7,2),right=world.screenAt(2.7,-2.7,2);
 const obscured=[state.hero,...state.units.filter(u=>u.slot),...state.enemies].some(e=>{
  if(e.hp<=0||Math.hypot(e.x,e.z)>11)return false;const p=world.screenAt(e.x,e.z,.85);
  return p.x>Math.min(left.x,right.x)-8&&p.x<Math.max(left.x,right.x)+8&&p.y>top.y-4&&p.y<center.y+2;
 });
 const fade=!world.sceneView&&(world.keepCutaway||selected||world.previewId||obscured),target=fade?.2:1;
 world.castleOpacity=(world.castleOpacity??1)+(target-(world.castleOpacity??1))*(world.motion?Math.min(1,dt*12):1);
 world.castle.traverse(o=>{if(!o.isMesh)return;o.material.opacity=world.castleOpacity;o.material.depthWrite=world.castleOpacity>.98;o.castShadow=world.castleOpacity>.8;});
}
