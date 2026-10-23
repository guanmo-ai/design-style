"""
Design Style · 风格 005 · 波普艺术 Pop Art —— 配乐与音效（纯代码合成，无外部音源）

一首 60 年代味道的 18 秒小曲：100 BPM（剧本 1 拍 = 30 帧，放慢 1.2 倍 = 0.6 秒）· C 大调 · 50 年代的“万能进行”I–vi–IV–V
“摇摆舞”（Twist）鼓：底鼓 1、3 拍，军鼓 + 拍手 2、4 拍，十六分音符铃鼓；布吉走法的电贝斯；
反拍上“哒、哒”的 Farfisa 电风琴；Karplus–Strong 合成的冲浪吉他，长音用颤音拨奏；重音用铜管齐奏。
音效全是“漫画”的：网点 = 一串小气泡、爆炸框 = “砰”、POP! = 拔瓶塞“啵”、剪纸 = 拍桌子、汤罐 = 收银机、
丝网 = 刮板、软汉堡 = “噗叽”、POW! = 一拳、BANG! = 卡通枪声。
和弦：C（开场 / 01 拼贴）| Am（02 汤罐）| F（03 网点）| G（04 丝网）| C（05 放大）| Am → F（06 今天）
      | F G Em Am G7（五条规则）| C（片尾）
所有时间点与 video/*.tsx 的关键帧对齐（剧本帧 × 1.2 / 60 = 秒，与 video/timeline.ts 的 STRETCH 一致）；详见下面“音效”一节的注释。

用法：python3 styles/005-pop-art/audio/make_music.py
输出：public/005-pop-art/music.wav（响度 -14 LUFS，真峰值 < -1 dBTP）
"""
import os
import shutil
import subprocess
import wave

import numpy as np

SR = 48000
STRETCH = 1.2  # 与 video/timeline.ts 一致
DUR = 15.0 * STRETCH
N = int(SR * DUR)
rng = np.random.default_rng(1962)

# 总线：MUS 鼓与重音 · PUMP 侧链泵感 · LEAD 主旋律 · SFX 音效；各带混响发送
MUS = np.zeros((2, N))
SFX = np.zeros((2, N))
SEND = np.zeros((2, N))
PUMP = np.zeros((2, N))  # 跟着底鼓“泵”的：Pad、贝斯、琶音
LEAD = np.zeros((2, N))  # 主旋律（带乒乓延迟）


def fr(frame):
    return frame * STRETCH / 60.0


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


def bass(freq, d=0.22, level=1.0):
    t = tt(d + 0.06)
    env = np.minimum(1, t / 0.005) * np.exp(-t / 0.3) * np.where(t < d, 1, np.exp(-(t - d) / 0.02))
    y = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(4 * np.pi * freq * t)
    return np.tanh(y * 1.2) * env * level


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


def crash(d=2.2, level=1.0):
    t = tt(d)
    n = hp(hp(noise(d), 5000), 3000)
    env = np.minimum(1, t / 0.002) * (0.55 * np.exp(-t / 0.1) + 0.45 * np.exp(-t / 0.8))
    return n / (np.abs(n).max() + 1e-9) * env * level


def shimmer(d=0.6, level=1.0, lo=3000, hi=9000, seed=0):
    """金光：一把随机闪烁的高频正弦（像金箔反光）"""
    r = np.random.default_rng(seed)
    t = tt(d)
    y = np.zeros_like(t)
    for _ in range(18):
        f = r.uniform(lo, hi)
        t0 = r.uniform(0, d * 0.8)
        y += np.sin(2 * np.pi * f * t) * np.exp(-np.maximum(0, t - t0) / 0.05) * (t >= t0) * r.uniform(0.4, 1)
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.5
    return y / 6 * env * level



# ---------------- 80 年代合成器 ----------------

