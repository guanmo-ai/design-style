"""
Design Style · 布局 03 · Scrollytelling 滚动叙事 —— 配乐与音效（纯代码合成，无外部音源）

120 BPM（1 拍 = 30 帧 = 0.5 秒）· F 大调 · 15 秒 · 主题是“滚动”：每一下滑动都听得见
  · 每次滑动（page.ts 的 FLICKS）开头：一声轻扫；滚动条每走过 120px：一声细小的滚轮“嗒”
  · 步骤每越过一次触发线：一个拨弦音（倒着滚回去时，音往下走）
  0–1.5s     开场：Pad 慢慢张开；第 60 帧设备拆开 → 低频重击 + 闪光
  1.5–3.5s   01 定义：律动进来（底鼓 / 沙锤 / 拨弦琶音）
  3.5–5.5s   02 结构：镜头拉远 → 律动减半；第 240 帧倒着滚：磁带倒带声；第 300 帧舞台松开
  5.5–7.0s   03 Snow Fall：风声 + 高音电钢
  7.0–8.5s   04 数据：圆点每次重排一串马林巴
  8.5–10s    05 苹果：Pad 拉满 + 拍手；画面每换一帧一声极轻的“咔”（像翻胶片）
  10–10.8s   06 CSS：几下键盘声，设备转一圈 → 上扫
  10.8–12s   07 四种排法：四个小窗依次亮起 → 四声上行气泡
  12–14s     08 五条规则：整条音乐低通，每条规则一声钟；规则 04 倒着滚一下 → 短倒带
  14–15s     片尾：滑到底，橡皮筋回弹一声闷响 → 收束和弦
滚动曲线 S(f) 直接从 video/page.ts 的 FLICKS 读出来重算（和画面同一份数据，改了滑动配乐自动跟上）。

用法：python3 layouts/03-scrollytelling/audio/make_music.py
输出：public/03-scrollytelling/music.wav（ffmpeg 响度标准化到 -14 LUFS）
"""
import os
import re
import shutil
import subprocess
import wave

import numpy as np

SR = 48000
DUR = 15.0
N = int(SR * DUR)
rng = np.random.default_rng(2026)

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


# ---------------- 滚动曲线：从 page.ts 读 FLICKS，重算 S(f) ----------------
ROOT = os.path.dirname(os.path.abspath(__file__))
PAGE = open(os.path.join(ROOT, '..', 'video', 'page.ts'), encoding='utf-8').read()
BLOCK = PAGE[PAGE.index('export const FLICKS'):]
BLOCK = BLOCK[: BLOCK.index('];')]
FLICKS = [(int(a), float(b), int(c), (e or 'out')) for a, b, c, e in
          re.findall(r"\[(\d+),\s*(\d+),\s*(\d+)(?:,\s*'(\w+)')?\]", BLOCK)]


def bezier(x1, y1, x2, y2):
    def bx(t):
        return 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t ** 2 * x2 + t ** 3

    def by(t):
        return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3

    def f(x):
        lo, hi = 0.0, 1.0
        for _ in range(40):
            mid = (lo + hi) / 2
            if bx(mid) < x:
                lo = mid
            else:
                hi = mid
        return by((lo + hi) / 2)
    return f


EASE = {'out': bezier(0.12, 0.82, 0.24, 1), 'inOut': bezier(0.6, 0, 0.2, 1), 'lin': lambda t: t}


def S(f):
    v = 0.0
    for at, to, d, e in FLICKS:
        if f < at:
            break
        t = min(1.0, (f - at) / d)
        v = v + (to - v) * EASE[e](t)
    return v


FINE = 4  # 每帧 4 个子采样，找“越线”的时刻
SF = np.array([S(i / FINE) for i in range(900 * FINE + 1)])


def crossings(level):
    """S 越过某个值的时刻（秒）与方向"""
    out = []
    for i in range(1, len(SF)):
        a, b = SF[i - 1], SF[i]
        if (a < level <= b) or (b < level <= a):
            out.append(((i - 1 + (level - a) / (b - a)) / FINE / 60, 1 if b > a else -1))
    return out


TRIGGER = 540
STEPS = []
for name in ['DEF_STEPS', 'SNOW_STEPS', 'DATA_STEPS', 'RULE_STEPS']:
    m = re.search(name + r" = \[([\d, ]+)\]\.map\(\(b\) => stepY\(b(?:, (\d+))?\)\)", PAGE)
    off = int(m.group(2) or TRIGGER)
    STEPS += [int(b) + off for b in m.group(1).split(',')]
RULES_AT = [int(v) for v in re.search(r'RULES_AT = \[([\d, ]+)\]', PAGE).group(1).split(',')]

