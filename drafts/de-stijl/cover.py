"""风格派 · 第 0 帧（1920×1080）：一根黑线正像刀一样横穿中间那块大白格，右上那格的黄色正往下灌。
python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png"""
from blocks import BLUE, INK, PAPER, RED, YEL, rects_svg, word

W, H, T = 1920, 1080, 22   # T = 线宽
r = []
# 色块（先铺，线压在上面）
r += [(0, 0, 520, 250, RED), (1660, 470, 260, 250, BLUE), (1380, 0, 540, 318, YEL), (520, 430, 160, 290, YEL)]
# 线：按中线给，两头各多出半个线宽，交点才严丝合缝
segs = [((0, 720), (W, 720)), ((520, 0), (520, 720)), ((1380, 0), (1380, 720)), ((0, 250), (520, 250)),
        ((1380, 470), (W, 470)), ((1660, 470), (1660, 720)), ((520, 430), (680, 430)), ((680, 430), (680, 720))]
for (x1, y1), (x2, y2) in segs:
    if y1 == y2:
        r.append((min(x1, x2) - T / 2, y1 - T / 2, abs(x2 - x1) + T, T, INK))
    else:
        r.append((x1 - T / 2, min(y1, y2) - T / 2, T, abs(y2 - y1) + T, INK))
# 正在切的那一刀：从左往右冲，刀头已经过了一半
cut_y, cut_x0, cut_x1 = 300, 531, 1190
r.append((cut_x0, cut_y - T / 2, cut_x1 - cut_x0, T, INK))
# 刊头 DE STIJL：一根红、一根蓝
mast, wid = word('DE STIJL', 40, 0, 0, colors={(4, 0): RED, (6, 0): BLUE})
mx = (W - wid) / 2
mast = [(x + mx, y + 772, w, h, c) for x, y, w, h, c in mast]

svg = f'''<svg width="{W}" height="{H}" style="position:absolute;left:0;top:0">
<rect width="{W}" height="{H}" fill="{PAPER}"/>
{rects_svg(r)}
<line x1="{1380 + T / 2}" x2="{W}" y1="318" y2="318" stroke="{YEL}" stroke-width="2"/>
{rects_svg(mast)}
</svg>'''
html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Jost;src:url(../../public/fonts/Jost.ttf);font-weight:100 900}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Black.otf);font-weight:900}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Bold.otf);font-weight:700}}
html,body{{margin:0;width:{W}px;height:{H}px;overflow:hidden}}
.t{{position:absolute;color:{INK}}}
</style>{svg}
<div class="t" style="left:56px;top:300px;font:900 120px/1 NotoSC;letter-spacing:.04em">风格派</div>
<div class="t" style="left:60px;top:450px;font:600 34px Jost;letter-spacing:.14em">1917 — 1931</div>
<div class="t" style="left:60px;top:510px;font:700 28px/1.6 NotoSC">只用横线、竖线<br>和红、黄、蓝</div>
<div class="t" style="left:60px;top:652px;font:600 19px Jost;letter-spacing:.16em;color:#666">MONDRIAN · RIETVELD · DOESBURG</div>
'''
open('cover.html', 'w').write(html)
