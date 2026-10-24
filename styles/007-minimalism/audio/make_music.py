"""
Design Style · 风格 007 · 极简主义 Minimalism —— 六改配乐（纯代码合成，无外部音源）

24 秒 · 120 BPM（1 拍 = 0.5 秒 = 30 帧）· D 大调。Swiss 气质：格子从第 0 拍就立住，
不是软纸床上慢慢堆。整首仍在做减法——声部一层一层加，对照之后一层一层撤。

  0–3.0s     开场炸：底鼓每拍 · 落地 tick · 错峰喊 knock · 1.8s snap zoom
  3.0–5.0s   裂成五窗：一声裂开 + 钢琴和弦
  5.0–12.2s  App / Web / Pay / 数据：每删一下 tick+马林巴，留下 ping
  12.2–14.2s 坏例炸开 thock → 真空吸入 swell
  14.2–16.8s 骨架：栏线 tink · 字重钢琴 · 留白 swell
  16.8–19.8s 定妆：Dmaj7
  19.8–24s   片尾：一个点 = 那一声纯音；Dmaj9 慢慢散掉

时间点读自 cues.json（export_cues.mjs ← video/cues.ts），帧 / 60 = 秒。
用法：python3 styles/007-minimalism/audio/make_music.py
输出：public/007-minimalism/music.wav（−14 LUFS，真峰值 ≤ −2 dBTP）
"""
import json
import os
import shutil
import subprocess
import wave

import numpy as np

try:
    from scipy.signal import lfilter
except ImportError:  # 没有 scipy 也能跑，只是慢一点
    lfilter = None

HERE = os.path.dirname(os.path.abspath(__file__))
if shutil.which('node'):
    subprocess.run(['node', os.path.join(HERE, 'export_cues.mjs')], check=False, capture_output=True)
CUE = json.load(open(os.path.join(HERE, 'cues.json'), encoding='utf-8'))

SR = 48000
DUR = CUE['frames'] / 60.0
N = int(SR * DUR)
rng = np.random.default_rng(1929)

# 总线：DRUM 鼓 · GROOVE 贝斯 / 马林巴 / Pad（侧链泵感 + 03 的“小喇叭”）· CLU 音簇 · KEYS 钢琴与钟 · SFX 音效
DRUM = np.zeros((2, N))
GROOVE = np.zeros((2, N))
CLU = np.zeros((2, N))
KEYS = np.zeros((2, N))
SFX = np.zeros((2, N))
SEND = np.zeros((2, N))


def fr(frame):
    return frame / 60.0


def place(sig, t, gain=1.0, pan=0.0, send=0.0, bus=None):
    bus = SFX if bus is None else bus
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


def tt(d):
    return np.arange(int(d * SR)) / SR


def onepole_lp(x, cutoff):
    if np.isscalar(cutoff) and lfilter is not None:
        a = np.exp(-2 * np.pi * cutoff / SR)
        return lfilter([1 - a], [1, -a], x)
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


def norm(y):
    return y / (np.abs(y).max() + 1e-9)


# ---------------- 乐器 ----------------

def ping(freq, level=1.0, dec=1.4):
    """那个点的声音：几乎是纯正弦，带一点点玻璃般的非谐泛音"""
    t = tt(dec * 3)
    y = np.sin(2 * np.pi * freq * t)
    y += 0.12 * np.sin(2 * np.pi * freq * 2.0 * t) * np.exp(-t / (dec * 0.4))
    y += 0.05 * np.sin(2 * np.pi * freq * 5.43 * t) * np.exp(-t / 0.05)
    return y * np.minimum(1, t / 0.002) * np.exp(-t / dec) * level


def marimba(freq, level=1.0, dec=0.32):
    """马林巴：木琴条的泛音在 1 / 3.93 / 9.2 倍；软槌起音"""
    t = tt(dec * 4)
    y = np.sin(2 * np.pi * freq * t) * np.exp(-t / dec)
    y += 0.28 * np.sin(2 * np.pi * freq * 3.93 * t) * np.exp(-t / (dec * 0.18))
    y += 0.06 * np.sin(2 * np.pi * freq * 9.2 * t) * np.exp(-t / (dec * 0.05))
    mallet = onepole_lp(noise(dec * 4), 2500) * np.exp(-t / 0.004) * 0.08
    return (y + mallet) * np.minimum(1, t / 0.0025) * level


