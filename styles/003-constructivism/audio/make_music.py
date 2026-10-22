"""
Design Style · 风格 003 · 构成主义 Constructivism —— 配乐与音效（纯代码合成，无外部音源）

一首“工厂”味的 15 秒小曲：144 BPM（1 拍 = 25 帧 ≈ 0.417 秒）· D 小调 → 片尾 D 大调
灵感：莫索洛夫《铸铁厂》（1926—27）——低音区不停的十六分音符“机器”、铁砧、铜管齐奏。
和弦：Dm（0–175）| B♭（02 大字）| Gm（03 蒙太奇）| A（04 塔）| Dm（05 纺织）| B♭（06 舞台）| C → A（07 书）
      | Dm B♭ Gm C A（五个词，一拍一个）| 735–750 唯一的一口气 | D 大（775 楔子再次刺进白圆）
  0–25     黑场推进 + 楔子加速：上升音效 → 25 重击（底鼓 + 低频 + 镲 + 铁砧 + 铜管 Dm）
  28–46    西里尔字母打字：14 声打字机；50 / 56 两下盖章；62–74 CONSTRUCTIVISM 打字；75 年份盖章
  100–160  01 斜线：三次换排法（100 / 118.75 / 137.5）——齿轮棘轮“咔咔咔” + 落定 + 铜管
  175      02 大字：喇叭喷出（镲 + 铜管 B♭），К Н И Г И 五个字母五个音往上爬
  250      03 蒙太奇：快门；三条照片切进来三声机械响；胶片转起来 = 放映机的咔嗒声；钻进瞳孔
  325      04 塔：低沉的金属共振；螺旋“画”出来时一道刮擦声；三个体块三声铁砧（A C♯ E）
  400      05 纺织：织机八分音符的木头“嗒”；四道翻转波四声“唰”；三个圆“啵啵啵”
  475      06 舞台：每根梁落下一声金属“当”，螺栓一声“嗒”，梯子横档一串细响
  550      07 书：拉开镜头；两次翻页；红方块飞向镜头
  625–750  五个词：每拍一记铜管 + 铁砧 + 镲，和弦一路往上走
  750–775  片尾：楔子再刺一次 → D 大和弦 + 钟声；标语三声钟；864 起淡出
所有时间点与 video/*.tsx 的关键帧对齐（帧 / 60 = 秒）。

用法：python3 styles/003-constructivism/audio/make_music.py
输出：public/003-constructivism/music.wav（响度 -14 LUFS，真峰值 < -1 dBTP）
"""
import os
import shutil
import subprocess
import wave

import numpy as np

SR = 48000
DUR = 15.0
N = int(SR * DUR)
rng = np.random.default_rng(1921)

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



# ---------------- 003 新乐器：工厂里的声音 ----------------

def anvil(freq, level=1.0, dec=0.6):
    """铁砧：非谐泛音（1 : 2.32 : 4.25 : 6.63 : 9.38）+ 一下金属噪声，敲完还在“嗡”"""
    t = tt(dec * 3.5)
    y = np.zeros_like(t)
    for k, (r, a) in enumerate([(1, 1.0), (2.32, 0.7), (4.25, 0.45), (6.63, 0.3), (9.38, 0.16)]):
        y += a * np.sin(2 * np.pi * freq * r * t + k) * np.exp(-t / (dec / (1 + 0.6 * k)))
    hit = hp(noise(dec * 3.5), 2500) * np.exp(-t / 0.004) * 0.8
    return (y * 0.5 + hit) * np.minimum(1, t / 0.0006) * level


def brass(notes, d=0.2, level=1.0, bright=1.0):
    """铜管齐奏：每个音 3 个微失谐的锯齿声部，滤波包络从亮到暗（“哒！”）"""
    out = None
    for m in notes:
        y = additive(midi(m), d, nh=30, kc0=4 + 12 * bright, kc1=2.2 + 2 * bright, kdec=0.07, att=0.006,
                     voices=3, detune=0.005, dec=0.5, rel=0.08)
        if out is None:
            out = y
        else:
            n = min(len(out), len(y))
            out = out[:n] + y[:n]
    return np.tanh(out / max(1, len(notes)) * 2.2) * level


