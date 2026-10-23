"""
风格 006 · 千禧未来主义 Y2K —— 4 张风格图（1080×1350）
  poster.svg     海报：铬字 Y2K + Aqua 窗口
  cheatsheet.svg 风格速查卡：材质 / 铬的色标 / 色板 / 字体 / 界面零件 / 五条规则
  app-ui.svg     概念界面：如果 Y2K 来做 App（千禧.fm 播放器 + i-mode 风格短信）
  steps.svg      四步改造：同一张“周末市集”，一步只改一件事

两层叠起来：
  1) 材质层（铬 / 果冻 / 泡泡 / 玻璃）—— 写成 layers/*.json，由 render_layers.mjs 调用视频同一份
     material.js（WebGL 着色器）渲染成透明 WebP；SVG 里用 <image> 引用
  2) 其余全是 SVG 矢量：排版、界面、像素表情、细条纹、网格
用法：npm run images:006（= 本脚本 → render_layers.mjs → scripts/build_images.py）
"""
import json
import os
import random

from PIL import ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
FONTS = os.path.join(ROOT, 'public', 'fonts')
LAYERS = os.path.join(HERE, 'layers')
W, H = 1080, 1350

# —— 色板（与 ../tokens.ts 一致）——
INK, GREY, SILVER = '#0A1633', '#5E6880', '#C9CED8'
PAPER_T, PAPER_B, WHITE = '#EEF0F4', '#D9DEE6', '#FFFFFF'
AQUA, AQUA_D, AQUA_L, BONDI = '#1E6FF0', '#0D58D6', '#7DC0FF', '#0095B6'
LIME, RED, YELLOW, GREEN = '#C8F53C', '#E0443A', '#F2B53A', '#4DBA3F'
FLAVORS = [('蓝莓', 'Blueberry', '#1D7FD0'), ('草莓', 'Strawberry', '#E5336F'), ('橘子', 'Tangerine', '#F5891F'),
           ('葡萄', 'Grape', '#7442A8'), ('青柠', 'Lime', '#6CC13A')]
CHROME_STOPS = [(0, '#2A4FB8', '天空顶'), (0.32, '#9DB6EE', '天空'), (0.49, '#FFFFFF', '地平线'),
                (0.51, '#1A2236', '断层'), (0.75, '#3B4458', '地面'), (1, '#A9B3C6', '远处反光')]
ENV = dict(skyTop=[0.04, 0.16, 0.62], skyMid=[0.45, 0.62, 0.95], skyHor=[1.35, 1.38, 1.45],
           floorHor=[0.015, 0.018, 0.025], floorBot=[0.2, 0.22, 0.27])
CN, DISPLAY, TECH, PIXEL, LATIN = 'Noto Sans SC', 'Unbounded', 'Michroma', 'Silkscreen', 'Inter'


def rgb01(hexc):
    return [int(hexc[i:i + 2], 16) / 255 for i in (1, 3, 5)]


# ─────────── 量字宽（排版对齐用） ───────────
_FC = {}


def text_w(s, family, size, weight=400, ls=0):
    files = {CN: {400: 'NotoSansSC-Regular.otf', 500: 'NotoSansSC-Medium.otf', 700: 'NotoSansSC-Bold.otf', 900: 'NotoSansSC-Black.otf'},
             DISPLAY: {0: 'Unbounded.ttf'}, TECH: {0: 'Michroma-Regular.ttf'}, PIXEL: {0: 'Silkscreen-Regular.ttf'},
             LATIN: {500: 'Inter-Medium.ttf', 600: 'Inter-SemiBold.ttf', 400: 'Inter-Regular.ttf'}}[family]
    fn = files.get(weight) or files.get(0) or list(files.values())[0]
    key = (fn, weight)
    if key not in _FC:
        f = ImageFont.truetype(os.path.join(FONTS, fn), 200)
        if family == DISPLAY:
            f.set_variation_by_axes([weight])
        _FC[key] = f
    return _FC[key].getlength(s) * size / 200 + ls * max(len(s) - 1, 0)


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def T(x, y, s, size=16, fam=CN, w=400, c=INK, anchor='start', ls=0, op=1, extra=''):
    a = f' text-anchor="{anchor}"' if anchor != 'start' else ''
    l = f' letter-spacing="{ls}"' if ls else ''
    o = f' opacity="{op}"' if op != 1 else ''
    return f'<text x="{x:g}" y="{y:g}" font-family="{fam}" font-weight="{w}" font-size="{size:g}" fill="{c}"{a}{l}{o}{extra}>{esc(s)}</text>'


# ─────────── 材质层 ───────────
def layer(name, x, y, w, h, **cfg):
    """写 layers/<name>.json（坐标是这一层自己的像素），返回放在 (x, y) 的 <image>"""
    base = dict(w=w, h=h, scale=2, bevel=26, smooth=2.4, shadowBlur=16, shadow=[0, 20, 0.55, 0], env=ENV)
    base.update(cfg)
    os.makedirs(LAYERS, exist_ok=True)
    with open(os.path.join(LAYERS, f'{name}.json'), 'w') as fp:
        json.dump(base, fp, ensure_ascii=False, separators=(',', ':'))
    return f'<image href="layers/{name}.webp" x="{x:g}" y="{y:g}" width="{w}" height="{h}"/>'


def star_d(cx, cy, R, k=0.24, h=0.86):
    a, b = R * k, R * h
    return (f'M{cx:g} {cy - R:g} Q{cx + a:g} {cy - a:g} {cx + b:g} {cy:g} Q{cx + a:g} {cy + a:g} {cx:g} {cy + R:g} '
            f'Q{cx - a:g} {cy + a:g} {cx - b:g} {cy:g} Q{cx - a:g} {cy - a:g} {cx:g} {cy - R:g} Z')


_STARS = set()


def chrome_star(cx, cy, R):
    """铬星星：同一尺寸只渲染一次（layers/star-R.webp），之后到处复用（与视频里的 STAR 精灵同参数）"""
    name = f'star-{R}'
    if name not in _STARS:
        _STARS.add(name)
        layer(name, 0, 0, R * 3, R * 3, bevel=max(6, R * 0.32), smooth=1.2, shadowBlur=6, shadow=[0, R * 0.25, 0.4, 0],
              cam=[R * 1.5, -R * 0.9, R * 22], shapes=[dict(d=star_d(R * 1.5, R * 1.5, R))])
    return f'<image href="layers/{name}.webp" x="{cx - R * 1.5:g}" y="{cy - R * 1.5:g}" width="{R * 3}" height="{R * 3}"/>'


# ─────────── 像素表情（与视频 ui.tsx 的 EMOJI 同一套，12×12，原创绘制） ───────────
EMOJI = {
    'heart': ('#FF2E88', '............|..##....##..|.####..####.|############|############|############|.##########.|..########..|...######...|....####....|.....##.....|............'),
    'face': ('#FFB000', '...######...|..########..|.##########.|####.##.####|####.##.####|############|############|##.######.##|###.####.###|.###....###.|..########..|...######...'),
    'phone': (INK, '.....#......|.....#......|...######...|...#....#...|...#....#...|...######...|...#.#.##...|...######...|...#.#.##...|...######...|...#.#.##...|...######...'),
    'sun': ('#FF6A00', '.....##.....|.#...##...#.|..#......#..|....####....|...######...|##.######.##|##.######.##|...######...|....####....|..#......#..|.#...##...#.|.....##.....'),
    'spark': (AQUA, '.....##.....|.....##.....|....####....|....####....|..########..|############|############|..########..|....####....|....####....|.....##.....|.....##.....'),
    'mail': (INK, '............|############|##........##|#.#......#.#|#..#....#..#|#...#..#...#|#....##....#|#..........#|#..........#|############|............|............'),
    'note': ('#7B4DFF', '....########|....########|....##....##|....##....##|....##....##|....##....##|....##....##|..####..####|.#####.#####|.#####.#####|..###...###.|............'),
}


def emoji(name, x, y, s, color=None):
    c, rows = EMOJI[name]
    d = ''
    for j, row in enumerate(rows.split('|')):
        i = 0
        while i < len(row):
            if row[i] == '#':
                k = i
                while k < len(row) and row[k] == '#':
                    k += 1
                d += f'M{x + i * s:g} {y + j * s:g}h{(k - i) * s:g}v{s:g}h{-(k - i) * s:g}Z'
                i = k
            else:
                i += 1
    return f'<path d="{d}" fill="{color or c}" shape-rendering="crispEdges"/>'


