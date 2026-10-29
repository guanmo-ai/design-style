"""膨胀风 · 第 0 帧（1920×1080）：PUFFY 几个字母正被打气筒“噗”地吹鼓，最后一个还瘪着、正在鼓起来。
python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png"""
from puff import puff_filter

W, H = 1920, 1080
PINK, LILAC, MINT, BUTTER, SKY, CORAL = '#FF6FAE', '#A98BFF', '#4FDDB8', '#FFD45C', '#6FBEFF', '#FF8A6B'

defs = (puff_filter('p', 18, 12) + puff_filter('pS', 9, 7) + puff_filter('pFlat', 4, 3, shine=.5)
        + puff_filter('pZh', 7, 7))
letters = [('P', PINK, 0), ('U', LILAC, -4), ('F', BUTTER, 3), ('F', MINT, -3), ('Y', SKY, 0)]
xs = [180, 520, 850, 1130, 1420]
lt = []
for (c, col, rot), x in zip(letters, xs):
    flat = c == 'Y'
    lt.append(f'<text x="{x}" y="{640 if not flat else 650}" font-family="Bagel" font-size="{460 if not flat else 360}" fill="{col}" '
              f'filter="url(#{"pFlat" if flat else "p"})" transform="rotate({rot} {x + 160} 470){" scale(1,0.93)" if flat else ""}">{c}</text>')
# 打气筒：一根软管接到 Y 上
pump = f'''
<path d="M1600,600 C1760,640 1780,760 1700,830 C1640,880 1660,940 1730,960" fill="none" stroke="#6E5BD6" stroke-width="30" stroke-linecap="round" filter="url(#pS)"/>
<g filter="url(#pS)"><rect x="1680" y="930" width="190" height="80" rx="40" fill="{CORAL}"/>
<rect x="1750" y="770" width="50" height="180" rx="25" fill="{BUTTER}"/>
<rect x="1700" y="740" width="150" height="50" rx="25" fill="{CORAL}"/></g>'''
deco = f'''
<path d="M300,190 C300,140 370,130 380,180 C390,130 460,140 460,190 C460,250 380,290 380,290 C380,290 300,250 300,190Z" fill="{CORAL}" filter="url(#pS)" transform="translate(330,-80) rotate(-14 380 210)"/>
<path d="M1560,140 L1592,212 L1670,220 L1610,270 L1630,348 L1560,306 L1490,348 L1510,270 L1450,220 L1528,212Z" fill="{BUTTER}" filter="url(#pS)" stroke="{BUTTER}" stroke-width="26" stroke-linejoin="round"/>
<circle cx="1530" cy="890" r="60" fill="none" stroke="{MINT}" stroke-width="40" filter="url(#pS)"/>
<ellipse cx="1200" cy="180" rx="90" ry="54" fill="{SKY}" filter="url(#pS)"/>
<circle cx="1290" cy="150" r="56" fill="{SKY}" filter="url(#pS)"/><circle cx="1110" cy="168" r="48" fill="{SKY}" filter="url(#pS)"/>
'''
zh = f'<text x="190" y="930" font-family="NotoSC" font-weight="900" font-size="170" fill="{LILAC}" stroke="{LILAC}" stroke-width="6" stroke-linejoin="round" filter="url(#pZh)" letter-spacing="14">膨胀风</text>'
# 正在进气：软管口几道气流
air = ''.join(f'<path d="M{1600 + dx},{560 + dy} q-30,-12 -60,0" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".9"/>' for dx, dy in [(-20, -10), (-10, 20), (-40, 46)])
svg = f'''<svg width="{W}" height="{H}" style="position:absolute;left:0;top:0">
<defs>{defs}
<radialGradient id="bg" cx="50%" cy="35%" r="80%"><stop offset="0" stop-color="#FFF6FB"/><stop offset=".6" stop-color="#F3E8FF"/><stop offset="1" stop-color="#DCCBFF"/></radialGradient></defs>
<rect width="{W}" height="{H}" fill="url(#bg)"/>
{deco}{''.join(lt)}{pump}{air}{zh}
</svg>'''
html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Bagel;src:url(../../public/fonts/BagelFatOne-Regular.ttf)}}
@font-face{{font-family:Inter;src:url(../../public/fonts/Inter.ttf);font-weight:100 900}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Black.otf);font-weight:900}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Bold.otf);font-weight:700}}
html,body{{margin:0;width:{W}px;height:{H}px;overflow:hidden}}
.a{{position:absolute;font:800 22px Inter;letter-spacing:.24em;color:#6E5BD6}}
</style>{svg}
<div class="a" style="left:60px;top:40px">INFLATED 3D · 2021 —</div>
<div class="a" style="left:820px;top:860px;font:700 36px NotoSC;letter-spacing:.12em;color:#5a4bb5">一切都是充气的<br><span style="font:800 20px Inter;letter-spacing:.24em;color:#8f7fe0">PUMP · SQUISH · BOUNCE</span></div>
'''
open('cover.html', 'w').write(html)
