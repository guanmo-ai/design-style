"""把字转成多边形轮廓，方便做变形（灌进形状、手剪毛边）后输出成 SVG path。

用法：
    from glyphs import Font, path_d
    f = Font('Anton-Regular.ttf')            # 在 public/fonts/ 下找
    polys, adv = f.polys('TEXT', size=200)   # 基线在 y=0，y 朝下
    d = path_d(polys)                        # 'M..L..Z'
"""
import math
import os

from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont

FONTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'public', 'fonts')


class _FlatPen(BasePen):
    def __init__(self, glyphset, step):
        super().__init__(glyphset)
        self.step, self.contours, self.cur = step, [], None

    def _moveTo(self, p):
        self.cur = [p]

    def _lineTo(self, p):
        self.cur.append(p)

    def _curveToOne(self, a, b, c):
        p0 = self.cur[-1]
        n = max(2, int(math.dist(p0, c) / self.step) + 2)
        for i in range(1, n + 1):
            t = i / n
            mt = 1 - t
            self.cur.append((mt**3 * p0[0] + 3 * mt * mt * t * a[0] + 3 * mt * t * t * b[0] + t**3 * c[0],
                             mt**3 * p0[1] + 3 * mt * mt * t * a[1] + 3 * mt * t * t * b[1] + t**3 * c[1]))

    def _qCurveToOne(self, a, b):
        p0 = self.cur[-1]
        n = max(2, int(math.dist(p0, b) / self.step) + 2)
        for i in range(1, n + 1):
            t = i / n
            mt = 1 - t
            self.cur.append((mt * mt * p0[0] + 2 * mt * t * a[0] + t * t * b[0],
                             mt * mt * p0[1] + 2 * mt * t * a[1] + t * t * b[1]))

    def _closePath(self):
        if self.cur and len(self.cur) > 2:
            self.contours.append(self.cur)
        self.cur = None

    _endPath = _closePath


class Font:
    def __init__(self, file, axes=None):
        font = TTFont(os.path.join(FONTS, file))
        if axes and 'fvar' in font:
            from fontTools.varLib.instancer import instantiateVariableFont
            font = instantiateVariableFont(font, axes)
        self.font = font
        self.upm = font['head'].unitsPerEm
        self.gs = font.getGlyphSet()
        self.cmap = font.getBestCmap()
        self.hmtx = font['hmtx']

    def polys(self, text, size, tracking=0.0, step=6.0):
        """返回 (轮廓列表, 总宽)。tracking 以 em 为单位。step 是曲线细分的大约像素长度。"""
        s = size / self.upm
        x, out = 0.0, []
        for ch in text:
            g = self.cmap.get(ord(ch))
            if g is None:
                x += size * 0.3
                continue
            pen = _FlatPen(self.gs, step / s)
            self.gs[g].draw(pen)
            for c in pen.contours:
                out.append([(x + px * s, -py * s) for px, py in c])
            x += self.hmtx[g][0] * s + tracking * size
        return out, x - tracking * size

    def glyphs(self, text, size, tracking=0.0, step=6.0):
        """逐字返回 [(轮廓列表, x0, 字宽)]，用于给每个字单独加旋转 / 位移。"""
        s = size / self.upm
        x, out = 0.0, []
        for ch in text:
            g = self.cmap.get(ord(ch))
            if g is None:
                x += size * 0.3
                continue
            pen = _FlatPen(self.gs, step / s)
            self.gs[g].draw(pen)
            w = self.hmtx[g][0] * s
            out.append(([[(x + px * s, -py * s) for px, py in c] for c in pen.contours], x, w))
            x += w + tracking * size
        return out


def subdivide(poly, maxlen):
    """把长直线段切短，变形后才会弯。"""
    out = []
    n = len(poly)
    for i in range(n):
        a, b = poly[i], poly[(i + 1) % n]
        k = max(1, int(math.dist(a, b) / maxlen))
        for j in range(k):
            t = j / k
            out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    return out


def bbox(polys):
    xs = [p[0] for c in polys for p in c]
    ys = [p[1] for c in polys for p in c]
    return min(xs), min(ys), max(xs), max(ys)


def path_d(polys, nd=1):
    parts = []
    for c in polys:
        parts.append('M' + 'L'.join(f'{x:.{nd}f},{y:.{nd}f}' for x, y in c) + 'Z')
    return ''.join(parts)