# ─────────── SVG 零件 ───────────
def defs():
    tl = ''.join(f'<radialGradient id="tl_{a[1:]}" cx="0.5" cy="0.75" r="0.75"><stop offset="0" stop-color="{b}"/><stop offset="1" stop-color="{a}"/></radialGradient>'
                 for a, b in ((RED, '#FF9A8A'), (YELLOW, '#FFE08A'), (GREEN, '#A8F08A')))
    stops = ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c, _ in CHROME_STOPS)
    shells = ''.join(
        f'<linearGradient id="shell_{c[1:]}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c}" stop-opacity="0.55"/>'
        f'<stop offset="0.5" stop-color="{c}" stop-opacity="0.78"/><stop offset="1" stop-color="{c}" stop-opacity="0.95"/></linearGradient>'
        for _, _, c in FLAVORS + [('', '', BONDI)])
    return f'''<defs>
 <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{PAPER_T}"/><stop offset="0.55" stop-color="#E4E8EE"/><stop offset="1" stop-color="{PAPER_B}"/></linearGradient>
 <radialGradient id="glow" cx="0.5" cy="0.32" r="0.6"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.9"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
 <pattern id="pinBg" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="#FFFFFF" opacity="0.38"/></pattern>
 <pattern id="pin" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#ECEEF2"/><rect width="4" height="2" fill="#F8F9FB"/></pattern>
 <pattern id="pinT" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="#FFFFFF" opacity="0.5"/></pattern>
 <pattern id="scan" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="1" fill="#0A1633" opacity="0.10"/></pattern>
 <pattern id="grid80" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="{INK}" stroke-width="0.5" opacity="0.10"/></pattern>
 <linearGradient id="gTitle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F5F7"/><stop offset="1" stop-color="#C9CED8"/></linearGradient>
 <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6FA8FF"/><stop offset="0.5" stop-color="{AQUA}"/><stop offset="0.52" stop-color="{AQUA_D}"/><stop offset="1" stop-color="{AQUA_L}"/></linearGradient>
 <linearGradient id="gWhite" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.5" stop-color="#E9ECF1"/><stop offset="0.52" stop-color="#DADFE7"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>
 <linearGradient id="gLime" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E6FF8A"/><stop offset="0.5" stop-color="{LIME}"/><stop offset="0.52" stop-color="#A9D61E"/><stop offset="1" stop-color="#E2FF7A"/></linearGradient>
 <linearGradient id="gBondi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5FD0E6"/><stop offset="0.55" stop-color="{BONDI}"/><stop offset="1" stop-color="#36C3DD"/></linearGradient>
 <linearGradient id="gHi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0.1"/></linearGradient>
 <linearGradient id="gTrack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B9C0CC"/><stop offset="1" stop-color="#F2F4F7"/></linearGradient>
 <linearGradient id="gChrome" x1="0" y1="0" x2="0" y2="1">{stops}</linearGradient>
 <linearGradient id="gChromeH" x1="0" y1="0" x2="1" y2="0">{stops}</linearGradient>
 <linearGradient id="gGrey" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E6E9EE"/><stop offset="1" stop-color="#8E96A6"/></linearGradient>
 <linearGradient id="gLcd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D7F0FF"/><stop offset="1" stop-color="#A9D4F0"/></linearGradient>
 <linearGradient id="gScreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6F7F9"/><stop offset="1" stop-color="#E3E7ED"/></linearGradient>
 <radialGradient id="gIri" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.9"/><stop offset="0.5" stop-color="#BFE6FF" stop-opacity="0.35"/><stop offset="0.8" stop-color="#F7C6FF" stop-opacity="0.45"/><stop offset="1" stop-color="#9FF2E0" stop-opacity="0.7"/></radialGradient>
 <pattern id="ribs" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="2" height="7" fill="#FFFFFF" opacity="0.16"/></pattern>
 <linearGradient id="gEdge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.75"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
 <pattern id="stripes" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="11" height="22" fill="#FFFFFF"/></pattern>
 {tl}{shells}
 <filter id="soft14" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
 <filter id="soft6" x="-20%" y="-30%" width="140%" height="180%"><feGaussianBlur stdDeviation="6"/></filter>
 <filter id="soft2" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
 <linearGradient id="gSoft" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9D3E3"/><stop offset="1" stop-color="#9FB0CC"/></linearGradient>
 <filter id="frost" x="0" y="0" width="100%" height="100%"><feGaussianBlur stdDeviation="10"/></filter>
</defs>'''


def page_bg(grid=True, y0=110, y1=1240):
    g = f'<rect x="60" y="{y0}" width="960" height="{y1 - y0}" fill="url(#grid80)"/>' if grid else ''
    return (f'<rect width="{W}" height="{H}" fill="url(#bg)"/><rect width="{W}" height="{H}" fill="url(#pinBg)"/>'
            f'<rect width="{W}" height="{H * 0.7:g}" fill="url(#glow)"/>{g}'
            + reg(36, 36) + reg(W - 36, 36) + reg(36, H - 36) + reg(W - 36, H - 36))


def reg(x, y, r=9):
    return (f'<g stroke="{INK}" stroke-width="0.9" fill="none" opacity="0.6"><circle cx="{x}" cy="{y}" r="{r * 0.55:g}"/>'
            f'<line x1="{x - r}" y1="{y}" x2="{x + r}" y2="{y}"/><line x1="{x}" y1="{y - r}" x2="{x}" y2="{y + r}"/></g>')


def ruler(x0, x1, y, op=0.55):
    t = [f'<line x1="{x0}" y1="{y}" x2="{x1}" y2="{y}"/>']
    for i, x in enumerate(range(x0, x1 + 1, 10)):
        hh = 9 if i % 10 == 0 else (5 if i % 5 == 0 else 3)
        t.append(f'<line x1="{x}" y1="{y}" x2="{x}" y2="{y - hh}"/>')
    return f'<g stroke="{INK}" stroke-width="0.8" opacity="{op}">' + ''.join(t) + '</g>'


def barcode(x, y, h, seed=7, n=46):
    r = random.Random(seed)
    out, cx = [], x
    for _ in range(n):
        w = r.choice([1, 1, 1.5, 2, 3])
        g = r.choice([1, 1.5, 2])
        out.append(f'<rect x="{cx:.1f}" y="{y}" width="{w}" height="{h}"/>')
        cx += w + g
    return f'<g fill="{INK}">' + ''.join(out) + '</g>', cx - x


def gel_button(x, y, w, h, label, kind='blue', size=None, fam=CN):
    g = {'blue': 'gBlue', 'white': 'gWhite', 'lime': 'gLime'}[kind]
    tc = WHITE if kind == 'blue' else INK
    stroke = {'blue': '#1144A8', 'white': '#9AA3B5', 'lime': '#7FA012'}[kind]
    r = h / 2
    fs = size or h * 0.42
    return (f'<g><rect x="{x:g}" y="{y + 3:g}" width="{w:g}" height="{h:g}" rx="{r:g}" fill="{INK}" opacity="0.18" filter="url(#soft2)"/>'
            f'<rect x="{x:g}" y="{y:g}" width="{w:g}" height="{h:g}" rx="{r:g}" fill="url(#{g})" stroke="{stroke}" stroke-width="1"/>'
            f'<rect x="{x + r * 0.5:g}" y="{y + 2:g}" width="{w - r:g}" height="{h * 0.46:g}" rx="{h * 0.23:g}" fill="url(#gHi)"/>'
            + T(x + w / 2, y + h / 2 + fs * 0.36, label, fs, fam, 700 if fam == CN else 400, tc, 'middle') + '</g>')


def progress(x, y, w, h, p):
    return (f'<g><rect x="{x:g}" y="{y:g}" width="{w:g}" height="{h:g}" rx="{h / 2:g}" fill="url(#gTrack)" stroke="#8A93A6" stroke-width="1"/>'
            f'<rect x="{x + 1:g}" y="{y + 1:g}" width="{(w - 2) * p:.1f}" height="{h - 2:g}" rx="{h / 2 - 1:g}" fill="url(#gBlue)"/>'
            f'<rect x="{x + 1:g}" y="{y + 1:g}" width="{(w - 2) * p:.1f}" height="{h - 2:g}" rx="{h / 2 - 1:g}" fill="url(#stripes)" opacity="0.35"/>'
            f'<rect x="{x + h * 0.4:g}" y="{y + 2.5:g}" width="{max((w - 2) * p - h * 0.8, 0):.1f}" height="{h * 0.36:g}" rx="{h * 0.18:g}" fill="url(#gHi)"/></g>')


