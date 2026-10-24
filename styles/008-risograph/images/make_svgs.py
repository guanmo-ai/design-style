"""
风格 008 · 孔版印刷 Risograph —— 四张风格图（1080×1350）

  poster.svg      一张海报：RISOGRAPH 三色套印 + 商店几何（对标参考图）
  cheatsheet.svg  速查卡：油墨、叠印、制版、五条规则
  app-ui.svg      如果孔版印刷来做 app：一台店铺的印件工单
  inks.svg        三种油墨，七种颜色：叠印色环

所有色块用 mix-blend-mode:multiply 叠在米白纸上；颗粒用 SVG 滤镜，不用外部贴图。
用法：python3 styles/008-risograph/images/make_svgs.py
"""
import os
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1350
MX, MY, MOD, GUT = 90, 72, 135, 18
STEP = MOD + GUT

PAPER, PINK, TEAL, YELLOW, BLACK = '#F3ECDB', '#FF48B0', '#00838A', '#FFB511', '#000000'
INK, GREY = '#1C1A17', '#8A8478'
FAM = "'Noto Sans SC', 'Helvetica Neue', Arial, sans-serif"
MONO = "'Noto Sans SC', 'Helvetica Neue', Arial, sans-serif"
SC = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"


def cx(i):
    return MX + i * STEP


def cw(n):
    return n * MOD + (n - 1) * GUT


def ry(j):
    return MY + j * STEP


def t(x, y, size, text, family=FAM, weight=900, fill='currentColor', ls='-0.02em', anchor='start', extra=''):
    return (
        f'<text x="{x:.1f}" y="{y:.1f}" font-family="{family}" font-weight="{weight}" '
        f'font-size="{size}" fill="{fill}" letter-spacing="{ls}" text-anchor="{anchor}" {extra}>'
        f'{escape(text)}</text>'
    )


HEAD = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img">
  <defs>
    <filter id="grain" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="8" result="n"/>
      <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.22 0" in="n" result="g"/>
      <feBlend in="SourceGraphic" in2="g" mode="multiply"/>
    </filter>
    <filter id="paper" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="3" result="n"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.95  0 0 0 0 0.92  0 0 0 0 0.85  0 0 0 0.12 0" in="n"/>
    </filter>
  </defs>
