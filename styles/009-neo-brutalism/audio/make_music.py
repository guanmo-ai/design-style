"""
Design Style · 风格 009 · 新粗野主义 Neo-Brutalism —— 配乐与音效（纯代码合成，无外部音源）

120 BPM（1 拍 = 0.5 秒 = 30 帧）· E 小调 → G 大调
和弦：开场只有按键、代码条与重击 | Em（2–4s）| C（4–6s）| G（6–8s）| D（8–10s）| C D Em C D（每拍一个，10–12.5s）| G（12.5s 起）
音色：方波贝斯（只留奇次谐波，像一块没打磨的混凝土）、909 式底鼓 + 拍手、反拍的方波和弦“戳”、木琴旋律。
  0–2s      开场：f10 海报被按下 · f16 炸开 · 四枚代码条一拍一枚：f30 黑框“盖章”· f45 阴影“啵”· f60 刷黄 · f75 换字体重击 · f96 按下 · 上升进 2s
  2–4s      01 黑框：六声盖章，音高沿五声音阶往上
  4–6s      02 硬影：拉滑块的拉链声 → f272 咔嗒 → 三次“嘣”（8 / 24 / 14px）→ 三张卡片砸地
  6–8s      03 按下：筹码、条目、“记一笔”三次按键 · 新条目弹出 · 余额跳字 · 收银“叮”· 大按钮按两下
  8–10s     04 来历：混凝土落地 · 翻牌哗啦 · 二十个色块依次弹出
  10–12.5s  五个词：每拍一张卡片砸下来，和弦重音 + 旋律往上爬
  12.5–15s  片尾：卡片掉下去；NEO / BRUTAL / ISM 半拍一块砸回来；f870 全部按下——音乐断一下——f880 弹回 G 大和弦
所有时间点与 video/*.tsx 的关键帧对齐（帧 / 60 = 秒）。

用法：python3 styles/009-neo-brutalism/audio/make_music.py
输出：public/009-neo-brutalism/music.wav（响度 −14 LUFS，真峰值 < −1 dBTP）
"""
import json
import os
import shutil
import subprocess
import wave

import numpy as np

SR = 48000
DUR = 15.0
NV = int(SR * DUR)  # 成片长度
N = int(SR * (DUR + 1.5))  # 多算 1.5 秒余音，最后折回开头：循环播放时首尾无缝
rng = np.random.default_rng(2021)

MUS = np.zeros((2, N))
SFX = np.zeros((2, N))
SEND = np.zeros((2, N))
PUMP = np.zeros((2, N))
LEAD = np.zeros((2, N))


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


def sfx(sig, t, gain=1.0, pan=0.0, send=0.2):
    place(sig, t, gain, pan, send, SFX)


def tt(d):
    return np.arange(int(d * SR)) / SR


def onepole_lp(x, cutoff):
    cutoff = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for n in range(len(x)):
        acc = (1 - a[n]) * x[n] + a[n] * acc
        y[n] = acc
    return y


def hp(x, cutoff):
    return x - onepole_lp(x, cutoff)


def noise(d):
    return rng.standard_normal(int(d * SR))


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def glide(f):
    return 2 * np.pi * np.cumsum(f) / SR


def norm(x):
    return x / (np.abs(x).max() + 1e-9)


# ───────── 鼓 ─────────

def kick(level=1.0):
    """909 式：短促的音高下滑 + 一点点咔"""
    t = tt(0.42)
    f = 48 + 150 * np.exp(-t / 0.028)
    body = np.sin(glide(f)) * np.exp(-t / 0.17)
    click_ = hp(noise(0.42), 2500) * np.exp(-t / 0.0025) * 0.35
    return np.tanh((body + click_) * 1.8) * level


def clap(level=1.0):
    t = tt(0.35)
    n = hp(onepole_lp(noise(0.35), 7000), 900)
    env = np.zeros_like(t)
    for k, off in enumerate([0, 0.009, 0.018, 0.027]):
        env += np.where(t >= off, np.exp(-(t - off) / (0.005 if k < 3 else 0.1)), 0)
    return n * env * 0.7 * level


