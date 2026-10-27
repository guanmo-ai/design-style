"""
待做风格 · 欧普艺术 Op Art —— 风格图（1080×1350）

  poster.svg      一张海报：上半是鼓起来的棋盘（Vasarely《Vega》式网格扭曲），下半是波浪条纹里“相位错开”的标题
  cheatsheet.svg  速查卡：五种让平面动起来的方法，每种带参数和可直接照抄的小样
  app-ui.svg      如果欧普艺术来做 app：一个呼吸练习，带标注

图形全部由公式生成：改一个参数（线宽、间距、相位、扭曲半径），而不是画一个形状。
用法：python3 drafts/op-art/images/make_svgs.py
"""
import math
import os
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1350

BLACK = '#0B0B0B'
WHITE = '#F3F1EB'
RED = '#E5322D'
TEAL = '#008C7E'  # 与 RED 明度相同（相对亮度 ≈ 0.19）：并排时边界会“颤”
GREY = '#77756F'

WIDE = "'Archivo', 'Helvetica Neue', Arial, 'Noto Sans SC', sans-serif"
MONO = "'Space Mono', 'JetBrains Mono', ui-monospace, 'Noto Sans SC', monospace"
SC = "'Noto Sans SC', 'PingFang SC', sans-serif"
LINES = "'Monoton', 'Archivo', sans-serif"


def t(x, y, size, text, family=SC, weight=400, fill=BLACK, ls='0', anchor='start', extra=''):
    return (
        f'<text x="{x:.1f}" y="{y:.1f}" font-family="{family}" font-weight="{weight}" '
        f'font-size="{size}" fill="{fill}" letter-spacing="{ls}" text-anchor="{anchor}" {extra}>'
        f'{escape(text)}</text>'
    )


def wide(wdth=125):
    return f'style="font-variation-settings:\'wdth\' {wdth}"'


def head(defs=''):
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img">\n'
        f'  <defs>{defs}</defs>\n'
    )


FOOT = '</svg>\n'


def poly(pts, fill):
    return '<path d="M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + f' Z" fill="{fill}"/>'


# ───────────────────────────── 公式 ─────────────────────────────

def bulge(cx, cy, R, a=0.9):
    """网格扭曲：半径 R 内 r' = r·(1 + a·(1 − (r/R)²)²) —— 中心放大 1 + a 倍，到边缘平滑归零，像一颗球顶出画面"""
    def f(x, y):
        dx, dy = x - cx, y - cy
        r = math.hypot(dx, dy)
        if r >= R:
            return x, y
        s = 1 + a * (1 - (r / R) ** 2) ** 2
        return cx + dx * s, cy + dy * s
    return f


def checker(x0, y0, cols, rows, cell, warp, colors=(BLACK, WHITE), sub=8, recolor=None):
    """棋盘：每个格子的四条边各细分 sub 段再扭曲，边是弯的"""
    out = [f'<rect x="{x0}" y="{y0}" width="{cols * cell}" height="{rows * cell}" fill="{colors[1]}"/>']
    for j in range(rows):
        for i in range(cols):
            if (i + j) % 2:
                continue
            ax, ay = x0 + i * cell, y0 + j * cell
            edge = []
            for s in range(sub):
                edge.append((ax + cell * s / sub, ay))
            for s in range(sub):
                edge.append((ax + cell, ay + cell * s / sub))
            for s in range(sub):
                edge.append((ax + cell - cell * s / sub, ay + cell))
            for s in range(sub):
                edge.append((ax, ay + cell - cell * s / sub))
            pts = [warp(x, y) for x, y in edge]
            fill = colors[0]
            if recolor:
                fill = recolor(ax + cell / 2, ay + cell / 2) or fill
            out.append(poly(pts, fill))
    return ''.join(out)


