"""
Design Style · 布局 03 · Split Screen 分屏 —— 配乐与音效（纯代码合成，无外部音源）

120 BPM（1 拍 = 30 帧 = 0.5 秒）· A 小调 · 20 秒。主题和画面一样：**一条中线，两种声音**。
  · 声像就是中线：左声道演奏低音区的拨弦（“左边说话”），右声道演奏高音区的玻璃音（“右边给证据”）；
    换幕时左半的扫频上行、右半的扫频下行，和画面里“左半向上、右半向下”一一对应
  · 每个换幕的落定帧（= 拍点）都有一声重击：低频下滑 + 鼓 + 和弦换根音
  · 反差一章：三对声音（明暗 / 图文 / 静动）一次只换一对；滚动一章后半“反过来”：两个声部的左右声像互换
  · 响应式一章：窗口每缩 40 像素一声嘀；窄过 768 一声叮；中线转 90° 时一道扫频绕着声像转一圈
  · 片尾：中线转回竖直，两个声部从左右汇到中间；五个词各一个五声音阶的音，最后一个和弦

全部时间点（帧 / 60 = 秒）与 video/ 下各章的关键帧对齐（章节起点见 video/timeline.ts）：
  AT = 开场 0 · 来历 120 · 比例 330 · 反差 540 · 滚动 690 · 响应式 870 · 片尾 1050
  换幕：落定在章节起点；起点前 24 帧开始滑，最快的一刻在起点前约 10 帧

用法：python3 layouts/03-split-screen/audio/make_music.py
输出：public/03-split-screen/music.wav（ffmpeg 响度标准化到 -14 LUFS）
"""
import os
import shutil
import subprocess
import wave

import numpy as np

SR = 48000
DUR = 20.0
N = int(SR * DUR)
rng = np.random.default_rng(2026)

# 总线：鼓 / 和声（会被鼓“压”一下）/ 拨弦 / 音效；混响发送
DRUM = np.zeros((2, N))
TONE = np.zeros((2, N))
PLUCK = np.zeros((2, N))
SFX = np.zeros((2, N))
SEND = np.zeros((2, N))


def fr(frame):
    return frame / 60.0


def pan_gains(pan):
    pan = np.asarray(pan, dtype=float)
    return np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)


def place(sig, t, gain=1.0, pan=0.0, send=0.0, bus=None):
    """pan 可以是标量，也可以是和 sig 等长的数组（声像在声音里移动）"""
    bus = PLUCK if bus is None else bus
    i = int(t * SR)
    if i >= N or i < 0:
        return
    sig = sig[: N - i]
    pn = np.asarray(pan, dtype=float)
    if pn.ndim:
        pn = pn[: len(sig)]
    gl, gr = pan_gains(pn)
    bus[0, i : i + len(sig)] += sig * gl * gain
    bus[1, i : i + len(sig)] += sig * gr * gain
    if send:
        SEND[0, i : i + len(sig)] += sig * gl * gain * send
        SEND[1, i : i + len(sig)] += sig * gr * gain * send


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


# ───────── 乐器 ─────────
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


def hat(level=1.0, dec=0.025):
    t = tt(0.2)
    return hp(hp(noise(0.2), 7000), 7000) * np.minimum(1, t / 0.001) * np.exp(-t / dec) * level


def bass(freq, d=0.22, level=1.0):
    t = tt(d + 0.06)
    env = np.minimum(1, t / 0.005) * np.exp(-t / 0.3) * np.where(t < d, 1, np.exp(-(t - d) / 0.02))
    y = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(4 * np.pi * freq * t)
    return np.tanh(y * 1.2) * env * level


def pad(freqs, d, level=1.0, att=0.3, rel=0.5):
    """加法合成的柔和 Pad：每个音 3 个微失谐声部 × 8 个谐波"""
    t = tt(d + rel)
    y = np.zeros_like(t)
    for fq in freqs:
        for det in (-0.004, 0.0, 0.004):
            ph0 = rng.random() * 6.28
            for h in range(1, 9):
                if fq * h > 9000:
                    break
                y += np.sin(2 * np.pi * fq * (1 + det) * h * t + ph0 * h) / h ** 1.6
    env = np.minimum(1, t / att) * np.where(t < d, 1, np.exp(-(t - d) / (rel / 4)))
    return y / (len(freqs) * 5) * env * level


