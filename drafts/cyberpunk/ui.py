"""赛博朋克 · 落到网页和手机 App（1920×1080）。python3 ui.py && node ../_lib/shot.cjs ui.html png/ui.png
界面三件套：切角面板（clip-path 切掉一角）、霓虹描边 + 外发光、扫描线。"""
import random

PINK, CYAN, YEL, NIGHT = '#FF2E97', '#20F2FF', '#F4FF3A', '#07060F'
rng = random.Random(3)


def city(w, h):
    out = []
    x = 0
    while x < w:
        bw, bh = rng.randint(40, 110), rng.randint(int(h * 0.3), int(h * 0.95))
        out.append(f'<rect x="{x}" y="{h - bh}" width="{bw}" height="{bh}" fill="#150C2A"/>')
        for yy in range(h - bh + 10, h - 8, 14):
            for xx in range(x + 6, x + bw - 8, 12):
                if rng.random() < 0.2:
                    out.append(f'<rect x="{xx}" y="{yy}" width="6" height="5" fill="{rng.choice(["#FFB86B", "#7FE9FF", "#FF7AC6"])}" opacity=".8"/>')
        x += bw + rng.randint(2, 14)
    return ''.join(out)


streets = ''.join(f'<line x1="{a}" y1="0" x2="{a + 120}" y2="932" stroke="#20F2FF" stroke-opacity=".14" stroke-width="{rng.choice([2, 2, 6])}"/>' for a in range(-200, 500, 70))
streets += ''.join(f'<line x1="0" y1="{b}" x2="442" y2="{b - 60}" stroke="#20F2FF" stroke-opacity=".14" stroke-width="{rng.choice([2, 2, 8])}"/>' for b in range(40, 1000, 64))
route = 'M70,760 L150,700 L170,560 L260,520 L300,380 L370,330'

web = f'''
<div class="win" style="left:50px;top:65px;width:1250px;height:950px">
  <div class="chrome"><i></i><i></i><i></i><span>nightcity.run</span></div>
  <div class="page">
    <div class="nav"><b>NIGHT//CITY<em>RUNNERS</em></b><span>Season 7</span><span>Ranked</span><span>Shop</span><a class="cut ghost">Log in</a><a class="cut y">Play free</a></div>
    <div class="hero">
      <div class="left">
        <div class="tag">// SEASON 07 · NEON RAIN</div>
        <h1>Run the city<br><span>after midnight.</span></h1>
        <p>4v4 rooftop races across a city that never turns off its lights. 免费游玩，跨平台。</p>
        <div class="btns"><a class="cut y big">▶ Play now</a><a class="cut ghost big">Watch trailer</a></div>
        <div class="stats"><div><b>2.4M</b><span>runners online</span></div><div><b>148</b><span>districts</span></div><div><b>07:12</b><span>to next drop</span></div></div>
      </div>
      <div class="art cut"><svg width="560" height="430">{city(560, 430)}</svg>
        <div class="neon">夜<br>城</div><div class="scan"></div><div class="corner">REC ●</div></div>
    </div>
    <div class="cards">
      <div class="card cut"><small>// RANK</small><b>Diamond III</b><div class="bar"><i style="width:72%"></i></div><span>720 / 1000 RP</span></div>
      <div class="card cut"><small>// DAILY</small><b>3 rooftop wins</b><div class="bar"><i style="width:66%;background:{PINK}"></i></div><span>2 / 3 done</span></div>
      <div class="card cut"><small>// SHOP</small><b>Holo jacket “KOI”</b><div class="bar"><i style="width:100%;background:{YEL}"></i></div><span>1,200 ¤ · 24h left</span></div>
    </div>
    <div class="ticker"><b>LIVE</b><span>K-07 “Ghost” took District 12 · 00:41.07</span><span>★ New record on Neon Bridge</span><span>Holo jacket “KOI” 72% sold</span><span>Drop in 07:12 →</span></div>
  </div>
</div>'''

