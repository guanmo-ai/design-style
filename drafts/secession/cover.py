"""维也纳分离派 · 第 0 帧（1920×1080）：一块正在贴金箔的方板。
右边是一块正方形的版面：四圈棋盘格边，里面按四分法铺满方格纹样，正中一棵圆冠的金树。
树冠的金箔还没贴完——右上角缺了几张，露出红褐色的底漆，缺的那几张正从空中飘下来；
右上角有一个方格正在一分为四。左边是标题：方格搭的 SECESSION、中文名、一句话。
python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png"""
import random
from secession import *

W, H = 1920, 1080
rng = random.Random(7)
s = []

# —— 底：黑地 + 细金框 ————————————————————————————————————————————
s.append(f'<rect width="{W}" height="{H}" fill="{INK}"/>')
s.append(f'<rect x="34" y="34" width="{W - 68}" height="{H - 68}" fill="none" stroke="{GOLD}" stroke-width="2" opacity=".55"/>')
for cx, cy in ((34, 34), (W - 34, 34), (34, H - 34), (W - 34, H - 34)):
    s.append(f'<rect x="{cx - 7}" y="{cy - 7}" width="14" height="14" fill="{GOLD}"/>')

# —— 右：方板 ——————————————————————————————————————————————————
PX, PY, PS = 990, 100, 880           # 方板左上角与边长
s.append(f'<g filter="url(#sh)"><rect x="{PX}" y="{PY}" width="{PS}" height="{PS}" fill="{PAPER}"/></g>')
s.append(f'<rect x="{PX}" y="{PY}" width="{PS}" height="{PS}" filter="url(#paper)"/>')
B = 16                                # 棋盘格边的小格
s.append(checker_band(PX + B, PY + B, PS - 2 * B, B))
s.append(checker_band(PX + B, PY + PS - 3 * B, PS - 2 * B, B))
s.append(checker_band(PX + B, PY + 3 * B, PS - 6 * B, B, horizontal=False))
s.append(checker_band(PX + PS - 3 * B, PY + 3 * B, PS - 6 * B, B, horizontal=False))
IX, IY, IS = PX + 4 * B, PY + 4 * B, PS - 8 * B     # 里面的版心：752
s.append(f'<rect x="{IX - 4}" y="{IY - 4}" width="{IS + 8}" height="{IS + 8}" fill="none" stroke="{INK}" stroke-width="3"/>')

# 版心 8×8 小格（每格 94）：外面一圈是有节奏的纹样，左右、上下对称；再往里留一圈白；正中一块黑方
G = IS / 8
EDGE = ['frame', 'dot', 'ring', 'golddot', 'golddot', 'ring', 'dot', 'frame']   # 一条边上从头到尾的八格
split_at = (5, 0)                                                                # 上边第 6 格：正在一分为四
for k in range(8):
    for (i, j) in ((k, 0), (k, 7), (0, k), (7, k)):
        if (i, j) == split_at:
            continue
        kind = EDGE[k]
        x, y = IX + i * G, IY + j * G
        s.append(motif(kind, x + 6, y + 6, G - 12, gold='url(#ggrad)'))
# 四个角再压一个黑方块，角上是实的
for (i, j) in ((0, 0), (7, 0), (0, 7), (7, 7)):
    s.append(f'<rect x="{IX + i * G + 6}" y="{IY + j * G + 6}" width="{G - 12}" height="{G - 12}" fill="{INK}"/>')
    k = G * .36
    s.append(f'<rect x="{IX + i * G + k}" y="{IY + j * G + k}" width="{G - 2 * k}" height="{G - 2 * k}" fill="url(#ggrad)"/>')
s.append(f'<rect x="{IX + G}" y="{IY + G}" width="{6 * G}" height="{6 * G}" fill="none" stroke="{INK}" stroke-width="2"/>')

# 正在分开的那一格：四个小方格各自往外飘一点，带影子
sx, sy = IX + split_at[0] * G + 6, IY + split_at[1] * G + 6
h = (G - 12) / 2
for (dx, dy), k, off in zip(((0, 0), (h, 0), (0, h), (h, h)), ('solid', 'gold', 'check2', 'solid'), ((-9, -14), (12, -18), (-7, 10), (13, 12))):
    s.append(f'<g filter="url(#lift)"><rect x="{sx + dx + off[0]:.1f}" y="{sy + dy + off[1]:.1f}" width="{h:.1f}" height="{h:.1f}" fill="{PAPER}"/>'
             f'{motif(k, sx + dx + off[0], sy + dy + off[1], h, gold="url(#ggrad)")}</g>')