def traffic(x, y, r=7.5):
    out = ''
    for i, (c1, c2) in enumerate(((RED, '#9E2A22'), (YELLOW, '#A57418'), (GREEN, '#2D7A22'))):
        cx = x + i * r * 2.9
        out += (f'<circle cx="{cx:g}" cy="{y:g}" r="{r:g}" fill="{c2}"/><circle cx="{cx:g}" cy="{y:g}" r="{r - 0.8:g}" fill="url(#tl_{c1[1:]})"/>'
                f'<ellipse cx="{cx:g}" cy="{y - r * 0.45:g}" rx="{r * 0.62:g}" ry="{r * 0.38:g}" fill="#FFFFFF" opacity="0.85"/>')
    return f'<g>{out}</g>'


def window(x, y, w, h, title, body='', rx=9):
    return f'''<g>
 <rect x="{x}" y="{y + 18}" width="{w}" height="{h}" rx="{rx + 1}" fill="{INK}" opacity="0.30" filter="url(#soft14)"/>
 <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="url(#pin)" stroke="#8C94A6" stroke-width="1"/>
 <path d="M{x + rx} {y} H{x + w - rx} Q{x + w} {y} {x + w} {y + rx} V{y + 36} H{x} V{y + rx} Q{x} {y} {x + rx} {y} Z" fill="url(#gTitle)"/>
 <path d="M{x + rx} {y} H{x + w - rx} Q{x + w} {y} {x + w} {y + rx} V{y + 36} H{x} V{y + rx} Q{x} {y} {x + rx} {y} Z" fill="url(#pinT)" opacity="0.6"/>
 <line x1="{x}" y1="{y + 36.5}" x2="{x + w}" y2="{y + 36.5}" stroke="#9AA2B2" stroke-width="1"/>
 {traffic(x + 22, y + 18)}
 {T(x + w / 2, y + 23, title, 13, CN, 500, '#2A3142', 'middle')}
 {body}
</g>'''


def pill(x, y, label, fill=LIME, c=INK, fam=TECH, size=10, anchor='start', h=22, stroke=None):
    tw = text_w(label, fam, size, 400 if fam != CN else 700, 1)
    w = tw + h * 1.1
    x0 = x - w if anchor == 'end' else (x - w / 2 if anchor == 'middle' else x)
    s = f' stroke="{stroke}" stroke-width="1"' if stroke else ''
    return (f'<g><rect x="{x0:g}" y="{y:g}" width="{w:.1f}" height="{h}" rx="{h / 2:g}" fill="{fill}"{s}/>'
            + T(x0 + w / 2, y + h / 2 + size * 0.36, label, size, fam, 700 if fam == CN else 400, c, 'middle', 1) + '</g>')


def checkbox(x, y, on=True, s=16):
    tick = f'<path d="M{x + 3.5} {y + s / 2} l{s * 0.25:g} {s * 0.25:g} l{s * 0.42:g} {-s * 0.5:g}" fill="none" stroke="{WHITE}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' if on else ''
    return (f'<g><rect x="{x}" y="{y}" width="{s}" height="{s}" rx="4" fill="url(#{"gBlue" if on else "gWhite"})" stroke="{"#1144A8" if on else "#9AA3B5"}"/>'
            f'<rect x="{x + 2}" y="{y + 1.5}" width="{s - 4}" height="{s * 0.42:g}" rx="2.5" fill="url(#gHi)"/>{tick}</g>')


def header(title, en, sub, tag):
    """速查卡 / 概念界面 / 四步改造 共用的页眉：中文粗黑 + 英文宽体（铬在材质层里）"""
    return (T(60, 110, title, 50, CN, 900, INK, ls=-1)
            + T(60, 146, sub, 15, CN, 400, GREY)
            + T(1020, 146, tag, 11, PIXEL, 400, GREY, 'end', 1.2)
            + f'<line x1="60" y1="166" x2="1020" y2="166" stroke="{INK}" stroke-width="1" opacity="0.8"/>')


def footer(y=1262):
    return (f'<line x1="60" y1="{y}" x2="1020" y2="{y}" stroke="{INK}" stroke-width="1" opacity="0.8"/>'
            + T(60, y + 30, 'github.com/guanmo-ai/design-style', 12, TECH, 400, INK, ls=0.6)
            + T(1020, y + 30, '@guanmo_ai · 每天一个设计风格', 13, CN, 500, GREY, 'end'))


def svg_doc(body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">\n'
            f'{defs()}\n{body}\n</svg>\n')


def save(name, body):
    with open(os.path.join(HERE, name), 'w', encoding='utf-8') as fp:
        fp.write(svg_doc(body))
    print('svg', name)


# ═══════════════════ 1 · 海报 ═══════════════════
def poster():
    chrome = layer('poster', 0, 0, W, H, cam=[540, -455, 1000], envRot=0.12,
                   texts=[dict(text='Y2K', x=540, y=585, size=372, font=f"'{DISPLAY}'", weight=900, align='center', ls=-12)],
                   gels=[[150, 236, 74, 0.3], [262, 160, 24, 1.1]],
                   bubbles=[[905, 292, 116, 0.15], [118, 646, 30, 0.7], [352, 640, 12, 0.4]])
    wx, wy, ww, wh = 60, 892, 560, 336
    icon = f'''<g transform="translate({wx + 30},{wy + 64})">
  <rect x="0" y="0" width="58" height="58" rx="13" fill="url(#gBondi)" stroke="#06607A" stroke-width="1"/>
  <ellipse cx="29" cy="15" rx="22" ry="11" fill="#FFFFFF" opacity="0.55"/>
  {T(29, 40, '2K', 16, TECH, 400, WHITE, 'middle')}
  {T(80, 22, '正在连接到 2000 年…', 21, CN, 700)}
  {T(80, 48, '剩余时间：约 1 秒　·　已传输 99%', 14, CN, 400, GREY)}
 </g>'''
    emo = ''.join(emoji(n, wx + 46 + i * 68, wy + 208, 3.3) for i, n in enumerate(EMOJI))
    body = (icon + progress(wx + 30, wy + 150, ww - 60, 22, 0.99)
            + f'<rect x="{wx + 30}" y="{wy + 196}" width="{ww - 60}" height="64" rx="8" fill="#FFFFFF" opacity="0.75" stroke="#B9C0CD"/>' + emo
            + T(wx + 30, wy + wh - 30, 'i-MODE EMOJI 12×12 · 1999', 11, PIXEL, 400, GREY, ls=1)
            + gel_button(wx + ww - 232, wy + wh - 56, 92, 32, '取消', 'white')
            + gel_button(wx + ww - 128, wy + wh - 56, 98, 32, '继续', 'blue'))
    win = window(wx, wy, ww, wh, '千禧.app — 正在加载未来', body)
    micro = [('SYSTEM READY', INK), ('MEM 64MB ......... OK', GREY), ('CLOCK 31.12.1999 23:59:59', GREY),
             (f'BONDI BLUE  {BONDI}', BONDI), ('AQUA  10.0 PUBLIC BETA', AQUA), ('ミレニアム · 千禧年', INK)]
    micro_svg = ''.join(T(660, 1052 + i * 19, t, 12 if 'ミ' in t else 11, CN if 'ミ' in t else PIXEL, 500 if 'ミ' in t else 400, c, ls=1)
                        for i, (t, c) in enumerate(micro))
    bc, bw = barcode(660, 1176, 34)
    grid = (f'<g stroke="{INK}" stroke-width="0.5" opacity="0.07">'
            + ''.join(f'<line x1="{x}" y1="110" x2="{x}" y2="700"/>' for x in range(60, 1021, 80))
            + ''.join(f'<line x1="60" y1="{y}" x2="1020" y2="{y}"/>' for y in range(140, 701, 80)) + '</g>')
    s = (page_bg(grid=False) + grid
         + T(60, 72, 'DESIGN STYLE  ⁄  N°006', 12, TECH, 400, INK, ls=2.4)
         + T(540, 72, 'Y2K_FUTURISM.SIT · 1.44 MB', 11, PIXEL, 400, GREY, 'middle', 1.5)
         + T(1020, 72, '1997 — 2004', 12, TECH, 400, INK, 'end', 2.4)
         + f'<line x1="60" y1="90" x2="1020" y2="90" stroke="{INK}" stroke-width="1" opacity="0.8"/>'
         + chrome + chrome_star(470, 214, 30) + chrome_star(992, 662, 48)
         + ruler(60, 1020, 704)
         + T(56, 814, '千禧未来主义', 108, CN, 900, INK, ls=-3)
         + T(1020, 752, 'Y2K FUTURISM', 15, TECH, 400, INK, 'end', 2)
         + T(1020, 776, '铬 · 果冻 · 半透明', 15, CN, 500, GREY, 'end')
         + pill(1020, 792, 'Y2K COMPLIANT ✓', anchor='end', size=9.5)
         + f'<line x1="60" y1="842" x2="1020" y2="842" stroke="{INK}" stroke-width="1" opacity="0.8"/>'
         + win
         + T(660, 912, '未来，正在加载。', 30, CN, 900)
         + T(660, 950, '给平面加一层“材质”——', 16, CN, 500)
         + T(660, 974, '铬的反光、果冻的高光、', 16, CN, 500)
         + T(660, 998, '半透明的塑料。', 16, CN, 500)
         + f'<line x1="660" y1="1024" x2="1020" y2="1024" stroke="{INK}" stroke-width="0.8" opacity="0.4"/>'
         + micro_svg + bc
         + T(660 + bw + 12, 1192, '00:00:00', 10, PIXEL, 400, GREY, ls=1)
         + T(660 + bw + 12, 1208, '01.01.2000', 10, PIXEL, 400, INK, ls=1)
         + f'<line x1="60" y1="1262" x2="1020" y2="1262" stroke="{INK}" stroke-width="1" opacity="0.8"/>'
         + T(60, 1290, 'Design Style 风格 006', 14, CN, 700)
         + T(540, 1290, '每天一个设计风格', 14, CN, 500, GREY, 'middle')
         + T(1020, 1290, '@guanmo_ai', 12, TECH, 400, INK, 'end', 1)
         + T(60, 1316, '致敬：iMac G3（1998）的邦迪蓝、Mac OS X Aqua（2000）、i-mode 表情（1999）· 构图为重新创作', 11, CN, 400, GREY))
    save('poster.svg', s)



