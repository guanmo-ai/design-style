"""湿拓 配乐。90 BPM（一拍 = 40 帧）· D 大调，流动、松弛、原声：竖琴分解和弦 + 弦乐铺底 + 拨弦低音 + 卡林巴式的水滴。
时间全部取自 timeline.js；每一滴的帧号、面积、颜色取自 events.json（node ../../_lib/events.cjs film.html events.json）。
- 每一滴一个音，音高跟大小走（滴越大越低），外加一声“滴答”的水声；
- 梳子 / 耙拉过去是一串竖琴滑音，每根弦在梳齿划过那个位置时才响（音高跟着梳子的位置走）；
- 纸盖下去 / 揭起来是一声很轻的“唰”；针拉卷是一个往上 / 往下的滑音；推进去 ×20 是一层慢慢亮起来的泛音。
python3 audio.py out.wav"""
import json
import re
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from song import Song  # noqa: E402
from softfx import SoftFX  # noqa: E402

TL = json.loads(re.sub(r'//[^\n]*', '', re.search(r'const TL = (\{.*?\});', (HERE / 'timeline.js').read_text(), re.S).group(1)))
EV = json.loads((HERE / 'events.json').read_text())
B = TL['beat']
END = TL['end']

# 和弦：(起始帧, 低音, 和弦音)。一小节 4 拍 = 160 帧
DM7, BM9, GM7, A6, FS, GM7S, DM9 = [62, 66, 69, 73], [59, 62, 66, 69, 73], [55, 59, 62, 66], [57, 61, 64, 66], [54, 57, 62, 66], [55, 59, 62, 66, 73], [62, 66, 69, 73, 76]
CH = [(0, 38, DM7), (160, 35, BM9), (320, 43, GM7), (400, 45, A6), (520, 38, DM7), (640, 42, FS), (720, 43, GM7S), (852, 45, A6), (TL['label'], 38, DM9)]


class FilmSong(Song, SoftFX):
    def plip(self, m, level=1.0):
        """水滴：正弦，音高 30 毫秒里往上挑一个八度（“滴”），尾巴很短"""
        t = self.tt(0.18)
        f = self.midi(m) * (1 + 1.0 * (1 - np.exp(-t / 0.012)))
        return np.sin(2 * np.pi * np.cumsum(f) / self.SR) * np.minimum(1, t / 0.002) * np.exp(-t / 0.035) * level * 0.5

    def kalimba(self, m, level=1.0):
        """卡林巴：基音 + 一个不协和的高泛音，敲击短、尾巴圆"""
        t = self.tt(1.4)
        f = self.midi(m)
        y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.5) + 0.3 * np.sin(2 * np.pi * 5.4 * f * t) * np.exp(-t / 0.03) + 0.12 * np.sin(2 * np.pi * 2.0 * f * t) * np.exp(-t / 0.2)
        return y * np.minimum(1, t / 0.0015) * level * 0.2

    def swish(self, d=0.5, level=1.0, bright=1.0):
        """纸“唰”：带通噪声，前沿慢、后沿快，频带从低扫到高"""
        t = self.tt(d)
        n = self.rng.standard_normal(len(t))
        lo = self.fft_filter(n, lo=500, hi=2500) * (1 - t / d) + self.fft_filter(n, lo=2500 * bright, hi=9000) * (t / d)
        return lo * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2.2 * level * 0.35


S = FilmSong(END, CH, fps=60, beat=B, seed=11)
fr = S.fr
SCALE = [50, 52, 54, 57, 59, 62, 64, 66, 69, 71, 74, 76, 78, 81, 83, 86, 88, 90]   # D 大调五声（加 B），竖琴滑音用


def chord_at(f):
    c = CH[0]
    for x in CH:
        if f >= x[0]:
            c = x
    return c


