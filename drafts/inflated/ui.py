"""膨胀风 · 落到网页和手机 App（1920×1080）。python3 ui.py && node ../_lib/shot.cjs ui.html png/ui.png
按钮、卡片、图标都用同一个“充气”滤镜；字放在上面，保持平的、好读。"""
from puff import puff_filter

PINK, LILAC, MINT, BUTTER, SKY, CORAL, INK = '#FF6FAE', '#A98BFF', '#4FDDB8', '#FFD45C', '#6FBEFF', '#FF8A6B', '#2B2350'
DEFS = f'<svg width="0" height="0" style="position:absolute"><defs>{puff_filter("p", 18, 12)}{puff_filter("pS", 9, 7)}{puff_filter("pXS", 5, 5, shine=.8)}</defs></svg>'


def blob(x, y, w, h, color, r=None, f='pS', extra=''):
    r = h / 2 if r is None else r
    return (f'<svg width="{w + 120}" height="{h + 140}" style="position:absolute;left:{x - 60}px;top:{y - 60}px;overflow:visible">'
            f'<rect x="60" y="60" width="{w}" height="{h}" rx="{r}" fill="{color}" filter="url(#{f})"/>{extra}</svg>')


def ptext(x, y, text, size, color, f='p', font='Bagel'):
    return (f'<svg width="1200" height="{size * 1.6:.0f}" style="position:absolute;left:{x - 60}px;top:{y - 60}px;overflow:visible">'
            f'<text x="60" y="{60 + size * 0.85:.0f}" font-family="{font}" font-size="{size}" fill="{color}" filter="url(#{f})">{text}</text></svg>')


def coin(cx, cy, r, col=BUTTER):
    return (f'<svg width="{2 * r + 140}" height="{2 * r + 160}" style="position:absolute;left:{cx - r - 70}px;top:{cy - r - 70}px;overflow:visible">'
            f'<circle cx="{r + 70}" cy="{r + 70}" r="{r}" fill="{col}" filter="url(#p)"/>'
            f'<text x="{r + 70}" y="{r + 70 + r * 0.38:.0f}" text-anchor="middle" font-family="Bagel" font-size="{r * 1.1:.0f}" fill="#E8A92A" filter="url(#pXS)">¥</text></svg>')


def heart(x, y, s, col=PINK):
    return (f'<svg width="{s * 3}" height="{s * 3}" style="position:absolute;left:{x}px;top:{y}px;overflow:visible"><g transform="scale({s / 100})">'
            f'<path d="M60,70 C60,20 130,10 140,60 C150,10 220,20 220,70 C220,130 140,170 140,170 C140,170 60,130 60,70Z" fill="{col}" filter="url(#pS)"/></g></svg>')


web = f'''
<div class="win" style="left:50px;top:65px;width:1250px;height:950px">
  <div class="chrome"><i></i><i></i><i></i><span>pocket.money</span></div>
  <div class="page">
    <div class="nav"><b class="logo">pocket.</b><span>Save</span><span>Split</span><span>Cards</span>
      <div class="navbtn">{blob(0, 0, 150, 52, INK, f='pXS')}<b>Get the app</b></div></div>
    {ptext(60, 150, 'Money,', 136, INK, 'p')}{ptext(60, 300, 'but squishy.', 136, PINK, 'p')}
    <p class="lead">Savings goals you can poke. Split the bill, fill the jar, watch it puff up. 给年轻人的第一个存钱罐。</p>
    <div class="cta">{blob(0, 0, 270, 84, '#F2509A')}<b>Start saving →</b></div>
    <div class="cta2">{blob(0, 0, 230, 84, '#FFFFFF')}<b style="color:{INK}">See how</b></div>
    {coin(980, 270, 110)}{coin(1130, 430, 70, '#FFC94A')}{heart(820, 420, 70, CORAL)}
    <div class="cards">
      <div class="card">{blob(0, 0, 350, 150, '#FFFFFF', r=46)}<div class="ct"><i style="background:{MINT}"></i><b>Round-ups</b><span>Spare change goes to your jar automatically.</span></div></div>
      <div class="card">{blob(0, 0, 350, 150, '#FFFFFF', r=46)}<div class="ct"><i style="background:{SKY}"></i><b>Split with friends</b><span>One tap, everyone pays their bit.</span></div></div>
      <div class="card">{blob(0, 0, 350, 150, '#FFFFFF', r=46)}<div class="ct"><i style="background:{BUTTER}"></i><b>0 fees</b><span>No minimums. No surprises.</span></div></div>
    </div>
  </div>
</div>'''

goals = [('Concert tickets', 72, PINK, '¥ 1,080 / 1,500'), ('New sneakers', 45, SKY, '¥ 405 / 900'), ('Tokyo trip', 18, MINT, '¥ 2,160 / 12,000')]
goal_html = ''.join(
    f'<div class="goal">{blob(0, 0, 400, 104, "#FFFFFF", r=34, f="pXS")}<div class="gt"><b>{n}</b><span>{m}</span>'
    f'<div class="track">{blob(0, 0, int(330 * p / 100), 18, c, f="pXS")}</div></div><em>{p}%</em></div>' for n, p, c, m in goals)
