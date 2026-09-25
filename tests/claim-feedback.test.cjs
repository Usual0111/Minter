const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const E=require('../assets/engine.js'),C=require('../assets/config.js');
function fixture({empty=true,reject=false}={}){
 const time=Date.UTC(2026,8,21),state=E.initial(C,time);state.user.language='en';if(empty)state.mine.micro=0;
 const events={},classes={add(){},remove(){},toggle(){}};let renders=0,mutations=0,markup='';
 const toast={textContent:'',classList:classes},app={get innerHTML(){return markup},set innerHTML(value){markup=value;renders++},querySelector(){return {classList:classes}}},modal={addEventListener(){},querySelectorAll(){return []}};
 const document={hidden:false,documentElement:{},getElementById:id=>({app,modal,toast}[id]),addEventListener:(name,fn)=>events[name]=fn,querySelectorAll:()=>[]};
 const client={ready:true,state,now:()=>time,init:()=>new Promise(()=>{}),refresh:async()=>state,mutate:async()=>{mutations++;if(reject)throw Error('Accumulate at least 0.01 CR / Накопите хотя бы 0.01 CR');throw Error('Unexpected mutation');}};
 const context={NodeSystem:require('../assets/node-system.js'),NodeUI:require('../assets/node-ui.js'),MiningConfig:C,MiningEngine:E,MiningClient:client,document,window:{addEventListener(){}},setTimeout:()=>0,clearTimeout(){},setInterval(){},location:{hash:'#/home'}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/app.js'),'utf8'),context);
 return {toast,state,get renders(){return renders},get mutations(){return mutations},get markup(){return markup},click:()=>events.click({target:{closest:()=>({dataset:{action:'claim'},disabled:false})}})};
}
test('sub-cent Claim shows feedback without rebuilding layout or sending a mutation',async()=>{
 const f=fixture(),balance=f.state.balance.cr;await f.click();await f.click();
 assert.equal(f.toast.textContent,'Accumulate at least 0.01 CR');assert.equal(f.renders,0);assert.equal(f.mutations,0);assert.equal(f.state.balance.cr,balance);
});
test('server minimum-claim rejection remains toast-only and does not insert a banner',async()=>{
 const f=fixture({empty:false,reject:true}),balance=f.state.balance.cr;await f.click();
 assert.equal(f.mutations,1);assert.equal(f.toast.textContent,'Accumulate at least 0.01 CR');assert(!f.markup.includes('class="error-banner"'));assert.equal(f.state.balance.cr,balance);
});
