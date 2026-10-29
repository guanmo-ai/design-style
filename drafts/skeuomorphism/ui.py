"""拟物 · 落到网页和手机 App（1920×1080）。python3 ui.py && node ../_lib/shot.cjs ui.html png/ui.png"""
import math

from common import FONTS, leather, stitch


def ticks(r0, r1, n=11, a0=-135, a1=135, col='#3b3f45', size=150):
    c = size / 2
    out = []
    for i in range(n):
        a = math.radians(a0 + (a1 - a0) * i / (n - 1) - 90)
        out.append(f'<line x1="{c + r0 * math.cos(a):.1f}" y1="{c + r0 * math.sin(a):.1f}" x2="{c + r1 * math.cos(a):.1f}" y2="{c + r1 * math.sin(a):.1f}" stroke="{col}" stroke-width="2.4" stroke-linecap="round"/>')
    return f'<svg class="tk" width="{size}" height="{size}">{"".join(out)}</svg>'


def knob(label, ang, x, y):
    return (f'<div class="kw" style="left:{x}px;top:{y}px">{ticks(58, 68)}<div class="knob"><div class="cap" style="transform:rotate({ang}deg)"><i></i></div></div>'
            f'<div class="eng">{label}</div></div>')


def toggle(label, on, x, y):
    return (f'<div class="tw" style="left:{x}px;top:{y}px"><div class="plate2"><div class="bat {"up" if on else "dn"}"></div></div>'
            f'<div class="eng">{label}</div><b class="led {"on" if on else ""}"></b></div>')


def vu(x, y, w, h, ang):
    # 表盘：奶油色底、弧形刻度、红区、指针、玻璃反光
    cx, cy, r = w / 2, h * 1.02, h * 0.82
    sc = []
    for i in range(21):
        a = math.radians(-50 + i * 5 - 90)
        red = i >= 15
        r1 = r - (14 if i % 5 == 0 else 8)
        sc.append(f'<line x1="{cx + r * math.cos(a):.1f}" y1="{cy + r * math.sin(a):.1f}" x2="{cx + r1 * math.cos(a):.1f}" y2="{cy + r1 * math.sin(a):.1f}" stroke="{"#c0392b" if red else "#2b2b2b"}" stroke-width="{2.4 if i % 5 == 0 else 1.6}"/>')
    arc = lambda a0, a1, col, sw: (f'<path d="M{cx + r * math.cos(math.radians(a0 - 90)):.1f},{cy + r * math.sin(math.radians(a0 - 90)):.1f} '
                                   f'A{r},{r} 0 0 1 {cx + r * math.cos(math.radians(a1 - 90)):.1f},{cy + r * math.sin(math.radians(a1 - 90)):.1f}" fill="none" stroke="{col}" stroke-width="{sw}"/>')
    na = math.radians(ang - 90)
    needle = f'<line x1="{cx:.1f}" y1="{cy:.1f}" x2="{cx + (r + 6) * math.cos(na):.1f}" y2="{cy + (r + 6) * math.sin(na):.1f}" stroke="#1a1a1a" stroke-width="2.6"/>'
    shadow = f'<line x1="{cx + 5:.1f}" y1="{cy + 3:.1f}" x2="{cx + 5 + (r + 6) * math.cos(na):.1f}" y2="{cy + 7 + (r + 6) * math.sin(na):.1f}" stroke="#0003" stroke-width="3"/>'
    return (f'<div class="vu" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"><svg width="{w}" height="{h}">'
            + arc(-50, 25, '#2b2b2b', 1.6) + arc(25, 50, '#c0392b', 6) + ''.join(sc)
            + f'<text x="{cx}" y="{h * 0.62}" text-anchor="middle" font-family="Heros" font-weight="700" font-size="{h * 0.16:.0f}" fill="#2b2b2b">VU</text>'
            + shadow + needle + '</svg><i class="glass"></i></div>')


