(function(root){'use strict';
// A single presentation clock. The mutation response has already committed the reward.
function create({document:d=root.document,raf=root.requestAnimationFrame?.bind(root),cancel=root.cancelAnimationFrame?.bind(root),now=()=>root.performance.now(),reduced=()=>root.matchMedia?.('(prefers-reduced-motion: reduce)').matches,formatBalance,paintAmount,feedback=()=>{},duration=1100}={}){
 let transfer=null,frame=0,last=Promise.resolve();const styled=new Map();
 const balances=()=>[...(d?.querySelectorAll('.home-screen [data-live="balance"]')||[])];
 function dim(el){if(!el||styled.has(el))return;styled.set(el,{opacity:el.style.opacity,minWidth:el.style.minWidth,display:el.style.display,fontVariantNumeric:el.style.fontVariantNumeric});const width=el.getBoundingClientRect?.().width||0;el.style.opacity='.85';el.style.fontVariantNumeric='tabular-nums';if(width){el.style.minWidth=width+'px';el.style.display='inline-block';}}
 function restore(){for(const [el,old] of styled)Object.assign(el.style,old);styled.clear();}
 function paint(){if(!transfer)return;const t=transfer;const amount=d?.querySelector('[data-session-live="amount"]');dim(amount);paintAmount?.(t.mined,t.unit);for(const el of balances()){dim(el);const text=t.progress===1?formatBalance(t.toBalance):(t.balance/100).toFixed(t.precision);if(el.textContent!==text)el.textContent=text;}}
 function finish(celebrate=false){if(!transfer)return;if(frame)cancel?.(frame);frame=0;const t=transfer;t.mined=t.toMicro;t.balance=t.toBalance;t.progress=1;paint();transfer=null;restore();t.resolve();if(celebrate&&!d?.hidden&&!reduced())feedback(balances());}
 function step(at){frame=0;if(!transfer)return;if(d?.hidden||reduced()||!d?.querySelector('[data-session-live="amount"]')){finish();return;}const t=transfer,p=Math.min(1,Math.max(0,(at-t.started)/duration)),eased=1-Math.pow(1-p,3);t.progress=p;t.mined=t.fromMicro+(t.toMicro-t.fromMicro)*eased;t.balance=t.fromBalance+(t.toBalance-t.fromBalance)*eased;if(p===1){finish(true);return;}paint();frame=raf(step);}
 function start({fromMicro,toMicro=0,unit,fromBalance,toBalance}){finish();if(!raf||d?.hidden||reduced()||!d?.querySelector('[data-session-live="amount"]')){last=Promise.resolve();return last;}const precision=Math.max(2,formatBalance(toBalance).split('.')[1]?.length||0,formatBalance(fromBalance).split('.')[1]?.length||0);let resolve;last=new Promise(r=>resolve=r);transfer={fromMicro,toMicro,unit,fromBalance,toBalance,mined:fromMicro,balance:fromBalance,precision,progress:0,started:now(),resolve};paint();frame=raf(step);return last;}
 d?.addEventListener?.('visibilitychange',()=>{if(d.hidden)finish();});
 root.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change',()=>{if(reduced())finish();});
 return {start,finish,paint,wait:()=>last,active:()=>!!transfer,amount:value=>transfer?transfer.mined:value,balance:value=>transfer?transfer.balance:value};
}
root.HomeCollectMotion={create};if(typeof module==='object')module.exports={create};
})(typeof globalThis!=='undefined'?globalThis:window);
