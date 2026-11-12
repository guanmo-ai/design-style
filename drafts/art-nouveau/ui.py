"""新艺术运动 · 落到网页和手机 App（1920×1080）。python3 ui.py && node ../_lib/shot.cjs ui.html png/ui.png
网页：拱形的图框、藤蔓分隔线、金线描边；手机：养花 App，浇水进度是一根沿着圆弧长出来的藤。"""
import math
from vine import *


def svg(w, h, body, extra=''):
    return f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" {extra}>{body}</svg>'


def scroll_divider(w, y=0, col=OLIVE):
    """一根横向分隔线：中间一个金点，两头各甩出一个涡卷（画框自动包住涡卷）。"""
    b, ys = [], []
    for sg in (1, -1):
        L = w / 2 - 70
        p = curve(w / 2 + sg * 18, 0, 90 - sg * 90, L, lambda u, sg=sg: -sg * (0 + 40 * u ** 12) / L * 2)
        ys += [q[1] for q in p]
        b.append(f'<path d="{ribbon(p, 7, 2.6, 1, 1.4)}" fill="{col}" stroke="{INK}" stroke-width="1.5"/>')
    b.append(f'<circle cx="{w / 2}" cy="0" r="9" fill="{GOLD}" stroke="{INK}" stroke-width="2"/>')
    y0, y1 = min(ys) - 12, max(ys) + 12
    return f'<svg width="{w}" height="{y1 - y0:.0f}" viewBox="0 {y0:.0f} {w} {y1 - y0:.0f}">{"".join(b)}</svg>'


def arch_path(x, y, w, h):
    return (f'M{x},{y + h} L{x},{y + w * .42} C{x},{y + w * .08} {x + w * .22},{y} {x + w / 2},{y} '
            f'C{x + w * .78},{y} {x + w},{y + w * .08} {x + w},{y + w * .42} L{x + w},{y + h}Z')


def arch_art(w, h, bg, flower_col, seed=0):
    """拱形小画：背景色 + 一根鞭线托一朵花。"""
    b = [f'<path d="{arch_path(4, 4, w - 8, h - 8)}" fill="{bg}" stroke="{INK}" stroke-width="4"/>']
    b.append(f'<clipPath id="ac{seed}"><path d="{arch_path(4, 4, w - 8, h - 8)}"/></clipPath><g clip-path="url(#ac{seed})">')
    for i in range(10):
        b.append(f'<circle cx="{w / 2}" cy="{h * .42}" r="{30 + i * 24}" fill="none" stroke="{INK}" stroke-width="1" opacity=".18"/>')
    sg = 1 if seed % 2 else -1
    p = curve(w / 2 - sg * 40, h, -90 + sg * 12, h * .9, whip(h * .9, -.5, 26, 6, sg))
    b.append(f'<path d="{ribbon(p, 14, 2)}" fill="{OLIVE}" stroke="{INK}" stroke-width="2.5"/>')
    for u, d in ((.18, 1), (.3, -1)):
        x, y, th = p[int(u * (len(p) - 1))]
        b.append(leaf(x, y, math.degrees(th) + d * 55, 70, SAGE, sw=2))
    x, y, th = p[int(.55 * (len(p) - 1))]
    b.append(lily(x, y, math.degrees(th) - sg * 50, 58, flower_col))
    b.append('</g>')
    return svg(w, h, ''.join(b))


cards = [(ROSE, CREAM, 'Iris Pallida', 'Orris root, violet leaf', '€ 148'),
         ('#B9C7A0', ROSE, 'Lys de Nancy', 'White lily, pear, musk', '€ 132'),
         ('#E2C98E', CREAM, 'Fougère 1900', 'Fern, oakmoss, tonka', '€ 120')]
cards_html = ''.join(f'''<div class="card">{arch_art(140, 180, bg, fc, i)}<div><b>{t}</b><span>{d}</span><em>{p}</em></div></div>'''
                     for i, (bg, fc, t, d, p) in enumerate(cards))

