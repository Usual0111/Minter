const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../..');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const results=[];
  for(const width of [360,390,430]){
   const page=await browser.newPage({viewport:{width,height:844}});
   await page.route('https://telegram.org/**',route=>route.abort());
   await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};window.Telegram={WebApp:{safeAreaInset:{top:0},contentSafeAreaInset:{top:56},ready(){},expand(){},onEvent(){}}};});
   await page.goto('file:///'+root.replaceAll('\\','/')+'/index.html#/home',{waitUntil:'commit'});
   await page.waitForSelector('.home-device-rig');await page.waitForTimeout(1200);
   const report=await page.evaluate(()=>{
    let time=0,frames=[],quiet=false;
    const rig=document.querySelector('.home-device-rig'),image=document.querySelector('.home-device-layer'),svg=document.querySelector('.home-device-lights');
    const selectors=['.header','.bottom-nav','.reference-session-panel','.session-control-button','.session-total','.session-scene'];
    const rect=e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height];};
    const ui=()=>Object.fromEntries(selectors.map(s=>[s,rect(document.querySelector(s))]));
    const m=HomeDeviceMotion.create({now:()=>time,raf:f=>{frames.push(f);return 1;},caf:()=>{frames=[];},reduced:()=>quiet});
    const active={status:'active',sessionId:'qa-zoom',node:{image:'aurora-device-layer.png'},rate:{numerator:'1',denominator:'1'}},faster={...active,rate:{numerator:'2',denominator:'1'}};
    const step=t=>{time=t;const run=frames;frames=[];run.forEach(f=>f(t));};
    m.sync(active);step(1000);const initial=rect(image),beforeUI=ui(),beforeSize=[rig.offsetWidth,rig.offsetHeight];
    m.success('rewardAdConfirm',active,faster,{eventId:'qa-zoom-boost'});
    let maxOffset=0,maxScale=1,maxY=0;const samples=[];
    for(let ms=0;ms<=1200;ms+=10){
     step(1000+ms);const a=rect(image),b=rect(svg),matrix=new DOMMatrix(getComputedStyle(rig).transform);
     maxOffset=Math.max(maxOffset,...a.map((v,i)=>Math.abs(v-b[i])));maxScale=Math.max(maxScale,matrix.m11);maxY=Math.max(maxY,Math.abs(matrix.m42));
     if([0,100,275,450,775,1100,1200].includes(ms))samples.push({ms,scale:matrix.m11,translateY:matrix.m42,image:a,mask:b,ui:ui(),pulse:+document.querySelector('.craft-travelling-light').style.opacity});
    }
    const afterSize=[rig.offsetWidth,rig.offsetHeight],afterUI=ui();
    quiet=true;m.success('rewardAdConfirm',faster,{...faster,rate:{numerator:'3',denominator:'1'}},{eventId:'qa-quiet'});step(2650);
    const reducedMatrix=new DOMMatrix(getComputedStyle(rig).transform);
    quiet=false;m.destroy();
    window.zoomQA={m,active,faster,step,setTime:t=>time=t};
    return {initial,beforeUI,afterUI,beforeSize,afterSize,maxOffset,maxScale,maxY,samples,reducedScale:reducedMatrix.m11,reducedY:reducedMatrix.m42,origin:getComputedStyle(rig).transformOrigin,filter:getComputedStyle(image).filter,opacity:getComputedStyle(image).opacity};
   });
   assert(report.maxOffset<.001);assert.equal(report.maxScale,1.012);assert(report.maxY<=2.0001);assert.deepEqual(report.beforeUI,report.afterUI);assert.deepEqual(report.beforeSize,report.afterSize);assert.equal(report.reducedScale,1);assert.equal(report.reducedY,0);assert.equal(report.filter,'none');assert.equal(report.opacity,'1');
   for(const s of report.samples){assert.deepEqual(s.ui,report.beforeUI);if(s.ms<=100||s.ms>=1100)assert.equal(s.scale,1);}
   const peak=report.samples.find(s=>s.ms===450);assert(Math.abs(peak.image[2]/report.initial[2]-1.012)<.00001);
   // Restore the peak of an isolated confirmed boost for visual inspection.
   await page.evaluate(()=>{
    const q=zoomQA;q.setTime(4000);q.m.sync(q.active);q.m.success('rewardAdConfirm',q.active,q.faster,{eventId:'qa-screenshot'});q.step(4450);
   });
   await page.screenshot({path:path.join(__dirname,`device-zoom-${width}.png`)});
   results.push({width,...report});await page.close();
  }
  fs.writeFileSync(path.join(__dirname,'device-zoom-verification.json'),JSON.stringify(results,null,2));
  console.log('Microzoom verified at 360/390/430px: peak 1.012 at 450ms; normal size by 1100ms; masks synchronized; layout fixed; reduced motion disables zoom.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
