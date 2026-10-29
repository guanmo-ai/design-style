"""City Pop 的画面零件：永井博 / 铃木英人式的平涂风景——深蓝渐变天、平底白云、锐利的阴影、棕榈剪影、泳池波光。"""
import math
import random

SKY0, SKY1, SKY2 = '#0A4FD0', '#3FA4FF', '#BFE8FF'
POOL0, POOL1 = '#12B5D6', '#0A7FB8'
PINK, ORANGE, SUN, WHITE, PALM = '#FF6FA8', '#FF9A4D', '#FFE06B', '#FFFFFF', '#0B3B44'


def cloud(x, y, s, fill=WHITE):
    """平底积云：几团圆叠起来，底边一刀切平。"""
    bumps = [(0, 0, 1), (0.9, -0.35, 1.25), (1.9, -0.1, 1.05), (2.7, 0.15, 0.8), (-0.8, 0.2, 0.75)]
    cid = f'cl{int(x)}{int(y)}'
    circ = ''.join(f'<circle cx="{x + a * s * 50:.0f}" cy="{y + b * s * 50:.0f}" r="{r * s * 50:.0f}"/>' for a, b, r in bumps)
    return (f'<clipPath id="{cid}"><rect x="{x - 200 * s}" y="{y - 200 * s}" width="{500 * s}" height="{200 * s + s * 30}"/></clipPath>'
            f'<g clip-path="url(#{cid})" fill="{fill}">{circ}</g>'
            f'<g clip-path="url(#{cid})" fill="#D6EEFF">' + ''.join(f'<circle cx="{x + a * s * 50:.0f}" cy="{y + b * s * 50 + r * s * 18:.0f}" r="{r * s * 44:.0f}" opacity=".0"/>' for a, b, r in bumps) + '</g>')


def palm(x, y, h, lean=0.15, fronds=9, color=PALM, seed=1):
    """y 是树根；树干向一侧弯，顶上一圈下垂的叶子。"""
    rng = random.Random(seed)
    tx, ty = x + lean * h, y - h
    trunk = (f'<path d="M{x - 14},{y} Q{x + lean * h * 0.2 - 10},{y - h * 0.55} {tx - 6},{ty} '
             f'L{tx + 6},{ty} Q{x + lean * h * 0.2 + 12},{y - h * 0.55} {x + 14},{y}Z" fill="{color}"/>')
    leaves = []
    for i in range(fronds):
        a = -math.pi + (i + 0.5) * math.pi / fronds * 1.0 + rng.uniform(-0.12, 0.12)
        L = h * rng.uniform(0.38, 0.5)
        ex, ey = tx + math.cos(a) * L, ty + math.sin(a) * L * 0.55 + L * 0.42
        cx_, cy_ = tx + math.cos(a) * L * 0.55, ty + math.sin(a) * L * 0.75 - L * 0.12
        w = L * 0.13
        nx, ny = -math.sin(a), math.cos(a)
        leaves.append(f'<path d="M{tx},{ty} Q{cx_ + nx * w:.1f},{cy_ + ny * w:.1f} {ex:.1f},{ey:.1f} Q{cx_ - nx * w:.1f},{cy_ - ny * w:.1f} {tx},{ty}Z" fill="{color}"/>')
        # 叶缘的锯齿：几道细缝
        for k in range(1, 6):
            t = k / 6
            px, py = (1 - t) ** 2 * tx + 2 * (1 - t) * t * cx_ + t * t * ex, (1 - t) ** 2 * ty + 2 * (1 - t) * t * cy_ + t * t * ey
            leaves.append(f'<line x1="{px:.1f}" y1="{py:.1f}" x2="{px + nx * w * 1.3:.1f}" y2="{py + ny * w * 1.3 + 6:.1f}" stroke="{color}" stroke-width="3"/>')
    return trunk + ''.join(leaves) + f'<circle cx="{tx}" cy="{ty + 4}" r="{h * 0.03:.0f}" fill="{color}"/>'


def caustics(x, y, w, h, rows=11, seed=2, col=WHITE):
    """泳池水面：一排排不规则的白色波纹线（平涂，不是写实焦散）。"""
    rng = random.Random(seed)
    out = []
    for r in range(rows):
        yy = y + (r + 0.5) * h / rows
        persp = 0.45 + 0.55 * (r / rows)
        xx = x - rng.uniform(0, 80)
        while xx < x + w:
            L = rng.uniform(40, 130) * persp
            amp = rng.uniform(3, 7) * persp
            out.append(f'<path d="M{xx:.0f},{yy:.0f} q{L / 4:.0f},{-amp:.1f} {L / 2:.0f},0 t{L / 2:.0f},0" fill="none" stroke="{col}" stroke-width="{2.5 + 4 * persp:.1f}" stroke-linecap="round" opacity="{0.55 + 0.4 * persp:.2f}"/>')
            xx += L + rng.uniform(20, 70) * persp
    return ''.join(out)


def sparkle(x, y, s, col=WHITE):
    return f'<path d="M{x},{y - s} Q{x + s * 0.12},{y - s * 0.12} {x + s},{y} Q{x + s * 0.12},{y + s * 0.12} {x},{y + s} Q{x - s * 0.12},{y + s * 0.12} {x - s},{y} Q{x - s * 0.12},{y - s * 0.12} {x},{y - s}Z" fill="{col}"/>'


def cumulus(cx, base, w, h, seed=1):
    """高耸的积云：许多圆堆成山形，亮面白、背光面淡蓝，底边被地平线挡住。"""
    rng = random.Random(seed)
    lit, shade = [], []
    for i in range(46):
        t = rng.random()
        x = cx + (t - 0.5) * w * (1 - 0.35 * rng.random())
        top = base - h * (1 - abs(t - 0.5) * 1.6) * rng.uniform(0.55, 1)
        y = rng.uniform(top, base)
        r = rng.uniform(0.07, 0.15) * w
        lit.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.0f}"/>')
        shade.append(f'<circle cx="{x + r * 0.28:.0f}" cy="{y + r * 0.32:.0f}" r="{r * 0.92:.0f}"/>')
    return f'<g fill="#CFE4FA">{"".join(lit)}</g><g fill="#FFFFFF" transform="translate(-10,-12)">{"".join(lit)}</g><g fill="#B9D6F5" opacity=".55">{"".join(shade[::3])}</g>'


def wobble_loops(x, y, w, h, n=120, seed=3):
    """霍克尼 / 永井博式的水面高光：一圈圈歪歪的闭合细线，越近越大。"""
    rng = random.Random(seed)
    out = []
    for _ in range(n):
        t = rng.random() ** 1.3
        py = y + t * h
        s = 0.35 + t * 1.2
        px = rng.uniform(x - 40, x + w)
        L, A = rng.uniform(40, 110) * s, rng.uniform(5, 12) * s
        k = rng.uniform(-0.4, 0.4)
        d = (f'M{px:.0f},{py:.0f} c{L * 0.3:.0f},{-A:.0f} {L * 0.7:.0f},{-A * (1 + k):.0f} {L:.0f},{A * k:.0f} '
             f'c{-L * 0.2:.0f},{A * 1.2:.0f} {-L * 0.75:.0f},{A * 0.9:.0f} {-L:.0f},{-A * k:.0f}Z')
        out.append(f'<path d="{d}" fill="none" stroke="#FFFFFF" stroke-width="{1.6 + 2.6 * s:.1f}" stroke-linejoin="round" opacity="{0.55 + 0.4 * t:.2f}"/>')
    return ''.join(out)
