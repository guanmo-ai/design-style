"""
布局候选 · 破格布局 Broken Grid —— 一张海报（1080×1350）
先立一张严格的 12 列网格，再让一两个元素冲出去。纸色 × 荧光黄，Bodoni 斜体 + 真实照片。

布局 03 做的是分屏（见 layouts/03-split-screen）。这张是同一次三选一里落选的候选，留作下一期。
正式开做时：取下一个空期号，`git mv drafts/broken-grid layouts/NN-name`，补第 2—4 张图、视频、配乐与文档（流程同 docs/MAKING_TEMPLATE.md）。

用法：python3 drafts/broken-grid/images/make_svgs.py && python3 scripts/build_images.py drafts/broken-grid/images
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
                f'  <!-- Design Style · 布局候选（落选于布局 03）· {self.title} / 1080×1350（由 make_svgs.py 生成） -->\n'
                f'  <defs>{self.style}\n    ' + '\n    '.join(self.defs) + '\n  </defs>\n'
                f'  <rect width="{W}" height="{H}" fill="{self.bg}"/>\n' + body + '</svg>\n')


def save(name, svg):
    with open(os.path.join(HERE, name), 'w', encoding='utf-8') as fh:
        fh.write(svg)
    print('wrote', name)


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


if __name__ == '__main__':
    save('poster.svg', poster_broken())
