"""
风格 009 候选 A · 装饰艺术 Art Deco —— 风格图（1080×1350）

  poster.svg      一张海报：中轴上的摩天楼 + 拱窗里的放射光 + 三线框
  cheatsheet.svg  速查卡：五种颜色、三种字、五个母题、五条规则
  app-ui.svg      如果装饰艺术来做 app：一家爵士酒吧的订座页，带标注

金色是“材质”不是“颜色”：统一用一条斜向的多段渐变（userSpaceOnUse），线再细也有金属的明暗。
用法：python3 styles/009-art-deco/images/make_svgs.py
"""
import math
import os
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1350
CX = W / 2

ONYX = '#0E0D0B'
ONYX2 = '#1A1711'
GOLD = '#C9A45A'
GOLD_LT = '#F2DC9C'
GOLD_DK = '#7E5E26'
IVORY = '#F1E7D2'
EMERALD = '#0E4A3C'
LACQUER = '#9E2B25'

DISPLAY = "'Poiret One', 'Jost', sans-serif"
GEO = "'Jost', 'Futura', 'Noto Sans SC', sans-serif"
SERIF_SC = "'Noto Serif SC', 'Songti SC', serif"
SC = "'Noto Sans SC', 'PingFang SC', sans-serif"


def t(x, y, size, text, family=GEO, weight=400, fill=IVORY, ls='0', anchor='start', extra=''):
    return (
        f'<text x="{x:.1f}" y="{y:.1f}" font-family="{family}" font-weight="{weight}" '
        f'font-size="{size}" fill="{fill}" letter-spacing="{ls}" text-anchor="{anchor}" {extra}>'
        f'{escape(text)}</text>'
    )


def gold_defs(gid='gold', x2=W, y2=H):
    # 斜向多段：亮—暗—亮—暗，细线上也看得出“金属反光”
    stops = [(0, GOLD_LT), (0.18, GOLD), (0.32, GOLD_DK), (0.47, GOLD_LT), (0.62, GOLD), (0.78, GOLD_DK), (1, GOLD_LT)]
    s = ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in stops)
    return f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="{x2}" y2="{y2}">{s}</linearGradient>'


def head(extra_defs=''):
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img">\n'
        f'  <defs>\n    {gold_defs()}\n    {extra_defs}\n  </defs>\n'
    )


FOOT = '</svg>\n'
G = 'url(#gold)'


def triple_rect(x, y, w, h, step=14, col=G, widths=(2.2, 0.9, 0.9), gap=6):
    """三线框：一粗两细平行；四角用阶梯切角（不用圆角）"""
    out = []
    for i, sw in enumerate(widths):
        d = i * gap
        out.append(f'<path d="{stepped_rect_path(x + d, y + d, w - 2 * d, h - 2 * d, step)}" fill="none" stroke="{col}" stroke-width="{sw}"/>')
    return ''.join(out)


def stepped_rect_path(x, y, w, h, s):
    """两级阶梯切角的矩形"""
    pts = [
        (x + 2 * s, y), (x + w - 2 * s, y), (x + w - 2 * s, y + s), (x + w - s, y + s), (x + w - s, y + 2 * s), (x + w, y + 2 * s),
        (x + w, y + h - 2 * s), (x + w - s, y + h - 2 * s), (x + w - s, y + h - s), (x + w - 2 * s, y + h - s), (x + w - 2 * s, y + h),
        (x + 2 * s, y + h), (x + 2 * s, y + h - s), (x + s, y + h - s), (x + s, y + h - 2 * s), (x, y + h - 2 * s),
        (x, y + 2 * s), (x + s, y + 2 * s), (x + s, y + s), (x + 2 * s, y + s),
    ]
    return 'M' + ' L'.join(f'{px:.1f} {py:.1f}' for px, py in pts) + ' Z'


def diamond(x, y, r, fill=G):
    return f'<path d="M{x} {y - r} L{x + r} {y} L{x} {y + r} L{x - r} {y} Z" fill="{fill}"/>'


def rule_with_diamond(x1, x2, y, col=G):
    m = (x1 + x2) / 2
    return (
        f'<path d="M{x1} {y} H{m - 14} M{m + 14} {y} H{x2}" stroke="{col}" stroke-width="1.2"/>'
        + diamond(m, y, 6, col)
    )


