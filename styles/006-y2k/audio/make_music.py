"""
Design Style · 风格 006 · 千禧未来主义 Y2K —— 配乐与音效（纯代码合成，无外部音源）

一首 2000 年前后“千禧电子流行”味道的 18 秒小曲：120 BPM（1 拍 = 30 帧 = 0.5 秒）· F 大调 · 36 拍正好 9 小节
四踩底鼓 + 2、4 拍拍手 + 反拍开镲 + 十六分沙锤；反拍“嘟嘟”的锯齿贝斯（跟着底鼓泵）；
七把失谐锯齿叠成的 Supersaw 和弦铺底；FM 合成的“玻璃钟”主旋律（DX7 那一路的 1:3.5 频比）；
开场是 BIOS 自检的“哔”+ 调制解调器的小碎音，铬字落地是一个明亮的大和弦。
音效全是“千禧”的：泡泡 = 一声“啵”、果冻球 = 弹两下、星星 = 玻璃“叮”、地平线 = 一阵风、
像素 = 8-bit 小琶音、故障 = 数字卡顿、零点 = 烟花 + 钟、玻璃 = 一声“嗡”的泛音、SYSTEM READY = 上行琶音。
和弦（每章 4 拍）：F（00 开场）| Dm（01 铬）| B♭（02 果冻）| C（03 Aqua）| F（04 表情）| Dm → 静（05 千年虫，零点前收住）
      | B♭（06 今天）| Gm → C（五条规则）| F（片尾）
所有时间点与 video/*.tsx 的关键帧对齐（帧 / 60 = 秒，与 video/timeline.ts 一致）。

用法：python3 styles/006-y2k/audio/make_music.py
输出：public/006-y2k/music.wav（响度 -14 LUFS，真峰值 < -1 dBTP）
"""
import json
import os
import shutil
import subprocess
import wave

import numpy as np

SR = 48000
DUR = 18.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(2000)

MUS = np.zeros((2, N))  # 鼓、重音
PUMP = np.zeros((2, N))  # 跟着底鼓“泵”的：Pad、贝斯
LEAD = np.zeros((2, N))  # 主旋律（带乒乓延迟）
SFX = np.zeros((2, N))
SEND = np.zeros((2, N))


def fr(frame):
    return frame / 60.0


def tt(d):
    return np.arange(int(d * SR)) / SR


def place(sig, t, gain=1.0, pan=0.0, send=0.0, bus=None):
    bus = MUS if bus is None else bus
    i = int(round(t * SR))
    if i >= N or i < 0 or len(sig) == 0:
        return
    sig = sig[: N - i]
    gl = np.cos((pan + 1) * np.pi / 4) * gain
    gr = np.sin((pan + 1) * np.pi / 4) * gain
    bus[0, i: i + len(sig)] += sig * gl
    bus[1, i: i + len(sig)] += sig * gr
    if send:
        SEND[0, i: i + len(sig)] += sig * gl * send
        SEND[1, i: i + len(sig)] += sig * gr * send


def sfx(sig, t, gain=1.0, pan=0.0, send=0.3):
    place(sig, t, gain, pan, send, SFX)


def fftf(x, resp):
    """频域滤波（静态）：resp(freq) → 增益"""
    n = 1 << (len(x) - 1).bit_length()
    X = np.fft.rfft(x, n)
    X *= resp(np.fft.rfftfreq(n, 1 / SR))
    return np.fft.irfft(X, n)[: len(x)]


def lp(x, fc, order=2):
    return fftf(x, lambda f: 1 / np.sqrt(1 + (f / fc) ** (2 * order)))


def hp(x, fc, order=2):
    return fftf(x, lambda f: (f / fc) ** order / np.sqrt(1 + (f / fc) ** (2 * order)))


def bp(x, fc, q=2.0):
    return fftf(x, lambda f: 1 / (1 + q * q * (f / fc - fc / np.maximum(f, 1)) ** 2) ** 0.5)