'''
FOOT = '</svg>\n'


def paper_bg():
    return (
        f'<rect width="{W}" height="{H}" fill="{PAPER}"/>'
        f'<rect width="{W}" height="{H}" filter="url(#paper)" opacity="0.45"/>'
    )


def marks():
    s = []
    for x, y in ((36, 36), (W - 36, 36), (36, H - 36), (W - 36, H - 36)):
        s.append(f'<g fill="none" stroke="{BLACK}" stroke-width="1.4" opacity="0.55" transform="translate({x},{y})">')
        s.append('<circle r="11"/><circle r="3.5" fill="{0}" stroke="none"/><path d="M-22 0H22M0 -22V22"/>'.format(BLACK))
        s.append('</g>')
    return ''.join(s)


def plate(color, inner, opacity=0.92, grain=True):
    filt = ' filter="url(#grain)"' if grain else ''
    return f'<g fill="{color}" style="mix-blend-mode:multiply" opacity="{opacity}"{filt}>{inner}</g>'


def poster():
    art = []
    # 黄
    art.append(plate(YELLOW, f'<circle cx="540" cy="620" r="210"/><circle cx="820" cy="780" r="190"/><polygon points="640,210 700,310 580,310"/>'))
    # 青
    art.append(plate(TEAL, (
        f'<circle cx="220" cy="280" r="110"/>'
        f'<rect x="720" y="200" width="280" height="200"/>'
        f'<path d="M790 210 L755 310 H800 L775 390 L870 290 H825 Z"/>'
        f'<circle cx="930" cy="1180" r="64" fill="none" stroke-width="8"/>'
        f'<rect x="140" y="780" width="160" height="90"/>'
    )))
    # 粉
    art.append(plate(PINK, (
        f'<circle cx="228" cy="286" r="110"/>'
        f'<circle cx="360" cy="520" r="24"/><circle cx="410" cy="520" r="24"/><circle cx="385" cy="568" r="24"/>'
        f'<circle cx="148" cy="240" r="48" fill="none" stroke-width="7"/>'
        f'<circle cx="160" cy="1100" r="44" fill="none" stroke-width="6"/>'
        f'<rect x="180" y="860" width="70" height="70"/>'
        f'<polygon points="260,980 272,1008 304,1008 278,1026 288,1058 260,1038 232,1058 242,1026 216,1008 248,1008"/>'
    )))
    body = [
        paper_bg(),
        *art,
        plate(PINK, t(532, 172, 92, 'RISOGRAPH', ls='-0.04em', anchor='middle'), grain=False),
        plate(TEAL, t(548, 164, 92, 'RISOGRAPH', ls='-0.04em', anchor='middle'), grain=False),
        plate(YELLOW, t(540, 168, 92, 'RISOGRAPH', ls='-0.04em', anchor='middle'), grain=False),
        plate(BLACK, t(540, 220, 28, '孔版印刷', SC, 900, ls='0.18em', anchor='middle'), 0.88, False),
        plate(PINK, t(148, 246, 9, 'PROOF', MONO, 700, ls='0.12em', anchor='middle'), grain=False),
        plate(PINK, t(160, 1106, 9, 'PASS', MONO, 700, ls='0.12em', anchor='middle'), grain=False),
        plate(TEAL, t(930, 1186, 10, 'RISOLO', MONO, 700, ls='0.1em', anchor='middle'), grain=False),
        plate(BLACK, (
            t(90, 1288, 13, 'SHOP · RUN #047 · PINK / TEAL / MUSTARD', MONO, 700, ls='0.08em')
            + t(990, 1288, 13, 'misreg · grain · 3-ink', MONO, 400, ls='0.06em', anchor='end')
        ), 0.8, False),
        marks(),
    ]
    return HEAD + ''.join(body) + FOOT


def cheatsheet():
    inks = [(PINK, '荧光粉', 'FLUO PINK', '806 U'), (TEAL, '青绿', 'TEAL', '321 U'),
            (YELLOW, '芥末黄', 'SUNFLOWER', '116 U'), (BLACK, '黑', 'BLACK', 'BLACK U')]
    rules = [
        ('01', '专色', '一种油墨一个滚筒。荧光粉是 CMYK 印不出来的。'),
        ('02', '叠印', '半透明的墨叠在一起，颜色相乘，不是盖住。'),
        ('03', '套不准', '每过一遍纸都会偏。把误差留着，那是这台机器的口音。'),
        ('04', '网点 / 颗粒', '浅色用网点或 Grain Touch，不要用透明度糊一层。'),
        ('05', '未涂布的纸', '大豆油墨靠吸进纸里“干”。铜版纸上它会永远是湿的。'),
    ]
    chips = []
    for i, (c, zh, en, pms) in enumerate(inks):
        x = 90 + (i % 2) * 450
        y = 250 + (i // 2) * 130
        chips.append(plate(c, f'<rect x="{x}" y="{y}" width="120" height="100"/>'))
        chips.append(plate(BLACK, (
            t(x + 140, y + 42, 28, zh, SC, 900, ls='0.04em')
            + t(x + 140, y + 70, 14, f'{en}  ·  {pms}', MONO, 700, ls='0.08em')
        ), 0.88, False))
    body = [
        paper_bg(),
        plate(PINK, t(84, 144, 56, 'RISO', ls='-0.03em'), grain=False),
        plate(TEAL, t(98, 136, 56, 'RISO', ls='-0.03em'), grain=False),
        plate(BLACK, t(90, 190, 22, '速查 · 五种油墨做法', SC, 700, ls='0.08em'), 0.88, False),
        *chips,
        plate(YELLOW, f'<circle cx="820" cy="360" r="70"/>'),
        plate(PINK, f'<circle cx="880" cy="360" r="70"/>'),
        plate(TEAL, f'<circle cx="850" cy="420" r="70"/>'),
        plate(BLACK, t(90, 540, 18, '叠印 = 正片叠底。粉×黄=朱红，青×黄=墨绿，粉×青=藏蓝。', SC, 500, ls='0.02em'), 0.85, False),
    ]
    for i, (n, title, desc) in enumerate(rules):
        y = 600 + i * 120
        body.append(plate(PINK if i % 2 == 0 else TEAL, t(90, y, 22, n, MONO, 700, ls='0.1em'), grain=False))
        body.append(plate(BLACK, t(160, y, 28, title, SC, 900, ls='0.04em') + t(160, y + 36, 18, desc, SC, 400, ls='0.02em'), 0.88, False))
    body.append(plate(BLACK, t(90, 1288, 13, '008 · RISOGRAPH  ·  DO：专色叠印   DON’T：渐变铜版纸', MONO, 400, ls='0.08em'), 0.75, False))
    body.append(marks())
    return HEAD + ''.join(body) + FOOT


def app_ui():
    # 印件工单 app
    body = [paper_bg()]
    body.append(plate(TEAL, f'<rect x="90" y="200" width="900" height="980"/>', 0.18))
    body.append(plate(PINK, t(90, 140, 36, 'RISO SHOP', ls='-0.03em'), grain=False))
    body.append(plate(BLACK, t(90, 180, 16, '印件工单  ·  JOB TICKET  #047', MONO, 700, ls='0.1em'), 0.85, False))
    # 预览
    body.append(plate(YELLOW, f'<circle cx="340" cy="420" r="110"/>'))
    body.append(plate(PINK, f'<circle cx="420" cy="400" r="90"/>'))
    body.append(plate(TEAL, f'<rect x="560" y="300" width="160" height="200"/>'))
    body.append(plate(BLACK, t(90, 620, 22, 'RUN  200  ·  120 ppm  ·  3 drums', MONO, 700, ls='0.08em'), 0.85, False))
    rows = [('荧光粉', 'FLUO PINK', 'Drum A'), ('青绿', 'TEAL', 'Drum B'), ('芥末黄', 'SUNFLOWER', 'Drum C')]
    cols = [PINK, TEAL, YELLOW]
    for i, ((zh, en, drum), c) in enumerate(zip(rows, cols)):
        y = 680 + i * 110
        body.append(plate(c, f'<rect x="90" y="{y}" width="72" height="72"/>'))
        body.append(plate(BLACK, t(184, y + 32, 26, zh, SC, 900, ls='0.04em') + t(184, y + 60, 14, f'{en}  ·  {drum}', MONO, 700, ls='0.08em'), 0.88, False))
    body.append(plate(PINK, f'<rect x="90" y="1040" width="900" height="88"/>'))
    body.append(plate(BLACK, t(540, 1096, 28, '开始制版  ·  MAKE MASTER', SC, 900, ls='0.08em', anchor='middle'), 0.9, False))
    body.append(plate(BLACK, t(90, 1288, 13, '如果孔版印刷来做 app：工单、滚筒、张数，不假装是激光打印机', MONO, 400, ls='0.04em'), 0.75, False))
    body.append(marks())
    return HEAD + ''.join(body) + FOOT


def inks():
    body = [paper_bg()]
    body.append(plate(PINK, t(84, 154, 48, '3 INKS', ls='-0.03em'), grain=False))
    body.append(plate(TEAL, t(98, 146, 48, '3 INKS', ls='-0.03em'), grain=False))
    body.append(plate(BLACK, t(90, 200, 22, '三种油墨，七种颜色', SC, 900, ls='0.1em'), 0.88, False))
    # 大三圆
    body.append(plate(PINK, f'<circle cx="400" cy="520" r="200"/>'))
    body.append(plate(TEAL, f'<circle cx="680" cy="520" r="200"/>'))
    body.append(plate(YELLOW, f'<circle cx="540" cy="720" r="200"/>'))
    labels = [
        (280, 400, '荧光粉'), (800, 400, '青绿'), (540, 900, '芥末黄'),
        (540, 430, '藏蓝'), (360, 700, '朱红'), (720, 700, '墨绿'), (540, 620, '近黑'),
    ]
    for x, y, lab in labels:
        body.append(plate(BLACK, t(x, y, 18, lab, SC, 700, ls='0.06em', anchor='middle'), 0.88, False))
    steps = ['分色画三张版', '一种颜色过一遍', '趁湿叠上去', '把套不准留下']
    for i, s in enumerate(steps):
        x = 90 + i * 225
        body.append(plate([PINK, TEAL, YELLOW, BLACK][i], f'<rect x="{x}" y="1040" width="210" height="140"/>', 0.88 if i < 3 else 0.55))
        body.append(plate(BLACK, t(x + 16, 1088, 18, f'0{i+1}', MONO, 700, ls='0.1em') + t(x + 16, 1140, 20, s, SC, 900, ls='0.02em'), 0.9, False))
    body.append(marks())
    return HEAD + ''.join(body) + FOOT


def main():
    os.makedirs(HERE, exist_ok=True)
    for name, fn in [('poster', poster), ('cheatsheet', cheatsheet), ('app-ui', app_ui), ('inks', inks)]:
        path = os.path.join(HERE, f'{name}.svg')
        open(path, 'w', encoding='utf-8').write(fn())
        print('wrote', path)


if __name__ == '__main__':
    main()
