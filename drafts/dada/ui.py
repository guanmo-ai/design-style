"""达达 · 落到网页和手机 App（1920×1080）：一个独立音乐节的官网和它的票夹。
规矩只有三条：每个字换一种字体、每张纸片歪 3—9°、照片只用网点。按钮是一条剪下来的红纸，指示手指着它。
python3 ui.py && node ../_lib/shot.cjs ui.html png/ui.png"""
from dada import *

W, H = 1920, 1080


def T(x, y, txt, size, font='Type', col=INK, anchor='start', ls=0, rot=0, weight=900):
    tr = f' transform="rotate({rot} {x} {y})"' if rot else ''
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{font}" font-weight="{weight}" font-size="{size}" '
            f'letter-spacing="{ls}" fill="{col}"{tr}>{txt}</text>')


def ransom(txt, x, y, size, seed=0, gap=6):
    """一行勒索信：每个字母一张纸片，字体、底色、角度轮着换。返回 (svg, 行宽)。"""
    rng = random.Random(seed)
    fonts = ['Abril', 'Anton', 'Rye', 'Slab', 'Arch', 'Frak']
    skins = [(INK, NEWS), (NEWS, INK), (RED, NEWS), (OCHRE, INK), (PINK, INK), (NEWS, RED)]
    out, cx = [], x
    for i, ch in enumerate(txt):
        if ch == ' ':
            cx += size * .34
            continue
        f = fonts[(i * 5 + seed) % len(fonts)]
        bg, col = skins[(i * 7 + seed * 3) % len(skins)]
        w = size * (.5 if ch in 'IJ!' else .86 if ch in 'MW' else .7)
        out.append(glyph(ch, cx + w / 2, y + rng.uniform(-size * .05, size * .05), size * .84, f, col, rng.uniform(-7, 7), bg, w, size * 1.08, seed=seed * 100 + i))
        cx += w + gap
    return ''.join(out), cx - x


# ———————————— 网页 ————————————
wx, wy, ww, wh = 50, 60, 1300, 960
web = []
web.append(f'<rect width="{ww}" height="{wh}" fill="{PAPER}"/><rect width="{ww}" height="{wh}" filter="url(#fiber)"/>')
# 导航
r, _ = ransom('HOP HOP', 44, 104, 44, seed=3, gap=3)
web.append(r)
for i, t in enumerate(['LINE-UP', 'TICKETS', 'ZINE', 'INFO']):
    web.append(T(690 + i * 128, 114, t, 21, ls=2))
web.append(f'<rect x="1188" y="84" width="76" height="44" fill="{INK}" transform="rotate(-3 1226 106)"/>' + T(1226, 114, 'DE', 21, 'Arch', NEWS, 'middle', rot=-3))
web.append(f'<path d="M30,150 L420,146 L800,153 L1270,147" fill="none" stroke="{INK}" stroke-width="4"/>')
# 主视觉右边：拼贴
web.append(scrap(1010, 420, 500, 470, 5, KRAFT, seed=51, tear=6))
web.append(f'<rect x="-330" y="-34" width="660" height="68" transform="translate(1010,470) rotate(-24)" fill="{RED}" filter="url(#sh)"/>')
web.append(f'<circle cx="1000" cy="400" r="176" fill="{INK}" filter="url(#sh)"/>')
web.append(photo(990, 380, 370, 232, -6, eye_lum, seed=52, pitch=8))
web.append(photo(1150, 580, 250, 158, 8, lips_lum, seed=53, pitch=7))
web.append(gear(812, 566, 92, 11, INK, 12))
web.append(glyph('!', 1196, 300, 190, 'Abril', INK, 12))
web.append(glyph('吵', 838, 250, 84, 'Hei', NEWS, -8, RED, 118, 126, seed=54))
# 主视觉左边：三行大字，每行一种贴法
r, _ = ransom('MAKE', 48, 252, 124, seed=1, gap=8)
web.append(r)
r, _ = ransom('NOISE', 48, 402, 124, seed=2, gap=8)
web.append(r)
web.append(scrap(248, 538, 404, 86, -2, INK, T(202, 62, 'not sense.', 62, 'Play', NEWS, 'middle', weight=700), seed=55))
web.append(T(52, 626, 'Three nights, forty acts, no programme. We cut the', 23, col='#3b352b'))
web.append(T(52, 658, 'line-up out of a newspaper and pulled it from a hat.', 23, col='#3b352b'))
# 按钮：一条剪下来的红纸 + 一条描边的白纸；指示手指着红的
web.append(scrap(262, 730, 290, 74, -3, RED, T(145, 48, 'GET TICKETS', 28, 'Arch', NEWS, 'middle', ls=1), seed=56))
web.append(scrap(556, 734, 260, 66, 2, NEWS, f'<rect x="5" y="5" width="250" height="56" fill="none" stroke="{INK}" stroke-width="3"/>' + T(130, 43, 'Read the zine', 24, 'Type', INK, 'middle'), seed=57))
web.append(hand(22, 736, 92, -4))
# 三张演出卡：每张歪一点，日期是从日历上撕下来的
cards = [('FR', '12', 'UMBA UMBA', 'brass, typewriter, shouting', PINK, -3, eye_lum), ('SA', '13', 'KRRR KOLLEKTIV', 'tape loops, four radios', OCHRE, 2, lips_lum),
         ('SO', '14', 'HAT TRICK', 'poems pulled from a hat', NEWS, -2, eye_lum)]
