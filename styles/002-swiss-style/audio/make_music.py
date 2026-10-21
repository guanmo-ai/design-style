"""
Design Style · 风格 002 · 瑞士国际主义 Swiss Style —— 配乐与音效 v4（纯代码合成，无外部音源）

一首完整、不断档的 15 秒小曲：120 BPM（1 拍 = 0.5 秒 = 30 帧）· A 小调 / C 大调
和弦：Am（0–2s）| F（2–4s）| C（4–6s）| G（6–8s）| Am（8–10s）| F G Am F G（每拍一个，10–12.25s）| C（12.5s 收束）
  0–0.5s    模块波：钟表嘀嗒 + 八个三十二分音符的钟琴往上爬，声像跟着波从左扫到右 → 0.5s 红方块合成，重击
  0.6–1s    Swiss / Style 逐字母升起：每个字母一声轻拨，0.75 / 1s 两记重击；信息栏三声细响
  1.4–2s    红线扫过 12 栏，一栏一声；军鼓滚奏 + 上升音效
  2s        Drop：四拍底鼓、2/4 拍拍手、反拍镲、侧链泵感的 Pad 与贝斯、十六分琶音；主旋律（hook）进来
  2–3.7s    网格机器：每次重排前一声“唰”，拍点上“咚 + 咔”落定；段落出现时一串细响
  3.7–4s    甩镜：呼啸 → 4s 重击 + 镲；之后镜头滑过 Helvetica，一层空气声
  5.6–6s    镜头钻进字母 a：上升音效 + 军鼓滚奏 → 6s 重击（全屏红）
  6–8s      海报：落定“咚”、圆点“啵啵啵”、同心圆转起来时琶音升高八度
  8–10s     纽约地铁：线路圆标逐个“啵”、地铁报站“叮—咚”；9.7s 标识带铺满全屏
  10–12.25s 高潮：五个关键词每拍一切，每一切一记和弦重音 + 八度钟琴，旋律一路爬升
  12.25s    唯一的一口气：鼓停 0.25 秒，反向吸气 → 12.5s 红方块落地，C 大和弦收束
  12.8–13s  标语三声钟琴；最后钟表又走了几步，淡出
所有时间点与 video/opening.tsx、video/scenes.tsx 的关键帧对齐（帧 / 60 = 秒）。

用法：python3 styles/002-swiss-style/audio/make_music.py
输出：public/002-swiss-style/music.wav（响度 -14 LUFS，真峰值 < -1 dBTP）
"""
import os
import shutil
import subprocess
import wave

import numpy as np

SR = 48000
DUR = 15.0
N = int(SR * DUR)
rng = np.random.default_rng(1957)

# 总线：MUS 鼓与重音 · PUMP 侧链泵感 · LEAD 主旋律 · SFX 音效；各带混响发送
MUS = np.zeros((2, N))
SFX = np.zeros((2, N))
SEND = np.zeros((2, N))
PUMP = np.zeros((2, N))  # 跟着底鼓“泵”的：Pad、贝斯、琶音
LEAD = np.zeros((2, N))  # 主旋律（带乒乓延迟）


def fr(frame):
    return frame / 60.0


def place(sig, t, gain=1.0, pan=0.0, send=0.0, bus=None):
    bus = MUS if bus is None else bus
    i = int(t * SR)
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


# ---------------- 乐器 ----------------

def kick(level=1.0):
    t = tt(0.4)
    f = 46 + 110 * np.exp(-t / 0.03)
    body = np.sin(glide(f)) * np.exp(-t / 0.15)
    click = hp(noise(0.4), 3000) * np.exp(-t / 0.003) * 0.25
    return np.tanh((body + click) * 1.4) * level


def clap(level=1.0):
    t = tt(0.35)
    n = hp(onepole_lp(noise(0.35), 6000), 1000)
    env = np.zeros_like(t)
    for k, off in enumerate([0, 0.01, 0.02]):
        env += np.where(t >= off, np.exp(-(t - off) / (0.006 if k < 2 else 0.09)), 0)
    return n * env * 0.7 * level


