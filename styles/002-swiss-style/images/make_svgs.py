"""
风格 002 · 瑞士国际主义 Swiss Style —— 四张风格图（1080×1350）的生成脚本

四张图共用一张竖版网格：6 栏 × 8 行，模块 135 × 135（正方形），间距 18，左右边距 90、上下边距 72，基线 9。
（视频用的是横版 12 栏 × 6 行；两张网格都是“正方形模块 + 统一间距”。）
所有色块的边、所有文字的基线都落在网格上；大字按字形的左侧字距（lsb）回退，让笔画本身而不是字框贴住栏线。

  poster.svg      一张海报：红方块压住 Swiss，压在红上的笔画自动反白（“套印”）
  cheatsheet.svg  速查卡：网格、色板、字体、五条规则、这样做 / 别这样
  app-ui.svg      如果瑞士风格来做 app：一个火车时刻表的概念稿
  grid.svg        一张网格，四种排法：同一组内容，6 栏分成 1 / 2 / 3 / 6 组

生成的 SVG 是普通可读的源文件，可以直接改；改完再跑 scripts/build_images.py 内嵌字体、导出 PNG。
用法：python3 styles/002-swiss-style/images/make_svgs.py
"""
import math
import os
from xml.sax.saxutils import escape

from fontTools.ttLib import TTFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
W, H = 1080, 1350
MX, MY, MOD, GUT = 90, 72, 135, 18
STEP = MOD + GUT  # 153 = 17 条基线


def cx(i):  # 第 i 栏左边
    return MX + i * STEP


def cw(n):  # n 栏宽
    return n * MOD + (n - 1) * GUT


def ry(j):  # 第 j 行上边
    return MY + j * STEP


rh = cw

# 颜色（与 tokens.ts 一致）
PAPER, INK, RED, GREY = '#F5F4F0', '#111111', '#E30613', '#7A7A78'
RULE = 'rgba(17,17,17,0.09)'
BUILD = 'rgba(227,6,19,0.4)'
WHITE = '#FFFFFF'
NIGHT = '#0F0F0F'

FAM = "'TeX Gyre Heros', 'Helvetica Neue', Helvetica, Arial, 'Noto Sans SC', sans-serif"
FAM_SC = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"
CAP = 0.729  # Heros 大写高度（em）
XH = 0.540  # Heros Bold 小写 x 高度（em）
CJK = 0.84  # 思源黑体字面顶部到基线（em，约值）

# ── 字体度量：用真实字宽算对齐，而不是估 ──
_FONTS = {}


def _font(weight):
    if weight not in _FONTS:
        name = 'TeXGyreHeros-Bold.otf' if weight >= 700 else 'TeXGyreHeros-Regular.otf'
        f = TTFont(os.path.join(ROOT, 'public', 'fonts', name))
        _FONTS[weight] = (f.getBestCmap(), f['hmtx'])
    return _FONTS[weight]


def lsb(ch, size, weight=700):
    cmap, hm = _font(weight)
    return hm[cmap[ord(ch)]][1] * size / 1000


def width(s, size, weight=700, ls=0.0):
    """字符串的步进宽度（不含最后一个字的字距）；汉字按 1em 计"""
    cmap, hm = _font(weight)
    w = 0
    for ch in s:
        w += hm[cmap[ord(ch)]][0] if ord(ch) in cmap else 1000
    return (w / 1000 + ls * (len(s) - 1)) * size


def T(x, y, s, size, weight=700, fill=INK, ls=0.0, anchor=None, fam=FAM, extra=''):
    """一行字：x 是左边（或 anchor 指定的位置），y 是基线；ls 是字距（em）"""
    a = f' text-anchor="{anchor}"' if anchor else ''
    l = f' letter-spacing="{ls * size:.2f}"' if ls else ''
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{fam}" font-weight="{weight}" font-size="{size}"'
            f'{l}{a} fill="{fill}"{extra}>{escape(s)}</text>')


def ZH(x, y, s, size, weight=900, fill=INK, ls=0.0, anchor=None):
    """中文（夹拉丁也行：拉丁字母走 Heros，汉字回落到思源黑体）"""
    return T(x, y, s, size, weight, fill, ls, anchor)


def rect(x, y, w, h, fill, extra=''):
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{fill}"{extra}/>'


