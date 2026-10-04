const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../assets/home-device-motion.js');
const idle={status:'idle',sessionId:null,node:{image:'aurora-device-layer.png'},rate:{numerator:'0',denominator:'1'}},active={...idle,status:'active',sessionId:'s1',rate:{numerator:'10',denominator:'1'}};
function fixture(){let time=0,id=0,reduced=false;const frames=new Map(),events={},rig={style:{}},node={isConnected:true,style:{},getAttribute:()=> 'assets/aurora-device-layer-lights-off.png'},short=Array.from({length:6},()=>({style:{}})),long={style:{}},slices=Array.from({length:20},()=>({setAttribute(k,v){this[k]=v;}})),moving={style:{},querySelectorAll:()=>slices,setAttribute(k,v){this[k]=v;}},svg={style:{},querySelector:s=>s==='.craft-long-light'?long:moving,querySelectorAll:()=>short},doc={hidden:false,querySelector:s=>s==='.home-device-layer'?node:s==='.home-device-rig'?rig:svg,addEventListener:(n,fn)=>events[n]=fn,removeEventListener(){}};const m=M.create({document:doc,now:()=>time,raf:f=>{frames.set(++id,f);return id;},caf:id=>frames.delete(id),reduced:()=>reduced});function step(t){time=t;const run=[...frames.values()];frames.clear();run.forEach(f=>f(t));}const y=()=>Number(rig.style.transform.match(/,(-?[\d.]+)px/)[1]);return {m,node,rig,svg,long,moving,slices,short,doc,events,frames,step,y,quiet:()=>reduced=true,setTime:t=>time=t};}
test('idle and active float are vertical only, bounded and continuous across status changes',()=>{const f=fixture();f.m.sync(idle);let previous=0;for(let t=0;t<=8000;t+=20){f.step(t);assert(Math.abs(f.y())<=1.0001);assert(Math.abs(f.y()-previous)<.03);previous=f.y();assert.equal(f.node.style.transform,undefined);assert.equal(f.svg.style.transform,undefined);assert(!/rotate|scale/.test(f.rig.style.transform));}f.m.sync(active);for(let t=8020;t<=14000;t+=20){f.step(t);assert(Math.abs(f.y())<=2.0001);assert(Math.abs(f.y()-previous)<.05);previous=f.y();}assert.equal(f.m.sample().period,6000);assert.equal(f.m.sample().amplitude,2);});
test('successful free and confirmed ad starts animate only once without touching the session data',()=>{for(const [action,result] of [['rewardFreeStart',{freeStarted:true}],['rewardAdConfirm',{eventId:'ad-start'}]]){const f=fixture(),before=JSON.stringify(active);f.m.sync(idle);f.m.success(action,idle,active,result);assert.equal(f.m.sample().effect,'start');let previous=f.y();for(let t=0;t<=1100;t+=10){f.step(t);assert(Math.abs(f.y())<=2.0001);assert(Math.abs(f.y()-previous)<.1);previous=f.y();}assert.equal(f.m.sample().effect,null);f.m.success(action,idle,active,result);assert.equal(f.m.sample().effect,null);assert.equal(JSON.stringify(active),before);}});
test('confirmed boost zoom peaks at 450ms, returns by 1100ms and adds no lift or tilt',()=>{
 const f=fixture();f.m.sync(active);f.step(1000);const faster={...active,rate:{numerator:'20',denominator:'1'}};f.m.success('rewardAdConfirm',active,faster,{eventId:'zoom'});
 let previous=1;for(let ms=0;ms<=450;ms+=10){f.step(1000+ms);const s=f.m.sample();assert.equal(s.lift,0);assert(Math.abs(f.y())<=2.0001);assert(!/rotate/.test(f.rig.style.transform));assert(s.scale>=previous&&s.scale<=1.012);if(ms<=100)assert.equal(s.scale,1);previous=s.scale;}
 assert.equal(previous,1.012);for(let ms=460;ms<=1100;ms+=10){f.step(1000+ms);const s=f.m.sample();assert(s.scale<=previous&&s.scale>=1);previous=s.scale;}
 assert.equal(previous,1);assert.equal(f.m.sample().effect,null);assert(!/scale/.test(f.rig.style.transform));
});
test('repeated confirmed boosts restart continuously without stacking scale or height',()=>{
 const f=fixture();f.m.sync(active);f.step(1000);const faster={...active,rate:{numerator:'20',denominator:'1'}};f.m.success('rewardAdConfirm',active,faster,{eventId:'a'});f.step(1300);const scale=f.m.sample().scale;
 f.m.success('rewardAdConfirm',faster,{...faster,rate:{numerator:'30',denominator:'1'}},{eventId:'b'});assert.equal(f.m.sample().scale,scale);
 for(let t=1300;t<=2500;t+=10){f.step(t);assert(f.m.sample().scale>=1&&f.m.sample().scale<=1.012);assert.equal(f.m.sample().lift,0);assert(Math.abs(f.y())<=2.0001);}
 assert.equal(f.m.sample().scale,1);f.m.success('rewardAdConfirm',active,faster,{eventId:'a',alreadyConfirmed:true});assert.equal(f.m.sample().effect,null);
});
test('failed ads, unchanged speeds and stale session confirmations cannot trigger boosts',()=>{const f=fixture();f.m.sync(active);for(const [after,result] of [[active,{}],[active,{eventId:'same-speed'}],[{...active,status:'ready'},{eventId:'late'}],[{...active,rate:{numerator:'20',denominator:'1'}},{eventId:'duplicate',alreadyConfirmed:true}]]){f.m.success('rewardAdConfirm',active,after,result);assert.equal(f.m.sample().effect,null);}});
test('completion stops the travelling pass, settles over 600ms and stays steady until collection',()=>{const f=fixture();f.m.sync(active);f.step(6000);f.step(6400);assert(+f.moving.style.opacity>0);const ready={...active,status:'ready'};f.m.sync(ready);f.step(6500);assert.equal(+f.moving.style.opacity,0);f.step(7000);assert.equal(f.m.sample().period,8000);assert.equal(f.m.sample().amplitude,1);f.step(13000);assert.equal(+f.moving.style.opacity,0);assert.equal(+f.long.style.opacity,.64);f.m.success('rewardClaim',{...ready,readySessionIds:['s1']},idle,{credited:5,sessionIds:['s1']});assert.equal(f.m.sample().effect,'claim');f.step(13800);assert.equal(f.m.sample().effect,null);assert.equal(+f.long.style.opacity,0);});
test('waiting for a started ad retains working light and does not announce readiness early',()=>{const f=fixture();f.m.sync(active);f.m.sync({...active,status:'finishing'});f.step(700);assert.equal(f.m.sample().mode,'finishing');assert.equal(f.m.sample().light,.68);assert.equal(f.m.sample().amplitude,2);assert.equal(f.m.sample().period,6000);});
test('hiding pauses frames and returning resumes current state without replaying old effects',()=>{const f=fixture();f.m.sync(idle);f.m.success('rewardFreeStart',idle,active,{freeStarted:true});f.step(500);f.doc.hidden=true;f.events.visibilitychange();assert.equal(f.frames.size,0);const y=f.y();f.setTime(90000);f.m.sync({...active,status:'ready'});assert.equal(f.y(),y);f.doc.hidden=false;f.events.visibilitychange();assert.equal(f.m.sample().effect,null);f.step(90600);assert.equal(f.m.sample().mode,'ready');assert.equal(f.m.sample().period,8000);});
test('reduced motion disables zoom and float, retaining only local light fades',()=>{const f=fixture();f.quiet();f.m.sync(active);f.m.success('rewardAdConfirm',active,{...active,rate:{numerator:'20',denominator:'1'}},{eventId:'boost'});for(let t=0;t<=1500;t+=30){f.step(t);assert.equal(f.y(),0);assert.equal(f.m.sample().scale,1);assert(!/scale/.test(f.rig.style.transform));assert.equal(+f.moving.style.opacity,0);}assert.equal(Object.keys(f.node.style).length,0);assert(Object.keys(f.rig.style).every(k=>k==='transform'));assert(f.short.every(n=>+n.style.opacity<=1));});
test('Aurora strip masks never appear on a different image and preserve the source coordinate system',()=>{const f=fixture();f.m.sync({...active,node:{image:'canyon-probe.png'}});assert.equal(f.svg.style.display,'none');assert(M.lights().includes('viewBox="0 0 1536 1024"'));assert(M.lights().includes('stdDeviation="4.5"'));});
test('gray insert masks preserve the original artwork and never intersect the front camera lens',()=>{const fs=require('node:fs'),crypto=require('node:crypto'),mask=JSON.parse(fs.readFileSync('outputs/qa/device-unlit-strip-mask-data.json','utf8'));assert.equal(crypto.createHash('sha256').update(fs.readFileSync('assets/aurora-device-layer.png')).digest('hex'),mask.originalSha256);assert.equal(mask.shapes.length,7);for(const d of mask.shapes){assert(M.lights().includes(d));for(const m of d.matchAll(/M(\d+) (\d+)h(\d+)v1/g)){const [x,y,w]=m.slice(1).map(Number);assert(x+w<240||x>380||y<755||y>895);}}});
test('mining packet travels only forward for 800ms with 5200ms of calm light between passes',()=>{
 const f=fixture();f.m.sync(active);f.step(6000);let offset=Infinity;
 for(let t=6100;t<6800;t+=100){f.step(t);const next=+f.slices[0]['stroke-dashoffset'];assert(next<offset);offset=next;assert(+f.moving.style.opacity>0);assert.equal(+f.long.style.opacity,.68);assert(f.short.every(s=>+s.style.opacity===.68));}
 f.step(6800);assert.equal(+f.moving.style.opacity,0);f.step(11999);assert.equal(+f.moving.style.opacity,0);f.step(12000);f.step(12400);assert(+f.moving.style.opacity>0);
});
test('confirmed boost makes one full pass before staggered short-strip responses, then restores calm light',()=>{
 const f=fixture();f.m.sync(active);f.step(1000);f.m.success('rewardAdConfirm',active,{...active,rate:{numerator:'20',denominator:'1'}},{eventId:'boost-order'});
 f.step(1549);assert(+f.moving.style.opacity>.9);assert(f.short.every(s=>+s.style.opacity===.68));assert.equal(+f.long.style.opacity,.68);
 f.step(1850);assert.equal(+f.moving.style.opacity,0);assert(+f.short[0].style.opacity>.68);assert.equal(+f.short[5].style.opacity,.68);
 f.step(2450);assert.equal(f.m.sample().effect,null);assert.equal(+f.long.style.opacity,.68);assert(f.short.every(s=>+s.style.opacity===.68));
});
test('claim moves one final packet while fading the steady core to zero and never starts another pass',()=>{
 const f=fixture(),ready={...active,status:'ready',readySessionIds:['s1']};f.m.sync(ready);f.step(1000);f.m.success('rewardClaim',ready,idle,{credited:5,sessionIds:['s1']});
 f.step(1300);assert(+f.moving.style.opacity>.9);assert(+f.long.style.opacity<.64);f.step(1700);assert.equal(+f.moving.style.opacity,0);f.step(1800);assert.equal(+f.long.style.opacity,0);f.step(8000);assert.equal(+f.moving.style.opacity,0);
});
test('idle, mining, start, completion and collection keep scale at one',()=>{
 const f=fixture();f.m.sync(idle);f.step(200);assert.equal(f.m.sample().scale,1);f.m.success('rewardFreeStart',idle,active,{freeStarted:true});
 for(let t=200;t<=1500;t+=25){f.step(t);assert.equal(f.m.sample().scale,1);}
 const ready={...active,status:'ready',readySessionIds:['s1']};f.m.sync(ready);f.step(2200);assert.equal(f.m.sample().scale,1);f.m.success('rewardClaim',ready,idle,{credited:5,sessionIds:['s1']});
 for(let t=2200;t<=3300;t+=25){f.step(t);assert.equal(f.m.sample().scale,1);assert(!/scale/.test(f.rig.style.transform));}
});

