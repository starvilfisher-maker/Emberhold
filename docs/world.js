import * as T from './vendor/three.module.js';
import {DEFS,WAVES} from './engine.js';
import {BIOMES,CHAPTERS,TERRAIN,CORE_PATHS,GEAR} from './content.js';
const palette={grass:0x708f69,edge:0x394c47,stone:0xccc3a1,roof:0x456c65,gold:0xe9be69,ember:0xeeae66,grove:0x8ecc9b,storm:0xafa3e6,iron:0x9cb9cc};
const materials=new Map();
function mat(c){if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.92,flatShading:true}));return materials.get(c);}
function mesh(g,c,x=0,y=0,z=0,parent){const m=new T.Mesh(g,mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;if(parent)parent.add(m);return m;}
function box(p,w,h,d,c,x=0,y=0,z=0){return mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p);}
function cyl(p,r1,r2,h,c,x=0,y=0,z=0,n=6){return mesh(new T.CylinderGeometry(r1,r2,h,n),c,x,y,z,p);}
function cone(p,r,h,c,x=0,y=0,z=0,n=5){return mesh(new T.ConeGeometry(r,h,n),c,x,y,z,p);}
export class World{
 constructor(canvas){this.canvas=canvas;this.scene=new T.Scene();this.scene.background=new T.Color(0x537e82);this.scene.fog=new T.FogExp2(0x537e82,.008);this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.18;this.camera=new T.OrthographicCamera();this.camera.position.set(26,37,32);this.camera.lookAt(0,0,1);this.raycaster=new T.Raycaster();this.groundPlane=new T.Plane(new T.Vector3(0,1,0),0);this.objects=new Map();this.hazardObjects=new Map();this.particlePool=[];this.windObjects=[];this.mapTheme=null;this.quality='balanced';this.motion=true;this.zoom=1;this.plots=[];this.crystals=[];this.particles=[];this.night=0;this.time=0;this.sun=new T.DirectionalLight(0xffefd0,3.2);this.sun.position.set(-18,35,8);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:90});this.sun.shadow.bias=-.0004;this.sun.shadow.normalBias=.06;this.scene.add(this.sun);this.ambient=new T.HemisphereLight(0xb4d9db,0x405b4a,2);this.scene.add(this.ambient);this.makeMap();this.makeCastle();this.enrichCastle();this.core=new T.Group();this.scene.add(this.core);this.coreGem=mesh(new T.OctahedronGeometry(.5),0xa0eed7,0,2,0,this.core);this.coreGem.material=new T.MeshStandardMaterial({color:0xc4ffe1,emissive:0x5bdab9,emissiveIntensity:1.3,flatShading:true});this.coreLight=new T.PointLight(0x8bfdd6,14,14);this.coreLight.position.y=2;this.core.add(this.coreLight);this.aura=mesh(new T.RingGeometry(7.85,7.92,96),0xb8e5c3,0,.07,0,this.scene);this.aura.rotation.x=-Math.PI/2;this.aura.material=new T.MeshBasicMaterial({color:0xade6c8,transparent:true,opacity:.24,side:T.DoubleSide,depthWrite:false});this.hero=this.unitModel({faction:'ember',role:'lord',color:'#efbd67'},1);this.hero.scale.setScalar(1.22);this.scene.add(this.hero);this.hero.position.set(0,0,5);this.selection=mesh(new T.RingGeometry(.78,.86,32),0xffe2a0,0,.09,0,this.scene);this.selection.rotation.x=-Math.PI/2;this.selection.material=new T.MeshBasicMaterial({color:0xffe2a0,side:T.DoubleSide});this.selection.visible=false;this.makeTactics();this.makeAtmosphere();this.resize();canvas.addEventListener('wheel',ev=>{ev.preventDefault();this.zoom=Math.max(.8,Math.min(1.45,this.zoom-ev.deltaY*.0007));this.camera.zoom=this.zoom;this.camera.updateProjectionMatrix();},{passive:false});window.addEventListener('resize',()=>this.resize());}
 makeTactics(){
  const material=new T.MeshBasicMaterial({color:0x9de8d0,transparent:true,opacity:.4,side:T.DoubleSide,depthWrite:false});
  this.range=new T.Mesh(new T.RingGeometry(.98,1,72),material);this.range.rotation.x=-Math.PI/2;this.range.visible=false;this.scene.add(this.range);
  this.previewTile=new T.Mesh(new T.PlaneGeometry(2.94,2.94),material.clone());this.previewTile.rotation.x=-Math.PI/2;this.previewTile.visible=false;this.scene.add(this.previewTile);
  this.previewUnit=null;this.previewId=null;this.entryMarkers=[];
  for(const [x,z] of [[-19,0],[19,0],[0,-14]]){
   const group=new T.Group();group.position.set(x,.18,z);group.rotation.y=Math.atan2(-x,-z);
   for(let i=0;i<3;i++){
    const points=[[-.7,0,-.5+i*.95],[0,0,.1+i*.95],[.7,0,-.5+i*.95]].map(p=>new T.Vector3(...p));
    group.add(new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0xffbf86,transparent:true,opacity:.85})));
   }
   this.scene.add(group);this.entryMarkers.push(group);
  }
 }
 setPlacementPreview(unit,result,point){
  this.previewTile.visible=!!unit;this.previewId=unit?.id||null;
  if(!unit){if(this.previewUnit)this.previewUnit.visible=false;return;}
  const sig=unit.def+unit.star;
  if(!this.previewUnit||this.previewUnit.userData.previewSig!==sig){
   if(this.previewUnit)this.removeObject(this.previewUnit);
   this.previewUnit=this.unitModel({...DEFS[unit.def],key:unit.def},unit.star);this.previewUnit.userData.previewSig=sig;this.scene.add(this.previewUnit);
  }
  const x=result.ok?result.x:Math.round(point.x/3.2)*3.2,z=result.ok?result.z:Math.round(point.z/3.2)*3.2;
  this.previewUnit.visible=true;this.previewUnit.position.set(x,.35,z);
  this.previewTile.position.set(x,.14,z);this.previewTile.material.color.set(result.ok?(result.otherId?0xeac377:0x86e9bd):0xf08d8d);this.previewTile.material.opacity=.46;
 }
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h);const a=w/h;let height=41;if(a<1)height=56/a;if(a>2.1)height=37;this.camera.left=-height*a/2;this.camera.right=height*a/2;this.camera.top=height/2;this.camera.bottom=-height/2;this.camera.near=.1;this.camera.far=180;this.camera.setViewOffset(w,h,0,h*(a<1?.015:.10),w,h);this.camera.updateProjectionMatrix();}
 makeMap(){let seed=81;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};const ground=new T.Group();this.scene.add(ground);const island=cyl(ground,24,22,2.6,palette.edge,0,-1.4,0,10);island.scale.z=.76;const top=cyl(ground,24,24,.24,palette.grass,0,-.12,0,10);top.material=top.material.clone();this.land=top;top.scale.z=.76;top.rotation.y=island.rotation.y=.15;const water=mesh(new T.PlaneGeometry(300,300),0x537e82,0,-3.2,0,this.scene);water.rotation.x=-Math.PI/2;water.material=new T.MeshStandardMaterial({color:0x46757b,roughness:.35,metalness:.15});this.water=water;
  for(let i=0;i<140;i++){const x=(rand()-.5)*44,z=(rand()-.5)*31;if(Math.abs(x)<14&&Math.abs(z)<11)continue;if(x*x/510+z*z/255>1)continue;if(Math.abs(z)<2.8||Math.abs(x)<2.8)continue;if(rand()<.7){this.tree(x,z,.65+rand()*.85,rand());}else{const rock=mesh(new T.DodecahedronGeometry(.5+rand()*.7,0),rand()>.5?0x899b87:0xa7af98,x,.15,z,this.scene);rock.scale.y=.6;}}
  for(let j=0;j<90;j++){let x=(rand()-.5)*44,z=(rand()-.5)*30;if(Math.abs(x)<2.5||Math.abs(z)<2.5||x*x/490+z*z/230>1)continue;const tuft=new T.Group();for(let k=0;k<3;k++){const leaf=cone(tuft,.08,.35+rand()*.3,0x9daf7d,k*.12,0,0,3);leaf.rotation.z=(k-1)*.3;}tuft.position.set(x,.05,z);this.scene.add(tuft);}
  for(const axis of [0,1]){const path=box(this.scene,axis?3.2:44,.035,axis?32:3.2,0xb8ac82,0,.018,0);path.receiveShadow=true;for(let i=-10;i<=10;i++){const tile=box(this.scene,axis?2.8:1.2,.045,axis?1.2:2.8,0xc3b58d,axis?0:i*1.9,.04,axis?i*1.55:0);tile.rotation.y=(rand()-.5)*.09;}}
  for(let r=0;r<5;r++)for(let c=0;c<7;c++){const x=(c-3)*3.2,z=(r-2)*3.2;if(Math.hypot(x,z)<2.4)continue;const g=new T.Group();g.position.set(x,.055,z);const fill=mesh(new T.PlaneGeometry(2.92,2.92),0xc2d19d,0,0,0,g);fill.rotation.x=-Math.PI/2;fill.material=new T.MeshBasicMaterial({color:0xc2d19d,transparent:true,opacity:.055,depthWrite:false});const points=[[-1.46,0,-1.46],[1.46,0,-1.46],[1.46,0,1.46],[-1.46,0,1.46],[-1.46,0,-1.46]].map(a=>new T.Vector3(...a));const lines=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0xcedeb3,transparent:true,opacity:.27}));g.add(lines);this.scene.add(g);this.plots.push({x,z,g,fill});}
  for(const [x,z]of [[-11,-7],[11,-7],[-11,7],[11,7],[0,-11],[0,11]]){const g=new T.Group();g.position.set(x,0,z);cyl(g,1.3,1.42,.2,0x8d9980,0,.08,0,8);const ring=mesh(new T.RingGeometry(1.06,1.14,8),0xf6d894,0,.2,0,g);ring.rotation.x=-Math.PI/2;ring.material=new T.MeshBasicMaterial({color:0xdcca95,side:T.DoubleSide});box(g,.7,.05,.12,0xdccc9c,0,.22,0);box(g,.12,.05,.7,0xdccc9c,0,.22,0);this.scene.add(g);}
  for(const[x,z,rot]of[[-24,0,0],[24,0,0],[0,-18,Math.PI/2]]){const bridge=new T.Group();for(let i=0;i<8;i++)box(bridge,.65,.22,3.5,0x8c7960,(i-3.5)*.72,0,0);for(const s of[-1,1]){box(bridge,6,.16,.16,0xb1a17c,0,.8,s*1.65);for(let i=0;i<3;i++)box(bridge,.18,1.2,.18,0x8b7c62,(i-1)*2.6,.3,s*1.65);}bridge.position.set(x,-.06,z);bridge.rotation.y=rot;this.scene.add(bridge);}
  for(const[x,z]of[[-15,3],[15,-3],[3,-13]]){cyl(this.scene,.17,.23,1.6,0x726856,x,.8,z);const gem=mesh(new T.OctahedronGeometry(.25),0xffd882,x,1.75,z,this.scene);gem.material=new T.MeshStandardMaterial({color:0xffd58a,emissive:0xff9a30,emissiveIntensity:1.5});const l=new T.PointLight(0xffbd60,5,8);l.position.set(x,2,z);this.scene.add(l);}
 }
 tree(x,z,s,t){const g=new T.Group();cyl(g,.14,.24,1.5,0x6b6350,0,.65,0,5);const col=t>.6?0xa9ad70:t>.3?0x54785a:0x3c6555;cone(g,1.25,2.7,col,0,2.1,0,5);cone(g,.9,2.1,col,0,3.1,0,5);g.position.set(x,0,z);g.scale.setScalar(s);g.rotation.y=t*6;this.scene.add(g);this.windObjects.push(g);}
 makeCastle(){const g=new T.Group();cyl(g,2.45,2.55,.35,0x8e9e84,0,.18,0,8);box(g,2.6,2.3,2.1,palette.stone,0,1.5,0);box(g,1.8,1.7,1.6,0xe1d6b0,0,3.5,-.2);cone(g,1.65,1.6,palette.roof,0,4.9,-.2,4).rotation.y=Math.PI/4;box(g,.55,1,.08,0x475b51,0,1.0,1.07);for(const x of[-1.7,1.7])for(const z of[-1.25,1.25]){cyl(g,.52,.64,2.5,0xb8b697,x,1.45,z,6);cone(g,.72,1.3,palette.roof,x,3.25,z,6);}cyl(g,.05,.05,2,0xd7c18a,0,5.6,-.2);const flag=box(g,.8,.45,.04,0xdda65a,.4,6.2,-.2);this.flag=flag;this.castle=g;this.scene.add(g);}
 unitModel(def,star=1,enemy=false){
  const g=new T.Group(),key=def.key||'',type=def.archetype||'',color=enemy?(def.boss?0x9a638e:type==='healer'?0x738f98:type==='assassin'?0x484960:0x735c76):new T.Color(def.color||'#efbd67').getHex();
  const metal=enemy?0x9e9bab:0xb7cebe,skin=enemy?0xc6bdba:0xf1d8b0,dark=enemy?0x35354c:0x344d48;
  if(type==='siege'){
   box(g,1.25,.4,1.7,0x514151,0,.65,0);box(g,.8,.65,1.6,0x978c88,0,1,0);const barrel=cyl(g,.23,.3,2.4,0x463e51,0,1.4,.5);barrel.rotation.x=Math.PI/2;
   const wheels=[];for(const x of [-.8,.8])for(const z of [-.55,.55]){const wheel=cyl(g,.38,.38,.15,0x746956,x,.42,z,8);wheel.rotation.z=Math.PI/2;wheels.push(wheel);}g.userData.rig={wheels,type};
  }else{
   const body=new T.Group();body.position.y=.95;g.add(body);
   const heavy=key==='bulwark'||def.armored,width=heavy?.79:.56;
   box(body,width,.68,.4,color,0,0,0);box(body,width+.04,.12,.44,metal,0,.18,0);box(body,.2,.17,.06,0xdcc492,0,-.21,.24);
   const cape=cone(body,.48,1.05,color,0,-.12,-.24,4);cape.scale.z=.5;cape.rotation.y=Math.PI/4;
   box(body,.37,.4,.37,skin,0,.64,0);box(body,.4,.14,.39,dark,0,.83,-.02);box(body,.29,.045,.03,dark,0,.67,.19);
   const left=new T.Group(),right=new T.Group();left.position.set(-.18,.59,0);right.position.set(.18,.59,0);g.add(left,right);
   for(const leg of [left,right]){box(leg,.19,.45,.21,dark,0,-.25,0);box(leg,.21,.13,.33,metal,0,-.49,.06);}
   const weapon=new T.Group();weapon.position.set(width/2+.13,.03,0);body.add(weapon);box(weapon,.19,.39,.2,color,0,-.05,0);
   const shield=new T.Group();shield.position.set(-width/2-.12,0,0);body.add(shield);box(shield,.18,.4,.2,color,0,0,0);
   if(def.boss){box(body,.54,.21,.49,0xddbf82,0,.93,0);for(let i=-1;i<=1;i++)cone(body,.12,.33,0xedc87f,i*.22,1.16,0,4);box(weapon,.14,1.55,.15,0xd6bac5,.05,.3,.19);box(weapon,.65,.42,.17,0x9c849e,.12,.96,.2);box(shield,.21,.8,.67,0x6a526f,-.1,0,.2);}
   else if(def.role==='lord'){box(body,.47,.15,.42,0xeec66b,0,.94,0);for(let i=-1;i<=1;i++)box(body,.08,.19,.1,0xf7d67d,i*.16,1.08,.14);box(weapon,.1,1.14,.1,0xe4d8a7,0,.33,.2);box(weapon,.32,.07,.12,0xbd995c,0,-.05,.2);}
   else if(type==='assassin'){cone(body,.4,.47,dark,0,.96,-.06,5);for(const arm of [weapon,shield]){box(arm,.08,.65,.09,0xb6a7c5,0,.17,.3);}body.scale.y=.92;}
   else if(def.role==='guardian'&&!def.healer){
    const tower=key==='bulwark';box(shield,.15,tower?1.18:.72,tower?.73:.59,key==='warden'?0x597953:metal,-.09,-.01,.18);box(shield,.17,.16,.22,0xe3c28c,-.1,.05,.2);
    if(key==='tempest'){cyl(weapon,.045,.045,1.8,0xc7b7e4,0,.24,.17,5);cone(weapon,.17,.48,0xd9ccfa,0,1.3,.17,4);}else{box(weapon,.1,.92,.11,metal,0,.35,.19);box(weapon,.32,.07,.13,0xbc9f66,0,.03,.19);}
    box(body,width+.03,.19,.43,color,0,.91,0);
    if(key==='warden')for(const x of [-.27,.27]){const antler=cyl(body,.035,.06,.5,0xc2c795,x,1.13,0,4);antler.rotation.z=x>0?-.4:.4;cone(body,.13,.3,0x90bb82,x,1.46,0,3);}
    if(tower){box(body,.91,.21,.48,metal,0,.36,0);body.scale.set(1.06,1.06,1.06);}
   }else if(key==='gunner'){
    const barrel=cyl(weapon,.21,.25,.93,0x526673,0,-.03,.42,8);barrel.rotation.x=Math.PI/2;box(weapon,.25,.12,.65,0xb9a57c,0,.18,.4);box(body,.45,.12,.43,metal,0,.94,0);
   }else if(def.role==='caster'||def.healer){
    if(key==='artificer'){box(body,.42,.6,.35,0x596c73,0,-.02,-.42);cyl(weapon,.055,.055,.86,0xab9471,0,.12,.17);box(weapon,.47,.3,.32,metal,0,.58,.17);box(body,.47,.13,.42,0xd4bb80,0,.94,0);}
    else{cyl(weapon,.045,.045,1.65,0xab987b,0,.27,.13,5);const gem=mesh(new T.OctahedronGeometry(.22),color,0,1.19,.13,weapon);gem.material=new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.5,flatShading:true});cone(body,.4,.55,color,0,1.05,-.04,5);g.userData.gem=gem;}
   }else{
    if(key==='archer'){box(weapon,.16,.13,.66,0x896e50,0,.05,.32);box(weapon,.62,.09,.12,metal,0,.05,.47);}
    else{const bow=mesh(new T.TorusGeometry(.35,.043,4,12,Math.PI),key==='thorn'?0x9fb98b:0xd0b287,0,.1,.24,weapon);bow.rotation.z=-Math.PI/2;const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0,-.25,.24),new T.Vector3(0,.45,.24)]),new T.LineBasicMaterial({color:0xd8d8b7}));weapon.add(line);}
    cone(body,.34,.36,color,0,.98,-.04,5);box(body,.18,.6,.2,0x766846,-.24,.05,-.34);
   }
   g.userData.rig={body,left,right,weapon,shield,type};
  }
  const shadow=mesh(new T.CircleGeometry(.5,16),0x152b28,0,.035,0,g);shadow.rotation.x=-Math.PI/2;shadow.material=new T.MeshBasicMaterial({color:0x152b28,opacity:.2,transparent:true,depthWrite:false});
  const hit=mesh(new T.RingGeometry(.44,.62,16),0xffffff,0,.06,0,g);hit.rotation.x=-Math.PI/2;hit.material=new T.MeshBasicMaterial({color:enemy?0xffc6ad:0xe8f6c9,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide});g.userData.hit=hit;
  if(star>1){const crown=mesh(new T.TorusGeometry(.33,.04,4,18),0xffd86f,0,2.22,0,g);crown.rotation.x=Math.PI/2;g.scale.setScalar(1+(star-1)*.16);for(let i=0;i<star;i++)mesh(new T.OctahedronGeometry(.07),0xffd86f,(i-(star-1)/2)*.18,2.43,0,g);}
  if(def.boss)g.scale.setScalar(2.15);return g;
 }
 buildingModel(b){const g=new T.Group();const level=b.level||1;cyl(g,1.1,1.2,.45,0xb4b093,0,.25,0,6);if(b.type==='farm'){box(g,1.3,1.05,1.2,0xd0be90,0,.9,0);cone(g,1.2,.9,0xcbb173,0,1.85,0,4).rotation.y=Math.PI/4;for(let i=0;i<3;i++)box(g,.18,.1,1.1,0xd7b465,(i-1)*.36,.08,1.3);}else if(b.type==='relay'){cyl(g,.45,.65,1.6,0x839c8c,0,1.1,0,6);const gem=mesh(new T.OctahedronGeometry(.58),0xa3e5d4,0,2.5,0,g);gem.material=new T.MeshStandardMaterial({color:0x95e9d2,emissive:0x458e84,emissiveIntensity:1.2});}else{cyl(g,.7,.95,2+level*.2,0xb7b99c,0,1.5,0,6);cyl(g,.95,.95,.35,0xe0d4ad,0,2.5+level*.2,0,6);for(let i=0;i<6;i++){const a=i*Math.PI/3;box(g,.3,.45,.3,0xcac9a5,Math.cos(a)*.79,2.8+level*.2,Math.sin(a)*.79);}box(g,.15,.16,1.3,0x6a7963,0,2.9+level*.2,0);box(g,1.05,.12,.15,0x947f55,0,2.9+level*.2,.45);}if(b.branch==='frost'||b.branch==='pulse'){const jewel=mesh(new T.OctahedronGeometry(.37),b.branch==='frost'?0xb0e4eb:0xeac18e,0,3.9,0,g);jewel.material=new T.MeshStandardMaterial({color:b.branch==='frost'?0xade9f1:0xf5c987,emissive:0x3b6579,emissiveIntensity:1});}if(b.branch==='ballista'){box(g,2.25,.18,.22,0x665b45,0,3.4,.3);box(g,.22,.17,2.1,0x9a8562,0,3.4,.3);}if(b.branch==='shelter'){const ring=mesh(new T.TorusGeometry(.7,.06,5,24),0x98d2b2,0,2.7,0,g);ring.rotation.x=Math.PI/2;}if(b.branch==='market'){box(g,1.9,.1,1.2,0xb5865a,0,1.55,1.1);for(const x of [-.8,.8])cyl(g,.06,.06,1.5,0xa58f67,x,.75,1.5);}if(b.type==='farm'){const sails=new T.Group();sails.position.set(0,2,1);box(sails,2.25,.14,.07,0xe3d6ae);box(sails,.14,2.25,.07,0xe3d6ae);g.add(sails);g.userData.sails=sails;}if(level>1){cyl(g,.12,.12,1,0xe3b86c,1.1,.6,0);box(g,.48,.3,.03,0xeac171,1.35,1,0);}return g;}
 groundAt(cx,cy){const r=this.canvas.getBoundingClientRect();this.raycaster.setFromCamera(new T.Vector2((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1),this.camera);const v=new T.Vector3();if(this.raycaster.ray.intersectPlane(this.groundPlane,v))return{x:v.x,z:v.z};return null;}
 screenAt(x,z,y=1){const v=new T.Vector3(x,y,z).project(this.camera);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};}
 enrichCastle(){
  const g=this.castle;
  for(const x of [-.58,.58]){const window=box(g,.22,.48,.07,0xf4d396,x,3.55,.63);window.material=new T.MeshStandardMaterial({color:0xffdf9b,emissive:0xffb964,emissiveIntensity:.7});}
  for(const x of [-1.75,1.75]){box(g,.12,.94,.07,0xcfaa63,x,1.72,1.91);box(g,.37,.67,.07,0xc4a260,x,2.03,1.91);}
  for(let i=0;i<14;i++){const angle=i/14*Math.PI*2,x=Math.cos(angle)*2.55,z=Math.sin(angle)*2.55;if(z>1.9&&Math.abs(x)<1.2)continue;const merlon=box(g,.4,.45,.35,0xc1c3a2,x,.52,z);merlon.rotation.y=-angle;}
  for(const [x,z,r]of [[-14,-5,.25],[14,5,-.3]]){const camp=new T.Group();box(camp,1.45,.7,1.3,0xa59973,0,.4,0);const roof=cone(camp,1.32,.85,0x7c8f6b,0,1.08,0,4);roof.rotation.y=Math.PI/4;box(camp,.3,.5,.04,0x394e45,0,.43,.67);for(const offset of [-1,1])cyl(camp,.14,.17,.6,0x947956,offset,.3,.9,5);camp.position.set(x,0,z);camp.rotation.y=r;this.scene.add(camp);}
 }
 configure(options={}){
  const previous=this.configuredQuality;this.quality=options.quality||'balanced';this.motion=options.motion!==false;if(previous===this.quality)return;this.configuredQuality=this.quality;
  const ratio=this.quality==='low'?1:this.quality==='high'?2:1.5;this.renderer.setPixelRatio(Math.min(devicePixelRatio,ratio));
  this.renderer.shadowMap.enabled=this.quality!=='low';this.sun.shadow.mapSize.set(this.quality==='high'?2048:1024,this.quality==='high'?2048:1024);
  if(this.sun.shadow.map){this.sun.shadow.map.dispose();this.sun.shadow.map=null;}this.renderer.shadowMap.needsUpdate=true;
  this.scene.traverse(o=>{if(o.material){const list=Array.isArray(o.material)?o.material:[o.material];for(const m of list)m.needsUpdate=true;}});
 }
 makeAtmosphere(){
  this.terrainGroup=new T.Group();this.scene.add(this.terrainGroup);
  for(const p of TERRAIN){const g=new T.Group();g.position.set(p.x,.07,p.z);const edge=mesh(new T.RingGeometry(1.1,1.18,4),0xe9c57f,0,.02,0,g);edge.rotation.x=-Math.PI/2;edge.rotation.z=Math.PI/4;for(const x of [-1,1])for(const z of [-1,1]){const mark=box(g,.22,.04,.22,0xc8ae75,x,.04,z);mark.rotation.y=Math.PI/4;}this.terrainGroup.add(g);}
  this.scenery=new T.Group();this.scene.add(this.scenery);this.snowCaps=[];
  for(const tree of this.windObjects){const cap=cone(tree,.7,1.4,0xd4e5df,0,3.5,0,5);cap.visible=false;this.snowCaps.push(cap);}
  for(const [x,z] of [[-16,-8],[17,8],[9,-13]]){const banner=new T.Group();cyl(banner,.055,.07,2.8,0x917752,0,1.4,0,5);const cloth=box(banner,.65,1.1,.05,0xd5b16e,.34,2.15,0);cloth.userData.banner=true;banner.position.set(x,0,z);this.scenery.add(banner);}
  const flowers=new T.InstancedMesh(new T.OctahedronGeometry(.13),mat(0xdcd1a0),72);const matrix=new T.Matrix4();for(let i=0;i<72;i++){const a=i*2.39996,r=14+i%5;matrix.makeTranslation(Math.cos(a)*r,.16,Math.sin(a)*r*.7);flowers.setMatrixAt(i,matrix);}this.scenery.add(flowers);this.flowers=flowers;
  const count=100,positions=new Float32Array(count*3);for(let i=0;i<count;i++){positions[i*3]=Math.sin(i*12.73)*23;positions[i*3+1]=(i%17)/17*12;positions[i*3+2]=Math.cos(i*4.63)*17;}
  this.moteGeometry=new T.BufferGeometry();this.moteGeometry.setAttribute('position',new T.BufferAttribute(positions,3));this.motes=new T.Points(this.moteGeometry,new T.PointsMaterial({color:0xf4daaa,size:.09,transparent:true,opacity:.6,depthWrite:false}));this.scene.add(this.motes);
  this.ruinDecor=new T.Group();for(const [x,z] of [[-17,8],[16,-8],[-7,-14]]){const group=new T.Group();group.position.set(x,0,z);cyl(group,.45,.55,2.4,0xcbb98c,0,1.2,0,6);box(group,1.15,.3,1,0xd6c49b,0,2.45,0);const fallen=cyl(group,.35,.4,2,0xb4a17b,1,.3,.5,6);fallen.rotation.z=1.2;this.ruinDecor.add(group);}this.scene.add(this.ruinDecor);
 }
 setTheme(id){
  if(this.mapTheme===id)return;this.mapTheme=id;const biome=BIOMES[id]||BIOMES.meadow;this.land.material.color.set(biome.ground);this.snowCaps.forEach(c=>c.visible=id==='frost');this.ruinDecor.visible=id==='ruins';this.flowers.visible=id==='meadow';this.motes.material.color.set(id==='frost'?0xe5f3f2:id==='ruins'?0xf2cc91:0xe1eabb);this.motes.material.size=id==='frost'?.12:.08;
 }
 acquireParticle(kind,color){
  let m=this.particlePool.find(m=>!m.visible&&m.userData.kind===kind);
  if(!m){if(this.particlePool.length>=180)return null;const geometry=kind==='shot'?new T.SphereGeometry(.1,5,4):kind==='spark'?new T.OctahedronGeometry(.12):new T.RingGeometry(.78,1,36);m=new T.Mesh(geometry,new T.MeshBasicMaterial({color,transparent:true,opacity:1,side:T.DoubleSide,depthWrite:false}));m.userData.kind=kind;this.particlePool.push(m);this.scene.add(m);}
  m.visible=true;m.material.color.set(color);m.material.opacity=1;m.scale.setScalar(1);m.rotation.set(kind==='ring'?-Math.PI/2:0,0,0);return m;
 }
 effect(ev){
  const limit=this.quality==='low'?45:this.quality==='high'?150:90;if(this.particles.length>=limit)return;
  const colors={enemy:0xec94a3,enemyHeal:0xb5a5e9,heal:0x91e6b6,ember:0xf5b676,grove:0xa8d695,storm:0xc5b6f1,iron:0xc0d7e2};
  if(ev.type==='shot'){const m=this.acquireParticle('shot',colors[ev.color]||0xffe1a2);if(!m)return;m.position.set(ev.x,ev.y||1.3,ev.z);this.particles.push({m,t:0,d:.22,from:[ev.x,ev.y||1.3,ev.z],to:[ev.tx,.95,ev.tz],kind:'shot'});}
  else if(['burst','nova','impact','death'].includes(ev.type)){const m=this.acquireParticle('ring',ev.type==='impact'?0xf08481:ev.type==='nova'?0x98edd2:colors[ev.color]||0xffd189);if(!m)return;m.position.set(ev.x,.17,ev.z);this.particles.push({m,t:0,d:ev.type==='impact'?.55:.65,kind:'ring',size:ev.radius||1.8});if(this.motion&&this.quality!=='low'){const n=ev.type==='burst'?3:9;for(let i=0;i<n;i++){const mote=this.acquireParticle('spark',ev.type==='death'?0xb59acb:ev.type==='impact'?0xf6a096:0xf4d39c);if(!mote)break;const angle=i*6.283/n+this.time,spread=ev.radius||1.8;mote.position.set(ev.x,.7,ev.z);this.particles.push({m:mote,t:0,d:.6+i%3*.12,kind:'spark',from:[ev.x,.7,ev.z],vx:Math.cos(angle)*spread*1.5,vz:Math.sin(angle)*spread*1.5,vy:2+i%3});}}}
 }
 animateUnit(o,e,dt){
  const rig=o.userData.rig;if(!rig)return;const step=this.time*(e.kind?9:12)+(Number(e.id?.slice(1))||0),walk=e.moving?1:0,attack=Math.sin(Math.min(1,(e.attackAnim||0)/.18)*Math.PI),hit=(e.hit||0)/.16;
  if(rig.wheels){for(const wheel of rig.wheels)wheel.rotation.x+=walk*dt*4;}
  if(rig.body){rig.left.rotation.x=Math.sin(step)*.55*walk;rig.right.rotation.x=-Math.sin(step)*.55*walk;rig.body.position.y=.95+(this.motion?Math.abs(Math.sin(step))*.06*walk:0);rig.body.rotation.z=Math.sin(step)*.045*walk+hit*.1;rig.body.rotation.x=-attack*.17;rig.weapon.rotation.x=-attack*1.15;rig.weapon.rotation.z=-attack*.3;rig.shield.rotation.x=attack*.3;}
  if(o.userData.hit){o.userData.hit.material.color.set(e.stun>0?0xbccfff:e.kind?0xffc6ad:0xe8f6c9);o.userData.hit.material.opacity=e.stun>0?.7:hit*.75;o.userData.hit.scale.setScalar(1+hit*.4);}
  if(o.userData.gem)o.userData.gem.rotation.y=this.time*.8;
 }
 syncHazards(state){
  const ids=new Set();for(const mark of state.hazards||[]){ids.add(mark.id);let group=this.hazardObjects.get(mark.id);if(!group){group=new T.Group();const ring=new T.Mesh(new T.RingGeometry(.91,1,64),new T.MeshBasicMaterial({color:0xff716f,side:T.DoubleSide,transparent:true,opacity:.85,depthWrite:false}));ring.rotation.x=-Math.PI/2;const fill=new T.Mesh(new T.CircleGeometry(1,48),new T.MeshBasicMaterial({color:0xe74767,side:T.DoubleSide,transparent:true,opacity:.18,depthWrite:false}));fill.rotation.x=-Math.PI/2;fill.position.y=.01;group.add(ring,fill);this.scene.add(group);this.hazardObjects.set(mark.id,group);}group.position.set(mark.x,.23,mark.z);group.scale.setScalar(mark.radius);const progress=1-mark.timer/mark.duration;group.children[1].scale.setScalar(Math.max(.02,progress));group.children[1].material.opacity=.12+progress*.35;}
  for(const[id,o]of this.hazardObjects)if(!ids.has(id)){this.removeObject(o);this.hazardObjects.delete(id);}
 }

 sync(state,defs,dt,selected){this.time+=dt;this.setTheme(state.biome||'meadow');this.syncHazards(state);this.terrainGroup.visible=!state.legacy&&state.phase==='day';const targetNight=state.phase==='night'?1:0;this.night+=(targetNight-this.night)*Math.min(dt*1.5,1);const bg=new T.Color(state.biome==='frost'?0x819aac:state.biome==='ruins'?0x998674:0x537e82).lerp(new T.Color(0x172b47),this.night);this.scene.background.copy(bg);this.scene.fog.color.copy(bg);this.sun.intensity=3.2-this.night*2.6;this.sun.color.set(0xffefd0).lerp(new T.Color(0x9bacf2),this.night);this.ambient.intensity=2-this.night*.95;this.water.material.color.set(0x46757b).lerp(new T.Color(0x152d46),this.night);this.flag.rotation.y=this.motion?Math.sin(this.time*2)*.1:0;for(let i=0;i<this.windObjects.length;i++){const tree=this.windObjects[i];tree.rotation.z=this.motion?Math.sin(this.time*1.4+i)*.012:0;}for(const banner of this.scenery.children)if(banner.isGroup)for(const cloth of banner.children)if(cloth.userData.banner)cloth.rotation.y=this.motion?Math.sin(this.time*2+banner.position.x)*.14:0;this.motes.visible=this.motion&&this.quality!=='low';if(this.motes.visible){const positions=this.moteGeometry.attributes.position;for(let i=0;i<positions.count;i++){let y=positions.getY(i)+(state.biome==='frost'?-.9:.18)*dt;if(y>12)y=0;if(y<0)y=12;positions.setY(i,y);positions.setX(i,positions.getX(i)+Math.sin(this.time*.3+i)*dt*.07);}positions.needsUpdate=true;}this.coreGem.material.color.set(CORE_PATHS[state.core.path]?.color||'#a0eed7');this.core.position.set(state.core.x,0,state.core.z);this.coreGem.position.y=2+Math.sin(this.time*2)*.18;this.coreGem.rotation.y=this.time*.6;this.aura.position.set(state.core.x,.08,state.core.z);this.aura.scale.setScalar((state.core.radius||8)/7.9);this.aura.material.opacity=.14+this.night*.15;this.hero.visible=state.hero.hp>0;this.hero.position.set(state.hero.x,0,state.hero.z);if(state.hero.angle!==undefined)this.hero.rotation.y=state.hero.angle;this.animateUnit(this.hero,state.hero,dt);const ids=new Set();for(const e of[...state.units.filter(u=>u.slot!==null&&u.hp>0),...state.enemies,...state.buildings.filter(b=>b.hp>0)]){ids.add(e.id);const key=e.type?'building':e.kind?'enemy':'unit';let o=this.objects.get(e.id);const sig=key+(e.def||e.archetype||'')+(e.star||1)+(e.type||'')+(e.level||1)+(e.branch||'')+(e.gear||'');if(o&&o.userData.sig!==sig){this.removeObject(o);this.objects.delete(e.id);o=null;}if(!o){o=key==='building'?this.buildingModel(e):this.unitModel(key==='enemy'?{role:e.ranged||e.healer?'caster':'guardian',boss:e.boss,armored:e.armored,healer:e.healer,archetype:e.archetype}:{...defs[e.def],key:e.def},e.star||1,key==='enemy');o.userData.sig=sig;if(e.gear){const charm=mesh(new T.OctahedronGeometry(e.gear==='echo'?.19:.14),new T.Color(GEAR[e.gear].color).getHex(),.38,1.88,-.2,o);charm.userData.charm=true;if(e.gear==='plate')box(o,.65,.15,.55,0xc7d9cf,0,1.32,0);if(e.gear==='lens'){const lens=mesh(new T.TorusGeometry(.15,.025,5,16),0xe9d593,0,1.64,.23,o);}}this.scene.add(o);this.objects.set(e.id,o);}o.userData.dying=0;o.rotation.z=0;o.visible=e.id!==this.previewId;o.position.set(e.x,0,e.z);if(key!=='building'){o.rotation.y=e.angle||0;this.animateUnit(o,e,dt);}if(o.userData.sails&&this.motion)o.userData.sails.rotation.z+=dt*.8;if(e.hp<e.maxHp){if(!o.userData.hp){const back=box(o,.85,.055,.035,0x253734,0,2.2,0);const bar=box(o,.8,.045,.05,key==='enemy'?0xd68b9c:0xb7d7a8,0,2.2,.015);o.userData.hp=[back,bar];}o.userData.hp[1].scale.x=Math.max(.01,e.hp/e.maxHp);}else if(o.userData.hp){o.userData.hp.forEach(m=>m.visible=false);}if(o.userData.hp&&e.hp<e.maxHp)o.userData.hp.forEach(m=>m.visible=true);}
 for(const[id,o]of this.objects)if(!ids.has(id)){if(state.phase==='night'&&this.motion&&o.userData.rig){o.userData.dying=(o.userData.dying||0)+dt;o.rotation.z+=dt*2;o.position.y-=dt*.75;if(o.userData.dying<.35)continue;}this.removeObject(o);this.objects.delete(id);}this.selection.visible=false;if(selected){const u=state.units.find(u=>u.id===selected);if(u&&u.slot!==null){this.selection.visible=true;this.selection.position.set(u.x,.09,u.z);}}
 this.range.visible=false;const focus=state.units.find(u=>u.id===selected);
 if(state.phase==='day'&&focus&&(focus.slot||this.previewId)){this.range.visible=true;this.range.scale.setScalar(defs[focus.def].range+(focus.gear==='lens'?2:0)+(!state.legacy&&focus.slot&&TERRAIN.some(p=>Math.hypot(p.x-focus.slot.x,p.z-focus.slot.z)<.1)?1.5:0));const p=this.previewId?this.previewTile.position:focus;this.range.position.set(p.x,.12,p.z);}
 const wave=(state.legacy?WAVES:CHAPTERS)[state.round-1];for(const marker of this.entryMarkers){marker.visible=['day','night'].includes(state.phase)&&wave.dirs.some(([x,z])=>Math.sign(x)===Math.sign(marker.position.x)&&Math.sign(z)===Math.sign(marker.position.z));for(const arrow of marker.children)arrow.material.opacity=.55+Math.sin(this.time*2)*.2;}
 for(const p of this.plots){p.g.visible=state.phase==='day';const occupied=state.units.some(u=>u.slot&&Math.abs(u.slot.x-p.x)<.1&&Math.abs(u.slot.z-p.z)<.1);p.fill.material.opacity=occupied?.13:selected?.15:.045;p.fill.material.color.set(occupied?0xe3c98b:0xd2dfb1);}
 for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.t+=dt;const k=Math.min(p.t/p.d,1);if(p.kind==='shot'){p.m.position.set(p.from[0]+(p.to[0]-p.from[0])*k,p.from[1]+(p.to[1]-p.from[1])*k+Math.sin(k*Math.PI)*.45,p.from[2]+(p.to[2]-p.from[2])*k);}else if(p.kind==='spark'){p.m.position.set(p.from[0]+p.vx*p.t,p.from[1]+p.vy*p.t-4*p.t*p.t,p.from[2]+p.vz*p.t);p.m.rotation.x+=dt*5;p.m.rotation.z+=dt*3;p.m.material.opacity=1-k;p.m.scale.setScalar(1-k*.7);}else{p.m.scale.setScalar(.2+k*p.size);p.m.material.opacity=(1-k)*.7;}if(k>=1){p.m.visible=false;this.particles.splice(i,1);}}
 this.renderer.render(this.scene,this.camera);}
 removeObject(o){this.scene.remove(o);const shared=new Set(materials.values());o.traverse(m=>{if(m.geometry)m.geometry.dispose();if(m.material&&!shared.has(m.material))m.material.dispose();});}
}