def felt_kick(level=1.0):
    """毡槌底鼓：圆、软，没有“咔”"""
    t = tt(0.45)
    f = 44 + 80 * np.exp(-t / 0.025)
    body = np.sin(glide(f)) * np.exp(-t / 0.17)
    felt = onepole_lp(noise(0.45), 900) * np.exp(-t / 0.006) * 0.3
    return np.tanh((body + felt) * 1.25) * level


def piano(freq, d=1.2, level=1.0):
    """毡钢琴：略带非谐的加法合成，高次谐波衰减快；起音有一点毡的“噗”"""
    t = tt(d + 0.6)
    y = np.zeros_like(t)
    B = 0.0003
    for h in range(1, 12):
        fh = freq * h * np.sqrt(1 + B * h * h)
        if fh > 12000:
            break
        y += np.sin(2 * np.pi * fh * t) / h ** 1.6 * np.exp(-t * (0.9 + 0.7 * h))
    y += 0.4 * np.sin(2 * np.pi * freq * 1.002 * t) * np.exp(-t * 0.8)  # 第二根弦，轻微拍频
    thump = onepole_lp(noise(d + 0.6), 700) * np.exp(-t / 0.012) * 0.25
    env = np.minimum(1, t / 0.005) * np.where(t < d, 1, np.exp(-(t - d) / 0.18))
    return (y + thump) * env * level


def sine_bass(freq, d=0.22, level=1.0):
    t = tt(d + 0.08)
    env = np.minimum(1, t / 0.008) * np.exp(-t / 0.4) * np.where(t < d, 1, np.exp(-(t - d) / 0.03))
    y = np.sin(2 * np.pi * freq * t) + 0.18 * np.sin(4 * np.pi * freq * t) + 0.06 * np.sin(6 * np.pi * freq * t)
    return np.tanh(y * 1.1) * env * level


def pad(freqs, d, level=1.0, att=0.4, rel=0.8, bright=1.0):
    """加法合成的柔和 Pad：每个音 3 个微失谐声部 × 7 个谐波"""
    t = tt(d + rel)
    y = np.zeros_like(t)
    for fq in freqs:
        for det in (-0.003, 0.0, 0.003):
            ph0 = rng.random() * 6.28
            for h in range(1, 8):
                if fq * h > 8000:
                    break
                y += np.sin(2 * np.pi * fq * (1 + det) * h * t + ph0 * h) / h ** (1.9 / bright)
    env = np.minimum(1, t / att) * np.where(t < d, 1, np.exp(-(t - d) / (rel / 4)))
    trem = 1 + 0.05 * np.sin(2 * np.pi * 0.5 * t)
    return y / (len(freqs) * 5) * env * trem * level


def voice(freq, d, level=1.0, nh=7):
    """音簇里的一个声部：软一点的窄脉冲（不再用刺耳方波），删掉的瞬间 15ms 收尾"""
    t = tt(d + 0.02)
    y = np.zeros_like(t)
    vib = 1 + 0.004 * np.sin(2 * np.pi * (3.2 + rng.random() * 1.4) * t + rng.random() * 6)
    ph = glide(freq * vib)
    for h in range(1, nh * 2, 2):
        if freq * h > 4200:
            break
        y += np.sin(h * ph) / (h ** 1.25)
    env = np.minimum(1, t / 0.008) * np.where(t < d, 1, np.exp(-(t - d) / 0.006))
    return onepole_lp(y * env * level, 2600)


def thock(level=1.0, f0=190, f1=70, dec=0.07):
    """木头“咚”：短促的低频正弦下滑 + 一点木质噪声"""
    t = tt(0.3)
    f = f1 + (f0 - f1) * np.exp(-t / 0.02)
    body = np.sin(glide(f)) * np.exp(-t / dec)
    wood = onepole_lp(hp(noise(0.3), 900), 4000) * np.exp(-t / 0.008) * 0.3
    return np.tanh((body + wood) * 1.3) * level