def synth(freq, d, wave='saw', fc0=4000, fc1=800, fdec=0.12, att=0.004, dec=None, rel=0.05, det=0.0, level=1.0, vib=0.0):
    """加法合成的“模拟合成器”：锯齿 / 方波 + 随时间关闭的低通（滤波包络），det = 两个声部的失谐"""
    t = tt(d + rel)
    fc = fc1 + (fc0 - fc1) * np.exp(-t / fdec)
    y = np.zeros_like(t)
    voices = (0.0,) if det == 0 else (-det, det)
    for dv in voices:
        f0 = freq * (1 + dv)
        ph = 2 * np.pi * f0 * t + (vib * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / 0.25) if vib else 0)
        for h in range(1, 60):
            if f0 * h > 12000:
                break
            if wave == 'square' and h % 2 == 0:
                continue
            g = 1 / h / (1 + (f0 * h / fc) ** 4)
            y += g * np.sin(h * ph + (rng.random() * 6.28 if dv else 0))
    y /= len(voices)
    env = np.minimum(1, t / att)
    if dec is not None:
        env = env * np.exp(-t / dec)
    env = env * np.where(t < d, 1, np.exp(-(t - d) / (rel / 4)))
    return y * env * level


def sbass(freq, d=0.2, level=1.0):
    """合成贝斯：锯齿 + 快关的低通 → “噗噗”的八度贝斯"""
    y = synth(freq, d, 'saw', 2400, 260, 0.06, 0.003, None, 0.03, level=1.0)
    y += 0.5 * np.sin(2 * np.pi * freq * tt(d + 0.03)) * np.where(tt(d + 0.03) < d, 1, 0.2)
    return np.tanh(y * 1.6) * level


def cowbell(level=1.0):
    t = tt(0.3)
    y = np.sign(np.sin(2 * np.pi * 540 * t)) + np.sign(np.sin(2 * np.pi * 800 * t))
    y = onepole_lp(hp(y, 400), 3500)
    return y * np.exp(-t / 0.07) * 0.35 * level


def snare(level=1.0):
    t = tt(0.3)
    body = np.sin(glide(180 + 60 * np.exp(-t / 0.02))) * np.exp(-t / 0.05)
    n = hp(onepole_lp(noise(0.3), 8000), 1200) * np.exp(-t / 0.08)
    return (body * 0.6 + n * 0.8) * level


def boing(f0=220, level=1.0, d=0.45):
    """弹簧“嘣”：频率带着衰减的颤动往上翘"""
    t = tt(d)
    f = f0 * (1 + 0.5 * (1 - np.exp(-t / 0.08))) * (1 + 0.12 * np.sin(2 * np.pi * 14 * t) * np.exp(-t / 0.2))
    y = np.sin(glide(f)) + 0.3 * np.sin(2 * glide(f))
    return y * np.minimum(1, t / 0.002) * np.exp(-t / (d * 0.4)) * level


def bonk(freq, level=1.0):
    """积木落地：调过音的“咚”（短正弦下滑 + 木头声）"""
    t = tt(0.3)
    f = freq * (1 + 1.2 * np.exp(-t / 0.012))
    body = np.sin(glide(f)) * np.exp(-t / 0.09)
    wood = onepole_lp(hp(noise(0.3), 700), 3000) * np.exp(-t / 0.008) * 0.5
    return np.tanh((body + wood) * 1.5) * level


def whistle(f0, f1, d=0.35, level=1.0, vib=0.0):
    """滑哨：正弦从 f0 滑到 f1（可带颤音）"""
    t = tt(d)
    x = t / d
    f = f0 * (f1 / f0) ** (x ** 0.8) * (1 + vib * np.sin(2 * np.pi * 9 * t))
    y = np.sin(glide(f)) + 0.08 * np.sin(3 * glide(f))
    env = np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.06 + 0.0)
    return y * np.clip(env, 0, 1) * level


def crackle(d=0.5, level=1.0):
    """唱针：稀疏的小爆点 + 一点底噪"""
    n = int(d * SR)
    y = hp(noise(d), 2000) * 0.05
    for i in rng.integers(0, n - 200, int(d * 60)):
        y[i:i + 60] += hp(noise(60 / SR), 1500)[:60] * rng.random() * np.exp(-np.arange(60) / 10)
    return y * level


def scratch(d=0.22, level=1.0):
    """搓碟：带通噪声 + 音高往返一次"""
    t = tt(d)
    x = t / d
    cut = 600 + 2600 * np.sin(np.pi * x)
    y = onepole_lp(hp(noise(d), 400), cut)
    tone = synth(110, d, 'saw', 1800, 900, 1.0, level=1.0)[: len(t)]
    pitch = np.sin(glide(140 + 220 * np.sin(np.pi * x))) * 0.3
    return (y / (np.abs(y).max() + 1e-9) * 0.6 + pitch + tone * 0.2) * np.sin(np.pi * x) ** 0.5 * level


