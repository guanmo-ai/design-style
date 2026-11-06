"""液态金属全片的配乐（一整首歌，18 秒）。120 BPM（一拍 = 30 帧）· D 小调 · 冷光泽的电子：次低音、玻璃质感的钟琴、方波琶音。
从第一拍到最后一拍同一支乐队：开头只有一滴水的“叮”和落地的重击，字站稳（第 90 帧）鼓才进来。
每个液体动作一个声音：落地 = 低频轰 + 溅水；融合 = 往下滑的“咕噜”；断开 = 一串调好音的“叮”；刺 = 颗粒噼啪。
时间全部取自 timeline.js。python3 audio.py out.wav"""
import json
import re
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from song import Song  # noqa: E402

TL = json.loads(re.sub(r'//[^\n]*', '', re.search(r'const TL = (\{.*?\});', (HERE / 'timeline.js').read_text(), re.S).group(1)))
DM, BB, F, C, GM, A7 = [62, 65, 69], [62, 65, 70], [60, 65, 69], [60, 64, 67], [62, 67, 70], [61, 64, 67, 69]
CH = [(0, 38, DM), (90, 34, BB), (120, 41, F), (150, 38, DM), (210, 34, BB), (240, 41, F), (270, 36, C),
      (300, 38, DM), (330, 38, DM), (390, 34, BB), (420, 41, F), (450, 36, C),
      (480, 43, GM), (510, 34, BB), (540, 33, A7), (570, 38, DM),          # 03：A7 把柱子绷紧，570 断开 = 回到主和弦
      (630, 38, DM), (690, 34, BB), (750, 41, F), (810, 36, C), (870, 38, DM),
      (900, 34, BB), (960, 36, C), (1020, 38, DM)]
END = TL['end']
S = Song(END, CH, seed=41)
fr = S.fr
rng = np.random.default_rng(5)
FIN = TL['final']


def plink(m, level=1.0, dec=0.22):
    """一滴水银的“叮”：高音正弦 + 一点往下滑的音高"""
    t = S.tt(dec * 3)
    f0 = S.midi(m)
    f = f0 * (1 + 0.35 * np.exp(-t / 0.012))
    y = np.sin(2 * np.pi * np.cumsum(f) / S.SR) + 0.25 * np.sin(2 * np.pi * np.cumsum(f * 2.01) / S.SR) * np.exp(-t / 0.03)
    return y * np.minimum(1, t / 0.0008) * np.exp(-t / dec) * level * 0.45


def gloop(m0, m1, d=0.18, level=1.0):
    """融合的“咕噜”：低音正弦滑下去 + 一点共振"""
    t = S.tt(d + 0.15)
    f = S.midi(m0) * (S.midi(m1) / S.midi(m0)) ** np.minimum(1, t / d)
    y = np.sin(2 * np.pi * np.cumsum(f) / S.SR) * (1 + 0.4 * np.sin(2 * np.pi * 28 * t))
    return np.tanh(y * 1.4) * np.sin(np.pi * np.minimum(1, t / (d + 0.15))) ** 0.6 * level * 0.5


def splash(level=1.0, d=0.5):
    """溅水：带通噪声，亮起来再暗下去"""
    t = S.tt(d)
    n = S.fft_filter(S.rng.standard_normal(len(t)), lo=900, hi=9000)
    return n * np.exp(-t / 0.09) * (1 - np.exp(-t / 0.004)) * level * 0.35


def crackle(d, density, level=1.0):
    """磁流体的颗粒声：一串随机的小咔哒"""
    n = int(d * S.SR)
    y = np.zeros(n)
    for k in range(int(d * density)):
        i = int(rng.uniform(0, n - 200))
        c = S.click(1.0, lo=2500, hi=11000, d=0.002)
        y[i:i + len(c)] += c[:n - i] * rng.uniform(0.3, 1.0)
    return y * level


