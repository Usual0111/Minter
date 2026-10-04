const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup({telegram=false}={}){let now=0,id=0;const frames=new Map(),events={},modal={open:false,style:{setProperty(k,v){this[k]=v;}}},doc={hidden:false,getElementById:()=>modal,querySelector:()=>({getBoundingClientRect:()=>({top:44,bottom:140})}),addEventListener:(n,fn)=>events[n]=fn},media={matches:false,addEventListener(){}};const c={Telegram:telegram?{WebApp:{platform:"ios"}}:undefined,document:doc,window:{addEventListener(){},visualViewport:{offsetTop:0,height:844,addEventListener(){}}},innerHeight:844,matchMedia:()=>media,performance:{now:()=>now},requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id)};vm.createContext(c);vm.runInContext(fs.readFileSync('assets/motion.js','utf8'),c);return {m:c.MotionUI,frames,doc,media,modal,events,step(t){now=t;const run=[...frames.values()];frames.clear();run.forEach(fn=>fn(t));}};}
test('counter interpolation stays within confirmed amount, shares one frame and stops at completion',()=>{const f=setup(),a={isConnected:true,textContent:''},b={isConnected:true,textContent:''};f.m.number(a,100,n=>n.toFixed(2));assert.equal(f.frames.size,0);f.m.number(a,200,n=>n.toFixed(2));f.m.number(b,30,n=>n.toFixed(2),{from:0});assert.equal(f.frames.size,1);f.step(70);assert(+a.textContent>100&&+a.textContent<200);assert(+b.textContent>0&&+b.textContent<30);f.step(160);assert.equal(a.textContent,'200.00');assert.equal(b.textContent,'30.00');assert.equal(f.frames.size,0);});
test('background, reduced motion and open dialogs avoid running counter animation',()=>{for(const mode of ['background','reduced','dialog']){const f=setup(),el={isConnected:true,textContent:''};f.m.number(el,0,String);if(mode==='background')f.doc.hidden=true;if(mode==='reduced')f.media.matches=true;if(mode==='dialog')f.modal.open=true;f.m.number(el,100,String);assert.equal(el.textContent,'100');assert.equal(f.frames.size,0);}const f=setup(),el={isConnected:true,textContent:''};f.m.number(el,100,String,{from:0});f.doc.hidden=true;f.events.visibilitychange();assert.equal(f.frames.size,0);assert.equal(el.textContent,'100');});
test('dialog opens at the header top edge within visual viewport, including keyboard resize',()=>{const f=setup();f.m.dialogBounds();assert.equal(f.modal.style['--dialog-top'],'44px');assert.equal(f.modal.style['--dialog-height'],'784px');f.doc.querySelector=()=>({getBoundingClientRect:()=>({top:-20,bottom:140})});f.m.dialogBounds();assert.equal(f.modal.style['--dialog-top'],'0px');});

