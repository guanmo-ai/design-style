"""浮世绘 · 落到网页和手机 App（1920×1080）。python3 ui.py && node ../_lib/shot.cjs ui.html png/ui.png
规则：每个色块是一块“色版”——平涂、边缘略微错开 3px；黑色轮廓是最后压上去的“墨版”；渐变只用在边上（渐晕）。"""
import math
from ukiyo import *


def plate(cls, fill, inner='', style=''):
    """一块界面元素 = 色版（错开 3px）+ 墨版轮廓。"""
    return f'<div class="pt {cls}" style="{style}"><i style="background:{fill}"></i><div class="k">{inner}</div></div>'


def mini_wave(w, h, uid):
    """小画：渐晕天空 + 山 + 一排浪。"""
    b = [f'<defs><linearGradient id="bk{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{AI_D}"/><stop offset="1" stop-color="{AI}" stop-opacity="0"/></linearGradient></defs>',
         f'<rect width="{w}" height="{h}" fill="{PAPER}"/><rect width="{w}" height="{h * .4}" fill="url(#bk{uid})"/>',
         f'<circle cx="{w * .78}" cy="{h * .3}" r="{h * .1}" fill="{BENI}"/>']
    m = catmull([(w * .15, h * .66), (w * .3, h * .52), (w * .38, h * .47), (w * .46, h * .52), (w * .62, h * .66)])
    b.append(f'<path d="{m} L{w * .62},{h * .7} L{w * .15},{h * .7}Z" fill="{AI}" stroke="{SUMI}" stroke-width="2"/>')
    b.append(f'<rect y="{h * .66}" width="{w}" height="{h}" fill="{AI_L}"/><line y1="{h * .66}" y2="{h * .66}" x2="{w}" stroke="{SUMI}" stroke-width="2"/>')
    for k in range(5):
        cx, cy, s = w * (k / 4.0), h * (.92 - (k % 2) * .06), h / 420
        pts = [(cx - 160 * s, h + 10), (cx - 90 * s, cy - 20 * s), (cx, cy - 80 * s), (cx + 70 * s, cy - 60 * s), (cx + 120 * s, cy), (cx + 160 * s, h + 10)]
        b.append(f'<path d="{catmull(pts, True)}" fill="{AI_P if k % 2 else AI}" stroke="{SUMI}" stroke-width="2"/>')
        for x, y, th in sample(pts[1:4], 12)[2:-1:2]:
            b.append(f'<path d="{claw(x, y, th, 22 * s * 2, 7 * s * 2, -1, -6)}" fill="{FOAM}" stroke="{SUMI}" stroke-width="1.2"/>')
    return f'<svg width="{w}" height="{h}">{"".join(b)}</svg>'


plates = [('渐晕', AI_D), ('天', '#7FA3C2'), ('红日', BENI), ('山', AI), ('浪 · 浅', AI_P), ('浪 · 深', AI), ('白沫', FOAM), ('墨版', SUMI)]
steps = ''.join(f'<div class="st{" on" if i == 5 else ""}"><i style="background:{c}"></i><b>{i + 1:02d}</b><span>{n}</span></div>' for i, (n, c) in enumerate(plates))

web = f'''
<div class="win" style="left:50px;top:60px;width:1260px;height:960px">
  <div class="chrome"><i></i><i></i><i></i><span>hangi.studio/print</span></div>
  <div class="page">
    <div class="nav"><b><em>版</em> Hangi Studio</b><span>Prints</span><span>Workshops</span><span>Journal</span><a>Sign in</a></div>
    <div class="body">
      <div class="left">
        <small>PRINT YOUR OWN · 8 BLOCKS</small>
        <h1>One block,<br>one colour.</h1>
        <p>Carve each colour on its own block, line them up with the kentō marks, and press them one after another. The black key block goes last.</p>
        {plate('btn', BENI, 'Start a print →')}
        <div class="meta"><div><b>8</b><span>blocks</span></div><div><b>3px</b><span>registration</span></div><div><b>1831</b><span>since</span></div></div>
      </div>
      <div class="right">
        <div class="frame">{mini_wave(560, 440, 1)}<div class="ken a"></div><div class="ken b"></div></div>
        <div class="steps">{steps}</div>
      </div>
    </div>
    <div class="sei"><svg width="1260" height="190"><defs><pattern id="sg" width="80" height="40" patternUnits="userSpaceOnUse">
      <g id="sc">{''.join(f'<circle cx="40" cy="40" r="{r}" fill="{c}" stroke="{SUMI}" stroke-width="2"/>' for r, c in ((40, AI), (30, AI_P), (20, AI), (10, AI_P)))}</g>
      <use href="#sc" x="-40" y="-20"/><use href="#sc" x="40" y="-20"/><use href="#sc" x="0" y="0"/><use href="#sc" x="-40" y="20"/><use href="#sc" x="40" y="20"/></pattern>
      <linearGradient id="sf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{PAPER}"/><stop offset=".35" stop-color="{PAPER}" stop-opacity="0"/></linearGradient></defs>
      <rect y="10" width="1260" height="180" fill="url(#sg)"/><rect y="10" width="1260" height="180" fill="url(#sf)"/>
      <line y1="10" y2="10" x2="1260" stroke="{SUMI}" stroke-width="3"/></svg><span>青海波 · Seigaiha — the same arc, printed in two blues</span></div>
  </div>
</div>'''