def hat(level=1.0, dec=0.025):
    t = tt(0.14)
    return hp(hp(noise(0.14), 7500), 7500) * np.minimum(1, t / 0.001) * np.exp(-t / dec) * level


def snare(level=1.0):
    t = tt(0.25)
    body = np.sin(glide(200 + 80 * np.exp(-t / 0.01))) * np.exp(-t / 0.05)
    n = hp(onepole_lp(noise(0.25), 9000), 1500) * np.exp(-t / 0.06)
    return np.tanh((0.6 * body + 0.9 * n) * 1.3) * level


def crash(d=2.0, level=1.0):
    t = tt(d)
    n = hp(hp(noise(d), 5000), 3000)
    env = np.minimum(1, t / 0.002) * (0.55 * np.exp(-t / 0.1) + 0.45 * np.exp(-t / 0.7))
    return norm(n) * env * level


# ───────── 音效：都是“实心”的东西 ─────────

def stamp(level=1.0, f0=220, f1=70):
    """盖章：橡胶砸在桌上——短促的低频 + 一记木头声"""
    t = tt(0.3)
    f = f1 + (f0 - f1) * np.exp(-t / 0.018)
    body = np.sin(glide(f)) * np.exp(-t / 0.06)
    wood = onepole_lp(hp(noise(0.3), 700), 3500) * np.exp(-t / 0.008) * 0.6
    return np.tanh((body + wood) * 2.0) * level


def boom(level=1.0):
    t = tt(0.9)
    f = 36 + 100 * np.exp(-t / 0.045)
    body = np.sin(glide(f)) * np.exp(-t / 0.32)
    air = onepole_lp(noise(0.9), 800) * np.exp(-t / 0.07) * 0.45
    return np.tanh((body + air) * 1.7) * level


def keyclick(level=1.0, pitch=1.0):
    """机械键盘：触底的“嗒” + 回弹的“咔”"""
    t = tt(0.06)
    down = hp(noise(0.06), 1800 * pitch) * np.exp(-t / 0.0018)
    tone = np.sin(2 * np.pi * 1350 * pitch * t) * np.exp(-t / 0.004) * 0.5
    up = np.where(t > 0.022, hp(noise(0.06), 3500) * np.exp(-(t - 0.022) / 0.0012) * 0.35, 0)
    return (down + tone + up) * level


def click(level=1.0, deep=False):
    """按下按钮：一声实的“咔嗒”，deep 时多一点低频"""
    t = tt(0.12)
    y = hp(noise(0.12), 2500) * np.exp(-t / 0.0022) + 0.5 * np.sin(2 * np.pi * (900 if deep else 1700) * t) * np.exp(-t / 0.008)
    if deep:
        y += np.sin(glide(140 + 120 * np.exp(-t / 0.01))) * np.exp(-t / 0.04) * 0.9
    return np.tanh(y * 1.4) * level


def boing(f0, level=1.0, up=True, d=0.32):
    """阴影弹出来：一个往上（或往下）弯的正弦，带一点颤"""
    t = tt(d)
    bend = (1.9 if up else 0.55)
    f = f0 * (1 + (bend - 1) * (1 - np.exp(-t / 0.04))) * (1 + 0.03 * np.sin(2 * np.pi * 22 * t) * np.exp(-t / 0.1))
    y = np.sin(glide(f)) + 0.25 * np.sin(2 * glide(f))
    return y * np.minimum(1, t / 0.002) * np.exp(-t / (d * 0.35)) * level


def pop(freq, level=1.0):
    t = tt(0.16)
    f = freq * (1 + 1.2 * np.exp(-t / 0.006))
    return np.sin(glide(f)) * np.exp(-t / 0.035) * np.minimum(1, t / 0.0008) * level


def marimba(freq, level=1.0, dec=0.22):
    t = tt(dec * 4)
    y = np.sin(2 * np.pi * freq * t) * np.exp(-t / dec)
    y += 0.25 * np.sin(2 * np.pi * freq * 3.93 * t) * np.exp(-t / (dec * 0.18))
    y += 0.08 * np.sin(2 * np.pi * freq * 9.2 * t) * np.exp(-t / (dec * 0.05))
    return y * np.minimum(1, t / 0.001) * level


