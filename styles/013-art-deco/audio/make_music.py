"""
Design Style · 风格 013 · 装饰艺术 Art Deco —— 配乐与音效（纯代码合成，无外部音源）

120 BPM 摇摆（1 拍 = 0.5 秒 = 30 帧，反拍落在 2/3 拍；全片不变速）· 20 秒 = 10 小节 · F 大调
声部：低音提琴走路贝斯、钢琴查尔斯顿式反拍和弦、刷子军鼓、摇摆叮叮镲、钢片琴（金色的光）、竖琴（放射）、弱音小号齐奏（重音）。
镜像也写进声音里：画面上左右成对出现的东西，声音也一左一右成对出现（声像 ±）。
  0–1.5s     开场：光顺着画框往两边跑（钢片琴左右上行）· 星芒“叮” · 楼沉下去（下行）· 推进拱窗（上扬的风声）
  1.5–4.5s   01 三线：f120 乐队进来；每半拍擦过一道门——门两边一左一右两道风声，门上的光一声钢片琴，连成一句旋律 · f270 玫瑰窗“叮”
  4.5–8s     02 放射：万花筒每拍一次脉冲 · f420 射线射出（竖琴左右往外刷 + 镲）· 塌成太阳（下行 + 一记定音鼓）
  8–13s      03 阶梯：楼从外往里成对升起（钢琴往上走，声像往里收）· f540 主楼落地（小号 + 低音）· 镜头上升（渐强）+ 年份滴答
             · 拱冠五声 · 尖顶星芒（小号 + 镲）· 拉远
  13–16s     五条规则：牌子飞到面前（钢琴和弦 + 风声，声像从中间往两边）· 冲向镜头（上扬）
  16–20s     片尾：中轴落下“叮” · 描字（竖琴）· 楼重新长高（钢琴往上走）· 光跑一圈 · F 大九和弦的余音折回开头
所有时间点与 video/*.tsx 的关键帧对齐（帧 / 60 = 秒）。

用法：python3 styles/013-art-deco/audio/make_music.py
输出：public/013-art-deco/music.wav（响度 −14 LUFS，真峰值 < −1 dBTP）
"""
import json
import math
import os
import shutil
import subprocess
import wave

import numpy as np

SR = 48000
DUR = 20.0
NV = int(SR * DUR)
N = int(SR * (DUR + 2.5))  # 多算 2.5 秒余音，最后折回开头：循环播放时首尾无缝
rng = np.random.default_rng(13)

MUS = np.zeros((2, N))
SFX = np.zeros((2, N))
SEND = np.zeros((2, N))

AT = {'open': 0, 'tunnel': 90, 'kaleido': 270, 'city': 480, 'rules': 780, 'title': 960}


def fr(frame):
    return frame / 60.0


def place(sig, t, gain=1.0, pan=0.0, send=0.0, bus=None):
    bus = MUS if bus is None else bus
    i = int(round(t * SR))
    if i >= N or i < 0:
        return
    sig = sig[: N - i]
    gl = np.cos((pan + 1) * np.pi / 4) * gain
    gr = np.sin((pan + 1) * np.pi / 4) * gain
    bus[0, i : i + len(sig)] += sig * gl
    bus[1, i : i + len(sig)] += sig * gr
    if send:
        SEND[0, i : i + len(sig)] += sig * gl * send
        SEND[1, i : i + len(sig)] += sig * gr * send


def sfx(sig, t, gain=1.0, pan=0.0, send=0.25):
    place(sig, t, gain, pan, send, SFX)


def pair(sig, t, gain=1.0, width=0.6, send=0.25, bus=None):
    """镜像：同一个声音一左一右各放一份"""
    for p in (-width, width):
        place(sig, t, gain * 0.75, p, send, SFX if bus is None else bus)


def tt(d):
    return np.arange(int(d * SR)) / SR


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def fft_filter(x, lo=None, hi=None):
    """频域里一刀切的带通（整段信号，固定截止）"""
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4)
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** 4)
    return np.fft.irfft(X * g, n)


def sweep_lp(x, c0, c1):
    """随时间移动截止频率的一阶低通（短音效用）"""
    c = np.geomspace(c0, c1, len(x))
    a = np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def env(t, att, dec):
    return np.minimum(1, t / max(att, 1e-4)) * np.exp(-t / dec)


