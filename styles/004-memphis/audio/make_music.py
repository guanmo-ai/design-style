"""
Design Style · 风格 004 · 孟菲斯 Memphis —— 配乐与音效（纯代码合成，无外部音源）

一首 80 年代米兰迪斯科（Italo Disco）味道的 15 秒小曲：120 BPM（1 拍 = 30 帧 = 0.5 秒）· F 大调
四拍底鼓、八度跳跃的合成贝斯、反拍开镲、十六分音符琶音、一支方波主旋律，外加一只牛铃（80 年代必备）。
音效全是“卡通”的：积木落地 = 调过音的“咚”、弹簧球 = “嘣嘣”、贴纸弹出 = 气泡音、换幕 = 滑哨 + 风声。
和弦：F（开场 / 01 唱片）| Dm（02 书架）| B♭（03 台灯）| C（04 椅子）| Am（05 纹样）| B♭ → C（06 今天）
      | F Dm B♭ C（五条规则）| F（片尾）
  0–46     开场：四块积木落地（14 / 22 / 29 / 36，F C A F 四声“咚”）；30–44 四个小图形弹出（气泡音往上走）
  28–58    青色波浪线画出来：一声带颤音的滑哨
  62–86    MEMPHIS 七个字母落地：F 大调五声音阶一路往上（每个字母一声“嘀”）；76 纸屑炸开；80 标签
  90–120   上升音 + 圆形转场的风声 → 120 第一拍：底鼓、镲、F 和弦，鼓组进来
  150      唱臂落下：一声唱针“沙沙” + 唱片搓碟，贝斯和琶音进来
  210…660  每章换幕：风声 + 滑哨（往下扫 = 往下滑，往上扫 = 往上滑）；各章积木按落地帧“咚”，音高跟和弦走
  346      台灯“咔哒”一声亮起；441 / 447 椅子上两颗球：弹簧“嘣”
  502–540  六块纹样小样：十六分音符一块，一块一声马林巴
  584–622  手机落地 → 界面元素一个个弹出（气泡音）；622 通知“叮咚”；628 往上滑
  683–743  五条规则：五张卡片八分音符一张砸下来（“咚” + 一个和弦音往上爬）；780–810 军鼓滚奏 + 上升音
  810      片尾：全体 F 和弦 + 镲；积木再砸一次；842–860 字母再“嘀”一遍；852 纸屑；856 标语
所有时间点与 video/*.tsx 的关键帧对齐（帧 / 60 = 秒）。

用法：python3 styles/004-memphis/audio/make_music.py
输出：public/004-memphis/music.wav（响度 -14 LUFS，真峰值 < -1 dBTP）
"""
import os
import shutil
import subprocess
import wave

import numpy as np

SR = 48000
DUR = 15.0
N = int(SR * DUR)
rng = np.random.default_rng(1981)

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


# ---------------- 和弦（F 大调） ----------------
CH = [  # (起始帧, 根音 MIDI, 和弦音)
    (0, 41, [65, 69, 72, 76]),  # F
    (210, 38, [62, 65, 69, 72]),  # Dm
    (300, 46, [62, 65, 70, 74]),  # B♭
    (390, 36, [64, 67, 72, 76]),  # C
    (480, 45, [64, 69, 72, 76]),  # Am
    (570, 46, [65, 70, 74, 77]),  # B♭
    (615, 36, [64, 67, 72, 79]),  # C
    (660, 41, [65, 69, 72, 77]),  # F
    (720, 38, [65, 69, 74, 77]),  # Dm
    (750, 46, [65, 70, 74, 77]),  # B♭
    (780, 36, [64, 67, 72, 79]),  # C
    (810, 41, [65, 69, 72, 77]),  # F
]


def chord_at(fm):
    c = CH[0]
    for x in CH:
        if fm >= x[0]:
            c = x
    return c


