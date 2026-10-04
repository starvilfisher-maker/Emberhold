import * as T from './vendor/three.module.js';
import {ART_THEMES,createLandscape,animateLandscape,disposeArt,createKeep,createStructure,refineUnit,isSharedArtMaterial} from './art.js';
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
 constructor(canvas){this.canvas=canvas;this.scene=new T.Scene();this.scene.background=new T.Color(0x537e82);this.scene.fog=new T.FogExp2(0x537e82,.006);this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.04;this.camera=new T.OrthographicCamera();this.camera.position.set(26,37,32);this.camera.lookAt(0,0,1);this.raycaster=new T.Raycaster();this.groundPlane=new T.Plane(new T.Vector3(0,1,0),0);this.objects=new Map();this.hazardObjects=new Map();this.particlePool=[];this.windObjects=[];this.mapTheme=null;this.quality='balanced';this.motion=true;this.zoom=1;this.plots=[];this.crystals=[];this.particles=[];this.night=0;this.time=0;this.sun=new T.DirectionalLight(0xffefd0,3.2);this.sun.position.set(-18,35,8);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:90});this.sun.shadow.bias=-.0004;this.sun.shadow.normalBias=.06;this.scene.add(this.sun);this.ambient=new T.HemisphereLight(0xc3e2ed,0x3c493b,1.4);this.scene.add(this.ambient);this.rim=new T.DirectionalLight(0x9bc7d1,.8);this.rim.position.set(10,12,-18);this.scene.add(this.rim);this.makeMap();this.makeCastle();this.core=new T.Group();this.scene.add(this.core);this.coreGem=mesh(new T.OctahedronGeometry(.5),0xa0eed7,0,2,0,this.core);this.coreGem.material=new T.MeshStandardMaterial({color:0xc4ffe1,emissive:0x5bdab9,emissiveIntensity:1.3,flatShading:true});this.coreLight=new T.PointLight(0x8bfdd6,6,10);this.coreLight.position.y=2;this.core.add(this.coreLight);this.gateLight=new T.PointLight(0xffb65f,0,7,2);this.gateLight.position.set(0,1.8,2.4);this.scene.add(this.gateLight);this.aura=mesh(new T.RingGeometry(7.85,7.92,96),0xb8e5c3,0,.07,0,this.scene);this.aura.castShadow=false;this.aura.rotation.x=-Math.PI/2;this.aura.material=new T.MeshBasicMaterial({color:0xade6c8,transparent:true,opacity:.24,side:T.DoubleSide,depthWrite:false});this.hero=this.unitModel({faction:'ember',role:'lord',color:'#efbd67'},1);this.hero.scale.setScalar(1.22);this.scene.add(this.hero);this.hero.position.set(0,0,5);this.selection=mesh(new T.RingGeometry(.78,.86,32),0xffe2a0,0,.09,0,this.scene);this.selection.castShadow=false;this.selection.rotation.x=-Math.PI/2;this.selection.material=new T.MeshBasicMaterial({color:0xffe2a0,side:T.DoubleSide});this.selection.visible=false;this.makeTactics();this.makeAtmosphere();this.resize();canvas.addEventListener('wheel',ev=>{ev.preventDefault();const z=Math.max(.7,Math.min(this.sceneView?2.5:1.45,this.camera.zoom-ev.deltaY*.0007));if(!this.sceneView)this.zoom=z;this.camera.zoom=z;this.camera.updateProjectionMatrix();},{passive:false});window.addEventListener('resize',()=>this.resize());}
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
 setSceneView(preset=null){
  this.sceneView=preset;const views={wide:[26,37,32,.87],close:[21,22,30,1.85],side:[-30,23,26,1.15]};const v=views[preset]||[26,37,32,this.zoom];this.camera.position.set(v[0],v[1],v[2]);this.camera.lookAt(0,0,1);this.camera.zoom=v[3];this.resize();
 }
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h);const a=w/h;let height=41;if(a<1)height=56/a;if(a>2.1)height=37;this.camera.left=-height*a/2;this.camera.right=height*a/2;this.camera.top=height/2;this.camera.bottom=-height/2;this.camera.near=.1;this.camera.far=180;if(this.sceneView)this.camera.clearViewOffset();else this.camera.setViewOffset(w,h,0,h*(a<1?.015:.10),w,h);this.camera.updateProjectionMatrix();}
 makeMap(){
  this.landscape=createLandscape(this,'meadow');this.mapTheme='meadow';this.water=this.landscape.water;
  for(let r=0;r<5;r++)for(let c=0;c<7;c++){
   const x=(c-3)*3.2,z=(r-2)*3.2;if(Math.hypot(x,z)<2.4)continue;
   const g=new T.Group();g.position.set(x,.13,z);const fill=new T.Mesh(new T.PlaneGeometry(2.92,2.92),new T.MeshBasicMaterial({color:0xc2d19d,transparent:true,opacity:.045,depthWrite:false}));fill.rotation.x=-Math.PI/2;g.add(fill);
   const points=[];for(const [sx,sz]of[[-1,-1],[1,-1],[1,1],[-1,1]]){points.push(new T.Vector3(sx*1.08,0,sz*1.46),new T.Vector3(sx*1.46,0,sz*1.46),new T.Vector3(sx*1.46,0,sz*1.46),new T.Vector3(sx*1.46,0,sz*1.08));}
   const lines=new T.LineSegments(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0xe4e3be,transparent:true,opacity:.35}));g.add(lines);this.scene.add(g);this.plots.push({x,z,g,fill});
  }
 }
 makeCastle(){this.castle=createKeep();this.flag=this.castle.userData.flag;this.scene.add(this.castle);}
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
  const shadow=mesh(new T.CircleGeometry(.5,16),0x152b28,0,.035,0,g);shadow.castShadow=false;shadow.rotation.x=-Math.PI/2;shadow.material=new T.MeshBasicMaterial({color:0x152b28,opacity:.2,transparent:true,depthWrite:false});
  const hit=mesh(new T.RingGeometry(.44,.62,16),0xffffff,0,.06,0,g);hit.castShadow=false;hit.rotation.x=-Math.PI/2;hit.material=new T.MeshBasicMaterial({color:enemy?0xffc6ad:0xe8f6c9,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide});g.userData.hit=hit;
  if(star>1){const crown=mesh(new T.TorusGeometry(.33,.04,4,18),0xffd86f,0,2.22,0,g);crown.rotation.x=Math.PI/2;g.scale.setScalar(1+(star-1)*.16);for(let i=0;i<star;i++)mesh(new T.OctahedronGeometry(.07),0xffd86f,(i-(star-1)/2)*.18,2.43,0,g);}
  refineUnit(g,def,enemy);if(def.boss)g.scale.setScalar(2.15);return g;
 }
 buildingModel(b){return createStructure(b);}
 groundAt(cx,cy){const r=this.canvas.getBoundingClientRect();this.raycaster.setFromCamera(new T.Vector2((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1),this.camera);const v=new T.Vector3();if(this.raycaster.ray.intersectPlane(this.groundPlane,v))return{x:v.x,z:v.z};return null;}
 screenAt(x,z,y=1){const v=new T.Vector3(x,y,z).project(this.camera);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};}
 configure(options={}){
  const previous=this.configuredQuality;this.quality=options.quality||'balanced';this.motion=options.motion!==false;if(previous===this.quality)return;this.configuredQuality=this.quality;
  const ratio=this.quality==='low'?1:this.quality==='high'?2:1.5;this.renderer.setPixelRatio(Math.min(devicePixelRatio,ratio));
  this.renderer.shadowMap.enabled=this.quality!=='low';this.sun.shadow.mapSize.set(this.quality==='high'?2048:1024,this.quality==='high'?2048:1024);
  if(this.sun.shadow.map){this.sun.shadow.map.dispose();this.sun.shadow.map=null;}this.renderer.shadowMap.needsUpdate=true;
  this.scene.traverse(o=>{if(o.material){const list=Array.isArray(o.material)?o.material:[o.material];for(const m of list)m.needsUpdate=true;}});
 }
 makeAtmosphere(){
  this.terrainGroup=new T.Group();this.scene.add(this.terrainGroup);
  for(const p of TERRAIN){const g=new T.Group();g.position.set(p.x,.14,p.z);const edge=mesh(new T.RingGeometry(1.1,1.18,4),0xe9c57f,0,.02,0,g);edge.rotation.x=-Math.PI/2;edge.rotation.z=Math.PI/4;for(const x of [-1,1])for(const z of [-1,1]){const mark=box(g,.22,.04,.22,0xc8ae75,x,.04,z);mark.rotation.y=Math.PI/4;}this.terrainGroup.add(g);}
  const count=100,positions=new Float32Array(count*3);for(let i=0;i<count;i++){positions[i*3]=Math.sin(i*12.73)*23;positions[i*3+1]=(i%17)/17*12;positions[i*3+2]=Math.cos(i*4.63)*17;}
  this.moteGeometry=new T.BufferGeometry();this.moteGeometry.setAttribute('position',new T.BufferAttribute(positions,3));this.motes=new T.Points(this.moteGeometry,new T.PointsMaterial({color:0xf4daaa,size:.08,transparent:true,opacity:.55,depthWrite:false}));this.scene.add(this.motes);
 }
 setTheme(id){
  if(this.mapTheme===id)return;
  disposeArt(this.landscape.root);disposeArt(this.landscape.water);this.landscape=createLandscape(this,id);this.water=this.landscape.water;this.mapTheme=id;
  this.motes.material.color.set(id==='frost'?0xe5f3f2:id==='ruins'?0xf2cc91:0xe1eabb);this.motes.material.size=id==='frost'?.12:.08;
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

 sync(state,defs,dt,selected){this.time+=dt;this.setTheme(state.biome||'meadow');this.syncHazards(state);this.terrainGroup.visible=!this.sceneView&&!state.legacy&&state.phase==='day';const targetNight=this.sceneView&&this.viewLighting!==undefined?this.viewLighting:state.phase==='night'?1:0;this.night+=(targetNight-this.night)*Math.min(dt*1.5,1);const bg=new T.Color((ART_THEMES[state.biome]||ART_THEMES.meadow).sky).lerp(new T.Color(0x14283c),this.night);this.scene.background.copy(bg);this.scene.fog.color.copy(bg);this.sun.intensity=3.0-this.night*2.35;this.sun.color.set(0xffebc6).lerp(new T.Color(0xa5bef2),this.night);this.ambient.intensity=1.4-this.night*.56;this.rim.intensity=.8+this.night*.2;this.gateLight.intensity=this.night*7;animateLandscape(this.landscape,this.time,this.night,this.motion,this.quality);this.flag.rotation.y=this.motion?Math.sin(this.time*2)*.14:0;this.motes.visible=this.motion&&this.quality!=='low';if(this.motes.visible){const positions=this.moteGeometry.attributes.position;for(let i=0;i<positions.count;i++){let y=positions.getY(i)+(state.biome==='frost'?-.9:.18)*dt;if(y>12)y=0;if(y<0)y=12;positions.setY(i,y);positions.setX(i,positions.getX(i)+Math.sin(this.time*.3+i)*dt*.07);}positions.needsUpdate=true;}this.coreGem.material.color.set(CORE_PATHS[state.core.path]?.color||'#a0eed7');this.core.position.set(state.core.x,0,state.core.z);this.coreGem.position.y=2+Math.sin(this.time*2)*.18;this.coreGem.rotation.y=this.time*.6;this.aura.position.set(state.core.x,.08,state.core.z);this.aura.scale.setScalar((state.core.radius||8)/7.9);this.aura.material.opacity=this.sceneView?0:.14+this.night*.15;this.hero.visible=state.hero.hp>0;this.hero.position.set(state.hero.x,0,state.hero.z);if(state.hero.angle!==undefined)this.hero.rotation.y=state.hero.angle;this.animateUnit(this.hero,state.hero,dt);const ids=new Set();for(const e of[...state.units.filter(u=>u.slot!==null&&u.hp>0),...state.enemies,...state.buildings.filter(b=>b.hp>0)]){ids.add(e.id);const key=e.type?'building':e.kind?'enemy':'unit';let o=this.objects.get(e.id);const sig=key+(e.def||e.archetype||'')+(e.star||1)+(e.type||'')+(e.level||1)+(e.branch||'')+(e.gear||'');if(o&&o.userData.sig!==sig){this.removeObject(o);this.objects.delete(e.id);o=null;}if(!o){o=key==='building'?this.buildingModel(e):this.unitModel(key==='enemy'?{role:e.ranged||e.healer?'caster':'guardian',boss:e.boss,armored:e.armored,healer:e.healer,archetype:e.archetype}:{...defs[e.def],key:e.def},e.star||1,key==='enemy');o.userData.sig=sig;if(e.gear){const charm=mesh(new T.OctahedronGeometry(e.gear==='echo'?.19:.14),new T.Color(GEAR[e.gear].color).getHex(),.38,1.88,-.2,o);charm.userData.charm=true;if(e.gear==='plate')box(o,.65,.15,.55,0xc7d9cf,0,1.32,0);if(e.gear==='lens'){const lens=mesh(new T.TorusGeometry(.15,.025,5,16),0xe9d593,0,1.64,.23,o);}}this.scene.add(o);this.objects.set(e.id,o);}o.userData.dying=0;o.rotation.z=0;o.visible=e.id!==this.previewId;o.position.set(e.x,0,e.z);if(key!=='building'){o.rotation.y=e.angle||0;this.animateUnit(o,e,dt);}if(o.userData.sails&&this.motion)o.userData.sails.rotation.z+=dt*.8;if(o.userData.spire&&this.motion)o.userData.spire.rotation.y+=dt*.5;if(e.hp<e.maxHp){if(!o.userData.hp){const back=box(o,.85,.055,.035,0x253734,0,2.2,0);const bar=box(o,.8,.045,.05,key==='enemy'?0xd68b9c:0xb7d7a8,0,2.2,.015);o.userData.hp=[back,bar];}o.userData.hp[1].scale.x=Math.max(.01,e.hp/e.maxHp);}else if(o.userData.hp){o.userData.hp.forEach(m=>m.visible=false);}if(o.userData.hp&&e.hp<e.maxHp)o.userData.hp.forEach(m=>m.visible=true);}
 for(const[id,o]of this.objects)if(!ids.has(id)){if(state.phase==='night'&&this.motion&&o.userData.rig){o.userData.dying=(o.userData.dying||0)+dt;o.rotation.z+=dt*2;o.position.y-=dt*.75;if(o.userData.dying<.35)continue;}this.removeObject(o);this.objects.delete(id);}this.selection.visible=false;if(selected){const u=state.units.find(u=>u.id===selected);if(u&&u.slot!==null){this.selection.visible=true;this.selection.position.set(u.x,.16,u.z);}}
 if(this.sceneView)this.selection.visible=false;this.range.visible=false;const focus=state.units.find(u=>u.id===selected);
 if(!this.sceneView&&state.phase==='day'&&focus&&(focus.slot||this.previewId)){this.range.visible=true;this.range.scale.setScalar(defs[focus.def].range+(focus.gear==='lens'?2:0)+(!state.legacy&&focus.slot&&TERRAIN.some(p=>Math.hypot(p.x-focus.slot.x,p.z-focus.slot.z)<.1)?1.5:0));const p=this.previewId?this.previewTile.position:focus;this.range.position.set(p.x,.17,p.z);}
 const wave=(state.legacy?WAVES:CHAPTERS)[state.round-1];for(const marker of this.entryMarkers){marker.visible=!this.sceneView&&['day','night'].includes(state.phase)&&wave.dirs.some(([x,z])=>Math.sign(x)===Math.sign(marker.position.x)&&Math.sign(z)===Math.sign(marker.position.z));for(const arrow of marker.children)arrow.material.opacity=.55+Math.sin(this.time*2)*.2;}
 for(const p of this.plots){p.g.visible=!this.sceneView&&state.phase==='day';const occupied=state.units.some(u=>u.slot&&Math.abs(u.slot.x-p.x)<.1&&Math.abs(u.slot.z-p.z)<.1);p.fill.material.opacity=occupied?.13:selected?.15:.045;p.fill.material.color.set(occupied?0xe3c98b:0xd2dfb1);}
 for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.t+=dt;const k=Math.min(p.t/p.d,1);if(p.kind==='shot'){p.m.position.set(p.from[0]+(p.to[0]-p.from[0])*k,p.from[1]+(p.to[1]-p.from[1])*k+Math.sin(k*Math.PI)*.45,p.from[2]+(p.to[2]-p.from[2])*k);}else if(p.kind==='spark'){p.m.position.set(p.from[0]+p.vx*p.t,p.from[1]+p.vy*p.t-4*p.t*p.t,p.from[2]+p.vz*p.t);p.m.rotation.x+=dt*5;p.m.rotation.z+=dt*3;p.m.material.opacity=1-k;p.m.scale.setScalar(1-k*.7);}else{p.m.scale.setScalar(.2+k*p.size);p.m.material.opacity=(1-k)*.7;}if(k>=1){p.m.visible=false;this.particles.splice(i,1);}}
 this.renderer.render(this.scene,this.camera);}
 removeObject(o){this.scene.remove(o);const shared=new Set(materials.values());o.traverse(m=>{if(m.geometry)m.geometry.dispose();if(m.material&&!shared.has(m.material)&&!isSharedArtMaterial(m.material))m.material.dispose();});}
}