def title_chrome(name, x, y, text='Y2K', size=56):
    """页眉里中文标题后面那个小铬字（自己一层，地平线压在字的中线上）"""
    w = int(text_w(text, DISPLAY, size, 900, -2) + 40)
    h = int(size * 1.7)
    by = int(size * 1.25)
    return layer(name, x - 20, y - by, w, h, bevel=max(4, size * 0.075), smooth=1.2, shadowBlur=4, shadow=[0, size * 0.08, 0.4, 0],
                 cam=[w / 2, -(by - size * 0.37), size * 3.6], envRot=0.12,
                 texts=[dict(text=text, x=w / 2, y=by, size=size, font=f"'{DISPLAY}'", weight=900, align='center', ls=-2)])


def sec(y, n, cn, en):
    return (f'<g><rect x="60" y="{y - 16}" width="36" height="21" rx="10.5" fill="url(#gBlue)" stroke="#1144A8"/>'
            f'<rect x="66" y="{y - 14.5}" width="24" height="8" rx="4" fill="url(#gHi)"/>'
            + T(78, y - 1.5, n, 10, PIXEL, 400, WHITE, 'middle', 1)
            + T(106, y + 1, cn, 19, CN, 900)
            + T(106 + text_w(cn, CN, 19, 900) + 12, y, en, 10, TECH, 400, GREY, ls=1.6) + '</g>')


def card(x, y, w, h, rx=18, op=0.72):
    return (f'<rect x="{x:g}" y="{y + 10:g}" width="{w:g}" height="{h:g}" rx="{rx}" fill="{INK}" opacity="0.10" filter="url(#soft14)"/>'
            f'<rect x="{x:g}" y="{y:g}" width="{w:g}" height="{h:g}" rx="{rx}" fill="#FFFFFF" opacity="{op}" stroke="#FFFFFF" stroke-width="2"/>')


