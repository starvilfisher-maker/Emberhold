import * as T from './vendor/three.module.js';

// Code-native diorama art. Static meshes are baked by surface type, not by prop.
export const ART_THEMES = {
 meadow:{ground:0x617c51,patch:0x78915b,rock:0x465951,rockLight:0x708374,dirt:0x8d8159,path:0xb4b18c,water:0x245e65,leaf:0x355f46,leafLight:0x6c8b50,accent:0xe8b963,sky:0x527e80},
 frost:{ground:0xb2caca,patch:0xd5e1da,rock:0x4f697b,rockLight:0x839eaa,dirt:0x8cabae,path:0x9bafb1,water:0x315c78,leaf:0x315c61,leafLight:0x5c8080,accent:0xade0e9,sky:0x879fab},
 ruins:{ground:0xb69868,patch:0xc9aa79,rock:0x725d4d,rockLight:0x9c8060,dirt:0x97805e,path:0xc6b384,water:0x366865,leaf:0x56715a,leafLight:0x93a473,accent:0xf0c876,sky:0xa2957e}
};
const artMaterials=new Map();
function artMat(color,glow=false){const key=color+':'+glow;if(!artMaterials.has(key))artMaterials.set(key,new T.MeshStandardMaterial({color,roughness:.88,flatShading:true,...(glow?{emissive:color,emissiveIntensity:1.15}: {})}));return artMaterials.get(key);}
function artMesh(p,geo,color,x=0,y=0,z=0,glow=false){const m=new T.Mesh(geo,artMat(color,glow));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;p.add(m);return m;}
function artBox(p,w,h,d,c,x=0,y=0,z=0){return artMesh(p,new T.BoxGeometry(w,h,d),c,x,y,z);}
function artCyl(p,a,b,h,c,x=0,y=0,z=0,n=8){return artMesh(p,new T.CylinderGeometry(a,b,h,n),c,x,y,z);}
function artCone(p,r,h,c,x=0,y=0,z=0,n=6){return artMesh(p,new T.ConeGeometry(r,h,n),c,x,y,z);}
function artRock(p,r,c,x,y,z,sx=1,sy=1,sz=1){const m=artMesh(p,new T.DodecahedronGeometry(r,0),c,x,y,z);m.scale.set(sx,sy,sz);return m;}
function artRng(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function artBeam(p,a,b,width,color){const d=new T.Vector3(...b).sub(new T.Vector3(...a));const m=artBox(p,width,d.length(),width,color,...new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
function artRing(p,r,w,c,y=0,segments=64){const m=artMesh(p,new T.RingGeometry(r-w,r,segments),c,0,y,0);m.rotation.x=-Math.PI/2;m.castShadow=false;return m;}
function artArch(p,w,h,d,c,x,y,z){const r=w/2,s=new T.Shape();s.moveTo(-r,0);s.lineTo(r,0);s.lineTo(r,h-r);s.absarc(0,h-r,r,0,Math.PI);s.closePath();const hole=new T.Path(),ir=r-.17;hole.moveTo(-ir,.05);hole.lineTo(-ir,h-r);hole.absarc(0,h-r,ir,Math.PI,0,true);hole.lineTo(ir,.05);hole.closePath();s.holes.push(hole);const geo=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:8});return artMesh(p,geo,c,x,y,z);}

export function bakeArt(root){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),groups=new Map(),old=[];
 root.traverse(m=>{if(!m.isMesh||m.isInstancedMesh||m.userData.noBake)return;let parent=m.parent;while(parent&&parent!==root){if(parent.userData.noBake)return;parent=parent.parent;}const material=m.material;if(Array.isArray(material)||!material.isMeshStandardMaterial||material.transparent)return;
 const glow=material.emissiveIntensity>0&&material.emissive.getHex()!==0,key=(glow?'glow:'+material.color.getHex():'stone')+':'+m.castShadow;let group=groups.get(key);if(!group){group={position:[],normal:[],color:[],material,glow,cast:m.castShadow};groups.set(key,group);}const geometry=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();geometry.applyMatrix4(inverse.clone().multiply(m.matrixWorld));const pos=geometry.attributes.position,norm=geometry.attributes.normal,c=material.color;
 for(let i=0;i<pos.count;i++){group.position.push(pos.getX(i),pos.getY(i),pos.getZ(i));group.normal.push(norm.getX(i),norm.getY(i),norm.getZ(i));group.color.push(c.r,c.g,c.b);}geometry.dispose();old.push(m);
 });
 const original=old.length;for(const m of old){m.removeFromParent();m.geometry.dispose();}
 for(const group of groups.values()){const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(group.position,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(group.normal,3));geometry.setAttribute('color',new T.Float32BufferAttribute(group.color,3));geometry.computeBoundingSphere();const material=group.glow?group.material:new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.9,flatShading:true});const mesh=new T.Mesh(geometry,material);mesh.castShadow=group.cast;mesh.receiveShadow=true;root.add(mesh);}
 root.userData.bakedFrom=original;root.userData.bakedDraws=groups.size;return root;
}