def wave_bands(x0, x1, y0, y1, period, amp, wl, phase=0.0, fill=BLACK, step=6, grow=True):
    """Riley 式波浪条纹：每条黑带上下边都是正弦；振幅从左到右变大（grow）"""
    out = []
    n = int((y1 - y0) / period) + 2
    xs = [x0 + i * step for i in range(int((x1 - x0) / step) + 1)] + [x1]

    def yy(base, x):
        a = amp * ((x - x0) / (x1 - x0) if grow else 1)
        return base + a * math.sin(2 * math.pi * (x - x0) / wl + phase + base * 0.012)

    for k in range(-1, n):
        base = y0 + k * period
        top = [(x, yy(base, x)) for x in xs]
        bot = [(x, yy(base + period / 2, x)) for x in reversed(xs)]
        out.append(poly(top + bot, fill))
    return ''.join(out)


def eccentric_rings(cx, cy, r0, n, shift=(-0.28, -0.32), colors=(BLACK, WHITE)):
    """偏心同心圆：圆越小，圆心越往一个方向挪 —— 平面变成球 / 隧道"""
    out = []
    for k in range(n):
        r = r0 * (1 - k / n)
        d = r0 - r
        out.append(f'<circle cx="{cx + shift[0] * d:.1f}" cy="{cy + shift[1] * d:.1f}" r="{r:.1f}" fill="{colors[k % 2]}"/>')
    return ''.join(out)


# ───────────────────────────── 海报 ─────────────────────────────

def poster():
    defs = (
        '<clipPath id="field"><rect x="60" y="60" width="960" height="780"/></clipPath>'
        '<clipPath id="stripes"><rect x="60" y="872" width="960" height="290"/></clipPath>'
        f'<clipPath id="title"><text x="540" y="1090" text-anchor="middle" font-family="{WIDE}" font-weight="900" '
        f'font-size="212" letter-spacing="-0.01em" {wide(108)}>OP ART</text></clipPath>'
    )
    s = [head(defs), f'<rect width="{W}" height="{H}" fill="{WHITE}"/>']
    cell = 60
    warp = bulge(540, 450, 440, 0.95)
    s.append(f'<g clip-path="url(#field)">{checker(60, 60, 16, 13, cell, warp)}</g>')
    # 下半：波浪条纹 + 相位错开的标题（标题只是同一组条纹错开半个周期）
    P = 14
    s.append(f'<g clip-path="url(#stripes)"><rect x="60" y="872" width="960" height="290" fill="{WHITE}"/>'
             f'{wave_bands(40, 1040, 860, 1180, P, 9, 240)}</g>')
    s.append(f'<g clip-path="url(#stripes)"><g clip-path="url(#title)"><rect x="0" y="860" width="{W}" height="320" fill="{WHITE}"/>'
             f'{wave_bands(40, 1040, 860 + P / 2, 1180, P, 9, 240)}</g></g>')
    # 信息条
    s.append(f'<rect x="60" y="1186" width="960" height="4" fill="{BLACK}"/>')
    s.append(t(60, 1262, 58, '欧普艺术', SC, 900, BLACK, '0.02em'))
    s.append(t(60, 1300, 15, 'OPTICAL ART · 1955—1970', MONO, 700, BLACK, '0.12em'))
    s.append(t(470, 1232, 20, '看久了，', SC, 700, BLACK))
    s.append(t(470, 1262, 20, '它就会动。', SC, 700, RED))
    s.append(t(470, 1300, 13, '只改一个参数：线宽 · 间距 · 相位', SC, 400, GREY))
    s.append(t(1020, 1232, 15, 'Design Style 风格 009', SC, 500, BLACK, '0', 'end'))
    s.append(t(1020, 1258, 15, '@guanmo_ai', MONO, 400, BLACK, '0', 'end'))
    s.append(t(1020, 1300, 13, 'VASARELY · RILEY · 1965 MoMA', MONO, 400, GREY, '0.04em', 'end'))
    s.append(FOOT)
    return ''.join(s)


# ───────────────────────────── 速查 ─────────────────────────────

