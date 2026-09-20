(function(root){
 'use strict';
 const M=root.FarmZoneMotion,$=id=>document.getElementById(id),money=n=>(n/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
 root.createFarmZoneMotion=function(onBusy){
  const media=matchMedia('(prefers-reduced-motion: reduce)'),card=document.querySelector('.cycle'),gauge=document.querySelector('.gauge');
  const fill=$('hub-progress-fill'),clip=$('hub-clip-width');
  const parts=[...document.querySelectorAll('[data-motion-label]')];
  const paths=[...document.querySelectorAll('#arc-pulse path')];
  let routeVisible=true,intersects=true,animations=new Map(),ghosts=new Map(),lastLabels=null;
  // Full motion is explicitly enabled in file, static-web and server demo previews.
  // Live Mini Apps still follow the system accessibility preference.
  function reduced(){
   const client=root.BounteraClient;
   const demo=['local-demo','server-demo'].includes(client?.mode)&&(client?.ready||root.location?.protocol==='file:');
   const prototype=demo&&!root.Telegram?.WebApp?.initData;
   return media.matches&&!(prototype&&root.BounteraConfig?.motion?.browserPrototype==='full');
  }
  function animate(el,frames,opts){animations.get(el)?.cancel();const a=el.animate?.(frames,opts);if(a)animations.set(el,a);return a;}
  function replaceNumber(el,text,moving){
   if(el.textContent===text)return;
   const previous=el.textContent;ghosts.get(el)?.remove();ghosts.delete(el);
   el.textContent=text;
   if(!moving||reduced())return;
   const ghost=document.createElement('span');ghost.className='number-ghost';ghost.textContent=previous;ghost.setAttribute('aria-hidden','true');el.parentElement.append(ghost);ghosts.set(el,ghost);
   const a=animate(ghost,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-4px)'}],{duration:200,easing:'ease-out',fill:'forwards'});
   a?.finished.then(()=>{ghost.remove();if(ghosts.get(el)===ghost)ghosts.delete(el);animations.delete(ghost);}).catch(()=>{});
   animate(el,[{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,easing:'ease-out'});
  }
  function flash(el,text,duration=900){
   if(!text)return;el.textContent=text;
   animate(el,[{opacity:0,transform:'translateY(0)'},{opacity:1,offset:.2,transform:'translateY(-2px)'},{opacity:1,offset:.6,transform:'translateY(-4px)'},{opacity:0,transform:'translateY(-6px)'}],{duration,easing:'ease-out'});
  }
  const view={
   ring(ratio){const width=Math.max(0,Math.min(1,ratio))*340;fill.setAttribute('width',width);clip.setAttribute('width',width);fill.style.visibility=ratio>0?'visible':'hidden';},
   balance(cents,target){$('balance-number').textContent=money(cents);const chars=money(target).length;$('balance-number').style.transform=chars>6?'scaleX('+6/chars+')':'none';$('balance').setAttribute('aria-label',money(target)+' CR');},
   labels(p,moving){replaceNumber($('view-number'),String(p.views),moving);$('view-target').textContent=' / '+p.target;
    const remaining=p.left+' more views until the bonus';if($('remaining').textContent!==remaining){$('remaining').textContent=remaining;if(moving&&!reduced())animate($('remaining'),[{opacity:.25},{opacity:1}],{duration:200});}
    $('next-bonus').textContent='+'+(p.bonusCents/100).toLocaleString('en-US',{maximumFractionDigits:2})+' CR';$('series-label').textContent=root.BounteraI18n.t('series',{number:p.number});
    gauge.setAttribute('aria-valuenow',p.views);gauge.setAttribute('aria-valuemax',p.target);gauge.setAttribute('aria-valuetext',p.views+' of '+p.target+' ads watched');lastLabels=p;
   },
   pulse(segments){paths.forEach((path,i)=>{const s=segments[i];path.setAttribute('d',s&&s.end>s.start?'M'+(s.start*340)+' 4.5 H'+(s.end*340):'');path.setAttribute('opacity',s?.opacity||0);});},
   opacity(value){fill.style.opacity=value;parts.forEach(el=>el.style.opacity=value);$('arc-pulse').style.opacity=value;},
   reward(cents){flash($('balance-reward'),'+'+money(cents)+' CR');},
   bonus(cents,base){flash($('bonus-reward'),'+'+money(cents)+' CR credited',1050);$('motion-announcement').textContent='Ad reward: +'+money(base)+' CR. Milestone bonus: +'+money(cents)+' CR.';},
   busy(){onBusy?.();},
   clear(){animations.forEach(a=>a.cancel());animations.clear();ghosts.forEach(g=>g.remove());ghosts.clear();$('balance-reward').textContent='';$('bonus-reward').textContent='';}
  };
  const motion=M.create({view});
  function syncPreference(){const value=reduced();document.documentElement?.setAttribute('data-motion',value?'reduced':'full');motion.setReduced(value);}
  syncPreference();
  function visibility(){motion.setVisible(routeVisible&&intersects&&!document.hidden);}
  media.addEventListener?.('change',syncPreference);
  document.addEventListener('visibilitychange',visibility);
  if(root.IntersectionObserver)new IntersectionObserver(entries=>{intersects=entries[0].isIntersecting;visibility();},{threshold:0}).observe(card);
  return {update(next,options){syncPreference();motion.update(next,options);},get busy(){return motion.busy;},setRouteVisible(value){routeVisible=value;visibility();}};
 };
})(typeof globalThis!=='undefined'?globalThis:window);