function artFir(p,x,z,s,t,snow=false){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(s);p.add(g);artCyl(g,.12,.23,1.5,0x645640,0,.6,0,5);for(let i=0;i<3;i++){const cone=artCone(g,1.18-i*.26,1.7-i*.2,i%2?t.leaf:t.leafLight,0,1.6+i*.66,0,7);cone.rotation.y=i*.4;if(snow)artCone(g,(1.18-i*.26)*.88,1.42-i*.2,t.patch,0,1.77+i*.66,0,7).rotation.y=i*.4;}}
function artBroadleaf(p,x,z,s,t){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(s);p.add(g);artCyl(g,.16,.29,2,0x635643,0,1,0,5);for(const [a,b]of [[[-.05,.8,0],[-.6,2,.2]],[[0,1,0],[.7,2.3,-.2]]])artBeam(g,a,b,.17,0x726244);for(let i=0;i<5;i++){const a=i*2.4;artRock(g,.9,i%2?t.leaf:t.leafLight,Math.cos(a)*.62,2.1+(i%3)*.35,Math.sin(a)*.6,1.2,.9,1);}artRock(g,.9,t.leafLight,0,3.05,0,1.12,.72,1.1);}
function artPalm(p,x,z,s,t){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(s);p.add(g);artCyl(g,.12,.25,2.8,0x8e7753,.12,1.4,0,6).rotation.z=-.09;for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const leaf=artCone(g,.43,2.15,i%2?t.leaf:t.leafLight,Math.cos(a)*.65,2.9,Math.sin(a)*.65,3);leaf.rotation.z=Math.PI/2;leaf.rotation.y=-a;leaf.scale.z=.27;}artRock(g,.33,0xd9b57d,0,2.6,0);}
function artLantern(p,x,z,height=2.3){artCyl(p,.065,.09,height,0x5b6155,x,height/2,z,6);artBox(p,.47,.12,.44,0xc3a567,x,height+.35,z);artBox(p,.35,.44,.32,0xf4c377,x,height+.07,z).material=artMat(0xf4c377,true);artBox(p,.5,.13,.47,0x43554d,x,height-.2,z);artCone(p,.4,.35,0x456858,x,height+.57,z,4).rotation.y=Math.PI/4;}
function artBanner(p,x,z,color,animated){const g=new T.Group();g.position.set(x,0,z);p.add(g);artCyl(g,.045,.08,3.1,0xa99166,0,1.55,0,6);artMesh(g,new T.OctahedronGeometry(.14),0xf0d18b,0,3.22,0);const cloth=new T.Group();cloth.position.set(.07,2.9,0);cloth.userData.noBake=true;g.add(cloth);artBox(cloth,.75,1.2,.045,color,.375,-.6,0);artBox(cloth,.75,.06,.052,0xddc28d,.375,-.13,0);artBox(cloth,.08,.66,.058,0xddc28d,.375,-.65,0);animated.push({object:cloth,type:'flag',offset:x});}
function artBridge(p,x,z,rot,t){const g=new T.Group();g.position.set(x,-.04,z);g.rotation.y=rot;p.add(g);for(let i=0;i<11;i++){artBox(g,.56,.22,3.45,i%3?0x967d59:0xb69a69,(i-5)*.59,0,0);}for(const side of[-1,1]){artBox(g,6.7,.22,.24,0x5b6354,0,-.23,side*1.25);artBox(g,6.8,.17,.17,0xc5b18a,0,1,side*1.62);artBox(g,6.8,.12,.13,0x8a7c61,0,.56,side*1.62);for(let i=0;i<4;i++){const px=(i-1.5)*2.06;artBox(g,.26,1.42,.26,0x697467,px,.52,side*1.62);artCone(g,.23,.2,0xd9c79c,px,1.33,side*1.62,4);artBeam(g,[px-.8,.25,side*1.62],[px+.8,.94,side*1.62],.11,0x8f805f);}}for(const side of[-1,1]){artCyl(g,.52,.7,4,t.rock,side*2.2,-2.1,0,6);artLantern(g,side*2.85,1.8,1.7);}}
function artRuin(p,x,z,scale,t){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(scale);p.add(g);artCyl(g,.82,.98,.3,t.rockLight,0,.15,0,8);for(const side of[-1,1]){artCyl(g,.31,.43,2.4,t.path,side*.9,1.2,0,8);artCyl(g,.48,.48,.22,t.patch,side*.9,2.25,0);for(let i=0;i<4;i++)artBox(g,.12,1.8,.1,t.rockLight,side*.9+Math.sin(i*1.57)*.31,1.2,Math.cos(i*1.57)*.31);}artBox(g,2.65,.38,.76,t.path,0,2.55,0);artBox(g,1.9,.15,.85,t.accent,0,2.81,0);artRock(g,.6,t.rockLight,1.8,.3,.9,1,.7,.8);}
function artCoastShape(y,scale=1){const points=[];for(let i=0;i<48;i++){const a=i*Math.PI*2/48,r=1+Math.sin(i*2.4)*.012;points.push(new T.Vector3(Math.cos(a)*24*r*scale,y,Math.sin(a)*17.9*r*scale));}return points;}
function artCliff(p,t){const upper=artCoastShape(-.05),lower=artCoastShape(-3.6,.92),positions=[],colors=[];for(let i=0;i<48;i++){const n=(i+1)%48,a=upper[i],b=upper[n],c=lower[i],d=lower[n];for(const [v,k]of [[a,1],[c,.65],[b,1],[b,1],[c,.65],[d,.73]]){positions.push(v.x,v.y,v.z);const color=new T.Color(i%3?t.rock:t.rockLight).multiplyScalar(k);colors.push(color.r,color.g,color.b);}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true,side:T.DoubleSide}));mesh.userData.noBake=true;mesh.receiveShadow=true;p.add(mesh);return mesh;}

