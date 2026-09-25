(function(root){'use strict';
const H=3600000,D=24*H,M=1000000,copy=x=>JSON.parse(JSON.stringify(x));
// Demo economy. Monetary values are integer CR cents and DATA micro-units.
const config={version:1,travelMs:120000,deployMs:60000,adCooldownMs:240000,overclockMs:D,lossGraceMs:H,lossBps:1000,eventMs:H,eventExtensionMs:30*60000,eventMultiplier:10,swarmBps:1800,
 tiers:[
 {id:'relay',tier:1,name:['Dust-Scout','Пылевик'],rarity:['Common','Обычный'],hash:100,price:2500,bufferHours:2,requires:null,feature:['Compact buffer · frequent collection','Небольшой буфер · частый сбор']},
 {id:'storage',tier:2,name:['Orbital Lens','Орбитальный Линзовик'],rarity:['Uncommon','Необычный'],hash:600,price:12000,bufferHours:8,requires:['relay',3],feature:['Extended offline buffer','Расширенный офлайн-буфер']},
 {id:'gpu',tier:3,name:['Deep-Scanner','Гео-Анализатор'],rarity:['Rare','Редкий'],hash:2500,price:45000,bufferHours:12,requires:['storage',3],feature:['Anomaly discoveries · 25% per hour','Поиск аномалий · 25% в час']},
 {id:'orbital',tier:4,name:['Void Resonator','Пустотный Эхолот'],rarity:['Epic','Эпический'],hash:10000,price:150000,bufferHours:16,requires:['gpu',10],feature:['Hazard access · exclusive Anomaly pools','Hazard-зоны · особые пулы аномалий']},
 {id:'swarm',tier:5,name:['Swarm Coordinator','Рой-Манипулятор'],rarity:['Legendary','Легендарный'],hash:25000,price:600000,bufferHours:24,requires:['orbital',3],feature:['+18% to Tier 1–3 in the same galaxy','+18% для Tier 1–3 в той же галактике']},
 {id:'genesis',tier:6,name:['Genesis Relic','Сингулярный Архиватор'],rarity:['Mythic','Мифический'],hash:75000,price:2500000,bufferHours:36,requires:['swarm',3],feature:['Governance · Anomalies · relic keys','Governance · аномалии · ключи реликвий']}
 ],
 galaxies:[
 {id:'aurora',name:['Aurora Reach','Предел Авроры'],sector:'EU-07',bps:10000,slots:4,hazard:false,hue:0},
 {id:'cygnus',name:['Cygnus Drift','Дрейф Лебедя'],sector:'CY-12',bps:12500,slots:6,hazard:false,hue:45},
 {id:'void',name:['Void Rift','Разлом Пустоты'],sector:'VX-04',bps:20000,slots:8,hazard:true,hue:250,lowTier:'penalty'},
 {id:'abyss',name:['Obsidian Abyss','Обсидиановая Бездна'],sector:'OB-99',bps:28000,slots:10,hazard:true,hue:110,lowTier:'break'}
 ],
 modules:[
 {id:'battery',name:['Battery','Батарея'],icon:'bolt',baseData:5*M,baseCR:1000,max:5,description:['+2 hours of buffer per level','+2 часа буфера за уровень']},
 {id:'antenna',name:['Antenna','Антенна'],icon:'send',baseData:8*M,baseCR:1500,max:5,description:['+10% fleet hashrate per level','+10% хешрейта флота за уровень']},
 {id:'encryption',name:['Encryption protocol','Протокол шифрования'],icon:'lock',baseData:6*M,baseCR:1200,max:5,description:['20% less DATA decay per level','На 20% меньше потерь DATA за уровень']},
 {id:'radar',name:['Anomaly radar','Радар аномалий'],icon:'globe',baseData:10*M,baseCR:2000,max:5,description:['Unlock events · +1 hour window per level','Открывает ивенты · +1 час окна за уровень']}
 ]};
const check=(x,m)=>{if(!x)throw Error(m);},safe=n=>{check(Number.isSafeInteger(n)&&n>=0,'Invalid resource amount');return n;};
function ensure(s,t){if(!s.nodeHub){s.nodeHub={version:1,settings:copy(config),modules:{battery:0,antenna:0,encryption:0,radar:0},expeditions:{},archive:[],resources:{anomalies:0,governance:0,keys:0},claimedMicro:0,lostMicro:0,event:null,eventDay:-1,serial:0};}for(const n of s.nodeHub.settings.tiers){s.nodes[n.id]??=0;if(!s.settings.nodes.some(x=>x.id===n.id))s.settings.nodes.push({...n,sprite:3});}return s.nodeHub;}
const cfg=s=>s.nodeHub.settings;
function assigned(s,id){return Object.values(s.nodeHub.expeditions).reduce((n,e)=>n+e.devices.filter(d=>d.id===id).reduce((a,d)=>a+d.count,0),0);}
function available(s,id){return Math.max(0,(s.nodes[id]||0)-assigned(s,id));}
function unlocked(s,n){return (s.nodes[n.id]||0)>0||!n.requires||(s.nodes[n.requires[0]]||0)>=n.requires[1];}
function idleHash(s){ensure(s);const raw=s.settings.nodes.reduce((n,x)=>n+x.hash*available(s,x.id),0);return Math.floor(raw*(100+10*s.nodeHub.modules.antenna)/100);}
function fleetHash(s){ensure(s);return Math.floor(s.settings.nodes.reduce((n,x)=>n+x.hash*(s.nodes[x.id]||0),0)*(100+10*s.nodeHub.modules.antenna)/100);}
function status(e,t){return t<e.arrivesAt?'travel':t<e.activeAt?'deploying':e.devices.every(d=>d.broken)?'broken':'active';}
function metrics(s,e,t){const c=cfg(s),g=c.galaxies.find(g=>g.id===e.galaxy),swarm=e.devices.some(d=>d.id==='swarm'&&!d.broken);let rate=0n,cap=0n;
 for(const d of e.devices){if(d.broken)continue;const n=c.tiers.find(n=>n.id===d.id);let r=BigInt(n.hash)*BigInt(s.settings.microPerHashHour)*BigInt(d.count)*BigInt(g.bps)/10000n;
 r=r*BigInt(100+10*s.nodeHub.modules.antenna)/100n;
 if(g.hazard&&n.tier<4)r=r/4n;
 if(swarm&&n.tier<=3)r=r*BigInt(10000+c.swarmBps)/10000n;
 cap+=r*BigInt(n.bufferHours+2*s.nodeHub.modules.battery);rate+=r;
 }
 if(t<e.overclockUntil)rate*=2n;
 if(t<e.eventUntil)rate*=BigInt(c.eventMultiplier);
 return {rate:safe(Number(rate)),capacity:safe(Number(cap)),swarm};}
function createEvent(s,t){const h=s.nodeHub,day=Math.floor(t/D);if(h.modules.radar&&h.eventDay!==day){h.radarEpoch??=t;const starts=day*D+(h.radarEpoch%D),galaxy=cfg(s).galaxies[day%2];h.eventDay=day;h.event={id:'meteor-'+day,galaxy:galaxy.id,startsAt:starts,endsAt:starts+cfg(s).eventMs*h.modules.radar,extended:false,used:false};}}
function roll(seed,hour){let x=(seed^Math.imul(hour,0x9e3779b1))>>>0;x=Math.imul(x^(x>>>16),0x85ebca6b);x=Math.imul(x^(x>>>13),0xc2b2ae35);return ((x^(x>>>16))>>>0)%4===0;}
function settle(s,t){const h=ensure(s,t),c=cfg(s);createEvent(s,t);
 for(const e of Object.values(h.expeditions)){
  if(t<e.activeAt){e.lastAt=t;continue;}
  let from=Math.max(e.lastAt,e.activeAt);
  // Fixed boundary integration: opening the screen does not alter income or loss.
  while(from<t||(e.nextLossAt&&e.nextLossAt<=from)){const m=metrics(s,e,from),lossRate=Math.max(0,c.lossBps*(5-h.modules.encryption)/5);
   if(e.nextLossAt&&e.nextLossAt<=from){const loss=Number(BigInt(e.micro)*BigInt(lossRate)/10000n);e.micro-=loss;e.lostMicro+=loss;h.lostMicro+=loss;e.nextLossAt+=H;}
   let end=Math.min(t,...[e.overclockUntil,e.eventUntil,e.nextLossAt].filter(x=>x>from));
   if(m.rate&&e.micro<m.capacity&&!e.nextLossAt){const until=Number((BigInt(m.capacity-e.micro)*BigInt(H)-BigInt(e.remainder)+BigInt(m.rate)-1n)/BigInt(m.rate));end=Math.min(end,from+Math.max(1,until));}
   const total=BigInt(m.rate)*BigInt(end-from)+BigInt(e.remainder),gain=Number(total/BigInt(H));
   e.micro=Math.min(m.capacity,safe(e.micro+gain));e.remainder=e.micro===m.capacity?0:Number(total%BigInt(H));
   if(m.capacity&&e.micro===m.capacity&&!e.nextLossAt)e.nextLossAt=end+c.lossGraceMs;
   from=end;
  }
  for(const d of e.devices){d.resourceAt??=e.activeAt;d.resourceHours??=0;const hours=Math.max(0,Math.floor((t-d.resourceAt)/H)),previous=d.resourceHours;if(hours>previous&&!d.broken){const tier=c.tiers.find(n=>n.id===d.id).tier;if(tier>=3){let finds=0;for(let hour=previous+1;hour<=hours;hour++)if(roll(e.seed,hour))finds++;e.anomalies+=finds*d.count*(tier>=5?2:1)*(c.galaxies.find(g=>g.id===e.galaxy).hazard?2:1);}if(tier===6){e.governance+=(hours-previous)*d.count;e.keys+=(Math.floor(hours/24)-Math.floor(previous/24))*d.count;}}d.resourceHours=hours;}
  e.lastAt=t;
 }
}
function cost(s,m){const level=s.nodeHub.modules[m.id];return {data:m.baseData*2**level,cr:m.baseCR*2**level,anomalies:level>=2?(level-1)*2:0};}
function record(s,type,t,id,extra={}){s.ledger.unshift({id:'node-'+id,type,at:t,source:id,cr:0,gems:0,data:0,...extra});}
function claim(s,e,t,id){const h=s.nodeHub,amount=e.micro;safe(s.mine.micro+amount);s.mine.micro+=amount;h.claimedMicro+=amount;for(const k of ['anomalies','governance','keys']){h.resources[k]=safe(h.resources[k]+e[k]);}record(s,'expedition_claim',t,id,{data:amount,anomalies:e.anomalies,governance:e.governance,keys:e.keys});e.micro=0;e.remainder=0;e.nextLossAt=0;e.anomalies=0;e.governance=0;e.keys=0;return {collected:amount};}
function getExp(s,id){const e=s.nodeHub.expeditions[id];check(e,'Expedition unavailable / Экспедиция недоступна');return e;}
function adCheck(s,p,t){const c=cfg(s),e=p.galaxy?getExp(s,p.galaxy):null;
 switch(p.purpose){case'overclock':check(e&&status(e,t)==='active'&&t>=e.overclockUntil,'Overclock unavailable / Буст недоступен');break;
 case'repair':check(e&&e.devices.some(d=>d.broken),'No damaged devices / Нет сломанных устройств');break;
 case'loot':check(e&&e.anomalies>0,'No Anomaly discovery / Нет находки аномалий');break;
 case'save':check(e&&e.nextLossAt&&e.micro>0&&s.nodeHub.modules.encryption<5,'No DATA at risk / DATA не под угрозой');break;
 case'extend':check(s.nodeHub.event&&!s.nodeHub.event.extended&&t>=s.nodeHub.event.startsAt&&t<s.nodeHub.event.endsAt,'Event unavailable / Ивент недоступен');break;
 case'travel':check(e&&t<e.arrivesAt&&!e.travelReduced,'Carrier already accelerated / Перелёт уже ускорен');break;
 case'deploy':check(e&&t>=e.arrivesAt&&t<e.activeAt,'Deployment unavailable / Развёртывание недоступно');break;
 default:throw Error('Unknown expedition ad');}
 return {purpose:p.purpose,galaxy:e?.galaxy||null,expeditionId:e?.id||null,eventId:p.purpose==='extend'?s.nodeHub.event.id:null};}
function adReward(s,p,t,id){const h=s.nodeHub,e=p.galaxy?getExp(s,p.galaxy):null;check(!e||e.id===p.expeditionId,'Expedition has changed / Экспедиция изменилась');switch(p.purpose){
 case'overclock':e.overclockUntil=t+cfg(s).overclockMs;break;
 case'repair':e.devices.forEach(d=>{if(d.broken){d.broken=false;d.resourceAt=t;d.resourceHours=0;}});break;
 case'loot':{const amount=e.anomalies*2;h.resources.anomalies=safe(h.resources.anomalies+amount);e.anomalies=0;record(s,'anomaly_reward',t,id,{anomalies:amount});return;}
 case'save':e.nextLossAt=t+D;break;
 case'extend':check(h.event?.id===p.eventId,'Event has changed / Ивент изменился');h.event.endsAt=Math.max(t,h.event.endsAt)+cfg(s).eventExtensionMs;h.event.extended=true;break;
 case'travel':{const remaining=Math.max(0,e.arrivesAt-t),saved=Math.floor(remaining/2);e.arrivesAt-=saved;e.activeAt-=saved;e.travelReduced=true;break;}
 case'deploy':e.activeAt=Math.min(e.activeAt,t);e.lastAt=t;break;}
 record(s,'expedition_ad_'+p.purpose,t,id);
}
function apply(s,a,p,t,id,add){const h=s.nodeHub,c=cfg(s);let out={};
 if(a==='nodeBuy'){const n=c.tiers.find(x=>x.id===p.id);check(n&&unlocked(s,n),'Tier is locked / Тир заблокирован');add(s,'node_purchase',-n.price,0,0,t,id);s.nodes[n.id]++;s.stats.purchases++;s.user.xp+=75;s.dailyActions.node=true;}
 else if(a==='nodeDeploy'){const g=c.galaxies.find(x=>x.id===p.galaxy),n=c.tiers.find(x=>x.id===p.id),count=p.count??1;check(g&&n&&Number.isInteger(count)&&count>0,'Choose a galaxy and device / Выберите галактику и устройство');check(!g.hazard||s.nodes.orbital>0,'Requires Tier 4 / Требуется Tier 4');check(available(s,n.id)>=count,'Device already deployed / Устройство уже развёрнуто');let e=h.expeditions[g.id];check(!e||status(e,t)==='active'||status(e,t)==='broken','Carrier is in transit / Дождитесь развёртывания');check((e?e.devices.reduce((a,d)=>a+d.count,0):0)+count<=g.slots,'No free slots / Нет свободных слотов');
  if(!e){e=h.expeditions[g.id]={id:'exp-'+(++h.serial)+'-'+t,galaxy:g.id,devices:[],startedAt:t,arrivesAt:t+c.travelMs,activeAt:t+c.travelMs+c.deployMs,lastAt:t,micro:0,remainder:0,nextLossAt:0,lostMicro:0,overclockUntil:0,eventUntil:0,anomalies:0,governance:0,keys:0,resourceHours:0,seed:(typeof crypto!=='undefined'&&crypto.getRandomValues?crypto.getRandomValues(new Uint32Array(1))[0]:Math.floor(Math.random()*4294967296))};}
  e.devices.push({id:n.id,count,resourceAt:Math.max(e.activeAt,t),resourceHours:0,broken:g.lowTier==='break'&&n.tier<4});
  const event=h.event;if(event&&!event.used&&event.galaxy===g.id&&t>=event.startsAt&&t<event.endsAt&&n.tier>=3){e.eventUntil=Math.max(e.activeAt,t)+H;event.used=true;}
  record(s,'expedition_deploy',t,id);out={expedition:e.id};
 }
 else if(a==='nodeCollect'){const e=getExp(s,p.galaxy);check(e.micro>0||e.anomalies||e.governance||e.keys,'Nothing to collect / Пока нечего собирать');out=claim(s,e,t,id);}
 else if(a==='nodeRecall'){const e=getExp(s,p.galaxy);check(!e.devices.some(d=>d.broken),'Repair damaged devices first / Сначала отремонтируйте устройства');out=claim(s,e,t,id);h.archive.push({...e,endedAt:t});delete h.expeditions[p.galaxy];}
 else if(a==='nodeUpgrade'){const m=c.modules.find(x=>x.id===p.id);check(m&&h.modules[m.id]<m.max,'Maximum module level / Максимальный уровень модуля');const price=cost(s,m);check(['data','cr'].includes(p.currency),'Choose DATA or CR');check(h.resources.anomalies>=price.anomalies,'Not enough Anomalies / Недостаточно аномалий');add(s,'module_upgrade',p.currency==='cr'?-price.cr:0,0,p.currency==='data'?-price.data:0,t,id);h.resources.anomalies-=price.anomalies;s.ledger[0].anomalies=-price.anomalies;h.modules[m.id]++;createEvent(s,t);}
 else if(a==='nodeRelic'){check(h.resources.keys>0,'No relic keys / Нет ключей реликвий');h.resources.keys--;h.resources.anomalies+=10;h.resources.governance++;record(s,'relic_reward',t,id,{keys:-1,anomalies:10,governance:1});}
 else return null;
 return out;}
const api={config,ensure,settle,apply,available,unlocked,idleHash,fleetHash,metrics,status,cost,adCheck,adReward};root.NodeSystem=api;if(typeof module==='object')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
