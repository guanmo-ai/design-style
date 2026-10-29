"""低多边形 · 折纸搭建 · 5 秒动效小样（30fps，150 帧）。
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

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '_lib'))
from poly3d import Camera, Scene, render  # noqa: E402

FPS, N = 30, 150
W, H = 1920, 1080
# 配色：参考“成都平原”小动画 + 004 孟菲斯的糖果色，压柔一点：奶油纸、粉彩田块、一条宝蓝的河
PAPER, BG = '#FBF4E6', '#F6EEDD'
RED, YEL, BLUE, GRN, LGRN, INK, WHITE, SKY = '#EE6B57', '#F4C54F', '#2F5FD8', '#4DAF72', '#9ED7A8', '#3B3552', '#FFFDF7', '#8CC8EE'
PINK, LILAC, MINT, PERI = '#F49DB6', '#C9A6EC', '#A9DDB4', '#8F9DEA'
SHADE = '#7A5C86'                                              # 暖紫阴影：暗面往这里混，不发灰


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease_out_back(e, s=1.2):          # 过冲约 5%
    e -= 1
    return 1 + (s + 1) * e ** 3 + s * e ** 2


def ease_in_out(e):
    return e * e * (3 - 2 * e)


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


def tri_flat(t):
    return [(p[0], 0.0, p[2]) for p in t]


def rotate_about(p, a, b, ang):
    """点 p 绕直线 a→b 旋转 ang（罗德里格斯公式）。"""
    k = (b[0] - a[0], b[1] - a[1], b[2] - a[2])
    L = math.sqrt(sum(x * x for x in k)) or 1
    k = (k[0] / L, k[1] / L, k[2] / L)
    v = (p[0] - a[0], p[1] - a[1], p[2] - a[2])
    c, s = math.cos(ang), math.sin(ang)
    kv = k[0] * v[0] + k[1] * v[1] + k[2] * v[2]
    cr = (k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0])
    r = tuple(v[i] * c + cr[i] * s + k[i] * kv * (1 - c) for i in range(3))
    return (r[0] + a[0], r[1] + a[1], r[2] + a[2])


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


def add_steam(S, t, chimney):
    if t < 2.0:
        return 0
    k = 0
    for n in range(int((t - 2.0) / 0.13) + 1):
        t0 = 2.0 + n * 0.13
        age = t - t0
        if age < 0 or age > 1.6:
            continue
        cx = train_x(t0) - 2.8
        r = 0.4 + age * 1.6 + (0.2 if n % 3 == 0 else 0)
        S.ico(cx - age * 2.5, chimney[1] + age * 3.2, chimney[2] - age * 1.4, r, WHITE, jitter=0.15, seed=n)
        k += 1
    return k


def camera(t):
    e = ease_in_out(clamp(t / 5.0))
    eye = (-12 + 14 * e, 38 - 22 * e, 44 - 16 * e)
    tgt = (0 + 1 * e, 2.0 + 0.5 * e, 0 + 4.5 * e)
    return Camera(eye=eye, target=tgt, fov=34 - 6 * e)


ROWS = {k.lower(): v for k, v in {YEL: 'rY', MINT: 'rM', PINK: 'rP', GRN: 'rG', LILAC: 'rL', '#7DB8E8': 'rM'}.items()}
DEFS = ('<defs>'
        + ''.join(f'<pattern id="{pid}" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate({ang})">'
                  f'<rect width="16" height="3.5" fill="{c}" opacity=".26"/></pattern>'
                  for pid, ang, c in [('rY', 28, '#FFFFFF'), ('rM', -32, '#FFFFFF'), ('rP', 61, '#FFFFFF'), ('rG', -58, '#2E8A57'), ('rL', 15, '#FFFFFF')])
        + '<filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="70"/></filter>'
        + '<filter id="speck" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="1" seed="4" result="n"/>'
          '<feComposite in="SourceGraphic" in2="n" operator="arithmetic" k2="1.6" k3="1.2" k4="-.75" result="m"/>'
          '<feComponentTransfer in="m"><feFuncR type="discrete" tableValues="0 1"/><feFuncG type="discrete" tableValues="0 1"/><feFuncB type="discrete" tableValues="0 1"/><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer></filter>'
        + f'<mask id="edge"><g filter="url(#speck)"><rect width="{W}" height="{H}" fill="#000"/><rect x="120" y="100" width="{W - 240}" height="{H - 200}" rx="80" fill="#fff" filter="url(#soft)"/></g></mask>'
        + '<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="9"/>'
          '<feColorMatrix values="0 0 0 0 .45  0 0 0 0 .35  0 0 0 0 .25  0 0 0 .1 0"/></filter>'
        + '</defs>')


def frame(f):
    t = f / FPS
    S = Scene()
    creases = []
    cam = camera(t)
    for (tri, hinge, delay, col) in TRIS:
        e = clamp((t - delay) / 0.5)
        if e >= 1:
            pts = list(tri)
        else:
            # 翻牌：原地跳起来转一整圈。前半圈是纸，转回来就是颜色，落到最终高度（过冲约 5%）
            k = ease_out_back(e, 1.0)
            hh = k
            lifted = [(p[0], p[1] * hh, p[2]) for p in tri]
            c0 = tuple(sum(p[i] for p in lifted) / 3 for i in range(3))
            hop = math.sin(math.pi * min(1, e * 1.15)) * 1.6
            c1 = (c0[0], c0[1] + hop, c0[2])
            a_, b_ = tri[hinge[0]], tri[hinge[1]]
            axis_end = (c1[0] + b_[0] - a_[0], c1[1], c1[2] + b_[2] - a_[2])
            ang = math.tau * min(1.0, k)
            pts = [rotate_about((p[0], p[1] + hop, p[2]), c1, axis_end, ang) for p in lifted]
            if e <= 0:
                creases.append([cam.proj(p) for p in tri_flat(tri)])
                S.tri(*tri_flat(tri), PAPER)
                continue
            S.tri(pts[0], pts[1], pts[2], col if k > 0.5 else PAPER, back='#EFDFC4')
            continue
        S.tri(pts[0], pts[1], pts[2], col, back=PAPER)
    for (x, y, z, tpop, kind, col, s) in TREES:
        sx, sy = pop((t - tpop) / 0.45)
        add_tree(S, x, y, z, kind, col, s, sx, sy)
    fx = train_x(t)
    add_track(S, t, fx)
    ch = None
    if t >= 2.0:
        ch = add_train(S, fx)
        add_steam(S, t, ch)
    body = render(S, cam, light=(-0.45, 0.8, 0.4), cull=True, bands=(0.26, 0.1, 0.0), tint=SHADE, seam=0.8, overlay=ROWS)
    cr = ''.join('<path d="M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y, _ in P) + 'Z" fill="none" stroke="#E9D9BC" stroke-width="1.6"/>' for P in creases)
    # 结尾：烟囱口喷出一团团低多边形的奶油色云，最后一帧正好铺满（= 第 0 帧的纸，循环）
    over = ''
    e = clamp((t - 3.85) / (4.97 - 3.85))
    if e > 0 and ch:
        sx, sy, _ = cam.proj(ch)
        g = e ** 1.7
        for m in range(16):
            ang = m / 16 * math.tau + 0.3
            d = (60 + 900 * g) * (0.6 + 0.4 * math.sin(m * 2.3) ** 2)
            cx, cy = sx + math.cos(ang) * d - 200 * g, sy - 260 * g + math.sin(ang) * d * 0.6
            r = (30 + 1500 * g) * (0.55 + 0.3 * math.sin(m * 1.7) ** 2)
            pts = []
            for q in range(9):                                   # 九边形 + 抖动 = 低多边形的云
                aa = q / 9 * math.tau + m
                rr = r * (0.88 + 0.12 * math.sin(q * 3.1 + m))
                pts.append(f'{cx + math.cos(aa) * rr:.0f},{cy + math.sin(aa) * rr:.0f}')
            over += f'<polygon points="{" ".join(pts)}" fill="{"#F1E4CC" if m % 3 == 0 else BG}"/>'
        over += f'<circle cx="{sx - 200 * g:.0f}" cy="{sy - 260 * g:.0f}" r="{max(0, 2600 * (e - 0.55) / 0.45):.0f}" fill="{BG}"/>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{DEFS}<rect width="{W}" height="{H}" fill="{BG}"/>'
            f'<g mask="url(#edge)">{cr}{body}</g>{over}<rect width="{W}" height="{H}" filter="url(#grain)"/></svg>')


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'out'
    os.makedirs(out, exist_ok=True)
    only = [int(a) for a in sys.argv[2:]]
    for f in (only or range(N)):
        open(os.path.join(out, f'f{f:04d}.svg'), 'w').write(frame(f))
