const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const E=require('../assets/engine.js'),C=require('../assets/config.js');
function fixture({empty=true,reject=false,persistent=false}={}){
 const time=Date.UTC(2026,8,21),state=E.initial(C,time);state.user.language='en';if(empty)state.mine.micro=0;
 const events={},windowEvents={},classes={add(){},remove(){},toggle(){}};let renders=0,mutations=0,entrances=0,markup='';
 const parts={'.header':{},'main':{},'.bottom-nav':{}},shell={classList:classes,querySelector:key=>parts[key]||null};
 const toast={textContent:'',classList:classes},app={get innerHTML(){return markup},set innerHTML(value){markup=value;renders++},scrollTo(){},querySelector(){return persistent?shell:{classList:classes}}},modal={open:false,classList:classes,close(){},addEventListener(){},querySelectorAll(){return []}};
 const document={hidden:false,documentElement:{},getElementById:id=>({app,modal,toast}[id]),addEventListener:(name,fn)=>events[name]=fn,querySelector:()=>null,querySelectorAll:()=>[]};
 const client={ready:true,state,now:()=>time,init:()=>new Promise(()=>{}),refresh:async()=>state,mutate:async()=>{mutations++;if(reject)throw Error('Accumulate at least 0.01 CR / Накопите хотя бы 0.01 CR');if(persistent)return {state,credited:1};throw Error('Unexpected mutation');}};
 const context={RewardMiningSystem:require('../assets/reward-mining-system.js'),RewardAdAdapter:require('../assets/reward-adapter.js'),MotionUI:{number(){},animate(){},enterPage(){entrances++;},dialogBounds(){},credit(){}},NodeSystem:require('../assets/node-system.js'),NodeUI:require('../assets/node-ui.js'),MiningConfig:C,MiningEngine:E,MiningClient:client,document,window:{addEventListener:(name,fn)=>windowEvents[name]=fn,scrollTo(){}},setTimeout:()=>0,clearTimeout(){},setInterval(){},location:{hash:'#/home'}};
 context.ContractsUI=require('../assets/contracts-ui.js');context.TelegramViewport={create:()=>({capture(){}})};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/home-ui.js'),'utf8'),context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/app.js'),'utf8'),context);
 return {toast,state,parts,get renders(){return renders},get mutations(){return mutations},get entrances(){return entrances},get markup(){return markup},click:(action='claim',dataset={})=>events.click({target:{closest:()=>({dataset:{action,...dataset},disabled:false})}}),hashchange(hash){context.location.hash=hash;windowEvents.hashchange();}};
}
test('sub-cent Claim shows feedback without rebuilding layout or sending a mutation',async()=>{
 const f=fixture(),balance=f.state.balance.cr;await f.click();await f.click();
 assert.equal(f.toast.textContent,'Accumulate at least 0.01 CR');assert.equal(f.renders,0);assert.equal(f.mutations,0);assert.equal(f.state.balance.cr,balance);
});
test('server minimum-claim rejection remains toast-only and does not insert a banner',async()=>{
 const f=fixture({empty:false,reject:true}),balance=f.state.balance.cr;await f.click();
 assert.equal(f.mutations,1);assert.equal(f.toast.textContent,'Accumulate at least 0.01 CR');assert(!f.markup.includes('class="error-banner"'));assert.equal(f.state.balance.cr,balance);
});

test('successful Home Claim updates controls without replacing the planet container',async()=>{const f=fixture({empty:false,persistent:true});await f.click();assert.equal(f.mutations,1);assert.equal(f.renders,0);assert(f.parts.main.innerHTML.includes('journey-hero'));assert(f.parts['.header'].outerHTML.includes('Bountera'));});

test('tab click renders once and its following hash event retains the entrance page',async()=>{const f=fixture();await f.click('go',{page:'tasks'});assert.equal(f.renders,1);assert.equal(f.entrances,1);const markup=f.markup;f.hashchange('#/tasks');assert.equal(f.renders,1);assert.equal(f.entrances,1);assert.equal(f.markup,markup);});
test('external hash navigation still renders each different page and supports returning Home',()=>{const f=fixture();f.hashchange('#/tasks');assert.equal(f.renders,1);assert.equal(f.entrances,1);assert(f.markup.includes('Make every action count'));f.hashchange('#/friends');assert.equal(f.renders,2);f.hashchange('#/home');assert.equal(f.renders,3);assert.equal(f.entrances,3);assert(f.markup.includes('home-screen'));});