def shaker(level=1.0, dec=0.035):
    t = tt(0.15)
    env = np.minimum(1, t / 0.008) * np.exp(-t / dec)
    return hp(noise(0.15), 6500) * env * level


def epiano(freq, d=0.9, level=1.0):
    """FM 电钢：明亮的起音，柔和的尾音"""
    t = tt(d + 0.4)
    index = 1.4 * np.exp(-t / 0.25) + 0.15
    y = np.sin(2 * np.pi * freq * t + index * np.sin(2 * np.pi * freq * t))
    y += 0.18 * np.sin(2 * np.pi * freq * 14.0 * t) * np.exp(-t / 0.02)  # 敲击声
    env = np.minimum(1, t / 0.003) * np.exp(-t / 0.9) * np.where(t < d, 1, np.exp(-(t - d) / 0.12))
    return y * env * level


def bell(freq, level=1.0, dec=0.8):
    """FM 钟琴（3.5 倍频调制 → 玻璃般的泛音）"""
    t = tt(dec * 3)
    index = 2.2 * np.exp(-t / 0.12)
    y = np.sin(2 * np.pi * freq * t + index * np.sin(2 * np.pi * freq * 3.5 * t))
    return y * np.minimum(1, t / 0.002) * np.exp(-t / dec) * level


def bass(freq, d=0.22, level=1.0):
    t = tt(d + 0.06)
    env = np.minimum(1, t / 0.005) * np.exp(-t / 0.3) * np.where(t < d, 1, np.exp(-(t - d) / 0.02))
    y = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(4 * np.pi * freq * t)
    return np.tanh(y * 1.2) * env * level


def pad(freqs, d, level=1.0, att=0.4, rel=0.6, bright=1.0):
    """加法合成的柔和 Pad：每个音 3 个微失谐声部 × 8 个谐波"""
    t = tt(d + rel)
    y = np.zeros_like(t)
    for fq in freqs:
        for det in (-0.004, 0.0, 0.004):
            ph0 = rng.random() * 6.28
            for h in range(1, 9):
                if fq * h > 9000:
                    break
                y += np.sin(2 * np.pi * fq * (1 + det) * h * t + ph0 * h) / h ** (1.6 / bright)
    env = np.minimum(1, t / att) * np.where(t < d, 1, np.exp(-(t - d) / (rel / 4)))
    trem = 1 + 0.06 * np.sin(2 * np.pi * 0.7 * t)
    return y / (len(freqs) * 5) * env * trem * level


def bloop(f0=380, f1=1500, level=1.0, d=0.09):
    """气泡：频率快速上滑的正弦"""
    t = tt(d + 0.05)
    f = f0 + (f1 - f0) * (1 - np.exp(-t / (d * 0.45)))
    return np.sin(glide(f)) * np.minimum(1, t / 0.002) * np.exp(-t / (d * 0.6)) * level


def tink(freq, level=1.0, dec=0.35):
    """玻璃叮：非谐泛音"""
    t = tt(dec * 3)
    y = np.zeros_like(t)
    for k, (r, a) in enumerate([(1, 1), (2.76, 0.5), (5.4, 0.25), (8.93, 0.12)]):
        y += a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t / (dec / (1 + k)))
    return y * np.minimum(1, t / 0.001) * level




def whoosh(d=0.5, lo=300, hi=6000, level=1.0, rise=0.5):
    t = tt(d)
    x = t / d
    cut = lo + (hi - lo) * np.sin(np.pi * np.clip(x / (2 * rise), 0, 1)) ** 2
    y = onepole_lp(onepole_lp(noise(d), cut), cut)
    env = np.sin(np.pi * x) ** 1.5
    return y * env / (np.abs(y).max() + 1e-9) * level


def riser(d=0.5, level=1.0):
    t = tt(d)
    x = t / d
    cut = 500 + 10000 * x ** 2
    n = hp(onepole_lp(noise(d), cut), 300)
    tone = np.sin(glide(330 * 2 ** (2 * x))) * 0.25
    return (n / (np.abs(n).max() + 1e-9) + tone) * x ** 2.2 * level




def click(level=1.0):
    t = tt(0.1)
    y = hp(noise(0.1), 3000) * np.exp(-t / 0.002) + 0.4 * np.sin(2 * np.pi * 2200 * t) * np.exp(-t / 0.006)
    return y * level


