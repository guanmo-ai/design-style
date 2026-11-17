"""手绘动画 v6《小蓝鸟和草帽》配乐：Sonilo 生成的 Anime Film Score Variation 2（120 BPM），从 8.13 秒起取 50.87 秒（只剪开头，结尾是原曲的收尾）。
九个镜头硬切在拍子上（每 2 小节 / 4 小节）；最后两记重音（2820、2880 帧）落片名和署名。这里只合成画面里的声音，压在音乐下面 9 dB：
萤火虫的“叮”、醒来眨眼、起风、帽子被掀起、扑翅、差点叼到飘带、帽子撞树枝、冲出树林的风、落进树杈、小鸟抖羽毛、出字。"""
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from band import Band  # noqa: E402
from scoremix import finish  # noqa: E402

EV = json.loads((HERE / 'events.json').read_text())
END, BEAT = EV['end'], EV['beat']
S = Band(END, [(0, 41, [53, 57, 60, 65])], beat=BEAT, seed=33, tail=1.0)
fr = S.fr
nz = lambda d, lo, hi, dec: S.fft_filter(S.rng.standard_normal(int(d * S.SR)), lo=lo, hi=hi) * np.exp(-np.arange(int(d * S.SR)) / (dec * S.SR))
S.sfx(S.celesta(96, 1.4, 1.0), fr(330), .5, .3, send=.4)                     # 萤火虫落在嘴上
S.sfx(S.celesta(100, 1.0, .7), fr(352), .35, .3, send=.4)                    # 睁眼
S.sfx(S.whoosh(1.2, 200, 4000, 1.0, .5), fr(440), .6, -.2, send=.2)         # 起风
S.sfx(S.whoosh(1.0, 300, 7000, 1.0, .3), fr(484), .7, .2, send=.2)          # 帽子被掀起
S.sfx(S.poof(1.0, .25, 900), fr(486), .4, 0, send=.1)
for f0, f1, step in ((520, 960, 9), (960, 1440, 8), (1440, 1880, 7), (1920, 2400, 9), (2530, 2600, 8)):   # 扑翅
    for f in range(f0, f1, step):
        S.sfx(nz(.05, 300, 2500, .012), fr(f), .1, .2, send=.05)
S.sfx(S.whoosh(.6, 600, 8000, 1.0, .5), fr(1150), .45, .3, send=.2)         # 差点叼到
for f in (1500, 1640):                                                        # 帽子撞树枝
    S.sfx(S.thock(64, 1.0), fr(f), .4, .2, send=.15); S.sfx(nz(.3, 1500, 7000, .08), fr(f), .2, .2, send=.15)
for k in range(30):                                                           # 前景树干一根根扫过
    S.sfx(S.whoosh(.25, 200, 2500, 1.0, .5), fr(1440 + k * 16 + 4), .12, -.5 + (k % 5) * .25, send=.05)
S.sfx(S.whoosh(1.0, 300, 7000, 1.0, .7), fr(1880), .6, 0, send=.25)         # 冲出树林
S.sfx(S.poof(1.0, .3, 600), fr(2520), .5, .1, send=.2)                       # 帽子落进树杈
S.sfx(S.celesta(88, 1.0, .8) + S.celesta(93, 1.0, .5), fr(2600), .4, .1, send=.3)   # 小鸟落进去
S.sfx(nz(.25, 800, 5000, .06), fr(2632), .25, .1, send=.1)                  # 抖羽毛
S.text_cues(EV['cues'], .45)
finish(S, music=str(HERE.parents[1] / 'hand-drawn/bgm/round2/Anime_Film_Score_Variation_2.m4a'), start=8.13, dur=END / 60, out=sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'))