def fm_bell(m, level=1.0, dec=1.2):
    """玻璃钟：FM，泛音是 3.5 倍"""
    t = S.tt(dec * 2.5)
    f = S.midi(m)
    y = np.sin(2 * np.pi * f * t + 2.2 * np.exp(-t / 0.25) * np.sin(2 * np.pi * f * 3.5 * t))
    return y * np.exp(-t / dec) * np.minimum(1, t / 0.002) * level * 0.4


def lead(m, d):
    y = fm_bell(m, 1.0, max(0.35, d * 1.6)) * 1.6
    c = S.celesta(m + 12, max(d, 0.3), 0.5) * 1.2
    n = max(len(y), len(c))
    return np.pad(y, (0, n - len(y))) + np.pad(c, (0, n - len(c)))


def pluck(m):
    return S.synth(m, 0.1, 'square', 4200, 700, 0.04, dec=0.08, rel=0.03)


# —— 乐队：字站稳（90）以后鼓才进来；柱子绷紧（540—570）、最后一滴落下前（944—962）留空 ——
BRK = [(540, 570), (930, 966)]
S.drums(90, FIN, skip=BRK)
for fm in np.arange(90, FIN, 7.5):
    if not any(a <= fm < z for a, z in BRK):
        S.place(S.shaker(1.0), fr(fm), 1.2 if fm % 15 else 0.7, -0.35)
S.bassline(30, FIN, skip=BRK)
S.pad(1.0, fc=1300)
S.arp(150, FIN, 1.0, skip=BRK, inst=pluck, pattern=(0, 2, 1, 3, 2, 4, 3, 1))
S.place(S.kick(1.3), fr(FIN), 1.0); S.kicks.append(FIN)
S.place(S.sbass(38, 1.6), fr(FIN), 0.5, bus=S.PUMP); S.place(S.sbass(50, 1.6), fr(FIN), 0.3, bus=S.PUMP)
S.place(S.crash(1.2), fr(FIN), 0.9, send=0.5)
for k, m in enumerate([74, 77, 81, 86, 89]):
    S.place(fm_bell(m, 1.0, 1.4), fr(FIN + k * 3), 0.5, -0.4 + 0.2 * k, send=0.45)

HOOK = {
    90: [(0, 74, 1), (1, 77, 1), (2, 81, 2), (4, 79, 1), (5, 77, 1)],
    150: [(0, 74, 2), (2, 77, 1), (3, 81, 1)], 210: [(0, 82, 1), (1, 81, 1), (2, 77, 2)], 270: [(0, 79, 1), (1, 84, 1), (2, 88, 2)],
    330: [(0, 86, 2), (2, 81, 2)], 390: [(0, 82, 1), (1, 86, 1), (2, 89, 2)], 420: [(0, 84, 2), (2, 81, 2)], 450: [(0, 79, 1), (1, 84, 1), (2, 88, 2)],
    480: [(0, 79, 2), (2, 82, 2)], 510: [(0, 82, 1), (1, 86, 1), (2, 89, 2)],
    570: [(0, 86, 1), (1, 81, 1), (2, 77, 1), (3, 74, 1)],
    630: [(0, 74, 1), (1, 77, 1), (2, 81, 2)], 690: [(0, 82, 2), (2, 77, 2)], 750: [(0, 81, 1), (1, 84, 1), (2, 89, 2)], 810: [(0, 88, 2), (2, 84, 2)], 870: [(0, 86, 1), (1, 81, 1), (2, 77, 2)],
    900: [(0, 82, 2), (2, 86, 2)], 966: [(0, 84, 1), (1, 88, 1), (2, 91, 2)], 1020: [(0, 86, 4)], 1050: [(0, 86, 8)],
}
for s, notes in HOOK.items():
    S.hook(s, notes, 0.9, inst=lead)
for t, up in ((150, True), (330, False), (480, True), (630, False), (900, True)):
    S.transition(t, up, 0.8)

