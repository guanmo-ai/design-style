"""三个候选并排：python3 drafts/_lib/compare.py && node drafts/_lib/shot.cjs drafts/candidates.html drafts/candidates.png 1960 1110"""
import os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = [
    ('psychedelic', '迷幻海报 Psychedelic', '1966—1972 · 旧金山',
     '字不排成行，而是被灌进一个形状里，直到把形状撑满。',
     '字像热蜡被灌进一个会晃的模子：形状一呼一吸，字跟着鼓起、挤瘦；一滴拉出细颈、“啵”地断开，背后的色环一圈圈往外流、颜色沿环轮换（60 年代液体灯光秀）。',
     '同一个“灌形”函数套在任何外框上——墓碑卡片、药丸按钮、波浪横幅；悬停时外框一鼓，字跟着重新挤满。正文照常排。'),
    ('mid-century', '中世纪现代 Mid-Century Modern', '1945—1965 · Saul Bass / Paul Rand / Eames',
     '剪刀代替尺子：形状手剪，边缘不直，颜色一块块贴在纸上。',
     '按“二拍”一跳一跳地动（一秒 12 张），每跳纸边都重剪一遍、轻轻“沸腾”；一只剪纸手把零件一块块放上去——提起时影子变长变虚，按下时影子收紧。',
     '封面、按钮、波形条全是剪纸：换曲目时新封面的零件一块块被“放”上来，按下按钮就是纸片贴回桌面、影子收紧。'),
    ('skeuomorphism', '拟物 Skeuomorphism', '2007—2013 · iPhone OS 1 → iOS 6',
     '一切控件都假装是一样东西：光从上面来、材料有纹理、动作有卡位。',
     '纸页从右下角卷起、翻过去，卷边那道高光顺着弧度跑；所有东西都有重量和卡位，光永远从同一盏顶灯来。',
     '旋钮转一格“咔”地停住（回弹约 5%），拨杆带惯性“啪”地翻过去、指示灯随之亮；VU 表指针带阻尼地摆，卷盘一直在转。'),
]
cols = ''.join(f'''<div class="col">
  <h2>{t}</h2><div class="yr">{y}</div><div class="one">{one}</div>
  <img src="{k}/png/cover.png"><div class="cap"><b>第 0 帧 · 独有动作</b>{a1}</div>
  <img src="{k}/png/ui.png"><div class="cap"><b>网页 + App · 独有动作</b>{a2}</div>
</div>''' for k, t, y, one, a1, a2 in C)
html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:NotoSC;src:url(../public/fonts/NotoSansSC-Medium.otf);font-weight:500}}
@font-face{{font-family:NotoSC;src:url(../public/fonts/NotoSansSC-Black.otf);font-weight:900}}
body{{margin:0;background:#151515;color:#eee;font-family:NotoSC;padding:30px;width:1900px}}
.row{{display:flex;gap:30px}}.col{{flex:1}}
h2{{margin:0;font-weight:900;font-size:30px}}.yr{{color:#999;font-size:17px;margin:4px 0 8px}}
.one{{font-size:18px;color:#f3d27a;margin-bottom:14px;min-height:54px}}
img{{width:100%;display:block;border-radius:6px}}
.cap{{font-size:16px;line-height:1.55;color:#ccc;margin:10px 0 22px;min-height:100px}}.cap b{{display:block;color:#fff;font-size:15px;margin-bottom:2px}}
</style><div class="row">{cols}</div>'''
open(os.path.join(HERE, 'candidates.html'), 'w').write(html)
