"""风格派 · 落到网页和手机 App（1920×1080）。python3 ui.py && node ../_lib/shot.cjs ui.html png/ui.png
整页就是一张网格：容器底色是黑，格子之间的 gap 就是黑线。"""
from blocks import BLUE, INK, PAPER, RED, YEL, rects_svg, word


def blockword(text, u, color_map=None):
    rs, w = word(text, u, 0, 0, colors=color_map)
    return f'<svg width="{w:.0f}" height="{7 * u}">{rects_svg(rs)}</svg>'


web = f'''
<div class="win" style="left:50px;top:65px;width:1250px;height:950px">
  <div class="chrome"><i></i><i></i><i></i><span>huisvankleur.nl/grid</span></div>
  <div class="page">
    <div class="nav"><b>HUIS VAN KLEUR</b><span>Exhibitions</span><span>Visit</span><span>Collection</span><em>Tickets</em></div>
    <div class="g">
      <div class="c" style="grid-area:t;padding:30px 40px">{blockword('GRID', 22, {(1, 0): RED})}<div class="sub">&amp; COLOUR — 1917 / 2027</div></div>
      <div class="c red" style="grid-area:r"><div class="big">12.03 —<br>30.08</div><div class="sm">2027 · Hall 2</div></div>
      <div class="c yel" style="grid-area:y"></div>
      <div class="c" style="grid-area:d;padding:30px 34px"><p>A hundred years after Mondrian drew his first black line, 140 works on how a grid, three colours and no curves became the way we lay out screens.</p></div>
      <div class="c blue" style="grid-area:b"></div>
      <div class="c" style="grid-area:k;padding:26px 30px"><div class="sm">Adults €18 · Under 18 free</div><div class="btn">Book tickets →</div></div>
      <div class="c" style="grid-area:e"></div>
      <div class="c art" style="grid-area:a1"><div class="mini m1"><i></i><i></i><i></i><i></i></div><b>Mondrian</b><span>Composition, 1930</span></div>
      <div class="c art" style="grid-area:a2"><div class="mini m2"><i></i><i></i><i></i><i></i></div><b>Rietveld</b><span>Red Blue Chair, 1918</span></div>
      <div class="c art" style="grid-area:a3"><div class="mini m3"><i></i><i></i><i></i><i></i></div><b>Van Doesburg</b><span>Café Aubette, 1928</span></div>
      <div class="c red" style="grid-area:z"></div>
    </div>
  </div>
</div>'''

hours = ''.join(f'<div class="hr" style="top:{i * 78}px">{h}</div>' for i, h in enumerate(['9', '10', '11', '12', '13', '14', '15', '16']))
# 日程：一块事件 = 一个色格；格与格之间是黑线
ev = [(0, 1.5, RED, 'Studio crit', '9:00 – 10:30', PAPER), (1.5, 1, PAPER, 'Coffee w/ Piet', '10:30', INK),
      (2.5, 2, BLUE, 'Grid workshop', '11:30 – 13:30', PAPER), (4.5, 0.6, PAPER, 'Lunch', '', INK),
      (5.1, 1.9, YEL, 'Print proofs', '14:05 – 16:00', INK)]
evs = ''.join(f'<div class="ev" style="top:{a * 78}px;height:{h * 78}px;background:{c};color:{tc}"><b>{t}</b><span>{s}</span></div>' for a, h, c, t, s, tc in ev)
phone = f'''
<div class="phone" style="left:1390px;top:50px;width:470px;height:960px">
  <div class="screen">
    <div class="status"><span>9:41</span><span>100%</span></div>
    <div class="ph"><div><small>TUESDAY</small><br>{blockword('GRID', 9)}</div><div class="day">14</div></div>
    <div class="week"><span>M<br>13</span><span class="on">T<br>14</span><span>W<br>15</span><span>T<br>16</span><span>F<br>17</span></div>
    <div class="cal"><div class="hours">{hours}</div><div class="evs">{evs}</div></div>
    <div class="tab"><span class="on">Day</span><span>Week</span><span style="background:{RED};color:{PAPER}">+</span><span>Month</span></div>
  </div>
</div>'''

