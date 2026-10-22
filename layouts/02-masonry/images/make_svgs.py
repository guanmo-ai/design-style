"""
布局 02 · 瀑布流布局 Masonry —— 四张布局图（1080×1350）的生成脚本

四张图里的“墙”都用同一个 masonry() 排：列宽固定、按顺序放进当前最短的一列、横竖间距一样。
生成的 SVG 是普通可读的源文件（带注释），可以直接改；改完再跑 scripts/build_images.py 内嵌字体和照片、导出 PNG。

  poster.svg     一张海报，认识瀑布流（下半张本身就是一面瀑布流的墙）
  cheatsheet.svg 速查卡：算法、五条规则、断点、比例、CSS（速查卡本身也是瀑布流，深色）
  compare.svg    瀑布流 vs 普通网格 vs CSS 多列 vs 便当盒：同样 8 张卡片，顺序怎么走
  templates.svg  拿来就用的三套排法（作品集 / 双列种草 / 商品流）

用法：python3 layouts/02-masonry/images/make_svgs.py
"""
import os
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))
PHOTOS = '../../../public/02-masonry/photos'
W, H = 1080, 1350
M = 72

# 颜色（与 tokens.ts 一致）
PAPER, CARD, INK, INK2 = '#F2EFE9', '#FFFFFF', '#141414', '#6F6A62'
NIGHT, NCARD, T1, T2 = '#0D0E10', '#17181B', '#F4F2EE', '#8C8A86'
ACCENT, SAND = '#F2462E', '#E9E2D3'
LINE = 'rgba(20,20,20,0.08)'

STYLE = """
    <style>
      .sf { font-family: 'Instrument Serif', 'Noto Sans SC', serif; }
      .d { font-family: 'Inter Display', 'Noto Sans SC', sans-serif; }
      .t { font-family: 'Inter', 'Noto Sans SC', sans-serif; }
      .m { font-family: 'Geist Mono', 'SFMono-Regular', Menlo, monospace; }
      .c { font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif; }
    </style>"""

BASE_DEFS = """
    <filter id="soft" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#281E14" flood-opacity=".08"/></filter>
    <filter id="lift" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#281E14" flood-opacity=".16"/></filter>"""


class Doc:
    """一张图：收集 defs（每张照片一个圆角裁切）和正文"""

    def __init__(self, title):
        self.title = title
        self.defs = []
        self.n = 0

    def clip(self, x, y, w, h, r):
        self.n += 1
        cid = f'k{self.n}'
        self.defs.append(f'<clipPath id="{cid}"><rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{f(r)}"/></clipPath>')
        return cid

    def photo(self, src, x, y, w, h, r, extra=''):
        cid = self.clip(x, y, w, h, r)
        return (f'<image href="{PHOTOS}/{src}.jpg" x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" '
                f'preserveAspectRatio="xMidYMid slice" clip-path="url(#{cid})" {extra}/>')

    def render(self, body):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">\n'
                f'  <!-- Design Style · 布局 02 · 瀑布流布局 Masonry —— {self.title} / 1080×1350（由 make_svgs.py 生成） -->\n'
                f'  <defs>{STYLE}{BASE_DEFS}\n    ' + '\n    '.join(self.defs) + '\n  </defs>\n' + body + '</svg>\n')


