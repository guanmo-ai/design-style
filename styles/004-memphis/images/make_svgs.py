"""
风格 004 · 孟菲斯 Memphis —— 四张风格图（1080×1350）的生成脚本

四张图共用一套“积木”：每一样东西 = 一块糖果色 + 一圈 4px 黑描边 + 往右下 8px 的黑色硬投影（不模糊）。
要读的字（日期、说明、数据）一律水平、黑色、放在白底或浅底上；歪的、带花纹的只给“玩具”：图形、标签、标题。
边距 90 / 72（左右 / 上下），与 001—003 同一套页眉页脚。字宽按 Fredoka / 思源黑体的真实度量计算。

  poster.svg      一张海报：积木、波浪线、斑马纹一起砸下来，MEMPHIS 七个字母各一种颜色
  cheatsheet.svg  速查卡：积木、色板、纹样、字体、五条规则、这样做 / 别这样
  app-ui.svg      如果孟菲斯来做 app：一个习惯打卡 app 的概念稿
  steps.svg       四步改造：同一张普通海报，每一步只改一件事

生成的 SVG 是普通可读的源文件，可以直接改；改完再跑 scripts/build_images.py 内嵌字体、导出 PNG。
用法：python3 styles/004-memphis/images/make_svgs.py
"""
import math
import os
import random
from xml.sax.saxutils import escape

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
FONTS = os.path.join(ROOT, 'public', 'fonts')
W, H = 1080, 1350
MX, MY = 90, 72
CW = W - 2 * MX  # 900

# 颜色（与 tokens.ts 一致）
PAPER, INK, WHITE = '#FDF6EC', '#111111', '#FFFFFF'
PINK, YELLOW, TEAL, BLUE, RED, LILAC = '#FF7EB6', '#FFD23F', '#22C3B5', '#2D4BFF', '#FF5A36', '#B79CFF'
CANDY = [PINK, YELLOW, TEAL, BLUE, RED, LILAC]
GREY = '#6E675F'
SW_, SH_ = 4, 8  # 描边、硬投影（1080 宽的图）

FAM = "'Fredoka', 'Noto Sans SC', 'Arial Rounded MT Bold', sans-serif"
FAM_SC = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"
FAM_MONO = "'JetBrains Mono', ui-monospace, monospace"
CAP = 0.70  # Fredoka 大写高度（em，约值）
CJK = 0.84  # 思源黑体字面顶部到基线（em，约值）

# ── 字体度量：Fredoka 是可变字体，按字重实例化后再量 ──
_FONTS = {}


def _font(kind, weight):
    key = (kind, weight)
    if key not in _FONTS:
        if kind == 'fre':
            f = instancer.instantiateVariableFont(TTFont(os.path.join(FONTS, 'Fredoka.ttf')), {'wght': weight, 'wdth': 100})
        else:
            name = {400: 'Regular', 500: 'Medium', 700: 'Bold', 900: 'Black'}[weight]
            f = TTFont(os.path.join(FONTS, f'NotoSansSC-{name}.otf'))
        _FONTS[key] = (f.getBestCmap(), f['hmtx'], f['head'].unitsPerEm)
    return _FONTS[key]


def width(s, size, weight=700, ls=0.0, kind='fre'):
    """字符串的步进宽度（不含最后一个字的字距）；Fredoka 没有的字（汉字）按思源黑体量"""
    w = 0
    for ch in s:
        cmap, hm, upm = _font(kind, weight)
        if ord(ch) not in cmap:
            cmap, hm, upm = _font('sc', 900 if weight >= 800 else 700 if weight >= 600 else 500 if weight >= 500 else 400)
        w += hm[cmap[ord(ch)]][0] / upm
    return (w + ls * (len(s) - 1)) * size


def zw(s, size, weight=400):
    return width(s, size, weight, kind='sc')


def T(x, y, s, size, weight=700, fill=INK, ls=0.0, anchor=None, fam=FAM, extra='', rot=None):
    """一行字：x 是左边（或 anchor 指定的位置），y 是基线；ls 是字距（em）；rot 绕 (x, y) 旋转"""
    a = f' text-anchor="{anchor}"' if anchor else ''
    l = f' letter-spacing="{ls * size:.2f}"' if ls else ''
    r = f' transform="rotate({rot} {x:.1f} {y:.1f})"' if rot else ''
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{fam}" font-weight="{weight}" font-size="{size}"'
            f'{l}{a}{r} fill="{fill}"{extra}>{escape(s)}</text>')


def ZH(x, y, s, size, weight=900, fill=INK, ls=0.0, anchor=None, rot=None, extra=''):
    return T(x, y, s, size, weight, fill, ls, anchor, FAM_SC, extra, rot)


def MONO(x, y, s, size, weight=500, fill=GREY, ls=0.0, anchor=None, extra=''):
    return T(x, y, s, size, weight, fill, ls, anchor, FAM_MONO, extra)


def OUT(x, y, s, size, weight=700, fill=WHITE, sw=6, sh=6, fam=FAM, anchor=None, ls=0.0):
    """描黑边 + 硬投影的大字（标题、标签）"""
    e = f' stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round" paint-order="stroke"'
    return [g([T(x, y, s, size, weight, INK, ls, anchor, fam, f' stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round"')], f'translate({sh} {sh})'),
            T(x, y, s, size, weight, fill, ls, anchor, fam, e)]


# ── 形状：返回 path 的 d（绝对坐标） ──
def f1(v):
    return f'{v:.1f}'


def d_circ(cx, cy, r):
    return f'M{f1(cx - r)} {f1(cy)}a{r} {r} 0 1 0 {2 * r} 0a{r} {r} 0 1 0 {-2 * r} 0Z'


