"""波兰海报学派 · 落到网页和手机 App（1920×1080）：一个小影展的官网和它的购票 App。
每部片子一张海报、一个比喻（钥匙孔 = 眼睛、灯泡里是月亮、手臂长成树、念头飞成鸟）；
按钮不是圆角矩形，是一笔刷过去的朱红——按下去的动效就是这一笔从左刷到右。
python3 ui.py && node ../_lib/shot.cjs ui.html png/ui.png"""
from polish import *

W, H = 1920, 1080


def keyhole_poster(x, y, w, h, title=True):
    """《窥》：赭黄底，一个黑钥匙孔，孔的圆里是一只眼睛。"""
    cx, cy, r = x + w / 2, y + h * .4, w * .26
    g = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{OCHRE}"/>',
         f'<rect x="{x}" y="{y}" width="{w}" height="{h}" filter="url(#ground)" opacity=".18"/>',
         f'<path d="M{cx - r * .55},{cy + r * .6} L{cx - r * .95},{y + h * .86} L{cx + r * .95},{y + h * .86} L{cx + r * .55},{cy + r * .6}Z" fill="{INK}" filter="url(#gou)"/>',
         f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{INK}" filter="url(#gou)"/>',
         f'<path d="M{cx - r * .78},{cy} C{cx - r * .4},{cy - r * .52} {cx + r * .4},{cy - r * .52} {cx + r * .78},{cy} C{cx + r * .4},{cy + r * .52} {cx - r * .4},{cy + r * .52} {cx - r * .78},{cy}Z" fill="{CREAM}" filter="url(#hand)"/>',
         f'<circle cx="{cx + r * .06}" cy="{cy}" r="{r * .3}" fill="{RED}"/><circle cx="{cx + r * .06}" cy="{cy}" r="{r * .13}" fill="{INK}"/>',
         f'<circle cx="{cx - r * .04}" cy="{cy - r * .1}" r="{r * .06}" fill="{CREAM}"/>']
    if title:
        g.append(T(x + w * .08, y + h * .2, '窥', w * .22, 'Hei', RED, weight=900, filt='hand'))
        g.append(T(x + w * .92, y + h * .95, 'THE KEYHOLE', w * .07, 'Lond', INK, 'end', ls=2, filt='hand'))
    return ''.join(g)


def bulb_poster(x, y, w, h):
    """《夜》：深蓝底，一个灯泡，灯丝是一弯月亮。"""
    cx, cy, r = x + w / 2, y + h * .42, w * .27
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{BLUE2}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{CREAM}" filter="url(#gou)"/>'
            f'<path d="M{cx - r * .45},{cy + r * .85} L{cx + r * .45},{cy + r * .85} L{cx + r * .38},{cy + r * 1.35} L{cx - r * .38},{cy + r * 1.35}Z" fill="{INK}" filter="url(#gou)"/>'
            + ''.join(f'<rect x="{cx - r * .42}" y="{cy + r * (.95 + i * .13)}" width="{r * .84}" height="{r * .05}" fill="{CREAM}" opacity=".6"/>' for i in range(3))
            + f'<path d="M{cx + r * .2},{cy - r * .5} A{r * .5},{r * .5} 0 1 0 {cx + r * .2},{cy + r * .5} A{r * .38},{r * .42} 0 1 1 {cx + r * .2},{cy - r * .5}Z" fill="{RED}" filter="url(#hand)"/>'
            + T(x + w * .5, y + h * .93, '夜', w * .18, 'Hei', CREAM, 'middle', weight=900, filt='hand'))


def tree_poster(x, y, w, h):
    """《根》：奶油底，一只黑手臂从底下伸上来，五根指头长成树枝，枝头是红点。"""
    bx = x + w / 2
    g = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{CREAM}"/>',
         brush([(bx, y + h), (bx - 4, y + h * .8), (bx + 4, y + h * .65), (bx, y + h * .52)], w * .16, INK, seed=31, n=26, dry=.2, taper=(0, .1), bw=(1.5, 3.5), op=1)]
    for i, a in enumerate((-58, -30, -6, 18, 46)):
        rad = math.radians(a - 90)
        L = h * (.26 + .06 * (i % 2))
        ex, ey = bx + math.cos(rad) * L, y + h * .52 + math.sin(rad) * L
        mx, my = bx + math.cos(rad) * L * .5 + 8, y + h * .52 + math.sin(rad) * L * .5
        g.append(brush([(bx, y + h * .53), (mx, my), (mx, my), (ex, ey)], w * .05, INK, seed=40 + i, n=12, dry=.5, taper=(0, .6), bw=(1, 2.5), op=1))
        g.append(f'<circle cx="{ex:.0f}" cy="{ey:.0f}" r="{w * .04:.0f}" fill="{RED}" filter="url(#gou)"/>')
    g.append(T(x + w * .1, y + h * .15, '根', w * .17, 'Hei', RED, weight=900, filt='hand'))
    return ''.join(g)


