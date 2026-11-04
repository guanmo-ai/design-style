"""第五轮三个候选并排：python3 drafts/_lib/compare5.py && node drafts/_lib/shot.cjs drafts/candidates-5.html drafts/candidates-5.png 1960 1160"""
import os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = [
    ('ascii', '字符画 ASCII Art', '1963 打字机肖像 → 1990s BBS → 今天的 ASCII 着色器与终端风官网',
     '没有像素，只有字：越亮，就换一个越“满”的字。',
     '一颗带环的星球全由字符现算：自转时每一格的字在 “ .:-=+*#%@” 之间翻；扫描线扫过，乱码一格格“解码”成画面；镜头一路推进，推到一个字跟前，这个字里面又是一整张字符画。',
     '网页主图就是终端里也能跑的字符星球；按钮按下，字先乱码、再落定。音乐 App 的封面、波形、按钮全是字，歌词一个字一个字解码出来。'),
    ('kinetic-type', '动态字体 Kinetic Type', '1959 Saul Bass 片头 → 1990s MTV → 2016 可变字体 → 今天的动态海报',
     '字不是放在画面里，字就是画面：宽一点、粗一点、跳一下，都是动作。',
     '一颗看不见的“透镜”滚过字墙，经过的字母被可变字体的宽度 / 粗细轴撑开再缩回；SQUASH 那一行被压扁，BOUNCE 那一行字母一个个跳起来，越出自己的色带。整片只有字，没有一张图。',
     '标题跟着鼠标鼓起来，阵容表悬停的那一行被撑满、其他行按距离变窄；训练计时器每过一秒，新数字“砸”下来，上一秒被压扁挤走。'),
    ('generative', '生成艺术 Generative Art', '1965 Nees / Molnár 的绘图机 → 2001 Processing → 今天的创意编程',
     '不画画，写规则：每一条色带只听“风”的方向，碰到别人就停下。',
     '几百条色带顺着看不见的“风”从左往右一起长出来，互不相撞；前沿右边露出方向场的小箭头和正在走的笔头。最后改一个种子，整张画倒带收回，再长成完全不同的一张。',
     '生成器：拖一下滑块，整张画重新长一遍；钱包里每张卡的图案由种子现算、独一无二，点“重新生成”色带重新长出来。'),
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
h2{{margin:0;font-weight:900;font-size:30px}}.yr{{color:#999;font-size:16px;margin:4px 0 8px;min-height:24px}}
.one{{font-size:18px;color:#f3d27a;margin-bottom:14px;min-height:54px}}
img{{width:100%;display:block;border-radius:6px}}
.cap{{font-size:16px;line-height:1.55;color:#ccc;margin:10px 0 22px;min-height:100px}}.cap b{{display:block;color:#fff;font-size:15px;margin-bottom:2px}}
</style><div class="row">{cols}</div>'''
open(os.path.join(HERE, 'candidates-5.html'), 'w').write(html)
