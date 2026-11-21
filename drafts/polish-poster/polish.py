"""波兰海报学派的零件：水粉平涂（边缘抖、里面有刷痕）、干笔的笔触（一根根鬃毛，尾巴散开）、手写字（字边过一遍抖动），
和一只用两笔画成的鸟。全部是 SVG；笔触是一组沿中心线偏移的折线，所以做成片子时“画出来”= 每根鬃毛的 dash 往前走。"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dada'))
import dada  # noqa: E402
from dada import page  # noqa: E402,F401

dada.FACES.update({'Lond': 'LondrinaSolid-Black.ttf', 'Brush': 'CaveatBrush-Regular.ttf',
                   'Mono': 'IBMPlexMono-Regular.ttf', 'Kuai': 'ZCOOLKuaiLe-Regular.ttf'})

BLUE, BLUE2, CREAM, INK, RED, OCHRE, PINK = '#2B4C9E', '#21397A', '#F0E4C8', '#17140F', '#E2412A', '#E9B23A', '#EFA9A0'


def T(x, y, txt, size, font='Mono', col=INK, anchor='start', ls=0, rot=0, weight=400, op=1, filt=None):
    tr = f' transform="rotate({rot} {x} {y})"' if rot else ''
    f = f' filter="url(#{filt})"' if filt else ''
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{font}" font-weight="{weight}" font-size="{size}" '
            f'letter-spacing="{ls}" fill="{col}" opacity="{op}"{tr}{f}>{txt}</text>')


def bez(P, n=60):
    """一串三次贝塞尔（P0 C1 C2 P1 C1 C2 P2 …）采样成点。"""
    out = []
    for k in range(0, len(P) - 1, 3):
        p0, c1, c2, p1 = P[k], P[k + 1], P[k + 2], P[k + 3]
        for i in range(n + (1 if k + 3 == len(P) - 1 else 0)):
            t = i / n
            a, b, c, d = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3
            out.append((a * p0[0] + b * c1[0] + c * c2[0] + d * p1[0], a * p0[1] + b * c1[1] + c * c2[1] + d * p1[1]))
    return out


def brush(P, width, col, seed=0, n=46, dry=.35, taper=(.15, .55), op=.92, bw=(2.5, 7)):
    """干笔：n 根鬃毛沿中心线排开。每根的长度、粗细、浓淡不同；越靠边越早断（尾巴散开），头尾收窄。
    返回 SVG。taper = (起笔收窄占比, 收笔收窄占比)。"""
    rng = random.Random(seed)
    pts = bez(P)
    L = len(pts)
    nor = []
    for i in range(L):
        a, b = pts[max(0, i - 1)], pts[min(L - 1, i + 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        d = math.hypot(dx, dy) or 1
        nor.append((-dy / d, dx / d))
    out = []
    for j in range(n):
        o = (j / (n - 1) - .5)                                    # -.5 … .5，横向位置
        edge = abs(o) * 2
        end = 1 - dry * edge ** 1.5 * rng.uniform(.3, 1.2) - rng.uniform(0, .05)
        start = rng.uniform(0, .04) + .03 * edge
        wob = rng.uniform(-1, 1)
        seg = []
        for i in range(int(L * start), max(int(L * start) + 2, int(L * end))):
            t = i / (L - 1)
            w = width * min(1, t / taper[0] if taper[0] else 1, (1 - t) / taper[1] if taper[1] else 1) ** .6
            off = o * w + wob * 1.5 * math.sin(t * 9 + j)
            x, y = pts[i][0] + nor[i][0] * off, pts[i][1] + nor[i][1] * off
            seg.append(f'{x:.1f},{y:.1f}')
        sw = rng.uniform(*bw)
        a = op * rng.uniform(.82, 1)
        out.append(f'<polyline points="{" ".join(seg)}" fill="none" stroke="{col}" stroke-width="{sw:.1f}" stroke-linecap="round" opacity="{a:.2f}"/>')
    return f'<g>{"".join(out)}</g>'


def gull(cx, cy, s, rot, col, filt='gou'):
    """两笔的鸟：一对弯翅膀，中间压下去一个身子。s = 翼展的一半。"""
    d = (f'M{-s},{-s * .1} C{-s * .7},{-s * .62} {-s * .2},{-s * .55} 0,{s * .02} '
         f'C{s * .2},{-s * .55} {s * .7},{-s * .62} {s},{-s * .1} '
         f'C{s * .62},{-s * .36} {s * .22},{-s * .22} 0,{s * .2} '
         f'C{-s * .22},{-s * .22} {-s * .62},{-s * .36} {-s},{-s * .1}Z')
    return f'<path transform="translate({cx},{cy}) rotate({rot})" d="{d}" fill="{col}" filter="url(#{filt})"/>'


DEFS = (
    # 水粉平涂：边缘抖一点 + 里面一道道刷痕（各向异性噪声压暗）
    '<filter id="gou" x="-10%" y="-10%" width="120%" height="120%">'
    '<feTurbulence type="fractalNoise" baseFrequency=".022" numOctaves="3" seed="4" result="t"/>'
    '<feDisplacementMap in="SourceGraphic" in2="t" scale="9" xChannelSelector="R" yChannelSelector="G" result="d"/>'
    '<feTurbulence type="fractalNoise" baseFrequency=".01 .045" numOctaves="3" seed="7" result="s"/>'
    '<feColorMatrix in="s" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.8 .36" result="sa"/>'
    '<feComposite in="sa" in2="d" operator="in" result="st"/>'
    '<feMerge><feMergeNode in="d"/><feMergeNode in="st"/></feMerge></filter>'
    # 手写字：字边抖得更细
    '<filter id="hand" x="-10%" y="-20%" width="120%" height="140%">'
    '<feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="2" result="t"/>'
    '<feDisplacementMap in="SourceGraphic" in2="t" scale="6" xChannelSelector="R" yChannelSelector="G"/></filter>'
    # 底色的刷痕：大刷子横着刷过
    '<filter id="ground" x="0" y="0" width="100%" height="100%">'
    '<feTurbulence type="fractalNoise" baseFrequency=".004 .01" numOctaves="4" seed="11" result="n"/>'
    '<feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.2 .74"/></filter>'
    '<filter id="ground2" x="0" y="0" width="100%" height="100%">'
    '<feTurbulence type="fractalNoise" baseFrequency=".002 .025" numOctaves="4" seed="12" result="n"/>'
    '<feColorMatrix in="n" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1.4 .78"/></filter>'
    '<filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3" seed="5"/>'
    '<feColorMatrix values="0 0 0 0 .32  0 0 0 0 .27  0 0 0 0 .2  0 0 0 .26 0"/></filter>'
    '<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter>'
    '<filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="10" dy="22" stdDeviation="14" flood-color="#0a0f22" flood-opacity=".45"/></filter>')