# ---------------- 和声 ----------------
CH = {  # 名字: (贝斯根音, 和弦音)
    'Fmaj9': (41, [65, 69, 72, 76, 79]),
    'Dm9': (38, [62, 65, 69, 72, 76]),
    'Bbmaj9': (46, [62, 65, 69, 70, 72]),
    'Gm9': (43, [62, 65, 67, 70, 74]),
    'Csus': (48, [65, 67, 72, 74, 79]),
}
PROG = [(0, 'Fmaj9'), (150, 'Dm9'), (210, 'Bbmaj9'), (330, 'Fmaj9'), (405, 'Dm9'), (495, 'Bbmaj9'), (585, 'Gm9'),
        (645, 'Fmaj9'), (720, 'Dm9'), (780, 'Bbmaj9'), (840, 'Csus'), (864, 'Fmaj9')]


def chord_at(frame):
    c = PROG[0][1]
    for at, n in PROG:
        if frame >= at:
            c = n
    return CH[c]


PENTA = [65, 67, 69, 72, 74, 77, 79, 81, 84, 86]  # F 五声

# Pad：每个和弦一段
for k, (at, name) in enumerate(PROG):
    nxt = PROG[k + 1][0] if k + 1 < len(PROG) else 900
    lvl = {'Bbmaj9': 0.5, 'Csus': 0.42}.get(name, 0.4)
    if 495 <= at < 585:
        lvl = 0.62
    place(pad([midi(m) for m in CH[name][1]], fr(nxt - at) + 0.1, lvl, att=0.25 if at else 0.9, rel=0.8, bright=1.25), fr(at), send=0.5)

# ---------------- 节奏 ----------------
BEAT = 30
GROOVE = [(90, 210, 1.0), (330, 405, 0.55), (405, 720, 1.0), (720, 840, 0.6)]


def groove_lvl(fm):
    for a, b, l in GROOVE:
        if a <= fm < b:
            return l
    return 0.0


