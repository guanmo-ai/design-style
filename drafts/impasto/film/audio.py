"""厚涂 v4 配乐：主人用 Sonilo 生成的 Majestic Orchestral Rise（120 BPM），从 8.11 秒（第 5 小节，乐队已经全开）开始取 51.09 秒，结尾是原曲自己的收尾。
画面按它的小节剪：每 4 小节（240 帧 = 8 秒）一幅画；第 2760 帧（46 秒）那一记大的落署名。
这里只合成音效：出字、刷子（跟着同时在画的笔数走）、色板“啪”、风暴的雷，压在音乐下面 9 dB。
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
CH = [(0, 38, [50, 57, 62, 65]), (1440, 41, [53, 57, 60, 65])]
S = Band(END, CH, beat=BEAT, seed=44, tail=1.0)
fr = S.fr
n = int(fr(END) * S.SR); tsec = np.arange(n) / S.SR


def bed(counts, lo, hi, gain, smooth=7):
    c = np.convolve(np.array(counts, float), np.ones(smooth) / smooth, 'same'); c = c / max(1, c.max())
    env = np.interp(tsec * 60, np.arange(len(c)), np.clip(c, 0, 1)) ** .8
    noise = S.fft_filter(S.rng.standard_normal(n), lo=lo, hi=hi)
    wob = 1 + .35 * np.sin(2 * np.pi * 3.1 * tsec) * np.sin(2 * np.pi * .7 * tsec)
    pan = .5 * np.sin(tsec * 1.3)
    S.SFX[0, :n] += noise * env * wob * gain * (1 - pan); S.SFX[1, :n] += noise * env * wob * gain * (1 + pan)


bed(EV['big'], 200, 1800, .14); bed(EV['mid'], 400, 3200, .08); bed(EV['small'], 1200, 5000, .04); bed(EV['title'], 400, 3500, .1)
for k, f in enumerate(EV['scenes'][1:]):                     # 每一幅盖上来：一记大刷子“唰——”
    S.sfx(S.whoosh(1.1, 200, 3500, 1.0, .35), fr(f) - .1, .6, -.4 + .2 * k, send=.15)
for b in TL['bolts']:                                         # 雷
    S.sfx(S.boom(1.0, 90, 30, 2.0), fr(b) + .08, .6, 0, send=.3)
    S.sfx(S.fft_filter(S.rng.standard_normal(int(.25 * S.SR)), lo=800, hi=8000) * np.exp(-np.arange(int(.25 * S.SR)) / (.05 * S.SR)), fr(b), .25, .3, send=.3)
for k, f in enumerate(EV['palette']):
    S.sfx(S.poof(.9, .2, 700), fr(f + 2), .35, -.5 + .25 * k, send=.3)
S.sfx(S.brush(.8, .22, True), fr(TL['under']), .55, -.3, send=.2)
S.text_cues(EV['cues'], .45)
finish(S, music=str(HERE.parents[1] / 'hand-drawn/bgm/round2/Majestic_Orchestral_Rise__Masterpiece_in_Motion.m4a'), start=8.11, dur=END / 60, out=sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'))
