"""
布局 03 · 分屏布局 Split Screen —— 四张布局图（1080×1350）的生成脚本

  poster.svg      一张海报，认识分屏（海报本身就是一幅 61.8 : 38.2 的分屏，“Split”被中线劈成两种颜色）
  cheatsheet.svg  速查卡：三种比例、断点、五条规则、CSS、色板、无障碍（反过来：左窄右宽 38.2 : 61.8）
  compare.svg     分屏 ≠ 两栏：同样两块内容，分屏 / 两栏网页 / 侧栏 / 便当盒四种排法
  templates.svg   拿来就用的三套分屏：登录页 50:50 · 产品首屏 62:38 · 后台 / 文档 70:30（各配手机叠放版）

生成的 SVG 是普通可读的源文件（带注释），可以直接改；改完再跑 scripts/build_images.py 内嵌字体和照片、导出 PNG。
用法：python3 layouts/03-split-screen/images/make_svgs.py && python3 scripts/build_images.py layouts/03-split-screen/images
"""
import os
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))
PHOTOS = '../../../public/02-masonry/photos'  # 照片沿用布局 02 的 AI 生成照片
W, H = 1080, 1350

# 颜色（与 tokens.ts 一致）
INK, PAPER, BLUE, PERI, GREY, MUTE = '#0E0E10', '#F1EDE4', '#2B35FF', '#8E95FF', '#6B675E', '#8A877F'
GOLD = 0.618

STYLE = """
    <style>
      .a { font-family: 'Archivo', 'Noto Sans SC', sans-serif; }
      .m { font-family: 'Space Mono', 'Noto Sans SC', monospace; }
      .c { font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif; }
    </style>"""


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
                f'  <!-- Design Style · 布局 03 · 分屏布局 Split Screen —— {self.title} / 1080×1350（由 make_svgs.py 生成） -->\n'
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




def twidth(s, size):
    """估算文字宽度：中文 1 个字号，拉丁字母 / 数字 0.6 个字号"""
    return sum(size if ord(ch) > 0x2E80 else size * 0.6 for ch in s)


def wire_lines(x, y, w, n, gap, fill, h=8, widths=(0.9, 0.62, 0.78, 0.5, 0.7, 0.84), op=1):
    return ''.join(rect(x, y + i * gap, w * widths[i % len(widths)], h, 0, fill, f'opacity="{op}"') for i in range(n))


def phone(x, y, w, h, stroke=INK, fill=PAPER, r=18):
    return rect(x, y, w, h, r, fill, f'stroke="{stroke}" stroke-width="3"') + rect(x + w / 2 - 18, y + 7, 36, 7, 3.5, stroke)


# ═══════════════════════════════ 01 · 海报 ═══════════════════════════════
def poster():
    SPLIT = round(W * GOLD)  # 668
    d = Doc('poster', '一张海报，认识分屏', STYLE, INK)
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
    o.append(text(72, 696, 'Split Screen · 一条中线，两种声音', 'm', 21, 400, PERI))
    o.append(text(704, 566, '左边说话，', 'c', 38, 700, PAPER))
    o.append(text(704, 616, '右边给证据。', 'c', 38, 700, PAPER))

    # 左：五条规则
    o.append(text(72, 762, '五条规则', 'm', 20, 700, PERI, ls=3))
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
        o.append(text(72, y, n, 'm', 22, 700, PERI))
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

    o.append(text(72, 1304, '@guanmo_ai · github.com/guanmo-ai/design-style', 'm', 19, 400, mix(INK, PAPER, .55)))
    return d.render('\n'.join(o))


