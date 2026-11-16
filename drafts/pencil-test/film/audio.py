"""铅笔原画 · 配乐：拨弦 + 钢琴 + 马林巴，像一段小动画片的配乐。120 BPM（一拍 30 帧，一小节 120 帧），C 大调，9 小节。
每换一张画一声很轻的纸响（一秒 12 下 = 翻纸）；落地“咚”+ 压扁的弹簧；慢放时铅笔沙沙、每张洋葱皮一声木琴；
刻度飞成曲线时一个一个“叮”往上走；冲过头那一下滑音；最后一跳落地 → 红笔签名 → 主和弦。
python3 audio.py out.wav（动作时刻来自 node ../../_lib/events.cjs film.html events.json）"""
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from song import Song  # noqa: E402
from softfx import SoftFX  # noqa: E402

EV = json.loads((HERE / 'events.json').read_text())
TL, END, BEAT, BAR = EV['TL'], EV['end'], 30, 120
BARS = [([60, 64, 67, 72], 36), ([57, 60, 64, 69], 33), ([53, 57, 60, 65], 29), ([55, 59, 62, 67], 31),
        ([60, 64, 67, 72], 36), ([57, 60, 64, 69], 33), ([53, 57, 60, 65, 69], 29), ([55, 59, 62, 65, 67], 31), ([60, 64, 67, 72, 76], 36)]
CH = [(i * BAR, b, c) for i, (c, b) in enumerate(BARS)]
MEL = [[(0, 76, 1), (1, 79, .5), (1.5, 76, .5), (2, 72, 2)], [(0, 76, 1), (1, 72, 1), (2, 69, 2)], [(0, 69, .5), (.5, 72, .5), (1, 77, 1), (2, 76, 2)], [(0, 74, 1), (1, 71, 1), (2, 67, 2)],
       [(0, 76, 1), (1, 79, .5), (1.5, 81, .5), (2, 84, 2)], [(0, 81, 1), (1, 76, 1), (2, 72, 2)], [(0, 77, 1), (1, 76, 1), (2, 74, 1), (3, 72, 1)], [(0, 74, 2), (2, 79, 2)], [(0, 84, 4)]]


class Cartoon(Song, SoftFX):
    pass


def add(*xs):
    m = max(len(x) for x in xs); y = np.zeros(m)
    for x in xs: y[:len(x)] += x
    return y


S = Cartoon(END, CH, beat=BEAT, seed=9, tail=3.0)
fr = S.fr
QUIET = (TL['wipe'][0], TL['curve'][1])          # 曲线那一段：伴奏收一点

for i, (ch, bass) in enumerate(BARS):
    f0 = i * BAR
    lv = 0.6 if QUIET[0] <= f0 < QUIET[1] else 1.0
    for b in range(4):                                                     # 拨弦：一拍一下，低音在 1、3 拍
        t = f0 + b * BEAT
        if b % 2 == 0:
            S.place(S.pizz(bass + (7 if b == 2 else 0), 1.0), fr(t), 0.75 * lv, -0.1)
        S.place(add(*[S.pizz(m, 0.4) for m in ch[1:4]]), fr(t + BEAT / 2), 0.4 * lv, 0.25, send=0.1)
    for beat, m, d in MEL[i]:                                              # 旋律：钢琴 + 马林巴叠一点
        S.place(add(S.grand(m, 0.8 + d * .4, 0.55), S.marimba(m, 0.35)), fr(f0 + beat * BEAT), 0.5, 0.15, send=0.35, bus=S.LEAD)
    S.place(S.strings([m - 12 for m in ch[:3]], BAR / 60, 0.45, att=0.4, rel=0.6, bright=1800), fr(f0), 0.5, 0, send=0.4)
for b in range(int(BAR / BEAT), int(END / BEAT)):                          # 很轻的鼓：只有沙锤和偶尔的底鼓
    fm = b * BEAT
    if fm >= TL['final'] + 70:
        break
    for s in (0, .5):
        S.place(S.hat(0.45), fr(fm + s * BEAT), 0.3, 0.3)
    if b % 4 == 0:
        S.place(S.kick(0.5), fr(fm), 0.4)