def clank(level=1.0, f=320):
    """钢梁落定：低沉的“咚” + 金属的“当”"""
    a = thock(1.0, 170, 60)
    b = anvil(f, 0.55, 0.25)
    n = max(len(a), len(b))
    y = np.zeros(n)
    y[: len(a)] += a
    y[: len(b)] += b
    return y * level


def typekey(level=1.0):
    """打字机：一下塑料 + 金属杆的“嗒”"""
    t = tt(0.06)
    y = hp(noise(0.06), 1800) * np.exp(-t / 0.0025) + 0.6 * np.sin(2 * np.pi * 1350 * t) * np.exp(-t / 0.008)
    y += 0.3 * np.sin(glide(220 + 300 * np.exp(-t / 0.004))) * np.exp(-t / 0.012)
    return y * level


def stampsnd(level=1.0):
    """盖章 / 压印机：低“咚” + 纸面一拍 + 短混响尾巴"""
    a = thock(1.0, 210, 55)
    c = CLAP[: len(a)] * 0.5
    return (a + c) * level


def ratchet(n=5, gap=0.018, level=1.0, f=2300):
    """齿轮棘轮：一串越来越快的咔嗒"""
    d = n * gap + 0.08
    y = np.zeros(int(d * SR))
    tpos = 0.0
    for k in range(n):
        s = tick(1.0 - 0.08 * k, f + 90 * k, 0.006)
        i = int(tpos * SR)
        y[i : i + len(s)] += s[: len(y) - i]
        tpos += gap * (1 - 0.1 * k)
    return y * level


def woodclack(level=1.0, f=760):
    """织机的木头“嗒”"""
    t = tt(0.12)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.02) + 0.45 * np.sin(2 * np.pi * f * 2.4 * t) * np.exp(-t / 0.008)
    y += onepole_lp(hp(noise(0.12), 1200), 5000) * np.exp(-t / 0.004) * 0.6
    return y * level


def pageflip(d=0.28, level=1.0):
    """翻页：纸面摩擦（带通噪声）先慢后快，最后“啪”一下"""
    t = tt(d)
    x = t / d
    cut = 1800 + 5000 * x ** 1.5
    y = hp(onepole_lp(noise(d), cut), 900)
    y = y / (np.abs(y).max() + 1e-9) * (np.sin(np.pi * x) ** 0.8) * 0.6
    snap = hp(noise(d), 2500) * np.exp(-np.maximum(0, t - d * 0.82) / 0.006) * (t > d * 0.82) * 0.8
    return (y + snap) * level


def projector(d, level=1.0, rate=24.0):
    """放映机：每秒 24 下的机械咔嗒，带一点马达的嗡声"""
    y = np.zeros(int(d * SR))
    k = 0
    while k / rate < d - 0.02:
        s = tick(0.6 + 0.4 * (k % 2), 1700 if k % 2 else 1300, 0.004)
        i = int(k / rate * SR)
        y[i : i + len(s)] += s[: len(y) - i]
        k += 1
    t = tt(d)
    y += 0.12 * np.sin(2 * np.pi * 96 * t) * (1 + 0.3 * np.sin(2 * np.pi * rate * t))
    return y * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.05) * level


def scrape(d, level=1.0):
    """钢架“画”出来：带一点音高往上走的金属刮擦"""
    t = tt(d)
    x = t / d
    n = hp(onepole_lp(noise(d), 2000 + 6000 * x), 800)
    tone = np.sin(glide(700 * 2 ** (1.5 * x))) * 0.3 + np.sin(glide(1630 * 2 ** (1.5 * x))) * 0.15
    y = n / (np.abs(n).max() + 1e-9) * 0.6 + tone
    return y * np.sin(np.pi * np.clip(x, 0, 1)) ** 0.7 * level