def d_rect(x, y, w, h, rx=0):
    if not rx:
        return f'M{f1(x)} {f1(y)}H{f1(x + w)}V{f1(y + h)}H{f1(x)}Z'
    return (f'M{f1(x + rx)} {f1(y)}H{f1(x + w - rx)}Q{f1(x + w)} {f1(y)} {f1(x + w)} {f1(y + rx)}V{f1(y + h - rx)}'
            f'Q{f1(x + w)} {f1(y + h)} {f1(x + w - rx)} {f1(y + h)}H{f1(x + rx)}Q{f1(x)} {f1(y + h)} {f1(x)} {f1(y + h - rx)}'
            f'V{f1(y + rx)}Q{f1(x)} {f1(y)} {f1(x + rx)} {f1(y)}Z')


def d_rc(cx, cy, w, h, rx=0):
    return d_rect(cx - w / 2, cy - h / 2, w, h, rx)


def d_tri(cx, cy, w, h):
    return f'M{f1(cx)} {f1(cy - h / 2)}L{f1(cx + w / 2)} {f1(cy + h / 2)}H{f1(cx - w / 2)}Z'


def d_half(cx, cy, r):
    """半圆：平边在下，(cx, cy) 是平边中点"""
    return f'M{f1(cx - r)} {f1(cy)}A{r} {r} 0 0 1 {f1(cx + r)} {f1(cy)}Z'


def d_poly(pts):
    return 'M' + 'L'.join(f'{f1(x)} {f1(y)}' for x, y in pts) + 'Z'


def d_squig(x, y, w, amp, n, ph=0.0, step=4):
    pts = [(x + k, y + amp * math.sin(ph + 2 * math.pi * n * k / w)) for k in range(0, int(w) + 1, step)]
    return 'M' + 'L'.join(f'{f1(a)} {f1(b)}' for a, b in pts)


def d_star(cx, cy, r1, r2, n):
    return d_poly([(cx + math.cos(math.pi * i / n - math.pi / 2) * (r2 if i % 2 else r1),
                    cy + math.sin(math.pi * i / n - math.pi / 2) * (r2 if i % 2 else r1)) for i in range(2 * n)])


def g(elems, tf=None, extra=''):
    t = f' transform="{tf}"' if tf else ''
    return f'<g{t}{extra}>' + ''.join(elems) + '</g>'


def blk(d, fill, sh=SH_, sw=SW_, pat=None, tf=None):
    """一块积木：硬投影 + 糖果色 +（图案）+ 黑描边"""
    e = []
    if sh:
        e.append(f'<path d="{d}" fill="{INK}" transform="translate({sh} {sh})"/>')
    e.append(f'<path d="{d}" fill="{fill}"/>')
    if pat:
        e.append(f'<path d="{d}" fill="url(#{pat})"/>')
    if sw:
        e.append(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round"/>')
    return g(e, tf)


def tube(d, c, w, sw=SW_, sh=6):
    e = [f'<g fill="none" stroke-linecap="round" stroke-linejoin="round">']
    if sh:
        e.append(f'<path d="{d}" stroke="{INK}" stroke-width="{w + 2 * sw}" transform="translate({sh} {sh})"/>')
    if sw:
        e.append(f'<path d="{d}" stroke="{INK}" stroke-width="{w + 2 * sw}"/>')
    e.append(f'<path d="{d}" stroke="{c}" stroke-width="{w}"/></g>')
    return ''.join(e)


def rot(cx, cy, a):
    return f'rotate({a} {f1(cx)} {f1(cy)})'


def tag(cx, cy, w, h, fill, inner, a=0, sh=5, sw=3):
    """贴纸标签：胶囊形 + 黑描边 + 硬投影；inner = 已经按 (cx, cy) 摆好的字"""
    return g([blk(d_rc(cx, cy, w, h, h / 2), fill, sh, sw)] + inner, rot(cx, cy, a) if a else None)


def tag_zh(cx, cy, s, size, fill, a=0, weight=900, padx=None, h=None, color=INK, sh=5):
    w = zw(s, size, weight) + 2 * (padx if padx is not None else size * 0.75)
    h = h or size * 1.75
    return tag(cx, cy, w, h, fill, [ZH(cx, cy + size * 0.36, s, size, weight, color, anchor='middle')], a, sh)


def tag_en(cx, cy, s, size, fill, a=0, weight=700, padx=None, h=None, color=INK, sh=5, ls=0.02):
    w = width(s, size, weight, ls) + 2 * (padx if padx is not None else size * 0.7)
    h = h or size * 1.7
    return tag(cx, cy, w, h, fill, [T(cx, cy + size * 0.35, s, size, weight, color, ls, 'middle')], a, sh)


# ── 图案（与视频里的 <pattern> 一致） ──
def _bacterio():
    r = random.Random(1978)
    out = []
    for _ in range(16):
        x, y, a = r.random() * 120, r.random() * 120, r.random() * 6.283
        L = 10 + r.random() * 14
        d = f'M{f1(x)} {f1(y)}'
        for _k in range(4):
            a += (r.random() - 0.5) * 2.2
            qx, qy = x + math.cos(a) * L * 0.5, y + math.sin(a) * L * 0.5
            x, y = qx + math.cos(a + 0.8) * L * 0.5, qy + math.sin(a + 0.8) * L * 0.5
            d += f'Q{f1(qx)} {f1(qy)} {f1(x)} {f1(y)}'
        out.append(d)
    return out


def _confetti(n=22, size=260, seed=81):
    r = random.Random(seed)
    cols = [INK, INK, BLUE, RED, TEAL, PINK]
    e = []
    for _ in range(n):
        x, y, a, t, c = r.random() * size, r.random() * size, r.random() * 180, r.random(), r.choice(cols)
        tr = f' transform="rotate({a:.0f} {f1(x)} {f1(y)})"'
        if t < 0.4:
            e.append(f'<rect x="{f1(x - 8)}" y="{f1(y - 2.2)}" width="16" height="4.5" fill="{c}"{tr}/>')
        elif t < 0.7:
            e.append(f'<circle cx="{f1(x)}" cy="{f1(y)}" r="3.6" fill="{c}"/>')
        else:
            e.append(f'<path d="M{f1(x)} {f1(y - 6)}L{f1(x + 6)} {f1(y + 4.5)}L{f1(x - 6)} {f1(y + 4.5)}Z" fill="none" stroke="{c}" stroke-width="2.2"{tr}/>')
    return ''.join(e)


def patterns(scale=1.0):
    s = scale
    bac = ''.join(f'<path d="{d}" stroke="{INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>' for d in _bacterio())
    return f'''
    <pattern id="zebra" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(30) scale({s})"><rect width="12" height="24" fill="{INK}"/></pattern>
    <pattern id="zebraW" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(-30) scale({s})"><rect width="12" height="24" fill="{WHITE}"/></pattern>
    <pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="scale({s})"><path d="M0 0H26M0 0V26" stroke="{INK}" stroke-width="2.5" fill="none"/></pattern>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="scale({s})"><circle cx="7" cy="7" r="4.2" fill="{INK}"/><circle cx="21" cy="21" r="4.2" fill="{INK}"/></pattern>
    <pattern id="dotsW" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="scale({s})"><circle cx="6.5" cy="6.5" r="3.4" fill="{WHITE}"/><circle cx="19.5" cy="19.5" r="3.4" fill="{WHITE}"/></pattern>
    <pattern id="squig" width="64" height="32" patternUnits="userSpaceOnUse" patternTransform="scale({s})"><path d="M0 16Q16 3 32 16T64 16" stroke="{INK}" stroke-width="5" fill="none"/></pattern>
    <pattern id="bacterio" width="120" height="120" patternUnits="userSpaceOnUse" patternTransform="scale({0.8 * s})">{bac}</pattern>
    <pattern id="confetti" width="260" height="260" patternUnits="userSpaceOnUse">{_confetti()}</pattern>
    <pattern id="confettiS" width="120" height="120" patternUnits="userSpaceOnUse">{_confetti(12, 120, 7)}</pattern>'''


def svg(name, title, body, defs='', bg=PAPER, confetti=0.3):
    c = f'\n  <rect width="{W}" height="{H}" fill="url(#confetti)" opacity="{confetti}"/>' if confetti else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">\n'
            f'  <!-- Design Style · 风格 004 · 孟菲斯 Memphis —— {title} / 1080×1350（由 make_svgs.py 生成） -->\n'
            f'  <defs>{patterns()}{defs}\n  </defs>\n'
            f'  <rect width="{W}" height="{H}" fill="{bg}"/>{c}\n{body}</svg>\n')


