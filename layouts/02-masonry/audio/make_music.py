"""
Design Style · 布局 02 · Masonry 瀑布流 —— 配乐与音效（纯代码合成，无外部音源）

≈128.6 BPM（1 拍 = 28 帧 ≈ 0.467 秒）· D 大调 · 15 秒 · 主题是“水往下流”：轻、透、一直往前走
  0–0.9s     开场：26 张卡片像雨点落进 6 列 → 26 声水滴（五声音阶，按列左右声像）
  0.9s       第 56 帧：墙流到右半边 → 重音 + 律动进来
  2.3s       02 砌石墙：低沉的石头“咚”，每块石头一声闷响
  3.7–5.8s   03 算法：每放一张卡片一声“咚”+ 一个音，音高随列号；前 3 张先“比高度”（细碎嘀嗒）
  6.1s       04 Pinterest：明亮；悬停 → 点击“保存”两声叮
  7.5s       05 手机：卡片倒进屏幕，手指一划（短促的上扫）
  8.9–11.3s  06 五条规则：鼓停、整条音乐低通；每条规则一声“叮”，测量标注一声“嘀”；骨架屏一阵“沙”
  11.7–12.6s 07 响应式：窗口每缩一次（5 → 3 → 2 列）一个重音
  13.1–15s   END：重音 → 标题三声上行 → 收束和弦
每次重排“移动最快的一刻”（转场开始 + 12 帧）都落在拍点上：56 / 140 / 224 / 364 / 448 / 532 / 700 / 728 / 756 / 784。
所有时间点与 video/layout.ts、video/scenes.tsx 的关键帧对齐（帧 / 60 = 秒）。

用法：python3 layouts/02-masonry/audio/make_music.py
输出：public/02-masonry/music.wav（ffmpeg 响度标准化到 -14 LUFS）
"""
import os
import shutil
import subprocess
import wave

import numpy as np

SR = 48000
DUR = 15.0
N = int(SR * DUR)
rng = np.random.default_rng(2010)

# 两条总线：音乐（WIRE 段会被整体低通）+ 音效；各带混响发送
MUS = np.zeros((2, N))
SFX = np.zeros((2, N))
SEND = np.zeros((2, N))


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


def drop(freq, level=1.0):
    """水滴：很短的正弦，音高往上一挑（“嘀嗒”的“嗒”），再叠一个拨弦音"""
    t = tt(0.25)
    f = freq * (0.7 + 0.3 * (1 - np.exp(-t / 0.012)))
    y = np.sin(glide(f)) * np.minimum(1, t / 0.001) * np.exp(-t / 0.05)
    return y * level


def stone(level=1.0, f0=130, f1=55):
    """石头落定：更低、更闷的“咚” + 一点砂砾"""
    t = tt(0.35)
    f = f1 + (f0 - f1) * np.exp(-t / 0.02)
    body = np.sin(glide(f)) * np.exp(-t / 0.09)
    grit = onepole_lp(hp(noise(0.35), 400), 2200) * np.exp(-t / 0.018) * 0.5
    return np.tanh((body + grit) * 1.5) * level


def swipe(d=0.16, level=1.0):
    """手指一划：短促、向上的噪声扫频"""
    t = tt(d)
    x = t / d
    cut = 900 + 9000 * x
    y = onepole_lp(hp(noise(d), 600), cut)
    return y / (np.abs(y).max() + 1e-9) * np.sin(np.pi * x) ** 0.8 * level


def shimmer(d=0.8, level=1.0):
    """骨架屏的流光：一阵细细的高频“沙”"""
    t = tt(d)
    x = t / d
    y = hp(hp(noise(d), 5000), 5000)
    return y * np.sin(np.pi * x) ** 2 * level


