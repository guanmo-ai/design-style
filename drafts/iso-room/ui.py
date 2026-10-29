"""等距微缩房间 · 落到网页和手机 App（1920×1080）。python3 ui.py && node ../_lib/shot.cjs ui.html png/ui.png
网页：家具店的“摆进你的房间”；App：智能家居，房间就是遥控器——点哪件家具，哪件就亮。"""
import sys

sys.path.insert(0, '../_lib')
from poly3d import Camera, Scene, render  # noqa: E402
from room import build  # noqa: E402


def room_svg(w, h, ortho, night, falling=False):
    S = Scene()
    build(S, falling=falling, night=night)
    cam = Camera(eye=(6 + 50, 3 + 42, 6 + 50), target=(6, 3.0, 6), ortho=ortho, W=w, H=h)
    if night:
        body = render(S, cam, light=(0.35, 0.75, 0.55), sun='#FFD9A8', sky='#B9A8FF', ground='#6B4E6A', amb=0.62)
    else:
        body = render(S, cam, light=(0.55, 0.8, 0.25), sun='#FFFFFF', sky='#DCEBFF', ground='#B9A08A', amb=0.62)
    lamp = cam.proj((5.45, 4.3, 1.05))
    glow = (f'<defs><radialGradient id="w{w}"><stop offset="0" stop-color="#FFC56B" stop-opacity=".55"/><stop offset="1" stop-color="#FFC56B" stop-opacity="0"/></radialGradient></defs>'
            f'<circle cx="{lamp[0]:.0f}" cy="{lamp[1] + 40:.0f}" r="{w * 0.22:.0f}" fill="url(#w{w})" style="mix-blend-mode:screen"/>') if night else ''
    return f'<svg width="{w}" height="{h}" style="position:absolute;left:0;top:0">{body}{glow}</svg>', cam


day, _ = room_svg(700, 600, 18.5, night=False, falling=True)
night, pcam = room_svg(442, 430, 18.5, night=True)
lp = pcam.proj((5.45, 5.2, 1.05)); sp = pcam.proj((0.7, 4.6, 3.2)); cp = pcam.proj((6.0, 1.3, 6.0))

web = f'''
<div class="win" style="left:50px;top:65px;width:1250px;height:950px">
  <div class="chrome"><i></i><i></i><i></i><span>roomy.studio/planner</span></div>
  <div class="page">
    <div class="nav"><b>roomy</b><span>Shop</span><span>Planner</span><span>Ideas</span><em>Cart · 3</em></div>
    <div class="main">
      <div class="left"><small>ROOM PLANNER</small><h1>Try it in<br>your room first.</h1>
        <p>Drop furniture into a tiny copy of your room. Everything snaps to the floor grid, casts a real shadow, and lights up at night.</p>
        <div class="pick"><div class="it on"><i style="background:#8E5BD6"></i><b>Bean bag</b><span>¥ 699</span></div><div class="it"><i style="background:#F2B13A"></i><b>Lounge chair</b><span>¥ 1,299</span></div><div class="it"><i style="background:#FFD27A"></i><b>Floor lamp</b><span>¥ 459</span></div></div>
        <div class="btns"><a class="b1">Add to room</a><a class="b2">☾ Night mode</a></div></div>
      <div class="stage">{day}<div class="hint">Dropping in… snaps to grid</div></div>
    </div>
  </div>
</div>'''

phone = f'''
<div class="phone" style="left:1390px;top:50px;width:470px;height:960px">
  <div class="screen">
    <div class="status"><span>21:40</span><span>100%</span></div>
    <div class="ph"><small>HOME · 卧室</small><h2>Good night, Mia</h2></div>
    <div class="rm">{night}
      <div class="pin" style="left:{lp[0]:.0f}px;top:{lp[1]:.0f}px">💡 On</div>
      <div class="pin" style="left:{sp[0]:.0f}px;top:{sp[1]:.0f}px">🖥 On</div>
      <div class="pin off" style="left:{cp[0]:.0f}px;top:{cp[1]:.0f}px">🐈 Asleep</div>
    </div>
    <div class="ctl"><div class="t on"><b>Lamp</b><span>Warm · 40%</span><i></i></div><div class="t on"><b>Desk</b><span>Screen on</span><i></i></div>
      <div class="t"><b>Blinds</b><span>Open</span><i></i></div><div class="t"><b>Heater</b><span>21 °C</span><i></i></div></div>
    <a class="scene">☾ Sleep scene</a>
  </div>
</div>'''

