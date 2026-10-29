"""中世纪现代 · 落到网页和手机 App（1920×1080）。python3 ui.py && node ../_lib/shot.cjs ui.html png/ui.png"""
import math
import random

from common import DEFS, INK, MUST, PAPER, TANG, TEAL, texture
from cut import Font, bar, circle, cut_word, ellipse, move, path_d, rect, rot, rough

jost = Font('Jost.ttf', axes={'wght': 800})


def piece(polys, fill, lifted=False):
    return f'<path d="{path_d(polys)}" fill="{fill}" filter="url(#{"lift" if lifted else "flat"})"/>'


def starburst(cx, cy, r, n, w, seed):
    out = []
    for i in range(n):
        a = i / n * math.tau
        L = r * (1 if i % 2 == 0 else 0.62)
        out.append(rough([bar(cx, cy, cx + math.cos(a) * L, cy + math.sin(a) * L, w, w * 0.5)], seed + i, lo=8, hi=16))
    return out


def art(w, h, v, seed=1):
    """剪纸封面：同一套零件（圆、纸条、星芒、腰果形）换几种拼法。"""
    s = w / 300
    e = []
    if v == 0:
        e.append(f'<rect width="{w}" height="{h}" fill="{TEAL}"/>')
        e.append(piece(rough([circle(190 * s, 120 * s, 78 * s)], seed), PAPER))
        for p in starburst(105 * s, 190 * s, 70 * s, 16, 7 * s, seed + 10):
            e.append(piece(p, INK))
        e.append(piece(rough([circle(105 * s, 190 * s, 16 * s)], seed + 3, lo=6, hi=10), MUST))
        e.append(piece(rough([bar(-10, 260 * s, 320 * s, 230 * s, 26 * s, 20 * s)], seed + 4), INK))
    elif v == 1:
        e.append(f'<rect width="{w}" height="{h}" fill="{MUST}"/>')
        e.append(piece(rough([circle(150 * s, 150 * s, 96 * s)], seed), TANG))
        for k, (a, L) in enumerate([(-60, 210), (-20, 180), (25, 200)]):
            x1, y1 = 40 * s + math.cos(math.radians(a)) * L * s, 270 * s + math.sin(math.radians(a)) * L * s
            e.append(piece(rough([bar(40 * s, 270 * s, x1, y1, 30 * s, 22 * s)], seed + k), INK))
        e.append(piece(rough([ellipse(200 * s, 120 * s, 40 * s, 22 * s)], seed + 7, lo=6, hi=12), PAPER))
        e.append(piece(rough([circle(208 * s, 120 * s, 12 * s)], seed + 8, lo=5, hi=9), INK))
    elif v == 2:
        e.append(f'<rect width="{w}" height="{h}" fill="{INK}"/>')
        for k, c in enumerate([TANG, MUST, TEAL, PAPER]):
            e.append(piece(rough([rot([rect(30 * s + k * 62 * s, 60 * s + (k % 2) * 30 * s, 50 * s, 170 * s)], (k - 1.5) * 4, 150 * s, 150 * s)[0]], seed + k), c))
        e.append(piece(rough([circle(225 * s, 250 * s, 34 * s)], seed + 9), TANG))
    else:
        e.append(f'<rect width="{w}" height="{h}" fill="{PAPER}"/>')
        e.append(piece(rough([[(40 * s, 250 * s), (150 * s, 60 * s), (260 * s, 250 * s)]], seed), TEAL))
        e.append(piece(rough([circle(150 * s, 200 * s, 44 * s)], seed + 1), TANG))
        e.append(piece(rough([bar(20 * s, 262 * s, 280 * s, 258 * s, 14 * s, 14 * s)], seed + 2), INK))
        e.append(piece(rough([circle(230 * s, 80 * s, 24 * s)], seed + 3), MUST))
    return ''.join(e)


def svg(w, h, body, style=''):
    return f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" style="position:absolute;{style}">{DEFS}{body}</svg>'


def word(text, size, fill, seed, tilt=2.2, font=jost, tracking=0.0):
    out = []
    for polys, _ in cut_word(font, text, size, 0, size, seed=seed, tilt=tilt, bounce=0.02, tracking=tracking):
        out.append(piece(polys, fill))
    return ''.join(out)


