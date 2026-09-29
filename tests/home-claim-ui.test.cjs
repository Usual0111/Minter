const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../assets/engine.js'),C=require('../assets/config.js'),UI=require('../assets/home-ui.js');
const T=Date.UTC(2026,8,27,12);
function helpers(){return {t:(en)=>en,loc:x=>Array.isArray(x)?x[0]:x,icon:()=>'',btn:(label,a)=>`<button data-action="${a}">${label}</button>`,data:x=>(x/1000000).toFixed(4),cr:x=>(x/100).toFixed(2),num:String,duration:x=>String(Math.max(0,x)),busy:()=>false};}
test('buffer ring reflects capacity and a separate ad button grants a real x2 boost',()=>{
 let s=E.apply(E.initial(C,T),'homeLaunch',{},T,'ring-launch').state;
 const ui=UI.create(helpers()),view=E.view(s,T+60000),html=ui.render(view);
 assert(html.includes('data-action="homeAd2"'));assert(!html.includes('data-action="homeDouble"'));assert(!html.includes('data-home-live="equivalent"'));
 assert(html.includes('data-home-live="buffer"'));assert(html.includes('stroke-dasharray:'+Math.min(100,view.home.amount/view.home.metrics.capacity*100)+' 100'));
 const ad=E.apply(s,'adStart',{purpose:'overclock',galaxy:'aurora'},T+61000,'boost-start');
 s=E.apply(ad.state,'adConfirm',{id:ad.ad.id},T+65000,'boost-confirm').state;
 const boosted=ui.render(E.view(s,T+65000));assert(/data-action="homeAd2" disabled/.test(boosted));assert(boosted.includes('Active'));
 assert.equal((boosted.match(/class="mini-card activity-tile"/g)||[]).length,4);
 const full=E.view(s,T+66000);full.home.amount=full.home.metrics.capacity*2;assert(ui.render(full).includes('stroke-dasharray:100 100'));
});
test('Home feedback waits for confirmation and uses exact collected DATA; failures show no reward',async()=>{
 for(const success of [true,false]){let resolve,shown=[];const context={MotionUI:{claim:(...args)=>shown.push(args)}};vm.createContext(context);vm.runInContext(fs.readFileSync('assets/home-ui.js','utf8'),context);
 const ui=context.HomeUI.create({...helpers(),view:()=>({home:{galaxy:{id:'aurora'}},state:{settings:{microPerData:1000000}}}),action:()=>new Promise(r=>resolve=r),toast:()=>{}});
 const pending=ui.click('homeCollect');assert.equal(shown.length,0);resolve(success?{collected:79500,credited:3}:null);await pending;assert.equal(shown.length,success?1:0);if(success)assert.deepEqual(shown[0],[79500,1000000]);}
});