def demo_weight(x, y, sz):
    """线宽调制：间距不变，线宽按正弦变化 —— 平的线圈出一根圆柱"""
    o = [f'<rect x="{x}" y="{y}" width="{sz}" height="{sz}" fill="{WHITE}"/>']
    gap = 10
    for j in range(int(sz / gap)):
        yy = y + gap / 2 + j * gap
        pts = []
        steps = 40
        for i in range(steps + 1):
            xx = x + sz * i / steps
            w = 0.8 + 6.2 * math.sin(math.pi * i / steps) ** 2
            pts.append((xx, yy - w / 2))
        for i in range(steps, -1, -1):
            xx = x + sz * i / steps
            w = 0.8 + 6.2 * math.sin(math.pi * i / steps) ** 2
            pts.append((xx, yy + w / 2))
        o.append(poly(pts, BLACK))
    return ''.join(o)


def demo_warp(x, y, sz):
    c = sz / 9
    return checker(x, y, 9, 9, c, bulge(x + sz / 2, y + sz / 2, sz * 0.5, 0.9), sub=6)


def demo_moire(x, y, sz, cid):
    o = [f'<clipPath id="{cid}"><rect x="{x}" y="{y}" width="{sz}" height="{sz}"/></clipPath>',
         f'<rect x="{x}" y="{y}" width="{sz}" height="{sz}" fill="{WHITE}"/><g clip-path="url(#{cid})" fill="none" stroke="{BLACK}" stroke-width="2.6">']
    for cx in (x + sz / 2 - 9, x + sz / 2 + 9):
        for k in range(1, 22):
            o.append(f'<circle cx="{cx}" cy="{y + sz / 2}" r="{k * 6.2:.1f}"/>')
    o.append('</g>')
    return ''.join(o)


def demo_phase(x, y, sz, cid):
    P = 12
    o = [f'<clipPath id="{cid}"><circle cx="{x + sz / 2}" cy="{y + sz / 2}" r="{sz * 0.32}"/></clipPath>',
         f'<rect x="{x}" y="{y}" width="{sz}" height="{sz}" fill="{WHITE}"/>']
    bars = ''.join(f'<rect x="{x + i * P}" y="{y}" width="{P / 2}" height="{sz}" fill="{BLACK}"/>' for i in range(int(sz / P)))
    o.append(bars)
    o.append(f'<g clip-path="url(#{cid})"><rect x="{x}" y="{y}" width="{sz}" height="{sz}" fill="{WHITE}"/>')
    o.append(''.join(f'<rect x="{x + i * P + P / 2}" y="{y}" width="{P / 2}" height="{sz}" fill="{BLACK}"/>' for i in range(-1, int(sz / P))))
    o.append('</g>')
    return ''.join(o)


def demo_vibe(x, y, sz):
    o = [f'<rect x="{x}" y="{y}" width="{sz}" height="{sz}" fill="{TEAL}"/>']
    for i in range(int(sz / 10)):
        o.append(f'<rect x="{x}" y="{y + i * 10 + 2}" width="{sz}" height="5" fill="{RED}"/>')
    o.append(f'<rect x="{x + sz * 0.3}" y="{y + sz * 0.3}" width="{sz * 0.4}" height="{sz * 0.4}" fill="{RED}"/>')
    for i in range(int(sz * 0.4 / 10)):
        o.append(f'<rect x="{x + sz * 0.3 + i * 10 + 2}" y="{y + sz * 0.3}" width="5" height="{sz * 0.4}" fill="{TEAL}"/>')
    return ''.join(o)