def ding2(level=1.0):
    """通知“叮咚”：两个马林巴音（A5 → F5）"""
    a = pluck(midi(81), 1.0, 0.25)
    b = pluck(midi(77), 1.0, 0.3)
    y = np.zeros(max(len(a), len(b)) + int(0.1 * SR))
    y[: len(a)] += a
    y[int(0.1 * SR): int(0.1 * SR) + len(b)] += b
    return y * level


def sparkle(d=0.5, level=1.0, seed=0):
    """纸屑：一把随机的高音“叮”"""
    r = np.random.default_rng(seed)
    y = np.zeros(int((d + 0.4) * SR))
    for _ in range(14):
        s = tink(midi(int(r.choice([84, 86, 89, 91, 93, 96, 98]))), 0.12 + 0.12 * r.random(), 0.12)
        i = int(r.random() * d * SR)
        y[i:i + len(s)] += s[: len(y) - i]
    return y * level


# ---------------- 60 年代的乐器 ----------------

def ks(freq, d, level=1.0, bright=0.6, decay=0.996):
    """冲浪吉他：Karplus–Strong 拨弦（一段噪声在延迟线里来回衰减），再过一点失真"""
    n = int(d * SR)
    P = max(2, int(SR / freq))
    y = np.zeros(n + P + 1)
    exc = rng.uniform(-1, 1, P)
    exc = bright * exc + (1 - bright) * np.convolve(exc, np.ones(4) / 4, 'same')
    y[1:P + 1] = exc
    k = P + 1
    while k < len(y):
        e = min(k + P, len(y))
        y[k:e] = decay * 0.5 * (y[k - P:e - P] + y[k - P - 1:e - P - 1])
        k = e
    y = y[P + 1:P + 1 + n]
    t = tt(len(y) / SR)
    env = np.where(t < d - 0.03, 1, np.clip((d - t) / 0.03, 0, 1))
    return np.tanh(y * 2.2) * env * level


def trem(freq, d, level=1.0, rate=3.75):
    """颤音拨奏（tremolo picking）：同一个音每个十六分音符拨一次——冲浪摇滚的招牌"""
    step = fr(rate)
    y = np.zeros(int((d + 0.2) * SR))
    k = 0
    while k * step < d:
        s = ks(freq, step + 0.12, 1.0, 0.7, 0.994) * (0.85 if k % 2 else 1.0)
        i = int(k * step * SR)
        y[i:i + len(s)] += s[: len(y) - i]
        k += 1
    return y * level


def organ(freq, d, level=1.0):
    """Farfisa 风格电风琴：方波 + 高八度 + 颤音，开关很快（“哒”一下）"""
    t = tt(d + 0.03)
    vib = 0.004 * np.sin(2 * np.pi * 6.2 * t)
    ph = 2 * np.pi * freq * np.cumsum(1 + vib) / SR
    y = np.zeros_like(t)
    for h in (1, 3, 5, 7, 9):
        y += np.sin(h * ph) / h
    y += 0.5 * np.sin(2 * ph) + 0.25 * np.sin(4 * ph)
    env = np.minimum(1, t / 0.004) * np.where(t < d, 1, np.exp(-(t - d) / 0.01))
    return onepole_lp(y, 5000) * env * level


def ebass(freq, d=0.22, level=1.0):
    """电贝斯（拨片）：正弦 + 二次谐波，快速衰减"""
    t = tt(d + 0.05)
    env = np.minimum(1, t / 0.003) * np.exp(-t / 0.35) * np.where(t < d, 1, np.exp(-(t - d) / 0.02))
    y = np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(4 * np.pi * freq * t) * np.exp(-t / 0.06) + 0.15 * np.sin(6 * np.pi * freq * t) * np.exp(-t / 0.03)
    return np.tanh(y * 1.4) * env * level


def brass(notes, d=0.25, level=1.0):
    """铜管齐奏：几支失谐锯齿，滤波器先开后关（“叭！”）"""
    y = None
    for m in notes:
        s = synth(midi(m), d, 'saw', 5200, 1300, 0.09, 0.012, None, 0.08, det=0.006, level=1.0, vib=0.004)
        y = s if y is None else y[: len(s)] + s[: len(y)]
    return np.tanh(y * 0.9 / len(notes) * 2) * level


