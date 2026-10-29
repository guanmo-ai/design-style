"""
中世纪现代的工具箱：把任何形状变成“剪刀剪出来、能拿起来的纸片”。

三条规则，图和视频共用：
  1) 剪：剪刀剪不出完美曲线——沿轮廓每 lo—hi px 剪一刀直的，顶点再偏 ±jitter px；
     尖角保留（字的角、方块的角）。同一个形状换一个 seed = 重剪一遍（视频里每 2 帧换一次，边缘轻轻“沸腾”）。
  2) 影子 = 高度：纸片离桌面 h px，影子往右下偏 (0.5h, h)，模糊 0.4h；贴着桌面 h = 4。
  3) 叠印：两块颜色叠在一起用 multiply，叠出第三种颜色，不另加新色。
"""
import math
import random
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from glyphs import Font, bbox, path_d  # noqa: E402,F401

# ---------------------------------------------------------------- 色板
PAPER = '#F1E4C8'   # 奶油纸
INK = '#1B1714'     # 墨
TANG = '#E4532C'    # 橘
MUST = '#EBA628'    # 芥末黄
TEAL = '#23736E'    # 孔雀绿
MUTE = '#8C7B62'    # 说明文字（纸上）

JOST = "'Jost', 'Noto Sans SC', sans-serif"
SC = "'Noto Sans SC', 'PingFang SC', sans-serif"


def multiply(a, b):
    """叠印色：两种油墨叠在一起，逐通道相乘。"""
    ca = [int(a[i:i + 2], 16) for i in (1, 3, 5)]
    cb = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{round(x * y / 255):02X}' for x, y in zip(ca, cb))


# ---------------------------------------------------------------- 剪
def _resample(poly, rng, lo, hi, jitter):
    n = len(poly)
    segs, total = [], 0.0
    for i in range(n):
        a, b = poly[i], poly[(i + 1) % n]
        d = math.dist(a, b)
        segs.append((a, b, d))
        total += d
    if total < lo * 3:
        return [(x + rng.uniform(-jitter, jitter), y + rng.uniform(-jitter, jitter)) for x, y in poly]
    corners = set()
    for i in range(n):
        p0, p1, p2 = poly[i - 1], poly[i], poly[(i + 1) % n]
        v1 = (p1[0] - p0[0], p1[1] - p0[1])
        v2 = (p2[0] - p1[0], p2[1] - p1[1])
        l1, l2 = math.hypot(*v1), math.hypot(*v2)
        if l1 and l2 and (v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2) < 0.75:
            corners.add(i)
    out, pos, target = [], 0.0, rng.uniform(0, lo)
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


def rough(polys, seed=1, lo=14, hi=34, jitter=1.5):
    rng = random.Random(seed)
    return [_resample(c, rng, lo, hi, jitter) for c in polys]


# ---------------------------------------------------------------- 形状（都返回“轮廓列表”）
def circle(cx, cy, r, n=None):
    n = n or max(24, int(r * 1.2))
    return [[(cx + r * math.cos(i / n * math.tau), cy + r * math.sin(i / n * math.tau)) for i in range(n)]]


def ellipse(cx, cy, rx, ry, n=120, ang=0):
    p = [(cx + rx * math.cos(i / n * math.tau), cy + ry * math.sin(i / n * math.tau)) for i in range(n)]
    return rot([p], ang, cx, cy)


def rect(x, y, w, h):
    return [[(x, y), (x + w, y), (x + w, y + h), (x, y + h)]]