# ═══════════════════ 2 · 风格速查卡 ═══════════════════
def cheatsheet():
    s = page_bg(grid=False)
    s += header('千禧未来主义', 'Y2K', '风格速查卡 · 1997—2004 · 从 iMac G3 到 Mac OS X Aqua：给平面加一层“材质”', 'DESIGN STYLE N°006')
    s += title_chrome('cheat-title', 378, 110)
    s += chrome_star(990, 92, 30)

    # 01 材质
    s += sec(200, '01', '四种材质', 'MATERIALS')
    cw, cg, cy, ch = 228, 16, 214, 180
    mats = [('铬', 'CHROME', '上蓝、中白、下暗，', '在地平线处突然断开'),
            ('果冻', 'GEL', '半透明有色塑料：', '硬边高光 + 底部焦散'),
            ('泡泡', 'BUBBLE', '薄膜干涉：边缘一圈', '彩虹，中间几乎透明'),
            ('玻璃', 'GLASS', '2025 年的回声：边缘', '折射 + 色散 + 高光')]
    for i, (cn, en, a, b) in enumerate(mats):
        x = 60 + i * (cw + cg)
        s += card(x, cy, cw, ch)
        if i == 3:
            s += f'<rect x="{x + 12}" y="{cy + 12}" width="{cw - 24}" height="108" rx="12" fill="#FFFFFF" opacity="0.5"/>'
        s += T(x + 16, cy + 146, cn, 17, CN, 900) + T(x + 16 + text_w(cn, CN, 17, 900) + 8, cy + 145, en, 9, TECH, 400, GREY, ls=1.4)
        s += T(x + 16, cy + 164, a, 11.5, CN, 400, GREY) + T(x + 16, cy + 179 - 1, b, 11.5, CN, 400, GREY)
    mx = 60
    s += layer('cheat-mat', mx, cy, 3 * (cw + cg), 124, cam=[cw / 2, -62, 420], bevel=12, smooth=1.6, shadowBlur=8, shadow=[0, 10, 0.45, 0], envRot=0.12,
               texts=[dict(text='Cr', x=cw / 2, y=96, size=96, font=f"'{DISPLAY}'", weight=900, align='center', ls=-3)],
               gels=[[cw + cg + cw / 2, 64, 46, 0.35, rgb01(BONDI)]],
               bubbles=[[2 * (cw + cg) + cw / 2, 64, 50, 0.2]])
    gx = 60 + 3 * (cw + cg) + 12
    s += f'<clipPath id="cglass"><rect x="{gx}" y="{cy + 12}" width="{cw - 24}" height="108" rx="12"/></clipPath><g clip-path="url(#cglass)">'
    s += layer('cheat-glass', gx, cy + 12, cw - 24, 108, cam=[(cw - 24) / 2, -54, 360], bevel=10, smooth=1.6, shadowBlur=6, shadow=[0, 8, 0.4, 0], envRot=0.3,
               texts=[dict(text='25', x=(cw - 24) / 2, y=86, size=82, font=f"'{DISPLAY}'", weight=900, align='center', ls=-3)],
               wall=[[0.55, 0.75, 1.0, 0.85], [0.85, 1.0, 0.45, 0.55], [1.0, 0.7, 0.85, 0.55], [0.45, 0.9, 0.95, 0.6]],
               panes=[[(cw - 24) / 2 + 22, 54, 116, 76, 26, 18, 1]]) + '</g>'

    # 02 铬的色标
    s += sec(430, '02', '铬的色标', 'CHROME STOPS')
    bx, by_, bw = 60, 446, 600
    s += (f'<rect x="{bx}" y="{by_ + 4}" width="{bw}" height="40" rx="8" fill="{INK}" opacity="0.15" filter="url(#soft6)"/>'
          f'<rect x="{bx}" y="{by_}" width="{bw}" height="40" rx="8" fill="url(#gChromeH)" stroke="{INK}" stroke-opacity="0.25"/>')
    for o, c, lab in CHROME_STOPS:
        x = bx + o * bw
        anchor = 'start' if o == 0 else ('end' if o in (1, 0.49) else ('start' if o == 0.51 else 'middle'))
        dx = {0.49: -4, 0.51: 4}.get(o, 0)
        s += f'<path d="M{x:g} {by_ + 44} l-5 8 h10 Z" fill="{INK}"/>'
        s += T(x + dx, by_ + 66, c, 9, PIXEL, 400, INK, anchor, 0.6) + T(x + dx, by_ + 82, f'{int(o * 100)}% {lab}', 11, CN, 500, GREY, anchor)
    s += T(60, 548, '在 Figma / PS 里做“假铬”：一个竖向渐变 6 个色标就够——关键是 49% → 51% 那一下“断层”。', 12.5, CN, 500, INK)
    # 右边：同一套色标直接填进字里
    s += T(1020, 476, '2000', 60, DISPLAY, 900, 'url(#gChrome)', 'end', -2, extra=f' stroke="{INK}" stroke-width="1.2" stroke-opacity="0.55"')
    s += T(1020, 500, '↑ 只用渐变：平面版的铬', 11, CN, 500, GREY, 'end')

    # 03 色板
    s += sec(586, '03', '色板', 'COLOR')
    sw = [('墨蓝', INK, '文字 · 描边'), ('银', SILVER, '大面积'), ('纸灰', PAPER_T, '底色'), ('Aqua 蓝', AQUA, '按钮 · 点题'),
          ('邦迪蓝', BONDI, '果冻 · 外壳'), ('荧光绿', LIME, '只给“通过”')]
    for i, (n, c, use) in enumerate(sw):
        x = 60 + i * 110
        s += (f'<rect x="{x}" y="602" width="100" height="58" rx="10" fill="{c}" stroke="{INK}" stroke-opacity="0.2"/>'
              f'<rect x="{x + 6}" y="605" width="88" height="20" rx="8" fill="url(#gHi)" opacity="0.55"/>')
        s += T(x, 678, n, 12.5, CN, 700) + T(x + text_w(n, CN, 12.5, 700) + 6, 678, c, 8.5, PIXEL, 400, GREY, ls=0.4) + T(x, 694, use, 11, CN, 400, GREY)
    fx = 740
    s += f'<rect x="{fx - 12}" y="596" width="292" height="104" rx="14" fill="#FFFFFF" opacity="0.5" stroke="#FFFFFF"/>'
    s += T(fx, 616, 'iMac G3 · 1999 五种口味（近似色）', 11, CN, 500, GREY)
    s += layer('cheat-flavors', fx - 8, 620, 284, 58, cam=[142, -30, 400], gels=[[26 + i * 58, 29, 22, 0.3 + i * 0.5, rgb01(c)] for i, (_, _, c) in enumerate(FLAVORS)])
    for i, (cn, en, c) in enumerate(FLAVORS):
        s += T(fx + 18 + i * 58, 692, cn, 11, CN, 700, INK, 'middle')
    # 比例
    s += T(60, 724, '用量', 11, CN, 700)
    rx0, rw = 100, 920
    for a, b, c, lab, tc in ((0, 0.8, SILVER, '银 / 灰 80%', INK), (0.8, 0.95, AQUA, 'Aqua 15%', WHITE), (0.95, 1, LIME, '5%', INK)):
        s += f'<rect x="{rx0 + a * rw:g}" y="712" width="{(b - a) * rw:g}" height="16" fill="{c}"/>'
        s += T(rx0 + a * rw + 8, 724, lab, 10, CN, 700, tc)
    s += f'<rect x="{rx0}" y="712" width="{rw}" height="16" rx="3" fill="none" stroke="{INK}" stroke-opacity="0.3"/>'

    # 04 字体
    s += sec(770, '04', '字体', 'TYPE')
    fonts = [('Y2K 2000', DISPLAY, 30, 900, -1, 'Unbounded Black', '标题：圆胖的宽体几何字'),
             ('FUTURISM', TECH, 19, 400, 1, 'Michroma', '英文小标：宽、字距拉开'),
             ('READY 99%', PIXEL, 19, 400, 0, 'Silkscreen', '读数 / 状态：像素字'),
             ('千禧未来', CN, 32, 900, 0, '思源黑体 Black', '中文：粗黑，不用宋体')]
    for i, (smp, fam, sz, wt, ls, nm, use) in enumerate(fonts):
        x = 60 + i * 244
        s += card(x, 786, 228, 96, 14, 0.6)
        s += T(x + 16, 832, smp, sz, fam, wt, INK, ls=ls)
        s += T(x + 16, 856, nm, 10, TECH if fam != CN else CN, 400 if fam != CN else 700, AQUA, ls=0.8 if fam != CN else 0)
        s += T(x + 16, 873, use, 11, CN, 400, GREY)

    # 05 界面零件
    s += sec(918, '05', '界面零件', 'UI PARTS')
    px0, py0, pw, ph = 60, 934, 960, 92
    s += (f'<rect x="{px0}" y="{py0 + 12}" width="{pw}" height="{ph}" rx="12" fill="{INK}" opacity="0.18" filter="url(#soft14)"/>'
          f'<rect x="{px0}" y="{py0}" width="{pw}" height="{ph}" rx="12" fill="url(#pin)" stroke="#8C94A6"/>')
    s += traffic(px0 + 24, py0 + 24, 7)
    s += T(px0 + 24, py0 + 54, '红绿灯', 11, CN, 700) + T(px0 + 24, py0 + 70, '关闭 / 最小化 / 缩放', 10, CN, 400, GREY)
    s += gel_button(px0 + 150, py0 + 16, 88, 30, '继续', 'blue') + gel_button(px0 + 248, py0 + 16, 88, 30, '取消', 'white')
    s += T(px0 + 150, py0 + 70, '果冻按钮：高光占上半截 46%', 10.5, CN, 400, GREY)
    s += progress(px0 + 372, py0 + 22, 210, 18, 0.72) + T(px0 + 590, py0 + 36, '72%', 10, PIXEL, 400, AQUA)
    s += T(px0 + 372, py0 + 70, '进度条：斜条纹 + 高光', 10.5, CN, 400, GREY)
    s += checkbox(px0 + 640, py0 + 23) + checkbox(px0 + 664, py0 + 23) + checkbox(px0 + 688, py0 + 23, False)
    s += pill(px0 + 722, py0 + 21, 'Y2K ✓', size=9) + T(px0 + 640, py0 + 70, '勾选框 · 状态胶囊', 10.5, CN, 400, GREY)
    for i, n in enumerate(['heart', 'face', 'sun', 'note']):
        s += emoji(n, px0 + 828 + i * 32, py0 + 18, 2.2)
    s += T(px0 + 828, py0 + 70, '像素表情 12×12', 10.5, CN, 400, GREY)
    s += f'<line x1="{px0 + 128}" y1="{py0 + 14}" x2="{px0 + 128}" y2="{py0 + ph - 14}" stroke="{INK}" stroke-opacity="0.15"/>'
    for xx in (356, 622, 812):
        s += f'<line x1="{px0 + xx}" y1="{py0 + 14}" x2="{px0 + xx}" y2="{py0 + ph - 14}" stroke="{INK}" stroke-opacity="0.15"/>'

    # 06 五条规则
    s += sec(1062, '06', '五条规则', 'RULES')
    rules = [('铬要有地平线', '上蓝中白下暗，', '亮暗在地平线处断开'),
             ('果冻要透光', '硬边高光 + 底部焦散，', '越厚的地方越深'),
             ('底要有技术感', '2px 细条纹、80px 网格、', '刻度尺和套准标记'),
             ('像素字 + 宽体字', '读数用像素字，标题宽体，', '中文用粗黑体'),
             ('大面积银', '银灰八成，Aqua 蓝点题，', '荧光绿只给“通过”')]
    for i, (t, a, b) in enumerate(rules):
        x = 60 + i * 194
        s += card(x, 1078, 182, 96, 14, 0.72)
        s += T(x + 14, 1100, f'0{i + 1}', 11, PIXEL, 400, AQUA, ls=1) + T(x + 14, 1124, t, 15, CN, 900)
        s += T(x + 14, 1146, a, 11, CN, 400, GREY) + T(x + 14, 1162, b, 11, CN, 400, GREY)

    # 这样做 / 别这样
    s += pill(60, 1196, '这样做 ✓', fill=LIME, fam=CN, size=11, h=24) + T(150, 1213, '冷灰银底 · 铬与果冻 · 圆胖宽体字 · 技术小字和刻度 · 像素表情 · 星星点到为止', 12.5, CN, 500)
    s += pill(60, 1228, '别这样 ×', fill=INK, c=WHITE, fam=CN, size=11, h=24) + T(150, 1245, '暖色复古滤镜 · 平面无质感 · 满屏彩虹渐变 · 衬线体 · 灰色渐变冒充铬', 12.5, CN, 500, GREY)
    s += footer(1270)
    save('cheatsheet.svg', s)



# ═══════════════════ 3 · 概念界面 ═══════════════════
def shell(x, y, w, h, c):
    """半透明糖果色塑料外壳：透出里面的“肋条”，左边一道高光，底下投一片同色的影子"""
    cid = f'clip{x}'
    return (f'<rect x="{x + 10}" y="{y + 30}" width="{w - 20}" height="{h}" rx="60" fill="{c}" opacity="0.35" filter="url(#soft14)"/>'
            f'<clipPath id="{cid}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="62"/></clipPath>'
            f'<g clip-path="url(#{cid})"><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#shell_{c[1:]})"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#ribs)"/>'
            f'<rect x="{x}" y="{y}" width="34" height="{h}" fill="url(#gEdge)"/>'
            f'<ellipse cx="{x + w * 0.42}" cy="{y + 6}" rx="{w * 0.4}" ry="26" fill="#FFFFFF" opacity="0.45"/></g>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="62" fill="none" stroke="{c}" stroke-width="2"/>'
            f'<rect x="{x + 1.5}" y="{y + 1.5}" width="{w - 3}" height="{h - 3}" rx="60.5" fill="none" stroke="#FFFFFF" stroke-opacity="0.6"/>'
            f'<rect x="{x + w}" y="{y + 180}" width="5" height="70" rx="2.5" fill="{c}"/>'
            f'<rect x="{x - 5}" y="{y + 160}" width="5" height="44" rx="2.5" fill="{c}"/><rect x="{x - 5}" y="{y + 214}" width="5" height="44" rx="2.5" fill="{c}"/>')