def join(b):
    return '\n'.join('  ' + x for x in b) + '\n'


# ═════════════════════════════════════ 共用：页眉 / 页脚 / 小节标题 ═════════════════════════════════════
def mark(x, y):
    """角标：一个粉圆 + 一个黄三角 + 一根青色波浪线（孟菲斯的“三件套”）；(x, y) 是右上角"""
    return [blk(d_tri(x - 22, y + 26, 40, 36), YELLOW, 4, 3, tf=rot(x - 22, y + 26, -12)),
            blk(d_circ(x - 52, y + 22, 18), PINK, 4, 3),
            tube(d_squig(x - 76, y + 50, 70, 5, 1.5), TEAL, 6, 2.5, 3)]


def header(zh, en, sub, tag_='design style no.04'):
    """页眉：中文 + 拉丁标题、一行灰色说明；右上角一个角标 + 期号；下面一根 4px 黑线"""
    y = MY + round(CJK * 52)
    b = [ZH(MX - 3, y, zh, 52, 900)]
    if en:
        b.append(T(MX + zw(zh, 52, 900) + 16, y, en, 54, 700, INK, 0.0))
    b.append(ZH(MX, MY + 96, sub, 20, 400, GREY))
    b += mark(MX + CW, MY - 4)
    b.append(T(MX + CW, MY + 96, tag_, 16, 500, GREY, 0.06, anchor='end'))
    b.append(f'<rect x="{MX}" y="{MY + 118}" width="{CW}" height="4" fill="{INK}"/>')
    return b


def footer(y=H - 48):
    return [T(MX, y, 'github.com/guanmo-ai/design-style', 16, 500, GREY, 0.03),
            ZH(MX + CW, y, '@guanmo_ai · 每天一个设计风格', 16, 400, GREY, anchor='end')]


def section(y, n, zh, en, c=PINK):
    """小节标题：一个糖果色圆 + 编号、中文、英文；y 是基线"""
    return [blk(d_circ(MX + 17, y - 8, 17), c, 3, 3),
            T(MX + 17, y - 1.5, f'{n:02d}', 17, 700, INK, anchor='middle'),
            ZH(MX + 46, y, zh, 22, 900, INK),
            T(MX + 46 + zw(zh, 22, 900) + 10, y, en, 16, 600, GREY, 0.08)]


def col(i):
    return MX + i * 153


def colw(n):
    return n * 135 + (n - 1) * 18


# ═════════════════════════════════════ 1 · 海报 ═════════════════════════════════════
def wordmark(cx, base, size, a=-5, colors=(PINK, YELLOW, TEAL, RED, BLUE, YELLOW, LILAC), stroke=8, sh=10, word='MEMPHIS'):
    """MEMPHIS：每个字母一种颜色，黑描边 + 硬投影，一高一低、一左一右地歪"""
    ls = 0.02
    total = width(word, size, 700, ls)
    x = cx - total / 2
    sh_, fg = [], []
    for i, ch in enumerate(word):
        wch = width(ch, size, 700)
        lx = x + wch / 2
        dy = -size * 0.05 if i % 2 else size * 0.03
        r = 6 if i % 2 else -5
        tf = f'rotate({r} {f1(lx)} {f1(base + dy - size * 0.35)})'
        common = f' stroke="{INK}" stroke-width="{stroke}" stroke-linejoin="round"'
        sh_.append(g([T(lx, base + dy, ch, size, 700, INK, 0, 'middle', FAM, common)], f'translate({sh} {sh}) {tf}'))
        fg.append(g([T(lx, base + dy, ch, size, 700, colors[i % len(colors)], 0, 'middle', FAM, common + ' paint-order="stroke"')], tf))
        x += wch + ls * size
    return [g(sh_ + fg, rot(cx, base - size * 0.35, a))]


