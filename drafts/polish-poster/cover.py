"""波兰海报学派 · 第 0 帧（1920×1080）：一张正在“变”的海报。
一个侧脸（黑水粉平涂）、背后一轮奶油色的月亮；她的头发是一笔朱红的干笔，从后脑勺甩上去，笔尾散开——散开的鬃毛正卷成翅膀，
前面已经有几只鸟飞走了。整张只讲一个比喻：念头 = 飞走的鸟。动起来就是这一笔从后颈画上去、画到尾巴变成鸟。
python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png"""
from polish import *

W, H = 1920, 1080
s = []

# —— 底：钴蓝，横刷几遍 ——
s.append(f'<rect width="{W}" height="{H}" fill="{BLUE}"/>')
s.append(f'<rect width="{W}" height="{H}" filter="url(#ground)" opacity=".16"/>')
s.append(f'<rect width="{W}" height="{H}" filter="url(#ground2)" opacity=".1"/>')

# —— 月亮 ——
s.append(f'<circle cx="680" cy="660" r="360" fill="{CREAM}" filter="url(#gou)"/>')

# —— 念头：一笔朱红干笔，从头里升起来，越往上越散，散开的鬃毛卷成鸟 ——
plume = [(650, 720), (600, 600), (560, 480), (600, 370), (640, 270), (700, 230), (740, 170), (770, 120), (800, 96), (842, 88)]
PLUME = brush(plume, 190, RED, seed=3, n=70, dry=.55, taper=(.3, .5), bw=(3, 9), op=1)

# —— 侧脸：黑水粉平涂 ——
face = ('M520,1080 C520,980 500,900 470,840 C420,760 404,640 432,540 C470,392 580,306 700,302 C792,300 852,342 872,420 '
        'C884,468 882,500 892,530 C902,562 922,600 952,640 C962,656 946,670 920,670 C912,682 918,692 926,702 '
        'C931,713 916,719 905,722 C918,730 925,744 915,757 C905,772 902,792 902,804 C902,832 872,846 842,852 '
        'C820,872 814,924 830,1080Z')
s.append(f'<g transform="translate(0,110)"><path d="{face}" fill="{INK}" filter="url(#gou)"/>')
# 眼睛：一片奶油色的杏仁，黑瞳往右上看着鸟
s.append(f'<path d="M790,512 C815,488 855,486 880,505 C858,530 818,534 790,512Z" fill="{CREAM}" filter="url(#hand)"/>')
s.append(f'<circle cx="852" cy="502" r="15" fill="{INK}"/>')
s.append(f'<path d="M786,492 C820,470 860,468 888,486" fill="none" stroke="{CREAM}" stroke-width="5" stroke-linecap="round" filter="url(#hand)" opacity=".85"/>')
# 嘴唇一点红
s.append(f'<path d="M906,716 C914,712 922,714 926,720 C918,724 910,723 906,716Z" fill="{RED}"/></g>')
s.append(f'<g transform="translate(0,40)">{PLUME}')

# —— 鸟：笔尾的两撮鬃毛正卷成第一只的翅膀，后面几只已经飞走 ——
s.append(brush([(836, 92), (858, 30), (905, 26), (926, 84)], 38, RED, seed=8, n=22, dry=.35, taper=(.05, .35), bw=(2, 5), op=1))
s.append(brush([(926, 84), (946, 26), (992, 24), (1018, 76)], 34, RED, seed=9, n=20, dry=.5, taper=(.3, .5), bw=(2, 5), op=1))
s.append('</g>')
s.append(gull(1150, 150, 70, -10, RED))
s.append(gull(1330, 100, 58, -18, RED))
s.append(gull(1490, 200, 44, -4, CREAM))
s.append(gull(1630, 110, 34, -22, RED))
s.append(gull(1760, 180, 24, -8, CREAM))
s.append(gull(1430, 300, 28, 8, OCHRE))
s.append(gull(1850, 100, 16, -14, RED))

# —— 字：手写的大标题 ——
s.append(T(1060, 860, '波兰海报', 206, 'Hei', CREAM, weight=900, filt='hand'))
s.append(T(1066, 950, 'POLSKA SZKOŁA PLAKATU', 58, 'Lond', OCHRE, ls=4, filt='hand'))
s.append(T(1068, 1012, '1950 — 1980 · 一张海报，只讲一个比喻', 34, 'Kuai', CREAM, filt='hand'))
s.append(T(1130, 470, '念头', 64, 'Brush', CREAM, rot=-8, filt='hand'))
s.append(f'<path d="M1150,400 C1150,330 1130,290 1100,236 m-2,36 l-2,-36 l32,12" fill="none" stroke="{CREAM}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" filter="url(#hand)"/>')

# —— 标注 ——
s.append(f'<g font-family="Mono" font-size="20" fill="{CREAM}" opacity=".8"><text x="56" y="72">笔触 → 鸟 · 变形 0.62</text>'
         f'<text x="56" y="100">干笔 70 根鬃毛 · 尾部散开 55%</text></g>')

svg = (f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" style="position:absolute;left:0;top:0"><defs>{DEFS}</defs>'
       f'{"".join(s)}<rect width="{W}" height="{H}" filter="url(#paper)" style="mix-blend-mode:multiply"/></svg>')
open('cover.html', 'w').write(page(W, H, svg))
