"""
015 · 未来主义 Futurism —— 风格图（1080×1350）

  poster.svg      海报：VELOCITÀ 带着残影冲过去、力线、滚动的轮子、越来越小的拟声字
  cheatsheet.svg  速查卡：残影公式、字宽 = 速度、力线、拟声排版、五种颜色、五条规则
  app-ui.svg      如果未来主义来做 App：一个骑行记录页，带标注
  steps.svg       四步改造：同一张普通海报，每一步只改一件事

一条物理规则贯穿全部：**动的东西留下它刚才的样子**——
残影第 k 个 = k·Δt 前的样子（Δt = 3 帧 = 1/20 秒），不透明度 0.6^k——间距因此 = 当时的速度 × 时间（加速时越拉越开，刹车时挤在一起）。
字宽也跟着速度走：Archivo 的 wdth 轴 62（停）→ 125（全速）。
用法：python3 styles/015-futurism/images/make_svgs.py
"""
import math
import os
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1350
NO = '015'

INK = '#16130F'
PAPER = '#EDE5D3'
ORANGE = '#F2501C'
COBALT = '#1F3FD0'
SILVER = '#B9BDC3'
MUTE = '#776F62'

ARCHIVO = "'Archivo', 'Noto Sans SC', sans-serif"
MONO = "'Space Mono', monospace"
SC = "'Noto Sans SC', 'PingFang SC', sans-serif"


def t(x, y, size, text, family=ARCHIVO, weight=400, fill=INK, ls='0', anchor='start', extra='', wdth=None):
    style = f' style="font-variation-settings:\'wdth\' {wdth}"' if wdth else ''
    return (
        f'<text x="{x:.1f}" y="{y:.1f}" font-family="{family}" font-weight="{weight}" '
        f'font-size="{size}" fill="{fill}" letter-spacing="{ls}" text-anchor="{anchor}"{style} {extra}>'
        f'{escape(text)}</text>'
    )


def doc(body, defs=''):
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img">\n'
        f'  <defs>\n    {defs}\n  </defs>\n{body}\n</svg>\n'
    )


def echoes(draw, n=6, step=24, accel=1.25, alpha=0.6, dx=-1, dy=0, color=None):
    """
    残影：draw(ox, oy, opacity, k) 画第 k 层（k = 0 是本体）。
    第 k 层往运动反方向退 Σ step·accel^i；不透明度 alpha^k。先画远的，本体最后画。
    """
    offs, acc = [0.0], 0.0
    for k in range(1, n + 1):
        acc += step * accel ** (n - k)  # 越早的残影间距越小 → 读起来是在加速
        offs.append(acc)
    out = []
    for k in range(n, -1, -1):
        out.append(draw(dx * offs[k], dy * offs[k], alpha ** k, k))
    return ''.join(out)


def wedge(x0, y0, x1, y1, w0, w1, fill, op=1.0):
    """力线：一端宽一端尖的楔形"""
    ang = math.atan2(y1 - y0, x1 - x0)
    nx, ny = -math.sin(ang), math.cos(ang)
    pts = [(x0 + nx * w0 / 2, y0 + ny * w0 / 2), (x1 + nx * w1 / 2, y1 + ny * w1 / 2),
           (x1 - nx * w1 / 2, y1 - ny * w1 / 2), (x0 - nx * w0 / 2, y0 - ny * w0 / 2)]
    d = 'M' + ' L'.join(f'{a:.1f} {b:.1f}' for a, b in pts) + 'Z'
    return f'<path d="{d}" fill="{fill}" fill-opacity="{op}"/>'


def wheel(cx, cy, r, rot, color=INK, sw=8, op=1.0):
    spokes = ''.join(
        f'<line x1="{cx:.1f}" y1="{cy:.1f}" x2="{cx + r * math.cos(rot + i * math.pi / 6):.1f}" '
        f'y2="{cy + r * math.sin(rot + i * math.pi / 6):.1f}"/>' for i in range(12)
    )
    return (
        f'<g stroke="{color}" stroke-opacity="{op}" fill="none" stroke-width="{sw}">'
        f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r}"/><circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r * 0.18:.1f}"/>'
        f'<g stroke-width="{sw * 0.35:.1f}">{spokes}</g></g>'
    )