for i, (d, n, name, sub, bg, rot, lum) in enumerate(cards):
    inner = (f'<rect x="14" y="14" width="96" height="112" fill="{INK}"/>' + T(62, 44, d, 22, 'Arch', NEWS, 'middle', ls=2) + T(62, 108, n, 62, 'Abril', NEWS, 'middle')
             + T(128, 56, name, 31, 'Anton', INK, ls=1) + T(128, 88, sub, 18, 'Type', '#3b352b')
             + f'<rect x="128" y="102" width="76" height="26" fill="{RED}"/>' + T(166, 121, '20:00', 17, 'Arch', NEWS, 'middle'))
    web.append(scrap(232 + i * 412, 868, 384, 140, rot, bg, inner, seed=60 + i, tear=3 if i == 2 else 0))
web_svg = (f'<g transform="translate({wx},{wy})"><rect x="-4" y="-56" width="{ww + 8}" height="{wh + 60}" rx="16" fill="{INK}" filter="url(#sh2)"/>'
           f'<rect x="0" y="-52" width="{ww}" height="52" fill="{KRAFT}"/>'
           + ''.join(f'<circle cx="{28 + i * 26}" cy="-26" r="8" fill="{c}"/>' for i, c in enumerate([RED, OCHRE, INK]))
           + f'<rect x="120" y="-42" width="420" height="32" rx="16" fill="{NEWS}"/>' + T(140, -19, 'hophop.fest', 19, col='#3b352b')
           + f'<clipPath id="wc"><rect width="{ww}" height="{wh}"/></clipPath><g clip-path="url(#wc)">{"".join(web)}</g></g>')

# ———————————— 手机 ————————————
px, py, pw, ph = 1440, 86, 420, 908
p = []
p.append(f'<rect width="{pw}" height="{ph}" fill="{PAPER}"/><rect width="{pw}" height="{ph}" filter="url(#fiber)"/>')
p.append(T(36, 44, '21:07', 19, 'Arch') + T(pw - 36, 44, '100%', 19, 'Arch', anchor='end'))
p.append(T(34, 92, 'YOUR TICKET FOR', 17, ls=3, col='#3b352b'))
r, _ = ransom('TONIGHT', 28, 150, 62, seed=7, gap=3)
p.append(r)
# 票：一张红纸，左边一只网点眼睛，右边撕口
tk = (photo(92, 100, 150, 150, -4, eye_lum, seed=71, pitch=7) + T(186, 62, 'ADMIT', 44, 'Anton', NEWS, ls=2) + T(186, 112, 'ONE', 60, 'Abril', INK)
      + T(186, 150, 'row ? · seat ?', 19, 'Type', NEWS) + f'<line x1="14" y1="180" x2="356" y2="180" stroke="{NEWS}" stroke-width="3" stroke-dasharray="3 9"/>'
      + T(20, 208, 'NR. 000316', 19, 'Type', NEWS, ls=2) + T(352, 208, 'FR 12', 19, 'Arch', NEWS, 'end'))
p.append(scrap(pw / 2, 322, 372, 224, -3, RED, tk, seed=70, tear=3))
p.append(T(34, 492, 'UP NEXT', 17, ls=3, col='#3b352b'))
rows = [('20:00', 'UMBA UMBA', NEWS, INK, 2), ('21:30', 'KRRR KOLLEKTIV', OCHRE, INK, -2), ('23:00', 'HAT TRICK', INK, NEWS, 1.5)]
for i, (t, name, bg, col, rot) in enumerate(rows):
    inner = T(18, 46, t, 26, 'Abril', RED if bg != INK else OCHRE) + T(112, 45, name, 27, 'Anton', col, ls=1) + T(340, 46, '→', 28, 'Arch', col, 'end')
    p.append(scrap(pw / 2, 548 + i * 86, 364, 70, rot, bg, inner, seed=80 + i, tear=3 if i == 1 else 0))
# 标签栏：四个剪出来的形状，选中的那个贴在红纸上
p.append(f'<path d="M20,790 L160,786 L300,792 L400,788" fill="none" stroke="{INK}" stroke-width="3"/>')
p.append(scrap(74, 846, 76, 76, -6, RED, seed=90))
icons = [f'<circle r="17" fill="{NEWS}"/>', f'<polygon points="0,-19 19,15 -19,15" fill="{INK}"/>', f'<rect x="-16" y="-16" width="32" height="32" fill="{INK}" transform="rotate(8)"/>',
         f'<path d="M-18,0 L18,0 M0,-18 L0,18" stroke="{INK}" stroke-width="9"/>']
for i, ic in enumerate(icons):
    p.append(f'<g transform="translate({74 + i * 91},846)">{ic}</g>')
phone_svg = (f'<g transform="translate({px},{py})"><rect x="-14" y="-14" width="{pw + 28}" height="{ph + 28}" rx="62" fill="{INK}" filter="url(#sh2)"/>'
             f'<clipPath id="pc"><rect width="{pw}" height="{ph}" rx="48"/></clipPath><g clip-path="url(#pc)">{"".join(p)}</g></g>')

svg = (f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="position:absolute;left:0;top:0"><defs>{DEFS}</defs>'
       f'<rect width="{W}" height="{H}" fill="#CDBE9E"/>{web_svg}{phone_svg}'
       f'<rect width="{W}" height="{H}" filter="url(#grain)" style="mix-blend-mode:multiply"/></svg>')
open('ui.html', 'w').write(page(W, H, svg))
