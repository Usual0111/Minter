const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../..'),mode=process.argv[2]||'before';
async function snapshot(page){return page.evaluate(()=>{
 const app=document.querySelector('#app>.app'),rect=e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height];};
 const elements=[...app.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height;}).map((e,i)=>({index:i,tag:e.tagName,classes:e.getAttribute('class')||'',action:e.dataset.action||'',inNav:!!e.closest('.bottom-nav'),inHeader:!!e.closest('.header,.nodes-header'),rect:rect(e),text:e.children.length?'':e.textContent,style:{font:getComputedStyle(e).fontSize,color:getComputedStyle(e).color}}));
 const bg=getComputedStyle(app,':before');return {app:rect(app),elements,background:{image:bg.backgroundImage,position:bg.backgroundPosition,size:bg.backgroundSize,height:bg.height,top:bg.top,mask:bg.maskImage},scroll:{top:document.getElementById('app').scrollTop,window:scrollY}};
});}
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
 const results=[];
 for(const width of [360,390,430])for(const telegram of [false,true]){
  const page=await browser.newPage({viewport:{width,height:844}});
  await page.route('https://telegram.org/**',r=>r.abort());
  await page.addInitScript(telegram=>{
   window.requestAnimationFrame=()=>1;window.setInterval=()=>1;
   if(telegram){const events={};window.tmaEvents=events;window.Telegram={WebApp:{viewportHeight:844,viewportStableHeight:844,safeAreaInset:{top:47,bottom:34,left:0,right:0},contentSafeAreaInset:{top:56,bottom:0,left:0,right:0},isFullscreen:true,ready(){},expand(){},onEvent:(n,f)=>events[n]=f}};}
  },telegram);
  const entry=mode==='before'?'/outputs/qa/tma-viewport-before/reference.html':'/index.html';
  await page.goto('file:///'+root.replaceAll('\\','/')+entry+'#/home',{waitUntil:'commit'});
  await page.waitForSelector('.reference-session-panel');await page.waitForTimeout(350);
  for(const route of ['home','nodes','tasks','friends','wallet']){
   await page.evaluate(route=>{location.hash='#/'+route;},route);await page.waitForTimeout(350);await page.evaluate(()=>document.getAnimations().forEach(a=>a.finish()));
   const baseline=await snapshot(page);
   if(mode==='after'){
    const old=JSON.parse(fs.readFileSync(path.join(__dirname,'tma-layout-before.json'))).find(x=>x.width===width&&x.telegram===telegram&&x.route===route);
    assert.equal(baseline.elements.length,old.baseline.elements.length);
    for(let i=0;i<baseline.elements.length;i++){const e=baseline.elements[i],b=old.baseline.elements[i];assert.equal(e.text,b.text);assert.deepEqual(e.style,b.style);if(telegram&&e.inNav)continue;e.rect.forEach((v,j)=>{if(e.classes==='home-flight-layer'&&j===3)return;assert(Math.abs(v-b.rect[j])<.15,route+' initial '+JSON.stringify({width,telegram,tag:e.tag,classes:e.classes,rect:e.rect,old:b.rect}));});}
    for(const key of ['image','position','size','top','mask'])assert.equal(baseline.background[key],old.baseline.background[key]);if(baseline.background.height!==old.baseline.background.height)assert(Math.abs(parseFloat(baseline.background.height)-parseFloat(old.baseline.background.height))<.1);
    if(telegram){
     await page.evaluate(()=>{const tg=Telegram.WebApp;tg.safeAreaInset={top:59,bottom:46,left:4,right:4};tg.contentSafeAreaInset={top:64,bottom:10,left:2,right:2};tmaEvents.safeAreaChanged();tmaEvents.contentSafeAreaChanged();});
     const changed=await snapshot(page);
     for(let i=0;i<baseline.elements.length;i++){const e=changed.elements[i],b=baseline.elements[i];if(e.inNav)continue;for(let j=0;j<4;j++){if(e.classes==='home-flight-layer'&&j===3)continue;assert(Math.abs(e.rect[j]-b.rect[j]-(j===1?20:0))<.15,route+' coherent inset update '+e.classes);}assert.equal(e.text,b.text);}
     for(const prop of ['image','position','size','height','mask'])assert.equal(changed.background[prop],baseline.background[prop]);if(route==='home')assert.equal(parseFloat(changed.background.top)-parseFloat(baseline.background.top),20);
     await page.evaluate(()=>{const tg=Telegram.WebApp;tg.viewportHeight=650;tg.viewportStableHeight=844;tmaEvents.viewportChanged({isStateStable:false});});
     const moving=await snapshot(page);for(let i=0;i<changed.elements.length;i++)assert.deepEqual(moving.elements[i].rect,changed.elements[i].rect,route+' transient viewport');
     await page.evaluate(()=>{Telegram.WebApp.viewportStableHeight=650;tmaEvents.viewportChanged({isStateStable:true});});
     const shorter=await snapshot(page);for(let i=0;i<changed.elements.length;i++){const e=shorter.elements[i];if(e.inNav)continue;assert.deepEqual(e.rect,changed.elements[i].rect,route+' stable viewport');}
     const nav=await page.locator('.bottom-nav').boundingBox();assert.equal(nav.y+nav.height,650);
     const scrolling=await page.evaluate(()=>{const scroller=document.getElementById('app');scroller.scrollTo({top:10000,behavior:'instant'});return {top:scroller.scrollTop,height:scroller.clientHeight,total:scroller.scrollHeight};});assert(scrolling.top>0&&scrolling.total>scrolling.height);await page.evaluate(()=>document.getElementById('app').scrollTo({top:0,behavior:'instant'}));
     if(route==='home'){
      await page.locator('[data-action="homeContract"]').click();await page.waitForTimeout(250);await page.evaluate(()=>document.getAnimations().forEach(a=>a.finish()));
      const sheet=await page.locator('.modal-box').boundingBox();assert(sheet.y>=123&&sheet.y+sheet.height<=594.1,'Sheet must fit current Telegram viewport');await page.locator('[data-action="close"]').click();await page.waitForTimeout(150);await page.evaluate(()=>document.getElementById('app').scrollTo({top:0,behavior:'instant'}));
     }
     const relativeBefore=await snapshot(page);
     await page.setViewportSize({width,height:650});await page.waitForTimeout(100);
     const resized=await snapshot(page);for(let i=0;i<relativeBefore.elements.length;i++){const e=resized.elements[i];if(e.inNav)continue;assert.deepEqual(e.rect,relativeBefore.elements[i].rect,route+' physical resize keeps composition');}
     await page.setViewportSize({width,height:844});await page.waitForTimeout(100);
     await page.evaluate(()=>{const tg=Telegram.WebApp;tg.safeAreaInset={top:47,bottom:34,left:0,right:0};tg.contentSafeAreaInset={top:56,bottom:0,left:0,right:0};tg.viewportHeight=tg.viewportStableHeight=844;tmaEvents.safeAreaChanged();tmaEvents.contentSafeAreaChanged();tmaEvents.viewportChanged({isStateStable:true});});
    }
   }
   results.push({width,telegram,route,baseline});
   if(route==='home'||route==='nodes')await page.screenshot({path:path.join(__dirname,`tma-layout-${mode}-${route}-${width}-${telegram?'telegram':'local'}.png`)});
  }
  await page.close();
 }
 fs.writeFileSync(path.join(__dirname,`tma-layout-${mode}.json`),JSON.stringify(results,null,2));console.log('All visible element positions and text captured on five screens, three widths, local and Telegram viewports.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
