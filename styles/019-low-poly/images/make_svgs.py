"""
019 低多边形 · 四张图（1080×1350）
  python3 make_svgs.py <帧目录>   # episode.py + render.cjs 渲出来的 30fps 帧（f0000.png …）
先从片子里裁出几帧（frames/*.jpg），再写 poster / cheatsheet / app-ui / steps 四张 SVG；
然后 python3 scripts/build_images.py styles/019-low-poly/images 生成 preview/（内嵌字体和图片）和 png/。
"""
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1350
C = dict(paper='#FBF4E6', bg='#F6EEDD', red='#EE6B57', yel='#F4C54F', blue='#2F5FD8', grn='#4DAF72', lgrn='#9ED7A8',
         ink='#3B3552', sky='#8CC8EE', pink='#F49DB6', lilac='#C9A6EC', mint='#A9DDB4', peri='#8F9DEA', sea='#7DB8E8',
         shade='#7A5C86', mute='#8A7FA0', cream='#FFFDF7')
CN = "font-family=\"'Noto Sans SC'\""

# 帧号（30fps）→ 裁切框（1920×1080 里的 x0, y0, x1, y1）：避开左上的章节名和左下的规则卡
CROPS = {
    'paper':  (10, (200, 190, 1300, 1000)),
    'color':  (40, (330, 170, 1600, 900)),
    'valley': (100, (380, 150, 1300, 920)),
    'light':  (210, (330, 170, 1600, 900)),
    'p1280':  (275, (540, 150, 1380, 960)),
    'p320':   (300, (540, 150, 1380, 960)),
    'p80':    (330, (540, 150, 1380, 960)),
    'phone':  (430, (1120, 40, 1650, 1040)),
    'night':  (520, (330, 170, 1600, 900)),
}


def cut(src):
    os.makedirs(os.path.join(HERE, 'frames'), exist_ok=True)
    for name, (f, box) in CROPS.items():
        im = Image.open(os.path.join(src, f'f{f:04d}.png')).convert('RGB').crop(box)
        im.thumbnail((1400, 1400))
        im.save(os.path.join(HERE, 'frames', f'{name}.jpg'), quality=86, optimize=True)


def svg(body, bg=C['paper']):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">\n'
            f'  <defs>\n    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">'
            f'<feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="{C["shade"]}" flood-opacity=".28"/></filter>\n  </defs>\n'
            f'  <rect width="{W}" height="{H}" fill="{bg}"/>\n{body}\n</svg>\n')


def photo(name, x, y, w, h, r=32, cid=None):
    cid = cid or f'c-{name}-{x}-{y}'
    return (f'<clipPath id="{cid}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}"/></clipPath>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{C["paper"]}" filter="url(#sh)"/>'
            f'<image href="frames/{name}.jpg" x="{x}" y="{y}" width="{w}" height="{h}" '
            f'preserveAspectRatio="xMidYMid slice" clip-path="url(#{cid})"/>')


def pill(x, y, text, size=22, fg=C['cream'], bg=C['ink'], anchor='start'):
    w = sum(size * (1.0 if ord(ch) > 255 else 0.6) for ch in text) + size * 1.2
    x0 = x - w / 2 if anchor == 'middle' else x
    return (f'<rect x="{x0:.0f}" y="{y - size * 1.05:.0f}" width="{w:.0f}" height="{size * 1.55:.0f}" rx="{size * 0.55:.0f}" fill="{bg}"/>'
            f'<text x="{x0 + size * 0.6:.0f}" y="{y:.0f}" {CN} font-weight="700" font-size="{size}" fill="{fg}">{text}</text>')


def text(x, y, s, size, weight=700, fill=C['ink'], anchor='start', ls=0):
    return (f'<text x="{x}" y="{y}" {CN} font-weight="{weight}" font-size="{size}" fill="{fill}" '
            f'text-anchor="{anchor}" letter-spacing="{ls}">{s}</text>')


SWATCH = ['paper', 'red', 'yel', 'grn', 'lgrn', 'sky', 'pink', 'lilac', 'peri', 'blue', 'ink', 'shade']
RULES = [('一个面，一个颜色', '不画渐变：每个三角面只有一种颜色'),
         ('光一转，面就翻', '明暗按面算，光一动，整片面跟着跳'),
         ('面越少，越有性格', '1280 → 320 → 80：少到刚好认得出'),
         ('一张卡，一座山', '图标、插画、空状态都能用'),
         ('三档明暗就够了', '亮、中、暗三档，阴影混一点暖紫')]


def gem(cx, cy, r, cols):
    """一颗低多边形宝石：上下两圈三角面，各面一种颜色（三档明暗）"""
    import math
    out = []
    n = 6
    top = [(cx + r * 0.62 * math.cos(math.pi * 2 * k / n - math.pi / 2), cy - r * 0.35 + r * 0.25 * math.sin(math.pi * 2 * k / n - math.pi / 2)) for k in range(n)]
    for k in range(n):
        a, b_ = top[k], top[(k + 1) % n]
        out.append(f'<polygon points="{cx},{cy - r * 0.55} {a[0]:.1f},{a[1]:.1f} {b_[0]:.1f},{b_[1]:.1f}" fill="{cols[k % 3]}"/>')
        out.append(f'<polygon points="{cx},{cy + r} {a[0]:.1f},{a[1]:.1f} {b_[0]:.1f},{b_[1]:.1f}" fill="{cols[(k + 1) % 3]}"/>')
    return ''.join(out)


