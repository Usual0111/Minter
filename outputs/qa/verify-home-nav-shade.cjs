const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../..'),mode=process.argv[2]||'before';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const result=[];
  for(const low of [false,true]){
   const page=await browser.newPage({viewport:{width:390,height:844}});
   await page.route('https://telegram.org/**',r=>r.abort());
   await page.goto('file:///'+root.replaceAll('\\','/')+'/index.html#/home',{waitUntil:'commit'});
   await page.waitForSelector('.bottom-nav');await page.waitForTimeout(1000);
   for(const tab of ['home','nodes']){
    await page.evaluate(tab=>location.hash='#/'+tab,tab);await page.waitForSelector('.'+tab+'-screen');await page.waitForTimeout(800);
    await page.evaluate(low=>document.body.classList.toggle('low-effects',low),low);
    const state=await page.locator('.bottom-nav').evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {rect:[r.x,r.y,r.width,r.height],background:s.background,items:[...e.querySelectorAll('.nav-item')].map(i=>{const r=i.getBoundingClientRect();return [r.x,r.y,r.width,r.height];})};});
    await page.locator('.bottom-nav').screenshot({path:path.join(__dirname,`home-nav-shade-${mode}-${tab}-${low?'low':'normal'}.png`)});
    result.push({tab,low,...state});
   }
   await page.close();
  }
  if(mode==='after'){
   const before=JSON.parse(fs.readFileSync(path.join(__dirname,'home-nav-shade-before.json')));
   for(const state of result){const old=before.find(x=>x.tab===state.tab&&x.low===state.low);assert.deepEqual(state.rect,old.rect);assert.deepEqual(state.items,old.items);if(state.tab==='nodes')assert.equal(state.background,old.background);}
   assert.equal(result.find(x=>x.tab==='home'&&!x.low).background,result.find(x=>x.tab==='home'&&x.low).background);
  }
  fs.writeFileSync(path.join(__dirname,`home-nav-shade-${mode}.json`),JSON.stringify(result,null,2));
  console.log('Navigation shade captured; geometry and Nodes styles preserved.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