def cheatsheet():
    s = [head(), f'<rect width="{W}" height="{H}" fill="{WHITE}"/>']
    L = 90
    s.append(t(L, 150, 84, 'OP ART', WIDE, 900, BLACK, '-0.01em', extra=wide(118)))
    s.append(t(L, 196, 23, '速查 · 五种让平面动起来的方法', SC, 700, BLACK))
    # 右上：颜色 + 字
    chips = [(BLACK, '黑', '#0B0B0B'), (WHITE, '白', '#F3F1EB'), (RED, '红', '#E5322D'), (TEAL, '青', '#008C7E')]
    for i, (c, n, hx) in enumerate(chips):
        x = 640 + i * 90
        s.append(f'<rect x="{x}" y="86" width="74" height="56" fill="{c}" stroke="{BLACK}" stroke-width="{1.5 if c == WHITE else 0}"/>')
        s.append(t(x, 162, 13, n + ' ' + hx, MONO, 400, BLACK, '-0.02em'))
    s.append(t(640, 196, 13, '黑白 90%；红 / 青只成对出现（同明度才会颤）', SC, 400, GREY))
    s.append(f'<rect x="{L}" y="222" width="{W - 2 * L}" height="3" fill="{BLACK}"/>')
    rows = [
        ('01', '线宽调制', 'LINE WEIGHT', '间距固定 10px，线宽 0.8 → 7 → 0.8 按正弦变。', '平面出体积，不用一点渐变。', '间距跟着变就成了“疏密”，体积会塌', lambda x, y, z: demo_weight(x, y, z)),
        ('02', '网格扭曲', 'GRID WARP', '半径 R 内 r′ = r·(1 + a(1 − r²/R²)²)，a ≈ 0.9。', 'Vasarely《Vega》(1957) 的球就是这一行公式。', '只扭一处；全屏都扭像哈哈镜', lambda x, y, z: demo_warp(x, y, z)),
        ('03', '摩尔纹', 'MOIRÉ', '两组同心圆，间距 6.2px，圆心错开 18px。', '两层规则的东西叠出第三层“不存在”的图形。', '线太细会被屏幕重采样吃掉，≥ 2.5px', lambda x, y, z: demo_moire(x, y, z, 'mo')),
        ('04', '相位错位', 'PHASE SHIFT', '同一组条纹，形状里错开半个周期（6px）。', '没有轮廓线，字和图只靠“错开”显形。', '周期 < 8px 时手机上会糊成灰', lambda x, y, z: demo_phase(x, y, z, 'ph')),
        ('05', '同明度对比', 'VIBRATION', '红 #E5322D × 青 #008C7E，相对亮度都 ≈ 0.19。', '亮度一样、色相相反，边界自己会“颤”。', '只用在装饰；正文用这对颜色读不了', lambda x, y, z: demo_vibe(x, y, z)),
    ]
    sz = 156
    for i, (num, zh, en, how, why, care, fn) in enumerate(rows):
        y = 256 + i * 186
        s.append(fn(L, y, sz))
        tx = L + sz + 34
        s.append(t(tx, y + 30, 16, num, MONO, 700, RED))
        s.append(t(tx + 40, y + 32, 28, zh, SC, 900, BLACK))
        s.append(t(tx + 40 + len(zh) * 29 + 14, y + 30, 14, en, MONO, 700, GREY, '0.06em'))
        s.append(t(tx, y + 74, 18, how, SC, 500, BLACK))
        s.append(t(tx, y + 104, 16, why, SC, 400, BLACK, extra='opacity="0.75"'))
        s.append(t(tx, y + 138, 14, '小心：' + care, SC, 400, RED))
        if i < 4:
            s.append(f'<path d="M{tx} {y + 170} H{W - L}" stroke="{BLACK}" stroke-width="0.8" opacity="0.2"/>')
    # 动效警告
    wy = 1196
    s.append(f'<rect x="{L}" y="{wy}" width="{W - 2 * L}" height="110" fill="{BLACK}"/>')
    s.append(t(L + 26, wy + 38, 19, '⚠  动起来之前', SC, 700, WHITE))
    s.append(t(L + 26, wy + 66, 15, '大面积高对比条纹 + 运动可能引发眩晕或光敏反应：每秒闪烁 ≤ 3 次（WCAG 2.3.1）；', SC, 400, WHITE, extra='opacity="0.85"'))
    s.append(t(L + 26, wy + 70 + 22, 15, '条纹动效要能暂停，并跟随系统“减少动态效果”。', SC, 400, WHITE, extra='opacity="0.85"'))
    s.append(t(W - L - 26, wy + 38, 14, 'prefers-reduced-motion → 停在静帧', MONO, 400, WHITE, '0', 'end'))
    s.append(FOOT)
    return ''.join(s)


# ───────────────────────────── App ─────────────────────────────