# ======================================================================
# 海报
# ======================================================================

def poster():
    b = [f'<rect width="{W}" height="{H}" fill="{PAPER}"/>']
    # 力线：从左后方往右前方收拢
    for i, (y0, y1, w0, c, op) in enumerate([
        (180, 470, 210, ORANGE, 1), (520, 520, 160, COBALT, 1), (820, 610, 180, ORANGE, 0.9),
        (330, 500, 70, INK, 1), (690, 560, 60, INK, 1), (1010, 700, 120, COBALT, 0.85),
    ]):
        b.append(wedge(-40, y0, 1120, y1, w0, 2, c, op))
    b.append(t(64, 92, 20, f'NO. {NO} · 1909—1944', MONO, 700, INK, '2'))
    b.append(t(1016, 92, 20, 'MANIFESTO', MONO, 700, INK, '2', 'end'))

    # VELOCITÀ：本体 + 6 个残影（间距越往前越大 → 在加速）
    b.append(echoes(lambda ox, oy, a, k: t(1020 + ox, 470 + oy, 150, 'VELOCITÀ', ARCHIVO, 900,
                                           INK if k == 0 else COBALT, '-4', 'end', f'opacity="{a:.3f}"',
                                           wdth=116 - k * 8), n=6, step=26, accel=1.35))
    # 未来主义：橙色残影往左拖
    b.append(echoes(lambda ox, oy, a, k: t(64 + ox, 760 + oy, 196, '未来主义', SC, 900,
                                           INK if k == 0 else ORANGE, '-6', 'start', f'opacity="{a:.3f}"'),
                    n=5, step=14, accel=1.5, dx=-1))
    # 速度线穿过汉字
    for i, (y, w, l) in enumerate([(640, 4, 520), (690, 2, 760), (735, 6, 380)]):
        b.append(f'<rect x="{W - l}" y="{y}" width="{l}" height="{w}" fill="{INK}"/>')

    # 滚动的轮子：边滚边转，残影跟着转回去
    rr = 128
    b.append(echoes(lambda ox, oy, a, k: wheel(790 + ox, 1010, rr, -ox / rr, INK if k == 0 else COBALT, 10, a),
                    n=5, step=30, accel=1.3))

    # 拟声字：越来越小 = 声音在远去
    b.append(t(70, 935, 92, 'ZANG', ARCHIVO, 900, INK, '-2', 'start', 'transform="rotate(-8 70 935)"', wdth=125))
    b.append(t(120, 1030, 60, 'TUMB', ARCHIVO, 800, INK, '0', 'start', 'transform="rotate(5 120 1030)"', wdth=110))
    b.append(t(170, 1092, 40, 'TUMB', ARCHIVO, 700, INK, '0', 'start', 'transform="rotate(-4 170 1092)"', wdth=90))
    b.append(t(204, 1132, 26, 'tumb', ARCHIVO, 600, INK, '0', 'start', '', wdth=75))

    # 底：一句话
    b.append(f'<rect x="0" y="1196" width="{W}" height="{H - 1196}" fill="{INK}"/>')
    b.append(t(64, 1262, 34, '动的东西，留下它刚才的样子。', SC, 900, PAPER))
    b.append(t(64, 1306, 18, '残影 6 层 · 不透明度 0.6^k · 间距 = 速度 × 时间', SC, 500, SILVER))
    b.append(t(1016, 1306, 18, 'FUTURISMO', MONO, 700, ORANGE, '3', 'end'))
    return doc(''.join(b))


# ======================================================================
# 速查卡
# ======================================================================

