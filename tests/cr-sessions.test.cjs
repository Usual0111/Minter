const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../assets/engine.js'),C=require('../assets/config.js'),UI=require('../assets/home-ui.js'),{Store}=require('../server/store.cjs');
const T=Date.UTC(2026,8,29,12),D=30*60000;
const fresh=()=>{const s=E.initial(C,T);E.settle(s,T);return s;};
const act=(s,a,p={},t=T,id=a+'-'+t)=>E.apply(s,a,p,t,id).state;
const session=s=>s.crSessions.sessions.at(-1);
const helpers={t:(en)=>en,loc:x=>Array.isArray(x)?x[0]:x,icon:()=>'',btn:(label,a,attrs='',css='')=>`<button class="${css}" data-action="${a}" ${attrs}>${label}</button>`,cr:x=>(x/100).toFixed(2),duration:String};
test('session snapshots reward and duration; progress and accrual are capped and survive reopening',()=>{
 let s=act(fresh(),'sessionStart');const x=session(s);s.crSessions.settings.baseCents=900;s.crSessions.settings.durationMs=1;
 let v=E.view(E.load(s),T+D*.64).crSession;assert.equal(v.accruedHundredthsOfCent,9600);assert.equal(v.progress,.64);assert.equal(v.totalCents,150);assert.equal(v.remainingMs,10.8*60000);
 v=E.view(s,T+D*100).crSession;assert.equal(v.accruedHundredthsOfCent,15000);assert.equal(v.progress,1);assert.equal(v.phase,'completed');assert.equal(session(s).baseCents,150);assert.equal(x.durationMs,D);
 assert.equal(E.view(s,T-86400000).crSession.progress,0);
});
test('launch and claim are idempotent by session and operation; no early claim, no auto-restart',()=>{
 let s=act(fresh(),'sessionStart');const x=session(s),balance=s.balance.cr;
 s=act(s,'sessionStart',{},T+1,'different-launch');assert.equal(s.crSessions.sessions.length,1);
 assert.throws(()=>act(s,'sessionClaim',{sessionId:x.id},T+D-1),/still active/);
 s=act(s,'sessionClaim',{sessionId:x.id},T+D,'claim-first');assert.equal(s.balance.cr,balance+150);assert.equal(E.view(s,T+D).crSession.weeklyCompleted,1);assert.equal(E.view(s,T+D).crSession.phase,'ready');
 s=act(s,'sessionClaim',{sessionId:x.id},T+D+1,'claim-second');assert.equal(s.balance.cr,balance+150);assert.equal(s.ledger.filter(l=>l.type==='session_claim').length,1);
 assert.throws(()=>act(s,'sessionClaim',{sessionId:'foreign'},T+D),/not found/);
});
test('fixed confirmed bonus does not alter elapsed progress or accrued base, applies once at end',()=>{
 let s=act(fresh(),'sessionStart');const x=session(s);let o=E.apply(s,'adStart',{purpose:'sessionBonus',sessionId:x.id},T+300000,'bonus-start');
 const before=E.view(o.state,T+303000).crSession;s=act(o.state,'adConfirm',{id:o.ad.id},T+303000,'bonus-confirm');const after=E.view(s,T+303000).crSession;
 assert.equal(after.progress,before.progress);assert.equal(after.accruedHundredthsOfCent,before.accruedHundredthsOfCent);assert.equal(after.totalCents,170);assert.equal(after.canBonus,false);
 s=act(s,'adConfirm',{id:o.ad.id},T+304000,'bonus-retry');assert.equal(session(s).bonusCents,20);
 assert.equal(E.view(s,T+D).crSession.accruedHundredthsOfCent,17000);
});
test('cancellation, early and expired confirmations never award bonus or wipe progress',()=>{
 for(const kind of ['cancel','early','expired']){let s=act(fresh(),'sessionStart');const x=session(s),o=E.apply(s,'adStart',{purpose:'sessionBonus',sessionId:x.id},T+300000,'ad-start-'+kind);s=o.state;
 if(kind==='cancel')s=act(s,'adCancel',{id:o.ad.id},T+300001);
 assert.throws(()=>act(s,'adConfirm',{id:o.ad.id},kind==='early'?T+300001:kind==='expired'?T+700000:T+304000),/Complete the ad/);
 assert.equal(session(s).bonusCents,0);assert.equal(E.view(s,T+700000).crSession.phase,'active');}
});
test('finishing while the ad is open preserves confirmed bonus before a single claim',()=>{
 let s=act(fresh(),'sessionStart'),x=session(s),o=E.apply(s,'adStart',{purpose:'sessionBonus',sessionId:x.id},T+D-1000,'late-ad');s=o.state;
 assert.throws(()=>act(s,'sessionClaim',{sessionId:x.id},T+D+1),/Waiting for ad/);
 s=act(s,'adConfirm',{id:o.ad.id},T+D+3000);assert.equal(E.view(s,T+D+3000).crSession.totalCents,170);
 s=act(s,'sessionClaim',{sessionId:x.id},T+D+4000);assert.equal(s.balance.cr,C.initialCRCents+170);
});
test('free daily limits, ad start and delayed bonus offer; exhausted starts have real reset time',()=>{
 let s=fresh();s.crSessions.settings.freePerDay=1;s.crSessions.settings.adStartsPerDay=1;s=act(s,'sessionStart');s=act(s,'sessionClaim',{sessionId:session(s).id},T+D);
 assert.equal(E.view(s,T+D).crSession.phase,'ad-start');let o=E.apply(s,'adStart',{purpose:'sessionStart'},T+D+1000,'start-ad');s=act(o.state,'adConfirm',{id:o.ad.id},T+D+5000);
 assert.equal(session(s).source,'ad');assert.equal(E.view(s,T+D+6000).crSession.canBonus,false);
 s=act(s,'sessionClaim',{sessionId:session(s).id},T+2*D+5000);const v=E.view(s,T+2*D+5000).crSession;assert.equal(v.phase,'unavailable');assert.equal(v.nextFreeAt,Date.UTC(2026,8,30));assert.equal(E.view(s,v.nextFreeAt).crSession.phase,'ready');
});
test('SQLite serializes competing launches/claims, lost responses and independent users',()=>{
 const db=new Store(':memory:');try{db.ensure('a',{},T);db.ensure('b',{},T);let o=db.act('a','sessionStart',{},'launch-0001',T);const id=session(o.state).id;db.act('a','sessionStart',{},'launch-0002',T);assert.equal(db.read('a').crSessions.sessions.length,1);
 db.act('a','sessionClaim',{sessionId:id},'claim-0001',T+D);db.act('a','sessionClaim',{sessionId:id},'claim-0002',T+D);const recovered=db.act('a','sessionClaim',{sessionId:id},'claim-0001',T+D);assert(recovered.replayed);assert.equal(db.read('a').balance.cr,C.initialCRCents+150);assert.equal(db.db.prepare("SELECT count(*) n FROM mining_ledger WHERE type='session_claim'").get().n,1);assert.throws(()=>db.act('b','sessionClaim',{sessionId:id},'claim-0003',T+D),/not found/);
 }finally{db.close();}
});
test('Home renders ready, active, bonus, completed and exhausted states without DATA or old ring',()=>{
 const ui=UI.create(helpers);let s=fresh(),html=ui.render(E.view(s,T));assert(html.includes('Start mining'));assert(!html.includes('Weekly goal')); // Extra rewards now live inside the galaxy menu.
assert(!html.includes('collect-ring'));assert(!html.includes('DATA'));
 s=act(s,'sessionStart');html=ui.render(E.view(s,T+300000));assert(html.includes('Boost · ad'));assert(html.includes('Equipment ↗'));
 let o=E.apply(s,'adStart',{purpose:'sessionBonus',sessionId:session(s).id},T+300000,'ui-ad');s=act(o.state,'adConfirm',{id:o.ad.id},T+303000);html=ui.render(E.view(s,T+303000));assert(html.includes('Boosts 1/3'));assert(html.includes('Bonus +0.20 CR'));assert(html.includes('Boost unavailable'));
 html=ui.render(E.view(s,T+D));assert(html.includes('Collect'));assert(html.includes('homeSessionClaim'));assert(html.includes('1.70 CR'));assert(!html.includes('homeSessionBonus'));
 s=act(s,'sessionClaim',{sessionId:session(s).id},T+D);s.crSessions.settings.freePerDay=0;s.crSessions.settings.adStartsPerDay=0;html=ui.render(E.view(s,T+D));assert(html.includes('No starts available'));assert(!html.includes('freeTimer'));
});