for b in range(0, 900, BEAT):
    g = groove_lvl(b)
    bass_root = chord_at(b)[0]
    if g:
        place(kick(0.85 * g), fr(b))
        place(shaker(0.16 * g), fr(b + 15), pan=0.3)
        place(shaker(0.08 * g), fr(b + 7.5), pan=-0.3)
        place(shaker(0.08 * g), fr(b + 22.5), pan=-0.3)
        place(bass(midi(bass_root), 0.2, 0.5 * g), fr(b))
        place(bass(midi(bass_root + 12), 0.12, 0.22 * g), fr(b + 15))
        if 495 <= b < 585 and (b // BEAT) % 2 == 1:
            place(clap(0.5), fr(b), send=0.3)
    # 拨弦琶音（八分音符）
    if g and not (330 <= b < 405):
        notes = chord_at(b)[1]
        for k in range(2):
            n = notes[(b // 15 + k) % len(notes)] + 12
            place(pluck(midi(n), 0.11 * g, dec=0.14), fr(b + k * 15), pan=-0.4 + 0.8 * ((b // 15 + k) % 3) / 2, send=0.35)

# 02 结构：律动减半（只留每两拍一次的低鼓）
for b in [210, 270]:
    place(kick(0.6), fr(b))
    place(bass(midi(46), 0.5, 0.35), fr(b))

# ---------------- 开场 ----------------
place(sub_rise(1.0, 30, 55, 0.5), fr(0))
place(riser(0.5, 0.25), fr(30), send=0.4)
# 第 60 帧：设备拆开
place(kick(1.1), fr(60))
place(stone(0.6, 160, 40), fr(60))
place(shimmer(1.2, 0.18), fr(60), send=0.6)
for k, m in enumerate([77, 81, 84, 88]):
    place(bell(midi(m), 0.13, 0.9), fr(60 + k * 2), pan=-0.5 + k / 3, send=0.6)

# ---------------- 滚动本身 ----------------
for at, to, d, e in FLICKS:
    prev = S(at - 0.01)
    dist = abs(to - prev)
    lvl = min(1.0, 0.35 + dist / 2400)
    if e == 'inOut':
        sfx(whoosh(d / 60 + 0.25, 300, 5500, 0.22 * lvl, rise=0.45), fr(at) - 0.05, pan=0.15, send=0.35)
    else:
        sfx(swipe(0.18, 0.2 * lvl), fr(at), pan=0.2, send=0.2)

# 滚轮刻度：每 120px 一声
for lv in range(120, 21000, 120):
    for t, dirn in crossings(lv):
        sfx(click(0.045 if dirn > 0 else 0.055), t, pan=0.75, send=0.05)

# 步骤越过触发线（中心 ≤ S + 540 + 60）
for c in STEPS:
    for t, dirn in crossings(c - TRIGGER - 60):
        if dirn > 0:
            m = chord_at(int(t * 60))[1][2] + 12
            sfx(pluck(midi(m), 0.22, dec=0.25), t, pan=-0.35, send=0.45)
            sfx(tink(midi(m + 12), 0.05, 0.3), t, pan=-0.35, send=0.5)
        else:
            m = chord_at(int(t * 60))[1][0]
            sfx(pluck(midi(m), 0.18, dec=0.2), t, pan=-0.35, send=0.4)


def rewind(d, level=1.0):
    """倒带：噪声 + 音高往上飞的锯齿颤音"""
    t = tt(d)
    x = t / d
    f = 300 * 2 ** (2.2 * x)
    tone = np.sin(glide(f)) * 0.3 + 0.15 * np.sin(glide(f * 2.01))
    warble = 1 + 0.5 * np.sin(2 * np.pi * (18 + 30 * x) * t)
    n = onepole_lp(hp(noise(d), 800), 4000 + 6000 * x)
    y = (tone * warble + 0.6 * n / (np.abs(n).max() + 1e-9)) * np.sin(np.pi * x) ** 0.7
    return y * level


# ---------------- 02 结构 ----------------
sfx(whoosh(0.6, 2000, 300, 0.25, rise=0.3), fr(210), send=0.4)  # 拉远
sfx(rewind(0.4, 0.22), fr(240), pan=0.1, send=0.3)
sfx(thock(0.5, 170, 60), fr(300), send=0.3)  # 舞台松开
sfx(whoosh(0.55, 300, 6000, 0.25, rise=0.7), fr(300), send=0.4)  # 推回

# ---------------- 03 Snow Fall ----------------
wind_d = fr(405 - 320)
w = onepole_lp(hp(noise(wind_d), 300), 900 + 500 * np.sin(np.linspace(0, 5, int(wind_d * SR))) ** 2)
w = w / (np.abs(w).max() + 1e-9) * np.sin(np.linspace(0, np.pi, len(w))) ** 1.2
place(w * 0.2, fr(320), pan=-0.2, send=0.3)
for k, (fm, m) in enumerate([(330, 84), (345, 81), (360, 77), (375, 79), (390, 72)]):
    place(epiano(midi(m), 0.6, 0.15), fr(fm), pan=0.3 - 0.15 * k, send=0.6)

# ---------------- 04 数据：圆点重排 ----------------
for at in [420, 450]:
    for k in range(8):
        m = PENTA[(k * 2 + (at // 30)) % len(PENTA)]
        place(pluck(midi(m), 0.1, dec=0.1), fr(at + 2 + k * 2.2), pan=-0.6 + k * 0.15, send=0.3)

# ---------------- 05 苹果：逐帧 ----------------
last = None
for i in range(480 * FINE, 600 * FINE):
    s = SF[i]
    idx = 1 + round(min(1, max(0, (s - 9720) / 2160)) * 119)
    if last is not None and idx != last and 9720 <= s <= 11880:
        sfx(hat(0.035, 0.012), i / FINE / 60, pan=0.0, send=0.05)
    last = idx
place(sub_rise(0.5, 35, 70, 0.4), fr(480))

# ---------------- 06 CSS ----------------
for k, fm in enumerate([578, 583, 586, 591, 594]):
    sfx(click(0.12), fr(fm), pan=-0.4 + 0.1 * k)
sfx(riser(0.5, 0.18), fr(600), send=0.4)

# ---------------- 07 四种排法 ----------------
for k, fm in enumerate([660, 675, 690, 705]):
    sfx(bloop(300 + 120 * k, 1200 + 300 * k, 0.28, 0.1), fr(fm), pan=-0.5 + k / 3, send=0.4)
    place(bell(midi([72, 76, 79, 84][k]), 0.1, 0.6), fr(fm), pan=-0.5 + k / 3, send=0.5)

# ---------------- 08 五条规则 ----------------
for k, fm in enumerate(RULES_AT):
    place(bell(midi([77, 79, 81, 84, 86][k]), 0.2, 0.9), fr(fm), pan=-0.3 + 0.15 * k, send=0.6)
sfx(rewind(0.16, 0.2), fr(792), send=0.3)

# ---------------- 片尾 ----------------
sfx(thock(0.55, 140, 55), fr(864), send=0.4)  # 橡皮筋回弹
place(kick(0.9), fr(846))
for k, m in enumerate([65, 72, 77, 81, 84]):
    place(epiano(midi(m), 0.9, 0.16), fr(846 + k * 3), pan=-0.4 + 0.2 * k, send=0.7)
place(bell(midi(89), 0.12, 1.2), fr(870), send=0.7)
place(bass(midi(29), 0.9, 0.5), fr(846))

# 08 规则：整条音乐低通
tsec = np.arange(N) / SR
a1, b1 = fr(716), fr(732)
a2, b2 = fr(836), fr(846)
c = np.full(N, 16000.0)
c = np.where((tsec >= a1) & (tsec < b1), 16000 * (900 / 16000) ** np.clip((tsec - a1) / (b1 - a1), 0, 1), c)
c = np.where((tsec >= b1) & (tsec < a2), 900, c)
c = np.where((tsec >= a2) & (tsec < b2), 900 * (16000 / 900) ** (np.clip((tsec - a2) / (b2 - a2), 0, 1) ** 2), c)
seg = slice(int(fr(712) * SR), int(fr(850) * SR))
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

out_dir = os.path.normpath(os.path.join(ROOT, '..', '..', '..', 'public', '03-scrollytelling'))
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
