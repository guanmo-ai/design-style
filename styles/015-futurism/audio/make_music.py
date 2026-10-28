"""
Design Style · 风格 015 · 未来主义 Futurism —— 配乐与音效（第二版，纯代码合成，无外部音源）

144 BPM 直拍（1 拍 = 25 帧；全片不变速）· 20 秒 = 12 小节 · D 大调，轻快的律动
  D | A | Bm | G | D | A | Bm | G | Em | G | A | Asus4 → 回到 D
乐器：四踩底鼓、二四拍拍手、反拍开镲、十六分沙锤；八度弹跳的贝斯（被底鼓“压”一下 = 侧链）；
      反拍的钢琴和弦；一句钟琴主题（开场落地后、规则段各来一次）；温暖的铺底只在“定格”和天空段出现。
结构（帧 / 60 = 秒）：
  0—25      前奏：慢动作的“呜——”、横幅撕开、八个字母一个个贴上镜头 = 八个调好音的“咚”，一级级往上
  25        落地：底鼓、贝斯、镲片一起进来（车头灯亮一下）
  25—285    律动 A：赛车起步的引擎从远到近 → 橙色车身甩走的“嗖” → 狗的小碎步（按真实步态算的每一步）、
            太太的鞋跟、闻东西、狗绳“嘣”一声（弹拨弦）、被拽走、小碎步追上 → 推近鞋子的上扬 → 匹配剪辑“锵”
  285—300   定格：鼓和贝斯一下停住，只剩铺底和一声带混响的聚光灯“哐”
  300       底座 TUMB 落在小节线上，鼓回来；312 第二声 TUMB（−3.5 dB = ÷1.5）；330 起上扬，344 白纸一闪
  350—650   律动 B：书页（ZANG 爆裂）、城（落块、电梯）、火车（每半圈一声 TA，越来越慢）
  650—750   天空：鼓收成只剩底鼓，风声越来越高、飞机掠过（多普勒）→ 冲进屏幕
  750—850   今天：轻一点的律动，界面轻点、速度往上的滑音、滚动的棘轮、打字声
  850—1100  规则：律动 C，每张卡撞进来一声铁砧（A C D E G A）
  1100—1200 片尾：最后一个和弦；片尾卡冲走；夜路上引擎从远处冲过来，接回开头（余音折回第 0 帧，循环无缝）

用法：python3 styles/015-futurism/audio/make_music.py
输出：public/015-futurism/music.wav（响度 −14 LUFS，峰值 < −1.5 dBFS）
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
N = int(SR * (DUR + 3.0))  # 多算 3 秒余音，最后折回开头
rng = np.random.default_rng(15)

MUS = np.zeros((2, N))
SFX = np.zeros((2, N))
SEND = np.zeros((2, N))
DUCK = np.ones(N)  # 侧链：底鼓一响，贝斯 / 和弦 / 铺底让一下
BEAT = 25


def fr(f):
    return f / 60.0


def place(sig, t, gain=1.0, pan=0.0, send=0.0, bus=None):
    bus = MUS if bus is None else bus
    i = int(round(t * SR))
    if i < 0:
        i += NV  # 落在 0 之前的声音折到结尾
    if i >= N:
        return
    sig = sig[: N - i]
    gl = np.cos((pan + 1) * np.pi / 4) * gain
    gr = np.sin((pan + 1) * np.pi / 4) * gain
    bus[0, i: i + len(sig)] += sig * gl
    bus[1, i: i + len(sig)] += sig * gr
    if send:
        SEND[0, i: i + len(sig)] += sig * gl * send
        SEND[1, i: i + len(sig)] += sig * gr * send


def sfx(sig, t, gain=1.0, pan=0.0, send=0.2):
    place(sig, t, gain, pan, send, SFX)


def tt(d):
    return np.arange(int(d * SR)) / SR


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def fft_filter(x, lo=None, hi=None):
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4)
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** 4)
    return np.fft.irfft(X * g, n)


def sweep(x, c0, c1):
    """一阶低通，截止频率从 c0 指数滑到 c1（逐样本，用在短的声音上）"""
    c = np.geomspace(c0, c1, len(x))
    a = np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def saw(f):
    ph = np.cumsum(f) / SR
    return 2 * (ph % 1.0) - 1


def env(t, a, d):
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


# ───────── 鼓 ─────────

def kick(level=1.0):
    t = tt(0.32)
    f = 48 + 120 * np.exp(-t / 0.03)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.14)
    y[: int(0.003 * SR)] += fft_filter(rng.standard_normal(int(0.003 * SR)), lo=2000) * 0.3
    return y * level * 0.62


def clap(level=1.0):
    t = tt(0.22)
    e = sum(np.exp(-np.maximum(0, t - d) / 0.007) * (t >= d) for d in (0, 0.008, 0.017)) + 0.7 * np.exp(-np.maximum(0, t - 0.025) / 0.05) * (t >= 0.025)
    return fft_filter(rng.standard_normal(len(t)), lo=900, hi=7000) * e * level * 0.16


def hat(level=1.0, d=0.03, open_=False):
    t = tt(0.4 if open_ else d * 4)
    y = fft_filter(rng.standard_normal(len(t)), lo=7000)
    return y * np.exp(-t / (0.11 if open_ else d)) * level * (0.04 if open_ else 0.04)


def shaker(level=1.0):
    t = tt(0.06)
    return fft_filter(rng.standard_normal(len(t)), lo=5000, hi=12000) * np.sin(np.pi * t / 0.06) ** 2 * level * 0.022


def crash(level=1.0):
    t = tt(2.0)
    y = fft_filter(rng.standard_normal(len(t)), lo=3500) * np.exp(-t / 0.7)
    return y * level * 0.09


# ───────── 旋律乐器 ─────────

def bass(m, d, level=1.0):
    t = tt(d)
    f = midi(m)
    y = saw(np.full(len(t), f)) * 0.55 + np.sin(2 * np.pi * f * t) * 0.6
    y = fft_filter(y, hi=900)
    return y * env(t, 0.004, 0.16) * level * 0.3


def piano(ms, d=0.5, level=1.0):
    """钢琴和弦：几个泛音、快起慢落，高泛音先消失"""
    t = tt(d)
    y = np.zeros_like(t)
    for m in ms:
        f = midi(m)
        for n, a in ((1, 1.0), (2, 0.45), (3, 0.25), (4, 0.12), (5, 0.06)):
            y += a * np.sin(2 * np.pi * f * n * t + n) * np.exp(-t / (0.35 / n ** 0.6))
    return y * np.minimum(1, t / 0.002) * level * 0.055 / np.sqrt(len(ms))


def bell(m, level=1.0, dec=0.9):
    """钟琴：FM，调制比 3.5，亮"""
    f0 = midi(m)
    t = tt(dec * 3)
    idx = 1.6 * np.exp(-t / 0.08)
    y = np.sin(2 * np.pi * f0 * t + idx * np.sin(2 * np.pi * 3.5 * f0 * t))
    return y * np.minimum(1, t / 0.001) * np.exp(-t / dec) * level * 0.14


def pad(ms, d, level=1.0, att=0.4, rel=0.8):
    t = tt(d + rel * 3)
    y = np.zeros_like(t)
    for m in ms:
        for det in (-0.07, 0.0, 0.08):
            f = midi(m + det)
            for n in range(1, 5):
                y += (1 / n ** 1.8) * np.sin(2 * np.pi * n * f * t + rng.random() * 6)
    e = np.minimum(1, t / att) * np.where(t < d, 1.0, np.exp(-(t - d) / rel))
    return fft_filter(y, hi=2800) * e * level * 0.028 / np.sqrt(len(ms))


def pluck_string(m, d=0.8, level=1.0, bright=0.5):
    """弹拨弦（Karplus-Strong）：狗绳“嘣”的一声"""
    f = midi(m)
    L = int(SR / f)
    buf = rng.uniform(-1, 1, L)
    out = np.zeros(int(d * SR))
    for i in range(len(out)):
        j = i % L
        nxt = (j + 1) % L
        v = buf[j]
        buf[j] = 0.996 * (bright * buf[j] + (1 - bright) * buf[nxt]) if i >= L else buf[j]
        out[i] = v
    return out * level * 0.25


# ───────── 音效 ─────────

def whoosh(d=0.6, c0=300, c1=7000, level=1.0, peak=0.5):
    t = tt(d)
    e = np.sin(np.pi * np.clip(t / d, 0, 1) ** (np.log(0.5) / np.log(peak))) ** 2
    return sweep(rng.standard_normal(len(t)), c0, c1) * e * level * 0.45


def riser(d, level=1.0, c0=400, c1=9000):
    t = tt(d)
    y = sweep(rng.standard_normal(len(t)), c0, c1)
    f = 200 * (8 ** (t / d))
    y += 0.25 * np.sin(2 * np.pi * np.cumsum(f) / SR)
    return y * (t / d) ** 2.2 * level * 0.3


def boom(level=1.0, f0=120, f1=38, d=0.9):
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.05)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.3)
    y += 0.25 * fft_filter(rng.standard_normal(len(t)), lo=200, hi=3000) * np.exp(-t / 0.04)
    return y * level * 0.6


def thock(m, level=1.0):
    """字母贴上镜头：木块一样的“咚”，调好了音"""
    t = tt(0.25)
    f = midi(m)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.06) + 0.5 * np.sin(2 * np.pi * 2.7 * f * t) * np.exp(-t / 0.02)
    y[: int(0.002 * SR)] += rng.standard_normal(int(0.002 * SR)) * 0.4
    return y * level * 0.28


def click(level=1.0, lo=1800, hi=9000, d=0.004):
    t = tt(0.03)
    return fft_filter(rng.standard_normal(len(t)), lo=lo, hi=hi) * np.exp(-t / d) * level * 0.25


def heel(level=1.0):
    t = tt(0.12)
    y = np.sin(2 * np.pi * 1900 * t) * np.exp(-t / 0.012) + fft_filter(rng.standard_normal(len(t)), lo=2500) * np.exp(-t / 0.006)
    return y * level * 0.12


def rip(d=0.5, level=1.0):
    """横幅撕开：噼啪的纸声"""
    t = tt(d)
    y = np.zeros_like(t)
    for _ in range(60):
        i = int(rng.random() ** 1.6 * len(t) * 0.9)
        n = min(len(t) - i, int(0.004 * SR))
        y[i: i + n] += rng.standard_normal(n) * np.exp(-np.arange(n) / (0.001 * SR)) * (1 - i / len(t))
    return fft_filter(y, lo=1500, hi=10000) * level * 0.5


def screech(d, m0=98, m1=86, level=1.0):
    t = tt(d)
    f = midi(m0) * (midi(m1) / midi(m0)) ** (t / d)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR + 0.7 * np.sin(2 * np.pi * 41 * t))
    e = np.minimum(1, t / 0.03) * np.minimum(1, (d - t) / 0.05)
    return y * e * level * 0.05


def engine(d, f0, f1, level=1.0, curve=1.0, near=None):
    """引擎：两个失谐的锯齿 + 低频噪声，音高 f0 → f1；near 给出“越来越近”的音量包络"""
    t = tt(d)
    u = (t / d) ** curve
    f = f0 * (f1 / f0) ** u
    y = saw(f) * 0.5 + saw(f * 1.5) * 0.25 + saw(f * 0.5) * 0.3
    y = fft_filter(y, hi=2400) + 0.12 * fft_filter(rng.standard_normal(len(t)), hi=500)
    e = near if near is not None else np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.05)
    return y * e * level * 0.12


def slowmo(d, level=1.0):
    """慢动作的“呜——”：一个往下掉的低音 + 倒放的噪声"""
    t = tt(d)
    f = 160 * (0.35 ** (t / d))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.8 + 0.3 * sweep(rng.standard_normal(len(t)), 3000, 300)
    return y * np.sin(np.pi * t / d) * level * 0.4


def shimmer(d, level=1.0):
    t = tt(d)
    y = sum(np.sin(2 * np.pi * midi(m) * t + m) for m in (93, 97, 100)) / 3
    return y * np.sin(np.pi * t / d) ** 2 * level * 0.06


def clank(level=1.0):
    t = tt(1.2)
    f0 = 180
    y = sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / k) for r, a, k in ((1, 1, 0.5), (2.76, 0.6, 0.25), (5.4, 0.35, 0.1)))
    y += 0.6 * fft_filter(rng.standard_normal(len(t)), lo=500, hi=6000) * np.exp(-t / 0.03)
    return y * level * 0.3


def anvil(m=69, level=1.0, d=0.8):
    t = tt(d)
    f0 = midi(m)
    y = sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / (d * k)) for r, a, k in ((1, 1, 0.5), (2.76, 0.55, 0.25), (5.4, 0.35, 0.12)))
    y += 0.4 * fft_filter(rng.standard_normal(len(t)), lo=2000) * np.exp(-t / 0.01)
    return y * np.minimum(1, t / 0.0005) * level * 0.2


def tom(m, level=1.0):
    t = tt(0.6)
    f = midi(m) * (1 + 0.6 * np.exp(-t / 0.03))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)
    return y * level * 0.5


def hiss(d, level=1.0):
    t = tt(d)
    y = fft_filter(rng.standard_normal(len(t)), lo=3500, hi=11000)
    return y * np.minimum(1, t / 0.02) * np.exp(-np.maximum(0, t - d * 0.5) / (d * 0.25)) * level * 0.2


def glide(m0, m1, d, level=1.0):
    t = tt(d)
    f = midi(m0) * (midi(m1) / midi(m0)) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.6 * level * 0.07


# ───────── 编排 ─────────
CH = {
    'D': (38, [62, 66, 69, 74]), 'A': (33, [61, 64, 69, 73]), 'Bm': (35, [62, 66, 71, 74]), 'G': (31, [62, 67, 71, 74]),
    'Em': (40, [64, 67, 71, 76]), 'Asus': (33, [62, 64, 69, 74]),
}
PROG = ['D', 'A', 'Bm', 'G', 'D', 'A', 'Bm', 'G', 'Em', 'G', 'A', 'Asus']

# 鼓怎么打：每一段一种密度
def drums_at(f):
    if f < 25 or 285 <= f < 300 or 344 <= f < 352 or f >= 1150:
        return 'none'
    if 650 <= f < 750:
        return 'kick'  # 天空：只剩底鼓
    if 750 <= f < 850:
        return 'light'
    return 'full'


for b in range(48):
    fb = b * BEAT
    for sub_ in range(4):
        f = fb + sub_ * 6.25
        mode = drums_at(f)
        if mode == 'none':
            continue
        if sub_ == 0:
            place(kick(), fr(f))
            i = int(fr(f) * SR)
            n = int(0.18 * SR)
            DUCK[i: i + n] = np.minimum(DUCK[i: i + n], 0.45 + 0.55 * (np.arange(n) / n) ** 0.7)
            if mode in ('full', 'light') and b % 2 == 1:
                place(clap(0.8 if mode == 'light' else 1.0), fr(f), send=0.15)
        if mode == 'full':
            if sub_ == 2:
                place(hat(1.0, open_=True), fr(f), pan=0.25, send=0.05)
            place(shaker(0.9 if sub_ % 2 else 0.6), fr(f), pan=-0.3)
        elif mode == 'light' and sub_ == 2:
            place(hat(0.8), fr(f), pan=0.25)

BASSPAT = [0, 12, 0, 12, 0, 12, 7, 12]
for bar, name in enumerate(PROG):
    root, tones = CH[name]
    f0 = bar * 100
    for k in range(8):
        f = f0 + k * 12.5
        mode = drums_at(f)
        if mode in ('none',) and not (285 <= f < 300):
            continue
        if 285 <= f < 300:
            continue
        lvl = 0.75 if mode == 'light' else 1.0
        place(bass(root + BASSPAT[k], 0.2, lvl), fr(f))
    for k in range(4):  # 反拍的钢琴和弦
        f = f0 + k * BEAT + 12.5
        if drums_at(f) in ('none',) or drums_at(f) == 'kick':
            continue
        place(piano([m + 12 for m in tones], 0.45, 0.9), fr(f), pan=0.2, send=0.3)

# 铺底：定格、天空、片尾
place(pad([62, 66, 69, 73], fr(18), 0.9), fr(285), send=0.5)
place(pad([59, 62, 66, 71], fr(100), 0.8, att=0.8), fr(650), send=0.5)
place(pad([62, 66, 69, 74], fr(60), 0.8, att=0.1), fr(1100), send=0.5)

# 钟琴主题：落地之后、规则段、片尾
MOTIF = [(0, 78), (12.5, 81), (25, 85), (37.5, 83), (50, 81), (62.5, 78), (75, 76), (87.5, 78)]
for base in (25, 850, 950):
    for dt, m in MOTIF:
        place(bell(m, 0.7), fr(base + dt), pan=-0.2, send=0.4)
place(bell(86, 0.8, 1.5), fr(1100), send=0.6)

# ───────── 音效（帧号来自 video/ 里的轨迹） ─────────
# 片尾—开场：引擎从远处冲过来（1150 起，越来越近），撞开横幅
t_ = tt(fr(52))
near = (t_ / t_[-1]) ** 3
sfx(engine(fr(52), 70, 150, 2.0, 1.0, near), fr(1150), pan=0.1)
sfx(riser(fr(50), 1.4), fr(1150))
sfx(rip(0.5, 1.0), fr(0), send=0.3)
sfx(boom(0.7, 90, 35, 1.0), fr(0))
sfx(slowmo(fr(24), 1.0), fr(0), send=0.3)
sfx(screech(fr(14), 96, 88, 1.0), fr(1), pan=0.1)
LETTERS = [14.5, 15.7, 17, 18.2, 19.5, 20.8, 22, 23.3]
for i, (f, m) in enumerate(zip(LETTERS, [62, 64, 66, 69, 71, 74, 76, 78])):
    sfx(thock(m, 0.9), fr(f), pan=-0.6 + i * 0.17)
place(crash(1.0), fr(25), send=0.3)
sfx(shimmer(0.5, 1.0), fr(25), send=0.5)  # 车头灯亮一下
# 起步：往后一坐、轰油门、越来越近，车身盖满画面
sfx(engine(fr(36), 55, 220, 1.3, 1.5, np.minimum(1, (tt(fr(36)) / fr(36)) ** 1.5 + 0.2)), fr(56), pan=0.0)
sfx(whoosh(fr(22), 300, 9000, 0.9, 0.85), fr(76))
sfx(whoosh(fr(16), 6000, 300, 0.8, 0.2), fr(92), pan=-0.6)  # 橙色车身往左甩走

# 01 狗：真实步态的每一步、太太的鞋跟
PAWS = [104.9, 108.4, 111.9, 115.4, 118.9, 122.4, 125.9, 129.3, 132.8, 136.3, 139.8, 143.3, 146.8, 150.3, 153.8, 157.2, 160.7, 164.2, 167.7, 171.3,
        188.9, 190.6, 192.3, 193.8, 195.4, 196.9, 198.4, 199.9, 201.4, 202.9, 204.5, 206.1, 207.9, 209.7, 211.9, 214.4, 217.2, 220]
for i, f in enumerate(PAWS):
    sfx(click(0.55, 2500, 8000, 0.003), fr(f), pan=0.25 + 0.05 * (i % 2))
HEELS = [103.8, 115, 126.3, 137.5, 148.8, 160, 171.3, 182.5, 193.8, 205, 216.3, 227.5, 238.8]
for f in HEELS:
    sfx(heel(0.8), fr(f), pan=-0.3)
sfx(screech(fr(6), 90, 84, 0.5), fr(170), pan=0.2)  # 狗急刹
for f in (175, 179, 183):
    sfx(click(0.5, 600, 2500, 0.012), fr(f), pan=0.3)  # 闻
sfx(pluck_string(40, 0.7, 1.0, 0.55), fr(187), pan=0.1, send=0.2)  # 狗绳绷直“嘣”
sfx(whoosh(fr(10), 800, 5000, 0.6, 0.3), fr(188), pan=0.3)  # 被拽走
sfx(riser(fr(36), 0.6, 600, 7000), fr(214))  # 推近鞋子
sfx(heel(1.4), fr(250), pan=0.0, send=0.4)  # 鞋落地 = 铬银的脚落地
sfx(anvil(81, 0.6, 1.0), fr(250), send=0.5)

# 02 雕塑：跑步的落脚、定格、聚光灯、底座、TUMB
for k in range(1, 3):
    sfx(boom(0.25, 140, 60, 0.3), fr(285 - 16.13 * k), pan=0.1)
sfx(clank(1.0), fr(285), send=0.7)
sfx(shimmer(fr(15), 1.2), fr(285), send=0.6)
sfx(boom(1.0), fr(300), send=0.3)
place(crash(0.8), fr(300), send=0.3)
sfx(boom(10 ** (-3.5 / 20), 110, 40), fr(312), send=0.3)
sfx(riser(fr(14), 0.9), fr(330))
sfx(whoosh(fr(10), 2000, 9000, 0.6, 0.9), fr(340))

# 03—06：第一版的剧本整体往后挪 50 帧
S = 50
sfx(whoosh(fr(13), 1500, 9000, 0.6, 0.9), fr(312 + S), pan=-0.6)
sfx(boom(1.1, 140, 40), fr(325 + S), send=0.3)  # ZANG
place(crash(1.0), fr(325 + S), send=0.3)
for k, f in enumerate([331, 337]):
    sfx(tom(45 - 3 * k, 10 ** (-3.5 * (k + 1) / 20)), fr(f + S), pan=0.3 + 0.2 * k)
sfx(tom(47, 0.6), fr(348 + S), pan=-0.5)
sfx(glide(76, 52, fr(40), 1.4), fr(350 + S), pan=0.2)  # UUUUUUM 一路往下滑
sfx(whoosh(0.45, 400, 8000, 0.5), fr(374 + S), pan=-0.2)
for i in range(13):
    sfx(click(0.4, 2000, 7000), fr(384 + S + i * 1.4), pan=-0.6 + 0.1 * i)
for n in range(5):
    for j in range(2):
        sfx(boom(0.25, 150, 70, 0.3), fr(404 + S + n * 5 + j * 2.5), pan=-0.5 + 0.25 * n)
for n in range(3):
    sfx(glide(57, 69, 0.25, 0.7), fr(410 + S + n * 4), pan=-0.4 + 0.4 * n)
    for j in range(2):
        sfx(click(0.5), fr(428 + S + n * 3 + j * 2), pan=0.5 - j)
sfx(engine(fr(24), 120, 360, 0.6), fr(444 + S), pan=-0.2)  # 电梯上冲
sfx(click(0.8), fr(468 + S))
sfx(engine(fr(38), 300, 60, 0.6), fr(462 + S), pan=0.2)  # 往下冲
TAS = [502, 506.35, 511.1, 516.5, 522.9, 531.15, 547.25]
for i, f in enumerate(TAS):
    sfx(tom(50 - i, 0.7), fr(f + S), pan=0.4 - 0.1 * i)
    sfx(click(0.5, 3000, 11000), fr(f + S + 1), pan=0.3)
sfx(engine(fr(52), 80, 45, 0.7), fr(500 + S), pan=0.2)
sfx(screech(fr(24), 96, 86, 0.7), fr(528 + S), pan=0.2)
sfx(hiss(1.0, 1.0), fr(554 + S), pan=0.3, send=0.3)  # PSSSH
sfx(whoosh(fr(38), 300, 6000, 0.6, 0.8), fr(562 + S), send=0.2)
sfx(whoosh(0.5, 2000, 400, 0.6, 0.3), fr(612 + S), send=0.3)  # 破云
sfx(riser(fr(80), 1.0, 300, 8000), fr(614 + S))
t_ = tt(fr(70))
fpl = 140 * np.where(t_ < fr(54), 1.0 + 0.3 * t_ / fr(54), 1.3 * (0.55 ** ((t_ - fr(54)) / fr(16))))
plane = (saw(fpl) * 0.5 + saw(fpl * 1.5) * 0.3) * np.minimum(1, t_ / 0.2) * np.minimum(1, (t_[-1] - t_) / 0.1) * 0.1
sfx(fft_filter(plane, hi=2500), fr(616 + S))
sfx(whoosh(fr(18), 300, 9000, 0.7, 0.85), fr(686 + S))

# 07 今天
sfx(click(0.6), fr(770))
sfx(glide(57, 76, fr(24), 0.9), fr(770), pan=-0.4)
sfx(whoosh(0.2, 1500, 8000, 0.4, 0.4), fr(790), pan=-0.4)
sfx(click(1.0), fr(790), pan=-0.4)
sfx(boom(0.35, 140, 70, 0.3), fr(792), pan=0.5)
d_acc = last = 0.0
for f in np.arange(796, 818, 0.1):
    v = 4 * (f - 796) if f < 807 else max(0.0, 44 - 4 * (f - 807))
    d_acc += v * 0.1
    if d_acc - last >= 40:
        last = d_acc
        sfx(click(0.35, 3000, 6000), fr(f), pan=0.5)
for i in range(16):
    sfx(click(0.3, 4000, 9000), fr(818 + i * 1.9 + (i % 3) * 0.4), pan=0.4)

# 规则：每张卡撞进来一声铁砧
for i, m in enumerate([69, 72, 74, 76, 79, 81]):
    stop = 872 + 50 * i
    sfx(anvil(m, 0.8), fr(stop - 28 + 9), send=0.35)
    sfx(boom(0.4, 130, 50, 0.4), fr(stop - 28 + 9))
    sfx(whoosh(fr(26), 400, 7000, 0.3, 0.3), fr(stop - 28), pan=-0.4)
sfx(whoosh(fr(12), 300, 4000, 0.4, 0.5), fr(1128))  # 片尾卡撑满画面
sfx(whoosh(fr(26), 6000, 300, 0.8, 0.2), fr(1156), pan=0.6)  # 冲出右边


def reverb(x, seed, dec=0.6, length=2.4):
    t = tt(length)
    ir = np.random.default_rng(seed).standard_normal(len(t)) * np.exp(-t / dec)
    ir = fft_filter(ir, hi=6500)
    ir[: int(0.02 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + len(ir)
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


# 侧链只压“乐队”里除了鼓以外的部分：简单起见对整个 MUS 用一个更轻的版本，鼓本身的瞬态在压之前已经过去
duck = 0.65 + 0.35 * DUCK
mix = MUS * duck + SFX * 0.62  # 音效让出背景音乐
mix[0] += reverb(SEND[0], 1) * 0.4
mix[1] += reverb(SEND[1], 2) * 0.4
for ch in range(2):
    mix[ch] = fft_filter(mix[ch], lo=30)
mix[:, : N - NV] += mix[:, NV:]  # 余音折回开头
mix = mix[:, :NV]
mix = mix.T
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.2) / np.tanh(1.2)

root = os.path.dirname(os.path.abspath(__file__))
out_dir = os.path.normpath(os.path.join(root, '..', '..', '..', 'public', '015-futurism'))
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
