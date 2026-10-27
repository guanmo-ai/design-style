"""
布局 03 候选 · 三张海报（1080×1350）：三种布局，三种视觉
每张图本身就是它所讲的布局，选定一张之后再做成完整的一期（视频、四张图、指南、配乐）。

  a-split.svg   分屏布局 Split Screen  —— 一条中线，两种声音（墨黑 × 钴蓝，硬色块）
  b-broken.svg  破格布局 Broken Grid   —— 先立网格，再冲出去（纸色 × 荧光黄，杂志衬线 + 真实照片）
  c-stack.svg   层叠布局 Stacked Cards —— 后一张压住前一张，只露一条边（夜色 × 糖果色，有深度）

用法：python3 drafts/layout-03/images/make_svgs.py && python3 scripts/build_images.py drafts/layout-03/images
"""
import os
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))
PHOTOS = '../../../public/02-masonry/photos'
W, H = 1080, 1350


def f(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.')


def mix(a, b, t):
    """a → b 之间取 t 的实色（避免半透明叠色在 Chromium 里出色差）"""
    pa = [int(a[i:i + 2], 16) for i in (1, 3, 5)]
    pb = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{round(x + (y - x) * t):02X}' for x, y in zip(pa, pb))


def rect(x, y, w, h, r=0, fill='#fff', extra=''):
    return f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{f(r)}" fill="{fill}" {extra}/>'


def text(x, y, s, cls='c', size=20, weight=400, fill='#000', anchor='start', ls=None, extra=''):
    lsp = f' letter-spacing="{f(ls)}"' if ls is not None else ''
    anc = f' text-anchor="{anchor}"' if anchor != 'start' else ''
    return (f'<text x="{f(x)}" y="{f(y)}" class="{cls}" font-size="{f(size)}" font-weight="{weight}" '
            f'fill="{fill}"{anc}{lsp} {extra}>{escape(s)}</text>')


def line(x1, y1, x2, y2, stroke, sw=1.5, extra=''):
    return f'<line x1="{f(x1)}" y1="{f(y1)}" x2="{f(x2)}" y2="{f(y2)}" stroke="{stroke}" stroke-width="{f(sw)}" {extra}/>'


class Doc:
    def __init__(self, name, title, style, bg):
        self.name, self.title, self.style, self.bg = name, title, style, bg
        self.defs, self.n = [], 0

    def clip(self, x, y, w, h, r=0):
        self.n += 1
        cid = f'k{self.n}'
        self.defs.append(f'<clipPath id="{cid}"><rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{f(r)}"/></clipPath>')
        return cid

    def photo(self, src, x, y, w, h, r=0, pos='xMidYMid', extra=''):
        cid = self.clip(x, y, w, h, r)
        return (f'<image href="{PHOTOS}/{src}.jpg" x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" '
                f'preserveAspectRatio="{pos} slice" clip-path="url(#{cid})" {extra}/>')

    def render(self, body):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">\n'
                f'  <!-- Design Style · 布局 03 候选 · {self.title} / 1080×1350（由 make_svgs.py 生成） -->\n'
                f'  <defs>{self.style}\n    ' + '\n    '.join(self.defs) + '\n  </defs>\n'
                f'  <rect width="{W}" height="{H}" fill="{self.bg}"/>\n' + body + '</svg>\n')


def save(name, svg):
    with open(os.path.join(HERE, name), 'w', encoding='utf-8') as fh:
        fh.write(svg)
    print('wrote', name)