export function createLandscape(world,id='meadow'){
 const t=ART_THEMES[id]||ART_THEMES.meadow,root=new T.Group(),detail=new T.Group(),animated=[],rand=artRng(7183);root.name='landscape-'+id;world.scene.add(root);root.add(detail);detail.name='fine-scenery';
 const floor=artCyl(root,24,24,.15,t.ground,0,-.095,0,48);floor.scale.z=.746;floor.castShadow=false;
 artCliff(root,t);
 for(let i=0;i<50;i++){const a=i/50*Math.PI*2,x=Math.cos(a)*23,z=Math.sin(a)*17.15;if(Math.abs(z)<2.5||Math.abs(x)<2.1&&z<0)continue;artRock(root,.7+rand()*.85,i%3?t.rock:t.rockLight,x,-.4,z,1.2,.8+rand(),.8);if(i%3===0)artRock(root,1.4,t.patch,x*.94,-.18,z*.94,1.8,.28,1.25);}
 // Ground color islands stay below the tactical grid; all raised props stay outside it.
 for(let i=0;i<35;i++){const a=i*2.39996,r=9+rand()*13,x=Math.cos(a)*r,z=Math.sin(a)*r*.72;if(Math.abs(x)<3||Math.abs(z)<3)continue;const patch=artCyl(root,1.3+rand()*1.2,1.3+rand()*1.2,.015,i%2?t.patch:new T.Color(t.ground).lerp(new T.Color(t.patch),.3).getHex(),x,-.004,z,7);patch.rotation.y=rand()*6;patch.scale.z=.75;patch.castShadow=false;}
 for(const axis of [0,1]){artBox(root,axis?3.5:47,.03,axis?35:3.5,t.dirt,0,.001,0).castShadow=false;for(let i=-14;i<=14;i++){const length=axis?1.2:1.6,at=i*length;if(axis&&Math.abs(at)>17)continue;for(let lane=-1;lane<=1;lane++){const tile=artBox(root,axis?.92:length-.055,.045,axis?length-.05:.92,i%4===0?t.patch:t.path,axis?lane*1.04:at,.025,axis?at:lane*1.04);tile.rotation.y=(rand()-.5)*.026;tile.castShadow=false;}}for(const side of[-1,1]){artBox(root,axis?.1:45,.04,axis?32:.1,t.rockLight,axis?side*1.8:0,.03,axis?0:side*1.8).castShadow=false;}}
 const plaza=new T.Group();root.add(plaza);artCyl(plaza,3.55,3.55,.065,t.rockLight,0,.035,0,12).castShadow=false;artCyl(plaza,3.34,3.34,.03,t.path,0,.081,0,12).castShadow=false;artRing(plaza,3.1,.035,t.accent,.103,48);for(let i=0;i<12;i++){const a=i*Math.PI/6;artBox(plaza,.08,.015,.42,t.rockLight,Math.sin(a)*2.9,.108,Math.cos(a)*2.9).rotation.y=a;}
 // Planted borders with deliberately clear bridge approaches.
 for(let i=0;i<62;i++){const a=i*2.39996,r=15+rand()*7,x=Math.cos(a)*r,z=Math.sin(a)*r*.72;if(Math.abs(x)<13.3&&Math.abs(z)<10.2||Math.abs(x)<3.7||Math.abs(z)<3.2)continue;const size=.65+rand()*.6;if(id==='ruins'){if(i%3===0)artPalm(root,x,z,size,t);else artRock(root,.6,t.rockLight,x,.12,z,1.15,.5,1);}else if(i%3===0&&id==='meadow')artBroadleaf(root,x,z,size,t);else artFir(root,x,z,size,t,id==='frost');}
 for(let i=0;i<150;i++){const a=i*2.4,r=13.5+rand()*8,x=Math.cos(a)*r,z=Math.sin(a)*r*.71;if(Math.abs(x)<12.8&&Math.abs(z)<9.2||Math.abs(x)<2.8||Math.abs(z)<2.8)continue;if(id==='frost'){if(i%5===0)artRock(detail,.38,t.patch,x,.1,z,1.8,.6,1);}else{for(let k=0;k<3;k++){const stem=artCone(detail,.08,.25+rand()*.22,t.leafLight,x+k*.1,.15,z,3);stem.rotation.z=(k-1)*.3;}if(i%3===0)artMesh(detail,new T.OctahedronGeometry(.095),id==='ruins'?0xe4c18c:i%2?0xebc081:0xb4bbd1,x,.36,z);}}
 for(const [x,z]of [[-11,-7],[11,-7],[-11,7],[11,7],[0,-11],[0,11]]){artCyl(root,1.25,1.46,.18,t.rock, x,.02,z,8);artCyl(root,1.18,1.25,.12,t.path,x,.17,z,8);const socket=new T.Group();socket.position.set(x,.245,z);root.add(socket);artRing(socket,1.1,.055,t.accent,0,8);artBox(socket,.55,.02,.08,t.accent,0,.01,0);artBox(socket,.08,.02,.55,t.accent,0,.01,0);for(let i=0;i<4;i++)artMesh(socket,new T.OctahedronGeometry(.06),t.accent,Math.sin(i*1.57)*1,.05,Math.cos(i*1.57)*1);}
 for(const [x,z,r]of [[-24,0,0],[24,0,0],[0,-18,Math.PI/2]])artBridge(root,x,z,r,t);
 for(const [x,z]of [[-15,3],[15,-3],[3,-13]])artLantern(root,x,z);
 for(const [x,z]of [[-13.7,-5.5],[13.7,5.5]])artBanner(root,x,z,id==='frost'?0x6d91a2:id==='ruins'?0x9e7456:0x4e8572,animated);
 if(id==='ruins'){for(const [x,z,s]of [[-17,8,1.2],[16,-8,1.3],[-6,-14,.95]])artRuin(root,x,z,s,t);for(let i=0;i<12;i++)artBox(detail,.6,.1,.4,t.path,-17+(i%4)*.7,.07,10+Math.floor(i/4)*.7).rotation.y=i*.3;}
 if(id==='frost'){for(const [x,z]of [[-17,7],[15,-10],[-7,14]]){for(let i=0;i<4;i++){const shard=artMesh(root,new T.OctahedronGeometry(.6+i*.12),i%2?0x7eaebc:0xc6e8ea,x+i*.4,.55+i*.22,z+i*.13);shard.scale.set(.6,2,.7);shard.rotation.z=(i-1.5)*.17;}}}
 if(id==='meadow'){for(const [x,z]of [[-16,-7],[15,8]]){const cottage=new T.Group();cottage.position.set(x,0,z);root.add(cottage);artBox(cottage,1.5,.95,1.3,0xcab58e,0,.5,0);const roof=artCone(cottage,1.45,1.1,0x986f48,0,1.5,0,4);roof.rotation.y=Math.PI/4;roof.scale.z=.83;artBox(cottage,.35,.6,.04,0x4b5141,0,.4,.67);artBox(cottage,.27,.28,.05,0xf0cd80,.48,.6,.68).material=artMat(0xf0cd80,true);artBox(cottage,.23,.8,.23,0xa89d82,.45,1.55,-.22);for(let i=0;i<4;i++)artBox(cottage,.1,.65,.1,0x8b7754,-1+i*.65,.32,1.6);artBox(cottage,2.1,.1,.1,0xb1a071,0,.45,1.6);}}
 // Small outcrops and foam frame the board without occupying playable space.
 for(const [x,z,s]of [[-26,9,1.2],[27,-9,1.7],[-10,23,1.6],[17,21,.9],[-22,-20,2.1],[12,-27,2.7]]){artRock(root,s,t.rock,x,-2.7,z,1.9,1.1,1.3);artRock(root,s*.8,t.rockLight,x,-2,z,1.6,.6,1.15);if(id==='frost')artRock(root,s*.77,t.patch,x,-1.6,z,1.5,.25,1.1);}
 const foam=new T.Group();foam.userData.noBake=true;const foamMat=new T.MeshBasicMaterial({color:id==='frost'?0xb8dcdf:0x94bfb0,transparent:true,opacity:.27,depthWrite:false});const ripples=new T.InstancedMesh(new T.PlaneGeometry(1,.08),foamMat,48),dummy=new T.Object3D();let rippleIndex=0;for(const scale of [1.02,1.045]){const shape=artCoastShape(-3.04,scale);for(let i=0;i<shape.length;i+=2){const a=shape[i],b=shape[(i+1)%shape.length],d=new T.Vector3().subVectors(b,a);dummy.rotation.set(-Math.PI/2,0,-Math.atan2(d.z,d.x));dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.scale.set(d.length()*.8,1,1);dummy.updateMatrix();ripples.setMatrixAt(rippleIndex++,dummy.matrix);}}ripples.instanceMatrix.needsUpdate=true;foam.add(ripples);root.add(foam);animated.push({object:foam,type:'foam'});
 const waterMaterial=new T.MeshStandardMaterial({color:t.water,roughness:.48,metalness:.16});const water=new T.Mesh(new T.PlaneGeometry(260,260),waterMaterial);water.rotation.x=-Math.PI/2;water.position.y=-3.15;water.receiveShadow=true;world.scene.add(water);
 const waterTime={value:0};waterMaterial.onBeforeCompile=shader=>{shader.uniforms.artTime=waterTime;shader.vertexShader='varying vec3 artPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nartPosition = (modelMatrix * vec4(position, 1.0)).xyz;');shader.fragmentShader='uniform float artTime; varying vec3 artPosition;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat ripple = sin(artPosition.z * 2.0 + artPosition.x * .35 + sin(artPosition.x * .38) + artTime * .55);\nfloat glint = smoothstep(.92, .99, ripple) * (.25 + .25 * sin(artPosition.x * .7 + artTime * .3));\ndiffuseColor.rgb *= .94 + ripple * .04; diffuseColor.rgb += vec3(.016, .025, .023) * glint;');};
 bakeArt(detail);detail.userData.noBake=true;bakeArt(root);return {root,detail,water,waterTime,animated,theme:t};
}

