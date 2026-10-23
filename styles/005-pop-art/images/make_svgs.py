"""
风格 005 · 波普艺术 Pop Art —— 四张风格图（1080×1350）的生成脚本

四张图共用一套“漫画书”积木：平涂一块原色 + 一圈 4px 粗黑线 + 往右下 8px 的黑色硬投影（不模糊）；
深浅一律用本戴点（Ben-Day dots，六角排列）来做，不用渐变。要读的字放进白色对话框或黄色旁白框里。
边距 90 / 72（左右 / 上下），与 001—004 同一套页眉页脚。字宽按 Bangers / 思源黑体的真实度量计算。

  poster.svg      一张海报：一格漫画，红色网点往外长，爆炸框里一声 POP!
  cheatsheet.svg  速查卡：网点、色板、对话框、字体、五条规则、这样做 / 别这样
  app-ui.svg      如果波普来做 app：一个便利店点单 app 的概念稿
  steps.svg       四步改造：同一张普通海报，每一步只改一件事

生成的 SVG 是普通可读的源文件，可以直接改；改完再跑 scripts/build_images.py 内嵌字体、导出 PNG。
用法：python3 styles/005-pop-art/images/make_svgs.py
"""
import math
import os
import random
from xml.sax.saxutils import escape

from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
FONTS = os.path.join(ROOT, 'public', 'fonts')
W, H = 1080, 1350
MX, MY = 90, 72
CW = W - 2 * MX  # 900

# 颜色（与 tokens.ts 一致）
PAPER, INK, WHITE = '#FFF4DC', '#111111', '#FFFFFF'
YELLOW, RED, BLUE, PINK, MAGENTA, CYAN = '#FFD31A', '#E62E2D', '#1E5BC6', '#F7B5A8', '#F0458E', '#4FB3E8'
BUN, MEAT, LEAF, GOLD = '#E39A45', '#6B3420', '#3DAA4A', '#E8B830'
PRIMARY = [RED, YELLOW, BLUE, MAGENTA, CYAN]
GREY = '#6B6355'
SW_, SH_ = 4, 8  # 粗黑线、硬投影（1080 宽的图）
PITCH = 14  # 本戴点点距（1080 宽的图）

FAM = "'Bangers', 'Impact', 'Arial Black', sans-serif"
FAM_SC = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"
FAM_MONO = "'JetBrains Mono', ui-monospace, monospace"
CAP = 0.72  # Bangers 大写高度（em）
CJK = 0.84  # 思源黑体字面顶部到基线（em，约值）

# ── 字体度量 ──
_FONTS = {}


def _font(kind, weight):
    key = (kind, weight)
    if key not in _FONTS:
        if kind == 'ban':
            f = TTFont(os.path.join(FONTS, 'Bangers-Regular.ttf'))
        else:
            name = {400: 'Regular', 500: 'Medium', 700: 'Bold', 900: 'Black'}[weight]
            f = TTFont(os.path.join(FONTS, f'NotoSansSC-{name}.otf'))
        _FONTS[key] = (f.getBestCmap(), f['hmtx'], f['head'].unitsPerEm)
    return _FONTS[key]


def width(s, size, weight=400, ls=0.0, kind='ban'):
    """字符串的步进宽度（不含最后一个字的字距）；Bangers 没有的字（汉字）按思源黑体量"""
    w = 0
    for ch in s:
        cmap, hm, upm = _font(kind, 400 if kind == 'ban' else weight)
        if ord(ch) not in cmap:
            cmap, hm, upm = _font('sc', 900 if weight >= 800 else 700 if weight >= 600 else 500 if weight >= 500 else 400)
        w += hm[cmap[ord(ch)]][0] / upm
    return (w + ls * (len(s) - 1)) * size


def zw(s, size, weight=900):
    return width(s, size, weight, kind='sc')


def T(x, y, s, size, weight=400, fill=INK, ls=0.0, anchor=None, fam=FAM, extra='', rot=None):
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


def BAN(x, y, s, size, fill=RED, sw=6, sh=6, anchor=None, ls=0.03, fam=FAM, weight=400):
    """拟声字：粗黑边 + 硬投影的大字"""
    e = f' stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round" paint-order="stroke"'
    out = []
    if sh:
        out.append(g([T(x, y, s, size, weight, INK, ls, anchor, fam, f' stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round"')], f'translate({sh} {sh})'))
    out.append(T(x, y, s, size, weight, fill, ls, anchor, fam, e))
    return g(out)


def ZBAN(x, y, s, size, fill=WHITE, sw=6, sh=6, anchor=None, ls=0.0):
    return BAN(x, y, s, size, fill, sw, sh, anchor, ls, FAM_SC, 900)


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


def d_poly(pts):
    return 'M' + 'L'.join(f'{f1(x)} {f1(y)}' for x, y in pts) + 'Z'


def d_burst(cx, cy, r1, r2, n, a0=0.0, seed=1, sx=1.0):
    """爆炸框：n 个尖角，尖角长短随机一点（像手画的）；sx 横向拉伸"""
    r = random.Random(seed)
    pts = []
    for i in range(2 * n):
        a = a0 + math.pi * i / n
        rr = r1 * (0.82 + 0.36 * r.random()) if i % 2 == 0 else r2 * (0.92 + 0.16 * r.random())
        pts.append((cx + math.cos(a) * rr * sx, cy + math.sin(a) * rr))
    return d_poly(pts)


def d_bubble(cx, cy, rx, ry, tx, ty, spread=0.22):
    """对话框：一个椭圆 + 一根尖尾巴，一笔画完（只有一圈黑线）；(tx, ty) 是尾巴尖"""
    at = math.atan2((ty - cy) / ry, (tx - cx) / rx)
    pts = []
    n = 72
    for i in range(n + 1):
        a = at + spread + (2 * math.pi - 2 * spread) * i / n
        pts.append((cx + math.cos(a) * rx, cy + math.sin(a) * ry))
    pts.append((tx, ty))
    return d_poly(pts)


def d_cloud(cx, cy, rx, ry, n=11, seed=3):
    """想法框：一圈小圆弧拼成的云"""
    r = random.Random(seed)
    pts = [(cx + math.cos(2 * math.pi * i / n) * rx, cy + math.sin(2 * math.pi * i / n) * ry) for i in range(n)]
    d = f'M{f1(pts[0][0])} {f1(pts[0][1])}'
    for i in range(n):
        x2, y2 = pts[(i + 1) % n]
        rr = math.dist(pts[i], (x2, y2)) * (0.56 + 0.08 * r.random())
        d += f'A{f1(rr)} {f1(rr)} 0 0 1 {f1(x2)} {f1(y2)}'
    return d + 'Z'


