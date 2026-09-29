const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('Telegram insets use object.top, refresh on events and do not duplicate subscriptions',()=>{
 const src=fs.readFileSync('assets/app.js','utf8'),code=src.slice(src.indexOf('let insetRuntime;'),src.indexOf('let page='));
 const props={},events={},classes={},tg={safeAreaInset:{top:47},contentSafeAreaInset:{top:56},isFullscreen:true,onEvent:(n,f)=>events[n]=f};
 const ctx={window:{Telegram:{WebApp:tg},addEventListener(){}},document:{documentElement:{style:{setProperty:(k,v)=>props[k]=v}},body:{classList:{toggle:(k,v)=>classes[k]=v}}},navigator:{hardwareConcurrency:4},console};
 vm.runInNewContext(code,ctx);assert.equal(props['--app-system-top'],'47px');assert.equal(props['--app-chrome-top'],'56px');assert(classes['telegram-chrome']);assert(classes['low-effects']);
 tg.safeAreaInset.top=0;tg.contentSafeAreaInset.top=32;events.contentSafeAreaChanged();assert.equal(props['--app-chrome-top'],'32px');assert.equal(props['--app-system-top'],'0px');assert.equal(Object.keys(events).length,4);
 tg.isFullscreen=false;tg.contentSafeAreaInset.top=0;events.fullscreenChanged();assert.equal(props['--app-chrome-top'],'0px');assert(!classes['telegram-chrome']);
});
