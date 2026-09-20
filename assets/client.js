(function(root){
 'use strict';
 const C=root.BounteraConfig,E=root.BounteraEngine,clone=x=>JSON.parse(JSON.stringify(x));
 let state,csrf='',mode='local-demo',ready=false,timeOffset=0,pending={};
 const get=key=>{try{return localStorage.getItem(key);}catch{return null;}};
 const set=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
 function localLoad(){let saved;try{saved=JSON.parse(get(C.storageKey));}catch{}if(saved?.version===2&&!get(C.storageKey+':pre-cr-v3'))set(C.storageKey+':pre-cr-v3',JSON.stringify(saved));return E.migrate(saved,C);}
 state=localLoad();
 function accept(result){if(result.serverTime)timeOffset=result.serverTime-Date.now();if(result.state)state=result.state;return {...result,state:clone(state)};}
 async function request(url,options={}){const response=await fetch(url,{credentials:'same-origin',...options});const value=await response.json();if(!response.ok){const e=new Error(value.error||'Request failed.');e.status=response.status;throw e;}return value;}
 async function init(){
  if(location.protocol==='file:'||C.transport==='local-demo'){ready=true;set(C.storageKey,JSON.stringify(state));return {state:clone(state),mode};}
  const response=await fetch('/api/bootstrap',{credentials:'same-origin'});
  if(response.status===404||(response.ok&&!(response.headers.get('content-type')||'').includes('application/json'))){if(C.transport==='server')throw new Error('Bountera server is required.');ready=true;set(C.storageKey,JSON.stringify(state));return {state:clone(state),mode};}
  if(!response.ok)throw new Error('The Bountera server is unavailable. Please retry.');
  const info=await response.json();if(info.api!=='bountera-v3')throw new Error('Unexpected server response.');
  mode=info.mode==='demo'?'server-demo':'server';
  let result=info;
  if(!info.authenticated){
   if(mode==='server'&&!root.Telegram?.WebApp)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://telegram.org/js/telegram-web-app.js';script.onload=resolve;script.onerror=()=>reject(new Error('Telegram could not load. Please retry.'));document.head.append(script);});
   const initData=root.Telegram?.WebApp?.initData||'';
   if(mode==='server'&&!initData)throw new Error('Open this app from its Telegram bot to sign in.');
   result=await request('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({initData})});
  }
  csrf=result.csrf;ready=true;accept(result);return {...result,state:clone(state),mode};
 }
 async function mutate(action,payload={}){
  if(!ready)throw new Error('Please wait for your account to load.');
  if(mode==='local-demo'){
   const run=()=>{const current=localLoad(),out=E.apply(current,action,payload);state=out.state;set(C.storageKey,JSON.stringify(state));return out;};
   return navigator.locks?.request?navigator.locks.request('bountera-demo-state',run):run();
  }
  const signature=JSON.stringify({action,payload}),key=pending[signature]||(pending[signature]=crypto.randomUUID());
  let result;
  for(let attempt=0;attempt<2;attempt++)try{result=await request('/api/action',{method:'POST',...(action.startsWith('farm')?{signal:AbortSignal.timeout(15000)}:{}),headers:{'Content-Type':'application/json','X-CSRF-Token':csrf,'Idempotency-Key':key},body:JSON.stringify({action,payload})});break;}catch(e){if(e.status||attempt){if(e.status)delete pending[signature];throw e;}}
  delete pending[signature];return accept(result);
 }
 async function refresh(){if(!ready)throw new Error('Account is not loaded.');if(mode==='local-demo')return mutate('refresh');return accept(await request('/api/state'));}
 function reset(){if(mode!=='local-demo')throw new Error('Reset is available only in the offline demo.');state=E.initial(C);set(C.storageKey,JSON.stringify(state));return clone(state);}
 function requireFarmServer(){if(!ready)throw new Error('Your account is still loading.');if(mode==='local-demo')throw new Error('Farm requires the app server. This offline preview cannot start or claim sessions.');}
 async function farmState(){requireFarmServer();const out=await request('/api/farm',{signal:AbortSignal.timeout(15000)});if(out.farm.session)delete pending[JSON.stringify({action:'farmStart',payload:{}})];return accept(out);}
 async function farmAction(action,payload={}){requireFarmServer();if(!['farmStart','farmClaim'].includes(action))throw new Error('Invalid Farm action.');return mutate(action,payload);}
 root.BounteraClient={init,mutate,refresh,reset,farmState,farmAction,get state(){return clone(state);},get mode(){return mode;},get ready(){return ready;},get isDemo(){return mode!=='server';},now:()=>Date.now()+timeOffset};
})(typeof globalThis!=='undefined'?globalThis:window);
