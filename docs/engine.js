import {FIELD,validDeployment,waveEntrances,invasionPoint,clampEllipse,constrainSoldier} from './battlefield.js';
import {DIFFICULTIES,BIOMES,CHAPTERS,GEAR,CORE_PATHS,BRANCHES,DAY_EVENTS,STANCES,TERRAIN} from './content.js';
export const DEFS={
 sentinel:{name:'烬卫剑士',faction:'ember',role:'guardian',cost:2,hp:235,damage:22,range:1.35,speed:3.1,interval:1.0,color:'#e6b374',icon:'♜',ability:'坚守前线'},
 archer:{name:'烬羽弩手',faction:'ember',role:'ranger',cost:3,hp:120,damage:28,range:8.5,speed:2.8,interval:1.1,color:'#e6b374',icon:'➶',ability:'远程穿甲'},
 warden:{name:'森灵守卫',faction:'grove',role:'guardian',cost:3,hp:310,damage:19,range:1.5,speed:2.8,interval:1.1,color:'#9fce97',icon:'♜',ability:'厚甲守护'},
 druid:{name:'苔光祭司',faction:'grove',role:'caster',cost:4,hp:145,damage:23,range:7,speed:2.7,interval:1.2,color:'#9fce97',icon:'✦',ability:'周期治疗友军'},
 seeker:{name:'逐雷游侠',faction:'storm',role:'ranger',cost:3,hp:140,damage:24,range:8,speed:3.4,interval:.9,color:'#b8ace3',icon:'➶',ability:'闪电连锁弹射'},
 oracle:{name:'风暴先知',faction:'storm',role:'caster',cost:5,hp:170,damage:42,range:7.5,speed:2.6,interval:1.5,color:'#b8ace3',icon:'✦',ability:'雷暴范围伤害'},
 bulwark:{name:'铁誓重卫',faction:'iron',role:'guardian',cost:4,hp:400,damage:25,range:1.6,speed:2.5,interval:1.25,color:'#a4c6d1',icon:'♜',ability:'重甲减伤'},
 gunner:{name:'铁誓炮手',faction:'iron',role:'ranger',cost:4,hp:160,damage:38,range:9,speed:2.6,interval:1.6,color:'#a4c6d1',icon:'✥',ability:'爆裂弹范围伤害'}
};
Object.assign(DEFS,{
 pyromancer:{name:'烬火术士',faction:'ember',role:'caster',cost:5,hp:165,damage:32,range:7,speed:2.7,interval:1.25,color:'#e6b374',icon:'♨',ability:'火焰爆发 · 灼烧集群'},
 thorn:{name:'棘枝猎手',faction:'grove',role:'ranger',cost:3,hp:155,damage:24,range:8.2,speed:3,interval:1.05,color:'#9fce97',icon:'♧',ability:'荆棘箭 · 减速敌人'},
 tempest:{name:'风暴骑士',faction:'storm',role:'guardian',cost:4,hp:290,damage:29,range:1.65,speed:3.5,interval:1.05,color:'#b8ace3',icon:'ϟ',ability:'每四击 · 雷鸣震慑'},
 artificer:{name:'铁誓工匠',faction:'iron',role:'caster',cost:4,hp:185,damage:25,range:7,speed:2.7,interval:1.3,color:'#a4c6d1',icon:'⚒',ability:'维修友军与城防'}
});
export const TRAITS={ember:{name:'余烬',icon:'♨',need:2,desc:'2/3 余烬：本阵营伤害 +30/45%'},grove:{name:'森灵',icon:'♧',need:2,desc:'2/3 森灵：全体每秒回复 2/3% 生命'},storm:{name:'风暴',icon:'ϟ',need:2,desc:'2/3 风暴：本阵营攻速 +35/50%'},iron:{name:'铁誓',icon:'⬡',need:2,desc:'2/3 铁誓：全体受到伤害 −18/28%'},guardian:{name:'守卫',icon:'♜',need:2,desc:'2/3 守卫：守卫生命 +30/60%'},ranger:{name:'游侠',icon:'➶',need:2,desc:'2/3 游侠：游侠攻速 +20/40%'},caster:{name:'秘术',icon:'✦',need:2,desc:'2/3 秘术：法术伤害 +40/65%，治疗 +40%'}};
export const WAVES=[
 {name:'迷雾先锋',desc:'西方 · 游荡者',count:14,dirs:[[-26,0]],hp:52,damage:8,interval:1.6,threat:'低'},
 {name:'双桥夹击',desc:'东西两侧 · 游荡者与猎手',count:22,dirs:[[-26,0],[26,0]],hp:78,damage:10,interval:1.35,threat:'中'},
 {name:'铁甲长夜',desc:'北方与西方 · 重甲卫士',count:28,dirs:[[0,-21],[-26,0]],hp:110,damage:13,interval:1.25,threat:'中'},
 {name:'暗潮围城',desc:'三面来袭 · 猎手与疾行兽',count:36,dirs:[[-26,0],[26,0],[0,-21]],hp:137,damage:16,interval:1.0,threat:'高'},
 {name:'破晓之前',desc:'三面来袭 · 精锐军团',count:44,dirs:[[-26,0],[26,0],[0,-21]],hp:165,damage:19,interval:.85,threat:'极高'},
 {name:'无光之王',desc:'最终决战 · 军团与无光之王',count:48,dirs:[[0,-21],[-26,0],[26,0]],hp:185,damage:22,interval:.85,threat:'首领'}
];
export function enemyProfile(round, index) {
 const boss=round===6&&index===WAVES[round-1].count-1;
 return {boss,ranged:!boss&&index%5===3,armored:!boss&&round>=3&&index%4===0,fast:!boss&&round>=4&&index%4===2};
}
export function waveIntel(round) {
 const counts={boss:0,ranged:0,armored:0,fast:0,regular:0},w=WAVES[round-1];
 for(let i=0;i<w.count;i++){const p=enemyProfile(round,i);counts[p.boss?'boss':p.armored?'armored':p.ranged?'ranged':p.fast?'fast':'regular']++;}
 return counts;
}
export const SOCKETS=[{x:-11,z:-7},{x:11,z:-7},{x:-11,z:7},{x:11,z:7},{x:0,z:-11},{x:0,z:11}];
export const BUILDINGS={tower:{name:'箭塔',cost:10,desc:'自动攻击敌人；核心光环内强化',hp:330},relay:{name:'星火中继',cost:12,desc:'接入核心后延伸光环，并发射星火',hp:270},farm:{name:'风车农庄',cost:8,desc:'每次守夜成功额外获得 4 金币',hp:230}};
export const PERKS=[{id:'flame',name:'灼热锋芒',desc:'所有友军与防御塔伤害提升 18%',icon:'♨'},{id:'reach',name:'星火共鸣',desc:'核心光环半径 +2，震荡冷却 -2 秒',icon:'◈'},{id:'wealth',name:'黄金黎明',desc:'立即获得 12 金币，此后收入 +2',icon:'◉'},{id:'stone',name:'不落城邦',desc:'城堡恢复 250 生命；生命上限 +150',icon:'♜'},{id:'vigor',name:'长青誓约',desc:'所有棋子生命 +25%，领主生命 +60',icon:'♧'},{id:'haste',name:'疾风军令',desc:'全体攻速 +18%，领主移动速度 +15%',icon:'ϟ'}];
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function nearest(origin,items,limit=Infinity,accept=()=>true){let best=null,range=limit;for(const item of items){if(item.hp<=0||!accept(item))continue;const d=dist(origin,item);if(d<range){best=item;range=d;}}return best;}
export class Game{
 constructor(seed=Date.now(),options={}){this.seed=seed>>>0;this.serial=0;this.events=[];this.state={version:2,legacy:!!options.legacy,biome:BIOMES[options.biome]?options.biome:'meadow',difficulty:DIFFICULTIES[options.difficulty]?options.difficulty:'normal',essence:3,inventory:[],dayEvent:null,eventHistory:[],dayBuff:{},formation:null,hazards:[],phase:'day',round:1,gold:32,level:3,kills:0,time:0,nightTime:0,spawned:0,spawnTimer:0,units:[],enemies:[],buildings:[],shop:[],shopLocked:false,report:null,lastReport:null,perks:[],reward:[],castle:{id:'castle',x:0,z:0,hp:800,maxHp:800,cd:0},hero:{id:'hero',x:2.5,z:3.5,hp:220,maxHp:220,cd:0,skill:0,dash:0,respawn:0,angle:0},core:{x:0,z:3,radius:8,following:false},won:false};this.state.castle.hp=this.state.castle.maxHp=BIOMES[this.state.biome].castle;this.state.units.push(this.makeUnit('sentinel',{x:-6.4,z:0}),this.makeUnit('archer',{x:-3.2,z:3.2}));this.rollShop(true);if(!this.state.legacy)this.prepareEvent();}
 rand(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;}
 emit(type,data={}){this.events.push({type,...data});}
 fail(message){return{ok:false,message};}ok(message){return{ok:true,message};}
 makeUnit(def,slot=null,star=1){const d=DEFS[def];return{id:'u'+(++this.serial),def,star,slot:slot?{...slot}:null,x:slot?.x||0,z:slot?.z||0,hp:d.hp*Math.pow(1.85,star-1),maxHp:d.hp*Math.pow(1.85,star-1),cd:0,healCd:0,stance:'guard',gear:null,attacks:0,moving:false};}
 traits(){const counts={};const seen=new Set();for(const u of this.state.units){if(u.slot===null||seen.has(u.def))continue;seen.add(u.def);const d=DEFS[u.def];counts[d.faction]=(counts[d.faction]||0)+1;counts[d.role]=(counts[d.role]||0)+1;}return counts;}
 deployed(){return this.state.units.filter(u=>u.slot!==null);}
 perk(id){return this.state.perks.filter(p=>p===id).length;}
 income(){const s=this.state;return{base:12+this.perk('wealth')*2+(this.state.legacy?0:BIOMES[s.biome].income),interest:Math.min(5,Math.floor(s.gold/10)),farm:s.buildings.filter(b=>b.type==='farm'&&b.hp>0).reduce((a,b)=>a+4*b.level+(b.branch==='market'?3:0),0)};}
 levelCost(){return 6+(this.state.level-3)*4;}
 shopOdds(){const l=this.state.level;return l<=3?[50,38,12]:l<=5?[35,43,22]:[20,45,35];}
 rollShop(initial=false){
  const s=this.state;
  if(!initial){if(s.phase!=='day')return this.fail('夜晚无法刷新商店');if(s.gold<2)return this.fail('刷新需要 2 金币');s.gold-=2;}
  const keys=Object.keys(DEFS).filter(k=>!s.legacy||!['pyromancer','thorn','tempest','artificer'].includes(k));
  s.shop=Array.from({length:5},()=>{const odds=this.shopOdds(),r=this.rand()*100,tier=r<odds[0]?0:r<odds[0]+odds[1]?1:2;const pool=keys.filter(k=>tier===0?DEFS[k].cost<=3:tier===1?DEFS[k].cost===4:DEFS[k].cost===5);return pool[Math.floor(this.rand()*pool.length)];});
  if(initial&&s.round===1)s.shop=['sentinel','sentinel','warden','seeker','druid'];return this.ok('商店已刷新');
 }
 buy(index){const s=this.state;if(s.phase!=='day')return this.fail('只能在白昼招募');const key=s.shop[index];if(!key||!DEFS[key])return this.fail('这名棋子已被招募');const d=DEFS[key];if(s.gold<d.cost)return this.fail('金币不足');const matching=s.units.filter(u=>u.def===key&&u.star===1);if(s.units.filter(u=>u.slot===null).length>=8&&matching.length<2)return this.fail('备战席已满，请先部署或出售');s.gold-=d.cost;s.shop[index]=null;const u=this.makeUnit(key);s.units.push(u);this.merge();this.emit('buy');return this.ok('已招募 '+d.name);}
 merge(){const s=this.state;let changed=true;while(changed){changed=false;for(const key of Object.keys(DEFS))for(let star=1;star<3;star++){const matches=s.units.filter(u=>u.def===key&&u.star===star).sort((a,b)=>Number(b.slot!==null)-Number(a.slot!==null));if(matches.length>=3){const base=matches[0];base.star++;base.hp=base.maxHp=DEFS[key].hp*Math.pow(1.85,base.star-1);for(const consumed of matches.slice(1,3)){if(consumed.gear){if(!base.gear)base.gear=consumed.gear;else s.inventory.push(consumed.gear);}}const remove=new Set([matches[1].id,matches[2].id]);s.units=s.units.filter(u=>!remove.has(u.id));this.emit('merge',{name:DEFS[key].name,star:base.star,x:base.x,z:base.z});changed=true;}}}}
 placement(id,x,z){
  const s=this.state,u=s.units.find(u=>u.id===id);
  if(s.phase!=='day')return this.fail('夜晚无法调整阵容');
  if(!u)return this.fail('棋子不存在');
  if(!Number.isFinite(x)||!Number.isFinite(z))return this.fail('请选择城堡周围的方格');
  x=Math.round(x/3.2)*3.2;z=Math.round(z/3.2)*3.2;
  if(!validDeployment({x,z},s.legacy))return this.fail('请选择城堡周围的方格');
  const other=s.units.find(v=>v.id!==id&&v.slot&&dist(v.slot,{x,z})<.3);
  if(!u.slot&&!other&&this.deployed().length>=s.level)return this.fail('人口已满：可拖到另一枚棋子上交换');
  return {ok:true,x,z,otherId:other?.id,message:other?'松开交换站位':'松开部署棋子'};
 }
 deploy(id,x,z){
  const result=this.placement(id,x,z);if(!result.ok)return result;
  const u=this.state.units.find(u=>u.id===id),other=this.state.units.find(u=>u.id===result.otherId);
  if(other){other.slot=u.slot?{...u.slot}:null;if(other.slot){other.x=other.slot.x;other.z=other.slot.z;}}
  u.slot={x:result.x,z:result.z};u.x=result.x;u.z=result.z;
  this.emit('place',u.slot);return this.ok(other?'已交换站位':'已部署 '+DEFS[u.def].name);
 }
 toggleShopLock(){if(this.state.phase!=='day')return this.fail('夜晚无法调整商店');this.state.shopLocked=!this.state.shopLocked;return this.ok(this.state.shopLocked?'商店已锁定：保留至下个白昼':'商店已解锁');}
 recall(id){if(this.state.phase!=='day')return this.fail('夜晚无法撤回棋子');if(this.state.units.filter(u=>!u.slot).length>=8)return this.fail('备战席已满');const u=this.state.units.find(u=>u.id===id);if(!u)return this.fail('棋子不存在');u.slot=null;return this.ok('已撤回备战席');}
 sell(id){const s=this.state;if(s.phase!=='day')return this.fail('夜晚无法出售棋子');const u=s.units.find(u=>u.id===id);if(!u)return this.fail('棋子不存在');const price=DEFS[u.def].cost*Math.pow(3,u.star-1);s.gold+=price;if(u.gear)s.inventory.push(u.gear);s.units=s.units.filter(v=>v.id!==id);return this.ok('出售获得 '+price+' 金币');}
 levelUp(){const s=this.state;if(s.phase!=='day')return this.fail('只能在白昼升级');if(s.level>=8)return this.fail('已达到最大人口');const cost=this.levelCost();if(s.gold<cost)return this.fail('金币不足');s.gold-=cost;s.level++;return this.ok('出战人口提升至 '+s.level);}
 build(socket,type){const s=this.state;if(s.phase!=='day')return this.fail('夜晚无法建造');if(!Number.isInteger(socket)||!SOCKETS[socket]||!BUILDINGS[type])return this.fail('无效的建造位置');if(s.buildings.some(b=>b.socket===socket&&b.hp>0))return this.fail('此处已有建筑');const d=BUILDINGS[type];if(s.gold<d.cost)return this.fail('金币不足');s.gold-=d.cost;s.buildings=s.buildings.filter(b=>b.socket!==socket);s.buildings.push({id:'b'+(++this.serial),socket,type,level:1,...SOCKETS[socket],hp:d.hp,maxHp:d.hp,cd:0});this.emit('place',SOCKETS[socket]);return this.ok(d.name+'已建成');}
 upgrade(socket){const s=this.state;if(s.phase!=='day')return this.fail('只能在白昼升级');const b=s.buildings.find(b=>b.socket===socket&&b.hp>0);if(!b||b.level>=3)return this.fail('已达到最高等级');const cost=BUILDINGS[b.type].cost+4*(b.level-1);if(s.gold<cost)return this.fail('金币不足');s.gold-=cost;b.level++;b.maxHp+=130;b.hp=b.maxHp;return this.ok('建筑升至 '+b.level+' 级');}
 repair(){const s=this.state;if(s.phase!=='day')return this.fail('只能在白昼修复');if(s.castle.hp>=s.castle.maxHp)return this.fail('城堡完好无损');if(s.gold<5)return this.fail('修复需要 5 金币');s.gold-=5;s.castle.hp=Math.min(s.castle.maxHp,s.castle.hp+180);return this.ok('城堡恢复 180 生命');}
 startNight(){const s=this.state;if(s.phase!=='day')return this.fail('当前无法开始守夜');s.phase='night';s.nightTime=0;s.spawned=0;s.spawnTimer=1.5;s.hero.hp=s.hero.maxHp;s.hero.skill=0;s.hero.respawn=0;s.hazards=[];this._powered=null;s.report={round:s.round,damage:{},castleDamage:0,fallen:[],income:null,duration:0};const tr=this.traits();for(const u of this.deployed()){const d=DEFS[u.def];u.hp=u.maxHp=this.unitStats(u).hp;u.x=u.slot.x;u.z=u.slot.z;u.cd=.2+this.rand()*.6;u.healCd=2;u.attacks=0;u.hit=0;u.attackAnim=0;}this.emit('night',{round:s.round});return this.ok('长夜降临，守住城堡！');}
 toggleCore(){const s=this.state;if(!['day','night'].includes(s.phase))return this.fail('当前无法移动核心');s.core.following=!s.core.following;return this.ok(s.core.following?'核心跟随你移动，附近友军伤害 +25%':'核心已驻扎，光环持续生效');}
 powered(a){const s=this.state;if(this._powered&&this._powered.has(a.id))return this._powered.get(a.id);if(dist(a,s.core)<=s.core.radius)return true;const relays=s.buildings.filter(b=>b.type==='relay'&&b.hp>0);const active=[];let more=true;while(more){more=false;for(const r of relays)if(!active.includes(r)&&(dist(r,s.core)<=s.core.radius||active.some(t=>dist(r,t)<7+t.level))){active.push(r);more=true;}}return active.some(r=>dist(a,r)<7+r.level);}
 nova(){const s=this.state;if(s.phase!=='night')return this.fail('星火震荡在夜晚使用');const h=s.hero;if(h.hp<=0||h.skill>0)return this.fail('星火震荡尚未就绪');h.skill=Math.max(5,12-2*this.perk('reach'));for(const e of s.enemies)if(dist(h,e)<6.5){this.damage(e,(70+10*s.round)*(s.core.path==='fury'?1.3:1),h);e.stun=1.2;e.casting=false;s.hazards=s.hazards.filter(mark=>mark.source!==e.id);}this.emit('nova',{x:h.x,z:h.z,radius:6.5});return this.ok('星火震荡');}
 dash(dx=0,dz=0){const h=this.state.hero;if(!['day','night'].includes(this.state.phase)||h.dash>0||h.hp<=0)return;const len=Math.hypot(dx,dz);if(len<.1){dx=Math.sin(h.angle);dz=Math.cos(h.angle);}else{dx/=len;dz/=len;}h.x=clamp(h.x+dx*4,this.state.legacy?-19:-FIELD.heroX,this.state.legacy?19:FIELD.heroX);h.z=clamp(h.z+dz*4,this.state.legacy?-13:-FIELD.heroZ,this.state.legacy?13:FIELD.heroZ);if(!this.state.legacy)clampEllipse(h,FIELD.heroX,FIELD.heroZ);h.dash=2;this.emit('burst',{x:h.x,z:h.z,radius:2});}
 spawn(){
  const s=this.state,w=this.wave(),i=s.spawned++,dir=w.dirs[i%w.dirs.length],p=this.profile(i),difficulty=DIFFICULTIES[s.difficulty];
  const hp=(p.boss?(s.legacy?1850:w.boss==='king'?2700:1150):w.hp*(p.armored?1.7:p.siege?2:p.healer?1.2:p.assassin?.85:1))*difficulty.hp*(s.dayBuff.risk||1);
  const spawn=s.legacy?{x:dir[0]+(this.rand()-.5)*2,z:dir[1]+(this.rand()-.5)*2}:invasionPoint(s.round,i,this.rand());
  const e={id:'e'+(++this.serial),kind:'enemy',...spawn,hp,maxHp:hp,damage:w.damage*(p.boss?2.2:p.siege?1.8:1)*difficulty.damage,speed:(p.boss?1.1:p.siege?.95:p.fast?2.7:p.assassin?2.6:p.armored?1.35:1.85)*(s.legacy?1:BIOMES[s.biome].speed),range:p.siege?11:p.ranged||p.healer?6:p.boss?2.1:1.2,cd:this.rand(),stun:0,slow:0,abilityCd:p.boss?5:3,casting:false,...p,angle:0};
  s.enemies.push(e);if(p.boss)this.emit('boss',{name:w.boss==='marshal'?'苍白监军':'无光之王'});
 }
 moveToward(a,b,speed,dt){let dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d>.04){const step=Math.min(d,speed*dt);a.x+=dx/d*step;a.z+=dz/d*step;a.angle=Math.atan2(dx,dz);a.moving=true;}}
 damage(target,amount,source){
  if(target.hp<=0||!Number.isFinite(amount)||amount<=0)return;
  const actual=Math.min(target.hp,amount),r=this.state.report;
  target.hp=Math.max(0,target.hp-amount);target.hit=.16;if(source?.gear==='leech'&&target.kind==='enemy')this.heal(source,actual*.18,source);if(source)source.attackAnim=.18;
  if(r){
   if(target.kind==='enemy'&&source){
    const name=source.def?DEFS[source.def].name+' '+('★'.repeat(source.star)):source.id==='hero'?'守城者':source.id==='castle'?'余烬城堡':BUILDINGS[source.type]?.name||'友军';
    const item=r.damage[source.id]??={name,amount:0,color:source.def?DEFS[source.def].color:'#efbd67'};item.amount+=actual;
   }
   if(target.id==='castle')r.castleDamage+=actual;
   if(target.def&&target.hp===0&&!r.fallen.includes(target.id))r.fallen.push(target.id);
  }
  if(target.id==='hero'&&target.hp===0){target.respawn=8;this.emit('heroDown');}
 }
 finishReport(income=null){const s=this.state;if(!s.report)return;s.report.duration=s.nightTime;s.report.income=income;s.lastReport=JSON.parse(JSON.stringify(s.report));}
 update(dt,input={x:0,z:0}){const s=this.state;if(!['day','night'].includes(s.phase))return;dt=Math.min(dt,.1);s.time+=dt;const h=s.hero;h.skill=Math.max(0,h.skill-dt);h.dash=Math.max(0,h.dash-dt);h.moving=false;if(h.hp>0){const len=Math.hypot(input.x||0,input.z||0);if(len>.01){const speed=6*(1+.15*this.perk('haste'));h.x=clamp(h.x+input.x/Math.max(1,len)*speed*dt,this.state.legacy?-19:-FIELD.heroX,this.state.legacy?19:FIELD.heroX);h.z=clamp(h.z+input.z/Math.max(1,len)*speed*dt,this.state.legacy?-13:-FIELD.heroZ,this.state.legacy?13:FIELD.heroZ);h.angle=Math.atan2(input.x,input.z);h.moving=true;}if(!s.legacy)clampEllipse(h,FIELD.heroX,FIELD.heroZ);}else{h.respawn-=dt;if(h.respawn<=0){h.hp=h.maxHp;h.x=1;h.z=3;this.emit('heroUp');}}
 if(s.core.following){const dd=dist(s.core,h);if(dd>.6)this.moveToward(s.core,h,Math.max(6,dd*2),dt);}if(s.phase==='day'){h.hp=Math.min(h.maxHp,h.hp+dt*15);return;}
 s.nightTime+=dt;const w=this.wave();s.spawnTimer-=dt;if(s.spawned<w.count&&s.spawnTimer<=0){this.spawn();s.spawnTimer=w.interval;}const traits=this.traits(),army=this.deployed().filter(u=>u.hp>0),activeEnemies=s.enemies.filter(e=>e.hp>0);this._powered=null;const power=new Map();for(const ally of [...army,h,s.castle,...s.buildings])power.set(ally.id,this.powered(ally));this._powered=power;this.updateHazards(dt);for(const a of [...army,h,...activeEnemies]){a.hit=Math.max(0,(a.hit||0)-dt);a.attackAnim=Math.max(0,(a.attackAnim||0)-dt);}
 for(const u of army){
  const d=DEFS[u.def],stats=this.unitStats(u);u.moving=false;u.cd-=dt;u.healCd-=dt;
  const regen=(traits.grove>=3?.03:traits.grove>=2?.02:0)+(u.gear==='spring'?.025:0)+(s.core.path==='sanctuary'&&this.powered(u)?.015:0);
  this.heal(u,u.maxHp*regen*dt,u);
  if(['druid','artificer'].includes(u.def)&&u.healCd<=0){
   const pool=[...army,h,...(u.def==='artificer'?[s.castle,...s.buildings]:[])];
   const injured=pool.filter(a=>a.hp>0&&a.hp<a.maxHp&&dist(a,u)<8).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
   if(injured){this.heal(injured,(30+u.star*12)*(traits.caster>=2?1.4:1),u);this.emit('shot',{x:u.x,z:u.z,tx:injured.x,tz:injured.z,color:'heal'});}u.healCd=3;
  }
  const anchor=u.slot,hold=!s.legacy&&u.stance!=='hunt',target=nearest(u,activeEnemies,Infinity,e=>!hold||dist(anchor,e)<=stats.range+3.5);
  if(!target){if(dist(u,anchor)>.35)this.moveToward(u,anchor,d.speed,dt);continue;}
  if(dist(u,target)>stats.range){
   if(!hold||dist(u,anchor)<3.5)this.moveToward(u,target,d.speed,dt);
   if(hold&&dist(u,anchor)>3.5){const dd=dist(u,anchor);u.x=anchor.x+(u.x-anchor.x)/dd*3.5;u.z=anchor.z+(u.z-anchor.z)/dd*3.5;}
  }else if(u.cd<=0){
   u.angle=Math.atan2(target.x-u.x,target.z-u.z);u.attacks=(u.attacks||0)+1;
   const dmg=stats.damage*this.auraMultiplier(u)*(s.dayBuff.damage||1);
   this.damage(target,dmg*(target.armored&&d.role!=='caster'&&u.def!=='archer'?.8:1),u);
   if(u.def==='seeker'){const next=nearest(target,activeEnemies,4,e=>e!==target);if(next){this.damage(next,dmg*.55,u);this.emit('shot',{x:target.x,z:target.z,tx:next.x,tz:next.z,color:'storm'});}}
   if(['oracle','gunner','pyromancer'].includes(u.def)){for(const e of activeEnemies)if(e!==target&&dist(e,target)<2.6)this.damage(e,dmg*.5,u);this.emit('burst',{x:target.x,z:target.z,radius:2.6,color:d.faction});}
   if(u.gear==='echo'&&u.attacks%4===0){for(const e of activeEnemies)if(dist(e,target)<2.6)this.damage(e,dmg*.65,u);this.emit('burst',{x:target.x,z:target.z,radius:2.6,color:'storm'});}
   if(u.def==='thorn')target.slow=2;
   if(u.def==='pyromancer'){target.burn=3;target.burnDamage=dmg*.12;target.burnSource=u.id;}
   if(u.def==='tempest'&&u.attacks%4===0){for(const e of activeEnemies)if(dist(u,e)<3){this.damage(e,dmg*.45,u);e.stun=.7;}this.emit('nova',{x:u.x,z:u.z,radius:3});}
   u.cd=stats.interval;this.emit('shot',{x:u.x,z:u.z,tx:target.x,tz:target.z,color:d.faction});
  }
 }
 if(h.hp>0&&traits.grove>=2)h.hp=Math.min(h.maxHp,h.hp+h.maxHp*(traits.grove>=3?.03:.02)*dt);if(h.hp>0&&s.core.path==='sanctuary'&&this.powered(h))this.heal(h,h.maxHp*.015*dt,h);h.cd-=dt;if(h.hp>0&&h.cd<=0){const target=nearest(h,activeEnemies,8.5);if(target){this.damage(target,(30+s.round*4)*(1+.18*this.perk('flame'))*this.auraMultiplier(h)*(s.dayBuff.damage||1),h);h.cd=.75/(1+.18*this.perk('haste'));if(!h.moving)h.angle=Math.atan2(target.x-h.x,target.z-h.z);this.emit('shot',{x:h.x,z:h.z,tx:target.x,tz:target.z});}}
 for(const b of [s.castle,...s.buildings.filter(b=>b.hp>0)]){
  if(b.branch==='shelter')for(const a of [...army,h,s.castle,...s.buildings])if(dist(a,b)<6)this.heal(a,a.maxHp*.012*dt,b);
  if(b.type==='farm')continue;b.cd-=dt;if(b.cd>0)continue;
  const stats=this.buildingStats(b),target=nearest(b,activeEnemies,stats.range);
  if(target){const damage=stats.damage*this.auraMultiplier(b)*(s.dayBuff.damage||1);this.damage(target,damage,b);if(b.branch==='frost')target.slow=2;if(b.branch==='pulse'){for(const e of activeEnemies)if(e!==target&&dist(e,target)<2.8)this.damage(e,damage*.55,b);this.emit('burst',{x:target.x,z:target.z,radius:2.8});}b.cd=stats.interval;this.emit('shot',{x:b.x,z:b.z,y:3.4,tx:target.x,tz:target.z,color:b.branch==='frost'?'storm':undefined});}
 }
 const defenders=[...army,h,...s.buildings.filter(b=>b.hp>0)];
 for(const e of activeEnemies){
  e.moving=false;if(e.hp<=0)continue;e.cd-=dt;e.stun=Math.max(0,e.stun-dt);e.slow=Math.max(0,(e.slow||0)-dt);
  if(e.burn>0){e.burn-=dt;this.damage(e,e.burnDamage*dt,s.units.find(u=>u.id===e.burnSource));if(e.hp<=0)continue;}
  if(e.stun>0)continue;
  e.abilityCd=(e.abilityCd??5)-dt;
  if(e.healer&&e.abilityCd<=0){const ally=activeEnemies.filter(a=>a.hp>0&&a.hp<a.maxHp&&dist(a,e)<8).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(ally){this.heal(ally,30+s.round*4);this.emit('shot',{x:e.x,z:e.z,tx:ally.x,tz:ally.z,color:'enemyHeal'});}e.abilityCd=4;}
  if(e.boss&&!s.legacy&&e.abilityCd<=0&&!e.casting){const aim=nearest(e,[...army,h],12)||s.castle;this.addHazard(e,aim);if(w.boss==='king'&&e.hp<e.maxHp*.5)this.addHazard(e,{x:s.castle.x+4,z:s.castle.z-2});e.abilityCd=w.boss==='king'?7:9;e.casting=true;}
  if(e.casting)continue;
  // Clear the wide approach before engaging the inner defense. Nearby defenders can intercept.
  if(e.approach){if(dist(e,e.approach)<1||nearest(e,defenders,4)){e.approach=null;}else{this.moveToward(e,e.approach,e.speed*(e.slow>0?.55:1),dt);continue;}}
  let target;
  if(e.siege)target=nearest(e,s.buildings,Infinity)||s.castle;
  else if(e.assassin)target=nearest(e,army,Infinity,a=>DEFS[a.def].role!=='guardian')||nearest(e,defenders,6.5)||s.castle;
  else target=nearest(e,defenders,6.5,a=>a.id!=='hero'||dist(a,e)<5)||s.castle;
  if(dist(e,target)>e.range+(.65*(target.id==='castle')))this.moveToward(e,target,e.speed*(e.slow>0?.55:1),dt);
  else if(e.cd<=0){this.hurtAlly(target,e.damage);e.cd=e.siege?3:e.boss?1.6:1.2;this.emit('shot',{x:e.x,z:e.z,tx:target.x,tz:target.z,color:'enemy'});}
 }
 const moving=[...army,...activeEnemies];for(let i=0;i<moving.length;i++)for(let j=i+1;j<moving.length;j++){const a=moving[i],b=moving[j],dx=a.x-b.x,dz=a.z-b.z,d=Math.hypot(dx,dz);if(d<.6){const safe=d>.001?d:1,ax=d>.001?dx:Math.cos(i*2.4+j),az=d>.001?dz:Math.sin(i*2.4+j);const push=(.6-d)*.5;a.x+=ax/safe*push;a.z+=az/safe*push;b.x-=ax/safe*push;b.z-=az/safe*push;}}
 if(!s.legacy)for(const u of army)constrainSoldier(u);
 for(const e of s.enemies)if(e.hp<=0){s.kills++;if(s.kills%3===0)s.gold++;this.emit('death',{x:e.x,z:e.z,radius:e.boss?4:.9});}s.enemies=s.enemies.filter(e=>e.hp>0);
 if(s.castle.hp<=0){s.castle.hp=0;this.finishReport();s.phase='lost';this.emit('end',{won:false});return;}if(s.spawned===w.count&&s.enemies.length===0)this.dawn();}
 dawn(){const s=this.state;this._powered=null;s.hazards=[];if(s.round===this.totalNights()){this.finishReport();s.phase='won';s.won=true;this.emit('end',{won:true});return;}const inc=this.income();const total=inc.base+inc.interest+inc.farm;this.finishReport(inc);s.gold+=total;if(!s.legacy)s.essence+=this.wave().boss?3:2;s.castle.hp=Math.min(s.castle.maxHp,s.castle.hp+(s.legacy?45:BIOMES[s.biome].heal)+s.buildings.filter(b=>b.hp>0&&b.branch==='granary').length*70);s.hero.hp=s.hero.maxHp;s.hero.x=2.5;s.hero.z=3.5;s.hero.skill=0;s.hero.respawn=0;for(const u of s.units){u.hp=u.maxHp;u.moving=false;if(u.slot){u.x=u.slot.x;u.z=u.slot.z;}}s.core.following=false;s.core.x=0;s.core.z=3;s.phase='reward';const pool=[...PERKS];s.reward=[];for(let i=0;i<3;i++)s.reward.push(pool.splice(Math.floor(this.rand()*pool.length),1)[0].id);this.emit('dawn',{income:total,round:s.round});}
 choosePerk(id){const s=this.state;if(s.phase!=='reward'||!s.reward.includes(id))return this.fail('请选择当前可用的祝福');s.perks.push(id);if(id==='wealth')s.gold+=12;if(id==='reach')s.core.radius+=2;if(id==='stone'){s.castle.maxHp+=150;s.castle.hp=Math.min(s.castle.maxHp,s.castle.hp+250);}if(id==='vigor'){s.hero.maxHp+=60;s.hero.hp=s.hero.maxHp;}s.reward=[];s.round++;s.phase='day';s.dayBuff={};if(!s.legacy)this.prepareEvent();if(!s.shopLocked)this.rollShop(true);this.emit('saveday');return this.ok('获得祝福：'+PERKS.find(p=>p.id===id).name);}

 totalNights(){return this.state.legacy?6:CHAPTERS.length;}
 wave(){const s=this.state;return s.legacy?WAVES[s.round-1]:{...CHAPTERS[s.round-1],dirs:waveEntrances(s.round).map(e=>[e.x,e.z])};}
 profile(index){
  const s=this.state;if(s.legacy)return enemyProfile(s.round,index);
  const boss=!!this.wave().boss&&index===this.wave().count-1;
  const type=boss?'boss':s.round>=3&&index%10===7?'siege':s.round>=4&&index%11===5?'healer':s.round>=5&&index%9===4?'assassin':s.round>=3&&index%4===0?'armored':index%5===3?'ranged':s.round>=4&&index%4===2?'fast':'regular';
  return {archetype:type,boss:type==='boss',ranged:type==='ranged',armored:type==='armored',fast:type==='fast',siege:type==='siege',healer:type==='healer',assassin:type==='assassin'};
 }
 intel(){if(this.state.legacy)return waveIntel(this.state.round);const counts={};for(let i=0;i<this.wave().count;i++){const key=this.profile(i).archetype;counts[key]=(counts[key]||0)+1;}return counts;}
 auraMultiplier(ally){return this.powered(ally)?this.state.core.path==='fury'?1.4:1.25:1;}
 unitStats(u){
  const d=DEFS[u.def],tr=this.traits(),gear=u.gear,terrain=!this.state.legacy&&u.slot&&TERRAIN.some(p=>dist(p,u.slot)<.1);
  return {hp:d.hp*Math.pow(1.85,u.star-1)*(1+.25*this.perk('vigor'))*(d.role==='guardian'?(tr.guardian>=3?1.6:tr.guardian>=2?1.3:1):1)*(gear==='plate'?1.35:1),
   damage:d.damage*Math.pow(1.8,u.star-1)*(1+.18*this.perk('flame'))*(d.faction==='ember'?(tr.ember>=3?1.45:tr.ember>=2?1.3:1):1)*(d.role==='caster'?(tr.caster>=3?1.65:tr.caster>=2?1.4:1):1)*(gear==='edge'?1.25:1),
   range:d.range+(gear==='lens'?2:0)+(terrain?1.5:0),
   interval:d.interval/(1+.18*this.perk('haste'))/(d.role==='ranger'?(tr.ranger>=3?1.4:tr.ranger>=2?1.2:1):1)/(d.faction==='storm'?(tr.storm>=3?1.5:tr.storm>=2?1.35:1):1)/(gear==='lens'?1.12:1)};
 }
 buildingStats(b){return {range:b.id==='castle'?9:b.type==='relay'?8:10+.5*b.level+(b.branch==='ballista'?3:0),damage:(b.id==='castle'?17:22*b.level)*(1+.18*this.perk('flame'))*(b.branch==='ballista'?1.65:1),interval:(b.id==='castle'?1.4:b.type==='relay'?1.5:1.1)*(b.branch==='ballista'?1.25:1)/(1+.18*this.perk('haste'))/(this.state.core.path==='network'&&this.powered(b)?1.35:1)};}
 heal(target,amount,source){if(target.hp<=0||!Number.isFinite(amount)||amount<=0)return 0;const actual=Math.min(target.maxHp-target.hp,amount*(source?.gear==='spring'?1.35:1));target.hp+=actual;const r=this.state.report;if(r&&source?.id&&actual>0&&target.kind!=='enemy'){r.healing??={};r.healing[source.id]=(r.healing[source.id]||0)+actual;}return actual;}
 hurtAlly(target,amount){const tr=this.traits();let reduction=target.def==='bulwark'?.75:1;if(target.def||target.id==='hero')reduction*=tr.iron>=3?.72:tr.iron>=2?.82:1;if(target.gear==='plate')reduction*=.88;this.damage(target,amount*reduction);}
 addHazard(source,aim){const s=this.state;const radius=this.wave().boss==='king'?3.8:3;const mark={id:'h'+(++this.serial),source:source.id,x:aim.x,z:aim.z,radius,timer:2.2,duration:2.2,damage:source.damage*2.1};s.hazards.push(mark);this.emit('warning',{x:aim.x,z:aim.z,radius});}
 updateHazards(dt){
  const s=this.state;for(const mark of s.hazards){mark.timer-=dt;if(mark.timer>0)continue;const source=s.enemies.find(e=>e.id===mark.source&&e.hp>0);if(!source)continue;for(const a of [...this.deployed(),s.hero,s.castle,...s.buildings])if(a.hp>0&&dist(a,mark)<=mark.radius)this.hurtAlly(a,mark.damage);source.casting=false;this.emit('impact',{x:mark.x,z:mark.z,radius:mark.radius});}
  s.hazards=s.hazards.filter(mark=>mark.timer>0&&s.enemies.some(e=>e.id===mark.source&&e.hp>0));
 }
 setStance(id,stance){if(this.state.phase!=='day')return this.fail('白昼才能修改作战姿态');const u=this.state.units.find(u=>u.id===id);if(!u||!STANCES[stance])return this.fail('无效的作战命令');u.stance=stance;return this.ok(DEFS[u.def].name+'：'+STANCES[stance].name);}
 forge(key){const s=this.state,g=GEAR[key];if(s.phase!=='day'||!g)return this.fail('白昼才能锻造装备');if(s.inventory.length>=12)return this.fail('军械库已满，请先装备给棋子');if(s.essence<g.cost)return this.fail('星髓不足');s.essence-=g.cost;s.inventory.push(key);return this.ok('已锻造 '+g.name);}
 equip(id,index){const s=this.state,u=s.units.find(u=>u.id===id);if(s.phase!=='day'||!u||!Number.isInteger(index)||!GEAR[s.inventory[index]])return this.fail('请选择军械库中的装备');const old=u.gear;u.gear=s.inventory.splice(index,1)[0];if(old)s.inventory.push(old);u.hp=u.maxHp=this.unitStats(u).hp;return this.ok('已装备 '+GEAR[u.gear].name);}
 unequip(id){const s=this.state,u=s.units.find(u=>u.id===id);if(s.phase!=='day'||!u?.gear)return this.fail('当前没有可卸下的装备');if(s.inventory.length>=12)return this.fail('军械库已满');s.inventory.push(u.gear);u.gear=null;u.hp=u.maxHp=this.unitStats(u).hp;return this.ok('装备已放回军械库');}
 specialize(path){const s=this.state;if(s.phase!=='day'||s.round<2)return this.fail('核心专精在第 2 日解锁');if(s.core.path)return this.fail('本次远征已经选定核心专精');if(!CORE_PATHS[path])return this.fail('请选择核心专精');s.core.path=path;if(path==='network')s.core.radius+=3;return this.ok('核心觉醒：'+CORE_PATHS[path].name);}
 branch(socket,key){const s=this.state,b=s.buildings.find(b=>b.socket===socket&&b.hp>0),branch=BRANCHES[key];if(s.phase!=='day'||!b||!branch||branch.base!==b.type)return this.fail('不适用的城防改造');if(b.level<2)return this.fail('建筑达到 2 级后解锁改造');if(b.branch)return this.fail('此建筑已选择发展分支');if(s.gold<branch.cost)return this.fail('金币不足');s.gold-=branch.cost;b.branch=key;if(key==='granary'){b.maxHp+=180;b.hp+=180;}return this.ok(branch.name+'改造完成');}
 repairBuilding(socket){const s=this.state,b=s.buildings.find(b=>b.socket===socket&&b.hp>0);if(s.phase!=='day'||!b||b.hp>=b.maxHp)return this.fail('没有需要修复的建筑');if(s.gold<3)return this.fail('修复需要 3 金币');s.gold-=3;b.hp=b.maxHp;return this.ok('建筑已完全修复');}
 prepareEvent(){const s=this.state;s.dayEvent={id:DAY_EVENTS[(s.round-1+this.seed%DAY_EVENTS.length)%DAY_EVENTS.length].id,resolved:false,choice:null};}
 resolveEvent(id){const s=this.state,event=DAY_EVENTS.find(e=>e.id===s.dayEvent?.id),choice=event?.choices.find(c=>c.id===id);if(s.phase!=='day'||s.dayEvent?.resolved||!choice)return this.fail('当前事件不可用');if(s.gold+(choice.gold||0)<0)return this.fail('金币不足');s.gold+=choice.gold||0;s.essence+=choice.essence||0;s.castle.maxHp+=choice.maxHp||0;s.castle.hp=Math.min(s.castle.maxHp,s.castle.hp+(choice.heal||0));if(choice.repair)for(const b of s.buildings)if(b.hp>0)b.hp=b.maxHp;if(choice.damage)s.dayBuff.damage=choice.damage;if(choice.risk)s.dayBuff.risk=choice.risk;s.dayEvent.resolved=true;s.dayEvent.choice=id;s.eventHistory.push({round:s.round,event:event.id,choice:id});return this.ok('已决定：'+choice.name);}
 saveFormation(){if(this.state.phase!=='day')return this.fail('白昼才能保存阵型');this.state.formation=this.deployed().map(u=>({id:u.id,def:u.def,slot:{...u.slot},stance:u.stance}));return this.ok('当前阵型已保存');}
 restoreFormation(){const s=this.state;if(s.phase!=='day'||!s.formation)return this.fail('请先保存一套阵型');const available=new Set(s.units.map(u=>u.id)),moves=[];for(const record of s.formation){let u=s.units.find(u=>available.has(u.id)&&u.id===record.id)||s.units.find(u=>available.has(u.id)&&u.def===record.def);if(u){available.delete(u.id);moves.push({u,record});}}if(s.units.length-moves.length>8||moves.length>s.level)return this.fail('备战席或人口不足，阵型保持不变');for(const u of s.units)u.slot=null;for(const {u,record}of moves){u.slot={...record.slot};u.x=u.slot.x;u.z=u.slot.z;u.stance=record.stance||'guard';}return this.ok('已恢复阵型 · '+moves.length+' 名棋子');}
 serialize(){if(this.state.phase!=='day')return null;return JSON.stringify({version:2,seed:this.seed,serial:this.serial,state:this.state});}
 static restore(raw){
  try{
   const d=JSON.parse(raw),s=d.state,finite=(n,a=0,b=1e9)=>Number.isFinite(n)&&n>=a&&n<=b;
   if(![1,2].includes(d.version)||s?.phase!=='day'||!Array.isArray(s.units)||s.units.length>16||!Array.isArray(s.shop)||s.shop.length!==5||!s.shop.every(k=>k===null||DEFS[k])||!Number.isInteger(s.round)||s.round<1||s.round>(d.version===1||s.legacy?6:8)||!Number.isInteger(s.level)||s.level<2||s.level>8||!finite(s.gold)||!s.castle||!finite(s.castle.hp)||!finite(s.castle.maxHp,1)||!s.hero||!finite(s.hero.hp)||!finite(s.hero.maxHp,1)||!s.core||!finite(s.core.radius,1,30)||!finite(s.core.x,-100,100)||!finite(s.core.z,-100,100)||!Array.isArray(s.buildings)||s.buildings.length>6||!Array.isArray(s.perks)||!s.perks.every(id=>PERKS.some(p=>p.id===id))||!Number.isInteger(d.seed)||!Number.isInteger(d.serial))return null;
   const validSlot=p=>validDeployment(p,d.version===1||s.legacy);
   if(!s.units.every(u=>DEFS[u.def]&&/^u\d+$/.test(u.id)&&[1,2,3].includes(u.star)&&finite(u.hp)&&finite(u.maxHp,1)&&(u.slot===null||validSlot(u.slot))&&(!u.gear||GEAR[u.gear])))return null;
   const ids=s.units.map(u=>u.id),slots=s.units.filter(u=>u.slot).map(u=>u.slot.x+','+u.slot.z);
   if(new Set(ids).size!==ids.length||new Set(slots).size!==slots.length||slots.length>s.level||s.units.length-slots.length>8)return null;
   if(!s.buildings.every(b=>BUILDINGS[b.type]&&Number.isInteger(b.socket)&&SOCKETS[b.socket]&&/^b\d+$/.test(b.id)&&[1,2,3].includes(b.level)&&finite(b.hp)&&finite(b.maxHp,1)&&(!b.branch||BRANCHES[b.branch]?.base===b.type))||new Set(s.buildings.map(b=>b.socket)).size!==s.buildings.length)return null;
   if(d.version===2&&(!BIOMES[s.biome]||!DIFFICULTIES[s.difficulty]||!finite(s.essence)||!Array.isArray(s.inventory)||s.inventory.length>28||!s.inventory.every(k=>GEAR[k])||s.core.path&&!CORE_PATHS[s.core.path]))return null;
   if(d.version===2){if(!s.dayBuff||!Object.values(s.dayBuff).every(n=>finite(n,.5,2))||!Array.isArray(s.eventHistory)||s.eventHistory.length>8)return null;if(s.dayEvent&&(!DAY_EVENTS.some(e=>e.id===s.dayEvent.id)||typeof s.dayEvent.resolved!=='boolean'))return null;}
   if(!finite(s.hero.x,-100,100)||!finite(s.hero.z,-100,100)||!finite(s.hero.cd,-1e6,1e6)||!finite(s.castle.cd,-1e6,1e6))return null;
   const g=new Game(d.seed,{legacy:d.version===1||s.legacy});
   g.state={...g.state,...s};g.state.legacy=d.version===1||!!s.legacy;g.state.shopLocked=!!s.shopLocked;g.state.report=s.report||null;g.state.lastReport=s.lastReport||null;g.state.hazards=[];g.state.enemies=[];
   for(const u of g.state.units){u.stance=STANCES[u.stance]?u.stance:'guard';u.gear??=null;u.attacks??=0;u.x=u.slot?.x||0;u.z=u.slot?.z||0;}
   for(const b of g.state.buildings){b.x=SOCKETS[b.socket].x;b.z=SOCKETS[b.socket].z;}
   if(g.state.formation&&(!Array.isArray(g.state.formation)||g.state.formation.length>8||!g.state.formation.every(r=>DEFS[r.def]&&validSlot(r.slot))||new Set(g.state.formation.map(r=>r.slot.x+','+r.slot.z)).size!==g.state.formation.length))g.state.formation=null;
   g.seed=d.seed;g.serial=Math.max(d.serial,...[...g.state.units,...g.state.buildings].map(u=>Number(u.id.slice(1))));g.events=[];return g;
  }catch{return null;}
 }
}
