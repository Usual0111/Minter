const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../..'),mode=process.argv[2]||'before';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const results=[];
  for(const width of [360,390,430]){
   const page=await browser.newPage({viewport:{width,height:844}});
   await page.route('https://telegram.org/**',r=>r.abort());
   await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.setInterval=()=>1;});
   await page.goto('file:///'+root.replaceAll('\\','/')+'/index.html#/home',{waitUntil:'commit'});
   await page.waitForSelector('.reference-session-panel');await page.waitForTimeout(1000);
   const geometry=await page.evaluate(()=>{
    const rect=e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height];};
    return Object.fromEntries(['.header','.session-total','.session-scene','.home-device-rig','.home-flight-layer','.bottom-nav','.reference-session-panel'].map(s=>[s,rect(document.querySelector(s))]));
   });
   if(mode==='after'){
    const before=JSON.parse(fs.readFileSync(path.join(__dirname,'light-home-panel-before.json'))).find(x=>x.width===width);
    for(const [selector,rect] of Object.entries(geometry))if(selector!=='.reference-session-panel')assert.deepEqual(rect,before.geometry[selector],selector);
    assert.deepEqual(geometry['.reference-session-panel'].slice(0,3),before.geometry['.reference-session-panel'].slice(0,3));
    const states=await page.evaluate(()=>{
     const t=en=>en,loc=x=>Array.isArray(x)?x[0]:x,btn=(label,action,attrs='',css='')=>`<button class="${css}" data-action="${action}" ${attrs}>${label}</button>`;
     const now=Date.UTC(2026,9,4,12),E=MiningEngine;
     let state=E.apply(E.initial(MiningConfig,now),'refresh',{},now,'qa-refresh').state;
     let view=E.view(state,now);const ui=HomeUI.create({t,loc,btn,icon:()=>'',view:()=>view});
     const replace=v=>{view=v;const host=document.createElement('div');host.innerHTML=ui.render(v);document.querySelector('.reference-session-panel').replaceWith(host.querySelector('.reference-session-panel'));};
     const check=label=>{const p=document.querySelector('.reference-session-panel'),b=p.querySelector('.session-control-button'),s=getComputedStyle(b),progress=p.querySelector('.session-control-progress'),fill=progress.firstElementChild;return {label,text:b.textContent,disabled:b.disabled,background:s.backgroundColor,backgroundImage:s.backgroundImage,shadow:s.boxShadow,border:s.borderWidth,before:getComputedStyle(b,':before').content,progressChildren:progress.children.length,progressHeight:progress.getBoundingClientRect().height,progressFill:fill.style.transform,bonuses:p.querySelector('.node-bonus-control').textContent,panelBackground:getComputedStyle(p).backgroundColor};};
     const out=[];replace(view);out.push(check('free'));
     const initialPanel=document.querySelector('.reference-session-panel'),reward=document.querySelector('[data-session-live="ready"]'),row=document.querySelector('.session-mining-row'),rowRect=row.getBoundingClientRect(),rewardStyle=getComputedStyle(reward),timeStyle=getComputedStyle(document.querySelector('[data-session-live="time"]'));
     if(reward.textContent!=='0.05 CR'||document.querySelector('[data-session-live="amount"]').textContent!=='0.0000')throw new Error('Free reward preview must not appear as mined');
     ui.tick(E.view(state,now+1000));if(reward.textContent!=='0.05 CR')throw new Error('Live tick lost the free reward preview');
     const coin=initialPanel.querySelector('.session-reward-coin'),largeCoin=document.querySelector('.reference-total img'),coinStyle=getComputedStyle(coin),valueStyle=getComputedStyle(initialPanel.querySelector('.session-reward-value'));
     if(coin.src!==largeCoin.src||coinStyle.width!=='18px'||coinStyle.height!=='18px'||coinStyle.filter!=='none'||valueStyle.gap!=='6px')throw new Error('Gold coin source or dimensions mismatch');
     if(rewardStyle.fontSize!==timeStyle.fontSize||rewardStyle.fontVariantNumeric!=='tabular-nums'||timeStyle.fontVariantNumeric!=='tabular-nums')throw new Error('Reward and timer typography mismatch');
     const timerRect=document.querySelector('[data-session-live="time"]').getBoundingClientRect();if(reward.getBoundingClientRect().x>=timerRect.x)throw new Error('Reward should remain on the left');
     window.rowBefore=rowRect.toJSON();
     state=E.apply(state,'rewardFreeStart',view.rewardMining.freeSession,now,'qa-free').state;
     view=E.view(state,now+300000);const activeView=view;replace(view);out.push(check('active'));
     ui.tick(E.view(state,now+360000));out.push(check('tick'));
     const cooldown=structuredClone(view);cooldown.rewardMining.offer.reason='cooldown';cooldown.rewardMining.offer.nextAt=cooldown.rewardMining.serverNow+39000;replace(cooldown);out.push(check('cooldown'));
     replace(E.view(state,now+600000));out.push(check('ready'));
     replace(activeView);window.panelPreview={replace,view:activeView,cooldown,ui};return out;
    });
    for(const s of states){assert.equal(s.backgroundImage,'none');assert.equal(s.shadow,'none');assert.equal(s.before,'none');assert.equal(s.progressChildren,1);assert.equal(s.progressHeight,4);assert.equal(s.bonuses,'Bonuses');assert.equal(s.panelBackground,'rgba(21, 28, 35, 0.97)');}
    assert.equal(states.find(x=>x.label==='cooldown').background,'rgb(37, 46, 55)');assert(states.find(x=>x.label==='cooldown').disabled);
    for(const label of ['free','active','ready'])assert.equal(states.find(x=>x.label===label).background,'rgb(230, 237, 240)');
    assert.equal(states.find(x=>x.label==='tick').progressFill,'scaleX(0.6)');assert.equal(states.find(x=>x.label==='ready').progressFill,'scaleX(1)');
    results.push({width,geometry,states});
    await page.screenshot({path:path.join(__dirname,`light-home-panel-${width}.png`)});
    await page.evaluate(()=>panelPreview.replace(panelPreview.cooldown));
    await page.locator('.reference-session-panel').screenshot({path:path.join(__dirname,`light-home-panel-cooldown-${width}.png`)});
   }else results.push({width,geometry});
   await page.close();
  }
  fs.writeFileSync(path.join(__dirname,`light-home-panel-${mode}.json`),JSON.stringify(results,null,2));
  console.log('Home panel checked at 360/390/430px; artwork, header, counter and navigation stay fixed; free, active, cooldown and ready states checked.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
