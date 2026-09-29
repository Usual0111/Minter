'use strict';
const {createHmac,timingSafeEqual}=require('node:crypto');
function validHex(actual,expected){return typeof actual==='string'&&/^[a-f0-9]{64}$/i.test(actual)&&timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(expected,'hex'));}
function verifyTelegram(initData,botToken,now=Date.now()){
 if(!botToken||typeof initData!=='string')throw new Error('Telegram authentication is not configured.');
 const data=new URLSearchParams(initData),seen=new Set();for(const [key]of data){if(seen.has(key))throw new Error('Duplicate Telegram field.');seen.add(key);}
 const signature=data.get('hash');data.delete('hash');
 const check=[...data].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+'='+v).join('\n');
 const secret=createHmac('sha256','WebAppData').update(botToken).digest();
 const expected=createHmac('sha256',secret).update(check).digest('hex');
 if(!validHex(signature,expected))throw new Error('Invalid Telegram signature.');
 const age=now/1000-Number(data.get('auth_date'));if(!Number.isFinite(age)||age< -30||age>3600)throw new Error('Telegram login data has expired.');
 const user=JSON.parse(data.get('user')||'null');if(!user||!Number.isSafeInteger(user.id)||user.id<=0)throw new Error('Invalid Telegram user.');return user;
}
function verifyProvider(raw,signature,timestamp,secret,now=Date.now()){
 if(!secret)throw new Error('Provider confirmation is not configured.');
 if(!/^\d{10,13}$/.test(String(timestamp)))throw new Error('Invalid callback timestamp.');
 const time=Number(timestamp);if(Math.abs(now-(time<1e12?time*1000:time))>300000)throw new Error('Callback has expired.');
 const expected=createHmac('sha256',secret).update(String(timestamp)+'.'+raw).digest('hex');if(!validHex(signature,expected))throw new Error('Invalid callback signature.');
}
module.exports={verifyTelegram,verifyProvider};
