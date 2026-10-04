from pathlib import Path
import re
root=Path(__file__).resolve().parents[2]
folder=root/'outputs/qa/tma-viewport-before'
css=(folder/'app.css').read_text(encoding='utf-8')
css=re.sub(r"url\('([^']+)'\)", lambda m: "url('"+(root/'assets'/m.group(1)).as_uri()+"')" if (root/'assets'/m.group(1)).is_file() else m.group(0),css)
(folder/'reference.css').write_text(css,encoding='utf-8')
html=(folder/'index.html').read_text(encoding='utf-8')
html=html.replace('<head>','<head><base href="'+root.as_uri()+'/">')
html=re.sub(r'assets/app.css\?v=[^"\']+', (folder/'reference.css').as_uri(),html)
for name in ['app','motion']:
    html=re.sub('assets/'+name+r'.js\?v=[^"\']+', (folder/(name+'.js')).as_uri(),html)
(folder/'reference.html').write_text(html,encoding='utf-8')
