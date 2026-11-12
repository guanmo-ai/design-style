"""浮世绘的零件：和纸纹理、套色用的浪（色版和墨版分开画）、见当（套色对位记号）。
套色 = 同一组形状，色版只填色、墨版只描线；印到第几版就叠到第几层。"""
import math
import sys
sys.path.insert(0, '../art-nouveau')
from vine import curve, ribbon

PAPER, SUMI, AI, AI_D, AI_L, AI_P = '#EEE3C8', '#1E1B18', '#24497A', '#162F52', '#6F96BA', '#B9CEDB'
BENI, KI, USUBENI, FOAM = '#B5402F', '#D9A441', '#E6B9A2', '#F5EFDF'


def catmull(pts, closed=False):
    """过点的光滑曲线（Catmull-Rom → 三次贝塞尔）。"""
    P = pts + pts[:2] if closed else [pts[0]] + pts + [pts[-1]]
    d = f'M{P[1][0]:.1f},{P[1][1]:.1f}' if closed else f'M{pts[0][0]:.1f},{pts[0][1]:.1f}'
    rng = range(1, len(P) - 2) if not closed else range(1, len(pts) + 1)
    for i in rng:
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[(i + 2) % len(P)]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f' C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}'
    return d + ('Z' if closed else '')


def sample(pts, n=200):
    """沿 Catmull-Rom 曲线均匀取点（带方向）。"""
    P = [pts[0]] + pts + [pts[-1]]
    raw = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(20):
            t = k / 20
            t2, t3 = t * t, t * t * t
            raw.append(tuple(.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) for j in (0, 1)))
    raw.append(pts[-1])
    acc = [0]
    for a, b in zip(raw, raw[1:]):
        acc.append(acc[-1] + math.dist(a, b))
    out, j = [], 0
    for k in range(n + 1):
        s = acc[-1] * k / n
        while j < len(acc) - 2 and acc[j + 1] < s:
            j += 1
        f = (s - acc[j]) / max(1e-9, acc[j + 1] - acc[j])
        x = raw[j][0] + (raw[j + 1][0] - raw[j][0]) * f
        y = raw[j][1] + (raw[j + 1][1] - raw[j][1]) * f
        th = math.atan2(raw[j + 1][1] - raw[j][1], raw[j + 1][0] - raw[j][0])
        out.append((x, y, th))
    return out


def claw(x, y, th, L, w, side=1, curl=6.0):
    """浪头的“爪”：沿法线伸出去，梢头往前卷。"""
    pts = curve(x, y, math.degrees(th) - 90 * side + 25 * side, L, lambda u: side * curl * u ** 2 / L * 2, n=40)
    return ribbon(pts, w, 1.5, 1, .9)


def washi(id_='washi', seed=7):
    return (f'<filter id="{id_}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012 .9" numOctaves="2" seed="{seed}"/>'
            f'<feColorMatrix values="0 0 0 0 .55  0 0 0 0 .45  0 0 0 0 .3  0 0 0 .16 0"/></filter>'
            f'<filter id="{id_}2" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" seed="{seed + 1}"/>'
            f'<feColorMatrix values="0 0 0 0 .4  0 0 0 0 .3  0 0 0 0 .2  0 0 0 .12 0"/></filter>'
            # 木纹：印出来的大色块里带着的板木纹理
            f'<filter id="{id_}g"><feTurbulence type="fractalNoise" baseFrequency=".004 .09" numOctaves="3" seed="{seed + 2}"/>'
            f'<feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .22 -.04"/><feComposite in2="SourceGraphic" operator="in"/></filter>')


def kento(x, y, s=60, col=SUMI):
    """见当：纸角的 L 形对位记号。"""
    return f'<path d="M{x},{y - s} L{x},{y} L{x + s * 1.6},{y}" fill="none" stroke="{col}" stroke-width="3" opacity=".55"/>'
