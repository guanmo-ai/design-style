"""迷幻海报的核心工具：把几行字“灌”进一个形状里，撑满为止（Wes Wilson 1966 的做法）。

每一行字先排成矩形，再逐行映射到形状里：纵向按行分带，横向按这一高度上形状的左右边界拉伸。
形状越窄的地方字被挤得越瘦，像热蜡被挤进模子。
"""
import math
import sys

sys.path.insert(0, __file__.rsplit('/', 2)[0] + '/_lib')
from glyphs import Font, bbox, path_d, subdivide  # noqa: E402


def blob(cx, cy, r, waves=(), n=360):
    """r(θ) = r · (1 + Σ a·sin(kθ + φ))，返回多边形。waves = [(k, a, φ)]"""
    pts = []
    for i in range(n):
        t = i / n * math.tau
        rr = r * (1 + sum(a * math.sin(k * t + ph) for k, a, ph in waves))
        pts.append((cx + rr * math.cos(t), cy + rr * math.sin(t)))
    return pts


def span(poly, y):
    xs = []
    n = len(poly)
    for i in range(n):
        (x1, y1), (x2, y2) = poly[i], poly[(i + 1) % n]
        if (y1 <= y < y2) or (y2 <= y < y1):
            xs.append(x1 + (y - y1) * (x2 - x1) / (y2 - y1))
    return (min(xs), max(xs)) if len(xs) >= 2 else None


def fill_shape(lines, font, shape, gap=0.06, pad=0.03, top=None, bot=None, size=300, tracking=0.02,
               weights=None, vcurve=0.0):
    """lines: 每行文字；shape: 多边形。返回 SVG path d。
    weights: 每行占的高度比例；vcurve: >0 时中间的行更高（像鼓起来）。"""
    ys = [p[1] for p in shape]
    y0, y1 = (top if top is not None else min(ys)), (bot if bot is not None else max(ys))
    h = y1 - y0
    y0 += h * pad
    y1 -= h * pad
    n = len(lines)
    weights = weights or [1] * n
    tot = sum(weights)
    bands, acc = [], 0
    for w in weights:
        bands.append((acc / tot, (acc + w) / tot))
        acc += w
    out = []
    for (line, (b0, b1)) in zip(lines, bands):
        polys, _ = font.polys(line, size, tracking=tracking, step=3)
        bx0, by0, bx1, by1 = bbox(polys)
        g = gap / 2
        for c in polys:
            c = subdivide(c, 4)
            res = []
            for x, y in c:
                u = (x - bx0) / (bx1 - bx0)
                v = (y - by0) / (by1 - by0)
                vv = b0 + g * (b1 - b0) + v * (b1 - b0) * (1 - gap)
                if vcurve:
                    vv = vv + vcurve * math.sin(vv * math.pi * 2) / (2 * math.pi)
                yy = y0 + vv * (y1 - y0)
                sp = span(shape, yy) or span(shape, yy + 0.5)
                if sp is None:
                    continue
                xl, xr = sp
                inset = (xr - xl) * pad
                res.append((xl + inset + u * (xr - xl - 2 * inset), yy))
            if len(res) > 2:
                out.append(res)
    return path_d(out)


def arch(x, y, w, h, n=80):
    """墓碑形：上面半圆、下面方。60 年代海报最常见的外框。"""
    r = w / 2
    pts = [(x + r - r * math.cos(math.pi * i / n), y + r - r * math.sin(math.pi * i / n)) for i in range(n + 1)]
    return pts + [(x + w, y + h), (x, y + h)]


def pill(x, y, w, h, n=40):
    r = h / 2
    pts = [(x + w - r + r * math.cos(-math.pi / 2 + math.pi * i / n), y + r + r * math.sin(-math.pi / 2 + math.pi * i / n)) for i in range(n + 1)]
    pts += [(x + r + r * math.cos(math.pi / 2 + math.pi * i / n), y + r + r * math.sin(math.pi / 2 + math.pi * i / n)) for i in range(n + 1)]
    return pts


def wave_band(x, y, w, h, amp, k=2, ph=0, n=120):
    """上下两条边都是正弦波的横幅。"""
    top = [(x + w * i / n, y + amp * math.sin(k * math.tau * i / n + ph)) for i in range(n + 1)]
    bot = [(x + w * i / n, y + h + amp * math.sin(k * math.tau * i / n + ph + 0.8)) for i in range(n, -1, -1)]
    return top + bot