# ═══════════════════════════════ A · 分屏布局 Split Screen ═══════════════════════════════
def poster_split():
    INK, PAPER, BLUE = '#0E0E10', '#F1EDE4', '#2B35FF'
    PER = '#8E95FF'  # 墨色上的浅钴蓝（对比度 ≥ 6）
    SPLIT = 668  # 1080 × 0.618
    style = """
    <style>
      .a { font-family: 'Archivo', 'Noto Sans SC', sans-serif; }
      .m { font-family: 'Space Mono', 'Noto Sans SC', monospace; }
      .c { font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif; }
    </style>"""
    d = Doc('a-split', '分屏布局 Split Screen', style, INK)
    left = d.clip(0, 0, SPLIT, H)
    right = d.clip(SPLIT, 0, W - SPLIT, H)
    o = [rect(SPLIT, 0, W - SPLIT, H, 0, BLUE)]

    # 页眉
    o.append(text(72, 96, 'Design Style · 布局 03', 'm', 21, 400, mix(INK, PAPER, .72)))
    o.append(text(W - 40, 96, '每天一个设计风格', 'c', 21, 500, PAPER, 'end'))

    # 巨字：同一个词画两遍，分界线左边纸色、右边墨色——一条线，两种声音
    big = dict(cls='a', size=320, weight=900, ls=-12)
    o.append(f'<g clip-path="url(#{left})">' + text(56, 440, 'Split', fill=PAPER, **big) + '</g>')
    o.append(f'<g clip-path="url(#{right})">' + text(56, 440, 'Split', fill=INK, **big) + '</g>')

    # 分界线上的刻度：61.8%
    o.append(line(SPLIT, 0, SPLIT, 150, PAPER, 2))
    o.append(rect(SPLIT - 62, 150, 124, 38, 0, PAPER))
    o.append(text(SPLIT, 176, '61.8 %', 'm', 20, 700, INK, 'middle'))
    o.append(line(SPLIT, 188, SPLIT, 214, PAPER, 2))

    # 中文标题（左半，纸色）+ 右半一句话
    o.append(text(72, 640, '分屏布局', 'c', 118, 900, PAPER, ls=-2))
    o.append(text(72, 696, 'Split Screen · 一条中线，两种声音', 'm', 21, 400, PER))
    o.append(text(704, 566, '左边说话，', 'c', 38, 700, PAPER))
    o.append(text(704, 616, '右边给证据。', 'c', 38, 700, PAPER))

    # 左：五条规则
    o.append(text(72, 762, '五条规则', 'm', 20, 700, PER, ls=3))
    o.append(line(72, 782, SPLIT - 72, 782, mix(INK, PAPER, .22), 1.5))
    rules = [
        ('01', '只有一条中线', '不加阴影、不加描边，色块自己说话'),
        ('02', '比例要有意思', '50:50 对等，62:38 主次，70:30 导航'),
        ('03', '两边要有反差', '明暗、图文、静动，一次只选一对'),
        ('04', '一边固定，一边滚', 'position: sticky；左边不动，右边流'),
        ('05', '手机上叠成上下', '文字在上，一屏只讲一件事'),
    ]
    y = 832
    for n, t, s in rules:
        o.append(text(72, y, n, 'm', 22, 700, PER))
        o.append(text(130, y + 2, t, 'c', 31, 700, PAPER))
        o.append(text(130, y + 36, s, 'c', 20, 400, mix(INK, PAPER, .62)))
        y += 90

    # 右：三种常用比例
    o.append(text(704, 762, '三种常用比例', 'm', 20, 700, PAPER, ls=3))
    o.append(line(704, 782, W - 40, 782, mix(BLUE, PAPER, .4), 1.5))
    bw = 336
    bars = [(.5, '50', '50', '对等 · 两个主角'), (.618, '62', '38', '主次 · 图文 / 登录页'), (.7, '70', '30', '内容 + 侧栏 · 后台')]
    y = 812
    for a, l, r_, cap in bars:
        o.append(rect(704, y, bw * a, 60, 0, INK))
        o.append(rect(704 + bw * a, y, bw * (1 - a), 60, 0, PAPER))
        o.append(text(704 + 16, y + 39, l, 'a', 30, 800, PAPER))
        o.append(text(704 + bw - 16, y + 39, r_, 'a', 30, 800, INK, 'end'))
        o.append(text(704, y + 92, cap, 'c', 19, 500, PAPER))
        y += 120

    # 右下：粘性滚动示意（左固定，右滚）
    wx, wy, ww, wh = 704, 1184, bw, 90
    o.append(rect(wx, wy, ww, wh, 0, 'none', f'stroke="{PAPER}" stroke-width="2"'))
    o.append(rect(wx, wy, ww * .4, wh, 0, PAPER))
    o.append(text(wx + ww * .2, wy + wh / 2 + 7, 'sticky', 'm', 17, 700, INK, 'middle'))
    rc = d.clip(wx + ww * .4, wy, ww * .6, wh)
    o.append(f'<g clip-path="url(#{rc})">')
    for i, lw in enumerate([.86, .6, .78, .5, .7, .82]):
        o.append(rect(wx + ww * .4 + 14, wy - 4 + i * 24, (ww * .6 - 28) * lw, 10, 0, PAPER, 'opacity=".9"'))
    o.append('</g>')
    o.append(text(wx + ww - 10, wy + wh + 26, '↕ scroll', 'm', 17, 400, PAPER, 'end'))

    # 页脚
    o.append(text(72, 1304, '@guanmo_ai · github.com/guanmo-ai/design-style', 'm', 19, 400, mix(INK, PAPER, .55)))
    return d.render('\n'.join(o))


