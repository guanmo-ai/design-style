"""
包豪斯图案生成器 —— 输出 pattern.svg（1080×1350）

规则（全部来自包豪斯的基本语法）：
  · 7 种基本形：圆、环、半圆、四分之一圆、三角、方、条
  · 5 种颜色：纸白 / 印刷黑 / 红 / 黄 / 蓝，每块只用「底色 + 形色」两色，偶尔加一个第三色小圆点
  · 相邻两块的底色不能相同；两块 2×2 的大格制造主次
  · 固定随机种子 → 同样的代码永远生成同一张图；改 SEED 就是一张新壁纸

用法：python3 pattern.py            # 默认 seed 1919
     python3 pattern.py 1933       # 换一个种子
"""
import random
import sys

SEED = int(sys.argv[1]) if len(sys.argv) > 1 else 1919
COLS, ROWS, S = 6, 7, 180          # 6 × 7 格，每格 180px → 1080 × 1260
W, H = COLS * S, 1350               # 底部 90px 留给说明条

PAPER, INK, RED, YELLOW, BLUE = '#F0E9DA', '#161514', '#DB3A26', '#F2B419', '#1F4FA3'
BG_WEIGHTS = [(PAPER, 34), (INK, 18), (BLUE, 16), (RED, 16), (YELLOW, 16)]
BIG = [(1, 1), (3, 4)]              # 两块 2×2 大格的左上角（列, 行）

rng = random.Random(SEED)


def pick(weights, exclude=(), avoid=()):
    """按权重抽一个颜色：exclude 是硬约束，avoid 是软约束（实在没得选时放宽）。"""
    pool = [(c, w) for c, w in weights if c not in exclude and c not in avoid]
    if not pool:
        pool = [(c, w) for c, w in weights if c not in exclude]
    total = sum(w for _, w in pool)
    r = rng.uniform(0, total)
    for c, w in pool:
        r -= w
        if r <= 0:
            return c
    return pool[-1][0]


def motif(kind, x, y, s, fg, bg, rot):
    """返回一块格子里的形状（不含底色）。rot 为 0/90/180/270，绕格子中心旋转。"""
    cx, cy, h = x + s / 2, y + s / 2, s / 2
    t = f' transform="rotate({rot} {cx:g} {cy:g})"' if rot else ''
    if kind == 'circle':
        return f'<circle cx="{cx:g}" cy="{cy:g}" r="{s * 0.36:g}" fill="{fg}"/>'
    if kind == 'ring':
        return (f'<circle cx="{cx:g}" cy="{cy:g}" r="{s * 0.38:g}" fill="{fg}"/>'
                f'<circle cx="{cx:g}" cy="{cy:g}" r="{s * 0.17:g}" fill="{bg}"/>')
    if kind == 'half':      # 半圆坐在格子底边上
        return f'<path d="M{x:g} {y + s:g} A{h:g} {h:g} 0 0 1 {x + s:g} {y + s:g} Z" fill="{fg}"{t}/>'
    if kind == 'quarter':   # 以左下角为圆心的四分之一圆
        return f'<path d="M{x:g} {y + s:g} V{y:g} A{s:g} {s:g} 0 0 1 {x + s:g} {y + s:g} Z" fill="{fg}"{t}/>'
    if kind == 'tri':       # 对角线切一半
        return f'<polygon points="{x:g},{y:g} {x + s:g},{y + s:g} {x:g},{y + s:g}" fill="{fg}"{t}/>'
    if kind == 'square':
        m = s * 0.22
        return f'<rect x="{x + m:g}" y="{y + m:g}" width="{s - 2 * m:g}" height="{s - 2 * m:g}" fill="{fg}"{t}/>'
    if kind == 'bars':      # 三根粗条
        w = s / 7
        return ''.join(f'<rect x="{x + w * (1 + 2 * i):g}" y="{y:g}" width="{w:g}" height="{s:g}" fill="{fg}"{t}/>'
                       for i in range(3))
    raise ValueError(kind)


KINDS = ['quarter'] * 4 + ['half'] * 3 + ['circle'] * 2 + ['ring'] * 2 + ['tri'] * 3 + ['square'] * 2 + ['bars'] * 2


def build():
    covered = {(c + dx, r + dy) for c, r in BIG for dx in (0, 1) for dy in (0, 1)}
    bgs, fgs = {}, {}
    out = []
    # 先排大格，再排小格；所有底色都避开左邻和上邻
    cells = [(c, r, 2) for c, r in BIG] + [(c, r, 1) for r in range(ROWS) for c in range(COLS) if (c, r) not in covered]
    for c, r, span in cells:
        ring = [(c - 1, r + k) for k in range(span)] + [(c + k, r - 1) for k in range(span)] \
            + [(c + span, r + k) for k in range(span)] + [(c + k, r + span) for k in range(span)]
        near_bg = {bgs.get(p) for p in ring}
        near_fg = {fgs.get(p) for p in ring}
        # 底色：不能和邻居底色相同；尽量也别和邻居的形色相同（否则形状会「流」进隔壁）
        bg = pick(BG_WEIGHTS, exclude=near_bg, avoid=near_fg)
        # 形色：不能和自己底色相同；尽量避开邻居的两种颜色
        fg = pick(BG_WEIGHTS, exclude={bg}, avoid=near_bg | near_fg)
        for dx in range(span):
            for dy in range(span):
                bgs[(c + dx, r + dy)] = bg
        for dx in range(span):
            for dy in range(span):
                fgs[(c + dx, r + dy)] = fg
        kind = 'quarter' if span == 2 and c < 3 else ('ring' if span == 2 else rng.choice(KINDS))
        rot = rng.choice([0, 90, 180, 270])
        x, y, s = c * S, r * S, S * span
        out.append(f'<rect x="{x}" y="{y}" width="{s}" height="{s}" fill="{bg}"/>')
        out.append(motif(kind, x, y, s, fg, bg, rot))
        if span == 1 and kind in ('circle', 'ring', 'square') and rng.random() < 0.35:   # 偶尔一个第三色小点，只放在角落空白处
            third = pick(BG_WEIGHTS, exclude={bg, fg})
            out.append(f'<circle cx="{x + S * 0.84:g}" cy="{y + S * 0.16:g}" r="{S * 0.06:g}" fill="{third}"/>')
    return '\n  '.join(out)


svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <!-- Design Style · 001 · 包豪斯 —— 图案 / 由 pattern.py 生成（seed {SEED}），请勿手改 -->
  <defs>
    <style>
      .cjk {{ font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif; }}
      .mono {{ font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, monospace; }}
    </style>
  </defs>
  <rect width="{W}" height="{H}" fill="{PAPER}"/>
  {build()}
  <rect y="{ROWS * S}" width="{W}" height="{H - ROWS * S}" fill="{INK}"/>
  <text x="48" y="{ROWS * S + 54}" fill="{PAPER}"><tspan class="mono" font-size="22" font-weight="700">bauhaus pattern</tspan><tspan class="cjk" dx="18" font-size="20" font-weight="500" fill-opacity="0.7">7 种基本形 × 5 种颜色</tspan></text>
  <text x="{W - 48}" y="{ROWS * S + 54}" text-anchor="end" fill="{PAPER}"><tspan class="mono" font-size="18" font-weight="500" fill-opacity="0.7">python3 pattern.py </tspan><tspan class="mono" font-size="18" font-weight="700" fill="{YELLOW}">{SEED}</tspan></text>
</svg>
'''

if __name__ == '__main__':
    import os
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pattern.svg')
    open(path, 'w', encoding='utf-8').write(svg)
    print('wrote', path)