def noise(d):
    return rng.standard_normal(int(d * SR))


def env(d, a=0.005, r=None, dec=None):
    t = tt(d)
    e = np.minimum(1, t / max(a, 1e-4))
    if dec is not None:
        e *= np.exp(-t / dec)
    if r:
        e *= np.clip((d - t) / r, 0, 1)
    return e


def note(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def polyblep_saw(freq, d, phase0=0.0):
    t = tt(d)
    dt = freq / SR
    ph = (phase0 + np.cumsum(np.full(len(t), dt))) % 1.0
    s = 2 * ph - 1
    m1 = ph < dt
    x = ph[m1] / dt
    s[m1] -= x + x - x * x - 1
    m2 = ph > 1 - dt
    x = (ph[m2] - 1) / dt
    s[m2] -= x * x + x + x + 1
    return s


def supersaw(notes, d, det=0.18):
    out = np.zeros((2, int(d * SR)))
    for n in notes:
        for k in range(7):
            c = (k - 3) / 3
            f = note(n) * 2 ** (det * c / 12)
            s = polyblep_saw(f, d, rng.random())
            pan = c * 0.8
            out[0] += s * np.cos((pan + 1) * np.pi / 4)
            out[1] += s * np.sin((pan + 1) * np.pi / 4)
    return out / (len(notes) * 7) ** 0.5


def fm_bell(f, d, ratio=3.5, idx=2.2, dec=0.9):
    t = tt(d)
    ie = idx * np.exp(-t / (dec * 0.35))
    s = np.sin(2 * np.pi * f * t + ie * np.sin(2 * np.pi * f * ratio * t))
    s += 0.35 * np.sin(2 * np.pi * f * 2 * t + 0.6 * ie * np.sin(2 * np.pi * f * 7 * t)) * np.exp(-t / (dec * 0.3))
    return s * env(d, 0.002, 0.05, dec)


def kick(d=0.45):
    t = tt(d)
    f = 46 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t / 0.22)
    s += 0.5 * hp(noise(d), 2500) * np.exp(-t / 0.004)
    return np.tanh(s * 1.6)


def clap(d=0.35):
    n = bp(noise(d), 1300, 1.4)
    t = tt(d)
    e = np.zeros_like(t)
    for k, o in enumerate([0, 0.011, 0.022]):
        e += (t >= o) * np.exp(-np.maximum(t - o, 0) / (0.006 if k < 2 else 0.11))
    return n * e * 0.8


def hat(d=0.06, open_=False):
    n = hp(noise(d), 7500, 3)
    return n * np.exp(-tt(d) / (0.09 if open_ else 0.014))


def shaker(d=0.08):
    return hp(noise(d), 5500, 2) * env(d, 0.012, None, 0.025)


# ───────────── 和弦与时间（拍） ─────────────
CH = {  # 每拍的和弦（根音 MIDI + 三和弦）
    'F': [53, [65, 69, 72, 77]], 'Dm': [50, [62, 65, 69, 74]], 'Bb': [46, [62, 65, 70, 74]],
    'C': [48, [64, 67, 72, 76]], 'Gm': [43, [62, 67, 70, 74]],
}
PLAN = ['F'] * 4 + ['Dm'] * 4 + ['Bb'] * 4 + ['C'] * 4 + ['F'] * 4 + ['Dm'] * 4 + ['Bb'] * 4 + ['Gm'] * 2 + ['C'] * 2 + ['F'] * 4
# 05 千年虫：第 22、23 拍（23:59:59）鼓和贝斯收住，只剩时钟滴答；第 23 拍（零点，f690）一起回来


def groove(b):
    return not (b < 1 or 22 <= b < 23)


