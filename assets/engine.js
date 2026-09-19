(function(root){
  'use strict';
  const F=typeof module==='object'&&module.exports?require('./farm-engine.js'):root.FarmEngine;
  const N=typeof module==='object'&&module.exports?require('./node-engine.js'):root.NodeEngine;
  const clone = x => JSON.parse(JSON.stringify(x));
  const dayKey = now => new Date(now).toISOString().slice(0,10);
  function weekKey(now){const d=new Date(now);d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return dayKey(d.getTime());}
  const assert=(condition,message)=>{if(!condition)throw new Error(message);};
  const safeInt=(value,min=0)=>Number.isSafeInteger(value)&&value>=min;
  function canClaimDaily(s,now=Date.now()){
    return !s.lastDaily||now>=s.lastDaily+s.settings.dailyBoost.intervalHours*3600000;
  }
  function parseAmount(raw,decimals){
    const value=String(raw).trim();
    if(!new RegExp('^\\d+(?:\\.\\d{1,'+decimals+'})?$').test(value))return null;
    const [whole,fraction='']=value.split('.');
    const units=Number(whole)*10**decimals+Number(fraction.padEnd(decimals,'0'));
    return safeInt(units)?units:null;
  }
  function initial(config,now=Date.now()){
    return {version:3,revision:0,nextId:2,createdAt:now,settings:clone(config),
      user:{id:'1042',name:'Alex Morgan',username:'alexmorgan',language:'English',status:'Active'},
      balance:{cr:12540,asset:1250000,reserved:0},energy:65,cycle:24,lastDaily:0,
      series:{number:24,views:0,claimed:[],levels:clone(config.milestones.levels),length:config.milestones.seriesLength},bonusClaims:[],
      ads:{day:dayKey(now),dailyViews:0,lastRewardAt:0,sessions:{}},
      farm:{sessions:[],nextNumber:1},tasks:{},wallet:null,quotes:{},exchanges:{},withdrawals:[],redeemed:[],
      promos:[{code:'BOUNTERA20',reward:20,maxUses:100,uses:0,expiresAt:now+30*86400000,active:true}],
      ledger:[{id:'tx-000001',type:'opening',title:'Opening demo balance',cr:12540,asset:1250000,reserved:0,status:'completed',at:now,reference:'demo-opening',detail:'Initial preview balances. No real assets.'}],audit:[]};
  }
  function id(s,prefix){return prefix+'-'+String(s.nextId++).padStart(6,'0');}
  function log(s,entry,now){const tx={id:id(s,'tx'),at:now,status:'completed',cr:0,asset:0,reserved:0,...entry};s.ledger.unshift(tx);return tx;}
  function audit(s,action,detail,now){s.audit.unshift({id:id(s,'audit'),actor:'Demo administrator',action,detail,at:now});}
  function migrate(source,config,now=Date.now()){
    if(!source)return initial(config,now);
    if(source.version===3){const saved=clone(source);for(const task of saved.settings.tasks){task.title=task.title.replaceAll('Farm Zone Bot','Bountera');task.description=task.description.replaceAll('Farm Zone Bot','Bountera');}return F.ensure(saved,config.farm);}
    assert(source.version===2,'Unsupported saved state version.');
    const s=clone(source);s.version=3;
    s.legacy={...(s.legacy||{}),energy:s.energy,cycle:s.cycle,ads:clone(s.ads),tasks:clone(s.tasks),settings:clone(s.settings),preservedAt:now};
    s.settings={...s.settings,ads:clone(config.ads),milestones:clone(config.milestones),dailyBoost:clone(config.dailyBoost),testing:{unlimitedDailyBoost:false}};
    s.settings.tasks=s.settings.tasks.map(t=>{const configured=config.tasks.find(x=>x.id===t.id);return {...t,unit:'CR',rewardCents:configured?.rewardCents??parseAmount(t.reward,2)};});
    s.series={number:1,views:0,claimed:[],levels:clone(config.milestones.levels),length:config.milestones.seriesLength};s.bonusClaims=[];
    s.ads={day:dayKey(now),dailyViews:0,lastRewardAt:0,sessions:{}};
    for(const [taskId,attempt] of Object.entries(s.tasks))if(attempt.status!=='claimed'){
      const t=s.settings.tasks.find(x=>x.id===taskId);attempt.unit='CR';attempt.rewardCents=t?.rewardCents;
      if(attempt.status==='confirmed')attempt.status='awaiting_verification';
    }
    return F.ensure(s,config.farm);
  }
  function seriesProgress(s){
    const level=s.series.levels.find(l=>!s.series.claimed.includes(l.views))||s.series.levels.at(-1);
    return {number:s.series.number,views:s.series.views,target:level.views,bonusCents:level.rewardCents,left:Math.max(0,level.views-s.series.views),ratio:Math.min(1,s.series.views/level.views)};
  }
  function adAvailability(s,now=Date.now()){
    const active=Object.values(s.ads.sessions).find(a=>['started','awaiting_confirmation'].includes(a.status)&&a.expiresAt>now);
    if(active)return {status:active.status==='awaiting_confirmation'?'checking':'active',sessionId:active.id};
    const c=s.settings.ads;
    if(c.providerDailyLimit!==null&&s.ads.day===dayKey(now)&&s.ads.dailyViews>=c.providerDailyLimit){const d=new Date(now);d.setUTCHours(24,0,0,0);return {status:'limited',nextAvailableAt:d.getTime()};}
    const next=s.ads.lastRewardAt+c.cooldownSeconds*1000;
    return next>now?{status:'limited',nextAvailableAt:next}:{status:'ready'};
  }
  function periods(s,now){
    if(s.ads.day!==dayKey(now)){s.ads.day=dayKey(now);s.ads.dailyViews=0;}
    for(const session of Object.values(s.ads.sessions))if(['created','started','awaiting_confirmation'].includes(session.status)&&session.expiresAt<=now)session.status='expired';
  }
  function credit(s,cents,type,title,reference,now,extra={}){
    assert(safeInt(cents,1),'Invalid CR reward.');s.balance.cr+=cents;
    return log(s,{type,title,cr:cents,reference,...extra},now);
  }
  function reward(s,amount,unit,type,title,reference,now){assert(unit==='CR','Energy rewards are retired.');return credit(s,parseAmount(amount,2),type,title,reference,now);}
  function quoteFor(s,cr,now){
    const cfg=s.settings.exchange;
    assert(safeInt(cr,1),'Enter a valid CR amount.');assert(cr>=cfg.minCRCents,'The amount is below the exchange minimum.');assert(cr<=s.balance.cr,'Not enough CR available.');
    const gross=Number(BigInt(cr)*BigInt(cfg.assetMicrosPerCR)/100n),fee=Number(BigInt(gross)*BigInt(cfg.feeBps)/10000n);
    assert(safeInt(gross,1)&&gross>fee,'The exchange amount is too small.');
    return {cr,gross,fee,net:gross-fee,rate:cfg.assetMicrosPerCR,expiresAt:now+cfg.quoteSeconds*1000};
  }
  function apply(source,action,payload={},now=Date.now()){
    const s=clone(source);periods(s,now);let result={};
    const p=payload;
    if(s.node)N.settle(s,now);
    if(action.startsWith('node')){
      result=N.act(s,action,p,now);
      if(result.creditCents)credit(s,result.creditCents,'node_reward',result.title,result.reference,now,{detail:result.detail});
      if(result.debitCents){assert(s.balance.cr>=result.debitCents,'Not enough CR.');s.balance.cr-=result.debitCents;log(s,{type:action==='nodeUpgrade'?'node_upgrade':'node_restore',title:result.title,cr:-result.debitCents,reference:result.reference},now);}
      if(action==='nodeDemo')audit(s,'Node demo control',JSON.stringify(p),now);
      assert(Object.values(s.balance).every(x=>safeInt(x)),'Balance invariant failed.');s.revision++;return {state:s,...result};
    }
    switch(action){
      case 'refresh':break;
      case 'farmStart':{
        F.ensure(s);const existing=F.current(s);result=existing?{session:existing,alreadyActive:true}:F.start(s,id(s,'farm-'+s.user.id),now);break;
      }
      case 'farmClaim':{
        F.ensure(s);const session=s.farm.sessions.find(x=>x.id===p.id);assert(session&&session.userId===s.user.id,'Farm session not found.');
        if(session.claimedAt!==null){result={alreadyApplied:true,claimed:clone(session)};break;}
        assert(now>=session.endsAt,'This farming session is not ready to claim.');
        const tx=credit(s,session.rewardCents,'farm','Farm reward',session.id,now,{farmSessionNumber:session.number,detail:'Completed farming session #'+String(session.number).padStart(3,'0')});
        session.claimedAt=now;session.ledgerId=tx.id;result={claimed:clone(session)};break;
      }
      case 'claimDaily':{
        assert(canClaimDaily(s,now),'Your daily reward is not ready yet.');
        s.lastDaily=now;credit(s,s.settings.dailyBoost.rewardCents,'daily','Daily reward',id(s,'daily'),now);break;
      }
      case 'startAd':{
        const available=adAvailability(s,now);assert(available.status==='ready',available.status==='limited'?'Ad provider limit reached.':'An ad session is already active.');
        const cfg=s.settings.ads,session={id:id(s,'ad'),status:'started',createdAt:now,expiresAt:now+cfg.confirmationSeconds*1000,readyAt:now+cfg.demoDurationSeconds*1000,rewardCents:cfg.rewardCents};
        s.ads.sessions[session.id]=session;result={session};break;
      }
      case 'awaitAd':{
        const session=s.ads.sessions[p.id];assert(session&&['started','awaiting_confirmation','rewarded'].includes(session.status),'No active ad session.');if(session.status==='started')session.status='awaiting_confirmation';break;
      }
      case 'confirmAd':{
        const a=s.ads.sessions[p.id];assert(a,'Ad session not found.');
        if(a.status==='rewarded'){result={alreadyApplied:true,confirmation:clone(a.result)};break;}
        assert(['started','awaiting_confirmation'].includes(a.status),'This ad session cannot receive a reward.');
        assert(now>=a.readyAt,'Finish the preview before confirmation.');assert(now<a.expiresAt,'The ad session has expired.');
        const seriesNumber=s.series.number;a.status='rewarded';a.confirmedAt=now;
        const base=credit(s,a.rewardCents,'ad','Ad reward',a.id,now,{seriesNumber});s.ads.dailyViews++;s.ads.lastRewardAt=now;s.series.views++;
        let bonusCents=0,threshold=null;const operations=[base.id];
        for(const level of s.series.levels)if(s.series.views>=level.views&&!s.series.claimed.includes(level.views)){
          const key=s.user.id+':'+seriesNumber+':'+level.views;assert(!s.bonusClaims.includes(key),'Duplicate milestone.');
          s.series.claimed.push(level.views);s.bonusClaims.push(key);bonusCents+=level.rewardCents;threshold=level.views;
          operations.push(credit(s,level.rewardCents,'milestone','Milestone bonus',a.id,now,{seriesNumber,threshold:level.views,bonusKey:key}).id);
        }
        N.event(s,'ad',now);
        const confirmedViews=s.series.views;
        if(s.series.views===s.series.length)s.series={number:seriesNumber+1,views:0,claimed:[],levels:clone(s.settings.milestones.levels),length:s.settings.milestones.seriesLength};
        a.result={sessionId:a.id,seriesNumber,confirmedViews,baseRewardCents:a.rewardCents,bonusCents,totalCents:a.rewardCents+bonusCents,threshold,operations,next:seriesProgress(s)};
        result={confirmation:clone(a.result)};break;
      }
      case 'cancelAd':{
        const a=s.ads.sessions[p.id];if(a&&['started','awaiting_confirmation'].includes(a.status))a.status='closed_without_reward';break;
      }
      case 'startTask':{
        const t=s.settings.tasks.find(x=>x.id===p.id&&x.active);assert(t,'This task is unavailable.');
        const current=s.tasks[t.id];assert(!current||current.status!=='claimed','This task has already been completed.');
        if(current&&['started','awaiting_verification'].includes(current.status))break;
        s.tasks[t.id]={id:id(s,'task-event'),status:'started',startedAt:now,rewardCents:t.rewardCents,unit:'CR',title:t.title};break;
      }
      case 'verifyTask':{
        const t=s.tasks[p.id];assert(t,'Start this task first.');
        if(t.status==='claimed'){result={alreadyApplied:true};break;}
        assert(['started','rejected','awaiting_verification'].includes(t.status),'Task cannot be verified.');
        t.checkedAt=now;t.reason=p.approved===false?'The required action was not confirmed.':'';
        if(p.approved===false)t.status='rejected';else{t.status='claimed';t.claimedAt=now;credit(s,t.rewardCents,'task',t.title,t.id||('task-'+p.id),now);N.event(s,'task',now);}break;
      }
      case 'connectWallet':s.wallet={address:'DEMO-BOUNTERA-1042-7A3F',network:s.settings.withdrawal.network,connectedAt:now,ownership:'demo-only'};break;
      case 'disconnectWallet':assert(s.balance.reserved===0,'Wait for pending withdrawals before disconnecting.');s.wallet=null;break;
      case 'createQuote':{
        const quote={id:id(s,'quote'),...quoteFor(s,p.cr,now)};s.quotes[quote.id]=quote;result={quote};break;
      }
      case 'exchange':{
        if(s.exchanges[p.id]){result={alreadyApplied:true};break;}
        const q=s.quotes[p.id];assert(q,'Quote not found.');assert(now<q.expiresAt,'The quote has expired. Get a new quote.');assert(s.balance.cr>=q.cr,'Not enough CR available.');
        s.balance.cr-=q.cr;s.balance.asset+=q.net;s.exchanges[p.id]={...q,completedAt:now};
        log(s,{type:'exchange',title:'CR exchanged for ASSET',cr:-q.cr,asset:q.net,reference:q.id,detail:'Quote rate: '+q.rate+' micro-ASSET per CR. Fee: '+q.fee+' micro-ASSET.'},now);break;
      }
      case 'withdraw':{
        assert(typeof p.requestId==='string'&&p.requestId.length>0,'Missing request ID.');
        if(s.withdrawals.some(w=>w.requestId===p.requestId)){result={alreadyApplied:true};break;}
        const cfg=s.settings.withdrawal;assert(s.wallet,'Connect the demo wallet first.');
        assert(safeInt(p.amount,1),'Enter a valid amount.');assert(p.amount>=cfg.minAssetMicros,'The amount is below the withdrawal minimum.');assert(p.amount>cfg.feeAssetMicros,'The amount must exceed the fee.');assert(p.amount<=s.balance.asset,'Not enough ASSET available.');
        const w={id:id(s,'withdrawal'),requestId:p.requestId,amount:p.amount,fee:cfg.feeAssetMicros,net:p.amount-cfg.feeAssetMicros,address:s.wallet.address,network:s.wallet.network,status:'under_review',createdAt:now};
        w.nodeTier=s.node?N.view(s,now).tier:1;w.demoProcessingHours=Math.ceil(24/w.nodeTier);s.withdrawals.unshift(w);s.balance.asset-=w.amount;s.balance.reserved+=w.amount;
        log(s,{type:'withdrawal',title:'Withdrawal requested',asset:-w.amount,reserved:w.amount,status:'pending',reference:w.id,detail:'Demo funds reserved for review.'},now);result={withdrawal:w};break;
      }
      case 'cancelWithdrawal':{
        const w=s.withdrawals.find(x=>x.id===p.id);assert(w&&['under_review','approved'].includes(w.status),'This withdrawal cannot be cancelled.');
        w.status='cancelled';w.updatedAt=now;s.balance.reserved-=w.amount;s.balance.asset+=w.amount;
        const pending=s.ledger.find(t=>t.reference===w.id&&t.type==='withdrawal');if(pending)pending.status='cancelled';
        log(s,{type:'refund',title:'Withdrawal cancelled',asset:w.amount,reserved:-w.amount,reference:w.id,detail:'Reserved funds returned.'},now);break;
      }
      case 'redeemPromo':{
        const code=String(p.code||'').trim().toUpperCase(),promo=s.promos.find(x=>x.code===code);
        assert(promo,'This promo code was not found.');assert(promo.active,'This promo code is inactive.');assert(now<promo.expiresAt,'This promo code has expired.');assert(!s.redeemed.includes(code),'You have already used this code.');assert(promo.uses<promo.maxUses,'This promo code has reached its activation limit.');
        promo.uses++;s.redeemed.push(code);reward(s,promo.reward,'CR','promo','Promo code activated',code,now);break;
      }
      case 'adminAdjust':{
        assert(Number.isSafeInteger(p.cr)&&p.cr!==0,'Enter a non-zero adjustment.');assert(typeof p.reason==='string'&&p.reason.trim().length>=5,'Please give a clear reason for this adjustment.');assert(s.balance.cr+p.cr>=0,'This adjustment would make the balance negative.');
        s.balance.cr+=p.cr;log(s,{type:'adjustment',title:'Balance adjustment',cr:p.cr,reference:id(s,'adjustment'),detail:p.reason.trim()},now);audit(s,'Balance adjusted',p.reason.trim(),now);break;
      }
      case 'adminWithdrawal':{
        const w=s.withdrawals.find(x=>x.id===p.id);assert(w,'Withdrawal not found.');
        const transitions={under_review:['approved','rejected'],approved:['confirmed','rejected']};assert((transitions[w.status]||[]).includes(p.status),'This status change is not allowed.');
        const before=w.status;w.status=p.status;w.updatedAt=now;
        const pending=s.ledger.find(t=>t.reference===w.id&&t.type==='withdrawal');if(pending&&['confirmed','rejected'].includes(p.status))pending.status=p.status==='confirmed'?'completed':'rejected';
        if(p.status==='rejected'){s.balance.reserved-=w.amount;s.balance.asset+=w.amount;log(s,{type:'refund',title:'Withdrawal rejected',asset:w.amount,reserved:-w.amount,reference:w.id,detail:'Demo administrator rejected the request.'},now);}
        if(p.status==='confirmed'){s.balance.reserved-=w.amount;w.transactionId='DEMO-'+w.id;log(s,{type:'withdrawal',title:'Demo withdrawal completed',reserved:-w.amount,reference:w.id,detail:'Simulated payout only. No on-chain transaction.'},now);}
        audit(s,'Withdrawal updated',w.id+': '+before+' → '+p.status,now);break;
      }
      case 'adminPromo':{
        const code=String(p.code||'').trim().toUpperCase();assert(/^[A-Z0-9_-]{3,24}$/.test(code),'Use 3–24 letters, numbers, underscores or hyphens.');assert(!s.promos.some(x=>x.code===code),'That code already exists.');assert(safeInt(p.reward,1)&&safeInt(p.maxUses,1),'Reward and activation limit must be positive whole numbers.');
        s.promos.push({code,reward:p.reward,maxUses:p.maxUses,uses:0,expiresAt:now+30*86400000,active:true});audit(s,'Promo code created',code,now);break;
      }
      case 'adminTogglePromo':{const promo=s.promos.find(x=>x.code===p.code);assert(promo,'Code not found.');promo.active=!promo.active;audit(s,'Promo code updated',promo.code+': '+(promo.active?'active':'inactive'),now);break;}
      case 'adminToggleTask':{const t=s.settings.tasks.find(x=>x.id===p.id);assert(t,'Task not found.');t.active=!t.active;audit(s,'Task updated',t.title+': '+(t.active?'active':'inactive'),now);break;}
      case 'adminCreateTask':{
        assert(String(p.title||'').trim().length>=3,'Enter a task title.');assert(['channels','bots','partners'].includes(p.category),'Select a task category.');assert(safeInt(parseAmount(p.reward,2),1),'Enter a CR reward with up to two decimals.');assert(String(p.condition||'').trim().length>=5,'Specify the required action.');
        const t={rewardCents:parseAmount(p.reward,2),id:id(s,'task'),title:p.title.trim(),category:p.category,description:p.condition.trim(),condition:p.condition.trim(),reward:p.reward,unit:'CR',active:true,icon:p.category==='bots'?'bot':'channel',url:'',limit:1};s.settings.tasks.push(t);audit(s,'Task created',t.title,now);break;
      }
      case 'adminSettings':{
        const before=clone(s.settings);
        if(p.section==='ads'){
          assert(safeInt(p.rewardCents,1)&&(p.providerDailyLimit===null||safeInt(p.providerDailyLimit,1))&&safeInt(p.cooldownSeconds),'Use valid ad settings.');Object.assign(s.settings.ads,{rewardCents:p.rewardCents,providerDailyLimit:p.providerDailyLimit,cooldownSeconds:p.cooldownSeconds});
        }else if(p.section==='referrals'){assert(safeInt(p.percent)&&p.percent<=100,'The referral share must be between 0 and 100%.');s.settings.referrals.percent=p.percent;}
        else if(p.section==='exchange'){assert(safeInt(p.assetMicrosPerCR,1)&&safeInt(p.minCRCents,1)&&safeInt(p.feeBps)&&p.feeBps<10000,'Enter valid exchange settings.');Object.assign(s.settings.exchange,{assetMicrosPerCR:p.assetMicrosPerCR,minCRCents:p.minCRCents,feeBps:p.feeBps});}
        else if(p.section==='withdrawal'){assert(safeInt(p.minAssetMicros,1)&&safeInt(p.feeAssetMicros)&&p.feeAssetMicros<p.minAssetMicros,'The fee must be below the minimum amount.');Object.assign(s.settings.withdrawal,{minAssetMicros:p.minAssetMicros,feeAssetMicros:p.feeAssetMicros});}
        else if(p.section==='milestones'){assert(Array.isArray(p.levels)&&p.levels.length===3&&p.levels.every(l=>safeInt(l.views,1)&&l.views<=50&&safeInt(l.rewardCents,1))&&new Set(p.levels.map(l=>l.views)).size===3&&Math.max(...p.levels.map(l=>l.views))===50,'Use three unique thresholds ending at 50.');s.settings.milestones={seriesLength:50,levels:clone(p.levels).sort((a,b)=>a.views-b.views)};}
        else throw new Error('Unknown settings section.');
        audit(s,'Settings updated',p.section,now);s.audit[0].before=before[p.section];s.audit[0].after=clone(s.settings[p.section]);break;
      }
      default:throw new Error('Unknown action.');
    }
    assert(Object.values(s.balance).every(x=>safeInt(x)),'Balance invariant failed.');s.revision++;return {state:s,...result};
  }
  const api={initial,apply,quoteFor,parseAmount,dayKey,weekKey,canClaimDaily,migrate,seriesProgress,adAvailability};root.BounteraEngine=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
