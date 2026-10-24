"""
风格 010 · Paper Cut 剪纸层叠 —— 四张风格图（1080×1350）

四张图共用一套层叠积木：一层一色的剪影 + 层间软阴影；不要渐变、不要 AI 生图。
边距 90 / 72，与 001—008 同一套页眉页脚。字宽按 Jost / 思源黑体度量。

  poster.svg      夜空层叠风景 + 笔记本卡片 PAPERCUTOUT
  cheatsheet.svg  五条规则、色板、远慢近快示意、这样做 / 别这样
  app-ui.svg      如果剪纸层叠来做天气 App
  steps.svg       四步改造：平涂 → 剪影 → 叠阴影 → 视差

用法：python3 styles/010-paper-cut/images/make_svgs.py
"""
import math
import os
from xml.sax.saxutils import escape

from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
FONTS = os.path.join(ROOT, 'public', 'fonts')
W, H = 1080, 1350
MX, MY = 90, 72
CW = W - 2 * MX

SKY, SUN, INK, GREY, PAPER, CREAM = '#071820', '#E23A2B', '#142028', '#5C6E72', '#F6F3EB', '#EDE8DC'
HILLS = ['#134A5C', '#1B6572', '#287E7C', '#3D9884', '#6BB894', '#B8DCC8']
TREES = ['#0E3A48', '#164E58', '#1F6A68', '#2A8074', '#3A9A80', '#4A8A70']

FAM = "'Jost', 'Futura', 'Avenir Next', sans-serif"
FAM_SC = "'Noto Sans SC', 'PingFang SC', sans-serif"
FAM_MONO = "'JetBrains Mono', ui-monospace, monospace"

_FONTS = {}


def _font(kind, weight):
    key = (kind, weight)
    if key not in _FONTS:
        if kind == 'jost':
            f = TTFont(os.path.join(FONTS, 'Jost.ttf'))
        else:
            name = {400: 'Regular', 500: 'Medium', 700: 'Bold', 900: 'Black'}[weight]
            f = TTFont(os.path.join(FONTS, f'NotoSansSC-{name}.otf'))
        _FONTS[key] = (f.getBestCmap(), f['hmtx'], f['head'].unitsPerEm)
    return _FONTS[key]


def width(s, size, weight=500, ls=0.0, kind='jost'):
    w = 0
    for ch in s:
        cmap, hm, upm = _font(kind, 500 if kind == 'jost' else weight)
        if ord(ch) not in cmap:
            cmap, hm, upm = _font('sc', 900 if weight >= 800 else 700 if weight >= 600 else 500)
        w += hm[cmap[ord(ch)]][0] / upm
    return (w + ls * (len(s) - 1)) * size


def T(x, y, s, size, weight=500, fill=INK, ls=0.0, anchor=None, fam=FAM, extra=''):
    a = f' text-anchor="{anchor}"' if anchor else ''
    l = f' letter-spacing="{ls * size:.2f}"' if ls else ''
    return (
        f'<text x="{x:.1f}" y="{y:.1f}" font-family="{fam}" font-weight="{weight}" font-size="{size}"'
        f'{l}{a} fill="{fill}"{extra}>{escape(s)}</text>'
    )


def ZH(x, y, s, size, weight=700, fill=INK, ls=0.0, anchor=None):
    return T(x, y, s, size, weight, fill, ls, anchor, FAM_SC)


def MONO(x, y, s, size, fill=GREY, ls=0.08, anchor=None):
    return T(x, y, s, size, 500, fill, ls, anchor, FAM_MONO)


def g(parts, extra=''):
    return f'<g{(" " + extra) if extra else ""}>{"".join(parts)}</g>'


def f1(v):
    return f'{v:.1f}'


def hill(y0, amp, ph, y_bottom=1400):
    pts = []
    for i in range(0, 21):
        x = -40 + i * 58
        y = y0 + amp * math.sin(i * 0.55 + ph) + amp * 0.35 * math.sin(i * 1.1 + ph * 1.7)
        pts.append((x, y))
    d = f'M{f1(pts[0][0])} {f1(pts[0][1])}'
    for i in range(1, len(pts)):
        d += f'L{f1(pts[i][0])} {f1(pts[i][1])}'
    d += f'L1120 {y_bottom} L-40 {y_bottom} Z'
    return d