def bird_poster(x, y, w, h):
    """《念》：封面那张的缩小版——侧脸、月亮、一笔变成鸟。"""
    k = w / 1000
    face = ('M520,1080 C520,980 500,900 470,840 C420,760 404,640 432,540 C470,392 580,306 700,302 C792,300 852,342 872,420 '
            'C884,468 882,500 892,530 C902,562 922,600 952,640 C962,656 946,670 920,670 C912,682 918,692 926,702 '
            'C931,713 916,719 905,722 C918,730 925,744 915,757 C905,772 902,792 902,804 C902,832 872,846 842,852 C820,872 814,924 830,1080Z')
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{BLUE}"/>'
            f'<g transform="translate({x - 160 * k},{y + h - 1080 * k}) scale({k})"><circle cx="680" cy="660" r="330" fill="{CREAM}" filter="url(#gou)"/>'
            f'<path d="{face}" fill="{INK}" filter="url(#gou)"/></g>'
            f'<g transform="translate({x - 160 * k},{y + h - 1080 * k}) scale({k})">'
            + brush([(650, 720), (600, 600), (560, 480), (600, 370), (640, 270), (700, 230), (740, 170), (770, 120), (800, 96), (842, 88)], 170, RED, seed=3, n=40, dry=.5, taper=(.3, .5), bw=(5, 12), op=1)
            + '</g>' + gull(x + w * .78, y + h * .14, w * .09, -12, RED) + gull(x + w * .9, y + h * .26, w * .06, -4, CREAM)
            + T(x + w * .9, y + h * .95, '念', w * .17, 'Hei', CREAM, 'end', weight=900, filt='hand'))


def stroke_button(cx, cy, w, h, label, size, seed=0, col=RED, tcol=CREAM):
    """一笔刷过去的按钮。"""
    b = brush([(cx - w / 2, cy + 4), (cx - w / 6, cy - 6), (cx + w / 6, cy + 6), (cx + w / 2, cy - 2)], h, col, seed=seed, n=34, dry=.18, taper=(.04, .12), bw=(3, 7), op=1)
    return b + T(cx, cy + size * .36, label, size, 'Hei', tcol, 'middle', weight=900, filt='hand')


# ———————————— 网页 ————————————
wx, wy, ww, wh = 50, 70, 1300, 950
w = [f'<rect width="{ww}" height="{wh}" fill="{CREAM}"/>']
w.append(T(48, 98, 'KINO', 58, 'Lond', INK, ls=3, filt='hand') + T(216, 96, '影展', 46, 'Hei', RED, weight=900, filt='hand'))
for i, t in enumerate(['片单', '海报', '票务', '关于']):
    w.append(T(800 + i * 120, 92, t, 30, 'Kuai', INK, filt='hand'))
w.append(brush([(30, 132), (500, 128), (900, 136), (1270, 130)], 7, INK, seed=50, n=5, dry=.1, taper=(.02, .05), bw=(1.5, 3), op=1))
# 主视觉：一张大海报
w.append(f'<g filter="url(#sh)">{keyhole_poster(60, 176, 500, 690)}</g>')
# 右边：片名、一句话、场次、笔刷按钮
w.append(T(600, 300, '窥', 190, 'Hei', INK, weight=900, filt='hand'))
w.append(T(800, 236, 'THE', 46, 'Lond', RED, ls=3, filt='hand') + T(800, 300, 'KEYHOLE', 68, 'Lond', RED, ls=3, filt='hand'))
w.append(T(604, 372, '一扇门，一个孔，一只眼睛。看的人也在被看。', 28, 'Kuai', INK, filt='hand'))
w.append(T(604, 420, '1962 · 黑白 · 84 分钟 · 波兰语，中文字幕', 22, 'Mono', '#5b5040'))
for i, (d, t) in enumerate((('周五 12.06', '19:30'), ('周六 12.07', '14:00'), ('周六 12.07', '21:10'))):
    y = 476 + i * 58
    w.append(T(604, y, d, 28, 'Kuai', INK, filt='hand') + T(820, y, t, 34, 'Lond', RED if i == 0 else INK, ls=1, filt='hand'))
    if i == 0:
        w.append(f'<path d="M800,{y - 40} C860,{y - 52} 930,{y - 44} 940,{y - 18} C946,{y + 8} 880,{y + 16} 820,{y + 10} C790,{y + 6} 786,{y - 30} 810,{y - 42}" fill="none" stroke="{RED}" stroke-width="4" filter="url(#hand)"/>')
