"""
Motion Style · 001 · 包豪斯 —— 配乐与音效（纯代码合成，无外部音源）

120 BPM · A 小调 → C 大调收尾 · 15 秒
所有音效时间点都与 Bauhaus.tsx / chapters.tsx 的关键帧对齐（帧 / 60 = 秒）。

用法：python3 styles/001-bauhaus/audio/make_music.py
输出：public/001-bauhaus/music.wav（并用 ffmpeg 响度标准化到 -14 LUFS）
"""
import os
import shutil
import subprocess
import wave

import numpy as np

SR = 48000
DUR = 15.0
N = int(SR * DUR)
BEAT = 0.5  # 120 BPM
rng = np.random.default_rng(1919)

L = np.zeros(N)
R = np.zeros(N)
SEND_L = np.zeros(N)  # 混响发送
SEND_R = np.zeros(N)


def fr(frame):
    return frame / 60.0


def place(sig, t, gain=1.0, pan=0.0, send=0.0):
    """把单声道信号放到时间 t（秒），pan ∈ [-1, 1]"""
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    gl = np.cos((pan + 1) * np.pi / 4) * gain
    gr = np.sin((pan + 1) * np.pi / 4) * gain
    L[i : i + len(sig)] += sig * gl
    R[i : i + len(sig)] += sig * gr
    if send:
        SEND_L[i : i + len(sig)] += sig * gl * send
        SEND_R[i : i + len(sig)] += sig * gr * send


def tt(d):
    return np.arange(int(d * SR)) / SR


def onepole_lp(x, cutoff):
    """一阶低通，cutoff 可为常数或逐样本数组"""
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


# ---------------- 乐器 ----------------

def kick(level=1.0):
    t = tt(0.45)
    f = 48 + 120 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.16)
    click = hp(noise(0.45), 3000) * np.exp(-t / 0.004) * 0.35
    return np.tanh((body + click) * 1.6) * level


def boom(level=1.0, low=36, dec=0.55):
    t = tt(1.6)
    f = low + 90 * np.exp(-t / 0.05)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / dec)
    crack = onepole_lp(noise(1.6), 2400) * np.exp(-t / 0.05) * 0.9
    return np.tanh((body * 1.2 + crack) * 1.4) * level


def clap(level=1.0):
    t = tt(0.4)
    n = hp(onepole_lp(noise(0.4), 5000), 900)
    env = np.zeros_like(t)
    for k, off in enumerate([0, 0.011, 0.022]):
        env += np.where(t >= off, np.exp(-(t - off) / (0.007 if k < 2 else 0.11)), 0)
    return n * env * 0.8 * level


def hat(level=1.0, dec=0.028):
    t = tt(0.2)
    return hp(noise(0.2), 7000) * np.exp(-t / dec) * level


def marimba(freq, level=1.0, dec=0.42):
    t = tt(1.2)
    index = 1.8 * np.exp(-t / 0.018)
    y = np.sin(2 * np.pi * freq * t + index * np.sin(2 * np.pi * freq * 4.0 * t))
    y += 0.25 * np.sin(2 * np.pi * freq * 10.0 * t) * np.exp(-t / 0.01)
    return y * np.exp(-t / dec) * level


def pluck(freq, level=1.0, dec=0.18):
    t = tt(0.7)
    index = 2.6 * np.exp(-t / 0.05)
    y = np.sin(2 * np.pi * freq * t + index * np.sin(2 * np.pi * freq * 2.0 * t))
    att = np.minimum(1, t / 0.002)
    return y * np.exp(-t / dec) * att * level


def bass(freq, d=0.24, level=1.0):
    t = tt(d + 0.08)
    env = np.minimum(1, t / 0.004) * np.exp(-t / 0.22) * np.where(t < d, 1, np.exp(-(t - d) / 0.02))
    y = np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(4 * np.pi * freq * t) + 0.12 * np.sin(6 * np.pi * freq * t)
    return np.tanh(y * 1.3) * env * level


