"""达达的零件：剪下来的纸片（剪的 / 撕的）、勒索信式的单字、网点照片（眼睛 / 嘴）、齿轮、指示手、剪刀、打字机报纸栏。
整张画都是 SVG；没有一张照片，“照片”是用亮度函数现算的网点。"""
import math
import os
import random

FONTS = os.environ.get('FONTS', '../../public/fonts')   # 截图环境只能读同目录时：FONTS=fonts
PAPER, NEWS, KRAFT, INK, RED, OCHRE, PINK, PHOTO = '#E7DDC8', '#F3ECDD', '#C5A070', '#16130F', '#D3261C', '#D9A72B', '#E2B19D', '#DCD6C8'
FACES = {'Abril': 'AbrilFatface-Regular.ttf', 'Anton': 'Anton-Regular.ttf', 'Rye': 'Rye-Regular.ttf', 'Frak': 'UnifrakturMaguntia.ttf',
         'Slab': 'AlfaSlabOne-Regular.ttf', 'Type': 'SpecialElite-Regular.ttf', 'Arch': 'ArchivoBlack-Regular.ttf',
         'Play': 'PlayfairDisplay-Italic.ttf', 'Hei': 'NotoSansSC-Black.otf', 'Song': 'NotoSerifSC.ttf', 'Ma': 'MaShanZheng-Regular.ttf',
         'Kuai': 'ZCOOLKuaiLe-Regular.ttf'}
VAR = {'Play', 'Song'}


def edge(w, h, rng, tear=0, step=20):
    """纸片轮廓。tear=0：剪刀剪的，四条直边、每个角歪一点；tear>0：手撕的，边上每隔 step 抖一下。"""
    k = min(w, h) * .035
    C = [(x + rng.uniform(-k, k), y + rng.uniform(-k, k)) for x, y in ((0, 0), (w, 0), (w, h), (0, h))]
    pts = []
    for i in range(4):
        a, b = C[i], C[(i + 1) % 4]
        L = math.dist(a, b)
        n = max(1, int(L / step)) if tear else 1
        nx, ny = (b[1] - a[1]) / L, -(b[0] - a[0]) / L
        for j in range(n):
            t = j / n
            d = rng.uniform(-tear, tear) if (tear and j) else 0
            pts.append((a[0] + (b[0] - a[0]) * t + nx * d, a[1] + (b[1] - a[1]) * t + ny * d))
    return 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts) + 'Z'


def scrap(cx, cy, w, h, rot, fill, inner='', seed=0, tear=0, sh='sh', clip=False):
    """一张贴上去的纸片：中心 (cx, cy)，转 rot 度；inner 用纸片自己的坐标（左上角是 0,0）。"""
    d = edge(w, h, random.Random(seed), tear)
    cid = f'c{seed}_{int(cx)}_{int(cy)}'
    body = f'<clipPath id="{cid}"><path d="{d}"/></clipPath><g clip-path="url(#{cid})">{inner}</g>' if clip else inner
    return (f'<g transform="translate({cx},{cy}) rotate({rot}) translate({-w / 2},{-h / 2})">'
            f'<path d="{d}" fill="{fill}" filter="url(#{sh})"/>{body}</g>')


def glyph(ch, cx, cy, size, font, col, rot=0, bg=None, bw=0, bh=0, seed=0, tear=0, dy=0, sh='sh', weight=900):
    """勒索信式的一个字：每个字来自不同的字体，各有各的纸片。bg=None 就是直接印在底上的字。"""
    if bg is None:
        return (f'<text transform="translate({cx},{cy}) rotate({rot})" y="{size * .35 + dy:.0f}" text-anchor="middle" '
                f'font-family="{font}" font-weight="{weight}" font-size="{size}" fill="{col}">{ch}</text>')
    t = (f'<text x="{bw / 2}" y="{bh / 2 + size * .35 + dy:.0f}" text-anchor="middle" font-family="{font}" font-weight="{weight}" '
         f'font-size="{size}" fill="{col}">{ch}</text>')
    return scrap(cx, cy, bw, bh, rot, bg, t, seed, tear, sh)


