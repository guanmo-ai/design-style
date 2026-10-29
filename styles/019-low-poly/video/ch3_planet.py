"""019 低多边形 · 第 3 章 · 小星球（本地 0—3.6 秒）。
三角面从四面八方飞回来拼成一颗星球；之后每拍减一次面：1280 → 320 → 80，“少到刚好认得出”。"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
from poly3d import Camera, Scene, render, norm  # noqa: E402
from common import *  # noqa: E402,F401,F403


def icosphere(level):
    t = (1 + 5 ** 0.5) / 2
    V = [norm(v) for v in [(-1, t, 0), (1, t, 0), (-1, -t, 0), (1, -t, 0), (0, -1, t), (0, 1, t), (0, -1, -t), (0, 1, -t), (t, 0, -1), (t, 0, 1), (-t, 0, -1), (-t, 0, 1)]]
    F = [(0, 11, 5), (0, 5, 1), (0, 1, 7), (0, 7, 10), (0, 10, 11), (1, 5, 9), (5, 11, 4), (11, 10, 2), (10, 7, 6), (7, 1, 8),
         (3, 9, 4), (3, 4, 2), (3, 2, 6), (3, 6, 8), (3, 8, 9), (4, 9, 5), (2, 4, 11), (6, 2, 10), (8, 6, 7), (9, 8, 1)]
    for _ in range(level):
        cache, F2 = {}, []

        def mid(a, b):
            k = (min(a, b), max(a, b))
            if k not in cache:
                cache[k] = len(V)
                V.append(norm(tuple((V[a][i] + V[b][i]) / 2 for i in range(3))))
            return cache[k]
        for a, b, c in F:
            ab, bc, ca = mid(a, b), mid(b, c), mid(c, a)
            F2 += [(a, ab, ca), (b, bc, ab), (c, ca, bc), (ab, bc, ca)]
        F = F2
    return V, F


def land(d):
    """方向 d 上是陆地还是海：几个“大陆”中心的距离场。"""
    cont = [(0.6, 0.5, 0.6), (-0.7, 0.2, 0.5), (0.1, -0.6, -0.8), (-0.4, 0.7, -0.6), (0.9, -0.3, -0.2)]
    v = max(sum(a * b for a, b in zip(d, norm(c))) for c in cont)
    return v


def face_col(d, k):
    if abs(d[1]) > 0.86:
        return WHITE                                  # 极地
    v = land(d)
    if v > 0.86:
        return [GRN, LGRN, GRN, YEL, PINK][(k * 7) % 5] if v < 0.95 else '#3E9A68'
    if v > 0.80:
        return '#F3E2C2'                              # 海岸
    return ['#7DB8E8', '#86C0EC', '#7DB8E8'][k % 3]


MESH = {}
for lv in (3, 2, 1):
    V, F = icosphere(lv)
    tris = []
    for k, (a, b, c) in enumerate(F):
        cen = norm(tuple((V[a][i] + V[b][i] + V[c][i]) / 3 for i in range(3)))
        bump = 1.0 + (0.07 if land(cen) > 0.86 else 0.02 if land(cen) > 0.8 else 0)
        tris.append(([tuple(x * bump for x in V[a]), tuple(x * bump for x in V[b]), tuple(x * bump for x in V[c])], cen, face_col(cen, k)))
    MESH[lv] = tris
rnd = random.Random(19)
FLY = [(rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-1, 1)) for _ in range(len(MESH[3]))]
COUNTS = {3: 1280, 2: 320, 1: 80}
LEVEL_T = [(0.0, 3), (1.75, 2), (2.25, 1)]           # 本地时间 → 面数等级（落在拍点上）


def level_at(t):
    lv = 3
    for t0, l in LEVEL_T:
        if t >= t0:
            lv = l
    return lv


def rot_y(p, a):
    c, s = math.cos(a), math.sin(a)
    return (p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c)


def body(t, cover=None, R0=7.0):
    S = Scene()
    lv = level_at(t)
    # 换等级的那一拍：整颗星球压一下再弹回（5%）
    since = min([t - t0 for t0, l in LEVEL_T if t >= t0 and t0 > 0] or [9])
    squash = 1 - 0.08 * math.sin(math.pi * clamp(since / 0.25)) if since < 0.25 else 1
    spin = 0.6 + t * 0.9
    # 收尾：3.0 秒起缩小、往右上飞，交给第 4 章当 App 图标
    shrink = ease_in_out(clamp((t - 3.0) / 0.6))
    R = R0 * (1 - 0.82 * shrink)
    off = (14 * shrink, 6.5 * shrink, 0)
    for idx, (tri, cen, col) in enumerate(MESH[lv]):
        # 飞回来：按纬度从上往下，一圈圈到位
        lat = (1 - cen[1]) / 2
        e = clamp((t + 0.5 - lat * 0.8) / 0.4) if lv == 3 else 1
        if e <= 0:
            continue
        k = ease_out_back(e, 1.6)
        fl = FLY[idx % len(FLY)]
        pts = []
        for p in tri:
            q = rot_y(p, spin)
            q = (q[0] * R * squash ** -0.5, q[1] * R * squash, q[2] * R * squash ** -0.5)
            c = rot_y(cen, spin)
            dx = (1 - k) * (fl[0] * 30 + c[0] * 12)
            dy = (1 - k) * (fl[1] * 20 + 18)
            dz = (1 - k) * (fl[2] * 30 + c[2] * 12)
            # 面绕自己的中心缩放：飞行时小一点
            cc = (c[0] * R, c[1] * R, c[2] * R)
            q = tuple(cc[i] + (q[i] - cc[i]) * (0.3 + 0.7 * k) for i in range(3))
            pts.append((q[0] + dx + off[0], q[1] + dy + off[1], q[2] + dz + off[2]))
        S.tri(pts[0], pts[1], pts[2], col, back=PAPER)
    # 一架纸飞机绕着星球飞
    if t > 1.0 and shrink < 0.5:
        a = (t - 1.0) * 2.2
        px, py, pz = math.cos(a) * R * 1.45 + off[0], R * 0.35 + math.sin(a * 2) * 0.6 + off[1], math.sin(a) * R * 1.45
        fx, fz = -math.sin(a), math.cos(a)
        S.tri((px + fx * 1.4, py, pz + fz * 1.4), (px - fx * 0.6 - fz * 0.9, py + 0.1, pz - fz * 0.6 + fx * 0.9), (px - fx * 0.3, py + 0.35, pz - fz * 0.3), WHITE, back='#E9DCC4')
        S.tri((px + fx * 1.4, py, pz + fz * 1.4), (px - fx * 0.3, py + 0.35, pz - fz * 0.3), (px - fx * 0.6 + fz * 0.9, py + 0.1, pz - fz * 0.6 - fx * 0.9), WHITE, back='#E9DCC4')
    cam = Camera(eye=(0, 5, 27), target=(0, 0.6, 0), fov=40)
    world = render(S, cam, light=(-0.6, 0.6, 0.5), cull=True, bands=(0.3, 0.12, 0.0), tint=SHADE, seam=0.8, overlay=ROWS)
    # 面数读数：大号数字跟在星球右下
    label = ''
    if 0.6 < t < 3.0:
        n = COUNTS[lv]
        label = (f'<text x="1400" y="800" font-family="Inter" font-weight="900" font-size="120" fill="{INK}">{n}</text>'
                 f'<text x="1404" y="846" font-family="NotoSC" font-weight="900" font-size="34" fill="{INK}">个三角面</text>')
    return world, label
