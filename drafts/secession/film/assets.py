"""片子用的静态贴图：和风格图同一套 SVG 代码画，按 2 倍分辨率截成 PNG，放进 assets/。
会动的东西（树冠的金箔、飘落的金箔、字母生长、镜头）不在这里，在 engine.js / scenes.js 里实时画。
python3 assets.py   （会调用 ../../_lib/shot.cjs；顺带写出 geom.js 给页面用）"""
import json
import os
import random
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
os.environ.setdefault('FONTS', '../../../public/fonts')
from secession import *  # noqa: E402

OUT = HERE / 'assets'
OUT.mkdir(exist_ok=True)
SHOT = str(HERE.parents[1] / '_lib' / 'shot.cjs')
BG = 'html,body{background:transparent!important}'


def render(name, w, h, body, dpr=2, transparent=True, defs=''):
    svg = (f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" style="position:absolute;left:0;top:0">'
           f'<defs>{DEFS}{gold_defs()}{gold_defs("g2", 11, ".05 .08")}{defs}</defs>{body}</svg>')
    html = HERE / f'_{name}.html'
    html.write_text(page(w, h, svg, BG if transparent else ''))
    subprocess.run(['node', SHOT, str(html), str(OUT / f'{name}.png'), str(w), str(h), str(dpr)] + (['transparent'] if transparent else []), check=True)
    html.unlink()


# —— 方板（和封面同一套几何，左上角 = 0,0，边长 880；不含树冠的金箔）————————————————
PS, B = 880, 16
IX = IY = 4 * B
IS = PS - 8 * B
G = IS / 8
M = 40
BXp, BYp, BS = IX + G + M, IY + G + M, 6 * G - 2 * M
CX = BXp + BS / 2
R = BS * .29
CROWN_Y = BYp + BS * .38
BASE = BYp + BS - 46
EDGE = ['frame', 'dot', 'ring', 'golddot', 'golddot', 'ring', 'dot', 'frame']


def panel(crown=False):
    s = [f'<rect width="{PS}" height="{PS}" fill="{PAPER}"/>', f'<rect width="{PS}" height="{PS}" filter="url(#paper)"/>',
         checker_band(B, B, PS - 2 * B, B), checker_band(B, PS - 3 * B, PS - 2 * B, B),
         checker_band(B, 3 * B, PS - 6 * B, B, horizontal=False), checker_band(PS - 3 * B, 3 * B, PS - 6 * B, B, horizontal=False),
         f'<rect x="{IX - 4}" y="{IY - 4}" width="{IS + 8}" height="{IS + 8}" fill="none" stroke="{INK}" stroke-width="3"/>']
    for k in range(8):
        for (i, j) in ((k, 0), (k, 7), (0, k), (7, k)):
            s.append(motif(EDGE[k], IX + i * G + 6, IY + j * G + 6, G - 12, gold='url(#ggrad)'))
    for (i, j) in ((0, 0), (7, 0), (0, 7), (7, 7)):
        s.append(f'<rect x="{IX + i * G + 6}" y="{IY + j * G + 6}" width="{G - 12}" height="{G - 12}" fill="{INK}"/>')
        k = G * .36
        s.append(f'<rect x="{IX + i * G + k}" y="{IY + j * G + k}" width="{G - 2 * k}" height="{G - 2 * k}" fill="url(#ggrad)"/>')
    s.append(f'<rect x="{IX + G}" y="{IY + G}" width="{6 * G}" height="{6 * G}" fill="none" stroke="{INK}" stroke-width="2"/>')
    s.append(f'<rect x="{BXp}" y="{BYp}" width="{BS}" height="{BS}" fill="{INK}"/>')
    s.append(f'<rect x="{BXp + 14}" y="{BYp + 14}" width="{BS - 28}" height="{BS - 28}" fill="none" stroke="{GOLD}" stroke-width="2" opacity=".7"/>')
    s.append(f'<rect x="{BXp + 40}" y="{BASE}" width="{BS - 80}" height="6" fill="url(#ggrad)"/>')
    s.append(f'<rect x="{CX - 7}" y="{CROWN_Y}" width="14" height="{BASE - CROWN_Y}" fill="url(#ggrad)"/>')
    for side in (-1, 1):
        for (dx, rr, hh) in ((.335, 26, 122), (.435, 19, 82)):
            tx = CX + side * BS * dx
            s.append(f'<rect x="{tx - 3.5}" y="{BASE - hh}" width="7" height="{hh}" fill="url(#ggrad)"/>')
            s.append(f'<circle cx="{tx}" cy="{BASE - hh - rr + 4}" r="{rr}" fill="url(#ggrad)" filter="url(#gleaf)"/>')
    if crown:
        s.append(gilded(f'<circle cx="{CX}" cy="{CROWN_Y}" r="{R}"/>', CX - R, CROWN_Y - R, 2 * R, 2 * R, 7, random.Random(7), 'crown'))
    return ''.join(s)