def megaphone(d=0.35, level=1.0):
    """喇叭里喊出来的一声：带共振峰的噪声 + 方波，往上一扬"""
    t = tt(d)
    f = 180 * (1 + 0.25 * (1 - np.exp(-t / 0.05)))
    sq = np.sign(np.sin(glide(f))) * 0.4
    n = noise(d) * 0.3
    y = sq + n
    out = np.zeros_like(y)
    for fc in (700, 1200, 2600):  # 三个“元音”共振峰
        out += onepole_lp(hp(y, fc * 0.8), fc * 1.25)
    env = np.minimum(1, t / 0.01) * np.exp(-t / (d * 0.45))
    return np.tanh(out * 3) * env * level


def revswell(d, level=1.0):
    """反向镲：越来越响，在拍点前戛然而止"""
    c = crash(d, 1.0)[::-1]
    t = tt(d)
    return c[: len(t)] * (t / d) ** 2 * level


# 预先合成一次、反复使用的鼓
KICK = kick(1.0)
CLAP = clap(1.0)
SNARE = snare(1.0)
CRASH = crash()
OHAT = hat(1.0, 0.06)
CHAT = hat(1.0, 0.018)
BOOM = boom(1.0)

# ---------------- 和声 ----------------
BEAT, S16, BAR = 25, 6.25, 100  # 帧
ROOT = {'Dm': 38, 'Bb': 34, 'Gm': 31, 'A': 33, 'C': 36, 'D': 38}
PADV = {'Dm': [50, 53, 57, 62], 'Bb': [50, 53, 58, 62], 'Gm': [50, 55, 58, 62], 'A': [49, 52, 57, 61],
        'C': [48, 52, 55, 60], 'D': [50, 54, 57, 62]}
STABV = {'Dm': [50, 57, 62, 65, 69], 'Bb': [46, 53, 58, 62, 65], 'Gm': [43, 50, 55, 58, 62], 'A': [45, 52, 57, 61, 64],
         'C': [48, 55, 60, 64, 67], 'D': [38, 50, 57, 62, 66, 69]}
THIRD = {'Dm': 3, 'Bb': 4, 'Gm': 3, 'A': 4, 'C': 4, 'D': 4}
PROG = [(0, 'Dm'), (175, 'Bb'), (250, 'Gm'), (325, 'A'), (400, 'Dm'), (475, 'Bb'), (550, 'C'), (600, 'A'),
        (625, 'Dm'), (650, 'Bb'), (675, 'Gm'), (700, 'C'), (725, 'A'), (750, 'D')]
GROOVE_END = 735  # 唯一的一口气：735–750
FINAL = 775       # 楔子第二次刺进白圆 = D 大和弦


def chord_at(fm):
    cur = PROG[0][1]
    for s, n in PROG:
        if fm >= s - 1e-6:
            cur = n
    return cur


KICKS = []


def kick_at(fm, level=1.0):
    place(KICK * level, fr(fm))
    KICKS.append(fr(fm))


def stab(fm, name, level=1.0, d=0.2, bright=1.0, pan=0.0):
    place(brass(STABV[name], d, 1.0, bright) * 0.34 * level, fr(fm), pan=pan, send=0.3)


def hit(fm, name, level=1.0, crash_=0.5):
    """章节重音：底鼓 + 低频 + 镲 + 铁砧 + 铜管"""
    kick_at(fm, 1.0)
    sfx(BOOM * 0.7 * level, fr(fm), send=0.25)
    if crash_:
        place(CRASH * crash_, fr(fm), send=0.3)
    sfx(anvil(midi(ROOT[name] + 36), 0.16 * level, 0.5), fr(fm), pan=0.25, send=0.35)
    stab(fm, name, 1.1 * level, 0.26)