def tamb(level=1.0, dec=0.06):
    """铃鼓：几片小铃的高频噪声 + 金属泛音"""
    t = tt(0.2)
    n = hp(hp(noise(0.2), 6000), 6000)
    jing = sum(np.sin(2 * np.pi * f * t) for f in (6900, 8300, 9800)) * 0.12
    return (n + jing) * np.minimum(1, t / 0.002) * np.exp(-t / dec) * level


# ---------------- 漫画音效 ----------------

def cork(level=1.0):
    """“啵”：瓶塞拔出来——频率往上猛翘的短正弦 + 一下气声"""
    t = tt(0.16)
    f = 300 + 1400 * (1 - np.exp(-t / 0.012))
    y = np.sin(glide(f)) * np.exp(-t / 0.035)
    y += hp(noise(0.16), 2000) * np.exp(-t / 0.006) * 0.4
    return y * level


def boom(level=1.0, d=1.1):
    """“砰”：低频下坠 + 爆破噪声（爆炸框）"""
    t = tt(d)
    f = 38 + 130 * np.exp(-t / 0.07)
    body = np.sin(glide(f)) * np.exp(-t / 0.35)
    n = onepole_lp(noise(d), 900 + 3000 * np.exp(-t / 0.05)) * np.exp(-t / 0.18)
    return np.tanh((body * 1.2 + n * 0.9) * 1.6) * level


def slap(level=1.0, f0=140):
    """纸拍在桌上：一下宽带噪声 + 一点低频“嗒”"""
    t = tt(0.18)
    n = onepole_lp(hp(noise(0.18), 700), 7000) * np.exp(-t / 0.018)
    th = np.sin(glide(f0 * (1 + np.exp(-t / 0.01)))) * np.exp(-t / 0.04) * 0.6
    return np.tanh((n + th) * 1.5) * level


def swish(d=0.45, level=1.0):
    """刮板刮过网版：带一点“吱”的摩擦噪声"""
    t = tt(d)
    x = t / d
    y = onepole_lp(hp(noise(d), 500), 1800 + 1200 * np.sin(np.pi * x))
    y = y / (np.abs(y).max() + 1e-9)
    sq = np.sin(glide(1300 + 160 * np.sin(2 * np.pi * 11 * t))) * 0.05 * (0.5 + 0.5 * np.sin(2 * np.pi * 3 * t))
    return (y + sq) * np.sin(np.pi * x) ** 0.6 * level


def register(level=1.0):
    """收银机“咔—叮！”：机械咔哒 + 两声铃"""
    y = np.zeros(int(1.0 * SR))
    c = click(1.0) * 0.8 + thock(0.6, 420, 160)[: len(click(1.0))]
    y[: len(c)] += c
    for k, (m, g) in enumerate([(100, 0.6), (96, 0.5)]):
        b = tink(midi(m), g, 0.45)
        i = int((0.06 + 0.02 * k) * SR)
        y[i:i + len(b)] += b[: len(y) - i]
    return y * level


def drip(level=1.0):
    """水滴“滴”：极短的正弦往上滑"""
    t = tt(0.12)
    f = 700 + 1600 * (t / 0.12) ** 0.6
    return np.sin(glide(f)) * np.minimum(1, t / 0.002) * np.exp(-t / 0.03) * level


def shutter(level=1.0):
    """相机快门：两下咔嚓"""
    y = np.zeros(int(0.2 * SR))
    for off, g in ((0, 1.0), (0.055, 0.7)):
        c = click(g)
        i = int(off * SR)
        y[i:i + len(c)] += c
    return y * level


def punch(level=1.0):
    """“POW”：一拳——低频闷响 + 宽带噪声"""
    t = tt(0.35)
    body = np.sin(glide(60 + 160 * np.exp(-t / 0.02))) * np.exp(-t / 0.09)
    n = onepole_lp(noise(0.35), 2500) * np.exp(-t / 0.04)
    return np.tanh((body + n * 0.8) * 2.0) * level


def bang(level=1.0):
    """“BANG”：卡通枪声——很短很亮的爆破 + 尾巴"""
    t = tt(0.6)
    n = hp(noise(0.6), 300) * (np.exp(-t / 0.012) + 0.25 * np.exp(-t / 0.12))
    body = np.sin(glide(70 + 200 * np.exp(-t / 0.015))) * np.exp(-t / 0.12)
    return np.tanh((n + body) * 1.8) * level


