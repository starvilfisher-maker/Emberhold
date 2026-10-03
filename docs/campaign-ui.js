import {unitPortrait} from './portraits.js';
import {DEFS,TRAITS,BUILDINGS} from './engine.js';
import {BIOMES,DIFFICULTIES,CHAPTERS,GEAR,CORE_PATHS,BRANCHES,DAY_EVENTS,STANCES,ENEMY_NAMES} from './content.js';

export function bindCampaignUI({getGame,modal,act,begin,getOptions,setOptions,getPreferences,applyPreferences,autoDeploy,isStarted,resume,getSound,setSound}) {
  const el=document.querySelector('#modal-content');
  let active='expedition',target=null;
  const disabled=value=>value?'disabled':'';
  function setup(){
    const options=getOptions();
    modal(`<div class="eyebrow">PLAN YOUR EXPEDITION · v1.3</div><h2>你将在哪里，守住黎明？</h2><p>八个长夜，十二种兵种。白昼经营与构筑，夜晚亲临战场。</p>
    <div class="hall-section-head"><h3>01 / 选择战场</h3><span>地形规则贯穿整场远征</span></div>
    <div class="biome-grid">${Object.entries(BIOMES).map(([id,b])=>`<button class="biome-card ${id===options.biome?'chosen':''}" data-biome="${id}" aria-pressed="${id===options.biome}" style="--biome:${b.color}"><div class="biome-art ${id}"><i></i><b>${b.icon}</b></div><strong>${b.name}</strong><small>${b.subtitle}</small><p>${b.desc}</p></button>`).join('')}</div>
    <div class="hall-section-head"><h3>02 / 选择难度</h3><span>新手推荐旅人</span></div>
    <div class="difficulty-grid">${Object.entries(DIFFICULTIES).map(([id,d])=>`<button class="difficulty-card ${id===options.difficulty?'chosen':''}" data-difficulty="${id}" aria-pressed="${id===options.difficulty}"><b>${d.name}</b><span>${d.desc}</span></button>`).join('')}</div>
    <div class="setup-footer"><span>每个白昼自动保存 · 支持键鼠 / 触屏</span><button class="primary" data-action="begin">点燃星火 · 出发 →</button></div>${isStarted()?'<button class="text-link" data-action="resume">返回当前远征</button>':''}`);
    el.classList.add('wide-modal','setup-modal');
  }
  function eventMarkup(){
    const s=getGame().state,e=DAY_EVENTS.find(e=>e.id===s.dayEvent?.id);
    if(s.legacy)return '<p>这是一份经典六夜存档，继续保留原有的关卡进度。新远征可体验战场与白昼事件。</p>';
    if(!e)return '';
    return `<section class="event-story"><span class="event-emblem">${e.icon}</span><div><span class="eyebrow">第 ${s.round} 日 · ${s.dayEvent.resolved?'已决议':'一次抉择'}</span><h3>${e.name}</h3><p>${e.story}</p></div></section><div class="choice-grid">${e.choices.map(c=>`<button class="choice-card ${s.dayEvent.choice===c.id?'chosen':''}" data-decision="${c.id}" ${disabled(s.phase!=='day'||s.dayEvent.resolved||s.gold+(c.gold||0)<0)}><b>${c.name}${s.dayEvent.choice===c.id?' ✓':''}</b><span>${c.desc}</span></button>`).join('')}</div><p class="hall-note">每个白昼最多决议一次。可跳过；临时增益仅对今夜生效。</p>`;
  }
  function expedition(){
    const g=getGame(),s=g.state;
    return `<div class="campaign-route" aria-label="远征路线">${Array.from({length:g.totalNights()},(_,i)=>{const w=s.legacy?null:CHAPTERS[i];return `<div class="route-node ${i+1===s.round?'current':i+1<s.round?'complete':''}"><b>${i+1<s.round?'✓':w?.boss?'♛':String(i+1).padStart(2,'0')}</b><span>${w?.name||'第 '+(i+1)+' 夜'}</span></div>`;}).join('')}</div>
    <div class="tactical-note"><b>今夜 / ${g.wave().name}</b><span>${g.wave().tip||'留意来敌方向，核心光环与城防共同支援你的棋子。'}</span></div>${eventMarkup()}<div class="hall-section-head"><h3>游星核心 / 专精</h3><span>第 2 日解锁 · 每次远征选择一项</span></div><div class="choice-grid">${Object.entries(CORE_PATHS).map(([id,p])=>`<button class="choice-card ${s.core.path===id?'chosen':''}" data-core-path="${id}" ${disabled(s.phase!=='day'||s.round<2||!!s.core.path)}><b style="color:${p.color}">${p.icon} ${p.name}${s.core.path===id?' ✓':''}</b><span>${p.desc}</span></button>`).join('')}</div>
    <div class="tactical-note"><b>◎ 高台阵位</b><span>战场上的两块金色方格让驻扎棋子射程 +1.5。适合射手，也能让固守前排更早迎敌。</span></div>`;
  }
  function army(){
    const g=getGame(),s=g.state,day=s.phase==='day';
    return `<div class="hall-section-head"><h3>军团 ${g.deployed().length} / ${s.level}</h3><div class="inline-actions"><button data-formation="save" ${disabled(!day)}>保存阵型</button><button data-formation="restore" ${disabled(!day||!s.formation)}>恢复阵型</button></div></div><p class="hall-note">每枚棋子一件装备。换装、出售与合成不会丢失装备。固守围绕原位迎敌；突击主动追击。战场上仍可直接拖动布阵。</p>
    <div class="army-list">${s.units.map(u=>{const d=DEFS[u.def],stats=g.unitStats(u);return `<article class="army-card ${target===u.id?'focused':''}"><div class="unit-medallion" style="--unit-color:${d.color}">${unitPortrait(u.def)}<small>${'★'.repeat(u.star)}</small></div><div class="army-identity"><b>${d.name}</b><span>${u.slot?'已出战':'备战席'} · ${TRAITS[d.faction].name} / ${TRAITS[d.role].name}</span><small>生命 ${Math.round(stats.hp)} · 伤害 ${Math.round(stats.damage)} · 射程 ${stats.range.toFixed(1)}</small></div><div class="unit-commands"><div class="stance-switch" aria-label="${d.name}的姿态">${Object.entries(STANCES).map(([id,t])=>`<button data-stance="${id}" data-id="${u.id}" aria-pressed="${(u.stance||'guard')===id}" title="${t.desc}" ${disabled(!day)}>${t.name}</button>`).join('')}</div><button class="gear-slot" data-equip-unit="${u.id}">${u.gear?GEAR[u.gear].icon+' '+GEAR[u.gear].name:'＋ 分配装备'}</button><button class="text-link" data-field="${u.id}" ${disabled(!day)}>${u.slot?'撤回':'一键上阵'}</button></div></article>`;}).join('')}</div>`;
  }
  function forge(){
    const g=getGame(),s=g.state,day=s.phase==='day';if(!s.units.some(u=>u.id===target))target=s.units[0]?.id;
    const u=s.units.find(u=>u.id===target);
    return `<div class="hall-section-head"><h3>军械锻造</h3><span>星髓 <strong>${s.essence}</strong> · 每夜奖励 2，首领夜奖励 3</span></div><p class="hall-note">锻造后在下方分配给棋子。每枚限一件，换装免费，效果不叠加。</p><div class="gear-grid">${Object.entries(GEAR).map(([id,item])=>`<article class="gear-card"><span class="gear-icon" style="color:${item.color}">${item.icon}</span><b>${item.name}</b><p>${item.desc}</p><button data-forge="${id}" ${disabled(!day||s.essence<item.cost||s.inventory.length>=12)}>锻造 <span>${item.cost} ✦</span></button></article>`).join('')}</div>
    <div class="hall-section-head"><h3>分配装备</h3><span>库存 ${s.inventory.length} / 12</span></div><div class="unit-picker">${s.units.map(unit=>`<button data-equip-target="${unit.id}" aria-pressed="${unit.id===target}">${DEFS[unit.def].icon} ${DEFS[unit.def].name} ${'★'.repeat(unit.star)}</button>`).join('')}</div>
    ${u?`<div class="equipped-line"><b>${DEFS[u.def].name}</b><span>当前：${u.gear?GEAR[u.gear].name:'未装备'}</span>${u.gear?`<button data-unequip="${u.id}" ${disabled(!day||s.inventory.length>=12)}>卸下</button>`:''}</div>`:'<p>招募棋子后即可分配装备。</p>'}
    <div class="inventory-row">${s.inventory.length?s.inventory.map((id,index)=>`<button data-equip="${index}" ${disabled(!day||!u)} title="${GEAR[id].desc}">${GEAR[id].icon} ${GEAR[id].name}<small>点击装备给当前棋子</small></button>`).join(''):'<div class="empty-state">军械库暂无闲置装备。锻造一件，或卸下棋子的装备。</div>'}</div>`;
  }
  function city(){
    const g=getGame(),s=g.state,day=s.phase==='day';
    return `<div class="hall-section-head"><h3>城堡与六处工事</h3><button data-repair-castle ${disabled(!day||s.castle.hp>=s.castle.maxHp||s.gold<5)}>修复城堡 · 5 ◉</button></div><p class="hall-note">建筑达到 2 级后可选择一个永久分支。建筑被摧毁后可原位重建。农庄只按存活建筑结算收益。</p><div class="city-grid">${Array.from({length:6},(_,socket)=>{const b=s.buildings.find(b=>b.socket===socket&&b.hp>0),names=['西北','东北','西南','东南','北门','南门'];return `<article class="city-card"><span class="eyebrow">${String(socket+1).padStart(2,'0')} / ${names[socket]}基座</span>${b?`<h3>${BRANCHES[b.branch]?.name||BUILDINGS[b.type].name} <small>Lv.${b.level}</small></h3><p>${BRANCHES[b.branch]?.desc||BUILDINGS[b.type].desc}</p><div class="city-hp"><i style="width:${100*b.hp/b.maxHp}%"></i></div><span class="hall-note">${Math.ceil(b.hp)} / ${b.maxHp} 生命${b.type!=='farm'?' · 射程 '+g.buildingStats(b).range.toFixed(1):' · 每夜 '+(4*b.level+(b.branch==='market'?3:0))+' ◉'}</span><div class="inline-actions"><button data-city-upgrade="${socket}" ${disabled(!day||b.level>=3||s.gold<BUILDINGS[b.type].cost+4*(b.level-1))}>${b.level>=3?'最高等级':'升级 '+(BUILDINGS[b.type].cost+4*(b.level-1))+' ◉'}</button><button data-city-repair="${socket}" ${disabled(!day||b.hp>=b.maxHp||s.gold<3)}>修复 3 ◉</button></div>${!b.branch?`<div class="branch-options">${Object.entries(BRANCHES).filter(([,p])=>p.base===b.type).map(([id,p])=>`<button data-branch="${id}" data-socket="${socket}" ${disabled(!day||b.level<2||s.gold<p.cost)}><b>${p.name} · ${p.cost} ◉</b><span>${p.desc}</span></button>`).join('')}<small>${b.level<2?'升至 2 级解锁分支':'选择后本建筑不可更换分支'}</small></div>`:''}`:`<h3>空置工事</h3><p>选择生产、防守或光环网络。</p><div class="build-choices">${Object.entries(BUILDINGS).map(([id,b])=>`<button data-city-build="${id}" data-socket="${socket}" ${disabled(!day||s.gold<b.cost)}><b>${b.name} · ${b.cost} ◉</b><small>${b.desc}</small></button>`).join('')}</div>`}</article>`;}).join('')}</div>`;
  }
  function codex(){
    const g=getGame(),odds=g.shopOdds();
    return `<div class="hall-section-head"><h3>兵种图鉴 / 十二英雄</h3><span>3 枚同名同星自动合成</span></div><p class="hall-note">当前人口 ${g.state.level}：2–3 费 ${odds[0]}% · 4 费 ${odds[1]}% · 5 费 ${odds[2]}%。同费用档内每个兵种等概率。以下为一星基础数值。</p><div class="codex-grid">${Object.entries(DEFS).map(([id,d])=>`<article class="codex-card" style="--unit-color:${d.color}"><div><span class="codex-portrait">${unitPortrait(id)}</span><b>${d.name}</b><strong>${d.cost} ◉</strong></div><small>${TRAITS[d.faction].name} · ${TRAITS[d.role].name}</small><p>${d.ability}</p><footer>生命 ${d.hp} · 伤害 ${d.damage}<br>射程 ${d.range} · ${d.interval} 秒 / 次</footer></article>`).join('')}</div><div class="hall-section-head"><h3>羁绊与反制</h3><span>按已部署的不同棋种计数</span></div><div class="trait-reference">${Object.values(TRAITS).map(t=>`<p><b>${t.icon} ${t.name}</b><span>${t.desc}</span></p>`).join('')}</div><div class="enemy-guide"><p><b>攻城车</b>射程长，优先破坏城防。让领主或突击棋子接近。</p><p><b>疗愈祭师</b>治疗附近敌人。集火祭师，或用范围伤害突破治疗。</p><p><b>潜袭者</b>直接追击后排。用护甲与留守前排保护输出。</p><p><b>重甲卫士</b>抵御 20% 普通兵种伤害，弩手与秘术穿透护甲。</p><p><b>首领</b>红圈预警 2.2 秒，命中所有圈内友军。靠近后用 Q 取消蓄力。</p></div>`;
  }
  function settings(){const p=getPreferences();return `<div class="settings-form"><h3>画面与性能</h3><label>画质<select id="quality-setting"><option value="low" ${p.quality==='low'?'selected':''}>流畅 · 低分辨率，无动态阴影</option><option value="balanced" ${p.quality==='balanced'?'selected':''}>均衡 · 标准阴影与特效</option><option value="high" ${p.quality==='high'?'selected':''}>精细 · 高清阴影与特效</option></select></label><label class="check-setting"><input id="motion-setting" type="checkbox" ${p.motion?'checked':''}> 环境动效与角色弹跳</label><h3>声音</h3><button class="secondary" data-audio-toggle>${getSound()?'♪ 音效已开启 · 点击静音':'♪ 音效已关闭 · 点击开启'}</button><label>音效音量 <output id="volume-value">${Math.round(p.volume*100)}%</output><input id="volume-setting" type="range" min="0" max="100" value="${Math.round(p.volume*100)}"></label><p class="hall-note">此开关与战场顶部 ♪ 同步。首领预警同时提供红圈与文字，静音也能判断。</p><h3>操作与存档</h3><p>WASD / 方向键移动，空格冲刺，Q 震荡，E 移动核心，B 军务，Enter 开战。触屏使用摇杆与技能按钮。</p><p>每个白昼自动保存；夜晚刷新回到开战前。旧版六夜存档可继续，新远征使用八夜规则。设置保存在当前浏览器。</p></div>`;}
  function hall(tab=active){
    active=tab;const g=getGame(),s=g.state;
    const names={expedition:'远征',army:'军团',forge:'锻造',city:'城防',codex:'图鉴',settings:'设置'};
    const body={expedition,army,forge,city,codex,settings}[active]||expedition;
    modal(`<div class="hall-header"><div><div class="eyebrow">EMBERHOLD / COUNCIL</div><h2>余烬军务厅</h2></div><div class="hall-resources"><b>${s.gold} ◉</b><b>${s.essence} ✦</b><span>第 ${s.round} 日</span></div><button class="hall-close" data-action="resume" aria-label="返回战场">×</button></div><nav class="hall-tabs" aria-label="军务分类">${Object.entries(names).map(([id,name])=>`<button data-hall="${id}" aria-pressed="${id===active}">${name}</button>`).join('')}</nav><div class="hall-body">${body()}</div><div class="hall-footer"><span>${s.phase==='day'?'白昼 · 可以经营与布阵':'夜晚 · 仅可查看资料与调整设置'}</span><button class="secondary" data-action="resume">返回战场</button></div>`);
    el.classList.add('wide-modal','hall-modal');
  }
  document.querySelector('#modal').addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b||b.disabled)return;const d=b.dataset,g=getGame();
    if(d.biome){setOptions({...getOptions(),biome:d.biome});setup();return;}
    if(d.difficulty){setOptions({...getOptions(),difficulty:d.difficulty});setup();return;}
    if(d.hall){hall(d.hall);return;}
    if(d.audioToggle!==undefined){setSound(!getSound());hall('settings');return;}
    if(d.equipUnit){target=d.equipUnit;hall('forge');return;}
    if(d.equipTarget){target=d.equipTarget;hall('forge');return;}
    let result;
    if(d.decision)result=g.resolveEvent(d.decision);
    if(d.corePath)result=g.specialize(d.corePath);
    if(d.forge)result=g.forge(d.forge);
    if(d.equip!==undefined)result=g.equip(target,Number(d.equip));
    if(d.unequip)result=g.unequip(d.unequip);
    if(d.stance)result=g.setStance(d.id,d.stance);
    if(d.field){const u=g.state.units.find(u=>u.id===d.field);result=u?.slot?g.recall(u.id):autoDeploy(d.field);}
    if(d.formation)result=d.formation==='save'?g.saveFormation():g.restoreFormation();
    if(d.cityBuild)result=g.build(Number(d.socket),d.cityBuild);
    if(d.cityUpgrade!==undefined)result=g.upgrade(Number(d.cityUpgrade));
    if(d.cityRepair!==undefined)result=g.repairBuilding(Number(d.cityRepair));
    if(d.branch)result=g.branch(Number(d.socket),d.branch);
    if(d.repairCastle!==undefined)result=g.repair();
    if(result){const scroll=el.scrollTop;act(result);hall(active);el.scrollTop=scroll;}
  });
  el.addEventListener('change',event=>{const p={...getPreferences()};if(event.target.id==='quality-setting')p.quality=event.target.value;else if(event.target.id==='motion-setting')p.motion=event.target.checked;else if(event.target.id==='volume-setting')p.volume=Number(event.target.value)/100;else return;applyPreferences(p);});
  el.addEventListener('input',event=>{if(event.target.id==='volume-setting')document.querySelector('#volume-value').textContent=event.target.value+'%';});
  return {hall,setup,setTarget:id=>{target=id;}};
}