# ================= 开场 0–100 =================
sfx(whoosh(fr(16), 120, 2500, 0.35, 0.5), 0.0, pan=0.5)                 # 黑场推进
sfx(bloop(160, 520, 0.25, 0.12), fr(5), pan=0.25)                        # 白圆弹出
sfx(riser(fr(25), 0.42), 0.0, send=0.2)                                  # 楔子加速
sfx(sub_rise(fr(25), 30, 70, 0.4), 0.0)
sfx(whoosh(fr(22), 300, 9000, 0.45, 0.95), fr(3), pan=-0.3)
hit(25, 'Dm', 1.25, 0.6)
for k in range(9):                                                        # 碎片四散
    sfx(tink(900 + 260 * ((k * 7) % 9), 0.05, 0.12), fr(26 + k * 2.2), pan=((k * 5) % 9) / 4.5 - 1, send=0.3)
for i in range(14):                                                       # КОНСТРУКТИВИЗМ 打字
    sfx(typekey(0.16), fr(28 + i * 18 / 14), pan=-0.5 + i * 0.07, send=0.08)
for fm in (50, 56):                                                       # 构成 / 主义 两下盖章
    sfx(stampsnd(0.55), fr(fm), send=0.2)
    kick_at(fm, 0.6)
for i in range(14):                                                       # CONSTRUCTIVISM 打字
    sfx(typekey(0.12), fr(62 + i * 12 / 14), pan=-0.6 + i * 0.05, send=0.08)
sfx(stampsnd(0.5), fr(75), send=0.2)                                       # 年份
kick_at(75, 0.7)
stab(75, 'Dm', 0.55, 0.16, 0.6, 0.2)
for fm in (81, 87):
    sfx(tick(0.12, 3200, 0.01), fr(fm), pan=0.45)
# 机器启动：低音 D 的持续音
place(pad([midi(38), midi(45), midi(50)], fr(75), 0.5, att=0.6, rel=0.3, bright=0.5), fr(25), send=0.2)
for k in range(8):                                                        # 88–100：军鼓滚奏推进 01
    place(SNARE * (0.08 + 0.03 * k), fr(87.5 + k * S16 / 4), pan=0.1, send=0.12)

# ================= 01 斜线：三次换排法 =================
for k, fm in enumerate((100, 118.75, 137.5)):
    sfx(ratchet(5, 0.016, 0.22), fr(fm - 6), pan=-0.3 + 0.3 * k)
    sfx(clank(0.5, 260 + 60 * k), fr(fm), pan=-0.2 + 0.2 * k, send=0.2)
    stab(fm, 'Dm', 0.7 + 0.15 * k, 0.14, 0.7 + 0.15 * k, -0.2 + 0.2 * k)
sfx(whoosh(fr(20), 300, 8000, 0.4, 0.4), fr(158), pan=0.4)             # 楔子飞走

# ================= 02 大字 =================
hit(175, 'Bb', 1.15, 0.65)
sfx(megaphone(0.4, 0.22), fr(175), pan=-0.4, send=0.3)
for i, m in enumerate([58, 62, 65, 70, 74]):                               # К Н И Г И：五个音往上爬
    place(brass([m, m - 12], 0.12, 1.0, 0.9) * (0.18 + 0.04 * i), fr(175 + i * S16), pan=-0.4 + 0.2 * i, send=0.3)
for fm in (200, 206.25):
    sfx(stampsnd(0.5), fr(fm), pan=0.4, send=0.2)
sfx(whoosh(fr(16), 200, 3000, 0.4, 0.85), fr(234), pan=-0.2)             # 嘴变成镜头
sfx(sub_rise(fr(16), 40, 90, 0.3), fr(234))