def fizz(d, level=1.0, seed=0, lo=500, hi=2200, n=24):
    """网点长出来：一串越来越密、越来越高的小气泡"""
    r = np.random.default_rng(seed)
    y = np.zeros(int((d + 0.2) * SR))
    for k in range(n):
        x = (k / n) ** 0.8
        s = bloop(lo * (hi / lo) ** x * r.uniform(0.9, 1.1), lo * 3 * (hi / lo) ** x, 0.18 + 0.2 * x, 0.05)
        i = int(x * d * SR)
        y[i:i + len(s)] += s[: len(y) - i]
    return y * level


def squeak(d=0.4, level=1.0):
    """马克笔“吱—”"""
    t = tt(d)
    f = 2300 + 300 * np.sin(2 * np.pi * 7 * t) + 400 * (t / d)
    y = np.sin(glide(f)) * 0.5 + hp(noise(d), 3000) * 0.15
    return y * np.minimum(1, t / 0.02) * np.clip((d - t) / 0.05, 0, 1) * level


def wipe(t0, pan0=-0.6, pan1=0.6, seed=0, level=1.0):
    """网点转场：一串气泡往上走 + 风声，落在拍点前"""
    sfx(fizz(fr(16), 1.0, seed, 400, 1800, 10), fr(t0), 0.22 * level, pan0 * 0.5 + pan1 * 0.5)
    sfx(whoosh(fr(18), 300, 5000, 1.0, 0.7), fr(t0), 0.32 * level, 0, send=0.2)


# ---------------- 和弦（C 大调 · 50 年代的“万能进行” I–vi–IV–V） ----------------
CH = [  # (起始帧, 贝斯根音 MIDI, 和弦音)
    (0, 36, [64, 67, 72, 76]),  # C  开场
    (210, 33, [64, 69, 72, 76]),  # Am 02 汤罐
    (300, 29, [65, 69, 72, 77]),  # F  03 网点
    (390, 31, [62, 67, 71, 74]),  # G  04 丝网
    (480, 36, [64, 67, 72, 76]),  # C  05 放大
    (570, 33, [64, 69, 72, 76]),  # Am 06 今天
    (615, 29, [65, 69, 72, 77]),  # F
    (660, 29, [65, 69, 72, 77]),  # F  五条规则
    (690, 31, [62, 67, 71, 74]),  # G
    (720, 28, [64, 67, 71, 76]),  # Em
    (750, 33, [64, 69, 72, 76]),  # Am
    (780, 31, [62, 65, 67, 71]),  # G7
    (810, 36, [64, 67, 72, 76]),  # C  片尾
]
MINOR = {33, 28}


def chord_at(fm):
    c = CH[0]
    for x in CH:
        if fm >= x[0]:
            c = x
    return c


GROOVE = (120, 810)

# ---------------- 鼓：60 年代“摇摆舞”（Twist）节奏 ----------------
for b in range(int((GROOVE[1] - GROOVE[0]) / 30)):
    fm = GROOVE[0] + b * 30
    if b % 2 == 0:
        place(kick(1.0), fr(fm), 0.9)
    else:
        place(snare(1.0), fr(fm), 0.42, 0.05, send=0.28)
        place(clap(1.0), fr(fm), 0.34, -0.05, send=0.25)
        place(kick(0.7), fr(fm + 15), 0.5)  # 反拍上补一脚
    for s in range(4):  # 铃鼓：十六分音符，反拍重
        place(tamb(1.0, 0.05 if s % 2 else 0.035), fr(fm + s * 7.5), 0.16 if s == 2 else 0.08, 0.35)
# 开场：铃鼓从无到有（0–58），POP! 之后鼓先进来一半（60–120）
for k, fm in enumerate(np.arange(0, 58, 3.75)):
    place(tamb(1.0, 0.03), fr(fm), 0.02 + 0.1 * (k / 15) ** 2, 0.35)
for b in range(2):
    fm = 60 + b * 30
    place(kick(1.0), fr(fm), 0.8)
    place(snare(1.0), fr(fm + 15), 0.25, send=0.25)
for k, fm in enumerate(np.arange(105, 120, 1.875)):  # 进第一章前的军鼓“嘟噜噜”
    place(snare(1.0), fr(fm), 0.06 + 0.28 * (k / 8) ** 1.6, 0.15 * (-1) ** k, send=0.2)