# ═══════════════════════════════ 02 · 速查卡（反过来：38.2 : 61.8） ═══════════════════════════════
def cheatsheet():
    SPLIT = round(W * (1 - GOLD))  # 412
    d = Doc('cheatsheet', '速查：比例、断点、规则、CSS、色板、无障碍', STYLE, PAPER)
    o = [rect(0, 0, SPLIT, H, 0, BLUE)]
    L = 52  # 左半内边距
    R0 = SPLIT + 56  # 右半左边界

    # ── 左（蓝）：数字
    o.append(text(L, 96, 'Design Style', 'm', 20, 400, mix(BLUE, PAPER, .75)))
    o.append(text(L, 126, '布局 03 · 速查', 'c', 24, 700, PAPER))
    o.append(text(L - 4, 300, '61.8', 'a', 140, 900, PAPER, ls=-6))
    o.append(text(L, 346, '黄金分割：默认的中线位置', 'c', 20, 500, PAPER))
    o.append(text(L, 372, '1 : 1.618，左大右小或反过来都行', 'c', 16, 400, mix(BLUE, PAPER, .8)))

    o.append(text(L, 460, '三种比例', 'm', 18, 700, PAPER, ls=3))
    o.append(line(L, 476, SPLIT - L, 476, mix(BLUE, PAPER, .45), 1.5))
    bw = SPLIT - 2 * L
    y = 500
    for a, nm, css in [(.5, '50 : 50  对等', '1fr 1fr'), (.618, '62 : 38  主次', '1.618fr 1fr'), (.7, '70 : 30  内容 + 侧栏', '7fr 3fr')]:
        o.append(rect(L, y, bw * a, 22, 0, INK))
        o.append(rect(L + bw * a, y, bw * (1 - a), 22, 0, PAPER))
        o.append(text(L, y + 50, nm, 'c', 19, 700, PAPER))
        o.append(text(L, y + 74, css, 'm', 15, 400, mix(BLUE, PAPER, .8)))
        y += 112

    o.append(text(L, 862, '断点', 'm', 18, 700, PAPER, ls=3))
    o.append(line(L, 878, SPLIT - L, 878, mix(BLUE, PAPER, .45), 1.5))
    o.append(text(L - 2, 984, '768', 'a', 110, 900, PAPER, ls=-4))
    o.append(text(L + 4, 1018, 'px · 窄过它，左右叠成上下', 'c', 19, 500, PAPER))
    o.append(text(L + 4, 1044, '@media (max-width: 767px)', 'm', 15, 400, mix(BLUE, PAPER, .8)))

    o.append(text(L, 1112, '色板', 'm', 18, 700, PAPER, ls=3))
    o.append(line(L, 1128, SPLIT - L, 1128, mix(BLUE, PAPER, .45), 1.5))
    sw = (bw - 20) / 3
    for i, (c, nm, hx) in enumerate([(INK, '墨', '#0E0E10'), (PAPER, '纸', '#F1EDE4'), (BLUE, '蓝', '#2B35FF')]):
        x = L + i * (sw + 10)
        o.append(rect(x, 1148, sw, 64, 0, c, f'stroke="{PAPER}" stroke-width="2"'))
        o.append(text(x, 1236, nm, 'c', 17, 700, PAPER))
        o.append(text(x, 1258, hx, 'm', 13, 400, mix(BLUE, PAPER, .8)))
    o.append(text(L, 1304, '墨 / 纸 16.5 : 1 · 纸 / 蓝 5.9 : 1', 'm', 14, 400, mix(BLUE, PAPER, .8)))

    # ── 右（纸）：规则、代码、无障碍
    o.append(text(R0, 96, '分屏布局 速查', 'c', 40, 900, INK))
    o.append(text(R0, 130, '一条中线，两种声音；左边说话，右边给证据', 'c', 18, 500, GREY))
    o.append(line(R0, 156, W - 56, 156, INK, 3))
    rules = [
        ('01', '只有一条中线', '不加阴影和描边，让色块自己说话'),
        ('02', '比例要有意思', '对等 50:50 · 主次 62:38 · 侧栏 70:30'),
        ('03', '两边要有反差', '明暗 / 图文 / 静动，一次只选一对'),
        ('04', '一边固定，一边滚', '固定的一半 sticky，滚的一半放长内容'),
        ('05', '手机上叠成上下', '文字在上，一屏只讲一件事；DOM 顺序 = 阅读顺序'),
    ]
    y = 206
    for n, t, s in rules:
        o.append(text(R0, y, n, 'm', 19, 700, BLUE))
        o.append(text(R0 + 44, y + 1, t, 'c', 26, 800, INK))
        o.append(text(R0 + 44, y + 30, s, 'c', 16, 400, GREY))
        y += 76

    # CSS
    cy = 606
    cw = W - 56 - R0
    o.append(rect(R0, cy, cw, 338, 0, INK))
    o.append(text(R0 + 20, cy + 32, 'CSS', 'm', 14, 700, PERI, ls=3))
    code = [
        (0, '.split {', PAPER),
        (1, 'display: grid;', PAPER),
        (1, 'grid-template-columns: 1.618fr 1fr;', PERI),
        (1, 'min-height: 100svh;', PAPER),
        (0, '}', PAPER),
        (0, '.split > :first-child {  /* 固定的一半 */', PAPER),
        (1, 'position: sticky; top: 0; height: 100svh;', PERI),
        (0, '}', PAPER),
        (0, '@media (max-width: 767px) {', PAPER),
        (1, '.split { grid-template-columns: 1fr; }', PERI),
        (0, '}', PAPER),
    ]
    for i, (ind, ln, col) in enumerate(code):
        o.append(text(R0 + 20 + ind * 22, cy + 66 + i * 26, ln, 'm', 15, 400, col))

    # 无障碍
    ay = 1020
    o.append(text(R0, ay, '别忘了', 'm', 18, 700, BLUE, ls=3))
    o.append(line(R0, ay + 14, W - 56, ay + 14, INK, 1.5))
    for i, (t, s) in enumerate([
        ('阅读顺序', '叠起来后谁在上，就把谁写在 HTML 前面'),
        ('对比度', '每一半的文字与底色 ≥ 4.5 : 1（WCAG AA）'),
        ('不只靠颜色', '两半之间加标题或标签，色盲也分得清'),
        ('别把重点放中线', '中线是分界，不是放按钮和关键数字的地方'),
    ]):
        yy = ay + 52 + i * 46
        o.append(rect(R0, yy - 17, 12, 12, 0, BLUE))
        o.append(text(R0 + 26, yy - 4, t, 'c', 18, 800, INK))
        o.append(text(R0 + 26 + twidth(t, 18) + 14, yy - 4, s, 'c', 15, 400, GREY))
    o.append(text(R0, 1304, '@guanmo_ai · github.com/guanmo-ai/design-style', 'm', 15, 400, GREY))
    return d.render('\n'.join(o))


