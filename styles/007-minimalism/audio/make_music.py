"""
Design Style · 风格 007 · 极简主义 Minimalism —— 配乐与音效（纯代码合成，无外部音源）

一首完整的 15 秒小曲：120 BPM（1 拍 = 0.5 秒 = 30 帧）· D 大调。整首曲子也在做“减法”：
先是一墙噪音，删到只剩一个音；然后一层一层加回来（只加必要的）；最后再一层一层删掉，回到那一个音。
  0–0.5s     噪音：147 样东西被删，每删一样一声“噗”，底下一层广告歌似的乱码越来越薄 → 0.5s 一个点：一声纯音（全片的“点”的声音）
  0.5–2s     一个音：D 的八分音符脉冲（Reich 式），每过一拍加一个音；标题十个字母十声细响；上升 → 2s
  2–4s       01 负空间：毡槌底鼓 + 正弦贝斯进来；八面墙八声木头“咚”（调在和弦音上）；点走八步 = 八个马林巴音（第一句旋律）；
             平面立起来时一阵上扬，八根柱子八声玻璃“嘀”，3.5s 屋顶板落下一记和弦
  4–6s       02 删减：收音机一冒出来，47 个声部同时响成一团不协和的音簇——每删掉一样东西，它的那个声部就停（外加一声“嗒”）；
             删到最后只剩旋钮的纯五度 G–D
  6–8s       03 功能：整首曲子先像从小喇叭里出来（带通 + 一点底噪）；旋钮六个凹槽六声“咔”→ 7s 开机：全频段、拍手、开镲、低音全部打开
  8–10s      04 重复：十个盒子 = 十个上行的马林巴音；第二支马林巴晚一个十六分音符进来（相位）；点往回跳 = 下行的应答
  10–12s     05 今天：手机亮起；10.5s 开关“咔哒”+ 点的纯音；删四样东西四个下行音；毡钢琴的一句旋律
  12–13s     回顾：12s 全曲最满的一拍 → 四个年代每删一个，乐队就少一件：鼓 → 贝斯 → 马林巴 → Pad，最后只剩一口吸气
  13–15s     片尾：一个点 = 那一声纯音；Dmaj9 的长和弦慢慢散掉
所有时间点读自 cues.json（由 export_cues.mjs 从 video/cues.ts 导出），与画面逐帧对齐（帧 / 60 = 秒）。

用法：python3 styles/007-minimalism/audio/make_music.py
输出：public/007-minimalism/music.wav（响度 -14 LUFS，真峰值 < -1 dBTP）
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
DUR = 15.0
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
    """音簇里的一个声部：有点刺耳的方波（广告歌、电子玩具的音色），删掉的瞬间 15ms 收尾"""
    t = tt(d + 0.02)
    y = np.zeros_like(t)
    vib = 1 + 0.006 * np.sin(2 * np.pi * (4.5 + rng.random() * 2) * t + rng.random() * 6)
    ph = glide(freq * vib)
    for h in range(1, nh * 2, 2):
        if freq * h > 9000:
            break
        y += np.sin(h * ph) / h
    env = np.minimum(1, t / 0.006) * np.where(t < d, 1, np.exp(-(t - d) / 0.004))
    return y * env * level


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
    """被删掉的那一下：极短的下滑正弦“噗”"""
    t = tt(0.05)
    f = freq * (0.45 + 0.55 * np.exp(-t / 0.008))
    return np.sin(glide(f)) * np.minimum(1, t / 0.0006) * np.exp(-t / 0.012) * level


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
# [起始帧, 名字, 贝斯根音, Pad 声部, 马林巴用的四个音]
PROG = [
    (120, 'Dmaj7', 38, [50, 57, 61, 66], [62, 66, 69, 73]),
    (180, 'Bm7', 35, [47, 54, 57, 62], [59, 62, 66, 69]),
    (240, 'cluster', None, [], []),
    (330, 'G5', 31, [43, 50, 55, 62], [67, 74, 79, 74]),
    (360, 'Em9', 40, [52, 55, 59, 66], [64, 67, 71, 74]),
    (420, 'A', 33, [52, 57, 61, 64], [69, 73, 76, 81]),
    (480, 'Gmaj7', 31, [50, 55, 59, 66], [67, 71, 74, 78]),
    (540, 'A6', 33, [52, 57, 61, 66], [69, 73, 76, 78]),
    (600, 'Bm9', 35, [50, 54, 57, 61], [71, 74, 78, 73]),
    (660, 'Gmaj9', 31, [50, 55, 59, 64], [67, 71, 74, 76]),
    (690, 'Asus4', 33, [52, 57, 62, 64], [69, 74, 76, 81]),
    (720, 'D/F#', 42, [50, 57, 62, 66], [74, 78, 81, 85]),
]
ERA = CUE['finale']['eraCuts']  # 回顾：每删一个年代，乐队少一件
DRUM_END, BASS_END, MAR_END, PAD_END = ERA
END = CUE['finale']['end']


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


# ================= 开场 0–30：噪音，删到只剩一个点 =================
clutter = sorted(CUE['opening']['clutter'])
LAND = CUE['opening']['land']
n_total = len(clutter)
# 每删一样东西：一声随机音高的“噗”，声像跟着它在画面上的位置走（越晚删的越靠中间）
for k, t0 in enumerate(clutter):
    pan = rng.uniform(-0.9, 0.9) * (1 - t0 / 30)
    place(pop(rng.uniform(500, 3200), 0.17 + 0.06 * rng.random()), fr(t0 + 2), pan=pan, send=0.05)
# 底下一层“广告歌”乱码：方波快速乱弹 + 电视雪花 + 低频嗡嗡；音量 = 还剩多少东西
remain = np.ones(N)
tsec = np.arange(N) / SR
for t0 in clutter:
    remain -= (tsec >= fr(t0 + 3)) / n_total
remain = np.clip(remain, 0, 1)
remain[tsec >= fr(LAND - 1)] = 0
bed = np.zeros(int(fr(LAND) * SR))
for _ in range(14):  # 14 支“广告歌”，各自乱弹
    t0 = 0.0
    while t0 < fr(LAND):
        d = rng.choice([0.035, 0.05, 0.07])
        m = rng.integers(60, 96)
        v = voice(midi(m), d, 0.05, nh=5)
        i = int(t0 * SR)
        seg = v[: len(bed) - i]
        bed[i : i + len(seg)] += seg
        t0 += d
static = hp(noise(fr(LAND)), 2500) * 0.18
hum = np.sin(2 * np.pi * 100 * tt(fr(LAND))) * 0.08 + np.sin(2 * np.pi * 150 * tt(fr(LAND))) * 0.05
chaos = (bed + static + hum) * remain[: len(bed)] ** 1.4
for ch, sh in ((0, 0), (1, 97)):
    SFX[ch, : len(chaos)] += np.roll(chaos, sh) * 2.0
# “MORE!” 缩成一个点：往下拧的一声
t = tt(fr(12))
place(np.sin(glide(1400 * 2 ** (-3 * t / t[-1]))) * (t / t[-1]) * 0.12, fr(LAND - 12), send=0.2)
# 30：一个点 —— 一声纯音（D6）+ 一点点低音；第二圈涟漪高五度
place(ping(midi(86), 0.32, 1.6), fr(LAND), send=0.45, bus=KEYS)
place(ping(midi(74), 0.18, 1.2), fr(LAND), send=0.3, bus=KEYS)
place(sub(midi(38), 1.2, 0.1), fr(LAND))
place(ping(midi(93), 0.12, 1.0), fr(LAND + 8), pan=0.2, send=0.5, bus=KEYS)

# ================= 30–120：一个音 =================
# D 的八分音符脉冲：先只有一个 D，每过一拍多一个音（D → D+A → D+A+D → +F#）
LAYERS = [(LAND, 62), (60, 69), (75, 74), (90, 66), (105, 73)]
for k in range(int((120 - LAND) / 15)):
    fm = LAND + k * 15
    for st, m in LAYERS:
        if fm >= st:
            acc = 1.0 if k % 2 == 0 else 0.7
            place(marimba(midi(m), 0.13 * acc, 0.22), fr(fm), pan=(m - 68) / 30, send=0.25, bus=GROOVE)
# 34–60：地平线从点向两边画出去——空气声从中间往两边散开
for pan in (-0.7, 0.7):
    place(air(fr(28), 1200, 9000, 0.05, 0.4), fr(34), pan=pan, send=0.2)
# 44–66：MINIMALISM 十个字母十声细响（D 大五声往上）；极简主义四个字四声毡钢琴
PENTA = [74, 76, 78, 81, 83, 86, 88, 90, 93, 95]
for i in range(10):
    place(tink(midi(PENTA[i]), 0.022, 0.25), fr(44 + 2.2 * i), pan=-0.5 + 0.1 * i, send=0.4, bus=KEYS)
for i, m in enumerate([62, 66, 69, 74]):
    place(piano(midi(m), 0.8, 0.07), fr(54 + 3 * i), pan=-0.3, send=0.35, bus=KEYS)
place(piano(midi(78), 1.0, 0.06), fr(62), pan=0.35, send=0.4, bus=KEYS)  # Less is more.
for fm, pn in ((36, -0.4), (40, 0.4), (70, 0.4), (76, -0.4), (80, 0.4)):  # 四角的小字
    place(tick(0.025, 3400, 0.006), fr(fm), pan=pn, send=0.15)
place(sub(midi(38), 2.0, 0.05), fr(60))
# 96–120：上升 → 2s
place(riser(fr(24), 0.16, 294), fr(96), send=0.3)
place(swell(fr(12), 0.08), fr(108))

# ================= 01 负空间 120–240 =================
SP = CUE['space']
# 八面墙：八声木头“咚”，音高落在和弦音上
for k, (fm, m) in enumerate(zip(SP['walls'], [38, 45, 42, 50, 47, 45, 52, 49])):
    place(thock(0.32, midi(m) * 3.2, midi(m), 0.09), fr(fm), pan=-0.5 + k * 0.14, send=0.15)
# 两个水池：水滴般的“咕”
for fm, f0 in ((132, 520), (146, 700)):
    t = tt(0.12)
    place(np.sin(glide(f0 * (1 + 1.2 * (1 - np.exp(-t / 0.03))))) * np.exp(-t / 0.035) * 0.06, fr(fm), pan=-0.4 if f0 < 600 else 0.6, send=0.4)
# 点走八步：八个马林巴音（全片第一句旋律）
STEP_MEL = [78, 81, 83, 81, 86, 85, 81, 78]
for k, (fm, m) in enumerate(zip(SP['steps'], STEP_MEL)):
    place(marimba(midi(m), 0.16, 0.35), fr(fm), pan=-0.3 + 0.08 * k, send=0.3, bus=KEYS)
    place(marimba(midi(m - 12), 0.06, 0.3), fr(fm), pan=0.2, send=0.2, bus=KEYS)
# 平面立起来：一阵上扬；八根柱子八声玻璃“嘀”往上爬
place(air(fr(34), 300, 5000, 0.07, 0.7), fr(174), send=0.3)
for k, fm in enumerate(SP['columns']):
    place(tink(midi(81 + [0, 2, 4, 7, 9, 12, 14, 16][k]), 0.03, 0.3), fr(fm), pan=-0.4 + 0.11 * k, send=0.4, bus=KEYS)
# 屋顶板落下（210）：一记低音 + Bm9 毡钢琴和弦
place(thock(0.45, 160, 48, 0.12), fr(SP['roofLand']), send=0.25)
for m in (47, 54, 61, 66, 69):
    place(piano(midi(m), 1.0, 0.07), fr(SP['roofLand']), send=0.4, bus=KEYS)
# 交棒：屋顶板转正成收音机，点划一道弧 —— 一声往上滑的纯音
place(air(fr(16), 400, 6000, 0.08, 0.6), fr(SP['pass']), pan=0.2, send=0.2)
t = tt(fr(16))
place(np.sin(glide(midi(74) * 2 ** (t / t[-1] * 5 / 12 + 0.0))) * np.sin(np.pi * t / t[-1]) * 0.05, fr(SP['pass']), send=0.4, bus=KEYS)

# ================= 02 删减 240–360：音簇 =================
RA = CUE['radio']
cuts = RA['cuts']
POP_IN = 240
# 47 个声部，从 G2 到 G5 随机分（不协和）；每个声部活到它对应的那样东西被删掉为止
pitches = rng.permutation(np.arange(43, 92))[: len(cuts)]
for k, (tc, m) in enumerate(zip(cuts, pitches)):
    st = POP_IN - 1 + rng.random() * 10
    d = fr(tc) - fr(st)
    place(voice(midi(m), d, 0.04, nh=6), fr(st), pan=rng.uniform(-0.8, 0.8), send=0.12, bus=CLU)
    place(tick(0.05, 1800 + 30 * (m - 43), 0.008), fr(tc), pan=rng.uniform(-0.5, 0.5), send=0.1)
# 冒出来的那一下：弹簧似的“嘣”+ 一记重音
t = tt(0.4)
place(np.sin(glide(180 + 220 * np.exp(-t / 0.05) * (1 + 0.3 * np.sin(2 * np.pi * 14 * t)))) * np.exp(-t / 0.12) * 0.18, fr(POP_IN), send=0.2)
place(thock(0.4, 220, 60, 0.1), fr(POP_IN), send=0.2)
# 最后两下慢下来：纸盆拆到底
place(thock(0.3, 300, 90, 0.06), fr(RA['lastRing']), send=0.2)
place(thock(0.38, 260, 70, 0.08), fr(RA['lastCut']), send=0.25)
# 剩下的那个旋钮：纯五度 G–D，从 240 一直在音簇里，最后只剩它
for m, pn in ((55, -0.2), (62, 0.2)):
    t = tt(fr(130))
    y = (np.sin(2 * np.pi * midi(m) * t) + 0.15 * np.sin(4 * np.pi * midi(m) * t)) * np.minimum(1, t / 0.02) * np.minimum(1, (t[-1] - t) / 0.1)
    place(y * 0.06, fr(POP_IN), pan=pn, send=0.3, bus=KEYS)
# 点落在旋钮上
place(ping(midi(86), 0.14, 0.9), fr(POP_IN), pan=0.3, send=0.4, bus=KEYS)

# ================= 03 功能 360–480 =================
for k, fm in enumerate((366, 381, 392)):  # 三根引线：孔 / 圆 / 橙（橙 = 点的那一声）
    if k < 2:
        place(tink(midi([83, 88][k]), 0.05, 0.4), fr(fm + 8), pan=0.5, send=0.45, bus=KEYS)
    else:
        place(ping(midi(86), 0.13, 1.0), fr(fm + 8), pan=0.5, send=0.4, bus=KEYS)
    place(air(fr(14), 2000, 9000, 0.02, 0.3), fr(fm), pan=0.5)
for k, fm in enumerate(RA['detents']):  # 旋钮六个凹槽
    place(click(0.12, 1500 + 120 * k), fr(fm), pan=0.25, send=0.1)
    place(tick(0.05, 4200, 0.004), fr(fm + 0.5), pan=0.3)
ON = RA['on']
place(thock(0.5, 140, 42, 0.16), fr(ON), send=0.2)  # 开机
place(CYM * 0.16, fr(ON), send=0.3)
place(sub(midi(33), 1.0, 0.25), fr(ON))
# 452–468：孔一排一排删掉，像一阵小雨；旋钮缩没；机身压扁成盒子
OUT3 = RA['out']
for i in range(11):
    for j in range(7):
        if rng.random() < 0.5:
            place(tick(0.018, 3000 + 200 * rng.random(), 0.004), fr(OUT3 + 2 + (i + j) * 0.6 + 2), pan=-0.6 + i * 0.12)
place(thock(0.25, 400, 120, 0.05), fr(OUT3 + 8), pan=0.2)
place(air(fr(24), 300, 3000, 0.07, 0.3), fr(OUT3 + 4), send=0.2)

# ================= 04 重复 480–600 =================
JU = CUE['judd']
SCALE = [62, 64, 66, 67, 69, 71, 73, 74, 76, 78]
for k, fm in enumerate(JU['units']):  # 十个盒子 = 十个上行的音
    place(marimba(midi(SCALE[k] + 12), 0.15, 0.3), fr(fm), pan=0.15, send=0.3, bus=KEYS)
    place(knock(240 + 12 * k, 0.07), fr(fm), pan=0.1, send=0.15)
for k, (fm, m) in enumerate(zip(JU['down'], [85, 83, 81, 78, 76])):  # 点往回跳：下行的应答
    place(marimba(midi(m), 0.14, 0.32), fr(fm), pan=-0.2, send=0.3, bus=KEYS)
    place(tink(midi(m + 12), 0.02, 0.25), fr(fm), pan=-0.3, send=0.4, bus=KEYS)
for k in range(9):  # 九个盒子缩回墙里
    place(knock(420 - 25 * k, 0.04), fr(JU['retract'] + 2 + k * 1.5), pan=-0.4 + 0.1 * k)
place(air(fr(20), 600, 4000, 0.05, 0.8), fr(JU['retract']), send=0.2)

# ================= 05 今天 600–720 =================
TO = CUE['today']
place(air(fr(26), 300, 5000, 0.08, 0.4), fr(JU['phone'] - 4), send=0.25)  # 盒子立起来变成手机
for m in (47, 54, 61, 66, 69, 73):
    place(piano(midi(m), 1.4, 0.06), fr(JU['phone']), send=0.4, bus=KEYS)
for k, fm in enumerate((612, 620, 624, 628, 632, 636)):  # 屏幕亮起、界面一样一样出来
    place(tink(midi(90 + [0, 2, 4, 7, 9, 12][k]), 0.015, 0.2), fr(fm), pan=0.4, send=0.35, bus=KEYS)
TAP = TO['tap']
place(click(0.22, 2600), fr(TAP), pan=0.35, send=0.1)  # 开关“咔哒”
place(click(0.1, 1900), fr(TAP + 3), pan=0.35)
place(ping(midi(86), 0.2, 1.2), fr(TAP), pan=0.35, send=0.45, bus=KEYS)
for k, (fm, m) in enumerate(zip(TO['cuts'], [81, 78, 76, 74])):  # 删四样东西
    place(tick(0.07, 2400 - 150 * k, 0.008), fr(fm), pan=0.4, send=0.1)
    place(marimba(midi(m), 0.1, 0.25), fr(fm), pan=0.35, send=0.3, bus=KEYS)
place(air(fr(22), 500, 3000, 0.04, 0.5), fr(684), pan=0.3)  # 剩下的居中
# 一句毡钢琴旋律（左手是和弦，右手四个音）
for fm, m, d in ((642, 78, 0.5), (657, 76, 0.25), (664.5, 74, 0.25), (672, 73, 0.6), (690, 76, 0.4), (705, 74, 0.6)):
    place(piano(midi(m), d, 0.12), fr(fm), pan=-0.15, send=0.4, bus=KEYS)

# ================= 回顾 704–780 =================
RC = TO['recap']
place(air(fr(28), 200, 7000, 0.14, 0.5), fr(RC), send=0.25)  # 往后拉
place(riser(fr(16), 0.12, 440), fr(RC))
place(CYM * 0.3, fr(720), send=0.35)  # 全曲最满的一拍
place(sub(midi(30), 1.2, 0.3), fr(720))
for m in (42, 50, 57, 62, 66, 69, 74):
    place(piano(midi(m), 1.2, 0.07), fr(720), send=0.4, bus=KEYS)
place(ping(midi(90), 0.08, 1.0), fr(720), send=0.5, bus=KEYS)
for k, m in enumerate((74, 78, 81, 86)):  # 四个年份
    place(tink(midi(m + 12), 0.03, 0.3), fr(RC + 18 + k * 2.5), pan=-0.6 + 0.4 * k, send=0.4, bus=KEYS)
for k, fm in enumerate(ERA):  # 每删一个年代：一声“嗒”（乐队少一件在下面的律动里）
    place(tick(0.09, 2000 - 200 * k, 0.01), fr(fm), pan=-0.6 + 0.4 * k, send=0.15)
    place(pop(900 - 120 * k, 0.12), fr(fm), pan=-0.6 + 0.4 * k)
place(swell(fr(14), 0.12), fr(END - 14))  # 线收回一个点：一口吸气，掐断

# ================= 片尾 780–900：回到那一个音 =================
place(ping(midi(86), 0.42, 2.4), fr(END), send=0.5, bus=KEYS)
place(ping(midi(74), 0.16, 2.0), fr(END), send=0.4, bus=KEYS)
place(ping(midi(93), 0.1, 1.4), fr(END + 8), pan=0.2, send=0.5, bus=KEYS)
place(sub(midi(38), 2.4, 0.12), fr(END))
for pan in (-0.7, 0.7):  # 地平线再画一遍
    place(air(fr(28), 1200, 9000, 0.05, 0.4), fr(END + 4), pan=pan, send=0.2)
# Dmaj9：毡钢琴 + Pad，长长地散掉
for m in (38, 50, 57, 61, 64, 66, 69):
    place(piano(midi(m), 2.0, 0.075), fr(END), send=0.45, bus=KEYS)
for pn in (-0.6, 0.6):
    place(pad([midi(m) for m in (50, 57, 61, 64, 66)], fr(900 - END), 0.3, att=0.1, rel=0.6, bright=1.0), fr(END), pan=pn, send=0.4, bus=KEYS)
# 少即是多：四个字四个音；Less is more. 一声马林巴；页脚三声细响
for i, m in enumerate((78, 81, 85, 86)):
    place(piano(midi(m), 0.9, 0.065), fr(END + 12 + 3 * i), pan=-0.3 + 0.1 * i, send=0.45, bus=KEYS)
place(marimba(midi(74), 0.1, 0.4), fr(END + 24), pan=-0.3, send=0.35, bus=KEYS)
for k, fm in enumerate((END + 44, END + 48, END + 52)):
    place(tick(0.03, 3000 + 300 * k, 0.006), fr(fm), pan=-0.5 + 0.5 * k, send=0.2)
# 和开场一样的 D 八分音符脉冲，越来越轻（首尾呼应）
for k in range(int((870 - END - 30) / 15)):
    fm = END + 30 + k * 15
    place(marimba(midi(62), 0.09 * (1 - k / 7) ** 1.5 * (1.0 if k % 2 == 0 else 0.7), 0.22), fr(fm), send=0.3, bus=KEYS)
place(ping(midi(98), 0.05, 1.5), fr(864), pan=0.3, send=0.6, bus=KEYS)

# ================= 律动 120–765：一层一层加，最后一层一层删 =================
# 毡槌底鼓：每拍；02 的音簇里也不停（脉搏不断）
for b in range(4, int(DRUM_END // BEAT) + 1):
    fm = b * BEAT
    if fm >= DRUM_END:
        break
    kick_at(fm, 0.85 if 240 <= fm < 330 else 1.0)
# 沙锤：十六分音符，150 起；开机（420）后加反拍开镲和 2 / 4 拍边击
for k in range(int((DRUM_END - 150) / S16)):
    fm = 150 + k * S16
    s = k % 4
    if s == 0:
        continue
    place(SHK * (0.07 if s == 2 else 0.045), fr(fm), pan=0.3 if s == 1 else -0.3, bus=DRUM)
for b in range(int(ON // BEAT), int(DRUM_END // BEAT) + 1):
    fm = b * BEAT
    if fm >= DRUM_END:
        break
    place(OHAT * 0.1, fr(fm + 15), pan=0.25, send=0.05, bus=DRUM)
    if b % 2 == 1:
        place(RIM * 0.13, fr(fm), pan=-0.1, send=0.12, bus=DRUM)
# 贝斯：八分音符（根音 / 根音 / 五度 / 八度），音簇时休息
for k in range(int((BASS_END - 120) / 15)):
    fm = 120 + k * 15
    if fm >= BASS_END or 240 <= fm < 330:
        continue
    c = chord_at(fm)
    r = c[2] + [0, 0, 7, 12][k % 4]
    place(sine_bass(midi(r), 0.2, 0.34 if fm >= ON else 0.28), fr(fm), bus=GROOVE)
# Pad：每个和弦一段，音簇时休息
for k, (s, name, root, pv, mv) in enumerate(PROG):
    if not pv:
        continue
    e = PROG[k + 1][0] if k + 1 < len(PROG) else PAD_END
    e = min(e, PAD_END)
    if s >= PAD_END:
        break
    for pn in (-0.6, 0.6):
        place(pad([midi(m) for m in pv], fr(e - s), 0.3 if s < 600 else 0.36, att=0.05 if s > 120 else 0.3, rel=0.3,
                  bright=0.8 if s < ON else 1.1), fr(s), pan=pn, send=0.3, bus=GROOVE)
# 马林巴：十二个十六分音符一圈的固定音型（Reich 式，和四拍错开）；04 起第二支晚一个十六分音符（相位）
PAT = [0, 1, 3, 1, 2, 0, 3, 1, 2, 3, 0, 2]


def ostinato(start, end, offset=0, pan=0.35, level=0.1, oct_=0):
    for k in range(int((end - start) / S16)):
        fm = start + k * S16
        if fm >= end or 240 <= fm < 330:
            continue
        c = chord_at(fm)
        m = c[4][PAT[(k + offset) % 12]] + oct_
        acc = 1.0 if k % 2 == 0 else 0.72
        place(marimba(midi(m), level * acc, 0.26), fr(fm), pan=pan if k % 2 else -pan, send=0.25, bus=GROOVE)


ostinato(204, MAR_END)
ostinato(JU['units'][0] + S16, MAR_END, offset=1, pan=-0.55, level=0.07, oct_=12)

# ================= 侧链 + 03 的“小喇叭” =================
ks = np.array(sorted(KICKS))
idx = np.searchsorted(ks, tsec, side='right') - 1
since = np.where(idx >= 0, tsec - ks[np.clip(idx, 0, None)], 9.0)
x = np.clip(since / 0.22, 0, 1)
duck = 1 - 0.45 * (1 - x) ** 2
duck = np.where(since < 0.004, 1 - 0.45 * since / 0.004, duck)
GROOVE *= duck[None, :]

# 03：开机之前，律动像从一个小喇叭里出来（带通 300–2800Hz + 饱和 + 一点底噪）；开机那一帧全部打开
w = np.clip((tsec - fr(344)) / fr(12), 0, 1) * (tsec < fr(ON))
for bus in (GROOVE, DRUM):
    for ch in range(2):
        band = onepole_lp(hp(hp(bus[ch], 320), 320), 2800)
        band = np.tanh(band * 3.0) / 1.5
        bus[ch] = bus[ch] * (1 - w) + band * w
crackle = hp(noise(DUR), 3000) * 0.012 * (rng.random(N) < 0.004) * 20 + hp(noise(DUR), 4000) * 0.006
for ch in range(2):
    SFX[ch] += crackle * w


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
mix = mix.T
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
fade = np.ones(N)
f0 = int(fr(870) * SR)
fade[f0:] = np.linspace(1, 0, N - f0) ** 2
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
    # 测响度 → 线性增益 → 限幅，重复几遍；真峰值超过 -1.2 dBTP 就把限幅天花板再压低一点（开场的“噗”高频多，采样间峰值偏高）
    ceil = 0.78
    for _ in range(6):
        y = mix * 0.5
        for _ in range(3):
            i, _tp = loudness(y)
            y = limit(y * 10 ** ((-14.0 - i) / 20), ceil)
        i, tp = loudness(y)
        if tp <= -1.2 and abs(i + 14) < 0.2:
            break
        ceil *= 10 ** ((min(-1.2 - tp, -0.1)) / 20)
    print('loudness %.2f LUFS · true peak %.2f dBTP' % (i, tp))
    write(final, y)
else:
    write(final, mix * 0.89)
print('wrote', final)
