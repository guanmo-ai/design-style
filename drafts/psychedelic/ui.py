"""迷幻海报 · 落到网页和手机 App（1920×1080）。python3 ui.py && node ../_lib/shot.cjs ui.html png/ui.png"""
from warp import Font, arch, blob, fill_shape, path_d, pill, wave_band

ORANGE, VIOLET, MAGENTA, LIME, CREAM, INK = '#FF5A1F', '#3B21C9', '#F0207F', '#C9F23B', '#FFF0CF', '#1E0B3A'
bagel = Font('BagelFatOne-Regular.ttf')


def svg(w, h, body, style=''):
    return f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" style="position:absolute;{style}">{body}</svg>'


def rings(cx, cy, r0, step, n, cols, ph=0.0):
    out = []
    for k in range(n, 0, -1):
        b = blob(cx, cy, r0 + k * step, [(3, 0.05 + k * 0.002, ph - k * 0.3), (5, 0.02, ph * 1.7 - k * 0.4)])
        out.append(f'<path d="{path_d([b])}" fill="{cols[k % len(cols)]}"/>')
    return ''.join(out)


# ---------- 网页 ----------
BW, BH = 1250, 950
hero_h = 520
a = arch(70, 56, 400, 420)
hero = (f'<rect width="{BW}" height="{hero_h}" fill="{VIOLET}"/>'
        + rings(270, 300, 220, 34, 30, [ORANGE, VIOLET, MAGENTA, VIOLET])
        + f'<path d="{path_d([arch(56, 42, 428, 448)])}" fill="{INK}"/>'
        + f'<path d="{path_d([a])}" fill="{LIME}"/>'
        + f'<path d="{fill_shape(["MOON", "JUICE", "FEST"], bagel, a, gap=0.08, pad=0.05, weights=[1.05, 1.1, 0.85])}" fill="{MAGENTA}"/>')

cards = []
names = [('VELVET', 'STATIC'), ('LAVA', 'LAMPS'), ('MARMA', 'LADE SKY'), ('KALEIDO', 'KIDS')]
pairs = [(ORANGE, VIOLET), (MAGENTA, LIME), (LIME, VIOLET), (VIOLET, ORANGE)]
for i, (nm, (bg, fg)) in enumerate(zip(names, pairs)):
    x = 40 + i * 295
    s = arch(x, 0, 265, 222)
    cards.append(f'<path d="{path_d([arch(x - 7, -7, 279, 236)])}" fill="{INK}"/><path d="{path_d([s])}" fill="{bg}"/>'
                 f'<path d="{fill_shape(list(nm), bagel, s, gap=0.1, pad=0.08)}" fill="{fg}"/>')
cta = pill(0, 0, 300, 84)
cta_txt = fill_shape(['GET TICKETS'], bagel, pill(10, 8, 280, 68), pad=0.06)

web = f'''
<div class="win" style="left:50px;top:65px;width:{BW}px;height:{BH}px">
  <div class="chrome"><i></i><i></i><i></i><span>moonjuice.fm</span></div>
  <div class="page">
    <div class="nav"><b>MOONJUICE</b><span>Lineup</span><span>Tickets</span><span>Map</span><span>FAQ</span><em>Get tickets</em></div>
    <div style="position:relative;height:{hero_h}px">{svg(BW, hero_h, hero)}
      <div class="card">
        <div class="kick">AUG 14 — 16 · SUNSET MEADOW</div>
        <h1>Three days of loud color,<br>&amp; louder music.</h1>
        <p>42 bands · 3 stages · light shows every night.<br>Camping, food trucks &amp; a giant lava lamp.</p>
        {svg(300, 84, f'<path d="{path_d([cta])}" fill="{MAGENTA}"/><path d="{cta_txt}" fill="{CREAM}"/>', 'left:44px;bottom:40px')}
        <span class="ghost">See the lineup →</span>
      </div>
    </div>
    <div class="row-h"><b>SATURDAY LINEUP</b><span>Main Stage · 4 of 14</span></div>
    <div style="position:relative;height:290px">{svg(BW, 260, ''.join(cards), 'top:8px')}</div>
  </div>
</div>'''

# ---------- 手机 ----------
PW, PH = 470, 960
band = wave_band(0, 22, PW, 150, 10, k=1, ph=0.6)
day = (f'<path d="{path_d([wave_band(0, 14, PW, 166, 10, k=1, ph=0.6)])}" fill="{INK}"/><path d="{path_d([band])}" fill="{ORANGE}"/>'
       f'<path d="{fill_shape(["SATURDAY"], bagel, wave_band(14, 30, PW - 28, 134, 10, k=1, ph=0.6), pad=0.04)}" fill="{CREAM}"/>')
now_b = blob(110, 110, 96, [(3, 0.05, 1.2), (2, 0.03, 0.2)])
now = (f'<path d="{path_d([blob(110, 110, 106, [(3, 0.05, 1.2), (2, 0.03, 0.2)])])}" fill="{INK}"/>'
       f'<path d="{path_d([now_b])}" fill="{LIME}"/><path d="{fill_shape(["THE", "LAVA", "LAMPS"], bagel, now_b, pad=0.07, weights=[0.7, 1, 1])}" fill="{MAGENTA}"/>')
