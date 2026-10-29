"""三个候选并排：python3 drafts/_lib/compare.py && node drafts/_lib/shot.cjs drafts/candidates.html drafts/candidates.png 1960 1120"""
import os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = [
    ('cyberpunk', '赛博朋克 Cyberpunk', '1982《银翼杀手》→ 1995《攻壳机动队》→ 2077',
     '高科技，低生活：黑夜、雨、霓虹，一切都在闪、都在出故障。',
     '霓虹灯管一根根“噼”地点亮（先闪两下再稳住），画面在重拍上被横向撕开、红青错位；雨一直下，湿地面的倒影跟着灯一起亮、被水波扯碎。',
     '切角面板像全息投影一样一行行扫出来，数字滚动跳变；按钮按下时故障一闪；地图上的霓虹路线一路“描”过去，终点圈一直在呼吸。'),
    ('city-pop', '城市流行 City Pop', '1978—1988 · 東京 · 永井博 / 铃木英人的唱片封面',
     '把夏天装进唱片封面：喷枪蓝天、白房子、棕榈和泳池，永远是下午三点。',
     '镜头像车窗一样慢慢横移，前景棕榈快、白房子慢、云最慢；水花慢动作炸开再落下，水面高光一闪一闪；标题带着 80 年代速度条纹从左边划进来。',
     '主图是一张会动的画：滚动时棕榈和云按视差错开；磁带两个卷盘一快一慢地转；落日渐变的按钮一点，像阳光扫过。'),
    ('inflated', '膨胀风 Inflated 3D', '2021— · 3D 表情 / 膨胀字 / 充气家具',
     '一切都是充气的：圆鼓鼓、软乎乎，按下去会凹。',
     '字母一个个被打气筒“噗”地吹鼓（体积过冲约 8% 再回弹抖两下），最后一个还瘪着、正在进气；被碰到就挤扁，松开弹回。',
     '按钮按下去会凹、松手“啵”地弹回；存钱进度条像灌气一样一节节鼓起来，金币落进罐子里弹两下。'),
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