def poster():
    b = []
    # 积木堆：左上方格纸、右上斑马纹、中间粉圆 + 黄三角、右下青方块、左下蓝半圆
    b.append(blk(d_rc(215, 255, 240, 240), WHITE, pat='grid', tf=rot(215, 255, -10), sh=10))
    b.append(blk(d_rc(800, 200, 330, 150), WHITE, pat='zebra', tf=rot(800, 200, 8), sh=10))
    b.append(tube(d_squig(440, 360, 180, 13, 1.5, 0.4), RED, 13, 4, 5))
    b.append(blk(d_circ(395, 585, 235), PINK, sh=12, sw=5))
    b.append(blk(d_circ(325, 515, 60), WHITE, pat='dots', sh=0, sw=4))
    b.append(blk(d_tri(760, 520, 350, 300), YELLOW, tf=rot(760, 520, -12), sh=12, sw=5))
    b.append(blk(d_circ(610, 250, 42), RED, sh=7))
    b.append(blk(d_half(960, 440, 62), LILAC, tf=rot(960, 440, -20), sh=6))
    b.append(blk(d_rc(880, 745, 200, 200), TEAL, tf=rot(880, 745, 16), sh=12, sw=5))
    b.append(blk(d_rc(870, 745, 70, 70), WHITE, pat='bacterio', tf=rot(870, 745, 16), sh=0, sw=4))
    b.append(blk(d_half(205, 905, 165), BLUE, sh=12, sw=5))
    b.append(tube(d_squig(110, 905, 860, 22, 5.5, 1.0), TEAL, 22, 5, 7))
    b += wordmark(540, 1000, 196)
    b.append(tag_zh(540, 1078, '孟菲斯 · 米兰 · 1980—1988', 26, YELLOW, -2, 900))
    # 底部三栏
    yb = 1150
    b.append(f'<rect x="{MX}" y="{yb}" width="{CW}" height="4" fill="{INK}"/>')
    cols = [
        [('Memphis Milano', 24, 700, INK, FAM), ('积木 · 撞色 · 纹样', 20, 700, INK, FAM_SC), ('1980—1988', 20, 500, GREY, FAM)],
        [('让普通的东西，', 20, 900, INK, FAM_SC), ('看起来“好玩”。', 20, 900, INK, FAM_SC), ('再加一圈黑边。', 20, 900, RED, FAM_SC)],
        [('Design Style 风格 004', 20, 700, INK, FAM_SC), ('每天一个设计风格', 20, 400, INK, FAM_SC), ('@guanmo_ai', 20, 400, GREY, FAM_SC)],
    ]
    for k, lines in enumerate(cols):
        for i, (s, sz, wgt, fill, fam) in enumerate(lines):
            b.append(T(MX + k * 306, yb + 44 + i * 32, s, sz, wgt, fill, 0.0, None, fam))
    b.append(ZH(MX + CW, H - 48, '致敬：孟菲斯 1981 年米兰首展 · 构图为重新创作', 14, 400, GREY, anchor='end'))
    return svg('poster', '海报', join(b), confetti=0.55)


# ═════════════════════════════════════ 2 · 速查卡 ═════════════════════════════════════
PATS = [('细菌纹', 'Bacterio', WHITE, 'bacterio'), ('波浪线', 'Squiggle', YELLOW, 'squig'), ('斑马纹', 'Zebra', WHITE, 'zebra'),
        ('方格纸', 'Grid', PINK, 'grid'), ('圆点', 'Dots', TEAL, 'dots'), ('纸屑', 'Confetti', WHITE, 'confettiS')]
SWATCH = [('米白', 'Paper', PAPER), ('黑', 'Ink', INK), ('泡泡糖粉', 'Pink', PINK), ('柠檬黄', 'Yellow', YELLOW),
          ('薄荷青', 'Teal', TEAL), ('钴蓝', 'Blue', BLUE), ('番茄红', 'Red', RED), ('淡紫', 'Lilac', LILAC)]
RULES = [('积木', 'SHAPES', '圆、三角、方块，', '一块一色'), ('撞色', 'CLASH', '糖果色互相撞，', '再用黑压住'),
         ('纹样', 'PATTERN', '图案代替木纹', '和质感'), ('歪着放', 'TILT', '转 6° / 12° / 18°，', '别对齐'),
         ('黑描边', 'OUTLINE', '4px 黑线 +', '8px 硬投影')]


def rule_icon(i, cx, cy, s=1.0):
    """五条规则的小图标（速查卡、视频卡片同一套）"""
    if i == 0:
        return [blk(d_circ(cx - 28 * s, cy + 4 * s, 16 * s), TEAL, 3, 3), blk(d_tri(cx + 4 * s, cy + 2 * s, 34 * s, 30 * s), YELLOW, 3, 3),
                blk(d_rc(cx + 34 * s, cy + 6 * s, 24 * s, 24 * s), BLUE, 3, 3, tf=rot(cx + 34 * s, cy + 6 * s, 10))]
    if i == 1:
        return [blk(d_rc(cx - 30 * s + k * 20 * s, cy + (k % 2) * 6 * s - 3 * s, 22 * s, 22 * s, 3), CANDY[k], 3, 3) for k in range(4)]
    if i == 2:
        return [blk(d_rc(cx - 34 * s + k * 24 * s, cy, 22 * s, 30 * s, 3), WHITE, 3, 3, pat=p) for k, p in enumerate(('zebra', 'dots', 'squig'))]
    if i == 3:
        return [blk(d_rc(cx + (8 if k == 1 else -4) * s, cy - 14 * s + k * 15 * s, 64 * s, 12 * s, 3), [PINK, TEAL, YELLOW][k], 3, 3,
                    tf=rot(cx, cy - 14 * s + k * 15 * s, [-15, 11, -7][k])) for k in range(3)]
    return [f'<path d="{d_circ(cx, cy, 20 * s)}" fill="{INK}" transform="translate({5 * s} {5 * s})"/>',
            f'<path d="{d_circ(cx, cy, 20 * s)}" fill="{LILAC}" stroke="{INK}" stroke-width="4"/>']


