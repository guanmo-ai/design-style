"""
布局 01 · 便当盒布局 Bento Grid —— 四张布局图（1080×1350）的生成脚本

四张图都是“格子”：网格坐标用同一个函数算，保证间距、圆角处处一致。
生成的 SVG 是普通可读的源文件（带注释），可以直接改；改完再跑 scripts/build_images.py 内嵌字体、导出 PNG。

  poster.svg     一张海报，认识便当盒布局（海报本身就是一个便当盒）
  cheatsheet.svg 尺寸、间距、色板与五条规则（速查卡本身也是一个便当盒，浅色）
  skins.svg      同一套格子，换六种皮（便当 / Metro / iOS / 包豪斯 / 浅色主页 / 深色后台）
  templates.svg  拿来就用的三套排法（发布会 / 个人主页 / 数据看板）

用法：python3 layouts/01-bento-grid/images/make_svgs.py
"""
import math
import os
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1350
M = 72            # 页边距
GAP = 20          # 统一间距
R = 32            # 统一圆角
COLW = (W - 2 * M - 3 * GAP) / 4   # 4 列 → 219

# 颜色（与 tokens.ts 一致）
BLACK, CARD, CARD_LO, T1, T2 = '#000000', '#161618', '#0F0F11', '#F5F5F7', '#86868B'
LIGHT, INK, INK2 = '#F2F2F4', '#1D1D1F', '#6E6E73'
ORANGE, PINK, VIOLET, INDIGO, GREEN = '#FF8A1F', '#FF2D6F', '#A63DFF', '#7B83FF', '#4CC38A'

STYLE = """
    <style>
      .d { font-family: 'Inter Display', 'Noto Sans SC', sans-serif; }
      .t { font-family: 'Inter', 'Noto Sans SC', sans-serif; }
      .m { font-family: 'Geist Mono', 'SFMono-Regular', Menlo, monospace; }
      .c { font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif; }
      .s { font-family: 'Selawik', 'Segoe UI', 'Noto Sans SC', sans-serif; }
      .j { font-family: 'Jost', 'Futura', sans-serif; }
    </style>"""

DEFS = f"""
    <linearGradient id="acc" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{ORANGE}"/><stop offset=".5" stop-color="{PINK}"/><stop offset="1" stop-color="{VIOLET}"/>
    </linearGradient>
    <linearGradient id="accH" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="{ORANGE}"/><stop offset=".5" stop-color="{PINK}"/><stop offset="1" stop-color="{VIOLET}"/>
    </linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{CARD}"/><stop offset="1" stop-color="{CARD_LO}"/>
    </linearGradient>
    <radialGradient id="glowV"><stop offset="0" stop-color="{VIOLET}" stop-opacity=".85"/><stop offset="1" stop-color="{VIOLET}" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowP"><stop offset="0" stop-color="{PINK}" stop-opacity=".8"/><stop offset="1" stop-color="{PINK}" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowO"><stop offset="0" stop-color="{ORANGE}" stop-opacity=".9"/><stop offset="1" stop-color="{ORANGE}" stop-opacity="0"/></radialGradient>
    <filter id="soft" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000" flood-opacity=".07"/></filter>"""


def svg(title, body, extra_defs=''):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">\n'
            f'  <!-- Design Style · 布局 01 · 便当盒布局 Bento Grid —— {title} / 1080×1350（由 make_svgs.py 生成） -->\n'
            f'  <defs>{STYLE}{DEFS}{extra_defs}\n  </defs>\n{body}</svg>\n')


