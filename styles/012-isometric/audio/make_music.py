"""
Design Style · 风格 012 · 等距 Isometric —— 配乐与音效（纯代码合成，无外部音源）

120 BPM（1 拍 = 0.5 秒 = 30 帧）· D 大调
  0–3.5s    开场：轻垫 + 三轴锁定的木块/钟 → 卡片弹出
  3.5–8.5s  规则：每条规则一记重音
  8.5–17s   建造：一块块落地的木击 + 琶音往上堆
  17–21s    变体：三种和弦色彩
  21–24s    片尾：D 大和弦收束
时间点与 video/*.tsx 关键帧对齐（帧 / 60 = 秒）。

用法：python3 styles/012-isometric/audio/make_music.py
输出：public/012-isometric/music.wav（响度 −14 LUFS，真峰值 < −1 dBTP）
"""
import json
import os
import shutil
import subprocess
import wave

import numpy as np

SR = 48000
DUR = 24.0
N = int(SR * DUR)
rng = np.random.default_rng(1822)

MUS = np.zeros((2, N))
SFX = np.zeros((2, N))
SEND = np.zeros((2, N))
PUMP = np.zeros((2, N))
LEAD = np.zeros((2, N))


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


def kick(level=1.0):
    t = tt(0.4)
    f = 48 + 100 * np.exp(-t / 0.03)
    body = np.sin(glide(f)) * np.exp(-t / 0.16)
    click = hp(noise(0.4), 3000) * np.exp(-t / 0.003) * 0.22
    return np.tanh((body + click) * 1.3) * level


def clap(level=1.0):
    t = tt(0.32)
    n = hp(onepole_lp(noise(0.32), 5500), 900)
    env = np.zeros_like(t)
    for k, off in enumerate([0, 0.011, 0.022]):
        env += np.where(t >= off, np.exp(-(t - off) / (0.006 if k < 2 else 0.08)), 0)
    return n * env * 0.62 * level


def shaker(level=1.0, dec=0.035):
    t = tt(0.14)
    env = np.minimum(1, t / 0.008) * np.exp(-t / dec)
    return hp(noise(0.14), 6500) * env * level


def hat(level=1.0, dec=0.025):
    t = tt(0.12)
    return hp(hp(noise(0.12), 7000), 7000) * np.minimum(1, t / 0.001) * np.exp(-t / dec) * level


def snare(level=1.0):
    t = tt(0.24)
    body = np.sin(glide(190 + 60 * np.exp(-t / 0.01))) * np.exp(-t / 0.05)
    n = hp(onepole_lp(noise(0.24), 7500), 1200) * np.exp(-t / 0.07)
    return (0.5 * body + 0.75 * n) * level


def crash(d=2.4, level=1.0):
    t = tt(d)
    n = hp(hp(noise(d), 4800), 2800)
    env = np.minimum(1, t / 0.002) * (0.5 * np.exp(-t / 0.1) + 0.5 * np.exp(-t / 0.85))
    return n / (np.abs(n).max() + 1e-9) * env * level


def bell(freq, level=1.0, dec=0.8):
    t = tt(dec * 3)
    index = 2.0 * np.exp(-t / 0.14)
    y = np.sin(2 * np.pi * freq * t + index * np.sin(2 * np.pi * freq * 3.2 * t))
    return y * np.minimum(1, t / 0.002) * np.exp(-t / dec) * level


def pluck(freq, level=1.0, dec=0.2):
    t = tt(dec * 4)
    y = np.sin(2 * np.pi * freq * t) * np.exp(-t / dec)
    y += 0.32 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-t / (dec * 0.25))
    y += 0.1 * np.sin(2 * np.pi * freq * 9 * t) * np.exp(-t / (dec * 0.08))
    return y * np.minimum(1, t / 0.0015) * level


def thock(level=1.0, f0=210, f1=78):
    t = tt(0.22)
    f = f1 + (f0 - f1) * np.exp(-t / 0.022)
    body = np.sin(glide(f)) * np.exp(-t / 0.07)
    wood = onepole_lp(hp(noise(0.22), 800), 3800) * np.exp(-t / 0.01) * 0.32
    return np.tanh((body + wood) * 1.25) * level


def boom(level=1.0):
    t = tt(0.85)
    f = 40 + 80 * np.exp(-t / 0.05)
    body = np.sin(glide(f)) * np.exp(-t / 0.34)
    air = onepole_lp(noise(0.85), 800) * np.exp(-t / 0.08) * 0.35
    return np.tanh((body + air) * 1.5) * level


