"""
风格 003 · 构成主义 Constructivism —— 四张风格图（1080×1350）的生成脚本

四张图共用一套“轴”而不是一张网格：主轴 −30°（向右上冲）、副轴 60°（与主轴垂直）、信息 0°（水平）。
斜的只给最想让人看见的那一样东西：标题、色块、粗条；要读的字（日期、说明、数据）一律水平。
边距 90 / 72（左右 / 上下），与 001 / 002 同一套页眉页脚。字宽按 Oswald 真实度量（指定字重的实例）计算。

  poster.svg      一张海报：致敬罗德琴科《书》（1924）——从嘴里喊出来的四个字，一个比一个大
  cheatsheet.svg  速查卡：轴、色板、字体、五条规则、这样做 / 别这样
  app-ui.svg      如果构成主义来做 app：一个跑步训练 app 的概念稿
  steps.svg       四步改造：同一张普通海报，每一步只改一件事

生成的 SVG 是普通可读的源文件，可以直接改；改完再跑 scripts/build_images.py 内嵌字体、导出 PNG。
用法：python3 styles/003-constructivism/images/make_svgs.py
"""
import math
import os
from xml.sax.saxutils import escape

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
FONTS = os.path.join(ROOT, 'public', 'fonts')
W, H = 1080, 1350
MX, MY = 90, 72
CW = W - 2 * MX  # 900

# 颜色（与 tokens.ts 一致）
PAPER, INK, RED, GREY, LIGHT = '#ECE4D2', '#161412', '#D3261C', '#8F897D', '#F6F1E6'
RULE = 'rgba(22,20,18,0.10)'

# 轴
A = -30  # 主轴（度，SVG rotate 的角度）
U = (math.cos(math.radians(A)), math.sin(math.radians(A)))  # (0.866, -0.5) 主轴方向
N = (-U[1], U[0])  # (0.5, 0.866) 副轴方向

FAM = "'Oswald', 'Noto Sans SC', 'Arial Narrow', sans-serif"
FAM_SC = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"
CAP = 0.81  # Oswald 大写高度（em）
CJK = 0.84  # 思源黑体字面顶部到基线（em，约值）

# ── 字体度量：Oswald 是可变字体，按字重实例化后再量 ──
_FONTS = {}


def _font(kind, weight):
    key = (kind, weight)
    if key not in _FONTS:
        if kind == 'osw':
            f = instancer.instantiateVariableFont(TTFont(os.path.join(FONTS, 'Oswald.ttf')), {'wght': weight})
        else:
            name = {400: 'Regular', 500: 'Medium', 700: 'Bold', 900: 'Black'}[weight]
            f = TTFont(os.path.join(FONTS, f'NotoSansSC-{name}.otf'))
        _FONTS[key] = (f.getBestCmap(), f['hmtx'], f['head'].unitsPerEm)
    return _FONTS[key]


def lsb(ch, size, weight=700):
    cmap, hm, upm = _font('osw', weight)
    return hm[cmap[ord(ch)]][1] * size / upm


def width(s, size, weight=700, ls=0.0, kind='osw'):
    """字符串的步进宽度（不含最后一个字的字距）；Oswald 没有的字（汉字）按思源黑体量"""
    w = 0
    for ch in s:
        cmap, hm, upm = _font(kind, weight)
        if ord(ch) not in cmap:
            cmap, hm, upm = _font('sc', 900 if weight >= 800 else 700 if weight >= 600 else 500 if weight >= 500 else 400)
        w += hm[cmap[ord(ch)]][0] / upm
    return (w + ls * (len(s) - 1)) * size


def zw(s, size, weight=400):
    return width(s, size, weight, kind='sc')


def T(x, y, s, size, weight=700, fill=INK, ls=0.0, anchor=None, fam=FAM, extra='', rot=None):
    """一行字：x 是左边（或 anchor 指定的位置），y 是基线；ls 是字距（em）；rot 绕 (x, y) 旋转"""
    a = f' text-anchor="{anchor}"' if anchor else ''
    l = f' letter-spacing="{ls * size:.2f}"' if ls else ''
    r = f' transform="rotate({rot} {x:.1f} {y:.1f})"' if rot else ''
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-family="{fam}" font-weight="{weight}" font-size="{size}"'
            f'{l}{a}{r} fill="{fill}"{extra}>{escape(s)}</text>')


def ZH(x, y, s, size, weight=900, fill=INK, ls=0.0, anchor=None, rot=None, extra=''):
    """中文（夹拉丁也走思源黑体，正文不混用窄体）"""
    return T(x, y, s, size, weight, fill, ls, anchor, FAM_SC, extra, rot)


def rect(x, y, w, h, fill, extra=''):
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{fill}"{extra}/>'


def poly(pts, fill, extra=''):
    return f'<polygon points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in pts)}" fill="{fill}"{extra}/>'


def circle(x, y, r, fill, extra=''):
    return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{fill}"{extra}/>'


def P(o, d, n=0.0):
    """从点 o 沿主轴走 d、沿副轴走 n"""
    return (o[0] + U[0] * d + N[0] * n, o[1] + U[1] * d + N[1] * n)


def bar(o, d0, d1, n0, n1, fill, extra=''):
    """主轴坐标系里的一块矩形：沿主轴 d0..d1，沿副轴 n0..n1"""
    return poly([P(o, d0, n0), P(o, d1, n0), P(o, d1, n1), P(o, d0, n1)], fill, extra)