hero_art = arch_art(330, 430, '#E2C98E', ROSE, 7)
web = f'''
<div class="win" style="left:50px;top:60px;width:1260px;height:960px">
  <div class="chrome"><i></i><i></i><i></i><span>maisondulys.fr</span></div>
  <div class="page">
    <div class="nav"><span>Parfums</span><span>Atelier</span><b>Maison du Lys</b><span>Journal</span><span class="bag">Panier · 2</span></div>
    <div class="hero">
      <div class="htxt">
        <small>COLLECTION PRINTEMPS · 1900 / 2027</small>
        <h1>Everything<br><i>grows</i> here.</h1>
        <p>Perfumes poured into hand-blown glass, each bottle signed with a single whiplash line — no two curl the same way.</p>
        <div class="btns"><a class="pri">Discover the collection</a><a>Book a fitting</a></div>
      </div>
      <div class="hart">{hero_art}</div>
    </div>
    <div class="div">{scroll_divider(1100)}</div>
    <div class="cards">{cards_html}</div>
  </div>
</div>'''

# 手机：浇水进度是一根沿着圆弧长出来的藤；长到 72%
R, cx, cy = 128, 190, 160
prog = .72
ring_pts = []
n = 200
for i in range(n + 1):
    a = math.radians(135 + 270 * i / n)
    ring_pts.append((cx + math.cos(a) * R, cy + math.sin(a) * R, a + math.pi / 2))
track = 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y, _ in ring_pts)
ring = [f'<path d="{track}" fill="none" stroke="#DCCFAE" stroke-width="10" stroke-linecap="round"/>',
        f'<path d="{ribbon(ring_pts, 18, 5, prog, .4)}" fill="{OLIVE}" stroke="{INK}" stroke-width="2.5"/>']
for k in range(1, 8):
    u = k / 8 * prog
    x, y, th = ring_pts[int(u * n)]
    ring.append(leaf(x, y, math.degrees(th) + (-60 if k % 2 else 60) - 180 * 0, 34, SAGE, sw=1.6))
tx, ty, _ = ring_pts[int(prog * n)]
ring.append(f'<circle cx="{tx:.1f}" cy="{ty:.1f}" r="22" fill="url(#g2)"/><circle cx="{tx:.1f}" cy="{ty:.1f}" r="7" fill="{GOLD}" stroke="{INK}" stroke-width="2"/>')
ring_svg = svg(380, 300, '<defs><radialGradient id="g2"><stop offset="0" stop-color="#FFE7A3"/><stop offset="1" stop-color="#FFE7A3" stop-opacity="0"/></radialGradient></defs>' + ''.join(ring))

plants = [('Iris', 'Water in 2 days', ROSE), ('Fern', 'Mist today', '#B9C7A0'), ('Lily', 'Happy', '#E2C98E')]
plist = ''.join(f'<div class="pl"><div class="pa" style="background:{c}">{arch_art(64, 80, c, CREAM, 20 + i)}</div><div><b>{t}</b><span>{s}</span></div><em>›</em></div>' for i, (t, s, c) in enumerate(plants))
phone = f'''
<div class="phone" style="left:1400px;top:50px;width:460px;height:960px">
  <div class="screen">
    <div class="status"><span>9:41</span><span>100%</span></div>
    <div class="ph"><small>GOOD MORNING</small><h2>Your garden</h2></div>
    <div class="ring">{ring_svg}<div class="rl"><b>72%</b><span>Monstera<br>is growing</span></div></div>
    <div class="div2">{scroll_divider(380)}</div>
    {plist}
    <div class="tab"><span class="on">❦</span><span>✿</span><span>☼</span><span>☾</span></div>
  </div>
</div>'''

