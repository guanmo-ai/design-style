"""迷幻海报 · 第 0 帧（1920×1080）。python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png"""
import math
from warp import Font, blob, fill_shape, path_d

W, H = 1920, 1080
ORANGE, VIOLET, MAGENTA, LIME, CREAM, INK = '#FF5A1F', '#3B21C9', '#F0207F', '#C9F23B', '#FFF0CF', '#1E0B3A'

bagel = Font('BagelFatOne-Regular.ttf')
noto = Font('NotoSansSC-Black.otf')

CX, CY, R = 820, 520, 410
PH = 0.9  # 这一帧形状正鼓到最满
main = blob(CX, CY, R, [(3, 0.045, PH), (5, 0.025, PH * 1.7), (2, 0.03, 0.4)])

# 背后的色环：同一个形状一圈圈放大，越往外晃得越厉害、相位越往后——像往外流
rings = []
seq = [ORANGE, VIOLET, ORANGE, VIOLET, MAGENTA, VIOLET]
for k in range(34, 0, -1):
    r = R + 18 + k * 44
    amp = 0.045 + k * 0.0019
    shape = blob(CX, CY, r, [(3, amp, PH - k * 0.26), (5, 0.02 + k * 0.0006, PH * 1.7 - k * 0.5), (2, 0.03, 0.4 - k * 0.04)])
    rings.append(f'<path d="{path_d([shape])}" fill="{seq[k % len(seq)]}"/>')

ring_out = blob(CX, CY, R + 30, [(3, 0.045, PH - 0.1), (5, 0.025, PH * 1.7 - 0.2), (2, 0.03, 0.4)])
words = fill_shape(['PSYCHE', 'DELIC'], bagel, main, gap=0.07, pad=0.035, size=300, tracking=0.0)

# 刚分出去的一滴：里面灌“迷幻”
DX, DY, DR = 1545, 800, 185
drop = blob(DX, DY, DR, [(2, 0.06, 2.6), (3, 0.03, 1.0)])
drop_ring = blob(DX, DY, DR + 22, [(2, 0.06, 2.6), (3, 0.03, 1.0)])
zh = fill_shape(['迷幻'], noto, drop, pad=0.12, size=300, tracking=0.0)
# 两滴之间还连着一根被拉细的“颈”（深色膜），下一帧就断开
ux, uy = DX - CX, DY - CY
L = math.hypot(ux, uy); ux, uy = ux / L, uy / L
nx, ny = -uy, ux
A = (CX + ux * 400, CY + uy * 400)            # 主滴边上
B = (DX - ux * 175, DY - uy * 175)            # 小滴边上
M = ((A[0] + B[0]) / 2, (A[1] + B[1]) / 2)
def pt(p, w): return f'{p[0] + nx * w:.1f},{p[1] + ny * w:.1f}'
neck = (f'M{pt(A, 80)} C{pt((A[0] + ux * 60, A[1] + uy * 60), 30)} {pt((M[0] - ux * 20, M[1] - uy * 20), 14)} {pt(M, 13)} '
        f'C{pt((M[0] + ux * 20, M[1] + uy * 20), 14)} {pt((B[0] - ux * 50, B[1] - uy * 50), 30)} {pt(B, 62)} '
        f'L{pt(B, -62)} C{pt((B[0] - ux * 50, B[1] - uy * 50), -30)} {pt((M[0] + ux * 20, M[1] + uy * 20), -14)} {pt(M, -13)} '
        f'C{pt((M[0] - ux * 20, M[1] - uy * 20), -14)} {pt((A[0] + ux * 60, A[1] + uy * 60), -30)} {pt(A, -80)}Z')

html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Righteous;src:url(../../public/fonts/Righteous-Regular.ttf)}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Bold.otf);font-weight:700}}
html,body{{margin:0;background:{INK}}}
.tag{{position:absolute;font:28px Righteous;letter-spacing:.06em;color:{CREAM};background:{INK};border-radius:40px;padding:10px 26px 12px}}
.zh{{font-family:NotoSC;font-weight:700;letter-spacing:.1em}}
</style>
<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="display:block">
<rect width="{W}" height="{H}" fill="{VIOLET}"/>
{''.join(rings)}
<path d="{path_d([ring_out])}" fill="{INK}"/>
<path d="{neck}" fill="{INK}"/>
<path d="{path_d([main])}" fill="{LIME}"/>
<path d="{words}" fill="{MAGENTA}"/>
<path d="{path_d([drop_ring])}" fill="{INK}"/>
<path d="{path_d([drop])}" fill="{MAGENTA}"/>
<path d="{zh}" fill="{LIME}"/>
</svg>
<div class="tag" style="left:56px;top:48px">1966 — 1972 · SAN FRANCISCO</div>
<div class="tag zh" style="right:56px;top:48px">迷幻海报 · 字随形走</div>
'''
open('cover.html', 'w').write(html)