def svg(name, title, body, defs='', bg=PAPER):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">\n'
            f'  <!-- Design Style · 风格 003 · 构成主义 Constructivism —— {title} / 1080×1350（由 make_svgs.py 生成） -->\n'
            f'  <defs>{defs}\n  </defs>\n'
            f'  <rect width="{W}" height="{H}" fill="{bg}"/>\n{body}</svg>\n')


def join(b):
    return '\n'.join('  ' + x for x in b) + '\n'


# ═════════════════════════════════════ 1 · 海报 ═════════════════════════════════════
def poster():
    """
    致敬罗德琴科《书》（1924）：一张嘴（黑圆）沿主轴喊出一个红色的锥，锥里的四个字按离嘴的距离放大
    —— 字号 = 0.36 × 距离、下一个字离嘴远 1.56 倍，锥的半角 14°，所以每个字都正好塞满它那一段锥。
    锥上方压一块黑圆（重量），锥下方一条黑带写西里尔字母；底部三栏信息全部水平。
    """
    b = []
    O = (100, 990)  # 嘴
    half = math.radians(14)
    L = 1500
    up, lo = A - 14, A + 14
    e1 = (O[0] + L * math.cos(math.radians(up)), O[1] + L * math.sin(math.radians(up)))
    e2 = (O[0] + L * math.cos(math.radians(lo)), O[1] + L * math.sin(math.radians(lo)))
    # 黑圆：画面的重量，放在锥的上方
    # 左边贴边距，离锥的上沿留 20（“将碰未碰”的张力）
    R = 250
    cx_ = MX + R
    ua = math.radians(up)
    cy_ = O[1] + ((cx_ - O[0]) * math.sin(ua) - (R + 20)) / math.cos(ua)
    b.append(circle(cx_, cy_, R, INK))
    b.append(T(cx_, cy_ + CAP * 132 / 2, '003', 132, 700, PAPER, anchor='middle', ls=0.02))
    # 锥下方：一条黑带（西里尔字母反白），一根红色短条沿副轴把它“铆”住；黑带伸出画面后从红锥底下穿过
    band = [bar(O, 330, 1500, 215, 307, INK)]
    t0 = P(O, 356, 261 + CAP * 64 / 2)
    band.append(T(t0[0], t0[1], 'КОНСТРУКТИВИЗМ', 64, 700, PAPER, 0.08, rot=A))
    band.append(bar(O, 300, 324, 188, 336, RED))
    # 声波：三道弧，圆心在嘴上
    for r in (268, 420, 655):
        a0, a1 = math.radians(up - 9), math.radians(lo + 9)
        p0 = (O[0] + r * math.cos(a0), O[1] + r * math.sin(a0))
        p1 = (O[0] + r * math.cos(a1), O[1] + r * math.sin(a1))
        b.append(f'<path d="M{p0[0]:.1f} {p0[1]:.1f} A{r} {r} 0 0 1 {p1[0]:.1f} {p1[1]:.1f}" fill="none" stroke="{INK}" stroke-width="5"/>')
    b += band
    b.append(poly([O, e1, e2], RED))
    b.append(circle(*O, 58, INK))
    # 锥里的四个字：中心沿主轴，字号 0.38d
    d = 210
    for ch in '构成主义':
        s = 0.36 * d
        c = P(O, d)
        b.append(ZH(c[0], c[1], ch, round(s), 900, INK, anchor='middle', rot=A,
                    extra=f' dominant-baseline="central"'))
        d = d * 1.56
    # 右上：期号与致敬说明（水平）
    b.append(T(MX + CW, MY + CAP * 22, 'DESIGN STYLE · NO.003', 22, 600, INK, 0.12, anchor='end'))
    b.append(ZH(MX + CW, MY + 52, '致敬：罗德琴科《书》海报，1924', 16, 400, GREY, anchor='end'))
    # 底部：一条线 + 三组信息，各占 1/3
    yb = 1150
    b.append(rect(MX, yb, CW, 6, INK))
    cols = [
        [('Constructivism', 700, INK, FAM), ('Конструктивизм', 400, INK, FAM), ('1917—1932', 400, GREY, FAM)],
        [('一条斜线，', 700, INK, FAM_SC), ('一块红，', 700, INK, FAM_SC), ('一个大声的字。', 700, RED, FAM_SC)],
        [('Design Style 风格 003', 700, INK, FAM_SC), ('每天一个设计风格', 400, INK, FAM_SC), ('@guanmo_ai', 400, GREY, FAM_SC)],
    ]
    for k, lines in enumerate(cols):
        for i, (s, wgt, fill, fam) in enumerate(lines):
            sz = 24 if fam == FAM else 20
            b.append(T(MX + k * 306, yb + 48 + i * 30, s, sz, wgt, fill, fam=fam, ls=0.04 if fam == FAM else 0))
    return svg('poster', '海报', join(b))