def keys(x, y, n=15, w=50, h=170):
    out = [f'<div class="wk" style="left:{i * w}px;width:{w - 2}px;height:{h}px"></div>' for i in range(n)]
    for i in range(n - 1):
        if i % 7 in (0, 1, 3, 4, 5):
            out.append(f'<div class="bk" style="left:{i * w + w * 0.66}px;width:{w * 0.62}px;height:{h * 0.6}px"></div>')
    out.append(f'<div class="wk press" style="left:{4 * w}px;width:{w - 2}px;height:{h}px"></div>')
    return f'<div class="keys" style="left:{x}px;top:{y}px;width:{n * w}px;height:{h}px">{"".join(out)}</div>'


def reel(x, y, s, ang):
    sp = ''.join(f'<i class="spoke" style="transform:rotate({ang + k * 120}deg)"></i>' for k in range(3))
    return f'<div class="reel" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px"><div class="tape" style="inset:{s * 0.08}px"></div><div class="hub">{sp}<b></b></div></div>'


# ---------- 网页：一台“看得见摸得着”的合成器 ----------
dev = f'''<div class="device">
  <div class="cheek l"></div><div class="cheek r"></div>
  <div class="panel">
    <div class="brand">REEL·ONE <small>ANALOG POCKET SYNTH</small></div>
    {knob("VOLUME", 40, 30, 70)}{knob("CUTOFF", -60, 185, 70)}{knob("RESONANCE", 95, 340, 70)}{knob("DECAY", -10, 495, 70)}
    {toggle("SYNC", True, 660, 92)}{toggle("DRIVE", False, 745, 92)}
    {vu(846, 66, 166, 128, 18)}
    {keys(40, 270, n=21, w=46, h=210)}
  </div>
</div>'''
web = f'''
<div class="win" style="left:50px;top:65px;width:1250px;height:950px">
  <div class="chrome"><i></i><i></i><i></i><span>reel.studio</span></div>
  <div class="page">
    <div class="nav"><b class="logo">Reel Studio</b><span>Instruments</span><span>Sounds</span><span>Pricing</span><em class="gbtn">Try it free</em></div>
    <div class="hero"><h1>Gear you want to touch.</h1><p>Knobs that click into place, switches that snap, a needle that swings. 在浏览器里，也像真的一样。</p></div>
    {dev}
  </div>
</div>'''

# ---------- 手机：卷盘录音机 ----------
phone = f'''
<div class="phone" style="left:1390px;top:50px;width:470px;height:960px">
  <div class="screen">
    <div class="lthp">{leather(442, 170, seed=5)}{stitch(14, 50, 414, 104, 10)}<div class="pt">Voice Memo</div><div class="status"><span>9:41</span><span>100%</span></div></div>
    <div class="deck">
      <div class="window">{reel(16, 20, 170, 12)}{reel(226, 20, 170, 70)}<div class="tapeline"></div><i class="glass2"></i></div>
      <div class="counter"><b>0</b><b>2</b><s>:</s><b>4</b><b>1</b></div>
      {vu(32, 300, 180, 120, -8).replace('class="vu"', 'class="vu sm"')}{vu(232, 300, 180, 120, 6).replace('class="vu"', 'class="vu sm"')}
      <div class="btnrow"><div class="sq">■</div><div class="rec"><i></i></div><div class="sq">❚❚</div></div>
    </div>
    <div class="memo"><div class="mr"><b>Kitchen idea</b><span>0:48</span></div><div class="mr"><b>Chorus — take 3</b><span>2:41</span></div></div>
  </div>
</div>'''