def release(sig, d, rel=0.05):
    n = len(sig)
    t = np.arange(n) / SR
    g = np.where(t < d, 1.0, np.exp(-(t - d) / rel))
    return sig * g


# ───────── 乐器 ─────────

def piano(m, d=1.2, level=1.0, bright=1.0):
    f0 = midi(m)
    t = tt(d + 0.6)
    y = np.zeros_like(t)
    for n in range(1, 12):
        fn = n * f0 * np.sqrt(1 + 0.0004 * n * n)
        if fn > 16000:
            break
        a = (1 / n ** 1.15) * (bright if n > 3 else 1)
        y += a * np.sin(2 * np.pi * fn * t + n) * np.exp(-t * (1.0 + 0.9 * n) * (1 + f0 / 2000))
    y *= np.minimum(1, t / 0.002)
    y[: int(0.004 * SR)] += rng.standard_normal(int(0.004 * SR)) * 0.05
    return release(y, d, 0.08) * level * 0.32


def chord(ms, d=0.2, level=1.0, bright=0.8):
    return sum(piano(m, d, 1.0, bright) for m in ms) * level / np.sqrt(len(ms))


def upright(m, d=0.45, level=1.0):
    f0 = midi(m)
    t = tt(d + 0.25)
    y = np.sin(2 * np.pi * f0 * t) + 0.45 * np.sin(4 * np.pi * f0 * t + 0.3) * np.exp(-t / 0.12) + 0.2 * np.sin(6 * np.pi * f0 * t) * np.exp(-t / 0.06)
    y *= env(t, 0.006, 0.42)
    thump = rng.standard_normal(int(0.012 * SR)) * np.exp(-np.arange(int(0.012 * SR)) / (0.003 * SR)) * 0.25
    y[: len(thump)] += fft_filter(thump, hi=900)
    return release(y, d, 0.06) * level * 0.5


def bell(m, level=1.0, dec=1.2):
    f0 = midi(m)
    t = tt(dec * 3)
    y = np.zeros_like(t)
    for r, a, k in ((1, 1, 1), (2.0, 0.35, 0.7), (2.76, 0.4, 0.5), (5.4, 0.18, 0.3), (8.93, 0.08, 0.2)):
        y += a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / (dec * k))
    return y * np.minimum(1, t / 0.001) * level * 0.22


def celesta(m, level=1.0, dec=0.7):
    f0 = midi(m)
    t = tt(dec * 2.5)
    y = np.sin(2 * np.pi * f0 * t) * np.exp(-t / dec) + 0.3 * np.sin(2 * np.pi * 4 * f0 * t) * np.exp(-t / (dec * 0.25))
    return y * np.minimum(1, t / 0.001) * level * 0.2


def harp(m, level=1.0):
    f0 = midi(m)
    t = tt(1.4)
    y = np.zeros_like(t)
    for n in range(1, 7):
        y += (1 / n ** 1.4) * np.sin(2 * np.pi * n * f0 * t) * np.exp(-t * (1.6 + 1.2 * n))
    return y * np.minimum(1, t / 0.0015) * level * 0.22


def brass(ms, d=0.35, level=1.0, wah=1.0):
    """弱音小号齐奏：锯齿波的加法合成，截止频率随包络先开后收"""
    t = tt(d + 0.2)
    fc = 600 + 2600 * wah * np.exp(-t / 0.12) * np.minimum(1, t / 0.03)
    y = np.zeros_like(t)
    for m in ms:
        f0 = midi(m)
        ph = 2 * np.pi * f0 * t + 0.002 * np.sin(2 * np.pi * 5.5 * t) * f0
        for n in range(1, 16):
            if n * f0 > 9000:
                break
            y += (1 / n) * np.sin(n * ph) / (1 + (n * f0 / fc) ** 2)
    y *= np.minimum(1, t / 0.012)
    return release(y, d, 0.07) * level * 0.16 / np.sqrt(len(ms))


def pad(ms, d, level=1.0, att=0.4, rel=0.8):
    t = tt(d + rel * 3)
    y = np.zeros_like(t)
    for m in ms:
        for det in (-0.06, 0.0, 0.07):
            f0 = midi(m + det)
            for n in range(1, 6):
                y += (1 / n ** 1.6) * np.sin(2 * np.pi * n * f0 * t + rng.random() * 6)
    e = np.minimum(1, t / att) * np.where(t < d, 1.0, np.exp(-(t - d) / rel))
    return y * e * level * 0.035 / np.sqrt(len(ms))