# ───────────────────────────── 海报 ─────────────────────────────

def mix(a, b, k):
    """把 a 以不透明度 k 叠到 b 上，直接算出实色（低透明度的大面积叠加在 Chromium 里会出现分块色差）"""
    pa = [int(a[i:i + 2], 16) for i in (1, 3, 5)]
    pb = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{round(pb[i] + (pa[i] - pb[i]) * k):02X}' for i in range(3))


def sunburst(ox, oy, r, n, a0=180, a1=360, bg='#120F0A'):
    """放射：交替的楔形 + 细线；光源藏在主体后面"""
    wedge, ray = mix(GOLD, bg, 0.09), mix(GOLD, bg, 0.5)
    out = []
    for i in range(n):
        a = math.radians(a0 + (a1 - a0) * i / n)
        b = math.radians(a0 + (a1 - a0) * (i + 1) / n)
        x1, y1 = ox + r * math.cos(a), oy + r * math.sin(a)
        x2, y2 = ox + r * math.cos(b), oy + r * math.sin(b)
        if i % 2 == 0:
            out.append(f'<path d="M{ox} {oy} L{x1:.1f} {y1:.1f} L{x2:.1f} {y2:.1f} Z" fill="{wedge}"/>')
        out.append(f'<path d="M{ox} {oy} L{x1:.1f} {y1:.1f}" stroke="{ray}" stroke-width="1"/>')
    return ''.join(out)


def arch_path(cx, base, hw, top_extra=0):
    return f'M{cx - hw} {base} V{base - top_extra} A{hw} {hw} 0 0 1 {cx + hw} {base - top_extra} V{base} Z'


def tower(base=1180):
    """中轴上的摩天楼：两级翼楼 → 主楼 → 两级收分 → 五层拱冠（克莱斯勒式三角窗）→ 尖顶"""
    o = []
    fill = 'url(#shaft)'
    # 翼楼（外 → 内），左右镜像
    for hw, top in ((240, 1010), (180, 900)):
        o.append(f'<rect x="{CX - hw}" y="{top}" width="{2 * hw}" height="{base - top}" fill="{fill}" stroke="{G}" stroke-width="1.6"/>')
        # 翼楼竖向肋：三根一组
        for side in (-1, 1):
            for k in range(3):
                x = CX + side * (hw - 18 - k * 7)
                o.append(f'<path d="M{x} {top + 14} V{base}" stroke="{G}" stroke-width="0.8" opacity="0.7"/>')
    # 主楼
    o.append(f'<rect x="{CX - 110}" y="760" width="220" height="{base - 760}" fill="{fill}" stroke="{G}" stroke-width="2"/>')
    for k in range(-4, 5):
        x = CX + k * 22
        sw = 1.6 if k == 0 else 0.8
        o.append(f'<path d="M{x} 776 V{base}" stroke="{G}" stroke-width="{sw}" opacity="{0.95 if k == 0 else 0.55}"/>')
    # 主楼上的人字纹（chevron）腰带
    for row, y in enumerate((800, 812, 824)):
        pts = ' '.join(f'{CX - 110 + i * 22},{y + (10 if i % 2 else 0)}' for i in range(11))
        o.append(f'<polyline points="{pts}" fill="none" stroke="{G}" stroke-width="{1.4 if row == 0 else 0.8}"/>')
    # 收分
    for hw, top, h in ((85, 712, 48), (64, 672, 40)):
        o.append(f'<rect x="{CX - hw}" y="{top}" width="{2 * hw}" height="{h}" fill="{fill}" stroke="{G}" stroke-width="1.6"/>')
        o.append(f'<path d="M{CX - hw + 8} {top + 8} H{CX + hw - 8}" stroke="{G}" stroke-width="0.8"/>')
    # 拱冠：从最小（最远）画到最大（最近）
    crowns = [(50 - i * 9, 672 - i * 30) for i in range(5)]
    for hw, b in reversed(crowns):
        o.append(f'<path d="{arch_path(CX, b, hw, 12)}" fill="{fill}" stroke="{G}" stroke-width="1.8"/>')
        o.append(f'<path d="M{CX - hw + 7} {b - 12} A{hw - 7} {hw - 7} 0 0 1 {CX + hw - 7} {b - 12}" fill="none" stroke="{G}" stroke-width="0.8"/>')
        # 三角窗：沿拱放射
        n = 5
        for k in range(n):
            a = math.radians(180 + 180 * (k + 0.5) / n)
            r0, r1 = hw - 22, hw - 10
            if r0 <= 4:
                continue
            ax, ay = CX + r1 * math.cos(a), b - 12 + r1 * math.sin(a)
            da = math.radians(10)
            bx1, by1 = CX + r0 * math.cos(a - da), b - 12 + r0 * math.sin(a - da)
            bx2, by2 = CX + r0 * math.cos(a + da), b - 12 + r0 * math.sin(a + da)
            o.append(f'<path d="M{ax:.1f} {ay:.1f} L{bx1:.1f} {by1:.1f} L{bx2:.1f} {by2:.1f} Z" fill="{GOLD_LT}" opacity="0.9"/>')
    # 尖顶
    top_arch = crowns[-1][1] - crowns[-1][0] - 12
    o.append(f'<path d="M{CX - 5} {top_arch + 4} L{CX} {top_arch - 170} L{CX + 5} {top_arch + 4} Z" fill="{G}"/>')
    # 台基：三级阶梯
    for i, (hw, h) in enumerate(((290, 12), (320, 12), (350, 12))):
        y = base + i * h
        o.append(f'<rect x="{CX - hw}" y="{y}" width="{2 * hw}" height="{h}" fill="{ONYX}" stroke="{G}" stroke-width="1.2"/>')
    return ''.join(o)