def pluck(freq, level=1.0, dec=0.18):
    """马林巴式拨弦：基音 + 4 倍 / 10 倍泛音快速衰减"""
    t = tt(dec * 4)
    y = np.sin(2 * np.pi * freq * t) * np.exp(-t / dec)
    y += 0.35 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-t / (dec * 0.25))
    y += 0.12 * np.sin(2 * np.pi * freq * 10 * t) * np.exp(-t / (dec * 0.08))
    return y * np.minimum(1, t / 0.0015) * level


def bell(freq, level=1.0, dec=0.8):
    """FM 钟琴（3.5 倍频调制 → 玻璃般的泛音）"""
    t = tt(dec * 3)
    index = 2.2 * np.exp(-t / 0.12)
    y = np.sin(2 * np.pi * freq * t + index * np.sin(2 * np.pi * freq * 3.5 * t))
    return y * np.minimum(1, t / 0.002) * np.exp(-t / dec) * level


def click(level=1.0):
    t = tt(0.1)
    y = hp(noise(0.1), 3000) * np.exp(-t / 0.002) + 0.4 * np.sin(2 * np.pi * 2200 * t) * np.exp(-t / 0.006)
    return y * level


def tick(freq=1800, level=1.0):
    """里程表的一格：极短的点击 + 一点音高"""
    t = tt(0.06)
    return (hp(noise(0.06), 2500) * np.exp(-t / 0.0015) * 0.7 + np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.008)) * level


def thump(level=1.0, f0=120, f1=34, d=0.5):
    """换幕落定的重击：低频下滑的正弦 + 一点噪声"""
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.05)
    body = np.sin(glide(f)) * np.exp(-t / 0.16)
    air = onepole_lp(hp(noise(d), 300), 3000) * np.exp(-t / 0.02) * 0.5
    return np.tanh((body + air) * 1.5) * level


def pop(freq=520, level=1.0):
    """出字的一声：短促的上挑正弦 + 一点木质"""
    t = tt(0.14)
    f = freq * (0.85 + 0.15 * (1 - np.exp(-t / 0.01)))
    y = np.sin(glide(f)) * np.exp(-t / 0.035) + 0.2 * np.sin(glide(2 * f)) * np.exp(-t / 0.015)
    return y * np.minimum(1, t / 0.001) * level


def sweep(d, f0, f1, level=1.0, q=0.9):
    """带通噪声扫频（f0 → f1 指数变化），振幅钟形"""
    t = tt(d)
    x = t / d
    cut = f0 * (f1 / f0) ** x
    y = onepole_lp(onepole_lp(hp(noise(d), 120), cut), cut * 1.3)
    env = np.sin(np.pi * np.clip(x, 0, 1)) ** 1.6
    return y / (np.abs(y).max() + 1e-9) * env * level


def tone_sweep(d, f0, f1, level=1.0):
    t = tt(d)
    x = t / d
    f = f0 * (f1 / f0) ** x
    return np.sin(glide(f)) * np.sin(np.pi * np.clip(x, 0, 1)) ** 1.2 * level


def shimmer(d=0.8, level=1.0):
    t = tt(d)
    x = t / d
    y = hp(noise(d), 5000)
    return y / (np.abs(y).max() + 1e-9) * np.sin(np.pi * np.clip(x, 0, 1)) ** 1.5 * level


def riser(d=0.5, level=1.0):
    t = tt(d)
    x = t / d
    cut = 500 + 10000 * x ** 2
    n = hp(onepole_lp(noise(d), cut), 300)
    tone = np.sin(glide(330 * 2 ** (2 * x))) * 0.25
    return (n / (np.abs(n).max() + 1e-9) + tone) * x ** 2.2 * level


# ───────── 时间轴（帧） ─────────
BEAT = 30
AT = dict(intro=0, history=120, ratio=330, contrast=540, scroll=690, resp=870, end=1050)
ORDER = ['intro', 'history', 'ratio', 'contrast', 'scroll', 'resp', 'end']
PENTA = [69, 72, 74, 76, 79]  # A C D E G

