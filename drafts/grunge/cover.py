"""垃圾摇滚版式 · 第 0 帧（1920×1080）：一本 90 年代音乐杂志的跨页，排得“不对”。
左页一张糊照片出血；“垃圾”两个字压在照片和纸的交界上——过了界就换颜色；“摇滚”被横着拉宽，最后一笔被扫描时的手一拖，
拖成一道道横线一直拉到右页；右页的正文栏互相压着、行距一会儿挤一会儿松，有一栏竖着跑出了页面。
动起来：拖影往右甩、正文栏以不同速度滑过、字距从 −80 拉到 +600 再弹回。
python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png"""
from grunge import *

W, H = 1920, 1080
PW = 820                      # 照片宽（左页出血）
s = []

s.append(f'<rect width="{W}" height="{H}" fill="{PAPER}"/>')
s.append('<linearGradient id="gut" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#000" stop-opacity=".22"/>'
         '<stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>')
s.append(photo(0, 0, PW, H))

# —— 右页：页眉、正文栏 ——
s.append(T(1000, 64, 'RAY GUN 1992— · SEATTLE SOUND · 西雅图之声', 18, 'Cond', INK, ls=14))
s.append(T(1880, 64, '092', 18, 'Cond', INK, 'end', ls=4))
s.append(body(1010, 470, 300, 30, 15, 1.42, seed=1, strike=(6, 7, 19)))
s.append(body(1330, 430, 150, 20, 13, 2.5, seed=2, col='#47433b'))
s.append(f'<g transform="rotate(90 1846 110)">{body(1846, 110, 880, 3, 24, 1.15, seed=3, font="CondM", col="#5d584d")}</g>')
s.append(body(1500, 760, 300, 12, 15, .82, seed=4, op=.9))
s.append(T(1500, 560, 'leading is', 58, 'BodI', RUST, weight=500))
s.append(T(1500, 624, 'a feeling.', 58, 'BodI', RUST, weight=500))
s.append(T(1502, 690, '— 行距不是数字，是感觉', 22, 'Hei', INK, weight=700))

# —— Grunge：Bodoni 斜体，错版印两遍（青 + 墨） ——
g = T(990, 330, 'Grunge', 250, 'BodI', '{c}', weight=800, ls=-8)
s.append(f'<g style="mix-blend-mode:multiply">{g.replace("{c}", TEAL).replace("x=\"990\"", "x=\"1001\"").replace("y=\"330\"", "y=\"339\"")}</g>')
s.append(f'<g filter="url(#erode)">{g.replace("{c}", INK)}</g>')
s.append(T(1004, 380, 'TYPE  WAS  A  RUMOUR', 30, 'Cond', INK, ls=22))

# —— 垃圾 / 摇滚：过了照片的边就换颜色 ——
big = T(330, 560, '垃圾', 420, 'Song', '{c}', weight=900, ls=-30)
s.append('<clipPath id="onp"><rect width="820" height="1080"/></clipPath><clipPath id="offp"><rect x="820" width="1100" height="1080"/></clipPath>')
s.append(f'<g clip-path="url(#onp)" filter="url(#erode)">{big.replace("{c}", PAPER)}</g>')
s.append(f'<g clip-path="url(#offp)" filter="url(#erode)">{big.replace("{c}", INK)}</g>')

# —— 摇滚：横着拉宽 1.5 倍、锈红、正片叠底；最后一窄条被拖成横线 ——
yg = f'<g transform="translate(120,0) scale(1.5,1) translate(-120,0)">{T(120, 900, "摇滚", 300, "Hei", RUST, weight=900, ls=-20)}</g>'
yg2 = yg.replace(RUST, ACID)
s.append(f'<g clip-path="url(#onp)">{slices(yg2, 120, 640, 900, 300, n=22, amp=14, seed=2, uid="ya")}</g>')
s.append(f'<g clip-path="url(#offp)" style="mix-blend-mode:multiply">{slices(yg, 120, 640, 900, 300, n=22, amp=14, seed=2, uid="yg")}</g>')
s.append(f'<g style="mix-blend-mode:multiply">{smear(yg, 955, 966, 640, 940, k=88, op=.9)}</g>')
s.append(f'<g style="mix-blend-mode:multiply" opacity=".45">{smear(yg, 940, 955, 640, 940, k=50, blur=(16, .2))}</g>')

# —— 左页照片上的小字：图注、反白 ——
s.append(T(40, 60, 'PHOTO: SOMEONE WHO WAS THERE', 16, 'Mono', PAPER, ls=3, op=.8))
s.append(T(40, 1040, '1990s · 字就是图，图就是字', 30, 'Hei', PAPER, weight=900))
s.append(T(40, 1004, 'CARSON · CHANTRY · RAY GUN · EMIGRE', 18, 'Cond', ACID, ls=6))

# —— 标注（荧光笔一样的条） ——
s.append(f'<rect x="1010" y="968" width="520" height="40" fill="{ACID}"/>')
s.append(T(1022, 996, '字距 −80 → +600 · 行距 0.8 / 2.5 · 拖影 ×88', 20, 'Mono', INK))

s.append(f'<rect x="900" width="120" height="{H}" fill="url(#gut)"/>')
svg = (f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="position:absolute;left:0;top:0"><defs>{DEFS}</defs>'
       f'{"".join(s)}<rect width="{W}" height="{H}" filter="url(#paper)" style="mix-blend-mode:multiply"/></svg>')
open('cover.html', 'w').write(page(W, H, svg))