render('panel', PS, PS, panel(False), dpr=2, transparent=False)
render('panel_full', PS, PS, panel(True), dpr=.5, transparent=False)    # 远景用：树冠贴满的小图

# —— 标题块（世界坐标里放在方板左边；透明底）——————————————————————————————
TW, TH = 860, 880
u = 24
t = [f'<text x="0" y="50" font-family="Jost" font-weight="500" font-size="26" letter-spacing="9" fill="{GOLD}">WIEN · 1897</text>',
     checker(300, 32, 12, 1, 12, GOLD, INK),
     word('SECESSION', 0, 100, u, fill=PAPER, dot=GOLD),
     f'<text x="-6" y="{100 + 7 * u + 150}" font-family="Qk" font-size="138" letter-spacing="6" fill="url(#ggrad)" filter="url(#gleaf2)">维也纳分离派</text>',
     f'<text x="0" y="{100 + 7 * u + 250}" font-family="Song" font-weight="700" font-size="54" fill="{PAPER}">装饰，从一个正方形开始</text>',
     f'<rect x="0" y="{100 + 7 * u + 300}" width="96" height="6" fill="{GOLD}"/>',
     f'<text x="0" y="{100 + 7 * u + 370}" font-family="Jost" font-weight="500" font-size="25" letter-spacing="4.5" fill="{BONE}">DER ZEIT IHRE KUNST · DER KUNST IHRE FREIHEIT</text>',
     f'<text x="0" y="{100 + 7 * u + 416}" font-family="Song" font-weight="500" font-size="27" letter-spacing="3" fill="#9E968A">给时代以艺术，给艺术以自由</text>']
for i, (c, name) in enumerate(((INK, '#121110'), (PAPER, '#F2EDE2'), (GOLD, '#C99A2E'), (BOLE, '#6E2A17'))):
    x = i * 168
    t.append(f'<rect x="{x}" y="730" width="56" height="56" fill="{c}" stroke="{BONE}" stroke-width="{1.5 if c == INK else 0}"/>')
    t.append(f'<text x="{x + 70}" y="765" font-family="Jost" font-weight="500" font-size="19" letter-spacing="1.5" fill="#9E968A">{name}</text>')
t.append(f'<text x="0" y="876" font-family="Jost" font-weight="600" font-size="24" letter-spacing="7" fill="{GOLD}">KLIMT · MOSER · HOFFMANN · OLBRICH</text>')
render('title', TW, TH, ''.join(t), dpr=2)

