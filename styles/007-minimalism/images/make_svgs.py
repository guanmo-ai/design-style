"""
风格 007 · 极简主义 Minimalism —— 四张风格图（1080×1350）的生成脚本

四张图共用一套很少的规则（与 tokens.json 的 images 一致）：
  边距左右 96、上下 112；一条地平线 y = 675（海报把它放低到 1030，让上面的空间更大）；
  线只有两种粗细 1.5 / 1；颜色只有暖纸白、灰、墨，外加信号橙 —— 每一个画面（一屏、一张小图）只有一处是橙色的。
  大字用 Inter Display 的 100 / 200 / 300，中文用思源黑体 Light，注释用 Geist Mono；没有投影、没有渐变。

  poster.svg      一张海报：48 格虚线圆，删掉 47 个，剩下一个落到地平线上变成橙点（视频第 02 章的静态版）
  cheatsheet.svg  速查卡：色板（按面积）、字体、版式参数、五条规则、这样做 / 别这样
  app-ui.svg      如果极简主义来做 app：一个闹钟的两屏概念稿（列表 / 响铃）
  eras.svg        四个年代，同一个动作：删 —— 1929 德国馆 / 1958 收音机 / 1967 贾德 / 2013 扁平界面，几何与视频同源

生成的 SVG 是普通可读的源文件，可以直接改；改完再跑 scripts/build_images.py 内嵌字体、导出 PNG。
用法：python3 styles/007-minimalism/images/make_svgs.py
"""
import math
import os
from xml.sax.saxutils import escape

from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
W, H = 1080, 1350
MX, MY = 96, 112
CW = W - 2 * MX  # 888

# 颜色（与 tokens.ts 一致）
PAPER, PAPER_HI, SHADE, STONE = '#EFECE6', '#F6F4EF', '#E3DFD8', '#CFCAC1'
GREY, GREY_DK, INK, ACCENT = '#8F8C86', '#5F5C57', '#1C1B19', '#F27A1A'
HAIR = 'rgba(28,27,25,0.16)'
GHOST = 'rgba(28,27,25,0.28)'

DISP = "'Inter Display', 'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif"
TEXT = "'Inter', 'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif"
MONO = "'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace"
SC = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"

# ── 字体度量：从真实字体读字宽，居中 / 右齐 / 接排都按它算 ──
_FILES = {
    ('d', 100): 'InterDisplay-Thin.ttf', ('d', 200): 'InterDisplay-ExtraLight.ttf', ('d', 300): 'InterDisplay-Light.ttf',
    ('t', 300): 'Inter-Light.ttf', ('t', 400): 'Inter-Regular.ttf', ('t', 500): 'Inter-Medium.ttf',
    ('m', 400): 'GeistMono-Regular.ttf', ('s', 300): 'NotoSansSC-Light.otf', ('s', 400): 'NotoSansSC-Regular.otf',
    ('s', 500): 'NotoSansSC-Medium.otf',
}
_FONTS = {}


def _font(kind, weight):
    key = (kind, weight)
    if key not in _FONTS:
        f = TTFont(os.path.join(ROOT, 'public', 'fonts', _FILES[key]))
        _FONTS[key] = (f.getBestCmap(), f['hmtx'], f['head'].unitsPerEm)
    return _FONTS[key]


def width(s, size, kind='t', weight=400, ls=0.0):
    """字符串的步进宽度（不含最后一个字的字距）；字体里没有的字（汉字）按 1em 计"""
    cmap, hm, upm = _font(kind, weight)
    w = sum(hm[cmap[ord(ch)]][0] / upm if ord(ch) in cmap else 1.0 for ch in s)
    return (w + ls * (len(s) - 1)) * size


def lsb(ch, size, kind='d', weight=200):
    cmap, hm, upm = _font(kind, weight)
    return hm[cmap[ord(ch)]][1] * size / upm


FAMS = {'d': DISP, 't': TEXT, 'm': MONO, 's': SC}


def T(x, y, s, size, kind='t', weight=400, fill=INK, ls=0.0, anchor=None, extra=''):
    """一行字：y 是基线；ls 是字距（em）。右齐 / 居中时把最后一个字的字距扣掉，让字面真正对齐"""
    if anchor == 'end' and ls:
        x += ls * size
    elif anchor == 'middle' and ls:
        x += ls * size / 2
    a = f' text-anchor="{anchor}"' if anchor else ''
    l = f' letter-spacing="{ls * size:.2f}"' if ls else ''
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{FAMS[kind]}" font-weight="{weight}" font-size="{size}"'
            f'{l}{a} fill="{fill}"{extra}>{escape(s)}</text>')


