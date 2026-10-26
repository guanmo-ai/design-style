"""
风格 012 · 等距 Isometric —— 四张风格图（1080×1350）

  poster.svg      一张海报：锁上三轴，堆出产品小世界
  cheatsheet.svg  速查卡：30° 轴、三面明暗、五条规则
  app-ui.svg      如果等距来做 app：立体仪表盘
  variants.svg    经典 / 军事 / 产品 三种变体

全部用代码画出平行投影，不用 AI 图、不贴图。
用法：python3 styles/012-isometric/images/make_svgs.py
"""
import math
import os
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1350
STAGE, PAPER, INK = '#E8EEF4', '#F4F1EA', '#1B2430'
MUTED, CORAL, MINT, INDIGO = '#6B7380', '#E85D4C', '#1FAE9B', '#3D5C9E'
CREAM, WHITE, NAVY, GOLD = '#F1E4D0', '#FFFBFA', '#243447', '#E0B15A'
SLATE, GREEN, SKY, ROSE = '#5C6B7A', '#5BAA72', '#7EB3E0', '#E8A4A8'
FAM = "'Inter Display', 'Inter', 'Helvetica Neue', Arial, sans-serif"
MONO = "'Geist Mono', 'Inter', ui-monospace, monospace"
SC = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"
COS30, SIN30 = math.sqrt(3) / 2, 0.5


def mix(a, b, t):
    def rgb(h):
        h = h.lstrip('#')
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    A, B = rgb(a), rgb(b)
    return '#%02x%02x%02x' % tuple(round(A[i] + (B[i] - A[i]) * t) for i in range(3))


def proj(x, y, z, mode='iso'):
    if mode == 'military':
        return x - z, (x + z) * 0.5 - y
    if mode == 'product':
        ax, az = math.radians(40), math.radians(16)
        return x * math.cos(ax) - z * math.cos(az), x * math.sin(ax) + z * math.sin(az) - y
    return (x - z) * COS30, (x + z) * SIN30 - y


def scr(x, y, z, ox, oy, unit, mode='iso'):
    px, py = proj(x, y, z, mode)
    return ox + px * unit, oy + py * unit


def poly(pts, fill, stroke='rgba(27,36,48,0.16)', sw=0.8):
    d = ' '.join(f'{p[0]:.1f},{p[1]:.1f}' for p in pts)
    st = f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"' if stroke else ''
    return f'<polygon points="{d}" fill="{fill}"{st}/>'


def faces_of(x, y, z, w, h, d, color, ox, oy, unit, mode='iso', stroke=True):
    P = lambda px, py, pz: scr(px, py, pz, ox, oy, unit, mode)
    top = mix(color, '#FFFFFF', 0.18 if mode != 'product' else 0.3)
    right = mix(color, INK, 0.14 if mode != 'product' else 0.1)
    left = mix(color, INK, 0.3 if mode != 'product' else 0.34)
    st = 'rgba(27,36,48,0.16)' if stroke and mode != 'product' else 'none'
    sw = 0.7 if st != 'none' else 0
    out = []
    # painter: back-ish then sides then top
    out.append(poly([P(x + w, y, z), P(x + w, y + h, z), P(x + w, y + h, z + d), P(x + w, y, z + d)], right, st, sw))
    out.append(poly([P(x, y, z + d), P(x + w, y, z + d), P(x + w, y + h, z + d), P(x, y + h, z + d)], left, st, sw))
    out.append(poly([P(x, y + h, z), P(x + w, y + h, z), P(x + w, y + h, z + d), P(x, y + h, z + d)], top, st, sw))
    return ''.join(out)


def t(x, y, size, text, family=FAM, weight=700, fill=INK, ls='-0.03em', anchor='start', extra=''):
    return (
        f'<text x="{x:.1f}" y="{y:.1f}" font-family="{family}" font-weight="{weight}" '
        f'font-size="{size}" fill="{fill}" letter-spacing="{ls}" text-anchor="{anchor}" {extra}>'
        f'{escape(text)}</text>'
    )


HEAD = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img">
  <defs>
    <linearGradient id="air" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F7FAFC"/>
      <stop offset="100%" stop-color="{STAGE}"/>
    </linearGradient>
  </defs>