html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Cinzel;src:url(../../public/fonts/CinzelDecorative-Bold.ttf)}}
@font-face{{font-family:Corm;src:url(../../public/fonts/Cormorant.ttf);font-weight:300 700}}
html,body{{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:Corm,serif;background:#D8CBAA;color:{INK}}}
.win{{position:absolute;overflow:hidden;background:{CREAM};box-shadow:0 30px 70px #0004;border-radius:14px;border:2px solid {INK}}}
.chrome{{height:42px;background:#E3D7B8;display:flex;align-items:center;gap:8px;padding:0 18px;border-bottom:2px solid {INK}}}
.chrome i{{width:12px;height:12px;border-radius:50%;background:{PLUM}}}.chrome i+i{{background:{GOLD}}}.chrome i+i+i{{background:{SAGE}}}
.chrome span{{margin-left:20px;background:{CREAM};padding:4px 18px;font:600 16px Corm;border-radius:20px;width:380px;border:1px solid #0003}}
.nav{{display:flex;align-items:center;justify-content:center;gap:56px;height:84px;font-weight:600;font-size:21px;letter-spacing:.12em;text-transform:uppercase;
  border-bottom:2px solid {INK};box-shadow:0 5px 0 -3px {GOLD}}}
.nav b{{font:700 32px Cinzel;letter-spacing:.06em;text-transform:none;color:{PLUM};margin:0 20px}}
.bag{{position:absolute;right:40px}}
.hero{{display:flex;gap:40px;padding:30px 80px 0}}
.htxt{{flex:1;padding-top:20px}}
.htxt small{{font-weight:700;letter-spacing:.24em;font-size:16px;color:{PLUM}}}
.htxt h1{{font:600 96px/.98 Corm;margin:16px 0 22px}}.htxt h1 i{{color:{OLIVE}}}
.htxt p{{font-size:25px;line-height:1.4;max-width:560px;margin:0 0 30px;font-weight:500}}
.btns a{{display:inline-block;padding:14px 28px;border:2px solid {INK};border-radius:999px;font-weight:700;font-size:19px;margin-right:12px;letter-spacing:.04em}}
.btns .pri{{background:{OLIVE};color:{CREAM}}}
.hart{{margin-top:-10px}}
.div{{display:flex;justify-content:center;margin:4px 0 2px}}
.cards{{display:flex;gap:26px;padding:0 60px}}
.card{{flex:1;display:flex;gap:18px;align-items:flex-end}}
.card b{{display:block;font:700 24px Cinzel;color:{PLUM}}}.card span{{display:block;font-size:20px;font-weight:600;margin:4px 0 10px}}
.card em{{font-style:normal;font-weight:700;font-size:24px;border-top:2px solid {GOLD};padding-top:6px;display:inline-block}}
.phone{{position:absolute;border-radius:60px;background:{INK};padding:13px;box-sizing:border-box;box-shadow:0 30px 70px #0005}}
.screen{{position:relative;width:100%;height:100%;border-radius:48px;overflow:hidden;background:{CREAM}}}
.status{{display:flex;justify-content:space-between;padding:16px 40px 0;font-weight:700;font-size:17px}}
.ph{{padding:20px 34px 0}}.ph small{{font-weight:700;letter-spacing:.24em;font-size:14px;color:{PLUM}}}
.ph h2{{font:700 44px Cinzel;margin:6px 0 0;color:{OLIVE}}}
.ring{{position:relative;display:flex;justify-content:center;margin-top:6px}}
.rl{{position:absolute;top:96px;text-align:center}}.rl b{{display:block;font:700 66px Corm;line-height:1}}.rl span{{font-size:20px;font-weight:600;line-height:1.1}}
.div2{{display:flex;justify-content:center;margin:-26px 0 8px}}
.pl{{display:flex;align-items:center;gap:16px;margin:0 26px 10px;padding:8px 16px;border:2px solid {INK};border-radius:40px 40px 18px 18px;background:{PAPER}}}
.pa{{width:64px;height:80px;border-radius:32px 32px 6px 6px;overflow:hidden}}
.pl b{{font:700 24px Cinzel;display:block}}.pl span{{font-size:19px;font-weight:600;color:#6b5e45}}.pl em{{margin-left:auto;font-size:32px;font-style:normal}}
.tab{{position:absolute;left:24px;right:24px;bottom:22px;height:74px;border:2px solid {INK};border-radius:40px;display:flex;justify-content:space-around;align-items:center;background:{PAPER};font-size:30px}}
.tab .on{{background:{OLIVE};color:{CREAM};width:58px;height:58px;border-radius:50%;display:flex;align-items:center;justify-content:center}}
</style>{web}{phone}'''
open('ui.html', 'w').write(html)