def whoosh(d=0.5, lo=300, hi=6000, level=1.0, rise=0.5):
    t = tt(d)
    x = t / d
    cut = lo + (hi - lo) * np.sin(np.pi * np.clip(x / (2 * rise), 0, 1)) ** 2
    y = onepole_lp(onepole_lp(noise(d), cut), cut)
    env = np.sin(np.pi * x) ** 1.5
    return y * env / (np.abs(y).max() + 1e-9) * level


def tick(level=1.0, freq=2600, dec=0.012):
    t = tt(0.07)
    body = np.sin(2 * np.pi * freq * t) * np.exp(-t / dec)
    snap = hp(noise(0.07), 4000) * np.exp(-t / 0.0014) * 0.55
    return (body + snap) * np.minimum(1, t / 0.0005) * level


def pad(freqs, d, level=1.0, att=0.4, rel=0.6, bright=1.0):
    t = tt(d + rel)
    y = np.zeros_like(t)
    for fq in freqs:
        for det in (-0.0035, 0.0, 0.0035):
            ph0 = rng.random() * 6.28
            for h in range(1, 8):
                if fq * h > 8500:
                    break
                y += np.sin(2 * np.pi * fq * (1 + det) * h * t + ph0 * h) / h ** (1.55 / bright)
    env = np.minimum(1, t / att) * np.where(t < d, 1, np.exp(-(t - d) / (rel / 4)))
    trem = 1 + 0.05 * np.sin(2 * np.pi * 0.55 * t)
    return y / (len(freqs) * 5) * env * trem * level


def additive(freq, d, nh=20, kc0=10.0, kc1=2.2, kdec=0.08, att=0.003, dec=None, rel=0.04,
             voices=1, detune=0.0, odd=0.0, vib=0.0, level=1.0):
    t = tt(d + rel)
    kc = kc1 + (kc0 - kc1) * np.exp(-t / kdec)
    y = np.zeros_like(t)
    for v in range(voices):
        det = 0.0 if voices == 1 else (v / (voices - 1) - 0.5) * 2 * detune
        f0 = freq * (1 + det)
        ph = glide(f0 * (1 + vib * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.12) / 0.15, 0, 1))) if vib else 2 * np.pi * f0 * t
        p0 = rng.random() * 6.283
        for h in range(1, nh + 1):
            if f0 * h > 14000:
                break
            a = 1.0 / h * ((1 - odd) if h % 2 == 0 else 1.0)
            y += np.sin(h * (ph + p0)) * a * np.exp(-(h - 1) / kc)
    y /= max(voices, 1)
    env = np.minimum(1, t / att)
    if dec:
        env = env * np.exp(-t / dec)
    env = env * np.where(t < d, 1, np.exp(-(t - d) / (rel / 3)))
    return y * env * level


KICK = kick(1.0)
CLAP = clap(1.0)
SNARE = snare(1.0)
CRASH = crash()
OHAT = hat(1.0, 0.07)
CHAT = hat(1.0, 0.02)
SHK = shaker(1.0, 0.03)
BOOM = boom(1.0)

BEAT, S16 = 30, 7.5
ROOT = {'D': 26, 'G': 31, 'Bm': 23, 'A': 21, 'Em': 28}
PADV = {
    'D': [50, 54, 57, 61],
    'G': [47, 50, 54, 59],
    'Bm': [47, 50, 54, 59],
    'A': [45, 49, 52, 57],
    'Em': [47, 52, 55, 59],
}
ARPV = {
    'D': [62, 66, 69, 74],
    'G': [59, 62, 66, 71],
    'Bm': [59, 62, 66, 71],
    'A': [57, 61, 64, 69],
    'Em': [59, 64, 67, 71],
}
PROG = [
    (0, 'D'), (120, 'G'), (210, 'D'), (310, 'G'), (410, 'Bm'),
    (510, 'D'), (630, 'G'), (750, 'Em'), (870, 'A'),
    (1020, 'G'), (1100, 'A'), (1180, 'Bm'), (1260, 'D'),
]
GROOVE_END = 1245
FINAL = 1260


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


# ── 开场 0–210 ── 软垫、三轴锁定
place(pad([midi(m) for m in [38, 45, 50, 54, 57]], 3.6, 0.42, att=0.55, rel=0.8, bright=0.75), 0.0, pan=-0.4, send=0.4, bus=PUMP)
place(pad([midi(m) for m in [50, 54, 57, 61]], 3.6, 0.28, att=0.7, rel=0.8, bright=0.7), 0.05, pan=0.4, send=0.4, bus=PUMP)
for k in range(8):
    sfx(tick(0.09 + 0.02 * k, 2100 if k % 2 == 0 else 1680), fr(k * 12), pan=-0.35 + 0.08 * k, send=0.08)

