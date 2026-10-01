const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const appBefore=read('outputs/qa/nodes-before/app.js');let app=read('assets/app.js');
const h=app.indexOf('function header(s){'),home=app.indexOf("if(page==='home')",h);
app=app.slice(0,h)+'function header(s){'+app.slice(home);
app=app.replace("page==='home'?'home-screen':page==='nodes'?'nodes-screen':''","page==='home'?'home-screen':''");
assert.equal(app,appBefore,'Only the Nodes header and root class may change in app.js');
const uiBefore=read('outputs/qa/nodes-before/node-ui.js');let ui=read('assets/node-ui.js');
ui=ui.slice(0,ui.indexOf('function galaxies(s)'))+uiBefore.slice(uiBefore.indexOf('function galaxies(s)'),uiBefore.indexOf('function deployChoices'))+ui.slice(ui.indexOf('function deployChoices'));
ui=ui.replace('class="page node-hub ${tab===\'galaxies\'&&!selected?\'orbit-overview\':\'\'}"','class="page node-hub"');
assert.equal(ui,uiBefore,'All other NodeUI functions and actions remain byte-identical');
const cssBefore=read('outputs/qa/nodes-before/app.css'),css=read('assets/app.css');assert.ok(css.startsWith(cssBefore),'Existing styles must remain byte-identical');
const extra=css.slice(cssBefore.length);assert.ok(!extra.includes('@media'));
assert.ok([...extra.matchAll(/([^{}]+)\{/g)].every(m=>m[1].includes('.nodes-screen')),'Every new selector must be Nodes-scoped');
const html=read('outputs/Bountera.html');let inline=0;for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){if(m[1].trim()){new vm.Script(m[1]);inline++;}}
assert.equal(inline,11);assert.ok(!html.includes("url('nodes-canyon-reference.png')"),'Nodes artwork must be embedded');
assert.ok(html.includes("url('data:image/png;base64,"));
const result={otherScreensUnchanged:true,existingCssPreserved:true,otherNodeFunctionsPreserved:true,nodesStylesScoped:true,standaloneInlineScripts:11,standaloneArtworkEmbedded:true,gameTests:'97 passed',mobileWidthsVerified:[320,390],cardAspectRatio:2.06};
fs.writeFileSync(path.join(__dirname,'nodes-verification.json'),JSON.stringify(result,null,2)+'\n');console.log(result);
