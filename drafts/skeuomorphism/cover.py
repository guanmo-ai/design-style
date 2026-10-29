"""拟物 · 第 0 帧（1920×1080）：便签纸的右下角正被掀起、卷过去。
python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png"""
import math

from common import FONTS, leather, stitch

W, H = 1920, 1080
PAPER, PAPER_BACK, RULE, MARGIN, INKC = '#FBEFA6', '#F4E9B8', '#9EB7D6', '#E28A86', '#3B2A1E'
TOP = 196  # 皮革封皮下沿


def clip(poly, P, n, keep_pos):
    """多边形按直线（过 P、法向 n）裁切，保留 n·(x−P) 同号的一侧。"""
    def side(p):
        v = (p[0] - P[0]) * n[0] + (p[1] - P[1]) * n[1]
        return v if keep_pos else -v
    out = []
    for i in range(len(poly)):
        a, b = poly[i], poly[(i + 1) % len(poly)]
        sa, sb = side(a), side(b)
        if sa >= 0:
            out.append(a)
        if (sa >= 0) != (sb >= 0):
            t = sa / (sa - sb)
            out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    return out


def pts(poly):
    return ' '.join(f'{x:.1f},{y:.1f}' for x, y in poly)


# 折线：从纸的下边 A 到右边 B
A, B = (1240.0, H + 0.0), (W + 0.0, 500.0)
d = (B[0] - A[0], B[1] - A[1])
L = math.hypot(*d)
d = (d[0] / L, d[1] / L)
n = (-d[1], d[0])               # 指向右下角的一侧是正
if (W - A[0]) * n[0] + (H - A[1]) * n[1] < 0:
    n = (-n[0], -n[1])
page = [(0, TOP), (W, TOP), (W, H), (0, H)]
page_kept = clip(page, A, n, keep_pos=False)
corner = clip(page, A, n, keep_pos=True)
# 反射矩阵：沿折线翻过去
a_, b_ = 2 * d[0] ** 2 - 1, 2 * d[0] * d[1]
c_, d2 = 2 * d[0] * d[1], 2 * d[1] ** 2 - 1
e_ = A[0] - a_ * A[0] - c_ * A[1]
f_ = A[1] - b_ * A[0] - d2 * A[1]
M = f'matrix({a_:.5f},{b_:.5f},{c_:.5f},{d2:.5f},{e_:.2f},{f_:.2f})'
flap = [(a_ * x + c_ * y + e_, b_ * x + d2 * y + f_) for x, y in corner]


def rules(color=RULE, op=1):
    out = [f'<line x1="0" x2="{W}" y1="{y}" y2="{y}" stroke="{color}" stroke-width="2" opacity="{op}"/>' for y in range(TOP + 104, H + 60, 62)]
    out.append(f'<line x1="232" x2="232" y1="{TOP}" y2="{H}" stroke="{MARGIN}" stroke-width="2.4" opacity="{op}"/>')
    out.append(f'<line x1="240" x2="240" y1="{TOP}" y2="{H}" stroke="{MARGIN}" stroke-width="2.4" opacity="{op}"/>')
    return ''.join(out)


# 卷边的明暗：沿法向的渐变，靠折线那一侧最暗→一道高光→往尖上慢慢变暗
gx1, gy1 = A[0], A[1]
gx2, gy2 = A[0] - n[0] * 460, A[1] - n[1] * 460