def corner_ornament(x, y, sx, sy):
    """角花：三级阶梯 + 一颗菱形"""
    d = f'M{x} {y + sy * 64} V{y} H{x + sx * 64} M{x + sx * 12} {y + sy * 40} V{y + sy * 12} H{x + sx * 40} M{x + sx * 24} {y + sy * 24} h{sx * 6}'
    return f'<path d="{d}" fill="none" stroke="{G}" stroke-width="1.6"/>' + diamond(x + sx * 26, y + sy * 26, 5)


BASE = 1150


def poster():
    defs = (
        f'<radialGradient id="glow" cx="540" cy="1000" r="700" gradientUnits="userSpaceOnUse">'
        f'<stop offset="0" stop-color="#2A2214"/><stop offset="1" stop-color="{ONYX}"/></radialGradient>'
        f'<linearGradient id="shaft" x1="0" y1="0" x2="1" y2="0">'
        f'<stop offset="0" stop-color="#0B0A08"/><stop offset="0.5" stop-color="#211C13"/><stop offset="1" stop-color="#0B0A08"/></linearGradient>'
        f'<clipPath id="archclip"><path d="{arch_path(CX, BASE, 430, 330)}"/></clipPath>'
    )
    s = [head(defs), f'<rect width="{W}" height="{H}" fill="{ONYX}"/>']
    s.append(f'<rect width="{W}" height="{H}" fill="url(#glow)"/>')
    # 外框：三线 + 阶梯角
    s.append(triple_rect(36, 36, W - 72, H - 72, step=16))
    for x, y, sx, sy in ((64, 64, 1, 1), (W - 64, 64, -1, 1), (64, H - 64, 1, -1), (W - 64, H - 64, -1, -1)):
        s.append(corner_ornament(x, y, sx, sy))
    # 顶部小字
    s.append(t(CX, 128, 17, 'DESIGN STYLE  ·  NO. 009', GEO, 500, GOLD, '0.42em', 'middle'))
    # 标题
    s.append(t(CX, 252, 128, 'ART DECO', DISPLAY, 400, G, '0.10em', 'middle'))
    s.append(rule_with_diamond(250, 830, 290))
    s.append(t(CX + 14, 350, 40, '装饰艺术', SERIF_SC, 300, IVORY, '0.7em', 'middle'))
    # 拱窗：放射光
    s.append(f'<path d="{arch_path(CX, BASE, 430, 330)}" fill="#120F0A"/>')
    s.append(f'<g clip-path="url(#archclip)">{sunburst(CX, BASE, 900, 40)}</g>')
    # 拱窗三线
    for i, sw in enumerate((2.4, 1, 1)):
        hw = 430 + 10 + i * 7
        s.append(f'<path d="M{CX - hw} {BASE} V{BASE - 330} A{hw} {hw} 0 0 1 {CX + hw} {BASE - 330} V{BASE}" fill="none" stroke="{G}" stroke-width="{sw}"/>')
    # 扇形同心弧（像日出的光环）
    for r, op in ((150, 0.7), (230, 0.5), (310, 0.35)):
        s.append(f'<path d="M{CX - r} {BASE} A{r} {r} 0 0 1 {CX + r} {BASE}" fill="none" stroke="{G}" stroke-width="1" opacity="{op}"/>')
    s.append(tower(BASE))
    # 底部
    s.append(t(CX, 1236, 24, '1925  —  1939', GEO, 500, IVORY, '0.32em', 'middle'))
    s.append(t(CX, 1268, 14, 'PARIS  ·  NEW YORK  ·  SHANGHAI', GEO, 500, GOLD, '0.48em', 'middle'))
    s.append(t(150, 1236, 15, '巴黎 · 纽约 · 上海', SC, 400, GOLD, '0.18em'))
    s.append(t(150, 1264, 15, '中轴 · 阶梯 · 放射', SC, 400, IVORY, '0.18em', extra='opacity="0.7"'))
    s.append(t(W - 150, 1236, 15, 'Design Style 风格 009', SC, 400, GOLD, '0.06em', 'end'))
    s.append(t(W - 150, 1264, 15, '@guanmo_ai', GEO, 400, IVORY, '0.12em', 'end', 'opacity="0.7"'))
    s.append(FOOT)
    return ''.join(s)