# ---------------- 时间轴（与 layout.ts 对齐） ----------------
BEAT = 28
HITS = [56, 140, 224, 364, 448, 532, 700, 728, 756, 784]
ALG_LAND = [252, 280, 308, 315, 322, 329, 336, 343]
ALG_COL = [3, 2, 1, 1, 3, 0, 2, 3]  # 每张卡片落进的列（由 layout.ts 的 masonry() 算出）
RULES_AT = [546, 574, 602, 630, 658]
PIN_CLICK = 406
FLICK = 468

# ---------------- 和声：D 大调，温暖、透明 ----------------
CH = {  # 名字: (贝斯根音, 和弦音)
    'Dmaj9': (38, [54, 57, 61, 64]),   # D2 | F#3 A3 C#4 E4
    'Bm9': (47, [54, 57, 61, 62]),     # B2 | F#3 A3 C#4 D4
    'Em9': (40, [55, 59, 62, 66]),     # E2 | G3 B3 D4 F#4
    'Gmaj9': (43, [54, 57, 59, 62]),   # G2 | F#3 A3 B3 D4
    'Asus': (45, [55, 57, 62, 64]),    # A2 | G3 A3 D4 E4
    'F#m7': (42, [52, 57, 61, 64]),    # F#2 | E3 A3 C#4 E4
}
PROG = [(0, 'Dmaj9'), (140, 'Bm9'), (224, 'Em9'), (308, 'Asus'), (364, 'Dmaj9'), (448, 'Bm9'), (532, 'Gmaj9'),
        (616, 'Em9'), (700, 'Dmaj9'), (728, 'F#m7'), (756, 'Gmaj9'), (770, 'Asus'), (784, 'Dmaj9')]


def chord_at(frame):
    cur = PROG[0][1]
    for s, n in PROG:
        if frame >= s:
            cur = n
    return CH[cur]


PENTA = [74, 76, 78, 81, 83, 86, 88, 90, 93, 95]  # D 大调五声：D E F# A B …

# Pad：贯穿全片
for k, (s, n) in enumerate(PROG):
    e = PROG[k + 1][0] if k + 1 < len(PROG) else 900
    lvl = 0.5 if s < 784 else 0.8
    place(pad([midi(m) for m in CH[n][1]], fr(e - s) + 0.05, lvl, att=0.25 if s else 0.6, rel=0.5, bright=1.2), fr(s), send=0.4)

# ---------------- 开场：雨 ----------------
# RAIN：第 i 张卡片在 i + 17 帧左右落地（stagger 1，dur 24，落地点 70%）；列号决定声像
RAIN_COLS = 6
for i in range(26):
    fm = i + 16.8
    col = i % RAIN_COLS
    m = PENTA[(i * 3) % 7] + (12 if i % 5 == 4 else 0)
    sfx(drop(midi(m), 0.16 * (0.8 + 0.4 * rng.random())), fr(fm), pan=-0.6 + 1.2 * col / (RAIN_COLS - 1), send=0.55)
    if i % 3 == 0:
        sfx(pluck(midi(m - 12), 0.07, 0.1), fr(fm), pan=-0.5 + col * 0.2, send=0.4)
place(sub_rise(fr(56), 32, 62, 0.45), 0)
sfx(riser(fr(50), 0.22), fr(6), send=0.2)

# ---------------- 律动 ----------------
GROOVE = [(56, 532), (700, 784)]
ARP_PAT = [0, 2, 1, 3, 2, 1, 3, 2]


def in_groove(fm):
    return any(a <= fm < b for a, b in GROOVE)