svg = f'''<svg width="{W}" height="{H}" style="position:absolute;left:0;top:0">
<defs>
  <clipPath id="kept"><polygon points="{pts(page_kept)}"/></clipPath>
  <clipPath id="flapc"><polygon points="{pts(flap)}"/></clipPath>
  <linearGradient id="curl" gradientUnits="userSpaceOnUse" x1="{gx1}" y1="{gy1}" x2="{gx2}" y2="{gy2}">
    <stop offset="0" stop-color="#7d6a3a" stop-opacity=".55"/><stop offset=".05" stop-color="#fff" stop-opacity=".0"/>
    <stop offset=".13" stop-color="#fff" stop-opacity=".85"/><stop offset=".26" stop-color="#fff" stop-opacity=".15"/>
    <stop offset=".75" stop-color="#5c4a20" stop-opacity=".08"/><stop offset="1" stop-color="#5c4a20" stop-opacity=".28"/>
  </linearGradient>
  <linearGradient id="bend" gradientUnits="userSpaceOnUse" x1="{A[0]}" y1="{A[1]}" x2="{A[0] - n[0] * 170}" y2="{A[1] - n[1] * 170}">
    <stop offset="0" stop-color="#6b5520" stop-opacity=".38"/><stop offset="1" stop-color="#6b5520" stop-opacity="0"/>
  </linearGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="22"/></filter>
  <filter id="paperN" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="5"/>
    <feColorMatrix values="0 0 0 0 .4  0 0 0 0 .33  0 0 0 0 .1  0 0 0 .09 0"/>
  </filter>
</defs>
<!-- 下一页 -->
<rect x="0" y="{TOP}" width="{W}" height="{H - TOP}" fill="#F3E393"/>
<g opacity=".8">{rules()}</g>
<rect x="0" y="{TOP}" width="{W}" height="{H - TOP}" filter="url(#paperN)"/>
<text x="1470" y="{TOP + 104 + 62 * 12 - 16}" font-family="Caveat" font-weight="700" font-size="52" fill="{INKC}" opacity=".8">next: leather, felt…</text>
<!-- 这一页（裁掉被掀起的角） -->
<g clip-path="url(#kept)">
  <rect x="0" y="{TOP}" width="{W}" height="{H - TOP}" fill="{PAPER}"/>
  {rules()}
  <rect x="0" y="{TOP}" width="{W}" height="{H - TOP}" filter="url(#paperN)"/>
  <text x="300" y="{TOP + 104 + 62 - 16}" font-family="Inter" font-weight="500" font-size="26" fill="#9a8a5a">2007 年 1 月 9 日 · 9:41</text>
  <text x="290" y="{TOP + 104 + 62 * 4 - 18}" font-family="Caveat" font-weight="700" font-size="200" fill="{INKC}">Skeuomorphism</text>
  <text x="300" y="{TOP + 104 + 62 * 6 - 14}" font-family="NotoSCB" font-weight="900" font-size="104" fill="{INKC}">拟物</text>
  <text x="560" y="{TOP + 104 + 62 * 6 - 18}" font-family="NotoSC" font-weight="700" font-size="44" fill="{INKC}">一切控件，都假装是一样东西</text>
  <text x="300" y="{TOP + 104 + 62 * 8 - 16}" font-family="NotoSC" font-weight="700" font-size="40" fill="#6a5636">✓ 光从上面来　✓ 材料有纹理　✓ 动作有卡位</text>
  <polygon points="{pts(page_kept)}" fill="url(#bend)"/>
</g>
<!-- 掀起的角投下的影子 -->
<polygon points="{pts(flap)}" fill="#3a2a0a" opacity=".42" filter="url(#soft)" transform="translate({-n[0] * 26:.1f},{-n[1] * 26 + 20:.1f})"/>
<!-- 掀起的角：纸背，透出反着的格线 -->
<g clip-path="url(#flapc)">
  <polygon points="{pts(flap)}" fill="{PAPER_BACK}"/>
  <g transform="{M}" opacity=".22">{rules()}</g>
  <polygon points="{pts(flap)}" fill="url(#curl)"/>
</g>
<polygon points="{pts(flap)}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.5"/>
</svg>'''

# 封皮下沿撕剩的纸边
torn = []
x = 0
import random
rng = random.Random(7)
pts_t = [(0, TOP - 6)]
while x < W:
    x += rng.uniform(8, 26)
    pts_t.append((x, TOP - 6 + rng.uniform(4, 22)))
pts_t += [(W, TOP - 6)]
torn_svg = f'<svg width="{W}" height="{TOP + 30}" style="position:absolute;left:0;top:0"><polygon points="{pts(pts_t)}" fill="#FFF8D2" stroke="#00000020"/></svg>'

html = f'''<!doctype html><meta charset="utf-8"><style>{FONTS}
html,body{{margin:0;width:{W}px;height:{H}px;overflow:hidden;background:#3a2214}}
.lth{{position:absolute;left:0;top:0;width:{W}px;height:{TOP}px;overflow:hidden;box-shadow:0 8px 14px #0007;z-index:3}}
.lab{{position:absolute;top:70px;font:700 28px Heros;letter-spacing:.24em;color:#ead7b2;text-shadow:0 -1px 0 #000a,0 1px 0 #ffffff30;z-index:4}}
.hl{{position:absolute;left:0;right:0;top:0;height:{TOP}px;background:linear-gradient(180deg,#ffffff20,#0000 40%,#00000040);z-index:3}}
</style>
{svg}
{torn_svg}
<div class="lth">{leather(W, TOP + 40)}{stitch(28, 26, W - 56, TOP - 60, 10)}</div><div class="hl"></div>
<div class="lab" style="left:96px">2007 — 2013</div>
<div class="lab" style="right:96px">NOTES · IPHONE OS 1</div>
'''
open('cover.html', 'w').write(html)