w.append(stroke_button(760, 690, 330, 88, '买票 ¥45', 44, seed=51))
w.append(T(950, 702, '← 按下：这一笔从左刷到右', 22, 'Kuai', '#5b5040', filt='hand'))
# 底下：另外三部
w.append(T(604, 830, '同一周还有 ▸', 26, 'Kuai', INK, filt='hand'))
for i, f in enumerate((bulb_poster, tree_poster, bird_poster)):
    x = 800 + i * 160
    w.append(f'<g filter="url(#sh)">{f(x, 760, 140, 172)}</g>')
web = (f'<g transform="translate({wx},{wy})"><rect x="-4" y="-56" width="{ww + 8}" height="{wh + 60}" rx="14" fill="{INK}" filter="url(#sh)"/>'
       + ''.join(f'<circle cx="{28 + i * 26}" cy="-26" r="8" fill="{c}"/>' for i, c in enumerate([RED, OCHRE, CREAM]))
       + f'<rect x="120" y="-42" width="420" height="32" rx="16" fill="#2a251d"/>' + T(140, -19, 'kino-festiwal.pl', 19, 'Mono', CREAM)
       + f'<clipPath id="wc"><rect width="{ww}" height="{wh}"/></clipPath><g clip-path="url(#wc)">{"".join(w)}</g></g>')

# ———————————— 手机 ————————————
px, py, pw, ph = 1440, 86, 420, 908
p = [f'<rect width="{pw}" height="{ph}" fill="{CREAM}"/>']
p.append(T(32, 44, '19:02', 19, 'Mono', INK) + T(pw - 32, 44, '82%', 19, 'Mono', INK, 'end'))
p.append(T(30, 104, 'KINO', 44, 'Lond', INK, ls=3, filt='hand') + T(160, 102, '今晚', 34, 'Hei', RED, weight=900, filt='hand'))
p.append(f'<g filter="url(#sh)">{keyhole_poster(30, 130, 360, 470)}</g>')
p.append(T(30, 660, '窥', 64, 'Hei', INK, weight=900, filt='hand') + T(110, 650, 'THE KEYHOLE', 30, 'Lond', RED, ls=2, filt='hand'))
p.append(T(32, 698, '19:30 · 3 号厅 · 第 6 排', 22, 'Kuai', '#5b5040', filt='hand'))
# 选座的点：选中的一排点变成一行小鸟
for r in range(2):
    for c in range(9):
        x, y = 50 + c * 40, 738 + r * 34
        if r == 1 and 3 <= c <= 4:
            p.append(gull(x, y + 2, 16, -6, RED))
        else:
            p.append(f'<circle cx="{x}" cy="{y}" r="9" fill="{INK}" opacity="{.25 if (r + c) % 4 == 0 else .85}" filter="url(#hand)"/>')
p.append(stroke_button(pw / 2, 848, 330, 80, '选好了 · ¥90', 36, seed=61))
phone = (f'<g transform="translate({px},{py})"><rect x="-14" y="-14" width="{pw + 28}" height="{ph + 28}" rx="62" fill="{INK}" filter="url(#sh)"/>'
         f'<clipPath id="pc"><rect width="{pw}" height="{ph}" rx="48"/></clipPath><g clip-path="url(#pc)">{"".join(p)}</g></g>')

note = (f'<g font-family="Mono" font-size="18" fill="{CREAM}" opacity=".85"><text x="{px - 22}" y="{py + 750}" text-anchor="end">选中的座位</text>'
        f'<text x="{px - 22}" y="{py + 776}" text-anchor="end">点 → 鸟 ▸</text></g>')

svg = (f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="position:absolute;left:0;top:0"><defs>{DEFS}</defs>'
       f'<rect width="{W}" height="{H}" fill="{BLUE2}"/><rect width="{W}" height="{H}" filter="url(#ground)" opacity=".25"/>'
       f'{web}{phone}<rect width="{W}" height="{H}" filter="url(#paper)" style="mix-blend-mode:multiply"/></svg>')
open('ui.html', 'w').write(page(W, H, svg))