def rrect(x, y, w, h, r, n=8):
    pts = []
    for cx, cy, a0 in ((x + w - r, y + r, -90), (x + w - r, y + h - r, 0), (x + r, y + h - r, 90), (x + r, y + r, 180)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return [pts]


def poly(*pts):
    return [list(pts)]


def bar(x0, y0, x1, y1, w0, w1=None):
    """一条两头宽度可以不同的纸条。"""
    w1 = w0 if w1 is None else w1
    L = math.hypot(x1 - x0, y1 - y0) or 1
    nx, ny = -(y1 - y0) / L, (x1 - x0) / L
    return [[(x0 + nx * w0 / 2, y0 + ny * w0 / 2), (x1 + nx * w1 / 2, y1 + ny * w1 / 2),
             (x1 - nx * w1 / 2, y1 - ny * w1 / 2), (x0 - nx * w0 / 2, y0 - ny * w0 / 2)]]


def kidney(cx, cy, s, ang=0, n=140):
    """腰果形（1950 年代的咖啡桌、泳池、调色板）：椭圆的上边往里凹一块。"""
    pts = []
    for i in range(n):
        u = i / n * math.tau
        x, y = 1.5 * math.cos(u), 0.78 * math.sin(u)
        if math.sin(u) < 0:
            y += 0.62 * (-math.sin(u)) ** 5 * math.exp(-(math.cos(u) + 0.15) ** 2 * 3)
        pts.append((cx + s * x, cy + s * y))
    return rot([pts], ang, cx, cy)


def boomerang(cx, cy, s, ang=0, n=40):
    """回旋镖（Formica 台面上的那种）：一条弯过来的宽纸条，左臂长、右臂短，两头圆。"""
    A, C, B = (-1.15, -0.45), (-0.05, 1.25), (0.95, -0.55)

    def c(t):
        u = 1 - t
        return (u * u * A[0] + 2 * u * t * C[0] + t * t * B[0], u * u * A[1] + 2 * u * t * C[1] + t * t * B[1])

    def width(t):
        return 0.17 + 0.09 * math.sin(math.pi * t)

    up, down = [], []
    for i in range(n + 1):
        t = i / n
        (x0, y0), (x1, y1) = c(max(0, t - 0.01)), c(min(1, t + 0.01))
        L = math.hypot(x1 - x0, y1 - y0)
        nx, ny = -(y1 - y0) / L, (x1 - x0) / L
        x, y = c(t)
        w = width(t)
        up.append((x + nx * w, y + ny * w))
        down.append((x - nx * w, y - ny * w))
    def cap(p_from, p_to, out, k=10):
        """半圆端头：从 p_from 绕到 p_to，鼓向 out 方向。"""
        mx, my = (p_from[0] + p_to[0]) / 2, (p_from[1] + p_to[1]) / 2
        r = math.dist(p_from, p_to) / 2
        a0 = math.atan2(p_from[1] - my, p_from[0] - mx)
        a1 = math.atan2(p_to[1] - my, p_to[0] - mx)
        res = []
        for da in ((a1 - a0) % math.tau, (a1 - a0) % math.tau - math.tau):
            am = a0 + da / 2
            if math.cos(am) * out[0] + math.sin(am) * out[1] > 0:
                res = [(mx + r * math.cos(a0 + da * j / k), my + r * math.sin(a0 + da * j / k)) for j in range(1, k)]
        return res

    tb = (c(1)[0] - c(0.99)[0], c(1)[1] - c(0.99)[1])
    ta = (c(0)[0] - c(0.01)[0], c(0)[1] - c(0.01)[1])
    pts = up + cap(up[-1], down[-1], tb) + down[::-1] + cap(down[0], up[0], ta)
    pts = [(cx + s * x, cy + s * y) for x, y in pts]
    return rot([pts], ang, cx, cy)


def star(cx, cy, r_out, r_in, k=4, ang=0):
    """原子时代的星芒：k 个尖。"""
    pts = []
    for i in range(k * 2):
        a = math.radians(ang - 90 + i * 180 / k)
        r = r_out if i % 2 == 0 else r_in
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return [pts]


def crescent(cx, cy, r, th, ang, n=36):
    """剪圆时掉下来的月牙边角料。"""
    a0 = math.radians(ang)
    out = [(cx + r * math.cos(a0 + math.pi * i / n), cy + r * math.sin(a0 + math.pi * i / n)) for i in range(n + 1)]
    inn = [(cx + (r - th) * math.cos(a0 + math.pi * i / n) * 0.96,
            cy + (r - th) * math.sin(a0 + math.pi * i / n) * 0.7) for i in range(n, -1, -1)]
    return [out + inn]


def ring(cx, cy, rx, ry, w, ang=0, n=120):
    """原子轨道：一圈纸环（evenodd 填充）。"""
    return ellipse(cx, cy, rx, ry, n, ang) + [list(reversed(ellipse(cx, cy, rx - w, ry - w, n, ang)[0]))]


# ---------------------------------------------------------------- 变换
def rot(polys, ang, cx, cy):
    c, s = math.cos(math.radians(ang)), math.sin(math.radians(ang))
    return [[(cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c) for x, y in p] for p in polys]


def move(polys, dx, dy):
    return [[(x + dx, y + dy) for x, y in p] for p in polys]


def scale(polys, k, cx=0, cy=0):
    return [[(cx + (x - cx) * k, cy + (y - cy) * k) for x, y in p] for p in polys]


def orient(p, ccw=True):
    a = sum(p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1] for i in range(len(p)))
    return p if (a > 0) == ccw else p[::-1]


def union(*groups):
    """几块同色纸拼成一块（统一绕向，nonzero 填充 = 并集，影子也只算一次）。"""
    return [orient(p) for g in groups for p in g]


def center(polys):
    x0, y0, x1, y1 = bbox(polys)
    return (x0 + x1) / 2, (y0 + y1) / 2


# ---------------------------------------------------------------- 字：每个字母单独剪、单独歪
_FONTS = {}


def font(name):
    if name not in _FONTS:
        _FONTS[name] = Font({'anton': 'Anton-Regular.ttf', 'sc': 'NotoSansSC-Black.otf',
                             'jost': 'Jost.ttf', 'heros': 'TeXGyreHeros-Bold.otf'}[name],
                            {'wght': 800} if name == 'jost' else None)
    return _FONTS[name]