def ride(level=1.0):
    t = tt(0.9)
    y = np.zeros_like(t)
    for r in (1, 1.483, 1.932, 2.546, 3.104, 3.712):
        y += np.sign(np.sin(2 * np.pi * 3150 * r * t + r))
    y = fft_filter(y * 0.08 + rng.standard_normal(len(t)) * 0.5, lo=6000) * np.exp(-t / 0.32)
    y[: int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))
    return y * level * 0.09


def brush(level=1.0, d=0.22):
    """刷子：先一段“刷”（渐强），再一记轻拍"""
    t = tt(d + 0.12)
    sw = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    tap = np.exp(-np.maximum(0, t - d) / 0.05) * (t >= d)
    y = fft_filter(rng.standard_normal(len(t)), lo=1800, hi=9000) * (0.35 * sw + 1.0 * tap)
    return y * level * 0.12


def feather(level=1.0):
    t = tt(0.25)
    f = 62 * np.exp(-t / 0.08) + 46
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.11) * level * 0.35


def whoosh(d=0.6, c0=300, c1=5000, level=1.0, peak=0.6):
    t = tt(d)
    e = np.sin(np.pi * np.clip(t / d, 0, 1) ** (np.log(0.5) / np.log(peak))) ** 2
    return sweep_lp(rng.standard_normal(len(t)), c0, c1) * e * level * 0.4


def thud(level=1.0, f0=90, f1=42):
    t = tt(0.5)
    f = f1 + (f0 - f1) * np.exp(-t / 0.04)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    y[: int(0.01 * SR)] += fft_filter(rng.standard_normal(int(0.01 * SR)), hi=1500) * 0.4
    return y * level * 0.7


def tick(level=1.0, hi=True):
    t = tt(0.04)
    y = fft_filter(rng.standard_normal(len(t)), lo=2500 if hi else 800, hi=9000) * np.exp(-t / 0.006)
    return y * level * 0.3


def reverse_cym(d=0.8, level=1.0):
    t = tt(d)
    y = fft_filter(rng.standard_normal(len(t)), lo=4000) * (t / d) ** 3
    return y * level * 0.12


# ───────── 和声与节奏（全片 120 BPM 不变速）─────────
VOICE = {
    'F': (41, [57, 64, 67, 72]),  # Fmaj9
    'Dm': (38, [53, 57, 60, 64]),  # Dm9
    'Gm': (43, [58, 62, 65, 69]),  # Gm9
    'C': (36, [58, 64, 69, 74]),  # C13
    'Bb': (34, [62, 65, 69, 72]),  # B♭maj9
    'A': (33, [55, 61, 65, 70]),  # A7♭9♭13
}
TONES = {'F': [0, 4, 7, 9], 'Dm': [0, 3, 7, 10], 'Gm': [0, 3, 7, 10], 'C': [0, 4, 7, 10], 'Bb': [0, 4, 7, 9], 'A': [0, 4, 7, 10]}
# (起始帧, 和弦)
PROG = [
    (120, 'Dm'), (180, 'Gm'), (240, 'C'),
    (270, 'F'), (330, 'Dm'), (390, 'Bb'), (420, 'A'), (450, 'Dm'),
    (480, 'Gm'), (540, 'C'), (600, 'F'), (660, 'Bb'), (690, 'A'), (720, 'Dm'), (750, 'Gm'),
    (780, 'C'), (840, 'F'), (900, 'Dm'), (930, 'Gm'),
    (960, 'C'), (1020, 'Bb'), (1080, 'Gm'), (1110, 'C'), (1140, 'F'),
]
BAND_END = 1140


def chord_at(fm):
    c = PROG[0][1]
    for a, name in PROG:
        if fm >= a:
            c = name
    return c


