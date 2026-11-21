"""朋克复印机 · 第 0 帧（1920×1080）：复印机的玻璃板，从上往下看。
一张拼贴原稿扣在玻璃上，扫描光条正从左往右走：光条右边还是原稿（彩色剪报、胶带、别针、磁带、马克笔），
左边已经“复印”过了——同一组原稿过一遍滤镜，只剩荧光粉纸上的黑碳粉，玻璃没盖住的地方印成一片黑。
动起来就是光条往右扫；扫完一遍，阈值往上调一点，再扫一遍（第 2 代、第 3 代……越印越糊）。
python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png"""
from punk import *

W, H = 1920, 1080
BAR = 1150                       # 扫描光条的位置：左边已复印，右边是原稿

o = []
# —— 底：复印机的玻璃（暗）+ 一张米白的底稿纸 ——
o.append(f'<rect width="{W}" height="{H}" fill="{GLASS}"/>')
o.append(scrap(980, 548, 1790, 1000, -1.2, WHITE, seed=1))
# 报纸栏、复写纸做底层
col = dada.column(24, 40, 420, 22, size=17, seed=4, col='#4f4a40')
o.append(scrap(1500, 300, 480, 380, 3, NEWS, col, seed=2, tear=5, clip=True))
o.append(scrap(980, 330, 280, 250, 6, NEWS, dada.column(20, 36, 240, 9, size=16, seed=8, col='#4f4a40'), seed=3, tear=4, clip=True))
# 一条黑胶带横穿
o.append(f'<rect x="-900" y="-52" width="1800" height="104" transform="translate(1020,610) rotate(-8)" fill="{INK}" filter="url(#psh)"/>')

# —— 右：现场照片（网点）、磁带 ——
o.append(photo(1530, 420, 470, 560, 5, mic_lum, seed=11, pitch=10))
o.append(tape(1350, 170, 190, -38, seed=1))
o.append(tape(1730, 690, 200, -30, seed=2))
o.append(cassette(1530, 895, .84, -9, 'DEMO 01', '现场 · 地下室'))

# —— 标题：朋 / 克 两张大剪字；XEROX 是模板字，跨过光条 ——
o.append(letter('朋', 300, 330, 400, 'Hei', INK, NEWS, 420, 460, -6, seed=21, tear=6))
o.append(letter('克', 700, 352, 390, 'Song', WHITE, INK, 400, 450, 5, seed=22))
o.append(safety_pin(1310, 190, 250, 38))
r, _ = ransom('PUNK', 96, 812, 176, seed=4, gap=8, skins=[(INK, NEWS), (WHITE, INK), (WHITE, PINK), (INK, YEL), (INK, WHITE), (YEL, INK)], fonts=['Anton', 'Abril', 'Slab', 'Stencil', 'Arch'])
o.append(r)
o.append(f'<g transform="translate(1010,610) rotate(-8)"><text x="0" y="52" text-anchor="middle" font-family="Stencil" font-size="170" letter-spacing="10" fill="{YEL}" stroke="{YEL}" stroke-width="5">XEROX</text></g>')
o.append(scrap(1060, 118, 500, 100, 3, YEL, T(250, 72, '复印一次，糊一层', 62, 'Hei', INK, 'middle', weight=900), seed=31))
o.append(letter('第1期', 1000, 250, 64, 'Hei', WHITE, INK, 230, 100, -7, seed=34))
o.append(T(840, 800, '1976 —', 72, 'Marker', INK, rot=-4))
o.append(T(780, 892, '剪刀 + 胶水 + 复印机', 48, 'Long', INK, rot=-3))
o.append(scrap(560, 1010, 640, 60, -1, WHITE, T(320, 42, 'NO FUTURE? NO PROBLEM. MAKE A ZINE.', 25, 'Cond', INK, 'middle', ls=3), seed=33))
# 马克笔的叉、箭头、星
o.append(f'<path d="M1000,690 C1020,740 1060,770 1120,775 m-30,-26 l32,26 l-28,28" fill="none" stroke="{INK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>')
star = ' '.join(f'{760 + (64 if i % 2 == 0 else 26) * math.cos(-math.pi / 2 + i * math.pi / 5):.0f},{700 + (64 if i % 2 == 0 else 26) * math.sin(-math.pi / 2 + i * math.pi / 5):.0f}' for i in range(10))
o.append(f'<polygon points="{star}" fill="{PINK}" transform="rotate(12 760 700)" filter="url(#tsh)"/>')
o.append(tape(220, 120, 170, -28, seed=3))
o.append(tape(860, 250, 150, 52, seed=4))
for x, y, r in ((110, 72, -4), (1830, 90, 6), (120, 1030, 3), (1850, 1012, -5)):
    o.append(staple(x, y, r))
orig = ''.join(o)

# —— 光条：一根很亮的竖条 + 两层泛光；光条左边印出来的部分略压暗，好让“已经复印过”读得出来 ——
bar = (f'<rect x="{BAR - 140}" y="0" width="280" height="{H}" fill="{LIGHT}" opacity=".26" filter="url(#glow2)" style="mix-blend-mode:screen"/>'
       f'<rect x="{BAR - 30}" y="0" width="60" height="{H}" fill="{LIGHT}" opacity=".7" filter="url(#glow)" style="mix-blend-mode:screen"/>'
       f'<rect x="{BAR - 7}" y="0" width="14" height="{H}" fill="#F4FFE8"/>'
       f'<rect x="{BAR - 2}" y="0" width="4" height="{H}" fill="#fff"/>')

# —— 屏幕上的标注（不进复印）——
hud = (f'<g font-family="Mono" fill="{LIGHT}">'
       f'<rect x="{BAR + 22}" y="{H - 130}" width="268" height="40" fill="#0d0f0e" opacity=".82"/>'
       f'<text x="{BAR + 38}" y="{H - 102}" font-size="22" letter-spacing="1">扫描 ▸ 第 1 → 2 代</text>'
       f'<rect x="{BAR + 22}" y="{H - 82}" width="300" height="40" fill="#0d0f0e" opacity=".82"/>'
       f'<text x="{BAR + 38}" y="{H - 54}" font-size="22">阈值 0.50 · 噪声 0.34</text></g>')

svg = (f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="position:absolute;left:0;top:0">'
       f'<defs>{defs()}<g id="orig">{orig}</g>'
       f'<clipPath id="L"><rect width="{BAR}" height="{H}"/></clipPath><clipPath id="R"><rect x="{BAR}" width="{W - BAR}" height="{H}"/></clipPath></defs>'
       f'<g clip-path="url(#R)"><use href="#orig"/><rect width="{W}" height="{H}" filter="url(#grain)" style="mix-blend-mode:multiply"/></g>'
       f'<g clip-path="url(#L)"><g filter="url(#xerox)"><use href="#orig"/></g></g>'
       f'{bar}{hud}</svg>')
open('cover.html', 'w').write(page(W, H, svg))
