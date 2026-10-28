"""
Design Style · 风格 014 · 液态玻璃 Liquid Glass —— 配乐与音效（纯代码合成，无外部音源）

120 BPM 直拍（1 拍 = 0.5 秒 = 30 帧；全片不变速）· 20 秒 = 10 小节 · D 大调
声部：玻璃拨奏（FM，十六分音符琶音）、温暖铺底、亚低音贝斯、轻底鼓、拍手、闭镲、玻璃铃。
  0–2.5s     开场：只有铺底与玻璃铃，一滴玻璃滚过字墙
  2.5–6.5s   01 弯光：f150 甩镜（风声）后鼓进来 · 压平（下滑音）· 加坡（上滑音）· 色散（左右失谐的闪光）
  6.5–10.5s  02 二十五年：五个年代各一个音色——Aqua 气泡 / Aero 风铃 / iOS 7 轻点 / Glassmorphism 闪光 / Liquid Glass 玻璃铃 + 一记“咚”
  10.5–13.5s 03 融合：一分三（左中右三声“啵”）· 两滴合一（黏稠的“咕” + 咚）· 菜单展开（上扬）+ 三项依次“嗒”
  13.5–18s   04 界面：标签栏、按钮弹出 · 字变色时一声轻点
  18–20s     片尾：鼓退下，只剩铺底与玻璃铃；余音折回开头，循环无缝
所有时间点与 video/glass.ts、video/timeline.ts 的关键帧对齐（帧 / 60 = 秒）。

用法：python3 styles/014-liquid-glass/audio/make_music.py
输出：public/014-liquid-glass/music.wav（响度 −14 LUFS，真峰值 < −1 dBTP）
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
rng = np.random.default_rng(14)

MUS = np.zeros((2, N))
SFX = np.zeros((2, N))
SEND = np.zeros((2, N))

AT = {'open': 0, 'bend': 150, 'eras': 390, 'merge': 630, 'ui': 810, 'end': 1080}
ERA_AT = [AT['eras'] + 14 + 46 * k for k in range(5)]
PANS = [150, 390, 630, 810, 1095]  # 甩镜的中点
BEAT = 30


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
    bus[0, i: i + len(sig)] += sig * gl
    bus[1, i: i + len(sig)] += sig * gr
    if send:
        SEND[0, i: i + len(sig)] += sig * gl * send
        SEND[1, i: i + len(sig)] += sig * gr * send


def sfx(sig, t, gain=1.0, pan=0.0, send=0.3):
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


def sweep_lp(x, c0, c1):
    c = np.geomspace(c0, c1, len(x))
    a = np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


# ───────── 乐器 ─────────

def pluck(m, level=1.0, dec=0.32, bright=1.0):
    """玻璃拨奏：FM，调制比 3.5（不和谐的泛音 = 玻璃味），调制指数随时间收"""
    f0 = midi(m)
    t = tt(dec * 4)
    idx = 2.2 * bright * np.exp(-t / 0.05)
    y = np.sin(2 * np.pi * f0 * t + idx * np.sin(2 * np.pi * 3.5 * f0 * t))
    y += 0.25 * np.sin(2 * np.pi * 2 * f0 * t) * np.exp(-t / (dec * 0.5))
    return y * np.minimum(1, t / 0.002) * np.exp(-t / dec) * level * 0.16


def glass_bell(m, level=1.0, dec=1.6):
    """玻璃铃：玻璃杯的泛音比（1 : 2.32 : 4.25 : 6.63），高泛音先消失"""
    f0 = midi(m)
    t = tt(dec * 3)
    y = np.zeros_like(t)
    for r, a, k in ((1, 1, 1), (2.32, 0.5, 0.6), (4.25, 0.3, 0.35), (6.63, 0.15, 0.2)):
        y += a * np.sin(2 * np.pi * f0 * r * t + r) * np.exp(-t / (dec * k))
    return y * np.minimum(1, t / 0.001) * level * 0.2


def pad(ms, d, level=1.0, att=0.6, rel=1.2):
    t = tt(d + rel * 3)
    y = np.zeros_like(t)
    for m in ms:
        for det in (-0.08, 0.0, 0.09):
            f0 = midi(m + det)
            for n in range(1, 5):
                y += (1 / n ** 1.8) * np.sin(2 * np.pi * n * f0 * t + rng.random() * 6)
    e = np.minimum(1, t / att) * np.where(t < d, 1.0, np.exp(-(t - d) / rel))
    y = fft_filter(y, hi=3200)
    return y * e * level * 0.03 / np.sqrt(len(ms))


def sub(m, d, level=1.0):
    f0 = midi(m)
    t = tt(d + 0.1)
    y = np.sin(2 * np.pi * f0 * t) + 0.15 * np.sin(4 * np.pi * f0 * t)
    e = np.minimum(1, t / 0.01) * np.where(t < d, 1.0, np.exp(-(t - d) / 0.05)) * (0.75 + 0.25 * np.exp(-t / 0.15))
    return y * e * level * 0.32


def kick(level=1.0):
    t = tt(0.4)
    f = 44 + 90 * np.exp(-t / 0.03)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18)
    y[: int(0.004 * SR)] += fft_filter(rng.standard_normal(int(0.004 * SR)), lo=1500) * 0.2
    return y * level * 0.55


def clap(level=1.0):
    t = tt(0.25)
    e = sum(np.exp(-np.maximum(0, t - d) / 0.008) * (t >= d) for d in (0, 0.009, 0.018)) + 0.6 * np.exp(-np.maximum(0, t - 0.027) / 0.06) * (t >= 0.027)
    return fft_filter(rng.standard_normal(len(t)), lo=900, hi=6000) * e * level * 0.12


def hat(level=1.0, d=0.05):
    t = tt(d * 3)
    return fft_filter(rng.standard_normal(len(t)), lo=7000) * np.exp(-t / d) * level * 0.07


def whoosh(d=0.7, c0=300, c1=7000, level=1.0, peak=0.5):
    t = tt(d)
    e = np.sin(np.pi * np.clip(t / d, 0, 1) ** (np.log(0.5) / np.log(peak))) ** 2
    return sweep_lp(rng.standard_normal(len(t)), c0, c1) * e * level * 0.4


def thud(level=1.0, f0=110, f1=45):
    t = tt(0.5)
    f = f1 + (f0 - f1) * np.exp(-t / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.15) * level * 0.6


def bloop(m, level=1.0, up=False, d=0.16):
    """水滴：正弦的音高快速滑动（下落 = 掉下来，上扬 = 冒出来）"""
    t = tt(d * 2.5)
    f0 = midi(m)
    f = f0 * (1 + (0.9 if up else -0.45) * (1 - np.exp(-t / 0.03)))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / d) * np.minimum(1, t / 0.002)
    return y * level * 0.28


def goo(level=1.0):
    """两滴合一：两段下滑的“啵”搭一个低频的“咕”"""
    t = tt(0.45)
    f = 330 * np.exp(-t / 0.12) + 90
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12)
    y += 0.4 * np.sin(2 * np.pi * np.cumsum(f * 2.02) / SR) * np.exp(-t / 0.06)
    return y * np.minimum(1, t / 0.004) * level * 0.3


def click(level=1.0):
    t = tt(0.03)
    return fft_filter(rng.standard_normal(len(t)), lo=2000, hi=9000) * np.exp(-t / 0.004) * level * 0.25


def glide(m0, m1, d, level=1.0):
    """滑音：bevel 压平 / 加坡时的音高"""
    t = tt(d)
    f = midi(m0) * (midi(m1) / midi(m0)) ** (t / d)
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.6
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(2 * np.pi * np.cumsum(f * 2) / SR)
    return y * e * level * 0.07


def shimmer(d=0.7, level=1.0):
    """色散：同一个音左右各失谐一点，像光被拆开"""
    out = []
    for det in (-0.35, 0.35):
        t = tt(d)
        f = midi(93 + det)
        out.append(np.sin(2 * np.pi * f * t) * np.sin(np.pi * np.clip(t / d, 0, 1)) * level * 0.05)
    return out


# ───────── 和声（每小节 120 帧，全片 120 BPM 不变速）─────────
CH = {
    'D': (38, [62, 66, 69, 73, 76]),  # Dmaj9
    'Bm': (35, [62, 66, 69, 73]),  # Bm9
    'G': (31, [62, 66, 69, 71, 73]),  # Gmaj9#11
    'A': (33, [61, 64, 66, 69, 71]),  # A6/9
    'F#m': (30, [61, 64, 66, 69]),  # F#m7
}
PROG = ['D', 'Bm', 'G', 'A', 'D', 'F#m', 'G', 'A', 'Bm', 'G']  # 最后一小节 G → 循环回 D

DRUMS = (AT['bend'], AT['end'] + 30)  # 鼓：从 01 章进来，片尾前退下

for bar, name in enumerate(PROG):
    f0 = bar * 120
    root, tones = CH[name]
    place(pad(tones, 2.0, 1.0), fr(f0), send=0.5)
    # 贝斯：每小节根音，第 3 拍换到五度
    if DRUMS[0] - 30 <= f0 < DRUMS[1]:
        place(sub(root, 0.9), fr(f0))
        place(sub(root + 7, 0.4), fr(f0 + 60))
        place(sub(root, 0.4), fr(f0 + 90))
    # 玻璃拨奏：十六分音符琶音（每 7.5 帧一个），开场与片尾只弹每拍第一个
    arp = tones + [t + 12 for t in tones[:3]]
    for s in range(16):
        fs = f0 + s * 7.5
        dense = DRUMS[0] <= fs < DRUMS[1]
        if not dense and s % 4:
            continue
        m = arp[(s * 3 + bar) % len(arp)] + 12
        vel = 1.0 if s % 4 == 0 else 0.55 if s % 2 == 0 else 0.4
        place(pluck(m, vel), fr(fs), pan=0.35 * np.sin(s * 1.3 + bar), send=0.35)

for b in range(40):
    fb = b * BEAT
    if not (DRUMS[0] <= fb < DRUMS[1]):
        continue
    if b % 2 == 0:
        place(kick(), fr(fb))
    else:
        place(clap(), fr(fb), send=0.2)
    for h in range(2):
        place(hat(0.9 if h else 0.6), fr(fb + 15 * h), pan=0.3, send=0.05)

# 开场 / 片尾：玻璃铃的一句动机（片尾同一句，循环接得上）
MOTIF = [(0, 81), (15, 78), (30, 76), (60, 74)]
for base in (0, 1080):
    for dt, m in MOTIF:
        place(glass_bell(m, 0.7), fr(base + dt + 4), pan=0.2, send=0.6)

# ───────── 音效（对准画面） ─────────
for p in PANS:
    sfx(whoosh(0.66, 300, 8000, 0.7, 0.55), fr(p) - 0.36, send=0.15)

# 01 弯光：压平（下滑）· 加坡（上滑）· 色散（左右失谐）
sfx(glide(76, 64, 0.6, 1.0), fr(158), pan=-0.2)
sfx(glide(64, 81, 1.3, 1.0), fr(214), pan=0.2)
for s, p in zip(shimmer(0.75), (-0.7, 0.7)):
    sfx(s, fr(296), pan=p, send=0.5)
sfx(glass_bell(88, 0.5, 1.0), fr(290), send=0.5)

# 02 二十五年：每个年代一个音色
sfx(bloop(84, 0.9, up=True), fr(ERA_AT[0]), pan=0.25)  # Aqua：冒泡
sfx(glass_bell(86, 0.45, 0.6) + 0, fr(ERA_AT[1]), pan=0.25, send=0.6)  # Aero：风铃
for i, m in enumerate((88, 91, 93)):
    sfx(glass_bell(m, 0.18, 0.4), fr(ERA_AT[1]) + 0.05 * (i + 1), pan=0.1 * i, send=0.6)
sfx(click(1.0), fr(ERA_AT[2]), pan=0.25)  # iOS 7：轻点
sfx(pluck(90, 0.6, 0.2, 0.5), fr(ERA_AT[2]), pan=0.25)
for s, p in zip(shimmer(0.5, 0.8), (-0.5, 0.5)):  # Glassmorphism：闪光
    sfx(s, fr(ERA_AT[3]), pan=p, send=0.6)
sfx(glass_bell(93, 0.9, 1.4), fr(ERA_AT[4]), pan=0.25, send=0.6)  # Liquid Glass：玻璃铃
sfx(thud(0.8), fr(588))

# 03 融合
for i, (dt, p) in enumerate([(0, -0.5), (6, 0.0), (12, 0.5)]):
    sfx(bloop(86 - i * 3, 0.8), fr(650 + dt), pan=p)
sfx(goo(1.0), fr(724), pan=-0.15, send=0.25)
sfx(thud(0.7), fr(736))
sfx(bloop(74, 0.8, up=True, d=0.25), fr(752), pan=0.4)
sfx(whoosh(0.35, 800, 6000, 0.4, 0.4), fr(752), pan=0.4)
for i in range(3):
    sfx(click(0.7), fr(776 + i * 5), pan=0.4)

# 04 界面：控件弹出 · 字变色
sfx(bloop(79, 0.6, up=True), fr(AT['ui'] + 30), pan=-0.5)
sfx(bloop(83, 0.5, up=True), fr(AT['ui'] + 54), pan=0.6)
sfx(click(0.6), fr(1000), pan=-0.5)

# 片尾：所有玻璃收回去
sfx(goo(0.6), fr(1110), pan=0.2, send=0.3)

# ================= 混响 + 母带 =================

def reverb(x, seed, dec=0.7, length=2.8):
    t = tt(length)
    ir = np.random.default_rng(seed).standard_normal(len(t)) * np.exp(-t / dec)
    ir = fft_filter(ir, hi=7000)
    ir[: int(0.02 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + len(ir)
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


mix = MUS + SFX * 0.7  # 音效让出背景音乐
mix[0] += reverb(SEND[0], 1) * 0.5
mix[1] += reverb(SEND[1], 2) * 0.5
for ch in range(2):
    mix[ch] = fft_filter(mix[ch], lo=30)
mix[:, : N - NV] += mix[:, NV:]  # 余音折回开头
mix = mix[:, :NV]
mix = mix.T
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.2) / np.tanh(1.2)

root = os.path.dirname(os.path.abspath(__file__))
out_dir = os.path.normpath(os.path.join(root, '..', '..', '..', 'public', '014-liquid-glass'))
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
