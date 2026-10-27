"""
风格 009 候选 C · 新粗野主义 Neo-Brutalism —— 风格图（1080×1350）

  poster.svg      一张海报：硬阴影的标题块 + 一颗被按下去的按钮 + 贴纸
  cheatsheet.svg  速查卡：五个令牌（描边 / 硬阴影 / 圆角 / 颜色 / 字）、按钮三态、五条规则
  app-ui.svg      如果新粗野主义来做 app：一个记账页，带标注

所有“阴影”都是一个偏移的黑色同形块，模糊永远是 0。
用法：python3 styles/009-neo-brutalism/images/make_svgs.py
"""
import os
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1350

INK = '#000000'
PAPER = '#FFF6E5'
YELLOW = '#FFD23F'
PINK = '#FF8FD6'
LIME = '#B8F15A'
BLUE = '#7AA2FF'
ORANGE = '#FF7A45'
WHITE = '#FFFFFF'

GROT = "'Space Grotesk', 'Archivo', 'Noto Sans SC', sans-serif"
HEAVY = "'Archivo', 'Space Grotesk', 'Noto Sans SC', sans-serif"
MONO = "'Space Mono', 'JetBrains Mono', ui-monospace, 'Noto Sans SC', monospace"
SC = "'Noto Sans SC', 'PingFang SC', sans-serif"

BORDER = 4
SHADOW = 8


def t(x, y, size, text, family=SC, weight=400, fill=INK, ls='0', anchor='start', extra=''):
    return (
        f'<text x="{x:.1f}" y="{y:.1f}" font-family="{family}" font-weight="{weight}" '
        f'font-size="{size}" fill="{fill}" letter-spacing="{ls}" text-anchor="{anchor}" {extra}>'
        f'{escape(text)}</text>'
    )


def wide(wdth=112):
    return f'style="font-variation-settings:\'wdth\' {wdth}"'


def head(defs=''):
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img">\n'
        f'  <defs>{defs}</defs>\n'
    )


FOOT = '</svg>\n'


def box(x, y, w, h, fill, r=0, shadow=SHADOW, border=BORDER):
    """新粗野主义的全部秘密：同形黑块偏移 shadow px（0 模糊）+ 黑描边"""
    o = []
    if shadow:
        o.append(f'<rect x="{x + shadow}" y="{y + shadow}" width="{w}" height="{h}" rx="{r}" fill="{INK}"/>')
    o.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{INK}" stroke-width="{border}"/>')
    return ''.join(o)


def rot(cx, cy, deg, inner):
    return f'<g transform="rotate({deg} {cx} {cy})">{inner}</g>'


def star(cx, cy, r, fill, n=8, k=0.55):
    import math
    pts = []
    for i in range(2 * n):
        rr = r if i % 2 == 0 else r * k
        a = math.pi * i / n - math.pi / 2
        pts.append(f'{cx + rr * math.cos(a):.1f},{cy + rr * math.sin(a):.1f}')
    p = ' '.join(pts)
    sh = ' '.join(f'{float(a) + 6:.1f},{float(b) + 6:.1f}' for a, b in (q.split(',') for q in pts))
    return (f'<polygon points="{sh}" fill="{INK}"/>'
            f'<polygon points="{p}" fill="{fill}" stroke="{INK}" stroke-width="{BORDER}" stroke-linejoin="round"/>')


def cursor(x, y, s=1.0):
    d = 'M0 0 L0 46 L12 35 L21 55 L30 51 L21 31 L37 31 Z'
    return (f'<path d="{d}" transform="translate({x + 4} {y + 4}) scale({s})" fill="{INK}"/>'
            f'<path d="{d}" transform="translate({x} {y}) scale({s})" fill="{WHITE}" stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"/>')


def window(x, y, w, h, title, fill=WHITE, bar=YELLOW, shadow=SHADOW):
    o = [box(x, y, w, h, fill, 0, shadow)]
    o.append(f'<rect x="{x}" y="{y}" width="{w}" height="44" fill="{bar}" stroke="{INK}" stroke-width="{BORDER}"/>')
    for i, c in enumerate((ORANGE, YELLOW, LIME)):
        o.append(f'<rect x="{x + 16 + i * 26}" y="{y + 14}" width="16" height="16" fill="{c}" stroke="{INK}" stroke-width="3"/>')
    o.append(t(x + 100, y + 29, 16, title, MONO, 700, INK))
    return ''.join(o)


