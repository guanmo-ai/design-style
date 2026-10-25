"""
风格 011 · Claymorphism —— 四张风格图（1080×1350）

  poster.svg      蜜桃按钮 + CLAY 四块 + 带走句
  cheatsheet.svg  四条规则 + 这样做 / 别这样（尖卡对照）
  app-ui.svg      PINCH 焦点计时：开关、滑杆、层叠
  recipe.svg      四步捏法：色块 → 外影 → 内凹 → 按下

全部代码绘制。图内只用 Noto Sans SC（静态 OTF）——Fredoka / JetBrains Mono
是可变字体，子集化后末字会描两遍（PINCH→PINCHH）。视频仍用 Fredoka。
用法：python3 styles/011-claymorphism/images/make_svgs.py
"""
import os
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1350
PAPER, DEEP = '#E7EDF4', '#D8E0EA'
INK, MUTED = '#2C3340', '#7C8796'
PEACH, MINT, LAV, ROSE, SKY, CREAM = '#F3B89A', '#A8D4B8', '#C4B4E0', '#E8A8B6', '#A8C4E0', '#F0EBE3'
SC = "'Noto Sans SC', 'PingFang SC', sans-serif"

_clip = 0


def t(x, y, size, text, weight=700, fill=INK, ls='0', anchor='start'):
    return (
        f'<text x="{x:.1f}" y="{y:.1f}" font-family="{SC}" font-weight="{weight}" '
        f'font-size="{size}" fill="{fill}" letter-spacing="{ls}" text-anchor="{anchor}">'
        f'{escape(text)}</text>'
    )


def paper():
    return (
        f'<rect width="{W}" height="{H}" fill="url(#bg)"/>'
        f'<circle cx="90" cy="70" r="170" fill="{MINT}" opacity="0.18"/>'
        f'<circle cx="1010" cy="120" r="200" fill="{LAV}" opacity="0.16"/>'
        f'<circle cx="100" cy="1260" r="180" fill="{SKY}" opacity="0.16"/>'
        f'<circle cx="990" cy="1240" r="160" fill="{ROSE}" opacity="0.14"/>'
    )


def clay(x, y, w, h, r, fill='url(#g-peach)', shadow=1.0, inset=True, press=0.0):
    """体积块：地面软影 + 径向微鼓 + 可开关的内凹高光/暗部。"""
    global _clip
    _cid = _clip
    _clip += 1
    clip = f'k{_cid}'
    ox, oy, blur, op = 10 * shadow, 18 * shadow, 16 * shadow, 0.38 * shadow
    hi_o = 0.34 if press < 0.5 else 0.16
    lo_o = 0.07 + 0.12 * press
    body = (
        f'<g>'
        f'<ellipse cx="{x + w / 2 + 6:.1f}" cy="{y + h + 6:.1f}" rx="{w * 0.42:.1f}" ry="{max(10, h * 0.1):.1f}" '
        f'fill="#8A9BB0" opacity="{0.28 * shadow:.2f}"/>'
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" '
        f'filter="url(#drop)" transform="translate(0,0)"/>'
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="none" stroke="none"/>'
        f'</g>'
    )
    # Use a dedicated group: drop shadow via filter on a clone, then clipped insets
    drop = (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" '
        f'style="filter:drop-shadow({ox:.1f}px {oy:.1f}px {blur:.1f}px rgba(138,155,176,{op:.2f})) '
        f'drop-shadow({ox * 0.35:.1f}px {oy * 0.4:.1f}px {blur * 0.4:.1f}px rgba(138,155,176,{op * 0.5:.2f}))"/>'
    )
    inn = ''
    if inset:
        inn = (
            f'<defs><clipPath id="{clip}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}"/></clipPath></defs>'
            f'<g clip-path="url(#{clip})">'
            f'<ellipse cx="{x + w * 0.32:.1f}" cy="{y + h * 0.26:.1f}" rx="{w * 0.38:.1f}" ry="{h * 0.28:.1f}" '
            f'fill="#fff" opacity="{hi_o:.2f}"/>'
            f'<ellipse cx="{x + w * 0.7:.1f}" cy="{y + h * 0.82:.1f}" rx="{w * 0.42:.1f}" ry="{h * 0.32:.1f}" '
            f'fill="#6E7E90" opacity="{lo_o:.2f}"/>'
            f'</g>'
        )
    return drop + inn