def d_dots(x0, y0, w, h, pitch, rf):
    """本戴点：六角排列，rf(x, y) 给出每个点的半径（≤ 0.4 的点不画）"""
    d = []
    dy = pitch * 0.866
    j = 0
    y = y0
    while y <= y0 + h + dy:
        x = x0 + (pitch / 2 if j % 2 else 0)
        while x <= x0 + w + pitch:
            rr = rf(x, y)
            if rr > 0.4:
                d.append(d_circ(x, y, round(rr, 1)))
            x += pitch
        y += dy
        j += 1
    return ''.join(d)


def g(elems, tf=None, extra=''):
    t = f' transform="{tf}"' if tf else ''
    return f'<g{t}{extra}>' + ''.join(elems) + '</g>'


def rot(cx, cy, a):
    return f'rotate({a} {f1(cx)} {f1(cy)})'


def blk(d, fill, sh=SH_, sw=SW_, pat=None, tf=None, po=1.0):
    """一块平涂：硬投影 + 原色 +（网点）+ 粗黑线"""
    e = []
    if sh:
        e.append(f'<path d="{d}" fill="{INK}" transform="translate({sh} {sh})"/>')
    e.append(f'<path d="{d}" fill="{fill}"/>')
    if pat:
        o = f' opacity="{po}"' if po < 1 else ''
        e.append(f'<path d="{d}" fill="url(#{pat})"{o}/>')
    if sw:
        e.append(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round"/>')
    return g(e, tf)


def line(x1, y1, x2, y2, w=SW_, c=INK, cap='round'):
    return f'<path d="M{f1(x1)} {f1(y1)}L{f1(x2)} {f1(y2)}" stroke="{c}" stroke-width="{w}" stroke-linecap="{cap}" fill="none"/>'


def speed(cx, cy, r0, r1, n=44, w=5, c=INK, seed=7):
    """集中线：从 (cx, cy) 往外的细长三角"""
    r = random.Random(seed)
    d = []
    for i in range(n):
        a = 2 * math.pi * i / n + r.random() * 0.08
        a0 = r0 * (1 + r.random() * 0.25)
        ww = w * (0.5 + r.random())
        nx, ny = -math.sin(a) * ww, math.cos(a) * ww
        d.append(d_poly([(cx + math.cos(a) * a0, cy + math.sin(a) * a0),
                         (cx + math.cos(a) * r1 + nx, cy + math.sin(a) * r1 + ny),
                         (cx + math.cos(a) * r1 - nx, cy + math.sin(a) * r1 - ny)]))
    return f'<path d="{"".join(d)}" fill="{c}"/>'


def narr(x, y, s, size=18, fill=YELLOW, weight=900, pad=10, sh=5, sw=3, color=INK, h=None, a=0):
    """旁白框：一块黄色方框，左上角对齐 (x, y)"""
    w = zw(s, size, weight) + 2 * pad
    h = h or size * 1.7
    e = [blk(d_rect(x, y, w, h), fill, sh, sw), ZH(x + pad, y + h / 2 + size * 0.36, s, size, weight, color)]
    return g(e, rot(x, y, a) if a else None), w


def bubble(cx, cy, rx, ry, tx, ty, lines, size=20, weight=900, sh=6, sw=SW_, fill=WHITE, lh=1.35, color=INK):
    """对话框 + 居中的几行字"""
    e = [blk(d_bubble(cx, cy, rx, ry, tx, ty), fill, sh, sw)]
    y0 = cy - (len(lines) - 1) * size * lh / 2 + size * 0.36
    for i, s in enumerate(lines):
        e.append(ZH(cx, y0 + i * size * lh, s, size, weight, color, anchor='middle'))
    return g(e)


# ── 物件（与视频里画法一致） ──
def can(cx, cy, s=1.0, top=RED, bot=WHITE, txt=RED, name='番茄', a=0):
    """汤罐：(cx, cy) 是罐子中心"""
    e = [f'<rect x="-44" y="-50" width="104" height="124" fill="{INK}"/>',
         f'<rect x="-52" y="-58" width="104" height="62" fill="{top}" stroke="{INK}" stroke-width="4"/>',
         f'<rect x="-52" y="4" width="104" height="58" fill="{bot}" stroke="{INK}" stroke-width="4"/>',
         T(0, -14, 'SOUP', 36, 400, WHITE if txt == INK else bot, 0.04, 'middle', extra=f' stroke="{INK}" stroke-width="3.2" paint-order="stroke" stroke-linejoin="round"'),
         f'<circle cx="0" cy="4" r="11" fill="{GOLD}" stroke="{INK}" stroke-width="3"/>',
         ZH(0, 42, name, 17 if len(name) > 2 else 20, 900, txt, anchor='middle'),
         f'<path d="M-52 62Q0 76 52 62" fill="none" stroke="{INK}" stroke-width="4"/>',
         f'<ellipse cx="0" cy="-58" rx="52" ry="10" fill="#D9D9D9" stroke="{INK}" stroke-width="4"/>',
         f'<ellipse cx="0" cy="-58" rx="38" ry="6" fill="none" stroke="#9A9A9A" stroke-width="2"/>']
    tf = f'translate({f1(cx)} {f1(cy)})' + (f' rotate({a})' if a else '') + f' scale({s})'
    return g(e, tf)


def burger(cx, cy, s=1.0):
    """汉堡：五层，(cx, cy) 是中心"""
    e = [blk('M-70 -8Q-70 -62 0 -62Q70 -62 70 -8Z', BUN, 6, 4),
         f'<path d="M-30 -40l6 -3M0 -48l6 3M28 -38l6 -3M-12 -28l6 3M14 -24l6 -2" stroke="{PAPER}" stroke-width="4" stroke-linecap="round"/>',
         blk('M-78 -4Q-60 12 -40 -2Q-20 14 0 -2Q20 14 40 -2Q60 12 78 -4L74 6H-74Z', LEAF, 6, 4),
         blk(d_rect(-74, 4, 148, 22, 11), MEAT, 6, 4),
         blk(d_poly([(-72, 28), (72, 28), (56, 40), (40, 30), (20, 42), (0, 30), (-24, 42), (-44, 30), (-62, 40)]), YELLOW, 0, 4),
         blk('M-70 32H70Q70 60 40 60H-40Q-70 60 -70 32Z', BUN, 6, 4)]
    return g(e, f'translate({f1(cx)} {f1(cy)}) scale({s})')


def soda(cx, cy, s=1.0, c=RED):
    """汽水瓶：(cx, cy) 是中心"""
    d = 'M-12 -78H12V-56Q34 -34 34 -2V64Q34 74 24 74H-24Q-34 74 -34 64V-2Q-34 -34 -12 -56Z'
    e = [blk(d, CYAN, 6, 4), blk(d_rect(-34, -4, 68, 40), c, 0, 4),
         T(0, 25, 'POP', 28, 400, WHITE, 0.04, 'middle', extra=f' stroke="{INK}" stroke-width="3" paint-order="stroke"'),
         blk(d_rect(-15, -90, 30, 14, 3), YELLOW, 0, 4),
         f'<path d="M-20 -38Q-24 -20 -24 -8" stroke="{WHITE}" stroke-width="6" stroke-linecap="round" fill="none"/>']
    return g(e, f'translate({f1(cx)} {f1(cy)}) scale({s})')


def cone(cx, cy, s=1.0):
    """冰淇淋：(cx, cy) 是中心"""
    e = [blk(d_poly([(-38, -6), (38, -6), (0, 80)]), BUN, 6, 4),
         f'<path d="M-26 8L14 52M-8 -4L24 30M10 -6L28 12M26 8L-12 52M8 -4L-22 26" stroke="{INK}" stroke-width="3" fill="none" clip-path="url(#coneclip)"/>',
         blk('M-46 -6Q-58 -34 -30 -44Q-26 -78 4 -76Q34 -80 34 -48Q58 -40 46 -6Z', PINK, 6, 4),
         f'<path d="M-6 -60Q4 -66 14 -60" stroke="{WHITE}" stroke-width="6" stroke-linecap="round" fill="none"/>',
         blk(d_circ(6, -84, 10), RED, 0, 4)]
    return g(e, f'translate({f1(cx)} {f1(cy)}) scale({s})')


def cup(cx, cy, s=1.0, body=WHITE, band=RED, steam=True, sw=4):
    """咖啡杯（四步改造用）"""
    e = [f'<path d="M44 -10Q78 -10 76 16Q74 40 40 40" fill="none" stroke="{INK}" stroke-width="{12 + sw}" stroke-linecap="round"/>',
         f'<path d="M44 -10Q78 -10 76 16Q74 40 40 40" fill="none" stroke="{body}" stroke-width="12" stroke-linecap="round"/>',
         blk('M-56 -34H56L46 56Q44 70 30 70H-30Q-44 70 -46 56Z', body, 0, sw),
         blk(d_poly([(-53, -6), (53, -6), (50, 20), (-50, 20)]), band, 0, sw)]
    if steam:
        e += [f'<path d="M{x} -48Q{x - 10} -62 {x} -76Q{x + 10} -90 {x} -104" fill="none" stroke="{INK}" stroke-width="{sw}" stroke-linecap="round"/>' for x in (-22, 0, 22)]
    return g(e, f'translate({f1(cx)} {f1(cy)}) scale({s})')


# ── 网点图案（与视频里的 <pattern> 一致：六角排列） ──
def _hex(id_, pitch, r, c, bg=None, tf=''):
    h = pitch * 1.732
    b = f'<rect width="{pitch}" height="{f1(h)}" fill="{bg}"/>' if bg else ''
    t = f' patternTransform="{tf}"' if tf else ''
    return (f'<pattern id="{id_}" width="{pitch}" height="{f1(h)}" patternUnits="userSpaceOnUse"{t}>{b}'
            f'<circle cx="0" cy="0" r="{r}" fill="{c}"/><circle cx="{pitch}" cy="0" r="{r}" fill="{c}"/>'
            f'<circle cx="{pitch / 2}" cy="{f1(h / 2)}" r="{r}" fill="{c}"/>'
            f'<circle cx="0" cy="{f1(h)}" r="{r}" fill="{c}"/><circle cx="{pitch}" cy="{f1(h)}" r="{r}" fill="{c}"/></pattern>')


def patterns():
    p = PITCH
    return ''.join(['\n    ' + x for x in [
        _hex('dotRed', p, 3.4, RED),
        _hex('dotInk', p, 2.6, INK),
        _hex('dotBlue', p, 3.0, '#174AA6'),
        _hex('dotYellow', p, 3.4, '#F2B800'),
        _hex('dotCyan', p, 3.0, '#2E95CF'),
        _hex('dotMag', p, 3.0, '#D12E74'),
        _hex('dotWhite', p, 2.6, WHITE),
        _hex('skin', 9, 2.5, RED, WHITE),  # 白纸上的小红点 = 肤色
        _hex('dotPaper', p, 2.2, '#F0D9A8'),
        f'<pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="10" fill="{INK}"/></pattern>',
        f'<clipPath id="coneclip"><path d="M-38 -6H38L0 80Z"/></clipPath>',
    ]])


def svg(name, title, body, defs='', bg=PAPER, paper=True):
    p = f'\n  <rect width="{W}" height="{H}" fill="url(#dotPaper)" opacity="0.55"/>' if paper else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">\n'
            f'  <!-- Design Style · 风格 005 · 波普艺术 Pop Art —— {title} / 1080×1350（由 make_svgs.py 生成） -->\n'
            f'  <defs>{patterns()}{defs}\n  </defs>\n'
            f'  <rect width="{W}" height="{H}" fill="{bg}"/>{p}\n{body}</svg>\n')