# ───────────────────────────── 海报 ─────────────────────────────

def poster():
    s = [head(), f'<rect width="{W}" height="{H}" fill="{PAPER}"/>']
    # 背景点阵：可见的网格
    dots = ''.join(f'<circle cx="{x}" cy="{y}" r="1.6" fill="{INK}" opacity="0.18"/>' for x in range(30, W, 30) for y in range(30, H, 30))
    s.append(dots)
    # 顶部条
    s.append(box(60, 56, W - 120, 56, INK, 0, 0))
    s.append(t(84, 93, 18, 'DESIGN STYLE / 009', MONO, 700, YELLOW))
    s.append(t(W - 84, 93, 18, '2021 → NOW', MONO, 700, YELLOW, '0', 'end'))
    # 标题：三块，每块不同颜色，统一 8px 硬阴影
    s.append(rot(300, 250, -3, box(70, 160, 470, 170, PINK) + t(98, 296, 150, 'NEO', HEAVY, 900, INK, '-0.03em', extra=wide(112))))
    s.append(box(60, 360, 960, 190, YELLOW) + t(84, 508, 166, 'BRUTAL', HEAVY, 900, INK, '-0.03em', extra=wide(125)))
    s.append(rot(830, 645, 2.5, box(650, 580, 360, 130, LIME) + t(684, 678, 104, 'ISM', HEAVY, 900, INK, '-0.02em', extra=wide(125))))
    # 中文
    s.append(t(70, 676, 72, '新粗野主义', SC, 900, INK))
    # 代码条
    s.append(box(70, 728, 470, 112, WHITE))
    s.append(t(94, 770, 19, 'border: 4px solid #000;', MONO, 700, INK))
    s.append(t(94, 806, 19, 'box-shadow: 8px 8px 0 #000;', MONO, 700, INK))
    s.append(t(94, 830, 13, '/* blur = 0. always. */', MONO, 400, INK, extra='opacity="0.55"'))
    # 窗口卡
    s.append(window(590, 760, 420, 270, 'raw.html', WHITE, BLUE))
    s.append(t(616, 860, 28, '不讨好，', SC, 900, INK))
    s.append(t(616, 900, 28, '只诚实。', SC, 900, INK))
    s.append(t(616, 944, 15, '把结构露出来：框、格、阴影，', SC, 400, INK))
    s.append(t(616, 968, 15, '每一层都看得见。', SC, 400, INK))
    s.append(f'<rect x="616" y="994" width="220" height="16" fill="{PAPER}" stroke="{INK}" stroke-width="3"/>')
    s.append(f'<rect x="616" y="994" width="150" height="16" fill="{PINK}" stroke="{INK}" stroke-width="3"/>')
    # 按钮：默认 vs 按下
    s.append(box(70, 890, 230, 76, YELLOW))
    s.append(t(185, 938, 24, '按我 →', SC, 900, INK, '0', 'middle'))
    s.append(t(70, 1004, 13, 'DEFAULT · 8px', MONO, 700, INK))
    s.append(box(330 + SHADOW, 890 + SHADOW, 230, 76, PINK, 0, 0))
    s.append(t(445 + SHADOW, 938 + SHADOW, 24, '按下去 ✓', SC, 900, INK, '0', 'middle'))
    s.append(t(330, 1004, 13, 'PRESSED · 0px', MONO, 700, INK))
    s.append(cursor(528, 952))
    # 贴纸
    s.append(rot(930, 210, 12, star(930, 210, 74, ORANGE) + t(930, 222, 30, 'RAW!', HEAVY, 900, INK, '0', 'middle')))
    s.append(rot(170, 1110, -6, box(80, 1064, 210, 74, BLUE, 37) + t(185, 1112, 24, '0 BLUR', MONO, 700, INK, '0', 'middle')))
    s.append(rot(470, 1110, 4, box(330, 1070, 300, 64, WHITE) + t(480, 1112, 20, '★ 黑框 · 硬影 · 原色', SC, 900, INK, '0', 'middle')))
    # 底栏
    s.append(f'<rect x="0" y="{H - 150}" width="{W}" height="150" fill="{INK}"/>')
    s.append(t(60, H - 88, 32, 'NEO-BRUTALISM', HEAVY, 900, PAPER, '-0.01em', extra=wide(125)))
    s.append(t(60, H - 50, 16, '粗野主义建筑（1950s）→ 粗野主义网页（2014）→ 新粗野主义界面（2021—）', SC, 400, PAPER, extra='opacity="0.8"'))
    s.append(t(W - 60, H - 88, 16, 'Design Style 风格 009', SC, 700, YELLOW, '0', 'end'))
    s.append(t(W - 60, H - 60, 16, '@guanmo_ai', MONO, 700, PAPER, '0', 'end'))
    s.append(FOOT)
    return ''.join(s)