def screen(x, y, w, h):
    return (f'<rect x="{x - 4}" y="{y - 4}" width="{w + 8}" height="{h + 8}" rx="50" fill="{INK}" opacity="0.55"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="46" fill="url(#gScreen)"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="46" fill="url(#pinBg)"/>')


def status(x, y, w, c=INK):
    bars = ''.join(f'<rect x="{x + w - 92 + i * 6}" y="{y - 3 - i * 3}" width="4" height="{4 + i * 3}" fill="{c}"/>' for i in range(4))
    batt = (f'<rect x="{x + w - 56}" y="{y - 12}" width="28" height="13" rx="2" fill="none" stroke="{c}" stroke-width="1.4"/>'
            f'<rect x="{x + w - 27}" y="{y - 8}" width="2.5" height="5" fill="{c}"/>'
            + ''.join(f'<rect x="{x + w - 53 + i * 5.5}" y="{y - 9}" width="4" height="7" fill="{c}"/>' for i in range(4)))
    return T(x, y, '9:41', 13, PIXEL, 400, c, ls=1) + bars + batt


def bubble_msg(x, y, lines, right=False, w=None, extra=''):
    fs, lh = 15, 22
    tw = max(text_w(l, CN, fs, 500) for l in lines)
    bw = w or tw + 32
    bh = 16 + lh * len(lines)
    x0 = x - bw if right else x
    g, st, tc = ('gBlue', '#1144A8', WHITE) if right else ('gWhite', '#9AA3B5', INK)
    out = (f'<rect x="{x0:g}" y="{y + 3}" width="{bw:g}" height="{bh}" rx="18" fill="{INK}" opacity="0.14" filter="url(#soft2)"/>'
           f'<rect x="{x0:g}" y="{y}" width="{bw:g}" height="{bh}" rx="18" fill="url(#{g})" stroke="{st}"/>'
           f'<rect x="{x0 + 10:g}" y="{y + 2}" width="{bw - 20:g}" height="{min(bh * 0.42, 18):g}" rx="9" fill="url(#gHi)" opacity="0.8"/>')
    for i, l in enumerate(lines):
        out += T(x0 + 16, y + 8 + lh * (i + 1) - 6, l, fs, CN, 500, tc)
    return out + extra, bh


