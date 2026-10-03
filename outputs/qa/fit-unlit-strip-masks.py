"""Read both artworks without editing them; fit SVG cores to unlit gray inlays."""
import json,re,hashlib
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[2]
source=root/'assets/aurora-device-layer-lights-off.png'
original=root/'assets/aurora-device-layer.png'
im=Image.open(source)
prior=json.loads((root/'outputs/qa/device-strip-mask-data.json').read_text())
shapes=[]
counts=[]
for shape in prior['shapes']:
    candidates=set()
    for x,y,w in re.findall(r'M(\d+) (\d+)h(\d+)v1',shape):
        x,y,w=map(int,(x,y,w))
        for px in range(x,x+w):
            candidates.update((px+dx,y+dy) for dx,dy in [(0,0),(-1,0),(1,0),(0,-1),(0,1)])
    rows={}
    for x,y in candidates:
        r,g,b,a=im.getpixel((x,y))
        # Gray insert cores retain their real contour. Exclude the dark inset
        # borders; the narrow one-pixel search cannot reach metal or camera.
        if min(r,g,b)>=155 and max(r,g,b)<=238 and max(r,g,b)-min(r,g,b)<=20 and a>0:
            rows.setdefault(y,[]).append(x)
    segments=[]
    for y,xs in sorted(rows.items()):
        xs.sort();start=last=xs[0]
        for x in xs[1:]+[None]:
            if x is not None and x==last+1:last=x;continue
            w=last-start+1;segments.append(f'M{start} {y}h{w}v1h-{w}z');start=last=x
    shapes.append(''.join(segments));counts.append(sum(map(len,rows.values())))
data={'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'originalSha256':hashlib.sha256(original.read_bytes()).hexdigest(),'viewBox':[0,0,*im.size],'grayPixels':counts,'shapes':shapes}
(root/'outputs/qa/device-unlit-strip-mask-data.json').write_text(json.dumps(data),encoding='utf8')
jsfile=root/'assets/home-device-motion.js'
js=jsfile.read_text(encoding='utf8')
js=re.sub(r'const maskShapes=\[.*?\];', 'const maskShapes='+json.dumps(shapes)+';',js,count=1)
jsfile.write_text(js,encoding='utf8')
print('Gray insert mask pixels:',counts)