# ───────────────────────────── 速查 ─────────────────────────────

def cheatsheet():
    s = [head(), f'<rect width="{W}" height="{H}" fill="{PAPER}"/>']
    L = 64
    s.append(box(L, 56, W - 2 * L, 132, YELLOW))
    s.append(t(L + 26, 136, 68, 'NEO-BRUTAL', HEAVY, 900, INK, '-0.02em', extra=wide(125)))
    s.append(t(L + 28, 172, 20, '速查 · 五个令牌、三种状态、五条规则', SC, 700, INK))
    s.append(t(W - L - 26, 172, 14, '009 · 2021 → NOW', MONO, 700, INK, '0', 'end'))
    # 令牌：五张卡
    tokens = [
        ('BORDER', '描边', '3–4px', '纯黑，不用灰', lambda x, y: f'<rect x="{x + 24}" y="{y + 20}" width="100" height="56" fill="{WHITE}" stroke="{INK}" stroke-width="4"/>'),
        ('SHADOW', '硬阴影', '4 / 6 / 8px', '偏移，0 模糊', lambda x, y: box(x + 22, y + 16, 92, 52, PINK)),
        ('RADIUS', '圆角', '0 · 8 · 999', '只选一档', lambda x, y: f'<rect x="{x + 22}" y="{y + 20}" width="100" height="56" rx="12" fill="{LIME}" stroke="{INK}" stroke-width="4"/>'),
        ('COLOR', '颜色', '5 色 · 高饱和', '平涂，无渐变', lambda x, y: ''.join(f'<rect x="{x + 18 + i * 22}" y="{y + 20}" width="22" height="56" fill="{c}" stroke="{INK}" stroke-width="3"/>' for i, c in enumerate((YELLOW, PINK, LIME, BLUE, ORANGE)))),
        ('TYPE', '字', 'Grotesk 700', '大、粗、紧', lambda x, y: t(x + 20, y + 72, 56, 'Aa', GROT, 700, INK, '-0.04em')),
    ]
    cw, gap = 170, 18
    for i, (en, zh, val, note, draw) in enumerate(tokens):
        x = L + i * (cw + gap)
        y = 236
        s.append(box(x, y, cw, 210, WHITE, 0, 6, 3))
        s.append(draw(x, y))
        s.append(f'<path d="M{x} {y + 100} H{x + cw}" stroke="{INK}" stroke-width="3"/>')
        s.append(t(x + 14, y + 128, 12, en, MONO, 700, INK, '0.06em'))
        s.append(t(x + 14, y + 156, 22, zh, SC, 900, INK))
        s.append(t(x + 14, y + 180, 14, val, MONO, 700, INK))
        s.append(t(x + 14, y + 200, 13, note, SC, 400, INK, extra='opacity="0.7"'))
    # 颜色值
    hexes = [(YELLOW, '#FFD23F'), (PINK, '#FF8FD6'), (LIME, '#B8F15A'), (BLUE, '#7AA2FF'), (ORANGE, '#FF7A45'), (PAPER, '#FFF6E5')]
    for i, (c, hx) in enumerate(hexes):
        x = L + i * 158
        s.append(f'<rect x="{x}" y="482" width="26" height="26" fill="{c}" stroke="{INK}" stroke-width="3"/>')
        s.append(t(x + 36, 501, 14, hx, MONO, 700, INK))
    # 按钮三态
    s.append(t(L, 566, 14, 'BUTTON STATES · 按钮三态', MONO, 700, INK, '0.06em'))
    states = [
        ('DEFAULT', '静止', 0, 6, 'translate(0,0)', 'shadow 6px 6px'),
        ('HOVER', '悬停', -2, 8, 'translate(-2px,-2px)', 'shadow 8px 8px'),
        ('PRESSED', '按下', 6, 0, 'translate(6px,6px)', 'shadow 0'),
    ]
    for i, (en, zh, d, sh, tr, shd) in enumerate(states):
        x = L + i * 320
        y = 596
        bx, by = x + d + (0 if en != 'PRESSED' else 0), y + d
        if en == 'HOVER':
            bx, by = x - 2, y - 2
        s.append(f'<rect x="{x}" y="{y}" width="250" height="72" fill="none" stroke="{INK}" stroke-width="1.5" stroke-dasharray="5 5" opacity="0.45"/>')
        s.append(box(bx, by, 250, 72, YELLOW if en != 'PRESSED' else PINK, 0, sh if en != 'PRESSED' else 0))
        s.append(t(bx + 125, by + 46, 22, f'{zh} {en}', SC, 900, INK, '0', 'middle'))
        s.append(t(x, y + 116, 14, f'transform: {tr}', MONO, 700, INK))
        s.append(t(x, y + 138, 14, shd, MONO, 400, INK, extra='opacity="0.7"'))
        if i < 2:
            s.append(t(x + 286, y + 46, 28, '→', HEAVY, 900, INK, '0', 'middle'))
    s.append(t(L, 784, 15, '按下 = 元素位移的距离 = 阴影的偏移量：阴影被“按”回元素底下。动效 80–120ms，用阶跃或 linear，别弹。', SC, 500, INK))
    # 规则
    s.append(f'<rect x="{L}" y="814" width="{W - 2 * L}" height="4" fill="{INK}"/>')
    rules = [
        ('黑框一律到底', '卡片、按钮、输入框、图片都描 3–4px 纯黑框。', '一处没框，就像忘了做完'),
        ('阴影是实块', '阴影 = 同形黑块偏移 4–8px，模糊 0，只朝右下。', '加一点模糊就退回了 Material'),
        ('平涂高饱和', '5 个颜色平涂，黑字放在任何颜色上都 ≥ 7:1。', '同一屏别超过 3 种底色'),
        ('结构露出来', '网格、分隔线、标签直接画出来，别藏。', '“露”≠ 乱：间距仍按 8px 网格'),
        ('一个歪的就够', '贴纸、徽章可以旋转 2–6°，制造手作感。', '全歪就成了 Memphis，失去秩序'),
    ]
    for i, (title, how, care) in enumerate(rules):
        y = 862 + i * 84
        s.append(box(L, y - 30, 52, 52, [YELLOW, PINK, LIME, BLUE, ORANGE][i], 0, 4, 3))
        s.append(t(L + 26, y + 5, 22, str(i + 1), HEAVY, 900, INK, '0', 'middle'))
        s.append(t(L + 76, y - 4, 22, title, SC, 900, INK))
        s.append(t(L + 260, y - 4, 17, how, SC, 500, INK))
        s.append(t(L + 260, y + 20, 14, '小心：' + care, SC, 400, INK, extra='opacity="0.6"'))
    s.append(box(L, 1280, W - 2 * L, 0.1, INK, 0, 0, 0))
    s.append(t(L, 1300, 13, 'A11Y：黑框让任何底色都满足非文本对比 3:1（WCAG 1.4.11）；焦点环直接加粗到 6px。', SC, 500, INK))
    s.append(FOOT)
    return ''.join(s)