def svg(name, title, body, defs='', bg=PAPER):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">\n'
            f'  <!-- Design Style · 风格 002 · 瑞士国际主义 Swiss Style —— {title} / 1080×1350（由 make_svgs.py 生成） -->\n'
            f'  <defs>{defs}\n  </defs>\n'
            f'  <rect width="{W}" height="{H}" fill="{bg}"/>\n{body}</svg>\n')


def grid_lines(color=RULE, x0=MX, y0=MY, cols=6, rows=8, mod=MOD, gut=GUT, sw=1):
    """网格线：每个模块画一个细框"""
    out = []
    st = mod + gut
    for i in range(cols):
        for j in range(rows):
            out.append(f'<rect x="{x0 + i * st + 0.5:.1f}" y="{y0 + j * st + 0.5:.1f}" width="{mod - 1:.1f}" height="{mod - 1:.1f}" fill="none" stroke="{color}" stroke-width="{sw}"/>')
    return '\n'.join(out)


# ═════════════════════════════════════ 1 · 海报 ═════════════════════════════════════
def poster():
    """
    红方块占右上 4 栏 × 4 行（594 × 594）。Swiss 的字宽正好是 6 栏（900），基线落在红方块底边上：
    压在纸上的笔画是黑的，压在红上的笔画反白 —— 同一行字被网格切成两种颜色。
    """
    S = 339  # 字宽 = 6 栏
    base1, base2 = ry(3) + MOD, ry(5) + MOD  # 666 / 972
    red = (cx(2), ry(0), cw(4), rh(4))
    x0 = MX - lsb('S', S)
    big = lambda s, y, fill: T(x0, y, s, S, 700, fill, -0.03)
    b = []
    b.append(rect(*red, RED))
    # 左上：中文标题竖着叠三行，和红方块顶对齐
    zs = 88
    for i, w in enumerate(['瑞士', '国际', '主义']):
        b.append(ZH(MX - 4, MY + round(CJK * zs) + i * 99, w, zs, 900))
    # Swiss：先整行黑，再把红方块里的部分换成白
    b.append(big('Swiss', base1, INK))
    b.append(f'<g clip-path="url(#red)">{big("Swiss", base1, WHITE)}</g>')
    b.append(big('Style', base2, INK))
    # 红方块里：左上角一组白色小字（这一期的三样东西）
    for i, (de, zh) in enumerate([('Raster', '网格'), ('Grotesk', '无衬线'), ('Rot', '红')]):
        y = ry(0) + 18 + round(CAP * 24) + i * 27
        b.append(T(cx(2) + 18, y, de, 24, 700, WHITE))
        b.append(ZH(cx(3) + 18, y, zh, 22, 500, WHITE))
    b.append(T(cx(5) + MOD - 18, ry(0) + 18 + round(CAP * 24), '002', 24, 700, WHITE, anchor='end'))
    # 底部：一条线 + 三组信息，各占 2 栏
    b.append(rect(MX, ry(7), cw(6), 3, INK))
    cols = [
        [('Swiss Style', 700, INK), ('Schweizer Grafik', 400, INK), ('1950—1970', 400, GREY)],
        [('一张网格，', 700, INK), ('一种字体，', 700, INK), ('一种红。', 700, RED)],
        [('Design Style 风格 002', 700, INK), ('每天一个设计风格', 400, INK), ('@guanmo_ai', 400, GREY)],
    ]
    for k, lines in enumerate(cols):
        for i, (s, wgt, fill) in enumerate(lines):
            b.append(T(cx(2 * k), ry(7) + 45 + i * 27, s, 20, wgt, fill))
    defs = f'\n    <clipPath id="red"><rect x="{red[0]}" y="{red[1]}" width="{red[2]}" height="{red[3]}"/></clipPath>'
    return svg('poster', '海报', '\n'.join('  ' + x for x in b) + '\n', defs)


# ═════════════════════════════════════ 共用：页眉 / 页脚 / 小节标题 ═════════════════════════════════════
def header(zh, en, sub, tag='design style no.02'):
    """页眉：中文 + 拉丁标题、一行灰色说明；右上角一个红方块 + 期号"""
    b = [ZH(MX - 3, MY + round(CJK * 52), zh, 52, 900)]
    if en:
        b.append(T(MX + width(zh, 52) + 14, MY + round(CJK * 52), en, 52, 700, INK, -0.02))
    b.append(ZH(MX, MY + 96, sub, 20, 400, GREY))
    b.append(rect(cx(5) + MOD - 45, MY, 45, 45, RED))
    b.append(T(cx(5) + MOD, MY + 96, tag, 16, 400, GREY, anchor='end'))
    b.append(rect(MX, MY + 120, cw(6), 3, INK))
    return b


