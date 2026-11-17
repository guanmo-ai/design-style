"""手绘动画 v5 配乐：主人用 Sonilo 生成的 Anime Film Score Variation 2（120 BPM），从 8.13 秒（第 5 小节，乐队全开）起取 50.87 秒，结尾是原曲自己的收尾。
画面按它剪：每 4 小节（480 帧）换一个场景；第 8 秒（乐队再抬一级）开始拆五层纸；第 47、48 秒两记大的落片尾和署名。
这里只合成音效（出字、转场的风、帽子落在树冠上），压在音乐下面 9 dB。
python3 audio.py out.wav（动作时刻来自 node ../../_lib/events.cjs film.html events.json）"""
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from band import Band  # noqa: E402
from scoremix import finish  # noqa: E402

EV = json.loads((HERE / 'events.json').read_text())
TL, END, BEAT = EV['TL'], EV['end'], EV['beat']
CH = [(0, 41, [53, 57, 60, 65])]
S = Band(END, CH, beat=BEAT, seed=33, tail=1.0)
fr = S.fr
for key in ('a', 'b', 'c'):
    a, b = TL[key]
    S.sfx(S.whoosh((b - a) / 60, 300, 6000, 1.0, .5), fr(a), .55, 0, send=.15)
for k in range(5):                                            # 五层纸一张张拉开：纸响
    S.sfx(S.fft_filter(S.rng.standard_normal(int(.06 * S.SR)), lo=1500, hi=7000) * np.exp(-np.arange(int(.06 * S.SR)) / (.015 * S.SR)), fr(TL['explode'][0] + k * 14), .25, -.5 + k * .25, send=.1)
S.sfx(S.poof(1.0, .25, 600), fr(TL['land']), .5, .2, send=.2)
S.text_cues(EV['cues'], .45)
finish(S, music=str(HERE.parents[1] / 'hand-drawn/bgm/round2/Anime_Film_Score_Variation_2.m4a'), start=8.13, dur=END / 60, out=sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'))
