"""019 低多边形 · 第 1 章 · 山谷与小火车（0—4.5 秒）。原为 5 秒小样，时间都是本章本地秒数。
python3 frames.py out/  → out/f0000.svg …；然后 node ../render_svgs.cjs out/ 和 python3 audio.py。

节拍：120 BPM，一拍 = 15 帧。
0.1—1.6 s  纸面上的三角形像翻书一样一片片翻起来（以一条边为铰链，转 180°，过冲约 5%），拼成山、田、湖
1.5/2.0/2.5 s  树在拍点上一簇簇“噗”地冒出来（先压扁再弹高）
2.0—4.2 s  火车从左边开进来，枕木在车头前方一根根落下、铁轨跟着长
3.8—5.0 s  蒸汽越喷越大，盖满镜头，最后一帧是满屏奶油色 = 第 0 帧的纸，循环
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from poly3d import Camera, Scene, render  # noqa: E402
from common import *  # noqa: E402,F401,F403



# ---------- 地形（目标形状） ----------
X0, X1, Z0, Z1, CELL = -26, 26, -18, 16, 2.6
NX, NZ = int((X1 - X0) / CELL), int((Z1 - Z0) / CELL)
RAIL_Z = 5.2


def height(x, z):
    if abs(z - RAIL_Z) < 2.0:
        return 0.5                                            # 铁路路基：一条平带
    m = 15 * math.exp(-((x + 9) / 7) ** 2 - ((z + 12) / 5) ** 2) + 12 * math.exp(-((x - 10) / 6.5) ** 2 - ((z + 13) / 5.5) ** 2)
    m += 7 * math.exp(-((x - 20) / 6) ** 2 - ((z + 6) / 6) ** 2)
    hills = 1.6 * math.sin(x * 0.35) * math.cos(z * 0.4) + 1.2
    lake = -2.5 * math.exp(-((x + 14) / 6) ** 2 - ((z - 11) / 3.5) ** 2)
    return max(0.0, m + hills + lake) if z < RAIL_Z else max(0.0, hills * 0.6 + lake)


def jit(i, j):
    return ((i * 7919 + j * 104729) % 97) / 97 - 0.5


V = {}
for i in range(NX + 1):
    for j in range(NZ + 1):
        x = X0 + i * CELL + (jit(i, j) * CELL * 0.5 if 0 < i < NX else 0)
        z = Z0 + j * CELL + (jit(j, i) * CELL * 0.5 if 0 < j < NZ else 0)
        V[i, j] = (x, height(x, z), z)


def face_color(a, b, c, i=0, j=0):
    y = (a[1] + b[1] + c[1]) / 3
    cx, cz = (a[0] + b[0] + c[0]) / 3, (a[2] + b[2] + c[2]) / 3
    if y < 0.25 and cz > RAIL_Z:
        return SKY                                            # 湖
    if abs(cz - RAIL_Z) < 1.8:
        return '#F3E2C2'                                      # 路基
    if y > 10.5:
        return WHITE                                          # 雪顶
    if y > 7.5:
        return '#B3B9F0'                                      # 山腰：淡长春花蓝
    if y > 4.5:
        return PERI                                           # 山脚：长春花蓝
    k = ((i // 2) * 7 + j * 5 + (i // 2) * j) % 8                    # 田块：两格一块，整块同色（像一畦一畦的田）
    return [YEL, GRN, PINK, YEL, MINT, LILAC, GRN, '#7DB8E8'][k]


TRIS = []
ORIGIN = (0.0, 16.0)                                          # 翻页从前景中间开始，往后推
for i in range(NX):
    for j in range(NZ):
        a, b, c, d = V[i, j], V[i + 1, j], V[i + 1, j + 1], V[i, j + 1]
        for t in ((a, d, b), (b, d, c)):
            cx, cz = sum(p[0] for p in t) / 3, sum(p[2] for p in t) / 3
            dist = math.hypot(cx - ORIGIN[0], (cz - ORIGIN[1]) * 1.15)
            # 铰链：离起点最近的那条边（像多米诺一样往外倒）
            edges = [(0, 1, 2), (1, 2, 0), (2, 0, 1)]
            hinge = min(edges, key=lambda e: math.hypot((t[e[0]][0] + t[e[1]][0]) / 2 - ORIGIN[0], (t[e[0]][2] + t[e[1]][2]) / 2 - ORIGIN[1]))
            TRIS.append((t, hinge, -0.55 + dist / 40 * 1.5, face_color(*t, i, j)))


# ---------- 树 ----------
TREES = []
for n in range(70):
    x = X0 + 3 + ((n * 37) % 97) / 97 * (X1 - X0 - 6)
    z = Z0 + 4 + ((n * 61) % 89) / 89 * (Z1 - Z0 - 8)
    y = height(x, z)
    if abs(z - RAIL_Z) < 4.2 or y > 4.2 or (y < 0.3 and z > RAIL_Z):
        continue
    group = n % 3                                             # 三拍里各冒一簇
    kind = 'pine' if n % 5 < 3 else 'round'
    TREES.append((x, y, z, 1.5 + group * 0.5 + (n % 4) * 0.04, kind, [PINK, YEL, LGRN][n % 3], 1.25 + (n % 5) * 0.15))


def pop(e):
    """冒出来：0→1.15→0.97→1，竖向比横向晚一点（有弹性的压扁）。"""
    if e <= 0:
        return 0, 0
    if e >= 1:
        return 1, 1
    sx = ease_out_back(clamp(e / 0.7), 2.4)
    sy = ease_out_back(clamp((e - 0.08) / 0.7), 2.8)
    return sx, max(0, sy)


def add_tree(S, x, y, z, kind, col, s, sx, sy):
    if sx <= 0.01:
        return
    w = s * sx
    if kind == 'pine':
        S.box(x - 0.12 * w, y, z - 0.12 * w, 0.24 * w, 0.24 * w, 0.6 * s * sy, '#A0715A')
        S.cone(x, y + 0.45 * s * sy, z, 1.0 * w, 1.6 * s * sy, '#3E9A68', n=6)
        S.cone(x, y + 1.25 * s * sy, z, 0.72 * w, 1.3 * s * sy, '#52B27C', n=6)
    else:
        S.box(x - 0.12 * w, y, z - 0.12 * w, 0.24 * w, 0.24 * w, 0.9 * s * sy, '#A0715A')
        S.ico(x, y + 1.5 * s * sy, z, 0.85 * w, col, jitter=0, sy=sy / max(sx, 0.01))


# ---------- 火车 + 枕木 + 蒸汽 ----------
def train_x(t):                                              # 车头前端的 x
    e = clamp((t - 2.0) / 2.4)
    return -34 + 40 * (1 - (1 - e) ** 2)                      # 进场快、到中间慢下来


def add_train(S, fx):
    y = 0.5 + 0.35
    z = RAIL_Z - 0.9
    # 车头（红）：锅炉 + 驾驶室 + 烟囱 + 排障
    S.box(fx - 3.6, y + 0.3, z, 3.6, 1.8, 0.4, INK)
    S.box(fx - 3.4, y + 0.7, z + 0.15, 2.4, 1.5, 1.3, INK)
    S.box(fx - 1.0, y + 0.7, z + 0.1, 0.9, 1.6, 1.4, RED)
    S.box(fx - 4.4, y + 0.7, z + 0.05, 1.3, 1.7, 2.1, RED)
    S.box(fx - 4.55, y + 2.8, z - 0.05, 1.6, 1.9, 0.2, INK)
    S.box(fx - 3.0, y + 2.0, z + 0.55, 0.45, 0.45, 1.0, INK)
    S.box(fx - 3.15, y + 3.0, z + 0.4, 0.75, 0.75, 0.25, INK)
    S.box(fx - 4.2, y + 1.7, z - 0.02, 0.8, 1.94, 0.6, '#FFE9A8', emit=0.5)
    for wx in (fx - 3.2, fx - 2.2, fx - 1.2):
        S.box(wx - 0.35, y - 0.05, z - 0.05, 0.7, 1.9, 0.7, '#C9503F')
    # 两节车厢（黄、蓝），白顶
    for k, col in enumerate([YEL, SKY]):
        x0 = fx - 5.2 - (k + 1) * 4.4
        S.box(x0, y + 0.4, z + 0.05, 4.1, 1.7, 1.7, col)
        S.box(x0 - 0.1, y + 2.1, z - 0.05, 4.3, 1.9, 0.25, WHITE)
        for w in range(3):
            S.box(x0 + 0.4 + w * 1.25, y + 1.2, z + 0.02, 0.8, 1.76, 0.6, '#FFF3C8', emit=0.4)
        for wx in (x0 + 0.6, x0 + 3.1):
            S.box(wx, y - 0.05, z - 0.03, 0.5, 1.86, 0.55, INK)
    return (fx - 2.8, y + 3.3, z + 0.9)                       # 烟囱口


SLEEPERS = [x / 10 for x in range(-300, 280, 9)]


def add_track(S, t, fx):
    front = -40
    for x in SLEEPERS:
        lay = (x - (fx + 6)) / 40 * -1                        # 枕木在车头前方 6 个单位处落下
        t_drop = 2.0 + (x + 34) / 40 * 2.4 * 0.62 - 0.35
        e = clamp((t - t_drop) / 0.3)
        if e <= 0:
            continue
        drop = (1 - ease_out_back(e, 1.6)) * 4
        S.box(x - 0.2, 0.5 + drop, RAIL_Z - 1.5, 0.4, 3.0, 0.22, '#B98466')
        if e >= 1:
            front = max(front, x)
    if front > -40:
        for dz in (-0.9, 0.9):
            S.box(-31, 0.72, RAIL_Z + dz - 0.08, front + 31, 0.16, 0.14, '#8E89A8')


def add_steam(S, t, chimney, fade=1.0):
    if t < 2.0:
        return 0
    k = 0
    for n in range(int((t - 2.0) / 0.13) + 1):
        t0 = 2.0 + n * 0.13
        age = t - t0
        if age < 0 or age > 1.6:
            continue
        cx = train_x(t0) - 2.8
        r = (0.4 + age * 1.6 + (0.2 if n % 3 == 0 else 0)) * fade
        if r < 0.05:
            continue
        S.ico(cx - age * 2.5, chimney[1] + age * 3.2, chimney[2] - age * 1.4, r, WHITE, jitter=0.15, seed=n)
        k += 1
    return k


def camera(t):
    e = ease_in_out(clamp(t / 5.0))
    eye = (-12 + 14 * e, 38 - 22 * e, 44 - 16 * e)
    tgt = (0 + 1 * e, 2.0 + 0.5 * e, 0 + 4.5 * e)
    return Camera(eye=eye, target=tgt, fov=34 - 6 * e)


def body(t, cover=(3.85, 4.97), night=0.0, center=None, refold=None):
    """refold = 结尾翻回纸的本地秒数（0 开始）。"""
    """第 1 章的世界层（不含 defs / 遮罩 / 颗粒 / 文字）。返回 (svg, 纸云)。"""
    S = Scene()
    creases = []
    cam = camera(t)
    rf = None
    if refold is not None:                        # 由远到近翻回纸：远处（z 小）先翻
        rf = (refold, lambda tri: 0.25 + (sum(p[2] for p in tri) / 3 - Z0) / (Z1 - Z0) * 0.8)
    unfold(S, TRIS, t, cam, creases, refold=rf)
    for (x, y, z, tpop, kind, col, s) in TREES:
        sx, sy = pop((t - tpop) / 0.45)
        if refold is not None:
            k = 1 - clamp((refold - (0.1 + (z - Z0) / (Z1 - Z0) * 0.8)) / 0.3)
            sx, sy = sx * k, sy * k
        add_tree(S, x, y, z, kind, col, s, sx, sy)
    fx = train_x(t) + (60 * clamp(refold / 1.0) ** 2 if refold is not None else 0)   # 结尾：火车先开走
    if refold is None or refold < 0.6:
        add_track(S, t, fx)
    ch = None
    if t >= 2.0:
        ch = add_train(S, fx)
        add_steam(S, t, ch, 1 - ease_in_out(clamp(refold / 0.8)) if refold is not None else 1.0)   # 结尾：烟一团团缩没
    if night:   # 夜里：三档明暗整体往深蓝紫里压，亮窗不压
        bands = (0.26 + 0.42 * night, 0.1 + 0.4 * night, 0.0 + 0.32 * night)
        tint = '#' + ''.join(f'{round(int(SHADE[i:i + 2], 16) * (1 - night) + int("2E2A58"[i - 1:i + 1], 16) * night):02x}' for i in (1, 3, 5))
    else:
        bands, tint = (0.26, 0.1, 0.0), SHADE
    world = crease_svg(creases) + render(S, cam, light=(-0.45, 0.8, 0.4), cull=True, bands=bands, tint=tint, seam=0.8, overlay=ROWS)
    over = ''
    if ch and cover:
        sx, sy, _ = cam.proj(ch)
        over = paper_cloud(clamp((t - cover[0]) / (cover[1] - cover[0])), sx, sy)
    if center is not None:
        center.append(cam.proj(ch) if ch else (W / 2, H / 2, 0))
    return world, over