def ZH(x, y, s, size, weight=300, fill=INK, ls=0.0, anchor=None):
    return T(x, y, s, size, 's', weight, fill, ls, anchor)


def NOTE(x, y, s, fill=GREY, anchor=None, size=13):
    """注释：Geist Mono、全大写、字距 0.12em"""
    return T(x, y, s, size, 'm', 400, fill, 0.12, anchor)


def line(x1, y1, x2, y2, stroke=INK, sw=1, extra=''):
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{stroke}" stroke-width="{sw}"{extra}/>'


def rect(x, y, w, h, fill='none', stroke=None, sw=1, rx=0, extra=''):
    s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ''
    r = f' rx="{rx}"' if rx else ''
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}"{r} fill="{fill}"{s}{extra}/>'


def circle(x, y, r, fill='none', stroke=None, sw=1, extra=''):
    s = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ''
    return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{fill}"{s}{extra}/>'


def poly(pts, fill='none', stroke=None, sw=1, extra=''):
    s = f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"' if stroke else ''
    d = ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts)
    return f'<polygon points="{d}" fill="{fill}"{s}{extra}/>'


def svg(title, body, defs=''):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">\n'
            f'  <!-- Design Style · 风格 007 · 极简主义 Minimalism —— {title} / 1080×1350（由 make_svgs.py 生成） -->\n'
            f'  <defs>{defs}\n  </defs>\n'
            f'  <rect width="{W}" height="{H}" fill="{PAPER}"/>\n'
            + '\n'.join('  ' + x for x in body) + '\n</svg>\n')


# ═════════════════════════════════════ 共用：页眉 / 页脚 / 小节标题 ═════════════════════════════════════
def corners(left='DESIGN STYLE · 007', right='1929 — TODAY', y=72):
    return [NOTE(MX, y, left), NOTE(W - MX, y, right, anchor='end')]


def header(zh, en, sub, tag):
    """页眉：中文 Light + 拉丁 ExtraLight 同一条基线；右边期号；下面一根发丝线"""
    base = MY + 44
    b = [ZH(MX, base, zh, 52, 300)]
    if en:
        b.append(T(MX + width(zh, 52, 's', 300) + 18, base, en, 52, 'd', 200, INK, -0.01))
    b.append(ZH(MX, base + 44, sub, 18, 300, GREY_DK))
    b.append(NOTE(W - MX, base + 44, tag, anchor='end'))
    b.append(line(MX, base + 72, W - MX, base + 72, INK, 1))
    return b


def footer(y=H - 64):
    return [line(MX, y - 34, W - MX, y - 34, HAIR, 1),
            T(MX, y, 'Design Style 风格 007', 14, 't', 500, INK),
            T(W / 2, y, '@guanmo_ai', 14, 't', 400, INK, anchor='middle'),
            NOTE(W - MX, y, 'GITHUB.COM/GUANMO-AI/DESIGN-STYLE', anchor='end', size=12)]


def section(y, n, zh, en):
    """小节标题：灰色编号 + 中文 + 英文；y 是基线"""
    return [NOTE(MX, y, f'{n:02d}'),
            ZH(MX + 44, y, zh, 22, 400, INK),
            T(MX + 44 + width(zh, 22, 's', 400) + 12, y, en, 15, 't', 300, GREY)]


# ═════════════════════════════════════ 1 · 海报 ═════════════════════════════════════
GRID_X0, GRID_Y0, PITCH, GR = 620, 430, 68, 20
MISSING = (4, 6)
HORIZON = 1040