# ───────────────────────────── 速查 ─────────────────────────────

def motif(kind, x, y, sz=150):
    """母题小样：黑底金线，150×150"""
    o = [f'<clipPath id="mc-{kind}"><rect x="{x}" y="{y}" width="{sz}" height="{sz}"/></clipPath>',
         f'<rect x="{x}" y="{y}" width="{sz}" height="{sz}" fill="{ONYX}"/><g clip-path="url(#mc-{kind})">']
    cx, cy = x + sz / 2, y + sz / 2
    if kind == 'sunburst':
        o.append(sunburst(cx, y + sz - 14, 160, 22, bg=ONYX))
        o.append(f'<path d="M{cx - 30} {y + sz - 14} A30 30 0 0 1 {cx + 30} {y + sz - 14} Z" fill="{G}"/>')
    elif kind == 'ziggurat':
        for i in range(5):
            hw = 62 - i * 12
            yy = y + sz - 20 - i * 20
            o.append(f'<rect x="{cx - hw}" y="{yy}" width="{2 * hw}" height="20" fill="none" stroke="{G}" stroke-width="1.6"/>')
    elif kind == 'chevron':
        for i in range(6):
            yy = y + 30 + i * 16
            o.append(f'<path d="M{x + 20} {yy + 18} L{cx} {yy} L{x + sz - 20} {yy + 18}" fill="none" stroke="{G}" stroke-width="{2.2 if i % 3 == 0 else 1}"/>')
    elif kind == 'fan':
        bx, by = cx, y + sz - 40
        for i in range(7):
            a0 = math.radians(180 + i * 180 / 7)
            a1 = math.radians(180 + (i + 1) * 180 / 7)
            r = 66
            x1, y1 = bx + r * math.cos(a0), by + r * math.sin(a0)
            x2, y2 = bx + r * math.cos(a1), by + r * math.sin(a1)
            o.append(f'<path d="M{bx} {by} L{x1:.1f} {y1:.1f} A{r} {r} 0 0 1 {x2:.1f} {y2:.1f} Z" fill="none" stroke="{G}" stroke-width="1.2"/>')
            r2 = 42
            x1, y1 = bx + r2 * math.cos(a0), by + r2 * math.sin(a0)
            x2, y2 = bx + r2 * math.cos(a1), by + r2 * math.sin(a1)
            o.append(f'<path d="M{x1:.1f} {y1:.1f} A{r2} {r2} 0 0 1 {x2:.1f} {y2:.1f}" fill="none" stroke="{G}" stroke-width="0.8"/>')
    elif kind == 'triple':
        for i, sw in enumerate((3, 1.1, 1.1)):
            d = 24 + i * 9
            o.append(f'<path d="M{x + d} {y + sz - 18} V{y + d + 18} H{x + sz - d} V{y + sz - 18}" fill="none" stroke="{G}" stroke-width="{sw}"/>')
    o.append('</g>')
    return ''.join(o)