# —— 64 格面料的纹样方块（每块 880，出 440 像素）——————————————————————————
def tile(kind, rng):
    dark = kind in ('tree', 'goldsq', 'stripes')
    bg, fg = (INK, PAPER) if dark else (PAPER, INK)
    s = [f'<rect width="{PS}" height="{PS}" fill="{bg}"/>', f'<rect width="{PS}" height="{PS}" filter="url(#paper)" opacity="{.4 if dark else 1}"/>']
    s.append(f'<rect x="30" y="30" width="{PS - 60}" height="{PS - 60}" fill="none" stroke="{GOLD if dark else INK}" stroke-width="6"/>')
    c = PS / 2
    if kind == 'checker':
        s.append(checker(120, 120, 8, 8, 80, INK, PAPER))
        s.append(gilded(f'<rect x="{c - 80}" y="{c - 80}" width="160" height="160"/>', c - 80, c - 80, 160, 160, 2, rng, 'tk1'))
    elif kind == 'rings':
        for k, r in enumerate((330, 250, 170, 90)):
            s.append(f'<rect x="{c - r}" y="{c - r}" width="{2 * r}" height="{2 * r}" fill="{(INK, PAPER, INK, PAPER)[k]}"/>')
        s.append(gilded(f'<circle cx="{c}" cy="{c}" r="58"/>', c - 58, c - 58, 116, 116, 3, rng, 'tk2'))
    elif kind == 'dots':
        for i in range(4):
            for j in range(4):
                x, y = 150 + i * 160, 150 + j * 160
                if (i in (1, 2)) and (j in (1, 2)):
                    s.append(gilded(f'<rect x="{x + 10}" y="{y + 10}" width="100" height="100"/>', x + 10, y + 10, 100, 100, 2, rng, f'tk3{i}{j}'))
                else:
                    s.append(f'<circle cx="{x + 60}" cy="{y + 60}" r="46" fill="none" stroke="{INK}" stroke-width="16"/>')
    elif kind == 'tree':
        s.append(f'<rect x="150" y="700" width="580" height="12" fill="url(#ggrad)"/>')
        s.append(f'<rect x="{c - 12}" y="340" width="24" height="360" fill="url(#ggrad)"/>')
        s.append(gilded(f'<circle cx="{c}" cy="340" r="190"/>', c - 190, 150, 380, 380, 6, rng, 'tk4'))
    elif kind == 'quad':
        for k, (x, y) in enumerate(((120, 120), (440, 120), (120, 440), (440, 440))):
            s.append(f'<rect x="{x}" y="{y}" width="320" height="320" fill="{(INK, PAPER, PAPER, INK)[k]}" stroke="{INK}" stroke-width="6"/>')
            s.append(motif(('golddot', 'ring', 'dot', 'golddot')[k], x + 40, y + 40, 240, fill=(PAPER, INK, INK, PAPER)[k], gold='url(#ggrad)'))
    elif kind == 'stripes':
        for i in range(7):
            s.append(f'<rect x="{150 + i * 90}" y="150" width="45" height="580" fill="{GOLD if i == 3 else PAPER}"/>')
    elif kind == 'goldsq':
        s.append(gilded(f'<rect x="150" y="150" width="580" height="580"/>', 150, 150, 580, 580, 4, rng, 'tk5'))
        s.append(f'<rect x="{c - 90}" y="{c - 90}" width="180" height="180" fill="{INK}"/>')
    return ''.join(s)


KINDS = ['checker', 'rings', 'dots', 'tree', 'quad', 'stripes', 'goldsq']
for k in KINDS:
    render(f'tile_{k}', PS, PS, tile(k, random.Random(hash(k) % 97)), dpr=.5, transparent=False)

# —— 海报（方形，1000）：第二十四届展览 ——————————————————————————————————
P = 1000
po = [f'<rect width="{P}" height="{P}" fill="{PAPER}"/>', f'<rect width="{P}" height="{P}" filter="url(#paper)"/>',
      checker_band(20, 20, P - 40, 18), checker_band(20, P - 56, P - 40, 18),
      f'<rect x="72" y="92" width="{P - 144}" height="{P - 184}" fill="none" stroke="{INK}" stroke-width="4"/>']
po.append(word('XXIV', 112, 132, 22, fill=INK, dot=GOLD))
po.append(f'<text x="{P - 112}" y="168" text-anchor="end" font-family="Jost" font-weight="600" font-size="30" letter-spacing="8" fill="{INK}">AUSSTELLUNG</text>')
po.append(f'<text x="{P - 112}" y="214" text-anchor="end" font-family="Jost" font-weight="500" font-size="24" letter-spacing="6" fill="{GOLD_LO}">14.03 — 29.06</text>')
po.append(f'<rect x="112" y="330" width="{P - 224}" height="{P - 520}" fill="{INK}"/>')
bx, by, bw, bh = 112, 330, P - 224, P - 520
po.append(f'<rect x="{bx + 40}" y="{by + bh - 60}" width="{bw - 80}" height="8" fill="url(#ggrad)"/>')
po.append(f'<rect x="{P / 2 - 9}" y="{by + 190}" width="18" height="{bh - 250}" fill="url(#ggrad)"/>')
for side in (-1, 1):
    for (dx, rr, hh) in ((250, 34, 170), (330, 24, 110)):
        tx = P / 2 + side * dx
        po.append(f'<rect x="{tx - 4}" y="{by + bh - 60 - hh}" width="8" height="{hh}" fill="url(#ggrad)"/>')
        po.append(f'<circle cx="{tx}" cy="{by + bh - 60 - hh - rr + 4}" r="{rr}" fill="url(#ggrad)" filter="url(#gleaf)"/>')