def footer(y=H - 48):
    return [T(MX, y, 'github.com/guanmo-ai/design-style', 16, 400, GREY),
            ZH(cx(5) + MOD, y, '@guanmo_ai · 每天一个设计风格', 16, 400, GREY, anchor='end')]


def section(y, n, zh, de):
    """小节标题：红色编号块 + 中文 + 德文；y 是基线"""
    return [rect(MX, y - 20, 34, 26, RED),
            T(MX + 17, y - 1, f'{n:02d}', 16, 700, WHITE, anchor='middle'),
            ZH(MX + 46, y, zh, 22, 700, INK),
            T(MX + 46 + width(zh, 22) + 10, y, de, 16, 400, GREY)]


# ═════════════════════════════════════ 2 · 速查卡 ═════════════════════════════════════
def cheatsheet():
    b = header('瑞士国际主义', 'Swiss Style', '风格速查卡 · 1950—1970 · 苏黎世 / 巴塞尔')

    # ── 01 网格 ──
    y = 250
    b += section(y, 1, '网格', 'Raster')
    # 左：视频网格缩略图（1920×1080 → 441 宽），右上 3×3 红模块
    s = cw(3) / 1920
    ox, oy = MX, y + 22
    b.append(rect(ox, oy, 1920 * s, 1080 * s, WHITE, f' stroke="{INK}" stroke-width="1.5"'))
    for i in range(12):
        for j in range(6):
            fill = RED if (i >= 9 and j <= 2) else 'rgba(17,17,17,0.07)'
            b.append(rect(ox + (96 + i * 146) * s, oy + (114 + j * 146) * s, 122 * s, 122 * s, fill))
    # 标注：一个模块 + 一个间距
    mx0, my0 = ox + (96 + 4 * 146) * s, oy + (114 + 5 * 146 + 122) * s
    b.append(f'<path d="M{mx0:.1f} {my0 + 7:.1f} h{122 * s:.1f} M{mx0:.1f} {my0 + 4:.1f} v6 M{mx0 + 122 * s:.1f} {my0 + 4:.1f} v6" stroke="{RED}" stroke-width="1.5" fill="none"/>')
    b.append(T(mx0 + 122 * s + 6, my0 + 12, '122', 12, 700, RED))
    b.append(T(ox, oy + 1080 * s + 30, '视频 1920 × 1080 · 12 栏 × 6 行', 16, 700, INK))
    b.append(T(ox, oy + 1080 * s + 52, '右上角 3 × 3 个模块 = 开场的红方块', 16, 400, GREY))
    # 右：参数表
    rows = [('栏 × 行', '12 × 6（视频）· 6 × 8（图片）'),
            ('模块', '122 · 135 —— 正方形，栏宽 = 行高'),
            ('间距', '24 · 18 —— 横竖一样'),
            ('边距', '96 / 114 · 90 / 72（左右 / 上下）'),
            ('基线', '9（图片）—— 模块 + 间距 = 153 = 17 条'),
            ('换栏', '12 = 2 × 6 = 3 × 4 = 4 × 3 = 6 × 2')]
    for i, (k, v) in enumerate(rows):
        yy = oy + 18 + i * 42
        b.append(ZH(cx(3) + 18, yy, k, 16, 400, GREY))
        b.append(T(cx(4), yy, v, 18, 700, INK))
        if i:
            b.append(rect(cx(3) + 18, yy - 28, cw(3) - 18, 1, RULE))

    # ── 02 色板 ──
    y = 612
    b += section(y, 2, '色板', 'Farben')
    sw = [('纸白', PAPER, '245 244 240', '60%'), ('黑', INK, '17 17 17', '25%'),
          ('瑞士红', RED, '227 6 19', '10%'), ('灰', GREY, '122 122 120', '5%')]
    for i, (name, hx, rgb, area) in enumerate(sw):
        x = cx(i)
        b.append(rect(x, y + 22, MOD, 84, hx, f' stroke="{INK}" stroke-width="1"' if hx == PAPER else ''))
        b.append(ZH(x, y + 136, name, 18, 700, INK))
        b.append(T(x + MOD, y + 136, area, 16, 700, RED if hx == RED else INK, anchor='end'))
        b.append(T(x, y + 158, hx, 16, 400, INK))
        b.append(T(x, y + 178, rgb, 16, 400, GREY))
    # 右两栏：面积条 + 一句话
    bx, bw = cx(4), cw(2)
    acc = 0
    for name, hx, rgb, area in sw:
        w = bw * int(area[:-1]) / 100
        b.append(rect(bx + acc, y + 22, w, 84, hx, f' stroke="{INK}" stroke-width="1"' if hx == PAPER else ''))
        acc += w
    b.append(ZH(bx, y + 136, '建议面积', 18, 700, INK))
    b.append(ZH(bx, y + 158, '红色只给一样东西：', 16, 400, INK))
    b.append(ZH(bx, y + 178, '最重要的那一个。', 16, 400, INK))

    # ── 03 字体 ──
    y = 838
    b += section(y, 3, '字体', 'Schrift')
    S = 172
    base = y + 22 + round(CAP * S)
    b.append(T(MX - lsb('A', S), base, 'Aa', S, 700, INK, -0.03))
    # 度量线：大写高度 / x 高度 / 基线
    for k, (yy, lab) in enumerate([(base - CAP * S, '大写高度'), (base - XH * S, 'x 高度'), (base, '基线')]):
        b.append(rect(MX, yy, cw(3) - 18, 1.5, RED))
        b.append(ZH(cx(3) - 18, yy - 6, lab, 14, 500, RED, anchor='end'))
    specs = [('TeX Gyre Heros Bold 700', '标题、数字、标签'),
             ('TeX Gyre Heros Regular 400', '正文、说明'),
             ('思源黑体 Noto Sans SC', '中文：Black 900 / Bold 700 / Regular 400')]
    for i, (k, v) in enumerate(specs):
        yy = y + 40 + i * 48
        b.append(T(cx(3) + 18, yy, k, 18, 700 if i != 1 else 400, INK))
        b.append(ZH(cx(3) + 18, yy + 22, v, 16, 400, GREY))
    b.append(ZH(cx(3) + 18, y + 40 + 3 * 48 + 4, '1957 Neue Haas Grotesk → 1960 改名 Helvetica', 16, 700, INK))
    b.append(ZH(cx(3) + 18, y + 40 + 3 * 48 + 26, 'Heros 是它的开源替身（GUST 许可）', 16, 400, GREY))

    # ── 04 五条规则 ──
    y = 1068
    rules = [('网格', 'Raster', '先画网格，再放东西', '边和基线都落在格上'),
             ('无衬线', 'Grotesk', '一种字体，层级只靠', '字号和字重'),
             ('左对齐', 'Flattersatz', '左边齐、右边自然参差', '不居中，不两端对齐'),
             ('不对称', 'Asymmetrie', '重心偏到一边，', '用大块留白去平衡'),
             ('客观', 'Sachlichkeit', '只给事实：标题、日期、', '地点、照片，不加修饰')]
    b += section(y, 4, '五条规则', 'Regeln')
    colw = (cw(6) - 4 * 18) / 5
    for i, (zh, de, d1, d2) in enumerate(rules):
        x = MX + i * (colw + 18)
        b.append(rect(x, y + 18, colw, 2, INK))
        b.append(T(x, y + 52, f'{i + 1}', 26, 700, RED))
        b.append(ZH(x + 24, y + 52, zh, 22, 700, INK))
        b.append(T(x + 24 + width(zh, 22) + 6, y + 52, de, 13, 400, GREY))
        b.append(ZH(x, y + 80, d1, 14, 400, INK))
        b.append(ZH(x, y + 100, d2, 14, 400, INK))
    # 这样做 / 别这样
    yb = y + 124
    b.append(rect(MX, yb, cw(3), 54, INK))
    b.append(ZH(MX + 16, yb + 34, '这样做', 18, 900, WHITE))
    b.append(ZH(MX + 94, yb + 34, '先画网格 · 字号拉开 · 左齐右不齐 · 大块留白', 15, 400, WHITE))
    b.append(rect(cx(3) + 0.75, yb + 0.75, cw(3) - 1.5, 52.5, 'none', f' stroke="{RED}" stroke-width="1.5"'))
    b.append(ZH(cx(3) + 16, yb + 34, '别这样', 18, 900, RED))
    b.append(ZH(cx(3) + 94, yb + 34, '居中对称 · 两端对齐 · 渐变投影 · 圆角卡片', 15, 400, INK))
    b += footer()
    return svg('cheatsheet', '速查卡', '\n'.join('  ' + x for x in b) + '\n')