# 走路贝斯：每拍一个音；换和弦前一拍用半音靠近下一个根音
for b in range(4, BAND_END // 30):
    fm = b * 30
    c = chord_at(fm)
    root = VOICE[c][0]
    nxt = chord_at(fm + 30)
    if nxt != c:
        m = VOICE[nxt][0] + (1 if (b % 2) else -1)
    else:
        start = max(a for a, n in PROG if a <= fm)
        k = (fm - start) // 30
        m = root + [0, TONES[c][1], TONES[c][2], 12, TONES[c][2], TONES[c][1]][k % 6]
    place(upright(m, 0.42, 1.0), fr(fm), pan=-0.05, send=0.08)

# 鼓：摇摆叮叮镲（1、2、2 的反拍）、刷子在 2 和 4、底鼓每拍轻轻点
for b in range(4, BAND_END // 30):
    fm = b * 30
    place(ride(1.0 if b % 2 == 0 else 0.8), fr(fm), pan=0.35, send=0.12)
    if b % 2 == 1:
        place(ride(0.55), fr(fm + 20), pan=0.35, send=0.12)
        place(brush(1.0), fr(fm) - 0.2, pan=-0.2, send=0.15)
    place(feather(0.5), fr(fm))

# 钢琴：每两拍一组，正拍短促一记、第二拍的反拍再一记（查尔斯顿）
for b in range(4, BAND_END // 30, 2):
    fm = b * 30
    c = chord_at(fm)
    place(chord(VOICE[c][1], 0.16, 0.9), fr(fm), pan=-0.25, send=0.2)
    place(chord(VOICE[c][1], 0.12, 0.7), fr(fm + 50), pan=-0.25, send=0.2)

# 长音垫底：开场与片尾（片尾的余音折回开头，接上第一帧）
place(pad(VOICE['F'][1], 2.0, 0.9, att=0.6, rel=0.9), fr(0), send=0.3)
place(pad([m - 12 for m in VOICE['F'][1]] + [41], 1.2, 1.0, att=0.02, rel=1.4), fr(1140), send=0.4)
place(chord([41, 53] + VOICE['F'][1] + [76], 1.6, 1.1, 0.9), fr(1140), send=0.45)
place(upright(29, 1.4, 1.0), fr(1140), send=0.1)

# ───────── 音效（跟画面） ─────────
PENTA = [77, 79, 81, 84, 86, 89, 91, 93, 96]


def gliss(t, notes, gap=0.045, level=0.35, pan0=-0.5, pan1=0.5, mirror_=False):
    for i, m in enumerate(notes):
        p = pan0 + (pan1 - pan0) * i / max(1, len(notes) - 1)
        if mirror_:
            pair(celesta(m, level, 0.5), t + i * gap, width=abs(p) + 0.1, send=0.5, bus=MUS)
        else:
            place(celesta(m, level, 0.5), t + i * gap, pan=p, send=0.5)


# 开场：光顺着画框从中轴往两边跑（左右同时上行）· 尖顶星芒 · 楼沉下去 · 推进拱窗
gliss(fr(2), PENTA[1:8], 0.07, 0.3, 0.1, 0.9, mirror_=True)
sfx(bell(96, 0.5, 1.0), fr(4), send=0.6)
for i, m in enumerate([65, 62, 58, 55, 53]):
    place(piano(m, 0.3, 0.5), fr(28) + i * 0.08, pan=0.1, send=0.3)
sfx(whoosh(0.5, 2500, 200, 0.4, 0.3), fr(28), send=0.2)
sfx(whoosh(0.85, 200, 9000, 0.8, 0.85), fr(52), send=0.35)
place(reverse_cym(0.9, 1.0), fr(120) - 0.9, send=0.2)
sfx(thud(0.7, 85, 42), fr(120), send=0.25)

# 01 三线：每半拍擦过一道门。门两边一左一右两道风声；门上的光一声钢片琴，连成一句上行旋律
TUNE = [81, 84, 86, 89, 86, 89, 91, 93, 91, 96, 98]
for i in range(11):
    passf = 120 + 15 * i
    for p in (-0.85, 0.85):
        sfx(whoosh(0.28, 600, 6000, 0.32, 0.75), fr(passf) - 0.2, pan=p, send=0.15)
    place(celesta(TUNE[i], 0.42, 0.45), fr(passf - 40 + 6), pan=(-1) ** i * 0.25, send=0.5)
sfx(bell(89, 0.9, 1.6), fr(262), send=0.6)
sfx(bell(96, 0.5, 1.2), fr(263), send=0.6)
place(reverse_cym(0.5, 0.8), fr(270) - 0.5, send=0.2)

# 02 放射：万花筒每拍一次脉冲（钢片琴轻点）· 射线射出（竖琴左右往外刷 + 镲）· 塌成太阳
K = AT['kaleido']
for b in range(5):
    fm = K + 30 * b
    place(celesta(PENTA[(b * 2) % 8] + 12, 0.22, 0.3), fr(fm), pan=0.0, send=0.5)
HARP = [65, 69, 72, 74, 77, 81, 84, 86, 89, 93, 96]
for i, m in enumerate(HARP):
    pair(harp(m, 0.5), fr(K + 150) + i * 0.035, width=0.15 + 0.08 * i, send=0.4, bus=MUS)
place(ride(2.2), fr(K + 150), send=0.4)
sfx(bell(98, 0.5, 1.2), fr(K + 150), send=0.6)
for i, m in enumerate([93, 89, 86, 81, 77, 74]):
    place(celesta(m, 0.35, 0.5), fr(K + 180) + i * 0.07, send=0.5)
sfx(whoosh(0.5, 3000, 300, 0.4, 0.4), fr(K + 180), send=0.2)
sfx(thud(0.8, 70, 38), fr(K + 204), send=0.35)

# 03 阶梯：楼从外往里成对升起（钢琴往上走，声像往里收）· 主楼落地
C0 = AT['city']
for k, (dt, m) in enumerate([(2, 53), (8, 57), (14, 60), (22, 62), (30, 65), (40, 69), (50, 72)]):
    w = 0.9 - k * 0.12
    pair(piano(m, 0.35, 0.7), fr(C0 + dt), width=w, send=0.25, bus=MUS)
place(pad([58, 64, 69, 74], 1.6, 0.8, att=0.6, rel=0.8), fr(C0 + 40), send=0.4)
sfx(thud(1.0, 80, 38), fr(C0 + 62), send=0.3)
place(brass([58, 64, 69, 74], 0.45, 1.2), fr(C0 + 60), send=0.35)
place(upright(24, 0.8, 1.0), fr(C0 + 60), send=0.1)
# 镜头上升：一路渐强的长音 + 年份每变一次轻轻一声
place(pad([53, 60, 65, 69, 72], 1.7, 1.0, att=1.4, rel=0.4), fr(C0 + 110), send=0.35)
sfx(whoosh(1.6, 300, 8000, 0.5, 0.85), fr(C0 + 112), send=0.25)
for y in range(15):
    p = y / 14
    # 年份按 inOut 缓动推进：反解出每一年出现的帧
    t = math.acos(1 - 2 * p) / math.pi if p < 1 else 1.0
    sfx(tick(0.45), fr(C0 + 120 + 80 * t), pan=0.0, send=0.1)
# 拱冠五层亮起 · 尖顶 · 星芒
CR = C0 + 206
for i, m in enumerate([84, 86, 89, 91, 93]):
    place(celesta(m, 0.5, 0.5), fr(CR + i * 3), pan=(-1) ** i * 0.2, send=0.55)
sfx(whoosh(0.3, 1500, 9000, 0.4, 0.8), fr(CR + 12), send=0.3)
place(brass([57, 61, 65, 70, 76], 0.6, 1.4), fr(CR + 26), send=0.4)
place(ride(2.5), fr(CR + 26), send=0.45)
sfx(bell(96, 0.7, 1.4), fr(CR + 26), send=0.6)
sfx(whoosh(0.8, 4000, 300, 0.45, 0.3), fr(C0 + 238), send=0.3)

# 五条规则：牌子飞到面前（钢琴和弦 + 风声，声像从中间往两边）· 一起冲向镜头
R0 = AT['rules']
for k, (dt, w, m) in enumerate([(8, 0.0, 84), (23, 0.45, 88), (38, 0.85, 91)]):
    if w == 0:
        sfx(whoosh(0.4, 400, 5000, 0.35, 0.8), fr(R0 + dt) - 0.25, send=0.2)
        place(chord([72, 76, 79, 84], 0.5, 0.8), fr(R0 + dt + 6), send=0.35)
        place(celesta(m + 12, 0.4, 0.5), fr(R0 + dt + 6), send=0.5)
    else:
        for p in (-w, w):
            sfx(whoosh(0.4, 400, 5000, 0.28, 0.8), fr(R0 + dt) - 0.25, pan=p, send=0.2)
        pair(celesta(m + 12, 0.4, 0.5), fr(R0 + dt + 6), width=w, send=0.5, bus=MUS)
        pair(piano(m - 12, 0.5, 0.7), fr(R0 + dt + 6), width=w, send=0.35, bus=MUS)
sfx(whoosh(0.5, 300, 9000, 0.6, 0.9), fr(AT['title'] - 28), send=0.3)

# 片尾：中轴落下 · 描字 · 楼重新长高 · 光跑一圈 · 星芒 · 回到第一帧
T0 = AT['title']
sfx(bell(84, 0.8, 1.4), fr(T0), send=0.6)
for i, m in enumerate(HARP[:9]):
    pair(harp(m, 0.4), fr(T0 + 6) + i * 0.06, width=0.2 + 0.08 * i, send=0.4, bus=MUS)
for dt, ms in [(50, [53]), (53, [57]), (56, [60]), (58, [53, 60]), (63, [57, 64]), (68, [60, 67, 72]), (76, [64, 69]), (81, [67, 72])]:
    place(chord(ms, 0.4, 0.8, 1.0), fr(T0 + dt), send=0.25)
for i, m in enumerate([81, 84, 86, 88, 91]):
    place(celesta(m, 0.45, 0.5), fr(T0 + 86 + i * 4), pan=(-1) ** i * 0.15, send=0.45)
gliss(fr(T0 + 128), PENTA[1:8], 0.06, 0.28, 0.1, 0.9, mirror_=True)
sfx(bell(96, 0.6, 1.2), fr(T0 + 158), send=0.6)

# ================= 混响 + 母带 =================
def reverb(x, seed, dec=0.6, length=2.4):
    t = tt(length)
    ir = np.random.default_rng(seed).standard_normal(len(t)) * np.exp(-t / dec)
    ir = fft_filter(ir, hi=6000)
    ir[: int(0.02 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + len(ir)
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


mix = MUS + SFX * 0.8  # 音效让出背景音乐
mix[0] += reverb(SEND[0], 1) * 0.5
mix[1] += reverb(SEND[1], 2) * 0.5
for ch in range(2):
    mix[ch] = fft_filter(mix[ch], lo=35)
# 循环：成片之后的余音（F 大九和弦、混响尾巴）折回开头，和第一帧的海报接上
mix[:, : N - NV] += mix[:, NV:]
mix = mix[:, :NV]
mix = mix.T
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.2) / np.tanh(1.2)

root = os.path.dirname(os.path.abspath(__file__))
out_dir = os.path.normpath(os.path.join(root, '..', '..', '..', 'public', '013-art-deco'))
os.makedirs(out_dir, exist_ok=True)
final = os.path.join(out_dir, 'music.wav')


def write(path, y):
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes())


def loudness(y):
    tmp = final + '.measure.wav'
    write(tmp, y)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    os.remove(tmp)
    js = r.stderr[r.stderr.rindex('{'): r.stderr.rindex('}') + 1]
    return float(json.loads(js)['input_i'])


def limit(y, ceil=0.84, win=0.008):
    w = int(win * SR)
    need = np.minimum(1.0, ceil / (np.abs(y).max(axis=1) + 1e-12))
    nb = -(-len(need) // w)
    pad_ = np.ones(nb * w)
    pad_[: len(need)] = need
    blk = pad_.reshape(nb, w).min(axis=1)
    blk = np.minimum(blk, np.minimum(np.r_[1.0, blk[:-1]], np.r_[blk[1:], 1.0]))
    g = np.repeat(blk, w)[: len(need)]
    c = np.cumsum(np.r_[0.0, g])
    h = w // 2
    lo = np.clip(np.arange(len(g)) - h, 0, len(g))
    hi = np.clip(np.arange(len(g)) + h, 0, len(g))
    g = (c[hi] - c[lo]) / np.maximum(hi - lo, 1)
    return y * g[:, None]


if shutil.which('ffmpeg'):
    y = mix * 0.5
    for _ in range(3):
        i = loudness(y)
        y = limit(y * 10 ** ((-14.0 - i) / 20))
    print('loudness %.2f LUFS' % loudness(y))
    write(final, y)
else:
    write(final, mix * 0.89)
print('wrote', final)