def word(text, size, x, y, f='anton', seed=1, tilt=2.5, bounce=0.02, tracking=0.0, lift=None, cut=True):
    """返回 [(字母轮廓, 第几个字母)]；lift = {i: (dx, dy, 角度)} 给正被拿起来的字母。
    y 是基线。"""
    rng = random.Random(seed)
    out = []
    for i, (polys, gx, w) in enumerate(font(f).glyphs(text, size, tracking=tracking, step=3)):
        if not polys:
            continue
        ang = rng.uniform(-tilt, tilt)
        dy = rng.uniform(-bounce, bounce) * size
        dx = 0
        if lift and i in lift:
            dx, ddy, ang = lift[i]
            dy += ddy
        p = move(polys, x, y)
        p = rot(p, ang, x + gx + w / 2, y - size * 0.36)
        p = move(p, dx, dy)
        if cut:
            lo, hi = max(3, min(12, size * 0.035)), max(6, min(26, size * 0.085))
            p = rough(p, seed * 100 + i, lo=lo, hi=hi, jitter=min(1.4, size * 0.01))
        out.append((p, i))
    return out


def measure(text, size, f='anton', tracking=0.0):
    polys, w = font(f).polys(text, size, tracking=tracking, step=6)
    x0, y0, x1, y1 = bbox(polys)
    return x1 - x0, y0, y1, x0


def fit(text, width, f='anton', tracking=0.0):
    """给一个目标宽度，算字号。"""
    w, *_ = measure(text, 100, f, tracking)
    return 100 * width / w


# ---------------------------------------------------------------- SVG
class Sheet:
    """收集用到的影子滤镜；h 相同的纸片共用一个滤镜。"""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.heights = set()

    def shadow_id(self, h):
        h = int(round(h))
        self.heights.add(h)
        return f'h{h}'

    def piece(self, polys, fill, h=4, extra='', rule='nonzero'):
        """一张纸片。h = 离桌面多高（px）。"""
        flt = f' filter="url(#{self.shadow_id(h)})"' if h > 0 else ''
        return f'<path d="{path_d(polys)}" fill="{fill}" fill-rule="{rule}"{flt} {extra}/>'

    def defs(self, extra=''):
        f = []
        for h in sorted(self.heights):
            op = max(0.2, 0.4 - h * 0.004)
            f.append(f'<filter id="h{h}" x="-30%" y="-30%" width="170%" height="170%">'
                     f'<feDropShadow dx="{0.5 * h:.1f}" dy="{h:.1f}" stdDeviation="{0.4 * h:.1f}" '
                     f'flood-color="#2A1205" flood-opacity="{op:.2f}"/></filter>')
        return (
            '<filter id="grain" x="0" y="0" width="100%" height="100%">'
            '<feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="2" seed="4"/>'
            '<feColorMatrix values="0 0 0 0 .1  0 0 0 0 .08  0 0 0 0 .05  0 0 0 .55 0"/></filter>'
            '<filter id="fiber" x="0" y="0" width="100%" height="100%">'
            '<feTurbulence type="fractalNoise" baseFrequency=".011 .07" numOctaves="2" seed="9"/>'
            '<feColorMatrix values="0 0 0 0 .2  0 0 0 0 .14  0 0 0 0 .06  0 0 0 .5 -.12"/></filter>'
            + ''.join(f) + extra
        )

    def texture(self, op=1.0):
        return (f'<rect width="{self.w}" height="{self.h}" filter="url(#fiber)" opacity="{0.16 * op:.2f}" style="mix-blend-mode:multiply"/>'
                f'<rect width="{self.w}" height="{self.h}" filter="url(#grain)" opacity="{0.14 * op:.2f}" style="mix-blend-mode:multiply"/>')

    def doc(self, body, extra_defs=''):
        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" '
            f'viewBox="0 0 {self.w} {self.h}" role="img">\n'
            f'  <defs>\n    {self.defs(extra_defs)}\n  </defs>\n{body}\n</svg>\n'
        )


def esc(s):
    from xml.sax.saxutils import escape
    return escape(s)


def t(x, y, size, text, family=JOST, weight=500, fill=INK, ls='0', anchor='start', extra=''):
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{family}" font-weight="{weight}" font-size="{size}" '
            f'fill="{fill}" letter-spacing="{ls}" text-anchor="{anchor}" {extra}>{esc(text)}</text>')


def overprint(sh, under, under_fill, over, over_fill, cid, h=4):
    """叠印：先画 under，再画 over；两者重叠的部分用 multiply(under_fill, over_fill) 再盖一层（没有影子）。
    返回 SVG。cid 是这对叠印的唯一 id。"""
    mix = multiply(under_fill, over_fill)
    return (sh.piece(under, under_fill, h) + sh.piece(over, over_fill, h)
            + f'<clipPath id="{cid}"><path d="{path_d(under)}"/></clipPath>'
            + f'<path d="{path_d(over)}" fill="{mix}" clip-path="url(#{cid})"/>')