# ═══════════════════════════════ 03 · 分屏 ≠ 两栏 ═══════════════════════════════
def compare():
    d = Doc('compare', '分屏 ≠ 两栏：同样两块内容，四种排法', STYLE, PAPER)
    o = []
    M = 72
    o.append(text(M, 96, 'Design Style · 布局 03', 'm', 21, 400, GREY))
    o.append(text(W - M, 96, '分屏 vs 两栏 / 侧栏 / 便当盒', 'c', 21, 500, GREY, 'end'))
    o.append(text(M - 4, 238, '分屏 ≠ 两栏', 'c', 118, 900, INK, ls=-3))
    o.append(text(M, 296, '同样两块内容，四种排法：区别不在“两块”，在“边到不到边、谁先谁后”。', 'c', 24, 500, GREY))

    cw, chh = 456, 270
    cells = [(M, 350), (M + 480, 350), (M, 812), (M + 480, 812)]

    # ① 分屏：满幅、没缝、各自一个颜色（本期）
    x, y = cells[0]
    o.append(rect(x - 8, y - 8, cw + 16, chh + 164, 0, 'none', f'stroke="{BLUE}" stroke-width="3"'))
    o.append(rect(x, y, cw * GOLD, chh, 0, INK))
    o.append(rect(x + cw * GOLD, y, cw * (1 - GOLD), chh, 0, BLUE))
    o.append(text(x + 22, y + 120, 'Split', 'a', 84, 900, PAPER, ls=-3))
    o.append(text(x + 22, y + 170, '左边说话', 'c', 22, 700, PAPER))
    o.append(text(x + cw * GOLD + 18, y + 170, '右边证据', 'c', 22, 700, PAPER))
    o.append(line(x + cw * GOLD, y - 6, x + cw * GOLD, y + chh + 6, PAPER, 2))
    o.append(rect(x + cw * GOLD - 32, y + chh + 10, 64, 26, 0, BLUE))
    o.append(text(x + cw * GOLD, y + chh + 29, '0 px', 'm', 15, 700, PAPER, 'middle'))
    o.append(text(x, y + chh + 76, '01 分屏 Split Screen', 'c', 26, 900, BLUE))
    o.append(text(x, y + chh + 108, '边到边、没有缝：每一半是一个整块', 'c', 18, 500, INK))
    o.append(text(x, y + chh + 134, '比例用百分比，中线是全页唯一的线', 'c', 16, 400, GREY))

    # ② 两栏网页：有边距、有间距，是一篇文章的两列
    x, y = cells[1]
    o.append(rect(x, y, cw, chh, 0, '#E4E0D5'))
    cwid = 360
    cx0 = x + (cw - cwid) / 2
    o.append(rect(cx0, y + 24, cwid, chh - 48, 0, PAPER))
    colw = (cwid - 48 - 24) / 2
    o.append(wire_lines(cx0 + 24, y + 54, colw, 9, 22, INK, 8, op=.28))
    o.append(wire_lines(cx0 + 24 + colw + 24, y + 54, colw, 9, 22, INK, 8, op=.28))
    o.append(rect(cx0 + 24, y + 36, colw * .5, 10, 0, INK))
    o.append(rect(cx0 + 24 + colw + 24, y + 36, colw * .5, 10, 0, INK))
    for gx in (x, x + cw - (cw - cwid) / 2):
        o.append(rect(gx + 2, y + chh / 2 - 12, (cw - cwid) / 2 - 4, 24, 0, 'none'))
    o.append(text(x + (cw - cwid) / 4, y + chh / 2 + 5, '边距', 'c', 14, 700, GREY, 'middle'))
    o.append(text(x + cw - (cw - cwid) / 4, y + chh / 2 + 5, '边距', 'c', 14, 700, GREY, 'middle'))
    o.append(text(cx0 + 24 + colw + 12, y + chh - 8, '间距', 'c', 14, 700, GREY, 'middle'))
    o.append(text(x, y + chh + 46, '02 两栏网页 Two columns', 'c', 26, 900, INK))
    o.append(text(x, y + chh + 78, '有边距、有间距：读文章的两列', 'c', 18, 500, INK))
    o.append(text(x, y + chh + 104, '最大宽度 + 居中；不是满幅', 'c', 16, 400, GREY))

    # ③ 侧栏：固定宽度 + 弹性内容
    x, y = cells[2]
    o.append(rect(x, y, cw, chh, 0, PAPER, f'stroke="{INK}" stroke-width="3"'))
    o.append(rect(x, y, 112, chh, 0, INK))
    o.append(wire_lines(x + 16, y + 30, 80, 8, 30, PAPER, 9, widths=(1, .8, .9, .7), op=.8))
    o.append(rect(x + 16, y + 30, 80, 9, 0, BLUE))
    for i in range(3):
        o.append(rect(x + 136 + i * 104, y + 28, 92, 70, 0, INK, 'opacity=".12"'))
    o.append(rect(x + 136, y + 120, 308, 126, 0, INK, 'opacity=".12"'))
    o.append(line(x, y + chh + 12, x + 112, y + chh + 12, INK, 2))
    o.append(text(x + 56, y + chh + 34, '240 px', 'm', 14, 700, INK, 'middle'))
    o.append(text(x, y + chh + 76, '03 侧栏 Sidebar', 'c', 26, 900, INK))
    o.append(text(x, y + chh + 108, '固定宽度 + 弹性内容：导航是工具', 'c', 18, 500, INK))
    o.append(text(x, y + chh + 134, '像素宽度；不是两个并列的主角', 'c', 16, 400, GREY))

    # ④ 便当盒：很多格
    x, y = cells[3]
    gap = 12
    cwid = (cw - 2 * gap) / 3
    layout = [(0, 0, 2, 2), (2, 0, 1, 1), (2, 1, 1, 1), (0, 2, 1, 1), (1, 2, 2, 1)]
    ch3 = (chh - 2 * gap) / 3
    for (cx, cy, sx, sy), fill in zip(layout, [INK, BLUE, INK, BLUE, INK]):
        o.append(rect(x + cx * (cwid + gap), y + cy * (ch3 + gap), sx * cwid + (sx - 1) * gap, sy * ch3 + (sy - 1) * gap, 18, fill, 'opacity=".9"' if fill == INK else ''))
    o.append(text(x, y + chh + 46, '04 便当盒 Bento Grid', 'c', 26, 900, INK))
    o.append(text(x, y + chh + 78, '很多格：一格一事，面积表示主次', 'c', 18, 500, INK))
    o.append(text(x, y + chh + 104, '见布局 01；分屏只有“两块”', 'c', 16, 400, GREY))

    # 底部结论
    o.append(rect(0, 1252, W, 98, 0, INK))
    o.append(text(M, 1312, '分屏：不是两列，是两个舞台。', 'c', 34, 900, PAPER))
    o.append(text(W - M, 1312, '@guanmo_ai', 'm', 18, 400, MUTE, 'end'))
    return d.render('\n'.join(o))