def cheatsheet():
    b = header('孟菲斯', 'Memphis', '风格速查卡 · 1980—1988 · 米兰 · 后现代设计')

    # ── 01 积木 ──
    y = 240
    b += section(y, 1, '积木', 'SHAPES', PINK)
    bx, by, bw, bh = MX, y + 18, CW, 150
    b.append(blk(d_rect(bx, by, bw, bh, 18), WHITE, 6, 3))
    names = [('圆', 'circle'), ('三角', 'triangle'), ('方块', 'square'), ('半圆', 'half'), ('波浪线', 'squiggle'), ('圆环', 'ring')]
    for k, (zh, en) in enumerate(names):
        cx = bx + 75 + k * 150
        cy = by + 58
        c = CANDY[k]
        if k == 0:
            b.append(blk(d_circ(cx, cy, 36), c))
        elif k == 1:
            b.append(blk(d_tri(cx, cy, 80, 70), c, tf=rot(cx, cy, -8)))
        elif k == 2:
            b.append(blk(d_rc(cx, cy, 66, 66), c, tf=rot(cx, cy, 12)))
        elif k == 3:
            b.append(blk(d_half(cx, cy + 22, 44), c))
        elif k == 4:
            b.append(tube(d_squig(cx - 46, cy, 92, 12, 1.5), c, 12, 4, 5))
        else:
            b.append(f'<circle cx="{cx + 5}" cy="{cy + 5}" r="30" fill="none" stroke="{INK}" stroke-width="16"/>')
            b.append(f'<circle cx="{cx}" cy="{cy}" r="30" fill="none" stroke="{INK}" stroke-width="16"/>')
            b.append(f'<circle cx="{cx}" cy="{cy}" r="30" fill="none" stroke="{c}" stroke-width="8"/>')
        b.append(ZH(cx, by + 122, zh, 18, 900, INK, anchor='middle'))
        b.append(T(cx, by + 141, en, 13, 500, GREY, 0.04, 'middle'))

    # ── 02 色板 ──
    y = 462
    b += section(y, 2, '色板', 'COLOR', YELLOW)
    sw, gap = 100, (CW - 8 * 100) / 7
    for k, (zh, en, c) in enumerate(SWATCH):
        x = MX + k * (sw + gap)
        b.append(blk(d_rect(x, y + 22, sw, 76, 12), c, 6, 3))
        b.append(ZH(x, y + 126, zh, 16, 900, INK))
        b.append(MONO(x, y + 146, c, 13, 500, GREY))
    b.append(ZH(MX, y + 176, '糖果色互相撞，黑负责压住：相邻两块永远不同色；文字一律黑字、白底或浅底。', 15, 400, GREY))

    # ── 03 纹样 ──
    y = 676
    b += section(y, 3, '纹样', 'PATTERN', TEAL)
    for k, (zh, en, c, p) in enumerate(PATS):
        x = col(k)
        b.append(blk(d_rect(x, y + 22, 135, 96, 12), c, 6, 3, pat=p))
        b.append(ZH(x, y + 146, zh, 16, 900, INK))
        b.append(T(x + zw(zh, 16, 900) + 6, y + 146, en, 13, 500, GREY, 0.03))
    b.append(ZH(MX, y + 176, '图案代替木纹和质感：细菌纹 Bacterio 是索特萨斯 1978 年为 Abet 塑料贴面画的。', 15, 400, GREY))

    # ── 04 字体 ──
    y = 892
    b += section(y, 4, '字体', 'TYPE', BLUE)
    b += [g(OUT(MX, y + 82, 'Memphis!', 62, 700, PINK, 6, 5))]
    b.append(T(MX, y + 112, 'Fredoka 700 · 圆头几何无衬线', 14, 500, GREY))
    x2 = MX + 330
    b.append(ZH(x2, y + 78, '孟菲斯 好玩', 48, 900, INK))
    b.append(ZH(x2, y + 112, '思源黑体 Heavy · 中文一律粗', 14, 400, GREY))
    x3 = MX + 650
    b.append(tag_en(x3 + 62, y + 58, '1981', 26, YELLOW, -4, 700))
    b.append(tag_zh(x3 + 182, y + 62, '贴纸', 22, LILAC, 5))
    b.append(T(x3, y + 112, '标签 = 胶囊 + 黑边 + 投影', 14, 500, GREY, fam=FAM_SC))

    # ── 05 五条规则 ──
    y = 1036
    b += section(y, 5, '五条规则', 'RULES', RED)
    cw5, gap5 = 168, 15
    for k, (zh, en, l1, l2) in enumerate(RULES):
        x = MX + k * (cw5 + gap5)
        c = [PINK, YELLOW, TEAL, LILAC, RED][k]
        b.append(blk(d_rect(x, y + 20, cw5, 146, 14), c, 6, 3))
        b.append(blk(d_rect(x + 10, y + 30, cw5 - 20, 52, 9), WHITE, 0, 3))
        b += rule_icon(k, x + cw5 / 2, y + 56)
        b.append(ZH(x + 12, y + 110, zh, 20, 900, INK))
        b.append(T(x + 12 + zw(zh, 20, 900) + 6, y + 110, en, 12, 700, INK, 0.04))
        b.append(ZH(x + 12, y + 133, l1, 13, 700, INK))
        b.append(ZH(x + 12, y + 152, l2, 13, 700, INK))
    yy = y + 206
    b.append(tag_zh(MX + 46, yy - 6, '这样做', 15, TEAL, -3, 900, padx=12, h=30, sh=3))
    b.append(ZH(MX + 92, yy, '一块一色 · 黑描边 · 硬投影 · 歪一点 · 图案', 15, 700, INK))
    b.append(tag_zh(MX + 512, yy - 6, '别这样', 15, WHITE, 3, 900, padx=12, h=30, sh=3))
    b.append(ZH(MX + 558, yy, '渐变 · 柔和阴影 · 对得整整齐齐', 15, 700, GREY))
    b += footer()
    return svg('cheatsheet', '速查卡', join(b))


