(function(root){
 'use strict';
 const F=root.FarmEngine,$=id=>document.getElementById(id),cr=n=>(n/100).toFixed(2);
 const duration=ms=>ms%3600000===0?(ms/3600000)+' '+(ms===3600000?'hour':'hours'):ms%60000===0?(ms/60000)+' '+(ms===60000?'minute':'minutes'):ms<60000?(ms/1000)+' '+(ms===1000?'second':'seconds'):countdown(ms);
 const countdown=ms=>{let seconds=Math.ceil(ms/1000);const hours=Math.floor(seconds/3600);seconds%=3600;return [hours,Math.floor(seconds/60),seconds%60].map(x=>String(x).padStart(2,'0')).join(':');};
 root.createFarmScreen=function({client,onState}){
  let active=false,data=null,account=null,anchor=0,anchorMono=0,busy='',error='',offline=false,loading=true,request=null,frame=null,poll=null,endChecked=null,lastPaint=0,displayBalance=null,balanceTween=null,hold=null,claimNotice='';
  const media=matchMedia('(prefers-reduced-motion: reduce)'),mono=()=>performance.now();
  function html(){return `<section class="farm-card" id="farm-card" aria-labelledby="farm-title" aria-busy="true">
   <div class="farm-head"><h1 id="farm-title">Your farm</h1><span class="farm-status" id="farm-status"><i></i><span id="farm-status-text">Loading…</span></span></div>
   <div class="farm-amount"><strong><span id="farm-accrued">—</span> CR</strong><p>Accumulated this session</p><span id="farm-max">of — CR</span></div>
   <div class="farm-progress-label"><span>Session progress</span><strong id="farm-percent">—</strong></div>
   <div class="farm-progress" id="farm-progress" role="progressbar" aria-label="Farming progress" aria-valuemin="0" aria-valuemax="100"><div id="farm-fill"></div></div>
   <div class="farm-times"><div><span>Time remaining</span><strong id="farm-time">—</strong></div><div><span>Session duration</span><strong id="farm-duration">—</strong></div></div>
   <button class="farm-button" id="farm-button" data-action="farm-main" disabled><svg id="farm-button-clock" viewBox="0 0 24 24" aria-hidden="true" hidden><use href="#clock"/></svg><span id="farm-button-text">Loading…</span></button>
   <p class="farm-hint" id="farm-hint" role="status">Loading your farming session…</p>
   <p class="farm-session"><span id="farm-session">Session —</span><span id="farm-mode"></span></p>
   <div class="farm-error" id="farm-error-box" hidden><p id="farm-error" role="alert"></p><button data-action="farm-retry">Try again</button></div>
  </section>
  <div class="farm-away"><div class="farm-icon"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M17 22H9a7 7 0 0 1-1-14 8 8 0 0 1 15-1"/><circle cx="23" cy="21" r="7"/><path d="M23 17v4l3 2"/></svg></div><div><h2>Keeps farming while you’re away</h2><p>Your session continues when you close the app.</p></div></div>
  <div class="farm-notify"><div class="farm-icon"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 23h18l-3-5v-5a6 6 0 0 0-12 0v5Zm6 4h6M16 4v3"/></svg></div><div><span id="farm-notify-label">Notify me when ready</span><small id="farm-notify-reason">Notifications are not connected yet.</small></div><button class="farm-switch" role="switch" aria-checked="false" aria-labelledby="farm-notify-label" aria-describedby="farm-notify-reason" disabled><span></span></button></div>
  <h2 class="farm-activity-title">Farm activity</h2><div class="farm-activity"><div class="farm-stats"><div><span>Completed sessions</span><strong id="farm-completed">—</strong></div><div><span>Total claimed</span><strong id="farm-total">— CR</strong></div></div><p id="farm-footnote">Claim your reward to start a new session.</p></div>`;}
  const serverNow=()=>anchor+Math.max(0,mono()-anchorMono);
  function setBalance(cents){if(!$('balance-number'))return;displayBalance=cents;$('balance-number').textContent=(Math.round(cents)/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});const length=cr(account?.balance.cr??cents).length;$('balance-number').style.transform=length>6?'scaleX('+6/length+')':'none';$('balance').setAttribute('aria-label',cr(account?.balance.cr??cents)+' CR');}
  function accept(out,{claim=false}={}){data=out.farm;account=out.state;anchor=out.serverTime;anchorMono=mono();loading=false;offline=false;onState(out.state);
   if(claim&&!media.matches&&!document.hidden&&active&&displayBalance!==null)balanceTween={from:displayBalance,to:account.balance.cr,at:mono()};else{balanceTween=null;if(active)setBalance(account.balance.cr);}
  }
  function paint(){
   if(!active||!$('farm-card'))return;
   const s=data?.session,c=s||data?.config,p=s?F.progress(s,serverNow()):null;
   const checking=!!s&&p.ready&&data.status!=='ready';
   let status=loading?'Loading…':offline?'Server required':!data?'Unable to load':data.status==='idle'?'Ready to start':data.status==='ready'?'Ready to claim':'Farming';
   $('farm-status-text').textContent=status;$('farm-status').dataset.state=data?.status||'loading';$('farm-card').setAttribute('aria-busy',String(loading||!!busy));
   $('farm-accrued').textContent=data?(p?(p.accruedUnits/10000).toFixed(4):'0.0000'):'—';
   $('farm-max').textContent='of '+(c?cr(c.rewardCents):'—')+' CR';$('farm-duration').textContent=c?duration(c.durationMs):'—';
   const percentage=p?Math.min(100,p.ratio*100):0;$('farm-fill').style.width=percentage+'%';$('farm-percent').textContent=data?Math.min(p?.ready?100:99,Math.round(percentage))+'%':'—';$('farm-progress').setAttribute('aria-valuenow',percentage.toFixed(3));
   $('farm-time').textContent=data?countdown(p?.remainingMs||0):'—';
   const button=$('farm-button');button.disabled=loading||!!busy||!!request||!data||checking||data.status==='farming';
   $('farm-button-text').textContent=busy==='claim'?'Claiming…':busy==='start'?'Starting…':loading?'Loading…':offline?'Server required':!data?'Unavailable':checking?'Checking…':data.status==='idle'?'Start farming':data.status==='ready'?'Claim '+cr(s.rewardCents)+' CR':'Farming in progress';
   if(data?.status!=='farming'||busy)$('farm-button-clock').setAttribute('hidden','');else $('farm-button-clock').removeAttribute('hidden');
   $('farm-hint').textContent=claimNotice|| (loading?'Loading your farming session…':offline?'Open the server-hosted app to start farming.':!data?'Your progress will be restored when connection returns.':checking?'Confirming completion with the server…':data.status==='farming'?'Claim becomes available when the session ends':data.status==='ready'?'Your reward is ready. Claim to start a new session.':'Start a free session to accumulate CR.');
   $('farm-session').textContent=data?'Session #'+String(s?.number??data.nextNumber).padStart(3,'0'):'Session —';$('farm-mode').textContent=offline?' · Offline preview':client.isDemo?' · Demo mode':'';
   $('farm-completed').textContent=data?data.stats.completedSessions:'—';$('farm-total').textContent=data?cr(data.stats.totalClaimedCents)+' CR':'— CR';$('farm-footnote').textContent=c?'Accumulation stops at '+cr(c.rewardCents)+' CR. Claim to start a new session.':'Claim your reward to start a new session.';
   $('farm-error-box').hidden=!error;$('farm-error').textContent=error;
   if(checking&&!request&&endChecked!==s.id){endChecked=s.id;refresh();}
  }
  function loop(time){frame=null;if(!active||document.hidden)return;
   if(balanceTween){const t=Math.min(1,(time-balanceTween.at)/600);setBalance(balanceTween.from+(balanceTween.to-balanceTween.from)*(1-(1-t)**3));if(t===1)balanceTween=null;}
   if(time-lastPaint>=(media.matches?1000:100)){lastPaint=time;paint();}
   if(balanceTween||data?.status==='farming')frame=requestAnimationFrame(loop);
  }
  function wake(){if(active&&!document.hidden&&frame===null&&(balanceTween||data?.status==='farming'))frame=requestAnimationFrame(loop);}
  function schedule(){clearTimeout(poll);if(active&&!document.hidden&&!offline)poll=setTimeout(()=>refresh(),60000);}
  async function refresh(){
   if(request)return request;if(busy)return;if(!client.ready){loading=!error;paint();return;}
   if(client.mode==='local-demo'){offline=true;loading=false;error='Farm needs a server connection. Offline previews do not accumulate or award CR.';paint();return;}
   request=(async()=>{try{const out=await client.farmState();error='';accept(out);endChecked=out.farm.status==='farming'&&out.farm.session.endsAt>out.serverTime?null:endChecked;}catch(e){loading=false;error='Connection unavailable. Your last known session is kept. Try again.';}finally{request=null;paint();wake();schedule();}})();paint();return request;
  }
  function confirmedClaim(out,id){const session=out.state.farm.sessions.find(s=>s.id===id&&s.claimedAt!==null);if(!session)return false;error='';accept(out,{claim:true});claimNotice='+'+cr(session.rewardCents)+' CR credited';paint();wake();clearTimeout(hold);hold=setTimeout(()=>{busy='';paint();hold=setTimeout(()=>{claimNotice='';paint();},1800);},media.matches?0:650);return true;}
  async function action(){
   if(busy||loading||request||!data)return;
   const claiming=data.status==='ready',id=data.session?.id;if(!claiming&&data.status!=='idle')return;
   busy=claiming?'claim':'start';claimNotice='';error='';paint();
   try{const out=await client.farmAction(claiming?'farmClaim':'farmStart',claiming?{id}:{});if(claiming&&confirmedClaim(out,id))return;accept(out);busy='';endChecked=null;}
   catch(e){
    error='Could not confirm the request. Checking your saved session…';paint();
    try{const out=await client.farmState();if(claiming&&confirmedClaim(out,id))return;accept(out);error=(!claiming&&out.farm.session)?'':e.message||'The request was not completed. Try again.';}
    catch{error='Connection unavailable. The result is unknown; your saved session is kept. Try again before repeating.';}
    busy='';
   }finally{paint();wake();schedule();}
  }
  function enter(){const first=!active;active=true;if(first){if(account)setBalance(account.balance.cr);else{$('balance-number').textContent='—';$('balance').setAttribute('aria-label','Loading balance');}paint();refresh();}else if(client.ready&&loading&&!request)refresh();wake();}
  function leave(){active=false;clearTimeout(poll);if(frame!==null)cancelAnimationFrame(frame);frame=null;balanceTween=null;}
  function visibility(){if(document.hidden){if(frame!==null)cancelAnimationFrame(frame);frame=null;clearTimeout(poll);}else if(active){balanceTween=null;refresh();wake();}}
  document.addEventListener('visibilitychange',visibility);
  function connectionError(message){loading=false;error=message;paint();}
  return {html,enter,leave,refresh,action,connectionError};
 };
})(typeof globalThis!=='undefined'?globalThis:window);
