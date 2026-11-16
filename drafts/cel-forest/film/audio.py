"""手绘动画 · 配乐：钢琴 + 弦乐 + 长笛 + 竖琴，F 大调，120 BPM，8 小节 = 16 秒（久石让式的夏天）。
开场钢琴八分音符分解和弦，分界线扫过去时竖琴往下刮，网格每变粗一次一声钟琴；镜头拉出来时弦乐渐强，第 3 小节全乐队进、长笛唱主题；
风吹过来时一阵风声 + 弦乐颤音；帽子落在灌木上那一下拨弦“叮”；片名出来时 F 大九和弦。python3 audio.py out.wav"""
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from band import Band  # noqa: E402

EV = json.loads((HERE / 'events.json').read_text())
TL, END, BEAT = EV['TL'], EV['end'], 30
BAR = 120
Fmaj7, Am7, Bbmaj7, C6, Dm7, Bb2, Gm7, Fmaj9 = [41, 53, 57, 60, 64], [45, 52, 55, 60, 64], [46, 53, 57, 62, 65], [48, 52, 55, 57, 60], [38, 53, 57, 60, 62], [46, 50, 53, 57, 60], [43, 53, 55, 58, 62], [41, 53, 57, 60, 64, 67]
BARS = [Fmaj7, Am7, Bbmaj7, C6, Dm7, Bb2, Gm7, Fmaj9]
CH = [(i * BAR, c[0], c) for i, c in enumerate(BARS)]


class Orch(Band):
    def flute(self, m, d=0.4, level=1.0):
        t = self.tt(d + 0.25)
        f0 = self.midi(m)
        v = 1 + 0.005 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.12) / 0.3, 0, 1)
        ph = 2 * np.pi * np.cumsum(f0 * v) / self.SR
        y = np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph)
        breath = self.fft_filter(self.rng.standard_normal(len(t)), lo=2000, hi=8000) * 0.05
        env = self._env(len(t), 0.05, 9, 1.0, 0.12)
        env[int(d * self.SR):] *= np.exp(-np.arange(len(t) - int(d * self.SR)) / (0.08 * self.SR))
        return (y + breath) * env * level * 0.4


S = Orch(END, CH, beat=BEAT, seed=31, tail=3.5)
fr = S.fr
P0, P1 = TL['pull']
FULL = 3 * BAR

# ───── 钢琴：八分音符分解和弦（开场独奏，后面轻一点）；左手每小节一个低音 ─────
for i, ch in enumerate(BARS[:-1]):
    f0 = i * BAR
    S.put('keys', S.grand(ch[0], 2.6, 0.55), frame=f0, gain=0.5, pan=-0.2)
    up = [ch[1], ch[2], ch[3], ch[4] if len(ch) > 4 else ch[3] + 12, ch[3] + 12, ch[4] + 12 if len(ch) > 4 else ch[2] + 12, ch[3] + 12, ch[2]]
    for k, m in enumerate(up):
        S.put('keys', S.grand(m + (12 if i >= 3 else 0) * 0, 1.1, 0.42 if i < 3 else 0.32), beat=i * 4 + k * .5, gain=0.42 if i < 3 else 0.3, pan=-0.3 + 0.08 * k)

# ───── 弦乐：拉出来时渐强，第 3 小节铺满 ─────
S.put('pad', S.strings([53, 57, 60, 64], (P1 - P0) / 60 + 0.4, 1.0, att=(P1 - P0) / 60 * .9, rel=0.6, swell=True), frame=P0, gain=0.5)
for i in range(3, 7):
    S.put('pad', S.strings([m for m in BARS[i][1:5]] + [BARS[i][0] + 12], BAR / 60 * 1.02, 0.95, att=0.35, rel=0.8, bright=2400), frame=i * BAR, gain=0.42)
    S.put('bass', S.pizz(BARS[i][0], 1.0), frame=i * BAR, gain=0.7)
    S.put('bass', S.pizz(BARS[i][0] + 7, 0.8), beat=i * 4 + 2, gain=0.55)

# ───── 主题：长笛，第 3—6 小节 ─────
MEL = {3: [(0, 72, 1), (1, 74, .5), (1.5, 76, .5), (2, 79, 1.5), (3.5, 77, .5)], 4: [(0, 77, 1), (1, 76, 1), (2, 74, 1), (3, 72, 1)],
       5: [(0, 74, 1.5), (1.5, 77, .5), (2, 81, 1), (3, 79, 1)], 6: [(0, 77, 1), (1, 76, .5), (1.5, 74, .5), (2, 72, 2)]}