rows = [('3:30', 'Kaleido Kids', 'Meadow', ORANGE), ('5:00', 'Marmalade Sky', 'Main', LIME), ('6:45', 'Velvet Static', 'Main', MAGENTA), ('8:30', 'Orange Sunshine', 'Dome', ORANGE), ('10:15', 'Moon Choir', 'Meadow', LIME)]
row_html = ''.join(f'<div class="srow"><span class="t">{t}</span><span class="n">{n}</span><span class="chip" style="background:{c}">{s}</span></div>' for t, n, s, c in rows)

phone = f'''
<div class="phone" style="left:1390px;top:50px;width:{PW}px;height:{PH}px">
  <div class="screen">
    <div class="status"><span>9:41</span><span>●●● 100%</span></div>
    <div style="position:relative;height:200px">{svg(PW, 200, day)}</div>
    <div class="nowcard">
      <div style="position:relative;width:220px;height:220px;flex:none">{svg(220, 220, now)}</div>
      <div class="nowtxt"><div class="kick" style="color:{MAGENTA}">● ON STAGE NOW</div><div class="big">The Lava Lamps</div><div class="sm">Dome · until 4:45</div>
        <div class="bar"><i></i></div></div>
    </div>
    <div class="list">{row_html}</div>
    <div class="tabs"><span class="on">Lineup</span><span>Map</span><span>Tickets</span><span>Me</span></div>
  </div>
</div>'''

html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Righteous;src:url(../../public/fonts/Righteous-Regular.ttf)}}
@font-face{{font-family:Inter;src:url(../../public/fonts/Inter.ttf);font-weight:100 900}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Medium.otf);font-weight:500}}
html,body{{margin:0;width:1920px;height:1080px;overflow:hidden;background:#2A1550;font-family:Inter,NotoSC,sans-serif}}
body{{background:radial-gradient(circle at 70% 40%,#3a1d6e,#160832)}}
.win{{position:absolute;border-radius:16px;overflow:hidden;background:{CREAM};box-shadow:0 40px 80px rgba(0,0,0,.45)}}
.chrome{{height:44px;background:#EADFC4;display:flex;align-items:center;gap:8px;padding:0 18px}}
.chrome i{{width:13px;height:13px;border-radius:50%;background:#C9B99A}}
.chrome span{{margin-left:20px;background:{CREAM};border-radius:8px;padding:5px 16px;font-size:14px;color:#6b5a7a;width:420px}}
.page{{position:relative}}
.nav{{height:62px;display:flex;align-items:center;gap:34px;padding:0 40px;font-size:17px;color:{INK};font-weight:500}}
.nav b{{font-family:Righteous;font-size:26px;color:{VIOLET};margin-right:auto;letter-spacing:.04em}}
.nav em{{font-style:normal;background:{INK};color:{CREAM};border-radius:30px;padding:10px 22px}}
.card{{position:absolute;right:44px;top:42px;width:620px;height:436px;background:{CREAM};border:7px solid {INK};border-radius:28px;box-sizing:border-box;padding:40px 44px}}
.kick{{font-family:Righteous;font-size:18px;letter-spacing:.12em;color:{VIOLET}}}
h1{{font-family:Righteous;font-weight:400;font-size:44px;line-height:1.1;white-space:nowrap;margin:16px 0 14px;color:{INK}}}
.card p{{font-size:19px;line-height:1.6;color:#4a3a5c;margin:0}}
.ghost{{position:absolute;left:376px;bottom:68px;font-weight:600;font-size:18px;color:{INK}}}
.row-h{{display:flex;justify-content:space-between;align-items:baseline;padding:22px 40px 6px}}
.row-h b{{font-family:Righteous;font-weight:400;font-size:28px;color:{INK};letter-spacing:.04em}}
.row-h span{{font-size:16px;color:#7a6a8a}}
.phone{{position:absolute;border-radius:62px;background:#0d0618;padding:14px;box-sizing:border-box;box-shadow:0 40px 80px rgba(0,0,0,.5)}}
.screen{{position:relative;width:100%;height:100%;border-radius:50px;overflow:hidden;background:{CREAM}}}
.status{{display:flex;justify-content:space-between;padding:16px 40px 0;font-weight:600;font-size:16px;color:{INK}}}
.nowcard{{display:flex;align-items:center;gap:10px;margin:0 16px;padding:14px 18px 14px 10px;background:{INK};border-radius:30px}}
.nowtxt{{color:{CREAM}}}
.nowtxt .big{{font-family:Righteous;font-size:28px;line-height:1.05;margin:8px 0 6px}}
.nowtxt .sm{{font-size:15px;opacity:.75}}
.nowtxt .kick{{font-size:14px}}
.bar{{height:8px;border-radius:4px;background:#ffffff30;margin-top:14px;width:150px}}
.bar i{{display:block;height:100%;width:62%;border-radius:4px;background:{LIME}}}
.list{{padding:14px 26px 0}}
.srow{{display:flex;align-items:center;gap:14px;padding:13px 4px;border-bottom:2px dashed #1E0B3A30;font-size:19px;color:{INK}}}
.srow .t{{font-family:Righteous;width:58px;color:{VIOLET}}}
.srow .n{{font-weight:600;flex:1}}
.chip{{font-size:13px;font-weight:700;padding:5px 12px;border-radius:20px;color:{INK};border:2px solid {INK}}}
.tabs{{position:absolute;left:16px;right:16px;bottom:18px;height:70px;background:{VIOLET};border-radius:36px;display:flex;align-items:center;justify-content:space-around;color:#ffffffb0;font-weight:600;font-size:15px}}
.tabs .on{{color:{INK};background:{LIME};padding:10px 18px;border-radius:24px}}
</style>{web}{phone}'''
open('ui.html', 'w').write(html)
