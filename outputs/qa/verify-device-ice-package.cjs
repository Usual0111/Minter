const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../..'),file=path.join(root,'outputs/Bountera.html'),image='data:image/png;base64,'+fs.readFileSync(path.join(root,'assets/aurora-device-layer-lights-off.png')).toString('base64');
if(process.argv.includes('--static')){const html=fs.readFileSync(file,'utf8'),scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];scripts.forEach((s,i)=>new vm.Script(s[1],{filename:'inline-'+i}));assert(!/<script[^>]+src=["']assets\//.test(html));assert(html.includes(image));console.log('Standalone static check: '+scripts.length+' valid inline scripts and exact prepared image embedded.');process.exit(0);}
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message.slice(0,500));});
  await page.route('https://telegram.org/**',route=>route.abort());
  await page.goto('file:///'+file.replaceAll('\\','/')+'#/home',{waitUntil:'commit'});
  try{await page.waitForSelector('.home-device-rig',{timeout:15000});}catch(e){console.log(await page.evaluate(()=>({ready:document.readyState,text:document.body.innerText.slice(0,1000),motion:typeof HomeDeviceMotion,client:typeof MiningClient})));throw e;}
  assert.equal(await page.locator('.home-device-layer').getAttribute('src'),image);
  assert.equal(await page.locator('.craft-long-light').evaluate(e=>getComputedStyle(e).fill),'rgb(169, 204, 216)');
  assert.equal(await page.locator('.craft-pulse-slice').first().evaluate(e=>getComputedStyle(e).stroke),'rgb(216, 235, 241)');
  assert.equal(await page.locator('.home-device-lights').evaluate(e=>getComputedStyle(e).mixBlendMode),'normal');
  assert.equal(await page.locator('.craft-long-light').evaluate(e=>+e.style.opacity),0);
  await page.waitForTimeout(1000);
  await page.locator('.session-control-button').click();await page.waitForTimeout(300);
  const after=await page.evaluate(()=>({url:location.href,lights:document.querySelectorAll('.craft-long-light').length,text:document.body.innerText.slice(0,1000),light:document.querySelector('.craft-long-light')?.style.opacity}));
  if(!after.lights){console.log(after);await page.screenshot({path:path.join(__dirname,'device-blue-package-diagnostic.png')});}
  assert(+after.light>.8);
  assert.deepEqual(errors,[]);
  console.log('Standalone browser check: exact prepared image; ice core and pulse; start lighting works; no page errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