hours = [('6', '晴', KI, '14°'), ('9', '晴', KI, '17°'), ('12', '云', AI_P, '19°'), ('15', '雨', AI, '16°'), ('18', '雨', AI, '13°')]
hrs = ''.join(f'<div class="hr"><span>{h}时</span>{plate("dot", c, "", "")}<b>{t}</b><em>{w}</em></div>' for h, w, c, t in hours)
phone = f'''
<div class="phone" style="left:1400px;top:50px;width:460px;height:960px">
  <div class="screen">
    <div class="sky"><div class="rain"></div>
      <div class="status"><span>9:41</span><span>100%</span></div>
      <div class="city">江户 · 品川</div>
      <div class="slipv">午后有雨</div>
      <div class="temp">17<sup>°</sup></div>
      <div class="sun"></div>
    </div>
    <div class="hrs">{hrs}</div>
    {plate('tide', AI_P, f'<div class="tl"><b>潮汐</b><span>满潮 14:20 · 干潮 20:45</span></div><svg width="340" height="70"><path d="M0,50 C60,50 80,10 140,10 S220,60 280,60 S320,30 340,28" fill="none" stroke="{SUMI}" stroke-width="3"/><circle cx="140" cy="10" r="7" fill="{BENI}" stroke="{SUMI}" stroke-width="2"/></svg>', 'margin:14px 22px 0')}
    {plate('tide', FOAM, f'<div class="tl"><b>宜</b><span>赏雨 · 写生 · 访旧友</span></div>', 'margin:12px 22px 0;height:74px')}
    <div class="tab"><span class="on">天</span><span>潮</span><span>风</span><span>历</span></div>
  </div>
</div>'''