# ═════════════════════════════════════ 共用：页眉 / 页脚 / 小节标题 ═════════════════════════════════════
def mark(x, y, r=22):
    """角标：一个黑圆被红楔子从左下刺中（利西茨基《以红楔子打击白军》的缩写）；(x, y) 是圆心"""
    tip = (x + U[0] * r * 0.2, y + U[1] * r * 0.2)
    back = P((x, y), -r * 3.1)
    hw = r * 0.62
    return [circle(x, y, r, INK),
            poly([tip, (back[0] + N[0] * hw, back[1] + N[1] * hw), (back[0] - N[0] * hw, back[1] - N[1] * hw)], RED)]


def header(zh, en, sub, tag='design style no.03'):
    """页眉：中文 + 拉丁标题、一行灰色说明；右上角一个角标 + 期号；下面一根 4px 黑线"""
    y = MY + round(CJK * 52)
    b = [ZH(MX - 3, y, zh, 52, 900)]
    if en:
        b.append(T(MX + zw(zh, 52, 900) + 16, y, en, 52, 700, INK, 0.01))
    b.append(ZH(MX, MY + 96, sub, 20, 400, GREY))
    b += mark(MX + CW - 22, MY + 22)
    b.append(T(MX + CW, MY + 96, tag, 16, 500, GREY, 0.08, anchor='end'))
    b.append(rect(MX, MY + 118, CW, 4, INK))
    return b


def footer(y=H - 48):
    return [T(MX, y, 'github.com/guanmo-ai/design-style', 16, 400, GREY, 0.04),
            ZH(MX + CW, y, '@guanmo_ai · 每天一个设计风格', 16, 400, GREY, anchor='end')]


def section(y, n, zh, ru):
    """小节标题：红色斜切编号块（右边按主轴切斜）+ 中文 + 俄文；y 是基线"""
    x0, h = MX, 26
    cut = h * math.tan(math.radians(30))  # 15
    return [poly([(x0, y - 20), (x0 + 38 + cut, y - 20), (x0 + 38, y + 6), (x0, y + 6)], RED),
            T(x0 + 19, y - 1, f'{n:02d}', 17, 700, LIGHT, anchor='middle', ls=0.04),
            ZH(x0 + 62, y, zh, 22, 700, INK),
            T(x0 + 62 + zw(zh, 22, 700) + 10, y, ru, 16, 500, GREY, 0.08)]


def col(i):  # 速查卡沿用 001 / 002 的 6 栏：栏宽 135、间距 18
    return MX + i * 153


def colw(n):
    return n * 135 + (n - 1) * 18


