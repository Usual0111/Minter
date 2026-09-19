(function(root){
 'use strict';
 const defaults={durationMs:4*60*60*1000,rewardCents:20};
 function ensure(s,config=defaults){s.farm??={sessions:[],nextNumber:1};s.settings.farm??={...config};return s;}
 function validate(c){if(!Number.isSafeInteger(c.durationMs)||c.durationMs<=0||!Number.isSafeInteger(c.rewardCents)||c.rewardCents<=0||!Number.isSafeInteger(c.rewardCents*100))throw new Error('Invalid Farm duration or reward.');return c;}
 function current(s){return s.farm.sessions.find(x=>x.claimedAt===null)||null;}
 function progress(session,now){
  const elapsed=Math.min(session.durationMs,Math.max(0,Math.floor(now)-session.startedAt));
  const accruedUnits=Number(BigInt(session.rewardCents)*100n*BigInt(elapsed)/BigInt(session.durationMs));
  return {elapsed,ratio:elapsed/session.durationMs,accruedUnits,remainingMs:Math.max(0,session.endsAt-Math.floor(now)),ready:elapsed===session.durationMs};
 }
 function view(s,now){
  ensure(s);const session=current(s),claimed=s.farm.sessions.filter(x=>x.claimedAt!==null);
  return {status:session?(now>=session.endsAt?'ready':'farming'):'idle',session,progress:session?progress(session,now):null,config:{...s.settings.farm},nextNumber:s.farm.nextNumber,stats:{completedSessions:claimed.length,totalClaimedCents:claimed.reduce((n,x)=>n+x.rewardCents,0)},lastClaimed:claimed.at(-1)||null};
 }
 function start(s,id,now){
  ensure(s);const existing=current(s);if(existing)return {session:existing,alreadyActive:true};
  const c=validate(s.settings.farm);if(!Number.isSafeInteger(now+c.durationMs))throw new Error('Invalid Farm end time.');
  const session={id,userId:s.user.id,number:s.farm.nextNumber++,startedAt:now,endsAt:now+c.durationMs,durationMs:c.durationMs,rewardCents:c.rewardCents,claimedAt:null,ledgerId:null};s.farm.sessions.push(session);return {session};
 }
 const api={defaults,ensure,validate,current,progress,view,start};root.FarmEngine=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