# ================= 03 蒙太奇 =================
hit(250, 'Gm', 1.0, 0.4)
sfx(click(0.3), fr(250), send=0.2)                                         # 快门
for k, fm in enumerate((254, 258, 262)):                                   # 三条照片切进来
    sfx(click(0.2) + 0, fr(fm), pan=(-0.5, 0.5, -0.2)[k], send=0.15)
    sfx(thock(0.3, 300, 120), fr(fm), pan=(-0.5, 0.5, -0.2)[k])
sfx(bloop(300, 900, 0.2, 0.1), fr(259), send=0.3)                          # 镜圈弹出
sfx(projector(fr(307 - 263), 0.16), fr(263), pan=0.35)                     # 胶片转起来
sfx(riser(fr(18), 0.45), fr(307), send=0.25)                               # 钻进瞳孔
sfx(sub_rise(fr(18), 35, 80, 0.35), fr(307))

# ================= 04 塔 =================
hit(325, 'A', 1.1, 0.35)
sfx(anvil(midi(33 + 12), 0.25, 1.4), fr(325), send=0.5)                    # 塔：低沉的金属共振
sfx(scrape(fr(28), 0.16), fr(326), pan=-0.2, send=0.35)
for k, (fm, m) in enumerate(((351, 69), (357.25, 73), (363.5, 76))):       # 三个体块：A C♯ E
    sfx(anvil(midi(m), 0.17, 0.55), fr(fm), pan=-0.3 + 0.3 * k, send=0.4)
    sfx(tick(0.08, 3000, 0.008), fr(fm + 4), pan=0.5)
for k in range(3):                                                         # 纸色斜条盖上来
    sfx(whoosh(fr(9), 800, 9000, 0.22, 0.7), fr(386 + k * 4), pan=-0.5 + 0.5 * k)

# ================= 05 纺织 =================
hit(400, 'Dm', 0.9, 0.35)
for k in range(int((456 - 400) / 12.5) + 1):                               # 织机：八分音符的木头“嗒”
    fm = 400 + k * 12.5
    sfx(woodclack(0.16 if k % 2 else 0.22, 760 if k % 2 else 640), fr(fm + 6.25), pan=0.35 if k % 2 else -0.35)
for k, fm in enumerate((412.5, 425, 437.5, 450)):                          # 四道翻转波
    sfx(whoosh(fr(10), 600, 7000, 0.16, 0.6), fr(fm - 6), pan=-0.5 if k % 2 == 0 else 0.5)
    sfx(pluck(midi((62, 65, 69, 74)[k]), 0.1, 0.12), fr(fm), pan=-0.3 if k % 2 == 0 else 0.3, send=0.3)
sfx(whoosh(fr(14), 4000, 300, 0.25, 0.3), fr(456))                         # 花样缩没
for k, (f0, f1) in enumerate(((140, 380), (240, 700), (200, 560))):        # 三个圆
    sfx(bloop(f0, f1, 0.22, 0.12), fr(462 + k * 2.5), pan=(0.0, 0.35, -0.35)[k], send=0.3)

# ================= 06 舞台 =================
hit(475, 'Bb', 0.95, 0.35)
for k, at in enumerate((0, 6.25, 9.4, 12.5, 18.75, 22, 25, 28.1, 31.25, 34.4, 36, 37.5, 39)):
    sfx(clank(0.32 + (0.12 if k in (0, 4) else 0), 240 + (k * 37) % 180), fr(475 + at + 4), pan=-0.6 + 0.1 * k, send=0.2)
for at in (10, 13, 22, 31, 36, 38):                                        # 螺栓
    sfx(tick(0.1, 3400, 0.01), fr(475 + at + 3), pan=0.3)
for k in range(11):                                                        # 梯子横档
    sfx(tick(0.05 + 0.004 * k, 2400 + 140 * k, 0.006), fr(475 + 41 + k * 0.9 + 3), pan=0.5)
sfx(ratchet(14, 0.04, 0.1, 1900), fr(480), pan=-0.4)                       # 轮子转
sfx(riser(fr(14), 0.4), fr(536), send=0.25)                                # 钻进红轮子