# ═════════════════════════════════════ 2 · 速查卡 ═════════════════════════════════════
def cheatsheet():
    b = header('构成主义', 'Constructivism', '风格速查卡 · 1917—1932 · 莫斯科 / 维捷布斯克')

    # ── 01 轴 ──
    y = 250
    b += section(y, 1, '两条轴', 'ДИАГОНАЛЬ')
    bx, by, bw, bh = MX, y + 22, colw(3), 220
    b.append(rect(bx, by, bw, bh, LIGHT, f' stroke="{INK}" stroke-width="1.5"'))
    o = (bx + 64, by + bh - 36)
    # 0° 参考线 + 30° 角度弧
    b.append(f'<path d="M{o[0]:.1f} {o[1]:.1f} H{bx + bw - 24:.1f}" stroke="{GREY}" stroke-width="1.5" stroke-dasharray="4 5"/>')
    r = 86
    b.append(f'<path d="M{o[0] + r:.1f} {o[1]:.1f} A{r} {r} 0 0 0 {o[0] + r * U[0]:.1f} {o[1] + r * U[1]:.1f}" fill="none" stroke="{RED}" stroke-width="2"/>')
    b.append(T(o[0] + r + 8, o[1] - 14, '30°', 16, 700, RED))
    # 主轴：红粗条，字反白写在条里
    b.append(bar(o, 0, 330, -12, 12, RED))
    t = P(o, 150, 6)
    b.append(T(t[0], t[1], 'MAIN −30°', 15, 600, LIGHT, 0.1, rot=A))
    # 副轴：黑细条，与主轴垂直
    c = P(o, 250)
    b.append(bar(c, -6, 6, -84, 100, INK))
    t = P(c, 12, 30)
    b.append(T(t[0], t[1], 'CROSS 60°', 13, 600, INK, 0.1, rot=60))
    # 信息：水平的灰线
    for k, w_ in enumerate((150, 120, 136)):
        b.append(rect(bx + 24, by + 28 + k * 16, w_, 6, GREY if k else INK))
    b.append(ZH(bx + 24, by + 98, '信息 0°', 14, 700, INK))
    b.append(ZH(bx, by + bh + 28, '两条轴：主轴 −30° + 副轴 60°（互相垂直）', 16, 700, INK))
    b.append(ZH(bx, by + bh + 50, '斜的只给标题与色块，要读的字放平', 16, 400, GREY))
    rows = [('主轴', '−30° · 标题、色块、大字'),
            ('副轴', '60° · 粗条、“铆钉”、副标题'),
            ('信息', '0° · 日期、说明、数据一律水平'),
            ('节拍', '144 BPM · 25 帧 = 1 拍（视频）'),
            ('形状', '楔 · 圆 · 粗条 —— 圆角 0'),
            ('出血', '斜的东西可以出画面，字不行')]
    for i, (k, v) in enumerate(rows):
        yy = by + 24 + i * 38
        b.append(ZH(col(3) + 18, yy, k, 16, 400, GREY))
        b.append(ZH(col(4) - 30, yy, v, 17, 700, INK))
        if i:
            b.append(rect(col(3) + 18, yy - 25, colw(3) - 18, 1, RULE))

    # ── 02 色板 ──
    y = 596
    b += section(y, 2, '色板', 'ЦВЕТ')
    sw = [('旧纸', PAPER, '236 228 210', 50), ('印刷黑', INK, '22 20 18', 30),
          ('构成红', RED, '211 38 28', 15), ('网点灰', GREY, '143 137 125', 5)]
    for i, (name, hx, rgb, area) in enumerate(sw):
        x = col(i)
        b.append(rect(x, y + 22, 135, 64, hx, f' stroke="{INK}" stroke-width="1"' if hx == PAPER else ''))
        b.append(ZH(x, y + 114, name, 18, 700, INK))
        b.append(T(x + 135, y + 114, f'{area}%', 17, 700, RED if hx == RED else INK, anchor='end'))
        b.append(T(x, y + 136, hx, 16, 400, INK, 0.04))
        b.append(T(x, y + 156, rgb, 16, 400, GREY, 0.04))
    bx, bw = col(4), colw(2)
    acc = 0
    for name, hx, rgb, area in sw:
        w_ = bw * area / 100
        b.append(rect(bx + acc, y + 22, w_, 64, hx, f' stroke="{INK}" stroke-width="1"' if hx == PAPER else ''))
        acc += w_
    b.append(ZH(bx, y + 114, '建议面积', 18, 700, INK))
    b.append(ZH(bx, y + 136, '红是动词：推、冲、喊。', 16, 400, INK))
    b.append(ZH(bx, y + 156, '亮纸 #F6F1E6 只给“白圆”。', 16, 400, GREY))

    # ── 03 字体 ──
    y = 806
    b += section(y, 3, '字体', 'ШРИФТ')
    S = 120
    base = y + 30 + round(CAP * S)
    x0 = MX - lsb('К', S)
    b.append(T(x0, base, 'КНИГИ', S, 700, INK, 0.02))
    wk = width('КНИГИ', S, 700, 0.02) - lsb('К', S)
    for yy, lab in ((base - CAP * S, '大写高度 0.81'), (base, '基线')):
        b.append(rect(MX, yy, colw(3), 1, RED))
        b.append(ZH(MX + colw(3), yy - 6, lab, 12, 700, RED, anchor='end'))
    b.append(rect(MX, base + 16, wk, 24, RED))
    b.append(ZH(MX + wk + 10, base + 34, '粗条 24 ≈ 字高 ¼', 12, 700, RED))
    notes = [('Oswald 700 / 500', '标题、数字、西里尔字母 · 全大写 · 字距 +0.08em', FAM),
             ('思源黑体 Noto Sans SC', '中文：Black 900 标题 · Bold 700 · Regular 400 正文', FAM_SC),
             ('为什么用窄体', '同样的宽度，窄体能放更大的字号 —— 大字靠字号，不靠加粗', FAM_SC),
             ('1920 年代', '没有现成的字库：字是用直尺和圆规画出来的', FAM_SC)]
    for i, (k, v, fam) in enumerate(notes):
        yy = y + 34 + i * 48
        b.append(T(col(3) + 18, yy, k, 17, 700, INK, fam=fam, ls=0.02 if fam == FAM else 0))
        b.append(ZH(col(3) + 18, yy + 22, v, 14, 400, GREY))

    # ── 04 五条规则 ──
    y = 1050
    b += section(y, 4, '五条规则', 'ПЯТЬ ПРАВИЛ')
    rules = [('斜线', '主轴 −30°，', '信息永远 0°'),
             ('红与黑', '红 15%、黑 30%，', '其余是纸'),
             ('组装', '粗条、圆、楔子', '像零件一样拼'),
             ('蒙太奇', '照片剪开再拼，', '只留最要紧的局部'),
             ('大字', '最重要的字最大，', '大到出血')]
    cw5, gap = 168, 15
    for i, (name, l1, l2) in enumerate(rules):
        x = MX + i * (cw5 + gap)
        b += pict(i, x, y + 18, cw5, 64)
        b.append(T(x, y + 106, str(i + 1), 20, 700, RED))
        b.append(ZH(x + 16, y + 106, name, 18, 700, INK))
        b.append(ZH(x, y + 128, l1, 14, 400, GREY))
        b.append(ZH(x, y + 147, l2, 14, 400, GREY))

    # ── 这样做 / 别这样 ──
    y = 1252
    hw = (CW - 18) / 2
    b.append(rect(MX, y - 30, hw, 46, INK))
    b.append(ZH(MX + 16, y, '这样做', 17, 700, LIGHT))
    b.append(ZH(MX + 90, y, '一条主轴 · 红只给一个主角 · 要读的字放平', 14, 400, LIGHT))
    b.append(rect(MX + hw + 18 + 1, y - 29, hw - 2, 44, 'none', f' stroke="{RED}" stroke-width="2"'))
    b.append(ZH(MX + hw + 34, y, '别这样', 17, 700, RED))
    b.append(ZH(MX + hw + 108, y, '到处乱斜 · 假西里尔（Я 当 R）· 圆角渐变', 14, 400, INK))
    b += footer()
    return svg('cheatsheet', '速查卡', join(b), cheat_defs())


