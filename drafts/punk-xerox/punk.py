"""朋克复印机的零件：贴在复印玻璃上的原稿（剪报勒索信、网点照片、磁带、别针、胶带、订书钉、马克笔字），
和把它“复印一次”的 SVG 滤镜（转灰 → 加噪 → 糊一下 → 卡阈值 → 碳粉不匀 → 鼓上的划痕）。
复印出来的样子不是另画的：同一组原稿 <use> 两次，一次原样，一次过滤镜。做成片子时阈值、噪声种子、代数都是参数。"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dada'))
import dada  # noqa: E402
from dada import edge, halftone, page  # noqa: E402,F401

dada.FACES.update({'Stencil': 'SairaStencilOne-Regular.ttf', 'Marker': 'PermanentMarker-Regular.ttf', 'Long': 'LongCang-Regular.ttf',
                   'Mono': 'IBMPlexMono-Regular.ttf', 'Cond': 'BarlowCondensed-ExtraBold.ttf'})

INK, WHITE, NEWS, KRAFT, PINK, YEL, GLASS, LIGHT = '#141213', '#F4F1EA', '#E9E3D3', '#C9A878', '#FF3D8B', '#F2E224', '#1C1F1E', '#D7FFB0'
TONER_PINK = ('0.07 1.0', '0.06 0.24', '0.07 0.55')     # 黑碳粉印在荧光粉纸上：R/G/B 两端
TONER_WHITE = ('0.07 0.96', '0.06 0.95', '0.07 0.92')
TONER_YEL = ('0.07 0.95', '0.06 0.89', '0.07 0.16')


def T(x, y, txt, size, font='Mono', col=INK, anchor='start', ls=0, rot=0, weight=400, op=1):
    tr = f' transform="rotate({rot} {x} {y})"' if rot else ''
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{font}" font-weight="{weight}" font-size="{size}" '
            f'letter-spacing="{ls}" fill="{col}" opacity="{op}"{tr}>{txt}</text>')


def scrap(cx, cy, w, h, rot, fill, inner='', seed=0, tear=0, clip=False, sh='psh'):
    d = edge(w, h, random.Random(seed), tear)
    cid = f'k{seed}_{int(cx)}_{int(cy)}'
    body = f'<clipPath id="{cid}"><path d="{d}"/></clipPath><g clip-path="url(#{cid})">{inner}</g>' if clip else inner
    return (f'<g transform="translate({cx},{cy}) rotate({rot}) translate({-w / 2},{-h / 2})">'
            f'<path d="{d}" fill="{fill}" filter="url(#{sh})"/>{body}</g>')


def letter(ch, cx, cy, size, font, col, bg, bw, bh, rot=0, seed=0, tear=0, dy=0, weight=900):
    t = (f'<text x="{bw / 2}" y="{bh / 2 + size * .36 + dy:.0f}" text-anchor="middle" font-family="{font}" font-weight="{weight}" '
         f'font-size="{size}" fill="{col}">{ch}</text>')
    return scrap(cx, cy, bw, bh, rot, bg, t, seed, tear)


def ransom(txt, x, y, size, seed=0, gap=4, fonts=None, skins=None):
    """一行勒索信：每个字母一张纸，字体 / 底色 / 角度轮着换。返回 (svg, 宽)。"""
    rng = random.Random(seed)
    fonts = fonts or ['Abril', 'Anton', 'Slab', 'Rye', 'Arch', 'Stencil', 'Frak']
    skins = skins or [(INK, NEWS), (WHITE, INK), (INK, PINK), (INK, YEL), (INK, WHITE), (PINK, INK)]
    out, cx = [], x
    for i, ch in enumerate(txt):
        if ch == ' ':
            cx += size * .32
            continue
        f = fonts[(i * 3 + seed) % len(fonts)]
        col, bg = skins[(i * 5 + seed) % len(skins)]
        w = size * (.52 if ch in 'IJ!1' else .9 if ch in 'MW' else .74)
        s = size * rng.uniform(.78, .92)
        out.append(letter(ch, cx + w / 2, y + rng.uniform(-.06, .06) * size, s, f, col, bg, w, size * 1.1, rng.uniform(-8, 8), seed * 97 + i,
                          tear=3 if rng.random() < .4 else 0))
        cx += w + gap
    return ''.join(out), cx - x


def tape(cx, cy, w, rot, h=46, seed=0):
    """一截透明胶带：两头是撕的锯齿，带一点黄、一点反光。"""
    rng = random.Random(seed)
    n = 7
    top = [(-w / 2 + rng.uniform(-3, 3), -h / 2)] + [(w / 2 + rng.uniform(-3, 3), -h / 2)]
    rgt = [(w / 2 + (4 if i % 2 else -4) + rng.uniform(-2, 2), -h / 2 + h * i / n) for i in range(n + 1)]
    lft = [(-w / 2 + (4 if i % 2 else -4) + rng.uniform(-2, 2), h / 2 - h * i / n) for i in range(n + 1)]
    pts = top + rgt + lft
    d = 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + 'Z'
    return (f'<g transform="translate({cx},{cy}) rotate({rot})"><path d="{d}" fill="#EEE6C4" opacity=".55" filter="url(#tsh)"/>'
            f'<rect x="{-w / 2 + 6}" y="{-h / 2 + 6}" width="{w - 12}" height="{h * .22:.0f}" fill="#fff" opacity=".28"/></g>')


def staple(x, y, rot=0, L=56):
    return (f'<g transform="translate({x},{y}) rotate({rot})" filter="url(#tsh)"><rect x="{-L / 2}" y="-3.5" width="{L}" height="7" rx="2" fill="#9EA3A6"/>'
            f'<rect x="{-L / 2}" y="-3.5" width="{L}" height="2.4" rx="1" fill="#E8ECEE"/>'
            f'<rect x="{-L / 2 - 2}" y="-5" width="6" height="10" rx="2" fill="#6E7376"/><rect x="{L / 2 - 4}" y="-5" width="6" height="10" rx="2" fill="#6E7376"/></g>')


def safety_pin(x, y, L, rot=0):
    """一根别针：一头绕一圈弹簧，两根细杆往前张开一点，另一头是扣头。(x, y) 是弹簧那头。"""
    st = 'fill="none" stroke-linecap="round"'
    def rod(y1, light):
        return (f'<path d="M0,0 L{L},{y1}" stroke="#4E5356" stroke-width="7.5" {st}/>'
                f'<path d="M0,-1 L{L},{y1 - 1}" stroke="{light}" stroke-width="2.4" {st}/>')
    g = [rod(-9, '#F1F4F5'), rod(9, '#D3D8DB'),
         f'<circle cx="-11" cy="0" r="13" stroke="#4E5356" stroke-width="7" {st}/><circle cx="-11" cy="0" r="13" stroke="#EEF1F2" stroke-width="2.2" {st}/>',
         f'<path d="M{L - 8},-17 h22 a13,13 0 0 1 13,13 v8 a13,13 0 0 1 -13,13 h-22 Z" fill="#9AA0A3" stroke="#4A4F52" stroke-width="3"/>',
         f'<rect x="{L - 4}" y="-12" width="22" height="5" rx="2.5" fill="#EEF1F2"/>']
    return f'<g transform="translate({x},{y}) rotate({rot})" filter="url(#tsh)">{"".join(g)}</g>'


def cassette(cx, cy, s=1, rot=0, label='DEMO', sub='地下室 · A 面'):
    """一盘磁带：外壳、标签、两只带轮、中间的窗。"""
    w, h = 520, 330
    g = [f'<rect x="0" y="0" width="{w}" height="{h}" rx="22" fill="#2A2A2C"/>',
         f'<rect x="10" y="10" width="{w - 20}" height="{h - 20}" rx="16" fill="#38383B"/>',
         f'<rect x="34" y="28" width="{w - 68}" height="200" rx="8" fill="{WHITE}"/>',
         f'<rect x="34" y="28" width="{w - 68}" height="38" rx="8" fill="{PINK}"/>',
         f'<rect x="34" y="56" width="{w - 68}" height="10" fill="{PINK}"/>',
         T(54, 56, 'SIDE A', 24, 'Cond', INK, ls=3), T(w - 54, 56, 'C-60', 24, 'Cond', INK, 'end', ls=2),
         T(54, 112, label, 40, 'Marker', INK), T(w - 52, 112, sub, 30, 'Long', INK, 'end'),
         f'<rect x="120" y="128" width="{w - 240}" height="78" rx="38" fill="#1A1A1B"/>',
         f'<rect x="196" y="140" width="{w - 392}" height="54" fill="#5A4636" opacity=".9"/>']
    for k in (175, w - 175):
        g.append(f'<circle cx="{k}" cy="167" r="30" fill="{WHITE}"/><circle cx="{k}" cy="167" r="14" fill="#1A1A1B"/>')
        for i in range(6):
            a = i * math.pi / 3
            g.append(f'<rect x="{k - 3}" y="{167 - 13}" width="6" height="9" fill="{WHITE}" transform="rotate({math.degrees(a):.0f} {k} 167)"/>')
    g.append(f'<path d="M110,{h} L140,250 L{w - 140},250 L{w - 110},{h}Z" fill="#2E2E30"/>')
    for k in (180, 230, w - 230, w - 180):
        g.append(f'<circle cx="{k}" cy="292" r="9" fill="#151516"/>')
    g.append(f'<rect x="4" y="4" width="{w - 8}" height="10" rx="5" fill="#fff" opacity=".12"/>')
    return f'<g transform="translate({cx},{cy}) rotate({rot}) scale({s}) translate({-w / 2},{-h / 2})" filter="url(#psh)">{"".join(g)}</g>'


def mic_lum(w, h):
    """一张现场照片的亮度：背后一盏追光、话筒和支架、底下一排举起来的手。"""
    cx = w * .52
    hx, hy, hr = cx, h * .3, w * .13

    def f(x, y):
        bg = .9 - .78 * math.exp(-(((x - cx) / (w * .4)) ** 2 + ((y - h * .4) / (h * .48)) ** 2))   # 黑场里一团追光
        for k in range(5):                                                   # 几道光束
            a = -.5 + k * .25
            bg -= .1 * math.exp(-(((x - cx) - (y + h * .1) * a) / (w * .035)) ** 2) * (y < h * .55)
        # 话筒头：一颗球，左上高光
        d = math.hypot(x - hx, (y - hy) * 1.08)
        if d < hr:
            u = math.hypot(x - hx + hr * .38, y - hy + hr * .4) / hr
            grille = .12 * (math.sin((y - hy) * .55) > .3)
            return min(1, .3 + .62 * u + grille)
        # 话筒身：往下收窄
        if hy + hr * .82 < y < hy + hr * 1.05 and abs(x - cx) < hr * .62:
            return .15                                                       # 网罩和手柄之间那圈亮环
        if hy + hr * 1.05 <= y < h * .6:
            t = (y - hy) / (h * .6 - hy)
            half = hr * (.6 - .3 * t)
            if abs(x - cx) < half:
                return .97 if x > cx - half * .4 else .5
        if abs(x - cx - 2) < 5 and y > h * .58:
            return 1
        # 一排举起来的手（剪影）
        for i, (px, ph, r) in enumerate(((.08, .74, .07), (.22, .66, .06), (.38, .8, .065), (.66, .7, .07), (.82, .62, .06), (.95, .78, .07))):
            ax, ay = px * w, ph * h
            if math.hypot(x - ax, y - ay) < r * w:
                return .99
            if abs(x - ax - (y - ay) * .12) < r * w * .55 and y > ay:
                return .99
        if y > h * .9:
            return .98
        return max(0, min(1, bg))
    return f


def photo(cx, cy, w, h, rot, lum, seed=0, pitch=9, bg=NEWS, tear=0):
    return scrap(cx, cy, w, h, rot, bg, halftone(w, h, lum(w, h), pitch, col=INK), seed, tear, clip=True)


def xf(fid='xerox', toner=TONER_PINK, seed=3, thr=.5, grit=.34, blur=1.1, blot=.4):
    """复印一次的滤镜。thr = 阈值位置（越大越黑），grit = 细噪声，blur = 糊多少（代数越高越大），blot = 碳粉不匀。"""
    r, g, b = toner
    slope = 26
    icpt = -slope * (1 - thr)
    return (f'<filter id="{fid}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">'
            '<feColorMatrix in="SourceGraphic" type="matrix" values=".3 .55 .15 0 0  .3 .55 .15 0 0  .3 .55 .15 0 0  0 0 0 1 0" result="g"/>'
            f'<feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="{seed}" result="n1"/>'
            f'<feTurbulence type="fractalNoise" baseFrequency=".004 .012" numOctaves="3" seed="{seed + 7}" result="n2"/>'
            f'<feTurbulence type="fractalNoise" baseFrequency=".0006 .09" numOctaves="1" seed="{seed + 3}" result="n3"/>'
            f'<feComposite in="g" in2="n1" operator="arithmetic" k2="1" k3="{grit}" k4="{-grit / 2:.3f}" result="a"/>'
            f'<feComposite in="a" in2="n2" operator="arithmetic" k2="1" k3="{blot}" k4="{-blot / 2:.3f}" result="b"/>'
            '<feComposite in="b" in2="n3" operator="arithmetic" k2="1" k3=".22" k4="-.1" result="c"/>'
            '<feColorMatrix in="c" type="matrix" values=".33 .33 .34 0 0  .33 .33 .34 0 0  .33 .33 .34 0 0  0 0 0 0 1" result="c2"/>'
            f'<feGaussianBlur in="c2" stdDeviation="{blur}" result="d"/>'
            f'<feComponentTransfer in="d" result="e"><feFuncR type="linear" slope="{slope}" intercept="{icpt:.2f}"/><feFuncG type="linear" slope="{slope}" intercept="{icpt:.2f}"/>'
            f'<feFuncB type="linear" slope="{slope}" intercept="{icpt:.2f}"/></feComponentTransfer>'
            f'<feComponentTransfer in="e"><feFuncR type="table" tableValues="{r}"/><feFuncG type="table" tableValues="{g}"/><feFuncB type="table" tableValues="{b}"/>'
            '<feFuncA type="discrete" tableValues="1"/></feComponentTransfer></filter>')


def defs(toner=TONER_PINK, seed=3, thr=.5, grit=.34):
    """psh / tsh：原稿在玻璃上的影子。xerox：复印一次。"""
    return ('<filter id="psh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="4" dy="7" stdDeviation="4" flood-color="#000" flood-opacity=".45"/></filter>'
            '<filter id="tsh" x="-20%" y="-40%" width="140%" height="200%"><feDropShadow dx="2" dy="3" stdDeviation="2" flood-color="#000" flood-opacity=".25"/></filter>'
            '<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>'
            '<filter id="glow2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="70"/></filter>'
            + xf('xerox', toner, seed, thr, grit) +
            '<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="5"/>'
            '<feColorMatrix values="0 0 0 0 .2  0 0 0 0 .2  0 0 0 0 .2  0 0 0 .18 0"/></filter>')
