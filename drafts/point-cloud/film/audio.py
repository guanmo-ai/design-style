"""点云全片的配乐（一整首歌，18 秒）。120 BPM（一拍 = 30 帧）· E 小调 · 透亮的数字感电子：拨弦琶音、钟琴、扫描的“嗖”。
开场只有一个点的“嘀”——第 12 帧炸开（一百万颗小碎响），第 90 帧字锁定，鼓进来。
声音和画面一一对应：扫描面 = 一道往下走的带通噪声 + 每米一声刻度；点飞起来 = 一把细碎的亮片声；
鼠标拨开 = 跟着光标走的刷子声；手机扫描 = 覆盖度每涨一格一声。时间取自 timeline.js。python3 audio.py out.wav"""
import json
import re
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from song import Song  # noqa: E402

TL = json.loads(re.sub(r'//[^\n]*', '', re.search(r'const TL = (\{.*?\});', (HERE / 'timeline.js').read_text(), re.S).group(1)))
EM, C, G, D, AM, B7 = [64, 67, 71], [64, 67, 72], [62, 67, 71], [62, 66, 69], [64, 69, 72], [63, 66, 69, 71]
CH = [(0, 40, EM), (90, 36, C), (120, 43, G), (150, 38, D), (180, 40, EM), (210, 36, C), (240, 43, G), (270, 38, D),
      (300, 40, EM), (360, 36, C), (420, 43, G), (480, 38, D),
      (510, 45, AM), (570, 36, C), (600, 35, B7), (634, 40, EM),          # 03：B7 绷紧，634 树聚成 = 回到主和弦
      (690, 36, C), (750, 43, G), (800, 38, D), (840, 40, EM), (890, 36, C), (925, 43, G),
      (960, 36, C), (1000, 38, D), (1040, 40, EM)]
END = TL['end']
S = Song(END, CH, seed=23)
fr = S.fr
rng = np.random.default_rng(7)
FIN = TL['final']


def ping(m, level=1.0, dec=0.18):
    t = S.tt(dec * 3)
    y = np.sin(2 * np.pi * S.midi(m) * t) + 0.2 * np.sin(2 * np.pi * S.midi(m) * 3 * t) * np.exp(-t / 0.02)
    return y * np.minimum(1, t / 0.0006) * np.exp(-t / dec) * level * 0.4


def glitter(d, density, m_lo=84, m_hi=108, level=1.0):
    """一把亮片：很多个很短的高音“叮”，音高随机取在当前和弦里"""
    n = int(d * S.SR)
    y = np.zeros(n)
    for k in range(int(d * density)):
        i = int(rng.uniform(0, n - 4000))
        m = int(rng.uniform(m_lo, m_hi))
        p = ping(m, rng.uniform(0.2, 1.0), 0.05)
        y[i:i + len(p)] += p[:n - i]
    return y * level


def scan(d, f0, f1, level=1.0, q=0.18):
    """扫描面：一段带通噪声，中心频率从 f0 滑到 f1"""
    t = S.tt(d)
    n = S.rng.standard_normal(len(t))
    out = np.zeros_like(t)
    seg = int(0.02 * S.SR)
    for i in range(0, len(t), seg):
        fc = f0 * (f1 / f0) ** (i / len(t))
        out[i:i + seg] = S.fft_filter(n[i:i + seg * 3], lo=fc * (1 - q), hi=fc * (1 + q))[:len(out[i:i + seg])]
    return out * np.sin(np.pi * t / d) ** 0.5 * level * 0.6


def lead(m, d):
    y = S.celesta(m, max(d, 0.4), 0.8) * 2.2
    b = S.bell(m + 12, 0.5, 0.6)
    n = max(len(y), len(b))
    return np.pad(y, (0, n - len(y))) + np.pad(b, (0, n - len(b)))


def pluck(m):
    return S.pluck_string(m, 0.25, 0.9, 0.8)


BRK = [(600, 634)]
S.drums(TL['lock'], FIN, skip=BRK)
for fm in np.arange(TL['lock'], FIN, 7.5):
    if not any(a <= fm < z for a, z in BRK):
        S.place(S.shaker(1.0), fr(fm), 1.3 if fm % 15 else 0.8, 0.35)