def tone(fm, k, octv=0):
    """当前和弦的第 k 个音（往上循环）"""
    _, _, ns = chord_at(fm)
    return ns[k % len(ns)] + 12 * (k // len(ns)) + 12 * octv


GROOVE = (120, 810)  # 鼓组：第一拍到片尾
FULL = 150  # 唱针落下：贝斯、琶音进来

# ---------------- 鼓 ----------------
for b in range(int((GROOVE[1] - GROOVE[0]) / 30)):
    fm = GROOVE[0] + b * 30
    place(kick(1.0), fr(fm), 0.95)
    if b % 2 == 1:
        place(clap(1.0), fr(fm), 0.5, 0.05, send=0.3)
        place(snare(1.0), fr(fm), 0.3, -0.05, send=0.2)
    place(hat(1.0, 0.07), fr(fm + 15), 0.22, 0.25)  # 反拍开镲
    for s in (0, 7.5, 22.5):
        place(hat(1.0, 0.018), fr(fm + s), 0.11, -0.3)
    if fm >= FULL and b % 4 == 3:
        place(cowbell(1.0), fr(fm + 22.5), 0.32, 0.4)
# 片尾：一记总的、一声镲
place(kick(1.1), fr(810), 1.0)
place(clap(1.2), fr(810), 0.5, send=0.4)
place(crash(2.6, 1.0), fr(120), 0.22, 0.2, send=0.2)
place(crash(3.0, 1.0), fr(810), 0.3, -0.1, send=0.3)
# 五条规则后半：军鼓滚奏 → 片尾
for k, fm in enumerate(np.arange(780, 810, 3.75)):
    place(snare(1.0), fr(fm), 0.08 + 0.3 * (k / 8) ** 1.5, 0.1 * (-1) ** k, send=0.2)

# ---------------- 贝斯：八度跳跃的八分音符 ----------------
for k, fm in enumerate(np.arange(FULL, 810, 15)):
    root = chord_at(fm)[1]
    n = root + (12 if k % 2 else 0)
    place(sbass(midi(n), 0.19, 1.0), fr(fm), 0.42, 0.0, bus=PUMP)
place(sbass(midi(29), 1.2, 1.0), fr(810), 0.5, bus=PUMP)
place(sbass(midi(41), 1.2, 1.0), fr(810), 0.3, bus=PUMP)
# 120–150：只有根音长音（唱针还没落下）
place(sbass(midi(29), 0.45, 1.0), fr(120), 0.4, bus=PUMP)

# ---------------- Pad：柔和的和弦铺底 ----------------
for i, (s, _, ns) in enumerate(CH):
    e = CH[i + 1][0] if i + 1 < len(CH) else 900
    if s == 0:
        s = 46
    d = fr(e - s)
    p = synth(midi(ns[0]), d, 'saw', 1800, 1400, 9, att=0.06, rel=0.25, det=0.006, level=1.0)
    for n in ns[1:]:
        p = p[: len(p)] + synth(midi(n), d, 'saw', 1800, 1400, 9, att=0.06, rel=0.25, det=0.006, level=1.0)[: len(p)]
    place(p, fr(s), 0.075 if s < 120 else 0.06, 0.0, send=0.35, bus=PUMP)

# ---------------- 琶音：十六分音符，和弦音一上一下 ----------------
ARP = [0, 1, 2, 3, 4, 3, 2, 1]
for k, fm in enumerate(np.arange(FULL, 810, 7.5)):
    if 480 <= fm < 570:  # 纹样一章：琶音让给马林巴
        continue
    n = tone(fm, ARP[k % 8], 0)
    acc = 1.0 if k % 4 == 0 else 0.7
    place(synth(midi(n), 0.09, 'square', 5000, 900, 0.05, dec=0.09, rel=0.03, level=1.0), fr(fm), 0.06 * acc, 0.35 * (-1) ** k, send=0.15, bus=PUMP)

# ---------------- 主旋律：方波 + 颤音（唱片、书架、台灯、椅子；规则里再来一次） ----------------
HOOK = {  # 章节起点 → [(拍内八分音符位置, MIDI, 长度（八分音符）)]
    150: [(0, 72, 1), (1, 74, 1), (2, 72, 1), (3, 69, 2)],
    210: [(0, 69, 1), (2, 77, 1), (3, 76, 1), (4, 74, 2)],
    300: [(0, 74, 1), (2, 77, 1), (3, 79, 1), (4, 77, 2)],
    390: [(0, 76, 1), (2, 79, 1), (3, 81, 1), (4, 79, 1), (5, 76, 1)],
    660: [(1, 72, 1), (3, 77, 1), (5, 81, 2)],
    720: [(0, 81, 1), (1, 79, 1), (2, 77, 2)],
    750: [(0, 74, 1), (1, 77, 1), (2, 79, 2), (4, 82, 2)],
}
for s, notes in HOOK.items():
    for pos, m, ln in notes:
        place(synth(midi(m), fr(15 * ln) * 0.9, 'square', 3200, 2200, 0.3, att=0.006, rel=0.08, det=0.003, vib=0.25),
              fr(s + 15 * pos), 0.11, -0.1, send=0.3, bus=LEAD)

# ================= 音效：对齐 video/*.tsx 的关键帧 =================
# 开场：四块积木落地 F C A F
for fm, m in ((14, 41), (22, 48), (29, 45), (36, 53)):
    sfx(bonk(midi(m), 1.0), fr(fm), 0.6, (fm - 25) / 40)
for fm, m in ((30, 72), (36, 76), (40, 79), (44, 84)):  # 小图形弹出
    sfx(bloop(midi(m) * 0.5, midi(m), 0.8, 0.08), fr(fm), 0.3, 0.3 * (-1) ** fm)
sfx(whistle(500, 1300, 0.5, 1.0, 0.03), fr(28), 0.14, -0.2)  # 波浪线
for i, m in enumerate((65, 67, 69, 72, 74, 77, 79)):  # MEMPHIS 七个字母
    fm = 50 + i * 4 + 12
    sfx(pluck(midi(m), 1.0, 0.16), fr(fm), 0.32, -0.45 + i * 0.15, send=0.3)
    sfx(bonk(midi(m - 24), 0.5), fr(fm), 0.25)
sfx(sparkle(0.6, 1.0, 1), fr(76), 0.22, send=0.4)
sfx(bloop(300, 1400, 1.0, 0.12), fr(76), 0.3)
sfx(pluck(midi(84), 1.0, 0.25), fr(80), 0.2, send=0.4)
sfx(riser(0.5, 1.0), fr(90), 0.2)
sfx(whoosh(0.3, 300, 6000, 1.0, 0.8), fr(104), 0.3)
# 01 唱片
sfx(bonk(midi(41), 1.0), fr(130), 0.5)
sfx(whoosh(0.25, 500, 4000, 0.6, 0.5), fr(134), 0.12, 0.3)
sfx(crackle(1.6, 1.0), fr(148), 0.4, 0.2)
sfx(scratch(0.2, 1.0), fr(150), 0.35, 0.2, send=0.1)
for fm, m in ((154, 84), (166, 88), (178, 91)):  # 三个音符
    sfx(bloop(midi(m) * 0.6, midi(m), 0.7, 0.07), fr(fm), 0.2, 0.4)


def sweep(t, up):
    """换幕：风声 + 滑哨"""
    sfx(whoosh(0.28, 300, 7000, 1.0, 0.8), fr(t - 16), 0.32)
    sfx(whistle(700, 1700, 0.24, 1.0) if up else whistle(1700, 600, 0.24, 1.0), fr(t - 15), 0.1, 0.2)


sweep(210, True)
sweep(300, False)
sweep(390, True)
sweep(480, False)
sweep(570, True)
sweep(660, False)
sweep(810, True)
# 02 书架：零件一块块落地（Dm 的音往上爬），书一本本落下
for i, fm in enumerate((222, 227, 232, 237, 240, 244)):
    sfx(bonk(midi([38, 45, 50, 53, 57, 62][i]), 1.0), fr(fm), 0.45, 0.2)
for fm in (226, 250):  # 两对斜隔板弹出
    sfx(bloop(260, 900, 1.0, 0.1), fr(fm), 0.25, -0.3)
sfx(tink(midi(86), 0.6, 0.3), fr(256), 0.3, send=0.4)
for i in range(5):
    sfx(pluck(midi([74, 77, 81, 84, 86][i]), 1.0, 0.12), fr(268 + 3 * i), 0.18, 0.4 - 0.2 * i)
sfx(bloop(400, 1500, 1.0, 0.08), fr(270), 0.2)
# 03 台灯
for fm, m in ((312, 34), (319, 41), (327, 46)):
    sfx(bonk(midi(m + 12), 1.0), fr(fm), 0.45, 0.1)
sfx(boing(320, 0.6, 0.3), fr(330), 0.25)
sfx(whistle(900, 600, 0.2, 1.0), fr(340), 0.08)
sfx(click(1.0), fr(346), 0.6, 0.15)
sfx(tink(midi(94), 0.8, 0.5), fr(346), 0.18, send=0.5)
sfx(bloop(500, 1800, 1.0, 0.08), fr(352), 0.25, 0.4)
# 04 椅子
sfx(whistle(300, 900, 0.22, 1.0), fr(392), 0.08, -0.2)  # 腿伸出来
sfx(bonk(midi(48), 1.0), fr(409), 0.45)  # 坐垫
sfx(whistle(400, 1200, 0.3, 1.0, 0.02), fr(408), 0.09, 0.2)  # 圆环画出来
sfx(bonk(midi(43), 1.0), fr(434), 0.5)  # 靠背圆盘
sfx(boing(200, 1.0), fr(441), 0.4, -0.3)
sfx(boing(260, 1.0), fr(447), 0.4, 0.3)
sfx(bloop(400, 1500, 1.0, 0.08), fr(438), 0.2, 0.4)
# 05 纹样
sfx(bonk(midi(45), 1.0), fr(486), 0.45, -0.3)
for i in range(6):
    fm = 502 + 7.5 * i
    sfx(pluck(midi([69, 72, 76, 81, 84, 88][i]), 1.0, 0.2), fr(fm), 0.3, 0.1 + 0.12 * i, send=0.3)
for k, fm in enumerate(np.arange(540, 570, 7.5)):
    sfx(pluck(midi([76, 72, 69, 72][k]), 1.0, 0.15), fr(fm), 0.14, -0.2, send=0.3)
# 06 今天
sfx(bonk(midi(46), 1.0), fr(584), 0.5, 0.1)
for i in range(6):
    m = [70, 74, 77, 82, 86, 89][i]
    sfx(bloop(midi(m) * 0.5, midi(m), 0.8, 0.07), fr(586 + 5 * i), 0.22, 0.15)
for i, fm in enumerate((600, 608, 616)):
    sfx(bloop(300, 1200 + 200 * i, 1.0, 0.1), fr(fm), 0.25, -0.4)
sfx(sparkle(0.35, 1.0, 2), fr(610), 0.15, 0.4)
sfx(boing(500, 0.6, 0.3), fr(618), 0.18, 0.45)
sfx(ding2(1.0), fr(622), 0.22, 0.4, send=0.3)
sfx(whoosh(0.4, 500, 5000, 1.0, 0.6), fr(628), 0.14, 0.1)
# 五条规则：卡片砸下来
sfx(bloop(250, 1000, 1.0, 0.1), fr(664), 0.25)
for i in range(5):
    fm = 683 + 15 * i
    sfx(bonk(midi([41, 45, 48, 53, 57][i]), 1.0), fr(fm), 0.55, -0.6 + 0.3 * i)
    sfx(pluck(midi([77, 81, 84, 89, 93][i]), 1.0, 0.2), fr(fm), 0.2, -0.6 + 0.3 * i, send=0.3)
sfx(riser(0.5, 1.0), fr(780), 0.25)
# 片尾：积木再砸一次 + 字母 + 纸屑 + 标语
for fm, m in ((824, 41), (832, 48), (839, 45), (846, 53)):
    sfx(bonk(midi(m), 1.0), fr(fm), 0.45, (fm - 835) / 30)
for i, m in enumerate((65, 67, 69, 72, 74, 77, 79)):
    fm = 830 + i * 3 + 12
    sfx(pluck(midi(m + 12), 1.0, 0.16), fr(fm), 0.25, -0.45 + i * 0.15, send=0.35)
sfx(sparkle(0.7, 1.0, 3), fr(852), 0.25, send=0.4)
sfx(bloop(300, 1500, 1.0, 0.12), fr(852), 0.3)
sfx(boing(330, 0.8, 0.4), fr(856), 0.2)
sfx(tink(midi(89), 0.5, 0.8), fr(866), 0.3, send=0.6)
sfx(tink(midi(96), 0.3, 0.9), fr(866), 0.3, send=0.6)

# ---------------- 侧链：Pad、贝斯、琶音跟着底鼓“泵” ----------------
tsec = np.arange(N) / SR
ks = np.array([fr(GROOVE[0] + b * 30) for b in range(23)] + [fr(810)])
idx = np.searchsorted(ks, tsec, side='right') - 1
since = np.where(idx >= 0, tsec - ks[np.clip(idx, 0, None)], 9.0)
duck = 1 - 0.35 * (1 - np.clip(since / 0.22, 0, 1)) ** 2
PUMP *= duck[None, :]
# 主旋律的乒乓延迟（附点八分 = 22.5 帧）
dl = np.zeros((2, N))
D = int(fr(22.5) * SR)
dl[0, D:] += LEAD[1, :-D] * 0.3
dl[1, 2 * D:] += LEAD[0, :-2 * D] * 0.2


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
f0, f1 = int(fr(876) * SR), N
fade[f0:f1] = np.linspace(1, 0, f1 - f0) ** 2
mix *= fade[:, None]

root = os.path.dirname(os.path.abspath(__file__))
out_dir = os.path.normpath(os.path.join(root, '..', '..', '..', 'public', '004-memphis'))
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