function entranceNode(){const animations=[],node={isConnected:true,style:{opacity:'',transform:'',willChange:''},animate(frames,options){let finish;const a={frames,options,finished:new Promise(r=>finish=r),finish:()=>finish(),cancel(){this.cancelled=true;}};animations.push(a);return a;}};return {node,animations};}
test('Mini App page entrance prepares a short lift without fading and releases its temporary layer',async()=>{
 const f=setup({telegram:true}),{node,animations}=entranceNode();f.m.enterPage(node);assert.equal(animations.length,0);f.step(16);assert.equal(animations.length,0);f.step(32);assert.equal(animations.length,1);
 const a=animations[0];assert(a.frames.every(k=>!('opacity' in k)));assert.equal(a.frames[0].transform,'translate3d(0,4px,0)');assert.equal(a.frames[1].transform,'translate3d(0,0,0)');assert.equal(a.options.duration,180);assert.equal(node.style.willChange,'transform');assert.equal(node.style.opacity,'');a.finish();await Promise.resolve();assert.equal(node.style.willChange,'');assert.equal(node.style.transform,'');
});
test('fast Mini App navigation cancels a pending or running entrance without leaving faded pages',()=>{
 const f=setup({telegram:true}),a=entranceNode(),b=entranceNode();f.m.enterPage(a.node);f.m.enterPage(b.node);assert.equal(a.node.style.transform,'');f.step(16);f.step(32);assert.equal(a.animations.length,0);assert.equal(b.animations.length,1);f.m.enterPage(a.node);assert(b.animations[0].cancelled);assert.equal(b.node.style.willChange,'');assert.equal(b.node.style.transform,'');
});
test('Mini App entrance stops on backgrounding and respects reduced motion',()=>{
 const f=setup({telegram:true}),{node,animations}=entranceNode();f.m.enterPage(node);f.doc.hidden=true;f.events.visibilitychange();assert.equal(f.frames.size,0);assert.equal(node.style.transform,'');f.doc.hidden=false;f.media.matches=true;f.m.enterPage(node);assert.equal(f.frames.size,0);assert.equal(animations.length,0);
});
test('Mini App lift preserves existing inline styles on completion and cancellation',async()=>{
 const f=setup({telegram:true}),{node,animations}=entranceNode();Object.assign(node.style,{transform:'translateX(2px)',opacity:'.9',willChange:'scroll-position'});f.m.enterPage(node);f.step(16);f.step(32);assert.equal(animations[0].frames[1].transform,'translateX(2px)');animations[0].finish();await Promise.resolve();assert.equal(node.style.transform,'translateX(2px)');assert.equal(node.style.opacity,'.9');assert.equal(node.style.willChange,'scroll-position');f.m.enterPage(node).cancel();assert.equal(node.style.transform,'translateX(2px)');assert.equal(node.style.willChange,'scroll-position');
});
test('ordinary browsers retain the existing page entrance',()=>{
 const f=setup(),{node,animations}=entranceNode();f.m.enterPage(node);assert.equal(animations.length,1);assert.equal(animations[0].options.duration,220);assert.equal(animations[0].frames[0].transform,'translateY(7px)');assert.equal(f.frames.size,0);
});

test('claim feedback is bounded, uses confirmed DATA, preserves device transform and cleans up',async()=>{
 const f=setup(),elements=[],animations=[];let cancelCount=0;
 const node=(className='')=>({className,style:{},setAttribute(){},remove(){this.removed=true;},getBoundingClientRect:()=>({left:70,top:200,width:200,height:210}),animate(frames,options){let resolve;const finished=new Promise(r=>resolve=r);const a={frames,options,finished,finish:resolve,cancel(){cancelCount++;}};animations.push(a);return a;}});
 const device=node('device'),hero=node('hero'),balance=node('balance');
 f.doc.querySelector=s=>s==='.journey-device'?device:s==='.journey-hero'?hero:null;
 f.doc.querySelectorAll=()=>[balance];f.doc.createElement=()=>node();f.doc.body={append:e=>elements.push(e)};
 // Read the same script with a browser-style computed accent, retaining the fixture clock.
 const context={document:f.doc,window:{addEventListener(){}},innerHeight:844,getComputedStyle:()=>({getPropertyValue:()=> '#60f2ec'}),matchMedia:()=>f.media,performance:{now:()=>0},requestAnimationFrame:()=>1,cancelAnimationFrame(){}};
 vm.createContext(context);vm.runInContext(fs.readFileSync('assets/motion.js','utf8'),context);context.MotionUI.claim(79500);
 assert.equal(elements.length,9);assert.equal(elements.filter(e=>e.className.includes('claim-particle')).length,6);assert.equal(elements.find(e=>e.className.includes('claim-data-feedback')).textContent,'+0.0795 DATA');
 assert(animations.some(a=>a.frames[0].scale==='1.03'&&!('transform' in a.frames[0])));assert(animations.every(a=>a.options.duration<=760));
 animations.forEach(a=>a.finish());await Promise.resolve();assert(elements.every(e=>e.removed));assert(!device.removed&&!balance.removed);
 context.MotionUI.claim(120000);f.doc.hidden=true;f.events.visibilitychange();assert(elements.every(e=>e.removed));assert(cancelCount>0);
 const count=elements.length;context.MotionUI.claim(100000);assert.equal(elements.length,count);f.doc.hidden=false;f.media.matches=true;context.MotionUI.claim(100000);assert.equal(elements.length,count);
});