# Pad：每章一个和弦，Supersaw，低通 5k
for b0 in range(0, 36, 2):
    c = PLAN[b0]
    pad = supersaw(CH[c][1], 2 * BEAT + 0.25)
    e = env(pad.shape[1] / SR, 0.03, 0.2)
    g = 0.16 if b0 >= 4 else 0.09
    if 20 <= b0 < 23:
        g *= 0.55
    for ch in range(2):
        place(lp(pad[ch] * e, 5200 if b0 >= 4 else 2400), b0 * BEAT, g, -1 if ch == 0 else 1, 0.35, PUMP)

# 贝斯：反拍八分音符（“嘟—嘟—”），锯齿 + 正弦
for b in range(1, 36):
    if not groove(b):
        continue
    r = CH[PLAN[b]][0]
    for half in (0.5,):
        d = 0.22
        s = lp(polyblep_saw(note(r), d), 900) * 0.6 + np.sin(2 * np.pi * note(r) * tt(d)) * 0.7
        place(s * env(d, 0.004, 0.05), (b + half) * BEAT, 0.42, 0, 0, PUMP)

# 鼓
for b in range(0, 36):
    t = b * BEAT
    if b >= 1 and groove(b) and b < 35:
        place(kick(), t, 0.9)
    if b >= 4 and groove(b) and b % 2 == 1 and b < 35:
        place(clap(), t, 0.42, 0.05, 0.25)
    if b >= 2 and groove(b) and b < 35:
        place(hat(0.25, True), t + 0.25, 0.16, 0.25, 0.1)
    if b >= 4 and groove(b) and b < 35:
        for s in range(4):
            place(shaker(), t + s * BEAT / 4 + (0.012 if s % 2 else 0), 0.11 if s % 2 else 0.07, -0.3, 0)

# 侧链：Pad / 贝斯跟着底鼓往下“泵”
duck = np.ones(N)
for b in range(1, 35):
    if not groove(b):
        continue
    i = int(b * BEAT * SR)
    L = int(0.32 * SR)
    duck[i: i + L] = np.minimum(duck[i: i + L], 1 - 0.7 * np.exp(-np.arange(min(L, N - i)) / SR / 0.09))
PUMP *= duck

# 主旋律：FM 玻璃钟，八分 / 十六分；每章换一个乐句（F 大调五声为主）
MEL = {  # 拍号: [(相对拍, MIDI, 时值拍)]
    4: [(0, 81, .5), (.5, 79, .5), (1, 77, .5), (1.5, 81, .5), (2, 84, 1), (3, 81, .5), (3.5, 79, .5)],
    8: [(0, 77, .5), (.5, 79, .5), (1, 81, 1), (2, 82, .5), (2.5, 81, .5), (3, 77, 1)],
    12: [(0, 79, .5), (.5, 84, .5), (1, 83, .25), (1.25, 84, .25), (1.5, 88, 1), (3, 86, .5), (3.5, 84, .5)],
    16: [(0, 84, .25), (.25, 81, .25), (.5, 77, .25), (.75, 81, .25), (1, 84, .5), (1.5, 89, 1), (3, 88, .5), (3.5, 84, .5)],
    20: [(0, 81, .5), (.5, 77, .5), (1, 74, 1)],
    24: [(0, 82, .5), (.5, 81, .5), (1, 77, .5), (1.5, 74, .5), (2, 77, .5), (2.5, 81, .5), (3, 86, 1)],
    28: [(0, 79, .5), (.5, 82, .5), (1, 86, .5), (1.5, 82, .5), (2, 84, .5), (2.5, 88, .5), (3, 91, 1)],
}
for b0, ph in MEL.items():
    for rb, n, d in ph:
        s = fm_bell(note(n), d * BEAT + 0.6, dec=0.45)
        place(s, (b0 + rb) * BEAT, 0.2, 0.15, 0.3, LEAD)
# 乒乓延迟（附点八分）
dl = np.zeros_like(LEAD)
D = int(0.375 * SR)
mono = lp(LEAD.sum(axis=0) * 0.5, 3500)
for k, g in enumerate([0.42, 0.26, 0.15]):  # 左、右、左……来回弹
    sh = D * (k + 1)
    dl[k % 2, sh:] += mono[: N - sh] * g

