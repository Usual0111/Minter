const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../..'),packaged=process.argv.includes('--package');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
 for(const width of [360,390,430]){
  const page=await browser.newPage({viewport:{width,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://telegram.org/**',r=>r.abort());
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.setInterval=()=>1;});
  await page.goto('file:///'+root.replaceAll('\\','/')+(packaged?'/outputs/Bountera.html':'/index.html')+'#/home',{waitUntil:'commit'});await page.waitForSelector('[data-session-live="amount"]');await page.waitForTimeout(250);await page.evaluate(()=>document.getAnimations().forEach(a=>a.finish()));
  const result=await page.evaluate(async()=>{
   const el=document.querySelector('[data-session-live="amount"]'),bounds=e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height];};el.textContent=el.textContent;
   const selectors=['.reference-total','[data-session-live="amount"]','.reference-total img','.session-total','.sector-count','.home-device-rig','.home-device-layer','.reference-session-panel','.bottom-nav','.galaxy-selector','.home-balance-badge'];
   const geometry=()=>selectors.map(s=>bounds(document.querySelector(s))),before=geometry(),ranges=[];
   for(let i=0;i<el.textContent.length;i++){const r=document.createRange();r.setStart(el.firstChild,i);r.setEnd(el.firstChild,i+1);ranges.push(bounds(r));}
   let at=0;window.counterView={status:'active',sessionId:'visual-test',unit:1000000,accumulatedMicroCents:0};let cadence;
   const counter=HomeUI.createCounter({now:()=>at,view:()=>({rewardMining:counterView}),schedule:(callback,ms)=>{cadence=ms;window.counterCallback=callback;}});window.visualCounter=counter;
   counter.sample(counterView);const after=geometry(),digits=[...el.querySelectorAll('.mined-counter-digit')],digitBounds=digits.map(e=>bounds(e.firstChild));
   const sample=(value,ms,status='active')=>{at+=ms;counterView.accumulatedMicroCents=value*1000;counterView.status=status;counter.sample(counterView);return {text:el.textContent,label:el.getAttribute('aria-label'),blur:digits.map(e=>e.style.getPropertyValue('--digit-trail'))};};
   const carryStart=sample(9,100),carry=sample(10,100),skipped=sample(13,100),fastBoth=sample(45,100),pause=sample(100,1000),again=sample(104,100),done=sample(105,100,'ready');
   await new Promise(r=>setTimeout(r,220));const opacity=digits.map(e=>getComputedStyle(e,'::after').opacity),filter=digits.map(e=>getComputedStyle(e,'::after').filter),vertical=document.querySelector('#mined-digit-fast feGaussianBlur').getAttribute('stdDeviation');
   return {before,after,ranges,digitBounds,cadence,carryStart,carry,skipped,fastBoth,pause,again,done,opacity,filter,vertical};
  });
  result.after.forEach((r,i)=>r.forEach((v,j)=>assert(Math.abs(v-result.before[i][j])<.05,'Counter wrapping preserves bounds within font subpixel rounding')));result.digitBounds.forEach((r,i)=>r.forEach((v,j)=>assert(Math.abs(v-result.ranges[result.ranges.length-2+i][j])<.05,'Digit glyph position / width preserved')));
  assert.equal(result.cadence,100);assert.deepEqual(result.carry.blur,['0','0']);assert.deepEqual(result.skipped.blur,['0','0.55']);assert.deepEqual(result.fastBoth.blur,['0.55','0.55']);assert.deepEqual(result.pause.blur,['0','0']);assert.equal(result.skipped.text,'0.00013');assert.equal(result.skipped.label,'0.00013');assert.equal(result.done.text,'0.00105');assert.deepEqual(result.done.blur,['0','0']);assert.deepEqual(result.opacity,['0','0']);assert.equal(result.vertical,'0 0.9');assert(result.filter.every(x=>x.includes('mined-digit')));assert.deepEqual(errors,[]);
  await page.evaluate(()=>{counterView.status='active';counterView.accumulatedMicroCents=1090000;visualCounter.sample(counterView);});
  await page.screenshot({path:path.join(__dirname,`mined-counter-${width}${packaged?'-package':''}.png`)});await page.close();
 }
 const live=await browser.newPage({viewport:{width:390,height:844}});await live.route('https://telegram.org/**',r=>r.abort());
 await live.goto('file:///'+root.replaceAll('\\','/')+(packaged?'/outputs/Bountera.html':'/index.html')+'#/home',{waitUntil:'commit'});await live.waitForSelector('[data-session-live="amount"]');
 await live.evaluate(()=>{
  const T=Date.now()-595000,E=MiningEngine,C=MiningConfig;let s=E.initial(C,T),i=0;
  const act=(a,p,t)=>{const out=E.apply(s,a,p,t,'counter-qa-'+(++i));s=out.state;return out;};
  act('rewardFreeStart',E.view(s,T).rewardMining.freeSession,T);
  const offer=act('rewardAdOffer',E.view(s,T+591000).rewardMining.offer,T+591000);act('rewardAdShow',{eventId:offer.event.id},T+591000);act('rewardAdConfirm',{eventId:offer.event.id},T+594000);
  localStorage.setItem(C.storageKey,JSON.stringify(s));
 });
 await live.reload({waitUntil:'commit'});await live.waitForSelector('.mined-counter-digit');
 await live.evaluate(()=>{window.liveCounter=document.querySelector('[data-session-live="amount"]');window.sampleTimes=[];new MutationObserver(()=>sampleTimes.push(performance.now())).observe(liveCounter,{attributes:true,attributeFilter:['aria-label']});});
 await live.waitForTimeout(1200);
 const active=await live.evaluate(()=>({times:sampleTimes,trace:[...liveCounter.querySelectorAll('.mined-counter-digit')].map(e=>e.style.getPropertyValue('--digit-trail')),value:liveCounter.textContent}));
 assert(active.times.length>=8&&active.times.length<=13,'Actual displayed counter samples 8–10 times/sec');active.times.slice(1).forEach((t,i)=>assert(t-active.times[i]>=85,'No extra amount writes from other UI ticks'));assert(active.trace.some(x=>Number(x)>0),'Confirmed boost makes only trailing digits show motion');
 await live.waitForFunction(()=>document.querySelector('[data-session-live="status"]').textContent.includes('Mining complete'));
 await live.waitForTimeout(220);
 const completed=await live.evaluate(()=>({same:liveCounter===document.querySelector('[data-session-live="amount"]'),text:liveCounter.textContent,opacity:[...liveCounter.querySelectorAll('.mined-counter-digit')].map(e=>getComputedStyle(e,'::after').opacity),exact:(MiningEngine.view(MiningClient.state,MiningClient.now()).rewardMining.accumulatedMicroCents/1000000/100).toFixed(5)}));
 assert(completed.same,'Completion retains digit nodes so their trace fades smoothly');assert.equal(completed.text,completed.exact);assert.deepEqual(completed.opacity,['0','0']);await live.close();
 console.log('Counter checked on 360 / 390 / 430 px: exact geometry, 100ms cadence, decimal carries, skipped digits, resume and fade. Real boosted session reaches the exact final amount and retains its counter through completion.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
