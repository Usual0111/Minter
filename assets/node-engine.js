(function(root){
 'use strict';
 const H=3600000,D=24*H,clone=x=>JSON.parse(JSON.stringify(x)),day=t=>Math.floor(t/D),assert=(v,m)=>{if(!v)throw Error(m);};
 const defaults={baseMicroPerHour:1500000,bufferHours:4,demandBps:11000,maxResourceLevel:5,dailyAdLimit:10,restoreCostCents:1000};
 const resources={bandwidth:{name:'Bandwidth',step:800,costs:[400,800,1500,3000]},storage:{name:'Storage',step:600,costs:[1200,2500,5000,10000]},cpu:{name:'CPU',step:1000,costs:[2000,4000,8000,16000]},gpu:{name:'GPU',step:1000,costs:[6000,12000,24000,48000,96000]}};
 function config(s){return {...defaults,...s.settings.node};}
 function clock(s,now){return now+(s.node?.demoOffset||0);}
 function hash(str){let h=0;for(const c of String(str))h=(h*31+c.charCodeAt(0))>>>0;return h;}
 function ensure(s,now){
  if(s.node)return s.node;
  const adCount=s.ledger.filter(x=>x.type==='ad'&&day(x.at)===day(now)).length,taskCount=s.ledger.filter(x=>x.type==='task'&&day(x.at)===day(now)).length;
  s.node={version:1,id:'NX-'+String(10000+hash(s.user.id)%90000),region:'EU-Cluster-7',createdAt:now,lastAt:now-3*H,bufferMicro:0,remainder:0,levels:{bandwidth:3,storage:2,cpu:1,gpu:0},uptimeBps:9420,streak:5,lastPingDay:day(now),boostUntil:0,expandedUntil:0,certifiedUntil:taskCount>=3?now+D:0,day:day(now),adsToday:adCount,tasksToday:taskCount,usage:{total:0,traffic:0,buffer:0,restore:0,instant:0,double:0,overload:0},lastTrafficAt:0,lastInstantAt:0,friends:[{id:'demo-1',name:'Jamie Lee'},{id:'demo-2',name:'Taylor Reed'},{id:'demo-3',name:'Jordan Park'},{id:'demo-4',name:'Casey Kim'}],adSessions:{},receipts:{},harvests:0,totalClaimedCents:0,overloadBonus:false,eventUsed:[],forcedEventUntil:0,demoOffset:0};
  // Historical Farm balances/operations remain untouched; Node is a separate demo economy.
  return s.node;
 }
 function level(n){return 1+Object.values(n.levels).reduce((sum,v)=>sum+Math.max(0,v-1),0);}
 function uptime(n,t){return day(t)>n.lastPingDay+1?6000:Math.min(10000,n.uptimeBps+(day(t)===n.day?Math.floor(n.adsToday/5)*100:0));}
 function streak(n,t){return day(t)>n.lastPingDay+1?0:n.streak;}
 function cluster(n){return n.friends.length>=10?2500:n.friends.length>=4?1500:0;}
 function rate(s,n,t,boost=true){const c=config(s);let value=BigInt(c.baseMicroPerHour),resource=10000;for(const [key,r]of Object.entries(resources))resource+=n.levels[key]*r.step;for(const factor of [resource,c.demandBps,10000+cluster(n),uptime(n,t),streak(n,t)>=7&&uptime(n,t)>=9000?15000:10000,n.certifiedUntil>t?11000:10000,boost&&n.boostUntil>t?20000:10000])value=value*BigInt(factor)/10000n;return Number(value);}
 function capacity(s,n,t){return rate(s,n,t,false)*(n.expandedUntil>t?8:config(s).bufferHours);}
 function settle(s,realNow){realNow=Math.floor(realNow);const n=ensure(s,realNow),now=Math.max(n.lastAt,clock(s,realNow));
  const points=[n.lastAt,now,n.boostUntil,n.expandedUntil,n.certifiedUntil,(n.lastPingDay+2)*D,(n.day+1)*D].filter(t=>t>=n.lastAt&&t<=now).sort((a,b)=>a-b);
  for(let i=1;i<points.length;i++){const start=points[i-1],end=points[i];if(end<=start)continue;const amount=BigInt(rate(s,n,start))*BigInt(end-start)+BigInt(n.remainder),earned=Number(amount/BigInt(H)),cap=capacity(s,n,start);const room=Math.max(0,cap-n.bufferMicro);n.bufferMicro+=Math.min(room,earned);n.remainder=earned>=room?0:Number(amount%BigInt(H));}
  n.lastAt=now;
  if(day(now)>n.lastPingDay+1){n.uptimeBps=6000;n.streak=0;}
  if(n.day!==day(now)){n.day=day(now);n.adsToday=0;n.tasksToday=0;n.usage={total:0,traffic:0,buffer:0,restore:0,instant:0,double:0,overload:0};}
  return now;
 }
 function event(s,type,realNow){if(!s.node)return;const now=settle(s,realNow),n=s.node;if(type==='ad')n.adsToday++;if(type==='task'){n.tasksToday++;if(n.tasksToday===3)n.certifiedUntil=now+D;}}
 function ping(n,now){const healthy=uptime(n,now)>=9000;if(n.lastPingDay<day(now)){n.streak=healthy?(n.lastPingDay===day(now)-1?n.streak+1:1):0;n.lastPingDay=day(now);}n.uptimeBps=Math.min(10000,n.uptimeBps+20);}
 function overload(n,now){if(n.forcedEventUntil>now)return {id:'demo-'+n.forcedEventUntil,until:n.forcedEventUntil};const offset=hash(n.id)%60*60000;for(const hour of [8,19]){const start=day(now)*D+hour*H+offset;if(now>=start&&now<start+600000)return {id:day(now)+'-'+hour,until:start+600000};}return null;}
 function remaining(s,now){const copy=clone(s),n=copy.node,points=[now,n.boostUntil,n.expandedUntil,n.certifiedUntil,(n.day+1)*D,(n.lastPingDay+2)*D,now+3*D].filter(t=>t>=now).sort((a,b)=>a-b);let at=now;for(const end of points){if(end<=at)continue;const room=Math.max(0,capacity(copy,n,at)-n.bufferMicro),r=rate(copy,n,at),ms=Math.ceil(room*H/r);if(ms<=end-at)return at-now+ms;settle(copy,end-n.demoOffset);at=end;}return 0;}
 function eligible(s,n,kind,now){const u=n.usage,ev=overload(n,now);if(u.total>=config(s).dailyAdLimit)return 'Daily Farm ad limit reached';
  if(kind==='traffic')return u.traffic>=4?'Four packages used today':n.boostUntil>now?'Traffic boost is active':n.lastTrafficAt&&now<n.lastTrafficAt+3*H?'Available every 3 hours':null;
  if(kind==='buffer')return u.buffer?'Already expanded today':null;
  if(kind==='restore')return uptime(n,now)>=9000?'Uptime is already at least 90%':null;
  if(kind==='instant')return n.bufferMicro<10000?'Accumulate at least 0.01 CR':n.bufferMicro>=capacity(s,n,now)/2?'Instant harvest requires a buffer below 50%':n.lastInstantAt&&now<n.lastInstantAt+H?'Available once per hour':null;
  if(kind==='double')return u.double>=2?'Two double collections used today':n.bufferMicro<10000?'Accumulate at least 0.01 CR':null;
  if(kind==='overload')return !ev?'No network overload event':n.overloadBonus?'Next-collection bonus already active':u.overload>=2||n.eventUsed.includes(ev.id)?'Event already activated':null;
  return 'Unknown reward';
 }
 function harvest(s,n,now,factor=10000){const base=Math.floor(n.bufferMicro/10000);assert(base>0,'Accumulate at least 0.01 CR before collecting.');const bonus=n.overloadBonus?15000:10000;const cents=Number(BigInt(base)*BigInt(factor)*BigInt(bonus)/100000000n);n.bufferMicro-=base*10000;n.overloadBonus=false;n.harvests++;n.totalClaimedCents+=cents;ping(n,now);return {creditCents:cents,title:'Node income collected',reference:'node-'+s.user.id+'-'+n.harvests,detail:'Buffer '+(base/100).toFixed(2)+' CR · multiplier '+(factor*bonus/100000000).toFixed(2)};}
 function act(s,action,p={},realNow){const now=settle(s,realNow),n=s.node,c=config(s);let out={};
  if(action==='nodeRefresh')return out;
  if(action==='nodeCollect'){assert(typeof p.requestId==='string'&&p.requestId.length>=8,'Missing collection ID.');if(n.receipts[p.requestId])return {alreadyApplied:true};out=harvest(s,n,now);n.receipts[p.requestId]=out.reference;}
  else if(action==='nodeUpgrade'){const r=resources[p.resource];assert(r,'Unknown resource.');const l=n.levels[p.resource];assert(l<c.maxResourceLevel,'This resource is fully upgraded.');assert(p.resource!=='gpu'||level(n)>=10||n.friends.length>=5,'GPU unlocks at Node level 10 or with 5 active friends.');const cost=r.costs[p.resource==='gpu'?l:l-1];assert(s.balance.cr>=cost,'Not enough CR for this upgrade.');n.levels[p.resource]++;out={debitCents:cost,title:r.name+' upgraded',reference:'node-upgrade-'+p.resource+'-'+n.levels[p.resource]};}
  else if(action==='nodeRestore'){assert(uptime(n,now)<9000,'Uptime is already at least 90%.');assert(s.balance.cr>=c.restoreCostCents,'Not enough CR to restore uptime.');n.uptimeBps=9000;n.lastPingDay=day(now);n.streak=Math.max(1,n.streak);out={debitCents:c.restoreCostCents,title:'Node uptime restored',reference:'node-restore-'+now};}
  else if(action==='nodeAdStart'){assert(!eligible(s,n,p.kind,now),eligible(s,n,p.kind,now));assert(!Object.values(n.adSessions).some(a=>a.status==='started'&&a.expiresAt>now),'A rewarded preview is already open.');assert(typeof p.requestId==='string'&&p.requestId.length>=8,'Missing ad ID.');if(n.adSessions[p.requestId])return {session:n.adSessions[p.requestId]};const a={id:p.requestId,kind:p.kind,status:'started',readyAt:now+3000,expiresAt:now+120000};n.adSessions[a.id]=a;out={session:clone(a)};}
  else if(action==='nodeAdCancel'){const a=n.adSessions[p.id];if(a?.status==='started')a.status='cancelled';}
  else if(action==='nodeAdConfirm'){const a=n.adSessions[p.id];assert(a,'Ad preview not found.');if(a.status==='rewarded')return {alreadyApplied:true};assert(a.status==='started'&&now>=a.readyAt&&now<a.expiresAt,'Complete the rewarded preview first.');assert(!eligible(s,n,a.kind,now),eligible(s,n,a.kind,now));
   if(a.kind==='traffic'){n.boostUntil=now+H/2;n.lastTrafficAt=now;}
   if(a.kind==='buffer')n.expandedUntil=now+D;
   if(a.kind==='restore'){n.uptimeBps=9000;n.lastPingDay=day(now);n.streak=Math.max(1,n.streak);}
   if(a.kind==='instant'){out=harvest(s,n,now,11000);n.lastInstantAt=now;}
   if(a.kind==='double')out=harvest(s,n,now,20000);
   if(a.kind==='overload'){n.overloadBonus=true;n.eventUsed.push(overload(n,now).id);}
   n.usage.total++;n.usage[a.kind]++;a.status='rewarded';a.confirmedAt=now;out.effect=a.kind;
  }
  else if(action==='nodeDemo'){assert(s.settings.mode!=='production','Demo controls are unavailable in production.');
   if(p.kind==='advance'){assert([H,4*H,D,2*D].includes(p.ms),'Invalid test interval.');n.demoOffset+=p.ms;settle(s,realNow);}
   else if(p.kind==='friend'){assert(n.friends.length<50,'Demo cluster is full.');n.friends.push({id:'demo-'+(n.friends.length+1),name:'Demo friend '+(n.friends.length+1)});}
   else if(p.kind==='event')n.forcedEventUntil=now+600000;
   else if(p.kind==='demand'){assert([7000,10000,11000,13000].includes(p.bps),'Invalid network demand.');s.settings.node={...c,demandBps:p.bps};}
   else throw Error('Unknown demo control.');
  }else throw Error('Unknown Node action.');
  assert(Number.isSafeInteger(n.bufferMicro)&&n.bufferMicro>=0,'Invalid buffer.');return out;
 }
 function view(source,realNow){const s=clone(source),now=settle(s,realNow),n=s.node,cap=Math.max(n.bufferMicro,capacity(s,n,now)),r=rate(s,n,now);const ev=overload(n,now);return {now,node:n,rateMicro:r,capacityMicro:cap,ratio:cap?n.bufferMicro/cap:0,remainingMs:remaining(s,now),uptimeBps:uptime(n,now),streak:streak(n,now),multiplier:streak(n,now)>=7&&uptime(n,now)>=9000?1.5:1,nodeLevel:level(n),tier:1+Math.floor(level(n)/5),clusterBonus:cluster(n)/100,demand:config(s).demandBps/100,overload:ev,ads:Object.fromEntries(['traffic','buffer','restore','instant','double','overload'].map(k=>[k,eligible(s,n,k,now)])),resources:Object.fromEntries(Object.entries(resources).map(([k,r])=>[k,{...r,level:n.levels[k],costCents:r.costs[k==='gpu'?n.levels[k]:n.levels[k]-1],locked:k==='gpu'&&level(n)<10&&n.friends.length<5,maxed:n.levels[k]>=config(s).maxResourceLevel}]))};}
 const api={ensure,settle,event,act,view,defaults,resources,clock};root.NodeEngine=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