po.append(gilded(f'<circle cx="{P / 2}" cy="{by + 190}" r="150"/>', P / 2 - 150, by + 40, 300, 300, 6, random.Random(3), 'pc'))
po.append(word('QUADRAT', 112, P - 158, 8, fill=INK, dot=GOLD))
po.append(f'<text x="{P - 112}" y="{P - 108}" text-anchor="end" font-family="Jost" font-weight="500" font-size="22" letter-spacing="5" fill="{INK}">WIEN</text>')
render('poster', P, P, ''.join(po), dpr=1.2, transparent=False)

# —— 三本方形杂志封面（各 600）—————————————————————————————————————————
C = 600
covers = []
for n, (bg, fg) in enumerate(((PAPER, INK), (INK, PAPER), (BONE, INK))):
    rng = random.Random(40 + n)
    c = [f'<rect width="{C}" height="{C}" fill="{bg}"/>', f'<rect width="{C}" height="{C}" filter="url(#paper)" opacity=".7"/>',
         f'<rect x="28" y="28" width="{C - 56}" height="{C - 56}" fill="none" stroke="{GOLD if bg == INK else INK}" stroke-width="4"/>']
    c.append(word('HEFT', 60, 60, 7, fill=fg, dot=GOLD))
    c.append(word(('I', 'II', 'III')[n], C - 60 - text_width(('I', 'II', 'III')[n], 7), 60, 7, fill=fg, dot=GOLD))
    if n == 0:
        c.append(gilded(f'<circle cx="{C / 2}" cy="{C / 2 + 20}" r="150"/>', C / 2 - 150, C / 2 - 130, 300, 300, 6, rng, f'cv{n}'))
    elif n == 1:
        c.append(checker(C / 2 - 160, C / 2 - 140, 8, 8, 40, PAPER, INK))
        c.append(gilded(f'<rect x="{C / 2 - 40}" y="{C / 2 - 20}" width="80" height="80"/>', C / 2 - 40, C / 2 - 20, 80, 80, 2, rng, f'cv{n}'))
    else:
        for k, r in enumerate((170, 120, 70)):
            c.append(f'<rect x="{C / 2 - r}" y="{C / 2 + 20 - r}" width="{2 * r}" height="{2 * r}" fill="{(INK, BONE, INK)[k]}"/>')
        c.append(gilded(f'<rect x="{C / 2 - 34}" y="{C / 2 - 14}" width="68" height="68"/>', C / 2 - 34, C / 2 - 14, 68, 68, 2, rng, f'cv{n}'))
    c.append(f'<text x="60" y="{C - 60}" font-family="Jost" font-weight="600" font-size="20" letter-spacing="6" fill="{fg}">QUADRAT · 2027</text>')
    render(f'cover{n}', C, C, ''.join(c), dpr=1, transparent=False)

# —— 网页与门票：直接从风格图按 2 倍截，再裁 ————————————————————————————————
subprocess.run([sys.executable, 'ui.py'], cwd=HERE.parent, check=True, env={**os.environ, 'FONTS': '../../public/fonts'})
subprocess.run(['node', SHOT, str(HERE.parent / 'ui.html'), str(OUT / '_ui2x.png'), '1920', '1080', '2'], check=True)
(HERE.parent / 'ui.html').unlink()
from PIL import Image, ImageDraw  # noqa: E402
im = Image.open(OUT / '_ui2x.png').convert('RGBA')
im.crop((48 * 2, 62 * 2, (48 + 1300) * 2, (62 + 956) * 2)).save(OUT / 'web.png')
ph = im.crop((1452 * 2, 70 * 2, (1452 + 400) * 2, (70 + 930) * 2))
mask = Image.new('L', ph.size, 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, ph.size[0] - 1, ph.size[1] - 1), radius=104, fill=255)
ph.putalpha(mask)
ph.save(OUT / 'phone.png')
(OUT / '_ui2x.png').unlink()

# —— 给页面用的几何 ——————————————————————————————————————————————————
geom = dict(PS=PS, CX=CX, CROWN_Y=CROWN_Y, R=R, N=7, BS=BS, BX=BXp, BY=BYp, BASE=BASE, TW=TW, TH=TH, KINDS=KINDS,
            web=dict(w=1300, h=956, btn=[64, 0, 246, 56]), phone=dict(w=400, h=930))
# 网页里“BOOK A SLOT”按钮的位置（相对网页窗口左上角）：与 ui.py 的排版一致
U = 11
HY = 236
TY = HY + 34 + 14 * U + 24 + 62
geom['web']['btn'] = [64, TY + 128, 246, 56]
(HERE / 'geom.js').write_text('const GEOM = ' + json.dumps(geom) + ';\n')
print('assets ok')
