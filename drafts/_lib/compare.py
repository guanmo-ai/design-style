"""三个候选并排：python3 drafts/_lib/compare.py && node drafts/_lib/shot.cjs drafts/candidates.html drafts/candidates.png 1960 1120"""
import os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = [
    ('low-poly', '低多边形 Low Poly', '1993《星际火狐》的实时 3D → 2013 面片插画潮 → 今天的独立游戏',
     '把世界削成三角面：一个面一个颜色，光一转，所有面跟着翻亮翻暗。',
     '小火车冲出隧道、开上高架桥，蒸汽一团团喷成二十面体；镜头沿山谷推进，夕阳一沉，每个三角面的明暗跟着翻一遍（山从橘粉翻成紫）。',
     '主图就是同一片山谷换个机位；天气卡片里的小山会随天气换光——晴天面亮、下雨面暗、下雪山顶的面变白。'),
    ('voxel', '体素 Voxel', '1990s 体素地形 → 2009《我的世界》→ 今天的方块搭建游戏',
     '世界是一格一格的方块：没有曲线，只有“放上去”和“拿下来”。',
     '方块从天上一块块“咔哒”落下，叠成灯塔，最后几块还在空中排队；整块海岸像被刀切开，看得见地层和水里的鱼。',
     '背包里每个格子是一个现算的小方块；选中就弹一下，放下时落到网格上“咔”地停住、带一个小回弹。'),
    ('iso-room', '等距微缩 Isometric Diorama', '1980s 等距游戏 → 2014《纪念碑谷》→ 今天的等距房间插画',
     '把一个房间切开、缩小，斜 45° 看进去：像在看一个精致的玩具盒。',
     '家具一件件从天上落进房间、在地板网格上弹一下停住；天一黑，台灯、屏幕、窗外的月亮依次亮起，光在地板上铺开。',
     '房间就是遥控器：点哪件家具，哪件就亮、就弹出状态；切到夜间模式，整间屋子从白天的光换成台灯的暖光。'),
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