def pad(freqs, d, level=1.0, att=0.35, rel=0.5, cutoff=1400):
    t = tt(d + rel)
    y = np.zeros_like(t)
    for fq in freqs:
        for det in (-0.006, 0.0, 0.006):
            ph = (fq * (1 + det) * t + rng.random()) % 1.0
            y += 2 * ph - 1
    y = onepole_lp(onepole_lp(y, cutoff), cutoff)
    env = np.minimum(1, t / att) * np.where(t < d, 1, np.exp(-(t - d) / (rel / 4)))
    return y / (len(freqs) * 3) * env * level


def pop(freq, level=1.0):
    t = tt(0.25)
    f = freq * (0.55 + 0.45 * (1 - np.exp(-t / 0.012)))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 0.07) * np.minimum(1, t / 0.001) * level


def tick(freq=2600, level=1.0):
    t = tt(0.12)
    y = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.012)
    y += hp(noise(0.12), 4000) * np.exp(-t / 0.002) * 0.6
    return y * level


def mouse_click(level=1.0):
    t = tt(0.16)
    a = hp(noise(0.16), 2500) * np.exp(-t / 0.0025)
    b = np.roll(hp(noise(0.16), 1800) * np.exp(-t / 0.002) * 0.6, int(0.075 * SR))
    b[: int(0.075 * SR)] = 0
    return (a + b) * level


def whoosh(d=0.6, lo=300, hi=5000, level=1.0, rise=0.55):
    t = tt(d)
    x = t / d
    cut = lo + (hi - lo) * np.sin(np.pi * np.clip(x / (2 * rise), 0, 1)) ** 2
    y = onepole_lp(onepole_lp(noise(d), cut), cut)
    env = np.sin(np.pi * x) ** 1.5
    return y * env / (np.abs(y).max() + 1e-9) * level


def riser(d=0.45, level=1.0):
    t = tt(d)
    x = t / d
    cut = 400 + 9000 * x ** 2
    n = hp(onepole_lp(noise(d), cut), 200)
    f = 220 * 2 ** (3 * x)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.35
    y = (n / (np.abs(n).max() + 1e-9) + tone) * x ** 2.2
    return y * level


def reverse_shimmer(d=0.42, level=1.0):
    t = tt(d)
    x = t / d
    y = hp(noise(d), 5000) * x ** 3
    for m in (88, 91, 95, 100):  # E6 G6 B6 E7（C 大七）
        y += 0.15 * np.sin(2 * np.pi * midi(m) * t) * x ** 2
    return y * level


def deflate(level=1.0):
    t = tt(0.45)
    f = 520 * np.exp(-t / 0.18) + 130
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) + 0.3 * np.sin(2 * ph)
    return y * np.minimum(1, t / 0.01) * np.exp(-t / 0.16) * level


# ---------------- 编排 ----------------

CHORDS = [  # (起始拍, 和弦音 MIDI)
    (0, [57, 60, 64]),   # Am
    (4, [53, 57, 60]),   # F
    (8, [48, 55, 64]),   # C
    (12, [55, 59, 62]),  # G
    (16, [57, 60, 64]),  # Am
    (20, [53, 57, 60]),  # F
    (22, [55, 59, 62, 65]),  # G7（悬念）
    (26, [48, 55, 60, 64]),  # C（收束）
]
ROOTS = {0: 45, 4: 41, 8: 36, 12: 43, 16: 45, 20: 41, 22: 43, 26: 36}


def chord_at(beat):
    cur = CHORDS[0][1]
    for b, notes in CHORDS:
        if beat >= b:
            cur = notes
    return cur


def root_at(beat):
    cur = 45
    for b, r in ROOTS.items():
        if beat >= b:
            cur = r
    return cur


