"""厚涂 · 配乐：雨夜的钢琴。120 BPM（一拍 30 帧，一小节 120 帧 = 2 秒），D 小调，9 小节一首歌从头走到尾。
钢琴和弦 + 一句旋律，弦乐铺底；第 2 小节进很轻的鼓，推到伞上那两小节鼓撤掉、弦乐吸进来，拉回全景时鼓和雨一起回来；收在 F 大九。
刷子的声音跟着“每一帧开始画几笔”走：大笔低沉、小笔细密；高光一下一下“嗒”；色板每块一声湿的“啪”；最后一笔红“啪”地拖过去，主和弦落下。
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

# 每小节一个和弦：(和弦音, 贝斯)
BARS = [([62, 65, 69, 72, 76], 38), ([58, 62, 65, 69, 72], 34), ([55, 58, 62, 65, 69], 31), ([57, 61, 64, 67, 71], 33),
        ([62, 65, 69, 72, 76], 38), ([58, 62, 65, 69, 74], 34), ([57, 60, 65, 69, 72], 33), ([55, 58, 62, 65, 70], 36),
        ([53, 57, 60, 64, 67, 69], 29)]
CH = [(i * BAR, b, c) for i, (c, b) in enumerate(BARS)]
MEL = [[(0, 81, 1.5), (1.5, 79, .5), (2, 77, 2)], [(0, 77, 1), (1, 74, 1), (2, 77, 2)], [(0, 74, 1.5), (1.5, 72, .5), (2, 70, 2)], [(0, 73, 2), (2, 76, 2)],
       [(0, 81, 1.5), (1.5, 79, .5), (2, 77, 1), (3, 81, 1)], [(0, 82, 3), (3, 81, 1)], [(0, 77, 2), (2, 76, 1), (3, 74, 1)], [(0, 74, 2), (2, 72, 2)], [(0, 76, 4)]]


class Rain(Song, SoftFX):
    pass


def add(*xs):
    m = max(len(x) for x in xs); y = np.zeros(m)
    for x in xs: y[:len(x)] += x
    return y


S = Rain(END, CH, beat=BEAT, seed=5, tail=3.5)
fr = S.fr
PUSH0, PUSH1, ALIVE = TL['push'][0], TL['push'][1], TL['alive']

# —— 钢琴：每小节第一拍一个和弦（低音 + 分解），一句旋律 ——
for i, (ch, bass) in enumerate(BARS):
    f0 = i * BAR
    S.place(add(S.grand(bass, 3.0, 0.55), S.grand(bass + 12, 3.0, 0.4)), fr(f0), 0.55, -0.15, send=0.35)
    for k, m in enumerate(ch[:4]):
        S.place(S.grand(m, 2.4, 0.45), fr(f0 + 6 + k * 5), 0.32, -0.2 + 0.13 * k, send=0.45)
    for beat, m, d in MEL[i]:
        S.place(S.grand(m, 1.2 + d * .5, 0.6), fr(f0 + beat * BEAT), 0.5, 0.18, send=0.5, bus=S.LEAD)
    # 弦乐铺底：推进那两小节更满
    lv = 0.9 if PUSH0 <= f0 < PUSH1 + 60 else 0.55
    S.place(S.strings([m - 12 for m in ch[:4]], BAR / 60 * 1.05, lv, att=0.5, rel=0.8, bright=1700), fr(f0), 0.7, 0, send=0.4)

# —— 很轻的鼓：第 2 小节进，推到伞上撤掉，拉回全景回来，最后一小节只留一下 ——
for b in range(int(BAR / BEAT), int(END / BEAT)):
    fm = b * BEAT
    if PUSH0 <= fm < ALIVE or fm >= TL['under']:
        continue
    S.place(S.kick(0.55), fr(fm), 0.55)
    if b % 2:
        S.place(S.snare(0.5), fr(fm), 0.22, -0.05, send=0.3)
    for s in (0, 0.5):
        S.place(S.hat(0.6), fr(fm + s * BEAT), 0.35, 0.3)
for fm in np.arange(BAR, END, BEAT / 2):
    if PUSH0 <= fm < ALIVE:
        continue
    S.place(S.sbass(S.chord(fm)[1] + 12, 0.24), fr(fm), 0.22, bus=S.PUMP)

# —— 刷子：每帧开始画几笔 → 一层带通噪声，大笔低、小笔高 ——
n = int(fr(END) * S.SR)
tsec = np.arange(n) / S.SR


def bed(counts, lo, hi, gain, smooth=7, norm=None):
    c = np.convolve(np.array(counts, float), np.ones(smooth) / smooth, 'same')
    c = c / (norm or max(1, c.max()))
    env = np.interp(tsec * 60, np.arange(len(c)), np.clip(c, 0, 1)) ** .8
    noise = S.fft_filter(S.rng.standard_normal(n), lo=lo, hi=hi)
    wob = 1 + 0.35 * np.sin(2 * np.pi * 3.1 * tsec) * np.sin(2 * np.pi * 0.7 * tsec)   # 来回刷的起伏
    pan = 0.5 * np.sin(tsec * 1.3)
    S.SFX[0, :n] += noise * env * wob * gain * (1 - pan)
    S.SFX[1, :n] += noise * env * wob * gain * (1 + pan)


bed(EV['big'], 250, 2400, 0.16)
bed(EV['mid'], 600, 4800, 0.11)
bed(EV['small'], 1800, 9000, 0.07)
bed(EV['title'], 500, 5000, 0.12)
# 高光：嗒
last = -9
for f, c in enumerate(EV['hi']):
    if c and f - last >= 3:
        S.sfx(S.bop(S.tone(f, int(f) % 5, 2), 0.5, 0.08), fr(f), 0.18, float(np.sin(f)) * 0.5, send=0.25); last = f

# —— 推到伞上：吸进来 + 落在小节线 ——
S.sfx(S.riser2((PUSH1 - PUSH0) / 60 * 0.9, 0.5), fr(PUSH0 + 20), 0.35, 0, send=0.3)
S.place(S.strings([62, 69, 74, 77, 81], 1.4, 1.2, att=1.2, swell=True), fr(PUSH1) - 1.2, 0.7, 0, send=0.45)
S.sfx(S.timpani(38, 0.7), fr(PUSH1), 0.45, 0, send=0.3)

# —— 画活过来：雨 ——
rain = S.fft_filter(S.rng.standard_normal(n), lo=1500, hi=11000) + 0.5 * S.fft_filter(S.rng.standard_normal(n), lo=300, hi=1500)
drops = np.zeros(n); idx = S.rng.integers(0, n, 9000); drops[idx] = S.rng.uniform(0.2, 1, len(idx))
drops = np.convolve(drops, np.exp(-np.arange(200) / 30), 'same')
renv = np.clip((tsec * 60 - ALIVE) / 120, 0, 1) ** 1.5
S.SFX[0, :n] += (rain * 0.05 + drops * 0.02) * renv
S.SFX[1, :n] += (rain * 0.05 + np.roll(drops, 777) * 0.02) * renv

# —— 色板：每块一声湿的“啪” ——
for k, f in enumerate(EV['palette']):
    S.sfx(add(S.poof(0.9, 0.22, 900), S.bop(S.tone(f, k, 1), 0.6, 0.12)), fr(f + 2), 0.4, -0.5 + 0.2 * k, send=0.3)

# —— 收束：最后一笔红 ——
U = TL['under']
S.sfx(S.brush(0.26, 1.2, True), fr(U), 0.9, -0.3, send=0.2)
S.sfx(S.poof(1.0, 0.3, 1200), fr(U + 12), 0.8, 0.2, send=0.3)
S.place(S.timpani(41, 0.9), fr(U + 12), 0.6, 0, send=0.35)
for k, m in enumerate([41, 53, 57, 60, 64, 67, 69, 76]):
    S.place(S.grand(m, 4.0, 0.7), fr(U + 12 + k * 1.5), 0.42, -0.3 + 0.08 * k, send=0.5)
S.place(S.strings([53, 57, 60, 64, 69], 3.0, 1.2, att=0.08, rel=2.0), fr(U + 12), 0.55, 0, send=0.5)

S.text_cues(EV['cues'], 0.55)
S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
