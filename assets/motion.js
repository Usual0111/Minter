(function(root){
  'use strict';
  const clamp=x=>Math.max(0,Math.min(1,x));
  // Evaluate cubic-bezier(.22,1,.36,1), including its time axis.
  function ease(t){t=clamp(t);let lo=0,hi=1,u=t;for(let i=0;i<14;i++){u=(lo+hi)/2;const x=3*(1-u)*(1-u)*u*.22+3*(1-u)*u*u*.36+u*u*u;if(x<t)lo=u;else hi=u;}return t===0?0:t===1?1:1-(1-u)**3;}
  const point=(fraction,r=74.8)=>{const a=(fraction*360-90)*Math.PI/180;return {x:95.5+r*Math.cos(a),y:95.5+r*Math.sin(a)};};
  function arc(start,end,r=74.8){start=clamp(start);end=clamp(end);if(end<=start)return '';const a=point(start,r),b=point(end,r);if(end-start>=.999999){const m=point(start+.5,r);return `M${a.x} ${a.y} A${r} ${r} 0 0 1 ${m.x} ${m.y} A${r} ${r} 0 0 1 ${b.x} ${b.y}`;}return `M${a.x} ${a.y} A${r} ${r} 0 ${end-start>.5?1:0} 1 ${b.x} ${b.y}`;}
  function pulseSegments(ratio,t){ratio=clamp(ratio);t=clamp(t);const length=ratio*.12,head=(ratio+length)*t,opacity=Math.min(1,t/.12,(1-t)/.15);return Array.from({length:8},(_,i)=>({start:Math.min(ratio,Math.max(0,head-length+length*i/8)),end:Math.min(ratio,Math.max(0,head-length+length*(i+1)/8)),opacity:Math.max(0,opacity)*(.08+.72*(i/7)**1.6)}));}
  function create(options){
    const view=options.view,clock=options.now||(()=>performance.now()),raf=options.raf||(fn=>root.requestAnimationFrame(fn)),caf=options.caf||(id=>root.cancelAnimationFrame(id)),delay=options.delay||setTimeout,clearDelay=options.clearDelay||clearTimeout;
    let latest=null,seen=new Set(),visible=true,reduced=false,display={ratio:0,balance:0},ring=null,balance=null,bonus=null,pulse=null,frame=null,timer=null;
    const call=(name,...args)=>view[name]?.(...args);
    function stopPulse(){if(timer!==null)clearDelay(timer);timer=null;pulse=null;call('pulse',[]);}
    function schedule(ms=5000){stopPulse();if(!latest||!visible||reduced||ring||bonus||display.ratio<=0)return;timer=delay(()=>{timer=null;if(visible&&!reduced&&!ring&&!bonus&&display.ratio>0){pulse={at:clock(),ratio:display.ratio};wake();}},ms);}
    function wake(){if(frame===null)frame=raf(tick);}
    function drawRing(value){display.ratio=clamp(value);call('ring',display.ratio,point(display.ratio));}
    function drawBalance(value){display.balance=value;call('balance',Math.round(value),latest.balance);}
    function moveBalance(target,at){if(display.balance===target){balance=null;return;}balance={from:display.balance,to:target,at,duration:600};}
    function snap(){if(frame!==null)caf(frame);frame=null;stopPulse();ring=balance=bonus=null;call('clear');call('opacity',1);if(latest){drawRing(latest.progress.ratio);drawBalance(latest.balance);call('labels',latest.progress,false);}call('busy',false);}
    function bonusFinish(){bonus=null;call('busy',false);call('opacity',1);schedule();}
    function tick(time){
      frame=null;
      if(!visible||reduced){snap();return;}
      if(ring){const p=clamp((time-ring.at)/ring.duration);drawRing(ring.from+(ring.to-ring.from)*ease(p));if(p===1)ring=null;}
      if(balance){const p=clamp((time-balance.at)/balance.duration);drawBalance(balance.from+(balance.to-balance.from)*ease(p));if(p===1){drawBalance(balance.to);balance=null;}}
      if(bonus){
        const elapsed=time-bonus.at;
        if(elapsed>=650&&elapsed<2050){call('pulse',pulseSegments(1,(elapsed-650)/1400));}
        if(elapsed>=2050&&!bonus.credited){bonus.credited=true;call('pulse',[]);call('bonus',bonus.cents,bonus.base);call('reward',bonus.total);moveBalance(latest.balance,time);}
        if(elapsed>=2750&&elapsed<2930)call('opacity',1-(elapsed-2750)/180);
        if(elapsed>=2930&&!bonus.swapped){bonus.swapped=true;call('labels',latest.progress,false);drawRing(latest.progress.ratio);call('opacity',0);}
        if(elapsed>=2930)call('opacity',clamp((elapsed-2930)/250));
        if(elapsed>=3180)bonusFinish();
      }else if(pulse){const p=clamp((time-pulse.at)/1400);call('pulse',pulseSegments(pulse.ratio,p));if(p===1){pulse=null;call('pulse',[]);schedule();}}
      if(ring||balance||bonus||pulse)wake();else if(timer===null)schedule();
    }
    function update(next,{immediate=false}={}){
      const first=!latest||latest.user!==next.user,old=latest;
      const events=next.events||[];
      const fresh=first?[]:events.filter(e=>!seen.has(e.id));
      if(first)seen=new Set();events.forEach(e=>seen.add(e.id));
      latest=next;
      if(first||immediate||!visible||reduced){snap();schedule(first||immediate?2000:5000);return;}
      const changed=old.balance!==next.balance||JSON.stringify(old.progress)!==JSON.stringify(next.progress);
      if(!changed)return;
      const confirmed=fresh.some(e=>e.cr>0&&e.type!=='opening');
      if(!confirmed){snap();schedule();return;}
      const now=clock(),milestone=fresh.find(e=>e.type==='milestone');
      const reward=fresh.filter(e=>e.cr>0&&e.type!=='opening').reduce((sum,e)=>sum+e.cr,0);
      stopPulse();
      if(milestone){
        const base=fresh.filter(e=>e.type==='ad'&&e.reference===milestone.reference).reduce((sum,e)=>sum+e.cr,0);
        bonus={at:now,cents:milestone.cr,base,total:reward,credited:false,swapped:false};balance=null;
        call('clear');call('opacity',1);call('busy',true);
        call('labels',{number:milestone.seriesNumber,views:milestone.threshold,target:milestone.threshold,bonusCents:milestone.cr,left:0,ratio:1},true);
        ring={from:display.ratio,to:1,at:now,duration:650};
      }else if(bonus){
        // Keep a single sequence, but its eventual target always uses the latest state.
        moveBalance(next.balance,now);if(!bonus.credited)bonus.total+=reward;else call('reward',reward);
      }else{
        call('labels',next.progress,true);moveBalance(next.balance,now);call('reward',reward);
        ring={from:display.ratio,to:next.progress.ratio,at:now,duration:650};
      }
      wake();
    }
    function setVisible(value){if(visible===value)return;visible=value;snap();if(value)schedule(2000);}
    function setReduced(value){if(reduced===value)return;reduced=value;snap();if(!value)schedule(2000);}
    function destroy(){visible=false;snap();}
    return {update,setVisible,setReduced,destroy,get busy(){return !!bonus;},get displayed(){return {...display};}};
  }
  const api={create,point,arc,pulseSegments,ease};root.FarmZoneMotion=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