# ═════════════════════════════════════ 3 · 如果瑞士风格来做 app ═════════════════════════════════════
def phone(x, y, w=423, h=882):
    """手机外框：黑色机身 + 纸白屏幕 + 灵动岛 + 状态栏；返回 (元素, 屏幕内容左边, 右边, 顶)"""
    b = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="56" fill="{INK}"/>',
         f'<rect x="{x + 11}" y="{y + 11}" width="{w - 22}" height="{h - 22}" rx="46" fill="{WHITE}"/>',
         f'<rect x="{x + w / 2 - 52}" y="{y + 24}" width="104" height="30" rx="15" fill="{INK}"/>',
         T(x + 44, y + 47, '9:41', 16, 700, INK)]
    rx = x + w - 44
    b += [rect(rx - 24, y + 36, 22, 11, 'none', f' stroke="{INK}" stroke-width="1.5" rx="3"'), rect(rx - 22, y + 38, 15, 7, INK, ' rx="1.5"')]
    for k in range(4):
        b.append(rect(rx - 56 + k * 6, y + 47 - 4 - k * 2.5, 4, 4 + k * 2.5, INK))
    return b, x + 36, x + w - 36, y + 78


def tabbar(x0, x1, yb, active):
    b = [rect(x0, yb - 38, x1 - x0, 1, RULE)]
    labs = ['出发', '行程', '车票']
    step = (x1 - x0) / 3
    for i, lab in enumerate(labs):
        on = i == active
        b.append(ZH(x0 + i * step, yb, lab, 16, 700 if on else 400, INK if on else GREY))
        if on:
            b.append(rect(x0 + i * step, yb - 38, 40, 3, INK))
    return b