test('calm light does not search SVG descendants or rewrite light values between packets',()=>{
 const f=fixture();let searches=0,writes=0;
 for(const owner of [f.svg,f.moving])for(const method of ['querySelector','querySelectorAll'])if(owner[method]){const original=owner[method];owner[method]=function(...args){searches++;return original.apply(this,args);};}
 for(const element of [f.long,f.moving,...f.short])element.style=new Proxy(element.style,{set(target,key,value){writes++;target[key]=value;return true;}});
 for(const slice of f.slices){const original=slice.setAttribute;slice.setAttribute=function(...args){writes++;return original.apply(this,args);};}
 f.m.sync(active);f.step(700);const cachedSearches=searches;writes=0;
 for(let t=716;t<6000;t+=16)f.step(t);
 assert.equal(searches,cachedSearches);assert.equal(writes,0);assert.notEqual(f.y(),0);
 f.step(6000);f.step(6100);assert(writes>20);assert(+f.moving.style.opacity>0);
 f.step(6800);writes=0;for(let t=6816;t<12000;t+=16)f.step(t);
 assert.equal(searches,cachedSearches);assert.equal(writes,0);
});

test('cached light elements are rebound when a fresh Home overlay is attached',()=>{
 const f=fixture();f.m.sync(active);f.step(700);
 const long={style:{}},short=Array.from({length:6},()=>({style:{}})),slices=Array.from({length:20},()=>({setAttribute(k,v){this[k]=v;}})),moving={style:{},querySelectorAll:()=>slices};
 const svg={style:{},querySelector:s=>s==='.craft-long-light'?long:moving,querySelectorAll:()=>short};
 f.doc.querySelector=s=>s==='.home-device-layer'?f.node:s==='.home-device-rig'?f.rig:svg;
 f.m.sync(active);f.step(6000);f.step(6100);assert.equal(+long.style.opacity,.68);assert(+moving.style.opacity>0);assert(slices.every(s=>s['stroke-dashoffset']!==undefined));
 f.step(6800);assert.equal(+moving.style.opacity,0);assert(short.every(s=>+s.style.opacity===.68));
});