def bell(freq, level=1.0, dec=0.8):
    t = tt(dec * 3)
    index = 2.0 * np.exp(-t / 0.1)
    y = np.sin(2 * np.pi * freq * t + index * np.sin(2 * np.pi * freq * 3.5 * t))
    return y * np.minimum(1, t / 0.002) * np.exp(-t / dec) * level


def whoosh(d=0.4, lo=300, hi=6000, level=1.0, rise=0.5):
    t = tt(d)
    x = t / d
    cut = lo + (hi - lo) * np.sin(np.pi * np.clip(x / (2 * rise), 0, 1)) ** 2
    y = onepole_lp(onepole_lp(noise(d), cut), cut)
    return norm(y) * np.sin(np.pi * x) ** 1.5 * level


def zip_(d=0.4, f0=300, f1=2400, level=1.0):
    """拉滑块：越来越快的锯齿“嗞——”"""
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d)
    ph = glide(f)
    saw = 2 * ((ph / (2 * np.pi)) % 1) - 1
    n = hp(noise(d), 2000) * 0.25
    return onepole_lp(saw * 0.5 + n, 5000) * np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.03) * level


def riser(d=0.5, level=1.0):
    t = tt(d)
    x = t / d
    n = hp(onepole_lp(noise(d), 500 + 11000 * x ** 2), 300)
    tone = np.sin(glide(220 * 2 ** (2.5 * x))) * 0.3
    return (norm(n) + tone) * x ** 2.2 * level


def cashier(level=1.0):
    """收银“叮”：两颗铃 + 抽屉的咔"""
    y = np.zeros(int(0.9 * SR))
    for k, m in enumerate((88, 93)):
        b = bell(midi(m), 0.6, 0.25)
        i = int(k * 0.07 * SR)
        y[i : i + len(b)] += b[: len(y) - i]
    c = click(0.5)
    y[: len(c)] += c
    return y * level


# ───────── 乐器 ─────────

def additive(freq, d, nh=24, kc0=12.0, kc1=2.0, kdec=0.08, att=0.003, dec=None, rel=0.04, voices=1, detune=0.0, odd=0.0, level=1.0):
    t = tt(d + rel)
    kc = kc1 + (kc0 - kc1) * np.exp(-t / kdec)
    y = np.zeros_like(t)
    for v in range(voices):
        det = 0.0 if voices == 1 else (v / (voices - 1) - 0.5) * 2 * detune
        f0 = freq * (1 + det)
        ph = 2 * np.pi * f0 * t
        p0 = rng.random() * 6.283
        for h in range(1, nh + 1):
            if f0 * h > 15000:
                break
            a = 1.0 / h * ((1 - odd) if h % 2 == 0 else 1.0)
            y += np.sin(h * (ph + p0)) * a * np.exp(-(h - 1) / kc)
    y /= voices
    env = np.minimum(1, t / att)
    if dec:
        env = env * np.exp(-t / dec)
    env = env * np.where(t < d, 1, np.exp(-(t - d) / (rel / 3)))
    return y * env * level


def square_bass(m, d, level=1.0):
    """方波贝斯：只留奇次谐波，再过一点饱和"""
    y = additive(midi(m), d, nh=21, kc0=9, kc1=3.0, kdec=0.05, odd=1.0, dec=0.5, rel=0.02)
    sub = np.sin(2 * np.pi * midi(m) * np.arange(len(y)) / SR) * 0.6
    return np.tanh((y + sub) * 1.8) * level


def stab(notes, d=0.11, level=1.0):
    """反拍的方波和弦“戳”"""
    out = None
    for m in notes:
        y = additive(midi(m), d, nh=16, kc0=7, kc1=2.5, kdec=0.03, odd=0.85, voices=2, detune=0.004, dec=0.09, rel=0.02)
        out = y if out is None else out[: len(y)] + y[: len(out)]
    return out / len(notes) * level


