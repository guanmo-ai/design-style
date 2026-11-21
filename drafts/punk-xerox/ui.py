"""朋克复印机 · 落到网页和手机 App（1920×1080）。
网页：一家地下室 livehouse 的官网，整页就是一张复印出来的传单（白纸黑碳粉），只有“买票”那张荧光贴纸是复印完再贴上去的。
手机：一个做 zine 的 App。中间那排是同一个字复印 1 / 2 / 4 / 8 次——这就是签名动作；底下的阈值和噪声就是滤镜的两个参数。
python3 ui.py && node ../_lib/shot.cjs ui.html png/ui.png"""
from punk import *

W, H = 1920, 1080

# ———————————— 网页（先排原稿，再整页复印一次）————————————
wx, wy, ww, wh = 50, 70, 1300, 950
w = []
w.append(f'<rect width="{ww}" height="{wh}" fill="#fff"/>')
r, lw = ransom('BASEMENT', 40, 88, 52, seed=6, gap=2, skins=[(INK, '#fff'), ('#fff', INK), (INK, '#ddd')], fonts=['Anton', 'Abril', 'Slab', 'Stencil', 'Arch'])
w.append(r)
w.append(T(52 + lw, 104, '地下室', 34, 'Hei', INK, weight=900))
for i, t in enumerate(['演出', 'ZINE', '磁带', '关于']):
    w.append(T(770 + i * 120, 102, t, 26, 'Hei' if ord(t[0]) > 255 else 'Cond', INK, weight=900, ls=2))
w.append(f'<path d="M30,140 L1270,132" stroke="{INK}" stroke-width="6"/>')
# 主视觉：两个大剪字 + 一张现场照片
w.append(letter('今', 140, 330, 260, 'Hei', INK, '#fff', 250, 290, -5, seed=61, tear=5))
w.append(letter('晚', 390, 344, 250, 'Song', '#fff', INK, 250, 290, 4, seed=62))
w.append(letter('不', 150, 600, 220, 'Song', INK, '#ccc', 230, 250, 3, seed=63))
w.append(letter('睡', 380, 612, 230, 'Hei', '#fff', INK, 240, 260, -6, seed=64, tear=4))
w.append(photo(910, 420, 600, 470, 3, mic_lum, seed=65, pitch=9, bg='#e8e8e8'))
w.append(tape(700, 210, 170, -35, seed=7))
w.append(tape(1170, 640, 180, -30, seed=8))
w.append(T(560, 700, '三支乐队', 46, 'Long', INK, rot=-4))
w.append(T(560, 760, '一台复印机', 46, 'Long', INK, rot=-4))
w.append(f'<path d="M548,722 L800,700" stroke="{INK}" stroke-width="5"/>')
w.append(T(52, 790, 'FRI 12.06 · 21:00 — late · 门口付现金 · 不收卡', 24, 'Mono', INK, ls=1))
# 三张传单
acts = [('噪音', 'HALF-TONE', '21:00'), ('碳粉', 'TONER BOYS', '22:00'), ('订书钉', 'STAPLE GUN', '23:00')]
for i, (zh, en, t) in enumerate(acts):
    inner = (f'<rect x="0" y="0" width="390" height="118" fill="#fff"/><rect x="0" y="0" width="118" height="118" fill="{INK}"/>'
             + T(59, 82, t[:2], 64, 'Cond', '#fff', 'middle') + T(140, 52, zh, 40, 'Hei', INK, weight=900) + T(140, 94, en, 30, 'Stencil', INK, ls=2))
    w.append(scrap(232 + i * 420, 878, 390, 118, [-2, 1.5, -1][i], '#fff', inner, seed=70 + i))
    w.append(staple(232 + i * 420 - 150, 826, -8))
web_orig = ''.join(w)

# 复印完再贴上去的东西（不过滤镜）：荧光粉的买票贴纸 + 黄色的“售罄?”
sold = (f'<g transform="translate(1130,230) rotate(12)">'
        f'<circle r="96" fill="{YEL}" filter="url(#tsh)"/>'
        + T(0, -10, '只剩', 34, 'Hei', INK, 'middle', weight=900) + T(0, 42, '40 张', 46, 'Cond', INK, 'middle') + '</g>')

web = (f'<g transform="translate({wx},{wy})">'
       f'<rect x="-4" y="-56" width="{ww + 8}" height="{wh + 60}" rx="14" fill="#2b2d2c" filter="url(#psh)"/>'
       + ''.join(f'<circle cx="{28 + i * 26}" cy="-26" r="8" fill="{c}"/>' for i, c in enumerate([PINK, YEL, '#777']))
       + f'<rect x="120" y="-42" width="420" height="32" rx="16" fill="#121413"/>' + T(140, -19, 'basement.live', 19, 'Mono', '#cfd3d1')
       + f'<clipPath id="wc"><rect width="{ww}" height="{wh}"/></clipPath><g clip-path="url(#wc)">'
       f'<g filter="url(#xweb)"><g>{web_orig}</g></g>'
       + f'</g>{sold}'
       + f'</g>')
# 买票贴纸贴在“FRI 12.06”那行右边
cta = (f'<g transform="translate({wx + 1060},{wy + 770})">'
       + scrap(0, 0, 300, 100, -5, PINK, T(150, 68, '买票 ¥10', 54, 'Hei', INK, 'middle', weight=900), seed=81)
       + f'<path d="M-190,12 C-170,-30 -120,-40 -80,-20 m-26,-24 l28,22 l-32,16" fill="none" stroke="{PINK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'
       + '</g>')

