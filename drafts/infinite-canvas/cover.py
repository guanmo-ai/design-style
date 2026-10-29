"""无限画布 · 第 0 帧（1920×1080）：标题本身是画布上的一个对象，正被拉大；三个人同时在拖、在连线。
python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png"""
from common import CSS, INK, SEL, STICKY, cursor, sel, sticky

W, H = 1920, 1080
blocks = ''.join(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;background:{c};border-radius:4px"></div>'
                 for x, y, w, h, c in [(24, 24, 250, 190, '#E9D8C4'), (290, 24, 150, 90, '#2F6BFF'), (290, 128, 150, 86, '#FFB3C7'),
                                       (456, 24, 220, 300, '#1D1D1F'), (24, 230, 120, 94, '#B5E8A6'), (160, 230, 280, 94, '#FFE27A')])
screens = ''.join(f'<div style="position:absolute;left:{x}px;top:40px;width:110px;height:220px;border-radius:14px;border:3px solid {INK};background:#fff">'
                  f'<div style="margin:16px 12px;height:10px;background:#ddd;border-radius:5px"></div><div style="margin:0 12px;height:70px;background:{c};border-radius:6px"></div>'
                  f'<div style="margin:12px;height:8px;background:#e6e6e6;border-radius:4px"></div><div style="margin:0 12px;height:8px;width:60%;background:#e6e6e6;border-radius:4px"></div></div>'
                  for x, c in [(30, '#A9D4FF'), (200, '#FFC48A'), (370, '#B5E8A6')])
arrows = ''.join(f'<path d="M{x + 145},150 H{x + 195}" stroke="{INK}" stroke-width="3" marker-end="url(#ah)"/>' for x in (30, 200))

html = f'''<!doctype html><meta charset="utf-8"><style>{CSS}
html,body{{margin:0;width:{W}px;height:{H}px;overflow:hidden;font-family:Inter}}
.title{{position:absolute;left:100px;top:150px;font:900 172px/0.9 Inter;letter-spacing:-.045em;color:{INK}}}
.zh{{position:absolute;left:106px;top:476px;font:900 92px NotoSC;letter-spacing:.06em;color:{INK}}}
.dim{{position:absolute;font:700 15px Inter;color:#fff;background:{SEL};padding:5px 10px;border-radius:5px}}
.hud{{position:absolute;display:flex;align-items:center;gap:6px;background:#fff;border-radius:12px;padding:8px;box-shadow:0 2px 6px #0002,0 8px 24px #0001;font:600 17px Inter;color:{INK}}}
.hud span{{padding:6px 12px;border-radius:8px}}.hud .z{{background:#F0EFEA;min-width:58px;text-align:center}}
.mini{{position:absolute;right:30px;bottom:30px;width:230px;height:150px;background:#fff;border-radius:12px;box-shadow:0 2px 6px #0002,0 8px 24px #0001;overflow:hidden}}
.top{{position:absolute;left:24px;top:22px;display:flex;gap:10px;align-items:center;font:600 17px Inter;color:#4d4a44}}
.top b{{background:{INK};color:#fff;padding:7px 12px;border-radius:8px;font-weight:700}}
</style>
<div class="cv"></div>
<div class="top"><b>布局方式</b><span>无限画布 Infinite Canvas · 1963 Sketchpad → 2016 Figma → 今天</span></div>

<div class="fr" style="left:1180px;top:130px;width:700px;height:350px"><div class="fl">Moodboard</div>{blocks}</div>
<div class="fr" style="left:1260px;top:580px;width:560px;height:300px"><div class="fl">Onboarding flow</div>{screens}
  <svg width="560" height="300" style="position:absolute;left:0;top:0"><defs><marker id="ah" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" refX="12" refY="7" orient="auto"><path d="M0,0 L14,7 L0,14Z" fill="{INK}"/></marker></defs>{arrows}</svg></div>

<div class="title">Infinite<br>Canvas</div>
<div class="zh">无限画布</div>
{sel(84, 140, 1010, 470)}
<div class="dim" style="left:520px;top:626px">1010 × 470</div>
{cursor('you', 1094, 610, 'You')}

{sticky(110, 742, 196, 'zoom out =<br>see it all', 'y', -2)}
{sticky(326, 760, 196, 'zoom in =<br>details grow', 'p', 2)}
{sticky(560, 740, 196, 'cards keep<br>their place', 'g', -1)}
{sticky(808, 700, 210, 'connect<br>it all →', 'b', 7, drag=True)}
{cursor('Mia', 980, 836)}
<svg width="{W}" height="{H}" style="position:absolute;left:0;top:0;pointer-events:none">
  <path d="M1018,760 C1110,760 1140,720 1180,700" fill="none" stroke="{INK}" stroke-width="3" stroke-dasharray="0"/>
  <circle cx="1180" cy="700" r="7" fill="#fff" stroke="{SEL}" stroke-width="3"/>
</svg>
{cursor('Leo', 1184, 704)}
{cursor('Ana', 1640, 300)}

<div class="hud" style="left:50%;bottom:30px;transform:translateX(-50%)"><span>−</span><span class="z">37%</span><span>+</span><span style="color:#8a867d">Fit</span></div>
<div class="mini">
  <div style="position:absolute;left:30px;top:40px;width:60px;height:30px;background:{INK};border-radius:2px"></div>
  <div style="position:absolute;left:120px;top:30px;width:70px;height:36px;background:#E9D8C4"></div>
  <div style="position:absolute;left:130px;top:82px;width:56px;height:30px;background:#A9D4FF"></div>
  <div style="position:absolute;left:30px;top:90px;width:70px;height:18px;background:{STICKY['y']}"></div>
  <div style="position:absolute;left:150px;top:8px;width:60px;height:16px;background:#ddd"></div>
  <div style="position:absolute;left:18px;top:18px;width:184px;height:110px;border:2px solid {SEL};border-radius:3px"></div>
</div>
'''
open('cover.html', 'w').write(html)