sfx(whoosh(fr(22), 220, 4200, 0.28, 0.55), fr(36), pan=-0.2, send=0.18)
sfx(tick(0.22, 1860), fr(48), pan=0.35, send=0.12)  # X
sfx(bell(midi(74), 0.1, 0.55), fr(48), pan=0.4, send=0.4)
sfx(tick(0.22, 1640), fr(66), pan=-0.35, send=0.12)  # Z
sfx(bell(midi(69), 0.1, 0.55), fr(66), pan=-0.4, send=0.4)
sfx(tick(0.24, 2200), fr(84), pan=0.0, send=0.12)  # Y
sfx(bell(midi(81), 0.12, 0.7), fr(84), send=0.45)

sfx(whoosh(fr(18), 180, 5000, 0.35, 0.6), fr(108), send=0.2)
kick_at(118, 0.85)
sfx(thock(0.7), fr(118), send=0.22)
sfx(BOOM * 0.55, fr(118), send=0.28)
place(CRASH * 0.28, fr(118), send=0.28)
sfx(thock(0.55), fr(148), send=0.18)
sfx(bell(midi(78), 0.14, 0.8), fr(148), send=0.42)
for i, m in enumerate([62, 66, 69, 74, 78]):
    sfx(pluck(midi(m), 0.05, 0.16), fr(168 + i * 4), pan=-0.3 + 0.12 * i, send=0.24)