def app_ui():
    b = header('如果瑞士风格来做', 'app', '七十年前的规则，今天的界面 · 一个火车时刻表 app 的概念稿', 'ui concept no.02')
    py = 236
    # ── 屏一：出发 ──
    p1, x0, x1, top = phone(MX, py)
    b += p1
    y = top + 30
    b.append(T(x0, y, 'Abfahrt', 14, 700, GREY))
    b.append(ZH(x0 + 64, y, '出发', 14, 400, GREY))
    b.append(T(x0 - lsb('Z', 46), y + 54, 'Zürich HB', 46, 700, INK, -0.02))
    b.append(ZH(x0, y + 82, '苏黎世中央车站 · 现在 08:27', 14, 400, GREY))
    # 下一班：最大的字给最重要的数字
    y = top + 160
    b.append(rect(x0, y, x1 - x0, 3, INK))
    b.append(ZH(x0, y + 26, '下一班', 13, 700, INK))
    b.append(ZH(x1, y + 26, '5 分钟后', 13, 700, INK, anchor='end'))
    b.append(T(x0 - lsb('0', 92), y + 26 + 18 + round(0.709 * 92), '08:32', 92, 700, INK, -0.03))
    yy = y + 26 + 18 + round(0.709 * 92)
    b.append(T(x0, yy + 34, 'Basel SBB', 24, 700, INK))
    b.append(ZH(x0, yy + 58, 'IC · 直达 · 56 分钟', 14, 400, GREY))
    b.append(T(x1, yy + 34, '7', 24, 700, INK, anchor='end'))
    b.append(ZH(x1, yy + 58, '站台', 14, 400, GREY, anchor='end'))
    # 列表：时间 / 车次 / 开往 / 站台 四栏
    y = yy + 92
    c1, c2, c3 = x0 + 70, x0 + 124, x1
    for lab, xx, an in [('时间', x0, None), ('车次', c1, None), ('开往', c2, None), ('站台', c3, 'end')]:
        b.append(ZH(xx, y, lab, 12, 400, GREY, anchor=an))
    rows = [('08:34', 'S', 'Winterthur', '22', ''), ('08:36', 'IR', 'Konstanz', '13', "+4'"),
            ('08:39', 'IC', 'Lausanne', '16', ''), ('08:40', 'EC', 'Milano Centrale', '9', ''),
            ('08:47', 'S', 'Flughafen', '21', ''), ('08:52', 'RE', 'Schaffhausen', '14', '')]
    for i, (t, cat, dest, pl, late) in enumerate(rows):
        ry0 = y + 14 + i * 50
        b.append(rect(x0, ry0, x1 - x0, 1, RULE))
        bl = ry0 + 32
        b.append(T(x0, bl, t, 20, 700, INK))
        b.append(rect(c1, bl - 16, 34, 20, INK))
        b.append(T(c1 + 17, bl - 1, cat, 12, 700, WHITE, anchor='middle'))
        b.append(T(c2, bl, dest, 18, 400, INK))
        if late:
            b.append(T(c2 + width(dest, 18, 400) + 10, bl, late, 18, 700, RED))
        b.append(T(c3, bl, pl, 20, 700, INK, anchor='end'))
    b += tabbar(x0, x1, py + 882 - 40, 0)

    # ── 屏二：行程 ──
    px = cx(5) + MOD - 423
    p2, x0, x1, top = phone(px, py)
    b += p2
    y = top + 30
    b.append(T(x0, y, '←', 16, 700, INK))
    b.append(T(x0 + 28, y, 'Verbindung', 14, 700, GREY))
    b.append(ZH(x0 + 28 + width('Verbindung', 14) + 8, y, '行程', 14, 400, GREY))
    b.append(T(x0 - lsb('0', 46), y + 54, '08:32–09:28', 46, 700, INK, -0.02))
    b.append(T(x0, y + 84, 'Zürich HB → Basel SBB', 18, 700, INK))
    b.append(ZH(x0, y + 108, '56 分钟 · 直达 · 2 等座', 14, 400, GREY))
    # 红色只给一样东西：站台
    y = top + 160
    sq = 168
    b.append(rect(x0, y, sq, sq, RED))
    b.append(ZH(x0 + 14, y + 26, '站台', 14, 700, WHITE))
    b.append(T(x0 + 14, y + 26 + 18, 'Gleis', 13, 400, WHITE))
    b.append(T(x0 + sq - 14, y + sq - 14, '7', 132, 700, WHITE, anchor='end'))
    for i, (k, v) in enumerate([('车厢', '2 等 · 7—12 号'), ('上车区', 'B — D'), ('出发', '5 分钟后')]):
        yy = y + 22 + i * 52
        b.append(ZH(x0 + sq + 18, yy, k, 12, 400, GREY))
        b.append(ZH(x0 + sq + 18, yy + 22, v, 17, 700, INK))
    # 线路：一条竖线 + 站点圆点
    y = top + 360
    stops = [('08:32', 'Zürich HB', '7'), ('08:47', 'Baden', ''), ('08:55', 'Brugg AG', ''),
             ('09:07', 'Frick', ''), ('09:17', 'Rheinfelden', ''), ('09:28', 'Basel SBB', '9')]
    lx = x0 + 74
    gap = 46
    b.append(rect(lx - 2.5, y, 5, gap * (len(stops) - 1), INK))
    for i, (t, name, pl) in enumerate(stops):
        yy = y + i * gap
        end = i in (0, len(stops) - 1)
        b.append(f'<circle cx="{lx}" cy="{yy}" r="{9 if end else 6}" fill="{INK if end else WHITE}" stroke="{INK}" stroke-width="3"/>')
        b.append(T(x0, yy + 6, t, 16, 700 if end else 400, INK))
        b.append(T(lx + 22, yy + 7, name, 20 if end else 17, 700 if end else 400, INK))
        if pl:
            b.append(ZH(x1, yy + 6, f'站台 {pl}', 13, 400, GREY, anchor='end'))
    # 购票：瑞士的价格写法 34.—
    yb = py + 882 - 108
    b.append(rect(x0, yb - 46, x1 - x0, 50, INK))
    b.append(ZH(x0 + 16, yb - 15, '购票', 16, 700, WHITE))
    b.append(T(x1 - 16, yb - 15, 'CHF 34.—', 18, 700, WHITE, anchor='end'))
    b += tabbar(x0, x1, py + 882 - 40, 1)

    # 注释
    y = 1160
    for k, (x, zh, l1, l2) in enumerate([(MX, '出发', '时间就是标题：最大的字给最重要的数字', '列表四栏对齐：时间 / 车次 / 开往 / 站台'),
                                        (px, '行程', '红色只给一样东西：你要去的站台', '线路 = 一条竖线 + 站点圆点；价格写成 34.—（瑞士写法）')]):
        b.append(rect(x, y - 20, 34, 26, RED))
        b.append(T(x + 17, y - 1, f'{k + 1:02d}', 16, 700, WHITE, anchor='middle'))
        b.append(ZH(x + 46, y, zh, 20, 700, INK))
        b.append(ZH(x, y + 32, l1, 15, 700, INK))
        b.append(ZH(x, y + 56, l2, 15, 400, GREY))
    b += footer()
    return svg('app-ui', '如果瑞士风格来做 app', '\n'.join('  ' + x for x in b) + '\n')


