"""垃圾摇滚版式 · 落到网页和手机 App（1920×1080）：一本音乐杂志的官网和它的播放器。
网页：标题过了照片的边就换颜色、正文栏互相压着、按钮是一块错版印了两遍的黑。
手机：播放进度不是一根细条，是歌名被拖出来的拖影——拖多长，就播了多少；歌词当前那句大、其余行距挤成一团。
python3 ui.py && node ../_lib/shot.cjs ui.html png/ui.png"""
from grunge import *

W, H = 1920, 1080

# ———————————— 网页 ————————————
wx, wy, ww, wh = 50, 70, 1300, 950
w = [f'<rect width="{ww}" height="{wh}" fill="{PAPER}"/>']
w.append(T(40, 104, "Static", 72, "Bod", INK, weight=800, ls=-1) + T(262, 100, '静电', 34, 'Song', RUST, weight=900))
for i, t in enumerate(['ISSUES', 'AUDIO', 'TYPE', 'SHOP']):
    w.append(T(640 + i * 160, 96, t, 18, 'Cond', INK, ls=12))
w.append(f'<rect x="30" y="128" width="1240" height="3" fill="{INK}"/>')
# 照片 + 跨界标题
PX, PY, PWD, PHT = 0, 150, 640, 560
w.append(photo(PX, PY, PWD, PHT, uid='wp', tone=TEAL))
head = T(60, 420, '噪音', 300, 'Song', '{c}', weight=900, ls=-24)
w.append(f'<clipPath id="won"><rect x="{PX}" y="{PY}" width="{PWD}" height="{PHT}"/></clipPath><clipPath id="woff"><rect x="{PWD}" y="0" width="{ww}" height="{wh}"/><rect x="0" y="{PY + PHT}" width="{ww}" height="{wh}"/></clipPath>')
w.append(f'<g clip-path="url(#won)" filter="url(#erode)">{head.replace("{c}", PAPER)}</g><g clip-path="url(#woff)" filter="url(#erode)">{head.replace("{c}", INK)}</g>')
sub = T(70, 640, '就是内容', 150, 'Hei', '{c}', weight=900, ls=-6)
w.append(f'<g clip-path="url(#won)">{sub.replace("{c}", ACID)}</g><g clip-path="url(#woff)" style="mix-blend-mode:multiply">{sub.replace("{c}", RUST)}</g>')
w.append(T(40, 186, 'COVER STORY · 第 07 期', 16, 'Mono', PAPER, ls=4))
# 右边：英文大标题错版、正文栏互相压
eng = T(690, 280, 'the noise', 104, 'BodI', '{c}', weight=700, ls=-3)
w.append(f'<g style="mix-blend-mode:multiply">{eng.replace("{c}", TEAL).replace("x=\"690\"", "x=\"697\"").replace("y=\"280\"", "y=\"286\"")}</g>{eng.replace("{c}", INK)}')
w.append(T(700, 360, 'IS THE MESSAGE', 44, 'Cond', RUST, ls=19))
w.append(body(700, 420, 260, 16, 14, 1.5, seed=11, strike=(4,)))
w.append(body(880, 470, 200, 14, 12, 2.6, seed=12, col='#57524a', op=.9))
w.append(body(1080, 410, 180, 30, 13, .9, seed=13))
w.append(f'<rect x="694" y="676" width="370" height="34" fill="{ACID}"/>' + T(704, 700, '行距 0.9 / 1.5 / 2.6 · 三栏互相压着', 18, 'Hei', INK, weight=700))
# 按钮：一块黑，错版的青先印、偏 6px
w.append(f'<rect x="706" y="746" width="260" height="70" fill="{TEAL}"/><rect x="700" y="740" width="260" height="70" fill="{INK}"/>')
w.append(T(830, 787, 'R E A D  →', 26, 'Cond', PAPER, 'middle'))
w.append(f'<rect x="984" y="750" width="270" height="60" fill="{ACID}"/>' + T(994, 774, '悬停：字距 0 → +40', 18, 'Mono', INK) + T(994, 800, '按下：错版 6px → 0', 18, 'Mono', INK))
# 底：本期曲目，数字是描边的 Bodoni
for i, (n, t, d) in enumerate((('01', 'FEEDBACK LOOP', '3:12'), ('02', '纸做的吉他', '4:05'), ('03', 'FLANNEL WEATHER', '2:48'))):
    x = 40 + i * 420
    w.append(T(x, 916, n, 120, 'Bod', 'none', weight=800, extra=f'stroke="{INK}" stroke-width="2"'))
    w.append(T(x + 150, 868, t, 30 if ord(t[0]) < 256 else 32, 'Cond' if ord(t[0]) < 256 else 'Hei', INK, ls=2, weight=900))
    w.append(T(x + 150, 902, d + '  ·  ▶ PLAY', 16, 'Mono', '#57524a', ls=2))