def knock(freq, level=1.0):
    """空心木盒子的敲击：两个共振峰"""
    t = tt(0.25)
    y = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.05) + 0.5 * np.sin(2 * np.pi * freq * 2.3 * t) * np.exp(-t / 0.02)
    y += hp(noise(0.25), 1500) * np.exp(-t / 0.003) * 0.4
    return y * np.minimum(1, t / 0.0008) * level


def tick(level=1.0, freq=2600, dec=0.012):
    t = tt(0.08)
    body = np.sin(2 * np.pi * freq * t) * np.exp(-t / dec)
    body += 0.5 * np.sin(2 * np.pi * freq * 1.51 * t) * np.exp(-t / (dec * 0.6))
    snap = hp(noise(0.08), 4000) * np.exp(-t / 0.0015) * 0.6
    return (body + snap) * np.minimum(1, t / 0.0005) * level


def tink(freq, level=1.0, dec=0.35):
    """玻璃“叮”：非谐泛音"""
    t = tt(dec * 3)
    y = np.zeros_like(t)
    for k, (r, a) in enumerate([(1, 1), (2.76, 0.5), (5.4, 0.25), (8.93, 0.12)]):
        y += a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t / (dec / (1 + k)))
    return y * np.minimum(1, t / 0.001) * level


def click(level=1.0, freq=2200):
    t = tt(0.06)
    y = hp(noise(0.06), 3000) * np.exp(-t / 0.0015) + 0.5 * np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.004)
    return y * level


def pop(freq, level=1.0):
    """被删掉的那一下：软的下滑正弦“噗”，先过低通，不刺耳"""
    t = tt(0.07)
    f = freq * (0.55 + 0.45 * np.exp(-t / 0.014))
    y = np.sin(glide(f)) * np.minimum(1, t / 0.0014) * np.exp(-t / 0.024) * level
    return onepole_lp(y, 1200)


def shaker(level=1.0, dec=0.03):
    t = tt(0.12)
    env = np.minimum(1, t / 0.006) * np.exp(-t / dec)
    return hp(noise(0.12), 6000) * env * level


def hat(level=1.0, dec=0.025):
    t = tt(0.2)
    return hp(hp(noise(0.2), 7500), 7500) * np.minimum(1, t / 0.001) * np.exp(-t / dec) * level


def rim(level=1.0):
    """拍手的替身：干净的边击（极简一点，不用拍手）"""
    t = tt(0.12)
    y = np.sin(2 * np.pi * 1650 * t) * np.exp(-t / 0.01) + 0.6 * np.sin(2 * np.pi * 820 * t) * np.exp(-t / 0.018)
    y += hp(noise(0.12), 2500) * np.exp(-t / 0.006) * 0.5
    return y * level


def air(d, lo=400, hi=7000, level=1.0, rise=0.5):
    """一阵空气：带通噪声的扫频（线画出去、镜头移动）"""
    t = tt(d)
    x = t / d
    cut = lo + (hi - lo) * np.sin(np.pi * np.clip(x / (2 * rise), 0, 1)) ** 2
    y = onepole_lp(onepole_lp(noise(d), cut), cut)
    y = hp(y, 200)
    env = np.sin(np.pi * x) ** 1.5
    return norm(y) * env * level


def riser(d=0.5, level=1.0, f0=330):
    t = tt(d)
    x = t / d
    cut = 400 + 9000 * x ** 2
    n = hp(onepole_lp(noise(d), cut), 300)
    tone = np.sin(glide(f0 * 2 ** (2 * x))) * 0.2
    return (norm(n) + tone) * x ** 2.2 * level


def sub(freq=36.7, d=1.2, level=1.0):
    t = tt(d)
    return np.sin(2 * np.pi * freq * t) * np.minimum(1, t / 0.01) * np.exp(-t / (d * 0.35)) * level


