"""达达 · 风格图（1920×1080）：剪下来的字一块块贴上去，一行字五种字体；最后一片还在空中往下飘。
python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png 1920 1080 2
材料自己怎么动：剪刀剪出直边（不是圆角、不是撕边），纸片飘落、落在哪就贴在哪（Arp 的“偶然”）。"""
import math
import random

W, H = 1920, 1080
PAPER, WHITE, RED, INK, KRAFT, GREY = '#ECE4D1', '#F7F3E8', '#D2281B', '#161412', '#C7A675', '#B9B6AA'
rnd = random.Random(1916)


def cut(x, y, w, h, jag=7, seed=None):
    """剪刀剪出来的四边形：角不正、每条边中间偶尔折一刀。"""
    r = random.Random(seed)
    j = lambda: r.uniform(-jag, jag)
    pts = []
    corners = [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]
    for i, (cx, cy) in enumerate(corners):
        nx, ny = corners[(i + 1) % 4]
        pts.append((cx + j(), cy + j()))
        if r.random() < .55:
            t = r.uniform(.3, .7)
            pts.append((cx + (nx - cx) * t + j() * .6, cy + (ny - cy) * t + j() * .6))
    return ' '.join(f'{a:.1f},{b:.1f}' for a, b in pts)


uid = [0]


def piece(poly, fill, inner='', rot=0, cx=0, cy=0, lift=1.0, tex='pt'):
    """一片纸：多边形 + 纸纹 + 影子；inner 是印在纸上的东西（裁在纸里）。"""
    uid[0] += 1
    cid = f'k{uid[0]}'
    flt = 'lift' if lift > 1.5 else 'paste'
    return f'''<g transform="rotate({rot} {cx} {cy})">
  <clipPath id="{cid}"><polygon points="{poly}"/></clipPath>
  <g filter="url(#{flt})"><polygon points="{poly}" fill="{fill}"/></g>
  <g clip-path="url(#{cid})">{inner}<polygon points="{poly}" fill="#000" filter="url(#{tex})" opacity=".55"/></g>
</g>'''


def T(s, x, y, size, fam, fill, weight=400, anchor='start', ls=0, extra=''):
    return (f'<text x="{x}" y="{y}" font-family="{fam}" font-size="{size}" font-weight="{weight}" fill="{fill}" '
            f'text-anchor="{anchor}" letter-spacing="{ls}" {extra}>{s}</text>')


def halftone(x0, y0, w, h, dark, cell=9.0, ang=45, color=INK):
    """网点：每个点的半径 ∝ √(深浅)，网格转 45°（老报纸照片的做法）。"""
    out = []
    ca, sa = math.cos(math.radians(ang)), math.sin(math.radians(ang))
    R = int(max(w, h) / cell) + 4
    cxm, cym = x0 + w / 2, y0 + h / 2
    for i in range(-R, R):
        for j in range(-R, R):
            u, v = i * cell, j * cell
            px, py = cxm + u * ca - v * sa, cym + u * sa + v * ca
            if not (x0 - cell < px < x0 + w + cell and y0 - cell < py < y0 + h + cell):
                continue
            d = dark(px, py)
            if d <= .03:
                continue
            out.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{cell * .62 * math.sqrt(min(d, 1)):.2f}"/>')
    return f'<g fill="{color}">{"".join(out)}</g>'


def gear_dark(cx, cy, r0, teeth=12):
    """一只机器齿轮（达达爱画机器）：方齿、中间一个孔、一圈凹槽；光从左上来。"""
    def f(x, y):
        dx, dy = x - cx, y - cy
        r, a = math.hypot(dx, dy), math.atan2(dy, dx)
        ph = (a * teeth / (2 * math.pi)) % 1
        outer = r0 * (1.2 if .25 < ph < .75 else 1.0)
        if r > outer:
            return .07
        if r < r0 * .3:
            return 0
        shade = .5 + .3 * (dx * .6 + dy * .8) / r0
        if abs(r - r0 * .66) < r0 * .045:
            shade += .35
        if r < r0 * .36:
            shade += .3
        return max(.12, min(.95, shade))
    return f


