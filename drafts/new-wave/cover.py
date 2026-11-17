"""新浪潮 · 风格图（1920×1080）：瑞士网格还在，但被打碎了——字往下走楼梯、字距撑开，
半透明的胶片一层层滑过去叠出新颜色，网点和线网从一头渐变到另一头。
python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png 1920 1080 2
材料自己怎么动：胶片在灯箱上滑动、叠合（乘法叠色）；字距一呼一吸；字一级级落下台阶。"""
import math

W, H = 1920, 1080
BG, INK, MAG, CYA, YEL, GRY = '#E6E2DA', '#141414', '#E5007E', '#00A0C6', '#FFD100', '#9C988F'
P = []
add = P.append


def T(s, x, y, size, fam, fill=INK, weight=400, anchor='start', ls=0, extra=''):
    return (f'<text x="{x}" y="{y}" font-family="{fam}" font-size="{size}" font-weight="{weight}" fill="{fill}" '
            f'text-anchor="{anchor}" letter-spacing="{ls}" {extra}>{s}</text>')


def dots(x0, y0, w, h, cell, fn, color=INK, ang=0):
    """网点：半径 ∝ √(fn)。"""
    out = []
    ca, sa = math.cos(math.radians(ang)), math.sin(math.radians(ang))
    n = int(max(w, h) / cell) + 3
    cx, cy = x0 + w / 2, y0 + h / 2
    for i in range(-n, n):
        for j in range(-n, n):
            u, v = i * cell, j * cell
            px, py = cx + u * ca - v * sa, cy + u * sa + v * ca
            if x0 <= px <= x0 + w and y0 <= py <= y0 + h:
                d = fn((px - x0) / w, (py - y0) / h)
                if d > .02:
                    out.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{cell * .58 * math.sqrt(min(d, 1)):.2f}"/>')
    return f'<g fill="{color}">{"".join(out)}</g>'


def lines(x0, y0, w, h, step, fn, color=INK):
    """线网：每条线的粗细 ∝ fn(位置)。"""
    out = []
    y = y0
    while y < y0 + h:
        t = (y - y0) / h
        th = step * min(.95, max(.04, fn(t)))
        out.append(f'<rect x="{x0}" y="{y:.1f}" width="{w}" height="{th:.2f}"/>')
        y += step
    return f'<g fill="{color}">{"".join(out)}</g>'


def cross(x, y, r=14):
    return (f'<g stroke="{INK}" stroke-width="1.4" fill="none"><circle cx="{x}" cy="{y}" r="{r * .55}"/>'
            f'<path d="M{x - r},{y}H{x + r}M{x},{y - r}V{y + r}"/></g>')


# ---------- 网格：瑞士的骨头还在 ----------
for i in range(1, 12):
    x = i * 160
    add(f'<rect x="{x}" y="0" width="1" height="{H}" fill="{INK}" opacity=".16"/>')
for y in (120, 540, 960):
    add(f'<rect x="0" y="{y}" width="{W}" height="1" fill="{INK}" opacity=".22"/>')

# ---------- 胶片层（乘法叠色，叠出新颜色）----------
film = []
film.append(f'<rect x="960" y="120" width="640" height="420" fill="{MAG}"/>')
film.append(f'<circle cx="1440" cy="560" r="250" fill="{CYA}"/>')
film.append(f'<polygon points="640,1080 1920,760 1920,1080" fill="{YEL}"/>')
film.append(f'<rect x="160" y="620" width="380" height="220" fill="{CYA}" opacity=".9"/>')
add(f'<g style="mix-blend-mode:multiply">{"".join(film)}</g>')
# 一张转了角度的胶片：灰色的光谱渐变（1980 年代视频的颜色）
add(f'<g transform="rotate(-12 1700 300)" style="mix-blend-mode:multiply"><rect x="1560" y="140" width="300" height="300" fill="url(#spec)"/></g>')

# 网点：从左上空到右下满
add(f'<g style="mix-blend-mode:multiply">{dots(160, 540, 600, 300, 12, lambda u, v: max(0, (u * .75 + v * .45) - .12) ** 1.8 * 1.5, INK, 45)}</g>')
# 线网：压在品红上
add(f'<g style="mix-blend-mode:multiply" opacity=".9">{lines(1120, 120, 480, 420, 12, lambda t: 1 - t)}</g>')