for fm in (60, 120, 810):
    place(crash(2.6, 1.0), fr(fm), 0.26, 0.15, send=0.2)
place(kick(1.15), fr(810), 1.0)
for k, fm in enumerate(np.arange(780, 810, 3.75)):
    place(snare(1.0), fr(fm), 0.08 + 0.3 * (k / 8) ** 1.5, 0.1 * (-1) ** k, send=0.2)

# ---------------- 贝斯：摇滚“布吉”走法（根音 → 三音 → 五音 → 六音 → 八度） ----------------
for k, fm in enumerate(np.arange(120, 810, 15)):
    s, root, _ = chord_at(fm)
    third = 3 if root in MINOR else 4
    step = int(round((fm - max(s, 120)) / 15)) % 8
    iv = [0, third, 7, 9, 12, 9, 7, third][step]
    place(ebass(midi(root + iv), 0.2, 1.0), fr(fm), 0.5, 0.0, bus=PUMP)
place(ebass(midi(36), 0.9, 1.0), fr(60), 0.45, bus=PUMP)
place(ebass(midi(36), 1.6, 1.0), fr(810), 0.55, bus=PUMP)
place(ebass(midi(24), 1.6, 1.0), fr(810), 0.3, bus=PUMP)

# ---------------- 电风琴：反拍上的和弦“哒、哒” ----------------
for fm in np.arange(135, 810, 30):
    _, _, ns = chord_at(fm)
    for m in ns[:3]:
        place(organ(midi(m), 0.11, 1.0), fr(fm), 0.07, -0.35, send=0.15, bus=PUMP)
# 开场：风琴和弦慢慢长出来（0–58），像幕布拉开
for m in (64, 67, 72):
    o = organ(midi(m), fr(58), 1.0)
    o *= np.linspace(0, 1, len(o)) ** 2
    place(o, 0, 0.06, -0.2, send=0.3, bus=PUMP)

# ---------------- 冲浪吉他主旋律（每章 3 拍一句；长音用颤音拨奏） ----------------
MEL = {  # 章起点: [(相对帧, MIDI, 长度帧, 是否颤音)]
    120: [(0, 72, 15, 0), (15, 76, 15, 0), (30, 79, 30, 1), (60, 76, 15, 0), (75, 74, 15, 0)],
    210: [(0, 72, 15, 0), (15, 76, 15, 0), (30, 81, 30, 1), (60, 79, 15, 0), (75, 76, 15, 0)],
    300: [(0, 77, 15, 0), (15, 76, 15, 0), (30, 72, 30, 1), (60, 69, 15, 0), (75, 72, 15, 0)],
    390: [(0, 74, 15, 0), (15, 71, 15, 0), (30, 67, 30, 1), (60, 71, 15, 0), (75, 74, 15, 0)],
    480: [(0, 79, 15, 0), (15, 76, 15, 0), (30, 72, 30, 1), (60, 76, 15, 0), (75, 79, 15, 0)],
    570: [(0, 81, 15, 0), (15, 79, 15, 0), (30, 76, 15, 0), (45, 72, 15, 0), (60, 77, 15, 0), (75, 76, 15, 0)],
}
for s0, notes in MEL.items():
    for rel, m, d, tr in notes:
        sig = trem(midi(m - 12), fr(d), 1.0) if tr else ks(midi(m - 12), fr(d) + 0.15, 1.0)
        place(sig, fr(s0 + rel), 0.2, 0.25, send=0.45, bus=LEAD)

# ---------------- 铜管：重音（POP!、换色、五张卡、片尾） ----------------
place(brass([60, 64, 67, 72], 0.45, 1.0), fr(60), 0.3, 0, send=0.3)
place(brass([57, 64, 69, 72], 0.22, 1.0), fr(270), 0.18, 0, send=0.25)
for i, fm in enumerate((676 + 6, 691 + 6, 706 + 6, 721 + 6, 736 + 6)):
    _, _, ns = chord_at(fm)
    place(brass([n - 12 for n in ns[:3]] + [ns[i % len(ns)]], 0.14, 1.0), fr(fm), 0.16 + 0.02 * i, 0, send=0.2)
place(brass([60, 64, 67, 72, 76], 1.1, 1.0), fr(810), 0.3, 0, send=0.35)
place(trem(midi(64), 1.0, 1.0), fr(813), 0.14, 0.3, send=0.5)
place(trem(midi(67), 1.0, 1.0), fr(813), 0.12, -0.3, send=0.5)

