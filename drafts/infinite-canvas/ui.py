"""无限画布 · 落到网页和手机 App（1920×1080）。python3 ui.py && node ../_lib/shot.cjs ui.html png/ui.png
网页：节点式工作流画布；App：手机上的旅行计划画布（缩小后只剩每块的大标题——语义缩放）。"""
from common import CSS, INK, SEL, STICKY, cursor, sticky


def node(x, y, w, title, body, color, ins=1, outs=1):
    ports = ''.join(f'<i class="port in" style="top:{46 + k * 26}px"></i>' for k in range(ins))
    ports += ''.join(f'<i class="port out" style="top:{46 + k * 26}px;border-color:{color}"></i>' for k in range(outs))
    return (f'<div class="node" style="left:{x}px;top:{y}px;width:{w}px"><div class="nh"><b style="background:{color}"></b>{title}</div>'
            f'<div class="nb">{body}</div>{ports}</div>')


def wire(x1, y1, x2, y2, c, dash=False):
    dx = max(60, (x2 - x1) * 0.5)
    return f'<path d="M{x1},{y1} C{x1 + dx},{y1} {x2 - dx},{y2} {x2},{y2}" fill="none" stroke="{c}" stroke-width="3.5"{" stroke-dasharray=\"8 7\"" if dash else ""}/>'


imgs = ''.join(f'<span style="background:{c}"></span>' for c in ['#E9D8C4', '#2F6BFF', '#FFB3C7', '#1D1D1F', '#B5E8A6', '#FFE27A'])
nodes = (node(60, 120, 250, 'Brief', '<div class="txt">Autumn launch for a<br>ceramic mug. Calm,<br>warm, handmade.</div>', '#F2A93B', ins=0)
         + node(60, 380, 250, 'Moodboard', f'<div class="grid">{imgs}</div>', '#E8437A', ins=0)
         + node(420, 220, 290, 'Write copy', '<div class="txt"><b>“Slow mornings,<br>made by hand.”</b><br><span>3 variants · 2.1s</span></div>', '#7A4DFF', ins=2)
         + node(820, 110, 270, 'Resize × 4', '<div class="sizes"><i style="width:60px;height:60px"></i><i style="width:34px;height:60px"></i><i style="width:80px;height:42px"></i><i style="width:44px;height:44px"></i></div>', '#1E9E5A')
         + node(820, 400, 270, 'Export', '<div class="txt">PNG · 4 files<br><span>to /campaign/autumn</span></div>', INK, outs=0))
wires = (wire(310, 173, 420, 273, '#F2A93B') + wire(310, 433, 420, 299, '#E8437A') + wire(710, 273, 820, 163, '#7A4DFF')
         + wire(710, 273, 1010, 600, '#7A4DFF', dash=True))
web = f'''
<div class="win" style="left:50px;top:65px;width:1250px;height:950px">
  <div class="chrome"><i></i><i></i><i></i><span>canvas.app/launch-autumn</span></div>
  <div class="bar"><b>Launch · Autumn</b><span class="crumb">Workflows / Mugs</span><div class="av"><i style="background:#E8437A">M</i><i style="background:#1E9E5A">L</i><i style="background:#7A4DFF">A</i></div><em>Run all ▶</em></div>
  <div class="area">
    <div class="cv"></div>
    <div class="tools"><i class="on">↖</i><i>✋</i><i>▢</i><i>✎</i><i>T</i><i style="background:{STICKY['y']}"></i></div>
    <div style="position:absolute;left:80px;top:40px"><svg width="1250" height="760" style="position:absolute;left:0;top:0;overflow:visible">{wires}<circle cx="1010" cy="600" r="7" fill="#fff" stroke="#7A4DFF" stroke-width="3"/></svg>{nodes}{cursor('Leo', 1012, 602)}</div>
    {cursor('Mia', 380, 560)}
    <div class="hud2"><span>−</span><span class="z">84%</span><span>+</span></div>
  </div>
</div>'''

# 手机：缩到 18%，每一天只剩大标题和色块
day = lambda x, y, t, sub, c, cards: (f'<div class="day" style="left:{x}px;top:{y}px"><div class="dt">{t}</div><div class="ds">{sub}</div>'
                                     f'<div class="cards">{"".join(f"<i style=background:{k}></i>" for k in cards)}</div><div class="halo" style="background:{c}"></div></div>')
phone = f'''
<div class="phone" style="left:1390px;top:50px;width:470px;height:960px">
  <div class="screen">
    <div class="cv"></div>
    <div class="status"><span>9:41</span><span>100%</span></div>
    <div class="ptop"><b>Kyoto, 4 days</b><span>18%</span></div>
    {day(40, 170, 'Day 1', 'Gion · Pontocho', STICKY['y'], ['#E9D8C4', '#FFB3C7', '#2F6BFF'])}
    {day(220, 330, 'Day 2', 'Arashiyama', STICKY['g'], ['#B5E8A6', '#1D1D1F', '#FFE27A', '#A9D4FF'])}
    {day(40, 520, 'Day 3', 'Nara day trip', STICKY['b'], ['#FFC48A', '#E9D8C4'])}
    {day(230, 690, 'Day 4', 'Tea & ceramics', STICKY['p'], ['#FFB3C7', '#B5E8A6', '#E9D8C4'])}
    <svg width="442" height="932" style="position:absolute;left:0;top:0"><path d="M150,282 C200,320 210,330 230,350 M300,470 C260,520 220,520 180,540 M170,660 C210,690 230,700 250,710" stroke="#1D1D1F" stroke-width="3" fill="none" stroke-dasharray="6 6"/></svg>
    <div class="pinch" style="left:150px;top:420px"></div><div class="pinch" style="left:300px;top:600px"></div>
    <div class="ptools"><i class="on">↖</i><i>✎</i><i style="background:{STICKY['y']}"></i><i>＋</i></div>
  </div>
</div>'''

