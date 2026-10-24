"""
布局 03 · 卡片层叠 Card Stack —— 四张布局图（1080×1350）

  poster.svg     认识层叠：3–4 张，一张焦点（气质对齐选定海报）
  cheatsheet.svg 速查：五条规则 · 何时用 · 参数 · CSS
  compare.svg    层叠 vs 标签页 vs 走马灯 vs 网格
  templates.svg  三套：iOS sheet / Stripe 抽屉 / 任务队列

用法：python3 layouts/03-card-stack/images/make_svgs.py
"""
import os
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1350
M = 72
PAPER, CARD, INK, INK2 = '#F4F5F7', '#FFFFFF', '#0F172A', '#64748B'
ACCENT, CHIP, INK3 = '#2563EB', '#F1F5F9', '#94A3B8'

STYLE = """
    <style>
      .d { font-family: 'Inter Display', 'Noto Sans SC', sans-serif; }
      .t { font-family: 'Inter', 'Noto Sans SC', sans-serif; }
      .m { font-family: 'Geist Mono', 'SFMono-Regular', Menlo, monospace; }
      .c { font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif; }
    </style>"""

BASE_DEFS = """
    <filter id="soft" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#0F172A" flood-opacity=".08"/></filter>
    <filter id="lift" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="22" stdDeviation="28" flood-color="#0F172A" flood-opacity=".12"/></filter>
    <filter id="dim1"><feColorMatrix type="matrix" values="0.92 0 0 0 0  0 0.92 0 0 0  0 0 0.92 0 0  0 0 0 1 0"/></filter>
    <filter id="dim2"><feColorMatrix type="matrix" values="0.84 0 0 0 0  0 0.84 0 0 0  0 0 0.84 0 0  0 0 0 1 0"/></filter>
    <filter id="dim3"><feColorMatrix type="matrix" values="0.76 0 0 0 0  0 0.76 0 0 0  0 0 0.76 0 0  0 0 0 1 0"/></filter>"""


class Doc:
    def __init__(self, title):
        self.title = title
        self.defs = []
        self.n = 0

    def clip(self, x, y, w, h, r):
        self.n += 1
        cid = f'k{self.n}'
        self.defs.append(f'<clipPath id="{cid}"><rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{f(r)}"/></clipPath>')
        return cid

    def render(self, body):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">\n'
                f'  <!-- Design Style · 布局 03 · 卡片层叠 Card Stack —— {self.title} / 1080×1350 -->\n'
                f'  <defs>{STYLE}{BASE_DEFS}\n    ' + '\n    '.join(self.defs) + '\n  </defs>\n' + body + '</svg>\n')