HEAD = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F4F7FB"/>
      <stop offset="0.55" stop-color="{PAPER}"/>
      <stop offset="1" stop-color="{DEEP}"/>
    </linearGradient>
    <radialGradient id="g-peach" cx="30%" cy="24%" r="80%">
      <stop offset="0" stop-color="#FFE4D2"/><stop offset="0.55" stop-color="{PEACH}"/><stop offset="1" stop-color="#DFA17F"/>
    </radialGradient>
    <radialGradient id="g-mint" cx="30%" cy="24%" r="80%">
      <stop offset="0" stop-color="#D6F0E0"/><stop offset="0.55" stop-color="{MINT}"/><stop offset="1" stop-color="#7FB896"/>
    </radialGradient>
    <radialGradient id="g-lav" cx="30%" cy="24%" r="80%">
      <stop offset="0" stop-color="#E8DEF6"/><stop offset="0.55" stop-color="{LAV}"/><stop offset="1" stop-color="#9E8CC4"/>
    </radialGradient>
    <radialGradient id="g-rose" cx="30%" cy="24%" r="80%">
      <stop offset="0" stop-color="#F8D6DE"/><stop offset="0.55" stop-color="{ROSE}"/><stop offset="1" stop-color="#C87E90"/>
    </radialGradient>
    <radialGradient id="g-sky" cx="30%" cy="24%" r="80%">
      <stop offset="0" stop-color="#D6E6F4"/><stop offset="0.55" stop-color="{SKY}"/><stop offset="1" stop-color="#7FA3C4"/>
    </radialGradient>
    <radialGradient id="g-cream" cx="30%" cy="24%" r="80%">
      <stop offset="0" stop-color="#FFF8F0"/><stop offset="0.55" stop-color="{CREAM}"/><stop offset="1" stop-color="#D4CDBE"/>
    </radialGradient>
  </defs>
