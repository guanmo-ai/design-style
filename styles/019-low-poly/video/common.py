"""019 低多边形 · 共用：调色、缓动、翻牌（三角形从纸翻成颜色）、纸云盖屏、SVG defs。"""
import math

W, H, FPS = 1920, 1080, 30
PAPER, BG = '#FBF4E6', '#F6EEDD'
RED, YEL, BLUE, GRN, LGRN, INK, WHITE, SKY = '#EE6B57', '#F4C54F', '#2F5FD8', '#4DAF72', '#9ED7A8', '#3B3552', '#FFFDF7', '#8CC8EE'
PINK, LILAC, MINT, PERI = '#F49DB6', '#C9A6EC', '#A9DDB4', '#8F9DEA'
SEA = '#7DB8E8'
SHADE = '#7A5C86'                                              # 暖紫阴影：暗面往这里混，不发灰


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease_out_back(e, s=1.2):          # 过冲约 5%
    e -= 1
    return 1 + (s + 1) * e ** 3 + s * e ** 2


def ease_in_out(e):
    return e * e * (3 - 2 * e)


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


def unfold(S, TRIS, t, cam, creases, dur=0.5, flat_y=0.0, refold=None):
    """签名动作“翻牌”：每个三角形原地跳起来转一整圈，前半圈是纸，转回来是颜色，落到最终高度（过冲约 5%）。
    TRIS = [(三个顶点, 铰链边, 开始时间, 颜色)]"""
    for (tri, hinge, delay, col) in TRIS:
        e = clamp((t - delay) / dur)
        if refold is not None:                    # 结尾：反过来翻回一张纸（由远到近）
            rt, rdelay = refold
            e = min(e, 1 - clamp((rt - rdelay(tri)) / dur))
        if e >= 1:
            S.tri(tri[0], tri[1], tri[2], col, back=PAPER)
            continue
        flat = [(p[0], flat_y, p[2]) for p in tri]
        if e <= 0:
            creases.append([cam.proj(p) for p in flat])
            S.tri(*flat, PAPER)
            continue
        k = ease_out_back(e, 1.0)
        lifted = [(p[0], flat_y + (p[1] - flat_y) * k, p[2]) for p in tri]
        c0 = tuple(sum(p[i] for p in lifted) / 3 for i in range(3))
        hop = math.sin(math.pi * min(1, e * 1.15)) * 1.6
        c1 = (c0[0], c0[1] + hop, c0[2])
        a_, b_ = tri[hinge[0]], tri[hinge[1]]
        axis_end = (c1[0] + b_[0] - a_[0], c1[1], c1[2] + b_[2] - a_[2])
        pts = [rotate_about((p[0], p[1] + hop, p[2]), c1, axis_end, math.tau * min(1.0, k)) for p in lifted]
        S.tri(pts[0], pts[1], pts[2], col if k > 0.5 else PAPER, back='#EFDFC4')


def crease_svg(creases):
    return ''.join('<path d="M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y, _ in P) + 'Z" fill="none" stroke="#E9D9BC" stroke-width="1.6"/>' for P in creases)


def paper_cloud(e, sx, sy):
    """纸云盖屏：一团团低多边形的奶油色云从 (sx, sy) 喷出来，e=1 时铺满整屏（= 下一章开头的那张纸）。"""
    over = ''
    if e <= 0:
        return over
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
    return over


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


def slam_tris(S, TRIS, t, dur=0.42, height=14.0):
    """第 2 章的签名动作“砸”：每个三角形带着颜色从天上翻滚着掉下来，落地往下压一点再弹回。
    TRIS = [(三个顶点, 开始时间, 颜色)]"""
    for (tri, delay, col) in TRIS:
        e = clamp((t - delay) / dur)
        if e <= 0:
            continue
        if e >= 1:
            S.tri(tri[0], tri[1], tri[2], col, back=PAPER)
            continue
        land = 0.62
        c = tuple(sum(p[i] for p in tri) / 3 for i in range(3))
        if e < land:
            k = e / land
            dy = height * (1 - k * k)
            ang = (1 - k) * 2.4
            pts = [rotate_about((p[0], p[1] + dy, p[2]), (c[0], c[1] + dy, c[2]), (c[0] + 1, c[1] + dy, c[2] + 0.6), ang) for p in tri]
        else:
            k = (e - land) / (1 - land)
            dy = -0.45 * math.sin(math.pi * k) * (1 - k)
            sc = 1 + 0.08 * math.sin(math.pi * k) * (1 - k)
            pts = [(c[0] + (p[0] - c[0]) * sc, p[1] + dy, c[2] + (p[2] - c[2]) * sc) for p in tri]
        S.tri(pts[0], pts[1], pts[2], col, back=PAPER)
