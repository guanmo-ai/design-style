"""浮世绘 · 第 0 帧（1920×1080）：一张正在套色的版画。
色版已经印完（天空的渐晕、浪的蓝、太阳的红），墨版正从左往右压下去：左边已经有了黑色轮廓，右边还没有。
python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png"""
import math
import random
from ukiyo import *

W, H = 1920, 1080
KEY_X = 1230          # 墨版已经印到这里
random.seed(4)

# 大浪：外轮廓（从右下沿浪背爬上去 → 浪头卷下来 → 梢头往里卷 → 回到浪腹 → 前脸落到左下）
back = [(1960, 930), (1800, 790), (1650, 600), (1500, 420), (1340, 300), (1170, 248), (1010, 262), (885, 320), (805, 405), (772, 488)]
lip = [(772, 488), (790, 548), (842, 566), (884, 534), (872, 494), (842, 492)]
belly = [(884, 534), (960, 486), (1050, 470), (1132, 506), (1178, 590), (1166, 700), (1100, 820), (990, 920), (840, 1000), (660, 1060), (520, 1110)]
body = back + lip[1:4] + belly[1:] + [(1960, 1110)]
body_d = catmull(body, closed=True)

# 浪身的条纹：浪背往里平移、收短
stripes = []
for k in range(1, 9):
    off = k * 26
    pts = [(x + off * .55, y + off) for x, y in back[:-2]]
    stripes.append(catmull(pts))
belly_lines = []
for k in range(1, 6):
    off = k * 24
    pts = [(x + off, y + off * .25) for x, y in belly[2:9]]
    belly_lines.append(catmull(pts))

# 浪头的白沫带 + 爪
crest = sample(back[3:] + lip[1:3], 120)
foam_l = [(x + math.sin(th) * w, y - math.cos(th) * w) for i, (x, y, th) in enumerate(crest) for w in [40 * min(1, i / 25, (len(crest) - 1 - i) / 12) ** .6]]
foam_d = 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y, _ in crest) + ' L' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in foam_l[::-1]) + 'Z'
claws = []
for i in range(6, 118, 5):
    x, y, th = crest[i]
    u = i / 120
    L = 40 + 70 * math.sin(u * math.pi) ** .7
    claws.append(claw(x, y, th, L, 16, -1, -(7 + 3 * u)))
    if i % 10 == 1:
        claws.append(claw(x, y, th, L * .6, 10, -1, -5))

# 前景小浪：三个带白沫的浪包
small = []
for cx, cy, s in [(330, 960, 1.0), (560, 1010, .8), (120, 1020, .7)]:
    pts = [(cx - 260 * s, cy + 140), (cx - 150 * s, cy - 10 * s), (cx - 30 * s, cy - 90 * s), (cx + 70 * s, cy - 80 * s), (cx + 130 * s, cy - 30 * s), (cx + 160 * s, cy + 40 * s), (cx + 220 * s, cy + 140)]
    small.append((catmull(pts + [(cx, cy + 200)], closed=True), sample(pts[1:5], 30), s))

# 飞沫
spray = []
for _ in range(90):
    t = random.random()
    x, y, th = crest[int(20 + t * 95)]
    d = random.uniform(30, 190)
    spray.append((x - math.sin(th) * -d * .0 + random.uniform(-60, 30), y - d * random.uniform(.4, 1.1), random.uniform(3, 9)))

# 远山（富士形，不抄原画：画在浪谷左边）
mtn = catmull([(380, 840), (470, 790), (540, 742), (580, 730), (620, 744), (690, 792), (780, 840)])
snow = catmull([(510, 762), (540, 742), (580, 730), (620, 744), (650, 764), (628, 770), (606, 758), (585, 774), (562, 760), (538, 776)])

