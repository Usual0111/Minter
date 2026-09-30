const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'public');
fs.mkdirSync(out,{recursive:true});
// Content versions prevent Telegram WebView from retaining an earlier stylesheet.
const index=path.join(root,'index.html');
let html=fs.readFileSync(index,'utf8').replace(/(assets\/[\w.-]+\.(?:css|js))(?:\?v=[^"']*)?/g,(_,file)=>file+'?v='+crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex').slice(0,12));
fs.writeFileSync(index,html);
fs.writeFileSync(path.join(out,'index.html'),html);
fs.cpSync(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
console.log('Versioned static build ready in public/.');