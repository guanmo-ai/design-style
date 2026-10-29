"""低多边形 · 落到网页和手机 App（1920×1080）。python3 ui.py && node ../_lib/shot.cjs ui.html png/ui.png
网页：徒步 / 露营预订，主图是同一片山谷换个机位；App：天气，卡片里是一座会随天气变的小山。"""
import sys

sys.path.insert(0, '../_lib')
import cover  # noqa: E402
from poly3d import Camera, Scene, render  # noqa: E402

SKYG = '<linearGradient id="sk{i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>'


def view(S, w, h, eye, target, fov, sky, fog, light, sun, i):
    cam = Camera(eye=eye, target=target, fov=fov, W=w, H=h)
    body = render(S, cam, light=light, sun=sun, sky='#C9B6F0', ground='#7A4E5A', amb=0.5, fog=fog)
    return (f'<svg width="{w}" height="{h}" style="position:absolute;left:0;top:0"><defs>{SKYG.format(i=i, a=sky[0], b=sky[1])}</defs>'
            f'<rect width="{w}" height="{h}" fill="url(#sk{i})"/>{body}</svg>')


S = cover.build()
hero = view(S, 1250, 720, (-30, 22, -20), (10, 6, 50), 52, ('#5B5FC7', '#FFD2B0'), ('#F2B6B4', 50, 170), (-0.75, 0.42, 0.5), '#FFC98A', 1)


def mini_mountain(seed, snow):
    M = Scene()
    import math
    M.terrain(-12, -12, 24, 24, 12, 12, lambda x, z: max(0, 9 - math.hypot(x, z) * 0.9) + 1.5 * math.sin(x * 0.8 + seed),
              lambda x, y, z: ('#F4F1F6' if y > 6.5 and snow else '#8C7A86' if y > 5 else ['#7DBB4A', '#6AAE45'][int(x * 3 + z) % 2]), seed=seed)
    return M


M = mini_mountain(3, True)
for k, (x, y, z, r) in enumerate([(-6, 11, 2, 2.2), (-4, 11.6, 3, 1.6), (5, 12.5, 1, 1.9), (7, 12, 2, 1.4)]):
    M.ico(x, y, z, r, '#FFFFFF', seed=k, sy=0.7, emit=0.3)
card = view(M, 410, 400, (0, 9, -22), (0, 5, 0), 50, ('#4F7BE8', '#BFD8FF'), None, (-0.6, 0.6, -0.5), '#FFF1D6', 2)


def icon(kind, i):
    I = Scene()
    if kind == 'sun':
        I.ico(0, 0, 0, 1.4, '#FFC43D', seed=i, emit=0.4)
    elif kind == 'cloud':
        I.ico(-0.6, 0, 0, 1.0, '#FFFFFF', seed=i); I.ico(0.7, 0.2, 0, 1.2, '#FFFFFF', seed=i + 1); I.ico(0.1, 0.7, 0, 1.0, '#F1F4FA', seed=i + 2)
    else:
        I.ico(0, 0.4, 0, 1.2, '#D7DEEA', seed=i)
        for dx in (-0.6, 0.1, 0.8):
            I.cone(dx, -1.6, 0, 0.18, 0.6, '#5AA8F0', n=4)
    cam = Camera(eye=(0, 1.5, -8), target=(0, 0, 0), fov=40, W=64, H=64)
    return f'<svg width="64" height="64">{render(I, cam, light=(-0.5, 0.8, -0.6), sun="#FFFFFF", sky="#DDE8FF", ground="#9AA4B8", amb=0.55)}</svg>'


days = [('Mon', 'sun', '18°'), ('Tue', 'cloud', '15°'), ('Wed', 'rain', '11°'), ('Thu', 'cloud', '14°'), ('Fri', 'sun', '19°')]
dayrow = ''.join(f'<div class="d"><span>{n}</span>{icon(k, i)}<b>{t}</b></div>' for i, (n, k, t) in enumerate(days))

web = f'''
<div class="win" style="left:50px;top:65px;width:1250px;height:950px">
  <div class="chrome"><i></i><i></i><i></i><span>trailhead.camp</span></div>
  <div class="hero">{hero}
    <div class="nav"><b>trailhead</b><span>Trails</span><span>Camps</span><span>Maps</span><em>Book a spot</em></div>
    <div class="ht"><small>ALPINE VALLEY · 2,140 M</small><h1>Wake up<br>above the clouds.</h1></div>
  </div>
  <div class="row">
    <div class="c"><b>12.4 km</b><span>Ridge loop · 5h</span></div><div class="c"><b>Lake camp</b><span>18 spots left</span></div>
    <div class="c"><b>Steam train</b><span>Valley line · every 40 min</span></div><a>Plan my trip →</a>
  </div>
</div>'''