def pine(x, y, h):
    w = h * 0.58
    t1, t2, t3 = y - h, y - h * 0.62, y - h * 0.28
    stem = h * 0.16
    return (
        f'M{f1(x)} {f1(t1)} L{f1(x + w * 0.42)} {f1(t2)} L{f1(x - w * 0.42)} {f1(t2)} Z'
        f'M{f1(x)} {f1(t2 + 6)} L{f1(x + w * 0.62)} {f1(t3)} L{f1(x - w * 0.62)} {f1(t3)} Z'
        f'M{f1(x)} {f1(t3 + 6)} L{f1(x + w * 0.78)} {f1(y - stem)} L{f1(x - w * 0.78)} {f1(y - stem)} Z'
        f'M{f1(x - 4)} {f1(y - stem)} H{f1(x + 4)} V{f1(y)} H{f1(x - 4)} Z'
    )


def sun(cx, cy, r, rays=16):
    d = f'M{f1(cx - r)} {f1(cy)} a{r} {r} 0 1 0 {2 * r} 0 a{r} {r} 0 1 0 {-2 * r} 0 Z'
    for i in range(rays):
        a = math.radians((i + 0.5) * 360 / rays)
        x0, y0 = cx + math.cos(a) * (r + 10), cy + math.sin(a) * (r + 10)
        x1, y1 = cx + math.cos(a) * (r + 38), cy + math.sin(a) * (r + 38)
        nx, ny = -math.sin(a) * 5, math.cos(a) * 5
        d += f'M{f1(x0 + nx)} {f1(y0 + ny)} L{f1(x1)} {f1(y1)} L{f1(x0 - nx)} {f1(y0 - ny)} Z'
    return d


def shadow_filter(name, dy, blur, o=0.34):
    return (
        f'<filter id="{name}" x="-15%" y="-15%" width="130%" height="150%">'
        f'<feDropShadow dx="0" dy="{dy}" stdDeviation="{blur / 2}" flood-color="#06141C" flood-opacity="{o}"/>'
        f'</filter>'
    )


def header_footer(title, sub):
    return ''.join([
        MONO(MX, 48, 'DESIGN STYLE  /  N°010', 14, GREY, 0.14),
        ZH(W - MX, 48, '每天一个设计风格', 16, 500, GREY, 0, 'end'),
        MONO(MX, H - 36, '010  ·  PAPER CUT', 13, GREY, 0.12),
        T(W - MX, H - 36, '@guanmo_ai', 14, 500, GREY, 0.04, 'end'),
    ])


def landscape(x, y, w, h, trees=True):
    """一块层叠风景，坐标是外框"""
    ys = [0.30, 0.40, 0.50, 0.60, 0.72, 0.84]
    parts = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{SKY}"/>']
    cx, cy, r = x + w * 0.78, y + h * 0.22, min(w, h) * 0.07
    parts.append(f'<path d="{sun(cx, cy, r)}" fill="{SUN}" filter="url(#shF)"/>')
    pine_x = [
        [(0.12, 0.34, 0.16), (0.48, 0.31, 0.2), (0.86, 0.33, 0.15)],
        [(0.22, 0.42, 0.18), (0.62, 0.41, 0.22)],
        [(0.18, 0.52, 0.2), (0.70, 0.51, 0.18)],
        [(0.34, 0.62, 0.22), (0.78, 0.61, 0.16)],
        [(0.28, 0.74, 0.16), (0.58, 0.73, 0.14)],
        [(0.42, 0.86, 0.1)],
    ]
    cid = f'box{int(x)}{int(y)}{int(w)}{int(h)}'
    for i, yy in enumerate(ys):
        d = hill(y + h * yy, h * 0.045, 0.6 + i * 0.7, y + h + 4)
        parts.append(f'<path d="{d}" fill="{HILLS[i]}" filter="url(#sh{"F" if i < 2 else "M" if i < 4 else "N"})"/>')
        if trees:
            for px, py, ph in pine_x[i]:
                parts.append(f'<path d="{pine(x + w * px, y + h * py, h * ph)}" fill="{TREES[i]}"/>')
    return f'<clipPath id="{cid}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8"/></clipPath>' + g(parts, f'clip-path="url(#{cid})"')


