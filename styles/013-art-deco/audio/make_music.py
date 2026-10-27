"""
Design Style · 风格 013 · 装饰艺术 Art Deco —— 配乐与音效（纯代码合成，无外部音源）

120 BPM 摇摆（1 拍 = 0.5 秒 = 30 帧，反拍落在 2/3 拍；全片不变速）· 20 秒 = 10 小节 · F 大调
声部：低音提琴走路贝斯、钢琴查尔斯顿式反拍和弦、刷子军鼓、摇摆叮叮镲、钢片琴（金色高光）、竖琴（放射线）、弱音小号齐奏（换城）。
镜像也写进声音里：画面上左右同时长出来的东西，声音也是一左一右成对出现（声像 ±）。
和弦：Fmaj9（开场 / 01）| Dm9 | Gm9 C13 Fmaj9（02 楼长高）| B♭maj9 A7♭13（03 放射）| Dm9 Gm9 C13（04 三座城）
     | Fmaj9 Dm9 Gm9 C13（05 应用）| B♭maj9 A7♭13（五条规则）| Gm9 C13 → Fmaj9（片尾：门合上，“叮”）
  0–2s       开场：f6 中缝一亮（钢片琴）· f14 门向两边滑开（一左一右两道风声）· f66 一粒光顺着中轴落下（钢片琴下行）
  2–5s       01 中轴：f120 光落地“叮”，乐队进来 · 三线向两边拉开（左右两道风声）· 落定、四个角花
  5–8s       02 阶梯：台基三级、翼楼、主楼、收分——每长一级，钢琴往上走一级；五层拱冠一串钢片琴；尖顶“叮”
  8–10s      03 放射：镜头拉远（反向镲）· 射线像折扇打开（竖琴左右同时往外刷）· 拱窗合拢“叮”
  10–13s     04 来历：每换一座城，旧楼顶缩回、新楼顶升起，弱音小号齐奏一记
  13–16s     05 应用：楼缩进手机 · 界面元素成对打开（左右轻响）· 光标按网页按钮 · 手机选日期、按“预订”（门铃）
  16–18s     五条规则：中间一块、两边一对、再两边一对，每一块一声钢琴 + 钢片琴
  18–20s     片尾：门从两边合上，“咚”一声 + 电梯“叮”，F 大九和弦的余音折回开头
所有时间点与 video/*.tsx 的关键帧对齐（帧 / 60 = 秒）。

用法：python3 styles/013-art-deco/audio/make_music.py
输出：public/013-art-deco/music.wav（响度 −14 LUFS，真峰值 < −1 dBTP）
"""
import json
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

AT = {'open': 0, 'axis': 120, 'zig': 300, 'sun': 480, 'lineage': 600, 'apps': 780, 'words': 960, 'end': 1080}
SWEEPS = [6, 452, 560, 735, 900, 1146]


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
    (120, 'F'), (240, 'Dm'),
    (300, 'Gm'), (360, 'C'), (420, 'F'),
    (480, 'Bb'), (540, 'A'),
    (600, 'Dm'), (660, 'Gm'), (720, 'C'),
    (780, 'F'), (840, 'Dm'), (900, 'Gm'), (930, 'C'),
    (960, 'Bb'), (1020, 'A'),
    (1080, 'Gm'), (1110, 'C'), (1140, 'F'),
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
# 金色高光扫过：钢片琴快速上行（F 大调五声）
PENTA = [77, 79, 81, 84, 86, 89, 91, 93]
for s in SWEEPS:
    for i, m in enumerate(PENTA[2:7] if s else PENTA[3:8]):
        place(celesta(m, 0.35, 0.5), fr(s) + i * 0.045, pan=-0.5 + i * 0.25, send=0.5)

# 开场：门向两边滑开——风声一左一右；中缝落下一粒光
for p in (-0.7, 0.7):
    sfx(whoosh(0.9, 200, 3000, 0.8, 0.45), fr(14), pan=p, send=0.3)
    sfx(thud(0.25, 70, 40), fr(66), pan=p, send=0.2)
for i, m in enumerate([93, 89, 86, 84, 81, 79, 77, 74]):
    place(celesta(m, 0.5, 0.45), fr(66) + i * 0.105, send=0.55)
# 01：光落地——叮；三线劈开（一对细的“铮”）
sfx(bell(84, 1.0, 1.4), fr(120), send=0.5)
sfx(bell(91, 0.4, 0.9), fr(121), send=0.5)
pair(celesta(96, 0.6, 0.3), fr(124), width=0.3)
# 三线向两边拉开：两道风声往外走；落定：一对轻响 + 钢琴和弦
for p in (-0.85, 0.85):
    sfx(whoosh(0.75, 400, 7000, 0.7, 0.55), fr(205), pan=p, send=0.25)
pair(tick(0.9, False), fr(251), width=0.9)
pair(celesta(88, 0.5, 0.4), fr(252), width=0.9)
pair(celesta(93, 0.4, 0.35), fr(255), width=0.95)
pair(celesta(86, 0.35, 0.35), fr(263), width=0.95)

# 02：楼一级级长高，钢琴一级级往上走
Z = AT['zig']
for i, (dt, m) in enumerate([(0, 41), (6, 45), (12, 48)]):
    sfx(thud(0.32, 80, 45), fr(Z + dt), send=0.15)
    place(piano(m, 0.5, 0.9), fr(Z + dt), send=0.2)
