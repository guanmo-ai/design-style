"""维也纳分离派的零件：方格搭的字母、一张张方形金箔、棋盘格边、按四分法细分的方格纹样、圆冠的树。

整张画都是 SVG，不用照片。金箔的质感是滤镜算的：噪声当成起皱的表面，打一盏斜上方的灯，
亮处发白、暗处发褐；每张金箔是一个方块，相邻两张之间留一条细缝，露出底下的红褐色底漆。
"""
import math
import os
import random

FONTS = os.environ.get('FONTS', '../../public/fonts')
INK, PAPER, BONE, GOLD, GOLD_HI, GOLD_LO, BOLE, GREEN = (
    '#121110', '#F2EDE2', '#E4DCCB', '#C99A2E', '#F3D98A', '#7A5514', '#6E2A17', '#2F4A3A')
FACES = {'Jost': 'Jost.ttf', 'Corm': 'Cormorant.ttf', 'Song': 'NotoSerifSC.ttf', 'Hei': 'NotoSansSC-Black.otf',
         'HeiM': 'NotoSansSC-Medium.otf', 'Qk': 'ZCOOLQingKeHuangYou.ttf'}
VAR = {'Jost', 'Corm', 'Song'}

# —— 字母 ————————————————————————————————————————————————
# 分离派海报的手绘字：又高又窄（宽 3、高 7 个单位），笔画一样粗（1 个单位），
# 弯的地方都是整半圆，横画故意放得很高或很低。这里每个字母是一条（或几条）等粗的中心线，
# 用 stroke 画出来；圆弧半径 = 字宽的一半减半个笔画。字母不是从字体里来的，所以片子里可以一笔一笔长出来。
WAIST = 2.4   # 高腰：E、A、R、S 的横画 / 腰线放在离顶 2.4 个单位处（正中是 3.5）