def head():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <defs>
    {shadow_filter('shF', 8, 10, 0.38)}
    {shadow_filter('shM', 14, 14, 0.44)}
    {shadow_filter('shN', 20, 18, 0.5)}
  </defs>
'''


def poster():
    card = [
        f'<rect x="72" y="168" width="420" height="210" rx="16" fill="{PAPER}" filter="url(#shN)"/>',
        f'<rect x="58" y="186" width="24" height="174" rx="10" fill="{PAPER}"/>',
    ]
    for i in range(7):
        card.append(f'<circle cx="70" cy="{204 + i * 24}" r="5" fill="{SKY}"/>')
    card += [
        MONO(108, 214, '010  ·  PAPER CUT', 13, GREY, 0.14),
        T(108, 268, 'PAPERCUTOUT', 34, 700, INK, 0.12),
        ZH(108, 312, '剪纸层叠', 28, 700, INK),
        f'<rect x="108" y="328" width="120" height="2" fill="{SUN}"/>',
        T(108, 354, 'strata shadows  ·  silhouette depth', 12, 500, GREY, 0.06),
    ]
    body = [
        f'<rect width="{W}" height="{H}" fill="{SKY}"/>',
        landscape(0, 0, W, H),
        g(card),
        header_footer('海报', ''),
        ZH(MX, 1280, '层移即故事', 22, 500, PAPER),
        T(W - MX, 1280, 'layer motion is the story', 14, 500, PAPER, 0.04, 'end'),
    ]
    return head() + ''.join(body) + '</svg>\n'


def cheatsheet():
    rules = [
        ('01', '一层一色', '一张纸只涂一种颜色'),
        ('02', '阴影即深度', '层缝里的软影才是纸'),
        ('03', '剪影不描细节', '形状是剪出来的'),
        ('04', '远慢近快', '层移的量不同，深度就有了'),
        ('05', '限色家族，一点红日', '三到六阶同类色 + 一个暖色'),
    ]
    chips = ''.join(
        f'<rect x="{MX + i * 74}" y="118" width="64" height="36" rx="8" fill="{c}"/>' for i, c in enumerate([SKY, SUN] + HILLS)
    )
    rows = []
    for i, (n, zh, tip) in enumerate(rules):
        y = 220 + i * 118
        rows += [
            f'<rect x="{MX}" y="{y}" width="{CW}" height="106" rx="14" fill="{PAPER}" filter="url(#shF)"/>',
            f'<rect x="{MX}" y="{y}" width="10" height="106" rx="5" fill="{HILLS[min(i, 5)]}"/>',
            MONO(MX + 28, y + 36, n, 14, SUN, 0.1),
            ZH(MX + 28, y + 62, zh, 26, 900),
            ZH(MX + 28, y + 90, tip, 16, 500, GREY),
        ]
    dos = [
        ZH(MX, 860, '这样做', 22, 900, INK),
        ZH(MX, 896, '一层一色 · 影子落在下一张纸上 · 剪影 · 远层几乎不动', 16, 500, GREY),
        ZH(MX, 960, '别这样', 22, 900, SUN),
        ZH(MX, 996, '没阴影的贴纸 · 所有层同速平移 · 一层上画渐变细节', 16, 500, GREY),
    ]
    body = [
        f'<rect width="{W}" height="{H}" fill="{CREAM}"/>',
        header_footer('速查', ''),
        ZH(MX, 96, '五条规则', 36, 900),
        MONO(MX + 200, 96, 'CHEATSHEET', 14, GREY, 0.12),
        chips,
        *rows,
        *dos,
        landscape(MX, 1040, CW, 220, trees=True),
    ]
    return head() + ''.join(body) + '</svg>\n'


def app_ui():
    phone_x, phone_y, pw, ph = 300, 130, 480, 900
    cards = [
        (MX, 1088, '层叠插画', 'APP ILLUSTRATION'),
        (MX + 460, 1088, '视差滚动', 'SCROLL PARALLAX'),
    ]
    body = [
        f'<rect width="{W}" height="{H}" fill="#0A141C"/>',
        header_footer('App', ''),
        f'<rect x="{phone_x}" y="{phone_y}" width="{pw}" height="{ph}" rx="48" fill="#1A2228" filter="url(#shN)"/>',
        f'<rect x="{phone_x + 16}" y="{phone_y + 16}" width="{pw - 32}" height="{ph - 32}" rx="36" fill="{SKY}"/>',
        landscape(phone_x + 16, phone_y + 16, pw - 32, 420),
        MONO(phone_x + 40, phone_y + 64, '09:41', 14, PAPER, 0.1),
        ZH(phone_x + 40, phone_y + 480, '今日天气', 18, 500, PAPER),
        T(phone_x + 40, phone_y + 575, '18°', 80, 600, PAPER, 0.02),
        ZH(phone_x + 40, phone_y + 620, '晴  ·  层在跟着你的手指走', 18, 500, PAPER),
        f'<rect x="{phone_x + 36}" y="{phone_y + 660}" width="{pw - 72}" height="80" rx="16" fill="{PAPER}"/>',
        ZH(phone_x + 56, phone_y + 710, '近层走得更远，远层几乎不动', 18, 700, INK),
    ]
    for x, y, zh, en in cards:
        body += [
            f'<rect x="{x}" y="{y}" width="430" height="120" rx="18" fill="{PAPER}" filter="url(#shM)"/>',
            MONO(x + 24, y + 42, en, 12, SUN, 0.12),
            ZH(x + 24, y + 86, zh, 26, 700),
        ]
    return head() + ''.join(body) + '</svg>\n'


def steps():
    titles = [
        ('01', '平涂插画', '一块颜色铺满，没有层'),
        ('02', '剪成剪影', '只留下外轮廓'),
        ('03', '叠上阴影', '层缝里出现深度'),
        ('04', '错开层移', '远慢近快，故事开始'),
    ]
    body = [
        f'<rect width="{W}" height="{H}" fill="{CREAM}"/>',
        header_footer('四步', ''),
        ZH(MX, 96, '四步改成剪纸层叠', 32, 900),
    ]
    for i, (n, zh, tip) in enumerate(titles):
        y = 130 + i * 290
        body += [
            f'<rect x="{MX}" y="{y}" width="{CW}" height="270" rx="16" fill="{PAPER}" filter="url(#shF)"/>',
            MONO(MX + 24, y + 40, n, 14, SUN, 0.1),
            ZH(MX + 70, y + 42, zh, 24, 900),
            ZH(MX + 24, y + 74, tip, 16, 500, GREY),
        ]
        if i == 0:
            body.append(f'<rect x="{MX + 24}" y="{y + 96}" width="{CW - 48}" height="150" rx="8" fill="{HILLS[3]}"/>')
        elif i == 1:
            body.append(f'<rect x="{MX + 24}" y="{y + 96}" width="{CW - 48}" height="150" rx="8" fill="{SKY}"/>')
            body.append(f'<path d="{hill(y + 170, 18, 1.2, y + 250)}" fill="{HILLS[3]}"/>')
        elif i == 2:
            body.append(landscape(MX + 24, y + 96, CW - 48, 150, trees=False))
        else:
            body.append(landscape(MX + 24, y + 96, CW - 48, 150, trees=True))
            body.append(ZH(MX + 40, y + 230, '近层 →    远层 →', 16, 700, PAPER))
    return head() + ''.join(body) + '</svg>\n'


def write(name, svg):
    path = os.path.join(HERE, name)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(svg)
    print('wrote', path)


if __name__ == '__main__':
    write('poster.svg', poster())
    write('cheatsheet.svg', cheatsheet())
    write('app-ui.svg', app_ui())
    write('steps.svg', steps())
