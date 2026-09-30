const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'outputs');
fs.mkdirSync(out,{recursive:true});
let html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=fs.readFileSync(path.join(root,'assets/app.css'),'utf8');
html=html.replace(/(assets\/[\w.-]+\.(?:css|js))\?v=[^"']*/g,'$1');
const embed=name=>'data:image/'+(/\.jpe?g$/i.test(name)?'jpeg':'png')+';base64,'+fs.readFileSync(path.join(root,'assets',name)).toString('base64');
for(const name of ['node-catalog.png','deep-space.jpg','depin-space.jpg','canyon-world.png','aurora-scanner-scene.png','aurora-manta-scene.png','aurora-planet-layer.png','aurora-planet-clean.png'])css=css.replaceAll(`url('${name}')`,`url('${embed(name)}')`);
html=html.replace('<link rel="stylesheet" href="assets/app.css">',()=>`<style>${css}</style>`);
for(const name of ['config','node-system','home-system','cr-session-system','engine','client','node-ui','home-ui','motion','app']){
 let js=fs.readFileSync(path.join(root,`assets/${name}.js`),'utf8');
 for(const image of ['depin-probe.png','depin-planet.jpg','home-carrier.png','home-station.png','canyon-probe.png','aurora-device-layer.png','aurora-scanner-hologram.png'])js=js.replaceAll(`assets/${image}`,embed(image));
 html=html.replace(`<script src="assets/${name}.js"></script>`,()=>`<script>${js.replaceAll('</script','<\\/script')}</script>`);
}
for(const name of ['Bountera.html','Farm-Zone-Bot.html'])fs.writeFileSync(path.join(out,name),html);
console.log('Standalone Bountera.html ready, with all scene artwork embedded.');
