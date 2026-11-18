# 给 Blender 出的原图加字：第 0 帧、揭秘、竖版海报（瑞士网格）。系统 python3 + PIL 即可。
# python3 overlay.py   （读 ../png/v2/hero-raw.png、reveal-raw.png，写 cover.png、reveal.png、poster.png）
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
P = os.environ.get('SG_PNG', os.path.join(HERE, '..', 'png', 'v2')); F = os.path.join(ROOT, 'public', 'fonts')
font = lambda n, s: ImageFont.truetype(os.path.join(F, n), s)
GM, NSK, NSB, NSM, IDB = 'GeistMono-Medium.ttf', 'NotoSansSC-Black.otf', 'NotoSansSC-Bold.otf', 'NotoSansSC-Medium.otf', 'InterDisplay-Bold.ttf'
RED = (226, 30, 20)

def shade(im, box, alpha=110, blur=60):
    """字底下一层很淡的暗角，保证白字读得清，又看不出是一块底"""
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rectangle(box, fill=alpha); m = m.filter(ImageFilter.GaussianBlur(blur))
    return Image.composite(Image.new('RGB', im.size, (8, 6, 5)), im, m)

def hud(d, W, H, tl, tr):
    d.text((64, 50), tl, font=font(NSM, 22), fill=(240, 236, 230)); d.text((W - 64, 50), tr, font=font(NSM, 22), fill=(240, 236, 230), anchor='ra')

def cover():
    im = Image.open(os.path.join(P, 'hero-raw.png')).convert('RGB'); W, H = im.size
    im = shade(im, (0, H - 330, 980, H), 120, 80); d = ImageDraw.Draw(im)
    hud(d, W, H, '风格 · SUPERGRAPHICS', '1966 — 今天')
    d.text((60, H - 290), '超级平面', font=font(NSK, 132), fill=(250, 248, 244))
    d.text((66, H - 92), '只有站在这一个点上，它才是一个圆。', font=font(NSB, 34), fill=(250, 248, 244))
    d.rectangle((66, H - 306, 66 + 64, H - 298), fill=RED)
    im.save(os.path.join(P, 'cover.png'))

def reveal():
    im = Image.open(os.path.join(P, 'reveal-raw.png')).convert('RGB'); W, H = im.size
    im = shade(im, (0, H - 300, 1100, H), 130, 80); d = ImageDraw.Draw(im)
    hud(d, W, H, '风格 · SUPERGRAPHICS · 换个角度', '同一个圆 · 同一座厂房')
    d.text((60, H - 250), '换个位置，它就碎了', font=font(NSK, 96), fill=(250, 248, 244))
    d.text((66, H - 92), '往前 11 米、往左 7 米：红色散在柱子、墙和地上，看不出是一个圆。', font=font(NSB, 32), fill=(250, 248, 244))
    d.rectangle((66, H - 268, 66 + 64, H - 260), fill=RED)
    im.save(os.path.join(P, 'reveal.png'))

def poster():
    """4:5 竖版海报：上面是厂房（裁中间），下面是瑞士网格的字；红圆和字左对齐在同一条线上"""
    src = Image.open(os.path.join(P, 'hero-raw.png')).convert('RGB'); W0, H0 = src.size
    PW, PH = 1600, 2000; im = Image.new('RGB', (PW, PH), (242, 239, 233)); d = ImageDraw.Draw(im)
    ph = 1420; cw = int(H0 * PW / ph)                       # 图片区 1600×1420，按高度裁中间
    crop = src.crop(((W0 - cw) // 2, 0, (W0 + cw) // 2, H0)).resize((PW, ph), Image.LANCZOS); im.paste(crop, (0, 0))
    m = 80; ink = (20, 18, 16)
    d.text((m - 6, ph + 76), '超级平面', font=font(NSK, 166), fill=ink)
    d.text((m, ph + 312), 'Supergraphics', font=font(IDB, 70), fill=ink)
    col = PW // 2 + 40
    for i, (a, b) in enumerate([('1966', 'Sea Ranch，加州海边的一片住宅：四条色带爬过墙角和天花板。'), ('原则', '图形比建筑大；只在一个点上完整；环境去色，漆只用一种饱和色。')]):
        y = ph + 92 + i * 150
        d.text((col, y), a, font=font(NSB, 30), fill=RED)
        lines, line, fnt = [], '', font(NSM, 30)
        for ch in b:
            if d.textlength(line + ch, font=fnt) > PW - m - col - 10: lines.append(line); line = ch
            else: line += ch
        lines.append(line)
        for k, ln in enumerate(lines): d.text((col, y + 44 + k * 42), ln, font=fnt, fill=ink)
    d.line((m, PH - 120, PW - m, PH - 120), fill=ink, width=3)
    d.text((m, PH - 90), '风格 · SUPERGRAPHICS', font=font(NSM, 26), fill=ink); d.text((PW - m, PH - 90), '观默', font=font(NSB, 28), fill=ink, anchor='ra')
    d.ellipse((PW - m - 40, ph + 92, PW - m, ph + 132), fill=RED)
    im.save(os.path.join(P, 'poster.png'))

if __name__ == '__main__':
    for f in (cover, reveal, poster):
        try: f(); print('ok', f.__name__)
        except FileNotFoundError as e: print('skip', f.__name__, e)