# ═══════════════════════════════ B · 破格布局 Broken Grid ═══════════════════════════════
def poster_broken():
    PAPER, INK, LIME, GREY = '#EEEAE0', '#121212', '#E4FF3A', '#6B665C'
    style = """
    <style>
      .bo { font-family: 'Bodoni Moda', 'Noto Serif SC', serif; }
      .m { font-family: 'Space Mono', 'Noto Sans SC', monospace; }
      .s { font-family: 'Noto Serif SC', 'Songti SC', serif; }
      .c { font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif; }
    </style>"""
    d = Doc('b-broken', '破格布局 Broken Grid', style, PAPER)
    MARGIN, GUT = 72, 12
    COL = (W - 2 * MARGIN - 11 * GUT) / 12

    def cx(i):
        return MARGIN + i * (COL + GUT)

    def span(a, b):
        return (b - a + 1) * COL + (b - a) * GUT

    o = []
    # 先立网格：12 列、边距 72、列间 12，列带淡淡地露出来
    for i in range(12):
        o.append(rect(cx(i), 0, COL, H, 0, INK, 'opacity=".045"'))
    for x in (MARGIN, W - MARGIN):
        o.append(line(x, 0, x, H, INK, 1.2, 'stroke-dasharray="6 6" opacity=".45"'))
    o.append(text(MARGIN + 8, 24, 'MARGIN 72', 'm', 13, 400, GREY))
    o.append(text(W - MARGIN - 8, 24, 'MARGIN 72', 'm', 13, 400, GREY, 'end'))

    # 页眉
    o.append(text(MARGIN, 80, '● Design Style · 布局 03', 'm', 20, 400, INK))
    o.append(text(W - MARGIN, 80, '12 COL · GUTTER 12', 'm', 20, 400, INK, 'end'))

    # 左边距里的竖排字（本身就破了边距）
    o.append(text(0, 0, 'BREAK THE GRID — 先立网格，再破格', 'm', 17, 400, GREY, 'middle', 3,
                  'transform="translate(40 700) rotate(-90)"'))

    # 照片：被网格定位，再互相压住
    p1 = (cx(0), 640, span(0, 4), 430)
    p2 = (cx(4), 760, span(4, 8), 430)
    p3 = (800, 740, W - 800, 260)  # 冲出右边距，出血到画面边缘
    o.append(d.photo('stairs', *p1, pos='xMidYMid'))
    o.append(rect(p2[0] - 8, p2[1] - 8, p2[2] + 16, p2[3] + 16, 0, PAPER))
    o.append(d.photo('tokyo', *p2, pos='xMidYMid'))
    o.append(d.photo('citrus', *p3))

    # 巨字：Broken 从左边距冲出去，Grid 压在照片上面
    o.append(text(22, 400, 'Broken', 'bo', 300, 800, INK, ls=-10, extra='font-style="italic"'))
    o.append(text(444, 640, 'Grid', 'bo', 280, 800, INK, ls=-8))

    # 标注：左边冲出了 50px
    o.append(line(22, 438, MARGIN, 438, INK, 2))
    o.append(line(22, 428, 22, 448, INK, 2))
    o.append(line(MARGIN, 428, MARGIN, 448, INK, 2))
    o.append(rect(76, 421, 66, 34, 0, LIME))
    o.append(text(109, 444, '−50', 'm', 18, 700, INK, 'middle'))

    # 中文标题 + 一句话
    o.append(text(MARGIN, 530, '破格布局', 's', 84, 800, INK, ls=-2))
    o.append(text(MARGIN, 578, '先立一张严格的网格，', 'c', 24, 500, INK))
    o.append(text(MARGIN, 610, '再让一两个元素冲出去。', 'c', 24, 500, INK))

    # 荧光黄色块：压在两张照片的交界，写“只破一两处”
    lx, ly, lw, lh = 700, 664, 308, 128
    o.append(rect(lx, ly, lw, lh, 0, LIME))
    o.append(text(lx + 20, ly + 44, 'RULE 02', 'm', 17, 700, INK))
    o.append(text(lx + 20, ly + 96, '只破一两处', 'c', 42, 900, INK))

    # 三条小注释：z-index、重叠、出血
    o.append(text(800, 1024, 'bleed →  出血到画面边缘', 'm', 15, 400, GREY))
    o.append(text(800, 1180, '← z-index: 2', 'm', 15, 400, GREY))

    # 五条规则
    rules = [('01', '先立网格'), ('02', '只破一两处'), ('03', '重叠分层'), ('04', '同向破格'), ('05', '手机回单列')]
    o.append(line(MARGIN, 1236, W - MARGIN, 1236, INK, 2))
    for i, (n, t) in enumerate(rules):
        x = MARGIN + i * (W - 2 * MARGIN) / 5
        o.append(text(x, 1272, n, 'm', 18, 700, INK))
        o.append(text(x + 38, 1274, t, 'c', 24, 700, INK))
    o.append(text(MARGIN, 1322, '@guanmo_ai · github.com/guanmo-ai/design-style', 'm', 17, 400, GREY))
    return d.render('\n'.join(o))


