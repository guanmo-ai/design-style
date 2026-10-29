"""City Pop · 落到网页和手机 App（1920×1080）。python3 ui.py && node ../_lib/shot.cjs ui.html png/ui.png
网页：海边酒店预订（主图就是一张永井博式的画）；App：磁带随身听。"""
import cover
from scene import ORANGE, PINK, SUN

art = lambda w, h, vb='0 0 1920 1080': f'<svg width="{w}" height="{h}" viewBox="{vb}" preserveAspectRatio="xMidYMid slice" style="position:absolute;left:0;top:0">{cover.art}</svg>'
NAVY = '#0B2E7A'

web = f'''
<div class="win" style="left:50px;top:65px;width:1250px;height:950px">
  <div class="chrome"><i></i><i></i><i></i><span>hotelpacific.jp</span></div>
  <div class="page">
    <div class="hero">{art(1250, 560, '300 0 1620 720')}
      <div class="nav"><b class="logo">Hotel Pacific</b><span>Rooms</span><span>Pool</span><span>Dining</span><em>Book</em></div>
      <div class="ht"><small>SUMMER 2027 · 熱海</small><h1>Summer never<br>ends here.</h1></div>
    </div>
    <div class="book">
      <div><small>CHECK IN</small><b>Jul 24</b></div><div><small>CHECK OUT</small><b>Jul 28</b></div><div><small>GUESTS</small><b>2 adults</b></div>
      <a class="sun">Find a room →</a>
    </div>
    <div class="rooms">
      <div class="room"><div class="pic">{art(360, 200, '700 330 900 500')}</div><b>Ocean Suite</b><span>Balcony · ¥38,000 / night</span></div>
      <div class="room"><div class="pic">{art(360, 200, '1100 0 820 456')}</div><b>Palm Room</b><span>Garden view · ¥24,000</span></div>
      <div class="room"><div class="pic">{art(360, 200, '500 560 900 500')}</div><b>Poolside Studio</b><span>Direct pool access · ¥29,000</span></div>
    </div>
  </div>
</div>'''

phone = f'''
<div class="phone" style="left:1390px;top:50px;width:470px;height:960px">
  <div class="screen">
    <div class="status"><span>9:41</span><span>100%</span></div>
    <div class="ptitle">NOW PLAYING</div>
    <div class="cass">
      <div class="label">{art(330, 120, '0 0 1920 700')}<b>SIDE A</b><span>Summer Mixtape '84</span></div>
      <div class="win2"><i class="reel"><b></b></i><div class="tape"></div><i class="reel r2"><b></b></i></div>
    </div>
    <div class="song"><b>Midnight Pool Party</b><span>Sunset Highway · 1984</span></div>
    <div class="prog"><i></i></div><div class="times"><span>2:14</span><span>-1:27</span></div>
    <div class="keys"><i>◀◀</i><i class="play">▶</i><i>▶▶</i></div>
    <div class="next"><small>UP NEXT</small><div><b>Ocean Drive</b><span>3:52</span></div><div><b>Plastic Sunset</b><span>4:18</span></div></div>
    <div class="eq">{''.join(f'<i style="height:{h}px"></i>' for h in [18, 30, 46, 38, 26, 50, 34, 22, 40, 28, 16, 36])}</div>
  </div>
</div>'''