n = int(fr(END) * S.SR)
paper = lambda: S.fft_filter(S.rng.standard_normal(int(0.05 * S.SR)), lo=1800, hi=7000) * np.exp(-np.arange(int(0.05 * S.SR)) / (0.012 * S.SR))
for f in EV['flips']:                                                      # 每换一张画：纸
    S.sfx(paper(), fr(f), 0.22, float(np.sin(f * .7)) * 0.4, send=0.05)
for f in EV['lands']:                                                      # 落地
    S.sfx(add(S.poof(1.0, 0.25, 700), S.boing(43, 0.6, 0.45)), fr(f), 0.7, 0, send=0.2)
for f in EV['hops']:
    S.sfx(S.boing(50, 0.7, 0.4), fr(f), 0.45, 0.2, send=0.2)
# 慢放：铅笔沙沙（整段一层），每张洋葱皮一声木琴，往上走
tsec = np.arange(n) / S.SR
s0, s1 = TL['slow']
scratch = S.fft_filter(S.rng.standard_normal(n), lo=2500, hi=9000) * (1 + 0.6 * np.sin(2 * np.pi * 7 * tsec) ** 2)
env = np.clip((tsec * 60 - s0) / 20, 0, 1) * np.clip((s1 + 10 - tsec * 60) / 20, 0, 1)
S.SFX[0, :n] += scratch * env * 0.035; S.SFX[1, :n] += scratch * env * 0.03
scale = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86, 88, 91]
for k, f in enumerate(EV['slowTicks']):
    if f < s1:
        S.sfx(S.marimba(scale[k % len(scale)] + 12, 0.6), fr(f + 5), 0.28, -0.6 + 1.2 * k / 21, send=0.3)
S.sfx(S.brush(0.5, 1.0, False), fr(TL['wipe'][0]), 0.5, 0, send=0.2)        # 橡皮擦
for k, f in enumerate(EV['morph']):                                         # 刻度落到曲线上：叮
    S.sfx(S.celesta(scale[k % len(scale)] + 12, 0.8, 0.9), fr(f), 0.3, -0.5 + k / len(EV['morph']), send=0.4)
S.sfx(S.brush(0.6, 0.9, True), fr(TL['curve'][0]), 0.45, 0, send=0.2)       # 曲线一笔画过去
o0, o1 = TL['over']
t = S.tt((o1 - o0) / 60); fq = 440 * 2 ** (np.clip(t / t[-1], 0, 1) * 1.2 - np.clip((t / t[-1] - .7) / .3, 0, 1) * .4)
S.sfx(np.sin(2 * np.pi * np.cumsum(fq) / S.SR) * np.sin(np.pi * t / t[-1]) * 0.25, fr(o0), 0.5, 0.2, send=0.4)   # 冲过头：滑音
# 收束：最后一跳落地 → 签名 → 主和弦
F = EV['lands'][-1]
S.place(S.timpani(36, 0.8), fr(F), 0.55, 0, send=0.3)
sig = TL['sign']
S.sfx(S.fft_filter(S.rng.standard_normal(int(0.45 * S.SR)), lo=1500, hi=6000) * np.sin(np.linspace(0, np.pi, int(0.45 * S.SR))) * 0.5, fr(sig), 0.5, -0.3, send=0.1)
for k, m in enumerate([48, 60, 64, 67, 72, 76, 79, 84]):
    S.place(add(S.grand(m, 3.5, 0.65), S.celesta(m + 12, 2.0, 0.3)), fr(sig + 26 + k * 2), 0.38, -0.3 + 0.08 * k, send=0.5)
S.place(S.strings([48, 55, 60, 64, 67, 72], 2.6, 1.0, att=0.1, rel=1.8), fr(sig + 26), 0.5, 0, send=0.5)
S.text_cues(EV['cues'], 0.55)
S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
