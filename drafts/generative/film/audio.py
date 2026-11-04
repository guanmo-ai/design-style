"""生成艺术小样的配乐与音效：120 BPM、C 大调五声，木琴 + 拨弦 + 律动鼓组。
“画在弹琴”：每条色带出生 = 一个木琴音，音高由它在画面上的高度决定（越靠上越高），按 16 分音符对齐。
时间全部取自 timeline.js 和 events.json。python3 audio.py out.wav"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[2] / 'scripts' / 'lib'))
from audio import AudioKit  # noqa: E402
from audio.orchestra import Orchestra  # noqa: E402


class Kit(AudioKit, Orchestra):
    pass


TL = json.loads(re.search(r'const TL = (\{.*?\});', (HERE / 'timeline.js').read_text(), re.S).group(1))
EV = json.loads((HERE / 'events.json').read_text())
FPS, BEAT, S16 = 60, 30, 7.5
END = TL['end']
A = Kit(duration=END / FPS, seed=33, fps=FPS, tail=2.5)
fr = A.fr

PENTA = [m + o for o in (48, 60, 72, 84) for m in (0, 2, 4, 7, 9)]         # C 五声，四个八度
CH = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]              # C | Am | F | G
ROOT = [36, 33, 29, 31]


def bar(f):
    return int(f // 120) % 4


def pitch(y, lo=5, hi=17):
    """画面高度 → 五声音阶：越靠上越高"""
    k = int(round(lo + (1 - np.clip(y / 1080, 0, 1)) * (hi - lo)))
    return PENTA[max(0, min(len(PENTA) - 1, k))]


def play_births(births, f0, f1, per=2, lo=5, hi=17, level=1.0, inst='marimba'):
    """出生时间按 16 分音符对齐；每格最多 per 个音（挑最粗的色带），并只用当前和弦里的五声音"""
    slots = defaultdict(list)
    for b in births:
        f = b[0]
        if f0 <= f < f1:
            slots[round(f / S16)].append(b)
    for s, bs in sorted(slots.items()):
        bs.sort(key=lambda b: -b[2])
        used = set()
        for b in bs[:per]:
            m = pitch(b[1], lo, hi)
            if m in used:
                m += 12
            used.add(m)
            lv = level * (0.6 + 0.4 * min(1, b[2] / 40))
            sig = A.marimba(m, lv) if inst == 'marimba' else A.celesta(m, 0.9, lv * 0.9)
            A.place(sig, fr(s * S16), pan=float(np.clip((b[1] / 1080 - 0.5) * -0.8, -0.6, 0.6)), send=0.25)


def bassline(f0, f1, level=1.0):
    for f in np.arange(f0, f1, 15):
        r = ROOT[bar(f)]
        A.place(A.bass(r + (12 if int(f // 15) % 4 == 3 else 0), 0.24, level), fr(f))


def pluck_chords(f0, f1, level=1.0):
    """反拍上的拨弦和弦，轻快"""
    for f in np.arange(f0 + 15, f1, 30):
        for k, m in enumerate(CH[bar(f)]):
            A.place(A.pluck_string(m + 12, 0.35, level * 0.5, bright=0.4), fr(f + k * 0.6), pan=-0.3 + k * 0.3, send=0.2)


def drums(f0, f1, kick=True, clap=True, hats=True, level=1.0, shaker=False):
    for f in np.arange(f0, f1, 7.5):
        on = abs(f % BEAT) < 0.01
        if kick and on:
            A.place(A.kick(level), fr(f)); A.sidechain(f)
        if clap and on and int(f // BEAT) % 2 == 1:
            A.place(A.clap(level), fr(f), send=0.25)
        if hats and abs(f % 15) < 0.01:
            A.place(A.hat(level * (0.6 if on else 1.0)), fr(f), pan=0.25)
        if shaker:
            A.place(A.shaker(level), fr(f), pan=-0.3)


# ── A 0—90：色带从左往右一起长，画自己在弹琴 ──
play_births(EV['grow'], 0, TL['B'], per=2)
bassline(0, TL['B'], 0.9)
drums(0, TL['B'], level=0.9, shaker=True)
pluck_chords(0, TL['B'], 0.8)

# ── B 90—180：一切变淡，方向场的箭头一片片翻出来（沙锤一样的细碎声），一个点顺着风走（上滑的音）──
B = TL['B']
A.place(A.kick(1.0), fr(B)); A.place(A.crash(0.5), fr(B), send=0.4)
A.place(A.pad([60, 64, 67, 72], 1.6, 1.4, att=0.25), fr(B), send=0.5)
A.place(A.pad([57, 60, 64, 69], 1.2, 1.2, att=0.4), fr(B + 60), send=0.5)
ar = sorted(EV['arrows'])
for k in range(0, len(ar), 12):                     # 箭头翻出来：一小群一个“嗒”，音越来越高
    f = ar[k]
    A.sfx(A.click(0.35, lo=2500 + k * 4, hi=10000), fr(f), pan=float(np.clip(-0.7 + k / len(ar) * 1.4, -0.7, 0.7)), send=0.15)
d0, d1 = TL['dot']
A.sfx(A.glide(67, 84, (d1 - d0) / FPS, 0.9), fr(d0), send=0.3)
for k, f in enumerate(np.arange(d0, d1, 7.5)):      # 点每走一段，一个木琴音往上爬
    A.place(A.marimba(PENTA[8 + k], 0.8), fr(f), send=0.3)
for f in np.arange(B + 30, TL['C'], 15):
    A.place(A.hat(0.5), fr(f), pan=0.25)

# ── C 180—270：推近；主角色带缩回去、再长，撞到前面那条就停（压扁、抖两下）──
C = TL['C']
A.sfx(A.whoosh(0.4, 400, 6000, 0.7, peak=0.6), fr(C - 6), send=0.2)
A.place(A.kick(1.0), fr(C))
r0, r1 = TL['retract']
A.sfx(A.glide(79, 60, (r1 - r0) / FPS + 0.05, 0.8), fr(r0))
g0, g1 = TL['regrow']
A.sfx(A.glide(55, 79, (g1 - g0) / FPS, 0.7), fr(g0), send=0.2)
for k, f in enumerate(np.arange(g0, g1, 7.5)):
    A.place(A.marimba(PENTA[5 + k % 5 + (k // 5) * 2], 0.7), fr(f), send=0.2)
hit = EV['hit']
A.sfx(A.thock(50, 1.4), fr(hit), send=0.3); A.place(A.kick(1.2), fr(hit)); A.sidechain(hit, 0.3, 0.3)
A.sfx(A.glide(74, 62, 0.25, 0.6), fr(hit + 2))      # “啵嗡”：被弹回来
A.sfx(A.thock(62, 0.6), fr(hit + 8)); A.sfx(A.thock(67, 0.35), fr(hit + 14))
bassline(C, TL['D'], 0.8)
drums(C + 30, TL['D'], clap=False, level=0.8)

# ── D 270—390：全部收回，再按粗细分三批长回来：粗的低音，细的高音，越来越密 ──
D = TL['D']
c0, c1 = TL['clear']
A.sfx(A.whoosh((c1 - c0) / FPS + 0.1, 6000, 300, 0.8, peak=0.3), fr(c0), send=0.2)
A.sfx(A.glide(84, 48, (c1 - c0) / FPS, 0.6), fr(c0))
for wv, (w0, w1, _, _) in enumerate(TL['waves']):
    play_births([b for b in EV['wave'] if b[3] == wv], w0 - 4, w1 + 4, per=1 + wv, lo=[0, 5, 10][wv], hi=[7, 12, 19][wv], level=[1.3, 1.0, 0.8][wv])
bassline(TL['waves'][0][0], TL['E'], 1.0)
drums(TL['waves'][0][0], TL['E'] - 15, level=1.0, shaker=True)
pluck_chords(TL['waves'][1][0], TL['E'] - 15, 0.9)
A.sfx(A.riser2(1.0, 0.9), fr(TL['E'] - 60))

# ── E 390：换种子。数字滚动，整张画倒带收回（磁带停转），停半拍，新的一张从中心炸开 ──
E = TL['E']
A.place(A.kick(1.1), fr(E)); A.sfx(A.thock(72, 1.0), fr(E), send=0.3)
for k in range(5):
    A.sfx(A.click(0.6), fr(E + 4 + k * 3.5), send=0.1)
w0, w1 = TL['rewind']
A.place(A.tape_stop((w1 - w0) / FPS + 0.1, 60, 1.6), fr(w0), send=0.3)
A.sfx(A.whoosh((w1 - w0) / FPS, 7000, 400, 0.7, peak=0.2), fr(w0))
G = TL['grow2'][0]
A.place(A.kick(1.4), fr(G)); A.place(A.hit(0.9, m=36), fr(G), send=0.3); A.place(A.crash(1.0), fr(G), send=0.4)
play_births(EV['growB'], G, END, per=3, level=0.9, inst='celesta')
bassline(G, END + 30, 1.0)
drums(G, END + 30, level=1.0, shaker=True)
pluck_chords(G, END + 30, 0.9)
T = TL['title']
A.place(A.pad([60, 64, 67, 72], 1.6, 1.2, att=0.05), fr(T), send=0.4)
for k, m in enumerate([72, 76, 79, 84]):
    A.place(A.bell(m, 0.8), fr(T + 4 + k * 3), send=0.4)

A.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