html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Inter;src:url(../../public/fonts/Inter.ttf);font-weight:100 900}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Bold.otf);font-weight:700}}
html,body{{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:Inter,NotoSC;color:#2E2742;background:linear-gradient(135deg,#F6EDE4,#E7DCF5)}}
.win{{position:absolute;overflow:hidden;border-radius:16px;background:#FBF7F2;box-shadow:0 30px 70px #2E274233}}
.chrome{{height:44px;background:#F1EAE2;display:flex;align-items:center;gap:8px;padding:0 18px}}
.chrome i{{width:13px;height:13px;border-radius:50%;background:#DCCFC3}}
.chrome span{{margin-left:20px;background:#fff;border-radius:8px;padding:5px 16px;font-size:14px;color:#777;width:420px}}
.nav{{height:74px;display:flex;align-items:center;gap:32px;padding:0 40px;font-weight:700;font-size:17px}}
.nav b{{margin-right:auto;font-size:30px;font-weight:900;letter-spacing:-.03em;color:#C4693F}}
.nav em{{font-style:normal;background:#2E2742;color:#fff;padding:10px 20px;border-radius:24px}}
.main{{display:flex;padding:20px 40px 0;gap:20px}}
.left{{width:430px;padding-top:30px}}.left small{{font-weight:800;letter-spacing:.24em;font-size:13px;color:#C4693F}}
h1{{font:900 58px/1.0 Inter;letter-spacing:-.035em;margin:12px 0 16px}}
.left p{{font-size:18px;line-height:1.55;color:#6A6080;margin:0 0 22px}}
.pick{{display:flex;flex-direction:column;gap:10px}}.it{{display:flex;align-items:center;gap:14px;background:#fff;border-radius:14px;padding:12px 16px;box-shadow:0 4px 12px #2E27420d}}
.it i{{width:34px;height:34px;border-radius:10px}}.it b{{flex:1;font-size:17px}}.it span{{color:#6A6080;font-weight:600}}
.it.on{{box-shadow:0 0 0 3px #8E5BD6}}
.btns{{display:flex;gap:12px;margin-top:22px}}.btns a{{font-weight:800;padding:15px 22px;border-radius:14px;font-size:16px}}
.b1{{background:#C4693F;color:#fff}}.b2{{background:#2E2742;color:#fff}}
.stage{{position:relative;width:700px;height:600px;margin-top:40px;border-radius:24px;background:radial-gradient(circle at 50% 55%,#FFF6EC,#F1E6DA)}}
.hint{{position:absolute;left:24px;bottom:22px;background:#2E2742;color:#fff;font-weight:700;font-size:14px;padding:8px 14px;border-radius:20px}}
.phone{{position:absolute;border-radius:58px;background:#1d1830;padding:14px;box-sizing:border-box;box-shadow:0 30px 70px #2E274255}}
.screen{{position:relative;width:100%;height:100%;border-radius:46px;overflow:hidden;background:linear-gradient(180deg,#2A2150,#1A1433)}}
.status{{display:flex;justify-content:space-between;padding:16px 40px 0;font-weight:700;font-size:16px;color:#fff}}
.ph{{padding:16px 28px 0;color:#fff}}.ph small{{font-weight:800;letter-spacing:.2em;font-size:12px;color:#B9A8FF}}.ph h2{{margin:4px 0 0;font-size:30px}}
.rm{{position:relative;height:430px}}
.pin{{position:absolute;transform:translate(-50%,-120%);background:#FFD27A;color:#2E2742;font-weight:800;font-size:13px;padding:6px 10px;border-radius:14px;white-space:nowrap;box-shadow:0 4px 10px #0005}}
.pin.off{{background:#ffffff26;color:#fff}}
.ctl{{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 22px}}
.t{{position:relative;background:#ffffff14;border-radius:18px;padding:14px 16px;color:#fff}}.t b{{display:block;font-size:17px}}.t span{{font-size:13px;opacity:.7}}
.t i{{position:absolute;right:14px;top:16px;width:38px;height:22px;border-radius:11px;background:#ffffff30}}
.t i:after{{content:"";position:absolute;left:3px;top:3px;width:16px;height:16px;border-radius:50%;background:#fff}}
.t.on{{background:#FFD27A;color:#2E2742}}.t.on i{{background:#2E2742}}.t.on i:after{{left:19px;background:#FFD27A}}
.scene{{position:absolute;left:22px;right:22px;bottom:22px;text-align:center;background:#8E5BD6;color:#fff;font-weight:800;padding:18px;border-radius:18px}}
</style>{web}{phone}'''
open('ui.html', 'w').write(html)