html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:NotoSerif;src:url(../../public/fonts/NotoSerifSC.ttf);font-weight:200 900}}
@font-face{{font-family:Yuji;src:url(../../public/fonts/YujiSyuku-Regular.ttf)}}
@font-face{{font-family:Corm;src:url(../../public/fonts/Cormorant.ttf);font-weight:300 700}}
html,body{{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:Corm,NotoSerif,serif;background:#CFC3A6;color:{SUMI}}}
.win{{position:absolute;overflow:hidden;background:{PAPER};box-shadow:0 30px 70px #0004;border:3px solid {SUMI}}}
.chrome{{height:42px;background:#E2D6B8;display:flex;align-items:center;gap:8px;padding:0 18px;border-bottom:3px solid {SUMI}}}
.chrome i{{width:12px;height:12px;border-radius:50%;background:{BENI}}}.chrome i+i{{background:{KI}}}.chrome i+i+i{{background:{AI}}}
.chrome span{{margin-left:20px;background:{PAPER};padding:3px 16px;font:600 16px Corm;width:380px;border:2px solid {SUMI}}}
.nav{{display:flex;align-items:center;gap:44px;height:84px;padding:0 56px;font-weight:700;font-size:21px;letter-spacing:.06em;
  background:linear-gradient({AI_D},{AI} 40%,{AI}00);color:{FOAM}}}
.nav b{{margin-right:auto;font:700 30px Corm;display:flex;align-items:center;gap:12px}}
.nav em{{font:30px/46px Yuji;font-style:normal;background:{BENI};width:46px;text-align:center;border-radius:4px}}
.nav a{{border:2px solid {FOAM};padding:8px 20px}}
.body{{display:flex;gap:50px;padding:30px 56px 0}}
.sei{{position:absolute;left:0;bottom:0}}.sei svg{{display:block}}.sei span{{position:absolute;left:56px;top:30px;font:700 17px Corm;letter-spacing:.14em;background:{PAPER};padding:4px 12px;border:2px solid {SUMI}}}
.left{{width:520px}}.left small{{font-weight:700;letter-spacing:.24em;font-size:16px;color:{BENI}}}
.left h1{{font:700 92px/.98 Corm;margin:14px 0 22px}}
.left p{{font-size:25px;line-height:1.42;margin:0 0 30px;font-weight:500}}
.pt{{position:relative}}.pt>i{{position:absolute;inset:0;transform:translate(4px,-3px)}}
.pt>.k{{position:relative;border:3px solid {SUMI};height:100%;box-sizing:border-box}}
.btn{{display:inline-block;height:64px}}.btn .k{{padding:0 30px;font:700 22px/58px Corm;color:{FOAM};letter-spacing:.04em}}
.meta{{display:flex;gap:40px;margin-top:44px;border-top:3px solid {SUMI};padding-top:20px}}
.meta b{{display:block;font:700 46px Corm}}.meta span{{font-size:18px;font-weight:600;color:#5a4f40;letter-spacing:.1em;text-transform:uppercase}}
.frame{{position:relative;border:4px solid {SUMI};width:560px;height:440px;box-shadow:12px 12px 0 {AI}}}
.frame svg{{display:block}}
.ken{{position:absolute;width:44px;height:28px;border-left:3px solid {SUMI};border-bottom:3px solid {SUMI};opacity:.6}}
.ken.a{{left:-22px;bottom:-40px}}.ken.b{{right:-22px;bottom:-40px;border-left:0;border-right:0;width:60px}}
.steps{{display:grid;grid-template-columns:repeat(8,1fr);gap:8px;margin-top:56px;width:572px}}
.st{{text-align:center;font-size:15px;font-weight:600}}.st i{{display:block;height:34px;border:2px solid {SUMI}}}
.st b{{display:block;font:700 18px Corm;margin-top:4px}}.st span{{font-family:NotoSerif;font-size:13px}}
.st.on i{{outline:3px solid {BENI};outline-offset:3px}}.st.on{{color:{BENI}}}
.st.on~.st{{opacity:.38}}
.phone{{position:absolute;border-radius:60px;background:{SUMI};padding:13px;box-sizing:border-box;box-shadow:0 30px 70px #0005}}
.screen{{position:relative;width:100%;height:100%;border-radius:48px;overflow:hidden;background:{PAPER}}}
.sky{{position:relative;height:430px;background:linear-gradient({AI_D},{AI} 30%,{AI_L} 70%,{PAPER});overflow:hidden;border-bottom:3px solid {SUMI}}}
.rain{{position:absolute;inset:-40px;background:repeating-linear-gradient(104deg,transparent 0 22px,{SUMI}55 22px 24px,transparent 24px 47px)}}
.status{{position:relative;display:flex;justify-content:space-between;padding:16px 40px 0;font-weight:700;font-size:17px;color:{FOAM}}}
.city{{position:relative;margin:22px 0 0 32px;font:700 22px NotoSerif;color:{FOAM};letter-spacing:.2em}}
.slipv{{position:absolute;right:34px;top:76px;writing-mode:vertical-rl;background:#E9CF86;border:3px solid {BENI};outline:2px solid {SUMI};outline-offset:3px;padding:16px 6px;font:900 30px NotoSerif;letter-spacing:.14em}}
.temp{{position:absolute;left:28px;top:150px;font:700 190px/1 Corm;color:{FOAM};text-shadow:4px -3px 0 {SUMI}}}.temp sup{{font-size:90px}}
.sun{{position:absolute;left:300px;top:330px;width:90px;height:90px;border-radius:50%;background:{BENI};border:3px solid {SUMI}}}
.hrs{{display:flex;justify-content:space-around;padding:18px 18px 0}}
.hr{{text-align:center;font:700 17px NotoSerif}}.hr span{{display:block;color:#5a4f40}}
.dot{{width:42px;height:42px;margin:8px auto}}.dot>i,.dot .k{{border-radius:50%}}
.hr b{{display:block;font:700 26px Corm}}.hr em{{font-style:normal;font-size:15px}}
.tide{{height:124px}}.tide .k{{padding:12px 16px}}
.tl{{display:flex;align-items:baseline;gap:14px}}.tl b{{font:900 24px NotoSerif}}.tl span{{font:600 16px NotoSerif}}
.tab{{position:absolute;left:0;right:0;bottom:0;height:86px;display:grid;grid-template-columns:repeat(4,1fr);border-top:3px solid {SUMI};background:{PAPER}}}
.tab span{{display:flex;align-items:center;justify-content:center;font:900 24px NotoSerif}}
.tab .on{{background:{AI};color:{FOAM}}}
</style>{web}{phone}'''
open('ui.html', 'w').write(html)
