"""
风格 014 · 液态玻璃 Liquid Glass —— 风格图（1080×1350）

  poster.svg      海报：一面字墙 + 网格，几块玻璃压上去把它弯过来
  cheatsheet.svg  速查卡：五层材质、边缘坡度曲线、三种厚度、五条规则、CSS
  app-ui.svg      如果液态玻璃来做 App：音乐播放页，带标注

玻璃全部是真折射：每块玻璃由 glass.py 按形状算出位移贴图，SVG 用 feDisplacementMap 把后面的内容弯过来，
R / G / B 三个通道弯得略不一样（色散）。改形状、厚度、光的方向，重跑即可。
用法：python3 styles/014-liquid-glass/images/make_svgs.py
"""
import math
import os
import sys
from xml.sax.saxutils import escape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from glass import lens, sdf_circle, sdf_round_rect, smooth_union, svg_lens  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1350
NO = '014'

INK = '#0B0C10'
PAPER = '#F3F2EE'
ORANGE = '#FF5A1F'
PINK = '#FF2E7E'
BLUE = '#2E4BFF'
MINT = '#2BD9A0'
VIOLET = '#8B5CFF'
MUTE = '#6B6E78'

DISPLAY = "'Inter Display', 'Inter', 'Noto Sans SC', sans-serif"
TEXT = "'Inter', 'Noto Sans SC', sans-serif"
MONO = "'Geist Mono', 'JetBrains Mono', monospace"
SC = "'Noto Sans SC', 'PingFang SC', sans-serif"


def t(x, y, size, text, family=TEXT, weight=400, fill=INK, ls='0', anchor='start', extra=''):
    return (
        f'<text x="{x:.1f}" y="{y:.1f}" font-family="{family}" font-weight="{weight}" '
        f'font-size="{size}" fill="{fill}" letter-spacing="{ls}" text-anchor="{anchor}" {extra}>'
        f'{escape(text)}</text>'
    )


def doc(defs, body):
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img">\n'
        f'  <defs>\n    {defs}\n  </defs>\n{body}\n</svg>\n'
    )


def grid(x0, y0, x1, y1, step, color='#FFFFFF', op=0.22, sw=1):
    out = []
    x = x0
    while x <= x1 + 0.1:
        out.append(f'<line x1="{x:.1f}" y1="{y0}" x2="{x:.1f}" y2="{y1}"/>')
        x += step
    y = y0
    while y <= y1 + 0.1:
        out.append(f'<line x1="{x0}" y1="{y:.1f}" x2="{x1}" y2="{y:.1f}"/>')
        y += step
    return f'<g stroke="{color}" stroke-opacity="{op}" stroke-width="{sw}">{"".join(out)}</g>'


def field(gid, w=W, h=H, spots=None):
    """彩色底：几团放射渐变叠起来（玻璃本身无色，颜色全靠后面的内容）"""
    spots = spots or [(0.12, 0.10, ORANGE, 0.75), (0.95, 0.35, PINK, 0.7), (0.10, 0.80, BLUE, 0.8), (0.92, 0.98, MINT, 0.6)]
    defs, body = [], [f'<rect width="{w}" height="{h}" fill="{VIOLET}"/>']
    for i, (fx, fy, c, r) in enumerate(spots):
        defs.append(
            f'<radialGradient id="{gid}{i}" cx="{fx * w:.0f}" cy="{fy * h:.0f}" r="{r * max(w, h):.0f}" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="{c}"/><stop offset="1" stop-color="{c}" stop-opacity="0"/></radialGradient>'
        )
        body.append(f'<rect width="{w}" height="{h}" fill="url(#{gid}{i})"/>')
    return ''.join(defs), ''.join(body)


# ======================================================================
# 海报
# ======================================================================

