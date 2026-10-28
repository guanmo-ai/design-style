"""
候选风格 · 1-bit 抖动像素 Dither —— 风格图（1080×1350）

  poster.svg      海报：一颗被光照着的球，全部用两种颜色的点画出来；放大镜里是 4×4 拜耳矩阵
  cheatsheet.svg  速查卡：十七级灰、拜耳矩阵与一行公式、四种算法对比、两色主题、五条规则
  app-ui.svg      如果 1-bit 来做 App：一个天气页，带标注

整张图只有两种颜色。所有“灰”都是 dither 出来的点；标题的像素字也是在这里现场栅格化成点阵的。
图像都是程序画的灰度场景（球、地面、天空），再按算法变成黑白点，输出成一条条 <path>（按行合并的矩形），矢量、无损。
用法：python3 drafts/dither/images/make_svgs.py
"""
import os
from xml.sax.saxutils import escape

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
FONTS = os.path.join(ROOT, 'public', 'fonts')
W, H = 1080, 1350
NO = '014'

INK = '#1B1A17'
PAPER = '#E8E3D3'
MUTE = '#6E6A5E'

MONO = "'Space Mono', 'JetBrains Mono', monospace"
SC = "'Noto Sans SC', 'PingFang SC', sans-serif"
PIX = "'Silkscreen', monospace"

# 4×4 / 8×8 拜耳矩阵（阈值从 0 到 n²−1，相邻格子差得越远越好）
B2 = np.array([[0, 2], [3, 1]])


def bayer(n):
    m = B2
    while m.shape[0] < n:
        m = np.block([[4 * m + 0, 4 * m + 2], [4 * m + 3, 4 * m + 1]])
    return m


B4, B8 = bayer(4), bayer(8)


def t(x, y, size, text, family=MONO, weight=400, fill=INK, ls='0', anchor='start', extra=''):
    return (
        f'<text x="{x:.1f}" y="{y:.1f}" font-family="{family}" font-weight="{weight}" '
        f'font-size="{size}" fill="{fill}" letter-spacing="{ls}" text-anchor="{anchor}" {extra}>'
        f'{escape(text)}</text>'
    )


def doc(body, defs=''):
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" shape-rendering="crispEdges">\n'
        f'  <defs>\n    {defs}\n  </defs>\n{body}\n</svg>\n'
    )


# ---------------- 点 → 矢量 ----------------

def cells_path(mask, x0, y0, s, fill=INK):
    """把布尔点阵按行合并成矩形，输出一条 path"""
    d = []
    for r, row in enumerate(mask):
        c, n = 0, len(row)
        while c < n:
            if row[c]:
                e = c
                while e < n and row[e]:
                    e += 1
                d.append(f'M{x0 + c * s:g} {y0 + r * s:g}h{(e - c) * s:g}v{s:g}h-{(e - c) * s:g}z')
                c = e
            else:
                c += 1
    return f'<path fill="{fill}" d="{"".join(d)}"/>' if d else ''


# ---------------- 算法 ----------------

def d_threshold(g):
    return g < 0.5


