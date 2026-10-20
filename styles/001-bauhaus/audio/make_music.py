"""
Motion Style · 001 · 包豪斯 —— 配乐与音效（纯代码合成，无外部音源）

120 BPM · A 小调 → C 大调收尾 · 15 秒
所有音效时间点都与 Bauhaus.tsx 的关键帧对齐（帧 / 60 = 秒）。

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


# Pad：从标题开始铺底
for i, (b, notes) in enumerate(CHORDS):
    nb = CHORDS[i + 1][0] if i + 1 < len(CHORDS) else 30
    if b < 3:
        continue
    d = (nb - b) * BEAT
    lvl = 0.10 if b < 22 else 0.08
    if b == 26:
        d = 1.9
    place(pad([midi(n + 12) for n in notes], d, lvl, cutoff=1700 if b >= 13 else 1100), b * BEAT, 1.0, 0, 0.35)

# 鼓
for b in range(3, 22):
    t = b * BEAT
    full = b >= 13
    if full or b % 2 == 1:
        place(kick(0.85 if full else 0.6), t)
    if b >= 8:
        place(hat(0.16 if full else 0.11), t + BEAT / 2, 1, 0.25)
    if full:
        place(hat(0.07, 0.015), t + BEAT / 4, 1, -0.3)
        place(hat(0.07, 0.015), t + 3 * BEAT / 4, 1, -0.3)
        if b % 2 == 0:
            place(clap(0.42), t, 1, 0.05, 0.25)

# 贝斯
for b in range(3, 22):
    t = b * BEAT
    r = midi(root_at(b))
    if b < 13:
        if b % 2 == 1:
            place(bass(r, 0.42, 0.42), t)
    else:
        place(bass(r, 0.2, 0.5), t)
        place(bass(r * 2 if b % 2 else r, 0.18, 0.38), t + BEAT / 2)

# 拨弦琶音（海报段落 16 分音符）
pattern = [0, 1, 2, 1, 2, 3, 2, 1]
for b in range(13, 22):
    notes = chord_at(b)
    for s in range(4):
        idx = pattern[(b * 4 + s) % len(pattern)]
        n = notes[idx % len(notes)] + 24 + (12 if idx >= len(notes) else 0)
        place(pluck(midi(n), 0.11 if s % 2 == 0 else 0.075), b * BEAT + s * BEAT / 4, 1, 0.35 if s % 2 else -0.35, 0.3)

# ---------------- 音效（与画面关键帧对齐） ----------------

# A 开场：三次砸下
place(boom(0.95, 40, 0.5), fr(0), 1, -0.25, 0.25)
place(boom(0.85, 46, 0.4), fr(15), 1, 0.3, 0.25)
place(boom(1.0, 34, 0.6), fr(31), 1, 0.15, 0.3)
place(marimba(midi(81), 0.25), fr(31), 1, 0.2, 0.4)
place(whoosh(0.5, 400, 6000, 0.32), fr(56))

# B 标题：每个字母一声木琴（五声音阶上行）
scale = [69, 72, 74, 76, 79, 81, 84]
for i in range(7):
    place(marimba(midi(scale[i]), 0.2, 0.3), fr(92 + i * 7), 1, -0.6 + i * 0.2, 0.3)
for frm, m, pan in [(150, 81, -0.6), (165, 84, -0.35), (180, 88, 0.2)]:
    place(pop(midi(m), 0.3), fr(frm), 1, pan, 0.3)
place(whoosh(0.45, 500, 7000, 0.3), fr(214))

# C 康定斯基：褪色 → 三次揭晓
place(deflate(0.22), fr(232), 1, 0, 0.2)
for frm, m, pan in [(285, 76, -0.45), (315, 79, 0.0), (345, 84, 0.45)]:
    place(marimba(midi(m), 0.34), frm / 60, 1, pan, 0.45)
    place(marimba(midi(m + 12), 0.12), frm / 60 + 0.02, 1, pan, 0.45)
    place(pop(midi(m), 0.18), frm / 60, 1, pan)
place(riser(0.4, 0.3), fr(366))

# D 海报
place(boom(1.0, 36, 0.55), fr(390), 1, -0.1, 0.3)
place(boom(0.55, 50, 0.3), fr(405), 1, 0.2, 0.2)
place(boom(0.55, 54, 0.3), fr(420), 1, 0.5, 0.2)
for frm, pan in [(450, -0.8), (480, -0.2), (510, 0.25), (518, 0.6), (540, 0.6), (570, -0.8), (616, 0.0)]:
    place(tick(2600, 0.22), fr(frm), 1, pan, 0.15)
place(whoosh(0.35, 800, 8000, 0.28), fr(530), 1, 0.6)
place(boom(0.45, 60, 0.22), fr(546), 1, 0.5)
place(whoosh(0.35, 600, 7000, 0.24), fr(560), 1, -0.7)
place(boom(0.45, 58, 0.22), fr(576), 1, -0.7)
place(boom(0.7, 44, 0.35), fr(600), 1, 0.6, 0.25)
place(reverse_shimmer(0.42, 0.22), fr(636) - 0.42 + 0.05, 1, 0, 0.5)
place(marimba(midi(88), 0.18, 0.8), fr(638), 1, 0, 0.6)

# E 一百年后
place(whoosh(0.55, 300, 4000, 0.3), fr(658))
place(pop(midi(72), 0.25), fr(678), 1, 0, 0.3)
for i, frm in enumerate([704, 708, 712]):
    place(marimba(midi([79, 76, 72][i]), 0.12, 0.3), fr(frm), 1, -0.4 + i * 0.4, 0.4)
place(mouse_click(0.5), fr(753), 1, -0.15)
place(riser(0.42, 0.42), fr(758))

# F 片尾：收束重击 + C 大和弦
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