def pluck(freq, level=1.0, dec=0.18):
    """马林巴式拨弦：基音 + 4 倍 / 10 倍泛音快速衰减 → 干净的“UI 提示音”"""
    t = tt(dec * 4)
    y = np.sin(2 * np.pi * freq * t) * np.exp(-t / dec)
    y += 0.35 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-t / (dec * 0.25))
    y += 0.12 * np.sin(2 * np.pi * freq * 10 * t) * np.exp(-t / (dec * 0.08))
    return y * np.minimum(1, t / 0.0015) * level


def thock(level=1.0, f0=190, f1=70):
    """版面落定的“咚”：短促的低频正弦下滑 + 一点木质噪声"""
    t = tt(0.25)
    f = f1 + (f0 - f1) * np.exp(-t / 0.025)
    body = np.sin(glide(f)) * np.exp(-t / 0.07)
    wood = onepole_lp(hp(noise(0.25), 900), 4000) * np.exp(-t / 0.01) * 0.35
    return np.tanh((body + wood) * 1.3) * level


def hat(level=1.0, dec=0.025):
    t = tt(0.12)
    return hp(hp(noise(0.12), 7000), 7000) * np.minimum(1, t / 0.001) * np.exp(-t / dec) * level


def sub_rise(d, f0=40, f1=80, level=1.0):
    t = tt(d)
    x = t / d
    return np.sin(glide(f0 + (f1 - f0) * x ** 2)) * x ** 1.5 * level


def tick(level=1.0, freq=2600, dec=0.012):
    """钟表的“嘀”：很短的木质/金属敲击（带一点共鸣）"""
    t = tt(0.08)
    body = np.sin(2 * np.pi * freq * t) * np.exp(-t / dec)
    body += 0.5 * np.sin(2 * np.pi * freq * 1.51 * t) * np.exp(-t / (dec * 0.6))
    snap = hp(noise(0.08), 4000) * np.exp(-t / 0.0015) * 0.6
    return (body + snap) * np.minimum(1, t / 0.0005) * level


def boom(level=1.0):
    """红方块落地：低频的“咚”+ 一点空气"""
    t = tt(0.9)
    f = 38 + 90 * np.exp(-t / 0.05)
    body = np.sin(glide(f)) * np.exp(-t / 0.35)
    air = onepole_lp(noise(0.9), 900) * np.exp(-t / 0.08) * 0.4
    return np.tanh((body + air) * 1.6) * level


def fall(d, level=1.0):
    """下落：高频噪声往下滑，最后一下最响"""
    t = tt(d)
    x = t / d
    cut = 9000 * (1 - x) ** 2 + 400
    y = onepole_lp(noise(d), cut)
    return y / (np.abs(y).max() + 1e-9) * x ** 2 * level



def additive(freq, d, nh=24, kc0=12.0, kc1=2.0, kdec=0.08, att=0.003, dec=None, rel=0.04,
             voices=1, detune=0.0, odd=0.0, vib=0.0, level=1.0):
    """加法合成的锯齿 / 方波。kc 是“滤波器”截止所在的谐波号，从 kc0 按 kdec 落到 kc1（滤波包络）"""
    t = tt(d + rel)
    kc = kc1 + (kc0 - kc1) * np.exp(-t / kdec)
    y = np.zeros_like(t)
    for v in range(voices):
        det = 0.0 if voices == 1 else (v / (voices - 1) - 0.5) * 2 * detune
        f0 = freq * (1 + det)
        if vib:
            ph = glide(f0 * (1 + vib * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.12) / 0.15, 0, 1)))
        else:
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


def snare(level=1.0):
    t = tt(0.25)
    body = np.sin(glide(185 + 70 * np.exp(-t / 0.01))) * np.exp(-t / 0.05)
    n = hp(onepole_lp(noise(0.25), 8000), 1200) * np.exp(-t / 0.07)
    return (0.55 * body + 0.8 * n) * level


