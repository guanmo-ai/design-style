"""新艺术运动 · 第 0 帧（1920×1080）：几根鞭线从底下长上来，在光环前甩出 S 形、卷成涡、开出花；
右边那一根还在长——梢头带着金色亮点，前面虚线是它接下来要走的路。
python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png"""
import math
from vine import *

W, H = 1920, 1080
CX, CY, CR = 1290, 500, 380
s = []
# 光环：几圈同心环 + 一圈马赛克小圆点（穆夏海报的背景圆）
s.append(f'<circle cx="{CX}" cy="{CY}" r="{CR + 34}" fill="none" stroke="{INK}" stroke-width="3"/>')
s.append(f'<circle cx="{CX}" cy="{CY}" r="{CR}" fill="#E7D3A6" stroke="{INK}" stroke-width="5"/>')
for i in range(72):
    a = i / 72 * math.tau
    s.append(f'<circle cx="{CX + math.cos(a) * (CR + 17):.1f}" cy="{CY + math.sin(a) * (CR + 17):.1f}" r="{7 if i % 2 else 4.5}" fill="{GOLD if i % 2 else PLUM}" stroke="{INK}" stroke-width="1.5"/>')
for r, c in [(CR - 40, '#DDC28C'), (CR - 120, '#E7D3A6'), (CR - 200, '#DDC28C')]:
    s.append(f'<circle cx="{CX}" cy="{CY}" r="{r}" fill="{c}" stroke="{INK}" stroke-width="1.5" opacity=".9"/>')
# 光环里的放射细线
for i in range(48):
    a = i / 48 * math.tau
    s.append(f'<line x1="{CX + math.cos(a) * 60:.0f}" y1="{CY + math.sin(a) * 60:.0f}" x2="{CX + math.cos(a) * (CR - 42):.0f}" y2="{CY + math.sin(a) * (CR - 42):.0f}" stroke="{GOLD}" stroke-width="1.4" opacity=".55"/>')

# 鞭线：(起点 x, y, 起始方向, 长度, a, b, p, 方向, 根粗, 颜色, 长到多少)
stems = [
    (980, 1080, -78, 980, -.8, 28, 6, 1, 28, OLIVE, 1),
    (1600, 1080, -102, 980, -.8, 28, 6, -1, 28, OLIVE, 1),
    (1140, 1080, -120, 640, -.5, 28, 6, -1, 17, SAGE, 1),
    (1440, 1080, -62, 640, -.5, 28, 6, 1, 17, SAGE, 1),
    (1880, 1080, -115, 1200, -1.2, 28, 6, 1, 22, TEAL, .66),   # 还在长的那根
]
leaves, flowers, grow_tip = [], [], None
for x, y, ang, L, a, b, p, sg, w0, col, g in stems:
    pts = curve(x, y, ang, L, whip(L, a, b, p, sg))
    s.append(f'<path d="{ribbon(pts, w0, 2.4, g)}" fill="{col}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>')
    # 叶子：在茎的前半段，左右交替
    for k, u in enumerate((.12, .22, .34)):
        if u > g: continue
        px, py, th = pts[int(u * (len(pts) - 1))]
        d = 1 if k % 2 else -1
        leaves.append(leaf(px, py, math.degrees(th) + d * 55, 120 - k * 18, SAGE if col != SAGE else OLIVE))
    if g >= 1:
        px, py, th = pts[int(.62 * (len(pts) - 1))]
        flowers.append((px, py, math.degrees(th)))
    else:
        grow_tip = pts, g
s[0:0] = []
# 光环中心：一根直茎托起一朵正面的大花，光环就是它的光晕
cpts = curve(CX, 1080, -90, 1080 - CY, lambda u: 0)
s.append(f'<path d="{ribbon(cpts, 22, 12)}" fill="{OLIVE}" stroke="{INK}" stroke-width="3"/>')
s += leaves
for ring, (n, R, rw, col) in enumerate([(12, 190, .30, ROSE), (12, 140, .34, PLUM), (8, 90, .42, ROSE)]):
    for i in range(n):
        a = (i + ring * .5) / n * math.tau
        ex, ey = CX + math.cos(a) * R, CY + math.sin(a) * R
        nx, ny = -math.sin(a) * R * rw, math.cos(a) * R * rw
        mx, my = CX + math.cos(a) * R * .55, CY + math.sin(a) * R * .55
        s.append(f'<path d="M{CX},{CY} Q{mx + nx:.1f},{my + ny:.1f} {ex:.1f},{ey:.1f} Q{mx - nx:.1f},{my - ny:.1f} {CX},{CY}Z" fill="{col}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>')
s.append(f'<circle cx="{CX}" cy="{CY}" r="44" fill="{GOLD}" stroke="{INK}" stroke-width="3"/>')
for i in range(14):
    a = i / 14 * math.tau
    s.append(f'<circle cx="{CX + math.cos(a) * 30:.1f}" cy="{CY + math.sin(a) * 30:.1f}" r="4.5" fill="{INK}"/>')