def glyph_paths(ch, x, y, u):
    """返回 (中心线 path 列表, 小方点列表)。(x, y) 是字框左上角。"""
    t = u
    L, R = x + t / 2, x + 3 * u - t / 2
    T, B = y + t / 2, y + 7 * u - t / 2
    r = (R - L) / 2
    C = (L + R) / 2
    m = y + WAIST * u
    f = lambda v: f'{v:.2f}'
    arc = lambda x2, y2, sweep: f'A{f(r)},{f(r)} 0 0 {sweep} {f(x2)},{f(y2)}'
    P, D = [], []
    if ch == 'O':
        P.append(f'M{f(L)},{f(T + r)}{arc(R, T + r, 1)}V{f(B - r)}{arc(L, B - r, 1)}Z')
        D.append((C, y + 3.5 * u, .34))
    elif ch == 'Q':
        P.append(f'M{f(L)},{f(T + r)}{arc(R, T + r, 1)}V{f(B - r)}{arc(L, B - r, 1)}Z')
        P.append(f'M{f(C)},{f(B - r * .2)}L{f(R + u * .7)},{f(B + u * .55)}')
    elif ch == 'C':
        P.append(f'M{f(R)},{f(T + r + u * .7)}V{f(T + r)}{arc(L, T + r, 0)}V{f(B - r)}{arc(R, B - r, 0)}V{f(B - r - u * .7)}')
    elif ch == 'G':
        P.append(f'M{f(R)},{f(T + r + u * .7)}V{f(T + r)}{arc(L, T + r, 0)}V{f(B - r)}{arc(R, B - r, 0)}V{f(m + u * 1.6)}H{f(C)}')
    elif ch == 'S':
        P.append(f'M{f(R)},{f(T + r + u * .6)}V{f(T + r)}{arc(L, T + r, 0)}V{f(m - r)}{arc(C, m, 0)}'
                 f'{arc(R, m + r, 1)}V{f(B - r)}{arc(L, B - r, 1)}V{f(B - r - u * .6)}')
    elif ch == 'E':
        P.append(f'M{f(R)},{f(T)}H{f(L)}V{f(B)}H{f(R)}M{f(L)},{f(m)}H{f(R - u * .25)}')
        D.append((C + u * .15, m + u * 1.6, .3))
    elif ch == 'F':
        P.append(f'M{f(R)},{f(T)}H{f(L)}V{f(B + t / 2)}M{f(L)},{f(m)}H{f(R - u * .25)}')
    elif ch == 'N':
        P.append(f'M{f(L)},{f(B + t / 2)}V{f(T + r)}{arc(R, T + r, 1)}V{f(B + t / 2)}')
    elif ch == 'U':
        P.append(f'M{f(L)},{f(T - t / 2)}V{f(B - r)}{arc(R, B - r, 0)}V{f(T - t / 2)}')
    elif ch == 'A':
        P.append(f'M{f(L)},{f(B + t / 2)}V{f(T + r)}{arc(R, T + r, 1)}V{f(B + t / 2)}M{f(L)},{f(m + u * .6)}H{f(R)}')
    elif ch == 'D':
        P.append(f'M{f(L)},{f(T)}H{f(C)}{arc(R, T + r, 1)}V{f(B - r)}{arc(C, B, 1)}H{f(L)}Z')
    elif ch == 'R':
        P.append(f'M{f(L)},{f(B + t / 2)}V{f(T)}H{f(C)}{arc(R, T + r, 1)}V{f(m + u * .6 - r)}{arc(C, m + u * .6, 1)}H{f(L)}'
                 f'M{f(C)},{f(m + u * .6)}{arc(R, m + u * .6 + r, 1)}V{f(B + t / 2)}')
    elif ch == 'B':
        P.append(f'M{f(L)},{f(T)}H{f(C)}{arc(R, T + r, 1)}V{f(m + u * .6 - r)}{arc(C, m + u * .6, 1)}H{f(L)}'
                 f'M{f(C)},{f(m + u * .6)}{arc(R, m + u * .6 + r, 1)}V{f(B - r)}{arc(C, B, 1)}H{f(L)}V{f(T)}')
    elif ch == 'P':
        P.append(f'M{f(L)},{f(B + t / 2)}V{f(T)}H{f(C)}{arc(R, T + r, 1)}V{f(m + u * .6 - r)}{arc(C, m + u * .6, 1)}H{f(L)}')
    elif ch == 'T':
        P.append(f'M{f(L - t / 2)},{f(T)}H{f(R + t / 2)}M{f(C)},{f(T)}V{f(B + t / 2)}')
    elif ch == 'I':
        P.append(f'M{f(C)},{f(T - t / 2)}V{f(B + t / 2)}')
    elif ch == 'L':
        P.append(f'M{f(L)},{f(T - t / 2)}V{f(B)}H{f(R + t / 2)}')
    elif ch == 'H':
        P.append(f'M{f(L)},{f(T - t / 2)}V{f(B + t / 2)}M{f(R)},{f(T - t / 2)}V{f(B + t / 2)}M{f(L)},{f(m + u * .6)}H{f(R)}')
    elif ch == 'W':
        R5, C5 = x + 5 * u - t / 2, x + 2.5 * u
        P.append(f'M{f(L)},{f(T - t / 2)}V{f(B - r)}{arc(C5, B - r, 0)}V{f(m + u)}M{f(C5)},{f(B - r)}{arc(R5, B - r, 0)}V{f(T - t / 2)}')
    elif ch == 'V':
        P.append(f'M{f(L)},{f(T - t / 2)}V{f(m + u)}L{f(C)},{f(B + t / 2)}L{f(R)},{f(m + u)}V{f(T - t / 2)}')
    elif ch == 'K':
        P.append(f'M{f(L)},{f(T - t / 2)}V{f(B + t / 2)}M{f(R)},{f(T - t / 2)}V{f(m - r)}{arc(C, m, 1)}H{f(L)}'
                 f'M{f(C)},{f(m)}{arc(R, m + r, 1)}V{f(B + t / 2)}')
    elif ch == 'M':
        R5, C5 = x + 5 * u - t / 2, x + 2.5 * u
        P.append(f'M{f(L)},{f(B + t / 2)}V{f(T + r)}{arc(C5, T + r, 1)}V{f(m + u)}M{f(C5)},{f(T + r)}{arc(R5, T + r, 1)}V{f(B + t / 2)}')
    elif ch == 'Y':
        P.append(f'M{f(L)},{f(T - t / 2)}V{f(m - r)}{arc(R, m - r, 0)}V{f(T - t / 2)}M{f(C)},{f(m)}V{f(B + t / 2)}')
    elif ch == 'Z':
        P.append(f'M{f(L)},{f(T)}H{f(R)}V{f(m - r)}{arc(C, m, 1)}{arc(L, m + r, 0)}V{f(B)}H{f(R)}')
    elif ch == 'X':
        cy = y + 3.5 * u
        P.append(f'M{f(L)},{f(T - t / 2)}V{f(cy - u * 1.3)}L{f(R)},{f(cy + u * 1.3)}V{f(B + t / 2)}'
                 f'M{f(R)},{f(T - t / 2)}V{f(cy - u * 1.3)}L{f(L)},{f(cy + u * 1.3)}V{f(B + t / 2)}')
    elif ch == '-':
        P.append(f'M{f(x)},{f(y + 3.5 * u)}H{f(x + 2 * u)}')
    elif ch == '1':
        P.append(f'M{f(L)},{f(T + u * .8)}L{f(C)},{f(T - t / 2)}V{f(B)}M{f(L - t / 2)},{f(B)}H{f(R + t / 2)}')
    elif ch == '8':
        P.append(f'M{f(L)},{f(T + r)}{arc(R, T + r, 1)}V{f(m + u * .6 - r)}{arc(L, m + u * .6 - r, 1)}Z')
        P.append(f'M{f(L)},{f(m + u * .6 + r)}{arc(R, m + u * .6 + r, 1)}V{f(B - r)}{arc(L, B - r, 1)}Z')
    elif ch == '9':
        P.append(f'M{f(R)},{f(m + u * .6 - r)}{arc(L, m + u * .6 - r, 1)}V{f(T + r)}{arc(R, T + r, 1)}V{f(B - r)}{arc(L, B - r, 1)}V{f(B - r - u * .6)}')
    elif ch == '7':
        P.append(f'M{f(L - t / 2)},{f(T)}H{f(R)}V{f(m + u)}L{f(C)},{f(B + t / 2)}')
    elif ch == '0':
        P.append(f'M{f(L)},{f(T + r)}{arc(R, T + r, 1)}V{f(B - r)}{arc(L, B - r, 1)}Z')
    elif ch == '2':
        P.append(f'M{f(L)},{f(T + r + u * .6)}V{f(T + r)}{arc(R, T + r, 1)}V{f(m + u * .4)}L{f(L)},{f(B)}H{f(R + t / 2)}')
    elif ch == '3':
        P.append(f'M{f(L)},{f(T)}H{f(C)}{arc(R, T + r, 1)}V{f(m + u * .6 - r)}{arc(C, m + u * .6, 1)}H{f(L + u * .3)}'
                 f'M{f(C)},{f(m + u * .6)}{arc(R, m + u * .6 + r, 1)}V{f(B - r)}{arc(C, B, 1)}H{f(L)}')
    elif ch == '4':
        P.append(f'M{f(R - u * .3)},{f(B + t / 2)}V{f(T - t / 2)}M{f(L)},{f(T - t / 2)}V{f(m + u * .6)}H{f(R + t / 2)}')
    elif ch == '5':
        P.append(f'M{f(R)},{f(T)}H{f(L)}V{f(m + u * .6)}H{f(C)}{arc(R, m + u * .6 + r, 1)}V{f(B - r)}{arc(C, B, 1)}H{f(L - t / 2)}')
    elif ch == '6':
        P.append(f'M{f(R)},{f(T)}H{f(C)}{arc(L, T + r, 0)}V{f(B - r)}{arc(R, B - r, 0)}V{f(m + u * .6 + r)}{arc(L, m + u * .6 + r, 0)}')
    elif ch == '.':
        D.append((x + u * .5, B - u * .1, .9))
    return P, D