def join(b):
    return '\n'.join('  ' + x for x in b) + '\n'


# ═════════════════════════════════════ 共用：页眉 / 页脚 / 小节标题 ═════════════════════════════════════
def mark(x, y):
    """角标：一个红色小爆炸框 + 黄色网点圆（波普的“两件套”）；(x, y) 是右上角"""
    return [blk(d_circ(x - 64, y + 32, 22), YELLOW, 4, 3, pat='dotRed'),
            blk(d_burst(x - 26, y + 30, 30, 18, 9, 0.2, 5), RED, 4, 3)]


def header(zh, en, sub, tag_='design style no.05'):
    """页眉：中文 + Bangers 标题、一行灰色说明；右上角一个角标 + 期号；下面一根 4px 黑线"""
    y = MY + round(CJK * 52)
    b = [ZH(MX - 3, y, zh, 52, 900)]
    if en:
        b.append(BAN(MX + zw(zh, 52, 900) + 16, y, en, 60, RED, 4, 4, ls=0.03))
    b.append(ZH(MX, MY + 96, sub, 20, 400, GREY))
    b += mark(MX + CW, MY - 4)
    b.append(MONO(MX + CW, MY + 96, tag_, 16, 500, GREY, 0.02, anchor='end'))
    b.append(f'<rect x="{MX}" y="{MY + 118}" width="{CW}" height="4" fill="{INK}"/>')
    return b


def footer(y=H - 48):
    return [MONO(MX, y, 'github.com/guanmo-ai/design-style', 15, 500, GREY),
            ZH(MX + CW, y, '@guanmo_ai · 每天一个设计风格', 16, 400, GREY, anchor='end')]