def poster():
    b = [photo('valley', 64, 64, 952, 900, 40)]
    b.append(pill(104, 128, '019 · LOW POLY', 22))
    b.append(text(64, 1110, '低多边形', 132, 900))
    b.append(text(68, 1172, '一个面，一个颜色', 40, 700, C['shade']))
    b.append(text(68, 1226, '平涂三角面 · 光一转面就翻 · 面越少越有性格 · 三档明暗', 22, 700, C['mute']))
    for i, k in enumerate(['red', 'yel', 'grn', 'sky', 'pink', 'lilac']):
        x = 770 + i * 46
        b.append(f'<polygon points="{x},1266 {x + 17},1296 {x - 17},1296" fill="{C[k]}"/>')
    b.append(text(68, 1290, '1993 星际火狐 → 2016 独立游戏 → 今天的插画与图标', 18, 700, C['mute']))
    return svg('\n'.join(b), C['bg'])


def cheatsheet():
    b = [text(64, 120, '低多边形 · 速查', 64, 900), text(66, 166, 'LOW POLY CHEAT SHEET · 019', 20, 700, C['mute'], ls=4)]
    for i, (t, d) in enumerate(RULES):
        y = 250 + i * 92
        x = 92
        b.append(f'<polygon points="{x},{y - 44} {x + 28},{y + 6} {x - 28},{y + 6}" fill="{C[["red", "yel", "sky", "grn", "lilac"][i]]}"/>')
        b.append(text(x, y - 2, f'{i + 1}', 20, 900, C['ink'], 'middle'))
        b.append(text(138, y - 8, t, 32, 900))
        b.append(text(138, y + 26, d, 19, 700, C['mute']))
    b.append(text(64, 712, '面数 · 1280 → 320 → 80', 28, 900))
    for i, (n, lab) in enumerate((('p1280', '1280'), ('p320', '320'), ('p80', '80'))):
        x = 64 + i * 324
        b.append(photo(n, x, 736, 300, 260, 26))
        b.append(text(x + 150, 1032, f'{lab} 个三角面', 20, 900, C['ink'], 'middle'))
    b.append(text(64, 1100, '色板', 28, 900))
    for i, k in enumerate(SWATCH):
        x = 64 + (i % 6) * 160
        y = 1124 + (i // 6) * 100
        b.append(f'<rect x="{x}" y="{y}" width="140" height="56" rx="16" fill="{C[k]}" stroke="#3B355222"/>')
        b.append(text(x + 4, y + 80, C[k].upper(), 16, 700, C['ink']))
    return svg('\n'.join(b), C['bg'])


def app_ui():
    b = [text(64, 120, '如果低多边形来做 App', 52, 900), text(66, 166, '天气：一张卡，一座山', 24, 700, C['shade'])]
    b.append(photo('phone', 96, 210, 560, 1056, 48))
    notes = [(330, '天气就是光', '晴天三档明暗偏暖，下雪整座山换一套冷色'), (540, '一张卡，一座山', '插画、图标、空状态用同一套三角面'),
             (750, '面越少越像图标', '星球 80 个面就是 App 图标'), (960, '切换时面一片片翻', '换城市、换天气：三角面像纸牌一样翻过去'),
             (1170, '不画渐变', '天空也是两三块平涂色，不用渐变')]
    for y, t, d in notes:
        b.append(f'<polygon points="{690},{y - 30} {712},{y - 4} {668},{y - 4}" fill="{C["red"]}"/>')
        b.append(text(726, y - 8, t, 26, 900))
        b.append(text(726, y + 26, d, 16, 700, C['mute']))
    return svg('\n'.join(b), C['bg'])


def steps():
    b = [text(64, 120, '四步：从一张纸到低多边形', 50, 900), text(66, 166, 'FOUR STEPS · 019 LOW POLY', 20, 700, C['mute'], ls=4)]
    panels = [('paper', '一张纸', '地形先是平的纸，三角面一片片翻起来'),
              ('color', '一个面，一个颜色', '翻过来就是颜色：每个面只有一种'),
              ('light', '三档明暗', '光一转，面就在亮、中、暗之间跳'),
              ('night', '入夜混暖紫', '三档一起压暗，阴影往暖紫里混')]
    for i, (n, t, d) in enumerate(panels):
        x = 64 + (i % 2) * 484
        y = 220 + (i // 2) * 560
        b.append(photo(n, x, y, 468, 420, 30))
        b.append(f'<circle cx="{x + 40}" cy="{y + 40}" r="24" fill="{C["ink"]}"/>')
        b.append(text(x + 40, y + 49, str(i + 1), 24, 900, C['cream'], 'middle'))
        b.append(text(x + 4, y + 470, t, 32, 900))
        b.append(text(x + 4, y + 506, d, 19, 700, C['mute']))
    return svg('\n'.join(b), C['bg'])


if __name__ == '__main__':
    if len(sys.argv) > 1:
        cut(sys.argv[1])
    for name, fn in (('poster', poster), ('cheatsheet', cheatsheet), ('app-ui', app_ui), ('steps', steps)):
        open(os.path.join(HERE, f'{name}.svg'), 'w', encoding='utf-8').write(fn())
        print('wrote', name)