WIDTH = {'I': 1, ' ': 2, '.': 1, 'M': 5, 'W': 5, '-': 2}


def adv(ch):
    return WIDTH.get(ch, 3)


def width(text, gap=1):
    return sum(adv(c) for c in text) + gap * (len(text) - 1)


def word(text, x, y, u, fill=INK, dot=GOLD, gap=1, extra=''):
    """一行字。(x, y) 是左上角，u 是一个单位（笔画粗细）；字高 7u。字怀里的小方点用 dot 色。"""
    out, cx = [], x
    for ch in text:
        if ch == 'I':
            P, D = glyph_paths('I', cx - u, y, u)
        else:
            P, D = glyph_paths(ch, cx, y, u)
        for p in P:
            out.append(f'<path d="{p}" fill="none" stroke="{fill}" stroke-width="{u:.2f}" stroke-linejoin="miter" {extra}/>')
        for (dx, dy, k) in D:
            s = u * k * 2
            out.append(f'<rect x="{dx - s / 2:.2f}" y="{dy - s / 2:.2f}" width="{s:.2f}" height="{s:.2f}" fill="{dot}"/>')
        cx += (adv(ch) + gap - (OPEN_RIGHT.get(ch, 0) if gap else 0)) * u
    return ''.join(out)


OPEN_RIGHT = {'E': .45, 'C': .4, 'F': .5, 'L': .5, 'T': .25, 'S': .1, 'Z': .1}   # 右边开口的字母，后面的字距收一点