def crash(d=2.2, level=1.0):
    t = tt(d)
    n = hp(hp(noise(d), 5000), 3000)
    env = np.minimum(1, t / 0.002) * (0.55 * np.exp(-t / 0.1) + 0.45 * np.exp(-t / 0.8))
    return n / (np.abs(n).max() + 1e-9) * env * level


# 预先合成一次、反复使用的鼓
KICK = kick(1.0)
CLAP = clap(1.0)
SNARE = snare(1.0)
CRASH = crash()
OHAT = hat(1.0, 0.07)
CHAT = hat(1.0, 0.02)
SHK = shaker(1.0, 0.03)
BOOM = boom(1.0)

# ---------------- 和声 ----------------
BEAT, S16, BAR = 30, 7.5, 120  # 帧
ROOT = {'Am': 33, 'F': 29, 'C': 36, 'G': 31}  # 贝斯根音（A1 F1 C2 G1）
PADV = {'Am': [57, 60, 64, 67], 'F': [53, 57, 60, 64], 'C': [55, 60, 64, 67], 'G': [55, 59, 62, 67]}
ARPV = {'Am': [69, 72, 76, 79], 'F': [65, 69, 72, 76], 'C': [67, 72, 76, 79], 'G': [67, 71, 74, 79]}
STABV = {'Am': [57, 64, 69, 72, 76], 'F': [53, 60, 65, 69, 72], 'G': [55, 62, 67, 71, 74], 'C': [48, 55, 60, 64, 67, 72]}
PROG = [(0, 'Am'), (120, 'F'), (240, 'C'), (360, 'G'), (480, 'Am'),
        (600, 'F'), (630, 'G'), (660, 'Am'), (690, 'F'), (720, 'G'), (750, 'C')]
GROOVE_END = 735   # 唯一的一口气：735–750
FINAL = 750        # 红方块最后一次落地 = C 大和弦


def chord_at(fm):
    cur = PROG[0][1]
    for s, n in PROG:
        if fm >= s - 1e-6:
            cur = n
    return cur


def bright_at(fm):
    """前奏 30→120 帧滤波器慢慢打开"""
    if fm < 30:
        return 0.06
    return 0.06 + 0.94 * min(1.0, (fm - 30) / 90) ** 2


KICKS = []  # 侧链用


def kick_at(fm, level=1.0):
    place(KICK * level, fr(fm))
    KICKS.append(fr(fm))


# ================= 前奏 0–120 =================
# 钟表：八分音符“嘀—嗒”，越走越响
for k in range(8):
    fm = k * 15
    on = k % 2 == 0
    sfx(tick(0.16 + 0.04 * k, 2600 if on else 2000), fr(fm), pan=0.15 if on else -0.15, send=0.1)
# 0–30：模块波——三十二分音符的钟琴往上爬，声像跟着波从左扫到右；噪声扫频推到落地
for k, m in enumerate([69, 72, 76, 79, 81, 84, 88, 91]):
    sfx(bell(midi(m), 0.045 + 0.01 * k, 0.35), fr(k * 3.75), pan=-0.6 + k * 0.17, send=0.45)
sfx(riser(fr(30), 0.28), 0.0, send=0.25)
sfx(sub_rise(fr(30), 30, 60, 0.35), 0.0)
# 30：九个红模块合成红方块
kick_at(30)
sfx(BOOM * 0.9, fr(30), send=0.3)
place(CRASH * 0.35, fr(30), send=0.3)
# 36–60：逐字母升起——每个字母一声轻拨（Am 琶音），45 / 60 两记重击
for i in range(5):
    sfx(pluck(midi([57, 60, 64, 69, 72][i]), 0.05, 0.12), fr(38 + 2.5 * i), pan=-0.3 + 0.12 * i, send=0.3)
    sfx(pluck(midi([60, 64, 69, 72, 76][i]), 0.05, 0.12), fr(52 + 2.5 * i), pan=-0.3 + 0.12 * i, send=0.3)
for fm, lv in ((45, 0.8), (60, 1.0)):
    kick_at(fm, 0.9)
    place(CLAP * 0.5 * lv, fr(fm), send=0.25)
    for m in STABV['Am']:
        place(additive(midi(m), 0.16, nh=18, kc0=9, kc1=2.5, kdec=0.06, voices=3, detune=0.006, dec=0.2, level=0.07 * lv),
              fr(fm), pan=0.0, send=0.35)