# ================= 07 书 =================
hit(550, 'C', 1.0, 0.45)
sfx(whoosh(fr(18), 4000, 400, 0.3, 0.3), fr(550))                          # 拉开镜头
for fm in (569, 583):                                                      # 两次翻页
    sfx(pageflip(fr(14), 0.32), fr(fm), pan=0.3, send=0.2)
    sfx(thock(0.15, 260, 120), fr(fm + 13), pan=-0.2)
stab(600, 'A', 0.6, 0.14, 0.6)
sfx(riser(fr(15), 0.5), fr(610), send=0.25)                                # 红方块飞向镜头
sfx(sub_rise(fr(15), 40, 90, 0.35), fr(610))

# ================= 五个词 625–750 =================
for k, (fm, name) in enumerate(((625, 'Dm'), (650, 'Bb'), (675, 'Gm'), (700, 'C'), (725, 'A'))):
    hit(fm, name, 1.0 + 0.08 * k, 0.45 + 0.05 * k)
    sfx(bell(midi(74 + (0, 2, 5, 7, 9)[k]), 0.07, 0.6), fr(fm), pan=0.3, send=0.5)
    if k < 4:
        sfx(whoosh(fr(8), 900, 9500, 0.22, 0.85), fr(fm + 25 - 8), pan=0.45 if k % 2 == 0 else -0.25)
for k in range(3):                                                         # 红与黑：三个字三下盖章
    sfx(stampsnd(0.3), fr(650 + k * 3.125), pan=-0.4 + 0.4 * k)
for k in range(4):                                                         # 组装：四条切片
    sfx(clank(0.25, 300 + 70 * k), fr(675 + k * 1.6 + 6), pan=-0.4 + 0.27 * k)
sfx(revswell(fr(15), 0.3), fr(735))                                        # 一口气：反向镲吸进 750

# ================= 片尾 750–900 =================
sfx(whoosh(fr(16), 120, 2500, 0.32, 0.5), fr(750), pan=0.5)
sfx(bloop(160, 520, 0.22, 0.12), fr(755), pan=0.25)
sfx(riser(fr(25), 0.4), fr(750), send=0.2)
sfx(sub_rise(fr(25), 30, 70, 0.4), fr(750))
kick_at(FINAL, 1.0)
sfx(BOOM * 1.0, fr(FINAL), send=0.3)
place(CRASH * 0.6, fr(FINAL), send=0.4)
sfx(anvil(midi(62), 0.18, 0.9), fr(FINAL), pan=0.2, send=0.5)
place(brass(STABV['D'], 0.9, 1.0, 0.9) * 0.36, fr(FINAL), send=0.4)
place(pad([midi(m) for m in PADV['D']], fr(900 - FINAL), 0.55, att=0.05, rel=0.5, bright=1.0), fr(FINAL), pan=-0.5, send=0.35)
place(pad([midi(m) for m in PADV['D']], fr(900 - FINAL), 0.55, att=0.05, rel=0.5, bright=1.0), fr(FINAL), pan=0.5, send=0.35)
for i in range(14):
    sfx(typekey(0.12), fr(778 + i * 18 / 14), pan=-0.5 + i * 0.07, send=0.08)
for fm in (800, 806):
    sfx(stampsnd(0.45), fr(fm), send=0.2)
for i in range(14):
    sfx(typekey(0.09), fr(812 + i * 12 / 14), pan=-0.6 + i * 0.05, send=0.08)
sfx(stampsnd(0.4), fr(825), send=0.2)
for k, m in enumerate((74, 78, 81)):                                       # 标语：三声钟（D 大三和弦）
    sfx(bell(midi(m), 0.09, 1.1), fr(831 + k * S16), pan=-0.3 + 0.3 * k, send=0.6)
for fm in (840, 844):
    sfx(tick(0.08, 3200, 0.01), fr(fm), pan=0.45)
