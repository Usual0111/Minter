const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('Telegram insets use object.top, refresh on events and do not duplicate subscriptions',()=>{
 const code=fs.readFileSync('assets/telegram-viewport.js','utf8');
 const props={},events={},classes={},tg={safeAreaInset:{top:47},contentSafeAreaInset:{top:56},isFullscreen:true,onEvent:(n,f)=>events[n]=f};
 const ctx={window:{Telegram:{WebApp:tg},innerHeight:844,innerWidth:390,navigator:{hardwareConcurrency:4},getComputedStyle:()=>({getPropertyValue:()=>''}),addEventListener(){}},document:{addEventListener(){},documentElement:{style:{setProperty:(k,v)=>props[k]=v}},body:{classList:{toggle:(k,v)=>classes[k]=v}}},console};
 vm.runInNewContext(code,ctx);ctx.TelegramViewport.create();assert.equal(props['--app-system-top'],'47px');assert.equal(props['--app-chrome-top'],'56px');assert(classes['telegram-chrome']);assert(classes['low-effects']);
 tg.safeAreaInset.top=0;tg.contentSafeAreaInset.top=32;events.contentSafeAreaChanged();assert.equal(props['--app-chrome-top'],'32px');assert.equal(props['--app-system-top'],'0px');assert.equal(Object.keys(events).length,5);
 tg.isFullscreen=false;tg.contentSafeAreaInset.top=0;events.fullscreenChanged();assert.equal(props['--app-chrome-top'],'0px');assert(!classes['telegram-chrome']);
});
