"""Isotype · 第 0 帧（1920×1080）：世界人口，一个人形 = 1 亿人。
1930 年 20.7 个、2025 年 82.3 个，两堆人形本身就是柱状图；最后几个人形正一个接一个“盖章”落进虚线格。
python3 cover.py && node ../_lib/shot.cjs cover.html png/cover.png"""
from picto import BLUE, INK, PAPER, RED, defs, size

W, H = 1920, 1080
FH = 96
FW = size('man', FH)
SX, SY = FW * 1.32, FH * 1.22   # 格距
BASE = 965                      # 底线


def block(n, cols, x0, color, flying=0):
    """从底行往上堆，每行从左往右。最后 flying 个还在空中：越晚的越高。"""
    out = []
    full = int(n)
    slots = full + (1 if n > full else 0)
    for i in range(slots):
        r, c = divmod(i, cols)
        x = x0 + c * SX
        y = BASE - (r + 1) * SY + (SY - FH)
        frac = min(1, n - i)
        k = i - (full - flying)
        if 0 <= k < flying and frac == 1:
            lift = (k + 1) * 26 + k * k * 2.5
            out.append(f'<rect x="{x - 4:.1f}" y="{y - 4:.1f}" width="{FW + 8:.1f}" height="{FH + 8:.1f}" fill="none" stroke="{color}" stroke-width="2.5" stroke-dasharray="7 6" opacity=".75"/>')
            out.append(f'<use href="#man" x="{x:.1f}" y="{y - lift:.1f}" width="{FW:.1f}" height="{FH:.1f}" fill="{color}"/>')
        elif frac < 1:
            out.append(f'<clipPath id="cp{i}{color[1:]}"><rect x="{x:.1f}" y="{y - 2:.1f}" width="{FW * frac:.1f}" height="{FH + 4:.1f}"/></clipPath>'
                       f'<g clip-path="url(#cp{i}{color[1:]})"><use href="#man" x="{x:.1f}" y="{y:.1f}" width="{FW:.1f}" height="{FH:.1f}" fill="{color}"/></g>')
        else:
            out.append(f'<use href="#man" x="{x:.1f}" y="{y:.1f}" width="{FW:.1f}" height="{FH:.1f}" fill="{color}"/>')
    return ''.join(out)


LX, RX = 560, 1000
svg = f'''<svg width="{W}" height="{H}" style="position:absolute;left:0;top:0">{defs()}
<rect width="{W}" height="{H}" fill="{PAPER}"/>
{block(20.7, 7, LX, BLUE)}
{block(82.3, 14, RX, RED, flying=7)}
<line x1="{LX - 20}" x2="{RX + 14 * SX}" y1="{BASE + 8}" y2="{BASE + 8}" stroke="{INK}" stroke-width="4"/>
<use href="#man" x="62" y="372" width="{FW:.1f}" height="{FH:.1f}" fill="{INK}"/>
</svg>'''
html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:Jost;src:url(../../public/fonts/Jost.ttf);font-weight:100 900}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Black.otf);font-weight:900}}
@font-face{{font-family:NotoSC;src:url(../../public/fonts/NotoSansSC-Bold.otf);font-weight:700}}
html,body{{margin:0;width:{W}px;height:{H}px;overflow:hidden;color:{INK}}}
.a{{position:absolute}}
.yr{{position:absolute;top:{BASE + 22}px;font:700 40px Jost}}
</style>{svg}
<div class="a" style="left:56px;top:50px;font:800 132px/1 Jost">ISOTYPE</div>
<div class="a" style="left:62px;top:196px;font:700 34px NotoSC">图形统计 · 维也纳 1925—1934</div>
<div class="a" style="left:62px;top:252px;font:900 30px/1.6 NotoSC;color:#3a362f">世界人口，1930 → 2025</div>
<div class="a" style="left:124px;top:392px;font:900 46px/1.1 NotoSC">= 1 亿人</div>
<div class="a" style="left:126px;top:448px;font:600 18px Jost;letter-spacing:.14em;color:#6a6252">ONE FIGURE = 100 M</div>
<div class="a" style="left:62px;top:560px;width:430px;font:700 25px/1.65 NotoSC;color:#3a362f">一个图形永远代表同一个数。<br>多了就多摆几个，<br>绝不把图形放大；<br>不满一个，就切掉一截。</div>
<div class="yr" style="left:{LX}px;color:{BLUE}">1930 · 20.7 亿</div>
<div class="yr" style="left:{RX}px;color:{RED}">2025 · 82.3 亿</div>
<div class="a" style="right:60px;top:{BASE + 34}px;font:600 16px NotoSC;color:#7a7262">数据：联合国《世界人口展望 2024》，约数</div>
'''
open('cover.html', 'w').write(html)