# ═══════════════════════════════ 04 · 三套模板 ═══════════════════════════════
def templates():
    d = Doc('templates', '拿来就用：三套分屏（桌面 + 手机）', STYLE, PAPER)
    o = []
    M = 72
    o.append(text(M, 96, 'Design Style · 布局 03', 'm', 21, 400, GREY))
    o.append(text(W - M, 96, '桌面 + 手机，各三套', 'c', 21, 500, GREY, 'end'))
    o.append(text(M - 2, 190, '拿来就用：三套分屏', 'c', 72, 900, INK, ls=-2))

    dw, dh = 520, 292
    rows = [(238, '50 : 50', '登录 · 注册', '品牌图 + 表单，两边一样重', '1fr 1fr'), (582, '62 : 38', '产品首屏', '大图 + 一句话，图是主角', '1.618fr 1fr'), (926, '70 : 30', '后台 · 文档', '内容 + 侧栏，侧栏是工具', '7fr 3fr')]
    for k, (y, ratio, name, use, css) in enumerate(rows):
        # 左：说明
        o.append(text(M, y + 66, ratio, 'a', 62, 900, BLUE, ls=-2))
        o.append(text(M, y + 112, name, 'c', 30, 900, INK))
        o.append(text(M, y + 146, use, 'c', 16, 400, GREY))
        o.append(rect(M, y + 172, 196, 30, 0, INK))
        o.append(text(M + 10, y + 193, css, 'm', 14, 400, PAPER))
        o.append(text(M, y + 232, 'min-height: 100svh', 'm', 13, 400, GREY))
        o.append(text(M, y + 256, '手机 < 768px → 叠成上下', 'c', 14, 700, BLUE))

        dx = 300
        a = [.5, GOLD, .7][k]
        lw = dw * a
        # 桌面
        o.append(rect(dx - 2, y - 2, dw + 4, dh + 4, 0, 'none', f'stroke="{INK}" stroke-width="3"'))
        if k == 0:  # 登录：左品牌图（蓝），右表单（纸）
            o.append(rect(dx, y, lw, dh, 0, BLUE))
            o.append(f'<circle cx="{f(dx + lw / 2)}" cy="{f(y + 120)}" r="64" fill="{PAPER}"/>')
            o.append(f'<circle cx="{f(dx + lw / 2 + 40)}" cy="{f(y + 170)}" r="48" fill="{INK}"/>')
            o.append(text(dx + 22, y + dh - 22, 'Split', 'a', 30, 900, PAPER))
            fx = dx + lw + 36
            o.append(rect(fx, y + 50, 90, 12, 0, INK))
            o.append(wire_lines(fx, y + 80, 150, 2, 18, INK, 7, widths=(1, .7), op=.3))
            for i in range(2):
                o.append(rect(fx, y + 126 + i * 48, dw - lw - 72, 34, 0, 'none', f'stroke="{INK}" stroke-width="2"'))
            o.append(rect(fx, y + 230, dw - lw - 72, 36, 0, BLUE))
            o.append(text(fx + (dw - lw - 72) / 2, y + 254, '登录', 'c', 16, 900, PAPER, 'middle'))
        elif k == 1:  # 产品首屏：左大图，右墨底文案
            o.append(d.photo('stairs', dx, y, lw, dh, 0, 'xMidYMid'))
            o.append(rect(dx + lw, y, dw - lw, dh, 0, INK))
            fx = dx + lw + 22
            o.append(text(fx, y + 96, 'Less,', 'a', 36, 900, PAPER, ls=-1))
            o.append(text(fx, y + 134, 'but', 'a', 36, 900, PAPER, ls=-1))
            o.append(text(fx, y + 172, 'better.', 'a', 36, 900, PAPER, ls=-1))
            o.append(wire_lines(fx, y + 198, dw - lw - 44, 2, 16, PAPER, 6, widths=(1, .7), op=.5))
            o.append(rect(fx, y + 246, 96, 30, 0, BLUE))
        else:  # 后台：左内容，右墨底侧栏
            o.append(rect(dx, y, lw, dh, 0, PAPER))
            o.append(rect(dx + 20, y + 22, 120, 14, 0, INK))
            for i in range(3):
                o.append(rect(dx + 20 + i * 114, y + 56, 102, 62, 0, INK, 'opacity=".12"'))
            for i, hh in enumerate([60, 100, 78, 124, 90, 108]):
                o.append(rect(dx + 24 + i * 52, y + dh - 24 - hh, 36, hh, 0, BLUE if i == 3 else INK, '' if i == 3 else 'opacity=".75"'))
            o.append(rect(dx + lw, y, dw - lw, dh, 0, INK))
            sx = dx + lw + 18
            for i in range(5):
                o.append(rect(sx, y + 30 + i * 40, dw - lw - 36, 22, 0, BLUE if i == 1 else PAPER, 'opacity="1"' if i == 1 else 'opacity=".22"'))
        # 比例尺
        o.append(line(dx, y + dh + 18, dx + lw, y + dh + 18, INK, 2))
        o.append(line(dx + lw, y + dh + 18, dx + dw, y + dh + 18, BLUE, 2))
        o.append(text(dx + lw / 2, y + dh + 40, f'{round(a * 100)} %', 'm', 14, 700, INK, 'middle'))
        o.append(text(dx + lw + (dw - lw) / 2, y + dh + 40, f'{round((1 - a) * 100)} %', 'm', 14, 700, BLUE, 'middle'))

        # 手机：叠成上下
        px, pw, ph = 848, 160, 292
        o.append(phone(px, y, pw, ph))
        ix, iw = px + 10, pw - 20
        if k == 0:  # 登录：品牌图收成顶部横条，表单在下
            o.append(rect(ix, y + 24, iw, 52, 0, BLUE))
            o.append(f'<circle cx="{f(ix + iw / 2)}" cy="{f(y + 50)}" r="16" fill="{PAPER}"/>')
            o.append(rect(ix, y + 96, 70, 9, 0, INK))
            for i in range(2):
                o.append(rect(ix, y + 126 + i * 40, iw, 28, 0, 'none', f'stroke="{INK}" stroke-width="2"'))
            o.append(rect(ix, y + 214, iw, 30, 0, BLUE))
        elif k == 1:  # 文字在上，图在下
            o.append(rect(ix, y + 24, iw, 130, 0, INK))
            o.append(text(ix + 10, y + 70, 'Less,', 'a', 22, 900, PAPER, ls=-1))
            o.append(text(ix + 10, y + 96, 'but better.', 'a', 22, 900, PAPER, ls=-1))
            o.append(rect(ix + 10, y + 118, 64, 20, 0, BLUE))
            o.append(d.photo('stairs', ix, y + 160, iw, 100, 0, 'xMidYMid'))
        else:  # 侧栏变成顶部标签，内容在下
            o.append(rect(ix, y + 24, iw, 34, 0, INK))
            for i in range(3):
                o.append(rect(ix + 8 + i * 42, y + 34, 34, 14, 0, BLUE if i == 1 else PAPER, '' if i == 1 else 'opacity=".3"'))
            for i in range(2):
                o.append(rect(ix, y + 72 + i * 56, iw, 46, 0, INK, 'opacity=".12"'))
            for i, hh in enumerate([34, 62, 46, 70]):
                o.append(rect(ix + 8 + i * 32, y + ph - 22 - hh, 22, hh, 0, BLUE if i == 3 else INK, '' if i == 3 else 'opacity=".75"'))
        o.append(text(px + pw / 2, y + ph + 40, '< 768 px', 'm', 14, 700, BLUE, 'middle'))
    o.append(text(M, 1316, '@guanmo_ai · github.com/guanmo-ai/design-style', 'm', 17, 400, GREY))
    o.append(text(W - M, 1316, '桌面 520×292 · 手机 160×292（示意）', 'c', 15, 400, GREY, 'end'))
    return d.render('\n'.join(o))


def save(name, svg):
    with open(os.path.join(HERE, name), 'w', encoding='utf-8') as fh:
        fh.write(svg)
    print('wrote', name)


if __name__ == '__main__':
    save('poster.svg', poster())
    save('cheatsheet.svg', cheatsheet())
    save('compare.svg', compare())
    save('templates.svg', templates())
