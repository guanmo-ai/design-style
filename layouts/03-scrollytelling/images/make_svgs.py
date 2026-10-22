"""
布局 03 · 滚动叙事 Scrollytelling —— 四张布局图（1080×1350）的生成脚本

四张图都画同一副骨架：一段很高的 section + 钉住的舞台（sticky stage）+ 滚过的步骤（step）+ 视口 50% 的触发线。
生成的 SVG 是普通可读的源文件（带注释），可以直接改；改完再跑 scripts/build_images.py 内嵌字体、导出 PNG。

  poster.svg     海报：三张视口快照 —— 步骤一个个过线，舞台一步步变（深色）
  cheatsheet.svg 速查卡：结构解剖、五条规则、拿来就用的 CSS（深色）
  compare.svg    四种排法：并排 / 覆盖 / 逐帧 / 横移，各适合什么（浅色）
  templates.svg  三套页面模板：产品发布页 / 数据报道 / 长篇特稿（浅色）

用法：python3 layouts/03-scrollytelling/images/make_svgs.py
"""
import os
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1350
M = 72

# 颜色（与 tokens.ts 一致）
NIGHT, PANEL, PANEL2, T1, T2, T3 = '#000000', '#1C1C1E', '#2C2C2E', '#F5F5F7', '#86868B', '#48484A'
PAPER, INK, INK2 = '#F5F5F7', '#1D1D1F', '#6E6E73'
ACCENT, STUCK, RED = '#2997FF', '#30D158', '#FF453A'
GRAD = ['#FF7A2F', '#FF2E7E', '#8B3DFF', '#2997FF']

STYLE = """
    <style>
      .sf { font-family: 'Instrument Serif', 'Noto Sans SC', serif; }
      .d { font-family: 'Inter Display', 'Noto Sans SC', sans-serif; }
      .t { font-family: 'Inter', 'Noto Sans SC', sans-serif; }
      .m { font-family: 'Geist Mono', 'SFMono-Regular', Menlo, monospace; }
      .c { font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif; }
    </style>"""

BASE_DEFS = f"""
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{GRAD[0]}"/><stop offset=".35" stop-color="{GRAD[1]}"/><stop offset=".68" stop-color="{GRAD[2]}"/><stop offset="1" stop-color="{GRAD[3]}"/></linearGradient>
    <linearGradient id="wall" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="{GRAD[0]}"/><stop offset=".38" stop-color="{GRAD[1]}"/><stop offset=".7" stop-color="{GRAD[2]}"/><stop offset="1" stop-color="{GRAD[3]}"/></linearGradient>
    <linearGradient id="ti" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6A6D75"/><stop offset=".4" stop-color="#3A3C43"/><stop offset=".7" stop-color="#55585F"/><stop offset="1" stop-color="#26282D"/></linearGradient>
    <radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FF2E7E" stop-opacity=".45"/><stop offset=".5" stop-color="#8B3DFF" stop-opacity=".18"/><stop offset="1" stop-color="#2997FF" stop-opacity="0"/></radialGradient>
    <filter id="soft" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity=".10"/></filter>"""


class Doc:
    def __init__(self, title):
        self.title = title
        self.defs = []

    def render(self, body):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">\n'
                f'  <!-- Design Style · 布局 03 · 滚动叙事 Scrollytelling —— {self.title} / 1080×1350（由 make_svgs.py 生成） -->\n'
                f'  <defs>{STYLE}{BASE_DEFS}\n    ' + '\n    '.join(self.defs) + '\n  </defs>\n' + body + '</svg>\n')