def callout(n, x, y, tx, title, body):
    o = [
        f'<path d="M{x} {y} H{tx - 16}" stroke="{BLACK}" stroke-width="1.2"/>',
        f'<circle cx="{x}" cy="{y}" r="4.5" fill="{RED}"/>',
        f'<circle cx="{tx}" cy="{y}" r="14" fill="{BLACK}"/>',
        t(tx, y + 5, 14, str(n), MONO, 700, WHITE, '0', 'middle'),
        t(tx + 26, y - 6, 19, title, SC, 700, BLACK),
    ]
    for i, line in enumerate(body):
        o.append(t(tx + 26, y + 20 + i * 21, 14, line, SC, 400, BLACK, '0', 'start', 'opacity="0.7"'))
    return ''.join(o)


def app_ui():
    px, py, pw, ph = 96, 300, 412, 900
    cx = px + pw / 2
    defs = (
        f'<clipPath id="screen"><rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="46"/></clipPath>'
        f'<clipPath id="bar"><rect x="{px + 36}" y="{py + 650}" width="{pw - 72}" height="36"/></clipPath>'
        f'<clipPath id="barOn"><rect x="{px + 36}" y="{py + 650}" width="{(pw - 72) * 0.42}" height="36"/></clipPath>'
    )
    s = [head(defs), f'<rect width="{W}" height="{H}" fill="{WHITE}"/>']
    # 背景：极细的竖条纹（只在右侧边缘，不进内容）
    s.append(t(96, 140, 14, 'OP ART · APP', MONO, 700, RED, '0.2em'))
    s.append(t(96, 194, 44, '如果欧普艺术来做 App', SC, 900, BLACK))
    s.append(t(96, 232, 17, '一个呼吸练习：画面不靠插图，只靠线宽、偏心和相位。', SC, 400, BLACK, extra='opacity="0.7"'))
    # 手机
    s.append(f'<rect x="{px - 12}" y="{py - 12}" width="{pw + 24}" height="{ph + 24}" rx="58" fill="{BLACK}"/>')
    sc = [f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" fill="{WHITE}"/>']
    sc.append(t(px + 34, py + 40, 15, '07:42', MONO, 700, BLACK))
    sc.append(t(px + pw - 34, py + 40, 13, '●●● ▮', MONO, 700, BLACK, '0', 'end'))
    sc.append(t(px + 34, py + 104, 13, 'BREATHE · 4—7—8', MONO, 700, BLACK, '0.1em'))
    sc.append(t(px + pw - 34, py + 104, 13, '3 / 8', MONO, 700, RED, '0', 'end'))
    # 主图：偏心同心圆
    sc.append(eccentric_rings(cx, py + 330, 168, 24))
    # 文案
    sc.append(t(cx, py + 580, 46, '吸 气', SC, 900, BLACK, '0.1em', 'middle'))
    sc.append(t(cx, py + 616, 15, '4 秒 · 跟着圆往里走', SC, 400, BLACK, '0', 'middle', 'opacity="0.6"'))
    # 进度：同一组斜条纹，已完成的部分错开半个周期
    P = 12
    P = 9
    stripes = ''.join(f'<rect x="{px}" y="{py + 650 + i * P}" width="{pw}" height="{P / 2}" fill="{BLACK}"/>' for i in range(5))
    stripes_on = ''.join(f'<rect x="{px}" y="{py + 650 + i * P - P / 2}" width="{pw}" height="{P / 2}" fill="{BLACK}"/>' for i in range(6))
    sc.append(f'<g clip-path="url(#bar)">{stripes}</g>')
    sc.append(f'<g clip-path="url(#barOn)"><rect x="{px}" y="{py + 650}" width="{pw}" height="36" fill="{WHITE}"/>{stripes_on}</g>')
    sc.append(f'<rect x="{px + 36}" y="{py + 650}" width="{pw - 72}" height="36" fill="none" stroke="{BLACK}" stroke-width="2"/>')
    sc.append(t(px + 36, py + 712, 12, '00:42', MONO, 400, BLACK))
    sc.append(t(px + pw - 36, py + 712, 12, '01:40', MONO, 400, BLACK, '0', 'end'))
    # 按钮
    by = py + 748
    sc.append(f'<rect x="{px + 36}" y="{by}" width="{pw - 72}" height="64" fill="{BLACK}"/>')
    sc.append(t(cx, by + 41, 19, '暂 停', SC, 700, WHITE, '0.2em', 'middle'))
    # 标签栏
    ty = py + ph - 62
    sc.append(f'<path d="M{px} {ty} H{px + pw}" stroke="{BLACK}" stroke-width="1"/>')
    for i in range(4):
        x = px + pw * (i + 0.5) / 4
        on = i == 0
        sc.append(f'<g transform="translate({x} {ty + 30})">')
        if on:
            sc.append(eccentric_rings(0, 0, 12, 4))
        else:
            sc.append(f'<circle r="11" fill="none" stroke="{BLACK}" stroke-width="1.6" opacity="0.45"/>')
        sc.append('</g>')
    s.append(f'<g clip-path="url(#screen)">{"".join(sc)}</g>')
    # 右上：同一套做法的 app 图标
    TX = 590
    s.append(t(TX, 330, 13, 'APP ICONS · 同一套公式', MONO, 700, BLACK, '0.08em'))
    icons = [
        ('rings', lambda x, y: eccentric_rings(x + 55, y + 55, 44, 10)),
        ('phase', lambda x, y: demo_phase(x + 11, y + 11, 88, 'iph')),
        ('warp', lambda x, y: demo_warp(x + 11, y + 11, 88)),
    ]
    for i, (k, fn) in enumerate(icons):
        x, y = TX + i * 140, 350
        s.append(f'<clipPath id="ic-{k}"><rect x="{x}" y="{y}" width="110" height="110" rx="26"/></clipPath>')
        s.append(f'<g clip-path="url(#ic-{k})"><rect x="{x}" y="{y}" width="110" height="110" fill="{WHITE}"/>{fn(x, y)}</g>')
        s.append(f'<rect x="{x}" y="{y}" width="110" height="110" rx="26" fill="none" stroke="{BLACK}" stroke-width="2"/>')
        s.append(t(x + 55, y + 136, 12, ['偏心圆', '相位', '扭曲'][i], SC, 500, BLACK, '0', 'middle'))
    # 标注
    s.append(callout(1, cx + 120, py + 250, TX, '偏心同心圆 = 体积', ['24 个圆，越小的越往左上挪；', '不画阴影，球自己鼓出来。']))
    s.append(callout(2, cx + 150, py + 380, TX, '动的是相位，不是位置', ['吸气 4 秒：圆环整体向内流一个周期；', '呼气反过来。形状本身一动不动。']))
    s.append(callout(4, px + pw - 36, py + 668, TX, '进度 = 错开半个周期', ['同一组横条纹，走过的部分下移 4.5px，', '接缝就是进度。不用第二种颜色。']))
    s.append(callout(3, cx + 80, py + 572, TX, '文字区不放条纹', ['条纹贴着字会“咬字”。', '字只放在纯白或纯黑上。']))
    s.append(callout(5, px + pw - 36, by + 32, TX, '红色只给一个数字', ['整屏 90% 黑白，', '红只标“第几轮”。']))
    s.append(t(TX, 1180, 13, 'TOKENS', MONO, 700, RED, '0.2em'))
    for i, tok in enumerate(['--period: 9px', '--phase: 0.5 period', '--rings: 24 · shift −0.3', '--weight: 0.8 → 7px', '--reduce-motion: static']):
        s.append(t(TX, 1208 + i * 20, 14, tok, MONO, 400, BLACK))
    s.append(t(96, 1300, 13, 'Design Style 风格 009 · @guanmo_ai', SC, 400, GREY))
    s.append(FOOT)
    return ''.join(s)


def main():
    for name, fn in (('poster', poster), ('cheatsheet', cheatsheet), ('app-ui', app_ui)):
        path = os.path.join(HERE, f'{name}.svg')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(fn())
        print('wrote', os.path.relpath(path))


if __name__ == '__main__':
    main()