w.append(f'<rect x="30" y="826" width="1240" height="2" fill="{INK}"/>')
web = (f'<g transform="translate({wx},{wy})"><rect x="-4" y="-56" width="{ww + 8}" height="{wh + 60}" rx="14" fill="{INK}" filter="url(#sh)"/>'
       + ''.join(f'<circle cx="{28 + i * 26}" cy="-26" r="8" fill="{c}"/>' for i, c in enumerate([RUST, ACID, TEAL]))
       + f'<rect x="120" y="-42" width="420" height="32" rx="16" fill="#2c2a26"/>' + T(140, -19, 'static-mag.net/07', 19, 'Mono', PAPER)
       + f'<clipPath id="wc"><rect width="{ww}" height="{wh}"/></clipPath><g clip-path="url(#wc)">{"".join(w)}</g></g>')

# ———————————— 手机：播放器 ————————————
px, py, pw, ph = 1440, 86, 420, 908
p = [f'<rect width="{pw}" height="{ph}" fill="#151412"/>']
p.append(photo(0, 0, pw, 470, uid='pp', tone=RUST))
p.append(T(28, 44, '23:41', 19, 'Mono', PAPER) + T(pw - 28, 44, '41%', 19, 'Mono', PAPER, 'end'))
p.append(T(28, 92, 'NOW PLAYING · 正在放', 15, 'Mono', PAPER, ls=3, op=.8))
# 歌名：横着拉宽，最后一条被拖成拖影 = 进度
title = f'<g transform="translate(24,0) scale(1.3,1) translate(-24,0)">{T(24, 560, "纸做的吉他", 50, "Hei", ACID, weight=900, ls=-3)}</g>'
p.append(title)
p.append(smear(title, 318, 326, 516, 568, k=12, blur=(4, .3), op=.9, reach=pw))
p.append(T(28, 604, 'STATIC SESSIONS · TRACK 02', 16, 'Cond', PAPER, ls=8, op=.8))
p.append(f'<rect x="28" y="630" width="{pw - 56}" height="2" fill="{PAPER}" opacity=".25"/><rect x="28" y="630" width="{(pw - 56) * .58:.0f}" height="2" fill="{ACID}"/>')
p.append(T(28, 656, '2:21', 15, 'Mono', PAPER, op=.7) + T(pw - 28, 656, '4:05', 15, 'Mono', PAPER, 'end', op=.7))
# 歌词：当前句大，上下挤成一团
lyr = [('the column fell off the page', 13, .35, 0.9), ('and nobody picked it up', 13, .45, 0.9), ('纸做的吉他也会走音', 38, 1, 1.35), ('print it again', 13, .45, 0.9),
       ('print it again', 13, .3, 0.9)]
y = 700
for t, sz, op, ld in lyr:
    y += sz * ld + 6
    p.append(T(28, y, t, sz, 'Hei' if ord(t[0]) > 256 else 'Mono', PAPER if sz < 20 else ACID, op=op, weight=900 if sz > 20 else 400))
# 控制：大号 Condensed 字当按钮
p.append(T(70, 868, '◀◀', 30, 'Cond', PAPER, 'middle') + f'<rect x="166" y="818" width="90" height="70" fill="{ACID}"/><rect x="160" y="812" width="90" height="70" fill="{PAPER}"/>'
         + T(205, 860, '❚❚', 28, 'Cond', INK, 'middle') + T(345, 868, '▶▶', 30, 'Cond', PAPER, 'middle'))
phone = (f'<g transform="translate({px},{py})"><rect x="-14" y="-14" width="{pw + 28}" height="{ph + 28}" rx="62" fill="#0c0b0a" filter="url(#sh)"/>'
         f'<clipPath id="pc"><rect width="{pw}" height="{ph}" rx="48"/></clipPath><g clip-path="url(#pc)">{"".join(p)}</g></g>')

svg = (f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="position:absolute;left:0;top:0"><defs>{DEFS}</defs>'
       f'<rect width="{W}" height="{H}" fill="#CFC8B8"/>{web}{phone}'
       f'<rect width="{W}" height="{H}" filter="url(#paper)" style="mix-blend-mode:multiply"/></svg>')
open('ui.html', 'w').write(page(W, H, svg))
