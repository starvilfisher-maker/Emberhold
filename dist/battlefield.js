// One coordinate contract for simulation, terrain, deployment and camera controls.
export const FIELD = {scale:1.4, cell:3.2, columns:11, rows:7, heroX:29, heroZ:21, armyX:23, armyZ:16, panX:24, panZ:18};
export const ENTRANCES = [
  {id:'west',name:'西侧宽桥',x:-34,z:0,innerX:-22,innerZ:0},
  {id:'east',name:'东侧宽桥',x:34,z:0,innerX:22,innerZ:0},
  {id:'north',name:'北侧宽桥',x:0,z:-25.5,innerX:0,innerZ:-16.5},
  {id:'south',name:'南侧宽桥',x:0,z:25.5,innerX:0,innerZ:16.5}
];
export function validDeployment(p,legacy=false){
  return !!p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.abs(p.x)<=(legacy?9.61:16.01)&&Math.abs(p.z)<=(legacy?6.41:9.61)&&Math.hypot(p.x,p.z)>=2.4&&Math.abs(p.x/FIELD.cell-Math.round(p.x/FIELD.cell))<.001&&Math.abs(p.z/FIELD.cell-Math.round(p.z/FIELD.cell))<.001;
}
export function deploymentCells(legacy=false){
  const cells=[];for(let r=-3;r<=3;r++)for(let c=-5;c<=5;c++){const p={x:c*FIELD.cell,z:r*FIELD.cell};if(validDeployment(p,legacy))cells.push(p);}return cells;
}
export function waveEntrances(round){
  return [[0],[0,1],[2,0,3],[0,1,2,3],[0,1,3],[2,3,0,1],[0,2,1,3],[2,0,3,1]][Math.max(0,Math.min(7,round-1))].map(i=>ENTRANCES[i]);
}
export function invasionPoint(round,index,random){
  const entries=waveEntrances(round),entry=entries[index%entries.length];
  // Each entry cycles across three lanes; reinforcement groups change their order.
  const lane=((Math.floor(index/entries.length)+round)%3-1)*5.3+(random-.5)*1.4;
  const x=entry.x?entry.x:lane,z=entry.z?entry.z:lane;
  return {x,z,entrance:entry.id,approach:{x:entry.innerX||lane*1.55,z:entry.innerZ||lane*1.55}};
}
export function clampEllipse(entity,rx,rz){
  const distance=Math.hypot(entity.x/rx,entity.z/rz);if(distance>1){entity.x/=distance;entity.z/=distance;}return entity;
}
export function constrainSoldier(unit){
  if(unit.stance!=='hunt'&&unit.slot){const dx=unit.x-unit.slot.x,dz=unit.z-unit.slot.z,d=Math.hypot(dx,dz);if(d>3.5){unit.x=unit.slot.x+dx/d*3.5;unit.z=unit.slot.z+dz/d*3.5;}}
  return clampEllipse(unit,FIELD.armyX,FIELD.armyZ);
}
export function barFraction(hp,maxHp){return maxHp>0?Math.max(0,Math.min(1,hp/maxHp)):0;}
