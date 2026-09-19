'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {randomUUID}=require('node:crypto');
const {Store}=require('./store.cjs'),{verifyTelegram,verifyProvider}=require('./auth.cjs');
const defaults=require('../assets/app-config.js');
const Farm=require('../assets/farm-engine.js');
function createHandler(store,options={}){
 const mode=options.mode||'demo',demo=mode==='demo',origin=options.origin||'http://127.0.0.1:4173',root=path.resolve(__dirname,'..');
 const cookies=req=>Object.fromEntries(String(req.headers.cookie||'').split(';').map(s=>s.trim().split('=')));
 const accountSession=req=>{const session=store.session(cookies(req).bountera_session);return session&&(demo||session.user_id.startsWith('telegram-'))?session:null;};
 const json=(res,status,data,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify(data));};
 const readBody=async req=>{let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>262144)throw new Error('Request is too large.');}return raw;};
 return async function handler(req,res){
  const url=new URL(req.url,origin);
  try{
   if(url.pathname==='/api/bootstrap'&&req.method==='GET'){
    const session=accountSession(req);return json(res,200,{api:'bountera-v3',mode,authenticated:!!session,csrf:session?.csrf,serverTime:Date.now(),state:session?store.read(session.user_id):null,providerConfigured:!!options.providerName&&!!options.callbackSecret});
   }
   if(url.pathname==='/api/provider/callback'&&req.method==='POST'){
    if(!options.providerName||!options.callbackSecret)return json(res,503,{error:'No provider adapter configured.'});
    const raw=await readBody(req);verifyProvider(raw,req.headers['x-provider-signature'],req.headers['x-provider-timestamp'],options.callbackSecret);
    const result=store.providerEvent(options.providerName,JSON.parse(raw));return json(res,200,{accepted:true,confirmation:result.confirmation,replayed:!!result.replayed});
   }
   if(url.pathname.startsWith('/api/')){
    if(req.method==='POST'&&req.headers.origin!==origin)return json(res,403,{error:'Invalid request origin.'});
    if(req.method==='POST'&&!String(req.headers['content-type']||'').startsWith('application/json'))return json(res,415,{error:'JSON is required.'});
    const body=req.method==='POST'?JSON.parse(await readBody(req)||'{}'):{};
    if(url.pathname==='/api/login'&&req.method==='POST'){
     let userId,profile;
     if(demo){userId='demo-'+randomUUID();profile={name:'Demo user',username:'demo'};}
     else{const u=verifyTelegram(body.initData,options.botToken);userId='telegram-'+u.id;profile={name:[u.first_name,u.last_name].filter(Boolean).join(' '),username:u.username||'',telegramId:u.id};}
     const state=store.ensureUser(userId,profile,demo),login=store.login(userId);
     return json(res,200,{state,csrf:login.csrf,mode,serverTime:Date.now()},{'Set-Cookie':`bountera_session=${login.token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=2592000${origin.startsWith('https:')?'; Secure':''}`});
    }
    const session=accountSession(req);if(!session)return json(res,401,{error:'Please sign in again.'});
    if(url.pathname==='/api/farm'&&req.method==='GET'){const now=Date.now(),state=store.read(session.user_id);return json(res,200,{state,farm:Farm.view(state,now),serverTime:now});}
    if(url.pathname==='/api/state'&&req.method==='GET')return json(res,200,{state:store.read(session.user_id),serverTime:Date.now()});
    if(req.method!=='POST'||req.headers['x-csrf-token']!==session.csrf)return json(res,403,{error:'Invalid request token.'});
    if(url.pathname==='/api/action'){
     const allowed=new Set(['refresh','claimDaily','startAd','awaitAd','cancelAd','startTask','farmStart','farmClaim']);
     const demoOnly=new Set(['nodeRefresh','nodeCollect','nodeUpgrade','nodeRestore','nodeAdStart','nodeAdConfirm','nodeAdCancel','nodeDemo','confirmAd','verifyTask','connectWallet','disconnectWallet','createQuote','exchange','withdraw','cancelWithdrawal','redeemPromo','adminAdjust','adminWithdrawal','adminPromo','adminTogglePromo','adminToggleTask','adminCreateTask','adminSettings']);
     if(!allowed.has(body.action)&&!(demo&&demoOnly.has(body.action)))return json(res,403,{error:'This action requires a verified server integration.'});
     if(body.action==='startAd'&&!demo&&(!options.providerName||!options.callbackSecret))return json(res,503,{error:'Advertising is not connected yet. Try again later.'});
     const result=store.act(session.user_id,body.action,body.payload||{},req.headers['idempotency-key']);const now=Date.now();return json(res,200,{...result,...(body.action.startsWith('farm')?{farm:Farm.view(result.state,now)}:{}),serverTime:now});
    }
    return json(res,404,{error:'Endpoint not found.'});
   }
   if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end();}
   const relative=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));
   if(relative!=='index.html'&&!/^assets\/[a-zA-Z0-9_.-]+\.(js|css|svg|png|webp)$/.test(relative)){res.writeHead(404);return res.end('Not found');}
   const file=path.join(root,relative);if(!fs.existsSync(file)){res.writeHead(404);return res.end('Not found');}
   const type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'}[path.extname(file)];
   res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});if(req.method==='HEAD')return res.end();fs.createReadStream(file).pipe(res);
  }catch(e){json(res,400,{error:e.message});}
 };
}
if(require.main===module){
 const mode=process.env.BOUNTERA_MODE||'demo',port=Number(process.env.PORT||4173),origin=process.env.PUBLIC_ORIGIN||`http://127.0.0.1:${port}`;
 if(!['demo','production'].includes(mode))throw new Error('BOUNTERA_MODE must be demo or production.');
 if(mode==='production'&&(!process.env.TELEGRAM_BOT_TOKEN||!origin.startsWith('https://')))throw new Error('Production requires TELEGRAM_BOT_TOKEN and an HTTPS PUBLIC_ORIGIN.');
 const filename=process.env.DATABASE_PATH||path.join(__dirname,'..','.data','bountera.sqlite');fs.mkdirSync(path.dirname(filename),{recursive:true});
 const config=structuredClone(defaults);config.mode=mode;config.farm=require('./farm-config.cjs');const store=new Store(filename,config);
 const server=http.createServer(createHandler(store,{mode,origin,botToken:process.env.TELEGRAM_BOT_TOKEN,providerName:process.env.AD_PROVIDER,callbackSecret:process.env.PROVIDER_CALLBACK_SECRET}));
 server.listen(port,process.env.HOST||'127.0.0.1',()=>console.log(`Bountera ${mode}: ${origin}`));
 const close=()=>server.close(()=>{store.close();process.exit(0);});process.once('SIGINT',close);process.once('SIGTERM',close);
}
module.exports={createHandler};