def swell(d, level=1.0):
    """反向吸气：越来越近的空气声，最后一刻掐断"""
    t = tt(d)
    x = t / d
    y = onepole_lp(noise(d), 600 + 6000 * x ** 2)
    return norm(hp(y, 300)) * x ** 3 * level


def cymbal(d=2.4, level=1.0):
    """很轻的镲：只留空气，不要金属的“嚓”"""
    t = tt(d)
    n = hp(hp(noise(d), 6000), 4000)
    env = np.minimum(1, t / 0.01) * (0.3 * np.exp(-t / 0.15) + 0.7 * np.exp(-t / 0.9))
    return norm(n) * env * level


KICK = felt_kick()
RIM = rim()
SHK = shaker()
OHAT = hat(1.0, 0.08)
CYM = cymbal()

# ---------------- 和声（D 大调）----------------
BEAT, S16 = 30, 7.5
# [起始帧, 名字, 贝斯根音, Pad 声部, 马林巴用的四个音] —— 跟着六改十格走
PROG = [
    (0, 'Dmaj7', 38, [50, 57, 61, 66], [62, 66, 69, 73]),
    (180, 'Bm7', 35, [47, 54, 57, 62], [59, 62, 66, 69]),
    (300, 'Gmaj7', 31, [50, 55, 59, 66], [67, 71, 74, 78]),
    (408, 'A', 33, [52, 57, 61, 64], [69, 73, 76, 81]),
    (516, 'Em9', 40, [52, 55, 59, 66], [64, 67, 71, 74]),
    (624, 'D/F#', 42, [50, 57, 62, 66], [74, 78, 81, 85]),
    (732, 'Gmaj7', 31, [50, 55, 59, 66], [67, 71, 74, 78]),
    (852, 'A6', 33, [52, 57, 61, 66], [69, 73, 76, 78]),
    (1008, 'Dmaj7', 38, [50, 57, 61, 66], [62, 66, 69, 73]),
    (1188, 'Dmaj7', 38, [50, 57, 61, 66], [62, 66, 69, 73]),
]
AT = CUE['at']
BLAST, SPLIT = CUE['blast'], CUE['split']
BONE = CUE['bone']
APP, WEB, PAY, DATA = CUE['app'], CUE['web'], CUE['pay'], CUE['data']
VS, POSTER = CUE['vs'], CUE['poster']
END = CUE['finale']['end']
DRUM_END, BASS_END, MAR_END, PAD_END = VS['at'] + 40, VS['suck'], POSTER['at'], END


def chord_at(fm):
    cur = PROG[0]
    for p in PROG:
        if fm >= p[0] - 1e-6:
            cur = p
    return cur


KICKS = []


def kick_at(fm, level=1.0):
    place(KICK * level, fr(fm), bus=DRUM)
    KICKS.append(fr(fm))


# ================= 开场炸：落地 + 错峰喊 + snap =================
tsec = np.arange(N) / SR
pile_n = int(fr(AT['split']) * SR)
bed = np.zeros(pile_n)
t0 = 0.0
while t0 < fr(AT['split']):
    d = rng.choice([0.04, 0.06, 0.08])
    m = rng.integers(52, 76)
    v = voice(midi(m), d, 0.02, nh=3)
    i = int(t0 * SR)
    seg = v[: pile_n - i]
    bed[i : i + len(seg)] += seg
    t0 += d
paper = onepole_lp(hp(noise(fr(AT['split'])), 400), 2200) * 0.07
hum = np.sin(2 * np.pi * 73.4 * tt(fr(AT['split']))) * 0.03 + np.sin(2 * np.pi * 110 * tt(fr(AT['split']))) * 0.02
chaos = onepole_lp(bed + paper + hum, 2000)
for ch, sh in ((0, 0), (1, 97)):
    SFX[ch, : len(chaos)] += np.roll(chaos, sh) * 0.55