def swatch(x, y, w, h, fill, step=14, stroke=None):
    """色卡用阶梯顶"""
    pts = [(x, y + h), (x, y + 2 * step), (x + step, y + 2 * step), (x + step, y + step), (x + 2 * step, y + step), (x + 2 * step, y),
           (x + w - 2 * step, y), (x + w - 2 * step, y + step), (x + w - step, y + step), (x + w - step, y + 2 * step), (x + w, y + 2 * step), (x + w, y + h)]
    d = 'M' + ' L'.join(f'{a} {b}' for a, b in pts) + ' Z'
    st = f' stroke="{stroke}" stroke-width="1.2"' if stroke else ''
    return f'<path d="{d}" fill="{fill}"{st}/>'


def cheatsheet():
    ink = ONYX
    s = [head(), f'<rect width="{W}" height="{H}" fill="{IVORY}"/>']
    s.append(triple_rect(36, 36, W - 72, H - 72, step=14, col=G))
    L = 96
    s.append(t(L, 168, 76, 'ART DECO', DISPLAY, 400, ink, '0.06em'))
    s.append(t(L, 214, 24, '速查 · 五种颜色、三种字、五个母题、五条规则', SC, 500, ink, '0.04em'))
    s.append(t(W - L, 168, 15, 'NO. 009 · 1925—1939', GEO, 500, GOLD_DK, '0.3em', 'end'))
    # 颜色
    s.append(t(L, 278, 15, '01  颜色 · 比例 60 / 25 / 10 / 5', GEO, 600, GOLD_DK, '0.18em'))
    sw = [
        (ONYX, '黑曜', '#0E0D0B', '底 60%', IVORY),
        (G, '鎏金', '#C9A45A', '线与大字 10%', ONYX),
        (IVORY, '象牙', '#F1E7D2', '字 / 纸 25%', ONYX),
        (EMERALD, '孔雀绿', '#0E4A3C', '第二底色', IVORY),
        (LACQUER, '漆红', '#9E2B25', '点缀 5%', IVORY),
    ]
    x0, wv, gap = L, 160, 18
    for i, (c, name, hx, use, tc) in enumerate(sw):
        x = x0 + i * (wv + gap)
        s.append(swatch(x, 298, wv, 150, c, stroke=GOLD if c == IVORY else None))
        s.append(t(x + 14, 420, 22, name, SC, 700, tc))
        s.append(t(x + 14, 440, 13, hx, GEO, 500, tc, '0.08em', extra='opacity="0.8"'))
        s.append(t(x, 476, 14, use, SC, 400, ink))
    # 字
    s.append(t(L, 532, 15, '02  字 · 细线几何大写，字距放到 +10% 以上', GEO, 600, GOLD_DK, '0.18em'))
    specimens = [
        ('Aa Gg', DISPLAY, 400, 'Poiret One', '标题 · 细线几何'),
        ('Futura', GEO, 500, 'Jost（Futura 1927）', '标签 · 几何无衬线'),
        ('装饰', SERIF_SC, 300, 'Noto Serif SC 300', '中文 · 细宋，宽字距'),
    ]
    for i, (sample, fam, wt, name, use) in enumerate(specimens):
        x = L + i * 300
        s.append(t(x, 624, 70, sample, fam, wt, ink, '0.04em'))
        s.append(f'<path d="M{x} 646 H{x + 260}" stroke="{G}" stroke-width="1"/>')
        s.append(t(x, 672, 15, name, GEO, 600, ink, '0.04em'))
        s.append(t(x, 696, 14, use, SC, 400, ink, extra='opacity="0.7"'))
    # 母题
    s.append(t(L, 740, 15, '03  五个母题 · 全部从中轴长出来', GEO, 600, GOLD_DK, '0.18em'))
    motifs = [('sunburst', '放射', 'Sunburst'), ('ziggurat', '阶梯', 'Ziggurat'), ('chevron', '人字', 'Chevron'),
              ('fan', '扇形', 'Fan'), ('triple', '三线', 'Triple line')]
    for i, (k, zh, en) in enumerate(motifs):
        x = L + i * (wv + gap)
        s.append(motif(k, x, 760, 160))
        s.append(t(x, 948, 20, zh, SC, 700, ink))
        s.append(t(x + 48, 948, 13, en.upper(), GEO, 500, GOLD_DK, '0.14em'))
    # 规则
    s.append(t(L, 998, 15, '04  五条规则', GEO, 600, GOLD_DK, '0.18em'))
    rules = [
        ('中轴对称', '先画一条中轴，版面、图标、按钮都左右镜像。', '对称不是“居中排一列字”'),
        ('阶梯收分', '转角用阶梯切角，体块越往上越窄。', '别用圆角，圆角会把它变成 App 默认样式'),
        ('放射光芒', '光源藏在主体后面，放射线从中轴发出。', '射线要细、要稀，满屏太阳纹就俗了'),
        ('一线变三线', '一粗两细平行，间距 ≈ 粗线宽 × 3。', '三条线一样粗就成了条纹'),
        ('金只给线', '金色是材质：只给细线和大标题，大面积用黑或绿托住。', '金色正文读不清；金底是土豪不是 Deco'),
    ]
    for i, (title, how, care) in enumerate(rules):
        y = 1040 + i * 50
        s.append(t(L, y, 18, f'0{i + 1}', GEO, 600, GOLD_DK, '0.06em'))
        s.append(t(L + 44, y, 19, title, SC, 700, ink))
        s.append(t(L + 170, y, 16, how, SC, 400, ink))
        s.append(t(L + 170, y + 22, 13, '小心：' + care, SC, 400, LACQUER))
    s.append(FOOT)
    return ''.join(s)


