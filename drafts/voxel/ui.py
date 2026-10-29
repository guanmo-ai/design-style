"""体素 · 落到网页和手机 App（1920×1080）。python3 ui.py && node ../_lib/shot.cjs ui.html png/ui.png
网页：一款小游戏的官网，主图就是封面那块海岸换个角度；App：搭建游戏的背包，每格是一个现算的方块图标。"""
import sys

sys.path.insert(0, '../_lib')
import cover  # noqa: E402
from poly3d import Camera, Scene, render  # noqa: E402

L = dict(light=(0.45, 0.8, -0.35), sun='#FFF4E0', sky='#CFE6FF', ground='#8A7A70', amb=0.5)
hero_cam = Camera(eye=(13 - 55, 12 + 46, 13 + 62), target=(13, 7, 13), ortho=40, W=760, H=600)
hero = f'<svg width="760" height="600" style="position:absolute;right:0;top:0">{render(cover.S, hero_cam, **L)}</svg>'


def block(top, side, extra=None, i=0):
    B = Scene()
    B.box(0, 0, 0, 1, 1, 1, side, top=top)
    if extra:
        extra(B)
    cam = Camera(eye=(6, 5, 6), target=(0.5, 0.45, 0.5), ortho=2.0, W=72, H=72)
    return f'<svg width="72" height="72">{render(B, cam, **L)}</svg>'


items = [('Grass', block('#6CC24A', '#9A6B45'), 64), ('Sand', block('#F2D99A', '#E3C681'), 64), ('Stone', block('#959AA3', '#7E838D'), 32),
         ('Water', block('#2FA6D8', '#2489C2'), 12), ('Brick', block('#E8443A', '#C9372E'), 40), ('Glass', block('#FFE27A', '#F2CC55'), 8),
         ('Wood', block('#C08A55', '#8E623F'), 24), ('Roof', block('#4F8BEA', '#3D7BD9'), 18), ('Leaf', block('#3AA35A', '#2F8F4E'), 50)]
grid = ''.join(f'<div class="slot{" sel" if i == 4 else ""}">{svg}<b>{n}</b><i>{c}</i></div>' for i, (n, svg, c) in enumerate(items))

web = f'''
<div class="win" style="left:50px;top:65px;width:1250px;height:950px">
  <div class="chrome"><i></i><i></i><i></i><span>tinyharbor.game</span></div>
  <div class="page">
    <div class="nav"><b>TINY HARBOR</b><span>Play</span><span>Builds</span><span>Devlog</span><em>Wishlist</em></div>
    <div class="hero">{hero}
      <div class="ht"><small>A COZY BUILDING GAME · 2027</small><h1>One block<br>at a time.</h1>
      <p>Raise a lighthouse, dig a harbour, watch the boats come in. Every block falls into place with a tiny <i>clack</i>.</p>
      <div class="btns"><a class="b1">▶ Play demo</a><a class="b2">Steam page</a></div></div>
    </div>
    <div class="feats"><div><b>2,400+</b><span>blocks placed / min by players</span></div><div><b>Day &amp; night</b><span>lighthouse turns on at dusk</span></div><div><b>Share</b><span>export your island as a .vox</span></div></div>
  </div>
</div>'''

phone = f'''
<div class="phone" style="left:1390px;top:50px;width:470px;height:960px">
  <div class="screen">
    <div class="status"><span>9:41</span><span>100%</span></div>
    <div class="ph"><h2>Backpack</h2><span>9 / 24 slots</span></div>
    <div class="grid">{grid}</div>
    <div class="sel2"><div>{block('#E8443A', '#C9372E')}</div><div><b>Red brick</b><span>Lighthouse stripe · stack 40</span></div></div>
    <div class="bar"><span class="on">Build</span><span>Paint</span><span>Erase</span></div>
  </div>
</div>'''