# ═════════════════════════════════════ 4 · 一张网格，四种排法 ═════════════════════════════════════
SQ = cw(3)  # 441：每张小样占 3 栏 × 3 行
SM, SG = 27, 9  # 小样自己的 6 × 6 网格：边距 27、间距 9、模块 57
SMOD = (SQ - 2 * SM - 5 * SG) / 6


def sample(ox, oy, kind):
    """同一组内容（Neue Grafik / 新平面设计 / 1958 / 一段正文 / 一个红色主角），四种分组"""
    X = lambda i: ox + SM + i * (SMOD + SG)
    Y = lambda j: oy + SM + j * (SMOD + SG)
    Wn = lambda n: n * SMOD + (n - 1) * SG
    b = []
    bg = {1: RED, 2: WHITE, 3: NIGHT, 6: WHITE}[kind]
    fg = {1: WHITE, 2: INK, 3: PAPER, 6: INK}[kind]
    sub = {1: WHITE, 2: GREY, 3: 'rgba(245,244,240,0.6)', 6: GREY}[kind]
    b.append(rect(ox, oy, SQ, SQ, bg, f' stroke="{RULE}" stroke-width="1"' if bg == WHITE else ''))
    # 结构线：这张小样的 6 × 6 网格，以及这一种排法的分组
    line = 'rgba(255,255,255,0.35)' if kind in (1, 3) else BUILD
    for i in range(6):
        for j in range(6):
            b.append(f'<rect x="{X(i) + 0.5:.1f}" y="{Y(j) + 0.5:.1f}" width="{SMOD - 1:.1f}" height="{SMOD - 1:.1f}" fill="none" stroke="{line}" stroke-width="0.75" stroke-dasharray="2 3"/>')
    group = 6 // kind
    for g in range(kind):
        b.append(f'<rect x="{X(g * group):.1f}" y="{oy + SM - 8:.1f}" width="{Wn(group):.1f}" height="3" fill="{line}"/>')
    info = ['Zeitschrift für Grafik', 'Zürich 1958—1965', 'Nr. 1—18']
    para = ['Die Neue Grafik ist', 'sachlich, klar und', 'ohne Ornament. Sie', 'ordnet die Fläche', 'mit dem Raster.']
    if kind == 1:  # 6 栏合成 1 栏：标题就是画面
        S = 124
        b.append(T(X(0) - lsb('N', S), Y(0) + round(CAP * S), 'Neue', S, 700, fg, -0.03))
        b.append(T(X(0) - lsb('G', S), Y(0) + round(CAP * S) + 106, 'Grafik', S, 700, fg, -0.03))
        b.append(ZH(X(0), Y(4) + 28, '新平面设计', 30, 900, fg))
        for i, t in enumerate(info):
            b.append(T(X(0), Y(5) + 14 + i * 16, t, 13, 700 if i == 0 else 400, fg))
        b.append(rect(X(4), Y(4), Wn(2), Wn(2), WHITE))
        b.append(T(X(4) + 8, Y(4) + 20, '1958', 16, 700, RED))
    elif kind == 2:  # 两组，每组 3 栏：一半给颜色，一半给字
        b.append(rect(X(0), Y(0), Wn(3), Wn(6), RED))
        b.append(T(X(0) + 10, Y(5) + SMOD - 10, '1958', 40, 700, WHITE))
        S = 50
        b.append(T(X(3) - lsb('N', S), Y(0) + round(CAP * S), 'Neue', S, 700, fg, -0.02))
        b.append(T(X(3) - lsb('G', S), Y(0) + round(CAP * S) + 54, 'Grafik', S, 700, fg, -0.02))
        b.append(ZH(X(3), Y(2) + 26, '新平面设计', 20, 900, fg))
        for i, t in enumerate(para):
            b.append(T(X(3), Y(3) + 14 + i * 16, t, 12, 400, fg))
        for i, t in enumerate(info):
            b.append(T(X(3), Y(5) + 14 + i * 16, t, 12, 700 if i == 0 else 400, sub if i else fg))
    elif kind == 3:  # 三组，每组 2 栏：标题 / 正文 / 信息各占一栏
        S = 40
        b.append(T(X(0) - lsb('N', S), Y(0) + round(CAP * S), 'Neue', S, 700, fg, -0.02))
        b.append(T(X(0) - lsb('G', S), Y(0) + round(CAP * S) + 44, 'Grafik', S, 700, fg, -0.02))
        b.append(ZH(X(0), Y(1) + 44, '新平面设计', 16, 900, fg))
        for i, t in enumerate(para):
            b.append(T(X(2), Y(0) + 12 + i * 16, t, 12, 400, fg))
        for i, t in enumerate(info):
            b.append(T(X(4), Y(0) + 12 + i * 16, t, 12, 700 if i == 0 else 400, fg if i == 0 else sub))
        cxm, cym, r = X(2) + Wn(4) / 2 - 0, Y(3) + Wn(3) / 2, Wn(3) / 2
        for k in range(5):
            rr = r - k * 18
            col = RED if k == 1 else PAPER
            b.append(f'<circle cx="{cxm:.1f}" cy="{cym:.1f}" r="{rr:.1f}" fill="none" stroke="{col}" stroke-width="{7 if k == 1 else 2}"/>')
        b.append(T(X(0), Y(5) + SMOD - 6, '1958', 30, 700, RED))
    else:  # 六组，每组 1 栏：每栏一个词，排成台阶
        words = ['Neue', 'Grafik', 'Zürich', '1958', 'Nr. 1', '—18']
        for i, w in enumerate(words):
            b.append(T(X(i), Y(i) + 16, w, 15, 700, INK))
            b.append(rect(X(i), Y(i) + 26, SMOD, 2, INK))
        b.append(rect(X(3), Y(3) + 40, SMOD, SMOD - 40 + SG + SMOD, RED))
        b.append(ZH(X(0), Y(4) + 24, '新平面', 18, 900, INK))
        b.append(ZH(X(0), Y(4) + 48, '设计', 18, 900, INK))
    return b


