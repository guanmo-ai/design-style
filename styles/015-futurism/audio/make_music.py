"""
Design Style · 风格 015 · 未来主义 Futurism —— 配乐与音效（纯代码合成，无外部音源）

144 BPM 直拍（1 拍 = 25 帧 = 0.4167 秒；全片不变速）· 20 秒 = 48 拍 = 12 小节 · A 弗里几亚（A–B♭–C–D–E–F–G）
音色向鲁索洛的“噪音机”（Intonarumori，1913）致敬：嚎叫器（音高滑动的带通噪声）、轰鸣器（低频锯齿 + 噪声）、
爆裂器（噪声爆发 + 低频冲击）、嘶声器（高频噪声）、噼啪器（短促的金属碎响）；底下是一台 16 分音符的“马达”贝斯和机械鼓。

  0—1.7s     开场：刹车尖啸一路往下滑（接在片尾 1180 帧起的那一声上，循环无缝）→ f25 铁砧 + 爆裂（停死）· 鼓进来
             f75 吸气（起势）→ f83 马达拉高（冲出去）
  1.7—3.3s   01 狗：每一步一声小“嗒”（脚步按真实步态算）· 刹车一声短促的吱 · 人重新起步：轰鸣器往上推
  3.3—5s     02 雕塑：f245 定格——整首歌“磁带停转”（音高往下掉、滤波收拢），只剩余音 · 262 / 275 两声 TUMB（低音鼓，第二声 ÷ 1.5）
             284 起 TUMB 冲向镜头（上扬的嘶声）→ 300 砸进书页
  5—6.7s     03 文学：ZANG = 爆裂器（f325）· TUMB / tumb 一声比一声轻（每级 −3.5 dB ≈ ÷ 1.5）· TUUUUUUM = 嚎叫器一路往下滑 · 字往上飞走
  6.7—8.3s   04 建筑：退台块一块一声“咚”· 电梯井拉长（拉链声）· 天桥“嚓”· 电梯起步（马达上行）· 冲进地下（下行）
  8.3—10s    05 火车：轮子每半圈一声 TA（越来越慢、越来越低）· 刹车尖啸 · PSSSH 泄汽 · 蒸汽往上冲
  10—11.7s   06 天空：破云（风）· 俯冲：风声越来越高 · 飞机掠过（多普勒：音高往下掉）· 冲进屏幕
  11.7—14.2s 07 今天：界面轻点 · 速度上升的滑音 · 冲刺（嗖 + 点）· 网页落定 · 滚动的棘轮声（越快越密）· 代码打字声
  14.2—18.3s 规则：每张卡撞进来一声铁砧，音高一级级往上（A C D E G）
  18.3—20s   片尾：一句话；起势吸气 → 马达拉高冲出去 → f1180 刹车尖啸（折回开头）
所有时间点与 video/ 里的关键帧对齐（帧 / 60 = 秒）。

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
BEAT = 25  # 帧


def fr(frame):
    return frame / 60.0


def place(sig, t, gain=1.0, pan=0.0, send=0.0, bus=None):
    bus = MUS if bus is None else bus
    i = int(round(t * SR))
    if i < 0:  # 落在 0 之前的声音折到结尾（循环）
        i += NV
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


def sfx(sig, t, gain=1.0, pan=0.0, send=0.25):
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


def onepole(x, c):
    """一阶低通，截止频率可以随时间变（c 可以是数组）"""
    c = np.broadcast_to(np.asarray(c, dtype=float), x.shape)
    a = np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def bandnoise(f, q=8.0):
    """带通噪声，中心频率 f（数组）：两个一阶低通相减，近似“嚎叫器”的音色"""
    n = rng.standard_normal(len(f))
    return onepole(n, f * (1 + 1 / q)) - onepole(n, f * (1 - 1 / q))


def saw(f):
    ph = np.cumsum(f) / SR
    return 2 * (ph % 1.0) - 1


# ───────── 噪音机 ─────────

def howl(m0, m1, d, level=1.0, curve=1.0):
    """嚎叫器（ululatore）：音高从 m0 滑到 m1 的窄带噪声 + 一点正弦芯"""
    t = tt(d)
    u = (t / d) ** curve
    f = midi(m0) * (midi(m1) / midi(m0)) ** u
    y = bandnoise(f, 10) * 3.0 + 0.35 * np.sin(2 * np.pi * np.cumsum(f) / SR)
    e = np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.08)
    return y * e * level * 0.16


def roar(d, f0=55, f1=110, level=1.0):
    """轰鸣器（rombatore）：低频锯齿 + 噪声，音高往上推"""
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d)
    y = 0.6 * saw(f) + 0.5 * saw(f * 1.01) + 0.4 * onepole(rng.standard_normal(len(t)), 300)
    y = onepole(y, 200 + 1800 * (t / d))
    e = np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.05)
    return y * e * level * 0.3


def burst(level=1.0, d=0.9):
    """爆裂器（scoppiatore）：噪声爆发 + 低频冲击"""
    t = tt(d)
    n = rng.standard_normal(len(t))
    y = fft_filter(n, lo=200, hi=9000) * np.exp(-t / 0.12) * 0.7
    f = 40 + 120 * np.exp(-t / 0.05)
    y += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.25) * 1.1
    return y * level * 0.5


def hiss(d, level=1.0, c0=3000, c1=9000):
    """嘶声器（sibilatore）"""
    t = tt(d)
    y = onepole(rng.standard_normal(len(t)), np.geomspace(c0, c1, len(t))) - onepole(rng.standard_normal(len(t)), 1200)
    e = np.minimum(1, t / 0.03) * np.exp(-np.maximum(0, t - d * 0.6) / (d * 0.25))
    return y * e * level * 0.3


def crackle(level=1.0):
    """噼啪器（crepitatore）：一小串金属碎响"""
    t = tt(0.06)
    y = fft_filter(rng.standard_normal(len(t)), lo=3000, hi=12000) * np.exp(-t / 0.008)
    return y * level * 0.3


def anvil(m=69, level=1.0, d=0.9):
    """铁砧：不和谐的金属泛音（1 : 2.76 : 5.4 : 8.93）"""
    t = tt(d)
    f0 = midi(m)
    y = sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / (d * k)) for r, a, k in ((1, 1, 0.5), (2.76, 0.6, 0.25), (5.4, 0.4, 0.12), (8.93, 0.25, 0.06)))
    y += 0.5 * fft_filter(rng.standard_normal(len(t)), lo=2000) * np.exp(-t / 0.01)
    return y * np.minimum(1, t / 0.0005) * level * 0.22


def thud(level=1.0, f0=110, f1=42, d=0.5):
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.15) * level * 0.6


def tom(m, level=1.0):
    t = tt(0.6)
    f = midi(m) * (1 + 0.6 * np.exp(-t / 0.03))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)
    y += 0.3 * fft_filter(rng.standard_normal(len(t)), lo=800, hi=5000) * np.exp(-t / 0.02)
    return y * level * 0.55


def click(level=1.0, hi=9000):
    t = tt(0.03)
    return fft_filter(rng.standard_normal(len(t)), lo=1800, hi=hi) * np.exp(-t / 0.004) * level * 0.25


def screech(d, m0=100, m1=76, level=1.0):
    """刹车尖啸：高音嚎叫 + 粗糙的调制，往下滑"""
    t = tt(d)
    f = midi(m0) * (midi(m1) / midi(m0)) ** ((t / d) ** 0.7)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR + 0.8 * np.sin(2 * np.pi * 37 * t)) * 0.5
    y += bandnoise(f * 1.5, 6) * 2.0
    e = np.minimum(1, t / 0.08) ** 2 * np.minimum(1, (d - t) / 0.02)
    return y * e * level * 0.12


def rev_up(d, f0=60, f1=420, level=1.0):
    """马达拉高：锯齿 + 次谐波，音高指数上升（起步）"""
    t = tt(d)
    f = f0 * (f1 / f0) ** ((t / d) ** 1.4)
    y = saw(f) * 0.6 + saw(f * 0.5) * 0.4
    y = onepole(y, 600 + 5000 * (t / d))
    e = np.minimum(1, t / 0.03) * np.minimum(1, (d - t) / 0.04)
    return y * e * level * 0.22


def inhale(d, level=1.0):
    t = tt(d)
    return onepole(rng.standard_normal(len(t)), np.geomspace(500, 6000, len(t))) * (t / d) ** 2.5 * level * 0.35


def whoosh(d=0.6, c0=300, c1=7000, level=1.0, peak=0.5):
    t = tt(d)
    e = np.sin(np.pi * np.clip(t / d, 0, 1) ** (np.log(0.5) / np.log(peak))) ** 2
    return onepole(rng.standard_normal(len(t)), np.geomspace(c0, c1, len(t))) * e * level * 0.5


def glide(m0, m1, d, level=1.0):
    t = tt(d)
    f = midi(m0) * (midi(m1) / midi(m0)) ** (t / d)
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.6
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)) * e * level * 0.08


# ───────── 乐队：马达贝斯 + 机械鼓 + 金属和弦 ─────────

def kick(level=1.0):
    t = tt(0.35)
    f = 46 + 110 * np.exp(-t / 0.025)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.15)
    return y * level * 0.6


def snare(level=1.0):
    t = tt(0.22)
    y = fft_filter(rng.standard_normal(len(t)), lo=1200, hi=8000) * np.exp(-t / 0.05)
    y += 0.4 * np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.04)
    return y * level * 0.28


def hat(level=1.0, d=0.03):
    t = tt(d * 3)
    return fft_filter(rng.standard_normal(len(t)), lo=7500) * np.exp(-t / d) * level * 0.08


def bass(m, d, level=1.0):
    t = tt(d)
    f = midi(m)
    y = saw(np.full(len(t), f)) * 0.7 + np.sin(2 * np.pi * f * t) * 0.5
    y = onepole(y, 300 + 1700 * np.exp(-t / 0.05))
    return y * np.minimum(1, t / 0.003) * np.exp(-t / 0.12) * level * 0.28


def stab(ms, d, level=1.0):
    """金属和弦：方波 + 失谐，像机器里的簧片"""
    t = tt(d)
    y = np.zeros_like(t)
    for m in ms:
        for det in (-0.06, 0.06):
            f = midi(m + det)
            y += np.sign(np.sin(2 * np.pi * f * t)) * 0.5
    y = onepole(y, 900 + 3000 * np.exp(-t / 0.08))
    return y * np.minimum(1, t / 0.004) * np.exp(-t / (d * 0.5)) * level * 0.05 / np.sqrt(len(ms))


# A 弗里几亚：Am – B♭ – G – Am · Am – F – G – E（每小节 4 拍 = 100 帧）
PROG = [('Am', 45, [57, 60, 64]), ('Bb', 46, [58, 62, 65]), ('G', 43, [55, 59, 62]), ('Am', 45, [57, 60, 64]),
        ('F', 41, [53, 57, 60]), ('G', 43, [55, 59, 62]), ('E', 40, [56, 59, 64]), ('Am', 45, [57, 60, 64]),
        ('Bb', 46, [58, 62, 65]), ('G', 43, [55, 59, 62]), ('F', 41, [53, 57, 60]), ('E', 40, [56, 59, 64])]
BAND = (25, 1180)  # 鼓和贝斯：开场停死那一下进来，片尾冲出去时收
FREEZE = (245, 262)  # 定格：乐队停转
TAPE = 241  # 磁带停转从这里开始往下掉


def silent(f):
    return FREEZE[0] <= f < FREEZE[1] or not (BAND[0] <= f < BAND[1])


BASS_PAT = [0, 0, 12, 0, 0, 7, 0, 12, 0, 0, 12, 0, 10, 7, 0, 3]
for bar, (name, root, tones) in enumerate(PROG):
    f0 = bar * 100
    for s_ in range(16):
        fs = f0 + s_ * 6.25
        if silent(fs):
            continue
        place(bass(root + BASS_PAT[s_], 0.14, 1.0 if s_ % 4 == 0 else 0.7), fr(fs))
    for b in range(4):
        fb = f0 + b * BEAT
        if silent(fb):
            continue
        place(kick(), fr(fb))
        if b % 2:
            place(snare(), fr(fb), send=0.15)
        for h in range(2):
            place(hat(0.9 if h else 0.5), fr(fb + 12.5 * h), pan=0.35, send=0.05)
        if b in (0, 2) or (b == 3 and bar % 2):
            place(stab([m + 12 for m in tones], 0.3, 0.9), fr(fb + (6.25 if b == 3 else 0)), pan=-0.3, send=0.35)

# 磁带停转：把定格前 4 帧到定格的那一小段音乐按音高往下掉的方式拉长，填进 245—262
i0 = int(fr(TAPE) * SR)
i1 = int(fr(FREEZE[0]) * SR)
seg = MUS[:, i0:i1].copy()
L = int(fr(FREEZE[1] - TAPE) * SR)
pos = np.cumsum(np.linspace(1.0, 0.05, L))
pos = pos / pos[-1] * (seg.shape[1] - 1) * 0.98
for ch in range(2):
    MUS[ch, i0: i0 + L] = np.interp(pos, np.arange(seg.shape[1]), seg[ch]) * np.linspace(1, 0, L) ** 1.5

# ───────── 音效（帧号来自 video/ 的轨迹） ─────────
sfx(screech(fr(45), 100, 74, 1.0), fr(1180), pan=-0.2, send=0.2)  # 片尾起、折回开头：FUTURISM 一路刹车
sfx(anvil(69, 1.0), fr(25), send=0.4)
sfx(burst(0.8), fr(25), send=0.3)
sfx(inhale(fr(8), 0.6), fr(75))
sfx(rev_up(fr(30), 55, 480, 1.0), fr(83), pan=0.3, send=0.2)
sfx(whoosh(0.5, 300, 6000, 0.5), fr(88), pan=0.5)

# 01 狗：真实步态的落脚（每走 45px 一步）
STEPS = [135.5, 139.5, 143.25, 147, 151, 156]
for i, s_ in enumerate(STEPS):
    for half in (0, 1):
        sfx(click(0.6 if half else 0.9, 7000), fr(s_ + half * 2), pan=0.2 + 0.1 * half)
for i, f_ in enumerate([106, 109, 112, 113, 118, 119.5, 121, 122.5]):  # 狗一块块落下来
    sfx(thud(0.25, 160 + 20 * i, 80, 0.25), fr(f_ + 10), pan=0.1)
sfx(screech(fr(12), 92, 84, 0.35), fr(150), pan=0.2)
sfx(roar(fr(60), 45, 120, 0.9), fr(186), pan=-0.2, send=0.2)

# 02 雕塑
sfx(hiss(0.5, 0.4, 6000, 2000), fr(245), send=0.6)
sfx(tom(40, 1.0), fr(262), send=0.3)
sfx(tom(40, 10 ** (-3.5 / 20)), fr(275), send=0.3)
sfx(whoosh(fr(16), 400, 9000, 0.9, 0.9), fr(284), send=0.2)
sfx(burst(0.6), fr(300))

# 03 文学
sfx(whoosh(fr(13), 1500, 9000, 0.7, 0.9), fr(312), pan=-0.6)
sfx(burst(1.1), fr(325), send=0.4)  # ZANG
sfx(anvil(64, 0.6), fr(325), send=0.4)
for k, f_ in enumerate([331, 337]):
    sfx(tom(45 - 3 * k, 10 ** (-3.5 * (k + 1) / 20)), fr(f_), pan=0.3 + 0.2 * k)  # TUMB · tumb：每级 ÷1.5
sfx(tom(47, 0.6), fr(348), pan=-0.5)  # TU
sfx(howl(76, 52, fr(44), 1.1, 0.6), fr(350), pan=0.2, send=0.3)  # UUUUUUM
sfx(whoosh(0.45, 400, 8000, 0.5), fr(374), pan=-0.2)
for i in range(13):  # 字母一个个长高
    sfx(click(0.45, 6000), fr(384 + i * 1.4), pan=-0.6 + 0.1 * i)
sfx(glide(57, 69, 0.4, 0.8), fr(384))

# 04 建筑
for n in range(5):
    for j in range(2):
        sfx(thud(0.35, 130, 60, 0.3), fr(404 + n * 5 + j * 2.5), pan=-0.5 + 0.25 * n)
for n in range(3):
    sfx(glide(45, 69, 0.25, 0.7), fr(410 + n * 4), pan=-0.4 + 0.4 * n)  # 电梯井拉长
    for j in range(2):
        sfx(whoosh(0.15, 2000, 7000, 0.3, 0.8), fr(419 + n * 3 + j * 2), pan=0.5 - j)  # 天桥滑进来
        sfx(click(0.5), fr(428 + n * 3 + j * 2), pan=0.5 - j)
sfx(rev_up(fr(24), 90, 360, 0.7), fr(444), pan=-0.2)  # 电梯 1 上冲
sfx(click(0.8), fr(468))
sfx(rev_up(fr(38), 300, 50, 0.7), fr(462), pan=0.2)  # 电梯 2 往下冲

# 05 火车：轮子每半圈一声 TA
TAS = [502, 506.35, 511.1, 516.5, 522.9, 531.15, 547.25]
for i, f_ in enumerate(TAS):
    sfx(tom(50 - i, 0.75), fr(f_), pan=0.4 - 0.1 * i)
    sfx(crackle(0.6), fr(f_ + 1), pan=0.3)
sfx(roar(fr(52), 70, 40, 0.8), fr(500), pan=0.2)
sfx(screech(fr(24), 98, 88, 0.6), fr(528), pan=0.2, send=0.2)
sfx(hiss(1.0, 1.0, 9000, 2500), fr(554), pan=0.3, send=0.3)  # PSSSH
sfx(whoosh(fr(38), 300, 6000, 0.6, 0.8), fr(562), send=0.2)

# 06 天空
sfx(whoosh(0.5, 2000, 400, 0.6, 0.3), fr(612), send=0.3)  # 破云
t_ = tt(fr(78))
wind = onepole(rng.standard_normal(len(t_)), np.geomspace(300, 4000, len(t_))) * (t_ / t_[-1]) ** 1.5 * 0.3
sfx(wind, fr(612), send=0.2)
t_ = tt(fr(70))
fpl = 140 * np.where(t_ < fr(56), 1.0 + 0.3 * t_ / fr(56), 1.3 * (0.55 ** ((t_ - fr(56)) / fr(14))))
plane = (saw(fpl) * 0.5 + saw(fpl * 1.5) * 0.3) * np.minimum(1, t_ / 0.2) * np.minimum(1, (t_[-1] - t_) / 0.1) * 0.12
sfx(onepole(plane, 2500), fr(616), pan=0.0)
sfx(whoosh(fr(18), 300, 9000, 0.6, 0.85), fr(686))

# 07 今天
sfx(click(0.6), fr(724))
sfx(glide(57, 76, fr(30), 0.9), fr(726), pan=-0.4)  # 速度往上走
sfx(whoosh(0.2, 1500, 8000, 0.4, 0.4), fr(758), pan=-0.4)  # 冲刺
sfx(click(1.0), fr(758), pan=-0.4)
sfx(thud(0.4, 120, 60, 0.3), fr(780), pan=0.5)
# 滚动的棘轮：每滚 40px 一声，越快越密
d_acc = 0.0
last = 0.0
for f_ in np.arange(786, 814, 0.1):
    v = 3.2 * (f_ - 786) if f_ < 800 else max(0.0, 44.8 - 3.2 * (f_ - 800))
    d_acc += v * 0.1
    if d_acc - last >= 40:
        last = d_acc
        sfx(click(0.35, 5000), fr(f_), pan=0.5)
for i in range(18):
    sfx(click(0.3, 8000), fr(816 + i * 1.9 + (i % 3) * 0.4), pan=0.4)  # 代码打出来

# 规则：每张卡撞进来一声铁砧，音高 A C D E G
for i, m in enumerate([69, 72, 74, 76, 79, 81]):
    stop = 872 + 50 * i
    contact = stop - 28 + 9
    sfx(anvil(m, 0.8), fr(contact), send=0.35)
    sfx(thud(0.5, 120, 50), fr(contact))
    sfx(whoosh(fr(26), 400, 7000, 0.35, 0.3), fr(stop - 28), pan=-0.4)
sfx(inhale(fr(8), 0.5), fr(1148))
sfx(rev_up(fr(26), 60, 520, 0.9), fr(1156), pan=0.4, send=0.2)


def reverb(x, seed, dec=0.6, length=2.4):
    t = tt(length)
    ir = np.random.default_rng(seed).standard_normal(len(t)) * np.exp(-t / dec)
    ir = fft_filter(ir, hi=6500)
    ir[: int(0.02 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + len(ir)
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


mix = MUS + SFX * 0.7  # 音效让出背景音乐
mix[0] += reverb(SEND[0], 1) * 0.45
mix[1] += reverb(SEND[1], 2) * 0.45
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
