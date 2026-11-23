"""维也纳分离派 · 用起来（1920×1080）：一家展览馆的网站 + 手机上的门票。
网页的版式全部落在 8 列方格上：图都是正方形、按钮是直角、分隔线是两行棋盘格；
金只用在一个地方——一屏里最想让人看的那一块。
python3 ui.py && node ../_lib/shot.cjs ui.html png/ui.png"""
import random
from secession import *

W, H = 1920, 1080
rng = random.Random(11)
s = []
s.append(f'<rect width="{W}" height="{H}" fill="#D9D0BD"/>')
s.append(f'<rect width="{W}" height="{H}" filter="url(#paper)"/>')


def label(x, y, txt, size=17, col=INK, ls=4, weight=500, anchor='start', font='Jost'):
    return (f'<text x="{x}" y="{y}" font-family="{font}" font-weight="{weight}" font-size="{size}" letter-spacing="{ls}" '
            f'fill="{col}" text-anchor="{anchor}">{txt}</text>')


def square_art(x, y, S, uid, variant=0):
    """一张正方形的“作品图”：黑底、细金框、几棵圆冠树或者一块纹样。"""
    out = [f'<rect x="{x}" y="{y}" width="{S}" height="{S}" fill="{INK}"/>',
           f'<rect x="{x + S * .04:.1f}" y="{y + S * .04:.1f}" width="{S * .92:.1f}" height="{S * .92:.1f}" fill="none" stroke="{GOLD}" stroke-width="1.5" opacity=".7"/>']
    if variant == 0:      # 一排树
        base = y + S * .84
        out.append(f'<rect x="{x + S * .1:.1f}" y="{base:.1f}" width="{S * .8:.1f}" height="{S * .012:.1f}" fill="url(#ggrad)"/>')
        R = S * .2
        cx, cy = x + S / 2, y + S * .38
        out.append(f'<rect x="{cx - S * .012:.1f}" y="{cy:.1f}" width="{S * .024:.1f}" height="{base - cy:.1f}" fill="url(#ggrad)"/>')
        for side in (-1, 1):
            for dx, rr, hh in ((.3, .055, .3), (.4, .04, .2)):
                tx = cx + side * S * dx
                out.append(f'<rect x="{tx - S * .007:.1f}" y="{base - S * hh:.1f}" width="{S * .014:.1f}" height="{S * hh:.1f}" fill="url(#ggrad)"/>')
                out.append(f'<circle cx="{tx:.1f}" cy="{base - S * hh - S * rr + 2:.1f}" r="{S * rr:.1f}" fill="url(#ggrad)" filter="url(#gleaf)"/>')
        out.append(gilded(f'<circle cx="{cx}" cy="{cy}" r="{R}"/>', cx - R, cy - R, 2 * R, 2 * R, 6, rng, uid))
    elif variant == 1:    # 方格四分
        g = S * .72 / 4
        x0, y0 = x + S * .14, y + S * .14
        kinds = ['gold', 'check4', 'ring', 'solid', 'dot', 'gold', 'check2', 'ring', 'ring', 'check2', 'gold', 'dot', 'solid', 'ring', 'check4', 'gold']
        out.append(f'<rect x="{x0}" y="{y0}" width="{g * 4}" height="{g * 4}" fill="{PAPER}"/>')
        for k, kind in enumerate(kinds):
            i, j = k % 4, k // 4
            out.append(motif(kind, x0 + i * g + 4, y0 + j * g + 4, g - 8, gold='url(#ggrad)'))
    elif variant == 2:    # 一个圆在一个方里，套三层
        cx, cy = x + S / 2, y + S / 2
        for k, rr in enumerate((.36, .26, .16)):
            out.append(f'<rect x="{cx - S * rr:.1f}" y="{cy - S * rr:.1f}" width="{S * rr * 2:.1f}" height="{S * rr * 2:.1f}" fill="{(PAPER, INK, PAPER)[k]}"/>')
        out.append(gilded(f'<circle cx="{cx}" cy="{cy}" r="{S * .12}"/>', cx - S * .12, cy - S * .12, S * .24, S * .24, 4, rng, uid))
    elif variant == 3:    # 三根竖线，高低不同，站在一条线上
        base = y + S * .8
        out.append(f'<rect x="{x + S * .16:.1f}" y="{base:.1f}" width="{S * .68:.1f}" height="{S * .03:.1f}" fill="url(#ggrad)"/>')
        for k, (dx, hh) in enumerate(((.3, .4), (.5, .58), (.7, .32))):
            out.append(f'<rect x="{x + S * dx - S * .035:.1f}" y="{base - S * hh:.1f}" width="{S * .07:.1f}" height="{S * hh:.1f}" fill="{(PAPER, GOLD, PAPER)[k]}"/>')
            out.append(f'<rect x="{x + S * dx - S * .06:.1f}" y="{base - S * hh - S * .12:.1f}" width="{S * .12:.1f}" height="{S * .12:.1f}" fill="url(#ggrad)"/>')
    return ''.join(out)