def halftone(w, h, lum, pitch=9, ang=45, col=INK):
    """把亮度函数 lum(x, y)（0 = 白纸，1 = 全黑）印成网点：网格转 45°，越黑点越大，大到互相碰上就是实地。"""
    ca, sa = math.cos(math.radians(ang)), math.sin(math.radians(ang))
    n = int((w + h) / pitch) + 2
    out = []
    for i in range(-n, n):
        for j in range(-n, n):
            x, y = (i * ca - j * sa) * pitch + w / 2, (i * sa + j * ca) * pitch + h / 2
            if -pitch < x < w + pitch and -pitch < y < h + pitch:
                r = pitch * .74 * math.sqrt(max(0, min(1, lum(x, y))))
                if r > .6:
                    out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}"/>')
    return f'<g fill="{col}">{"".join(out)}</g>'


def eye_lum(w, h):
    """一只眼睛的亮度：眉毛、上眼睑的暗、眼白、虹膜、瞳孔和一块高光。"""
    cx, cy, a, b = w * .5, h * .58, w * .42, h * .27
    ri = b * .98

    def f(x, y):
        u, v = (x - cx) / a, (y - cy) / b
        v0 = .16 + .12 * max(0, 1 - abs(u)) + .1 * max(0, -v - 1) * .3          # 皮肤
        if abs(u) < 1.2:                                                         # 眉毛
            yb = cy - b * (1.75 + .5 * (1 - u * u))
            th = b * .3 * (1 - .55 * abs(u) / 1.2)
            if abs(y - yb) < th:
                return .96
        if abs(u) < 1:
            lid = (1 - u * u) ** .8
            if abs(v) < lid:                                                     # 眼眶里
                d = math.hypot(x - cx - a * .04, y - cy + b * .12)
                if math.hypot(x - cx + ri * .3, y - cy + b * .12 + ri * .36) < ri * .2:
                    return 0                                                     # 高光
                if d < ri * .44:
                    return 1                                                     # 瞳孔
                if d < ri:
                    return .55 + .35 * (d / ri) ** 3                             # 虹膜，外圈更深
                return .05 + .5 * max(0, -v / lid - .45)                         # 眼白，上面压着眼睑的影子
            if v < 0 and abs(v) < lid + .22:
                return 1                                                         # 上睫毛
            if v > 0 and abs(v) < lid + .1:
                return .6
            if v < 0 and abs(abs(v) - lid * 1.55) < .09:
                return .7                                                        # 双眼皮的折线
        return v0
    return f


def lips_lum(w, h):
    """一张嘴：上唇的弓、下唇上一块高光、唇缝一条黑线、下唇底下的影子。"""
    cx, cy, W, H = w * .5, h * .48, w * .42, h * .3

    def f(x, y):
        u, dy = (x - cx) / W, y - cy
        if abs(u) < 1:
            up = H * (1 - abs(u) ** 1.7) * (.92 - .36 * math.exp(-(u / .2) ** 2))
            lo = H * 1.2 * (1 - u * u) ** .75
            if abs(dy) < H * .07 * (1.2 - abs(u)):
                return 1
            if -up < dy < 0:
                return .86
            if 0 <= dy < lo:
                return .78 - .6 * math.exp(-(u / .5) ** 2 - ((dy - lo * .48) / (H * .26)) ** 2)
            if abs(u) < .75 and dy > 0:
                return .16 + .34 * math.exp(-((dy - lo - H * .2) / (H * .22)) ** 2)
        return .16
    return f


def photo(cx, cy, w, h, rot, lum, seed=0, pitch=9, bg=PHOTO, tear=0, flip=False):
    """从画报上剪下来的一块“照片”。"""
    inner = halftone(w, h, lum(w, h), pitch)
    if flip:
        inner = f'<g transform="translate({w},0) scale(-1,1)">{inner}</g>'
    return scrap(cx, cy, w, h, rot, bg, inner, seed, tear, clip=True)


