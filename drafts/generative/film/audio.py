"""生成艺术开头小样（第二版）的配乐与音效：120 BPM、C 大调五声，木琴 + 拨弦 + 律动鼓组。每一段换一种声音：
流场（色带出生 = 木琴音，音高 = 画面高度）→ 倒带 → 圆一个个“啵”出来（越大越低）→ 吸到网格的细碎声 →
瓷砖一波波翻转（棘轮声）→ 缩进手机 → 滑块拖动（滑音）、重新生成 → 界面掉落 → 树一层层分叉（拨弦一层高一个音）→ 开花（钢片琴）→ 片名。
时间全部取自 timeline.js 和 events.json。python3 audio.py out.wav"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np


def grid(f0, step):
    """起点吸到全片的节拍网格上（否则底鼓、踩镲会错开拍点）"""
    return float(np.ceil(f0 / step - 1e-9) * step)

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[2] / 'scripts' / 'lib'))
from audio import AudioKit  # noqa: E402
from audio.orchestra import Orchestra  # noqa: E402


class Kit(AudioKit, Orchestra):
    pass


TL = json.loads(re.sub(r'//[^\n]*', '', re.search(r'const TL = (\{.*?\});', (HERE / 'timeline.js').read_text(), re.S).group(1)))
EV = json.loads((HERE / 'events.json').read_text())
FPS, BEAT, S16 = 60, 30, 7.5
END = TL['title'][1]
A = Kit(duration=END / FPS, seed=33, fps=FPS, tail=3.0)
fr = A.fr
rng = np.random.default_rng(9)

PENTA = [m + o for o in (48, 60, 72, 84) for m in (0, 2, 4, 7, 9)]
CH = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]     # C | Am | F | G
ROOT = [36, 33, 29, 31]


def bar(f):
    return int(f // 120) % 4


def slots(items, f0, f1, per=S16):
    out = defaultdict(list)
    for it in items:
        if f0 <= it[0] < f1:
            out[round(it[0] / per)].append(it)
    return sorted(out.items())


def bassline(f0, f1, level=1.0):
    for f in np.arange(grid(f0, 15), f1, 15):
        r = ROOT[bar(f)]
        A.place(A.bass(r + (12 if int(f // 15) % 4 == 3 else 0), 0.24, level), fr(f))


def pluck_chords(f0, f1, level=1.0):
    for f in np.arange(grid(f0, 30) + 15, f1, 30):
        for k, m in enumerate(CH[bar(f)]):
            A.place(A.pluck_string(m + 12, 0.35, level * 0.5, bright=0.4), fr(f + k * 0.6), pan=-0.3 + k * 0.3, send=0.2)


def drums(f0, f1, kick=True, clap=True, hats=True, level=1.0, shaker=False):
    for f in np.arange(grid(f0, 7.5), f1, 7.5):
        on = abs(f % BEAT) < 0.01
        if kick and on:
            A.place(A.kick(level), fr(f)); A.sidechain(f)
        if clap and on and int(f // BEAT) % 2 == 1:
            A.place(A.clap(level), fr(f), send=0.25)
        if hats and abs(f % 15) < 0.01:
            A.place(A.hat(level * (0.6 if on else 1.0)), fr(f), pan=0.25)
        if shaker:
            A.place(A.shaker(level), fr(f), pan=-0.3)


def bloop(m, level=1.0):
    """圆“啵”地长出来：音高先高一点再落到位"""
    t = A.tt(0.3)
    f = A.midi(m) * (1 + 0.6 * np.exp(-t / 0.02))
    return np.sin(2 * np.pi * np.cumsum(f) / A.SR) * A.env(t, 0.002, 0.08) * level * 0.4


# ① 流场：画在弹琴
f0, f1 = TL['flow']
for s, bs in slots(EV['grow'], f0, f1):
    bs.sort(key=lambda b: -b[2]); used = set()
    for b in bs[:1]:
        m = PENTA[int(round(5 + (1 - np.clip(b[1] / 1080, 0, 1)) * 12))]
        m = m + 12 if m in used else m; used.add(m)
        A.place(A.marimba(m, 0.55 + 0.3 * min(1, b[2] / 40)), fr(s * S16), send=0.25)
bassline(0, TL['rewind'][0], 0.9); drums(0, TL['rewind'][0], level=0.9, shaker=True); pluck_chords(0, TL['rewind'][0], 0.8)

# 倒带
r0, r1 = TL['rewind']
A.sfx(A.glide(84, 55, (r1 - r0) / FPS, 1.0), fr(r0)); A.sfx(A.whoosh((r1 - r0) / FPS + 0.1, 6000, 400, 0.6, peak=0.3), fr(r0))

# ② 圆：一个个“啵”出来，越大越低；律动回来
c0, c1 = TL['circles']
A.place(A.kick(1.2), fr(c0 + 4)); A.place(A.crash(0.6), fr(c0 + 4), send=0.4)
for s, cs in slots(EV['circ'], c0, c1):
    cs.sort(key=lambda c: -c[1])
    for c in cs[:2]:
        k = int(np.clip(14 - np.log2(max(c[1], 8)) * 2.2, 2, 18))
        A.sfx(bloop(PENTA[k], 0.5 + 0.5 * min(1, c[1] / 120)), fr(s * S16), pan=float(np.clip((c[2] / 1080 - 0.5), -0.6, 0.6)), send=0.25)
bassline(c0 + 4, TL['dots'][0], 1.0); drums(c0 + 34, TL['dots'][0], level=0.95); pluck_chords(c0 + 4, TL['dots'][0], 0.7)

# 缩成点、吸到网格
d0, d1 = TL['dots']
A.sfx(A.glide(60, 84, (d1 - d0) / FPS, 0.8), fr(d0))
for k in range(16):
    A.sfx(A.click(0.4, lo=2500, hi=9000), fr(d0 + 4 + k * 1.1), pan=float(rng.uniform(-0.7, 0.7)))

# ③ 瓷砖：出现一串木块声，每一波翻转一串棘轮声，越翻越快
t0 = TL['tiles'][0]
A.place(A.kick(1.2), fr(t0 + 4))
for k in range(12):
    A.sfx(A.thock(60 + (k % 5) * 3, 0.5), fr(t0 + 4 + k * 1.5), pan=-0.5 + k * 0.08)
for w in TL['flips']:
    A.place(A.kick(1.1), fr(w)); A.sidechain(w)
    for k in range(14):
        A.sfx(A.click(0.6, lo=1200, hi=5000, d=0.006), fr(w + k * 0.9), pan=float(np.sin(k * 0.7)) * 0.6)
    A.sfx(A.thock(72, 0.5), fr(w + 10))
bassline(t0 + 4, TL['shrink'][0], 1.0); drums(t0 + 34, TL['shrink'][0], level=1.0, shaker=True)
for k, m in enumerate([72, 76, 79, 84, 79, 76, 81, 84]):
    A.place(A.marimba(m, 0.8), fr(t0 + 34 + k * 7.5), send=0.3)

# 缩进手机；④ 网页 + 手机
s0, s1 = TL['shrink']
A.sfx(A.whoosh((s1 - s0) / FPS, 5000, 300, 0.7, peak=0.6), fr(s0)); A.sfx(A.thock(55, 1.0), fr(s1), send=0.2)
u0, u1 = TL['ui']
A.place(A.kick(1.0), fr(s1)); A.place(A.pad([60, 64, 67, 72], 1.5, 1.0), fr(s1), send=0.4)
bassline(s1, TL['clear'][0], 0.9); drums(s1 + 10, TL['clear'][0], clap=True, level=0.85); pluck_chords(s1, TL['clear'][0], 0.8)
g0, g1 = TL['drag']
A.sfx(A.click(1.0, lo=1500, hi=6000, d=0.006), fr(g0 - 2))
A.sfx(A.glide(55, 79, (g1 - g0) / FPS, 1.4), fr(g0), send=0.3)
for k, f in enumerate(np.arange(g0, g1, 3.75)):
    A.sfx(A.click(0.25, lo=3000, hi=9000), fr(f), pan=-0.4)
e0 = TL['reroll'][0]
A.sfx(A.click(1.2, lo=1200, hi=6000, d=0.006), fr(e0 - 2))
for k in range(10):
    A.sfx(A.celesta(PENTA[10 + k % 8], 0.5, 0.7), fr(e0 + 4 + k * 1.6), pan=0.6, send=0.3)

# 界面掉下去
l0, l1 = TL['clear']
A.sfx(A.whoosh((l1 - l0) / FPS + 0.1, 3000, 200, 0.8, peak=0.7), fr(l0)); A.sfx(A.boom(0.7, 90, 40, 0.5), fr(l1 - 2))

# ⑤ 树：每一层分叉，一个拨弦音往上走；开花一串钢片琴
T0 = TL['tree'][0]
A.place(A.kick(1.1), fr(T0 + 2)); A.place(A.pad([57, 60, 64, 69], 2.0, 1.0, att=0.5), fr(T0 + 2), send=0.5)
for s, bs in slots(EV['branch'], T0, TL['title'][0]):
    d = max(b[1] for b in bs)
    A.place(A.pizz(PENTA[min(19, int(4 + d * 1.5))], 1.3), fr(s * S16), pan=float(rng.uniform(-0.4, 0.4)), send=0.3)
for s, bl in slots([[t] for t in EV['bloom']], TL['bloom'][0], TL['title'][0] + 20, per=3.75):
    A.sfx(A.celesta(PENTA[int(rng.integers(10, 20))], 0.6, 0.45 + 0.1 * min(4, len(bl))), fr(s * 3.75), pan=float(rng.uniform(-0.7, 0.7)), send=0.35)
bassline(T0 + 30, TL['title'][0], 1.0); drums(T0 + 30, TL['title'][0], level=1.0, shaker=True); pluck_chords(T0 + 30, TL['title'][0], 0.8)
A.sfx(A.riser2(0.8, 0.7), fr(TL['title'][0]) - 0.8)

# 片名
T = TL['title'][0]
A.place(A.kick(1.4), fr(T)); A.place(A.hit(0.9, m=36), fr(T), send=0.3); A.place(A.crash(1.0), fr(T), send=0.5)
A.place(A.pad([60, 64, 67, 72, 76], 2.6, 1.3, att=0.05), fr(T), send=0.5)
bassline(T, END + 30, 1.0); drums(T + 30, END + 30, level=1.0, shaker=True); pluck_chords(T, END + 30, 0.9)
for k, m in enumerate([72, 76, 79, 84, 88]):
    A.place(A.bell(m, 0.8), fr(T + 4 + k * 3), send=0.4)

# 底下一直在走的律动（换场的那几拍留空）：沙锤 + 反拍拨弦 + 一条木琴旋律
MEL = [72, 76, 79, 76, 81, 79, 76, 74, 72, 74, 76, 79, 84, 81, 79, 76]
for a, b in [(TL['circles'][0] + 4, TL['dots'][0]), (TL['shrink'][1], TL['clear'][0]), (TL['tree'][0] + 30, TL['title'][0])]:
    drums(a, b, kick=False, clap=False, hats=False, shaker=True, level=1.2)
    for k, f in enumerate(np.arange(a + 15, b, 15)):
        A.place(A.marimba(MEL[k % len(MEL)], 0.7), fr(f), pan=0.2, send=0.3)
pluck_chords(TL['circles'][0] + 4, TL['dots'][0], 0.6)

A.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