# —— 网页：浏览器窗口 —————————————————————————————————————————————
BX, BY, BW, BH = 48, 62, 1300, 956
s.append(f'<g filter="url(#sh)"><rect x="{BX}" y="{BY}" width="{BW}" height="{BH}" fill="{PAPER}"/></g>')
s.append(f'<rect x="{BX}" y="{BY}" width="{BW}" height="54" fill="{INK}"/>')
for i, c in enumerate((GOLD, '#8C8576', '#8C8576')):
    s.append(f'<rect x="{BX + 22 + i * 24}" y="{BY + 21}" width="12" height="12" fill="{c}"/>')
s.append(f'<rect x="{BX + 110}" y="{BY + 13}" width="380" height="28" fill="#2A2724"/>')
s.append(label(BX + 126, BY + 33, 'haus-quadrat.at', 16, BONE, 1.5, 400))

X0 = BX + 64                     # 版心左边；8 列，沟 16
CW = BW - 128
COL = (CW + 16) / 8
# 头部：方格字的字标 + 导航 + 直角按钮
s.append(word('QUADRAT', X0, BY + 96, 5.2, fill=INK, dot=GOLD))
for i, t in enumerate(('AUSSTELLUNGEN', 'KALENDER', 'SHOP', 'BESUCH')):
    s.append(label(X0 + 2 * COL + (0, 210, 370, 488)[i], BY + 126, t, 16, INK, 3.2))
s.append(f'<rect x="{X0 + CW - 150}" y="{BY + 94}" width="150" height="46" fill="{INK}"/>')
s.append(label(X0 + CW - 75, BY + 124, 'TICKETS', 16, PAPER, 4, 600, 'middle'))
s.append(checker_band(X0, BY + 168, CW, 8))

# 首屏：左 4 列标题与正文，右 4 列一张正方形的作品
HY = BY + 236
U = 11
s.append(label(X0, HY, 'XXIV. AUSSTELLUNG  ·  14.03 — 29.06', 16, GOLD_LO, 4, 600))
s.append(word('THE GOLDEN', X0, HY + 34, U, fill=INK, dot=GOLD))
s.append(word('GRID', X0, HY + 34 + 7 * U + 24, U, fill=INK, dot=GOLD))
s.append(f'<rect x="{X0 + text_width("GRID", U) + 22}" y="{HY + 34 + 7 * U + 24 + 6 * U}" width="{U}" height="{U}" fill="{GOLD}"/>')
TY = HY + 34 + 14 * U + 24 + 62
for k, line in enumerate(('Forty rooms, one module. A season on the square', 'as ornament — from the Wiener Werkstätte grid', 'to the interfaces we design today.')):
    s.append(f'<text x="{X0}" y="{TY + k * 34}" font-family="Jost" font-weight="400" font-size="22" fill="#3B3732">{line}</text>')
BYb = TY + 128
s.append(f'<rect x="{X0}" y="{BYb}" width="246" height="56" fill="{INK}"/>')
s.append(label(X0 + 123, BYb + 35, 'BOOK A SLOT  →', 17, PAPER, 3.5, 600, 'middle'))
s.append(f'<rect x="{X0 + 266}" y="{BYb + 1.5}" width="190" height="53" fill="none" stroke="{INK}" stroke-width="3"/>')
s.append(label(X0 + 361, BYb + 35, 'PROGRAMME', 17, INK, 3.5, 600, 'middle'))

AS = 452
AX = X0 + CW - AS
AY = BY + 214
s.append(square_art(AX, AY, AS, 'art0', 0))
s.append(label(AX, AY + AS + 32, 'ROOM 01  ·  DER GOLDENE BAUM', 14, INK, 3))
s.append(label(AX + AS, AY + AS + 32, '1 : 1', 14, '#7C756A', 2, 500, 'end'))

# 底排：三个展厅（各 2 列：正方形缩略图 + 字），最后 2 列是黑色的开放时间，金只用在这一块
CY0 = BY + 760
s.append(checker_band(X0, CY0 - 40, CW, 8))
rooms = (('02', 'DAS QUADRAT', 1), ('03', 'KREIS IM KASTEN', 2), ('04', 'DIE LINIE', 3))
for k, (room, title, var) in enumerate(rooms):
    x = X0 + k * 2 * COL
    sz = 132
    s.append(square_art(x, CY0, sz, f'th{k}', var))
    s.append(label(x + sz + 18, CY0 + 34, f'ROOM {room}', 13, GOLD_LO, 3, 600))
    for li, part in enumerate(title.split(' ', 1) if len(title) > 12 else [title]):
        s.append(label(x + sz + 18, CY0 + 66 + li * 24, part, 16, INK, 1.5, 600))
    s.append(label(x + sz + 18, CY0 + 124, '→', 20, INK, 0, 500))