def gear(cx, cy, R, n=12, col=INK, rot=0, spokes=6):
    """钢版画里的齿轮：n 个齿，轮辐之间是镂空的（evenodd）。"""
    P = []
    for i in range(n):
        a0 = math.tau * i / n
        for da, r in ((-.27, .8), (-.2, 1), (.2, 1), (.27, .8)):
            a = a0 + da * math.tau / n * 1.6
            P.append(f'{math.cos(a) * R * r:.1f},{math.sin(a) * R * r:.1f}')
    d = 'M' + ' L'.join(P) + 'Z'
    r1, r2 = R * .26, R * .62
    for i in range(spokes):                                   # 轮辐之间的扇形孔
        a1, a2 = math.tau * (i + .16) / spokes, math.tau * (i + .84) / spokes
        p = [(r * math.cos(a), r * math.sin(a)) for r, a in ((r1, a1), (r1, a2), (r2, a2), (r2, a1))]
        d += (f' M{p[0][0]:.1f},{p[0][1]:.1f} A{r1:.1f},{r1:.1f} 0 0 1 {p[1][0]:.1f},{p[1][1]:.1f} L{p[2][0]:.1f},{p[2][1]:.1f} '
              f'A{r2:.1f},{r2:.1f} 0 0 0 {p[3][0]:.1f},{p[3][1]:.1f}Z')
    rh = R * .09
    d += f' M{rh:.1f},0 A{rh:.1f},{rh:.1f} 0 1 0 {-rh:.1f},0 A{rh:.1f},{rh:.1f} 0 1 0 {rh:.1f},0Z'
    return f'<path transform="translate({cx},{cy}) rotate({rot})" d="{d}" fill="{col}" fill-rule="evenodd" filter="url(#sh)"/>'


def hand(x, y, L, rot=0, fill=NEWS, flip=False):
    """指示手（☞，老报纸广告里的那只）：袖口、手掌、伸出去的食指、三根蜷着的指头。(x, y) 是袖口中点，默认指向右。"""
    H = L * .4
    sw = max(3, L * .022)
    st = f'fill="{fill}" stroke="{INK}" stroke-width="{sw:.1f}" stroke-linejoin="round"'
    r = H * .12
    s = [f'<rect x="{L * .2:.1f}" y="{-H * .5:.1f}" width="{L * .4:.1f}" height="{H:.1f}" rx="{r * 1.6:.1f}" {st}/>',            # 手掌
         f'<rect x="{L * .46:.1f}" y="{-H * .46:.1f}" width="{L * .54:.1f}" height="{H * .26:.1f}" rx="{H * .13:.1f}" {st}/>']    # 食指
    for i in range(3):                                                                                                         # 蜷着的指头
        s.append(f'<rect x="{L * (.5 - i * .015):.1f}" y="{-H * .5 + H * (.3 + i * .225):.1f}" width="{L * (.25 - i * .02):.1f}" height="{H * .22:.1f}" rx="{H * .11:.1f}" {st}/>')
    s.append(f'<rect x="{L * .3:.1f}" y="{-H * .62:.1f}" width="{L * .32:.1f}" height="{H * .22:.1f}" rx="{H * .11:.1f}" transform="rotate(-8 {L * .3:.1f} {-H * .5:.1f})" {st}/>')   # 拇指
    s.append(f'<rect x="0" y="{-H * .56:.1f}" width="{L * .22:.1f}" height="{H * 1.12:.1f}" fill="{INK}"/>')                    # 袖口
    for k in (.07, .13):
        s.append(f'<rect x="{L * k:.1f}" y="{-H * .56:.1f}" width="{L * .022:.1f}" height="{H * 1.12:.1f}" fill="{fill}"/>')
    t = f'translate({x},{y}) rotate({rot})' + (' scale(-1,1)' if flip else '')
    return f'<g transform="{t}" filter="url(#sh)">{"".join(s)}</g>'