# ---------------- 音效（与 video/*.tsx 的关键帧对齐） ----------------
# 开场：网点从左往右长出来（2–42）→ 集中线（38–58）→ 爆炸框“砰” + POP!（58 / 61）→ 标签（78）→ 爆炸框转场（104–120）
for k in range(5):
    sfx(fizz(fr(8), 1.0, 10 + k, 500 + k * 220, 900 + k * 300, 7), fr(2 + k * 8), 0.2, -0.8 + k * 0.4)
sfx(riser(fr(22), 1.0), fr(38), 0.3, send=0.2)
sfx(boom(1.0), fr(58), 0.55, send=0.25)
sfx(cork(1.0), fr(61), 0.45, send=0.3)
sfx(slap(1.0, 160), fr(82), 0.35)
sfx(whoosh(fr(18), 300, 6000, 1.0, 0.8), fr(103), 0.4, send=0.2)
sfx(boom(0.6, 0.6), fr(118), 0.25)
# 01 拼贴：六块剪纸拍上去；棒棒糖滑进来（166–180）落定“啵”；标题条（192）
for k, t0 in enumerate((122, 126, 132, 140, 148, 156)):
    sfx(slap(1.0, 120 + k * 15), fr(t0 + 6), 0.32, -0.3 + k * 0.12)