for b in range(0, 900 // BEAT + 1):
    fm = b * BEAT
    root, notes = chord_at(fm)
    stone_part = 140 <= fm < 224
    if in_groove(fm):
        place(kick(0.9 if not stone_part else 1.0), fr(fm))
        if b % 2 == 1:
            place(clap(0.36), fr(fm), pan=0.05, send=0.25)
        place(hat(0.2), fr(fm + 14), pan=0.25)
        if 364 <= fm < 448 or 700 <= fm < 784:  # Pinterest / 响应式：十六分踩镲，更亮
            place(hat(0.09, 0.015), fr(fm + 7), pan=-0.25)
            place(hat(0.09, 0.015), fr(fm + 21), pan=-0.25)
    if 56 <= fm < 784:
        for h in (0, 14):
            oc = 12 if (h == 14 and b % 2 == 1) else 0
            place(bass(midi(root + oc), 0.18, 0.55 if h == 0 else 0.38), fr(fm + h))
        if not stone_part:  # 石墙一章不要琶音：只留低音和石头声
            for q in range(4):
                m = notes[ARP_PAT[(b * 4 + q) % 8] % len(notes)] + 12
                place(pluck(midi(m), 0.15 if q == 0 else 0.1, 0.12), fr(fm + q * 7), pan=0.3 * (1 if q % 2 else -1), send=0.3)

# ---------------- 重排：whoosh 峰值 + 重音落在 HIT ----------------
for k, h in enumerate(HITS[:-1]):
    pan = 0.2 if k % 2 == 0 else -0.2
    sfx(whoosh(fr(34), 300, 6500, 0.34, 0.5), fr(h - 17), pan=pan)
    sfx(thock(0.5), fr(h), send=0.15)

# 02 砌石墙：重而闷，石头一块一块落定（按 y 顺序，stagger 0.6）
sfx(stone(0.9, 150, 45), fr(140), send=0.3)
for k in range(14):
    sfx(stone(0.16 + 0.04 * (k % 3), 120 + 10 * (k % 4), 55), fr(150 + k * 1.9 + (k % 2) * 0.6), pan=-0.4 + 0.8 * ((k * 5) % 14) / 13, send=0.25)
sfx(bell(midi(69), 0.12, 1.1), fr(152), pan=-0.2, send=0.7)

# 03 算法：前 3 张先“比高度”（4 列各一声嘀，最短那列高一个音），再落下；后 5 张连放
for k, land in enumerate(ALG_LAND):
    col = ALG_COL[k]
    if k < 3:
        for c in range(4):
            sfx(pluck(midi(93 if c == col else 86), 0.05 if c != col else 0.08, 0.04), fr(land - 20 + c * 2), pan=-0.45 + 0.3 * c, send=0.2)
    sfx(thock(0.55 if k < 3 else 0.42, 200, 70), fr(land), pan=-0.45 + 0.3 * col, send=0.2)
    sfx(pluck(midi(PENTA[k % len(PENTA)]), 0.14, 0.14), fr(land), pan=-0.45 + 0.3 * col, send=0.4)

# 04 Pinterest：悬停一声轻点，点击“保存” → 已保存（两声上行的叮）
sfx(click(0.12), fr(384), pan=0.35)
sfx(click(0.3), fr(PIN_CLICK), pan=0.35)
sfx(bell(midi(86), 0.2, 0.5), fr(PIN_CLICK + 2), pan=0.35, send=0.5)
sfx(bell(midi(93), 0.16, 0.6), fr(PIN_CLICK + 9), pan=0.35, send=0.5)

# 05 手机：卡片倒进屏幕（一串很快的轻拨），手指一划
for k in range(10):
    _, notes = chord_at(452)
    sfx(pluck(midi(notes[k % 4] + 24), 0.06, 0.06), fr(452 + k * 1.4), pan=0.3, send=0.3)
sfx(swipe(0.2, 0.32), fr(FLICK - 4), pan=0.3, send=0.2)
sfx(whoosh(fr(26), 1500, 9000, 0.12, 0.3), fr(FLICK), pan=0.3)

# 06 规则：每条一声叮（五声上行）+ 一声闷咚；测量标注各一声嘀
for k, fm in enumerate(RULES_AT):
    sfx(bell(midi(PENTA[k] + 12), 0.3, 0.6), fr(fm), pan=-0.2 + 0.1 * k, send=0.55)
    sfx(thock(0.3, 150, 80), fr(fm))
for c in range(4):  # 规则 01：w 251 × 4
    sfx(pluck(midi(98), 0.05, 0.04), fr(RULES_AT[0] + 4 + c * 3), pan=-0.1 + 0.15 * c, send=0.2)
for k in range(8):  # 规则 02：顺序 1 → 8
    sfx(pluck(midi(PENTA[k % len(PENTA)] + 12), 0.045, 0.05), fr(RULES_AT[1] + 2 + k * 3), pan=-0.1 + 0.05 * k, send=0.3)
for d in (0, 4):  # 规则 03：两个间距
    sfx(pluck(midi(100), 0.06, 0.04), fr(RULES_AT[2] + d), pan=0.1, send=0.2)
sfx(pluck(midi(98), 0.06, 0.05), fr(RULES_AT[3] + 4), pan=-0.2, send=0.2)  # 规则 04：h = w × 比例
sfx(shimmer(1.0, 0.05), fr(RULES_AT[4] - 2), pan=0.1, send=0.3)  # 规则 05：骨架屏流光
sfx(riser(fr(30), 0.42), fr(670), send=0.2)
for k in range(12):
    place(clap(0.08 + 0.022 * k), fr(682 + k * 1.5), send=0.15)

# 07 响应式：每次窗口变窄一声“咔”+ 断点标签弹出一声叮
for k, h in enumerate([700, 728, 756]):
    sfx(click(0.22), fr(h + 2), pan=0.3)
    sfx(bell(midi([86, 90, 93][k]), 0.14, 0.4), fr(h + 4), pan=0.35, send=0.4)

# END：版面收拢 → 重音 → 标题 → 收束
sfx(riser(fr(40), 0.4), fr(744), send=0.25)
sfx(thock(1.0, 230, 50), fr(784), send=0.3)
place(kick(1.0), fr(784))
sfx(bell(midi(74), 0.28, 1.3), fr(784), pan=-0.15, send=0.6)
sfx(bell(midi(81), 0.24, 1.3), fr(788), pan=0.15, send=0.6)
for k, m in enumerate([86, 90, 93]):
    sfx(bell(midi(m), 0.15, 0.8), fr(806 + k * 7), pan=-0.2 + 0.2 * k, send=0.65)
place(bass(midi(38), 1.6, 0.6), fr(784))
# 片尾最后一滴水
sfx(drop(midi(98), 0.12), fr(850), pan=0.2, send=0.8)

# ---------------- 规则一章：把音乐“闷住” ----------------
tsec = np.arange(N) / SR
c = np.full(N, 16000.0)
a, b = fr(522), fr(546)
c = np.where((tsec >= a) & (tsec < b), 16000 * (650 / 16000) ** np.clip((tsec - a) / (b - a), 0, 1), c)
c = np.where((tsec >= b) & (tsec < fr(668)), 650, c)
a2, b2 = fr(668), fr(702)
c = np.where((tsec >= a2) & (tsec < b2), 650 * (16000 / 650) ** (np.clip((tsec - a2) / (b2 - a2), 0, 1) ** 2), c)
seg = slice(int(fr(512) * SR), int(fr(708) * SR))
for ch in range(2):
    MUS[ch, seg] = onepole_lp(onepole_lp(MUS[ch, seg], c[seg]), c[seg])


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


mix = MUS + SFX
mix[0] += reverb(SEND[0], 1) * 0.6
mix[1] += reverb(SEND[1], 2) * 0.6
mix = mix.T
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
fade = np.ones(N)
fo = int(0.8 * SR)
fade[-fo:] = np.linspace(1, 0, fo) ** 2
mix *= fade[:, None] * 0.89

root = os.path.dirname(os.path.abspath(__file__))
out_dir = os.path.normpath(os.path.join(root, '..', '..', '..', 'public', '02-masonry'))
os.makedirs(out_dir, exist_ok=True)
raw = os.path.join(out_dir, 'music.raw.wav')
final = os.path.join(out_dir, 'music.wav')
with wave.open(raw, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())

if shutil.which('ffmpeg'):
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.0:LRA=11', '-ar', str(SR), final], check=True)
    os.remove(raw)
else:
    os.replace(raw, final)
print('wrote', final)