for k in range(5):                                                         # 心跳般的余震：四分音符底鼓渐弱
    kick_at(FINAL + 25 * (k + 1), 0.45 - 0.07 * k)


# ================= 律动 100–735：从不断档 =================
for b in range(4, int(GROOVE_END / BEAT) + 1):
    fm = b * BEAT
    if fm >= GROOVE_END:
        break
    if fm not in (175, 250, 325, 400, 475, 550, 625, 650, 675, 700, 725):
        kick_at(fm, 0.95)
    climax = fm >= 625
    if b % 2 == 1 or climax:
        place(SNARE * (0.42 if not climax else 0.5), fr(fm), pan=0.05, send=0.18)
    for s in range(4):
        t16 = fm + s * S16
        if t16 >= GROOVE_END:
            break
        place((OHAT * 0.16) if s == 2 else (CHAT * (0.11 if s == 0 else 0.07)), fr(t16), pan=0.25 if s % 2 else -0.15)
    if fm >= 400 and fm < 625 and b % 2 == 0:
        place(anvil(midi(81), 0.035, 0.18), fr(fm + 2 * S16), pan=0.5, send=0.2)   # 反拍的小铁砧

# ---------------- “铸铁厂”机器：低音区十六分音符的固定音型（进 PUMP 总线，跟着底鼓泵） ----------------
OST = [0, 12, 0, 7, 0, 12, 3, 1]
for k in range(int((GROOVE_END - 25) / S16)):
    fm = 25 + k * S16
    if fm >= GROOVE_END:
        break
    name = chord_at(fm)
    r = ROOT[name] + 12
    step = OST[k % 8]
    if step == 3:
        step = THIRD[name]
    br = min(1.0, max(0.0, (fm - 25) / 75)) ** 1.5 * 0.85 + 0.15
    if fm >= 625:
        br = 1.0
    acc = 1.0 if k % 4 == 0 else 0.72
    y = additive(midi(r + step), fr(S16) * 0.85, nh=22, kc0=2 + 10 * br, kc1=1.4 + 2.4 * br, kdec=0.035, voices=2,
                 detune=0.004, odd=0.55, dec=0.12, rel=0.02)
    place(np.tanh(y * 1.6) * 0.2 * acc * (0.55 + 0.45 * br), fr(fm), pan=-0.25 if k % 2 else 0.25, bus=PUMP)
# 贝斯：八分音符根音
for k in range(int((GROOVE_END - 100) / 12.5)):
    fm = 100 + k * 12.5
    r = ROOT[chord_at(fm)]
    place(bass(midi(r), 0.15, 0.3), fr(fm), bus=PUMP)
# Pad：每段和弦铺底
for k, (s, n) in enumerate(PROG[:-1]):
    e = min(PROG[k + 1][0], GROOVE_END)
    if s >= GROOVE_END or e <= 100:
        continue
    st = max(s, 100)
    for pan in (-0.55, 0.55):
        place(pad([midi(m) for m in PADV[n]], fr(e - st), 0.3 if s < 625 else 0.38, att=0.02, rel=0.2, bright=1.1),
              fr(st), pan=pan, send=0.3, bus=PUMP)


# ================= 侧链 =================
tsec = np.arange(N) / SR
ks = np.array(sorted(KICKS))
idx = np.searchsorted(ks, tsec, side='right') - 1
since = np.where(idx >= 0, tsec - ks[np.clip(idx, 0, None)], 9.0)
x = np.clip(since / 0.2, 0, 1)
duck = 1 - 0.6 * (1 - x) ** 2
duck = np.where(since < 0.004, 1 - 0.6 * since / 0.004, duck)
PUMP *= duck[None, :]
dl = np.zeros((2, N))
LEAD = np.zeros((2, N))
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
out_dir = os.path.normpath(os.path.join(root, '..', '..', '..', 'public', '003-constructivism'))
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