def pad(freqs, d, level=1.0, att=0.3, rel=0.6):
    t = tt(d + rel)
    y = np.zeros_like(t)
    for fq in freqs:
        for det in (-0.004, 0.0, 0.004):
            ph0 = rng.random() * 6.28
            for h in range(1, 9, 2):
                if fq * h > 9000:
                    break
                y += np.sin(2 * np.pi * fq * (1 + det) * h * t + ph0 * h) / h ** 1.4
    env = np.minimum(1, t / att) * np.where(t < d, 1, np.exp(-(t - d) / (rel / 4)))
    return y / (len(freqs) * 4) * env * level


KICK, CLAP, SNARE, CRASH, BOOM = kick(), clap(), snare(), crash(), boom()
CHAT, OHAT = hat(1.0, 0.02), hat(1.0, 0.07)

BEAT, S8, S16 = 30, 15, 7.5
ROOT = {'Em': 28, 'C': 24, 'G': 31, 'D': 26}
STABV = {'Em': [64, 67, 71, 76], 'C': [64, 67, 72, 76], 'G': [62, 67, 71, 74], 'D': [62, 66, 69, 74]}
PADV = {'Em': [52, 59, 64, 67], 'C': [48, 55, 64, 67], 'G': [55, 59, 62, 67], 'D': [50, 57, 62, 66]}
PROG = [(120, 'Em'), (240, 'C'), (360, 'G'), (480, 'D'), (600, 'C'), (630, 'D'), (660, 'Em'), (690, 'C'), (720, 'D'), (750, 'G')]
GROOVE_START, GROOVE_END = 120, 744
KICKS = []


def chord_at(fm):
    cur = PROG[0][1]
    for s, n in PROG:
        if fm >= s - 1e-6:
            cur = n
    return cur


def kick_at(fm, level=1.0):
    place(KICK * level, fr(fm))
    KICKS.append(fr(fm))


# ================= 开场 0–120：海报被按下、炸开 → 没写 CSS 的网页 → 四行 CSS =================
# f0 是片尾那张海报（循环播放时接着上一遍的余音）。f2 光标滑进来，f10 按下，f16 炸开
sfx(whoosh(fr(9), 800, 9000, 0.22, 0.85), fr(1), pan=0.5)
sfx(click(1.0, deep=True), fr(10), send=0.2)
kick_at(10, 1.0)
sfx(BOOM * 0.9, fr(10), send=0.35)
place(CRASH * 0.5, fr(10), send=0.35)
sfx(whoosh(fr(14), 150, 9500, 0.6, 0.35), fr(15))
sfx(hp(noise(0.35), 2500) * np.exp(-tt(0.35) / 0.06) * 0.35, fr(16), send=0.3)
for k, pn in enumerate((-0.6, 0.6, -0.2, 0.3)):
    sfx(stamp(0.25, 300 - 30 * k, 90), fr(17 + 2 * k), pan=pn, send=0.2)
# f26 露出默认网页：一个往下掉的“哔——”
sfx(boing(midi(84), 0.18, up=False, d=0.3), fr(26), send=0.2)
# 四行 CSS：代码条在拍点前 9 帧砸进来（打字声），在拍点上生效
LINES = [('border: 6px solid #000;', 30), ('box-shadow: 14px 14px 0 #000;', 45), ('background: #FFD23F;', 60), ('font: 900 125% Archivo;', 75)]
for text, fire in LINES:
    chars = [c for c in text if c != ' ']
    for i in range(len(chars)):
        fm = fire - 9 + 8 * i / len(chars)
        sfx(keyclick(0.1 + 0.04 * rng.random(), 0.85 + 0.3 * rng.random()), fr(fm), pan=0.4 + 0.1 * rng.standard_normal(), send=0.03)
    sfx(whoosh(fr(8), 900, 8000, 0.14, 0.8), fr(fire - 9), pan=0.6)
# f30 黑框：盖章
kick_at(30, 0.9)
sfx(stamp(0.9, 260, 60), fr(30), send=0.25)
place(CRASH * 0.22, fr(30), send=0.2)
# f45 阴影：啵
kick_at(45, 0.85)
sfx(boing(midi(52), 0.5), fr(45), send=0.25)
# f60 刷黄
kick_at(60, 0.85)
sfx(whoosh(fr(9), 600, 7000, 0.35, 0.6), fr(58), pan=-0.3)
place(CLAP * 0.45, fr(60), send=0.2)
# f75 换字体：整页一起变
kick_at(75, 1.0)
sfx(BOOM * 0.85, fr(75), send=0.3)
place(CRASH * 0.5, fr(75), send=0.3)
place(square_bass(40, 0.25, 0.4), fr(75))
sfx(whoosh(fr(8), 500, 6000, 0.25, 0.7), fr(76), pan=0.7)
for fm, m in ((78, 76), (82, 79), (86, 83)):
    sfx(pop(midi(m), 0.32), fr(fm), pan=(fm - 82) / 8, send=0.25)