# —— 00：一滴落下 → 重击 → 字从水银里站起来 ——
S.sfx(S.glide(93, 81, fr(TL['dropHit']), 0.5), 0, 0.25, 0.1, send=0.4)
S.sfx(S.whoosh(0.4, 600, 5000, 0.7, 0.85), fr(TL['dropHit'] - 22), 0.3)
for at in (TL['dropHit'], TL['drop2'][1]):
    S.place(S.kick(1.4), fr(at), 1.0); S.kicks.append(at)
    S.sfx(S.boom(1.0, 110, 34, 1.1), fr(at), 0.9)
    S.sfx(splash(1.0), fr(at), 0.8, 0.0, send=0.3)
    S.sfx(S.shimmer(0.9, 0.8), fr(at), 0.35, 0.2, send=0.5)
    S.place(S.crash(1.0), fr(at), 0.7, send=0.4)
    for k in range(6):  # 溅起来的小珠落回去
        S.sfx(plink(S.tone(at, k + 3, 2), 0.8), fr(at + 18 + k * 4 + rng.uniform(0, 3)), 0.25, float(rng.uniform(-0.7, 0.7)), send=0.4)
S.sfx(S.riser(1.0, 0.8, 300, 6000), fr(TL['rise'][0]), 0.4)
S.sfx(S.glide(38, 50, 1.0, 0.8), fr(TL['rise'][0]), 0.35)
S.sfx(S.riser(0.6, 0.8, 300, 6000), fr(TL['rise2'][0]), 0.4)
S.sfx(S.glide(38, 50, 0.6, 0.8), fr(TL['rise2'][0]), 0.35)
S.sfx(S.hit(0.7, 38), fr(TL['rise'][1]), 0.45, send=0.3)
# 拉丝一根根断开、挂着的珠一颗颗掉下去
for k, fm in enumerate([52, 58, 63, 67, 71, 76, 82, 108, 117, 124, 131, 139]):
    S.sfx(plink(S.tone(fm, k + 2, 2), 0.9), fr(fm), 0.22, float(np.sin(k * 1.7)) * 0.7, send=0.35)

# —— 01 融合 ——
S.sfx(S.shimmer(0.8, 0.7), fr(TL['morph'][0]), 0.3, send=0.5)
for k in range(4):
    S.sfx(gloop(55 - k * 2, 43 - k * 2, 0.16, 0.8), fr(TL['morph'][0] + 6 + k * 8), 0.35, -0.6 + 0.4 * k)
for at, big in ((TL['snap1'], 0.7), (TL['snap2'], 1.0)):
    S.sfx(S.glide(60, 72, 0.3, 0.6), fr(at - 18), 0.25)          # 被吸过去
    S.sfx(gloop(50, 31, 0.22, 1.0), fr(at), 0.7 * big)            # “啪”地合上
    S.sfx(S.thock(38, 1.0), fr(at), 0.5 * big, send=0.2)
    S.place(S.crash(0.7 * big), fr(at), 0.5, send=0.3)

# —— 02 倒影：环境图转一圈 = 一阵扫过去的风；换两次“世界” = 两个钟和弦 ——
S.sfx(S.whoosh(1.5, 300, 6000, 0.7, 0.5), fr(TL['env'][0] + 4), 0.45, send=0.3)
for at in TL['hues']:
    for k, m in enumerate(S.chord(at)[2]):
        S.sfx(fm_bell(m + 12, 1.0, 1.0), fr(at + k * 2), 0.35, -0.3 + 0.3 * k, send=0.5)
    S.sfx(S.shimmer(0.6, 0.6), fr(at), 0.3, send=0.5)

# —— 03 拉成柱 → 断开 ——
S.sfx(S.glide(43, 67, fr(TL['stretch'][1] - TL['stretch'][0]), 0.7), fr(TL['stretch'][0]), 0.4)
S.sfx(S.riser2(0.55, 0.9), fr(TL['pinch'][0]), 0.5)
for k, fm in enumerate(np.arange(TL['pinch'][0], TL['brk'], 3.75)):
    S.place(S.snare(1.0), fr(fm), 0.1 + 0.35 * (k / 8) ** 1.5, 0.1 * (-1) ** k, send=0.2)