def pict(i, x, y, w, h):
    """五条规则的小图标：每个 168 × 64"""
    b = [rect(x, y, w, h, LIGHT, f' stroke="{INK}" stroke-width="1"')]
    clip = f' clip-path="url(#pc{i})"'
    g = []
    cxm, cym = x + w / 2, y + h / 2
    if i == 0:  # 斜线：一根红条冲出右上角
        g.append(bar((x + 18, y + h - 10), 0, 220, -7, 7, RED))
        g.append(rect(x + 18, y + h - 14, 70, 2, INK))
    elif i == 1:  # 红与黑：沿主轴切开
        g.append(poly([(x, y + h), (x + w, y + h), (x + w, y + h - w * 0.577 / 2 - 10)], RED))
        g.append(poly([(x, y + h), (x, y), (x + 40, y)], INK))
    elif i == 2:  # 组装：圆 + 粗条 + 楔
        g.append(circle(x + 52, cym + 4, 20, INK))
        g.append(bar((x + 30, cym + 24), 0, 130, -5, 5, RED))
        g.append(poly([(x + 120, y + 14), (x + 150, y + 10), (x + 132, y + 34)], INK))
    elif i == 3:  # 蒙太奇：一颗网点“眼球”被切成三条，上下错开
        for k, dy in enumerate((-6, 5, -2)):
            for a in range(-5, 6):
                for c in range(-5, 6):
                    px, py = c * 5.4, a * 5.4
                    rr = math.hypot(px, py)
                    if rr > 27 or not (-27 + 18 * k <= px < -9 + 18 * k):
                        continue
                    g.append(circle(cxm + 22 + px + (k - 1) * 4, cym + py + dy, 2.5 * (1 - rr / 34) + 0.5, INK))
        g.append(rect(x + 18, cym - 3, 40, 6, RED))
    else:  # 大字：一个出血的 А
        g.append(T(x + 70, y + h + 34, 'А', 150, 700, RED))
    b.append(f'<g{clip}>' + ''.join(g) + '</g>')
    return b


def cheat_defs():
    d = []
    cw5, gap = 168, 15
    for i in range(5):
        x = MX + i * (cw5 + gap)
        d.append(f'\n    <clipPath id="pc{i}"><rect x="{x}" y="{1050 + 18}" width="{cw5}" height="64"/></clipPath>')
    return ''.join(d)


# ═════════════════════════════════════ 3 · 如果构成主义来做 app ═════════════════════════════════════
def phone(x, y, w=423, h=882):
    """手机外框：黑色机身 + 旧纸屏幕 + 灵动岛 + 状态栏；返回 (元素, 屏幕内容左边, 右边, 顶)"""
    b = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="56" fill="{INK}"/>',
         f'<rect x="{x + 11}" y="{y + 11}" width="{w - 22}" height="{h - 22}" rx="46" fill="{LIGHT}"/>',
         f'<rect x="{x + w / 2 - 52}" y="{y + 24}" width="104" height="30" rx="15" fill="{INK}"/>',
         T(x + 44, y + 47, '9:41', 16, 600, INK)]
    rx = x + w - 44
    b += [rect(rx - 24, y + 36, 22, 11, 'none', f' stroke="{INK}" stroke-width="1.5" rx="3"'), rect(rx - 22, y + 38, 15, 7, INK, ' rx="1.5"')]
    for k in range(4):
        b.append(rect(rx - 56 + k * 6, y + 47 - 4 - k * 2.5, 4, 4 + k * 2.5, INK))
    return b, x + 36, x + w - 36, y + 78


def slash(x, y, h, w, fill):
    """一道 60° 的斜杠（平行四边形）：左下角在 (x, y)"""
    dx = h * math.tan(math.radians(30))
    return poly([(x, y), (x + dx, y - h), (x + dx + w, y - h), (x + w, y)], fill)