place(pad([midi(m) for m in (38, 50, 57, 62)], fr(36), 0.18, att=0.12, rel=0.6, bright=0.7), 0.0, send=0.32, bus=KEYS)
for i, fm in enumerate(BLAST['lands']):
    place(tick(0.055, 2100 + 50 * (i % 6), 0.008), fr(fm), pan=-0.55 + 0.06 * i, send=0.1)
    place(pop(rng.uniform(220, 680), 0.07), fr(fm), pan=-0.4 + 0.05 * i, send=0.06)
for i, fm in enumerate(BLAST['shouts']):
    place(knock(midi(67 + (i % 5) * 2), 0.11), fr(fm), pan=-0.5 + 0.06 * i, send=0.14)
    place(tick(0.04, 2400 + 70 * (i % 4), 0.007), fr(fm), send=0.08)
place(thock(0.22, 190, 60, 0.08), fr(BLAST['snap']), send=0.16)
place(air(fr(18), 600, 7000, 0.06, 0.35), fr(BLAST['snap']), send=0.2)
place(riser(fr(14), 0.08, 280), fr(BLAST['snap'] - 8))
place(ping(midi(86), 0.16, 0.9), fr(BLAST['snap']), send=0.35, bus=KEYS)

# ================= 裂成五窗 =================
place(thock(0.28, 160, 48, 0.1), fr(SPLIT['at']), send=0.18)
place(cymbal(1.6, 0.12), fr(SPLIT['at']), send=0.16, bus=DRUM)
for m in (35, 47, 54, 57, 62):
    place(piano(midi(m), 1.0, 0.055), fr(SPLIT['at']), send=0.32, bus=KEYS)
place(air(fr(20), 400, 5200, 0.055, 0.4), fr(SPLIT['at']), send=0.18)
place(sub(midi(35), 1.1, 0.1), fr(SPLIT['at']))

# ================= 骨架：网格 / 字重 / 留白 =================
place(air(fr(16), 500, 4000, 0.055, 0.4), fr(BONE['grid']), send=0.2)
for i in range(5):
    place(tink(midi(81 + i * 2), 0.02, 0.22), fr(BONE['grid'] + i * 4), pan=-0.4 + 0.18 * i, send=0.3, bus=KEYS)
for i, m in enumerate((62, 66, 74)):
    place(piano(midi(m), 0.75, 0.07), fr(BONE['weight'] + i * 8), pan=-0.3 + 0.2 * i, send=0.35, bus=KEYS)
place(swell(fr(12), 0.06), fr(BONE['space']))
place(tink(midi(90), 0.024, 0.28), fr(BONE['space'] + 6), send=0.35, bus=KEYS)

# ================= 五种落地：每窗一声和弦，每删一下 tick =================
place(air(fr(14), 400, 4200, 0.05, 0.4), fr(AT['app'] - 4), send=0.16)
for m in (31, 50, 55, 59, 66):
    place(piano(midi(m), 0.85, 0.05), fr(AT['app']), send=0.28, bus=KEYS)
for k, fm in enumerate(APP['cuts']):
    place(tick(0.065, 2360 - 100 * k, 0.008), fr(fm), pan=0.3 - 0.08 * k, send=0.1)
    place(marimba(midi([81, 78, 76, 74, 73][k]), 0.1, 0.22), fr(fm), pan=0.25, send=0.24, bus=GROOVE)
place(ping(midi(86), 0.18, 1.1), fr(APP['keep']), send=0.42, bus=KEYS)

place(air(fr(12), 350, 4000, 0.05, 0.4), fr(AT['web'] - 4), send=0.14)
for m in (33, 52, 57, 61):
    place(piano(midi(m), 0.85, 0.05), fr(AT['web']), send=0.28, bus=KEYS)
for k, fm in enumerate(WEB['cuts']):
    place(tick(0.055, 2200 - 80 * k, 0.008), fr(fm), pan=-0.25 + 0.1 * k, send=0.1)
    place(pop(420 - 40 * k, 0.08), fr(fm), send=0.06)
place(ping(midi(88), 0.16, 1.0), fr(WEB['keep']), send=0.4, bus=KEYS)

