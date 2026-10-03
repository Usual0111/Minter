"""Inspect screenshots only; do not edit either device asset."""
from PIL import Image
import numpy as np,json,re
from pathlib import Path
p=Path(__file__).parent
masks=json.loads((p/'device-unlit-strip-mask-data.json').read_text())['shapes']
result=[]
for w in [360,390,430]:
    a=np.array(Image.open(p/f'device-ice-{w}-idle.png')).astype(int)
    height,width=a.shape[:2]
    camera=(slice(round(755*height/1024),round(895*height/1024)),slice(round(240*width/1536),round(380*width/1536)))
    allowed=np.zeros((height,width),dtype=bool)
    for shape in masks:
        for x,y,n in re.findall(r'M(\d+) (\d+)h(\d+)v1',shape):
            x,y,n=map(int,(x,y,n))
            # Sixteen source pixels of local Gaussian halo plus rasterization.
            left=max(0,int((x-16)*width/1536)-1);right=min(width,int((x+n+16)*width/1536)+2)
            top=max(0,int((y-16)*height/1024)-1);bottom=min(height,int((y+17)*height/1024)+2)
            allowed[top:bottom,left:right]=True
    changes={}
    for s in ['start','active','pulse','boost','ready','claim','collected']:
        b=np.array(Image.open(p/f'device-ice-{w}-{s}.png')).astype(int)
        assert np.array_equal(a[camera],b[camera]),(w,s,'camera changed')
        d=np.max(abs(a-b),axis=2)
        assert not np.any((d>1)&~allowed),(w,s,'light outside strip halo')
        changes[s]={'pixels':int(np.count_nonzero(d>1)),'maxChannelDifference':int(d.max())}
    assert changes['start']['pixels']>0 and changes['boost']['pixels']>0
    assert changes['collected']['maxChannelDifference']<=1
    result.append({'width':w,'states':changes,'cameraUnchanged':True,'differencesConfinedToStrips':True})
(p/'device-ice-pixel-check.json').write_text(json.dumps(result,indent=2))
print('All three widths: visible light transitions confined to strip cores and their local halo; camera unchanged; collected state unlit.')
