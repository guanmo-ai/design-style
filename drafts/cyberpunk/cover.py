"""赛博朋克 · 第 0 帧（1920×1080）：雨夜街口，霓虹招牌刚“噼”地点亮，画面正被横向撕开、红青错位。
python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png"""
import random

W, H = 1920, 1080
HZ = 760                       # 地面线：下面是湿地面的倒影
PINK, CYAN, YEL, NIGHT = '#FF2E97', '#20F2FF', '#F4FF3A', '#07060F'
rng = random.Random(7)


def windows(x, y, w, h, cw=14, ch=10, gx=10, gy=12, p=0.22, cols=('#FFB86B', '#7FE9FF', '#FF7AC6')):
    out = []
    yy = y + 14
    while yy < y + h - ch:
        xx = x + 10
        while xx < x + w - cw:
            if rng.random() < p:
                out.append(f'<rect x="{xx}" y="{yy}" width="{cw}" height="{ch}" fill="{rng.choice(cols)}" opacity="{rng.uniform(.35, .9):.2f}"/>')
            xx += cw + gx
        yy += ch + gy
    return ''.join(out)


far = ''.join(f'<rect x="{x}" y="{HZ - h}" width="{w}" height="{h}" fill="#1A1033"/>' + windows(x, HZ - h, w, h, 6, 5, 8, 9, 0.18)
              for x, w, h in [(560, 120, 430), (690, 90, 560), (790, 150, 380), (950, 110, 640), (1070, 160, 470), (1240, 100, 540)])
near = ('<path d="M0,0 H420 V760 H0Z" fill="#0E0A1C"/>' + windows(0, 0, 420, 760, 22, 14, 18, 26, 0.16)
        + '<path d="M1480,0 H1920 V760 H1480Z" fill="#0E0A1C"/>' + windows(1480, 0, 440, 760, 22, 14, 18, 26, 0.16))

# 竖排招牌
def vsign(x, y, text, col, frame, size=96, w=150):
    h = len(text) * size * 1.12 + 50
    chars = ''.join(f'<text x="{x + w / 2}" y="{y + 40 + (i + 0.82) * size * 1.12}" text-anchor="middle" font-family="NotoSC" font-weight="900" font-size="{size}" fill="{col}">{c}</text>' for i, c in enumerate(text))
    box = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="#140A20" stroke="{frame}" stroke-width="7"/>'
    return box, chars, h


box1, ch1, h1 = vsign(150, 70, '赛博朋克', PINK, CYAN, size=82, w=130)
box2, ch2, h2 = vsign(1630, 120, '夜市', CYAN, PINK, size=78, w=120)
open24 = f'<text x="1690" y="{120 + h2 + 64}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="48" fill="{YEL}">24H</text>'

title = (f'<text x="960" y="660" text-anchor="middle" font-family="Inter" font-weight="900" font-size="178" letter-spacing="6" '
         f'fill="none" stroke="{CYAN}" stroke-width="7" stroke-linejoin="round">CYBERPUNK</text>')
sub = f'<text x="960" y="728" text-anchor="middle" font-family="Inter" font-weight="700" font-size="30" letter-spacing="18" fill="{PINK}">1982 → 2077</text>'

small = ''.join(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="#140A20" stroke="{c}" stroke-width="4"/>'
                f'<text x="{x + w / 2}" y="{y + h * 0.72}" text-anchor="middle" font-family="{f}" font-weight="900" font-size="{h * 0.62:.0f}" fill="{c}">{t}</text>'
                for x, y, w, h, t, c, f in [(1500, 480, 150, 64, '拉面', YEL, 'NotoSC'), (1690, 560, 170, 56, 'BAR', PINK, 'Inter'),
                                            (300, 520, 110, 56, '电玩', CYAN, 'NotoSC'), (20, 600, 120, 50, 'HOTEL', YEL, 'Inter')])
signs = f'''<g filter="url(#glowS)">{small}</g>
<g filter="url(#glowS)">{box1}{box2}</g>
<g filter="url(#glowL)">{ch1}{ch2}{open24}</g>
<g filter="url(#glowL)">{title}</g>
<g filter="url(#glowS)">{sub}</g>'''