# 每章一个和弦：(根音 MIDI, 和弦音)
CHORD = {
    'intro': (45, [57, 60, 64, 71]),  # Am9
    'history': (41, [53, 57, 60, 64]),  # Fmaj7
    'ratio': (48, [60, 64, 67, 74]),  # Cadd9
    'contrast': (43, [59, 62, 64, 69]),  # G6/9
    'scroll': (38, [50, 53, 57, 60, 64]),  # Dm9
    'resp': (40, [56, 59, 62, 66]),  # E9（属：把人推向终点）
    'end': (45, [57, 60, 64, 71]),  # Am9（回家）
}
END = {c: (AT[ORDER[i + 1]] if i + 1 < len(ORDER) else 1200) for i, c in enumerate(ORDER)}

# ───────── 节奏：从拉链咬合（第 60 帧）开始 ─────────
KICK0 = 60
kick_frames = list(range(KICK0, 1200, BEAT))
for k, fm in enumerate(kick_frames):
    if fm >= 1194:
        break
    place(kick(0.95 if k else 1.0), fr(fm), bus=DRUM)
for fm in range(KICK0 + BEAT // 2, 1190, BEAT):  # 反拍 hat
    place(hat(0.22, 0.03), fr(fm), pan=0.25, bus=DRUM, send=0.05)
for fm in range(KICK0 + BEAT // 4, 1190, BEAT):  # 十六分 hat（轻）
    place(hat(0.07, 0.018), fr(fm), pan=-0.2, bus=DRUM)
    place(hat(0.07, 0.018), fr(fm + BEAT // 2), pan=0.2, bus=DRUM)
for b in range(1, 40, 2):  # 每小节 2、4 拍拍手（第 90 帧起）
    fm = b * BEAT
    if fm >= KICK0 + BEAT and fm < 1190:
        place(clap(0.5), fr(fm), pan=0.0, bus=DRUM, send=0.18)

# ───────── 和声：每章一个和弦；低音跟着根音 ─────────
for c in ORDER:
    a = AT[c]
    root, notes = CHORD[c]
    d = fr(END[c] - a) + 0.1
    t0 = fr(a) if c != 'intro' else fr(KICK0)
    pad_d = d - (0 if c != 'intro' else fr(KICK0))
    p = pad([midi(m) for m in notes], pad_d, 0.9, att=0.12 if c != 'intro' else 0.4, rel=0.5)
    # 和声在左右两边各放一半的音：左边是低的两个，右边是高的两个
    half = len(notes) // 2
    pl = pad([midi(m) for m in notes[:half]], pad_d, 0.9, att=0.12, rel=0.5)
    pr = pad([midi(m) for m in notes[half:]], pad_d, 0.9, att=0.12, rel=0.5)
    place(pl, t0, 0.55, pan=-0.55, bus=TONE, send=0.25)
    place(pr, t0, 0.55, pan=0.55, bus=TONE, send=0.25)
    # 低音：每拍一下根音；第 4 个八分音符补一个高八度
    start = AT[c] if c != 'intro' else KICK0
    for fm in range(start, END[c], BEAT):
        if fm >= 1194:
            break
        place(bass(midi(root), 0.26, 0.8), fr(fm), bus=TONE)
        if ((fm - start) // BEAT) % 2 == 1:
            place(bass(midi(root + 12), 0.1, 0.35), fr(fm + BEAT * 3 // 4), bus=TONE)

# ───────── 两个声部：左 = 低音区拨弦（说话），右 = 高音区玻璃音（证据） ─────────
def voices(c, f0, f1, left=True, right=True, lpan=-0.75, rpan=0.75, lvl=1.0):
    root, notes = CHORD[c]
    low = [m for m in notes if m < 66] or notes
    high = [m + 12 for m in notes]
    for k, fm in enumerate(range(f0, f1, BEAT // 2)):  # 八分音符
        if left and k % 2 == 0:
            place(pluck(midi(low[(k // 2) % len(low)] + 12), 0.16 * lvl, 0.16), fr(fm), pan=lpan, bus=PLUCK, send=0.18)
        if right:
            place(bell(midi(high[(k + 1) % len(high)]), 0.085 * lvl, 0.35), fr(fm + BEAT // 4), pan=rpan, bus=PLUCK, send=0.3)

voices('history', 138, 330)
voices('ratio', 348, 540)
# 反差：三对声音，一次只换一对（明暗：左右都亮；图文：左边被“闷住”；静动：左边只剩长音、右边加速）
voices('contrast', 558, 596)
voices('contrast', 596, 638, left=False)  # 图文：只有右边在说
voices('contrast', 638, 690, left=False, lvl=1.2)
for k in range(0, 42):  # 静动：右边十六分音符
    place(bell(midi(CHORD['contrast'][1][k % 4] + 24), 0.05, 0.2), fr(638 + k * 7.5), pan=0.8, bus=PLUCK, send=0.25)
# 滚动：前半左右各说各的；后半（反向滚动，第 802 帧）声像互换
voices('scroll', 708, 802)
voices('scroll', 802, 870, lpan=0.75, rpan=-0.75)
voices('resp', 888, 970, lvl=0.9)
voices('resp', 970, 1050, left=False, rpan=0.0, lvl=0.8)

# ───────── 开场（0–150） ─────────
sfx(tone_sweep(fr(22), 90, 520, 0.28), fr(0), pan=0.0, send=0.2)  # 中线落下来
sfx(click(0.3), fr(0), pan=0.0)
sfx(pop(1500, 0.18), fr(14), pan=0.0)  # 读数弹出
sfx(sweep(fr(26), 400, 5500, 0.34), fr(10), pan=np.linspace(0.1, 0.9, int(fr(26) * SR)))  # 钴蓝从中线铺开
# “Split”五个字母：左半四个从下往上，右半的 t 从上往下；每个字母一个五声音阶的音
for i, fm in enumerate([24, 27, 30, 33, 36]):
    left = i < 4
    d = fr(34)
    pn = -0.8 if left else 0.8
    sfx(sweep(d, 300, 4200, 0.2) if left else sweep(d, 4200, 300, 0.2), fr(fm), pan=pn, send=0.2)
    sfx(pluck(midi(PENTA[i] + 12), 0.3, 0.2), fr(fm + 6), pan=-0.6 + 0.3 * i, send=0.35)
# 咬合：中线上跑过一束光
sfx(click(0.55), fr(60), pan=0.0)
sfx(thump(0.9, 160, 40, 0.6), fr(60), send=0.2)
sfx(shimmer(0.7, 0.3), fr(54), pan=np.linspace(-0.5, 0.5, int(0.7 * SR)), send=0.5)
sfx(bell(midi(81), 0.22, 1.4), fr(60), pan=0.0, send=0.6)
for k in range(4):  # 分屏布局：四个字一字一声
    sfx(pop(440 * 2 ** (PENTA[k] % 12 / 12 + 0.0), 0.22), fr(62 + 3 * k), pan=-0.5 + 0.12 * k, send=0.25)
sfx(pop(990, 0.2), fr(74), pan=0.6, send=0.25)
sfx(pop(1180, 0.2), fr(82), pan=0.65, send=0.25)
sfx(pop(760, 0.14), fr(94), pan=-0.5, send=0.2)

# ───────── 换幕：左半向上、右半向下 ─────────
def belt(at, vertical=True, weight=1.0):
    f0 = at - 24
    d = fr(26)
    n = int(d * SR)
    if vertical:
        # 左半的扫频上行、右半的扫频下行：声音和画面一样分向两边
        sfx(sweep(d, 250, 4800, 0.38 * weight), fr(f0 + 2), pan=-0.85, send=0.12)
        sfx(sweep(d, 4800, 250, 0.38 * weight), fr(f0 + 2), pan=0.85, send=0.12)
        sfx(tone_sweep(d, 110, 440, 0.12 * weight), fr(f0 + 2), pan=-0.5)
        sfx(tone_sweep(d, 440, 110, 0.12 * weight), fr(f0 + 2), pan=0.5)
    else:
        # 横向：上半向右、下半向左——声像从左扫到右，同时一道下行
        sfx(sweep(d, 250, 4800, 0.4), fr(f0 + 2), pan=np.linspace(-0.9, 0.9, n), send=0.15)
        sfx(sweep(d, 4800, 250, 0.4), fr(f0 + 2), pan=np.linspace(0.9, -0.9, n), send=0.15)
    sfx(thump(1.0 * weight, 140, 36, 0.55), fr(at), send=0.18)
    sfx(click(0.35 * weight), fr(at), pan=0.0)

for c in ORDER[1:]:
    belt(AT[c], vertical=(c != 'end'), weight=1.0 if c != 'end' else 1.15)
    # 落定时和弦换根音：一个钟琴
    root, notes = CHORD[c]
    sfx(bell(midi(notes[-1] + 12), 0.18, 1.0), fr(AT[c]), pan=0.0, send=0.5)

# ───────── 来历（120–330）：四个年代，每个世界穿自己的风格，各有各的“手感” ─────────
# 世界 0 · 1917 构成主义（120–146）：斜线上的滑入，一声硬的木鼓
sfx(sweep(fr(18), 500, 3500, 0.2), fr(124), pan=-0.5)
sfx(thump(0.6, 200, 60, 0.25), fr(142), pan=-0.4)
sfx(pluck(midi(81), 0.2, 0.25), fr(146), pan=0.5, send=0.3)
# 世界 1 · 1963 波普：Slap！——拍击 + 铃（用打击的“啪”和一声带泛音的 pop）
for fm, pn, hz in [(152, -0.4, 620), (158, 0.4, 800), (166, 0.0, 980)]:
    sfx(thump(0.55, 420, 120, 0.15), fr(fm), pan=pn)
    sfx(clap(0.5), fr(fm), pan=pn, send=0.2)
    sfx(pop(hz, 0.2), fr(fm + 1), pan=pn, send=0.2)
sfx(bell(midi(93), 0.14, 0.6), fr(168), pan=0.5, send=0.5)
# 世界 2 · 2009 Aero：玻璃“啪”一下贴边（两次：左边、右边），带一点高频闪光
for fm, pn, m in [(217, -0.6, 84), (238, 0.6, 86)]:
    sfx(sweep(fr(12), 900, 4200, 0.16), fr(fm - 10), pan=pn)
    sfx(thump(0.5, 380, 110, 0.2), fr(fm), pan=pn)
    sfx(click(0.4), fr(fm), pan=pn)
    sfx(bell(midi(m), 0.2, 0.6), fr(fm), pan=pn, send=0.5)
# 世界 3 · 2015 iPad：中缝被拖动——一条滑动的扫频 + 圆润的 pop
for fm, pn in [(268, 0.1), (292, -0.1)]:
    sfx(sweep(fr(14), 700, 2400, 0.14), fr(fm), pan=np.linspace(pn - 0.3, pn + 0.3, int(fr(14) * SR)))
    sfx(pop(700, 0.18), fr(fm + 12), pan=pn, send=0.2)
# 年份滚动：每次换世界，年份像里程表走几格
for a0, a1 in [(142, 160), (188, 208), (250, 266)]:
    for j in range(7):
        sfx(tick(1500 + 160 * j, 0.2), fr(a0 + (a1 - a0) * (j / 7) ** 0.8), pan=-0.35, send=0.1)

# ───────── 比例（330–540）：中线每滑一次一道扫频，数字读数的嘀 ─────────
sfx(pop(900, 0.22), fr(348), pan=0.0)  # 把手出现
sfx(sweep(fr(22), 300, 2400, 0.22), fr(350), pan=np.linspace(-0.3, 0.3, int(fr(22) * SR)))  # 标注线画出
for fm, up in [(384, True), (440, True)]:
    d = fr(26)
    sfx(sweep(d, 500, 3500, 0.32), fr(fm), pan=np.linspace(-0.6, 0.6, int(d * SR)), send=0.2)
    sfx(tone_sweep(d, 160, 320, 0.14), fr(fm), pan=0.0)
    for j in range(7):  # 读数滚动的嘀嗒
        sfx(tick(2000 + 180 * j, 0.16), fr(fm + 2 + j * 3.4), pan=0.1)
    sfx(thump(0.5, 200, 60, 0.3), fr(fm + 26), pan=0.0)
    sfx(bell(midi(PENTA[(fm // 60) % 5] + 12), 0.15, 0.7), fr(fm + 26), pan=0.2, send=0.5)
for fm in (388, 444):  # 代码标签滚动、文字折行
    sfx(tick(2600, 0.2), fr(fm), pan=0.2)
    sfx(pop(820, 0.12), fr(fm + 6), pan=0.5)

# ───────── 反差（540–690）：从中线向两边撕开 ─────────
sfx(pop(700, 0.18), fr(562), pan=0.0)  # 对比度读数弹出
sfx(pop(1000, 0.14), fr(554), pan=0.0)
for fm, nm in [(596, 0), (638, 1)]:
    d = fr(18)
    n = int(d * SR)
    sfx(sweep(d, 300, 5000, 0.34), fr(fm), pan=np.linspace(-0.1, -0.95, n), send=0.15)  # 左半：从中线向左撕开
    sfx(sweep(d, 300, 5000, 0.34), fr(fm), pan=np.linspace(0.1, 0.95, n), send=0.15)  # 右半：向右撕开
    sfx(thump(0.7, 180, 50, 0.35), fr(fm + 14), pan=0.0)
    sfx(click(0.5), fr(fm + 14))
    sfx(bell(midi(PENTA[2 + nm] + 12), 0.2, 0.9), fr(fm + 14), pan=0.0, send=0.5)

# ───────── 滚动（690–870）：滚轮的惯性 ─────────
for fm in (730, 768):
    d = fr(28)
    sfx(sweep(d, 600, 3200, 0.26), fr(fm), pan=0.45, send=0.1)  # 右边在滚
    for j in range(6):
        sfx(tick(1700, 0.2), fr(fm + 3 + j * 3.2 * (1 + j * 0.15)), pan=0.5)  # 滚动条一格一格
    sfx(pop(560 + 80 * (fm == 768), 0.2), fr(fm + 26), pan=-0.5)  # 左边的序号跳一格
    sfx(thump(0.35, 240, 80, 0.25), fr(fm + 26), pan=-0.4)
# 反过来：左半向下、右半向上
d = fr(26)
sfx(sweep(d, 4800, 250, 0.36), fr(802 + 1), pan=-0.85, send=0.12)
sfx(sweep(d, 250, 4800, 0.36), fr(802 + 1), pan=0.85, send=0.12)
sfx(thump(0.6, 200, 50, 0.4), fr(826))
sfx(pop(880, 0.2), fr(824), pan=0.0)  # 药丸

# ───────── 响应式（870–1050） ─────────
# 窗口缩小：每缩 ~40 像素一声嘀（1440 → 768 共 17 格，768 → 390 共 9 格），音高随宽度下降
for j in range(17):
    fm = 906 + 34 * ((j / 17) ** 1.0)
    sfx(tick(2400 - 80 * j, 0.2), fr(fm), pan=0.0)
for j in range(9):
    fm = 944 + 26 * (j / 9)
    sfx(tick(1000 - 40 * j, 0.22), fr(fm), pan=0.0)
sfx(bell(midi(93), 0.2, 0.7), fr(940), pan=0.0, send=0.5)  # 768：断点
sfx(pop(900, 0.2), fr(952), pan=0.0)  # @media 药丸
sfx(sweep(fr(16), 800, 3000, 0.22), fr(946), pan=np.linspace(0.6, -0.6, int(fr(16) * SR)))  # 窗格叠起来
sfx(thump(0.55, 300, 80, 0.25), fr(962), pan=0.0)
# 中线转 90°：一道扫频绕着声像转一圈（左 → 右 → 左），同时升调
d = fr(30)
n = int(d * SR)
ang = np.linspace(0, np.pi, n)
sfx(sweep(d, 300, 6000, 0.42), fr(970), pan=-np.cos(ang) * 0.9, send=0.25)
sfx(tone_sweep(d, 140, 560, 0.2), fr(970), pan=np.sin(ang) * 0.5)
sfx(thump(0.8, 150, 40, 0.5), fr(1000), send=0.2)
sfx(click(0.5), fr(1000))
sfx(bell(midi(88), 0.2, 1.0), fr(1000), pan=0.0, send=0.55)
sfx(pop(640, 0.2), fr(1004), pan=-0.3)  # ① 先读文字
sfx(pop(480, 0.2), fr(1010), pan=0.3)  # ② 再看图

# ───────── 片尾（1050–1200） ─────────
# 中线从横转回竖：一道反向的扫频，两个声部从左右汇到中间
d = fr(40)
n = int(d * SR)
ang = np.linspace(np.pi, 0, n)
sfx(sweep(d, 6000, 300, 0.4), fr(1064), pan=-np.cos(ang) * 0.9, send=0.25)
sfx(tone_sweep(d, 560, 140, 0.18), fr(1064), pan=np.sin(ang) * 0.5)
sfx(thump(1.0, 170, 38, 0.7), fr(1104), send=0.25)  # 转正
sfx(click(0.6), fr(1104))
sfx(shimmer(0.9, 0.3), fr(1100), pan=np.linspace(-0.6, 0.6, int(0.9 * SR)), send=0.5)
sfx(shimmer(0.9, 0.25), fr(1146), pan=np.linspace(0.6, -0.6, int(0.9 * SR)), send=0.5)  # 中线上跑过的一束光
voices('end', 1104, 1190, lpan=-0.25, rpan=0.25, lvl=1.0)
# 五个词：五声音阶上行，声像由左到右
for k in range(5):
    fm = 1112 + 14 * k
    sfx(bell(midi(PENTA[k] + 12), 0.22, 0.9), fr(fm), pan=-0.6 + 0.3 * k, send=0.55)
    sfx(pop(700 + 90 * k, 0.16), fr(fm), pan=-0.6 + 0.3 * k, send=0.2)
# 最后一个和弦：中心的钟琴
for k, m in enumerate([57, 64, 71, 76, 81]):
    sfx(bell(midi(m), 0.17, 2.4), fr(1170) + 0.01 * k, pan=-0.2 + 0.1 * k, send=0.75)
sfx(thump(0.7, 120, 40, 0.9), fr(1170), send=0.25)

# ───────── 混合：鼓“压”和声；反差一章让左边“闷”一次 ─────────
duck = np.ones(N)
tk = np.arange(N) / SR
for fm in kick_frames:
    i = int(fr(fm) * SR)
    if i >= N:
        break
    seg = min(N - i, int(0.5 * SR))
    duck[i : i + seg] = np.minimum(duck[i : i + seg], 1 - 0.55 * np.exp(-np.arange(seg) / SR / 0.14))
TONE *= duck

# 每次落定前“屏住一口气”：落定前 9 帧，鼓 / 和声 / 拨弦压到 30%，到点（拍点）一起弹回来——重击才有分量
breath = np.ones(N)
for c in ORDER[1:]:
    i0, i1 = int(fr(AT[c] - 9) * SR), int(fr(AT[c]) * SR)
    ramp = int(0.03 * SR)
    breath[i0:i1] = 0.3
    breath[i0 : i0 + ramp] = np.linspace(1, 0.3, ramp)
    breath[i1 : i1 + int(0.006 * SR)] = np.linspace(0.3, 1, int(0.006 * SR))
for bus in (DRUM, TONE, PLUCK):
    bus *= breath

# 图文那一对（596–638）：左半的拨弦被低通“闷住”——两边反差
a, b = int(fr(596) * SR), int(fr(638) * SR)
PLUCK[0, a:b] = onepole_lp(PLUCK[0, a:b], 700)


def reverb(x, seed, dec=0.7, length=2.6):
    t = tt(length)
    ir = np.random.default_rng(seed).standard_normal(len(t)) * np.exp(-t / dec)
    ir = onepole_lp(ir, 6500)
    ir[: int(0.02 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + len(ir)
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


mix = DRUM * 0.9 + TONE * 0.9 + PLUCK * 1.0 + SFX * 1.0
mix[0] += reverb(SEND[0], 1) * 0.55
mix[1] += reverb(SEND[1], 2) * 0.55
mix = mix.T
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
fade = np.ones(N)
fo = int(0.5 * SR)
fade[-fo:] = np.linspace(1, 0, fo) ** 2
mix *= fade[:, None] * 0.89

root = os.path.dirname(os.path.abspath(__file__))
out_dir = os.path.normpath(os.path.join(root, '..', '..', '..', 'public', '03-split-screen'))
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