place(air(fr(12), 400, 3200, 0.045, 0.4), fr(AT['pay'] - 4), send=0.14)
place(thock(0.2, 180, 55, 0.08), fr(AT['pay']), send=0.14)
for k, fm in enumerate(PAY['cuts']):
    place(tick(0.055, 2000 - 70 * k, 0.008), fr(fm), send=0.1)
    place(pop(360 - 30 * k, 0.07), fr(fm), send=0.05)
place(ping(midi(86), 0.2, 1.2), fr(PAY['keep']), send=0.42, bus=KEYS)
place(sub(midi(40), 0.9, 0.09), fr(PAY['keep']))

place(air(fr(12), 380, 3800, 0.045, 0.4), fr(AT['data'] - 4), send=0.14)
for m in (42, 50, 57, 66):
    place(piano(midi(m), 0.8, 0.05), fr(AT['data']), send=0.26, bus=KEYS)
for k, fm in enumerate(DATA['cuts']):
    place(tink(midi(79 + k * 2), 0.03, 0.2), fr(fm), pan=-0.2 + 0.15 * k, send=0.22, bus=KEYS)
place(ping(midi(90), 0.16, 1.0), fr(DATA['keep']), send=0.4, bus=KEYS)

# ================= 对照炸开再吸入 + 定妆 =================
place(thock(0.26, 170, 50, 0.09), fr(VS['at']), send=0.16)
place(tick(0.07, 1800, 0.01), fr(VS['split']), send=0.12)
place(piano(midi(74), 0.8, 0.06), fr(VS['split']), send=0.3, bus=KEYS)
for i in range(6):
    place(pop(180 + 40 * i, 0.09), fr(VS['boom'] + i * 2), pan=-0.6 + 0.2 * i, send=0.08)
place(swell(fr(18), 0.09), fr(VS['suck'] - 12))
place(ping(midi(86), 0.2, 1.2), fr(VS['suck']), send=0.4, bus=KEYS)
place(air(fr(16), 300, 3600, 0.05, 0.45), fr(POSTER['at'] - 4), send=0.18)
for m in (38, 50, 57, 61, 66):
    place(piano(midi(m), 1.4, 0.06), fr(POSTER['at']), send=0.4, bus=KEYS)
place(swell(fr(14), 0.08), fr(END - 16))

# ================= 片尾：回到那一个音 =================
FRAMES = CUE['frames']
place(ping(midi(86), 0.4, 2.8), fr(END), send=0.5, bus=KEYS)
place(ping(midi(74), 0.15, 2.4), fr(END), send=0.4, bus=KEYS)
place(ping(midi(93), 0.09, 1.6), fr(END + 8), pan=0.2, send=0.5, bus=KEYS)
place(sub(midi(38), 3.0, 0.12), fr(END))
for pan in (-0.7, 0.7):
    place(air(fr(28), 900, 6400, 0.045, 0.4), fr(END + 4), pan=pan, send=0.2)
for m in (38, 50, 57, 61, 64, 66, 69):
    place(piano(midi(m), 2.6, 0.07), fr(END), send=0.45, bus=KEYS)
for pn in (-0.6, 0.6):
    place(pad([midi(m) for m in (50, 57, 61, 64, 66)], fr(FRAMES - END), 0.28, att=0.15, rel=0.9, bright=0.85), fr(END), pan=pn, send=0.4, bus=KEYS)
for i, m in enumerate((78, 81, 85, 86)):
    place(piano(midi(m), 1.1, 0.06), fr(END + 12 + 3 * i), pan=-0.3 + 0.1 * i, send=0.45, bus=KEYS)
place(marimba(midi(74), 0.1, 0.45), fr(END + 24), pan=-0.3, send=0.35, bus=KEYS)
# 主题句最后一次，越来越轻
for k, m in enumerate((78, 81, 83, 81, 78)):
    place(marimba(midi(m), 0.055 * (1 - k / 6), 0.36), fr(END + 48 + k * 15), pan=-0.2 + 0.08 * k, send=0.35, bus=KEYS)