def scissors(x, y, s=1, rot=0, col=INK):
    """一把张着嘴的剪刀，刀尖朝左。"""
    b = '-170,0 14,-13 14,7'
    g = [f'<polygon points="{b}" transform="rotate(9)" fill="{col}"/>', f'<polygon points="{b}" transform="scale(1,-1) rotate(9)" fill="{col}"/>']
    for sg in (1, -1):
        g.append(f'<path d="M0,0 L52,{sg * 30}" stroke="{col}" stroke-width="13" stroke-linecap="round"/>'
                 f'<ellipse cx="78" cy="{sg * 44}" rx="30" ry="22" transform="rotate({sg * 28} 78 {sg * 44})" fill="none" stroke="{col}" stroke-width="12"/>')
    g.append(f'<circle r="6" fill="{PAPER}"/>')
    return f'<g transform="translate({x},{y}) rotate({rot}) scale({s})" filter="url(#sh)">{"".join(g)}</g>'


WORDS = ('dada DADA non ! umba bruit zang ? nichts rien 0,50 hop hop tzim da-da BOUM oui/non etc. &amp; § nr. 3 ja ja nein KRRR '
         'papier colle ciseaux hasard zufall heute morgen abend 1916 zurich berlin paris koln hannover new-york lärm rire !!! ').split()


def column(x, y, w, lines, size=15, seed=0, col='#5b5446', lead=1.42, font='Type'):
    """一栏打字机排的报纸：每行两端对齐（textLength），词是随手抓的。"""
    rng = random.Random(seed)
    n = int(w / (size * .56))
    out = []
    for i in range(lines):
        s = ''
        while len(s) < n:
            s += rng.choice(WORDS) + ' '
        out.append(f'<text x="{x}" y="{y + i * size * lead:.1f}" textLength="{w}" lengthAdjust="spacingAndGlyphs">{s[:n + 4].strip()}</text>')
    return f'<g font-family="{font}" font-size="{size}" fill="{col}">{"".join(out)}</g>'


DEFS = ('<filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="3" dy="6" stdDeviation="3.5" flood-color="#2a1d0a" flood-opacity=".34"/></filter>'
        '<filter id="sh2" x="-40%" y="-40%" width="190%" height="210%"><feDropShadow dx="16" dy="34" stdDeviation="13" flood-color="#2a1d0a" flood-opacity=".3"/></filter>'
        '<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="5"/>'
        '<feColorMatrix values="0 0 0 0 .3  0 0 0 0 .24  0 0 0 0 .14  0 0 0 .2 0"/></filter>'
        '<filter id="fiber" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".02 .5" numOctaves="2" seed="9"/>'
        '<feColorMatrix values="0 0 0 0 .45  0 0 0 0 .36  0 0 0 0 .22  0 0 0 .16 -.02"/></filter>')


def page(W, H, body, css=''):
    """拼成一页 HTML。末尾那行脚本只给分块截图用（?x=640&y=360 把画面平移），直接打开不受影响。"""
    faces = ''.join(f'@font-face{{font-family:{k};src:url({FONTS}/{v}){";font-weight:200 900" if k in VAR else ""}}}' for k, v in FACES.items())
    return (f'<!doctype html><meta charset="utf-8"><style>{faces}html,body{{margin:0;background:#1b1916;overflow:hidden}}'
            f'#stage{{position:absolute;left:0;top:0;width:{W}px;height:{H}px;overflow:hidden;transform-origin:0 0}}{css}</style>'
            f'<div id="stage">{body}</div><script>const q=new URLSearchParams(location.search||location.hash.slice(1));'
            f'if(q.has("x"))document.getElementById("stage").style.transform="translate("+(-q.get("x"))+"px,"+(-q.get("y"))+"px)"</script>')
