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
  await page.waitForSelector('.reference-session-panel');await page.waitForTimeout(1000);
  const report=await page.evaluate(()=>{
   const rect=e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height];},p=document.querySelector('.reference-session-panel'),b=p.querySelector('.session-control-button'),s=getComputedStyle(b);
   const geometry=Object.fromEntries(['.header','.session-total','.session-scene','.home-device-rig','.home-flight-layer','.bottom-nav','.reference-session-panel'].map(selector=>[selector,rect(document.querySelector(selector))]));
   const query=selector=>{const e=p.querySelector(selector),style=getComputedStyle(e);return {rect:rect(e),text:e.textContent,size:style.fontSize,color:style.color,background:style.backgroundColor};};
   return {geometry,button:{rect:rect(b),background:s.background,color:s.color,border:s.border,shadow:s.boxShadow},heading:query('.session-model-link'),tier:query('.session-reference-tier'),contract:query('.node-contract-control'),bonuses:query('.node-bonus-control'),reward:query('.session-reward-metric'),time:query('.session-time-metric'),progress:query('.session-control-progress'),icons:[...p.querySelectorAll('.node-card-icon svg')].map(rect),coin:rect(p.querySelector('.session-reward-coin')),labels:[...p.querySelectorAll('.session-control-metrics dt')].map(e=>({text:e.textContent,rect:rect(e),clip:getComputedStyle(e).clipPath})),counter:document.querySelector('[data-session-live="amount"]').textContent};
  });
  if(mode==='after'){
   const before=JSON.parse(fs.readFileSync(path.join(__dirname,'node-panel-layout-before.json'))).find(x=>x.width===width);
   for(const [selector,rect] of Object.entries(report.geometry))rect.forEach((v,i)=>assert(Math.abs(v-before.geometry[selector][i])<.12,selector+' geometry changed at '+width+': '+JSON.stringify(rect)+' vs '+JSON.stringify(before.geometry[selector])));
   for(const key of ['background','color','border','shadow'])assert.equal(report.button[key],before.button[key]);
   assert.equal(report.button.rect[2],before.button.rect[2]);assert.equal(report.button.rect[3],before.button.rect[3]);
   assert.equal(report.progress.rect[3],3);assert.equal(report.progress.background,'rgb(48, 58, 67)');
   assert.equal(report.progress.rect[0],report.button.rect[0]);assert.equal(report.progress.rect[2],report.button.rect[2]);
   assert(report.progress.rect[1]>=report.reward.rect[1]+report.reward.rect[3]);assert(report.progress.rect[1]>=report.time.rect[1]+report.time.rect[3]);
   assert.equal(report.heading.size,'18px');assert.equal(report.tier.size,'11px');assert.equal(report.contract.rect[3],38);assert.equal(report.bonuses.rect[3],38);
   for(const icon of report.icons){assert.equal(icon[2],18);assert.equal(icon[3],18);}assert.equal(report.coin[2],16);assert.equal(report.coin[3],16);
   assert(report.contract.text.includes('Contract'));assert(!report.contract.text.includes('CONTRACT'));assert.equal(report.bonuses.text,'Bonuses');
   assert.deepEqual(report.labels.map(x=>x.text),['Session reward','Time left']);for(const l of report.labels){assert.equal(l.clip,'none');assert(l.rect[3]>=12);}
   assert.equal(report.reward.rect[0],report.button.rect[0]);assert(Math.abs(report.time.rect[0]+report.time.rect[2]-report.button.rect[0]-report.button.rect[2])<.01);
   assert.equal(report.counter,'0.0000');assert(report.reward.text.includes('0.05 CR'));
   const boosts=await page.evaluate(()=>{
    const rect=e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height];},initial=rect(document.querySelector('.session-control-button'));
    const t=en=>en,loc=x=>Array.isArray(x)?x[0]:x,btn=(label,action,attrs='',css='')=>`<button class="${css}" data-action="${action}" ${attrs}>${label}</button>`;
    const now=Date.now(),v=MiningEngine.view(MiningEngine.initial(MiningConfig,now),now),ui=HomeUI.create({t,loc,btn,icon:()=>''});
    const results=[];
    for(const rewardCents of [20,35]){
     v.rewardMining.activeCount=1;v.rewardMining.status='active';v.rewardMining.offer.reason='available';v.rewardMining.offer.rewardCents=rewardCents;
     const host=document.createElement('div');host.innerHTML=ui.render(v);document.querySelector('.reference-session-panel').replaceWith(host.querySelector('.reference-session-panel'));
     const b=document.querySelector('.session-control-button'),title=b.querySelector('.free-mining-title'),subtitle=b.querySelector('.free-mining-subtitle'),ts=getComputedStyle(title),ss=getComputedStyle(subtitle);
     results.push({rewardCents,title:title.textContent,subtitle:subtitle.textContent,rect:rect(b),initial,titleSize:ts.fontSize,titleWeight:ts.fontWeight,titleColor:ts.color,subtitleSize:ss.fontSize,subtitleWeight:ss.fontWeight,subtitleColor:ss.color,gap:getComputedStyle(b.querySelector('.free-mining-copy')).gap,background:getComputedStyle(b).backgroundColor});
    }
    return results;
   });
   for(const b of boosts){assert.equal(b.title,'Boost mining');assert.equal(b.subtitle,'Watch ad · +'+(b.rewardCents/100).toFixed(2)+' CR');assert.deepEqual(b.rect,b.initial);assert.equal(b.titleSize,'16px');assert.equal(b.titleWeight,'500');assert.equal(b.titleColor,'rgb(17, 24, 32)');assert.equal(b.subtitleSize,'12px');assert.equal(b.subtitleWeight,'400');assert.equal(b.subtitleColor,'rgb(80, 89, 99)');assert.equal(b.gap,'3px');assert.equal(b.background,'rgb(230, 237, 240)');}
   report.boosts=boosts;
   await page.screenshot({path:path.join(__dirname,`node-panel-layout-${width}.png`)});
  }
  results.push({width,...report});await page.close();
 }
 fs.writeFileSync(path.join(__dirname,`node-panel-layout-${mode}.json`),JSON.stringify(results,null,2));console.log('Panel grid verified at 360/390/430px: footprint preserved, artwork and navigation fixed, button style retained, labels and full-width 3px progress aligned.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
