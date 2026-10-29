"""极简三角面渲染器：把 3D 网格画成 SVG 多边形（平涂、按面打光），给低多边形 / 体素 / 等距微缩用。

不用 WebGL：每个三角面算一次朝向 → 兰伯特光 + 天光 + 雾，再按深度从远到近画（画家算法）。
低多边形本来就是“一个面一个颜色”，所以这样画就是它的正确样子，云端 CPU 也很快。
"""
import math
import random


def v_add(a, b): return (a[0] + b[0], a[1] + b[1], a[2] + b[2])
def v_sub(a, b): return (a[0] - b[0], a[1] - b[1], a[2] - b[2])
def v_mul(a, k): return (a[0] * k, a[1] * k, a[2] * k)
def dot(a, b): return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
def cross(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def norm(a):
    L = math.sqrt(dot(a, a)) or 1
    return (a[0] / L, a[1] / L, a[2] / L)


def hex2rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def rgb2hex(c):
    return '#' + ''.join(f'{max(0, min(255, round(x * 255))):02x}' for x in c)


def mix(a, b, t):
    return tuple(a[i] * (1 - t) + b[i] * t for i in range(3))


class Scene:
    def __init__(self):
        self.faces = []   # (点, rgb, 自发光, 图层)
        self.layer = 1    # 图层小的先画：房间外壳 0、地毯 1、家具 2……画家算法排不对时用它兜底

    def tri(self, a, b, c, col, emit=0.0):
        self.faces.append(([a, b, c], hex2rgb(col) if isinstance(col, str) else col, emit, self.layer))

    def quad(self, a, b, c, d, col, emit=0.0):
        self.faces.append(([a, b, c, d], hex2rgb(col) if isinstance(col, str) else col, emit, self.layer))

    # ---------- 基本体 ----------
    def box(self, x, y, z, w, d, h, col, top=None, emit=0.0):
        """y 向上。x/z 是底面角点。"""
        p = [(x, y, z), (x + w, y, z), (x + w, y, z + d), (x, y, z + d)]
        q = [(a, y + h, c) for a, _, c in p]
        self.quad(q[0], q[3], q[2], q[1], top or col, emit)            # 顶（法线朝上）
        self.quad(p[0], p[1], p[2], p[3], col, emit)                    # 底
        for i in range(4):
            j = (i + 1) % 4
            self.quad(p[i], q[i], q[j], p[j], col, emit)                # 侧面（法线朝外）

    def prism_roof(self, x, y, z, w, d, h, col, overhang=0.15):
        """双坡屋顶，屋脊沿 x 方向。"""
        o = overhang
        a, b = (x - o, y, z - o), (x + w + o, y, z - o)
        c, e = (x + w + o, y, z + d + o), (x - o, y, z + d + o)
        r1, r2 = (x - o, y + h, z + d / 2), (x + w + o, y + h, z + d / 2)
        self.quad(a, r1, r2, b, col)
        self.quad(e, c, r2, r1, col)
        self.tri(a, e, r1, col)
        self.tri(b, r2, c, col)

    def cone(self, cx, y, cz, r, h, col, n=7, rot=0.0):
        base = [(cx + r * math.cos(rot + i / n * math.tau), y, cz + r * math.sin(rot + i / n * math.tau)) for i in range(n)]
        tip = (cx, y + h, cz)
        for i in range(n):
            self.tri(base[i], tip, base[(i + 1) % n], col)

    def ico(self, cx, cy, cz, r, col, jitter=0.12, seed=0, sy=1.0, emit=0.0):
        """二十面体（低多边形的“球”），顶点随机抖一点更像手做。"""
        rng = random.Random(seed)
        t = (1 + 5 ** 0.5) / 2
        V = [(-1, t, 0), (1, t, 0), (-1, -t, 0), (1, -t, 0), (0, -1, t), (0, 1, t), (0, -1, -t), (0, 1, -t), (t, 0, -1), (t, 0, 1), (-t, 0, -1), (-t, 0, 1)]
        F = [(0, 11, 5), (0, 5, 1), (0, 1, 7), (0, 7, 10), (0, 10, 11), (1, 5, 9), (5, 11, 4), (11, 10, 2), (10, 7, 6), (7, 1, 8),
             (3, 9, 4), (3, 4, 2), (3, 2, 6), (3, 6, 8), (3, 8, 9), (4, 9, 5), (2, 4, 11), (6, 2, 10), (8, 6, 7), (9, 8, 1)]
        P = []
        for v in V:
            v = norm(v)
            k = 1 + rng.uniform(-jitter, jitter)
            P.append((cx + v[0] * r * k, cy + v[1] * r * k * sy, cz + v[2] * r * k))
        for a, b, c in F:
            self.tri(P[a], P[b], P[c], col, emit)

    def terrain(self, x0, z0, w, d, nx, nz, hfun, cfun, seed=0, jitter=0.35):
        """高度图三角化。hfun(x, z) -> y；cfun(x, y, z) -> 颜色。格点抖动后切成三角。"""
        rng = random.Random(seed)
        G = {}
        for i in range(nx + 1):
            for j in range(nz + 1):
                x = x0 + w * i / nx + (rng.uniform(-jitter, jitter) * w / nx if 0 < i < nx else 0)
                z = z0 + d * j / nz + (rng.uniform(-jitter, jitter) * d / nz if 0 < j < nz else 0)
                G[i, j] = (x, hfun(x, z), z)
        for i in range(nx):
            for j in range(nz):
                a, b, c, e = G[i, j], G[i + 1, j], G[i + 1, j + 1], G[i, j + 1]
                for t in ((a, e, b), (b, e, c)) if (i + j) % 2 else ((a, e, c), (a, c, b)):
                    cy = sum(p[1] for p in t) / 3
                    cxx = sum(p[0] for p in t) / 3
                    czz = sum(p[2] for p in t) / 3
                    self.tri(*t, cfun(cxx, cy, czz))


class Camera:
    def __init__(self, eye, target, fov=40, W=1920, H=1080, ortho=None, up=(0, 1, 0)):
        self.eye, self.W, self.H, self.ortho = eye, W, H, ortho
        self.f = norm(v_sub(target, eye))
        self.r = norm(cross(up, self.f))
        self.u = cross(self.f, self.r)
        self.k = (H / 2) / math.tan(math.radians(fov) / 2)

    def view(self, p):
        q = v_sub(p, self.eye)
        return dot(q, self.r), dot(q, self.u), dot(q, self.f)

    def proj(self, p):
        x, y, z = self.view(p)
        if self.ortho:
            s = self.H / self.ortho
            return self.W / 2 + x * s, self.H / 2 - y * s, z
        z = max(z, 0.01)
        return self.W / 2 + x * self.k / z, self.H / 2 - y * self.k / z, z


def render(scene, cam, light=(-0.5, 0.85, -0.35), sun='#FFF3DC', sky='#BFD8FF', ground='#6B5A4A',
           amb=0.42, fog=None, fog_near=40, fog_far=160, seam=0.6, cull=True):
    """返回 SVG 片段。fog = (颜色, 近, 远) 让远处的面渐渐融进天色。"""
    L = norm(light)
    sunc, skyc, grc = hex2rgb(sun), hex2rgb(sky), hex2rgb(ground)
    out = []
    for pts, col, emit, layer in scene.faces:
        n = norm(cross(v_sub(pts[1], pts[0]), v_sub(pts[2], pts[0])))
        c = v_mul(v_add(v_add(pts[0], pts[1]), pts[2]), 1 / 3)
        to_cam = v_sub(cam.eye, c) if not cam.ortho else v_mul(cam.f, -1)
        if dot(n, to_cam) < 0:
            if cull:
                continue
            n = v_mul(n, -1)
        lam = max(0.0, dot(n, L))
        hemi = 0.5 + 0.5 * n[1]
        amb_c = mix(grc, skyc, hemi)
        lit = tuple(col[i] * (amb * amb_c[i] * 1.6 + lam * sunc[i] * (1 - amb) * 1.15) for i in range(3))
        if emit:
            lit = mix(lit, col, emit)
        P = [cam.proj(p) for p in pts]
        depth = sum(p[2] for p in P) / len(P)
        if fog and not emit:
            t = max(0.0, min(1.0, (depth - fog[1]) / (fog[2] - fog[1])))
            lit = mix(lit, hex2rgb(fog[0]), t)
        hx = rgb2hex(lit)
        d = 'M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y, _ in P) + 'Z'
        out.append((layer, -depth, f'<path d="{d}" fill="{hx}" stroke="{hx}" stroke-width="{seam}" stroke-linejoin="round"/>'))
    out.sort(key=lambda t: (t[0], t[1]))
    return ''.join(s for _, _, s in out)


class Voxels:
    """体素：只画露在外面的面（相邻有方块的面不画），一格 = 1。"""
    def __init__(self):
        self.v = {}

    def set(self, x, y, z, col, emit=0.0):
        self.v[(x, y, z)] = (col, emit)

    def fill(self, x0, y0, z0, x1, y1, z1, col):
        for x in range(x0, x1):
            for y in range(y0, y1):
                for z in range(z0, z1):
                    self.set(x, y, z, col if not callable(col) else col(x, y, z))

    def to_scene(self, S, s=1.0, off=(0, 0, 0)):
        dirs = [((1, 0, 0), [(1, 0, 0), (1, 1, 0), (1, 1, 1), (1, 0, 1)]), ((-1, 0, 0), [(0, 0, 0), (0, 0, 1), (0, 1, 1), (0, 1, 0)]),
                ((0, 1, 0), [(0, 1, 0), (0, 1, 1), (1, 1, 1), (1, 1, 0)]), ((0, -1, 0), [(0, 0, 0), (1, 0, 0), (1, 0, 1), (0, 0, 1)]),
                ((0, 0, 1), [(0, 0, 1), (1, 0, 1), (1, 1, 1), (0, 1, 1)]), ((0, 0, -1), [(0, 0, 0), (0, 1, 0), (1, 1, 0), (1, 0, 0)])]
        for (x, y, z), (col, emit) in self.v.items():
            for (dx, dy, dz), corners in dirs:
                if (x + dx, y + dy, z + dz) in self.v:
                    continue
                pts = [(off[0] + (x + a) * s, off[1] + (y + b) * s, off[2] + (z + c) * s) for a, b, c in corners]
                S.quad(*pts, col, emit)
