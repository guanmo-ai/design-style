"""新艺术运动的“鞭线”：曲率沿着弧长变化的曲线（回旋线），粗细从根到梢收细，末端卷成涡。
长出来 = 只画前 grow 那一段；每帧是 grow 的纯函数。"""
import math

INK, CREAM, PAPER = '#2E2A1F', '#EFE6CF', '#F5EEDC'
SAGE, OLIVE, GOLD, PLUM, ROSE, TEAL = '#7F8F5E', '#4E5A34', '#C49A4A', '#6B3A4A', '#D9A39A', '#4F7A72'


def curve(x, y, ang, L, kappa, n=240):
    """从 (x,y) 以方向 ang(度) 出发，曲率 kappa(u)（u=0..1，单位 1/px）。返回点列和方向。"""
    pts, th, ds = [(x, y, math.radians(ang))], math.radians(ang), L / n
    for i in range(n):
        th += kappa((i + .5) / n) * ds
        x += math.cos(th) * ds
        y += math.sin(th) * ds
        pts.append((x, y, th))
    return pts


def whip(L, a=-.6, b=4.5, p=3.0, sign=1):
    """鞭线：先往一边缓弯，过零点，再往另一边越卷越紧。"""
    return lambda u: sign * (a + b * u ** p) / L * 2


def ribbon(pts, w0, w1=1.2, grow=1.0, taper=.8):
    """沿点列画一条收细的带子，返回 SVG path d。"""
    m = max(2, int(len(pts) * grow))
    P = pts[:m]
    L, R = [], []
    for i, (x, y, th) in enumerate(P):
        u = i / (len(pts) - 1)
        w = w1 + (w0 - w1) * (1 - u) ** taper
        nx, ny = -math.sin(th), math.cos(th)
        L.append((x + nx * w / 2, y + ny * w / 2))
        R.append((x - nx * w / 2, y - ny * w / 2))
    ring = L + R[::-1]
    return 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in ring) + 'Z'


def tip(pts, grow=1.0):
    x, y, th = pts[max(1, int(len(pts) * grow)) - 1]
    return x, y, th


def leaf(x, y, ang, s, fill, stroke=INK, sw=2.5, bend=.35):
    """柳叶：两段弧，略弯。"""
    a = math.radians(ang)
    ex, ey = x + math.cos(a) * s, y + math.sin(a) * s
    nx, ny = -math.sin(a), math.cos(a)
    c1 = (x + math.cos(a) * s * .3 + nx * s * bend, y + math.sin(a) * s * .3 + ny * s * bend)
    c2 = (x + math.cos(a) * s * .7 - nx * s * bend * .45, y + math.sin(a) * s * .7 - ny * s * bend * .45)
    c3 = (x + math.cos(a) * s * .6 + nx * s * bend * .05, y + math.sin(a) * s * .6 + ny * s * bend * .05)
    return (f'<path d="M{x:.1f},{y:.1f} C{c1[0]:.1f},{c1[1]:.1f} {ex - math.cos(a) * s * .15 + nx * s * .12:.1f},{ey - math.sin(a) * s * .15 + ny * s * .12:.1f} {ex:.1f},{ey:.1f} '
            f'C{c2[0]:.1f},{c2[1]:.1f} {c3[0] - nx * s * .25:.1f},{c3[1] - ny * s * .25:.1f} {x:.1f},{y:.1f}Z" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"/>'
            f'<path d="M{x:.1f},{y:.1f} Q{c1[0] * .5 + c3[0] * .5:.1f},{c1[1] * .5 + c3[1] * .5:.1f} {ex:.1f},{ey:.1f}" fill="none" stroke="{stroke}" stroke-width="{sw * .6}" opacity=".6"/>')


def lily(x, y, ang, s, fill=CREAM, inner=GOLD, stroke=INK):
    """百合 / 鸢尾：五片尖瓣从一点张开，中间两根蕊。"""
    out = []
    for k, (da, ls) in enumerate([(-62, .8), (-30, 1.0), (0, 1.1), (30, 1.0), (62, .8)]):
        a = math.radians(ang + da)
        ex, ey = x + math.cos(a) * s * ls, y + math.sin(a) * s * ls
        nx, ny = -math.sin(a), math.cos(a)
        bw = s * .26
        mx, my = x + math.cos(a) * s * ls * .5, y + math.sin(a) * s * ls * .5
        # 瓣尖往外翻一点
        out.append(f'<path d="M{x:.1f},{y:.1f} Q{mx + nx * bw:.1f},{my + ny * bw:.1f} {ex:.1f},{ey:.1f} Q{mx - nx * bw:.1f},{my - ny * bw:.1f} {x:.1f},{y:.1f}Z" '
                   f'fill="{fill}" stroke="{stroke}" stroke-width="3" stroke-linejoin="round"/>')
        out.append(f'<path d="M{x:.1f},{y:.1f} L{x + math.cos(a) * s * ls * .7:.1f},{y + math.sin(a) * s * ls * .7:.1f}" stroke="{inner}" stroke-width="3" stroke-linecap="round"/>')
    for da in (-10, 12):
        a = math.radians(ang + da)
        ex, ey = x + math.cos(a) * s * .75, y + math.sin(a) * s * .75
        out.append(f'<path d="M{x:.1f},{y:.1f} L{ex:.1f},{ey:.1f}" stroke="{stroke}" stroke-width="2.5"/><circle cx="{ex:.1f}" cy="{ey:.1f}" r="6" fill="{PLUM}" stroke="{stroke}" stroke-width="2"/>')
    return ''.join(out)