# 结构（拍 = 30 帧）：
#   拍 0–4    开场：三次砸下 + 标题，只有 Pad，不上鼓
#   拍 4–24   九个章节：鼓组 / 贝斯 / 拨弦全开，每个剪辑点一记重拍
#   拍 24–26  回顾：半拍感，留白给九宫格
#   拍 26–    片尾：C 大调收束

DROP = 4
RECAP_B = 24

# Pad：从标题开始铺底
for i, (b, notes) in enumerate(CHORDS):
    nb = CHORDS[i + 1][0] if i + 1 < len(CHORDS) else 30
    start = max(b, 2)
    if nb <= start:
        continue
    d = (nb - start) * BEAT
    lvl = 0.10 if b < 22 else 0.085
    if b == 26:
        d = 1.9
    place(pad([midi(n + 12) for n in notes], d, lvl, cutoff=1700 if b >= DROP else 1000), start * BEAT, 1.0, 0, 0.35)

# 鼓
for b in range(DROP, RECAP_B):
    t = b * BEAT
    place(kick(0.85), t)
    place(hat(0.16), t + BEAT / 2, 1, 0.25)
    place(hat(0.07, 0.015), t + BEAT / 4, 1, -0.3)
    place(hat(0.07, 0.015), t + 3 * BEAT / 4, 1, -0.3)
    if b % 2 == 1:
        place(clap(0.42), t, 1, 0.05, 0.25)
# 回顾段：只留一记底鼓和反拍镲
place(kick(0.9), RECAP_B * BEAT)
place(hat(0.12), RECAP_B * BEAT + BEAT / 2, 1, 0.25)
place(hat(0.12), (RECAP_B + 1) * BEAT + BEAT / 2, 1, -0.25)
# 进 drop 之前的 16 分音符镲片加速
for s in range(8):
    place(hat(0.04 + 0.012 * s, 0.012), (DROP - 1) * BEAT + s * BEAT / 8, 1, 0.3 if s % 2 else -0.3)

# 贝斯
for b in range(DROP, RECAP_B):
    t = b * BEAT
    r = midi(root_at(b))
    place(bass(r, 0.2, 0.5), t)
    place(bass(r * 2 if b % 2 else r, 0.18, 0.38), t + BEAT / 2)
place(bass(midi(root_at(RECAP_B)), 0.9, 0.45), RECAP_B * BEAT)