export function animateLandscape(landscape,time,night,motion,quality){
 landscape.detail.visible=quality!=='low';landscape.waterTime.value=motion?time:0;landscape.water.material.color.set(landscape.theme.water).lerp(new T.Color(0x122e42),night*.78);
 for(const item of landscape.animated){if(item.type==='flag')item.object.rotation.y=motion?Math.sin(time*1.7+item.offset)*.16:0;else if(item.type==='foam'){const scale=1+(motion?Math.sin(time*.6)*.002:0);item.object.scale.set(scale,1,scale);item.object.visible=quality!=='low';}}
}
export function disposeArt(root){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])if(![...artMaterials.values()].includes(m))materials.add(m);});root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}

export function createKeep(){
 const g=new T.Group(),body=new T.Group();g.add(body);const stone=0xc4c2a2,trim=0xe0d1a5,roof=0x285e5b,roofLight=0x3c7870,dark=0x2f4443,gold=0xcba15b;
 artCyl(body,2.48,2.7,.3,0x757f6b,0,.18,0,12);artCyl(body,2.38,2.46,.16,trim,0,.4,0,12);
 artBox(body,2.65,2.5,2.3,stone,0,1.67,-.2);artBox(body,2.88,.22,2.5,trim,0,2.85,-.2);artBox(body,2.3,1.6,2,0xdbd0ad,0,3.65,-.3);
 for(let floor=0;floor<6;floor++){for(let i=0;i<4;i++){const x=(i-1.5)*.58+(floor%2)*.18;artBox(body,.5,.015,.025,0xa4a58b,x,.6+floor*.35,.963);}for(const side of[-1,1])artBox(body,.018,.018,2.3,0xadb092,side*1.332,.63+floor*.37,-.2);}
 for(const side of[-1,1]){artBox(body,.24,2.4,.32,trim,side*1.22,1.65,.95);artBox(body,.22,1.8,.26,trim,side*1.04,3.6,.65);for(const z of[-1,.5]){artBox(body,.06,.57,.23,dark,side*1.343,2,z);artBox(body,.04,.41,.1,0xe4b96e,side*1.38,1.98,z).material=artMat(0xe4b96e,true);}}
 for(const x of[-.58,.58]){artArch(body,.45,.8,.07,trim,x,3.45,.72);artBox(body,.28,.55,.04,dark,x,3.76,.74);artBox(body,.2,.46,.045,0xe9b765,x,3.73,.78).material=artMat(0xe9b765,true);artBox(body,.035,.46,.06,roof,x,3.74,.82);}
 const mainRoof=artCone(body,2.12,1.62,roof,0,5.18,-.3,4);mainRoof.rotation.y=Math.PI/4;mainRoof.scale.z=.88;const eaves=artCone(body,2.2,.23,roofLight,0,4.45,-.3,4);eaves.rotation.y=Math.PI/4;eaves.scale.z=.88;
 for(const side of[-1,1]){artBeam(body,[side*1.52,4.43,.94],[0,5.96,-.3],.07,gold);artBeam(body,[side*1.52,4.43,-1.54],[0,5.96,-.3],.065,roofLight);}
 for(const x of[-1.72,1.72])for(const z of[-1.3,1.3]){artCyl(body,.61,.72,2.68,stone,x,1.62,z,8);artCyl(body,.72,.69,.18,trim,x,2.83,z,8);artCyl(body,.67,.65,.16,0xa8b095,x,1.1,z,8);artCone(body,.86,1.47,roof,x,3.57,z,8);artCone(body,.89,.2,roofLight,x,2.89,z,8);artMesh(body,new T.OctahedronGeometry(.095),gold,x,4.35,z);artBox(body,.15,.43,.035,dark,x,2,z+.62);artBox(body,.07,.29,.04,0xe2b16d,x,1.98,z+.647).material=artMat(0xe2b16d,true);}
 // Recessed gate, portcullis, steps and hanging heraldry.
 artBox(body,.96,1.15,.04,dark,0,1.05,1.04);artArch(body,1.34,1.65,.22,trim,0,.43,.97);for(let i=-2;i<=2;i++)artBox(body,.045,1.2,.06,0x8b7753,i*.16,1.06,1.09);for(const y of [.6,1.03,1.47])artBox(body,.88,.045,.07,0xb19a6b,0,y,1.1);for(let i=0;i<3;i++)artBox(body,1.65+i*.22,.12, .42,trim,0,.3-i*.08,1.55+i*.33);
 for(const side of [-1,1]){artBox(body,.43,.9,.04,roofLight,side*.98,1.65,1.25);artBox(body,.12,.48,.05,gold,side*.98,1.73,1.28);artMesh(body,new T.OctahedronGeometry(.13),gold,side*.98,1.66,1.33).scale.z=.3;}
 artCyl(body,.045,.055,1.1,gold,0,6.2,-.3,6);bakeArt(body);
 const flag=new T.Group();flag.position.set(.03,6.53,-.3);artBox(flag,.91,.51,.04,0xddaa56,.455,-.255,0);artBox(flag,.1,.32,.05,0xf0dca5,.31,-.26,.03);artMesh(flag,new T.OctahedronGeometry(.12),0xf0dca5,.55,-.27,.045).scale.z=.2;g.add(flag);bakeArt(flag);g.userData.flag=flag;return g;
}