# ---------- 网页 ----------
BW, BH = 1250, 950
hero_art = art(470, 470, 0, seed=5)
shows = [('Blue Atomic', 'The Rand Quartet', 'Mon–Fri · 9 PM', 1), ('Night Owls', 'Girard Trio', 'Sat · 11 PM', 2), ('Desert Bop', 'Case Study Five', 'Sun · 7 PM', 3)]
show_html = ''.join(
    f'<div class="show"><div class="thumb">{svg(140, 140, art(140, 140, v, seed=20 + v))}</div>'
    f'<div><div class="st">{t}</div><div class="sa">{a}</div><div class="sm">{m}</div></div></div>' for t, a, m, v in shows)
web = f'''
<div class="win" style="left:50px;top:65px;width:{BW}px;height:{BH}px">
  <div class="chrome"><i></i><i></i><i></i><span>hifihour.fm</span></div>
  <div class="page">
    <div class="nav"><div class="logo">{svg(230, 60, word('HI-FI HOUR', 40, INK, 3, tilt=3), 'top:4px')}</div><span>Schedule</span><span>Shows</span><span>Archive</span><em>Listen live</em></div>
    <div class="hero">
      <div class="left">
        <div class="kick">● ON AIR · 88.1 FM</div>
        <div style="position:relative;height:270px">{svg(640, 270, '<g transform="translate(0,0)">' + word('COOL JAZZ,', 100, INK, 7) + '</g><g transform="translate(0,124)">' + word('ALL NIGHT.', 100, TANG, 8) + '</g>')}</div>
        <p>Records from 1945–1965, played start to finish.<br>No ads, no algorithm — just a host and a turntable.</p>
        <div class="btns">{svg(250, 82, piece(rough([rect(6, 6, 236, 68)], 41, lo=12, hi=26), INK), '')}<b class="lbl">▶&nbsp; Listen live</b><span class="ghost">This week's records →</span></div>
      </div>
      <div class="art">{svg(470, 470, hero_art)}</div>
    </div>
    <div class="shows">{show_html}</div>
  </div>
</div>'''

# ---------- 手机 ----------
PW, PH = 470, 960
bars = []
rng = random.Random(4)
for i in range(30):
    hgt = 12 + abs(math.sin(i * 0.7)) * 36 + rng.uniform(0, 10)
    bars.append(piece(rough([rect(4 + i * 13.2, 60 - hgt, 8, hgt)], 300 + i, lo=6, hi=12, jitter=0.8), INK if i < 17 else '#1B171455'))
play = piece(rough([circle(60, 60, 54)], 77, lo=8, hi=16), TANG) + piece(rough([[(46, 36), (86, 60), (46, 84)]], 78, lo=8, hi=14), PAPER)
phone = f'''
<div class="phone" style="left:1390px;top:50px;width:{PW}px;height:{PH}px">
  <div class="screen">
    <div class="status"><span>9:41</span><span>●●● 100%</span></div>
    <div class="ptop"><span>⌄</span><b>NOW PLAYING</b><span>···</span></div>
    <div class="cover">{svg(400, 400, art(400, 400, 1, seed=31))}</div>
    <div class="ttl">{svg(420, 70, word('BLUE ATOMIC', 54, INK, 12), '')}</div>
    <div class="art2">The Rand Quartet · Side A, track 3</div>
    <div style="position:relative;height:66px;margin:6px 25px 0">{svg(420, 66, ''.join(bars))}</div>
    <div class="times"><span>2:41</span><span>4:57</span></div>
    <div class="ctrl"><span>⏮</span><div style="position:relative;width:120px;height:120px;transform:scale(.82)">{svg(120, 120, play)}</div><span>⏭</span></div>
    <div class="next"><div style="position:relative;width:64px;height:64px;flex:none">{svg(64, 64, art(64, 64, 2, seed=50))}</div><div><small>UP NEXT</small><br><b>Night Owls</b> · Girard Trio</div></div>
  </div>
</div>'''

