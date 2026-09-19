'use strict';
const {DatabaseSync}=require('node:sqlite');
const {createHash,randomBytes}=require('node:crypto');
const E=require('../assets/engine.js'),defaults=require('../assets/app-config.js');
const clone=x=>JSON.parse(JSON.stringify(x));
const hash=x=>createHash('sha256').update(x).digest('hex');
class Store{
 constructor(filename,config=defaults){
  this.config=clone(config);this.db=new DatabaseSync(filename);this.db.exec(`PRAGMA busy_timeout=10000; PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
   CREATE TABLE IF NOT EXISTS accounts(user_id TEXT PRIMARY KEY,state TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS ledger(user_id TEXT NOT NULL,id TEXT NOT NULL,type TEXT NOT NULL,cents INTEGER NOT NULL,source TEXT,series INTEGER,threshold INTEGER,status TEXT NOT NULL,record TEXT NOT NULL,PRIMARY KEY(user_id,id));
   CREATE UNIQUE INDEX IF NOT EXISTS one_source_reward ON ledger(user_id,type,source) WHERE type IN ('ad','task','milestone','daily','promo');
   CREATE UNIQUE INDEX IF NOT EXISTS one_series_bonus ON ledger(user_id,series,threshold) WHERE type='milestone';
   CREATE TABLE IF NOT EXISTS ad_sessions(user_id TEXT NOT NULL,id TEXT NOT NULL,status TEXT NOT NULL,record TEXT NOT NULL,PRIMARY KEY(user_id,id));
   CREATE TABLE IF NOT EXISTS requests(user_id TEXT NOT NULL,id TEXT NOT NULL,fingerprint TEXT NOT NULL,result TEXT NOT NULL,PRIMARY KEY(user_id,id));
   CREATE TABLE IF NOT EXISTS provider_events(provider TEXT NOT NULL,event_id TEXT NOT NULL,fingerprint TEXT NOT NULL,user_id TEXT NOT NULL,result TEXT NOT NULL,PRIMARY KEY(provider,event_id));
   CREATE TABLE IF NOT EXISTS login_sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,csrf TEXT NOT NULL,expires_at INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS farm_sessions(user_id TEXT NOT NULL,id TEXT NOT NULL,started_at INTEGER NOT NULL,ends_at INTEGER NOT NULL,duration_ms INTEGER NOT NULL,reward_cents INTEGER NOT NULL,claimed_at INTEGER,ledger_id TEXT,record TEXT NOT NULL,PRIMARY KEY(user_id,id));
   CREATE UNIQUE INDEX IF NOT EXISTS one_open_farm_session ON farm_sessions(user_id) WHERE claimed_at IS NULL;
   CREATE UNIQUE INDEX IF NOT EXISTS one_farm_credit ON ledger(user_id,source) WHERE type='farm';
   CREATE UNIQUE INDEX IF NOT EXISTS one_node_operation ON ledger(user_id,type,source) WHERE type IN ('node_reward','node_upgrade','node_restore');
  `);
 }
 transaction(fn){this.db.exec('BEGIN IMMEDIATE');try{const value=fn();this.db.exec('COMMIT');return value;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 read(userId){const row=this.db.prepare('SELECT state FROM accounts WHERE user_id=?').get(userId);if(!row)throw new Error('Account not found.');const state=E.migrate(JSON.parse(row.state),this.config);state.settings.farm=clone(this.config.farm||require('../assets/farm-engine.js').defaults);return state;}
 persist(userId,state){
  this.db.prepare('INSERT INTO accounts(user_id,state) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET state=excluded.state').run(userId,JSON.stringify(state));
  const ledger=this.db.prepare('INSERT INTO ledger(user_id,id,type,cents,source,series,threshold,status,record) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,id) DO UPDATE SET status=excluded.status,record=excluded.record');
  for(const t of state.ledger)ledger.run(userId,t.id,t.type,t.cr||0,t.reference||null,t.seriesNumber??null,t.threshold??null,t.status,JSON.stringify(t));
  const ads=this.db.prepare('INSERT INTO ad_sessions(user_id,id,status,record) VALUES(?,?,?,?) ON CONFLICT(user_id,id) DO UPDATE SET status=excluded.status,record=excluded.record');
  for(const a of Object.values(state.ads.sessions))ads.run(userId,a.id,a.status,JSON.stringify(a));
  const farms=this.db.prepare('INSERT INTO farm_sessions VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,id) DO UPDATE SET claimed_at=excluded.claimed_at,ledger_id=excluded.ledger_id,record=excluded.record');
  for(const f of state.farm?.sessions||[])farms.run(userId,f.id,f.startedAt,f.endsAt,f.durationMs,f.rewardCents,f.claimedAt,f.ledgerId,JSON.stringify(f));
 }
 ensureUser(userId,profile={},demo=false,now=Date.now()){
  return this.transaction(()=>{const found=this.db.prepare('SELECT 1 FROM accounts WHERE user_id=?').get(userId);if(found){const state=this.read(userId);this.persist(userId,state);return state;}
   const state=E.initial(this.config,now);state.user={...state.user,id:userId,...profile};
   if(!demo){state.balance={cr:0,asset:0,reserved:0};state.energy=0;state.cycle=0;state.series.number=1;state.ledger=[];state.promos=[];}
   this.persist(userId,state);return state;
  });
 }
 applyInside(userId,action,payload,now){const result=E.apply(this.read(userId),action,payload,now);this.persist(userId,result.state);return result;}
 act(userId,action,payload={},requestId,now=Date.now()){
  if(typeof requestId!=='string'||requestId.length<8||requestId.length>200)throw new Error('A valid idempotency key is required.');
  return this.transaction(()=>{const fingerprint=hash(JSON.stringify({action,payload})),prior=this.db.prepare('SELECT * FROM requests WHERE user_id=? AND id=?').get(userId,requestId);
   if(prior){if(prior.fingerprint!==fingerprint)throw new Error('Idempotency key was reused for a different request.');return {...JSON.parse(prior.result),state:this.read(userId),replayed:true};}
   const result=this.applyInside(userId,action,payload,now),{state,...saved}=result;
   this.db.prepare('INSERT INTO requests VALUES(?,?,?,?)').run(userId,requestId,fingerprint,JSON.stringify(saved));return result;
  });
 }
 providerEvent(provider,event,now=Date.now()){
  if(!event||typeof event.eventId!=='string'||!event.eventId||typeof event.userId!=='string'||!['ad','task'].includes(event.kind))throw new Error('Invalid provider event.');
  return this.transaction(()=>{const fingerprint=hash(JSON.stringify(event)),prior=this.db.prepare('SELECT * FROM provider_events WHERE provider=? AND event_id=?').get(provider,event.eventId);
   if(prior){if(prior.fingerprint!==fingerprint)throw new Error('Conflicting provider event.');return {...JSON.parse(prior.result),state:this.read(prior.user_id),replayed:true};}
   const action=event.kind==='ad'?'confirmAd':'verifyTask',payload=event.kind==='ad'?{id:event.sessionId}:{id:event.taskId,approved:true};
   const result=this.applyInside(event.userId,action,payload,now),{state,...saved}=result;
   this.db.prepare('INSERT INTO provider_events VALUES(?,?,?,?,?)').run(provider,event.eventId,fingerprint,event.userId,JSON.stringify(saved));return result;
  });
 }
 login(userId,now=Date.now()){const token=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex'),expiresAt=now+30*86400000;this.db.prepare('INSERT INTO login_sessions VALUES(?,?,?,?)').run(hash(token),userId,csrf,expiresAt);return {token,csrf,expiresAt};}
 session(token,now=Date.now()){if(!token)return null;return this.db.prepare('SELECT user_id,csrf,expires_at FROM login_sessions WHERE token_hash=? AND expires_at>?').get(hash(token),now)||null;}
 close(){this.db.close();}
}
module.exports={Store};
