"""把缝合像素字体（12 px 比例宽度，简体中文）里用到的字转成点阵 JSON，渲染时不再依赖字体文件。

用法：python3 glyphs.py <fusion-pixel-font-12px-proportional-otf.woff2-v2026.08.11.zip> > glyphs.json

字体取自官方 Release 2026.08.11（OFL-1.1）：
https://github.com/TakWolf/fusion-pixel-font/releases/download/2026.08.11/fusion-pixel-font-12px-proportional-otf.woff2-v2026.08.11.zip
压缩包 SHA-256 8aa9e68b8a4aaaae84a77f7af2cc6601f432da0af98f7d9675ad77f631e63db4
需要 fontTools 和 brotli（读 woff2）。
"""
import io, json, sys, zipfile
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

# 全片用到的字。改了 film.mjs 里的文案，就把新字加到这里重新生成。
TEXT = (
    "像素风PIXELART观默"
    "色阶只在板里跳不做渐变每秒降一夜空云雨霓虹青暖窗闪电条"
    "整数倍率最近邻放大宽窄不一形光"
    "卡帧撞击时世界停住反相冻结震次要拍等于"
    "气象台雷阵提醒我描边按下位移图标进度格°%"
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "×·#/=:.,，、-+→"
)

zf = zipfile.ZipFile(sys.argv[1])
name = next(n for n in zf.namelist() if n.endswith("zh_hans.otf.woff2"))
tt = TTFont(io.BytesIO(zf.read(name)))
tt.flavor = None
buf = io.BytesIO()
tt.save(buf)
buf.seek(0)
cmap = tt.getBestCmap()
font = ImageFont.truetype(buf, 12)

out, missing = {}, []
for ch in dict.fromkeys(TEXT):
    if ord(ch) not in cmap:
        missing.append(ch)
        continue
    w = round(font.getlength(ch))
    im = Image.new("1", (w + 4, 20), 0)
    d = ImageDraw.Draw(im)
    d.fontmode = "1"
    d.text((0, 0), ch, font=font, fill=1)
    # 这一版字体在 12 px 下整字落在第 3—13 行；上移 2 行，让汉字占第 1—11 行、基线在第 12 行
    assert not any(im.getpixel((x, y)) for x in range(w + 4) for y in (0, 1, 16, 17, 18, 19)), ch
    rows = ["".join("#" if im.getpixel((x, y + 2)) else "." for x in range(w)) for y in range(14)]
    out[ch] = {"w": w, "rows": rows}
if missing:
    print("字体里没有：" + "".join(missing), file=sys.stderr)
json.dump({"_font": f"Fusion Pixel 12px Proportional SC {tt['name'].getDebugName(5)}", **out}, sys.stdout, ensure_ascii=False, indent=0)