sfx(whistle(1400, 500, fr(14), 1.0), fr(166), 0.12, 0.5)
sfx(cork(1.0), fr(180), 0.42, 0.2, send=0.3)
sfx(boing(260, 1.0, 0.5), fr(181), 0.16, 0.2)
sfx(slap(1.0, 180), fr(192), 0.3)
# 02 汤罐：32 罐沿对角线一排排冒出来（220–250，十一声往上爬）；270 一列列翻面换色 + 收银机
for dgl in range(11):
    _, _, ns = chord_at(220)
    m = ns[dgl % 4] + 12 * (dgl // 4)
    sfx(pluck(midi(m), 1.0, 0.12), fr(220 + dgl * 3), 0.2, -0.6 + dgl * 0.12, send=0.3)
for c in range(8):
    sfx(slap(0.5, 300), fr(270 + c * 2 + 5), 0.1, -0.7 + c * 0.2)
sfx(register(1.0), fr(270), 0.32, 0.1, send=0.3)
# 03 网点：拉远（300–344）——倒着的风声；对话框（346）；眼泪（350 冒出、356–388 往下滑）；放大镜（354）
sfx(whoosh(fr(44), 6000, 300, 1.0, 0.25), fr(300), 0.32, send=0.25)
sfx(bloop(320, 1300, 1.0, 0.1), fr(346), 0.32, 0.4)
sfx(drip(1.0), fr(350), 0.4, -0.2, send=0.5)
sfx(tink(midi(93), 0.6, 0.3), fr(354), 0.22, -0.6, send=0.4)
sfx(whistle(900, 420, fr(30), 1.0), fr(357), 0.07, -0.2)
sfx(drip(1.0), fr(386), 0.3, -0.2, send=0.5)
# 04 丝网：第 1 遍往右刮（398–424）、第 2 遍往左刮（430–456）；标签（398 / 430 / 460）
sfx(swish(fr(26), 1.0), fr(398), 0.45, -0.4)
sfx(swish(fr(26), 1.0), fr(430), 0.45, 0.4)
for t0 in (398, 430, 460):
    sfx(slap(1.0, 110), fr(t0 + 3), 0.25, -0.5)
sfx(thock(0.8), fr(424), 0.3, 0.5)
sfx(thock(0.8), fr(456), 0.3, -0.5)
# 05 放大：五层汉堡软软地落下（496 / 503 / 510 / 517 / 524）；人（528）、尺子（534 / 542）；540 整个“噗叽”一下
for k, t0 in enumerate((496, 503, 510, 517, 524)):
    sfx(bonk(midi(43 + [0, 3, 7, 10, 12][k]), 1.0), fr(t0), 0.4, -0.1 + k * 0.05)
    sfx(boing(140 + k * 30, 1.0, 0.35), fr(t0), 0.1)
sfx(bloop(300, 900, 1.0, 0.1), fr(528), 0.25, -0.5)
sfx(whistle(500, 1500, fr(10), 1.0), fr(534), 0.08, -0.6)
sfx(whistle(500, 1500, fr(10), 1.0), fr(542), 0.08, 0.4)
sfx(boing(110, 1.0, 0.6), fr(540), 0.3, send=0.2)
# 06 今天：手机落地（584）；聊天泡泡（586 / 593）；POW!（600）；照片（607）；点赞（610）；通知叮咚（614）；WOW!（620）；三张标签（632 / 639 / 646）
sfx(thock(1.0, 170, 60), fr(584), 0.45)
sfx(bloop(500, 1500, 1.0, 0.08), fr(586), 0.28, -0.1)
sfx(bloop(650, 1900, 1.0, 0.08), fr(593), 0.28, 0.1)
sfx(punch(1.0), fr(600), 0.45)
sfx(shutter(1.0), fr(607), 0.35, 0.2)
sfx(bloop(800, 2400, 1.0, 0.07), fr(610), 0.2, 0.6)
sfx(ding2(1.0), fr(614), 0.3, 0.1, send=0.35)
sfx(cork(1.0), fr(620), 0.3, 0.6)
for k, t0 in enumerate((626, 633, 640)):
    sfx(slap(1.0, 150 + k * 25), fr(t0 + 6), 0.3, -0.6)
# 五条规则：五张卡片八分音符一张（676…736，落定 +6）；各自的演示声
sfx(slap(1.0, 130), fr(664), 0.3)
for i in range(5):
    t0 = 676 + i * 15
    sfx(slap(1.0, 120 + i * 20), fr(t0 + 6), 0.36, -0.6 + i * 0.3)
sfx(fizz(0.5, 1.0, 7, 600, 2000, 12), fr(682), 0.12, -0.6)
sfx(squeak(0.42, 1.0), fr(699), 0.05, -0.3)
for j in range(3):
    sfx(pluck(midi([72, 76, 79][j]), 1.0, 0.1), fr(712 + j * 6), 0.18, 0)
for j in range(4):
    sfx(bloop(400 + j * 150, 1400 + j * 300, 1.0, 0.07), fr(727 + j * 5), 0.18, 0.3)
sfx(bang(1.0), fr(742), 0.45, 0.6, send=0.25)
sfx(whoosh(fr(18), 300, 6000, 1.0, 0.8), fr(793), 0.4, send=0.2)
# 片尾：爆炸框（810）+ POP!（813）；对话框（840）；标签（852）
sfx(boom(1.0), fr(810), 0.55, send=0.3)
sfx(cork(1.0), fr(813), 0.45, send=0.3)
sfx(bloop(300, 1200, 1.0, 0.12), fr(840), 0.3)
sfx(slap(1.0, 160), fr(852), 0.25, -0.5)
sfx(sparkle(0.6, 1.0, 5), fr(842), 0.18, send=0.5)
# 转场（网点）：194 / 284 / 374 / 464 / 554 / 644
for k, (t0, a, b) in enumerate([(194, -0.8, 0.8), (284, 0, 0), (374, 0.8, -0.8), (464, 0, 0), (554, 0.8, -0.8), (644, 0, 0)]):
    wipe(t0, a, b, seed=20 + k)

# ---------------- 侧链：贝斯、风琴跟着底鼓“泵”一下 ----------------
tsec = np.arange(N) / SR
ks_ = np.array([fr(GROOVE[0] + b * 60) for b in range(12)] + [fr(810)])
idx = np.searchsorted(ks_, tsec, side='right') - 1
since = np.where(idx >= 0, tsec - ks_[np.clip(idx, 0, None)], 9.0)
duck = 1 - 0.25 * (1 - np.clip(since / 0.2, 0, 1)) ** 2
PUMP *= duck[None, :]
# 吉他的“弹簧混响”味道：一下短延迟（八分音符的三连音）
dl = np.zeros((2, N))
D = int(fr(10) * SR)
dl[0, D:] += LEAD[1, :-D] * 0.25
dl[1, 2 * D:] += LEAD[0, :-2 * D] * 0.15



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
f0, f1 = int(fr(872) * SR), N
fade[f0:f1] = np.linspace(1, 0, f1 - f0) ** 2
mix *= fade[:, None]

root = os.path.dirname(os.path.abspath(__file__))
out_dir = os.path.normpath(os.path.join(root, '..', '..', '..', 'public', '005-pop-art'))
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