html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Jost;src:url(../../public/fonts/Jost.ttf);font-weight:100 900}}
html,body{{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:Jost,sans-serif;background:{TEAL}}}
.bgt{{position:absolute;inset:0}}
.win{{position:absolute;border-radius:14px;overflow:hidden;background:{PAPER};box-shadow:0 30px 70px rgba(10,30,28,.5)}}
.chrome{{height:44px;background:#E2D3B3;display:flex;align-items:center;gap:8px;padding:0 18px}}
.chrome i{{width:13px;height:13px;border-radius:50%;background:#C3B08C}}
.chrome span{{margin-left:20px;background:{PAPER};border-radius:8px;padding:5px 16px;font-size:14px;color:#6b5f4a;width:420px}}
.page{{position:relative}}
.nav{{height:76px;display:flex;align-items:center;gap:36px;padding:0 44px;font-size:18px;font-weight:500;color:{INK}}}
.logo{{position:relative;width:240px;height:64px;margin-right:auto}}
.nav em{{font-style:normal;font-weight:600;color:{PAPER};background:{INK};padding:10px 22px;border-radius:4px}}
.hero{{display:flex;padding:20px 44px 0;gap:40px}}
.left{{flex:1}}
.kick{{font-weight:600;font-size:17px;letter-spacing:.18em;color:{TEAL};margin:18px 0 10px}}
.left p{{font-size:21px;line-height:1.55;color:#4a4036;margin:8px 0 26px}}
.btns{{position:relative;height:82px;display:flex;align-items:center}}
.btns svg{{left:0;top:0}}
.lbl{{position:relative;left:44px;color:{PAPER};font-weight:600;font-size:21px;width:206px}}
.ghost{{margin-left:46px;font-weight:600;font-size:19px;color:{INK};border-bottom:3px solid {TANG}}}
.art{{position:relative;width:470px;height:470px;flex:none;box-shadow:6px 8px 0 #1B171422}}
.shows{{display:flex;gap:26px;padding:50px 44px 0}}
.show{{flex:1;display:flex;gap:18px;align-items:center;border-top:3px solid {INK};padding-top:20px}}
.thumb{{position:relative;width:140px;height:140px;flex:none}}
.st{{font-weight:800;font-size:23px;color:{INK}}}
.sa{{font-size:17px;color:#4a4036;margin-top:2px}}
.sm{{font-size:15px;font-weight:600;letter-spacing:.06em;color:{TANG};margin-top:8px}}
.phone{{position:absolute;border-radius:62px;background:#141210;padding:14px;box-sizing:border-box;box-shadow:0 30px 70px rgba(10,30,28,.55)}}
.screen{{position:relative;width:100%;height:100%;border-radius:50px;overflow:hidden;background:{PAPER}}}
.status{{display:flex;justify-content:space-between;padding:16px 40px 0;font-weight:600;font-size:16px;color:{INK}}}
.ptop{{display:flex;justify-content:space-between;align-items:center;padding:18px 30px 14px;color:{INK};font-size:22px}}
.ptop b{{font-size:14px;letter-spacing:.22em;font-weight:600}}
.cover{{position:relative;width:400px;height:400px;margin:0 auto;box-shadow:5px 7px 0 #1B171426}}
.ttl{{position:relative;height:70px;margin:22px 0 0 26px}}
.art2{{font-size:18px;color:#4a4036;margin:0 26px}}
.times{{display:flex;justify-content:space-between;margin:4px 28px 0;font-size:14px;font-weight:600;color:#6b5f4a}}
.next{{position:absolute;left:22px;right:22px;bottom:26px;display:flex;gap:16px;align-items:center;border-top:3px solid {INK};padding-top:16px;font-size:18px;color:{INK}}}
.next small{{font-size:13px;letter-spacing:.2em;font-weight:600;color:{TANG}}}
.ctrl{{display:flex;justify-content:center;align-items:center;gap:56px;margin-top:-6px;font-size:30px;color:{INK}}}
</style>
<svg class="bgt" width="1920" height="1080">{DEFS}{texture(1920, 1080)}</svg>
{web}{phone}'''
open('ui.html', 'w').write(html)