html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Inter;src:url(../../public/fonts/Inter.ttf);font-weight:100 900}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Bold.otf);font-weight:700}}
html,body{{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:Inter,NotoSC;background:linear-gradient(180deg,#FFB1C9,#FFD39A 55%,#8FD8FF)}}
.win{{position:absolute;overflow:hidden;border-radius:14px;background:#fff;box-shadow:0 30px 70px #0B2E7A55}}
.chrome{{height:44px;background:#F1F3F8;display:flex;align-items:center;gap:8px;padding:0 18px}}
.chrome i{{width:13px;height:13px;border-radius:50%;background:#d5dae6}}
.chrome span{{margin-left:20px;background:#fff;border-radius:8px;padding:5px 16px;font-size:14px;color:#666;width:420px}}
.hero{{position:relative;height:560px;overflow:hidden}}
.nav{{position:absolute;left:0;right:0;top:0;height:76px;display:flex;align-items:center;gap:34px;padding:0 40px;color:#fff;font-weight:700;font-size:17px}}
.logo{{margin-right:auto;font:900 italic 30px Inter;letter-spacing:-.02em;color:#fff;text-shadow:3px 3px 0 {PINK}}}
.nav em{{font-style:normal;background:#fff;color:{NAVY};padding:10px 22px;border-radius:30px}}
.ht{{position:absolute;left:44px;top:110px;color:#fff}}
.ht small{{font-weight:800;letter-spacing:.3em;font-size:15px}}
h1{{margin:10px 0 0;font:900 italic 74px/0.98 Inter;letter-spacing:-.03em;text-shadow:0 4px 0 #0B2E7A55}}
.book{{position:relative;margin:-48px 40px 0;background:#fff;border-radius:18px;box-shadow:0 12px 30px #0B2E7A26;display:flex;align-items:center;gap:0;padding:14px 14px 14px 30px}}
.book div{{flex:1;border-right:1px solid #e6e9f2;padding:6px 0}}.book div:nth-child(3){{border:0}}
.book small{{font-weight:800;font-size:12px;letter-spacing:.2em;color:#7d87a6}}.book b{{display:block;font-size:22px;color:{NAVY};margin-top:2px}}
.sun{{background:linear-gradient(90deg,{SUN},{ORANGE} 50%,{PINK});color:#fff;font-weight:800;font-size:18px;padding:18px 28px;border-radius:12px;text-shadow:0 1px 0 #0003}}
.rooms{{display:flex;gap:25px;padding:34px 40px 0}}
.room{{flex:1}}.pic{{position:relative;height:200px;border-radius:14px;overflow:hidden}}
.room b{{display:block;font-size:21px;color:{NAVY};margin-top:12px}}.room span{{font-size:15px;color:#7d87a6}}
.phone{{position:absolute;border-radius:58px;background:#F7F4EE;padding:14px;box-sizing:border-box;box-shadow:0 30px 70px #0B2E7A55}}
.screen{{position:relative;width:100%;height:100%;border-radius:46px;overflow:hidden;background:linear-gradient(180deg,#0638B8,#2F8FF0 55%,#9ADCFF)}}
.status{{display:flex;justify-content:space-between;padding:16px 40px 0;font-weight:700;font-size:16px;color:#fff}}
.ptitle{{text-align:center;color:#fff;font-weight:800;letter-spacing:.3em;font-size:14px;margin-top:22px}}
.cass{{position:relative;margin:24px 26px 0;height:250px;border-radius:16px;background:#F2EEE6;box-shadow:0 14px 30px #0006,0 2px 0 #fff inset}}
.label{{position:absolute;left:30px;right:30px;top:18px;height:120px;border-radius:8px;overflow:hidden}}
.label b{{position:absolute;left:12px;top:10px;font:900 italic 18px Inter;color:#fff}}.label span{{position:absolute;right:12px;top:12px;font:800 14px Inter;color:#fff;text-shadow:0 1px 2px #0006}}
.win2{{position:absolute;left:70px;right:70px;bottom:22px;height:80px;border-radius:40px;background:#2a2622;display:flex;align-items:center;justify-content:space-between;padding:0 14px}}
.reel{{width:58px;height:58px;border-radius:50%;background:#5a3a2a;display:flex;align-items:center;justify-content:center}}
.reel b{{width:30px;height:30px;border-radius:50%;background:repeating-conic-gradient(#fff 0 20deg,#ddd 20deg 60deg)}}
.r2{{width:44px;height:44px}}
.tape{{flex:1;height:4px;background:#5a3a2a;margin:0 6px}}
.song{{text-align:center;color:#fff;margin-top:34px}}.song b{{display:block;font:900 italic 32px Inter;letter-spacing:-.02em}}.song span{{font-weight:600;font-size:16px;opacity:.9}}
.prog{{margin:26px 34px 0;height:8px;border-radius:4px;background:#ffffff55}}.prog i{{display:block;width:60%;height:100%;border-radius:4px;background:linear-gradient(90deg,{SUN},{ORANGE},{PINK})}}
.times{{display:flex;justify-content:space-between;margin:8px 34px 0;color:#fff;font-weight:700;font-size:13px}}
.keys{{display:flex;justify-content:center;align-items:center;gap:40px;margin-top:22px;color:#fff;font-size:26px}}
.keys i{{font-style:normal}}.play{{width:94px;height:94px;border-radius:50%;background:linear-gradient(135deg,{SUN},{ORANGE} 50%,{PINK});display:flex;align-items:center;justify-content:center;font-size:36px;box-shadow:0 10px 24px #0004}}
.next{{margin:26px 26px 0;background:#ffffff26;border-radius:16px;padding:12px 18px;color:#fff}}
.next small{{font-weight:800;letter-spacing:.25em;font-size:12px}}.next div{{display:flex;justify-content:space-between;padding:8px 0 2px;font-size:17px}}.next span{{opacity:.8}}
.eq{{position:absolute;left:0;right:0;bottom:30px;height:40px !important;display:flex;justify-content:center;align-items:flex-end;gap:7px;height:60px}}
.eq i{{width:14px;border-radius:3px;background:#fff;opacity:.85}}
</style>{web}{phone}'''
open('ui.html', 'w').write(html)
