const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../..'),file=path.join(root,'outputs/Bountera.html'),html=fs.readFileSync(file,'utf8'),image='data:image/png;base64,'+fs.readFileSync(path.join(root,'assets/aurora-device-layer-lights-off.png')).toString('base64');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];scripts.forEach((s,i)=>new vm.Script(s[1],{filename:'inline-'+i}));assert(!/<script[^>]+src=["']assets\//.test(html));assert(html.includes(image));
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file:///'+file.replaceAll('\\','/')+'#/home');
  await page.waitForSelector('.home-device-rig');
  assert.equal(await page.locator('.home-device-layer').getAttribute('src'),image);
  assert.equal(await page.locator('.craft-long-light').evaluate(e=>+e.style.opacity),0);
  await page.locator('.session-control-button').click();await page.waitForTimeout(300);
  assert(await page.locator('.craft-long-light').evaluate(e=>+e.style.opacity)>.8);
  assert.deepEqual(errors,[]);
  console.log('Standalone verified: '+scripts.length+' valid inline scripts; exact prepared image embedded; start lighting works; no page errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