html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Inter;src:url(../../public/fonts/Inter.ttf);font-weight:100 900}}
@font-face{{font-family:Mono;src:url(../../public/fonts/SpaceMono-Bold.ttf);font-weight:700}}
html,body{{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:Inter;color:#1F3F66;background:linear-gradient(180deg,#8FD3FF,#D7F0FF 60%,#FFF1D6)}}
.win{{position:absolute;overflow:hidden;border-radius:12px;background:linear-gradient(180deg,#BFE6FF,#EAF7FF 70%,#FFF6E6);box-shadow:0 0 0 4px #1F3F66,0 24px 0 4px #1F3F6633}}
.chrome{{height:44px;background:#1F3F66;display:flex;align-items:center;gap:8px;padding:0 18px}}
.chrome i{{width:13px;height:13px;background:#6CC24A}}.chrome i+i{{background:#F2D99A}}.chrome i+i+i{{background:#E8443A}}
.chrome span{{margin-left:20px;background:#163150;padding:5px 16px;font:700 14px Mono;color:#BFE6FF;width:420px}}
.nav{{height:72px;display:flex;align-items:center;gap:32px;padding:0 40px;font-weight:800;font-size:17px}}
.nav b{{margin-right:auto;font:700 26px Mono;letter-spacing:.06em}}
.nav em{{font-style:normal;background:#E8443A;color:#fff;padding:11px 22px;box-shadow:0 5px 0 #A92A22}}
.hero{{position:relative;height:600px}}
.ht{{position:absolute;left:44px;top:60px;width:520px}}
.ht small{{font:700 14px Mono;letter-spacing:.12em;color:#3D7BD9}}
h1{{margin:12px 0 18px;font:900 72px/0.98 Inter;letter-spacing:-.035em}}
.ht p{{font-size:20px;line-height:1.55;color:#3B5A80;margin:0 0 30px}}
.btns{{display:flex;gap:16px}}.btns a{{font-weight:800;font-size:18px;padding:16px 26px}}
.b1{{background:#6CC24A;color:#fff;box-shadow:0 6px 0 #4A8F31}}.b2{{background:#fff;color:#1F3F66;box-shadow:0 6px 0 #9DB6CF}}
.feats{{display:flex;gap:18px;padding:16px 40px}}.feats div{{flex:1;background:#fff;padding:20px 22px;box-shadow:0 6px 0 #C9DCEC}}
.feats b{{display:block;font:700 22px Mono}}.feats span{{font-size:15px;color:#5A7699}}
.phone{{position:absolute;border-radius:58px;background:#1F3F66;padding:14px;box-sizing:border-box;box-shadow:0 30px 70px #1F3F6655}}
.screen{{position:relative;width:100%;height:100%;border-radius:46px;overflow:hidden;background:#EAF6FF}}
.status{{display:flex;justify-content:space-between;padding:16px 40px 0;font-weight:700;font-size:16px}}
.ph{{display:flex;justify-content:space-between;align-items:baseline;padding:20px 28px 10px}}.ph h2{{margin:0;font:700 34px Mono}}.ph span{{font:700 14px Mono;color:#5A7699}}
.grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:6px 24px}}
.slot{{position:relative;background:#fff;height:118px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 5px 0 #C9DCEC}}
.slot b{{font-size:14px;margin-top:2px}}.slot i{{position:absolute;right:10px;top:8px;font:700 13px Mono;font-style:normal;color:#5A7699}}
.slot.sel{{box-shadow:0 0 0 4px #E8443A,0 5px 0 4px #A92A22}}
.sel2{{display:flex;gap:14px;align-items:center;margin:20px 24px 0;background:#1F3F66;color:#fff;padding:12px 16px}}
.sel2 b{{display:block;font-size:19px}}.sel2 span{{font-size:14px;opacity:.8}}
.bar{{position:absolute;left:18px;right:18px;bottom:20px;height:64px;display:flex;gap:10px}}
.bar span{{flex:1;display:flex;align-items:center;justify-content:center;background:#fff;font-weight:800;box-shadow:0 5px 0 #C9DCEC}}
.bar .on{{background:#6CC24A;color:#fff;box-shadow:0 5px 0 #4A8F31}}
</style>{web}{phone}'''
open('ui.html', 'w').write(html)
