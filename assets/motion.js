(function(root){'use strict';
// One short-lived scheduler for counters; no mining calculations in animation frames.
const jobs=new Map(),values=new WeakMap();let frame=0,lastPaint=0;
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const quiet=()=>document.hidden||!!document.getElementById('modal')?.open||(reduced()&&!(document.body?.classList?.contains('force-animations')));
const effects=new Set();
function clearEffects(){for(const effect of [...effects])effect();}
function effect(node,frames,options,remove=true){const animation=animate(node,frames,options);const clean=()=>{effects.delete(clean);animation?.cancel();if(remove)node.remove();};if(!animation){clean();return;}effects.add(clean);animation.finished.then(clean,clean);}
function balancePulse(){if(quiet())return;document.querySelectorAll('[data-live="balance"]').forEach(node=>effect(node,[{opacity:.55,scale:'1.035'},{opacity:1,scale:'1'}],{duration:340},false));}
// Fixed-position, short-lived feedback never takes space in the Home layout.
function claim(micro,unit=1000000){if(!(micro>0)||quiet())return;clearEffects();balancePulse();const device=document.querySelector('.journey-device'),hero=document.querySelector('.journey-hero');if(!device||!hero)return;
 const r=device.getBoundingClientRect(),h=hero.getBoundingClientRect(),color=getComputedStyle(hero).getPropertyValue('--swarm-color').trim()||'#60f2ec';
 const add=(kind,x,y)=>{const el=document.createElement('span');el.className='claim-effect '+kind;el.setAttribute('aria-hidden','true');el.style.cssText=`left:${x}px;top:${y}px;--effect-color:${color}`;document.body.append(el);return el;};
 effect(device,[{scale:'1.03'},{scale:'1'}],{duration:220},false);
 for(const [kind,x,y] of [['claim-lens',.65,.32],['claim-exhaust',.58,.85]]){const el=add(kind,r.left+r.width*x,r.top+r.height*y);effect(el,[{opacity:0,transform:'translate(-50%,-50%) scale(.7)'},{opacity:.8,offset:.3,transform:'translate(-50%,-50%) scale(1)'},{opacity:0,transform:'translate(-50%,-50%) scale(1.15)'}],{duration:380});}
 const label=add('claim-data-feedback',r.left+r.width/2,Math.max(h.top+60,r.top+40));label.textContent='+'+(Math.floor(micro/unit*10000)/10000).toFixed(4)+' DATA';
 effect(label,[{opacity:0,transform:'translate(-50%,0) scale(.92)'},{opacity:1,offset:.18,transform:'translate(-50%,-8px) scale(1.04)'},{opacity:0,transform:'translate(-50%,-54px) scale(1)'}],{duration:760});
 for(let i=0;i<6;i++){const angle=i*Math.PI/3,el=add('claim-particle',r.left+r.width/2,r.top+r.height*.52);effect(el,[{opacity:0,transform:'translate(-50%,-50%) scale(.6)'},{opacity:1,offset:.18},{opacity:0,transform:`translate(${Math.cos(angle)*55}px,${Math.sin(angle)*38-28}px) scale(.2)`}],{duration:560+i*25});}
}
// Light particle burst from the press point on claim actions (accent color of the card).
function tapBurst(node,x,y){if(quiet()||!node)return;const color=(typeof getComputedStyle==='function'?getComputedStyle(node).getPropertyValue('--claim-accent'):'').trim()||'#60f2ec';const r=node.getBoundingClientRect(),cx=x??r.left+r.width/2,cy=y??r.top+r.height/2;effect(node,[{transform:'scale(.965)'},{transform:'scale(1)'}],{duration:200},false);for(let i=0;i<9;i++){const angle=(i/9)*Math.PI*2+Math.random()*.5,dx=Math.cos(angle)*(30+Math.random()*26),dy=Math.sin(angle)*(20+Math.random()*16)-10,el=document.createElement('span');el.className='claim-effect claim-particle';el.setAttribute('aria-hidden','true');el.style.cssText=`left:${cx}px;top:${cy}px;--effect-color:${color}`;document.body.append(el);effect(el,[{opacity:0,transform:'translate(-50%,-50%) scale(.5)'},{opacity:.9,offset:.22,transform:'translate(-50%,-50%) scale(1)'},{opacity:0,transform:`translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(.22)`}],{duration:440+Math.random()*220});}}
document.addEventListener('pointerdown',e=>{const el=e.target?.closest?.('.claim-button,.claim-slot');if(el&&!el.disabled)tapBurst(el,e.clientX,e.clientY);},{passive:true});
function write(node,value,format){const text=format(value);if(node.textContent!==text)node.textContent=text;values.set(node,value);}
function flush(){cancelAnimationFrame(frame);frame=0;for(const [node,j] of jobs)if(node.isConnected)write(node,j.to,j.format);jobs.clear();}
function step(at){frame=0;if(quiet()){flush();return;}if(at-lastPaint>=32){lastPaint=at;for(const [node,j] of jobs){if(!node.isConnected){jobs.delete(node);continue;}const p=Math.min(1,Math.max(0,(at-j.start)/j.ms)),e=j.ease?1-Math.pow(1-p,3):p;write(node,j.from+(j.to-j.from)*e,j.format);if(p===1)jobs.delete(node);}}if(jobs.size)frame=requestAnimationFrame(step);}
function number(node,to,format,{from,duration=145,ease=false}={}){if(!node)return;const old=values.get(node),start=from??old;if(start===undefined||quiet()||start===to){jobs.delete(node);write(node,to,format);return;}const previous=jobs.get(node);if(previous?.to===to)return;jobs.set(node,{from:start,to,format,start:performance.now(),ms:duration,ease});write(node,start,format);if(!frame)frame=requestAnimationFrame(step);}
function animate(node,keyframes,options){if(!node||quiet()||!node.animate)return null;return node.animate(keyframes,{duration:240,easing:'cubic-bezier(.22,.8,.24,1)',...options});}
let pageEntrance=null;
function enterPage(node){
 pageEntrance?.cancel();if(!node||quiet()||!node.animate)return null;
 const platform=root.Telegram?.WebApp?.platform;
 if(!platform||platform==='unknown')return animate(node,[{opacity:.35,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:220});
 const original={transform:node.style.transform,willChange:node.style.willChange};let pending=0,animation=null,done=false;
 const restore=()=>{if(done)return;done=true;if(pending)cancelAnimationFrame(pending);node.style.transform=original.transform;node.style.willChange=original.willChange;if(pageEntrance===entry)pageEntrance=null;};
 const entry={cancel(){restore();animation?.cancel();}};pageEntrance=entry;
 // Prepare the new content before a short lift; avoid fading a whole page layer.
 const settled=original.transform||'translate3d(0,0,0)',lifted='translate3d(0,4px,0)'+(original.transform?' '+original.transform:'');
 node.style.willChange='transform';node.style.transform=lifted;
 pending=requestAnimationFrame(()=>{pending=requestAnimationFrame(()=>{pending=0;if(node.isConnected===false||quiet()){entry.cancel();return;}animation=animate(node,[{transform:lifted},{transform:settled}],{duration:180,easing:'cubic-bezier(.22,.8,.24,1)'});node.style.transform=original.transform;if(animation)animation.finished.then(restore,restore);else restore();});});
 return entry;
}
function credit(amount){if(!(amount>0)||quiet())return;document.querySelector('.credit-feedback')?.remove();const anchor=document.querySelector('[data-action="homeCollect"],.depin-balance');if(!anchor)return;const r=anchor.getBoundingClientRect(),el=document.createElement('div');el.className='credit-feedback';el.textContent='+'+(amount/100).toFixed(2)+' CR';el.setAttribute('aria-hidden','true');el.style.left=(r.left+r.width/2)+'px';el.style.top=Math.max(100,r.top-4)+'px';document.body.append(el);const a=animate(el,[{opacity:0,transform:'translate(-50%,8px) scale(.94)'},{opacity:1,offset:.2,transform:'translate(-50%,-4px) scale(1)'},{opacity:0,transform:'translate(-50%,-36px) scale(1)'}],{duration:850});if(a)a.finished.then(()=>el.remove(),()=>el.remove());else el.remove();animate(anchor,[{transform:'scale(.975)'},{transform:'scale(1)'}],{duration:260});}
function dialogBounds(){const header=document.querySelector('.depin-header')||document.querySelector('.nodes-header')||document.querySelector('.header');if(!header)return;const viewport=window.visualViewport,tg=window.Telegram?.WebApp,top=viewport?.offsetTop||0,hostHeight=Number(tg?.viewportHeight)||innerHeight,height=Math.min(viewport?.height||innerHeight,hostHeight),bottom=Math.max(0,Number(tg?.safeAreaInset?.bottom)||0)+Math.max(0,Number(tg?.contentSafeAreaInset?.bottom)||0);const rect=header.getBoundingClientRect();const app=document.querySelector('.app'),reserved=app&&typeof getComputedStyle==='function'?(parseFloat(getComputedStyle(app).paddingTop)||0):0;const safe=Math.max(top+reserved,Math.max(0,rect.top||0));const modal=document.getElementById('modal');modal.style.setProperty('--dialog-top',safe+'px');modal.style.setProperty('--dialog-height',Math.max(0,top+height-safe-bottom-16)+'px');}
document.addEventListener('visibilitychange',()=>{if(document.hidden){pageEntrance?.cancel();flush();clearEffects();}});
if(typeof matchMedia==='function')matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change',()=>{pageEntrance?.cancel();flush();clearEffects();});
window.addEventListener('resize',dialogBounds);window.visualViewport?.addEventListener('resize',dialogBounds);window.visualViewport?.addEventListener('scroll',dialogBounds);
root.MotionUI={number,animate,enterPage,credit,claim,balancePulse,tapBurst,dialogBounds,flush,reduced};
})(typeof globalThis!=='undefined'?globalThis:window);