export function createStructure(b){
 const g=new T.Group(),staticPart=new T.Group();g.add(staticPart);const s=staticPart,level=b.level||1,stone=0xb7b9a0,trim=0xd6cba4,roof=0x356b63,wood=0x87704e,gold=0xcca45f;
 artCyl(s,1.13,1.28,.26,0x737e6b,0,.2,0,8);artCyl(s,1.08,1.13,.12,trim,0,.4,0,8);
 if(b.type==='farm'){
  artBox(s,1.28,1.24,1.15,0xcab68d,0,1.04,0);for(const x of[-.6,.6])artBox(s,.1,1.35,1.22,wood,x,1.02,0);artBox(s,1.35,.1,1.2,wood,0,1.41,0);artBox(s,.3,.65,.04,0x484e3b,-.23,.81,.59);artBox(s,.3,.34,.05,0xf3c375,.33,1.11,.6).material=artMat(0xf3c375,true);
  const top=artCone(s,1.26,.92,b.branch==='market'?0xb37753:0x7c8b59,0,2.05,0,4);top.rotation.y=Math.PI/4;top.scale.z=.88;artBox(s,.19,.65,.19,0xa2997b,.4,2,-.25);
  for(let row=0;row<3;row++){artBox(s,.32,.07,1.16,0x655c3d,(row-1)*.43,.09,1.25);for(let i=0;i<5;i++){artCyl(s,.025,.035,.38,gold,(row-1)*.43,.27,.8+i*.2,4);artMesh(s,new T.OctahedronGeometry(.07),0xdeb969,(row-1)*.43,.48,.8+i*.2).scale.y=1.6;}}
  if(b.branch!=='market'){const sails=new T.Group();sails.position.set(0,2.06,.7);for(let i=0;i<4;i++){const arm=new T.Group();arm.rotation.z=i*Math.PI/2;sails.add(arm);artBox(arm,.065,1.14,.08,wood,0,.53,0);artBox(arm,.31,.7,.055,trim,.1,.75,.02);for(let j=0;j<3;j++)artBox(arm,.31,.035,.07,wood,.1,.51+j*.2,.06);}artCyl(sails,.16,.16,.18,gold).rotation.x=Math.PI/2;g.add(sails);bakeArt(sails);g.userData.sails=sails;}
  if(b.branch==='market'){for(const x of[-.9,.9])artCyl(s,.05,.05,1.65,wood,x,.85,1.16,6);for(let i=0;i<6;i++)artBox(s,.32,.09,1.35,i%2?0xe2cca1:0x669985,(i-2.5)*.32,1.68,1.14).rotation.x=.12;artBox(s,1.65,.55,.5,wood,0,.56,1.12);for(let i=0;i<5;i++)artRock(s,.13,i%2?0xd4a55e:0x98ad61,(i-2)*.29,.9,1.17);}
  if(b.branch==='granary'){artCyl(s,.5,.5,1.3,0xaf9d76,-1,1,-.4,10);artCone(s,.62,.6,roof,-1,1.93,-.4,10);for(const y of [.65,1.25])artCyl(s,.515,.515,.075,wood,-1,y,-.4,10);}
 }else if(b.type==='relay'){
  artCyl(s,.64,.86,.42,stone,0,.64,0,8);artCyl(s,.36,.62,1.3,0x7e9b90,0,1.48,0,6);artCyl(s,.66,.4,.24,trim,0,2.19,0,6);
  for(let i=0;i<4;i++){const a=i*Math.PI/2;artBeam(s,[Math.cos(a)*.8,.46,Math.sin(a)*.8],[Math.cos(a)*.48,2.2,Math.sin(a)*.48],.16,trim);artMesh(s,new T.OctahedronGeometry(.12),gold,Math.cos(a)*.77,.65,Math.sin(a)*.77);}
  const gem=new T.Group();gem.position.y=2.66;artMesh(gem,new T.OctahedronGeometry(.51),b.branch==='pulse'?0xedb565:0x81d9c2,0,0,0,true);const ring=artMesh(gem,new T.TorusGeometry(.75,.047,4,32),gold);ring.rotation.x=b.branch==='shelter'?Math.PI/2:.55;g.add(gem);g.userData.spire=gem;
  if(b.branch==='shelter'){for(const x of[-.92,.92]){artCyl(s,.09,.12,1.9,trim,x,1.25,0,6);artMesh(s,new T.OctahedronGeometry(.17),0x8cd0ac,x,2.3,0,true);}}
 }else{
  const height=1.72+level*.32;artCyl(s,.68,.9,height,stone,0,.47+height/2,0,8);for(let ring=0;ring<3;ring++)artCyl(s,.73-ring*.015,.73-ring*.015,.1,trim,0,.8+ring*.52,0,8);
  for(let i=0;i<4;i++){const a=i*Math.PI/2;artBox(s,.15,.54,.035,0x46594f,Math.sin(a)*.71,1.55,Math.cos(a)*.71).rotation.y=a;}
  const y=.47+height;artCyl(s,.96,.77,.34,trim,0,y,0,8);artCyl(s,.77,.77,.09,0x7c8470,0,y+.2,0,8);for(let i=0;i<8;i++){const a=i*Math.PI/4;artBox(s,.28,.39,.26,stone,Math.cos(a)*.8,y+.36,Math.sin(a)*.8).rotation.y=-a;}
  if(b.branch==='frost'){artCyl(s,.37,.49,.46,roof,0,y+.49,0,6);const gem=new T.Group();gem.position.y=y+1.08;artMesh(gem,new T.OctahedronGeometry(.44),0xa3dae8,0,0,0,true).scale.y=1.6;g.add(gem);g.userData.spire=gem;}
  else{const crossbow=new T.Group();crossbow.position.y=y+.49;s.add(crossbow);artBox(crossbow,.24,.22,b.branch==='ballista'?2:1.45,wood,0,0,.1);artBeam(crossbow,[-.85,.02,.42],[0,.02,.18],.1,gold);artBeam(crossbow, [0,.02,.18],[.85,.02,.42],.1,gold);artBeam(crossbow,[-.85,.02,.42],[0,.02,-.27],.026,0xd7d1b6);artBeam(crossbow,[0,.02,-.27],[.85,.02,.42],.026,0xd7d1b6);artBox(crossbow,.055,.055,1.7,0xd6d0ac,0,.15,.3);artCone(crossbow,.1,.26,0xdce2c9,0,.15,1.21,4).rotation.x=Math.PI/2;}
 }
 if(level>1){artCyl(s,.035,.05,1.4,gold,1.06,1.02,-.2,5);artBox(s,.43,.68,.03,roof,1.28,1.43,-.2);for(let i=0;i<level;i++)artMesh(s,new T.OctahedronGeometry(.055),gold,1.15+i*.12,1.52,-.17);}
 bakeArt(staticPart);return g;
}

