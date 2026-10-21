"""
Design Style · 布局 01 · Bento Grid —— 配乐与音效（纯代码合成，无外部音源）

150 BPM（1 拍 = 0.4 秒 = 24 帧）· F 大调 · 15 秒 · “发布会开场”式：干净、紧、有推进感
  0–0.8s     开场：Pad 铺底 + 低频上扬，主角卡出现
  0.8s       第 48 帧：卡片“裂开”成发布会排版 → 重音 + 律动进来
  0.8–7.6s   01 发布会 / 02 便当 / 03 Metro / 04 iOS：四踩底鼓、反拍踩镲、八分贝斯、拨弦琶音
             便当段用五声音阶拨弦；Metro 段加磁贴翻面的“咔嗒”
  7.6–10s    05 五条规则：鼓停、整条音乐低通，每条规则一声“叮”
  10–11.6s   06 个人主页：滤波器打开，律动回归
  11.6–13.2s 07 产品后台：十六分踩镲、数字滚动的细碎嘀嗒
  13.2–15s   END：上冲 → 重音 → 收束和弦
每次版面重排：卡片移动最快的那一刻（转场开始 + 12 帧）正好落在拍点上，放一个 whoosh + 重音，和弦也在这一拍换。
所有时间点与 layout.ts / content.tsx 的关键帧对齐（帧 / 60 = 秒）。

用法：python3 layouts/01-bento-grid/audio/make_music.py
输出：public/01-bento-grid/music.wav（ffmpeg 响度标准化到 -14 LUFS）
"""
import os
import shutil
import subprocess
import wave

import numpy as np

SR = 48000
DUR = 15.0
N = int(SR * DUR)
rng = np.random.default_rng(2002)

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


# ---------------- 和声 ----------------
BEAT = 24  # 帧
CH = {  # 名字: (贝斯根音, 和弦音)
    'Fmaj9': (41, [57, 60, 64, 67]),   # F2 | A3 C4 E4 G4
    'Am9': (45, [55, 60, 64, 71]),     # A2 | G3 C4 E4 B4
    'Dm9': (38, [57, 60, 64, 65]),     # D2 | A3 C4 E4 F4
    'Gsus': (43, [55, 60, 62, 67]),    # G2 | G3 C4 D4 G4
    'Bbmaj9': (46, [57, 60, 62, 65]),  # Bb2 | A3 C4 D4 F4
}
# 卡片重排“最快的一刻” = TRANS.at + 12，全部落在拍点上（layout.ts 的 HIT）
HITS = [168, 264, 360, 456, 600, 696, 792]
# (起始帧, 和弦)：和弦在每个章节的重音拍上换
PROG = [(0, 'Fmaj9'), (168, 'Am9'), (264, 'Dm9'), (360, 'Bbmaj9'), (456, 'Fmaj9'), (528, 'Gsus'),
        (600, 'Fmaj9'), (696, 'Am9'), (744, 'Gsus'), (792, 'Fmaj9')]


def chord_at(frame):
    cur = PROG[0][1]
    for s, n in PROG:
        if frame >= s:
            cur = n
    return CH[cur]


# Pad：贯穿全片，跟随和弦
for k, (s, n) in enumerate(PROG):
    e = PROG[k + 1][0] if k + 1 < len(PROG) else 900
    notes = CH[n][1]
    lvl = 0.55 if s < 792 else 0.8
    place(pad([midi(m) for m in notes], fr(e - s) + 0.05, lvl, att=0.25 if s else 0.7, rel=0.5, bright=1.3), fr(s), send=0.35)

# 开场：低频上扬 + 主角卡出现的一声
place(sub_rise(fr(48), 35, 70, 0.5), 0)
sfx(bell(midi(77), 0.22, 0.6), fr(6), pan=0.1, send=0.5)
sfx(riser(fr(44), 0.25), fr(4), send=0.2)

# ---------------- 律动 ----------------
# 鼓：48–456（KEY / 便当 / Metro / iOS）、600–792（HOME / DASH）
# WIRE（五条规则）456–600：鼓停，只留贝斯 + 琶音，并被整体低通
GROOVE = [(48, 456), (600, 792)]
ARP_PAT = [0, 2, 1, 3, 2, 1, 3, 2]  # 十六分音符琶音顺序


def in_groove(fm):
    return any(a <= fm < b for a, b in GROOVE)


