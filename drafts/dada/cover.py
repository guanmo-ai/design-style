"""达达 · 第 0 帧（1920×1080）：一张正在贴的拼贴。
标题的六个字来自六种字体、六张纸片；右边是从画报上剪下来的眼睛、嘴、齿轮和指示手；
上边剪刀还在剪，中间那张“偶然”还悬在半空（影子更远），虚线框是它要落下去的地方。
python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png"""
from dada import *

W, H = 1920, 1080
s = []


def strip(txt, cx, cy, size, font, rot, bg=NEWS, col=INK, seed=0, k=.6, pad=20, tear=0, ls=0, sh='sh'):
    """一条剪下来的字条。"""
    w = sum(1 if ord(c) > 0x2e80 else k for c in txt) * size + len(txt) * ls + pad * 2
    h = size * 1.55
    t = (f'<text x="{w / 2:.0f}" y="{h / 2 + size * .35:.0f}" text-anchor="middle" font-family="{font}" font-weight="900" '
         f'font-size="{size}" letter-spacing="{ls}" fill="{col}">{txt}</text>')
    return scrap(cx, cy, w, h, rot, bg, t, seed, tear, sh)


# —— 底层：牛皮纸、两块报纸、一条红带、一个黑圆 ——
s.append(scrap(1440, 560, 880, 960, 4, KRAFT, seed=1, tear=7))
s.append(scrap(350, 905, 640, 300, -4, NEWS, column(30, 44, 270, 12, seed=2) + column(336, 44, 270, 12, seed=3), seed=2, tear=5, clip=True))
s.append(scrap(1690, 190, 400, 300, 7, NEWS, column(28, 42, 344, 11, seed=4), seed=4, tear=5, clip=True))
s.append(f'<rect x="-760" y="-58" width="1520" height="116" transform="translate(1400,650) rotate(-27)" fill="{RED}" filter="url(#sh)"/>')
s.append(f'<circle cx="1300" cy="470" r="268" fill="{INK}" filter="url(#sh)"/>')

# —— 右边：画报上剪下来的东西 ——
s.append(gear(1050, 800, 190, 14, INK, 10))
s.append(gear(1236, 944, 98, 9, RED, 4, spokes=5))
s.append(photo(1300, 440, 540, 340, -5, eye_lum, seed=11, pitch=10))
s.append(photo(1590, 810, 410, 260, 9, lips_lum, seed=12, pitch=9))
s.append(hand(1900, 600, 330, 5, flip=True))
s.append(glyph('?', 1740, 420, 300, 'Abril', INK, 14))
s.append(strip('NON', 1090, 560, 70, 'Anton', -82, OCHRE, seed=31, k=.5))
s.append(strip('nr. 3', 1500, 1010, 40, 'Type', -4, NEWS, seed=32))

# —— 还在发生的两件事：剪刀在剪一条字、一张纸片悬在半空 ——
s.append(strip('da da da da da da da', 1440, 96, 46, 'Slab', -3, NEWS, seed=41, ls=2, k=.66))
s.append(f'<line x1="1000" y1="118" x2="1130" y2="111" stroke="{INK}" stroke-width="3" stroke-dasharray="10 9"/>')
s.append(scissors(1010, 118, 1.15, 177))
s.append(f'<rect x="-128" y="-74" width="256" height="148" transform="translate(852,712) rotate(-9)" fill="none" stroke="{INK}" stroke-width="3" stroke-dasharray="4 12" stroke-linecap="round" opacity=".6"/>')
s.append(glyph('偶然', 884, 648, 96, 'Song', NEWS, 6, RED, 256, 148, seed=42, sh='sh2'))

# —— 标题：六个字，六种字体，六张纸 ——
s.append(glyph('D', 185, 250, 300, 'Abril', NEWS, -7, INK, 236, 316, seed=21))
s.append(glyph('A', 392, 232, 330, 'Anton', RED, 5, NEWS, 200, 350, seed=22, tear=4))
s.append(glyph('D', 590, 268, 250, 'Rye', INK, -4, OCHRE, 240, 290, seed=23))
s.append(glyph('A', 806, 300, 280, 'Frak', NEWS, 8, RED, 216, 300, seed=24))
s.append(glyph('达', 250, 590, 250, 'Hei', INK, 4, PINK, 290, 300, seed=25))
s.append(glyph('达', 540, 600, 270, 'Ma', NEWS, -6, INK, 280, 300, seed=26, tear=5))
s.append(strip('1916 — 1924', 250, 800, 46, 'Type', -3, INK, NEWS, seed=27))
s.append(strip('剪下来，再贴歪一点', 450, 892, 50, 'Song', 2, OCHRE, seed=28))
s.append(strip('HÖCH · HAUSMANN · SCHWITTERS · TZARA', 400, 990, 23, 'Arch', -1, NEWS, seed=29, ls=3, k=.7))

svg = (f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="position:absolute;left:0;top:0"><defs>{DEFS}</defs>'
       f'<rect width="{W}" height="{H}" fill="{PAPER}"/><rect width="{W}" height="{H}" filter="url(#fiber)"/>{"".join(s)}'
       f'<rect width="{W}" height="{H}" filter="url(#grain)" style="mix-blend-mode:multiply"/></svg>')
open('cover.html', 'w').write(page(W, H, svg))