# ---------- 大字：NEW 正常站着，WAVE 一级级走下台阶 ----------
add(T('NEW', 150, 470, 360, 'Heros', INK, 700, ls=-14))
wave = [('W', 0, 0, 'solid'), ('A', 1, 70, 'outline'), ('V', 2, 140, 'solid'), ('E', 3, 210, 'solid')]
xs = [870, 1170, 1400, 1640]
for (ch, k, dy, kind), x in zip(wave, xs):
    if kind == 'outline':
        add(T(ch, x, 690 + dy, 300, 'Heros', 'none', 700, extra=f'stroke="{INK}" stroke-width="4"'))
    else:
        add(T(ch, x, 690 + dy, 300, 'Heros', INK, 700))
# 台阶：每个字底下一小段线，像楼梯的踏步
for k, x in enumerate(xs):
    add(f'<rect x="{x}" y="{700 + k * 70}" width="{150 if k else 260}" height="6" fill="{MAG}"/>')

# 中文：黑字 + 青版错位（套印没对准）
add(f'<g style="mix-blend-mode:multiply">{T("新浪潮", 186, 1018, 150, "NotoSC", CYA, 900, ls=30)}</g>')
add(T('新浪潮', 176, 1008, 150, 'NotoSC', INK, 900, ls=30))

# ---------- 小字：撑开的字距、阶梯段落、像素字 ----------
add(T('NEW WAVE TYPOGRAPHY', 166, 96, 22, 'Heros', INK, 700, ls=14))
add(T('1972 — 1986', 1606, 96, 22, 'Heros', INK, 700, ls=6))
step_txt = ['BASEL', 'LOS ANGELES', 'NEW YORK', '打碎网格，', '但每一块', '都还对得上一根线。']
for i, s in enumerate(step_txt):
    fam = 'NotoSC' if i >= 3 else 'Heros'
    add(T(s, 806 + i * 30, 770 + i * 28, 20, fam, INK, 700, ls=2 if i < 3 else 1))
# 像素字（早期苹果电脑的点阵）黑条
add(f'<rect x="1286" y="980" width="480" height="48" fill="{INK}"/>')
add(T('MACINTOSH 1984 · 72 DPI', 1302, 1014, 22, 'Silk', BG, 400, ls=1))
# 规矩线、套准标、编号、箭头
add(cross(940, 120)); add(cross(1600, 540)); add(cross(160, 960))
add(T('01', 968, 150, 18, 'Heros', BG, 700)); add(T('02', 186, 572, 18, 'Heros', INK, 700)); add(T('03', 1620, 790, 18, 'Heros', INK, 700))
add(f'<path d="M1700,620 l120,-90 m0,0 l-44,4 m44,-4 l-6,44" stroke="{INK}" stroke-width="4" fill="none" stroke-linecap="square"/>')
add(f'<g stroke="{INK}" stroke-width="2" stroke-dasharray="1 8" stroke-linecap="round"><path d="M160,500 H900"/></g>')
# 斜线纹：一小块
add(f'<rect x="1640" y="160" width="160" height="96" fill="url(#hatch)"/>')

defs = f'''
<linearGradient id="spec" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF4FA3"/><stop offset=".5" stop-color="#FFE45C"/><stop offset="1" stop-color="#2FC7E6"/></linearGradient>
<pattern id="hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="12" fill="{INK}"/></pattern>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/>
  <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .1 0"/></filter>'''
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}"><defs>{defs}</defs>
<rect width="{W}" height="{H}" fill="{BG}"/>{''.join(P)}
<rect width="{W}" height="{H}" filter="url(#grain)"/></svg>'''
F = '../../public/fonts/'
html = f'''<!doctype html><meta charset="utf-8"><title>新浪潮 · 风格图</title><style>
@font-face{{font-family:Heros;src:url({F}TeXGyreHeros-Bold.otf);font-weight:700}}
@font-face{{font-family:Silk;src:url({F}Silkscreen-Regular.ttf)}}
@font-face{{font-family:NotoSC;src:url({F}NotoSansSC-Black.otf);font-weight:900}}
@font-face{{font-family:NotoSC;src:url({F}NotoSansSC-Bold.otf);font-weight:700}}
html,body{{margin:0;width:{W}px;height:{H}px;overflow:hidden;background:{BG}}}
</style>{svg}'''
open('cover.html', 'w').write(html)
