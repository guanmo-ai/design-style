"""
Design Style · 风格 014 · 液态玻璃 Liquid Glass —— 配乐与音效（纯代码合成，无外部音源）

120 BPM 直拍（1 拍 = 0.5 秒 = 30 帧；全片不变速）· 20 秒 = 10 小节 · D 大调
声部：玻璃拨奏（FM，十六分音符琶音）、温暖铺底、亚低音贝斯、轻底鼓、拍手、闭镲、玻璃铃。
  0—2.5s     落下：玻璃铃的动机 · 吸气（起势）→ 下滑的哨音（落下）→ f30 砸进液体：“啵” + 亚低音 + 一道往下走的水声（涟漪）
             · 小水珠甩出去（三声高铃）、落回（三声“啵”）、被拉回去（三声上扬的“啵”）· 镜片成形、镜头跟着走（风声）
  2.5—5s     01 弯光：f120 鼓进来 · 压平（下滑音）· 加坡（上滑音）· 色散（左右失谐）· 穿过玻璃（倒放吸气 + 风声 + f300 闷响）
  5—9s       02 二十五年：五个年代各一个音色（Aqua 气泡 / Aero 风铃 / iOS 7 轻点 / Glassmorphism 闪光 / 液态玻璃玻璃铃 + 咚）+ 每次起跳一阵轻风
  9—11.5s    03 融合：一分三（左中右三声“啵”）· 图标三声轻点 · 两滴合一（黏稠的“咕”）· 点一下（轻点 + 水声）· 长成菜单（上扬）
  11.5—15s   04 界面：横移风声 · 手机、浏览器落定 · 标签栏缩小（“咕”）、展开（上扬）· 点按钮（轻点 + 水声）
  15—17.7s   五条规则：第二次穿过 · 放大镜一拍一条，玻璃铃一级一级往上
  17.7—20s   回到开始：鼓退下，水滴升起（上扬）· 玻璃铃的同一句动机；余音折回开头，循环无缝
所有时间点与 video/scene.ts 的关键帧对齐（帧 / 60 = 秒）。

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

# 鼓：f120 进来（涟漪散完、镜片成形），片尾水滴升起前退下，开场和片尾只剩铺底与玻璃铃
DRUMS = (120, 1050)

for bar, name in enumerate(PROG):
    f0 = bar * 120
    root, tones = CH[name]
    place(pad(tones, 2.0, 1.0), fr(f0), send=0.5)
    if DRUMS[0] - 30 <= f0 < DRUMS[1]:
        place(sub(root, 0.9), fr(f0))
        place(sub(root + 7, 0.4), fr(f0 + 60))
        place(sub(root, 0.4), fr(f0 + 90))
    arp = tones + [t + 12 for t in tones[:3]]
    for s_ in range(16):
        fs = f0 + s_ * 7.5
        dense = DRUMS[0] <= fs < DRUMS[1]
        if not dense and s_ % 4:
            continue
        m = arp[(s_ * 3 + bar) % len(arp)] + 12
        vel = 1.0 if s_ % 4 == 0 else 0.55 if s_ % 2 == 0 else 0.4
        place(pluck(m, vel), fr(fs), pan=0.35 * np.sin(s_ * 1.3 + bar), send=0.35)

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

# 开场 / 片尾：玻璃铃的同一句动机（片尾那一句落在水滴挂好之后，余音折回开头）
MOTIF = [(0, 81), (15, 78), (30, 76), (60, 74)]
for base in (0, 1150):
    for dt, m in MOTIF:
        if base == 0 and dt >= 30:
            continue  # 开场第 30 帧是落下，让给砸下去的声音
        place(glass_bell(m, 0.7), fr(base + dt + 2), pan=0.2, send=0.6)


def swell(d, level=1.0, c0=600, c1=6000):
    """倒放式的吸气：噪声渐强、截止频率往上走"""
    t = tt(d)
    return sweep_lp(rng.standard_normal(len(t)), c0, c1) * (t / d) ** 2.5 * level * 0.3


def plop(level=1.0):
    """玻璃砸进液体：一声下滑的“啵” + 亚低音 + 高频飞溅"""
    t = tt(0.6)
    f = 520 * np.exp(-t / 0.035) + 110
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13)
    y += 0.5 * fft_filter(rng.standard_normal(len(t)), lo=4000) * np.exp(-t / 0.05)
    return y * np.minimum(1, t / 0.002) * level * 0.45


def wet(d=1.2, level=1.0):
    """涟漪扫过：带通噪声的中心频率往下走，像水面一圈圈散开"""
    t = tt(d)
    y = sweep_lp(rng.standard_normal(len(t)), 9000, 700) - sweep_lp(rng.standard_normal(len(t)), 2500, 200)
    return y * np.exp(-t / (d * 0.4)) * np.minimum(1, t / 0.01) * level * 0.22


# ───────── 音效（对准画面：video/scene.ts） ─────────
# 镜 1 · 落下
sfx(swell(0.22, 0.6, 800, 5000), 0.0, pan=0.3)
sfx(glide(86, 62, 0.3, 1.4), fr(12), pan=0.3)
sfx(plop(1.0), fr(30), pan=0.25, send=0.3)
sfx(thud(0.9, 120, 42), fr(30))
sfx(wet(1.4, 1.0), fr(31), pan=0.2, send=0.4)
for i, (dt, p_) in enumerate([(0, -0.6), (1, 0.3), (2, 0.7)]):
    sfx(glass_bell(93 + 2 * i, 0.25, 0.3), fr(31 + dt), pan=p_, send=0.4)  # 甩出去
for i, p_ in enumerate((-0.6, 0.3, 0.7)):
    sfx(bloop(88 - 3 * i, 0.5), fr(56 + 2 * i), pan=p_)  # 落回墙面
    sfx(bloop(74 + 2 * i, 0.4, up=True, d=0.12), fr(76 + 4 * i), pan=p_ * 0.5)  # 被拉回去
sfx(whoosh(1.1, 300, 5000, 0.55, 0.5), fr(100), pan=0.4)  # 镜片成形、镜头跟着走

# 镜 2 · 弯光
sfx(glide(76, 64, 0.45, 0.9), fr(172), pan=-0.2)
sfx(glide(64, 81, 0.7, 0.9), fr(206), pan=0.2)
for s_, p_ in zip(shimmer(0.6), (-0.7, 0.7)):
    sfx(s_, fr(246), pan=p_, send=0.5)
sfx(swell(1.0, 0.9, 400, 9000), fr(270) - 0.3, send=0.2)  # 穿过玻璃
sfx(whoosh(0.7, 200, 9000, 0.7, 0.85), fr(268), send=0.2)
sfx(thud(0.6, 90, 40), fr(300))
sfx(glass_bell(86, 0.5, 1.0), fr(300), send=0.6)

# 镜 3 · 二十五年：每个年代一个音色 + 起跳的轻风声
ERA_LAND = [330 + 45 * k for k in range(5)]
sfx(bloop(84, 0.9, up=True), fr(ERA_LAND[0]), pan=-0.2)  # Aqua：冒泡
for i, m in enumerate((86, 88, 91, 93)):
    sfx(glass_bell(m, 0.22, 0.45), fr(ERA_LAND[1]) + 0.04 * i, pan=0.1 * i, send=0.6)  # Aero：风铃
sfx(click(1.0), fr(ERA_LAND[2]))  # iOS 7：轻点
sfx(pluck(90, 0.6, 0.2, 0.5), fr(ERA_LAND[2]))
for s_, p_ in zip(shimmer(0.5, 0.8), (-0.5, 0.5)):
    sfx(s_, fr(ERA_LAND[3]), pan=p_, send=0.6)  # Glassmorphism：闪光
sfx(glass_bell(93, 0.9, 1.4), fr(ERA_LAND[4]), send=0.6)  # 液态玻璃：玻璃铃
sfx(thud(0.8), fr(ERA_LAND[4]))
TAKE = [ERA_LAND[0] + 18, ERA_LAND[1] + 8, ERA_LAND[2] + 21, ERA_LAND[3] + 12]
for k in range(4):
    sfx(whoosh([0.4, 0.6, 0.35, 0.5][k], 600, 4000, 0.3, 0.5), fr(TAKE[k]), pan=0.3)
sfx(wet(0.8, 0.5), fr(ERA_LAND[4]), send=0.3)  # 液态玻璃落下：墙起涟漪
sfx(whoosh(0.6, 400, 6000, 0.4, 0.5), fr(516), pan=0.4)

# 镜 4 · 融合
for i, p_ in enumerate((-0.5, 0.0, 0.5)):
    sfx(bloop(86 - i * 3, 0.7), fr(552 + 4 * i), pan=p_)
for i in range(3):
    sfx(click(0.5), fr(578 + 4 * i), pan=-0.4 + 0.4 * i)
sfx(goo(1.0), fr(612), pan=-0.2, send=0.25)
sfx(click(0.9), fr(628), pan=0.4)
sfx(wet(0.5, 0.5), fr(630), pan=0.4)
sfx(bloop(72, 0.8, up=True, d=0.25), fr(636), pan=0.4)
for i in range(3):
    sfx(click(0.6), fr(652 + 4 * i), pan=0.45)

# 镜 5 · 界面
sfx(whoosh(0.8, 300, 7000, 0.6, 0.5), fr(690), pan=0.5)
sfx(thud(0.45, 100, 50), fr(732), pan=-0.4)
sfx(goo(0.45), fr(772), pan=-0.4)  # 标签栏缩小、播放条落进来
sfx(whoosh(0.7, 300, 6000, 0.45, 0.5), fr(770), pan=0.6)
sfx(thud(0.4, 100, 50), fr(806), pan=0.5)
sfx(bloop(80, 0.45, up=True), fr(836), pan=-0.4)  # 往上滚，标签栏展开
sfx(click(0.8), fr(856), pan=0.6)
sfx(wet(0.7, 0.45), fr(860), pan=0.6)

# 镜 6 · 第二次穿过 → 五条规则：放大镜一拍一条，铃声一级一级往上
sfx(swell(0.8, 0.8, 400, 9000), fr(900), send=0.2)
sfx(whoosh(0.7, 200, 9000, 0.6, 0.85), fr(900), send=0.2)
sfx(thud(0.55, 90, 40), fr(936))
for i, m in enumerate((81, 83, 85, 88, 90)):
    sfx(glass_bell(m, 0.5, 0.7), fr(962 + 24 * i), send=0.5)

# 镜 7 · 升起、摇回字墙
sfx(bloop(70, 0.6, up=True, d=0.3), fr(1066), pan=0.2)
sfx(whoosh(1.4, 200, 5000, 0.45, 0.5), fr(1066), send=0.2)

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


mix = MUS + SFX * 0.62  # 音效让出背景音乐
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