def poster():
    """
    印刷感定妆：左边一句原则 + 47 / 1，右边 6×8 虚线圆删掉一格落到地平线。
    可当海报钉在墙上。和片中 19.6–21.4s 定妆同一构图。
    """
    b = corners()
    b.append(ZH(MX, 268, '少', 210, 300, INK))
    b.append(ZH(MX, 348, '= 删到只剩有用的', 36, 300, INK, 0.04))
    b.append(T(MX, 390, 'Less, but better.', 26, 'd', 200, GREY_DK, -0.01))
    b.append(NOTE(W - MX, 348, 'WENIGER, ABER BESSER', anchor='end'))

    struck = [('促销字', True), ('第二色', True), ('重复入口', True), ('装饰', True), ('有用的', False)]
    y0 = 460
    for i, (lab, dead) in enumerate(struck):
        yy = y0 + i * 44
        col = GREY if dead else ACCENT
        b.append(NOTE(MX, yy, f'{i + 1:02d}', col if not dead else GREY))
        b.append(ZH(MX + 40, yy, lab, 22, 400 if not dead else 300, col))
        if dead:
            w = width(lab, 22, 's', 300)
            b.append(line(MX + 38, yy - 7, MX + 42 + w, yy - 7, GREY, 1))

    for j in range(8):
        for i in range(6):
            if (i, j) == MISSING:
                continue
            b.append(circle(GRID_X0 + i * PITCH, GRID_Y0 + j * PITCH, GR, 'none', GHOST, 1,
                            ' stroke-dasharray="2.5 3.5"'))
    mx, my = GRID_X0 + MISSING[0] * PITCH, GRID_Y0 + MISSING[1] * PITCH
    b.append(circle(mx, my, GR, 'none', ACCENT, 1, ' stroke-dasharray="1 5" stroke-linecap="round" opacity="0.7"'))
    b.append(line(mx, my + GR + 8, mx, HORIZON - 28, GREY, 1, ' stroke-dasharray="1 6" stroke-linecap="round"'))

    b.append(T(MX - lsb('4', 120, 'd', 100), 860, '47', 120, 'd', 100, INK, -0.02))
    b.append(ZH(MX + 200, 820, '样东西，删掉了', 18, 300, INK))
    b.append(NOTE(MX + 200, 848, 'REMOVED'))
    b.append(T(MX - lsb('1', 120, 'd', 100), HORIZON - 16, '1', 120, 'd', 100, INK))
    b.append(ZH(MX + 90, HORIZON - 40, '个留下：', 18, 300, INK))
    b.append(ZH(MX + 90, HORIZON - 14, '有用的那一个', 18, 300, INK))

    b.append(line(MX, HORIZON, W - MX, HORIZON, INK, 1.5))
    b.append(circle(mx, HORIZON, 16, ACCENT))
    b.append(NOTE(mx, HORIZON + 40, 'ONE LEFT', anchor='middle'))

    y = 1226
    b.append(line(MX, y - 36, W - MX, y - 36, HAIR, 1))
    b.append(T(MX, y, 'Minimalism', 18, 't', 500, INK))
    b.append(ZH(MX, y + 28, '极简主义 · 007', 16, 300, GREY_DK))
    b.append(T(W / 2, y, '@guanmo_ai', 18, 't', 400, INK, anchor='middle'))
    b.append(NOTE(W - MX, y, 'DESIGN STYLE', anchor='end'))
    b.append(T(W - MX, y + 28, 'Weniger, aber besser.', 14, 't', 300, GREY, anchor='end'))
    return svg('海报', b)


# ═════════════════════════════════════ 小图标：五条规则 ═════════════════════════════════════
def icon(kind, x, y, s=64):
    """64 × 64 的发丝线小图：每条规则一个；只有“一处强调”那张用橙"""
    b = []
    if kind == 'space':  # 负空间：一个大框，角落一个点
        b.append(rect(x + 0.5, y + 0.5, s - 1, s - 1, 'none', INK, 1))
        b.append(circle(x + s * 0.72, y + s * 0.72, 3.5, INK))
    elif kind == 'subtract':  # 删减：一排四个圆，只剩一个实心
        for i in range(4):
            cx = x + s * 0.12 + i * s * 0.25
            b.append(circle(cx, y + s / 2, s * 0.09, INK if i == 3 else 'none', None if i == 3 else GREY, 1,
                            '' if i == 3 else ' stroke-dasharray="1.5 1.5"'))
    elif kind == 'function':  # 功能：一个旋钮，刻度只画一道
        b.append(circle(x + s / 2, y + s / 2, s * 0.36, 'none', INK, 1))
        a = math.radians(-50)
        b.append(line(x + s / 2, y + s / 2, x + s / 2 + math.sin(a) * s * 0.26, y + s / 2 - math.cos(a) * s * 0.26, INK, 1.5))
        b.append(line(x + s / 2, y + 2, x + s / 2, y + 7, INK, 1))
    elif kind == 'repeat':  # 重复：四个一样的盒子，盒高 = 间距
        for i in range(4):
            b.append(rect(x + s * 0.2, y + s * 0.06 + i * s * 0.25, s * 0.6, s * 0.125, INK))
    else:  # 一处强调：九个灰点，一个橙点
        for i in range(3):
            for j in range(3):
                b.append(circle(x + s * 0.18 + i * s * 0.32, y + s * 0.18 + j * s * 0.32, s * 0.07,
                                ACCENT if (i, j) == (2, 2) else STONE))
    return b


