const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,channel:'chrome'});try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('https://telegram.org/**',r=>r.abort());
 await page.addInitScript(()=>{const events={};window.tmaEvents=events;window.requestAnimationFrame=()=>1;window.setInterval=()=>1;window.Telegram={WebApp:{viewportHeight:844,viewportStableHeight:844,safeAreaInset:{top:47,bottom:34,left:0,right:0},contentSafeAreaInset:{top:56,bottom:0,left:0,right:0},isFullscreen:true,ready(){},expand(){},onEvent:(n,f)=>events[n]=f}};});
 await page.goto('file:///'+path.resolve(__dirname,'../Bountera.html').replaceAll('\\','/')+'#/home',{waitUntil:'commit'});await page.waitForSelector('.reference-session-panel',{timeout:20000});await page.waitForTimeout(1000);await page.evaluate(()=>document.getAnimations().forEach(a=>a.finish()));
 const result=await page.evaluate(()=>{
  const selectors=['.home-device-rig','.home-device-layer','.home-device-lights','.session-total','.reference-session-panel'],rects=()=>selectors.map(s=>{const r=document.querySelector(s).getBoundingClientRect();return [r.x,r.y,r.width,r.height];}),before=rects();
  const tg=Telegram.WebApp;tg.safeAreaInset.top=59;tg.contentSafeAreaInset.top=64;tmaEvents.contentSafeAreaChanged();const moved=rects();
  tg.viewportHeight=tg.viewportStableHeight=650;tmaEvents.viewportChanged({isStateStable:true});const short=rects(),scroller=document.getElementById('app'),nav=document.querySelector('.bottom-nav').getBoundingClientRect();
  return {before,moved,short,height:scroller.clientHeight,scrollable:scroller.scrollHeight>scroller.clientHeight,navBottom:nav.bottom,module:typeof TelegramViewport,active:document.documentElement.classList.contains('tma-viewport')};
 });
 assert.equal(result.module,'object');assert(result.active);assert.equal(result.height,650);assert(result.scrollable);assert.equal(result.navBottom,650);assert.deepEqual(result.short,result.moved);
 for(let i=0;i<result.before.length;i++)for(let j=0;j<4;j++)assert(Math.abs(result.moved[i][j]-result.before[i][j]-(j===1?20:0))<.1);
 assert.deepEqual(errors,[]);console.log('Packaged HTML: Telegram viewport active, all Home elements move together, height 650px scrollable, safe navigation visible, no page errors.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