phone = f'''
<div class="phone" style="left:1390px;top:50px;width:470px;height:960px">
  <div class="screen">
    <svg width="442" height="932" style="position:absolute;left:0;top:0">
      <rect width="442" height="932" fill="#08060F"/>{streets}
      <path d="{route}" fill="none" stroke="{PINK}" stroke-width="16" stroke-opacity=".25" stroke-linejoin="round"/>
      <path d="{route}" fill="none" stroke="{PINK}" stroke-width="5" stroke-linejoin="round" filter="url(#g)"/>
      <defs><filter id="g" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <circle cx="70" cy="760" r="11" fill="{CYAN}" filter="url(#g)"/><circle cx="370" cy="330" r="13" fill="none" stroke="{YEL}" stroke-width="4" filter="url(#g)"/>
      <circle cx="370" cy="330" r="34" fill="none" stroke="{YEL}" stroke-width="2" stroke-dasharray="5 6"/>
    </svg>
    <div class="scan"></div>
    <div class="status"><span>23:47</span><span>5G ▮▮▮▯</span></div>
    <div class="ptop cut"><small>// DESTINATION</small><b>九号码头 · Pier 9</b><span>ETA 07 MIN · 4.2 KM</span></div>
    <div class="eta">02<small>MIN</small></div>
    <div class="sheet cut">
      <div class="row"><div><small>// DRIVER</small><b>K-07 “Ghost”</b><span>沪A·2077 · ★ 4.96</span></div><div class="ava"></div></div>
      <div class="row2"><a class="cut ghost">Message</a><a class="cut y">Share trip</a></div>
    </div>
  </div>
</div>'''