# ---------------- 背景：一张旧报纸 ----------------
syll = ['da', 'dra', 'kli', 'mer', 'zu', 'ri', 'ch', 'bo', 'ton', 'ga', 'dji', 'beri', 'bim', 'ba', 'lu', 'gl', 'ulu', 'ka', 'ra', 'wu', 'ssa', 'ne', 'zeit', 'kunst']
col_txt = []
for c in range(7):
    x = 40 + c * 268
    for ln in range(66):
        y = 30 + ln * 16
        words = ' '.join(''.join(rnd.choice(syll) for _ in range(rnd.randint(1, 3))) for _ in range(6))
        col_txt.append(f'<text x="{x}" y="{y}" textLength="248" lengthAdjust="spacingAndGlyphs">{words}</text>')
news = f'<g font-family="Tinos" font-size="12.5" fill="#2a2620" opacity=".1">{"".join(col_txt)}</g>'
rules = ''.join(f'<rect x="{30 + c * 268}" y="20" width="1.2" height="1050" fill="#2a2620" opacity=".14"/>' for c in range(1, 7))

parts = []
add = parts.append

# 粗黑杠、红圆（印刷符号，直接印在底上，不是贴的）
add(f'<rect x="-40" y="742" width="1300" height="34" fill="{INK}" transform="rotate(-9 600 760)"/>')
add(f'<circle cx="1530" cy="330" r="148" fill="{RED}" opacity=".93"/>')

# 半调齿轮：剪下来的一片报纸照片
gp = cut(1340, 560, 520, 470, 9, 3)
add(piece(gp, WHITE, halftone(1340, 560, 520, 400, gear_dark(1600, 770, 160, 10), 8.5) +
          T('FIG. 3 — DIE MASCHINE', 1366, 1002, 22, 'SpaceMono', INK, 700, ls=2), 4, 1600, 800))

# ---- 一行字，五种字体：D A D A ----
# D：黑纸白字 · 粗黑体
add(piece(cut(118, 168, 360, 470, 8, 11), INK, T('D', 296, 590, 520, 'Anton', WHITE, anchor='middle'), -6, 300, 400))
# A：白纸红字 · 装饰衬线
add(piece(cut(470, 250, 380, 400, 8, 12), WHITE, T('A', 660, 590, 420, 'Cinzel', RED, 700, 'middle'), 7, 660, 450))
# D：牛皮纸黑字 · 斜体衬线
add(piece(cut(840, 120, 330, 470, 8, 13), KRAFT, T('D', 1004, 520, 520, 'InstrumentItalic', INK, anchor='middle'), -3, 1000, 360))
# A：红纸、字是纸色 · 窄的无衬线
add(piece(cut(1150, 300, 260, 380, 8, 14), RED, T('A', 1280, 640, 400, 'Oswald', PAPER, 700, 'middle'), 10, 1280, 480))

# 中文：达 · 达（两种字、两种纸）
add(piece(cut(110, 790, 230, 230, 7, 21), RED, T('达', 225, 980, 210, 'NotoSC', INK, 900, 'middle'), 5, 225, 900))
add(piece(cut(350, 760, 230, 250, 7, 22), WHITE, T('达', 465, 966, 220, 'NotoSerifSC', INK, 900, 'middle'), -8, 465, 880))
# 打字机纸条
add(piece(cut(612, 846, 600, 58, 3, 31), WHITE, T('DADA NE SIGNIFIE RIEN.', 632, 886, 30, 'SpaceMono', INK, 700, ls=1), -2, 900, 870))
add(piece(cut(640, 922, 520, 52, 3, 32), PAPER, T('一行字，五种字体 · 落在哪就贴在哪', 660, 958, 26, 'NotoSC', INK, 700), 1.5, 900, 950))
# 标签：年代
add(piece(cut(60, 54, 470, 54, 3, 41), WHITE, T('DADA · 1916 — 1924', 78, 92, 30, 'SpaceMono', INK, 700, ls=3), -1.5, 300, 80))
add(piece(cut(1480, 70, 380, 46, 3, 42), INK, T('ZÜRICH · BERLIN · HANNOVER', 1494, 101, 20, 'SpaceMono', PAPER, 700, ls=1.5), 2, 1660, 90))