def poster():
    fd, fb = field('pf')
    words = (
        t(46, 352, 262, 'LIQUID', DISPLAY, 700, INK, '-12')
        + t(40, 610, 300, 'GLASS', DISPLAY, 700, INK, '-14')
        + t(56, 820, 168, '液态玻璃', SC, 900, '#FFFFFF', '-4')
    )
    small = []
    for i, line in enumerate([
        'REFRACTION = SLOPE OF THE EDGE',
        'BEVEL 44 · INDEX 1.5 · TINT 6%',
        'RIM 1PX · LIGHT −37° · CHROMA 6%',
        '2001 AQUA → 2013 iOS 7 → 2025',
    ]):
        small.append(t(62, 905 + i * 30, 19, line, MONO, 500, INK, '1.5'))
    for i in range(14):  # 右侧一列小刻度：弯过来以后最容易看出“折射”
        y = 880 + i * 22
        small.append(f'<rect x="{900}" y="{y}" width="{60 + (i % 4) * 26}" height="4" fill="{INK}"/>')
    bg = (
        f'<g id="bg">{fb}{grid(0, 0, W, H, 54)}{words}{"".join(small)}'
        f'{t(62, 92, 22, f"NO. {NO}  ·  2013—今天", MONO, 500, INK, "3")}'
        f'{t(1018, 92, 22, "DESIGN STYLE", MONO, 500, INK, "3", "end")}</g>'
    )

    lenses = [
        ('L1', lens(sdf_round_rect(70, 400, 940, 236, 118), (70, 400, 940, 236), bevel=50, edge=0.9, mag=0.07)),
        ('L2', lens(sdf_circle(790, 1010, 138), (652, 872, 276, 276), bevel=70, edge=0.8, mag=0.12)),
        ('L3', lens(smooth_union(46, sdf_circle(176, 1060, 74), sdf_circle(328, 1092, 56)), (96, 980, 300, 175),
                    bevel=40, edge=0.9, mag=0.08)),
        ('L4', lens(sdf_round_rect(56, 1188, 968, 112, 56), (56, 1188, 968, 112), bevel=30, edge=0.7, mag=0.02,
                    tint=(255, 255, 255, 0.34))),
    ]
    defs, body = [fd], ['<use href="#bg"/>']
    for lid, L in lenses:
        d, b = svg_lens(lid, L)
        defs.append(d)
        body.append(b)
    body.append(t(96, 1254, 30, '玻璃不发光，只把后面的东西弯过来。', SC, 700, INK))
    body.append(t(984, 1254, 20, '边越厚，弯得越狠', SC, 500, INK, '1', 'end'))
    return doc(''.join(defs) + bg, ''.join(body))


# ======================================================================
# 速查卡
# ======================================================================