# —— 弦乐铺底：每个和弦一段（第 0 帧就在，没有前奏）——
for i, (s, root, ns) in enumerate(CH):
    e = CH[i + 1][0] if i + 1 < len(CH) else END + 120
    d = fr(e - s) + 0.5
    S.place(S.strings([n - 12 for n in ns[:4]], d, 1.0, att=0.25 if i else 0.02, rel=0.6, bright=1800), fr(s), 0.8, 0.0, send=0.4, bus=S.PUMP)
    S.place(S.pizz(root, 1.0), fr(s), 0.9, -0.1, send=0.1)
    if e - s >= 2 * B:
        S.place(S.pizz(root + 7, 0.8), fr(s + 2 * B), 0.7, -0.1, send=0.1)

# —— 竖琴分解和弦（八分音符，上去下来），推进 ×20 那一段停下来让泛音出来 ——
for k, fm in enumerate(np.arange(0, END, B / 2)):
    if TL['dive'][0] + 10 <= fm < TL['dive'][2] - 10 or TL['peel1'][0] <= fm < TL['drop1'][0]:
        continue
    ns = chord_at(fm)[2]
    pat = [0, 1, 2, 3, 4, 3, 2, 1]
    j = pat[k % 8]
    m = ns[j % len(ns)] + 12 * (j // len(ns))
    S.place(S.harp(m, 1.6, 1.0), fr(fm), 0.42 if k % 2 == 0 else 0.3, 0.3 * (-1) ** k, send=0.3, bus=S.LEAD)

# —— 很轻的节奏：每拍一个闷的底鼓，反拍沙锤（从第一滴开始，推进时停）——
for fm in np.arange(TL['drop1'][0], TL['dive'][0], B):
    S.place(S.kick(0.45), fr(fm), 0.5); S.kicks.append(fm)
for fm in np.arange(TL['drop1'][0] + B / 2, TL['dive'][0], B):
    S.place(S.shaker(0.6), fr(fm), 0.35, 0.3)
for fm in np.arange(TL['dive'][2], TL['label'], B):
    S.place(S.kick(0.4), fr(fm), 0.45); S.kicks.append(fm)

# —— 每一滴：卡林巴（音高跟大小：面积越大越低）+ 水滴声 ——
for f0, a, col, small, x in EV['drops']:
    ns = chord_at(f0)[2]
    r = np.sqrt(a)
    lvl = int(np.clip((150 - r) / 18, 0, 6)) if not small else 9
    m = ns[lvl % len(ns)] + 12 * (lvl // len(ns)) + 12
    pan = float(np.clip(x / 1100, -0.8, 0.8))
    gap = min([abs(f0 - g[0]) for g in EV['drops'] if g[0] != f0] + [40])
    dens = float(np.clip(gap / 20, 0.35, 1.0))              # 挤在一起的滴（一圈推一圈的那一阵）压低一点
    S.sfx(S.kalimba(m, 1.0), fr(f0), (0.55 if not small else 0.3) * dens, pan, send=0.35)
    S.sfx(S.plip(m + 12, 1.0), fr(f0) - 0.01, (0.3 if not small else 0.18) * dens, pan, send=0.25)


# —— 梳子 / 耙：竖琴滑音，每根弦在梳齿划过对应位置的那一帧响 ——
def gliss(tip_of_frame, f0, f1, x0, x1, notes, level=0.55, pan0=-0.6, pan1=0.6):
    xs = np.linspace(x0, x1, len(notes) + 1)[1:]
    prev = tip_of_frame(f0)
    for f in range(int(f0), int(f1) + 1):
        cur = tip_of_frame(f)
        for k, xk in enumerate(xs):
            if (prev < xk <= cur) or (cur < xk <= prev):
                pan = pan0 + (pan1 - pan0) * k / max(1, len(notes) - 1)
                S.place(S.harp(notes[k], 1.2, 1.0), fr(f), level, pan, send=0.35, bus=S.LEAD)
        prev = cur


def ease_io2(t):
    t = min(1.0, max(0.0, t))
    return 2 * t * t if t < 0.5 else 1 - (-2 * t + 2) ** 2 / 2


combA = lambda f: TL['combA']['x0'] + TL['combA']['v'] * f
gliss(combA, 0, 75, -900, 1050, SCALE[4:16], 0.8)
for i, (a, b) in enumerate(TL['rake']):
    tip = lambda f, a=a, b=b: -780 + 1650 * (0.5 - 0.5 * np.cos(np.pi * min(1, max(0, (f - a) / (b - a)))))
    notes = SCALE[2:9] if i != 1 else SCALE[8:1:-1]
    gliss(tip, a, b, -700, 700, notes, 0.5, -0.4 if i != 1 else 0.4, 0.4 if i != 1 else -0.4)
ctip = lambda f: -1100 + 2350 * (0.5 - 0.5 * np.cos(np.pi * min(1, max(0, (f - TL['comb'][0]) / (TL['comb'][1] - TL['comb'][0])))))
gliss(ctip, TL['comb'][0], TL['comb'][1], -950, 1000, SCALE[3:18], 0.5)

# —— 纸：盖下去一声低的“唰”，揭起来一声亮的“唰” ——
S.sfx(S.swish(fr(TL['lay1'][1] - TL['lay1'][0]), 1.0, 0.7), fr(TL['lay1'][0]), 0.8, -0.3, send=0.2)
S.sfx(S.swish(fr(TL['peel1'][1] - TL['peel1'][0]) * 0.8, 1.0, 1.3), fr(TL['peel1'][0] + 6), 1.0, 0.3, send=0.3)
S.sfx(S.swish(fr(TL['lay2'][1] - TL['lay2'][0]), 1.0, 0.7), fr(TL['lay2'][0]), 0.8, -0.3, send=0.2)
S.sfx(S.swish(fr(TL['peel2'][1] - TL['peel2'][0]) * 0.8, 1.0, 1.3), fr(TL['peel2'][0] + 4), 1.0, 0.4, send=0.3)

# —— 针拉卷：每一道一个滑音（正转往上、反转往下）+ 一声钢片琴 ——
for k, t0 in enumerate(TL['curls']):
    up = k % 2 == 0
    S.sfx(S.glide(74 if up else 86, 86 if up else 74, 0.6, 1.0), fr(t0 - 10), 1.4, -0.5 + 0.33 * k, send=0.4)
    S.sfx(S.celesta(chord_at(t0)[2][k % 4] + 24, 1.4, 1.0), fr(t0 + 6), 0.8, -0.5 + 0.33 * k, send=0.4)

# —— 推进去 ×20：一层泛音慢慢亮起来，到顶一声钟，拉回来时散掉 ——
d0, d1, d2 = TL['dive']
S.sfx(S.shimmer(fr(d2 - d0), 1.0), fr(d0), 0.7, 0.0, send=0.6)
S.sfx(S.bell(81, 1.0, 1.8), fr(d1), 0.5, 0.0, send=0.6)
S.sfx(S.glide(93, 81, fr(d2 - d1), 1.0), fr(d1), 0.6, 0.0, send=0.5)

# —— 收束：签条落到成品上：低音 + 竖琴扫弦 + 钟 ——
L = TL['label']
S.place(S.kick(1.0), fr(L), 0.9); S.kicks.append(L)
S.sfx(S.boom(0.6, 90, 40, 0.8), fr(L), 0.6)
for j, m in enumerate([50, 57, 62, 66, 69, 73, 76, 81]):
    S.place(S.harp(m, 2.5, 1.0), fr(L) + j * 0.022, 0.5, -0.4 + j * 0.1, send=0.45, bus=S.LEAD)
S.sfx(S.bell(86, 1.0, 2.2), fr(L), 0.45, 0.0, send=0.6)

# —— 文字：每个字落定一声“嗒”（压低，水边的轻声）——
S.text_cues(EV['cues'], 0.55)

S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