# ───────────────────────────── App ─────────────────────────────

def phone(x, y, w, h, inner):
    return (
        f'<rect x="{x - 12}" y="{y - 12}" width="{w + 24}" height="{h + 24}" rx="58" fill="#050504" stroke="{G}" stroke-width="1.2"/>'
        f'<clipPath id="screen"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="46"/></clipPath>'
        f'<g clip-path="url(#screen)">{inner}</g>'
    )


def callout(n, x, y, tx, ty, title, body, anchor='start'):
    """标注：从点 (x,y) 拉到文字 (tx,ty)"""
    o = [
        f'<path d="M{x} {y} H{tx - (16 if anchor == "start" else -16)}" stroke="{G}" stroke-width="1"/>',
        f'<circle cx="{x}" cy="{y}" r="4" fill="{G}"/>',
        f'<circle cx="{tx}" cy="{y}" r="13" fill="none" stroke="{G}" stroke-width="1.2"/>',
        t(tx, y + 5, 13, str(n), GEO, 600, GOLD_LT, '0', 'middle'),
    ]
    dx = 24 if anchor == 'start' else -24
    o.append(t(tx + dx, ty, 18, title, SC, 700, IVORY, '0.04em', anchor))
    for i, line in enumerate(body):
        o.append(t(tx + dx, ty + 24 + i * 21, 14, line, SC, 400, IVORY, '0', anchor, 'opacity="0.72"'))
    return ''.join(o)