def f(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.')


def cell(c, r, w=1, h=1, gx=M, gy=0, colw=COLW, rowh=COLW, gap=GAP):
    """网格坐标 → (x, y, 宽, 高)：所有卡片都从这里出来，所以缝一样宽、边对齐"""
    return (gx + c * (colw + gap), gy + r * (rowh + gap), w * colw + (w - 1) * gap, h * rowh + (h - 1) * gap)


def rect(x, y, w, h, r=R, fill='url(#card)', extra=''):
    return f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{f(r)}" fill="{fill}" {extra}/>'


def text(x, y, s, cls='c', size=20, weight=400, fill=T1, anchor='start', ls=None, extra=''):
    lsp = f' letter-spacing="{f(ls)}"' if ls is not None else ''
    anc = f' text-anchor="{anchor}"' if anchor != 'start' else ''
    return f'<text x="{f(x)}" y="{f(y)}" class="{cls}" font-size="{size}" font-weight="{weight}" fill="{fill}"{anc}{lsp} {extra}>{escape(s)}</text>'


def spans(x, y, parts, anchor='start'):
    """一行混排：parts = [(文字, class, 字号, 字重, 颜色, dx), ...]"""
    anc = f' text-anchor="{anchor}"' if anchor != 'start' else ''
    inner = ''.join(f'<tspan class="{c}" font-size="{s}" font-weight="{w}" fill="{col}"' + (f' dx="{dx}"' if dx else '') + f'>{escape(t)}</tspan>'
                    for t, c, s, w, col, dx in parts)
    return f'<text x="{f(x)}" y="{f(y)}"{anc}>{inner}</text>'


def card(x, y, w, h, r=R, line='rgba(255,255,255,0.07)'):
    return rect(x, y, w, h, r) + rect(x + .5, y + .5, w - 1, h - 1, r - .5, 'none', f'stroke="{line}"')


def label(x, y, s, fill=T2, size=20):
    return text(x + 28, y + 46, s, 'c', size, 500, fill)


# ======================================================================
# 1. 海报：海报本身就是一个便当盒
# ======================================================================
def poster():
    o = ['  <rect width="1080" height="1350" fill="#000"/>']
    o.append('  <!-- 页眉 -->')
    o.append('  ' + spans(M, 112, [('Design Style', 'd', 24, 500, T2, 0), ('布局 01', 'c', 24, 500, T1, 14)]))
    o.append('  ' + text(W - M, 112, '2020s —', 'm', 22, 400, T2, 'end'))
    gy = 160
    C = lambda *a: cell(*a, gy=gy)

    # 主角卡 3×2
    x, y, w, h = C(0, 0, 3, 2)
    o.append('  <!-- 主角卡 3×2：全图唯一一张上渐变的卡 -->')
    o.append(f'  <clipPath id="heroClip"><rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{R}"/></clipPath>')
    o.append('  ' + card(x, y, w, h))
    o.append(f'  <g clip-path="url(#heroClip)"><circle cx="{f(x + w - 40)}" cy="{f(y + 60)}" r="300" fill="url(#glowV)" opacity=".75"/>'
             f'<circle cx="{f(x + w * .62)}" cy="{f(y + h * .78)}" r="260" fill="url(#glowP)" opacity=".8"/>'
             f'<circle cx="{f(x + w * .4)}" cy="{f(y + h + 60)}" r="260" fill="url(#glowO)" opacity=".85"/></g>')
    o.append('  ' + text(x + 40, y + 62, '一格一件事的排版', 'c', 22, 500, 'rgba(245,245,247,.62)'))
    o.append('  ' + text(x + 34, y + 222, 'Bento', 'd', 156, 600, T1, ls=-7))
    o.append('  ' + text(x + 34, y + 352, 'Grid', 'd', 156, 600, T1, ls=-7))
    o.append('  ' + text(x + 40, y + 420, '便当盒布局', 'c', 46, 700, T1, ls=2))

    # 名字的由来
    x, y, w, h = C(3, 0)
    o.append('  <!-- 名字的由来 -->')
    o.append('  ' + card(x, y, w, h) + label(x, y, '名字的由来'))
    bx, by = x + w - 24 - 48, y + 20
    o.append(f'  <g transform="translate({f(bx)} {f(by)}) scale(.75) translate({f(-bx)} {f(-by)})"><rect x="{f(bx)}" y="{f(by)}" width="64" height="44" rx="8" fill="#8E211B"/>'
             f'<rect x="{f(bx + 5)}" y="{f(by + 5)}" width="30" height="34" rx="4" fill="#F4F1EA"/><circle cx="{f(bx + 20)}" cy="{f(by + 22)}" r="5" fill="#C8102E"/>'
             f'<rect x="{f(bx + 39)}" y="{f(by + 5)}" width="20" height="15" rx="3" fill="#F6C945"/><rect x="{f(bx + 39)}" y="{f(by + 24)}" width="20" height="15" rx="3" fill="#4E9A3A"/></g>')
    o.append('  ' + text(x + 26, y + 150, '弁当', 'c', 70, 900, T1))
    o.append('  ' + text(x + 28, y + 190, '一格只装一样菜', 'c', 19, 400, T2))

    # 大小分级
    x, y, w, h = C(3, 1)
    o.append('  <!-- 大小分级 -->')
    o.append('  ' + card(x, y, w, h) + label(x, y, '大小分级'))
    bx, base = x + 28, y + h - 54
    for k, (cw, ch, t) in enumerate([(28, 28, '小'), (56, 28, '中'), (56, 56, '大')]):
        cx = bx + [0, 40, 108][k]
        o.append(f'  <rect x="{f(cx)}" y="{f(base - ch)}" width="{cw}" height="{ch}" rx="8" fill="{T1}" opacity="{[.35, .6, 1][k]}"/>')
        o.append('  ' + text(cx + cw / 2, base + 30, t, 'c', 17, 500, T2, 'middle'))

    # 前身（1×2）
    x, y, w, h = C(0, 2, 1, 2)
    o.append('  <!-- 前身：2010 Metro 磁贴 / 2020 iOS 小组件 -->')
    o.append('  ' + card(x, y, w, h) + label(x, y, '前身'))
    o.append('  ' + text(x + 26, y + 112, '2010', 'd', 58, 600, T1, ls=-2))
    o.append('  ' + text(x + 28, y + 142, 'Windows Phone 磁贴', 't', 16, 400, T2))
    tiles = [('#F09609', 0, 0, 2, 1), ('#A200FF', 2, 0, 1, 1), ('#1BA1E2', 0, 1, 1, 1), ('#00ABA9', 1, 1, 1, 1), ('#E51400', 2, 1, 1, 1)]
    for col, c, r, tw, th in tiles:
        tx, ty, ww, hh = cell(c, r, tw, th, gx=x + 28, gy=y + 162, colw=50, rowh=36, gap=4)
        o.append(f'  <rect x="{f(tx)}" y="{f(ty)}" width="{f(ww)}" height="{f(hh)}" fill="{col}"/>')
    o.append('  ' + text(x + 26, y + 326, '2020', 'd', 58, 600, T1, ls=-2))
    o.append('  ' + text(x + 28, y + 356, 'iOS 14 小组件', 't', 16, 400, T2))
    ios = [('url(#iosA)', 0, 0, 1, 1), ('#F5F5F7', 1, 0, 1, 1), ('url(#iosB)', 2, 0, 1, 1)]
    for col, c, r, tw, th in ios:
        tx, ty, ww, hh = cell(c, r, tw, th, gx=x + 28, gy=y + 378, colw=50, rowh=50, gap=6)
        o.append(f'  <rect x="{f(tx)}" y="{f(ty)}" width="{f(ww)}" height="{f(hh)}" rx="13" fill="{col}"/>')

    # 统一间距（2×1）
    x, y, w, h = C(1, 2, 2, 1)
    o.append('  <!-- 统一间距 -->')
    o.append('  ' + card(x, y, w, h) + label(x, y, '统一间距'))
    o.append('  ' + spans(x + 24, y + 176, [('20', 'd', 120, 600, T1, 0), ('px', 'd', 34, 600, T2, 6)]))
    rx0 = x + 248
    for k in range(3):
        o.append(f'  <rect x="{f(rx0 + k * 62)}" y="{f(y + 70)}" width="42" height="112" rx="10" fill="#2A2A2E"/>')
    for k in range(2):
        gx0 = rx0 + 42 + k * 62
        o.append(f'  <rect x="{f(gx0)}" y="{f(y + 70)}" width="20" height="112" fill="{PINK}" opacity=".85"/>')
    o.append('  ' + text(rx0 + 52, y + 64 - 8, '20', 'm', 15, 500, PINK, 'middle'))
    o.append('  ' + text(rx0 + 114, y + 64 - 8, '20', 'm', 15, 500, PINK, 'middle'))

    # 统一圆角
    x, y, w, h = C(3, 2)
    o.append('  <!-- 统一圆角 -->')
    o.append('  ' + card(x, y, w, h) + label(x, y, '统一圆角'))
    cx0, cy0 = x + 40, y + 72
    o.append(f'  <path d="M{f(cx0)} {f(cy0 + 92)} V{f(cy0 + 64)} A64 64 0 0 1 {f(cx0 + 64)} {f(cy0)} H{f(cx0 + 150)}" fill="none" stroke="{T1}" stroke-opacity=".35" stroke-width="3"/>')
    o.append(f'  <path d="M{f(cx0)} {f(cy0 + 64)} A64 64 0 0 1 {f(cx0 + 64)} {f(cy0)}" fill="none" stroke="{PINK}" stroke-width="5" stroke-linecap="round"/>')
    o.append(f'  <line x1="{f(cx0 + 64)}" y1="{f(cy0 + 64)}" x2="{f(cx0 + 19)}" y2="{f(cy0 + 19)}" stroke="{PINK}" stroke-width="2" stroke-dasharray="4 4"/>')
    o.append('  ' + text(cx0 + 78, cy0 + 84, 'r 32', 'm', 22, 500, T1))
    o.append('  ' + text(x + 28, y + h - 28, '处处同一个半径', 'c', 17, 400, T2))

    # 一格一事
    x, y, w, h = C(1, 3)
    o.append('  <!-- 一格一事 -->')
    o.append('  ' + card(x, y, w, h) + label(x, y, '一格一事'))
    o.append('  ' + spans(x + 22, y + 184, [('1', 'd', 140, 600, 'url(#acc)', 0), ('件事', 'c', 26, 700, T1, 8)]))

    # 谁在用（2×1）
    x, y, w, h = C(2, 3, 2, 1)
    o.append('  <!-- 谁在用 -->')
    o.append('  ' + card(x, y, w, h) + label(x, y, '谁在用'))
    for k, (a, b) in enumerate([('Apple', '发布会与官网的总结页'), ('bento.me', '一页式个人主页'), ('Linear · Vercel', '产品官网与后台')]):
        yy = y + 98 + k * 40
        o.append(f'  <circle cx="{f(x + 34)}" cy="{f(yy - 7)}" r="4" fill="url(#acc)"/>')
        o.append('  ' + spans(x + 50, yy, [(a, 't', 21, 500, T1, 0), (b, 'c', 19, 400, T2, 12)]))

    o.append('  <!-- 页脚 -->')
    o.append('  ' + text(M, 1196, '风格是皮，布局是骨。', 'c', 40, 700, T1, ls=2))
    o.append('  ' + text(M, 1240, '一格一事 · 大小分级 · 统一间距 · 统一圆角 · 对齐网格', 'c', 20, 400, T2, ls=1))
    o.append(f'  <rect x="{M}" y="1268" width="{W - 2 * M}" height="1" fill="#2A2A2E"/>')
    o.append('  ' + text(M, 1306, '@guanmo_ai', 't', 18, 500, T2))
    o.append('  ' + text(W - M, 1306, 'github.com/guanmo-ai/design-style', 'm', 17, 400, T2, 'end'))
    extra = f"""
    <linearGradient id="iosA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5FB0FF"/><stop offset="1" stop-color="#1E6FFF"/></linearGradient>
    <linearGradient id="iosB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB15C"/><stop offset="1" stop-color="#FF5E7E"/></linearGradient>"""
    return svg('海报', '\n'.join(o) + '\n', extra)


# ======================================================================
# 2. 速查卡（浅色）：速查卡本身也按便当盒排
# ======================================================================
def cheatsheet():
    o = [f'  <rect width="1080" height="1350" fill="{LIGHT}"/>']
    wc = lambda x, y, w, h: rect(x, y, w, h, 28, '#FFFFFF', 'filter="url(#soft)"')
    head = lambda x, y, n, s: spans(x + 30, y + 50, [(n, 'm', 17, 500, PINK, 0), (s, 'c', 22, 700, INK, 12)])
    o.append('  <!-- 页眉 -->')
    o.append('  ' + spans(M, 124, [('便当盒布局', 'c', 58, 900, INK, 0), ('Bento Grid', 'd', 58, 600, INK, 18)]))
    o.append('  ' + text(M, 172, '布局速查 · 4 列 · 间距 20 · 圆角 32 · 2020s —', 'c', 22, 500, INK2))
    o.append('  ' + text(W - M, 124, '布局 01', 'c', 22, 700, INK, 'end'))
    full = W - 2 * M
    half = (full - GAP) / 2

    # 01 网格与尺寸
    x, y, w, h = M, 214, full, 318
    o.append('  <!-- 01 网格与尺寸 -->')
    o.append('  ' + wc(x, y, w, h) + head(x, y, '01', '网格与尺寸'))
    gx, gy0, cw, rh, g = x + 30, y + 80, 64, 64, 10
    for c in range(4):
        o.append(f'  <rect x="{f(gx + c * (cw + g))}" y="{f(gy0 - 10)}" width="{cw}" height="{3 * rh + 2 * g + 20}" fill="{PINK}" opacity=".06"/>')
    lay = [(0, 0, 2, 2, '2×2', '主角'), (2, 0, 1, 1, '1×1', ''), (2, 1, 1, 1, '1×1', ''), (3, 0, 1, 2, '1×2', ''), (0, 2, 2, 1, '2×1', ''), (2, 2, 1, 1, '1×1', ''), (3, 2, 1, 1, '1×1', '')]
    for c, r, tw, th, s, sub in lay:
        cx, cy, ww, hh = cell(c, r, tw, th, gx=gx, gy=gy0, colw=cw, rowh=rh, gap=g)
        hero = s == '2×2'
        o.append(f'  <rect x="{f(cx)}" y="{f(cy)}" width="{f(ww)}" height="{f(hh)}" rx="14" fill="{"url(#acc)" if hero else "#F2F2F4"}" stroke="{"none" if hero else "#E3E3E8"}"/>')
        o.append('  ' + text(cx + ww / 2, cy + hh / 2 + (0 if sub else 7), s, 'm', 20 if hero else 16, 500, '#FFFFFF' if hero else INK, 'middle'))
        if sub:
            o.append('  ' + text(cx + ww / 2, cy + hh / 2 + 28, sub, 'c', 17, 700, '#FFFFFF', 'middle'))
    lx = x + 400
    rows = [('列', '桌面 4 列 · 平板 3 列 · 手机 2 列'), ('单元', '行高 = 列宽，最好是正方形'), ('尺寸', '只用 1×1 · 2×1 · 1×2 · 2×2'), ('主角', '一屏只有一张 2×2'), ('边界', '所有卡片的边都落在列线上')]
    for k, (a, b) in enumerate(rows):
        yy = y + 104 + k * 44
        o.append('  ' + text(lx, yy, a, 'c', 18, 700, INK))
        o.append('  ' + text(lx + 64, yy, b, 'c', 18, 400, INK2))

    # 02 间距与圆角
    x, y, w, h = M, 552, half, 290
    o.append('  <!-- 02 间距与圆角 -->')
    o.append('  ' + wc(x, y, w, h) + head(x, y, '02', '间距与圆角'))
    ox, oy = x + 30, y + 84
    o.append(f'  <rect x="{ox}" y="{oy}" width="176" height="150" rx="32" fill="#F2F2F4" stroke="{INK}" stroke-width="2"/>')
    o.append(f'  <rect x="{ox + 12}" y="{oy + 12}" width="152" height="126" rx="20" fill="#FFFFFF" stroke="{PINK}" stroke-width="2"/>')
    o.append(f'  <line x1="{ox}" y1="{oy + 75}" x2="{ox + 12}" y2="{oy + 75}" stroke="{PINK}" stroke-width="2"/>')
    o.append('  ' + text(ox + 88, oy + 70, '内 20', 'm', 16, 500, PINK, 'middle'))
    o.append('  ' + text(ox + 88, oy + 96, '外 32', 'm', 16, 500, INK, 'middle'))
    o.append('  ' + text(ox + 88, oy + 186, '32 − 12 = 20', 'm', 15, 500, INK2, 'middle'))
    tx = x + 236
    for k, (a, b) in enumerate([('间距', '16–24 · 全站同一个值'), ('内边距', '24–40'), ('圆角', '24–32 · 全站同一个值'), ('嵌套', '内圆角 = 外 − 内边距')]):
        yy = y + 96 + k * 50
        o.append('  ' + text(tx, yy, a, 'c', 17, 700, INK))
        o.append('  ' + text(tx, yy + 24, b, 'c', 15, 400, INK2))

    # 03 色板
    x, y, w, h = M + half + GAP, 552, half, 290
    o.append('  <!-- 03 色板 -->')
    o.append('  ' + wc(x, y, w, h) + head(x, y, '03', '色板'))
    sw = [('#000000', '底'), ('#161618', '卡片'), ('#F5F5F7', '文字'), ('#86868B', '次要')]
    for k, (col, n) in enumerate(sw):
        sx = x + 30 + k * 98
        o.append(f'  <rect x="{sx}" y="{y + 78}" width="86" height="56" rx="12" fill="{col}" stroke="#E3E3E8"/>')
        o.append('  ' + spans(sx, y + 156, [(n, 'c', 14, 700, INK, 0), (col, 'm', 11, 400, INK2, 4)]))
    sw2 = [('#F2F2F4', '浅底'), ('#FFFFFF', '浅卡'), ('#1D1D1F', '浅字')]
    for k, (col, n) in enumerate(sw2):
        sx = x + 30 + k * 98
        o.append(f'  <rect x="{sx}" y="{y + 176}" width="86" height="40" rx="10" fill="{col}" stroke="#E3E3E8"/>')
        o.append('  ' + text(sx, y + 234, n, 'c', 14, 700, INK))
    o.append(f'  <rect x="{x + 324}" y="{y + 176}" width="98" height="40" rx="10" fill="url(#accH)"/>')
    o.append('  ' + text(x + 324, y + 234, '强调 · 只给主角', 'c', 14, 700, INK))
    o.append('  ' + text(x + 30, y + 266, '#FF8A1F → #FF2D6F → #A63DFF', 'm', 13, 400, INK2))

    # 04 五条规则
    x, y, w, h = M, 862, half, 262
    o.append('  <!-- 04 五条规则 -->')
    o.append('  ' + wc(x, y, w, h) + head(x, y, '04', '五条规则'))
    for k, (a, b) in enumerate([('一格一事', '每张卡只讲一个信息'), ('大小分级', '面积就是优先级'), ('统一间距', '所有缝一样宽'), ('统一圆角', '嵌套时内 = 外 − 边距'), ('对齐网格', '所有边落在同一套列上')]):
        yy = y + 94 + k * 36
        o.append('  ' + text(x + 30, yy, f'0{k + 1}', 'm', 15, 500, PINK))
        o.append('  ' + spans(x + 62, yy, [(a, 'c', 18, 700, INK, 0), (b, 'c', 15, 400, INK2, 12)]))

    # 05 字体
    x, y, w, h = M + half + GAP, 862, half, 262
    o.append('  <!-- 05 字体 -->')
    o.append('  ' + wc(x, y, w, h) + head(x, y, '05', '字体'))
    fonts = [('Aa 128', 'd', 34, 600, 'Inter Display 600 · 大数字 / 标题'), ('Aa 正文', 't', 24, 400, 'Inter 400 + 思源黑体 · 正文'), ('01 / 07', 'm', 22, 500, 'Geist Mono · 编号 / 标注')]
    for k, (s, c, sz, wt, d) in enumerate(fonts):
        yy = y + 112 + k * 56
        o.append('  ' + text(x + 30, yy, s, c, sz, wt, INK))
        o.append('  ' + text(x + 176, yy - 4, d, 'c', 14, 400, INK2))

    # 06 常见误区
    x, y, w, h = M, 1144, full, 148
    o.append('  <!-- 06 常见误区 -->')
    o.append('  ' + wc(x, y, w, h) + head(x, y, '06', '常见误区'))
    bad = [('格子全一样大', '没有主角'), ('每格塞一段长文', '变成表格'), ('间距忽大忽小', '网格就散了'), ('每格都上渐变', '主角被淹没')]
    for k, (a, b) in enumerate(bad):
        cx = x + 30 + (k % 2) * 460
        yy = y + 88 + (k // 2) * 36
        o.append('  ' + spans(cx, yy, [('×', 't', 22, 600, PINK, 0), (a, 'c', 17, 700, INK, 10), ('→ ' + b, 'c', 15, 400, INK2, 10)]))
    o.append('  ' + text(M, 1324, 'Design Style · 布局 01', 'c', 15, 500, INK2))
    o.append('  ' + text(W - M, 1324, 'github.com/guanmo-ai/design-style', 'm', 14, 400, INK2, 'end'))
    return svg('速查卡', '\n'.join(o) + '\n')


# ======================================================================
# 3. 同一套格子，换六种皮
# ======================================================================
LAY7 = [(0, 0, 2, 2), (2, 0, 1, 1), (2, 1, 1, 1), (3, 0, 1, 2), (0, 2, 2, 1), (2, 2, 1, 1), (3, 2, 1, 1)]


def mini_cells(x, y, w, h, gap):
    cw, rh = (w - 3 * gap) / 4, (h - 2 * gap) / 3
    return [cell(c, r, tw, th, gx=x, gy=y, colw=cw, rowh=rh, gap=gap) for c, r, tw, th in LAY7]


def skin_bento(x, y, w, h):
    o = [rect(x, y, w, h, 20, '#3A0F0B'), rect(x + 4, y + 4, w - 8, h - 8, 17, 'none', 'stroke="#5A1A14" stroke-width="2"')]
    cs = mini_cells(x + 12, y + 12, w - 24, h - 24, 8)
    for cx, cy, cw, ch in cs:
        o.append(rect(cx, cy, cw, ch, 8, 'url(#lacq)', 'stroke="#2A0806" stroke-width="2"'))
    (hx, hy, hw, hh), a, b, c, d, e, g = cs
    o.append(rect(hx + 8, hy + 8, hw - 16, hh - 16, 6, '#F4F1EA'))
    for k in range(26):  # 芝麻
        px, py = hx + 20 + (k * 37) % (hw - 40), hy + 18 + (k * 53) % (hh - 36)
        o.append(f'<rect x="{f(px)}" y="{f(py)}" width="4" height="2" rx="1" fill="#2A2A2A" transform="rotate({k * 37 % 180} {f(px)} {f(py)})"/>')
    o.append(f'<circle cx="{f(hx + hw / 2)}" cy="{f(hy + hh / 2)}" r="14" fill="#C8102E"/>')
    ax, ay, aw, ah = a
    for k in range(3):
        o.append(rect(ax + 10 + k * (aw - 20) / 3, ay + ah * .28, (aw - 20) / 3 - 3, ah * .44, 5, '#F6C945', 'stroke="#D9A21E"'))
    bx, by, bw, bh = b
    for k, (dx, dy, rr) in enumerate([(.3, .45, 11), (.55, .38, 13), (.72, .6, 10), (.45, .66, 11)]):
        o.append(f'<circle cx="{f(bx + bw * dx)}" cy="{f(by + bh * dy)}" r="{rr}" fill="{["#3E8E2F", "#4FA63A", "#3A8A2C", "#5BB044"][k]}"/>')
    cx_, cy_, cw_, ch_ = c
    for k in range(2):
        o.append(rect(cx_ + 9, cy_ + 12 + k * ch_ * .3, cw_ - 18, ch_ * .24, 7, '#F28A5B'))
        for s in range(3):
            o.append(f'<line x1="{f(cx_ + 18 + s * (cw_ - 36) / 2.5)}" y1="{f(cy_ + 16 + k * ch_ * .3)}" x2="{f(cx_ + 24 + s * (cw_ - 36) / 2.5)}" y2="{f(cy_ + 8 + (k * .3 + .24) * ch_)}" stroke="#FFE3D3" stroke-width="2"/>')
    o.append(f'<path d="M{f(cx_ + 10)} {f(cy_ + ch_ - 14)} a{f((cw_ - 20) / 2)} {f((cw_ - 20) / 2)} 0 0 1 {f(cw_ - 20)} 0 Z" fill="#FFE04A" stroke="#F2C500"/>')
    dx_, dy_, dw_, dh_ = d
    o.append(f'<ellipse cx="{f(dx_ + dw_ / 2)}" cy="{f(dy_ + dh_ * .58)}" rx="{f(dw_ * .46)}" ry="{f(dh_ * .36)}" fill="#8BC34A"/>')
    for k in range(4):
        o.append(f'<circle cx="{f(dx_ + dw_ * (.2 + k * .2))}" cy="{f(dy_ + dh_ * .52)}" r="{f(dh_ * .26)}" fill="#C27A35" stroke="#9A5A22"/>')
    ex, ey, ew, eh = e
    for k, (ddx, ddy) in enumerate([(.36, .6), (.64, .6), (.5, .36)]):
        o.append(f'<circle cx="{f(ex + ew * ddx)}" cy="{f(ey + eh * ddy)}" r="{f(eh * .2)}" fill="#E53935"/>')
    gx_, gy_, gw_, gh_ = g
    for k in range(3):
        o.append(f'<path d="M{f(gx_ + 8 + k * 10)} {f(gy_ + gh_ * .75)} a{f(gw_ * .3)} {f(gw_ * .3)} 0 0 1 {f(gw_ * .6)} 0 Z" fill="#F7D93E" stroke="#E0B400"/>')
    return o


def skin_metro(x, y, w, h):
    o = [rect(x, y, w, h, 0, '#000000')]
    cs = mini_cells(x + 10, y + 10, w - 20, h - 20, 5)
    cols = ['#F09609', '#A200FF', '#1BA1E2', '#339933', '#D80073', '#E51400', '#00ABA9']
    names = ['人脉', '日历', '邮件', '音乐', '消息', '视频', '天气']
    for k, (cx, cy, cw, ch) in enumerate(cs):
        o.append(rect(cx, cy, cw, ch, 0, cols[k]))
        o.append(text(cx + 6, cy + ch - 7, names[k], 's', 11, 400, '#FFFFFF'))
    (hx, hy, hw, hh) = cs[0]
    hh -= 22   # 底部留一条给“人脉”标签
    for k in range(9):
        px, py = hx + (k % 3) * hw / 3, hy + (k // 3) * hh / 3
        o.append(rect(px, py, hw / 3, hh / 3, 0, ['#C85200', '#FF8F3F', '#B04500', '#FFB27A', '#E06200', '#9A3D00', '#FF9F59', '#D35A00', '#FFC394'][k]))
        o.append(f'<circle cx="{f(px + hw / 6)}" cy="{f(py + hh / 6 - 4)}" r="{f(hh / 18)}" fill="#FFFFFF" opacity=".9"/>'
                 f'<path d="M{f(px + hw / 6 - hh / 10)} {f(py + hh / 3 - 6)} a{f(hh / 10)} {f(hh / 12)} 0 0 1 {f(hh / 5)} 0 Z" fill="#FFFFFF" opacity=".9"/>')
    ax, ay, aw, ah = cs[1]
    o.append(text(ax + aw - 8, ay + ah - 22, '24', 's', 30, 300, '#FFFFFF', 'end'))
    bx, by, bw, bh = cs[2]
    o.append(text(bx + bw - 8, by + bh - 22, '12', 's', 30, 300, '#FFFFFF', 'end'))
    cx, cy, cw, ch = cs[3]
    o.append(text(cx + 8, cy + ch / 2 + 8, 'Bento', 's', 22, 300, '#FFFFFF'))
    dx, dy, dw, dh = cs[4]
    o.append(text(dx + 10, dy + dh / 2 + 8, '3  观默：明天见', 's', 18, 300, '#FFFFFF'))
    ex, ey, ew, eh = cs[5]
    o.append(f'<circle cx="{f(ex + ew / 2)}" cy="{f(ey + eh / 2 - 4)}" r="{f(eh * .22)}" fill="none" stroke="#FFFFFF" stroke-width="2"/><path d="M{f(ex + ew / 2 - 4)} {f(ey + eh / 2 - 11)} l10 7 l-10 7 Z" fill="#FFFFFF"/>')
    gx, gy, gw, gh = cs[6]
    o.append(text(gx + gw - 8, gy + gh - 22, '23°', 's', 26, 300, '#FFFFFF', 'end'))
    return o


def skin_ios(x, y, w, h):
    o = [rect(x, y, w, h, 26, 'url(#wall)')]
    cs = mini_cells(x + 14, y + 14, w - 28, h - 28, 10)
    (hx, hy, hw, hh), a, b, c, d, e, g = cs
    o.append(rect(hx, hy, hw, hh, 20, 'url(#sunset)'))
    o.append(f'<circle cx="{f(hx + hw * .68)}" cy="{f(hy + hh * .62)}" r="{f(hh * .16)}" fill="#FFE9B8"/>')
    o.append(rect(hx, hy + hh * .64, hw, hh * .36, 0, '#2B1F5C', 'opacity=".55"'))
    o.append(text(hx + 14, hy + hh - 14, '海边的日落', 'c', 13, 700, '#FFFFFF'))
    ax, ay, aw, ah = a
    o.append(rect(ax, ay, aw, ah, 18, 'url(#iosA)') + text(ax + 10, ay + 36, '23°', 't', 26, 500, '#FFFFFF') + text(ax + 10, ay + ah - 12, '上海 · 晴', 'c', 11, 500, '#FFFFFF'))
    bx, by, bw, bh = b
    o.append(rect(bx, by, bw, bh, 18, '#FFFFFF') + text(bx + 10, by + 20, '星期二', 'c', 10, 700, '#FF3B30') + text(bx + 10, by + 50, '24', 't', 28, 500, INK))
    cx, cy, cw, ch = c
    o.append(rect(cx, cy, cw, ch, 18, '#1C1C1E', 'opacity=".85"'))
    ccx, ccy = cx + cw / 2, cy + ch / 2
    for k in range(3):   # 健身圆环：同心三圈
        rr = cw * [.36, .26, .16][k]
        ang = [290, 220, 140][k]
        col = ['#FF375F', '#30D158', '#64D2FF'][k]
        o.append(f'<circle cx="{f(ccx)}" cy="{f(ccy)}" r="{f(rr)}" fill="none" stroke="{col}" stroke-opacity=".22" stroke-width="8"/>'
                 f'<path d="M{f(ccx)} {f(ccy - rr)} A{f(rr)} {f(rr)} 0 {1 if ang > 180 else 0} 1 {f(ccx + rr * math.sin(math.radians(ang)))} {f(ccy - rr * math.cos(math.radians(ang)))}" fill="none" stroke="{col}" stroke-width="8" stroke-linecap="round"/>')
    dx, dy, dw, dh = d
    o.append(rect(dx, dy, dw, dh, 18, '#1C1C1E', 'opacity=".8"') + rect(dx + 10, dy + 10, dh - 20, dh - 20, 10, 'url(#accH)')
             + text(dx + dh + 2, dy + dh / 2 - 2, 'Bento Grid', 't', 15, 600, '#FFFFFF') + text(dx + dh + 2, dy + dh / 2 + 18, '正在播放', 'c', 11, 400, '#AEAEB2'))
    ex, ey, ew, eh = e
    for k, col in enumerate(['#34C759', '#8E8E93', '#FF9500', '#0A84FF']):
        s = (min(ew, eh) - 12) / 2
        o.append(rect(ex + (ew - 2 * s - 6) / 2 + (k % 2) * (s + 6), ey + (eh - 2 * s - 6) / 2 + (k // 2) * (s + 6), s, s, s * .28, col))
    gx, gy, gw, gh = g
    o.append(rect(gx, gy, gw, gh, 18, '#FFFFFF'))
    ccx, ccy, rr = gx + gw / 2, gy + gh / 2, min(gw, gh) * .36
    o.append(f'<circle cx="{f(ccx)}" cy="{f(ccy)}" r="{f(rr)}" fill="none" stroke="#E5E5EA" stroke-width="2"/><line x1="{f(ccx)}" y1="{f(ccy)}" x2="{f(ccx + rr * .55)}" y2="{f(ccy - rr * .3)}" stroke="{INK}" stroke-width="3" stroke-linecap="round"/><line x1="{f(ccx)}" y1="{f(ccy)}" x2="{f(ccx - rr * .2)}" y2="{f(ccy - rr * .8)}" stroke="{INK}" stroke-width="2" stroke-linecap="round"/><line x1="{f(ccx)}" y1="{f(ccy)}" x2="{f(ccx - rr * .7)}" y2="{f(ccy + rr * .4)}" stroke="#FF9500" stroke-width="1.5"/>')
    return o


def skin_bauhaus(x, y, w, h):
    RED, YEL, BLU, BLK, PAP = '#DB3A26', '#F2B419', '#1F4FA3', '#161514', '#F0E9DA'
    o = [rect(x, y, w, h, 0, PAP)]
    cs = mini_cells(x + 12, y + 12, w - 24, h - 24, 8)
    (hx, hy, hw, hh), a, b, c, d, e, g = cs
    o.append(rect(hx, hy, hw, hh, 0, BLU) + f'<circle cx="{f(hx + hw * .42)}" cy="{f(hy + hh * .5)}" r="{f(hh * .34)}" fill="{YEL}"/>'
             + f'<rect x="{f(hx + hw * .62)}" y="{f(hy + hh * .18)}" width="{f(hh * .3)}" height="{f(hh * .3)}" fill="{RED}"/>')
    ax, ay, aw, ah = a
    o.append(rect(ax, ay, aw, ah, 0, RED) + f'<polygon points="{f(ax + aw / 2)},{f(ay + ah * .2)} {f(ax + aw * .8)},{f(ay + ah * .8)} {f(ax + aw * .2)},{f(ay + ah * .8)}" fill="{PAP}"/>')
    bx, by, bw, bh = b
    o.append(rect(bx, by, bw, bh, 0, YEL) + f'<rect x="{f(bx + bw * .3)}" y="{f(by + bh * .25)}" width="{f(bh * .5)}" height="{f(bh * .5)}" fill="{BLK}"/>')
    cx, cy, cw, ch = c
    o.append(rect(cx, cy, cw, ch, 0, BLK) + f'<circle cx="{f(cx + cw / 2)}" cy="{f(cy + ch * .32)}" r="{f(cw * .3)}" fill="{RED}"/><rect x="{f(cx + cw / 2 - 1.5)}" y="{f(cy + ch * .55)}" width="3" height="{f(ch * .35)}" fill="{PAP}"/>')
    dx, dy, dw, dh = d
    o.append(rect(dx, dy, dw, dh, 0, '#FFFFFF', f'stroke="{BLK}" stroke-width="2"') + text(dx + 14, dy + dh / 2 + 12, 'bauhaus', 'j', 34, 600, BLK) + f'<rect x="{f(dx + dw - 46)}" y="{f(dy + 12)}" width="12" height="{f(dh - 24)}" fill="{RED}"/><rect x="{f(dx + dw - 28)}" y="{f(dy + 12)}" width="12" height="{f(dh - 24)}" fill="{BLU}"/>')
    ex, ey, ew, eh = e
    o.append(rect(ex, ey, ew, eh, 0, PAP, f'stroke="{BLK}" stroke-width="2"') + f'<path d="M{f(ex + 2)} {f(ey + eh - 2)} V{f(ey + 6)} A{f(eh - 8)} {f(eh - 8)} 0 0 1 {f(ex + eh - 6)} {f(ey + eh - 2)} Z" fill="{BLU}"/>')
    gx, gy, gw, gh = g
    o.append(rect(gx, gy, gw, gh, 0, RED) + f'<polygon points="{f(gx + 8)},{f(gy + gh - 8)} {f(gx + gw - 8)},{f(gy + gh - 8)} {f(gx + gw - 8)},{f(gy + 8)}" fill="{BLK}"/>')
    return o


def skin_home(x, y, w, h):
    o = [rect(x, y, w, h, 24, LIGHT)]
    cs = mini_cells(x + 14, y + 14, w - 28, h - 28, 10)
    for cx, cy, cw, ch in cs:
        o.append(rect(cx, cy, cw, ch, 16, '#FFFFFF', 'filter="url(#soft)"'))
    (hx, hy, hw, hh), a, b, c, d, e, g = cs
    o.append(f'<circle cx="{f(hx + 38)}" cy="{f(hy + 38)}" r="22" fill="url(#acc)"/>' + text(hx + 38, hy + 46, '观', 'c', 20, 900, '#FFFFFF', 'middle')
             + text(hx + 16, hy + 92, '观默', 'c', 22, 900, INK) + text(hx + 16, hy + 112, '@guanmo_ai', 't', 12, 500, INK2)
             + text(hx + 16, hy + 138, '每天拆解一个设计风格', 'c', 12, 400, INK2))
    ax, ay, aw, ah = a
    o.append(text(ax + 12, ay + 32, 'X', 't', 22, 700, INK) + rect(ax + aw - 40, ay + 12, 30, 16, 8, INK) + text(ax + 12, ay + ah - 12, '@guanmo_ai', 't', 10, 500, INK))
    bx, by, bw, bh = b
    for k in range(18):
        o.append(rect(bx + 10 + (k % 6) * ((bw - 20) / 6), by + 22 + (k // 6) * 13, (bw - 20) / 6 - 3, 10, 2, ['#EBEDF0', '#9BE9A8', '#40C463', '#30A14E', '#216E39'][(k * 7) % 5]))
    o.append(text(bx + 10, by + 15, 'GitHub', 't', 10, 600, INK))
    cx, cy, cw, ch = c
    o.append(rect(cx + 8, cy + 8, cw - 16, ch * .62, 10, '#F0E9DA') + f'<circle cx="{f(cx + cw * .42)}" cy="{f(cy + ch * .3)}" r="{f(cw * .26)}" fill="#1F4FA3"/>'
             + f'<rect x="{f(cx + cw * .5)}" y="{f(cy + ch * .14)}" width="{f(cw * .32)}" height="{f(cw * .32)}" fill="#DB3A26"/>' + text(cx + 10, cy + ch - 16, 'No.001 包豪斯', 'c', 10, 700, INK))
    dx, dy, dw, dh = d
    o.append(text(dx + 14, dy + 26, '订阅更新', 'c', 15, 900, INK) + rect(dx + 14, dy + dh - 34, dw - 90, 22, 11, LIGHT) + rect(dx + dw - 68, dy + dh - 34, 54, 22, 11, INK) + text(dx + dw - 41, dy + dh - 19, '订阅', 'c', 11, 700, '#FFFFFF', 'middle'))
    ex, ey, ew, eh = e
    o.append(rect(ex, ey, ew, eh, 16, INK) + spans(ex + 10, ey + eh - 14, [('15', 'd', 34, 600, 'url(#acc)', 0), ('秒', 'c', 11, 700, '#FFFFFF', 3)]))
    gx, gy, gw, gh = g
    for k, s in enumerate(['Remotion', 'SVG']):
        o.append(rect(gx + 10, gy + 12 + k * 24, 62, 18, 9, LIGHT) + text(gx + 41, gy + 25 + k * 24, s, 't', 10, 500, INK, 'middle'))
    return o


def skin_dash(x, y, w, h):
    o = [rect(x, y, w, h, 24, '#000000')]
    cs = mini_cells(x + 14, y + 14, w - 28, h - 28, 10)
    for cx, cy, cw, ch in cs:
        o.append(rect(cx, cy, cw, ch, 16, 'url(#card)', 'stroke="rgba(255,255,255,0.08)"'))
    (hx, hy, hw, hh), a, b, c, d, e, g = cs
    o.append(text(hx + 14, hy + 24, '收入 · 本月', 'c', 11, 500, T2) + spans(hx + 14, hy + 64, [('¥', 'd', 20, 600, T1, 0), ('1,281,698', 'd', 34, 600, T1, 2)]))
    pts = [(0, .7), (.1, .62), (.2, .66), (.3, .5), (.4, .55), (.5, .4), (.6, .46), (.7, .3), (.8, .34), (.9, .2), (1, .24)]
    path = ' '.join(f'{"M" if k == 0 else "L"}{f(hx + 10 + px * (hw - 20))} {f(hy + 80 + py * (hh - 100))}' for k, (px, py) in enumerate(pts))
    o.append(f'<path d="{path} L{f(hx + hw - 10)} {f(hy + hh - 10)} L{f(hx + 10)} {f(hy + hh - 10)} Z" fill="{INDIGO}" opacity=".18"/><path d="{path}" fill="none" stroke="{INDIGO}" stroke-width="2.5"/>')
    for (cx, cy, cw, ch), (lab, val) in zip([a, b, e, g], [('活跃用户', '8,214'), ('转化率', '3.8%'), ('可用性', '99.9%'), ('新订单', '324')]):
        o.append(text(cx + 10, cy + 18, lab, 'c', 10, 500, T2) + text(cx + 10, cy + ch - 12, val, 'd', 22, 600, T1))
    cx, cy, cw, ch = c
    o.append(text(cx + 10, cy + 18, '本周订单', 'c', 10, 500, T2))
    for k, v in enumerate([.4, .7, .55, .9, .65]):
        bw_ = (cw - 20) / 5 - 4
        o.append(rect(cx + 10 + k * (bw_ + 4), cy + ch - 12 - v * (ch - 50), bw_, v * (ch - 50), 3, INDIGO if k == 3 else '#2C2C30'))
    dx, dy, dw, dh = d
    o.append(text(dx + 12, dy + 20, '流量来源', 'c', 10, 500, T2))
    acc = 0
    for k, (v, col) in enumerate([(.42, INDIGO), (.28, VIOLET), (.18, '#5A5A60'), (.12, '#3A3A40')]):
        o.append(rect(dx + 12 + acc * (dw - 24), dy + 30, v * (dw - 24) - 3, 6, 3, col))
        acc += v
    for k, (v, n) in enumerate([('42%', '搜索'), ('28%', '社交'), ('18%', '直接')]):
        o.append(spans(dx + 12 + k * (dw - 24) / 3, dy + dh - 14, [(v, 'd', 18, 600, T1, 0), (n, 'c', 9, 400, T2, 4)]))
    return o


def skins():
    o = ['  <rect width="1080" height="1350" fill="#0B0B0C"/>']
    o.append('  ' + text(M, 124, '同一套格子，换六种皮', 'c', 56, 900, T1, ls=2))
    o.append('  ' + text(M, 172, '风格是皮，布局是骨。格子不变：4 列 · 7 张卡 · 主角占 2×2', 'c', 22, 400, T2))
    pw, ph = (W - 2 * M - GAP * 1.5) / 2, 270
    items = [(skin_bento, '01', '便当漆盒', '名字的由来'), (skin_metro, '02', 'Metro 磁贴', '前身 · 2010'), (skin_ios, '03', 'iOS 小组件', '前身 · 2020'),
             (skin_bauhaus, '04', '包豪斯', '风格 · NO. 001'), (skin_home, '05', '浅色主页', 'bento.me 式'), (skin_dash, '06', '深色后台', 'Linear 式')]
    for k, (fn, n, name, sub) in enumerate(items):
        px = M + (k % 2) * (pw + GAP * 1.5)
        py = 222 + (k // 2) * (ph + 76)
        o.append(f'  <!-- {n} {name} -->')
        o.append('  <g>' + ''.join(fn(px, py, pw, ph)) + '</g>')
        o.append('  ' + spans(px, py + ph + 40, [(n, 'm', 18, 500, PINK, 0), (name, 'c', 24, 700, T1, 12)]))
        o.append('  ' + text(px + pw, py + ph + 40, sub, 'c', 18, 400, T2, 'end'))
    o.append(f'  <rect x="{M}" y="1264" width="{W - 2 * M}" height="1" fill="#2A2A2E"/>')
    o.append('  ' + text(M, 1306, '换掉颜色、圆角和内容，格子还是那套格子 —— 这就是“布局”和“风格”的区别', 'c', 18, 400, T2))
    extra = f"""
    <linearGradient id="lacq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8E211B"/><stop offset="1" stop-color="#68140F"/></linearGradient>
    <linearGradient id="wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1D2B64"/><stop offset=".55" stop-color="#6B3FA0"/><stop offset="1" stop-color="#F08A5D"/></linearGradient>
    <linearGradient id="sunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A2A8C"/><stop offset=".45" stop-color="#C2508E"/><stop offset=".7" stop-color="#FF9A62"/><stop offset="1" stop-color="#FFC27A"/></linearGradient>
    <linearGradient id="iosA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5FB0FF"/><stop offset="1" stop-color="#1E6FFF"/></linearGradient>"""
    return svg('同一套格子，换六种皮', '\n'.join(o) + '\n', extra)


# ======================================================================
# 4. 三套排法（线框模板）
# ======================================================================
def templates():
    o = ['  <rect width="1080" height="1350" fill="#0B0B0C"/>']
    o.append('  ' + text(M, 124, '拿来就用：三套排法', 'c', 56, 900, T1, ls=2))
    o.append('  ' + text(M, 172, '同一张 4 列网格 · 间距 20 · 圆角 32 —— 换内容，不换骨架', 'c', 22, 400, T2))
    rowh = 78
    sets = [
        ('A', '产品卖点', '发布会式', [(0, 0, 2, 2, '主角 · 产品图', '2×2'), (2, 0, 1, 1, '续航', '大数字'), (2, 1, 1, 1, '性能', '大数字'), (3, 0, 1, 2, '配色', '1×2'),
                                     (0, 2, 2, 1, '一句话卖点', '2×1'), (2, 2, 1, 1, '开关', '功能'), (3, 2, 1, 1, '价格', '收尾')]),
        ('B', '个人主页', 'bento.me 式', [(0, 0, 1, 3, '头像 · 名字 · 简介', '不装卡片'), (1, 0, 2, 1, 'GitHub', '2×1'), (3, 0, 1, 1, 'X', '1×1'),
                                         (1, 1, 2, 2, '代表作品', '2×2'), (3, 1, 1, 1, '数字', '1×1'), (3, 2, 1, 1, '订阅', '1×1')]),
        ('C', '数据看板', 'Linear 式', [(0, 0, 1, 1, '指标', '1×1'), (1, 0, 1, 1, '指标', '1×1'), (2, 0, 2, 2, '主图表', '2×2'), (0, 1, 1, 1, '指标', '1×1'),
                                       (1, 1, 1, 1, '指标', '1×1'), (0, 2, 2, 1, '占比', '2×1'), (2, 2, 2, 1, '列表 / 柱状', '2×1')]),
    ]
    y0 = 228
    for k, (n, name, sub, cells) in enumerate(sets):
        gy = y0 + k * 350
        o.append(f'  <!-- {n} {name} -->')
        o.append('  ' + spans(M, gy, [(n, 'm', 20, 500, PINK, 0), (name, 'c', 26, 700, T1, 12), (sub, 'c', 20, 400, T2, 12)]))
        top = gy + 26
        for c in range(4):  # 列线
            cx = M + c * (COLW + GAP)
            o.append(f'  <rect x="{f(cx)}" y="{f(top - 6)}" width="{f(COLW)}" height="{f(3 * rowh + 2 * GAP + 12)}" fill="{PINK}" opacity=".05"/>')
        for c, r, tw, th, a, b in cells:
            x, y, w, h = cell(c, r, tw, th, gy=top, rowh=rowh)
            dashed = b == '不装卡片'
            hero = tw == 2 and th == 2
            if dashed:
                o.append(f'  <rect x="{f(x + 1)}" y="{f(y + 1)}" width="{f(w - 2)}" height="{f(h - 2)}" rx="{R}" fill="none" stroke="{T2}" stroke-opacity=".5" stroke-dasharray="6 6"/>')
                o.append(f'  <circle cx="{f(x + 44)}" cy="{f(y + 48)}" r="24" fill="url(#acc)"/>')
                for j, ww in enumerate([120, 160, 140]):
                    o.append(f'  <rect x="{f(x + 20)}" y="{f(y + 96 + j * 22)}" width="{ww}" height="8" rx="4" fill="{T2}" opacity="{.5 if j else .9}"/>')
                o.append('  ' + text(x + 20, y + h - 22, a, 'c', 16, 500, T2))
                continue
            o.append('  ' + rect(x, y, w, h, R if h > 120 else 24, 'url(#card)', f'stroke="{PINK if hero else "rgba(255,255,255,0.14)"}" stroke-width="{1.5 if hero else 1}"'))
            o.append('  ' + text(x + 20, y + 34, a, 'c', 18, 700, T1))
            o.append('  ' + text(x + 20, y + 58, b, 'm' if '×' in b else 'c', 14, 400, PINK if hero else T2))
        if k == 0:  # 标注：间距
            x1 = M + 2 * COLW + GAP
            o.append(f'  <rect x="{f(x1)}" y="{f(top + rowh + 2)}" width="{GAP}" height="{rowh - 4}" fill="{PINK}" opacity=".7"/>')
            o.append('  ' + text(x1 + GAP / 2, top + rowh * 1.5 + 6, '20', 'm', 13, 500, '#FFFFFF', 'middle', extra='transform="rotate(-90 %s %s)"' % (f(x1 + GAP / 2), f(top + rowh * 1.5))))
    o.append(f'  <rect x="{M}" y="1264" width="{W - 2 * M}" height="1" fill="#2A2A2E"/>')
    o.append('  ' + spans(M, 1306, [('手机上：', 'c', 18, 700, T1, 0), ('4 列 → 2 列，从左到右、从上到下排成一列；主角始终最宽。', 'c', 18, 400, T2, 4)]))
    return svg('三套排法', '\n'.join(o) + '\n')


if __name__ == '__main__':
    for name, fn in [('poster', poster), ('cheatsheet', cheatsheet), ('skins', skins), ('templates', templates)]:
        path = os.path.join(HERE, f'{name}.svg')
        with open(path, 'w', encoding='utf-8') as fh:
            fh.write(fn())
        print('wrote', os.path.relpath(path, os.path.join(HERE, '..', '..', '..')))