for i, (px, py, th) in enumerate(flowers):
    s.append(lily(px, py, th - 90 * (1 if i % 2 else -1) * .0 + (-1 if i % 2 else 1) * 70, 70 if i < 2 else 52, CREAM if i % 2 == 0 else ROSE))
# 正在长的梢：后面的路是淡虚线，梢头一个金点 + 光晕
pts, g = grow_tip
rest = pts[int(len(pts) * g) - 1:]
s.append('<path d="M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y, _ in rest) + f'" fill="none" stroke="{TEAL}" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round" opacity=".75"/>')
tx, ty, _ = tip(pts, g)
s.append(f'<circle cx="{tx:.1f}" cy="{ty:.1f}" r="38" fill="url(#glow)"/><circle cx="{tx:.1f}" cy="{ty:.1f}" r="9" fill="{GOLD}" stroke="{INK}" stroke-width="2.5"/>')

# 左边标题框：马蹄形拱顶的竖板（吉马德地铁口那种拱）
fx, fy, fw, fh = 110, 150, 600, 800
arch = (f'M{fx},{fy + fh} L{fx},{fy + 200} C{fx},{fy + 40} {fx + 140},{fy} {fx + fw / 2},{fy} '
        f'C{fx + fw - 140},{fy} {fx + fw},{fy + 40} {fx + fw},{fy + 200} L{fx + fw},{fy + fh}Z')
panel = f'<path d="{arch}" fill="{PAPER}" stroke="{INK}" stroke-width="5"/>'
inner = f'<path d="{arch}" transform="translate({fx + fw / 2},{fy + fh}) scale(.94 .965) translate({-(fx + fw / 2)},{-(fy + fh)}) translate(0,-14)" fill="none" stroke="{GOLD}" stroke-width="3"/>'
# 拱顶里的小涡卷（左右对称）
orn = []
for sg in (1, -1):
    p2 = curve(fx + fw / 2 + sg * 20, fy + 160, 90 - sg * 90, 300, whip(300, .2, 26, 5, -sg))
    orn.append(f'<path d="{ribbon(p2, 11, 1.5)}" fill="{OLIVE}" stroke="{INK}" stroke-width="2"/>')
orn.append(f'<circle cx="{fx + fw / 2}" cy="{fy + 160}" r="16" fill="{GOLD}" stroke="{INK}" stroke-width="3"/>')

svg = f'''<svg width="{W}" height="{H}" style="position:absolute;left:0;top:0">
<defs><radialGradient id="glow"><stop offset="0" stop-color="#FFE7A3" stop-opacity=".95"/><stop offset="1" stop-color="#FFE7A3" stop-opacity="0"/></radialGradient>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .28  0 0 0 0 .15  0 0 0 .09 0"/><feComposite in2="SourceGraphic" operator="in"/></filter></defs>
<rect width="{W}" height="{H}" fill="{CREAM}"/>
<rect x="34" y="34" width="{W - 68}" height="{H - 68}" fill="none" stroke="{INK}" stroke-width="4"/>
<rect x="48" y="48" width="{W - 96}" height="{H - 96}" fill="none" stroke="{GOLD}" stroke-width="2"/>
{''.join(s)}
{panel}{inner}{''.join(orn)}
<rect width="{W}" height="{H}" fill="#000" filter="url(#grain)"/>
</svg>'''
html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:NotoSerif;src:url(../../public/fonts/NotoSerifSC.ttf);font-weight:200 900}}
@font-face{{font-family:Cinzel;src:url(../../public/fonts/CinzelDecorative-Bold.ttf)}}
@font-face{{font-family:Corm;src:url(../../public/fonts/Cormorant.ttf);font-weight:300 700}}
html,body{{margin:0;width:{W}px;height:{H}px;overflow:hidden}}
.t{{position:absolute;color:{INK};text-align:center;width:{fw}px;left:{fx}px}}
</style>{svg}
<div class="t" style="top:{fy + 236}px;font:700 34px Cinzel;letter-spacing:.12em;color:{PLUM}">Art Nouveau</div>
<div class="t" style="top:{fy + 300}px;font:900 104px/1.12 NotoSerif;letter-spacing:.06em">新艺术<br>运动</div>
<div class="t" style="top:{fy + 560}px;font:600 34px Corm;letter-spacing:.3em">1890 — 1910</div>
<div class="t" style="top:{fy + 616}px;font:600 27px/1.65 NotoSerif">直线都换成<br>会长的藤蔓</div>
<div class="t" style="top:{fy + 730}px;font:600 19px Corm;letter-spacing:.22em;color:#6b5e45">MUCHA · GUIMARD · HORTA · TIFFANY</div>
'''
open('cover.html', 'w').write(html)