for b in range(0, 900 // BEAT):
    fm = b * BEAT
    root, notes = chord_at(fm)
    if in_groove(fm):
        place(kick(0.95), fr(fm))
        if b % 2 == 1:
            place(clap(0.4), fr(fm), pan=0.05, send=0.25)
        place(hat(0.22), fr(fm + 12), pan=0.25)
        if 696 <= fm < 792:  # DASH：十六分踩镲，更紧
            place(hat(0.1, 0.015), fr(fm + 6), pan=-0.25)
            place(hat(0.1, 0.015), fr(fm + 18), pan=-0.25)
    # 贝斯：八分音符（WIRE 段也保留，给低通后的段落一点脉搏）
    if 48 <= fm < 792:
        for h in (0, 12):
            oc = 12 if (h == 12 and b % 2 == 1) else 0
            place(bass(midi(root + oc), 0.16, 0.55 if h == 0 else 0.4), fr(fm + h))
    # 琶音：十六分拨弦
    if 48 <= fm < 792:
        for q in range(4):
            m = notes[ARP_PAT[(b * 4 + q) % 8] % len(notes)] + 12
            lvl = 0.16 if q == 0 else 0.11
            place(pluck(midi(m), lvl, 0.12), fr(fm + q * 6), pan=0.3 * (1 if q % 2 else -1), send=0.25)

# 进 WIRE 之前、iOS 段末尾：小军鼓加花
for k in range(8):
    place(clap(0.07 + 0.025 * k), fr(432 + k * 3), send=0.15)
# WIRE 末尾：军鼓滚奏 + 上冲，打开滤波器回到 HOME
for k in range(16):
    place(clap(0.08 + 0.02 * k), fr(576 + k * 1.5), send=0.15)
sfx(riser(fr(30), 0.45), fr(570), send=0.2)

# DASH → END：上冲
sfx(riser(fr(64), 0.55), fr(728), send=0.25)
for k in range(8):
    place(clap(0.08 + 0.03 * k), fr(768 + k * 3), send=0.15)

# ---------------- 音效（与 layout.ts / content.tsx / history.tsx 的关键帧对齐） ----------------
# 第 48 帧：主角卡“裂开”成发布会排版
sfx(thock(0.9, 220, 60), fr(48), send=0.2)
sfx(whoosh(fr(36), 400, 7000, 0.35, 0.45), fr(50), pan=-0.1)
sfx(bell(midi(84), 0.25, 0.5), fr(48), pan=0.15, send=0.5)

# 版面重排：whoosh 的峰值、重音都落在 HIT（at + 12）；落定时一声轻点
for at, dur, pan in [(156, 34, 0.2), (252, 34, -0.2), (348, 38, 0.2), (444, 36, -0.2), (588, 36, 0.2), (684, 36, -0.2)]:
    sfx(whoosh(fr(34), 300, 6500, 0.38, 0.5), fr(at + 12 - 17), pan=pan)
    sfx(thock(0.55), fr(at + 12), send=0.15)
    sfx(click(0.22), fr(at + dur - 2), pan=-pan)  # 落定


# 内容出现：每张卡一声轻拨（按出现顺序沿和弦上行）
def pops(times, frame0, level=0.17, dec=0.09):
    _, notes = chord_at(frame0)
    scale = sorted(set([n + 24 for n in notes] + [n + 36 for n in notes]))
    times = sorted(set(times))
    for k, fm in enumerate(times):
        sfx(pluck(midi(scale[k % len(scale)]), level, dec), fr(fm), pan=-0.4 + 0.8 * (k / max(1, len(times) - 1)), send=0.35)


# 01 KEY：发布会卡片
pops([80 + d for d in [0, 8, 4, 12, 16, 10]], 80)
# 02 便当：漆盒落下一声木质“咚”，然后每格菜一声（五声音阶，带一点和风）
sfx(thock(0.5, 160, 70), fr(166), send=0.25)
PENTA = [72, 74, 77, 79, 81, 84, 86]  # F 大调五声：C D F G A C D
for k, o in enumerate(sorted([0, 2, 1, 4, 3, 5, 6])):
    sfx(pluck(midi(PENTA[k] + 12), 0.15, 0.22), fr(174 + o * 4), pan=-0.35 + 0.7 * k / 6, send=0.4)
sfx(bell(midi(89), 0.14, 0.8), fr(184), pan=0.25, send=0.6)  # 标题“便当”
# 03 Metro：磁贴就位 + 人脉格子翻面的“咔嗒”（Metro 的转门动画）
pops([268 + o * 3 for o in [0, 2, 4, 6, 3, 5, 7]], 268, 0.15)
for k in range(9):
    sfx(click(0.1), fr(278 + ((k * 7) % 9) * 6 + 7), pan=-0.3 + 0.07 * k, send=0.1)
sfx(click(0.16), fr(298), pan=0.3)  # 日历磁贴翻起
# 04 iOS：小组件弹出 + 图标
pops([366 + o * 3 for o in [2, 0, 1, 3, 5, 4, 6]], 366, 0.15)
for k in range(4):
    sfx(pluck(midi(96 + [0, 2, 4, 7][k]), 0.06, 0.05), fr(380 + k * 2), pan=0.35, send=0.2)

# 数字滚动：细碎的嘀嗒（KEY 的 22 小时 / ¥5,999，DASH 的几组数字）
for a, d, lvl in [(80, 40, 0.05), (702, 48, 0.06)]:
    fm = a
    step = 1.5
    while fm < a + d:
        sfx(click(lvl * (1 - (fm - a) / d * 0.6)), fr(fm), pan=0.3 * np.sin(fm), send=0.05)
        step *= 1.07
        fm += step

# 05 WIRE：标题 + 五条规则（附点八分一条，五声音阶上行的“叮”）
sfx(click(0.35), fr(452))
RULE_NOTES = [72, 74, 77, 79, 81]
RULES_AT = [468, 486, 504, 522, 540]
for k, fm in enumerate(RULES_AT):
    sfx(bell(midi(RULE_NOTES[k] + 12), 0.32, 0.55), fr(fm), pan=-0.2 + 0.1 * k, send=0.5)
    sfx(thock(0.35, 150, 80), fr(fm))
# 标注（间距 / 圆角）出现时的测量“嘀”
for fm in [504, 507, 510, 522, 526, 530]:
    sfx(pluck(midi(96), 0.07, 0.04), fr(fm), pan=0.4, send=0.2)
# 对齐网格：每列填色一声
for k in range(3):
    sfx(pluck(midi(84 + [0, 4, 7][k]), 0.06, 0.06), fr(540 + k * 3), pan=-0.2 + 0.2 * k, send=0.3)

# 06 HOME / 07 DASH：头部标签 + 卡片
for fm in [594, 600, 690, 696]:
    sfx(click(0.18), fr(fm), pan=-0.3)
pops([606 + o * 3 for o in [3, 1, 2, 4, 0, 6, 5]], 606, 0.14)
pops([702 + o * 3 for o in [0, 1, 2, 3, 5, 6, 4]], 702, 0.14)

# END：版面收拢 → 重音 → 标题 → 收束
sfx(whoosh(fr(40), 300, 8000, 0.45, 0.5), fr(772), pan=0)
sfx(thock(1.0, 230, 50), fr(792), send=0.3)
place(kick(1.0), fr(792))
sfx(bell(midi(77), 0.3, 1.2), fr(792), pan=-0.15, send=0.6)
sfx(bell(midi(84), 0.25, 1.2), fr(796), pan=0.15, send=0.6)
for k, m in enumerate([89, 91, 96]):  # 标题出现：三声上行
    sfx(bell(midi(m), 0.16, 0.7), fr(812 + k * 6), pan=-0.2 + 0.2 * k, send=0.6)
place(bass(midi(41), 1.4, 0.6), fr(792))

# ---------------- WIRE 段：把音乐“闷住” ----------------
tsec = np.arange(N) / SR
c = np.full(N, 16000.0)
a, b = fr(446), fr(466)
c = np.where((tsec >= a) & (tsec < b), 16000 * (700 / 16000) ** np.clip((tsec - a) / (b - a), 0, 1), c)
c = np.where((tsec >= b) & (tsec < fr(572)), 700, c)
a2, b2 = fr(572), fr(604)
c = np.where((tsec >= a2) & (tsec < b2), 700 * (16000 / 700) ** (np.clip((tsec - a2) / (b2 - a2), 0, 1) ** 2), c)
seg = slice(int(fr(436) * SR), int(fr(610) * SR))
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
out_dir = os.path.normpath(os.path.join(root, '..', '..', '..', 'public', '01-bento-grid'))
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
