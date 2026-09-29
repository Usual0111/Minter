const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../assets/engine.js'),C=require('../assets/config.js'),UI=require('../assets/home-ui.js');
const T=Date.UTC(2026,8,27,12);
function helpers(){return {t:(en)=>en,loc:x=>Array.isArray(x)?x[0]:x,icon:()=>'',btn:(label,a)=>`<button data-action="${a}">${label}</button>`,data:x=>(x/1000000).toFixed(4),cr:x=>(x/100).toFixed(2),num:String,duration:x=>String(Math.max(0,x)),busy:()=>false};}
test('Home feedback waits for confirmation and uses exact collected DATA; failures show no reward',async()=>{
 for(const success of [true,false]){let resolve,shown=[];const context={MotionUI:{claim:(...args)=>shown.push(args)}};vm.createContext(context);vm.runInContext(fs.readFileSync('assets/home-ui.js','utf8'),context);
 const ui=context.HomeUI.create({...helpers(),view:()=>({home:{galaxy:{id:'aurora'}},state:{settings:{microPerData:1000000}}}),action:()=>new Promise(r=>resolve=r),toast:()=>{}});
 const pending=ui.click('homeCollect');assert.equal(shown.length,0);resolve(success?{collected:79500,credited:3}:null);await pending;assert.equal(shown.length,success?1:0);if(success)assert.deepEqual(shown[0],[79500,1000000]);}
});
