"""Isotype · 落到网页和手机 App（1920×1080）。python3 ui.py && node ../_lib/shot.cjs ui.html png/ui.png
网页：一篇数据新闻（示例数据）；App：一周习惯回顾。"""
from picto import BLUE, GREEN, INK, OCHRE, PAPER, RED, defs, row

WHITE = '#F7F2E6'


def chart(rows, h, width, label_w, bg, rowgap=16):
    out, y = [], 0
    for lab, k, n_old, n_new, col in rows:
        hh = h * 1.35 if k == 'man' else h
        o, _ = row(k, n_old, label_w, y + h - hh, hh, col)
        nn, _ = row(k, n_new, label_w, y + 2 * h + 8 - hh, hh, col)
        out.append(f'<g opacity=".32">{o}</g>{nn}')
        out.append(f'<text x="0" y="{y + h + 2}" font-family="Jost" font-weight="700" font-size="24" fill="{INK}">{lab}</text>')
        y += 2 * h + 8 + rowgap + 14
        out.append(f'<line x1="0" x2="{width}" y1="{y - rowgap / 2 - 7}" y2="{y - rowgap / 2 - 7}" stroke="{INK}" stroke-opacity=".18" stroke-width="2"/>')
    return f'<svg width="{width}" height="{y}" style="display:block">{defs(bg)}{"".join(out)}</svg>'


modes = [('Car', 'car', 9, 6, RED), ('Tram', 'tram', 5, 6.4, BLUE), ('Bike', 'bike', 3, 5.2, GREEN), ('Walk', 'man', 3, 2.4, INK)]
web_chart = chart(modes, 46, 1150, 150, WHITE)

web = f'''
<div class="win" style="left:50px;top:65px;width:1250px;height:950px">
  <div class="chrome"><i></i><i></i><i></i><span>northbridge-times.com/commute</span></div>
  <div class="page">
    <div class="nav"><b>The Northbridge Times</b><span>City</span><span>Data</span><span>Opinion</span><em>Subscribe</em></div>
    <div class="art">
      <div class="kick">DATA · 6 MIN READ</div>
      <h1>How Northbridge gets to work</h1>
      <p class="dek">In ten years a third of drivers switched to tram and bike. Each symbol is 5% of commuters; faded rows are 2015, solid rows 2025.</p>
      <div class="legend"><svg width="44" height="22">{defs(WHITE)}<use href="#car" width="44" height="22" fill="{RED}"/></svg> = 5% of commuters <span class="faded">■</span> 2015 <span>■</span> 2025</div>
      {web_chart}
      <div class="src">Sample data for illustration.</div>
    </div>
  </div>
</div>'''

habits = [('Water', 'cup', 9.0, 11.5, BLUE, '1 = 4 glasses'), ('Sleep', 'moon', 9.6, 10.3, INK, '1 = 5 hours'), ('Cycling', 'bike', 3.2, 6.4, GREEN, '1 = 10 km'), ('Walks', 'man', 4, 5.5, OCHRE, '1 = 1 walk')]
ph_rows = []
for name, k, old, new, col, unit in habits:
    h = 30
    o, _ = row(k, old, 0, 0, h, col, gap=0.25)
    nn, _ = row(k, new, 0, h + 8, h, col, gap=0.25)
    ph_rows.append(f'<div class="hb"><div class="hh"><b>{name}</b><span>{unit}</span></div>'
                   f'<svg width="400" height="{2 * h + 10}">{defs(WHITE)}<g opacity=".3">{o}</g>{nn}</svg></div>')
phone = f'''
<div class="phone" style="left:1390px;top:50px;width:470px;height:960px">
  <div class="screen">
    <div class="status"><span>9:41</span><span>100%</span></div>
    <div class="ph"><small>WEEK 43 · OCT 20–26</small><h2>Your week,<br>counted.</h2></div>
    <div class="seg"><span>Faded = last week</span><span class="on">Solid = this week</span></div>
    {''.join(ph_rows)}
    <div class="tab"><span class="on">Week</span><span>Month</span><span>Log</span></div>
  </div>
</div>'''

html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Jost;src:url(../../public/fonts/Jost.ttf);font-weight:100 900}}
html,body{{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:Jost,sans-serif;background:#2C5A8A;color:{INK}}}
.win{{position:absolute;overflow:hidden;background:{WHITE};border-radius:12px;box-shadow:0 30px 70px #0006}}
.chrome{{height:44px;background:#E3DAC5;display:flex;align-items:center;gap:8px;padding:0 18px}}
.chrome i{{width:13px;height:13px;border-radius:50%;background:#bfb39a}}
.chrome span{{margin-left:20px;background:{WHITE};border-radius:6px;padding:5px 16px;font-size:14px;color:#6a6252;width:420px}}
.nav{{height:66px;display:flex;align-items:center;gap:32px;padding:0 48px;font-size:17px;font-weight:600;border-bottom:3px solid {INK}}}
.nav b{{margin-right:auto;font-size:26px;font-weight:800}}
.nav em{{font-style:normal;background:{RED};color:{WHITE};padding:9px 20px;border-radius:4px}}
.art{{padding:26px 48px 0}}
.kick{{font-weight:700;letter-spacing:.2em;font-size:15px;color:{RED}}}
h1{{font-size:52px;font-weight:800;margin:6px 0 8px;line-height:1.05}}
.dek{{font-size:20px;line-height:1.5;margin:0 0 14px;color:#4a453c;width:900px}}
.legend{{display:flex;align-items:center;gap:10px;font-size:16px;font-weight:600;margin-bottom:16px}}
.legend span{{color:{INK};margin-left:14px}}.legend .faded{{opacity:.32}}
.src{{font-size:14px;color:#8a8270;margin-top:-6px}}
.phone{{position:absolute;border-radius:58px;background:#141414;padding:14px;box-sizing:border-box;box-shadow:0 30px 70px #0006}}
.screen{{position:relative;width:100%;height:100%;border-radius:46px;overflow:hidden;background:{WHITE}}}
.status{{display:flex;justify-content:space-between;padding:16px 40px 0;font-weight:600;font-size:16px}}
.ph{{padding:18px 28px 8px}}.ph small{{font-weight:700;letter-spacing:.16em;font-size:14px;color:{RED}}}
.ph h2{{margin:6px 0 0;font-size:44px;line-height:1.02;font-weight:800}}
.seg{{display:flex;gap:8px;margin:10px 28px 4px;font-size:13px;font-weight:700}}
.seg span{{padding:6px 10px;border:2px solid {INK};border-radius:20px;opacity:.45}}.seg .on{{opacity:1;background:{INK};color:{WHITE}}}
.hb{{margin:0 28px;padding:14px 0 10px;border-bottom:2px solid #1E1C1920}}
.hh{{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px}}
.hh b{{font-size:21px;font-weight:800}}.hh span{{font-size:14px;font-weight:600;color:#6a6252}}
.tab{{position:absolute;left:18px;right:18px;bottom:18px;height:64px;border-radius:32px;background:{INK};display:flex;align-items:center;justify-content:space-around;color:#ffffff90;font-weight:700}}
.tab .on{{color:{INK};background:{OCHRE};padding:9px 22px;border-radius:22px}}
</style>{web}{phone}'''
open('ui.html', 'w').write(html)