def app_ui():
    s = page_bg(grid=False)
    s += header('如果千禧年来做', 'App', '二十五年前的 MP3 播放器和手机短信，搬进今天的手机 —— 一个音乐 App 的概念稿', 'UI CONCEPT N°006')
    s += title_chrome('app-title', 60 + text_w('如果千禧年来做', CN, 50, 900, -1) + 18, 110, 'App')
    s += chrome_star(990, 92, 30)
    py, ph, pw = 196, 892, 440
    # —— 手机 1：千禧.fm ——
    x1 = 60
    s += shell(x1, py, pw, ph, BONDI)
    sx, sy, sw, sh = x1 + 18, py + 18, pw - 36, ph - 36
    s += screen(sx, sy, sw, sh)
    s += status(sx + 30, sy + 36, sw - 30)
    logo_w = text_w('2K.fm', DISPLAY, 44, 900, -2)
    s += T(sx + sw - 28, sy + 84, '千禧电台', 14, CN, 900, INK, 'end') + T(sx + sw - 28, sy + 102, 'FM 99.9 · LIVE', 9, PIXEL, 400, AQUA, 'end', 0.8)
    lx, ly, lw, lh = sx + 24, sy + 124, sw - 48, 118
    eq = ''
    r = random.Random(3)
    for i in range(10):
        n = r.choice([3, 4, 5, 6, 7, 8, 6, 5])
        for j in range(n):
            eq += f'<rect x="{lx + lw - 118 + i * 10}" y="{ly + 90 - j * 7}" width="8" height="5" fill="{INK}" opacity="{0.85 if j < n - 1 else 0.35}"/>'
    s += (f'<rect x="{lx}" y="{ly + 2}" width="{lw}" height="{lh}" rx="14" fill="{INK}" opacity="0.25" filter="url(#soft2)"/>'
          f'<rect x="{lx}" y="{ly}" width="{lw}" height="{lh}" rx="14" fill="url(#gLcd)" stroke="#5E7FA0"/>'
          f'<rect x="{lx}" y="{ly}" width="{lw}" height="{lh}" rx="14" fill="url(#scan)"/>'
          f'<rect x="{lx + 8}" y="{ly + 4}" width="{lw - 16}" height="26" rx="10" fill="#FFFFFF" opacity="0.35"/>'
          + T(lx + 16, ly + 26, 'NOW PLAYING', 10, PIXEL, 400, INK, ls=1) + T(lx + lw - 16, ly + 26, '01 / 12', 10, PIXEL, 400, INK, 'end', 1)
          + T(lx + 16, ly + 60, 'Y2K BUG.MP3', 21, PIXEL, 400, INK, ls=0.5)
          + T(lx + 16, ly + 98, '02:00', 26, PIXEL, 400, INK) + T(lx + 112, ly + 98, '/ 04:20', 11, PIXEL, 400, INK, op=0.7)
          + eq + T(lx + lw - 16, ly + 108, '128KBPS · STEREO', 7.5, PIXEL, 400, INK, 'end', 0.5, op=0.7))
    s += T(sx + 28, sy + 548, '千年虫', 28, CN, 900) + T(sx + 28, sy + 572, '零点之前的最后一首歌 · 千禧乐队', 13, CN, 400, GREY)
    s += emoji('heart', sx + sw - 56, sy + 524, 2.3)
    s += progress(sx + 28, sy + 592, sw - 56, 14, 0.46)
    s += T(sx + 28, sy + 624, '02:00', 10, PIXEL, 400, GREY, ls=0.6) + T(sx + sw - 28, sy + 624, '-02:20', 10, PIXEL, 400, GREY, 'end', 0.6)
    cxp, cyp = sx + sw / 2, sy + 682
    for dx in (-104, 104):
        d = 'M-8 -8 L4 0 L-8 8 Z M5 -8 H9 V8 H5 Z'  # ▶| 下一首；左边那个镜像成 |◀
        bx = cxp + dx
        s += (f'<circle cx="{bx:g}" cy="{cyp + 3}" r="27" fill="{INK}" opacity="0.18" filter="url(#soft2)"/>'
              f'<circle cx="{bx:g}" cy="{cyp}" r="27" fill="url(#gWhite)" stroke="#9AA3B5"/>'
              f'<ellipse cx="{bx:g}" cy="{cyp - 13}" rx="17" ry="9" fill="url(#gHi)"/>'
              f'<path d="{d}" transform="translate({bx:g} {cyp}) scale({-1 if dx < 0 else 1} 1)" fill="{INK}"/>')
    vy = sy + 750
    s += (emoji('note', sx + 30, vy - 12, 2, GREY)
          + f'<rect x="{sx + 66}" y="{vy - 4}" width="{sw - 96}" height="8" rx="4" fill="url(#gTrack)" stroke="#8A93A6"/>'
          f'<rect x="{sx + 67}" y="{vy - 3}" width="{(sw - 98) * 0.62:.1f}" height="6" rx="3" fill="url(#gBlue)"/>'
          f'<circle cx="{sx + 66 + (sw - 96) * 0.62:.1f}" cy="{vy}" r="11" fill="url(#gWhite)" stroke="#8A93A6"/>'
          f'<ellipse cx="{sx + 66 + (sw - 96) * 0.62:.1f}" cy="{vy - 5}" rx="7" ry="4" fill="url(#gHi)"/>')
    dy = sy + sh - 62
    s += (f'<rect x="{sx + 24}" y="{dy}" width="{sw - 48}" height="46" rx="23" fill="#FFFFFF" opacity="0.6" stroke="#FFFFFF"/>'
          + ''.join(emoji(n, sx + 64 + i * 82, dy + 10, 2.2, None if i == 0 else GREY) for i, n in enumerate(['note', 'heart', 'mail', 'spark'])))
    s += layer('app-fm', sx, sy, sw, sh, cam=[24 + logo_w / 2, -(84 - 16), 170], bevel=3.4, smooth=1.1, shadowBlur=4, shadow=[0, 4, 0.4, 0], envRot=0.15,
               texts=[dict(text='2K.fm', x=24 + logo_w / 2 + 4, y=100, size=44, font=f"'{DISPLAY}'", weight=900, align='center', ls=-2)],
               gels=[[sw / 2, 372, 100, 0.25, rgb01(BONDI)], [sw / 2, 682, 40, 0.8, rgb01(AQUA)]],
               bubbles=[[66, 292, 26, 0.3], [sw - 62, 448, 36, 0.8], [sw - 92, 280, 12, 0.5], [84, 462, 9, 0.2]])
    for bx in (cxp - 12, cxp + 4):  # 暂停键：白色两竖，往下压一点，避开果冻的高光
        s += (f'<rect x="{bx:g}" y="{cyp - 1}" width="8" height="20" rx="3" fill="{INK}" opacity="0.35" filter="url(#soft2)"/>'
              f'<rect x="{bx:g}" y="{cyp - 3}" width="8" height="20" rx="3" fill="#FFFFFF"/>')
    s += chrome_star(sx + sw - 64, sy + 330, 22)

    # —— 手机 2：短信 ——
    x2 = 580
    s += shell(x2, py, pw, ph, FLAVORS[2][2])
    sx, sy = x2 + 18, py + 18
    s += screen(sx, sy, sw, sh)
    s += status(sx + 30, sy + 36, sw - 30)
    s += (T(sx + 26, sy + 92, '‹', 30, CN, 500, AQUA)
          + T(sx + 92, sy + 86, '小美', 18, CN, 900) + f'<circle cx="{sx + 97}" cy="{sy + 101}" r="4" fill="{LIME}" stroke="#7FA012"/>'
          + T(sx + 106, sy + 105, 'i-mode · 在线', 11, CN, 500, GREY) + emoji('phone', sx + sw - 56, sy + 72, 2.4)
          + f'<line x1="{sx + 20}" y1="{sy + 124}" x2="{sx + sw - 20}" y2="{sy + 124}" stroke="{INK}" stroke-opacity="0.15"/>')
    s += pill(sx + sw / 2, sy + 140, '31.12.1999  23:58', fill='#FFFFFF', c=GREY, fam=PIXEL, size=9, anchor='middle', h=20, stroke='#C9CED8')
    L, R = sx + 22, sx + sw - 22
    yy = sy + 176
    b, hh = bubble_msg(L, yy, ['千年虫会不会把手机', '变回 1900 年？'])
    s += b
    yy += hh + 12
    b, hh = bubble_msg(R, yy, ['不会！刚升级完 ✓'], True)
    s += b
    yy += hh + 12
    b, hh = bubble_msg(L, yy, ['那零点一起倒数？'], w=text_w('那零点一起倒数？', CN, 15, 500) + 66)
    s += b + emoji('heart', L + text_w('那零点一起倒数？', CN, 15, 500) + 24, yy + 10, 1.7)
    yy += hh + 14
    s += (f'<rect x="{R - 112}" y="{yy}" width="112" height="104" rx="22" fill="#FFFFFF" opacity="0.7" stroke="#C9CED8"/>'
          + emoji('face', R - 98, yy + 10, 7) + T(R - 120, yy + 98, '表情 12×12', 9, PIXEL, 400, GREY, 'end', 0.6))
    yy += 104 + 14
    b, hh = bubble_msg(R, yy, ['3、2、1……'], True)
    s += b
    yy += hh + 14
    s += pill(sx + sw / 2, yy, '00:00:00 · 01.01.2000 · Y2K OK ✓', fam=TECH, size=8.5, anchor='middle', h=22)
    yy += 22 + 14
    b, hh = bubble_msg(L, yy, ['新年快乐！'], w=text_w('新年快乐！', CN, 15, 500) + 112)
    s += b + ''.join(emoji(n, L + text_w('新年快乐！', CN, 15, 500) + 24 + i * 24, yy + 10, 1.7) for i, n in enumerate(['spark', 'sun', 'heart']))
    s += T(L + 6, yy + hh + 16, '00:00:03', 8.5, PIXEL, 400, GREY, ls=0.6)
    ey = sy + sh - 190
    s += (f'<rect x="{sx + 18}" y="{ey}" width="{sw - 36}" height="100" rx="20" fill="#FFFFFF" opacity="0.55" stroke="#FFFFFF"/>'
          + T(sx + 34, ey + 22, 'EMOJI · 176 · PAGE 1/4', 8.5, PIXEL, 400, GREY, ls=0.6))
    for i, n in enumerate(EMOJI):
        tx = sx + 32 + i * 50
        s += (f'<rect x="{tx}" y="{ey + 34}" width="42" height="42" rx="10" fill="url(#gWhite)" stroke="#B9C0CD"/>'
              + emoji(n, tx + 6.6, ey + 40.6, 2.4))
    s += T(sx + sw - 34, ey + 92, '● ○ ○ ○', 8, CN, 400, GREY, 'end')
    iy = sy + sh - 76
    s += (f'<rect x="{sx + 18}" y="{iy}" width="{sw - 136}" height="44" rx="22" fill="url(#gWhite)" stroke="#9AA3B5"/>'
          + T(sx + 40, iy + 28, '输入短信…', 14, CN, 400, GREY)
          + gel_button(sx + sw - 106, iy, 88, 44, '发送', 'blue', 16))
    s += layer('app-msg', sx, sy, sw, 140, cam=[60, -60, 300], gels=[[60, 92, 20, 0.4, rgb01(FLAVORS[1][2])]])
    s += chrome_star(R - 6, sy + 360, 16)

    # —— 说明 ——
    notes = [('播放键 = 一颗果冻', '半透明的蓝塑料：左上一块硬边高光，', '底部聚一团焦散光；越厚越深。'),
             ('屏幕 = 液晶 + 像素字', '读数一律像素字，加 3px 扫描线；', '标题用铬，正文才用黑体。'),
             ('外壳 = 糖果色塑料', '半透明到能看见里面的“肋条”，', '像 1998 年的 iMac G3。')]
    for i, (t, a, b) in enumerate(notes):
        x = 60 + i * 330
        s += (f'<rect x="{x}" y="{1120}" width="26" height="20" rx="10" fill="url(#gBlue)" stroke="#1144A8"/>'
              + T(x + 13, 1134, str(i + 1), 10, PIXEL, 400, WHITE, 'middle') + T(x + 36, 1137, t, 16, CN, 900)
              + T(x, 1166, a, 12, CN, 400, GREY) + T(x, 1186, b, 12, CN, 400, GREY))
    s += T(60, 1228, '注：应用、歌曲、对话均为虚构的概念稿；表情为原创 12×12 像素绘制，致敬 1999 年 i-mode 表情。', 11, CN, 400, GREY)
    s += footer(1270)
    save('app-ui.svg', s)



# ═══════════════════ 4 · 四步改造 ═══════════════════
SW, SH = 435, 420
STEP_FONT = f"'{CN}'"


def photo(cx, y=34):
    """原稿里那张“随便一张照片”的占位图"""
    return (f'<rect x="{cx - 150}" y="{y + 6}" width="300" height="170" rx="18" fill="#000" opacity="0.06"/>'
            f'<rect x="{cx - 150}" y="{y}" width="300" height="170" rx="18" fill="url(#gSoft)"/>'
            f'<circle cx="{cx - 60}" cy="{y + 66}" r="26" fill="#FFFFFF" opacity="0.5"/>'
            f'<path d="M{cx - 150} {y + 150}L{cx - 70} {y + 96}L{cx} {y + 136}L{cx + 60} {y + 86}L{cx + 150} {y + 146}V{y + 152}Q{cx + 150} {y + 170} {cx + 132} {y + 170}H{cx - 132}Q{cx - 150} {y + 170} {cx - 150} {y + 152}Z" fill="#FFFFFF" opacity="0.35"/>')