def app_ui():
    defs = (
        f'<linearGradient id="bgE" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0F4A3C"/><stop offset="1" stop-color="#062820"/></linearGradient>'
        f'<linearGradient id="shaft" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0B0A08"/><stop offset="0.5" stop-color="#211C13"/><stop offset="1" stop-color="#0B0A08"/></linearGradient>'
        f'<clipPath id="hdr"><path d="{arch_path(306, 400, 150, 160)}"/></clipPath>'
    )
    s = [head(defs), f'<rect width="{W}" height="{H}" fill="url(#bgE)"/>']
    # 背景：极淡的人字纹
    for i in range(0, 46):
        y = i * 30
        pts = ' '.join(f'{k * 60},{y + (16 if k % 2 else 0)}' for k in range(20))
        s.append(f'<polyline points="{pts}" fill="none" stroke="{GOLD}" stroke-width="0.6" opacity="0.07"/>')
    s.append(triple_rect(36, 36, W - 72, H - 72, step=14))
    s.append(t(96, 140, 15, 'ART DECO · APP', GEO, 600, GOLD, '0.36em'))
    s.append(t(96, 194, 44, '如果装饰艺术来做 App', SC, 700, IVORY, '0.02em'))
    s.append(t(96, 232, 17, '一家外滩爵士酒吧的订座页：同一套中轴、阶梯、放射、三线。', SC, 400, IVORY, extra='opacity="0.7"'))

    # 手机屏幕（412×868），屏幕坐标：x 100..512
    px, py, pw, ph = 100, 300, 412, 900
    cx = px + pw / 2
    sc = []
    sc.append(f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" fill="{ONYX}"/>')
    # 状态栏
    sc.append(t(px + 34, py + 40, 15, '21:29', GEO, 600, IVORY))
    sc.append(t(px + pw - 34, py + 40, 13, '●●● ▮', GEO, 600, IVORY, '0', 'end'))
    # 头图：拱窗 + 放射
    ab = py + 330
    sc.append(f'<path d="{arch_path(cx, ab, 150, 120)}" fill="#151109"/>')
    sc.append(f'<clipPath id="hdr2"><path d="{arch_path(cx, ab, 150, 120)}"/></clipPath>')
    sc.append(f'<g clip-path="url(#hdr2)">{sunburst(cx, ab, 400, 28, bg='#151109')}'
              f'<path d="M{cx - 60} {ab} A60 60 0 0 1 {cx + 60} {ab} Z" fill="{G}"/></g>')
    for i, sw in enumerate((2, 0.8, 0.8)):
        hw = 156 + i * 6
        sc.append(f'<path d="M{cx - hw} {ab} V{ab - 120} A{hw} {hw} 0 0 1 {cx + hw} {ab - 120} V{ab}" fill="none" stroke="{G}" stroke-width="{sw}"/>')
    # 萨克斯小剪影的替代：一颗星 + 年份
    sc.append(t(cx, py + 118, 13, '★  EST. 1929  ★', GEO, 600, GOLD, '0.3em', 'middle'))
    sc.append(t(cx, ab + 52, 34, 'THE GOLDEN HOUR', DISPLAY, 400, G, '0.06em', 'middle'))
    sc.append(t(cx, ab + 84, 15, '外 滩 · 爵 士 之 夜', SERIF_SC, 400, IVORY, '0.3em', 'middle'))
    sc.append(rule_with_diamond(px + 60, px + pw - 60, ab + 108))
    # 日期：阶梯切角的格子
    days = [('THU', '06'), ('FRI', '07'), ('SAT', '08'), ('SUN', '09')]
    dw, dg = 78, 14
    dx0 = cx - (4 * dw + 3 * dg) / 2
    for i, (d, n) in enumerate(days):
        x = dx0 + i * (dw + dg)
        on = i == 1
        sc.append(f'<path d="{stepped_rect_path(x, ab + 132, dw, 88, 6)}" fill="{G if on else "none"}" stroke="{G}" stroke-width="1.2"/>')
        sc.append(t(x + dw / 2, ab + 160, 12, d, GEO, 600, ONYX if on else GOLD, '0.24em', 'middle'))
        sc.append(t(x + dw / 2, ab + 200, 30, n, GEO, 400, ONYX if on else IVORY, '0.02em', 'middle'))
    # 卡片：三线框
    cy0 = ab + 248
    sc.append(triple_rect(px + 26, cy0, pw - 52, 150, step=8, widths=(1.8, 0.8, 0.8), gap=5))
    sc.append(t(px + 52, cy0 + 46, 13, 'LE QUARTET · 四重奏', GEO, 600, GOLD, '0.18em'))
    sc.append(t(px + 52, cy0 + 82, 24, '吧台 12A · 两位', SC, 500, IVORY))
    sc.append(t(px + 52, cy0 + 112, 14, '21:30 入场 · 着正装', SC, 400, IVORY, extra='opacity="0.65"'))
    sc.append(t(px + pw - 52, cy0 + 84, 30, '¥388', GEO, 400, G, '0.02em', 'end'))
    # 按钮：金底黑字 + 人字箭头
    by = cy0 + 180
    sc.append(f'<path d="{stepped_rect_path(px + 26, by, pw - 52, 66, 8)}" fill="{G}"/>')
    sc.append(t(cx, by + 42, 19, '预 订 · RESERVE', SC, 700, ONYX, '0.12em', 'middle'))
    sc.append(f'<path d="M{px + 58} {by + 26} l8 7 l-8 7 M{px + 70} {by + 26} l8 7 l-8 7" fill="none" stroke="{ONYX}" stroke-width="1.6"/>')
    sc.append(f'<path d="M{px + pw - 58} {by + 26} l-8 7 l8 7 M{px + pw - 70} {by + 26} l-8 7 l8 7" fill="none" stroke="{ONYX}" stroke-width="1.6"/>')
    # 标签栏
    ty = py + ph - 74
    sc.append(f'<path d="M{px} {ty} H{px + pw}" stroke="{G}" stroke-width="0.8"/>')
    icons = [('M-10 8 V-2 L0 -10 L10 -2 V8 Z', True), ('M-10 -6 H10 M-10 0 H10 M-10 6 H10', False),
             ('M0 -10 L10 0 L0 10 L-10 0 Z', False), ('M-8 10 V2 A8 8 0 0 1 8 2 V10 M0 -3 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0', False)]
    for i, (d, on) in enumerate(icons):
        x = px + pw * (i + 0.5) / 4
        sc.append(f'<path d="{d}" transform="translate({x} {ty + 34})" fill="none" stroke="{G if on else IVORY}" stroke-width="1.6" opacity="{1 if on else 0.55}"/>')
    s.append(phone(px, py, pw, ph, ''.join(sc)))

    # 标注
    TX = 590
    s.append(callout(1, cx + 160, py + 250, TX, py + 210, '拱窗 = 中轴 + 放射', ['头图不用照片：一扇拱窗，', '光源藏在中轴下面。']))
    s.append(callout(2, cx + 168, ab + 40, TX, ab + 4, '细线大写 + 宽字距', ['Poiret One 标题，字距 +6%；', '中文细宋，字距 +30%。']))
    s.append(callout(3, px + pw - 26, ab + 176, TX, ab + 140, '阶梯切角，不用圆角', ['日期、按钮、卡片同一个切角：', '6px × 2 级。']))
    s.append(callout(4, px + pw - 26, cy0 + 60, TX, cy0 + 30, '一线变三线', ['卡片描边 1.8 / 0.8 / 0.8，', '间距 5px。']))
    s.append(callout(5, px + pw - 26, by + 33, TX, by + 2, '金只给按钮和线', ['整屏只有一个金色实心块，', '它就是要你按的那个。']))
    # 右下 tokens
    ky = 1160
    s.append(t(TX, ky, 13, 'TOKENS', GEO, 600, GOLD, '0.36em'))
    toks = ['--gold: #C9A45A', '--onyx: #0E0D0B', '--step: 6px × 2', '--line: 1.8 / 0.8 / 0.8', '--track: 0.06em']
    for i, tok in enumerate(toks):
        s.append(t(TX, ky + 30 + i * 22, 15, tok, "'JetBrains Mono', monospace", 400, IVORY, '0', extra='opacity="0.8"'))
    s.append(t(96, 1278, 13, 'Design Style 风格 009 · @guanmo_ai', SC, 400, GOLD, '0.06em'))
    s.append(FOOT)
    return ''.join(s)


def main():
    for name, fn in (('poster', poster), ('cheatsheet', cheatsheet), ('app-ui', app_ui)):
        path = os.path.join(HERE, f'{name}.svg')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(fn())
        print('wrote', os.path.relpath(path))


if __name__ == '__main__':
    main()
