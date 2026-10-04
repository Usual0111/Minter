(function(root){'use strict';
// Presentation only: sample the exact engine view; never interpolate or change mining.
function createCounter({document:d=root.document,view,now=()=>root.performance.now(),schedule=root.setInterval}={}){
 let record=null;
 const filters='<svg class="mined-counter-defs" aria-hidden="true" width="0" height="0"><defs><filter id="mined-digit-soft" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="0 0.6"/></filter><filter id="mined-digit-fast" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="0 0.9"/></filter></defs></svg>';
 function sample(x){
  if(d.hidden)return;
  const el=d.querySelector('[data-session-live="amount"]');if(!el){record=null;return;}
  const at=now(),text=(x.accumulatedMicroCents/x.unit/100).toFixed(5),units=BigInt(text.replace('.',''));
  if(!record||record.el!==el||record.session!==x.sessionId){
   if(!d.getElementById('mined-digit-soft'))d.body.insertAdjacentHTML('beforeend',filters);
   const digits=[...text.slice(-2)].map(char=>{const digit=d.createElement('span'),core=d.createElement('span');digit.className='mined-counter-digit';digit.setAttribute('aria-hidden','true');core.className='mined-counter-core';core.textContent=char;digit.dataset.digit=char;digit.append(core);return digit;});
   el.replaceChildren(d.createTextNode(text.slice(0,-2)),...digits);el.setAttribute('role','img');
   record={el,session:x.sessionId,units,at,prefix:text.slice(0,-2),digits};
  }
  const elapsed=at-record.at,delta=units-record.units;
  // Carries (9 -> 0) count as one step; resumed/offline jumps are not motion.
  record.digits.forEach((digit,i)=>{
   const divisor=i===0?10n:1n,steps=units/divisor-record.units/divisor;
   const fast=x.status==='active'&&elapsed>0&&elapsed<=250&&delta>=0n&&steps>1n;
   digit.style.setProperty('--digit-trail',fast?'0.55':'0');
   digit.style.setProperty('--digit-blur',steps>2n?'url(#mined-digit-fast)':'url(#mined-digit-soft)');
   const char=text.slice(-2)[i];if(digit.dataset.digit!==char){digit.dataset.digit=char;digit.firstElementChild.textContent=char;}
  });
  const prefix=text.slice(0,-2);if(record.prefix!==prefix){el.firstChild.nodeValue=prefix;record.prefix=prefix;}
  if(el.getAttribute('aria-label')!==text)el.setAttribute('aria-label',text);
  record.units=units;record.at=at;
 }
 // An independent 100ms display cadence leaves all other UI timers untouched.
 if(typeof schedule==='function'&&typeof view==='function')schedule(()=>{if(!d.hidden&&d.querySelector('[data-session-live="amount"]'))sample(view().rewardMining);else record=null;},100);
 return {sample};
}
function create(h){const {t,loc,icon,btn,action,open,toast}=h,K=typeof module==='object'?require('./contracts-ui.js'):root.ContractsUI,cr=K.amount,contracts=K.create(h);let signature='',pending='';
const counter=typeof document!=='undefined'&&typeof root.setInterval==='function'&&h.view?createCounter({view:h.view}):null;
const clock=ms=>{const sec=Math.ceil(Math.max(0,ms)/1000);return (sec>=3600?String(Math.floor(sec/3600)).padStart(2,'0')+':':'')+String(Math.floor(sec/60)%60).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');};
const amount=x=>(x.accumulatedMicroCents/x.unit/100).toFixed(5);
const status=x=>x.status==='ready'?t('Mining complete','Добыча завершена'):x.status==='active'?t('Mining active','Майнинг активен'):x.status==='finishing'?t('Finishing session','Завершаем сеанс'):t('Node awaiting charge','Нода ожидает заряд');
const speed=x=>(Number(x.rate.numerator)/Number(x.rate.denominator)/x.unit/100).toFixed(3);
let speedChange=null,rewardChange=null,rewardTimer=0,rewardFrame=0;const speedReceipts=new Set();
const motionOff=()=>typeof document!=='undefined'&&document.hidden||typeof MotionUI!=='undefined'&&MotionUI.reduced?.()&&!root.document?.body?.classList?.contains('force-animations');
function clearReward(){if(rewardTimer)root.clearTimeout?.(rewardTimer);if(rewardFrame)root.cancelAnimationFrame?.(rewardFrame);rewardTimer=rewardFrame=0;const el=rewardChange?.node;if(el){el.classList.remove('is-reward-credit');el.style.removeProperty('animation-delay');}rewardChange=null;}
function liveReward(x){if(rewardChange&&(x.status!=='active'||x.sessionId!==rewardChange.id||x.sessionRewardCents!==rewardChange.to||motionOff()))clearReward();return rewardChange;}
function rewardValue(x){const change=liveReward(x);if(!change)return displayedReward(x);if(change.at===null)return change.from;const elapsed=Date.now()-change.at-2850;if(elapsed<=0)return change.from;if(elapsed>=600)return change.to;const p=elapsed/600,eased=1-Math.pow(1-p,3);return Math.round((change.from+(change.to-change.from)*eased)*change.factor)/change.factor;}
const rewardText=x=>'+'+cr(rewardValue(x))+' CR';
function paintReward(x){
 const change=liveReward(x),nodes=typeof document!=='undefined'?document.querySelectorAll('[data-session-live="ready"]'):[];
 const elapsed=change&&change.at!==null?Date.now()-change.at-2850:-1;
 for(const el of nodes){const text=rewardText(x);if(el.textContent!==text)el.textContent=text;
  if(change&&elapsed>=0&&elapsed<600&&change.node!==el){if(change.node){change.node.classList.remove('is-reward-credit');change.node.style.removeProperty('animation-delay');}change.node=el;el.style.setProperty('animation-delay','-'+elapsed+'ms');el.classList.add('is-reward-credit');}
 }
 if(change&&elapsed>=600){clearReward();return;}
 if(change&&elapsed>=0&&nodes.length&&typeof root.requestAnimationFrame==='function'&&!rewardFrame)rewardFrame=root.requestAnimationFrame(()=>{rewardFrame=0;paintReward(x);});
}
function scheduleReward(){if(!rewardChange||rewardChange.at===null||typeof root.setTimeout!=='function')return;if(rewardTimer)root.clearTimeout?.(rewardTimer);rewardTimer=root.setTimeout(()=>{rewardTimer=0;if(h.view)paintReward(h.view().rewardMining);},Math.max(0,rewardChange.at+2850-Date.now()));}
// The verified award is already in the engine; only its presentation waits for ad closure.
function adClosed(){if(!speedChange||speedChange.at!==null)return;const at=Date.now();speedChange.at=at;if(rewardChange){rewardChange.at=at;scheduleReward();}h.render?.();}
function leave(){clearReward();speedChange=null;}
if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(document.hidden)leave();});
let contractCount=null,contractFlash=null,bonusPending=false;
function observeContract(x){const d=x.contracts;if(contractCount!==null&&d.completedTotal>contractCount){const c=d.items.filter(c=>c.status==='completed').sort((a,b)=>b.completedAt-a.completedAt)[0];if(c)contractFlash={contract:c,until:Date.now()+2500,day:d.key};}contractCount=d.completedTotal;if(contractFlash&&(Date.now()>=contractFlash.until||contractFlash.day!==d.key))contractFlash=null;}
function contractCard(x){const d=x.contracts,c=contractFlash?.contract||d.active,complete=!!contractFlash||d.allComplete,label=complete?'✓':c?c.progress+'/'+c.views:'—';return btn(`<span class="node-card-icon"><svg class="node-contract-icon" viewBox="0 0 40 40" aria-hidden="true"><path d="M25 34H9a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h20a3 3 0 0 1 3 3v13M12 10h14M12 16h14M12 22h7M12 28h5"/><circle cx="29" cy="29" r="9"/><path class="contract-icon-check" d="m24.8 29 2.9 3 5.1-6"/></svg></span><span class="node-card-copy"><span class="node-card-caption">${t('Contract','Контракт')}</span><strong class="node-contract-value${complete?' is-complete':''}">${label}</strong></span>`,'homeContract',`aria-label="${t('Mining contract','Контракт добычи')} ${complete?t('Completed','Выполнен'):label}"`,'node-panel-tile node-contract-control');}
function bonusCard(s){return btn(`<span class="node-card-icon node-bonus-gift"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 16h30v8H5zM8 24v13h24V24M20 16v21M20 16c-5-1-11-4-11-8 0-3 3-5 6-3 3 2 5 7 5 11Zm0 0c5-1 11-4 11-8 0-3-3-5-6-3-3 2-5 7-5 11Z"/></svg><i class="node-bonus-dot" ${contracts.bonusAvailable(s)?'':'hidden'}></i></span><span class="node-card-copy"><strong>${t('Bonuses','Бонусы')}</strong></span>`,'homeBonuses',`aria-label="${t('Daily bonuses','Ежедневные бонусы')}"`,'node-panel-tile node-bonus-control');}
function bonusKey(s){return JSON.stringify([s.dailyReady,s.state.lastDaily,s.rewardMining.day.key,s.rewardMining.day.total,s.rewardMining.viewBonuses]);}
let bonusSheetKey='';
function openBonuses(s){bonusSheetKey=bonusKey(s);(h.openSheet||open)(t('Bonuses','Бонусы'),contracts.bonuses(s));}
// Only a newly confirmed boost of the same live session starts this visual effect.
function confirmedBoost(before,after,result){if(!result?.eventId||result.alreadyConfirmed||speedReceipts.has(result.eventId))return;speedReceipts.add(result.eventId);if(before?.status!=='active'||after.status!=='active'||before.sessionId!==after.sessionId||after.sessionRewardCents<=before.sessionRewardCents||motionOff())return;clearReward();const at=typeof document!=='undefined'&&document.getElementById?.('modal')?.open?null:Date.now();speedChange={id:after.sessionId,key:result.eventId,from:speed(before),to:speed(after),at};const precision=Math.max(cr(before.sessionRewardCents).split('.')[1].length,cr(after.sessionRewardCents).split('.')[1].length);rewardChange={id:after.sessionId,key:result.eventId,from:before.sessionRewardCents,to:after.sessionRewardCents,at,factor:10**(precision-2),node:null};scheduleReward();}
function liveSpeedChange(x){if(x.status!=='active'||speedChange?.id!==x.sessionId||speedChange.at!==null&&Date.now()-speedChange.at>=2850){speedChange=null;return null;}return speedChange;}
const normalSpeed=value=>`<span class="mining-speed-dot">●</span><span class="mining-speed-label"> ${t('Mining','Майнинг')} · </span><span class="mining-speed-value">${value} CR/${t('min','мин')}</span>`;
function statusLine(x){if(x.status!=='active')return status(x);const change=liveSpeedChange(x);if(!change)return normalSpeed(speed(x));if(change.at===null)return normalSpeed(change.from);
 return `<span class="mining-speed-transition" aria-hidden="true" style="--speed-delay:-${Math.max(0,Date.now()-change.at)}ms"><span class="mining-speed-outgoing">${normalSpeed(change.from)}</span><span class="mining-speed-delta"><span class="mining-speed-arrow">↑ </span><span class="mining-speed-old">${change.from} → </span><span class="mining-speed-value">${change.to} CR/${t('min','мин')}</span></span><span class="mining-speed-incoming">${normalSpeed(change.to)}</span></span><span class="mining-speed-accessible">↑ ${change.from} → ${change.to} CR/${t('min','мин')}</span>`;
}
function control(x){const o=x.offer;
 if(pending==='claim')return {id:'claim-pending',label:t('Collecting…','Получение…'),note:t('Your progress is saved','Прогресс сохранён'),disabled:true,loading:true};
 if(pending==='free')return {id:'free-pending',label:t('Starting node…','Запуск ноды…'),disabled:true,loading:true};
 if(x.readyCents)return {id:'claim',action:'homeRewardClaim',label:t('Collect ','Получить ')+t(cr(x.readyCents),cr(x.readyCents).replace('.',','))+' CR',note:''};
 if(x.status==='finishing')return {id:'finishing',label:t('Finishing session','Завершаем сеанс'),note:t('Waiting for the started ad result','Ожидаем результат начатого просмотра'),disabled:true,loading:true};
 if(pending||x.adPending||o.reason==='pending')return {id:'ad-pending',label:t('Opening ad…','Открываем рекламу…'),note:t('Your progress is saved','Прогресс сохранён'),disabled:true,loading:true};
 if(!x.activeCount&&x.freeSession?.reason==='available')return {id:'free',action:'homeRewardFree',label:t('Start mining','Начать добычу'),subtitle:t('Free session · ','Бесплатный сеанс · ')+t(cr(x.freeSession.rewardCents),cr(x.freeSession.rewardCents).replace('.',','))+' CR'};
 if(o.reason==='cooldown')return {id:'cooldown',label:t('Next boost in ','Следующее усиление через ')+clock(o.nextAt-x.serverNow),note:t('Your progress is saved','Прогресс сохранён'),disabled:true};
 if(o.reason==='daily')return {id:'daily',label:t('Daily charge complete','Дневной заряд завершён'),note:t('Mining continues','Добыча продолжается'),disabled:true};
 if(o.reason!=='available')return {id:'unavailable',label:t('Ads unavailable for now','Реклама пока недоступна'),note:x.activeCount?t('Mining continues','Добыча продолжается'):t('Try again later','Попробуйте позже'),disabled:true};
 const price=t(cr(o.rewardCents),cr(o.rewardCents).replace('.',','));
 return {id:'ad',action:'homeRewardAd',label:x.activeCount?t('Boost mining','Усилить добычу'):t('Start · ▶︎ ad · +','Начать · ▶︎ реклама · +')+price+' CR',subtitle:x.activeCount?t('Watch ad · +','Смотреть рекламу · +')+price+' CR':undefined,note:x.activeCount?t('Session end stays unchanged','Окончание сеанса не меняется'):'+'+price+' CR · '+t('session ','сеанс ')+clock(o.durationMs)};
}
const displayedTime=x=>x.activeCount?clock(x.remainingMs):x.readyCents?clock(0):clock(x.freeSession?.reason==='available'?x.freeSession.durationMs:x.offer.durationMs||x.sessionDurationMs);
const displayedReward=x=>x.status==='idle'&&!x.activeCount&&!x.readyCents&&x.freeSession?.reason==='available'?x.freeSession.rewardCents:x.sessionRewardCents;
function actionKey(x){return [control(x).id,x.sessionId||'',x.readyCents,(x.readySessionIds||[]).join(','),x.offer.source||'',x.offer.rewardCents||0,x.offer.durationMs||0,x.node.id,x.freeSession?.dayKey??'',x.freeSession?.rewardCents??0,x.freeSession?.durationMs??0].join(':');}
// A gesture remains bound to the action and promise visible when it began.
let gesture=null;if(typeof document!=='undefined'&&document.addEventListener){const begin=event=>{const n=event.target.closest?.('.session-control-button');gesture=n?{node:n,intent:n.dataset.sessionIntent}:null;};document.addEventListener('pointerdown',begin,true);document.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')begin(e);},true);document.addEventListener('pointercancel',()=>{gesture=null;},true);document.addEventListener('click',e=>{const n=e.target.closest?.('.session-control-button');if(!n)return;const stale=gesture&&(gesture.node!==n||gesture.intent!==n.dataset.sessionIntent);gesture=null;if(stale){e.preventDefault();e.stopImmediatePropagation();}},true);}
function key(x,s){return JSON.stringify([actionKey(x),x.status,x.activeCount,x.nearestId,x.day.key,x.day.total,x.sessionRewardCents,x.adPending,pending,x.contracts?.key,x.contracts?.active?.id,x.contracts?.active?.progress,x.contracts?.completedTotal,contractFlash?.contract.id,s&&contracts.bonusAvailable(s)]);}
function card(x,s){const c=control(x),attrs=`data-session-intent="${actionKey(x)}" ${c.disabled?'disabled':''} ${c.loading?'aria-busy="true"':''}`;
return `<section class="session-panel session-control reward-control reference-session-panel" aria-label="${t('Reward mining','Добыча наград')}">
<div class="session-reference-heading node-panel-heading"><h1><a href="#/nodes" class="session-model-link" aria-label="${t('Equipment','Оборудование')}">${loc(x.node.name)}</a><span class="session-reference-tier">${t('Tier','Тир')} ${x.node.tier}</span></h1></div>
<div class="node-panel-tiles">${contractCard(x)}${bonusCard(s)}</div>
<div class="session-mining-row"><dl class="session-control-metrics session-reward-metric"><div><dt>${t('Session reward','Награда сеанса')}</dt><dd class="session-reward-value"><img class="session-reward-coin" src="assets/ui-coin.svg" alt="" width="16" height="16"><span class="session-reward-number" data-session-live="ready">${rewardText(x)}</span></dd></div></dl><dl class="session-control-metrics session-time-metric"><div><dt>${t('Time left','Осталось времени')}</dt><dd data-session-live="time">${displayedTime(x)}</dd></div></dl></div>
<div class="session-control-progress continuous-mining-progress" role="progressbar" aria-label="${t('Session elapsed time','Прошедшее время сеанса')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(x.progress*100)}"><span style="transform:scaleX(${x.progress})"></span></div>
<div class="session-control-action">${btn(c.subtitle?`<span class="free-mining-copy"><span class="free-mining-title">${c.label}</span><span class="free-mining-subtitle">${c.subtitle}</span></span>`:c.label,c.action||'noop',attrs,'session-control-button')}</div></section>`;}
function render(s){const x=s.rewardMining;observeContract(x);signature=key(x,s);const effect=liveSpeedChange(x);return `<section class="session-total"><p>${t('Mined','Добыто')}</p><div class="reference-total"><img src="assets/ui-coin.svg" alt="" width="40" height="40"><span data-session-live="amount">${amount(x)}</span></div><p class="sector-count${x.status==='active'?' mining-speed':''}" data-speed-effect="${effect?.at!==null?effect?.key||'':''}" data-session-live="status">${statusLine(x)}</p></section><section class="hero journey-hero session-scene" aria-label="${t('Virtual mining node','Виртуальная майнинговая нода')}"></section>${card(x,s)}`;}
function extras(s){return `<section class="session-extras"><div class="daily-strip">${icon('gift')}<div><h2>${t('Daily reward','Ежедневная награда')}</h2><p>+${cr(s.state.settings.daily.cr)} CR · +${s.state.settings.daily.gems} Gems</p></div>${btn(s.dailyReady?t('Claim','Получить'):clock(s.state.lastDaily+s.state.settings.daily.intervalMs-s.now),'daily',s.dailyReady?'':'disabled','secondary')}</div>${btn(t('Seasonal missions','Сезонные миссии'),'missions','','secondary full')}</section>`;}
async function click(a,intent,data={}){const s=h.view();if(a==='homeCollect'){const out=await action('homeCollect',{galaxy:s.home.galaxy.id});if(out){if(typeof MotionUI!=='undefined')MotionUI.claim(out.collected,s.state.settings.microPerData);toast('+'+cr(out.credited)+' CR');}return;}
const x=s.rewardMining;if(a==='homeContract'){observeContract(x);(h.openSheet||open)(t('Mining contract','Контракт добычи'),contracts.details(x,contractFlash?.contract));return;}if(a==='homeBonuses'){openBonuses(s);return;}if(a==='homeBonusDaily'||a==='homeBonusViews'){if(bonusPending||h.busy?.())return;bonusPending=true;try{const out=await action(a==='homeBonusDaily'?'daily':'rewardViewBonusClaim',a==='homeBonusDaily'?{}:{dayKey:Number(data.dayKey),views:Number(data.views)});if(out){toast(a==='homeBonusDaily'?'+'+cr(s.state.settings.daily.cr)+' CR · +'+s.state.settings.daily.gems+' Gems':out.credited?'+'+cr(out.credited)+' CR':t('Reward already collected','Награда уже получена'));openBonuses(h.view());}}finally{bonusPending=false;}return;}if(a==='homeGalaxies'){open(t('Active galaxy','Активная галактика'),s.state.nodeHub.settings.galaxies.map(g=>btn(loc(g.name)+' · '+g.sector,'homeSelect',`data-galaxy="${g.id}" ${g.hazard&&!s.state.nodes.orbital?'disabled':''}`,'secondary full')).join('')+extras(s)+btn(t('Profile & settings','Профиль и настройки'),'menu','','secondary full'));return;}if(a==='homeEquipment'){h.route('nodes');return;}
if(!a.startsWith('homeReward')||pending||h.busy?.())return;const c=control(x);if(c.action!==a||c.disabled||intent&&intent!==actionKey(x))return;pending=a==='homeRewardClaim'?'claim':a==='homeRewardFree'?'free':'ad';h.render();try{if(a==='homeRewardClaim'){const out=await action('rewardClaim',{sessionIds:x.readySessionIds,rewardCents:x.readyCents});if(out?.claimChanged)toast(t('Reward changed. Tap Collect again.','Награда обновлена. Нажмите «Получить» ещё раз.'));else if(out&&!out.credited)toast(t('Reward already collected','Награда уже получена'));}else if(a==='homeRewardFree'){const f=x.freeSession,out=await action('rewardFreeStart',{dayKey:f.dayKey,rewardCents:f.rewardCents,durationMs:f.durationMs,nodeId:f.nodeId});if(out?.freeOfferChanged)toast(t('Free launch changed. Check the button and try again.','Бесплатный запуск обновился. Проверьте кнопку и повторите.'));else if(out?.freeStarted)toast(t('Free mining session started','Бесплатный сеанс добычи запущен'));}else await h.watchRewardAd(x.offer);}finally{pending='';h.render();}}
function tick(s){const x=s.rewardMining;observeContract(x);if(typeof document!=='undefined'&&document.querySelector('[data-node-bonuses]')&&!bonusPending&&bonusKey(s)!==bonusSheetKey)openBonuses(s);if(key(x,s)!==signature){h.render();return;}const set=(name,value)=>document.querySelectorAll(`[data-session-live="${name}"]`).forEach(e=>e.textContent=value);if(!counter)set('amount',amount(x));else if(x.status!=='active')counter.sample(x);const effect=liveSpeedChange(x),speedEffect=effect?.at!==null?effect?.key||'':'';document.querySelectorAll('[data-session-live="status"]').forEach(e=>{if(!effect||e.dataset?.speedEffect!==speedEffect){const line=statusLine(x);if(e.innerHTML!==line)e.innerHTML=line;if(e.dataset)e.dataset.speedEffect=speedEffect;}e.classList.toggle('mining-speed',x.status==='active');});set('time',displayedTime(x));paintReward(x);if(x.offer.reason==='cooldown')document.querySelectorAll('.session-control-button').forEach(b=>b.textContent=control(x).label);document.querySelectorAll('.session-control-progress').forEach(e=>{e.setAttribute('aria-valuenow',Math.round(x.progress*100));e.firstElementChild.style.transform='scaleX('+x.progress+')';});}
return {render,click,tick,control,actionKey,confirmedBoost,adClosed,leave};}
root.HomeUI={create,createCounter};if(typeof module==='object')module.exports={create,createCounter};
})(typeof globalThis!=='undefined'?globalThis:window);