html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Inter;src:url(../../public/fonts/Inter.ttf);font-weight:100 900}}
@font-face{{font-family:Mono;src:url(../../public/fonts/SpaceMono-Bold.ttf);font-weight:700}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Black.otf);font-weight:900}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Bold.otf);font-weight:700}}
html,body{{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:Inter,NotoSC;color:#E9E6FF;background:radial-gradient(circle at 30% 20%,#2a0f45,#07060F 60%)}}
.cut{{clip-path:polygon(0 0,calc(100% - 18px) 0,100% 18px,100% 100%,18px 100%,0 calc(100% - 18px))}}
.win{{position:absolute;overflow:hidden;background:#0B0916;border:1px solid #20F2FF55;box-shadow:0 0 0 1px #000,0 30px 80px #000,0 0 60px #FF2E9733}}
.chrome{{height:42px;background:#120E22;display:flex;align-items:center;gap:8px;padding:0 18px;border-bottom:1px solid #20F2FF33}}
.chrome i{{width:12px;height:12px;background:#2c2545}}
.chrome span{{margin-left:20px;background:#07060F;padding:5px 16px;font:700 14px Mono;color:{CYAN};width:420px}}
.page{{position:relative;height:908px;background:linear-gradient(#0B0916,#120A22)}}
.nav{{height:72px;display:flex;align-items:center;gap:30px;padding:0 40px;font-weight:600;font-size:16px;color:#b9b3d9;border-bottom:1px solid #ffffff12}}
.nav b{{margin-right:auto;font:900 24px Inter;color:#fff;letter-spacing:.04em}}.nav b em{{font-style:normal;color:{PINK};margin-left:8px}}
a.cut{{display:inline-block;padding:11px 22px;font:800 15px Inter;letter-spacing:.08em;text-transform:uppercase}}
.y{{background:{YEL};color:#0B0916}}.ghost{{background:#20F2FF22;color:{CYAN};box-shadow:inset 0 0 0 2px {CYAN}}}
.big{{padding:16px 30px;font-size:17px}}
.hero{{display:flex;gap:36px;padding:44px 40px 0}}.left{{flex:1}}
.tag{{font:700 15px Mono;color:{PINK};letter-spacing:.12em}}
h1{{font:900 64px/1.0 Inter;letter-spacing:-.02em;margin:14px 0 16px;color:#fff;text-shadow:0 0 18px #20F2FF88}}
h1 span{{color:{CYAN}}}
.left p{{font-size:19px;line-height:1.55;color:#b9b3d9;margin:0 0 26px;max-width:520px}}
.btns{{display:flex;gap:14px}}
.stats{{display:flex;gap:34px;margin-top:34px}}.stats b{{display:block;font:700 30px Mono;color:#fff}}.stats span{{font-size:14px;color:#8f88b5}}
.art{{position:relative;width:560px;height:430px;background:linear-gradient(#1a0b33,#3a0f4a 80%,#FF2E9755);flex:none}}
.art svg{{position:absolute;left:0;bottom:0}}
.neon{{position:absolute;right:46px;top:40px;font:900 76px/1.05 NotoSC;color:{PINK};text-shadow:0 0 4px {PINK},0 0 14px {PINK};padding:14px 18px;border:4px solid {CYAN};box-shadow:0 0 14px {CYAN},inset 0 0 14px {CYAN};border-radius:10px;background:#140A20cc}}
.ticker{{position:absolute;left:0;right:0;bottom:0;height:64px;display:flex;align-items:center;gap:44px;padding:0 40px;background:{YEL};color:#0B0916;font:700 16px Mono;white-space:nowrap;overflow:hidden}}
.ticker b{{background:#0B0916;color:{YEL};padding:6px 12px}}
.scan{{position:absolute;inset:0;background:repeating-linear-gradient(0deg,#0000 0 3px,#00000040 3px 4px);pointer-events:none}}
.corner{{position:absolute;left:18px;top:14px;font:700 14px Mono;color:{PINK}}}
.cards{{display:flex;gap:22px;padding:36px 40px 0}}
.card{{flex:1;background:#151027;padding:20px 22px;box-shadow:inset 0 0 0 1px #20F2FF33}}
.card small{{font:700 13px Mono;color:{CYAN}}}.card b{{display:block;font-size:22px;margin:8px 0 14px;color:#fff}}
.card span{{font:700 13px Mono;color:#8f88b5}}
.bar{{height:8px;background:#ffffff14;margin-bottom:10px}}.bar i{{display:block;height:100%;background:{CYAN};box-shadow:0 0 10px currentColor}}
.phone{{position:absolute;border-radius:58px;background:#151022;padding:14px;box-sizing:border-box;box-shadow:0 30px 80px #000,0 0 50px #20F2FF22}}
.screen{{position:relative;width:100%;height:100%;border-radius:46px;overflow:hidden}}
.status{{position:absolute;left:40px;right:40px;top:16px;display:flex;justify-content:space-between;font:700 15px Mono;color:{CYAN}}}
.ptop{{position:absolute;left:18px;right:18px;top:58px;background:#0B0916e6;padding:16px 20px;box-shadow:inset 0 0 0 1px #FF2E9766}}
.ptop small,.sheet small{{font:700 12px Mono;color:{PINK};display:block}}.ptop b{{display:block;font-size:24px;margin:4px 0 4px;color:#fff}}.ptop span{{font:700 13px Mono;color:{CYAN}}}
.eta{{position:absolute;left:40px;top:300px;font:700 64px/1 Mono;color:{YEL};text-shadow:0 0 16px {YEL}}}.eta small{{font-size:16px;margin-left:6px}}
.sheet{{position:absolute;left:18px;right:18px;bottom:22px;background:#0B0916f0;padding:20px;box-shadow:inset 0 0 0 1px #20F2FF66}}
.row{{display:flex;justify-content:space-between;align-items:center}}.row b{{display:block;font-size:23px;color:#fff;margin:4px 0}}.row span{{font:700 13px Mono;color:#8f88b5}}
.ava{{width:62px;height:62px;background:linear-gradient(135deg,{PINK},{CYAN});clip-path:polygon(0 0,80% 0,100% 20%,100% 100%,20% 100%,0 80%)}}
.row2{{display:flex;gap:10px;margin-top:16px}}.row2 a{{flex:1;text-align:center}}
</style>{web}{phone}'''
open('ui.html', 'w').write(html)