'''
FOOT = '</svg>\n'


def bg(paper=False):
    fill = PAPER if paper else 'url(#air)'
    return f'<rect width="{W}" height="{H}" fill="{fill}"/>'


def marks():
    s = []
    for x, y in ((36, 36), (W - 36, 36), (36, H - 36), (W - 36, H - 36)):
        s.append(f'<g fill="none" stroke="{INK}" stroke-width="1.2" opacity="0.28" transform="translate({x},{y})">')
        s.append('<path d="M-10 0H10M0 -10V10"/>')
        s.append('</g>')
    return ''.join(s)


def grid(ox, oy, unit, n=8, mode='iso', opacity=0.22):
    paths = []
    lim = n
    def P(x, z):
        return scr(x, 0, z, ox, oy, unit, mode)
    for i in range(-lim, lim + 1):
        a, b = P(-lim, i), P(lim, i)
        c, d = P(i, -lim), P(i, lim)
        paths.append(f'M{a[0]:.1f},{a[1]:.1f} L{b[0]:.1f},{b[1]:.1f}')
        paths.append(f'M{c[0]:.1f},{c[1]:.1f} L{d[0]:.1f},{d[1]:.1f}')
    return f'<path d="{" ".join(paths)}" fill="none" stroke="{INK}" stroke-width="1" opacity="{opacity}"/>'


def axes(ox, oy, unit, length=4.8, mode='iso'):
    O = scr(0, 0, 0, ox, oy, unit, mode)
    pts = [('X', CORAL, scr(length, 0, 0, ox, oy, unit, mode)),
           ('Y', MINT, scr(0, length, 0, ox, oy, unit, mode)),
           ('Z', INDIGO, scr(0, 0, length, ox, oy, unit, mode))]
    s = [f'<circle cx="{O[0]:.1f}" cy="{O[1]:.1f}" r="4" fill="{INK}"/>']
    for lab, col, P in pts:
        s.append(f'<line x1="{O[0]:.1f}" y1="{O[1]:.1f}" x2="{P[0]:.1f}" y2="{P[1]:.1f}" stroke="{col}" stroke-width="3" stroke-linecap="round"/>')
        s.append(t(P[0] + 8, P[1] + 5, 14, lab, MONO, 500, col, '0.1em'))
    return ''.join(s)


def mini_world(ox, oy, unit, mode='iso'):
    boxes = [
        (-4.2, 0, -3.6, 8.4, 0.32, 7.2, CREAM),
        (-3.2, 0.32, -2.6, 2.0, 0.22, 1.9, WHITE),
        (0.2, 0.32, -2.7, 2.6, 0.22, 2.0, WHITE),
        (-3.9, 0.32, -3.4, 1.4, 2.4, 1.3, SLATE),
        (2.8, 0.32, -3.3, 1.3, 1.8, 1.2, NAVY),
        (-2.8, 0.54, -2.3, 1.3, 1.1, 1.3, CORAL),
        (0.5, 0.54, -2.4, 0.28, 0.7, 0.28, CORAL),
        (0.95, 0.54, -2.4, 0.28, 1.15, 0.28, GOLD),
        (1.4, 0.54, -2.4, 0.28, 0.9, 0.28, MINT),
        (1.85, 0.54, -2.4, 0.28, 1.45, 0.28, INDIGO),
        (1.6, 0.32, 0.9, 2.0, 0.14, 1.3, NAVY),
        (1.65, 0.46, 0.9, 1.9, 1.25, 0.12, NAVY),
        (-3.6, 0.32, 1.1, 0.7, 1.3, 0.16, NAVY),
        (0.1, 0.32, 1.6, 0.45, 0.4, 0.45, CORAL),
        (0.18, 0.72, 1.68, 0.28, 0.7, 0.28, GREEN),
    ]
    return ''.join(faces_of(*b, ox, oy, unit, mode) for b in boxes)


def poster():
    ox, oy, u = 540, 780, 42
    body = [
        bg(),
        grid(ox, oy, u, 9, opacity=0.16),
        mini_world(ox, oy, u),
        axes(ox, oy, u, 5.2),
        t(540, 168, 64, 'ISOMETRIC', FAM, 700, INK, '-0.05em', 'middle'),
        t(540, 214, 22, '等距', SC, 700, MUTED, '0.22em', 'middle'),
        t(540, 268, 20, '先锁轴角，再堆体积。', SC, 700, INK, '0.04em', 'middle'),
        t(90, 1288, 13, '012  ·  30° / 30°  ·  1:1:1  ·  NO PERSPECTIVE', MONO, 500, MUTED, '0.1em'),
        t(990, 1288, 13, '@guanmo_ai', MONO, 500, MUTED, '0.08em', 'end'),
        marks(),
    ]
    return HEAD + ''.join(body) + FOOT


def cheatsheet():
    ox, oy, u = 780, 430, 48
    rules = [
        ('01', '锁轴角', '先定 30°/30°（或选定的一对轴），再画任何体积。'),
        ('02', '等比例', '三轴同一单位。不要偷偷拉长某一边来“更 3D”。'),
        ('03', '无透视', '平行线保持平行。远处的面和近处一样大。'),
        ('04', '三面三值', '顶亮、一侧中、一侧暗。光从固定方向来。'),
        ('05', '叠压做深度', '前后靠遮挡和层次，不靠灭点。'),
    ]
    body = [
        bg(True),
        t(90, 130, 44, 'ISO', FAM, 700, INK, '-0.04em'),
        t(90, 172, 20, '速查 · 先锁轴，再堆体积', SC, 700, MUTED, '0.06em'),
        grid(ox, oy, u, 5, opacity=0.14),
        axes(ox, oy, u, 3.6),
        faces_of(-0.7, 0, -0.7, 1.4, 1.4, 1.4, CORAL, ox, oy, u),
        t(90, 250, 14, 'X  30°  宽', MONO, 500, CORAL, '0.12em'),
        t(90, 278, 14, 'Y  UP   高', MONO, 500, MINT, '0.12em'),
        t(90, 306, 14, 'Z  30°  深', MONO, 500, INDIGO, '0.12em'),
        t(90, 350, 14, 'TOP LIGHT  ·  SIDE MID  ·  SIDE DARK', MONO, 500, MUTED, '0.08em'),
    ]
    for i, (n, title, desc) in enumerate(rules):
        y = 560 + i * 130
        col = [CORAL, MINT, INDIGO, GOLD, SLATE][i]
        body.append(f'<rect x="90" y="{y - 28}" width="10" height="10" fill="{col}" transform="rotate(45 {95} {y - 23})"/>')
        body.append(t(120, y - 8, 16, n, MONO, 500, col, '0.14em'))
        body.append(t(200, y - 8, 26, title, SC, 900, INK, '0.04em'))
        body.append(t(200, y + 28, 16, desc, SC, 500, MUTED, '0.02em'))
    body.append(t(90, 1288, 13, '012 · ISOMETRIC  ·  DO：锁轴等比例   DON’T：灭点近大远小', MONO, 400, MUTED, '0.06em'))
    body.append(marks())
    return HEAD + ''.join(body) + FOOT


def app_ui():
    ox, oy, u = 540, 820, 38
    body = [
        bg(),
        t(90, 140, 32, 'PULSE', FAM, 700, INK, '-0.04em'),
        t(90, 178, 16, '如果等距来做 App  ·  立体仪表盘', SC, 700, MUTED, '0.06em'),
        grid(ox, oy, u, 8, opacity=0.14),
        mini_world(ox, oy, u),
        faces_of(-6.8, 3.2, 1.2, 2.6, 0.12, 1.8, WHITE, ox, oy, u),
        faces_of(4.2, 2.8, -1.4, 2.4, 0.12, 1.6, WHITE, ox, oy, u),
        t(90, 230, 14, 'REVENUE   $24.8k', MONO, 500, CORAL, '0.12em'),
        t(90, 258, 14, 'USERS     1,204', MONO, 500, MINT, '0.12em'),
        t(90, 286, 14, 'LATENCY   42 ms', MONO, 500, INDIGO, '0.12em'),
        t(90, 330, 14, 'LOCK AXES  →  STACK', MONO, 500, MUTED, '0.12em'),
        t(90, 1288, 13, '卡片、图表、设备都是同一套盒子。先锁轴，再往上堆。', SC, 500, MUTED, '0.04em'),
        marks(),
    ]
    return HEAD + ''.join(body) + FOOT


def variants():
    body = [bg(True), t(90, 140, 40, '3 WAYS', FAM, 700, INK, '-0.04em'),
            t(90, 182, 18, '三种有用的等距变体', SC, 700, MUTED, '0.08em')]
    specs = [
        (220, 620, 22, 'iso', '经典等距', '30° / 30°'),
        (540, 620, 20, 'military', '斜二测 2:1', '2:1 DIMETRIC'),
        (860, 620, 22, 'product', '产品等距', '40° / 16°'),
    ]
    for ox, oy, u, mode, zh, en in specs:
        body.append(grid(ox, oy, u, 5, mode, 0.12))
        body.append(mini_world(ox, oy, u, mode))
        body.append(t(ox, 980, 14, en, MONO, 500, INK, '0.12em', 'middle'))
        body.append(t(ox, 1010, 18, zh, SC, 700, MUTED, '0.04em', 'middle'))
    notes = [
        (90, 1100, '三轴等长，夹角 120°。工程图与信息图的默认。'),
        (90, 1160, '2:1 钻石格，轴长不再相等。游戏、军事地图常用的斜二测。'),
        (90, 1220, '仍是平行投影。更侧的轴角 + 顶亮侧暗，产品营销的那一种。'),
    ]
    for x, y, s in notes:
        body.append(t(x, y, 16, s, SC, 500, MUTED, '0.02em'))
    body.append(marks())
    return HEAD + ''.join(body) + FOOT


def main():
    os.makedirs(HERE, exist_ok=True)
    for name, fn in [('poster', poster), ('cheatsheet', cheatsheet), ('app-ui', app_ui), ('variants', variants)]:
        path = os.path.join(HERE, f'{name}.svg')
        open(path, 'w', encoding='utf-8').write(fn())
        print('wrote', path)


if __name__ == '__main__':
    main()
