"""中世纪现代的核心工具：把任何形状变成“剪刀剪出来的纸片”。

剪刀剪不出完美曲线：沿轮廓每隔 14—34px 剪一刀直的，刀与刀之间转一点角，顶点再偏 ±1.5px。
同一个形状换一个 seed 就是“重剪一遍”——视频里每两帧换一次 seed，轮廓会轻轻“沸腾”。
"""
import math
import random
import sys

sys.path.insert(0, __file__.rsplit('/', 2)[0] + '/_lib')
from glyphs import Font, bbox, path_d  # noqa: E402,F401


def perimeter_resample(poly, rng, lo, hi, jitter):
    n = len(poly)
    segs, total = [], 0.0
    for i in range(n):
        a, b = poly[i], poly[(i + 1) % n]
        d = math.dist(a, b)
        segs.append((a, b, d))
        total += d
    if total < lo * 3:
        return [(x + rng.uniform(-jitter, jitter), y + rng.uniform(-jitter, jitter)) for x, y in poly]
    # 在尖角处保留顶点（字的角、方块的角），其余按随机步长重采样
    out, pos, target = [], 0.0, 0.0
    corners = set()
    for i in range(n):
        p0, p1, p2 = poly[i - 1], poly[i], poly[(i + 1) % n]
        v1 = (p1[0] - p0[0], p1[1] - p0[1])
        v2 = (p2[0] - p1[0], p2[1] - p1[1])
        l1, l2 = math.hypot(*v1), math.hypot(*v2)
        if l1 and l2 and (v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2) < 0.75:
            corners.add(i)
    for i, (a, b, d) in enumerate(segs):
        if i in corners:
            out.append(a)
            target = pos + rng.uniform(lo, hi)
        while target <= pos + d:
            t = (target - pos) / d if d else 0
            out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
            target += rng.uniform(lo, hi)
        pos += d
    return [(x + rng.uniform(-jitter, jitter), y + rng.uniform(-jitter, jitter)) for x, y in out]


def rough(polys, seed=1, lo=14, hi=34, jitter=1.6):
    rng = random.Random(seed)
    return [perimeter_resample(c, rng, lo, hi, jitter) for c in polys]


def circle(cx, cy, r, n=180):
    return [(cx + r * math.cos(i / n * math.tau), cy + r * math.sin(i / n * math.tau)) for i in range(n)]


def rect(x, y, w, h):
    return [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]


def rot(polys, ang, cx, cy):
    c, s = math.cos(math.radians(ang)), math.sin(math.radians(ang))
    return [[(cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c) for x, y in p] for p in polys]


def move(polys, dx, dy):
    return [[(x + dx, y + dy) for x, y in p] for p in polys]


def bar(x0, y0, x1, y1, w0, w1):
    """一条两头宽度不同的纸条（Bass《金臂人》式的手臂）。"""
    dx, dy = x1 - x0, y1 - y0
    L = math.hypot(dx, dy)
    nx, ny = -dy / L, dx / L
    return [(x0 + nx * w0 / 2, y0 + ny * w0 / 2), (x1 + nx * w1 / 2, y1 + ny * w1 / 2),
            (x1 - nx * w1 / 2, y1 - ny * w1 / 2), (x0 - nx * w0 / 2, y0 - ny * w0 / 2)]


def cut_word(font, text, size, x, y, seed=1, tilt=3.0, bounce=0.04, tracking=0.0, overrides=None):
    """每个字母单独剪、单独歪一点、上下错一点（手贴上去的）。overrides: {i: (dx, dy, 角度)} 给正在飞的字。
    返回 [(字母的轮廓, 是否在飞)]。"""
    rng = random.Random(seed)
    out = []
    for i, (polys, gx, w) in enumerate(font.glyphs(text, size, tracking=tracking, step=4)):
        ang = rng.uniform(-tilt, tilt)
        dy = rng.uniform(-bounce, bounce) * size
        dx = 0
        flying = False
        if overrides and i in overrides:
            dx, dy2, ang = overrides[i]
            dy += dy2
            flying = True
        p = move(polys, x, y)
        p = rot(p, ang, x + gx + w / 2, y - size * 0.35)
        p = move(p, dx, dy)
        lo, hi = max(3, min(10, size * 0.04)), max(6, min(24, size * 0.09))
        out.append((rough(p, seed * 100 + i, lo=lo, hi=hi, jitter=min(1.2, size * 0.012)), flying))
    return out


def ellipse(cx, cy, rx, ry, n=120):
    return [(cx + rx * math.cos(i / n * math.tau), cy + ry * math.sin(i / n * math.tau)) for i in range(n)]


def orient(poly):
    """统一成同一绕向，几块拼在一条 path 里才是并集、不会互相挖洞。"""
    a = sum(poly[i][0] * poly[(i + 1) % len(poly)][1] - poly[(i + 1) % len(poly)][0] * poly[i][1] for i in range(len(poly)))
    return poly if a > 0 else poly[::-1]
