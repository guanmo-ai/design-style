"""中世纪现代 · 第 0 帧（1920×1080）。python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png"""
from common import DEFS, INK, MUST, PAPER, TANG, TEAL, texture
from cut import Font, bar, circle, cut_word, ellipse, move, orient, path_d, rect, rot, rough

W, H = 1920, 1080
anton = Font('Anton-Regular.ttf')
noto = Font('NotoSansSC-Black.otf')


def piece(polys, fill, lifted=False, extra=''):
    return f'<path d="{path_d(polys)}" fill="{fill}" filter="url(#{"lift" if lifted else "flat"})" {extra}/>'


els = []
import math
# 回旋镖形桌面（腰果形）：两段圆弧拼起来
def kidney(cx, cy, s, ang):
    pts = []
    for i in range(120):
        t = i / 120 * math.tau
        r = 1 + 0.32 * math.cos(2 * t) - 0.18 * math.sin(t)
        pts.append((cx + s * 1.5 * r * math.cos(t), cy + s * 0.62 * r * math.sin(t) - s * 0.12 * math.cos(t) ** 2))
    return rot([pts], ang, cx, cy)

# 原子球钟：12 根辐条 + 12 颗球，最后三颗还在手里，正被放上去
CX, CY = 1370, 440
cols = [MUST, PAPER, TEAL, INK]
for i in range(12):
    a = math.radians(i * 30 - 90)
    L = 300 if i % 2 == 0 else 240
    els.append(piece(rough([bar(CX, CY, CX + math.cos(a) * L, CY + math.sin(a) * L, 22, 16)], 40 + i), INK))
for i in range(12):
    a = math.radians(i * 30 - 90)
    L = 300 if i % 2 == 0 else 240
    x, y = CX + math.cos(a) * L, CY + math.sin(a) * L
    if i == 3:
        continue  # 这一颗在手里
    lifted = i == 1  # 刚松手，还差一点落位
    if lifted:
        x += 34
        y -= 40
    els.append(piece(rough([circle(x, y, 50)], 60 + i, lo=8, hi=17), cols[i % 4], lifted=lifted))
els.append(piece(rough([circle(CX, CY, 84)], 80, lo=10, hi=20), INK))
els.append(piece(rough([circle(CX, CY, 30)], 81, lo=8, hi=14), MUST))

# 桌上剪剩的边角料：剪圆时掉下来的月牙
def crescent(cx, cy, r, th, ang, n=40):
    out = [(cx + r * math.cos(math.radians(ang + 180 * i / n)), cy + r * math.sin(math.radians(ang + 180 * i / n))) for i in range(n + 1)]
    out += [(cx + (r - th) * 0.98 * math.cos(math.radians(ang + 180 * i / n)), cy + th * 0.4 + (r - th) * 0.82 * math.sin(math.radians(ang + 180 * i / n))) for i in range(n, -1, -1)]
    return out
for (cx, cy, r, th, ang, c, sd) in [(1330, 905, 70, 16, 10, MUST, 70), (1480, 960, 52, 12, 200, TEAL, 71), (1640, 880, 44, 11, 150, PAPER, 72)]:
    els.append(piece(rough([crescent(cx, cy, r, th, ang)], sd, lo=8, hi=16), c))

# 一只剪纸的手（Bass 式）从右边伸进来，捏着最后一颗球，正要按进空位
HX, HY, HA, K = 1722, 392, -12, 1.5
hand = [ellipse(175, 6, 112, 84), bar(-8, -38, 160, -52, 40, 58), circle(-8, -38, 20), bar(4, 40, 130, 58, 38, 54), circle(4, 40, 19),
        circle(92, -40, 34), circle(122, -48, 36)]
sleeve = [bar(262, 2, 820, 20, 176, 206)]
def place(polys):
    return rot(move([[(x * K, y * K) for x, y in orient(p)] for p in polys], HX, HY), HA, HX, HY)
bx, by = place([[(-34, 0)]])[0][0]
els.append(piece(rough(place(sleeve), 92), INK, lifted=True))
els.append(piece(rough([circle(bx, by, 50)], 63, lo=8, hi=17), INK, lifted=True))
els.append(piece(rough(place(hand), 90, lo=10, hi=22), PAPER, lifted=True))

# 大字 MID：D 正被拎起来、转着落下
for polys, flying in cut_word(anton, 'MID', 560, 86, 640, seed=11, tilt=2.5, bounce=0.012, tracking=0.01,
                              overrides={2: (40, -70, 13)}):
    els.append(piece(polys, PAPER, lifted=flying))
for polys, flying in cut_word(anton, 'CENTURY MODERN', 142, 92, 846, seed=12, tilt=3.5, bounce=0.03, tracking=0.03):
    els.append(piece(polys, INK, lifted=flying))

strip = rough([rot([rect(70, 892, 640, 118)], -1.4, 390, 950)[0]], 21)
els.append(piece(strip, INK))
zh = []
for polys, _ in cut_word(noto, '中世纪现代', 78, 110, 980, seed=13, tilt=2, bounce=0.02, tracking=0.08):
    zh += polys
els.append(piece(zh, PAPER))

html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Jost;src:url(../../public/fonts/Jost.ttf);font-weight:100 900}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Bold.otf);font-weight:700}}
html,body{{margin:0}}
.lab{{position:absolute;font:600 26px Jost,NotoSC;letter-spacing:.14em;color:{INK}}}
</style>
<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="display:block">{DEFS}
<rect width="{W}" height="{H}" fill="{TANG}"/>
{''.join(els)}
{texture(W, H)}
</svg>
<div class="lab" style="left:92px;top:60px">1945 — 1965</div>
<div class="lab" style="right:70px;bottom:52px;color:{PAPER}">剪刀代替尺子 · 一秒 12 张</div>
'''
open('cover.html', 'w').write(html)