def text_width(text, u, gap=1):
    return (width(text, gap) - sum(OPEN_RIGHT.get(c, 0) for c in text[:-1])) * u


# —— 金箔 ————————————————————————————————————————————————
def gold_defs(uid='g', seed=3, freq='.018 .026'):
    """金箔滤镜：起皱的表面打一盏灯；配一个金色渐变。uid 区分同一页里的不同尺度。"""
    return (
        f'<linearGradient id="{uid}grad" x1="0" y1="0" x2="1" y2="1">'
        f'<stop offset="0" stop-color="{GOLD_HI}"/><stop offset=".38" stop-color="{GOLD}"/>'
        f'<stop offset=".62" stop-color="#B88422"/><stop offset="1" stop-color="{GOLD_HI}"/></linearGradient>'
        f'<filter id="{uid}leaf" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">'
        f'<feTurbulence type="fractalNoise" baseFrequency="{freq}" numOctaves="3" seed="{seed}" result="n"/>'
        f'<feDiffuseLighting in="n" surfaceScale="1.5" diffuseConstant="1.12" lighting-color="#fff" result="d">'
        f'<feDistantLight azimuth="235" elevation="38"/></feDiffuseLighting>'
        f'<feSpecularLighting in="n" surfaceScale="1.6" specularConstant="1.25" specularExponent="16" lighting-color="#FFF4D0" result="s">'
        f'<feDistantLight azimuth="235" elevation="44"/></feSpecularLighting>'
        f'<feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1="1.05" k2="0" k3="0" k4="0" result="lit"/>'
        f'<feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/>'
        f'<feComposite in="lit" in2="s2" operator="arithmetic" k1="0" k2="1" k3=".55" k4="0" result="all"/>'
        f'<feComposite in="all" in2="SourceAlpha" operator="in"/></filter>')


