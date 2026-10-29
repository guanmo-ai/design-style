"""
017 · 中世纪现代 Mid-Century Modern —— 风格图（1080×1350）

  poster.svg      海报：一只剪纸的手把最后一颗球按上球钟，大字 MODERN 的 O 还拿在半空
  cheatsheet.svg  速查卡：剪 · 影子 = 高度 · 叠印 · 一秒 12 张 · 形状库 · 色板 · CSS
  app-ui.svg      如果中世纪现代来做 App：一个爵士电台播放页，带标注
  steps.svg       四步改造：同一张普通海报，每一步只改一件事

所有形状都是“剪出来的纸片”（见 cut.py）：毛边、歪一点、影子 = 高度、叠印出第三色。
用法：python3 styles/017-mid-century-modern/images/make_svgs.py
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cut import (INK, JOST, MUST, MUTE, PAPER, SC, TANG, TEAL, Sheet, bar, boomerang, circle, crescent, ellipse,  # noqa: E402
                 fit, kidney, measure, move, multiply, poly, rect, ring, rot, rough, rrect, star, t, union, word, overprint)

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1350
NO = '017'


def save(name, svg):
    with open(os.path.join(HERE, name), 'w', encoding='utf-8') as f:
        f.write(svg)
    print('wrote', name)


def hand(sh, x, y, k=1.0, ang=0, fill=PAPER, cuff=TEAL, h=26, seed=90, r=50):
    """Bass 式剪纸手：拇指和食指从右边捏住一颗半径 r 的球，球心在 (x, y)。整只手是一张纸（并集），影子只算一次。"""
    def P(polys):
        return rot(move([[(px * k, py * k) for px, py in p] for p in polys], x, y), ang, x, y)
    g = r / k
    index = union(bar(g * 0.55, -g * 0.92, 150, -70, 30, 40), circle(g * 0.55, -g * 0.92, 15))
    thumb = union(bar(g * 0.62, g * 0.86, 132, 40, 32, 44), circle(g * 0.62, g * 0.86, 16))
    back = union(rrect(118, -96, 150, 150, 46), circle(142, -94, 24), circle(184, -100, 25), circle(226, -94, 24))
    palm = union(index, thumb, back)
    return (sh.piece(rough(P(bar(300, -20, 900, 10, 132, 170)), seed + 2), INK, h)
            + sh.piece(rough(P(palm), seed, lo=9, hi=20), fill, h)
            + sh.piece(rough(P(rect(258, -98, 46, 162)), seed + 1), cuff, h))


def clock(sh, cx, cy, s=1.0, hold=3, lifted=1, seed=40):
    """Nelson 球钟（1949）：12 根辐条 + 12 颗球。hold = 还在手里的那一颗；lifted = 刚松手、还没落定的那一颗。"""
    cols = [MUST, PAPER, TEAL, INK, PAPER, MUST, INK, PAPER, MUST, PAPER, INK, TEAL]
    out = []
    pos = []
    for i in range(12):
        a = math.radians(i * 30 - 90)
        L = (300 if i % 3 == 0 else 236) * s
        pos.append((cx + math.cos(a) * L, cy + math.sin(a) * L))
        out.append(sh.piece(rough(bar(cx, cy, cx + math.cos(a) * L, cy + math.sin(a) * L, 22 * s, 15 * s), seed + i), INK))
    for i, (x, y) in enumerate(pos):
        r = (52 if i % 3 == 0 else 44) * s
        if i == hold:
            # 铅笔画的落位圈：告诉观众（和动画师）这一颗要放在哪
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r + 3:.1f}" fill="none" stroke="{INK}" '
                       f'stroke-width="2" stroke-dasharray="7 7" opacity=".55"/>')
            continue
        hh = 4
        if i == lifted:
            x, y, hh = x + 26 * s, y - 34 * s, 30
        out.append(sh.piece(rough(circle(x, y, r), seed + 20 + i, lo=7, hi=16), cols[i], hh))
    out.append(sh.piece(rough(circle(cx, cy, 88 * s), seed + 40, lo=10, hi=20), INK))
    out.append(sh.piece(rough(circle(cx, cy, 32 * s), seed + 41, lo=7, hi=13), MUST))
    # 时针 / 分针：两片细长的纸
    out.append(sh.piece(rough(bar(cx, cy, cx + 150 * s * math.cos(math.radians(-150)), cy + 150 * s * math.sin(math.radians(-150)), 18 * s, 6 * s), seed + 50), PAPER, 6))
    out.append(sh.piece(rough(bar(cx, cy, cx + 210 * s * math.cos(math.radians(-38)), cy + 210 * s * math.sin(math.radians(-38)), 14 * s, 5 * s), seed + 51), PAPER, 7))
    return ''.join(out), pos


# ======================================================================
# 海报
# ======================================================================

def poster():
    sh = Sheet(W, H)
    b = [f'<rect width="{W}" height="{H}" fill="{TANG}"/>']
    CX, CY = 470, 452

    # 背后两块大纸：芥末黄的太阳 + 孔雀绿的腰果，重叠处叠印出第三色
    sun = rough(circle(800, 330, 205), 4, lo=16, hi=34)
    bean = rough(kidney(300, 640, 270, -16), 3, lo=20, hi=40)
    b.append(overprint(sh, sun, MUST, bean, TEAL, 'op-poster'))

    c, pos = clock(sh, CX, CY, 0.94, hold=3, lifted=1)
    b.append(c)

    # 手：捏着最后一颗墨色的球，悬在 3 点的落位圈右上方
    tx, ty = pos[3]
    bx, by = tx + 40, ty - 34
    b.append(sh.piece(rough(circle(bx, by, 49), 63, lo=7, hi=16), INK, 30))
    b.append(hand(sh, bx, by, 1.0, -12, h=30, r=49))

    # 星芒
    b.append(sh.piece(rough(star(110, 200, 42, 8, 4, 8), 70, lo=5, hi=9), PAPER, 4))
    b.append(sh.piece(rough(star(168, 262, 20, 5, 4, -10), 71, lo=4, hi=7), PAPER, 4))

    # 大字：MID-CENTURY（墨）压在 MODERN（奶油）上面；MODERN 的 O 正被放下来
    s2 = fit('MODERN', 952, tracking=0.015)
    base2 = 1224
    top2 = base2 - 0.867 * s2
    s1 = fit('MID-CENTURY', 590)
    for p, i in word('MID-CENTURY', s1, 66, top2 - 26, seed=11, tilt=2.2, bounce=0.02, tracking=0.02):
        b.append(sh.piece(p, INK, 4))
    for p, i in word('MODERN', s2, 60, base2, seed=12, tilt=1.6, bounce=0.01, tracking=0.015,
                     lift={1: (16, -46, 9)}):
        b.append(sh.piece(p, PAPER, 30 if i == 1 else 4))

    # 剪剩的边角料（落在 MID-CENTURY 右边的空处）
    for (cx, cy, r, th, ang, col, sd, hh) in [(760, top2 - 70, 44, 12, 200, MUST, 80, 4),
                                               (872, top2 - 96, 32, 9, 20, PAPER, 81, 4),
                                               (968, top2 - 60, 26, 8, 120, TEAL, 82, 12)]:
        b.append(sh.piece(rough(crescent(cx, cy, r, th, ang), sd, lo=6, hi=12), col, hh))

    # 底栏：中文剪字 + 一句话
    b.append(sh.piece(rough(rot(rect(40, 1254, 420, 72), -1.2, 250, 1290), 21), INK, 4))
    zh = []
    for p, i in word('中世纪现代', 50, 72, 1309, f='sc', seed=13, tilt=2, bounce=0.02, tracking=0.12):
        zh += p
    b.append(sh.piece(zh, PAPER, 0))
    b.append(t(492, 1284, 24, '剪刀代替尺子。', SC, 700, INK))
    b.append(t(492, 1315, 16, '每一块都是剪出来、能拿起来的纸。', SC, 500, INK, extra='opacity=".82"'))
    b.append(t(1018, 1315, 14, 'SCISSORS, NOT RULERS', JOST, 600, INK, '2.5', 'end'))

    b.append(t(62, 84, 18, f'NO. {NO}  ·  1945 — 1965', JOST, 600, INK, '3'))
    b.append(t(1018, 84, 18, 'DESIGN STYLE', JOST, 600, INK, '3', 'end'))

    b.append(sh.texture())
    save('poster.svg', sh.doc('\n'.join(b)))


# ======================================================================
# 速查卡
# ======================================================================

MONO = "'JetBrains Mono', monospace"


def sec(x, y, num, title, note='', col=TANG):
    """小节标题：编号 + 标题 + 一句说明。"""
    return (t(x, y, 17, num, JOST, 700, col, '1.5') + t(x + 34, y, 21, title, SC, 900, INK)
            + (t(x + 34, y + 26, 15, note, SC, 500, MUTE) if note else ''))


def ticks(polys, col=INK, r=2.6):
    return ''.join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{col}"/>' for p in polys for x, y in p)


def cheatsheet():
    sh = Sheet(W, H)
    b = [f'<rect width="{W}" height="{H}" fill="{PAPER}"/>']
    L, R = 56, 1024

    # 头
    for p, i in word('MID-CENTURY', fit('MID-CENTURY', 560), L, 150, seed=31, tilt=1.6, bounce=0.015, tracking=0.02):
        b.append(sh.piece(p, INK, 4))
    b.append(t(R, 76, 16, f'NO. {NO}  ·  1945 — 1965', JOST, 600, INK, '2.5', 'end'))
    b.append(t(R, 118, 26, '速查卡', SC, 900, INK, '2', 'end'))
    b.append(t(R, 148, 15, '剪 · 影子 · 叠印 · 一秒 12 张 · 形状 · 颜色', SC, 500, MUTE, '0', 'end'))
    b.append(f'<rect x="{L}" y="178" width="{R - L}" height="3" fill="{INK}"/>')

    # 01 剪
    y0 = 218
    b.append(sec(L, y0, '01', '剪：剪刀代替尺子', '沿轮廓每 14—34px 剪一刀直的；同一个形状换一次随机种子，就是重剪一遍'))
    cy = 338
    b.append(f'<circle cx="150" cy="{cy}" r="74" fill="none" stroke="{INK}" stroke-width="2"/>'
             f'<path d="M144 {cy}h12M150 {cy - 6}v12" stroke="{INK}" stroke-width="2"/>')
    b.append(t(150, cy + 104, 15, '圆规：完美，没有手', SC, 700, MUTE, anchor='middle'))
    c1 = rough(circle(370, cy, 74), 5, lo=14, hi=34, jitter=1.5)
    b.append(sh.piece(c1, MUST, 4) + ticks(c1))
    # 标一刀的长度
    (ax, ay), (bx, by) = c1[0][3], c1[0][4]
    b.append(f'<path d="M{ax:.1f} {ay:.1f} L{bx:.1f} {by:.1f}" stroke="{TANG}" stroke-width="4"/>')
    b.append(t(370, cy + 104, 15, '剪刀：一刀一段直线', SC, 700, INK, anchor='middle'))
    c2 = rough(circle(590, cy, 74), 6, lo=14, hi=34, jitter=1.5)
    b.append(sh.piece(c2, TEAL, 4))
    b.append(f'<path d="{path_d_(c1, 220, 0)}" fill="none" stroke="{INK}" stroke-width="1.6" stroke-dasharray="4 4"/>')
    b.append(t(590, cy + 104, 15, '换种子 = 下一张', SC, 700, INK, anchor='middle'))
    rows = [('一刀', '14—34 px'), ('顶点偏移', '±1.5 px'), ('整块歪', '±3°'), ('尖角', '保留'), ('重剪', '每 2 张换种子')]
    for k, (a, v) in enumerate(rows):
        yy = 286 + k * 30
        b.append(t(726, yy, 16, a, SC, 500, MUTE) + t(R, yy, 17, v, JOST, 600, INK, anchor='end'))
        b.append(f'<rect x="726" y="{yy + 10}" width="{R - 726}" height="1" fill="{INK}" opacity=".18"/>')

    # 02 影子 = 高度
    y0 = 492
    b.append(sec(L, y0, '02', '影子 = 高度', '纸片离桌面 h：影子往右下偏 (0.5h, h)，模糊 0.4h（CSS 写 0.8h）'))
    for k, (hh, col, name) in enumerate([(4, TANG, '贴着'), (14, TEAL, '拿起'), (30, MUST, '在手里')]):
        x = L + 20 + k * 186
        lift = hh * 0.6
        b.append(sh.piece(rough(rot(rect(x, 566 - lift, 100, 100), [-2, 3, -6][k], x + 50, 616), 40 + k), col, hh))
        b.append(t(x, 712, 17, f'h = {hh}', JOST, 700, INK) + t(x + 64, 712, 15, name, SC, 700, MUTE))
        b.append(t(x, 734, 14, f'({0.5 * hh:g}, {hh})  模糊 {0.4 * hh:g}', JOST, 500, MUTE))

    # 03 叠印
    x0 = 640
    b.append(sec(x0, y0, '03', '叠印：不加新颜色', '两层油墨相乘，叠出第三色'))
    A = rough(circle(x0 + 80, 620, 74), 50)
    B = rough(circle(x0 + 182, 620, 74), 51)
    b.append(overprint(sh, A, MUST, B, TEAL, 'op-cs1'))
    C = rough(circle(x0 + 290, 648, 44), 52)
    D = rough(circle(x0 + 340, 608, 44), 53)
    b.append(overprint(sh, C, TANG, D, TEAL, 'op-cs2'))
    b.append(t(x0, 718, 14, f'芥末 × 孔雀绿 = {multiply(MUST, TEAL)}', JOST, 600, INK))
    b.append(t(x0, 740, 14, f'橘 × 孔雀绿 = {multiply(TANG, TEAL)}', JOST, 600, INK))
    b.append(t(R, 740, 14, 'mix-blend-mode: multiply', MONO, 500, MUTE, anchor='end'))

    # 04 一秒 12 张
    y0 = 786
    b.append(sec(L, y0, '04', '一秒 12 张：零件走台阶，镜头走平滑', 'Bass 的片头一秒 24 帧、每张画拍两帧；60fps 里每张停 5 帧，每张重剪一次边'))
    sx, sy, cw, chh = L, 846, 96, 92
    n = 6
    b.append(sh.piece(rect(sx - 8, sy - 22, n * (cw + 8) + 8, chh + 44), INK, 4))
    hs = [44, 30, 18, 8, 4, 4]
    angs = [-14, -10, -6, -2, 3, 0]
    for k in range(n):
        x = sx + k * (cw + 8)
        for hx in range(3):
            b.append(f'<rect x="{x + 12 + hx * 30}" y="{sy - 15}" width="14" height="8" rx="2" fill="{PAPER}" opacity=".85"/>')
            b.append(f'<rect x="{x + 12 + hx * 30}" y="{sy + chh + 7}" width="14" height="8" rx="2" fill="{PAPER}" opacity=".85"/>')
        b.append(f'<rect x="{x}" y="{sy}" width="{cw}" height="{chh}" fill="{TANG}"/>')
        # 一根辐条 + 球往下落：越低影子越短
        b.append(sh.piece(rough(bar(x + 10, sy + 80, x + 70, sy + 80, 7, 6), 300 + k), INK, 4))
        hh = hs[k]
        b.append(sh.piece(rough(rot(circle(x + 70, sy + 80 - 18 - hh * 0.9, 17), angs[k], x + 70, sy + 60), 310 + k, lo=5, hi=10), MUST, hh))
        b.append(t(x + cw / 2, sy + chh + 34, 13, f'f{k * 5}—{k * 5 + 4}', JOST, 600, MUTE, anchor='middle'))
    # 右边：台阶 vs 平滑
    gx, gy, gw, gh = 712, 846, 312, 92
    b.append(f'<rect x="{gx}" y="{gy}" width="{gw}" height="{gh}" fill="none" stroke="{INK}" stroke-width="1.5" opacity=".35"/>')
    smooth = ' '.join(f'{gx + gw * i / 60:.1f},{gy + gh - gh * (0.5 - 0.5 * math.cos(math.pi * i / 60)):.1f}' for i in range(61))
    stair = []
    for i in range(0, 60, 5):
        v = gy + gh - gh * (0.5 - 0.5 * math.cos(math.pi * i / 60))
        stair += [f'{gx + gw * i / 60:.1f},{v:.1f}', f'{gx + gw * (i + 5) / 60:.1f},{v:.1f}']
    b.append(f'<polyline points="{smooth}" fill="none" stroke="{TEAL}" stroke-width="3"/>')
    b.append(f'<polyline points="{" ".join(stair)}" fill="none" stroke="{TANG}" stroke-width="3.5"/>')
    b.append(t(gx + 10, gy + 22, 14, '零件 12 张/秒', SC, 700, TANG) + t(gx + gw - 10, gy + gh - 12, 14, '镜头 60 帧', SC, 700, TEAL, anchor='end'))
    b.append(t(gx, gy + gh + 34, 13, 'animation-timing-function: steps(12)', MONO, 500, MUTE))

    # 05 形状库
    y0 = 1010
    b.append(sec(L, y0, '05', '形状库：原子时代的七个零件', ''))
    shapes = [
        ('腰果', lambda x, y: kidney(x, y + 4, 34, -10), TEAL),
        ('回旋镖', lambda x, y: boomerang(x, y + 6, 40, -12), TANG),
        ('星芒', lambda x, y: star(x, y, 40, 8, 4, 0), MUST),
        ('原子', None, INK),
        ('球与棍', None, INK),
        ('月牙', lambda x, y: crescent(x, y - 8, 34, 10, 20), MUST),
        ('调色板', None, TANG),
    ]
    for k, (name, fn, col) in enumerate(shapes):
        x, y = L + 66 + k * 138, 1072
        if name == '原子':
            for a in (0, 60, 120):
                b.append(sh.piece(rough(ring(x, y, 50, 17, 5, a), 400 + a, lo=6, hi=12), INK, 3, rule='evenodd'))
            b.append(sh.piece(rough(circle(x, y, 9), 410), TANG, 3))
        elif name == '球与棍':
            for a in (0, 72, 144, 216, 288):
                ex, ey = x + 40 * math.cos(math.radians(a - 90)), y + 40 * math.sin(math.radians(a - 90))
                b.append(sh.piece(rough(bar(x, y, ex, ey, 5, 4), 420 + a), INK, 3))
                b.append(sh.piece(rough(circle(ex, ey, 9), 430 + a), [TEAL, MUST, TANG, PAPER, TEAL][a // 72], 3))
            b.append(sh.piece(rough(circle(x, y, 10), 440), INK, 3))
        elif name == '调色板':
            pal = kidney(x, y, 34, 8)[0]
            hole = list(reversed(circle(x + 26, y - 4, 7)[0]))
            b.append(sh.piece(rough([pal, hole], 460, lo=8, hi=16), col, 4, rule='evenodd'))
            for j, (dx, dy, cc) in enumerate([(-30, -2, MUST), (-12, 12, TEAL), (10, 14, PAPER)]):
                b.append(sh.piece(rough(circle(x + dx, y + dy, 7), 470 + j), cc, 2))
        else:
            b.append(sh.piece(rough(fn(x, y), 450 + k, lo=8, hi=16), col, 4))
        b.append(t(x, 1134, 15, name, SC, 700, INK, anchor='middle'))

    # 06 颜色 + CSS
    y0 = 1206
    b.append(sec(L, 1172, '06', '五种颜色 · 比例', ''))
    sw = [(PAPER, '奶油纸', 40), (TANG, '橘', 20), (TEAL, '孔雀绿', 16), (MUST, '芥末', 14), (INK, '墨', 10)]
    for k, (col, name, pct) in enumerate(sw):
        x = L + k * 98
        b.append(sh.piece(rough(rect(x, y0 - 6, 84, 40), 500 + k, lo=10, hi=20), col, 4))
        if col == PAPER:
            b.append(f'<path d="{path_d_(rough(rect(x, y0 - 6, 84, 40), 500 + k, lo=10, hi=20))}" fill="none" stroke="{INK}" stroke-opacity=".3"/>')
        b.append(t(x, y0 + 58, 14, f'{name} {pct}%', SC, 700, INK) + t(x, y0 + 77, 12, col, JOST, 600, MUTE))
    cx0 = 566
    b.append(sh.piece(rough(rect(cx0, y0 - 42, R - cx0, 108), 520, lo=20, hi=40), INK, 4))
    code = [('.piece', '{ filter: drop-shadow(2px 4px 3.2px #2A120562) }', MUST),
            ('.piece:active', '{ translate: -6px -12px; rotate: -3deg;', MUST),
            ('', '  filter: drop-shadow(15px 30px 24px #2A120547) }', None),
            ('.overprint', '{ mix-blend-mode: multiply }', MUST)]
    for k, (sel, rest, col) in enumerate(code):
        yy = y0 - 16 + k * 23
        b.append(f'<text x="{cx0 + 16}" y="{yy}" font-family="{MONO}" font-size="12.5" fill="{PAPER}">'
                 + (f'<tspan fill="{col}">{sel}</tspan> ' if sel else '') + f'{esc_(rest)}</text>')

    b.append(f'<rect x="{L}" y="1290" width="{R - L}" height="1.5" fill="{INK}" opacity=".5"/>')
    b.append(t(L, 1318, 14, '字：手剪 Anton · 正文 Jost（Futura 的开源替代）· 中文 思源黑体 Black', SC, 500, MUTE))
    b.append(t(R, 1318, 14, f'Design Style 风格 {NO} · @guanmo_ai', JOST, 500, MUTE, anchor='end'))

    b.append(sh.texture(0.8))
    save('cheatsheet.svg', sh.doc('\n'.join(b)))


# ======================================================================
# App
# ======================================================================

def tri(cx, cy, r, ang=0):
    return [[(cx + r * math.cos(math.radians(ang + k * 120)), cy + r * math.sin(math.radians(ang + k * 120))) for k in range(3)]]


def app_ui():
    sh = Sheet(W, H)
    b = [f'<rect width="{W}" height="{H}" fill="{PAPER}"/>']
    L, R = 56, 1024
    b.append(sh.piece(rough(kidney(250, 760, 250, -70), 7, lo=20, hi=40), TEAL, 4))
    b.append(sh.piece(rough(star(990, 112, 34, 7, 4, 10), 8, lo=5, hi=9), TANG, 4))

    b.append(t(L, 76, 16, 'MID-CENTURY  ·  APP', JOST, 700, TANG, '3'))
    b.append(t(L, 128, 42, '如果中世纪现代来做 App', SC, 900, INK))
    b.append(t(L, 166, 18, '一个爵士电台：每个按钮都是一张能按下去的纸。', SC, 500, MUTE))

    # 手机
    px, py, pw, ph = 92, 214, 468, 1012
    b.append(sh.piece(rrect(px, py, pw, ph, 66, 10), INK, 14))
    sx, sy, sw, shh = px + 14, py + 14, pw - 28, ph - 28
    b.append(f'<path d="{path_d_(rrect(sx, sy, sw, shh, 54, 10))}" fill="{PAPER}"/>')
    b.append(f'<rect x="{px + pw / 2 - 58}" y="{py + 26}" width="116" height="30" rx="15" fill="{INK}"/>')
    b.append(t(sx + 34, sy + 46, 17, '9:41', JOST, 600, INK) + t(sx + sw - 34, sy + 46, 15, '●●● 100%', JOST, 600, INK, anchor='end'))
    b.append(t(sx + sw / 2, sy + 98, 14, 'NOW PLAYING', JOST, 700, INK, '4', 'middle'))
    b.append(f'<path d="M{sx + 30} {sy + 88} l8 8 l8 -8" stroke="{INK}" stroke-width="2.5" fill="none"/>')
    b.append(t(sx + sw - 30, sy + 100, 22, '···', JOST, 700, INK, anchor='end'))

    # 封面：芥末底 + 孔雀绿圆叠印 + 手剪大字 BOP 出血
    cx0, cy0, cw = sx + 26, sy + 128, sw - 52
    b.append(f'<clipPath id="cover"><rect x="{cx0}" y="{cy0}" width="{cw}" height="{cw}"/></clipPath>')
    b.append(sh.piece(rect(cx0, cy0, cw, cw), MUST, 6))
    g = [f'<g clip-path="url(#cover)">']
    blk = rough(rect(cx0 - 20, cy0 + 168, 250, 300), 9, lo=18, hi=36)
    ball = rough(circle(cx0 + 270, cy0 + 120, 104), 10, lo=12, hi=26)
    g.append(overprint(sh, blk, TANG, ball, TEAL, 'op-app'))
    bs = fit('BOP', cw - 56, tracking=0.02)
    for p, i in word('BOP', bs, cx0 + 26, cy0 + cw + 26, seed=33, tilt=3, bounce=0.02, tracking=0.02):
        g.append(sh.piece(p, INK, 4))
    g.append(sh.piece(rough(star(cx0 + 76, cy0 + 76, 38, 8, 4, 12), 34, lo=5, hi=9), PAPER, 4))
    g.append(t(cx0 + 22, cy0 + 150, 14, 'THE RAND QUARTET', JOST, 700, INK, '3'))
    g.append('</g>')
    b.append(''.join(g))

    # 标题手剪、正文 Futura
    ty = cy0 + cw + 70
    for p, i in word('BLUE ATOMIC', 46, cx0, ty, seed=35, tilt=2, bounce=0.02, tracking=0.03):
        b.append(sh.piece(p, INK, 3))
    b.append(t(cx0, ty + 34, 18, 'The Rand Quartet · Side A, track 3', JOST, 500, INK, extra='opacity=".75"'))

    # 进度 = 一排纸条：播过的立起来（墨），没播的还平躺在桌上（浅）
    wy = ty + 104
    nbar = 30
    bw = cw / nbar
    import random as _r
    rr = _r.Random(3)
    for k in range(nbar):
        hgt = 10 + 44 * abs(math.sin(k * 0.7) * 0.6 + rr.random() * 0.4)
        played = k < 19
        x = cx0 + k * bw
        b.append(sh.piece(rough(rect(x + 1.5, wy - hgt, bw - 4, hgt), 600 + k, lo=6, hi=12, jitter=0.8),
                          INK if played else '#D8C7A2', 3 if played else 0))
    b.append(t(cx0, wy + 30, 14, '2:41', JOST, 600, MUTE) + t(cx0 + cw, wy + 30, 14, '4:57', JOST, 600, MUTE, anchor='end'))

    # 控制：播放键是一张提起来的纸
    by = wy + 112
    mx = sx + sw / 2
    b.append(sh.piece(rough(circle(mx, by, 54), 40, lo=8, hi=16), TANG, 12))
    b.append(sh.piece(rough(tri(mx + 6, by, 24), 41, lo=6, hi=10), PAPER, 0))
    for d in (-1, 1):
        x = mx + d * 136
        b.append(sh.piece(rough(tri(x + d * 6, by, 16, 0 if d > 0 else 180), 42 + d), INK, 3))
        b.append(sh.piece(rough(tri(x - d * 10, by, 16, 0 if d > 0 else 180), 44 + d), INK, 3))
        b.append(sh.piece(rect(x + d * 22 - 3, by - 15, 6, 30), INK, 3))

    # 下一首
    ny = by + 96
    b.append(f'<rect x="{cx0}" y="{ny - 26}" width="{cw}" height="2" fill="{INK}"/>')
    b.append(sh.piece(rect(cx0, ny - 4, 62, 62), INK, 3))
    for k, col in enumerate([TANG, MUST, TEAL, PAPER]):
        b.append(sh.piece(rough(rect(cx0 + 8 + k * 12, ny + 6 + (k % 2) * 4, 9, 40 - (k % 2) * 6), 700 + k, lo=5, hi=9), col, 0))
    b.append(t(cx0 + 80, ny + 18, 13, 'UP NEXT', JOST, 700, TANG, '3'))
    b.append(t(cx0 + 80, ny + 44, 19, 'Night Owls · Girard Trio', JOST, 600, INK))

    # 标注
    notes = [
        (cy0 + 210, '封面 = 剪纸 + 叠印', ['橘和孔雀绿叠出深绿：两层油墨相乘，', '一张封面只用三四种颜色。']),
        (ty - 16, '标题手剪，正文 Futura', ['手剪只给 32px 以上的大字；', '正文和数字用干净的几何无衬线（Jost）。']),
        (wy - 20, '进度 = 一排纸条', ['播过的纸条“立起来”（墨 + 影子），', '没播的还平躺在桌上（浅色、没影子）。']),
        (by, '按钮 = 一张纸', ['按下去影子收紧，松手弹高一点再落定；', '不用渐变、不用描边。']),
    ]
    ax = 600
    for k, (yy, title, lines) in enumerate(notes):
        b.append(f'<path d="M{sx + sw - 12} {yy} H{ax - 4}" stroke="{INK}" stroke-width="1.5" stroke-dasharray="4 4"/>')
        b.append(sh.piece(rough(circle(ax + 16, yy, 16), 800 + k, lo=5, hi=9), TANG, 3))
        b.append(t(ax + 16, yy + 6, 16, str(k + 1), JOST, 700, PAPER, anchor='middle'))
        b.append(t(ax + 44, yy + 7, 21, title, SC, 900, INK))
        for j, ln in enumerate(lines):
            b.append(t(ax + 44, yy + 36 + j * 24, 15, ln, SC, 500, MUTE))

    # 按钮三态（接在第 4 条下面）
    ky = by + 120
    for k, (hh, name, ms) in enumerate([(12, '平时', '0ms'), (0, '按下', '+80ms'), (16, '松手', '+160ms')]):
        x = ax + 74 + k * 128
        b.append(sh.piece(rough(circle(x, ky - hh * 0.5, 30), 900, lo=6, hi=12), TANG, hh))
        b.append(sh.piece(rough(tri(x + 3, ky - hh * 0.5, 13), 901, lo=4, hi=7), PAPER, 0))
        b.append(t(x, ky + 58, 14, f'{name} h={hh}', SC, 700, INK, anchor='middle'))
        b.append(t(x, ky + 78, 12, ms, JOST, 600, MUTE, anchor='middle'))
    for k in range(2):
        x = ax + 74 + k * 128 + 64
        b.append(f'<path d="M{x - 10} {ky} h20 m-6 -6 l6 6 l-6 6" stroke="{INK}" stroke-width="2" fill="none" opacity=".5"/>')

    # 令牌（右上空处）
    tk = [('--paper', PAPER), ('--ink', INK), ('--cut', '14–34px ±1.5px'), ('--tilt', '±3deg'),
          ('--shadow', '0.5h h 0.8h'), ('--pieces-fps', '12  /* 镜头 60 */')]
    ty0 = 250
    b.append(t(ax, ty0, 14, 'TOKENS', JOST, 700, TANG, '3'))
    for k, (kk, vv) in enumerate(tk):
        b.append(f'<text x="{ax}" y="{ty0 + 30 + k * 23}" font-family="{MONO}" font-size="15" fill="{INK}">'
                 f'<tspan fill="{TEAL}">{kk}</tspan>: {esc_(vv)};</text>')

    b.append(t(L, 1310, 14, f'Design Style 风格 {NO} · @guanmo_ai', JOST, 500, MUTE))
    b.append(sh.texture(0.8))
    save('app-ui.svg', sh.doc('\n'.join(b)))


# ======================================================================
# 四步改造
# ======================================================================

HEROS = "'TeX Gyre Heros', 'Noto Sans SC', sans-serif"


def record(sh, cx, cy, r, disc, label, cut, seed, h=4):
    """一张唱片：盘 + 标签 + 中心孔。cut=False 时是“尺子画的”完美圆。"""
    hole = list(reversed(circle(cx, cy, r * 0.05)[0]))
    d = [circle(cx, cy, r)[0], hole]
    lab = [circle(cx, cy, r * 0.36)[0], hole]
    if cut:
        d = rough(d, seed, lo=12, hi=28)
        lab = rough(lab, seed + 1, lo=8, hi=16)
        return sh.piece(d, disc, h, rule='evenodd') + sh.piece(lab, label, 0, rule='evenodd')
    return (f'<path d="{path_d_(d)}" fill="{disc}" fill-rule="evenodd"/>'
            + f'<path d="{path_d_(lab)}" fill="{label}" fill-rule="evenodd"/>'
            + ''.join(f'<circle cx="{cx}" cy="{cy}" r="{r * k:.1f}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1.5"/>'
                      for k in (0.5, 0.62, 0.74, 0.86)))


def mini(sh, step, pw, ph):
    """一张 pw×ph 的小海报；step 1—4。"""
    b = []
    BLUE, WHITE = '#3D6FD8', '#FFFFFF'
    cut = step >= 2
    bg = WHITE if step < 3 else PAPER
    disc, label, title, btn = (BLUE, WHITE, INK, BLUE) if step < 3 else (TEAL, MUST, INK, TANG)
    b.append(f'<rect width="{pw}" height="{ph}" fill="{bg}"/>')
    if step < 4:
        rcx, rcy, rr = pw / 2, 180, 112
        if step == 3:
            hole = list(reversed(circle(rcx, rcy, 6)[0]))
            sun = rough(circle(118, 100, 74), 61, lo=12, hi=26)
            rec = rough([circle(rcx, rcy, rr)[0], hole], 60, lo=12, hi=28)
            b.append(overprint(sh, sun, TANG, rec, TEAL, f'op-step{step}'))
            b.append(sh.piece(rough([circle(rcx, rcy, rr * 0.36)[0], hole], 62, lo=8, hi=16), MUST, 0, rule='evenodd'))
        else:
            b.append(record(sh, rcx, rcy, rr, disc, label, cut, 60))
        if cut:
            sz = fit('JAZZ NIGHT', 330, 'heros')
            for p, i in word('JAZZ NIGHT', sz, pw / 2 - 165, 356, f='heros', seed=64, tilt=2.5, bounce=0.03):
                b.append(sh.piece(p, title, 3))
        else:
            b.append(t(pw / 2, 356, 52, 'JAZZ NIGHT', HEROS, 700, title, '0', 'middle'))
        b.append(t(pw / 2, 388, 15, 'FRI · 9 PM · THE BLUE ROOM', HEROS if step < 3 else JOST, 700 if step < 3 else 600, INK, '1.5', 'middle',
                   'opacity=".7"'))
        if cut:
            b.append(sh.piece(rough(rot(rect(pw / 2 - 80, 410, 160, 42), -1.5, pw / 2, 431), 66, lo=10, hi=20), btn, 6))
        else:
            b.append(f'<rect x="{pw / 2 - 80}" y="410" width="160" height="42" rx="21" fill="{btn}"/>')
        b.append(t(pw / 2, 436, 14, 'GET TICKETS', HEROS if step < 3 else JOST, 700, WHITE if step < 3 else PAPER, '1.5', 'middle'))
    else:
        # 第 4 步：歪一点、拿起来——唱片挪到右上出血、正被拿起来；字左对齐放大
        rcx, rcy, rr = 338, 150, 134
        hole = list(reversed(circle(rcx, rcy, 7)[0]))
        sun = rough(circle(170, 98, 74), 61, lo=12, hi=26)
        b.append(sh.piece(sun, TANG, 4))
        b.append(f'<circle cx="{rcx - 22}" cy="{rcy + 26}" r="{rr}" fill="none" stroke="{INK}" stroke-width="1.6" stroke-dasharray="6 6" opacity=".5"/>')
        rec = rough([circle(rcx, rcy, rr)[0], hole], 60, lo=12, hi=28)
        b.append(sh.piece(rec, TEAL, 30, rule='evenodd'))
        b.append(f'<clipPath id="op-step4"><path d="{path_d_(sun)}"/></clipPath>'
                 f'<path d="{path_d_(rec)}" fill="{multiply(TANG, TEAL)}" fill-rule="evenodd" clip-path="url(#op-step4)"/>')
        b.append(sh.piece(rough([circle(rcx, rcy, rr * 0.36)[0], hole], 62, lo=8, hi=16), MUST, 0, rule='evenodd'))
        b.append(sh.piece(rough(star(52, 232, 24, 5, 4, 8), 67, lo=4, hi=8), INK, 3))
        s2 = fit('NIGHT', 300)
        h2 = 0.867 * s2
        base2 = 420
        s1 = fit('JAZZ', 214)
        for p, i in word('JAZZ', s1, 24, base2 - h2 - 12, seed=68, tilt=3, bounce=0.03, lift={2: (8, -20, 12)}):
            b.append(sh.piece(p, INK, 26 if i == 2 else 4))
        for p, i in word('NIGHT', s2, 24, base2, seed=69, tilt=3, bounce=0.03):
            b.append(sh.piece(p, TANG, 4))
        b.append(t(28, 450, 14, 'FRI · 9 PM · THE BLUE ROOM', JOST, 600, INK, '1.5'))
        b.append(sh.piece(rough(rot(rect(346, 426, 92, 34), -3, 392, 443), 66, lo=10, hi=20), INK, 6))
        b.append(t(392, 448, 12, 'TICKETS', JOST, 700, PAPER, '1.5', 'middle'))
    return ''.join(b)


def steps():
    sh = Sheet(W, H)
    b = [f'<rect width="{W}" height="{H}" fill="{PAPER}"/>']
    L, R = 56, 1024
    b.append(t(L, 104, 46, '四步改造', SC, 900, INK))
    b.append(t(L, 142, 17, '同一张普通海报，每一步只改一件事 —— 改到第四步，它就能“拿起来”了', SC, 500, MUTE))
    b.append(t(R, 142, 14, f'how-to no.{NO}', JOST, 600, MUTE, anchor='end'))
    b.append(f'<rect x="{L}" y="160" width="{R - L}" height="3" fill="{INK}"/>')
    pw, ph = 456, 470
    caps = [('原稿', '居中、圆规画的圆、Helvetica、一种蓝', '哪儿都对，哪儿都没有手'),
            ('剪', '只换工具：每个形状都用剪刀剪', '毛边、歪 ±3°、贴着桌面的影子'),
            ('换色 + 叠印', '奶油纸 + 橘 / 孔雀绿 / 芥末 / 墨', '唱片压住太阳：两色相乘出第三色'),
            ('歪一点，拿起来', '唱片挪到右上出血，字放大左对齐', '唱片和一个字母离开桌面：影子变长 = 正在动')]
    for k in range(4):
        col, row = k % 2, k // 2
        x, y = L + col * (pw + 56), 192 + row * (ph + 100)
        b.append(f'<g filter="url(#{sh.shadow_id(6)})"><rect x="{x}" y="{y}" width="{pw}" height="{ph}" fill="#fff"/></g>')
        b.append(f'<svg x="{x}" y="{y}" width="{pw}" height="{ph}" viewBox="0 0 {pw} {ph}" overflow="hidden">{mini(sh, k + 1, pw, ph)}</svg>')
        ty = y + ph + 34
        b.append(sh.piece(rough(rect(x, ty - 22, 44, 30), 90 + k, lo=6, hi=12), TANG if k else INK, 3))
        b.append(t(x + 22, ty - 1, 16, f'0{k + 1}', JOST, 700, PAPER, anchor='middle'))
        b.append(t(x + 56, ty, 22, caps[k][0], SC, 900, INK))
        tw = sum(22 if ord(ch) > 0x2E80 else 11 for ch in caps[k][0])
        b.append(t(x + 56 + tw + 12, ty - 1, 14, caps[k][1], SC, 500, MUTE))
        b.append(t(x + 56, ty + 26, 14, caps[k][2], SC, 500, MUTE))
        if col == 0:
            b.append(sh.piece(rough(tri(x + pw + 28, y + ph / 2, 12), 95 + k), TANG, 3))
    b.append(t(L, 1330, 14, 'github.com/guanmo-ai/design-style', JOST, 500, MUTE))
    b.append(t(R, 1330, 14, '@guanmo_ai · 每天一个设计风格', JOST, 500, MUTE, anchor='end'))
    b.append(sh.texture(0.8))
    save('steps.svg', sh.doc('\n'.join(b)))


def path_d_(polys, dx=0, dy=0):
    from cut import path_d
    return path_d(move(polys, dx, dy))


def esc_(s):
    from cut import esc
    return esc(s)


if __name__ == '__main__':
    which = sys.argv[1:] or ['poster', 'cheatsheet', 'app-ui', 'steps']
    for name in which:
        {'poster': poster, 'cheatsheet': cheatsheet, 'app-ui': app_ui, 'steps': steps}[name]()