# ───────────── 音效（帧 → 秒） ─────────────
def blip(f, d=0.06, square=True):
    t = tt(d)
    s = np.sign(np.sin(2 * np.pi * f * t)) if square else np.sin(2 * np.pi * f * t)
    return s * env(d, 0.001, 0.01)


def bloop(f0=300, f1=1200, d=0.12):
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.002, 0.03, d * 0.6)


def ting(f=2400, d=1.2):
    t = tt(d)
    s = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / (dd)) for m, a, dd in [(1, 1, .5), (2.76, .5, .25), (5.4, .3, .12), (8.9, .15, .06)])
    return s * env(d, 0.001)


def whoosh(d=0.5, f0=400, f1=4000):
    n = noise(d)
    out = np.zeros_like(n)
    seg = int(0.02 * SR)
    for i in range(0, len(n), seg):
        fc = f0 * (f1 / f0) ** (i / len(n))
        out[i: i + seg] = bp(n[i: i + seg + 256], fc, 1.2)[: len(n[i: i + seg])]
    return out * np.sin(np.pi * tt(d) / d) ** 2


def boing(t0, n=3):
    for k in range(n):
        sfx(bloop(160 * (1.3 ** -k), 420 * (1.2 ** -k), 0.09), t0 + k * 0.17 * (0.8 ** k), 0.25 * (0.6 ** k), -0.2)


# 00 开场：BIOS 哔 + 调制解调器碎音 + 铬字落地的大和弦
sfx(blip(1000, 0.12, False) * 0.6, fr(2), 0.35, 0, 0.1)
for i in range(18):
    sfx(blip(600 + 1400 * rng.random(), 0.025), fr(6) + i * 0.028, 0.06, rng.uniform(-.5, .5), 0.05)
sfx(whoosh(0.5, 300, 6000), fr(30) - 0.48, 0.25, 0, 0.2)
hit = supersaw([53, 65, 69, 72, 77, 81], 2.2, 0.3)
for ch in range(2):
    place(lp(hit[ch] * env(2.2, 0.002, 0.4, 0.9), 7000), fr(30), 0.34, -1 if ch == 0 else 1, 0.6)
place(fm_bell(note(89), 2.0, 3.5, 3, 1.2), fr(30), 0.22, 0.3, 0.6, LEAD)
sfx(ting(2600), fr(40), 0.16, -0.3)
sfx(ting(3100), fr(46), 0.14, 0.5)
sfx(bloop(220, 900, 0.18), fr(44), 0.28, 0.6)  # 大泡泡鼓起来
boing(fr(50) + 0.27)
boing(fr(62) + 0.23, 2)
for i in range(10):  # 进度条：每一格一声小“滴”
    sfx(blip(1800 + i * 60, 0.02), fr(60 + i * 5), 0.05, 0.6, 0.05)
sfx(blip(1568, 0.08, False), fr(100), 0.18, 0.6)
sfx(blip(2093, 0.12, False), fr(104), 0.18, 0.6)
# 转场 → 01：泡泡涨破
sfx(bloop(500, 1800, 0.2), fr(106), 0.3, 0.5)
sfx(hp(noise(0.08), 3000) * env(0.08, 0.001, None, 0.02), fr(120), 0.22, 0.4)
# 01 铬：环境贴图刷上去（从上往下）+ 扫光
sfx(whoosh(0.4, 2000, 300), fr(150), 0.22, 0, 0.2)
sfx(ting(3400, 1.4), fr(168), 0.16, 0.2)
sfx(whoosh(0.45, 500, 1800), fr(186), 0.12, -0.3, 0.2)
sfx(whoosh(0.4, 1800, 500), fr(212), 0.12, 0.3, 0.2)
# 转场 → 02：地平线往下刷
sfx(whoosh(0.3, 3000, 500), fr(226), 0.24, 0, 0.2)
# 02 果冻：大球“啵”出来；五种口味依次落地
sfx(bloop(140, 600, 0.22), fr(236), 0.32, 0.3)
sfx(bloop(900, 300, 0.16), fr(294), 0.2, 0)
for i in range(5):
    boing(fr(294 + 8 + i * 5 + 15), 2)