S.bassline(TL['assemble'][0], FIN, skip=BRK)
S.pad(1.0, fc=1600)
S.arp(TL['lock'], FIN, 1.1, skip=BRK, inst=pluck, pattern=(0, 1, 2, 4, 3, 2, 1, 2))
S.place(S.kick(1.3), fr(FIN), 1.0); S.kicks.append(FIN)
S.place(S.sbass(40, 1.6), fr(FIN), 0.5, bus=S.PUMP); S.place(S.sbass(52, 1.6), fr(FIN), 0.3, bus=S.PUMP)
S.place(S.crash(1.2), fr(FIN), 0.9, send=0.5)
for k, m in enumerate([76, 79, 83, 88, 91]):
    S.place(S.bell(m, 0.8), fr(FIN + k * 3), 0.55, -0.4 + 0.2 * k, send=0.45)

HOOK = {
    90: [(0, 76, 1), (1, 79, 1), (2, 84, 2), (4, 83, 1), (5, 79, 1)], 150: [(0, 78, 2), (2, 81, 1), (3, 86, 1)], 180: [(0, 83, 2), (2, 79, 2)],
    240: [(0, 79, 1), (1, 83, 1), (2, 86, 2)], 300: [(0, 88, 2), (2, 83, 2)], 360: [(0, 84, 1), (1, 79, 1), (2, 76, 2)], 420: [(0, 83, 1), (1, 86, 1), (2, 91, 2)],
    480: [(0, 86, 2), (2, 81, 2)], 510: [(0, 84, 1), (1, 81, 1), (2, 76, 2)], 570: [(0, 79, 1), (1, 84, 1), (2, 88, 2)],
    634: [(0, 88, 1), (1, 83, 1), (2, 79, 1), (3, 76, 1)], 690: [(0, 79, 2), (2, 84, 2)], 750: [(0, 83, 1), (1, 86, 1), (2, 91, 2)],
    840: [(0, 76, 1), (1, 79, 1), (2, 83, 2)], 925: [(0, 86, 1), (1, 91, 1), (2, 95, 2)], 960: [(0, 88, 2), (2, 84, 2)], 1040: [(0, 88, 4)], 1050: [(0, 88, 8)],
}
for s, notes in HOOK.items():
    S.hook(s, notes, 0.9, inst=lead)
for t, up in ((150, True), (300, False), (510, True), (640, False), (800, True), (960, False)):
    S.transition(t, up, 0.75)

# —— 00：一个点 → 炸开 → 拼成字 ——
for k in range(4):
    S.sfx(ping(88, 0.8, 0.12), fr(k * 3), 0.35, 0.0, send=0.5)
S.place(S.kick(1.4), fr(TL['assemble'][0]), 1.0); S.kicks.append(TL['assemble'][0])
S.sfx(S.boom(1.0, 120, 36, 1.2), fr(TL['assemble'][0]), 0.8)
S.sfx(S.whoosh(1.2, 8000, 300, 0.9, 0.15), fr(TL['assemble'][0]), 0.6, send=0.3)
S.sfx(glitter(1.3, 260, 79, 108, 1.0), fr(TL['assemble'][0]), 0.5, 0.0, send=0.4)
S.place(S.crash(1.0), fr(TL['assemble'][0]), 0.7, send=0.4)
S.sfx(S.hit(0.8, 40), fr(TL['lock']), 0.5, send=0.3)
S.sfx(scan(fr(TL['scanTitle'][1] - TL['scanTitle'][0]), 6000, 900, 0.8), fr(TL['scanTitle'][0]), 0.35, send=0.3)

# —— 01：扎进去，点变成星；读数 ——
S.sfx(S.riser(fr(TL['push'][1] - TL['push'][0]) * 0.7, 0.7, 300, 8000), fr(TL['push'][0]), 0.35)
S.sfx(glitter(0.9, 60, 88, 108, 0.8), fr(196), 0.35, 0.2, send=0.5)
for k in range(5):
    S.sfx(S.click(1.0, lo=2000, hi=8000, d=0.004), fr(TL['probe'][0] + 2 + k * 3), 0.45, 0.3)
    S.sfx(ping(S.tone(TL['probe'][0], k + 3, 2), 0.6, 0.06), fr(TL['probe'][0] + 2 + k * 3), 0.25, 0.3)
# 字倒进井里：往下的风 + 一路往下的亮片
S.sfx(S.whoosh(1.1, 6000, 250, 0.9, 0.4), fr(TL['pour'][0]), 0.55, send=0.3)
S.sfx(glitter(1.1, 160, 72, 100, 0.8), fr(TL['pour'][0] + 4), 0.35, -0.2, send=0.4)