# ═════════════════════════════════════ 3 · 如果孟菲斯来做 app ═════════════════════════════════════
def phone(x, y, w=423, h=882, screen=PAPER):
    """手机外框：黑色机身 + 屏幕 + 灵动岛 + 状态栏；返回 (元素, 屏幕内容左边, 右边, 顶)"""
    b = [f'<rect x="{x + 10}" y="{y + 10}" width="{w}" height="{h}" rx="56" fill="{INK}"/>',
         f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="56" fill="{INK}"/>',
         f'<rect x="{x + 11}" y="{y + 11}" width="{w - 22}" height="{h - 22}" rx="46" fill="{screen}"/>']
    return b, x + 32, x + w - 32, y + 78


def status(x, y, w, fill=INK):
    b = [f'<rect x="{x + w / 2 - 52}" y="{y + 24}" width="104" height="30" rx="15" fill="{INK}"/>',
         T(x + 44, y + 47, '9:41', 16, 600, fill)]
    rx = x + w - 44
    b += [f'<rect x="{rx - 24}" y="{y + 36}" width="22" height="11" rx="3" fill="none" stroke="{fill}" stroke-width="1.5"/>',
          f'<rect x="{rx - 22}" y="{y + 38}" width="15" height="7" rx="1.5" fill="{fill}"/>']
    for k in range(4):
        b.append(f'<rect x="{rx - 56 + k * 6}" y="{y + 43 - k * 2.5:.1f}" width="4" height="{4 + k * 2.5:.1f}" fill="{fill}"/>')
    return b


HABITS = [('喝 8 杯水', '6 / 8 杯', PINK, 'circ', True), ('读 20 页书', '20 / 20 页', YELLOW, 'tri', True),
          ('散步 30 分钟', '已完成', TEAL, 'sq', True), ('练琴 15 分钟', '还差 15 分钟', LILAC, 'half', False),
          ('11 点前睡觉', '今晚', WHITE, 'squig', False)]


def icon(kind, cx, cy, c):
    if kind == 'circ':
        return blk(d_circ(cx, cy, 13), c, 3, 3)
    if kind == 'tri':
        return blk(d_tri(cx, cy, 28, 24), c, 3, 3)
    if kind == 'sq':
        return blk(d_rc(cx, cy, 22, 22), c, 3, 3, tf=rot(cx, cy, 12))
    if kind == 'half':
        return blk(d_half(cx, cy + 8, 15), c, 3, 3)
    return tube(d_squig(cx - 15, cy, 30, 5, 1.5), c, 6, 2.5, 3)


