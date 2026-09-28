const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../assets/engine.js'),C=require('../assets/config.js'),UI=require('../assets/home-ui.js');
const T=Date.UTC(2026,8,27,12);
function helpers(){return {t:(en)=>en,loc:x=>Array.isArray(x)?x[0]:x,icon:()=>'',btn:(label,a)=>`<button data-action="${a}">${label}</button>`,data:x=>(x/1000000).toFixed(4),cr:x=>(x/100).toFixed(2),num:String,duration:x=>String(Math.max(0,x)),busy:()=>false};}
test('first claim, advertisement cooldown, doubled reward and expired boost share one reserved slot',()=>{
 let s=E.apply(E.initial(C,T),'homeLaunch',{},T,'ui-launch').state;
 const views=[E.view(s,T+60000)];s=E.apply(s,'homeCollect',{galaxy:'aurora'},T+60000,'ui-claim').state;views.push(E.view(s,T+60000));
 let ad=E.apply(s,'adStart',{purpose:'firstReward'},T+61000,'ui-ad');s=E.apply(ad.state,'adConfirm',{id:ad.ad.id},T+65000,'ui-confirm').state;
 views.push(E.view(s,T+65000),E.view(s,T+400000),E.view(s,T+2000000));
 const ui=UI.create(helpers()),html=views.map(v=>ui.render(v));
 for(const text of html){assert.equal((text.match(/class="claim-card"/g)||[]).length,1);assert.equal((text.match(/class="claim-slot"/g)||[]).length,1);assert.equal((text.match(/class="mini-card activity-tile"/g)||[]).length,4);assert(!/journey-reserve|journey-welcome|journey-bonus/.test(text));assert(text.indexOf('class="claim-slot"')<text.indexOf('compact-activities'));assert(!/data-action="claim"/.test(text));}
 assert(html[1].includes('data-action="homeDouble"'));assert(html[2].includes('data-home-live="ad"'));assert(html[3].includes('data-home-live="welcome"'));assert(html[4].includes('Your swarm is online'));
});
test('Home feedback waits for confirmation and uses exact collected DATA; failures show no reward',async()=>{
 for(const success of [true,false]){let resolve,shown=[];const context={MotionUI:{claim:(...args)=>shown.push(args)}};vm.createContext(context);vm.runInContext(fs.readFileSync('assets/home-ui.js','utf8'),context);
 const ui=context.HomeUI.create({...helpers(),view:()=>({home:{galaxy:{id:'aurora'}},state:{settings:{microPerData:1000000}}}),action:()=>new Promise(r=>resolve=r),toast:()=>{}});
 const pending=ui.click('homeCollect');assert.equal(shown.length,0);resolve(success?{collected:79500,credited:3}:null);await pending;assert.equal(shown.length,success?1:0);if(success)assert.deepEqual(shown[0],[79500,1000000]);}
});
