"""体素 · 第 0 帧（1920×1080）：一块切开的海岸方块，灯塔正一格一格地“落”上去，最后几块还在空中。
python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png"""
import math
import random
import sys

sys.path.insert(0, '../_lib')
from poly3d import Camera, Scene, Voxels, render  # noqa: E402

rng = random.Random(3)
V = Voxels()
N = 26
SEA = 0


def ground(x, z):
    """悬崖在左后方，往右前方降进海里。"""
    d = math.hypot(x - 6, z - 6)
    return int(9 - d * 0.62 + math.sin(x * 0.7) * 0.8 + math.cos(z * 0.5) * 0.8)


for x in range(N):
    for z in range(N):
        g = ground(x, z)
        for y in range(-7, max(g, -3) + 1):
            if y <= g:
                if y == g and g > SEA + 1:
                    c = rng.choice(['#6CC24A', '#62B843', '#77CB52'])
                elif y == g and g >= SEA - 1:
                    c = rng.choice(['#F2D99A', '#EDD08C'])
                elif y > g - 3 and g > SEA:
                    c = rng.choice(['#9A6B45', '#8E623F'])
                else:
                    c = rng.choice(['#8A8F99', '#7E838D', '#959AA3']) if y < -2 else rng.choice(['#C9B07A', '#BFA470'])
                V.set(x, y, z, c)
        for y in range(g + 1, SEA + 1):  # 海水
            V.set(x, y, z, '#2FA6D8' if y == SEA else '#2489C2')

for _ in range(40):
    x, z = rng.randrange(N), rng.randrange(N)
    if ground(x, z) < SEA - 1:
        V.set(x, SEA, z, '#7FD3F2')
# 海里几条鱼（从切面上看得见）
for fx, fy, fz in [(25, -2, 20), (25, -3, 15), (18, -2, 25), (12, -1, 25)]:
    V.set(fx, fy, fz, '#FF8A3D')

# 灯塔：圆柱，红白相间；顶上的灯室还在一块块落下
LX, LZ, base = 6, 6, ground(6, 6) + 1
for y in range(base, base + 13):
    for dx in range(-2, 3):
        for dz in range(-2, 3):
            if dx * dx + dz * dz <= 4.5:
                V.set(LX + dx, y, LZ + dz, '#E8443A' if ((y - base) // 3) % 2 == 0 else '#F7F4EE')
top = base + 13
for dx in range(-3, 4):
    for dz in range(-3, 4):
        if dx * dx + dz * dz <= 9.5:
            V.set(LX + dx, top, LZ + dz, '#3A3F4B')
for dx in (-1, 0, 1):
    for dz in (-1, 0, 1):
        V.set(LX + dx, top + 1, LZ + dz, '#FFE27A', emit=0.85)
        V.set(LX + dx, top + 2, LZ + dz, '#FFE27A', emit=0.85)

# 小屋 + 树
HX, HZ = 12, 4
hb = ground(HX, HZ) + 1
V.fill(HX, hb, HZ, HX + 4, hb + 3, HZ + 4, lambda x, y, z: '#F3EBDD')
for i in range(3):
    V.fill(HX - 1 + i, hb + 3 + i, HZ - 1 + i, HX + 5 - i, hb + 4 + i, HZ + 5 - i, lambda x, y, z: '#3D7BD9')
V.set(HX + 1, hb, HZ + 4, '#6B4A33'); V.set(HX + 1, hb + 1, HZ + 4, '#6B4A33')
V.set(HX + 3, hb + 1, HZ + 4, '#FFE7A8', emit=0.5)
for tx, tz in [(3, 13), (13, 11), (2, 2), (16, 2), (9, 15)]:
    g = ground(tx, tz) + 1
    if g <= SEA + 1:
        continue
    V.set(tx, g, tz, '#6B4A33'); V.set(tx, g + 1, tz, '#6B4A33')
    V.fill(tx - 1, g + 2, tz - 1, tx + 2, g + 4, tz + 2, lambda x, y, z: rng.choice(['#2F8F4E', '#3AA35A', '#2A7F45']))
    V.set(tx, g + 4, tz, '#3AA35A')

# 小船
for dx in range(4):
    V.set(19 + dx, SEA + 1, 19, '#A0522D')
V.set(20, SEA + 2, 19, '#F7F4EE'); V.set(20, SEA + 3, 19, '#F7F4EE'); V.set(21, SEA + 2, 19, '#F7F4EE')

S = Scene()
V.to_scene(S)
# 还在空中的几块：灯室的顶盖，按先后不同高度
falling = [(0, 0, 3.2, '#E8443A'), (-1, 0, 5.5, '#E8443A'), (0, 1, 8.0, '#E8443A'), (1, -1, 11.0, '#E8443A'), (0, -1, 14.5, '#E8443A'), (-1, 1, 18.5, '#3A3F4B')]
for dx, dz, lift, c in falling:
    S.box(LX + dx, top + 3 + lift, LZ + dz, 1, 1, 1, c)
# 天上的方块云
for cx, cy, cz, w, d in [(-6, 26, 18, 7, 4), (22, 24, -6, 6, 3), (16, 30, 24, 5, 3)]:
    S.box(cx, cy, cz, w, d, 1.6, '#FFFFFF')
    S.box(cx + 1.5, cy + 1.6, cz + 0.5, w - 3, d - 1, 1.2, '#FFFFFF')

cam = Camera(eye=(13 + 60, 10 + 50, 13 + 60), target=(13, 10, 13), ortho=45)
body = render(S, cam, light=(0.45, 0.8, -0.35), sun='#FFF4E0', sky='#CFE6FF', ground='#8A7A70', amb=0.5)
W, H = 1920, 1080
shadow_y = cam.proj((13, -7, 13))[1] + 60
html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Inter;src:url(../../public/fonts/Inter.ttf);font-weight:100 900}}
@font-face{{font-family:Silk;src:url(../../public/fonts/Silkscreen-Regular.ttf)}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Black.otf);font-weight:900}}
html,body{{margin:0;width:{W}px;height:{H}px;overflow:hidden;background:linear-gradient(180deg,#8FD3FF,#D7F0FF 60%,#FFF1D6)}}
.lab{{position:absolute;color:#1F3F66}}
</style>
<svg width="{W}" height="{H}" style="position:absolute;left:0;top:0"><defs><filter id="bl"><feGaussianBlur stdDeviation="22"/></filter></defs><ellipse cx="960" cy="{shadow_y}" rx="560" ry="120" fill="#1F3F66" opacity=".22" filter="url(#bl)"/>{body}</svg>
<div class="lab" style="left:64px;top:56px;font:900 96px/1 NotoSC;letter-spacing:.06em">体素</div>
<div class="lab" style="left:68px;top:166px;font:800 26px Inter;letter-spacing:.42em">VOXEL · 1990s —</div>
'''
open('cover.html', 'w').write(html)