def mini(k, ox, oy):
    """同一张“周末市集”海报的四个版本（坐标是小图内部的 0..SW × 0..SH；ox/oy 只给材质层定位用）"""
    b = []
    cx = SW / 2
    chrome_title = dict(text='周末市集', x=cx, y=278, size=60, font=STEP_FONT, weight=900, align='center')
    lay = dict(cam=[cx, -(278 - 60 * 0.40), 360], bevel=2.6, smooth=1.0, shadowBlur=5, shadow=[0, 6, 0.45, 0], envRot=0.15)
    if k == 0:  # 原稿：与前几期同一张
        b.append(f'<rect width="{SW}" height="{SH}" fill="#F4F4F2"/>')
        b.append(photo(cx))
        b.append(T(cx, 266, '周末市集', 40, CN, 700, '#444444', 'middle'))
        b.append(T(cx, 298, '3 月 16 日 · 中山公园', 16, CN, 400, '#888888', 'middle'))
        b.append(T(cx, 322, '手作 · 咖啡 · 唱片 · 花', 14, CN, 400, '#999999', 'middle'))
        b.append(f'<rect x="{cx - 70}" y="348" width="140" height="40" rx="20" fill="#8BA3C7"/>')
        b.append(T(cx, 374, '了解更多', 15, CN, 500, WHITE, 'middle'))
        return ''.join(b)
    # k ≥ 1：底换成冷灰银 + 细条纹 + 网格 + 刻度 + 像素小字
    b.append(f'<rect width="{SW}" height="{SH}" fill="url(#bg)"/><rect width="{SW}" height="{SH}" fill="url(#pinBg)"/>'
             f'<rect width="{SW}" height="{SH}" fill="url(#grid80)"/><rect width="{SW}" height="{SH * 0.6:g}" fill="url(#glow)"/>')
    b.append(reg(14, 14, 6) + reg(SW - 14, 14, 6) + reg(14, SH - 14, 6) + reg(SW - 14, SH - 14, 6))
    b.append(T(28, 20, 'WEEKEND_MARKET.SIT', 8, PIXEL, 400, GREY, ls=0.8) + T(SW - 28, 20, 'N°0316 · 1.44 MB', 8, PIXEL, 400, GREY, 'end', 0.8))
    if k < 3:
        b.append(photo(cx))
    else:  # 照片换成一扇 Aqua 小窗，里面是一颗果冻糖
        wx, wy, ww, wh = cx - 150, 34, 300, 176
        b.append(f'<rect x="{wx}" y="{wy + 12}" width="{ww}" height="{wh}" rx="9" fill="{INK}" opacity="0.25" filter="url(#soft6)"/>'
                 f'<rect x="{wx}" y="{wy}" width="{ww}" height="{wh}" rx="9" fill="url(#pin)" stroke="#8C94A6"/>'
                 f'<path d="M{wx + 9} {wy} H{wx + ww - 9} Q{wx + ww} {wy} {wx + ww} {wy + 9} V{wy + 24} H{wx} V{wy + 9} Q{wx} {wy} {wx + 9} {wy} Z" fill="url(#gTitle)"/>'
                 f'<line x1="{wx}" y1="{wy + 24.5}" x2="{wx + ww}" y2="{wy + 24.5}" stroke="#9AA2B2"/>'
                 + traffic(wx + 14, wy + 12, 5) + T(cx, wy + 16, '市集.app', 10, CN, 500, '#2A3142', 'middle'))
    b.append(ruler(40, int(SW - 40), 218, 0.45))
    if k == 1:
        b.append(T(cx, 274, '周末市集', 48, CN, 900, INK, 'middle', -1))
    b.append(T(cx, 306, '3 月 16 日 · 中山公园', 16, CN, 700, INK, 'middle'))
    if k < 3:
        b.append(T(cx, 330, '手作 · 咖啡 · 唱片 · 花', 14, CN, 400, GREY, 'middle'))
        b.append(f'<rect x="{cx - 70}" y="348" width="140" height="40" rx="20" fill="#8BA3C7"/>')
        b.append(T(cx, 374, '了解更多', 15, CN, 500, WHITE, 'middle'))
    else:
        tags = [('face', '手作'), ('heart', '咖啡'), ('note', '唱片'), ('sun', '花')]
        tx = cx - 150
        for n, t in tags:
            b.append(emoji(n, tx, 318, 1.4) + T(tx + 21, 331, t, 14, CN, 500, INK))
            tx += 21 + text_w(t, CN, 14, 500) + 22
        b.append(gel_button(cx - 75, 348, 150, 40, '了解更多', 'blue', 15))
        b.append(pill(SW - 18, 358, '免费入场 ✓', fam=CN, size=10, anchor='end', h=20))
    if k == 2:
        b.append(layer('steps-3', ox, oy, SW, SH, texts=[chrome_title], **lay))
    if k == 3:
        b.append(layer('steps-4', ox, oy, SW, SH, texts=[chrome_title], **lay,
                       gels=[[cx - 34, 124, 60, 0.3, rgb01(BONDI)], [cx + 74, 92, 24, 1.2, rgb01(FLAVORS[1][2])]],
                       bubbles=[[cx + 98, 168, 26, 0.6], [cx - 118, 70, 12, 0.2], [cx + 40, 182, 8, 0.9]]))
        b.append(chrome_star(ox + SW - 54, oy + 252, 16))
        b.append(chrome_star(ox + 58, oy + 380, 16))
    return ''.join(b)


def steps():
    s = page_bg(grid=False)
    s += header('四步改造', '', '同一张普通海报，每一步只改一件事 —— 改到第四步，它就“装上了材质”', 'HOW-TO N°006')
    s += title_chrome('steps-title', 60 + text_w('四步改造', CN, 50, 900, -1) + 18, 110, 'Y2K')
    s += chrome_star(990, 92, 30)
    caps = [('原稿', '居中、浅灰、圆角照片、柔和阴影', '哪儿都对，就是没人看'),
            ('银底 + 技术感', '冷灰银底、细条纹、网格、刻度尺', '小字换成像素字，像一台仪器'),
            ('标题换成铬', '天空 + 地平线 + 地面，三段反射', '字要粗、要圆，倒角才好看'),
            ('果冻 + 泡泡 + 星星', '按钮做成果冻，照片换成一颗糖', '再撒两颗泡泡、一颗星，点到为止')]
    MX = (W - 2 * SW - 30) // 2
    for k in range(4):
        x = MX + (k % 2) * (SW + 30)
        y = 222 + (k // 2) * (SH + 96)
        s += (f'<rect x="{x}" y="{y + 14}" width="{SW}" height="{SH}" rx="16" fill="{INK}" opacity="0.16" filter="url(#soft14)"/>'
              f'<clipPath id="m{k}"><rect width="{SW}" height="{SH}" rx="16"/></clipPath>'
              f'<g transform="translate({x} {y})"><g clip-path="url(#m{k})">{mini(k, 0, 0)}</g></g>'
              f'<rect x="{x}" y="{y}" width="{SW}" height="{SH}" rx="16" fill="none" stroke="#FFFFFF" stroke-width="2"/>'
              f'<rect x="{x - 0.5}" y="{y - 0.5}" width="{SW + 1}" height="{SH + 1}" rx="16.5" fill="none" stroke="{INK}" stroke-opacity="0.18"/>')
        cy = y + SH + 40
        n, l1, l2 = caps[k]
        s += (f'<rect x="{x}" y="{cy - 20}" width="36" height="22" rx="11" fill="url(#{"gWhite" if k == 0 else "gBlue"})" stroke="{"#9AA3B5" if k == 0 else "#1144A8"}"/>'
              f'<rect x="{x + 6}" y="{cy - 18.5}" width="24" height="8" rx="4" fill="url(#gHi)"/>'
              + T(x + 18, cy - 4.5, f'0{k + 1}', 11, PIXEL, 400, INK if k == 0 else WHITE, 'middle', 1)
              + T(x + 46, cy, n, 20, CN, 900) + T(x + 46 + text_w(n, CN, 20, 900) + 12, cy, l1, 14, CN, 700)
              + T(x + 46 + text_w(n, CN, 20, 900) + 12, cy + 22, l2, 14, CN, 400, GREY))
        if k % 2 == 0:
            ax, ay = x + SW + 15, y + SH / 2
            s += (f'<circle cx="{ax}" cy="{ay}" r="13" fill="url(#gBlue)" stroke="#1144A8"/><ellipse cx="{ax}" cy="{ay - 6}" rx="8" ry="4.5" fill="url(#gHi)"/>'
                  f'<path d="M{ax - 3} {ay - 5} L{ax + 4} {ay} L{ax - 3} {ay + 5}" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>')
    s += footer()
    # 材质层：mini 里用的是小图坐标，这里把 <image> 挪到小图的位置（已在 translate 组里，所以不用再改）
    save('steps.svg', s)


if __name__ == '__main__':
    import sys
    want = sys.argv[1:]
    for fn in (poster, cheatsheet, app_ui, steps):
        if not want or fn.__name__ in want:
            fn()