# ═════════════════════════════════════ 2 · 速查卡 ═════════════════════════════════════
def cheatsheet():
    b = header('极简主义', 'Minimalism', '八句原则 · 少 = 删到只剩有用的', 'DESIGN STYLE NO.07')

    # ── 01 全片八句 ──
    y = 262
    b += section(y, 1, '全片八句', 'The film, one sentence each')
    lines = [
        ('01', '堆满', '先看见多余的，才知道要删什么。', 'SEE THE EXCESS FIRST'),
        ('02', '一次删一个', '每删一下，必须说清为什么。', 'CUT WITH A REASON'),
        ('03', '留下骨架', '删完之后，网格、字重、留白才露出来。', 'THE SKELETON APPEARS'),
        ('04', 'App', '同一条原则：列表删成一行、一主按钮。', 'ONE ROW, ONE CONTROL'),
        ('05', 'Web', '同一条原则：一栏标题、一个 CTA。', 'ONE COLUMN, ONE CTA'),
        ('06', '确认', '同一条原则：一金额、一按钮。', 'ONE AMOUNT, ONE BUTTON'),
        ('07', '坏例对照', '花哨无焦点，极简有焦点。', 'FOCUS VERSUS NOISE'),
        ('08', '定妆', '少 = 删到只剩有用的。', 'LESS, BUT BETTER'),
    ]
    colw = CW / 2
    for i, (n, zh, sentence, en) in enumerate(lines):
        x = MX + (i % 2) * colw
        yy = y + 36 + (i // 2) * 88
        b.append(NOTE(x, yy, n, ACCENT if i == 7 else GREY_DK))
        b.append(ZH(x + 40, yy, zh, 18, 400, INK))
        b.append(ZH(x, yy + 28, sentence, 16, 300, INK))
        b.append(NOTE(x, yy + 52, en, GREY, size=11))
        if i >= 2:
            b.append(line(x, yy - 16, x + colw - 24, yy - 16, HAIR, 1))

    # ── 02 色板：按面积画 ──
    y = 690
    b += section(y, 2, '色板', 'Colour')
    sw = [('暖纸白', PAPER, '239 236 230', 80.0), ('中性灰', GREY, '143 140 134', 12.0),
          ('墨', INK, '28 27 25', 7.5), ('信号橙', ACCENT, '242 122 26', 0.5)]
    bx, by, bh = MX, y + 24, 96
    acc = 0
    for name, hx, rgb, area in sw:
        w = CW * area / 100
        b.append(rect(bx + acc, by, w, bh, hx))
        acc += w
    b.append(rect(bx + 0.5, by + 0.5, CW - 1, bh - 1, 'none', INK, 1))
    # 橙色只有 0.5%：画一根引线把它拎出来
    ox = bx + CW - CW * 0.005 / 2
    b.append(line(ox, by + bh, ox, by + bh + 22, ACCENT, 1))
    b.append(NOTE(ox, by + bh + 40, '0.5% · ONLY ONE THING', ACCENT, anchor='end', size=12))
    b.append(NOTE(bx + 16, by + 30, 'AREA 80%', GREY_DK, size=12))
    b.append(ZH(bx + 16, by + bh - 18, '纸白是主角：空间本身就是材料', 15, 300, GREY_DK))
    for i, (name, hx, rgb, area) in enumerate(sw):
        x = MX + i * 222
        yy = by + bh + 64
        b.append(circle(x + 9, yy - 6, 9, hx, INK if hx == PAPER else None, 1))
        b.append(ZH(x + 28, yy, name, 17, 400, INK))
        b.append(T(x + 28, yy + 22, hx, 14, 'm', 400, INK))
        b.append(T(x + 28, yy + 40, f'{rgb} · {area:g}%', 12, 'm', 400, GREY))
    # 辅助色：纸的明面、阴面、石色、深灰
    yy = by + bh + 134
    b.append(NOTE(MX, yy, 'TONES'))
    for i, (name, hx) in enumerate([('亮面', PAPER_HI), ('阴面', SHADE), ('石色', STONE), ('深灰', GREY_DK)]):
        x = MX + 96 + i * 198
        b.append(rect(x, yy - 14, 28, 18, hx, INK if hx == PAPER_HI else None, 1))
        b.append(ZH(x + 38, yy, name, 14, 300, INK))
        b.append(T(x + 38 + width(name, 14, 's', 300) + 8, yy, hx, 12, 'm', 400, GREY))

    # ── 03 字体 + 版式（压成一条，给八句留位）──
    y = 980
    b += section(y, 3, '字重 / 版式', 'Type · Layout')
    S = 72
    base = y + 78
    b.append(T(MX - lsb('A', S, 'd', 100), base, 'Aa', S, 'd', 100, INK))
    ax = MX + width('Aa', S, 'd', 100) + 8
    b.append(T(ax, base, 'Aa', S, 'd', 300, INK))
    ax2 = ax + width('Aa', S, 'd', 300) + 8
    b.append(T(ax2, base, 'Aa', 22, 't', 500, INK))
    b.append(NOTE(MX, base + 28, '100 / 300 / 500'))
    b.append(ZH(MX + 320, base - 8, '越大越细 · 颜色只标一件事', 16, 300, INK))
    b.append(NOTE(MX + 320, base + 20, 'MARGIN 120/96 · HORIZON 540 · LINE 1.5/1 · DOT 16'))
    b.append(ZH(MX + 320, base + 48, '间距 8 · 16 · 32 · 64 · 128。空也是内容。', 14, 300, GREY_DK))
    b += footer()
    return svg('速查卡', b)


# ═════════════════════════════════════ 3 · 如果极简主义来做 app ═════════════════════════════════════
PW, PH = 380, 780


def phone(x, y):
    """手机：墨色机身 + 纸白屏幕，除了状态栏什么都不加；返回 (元素, 内容左, 内容右, 内容顶)"""
    b = [rect(x, y, PW, PH, INK, rx=64),
         rect(x + 12, y + 12, PW - 24, PH - 24, PAPER_HI, rx=52),
         rect(x + PW / 2 - 46, y + 26, 92, 28, INK, rx=14),
         T(x + 46, y + 47, '9:41', 15, 't', 500, INK)]
    rx = x + PW - 46
    b.append(rect(rx - 24, y + 36, 22, 11, 'none', INK, 1.2, rx=3))
    b.append(rect(rx - 22, y + 38, 14, 7, INK, rx=1.5))
    return b, x + 42, x + PW - 42, y + 96


def toggle(x, y, on=True):
    """开关：64 × 36；开着的时候，钮是这一屏唯一的橙"""
    b = [rect(x, y, 64, 36, INK if on else STONE, rx=18)]
    b.append(circle(x + (46 if on else 18), y + 18, 13, ACCENT if on else PAPER_HI))
    return b


def marker(x0, y, n, mx):
    """引线：从界面上的一点水平拉到两屏之间的空白，末端一个编号圈；注释统一写在下面"""
    side = 1 if mx > x0 else -1
    return [circle(x0, y, 3.5, PAPER_HI, INK, 1),
            line(x0 + side * 3.5, y, mx - side * 13, y, INK, 1),
            circle(mx, y, 13, PAPER, INK, 1),
            T(mx, y + 4, f'{n}', 12, 'm', 400, INK, anchor='middle')]


def app_ui():
    b = header('同一条原则进', 'app', '列表删成一行、一主按钮 · 左边是删之前', 'UI CONCEPT NO.07')
    py = 256
    mid = W / 2
    # ── 屏一：堆满的列表（坏例）──
    p1x = MX
    p1, x0, x1, top = phone(p1x, py)
    b += p1
    b.append(ZH(x0, top + 28, '闹钟', 26, 400, INK))
    extras = [('06:30', '智能推荐'), ('07:30', '周末'), ('08:15', '每日站会'), ('22:00', '助眠白噪')]
    for i, (t, sub) in enumerate(extras):
        yy = top + 90 + i * 86
        b.append(T(x0, yy + 28, t, 36, 'd', 200, GREY))
        b.append(ZH(x0, yy + 52, sub, 13, 300, GREY))
        b.append(rect(x1 - 56, yy + 8, 52, 28, STONE, rx=14))
        b.append(line(x0, yy + 68, x1, yy + 68, HAIR, 1))
    b.append(rect(x0, top + 450, 80, 28, '#C23B2E', rx=14))
    b.append(ZH(x0 + 40, top + 470, 'NEW', 12, 400, PAPER, anchor='middle'))
    for i, lab in enumerate(['闹钟', '世界钟', '秒表', '计时']):
        b.append(ZH(x0 + i * 72, py + PH - 48, lab, 12, 300, GREY if i else INK))
    b.append(NOTE(p1x + PW / 2, py + PH + 34, 'BEFORE · NOISE', anchor='middle', size=11))

    # ── 屏二：删成一行、一主按钮 ──
    p2x = W - MX - PW
    p2, x0, x1, top = phone(p2x, py)
    b += p2
    c2 = p2x + PW / 2
    b.append(ZH(x0, top + 28, '闹钟', 30, 300, INK))
    y = top + 200
    b.append(line(x0, y - 74, x1, y - 74, HAIR, 1))
    b.append(T(x0 - lsb('0', 84, 'd', 100), y + 22, '07:00', 84, 'd', 100, INK, -0.01))
    b.append(ZH(x0, y + 58, '工作日 · 起床', 15, 300, GREY_DK))
    knob = (x1 - 18, y + 12)
    b += toggle(x1 - 64, y - 6)
    b.append(line(x0, y + 94, x1, y + 94, HAIR, 1))
    plus = (p2x + PW / 2, py + PH - 100)
    b.append(circle(*plus, 28, 'none', INK, 1))
    b.append(line(plus[0] - 9, plus[1], plus[0] + 9, plus[1], INK, 1.5))
    b.append(line(plus[0], plus[1] - 9, plus[0], plus[1] + 9, INK, 1.5))
    b.append(NOTE(c2, py + PH + 34, 'AFTER · ONE ROW', anchor='middle', size=11))

    b += marker(x0 + 20, y - 20, 1, mid)
    b += marker(knob[0], knob[1], 2, mid)
    b += marker(plus[0] + 28, plus[1], 3, mid)

    notes = [('一行', '列表只留此刻'), ('一处颜色', '橙色只给“开着”'),
             ('一个入口', '新建只留一个“加”'), ('删掉的', '推荐、标签、第二色、第二按钮')]
    y = 1110
    colw = CW / 4
    for i, (lab, sub) in enumerate(notes):
        x = MX + i * colw
        b.append(circle(x + 13, y - 6, 13, PAPER, INK, 1))
        b.append(T(x + 13, y - 2, f'{i + 1}', 12, 'm', 400, INK, anchor='middle'))
        b.append(ZH(x + 36, y, lab, 16, 400, INK))
        b.append(ZH(x, y + 30, sub, 13, 300, GREY_DK))

    y = 1196
    b.append(NOTE(MX, y, 'REMOVED'))
    gone = ['智能推荐', '标签页', 'NEW 徽章', '全部关闭', '第二种强调色', '周末闹钟', '助眠白噪']
    x = MX + 92
    for g in gone:
        w = width(g, 14, 's', 300)
        b.append(ZH(x, y, g, 14, 300, GREY))
        b.append(line(x - 2, y - 5, x + w + 2, y - 5, GREY, 1))
        x += w + 20
    b += footer()
    return svg('如果极简主义来做 app', b)


# ═════════════════════════════════════ 4 · 四个年代，同一个动作：删 ═════════════════════════════════════
def era_pavilion(ox, oy, s):
    """1929 · 巴塞罗那德国馆平面（与视频 space.tsx 同一组坐标，单位 U）"""
    U = lambda u: u * s
    walls = [((4, 6), (16, 6)), ((10, 1), (28, 1)), ((24, 7.5), (31, 7.5)), ((34.5, 3.5), (34.5, 9)),
             ((36, 12.5), (45, 12.5)), ((42, 1), (49, 1)), ((49, 1), (49, 9)), ((42, 1), (42, 7))]
    cols = [(x, y) for x in (22.5, 27.5, 32.5, 37.5) for y in (5, 10)]
    b = [rect(ox, oy, U(50), U(16), SHADE, INK, 1)]
    for x1, y1, x2, y2 in [(2, 8, 17, 15), (43, 2.2, 48.4, 8.2)]:
        b.append(rect(ox + U(x1), oy + U(y1), U(x2 - x1), U(y2 - y1), STONE))
    b.append(rect(ox + U(20), oy + U(2.5), U(20), U(10), 'none', GREY, 0.75, extra=' stroke-dasharray="3 3"'))
    for (ax, ay), (bx, by) in walls:
        b.append(line(ox + U(ax), oy + U(ay), ox + U(bx), oy + U(by), INK, 3.2, ' stroke-linecap="square"'))
    for x, y in cols:
        cx, cy = ox + U(x), oy + U(y)
        b.append(line(cx - 3, cy, cx + 3, cy, INK, 1.2))
        b.append(line(cx, cy - 3, cx, cy + 3, INK, 1.2))
    b.append(circle(ox + U(41), oy + U(14.4), 5.5, ACCENT))
    return b


def era_radio(ox, oy, s):
    """1958 · 致敬博朗的收音机：一块孔板 + 一个旋钮（与视频 radio.tsx 同一组尺寸）"""
    X = lambda v: ox + (v - 520) * s
    Y = lambda v: oy + (v - 330) * s
    b = [rect(X(520), Y(330), 720 * s, 420 * s, PAPER_HI, INK, 1.2, rx=28 * s)]
    for j in range(7):
        for i in range(11):
            b.append(circle(X(596 + i * 36), Y(432 + j * 36), 6.5 * s, INK))
    b.append(circle(X(1112), Y(540), 100 * s, SHADE, INK, 1.2))
    a = math.radians(35)
    b.append(circle(X(1112) + math.sin(a) * 64 * s, Y(540) - math.cos(a) * 64 * s, 12 * s * 1.3, ACCENT))
    return b


def era_judd(ox, oy, s, n=6):
    """1967 · 贾德的墙上堆叠：同样的盒子，盒高 = 间距；一点透视画出底面"""
    b = [line(ox - 70 * s, oy, ox + 250 * s, oy, GREY, 1, ' stroke-dasharray="2 4"')]
    uw, uh = 180 * s, 40 * s
    vx, vy = ox + uw / 2, oy - 2 * n * uh + 60 * s
    for i in range(n):
        y = oy - uh - i * 2 * uh
        # 底面（看得见：灭点在上方）
        k = 0.12
        fl, fr = (ox, y + uh), (ox + uw, y + uh)
        bl = (fl[0] + (vx - fl[0]) * k, fl[1] + (vy - fl[1]) * k)
        br = (fr[0] + (vx - fr[0]) * k, fr[1] + (vy - fr[1]) * k)
        b.append(poly([fl, fr, br, bl], STONE, INK, 0.75))
        b.append(rect(ox, y, uw, uh, INK))
    b.append(circle(ox + uw / 2, oy - uh - (n - 1) * 2 * uh - 7, 7, ACCENT))
    return b


def era_phone(ox, oy, s):
    """2013 · 扁平界面：手机 + 一行闹钟 + 一个开关"""
    w, h = PW * s, PH * s
    b = [rect(ox, oy, w, h, INK, rx=64 * s), rect(ox + 12 * s, oy + 12 * s, w - 24 * s, h - 24 * s, PAPER_HI, rx=52 * s)]
    b.append(rect(ox + w / 2 - 48 * s, oy + 26 * s, 96 * s, 28 * s, INK, rx=14 * s))
    y = oy + 300 * s
    b.append(T(ox + 44 * s, y, '07:00', 88 * s, 'd', 100, INK))
    b.append(rect(ox + w - 44 * s - 64 * s, y - 50 * s, 64 * s, 36 * s, INK, rx=18 * s))
    b.append(circle(ox + w - 44 * s - 18 * s, y - 32 * s, 13 * s, ACCENT))
    return b


def eras():
    b = header('四个年代，同一个动作：删', '', '1929 — 2013 · 建筑、工业设计、艺术、界面 —— 每次都删到只剩一样', 'TIMELINE NO.07')
    top, rh = 252, 222
    rows = [
        ('1929', '巴塞罗那德国馆', 'Barcelona Pavilion', '密斯 · 凡 · 德 · 罗', '八面墙，', '其余全是空间。', 'NEGATIVE SPACE'),
        ('1958', '一台收音机', 'After Braun', '迪特 · 拉姆斯', '删到只剩', '一个旋钮。', 'AS LITTLE DESIGN AS POSSIBLE'),
        ('1967', '堆叠', 'Stack', '唐纳德 · 贾德', '同一个盒子，', '盒高 = 间距。', 'REPETITION'),
        ('2013', '扁平界面', 'Flat UI', '今天的手机', '一个屏幕，', '只做一件事。', 'ONE SCREEN, ONE JOB'),
    ]
    dx, dw = 330, 380  # 图都在同一个 380 宽的框里，水平居中
    for i, (yr, zh, en, who, say1, say2, tag) in enumerate(rows):
        y0 = top + i * rh
        if i:
            b.append(line(MX, y0, W - MX, y0, HAIR, 1))
        b.append(T(MX - lsb('1', 64, 'd', 100), y0 + 82, yr, 64, 'd', 100, INK))
        b.append(ZH(MX, y0 + 120, zh, 18, 400, INK))
        b.append(T(MX, y0 + 144, en, 14, 't', 300, GREY_DK))
        b.append(ZH(MX, y0 + 168, who, 14, 300, GREY))
        b.append(ZH(W - MX, y0 + 82, say1, 18, 300, INK, anchor='end'))
        b.append(ZH(W - MX, y0 + 110, say2, 18, 300, INK, anchor='end'))
        b.append(NOTE(W - MX, y0 + 168, tag, anchor='end', size=11))
        if i == 0:
            s = 7.6
            b += era_pavilion(dx + (dw - 50 * s) / 2, y0 + 46, s)
        elif i == 1:
            s = 0.4
            b += era_radio(dx + (dw - 720 * s) / 2, y0 + 26, s)
        elif i == 2:
            s = 0.52
            b += era_judd(dx + (dw - 180 * s) / 2, y0 + 196, s, 4)
        else:
            s = 0.205
            b += era_phone(dx + (dw - PW * s) / 2, y0 + 30, s)
    yb = top + 4 * rh
    b.append(line(MX, yb, W - MX, yb, INK, 1))
    b.append(ZH(MX, yb + 46, '每个年代都有更多东西可以加。', 18, 300, INK))
    b.append(ZH(MX, yb + 76, '极简主义的那一步，是拿走。', 18, 400, INK))
    b.append(NOTE(W - MX, yb + 76, 'LESS IS MORE · WENIGER, ABER BESSER', anchor='end', size=12))
    b += footer()
    return svg('四个年代，同一个动作：删', b)


def storyboard():
    """过程分镜：8 格，每格一句原则。1920×1080，写到 process/。"""
    sw, sh = 1920, 1080
    cells = [
        ('01  堆满', '先看见多余的，才知道要删什么。', 'SEE THE EXCESS'),
        ('02  一次删一个', '每删一下，必须说清为什么。', 'CUT WITH A REASON'),
        ('03  留下骨架', '删完之后，网格、字重、留白才露出来。', 'THE SKELETON'),
        ('04  App', '同一条原则：列表删成一行、一主按钮。', 'ONE ROW'),
        ('05  Web', '同一条原则：一栏标题、一个 CTA。', 'ONE CTA'),
        ('06  确认', '同一条原则：一金额、一按钮。', 'ONE BUTTON'),
        ('07  坏例对照', '花哨无焦点，极简有焦点。', 'FOCUS VS NOISE'),
        ('08  定妆', '少 = 删到只剩有用的。', 'LESS, BUT BETTER'),
    ]
    pad, gap = 36, 16
    cw, ch = (sw - pad * 2 - gap * 3) / 4, (sh - pad * 2 - gap - 72) / 2
    body = [f'<rect width="{sw}" height="{sh}" fill="{PAPER}"/>',
            NOTE(pad, 40, 'DESIGN STYLE · 007  ·  PROCESS STORYBOARD'),
            T(sw - pad, 40, '@guanmo_ai', 16, 't', 400, INK, anchor='end')]
    for i, (kicker, sentence, en) in enumerate(cells):
        col, row = i % 4, i // 4
        x = pad + col * (cw + gap)
        y = 64 + row * (ch + gap)
        body.append(rect(x, y, cw, ch, PAPER_HI, INK, 1))
        body.append(NOTE(x + 18, y + 36, kicker, ACCENT if i == 7 else GREY_DK))
        body.append(ZH(x + 18, y + 88, sentence, 22, 300, INK))
        body.append(NOTE(x + 18, y + ch - 24, en, GREY, size=11))
        if i == 0:
            for k in range(12):
                body.append(circle(x + 40 + (k % 6) * 28, y + 150 + (k // 6) * 28, 8, STONE))
        elif i == 1:
            body.append(line(x + 36, y + 160, x + cw - 36, y + 160, INK, 1.5))
            body.append(ZH(x + 36, y + 190, '不是功能，是噪音', 16, 400, INK))
        elif i == 2:
            for gx in range(4):
                body.append(line(x + 40 + gx * 48, y + 140, x + 40 + gx * 48, y + 240, HAIR, 1))
            body.append(circle(x + 40 + 2 * 48, y + 190, 6, ACCENT))
        elif i == 3:
            body.append(T(x + 36, y + 200, '07:00', 40, 'd', 100, INK))
            body.append(rect(x + cw - 90, y + 168, 48, 26, INK, rx=13))
            body.append(circle(x + cw - 55, y + 181, 9, ACCENT))
        elif i == 4:
            body.append(T(x + 36, y + 180, 'Less, but better.', 22, 'd', 200, INK))
            body.append(rect(x + 36, y + 210, 120, 32, INK))
            body.append(line(x + 36, y + 242, x + 156, y + 242, ACCENT, 3))
        elif i == 5:
            body.append(T(x + 36, y + 190, '¥12', 48, 'd', 100, INK))
            body.append(rect(x + 36, y + 220, 160, 32, INK))
        elif i == 6:
            body.append(rect(x + 28, y + 140, (cw - 72) / 2, 140, '#1a1020'))
            body.append(rect(x + 44 + (cw - 72) / 2, y + 140, (cw - 72) / 2, 140, PAPER_HI, INK, 1))
        else:
            body.append(T(x + 36, y + 200, '少', 64, 'd', 100, INK))
            body.append(circle(x + cw - 48, y + 210, 10, ACCENT))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{sw}" height="{sh}" viewBox="0 0 {sw} {sh}">\n'
            f'  <!-- 007 过程分镜：每格一句原则 -->\n'
            + '\n'.join('  ' + x for x in body) + '\n</svg>\n')


def main():
    files = {'poster': poster(), 'cheatsheet': cheatsheet(), 'app-ui': app_ui(), 'eras': eras()}
    for name, content in files.items():
        open(os.path.join(HERE, f'{name}.svg'), 'w', encoding='utf-8').write(content)
        print('wrote', name + '.svg')
    proc = os.path.join(os.path.dirname(HERE), 'process', 'storyboard.svg')
    open(proc, 'w', encoding='utf-8').write(storyboard())
    print('wrote', proc)


if __name__ == '__main__':
    main()