def f(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.')


def rect(x, y, w, h, r=0, fill=PANEL, extra=''):
    return f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{f(r)}" fill="{fill}" {extra}/>'


def text(x, y, s, cls='c', size=20, weight=400, fill=INK, anchor='start', ls=None, extra=''):
    lsp = f' letter-spacing="{f(ls)}"' if ls is not None else ''
    anc = f' text-anchor="{anchor}"' if anchor != 'start' else ''
    return f'<text x="{f(x)}" y="{f(y)}" class="{cls}" font-size="{f(size)}" font-weight="{weight}" fill="{fill}"{anc}{lsp} {extra}>{escape(s)}</text>'


def line(x1, y1, x2, y2, color=T3, w=1.5, dash=None, extra=''):
    da = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<line x1="{f(x1)}" y1="{f(y1)}" x2="{f(x2)}" y2="{f(y2)}" stroke="{color}" stroke-width="{f(w)}"{da} {extra}/>'


def twidth(s, size):
    return sum(size if ord(ch) > 0x2E80 else size * (0.3 if ch == ' ' else 0.6) for ch in s)


def pill(x, y, s, fill=ACCENT, color='#FFFFFF', size=15, cls='m', weight=500, pad=12, h=30, anchor='middle'):
    w = twidth(s, size) * (1.02 if cls == 'm' else 1) + pad * 2
    x0 = x - w / 2 if anchor == 'middle' else x
    return rect(x0, y - h / 2, w, h, h / 2, fill) + text(x0 + w / 2, y + size * 0.36, s, cls, size, weight, color, 'middle')


def trigger(x1, x2, y, label=None, color=ACCENT, size=13):
    out = [line(x1, y, x2, y, color, 2, '7 5')]
    out.append(f'<path d="M{f(x1 - 10)} {f(y - 6)} L{f(x1)} {f(y)} L{f(x1 - 10)} {f(y + 6)} Z" fill="{color}"/>')
    if label:
        out.append(text(x2, y - 8, label, 'm', size, 500, color, 'end'))
    return ''.join(out)


# ---------------- 主角：一台手机（正面 / 立起来 / 拆开 / 背面） ----------------
ISO = 'scale(1 0.57) rotate(-38)'


def phone(cx, cy, w, mode='face', glow=True):
    h = w * 2.07
    r = w * 0.19
    out = []
    if glow:
        out.append(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(w * 1.6)}" fill="url(#glow)"/>')

    def plate(fill, dx=0, dy=0, inset=0, extra='', iso=False, rr=None):
        tr = f'translate({f(cx + dx)} {f(cy + dy)})' + (f' {ISO}' if iso else '')
        return (f'<g transform="{tr}"><rect x="{f(-w / 2 + inset)}" y="{f(-h / 2 + inset)}" width="{f(w - 2 * inset)}" '
                f'height="{f(h - 2 * inset)}" rx="{f((rr or r) - inset * 0.8)}" fill="{fill}" {extra}/></g>')

    def screen(dy=0, iso=False):
        tr = f'translate({f(cx)} {f(cy + dy)})' + (f' {ISO}' if iso else '')
        s = [f'<g transform="{tr}">',
             f'<rect x="{f(-w / 2)}" y="{f(-h / 2)}" width="{f(w)}" height="{f(h)}" rx="{f(r)}" fill="#0A0A0A" stroke="#8E9199" stroke-width="{f(max(1, w * 0.02))}"/>',
             f'<rect x="{f(-w / 2 + w * 0.045)}" y="{f(-h / 2 + w * 0.045)}" width="{f(w * 0.91)}" height="{f(h - w * 0.09)}" rx="{f(r * 0.82)}" fill="url(#wall)"/>',
             f'<rect x="{f(-w * 0.16)}" y="{f(-h / 2 + w * 0.08)}" width="{f(w * 0.32)}" height="{f(w * 0.09)}" rx="{f(w * 0.045)}" fill="#000"/>',
             '</g>']
        return ''.join(s)

    if mode == 'face':
        out.append(screen())
    elif mode == 'back':
        out.append(plate('url(#ti)', extra=f'stroke="#8E9199" stroke-width="{f(max(1, w * 0.02))}"'))
        out.append(rect(cx - w / 2 + w * 0.08, cy - h / 2 + w * 0.08, w * 0.42, w * 0.42, w * 0.12, '#2E3036'))
        for lx, ly in [(0.18, 0.18), (0.36, 0.27), (0.18, 0.38)]:
            out.append(f'<circle cx="{f(cx - w / 2 + w * lx)}" cy="{f(cy - h / 2 + w * ly)}" r="{f(w * 0.075)}" fill="#0B0D12" stroke="#1A1B1F" stroke-width="{f(w * 0.03)}"/>')
    elif mode == 'tilt':
        out.append(plate('#3A3C43', dy=w * 0.08, iso=True))
        out.append(screen(iso=True))
    elif mode == 'explode':
        gap = w * 0.62
        out.append(plate('url(#ti)', dy=gap * 1.5, iso=True))
        out.append(plate('#23252B', dy=gap * 0.5, inset=w * 0.08, iso=True))
        out.append(plate('#0E1512', dy=-gap * 0.5, inset=w * 0.05, iso=True, extra='stroke="rgba(214,178,94,.35)" stroke-width="1"'))
        tr = f'translate({f(cx)} {f(cy - gap * 0.5)}) {ISO}'
        out.append(f'<g transform="{tr}"><rect x="{f(-w * 0.16)}" y="{f(-h * 0.25)}" width="{f(w * 0.32)}" height="{f(w * 0.32)}" rx="{f(w * 0.05)}" fill="{ACCENT}"/></g>')
        out.append(screen(dy=-gap * 1.5, iso=True))
    return ''.join(out)


def viewport(x, y, w, h, k, stage_mode, dark=True, steps=3, label=True):
    """一张视口快照：左栏步骤、右栏舞台；第 k 个步骤正在触发线上"""
    bg, card, stroke = ('#0B0B0D', PANEL, PANEL2) if dark else ('#FFFFFF', '#EDEDF0', '#D2D2D7')
    out = [rect(x, y, w, h, 22, bg, f'stroke="{stroke}" stroke-width="1.5"')]
    cid = f'vp{int(x)}{int(y)}'
    out.append(f'<clipPath id="{cid}"><rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="22"/></clipPath>')
    out.append(f'<g clip-path="url(#{cid})">')
    ty = y + h / 2
    cw = w * 0.36
    sx = x + w * 0.44
    out.append(rect(sx, y + 14, w * 0.56 - 14, h - 28, 14, 'rgba(48,209,88,.06)', f'stroke="{STUCK}" stroke-opacity=".6" stroke-width="1.5"'))
    for j in range(steps):
        cy = ty + (j - k) * h * 0.42
        on = j == k
        past = j < k
        out.append(rect(x + 14, cy - 30, cw, 60, 10, 'rgba(41,151,255,.18)' if on else card,
                        f'stroke="{ACCENT}" stroke-width="2"' if on else ''))
        out.append(f'<circle cx="{f(x + 34)}" cy="{f(cy - 10)}" r="7" fill="{ACCENT if on or past else "none"}" stroke="{ACCENT}" stroke-width="1.5"/>')
        out.append(rect(x + 26, cy + 4, cw * 0.66, 7, 3.5, T3 if dark else '#C7C7CC'))
    out.append(phone(sx + (w * 0.56 - 14) / 2, ty, w * 0.21, stage_mode, glow=dark))
    out.append('</g>')
    out.append(trigger(x + 4, x + w - 8, ty, '50%' if label else None))
    return ''.join(out)


def header(b, kicker, right, dark=True):
    b.append(f'<circle cx="{M + 5}" cy="98" r="5" fill="{ACCENT}"/>')
    b.append(text(M + 20, 105, kicker, 'm', 20, 500, T2 if dark else INK2))
    b.append(text(W - M, 105, right, 'c', 20, 500, T2 if dark else INK2, 'end', ls=1))


def footer(b, s, dark=True):
    b.append(text(W / 2, H - 92, s, 'c', 22, 700, T1 if dark else INK, 'middle', ls=2))
    b.append(text(W / 2, H - 54, '@guanmo_ai   ·   github.com/guanmo-ai/design-style', 'm', 16, 400, T2 if dark else INK2, 'middle'))


# =====================================================================
# 1. 海报（深色）
# =====================================================================
def poster():
    d = Doc('海报')
    b = [rect(0, 0, W, H, 0, NIGHT)]
    header(b, 'Design Style · 布局 03', '每天一个设计风格')
    b.append(text(M - 4, 262, 'Scrollytelling', 'd', 126, 700, 'url(#g)', ls=-4))
    b.append(text(M, 352, '滚动叙事', 'c', 60, 900, T1, ls=6))
    b.append(text(W - M, 316, '画面钉住，文字滚过；', 'c', 22, 500, T1, 'end'))
    b.append(text(W - M, 352, '你往下滚，它就往下讲。', 'c', 22, 500, T2, 'end'))
    # 时间线
    b.append(line(M, 430, W - M, 430, '#2C2C2E', 1.5))
    items = [('2012', 'Snow Fall'), ('2014', 'How To Scroll'), ('2017', 'Scrollama'), ('2020 前后', '苹果产品页'), ('2023', 'CSS scroll()')]
    for k, (yr, s) in enumerate(items):
        x = M + k * (W - 2 * M - 150) / 4
        b.append(f'<circle cx="{f(x + 4)}" cy="430" r="5" fill="{ACCENT if k == 0 else T1}"/>')
        b.append(text(x, 466, yr, 'm', 17, 500, T1))
        b.append(text(x, 492, s, 't', 16, 400, T2))
    # 三张视口快照
    vw, vh, gap = 296, 452, 24
    y0 = 580
    b.append(text(M, 556, 'scrollY ↓  每过一条线，舞台变一步', 'c', 18, 500, T2))
    caps = [('01', '步骤 1 过线', '设备转正'), ('02', '步骤 2 过线', '立起来'), ('03', '步骤 3 过线', '拆开')]
    for k, mode in enumerate(['face', 'tilt', 'explode']):
        x = M + k * (vw + gap)
        b.append(viewport(x, y0, vw, vh, k, mode, label=(k == 0)))
        n, a, c = caps[k]
        b.append(text(x + 4, y0 + vh + 44, n, 'm', 18, 500, ACCENT))
        b.append(text(x + 40, y0 + vh + 44, a, 'c', 18, 500, T2))
        b.append(text(x + 4, y0 + vh + 78, '→ ' + c, 'c', 24, 700, T1))
    # 图例
    ly = 1166
    chips = [('section 400vh', '#8E8E93', 'box'), ('.stage sticky', STUCK, 'stage'), ('.step 滚过', ACCENT, 'dot'), ('触发线 50%', ACCENT, 'dash')]
    x = M
    for s, c, kind in chips:
        if kind == 'box':
            b.append(rect(x, ly - 14, 18, 26, 2, 'none', f'stroke="{c}" stroke-width="1.5"'))
        elif kind == 'stage':
            b.append(rect(x, ly - 10, 24, 18, 4, 'rgba(48,209,88,.2)', f'stroke="{c}" stroke-width="1.5"'))
        elif kind == 'dot':
            b.append(f'<circle cx="{f(x + 9)}" cy="{f(ly - 1)}" r="7" fill="{c}"/>')
        else:
            b.append(line(x, ly - 1, x + 26, ly - 1, c, 2, '6 4'))
        b.append(text(x + 36, ly + 6, s, 'm', 17, 500, T1))
        x += 36 + twidth(s, 17) + 44
    footer(b, '钉住舞台 · 文字滚过 · 触发线 50% · 能倒着滚 · 手机叠起来')
    return d.render('\n'.join('  ' + x for x in b) + '\n')


# =====================================================================
# 2. 速查卡（深色）
# =====================================================================
def code_lines(x, y, lines, size=17, lh=28):
    COL = {'s': T1, 'p': '#7CC4FF', 'v': '#FFB86B', 'f': '#FF7AB6', 'c': T3, 'x': T2}
    out = []
    for i, ln in enumerate(lines):
        xx = x
        for kind, s in ln:
            out.append(text(xx, y + i * lh, s, 'm', size, 400, COL[kind], extra='xml:space="preserve"'))
            xx += sum(size if ord(ch) > 0x2E80 else size * 0.6 for ch in s)
    return ''.join(out)


def cheatsheet():
    d = Doc('速查卡')
    b = [rect(0, 0, W, H, 0, '#0B0B0D')]
    header(b, 'Design Style · 布局 03 · 速查', 'Scrollytelling 滚动叙事')
    b.append(text(M, 186, '一副骨架：高 section + 钉住的舞台 + 滚过的步骤', 'c', 36, 900, T1))
    # 解剖图
    ax, ay, aw, ah = M, 232, 320, 490
    b.append(rect(ax, ay, aw, ah, 6, '#000', 'stroke="#5A5A60" stroke-width="1.5"'))
    view_y = ay + 150
    vh_ = 190
    b.append(rect(ax + aw * 0.45, view_y + 6, aw * 0.55 - 10, vh_ - 12, 10, 'rgba(48,209,88,.14)', f'stroke="{STUCK}" stroke-width="2"'))
    b.append(phone(ax + aw * 0.45 + (aw * 0.55 - 10) / 2, view_y + vh_ / 2, 46, 'tilt', glow=True))
    for j in range(-1, 3):
        yy = view_y + vh_ / 2 + j * 110
        on = j == 0
        b.append(rect(ax + 12, yy - 24, aw * 0.38, 48, 8, 'rgba(41,151,255,.2)' if on else PANEL, (f'stroke="{ACCENT}" stroke-width="1.5"' if on else '') + (' opacity=".45"' if j < 0 else '')))
    b.append(rect(ax - 4, view_y, aw + 8, vh_, 6, 'none', f'stroke="{ACCENT}" stroke-width="2.5"'))
    b.append(trigger(ax - 12, ax + aw + 8, view_y + vh_ / 2))
    bx = ax + aw + 22
    b.append(line(bx, ay, bx, ay + ah, '#8E8E93', 1.5))
    b.append(line(bx - 6, ay, bx + 6, ay, '#8E8E93', 1.5))
    b.append(line(bx - 6, ay + ah, bx + 6, ay + ah, '#8E8E93', 1.5))
    notes = [
        (ay + 12, '#8E8E93', 'section', '高 = 步骤数 × 100vh（+ 一屏收尾）'),
        (view_y + 22, STUCK, '.stage', 'position: sticky; top: 0; height: 100vh'),
        (view_y + 82, ACCENT, '视口', '浏览器窗口：你此刻看见的那一屏'),
        (view_y + vh_ / 2 + 52, ACCENT, '触发线', '视口 50%：步骤中心过线 → 舞台换状态'),
        (ay + 380, T1, '.step', '普通文档流，照常滚过；一步一屏左右'),
        (ay + ah - 20, '#8E8E93', '到底', 'section 结束，舞台自动松开，跟着走'),
    ]
    for y, c, k, s in notes:
        b.append(line(bx + 14, y - 6, bx + 34, y - 6, c, 1.5))
        b.append(text(bx + 44, y, k, 'm', 18, 500, c))
        b.append(text(bx + 44, y + 28, s, 'c', 18, 400, T2))
    # 五条规则
    ry = 760
    b.append(rect(M, ry, W - 2 * M, 236, 24, PANEL))
    b.append(text(M + 32, ry + 46, '五条规则', 'c', 24, 900, T1))
    rules = [('01', '钉住舞台，不劫持滚动', '用 sticky，滚多快由读者定'), ('02', '一步只变一件事', '一张卡片 = 一个变化'),
             ('03', '触发线放在视口中间', '50%，不早不晚'), ('04', '能倒着滚', '状态 = f(滚动位置)'),
             ('05', '手机上叠起来', '窄屏改覆盖式；尊重减少动态')]
    for i, (n, t, s) in enumerate(rules):
        col, row = i % 2, i // 2
        x = M + 32 + col * 470
        y = ry + 96 + row * 52
        b.append(text(x, y, n, 'm', 18, 500, ACCENT))
        b.append(text(x + 40, y, t, 'c', 20, 700, T1))
        b.append(text(x + 40 + twidth(t, 20) + 14, y, s, 'c', 16, 400, T2))
    # CSS
    cy = 1022
    b.append(rect(M, cy, W - 2 * M, 176, 24, '#16161A', 'stroke="#26262B" stroke-width="1"'))
    lines = [
        [('s', '.scrolly'), ('x', ' { '), ('p', 'display'), ('x', ': '), ('v', 'grid'), ('x', '; '), ('p', 'grid-template-columns'), ('x', ': '), ('v', '7fr 5fr'), ('x', '; }')],
        [('s', '.stage  '), ('x', ' { '), ('p', 'position'), ('x', ': '), ('v', 'sticky'), ('x', '; '), ('p', 'top'), ('x', ': '), ('v', '0'), ('x', '; '), ('p', 'height'), ('x', ': '), ('v', '100vh'), ('x', '; }')],
        [('s', '.step   '), ('x', ' { '), ('p', 'min-height'), ('x', ': '), ('v', '100vh'), ('x', '; }  '), ('c', '/* 观察：rootMargin -50% 0px -50% 0px */')],
        [('f', '@media'), ('x', ' (max-width: 768px) { '), ('s', '.scrolly'), ('x', ' { '), ('p', 'display'), ('x', ': '), ('v', 'block'), ('x', '; } }')],
        [('f', '@media'), ('x', ' (prefers-reduced-motion: reduce) { '), ('c', '/* 直接给终态 */'), ('x', ' }')],
    ]
    b.append(code_lines(M + 30, cy + 40, lines, 16.5, 28))
    footer(b, '舞台 7fr / 步骤 5fr · 一步 ≈ 100vh · 触发线 50% · 断点 768px')
    return d.render('\n'.join('  ' + x for x in b) + '\n')


# =====================================================================
# 3. 四种排法（浅色）
# =====================================================================
def mini(kind, x, y, w, h):
    out = [rect(x, y, w, h, 16, '#FFFFFF', 'stroke="#D2D2D7" stroke-width="1.5"')]
    cid = f'mn{kind}'
    out.append(f'<clipPath id="{cid}"><rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="16"/></clipPath>')
    out.append(f'<g clip-path="url(#{cid})">')
    ty = y + h / 2
    if kind == 0:  # 并排
        out.append(rect(x, y, w * 0.58, h, 0, '#F2F2F4'))
        for j, hh in enumerate([70, 130, 95]):
            out.append(rect(x + 30 + j * 52, y + h - 40 - hh, 36, hh, 6, ACCENT if j == 1 else '#C7C7CC'))
        for j in range(3):
            cy = ty + (j - 1) * 110
            on = j == 1
            out.append(rect(x + w * 0.62, cy - 26, w * 0.34, 52, 8, 'rgba(41,151,255,.16)' if on else '#EDEDF0', f'stroke="{ACCENT}" stroke-width="2"' if on else ''))
        out.append(rect(x + 4, y + 8, w * 0.58 - 8, h - 16, 10, 'none', f'stroke="{STUCK}" stroke-width="1.5" stroke-opacity=".7"'))
    elif kind == 1:  # 覆盖
        out.append(rect(x, y, w, h, 0, '#D8E0E7'))
        out.append(f'<path d="M{f(x)} {f(y + h)} L{f(x + w * 0.25)} {f(y + h * 0.35)} L{f(x + w * 0.45)} {f(y + h * 0.6)} L{f(x + w * 0.68)} {f(y + h * 0.28)} L{f(x + w)} {f(y + h * 0.55)} L{f(x + w)} {f(y + h)} Z" fill="#9AA8B6"/>')
        out.append(f'<path d="M{f(x)} {f(y + h)} L{f(x + w * 0.2)} {f(y + h * 0.7)} L{f(x + w * 0.55)} {f(y + h * 0.82)} L{f(x + w)} {f(y + h * 0.66)} L{f(x + w)} {f(y + h)} Z" fill="#F4F6F8"/>')
        for j in range(2):
            cy = ty + (j - 0.5) * 140 + 40
            out.append(rect(x + w * 0.2, cy - 34, w * 0.6, 68, 6, '#FFFFFF', 'filter="url(#soft)"'))
            out.append(rect(x + w * 0.26, cy - 12, w * 0.4, 7, 3.5, '#C7C7CC'))
            out.append(rect(x + w * 0.26, cy + 6, w * 0.28, 7, 3.5, '#E5E5EA'))
    elif kind == 2:  # 逐帧
        out.append(rect(x, y, w, h, 0, '#0B0B0D'))
        out.append(phone(x + w / 2, ty - 14, 56, 'face'))
        for i in range(30):
            on = i == 13
            out.append(rect(x + w / 2 - 30 * 4.5 + i * 9, y + h - 34 - (8 if on else 0), 5, 16 + (8 if on else 0), 2.5, ACCENT if on else ('#5A5A60' if i < 13 else '#2C2C2E')))
        out.append(text(x + 18, y + 30, 'img_027 / 120', 'm', 14, 400, T2))
    else:  # 横移
        out.append(rect(x, y, w, h, 0, '#F2F2F4'))
        for j, c in enumerate(GRAD + [INK]):
            out.append(rect(x + 20 + j * (w * 0.5) - w * 0.32, y + 50, w * 0.44, h - 100, 14, c, 'opacity=".9"'))
        out.append(f'<path d="M{f(x + w - 60)} {f(y + h - 26)} h40 m-10 -7 l10 7 l-10 7" fill="none" stroke="{INK}" stroke-width="2"/>')
    out.append('</g>')
    # 滚动条
    out.append(rect(x + w - 9, y + 24 + kind * 18, 4, 40, 2, 'rgba(0,0,0,.35)' if kind != 2 else 'rgba(255,255,255,.5)'))
    return ''.join(out)


def compare():
    d = Doc('四种排法')
    b = [rect(0, 0, W, H, 0, PAPER)]
    header(b, 'Design Style · 布局 03 · 四种排法', '同一副骨架', dark=False)
    b.append(text(M, 196, '四种排法', 'c', 64, 900, INK, ls=2))
    b.append(text(M, 244, '骨架都一样：高 section + sticky 舞台 + 步骤 + 触发线；区别在舞台和文字怎么摆。', 'c', 20, 400, INK2))
    P = [
        ('01', '并排 Side-by-side', '图钉一边，文字一边', '数据图表 · 地图 · 步骤讲解', 'The Pudding · Scrollama'),
        ('02', '覆盖 Overlay', '图铺满，卡片浮在上面滚', '照片 · 视频 · 长篇特稿', '2012《Snow Fall》'),
        ('03', '逐帧 Scrub', '滚到哪，就播到哪一帧', '产品 · 3D · 过程演示', '苹果产品页（canvas 图片序列）'),
        ('04', '横移 Horizontal', '竖着滚，横着走', '时间线 · 作品集 · 年表', '纵向 sticky + 横向 translateX'),
    ]
    cw, ch, gx, gy = 456, 418, 24, 20
    for i, (n, name, how, fit, eg) in enumerate(P):
        x = M + (i % 2) * (cw + gx)
        y = 282 + (i // 2) * (ch + gy)
        b.append(rect(x, y, cw, ch, 26, '#FFFFFF', 'filter="url(#soft)"'))
        b.append(mini(i, x + 20, y + 20, cw - 40, 200))
        b.append(text(x + 24, y + 266, n, 'm', 18, 500, ACCENT))
        b.append(text(x + 60, y + 268, name, 'c', 26, 900, INK))
        b.append(text(x + 24, y + 306, how, 'c', 20, 500, INK))
        b.append(text(x + 24, y + 346, '适合', 'c', 16, 700, INK2))
        b.append(text(x + 70, y + 346, fit, 'c', 16, 400, INK2))
        b.append(text(x + 24, y + 378, '例子', 'c', 16, 700, INK2))
        b.append(text(x + 70, y + 378, eg, 'c', 16, 400, INK2))
    # 不算滚动叙事
    y = 1160
    b.append(rect(M, y, W - 2 * M, 60, 18, 'rgba(255,69,58,.07)', f'stroke="{RED}" stroke-opacity=".35" stroke-width="1.5"'))
    b.append(text(M + 26, y + 39, '× 不算', 'c', 20, 900, RED))
    b.append(text(M + 110, y + 39, '劫持滚轮（一下翻一整屏）· 点击翻页 · 自动轮播 —— 滚动叙事只“看”滚动，不改滚动', 'c', 18, 500, INK))
    footer(b, '先选排法，再选风格：同一副骨架，NYT、Pudding、苹果各有各的样子', dark=False)
    return d.render('\n'.join('  ' + x for x in b) + '\n')


# =====================================================================
# 4. 三套模板（浅色）
# =====================================================================
def strip(x, y, w, segs, scale):
    """一张长页面的“侧视图”：segs = [(名字, 高度 vh, 类型, 颜色)]"""
    out = []
    yy = y
    for name, vh, kind, col in segs:
        hh = vh * scale
        dark = col in (NIGHT, '#0B0B0D', '#16161A')
        out.append(rect(x, yy, w, hh, 0, col))
        if kind == 'sticky':
            out.append(rect(x + w * 0.42, yy + 6, w * 0.58 - 8, 100 * scale - 12, 6, 'rgba(48,209,88,.18)', f'stroke="{STUCK}" stroke-width="1.5"'))
            nsteps = int(vh // 100) - 1
            for j in range(nsteps):
                sy = yy + 100 * scale * (j + 1) - 6
                out.append(rect(x + 8, sy - 12, w * 0.34, 24, 5, '#2C2C2E' if dark else '#FFFFFF', '' if dark else 'stroke="#D2D2D7"'))
        elif kind == 'overlay':
            out.append(rect(x + 6, yy + 6, w - 12, 100 * scale - 12, 6, 'rgba(48,209,88,.14)', f'stroke="{STUCK}" stroke-width="1.5"'))
            for j in range(int(vh // 100) - 1):
                sy = yy + 100 * scale * (j + 1) - 6
                out.append(rect(x + w * 0.2, sy - 14, w * 0.6, 28, 4, '#FFFFFF', 'filter="url(#soft)"'))
        elif kind == 'scrub':
            out.append(rect(x + 6, yy + 6, w - 12, 100 * scale - 12, 6, 'rgba(48,209,88,.14)', f'stroke="{STUCK}" stroke-width="1.5"'))
            out.append(phone(x + w / 2, yy + 50 * scale, 30, 'face', glow=False))
        elif kind == 'text':
            for j in range(int(hh // 18)):
                out.append(rect(x + 14, yy + 14 + j * 18, (w - 28) * (0.92 if j % 4 != 3 else 0.6), 6, 3, '#3A3A3C' if dark else '#C7C7CC'))
        elif kind == 'hero':
            out.append(phone(x + w / 2, yy + hh / 2 + 4, 26, 'face', glow=dark))
        out.append(text(x + w + 16, yy + 22, name, 'c', 15, 700, INK))
        out.append(text(x + w + 16, yy + 42, f'{vh}vh · {kind_label(kind)}', 'c', 13, 400, INK2))
        yy += hh
    out.append(rect(x, y, w, yy - y, 4, 'none', 'stroke="#C7C7CC" stroke-width="1"'))
    return ''.join(out)


def kind_label(kind):
    return {'hero': '首屏', 'text': '普通流', 'end': '收尾', 'sticky': '并排', 'overlay': '覆盖', 'scrub': '逐帧'}.get(kind, '')


def templates():
    d = Doc('三套模板')
    b = [rect(0, 0, W, H, 0, '#FBFBFD')]
    header(b, 'Design Style · 布局 03 · 模板', '拿来就用', dark=False)
    b.append(text(M, 196, '三套页面，拿来就用', 'c', 56, 900, INK, ls=2))
    b.append(text(M, 242, '整页“侧视图”：绿框 = 钉住的舞台，小条 = 滚过的步骤；右边写着每段多高。', 'c', 20, 400, INK2))
    T = [
        ('A', '产品发布页', '苹果式', [('首屏', 100, 'hero', NIGHT), ('转一圈', 300, 'scrub', NIGHT), ('卖点', 300, 'overlay', '#16161A'), ('参数', 80, 'text', '#FFFFFF'), ('购买', 60, 'end', '#F5F5F7')],
         ['黑底 · 一屏一句话', '逐帧 120 张，canvas 画', '标题字号 ≥ 80px']),
        ('B', '数据报道', 'Pudding 式', [('标题', 60, 'text', '#FBF7F0'), ('图表并排', 400, 'sticky', '#FBF7F0'), ('正文', 100, 'text', '#FFFFFF'), ('地图并排', 300, 'sticky', '#FFFFFF'), ('方法', 60, 'text', '#F5F5F7')],
         ['图 7fr / 文 5fr', '3–6 步，每步只变一件事', '<768px 改成覆盖']),
        ('C', '长篇特稿', 'Snow Fall 式', [('全幅封面', 100, 'hero', '#0B0B0D'), ('照片覆盖', 300, 'overlay', '#C9D3DC'), ('正文', 140, 'text', '#FFFFFF'), ('视频覆盖', 200, 'overlay', '#16161A'), ('结尾', 60, 'text', '#FFFFFF')],
         ['衬线正文 18–21px', '图铺满，卡片半透明', '每张卡 ≤ 60 字']),
    ]
    colw = (W - 2 * M) / 3
    for i, (k, name, sub, segs, spec) in enumerate(T):
        x = M + i * colw
        b.append(text(x, 318, k, 'm', 22, 500, ACCENT))
        b.append(text(x + 30, 320, name, 'c', 28, 900, INK))
        b.append(text(x, 352, sub, 'c', 17, 400, INK2))
        total = sum(s[1] for s in segs)
        b.append(strip(x, 382, 150, segs, 700 / total))
        for j, s in enumerate(spec):
            b.append(text(x, 1128 + j * 30, '· ' + s, 'c', 17, 500 if j == 0 else 400, INK if j == 0 else INK2))
    footer(b, 'section 高 = 步骤数 × 100vh · 舞台 sticky · 步骤过线换状态', dark=False)
    return d.render('\n'.join('  ' + x for x in b) + '\n')


for name, fn in [('poster', poster), ('cheatsheet', cheatsheet), ('compare', compare), ('templates', templates)]:
    path = os.path.join(HERE, f'{name}.svg')
    with open(path, 'w', encoding='utf-8') as fp:
        fp.write(fn())
    print('wrote', os.path.relpath(path))