def cheatsheet():
    defs, body = [], []
    body.append(f'<rect width="{W}" height="{H}" fill="{PAPER}"/>')
    body.append(t(72, 150, 92, 'Liquid Glass', DISPLAY, 700, INK, '-3'))
    body.append(t(72, 204, 30, '速查 · 五层材质、一条坡度曲线、三种厚度、三条规则', SC, 700, INK))
    body.append(t(1008, 150, 20, f'NO. {NO} · 2013—今天', MONO, 500, MUTE, '2', 'end'))

    # --- 01 五层材质：一块玻璃拆开 ---
    body.append(t(72, 280, 20, '01  一块玻璃 = 五层（从下往上）', SC, 700, BLUE, '2'))
    fd, fb = field('cf', 440, 300, [(0.1, 0.1, ORANGE, 0.8), (0.95, 0.4, PINK, 0.7), (0.2, 1.0, BLUE, 0.9)])
    swatch = f'<g id="cbg">{fb}{grid(0, 0, 440, 300, 30)}{t(26, 190, 130, "Aa", DISPLAY, 700, INK, "-4")}{t(250, 130, 26, "内容", SC, 900, "#FFF")}{t(250, 168, 26, "在底下", SC, 900, "#FFF")}</g>'
    defs.append(fd)
    defs.append(f'<clipPath id="cclip"><rect x="0" y="0" width="440" height="300" rx="18"/></clipPath>')
    body.append(f'<g transform="translate(72 304)" clip-path="url(#cclip)"><use href="#cbg"/>')
    L = lens(sdf_round_rect(60, 70, 320, 160, 80), (60, 70, 320, 160), bevel=40, edge=0.95, mag=0.07)
    d, b = svg_lens('CL', L, '#cbg')
    defs.append(d)
    body.append(b + '</g>')
    defs.append(swatch)
    layers = [
        ('5', '投影', 'shadow', '0 10 32 / 18% 黑'),
        ('4', '边缘高光', 'rim', '1px · 迎光亮、背光暗'),
        ('3', '底色', 'tint', '白 6%（暗色 黑 20%）'),
        ('2', '折射', 'refraction', '边缘 44px 内按坡度弯'),
        ('1', '内容', 'content', '玻璃本身无色'),
    ]
    for i, (n, zh, en, v) in enumerate(layers):
        y = 330 + i * 56
        body.append(f'<circle cx="{560}" cy="{y - 7}" r="15" fill="{INK}"/>' + t(560, y - 1, 16, n, MONO, 500, '#FFF', '0', 'middle'))
        body.append(t(590, y, 24, zh, SC, 700, INK) + t(700, y, 18, en, MONO, 500, MUTE, '1'))
        body.append(t(846, y, 18, v, SC, 400, INK))

    # --- 02 坡度曲线 ---
    body.append(t(72, 664, 20, '02  折射量 = 边缘的坡度', SC, 700, BLUE, '2'))
    ox, oy, gw, gh = 72, 690, 440, 200
    body.append(f'<rect x="{ox}" y="{oy}" width="{gw}" height="{gh}" fill="#FFFFFF" rx="14"/>')
    # 截面：中间平、两边圆弧下去
    pts_h, pts_s = [], []
    for i in range(0, 201):
        u = i / 200
        dd = min(u, 1 - u) * 2  # 0 边 → 1 中心
        tt = max(0.0, 1 - dd / 0.32)
        hgt = math.sqrt(max(0.0, 1 - tt * tt))
        slope = tt ** 2.4
        X = ox + 30 + u * (gw - 60)
        pts_h.append(f'{X:.1f},{oy + 112 - hgt * 70:.1f}')
        pts_s.append(f'{X:.1f},{oy + 180 - slope * 52:.1f}')
    body.append(f'<polyline points="{" ".join(pts_h)}" fill="none" stroke="{INK}" stroke-width="3"/>')
    body.append(f'<polyline points="{" ".join(pts_s)}" fill="none" stroke="{ORANGE}" stroke-width="3"/>')
    body.append(t(ox + 30, oy + 30, 16, '截面：厚度', SC, 500, INK) + t(ox + gw / 2, oy + 166, 16, '位移量：越靠边越大', SC, 500, ORANGE, '0', 'middle'))
    body.append(f'<line x1="{ox + 30 + 0.16 * (gw - 60):.1f}" y1="{oy + 40}" x2="{ox + 30 + 0.16 * (gw - 60):.1f}" y2="{oy + 186}" stroke="{MUTE}" stroke-dasharray="3 4"/>')
    body.append(t(ox + 30 + 0.16 * (gw - 60) + 8, oy + 58, 14, 'bevel', MONO, 500, MUTE))
    notes = [
        ('中间是平的', '几乎不弯，字照常可读。'),
        ('边缘一圈是坡', '越靠外越陡，位移 ∝ t^2.4。'),
        ('R/G/B 弯得不一样', '差 6% 就够，边上出一道彩边。'),
    ]
    for i, (a, b2) in enumerate(notes):
        y = 712 + i * 62
        body.append(t(560, y, 22, a, SC, 700, INK) + t(560, y + 28, 18, b2, SC, 400, MUTE))

    # --- 03 三种厚度 ---
    body.append(t(72, 942, 20, '03  厚度 = 层级：越靠上越厚', SC, 700, BLUE, '2'))
    fd2, fb2 = field('tf', 936, 150, [(0.0, 0.0, ORANGE, 0.5), (0.5, 1.0, PINK, 0.5), (1.0, 0.0, BLUE, 0.6)])
    defs.append(fd2)
    defs.append(f'<g id="tbg">{fb2}{grid(0, 0, 936, 150, 24)}' + ''.join(
        t(18 + k * 312, 112, 96, 'Aa', DISPLAY, 700, INK, '-3') for k in range(3)) + '</g>')
    defs.append('<clipPath id="tclip"><rect width="936" height="150" rx="18"/></clipPath>')
    body.append('<g transform="translate(72 966)" clip-path="url(#tclip)"><use href="#tbg"/>')
    for k, (bev, lbl, sub) in enumerate([(10, '薄 · 8–12', '列表行、标签'), (24, '常规 · 20–28', '按钮、导航'), (44, '厚 · 40–56', '浮层、播放器')]):
        x0 = 70 + k * 312
        Lk = lens(sdf_round_rect(x0, 26, 200, 98, 49), (x0, 26, 200, 98), bevel=bev, edge=0.95, mag=0.03 + k * 0.03, pad=24)
        d, b = svg_lens(f'T{k}', Lk, '#tbg')
        defs.append(d)
        body.append(b)
    body.append('</g>')
    for k, (lbl, sub) in enumerate([('薄 · bevel 8–12', '列表行、标签'), ('常规 · 20–28', '按钮、导航栏'), ('厚 · 40–56', '浮层、播放器')]):
        body.append(t(72 + k * 312 + 4, 1146, 19, lbl, SC, 700, INK) + t(72 + k * 312 + 4, 1172, 16, sub, SC, 400, MUTE))

    # --- 04 规则 + CSS ---
    rules = [
        ('只放在控件层', '内容上不用，玻璃上不叠玻璃'),
        ('字要自适应', '后亮用黑字、后暗用白字 ≥ 4.5:1'),
        ('靠近就融合', '间距 < 24px → smooth-min 合一'),
    ]
    body.append(t(72, 1222, 20, '04  规则', SC, 700, BLUE, '2'))
    for i, (a, b2) in enumerate(rules):
        y = 1256 + i * 32
        body.append(t(72, y, 19, f'0{i + 1}', MONO, 500, ORANGE) + t(108, y, 19, a, SC, 700, INK) + t(250, y, 17, b2, SC, 400, INK))
    css = [
        '.glass {',
        '  backdrop-filter: url(#lens) saturate(1.5);',
        '  background: rgb(255 255 255 / .06);',
        '  box-shadow: inset 1px 1px 0 #fff9,',
        '    0 10px 32px #0002;',
        '}',
    ]
    body.append(f'<rect x="636" y="1200" width="372" height="122" rx="12" fill="{INK}"/>')
    for i, line in enumerate(css):
        body.append(t(654, 1226 + i * 18, 12.5, line, MONO, 400, '#E8E9EE' if i not in (0, 5) else MINT))
    return doc(''.join(defs), ''.join(body))