def f(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.')


def rect(x, y, w, h, r=0, fill=CARD, extra=''):
    return f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{f(r)}" fill="{fill}" {extra}/>'


def text(x, y, s, cls='c', size=20, weight=400, fill=INK, anchor='start', ls=None, extra=''):
    lsp = f' letter-spacing="{f(ls)}"' if ls is not None else ''
    anc = f' text-anchor="{anchor}"' if anchor != 'start' else ''
    return f'<text x="{f(x)}" y="{f(y)}" class="{cls}" font-size="{f(size)}" font-weight="{weight}" fill="{fill}"{anc}{lsp} {extra}>{escape(s)}</text>'


def pill(x, y, s, fill=ACCENT, color='#FFFFFF', size=15, cls='m', weight=500, pad=12, h=30, anchor='middle', cw=None):
    """胶囊标注；cw = 每个字符的估算宽度"""
    cw = cw or size * (0.62 if cls == 'm' else 1.02)
    w = len(s) * cw + pad * 2
    x0 = x - w / 2 if anchor == 'middle' else x
    return rect(x0, y - h / 2, w, h, h / 2, fill) + text(x0 + w / 2, y + size * 0.36, s, cls, size, weight, color, 'middle')


def twidth(s, size):
    """估算文字宽度：中文 1 个字号，拉丁字母约 0.58 个字号"""
    return sum(size if ord(ch) > 0x2E80 else size * (0.3 if ch == ' ' else 0.6) for ch in s)


def masonry(ratios, x0, y0, cols, colw, gap, extra=0):
    """瀑布流的全部算法：每张卡片放进当前最短的一列（一样短取最左边）"""
    heights = [0.0] * cols
    out = []
    for r in ratios:
        c = min(range(cols), key=lambda i: (heights[i], i))
        h = colw * r + extra
        out.append((x0 + c * (colw + gap), y0 + heights[c], colw, h, c))
        heights[c] += h + gap
    return out, heights


# 卡片内容（与 video/layout.ts 的 ITEMS 同一批）：(照片或文字卡, 比例, 标题, 作者, 点赞)
ITEMS = [
    ('tulips', 1.5, '周末给自己买了一束郁金香', '小满', '2.4万'),
    ('@red', 1, '瀑布流到底是怎么排的？', '观默', '1.2万'),
    ('stairs', 4 / 3, '圣托里尼的白色台阶', '阿岛', '8,412'),
    ('bread', 1, '第一次烤出会裂口的欧包', '面包日记', '3,106'),
    ('poster-swiss', 1.25, '瑞士风格：一张网格排到底', '观默', '6,580'),
    ('lake', 0.5625, '清晨五点的湖', 'Neo', '1.1万'),
    ('cat', 0.75, '晒太阳的橘猫，一下午没动', '橘子', '5.2万'),
    ('tokyo', 1.5, '东京的傍晚，自动售货机', '夜行', '9,027'),
    ('cup', 1.25, '手捏的第一只杯子', '陶土', '2,318'),
    ('poster-bauhaus', 1.25, '包豪斯：把好看变成规则', '观默', '7,941'),
    ('dunes', 0.5625, '沙漠里的日落', '远方', '1.8万'),
    ('monstera', 4 / 3, '龟背竹的影子', '植物系', '4,477'),
    ('@quote', 0.75, '少，但是更好', '读书笔记', '6,203'),
    ('citrus', 1, '夏天的颜色', '柑橘', '3,690'),
    ('nook', 1.5, '把客厅一角改成阅读角', '慢慢', '1.5万'),
    ('ocean', 2 / 3, '从上往下看海', '浪', '7,135'),
    ('poster-bento', 1.25, '便当盒布局：一格一事', '观默', '5,866'),
    ('@palette', 1, '这期的配色', '观默', '1,977'),
    ('@note', 1.25, '瀑布流 ≠ 便当盒', '观默', '8,866'),
]
AVATAR = ['#E8A87C', '#8FB9A8', '#C38D9E', '#85A3C9', '#E2C275', '#A0A0A0']


def text_card(d, kind, x, y, w, h, r):
    """四种文字卡（照片之间穿插一点文字，墙才有节奏）；都按 251 宽设计，再按宽度缩放"""
    s = w / 251
    out = []
    if kind == 'red':
        out.append(rect(x, y, w, h, r, ACCENT))
        out.append(text(x + 18 * s, y + 30 * s, '布局 02', 'c', 12 * s, 500, 'rgba(255,255,255,.8)'))
        out.append(text(x + w - 22 * s, y + 34 * s, '↓', 't', 24 * s, 400, '#FFFFFF', 'middle'))
        out.append(text(x + 18 * s, y + h - 70 * s, 'Waterfall', 'sf', 30 * s, 400, '#FFFFFF', extra='font-style="italic"'))
        out.append(text(x + 16 * s, y + h - 22 * s, '瀑布流', 'c', 46 * s, 900, '#FFFFFF', ls=1 * s))
    elif kind == 'quote':
        out.append(rect(x, y, w, h, r, INK))
        out.append(text(x + 20 * s, y + 58 * s, '“Less,', 'sf', 32 * s, 400, T1, extra='font-style="italic"'))
        out.append(text(x + 20 * s, y + 92 * s, 'but better.”', 'sf', 32 * s, 400, T1, extra='font-style="italic"'))
        out.append(text(x + 20 * s, y + h - 20 * s, '— Dieter Rams', 'm', 11 * s, 400, T2))
    elif kind == 'palette':
        out.append(rect(x, y, w, h, r, CARD, 'stroke="rgba(20,20,20,.06)"'))
        out.append(text(x + 20 * s, y + 44 * s, 'Palette', 'sf', 30 * s, 400, INK))
        for k, (c, n, hx) in enumerate([(PAPER, '纸', '#F2EFE9'), (INK, '墨', '#141414'), (ACCENT, '朱', '#F2462E'), (SAND, '沙', '#E9E2D3')]):
            yy = y + (84 + k * 40) * s
            out.append(f'<circle cx="{f(x + 32 * s)}" cy="{f(yy)}" r="{f(12 * s)}" fill="{c}" stroke="rgba(20,20,20,.12)" stroke-width="1"/>')
            out.append(text(x + 56 * s, yy + 5 * s, n, 'c', 14 * s, 500, INK))
            out.append(text(x + w - 20 * s, yy + 4 * s, hx, 'm', 11 * s, 400, INK2, 'end'))
    elif kind == 'note':
        out.append(rect(x, y, w, h, r, SAND))
        out.append(text(x + 22 * s, y + 36 * s, '笔记', 'c', 13 * s, 500, INK2))
        out.append(text(x + 22 * s, y + 110 * s, '瀑布流', 'c', 40 * s, 900, INK))
        out.append(text(x + 22 * s, y + 162 * s, '≠', 't', 44 * s, 400, ACCENT))
        out.append(text(x + 22 * s, y + 226 * s, '便当盒', 'c', 40 * s, 900, INK))
        out.append(text(x + 22 * s, y + h - 22 * s, '一个是“流”，一个是“盒”', 'c', 12 * s, 400, INK2))
    return ''.join(out)


def tile(d, src, x, y, w, h, r):
    if src.startswith('@'):
        return text_card(d, src[1:], x, y, w, h, r)
    return d.photo(src, x, y, w, h, r)


# =====================================================================
# 1. 海报：上半张讲清楚“是什么”，下半张就是一面瀑布流的墙（往下流出画面）
# =====================================================================
def poster():
    d = Doc('海报')
    b = [rect(0, 0, W, H, 0, PAPER)]
    b.append(f'<circle cx="{M + 5}" cy="{98}" r="5" fill="{ACCENT}"/>')
    b.append(text(M + 20, 105, 'Design Style · 布局 02', 'm', 20, 500, INK2))
    b.append(text(W - M, 105, '每天一个设计风格', 'c', 20, 500, INK2, 'end', ls=1))
    b.append(text(M - 6, 300, 'Masonry', 'sf', 214, 400, INK, ls=-4))
    b.append(text(M, 384, '瀑布流布局', 'c', 60, 900, INK, ls=4))
    b.append(text(W - M, 344, '列宽固定，高度跟着内容走；', 'c', 22, 500, INK, 'end'))
    b.append(text(W - M, 380, '每一张，都落进最短的那一列。', 'c', 22, 500, INK2, 'end'))
    # 时间线
    b.append(f'<line x1="{M}" y1="440" x2="{W - M}" y2="440" stroke="rgba(20,20,20,.14)" stroke-width="1.5"/>')
    for k, (yr, s) in enumerate([('2009', 'jQuery Masonry'), ('2010', 'Pinterest'), ('2011 前后', '国内叫“瀑布流”'), ('2025', 'CSS grid-lanes')]):
        x = M + k * (W - 2 * M) / 3.6
        b.append(f'<circle cx="{f(x + 4)}" cy="440" r="5" fill="{ACCENT if k == 1 else INK}"/>')
        b.append(text(x, 476, yr, 'm', 17, 500, INK))
        b.append(text(x, 502, s, 'c', 16, 400, INK2))
    # 墙：4 列，列宽 222，间距 16
    cols, gap = 4, 16
    colw = (W - 2 * M - (cols - 1) * gap) / cols
    y0 = 548
    WALL = ITEMS[:9]  # 只放 9 张：最短的一列在画面里露出“下一张”该去的位置
    rects, heights = masonry([it[1] for it in WALL], M, y0, cols, colw, gap)
    for (x, y, w, h, c), it in zip(rects, WALL):
        if y > H:
            continue
        b.append(f'<g filter="url(#soft)">{tile(d, it[0], x, y, w, h, 16)}</g>')
    # 下一张：最短那一列的虚线框
    c = min(range(cols), key=lambda i: (heights[i], i))
    gx, gy = M + c * (colw + gap), y0 + heights[c]
    if gy < H - 120:
        b.append(rect(gx, gy, colw, min(colw * 1.25, H - 168 - gy), 16, 'rgba(242,70,46,.08)', f'stroke="{ACCENT}" stroke-width="2.5" stroke-dasharray="8 7"'))
        b.append(pill(gx + colw / 2, gy + 40, '下一张 → 最短的一列', cls='c', size=15, weight=700, cw=15.6))
    # 底部雾化 + 页脚
    d.defs.append(f'<linearGradient id="fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{PAPER}" stop-opacity="0"/><stop offset=".5" stop-color="{PAPER}" stop-opacity=".96"/><stop offset="1" stop-color="{PAPER}"/></linearGradient>')
    b.append(rect(0, H - 270, W, 270, 0, 'url(#fog)'))
    b.append(text(W / 2, H - 92, '列宽固定 · 最短优先 · 统一间距 · 保持比例 · 先占位', 'c', 22, 700, INK, 'middle', ls=2))
    b.append(text(W / 2, H - 54, '@guanmo_ai   ·   github.com/guanmo-ai/design-style', 'm', 16, 400, INK2, 'middle'))
    return d.render('\n'.join('  ' + x for x in b) + '\n')


# =====================================================================
# 2. 速查卡（深色）：6 张信息卡，自己也按瀑布流排成两列
# =====================================================================
def cheatsheet():
    d = Doc('速查卡')
    b = [rect(0, 0, W, H, 0, NIGHT)]
    b.append(f'<circle cx="{M + 5}" cy="96" r="5" fill="{ACCENT}"/>')
    b.append(text(M + 20, 103, '布局 02 · 速查卡', 'c', 20, 500, T2, ls=1))
    b.append(text(W - M, 103, '这张卡本身就是一面两列的瀑布流', 'c', 16, 400, T2, 'end'))
    b.append(text(M - 3, 196, 'Masonry', 'sf', 96, 400, T1, ls=-1.5))
    b.append(text(M + 340, 190, '瀑布流 · 一页记住', 'c', 38, 900, T1, ls=2))
    gap, cols = 20, 2
    colw = (W - 2 * M - gap) / cols
    cards = []  # (高度, 画法)

    def card_frame(x, y, w, h, title, sub=None):
        o = [rect(x, y, w, h, 20, NCARD, 'stroke="rgba(255,255,255,.07)"')]
        o.append(text(x + 28, y + 50, title, 'c', 24, 700, T1))
        if sub:
            o.append(text(x + w - 28, y + 49, sub, 'm', 14, 400, T2, 'end'))
        return o

    # A. 算法
    def algo(x, y, w, h):
        o = card_frame(x, y, w, h, '算法：最短列优先', 'O(n · 列数)')
        hs = [150, 100, 126, 80]
        bw, bg = 70, 14
        bx = x + 30
        base = y + 80
        for k, hh in enumerate(hs):
            xx = bx + k * (bw + bg)
            o.append(rect(xx, base, bw, hh, 8, '#24262A'))
            if k != 3:
                o.append(text(xx + bw / 2, base + hh + 24, str(hh * 4), 'm', 13, 500, T2, 'middle'))
        xx = bx + 3 * (bw + bg)
        o.append(rect(xx, base + 80 + 8, bw, 56, 8, 'rgba(242,70,46,.12)', f'stroke="{ACCENT}" stroke-width="2" stroke-dasharray="6 5"'))
        o.append(text(xx + bw / 2, base + 80 + 42, '新', 'c', 16, 700, ACCENT, 'middle'))
        code = ['heights = [0] * 列数', 'for card in cards:', '  i = argmin(heights)', '  place(card, 列 i)', '  heights[i] += card.h + gap']
        cy = y + 104
        for k, line in enumerate(code):
            hl = k == 2
            if hl:
                o.append(rect(x + 368, cy + k * 30 - 21, w - 368 - 18, 30, 6, 'rgba(242,70,46,.16)'))
            o.append(text(x + 378, cy + k * 30, line, 'm', 14.5, 500 if hl else 400, T1 if hl else '#B9B7B2'))
        o.append(text(x + 378, y + h - 30, '一样短取最左边 → 顺序大致还是从左到右。', 'c', 15, 400, T2))
        return o
    cards.append((290, algo, 2))  # 跨两列

    # B. 五条规则
    def rules(x, y, w, h):
        o = card_frame(x, y, w, h, '五条规则')
        R = [('列宽固定', '宽度统一，高度跟着内容走'), ('最短优先', '按顺序，每张放进最短的那一列'), ('统一间距', '横缝竖缝一样宽，8–24px'),
             ('保持比例', '图片按原比例放，不裁切'), ('先占位', '先写好宽高再加载，页面不跳')]
        for k, (t, s) in enumerate(R):
            yy = y + 100 + k * 56
            o.append(text(x + 28, yy, f'0{k + 1}', 'm', 16, 500, ACCENT))
            o.append(text(x + 70, yy, t, 'c', 21, 700, T1))
            o.append(text(x + 70, yy + 26, s, 'c', 15, 400, T2))
        return o
    cards.append((380, rules, 1))

    # C. 断点
    def bps(x, y, w, h):
        o = card_frame(x, y, w, h, '断点：变的是列数', 'columns · gap')
        rows = [('≥ 1200', '桌面', '5', '24'), ('≥ 768', '平板', '3', '16'), ('< 768', '手机', '2', '8')]
        for k, (px, dev, n, g) in enumerate(rows):
            yy = y + 96 + k * 50
            if k < len(rows) - 1:  # 最后一行不画分隔线，免得压到底下的说明
                o.append(f'<line x1="{f(x + 28)}" y1="{f(yy + 22)}" x2="{f(x + w - 28)}" y2="{f(yy + 22)}" stroke="rgba(255,255,255,.07)"/>')
            o.append(text(x + 28, yy + 6, px, 'm', 17, 500, T1))
            o.append(text(x + 126, yy + 6, dev, 'c', 17, 500, T2))
            # 小图：n 列
            for j in range(int(n)):
                cw = 74 / int(n)
                o.append(rect(x + 210 + j * (cw + 3), yy - 14, cw - 3 + 3 * (j < int(n) - 1) - 3, 26, 3, '#2A2C31' if j else ACCENT))
            o.append(text(x + w - 28, yy + 6, f'{n} 列 · {g}px', 'c', 17, 700, T1, 'end'))
        o.append(text(x + 28, y + h - 26, '列宽大致不变：手机 ≈ 屏宽一半。', 'c', 15, 400, T2))
        return o
    cards.append((270, bps, 1))

    # D. 比例
    def ratios(x, y, w, h):
        o = card_frame(x, y, w, h, '只用几种比例', '高 = 列宽 × 比例')
        R = [('2:3', 1.5), ('3:4', 4 / 3), ('4:5', 1.25), ('1:1', 1), ('4:3', .75), ('16:9', .5625)]
        cw = 50
        for k, (n, r) in enumerate(R):
            xx = x + 28 + k * (cw + 17)
            hh = cw * r
            o.append(rect(xx, y + 142 - hh, cw, hh, 6, ACCENT if n == '4:5' else '#2A2C31'))
            o.append(text(xx + cw / 2, y + 166, n, 'm', 13, 500, T1 if n == '4:5' else T2, 'middle'))
        o.append(text(x + 28, y + h - 20, '比例种类少，墙更整齐；竖图最出效果。', 'c', 15, 400, T2))
        return o
    cards.append((210, ratios, 1))

    # E. CSS
    def css(x, y, w, h):
        o = card_frame(x, y, w, h, 'CSS（2025 起）', 'display: grid-lanes')
        code = [('.wall {', '#B9B7B2'), ('  display: grid-lanes;', ACCENT), ('  grid-template-columns:', '#B9B7B2'), ('    repeat(auto-fill,', '#B9B7B2'),
                ('      minmax(240px, 1fr));', '#B9B7B2'), ('  gap: 16px;', '#B9B7B2'), ('}', '#B9B7B2')]
        for k, (line, c) in enumerate(code):
            o.append(text(x + 28, y + 92 + k * 25, line, 'm', 15, 500 if c == ACCENT else 400, c))
        o.append(text(x + 28, y + h - 58, 'Safari 26.4+ 已支持；Chrome / Firefox', 'c', 15, 400, T2))
        o.append(text(x + 28, y + h - 32, '还在开关后面 → 先退回普通 Grid 或 JS。', 'c', 15, 400, T2))
        return o
    cards.append((330, css, 1))

    # F. 色板 & 字体
    def pal(x, y, w, h):
        o = card_frame(x, y, w, h, '本期色板 · 字体')
        P = [(PAPER, '纸'), (INK, '墨'), (ACCENT, '朱'), (SAND, '沙'), (NIGHT, '夜')]
        for k, (c, n) in enumerate(P):
            xx = x + 28 + k * 76
            o.append(rect(xx, y + 74, 56, 56, 12, c, 'stroke="rgba(255,255,255,.12)"'))
            o.append(text(xx + 28, y + 152, n, 'c', 14, 500, T2, 'middle'))
        o.append(text(x + 28, y + 190, 'Instrument Serif', 'sf', 26, 400, T1))
        o.append(text(x + 222, y + 190, '+ 思源黑体 + Geist Mono', 'c', 15, 400, T2))
        return o
    cards.append((210, pal, 1))

    # 排版：跨两列的先放顶上，其余按瀑布流（最短列）
    y0 = 232
    x = M
    hs = [y0, y0]
    for hh, fn, span in cards:
        if span == 2:
            y = max(hs)
            b.extend(fn(M, y, W - 2 * M, hh))
            hs = [y + hh + gap] * 2
            continue
        c = min(range(2), key=lambda i: (hs[i], i))
        x = M + c * (colw + gap)
        b.extend(fn(x, hs[c], colw, hh))
        hs[c] += hh + gap
    return d.render('\n'.join('  ' + x for x in b) + '\n')


# =====================================================================
# 3. 对照：同样 8 张卡片，四种排法，看“顺序”和“留白”
# =====================================================================
def compare():
    d = Doc('对照')
    b = [rect(0, 0, W, H, 0, PAPER)]
    b.append(f'<circle cx="{M + 5}" cy="96" r="5" fill="{ACCENT}"/>')
    b.append(text(M + 20, 103, '布局 02 · 别排错', 'c', 20, 500, INK2, ls=1))
    b.append(text(M - 2, 196, '同样 8 张卡片，四种排法', 'c', 54, 900, INK, ls=1))
    b.append(text(M, 244, '数字 = 内容的先后顺序。看顺序怎么走、空白在哪里。', 'c', 22, 400, INK2))
    R8 = [1.5, 1, 4 / 3, 1, 1.25, .5625, .75, 1.5]
    pw, ph = 456, 440
    gx, gy = 24, 24
    panels = [
        ('普通网格', 'Grid', '行对齐 → 按行读；但高低不一的图只能裁成一样，或留出空白。', 'grid'),
        ('瀑布流', 'Masonry', '列宽固定，放进最短列 → 没有空洞，顺序仍是左→右。', 'masonry'),
        ('CSS 多列', 'columns', '看着像瀑布流，顺序却是一列一列往下 → 2 号跑到 1 号下面。', 'columns'),
        ('便当盒', 'Bento', '人来指定每格大小，格子对齐 → 适合 6–9 个固定模块。', 'bento'),
    ]
    for k, (cn, en, desc, kind) in enumerate(panels):
        px = M + (k % 2) * (pw + gx)
        py = 290 + (k // 2) * (ph + gy)
        hl = kind == 'masonry'
        b.append(rect(px, py, pw, ph, 24, CARD, f'stroke="{ACCENT if hl else "rgba(20,20,20,.06)"}" stroke-width="{2.5 if hl else 1}" filter="url(#soft)"'))
        b.append(text(px + 28, py + 50, cn, 'c', 26, 900, INK))
        b.append(text(px + 28 + twidth(cn, 26) + 12, py + 50, en, 'sf', 26, 400, INK2, extra='font-style="italic"'))
        if hl:
            b.append(pill(px + pw - 28, py + 41, '本期', cls='c', size=14, weight=700, anchor='start', cw=14.5) .replace(f'x="{f(px + pw - 28)}"', f'x="{f(px + pw - 28 - 58)}"', 1) if False else pill(px + pw - 62, py + 41, '本期', cls='c', size=14, weight=700, cw=14.5))
        # 示意区
        ax, ay, aw, ah = px + 28, py + 76, pw - 56, 270
        b.append(f'<g>')
        cols, g = 3, 10
        cw = (aw - (cols - 1) * g) / cols
        boxes = []
        if kind == 'grid':
            rh = (ah - 2 * g) / 3
            for i, r in enumerate(R8):
                c, row = i % cols, i // cols
                x, y = ax + c * (cw + g), ay + row * (rh + g)
                boxes.append((x, y, cw, rh, i))
        elif kind == 'masonry':
            sc = 0.62
            rects, _ = masonry([r * sc for r in R8], ax, ay, cols, cw, g)
            boxes = [(x, y, w, h, i) for i, (x, y, w, h, c) in enumerate(rects)]
        elif kind == 'columns':
            sc = 0.62
            # CSS 多列：先把第 1 列填满，再填第 2 列（按总高度平均分）
            total = sum(cw * r * sc + g for r in R8)
            per = total / cols
            c, y = 0, ay
            for i, r in enumerate(R8):
                h = cw * r * sc
                if y - ay + h / 2 > per and c < cols - 1:
                    c, y = c + 1, ay
                boxes.append((ax + c * (cw + g), y, cw, h, i))
                y += h + g
        else:  # bento
            u = (ah - 2 * g) / 3
            cw2 = (aw - 3 * g) / 4
            spec = [(0, 0, 2, 2), (2, 0, 2, 1), (2, 1, 1, 1), (3, 1, 1, 2), (0, 2, 1, 1), (1, 2, 1, 1), (2, 2, 1, 1)]
            for i, (c, r, sw, sh) in enumerate(spec):
                boxes.append((ax + c * (cw2 + g), ay + r * (u + g), sw * cw2 + (sw - 1) * g, sh * u + (sh - 1) * g, i))
        for (x, y, w, h, i) in boxes:
            if y + h > ay + ah + 2:
                h = ay + ah - y
                if h < 12:
                    continue
            fill = '#E6E0D5'
            if kind == 'grid' and R8[i] > 1:  # 被裁掉的部分
                fill = '#E6E0D5'
            b.append(rect(x, y, w, h, 10, fill))
            if kind == 'grid':
                # 原图该有的高度 vs 格子：画一条虚线提示“被裁掉”
                if R8[i] > 0.8:
                    b.append(text(x + w - 10, y + h - 10, '裁', 'c', 13, 700, ACCENT, 'end'))
                elif R8[i] < 0.8:
                    real = w * R8[i]
                    b.append(rect(x, y, w, real, 10, '#D8D0C2'))
                    b.append(text(x + w - 10, y + h - 10, '空', 'c', 13, 700, INK2, 'end'))
            b.append(f'<circle cx="{f(x + 22)}" cy="{f(y + 22)}" r="13" fill="{ACCENT if hl or (kind == "columns" and i == 1) else INK}"/>')
            b.append(text(x + 22, y + 27, str(i + 1), 'm', 14, 500, '#FFFFFF', 'middle'))
        b.append('</g>')
        # 顺序线（只画瀑布流和多列，最能说明问题）
        if kind in ('masonry', 'columns'):
            pts = ' '.join(f'{f(x + 22)},{f(y + 22)}' for (x, y, w, h, i) in sorted(boxes, key=lambda t: t[4]))
            b.append(f'<polyline points="{pts}" fill="none" stroke="{ACCENT if hl else INK}" stroke-width="2" stroke-opacity=".55" stroke-linejoin="round"/>')
        # 说明
        lines = [desc[:desc.index('→') + 1].strip(), desc[desc.index('→') + 1:].strip()] if '→' in desc else [desc]
        for j, ln in enumerate(lines):
            b.append(text(px + 28, py + ph - 56 + j * 28, ln, 'c', 17, 700 if j == 0 else 400, INK if j == 0 else INK2))
    # 什么时候用
    y = 290 + 2 * (ph + gy) + 14
    b.append(text(M, y + 20, '适合', 'c', 22, 900, ACCENT))
    b.append(text(M + 64, y + 20, '图片社区 · 灵感收藏 · 作品集 · 商品推荐 · 笔记信息流', 'c', 20, 500, INK))
    b.append(text(M, y + 60, '不适合', 'c', 22, 900, INK2))
    b.append(text(M + 86, y + 60, '要按行比较的（价格表）· 有阅读顺序的长文 · 只有 3–5 个模块', 'c', 20, 500, INK2))
    return d.render('\n'.join('  ' + x for x in b) + '\n')


# =====================================================================
# 4. 模板：作品集（桌面 4 列）+ 双列种草 + 商品流（手机 2 列）
# =====================================================================
def phone_shell(x, y, w, h):
    o = [rect(x, y, w, h, 46, '#111113', 'filter="url(#lift)"'), rect(x + 9, y + 9, w - 18, h - 18, 38, CARD)]
    o.append(rect(x + w / 2 - 46, y + 20, 92, 24, 12, '#111113'))
    o.append(text(x + 38, y + 38, '9:41', 't', 14, 600, INK))
    return o


def templates():
    d = Doc('模板')
    b = [rect(0, 0, W, H, 0, PAPER)]
    b.append(f'<circle cx="{M + 5}" cy="96" r="5" fill="{ACCENT}"/>')
    b.append(text(M + 20, 103, '布局 02 · 拿来就用', 'c', 20, 500, INK2, ls=1))
    b.append(text(M - 2, 190, '三套排法', 'c', 54, 900, INK, ls=2))
    b.append(text(M + 236, 190, 'Templates', 'sf', 54, 400, INK2, extra='font-style="italic"'))
    # A. 作品集：浏览器窗口，4 列
    wx, wy, ww, wh = M, 236, W - 2 * M, 470
    b.append(rect(wx, wy, ww, wh, 18, CARD, 'filter="url(#lift)"'))
    for k, c in enumerate(['#FF5F57', '#FEBC2E', '#28C840']):
        b.append(f'<circle cx="{wx + 24 + k * 20}" cy="{wy + 22}" r="6" fill="{c}"/>')
    b.append(text(wx + 104, wy + 27, 'portfolio.design', 'm', 13, 400, INK2))
    b.append(text(wx + 32, wy + 84, '作品', 'c', 26, 900, INK))
    for k, s in enumerate(['全部', '海报', '摄影', '静物']):
        b.append(pill(wx + 132 + k * 70, wy + 76, s, fill=INK if k == 0 else '#F1EEE8', color='#FFFFFF' if k == 0 else INK2, cls='c', size=14, weight=500, cw=14.5, h=30))
    cols, gap = 4, 14
    colw = (ww - 64 - (cols - 1) * gap) / cols
    order = ['poster-swiss', 'tulips', 'lake', 'stairs', 'cup', 'dunes', 'poster-bauhaus', 'tokyo', 'monstera', 'citrus', 'nook', 'poster-bento']
    rat = {'poster-swiss': 1.25, 'tulips': 1.5, 'lake': .5625, 'stairs': 4 / 3, 'cup': 1.25, 'dunes': .5625, 'poster-bauhaus': 1.25, 'tokyo': 1.5,
           'monstera': 4 / 3, 'citrus': 1, 'nook': 1.5, 'poster-bento': 1.25}
    rects, _ = masonry([rat[s] for s in order], wx + 32, wy + 112, cols, colw, gap)
    cid = d.clip(wx, wy, ww, wh - 0, 18)
    b.append(f'<g clip-path="url(#{cid})">')
    for (x, y, w, h, c), s in zip(rects, order):
        if y < wy + wh:
            b.append(d.photo(s, x, y, w, h, 10))
    b.append('</g>')
    d.defs.append(f'<linearGradient id="wfog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient>')
    b.append(rect(wx, wy + wh - 70, ww, 70, 0, 'url(#wfog)'))
    b.append(text(M, wy + wh + 44, 'A · 作品集 / 图库', 'c', 22, 900, INK))
    b.append(text(W - M, wy + wh + 44, '4 列 · 列宽 ≈ 220 · 间距 14 · 圆角 10 · 不放文字', 'm', 15, 400, INK2, 'end'))

    # B / C：两部手机
    py, ph, pw = 786, 480, 340
    for k, (title, spec) in enumerate([('B · 双列种草', '2 列 · 间距 6 · 封面 + 标题 + 点赞'), ('C · 商品流', '2 列 · 间距 6 · 封面 + 名字 + 价格')]):
        px = M + 48 + k * (pw + 120)
        b.extend(phone_shell(px, py, pw, ph))
        sx, sy, sw = px + 9, py + 9, pw - 18
        tabs = ['关注', '发现', '附近'] if k == 0 else ['推荐', '家居', '吃的']
        for j, t in enumerate(tabs):
            b.append(text(sx + sw / 2 + (j - 1) * 56, sy + 66, t, 'c', 13, 700 if j == 1 else 400, INK if j == 1 else '#9A968F', 'middle'))
        b.append(rect(sx + sw / 2 - 9, sy + 74, 18, 3, 1.5, ACCENT))
        g = 6
        cw = (sw - 2 * 8 - g) / 2
        if k == 0:
            feed = [('tulips', 1.33, '周末给自己买了一束郁金香', '小满', '2.4万'), ('bread', 1, '第一次烤出会裂口的欧包', '面包日记', '3,106'),
                    ('cat', .75, '晒太阳的橘猫，一下午没动', '橘子', '5.2万'), ('stairs', 1.33, '圣托里尼的白色台阶', '阿岛', '8,412'),
                    ('lake', .75, '清晨五点的湖', 'Neo', '1.1万'), ('nook', 1.33, '把客厅一角改成阅读角', '慢慢', '1.5万')]
            meta = 46
        else:
            feed = [('bread', 1, '手作欧包 4 只装', '¥39', '已售 2,108'), ('cup', 1.25, '手捏陶杯 · 米白', '¥128', '已售 316'),
                    ('citrus', 1, '鲜切橙子 5 斤', '¥29.9', '已售 1.2万'), ('monstera', 1.33, '龟背竹 中号盆栽', '¥89', '已售 864'),
                    ('nook', 1.33, '纸灯 · 落地款', '¥259', '已售 92'), ('tulips', 1.33, '郁金香 10 支', '¥45', '已售 3,410')]
            meta = 50
        fx, fy = sx + 8, sy + 88
        scid = d.clip(sx, fy - 2, sw, ph - 18 - (fy - 2 - sy) - 44, 0)
        b.append(f'<g clip-path="url(#{scid})">')
        rects, _ = masonry([it[1] for it in feed], fx, fy, 2, cw, g, extra=meta)
        for (x, y, w, h, c), it in zip(rects, feed):
            ih = h - meta
            b.append(rect(x, y, w, h, 8, CARD, 'stroke="rgba(20,20,20,.07)"'))
            b.append(d.photo(it[0], x, y, w, ih, 8))
            b.append(rect(x, y + ih - 8, w, 8, 0, CARD) if False else '')
            if k == 0:
                b.append(text(x + 7, y + ih + 19, it[2][:10], 'c', 11, 500, INK))
                b.append(f'<circle cx="{f(x + 13)}" cy="{f(y + ih + 36)}" r="6" fill="{AVATAR[len(it[3]) % len(AVATAR)]}"/>')
                b.append(text(x + 23, y + ih + 40, it[3], 'c', 9.5, 400, '#8A8A8A'))
                b.append(text(x + w - 7, y + ih + 40, '♡ ' + it[4], 't', 9.5, 400, '#8A8A8A', 'end'))
            else:
                b.append(text(x + 7, y + ih + 19, it[2], 'c', 11, 500, INK))
                b.append(text(x + 7, y + ih + 41, it[3], 't', 15, 700, ACCENT))
                b.append(text(x + w - 7, y + ih + 40, it[4], 'c', 9.5, 400, '#8A8A8A', 'end'))
        b.append('</g>')
        # 底栏
        by = py + ph - 9 - 44
        b.append(rect(sx, by, sw, 44, 0, CARD))
        b.append(f'<line x1="{f(sx)}" y1="{f(by)}" x2="{f(sx + sw)}" y2="{f(by)}" stroke="rgba(20,20,20,.07)"/>')
        for j, t in enumerate(['首页', '购物' if k == 0 else '分类', '', '消息', '我']):
            xx = sx + sw * (j + 0.5) / 5
            if t:
                b.append(text(xx, by + 25, t, 'c', 11, 700 if j == 0 else 400, INK if j == 0 else '#9A968F', 'middle'))
            else:
                b.append(rect(xx - 16, by + 10, 32, 22, 7, ACCENT))
                b.append(text(xx, by + 26, '+', 't', 17, 600, '#FFFFFF', 'middle'))
        b.append(text(px + pw / 2, py + ph + 40, title, 'c', 20, 900, INK, 'middle'))
        b.append(text(px + pw / 2, py + ph + 64, spec, 'c', 13, 400, INK2, 'middle'))
    return d.render('\n'.join('  ' + x for x in b) + '\n')


for name, fn in [('poster', poster), ('cheatsheet', cheatsheet), ('compare', compare), ('templates', templates)]:
    path = os.path.join(HERE, f'{name}.svg')
    with open(path, 'w', encoding='utf-8') as fp:
        fp.write(fn())
    print('wrote', os.path.relpath(path))
