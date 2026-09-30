const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../assets/engine.js'),C=require('../assets/config.js'),UI=require('../assets/home-ui.js'),{Store}=require('../server/store.cjs');
const T=Date.UTC(2026,9,1,12),MIN=60000;
const fresh=()=>{const s=E.initial(C,T);E.settle(s,T);return s;};
const apply=(s,a,p={},t=T,id=a+'-'+t)=>E.apply(s,a,p,t,id);
const start=()=>apply(fresh(),'sessionStart').state;
const current=s=>s.crSessions.sessions.at(-1);
function boost(s,at){const out=apply(s,'adStart',{purpose:'sessionBonus',sessionId:current(s).id},at);return apply(out.state,'adConfirm',{id:out.ad.id},at+3000).state;}
const helpers={t:(en)=>en,loc:x=>Array.isArray(x)?x[0]:x,icon:()=>'',btn:(label,a,attrs='',css='')=>`<button class="${css}" data-action="${a}" ${attrs}>${label}</button>`,cr:x=>(x/100).toFixed(2),duration:String};

test('three confirmed boosts shorten the deadline, preserve progress and credit exactly once',()=>{
 let s=start();const balance=s.balance.cr;
 for(let n=1;n<=3;n++){const at=T+n*4*MIN+3000,prior=current(s).endsAt,out=apply(s,'adStart',{purpose:'sessionBonus',sessionId:current(s).id},at),before=E.view(out.state,at+3000).crSession;
 s=apply(out.state,'adConfirm',{id:out.ad.id},at+3000).state;const v=E.view(s,at+3000).crSession;
 assert.equal(v.boostsUsed,n);assert.equal(v.bonusCents,n*20);assert.equal(v.totalCents,150+n*20);assert.equal(current(s).endsAt,prior-5*MIN);assert.equal(v.progress,before.progress);assert.equal(s.balance.cr,balance);
 s=apply(s,'adConfirm',{id:out.ad.id},at+3001,'replayed-'+n).state;assert.equal(current(s).bonusCents,n*20);
 assert.deepEqual(E.view(E.load(s),at+3001).crSession,E.view(s,at+3001).crSession);
 }
 assert.equal(current(s).endsAt,T+15*MIN);assert.equal(E.view(s,T+14*MIN).crSession.canBonus,false);
 s=apply(s,'sessionClaim',{sessionId:current(s).id},T+15*MIN).state;assert.equal(s.balance.cr,balance+210);assert.equal(E.view(s,T+15*MIN).crSession.progress,0);
});
test('boost with five minutes or less finishes now, including late confirmation',()=>{
 for(const minute of [25,28,29.99]){let s=start();s=boost(s,T+minute*MIN);const v=E.view(s,T+minute*MIN+3000).crSession;
 assert.equal(v.phase,'completed');assert.equal(v.progress,1);assert.equal(v.remainingMs,0);assert.equal(v.totalCents,170);assert(v.canClaim);}
});
test('progress never drops after multiple boosts and is independent of reading frequency',()=>{
 let s=start(),previous=0;s=boost(s,T+4*MIN);
 for(let t=T+4*MIN+3000;t<=current(s).endsAt;t+=10000){const v=E.view(s,t).crSession;assert(v.progress>=previous);previous=v.progress;}
 assert.equal(E.view(s,current(s).endsAt).crSession.progress,1);assert.equal(E.view(s,T+6*MIN).crSession.progress,E.view(E.load(s),T+6*MIN).crSession.progress);
});
test('legacy sessions and earned rewards retain their exact original terms; future offers migrate',()=>{
 let s=start();const x=current(s);for(const k of ['maxBoosts','boostReductionMs','boostOperations'])delete x[k];
 Object.assign(x,{durationMs:50*MIN,endsAt:T+50*MIN,baseCents:100,bonusOfferCents:25,bonusCents:25,bonusOperation:'old-bonus'});
 s.crSessions.version=1;Object.assign(s.crSessions.settings,{durationMs:50*MIN,baseCents:100,bonusCents:25});s.ledger.push({id:'old',type:'daily',source:'old',cr:200,at:T});
 const snapshot=JSON.stringify(x),balance=JSON.stringify(s.balance),ledger=JSON.stringify(s.ledger);E.settle(s,T);
 assert.equal(JSON.stringify(current(s)),snapshot);assert.equal(JSON.stringify(s.balance),balance);assert.equal(JSON.stringify(s.ledger),ledger);
 assert.equal(E.view(s,T).crSession.maxBoosts,1);assert.equal(E.view(s,T).crSession.totalCents,125);
 s=apply(s,'sessionClaim',{sessionId:x.id},T+50*MIN).state;s=apply(s,'sessionStart',{},T+50*MIN+1).state;
 assert.equal(current(s).durationMs,30*MIN);assert.equal(current(s).baseCents,150);assert.equal(current(s).maxBoosts,3);
});
test('legacy ad opened before update can still confirm without changing its deadline',()=>{
 let s=start(),x=current(s);for(const k of ['maxBoosts','boostReductionMs','boostOperations'])delete x[k];x.bonusOfferCents=25;const end=x.endsAt;
 const out=apply(s,'adStart',{purpose:'sessionBonus',sessionId:x.id},T+4*MIN);delete out.state.adSessions[out.ad.id].target.boostIndex;
 s=apply(out.state,'adConfirm',{id:out.ad.id},T+4*MIN+3000).state;assert.equal(current(s).endsAt,end);assert.equal(current(s).bonusCents,25);
});
test('SQLite preserves a confirmed boost and deduplicates a lost response',()=>{
 const db=new Store(':memory:');try{db.ensure('boost-user',{},T);const first=db.act('boost-user','sessionStart',{},'start-session',T),sid=current(first.state).id;
 const ad=db.act('boost-user','adStart',{purpose:'sessionBonus',sessionId:sid},'start-ad-one',T+4*MIN);
 db.act('boost-user','adConfirm',{id:ad.ad.id},'confirm-ad-one',T+4*MIN+3000);
 const repeat=db.act('boost-user','adConfirm',{id:ad.ad.id},'confirm-ad-one',T+4*MIN+4000);assert(repeat.replayed);assert.equal(current(db.read('boost-user')).endsAt,T+25*MIN);assert.equal(current(db.read('boost-user')).bonusCents,20);
 }finally{db.close();}
});
test('one action slot represents every state with real offer values and no duplicate bonus',()=>{
 const ui=UI.create(helpers),s=start(),base=E.view(s,T+6*MIN);
 const cases=[
 [{phase:'ready',session:null,bonusCents:0,boostsUsed:0,totalCents:150},'Start mining','30 min · 1.50 CR'],
 [{canBonus:true},'Boost · ad','−5 min · +0.20 CR'],
 [{canBonus:true,remainingMs:5*MIN},'Finish · ad','Finish now · +0.20 CR'],
 [{boostsUsed:3,bonusCents:60,totalCents:210},'Node boosted','Collect after completion'],
 [{canBonus:false},'Boost unavailable','Mining continues'],
 [{phase:'completed',remainingMs:0,progress:1,totalCents:190,bonusCents:40,boostsUsed:2},'Collect 1.90 CR','Reward ready'],
 [{phase:'completed',adPending:true},'Confirming reward…','Your progress is saved']
 ];
 for(const [override,label,note] of cases){const html=ui.render({...base,crSession:{...base.crSession,...override}}),card=html.slice(html.indexOf('<section class="session-panel'));
 assert(card.includes(label),label);assert(card.includes(note),note);assert.equal((card.match(/<button /g)||[]).length,override.boostsUsed===3?0:1);assert(!card.includes('reference-claim'));assert(!card.includes('<svg'));assert(!card.includes('Activated'));}
});
test('pending request blocks repeats and failure leaves reward and next action unchanged',async()=>{
 let resolve,calls=0;const s=start(),view=E.view(s,T+30*MIN),ui=UI.create({...helpers,view:()=>view,render:()=>{},toast:()=>{},busy:()=>false,action:()=>{calls++;return new Promise(r=>resolve=r);}});
 const first=ui.click('homeSessionClaim');assert(ui.render(view).includes('Collecting…'));await ui.click('homeSessionClaim');assert.equal(calls,1);resolve(null);await first;
 assert(ui.render(view).includes('Collect 1.50 CR'));assert.equal(s.balance.cr,C.initialCRCents);
});
test('an action whose state changed since rendering is rejected instead of performing a different action',async()=>{
 const s=start();let view=E.view(s,T+6*MIN),calls=0;const ui=UI.create({...helpers,view:()=>view,render:()=>{},busy:()=>false,action:async()=>{calls++;},toast:()=>{}});
 const intent=ui.render(view).match(/data-session-intent="([^"]+)"/)[1];view=E.view(s,T+26*MIN);await ui.click('homeSessionBonus',intent);assert.equal(calls,0);
 view=E.view(s,T+30*MIN);await ui.click('homeSessionBonus',intent);assert.equal(calls,0);
});
test('pointer held across a replaced button cannot trigger the new action',()=>{
 const handlers={},context={document:{addEventListener:(name,fn)=>handlers[name]=fn}};vm.createContext(context);vm.runInContext(fs.readFileSync('assets/home-ui.js','utf8'),context);context.HomeUI.create(helpers);
 const old={dataset:{sessionIntent:'boost'}},next={dataset:{sessionIntent:'claim'}};let prevented=false,stopped=false;
 handlers.pointerdown({target:{closest:()=>old}});handlers.click({target:{closest:()=>next},preventDefault:()=>prevented=true,stopImmediatePropagation:()=>stopped=true});assert(prevented&&stopped);
});
