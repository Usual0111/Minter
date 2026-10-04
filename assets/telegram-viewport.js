(function(root){'use strict';
const px=x=>Number.isFinite(Number(x))&&Number(x)>=0?Number(x):0;
function create({window:w=root.window,document:d=root.document,onChange=()=>{}}={}){
 const style=d.documentElement.style,bindings=[],areas=['top','bottom','left','right'];
 let runtime=null,stable=0,scene=0,width=0,artwork=null,last=null,destroyed=false;
 const listen=(target,name,fn)=>{if(!target?.addEventListener)return;target.addEventListener(name,fn);bindings.push(()=>target.removeEventListener?.(name,fn));};
 const cssPx=name=>px(parseFloat(w.getComputedStyle?.(d.documentElement).getPropertyValue(name)));
 const inset=(value,prefix)=>Object.fromEntries(areas.map(side=>[side,value?.[side]!==undefined?px(value[side]):cssPx(prefix+side)]));
 const put=(name,value)=>style.setProperty(name,value+'px');
 const events=['safeAreaChanged','contentSafeAreaChanged','viewportChanged','fullscreenChanged','activated'];
 function update(event={}){
  if(destroyed)return;
  const tg=w.Telegram?.WebApp;
  if(!tg){if(/tgWebAppPlatform=/.test((w.location?.hash||'')+(w.location?.search||''))){put('--app-chrome-top',56);d.body.classList.toggle('telegram-chrome',true);}return;}
  if(runtime!==tg){
   if(runtime)events.forEach(name=>runtime.offEvent?.(name,update));runtime=tg;
   // Subscribe before expanding: the host can report new geometry immediately.
   events.forEach(name=>tg.onEvent?.(name,update));tg.ready?.();tg.expand?.();
  }
  const safe=inset(tg.safeAreaInset,'--tg-safe-area-inset-'),content=inset(tg.contentSafeAreaInset,'--tg-content-safe-area-inset-');
  if(!tg.contentSafeAreaInset&&tg.isFullscreen&&!content.top)content.top=56;
  const browserHeight=px(w.innerHeight)||px(w.visualViewport?.height),current=px(tg.viewportHeight)||browserHeight;
  if(!stable||event.isStateStable!==false)stable=px(tg.viewportStableHeight)||current||stable;
  const nextWidth=px(w.innerWidth);
  if(!scene||nextWidth!==width){scene=stable;width=nextWidth;artwork=null;}else scene=Math.max(scene,stable);
  const visualHeight=px(w.visualViewport?.height),visualTop=px(w.visualViewport?.offsetTop);
  // The keyboard clips the visible frame, never the design coordinates.
  const keyboard=!!d.activeElement?.matches?.('input,textarea,select,[contenteditable="true"]')&&visualHeight>0&&visualHeight+visualTop<stable-80;
  const available=keyboard?Math.min(current,visualHeight):current,navHeight=keyboard?Math.min(stable,visualHeight):stable;
  areas.forEach(side=>{put('--app-system-'+side,safe[side]);put('--app-chrome-'+side,content[side]);});
  put('--app-viewport-height',available);put('--app-viewport-top',keyboard?visualTop:0);put('--app-stable-height',stable);put('--app-scene-height',scene);put('--app-nav-viewport-height',navHeight);
  d.body.classList.toggle('telegram-chrome',content.top>0);
  d.body.classList.toggle('low-effects',(w.navigator?.hardwareConcurrency||8)<=4||(w.navigator?.deviceMemory||8)<=4);
  last={safe,content,currentHeight:available,stableHeight:stable,sceneHeight:scene,navHeight,offsetTop:keyboard?visualTop:0,keyboard};
  capture(d.querySelector?.('#app>.app'));onChange(last);
 }
 function capture(app){
  if(!runtime||!app)return;
  if(app.classList.contains('home-screen')){
   if(!artwork){
    const wasActive=d.documentElement.classList.contains('tma-viewport');
    // Measure the authored composition once, before viewport framing rules.
    if(wasActive)d.documentElement.classList.remove('tma-viewport');
    const s=w.getComputedStyle(app),bg=w.getComputedStyle(app,':before');
    artwork={top:px(parseFloat(s.paddingTop)),height:px(parseFloat(bg.height))||app.getBoundingClientRect().height};
    if(wasActive)d.documentElement.classList.add('tma-viewport');
   }
   put('--app-home-top-base',artwork.top);put('--app-artwork-height',artwork.height);
  }
  d.documentElement.classList.add('tma-viewport');
 }
 listen(w,'load',update);listen(w,'resize',update);listen(w.visualViewport,'resize',update);listen(w.visualViewport,'scroll',update);
 listen(d,'visibilitychange',()=>{if(!d.hidden)update();});listen(d,'focusin',update);listen(d,'focusout',()=>w.setTimeout?.(update,0));
 listen(w,'hashchange',()=>d.getElementById?.('app')?.scrollTo?.({top:0,behavior:'instant'}));
 update();
 return {update,capture,get state(){return last;},destroy(){destroyed=true;bindings.forEach(off=>off());if(runtime)events.forEach(name=>runtime.offEvent?.(name,update));}};
}
const api={create};root.TelegramViewport=api;if(typeof module==='object')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