# 拨弦琶音：前两章 8 分音符，之后 16 分音符
pattern = [0, 1, 2, 1, 2, 3, 2, 1]
for b in range(DROP, RECAP_B):
    notes = chord_at(b)
    steps = 2 if b < 8 else 4
    for s in range(steps):
        idx = pattern[(b * 4 + s * (4 // steps)) % len(pattern)]
        n = notes[idx % len(notes)] + 24 + (12 if idx >= len(notes) else 0)
        place(pluck(midi(n), 0.11 if s % 2 == 0 else 0.075), b * BEAT + s * BEAT / steps, 1, 0.35 if s % 2 else -0.35, 0.3)

# ---------------- 音效（与 Bauhaus.tsx / chapters.tsx 的关键帧对齐） ----------------
# 章节起点（帧）：与 chapters.tsx 的 CHAPTERS 一致
STARTS = [120, 180, 240, 330, 420, 480, 540, 600, 660]

# 开场：三次砸下 → 飞向台标 → 标题
place(boom(0.95, 40, 0.5), fr(0), 1, -0.25, 0.25)
place(boom(0.85, 46, 0.4), fr(15), 1, 0.3, 0.25)
place(boom(1.0, 34, 0.6), fr(31), 1, 0.15, 0.3)
place(marimba(midi(81), 0.25), fr(31), 1, 0.2, 0.4)
place(whoosh(0.5, 400, 6000, 0.3), fr(44))
for m, pan in [(69, -0.3), (72, 0.0), (76, 0.3)]:
    place(marimba(midi(m), 0.16, 0.6), fr(60), 1, pan, 0.45)
place(pop(midi(84), 0.22), fr(66), 1, 0, 0.3)
place(riser(0.36, 0.38), fr(98))

# 每个剪辑点：转场呼啸 + 重拍
for i, s in enumerate(STARTS):
    place(whoosh(0.17, 900, 9000, 0.13, 0.9), fr(s - 10), 1, [-0.5, 0.5][i % 2])
    place(boom(0.75 if i == 0 else 0.5, 44 + (i % 3) * 4, 0.32), fr(s), 1, 0, 0.2)

# 01 色彩：十二色相依次弹出 —— 马林巴琶音上行
penta = [69, 72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96]
for i in range(12):
    place(marimba(midi(penta[i]), 0.13, 0.28), fr(132 + 2 * i), 1, -0.7 + i * 0.13, 0.35)
for i in range(3):
    place(pop(midi(76 + i * 3), 0.12), fr(120 + i * 2), 1, -0.3 + i * 0.3)

# 02 形与色：三次揭晓
for frm, m, pan in [(192, 76, -0.45), (201, 79, 0.0), (210, 84, 0.45)]:
    place(marimba(midi(m), 0.3), fr(frm), 1, pan, 0.45)
    place(marimba(midi(m + 12), 0.1), fr(frm) + 0.02, 1, pan, 0.45)
    place(pop(midi(m), 0.16), fr(frm), 1, pan)

# 03 字体：每个字母一声木琴 + 三个圆点 + 打字声
scale = [69, 72, 74, 76, 79, 81, 84]
for i in range(7):
    place(marimba(midi(scale[i]), 0.17, 0.26), fr(246 + i * 3), 1, -0.6 + i * 0.2, 0.3)
for frm, m, pan in [(262, 81, -0.6), (265, 84, -0.35), (274, 88, 0.2)]:
    place(pop(midi(m), 0.26), fr(frm), 1, pan, 0.3)
for k in range(14):
    place(tick(3200 + (k % 3) * 400, 0.1), fr(284 + 2 * k), 1, -0.5 + k / 13, 0.1)

# 04 海报：三张海报依次落下
for frm, pan in [(336, -0.6), (346, 0.0), (356, 0.6)]:
    place(boom(0.6, 52, 0.26), fr(frm), 1, pan, 0.2)
    place(whoosh(0.12, 1200, 8000, 0.1, 0.9), fr(frm) - 0.1, 1, pan)
for frm, pan in [(344, -0.6), (350, -0.6), (354, 0.0), (362, 0.0), (366, 0.6), (372, 0.6)]:
    place(pop(midi(79 if pan < 0 else 84 if pan == 0 else 88), 0.1), fr(frm), 1, pan)

# 05 建筑：楼体升起，玻璃反光
place(whoosh(0.4, 200, 2500, 0.18, 0.4), fr(421), 1, -0.3)
for i in range(7):
    place(tick(2400, 0.12), fr(436 + 2 * i), 1, -0.7, 0.15)
place(reverse_shimmer(0.42, 0.18), fr(446), 1, 0.4, 0.5)
for frm in [446, 452]:
    place(tick(2600, 0.16), fr(frm), 1, 0.3, 0.15)

# 06 家具：钢管弯出来，铁纱布一条条绷上
place(whoosh(0.42, 500, 5000, 0.2, 0.7), fr(480), 1, -0.4)
for i, frm in enumerate([498, 502, 506]):
    place(clap(0.16), fr(frm), 1, -0.3 + 0.3 * i, 0.1)
    place(pop(midi(64 + i * 5), 0.12), fr(frm), 1, -0.3 + 0.3 * i)
for frm in [510, 516]:
    place(tick(2600, 0.16), fr(frm), 1, 0.4, 0.15)

# 07 灯具：灯罩落下，拉绳“咔哒”，灯亮
place(pop(midi(67), 0.18), fr(548), 1, 0, 0.2)
place(mouse_click(0.55), fr(562), 1, 0.35)
place(reverse_shimmer(0.3, 0.2), fr(572) - 0.3 + 0.02, 1, 0, 0.5)
for m in [72, 76, 79, 84]:
    place(marimba(midi(m), 0.1, 0.9), fr(572), 1, 0, 0.6)
for frm in [580, 586]:
    place(tick(2600, 0.14), fr(frm), 1, 0.4, 0.15)

# 08 纺织：梭子左右来回
for k in range(9):
    place(whoosh(0.07, 2500, 9000, 0.07, 0.5), fr(604 + 5 * k), 1, -0.6 if k % 2 == 0 else 0.6)
for frm in [644, 650]:
    place(tick(2600, 0.14), fr(frm), 1, 0.4, 0.15)

# 09 舞台：三盏追光依次打开
for i, frm in enumerate([660, 666, 672]):
    place(boom(0.4, 70, 0.14), fr(frm), 1, -0.6 + 0.6 * i)
    place(tick(900, 0.22), fr(frm), 1, -0.6 + 0.6 * i, 0.3)

# 回顾：九宫格收拢
place(boom(0.95, 36, 0.6), fr(720), 1, 0, 0.3)
place(clap(0.3), fr(720), 1, 0, 0.4)
for k, frm in enumerate([727, 730, 733, 736]):
    place(marimba(midi([76, 79, 81, 84][k]), 0.12, 0.35), fr(frm), 1, 0.5 - k * 0.3, 0.4)
place(whoosh(0.3, 600, 6000, 0.16), fr(742))
place(pop(midi(88), 0.16), fr(748), 1, 0, 0.3)
place(riser(0.4, 0.4), fr(756))

# 片尾：收束重击 + C 大和弦
place(boom(1.0, 33, 0.8), fr(782), 1, 0, 0.35)
place(clap(0.35), fr(782), 1, 0, 0.5)
for m in [48, 55, 60, 64, 67, 72, 76]:
    place(pluck(midi(m), 0.12, 0.9), fr(782), 1, 0, 0.6)
    place(marimba(midi(m + 12), 0.05, 1.0), fr(782), 1, 0, 0.6)
place(bass(midi(36), 1.2, 0.5), fr(782))
place(boom(0.35, 60, 0.18), fr(800), 1, -0.3)
place(whoosh(0.3, 800, 6000, 0.15), fr(800), 1, 0.4)

# ---------------- 混响 + 母带 ----------------

def reverb(x, seed, dec=0.55, length=2.2):
    t = tt(length)
    ir = np.random.default_rng(seed).standard_normal(len(t)) * np.exp(-t / dec)
    ir = onepole_lp(ir, 5000)
    ir[: int(0.012 * SR)] = 0  # 预延迟
    ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + len(ir)
    nfft = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]
    return y


L += reverb(SEND_L, 1) * 0.55
R += reverb(SEND_R, 2) * 0.55

mix = np.stack([L, R], axis=1)
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.15) / np.tanh(1.15)
fade = np.ones(N)
fo = int(0.6 * SR)
fade[-fo:] = np.linspace(1, 0, fo) ** 2
mix *= fade[:, None]
mix *= 0.89

root = os.path.dirname(os.path.abspath(__file__))
out_dir = os.path.normpath(os.path.join(root, '..', '..', '..', 'public', '001-bauhaus'))
os.makedirs(out_dir, exist_ok=True)
raw = os.path.join(out_dir, 'music.raw.wav')
final = os.path.join(out_dir, 'music.wav')
with wave.open(raw, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())

if shutil.which('ffmpeg'):
    subprocess.run(
        ['ffmpeg', '-loglevel', 'error', '-y', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.0:LRA=11', '-ar', str(SR), final],
        check=True,
    )
    os.remove(raw)
else:
    os.replace(raw, final)
print('wrote', final)
