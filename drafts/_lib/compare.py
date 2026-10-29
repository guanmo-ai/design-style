"""三个候选并排：python3 drafts/_lib/compare.py && node drafts/_lib/shot.cjs drafts/candidates.html drafts/candidates.png 1960 1120"""
import os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = [
    ('de-stijl', '风格派 De Stijl', '1917—1931 · 荷兰 · Mondrian / Rietveld / Van Doesburg',
     '只用横线、竖线，和红、黄、蓝：一刀刀切开画面，再往格子里灌颜色。',
     '黑线像刀一样横穿画面，把一格切成两格（切开那一下“咔”地顿住），再从切口把颜色灌满一格；字也是一根根矩形“搭”上去的。整张画面是一棵不断二分的树。',
     '整页就是一张网格：格子之间的黑线是布局本身。换页时线先切出新格子、颜色再灌进去；日历里每个事件是一格，拖动时整排格线跟着重切。'),
    ('isotype', '图形统计 Isotype', '1925—1934 · 维也纳 · Otto Neurath / Gerd Arntz',
     '一个图形永远代表同一个数：多了就多摆几个，绝不放大；不满一个就切掉一截。',
     '数字往上涨，人形就一个接一个“盖章”落进虚线格，从底往上堆成柱子——两堆图形本身就是柱状图；最后不满一个的那个被竖着切掉一截。',
     '图表里的图标像活字一样咔咔排队：去年的一排淡、今年的一排实，新的一格落下时整排往右让位；数据一变，图形只增减个数，从不缩放。'),
    ('infinite-canvas', '无限画布 Infinite Canvas（布局）', '1963 Sketchpad → 2016 Figma → 今天',
     '没有页面、没有边界：内容摆在一张无限大的平面上，靠缩放和平移去找。',
     '镜头本身是主角：一直在推近、拉远、平移；拉远时卡片收成色块只剩大标题，推近时细节一层层长出来（语义缩放）；好几个带名字的光标同时在拖、拉、连线。',
     '节点之间的连线跟着拖动实时弯曲；手机上双指一捏，四天的行程收成四块大标题，再一放，每块里的卡片重新长出来。'),
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