def leaf_tiles(x, y, w, h, n, rng, seam=1.4):
    """把 (x, y, w, h) 铺成 n 列方形金箔（最后一行 / 列裁掉），每张颜色微微不同；缝里露底漆。"""
    s = w / n
    out = [f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{BOLE}"/>']
    j = 0
    while j * s < h - .5:
        for i in range(n):
            hh = min(s, h - j * s)
            dx, dy = rng.uniform(-.6, .6), rng.uniform(-.6, .6)
            tone = rng.choice(['#C99A2E', '#D2A638', '#C08F28', '#DDB650', '#B5862A', '#CFA235'])
            out.append(f'<rect x="{x + i * s + seam / 2 + dx:.1f}" y="{y + j * s + seam / 2 + dy:.1f}" '
                       f'width="{s - seam:.1f}" height="{hh - seam:.1f}" fill="{tone}"/>')
        j += 1
    return ''.join(out)


# —— 棋盘格与方格细分 ———————————————————————————————————————————
def checker(x, y, cols, rows, s, a=INK, b=PAPER):
    out = [f'<rect x="{x}" y="{y}" width="{cols * s}" height="{rows * s}" fill="{b}"/>']
    for j in range(rows):
        for i in range(cols):
            if (i + j) % 2 == 0:
                out.append(f'<rect x="{x + i * s:.2f}" y="{y + j * s:.2f}" width="{s:.2f}" height="{s:.2f}" fill="{a}"/>')
    return ''.join(out)


def checker_band(x, y, length, s, horizontal=True, a=INK, b=PAPER):
    n = int(round(length / s))
    return checker(x, y, n, 2, s, a, b) if horizontal else checker(x, y, 2, n, s, a, b)


def motif(kind, x, y, s, fill=INK, bg=PAPER, gold='url(#ggrad)'):
    """一格里的纹样。所有纹样都只用方块和圆，尺寸都是格边长的简单分数。"""
    r = []
    if kind == 'solid':
        r.append(f'<rect x="{x}" y="{y}" width="{s}" height="{s}" fill="{fill}"/>')
    elif kind == 'dot':
        k = s * .36
        r.append(f'<rect x="{x + k:.2f}" y="{y + k:.2f}" width="{s - 2 * k:.2f}" height="{s - 2 * k:.2f}" fill="{fill}"/>')
    elif kind == 'ring':
        r.append(f'<circle cx="{x + s / 2:.2f}" cy="{y + s / 2:.2f}" r="{s * .34:.2f}" fill="none" stroke="{fill}" stroke-width="{s * .1:.2f}"/>')
    elif kind == 'disc':
        r.append(f'<circle cx="{x + s / 2:.2f}" cy="{y + s / 2:.2f}" r="{s * .38:.2f}" fill="{fill}"/>')
    elif kind == 'check2':
        r.append(checker(x, y, 2, 2, s / 2, fill, bg))
    elif kind == 'check4':
        r.append(checker(x, y, 4, 4, s / 4, fill, bg))
    elif kind == 'frame':
        t = s * .12
        r.append(f'<rect x="{x + t / 2:.2f}" y="{y + t / 2:.2f}" width="{s - t:.2f}" height="{s - t:.2f}" fill="none" stroke="{fill}" stroke-width="{t:.2f}"/>')
        k = s * .38
        r.append(f'<rect x="{x + k:.2f}" y="{y + k:.2f}" width="{s - 2 * k:.2f}" height="{s - 2 * k:.2f}" fill="{fill}"/>')
    elif kind == 'gold':
        r.append(f'<rect x="{x}" y="{y}" width="{s}" height="{s}" fill="{gold}"/>')
    elif kind == 'golddot':
        k = s * .3
        r.append(f'<rect x="{x + k:.2f}" y="{y + k:.2f}" width="{s - 2 * k:.2f}" height="{s - 2 * k:.2f}" fill="{gold}"/>')
    elif kind == 'stripes':
        n = 4
        for i in range(n):
            if i % 2 == 0:
                r.append(f'<rect x="{x + i * s / n:.2f}" y="{y}" width="{s / n:.2f}" height="{s}" fill="{fill}"/>')
    return ''.join(r)


def quadtree(x, y, s, depth, rng, kinds, split=.55, min_s=20):
    """四分法：一个方格要么放一种纹样，要么切成四个小方格再各自决定。返回 [(纹样, x, y, 边长)]。"""
    if depth > 0 and s / 2 >= min_s and rng.random() < split:
        h = s / 2
        out = []
        for dx, dy in ((0, 0), (h, 0), (0, h), (h, h)):
            out += quadtree(x + dx, y + dy, h, depth - 1, rng, kinds, split * .85, min_s)
        return out
    return [(rng.choice(kinds), x, y, s)]


def tree(cx, top, r, trunk_h, fill, trunk=INK, tw=None):
    """圆冠的树：一个正圆树冠、一根竖直的树干。"""
    tw = tw or r * .12
    return (f'<rect x="{cx - tw / 2:.1f}" y="{top + r:.1f}" width="{tw:.1f}" height="{trunk_h:.1f}" fill="{trunk}"/>'
            f'<circle cx="{cx:.1f}" cy="{top + r:.1f}" r="{r:.1f}" fill="{fill}"/>')


DEFS = ('<filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000" flood-opacity=".45"/></filter>'
        '<filter id="lift" x="-50%" y="-50%" width="200%" height="220%"><feDropShadow dx="10" dy="26" stdDeviation="12" flood-color="#000" flood-opacity=".42"/></filter>'
        '<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5"/>'
        '<feColorMatrix values="0 0 0 0 .3  0 0 0 0 .25  0 0 0 0 .18  0 0 0 .14 0"/></filter>'
        '<filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012 .4" numOctaves="2" seed="9"/>'
        '<feColorMatrix values="0 0 0 0 .45  0 0 0 0 .38  0 0 0 0 .26  0 0 0 .1 -.01"/></filter>')


def page(W, H, body, css=''):
    faces = ''.join(f'@font-face{{font-family:{k};src:url({FONTS}/{v}){";font-weight:100 900" if k in VAR else ""}}}' for k, v in FACES.items())
    return (f'<!doctype html><meta charset="utf-8"><style>{faces}html,body{{margin:0;background:#0b0a09;overflow:hidden}}'
            f'#stage{{position:absolute;left:0;top:0;width:{W}px;height:{H}px;overflow:hidden;transform-origin:0 0}}{css}</style>'
            f'<div id="stage">{body}</div><script>const q=new URLSearchParams(location.search||location.hash.slice(1));'
            f'if(q.has("x"))document.getElementById("stage").style.transform="translate("+(-q.get("x"))+"px,"+(-q.get("y"))+"px)"</script>')


TONES = ['#C99A2E', '#D2A638', '#C08F28', '#DDB650', '#B5862A', '#CFA235']


def gilded(shape_clip, x, y, w, h, n, rng, uid, missing=(), seam=1.0):
    """在 (x, y, w, h) 里铺 n 列方形金箔，裁成 shape_clip（一段 SVG 形状，如 <circle .../>）。
    每张箔片颜色和反光都略有不同（各自朝着不太一样的方向）；missing 里的格子还没贴，露出底漆。"""
    tile = w / n
    rows = int(math.ceil(h / tile))
    leaf, sheen = [], []
    for j in range(rows):
        for i in range(n):
            if (i, j) in missing:
                continue
            x0, y0 = x + i * tile, y + j * tile
            leaf.append(f'<rect x="{x0:.1f}" y="{y0:.1f}" width="{tile:.1f}" height="{tile:.1f}" fill="#7d5a14"/>')
            leaf.append(f'<rect x="{x0 + seam / 2:.1f}" y="{y0 + seam / 2:.1f}" width="{tile - seam:.1f}" height="{tile - seam:.1f}" fill="{rng.choice(TONES)}"/>')
            a = rng.random()
            if a > .55:
                sheen.append(f'<rect x="{x0:.1f}" y="{y0:.1f}" width="{tile:.1f}" height="{tile:.1f}" fill="#FFF6D8" opacity="{(a - .55) * .45:.2f}"/>')
            elif a < .18:
                sheen.append(f'<rect x="{x0:.1f}" y="{y0:.1f}" width="{tile:.1f}" height="{tile:.1f}" fill="#3a2508" opacity="{(.18 - a) * .9:.2f}"/>')
    return (f'<clipPath id="{uid}">{shape_clip}</clipPath><g clip-path="url(#{uid})">'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{BOLE}"/>'
            f'<g filter="url(#gleaf)">{"".join(leaf)}</g>'
            f'{"".join(sheen)}</g>')