# 正中：黑方块（留一圈 40 的白），上面一棵圆冠金树，树下三级台阶
M = 40
BX, BY, BS = IX + G + M, IY + G + M, 6 * G - 2 * M
s.append(f'<rect x="{BX}" y="{BY}" width="{BS}" height="{BS}" fill="{INK}"/>')
s.append(f'<rect x="{BX + 14}" y="{BY + 14}" width="{BS - 28}" height="{BS - 28}" fill="none" stroke="{GOLD}" stroke-width="2" opacity=".7"/>')
CX = BX + BS / 2
R = BS * .29
crown_y = BY + BS * .38
base = BY + BS - 46
s.append(f'<rect x="{BX + 40}" y="{base}" width="{BS - 80}" height="6" fill="url(#ggrad)"/>')            # 地平线
s.append(f'<rect x="{CX - 7}" y="{crown_y}" width="14" height="{base - crown_y}" fill="url(#ggrad)"/>')
# 两侧各两棵小树：圆冠、细干，站在同一条地平线上，高低错开
for side in (-1, 1):
    for k, (dx, rr, hh) in enumerate(((.335, 26, 122), (.435, 19, 82))):
        tx = CX + side * BS * dx
        s.append(f'<rect x="{tx - 3.5}" y="{base - hh}" width="7" height="{hh}" fill="url(#ggrad)"/>')
        s.append(f'<circle cx="{tx}" cy="{base - hh - rr + 4}" r="{rr}" fill="url(#ggrad)" filter="url(#gleaf)"/>')
# 树冠：一片片方形金箔铺在圆里；右上角还缺几张，露出底漆
n = 7
tile = 2 * R / n
missing = {(5, 0), (5, 1), (6, 1), (4, 0), (6, 2)}
s.append(gilded(f'<circle cx="{CX}" cy="{crown_y}" r="{R}"/>', CX - R, crown_y - R, 2 * R, 2 * R, n, rng, 'crown', missing))
# 飘下来的金箔：比贴好的大一点（离镜头近），转着角度，影子远
for (fx, fy, rot, sc) in ((CX + R * .62, crown_y - R * 1.18, 16, 1.2), (CX + R * 1.12, crown_y - R * .62, -22, 1.12), (CX + R * 1.02, crown_y - R * 1.42, 34, 1.3)):
    w = tile * sc
    s.append(f'<g filter="url(#lift)"><g transform="translate({fx:.1f},{fy:.1f}) rotate({rot}) skewX({rot * .3:.1f})">'
             f'<rect x="{-w / 2:.1f}" y="{-w / 2:.1f}" width="{w:.1f}" height="{w:.1f}" fill="#D8B04A" filter="url(#gleaf)"/></g></g>')

# —— 左：标题 ——————————————————————————————————————————————————
LX = 104
s.append(f'<text x="{LX}" y="150" font-family="Jost" font-weight="500" font-size="26" letter-spacing="9" fill="{GOLD}">WIEN · 1897</text>')
s.append(checker(LX + 300, 132, 12, 1, 12, GOLD, INK))
u = 24
s.append(word('SECESSION', LX, 200, u, fill=PAPER, dot=GOLD))
s.append(f'<text x="{LX - 6}" y="{200 + 7 * u + 150}" font-family="Qk" font-size="138" letter-spacing="6" fill="url(#ggrad)" filter="url(#gleaf2)">维也纳分离派</text>')
s.append(f'<text x="{LX}" y="{200 + 7 * u + 250}" font-family="Song" font-weight="700" font-size="54" fill="{PAPER}">装饰，从一个正方形开始</text>')
s.append(f'<rect x="{LX}" y="{200 + 7 * u + 300}" width="96" height="6" fill="{GOLD}"/>')
s.append(f'<text x="{LX}" y="{200 + 7 * u + 370}" font-family="Jost" font-weight="500" font-size="25" letter-spacing="4.5" fill="{BONE}">DER ZEIT IHRE KUNST · DER KUNST IHRE FREIHEIT</text>')
s.append(f'<text x="{LX}" y="{200 + 7 * u + 416}" font-family="Song" font-weight="500" font-size="27" letter-spacing="3" fill="#9E968A">给时代以艺术，给艺术以自由</text>')
for i, (c, name) in enumerate(((INK, '#121110'), (PAPER, '#F2EDE2'), (GOLD, '#C99A2E'), (BOLE, '#6E2A17'))):
    x = LX + i * 168
    s.append(f'<rect x="{x}" y="{H - 250}" width="56" height="56" fill="{c}" stroke="{BONE}" stroke-width="{1.5 if c == INK else 0}"/>')
    s.append(f'<text x="{x + 70}" y="{H - 215}" font-family="Jost" font-weight="500" font-size="19" letter-spacing="1.5" fill="#9E968A">{name}</text>')
s.append(f'<text x="{LX}" y="{H - 104}" font-family="Jost" font-weight="600" font-size="24" letter-spacing="7" fill="{GOLD}">KLIMT · MOSER · HOFFMANN · OLBRICH</text>')

svg = (f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="position:absolute;left:0;top:0"><defs>{DEFS}{gold_defs()}{gold_defs("g2", 11, ".05 .08")}'
       f'<pattern id="gleafpat" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#CFA235"/>'
       f'<rect width="23" height="23" fill="#D6AC42"/></pattern></defs>'
       f'{"".join(s)}<rect width="{W}" height="{H}" filter="url(#grain)" style="mix-blend-mode:multiply"/></svg>')
open('cover.html', 'w').write(page(W, H, svg))