# ======================================================================
# App 概念：音乐播放页
# ======================================================================

def app_ui():
    defs, body = [], []
    body.append(f'<rect width="{W}" height="{H}" fill="{PAPER}"/>')
    body.append(t(72, 120, 20, 'LIQUID GLASS · APP', MONO, 500, ORANGE, '3'))
    body.append(t(72, 186, 56, '如果液态玻璃来做 App', SC, 900, INK))
    body.append(t(72, 232, 22, '一个播放页：内容铺满整屏，玻璃只做浮在上面的控件。', SC, 400, MUTE))

    # 手机：390×844 按 1.12 缩放
    px, py, pw, ph, pr = 72, 290, 470, 980, 70
    defs.append(f'<clipPath id="phone"><rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="{pr}"/></clipPath>')
    # 背后的内容（专辑封面 + 歌词 + 列表），做成 #abg 供玻璃取样
    fd, fb = field('af', pw, ph, [(0.2, 0.15, ORANGE, 0.75), (0.9, 0.35, PINK, 0.65), (0.15, 0.75, BLUE, 0.8), (0.9, 1.0, MINT, 0.5)])
    defs.append(fd)
    lyrics = ['我们在玻璃后面', '看光一点一点', '弯成你的样子']
    content = [fb, grid(0, 0, pw, ph, 36, '#FFFFFF', 0.14)]
    content.append(t(36, 250, 150, 'BLUE', DISPLAY, 700, INK, '-6'))
    content.append(t(36, 380, 150, 'HOUR', DISPLAY, 700, INK, '-6'))
    for i, l in enumerate(lyrics):
        content.append(t(40, 520 + i * 58, 40 if i == 1 else 32, l, SC, 900 if i == 1 else 700, '#FFFFFF', '0', 'start', f'opacity="{1 if i == 1 else 0.62}"'))
    for i in range(6):
        y = 790 + i * 40
        content.append(f'<rect x="40" y="{y}" width="{120 + (i * 53) % 220}" height="10" rx="5" fill="#FFFFFF" opacity="0.5"/>')
    defs.append(f'<g id="abg">{"".join(content)}</g>')
    body.append(f'<g clip-path="url(#phone)"><g transform="translate({px} {py})"><use href="#abg"/>')

    glass = []
    # 状态栏下的返回 + 更多（圆形小玻璃）
    glass.append(('A1', sdf_circle(56, 92, 28), (28, 64, 56, 56), 16, 0.06, '‹'))
    glass.append(('A2', sdf_circle(pw - 56, 92, 28), (pw - 84, 64, 56, 56), 16, 0.06, '···'))
    # 播放器浮层（厚）
    glass.append(('A3', sdf_round_rect(20, 660, pw - 40, 180, 44), (20, 660, pw - 40, 180), 40, 0.05, None))
    # 底部标签栏 + 搜索：两块玻璃靠得近，融在一起
    tab = smooth_union(34, sdf_round_rect(20, 870, 330, 84, 42), sdf_circle(pw - 62, 912, 42))
    glass.append(('A4', tab, (20, 870, pw - 40, 84), 26, 0.04, None))
    for gid, f, bb, bev, mag, lbl in glass:
        Lg = lens(f, bb, bevel=bev, edge=0.9, mag=mag, pad=26, tint=(255, 255, 255, 0.16 if gid in ('A3', 'A4') else 0.06))
        d, b = svg_lens(gid, Lg, '#abg', blur=7 if gid in ('A3', 'A4') else 0)  # 常规玻璃带一点磨砂，字才压得住
        defs.append(d)
        body.append(b)
        if lbl:
            cx, cy = bb[0] + bb[2] / 2, bb[1] + bb[3] / 2
            body.append(t(cx, cy + 10, 30, lbl, TEXT, 700, INK, '0', 'middle'))
    # 播放器里的字与控件
    body.append(t(52, 712, 24, 'Blue Hour', DISPLAY, 700, INK) + t(52, 742, 18, 'Glass Choir · 3:42', TEXT, 500, INK, '0', 'start', 'opacity="0.7"'))
    body.append(f'<rect x="52" y="768" width="{pw - 104}" height="6" rx="3" fill="{INK}" opacity="0.18"/>')
    body.append(f'<rect x="52" y="768" width="{(pw - 104) * 0.42:.0f}" height="6" rx="3" fill="{INK}"/>')
    for k, sym in enumerate(['⏮', '⏸', '⏭']):
        cx = pw / 2 + (k - 1) * 110
        body.append(t(cx, 820, 34 if k == 1 else 26, sym, TEXT, 700, INK, '0', 'middle'))
    for k, lbl in enumerate(['首页', '新发现', '资料库']):
        body.append(t(60 + k * 108 + 30, 920, 19, lbl, SC, 700 if k == 0 else 500, INK, '0', 'middle', f'opacity="{1 if k == 0 else 0.6}"'))
    body.append(f'<circle cx="{pw - 66}" cy="906" r="11" fill="none" stroke="{INK}" stroke-width="3"/><line x1="{pw - 58}" y1="914" x2="{pw - 50}" y2="922" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>')
    body.append('</g></g>')
    body.append(f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="{pr}" fill="none" stroke="{INK}" stroke-width="10"/>')

    # 标注
    notes = [
        (py + 92, '圆形小按钮 = 薄玻璃', 'bevel 16，后面的字只在边上弯一下。'),
        (py + 380, '内容铺满，玻璃浮在上面', '封面、歌词从玻璃底下滚过去——\n这才是玻璃存在的理由。'),
        (py + 740, '浮层 = 厚玻璃 + 磨砂 7px', '字直接压在玻璃上：后面亮，\n所以用黑字（对比 ≥ 4.5:1）。'),
        (py + 912, '两块靠近就融成一块', '标签栏和搜索相距 < 24px，\nsmooth-min k = 34，中间长出“颈”。'),
    ]
    for i, (y, a, b2) in enumerate(notes):
        body.append(f'<line x1="{px + pw - 30}" y1="{y}" x2="{610}" y2="{y}" stroke="{INK}" stroke-width="1.4"/>')
        body.append(f'<circle cx="{px + pw - 30}" cy="{y}" r="5" fill="{ORANGE}"/>')
        body.append(f'<circle cx="630" cy="{y}" r="18" fill="{INK}"/>' + t(630, y + 6, 17, str(i + 1), MONO, 500, '#FFF', '0', 'middle'))
        body.append(t(662, y + 7, 22, a, SC, 700, INK))
        for k, line in enumerate(b2.split('\n')):
            body.append(t(662, y + 38 + k * 26, 17, line, SC, 400, MUTE))
    body.append(t(662, 820, 18, 'TOKENS', MONO, 500, ORANGE, '3'))
    for i, line in enumerate(['--bevel: 16 / 26 / 40px', '--frost: 0 / 7px', '--chroma: 6%', '--tint: rgb(255 255 255 / .06)', '--merge-gap: 24px']):
        body.append(t(662, 850 + i * 24, 16, line, MONO, 400, INK))
    body.append(t(72, 1310, 16, f'Design Style 风格 {NO} · @guanmo_ai', TEXT, 400, MUTE))
    return doc(''.join(defs), ''.join(body))


if __name__ == '__main__':
    for name, fn in [('poster', poster), ('cheatsheet', cheatsheet), ('app-ui', app_ui)]:
        path = os.path.join(HERE, f'{name}.svg')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(fn())
        print('wrote', os.path.relpath(path), f'{os.path.getsize(path) / 1024:.0f} KB')