rain = ''.join(f'<line x1="{x:.0f}" y1="{y:.0f}" x2="{x - 10:.0f}" y2="{y + L:.0f}" stroke="#BFEFFF" stroke-opacity="{rng.uniform(.12, .45):.2f}" stroke-width="{rng.choice([1, 1, 1.5, 2])}"/>'
               for x, y, L in ((rng.uniform(0, W + 60), rng.uniform(-60, H), rng.uniform(30, 80)) for _ in range(520)))

scene = f'''
<rect width="{W}" height="{H}" fill="url(#sky)"/>
<ellipse cx="960" cy="{HZ}" rx="900" ry="260" fill="{PINK}" opacity=".18" filter="url(#haze)"/>
{far}{near}
{signs}
'''
# 撕开的一条：同一画面在一条横带里整体右移，再把红、青两色错开
band_y, band_h = 572, 62
glitch = f'''
<clipPath id="band"><rect x="0" y="{band_y}" width="{W}" height="{band_h}"/></clipPath>
<g clip-path="url(#band)">
  <rect x="0" y="{band_y}" width="{W}" height="{band_h}" fill="{NIGHT}"/>
  <g transform="translate(64,0)" filter="url(#chanR)" style="mix-blend-mode:screen"><use href="#scene"/></g>
  <g transform="translate(40,0)" filter="url(#chanC)" style="mix-blend-mode:screen"><use href="#scene"/></g>
</g>
<rect x="0" y="{band_y + band_h - 3}" width="{W}" height="3" fill="{CYAN}" opacity=".6"/>
<clipPath id="band2"><rect x="0" y="{band_y - 210}" width="{W}" height="16"/></clipPath>
<g clip-path="url(#band2)"><g transform="translate(-90,0)"><use href="#scene"/></g></g>
'''

svg = f'''<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="position:absolute;left:0;top:0">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06040D"/><stop offset=".55" stop-color="#1A0A33"/><stop offset=".7" stop-color="#3A0F4A"/><stop offset=".7" stop-color="#0B0714"/><stop offset="1" stop-color="#05040A"/></linearGradient>
  <filter id="haze" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="80"/></filter>
  <filter id="glowL" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur in="SourceGraphic" stdDeviation="16" result="b1"/><feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b2"/>
    <feColorMatrix in="SourceGraphic" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0" result="core"/>
    <feMerge><feMergeNode in="b1"/><feMergeNode in="b1"/><feMergeNode in="b2"/><feMergeNode in="SourceGraphic"/><feMergeNode in="core"/></feMerge></filter>
  <filter id="glowS" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="chanR"><feColorMatrix values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter>
  <filter id="chanC"><feColorMatrix values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"/></filter>
  <filter id="wet" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".004 .09" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="34" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation="3 6"/></filter>
  <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <mask id="fadeM"><rect x="0" y="{HZ}" width="{W}" height="{H - HZ}" fill="url(#fade)"/></mask>
  <g id="scene">{scene}</g>
</defs>
<use href="#scene"/>
<!-- 湿地面：整幅倒过来、被水波扯开、越远越淡 -->
<g mask="url(#fadeM)"><g filter="url(#wet)"><g transform="translate(0,{2 * HZ}) scale(1,-1)"><use href="#scene"/></g></g></g>
<rect x="0" y="{HZ}" width="{W}" height="2" fill="{PINK}" opacity=".5"/>
{glitch}
<g>{rain}</g>
</svg>'''

html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Inter;src:url(../../public/fonts/Inter.ttf);font-weight:100 900}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Black.otf);font-weight:900}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Bold.otf);font-weight:700}}
html,body{{margin:0;width:{W}px;height:{H}px;overflow:hidden;background:{NIGHT}}}
.hud{{position:absolute;font:600 18px Inter;letter-spacing:.2em;color:{CYAN};text-shadow:0 0 8px {CYAN}}}
</style>{svg}
<div class="hud" style="left:40px;top:30px">REC ● 23:47:09 · NEO-SHANGHAI</div>
<div class="hud" style="right:40px;top:30px;color:{PINK};text-shadow:0 0 8px {PINK}">SIGNAL ▮▮▮▯ 87%</div>
<div class="hud" style="left:40px;bottom:30px;font-family:NotoSC;font-weight:700;letter-spacing:.3em;color:#fff;text-shadow:0 0 10px {PINK}">赛博朋克 · 高科技，低生活</div>
'''
open('cover.html', 'w').write(html)