HX = X0 + 6 * COL
HW = 2 * COL - 16
s.append(f'<rect x="{HX}" y="{CY0}" width="{HW}" height="132" fill="{INK}"/>')
s.append(label(HX + 22, CY0 + 34, 'HEUTE GEÖFFNET', 12, BONE, 3.5, 500))
s.append(word('10-18', HX + 22, CY0 + 54, 7, fill=GOLD, dot=PAPER))

# —— 手机：门票 ————————————————————————————————————————————————
PX, PY, PW, PH = 1452, 70, 400, 930
s.append(f'<g filter="url(#sh)"><rect x="{PX}" y="{PY}" width="{PW}" height="{PH}" rx="52" fill="{INK}"/></g>')
s.append(f'<rect x="{PX + 14}" y="{PY + 14}" width="{PW - 28}" height="{PH - 28}" rx="40" fill="{PAPER}"/>')
s.append(f'<rect x="{PX + 14}" y="{PY + 14}" width="{PW - 28}" height="{PH - 28}" rx="40" filter="url(#paper)"/>')
QX = PX + 40
s.append(label(QX, PY + 66, '10:24', 18, INK, 0, 600))
s.append(label(PX + PW - 40, PY + 66, '100%', 16, INK, 0, 600, 'end'))
s.append(word('QUADRAT', QX, PY + 98, 3.6, fill=INK, dot=GOLD))
s.append(label(QX, PY + 158, 'IHR TICKET', 14, '#7C756A', 4, 500))
# 门票：黑卡、棋盘格的撕口、金方章
TX, TY2, TW, TH = QX, PY + 176, PW - 80, 400
s.append(f'<rect x="{TX}" y="{TY2}" width="{TW}" height="{TH}" fill="{INK}"/>')
s.append(word('XXIV', TX + 24, TY2 + 30, 8.5, fill=PAPER, dot=GOLD))
s.append(label(TX + 24, TY2 + 136, 'THE GOLDEN GRID', 15, BONE, 3, 500))
s.append(gilded(f'<rect x="{TX + TW - 104}" y="{TY2 + 24}" width="80" height="80"/>', TX + TW - 104, TY2 + 24, 80, 80, 4, rng, 'seal'))
s.append(tree(TX + TW - 64, TY2 + 36, 17, 42, INK, INK, 4.5))
s.append(checker(TX, TY2 + 166, int(TW / 10), 2, 10, PAPER, INK))
rows = (('DATUM', 'FR 14.03'), ('ZEIT', '14:30'), ('RAUM', '01 — 40'), ('NR.', '000316'))
for k, (a, b) in enumerate(rows):
    x = TX + 24 + (k % 2) * 160
    y = TY2 + 222 + (k // 2) * 78
    s.append(label(x, y, a, 12, '#9E968A', 3, 500))
    s.append(label(x, y + 32, b, 23, PAPER, 1, 500))
s.append(f'<rect x="{TX + 24}" y="{TY2 + TH - 46}" width="{TW - 48}" height="2" fill="{GOLD}" opacity=".7"/>')
s.append(label(TX + 24, TY2 + TH - 18, 'ADMIT ONE', 13, GOLD, 5, 600))
# 今天的导览：方块当列表符号
s.append(label(QX, PY + 622, 'HEUTE', 14, '#7C756A', 4, 500))
for k, (t, name, kind) in enumerate((('11:00', 'Führung · Das Quadrat', 'solid'), ('14:30', 'Werkstatt · Blattgold', 'gold'), ('17:00', 'Vortrag · Linie &amp; Fläche', 'ring'))):
    y = PY + 642 + k * 66
    s.append(f'<rect x="{QX}" y="{y}" width="{PW - 80}" height="54" fill="{PAPER}" stroke="{INK}" stroke-width="2"/>')
    s.append(motif(kind, QX + 12, y + 12, 30, gold='url(#ggrad)'))
    s.append(label(QX + 58, y + 34, t, 17, INK, 1, 600))
    s.append(label(QX + 124, y + 34, name, 16, '#3B3732', 0, 400))
# 底部标签栏：四个方块图标
ty = PY + PH - 82
s.append(f'<rect x="{PX + 14}" y="{ty - 18}" width="{PW - 28}" height="2" fill="{INK}"/>')
for k, kind in enumerate(('solid', 'ring', 'check2', 'frame')):
    s.append(motif(kind, PX + 58 + k * 82, ty, 32, fill=INK if k else GOLD))

svg = (f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="position:absolute;left:0;top:0"><defs>{DEFS}{gold_defs()}</defs>'
       f'{"".join(s)}<rect width="{W}" height="{H}" filter="url(#grain)" style="mix-blend-mode:multiply"/></svg>')
open('ui.html', 'w').write(page(W, H, svg))