# ───────────────────────────── App ─────────────────────────────

def callout(n, x, y, tx, title, body, col=YELLOW):
    o = [
        f'<path d="M{x} {y} H{tx - 20}" stroke="{INK}" stroke-width="3"/>',
        f'<rect x="{x - 6}" y="{y - 6}" width="12" height="12" fill="{INK}"/>',
        box(tx - 20, y - 20, 40, 40, col, 0, 4, 3),
        t(tx, y + 7, 18, str(n), HEAVY, 900, INK, '0', 'middle'),
        t(tx + 36, y - 2, 20, title, SC, 900, INK),
    ]
    for i, line in enumerate(body):
        o.append(t(tx + 36, y + 24 + i * 21, 14, line, SC, 400, INK, '0', 'start', 'opacity="0.75"'))
    return ''.join(o)


def app_ui():
    px, py, pw, ph = 80, 300, 420, 900
    cx = px + pw / 2
    defs = f'<clipPath id="screen"><rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="40"/></clipPath>'
    s = [head(defs), f'<rect width="{W}" height="{H}" fill="{BLUE}"/>']
    dots = ''.join(f'<circle cx="{x}" cy="{y}" r="1.6" fill="{INK}" opacity="0.2"/>' for x in range(30, W, 30) for y in range(30, H, 30))
    s.append(dots)
    s.append(box(80, 110, 640, 132, PAPER))
    s.append(t(104, 152, 14, 'NEO-BRUTALISM · APP', MONO, 700, INK, '0.1em'))
    s.append(t(104, 200, 40, '如果新粗野主义来做 App', SC, 900, INK))
    s.append(t(104, 230, 16, '一个记账页：所有层级都靠黑框和硬阴影，不靠模糊和灰。', SC, 400, INK))
    # 手机外壳：本身也是一个硬阴影块
    s.append(f'<rect x="{px - 14 + 12}" y="{py - 14 + 12}" width="{pw + 28}" height="{ph + 28}" rx="52" fill="{INK}"/>')
    s.append(f'<rect x="{px - 14}" y="{py - 14}" width="{pw + 28}" height="{ph + 28}" rx="52" fill="{INK}"/>')
    sc = [f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" fill="{PAPER}"/>']
    sc.append(t(px + 32, py + 40, 15, '9:41', MONO, 700, INK))
    sc.append(t(px + pw - 32, py + 40, 13, '▮▮▮ ▭', MONO, 700, INK, '0', 'end'))
    sc.append(t(px + 28, py + 100, 30, '十月', SC, 900, INK))
    sc.append(t(px + 98, py + 100, 16, '/ 2026', MONO, 700, INK))
    sc.append(box(px + pw - 28 - 46, py + 68, 46, 46, WHITE, 0, 4, 3))
    sc.append(f'<path d="M{px + pw - 51 - 9} {py + 91} h18 M{px + pw - 51} {py + 82} v18" stroke="{INK}" stroke-width="4"/>')
    # 余额卡
    sc.append(box(px + 24, py + 134, pw - 56, 170, YELLOW))
    sc.append(t(px + 46, py + 172, 14, 'BALANCE · 本月可用', MONO, 700, INK))
    sc.append(t(px + 44, py + 240, 58, '¥3,280', GROT, 700, INK, '-0.03em'))
    sc.append(f'<rect x="{px + 46}" y="{py + 262}" width="{pw - 100}" height="20" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>')
    sc.append(f'<rect x="{px + 46}" y="{py + 262}" width="{(pw - 100) * 0.62}" height="20" fill="{INK}"/>')
    sc.append(t(px + pw - 54, py + 255, 13, '62%', MONO, 700, INK, '0', 'end'))
    # 分类筹码
    chips = [('全部', INK, PAPER), ('餐饮', PINK, INK), ('交通', LIME, INK), ('订阅', WHITE, INK)]
    x = px + 24
    for lab, bg, fg in chips:
        w = 82
        sc.append(box(x, py + 334, w, 40, bg, 20, 0 if bg == INK else 3, 3))
        sc.append(t(x + w / 2, py + 360, 15, lab, SC, 700, fg, '0', 'middle'))
        x += w + 12
    # 列表
    icons = {
        'cup': 'M-11 -6 H7 V6 A6 6 0 0 1 1 12 H-5 A6 6 0 0 1 -11 6 Z M7 -2 H11 A4 4 0 0 1 11 6 H7',
        'train': 'M-10 -12 H10 V6 H-10 Z M-10 -2 H10 M-6 12 L-3 6 M6 12 L3 6',
        'note': 'M-4 8 A4 4 0 1 1 -4 7.9 M0 8 V-12 L10 -8',
        'bowl': 'M-13 -1 H13 A13 13 0 0 1 -13 -1 Z M-4 -4 L8 -15 M1 -4 L12 -13',
    }
    items = [('cup', '咖啡', '今天 08:12', '−32', PINK), ('train', '地铁', '今天 08:40', '−4', LIME), ('note', '音乐会员', '昨天', '−15', BLUE), ('bowl', '午饭', '昨天 12:30', '−46', ORANGE)]
    for i, (ic, name, when, amt, col) in enumerate(items):
        y = py + 400 + i * 86
        sc.append(box(px + 24, y, pw - 56, 70, WHITE, 0, 4, 3))
        sc.append(f'<rect x="{px + 38}" y="{y + 13}" width="44" height="44" fill="{col}" stroke="{INK}" stroke-width="3"/>')
        sc.append(f'<path d="{icons[ic]}" transform="translate({px + 60} {y + 36})" fill="none" stroke="{INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>')
        sc.append(t(px + 98, y + 32, 18, name, SC, 700, INK))
        sc.append(t(px + 98, y + 54, 13, when, MONO, 400, INK, extra='opacity="0.65"'))
        sc.append(t(px + pw - 52, y + 44, 22, amt, GROT, 700, INK, '-0.02em', 'end'))
    # 主按钮（按下态）
    by = py + ph - 150
    sc.append(f'<rect x="{px + 24}" y="{by}" width="{pw - 56}" height="64" fill="none" stroke="{INK}" stroke-width="2" stroke-dasharray="6 6" opacity="0.5"/>')
    sc.append(box(px + 24 + 6, by + 6, pw - 56, 64, PINK, 0, 0))
    sc.append(t(cx + 6, by + 47, 21, '+ 记一笔', SC, 900, INK, '0', 'middle'))
    # 标签栏
    sc.append(f'<rect x="{px}" y="{py + ph - 66}" width="{pw}" height="66" fill="{WHITE}" stroke="{INK}" stroke-width="4"/>')
    for i, lab in enumerate(('账本', '图表', '预算', '我')):
        xx = px + pw * (i + 0.5) / 4
        on = i == 0
        if on:
            sc.append(f'<rect x="{xx - 36}" y="{py + ph - 54}" width="72" height="34" fill="{YELLOW}" stroke="{INK}" stroke-width="3"/>')
        sc.append(t(xx, py + ph - 31, 15, lab, SC, 700 if on else 400, INK, '0', 'middle'))
    s.append(f'<g clip-path="url(#screen)">{"".join(sc)}</g>')
    s.append(cursor(px + pw - 120, by + 30, 0.9))
    # 标注
    TX = 590
    s.append(callout(1, px + pw - 32, py + 200, TX, '最重要的一块最亮', ['余额卡：黄底 + 8px 阴影；', '其余卡片白底 + 4px。层级靠偏移量。'], YELLOW))
    s.append(callout(2, px + pw - 40, py + 354, TX, '选中 = 反色，不是变灰', ['选中的筹码黑底浅字、阴影归零；', '未选中的保留 3px 阴影。'], PINK))
    s.append(callout(3, px + pw - 32, py + 520, TX, '图标放进色块', ['44px 方块 + 3px 黑框：', '颜色只用来区分分类。'], LIME))
    s.append(callout(4, px + pw - 30, by + 38, TX, '按下：位移 6px，阴影 0', ['主按钮正被按着：', '整块下沉到阴影的位置。'], ORANGE))
    s.append(callout(5, px + pw - 6, py + ph - 34, TX, '当前标签 = 实色块', ['不用下划线，不用小圆点：', '一个带框的黄块。'], WHITE))
    s.append(box(TX - 20, 1226, 430, 104, INK, 0, 0, 0))
    s.append(t(TX, 1250, 12, 'TOKENS', MONO, 700, YELLOW, '0.2em'))
    for i, tok in enumerate(['--border: 3px #000', '--shadow: 4px | 8px, blur 0', '--press: translate(6px, 6px)', '--radius: 0 | 20 (chips)']):
        s.append(t(TX, 1272 + i * 17, 13, tok, MONO, 400, PAPER))
    s.append(t(80, 1300, 14, 'Design Style 风格 009 · @guanmo_ai', MONO, 700, INK))
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