def grid_page():
    b = header('一张网格，四种排法', '', '同一组内容，6 栏分成 1 / 2 / 3 / 6 组 —— 换的是分组，不是网格', 'grid systems no.02')
    pos = [(cx(0), 226, 1), (cx(3), 226, 2), (cx(0), 226 + SQ + 66, 3), (cx(3), 226 + SQ + 66, 6)]
    notes = {1: ('6 = 1 × 6', '整版一组：标题就是画面'), 2: ('6 = 2 × 3', '两组：一半给颜色，一半给字'),
             3: ('6 = 3 × 2', '三组：标题、正文、信息各占一栏'), 6: ('6 = 6 × 1', '六组：每栏一个词，排成台阶')}
    for ox, oy, k in pos:
        b += sample(ox, oy, k)
        a, z = notes[k]
        b.append(T(ox, oy + SQ + 34, a, 20, 700, INK))
        b.append(ZH(ox + 112, oy + SQ + 34, z, 16, 400, GREY))
    b.append(ZH(MX, 1250, '虚线是每张小样自己的 6 × 6 网格，顶上的粗线标出这一种分组。字号跟着分组走：组越宽，字越大。', 15, 400, INK))
    b += footer()
    return svg('grid', '一张网格，四种排法', '\n'.join('  ' + x for x in b) + '\n')


def main():
    files = {'poster': poster(), 'cheatsheet': cheatsheet(), 'app-ui': app_ui(), 'grid': grid_page()}
    for name, content in files.items():
        open(os.path.join(HERE, f'{name}.svg'), 'w', encoding='utf-8').write(content)
        print('wrote', name + '.svg')


if __name__ == '__main__':
    main()
