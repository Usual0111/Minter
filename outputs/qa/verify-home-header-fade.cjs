const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../..'),mode=process.argv[2]||'before';
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
 const results=[];
 for(const width of [360,390,430]){
  const page=await browser.newPage({viewport:{width,height:844}});
  await page.route('https://telegram.org/**',r=>r.abort());
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.setInterval=()=>1;});
  await page.goto('file:///'+root.replaceAll('\\','/')+'/index.html#/home',{waitUntil:'commit'});
  await page.waitForSelector('.home-balance-badge');await page.waitForTimeout(1000);
  const report=await page.evaluate(()=>{
   const rect=e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height];};
   const title=document.querySelector('.galaxy-selector span'),badge=document.querySelector('.home-balance-badge'),wallet=document.querySelector('.session-wallet'),s=getComputedStyle(title),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font=s.font;
   const tm=ctx.measureText(title.textContent),r=title.getBoundingClientRect();
   const glyphTop=r.y+(parseFloat(s.lineHeight)-tm.fontBoundingBoxAscent-tm.fontBoundingBoxDescent)/2+tm.fontBoundingBoxAscent-tm.actualBoundingBoxAscent;
   const app=document.querySelector('.home-screen'),bg=getComputedStyle(app,':before');
   return {geometry:Object.fromEntries(['.header','.galaxy-selector','.session-wallet','.session-total','.session-scene','.home-device-rig','.home-device-layer','.home-device-lights','.home-flight-layer','.home-hologram-layer','.reference-session-panel','.session-control-button','.bottom-nav'].map(sel=>[sel,rect(document.querySelector(sel))])),badge:rect(badge),icon:rect(badge.querySelector('svg')),value:rect(badge.querySelector('.home-balance-value')),title:rect(title),glyphTop,wallet:rect(wallet),glyphOffset:glyphTop-wallet.getBoundingClientRect().y,background:{image:bg.backgroundImage,position:bg.backgroundPosition,size:bg.backgroundSize,top:bg.top,height:bg.height,mask:bg.maskImage},balance:badge.textContent,counter:document.querySelector('[data-session-live="amount"]').textContent,appWidth:app.getBoundingClientRect().width};
  });
  if(mode==='after'){
   const before=JSON.parse(fs.readFileSync(path.join(__dirname,'home-header-fade-before.json'))).find(x=>x.width===width);
   assert.deepEqual(report.geometry,before.geometry);
   for(const key of ['image','position','size','top','height'])assert.equal(report.background[key],before.background[key]);
   assert.equal(report.balance,before.balance);assert.equal(report.counter,before.counter);
   assert(Math.abs(report.badge[0]+report.badge[2]-before.badge[0]-before.badge[2])<.01);
   for(const prop of ['badge','icon','value'])for(const i of [2,3])assert(Math.abs(report[prop][i]/before[prop][i]-1.09)<.001);
   assert(Math.abs(report.badge[1]-report.glyphTop)<.8,JSON.stringify({width,badge:report.badge,glyphTop:report.glyphTop,wallet:report.wallet}));assert(report.background.mask.includes('linear-gradient'));
  }
  results.push({width,...report});await page.screenshot({path:path.join(__dirname,`home-header-fade-${mode}-${width}.png`)});await page.close();
 }
 fs.writeFileSync(path.join(__dirname,`home-header-fade-${mode}.json`),JSON.stringify(results,null,2));console.log(results.map(x=>({width:x.width,glyphOffset:x.glyphOffset,badge:x.badge,glyphTop:x.glyphTop,mask:x.background.mask})));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
