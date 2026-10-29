"""City Pop · 第 0 帧（1920×1080）：跳板上的人刚入水，水花正炸到最高（向霍克尼《更大的水花》1967 致意），
大片喷枪蓝天、白房子、棕榈剪影——永井博 / 铃木英人的 80 年代唱片封面。
python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png"""
import math
import random

from scene import (ORANGE, PALM, PINK, POOL0, POOL1, SKY0, SKY1, SKY2, SUN, WHITE, cumulus, palm, sparkle, wobble_loops)

W, H = 1920, 1080
HZ = 590            # 房子底 / 池边
rng = random.Random(5)

house = f'''
<rect x="760" y="380" width="1000" height="{HZ - 380}" fill="#F7F8FB"/>
<rect x="720" y="352" width="1080" height="30" fill="#FFFFFF"/><rect x="720" y="382" width="1080" height="10" fill="#C7D6EA"/>
<rect x="840" y="430" width="300" height="{HZ - 450}" fill="#1E4BA8"/><rect x="1180" y="430" width="420" height="{HZ - 450}" fill="#1E4BA8"/>
<path d="M840,430 H1140 V470 L840,560Z" fill="#163a85"/>
<rect x="1150" y="392" width="16" height="{HZ - 392}" fill="#E1E8F2"/>
<path d="M760,392 L960,392 L760,560Z" fill="#AFCBEA" opacity=".85"/>
<rect x="1640" y="430" width="70" height="{HZ - 430}" fill="#F2A23A"/>
<rect x="700" y="{HZ - 20}" width="1220" height="20" fill="#E7EDF5"/>'''

# 泳池：近大远小的四边形，池沿一圈白砖
pool = f'<path d="M0,{HZ + 34} H{W} V{H} H0Z" fill="url(#pool)"/>'
coping = f'<rect x="0" y="{HZ}" width="{W}" height="34" fill="#FFFFFF"/><rect x="0" y="{HZ + 34}" width="{W}" height="8" fill="#7FCBE8"/>'

# 跳板（黄）从左下伸进来，水花在跳板尖前方炸起
board = f'<path d="M-20,1000 L520,860 L528,884 L-20,1040Z" fill="#FFC531"/><path d="M-20,1040 L528,884 L530,898 L-20,1060Z" fill="#D48F14"/>'
SX, SY = 860, 800
streaks, drops = [], []
for i in range(70):
    a = math.radians(rng.uniform(-150, -30))
    L = rng.uniform(80, 330) * (1 - abs(math.degrees(a) + 90) / 110)
    w0 = rng.uniform(4, 11)
    x0, y0 = SX + rng.uniform(-40, 40), SY + rng.uniform(-6, 10)
    x1, y1 = x0 + math.cos(a) * L, y0 + math.sin(a) * L
    nx, ny = -math.sin(a) * w0 / 2, math.cos(a) * w0 / 2
    streaks.append(f'<path d="M{x0 + nx:.0f},{y0 + ny:.0f} L{x1:.0f},{y1:.0f} L{x0 - nx:.0f},{y0 - ny:.0f}Z" fill="#FFFFFF" opacity="{rng.uniform(.75, 1):.2f}"/>')
for i in range(60):
    a = math.radians(rng.uniform(-165, -15))
    d = rng.uniform(60, 360)
    r = rng.uniform(2.5, 8)
    drops.append(f'<circle cx="{SX + math.cos(a) * d * 1.15:.0f}" cy="{SY + math.sin(a) * d:.0f}" r="{r:.1f}" fill="#FFFFFF"/>')
foam = (f'<ellipse cx="{SX}" cy="{SY + 8}" rx="120" ry="22" fill="#FFFFFF"/>'
        + ''.join(f'<ellipse cx="{SX}" cy="{SY + 12}" rx="{rx}" ry="{rx * .2:.0f}" fill="none" stroke="#FFFFFF" stroke-width="{w}" opacity="{o}"/>' for rx, w, o in [(200, 6, .9), (300, 4, .6), (420, 3, .35)]))

art = f'''<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0638B8"/><stop offset=".35" stop-color="{SKY0}"/><stop offset=".8" stop-color="{SKY1}"/><stop offset="1" stop-color="{SKY2}"/></linearGradient>
  <linearGradient id="pool" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2CC9E6"/><stop offset=".5" stop-color="{POOL0}"/><stop offset="1" stop-color="#0866A8"/></linearGradient>
  <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4B0"/><stop offset=".3" stop-color="{SUN}"/><stop offset=".5" stop-color="{ORANGE}"/><stop offset=".52" stop-color="{PINK}"/><stop offset="1" stop-color="#B43FD0"/></linearGradient>
  <mask id="stripeM"><rect width="{W}" height="{H}" fill="#fff"/><rect y="218" width="{W}" height="9" fill="#000"/><rect y="243" width="{W}" height="7" fill="#000"/><rect y="264" width="{W}" height="5" fill="#000"/><rect y="281" width="{W}" height="3" fill="#000"/></mask>
  <clipPath id="skyclip"><rect width="{W}" height="{HZ}"/></clipPath>
</defs>
<rect width="{W}" height="{HZ}" fill="url(#sky)"/>
<g clip-path="url(#skyclip)">{cumulus(1350, HZ, 900, 470, seed=4)}{cumulus(470, HZ, 440, 150, seed=9)}</g>
{palm(1500, HZ - 10, 400, lean=-0.18, seed=6, color='#0F4B57')}
{house}
{palm(1830, H + 40, 1000, lean=-0.22, seed=3, fronds=11)}
{coping}{pool}
{wobble_loops(0, HZ + 50, W, H - HZ - 50)}
{board}
{foam}{''.join(streaks)}{''.join(drops)}
{sparkle(1260, 700, 30)}{sparkle(1480, 930, 40)}{sparkle(420, 740, 22)}'''
svg = f'''<svg width="{W}" height="{H}" style="position:absolute;left:0;top:0">{art}
<g mask="url(#stripeM)"><g transform="skewX(-12)">
  <text x="150" y="260" font-family="Inter" font-weight="900" font-size="210" letter-spacing="-8" fill="url(#chrome)" stroke="#fff" stroke-width="6" paint-order="stroke">City Pop</text>
</g></g>
</svg>'''

html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Inter;src:url(../../public/fonts/Inter.ttf);font-weight:100 900}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Black.otf);font-weight:900}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Bold.otf);font-weight:700}}
html,body{{margin:0;width:{W}px;height:{H}px;overflow:hidden}}
.a{{position:absolute;color:#fff}}
</style>{svg}
<div class="a" style="left:96px;top:300px;font:900 50px NotoSC;letter-spacing:.14em">シティ・ポップ</div>
<div class="a" style="left:100px;top:372px;font:700 26px NotoSC;letter-spacing:.32em">城市流行 · 1978 — 1988</div>
<div class="a" style="right:60px;top:40px;font:800 20px Inter;letter-spacing:.3em">SIDE A ▶ 03:41</div>
'''
open('cover.html', 'w').write(html)