html = f'''<!doctype html><meta charset="utf-8"><style>{CSS}
html,body{{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:Inter;background:#2b2a28;color:{INK}}}
.win{{position:absolute;overflow:hidden;border-radius:12px;background:#fff;box-shadow:0 30px 70px #0007}}
.chrome{{height:44px;background:#ECEAE4;display:flex;align-items:center;gap:8px;padding:0 18px}}
.chrome i{{width:13px;height:13px;border-radius:50%;background:#cfcbc1}}
.chrome span{{margin-left:20px;background:#fff;border-radius:8px;padding:5px 16px;font-size:14px;color:#666;width:420px}}
.bar{{height:58px;display:flex;align-items:center;gap:16px;padding:0 20px;border-bottom:1px solid #e4e2dc;font-size:16px}}
.bar b{{font-size:18px}}.crumb{{color:#8a867d;margin-right:auto}}
.av{{display:flex}}.av i{{width:32px;height:32px;border-radius:50%;color:#fff;font:700 14px/32px Inter;text-align:center;font-style:normal;margin-left:-8px;border:2px solid #fff}}
.bar em{{font-style:normal;font-weight:700;background:{SEL};color:#fff;padding:9px 18px;border-radius:9px}}
.area{{position:relative;height:848px;overflow:hidden}}
.tools,.ptools{{position:absolute;display:flex;gap:6px;background:#fff;border-radius:12px;padding:7px;box-shadow:0 2px 6px #0002,0 8px 24px #0001}}
.tools{{left:16px;top:16px;flex-direction:column}}
.tools i,.ptools i{{width:40px;height:40px;border-radius:8px;font:600 19px/40px Inter;text-align:center;font-style:normal;color:#444}}
.tools .on,.ptools .on{{background:{SEL};color:#fff}}
.node{{position:absolute;background:#fff;border-radius:14px;box-shadow:0 1px 2px #0002,0 6px 18px #0000001a,0 0 0 1px #0000000f}}
.nh{{display:flex;align-items:center;gap:9px;padding:12px 14px;border-bottom:1px solid #eee;font:700 16px Inter}}
.nh b{{width:12px;height:12px;border-radius:4px}}
.nb{{padding:12px 14px 14px}}
.txt{{font-size:15px;line-height:1.45;color:#333}}.txt span{{color:#8a867d;font-size:13px}}
.grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}}.grid span{{height:56px;border-radius:6px}}
.sizes{{display:flex;gap:10px;align-items:flex-end}}.sizes i{{background:#E9D8C4;border-radius:4px;border:2px solid #1D1D1F22}}
.port{{position:absolute;width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid #9a968d;box-sizing:border-box}}
.port.in{{left:-7px}}.port.out{{right:-7px}}
.hud2{{position:absolute;right:18px;bottom:18px;display:flex;gap:4px;background:#fff;border-radius:12px;padding:7px;box-shadow:0 2px 6px #0002;font:600 16px Inter}}
.hud2 span{{padding:6px 11px;border-radius:8px}}.hud2 .z{{background:#F0EFEA}}
.phone{{position:absolute;border-radius:58px;background:#141414;padding:14px;box-sizing:border-box;box-shadow:0 30px 70px #0007}}
.screen{{position:relative;width:100%;height:100%;border-radius:46px;overflow:hidden}}
.status{{position:absolute;left:40px;right:40px;top:16px;display:flex;justify-content:space-between;font-weight:600;font-size:16px}}
.ptop{{position:absolute;left:20px;right:20px;top:58px;display:flex;justify-content:space-between;align-items:center;background:#fff;border-radius:16px;padding:12px 18px;box-shadow:0 2px 8px #0002}}
.ptop b{{font-size:20px}}.ptop span{{font-weight:700;background:#F0EFEA;padding:5px 10px;border-radius:8px}}
.day{{position:absolute;width:180px}}
.dt{{position:relative;z-index:2;font:900 42px/1 Inter;letter-spacing:-.03em}}
.ds{{position:relative;z-index:2;font:600 15px Inter;color:#5d5a52;margin:4px 0 8px}}
.cards{{position:relative;z-index:2;display:flex;gap:5px}}.cards i{{width:34px;height:26px;border-radius:4px;box-shadow:0 1px 2px #0003}}
.halo{{position:absolute;left:-16px;top:-14px;width:200px;height:126px;border-radius:18px;z-index:1;opacity:.85}}
.pinch{{position:absolute;width:54px;height:54px;border-radius:50%;background:#2F6BFF33;border:3px solid #2F6BFF99;box-sizing:border-box}}
.ptools{{left:50%;bottom:22px;transform:translateX(-50%)}}
</style>{web}{phone}'''
open('ui.html', 'w').write(html)