S.place(S.kick(1.3), fr(TL['brk']), 1.0); S.kicks.append(TL['brk'])
S.place(S.crash(1.0), fr(TL['brk']), 0.8, send=0.4)
for k, m in enumerate([86, 81, 77, 74, 69]):                     # 五颗珠：五个往下走的音
    S.sfx(plink(m, 1.0, 0.3), fr(TL['brk'] + k * 2.5), 0.45, -0.6 + 0.3 * k, send=0.4)
for k, at in enumerate([616, 636, 652, 668]):                     # 收成一颗：四个往上的“咕噜”
    S.sfx(gloop(43 + k * 3, 36 + k * 3, 0.14, 0.8), fr(at), 0.4, -0.4 + 0.25 * k)
S.sfx(S.whoosh(0.7, 5000, 400, 0.8, 0.7), fr(TL['mask'][0]), 0.45)

# —— 04 界面 ——
S.sfx(S.swell([62, 69, 74], 1.0, 0.6), fr(TL['idle'][0]), 0.25, send=0.5)     # 呼吸
S.sfx(S.click(1.2, lo=1500, hi=6000, d=0.006), fr(TL['tapMic']), 0.7)
SYL = [TL['words'][0] + k * 4.2 + (3 if k > 6 else 0) for k in range(13)]
for k, at in enumerate(SYL):                                         # “说话”：带共振峰的短噪声
    n = S.fft_filter(S.rng.standard_normal(int(0.07 * S.SR)), lo=500 + 300 * (k % 3), hi=2600 + 400 * (k % 2))
    S.sfx(n * np.hanning(len(n)) * 0.3, fr(at), 0.5, 0.0, send=0.2)
S.sfx(crackle(fr(TL['answer'][0] - TL['listen'][0]), 70, 0.5), fr(TL['listen'][0]), 0.35, 0.2, send=0.2)   # 刺的颗粒声
S.sfx(S.glide(50, 62, 0.15, 0.6), fr(TL['listen'][0]), 0.35)
S.sfx(S.glide(62, 50, 0.2, 0.6), fr(TL['answer'][0]), 0.35)
for k, (e, l) in enumerate(zip(TL['emit'], TL['land'])):
    S.sfx(plink(S.tone(e, k + 4, 2), 0.9), fr(e), 0.35, -0.3 + 0.2 * k, send=0.3)
    S.sfx(S.thock(60 + [0, 4, 7][k], 0.8), fr(l), 0.45)
S.sfx(S.click(1.2, lo=1500, hi=6000, d=0.006), fr(TL['tapChip']), 0.7)
S.sfx(S.glide(67, 79, 0.25, 0.7), fr(TL['back'][0]), 0.35)
S.sfx(gloop(55, 43, 0.14, 0.8), fr(TL['back'][1]), 0.4)
for k, m in enumerate([81, 86]):
    S.sfx(fm_bell(m, 1.0, 0.8), fr(TL['toast'] + k * 4), 0.4, send=0.4)

# —— 05 落回去 ——
S.sfx(S.whoosh(0.7, 400, 5000, 0.8, 0.4), fr(TL['out'][0]), 0.45)
S.sfx(S.glide(74, 55, 0.6, 0.7), fr(TL['out'][0] + 6), 0.3)
S.sfx(S.boom(0.8, 90, 32, 0.9), fr(945), 0.6)
S.sfx(splash(0.8), fr(945), 0.6, send=0.3)
S.sfx(S.glide(93, 81, fr(TL['drop2'][1] - TL['drop2'][0]), 0.5), fr(TL['drop2'][0]), 0.25, -0.1, send=0.4)

S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