html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Jost;src:url(../../public/fonts/Jost.ttf);font-weight:100 900}}
html,body{{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:Jost,sans-serif;background:#d9d4c7}}
.win{{position:absolute;overflow:hidden;background:{PAPER};box-shadow:0 30px 70px #0005;border:3px solid {INK}}}
.chrome{{height:44px;background:#e8e3d6;border-bottom:3px solid {INK};display:flex;align-items:center;gap:8px;padding:0 18px}}
.chrome i{{width:13px;height:13px;background:{INK}}}
.chrome i+i{{background:{YEL}}}.chrome i+i+i{{background:{RED}}}
.chrome span{{margin-left:20px;background:{PAPER};padding:5px 16px;font-size:14px;color:#555;width:420px;border:2px solid {INK}}}
.nav{{height:70px;display:flex;align-items:center;gap:34px;padding:0 40px;font-size:18px;font-weight:600;border-bottom:14px solid {INK}}}
.nav b{{margin-right:auto;font-weight:800;letter-spacing:.18em}}
.nav em{{font-style:normal;background:{INK};color:{PAPER};padding:12px 26px}}
.g{{display:grid;gap:14px;background:{INK};height:calc(950px - 44px - 84px - 3px);
  grid-template-columns:330px 230px 1fr 220px 150px;grid-template-rows:250px 210px 1fr;
  grid-template-areas:"t t r y y" "d d b k e" "a1 a2 a3 a3 z"}}
.c{{background:{PAPER};position:relative;box-sizing:border-box}}
.red{{background:{RED};color:{PAPER}}}.yel{{background:{YEL}}}.blue{{background:{BLUE}}}
.sub{{font-weight:700;font-size:21px;letter-spacing:.2em;margin-top:22px}}
.big{{font-weight:800;font-size:54px;line-height:1.05;padding:28px 30px 14px}}
.sm{{font-size:17px;font-weight:600;letter-spacing:.06em;padding:0 30px}}
.c[style*="grid-area:k"] .sm{{padding:0}}
.c p{{margin:0;font-size:22px;line-height:1.5;font-weight:500}}
.btn{{margin-top:18px;background:{INK};color:{PAPER};font-weight:700;font-size:18px;padding:14px 18px}}
.art{{padding:20px 22px}}.art b{{display:block;font-size:22px;margin-top:12px}}.art span{{font-size:16px;color:#555}}
.mini{{height:180px;display:grid;gap:7px;background:{INK};border:7px solid {INK}}}
.mini i{{background:{PAPER}}}
.m1{{grid-template-columns:2fr 1fr;grid-template-rows:2fr 1fr}}.m1 i:nth-child(1){{background:{RED}}}.m1 i:nth-child(4){{background:{BLUE}}}
.m2{{grid-template-columns:1fr 3fr;grid-template-rows:1fr 1fr}}.m2 i:nth-child(2){{background:{RED}}}.m2 i:nth-child(3){{background:{BLUE}}}.m2 i:nth-child(1){{background:{INK}}}
.m3{{grid-template-columns:1fr 1fr 2fr;grid-template-rows:1fr 1fr}}.m3 i:nth-child(1){{background:{YEL}}}.m3 i:nth-child(3){{background:{BLUE}}}.m3 i:nth-child(4){{background:{RED}}}
.phone{{position:absolute;border-radius:58px;background:{INK};padding:14px;box-sizing:border-box;box-shadow:0 30px 70px #0006}}
.screen{{position:relative;width:100%;height:100%;border-radius:46px;overflow:hidden;background:{PAPER}}}
.status{{display:flex;justify-content:space-between;padding:16px 40px 0;font-weight:600;font-size:16px}}
.ph{{display:flex;justify-content:space-between;align-items:flex-end;padding:18px 28px 14px;border-bottom:12px solid {INK}}}
.ph small{{font-weight:700;letter-spacing:.2em;font-size:15px;display:inline-block;margin-bottom:10px}}
.day{{font-weight:800;font-size:84px;line-height:.8}}
.week{{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;background:{INK};border-bottom:8px solid {INK}}}
.week span{{background:{PAPER};text-align:center;font-weight:700;font-size:16px;padding:8px 0;line-height:1.3}}
.week .on{{background:{YEL}}}
.cal{{position:relative;display:flex;height:630px}}
.hours{{position:relative;width:62px;border-right:8px solid {INK}}}
.hr{{position:absolute;left:0;width:54px;text-align:center;font-weight:700;font-size:16px;padding-top:6px}}
.evs{{position:relative;flex:1;background:{INK}}}
.ev{{position:absolute;left:0;right:0;box-sizing:border-box;border-bottom:8px solid {INK};padding:10px 16px}}
.ev b{{display:block;font-size:21px;font-weight:700}}.ev span{{font-size:15px;font-weight:600}}
.tab{{position:absolute;left:0;right:0;bottom:0;height:86px;display:grid;grid-template-columns:1fr 1fr 70px 1fr;gap:8px;background:{INK};border-top:8px solid {INK}}}
.tab span{{background:{PAPER};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:17px}}
.tab span:nth-child(3){{font-size:36px}}
.tab .on{{background:{BLUE};color:{PAPER}}}
</style>{web}{phone}'''
open('ui.html', 'w').write(html)
