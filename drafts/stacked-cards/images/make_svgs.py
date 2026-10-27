"""
布局候选 · 层叠布局 Stacked Cards —— 一张海报（1080×1350）
后一张压住前一张，只露一条边：用深度代替翻页。夜色 × 糖果色，Inter Display + JetBrains Mono。

布局 03 做的是分屏（见 layouts/03-split-screen）。这张是同一次三选一里落选的候选，留作下一期。
正式开做时：取下一个空期号，`git mv drafts/stacked-cards layouts/NN-name`，补第 2—4 张图、视频、配乐与文档（流程同 docs/MAKING_TEMPLATE.md）。

用法：python3 drafts/stacked-cards/images/make_svgs.py && python3 scripts/build_images.py drafts/stacked-cards/images
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
    save('poster.svg', poster_stack())