# ── 色版（全幅都已印上）──
color = [
    f'<rect width="{W}" height="{H}" fill="{PAPER}"/>',
    f'<rect width="{W}" height="300" fill="url(#bokashi)"/>',                        # 一文字渐晕
    f'<circle cx="1640" cy="210" r="96" fill="{BENI}"/>',
    f'<rect y="836" width="{W}" height="{H}" fill="{AI_L}"/>',
    f'<path d="{mtn} L780,840 L380,840Z" fill="{AI}"/>', f'<path d="{snow}Z" fill="{FOAM}"/>',
    f'<path d="{body_d}" fill="{AI}"/>',
    '<g clip-path="url(#bodyclip)">',
    ''.join(f'<path d="{d}" fill="none" stroke="{AI_L}" stroke-width="9" opacity=".75"/>' for d in stripes),
    ''.join(f'<path d="{d}" fill="none" stroke="{AI_D}" stroke-width="12" opacity=".6"/>' for d in belly_lines),
    f'<rect width="{W}" height="{H}" fill="#fff" filter="url(#washig)"/></g>',
    f'<path d="{foam_d}" fill="{FOAM}"/>', ''.join(f'<path d="{c}" fill="{FOAM}"/>' for c in claws),
    ''.join(f'<path d="{d}" fill="{AI_P}"/>' for d, _, _ in small),
    ''.join(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" fill="{FOAM}"/>' for x, y, r in spray),
]
for d, crest_s, s in small:
    for x, y, th in crest_s[2:-2:3]:
        color.append(f'<path d="{claw(x, y, th, 34 * s, 11 * s, 1, 6)}" fill="{FOAM}"/>')
# ── 墨版（只印到 KEY_X 左边）──
key = [
    f'<path d="{mtn}" fill="none" stroke="{SUMI}" stroke-width="3"/>',
    f'<path d="{body_d}" fill="none" stroke="{SUMI}" stroke-width="5" stroke-linejoin="round"/>',
    '<g clip-path="url(#bodyclip)">' + ''.join(f'<path d="{d}" fill="none" stroke="{SUMI}" stroke-width="2" opacity=".85"/>' for d in stripes[::2]) + '</g>',
    f'<line x1="0" x2="{W}" y1="836" y2="836" stroke="{SUMI}" stroke-width="2.5"/>',
    f'<path d="{foam_d}" fill="none" stroke="{SUMI}" stroke-width="3"/>',
    ''.join(f'<path d="{c}" fill="none" stroke="{SUMI}" stroke-width="2.5" stroke-linejoin="round"/>' for c in claws),
    ''.join(f'<path d="{d}" fill="none" stroke="{SUMI}" stroke-width="3.5"/>' for d, _, _ in small),
    ''.join(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" fill="none" stroke="{SUMI}" stroke-width="1.6"/>' for x, y, r in spray),
]
for d, crest_s, s in small:
    for x, y, th in crest_s[2:-2:3]:
        key.append(f'<path d="{claw(x, y, th, 34 * s, 11 * s, 1, 6)}" fill="none" stroke="{SUMI}" stroke-width="2"/>')

# 套色进度：九块版，印到第 8 块（墨版）
plates = [('渐晕', AI_D), ('天', '#7FA3C2'), ('红日', BENI), ('山', AI), ('浪 · 浅', AI_P), ('浪 · 深', AI), ('白沫', FOAM), ('墨版', SUMI), ('压印', PAPER)]
bar = []
for i, (n, c) in enumerate(plates):
    x = 1010 + i * 92
    state = 'done' if i < 7 else ('now' if i == 7 else 'todo')
    bar.append(f'<div class="pl {state}" style="left:{x}px"><i style="background:{c}"></i><span>{i + 1}</span><b>{n}</b></div>')

svg = f'''<svg width="{W}" height="{H}" style="position:absolute;left:0;top:0">
<defs>{washi()}
<linearGradient id="bokashi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{AI_D}"/><stop offset=".35" stop-color="{AI}" stop-opacity=".85"/><stop offset="1" stop-color="{AI}" stop-opacity="0"/></linearGradient>
<linearGradient id="press" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity=".10"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
<clipPath id="bodyclip"><path d="{body_d}"/></clipPath><clipPath id="keyclip"><rect width="{KEY_X}" height="{H}"/></clipPath></defs>
<g transform="translate(3,-2)">{''.join(color)}</g>
<g clip-path="url(#keyclip)">{''.join(key)}</g>
<rect x="{KEY_X - 120}" width="130" height="{H}" fill="url(#press)"/>
<line x1="{KEY_X}" x2="{KEY_X}" y1="0" y2="{H}" stroke="{SUMI}" stroke-width="2" stroke-dasharray="3 9" opacity=".5"/>
<rect width="{W}" height="{H}" filter="url(#washi)"/><rect width="{W}" height="{H}" filter="url(#washi2)"/>
{kento(60, 1020)}{kento(1860, 1020).replace('L', 'L', 1)}
</svg>'''
html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:NotoSerif;src:url(../../public/fonts/NotoSerifSC.ttf);font-weight:200 900}}
@font-face{{font-family:Yuji;src:url(../../public/fonts/YujiSyuku-Regular.ttf)}}
@font-face{{font-family:Corm;src:url(../../public/fonts/Cormorant.ttf);font-weight:300 700}}
html,body{{margin:0;width:{W}px;height:{H}px;overflow:hidden}}
.slip{{position:absolute;writing-mode:vertical-rl;box-sizing:border-box;color:{SUMI}}}
.pl{{position:absolute;top:960px;width:80px;font:700 15px NotoSerif;color:{FOAM};text-align:center}}
.pl i{{display:block;height:20px;border:2px solid {FOAM};box-sizing:border-box}}
.pl span{{display:block;font:700 18px Corm;margin-top:4px}}.pl b{{font-weight:600;font-size:14px}}
.pl.todo{{opacity:.45}}.pl.now i{{outline:3px solid {KI};outline-offset:3px}}.pl.now{{color:{KI}}}
</style>{svg}
<div class="slip" style="left:96px;top:86px;width:150px;height:500px;background:#E9CF86;border:5px solid {BENI};outline:2px solid {SUMI};outline-offset:5px;padding:34px 0 0;font:900 104px/150px NotoSerif;letter-spacing:.08em">浮世绘</div>
<div class="slip" style="left:272px;top:92px;width:66px;height:390px;background:{FOAM};border:2px solid {SUMI};padding:22px 0 0;font:700 30px/62px NotoSerif;letter-spacing:.16em">一版一色　叠出一张画</div>
<div style="position:absolute;left:272px;top:500px;width:66px;height:66px;background:{BENI};color:{FOAM};font:56px/66px Yuji;text-align:center;border-radius:6px">版</div>
<div style="position:absolute;left:92px;top:630px;font:600 34px Corm;letter-spacing:.24em;color:{SUMI}">1760 — 1860 · EDO</div>
<div style="position:absolute;left:94px;top:680px;font:600 19px Corm;letter-spacing:.24em;color:#5a4f40">HOKUSAI · HIROSHIGE · UTAMARO</div>
<div style="position:absolute;left:1010px;top:920px;font:700 18px NotoSerif;letter-spacing:.2em;color:{FOAM}">第 8 版 / 共 9 版 · 墨版正在压下</div>
{''.join(bar)}
'''
open('cover.html', 'w').write(html)