for fm in (90, 97.5, 105, 108.75, 112.5, 116.25):
    place(CHAT * 0.1, fr(fm), pan=0.2)
# f96 按下标题 → 撑满全屏
sfx(click(0.8, deep=True), fr(96), send=0.15)
sfx(riser(fr(24), 0.45), fr(96), send=0.25)
sfx(whoosh(fr(14), 200, 9000, 0.45, 0.8), fr(104))
for k in range(4):
    place(SNARE * (0.18 + 0.08 * k), fr(105 + k * 3.75), send=0.15)

# ================= 律动 120–744 =================
for b in range(GROOVE_START // BEAT, GROOVE_END // BEAT + 1):
    fm = b * BEAT
    if fm >= GROOVE_END:
        break
    kick_at(fm, 1.0)
    words = fm >= 600
    if (fm // BEAT) % 2 == 1 or words:
        place(CLAP * (0.55 if not words else 0.62), fr(fm), send=0.18)
    for s in range(4):
        t16 = fm + s * S16
        if t16 >= GROOVE_END:
            break
        if s == 2:
            place(OHAT * 0.2, fr(t16), pan=0.25, send=0.04)
        else:
            place(CHAT * (0.12 if s == 0 else 0.08), fr(t16), pan=-0.25 if s == 1 else 0.2)
for fm, lv in ((120, 0.6), (240, 0.5), (360, 0.55), (480, 0.5), (600, 0.65)):
    place(CRASH * lv, fr(fm), send=0.3)

# 方波贝斯：八分音符，根音—八度—根音—五度
BASS_PAT = [0, 12, 0, 7, 0, 12, 10, 7]
for k in range(int((GROOVE_END - GROOVE_START) / S8)):
    fm = GROOVE_START + k * S8
    r = ROOT[chord_at(fm)] + 12
    place(square_bass(r + BASS_PAT[k % 8], 0.12, 0.3), fr(fm), bus=PUMP)

# 反拍和弦“戳”
for k in range(int((GROOVE_END - GROOVE_START) / BEAT)):
    fm = GROOVE_START + k * BEAT + S8
    if fm >= GROOVE_END:
        break
    for pan in (-0.4, 0.4):
        place(stab(STABV[chord_at(fm)], 0.1, 0.16), fr(fm), pan=pan, send=0.12, bus=PUMP)

# 木琴旋律（每章一句）
HOOK = {
    120: [(0, 76), (2, 79), (3, 76), (4, 83), (6, 81), (8, 79), (10, 76), (12, 74), (14, 76)],
    240: [(0, 76), (2, 79), (3, 76), (4, 84), (6, 83), (8, 79), (10, 76), (12, 79), (14, 84)],
    360: [(0, 83), (2, 81), (3, 79), (4, 74), (6, 79), (8, 83), (10, 86), (12, 83), (14, 79)],
    480: [(0, 81), (2, 78), (3, 74), (4, 78), (6, 81), (8, 86), (10, 85), (12, 81), (14, 78)],
}
for s, notes in HOOK.items():
    for p, m in notes:
        place(marimba(midi(m), 0.2, 0.2), fr(s + p * S16), pan=0.15, send=0.22, bus=LEAD)

# ----- 01 黑框：六声盖章，五声音阶往上 -----
for i, m in enumerate([64, 67, 69, 71, 74, 76]):
    fm = 132 + i * 15
    sfx(stamp(0.6, 240 + 20 * i, 70), fr(fm), pan=-0.3 + 0.12 * i, send=0.15)
    sfx(marimba(midi(m + 12), 0.16, 0.12), fr(fm), pan=-0.3 + 0.12 * i, send=0.3)
sfx(whoosh(fr(15), 300, 6000, 0.5, 0.7), fr(225), pan=-0.6)

# ----- 02 硬影 -----
sfx(zip_(fr(26), 220, 1800, 0.12), fr(246), pan=-0.3, send=0.1)
sfx(click(0.55), fr(272), send=0.2)
sfx(boing(midi(60), 0.42, up=True), fr(272), send=0.25)
for fm, m, up in ((285, 64, False), (300, 52, True), (315, 59, False)):
    sfx(boing(midi(m), 0.38, up=up, d=0.28), fr(fm), send=0.22)
for i, fm in enumerate((318, 326, 334)):
    sfx(stamp(0.8, 180 - 20 * i, 50), fr(fm), send=0.25)
    sfx(whoosh(fr(8), 600, 5000, 0.2, 0.8), fr(fm - 8), pan=0.5 - 0.5 * i)
# 03 从上面砸下来
sfx(whoosh(fr(14), 200, 7000, 0.55, 0.9), fr(346))
sfx(BOOM * 0.75, fr(360), send=0.3)

# ----- 03 按下 -----
sfx(click(0.55), fr(390), pan=0.35, send=0.12)
sfx(pop(midi(79), 0.22), fr(392), pan=0.35, send=0.2)
sfx(click(0.5), fr(405), pan=0.35, send=0.12)
sfx(click(0.85, deep=True), fr(420), pan=0.35, send=0.15)
sfx(click(0.3), fr(430), pan=0.35)
sfx(pop(midi(84), 0.35), fr(432), pan=0.35, send=0.3)
sfx(marimba(midi(88), 0.18, 0.15), fr(433), pan=0.35, send=0.3)
for k in range(6):
    sfx(keyclick(0.08, 1.4 + 0.08 * k), fr(434 + k * 1.8), pan=0.3)
sfx(cashier(0.32), fr(444), pan=0.3, send=0.3)
sfx(click(0.9, deep=True), fr(450), pan=-0.4, send=0.15)
sfx(click(0.9, deep=True), fr(465), pan=-0.4, send=0.15)
sfx(whoosh(fr(14), 300, 7000, 0.5, 0.8), fr(466), pan=0.0)

# ----- 04 来历 -----
sfx(BOOM * 0.7, fr(480), send=0.3)
sfx(onepole_lp(noise(0.5), 600) * np.exp(-tt(0.5) / 0.12) * 0.4, fr(480), send=0.2)
for n in range(20):
    c, r = n % 5, n // 5
    d = (c + r) * 2
    sfx(keyclick(0.1, 0.7 + 0.04 * n), fr(520 + d + 4), pan=-0.5 + c * 0.25, send=0.05)
PENTA = [76, 79, 81, 83, 86, 88, 91]
for n in range(20):
    c, r = n % 5, n // 5
    d = (c + r) * 2
    sfx(pop(midi(PENTA[(c + r) % 7] - 12), 0.12), fr(556 + d), pan=-0.5 + c * 0.25, send=0.2)

# ================= 五个词 600–744 =================
CLIMB = [(600, 79), (630, 81), (660, 83), (690, 84), (720, 86)]
for fm, m in CLIMB:
    n = chord_at(fm)
    sfx(whoosh(fr(12), 500, 8000, 0.3, 0.85), fr(fm - 12))
    sfx(stamp(0.75, 200, 55), fr(fm), send=0.2)
    for pan in (-0.5, 0.5):
        place(stab([v + 12 for v in STABV[n]], 0.2, 0.22), fr(fm), pan=pan, send=0.3)
    place(marimba(midi(m), 0.32, 0.3), fr(fm), send=0.3, bus=LEAD)
    sfx(bell(midi(m + 12), 0.08, 0.4), fr(fm), pan=0.2, send=0.4)
for k in range(8):
    place(SNARE * (0.14 + 0.04 * k), fr(728 + k * 1.9), send=0.15)

# ================= 片尾 744–900 =================
sfx(whoosh(fr(18), 150, 5000, 0.5, 0.6), fr(744))
END_HITS = [(756, 43, 0.9), (771, 47, 0.95), (786, 50, 1.0)]
for fm, m, lv in END_HITS:
    kick_at(fm, lv)
    sfx(stamp(0.85 * lv, 220, 55), fr(fm), send=0.25)
    place(square_bass(m, 0.3, 0.45), fr(fm))
    place(CRASH * 0.35 * lv, fr(fm), send=0.3)
    for pan in (-0.5, 0.5):
        place(stab([67 + (m - 43), 71 + (m - 43), 74 + (m - 43)], 0.16, 0.18), fr(fm), pan=pan, send=0.3)
sfx(pop(midi(83), 0.3), fr(795), send=0.25)
sfx(zip_(fr(12), 400, 2600, 0.12), fr(810), pan=0.6)
sfx(stamp(0.45, 300, 90), fr(816), pan=0.6, send=0.2)
sfx(whoosh(fr(14), 300, 5000, 0.3, 0.6), fr(826))
# G 大和弦铺底：f870 按下时断开，f880 弹回来
for pan in (-0.5, 0.5):
    place(pad([midi(m) for m in [43, 55, 59, 62, 67]], fr(870 - 790), 0.5, att=0.4, rel=0.06), fr(790), pan=pan, send=0.35)
sfx(click(1.0, deep=True), fr(870), send=0.2)
kick_at(880, 1.0)
sfx(BOOM * 0.9, fr(880), send=0.4)
place(CRASH * 0.6, fr(880), send=0.45)
for pan in (-0.5, 0.5):
    place(stab([55, 59, 62, 67, 71, 74, 79], 0.6, 0.3), fr(880), pan=pan, send=0.5)
    place(pad([midi(m) for m in [43, 55, 59, 62, 67, 71]], 0.3, 0.55, att=0.005, rel=0.3), fr(880), pan=pan, send=0.5)
place(marimba(midi(91), 0.3, 0.5), fr(880), send=0.5, bus=LEAD)
sfx(bell(midi(98), 0.1, 0.9), fr(882), send=0.6)

# ================= 侧链 + 延迟 + 混响 =================
tsec = np.arange(N) / SR
ks = np.array(sorted(KICKS))
idx = np.searchsorted(ks, tsec, side='right') - 1
since = np.where(idx >= 0, tsec - ks[np.clip(idx, 0, None)], 9.0)
x = np.clip(since / 0.22, 0, 1)
duck = 1 - 0.6 * (1 - x) ** 2
duck = np.where(since < 0.004, 1 - 0.6 * since / 0.004, duck)
PUMP *= duck[None, :]

d = int(0.375 * SR)
dl = np.zeros((2, N))
src = LEAD[0] + LEAD[1]
for k in range(1, 4):
    dl[k % 2, k * d:] += src[: N - k * d] * 0.5 * 0.4 ** k
for ch in range(2):
    dl[ch] = onepole_lp(dl[ch], 4000)
    SEND[ch] += dl[ch] * 0.25


def reverb(x, seed, dec=0.45, length=2.0):
    t = tt(length)
    ir = np.random.default_rng(seed).standard_normal(len(t)) * np.exp(-t / dec)
    ir = onepole_lp(ir, 7000)
    ir[: int(0.015 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + len(ir)
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


mix = MUS + PUMP + LEAD + dl + SFX
mix[0] += reverb(SEND[0], 1) * 0.45
mix[1] += reverb(SEND[1], 2) * 0.45
for ch in range(2):
    mix[ch] = hp(hp(mix[ch], 30), 30)
# f870—880 断一下：所有声部压低（按下去的那 10 帧），音效除外
gap = np.ones(N)
g0, g1 = int(fr(871) * SR), int(fr(880) * SR)
gap[g0:g1] = 0.12
mix = (mix - SFX) * gap[None, :] + SFX
# 循环：15 秒之后的余音（最后那记 G 大和弦、混响尾巴）折回开头，和第一帧的海报接上
mix[:, : N - NV] += mix[:, NV:]
mix = mix[:, :NV]
mix = mix.T
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.3) / np.tanh(1.3)

root = os.path.dirname(os.path.abspath(__file__))
out_dir = os.path.normpath(os.path.join(root, '..', '..', '..', 'public', '009-neo-brutalism'))
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
