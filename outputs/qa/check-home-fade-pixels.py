from pathlib import Path
from PIL import Image, ImageChops
import json, re, math
root = Path(__file__).resolve().parent
reports = json.loads((root / 'home-header-fade-after.json').read_text(encoding='utf-8'))
for report in reports:
    width = report['width']
    before = Image.open(root / f'home-header-fade-before-{width}.png').convert('RGB')
    after = Image.open(root / f'home-header-fade-after-{width}.png').convert('RGB')
    fade_end = math.ceil(float(re.findall(r'([\d.]+)px', report['background']['mask'])[-1]))
    # Allow one 8-bit colour level of compositing rounding when a mask
    # promotes the background to a separate layer.
    area = (0, fade_end, width, after.height)
    difference = ImageChops.difference(before.crop(area), after.crop(area))
    maximum = max(channel[1] for channel in difference.getextrema())
    assert maximum <= 1, (width, maximum)
    print(f'{width}px: below y={fade_end}, maximum colour difference {maximum}/255; planet brightness and detail preserved.')