# 橡皮图章（红墨，压在纸上，乘法叠色）
ring = f'''<g transform="rotate(-14 1580 372)" opacity=".86" style="mix-blend-mode:multiply" filter="url(#ink)">
<circle cx="1580" cy="372" r="96" fill="none" stroke="{INK}" stroke-width="5"/>
<circle cx="1580" cy="372" r="70" fill="none" stroke="{INK}" stroke-width="2.5"/>
<path id="arc" d="M1580,372 m-83,0 a83,83 0 1,1 166,0 a83,83 0 1,1 -166,0" fill="none"/>
<text font-family="SpaceMono" font-weight="700" font-size="17" letter-spacing="3.2" fill="{INK}"><textPath href="#arc">CABARET VOLTAIRE · ANTI-KUNST ·</textPath></text>
<text x="1580" y="388" text-anchor="middle" font-family="Anton" font-size="48" fill="{INK}">1916</text></g>'''
add(ring)

# 正在飘落的最后一片：影子大而虚、离纸远（第 0 帧的动作）
add(piece(cut(1010, 640, 320, 150, 6, 51), WHITE,
          T('MERZ', 1170, 748, 104, 'Archivo', INK, 900, 'middle'), -17, 1170, 715, lift=2.4))
add('<g stroke="#2a2620" stroke-width="2" stroke-dasharray="3 9" stroke-linecap="round" fill="none" opacity=".45">'
    '<path d="M1080,560 q-30,40 -10,70"/><path d="M1170,540 q20,40 0,80"/><path d="M1260,570 q30,30 10,60"/></g>')

defs = f'''
<filter id="paste" x="-10%" y="-10%" width="125%" height="130%"><feDropShadow dx="2" dy="3" stdDeviation="2.2" flood-color="#2a1d10" flood-opacity=".38"/></filter>
<filter id="lift" x="-40%" y="-40%" width="200%" height="220%"><feDropShadow dx="26" dy="48" stdDeviation="16" flood-color="#2a1d10" flood-opacity=".32"/></filter>
<filter id="pt" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="4"/>
  <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.9 .52"/><feComposite in2="SourceGraphic" operator="in"/></filter>
<filter id="ink" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".055" numOctaves="2" seed="9" result="n"/>
  <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="2" result="g"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="4" result="d"/>
  <feColorMatrix in="g" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.75" result="holes"/>
  <feComposite in="d" in2="holes" operator="in"/></filter>
<filter id="bgtex"><feTurbulence type="fractalNoise" baseFrequency=".012 .02" numOctaves="4" seed="7"/>
  <feColorMatrix values="0 0 0 0 .45  0 0 0 0 .33  0 0 0 0 .16  0 0 0 .22 0"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="1"/>
  <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .14 0"/></filter>
<radialGradient id="vig" cx="50%" cy="48%" r="75%"><stop offset=".6" stop-color="#3a2a12" stop-opacity="0"/><stop offset="1" stop-color="#3a2a12" stop-opacity=".22"/></radialGradient>'''

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>{defs}</defs>
<rect width="{W}" height="{H}" fill="{PAPER}"/>
<rect width="{W}" height="{H}" filter="url(#bgtex)"/>
{news}{rules}
{''.join(parts)}
<rect width="{W}" height="{H}" filter="url(#grain)"/>
<rect width="{W}" height="{H}" fill="url(#vig)"/>
</svg>'''

F = '../../public/fonts/'
html = f'''<!doctype html><meta charset="utf-8"><title>达达 · 风格图</title><style>
@font-face{{font-family:Anton;src:url({F}Anton-Regular.ttf)}}
@font-face{{font-family:Cinzel;src:url({F}CinzelDecorative-Bold.ttf);font-weight:700}}
@font-face{{font-family:InstrumentItalic;src:url({F}InstrumentSerif-Italic.ttf)}}
@font-face{{font-family:Oswald;src:url({F}Oswald.ttf);font-weight:200 700}}
@font-face{{font-family:Archivo;src:url({F}Archivo.ttf);font-weight:100 900;font-stretch:62% 125%}}
@font-face{{font-family:SpaceMono;src:url({F}SpaceMono-Bold.ttf);font-weight:700}}
@font-face{{font-family:Tinos;src:url({F}Tinos-400.woff2)}}
@font-face{{font-family:NotoSC;src:url({F}NotoSansSC-Black.otf);font-weight:900}}
@font-face{{font-family:NotoSC;src:url({F}NotoSansSC-Bold.otf);font-weight:700}}
@font-face{{font-family:NotoSerifSC;src:url({F}NotoSerifSC.ttf);font-weight:200 900}}
html,body{{margin:0;width:{W}px;height:{H}px;overflow:hidden;background:{PAPER}}}
</style>{svg}'''
open('cover.html', 'w').write(html)