html = f'''<!doctype html><meta charset="utf-8"><style>{FONTS}
html,body{{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:Inter,NotoSC,sans-serif}}
body{{background:#4a4f56 radial-gradient(circle at 40% 30%,#6b7179,#2c3036)}}
.win{{position:absolute;border-radius:12px;overflow:hidden;box-shadow:0 40px 80px #0009}}
.chrome{{height:44px;background:linear-gradient(#ececec,#cfcfcf);border-bottom:1px solid #9a9a9a;display:flex;align-items:center;gap:8px;padding:0 18px}}
.chrome i{{width:13px;height:13px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#ff8a80,#d93a2f);box-shadow:0 1px 1px #0005}}
.chrome i+i{{background:radial-gradient(circle at 40% 35%,#ffe28a,#d9a12f)}}.chrome i+i+i{{background:radial-gradient(circle at 40% 35%,#a8f08a,#4fae3a)}}
.chrome span{{margin-left:20px;background:#fff;border-radius:6px;padding:4px 16px;font-size:14px;color:#555;width:420px;box-shadow:0 1px 2px #0003 inset}}
.page{{position:relative;height:906px;background:#ddd6c8;
  background-image:repeating-linear-gradient(0deg,#0000 0 2px,#ffffff2a 2px 3px),repeating-linear-gradient(90deg,#0000 0 2px,#00000010 2px 3px)}}
.nav{{height:74px;display:flex;align-items:center;gap:34px;padding:0 44px;font-size:17px;font-weight:600;color:#5a5144;text-shadow:0 1px 0 #fff8}}
.logo{{font:700 30px Heros;color:#4a4136;margin-right:auto;text-shadow:0 1px 0 #fff,0 -1px 0 #0003}}
.gbtn{{font-style:normal;color:#fff;padding:11px 24px;border-radius:9px;border:1px solid #1d4e9a;text-shadow:0 -1px 0 #0005;
  background:linear-gradient(180deg,#7fb1ff,#3a7ee8 50%,#2a6ad6 51%,#3f86f0);box-shadow:0 1px 0 #ffffff80 inset,0 2px 4px #0004}}
.hero{{text-align:center;padding:14px 0 0}}
.hero h1{{margin:0;font:700 62px Heros;color:#4a4136;letter-spacing:-.01em;text-shadow:0 2px 0 #fff,0 -1px 0 #0004}}
.hero p{{margin:12px 0 0;font-size:20px;color:#6d6252;text-shadow:0 1px 0 #fff9}}
.device{{position:absolute;left:44px;right:44px;top:250px;height:530px}}
.cheek{{position:absolute;top:0;bottom:0;width:58px;border-radius:14px;
  background:repeating-linear-gradient(92deg,#6b3b1e 0 3px,#7d4826 3px 7px,#5e3218 7px 9px,#874f2a 9px 15px),linear-gradient(#000,#000);
  box-shadow:0 2px 0 #ffffff30 inset,0 -3px 6px #0006 inset,0 20px 30px #0007}}
.cheek.l{{left:0}}.cheek.r{{right:0}}
.panel{{position:absolute;left:58px;right:58px;top:6px;bottom:6px;border-radius:4px;
  background:repeating-linear-gradient(90deg,#ffffff1a 0 1px,#0000 1px 2px,#00000010 2px 3px),linear-gradient(180deg,#e9ecef,#c4c9ce 60%,#b2b8be);
  box-shadow:0 1px 0 #fff inset,0 -2px 0 #0003 inset,0 16px 26px #0006}}
.brand{{position:absolute;left:40px;top:20px;font:700 22px Heros;letter-spacing:.18em;color:#565b62;text-shadow:0 1px 0 #fff,0 -1px 0 #0004}}
.brand small{{font-size:13px;letter-spacing:.24em;margin-left:12px;color:#7a8088}}
.kw{{position:absolute;width:150px;height:186px}}
.tk{{position:absolute;left:0;top:0}}
.knob{{position:absolute;left:23px;top:23px;width:104px;height:104px;border-radius:50%;
  background:repeating-conic-gradient(#3a3d42 0 4deg,#1b1d20 4deg 8deg);box-shadow:0 10px 14px #0007,0 3px 4px #0006}}
.cap{{position:absolute;inset:9px;border-radius:50%;background:radial-gradient(circle at 50% 30%,#fafbfc,#cfd3d8 45%,#9aa0a7 80%,#7b8188);
  box-shadow:0 1px 1px #fff inset,0 -2px 3px #0004 inset}}
.cap:before{{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,#fff0,#ffffff70 10%,#fff0 22%,#fff0 50%,#ffffff60 60%,#fff0 72%)}}
.cap i{{position:absolute;left:calc(50% - 3px);top:6px;width:6px;height:26px;border-radius:3px;background:#e2513f;box-shadow:0 1px 0 #fff8}}
.eng{{position:absolute;left:0;right:0;bottom:0;text-align:center;font:700 14px Heros;letter-spacing:.2em;color:#5d636b;text-shadow:0 1px 0 #fff}}
.tw{{position:absolute;width:80px;height:150px}}
.plate2{{position:absolute;left:14px;top:22px;width:52px;height:52px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fff,#aeb3b9 60%,#7e848b);box-shadow:0 4px 6px #0006}}
.bat{{position:absolute;left:19px;width:14px;height:58px;border-radius:7px;background:linear-gradient(90deg,#8d939a,#ffffff 40%,#a9afb5 70%,#6d737a);box-shadow:0 8px 8px #0005}}
.bat.up{{top:-32px}}.bat.dn{{top:26px}}
.led{{position:absolute;left:34px;top:96px;width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#9a6a62,#4a2420)}}
.led.on{{background:radial-gradient(circle at 40% 35%,#fff,#ff4a3a 40%,#a1180c);box-shadow:0 0 14px 3px #ff3b2b99}}
.tw .eng{{bottom:12px}}
.vu{{position:absolute;border-radius:10px;background:linear-gradient(#f6ecd0,#e7d8af);box-shadow:0 0 0 6px #2a2c30,0 0 0 7px #000,0 3px 0 7px #ffffff40,0 2px 6px #0006 inset;overflow:hidden}}
.vu svg{{position:absolute;inset:0}}
.vu .glass{{position:absolute;inset:0;background:linear-gradient(160deg,#ffffff70 0 30%,#fff0 31%)}}
.keys{{position:absolute}}
.wk{{position:absolute;top:0;border-radius:0 0 6px 6px;background:linear-gradient(180deg,#d9d9d9,#fff 12%,#f4f4f4 85%,#ddd);box-shadow:0 1px 0 #fff inset,0 -5px 0 #cfcfcf inset,0 4px 6px #0005}}
.wk.press{{background:linear-gradient(180deg,#bdbdbd,#ececec 14%,#e2e2e2);box-shadow:0 -2px 0 #cfcfcf inset,0 1px 2px #0005;transform:translateY(3px)}}
.bk{{position:absolute;top:0;z-index:2;border-radius:0 0 5px 5px;background:linear-gradient(180deg,#111,#3a3a3a 80%,#222);box-shadow:0 -6px 0 #000 inset,0 5px 6px #0007,1px 0 0 #555 inset}}
.phone{{position:absolute;border-radius:62px;background:linear-gradient(135deg,#d8dbe0,#9aa0a7);padding:14px;box-sizing:border-box;box-shadow:0 40px 80px #000a,0 0 0 2px #ffffff60 inset}}
.screen{{position:relative;width:100%;height:100%;border-radius:50px;overflow:hidden;
  background:repeating-linear-gradient(90deg,#ffffff1c 0 1px,#0000 1px 2px,#0000000e 2px 3px),linear-gradient(180deg,#d7dbe0,#b4bac1)}}
.lthp{{position:relative;height:170px;overflow:hidden;box-shadow:0 6px 10px #0006}}
.pt{{position:absolute;left:0;right:0;top:86px;text-align:center;font:700 32px Heros;color:#f1e3c4;text-shadow:0 -1px 0 #000a,0 1px 0 #ffffff30}}
.lthp .status{{position:absolute;left:44px;right:44px;top:16px;display:flex;justify-content:space-between;font:600 15px Inter;color:#f1e3c4}}
.deck{{position:relative;height:620px}}
.window{{position:absolute;left:14px;right:14px;top:22px;height:212px;border-radius:16px;background:linear-gradient(#26282b,#141517);box-shadow:0 2px 6px #000a inset,0 1px 0 #fff}}
.reel{{position:absolute;border-radius:50%;background:radial-gradient(circle,#0000 34%,#c9ccd0 35%,#eef0f2 60%,#9ca2a8 100%);box-shadow:0 6px 10px #000a}}
.tape{{position:absolute;border-radius:50%;background:radial-gradient(circle,#0000 40%,#4a2c1c 41%,#2e1a10 100%)}}
.reel:nth-child(2) .tape{{inset:30px !important}}
.hub{{position:absolute;inset:30%;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fff,#a7adb3)}}
.spoke{{position:absolute;left:calc(50% - 6px);top:4px;width:12px;height:calc(50% - 4px);transform-origin:50% 100%;background:#23252a;border-radius:6px}}
.hub b{{position:absolute;inset:40%;border-radius:50%;background:#333}}
.tapeline{{position:absolute;left:100px;right:100px;top:188px;height:6px;background:#3a2214}}
.glass2{{position:absolute;inset:0;border-radius:16px;background:linear-gradient(170deg,#ffffff38 0 24%,#fff0 25%)}}
.counter{{position:absolute;left:50%;transform:translateX(-50%);top:250px;display:flex;gap:4px;padding:6px 10px;border-radius:8px;background:#1c1d20;box-shadow:0 1px 0 #fff,0 2px 4px #000 inset}}
.counter b{{width:30px;height:40px;border-radius:4px;background:linear-gradient(#f6f6f6,#d6d6d6 50%,#c4c4c4 51%,#ececec);font:700 28px/40px Heros;color:#222;text-align:center;box-shadow:0 2px 3px #0008 inset}}
.counter b.roll{{background:linear-gradient(#f6f6f6,#d6d6d6 50%,#c4c4c4 51%,#ececec);line-height:24px;overflow:hidden;color:#222}}
.counter s{{text-decoration:none;color:#ddd;font:700 26px/40px Heros}}
.vu.sm{{box-shadow:0 0 0 5px #2a2c30,0 2px 5px #0006 inset}}
.btnrow{{position:absolute;left:0;right:0;top:470px;display:flex;justify-content:center;align-items:center;gap:40px}}
.sq{{width:74px;height:74px;border-radius:50%;background:radial-gradient(circle at 50% 30%,#5a5d63,#1c1d20);box-shadow:0 6px 10px #0008,0 1px 0 #ffffff50 inset;color:#ddd;font-size:22px;display:flex;align-items:center;justify-content:center}}
.rec{{width:112px;height:112px;border-radius:50%;background:linear-gradient(#e9ecef,#9aa0a7);box-shadow:0 10px 16px #0008;display:flex;align-items:center;justify-content:center}}
.rec i{{width:84px;height:84px;border-radius:50%;background:radial-gradient(circle at 50% 28%,#ff9a8a,#e3261b 45%,#9c0f08);box-shadow:0 2px 3px #0007 inset,0 0 18px #ff302080}}
.rec i:after{{content:"";display:block;margin:6px auto 0;width:58px;height:30px;border-radius:30px 30px 20px 20px;background:linear-gradient(#ffffffa0,#fff0)}}
.memo{{position:absolute;left:14px;right:14px;bottom:20px;border-radius:12px;background:#FBEFA6;
  background-image:repeating-linear-gradient(180deg,#0000 0 43px,#9EB7D6 43px 45px);box-shadow:0 4px 8px #0005;padding:0 18px}}
.mr{{display:flex;justify-content:space-between;height:45px;line-height:48px;font-size:19px;color:#3b2a1e}}
.mr b{{font-family:Caveat;font-size:30px}}
</style>{web}{phone}'''
open('ui.html', 'w').write(html)