for dt, ms in [(18, [53, 60]), (30, [57, 64]), (45, [60, 67, 72]), (75, [64, 69]), (90, [67, 72])]:
    place(chord(ms, 0.45, 1.0, 1.0), fr(Z + dt), send=0.25)
sfx(whoosh(0.55, 150, 1500, 0.6, 0.6), fr(Z + 40), send=0.2)
for i, m in enumerate([81, 84, 86, 88, 91]):
    place(celesta(m, 0.6, 0.5), fr(Z + 105 + i * 7), pan=(-1) ** i * 0.15, send=0.45)
sfx(whoosh(0.3, 1500, 9000, 0.4, 0.8), fr(Z + 140), send=0.3)
sfx(bell(96, 0.6, 1.2), fr(Z + 156), send=0.6)

# 03：拉远（反向镲）→ 射线像折扇打开：竖琴左右同时往外刷 → 拱窗合拢“叮”
S = AT['sun']
sfx(reverse_cym(0.9, 1.0), fr(S) - 0.1, send=0.3)
HARP = [65, 69, 72, 74, 77, 81, 84, 86, 89, 93, 96]
for i, m in enumerate(HARP):
    w = 0.15 + 0.08 * i
    pair(harp(m, 0.55), fr(S + 30 + i * 2.4), width=w, send=0.4, bus=MUS)
place(pad([62, 65, 69, 72], 1.0, 0.8, att=0.5, rel=0.6), fr(S + 62), send=0.4)
sfx(bell(89, 0.6, 1.3), fr(S + 108), send=0.55)

# 04：每换一座城：旧楼顶缩回（下滑），新楼顶升起（上滑）+ 弱音小号一记
for k, (fm, ms) in enumerate([(600, [62, 65, 69, 72]), (660, [62, 65, 70, 74]), (720, [64, 67, 70, 74, 79])]):
    sfx(whoosh(0.22, 3000, 400, 0.45, 0.3), fr(fm), send=0.2)
    sfx(whoosh(0.35, 400, 5000, 0.5, 0.7), fr(fm + 8), send=0.2)
    place(brass(ms, 0.32 if k < 2 else 0.5, 1.0 if k < 2 else 1.3), fr(fm + 12), send=0.35)
    place(brass(ms, 0.12, 0.7), fr(fm + 12 + 20), send=0.35)
# 上海：一句五声音阶（钢片琴），不模仿民乐
for i, m in enumerate([86, 88, 91, 93, 91]):
    place(celesta(m, 0.35, 0.4), fr(672) + i * 0.11, pan=0.2, send=0.4)

# 05：楼缩进手机；界面成对打开；按钮
A = AT['apps']
sfx(whoosh(0.9, 3000, 300, 0.5, 0.35), fr(A), send=0.3)
for p in (-0.25, 0.25):
    sfx(whoosh(0.6, 500, 4000, 0.25, 0.6), fr(A + 18), pan=p + 0.4, send=0.2)
for dt in (46, 52, 56, 62, 68, 74, 80):
    sfx(tick(0.35), fr(A + dt), pan=0.5, send=0.15)
pair(whoosh(0.4, 400, 5000, 0.35, 0.5), fr(A + 60), width=0.5)
for dt in (76, 82, 86, 92, 98, 102, 106, 112):
    sfx(tick(0.3), fr(A + dt), pan=-0.45, send=0.15)
sfx(tick(0.9, False), fr(A + 132), pan=-0.4, send=0.2)
sfx(tick(0.8, False), fr(A + 144), pan=0.5, send=0.2)
sfx(tick(0.9, False), fr(A + 162), pan=0.5, send=0.2)
sfx(bell(88, 0.5, 0.8), fr(A + 163), pan=0.5, send=0.5)
sfx(bell(84, 0.45, 1.0), fr(A + 171), pan=0.5, send=0.5)

# 五条规则：中间一块，再两边一对、一对——每块一声钢琴 + 钢片琴，声像跟着牌子往外走
WD = AT['words']
for k, (dt, w, m) in enumerate([(6, 0.0, 84), (30, 0.4, 88), (54, 0.8, 91)]):
    if w == 0:
        place(piano(m, 0.6, 0.9), fr(WD + dt), send=0.35)
        place(celesta(m + 12, 0.4, 0.5), fr(WD + dt), send=0.5)
    else:
        pair(piano(m, 0.6, 0.9), fr(WD + dt), width=w, send=0.35, bus=MUS)
        pair(celesta(m + 12, 0.4, 0.5), fr(WD + dt), width=w, send=0.5, bus=MUS)

# 片尾：牌子合上 → 门从两边合上，“咚” + 电梯“叮”
E_ = AT['end']
pair(tick(0.5), fr(E_ + 2), width=0.8)
pair(tick(0.5), fr(E_ + 8), width=0.4)
for p in (-0.8, 0.8):
    sfx(whoosh(0.85, 300, 3500, 0.75, 0.55), fr(E_ + 10), pan=p, send=0.3)
sfx(thud(1.0, 95, 42), fr(E_ + 60), send=0.25)
sfx(bell(88, 1.0, 1.6), fr(E_ + 62), send=0.6)
sfx(bell(84, 0.8, 1.8), fr(E_ + 62) + 0.32, send=0.6)


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