sfx(whoosh(0.22, 1500, 9000, 0.12, 0.6), fr(64), pan=-0.3)   # 标题下的横线
for fm, pn in ((70, -0.4), (76, 0.0), (84, 0.4)):              # 三栏信息落位
    sfx(click(0.08), fr(fm), pan=pn, send=0.1)
for fm in (90, 105):
    kick_at(fm, 0.75)
# 86–115：红线扫过 12 栏——十二声细响，一栏一声
for i in range(12):
    sfx(tick(0.05 + 0.004 * i, 3000 + 120 * i, 0.006), fr(86 + 1.5 * i), pan=-0.55 + 0.1 * i, send=0.15)
# 90–120：军鼓滚奏 + 上升音效
for k in range(12):
    fm = 90 + k * (S16 if k < 4 else S16 / 2)
    place(SNARE * (0.12 + 0.03 * k), fr(fm), pan=0.1, send=0.15)
sfx(riser(fr(36), 0.4), fr(84), send=0.3)
sfx(sub_rise(fr(30), 40, 90, 0.3), fr(90))


# ================= 律动 120–735：从不断档 =================
for b in range(4, GROOVE_END // BEAT + 1):
    fm = b * BEAT
    if fm >= GROOVE_END:
        break
    kick_at(fm, 1.0)
    climax = fm >= 600
    if (fm - 120) % 60 == 30 or (climax and fm > 600):
        place(CLAP * (0.55 if not climax else 0.6), fr(fm), send=0.2)
        if climax:
            place(SNARE * 0.25, fr(fm), send=0.15)
    for s in range(4):
        t16 = fm + s * S16
        if t16 >= GROOVE_END:
            break
        if s == 2:
            place(OHAT * 0.22, fr(t16), pan=0.25, send=0.05)
        elif s == 0:
            place(CHAT * 0.12, fr(t16), pan=-0.2)
        else:
            place(SHK * (0.13 if s == 3 else 0.09), fr(t16), pan=-0.3 if s == 1 else 0.3)
# 每 2 秒一次镲片：每一章的开头
for fm, lv in ((120, 0.6), (240, 0.6), (360, 0.6), (480, 0.5), (600, 0.75)):
    place(CRASH * lv, fr(fm), send=0.3)


# ---------------- 贝斯：八分音符，反拍高八度（侧链之后会“泵”起来） ----------------
for k in range(int((GROOVE_END - 30) / 15)):
    fm = 30 + k * 15
    if fm >= GROOVE_END:
        break
    r = ROOT[chord_at(fm)] + (12 if k % 2 else 0)
    br = bright_at(fm)
    y = additive(midi(r), 0.2, nh=20, kc0=2 + 9 * br, kc1=1.4 + 2.5 * br, kdec=0.06, voices=2, detune=0.003, dec=0.35, rel=0.03)
    t = tt(0.23)
    y[: len(t)] += 0.5 * np.sin(2 * np.pi * midi(r) * t) * np.minimum(1, t / 0.004) * np.where(t < 0.2, 1, np.exp(-(t - 0.2) / 0.01))
    place(np.tanh(y * 1.5) * 0.36, fr(fm), bus=PUMP)

# ---------------- Pad：整小节铺底（双声道各一份，宽） ----------------
for k, (s, n) in enumerate(PROG[:-1]):
    e = min(PROG[k + 1][0], GROOVE_END)
    if s >= GROOVE_END:
        break
    st = max(s, 30)
    br = 0.5 + 0.7 * bright_at(st)
    for pan in (-0.55, 0.55):
        place(pad([midi(m) for m in PADV[n]], fr(e - st), 0.42 if s < 600 else 0.5, att=0.03 if st > 30 else 0.4,
                  rel=0.25, bright=br), fr(st), pan=pan, send=0.3, bus=PUMP)

# ---------------- 十六分琶音（同心圆海报转起来时 424–464 升高八度） ----------------
ARP_PAT = [0, 2, 1, 3, 2, 3, 1, 2]
for k in range(int((GROOVE_END - 30) / S16)):
    fm = 30 + k * S16
    if fm >= GROOVE_END:
        break
    notes = ARPV[chord_at(fm)]
    m = notes[ARP_PAT[k % 8]]
    up = 12 if (424 <= fm < 466 or fm >= 600) else 0
    br = bright_at(fm)
    acc = 1.0 if k % 2 == 0 else 0.7
    y = additive(midi(m + up), 0.09, nh=22, kc0=1.3 + 13 * br, kc1=1.0 + 2.5 * br, kdec=0.04, dec=0.1, rel=0.04)
    place(y * 0.15 * acc * (0.8 if up else 1.0), fr(fm), pan=-0.35 if k % 2 else 0.35, send=0.25, bus=PUMP)


# ---------------- 主旋律：2s 的 drop 进来，每小节 3+3+2+2+2+2+2 的切分 ----------------
POS = [0, 3, 6, 8, 10, 12, 14]
LEN = [3, 3, 2, 2, 2, 2, 2]
HOOK = {120: [81, 79, 77, 76, 77, 72, 74],
        240: [79, 76, 74, 72, 74, 76, 79],
        360: [79, 81, 79, 74, 71, 74, 76],
        480: [76, 72, 69, 72, 76, 79, 81]}


def lead(m, d, level=1.0):
    y = additive(midi(m), d, nh=26, kc0=16, kc1=6, kdec=0.1, voices=2, detune=0.0035, odd=0.4, vib=0.004, dec=0.7, rel=0.05)
    b = bell(midi(m + 12), 0.22, 0.25)
    n = max(len(y), len(b))
    out = np.zeros(n)
    out[: len(y)] += y
    out[: len(b)] += b
    return out * level


for s, notes in HOOK.items():
    for p, l, m in zip(POS, LEN, notes):
        place(lead(m, l * 0.125 - 0.02, 0.2), fr(s + p * S16), send=0.25, bus=LEAD)

# ================= 高潮 600–735：每拍一个关键词，一记和弦重音 + 八度钟琴，旋律爬升 =================
CLIMB = [(600, 81), (630, 83), (660, 84), (690, 88), (720, 86)]
for fm, m in CLIMB:
    n = chord_at(fm)
    for v in STABV[n]:
        place(additive(midi(v), 0.2, nh=20, kc0=16, kc1=3, kdec=0.07, voices=5, detune=0.008, dec=0.25, rel=0.08, level=0.055),
              fr(fm), send=0.35)
    place(lead(m, 0.36, 0.24), fr(fm), send=0.3, bus=LEAD)
    place(lead(m + 2 if m < 86 else m - 3, 0.1, 0.12), fr(fm + 3 * S16), send=0.3, bus=LEAD)  # 拍尾的小装饰音
    sfx(bell(midi(m + 12), 0.16, 0.5), fr(fm), pan=0.25, send=0.5)
    sfx(bell(midi(m + 24), 0.06, 0.4), fr(fm), pan=-0.25, send=0.5)
# 720–735：军鼓 32 分音符冲进那一口气
for k in range(4):
    place(SNARE * (0.18 + 0.06 * k), fr(720 + 2 + k * S16 / 2), send=0.2)

# ================= 一口气 735–750 → 收束 =================
rev = CRASH[: int(0.7 * SR)][::-1].copy()
sfx(rev * np.linspace(0, 1, len(rev)) ** 2 * 0.7, fr(FINAL) - 0.7, send=0.3)
sfx(fall(fr(13)), fr(737), 0.25)
kick_at(FINAL, 1.0)
sfx(BOOM * 1.0, fr(FINAL), send=0.4)
place(CRASH * 0.75, fr(FINAL), send=0.45)
for pan in (-0.6, 0.6):
    place(pad([midi(m) for m in [48, 55, 60, 64, 67, 72]], 1.9, 0.62, att=0.01, rel=1.0, bright=1.3), fr(FINAL), pan=pan, send=0.5)
for m in (60, 64, 67, 72, 76):
    place(epiano(midi(m), 1.6, 0.12), fr(FINAL), send=0.45)
yb = additive(midi(36), 1.7, nh=16, kc0=10, kc1=1.5, kdec=0.25, voices=2, detune=0.003, dec=1.0, rel=0.5)
place(np.tanh(yb * 1.4) * 0.4, fr(FINAL))
place(lead(84, 0.6, 0.22), fr(FINAL), send=0.4, bus=LEAD)
sfx(bell(midi(96), 0.12, 1.2), fr(FINAL), send=0.6)
# 标语：一张网格，一种字体，一种红 —— 三声钟琴
for fm, m in ((768, 76), (774, 79), (780, 84)):
    sfx(bell(midi(m), 0.2, 0.9), fr(fm), pan=(fm - 774) / 20, send=0.55)
sfx(whoosh(0.3, 1500, 8000, 0.08, 0.6), fr(776), pan=-0.2)
sfx(pluck(midi(72), 0.1, 0.2), fr(782), send=0.3)
# 钟表又走了几步
for k, fm in enumerate(range(795, 871, 15)):
    sfx(tick(0.16 - 0.018 * k, 2600 if k % 2 == 0 else 2000), fr(fm), pan=0.15 if k % 2 == 0 else -0.15, send=0.15)


# ================= 音效：跟画面对齐 =================
# 网格机器：每次重排之前，分组红线“唰”地画下来，拍点上落定（120 已有 drop）
for at in (120, 150, 180, 210):
    sfx(whoosh(fr(10), 800, 7000, 0.14, 0.8), fr(at - 10), pan=0.35)
    if at > 120:
        sfx(thock(0.3), fr(at), send=0.2)
        sfx(click(0.1), fr(at), pan=0.2)
for g in range(6):                                                     # 六栏正文一栏一栏升起
    sfx(tick(0.045, 2400 + 150 * g, 0.006), fr(208 + 2 * g), pan=-0.5 + 0.2 * g, send=0.1)
# 甩镜：224–242 一甩（速度最快在 233），240 落地；之后沿着字慢慢滑过去
sfx(whoosh(fr(20), 250, 9000, 0.55, 0.5), fr(223), pan=0.0, send=0.2)
sfx(BOOM * 0.55, fr(240), send=0.3)
sfx(whoosh(fr(72), 150, 1400, 0.07, 0.5), fr(242), pan=-0.2, send=0.1)
sfx(click(0.07), fr(248), pan=-0.3)                                    # 说明栏出现
# 字体：改名 Helvetica（300）一声钟，年份翻页三声细响，a 变红（330）
sfx(bell(midi(84), 0.2, 0.7), fr(300), send=0.5)
for k in range(3):
    sfx(tick(0.1, 3200, 0.008), fr(300 + k * 4), pan=0.4)
sfx(bloop(500, 1800, 0.18, 0.08), fr(330), pan=0.2, send=0.3)
# 镜头钻进 a：336–360 上升 + 呼啸 + 军鼓滚奏 → 360 全屏红的重击
sfx(riser(fr(26), 0.42), fr(334), send=0.3)
sfx(whoosh(fr(26), 200, 7500, 0.5, 0.85), fr(334))
for k in range(8):
    place(SNARE * (0.1 + 0.035 * k), fr(345 + k * S16 / 4 * 2), send=0.15)
sfx(BOOM * 0.85, fr(360), send=0.35)
sfx(whoosh(0.4, 300, 4000, 0.2, 0.2), fr(362))                      # 全屏红缩成第一张海报
# 海报
for fm in (390, 420):
    sfx(thock(0.42), fr(fm), send=0.2)
for k, m in enumerate([67, 69, 71, 74, 76, 79, 81]):                 # 圆点一圈圈弹出来
    sfx(bloop(midi(m) * 0.6, midi(m), 0.11, 0.07), fr(398 + 3 * k), pan=-0.4 + k * 0.13, send=0.25)
sfx(fall(fr(14)), fr(466), 0.2)                                       # 前两张海报掉下去
sfx(whoosh(fr(20), 300, 6000, 0.35, 0.5), fr(470), pan=0.3)           # 第三张拉成标识带
# 纽约地铁：线路圆标逐个“啵”
for k, (fm, m) in enumerate(((492, 69), (496, 72), (500, 76), (504, 81), (520, 72), (524, 76), (528, 81))):
    sfx(bloop(midi(m) * 0.55, midi(m), 0.14, 0.08), fr(fm), pan=-0.3 + 0.1 * k, send=0.25)
sfx(whoosh(fr(22), 400, 6000, 0.3, 0.4), fr(506), pan=0.5)          # 第二条标识带从右边滑进来
sfx(thock(0.3), fr(520), send=0.2)                                    # 1970
for fm, m in ((548, 88), (560, 84)):                                  # 报站“叮—咚”
    sfx(tink(midi(m), 0.11, 0.5), fr(fm), send=0.5)
# 冲向高潮：570–600 军鼓滚奏 + 上升 + 标识带铺满全屏的呼啸
for k in range(12):
    fm = 570 + k * (S16 if k < 4 else S16 / 2)
    place(SNARE * (0.1 + 0.028 * k), fr(fm), send=0.15)
sfx(riser(fr(34), 0.4), fr(566), send=0.3)
sfx(whoosh(fr(18), 200, 8000, 0.5, 0.7), fr(582))
sfx(BOOM * 0.8, fr(600), send=0.35)
# 关键词卡片：每次切换前 10 帧的“唰”
for k, fm in enumerate((620, 650, 680, 710)):
    sfx(whoosh(fr(11), 900, 9500, 0.2, 0.75), fr(fm), pan=0.45 if k % 2 == 0 else -0.05)


# ================= 侧链 + 主旋律延迟 =================
tsec = np.arange(N) / SR
ks = np.array(sorted(KICKS))
idx = np.searchsorted(ks, tsec, side='right') - 1
since = np.where(idx >= 0, tsec - ks[np.clip(idx, 0, None)], 9.0)
x = np.clip(since / 0.26, 0, 1)
duck = 1 - 0.65 * (1 - x) ** 2
duck = np.where(since < 0.004, 1 - 0.65 * since / 0.004, duck)       # 4ms 压下去，避免爆音
duck[tsec >= fr(FINAL)] = 1.0
PUMP *= duck[None, :]

d = int(0.375 * SR)  # 附点八分音符的乒乓延迟
dl = np.zeros((2, N))
for k in range(1, 4):
    ch = k % 2
    src = LEAD[0] + LEAD[1]
    dl[ch, k * d:] += src[: N - k * d] * 0.5 * 0.42 ** k
for ch in range(2):
    dl[ch] = onepole_lp(dl[ch], 3500)
    SEND[ch] += dl[ch] * 0.3



# ---------------- 混响 + 母带 ----------------
def reverb(x, seed, dec=0.7, length=2.6):
    t = tt(length)
    ir = np.random.default_rng(seed).standard_normal(len(t)) * np.exp(-t / dec)
    ir = onepole_lp(ir, 6500)
    ir[: int(0.02 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + len(ir)
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


mix = MUS + PUMP + LEAD + dl + SFX
mix[0] += reverb(SEND[0], 1) * 0.55
mix[1] += reverb(SEND[1], 2) * 0.55
for ch in range(2):  # 母带高通 ~32Hz：去掉听不见、只占响度的超低频
    mix[ch] = hp(hp(mix[ch], 32), 32)
mix = mix.T
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.3) / np.tanh(1.3)
fade = np.ones(N)
f0, f1 = int(fr(864) * SR), N
fade[f0:f1] = np.linspace(1, 0, f1 - f0) ** 2
mix *= fade[:, None]

root = os.path.dirname(os.path.abspath(__file__))
out_dir = os.path.normpath(os.path.join(root, '..', '..', '..', 'public', '002-swiss-style'))
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
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True)
    os.remove(tmp)
    js = r.stderr[r.stderr.rindex('{'): r.stderr.rindex('}') + 1]
    import json
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
    # 两遍：测响度 → 线性增益 → 限幅 → 再测一遍微调（只做线性增益，不做动态压缩）
    y = mix * 0.5
    for _ in range(3):
        i = loudness(y)
        y = limit(y * 10 ** ((-14.0 - i) / 20))
    print('loudness %.2f LUFS' % loudness(y))
    write(final, y)
else:
    write(final, mix * 0.89)
print('wrote', final)