def d_bayer(g, m=B4):
    n = m.shape[0]
    hh, ww = g.shape
    th = (np.tile(m, (hh // n + 1, ww // n + 1))[:hh, :ww] + 0.5) / (n * n)
    return g < th  # True = 墨点（暗）


def _diffuse(g, kernel, div):
    g = g.copy().astype(float)
    hh, ww = g.shape
    out = np.zeros_like(g, bool)
    for y in range(hh):
        for x in range(ww):
            old = g[y, x]
            new = 1.0 if old >= 0.5 else 0.0
            out[y, x] = new == 0.0
            err = (old - new) / div
            for dx, dy, k in kernel:
                xx, yy = x + dx, y + dy
                if 0 <= xx < ww and 0 <= yy < hh:
                    g[yy, xx] += err * k
    return out


def d_floyd(g):
    return _diffuse(g, [(1, 0, 7), (-1, 1, 3), (0, 1, 5), (1, 1, 1)], 16)


def d_atkinson(g):
    # Bill Atkinson（MacPaint，1984）：只传 6/8 的误差，亮部更干净、暗部更“版画”
    return _diffuse(g, [(1, 0, 1), (2, 0, 1), (-1, 1, 1), (0, 1, 1), (1, 1, 1), (0, 2, 1)], 8)


# ---------------- 程序画的灰度场景 ----------------

def sphere_scene(cw, ch, cx, cy, r, light=(-0.55, -0.6, 0.58), floor_y=None, sky=(0.92, 0.55)):
    """一颗球 + 地面 + 投影；返回 0（黑）—1（白）的灰度"""
    ys, xs = np.mgrid[0:ch, 0:cw].astype(float) + 0.5
    g = sky[0] + (sky[1] - sky[0]) * (ys / ch)  # 天空：上亮下暗
    if floor_y is not None:
        fl = ys > floor_y
        depth = (ys - floor_y) / max(1, ch - floor_y)
        g = np.where(fl, 0.92 - 0.40 * depth, g)
        # 投影：压扁的椭圆，往光的反方向偏
        sx, sy = cx + r * 0.55, floor_y + r * 0.10
        e = ((xs - sx) / (r * 1.25)) ** 2 + ((ys - sy) / (r * 0.28)) ** 2
        g = np.where(fl, g - 0.55 * np.clip(1.15 - e, 0, 1) ** 0.8, g)
    lx, ly, lz = light
    ln = (lx * lx + ly * ly + lz * lz) ** 0.5
    lx, ly, lz = lx / ln, ly / ln, lz / ln
    dx, dy = (xs - cx) / r, (ys - cy) / r
    rr = dx * dx + dy * dy
    inside = rr < 1
    nz = np.sqrt(np.clip(1 - rr, 0, 1))
    lam = np.clip(dx * lx + dy * ly + nz * lz, 0, 1)
    # 半程向量做高光
    hx, hy, hz = lx, ly, lz + 1
    hn = (hx * hx + hy * hy + hz * hz) ** 0.5
    spec = np.clip((dx * hx + dy * hy + nz * hz) / hn, 0, 1) ** 40
    rim = np.clip(1 - nz, 0, 1) ** 4 * 0.42  # 背光边缘的地面反光
    shade = np.clip(0.06 + 0.86 * lam + 0.6 * spec + rim, 0, 1)
    return np.where(inside, shade, np.clip(g, 0, 1))


def bitmap_text(text, font_file, size, thresh=120):
    f = ImageFont.truetype(os.path.join(FONTS, font_file), size)
    b = f.getbbox(text)
    im = Image.new('L', (b[2] + 2, b[3] - b[1] + 2), 0)
    ImageDraw.Draw(im).text((0, -b[1]), text, font=f, fill=255)
    a = np.array(im) > thresh
    rows = np.where(a.any(1))[0]
    cols = np.where(a.any(0))[0]
    return a[rows[0]:rows[-1] + 1, cols[0]:cols[-1] + 1]


def checker(hh, ww, phase=0):
    yy, xx = np.mgrid[0:hh, 0:ww]
    return (xx + yy + phase) % 2 == 0


# ======================================================================
# 海报
# ======================================================================

def poster():
    body = [f'<rect width="{W}" height="{H}" fill="{PAPER}"/>']
    s = 6
    cw, ch = W // s, 780 // s
    g = sphere_scene(cw, ch, cx=cw * 0.42, cy=ch * 0.50, r=ch * 0.36, floor_y=ch * 0.80, sky=(0.05, 0.36))
    body.append(cells_path(d_bayer(g, B8), 0, 330, s))

    # 标题：像素字
    title = bitmap_text('DITHER', 'Silkscreen-Regular.ttf', 8)
    ts = (W - 120) // title.shape[1]
    body.append(cells_path(title, 60, 96, ts))
    body.append(t(62, 72, 20, f'NO. {NO} · 1984—TODAY', MONO, 700, INK, '2'))
    body.append(t(1018, 72, 20, '1-BIT · 2 COLORS', MONO, 700, INK, '2', 'end'))

    # 放大镜：球的明暗交界处，放大成 4×4 拜耳矩阵 + 阈值数字
    lx, ly, ls_ = 694, 360, 44
    body.append(f'<rect x="{lx - 14}" y="{ly - 14}" width="{4 * ls_ + 56}" height="{4 * ls_ + 92}" fill="{PAPER}" stroke="{INK}" stroke-width="4"/>')
    gray = 7 / 16
    for r in range(4):
        for c in range(4):
            v = B4[r, c]
            on = gray < (v + 0.5) / 16
            x, y = lx + c * ls_, ly + r * ls_
            body.append(f'<rect x="{x}" y="{y}" width="{ls_}" height="{ls_}" fill="{INK if on else PAPER}" stroke="{INK}" stroke-width="1.5"/>')
            body.append(t(x + ls_ / 2, y + ls_ / 2 + 7, 20, str(v), MONO, 700, PAPER if on else INK, '0', 'middle'))
    body.append(t(lx, ly + 4 * ls_ + 34, 18, 'GRAY 7/16', MONO, 700, INK))
    body.append(t(lx, ly + 4 * ls_ + 60, 18, '→ 9 INK · 7 PAPER', MONO, 400, INK))

    # 底部：中文像素字 + 一句话
    zh = bitmap_text('灰，是点的密度。', 'NotoSansSC-Bold.otf', 26, 110)
    zs = 5
    body.append(f'<rect x="0" y="1112" width="{W}" height="{H - 1112}" fill="{INK}"/>')
    body.append(cells_path(zh, 60, 1150, zs, PAPER))
    body.append(t(62, 1306, 20, '只有两种颜色。没有一个灰色像素。', SC, 700, PAPER))
    body.append(t(1018, 1306, 18, '1-BIT DITHER', MONO, 700, PAPER, '2', 'end'))
    return doc(''.join(body))


# ======================================================================
# 速查卡
# ======================================================================

def cheatsheet():
    body = [f'<rect width="{W}" height="{H}" fill="{PAPER}"/>']
    title = bitmap_text('1-BIT DITHER', 'Silkscreen-Regular.ttf', 8)
    body.append(cells_path(title, 64, 70, 11))
    body.append(t(64, 196, 28, '速查 · 十七级灰、一张矩阵、四种算法、五条规则', SC, 900, INK))
    body.append(t(1016, 70 + 6, 18, f'NO. {NO}', MONO, 700, MUTE, '2', 'end'))

    # 01 十七级灰（4×4 拜耳）
    body.append(t(64, 262, 20, '01  十七级灰 · 4×4 拜耳，第 n 级点亮 n 个格子', SC, 700, INK, '1'))
    sw, gap, s = 52, 4, 4
    for k in range(17):
        x = 64 + k * (sw + gap)
        tile = np.tile(B4, (sw // s // 4 + 1, sw // s // 4 + 1))[: sw // s, : sw // s]
        mask = tile < k  # 第 k 级：阈值 < k 的格子是墨
        body.append(f'<rect x="{x}" y="282" width="{sw}" height="{sw}" fill="{PAPER}" stroke="{INK}" stroke-width="1"/>')
        body.append(cells_path(mask, x, 282, s))
        if k % 4 == 0:
            body.append(t(x + sw / 2, 362, 15, f'{round(k / 16 * 100)}%', MONO, 700, INK, '0', 'middle'))

    # 02 矩阵 + 公式
    body.append(t(64, 422, 20, '02  一张矩阵、一行公式', SC, 700, INK, '1'))
    cs = 48
    for r in range(4):
        for c in range(4):
            x, y = 64 + c * cs, 442 + r * cs
            body.append(f'<rect x="{x}" y="{y}" width="{cs}" height="{cs}" fill="{PAPER}" stroke="{INK}" stroke-width="2"/>')
            body.append(t(x + cs / 2, y + cs / 2 + 7, 20, str(B4[r, c]), MONO, 700, INK, '0', 'middle'))
    code = [
        '// 每个像素只问一句：',
        '// 比阈值暗吗？',
        'float m = bayer4[y % 4][x % 4];',
        'ink = luma < (m + 0.5) / 16.0;',
        '',
        'img { image-rendering: pixelated; }',
    ]
    body.append(f'<rect x="300" y="442" width="716" height="192" fill="{INK}"/>')
    for i, line in enumerate(code):
        body.append(t(324, 478 + i * 28, 19, line, MONO, 400, PAPER if not line.startswith('//') else '#A7A28F'))

    # 03 四种算法
    body.append(t(64, 694, 20, '03  同一颗球 · 四种算法', SC, 700, INK, '1'))
    ps = 3
    cw = ch = 72
    g = sphere_scene(cw, ch, cx=34, cy=33, r=26, floor_y=56, sky=(0.12, 0.4))
    algos = [
        ('阈值 50%', 'THRESHOLD', d_threshold(g), '只剩剪影'),
        ('拜耳 4×4', 'BAYER · 1973', d_bayer(g, B4), '网格感、适合动画'),
        ('弗洛伊德', 'FLOYD–STEINBERG · 1976', d_floyd(g), '最细腻、会“爬”'),
        ('阿特金森', 'ATKINSON · 1984', d_atkinson(g), 'Mac 的味道'),
    ]
    for i, (zh, en, mask, note) in enumerate(algos):
        x = 64 + i * 242
        body.append(f'<rect x="{x}" y="714" width="{cw * ps}" height="{ch * ps}" fill="{PAPER}" stroke="{INK}" stroke-width="2"/>')
        body.append(cells_path(mask, x, 714, ps))
        body.append(t(x, 960, 20, zh, SC, 900, INK) + t(x, 984, 13, en, MONO, 700, MUTE, '0.5'))
        body.append(t(x, 1008, 15, note, SC, 400, INK))

    # 04 两色主题 + 05 规则
    body.append(t(64, 1062, 20, '04  两种颜色，换一对就是换主题', SC, 700, INK, '1'))
    pairs = [('#1B1A17', '#E8E3D3', '纸墨'), ('#312F28', '#B1AFA8', '掌机'), ('#0E2A12', '#7CFF6B', '磷光'), ('#123B8C', '#F2EEE3', '蓝晒')]
    for i, (a, b, n) in enumerate(pairs):
        x = 64 + i * 120
        body.append(f'<rect x="{x}" y="1082" width="104" height="64" fill="{b}" stroke="{INK}" stroke-width="2"/>')
        body.append(cells_path(checker(16, 13) & (np.mgrid[0:16, 0:13][1] < 13), x, 1082, 4, a))
        body.append(f'<rect x="{x + 52}" y="1082" width="52" height="64" fill="{a}"/>')
        body.append(t(x, 1170, 16, n, SC, 700, INK) + t(x, 1192, 12, a, MONO, 400, MUTE))
    rules = [
        ('不要灰色像素', '要灰就用点的密度表示'),
        ('点要对齐像素', '缩放只用整数倍'),
        ('阴影 = 50% 棋盘格', '不用模糊'),
        ('动画用拜耳', '扩散算法逐帧会“爬”'),
        ('字也是点阵', '小字用像素字，大字放整数倍'),
    ]
    body.append(t(570, 1062, 20, '05  五条规则', SC, 700, INK, '1'))
    for i, (a, b) in enumerate(rules):
        y = 1098 + i * 46
        body.append(t(570, y, 16, f'0{i + 1}', MONO, 700, INK) + t(604, y, 19, a, SC, 900, INK))
        body.append(t(604, y + 22, 15, b, SC, 400, MUTE))
    body.append(t(64, 1310, 15, f'Design Style 风格 {NO} · @guanmo_ai', MONO, 400, MUTE))
    return doc(''.join(body))


# ======================================================================
# App 概念：天气
# ======================================================================

def app_ui():
    body = [f'<rect width="{W}" height="{H}" fill="{PAPER}"/>']
    body.append(t(72, 112, 20, '1-BIT DITHER · APP', MONO, 700, INK, '3'))
    body.append(t(72, 180, 54, '如果 1-bit 来做 App', SC, 900, INK))
    body.append(t(72, 226, 22, '一个天气页：两种颜色，渐变、阴影、图表全靠点的密度。', SC, 400, MUTE))

    px, py, pw, ph = 72, 280, 468, 990
    s = 3
    # 外框 + 1px 硬投影（棋盘格）
    sh = checker(ph // s, pw // s)
    body.append(cells_path(sh, px + 12, py + 12, s))
    body.append(f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" fill="{PAPER}" stroke="{INK}" stroke-width="6"/>')

    # 天空：上暗下亮 + 太阳
    sw_, sh_ = pw // s - 4, 520 // s
    ys, xs = np.mgrid[0:sh_, 0:sw_].astype(float)
    sky = 0.18 + 0.8 * (ys / sh_) ** 1.2
    sun = np.hypot(xs - sw_ * 0.68, ys - sh_ * 0.42)
    sky = np.where(sun < 26, 1.0, sky + 0.45 * np.exp(-(sun - 26).clip(0) / 18))
    # 一朵云
    cloud = np.zeros_like(sky, bool)
    for cx, cy, r in [(40, 118, 16), (60, 108, 22), (84, 116, 16), (62, 124, 14)]:
        cloud |= np.hypot(xs - cx, ys - cy) < r
    sky = np.where(cloud, 0.97 - 0.25 * ((ys - 100) / 30).clip(0, 1), sky)
    body.append(cells_path(d_bayer(np.clip(sky, 0, 1), B4), px + 6, py + 6, s))

    # 状态栏、地点、温度（像素数字）
    body.append(t(px + 26, py + 40, 18, '07:42', MONO, 700, PAPER))
    city = bitmap_text('上海 · 多云转晴', 'NotoSansSC-Bold.otf', 16, 110)
    body.append(f'<rect x="{px + 20}" y="{py + 70}" width="{city.shape[1] * 3 + 16}" height="{city.shape[0] * 3 + 14}" fill="{INK}"/>')
    body.append(cells_path(city, px + 28, py + 77, 3, PAPER))
    temp = bitmap_text('23°', 'Silkscreen-Regular.ttf', 8)
    body.append(f'<rect x="{px + 18}" y="{py + 366}" width="{temp.shape[1] * 16 + 20}" height="{temp.shape[0] * 16 + 28}" fill="{PAPER}" stroke="{INK}" stroke-width="4"/>')
    body.append(cells_path(temp, px + 28, py + 380, 16, INK))

    # 逐小时：柱子用密度区分（今天 vs 昨天）
    by = py + 560
    body.append(t(px + 26, by, 18, 'HOURLY', MONO, 700, INK, '2'))
    temps = [19, 20, 22, 23, 24, 23, 21]
    for i, v in enumerate(temps):
        hh = (v - 15) * 14
        x = px + 30 + i * 60
        hb = hh // 3
        mask = np.tile(B4, (hb // 4 + 1, 6))[:hb, :12] < (12 if i == 3 else 6)
        body.append(f'<rect x="{x}" y="{by + 170 - hh}" width="36" height="{hh}" fill="{PAPER}" stroke="{INK}" stroke-width="2"/>')
        body.append(cells_path(mask, x, by + 170 - hh, 3))
        body.append(t(x + 18, by + 198, 14, f'{9 + i * 2:02d}', MONO, 700, INK, '0', 'middle'))

    # 按钮：反色 = 强调；投影 = 棋盘格偏移 4px
    bx, byy, bw, bh = px + 28, py + 820, pw - 56, 70
    body.append(cells_path(checker(bh // 2, bw // 2), bx + 6, byy + 6, 2))
    body.append(f'<rect x="{bx}" y="{byy}" width="{bw}" height="{bh}" fill="{INK}"/>')
    body.append(t(bx + bw / 2, byy + 45, 24, '查看一周', SC, 900, PAPER, '4', 'middle'))
    for k in range(4):
        cx = px + 60 + k * 116
        body.append(f'<rect x="{cx - 14}" y="{py + 930}" width="28" height="28" fill="{INK if k == 0 else PAPER}" stroke="{INK}" stroke-width="3"/>')

    notes = [
        (py + 170, '渐变 = 密度渐变', '天空从 85% 墨到 5% 墨，\n用 4×4 拜耳，没有一个灰像素。'),
        (py + 410, '大字放整数倍', '“23°” 是 8px 像素字 × 16 倍，\n边缘不糊、不抗锯齿。'),
        (py + 640, '数据靠密度区分', '当前小时 75% 墨，其余 37%。\n不用第二种颜色。'),
        (py + 850, '阴影 = 棋盘格', '50% 棋盘格偏移 6px，\n不用模糊。强调就反色。'),
    ]
    for i, (y, a, b) in enumerate(notes):
        body.append(f'<line x1="{px + pw - 20}" y1="{y}" x2="610" y2="{y}" stroke="{INK}" stroke-width="2"/>')
        body.append(f'<rect x="{px + pw - 26}" y="{y - 6}" width="12" height="12" fill="{INK}"/>')
        body.append(f'<rect x="612" y="{y - 18}" width="36" height="36" fill="{INK}"/>' + t(630, y + 7, 18, str(i + 1), MONO, 700, PAPER, '0', 'middle'))
        body.append(t(664, y + 8, 22, a, SC, 900, INK))
        for k, line in enumerate(b.split('\n')):
            body.append(t(664, y + 38 + k * 26, 17, line, SC, 400, MUTE))
    body.append(t(612, 1238, 16, 'TOKENS', MONO, 700, INK, '3'))
    for i, line in enumerate(['--ink: #1B1A17;  --paper: #E8E3D3;', '--matrix: bayer-4;  --scale: 3×', 'image-rendering: pixelated;']):
        body.append(t(612, 1262 + i * 22, 14.5, line, MONO, 400, INK))
    body.append(t(72, 1310, 15, f'Design Style 风格 {NO} · @guanmo_ai', MONO, 400, MUTE))
    return doc(''.join(body))


if __name__ == '__main__':
    for name, fn in [('poster', poster), ('cheatsheet', cheatsheet), ('app-ui', app_ui)]:
        path = os.path.join(HERE, f'{name}.svg')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(fn())
        print('wrote', os.path.relpath(path), f'{os.path.getsize(path) / 1024:.0f} KB')
