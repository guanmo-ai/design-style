"""低多边形 · 第 0 帧（1920×1080）：黄昏的山谷，一列小火车正冲出隧道、开上高架桥，蒸汽一团团喷出来。
python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png"""
import math
import random
import sys

sys.path.insert(0, '../_lib')
from poly3d import Camera, Scene, render  # noqa: E402

W, H = 1920, 1080
def build():
    global S, rng
    rng = random.Random(4)
    S = Scene()


    def height(x, z):
        # 远山 + 中景丘陵 + 中间一条河谷（z 方向是纵深）
        ridge = max(0, (z - 70) / 60) ** 1.5 * 30
        hills = 4 * math.sin(x * 0.11 + 1.3) * math.cos(z * 0.09) + 2.5 * math.sin(x * 0.27 + z * 0.19)
        valley = -7 * math.exp(-((x - 4) / 9) ** 2) if z < 90 else 0
        peaks = 40 * math.exp(-((x + 34) / 16) ** 2 - ((z - 118) / 14) ** 2) + 46 * math.exp(-((x - 40) / 14) ** 2 - ((z - 126) / 16) ** 2) + 22 * math.exp(-((x - 6) / 12) ** 2 - ((z - 135) / 12) ** 2)
        return ridge + hills + valley + peaks


    def tcol(x, y, z):
        if y > 34:
            return '#F4F1F6'          # 雪顶
        if y > 22:
            return '#8C7A86'          # 岩
        if y < -3.5:
            return '#3F9FB8'          # 河谷底（水）
        g = ['#7DBB4A', '#6AAE45', '#8BC556', '#5FA046']
        return g[int((x * 7 + z * 3) % 4)]


    S.terrain(-110, -10, 220, 160, 56, 40, height, tcol, seed=2)

    # 松树：两段圆锥
    for _ in range(170):
        x, z = rng.uniform(-70, 70), rng.uniform(-4, 80)
        y = height(x, z)
        if y < -2.5 or y > 16 or abs(x - 4) < 6:
            continue
        s = rng.uniform(1.0, 1.8)
        S.box(x - 0.15 * s, y, z - 0.15 * s, 0.3 * s, 0.3 * s, 0.8 * s, '#6B4A33')
        S.cone(x, y + 0.6 * s, z, 1.2 * s, 2.2 * s, rng.choice(['#2F7D4F', '#3A8C55', '#2A6E48']), n=6, rot=rng.random())
        S.cone(x, y + 1.9 * s, z, 0.85 * s, 1.8 * s, rng.choice(['#3C9A5C', '#348A52']), n=6, rot=rng.random())

    # 高架桥：横跨河谷的一排拱墩 + 桥面
    BZ, BY = 12, 4.0
    for i in range(-6, 7):
        x = 4 + i * 3.2
        base = height(x, BZ)
        S.box(x - 0.45, base - 1, BZ - 0.7, 0.9, 1.4, BY - base + 1, '#C9B8A6')
    S.box(-17, BY, BZ - 1.1, 42, 2.2, 0.6, '#B6A28E', top='#D8C9B6')

    # 隧道口在右侧山体
    S.box(23.5, BY - 0.2, BZ - 2.0, 3.2, 4.0, 4.6, '#7C6A5E')

    # 火车：车头 + 三节车厢，正从隧道冲出
    cols = ['#E24A3B', '#F2B13A', '#3D7BD9', '#E24A3B']
    x0 = 14.5
    for k, c in enumerate(cols):
        x = x0 - k * 4.2
        S.box(x, BY + 0.9, BZ - 0.9, 3.7, 1.8, 1.8, c)
        S.box(x - 0.1, BY + 2.7, BZ - 1.0, 3.9, 2.0, 0.25, '#3A3440')            # 车顶
        for wx in (x + 0.4, x + 1.5, x + 2.6):
            S.box(wx, BY + 1.7, BZ - 0.96, 0.7, 0.1, 0.6, '#FFE7A8', emit=0.6)     # 窗
        S.box(x + 0.3, BY + 0.6, BZ - 0.7, 3.1, 1.4, 0.35, '#2B2B33')            # 底盘
    S.box(x0 + 2.6, BY + 2.7, BZ - 0.35, 0.7, 0.7, 1.3, '#2B2B33')   # 烟囱
    # 蒸汽：一串由小变大的二十面体，往后飘
    for k in range(7):
        t = k / 6
        S.ico(x0 + 2.9 - k * 2.4, BY + 4.2 + t * 4 + math.sin(k) * 0.4, BZ + 0.2 - t * 1.5, 0.7 + t * 1.6, '#FFFFFF', seed=k, jitter=0.18, emit=0.45)

    # 天上几朵低多边形云
    for i, (x, y, z, r) in enumerate([(-40, 34, 110, 8), (-30, 36, 108, 6), (35, 44, 130, 9), (46, 42, 128, 6), (6, 30, 90, 5)]):
        S.ico(x, y, z, r, '#FFF4EC', seed=10 + i, sy=0.6)


    return S


S = build()
cam = Camera(eye=(-4, 9, -12), target=(6, 10, 60), fov=50)
body = render(S, cam, light=(-0.75, 0.42, 0.5), sun='#FFC98A', sky='#C9B6F0', ground='#7A4E5A', amb=0.48,
              fog=('#F2B6B4', 50, 160))
html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Inter;src:url(../../public/fonts/Inter.ttf);font-weight:100 900}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Black.otf);font-weight:900}}
html,body{{margin:0;width:{W}px;height:{H}px;overflow:hidden}}
.lab{{position:absolute;color:#fff;text-shadow:0 2px 12px #8a3d5a66}}
</style>
<svg width="{W}" height="{H}" style="position:absolute;left:0;top:0">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B5FC7"/><stop offset=".45" stop-color="#C98BC4"/><stop offset=".75" stop-color="#FFB59A"/><stop offset="1" stop-color="#FFD9A8"/></linearGradient>
<radialGradient id="sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF6D8"/><stop offset=".25" stop-color="#FFE3A3"/><stop offset="1" stop-color="#FFB59A" stop-opacity="0"/></radialGradient></defs>
<rect width="{W}" height="{H}" fill="url(#sky)"/>
<circle cx="1010" cy="330" r="300" fill="url(#sun)"/>
<polygon points="1010,250 1080,290 1080,370 1010,410 940,370 940,290" fill="#FFF3D0"/>
{body}
</svg>
<div class="lab" style="left:64px;top:52px;font:900 92px/1 NotoSC;letter-spacing:.06em">低多边形</div>
<div class="lab" style="left:68px;top:156px;font:800 26px Inter;letter-spacing:.42em">LOW POLY · 1993 —</div>
'''
open('cover.html', 'w').write(html)