# ── 律动 210–1245 ──
for b in range(7, GROOVE_END // BEAT + 1):
    fm = b * BEAT
    if fm >= GROOVE_END:
        break
    soft = fm < 510
    kick_at(fm, 0.72 if soft else 0.95)
    if (fm - 210) % 60 == 30:
        place(CLAP * (0.28 if soft else 0.48), fr(fm), send=0.16)
    for s in range(4):
        t16 = fm + s * S16
        if t16 >= GROOVE_END:
            break
        if s == 2:
            place(OHAT * 0.16, fr(t16), pan=0.22, send=0.04)
        elif s == 0:
            place(CHAT * 0.09, fr(t16), pan=-0.18)
        else:
            place(SHK * (0.1 if s == 3 else 0.06), fr(t16), pan=-0.28 if s == 1 else 0.28)

for fm, lv in ((210, 0.32), (510, 0.48), (1020, 0.4), (1260, 0.62)):
    place(CRASH * lv, fr(fm), send=0.28)

for k in range(int((GROOVE_END - 210) / 15)):
    fm = 210 + k * 15
    if fm >= GROOVE_END:
        break
    r = ROOT[chord_at(fm)] + (12 if k % 4 == 0 else 0)
    y = additive(midi(r), 0.18, nh=16, kc0=7, kc1=2.0, kdec=0.07, voices=2, detune=0.0025, dec=0.32, rel=0.03)
    place(np.tanh(y * 1.25) * (0.22 if fm < 510 else 0.3), fr(fm), bus=PUMP)

for k, (s, n) in enumerate(PROG):
    e = PROG[k + 1][0] if k + 1 < len(PROG) else 1440
    if s >= GROOVE_END:
        break
    st = max(s, 0)
    dur = fr(min(e, GROOVE_END) - st)
    if dur <= 0.05:
        continue
    for pan in (-0.5, 0.5):
        place(pad([midi(m) for m in PADV[n]], dur, 0.34 if s < 510 else 0.42, att=0.12 if st > 30 else 0.4,
                  rel=0.28, bright=0.85), fr(st), pan=pan, send=0.3, bus=PUMP)

ARP_PAT = [0, 2, 1, 3, 2, 3, 1, 2]
for k in range(int((GROOVE_END - 210) / S16)):
    fm = 210 + k * S16
    if fm >= GROOVE_END:
        break
    notes = ARPV[chord_at(fm)]
    m = notes[ARP_PAT[k % 8]]
    acc = 1.0 if k % 2 == 0 else 0.65
    y = additive(midi(m), 0.09, nh=18, kc0=9, kc1=2.2, kdec=0.04, dec=0.1, rel=0.04)
    place(y * 0.11 * acc, fr(fm), pan=-0.32 if k % 2 else 0.32, send=0.2, bus=PUMP)


def lead(m, d, level=1.0):
    y = additive(midi(m), d, nh=22, kc0=12, kc1=4.5, kdec=0.1, voices=2, detune=0.003, odd=0.3, vib=0.0025, dec=0.7, rel=0.05)
    b = bell(midi(m + 12), 0.16, 0.24)
    n = max(len(y), len(b))
    out = np.zeros(n)
    out[: len(y)] += y
    out[: len(b)] += b
    return out * level


# 规则三记
for fm, m, pn in ((210, 74, -0.2), (310, 78, 0.1), (410, 81, 0.3)):
    sfx(thock(0.5), fr(fm), pan=pn, send=0.2)
    sfx(bell(midi(m), 0.12, 0.65), fr(fm), pan=pn, send=0.42)
    place(lead(m, 0.28, 0.16), fr(fm), send=0.22, bus=LEAD)

# 建造落地
BUILD_HITS = [516, 528, 534, 540, 548, 568, 584, 600, 616, 628, 636, 654, 668, 680, 694, 714, 740, 766, 788, 816, 836, 858, 892, 914, 952, 984]
for i, fm in enumerate(BUILD_HITS):
    pn = -0.4 + (i % 7) * 0.12
    sfx(thock(0.28 + 0.02 * (i % 4)), fr(fm), pan=pn, send=0.14)
    if i % 3 == 0:
        sfx(pluck(midi(62 + (i % 5) * 2), 0.045, 0.14), fr(fm + 2), pan=pn, send=0.2)

# 变体
sfx(whoosh(fr(20), 250, 4800, 0.32, 0.5), fr(1010), send=0.2)
for i, (fm, m) in enumerate(((1020, 71), (1100, 73), (1180, 78))):
    sfx(bell(midi(m), 0.14, 0.7), fr(fm), pan=-0.35 + i * 0.35, send=0.45)
    sfx(thock(0.4), fr(fm), send=0.16)
    place(lead(m, 0.4, 0.15), fr(fm), send=0.24, bus=LEAD)

# 收束
rev = CRASH[: int(0.65 * SR)][::-1].copy()
sfx(rev * np.linspace(0, 1, len(rev)) ** 2 * 0.55, fr(FINAL) - 0.65, send=0.24)
kick_at(FINAL, 1.0)
sfx(BOOM * 0.85, fr(FINAL), send=0.35)
place(CRASH * 0.62, fr(FINAL), send=0.38)
for pan in (-0.5, 0.5):
    place(pad([midi(m) for m in [38, 45, 50, 54, 57, 61, 66]], 2.4, 0.55, att=0.02, rel=1.1, bright=1.05),
          fr(FINAL), pan=pan, send=0.48)
place(lead(81, 0.6, 0.2), fr(FINAL), send=0.36, bus=LEAD)
sfx(bell(midi(93), 0.12, 1.2), fr(FINAL), send=0.52)
for fm, m in ((1296, 74), (1320, 78), (1344, 81)):
    sfx(bell(midi(m), 0.16, 0.9), fr(fm), pan=(fm - 1320) / 40, send=0.48)

# 侧链 + 延迟
tsec = np.arange(N) / SR
ks = np.array(sorted(KICKS)) if KICKS else np.array([0.0])
idx = np.searchsorted(ks, tsec, side='right') - 1
since = np.where(idx >= 0, tsec - ks[np.clip(idx, 0, None)], 9.0)
x = np.clip(since / 0.28, 0, 1)
duck = 1 - 0.5 * (1 - x) ** 2
duck = np.where(since < 0.004, 1 - 0.5 * since / 0.004, duck)
duck[tsec >= fr(FINAL)] = 1.0
PUMP *= duck[None, :]

d = int(0.375 * SR)
dl = np.zeros((2, N))
for k in range(1, 4):
    ch = k % 2
    src = LEAD[0] + LEAD[1]
    dl[ch, k * d :] += src[: N - k * d] * 0.48 * 0.4 ** k
for ch in range(2):
    dl[ch] = onepole_lp(dl[ch], 3400)
    SEND[ch] += dl[ch] * 0.26


def reverb(x, seed, dec=0.75, length=2.8):
    t = tt(length)
    ir = np.random.default_rng(seed).standard_normal(len(t)) * np.exp(-t / dec)
    ir = onepole_lp(ir, 6200)
    ir[: int(0.02 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + len(ir)
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


mix = MUS + PUMP + LEAD + dl + SFX
mix[0] += reverb(SEND[0], 3) * 0.5
mix[1] += reverb(SEND[1], 5) * 0.5
for ch in range(2):
    mix[ch] = hp(hp(mix[ch], 30), 30)
mix = mix.T
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.22) / np.tanh(1.22)
fade = np.ones(N)
f0, f1 = int(fr(1380) * SR), N
fade[f0:f1] = np.linspace(1, 0, f1 - f0) ** 2
mix *= fade[:, None]

root = os.path.dirname(os.path.abspath(__file__))
out_dir = os.path.normpath(os.path.join(root, '..', '..', '..', 'public', '012-isometric'))
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
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True)
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