def f(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.')


def rect(x, y, w, h, r=0, fill=CARD, extra=''):
    return f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{f(r)}" fill="{fill}" {extra}/>'


def text(x, y, s, cls='c', size=20, weight=400, fill=INK, anchor='start', ls=None, extra=''):
    lsp = f' letter-spacing="{f(ls)}"' if ls is not None else ''
    anc = f' text-anchor="{anchor}"' if anchor != 'start' else ''
    return f'<text x="{f(x)}" y="{f(y)}" class="{cls}" font-size="{f(size)}" font-weight="{weight}" fill="{fill}"{anc}{lsp} {extra}>{escape(s)}</text>'


def twidth(s, size):
    return sum(size if ord(ch) > 0x2E80 else size * (0.3 if ch == ' ' else 0.58) for ch in s)


def sheet_face(x, y, w, h, r, title, sub, kind='bars', accent=ACCENT, kicker='04'):
    o = [rect(x, y, w, h, r, CARD)]
    o.append(f'<circle cx="{f(x + 28)}" cy="{f(y + 30)}" r="6" fill="{accent}"/>')
    o.append(text(x + 42, y + 35, title, 't', 15, 600, INK2))
    o.append(text(x + w - 28, y + 35, kicker, 'm', 12, 500, INK3, 'end'))
    o.append(text(x + 28, y + 68, sub, 'c', 20, 700, INK))
    o.append(rect(x + 28, y + 86, w - 56, 1, 0, 'rgba(15,23,42,.08)'))
    cw = (w - 68) / 2
    o.append(rect(x + 28, y + 100, cw, 44, 10, CHIP))
    o.append(rect(x + 40 + cw, y + 100, cw, 44, 10, CHIP))
    if kind == 'bars':
        bars = [0.36, 0.5, 0.3, 0.68, 0.4, 1, 0.44]
        bh = h - 168
        bw = (w - 72) / len(bars)
        for i, p in enumerate(bars):
            hh = max(8, bh * p)
            o.append(rect(x + 32 + i * bw, y + h - 24 - hh, bw - 8, hh, 3, accent if i == 5 else '#D9DEE7'))
    elif kind == 'spark':
        pts = [(0.0, 0.7), (0.2, 0.62), (0.4, 0.48), (0.6, 0.4), (0.8, 0.28), (1, 0.18)]
        d = []
        for i, (px, py) in enumerate(pts):
            d.append(f'{"M" if i == 0 else "L"}{f(x + 32 + px * (w - 64))} {f(y + 168 + py * (h - 196))}')
        o.append(f'<path d="{" ".join(d)}" fill="none" stroke="{accent}" stroke-width="2.4" stroke-linecap="round"/>')
    else:
        o.append(rect(x + 28, y + 160, w - 56, 8, 4, '#E6EAF0'))
        o.append(rect(x + 28, y + 160, (w - 56) * 0.57, 8, 4, accent))
    return ''.join(o)


def stack(cx, cy, w, h, n=4, lift=14, rot=-1.2, titles=None, kinds=None, r=22):
    titles = titles or ['Focusus', 'Inbox', 'Sprint', 'Revenue']
    kinds = kinds or ['bars', 'people', 'progress', 'spark']
    o = []
    for i in range(n - 1, -1, -1):
        x = cx - w / 2 - i * 16
        y = cy - h / 2 - i * 26 - (lift if i == 0 else 0)
        extra = f'filter="url(#{["lift", "dim1", "dim2", "dim3"][min(i, 3)]})"'
        if i == 0:
            o.append(f'<g transform="rotate({rot} {f(cx)} {f(cy)})" {extra}>')
            o.append(sheet_face(x, y, w, h, r, titles[i], 'This week' if i == 0 else titles[i], kinds[min(i, 2)], kicker=['04', '12', '24', '$'][min(i, 3)]))
            o.append('</g>')
        else:
            o.append(f'<g {extra}>')
            o.append(rect(x, y, w, h, r, CARD))
            o.append('</g>')
    return ''.join(o)


# =====================================================================
def poster():
    d = Doc('海报')
    b = [rect(0, 0, W, H, 0, PAPER)]
    b.append(f'<circle cx="{M + 5}" cy="96" r="5" fill="{ACCENT}"/>')
    b.append(text(M + 20, 103, 'Design Style · 布局 03', 'm', 18, 500, INK2))
    b.append(text(W - M, 103, 'iOS sheet · Stripe dashboard', 't', 16, 500, INK3, 'end'))
    b.append(text(M - 4, 210, 'CARD STACK', 'd', 86, 700, INK, ls=-3))
    b.append(text(M, 278, '卡片层叠', 'c', 42, 700, INK, ls=3))
    b.append(text(M, 330, '3–4 张。一张在焦点。', 'c', 22, 500, INK2))
    # 层叠
    b.append(stack(W / 2 + 20, 760, 620, 280, 4, lift=18, rot=-1.2, r=26))
    b.append(text(W / 2, 980, 'Focus the top sheet. Dim what sits behind.', 't', 18, 500, INK2, 'middle'))
    b.append(text(M, 1088, '3–4 sheets. One in focus.', 'd', 28, 600, INK))
    b.append(text(M, 1136, '后层轻轻压暗、顶部微抬、微旋——', 'c', 22, 400, INK2))
    b.append(text(M, 1172, '像 iOS sheet，也像 Stripe 的抽屉。', 'c', 22, 400, INK2))
    b.append(text(W / 2, H - 56, '@guanmo_ai   ·   github.com/guanmo-ai/design-style', 'm', 15, 400, INK3, 'middle'))
    return d.render('\n'.join('  ' + x for x in b) + '\n')


def cheatsheet():
    d = Doc('速查卡')
    b = [rect(0, 0, W, H, 0, PAPER)]
    b.append(f'<circle cx="{M + 5}" cy="96" r="5" fill="{ACCENT}"/>')
    b.append(text(M + 20, 103, '布局 03 · 速查卡', 'c', 18, 500, INK2, ls=1))
    b.append(text(M - 2, 188, 'Card Stack', 'd', 64, 700, INK, ls=-2))
    b.append(text(M + 420, 186, '一页记住', 'c', 32, 700, INK2))

    def card(x, y, w, h, title, sub=None):
        o = [rect(x, y, w, h, 20, CARD, 'filter="url(#soft)"')]
        o.append(text(x + 28, y + 48, title, 'c', 22, 700, INK))
        if sub:
            o.append(text(x + w - 28, y + 48, sub, 'm', 13, 400, INK3, 'end'))
        return o

    y0, gap = 236, 18
    # 规则
    R = [('只叠 3–4 张', '第五张开始，后面只是噪声'),
         ('一张焦点', '同时被读的永远只有最上面'),
         ('轻轻抬起 8–16px', '离开平面，不要飞出屏幕'),
         ('微旋 1–2°', '让层叠能被眼睛感觉到'),
         ('后层压暗 8–12%', '可加 0.5px 景深模糊')]
    b.extend(card(M, y0, W - 2 * M, 430, '五条规则', 'focus first'))
    for k, (t, s) in enumerate(R):
        yy = y0 + 86 + k * 64
        b.append(text(M + 32, yy, f'0{k + 1}', 'm', 16, 500, ACCENT))
        b.append(text(M + 80, yy, t, 'c', 22, 700, INK))
        b.append(text(M + 80, yy + 26, s, 'c', 16, 400, INK2))

    # 何时 / 参数
    y1 = y0 + 430 + gap
    cw = (W - 2 * M - gap) / 2
    b.extend(card(M, y1, cw, 280, '何时用'))
    for k, s in enumerate(['任务队列 / Inbox', 'iOS 底部弹层', '详情抽屉', '不要：要对齐比较的表']):
        b.append(text(M + 32, y1 + 92 + k * 40, '·  ' + s, 'c', 17, 400 if k < 3 else 500, INK if k < 3 else INK2))
    b.extend(card(M + cw + gap, y1, cw, 280, '参数', 'tokens'))
    rows = [('张数', '3–4'), ('圆角', '24–32'), ('抬起', '8–16px'), ('旋转', '1–2°'), ('压暗', '8–12% / 层')]
    for k, (n, v) in enumerate(rows):
        yy = y1 + 88 + k * 34
        b.append(text(M + cw + gap + 28, yy, n, 'c', 16, 400, INK2))
        b.append(text(M + 2 * cw + gap - 28, yy, v, 'm', 16, 500, INK, 'end'))

    y2 = y1 + 280 + gap
    b.extend(card(M, y2, W - 2 * M, 250, 'CSS', '.card-stack'))
    code = ['position: relative;  perspective: 1600px;',
            'nth-child(1) { translateY(-12px) rotate(-1.2deg); }',
            'nth-child(n+2) { scale(.97); filter: brightness(.92); }',
            'nth-child(n+5) { display: none; }']
    for k, line in enumerate(code):
        b.append(text(M + 32, y2 + 92 + k * 32, line, 'm', 16, 400, ACCENT if k == 3 else INK))
    return d.render('\n'.join('  ' + x for x in b) + '\n')


def compare():
    d = Doc('对照')
    b = [rect(0, 0, W, H, 0, PAPER)]
    b.append(f'<circle cx="{M + 5}" cy="96" r="5" fill="{ACCENT}"/>')
    b.append(text(M + 20, 103, '布局 03 · 别用错', 'c', 18, 500, INK2, ls=1))
    b.append(text(M - 2, 190, '同一组内容，四种排法', 'c', 44, 800, INK, ls=1))
    b.append(text(M, 236, '看谁在被读、其余藏在哪。', 'c', 20, 400, INK2))
    pw, ph, gx, gy = 456, 430, 24, 22
    panels = [
        ('卡片层叠', 'Card Stack', '一次一张。其余待命。适合队列和弹层。', True, 'stack'),
        ('标签页', 'Tabs', '全部可达，但要先点标签。适合并列的几个面。', False, 'tabs'),
        ('走马灯', 'Carousel', '左右滑。适合浏览，不适合“处理完一张再下一张”。', False, 'car'),
        ('网格', 'Grid', '一眼看见全部。适合比较，不适合排队。', False, 'grid'),
    ]
    for k, (cn, en, desc, hl, kind) in enumerate(panels):
        px = M + (k % 2) * (pw + gx)
        py = 286 + (k // 2) * (ph + gy)
        b.append(rect(px, py, pw, ph, 22, CARD, f'stroke="{ACCENT if hl else "rgba(15,23,42,.08)"}" stroke-width="{2.4 if hl else 1}" filter="url(#soft)"'))
        b.append(text(px + 24, py + 48, cn, 'c', 24, 800, INK))
        b.append(text(px + 24 + twidth(cn, 24) + 10, py + 48, en, 't', 18, 500, INK2))
        ax, ay, aw, ah = px + 28, py + 78, pw - 56, 230
        if kind == 'stack':
            b.append(stack(ax + aw / 2, ay + ah / 2 + 10, 300, 140, 4, 10, -1.1, r=14))
        elif kind == 'tabs':
            for j, t in enumerate(['A', 'B', 'C']):
                b.append(rect(ax + j * 70, ay, 62, 28, 8, ACCENT if j == 0 else CHIP))
                b.append(text(ax + j * 70 + 31, ay + 20, t, 't', 13, 600, '#fff' if j == 0 else INK2, 'middle'))
            b.append(rect(ax, ay + 40, aw, ah - 48, 14, CHIP))
            b.append(text(ax + 20, ay + 80, 'Panel A', 'c', 18, 700, INK))
        elif kind == 'car':
            b.append(rect(ax + 36, ay + 24, aw - 72, ah - 48, 16, CHIP))
            b.append(rect(ax, ay + 50, 28, ah - 100, 8, '#E2E8F0'))
            b.append(rect(ax + aw - 28, ay + 50, 28, ah - 100, 8, '#E2E8F0'))
            for j in range(3):
                b.append(f'<circle cx="{f(ax + aw / 2 - 16 + j * 16)}" cy="{f(ay + ah - 10)}" r="4" fill="{ACCENT if j == 1 else "#CBD5E1"}"/>')
        else:
            for j in range(6):
                b.append(rect(ax + (j % 3) * (aw / 3 + 2), ay + (j // 3) * (ah / 2 + 2), aw / 3 - 8, ah / 2 - 10, 12, CHIP))
        lines = desc.split('。')
        b.append(text(px + 24, py + ph - 56, lines[0] + '。', 'c', 16, 700, INK))
        if len(lines) > 1 and lines[1]:
            b.append(text(px + 24, py + ph - 28, lines[1] + ('。' if not lines[1].endswith('。') else ''), 'c', 15, 400, INK2))
    b.append(text(M, 1288, '适合', 'c', 20, 800, ACCENT))
    b.append(text(M + 64, 1288, '队列 · 弹层 · 详情抽屉 · 一次只处理一件', 'c', 18, 500, INK))
    return d.render('\n'.join('  ' + x for x in b) + '\n')


def templates():
    d = Doc('模板')
    b = [rect(0, 0, W, H, 0, PAPER)]
    b.append(f'<circle cx="{M + 5}" cy="96" r="5" fill="{ACCENT}"/>')
    b.append(text(M + 20, 103, '布局 03 · 拿来就用', 'c', 18, 500, INK2, ls=1))
    b.append(text(M - 2, 188, '三套排法', 'c', 48, 800, INK, ls=2))
    b.append(text(M + 236, 186, 'Templates', 'd', 42, 500, INK2))

    # A iOS sheet in a phone
    px, py, pw, ph = M, 236, 300, 620
    b.append(rect(px, py, pw, ph, 44, '#111113', 'filter="url(#lift)"'))
    b.append(rect(px + 8, py + 8, pw - 16, ph - 16, 36, '#F2F2F7'))
    b.append(rect(px + pw / 2 - 40, py + 22, 80, 22, 11, '#111113'))
    b.append(text(px + 36, py + 56, '9:41', 't', 13, 600, INK))
    # sheet
    sy = py + 220
    b.append(rect(px + 8, sy, pw - 16, ph - 16 - (sy - py) + 8, 28, CARD, 'filter="url(#lift)"'))
    b.append(rect(px + pw / 2 - 20, sy + 12, 40, 5, 2.5, '#D1D5DB'))
    b.append(text(px + 28, sy + 48, 'New bet', 't', 13, 500, INK2))
    b.append(text(px + 28, sy + 80, '本周只做这一件', 'c', 20, 700, INK))
    b.append(rect(px + 24, sy + 110, pw - 48, 8, 4, '#E6EAF0'))
    b.append(rect(px + 24, sy + 110, (pw - 48) * 0.4, 8, 4, ACCENT))
    b.append(text(px + pw / 2, py + ph + 36, 'A · iOS sheet', 'c', 18, 800, INK, 'middle'))
    b.append(text(px + pw / 2, py + ph + 62, '从底部抬起 · 抓手 · 一次一张', 'c', 13, 400, INK2, 'middle'))

    # B Stripe browser
    bx, by, bw, bh = M + 340, 236, W - M - (M + 340), 300
    b.append(rect(bx, by, bw, bh, 16, CARD, 'filter="url(#lift)"'))
    for k, c in enumerate(['#FF5F57', '#FEBC2E', '#28C840']):
        b.append(f'<circle cx="{bx + 22 + k * 16}" cy="{by + 20}" r="5" fill="{c}"/>')
    b.append(text(bx + 80, by + 24, 'dashboard.stripe.com', 'm', 11, 400, INK3))
    b.append(rect(bx, by + 36, 4, bh - 36, 0, ACCENT))
    b.append(text(bx + 24, by + 70, 'Payment', 't', 13, 500, INK2))
    b.append(text(bx + 24, by + 104, '$48.20', 'd', 36, 700, INK))
    b.append(stack(bx + bw - 150, by + 180, 200, 96, 3, 8, -1, r=12))
    b.append(text(bx, by + bh + 36, 'B · Stripe 抽屉', 'c', 18, 800, INK))
    b.append(text(bx, by + bh + 62, '列表还在 · 详情叠在前面', 'c', 13, 400, INK2))

    # C queue
    qx, qy, qw, qh = M + 340, 620, W - M - (M + 340), 430
    b.append(rect(qx, qy, qw, qh, 20, CARD, 'filter="url(#soft)"'))
    b.append(text(qx + 24, qy + 40, 'Queue', 't', 14, 500, INK2))
    b.append(text(qx + 24, qy + 74, '先回最先等的人', 'c', 22, 700, INK))
    for i, (name, wait) in enumerate([('林可', '2h'), ('Jordan', '5h'), ('阿南', '1d')]):
        yy = qy + 110 + i * 86
        dim = 0 if i == 0 else 0.35
        b.append(rect(qx + 24, yy, qw - 48, 74, 14, CHIP if i else '#EEF4FF'))
        b.append(f'<circle cx="{qx + 52}" cy="{yy + 37}" r="12" fill="{["#F59E8B","#93C5FD","#A7F3D0"][i]}" opacity="{1 - dim}"/>')
        b.append(text(qx + 76, yy + 32, name, 'c', 16, 700, INK))
        b.append(text(qx + 76, yy + 56, 'Inbox · waiting', 't', 12, 400, INK2))
        b.append(text(qx + qw - 40, yy + 42, wait, 'm', 14, 500, ACCENT if i == 0 else INK3, 'end'))
    b.append(text(qx, qy + qh + 36, 'C · 任务队列', 'c', 18, 800, INK))
    b.append(text(qx, qy + qh + 62, '焦点在第一行 · 其余压暗待命', 'c', 13, 400, INK2))
    return d.render('\n'.join('  ' + x for x in b) + '\n')


for name, fn in [('poster', poster), ('cheatsheet', cheatsheet), ('compare', compare), ('templates', templates)]:
    path = os.path.join(HERE, f'{name}.svg')
    with open(path, 'w', encoding='utf-8') as fp:
        fp.write(fn())
    print('wrote', os.path.relpath(path))
