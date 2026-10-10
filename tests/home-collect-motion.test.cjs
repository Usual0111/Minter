const {test}=require('node:test'),assert=require('node:assert/strict');
const {create}=require('../assets/home-collect-motion.js');
function fixture(){
 let at=0,id=0,off=false,visible=true,amount=0,flashes=0;const frames=new Map(),listeners={};
 const node=()=>({style:{opacity:'',minWidth:'',display:'',fontVariantNumeric:''},textContent:'550.00',getBoundingClientRect:()=>({width:64})});
 const counter=node(),balance=node(),d={hidden:false,querySelector:()=>visible?counter:null,querySelectorAll:()=>[balance],addEventListener:(name,fn)=>listeners[name]=fn};
 const motion=create({document:d,raf:fn=>{frames.set(++id,fn);return id;},cancel:n=>frames.delete(n),now:()=>at,reduced:()=>off,formatBalance:n=>(n/100).toFixed(5),paintAmount:n=>amount=n,feedback:()=>flashes++});
 const start=()=>motion.start({fromMicro:56835000,toMicro:0,unit:1000000,fromBalance:55000,toBalance:55056.835});
 const advance=ms=>{at=ms;const jobs=[...frames.values()];frames.clear();jobs.forEach(fn=>fn(at));};
 return {motion,counter,balance,d,start,advance,frames,listeners,get amount(){return amount},get flashes(){return flashes},reduce(){off=true},leave(){visible=false}};
}
test('one RAF clock applies the same cubic easing to countdown and balance, then exact response endpoints',async()=>{
 const f=fixture(),done=f.start();assert.equal(f.amount,56835000);assert.equal(f.counter.style.opacity,'.85');assert.equal(f.frames.size,1);
 f.advance(550);assert.equal(f.amount,56835000*.125);assert.equal(f.motion.balance(-1),55000+56.835*.875);assert.equal(f.balance.textContent,'550.49731');
 f.advance(1100);await done;assert.equal(f.amount,0);assert.equal(f.balance.textContent,'550.56835');assert.equal(f.motion.active(),false);assert.equal(f.frames.size,0);assert.equal(f.counter.style.opacity,'');assert.equal(f.flashes,1);
});
test('background interruption settles exact values, resolves the lock and produces no flash',async()=>{
 const f=fixture(),done=f.start();f.advance(300);f.d.hidden=true;f.listeners.visibilitychange();await done;
 assert.equal(f.amount,0);assert.equal(f.balance.textContent,'550.56835');assert.equal(f.motion.active(),false);assert.equal(f.frames.size,0);assert.equal(f.flashes,0);
});
test('leaving or replacing a transfer cancels its frame and cannot overlap a new run',async()=>{
 const f=fixture(),old=f.start();f.advance(200);const next=f.start();await old;assert.equal(f.frames.size,1);assert.equal(f.amount,56835000);
 f.leave();f.advance(300);await next;assert.equal(f.motion.active(),false);assert.equal(f.frames.size,0);assert.equal(f.flashes,0);
});
test('reduced motion is immediate and changing the preference finishes an in-flight transfer',async()=>{
 const f=fixture();f.reduce();await f.start();assert.equal(f.motion.active(),false);assert.equal(f.frames.size,0);
 const g=fixture(),done=g.start();g.advance(200);g.reduce();g.advance(300);await done;assert.equal(g.amount,0);assert.equal(g.frames.size,0);assert.equal(g.flashes,0);
});