# 转场 → 03：果冻球放大
sfx(bloop(200, 1500, 0.25), fr(346), 0.3, 0.6)
# 03 Aqua：窗口从程序坞吸出来 + 默认按钮 + 勾选 + 放大镜
sfx(whoosh(0.35, 600, 3000), fr(360), 0.2, 0.2, 0.2)
for i in range(7):
    sfx(bloop(500 + i * 90, 900 + i * 120, 0.05), fr(366 + i * 3), 0.08, -0.6 + i * 0.2)
sfx(ting(2200), fr(386), 0.1, -0.5)
sfx(blip(2400, 0.03), fr(430), 0.12, 0.3)
sfx(blip(2600, 0.03), fr(444), 0.12, 0.35)
boing(fr(400) + 0.27, 2)
sfx(whoosh(0.7, 800, 2400) * 0.6, fr(420), 0.12, 0, 0.1)
# 转场 → 04：像素方块 = 8-bit 琶音
for i in range(8):
    sfx(blip(note(77 + [0, 4, 7, 12, 16, 19, 24, 28][i]), 0.03), fr(466) + i * 0.03, 0.08, 0.4)
# 04 表情：一个像素一声（取样），计数到 176
for q in range(0, 64, 3):
    sfx(blip(note(84 + (q % 12)), 0.018), fr(488) + q / 2.2 / 60, 0.045, 0.3, 0.05)
sfx(ting(2800), fr(560), 0.14, -0.4)
for i in range(6):
    sfx(bloop(600, 1300, 0.05), fr(552 + i * 4), 0.08, 0.2 + i * 0.1)
# 转场 → 05：数字故障（卡顿）
g = np.zeros(int(0.24 * SR))
chunk = np.sign(np.sin(2 * np.pi * 220 * tt(0.03))) * hp(noise(0.03), 1000)
for k in range(8):
    i = int(k * 0.03 * SR)
    g[i: i + len(chunk)] += chunk * (0.5 + 0.5 * rng.random())
sfx(g, fr(586), 0.12, 0, 0.05)
# 05 千年虫：滴答 ×3，零点 = 钟 + 烟花 + 大和弦
for b in (600, 630, 660):
    sfx(bp(noise(0.03), 3200, 4) * env(0.03, 0.001, None, 0.006), fr(b), 0.6, -0.2, 0.15)
    sfx(bp(noise(0.03), 2100, 4) * env(0.03, 0.001, None, 0.006), fr(b + 15), 0.4, 0.2, 0.15)
sfx(whoosh(0.5, 300, 8000), fr(690) - 0.5, 0.3, 0, 0.3)
hit2 = supersaw([46, 58, 62, 65, 70, 74, 77], 2.0, 0.3)
for ch in range(2):
    place(lp(hit2[ch] * env(2.0, 0.002, 0.4, 0.8), 8000), fr(690), 0.32, -1 if ch == 0 else 1, 0.6)
for k, n in enumerate([82, 86, 89, 94]):
    place(fm_bell(note(n), 1.6, 3.5, 2.6, 0.8), fr(690) + k * 0.06, 0.12, -0.4 + k * 0.25, 0.6, LEAD)
for i in range(6):
    sfx(ting(2000 + 400 * i, 0.8), fr(690 + i) + 0.04 * i, 0.07, -0.6 + i * 0.24)
