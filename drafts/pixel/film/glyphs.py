"""把缝合像素字体（12 px）里用到的字转成点阵 JSON，渲染时不再依赖字体文件。

用法：python3 glyphs.py <fusion-pixel.ttf> > glyphs.json
"""
import json, sys
from PIL import Image, ImageDraw, ImageFont

TEXT = "像素风PIXELART0123456789×·FPS色观默格光雨"
font = ImageFont.truetype(sys.argv[1], 12)
out = {}
for ch in dict.fromkeys(TEXT):
    w = round(font.getlength(ch))
    im = Image.new("1", (w + 4, 16), 0)
    d = ImageDraw.Draw(im)
    d.fontmode = "1"
    d.text((0, 0), ch, font=font, fill=1)
    rows = ["".join("#" if im.getpixel((x, y)) else "." for x in range(w)) for y in range(14)]
    out[ch] = {"w": w, "rows": rows}
json.dump(out, sys.stdout, ensure_ascii=False, indent=0)
