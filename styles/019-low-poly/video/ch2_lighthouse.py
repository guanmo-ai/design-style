"""019 低多边形 · 第 2 章 · 海边灯塔（本地 0—3.5 秒）。
规则 2：光一转，所有面跟着翻亮翻暗——太阳从左绕到右，三档明暗在每个三角面上跳。"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from poly3d import Camera, Scene, render  # noqa: E402
from common import *  # noqa: E402,F401,F403

X0, X1, Z0, Z1, CELL = -26, 26, -18, 16, 2.6
NX, NZ = int((X1 - X0) / CELL), int((Z1 - Z0) / CELL)


def land(x, z):
    """左后方一片高崖，往右前方落进海里；海是 y≈0 的面。"""
    cliff = 6.5 * math.exp(-((x + 10) / 9) ** 2 - ((z + 7) / 8) ** 2) + 4 * math.exp(-((x - 14) / 6) ** 2 - ((z + 12) / 5) ** 2)
    return cliff - 1.2


def jit(i, j):
    return ((i * 7919 + j * 104729) % 97) / 97 - 0.5


V = {}
for i in range(NX + 1):
    for j in range(NZ + 1):
        x = X0 + i * CELL + (jit(i, j) * CELL * 0.5 if 0 < i < NX else 0)
        z = Z0 + j * CELL + (jit(j, i) * CELL * 0.5 if 0 < j < NZ else 0)
        V[i, j] = (x, land(x, z), z)

TRIS, ORIGIN = [], (8.0, 16.0)
for i in range(NX):
    for j in range(NZ):
        a, b, c, d = V[i, j], V[i + 1, j], V[i + 1, j + 1], V[i, j + 1]
        for t in ((a, d, b), (b, d, c)):
            cx, cz = sum(p[0] for p in t) / 3, sum(p[2] for p in t) / 3
            y = sum(p[1] for p in t) / 3
            sea = y < 0.2
            if sea:
                t = tuple((p[0], 0.0, p[2]) for p in t)
                col = ['#7DB8E8', '#8CC8EE', '#6FA8DE'][(i + j) % 3]
            elif y < 1.4:
                col = '#F3E2C2'                                   # 沙滩
            elif y > 5.5:
                col = [GRN, '#3E9A68'][(i + j) % 2]
            else:
                col = [LGRN, MINT, YEL, PINK][(i * 3 + j * 5) % 4]
            dist = math.hypot(cx - ORIGIN[0], (cz - ORIGIN[1]) * 1.15)
            hinge = min([(0, 1, 2), (1, 2, 0), (2, 0, 1)], key=lambda e: math.hypot((t[e[0]][0] + t[e[1]][0]) / 2 - ORIGIN[0], (t[e[0]][2] + t[e[1]][2]) / 2 - ORIGIN[1]))
            TRIS.append((t, hinge, -0.2 + dist / 40 * 1.3, col, sea, (i, j)))

LH = (-10.0, land(-10, -7) - 0.3, -7.0)                                 # 灯塔脚下


def lighthouse(S, t):
    e = clamp((t - 1.15) / 0.5)
    if e <= 0:
        return None
    x, y0, z = LH
    k = ease_out_back(e, 2.0)
    h = 0
    for n in range(6):                                            # 六段红白相间的八棱柱，一段段弹上去
        seg_e = clamp((t - 1.15 - n * 0.06) / 0.3)
        if seg_e <= 0:
            break
        s = ease_out_back(seg_e, 2.0)
        r0, r1 = 1.9 - n * 0.14, 1.9 - (n + 1) * 0.14
        prism(S, x, y0 + h, z, r0 * s, r1 * s, 1.45 * s, RED if n % 2 == 0 else WHITE)
        h += 1.45 * s
    if clamp((t - 1.6) / 0.3) > 0:
        g = ease_out_back(clamp((t - 1.6) / 0.3), 2.0)
        prism(S, x, y0 + h, z, 1.9 * g, 1.9 * g, 0.5 * g, INK)
        prism(S, x, y0 + h + 0.5 * g, z, 1.3 * g, 1.3 * g, 1.5 * g, '#FFE9A8', emit=0.9)
        S.cone(x, y0 + h + 2.0 * g, z, 1.7 * g, 1.5 * g, RED, n=8)
        return (x, y0 + h + 1.25 * g, z)
    return None


def prism(S, x, y, z, r0, r1, h, col, n=8, emit=0.0):
    b = [(x + r0 * math.cos(q / n * math.tau), y, z + r0 * math.sin(q / n * math.tau)) for q in range(n)]
    tp = [(x + r1 * math.cos(q / n * math.tau), y + h, z + r1 * math.sin(q / n * math.tau)) for q in range(n)]
    for q in range(n):
        w = (q + 1) % n
        S.quad(b[q], tp[q], tp[w], b[w], col, emit)
    for q in range(1, n - 1):
        S.tri(tp[0], tp[q + 1], tp[q], col, emit)


def boat(S, t):
    e = clamp((t - 1.5) / 0.4)
    if e <= 0:
        return
    s = ease_out_back(e, 2.0)
    x = 6 - 4 * clamp((t - 1.5) / 2.0)
    z = 1
    bob = math.sin(t * 5) * 0.18
    S.box(x - 1.6 * s, bob, z - 0.6 * s, 3.2 * s, 1.2 * s, 0.6 * s, YEL)
    S.box(x - 0.1 * s, bob + 0.6 * s, z - 0.05, 0.12, 0.1, 2.6 * s, INK)
    S.tri((x, bob + 0.9 * s, z), (x, bob + 3.0 * s, z), (x + 1.6 * s, bob + 0.9 * s, z), WHITE, back=WHITE)


def camera(t):
    e = ease_in_out(clamp(t / 3.5))
    return Camera(eye=(16 - 6 * e, 22 - 4 * e, 38 - 6 * e), target=(-5, 5.0, -6), fov=40 - 4 * e)


def body(t, cover=(2.75, 3.5)):
    S = Scene()
    cam = camera(t)
    creases = []
    # 海浪：落定以后，海面的三角顶点上下起伏（像折纸被风吹）
    tris = []
    for (tri, hinge, delay, col, sea, (i, j)) in TRIS:
        if sea and t > delay + 0.5:
            tri = tuple((p[0], 0.35 * math.sin(t * 3.2 + p[0] * 0.35 + p[2] * 0.25), p[2]) for p in tri)
        tris.append((tri, hinge, delay, col))
    unfold(S, tris, t, cam, creases)
    lamp = lighthouse(S, t)
    boat(S, t)
    # 太阳绕着转：0.9 秒起从左后转到右前，三档明暗跟着在每个面上跳
    a = -1.9 + 2.6 * ease_in_out(clamp((t - 0.9) / 2.2))
    light = (math.cos(a) * 0.8, 0.55, math.sin(a) * 0.8)
    world = crease_svg(creases) + render(S, cam, light=light, cull=True, bands=(0.3, 0.12, 0.0), tint=SHADE, seam=0.8, overlay=ROWS)
    over = ''
    if lamp:
        lx, ly, _ = cam.proj(lamp)
        b = clamp((t - 1.9) / 0.2)
        if b > 0:                                                 # 灯塔的光束：转着扫过画面
            ang = t * 2.4
            L = 1600
            p1 = (lx + math.cos(ang - 0.11) * L, ly + math.sin(ang - 0.11) * L * 0.4)
            p2 = (lx + math.cos(ang + 0.11) * L, ly + math.sin(ang + 0.11) * L * 0.4)
            world += f'<polygon points="{lx:.0f},{ly:.0f} {p1[0]:.0f},{p1[1]:.0f} {p2[0]:.0f},{p2[1]:.0f}" fill="#FFF1B8" opacity="{0.6 * b:.2f}"/>'
        over = paper_cloud(clamp((t - cover[0]) / (cover[1] - cover[0])), lx, ly)
    return world, over