for bar, notes in MEL.items():
    for o, m, d in notes:
        S.put('lead', S.flute(m + 12, d * BEAT / 60 * 0.95, 1.0), beat=bar * 4 + o, gain=0.7, pan=0.15)
        S.put('lead', S.glock(m + 24, 0.8, 0.4), beat=bar * 4 + o, gain=0.08, pan=0.3)

# ───── 轻打击：沙锤 + 很轻的底鼓（第 3—6 小节）─────
for b in range(12, 28):
    S.put('drums', S.shaker2(1.0), beat=b + .5, gain=0.35, pan=0.4)
    S.put('drums', S.shaker2(0.6), beat=b + .25, gain=0.2, pan=0.5)
    if b % 4 == 0:
        S.kick_at(S.at(b), 0.45, 0.4)

# ───── 画面里的声音 ─────
s0, s1 = TL['split']
for k in range(12):                                                  # 分界线扫过：竖琴往下刮
    S.put('keys', S.harp([84, 81, 79, 77, 74, 72, 69, 67, 65, 62, 60, 57][k], 1.4, 0.8), frame=s0 + k * (s1 - s0) / 12, gain=0.3, pan=0.6 - 0.1 * k)
g0, g1 = TL['grow']
S.sfx(S.shimmer((g1 - g0) / 60, 0.8), fr(g0), 0.25, 0, send=0.4)
for k, f in enumerate(TL['cells']):                                    # 网格变粗：钟琴
    S.put('keys', S.glock([79, 84, 88][k], 1.4, 1.0), frame=f, gain=0.3, pan=0.2)
S.sfx(S.riser2((P1 - P0) / 60, 0.4), fr(P0), 0.22, 0, send=0.3)
n = int(fr(END) * S.SR); tsec = np.arange(n) / S.SR
w0, w1 = TL['gust']
wind = S.fft_filter(S.rng.standard_normal(n), lo=300, hi=3000) * (1 + 0.5 * np.sin(2 * np.pi * 0.8 * tsec))
wenv = np.clip((tsec * 60 - w0) / 50, 0, 1) * np.clip((w1 - tsec * 60) / 70, 0, 1)
S.SFX[0, :n] += wind * wenv * 0.06; S.SFX[1, :n] += np.roll(wind, 1300) * wenv * 0.06
birds = np.zeros(n)
for k in range(10):                                                    # 远处的鸟叫
    t0 = int(S.rng.uniform(5.5, 15) * S.SR); d = int(0.09 * S.SR); tt = np.arange(d) / S.SR
    if t0 + d < n: birds[t0:t0 + d] += np.sin(2 * np.pi * np.cumsum(3200 + 900 * np.sin(2 * np.pi * 18 * tt)) / S.SR) * np.sin(np.pi * tt / tt[-1]) * 0.05
S.SFX[0, :n] += birds; S.SFX[1, :n] += np.roll(birds, 400)
for f in EV['hatFlips'][::2]:                                          # 帽子翻一下：很轻的风
    S.sfx(S.whoosh(0.18, 600, 3000, 0.5), fr(f), 0.08, 0.3, send=0.1)
L = TL['hat'][1]
S.put('bass', S.pizz(65, 1.0), frame=L, gain=0.6); S.put('keys', S.glock(89, 1.6, 1.0), frame=L, gain=0.28)
S.sfx(S.poof(0.8, 0.2, 900), fr(L), 0.25, 0, send=0.2)
T0 = TL['title']                                                       # 片名：F 大九
S.put('pad', S.strings([53, 57, 60, 64, 67, 72], 3.0, 1.1, att=0.3, rel=2.0), frame=T0, gain=0.55)
for k, m in enumerate([41, 53, 57, 60, 64, 67, 72, 76]):
    S.put('keys', S.grand(m, 3.5, 0.6), frame=T0 + k * 2, gain=0.4, pan=-0.3 + 0.08 * k)
S.put('lead', S.flute(81, 2.0, 1.0), frame=T0, gain=0.6)
for k, m in enumerate([77, 81, 84, 88, 89, 93]):
    S.put('keys', S.glock(m, 1.6, 0.6), frame=TL['sign'] + k * 3, gain=0.12, pan=-0.4 + 0.16 * k)
S.text_cues(EV['cues'], 0.4)
S.mix(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), levels=dict(keys=0.8, pad=0.7, lead=0.75, drums=0.6, bass=0.7), room=1.8, plate=1.0, air=1.3)
