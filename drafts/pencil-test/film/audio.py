"""铅笔原画 v4 配乐：主人用 Sonilo 生成的 Sketch Awakening（150 BPM），从 11.0 秒（第 7 小节）起取 48.6 秒，结尾是原曲自己的收尾。
画面按它的 8 小节段落剪：16.0 秒进城市、28.8 秒进柱廊、35.2 秒进白纸里的形体、41.6 秒拉出来；最后一记（47 秒）签名。
这里只合成音效：出字、换段落的风、签名的铅笔沙沙，压在音乐下面 9 dB。"""
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from band import Band  # noqa: E402
from scoremix import finish  # noqa: E402

EV = json.loads((HERE / 'events.json').read_text())
SEC, END, BEAT = EV['SEC'], EV['end'], EV['beat']
S = Band(END, [(0, 40, [52, 55, 59, 64])], beat=BEAT, seed=27, tail=1.0)
fr = S.fr
for k in ('b', 'c', 'd'):
    S.sfx(S.whoosh(.8, 300, 6000, 1.0, .6), fr(SEC[k]) - .55, .5, 0, send=.2)
n = int(fr(END) * S.SR); ts = np.arange(n) / S.SR
scratch = S.fft_filter(S.rng.standard_normal(n), lo=1500, hi=6000) * (1 + .7 * np.sin(2 * np.pi * 9 * ts) ** 2)
env = np.clip((ts * 60 - 2780) / 3, 0, 1) * np.clip((2822 - ts * 60) / 3, 0, 1)
S.SFX[0, :n] += scratch * env * .06; S.SFX[1, :n] += scratch * env * .055
S.text_cues(EV['cues'], .45)
finish(S, music=str(HERE.parents[1] / 'hand-drawn/bgm/round2/Sketch_Awakening.m4a'), start=11.0, dur=END / 60, out=sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'))
