const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
for(const width of [360,390,430]){
 const p=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('https://telegram.org/**',r=>r.abort());
 await p.goto('file:///C:/Test%20AI%20Code/Bountera-Clean-20261001/'+(width===390?'outputs/Bountera.html':'public/index.html')+'#/home');
 await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(200);
 const result=await p.evaluate(()=>{
  const el=document.querySelector('[data-session-live="amount"]');
  const selector='.alien-yield,.alien-ufo-rig,.alien-planet,.alien-action,.bottom-nav';
  const geometry=()=>[...document.querySelectorAll(selector)].map(e=>e.getBoundingClientRect().toJSON());
  const before=geometry(),counter=HomeUI.createCounter({schedule:null});
  const values=['0.00000','0.11111','0.13873','0.55555','0.88888','0.99999','0.01010','0.00000'];
  const widths=values.map(v=>{counter.sample({accumulatedMicroCents:Math.round(Number(v)*1e8),unit:1e6,sessionId:'width-test',status:'idle'});return{value:el.textContent,width:el.getBoundingClientRect().width,x:el.getBoundingClientRect().x};});
  const path=getComputedStyle(document.querySelector('.alien-yield-frame path'));
  return{before,after:geometry(),widths,fill:path.fill,stroke:path.strokeWidth,shadow:getComputedStyle(el).textShadow,transform:getComputedStyle(el).transform};
 });
 assert.equal(result.fill,'none');assert.equal(result.stroke,'1.3px');assert.notEqual(result.shadow,'none');assert.equal(result.transform,'none');
 assert.deepEqual(result.before,result.after);
 assert(Math.max(...result.widths.map(x=>x.width))-Math.min(...result.widths.map(x=>x.width))<.05,JSON.stringify(result.widths));
 assert(Math.max(...result.widths.map(x=>x.x))-Math.min(...result.widths.map(x=>x.x))<.05);
 assert.deepEqual(errors,[]);
 await p.screenshot({path:'outputs/qa/yield-frame-'+width+'.png'});
 console.log(width+': transparent frame, 1.3px contour, fixed digit width '+result.widths[0].width+'px; other geometry unchanged.');await p.close();
}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