phone = f'''
<div class="phone" style="left:1390px;top:50px;width:470px;height:960px">
  <div class="screen">
    <div class="status"><span>9:41</span><span>100%</span></div>
    <div class="loc"><small>NOW · ZERMATT VALLEY</small><h2>14°</h2><span>Clouds clearing by noon</span></div>
    <div class="card">{card}<div class="tag">❄ Snow above 2,800 m</div></div>
    <div class="days">{dayrow}</div>
    <div class="tab"><span class="on">Today</span><span>Week</span><span>Map</span></div>
  </div>
</div>'''

html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Inter;src:url(../../public/fonts/Inter.ttf);font-weight:100 900}}
html,body{{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:Inter;color:#2B2350;background:linear-gradient(160deg,#6B6FD6,#E9A6C2 55%,#FFD9B0)}}
.win{{position:absolute;overflow:hidden;border-radius:14px;background:#FFF9F3;box-shadow:0 30px 70px #2B235055}}
.chrome{{height:44px;background:#F3ECE6;display:flex;align-items:center;gap:8px;padding:0 18px}}
.chrome i{{width:13px;height:13px;border-radius:50%;background:#DCCFC6}}
.chrome span{{margin-left:20px;background:#fff;border-radius:8px;padding:5px 16px;font-size:14px;color:#777;width:420px}}
.hero{{position:relative;height:720px;overflow:hidden}}
.nav{{position:absolute;left:0;right:0;top:0;height:76px;display:flex;align-items:center;gap:32px;padding:0 40px;color:#fff;font-weight:700;font-size:17px;text-shadow:0 1px 6px #0004}}
.nav b{{margin-right:auto;font-size:28px;font-weight:900;letter-spacing:-.02em}}
.nav em{{font-style:normal;background:#fff;color:#2B2350;padding:10px 22px;border-radius:30px;text-shadow:none}}
.ht{{position:absolute;left:44px;top:110px;color:#fff;text-shadow:0 2px 14px #3a2a6a55}}
.ht small{{font-weight:800;letter-spacing:.3em;font-size:14px}}
h1{{margin:12px 0 0;font:900 76px/0.98 Inter;letter-spacing:-.035em}}
.row{{display:flex;gap:18px;align-items:center;padding:34px 40px}}
.c{{flex:1;background:#fff;border-radius:16px;padding:22px 24px;box-shadow:0 6px 18px #2B23500f}}
.c b{{display:block;font-size:24px}}.c span{{font-size:15px;color:#7a7194}}
.row a{{background:#2B2350;color:#fff;font-weight:800;padding:22px 28px;border-radius:16px;font-size:18px}}
.phone{{position:absolute;border-radius:58px;background:#1d1a2e;padding:14px;box-sizing:border-box;box-shadow:0 30px 70px #2B235066}}
.screen{{position:relative;width:100%;height:100%;border-radius:46px;overflow:hidden;background:linear-gradient(180deg,#EEF2FF,#FFF4EC)}}
.status{{display:flex;justify-content:space-between;padding:16px 40px 0;font-weight:700;font-size:16px}}
.loc{{padding:16px 30px 0}}.loc small{{font-weight:800;letter-spacing:.2em;font-size:12px;color:#7a7194}}
.loc h2{{margin:2px 0 0;font:900 96px/1 Inter;letter-spacing:-.05em}}.loc span{{font-weight:600;color:#5a5178}}
.card{{position:relative;margin:18px 16px 0;height:400px;border-radius:26px;overflow:hidden;box-shadow:0 10px 26px #2B235026}}
.tag{{position:absolute;left:16px;bottom:14px;background:#ffffffd9;padding:7px 14px;border-radius:20px;font-weight:700;font-size:14px}}
.days{{display:flex;justify-content:space-between;margin:26px 26px 0}}
.d{{text-align:center;font-weight:700;font-size:15px;color:#5a5178}}.d svg{{display:block;margin:6px auto}}.d b{{color:#2B2350;font-size:18px}}
.tab{{position:absolute;left:18px;right:18px;bottom:18px;height:66px;border-radius:33px;background:#2B2350;display:flex;align-items:center;justify-content:space-around;color:#ffffffa0;font-weight:700}}
.tab .on{{color:#2B2350;background:#FFD2B0;padding:9px 22px;border-radius:22px}}
</style>{web}{phone}'''
open('ui.html', 'w').write(html)