for k, fm in enumerate((END + 44, END + 48, END + 52)):
    place(tick(0.022, 2100 + 180 * k, 0.008), fr(fm), pan=-0.5 + 0.5 * k, send=0.2)
for k in range(int((FRAMES - 60 - END - 30) / 15)):
    fm = END + 30 + k * 15
    place(marimba(midi(62), 0.08 * (1 - k / 10) ** 1.4 * (1.0 if k % 2 == 0 else 0.7), 0.24), fr(fm), send=0.3, bus=KEYS)
place(ping(midi(93), 0.045, 1.8), fr(END + 150), pan=0.25, send=0.55, bus=KEYS)

# ================= 律动：Swiss 格子从第 0 拍立住，对照之后一层一层撤 =================
for b in range(0, int(DRUM_END // BEAT) + 1):
    fm = b * BEAT
    if fm >= DRUM_END:
        break
    kick_at(fm, 0.82 if b < 2 else 1.0)
for k in range(int(DRUM_END / S16)):
    fm = k * S16
    s = k % 4
    if s == 0:
        continue
    place(SHK * (0.075 if s == 2 else 0.048), fr(fm), pan=0.3 if s == 1 else -0.3, bus=DRUM)
for b in range(0, int(DRUM_END // BEAT) + 1):
    fm = b * BEAT
    if fm >= DRUM_END:
        break
    place(OHAT * (0.08 if b < 4 else 0.11), fr(fm + 15), pan=0.25, send=0.05, bus=DRUM)
    if b % 2 == 1:
        place(RIM * 0.11, fr(fm), pan=-0.1, send=0.12, bus=DRUM)
for k in range(int(BASS_END / 15)):
    fm = k * 15
    if fm >= BASS_END:
        continue
    c = chord_at(fm)
    r = c[2] + [0, 0, 7, 12][k % 4]
    place(sine_bass(midi(r), 0.2, 0.28 if fm < AT['app'] else 0.34), fr(fm), bus=GROOVE)
for k, (s, name, root, pv, mv) in enumerate(PROG):
    if not pv:
        continue
    e = PROG[k + 1][0] if k + 1 < len(PROG) else PAD_END
    e = min(e, PAD_END)
    if s >= PAD_END:
        break
    for pn in (-0.6, 0.6):
        place(pad([midi(m) for m in pv], fr(e - s), 0.3 if s < 600 else 0.34, att=0.05 if s > 120 else 0.3, rel=0.3,
                  bright=0.85 if s < 600 else 1.05), fr(s), pan=pn, send=0.3, bus=GROOVE)
PAT = [0, 1, 3, 1, 2, 0, 3, 1, 2, 3, 0, 2]


def ostinato(start, end, offset=0, pan=0.35, level=0.1, oct_=0):
    for k in range(int((end - start) / S16)):
        fm = start + k * S16
        if fm >= end:
            continue
        c = chord_at(fm)
        m = c[4][PAT[(k + offset) % 12]] + oct_
        acc = 1.0 if k % 2 == 0 else 0.72
        place(marimba(midi(m), level * acc, 0.26), fr(fm), pan=pan if k % 2 else -pan, send=0.25, bus=GROOVE)


ostinato(15, MAR_END, level=0.09)
ostinato(AT['split'] + S16, MAR_END, offset=1, pan=-0.55, level=0.07, oct_=12)

# ================= 侧链 =================
ks = np.array(sorted(KICKS))
idx = np.searchsorted(ks, tsec, side='right') - 1
since = np.where(idx >= 0, tsec - ks[np.clip(idx, 0, None)], 9.0)
x = np.clip(since / 0.22, 0, 1)
duck = 1 - 0.45 * (1 - x) ** 2
duck = np.where(since < 0.004, 1 - 0.45 * since / 0.004, duck)
GROOVE *= duck[None, :]


# ---------------- 混响 + 母带 ----------------
def reverb(x, seed, dec=0.9, length=3.0):
    t = tt(length)
    ir = np.random.default_rng(seed).standard_normal(len(t)) * np.exp(-t / dec)
    ir = onepole_lp(ir, 6000)
    ir[: int(0.025 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + len(ir)
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


mix = DRUM + GROOVE + CLU + KEYS + SFX
mix[0] += reverb(SEND[0], 1) * 0.6
mix[1] += reverb(SEND[1], 2) * 0.6
for ch in range(2):
    mix[ch] = hp(hp(mix[ch], 30), 30)
# 开场 0.22 秒暖一下，避免第 0 帧 tick 刺耳，但 Swiss 格子要马上听得见
warm_w = np.clip(1.0 - tsec / 0.22, 0, 1)
for ch in range(2):
    warm = onepole_lp(onepole_lp(mix[ch], 2200), 2200)
    mix[ch] = mix[ch] * (1 - 0.55 * warm_w) + warm * 0.55 * warm_w
mix = mix.T
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
fade = np.ones(N)
f0 = int(fr(FRAMES - 48) * SR)
fade[f0:] = np.linspace(1, 0, N - f0) ** 2
# 第 0 帧就是满屏噪音：6ms 的淡入，免得 AAC 在静音 → 重音的那一下冒出 +3dB 的过冲
n_in = int(0.006 * SR)
fade[:n_in] = np.sin(np.linspace(0, np.pi / 2, n_in)) ** 2
mix *= fade[:, None]

out_dir = os.path.normpath(os.path.join(HERE, '..', '..', '..', 'public', '007-minimalism'))
os.makedirs(out_dir, exist_ok=True)
final = os.path.join(out_dir, 'music.wav')


def write(path, y):
    with wave.open(path, 'wb') as wv:
        wv.setnchannels(2)
        wv.setsampwidth(2)
        wv.setframerate(SR)
        wv.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes())


def loudness(y):
    """用 ffmpeg 的 loudnorm 测一遍整体响度（LUFS）和真峰值"""
    tmp = final + '.measure.wav'
    write(tmp, y)
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True)
    os.remove(tmp)
    js = json.loads(r.stderr[r.stderr.rindex('{'): r.stderr.rindex('}') + 1])
    return float(js['input_i']), float(js['input_tp'])


def limit(y, ceil=0.78, win=0.008):
    """前瞻限幅：块内最小增益 → 盒式平滑，保证不过 ceil"""
    wn = int(win * SR)
    need = np.minimum(1.0, ceil / (np.abs(y).max(axis=1) + 1e-12))
    nb = -(-len(need) // wn)
    pad_ = np.ones(nb * wn)
    pad_[: len(need)] = need
    blk = pad_.reshape(nb, wn).min(axis=1)
    blk = np.minimum(blk, np.minimum(np.r_[1.0, blk[:-1]], np.r_[blk[1:], 1.0]))
    g = np.repeat(blk, wn)[: len(need)]
    c = np.cumsum(np.r_[0.0, g])
    h = wn // 2
    lo = np.clip(np.arange(len(g)) - h, 0, len(g))
    hi = np.clip(np.arange(len(g)) + h, 0, len(g))
    g = (c[hi] - c[lo]) / np.maximum(hi - lo, 1)
    return y * g[:, None]


if shutil.which('ffmpeg'):
    # 测响度 → 线性增益 → 限幅，重复几遍；真峰值超过 -2 dBTP 就把限幅天花板再压低一点（开场的“噗”高频多，采样间峰值偏高）
    # 留 2dB 而不是 1dB：成片和分享版各转一次 AAC，每次真峰值会再冒 0.5—1dB
    ceil = 0.78
    for _ in range(8):
        y = mix * 0.5
        for _ in range(3):
            i, _tp = loudness(y)
            y = limit(y * 10 ** ((-14.0 - i) / 20), ceil)
        i, tp = loudness(y)
        if tp <= -2.0 and abs(i + 14) < 0.2:
            break
        ceil *= 10 ** ((min(-2.0 - tp, -0.1)) / 20)
    print('loudness %.2f LUFS · true peak %.2f dBTP' % (i, tp))
    write(final, y)
else:
    write(final, mix * 0.89)
print('wrote', final)