# ═══════════════════════════════ C · 层叠布局 Stacked Cards ═══════════════════════════════
def poster_stack():
    BG, WHITE = '#0D0E12', '#F5F3EE'
    cols = ['#FF6B4A', '#FFD84D', '#7BE0B0', '#B9A7FF', WHITE]  # 后 → 前
    INK = '#14141A'
    style = """
    <style>
      .d { font-family: 'Inter Display', 'Noto Sans SC', sans-serif; }
      .t { font-family: 'Inter', 'Noto Sans SC', sans-serif; }
      .m { font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, monospace; }
      .c { font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif; }
    </style>"""
    d = Doc('c-stack', '层叠布局 Stacked Cards', style, BG)
    d.defs.append('<radialGradient id="glow" cx="78%" cy="8%" r="70%"><stop offset="0" stop-color="#3A3F9E" stop-opacity=".55"/><stop offset="1" stop-color="#0D0E12" stop-opacity="0"/></radialGradient>')
    d.defs.append('<filter id="up" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="-14" stdDeviation="16" flood-color="#000" flood-opacity=".5"/></filter>')
    o = [f'<rect width="{W}" height="{H}" fill="url(#glow)"/>']

    # 页眉与标题
    o.append(text(72, 96, 'Design Style  布局 03', 't', 24, 500, '#8B8D96'))
    o.append(text(W - 72, 96, '2012 —', 'm', 22, 400, '#8B8D96', 'end'))
    o.append(text(66, 330, 'Stack', 'd', 270, 700, '#F5F3EE', ls=-12))
    o.append(text(72, 408, '层叠布局', 'c', 70, 900, '#F5F3EE'))
    o.append(text(W - 72, 380, '后一张压住前一张，', 'c', 26, 500, '#C8CAD2', 'end'))
    o.append(text(W - 72, 416, '只露一条边。', 'c', 26, 500, '#C8CAD2', 'end'))

    # 五张卡：后 → 前；每张露出 76px，宽度每后退一层缩小 4%
    TOP, STEP, BOTTOM = 470, 76, 1270
    titles = [('01', '叠放顺序 = 阅读顺序'), ('02', '每张只露一条边'), ('03', '越靠后，越小越暗'),
              ('04', '步长固定，不抖'), ('05', '用 sticky 实现')]
    n = 5
    for i in range(n):
        k = n - 1 - i  # 离最前面几层
        sc = 1 - .04 * k
        w = (W - 144) * sc
        x = (W - w) / 2
        y = TOP + i * STEP
        col = mix(cols[i], BG, .07 * k)
        o.append(f'<g filter="url(#up)">' + rect(x, y, w, BOTTOM - y, 44, col) + '</g>')
        tc = INK
        if i < n - 1:
            o.append(text(x + 40, y + 50, titles[i][0], 'm', 20, 700, tc, extra='opacity=".8"'))
            o.append(text(x + 96, y + 52, titles[i][1], 'c', 28, 700, tc))
            o.append(text(x + w - 40, y + 50, f'scale {sc:.2f}', 'm', 18, 700, tc, 'end', extra='opacity=".8"'))
    # 前一张的内容：CSS + 步长标注
    i, k = n - 1, 0
    y = TOP + i * STEP
    x, w = 72, W - 144
    o.append(text(x + 40, y + 50, '05', 'm', 20, 700, INK, extra='opacity=".6"'))
    o.append(text(x + 96, y + 52, titles[4][1], 'c', 28, 700, INK))
    o.append(text(x + w - 40, y + 50, 'scale 1.00', 'm', 18, 500, INK, 'end', extra='opacity=".6"'))
    code = [(0, '.card {'), (1, 'position: sticky;'), (1, 'top: calc(var(--i) * 76px);'),
            (1, 'transform: scale(calc(1 - var(--k) * .04));'), (0, '}')]
    cy = y + 118
    o.append(rect(x + 40, cy - 34, w - 80, 214, 20, INK))
    for j, (ind, ln) in enumerate(code):
        o.append(text(x + 70 + ind * 30, cy + 14 + j * 36, ln, 'm', 22, 500, '#E9E7E0'))
    # 三个参数：步长 / 缩放 / 张数
    chips = [('76px', '每层露出 = 步长'), ('−4%', '每退一层缩小'), ('≤ 5', '叠放的张数')]
    cw = (w - 80 - 2 * 20) / 3
    for j, (big, cap) in enumerate(chips):
        cx_ = x + 40 + j * (cw + 20)
        o.append(rect(cx_, 1098, cw, 130, 20, mix(WHITE, INK, .07)))
        o.append(text(cx_ + 26, 1160, big, 'd', 52, 700, INK))
        o.append(text(cx_ + 26, 1202, cap, 'c', 21, 500, mix(WHITE, INK, .62)))
    o.append(text(72, 1316, '@guanmo_ai · github.com/guanmo-ai/design-style', 'm', 18, 400, '#8B8D96'))
    return d.render('\n'.join(o))


if __name__ == '__main__':
    save('a-split.svg', poster_split())
    save('b-broken.svg', poster_broken())
    save('c-stack.svg', poster_stack())
