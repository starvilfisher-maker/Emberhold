// Campaign data is shared by combat, menus, tooltips and the offline build.
export const DIFFICULTIES = {
  story: {name:'旅人', hp:.8, damage:.75, desc:'敌军生命 −20%、伤害 −25%。适合熟悉构筑。'},
  normal: {name:'守城者', hp:1, damage:1, desc:'标准远征。阵容、城防与领主共同守城。'},
  veteran: {name:'铁誓', hp:1.25, damage:1.2, desc:'敌军生命 +25%、伤害 +20%。适合挑战。'}
};
export const BIOMES = {
  meadow: {name:'翠风河谷', subtitle:'溪流与旧王城', icon:'♧', desc:'每次黎明城堡恢复 65 生命。均衡的起点。', heal:65, income:0, speed:1, castle:800, color:'#a7c68d', ground:0x708f69},
  frost: {name:'霜月隘口', subtitle:'雪落北境', icon:'❄', desc:'寒地令敌军移动速度降低 12%；黎明恢复 35 生命。', heal:35, income:0, speed:.88, castle:800, color:'#b2d9df', ground:0x9cbbb7},
  ruins: {name:'鎏金遗都', subtitle:'沙海中的余火', icon:'◇', desc:'每夜基础收入 +2；城堡初始生命为 700。', heal:45, income:2, speed:1, castle:700, color:'#e5c38a', ground:0xb4a276}
};
export const CHAPTERS = [
  {name:'迷雾先锋',desc:'西桥 · 游荡者试探防线',count:14,dirs:[[-26,0]],hp:52,damage:8,interval:1.6,threat:'低',tip:'先合成二星前排，再补充远程输出。'},
  {name:'双桥夹击',desc:'东西两侧 · 猎手与援军',count:22,dirs:[[-26,0],[26,0]],hp:78,damage:10,interval:1.35,threat:'中',tip:'分配两翼防守。现在可以选择核心专精。'},
  {name:'断墙者',desc:'北桥与西桥 · 攻城车',count:28,dirs:[[0,-21],[-26,0]],hp:108,damage:13,interval:1.2,threat:'中',tip:'攻城车优先轰击建筑；用领主或前排主动拦截。'},
  {name:'苍白监军',desc:'三桥 · 监军与疗愈祭师',count:32,dirs:[[-26,0],[26,0],[0,-21]],hp:125,damage:15,interval:1.05,threat:'首领',boss:'marshal',tip:'红圈落下前撤离领主。震荡可打断正在蓄力的首领。'},
  {name:'猎影之夜',desc:'东西两侧 · 潜袭者绕后',count:38,dirs:[[-26,0],[26,0]],hp:148,damage:17,interval:1,threat:'高',tip:'潜袭者追击后排。给射手配护甲，留守卫保护。'},
  {name:'破城洪流',desc:'三桥 · 重甲与攻城车',count:44,dirs:[[0,-21],[-26,0],[26,0]],hp:170,damage:19,interval:.92,threat:'高',tip:'法术穿透重甲，寒霜塔延缓军团；农庄与火力需要取舍。'},
  {name:'无光圣歌',desc:'三桥 · 祭师与精锐军团',count:48,dirs:[[-26,0],[26,0],[0,-21]],hp:188,damage:21,interval:.88,threat:'极高',tip:'祭师会治疗附近敌人。突击姿态与范围伤害能快速清理。'},
  {name:'永夜王座',desc:'最终决战 · 无光之王',count:50,dirs:[[0,-21],[-26,0],[26,0]],hp:202,damage:23,interval:.9,threat:'首领',boss:'king',tip:'王的陨星会锁定城堡周围。打断蓄力，保持领主存活。'}
];
export const GEAR = {
  edge: {name:'余烬锋刃',icon:'†',cost:3,color:'#f0b887',desc:'伤害 +25%。适合高星输出。'},
  plate: {name:'铁誓壁垒',icon:'⬡',cost:3,color:'#b1cbd6',desc:'最大生命 +35%，受到伤害 −12%。'},
  lens: {name:'鹰眼透镜',icon:'◎',cost:3,color:'#ddce91',desc:'射程 +2，攻速 +12%。近战也可使用。'},
  leech: {name:'饮星石',icon:'♦',cost:4,color:'#d7a2af',desc:'造成伤害的 18% 转为自身治疗。'},
  echo: {name:'回响符印',icon:'✦',cost:4,color:'#c4b2eb',desc:'每第 4 次普攻造成额外 65% 范围伤害。'},
  spring: {name:'长青之心',icon:'♧',cost:3,color:'#abd39b',desc:'每秒恢复 2.5% 最大生命；治疗效果 +35%。'}
};
export const CORE_PATHS = {
  fury: {name:'烈焰之心',icon:'♨',desc:'核心光环增伤从 25% 提升到 40%，震荡伤害 +30%。',color:'#f4bb84'},
  sanctuary: {name:'长青圣域',icon:'♧',desc:'光环内棋子与领主每秒恢复 1.5% 最大生命。',color:'#a7d6a0'},
  network: {name:'星火网络',icon:'◈',desc:'核心半径 +3；光环内城防攻速 +35%。',color:'#a9dce0'}
};
export const BRANCHES = {
  ballista: {base:'tower',name:'穿云弩炮',cost:10,desc:'射程 +3，伤害 +65%，攻击间隔 +25%。'},
  frost: {base:'tower',name:'寒霜箭塔',cost:10,desc:'命中的敌人减速 45%，持续 2 秒。'},
  pulse: {base:'relay',name:'脉冲中继',cost:10,desc:'星火对落点附近敌人造成 55% 溅射伤害。'},
  shelter: {base:'relay',name:'庇护中继',cost:10,desc:'每秒治疗 6 格内友军与建筑 1.2% 最大生命。'},
  market: {base:'farm',name:'商旅驿站',cost:8,desc:'每个黎明额外收入 3 金币。'},
  granary: {base:'farm',name:'战备粮仓',cost:8,desc:'黎明城堡额外恢复 70 生命；农庄最大生命 +180。'}
};
export const DAY_EVENTS = [
  {id:'caravan',name:'桥头商队',icon:'◉',story:'商队愿用补给交换王城铸币。路途漫长，如何投资这一日？',choices:[{id:'trade',name:'购入星髓',desc:'支付 6 金币，获得 3 星髓。',gold:-6,essence:3},{id:'escort',name:'护送商队',desc:'获得 5 金币；今夜敌军生命 +12%。',gold:5,risk:1.12},{id:'pass',name:'保持储蓄',desc:'不交易，保留资源。'}]},
  {id:'shrine',name:'林间旧圣坛',icon:'♧',story:'沉睡的圣坛仍回应余烬。让它滋养城墙，还是化作铸造的火种？',choices:[{id:'mend',name:'祝佑城墙',desc:'城堡立即恢复 120 生命。',heal:120},{id:'spark',name:'收集火种',desc:'获得 2 星髓。',essence:2},{id:'oath',name:'立下战誓',desc:'今夜全体友军伤害 +12%。',damage:1.12}]},
  {id:'workshop',name:'废弃工坊',icon:'⚒',story:'古老的机括仍有余温。工匠只来得及完成一项工作。',choices:[{id:'salvage',name:'拆解机括',desc:'获得 4 金币与 1 星髓。',gold:4,essence:1},{id:'walls',name:'加固城墙',desc:'支付 4 金币，城堡生命上限 +80 并恢复 80。',gold:-4,maxHp:80,heal:80},{id:'supply',name:'储存军粮',desc:'所有现存建筑恢复全部生命。',repair:true}]},
  {id:'scout',name:'斥候的密报',icon:'➶',story:'斥候发现敌人的粮道。一次突袭，或者一份可以交换的情报。',choices:[{id:'ambush',name:'伏击粮道',desc:'支付 4 金币，今夜敌军生命 −12%。',gold:-4,risk:.88},{id:'sell',name:'出售情报',desc:'获得 6 金币。',gold:6},{id:'prepare',name:'准备箭矢',desc:'今夜全体友军伤害 +10%。',damage:1.1}]}
];
export const STANCES = {guard:{name:'固守',desc:'围绕布阵位置迎敌，最多追击 3.5 格。'},hunt:{name:'突击',desc:'主动追击全场最近敌人，适合清理远处威胁。'}};
export const ENEMY_NAMES = {regular:'游荡者',ranged:'猎手',armored:'重甲卫士',fast:'疾行兽',siege:'攻城车',healer:'疗愈祭师',assassin:'潜袭者',boss:'首领'};
export const TERRAIN = [{x:-6.4,z:3.2},{x:6.4,z:-3.2}];