def cheatsheet():
    b = [f'<rect width="{W}" height="{H}" fill="{PAPER}"/>']
    b.append(echoes(lambda ox, oy, a, k: t(64 + ox, 150, 104, 'FUTURISM', ARCHIVO, 900, INK if k == 0 else ORANGE,
                                           '-2', 'start', f'opacity="{a:.3f}"', wdth=125),
                    n=4, step=10, accel=1.4, dx=1))
    b.append(t(64, 204, 28, '速查 · 一条残影公式、字宽 = 速度、力线、五条规则', SC, 900, INK))
    b.append(t(1016, 204, 18, f'NO. {NO} · 1909—1944', MONO, 700, MUTE, '2', 'end'))

    # 01 残影公式：三种速度
    b.append(t(64, 268, 20, '01  残影 · 间距 = 速度 × 时间，不透明度 = 0.6^k', SC, 700, COBALT, '1'))
    rows = [('加速', 1.45, 10), ('匀速', 1.0, 34), ('刹车', 0.7, 60)]
    for i, (lbl, acc, st) in enumerate(rows):
        y = 318 + i * 60
        b.append(t(64, y + 8, 22, lbl, SC, 900, INK))
        b.append(f'<line x1="150" y1="{y}" x2="640" y2="{y}" stroke="{INK}" stroke-opacity="0.15" stroke-width="2"/>')
        b.append(echoes(lambda ox, oy, a, k: f'<circle cx="{620 + ox:.1f}" cy="{y}" r="17" fill="{ORANGE if k else INK}" fill-opacity="{a:.3f}"/>',
                        n=6, step=st, accel=acc))
    vals = [('n', '6 层（停下全部收进本体）'), ('αₖ', '0.6^k → 1 · .6 · .36 · .22'), ('Δt', '3 帧 = 1/20 s'), ('方向', '只往运动反方向拖')]
    for i, (k, v) in enumerate(vals):
        y = 312 + i * 34
        b.append(t(690, y, 18, k, MONO, 700, ORANGE) + t(750, y, 18, v, SC, 500, INK))

    # 02 字宽 = 速度
    b.append(t(64, 528, 20, '02  字宽 = 速度 · Archivo 的 wdth 轴', SC, 700, COBALT, '1'))
    for i, (wd, sp) in enumerate([(62, '停'), (75, '20 km/h'), (100, '40 km/h'), (125, '60 km/h')]):
        x = 64 + [0, 170, 360, 600][i]
        b.append(t(x, 620, 76, 'GO', ARCHIVO, 900, INK, '-1', 'start', '', wdth=wd))
        b.append(t(x, 656, 16, f'wdth {wd}', MONO, 700, ORANGE) + t(x, 680, 16, sp, SC, 500, MUTE))
    b.append(t(890, 600, 17, '加速时拉宽，', SC, 500, INK) + t(890, 626, 17, '刹车时压窄，', SC, 500, INK) + t(890, 652, 17, '字重不变。', SC, 500, INK))

    # 03 力线 + 04 拟声
    b.append(t(64, 738, 20, '03  力线：楔形，全部收向运动方向', SC, 700, COBALT, '1'))
    b.append(f'<rect x="64" y="758" width="440" height="220" fill="{INK}"/>')
    for y0, y1, w0, c in [(770, 850, 70, ORANGE), (830, 860, 40, PAPER), (900, 868, 90, COBALT), (960, 880, 50, ORANGE)]:
        b.append(wedge(64, y0, 490, y1, w0, 2, c))
    b.append(f'<circle cx="490" cy="866" r="6" fill="{PAPER}"/>')
    b.append(t(540, 738, 20, '04  拟声：越响越大，越远越小', SC, 700, COBALT, '1'))
    for i, (wd, sz, w) in enumerate([('ZANG', 84, 900), ('TUMB', 56, 800), ('TUMB', 38, 700), ('tumb', 26, 600)]):
        b.append(t(540 + i * 22, 840 + [0, 56, 100, 134][i], sz, wd, ARCHIVO, w, ORANGE if i == 0 else INK, '0', 'start', '', wdth=125 - i * 15))
    b.append(t(800, 930, 16, '每一级 ÷ 1.5', MONO, 700, MUTE) + t(800, 954, 16, '96 → 64 → 42 → 28', MONO, 400, MUTE))

    # 05 颜色
    b.append(t(64, 1030, 20, '05  颜色 · 比例 50 / 25 / 12 / 8 / 5', SC, 700, COBALT, '1'))
    sw = [(PAPER, '纸', 'PAPER'), (INK, '炭', 'INK'), (ORANGE, '速度橙', 'ORANGE'), (COBALT, '钴蓝', 'COBALT'), (SILVER, '铬银', 'SILVER')]
    for i, (c, n, _) in enumerate(sw):
        x = 64 + i * 112
        b.append(f'<rect x="{x}" y="1050" width="100" height="72" fill="{c}" stroke="{INK}" stroke-width="2"/>')
        b.append(t(x, 1146, 17, n, SC, 900, INK) + t(x, 1166, 13, c, MONO, 400, MUTE))

    # 06 规则 + CSS
    rules = ['动的才有残影；静的一层都不要', '残影只往反方向拖，不加模糊', '速度变了，间距和字宽一起变', '力线收向前方，最多 6 条']
    b.append(t(640, 1030, 20, '06  规则', SC, 700, COBALT, '1'))
    for i, r in enumerate(rules):
        b.append(t(640, 1066 + i * 30, 16, f'0{i + 1}', MONO, 700, ORANGE) + t(672, 1066 + i * 30, 17, r, SC, 500, INK))
    css = ['.fast {', "  font-variation-settings: 'wdth' 125;", '  text-shadow: -14px 0 #F2501C99,', '    -30px 0 #F2501C5C, -50px 0 #F2501C37;', '}']
    b.append(f'<rect x="64" y="1200" width="952" height="104" fill="{INK}"/>')
    for i, line in enumerate(css):
        b.append(t(84, 1226 + i * 18, 14, line, MONO, 400, PAPER if 0 < i < 4 else ORANGE))
    b.append(t(1000, 1290, 13, f'Design Style 风格 {NO} · @guanmo_ai', MONO, 400, SILVER, '0', 'end'))
    return doc(''.join(b))