def app_ui():
    b = header('如果构成主义来做', 'app', '一百年前的规则，今天的界面 · 一个跑步训练 app 的概念稿', 'ui concept no.03')
    py, pw, ph = 236, 423, 882
    defs = []

    # ── 屏一：今日 ──
    px = MX
    p1, x0, x1, top = phone(px, py)
    b += p1
    b.append(T(x0, top + 24, 'СЕГОДНЯ', 13, 600, GREY, 0.12))
    b.append(ZH(x0 + width('СЕГОДНЯ', 13, 600, 0.12) + 8, top + 24, '今日 · 周四 10 月 24 日', 13, 400, GREY))
    b.append(ZH(x0 - 2, top + 72, '间歇跑', 40, 900, INK))
    # 主视觉：黑底 + 一条沿主轴穿过的红带（只有它是斜的）
    hx0, hx1, hy0, hy1 = px + 11, px + pw - 11, top + 92, top + 322
    defs.append(f'\n    <clipPath id="hero"><rect x="{hx0}" y="{hy0}" width="{hx1 - hx0}" height="{hy1 - hy0}"/></clipPath>')
    b.append(rect(hx0, hy0, hx1 - hx0, hy1 - hy0, INK))
    o = (hx0, hy1 + 74)
    g = [bar(o, -40, 560, -27, 27, RED)]
    t = P(o, 150, 7)
    g.append(T(t[0], t[1], 'ИНТЕРВАЛЫ · INTERVALS · 8 × 400', 17, 600, INK, 0.14, rot=A))
    b.append('<g clip-path="url(#hero)">' + ''.join(g) + '</g>')
    S = 84
    b.append(T(x0 - lsb('8', S), hy0 + 28 + round(CAP * S), '8 × 400', S, 700, LIGHT, 0.0))
    b.append(ZH(x0, hy0 + 130, '米 · 组间慢跑 200 米', 14, 400, LIGHT))
    b.append(ZH(x0, hy0 + 156, '目标配速', 13, 400, GREY))
    b.append(T(x0 + 58, hy0 + 156, "4'05\" / KM", 15, 600, LIGHT, 0.04))
    # 开始：红块，右边按 60° 切斜
    ty = top + 346
    b.append(poly([(x0, ty), (x1, ty), (x1 - 37, ty + 64), (x0, ty + 64)], RED))
    b.append(ZH(x0 + 20, ty + 41, '开始', 22, 900, LIGHT))
    b.append(T(x0 + 76, ty + 40, 'СТАРТ', 17, 600, LIGHT, 0.14))
    b.append(poly([(x1 - 64, ty + 32), (x1 - 104, ty + 18), (x1 - 104, ty + 46)], INK))
    # 本周：要读的全部水平
    ly = top + 446
    b.append(ZH(x0, ly, '本周', 15, 700, INK))
    b.append(T(x1, ly, '32.4 / 40 KM', 15, 600, INK, 0.04, anchor='end'))
    b.append(rect(x0, ly + 10, x1 - x0, 4, RULE))
    b.append(rect(x0, ly + 10, (x1 - x0) * 32.4 / 40, 4, INK))
    days = [('周一', '轻松跑', '6.0', 1), ('周二', '休息', '—', 0), ('周三', '节奏跑', '8.0', 1),
            ('周四', '间歇跑', '6.4', 2), ('周五', '休息', '—', 0), ('周六', '长距离', '16.0', 0)]
    for i, (d, name, km, st) in enumerate(days):
        yy = ly + 50 + i * 38
        on = st == 2
        if on:
            b.append(rect(x0 - 36 + 11, yy - 24, 6, 34, RED))
        b.append(ZH(x0, yy, d, 14, 700 if on else 400, INK if on or st else GREY))
        b.append(ZH(x0 + 52, yy, name, 15, 700 if on else 400, INK if st or on else GREY))
        b.append(T(x1 - 36, yy, km, 17, 600, INK if st or on else GREY, 0.02, anchor='end'))
        if st == 1:
            b.append(slash(x1 - 22, yy + 2, 18, 7, RED))
        elif on:
            b.append(ZH(x1, yy, '今天', 12, 700, RED, anchor='end'))
        b.append(rect(x0, yy + 13, x1 - x0, 1, RULE))
    # 底栏
    yb = py + ph - 40
    b.append(rect(x0, yb - 38, x1 - x0, 1, RULE))
    for i, lab in enumerate(['今日', '计划', '记录']):
        xx = x0 + i * (x1 - x0) / 3
        b.append(ZH(xx, yb, lab, 15, 700 if i == 0 else 400, INK if i == 0 else GREY))
        if i == 0:
            b.append(rect(xx, yb - 38, 40, 4, RED))

    # ── 屏二：跑步中 ──
    px = MX + CW - pw
    p2, x0, x1, top = phone(px, py)
    b += p2
    b.append(T(x0, top + 24, 'ПРОБЕГ', 13, 600, GREY, 0.12))
    b.append(ZH(x0 + width('ПРОБЕГ', 13, 600, 0.12) + 8, top + 24, '已跑', 13, 400, GREY))
    b.append(circle(x1 - 62, top + 19, 5, RED))
    b.append(T(x1, top + 24, '30:21', 15, 600, INK, 0.04, anchor='end'))
    S = 168
    nb = top + 44 + round(CAP * S)
    b.append(T(x0 - lsb('6', S), nb, '6.24', S, 700, INK, -0.01))
    nw = width('6.24', S, 700, -0.01) - lsb('6', S)
    b.append(T(x0 + nw + 10, nb, 'KM', 30, 700, RED, 0.04))
    b.append(ZH(x0, nb + 32, '公里 · 目标 10.00', 14, 400, GREY))
    # 进度：一个越跑越宽的红楔子（沿主轴），走到 62%
    o = (x0, top + 408)
    Lc, hw = 372, 32
    k = 0.624
    b.append(poly([o, P(o, Lc, -hw), P(o, Lc, hw)], 'none', f' stroke="{INK}" stroke-width="1.5"'))
    b.append(poly([o, P(o, Lc * k, -hw * k), P(o, Lc * k, hw * k)], RED))
    for j in range(1, 10):
        p0, p1_ = P(o, Lc * j / 10, hw * j / 10), P(o, Lc * j / 10, hw * j / 10 + 8)
        b.append(f'<path d="M{p0[0]:.1f} {p0[1]:.1f} L{p1_[0]:.1f} {p1_[1]:.1f}" stroke="{INK}" stroke-width="1.5"/>')
    tp = P(o, Lc * k, hw * k + 16)
    b.append(T(tp[0] + 4, tp[1] + 16, '62%', 15, 700, RED, 0.04))
    # 数据：2 × 2，全部水平
    gy = top + 452
    cells = [('配速', "4'52\"", '/KM'), ('心率', '156', 'BPM'), ('用时', '30:21', ''), ('步频', '178', 'SPM')]
    cwid = (x1 - x0) / 2
    for i, (lab, v, unit) in enumerate(cells):
        cx0 = x0 + (i % 2) * cwid + (16 if i % 2 else 0)
        cy0 = gy + (i // 2) * 92
        b.append(rect(cx0, cy0, cwid - 16, 3, INK))
        b.append(ZH(cx0, cy0 + 24, lab, 13, 400, GREY))
        b.append(T(cx0, cy0 + 72, v, 44, 700, RED if lab == '心率' else INK, 0.0))
        if unit:
            b.append(T(cx0 + width(v, 44, 700) + 6, cy0 + 72, unit, 14, 600, GREY, 0.08))
    # 分段提示
    sy = top + 650
    b.append(rect(px + 11, sy, pw - 22, 56, INK))
    b.append(T(x0, sy + 36, 'КМ 6', 20, 700, RED, 0.06))
    b.append(ZH(x0 + 60, sy + 35, "4'48\" · 比上一公里快 6 秒", 15, 500, LIGHT))
    # 按钮：暂停（黑）/ 分段（红），中间一道 60° 的缝
    by0, bh = top + 718, 60
    mid = (x0 + x1) / 2
    dx = bh * math.tan(math.radians(30)) / 2
    b.append(poly([(x0, by0), (mid + dx - 5, by0), (mid - dx - 5, by0 + bh), (x0, by0 + bh)], INK))
    b.append(poly([(mid + dx + 5, by0), (x1, by0), (x1, by0 + bh), (mid - dx + 5, by0 + bh)], RED))
    b.append(ZH(x0 + 22, by0 + 41, '暂停', 20, 900, LIGHT))
    b.append(ZH(x1 - 22, by0 + 41, '分段', 20, 900, LIGHT, anchor='end'))

    # ── 说明 ──
    cy = py + ph + 50
    notes = [('今日', '斜的只有一样：那条红带', '训练内容、日期、距离全部水平，扫一眼就能读'),
             ('跑步中', '进度是一个越跑越宽的红楔子', '最大的字给最重要的数：已经跑了多少公里')]
    for i, (n, l1, l2) in enumerate(notes):
        x = MX + i * (CW - pw)
        sx, sy_ = x, cy
        b.append(poly([(sx, sy_ - 20), (sx + 38 + 15, sy_ - 20), (sx + 38, sy_ + 6), (sx, sy_ + 6)], RED))
        b.append(T(sx + 19, sy_ - 1, f'{i + 1:02d}', 17, 700, LIGHT, anchor='middle', ls=0.04))
        b.append(ZH(sx + 62, sy_, n, 20, 700, INK))
        b.append(ZH(x, cy + 32, l1, 16, 700, INK))
        b.append(ZH(x, cy + 56, l2, 14, 400, GREY))
    b += footer()
    return svg('app-ui', '如果构成主义来做 app', join(b), ''.join(defs))


# ═════════════════════════════════════ 4 · 四步改造 ═════════════════════════════════════
SW, SH = 435, 440  # 每张小海报


def mini(k):
    """同一张活动海报（读书夜）的四个版本；局部坐标 435 × 440"""
    BLUE, ORANGE, GREEN, PINK, DARK, MUTE = '#2F6FD0', '#F2994A', '#39B57A', '#F4B6C8', '#2B2F36', '#7A8AA0'
    b = []
    if k == 0:  # 原稿：居中、水平、五种颜色、圆角
        b.append(rect(0, 0, SW, SH, '#EAF0F7'))
        b += [circle(54, 58, 26, PINK), circle(398, 286, 30, PINK), circle(380, 64, 12, GREEN)]
        b.append(rect(SW / 2 - 50, 62, 100, 78, ORANGE, ' rx="14"'))
        b.append(rect(SW / 2 - 2, 70, 4, 62, '#FFFFFF', ' rx="2"'))
        b.append(ZH(SW / 2, 222, '读书夜', 56, 900, BLUE, anchor='middle'))
        b.append(ZH(SW / 2, 254, 'BOOK NIGHT', 16, 500, MUTE, 0.25, anchor='middle'))
        b.append(ZH(SW / 2, 298, '10 月 24 日 周六 19:00', 16, 500, DARK, anchor='middle'))
        b.append(ZH(SW / 2, 322, '城市图书馆 · 三楼', 15, 400, MUTE, anchor='middle'))
        b.append(rect(SW / 2 - 76, 348, 152, 42, GREEN, ' rx="21"'))
        b.append(ZH(SW / 2, 375, '立即报名', 16, 700, '#FFFFFF', anchor='middle'))
        return b
    o = (34, 330)  # 主轴起点（三个版本共用）
    if k in (1, 2):
        pal = (BLUE, ORANGE, GREEN, DARK, MUTE) if k == 1 else (INK, RED, RED, INK, GREY)
        tc, ic, bc, dc, mc = pal
        b.append(rect(0, 0, SW, SH, '#EAF0F7' if k == 1 else PAPER))
        if k == 1:
            b += [circle(54, 58, 26, PINK), circle(398, 286, 30, PINK)]
            c = P(o, 300, -44)
            b.append(f'<g transform="rotate({A} {c[0]:.1f} {c[1]:.1f})">' + rect(c[0] - 50, c[1] - 39, 100, 78, ic, ' rx="14"')
                     + rect(c[0] - 2, c[1] - 31, 4, 62, '#FFFFFF', ' rx="2"') + '</g>')
        else:
            c = P(o, 300, -44)
            b.append(circle(c[0], c[1], 64, INK))
            b.append(poly([P(c, 6), P(c, -190, -26), P(c, -190, 26)], RED))
        b.append(ZH(o[0], o[1], '读书夜', 72, 900, tc, rot=A))
        t = P(o, 4, 34)
        b.append(T(t[0], t[1], 'BOOK NIGHT', 18, 600 if k == 2 else 500, mc if k == 1 else INK, 0.25,
                   fam=FAM_SC if k == 1 else FAM, rot=A))
        b.append(ZH(24, 396, '10 月 24 日 周六 19:00', 15, 700, dc))
        b.append(ZH(24, 418, '城市图书馆 · 三楼', 13, 400, mc))
        if k == 1:
            b.append(rect(SW - 24 - 128, 384, 128, 38, bc, ' rx="19"'))
        else:
            b.append(rect(SW - 24 - 128, 384, 128, 38, bc))
        b.append(ZH(SW - 24 - 64, 409, '立即报名', 15, 700, '#FFFFFF' if k == 1 else LIGHT, anchor='middle'))
        return b
    # 大字 + 组装
    b.append(rect(0, 0, SW, SH, PAPER))
    c = (382, 56)
    b.append(circle(*c, 112, INK))
    b.append(poly([P(c, 10), P(c, -430, -42), P(c, -430, 42)], RED))
    o = (14, 418)
    b.append(ZH(o[0], o[1], '读书夜', 134, 900, INK, rot=A))
    # 黑带 + 拉丁字，红色短条沿副轴把黑带“铆”住
    bo = P(o, 196, 24)
    b.append(bar(bo, 0, 400, 0, 40, INK))
    t = P(bo, 18, 20 + CAP * 20 / 2)
    b.append(T(t[0], t[1], 'BOOK NIGHT', 20, 600, LIGHT, 0.22, rot=A))
    b.append(bar(bo, -14, 0, -16, 64, RED))
    b.append(T(24, 52 + 0, '10.24', 56, 700, RED, 0.0))
    b.append(ZH(24, 82, '周六 19:00 · 城市图书馆三楼', 13, 700, INK))
    b.append(rect(24, 96, 96, 6, INK))
    b.append(rect(SW - 24 - 128, 384, 128, 38, RED))
    b.append(ZH(SW - 24 - 64, 409, '立即报名', 15, 700, LIGHT, anchor='middle'))
    return b


def steps():
    b = header('四步改造', '', '同一张普通海报，每一步只改一件事 —— 改到第四步，它就开始“喊”了', 'how-to no.03')
    defs = []
    caps = [('原稿', '居中、水平、五种颜色、圆角', '哪儿都对，哪儿都不响'),
            ('转轴', '只改一件事：标题和主图沿 −30° 放', '日期、地点照样水平，照样好读'),
            ('红与黑', '颜色收成纸 / 黑 / 红，圆角变直角', '书的图标换成一个圆和一个楔子'),
            ('大字 + 组装', '最重要的三个字放到最大，出血', '粗条和黑带把零件“铆”在一起')]
    for k in range(4):
        x = MX + (k % 2) * (SW + 30)
        y = 222 + (k // 2) * (SH + 96)
        defs.append(f'\n    <clipPath id="m{k}"><rect width="{SW}" height="{SH}"/></clipPath>')
        b.append(f'<g transform="translate({x} {y})"><g clip-path="url(#m{k})">')
        b += ['  ' + e for e in mini(k)]
        b.append('</g></g>')
        b.append(rect(x, y, SW, SH, 'none', f' stroke="{INK}" stroke-width="1" opacity="0.25"'))
        cy = y + SH + 32
        n, l1, l2 = caps[k]
        b.append(poly([(x, cy - 20), (x + 53, cy - 20), (x + 38, cy + 6), (x, cy + 6)], RED if k == 3 else INK))
        b.append(T(x + 19, cy - 1, f'{k + 1:02d}', 17, 700, LIGHT, anchor='middle', ls=0.04))
        b.append(ZH(x + 62, cy, n, 20, 700, INK))
        b.append(ZH(x + 62 + zw(n, 20, 700) + 12, cy, l1, 14, 700, INK))
        b.append(ZH(x + 62 + zw(n, 20, 700) + 12, cy + 22, l2, 14, 400, GREY))
        if k % 2 == 0:  # 两张之间一个红楔子当箭头
            ax, ay = x + SW + 15, y + SH / 2
            b.append(poly([(ax + 9, ay), (ax - 7, ay - 9), (ax - 7, ay + 9)], RED))
    b += footer()
    return svg('steps', '四步改造', join(b), ''.join(defs))


def main():
    files = {'poster': poster(), 'cheatsheet': cheatsheet(), 'app-ui': app_ui(), 'steps': steps()}
    for name, content in files.items():
        open(os.path.join(HERE, f'{name}.svg'), 'w', encoding='utf-8').write(content)
        print('wrote', name + '.svg')


if __name__ == '__main__':
    main()
