const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../..'),mode=process.argv[2]||'before',packaged=process.argv.includes('--package');
const file=path.join(__dirname,'header-anchors-'+mode+(packaged?'-package':'')+'.json');
async function read(page){return page.evaluate(()=>{
 const app=document.querySelector('#app>.app'),rect=e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height];};
 const visible=e=>{const s=getComputedStyle(e);return s.visibility!=='hidden'&&e.getBoundingClientRect().height;};
 const elements=[...app.querySelectorAll('*')].filter(e=>!e.closest('.header,.nodes-header')&&visible(e)).map(e=>({tag:e.tagName,classes:e.className.baseVal??e.className,inNav:!!e.closest('.bottom-nav'),text:e.children.length?'':e.textContent,rect:rect(e),font:getComputedStyle(e).fontSize,color:getComputedStyle(e).color}));
 const badge=app.querySelector('.home-balance-badge,.nodes-balance'),s=getComputedStyle(badge),bg=getComputedStyle(app,':before');
 const badgeStyle=Object.fromEntries(['backgroundImage','backgroundColor','color','borderColor','boxShadow'].map(k=>[k,s[k]]));
 return {elements,badge:rect(badge),badgeStyle,icon:rect(badge.querySelector('svg')),title:app.querySelector('.galaxy-selector')?rect(app.querySelector('.galaxy-selector')):null,background:Object.fromEntries(['backgroundImage','backgroundPosition','backgroundSize','maskImage','height','top'].map(k=>[k,bg[k]]))};
 });}
function close(a,b,label){assert(Math.abs(a-b)<.15,label+': '+a+' vs '+b);}
function unchanged(a,b){assert.equal(a.elements.length,b.elements.length);a.elements.forEach((e,i)=>{const old=b.elements[i];assert.equal(e.text,old.text);assert.equal(e.font,old.font);assert.equal(e.color,old.color);e.rect.forEach((v,j)=>close(v,old.rect[j],e.classes));});const normalize=bg=>({...bg,backgroundImage:bg.backgroundImage.replace(/url\("[^\"]*"\)/g,'url("embedded-or-source-artwork")')});assert.deepEqual(normalize(a.background),normalize(b.background));}
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
 const out=[],old=mode==='after'?JSON.parse(fs.readFileSync(path.join(__dirname,'header-anchors-before.json'))):[];
 for(const width of [360,390,430])for(const telegram of [false,true]){
  const page=await browser.newPage({viewport:{width,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://telegram.org/**',r=>r.abort());
  await page.addInitScript(telegram=>{window.requestAnimationFrame=()=>1;window.setInterval=()=>1;if(telegram){const events={};window.tmaEvents=events;window.Telegram={WebApp:{viewportHeight:844,viewportStableHeight:844,safeAreaInset:{top:47,bottom:34,left:0,right:0},contentSafeAreaInset:{top:56,bottom:0,left:0,right:0},isFullscreen:true,ready(){},expand(){},onEvent:(n,f)=>events[n]=f}};}},telegram);
  await page.goto('file:///'+root.replaceAll('\\','/')+(packaged?'/outputs/Bountera.html':'/index.html')+'#/home',{waitUntil:'commit'});await page.waitForSelector('.reference-session-panel');
  const scenes={};
  for(const route of ['home','nodes']){
   await page.evaluate(route=>location.hash='#/'+route,route);await page.waitForTimeout(350);await page.evaluate(()=>document.getAnimations().forEach(a=>a.finish()));
   const baseline=await read(page);scenes[route]=baseline;out.push({width,telegram,route,baseline});
   if(mode==='after'){
    const before=old.find(x=>x.width===width&&x.telegram===telegram&&x.route===route).baseline;unchanged(baseline,before);
    if(route==='home'){baseline.badge.forEach((v,j)=>close(v,before.badge[j],'Home badge preserved'));assert.deepEqual(baseline.badgeStyle,before.badgeStyle);}
    else {baseline.badge.forEach((v,j)=>close(v,j===1?before.badge[j]:scenes.home.badge[j],'Nodes oval geometry / current header position'));close(baseline.icon[2],scenes.home.icon[2],'Nodes matches Home coin width');close(baseline.icon[3],scenes.home.icon[3],'Nodes matches Home coin height');assert.deepEqual(baseline.badgeStyle,before.badgeStyle);}
    if(telegram){
     for(const contentTop of [32,0,64,56]){
      await page.evaluate(top=>{Telegram.WebApp.contentSafeAreaInset.top=top;tmaEvents.contentSafeAreaChanged();},contentTop);
      const shifted=await read(page),delta=route==='home'?Math.max(56,contentTop)-56:contentTop-56,lift=Math.min(0,contentTop-56);
      close(shifted.badge[1]-baseline.badge[1],delta+(route==='home'?lift:0),'Header only lifts relative to composition');
      close(shifted.badge[0],baseline.badge[0],'Badge right inset');close(shifted.badge[2],baseline.badge[2],'Badge width');close(shifted.badge[3],baseline.badge[3],'Badge height');
      assert(shifted.badge[1]>=47+contentTop,'Badge respects Telegram upper safe boundary');
      if(route==='home'){close(shifted.title[1]-baseline.title[1],delta+lift,'Title and balance move together');assert(shifted.title[1]>=47+contentTop);}
      shifted.elements.forEach((e,i)=>e.rect.forEach((v,j)=>{if(e.classes==='home-flight-layer'&&j===3)return;close(v,baseline.elements[i].rect[j]+(j===1&&!e.inNav?delta:0),e.classes);}));
     }
     await page.evaluate(()=>{Telegram.WebApp.viewportHeight=Telegram.WebApp.viewportStableHeight=650;tmaEvents.viewportChanged({isStateStable:true});});
     const shorter=await read(page);shorter.badge.forEach((v,j)=>close(v,baseline.badge[j],'Height change keeps header'));const nav=await page.locator('.bottom-nav').boundingBox();close(nav.y+nav.height,650,'Safe bottom navigation');
     assert(await page.evaluate(()=>{const a=document.getElementById('app');a.scrollTop=10000;return a.scrollTop>0;}),'Short viewport scrolls');
     await page.evaluate(()=>{document.getElementById('app').scrollTop=0;Telegram.WebApp.viewportHeight=Telegram.WebApp.viewportStableHeight=844;tmaEvents.viewportChanged({isStateStable:true});});
    }
   }
   await page.screenshot({path:path.join(__dirname,`header-anchors-${mode}-${route}-${width}-${telegram?'telegram':'local'}${packaged?'-package':''}.png`)});
  }
  assert.deepEqual(errors,[]);await page.close();
 }
 fs.writeFileSync(file,JSON.stringify(out,null,2));console.log('Checked Home header anchors, Nodes badge, unchanged composition and scrolling on 360 / 390 / 430 px.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