# ======================================================================
# App 概念：骑行记录
# ======================================================================

def app_ui():
    b = [f'<rect width="{W}" height="{H}" fill="{PAPER}"/>']
    b.append(t(72, 112, 20, 'FUTURISM · APP', MONO, 700, ORANGE, '3'))
    b.append(t(72, 180, 54, '如果未来主义来做 App', SC, 900, INK))
    b.append(t(72, 226, 22, '一个骑行页：速度不用仪表盘，用残影和字宽来“看见”。', SC, 400, MUTE))

    px, py, pw, ph, pr = 72, 280, 468, 990, 60
    b.append(f'<clipPath id="ph"><rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="{pr}"/></clipPath>')
    b.append(f'<g clip-path="url(#ph)"><rect x="{px}" y="{py}" width="{pw}" height="{ph}" fill="{INK}"/>')
    # 力线做背景
    for y0, y1, w0, c, op in [(py + 120, py + 300, 160, COBALT, 0.9), (py + 420, py + 330, 120, ORANGE, 0.85), (py + 560, py + 380, 60, SILVER, 0.35)]:
        b.append(wedge(px - 20, y0, px + pw + 20, y1, w0, 2, c, op))
    b.append(t(px + 34, py + 56, 18, '07:42', MONO, 700, PAPER))
    b.append(t(px + 34, py + 120, 18, 'RIDE · 第 12 公里', SC, 700, SILVER, '2'))
    # 速度数字：本体 + 残影；字宽按速度
    b.append(echoes(lambda ox, oy, a, k: t(px + pw - 40 + ox, py + 360, 210, '48', ARCHIVO, 900,
                                           PAPER if k == 0 else ORANGE, '-6', 'end', f'opacity="{a:.3f}"', wdth=118 - k * 8),
                    n=6, step=18, accel=1.35))
    b.append(t(px + pw - 40, py + 404, 22, 'KM/H · wdth 118', MONO, 700, PAPER, '1', 'end'))
    # 路线：一段轨迹 + 当前点的残影
    path = f'M{px + 40} {py + 640} C{px + 140} {py + 520} {px + 220} {py + 720} {px + 330} {py + 600} S{px + 420} {py + 520} {px + 430} {py + 500}'
    b.append(f'<path d="{path}" fill="none" stroke="{SILVER}" stroke-width="6" stroke-linecap="round" stroke-opacity="0.5"/>')
    b.append(echoes(lambda ox, oy, a, k: f'<circle cx="{px + 430 + ox * 0.9:.1f}" cy="{py + 500 - ox * 0.45:.1f}" r="14" fill="{ORANGE if k else PAPER}" fill-opacity="{a:.3f}"/>',
                    n=5, step=14, accel=1.3))
    # 三个读数：字宽各按自己的变化率
    for i, (lbl, v, wd) in enumerate([('平均', '31.6', 90), ('爬升', '412', 75), ('心率', '152', 105)]):
        x = px + 34 + i * 146
        b.append(t(x, py + 790, 16, lbl, SC, 700, SILVER) + t(x, py + 846, 48, v, ARCHIVO, 900, PAPER, '-1', 'start', '', wdth=wd))
    # 按钮：按下的一瞬，留下 3 层残影
    bx, by, bw, bh = px + 34, py + 880, pw - 68, 72
    b.append(echoes(lambda ox, oy, a, k: f'<rect x="{bx + ox:.1f}" y="{by}" width="{bw}" height="{bh}" rx="36" fill="{ORANGE}" fill-opacity="{a:.3f}"/>',
                    n=3, step=10, accel=1.3, dx=-1))
    b.append(t(bx + bw / 2, by + 47, 26, '冲刺 SPRINT', SC, 900, INK, '2', 'middle'))
    b.append('</g>')
    b.append(f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="{pr}" fill="none" stroke="{INK}" stroke-width="10"/>')

    notes = [
        (py + 300, '速度 = 残影数', '48 km/h 拖 6 层；停下时一层都不剩。\n间距按真实加速度算。'),
        (py + 404, '字宽跟着速度走', '数字的 wdth 从 62 拉到 118，\n字重不变，加速是“变宽”。'),
        (py + 520, '轨迹上只有“现在”在动', '路线是静的、不拖影；\n当前位置拖 5 层。'),
        (py + 916, '按下 = 往前冲一下', '120ms 内留下 3 层残影，\n比缩放更像“出发”。'),
    ]
    for i, (y, a, d) in enumerate(notes):
        b.append(f'<line x1="{px + pw - 24}" y1="{y}" x2="610" y2="{y}" stroke="{INK}" stroke-width="1.6"/>')
        b.append(f'<circle cx="{px + pw - 24}" cy="{y}" r="6" fill="{ORANGE}"/>')
        b.append(f'<circle cx="630" cy="{y}" r="18" fill="{INK}"/>' + t(630, y + 6, 17, str(i + 1), MONO, 700, PAPER, '0', 'middle'))
        b.append(t(664, y + 8, 22, a, SC, 900, INK))
        for k, line in enumerate(d.split('\n')):
            b.append(t(664, y + 38 + k * 26, 17, line, SC, 400, MUTE))
    b.append(t(612, 912, 16, 'TOKENS', MONO, 700, ORANGE, '3'))
    for i, line in enumerate(['--echo-count: 0 – 8', '--echo-alpha: 0.6^k', '--echo-gap: speed × Δt (3 帧)', '--wdth: 62 → 125', '@media (prefers-reduced-motion) → 1 层']):
        b.append(t(612, 942 + i * 24, 15, line, MONO, 400, INK))
    b.append(t(72, 1310, 15, f'Design Style 风格 {NO} · @guanmo_ai', MONO, 400, MUTE))
    return doc(''.join(b))


# ======================================================================
# 四步改造：同一张普通海报，每一步只改一件事
# ======================================================================

PW = 435  # 每格边长
CELLS = [(90, 222), (555, 222), (90, 758), (555, 758)]


def plain_bits(b, title_fill, sub_fill, btn_fill, bg, wheel_col, rounded=True):
    """原稿里不变的那几样：日期、地点、按钮（左下角水平放，永远好读）"""
    b.append(t(36, 352, 20, '10 月 24 日 周六 20:00', SC, 700, sub_fill))
    b.append(t(36, 380, 16, '滨江大道 · 全程 18 公里', SC, 400, sub_fill))
    r = 22 if rounded else 0
    b.append(f'<rect x="268" y="346" width="132" height="44" rx="{r}" fill="{btn_fill}"/>')
    b.append(t(334, 375, 17, '立即报名', SC, 900, PAPER if btn_fill != ORANGE else INK, '0', 'middle'))


def step_cell(k):
    b = []
    if k == 0:  # 原稿：居中、水平、五种颜色、圆角
        b.append(f'<rect width="{PW}" height="{PW}" fill="#E9EEF5"/>')
        b.append(f'<circle cx="60" cy="56" r="26" fill="#F3B6C8"/><circle cx="388" cy="70" r="12" fill="#3DB57A"/>')
        b.append(wheel(217, 118, 62, 0.3, '#3866D6', 7))
        b.append(t(217, 252, 64, 'NIGHT RIDE', ARCHIVO, 800, '#3866D6', '0', 'middle', wdth=100))
        b.append(t(217, 288, 18, '城 市 夜 骑', SC, 700, MUTE, '6', 'middle'))
        plain_bits(b, '#3866D6', INK, '#3DB57A', '#E9EEF5', '#3866D6')
    elif k == 1:  # 力线：只加四条楔形，尖端全部收向标题的前方
        b.append(f'<rect width="{PW}" height="{PW}" fill="#E9EEF5"/>')
        b.append(f'<circle cx="60" cy="56" r="26" fill="#F3B6C8"/><circle cx="388" cy="70" r="12" fill="#3DB57A"/>')
        for y0, w0, c in [(40, 70, '#3866D6'), (150, 30, INK), (250, 60, '#F3B6C8'), (300, 26, INK)]:
            b.append(wedge(-10, y0, 420, 214, w0, 2, c))
        b.append(wheel(330, 118, 62, 0.3, '#3866D6', 7))
        b.append(t(40, 238, 64, 'NIGHT RIDE', ARCHIVO, 800, '#3866D6', '0', 'start', wdth=100))
        b.append(t(42, 274, 18, '城 市 夜 骑', SC, 700, MUTE, '6'))
        plain_bits(b, '#3866D6', INK, '#3DB57A', '#E9EEF5', '#3866D6')
    elif k == 2:  # 残影：标题和轮子拖出 0.6^k 的残影，越往后越开 = 在加速
        b.append(f'<rect width="{PW}" height="{PW}" fill="#E9EEF5"/>')
        for y0, w0, c in [(40, 70, '#3866D6'), (150, 30, INK), (250, 60, '#F3B6C8'), (300, 26, INK)]:
            b.append(wedge(-10, y0, 420, 214, w0, 2, c))
        b.append(echoes(lambda ox, oy, a, kk: wheel(330 + ox, 118, 62, -ox / 62, '#3866D6', 7, a), n=5, step=16, accel=1.35))
        b.append(echoes(lambda ox, oy, a, kk: t(40 + ox, 238, 64, 'NIGHT RIDE', ARCHIVO, 800, '#3866D6', '0', 'start', f'opacity="{a:.3f}"', wdth=100),
                        n=5, step=9, accel=1.4))
        b.append(t(42, 274, 18, '城 市 夜 骑', SC, 700, MUTE, '6'))
        plain_bits(b, '#3866D6', INK, '#3DB57A', '#E9EEF5', '#3866D6')
    else:  # 字宽 = 速度 + 拟声 + 五色：纸 / 炭 / 橙 / 钴蓝 / 铬银，去掉圆角
        b.append(f'<rect width="{PW}" height="{PW}" fill="{PAPER}"/>')
        for y0, w0, c in [(20, 110, ORANGE), (140, 34, INK), (236, 80, COBALT), (300, 30, INK)]:
            b.append(wedge(-10, y0, 430, 206, w0, 2, c))
        b.append(echoes(lambda ox, oy, a, kk: wheel(350 + ox, 104, 60, -ox / 60, INK if kk == 0 else COBALT, 8, a), n=5, step=18, accel=1.35))
        b.append(echoes(lambda ox, oy, a, kk: t(18 + ox, 236, 54, 'NIGHT RIDE', ARCHIVO, 900, INK if kk == 0 else ORANGE, '-1', 'start', f'opacity="{a:.3f}"', wdth=125 - kk * 9),
                        n=5, step=10, accel=1.4))
        b.append(f'<rect x="18" y="250" width="96" height="30" fill="{PAPER}"/>')
        b.append(t(22, 272, 18, '城市夜骑', SC, 900, INK, '2'))
        for i, (wd, sz) in enumerate([('VRRR', 44), ('VRR', 29), ('vrr', 20)]):
            b.append(t(206 + i * 72, 304 + i * 8, sz, wd, ARCHIVO, 900, ORANGE if i == 0 else INK, '0', 'start', f'transform="rotate({-6 + 5 * i} {206 + i * 72} {304 + i * 8})"', wdth=125 - 20 * i))
        plain_bits(b, INK, INK, ORANGE, PAPER, INK, rounded=False)
    return ''.join(b)


def steps():
    b = [f'<rect width="{W}" height="{H}" fill="{PAPER}"/>']
    b.append(t(90, 128, 64, '四步改造', SC, 900, INK))
    b.append(t(90, 178, 22, '同一张普通海报，每一步只改一件事 —— 改到第四步，它就开始“跑”了', SC, 400, MUTE))
    b.append(t(990, 178, 18, f'how-to no.{NO}', MONO, 700, MUTE, '1', 'end'))
    b.append(echoes(lambda ox, oy, a, kk: f'<circle cx="{960 + ox:.1f}" cy="104" r="20" fill="{INK if kk == 0 else ORANGE}" fill-opacity="{a:.3f}"/>', n=5, step=10, accel=1.35))
    b.append(f'<rect x="90" y="196" width="900" height="5" fill="{INK}"/>')
    caps = [
        ('原稿', '居中、水平、五种颜色、圆角', '哪儿都对，哪儿都不动', INK),
        ('力线', '只加四条楔形，尖端收向标题前方', '日期、地点照样水平，照样好读', INK),
        ('残影', '标题和轮子拖出 0.6^k 的残影', '越往后越开 = 在加速', INK),
        ('字宽 = 速度', '标题拉到 wdth 125 + 拟声 ÷1.5', '换成五色：纸 · 炭 · 橙 · 钴蓝 · 铬银', ORANGE),
    ]
    for k, (x, y) in enumerate(CELLS):
        b.append(f'<clipPath id="c{k}"><rect x="{x}" y="{y}" width="{PW}" height="{PW}"/></clipPath>')
        b.append(f'<g clip-path="url(#c{k})"><g transform="translate({x} {y})">{step_cell(k)}</g></g>')
        b.append(f'<rect x="{x}" y="{y}" width="{PW}" height="{PW}" fill="none" stroke="{SILVER}" stroke-width="1.5"/>')
        a, d1, d2, col = caps[k]
        b.append(f'<path d="M{x} {y + PW + 22}h52l-12 28h-40z" fill="{col}"/>')
        b.append(t(x + 10, y + PW + 44, 19, f'0{k + 1}', MONO, 700, PAPER))
        b.append(t(x + 66, y + PW + 46, 24, a, SC, 900, INK))
        aw = sum(24 if ord(ch) > 0x2E80 else 13 for ch in a)
        b.append(t(x + 76 + aw, y + PW + 45, 15, d1, SC, 700, INK))
        b.append(t(x + 76 + aw, y + PW + 70, 15, d2, SC, 400, MUTE))
        if k % 2 == 0:
            b.append(f'<path d="M{x + PW + 8} {y + PW / 2 - 9}l14 9-14 9z" fill="{ORANGE}"/>')
    b.append(t(90, 1300, 16, 'github.com/guanmo-ai/design-style', MONO, 400, MUTE))
    b.append(t(990, 1300, 16, '@guanmo_ai · 每天一个设计风格', SC, 400, MUTE, '0', 'end'))
    return doc(''.join(b))


if __name__ == '__main__':
    for name, fn in [('poster', poster), ('cheatsheet', cheatsheet), ('app-ui', app_ui), ('steps', steps)]:
        path = os.path.join(HERE, f'{name}.svg')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(fn())
        print('wrote', os.path.relpath(path), f'{os.path.getsize(path) / 1024:.0f} KB')
