"""Read the original artwork; record white stripe cores as SVG mask paths.
The PNG is never written. Sampling is confined to the traced light strips.
"""
import re, json, math, hashlib
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[2]
source = root / 'assets/aurora-device-layer.png'
im = Image.open(source).convert('RGBA')
js = (root / 'assets/home-device-motion.js').read_text(encoding='utf-8')
paths = [re.search(r"const front='([^']+)'", js).group(1)]
paths += re.findall(r"\['([^']+)',\d+\]", js)
def samples(d):
    tokens = re.findall(r'[MCLQ]|-?\d+(?:\.\d+)?', d)
    i, p, out = 0, None, []
    while i < len(tokens):
        command = tokens[i]; i += 1
        count = {'M':2, 'L':2, 'Q':4, 'C':6}[command]
        values = list(map(float, tokens[i:i+count])); i += count
        q = list(zip(values[::2], values[1::2]))
        if command == 'M': p = q[0]; out.append(p); continue
        controls = [p] + q
        for j in range(401):
            t = j / 400; n = len(controls) - 1
            out.append(tuple(sum(math.comb(n,k)*(1-t)**(n-k)*t**k*controls[k][axis] for k in range(n+1)) for axis in [0,1]))
        p = q[-1]
    return out
shapes, counts = [], []
for d in paths:
    candidates = set()
    for x, y in samples(d):
        x,y = round(x),round(y)
        for dy in range(-7,8):
            for dx in range(-7,8):
                if dx*dx+dy*dy <= 49: candidates.add((x+dx,y+dy))
    rows = {}
    for x,y in candidates:
        if not(0<=x<im.width and 0<=y<im.height): continue
        r,g,b,a = im.getpixel((x,y))
        if r>=230 and g>=235 and b>=248 and a>0: rows.setdefault(y,[]).append(x)
    segments = []
    for y, xs in sorted(rows.items()):
        xs.sort(); begin = prev = xs[0]
        for x in xs[1:] + [None]:
            if x is not None and x == prev+1: prev=x; continue
            width = prev-begin+1
            segments.append(f'M{begin} {y}h{width}v1h-{width}z')
            begin=prev=x
    shapes.append(''.join(segments)); counts.append(sum(map(len,rows.values())))
result = {'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(), 'viewBox':[0,0,im.width,im.height], 'whitePixels':counts, 'shapes':shapes}
(root / 'outputs/qa/device-strip-mask-data.json').write_text(json.dumps(result),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='shapes'}))