'''
FOOT = '</svg>\n'


def poster():
    letters = [
        (90, 200, 'C', 'url(#g-peach)'),
        (340, 200, 'L', 'url(#g-mint)'),
        (590, 200, 'A', 'url(#g-lav)'),
        (840, 200, 'Y', 'url(#g-rose)'),
    ]
    tiles = []
    for x, y, ch, g in letters:
        tiles.append(clay(x, y, 150, 150, 44, g))
        tiles.append(t(x + 75, y + 102, 72, ch, 900, INK, '-0.04em', 'middle'))
    body = [
        paper(),
        t(540, 140, 18, 'DESIGN STYLE  011', 500, MUTED, '0.16em', 'middle'),
        *tiles,
        clay(140, 420, 800, 300, 150, 'url(#g-peach)', shadow=1.15),
        t(540, 590, 56, 'PINCH', 700, INK, '0.12em', 'middle'),
        t(540, 800, 28, '粘土拟态', 700, INK, '0.2em', 'middle'),
        t(540, 870, 56, 'Claymorphism', 900, INK, '-0.03em', 'middle'),
        t(540, 980, 34, '先捏体积，再画界面。', 700, INK, '0.04em', 'middle'),
        clay(90, 1080, 900, 88, 44, 'url(#g-cream)', shadow=0.7),
        t(160, 1136, 16, 'DESIGN STYLE  011', 500, INK, '0.08em'),
        t(540, 1136, 16, '@guanmo_ai', 500, INK, '0.08em', 'middle'),
        t(920, 1136, 14, 'github.com/guanmo-ai/design-style', 400, MUTED, '0.02em', 'end'),
        t(540, 1288, 14, '胖圆角  ·  成对阴影  ·  粉笔 pastel', 500, MUTED, '0.1em', 'middle'),
    ]
    return HEAD + ''.join(body) + FOOT


def cheatsheet():
    rules = [
        ('01', '胖圆角', '半径趋近半高。8 px 的系统圆角捏不出体积。', 'url(#g-peach)', 56),
        ('02', '成对阴影', '内凹高光 + 外软投影，光向必须一致。', 'url(#g-mint)', 40),
        ('03', '粉笔 pastel', '蜜桃 / 薄荷 / 薰衣草。不要饱和原色。', 'url(#g-lav)', 40),
        ('04', '挤捏反馈', '按下变扁、内影加深。不要只改透明度。', 'url(#g-rose)', 40),
    ]
    rows = []
    for i, (n, zh, how, g, rad) in enumerate(rules):
        y = 210 + i * 168
        rows.append(clay(90, y, 128, 128, rad, g, press=0.55 if i == 3 else 0))
        rows.append(t(250, y + 42, 16, n, 500, MUTED, '0.12em'))
        rows.append(t(250, y + 82, 34, zh, 900, INK, '0.02em'))
        rows.append(t(250, y + 114, 18, how, 400, MUTED, '0'))
    # 这样做 / 别这样：胖卡 vs 尖卡
    yes = (
        clay(90, 920, 420, 220, 56, 'url(#g-mint)')
        + t(300, 1000, 18, '这样做', 700, INK, '0.08em', 'middle')
        + t(300, 1048, 16, '先定光，圆角先写 48', 400, MUTED, '0', 'middle')
        + t(300, 1080, 16, '内外阴影成对', 400, MUTED, '0', 'middle')
    )
    no = (
        f'<rect x="570" y="920" width="420" height="220" rx="8" fill="#F4F6F8" '
        f'style="filter:drop-shadow(0px 8px 16px rgba(40,50,70,0.16))"/>'
        + t(780, 1000, 18, '别这样', 700, INK, '0.08em', 'middle')
        + t(780, 1048, 16, '尖角 + 单层扁平投影', 400, MUTED, '0', 'middle')
        + t(780, 1080, 16, '新拟态同色浮雕 / 细描边', 400, MUTED, '0', 'middle')
    )
    body = [
        paper(),
        t(90, 120, 48, 'Clay', 900, INK, '-0.03em'),
        t(90, 168, 20, '速查  ·  四条可执行规则', 500, MUTED, '0.08em'),
        *rows,
        yes,
        no,
        t(540, 1288, 16, '先捏体积，再画界面。', 700, INK, '0.06em', 'middle'),
    ]
    return HEAD + ''.join(body) + FOOT


def app_ui():
    # Phone at 210,230 — real product, not a diagram dump
    body = [
        paper(),
        t(90, 118, 18, '如果粘土拟态来做 app', 500, MUTED, '0.08em'),
        t(90, 176, 44, 'PINCH', 900, INK, '0.08em'),
        clay(200, 220, 680, 1000, 72, 'url(#g-sky)', shadow=1.1),
        f'<rect x="228" y="248" width="624" height="944" rx="56" fill="#F3F6FA"/>',
        clay(256, 280, 52, 52, 26, 'url(#g-peach)', shadow=0.6),
        t(328, 316, 22, 'PINCH', 700, INK, '0.06em'),
        t(796, 316, 16, '9:41', 500, MUTED, '0.04em', 'end'),
        clay(256, 360, 568, 240, 88, 'url(#g-peach)', shadow=1.05),
        t(540, 470, 64, '25:00', 900, INK, '-0.02em', 'middle'),
        t(540, 530, 18, 'Deep work', 500, INK, '0.1em', 'middle'),
        # toggle track + thumb
        clay(256, 640, 568, 80, 40, 'url(#g-mint)', shadow=0.7),
        clay(268, 652, 260, 56, 28, 'url(#g-cream)', shadow=0.45),
        t(398, 690, 20, 'Focus', 700, INK, '0.04em', 'middle'),
        t(690, 690, 18, 'Break', 500, MUTED, '0.04em', 'middle'),
        # slider
        f'<rect x="276" y="760" width="528" height="14" rx="7" fill="#D5DDE6"/>',
        clay(560, 744, 44, 44, 22, 'url(#g-peach)', shadow=0.7),
        # stacked sessions
        clay(256, 820, 568, 96, 32, 'url(#g-peach)', shadow=0.85),
        t(288, 878, 22, 'Deep work', 700, INK, '0.02em'),
        t(780, 878, 18, '25:00', 500, INK, '0.04em', 'end'),
        clay(272, 936, 536, 88, 28, 'url(#g-mint)', shadow=0.7),
        t(304, 990, 20, 'Walk', 700, INK, '0.02em'),
        t(764, 990, 16, '12:00', 500, INK, '0.04em', 'end'),
        clay(288, 1040, 504, 80, 26, 'url(#g-lav)', shadow=0.55),
        t(320, 1090, 18, 'Sleep', 700, INK, '0.02em'),
        t(748, 1090, 16, '45:00', 500, INK, '0.04em', 'end'),
        t(540, 1288, 16, '开关 · 滑杆 · 层叠——同一块粘土', 500, MUTED, '0.06em', 'middle'),
    ]
    return HEAD + ''.join(body) + FOOT


def recipe():
    steps = [
        ('1', '体积', '先画胖圆角色块，半径 ≥ 48。', 'url(#g-cream)', dict(shadow=0.0, inset=False, press=0)),
        ('2', '外影', '光的对面放一层软投影。', 'url(#g-sky)', dict(shadow=1.1, inset=False, press=0)),
        ('3', '内凹', '朝光 inset 高光，背光 inset 暗。', 'url(#g-mint)', dict(shadow=1.0, inset=True, press=0)),
        ('4', '按下去', '挤扁，内影加深。这才是粘土。', 'url(#g-peach)', dict(shadow=0.45, inset=True, press=0.7)),
    ]
    rows = []
    for i, (n, zh, how, g, opt) in enumerate(steps):
        y = 220 + i * 240
        cw, ch, cr = (220, 168, 72) if i == 3 else (200, 200, 56)
        ox = 90 if i < 3 else 80
        oy = y if i < 3 else y + 16
        rows.append(clay(ox, oy, cw, ch, cr, g, **opt))
        rows.append(t(340, y + 70, 22, n, 500, MUTED, '0.14em'))
        rows.append(t(340, y + 118, 40, zh, 900, INK, '0.02em'))
        rows.append(t(340, y + 164, 20, how, 400, MUTED, '0'))
    body = [
        paper(),
        t(90, 120, 48, '捏法', 900, INK, '0.04em'),
        t(90, 168, 20, '四步，从色块到控件', 500, MUTED, '0.08em'),
        *rows,
        t(540, 1288, 18, '先捏体积，再画界面。', 700, INK, '0.06em', 'middle'),
    ]
    return HEAD + ''.join(body) + FOOT


def main():
    os.makedirs(HERE, exist_ok=True)
    for name, fn in (('poster', poster), ('cheatsheet', cheatsheet), ('app-ui', app_ui), ('recipe', recipe)):
        global _clip
        _clip = 0
        path = os.path.join(HERE, f'{name}.svg')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(fn())
        print('wrote', path)


if __name__ == '__main__':
    main()
