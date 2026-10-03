const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../..');
const rect=e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height];};
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
 const results=[];
 for(const width of [360,390,430]){
  const page=await browser.newPage({viewport:{width,height:844}});
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};window.Telegram={WebApp:{safeAreaInset:{top:0},contentSafeAreaInset:{top:56},ready(){},expand(){},onEvent(){}}};});
  let entry='file:///'+root.replaceAll('\\','/')+'/index.html#/home';
  if(process.argv[2]==='before'){
   const base='file:///'+root.replaceAll('\\','/')+'/';
   let html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<head>','<head><base href="'+base+'">');
   for(const name of ['app.js','app.css','home-device-motion.js'])html=html.replace(new RegExp('assets/'+name.replace('.','\\.')+'(?:\\?v=[^"\']*)?','g'),base+'outputs/qa/device-lighting-before/'+name);
   fs.writeFileSync(path.join(__dirname,'device-lighting-baseline.html'),html);
   entry=base+'outputs/qa/device-lighting-baseline.html#/home';
  }
  await page.goto(entry);
  await page.waitForSelector('.home-device-layer');
  await page.waitForTimeout(1200);
  const geometry=await page.evaluate(()=>{
   const rect=e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height];};
   const img=document.querySelector('.home-device-layer');
   const r=rect(img),t=getComputedStyle(document.querySelector('.home-device-rig')||img).transform;
   const dy=t==='none'?0:new DOMMatrix(t).m42;r[1]-=dy;
   return {image:r,ui:Object.fromEntries(['.header','.bottom-nav','.reference-session-panel','.session-control-button','.session-total','.session-scene'].map(s=>[s,rect(document.querySelector(s))]))};
  });
  if(process.argv[2]==='after'){
   const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'device-lighting-before.json'))).find(x=>x.width===width);
   for(const key of ['image'])geometry[key].forEach((v,i)=>assert(Math.abs(v-baseline[key][i])<.01,`${width} ${key} coordinate ${i}`));
   for(const key of Object.keys(geometry.ui))geometry.ui[key].forEach((v,i)=>assert(Math.abs(v-baseline.ui[key][i])<.01,`${width} ${key} coordinate ${i}: ${v} vs ${baseline.ui[key][i]}`));
   await page.evaluate(()=>{
    let time=0,frames=[],quiet=false;
    const m=HomeDeviceMotion.create({now:()=>time,raf:fn=>{frames.push(fn);return 1;},caf:()=>{frames=[];},reduced:()=>quiet});
    const idle={status:'idle',sessionId:null,node:{image:'aurora-device-layer.png'},rate:{numerator:'0',denominator:'1'}};
    const active={...idle,status:'active',sessionId:'qa-session',rate:{numerator:'1',denominator:'1'}};
    const ready={...active,status:'ready',readySessionIds:['qa-session']};
    window.lightQA={m,idle,active,ready,setQuiet:()=>quiet=true,step(t){time=t;const run=frames;frames=[];run.forEach(f=>f(t));},sync:v=>m.sync(v),success:(...args)=>m.success(...args)};
    m.sync(idle);
   });
   const geometryFrames=await page.evaluate(()=>{
    const q=lightQA,rect=e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height];},img=document.querySelector('.home-device-layer'),svg=document.querySelector('.home-device-lights'),rig=document.querySelector('.home-device-rig');
    q.success('rewardAdConfirm',q.idle,q.active,{eventId:'qa-geometry-start'});
    let previous=rect(img)[1],maxJump=0,maxOffset=0;
    for(let t=0;t<=8100;t+=10){q.step(t);const a=rect(img),b=rect(svg);maxOffset=Math.max(maxOffset,...a.map((v,i)=>Math.abs(v-b[i])));maxJump=Math.max(maxJump,Math.abs(a[1]-previous));previous=a[1];}
    const shapes=[...svg.querySelectorAll('.craft-long-light,.craft-short-light')].map(p=>{const b=p.getBBox();return [b.x,b.y,b.width,b.height];});
    return {maxJump,maxOffset,shapes,rigOverflow:getComputedStyle(rig).overflow,svgOverflow:getComputedStyle(svg).overflow,imgFilter:getComputedStyle(img).filter,imgOpacity:getComputedStyle(img).opacity,imgTransform:getComputedStyle(img).transform,src:img.getAttribute('src')};
   });
   assert(geometryFrames.maxOffset<.001);assert(geometryFrames.maxJump<.12);assert.equal(geometryFrames.rigOverflow,'visible');assert.equal(geometryFrames.svgOverflow,'visible');assert.equal(geometryFrames.imgFilter,'none');assert.equal(geometryFrames.imgOpacity,'1');assert.equal(geometryFrames.imgTransform,'none');assert(geometryFrames.src.endsWith('aurora-device-layer-lights-off.png'));
   geometryFrames.shapes.forEach(([x,y,w,h])=>{assert(x>6&&y>6&&x+w+6<1536&&y+h+6<1024);assert(x+w<240||x>380||y+h<755||y>895);});
   await page.evaluate(()=>{lightQA.sync(lightQA.idle);lightQA.step(9000);});
   await page.addStyleTag({content:'.home-device-rig{transform:none!important}'});
   const samples=[];
   for(const state of ['idle','start','active','pulse','boost','ready','claim','collected']){
    const sample=await page.evaluate(state=>{
     const q=lightQA;
     if(state==='start'){q.success('rewardFreeStart',q.idle,q.active,{freeStarted:true,sessionId:'qa-2'});q.step(9300);}
     if(state==='active')q.step(10100);
     if(state==='pulse'){q.step(15000);q.step(15400);}
     if(state==='boost'){q.success('rewardAdConfirm',q.active,{...q.active,rate:{numerator:'2',denominator:'1'}},{eventId:'qa-boost'});q.step(15750);}
     if(state==='ready'){q.sync(q.ready);q.step(17000);}
     if(state==='claim'){q.success('rewardClaim',q.ready,q.idle,{credited:5,sessionIds:['qa-session']});q.step(17400);}
     if(state==='collected')q.step(18000);
     return {state,long:+document.querySelector('.craft-long-light').style.opacity,coreColor:getComputedStyle(document.querySelector('.craft-long-light')).fill,pulseColor:getComputedStyle(document.querySelector('.craft-pulse-slice')).stroke,blend:getComputedStyle(document.querySelector('.home-device-lights')).mixBlendMode,short:[...document.querySelectorAll('.craft-short-light')].map(e=>+e.style.opacity),moving:+document.querySelector('.craft-travelling-light').style.opacity};
    },state);
    await page.locator('.home-device-rig').screenshot({path:path.join(__dirname,`device-ice-${width}-${state}.png`)});
    if(state==='active')await page.screenshot({path:path.join(__dirname,`device-ice-${width}.png`)});
    assert.equal(sample.coreColor,'rgb(169, 204, 216)');assert.equal(sample.pulseColor,'rgb(216, 235, 241)');assert.equal(sample.blend,'normal');samples.push(sample);
   }
   assert.equal(samples[0].long,0);assert(samples.find(s=>s.state==='start').long>.9);assert.equal(samples.find(s=>s.state==='active').long,.68);assert(samples.find(s=>s.state==='pulse').short.every(n=>n===.68));assert(samples.find(s=>s.state==='pulse').moving>.9);assert(samples.find(s=>s.state==='boost').moving>.9);assert.equal(samples.find(s=>s.state==='ready').long,.64);assert(samples.find(s=>s.state==='claim').moving>.9);assert.equal(samples.at(-1).long,0);
   geometry.motion=geometryFrames;geometry.states=samples;
  }
  results.push({width,...geometry});
  await page.close();
 }
 fs.writeFileSync(path.join(__dirname,'device-ice-'+(process.argv[2]||'before')+'.json'),JSON.stringify(results,null,2));
 } finally { await browser.close(); }
 console.log("Ice lighting checked on 360, 390 and 430px; geometry, timing and motion unchanged.");
})().catch(e=>{console.error(e);process.exitCode=1;});