def app_ui():
    b = header('如果孟菲斯来做', 'app', '四十年前的家具，今天的界面 · 一个习惯打卡 app 的概念稿', 'ui concept no.04')
    py, pw, ph = 230, 423, 882

    # ── 屏一：今天 ──
    px = MX
    p1, x0, x1, top = phone(px, py)
    b += p1
    b += status(px, py, pw)
    b.append(ZH(x0, top + 40, '早上好，小林', 28, 900))
    b.append(T(x0, top + 70, 'Wed · Mar 12', 18, 600, GREY))
    # 进度：一颗粉色大圆 + 黄色圆环（3 / 5）
    cx, cy = x1 - 62, top + 34
    b.append(f'<circle cx="{cx + 5}" cy="{cy + 5}" r="44" fill="{INK}"/>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="44" fill="{PINK}" stroke="{INK}" stroke-width="4"/>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="44" fill="none" stroke="{YELLOW}" stroke-width="9" stroke-dasharray="{2 * math.pi * 44 * 0.6:.1f} 999" transform="rotate(-90 {cx} {cy})"/>')
    b.append(T(cx, cy + 9, '3/5', 26, 700, INK, anchor='middle'))
    # 今日卡片：一块一色，一张往左歪一点、一张往右歪一点
    yy = top + 112
    for k, (name, sub, c, ic, done) in enumerate(HABITS):
        cy = yy + k * 104 + 40
        a = -1.6 if k % 2 == 0 else 1.4
        e = [blk(d_rect(x0, cy - 40, x1 - x0, 80, 16), c, 6, 3)]
        e.append(f'<circle cx="{x0 + 40}" cy="{cy}" r="24" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>')
        e.append(icon(ic, x0 + 40, cy, [TEAL, PINK, YELLOW, RED, BLUE][k]))
        e.append(ZH(x0 + 78, cy - 3, name, 21, 900, INK))
        e.append(ZH(x0 + 78, cy + 22, sub, 14, 700, INK if c != WHITE else GREY))
        bx = x1 - 36
        if done:
            e.append(f'<circle cx="{bx}" cy="{cy}" r="17" fill="{INK}"/>')
            e.append(f'<path d="M{bx - 8} {cy}L{bx - 2} {cy + 6}L{bx + 9} {cy - 7}" stroke="{WHITE}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
        else:
            e.append(f'<circle cx="{bx}" cy="{cy}" r="17" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>')
        b.append(g(e, rot((x0 + x1) / 2, cy, a)))
    # 加一个
    yb = yy + 5 * 104 + 28
    b.append(tag_zh((x0 + x1) / 2, yb, '＋ 加一个习惯', 20, YELLOW, 0, 900, padx=60))
    # 底栏
    ny = py + ph - 66
    b.append(blk(d_rect(x0 + 10, ny - 30, x1 - x0 - 20, 60, 30), WHITE, 5, 3))
    for k, (kind, c) in enumerate((('circ', PINK), ('tri', YELLOW), ('sq', TEAL))):
        b.append(icon(kind, x0 + 10 + (x1 - x0 - 20) * (k + 0.5) / 3, ny, c))
    b.append(f'<rect x="{x0 + 10 + (x1 - x0 - 20) / 6 - 18}" y="{ny + 19}" width="36" height="4" rx="2" fill="{INK}"/>')

    # ── 屏二：全部完成 ──
    px2 = MX + CW - pw
    p2, x0, x1, top = phone(px2, py, screen=YELLOW)
    b += p2
    b.append(g([f'<rect x="{px2 + 11}" y="{py + 11}" width="{pw - 22}" height="{ph - 22}" rx="46" fill="url(#confetti)"/>'], extra=' opacity="0.8"'))
    b += status(px2, py, pw)
    mx_ = (x0 + x1) / 2
    # 一个小小的“Carlton”：积木搭成的奖杯
    base = top + 300
    b.append(blk(d_rc(mx_, base, 210, 34), INK, 6, 3))
    b.append(blk(d_rc(mx_, base - 85, 22, 140), RED))
    b.append(blk(d_poly([(mx_ - 10, base - 110), (mx_ - 112, base - 170), (mx_ - 112, base - 150), (mx_ - 10, base - 90)]), TEAL, 6, 3))
    b.append(blk(d_poly([(mx_ + 10, base - 110), (mx_ + 112, base - 170), (mx_ + 112, base - 150), (mx_ + 10, base - 90)]), TEAL, 6, 3))
    b.append(blk(d_circ(mx_, base - 196, 46), PINK))
    b.append(blk(d_tri(mx_, base - 262, 50, 44), BLUE, 5, 3, tf=rot(mx_, base - 262, 10)))
    b.append(blk(d_star(mx_ - 120, base - 250, 30, 20, 8), WHITE, 5, 3))
    b.append(blk(d_circ(mx_ + 128, base - 240, 16), LILAC, 4, 3))
    b.append(tube(d_squig(mx_ - 140, base - 30, 70, 7, 1.5), BLUE, 7, 3, 3))
    b.append(tube(d_squig(mx_ + 70, base - 30, 70, 7, 1.5), PINK, 7, 3, 3))
    b += [g(OUT(mx_, base + 96, '全部完成！', 44, 900, WHITE, 7, 5, FAM_SC, 'middle'))]
    b.append(ZH(mx_, base + 136, '5 个习惯 · 今天一个不落', 18, 700, INK, anchor='middle'))
    # 连续打卡：一周 7 根“积木柱”
    cy0 = base + 160
    b.append(blk(d_rect(x0, cy0, x1 - x0, 216, 18), WHITE, 6, 3))
    b.append(ZH(x0 + 20, cy0 + 38, '连续打卡', 18, 900, INK))
    b.append(T(x1 - 20, cy0 + 40, '12 days', 22, 700, RED, anchor='end'))
    days = 'MTWTFSS'
    vals = [3, 5, 4, 5, 2, 5, 5]
    cw_ = (x1 - x0 - 40) / 7
    for k in range(7):
        bx = x0 + 20 + k * cw_ + cw_ / 2
        for j in range(vals[k]):
            yj = cy0 + 170 - j * 22
            b.append(blk(d_rc(bx, yj - 9, cw_ - 14, 18, 4), CANDY[(k + j) % 6], 3, 2.5))
        b.append(T(bx, cy0 + 198, days[k], 14, 700, INK if k < 6 else RED, anchor='middle'))
    b.append(tag_zh(mx_, py + ph - 64, '分享给朋友', 22, PINK, -2, 900, padx=80))

    # ── 注释 ──
    ay = py + ph + 50
    notes = [('一块一色', '每个习惯一种糖果色', '图标就是一块积木'), ('打勾 = 压一下', '卡片像积木一样落地', '压扁、再弹回来'),
             ('完成 = 撒纸屑', '庆祝页铺满纸屑纹样', '一周的打卡是一摞摞积木')]
    for k, (h1, h2, h3) in enumerate(notes):
        x = MX + k * 306
        b.append(blk(d_circ(x + 14, ay - 7, 14), [PINK, TEAL, YELLOW][k], 3, 3))
        b.append(T(x + 14, ay - 1, str(k + 1), 16, 700, INK, anchor='middle'))
        b.append(ZH(x + 38, ay, h1, 18, 900, INK))
        b.append(ZH(x, ay + 32, h2, 15, 400, GREY))
        b.append(ZH(x, ay + 54, h3, 15, 400, GREY))
    b += footer()
    return svg('app-ui', 'App 概念稿', join(b))


# ═════════════════════════════════════ 4 · 四步改造 ═════════════════════════════════════
SW, SH = 435, 420


def mini(k):
    """同一张“周末市集”海报的四个版本（坐标是小图内部的，0..SW × 0..SH）"""
    b = []
    cx = SW / 2
    if k == 0:  # 原稿：白底、居中、浅灰、圆角照片、柔和阴影
        b.append(f'<rect width="{SW}" height="{SH + 60}" fill="#F4F4F2"/>')
        b.append(f'<rect x="{cx - 150}" y="64" width="300" height="170" rx="18" fill="#000" opacity="0.06" transform="translate(0 6)"/>')
        b.append(f'<rect x="{cx - 150}" y="64" width="300" height="170" rx="18" fill="url(#soft)"/>')
        b.append(f'<circle cx="{cx - 60}" cy="130" r="26" fill="#FFFFFF" opacity="0.5"/>')
        b.append(f'<path d="M{cx - 150} 214L{cx - 70} 160L{cx} 200L{cx + 60} 150L{cx + 150} 210V216Q{cx + 150} 234 {cx + 132} 234H{cx - 132}Q{cx - 150} 234 {cx - 150} 216Z" fill="#FFFFFF" opacity="0.35"/>')
        b.append(ZH(cx, 296, '周末市集', 40, 700, '#444444', anchor='middle'))
        b.append(ZH(cx, 328, '3 月 16 日 · 中山公园', 16, 400, '#888888', anchor='middle'))
        b.append(ZH(cx, 352, '手作 · 咖啡 · 唱片 · 花', 14, 400, '#999999', anchor='middle'))
        b.append(f'<rect x="{cx - 70}" y="378" width="140" height="40" rx="20" fill="#8BA3C7"/>')
        b.append(ZH(cx, 404, '了解更多', 15, 500, '#FFFFFF', anchor='middle'))
        return b
    bg = PAPER if k < 3 else LILAC
    b.append(f'<rect width="{SW}" height="{SH + 60}" fill="{bg}"/>')
    if k == 3:
        b.append(f'<rect width="{SW}" height="{SH + 60}" fill="url(#dotsW)" opacity="0.35"/>')
    sh, sw = (0, 0) if k == 1 else (7, 3.5)
    if k < 3:  # 积木代替照片，仍然居中
        b.append(blk(d_circ(cx - 85, 160, 62), PINK, sh, sw))
        b.append(blk(d_tri(cx + 20, 160, 120, 110), YELLOW, sh, sw))
        b.append(blk(d_rc(cx + 112, 172, 84, 84), TEAL, sh, sw))
        b.append(blk(d_half(cx - 20, 236, 50), BLUE, sh, sw) if k == 2 else blk(d_half(cx - 20, 236, 50), BLUE, 0, 0))
        if k == 1:
            b.append(ZH(cx, 296, '周末市集', 40, 900, INK, anchor='middle'))
        else:
            b.append(blk(d_rc(cx, 282, 210, 62, 12), YELLOW, sh, sw))
            b.append(ZH(cx, 296, '周末市集', 40, 900, INK, anchor='middle'))
        b.append(ZH(cx, 340, '3 月 16 日 · 中山公园', 16, 700, INK, anchor='middle'))
        b.append(ZH(cx, 364, '手作 · 咖啡 · 唱片 · 花', 14, 400, INK, anchor='middle'))
        if k == 1:
            b.append(f'<rect x="{cx - 70}" y="384" width="140" height="40" rx="20" fill="{RED}"/>')
        else:
            b.append(blk(d_rect(cx - 70, 384, 140, 40, 20), RED, 5, 3))
        b.append(ZH(cx, 410, '了解更多', 15, 900, WHITE if k == 1 else INK, anchor='middle'))
        return b
    # k == 3：纹样 + 歪着放
    b.append(blk(d_rc(96, 92, 120, 120), WHITE, 7, 3.5, pat='grid', tf=rot(96, 92, -12)))
    b.append(blk(d_rc(330, 70, 170, 70), WHITE, 7, 3.5, pat='zebra', tf=rot(330, 70, 9)))
    b.append(blk(d_circ(170, 190, 78), PINK, 8, 4))
    b.append(blk(d_circ(150, 170, 26), WHITE, 0, 3, pat='dots'))
    b.append(blk(d_tri(300, 186, 140, 124), YELLOW, 8, 4, tf=rot(300, 186, -14)))
    b.append(blk(d_rc(372, 250, 74, 74), TEAL, 7, 3.5, tf=rot(372, 250, 18)))
    b.append(tube(d_squig(30, 268, 300, 10, 3, 0.5), TEAL, 10, 3.5, 4))
    b.append(blk(d_circ(240, 92, 18), RED, 4, 3))
    t = g(OUT(cx, 330, '周末市集', 52, 900, WHITE, 7, 5, FAM_SC, 'middle'), rot(cx, 315, -5))
    b.append(t)
    b.append(tag_zh(cx - 40, 372, '3 月 16 日 · 中山公园', 15, WHITE, 2, 900, padx=16, sh=4))
    b.append(ZH(cx - 40, 402, '手作 · 咖啡 · 唱片 · 花', 13, 700, INK, anchor='middle'))
    b.append(tag_zh(342, 398, '来玩！', 18, RED, -8, 900, padx=18, color=INK))
    return b


def steps():
    b = header('四步改造', '', '同一张普通海报，每一步只改一件事 —— 改到第四步，它就开始“玩”了', 'how-to no.04')
    defs = ['\n    <linearGradient id="soft" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9D3E3"/><stop offset="1" stop-color="#9FB0CC"/></linearGradient>']
    caps = [('原稿', '居中、浅灰、圆角照片、柔和阴影', '哪儿都对，就是不好玩'),
            ('积木', '只改一件事：照片换成几块基本形', '圆、三角、方块、半圆，一块一色'),
            ('黑描边', '每一块加 4px 黑线 + 8px 硬投影', '颜色再吵，也被黑线“框”住了'),
            ('纹样 + 歪着放', '加斑马纹、方格、波浪线；全部转一点', '标题描边、标签变贴纸，开始“玩”了')]
    for k in range(4):
        x = MX + (k % 2) * (SW + 30)
        y = 222 + (k // 2) * (SH + 96)
        defs.append(f'\n    <clipPath id="m{k}"><rect width="{SW}" height="{SH}" rx="14"/></clipPath>')
        b.append(f'<path d="{d_rect(x, y, SW, SH, 14)}" fill="{INK}" transform="translate(8 8)"/>')
        b.append(f'<g transform="translate({x} {y})"><g clip-path="url(#m{k})">')
        b.append('  ' + g(mini(k), 'translate(0 -30)'))
        b.append('</g></g>')
        b.append(f'<path d="{d_rect(x, y, SW, SH, 14)}" fill="none" stroke="{INK}" stroke-width="3"/>')
        cy = y + SH + 40
        n, l1, l2 = caps[k]
        b.append(blk(d_circ(x + 16, cy - 7, 16), [WHITE, PINK, YELLOW, TEAL][k], 3, 3))
        b.append(T(x + 16, cy - 1, f'{k + 1:02d}', 15, 700, INK, anchor='middle'))
        b.append(ZH(x + 42, cy, n, 20, 900, INK))
        b.append(ZH(x + 42 + zw(n, 20, 900) + 12, cy, l1, 14, 700, INK))
        b.append(ZH(x + 42 + zw(n, 20, 900) + 12, cy + 22, l2, 14, 400, GREY))
        if k % 2 == 0:  # 两张之间一个小三角当箭头
            ax, ay = x + SW + 15, y + SH / 2
            b.append(blk(d_poly([(ax + 9, ay), (ax - 7, ay - 10), (ax - 7, ay + 10)]), YELLOW, 3, 2.5))
    b += footer()
    return svg('steps', '四步改造', join(b), ''.join(defs))


def main():
    files = {'poster': poster(), 'cheatsheet': cheatsheet(), 'app-ui': app_ui(), 'steps': steps()}
    for name, content in files.items():
        open(os.path.join(HERE, f'{name}.svg'), 'w', encoding='utf-8').write(content)
        print('wrote', name + '.svg')


if __name__ == '__main__':
    main()