# —— 02 扫描：一道往下的扫描声 + 每拍一声刻度；镜头螺旋下潜 = 左右绕的风 ——
d = fr(TL['sweep'][1] - TL['sweep'][0])
S.sfx(scan(d, 5000, 500, 0.8, 0.12), fr(TL['sweep'][0]), 0.4, send=0.3)
for k, fm in enumerate(np.arange(TL['sweep'][0], TL['sweep'][1], 15)):
    S.sfx(S.click(0.8, lo=3000, hi=9000, d=0.003), fr(fm), 0.35, float(np.sin(k * 0.8)) * 0.6)
    if k % 2 == 0:
        S.sfx(ping(S.tone(fm, k // 2, 2), 0.5, 0.08), fr(fm), 0.18, float(np.sin(k * 0.8)) * 0.6, send=0.3)
for k in range(3):
    S.sfx(S.whoosh(0.9, 500, 3000, 0.7, 0.5), fr(TL['dive'][0] + 20 + k * 60), 0.3, (-1) ** k * 0.7, send=0.3)

# —— 03 龙卷：越转越紧 → 树聚成 ——
S.sfx(S.riser2(fr(634 - TL['twist'][0]), 0.9), fr(TL['twist'][0]), 0.45)
S.sfx(glitter(2.0, 200, 76, 104, 1.0), fr(TL['twist'][0] + 10), 0.4, 0.0, send=0.4)
for k, fm in enumerate(np.arange(600, 634, 3.75)):
    S.place(S.snare(1.0), fr(fm), 0.1 + 0.35 * (k / 9) ** 1.5, 0.1 * (-1) ** k, send=0.2)
S.place(S.kick(1.3), fr(634), 1.0); S.kicks.append(634)
S.place(S.crash(1.0), fr(634), 0.8, send=0.4)
S.sfx(S.hit(0.8, 40), fr(634), 0.5, send=0.3)

# —— 04 拨开：刷子声跟着光标从左走到右；每一下推开一个“啵”的弹回 ——
c0, c1 = TL['cursor']
brush = S.fft_filter(S.rng.standard_normal(int(fr(c1 - c0) * S.SR)), lo=1500, hi=7000) * 0.18
pan = np.linspace(-0.8, 0.8, len(brush))
S.sfx(brush * np.sin(np.pi * np.linspace(0, 1, len(brush))) ** 0.5, fr(c0), 0.4, 0.0, send=0.2)
for k, fm in enumerate(np.arange(c0 + 10, c1, 15)):
    S.sfx(S.glide(72 + (k % 3) * 3, 79 + (k % 3) * 3, 0.12, 0.6), fr(fm), 0.2, -0.7 + 1.4 * (fm - c0) / (c1 - c0), send=0.3)

# —— 05 手机：遮罩落下；扫描时覆盖度每涨一格一声；聚拢一把亮片；完成一个和弦 ——
S.sfx(S.whoosh(0.7, 5000, 400, 0.8, 0.7), fr(TL['mask'][0]), 0.45)
for k, fm in enumerate(np.arange(TL['pScan'][0], TL['pScan'][1], 5)):
    S.sfx(ping(S.tone(fm, k, 2), 0.7, 0.05), fr(fm), 0.22, -0.4 + 0.8 * k / 10, send=0.3)
S.sfx(S.click(1.2, lo=1500, hi=6000, d=0.006), fr(TL['pScan'][0] - 4), 0.6)
S.sfx(glitter(fr(TL['pDone'][0] - TL['pBuild'][0]), 220, 80, 106, 0.9), fr(TL['pBuild'][0]), 0.4, send=0.4)
for k, m in enumerate(S.chord(TL['pDone'][0])[2]):
    S.sfx(S.bell(m + 12, 0.8, 0.7), fr(TL['pDone'][0] + k * 3), 0.4, -0.3 + 0.3 * k, send=0.4)

# —— 06：树散开，再拼回标题 ——
S.sfx(S.whoosh(1.0, 300, 7000, 0.9, 0.5), fr(TL['regroup'][0]), 0.5, send=0.3)
S.sfx(glitter(1.2, 220, 79, 108, 1.0), fr(TL['regroup'][0] + 6), 0.45, send=0.4)
S.sfx(S.hit(0.8, 40), fr(TL['regroup'][1]), 0.5, send=0.3)
S.sfx(scan(0.5, 6000, 900, 0.7), fr(1046), 0.3, send=0.3)

S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