def section(y, n, zh, en, c=RED):
    """小节标题：一个原色小方块 + 编号、中文、英文；y 是基线"""
    tc = WHITE if c in (RED, BLUE) else INK
    return [blk(d_rect(MX, y - 25, 34, 34), c, 3, 3),
            T(MX + 17, y + 0.5, f'{n:02d}', 21, 400, tc, 0.03, 'middle'),
            ZH(MX + 46, y, zh, 22, 900, INK),
            T(MX + 46 + zw(zh, 22, 900) + 10, y, en, 19, 400, GREY, 0.06)]


def col(i):
    return MX + i * 153


# ═════════════════════════════════════ 1 · 海报 ═════════════════════════════════════
def poster():
    b = []
    px, py, pw, ph = MX, MY, CW, 1030
    cx, cy = 540, 500
    defs = f'\n    <clipPath id="panel"><rect x="{px}" y="{py}" width="{pw}" height="{ph}"/></clipPath>'
    # 一格漫画：黄底 + 红色网点（离中心越远点越大）+ 集中线
    b.append(f'<rect x="{px + 12}" y="{py + 12}" width="{pw}" height="{ph}" fill="{INK}"/>')
    inner = [f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" fill="{YELLOW}"/>']
    rf = lambda x, y: min(1.0, max(0.0, (math.hypot(x - cx, (y - cy) * 0.9) - 260) / 520)) * 18 * 0.6
    inner.append(f'<path d="{d_dots(px, py, pw, ph, 18, rf)}" fill="{RED}"/>')
    inner.append(speed(cx, cy, 380, 1100, 56, 9, INK, 11))
    # 爆炸框：外红、内白，POP! 往左歪
    inner.append(blk(d_burst(cx, cy, 430, 320, 15, 0.1, 21, 1.02), RED, 14, 6))
    inner.append(blk(d_burst(cx, cy, 330, 262, 15, 0.32, 9), WHITE, 0, 5, pat='dotYellow', po=0.5))
    inner.append(g([BAN(cx - 8, cy + 110, 'POP!', 320, YELLOW, 14, 14, 'middle', 0.02)], rot(cx, cy, -7)))
    # 旁白框（左上）
    n1, _ = narr(px + 26, py + 26, '1956 年，伦敦——', 26, WHITE, 900, 16, 6, 4, h=54)
    inner.append(n1)
    # 汤罐（左下）
    inner.append(can(225, 900, 1.75, a=-12))
    # 拟声字（右上）
    inner.append(g([blk(d_burst(880, 190, 92, 60, 11, 0, 4), CYAN, 8, 4),
                    BAN(880, 212, 'WOW!', 58, WHITE, 6, 5, 'middle')], rot(880, 190, 10)))
    # 对话框（右下）
    inner.append(bubble(770, 905, 205, 98, 640, 1050, ['普通的东西，', '也能上墙。'], 38, 900, 10, 5))
    b.append(g(inner, extra=' clip-path="url(#panel)"'))
    b.append(f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" fill="none" stroke="{INK}" stroke-width="6"/>')
    # 底部三栏
    yb = 1150
    b.append(f'<rect x="{MX}" y="{yb}" width="{CW}" height="4" fill="{INK}"/>')
    cols = [
        [('POP ART', 28, 400, INK, FAM), ('网点 · 黑线 · 原色', 20, 900, INK, FAM_SC), ('1956—1970', 18, 500, GREY, FAM_MONO)],
        [('把超市、漫画和广告，', 20, 900, INK, FAM_SC), ('原样搬进美术馆，', 20, 900, INK, FAM_SC), ('再放大十倍。', 20, 900, RED, FAM_SC)],
        [('Design Style 风格 005', 20, 900, INK, FAM_SC), ('每天一个设计风格', 20, 400, INK, FAM_SC), ('@guanmo_ai', 20, 400, GREY, FAM_SC)],
    ]
    for k, lines in enumerate(cols):
        for i, (s, sz, wgt, fill, fam) in enumerate(lines):
            b.append(T(MX + k * 306, yb + 44 + i * 32, s, sz, wgt, fill, 0.03 if fam == FAM else 0.0, None, fam))
    b.append(ZH(MX + CW, H - 48, '致敬：利希滕斯坦的漫画、沃霍尔的汤罐 · 构图为重新创作', 14, 400, GREY, anchor='end'))
    return svg('poster', '海报', join(b), defs)


# ═════════════════════════════════════ 2 · 速查卡 ═════════════════════════════════════
SWATCH = [('新闻纸', PAPER), ('黑', INK), ('原色黄', YELLOW), ('原色红', RED), ('原色蓝', BLUE),
          ('本戴肤色', PINK), ('荧光粉', MAGENTA), ('漫画蓝', CYAN), ('白', WHITE)]
RULES = [('网点', 'DOTS', '用点的大小', '代替渐变和阴影'), ('黑线', 'OUTLINE', '粗黑轮廓线', '把每块颜色圈起来'),
         ('原色', 'PRIMARY', '红黄蓝 + 黑白', '平涂，不混色'), ('重复', 'REPEAT', '同一个东西', '排成方阵、换色'),
         ('拟声字', 'BANG!', '字要大声：', '爆炸框、对话框')]


def rule_icon(i, cx, cy):
    """五条规则的小图标（与视频卡片同一套）"""
    if i == 0:  # 一排由小到大的点
        return [f'<path d="{"".join(d_circ(cx - 44 + k * 18, cy, 1.5 + k * 1.6) for k in range(6))}" fill="{RED}"/>']
    if i == 1:  # 一颗心：平涂 + 粗黑线
        d = f'M{cx} {cy + 18}C{cx - 34} {cy - 4} {cx - 24} {cy - 26} {cx} {cy - 12}C{cx + 24} {cy - 26} {cx + 34} {cy - 4} {cx} {cy + 18}Z'
        return [blk(d, RED, 3, 4)]
    if i == 2:  # 三块原色
        return [blk(d_rc(cx - 26 + k * 26, cy, 22, 30), [RED, YELLOW, BLUE][k], 3, 3) for k in range(3)]
    if i == 3:  # 2×2 方阵
        return [blk(d_rc(cx - 11 + (k % 2) * 22, cy - 11 + (k // 2) * 22, 18, 18), [RED, YELLOW, MAGENTA, CYAN][k], 0, 2.5) for k in range(4)]
    return [blk(d_burst(cx, cy, 28, 17, 9, 0.1, 8), YELLOW, 3, 3), T(cx, cy + 6, 'BANG', 15, 400, RED, 0.02, 'middle')]


def cheatsheet():
    b = header('波普艺术', 'POP ART', '风格速查卡 · 1956—1970 · 伦敦 → 纽约 · 把大众文化搬进美术馆')

    # ── 01 网点 ──
    y = 236
    b += section(y, 1, '网点', 'BEN-DAY DOTS', RED)
    bx, by, bw, bh = MX, y + 18, CW, 150
    b.append(blk(d_rect(bx, by, bw, bh), WHITE, 6, 3))
    levels = [(0.18, '10%'), (0.3, '25%'), (0.42, '45%'), (0.52, '70%'), (0.62, '100%')]
    defs = []
    for k, (rr, lab) in enumerate(levels):
        x0 = bx + 30 + k * 132
        defs.append(f'\n    <clipPath id="lv{k}"><rect x="{x0}" y="{by + 18}" width="96" height="84"/></clipPath>')
        b.append(g([f'<rect x="{x0}" y="{by + 18}" width="96" height="84" fill="{WHITE}"/>',
                    f'<path d="{d_dots(x0 - 8, by + 10, 112, 100, 12, lambda x, y, rr=rr: rr * 12)}" fill="{RED}"/>'], extra=f' clip-path="url(#lv{k})"'))
        b.append(f'<rect x="{x0}" y="{by + 18}" width="96" height="84" fill="none" stroke="{INK}" stroke-width="3"/>')
        b.append(MONO(x0 + 48, by + 128, lab, 14, 600, INK, anchor='middle'))
    # 等式：红点 + 白纸 = 肤色
    ex = bx + 30 + 5 * 132 - 6
    b.append(f'<rect x="{ex}" y="{by + 18}" width="84" height="84" fill="url(#skin)" stroke="{INK}" stroke-width="3"/>')
    b.append(ZH(ex + 98, by + 72, '=', 34, 900, INK, anchor='middle'))
    b.append(f'<rect x="{ex + 112}" y="{by + 18}" width="84" height="84" fill="{PINK}" stroke="{INK}" stroke-width="3"/>')
    b.append(ZH(ex + 98, by + 128, '红点 + 白纸 = 肤色', 14, 900, INK, anchor='middle'))

    # ── 02 色板 ──
    y = 450
    b += section(y, 2, '色板', 'COLOR', YELLOW)
    sw = 88
    gap = (CW - 9 * sw) / 8
    for k, (zh, c) in enumerate(SWATCH):
        x = MX + k * (sw + gap)
        pat = 'skin' if c == PINK else None
        b.append(blk(d_rect(x, y + 22, sw, 76), c, 6, 3))
        if pat:
            b.append(f'<rect x="{x + sw / 2}" y="{y + 22}" width="{sw / 2}" height="76" fill="url(#skin)" stroke="{INK}" stroke-width="3"/>')
        b.append(ZH(x, y + 126, zh, 16, 900, INK))
        b.append(MONO(x, y + 146, c, 13, 500, GREY))
    b.append(ZH(MX, y + 176, '红黄蓝 + 黑白撑起整个画面，平涂、不混色；粉和青是丝网印刷的“错版色”；深浅一律用网点。', 15, 400, GREY))

    # ── 03 对话框 ──
    y = 664
    b += section(y, 3, '对话框与拟声字', 'BALLOONS', BLUE)
    items = [('说话', 'Speech'), ('想法', 'Thought'), ('旁白', 'Caption'), ('爆炸', 'Burst'), ('拟声字', 'SFX'), ('集中线', 'Speed')]
    for k, (zh, en) in enumerate(items):
        x = col(k)
        cx, cy = x + 67.5, y + 70
        defs.append(f'\n    <clipPath id="bl{k}"><rect x="{x}" y="{y + 22}" width="135" height="96"/></clipPath>')
        b.append(blk(d_rect(x, y + 22, 135, 96), [PAPER, CYAN, WHITE, YELLOW, BLUE, WHITE][k], 6, 3, pat=[None, 'dotCyan', None, 'dotRed', 'dotBlue', None][k], po=0.6))
        if k == 0:
            b.append(blk(d_bubble(cx + 4, cy - 6, 50, 26, cx - 30, cy + 38), WHITE, 0, 3))
            b.append(ZH(cx + 4, cy, '你好！', 16, 900, INK, anchor='middle'))
        elif k == 1:
            b.append(blk(d_cloud(cx + 6, cy - 8, 48, 26), WHITE, 0, 3))
            b.append(f'<circle cx="{cx - 34}" cy="{cy + 26}" r="7" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>')
            b.append(f'<circle cx="{cx - 46}" cy="{cy + 38}" r="4" fill="{WHITE}" stroke="{INK}" stroke-width="2.5"/>')
            b.append(ZH(cx + 6, cy - 2, '嗯……', 16, 900, INK, anchor='middle'))
        elif k == 2:
            b.append(blk(d_rect(x + 12, y + 34, 96, 30), YELLOW, 0, 3))
            b.append(ZH(x + 22, y + 55, '与此同时', 15, 900, INK))
            b.append(f'<path d="M{x + 30} {y + 92}h70M{x + 30} {y + 104}h50" stroke="{GREY}" stroke-width="4"/>')
        elif k == 3:
            b.append(blk(d_burst(cx, cy, 52, 32, 11, 0.1, 13, 1.15), RED, 4, 3))
            b.append(blk(d_burst(cx, cy, 34, 22, 11, 0.3, 3, 1.15), YELLOW, 0, 0))
        elif k == 4:
            b.append(BAN(cx, cy + 18, 'BANG!', 50, YELLOW, 5, 4, 'middle', 0.02))
        else:
            b.append(g([speed(cx, cy, 16, 90, 30, 3, INK, 4)], extra=f' clip-path="url(#bl{k})"'))
            b.append(f'<rect x="{x}" y="{y + 22}" width="135" height="96" fill="none" stroke="{INK}" stroke-width="3"/>')
        b.append(ZH(x, y + 146, zh, 16, 900, INK))
        b.append(T(x + zw(zh, 16, 900) + 6, y + 146, en, 15, 400, GREY, 0.04))
    b.append(ZH(MX, y + 176, '要读的字放进白色对话框或黄色旁白框；声音写成大字：BANG、POW、WHAM，放进爆炸框里。', 15, 400, GREY))

    # ── 04 字体 ──
    y = 878
    b += section(y, 4, '字体', 'TYPE', MAGENTA)
    b.append(BAN(MX + 4, y + 80, 'POW! WHAM!', 60, RED, 5, 5, ls=0.03))
    b.append(T(MX, y + 110, 'Bangers · 漫画拟声字，全大写', 14, 500, GREY, fam=FAM_SC))
    x2 = MX + 400
    b.append(ZH(x2, y + 76, '波普 放大', 46, 900, INK))
    b.append(ZH(x2, y + 110, '思源黑体 Black · 中文一律最粗', 14, 400, GREY))
    x3 = MX + 680
    nb, _ = narr(x3, y + 34, '1962 年', 20, YELLOW, 900, 12, 5, 3, h=40)
    b.append(nb)
    b.append(T(x3 + 120, y + 65, '¥12', 30, 400, BLUE, 0.03))
    b.append(T(x3, y + 110, '旁白 = 黄框 · 数字用 Bangers', 14, 500, GREY, fam=FAM_SC))

    # ── 05 五条规则 ──
    y = 1036
    b += section(y, 5, '五条规则', 'RULES', CYAN)
    cw5, gap5 = 168, 15
    for k, (zh, en, l1, l2) in enumerate(RULES):
        x = MX + k * (cw5 + gap5)
        c = PRIMARY[k]
        tc = WHITE if c in (RED, BLUE) else INK
        b.append(blk(d_rect(x, y + 20, cw5, 146), c, 6, 3))
        b.append(blk(d_rect(x + 10, y + 30, cw5 - 20, 52), WHITE, 0, 3))
        b += rule_icon(k, x + cw5 / 2, y + 56)
        b.append(ZH(x + 12, y + 110, zh, 20, 900, tc))
        b.append(T(x + 12 + zw(zh, 20, 900) + 6, y + 110, en, 17, 400, tc, 0.04))
        b.append(ZH(x + 12, y + 133, l1, 13, 700, tc))
        b.append(ZH(x + 12, y + 152, l2, 13, 700, tc))
    yy = y + 206
    nb, w1 = narr(MX, yy - 21, '这样做', 15, YELLOW, 900, 10, 3, 3, h=30)
    b.append(nb)
    b.append(ZH(MX + w1 + 14, yy, '平涂 · 粗黑线 · 网点 · 原色 · 放大', 15, 700, INK))
    nb, w2 = narr(MX + 500, yy - 21, '别这样', 15, WHITE, 900, 10, 3, 3, h=30)
    b.append(nb)
    b.append(ZH(MX + 500 + w2 + 14, yy, '渐变 · 柔和阴影 · 细线 · 灰调', 15, 700, GREY))
    b += footer()
    return svg('cheatsheet', '速查卡', join(b), ''.join(defs))


# ═════════════════════════════════════ 3 · 如果波普来做 app ═════════════════════════════════════
def phone(x, y, w=423, h=882, screen=PAPER):
    """手机外框：黑色机身 + 屏幕；返回 (元素, 屏幕内容左边, 右边, 顶)"""
    b = [f'<rect x="{x + 10}" y="{y + 10}" width="{w}" height="{h}" rx="56" fill="{INK}"/>',
         f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="56" fill="{INK}"/>',
         f'<rect x="{x + 11}" y="{y + 11}" width="{w - 22}" height="{h - 22}" rx="46" fill="{screen}"/>']
    return b, x + 32, x + w - 32, y + 78


def status(x, y, w, fill=INK):
    b = [f'<rect x="{x + w / 2 - 52}" y="{y + 24}" width="104" height="30" rx="15" fill="{INK}"/>',
         MONO(x + 44, y + 47, '9:41', 16, 700, fill)]
    rx = x + w - 44
    b += [f'<rect x="{rx - 24}" y="{y + 36}" width="22" height="11" rx="3" fill="none" stroke="{fill}" stroke-width="1.5"/>',
          f'<rect x="{rx - 22}" y="{y + 38}" width="15" height="7" rx="1.5" fill="{fill}"/>']
    for k in range(4):
        b.append(f'<rect x="{rx - 56 + k * 6}" y="{y + 43 - k * 2.5:.1f}" width="4" height="{4 + k * 2.5:.1f}" fill="{fill}"/>')
    return b


GOODS = [('番茄汤罐', '¥12', RED, 'dotMag', 'can'), ('地板汉堡', '¥25', YELLOW, 'dotRed', 'burger'),
         ('波普汽水', '¥6', BLUE, 'dotBlue', 'soda'), ('草莓甜筒', '¥9', MAGENTA, 'dotMag', 'cone')]


def app_ui():
    b = header('如果波普来做', 'APP', '六十年前的超市货架，今天的界面 · 一个便利店点单 app 的概念稿', 'ui concept no.05')
    py, pw, ph = 230, 423, 882
    defs = []

    # ── 屏一：货架 ──
    px = MX
    p1, x0, x1, top = phone(px, py)
    b += p1
    b.append(f'<rect x="{px + 11}" y="{py + 11}" width="{pw - 22}" height="{ph - 22}" rx="46" fill="url(#dotPaper)"/>')
    b += status(px, py, pw)
    b.append(ZH(x0, top + 40, '今天吃点啥？', 28, 900))
    b.append(ZH(x0, top + 68, '街角便利店 · 15 分钟送到', 15, 700, GREY))
    b.append(g([blk(d_burst(x1 - 40, top + 26, 42, 28, 10, 0, 6), YELLOW, 4, 3),
                T(x1 - 40, top + 34, 'NEW', 22, 400, RED, 0.03, 'middle')], rot(x1 - 40, top + 26, 12)))
    tw, th, gp = (x1 - x0 - 16) / 2, 214, 16
    gy = top + 96
    for k, (name, price, c, pat, kind) in enumerate(GOODS):
        tx = x0 + (k % 2) * (tw + gp)
        ty = gy + (k // 2) * (th + gp)
        b.append(blk(d_rect(tx, ty, tw, th), c, 6, 4, pat=pat, po=0.55))
        mx_, my_ = tx + tw / 2, ty + 84
        if kind == 'can':
            b.append(can(mx_, my_, 0.95, RED, WHITE, RED, '番茄', -6))
        elif kind == 'burger':
            b.append(burger(mx_, my_ + 6, 0.92))
        elif kind == 'soda':
            b.append(soda(mx_, my_, 0.8, RED))
        else:
            b.append(cone(mx_, my_ + 4, 0.88))
        b.append(blk(d_rect(tx + 10, ty + th - 52, tw - 20, 42), WHITE, 0, 3))
        b.append(ZH(tx + 20, ty + th - 24, name, 16, 900, INK))
        b.append(T(tx + tw - 20, ty + th - 22, price, 26, 400, RED, 0.02, 'end'))
    # 今日特价：一个对话框
    sy = gy + 2 * th + gp + 62
    b.append(bubble((x0 + x1) / 2 + 20, sy, 158, 34, x0 + 40, sy + 48, ['汤罐买二送一！'], 20, 900, 5, 3.5))
    # 购物车条 + 爆炸框按钮
    ny = py + ph - 72
    b.append(blk(d_rect(x0, ny - 30, x1 - x0, 60, 30), INK, 0, 0))
    b.append(ZH(x0 + 28, ny + 7, '购物车 · 3 件', 18, 900, WHITE))
    b.append(T(x0 + 178, ny + 9, '¥49', 26, 400, YELLOW, 0.02))
    bx = x1 - 62
    b.append(g([blk(d_burst(bx, ny, 72, 46, 12, 0.05, 31, 1.08), RED, 6, 4),
                ZBAN(bx, ny + 9, '下单！', 24, WHITE, 5, 0, 'middle')], rot(bx, ny, -6)))

    # ── 屏二：订单 = 三格漫画 ──
    px2 = MX + CW - pw
    p2, x0, x1, top = phone(px2, py, screen=YELLOW)
    b += p2
    b.append(f'<rect x="{px2 + 11}" y="{py + 11}" width="{pw - 22}" height="{ph - 22}" rx="46" fill="url(#dotRed)" opacity="0.5"/>')
    b += status(px2, py, pw)
    mx_ = (x0 + x1) / 2
    b.append(ZBAN(x0 + 2, top + 52, '下单成功！', 40, WHITE, 7, 5))
    b.append(g([blk(d_burst(x1 - 38, top + 30, 44, 28, 10, 0.2, 17), CYAN, 4, 3),
                ZBAN(x1 - 38, top + 39, '叮！', 22, WHITE, 4, 0, 'middle')], rot(x1 - 38, top + 30, -10)))
    panels = [('12:01 · 店员接单', WHITE, 'dotCyan'), ('12:04 · 骑手出发', BLUE, 'dotBlue'), ('12:15 · 敲门', WHITE, 'skin')]
    ph_, gp2 = 186, 14
    for k, (cap, c, pat) in enumerate(panels):
        yy = top + 86 + k * (ph_ + gp2)
        defs.append(f'\n    <clipPath id="pn{k}"><rect x="{x0}" y="{yy}" width="{x1 - x0}" height="{ph_}"/></clipPath>')
        inner = [f'<rect x="{x0}" y="{yy}" width="{x1 - x0}" height="{ph_}" fill="{c}"/>',
                 f'<rect x="{x0}" y="{yy}" width="{x1 - x0}" height="{ph_}" fill="url(#{pat})" opacity="{0.35 if pat == "skin" else 0.6}"/>']
        cxp, cyp = mx_, yy + ph_ / 2 + 14
        if k == 0:  # 货架上取两罐汤 + 一个汉堡
            inner.append(f'<rect x="{x0}" y="{yy + ph_ - 30}" width="{x1 - x0}" height="30" fill="{BUN}" stroke="{INK}" stroke-width="4"/>')
            inner.append(can(cxp - 118, yy + ph_ - 76, 0.68, RED, WHITE, RED, '番茄', 0))
            inner.append(can(cxp - 36, yy + ph_ - 76, 0.68, RED, WHITE, RED, '番茄', 0))
            inner.append(burger(cxp + 62, yy + ph_ - 66, 0.62))
            inner.append(g([blk(d_burst(cxp + 136, yy + 62, 40, 26, 10, 0, 2), YELLOW, 4, 3),
                            T(cxp + 136, yy + 70, 'OK!', 24, 400, RED, 0.02, 'middle')], rot(cxp + 136, yy + 62, 8)))
        elif k == 1:  # 纸袋 + 速度线 + ZOOM!
            inner.append(''.join(line(x0 + 20 + (j % 3) * 30, yy + 64 + j * 18, x0 + 150 + (j % 3) * 30, yy + 64 + j * 18, 5, WHITE) for j in range(6)))
            inner.append(blk(d_poly([(cxp - 6, yy + 56), (cxp + 84, yy + 56), (cxp + 92, yy + 166), (cxp - 14, yy + 166)]), BUN, 7, 4, tf=rot(cxp + 40, yy + 110, -6)))
            inner.append(g([f'<path d="M{f1(cxp + 14)} {yy + 56}Q{f1(cxp + 39)} {yy + 26} {f1(cxp + 64)} {yy + 56}" fill="none" stroke="{INK}" stroke-width="5"/>',
                            T(cxp + 39, yy + 128, 'POP', 30, 400, RED, 0.03, 'middle', extra=f' stroke="{INK}" stroke-width="3" paint-order="stroke"')], rot(cxp + 40, yy + 110, -6)))
            inner.append(BAN(x1 - 14, yy + ph_ - 22, 'ZOOM!', 46, YELLOW, 5, 4, 'end'))
        else:  # 门 + KNOCK!
            dx = x0 + 34
            inner.append(blk(d_rect(dx, yy + 44, 104, ph_), RED, 0, 4))
            inner.append(f'<rect x="{dx + 16}" y="{yy + 62}" width="72" height="52" fill="none" stroke="{INK}" stroke-width="3"/>')
            inner.append(f'<circle cx="{dx + 86}" cy="{yy + 140}" r="7" fill="{GOLD}" stroke="{INK}" stroke-width="3"/>')
            inner.append(g([BAN(dx + 120, yy + 92, 'KNOCK', 34, YELLOW, 4, 3), BAN(dx + 136, yy + 128, 'KNOCK!', 34, YELLOW, 4, 3)], rot(dx + 120, yy + 92, -8)))
            inner.append(bubble(x1 - 76, yy + ph_ - 48, 62, 28, x1 - 128, yy + ph_ - 6, ['到啦！'], 18, 900, 4, 3))
        b.append(g(inner, extra=f' clip-path="url(#pn{k})"'))
        b.append(f'<rect x="{x0}" y="{yy}" width="{x1 - x0}" height="{ph_}" fill="none" stroke="{INK}" stroke-width="4"/>')
        nb, _ = narr(x0 - 6, yy - 8, cap, 14, YELLOW if k < 2 else RED, 900, 8, 3, 3, h=26, color=INK if k < 2 else WHITE)
        b.append(nb)
    b.append(g([blk(d_rect(x0, py + ph - 100, x1 - x0, 56, 28), WHITE, 6, 4),
                ZH(mx_, py + ph - 64, '再来一单', 20, 900, INK, anchor='middle')]))

    # ── 注释 ──
    ay = py + ph + 50
    notes = [('商品 = 一格丝网', '每样东西一种原色底', '像沃霍尔一样排成一面墙'), ('按钮 = 爆炸框', '“下单”是一声 BANG!', '按下去，爆炸框弹一下'),
             ('进度 = 一页漫画', '订单状态画成三格漫画', '黄色旁白框写时间')]
    for k, (h1, h2, h3) in enumerate(notes):
        x = MX + k * 306
        c = [RED, YELLOW, BLUE][k]
        b.append(blk(d_rect(x, ay - 22, 28, 28), c, 3, 3))
        b.append(T(x + 14, ay, str(k + 1), 21, 400, WHITE if c != YELLOW else INK, anchor='middle'))
        b.append(ZH(x + 40, ay, h1, 18, 900, INK))
        b.append(ZH(x, ay + 32, h2, 15, 400, GREY))
        b.append(ZH(x, ay + 54, h3, 15, 400, GREY))
    b += footer()
    return svg('app-ui', 'App 概念稿', join(b), ''.join(defs))


# ═════════════════════════════════════ 4 · 四步改造 ═════════════════════════════════════
SW, SH = 435, 420


def mini(k):
    """同一张“周末市集”海报的四个版本（坐标是小图内部的，0..SW × 30..SH+30）"""
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
    if k == 1:  # 平涂 + 黑线：照片换成一只平涂的杯子，仍然居中、还是白底
        b.append(f'<rect width="{SW}" height="{SH + 60}" fill="{PAPER}"/>')
        b.append(blk(d_rect(cx - 150, 64, 300, 170), WHITE, 0, 4))
        b.append(cup(cx - 10, 160, 0.9, WHITE, RED, True, 4))
        b.append(ZH(cx, 296, '周末市集', 40, 900, INK, anchor='middle'))
        b.append(ZH(cx, 328, '3 月 16 日 · 中山公园', 16, 700, INK, anchor='middle'))
        b.append(ZH(cx, 352, '手作 · 咖啡 · 唱片 · 花', 14, 400, INK, anchor='middle'))
        b.append(blk(d_rect(cx - 70, 378, 140, 40), WHITE, 0, 4))
        b.append(ZH(cx, 404, '了解更多', 15, 900, INK, anchor='middle'))
        return b
    if k == 2:  # 原色 + 网点：底色换成红黄蓝，深浅用网点，加硬投影
        b.append(f'<rect width="{SW}" height="{SH + 60}" fill="{YELLOW}"/>')
        rf = lambda x, y: min(1.0, max(0.0, (y - 200) / 260)) * 12 * 0.62
        b.append(f'<path d="{d_dots(0, 30, SW, SH, 12, rf)}" fill="{RED}"/>')
        b.append(blk(d_rect(cx - 150, 64, 300, 170), BLUE, 7, 4, pat='dotWhite', po=0.35))
        b.append(cup(cx - 10, 160, 0.9, WHITE, RED, True, 4))
        b.append(blk(d_rect(cx - 124, 252, 248, 118), WHITE, 6, 4))
        b.append(ZH(cx, 298, '周末市集', 40, 900, INK, anchor='middle'))
        b.append(ZH(cx, 330, '3 月 16 日 · 中山公园', 16, 900, INK, anchor='middle'))
        b.append(ZH(cx, 354, '手作 · 咖啡 · 唱片 · 花', 14, 700, INK, anchor='middle'))
        b.append(blk(d_rect(cx - 70, 386, 140, 40), RED, 5, 4))
        b.append(ZH(cx, 412, '了解更多', 15, 900, WHITE, anchor='middle'))
        return b
    # k == 3：重复 + 拟声字：杯子排成四格（换色），标题放进爆炸框，再喊一声
    b.append(f'<rect width="{SW}" height="{SH + 60}" fill="{BLUE}"/>')
    b.append(f'<rect width="{SW}" height="{SH + 60}" fill="url(#dotBlue)"/>')
    sets = [(YELLOW, WHITE, RED), (MAGENTA, YELLOW, BLUE), (CYAN, WHITE, MAGENTA), (RED, YELLOW, INK)]
    for j, (bg, body, band) in enumerate(sets):
        x = 22 + (j % 2) * 124
        y = 46 + (j // 2) * 102
        b.append(blk(d_rect(x, y, 116, 94), bg, 5, 3.5))
        b.append(cup(x + 52, y + 54, 0.5, body, band, False, 5))
    b.append(g([blk(d_burst(352, 112, 74, 50, 11, 0.1, 41), YELLOW, 6, 4),
                BAN(352, 132, 'WOW!', 50, RED, 5, 4, 'middle')], rot(352, 112, 8)))
    b.append(g([blk(d_burst(cx, 318, 90, 68, 15, 0.05, 23, 2.05), RED, 8, 4),
                ZBAN(cx, 336, '周末市集', 50, WHITE, 7, 5, 'middle')], rot(cx, 318, -4)))
    b.append(bubble(352, 222, 56, 26, 318, 258, ['来逛！'], 18, 900, 4, 3.5))
    nb, wn = narr(24, 404, '3 月 16 日 · 中山公园', 14, YELLOW, 900, 9, 4, 3, h=26)
    b.append(nb)
    b.append(ZH(24 + wn + 12, 422, '手作 · 咖啡 · 唱片 · 花', 12, 900, WHITE))
    return b


def steps():
    b = header('四步改造', '', '同一张普通海报，每一步只改一件事 —— 改到第四步，它就开始“大声说话”了', 'how-to no.05')
    defs = ['\n    <linearGradient id="soft" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9D3E3"/><stop offset="1" stop-color="#9FB0CC"/></linearGradient>']
    caps = [('原稿', '居中、浅灰、圆角照片、柔和阴影', '哪儿都对，就是没人看'),
            ('平涂 + 黑线', '照片换成平涂的画，每块描一圈黑线', '像漫画书里的一格'),
            ('原色 + 网点', '底色换成红黄蓝，深浅用网点来做', '加上硬投影，颜色“印”上去了'),
            ('重复 + 拟声字', '杯子排成四格，标题放进爆炸框', '再喊一声，就成波普了')]
    for k in range(4):
        x = MX + (k % 2) * (SW + 30)
        y = 222 + (k // 2) * (SH + 96)
        defs.append(f'\n    <clipPath id="m{k}"><rect width="{SW}" height="{SH}"/></clipPath>')
        b.append(f'<path d="{d_rect(x, y, SW, SH)}" fill="{INK}" transform="translate(8 8)"/>')
        b.append(f'<g transform="translate({x} {y})"><g clip-path="url(#m{k})">')
        b.append('  ' + g(mini(k), 'translate(0 -30)'))
        b.append('</g></g>')
        b.append(f'<path d="{d_rect(x, y, SW, SH)}" fill="none" stroke="{INK}" stroke-width="4"/>')
        cy = y + SH + 40
        n, l1, l2 = caps[k]
        c = [WHITE, RED, YELLOW, BLUE][k]
        b.append(blk(d_rect(x, cy - 24, 32, 32), c, 3, 3))
        b.append(T(x + 16, cy + 1, f'{k + 1:02d}', 20, 400, WHITE if c in (RED, BLUE) else INK, 0.03, 'middle'))
        b.append(ZH(x + 44, cy, n, 20, 900, INK))
        b.append(ZH(x + 44 + zw(n, 20, 900) + 12, cy, l1, 14, 700, INK))
        b.append(ZH(x + 44 + zw(n, 20, 900) + 12, cy + 22, l2, 14, 400, GREY))
        if k % 2 == 0:  # 两张之间一个小爆炸框当箭头
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