sfx(hp(noise(1.6), 6000, 2) * env(1.6, 0.01, 0.3, 0.5), fr(690), 0.08, 0, 0.4)
sfx(bloop(1200, 400, 0.12), fr(704), 0.12, 0.2)
# 转场 → 06：玻璃滑过
sfx(whoosh(0.3, 1200, 5000), fr(706), 0.2, -0.4, 0.3)
# 06 今天：玻璃“嗡”——一个干净的泛音簇
t = tt(1.6)
glass = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(1318.5, .5), (1975.5, .3), (2637, .2), (3951, .1)]) * env(1.6, 0.25, 0.6)
sfx(glass, fr(724), 0.12, 0.3, 0.5)
sfx(ting(3600, 1.0), fr(760), 0.1, 0.5)
# 转场 → 规则：泡泡
sfx(bloop(400, 1600, 0.2), fr(826), 0.26, 0)
# 规则：五张卡片，五声上行
for i in range(5):
    sfx(fm_bell(note([77, 81, 84, 88, 89][i]), 0.5, 1.0, 1.2, 0.25), fr(850 + i * 16), 0.16, -0.6 + i * 0.3, 0.3)
    sfx(bloop(500, 1100, 0.04), fr(850 + i * 16), 0.06, -0.6 + i * 0.3)
# 片尾：像素转场 + SYSTEM READY 上行琶音 + 最后一声钟
for i in range(6):
    sfx(blip(note(72 + [0, 5, 9, 12, 17, 21][i]), 0.03), fr(946) + i * 0.03, 0.07, 0.3)
boing(fr(970) + 0.27, 2)
for k, n in enumerate([65, 69, 72, 77, 81, 84, 89]):
    place(fm_bell(note(n), 1.4, 3.5, 2.2, 0.6), fr(1004) + k * 0.05, 0.14, -0.6 + k * 0.2, 0.5, LEAD)
sfx(ting(3000, 1.6), fr(1004), 0.12, 0.4)
end = supersaw([41, 53, 65, 69, 72, 77], 1.6, 0.25)
for ch in range(2):
    place(lp(end[ch] * env(1.6, 0.004, 0.6, 0.9), 6000), fr(1050), 0.26, -1 if ch == 0 else 1, 0.5)


def reverb(x, seed, dec=0.7, length=2.6):
    t = tt(length)
    ir = np.random.default_rng(seed).standard_normal(len(t)) * np.exp(-t / dec)
    ir = lp(ir, 7000)
    ir[: int(0.02 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + len(ir)
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


mix = MUS + PUMP + LEAD + dl + SFX
mix[0] += reverb(SEND[0], 1) * 0.5
mix[1] += reverb(SEND[1], 2) * 0.5
for ch in range(2):  # 母带高通 ~30Hz
    mix[ch] = hp(mix[ch], 30)
mix = mix.T
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.3) / np.tanh(1.3)
fade = np.ones(N)
f0 = int(fr(1056) * SR)
fade[f0:] = np.linspace(1, 0, N - f0) ** 2
mix *= fade[:, None]

root = os.path.dirname(os.path.abspath(__file__))
out_dir = os.path.normpath(os.path.join(root, '..', '..', '..', 'public', '006-y2k'))
os.makedirs(out_dir, exist_ok=True)
final = os.path.join(out_dir, 'music.wav')


def write(path, y):
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes())


def loudness(y):
    """用 ffmpeg 的 loudnorm 测一遍整体响度（LUFS）"""
    tmp = final + '.measure.wav'
    write(tmp, y)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    os.remove(tmp)
    js = r.stderr[r.stderr.rindex('{'): r.stderr.rindex('}') + 1]
    return float(json.loads(js)['input_i'])


def limit(y, ceil=0.84, win=0.008):
    """简单的前瞻限幅：块内最小增益 → 盒式平滑，保证不过 ceil"""
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
    # 测响度 → 线性增益 → 限幅，迭代三次（只做线性增益，不做动态压缩）
    y = mix * 0.5
    for _ in range(3):
        i = loudness(y)
        y = limit(y * 10 ** ((-14.0 - i) / 20))
    print('loudness %.2f LUFS' % loudness(y))
    write(final, y)
else:
    write(final, mix * 0.89)
print('wrote', final)