# ———————————— 手机（整屏复印在黄纸上）————————————
px, py, pw, ph = 1440, 86, 420, 908
p = []
p.append(f'<rect width="{pw}" height="{ph}" fill="#fff"/>')
p.append(T(32, 44, '21:07', 19, 'Cond', INK, ls=1) + T(pw - 32, 44, '▮▮▮ 62%', 19, 'Cond', INK, 'end'))
r, lw = ransom('ZINE', 26, 112, 56, seed=9, gap=2, skins=[(INK, '#fff'), ('#fff', INK), (INK, '#ccc')], fonts=['Anton', 'Abril', 'Slab', 'Stencil', 'Arch'])
p.append(r)
p.append(T(36 + lw, 104, '复印机', 34, 'Hei', INK, weight=900))
# 预览：一张拼贴正在被扫，光条另外画在上面
p.append(scrap(pw / 2, 290, 360, 250, -2, '#ddd', halftone(360, 250, mic_lum(360, 250), 8, col=INK), seed=91, clip=True))
p.append(letter('吵', 120, 230, 76, 'Hei', '#fff', INK, 100, 104, -8, seed=92))
p.append(tape(300, 175, 110, 25, h=32, seed=9))
# 第 1 / 2 / 4 / 8 代：同一个字（这一排单独过四个不同的滤镜，见下）
p.append(T(32, 462, '复印几代', 18, 'Hei', INK, weight=900) + T(pw - 32, 462, 'GEN', 18, 'Cond', INK, 'end', ls=3))
gens_lbl = ''.join(T(32 + 46 + i * 92, 600, f'×{g}', 22, 'Cond', INK, 'middle') for i, g in enumerate((1, 2, 4, 8)))
p.append(gens_lbl)
# 两个滑块
for i, (lab, v, k) in enumerate((('阈值', '0.50', .5), ('噪声', '0.34', .34))):
    y = 662 + i * 74
    p.append(T(32, y, lab, 22, 'Hei', INK, weight=900) + T(pw - 32, y, v, 22, 'Cond', INK, 'end'))
    p.append(f'<rect x="32" y="{y + 16}" width="{pw - 64}" height="8" fill="{INK}"/><rect x="{32 + (pw - 64) * k - 14}" y="{y + 6}" width="28" height="28" fill="#fff" stroke="{INK}" stroke-width="5"/>')
# 复印按钮
p.append(f'<rect x="32" y="806" width="{pw - 64}" height="72" fill="{INK}"/>' + T(pw / 2, 854, '复印 ▸', 34, 'Hei', '#fff', 'middle', weight=900))
phone_orig = ''.join(p)

tiles = []
for i, (thr, blur, grit) in enumerate(((.5, .6, .14), (.55, 1.8, .3), (.6, 3.2, .5), (.66, 5.0, .75))):
    x = 32 + i * 92
    tiles.append(f'<g filter="url(#g{i})"><rect x="{x}" y="478" width="84" height="94" fill="#fff"/>'
                 f'<text x="{x + 42}" y="552" text-anchor="middle" font-family="Hei" font-weight="900" font-size="74" fill="{INK}">朋</text></g>')
    tiles.append(f'<rect x="{x}" y="478" width="84" height="94" fill="none" stroke="{INK}" stroke-width="3"/>')

scanbar = (f'<rect x="20" y="226" width="{pw - 40}" height="60" fill="{LIGHT}" opacity=".5" filter="url(#glow)" style="mix-blend-mode:screen"/>'
           f'<rect x="20" y="252" width="{pw - 40}" height="8" fill="#F4FFE8"/>')
phone = (f'<g transform="translate({px},{py})"><rect x="-14" y="-14" width="{pw + 28}" height="{ph + 28}" rx="62" fill="#111" filter="url(#psh)"/>'
         f'<clipPath id="pc"><rect width="{pw}" height="{ph}" rx="48"/></clipPath><g clip-path="url(#pc)">'
         f'<g filter="url(#xph)"><g>{phone_orig}</g></g>{"".join(tiles)}{scanbar}</g></g>')

gen_filters = ''.join(xf(f'g{i}', TONER_YEL, 11 + i, thr, grit, blur, .2 + i * .12) for i, (thr, blur, grit) in enumerate(((.5, .6, .14), (.55, 1.8, .3), (.6, 3.2, .5), (.66, 5.0, .75))))

# 两条标注：说明签名动作
notes = (f'<g font-family="Mono" fill="{LIGHT}" font-size="20">'
         f'<text x="{px - 18}" y="{py + 522}" text-anchor="end">同一个字</text><text x="{px - 18}" y="{py + 550}" text-anchor="end">复印 1→8 次 ▸</text>'
         f'<path d="M{px - 12},{py + 532} L{px + 22},{py + 532}" stroke="{LIGHT}" stroke-width="2"/></g>')

svg = (f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="position:absolute;left:0;top:0"><defs>{defs()}'
       + xf('xweb', TONER_WHITE, 5, .5, .2, .7, .3) + xf('xph', TONER_YEL, 8, .5, .14, .5, .2) + gen_filters + '</defs>'
       f'<rect width="{W}" height="{H}" fill="{GLASS}"/>'
       f'{web}{cta}{phone}'
       f'<rect width="{W}" height="{H}" filter="url(#grain)" style="mix-blend-mode:multiply"/></svg>')
open('ui.html', 'w').write(page(W, H, svg))
