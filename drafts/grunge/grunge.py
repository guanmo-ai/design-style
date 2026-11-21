"""垃圾摇滚版式（Grunge Type, 1990s）的零件：
拖影（扫描时纸动了：字的最右一窄条被横着拉长成一道道线）、错版（同一层字偏几个像素再印一遍）、
蚀字（字边被噪声啃掉、里面有麻点）、叠印（正片叠底，叠在一起的地方更深）、一张颗粒很粗的糊照片。
做成片子时：拖影长度、错版偏移、行距字距都是随时间变的参数。"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dada'))
import dada  # noqa: E402
from dada import page  # noqa: E402,F401

dada.FACES.update({'Bod': 'BodoniModa.ttf', 'BodI': 'BodoniModa-Italic.ttf', 'Cond': 'BarlowCondensed-ExtraBold.ttf',
                   'CondM': 'BarlowCondensed-Medium.ttf', 'Mono': 'IBMPlexMono-Regular.ttf'})
dada.VAR.update({'Bod', 'BodI'})

PAPER, INK, RUST, ACID, TEAL, GREY = '#E4DED0', '#1A1916', '#B0472A', '#C9D43B', '#3F6E6A', '#8D877A'

WORDS = ('the noise is the message . we set it wrong on purpose . read it anyway . leading is a feeling . '
         'kerning was a rumour . 1992 seattle rain . the mac crashed twice . print it again . nothing lines up . '
         'tape hiss . feedback . flannel . the column fell off the page . type is image . image is type . ').split()


def T(x, y, txt, size, font='Mono', col=INK, anchor='start', ls=0, rot=0, weight=400, op=1, filt=None, extra=''):
    tr = f' transform="rotate({rot} {x} {y})"' if rot else ''
    f = f' filter="url(#{filt})"' if filt else ''
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{font}" font-weight="{weight}" font-size="{size}" '
            f'letter-spacing="{ls}" fill="{col}" opacity="{op}"{tr}{f} {extra}>{txt}</text>')


def body(x, y, w, lines, size=15, lead=1.5, seed=0, col=INK, font='Mono', strike=(), op=1):
    """一栏正文：两端对齐，随手抓的词。strike 里的行号整行划掉。"""
    rng = random.Random(seed)
    n = int(w / (size * .6))
    out = []
    for i in range(lines):
        s = ''
        while len(s) < n:
            s += rng.choice(WORDS) + ' '
        yy = y + i * size * lead
        out.append(f'<text x="{x}" y="{yy:.1f}" textLength="{w}" lengthAdjust="spacingAndGlyphs">{s[:n].strip()}</text>')
        if i in strike:
            out.append(f'<rect x="{x}" y="{yy - size * .38:.1f}" width="{w}" height="{max(2, size * .14):.1f}"/>')
    return f'<g font-family="{font}" font-size="{size}" fill="{col}" opacity="{op}">{"".join(out)}</g>'


def smear(inner, x0, x1, y0, y1, k=7, blur=(6, .3), op=.9, reach=1920):
    """拖影：把 [x0, x1] 这一窄条横着拉 k 倍，接在右边。inner 是字本身（屏幕坐标）。
    不用 scale 拉（字放大上百倍浏览器会不画），而是把这一窄条一份份往右复制、再横向模糊。"""
    cid, fid, gid = f'sm{int(x0)}_{int(y0)}', f'smf{int(x0)}_{int(y0)}', f'smg{int(x0)}_{int(y0)}'
    sw = x1 - x0
    n = int(k)
    uses = ''.join(f'<use href="#{gid}" x="{i * sw:.1f}"/>' for i in range(1, n))
    return (f'<clipPath id="{cid}"><rect x="{x0}" y="{y0}" width="{sw}" height="{y1 - y0}"/></clipPath>'
            f'<filter id="{fid}" filterUnits="userSpaceOnUse" x="{x0 - 20}" y="{y0 - 10}" width="{reach - x0 + 40}" height="{y1 - y0 + 20}">'
            f'<feGaussianBlur stdDeviation="{blur[0]} {blur[1]}"/></filter>'
            f'<defs><g id="{gid}" clip-path="url(#{cid})">{inner}</g></defs>'
            f'<linearGradient id="{gid}lg" gradientUnits="userSpaceOnUse" x1="{x0}" x2="{reach}" y1="0" y2="0">'
            f'<stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
            f'<mask id="{gid}m" maskUnits="userSpaceOnUse" x="{x0 - 20}" y="{y0 - 10}" width="{reach - x0 + 40}" height="{y1 - y0 + 20}">'
            f'<rect x="{x0 - 20}" y="{y0 - 10}" width="{reach - x0 + 40}" height="{y1 - y0 + 20}" fill="url(#{gid}lg)"/></mask>'
            f'<g mask="url(#{gid}m)"><g filter="url(#{fid})" opacity="{op}">{uses}</g></g>')


def slices(inner, x, y, w, h, n=18, amp=26, seed=0, uid='s'):
    """扫描抖动：把一块切成 n 条横带，每条往左右错开一点（平滑的随机）。"""
    rng = random.Random(seed)
    ph = [rng.uniform(0, 6.28) for _ in range(3)]
    out = []
    for i in range(n):
        t = i / n
        dx = amp * (math.sin(t * 7 + ph[0]) * .6 + math.sin(t * 17 + ph[1]) * .3 + math.sin(t * 31 + ph[2]) * .25)
        cid = f'{uid}{i}'
        out.append(f'<clipPath id="{cid}"><rect x="{x - 400}" y="{y + h * t:.1f}" width="{w + 800}" height="{h / n + .6:.1f}"/></clipPath>'
                   f'<g clip-path="url(#{cid})"><g transform="translate({dx:.1f},0)">{inner}</g></g>')
    return ''.join(out)


DEFS = (
    '<filter id="hblur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="6 .3"/></filter>'
    '<filter id="hblur2" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="14 .2"/></filter>'
    # 蚀字：边抖一点，里面被麻点啃掉
    '<filter id="erode" x="-5%" y="-5%" width="110%" height="110%">'
    '<feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="3" result="t"/>'
    '<feDisplacementMap in="SourceGraphic" in2="t" scale="5" xChannelSelector="R" yChannelSelector="G" result="d"/>'
    '<feTurbulence type="fractalNoise" baseFrequency=".32" numOctaves="3" seed="8" result="n"/>'
    '<feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -17 12.5" result="m"/>'
    '<feComposite in="d" in2="m" operator="in"/></filter>'
    '<filter id="erode2" x="-5%" y="-5%" width="110%" height="110%">'
    '<feTurbulence type="fractalNoise" baseFrequency=".02 .3" numOctaves="2" seed="13" result="n"/>'
    '<feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -7 4.1" result="m"/>'
    '<feComposite in="SourceGraphic" in2="m" operator="in"/></filter>'
    # 糊照片的颗粒
    '<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5"/>'
    '<feColorMatrix values="0 0 0 0 .1  0 0 0 0 .1  0 0 0 0 .08  0 0 0 .5 -.08"/></filter>'
    '<filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3" seed="6"/>'
    '<feColorMatrix values="0 0 0 0 .3  0 0 0 0 .27  0 0 0 0 .2  0 0 0 .22 0"/></filter>'
    '<filter id="blur8" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>'
    '<filter id="blur30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>'
    '<filter id="motion" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0 26"/></filter>'
    '<filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="6" dy="14" stdDeviation="10" flood-color="#000" flood-opacity=".4"/></filter>')


def photo(x, y, w, h, uid='ph', tone=RUST):
    """一张糊照片：黑场、一束斜着的舞台光、几团失焦的光斑、一个竖着拖糊的人影；颗粒很粗，双色调（墨 + 锈）。"""
    rng = random.Random(4)
    cid = f'{uid}c'
    g = [f'<clipPath id="{cid}"><rect x="{x}" y="{y}" width="{w}" height="{h}"/></clipPath><g clip-path="url(#{cid})">',
         f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#141210"/>',
         f'<polygon points="{x + w * .55},{y - 40} {x + w * .85},{y - 40} {x + w * .62},{y + h} {x + w * .05},{y + h}" fill="{tone}" opacity=".85" filter="url(#blur30)"/>',
         f'<polygon points="{x + w * .64},{y - 40} {x + w * .74},{y - 40} {x + w * .46},{y + h} {x + w * .3},{y + h}" fill="#F0D9B0" opacity=".55" filter="url(#blur30)"/>']
    for _ in range(9):
        cx, cy, r = x + rng.uniform(.05, .95) * w, y + rng.uniform(.05, .5) * h, rng.uniform(18, 60)
        g.append(f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{r:.0f}" fill="#F3E2BE" opacity="{rng.uniform(.25, .6):.2f}" filter="url(#blur8)"/>')
    # 人影：长发、肩、竖着拖糊（快门慢）
    fx, fy = x + w * .42, y + h * .38
    fig = (f'<g filter="url(#motion)"><ellipse cx="{fx}" cy="{fy}" rx="{w * .09}" ry="{h * .1}" fill="#0b0a09"/>'
           f'<path d="M{fx - w * .1},{fy - h * .02} C{fx - w * .14},{fy + h * .2} {fx - w * .12},{fy + h * .3} {fx - w * .16},{fy + h * .36} L{fx + w * .14},{fy + h * .36} C{fx + w * .12},{fy + h * .3} {fx + w * .13},{fy + h * .2} {fx + w * .09},{fy - h * .02}Z" fill="#0b0a09"/>'
           f'<path d="M{fx - w * .34},{y + h} C{fx - w * .3},{fy + h * .32} {fx + w * .3},{fy + h * .32} {fx + w * .36},{y + h}Z" fill="#0b0a09"/></g>')
    g.append(fig)
    # 斜过身体的吉他琴颈：一根亮一点的细条
    g.append(f'<line x1="{fx - w * .3}" y1="{fy + h * .62}" x2="{fx + w * .38}" y2="{fy + h * .3}" stroke="#6b5a44" stroke-width="{w * .03}" filter="url(#blur8)" opacity=".8"/>')
    g.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" filter="url(#grain)"/>')
    g.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" filter="url(#grain)" opacity=".6"/>')
    # 划痕
    for _ in range(5):
        sx = x + rng.uniform(0, w)
        g.append(f'<line x1="{sx:.0f}" y1="{y}" x2="{sx + rng.uniform(-8, 8):.0f}" y2="{y + h}" stroke="#EDE3CC" stroke-width="{rng.uniform(.6, 1.6):.1f}" opacity="{rng.uniform(.2, .5):.2f}"/>')
    g.append('</g>')
    return ''.join(g)