phone = f'''
<div class="phone" style="left:1390px;top:50px;width:470px;height:960px">
  <div class="screen">
    <div class="status"><span>9:41</span><span>100%</span></div>
    <div class="hi">Hi Mia 👋<br><small>Your jar this month</small></div>
    <div class="jar">
      <svg width="320" height="320" style="position:absolute;left:-40px;top:-40px;overflow:visible">
        <circle cx="160" cy="160" r="110" fill="none" stroke="#EDE4FF" stroke-width="40" filter="url(#pXS)"/>
        <path d="M160,50 A110,110 0 1,1 55,195" fill="none" stroke="{LILAC}" stroke-width="40" stroke-linecap="round" filter="url(#pS)"/>
      </svg><div class="amt">¥3,645<small>+¥120 this week</small></div></div>
    {goal_html}
    <div class="tabbar">{blob(0, 0, 400, 78, INK, f='pXS')}<div class="tabs"><span class="on">Jar</span><span>Split</span><span style="width:90px"></span><span>Cards</span><span>Me</span></div></div>
    <div class="fab">{blob(0, 0, 84, 84, PINK, f='pS')}<b>+</b></div>
  </div>
</div>'''

html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Bagel;src:url(../../public/fonts/BagelFatOne-Regular.ttf)}}
@font-face{{font-family:Inter;src:url(../../public/fonts/Inter.ttf);font-weight:100 900}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Bold.otf);font-weight:700}}
html,body{{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:Inter,NotoSC;color:{INK};background:radial-gradient(circle at 40% 30%,#FFF3FA,#E7DBFF 70%,#D2C1FF)}}
.win{{position:absolute;overflow:hidden;border-radius:22px;background:#FBF7FF;box-shadow:0 30px 70px #6B4FD633}}
.chrome{{height:44px;background:#F1EAFB;display:flex;align-items:center;gap:8px;padding:0 18px}}
.chrome i{{width:13px;height:13px;border-radius:50%;background:#DCCFF2}}
.chrome span{{margin-left:20px;background:#fff;border-radius:10px;padding:5px 16px;font-size:14px;color:#7a6fa0;width:420px}}
.page{{position:relative;height:906px}}
.nav{{position:relative;height:84px;display:flex;align-items:center;gap:34px;padding:0 40px;font-weight:700;font-size:17px;color:#6a5fa0}}
.nav span:first-of-type{{margin-left:auto}}
.logo{{font:400 42px Bagel;color:{LILAC};text-shadow:0 3px 0 #7d63e0,0 8px 14px #6B4FD655}}
.navbtn{{position:relative;width:150px;height:52px}}.navbtn b{{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px}}
.lead{{position:absolute;left:62px;top:500px;width:620px;font-size:21px;line-height:1.55;color:#5c5385;margin:0}}
.cta,.cta2{{position:absolute;top:600px;height:84px}}.cta{{left:62px;width:270px}}.cta2{{left:360px;width:230px}}
.cta b,.cta2 b{{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:21px;font-weight:800}}
.cards{{position:absolute;left:62px;top:740px;display:flex;gap:28px}}
.card{{position:relative;width:350px;height:130px}}
.ct{{position:absolute;left:28px;top:24px;right:24px}}.ct i{{display:block;width:30px;height:30px;border-radius:10px;margin-bottom:10px}}
.ct b{{font-size:20px}}.ct span{{display:block;font-size:15px;color:#7a6fa0;margin-top:4px}}
.phone{{position:absolute;border-radius:62px;background:#fff;padding:14px;box-sizing:border-box;box-shadow:0 30px 70px #6B4FD644,inset 0 0 0 2px #EDE4FF}}
.screen{{position:relative;width:100%;height:100%;border-radius:50px;overflow:hidden;background:#F6F0FF}}
.status{{display:flex;justify-content:space-between;padding:16px 40px 0;font-weight:700;font-size:16px}}
.hi{{padding:20px 30px 0;font-size:30px;font-weight:900}}.hi small{{font-size:16px;font-weight:600;color:#7a6fa0}}
.jar{{position:relative;width:240px;height:240px;margin:24px auto 18px}}
.amt{{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font:400 44px Bagel;color:{INK}}}.amt small{{font:700 14px Inter;color:{MINT};margin-top:4px}}
.goal{{position:relative;height:104px;margin:0 21px 16px}}
.gt{{position:absolute;left:24px;top:16px;right:90px}}.gt b{{font-size:18px}}.gt span{{display:block;font-size:13px;color:#7a6fa0;margin:2px 0 10px}}
.track{{position:relative;height:18px;width:330px;border-radius:9px;background:#EFE8FB}}
.goal em{{position:absolute;right:22px;top:20px;font:400 24px Bagel;font-style:normal;color:{INK}}}
.tabbar{{position:absolute;left:21px;bottom:22px;width:400px;height:78px}}
.tabs{{position:absolute;inset:0;display:flex;align-items:center;justify-content:space-between;padding:0 30px;color:#ffffffaa;font-weight:800;font-size:15px}}.tabs .on{{color:#fff}}
.fab{{position:absolute;left:179px;bottom:68px;width:84px;height:84px}}.fab b{{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font:400 44px Bagel}}
</style>{DEFS}{web}{phone}'''
open('ui.html', 'w').write(html)