export function refineUnit(g,def,enemy=false){
 const rig=g.userData.rig;if(!rig?.body)return;const {body,weapon,shield}=rig,key=def.key||'',metal=enemy?0x9f94a9:def.faction==='iron'?0xb6c8cd:0xd0c8a1,gold=enemy?0xb19aac:0xd5ae66,color=enemy?0x534355:new T.Color(def.color||'#efbd67').getHex();
 for(const side of[-1,1]){const pauldron=artRock(body,.22,metal,side*.36,.22,0,1.12,.62,1.12);pauldron.rotation.z=side*.2;artBox(body,.065,.35,.025,gold,side*.15,-.05,.218);artBox(body,.065,.045,.035,0x23332d,side*.09,.68,.21);artBox(body,.075,.1,.16,0xd8bd92,side*.225,.66,0);}
 artBox(body,.12,.075,.06,gold,0,-.24,.265);artBox(body,.31,.07,.09,metal,0,.47,.14);
 if(def.role==='guardian'||def.role==='lord'){
  const emblem=artMesh(shield,new T.OctahedronGeometry(.16),gold,-.18,.04,.28);emblem.scale.set(.35,1,1);artBox(weapon,.11,.085,.15,0x7d6747,0,-.17,.2);
  if(key==='bulwark'){for(const side of[-1,1])artCone(body,.14,.23,metal,side*.4,.54,0,4);artBox(body,.36,.33,.09,metal,0,.7,.17);artBox(body,.28,.045,.04,0x283b41,0,.74,.229);}
  if(def.role==='lord'){artBox(body,.16,.44,.05,0xf1cf79,0,.04,.24);artMesh(body,new T.OctahedronGeometry(.1),0xebf4d4,0,.2,.29);}
 }else{artBox(body,.36,.37,.17,color,0,-.1,-.36);artBox(body,.13,.06,.025,gold,0,-.13,-.452);}
 if(key==='pyromancer')for(const side of[-1,1])artMesh(body,new T.OctahedronGeometry(.12),0xf2b365,side*.25,.94,0,true);
 if(key==='artificer'){for(const side of[-1,1]){const glass=artMesh(body,new T.TorusGeometry(.077,.024,4,10),gold,side*.1,.71,.237);glass.rotation.y=0;}artCyl(body,.075,.075,.49,metal,.32,.03,-.35,6);}
 if(key==='thorn'){for(let i=0;i<3;i++)artCone(body,.12,.38,0xa0bb73,(i-1)*.17,.99,0,3).rotation.z=(i-1)*.4;}
 if(def.boss){for(const side of[-1,1])artCone(body,.18,.6,0xaf819b,side*.42,.5,-.06,5).rotation.z=-side*.4;artBox(body,.27,.32,.05,0xc185b2,0,.06,.25);}
 // Bake each independent bone separately so walking and attacks remain articulated.
 if(g.userData.gem)g.userData.gem.userData.noBake=true;
 for(const part of[rig.left,rig.right,weapon,shield])bakeArt(part);
 weapon.userData.noBake=shield.userData.noBake=true;bakeArt(body);
}

export function isSharedArtMaterial(material){return [...artMaterials.values()].includes(material);}
