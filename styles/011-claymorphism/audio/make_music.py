"""
Design Style · 风格 011 · Claymorphism —— 配乐与音效（纯代码合成，无外部音源）

120 BPM（1 拍 = 0.5 秒 = 30 帧）· F 大调
和弦：Fmaj9（0–4s）| Bbmaj7（4–8s）| C6（8–12s）| Dm9（12–16s）| Gm7 C7（16–20s）| Fmaj9（20–24s 收束）
  0–0.5s    软开头：Pad 涌起 + 面团落下的低频
  0.5s      第一拍掐住：粘土 thock + 底鼓（哇）
  0.8–1.6s  CLAY 四字：每字一声圆润拨弦
  4s 起     律动轻踩，圆角四下“胀”
  8s        光球：钟琴绕圈
  12s       四色入场 + 三下挤捏
  16s       产品：开关、滑杆
  20s       信息幕落地，Fmaj9 收住
所有时间点与 video/*.tsx 的关键帧对齐（帧 / 60 = 秒）。

用法：python3 styles/011-claymorphism/audio/make_music.py
输出：public/011-claymorphism/music.wav（响度 −14 LUFS，真封值 < −1 dBTP）
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
rng = np.random.default_rng(2011)

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
    sig = np.asarray(sig, dtype=float)[: N - i]
    gl = np.cos((pan + 1) * np.pi / 4) * gain
    gr = np.sin((pan + 1) * np.pi / 4) * gain
    bus[0, i : i + len(sig)] += sig * gl
    bus[1, i : i + len(sig)] += sig * gr
    if send:
        SEND[0, i : i + len(sig)] += sig * gl * send
        SEND[1, i : i + len(sig)] += sig * gr * send


def sfx(sig, t, gain=1.0, pan=0.0, send=0.22):
    place(sig, t, gain, pan, send, SFX)


def tt(d):
    return np.arange(max(1, int(d * SR))) / SR


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
    t = tt(0.42)
    f = 42 + 90 * np.exp(-t / 0.035)
    body = np.sin(glide(f)) * np.exp(-t / 0.18)
    click = hp(noise(0.42), 2400) * np.exp(-t / 0.004) * 0.16
    return np.tanh((body + click) * 1.25) * level


def clap(level=1.0):
    t = tt(0.32)
    n = hp(onepole_lp(noise(0.32), 5000), 900)
    env = np.zeros_like(t)
    for k, off in enumerate([0, 0.012, 0.022]):
        env += np.where(t >= off, np.exp(-(t - off) / (0.007 if k < 2 else 0.1)), 0)
    return n * env * 0.55 * level


def hat(level=1.0, dec=0.03):
    t = tt(0.12)
    return hp(hp(noise(0.12), 6500), 6500) * np.minimum(1, t / 0.001) * np.exp(-t / dec) * level


def shaker(level=1.0, dec=0.04):
    t = tt(0.16)
    env = np.minimum(1, t / 0.01) * np.exp(-t / dec)
    return hp(noise(0.16), 5500) * env * level


def crash(d=2.4, level=1.0):
    t = tt(d)
    n = hp(hp(noise(d), 4200), 2400)
    env = np.minimum(1, t / 0.003) * (0.5 * np.exp(-t / 0.12) + 0.5 * np.exp(-t / 0.9))
    return n / (np.abs(n).max() + 1e-9) * env * level


def bell(freq, level=1.0, dec=0.9):
    t = tt(dec * 3)
    index = 1.8 * np.exp(-t / 0.14)
    y = np.sin(2 * np.pi * freq * t + index * np.sin(2 * np.pi * freq * 2.8 * t))
    return y * np.minimum(1, t / 0.003) * np.exp(-t / dec) * level


def pluck(freq, level=1.0, dec=0.22):
    t = tt(dec * 4)
    y = np.sin(2 * np.pi * freq * t) * np.exp(-t / dec)
    y += 0.28 * np.sin(2 * np.pi * freq * 3 * t) * np.exp(-t / (dec * 0.3))
    y += 0.08 * np.sin(2 * np.pi * freq * 8 * t) * np.exp(-t / (dec * 0.1))
    return y * np.minimum(1, t / 0.002) * level


def thock(level=1.0, f0=170, f1=58):
    t = tt(0.28)
    f = f1 + (f0 - f1) * np.exp(-t / 0.03)
    body = np.sin(glide(f)) * np.exp(-t / 0.09)
    dough = onepole_lp(hp(noise(0.28), 400), 1800) * np.exp(-t / 0.018) * 0.45
    return np.tanh((body + dough) * 1.35) * level


def squish(level=1.0):
    t = tt(0.32)
    f = 140 + 80 * np.exp(-t / 0.04) - 50 * t
    body = np.sin(glide(np.maximum(f, 40))) * np.exp(-t / 0.1)
    air = onepole_lp(noise(0.32), 700) * np.exp(-t / 0.05) * 0.5
    return np.tanh((body + air) * 1.4) * level


def boom(level=1.0):
    t = tt(0.95)
    f = 36 + 80 * np.exp(-t / 0.06)
    body = np.sin(glide(f)) * np.exp(-t / 0.4)
    air = onepole_lp(noise(0.95), 700) * np.exp(-t / 0.1) * 0.32
    return np.tanh((body + air) * 1.45) * level


def whoosh(d=0.5, lo=240, hi=4800, level=1.0, rise=0.55):
    t = tt(d)
    x = t / d
    cut = lo + (hi - lo) * np.sin(np.pi * np.clip(x / (2 * rise), 0, 1)) ** 2
    y = onepole_lp(onepole_lp(noise(d), cut), cut)
    env = np.sin(np.pi * x) ** 1.4
    return y * env / (np.abs(y).max() + 1e-9) * level


def tick(level=1.0, freq=2100, dec=0.014):
    t = tt(0.08)
    body = np.sin(2 * np.pi * freq * t) * np.exp(-t / dec)
    body += 0.4 * np.sin(2 * np.pi * freq * 1.4 * t) * np.exp(-t / (dec * 0.6))
    snap = hp(noise(0.08), 3500) * np.exp(-t / 0.002) * 0.45
    return (body + snap) * np.minimum(1, t / 0.0006) * level


def pad(freqs, d, level=1.0, att=0.5, rel=0.8, bright=0.85):
    t = tt(d + rel)
    y = np.zeros_like(t)
    for fq in freqs:
        for det in (-0.0035, 0.0, 0.0035):
            ph0 = rng.random() * 6.28
            for h in range(1, 7):
                if fq * h > 7000:
                    break
                y += np.sin(2 * np.pi * fq * (1 + det) * h * t + ph0 * h) / h ** (1.7 / bright)
    env = np.minimum(1, t / att) * np.where(t < d, 1, np.exp(-(t - d) / (rel / 4)))
    trem = 1 + 0.045 * np.sin(2 * np.pi * 0.55 * t)
    return y / (len(freqs) * 4.2) * env * trem * level


def additive(freq, d, nh=18, kc0=10.0, kc1=2.2, kdec=0.09, att=0.004, dec=None, rel=0.05,
             voices=1, detune=0.0, odd=0.15, vib=0.0, level=1.0):
    t = tt(d + rel)
    kc = kc1 + (kc0 - kc1) * np.exp(-t / kdec)
    y = np.zeros_like(t)
    for v in range(voices):
        det = 0.0 if voices == 1 else (v / max(voices - 1, 1) - 0.5) * 2 * detune
        f0 = freq * (1 + det)
        ph = 2 * np.pi * f0 * t
        if vib:
            ph = glide(f0 * (1 + vib * np.sin(2 * np.pi * 5.2 * t)))
        p0 = rng.random() * 6.283
        for h in range(1, nh + 1):
            if f0 * h > 12000:
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
CRASH = crash()
OHAT = hat(1.0, 0.08)
CHAT = hat(1.0, 0.022)
SHK = shaker(1.0, 0.035)
BOOM = boom(1.0)

BEAT, S16 = 30, 7.5
ROOT = {'F': 29, 'Bb': 34, 'C': 24, 'Dm': 26, 'Gm': 31}
PADV = {
    'F': [53, 57, 60, 64, 67],
    'Bb': [53, 57, 60, 62, 65],
    'C': [52, 55, 60, 64, 67],
    'Dm': [53, 57, 60, 64, 65],
    'Gm': [50, 55, 58, 62, 65],
}
ARPV = {
    'F': [72, 76, 79, 84],
    'Bb': [70, 74, 77, 82],
    'C': [67, 72, 76, 79],
    'Dm': [65, 69, 72, 77],
    'Gm': [67, 70, 74, 79],
}
PROG = [
    (0, 'F'), (240, 'Bb'), (480, 'C'), (720, 'Dm'),
    (960, 'Gm'), (1080, 'C'), (1200, 'F'),
]
GROOVE_START = 30
GROOVE_END = 1188
FINAL = 1200


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


# ================= 软开头 0–30 =================
for pan in (-0.5, 0.5):
    place(pad([midi(m) for m in [41, 53, 57, 60, 64]], 2.2, 0.42, att=0.55, rel=0.8, bright=0.7), 0.0, pan=pan, send=0.35, bus=PUMP)
sfx(whoosh(fr(28), 160, 3200, 0.38, 0.7), 0.02, pan=-0.15, send=0.18)
sfx(thock(0.35, 120, 48), 0.18, send=0.12)

# 第一拍：掐住
kick_at(30, 1.0)
sfx(BOOM * 0.9, fr(30), send=0.32)
sfx(thock(1.0, 190, 62), fr(30), send=0.28)
place(CRASH * 0.32, fr(30), send=0.26)
sfx(squish(0.7), fr(30), send=0.2)

# CLAY 四字
for i, m in enumerate([65, 69, 72, 76]):
    sfx(pluck(midi(m), 0.07, 0.2), fr(48 + i * 12), pan=-0.4 + i * 0.26, send=0.3)
    sfx(thock(0.28, 210 - i * 12, 80), fr(48 + i * 12), pan=-0.3 + i * 0.2, send=0.12)
sfx(bell(midi(84), 0.14, 0.85), fr(118), send=0.42)
sfx(pluck(midi(72), 0.06, 0.24), fr(120), send=0.25)

# ================= 律动 30–1188 =================
for b in range(1, GROOVE_END // BEAT + 1):
    fm = b * BEAT
    if fm < GROOVE_START or fm >= GROOVE_END:
        continue
    soft = fm < 240
    kick_at(fm, 0.72 if soft else 0.95)
    if (fm - 30) % 60 == 30 and fm >= 120:
        place(CLAP * (0.32 if fm < 960 else 0.42), fr(fm), send=0.16)
    for s in range(4):
        t16 = fm + s * S16
        if t16 >= GROOVE_END:
            break
        if s == 2:
            place(OHAT * (0.12 if soft else 0.18), fr(t16), pan=0.22, send=0.04)
        elif s == 0:
            place(CHAT * 0.08, fr(t16), pan=-0.18)
        else:
            place(SHK * (0.1 if s == 3 else 0.06), fr(t16), pan=-0.28 if s == 1 else 0.28)

for fm, lv in ((240, 0.32), (480, 0.34), (720, 0.36), (960, 0.4), (1200, 0.55)):
    place(CRASH * lv, fr(fm), send=0.28)

for k in range(int((GROOVE_END - 30) / 15)):
    fm = 30 + k * 15
    if fm >= GROOVE_END:
        break
    r = ROOT[chord_at(fm)] + (12 if k % 4 == 0 else 0)
    y = additive(midi(r), 0.22, nh=14, kc0=7, kc1=2.0, kdec=0.07, voices=2, detune=0.0025, dec=0.4, rel=0.04)
    place(np.tanh(y * 1.2) * 0.26, fr(fm), bus=PUMP)

for k, (s, n) in enumerate(PROG):
    e = PROG[k + 1][0] if k + 1 < len(PROG) else 1440
    st = max(s, 0)
    if st >= GROOVE_END and s < FINAL:
        e = min(e, GROOVE_END)
    if st >= 1440:
        break
    end = min(e, 1440)
    for pan in (-0.52, 0.52):
        place(
            pad([midi(m) for m in PADV[n]], fr(end - st), 0.36 if s < 960 else 0.44, att=0.08 if st > 8 else 0.5, rel=0.4, bright=0.8),
            fr(st),
            pan=pan,
            send=0.26,
            bus=PUMP,
        )

ARP_PAT = [0, 2, 1, 3, 2, 3, 1, 2]
for k in range(int((GROOVE_END - 30) / S16)):
    fm = 30 + k * S16
    if fm >= GROOVE_END:
        break
    notes = ARPV[chord_at(fm)]
    m = notes[ARP_PAT[k % 8]]
    acc = 1.0 if k % 2 == 0 else 0.62
    y = additive(midi(m), 0.1, nh=16, kc0=8, kc1=2.0, kdec=0.04, dec=0.12, rel=0.04)
    place(y * 0.11 * acc, fr(fm), pan=-0.32 if k % 2 else 0.32, send=0.18, bus=PUMP)


def lead(m, d, level=1.0):
    y = additive(midi(m), d, nh=20, kc0=12, kc1=4, kdec=0.1, voices=2, detune=0.003, odd=0.28, vib=0.002, dec=0.7, rel=0.06)
    b = bell(midi(m + 12), 0.16, 0.28)
    n = max(len(y), len(b))
    out = np.zeros(n)
    out[: len(y)] += y
    out[: len(b)] += b
    return out * level


POS, LEN = [0, 3, 6, 8, 10, 12, 14], [3, 3, 2, 2, 2, 2, 2]
HOOK = {
    240: [77, 76, 72, 69, 72, 65, 67],
    480: [79, 76, 72, 67, 64, 67, 72],
    720: [76, 72, 69, 65, 69, 72, 77],
    960: [74, 70, 67, 70, 74, 79, 84],
}
for s, notes in HOOK.items():
    for p, l, m in zip(POS, LEN, notes):
        place(lead(m, l * 0.125 - 0.02, 0.16), fr(s + p * S16), send=0.22, bus=LEAD)

# 圆角胀
for i, fm in enumerate((270, 300, 330, 360)):
    sfx(tick(0.12 + 0.02 * i, 1800 + i * 180), fr(fm), pan=-0.4 + i * 0.25, send=0.1)
    sfx(pluck(midi(69 + i * 2), 0.045, 0.14), fr(fm), pan=-0.3 + i * 0.2, send=0.2)
sfx(squish(0.45), fr(390), send=0.16)
sfx(whoosh(fr(16), 300, 2600, 0.2, 0.5), fr(390), pan=0.2)

# 阴影光球
sfx(whoosh(fr(20), 200, 3600, 0.22, 0.55), fr(480), send=0.16)
for k in range(8):
    sfx(bell(midi(72 + (k % 4) * 2), 0.05, 0.4), fr(500 + k * 22), pan=np.cos(k * 0.8) * 0.45, send=0.35)
sfx(thock(0.3), fr(600), send=0.12)
sfx(whoosh(fr(14), 400, 5000, 0.18, 0.6), fr(680), pan=-0.2)

# 软色 + 挤捏
for i, fm in enumerate((728, 742, 756, 770)):
    sfx(pluck(midi([65, 69, 72, 76][i]), 0.055, 0.18), fr(fm), pan=-0.4 + i * 0.26, send=0.24)
    sfx(thock(0.22, 160 + i * 10, 70), fr(fm), send=0.1)
for fm in (870, 900, 930):
    sfx(squish(0.65), fr(fm), send=0.2)
    sfx(thock(0.4, 200, 70), fr(fm), send=0.16)

# 产品
sfx(whoosh(fr(22), 180, 4200, 0.28, 0.55), fr(948), send=0.18)
sfx(thock(0.5), fr(960), send=0.2)
sfx(tick(0.14, 1600), fr(990), pan=-0.2)
sfx(tick(0.14, 1900), fr(1110), pan=0.25)
for i, fm in enumerate((1050, 1058, 1066)):
    sfx(pluck(midi(64 + i * 3), 0.04, 0.12), fr(fm), pan=-0.2 + i * 0.2, send=0.18)

# 收束
rev = CRASH[: int(0.75 * SR)][::-1].copy()
sfx(rev * np.linspace(0, 1, len(rev)) ** 2 * 0.55, fr(FINAL) - 0.75, send=0.24)
kick_at(FINAL, 0.95)
sfx(BOOM * 0.95, fr(FINAL), send=0.36)
sfx(thock(0.7, 150, 52), fr(FINAL), send=0.22)
place(CRASH * 0.48, fr(FINAL), send=0.36)
for pan in (-0.55, 0.55):
    place(pad([midi(m) for m in [41, 53, 57, 60, 64, 69, 72]], 3.6, 0.5, att=0.02, rel=1.4, bright=0.95), fr(FINAL), pan=pan, send=0.42)
place(lead(76, 0.7, 0.18), fr(FINAL), send=0.34, bus=LEAD)
sfx(bell(midi(84), 0.12, 1.3), fr(FINAL), send=0.5)
sfx(bell(midi(72), 0.14, 1.0), fr(1252), send=0.4)
sfx(pluck(midi(69), 0.05, 0.3), fr(1276), send=0.22)

# 侧链 + 延迟
tsec = np.arange(N) / SR
ks = np.array(sorted(KICKS)) if KICKS else np.array([0.0])
idx = np.searchsorted(ks, tsec, side='right') - 1
since = np.where(idx >= 0, tsec - ks[np.clip(idx, 0, None)], 9.0)
x = np.clip(since / 0.28, 0, 1)
duck = 1 - 0.48 * (1 - x) ** 2
duck = np.where(since < 0.004, 1 - 0.48 * since / 0.004, duck)
duck[tsec >= fr(FINAL)] = 1.0
PUMP *= duck[None, :]

d = int(0.375 * SR)
dl = np.zeros((2, N))
for k in range(1, 4):
    ch = k % 2
    src = LEAD[0] + LEAD[1]
    dl[ch, k * d :] += src[: N - k * d] * 0.46 * 0.4 ** k
for ch in range(2):
    dl[ch] = onepole_lp(dl[ch], 3200)
    SEND[ch] += dl[ch] * 0.24


def reverb(x, seed, dec=0.85, length=2.8):
    t = tt(length)
    ir = np.random.default_rng(seed).standard_normal(len(t)) * np.exp(-t / dec)
    ir = onepole_lp(ir, 5800)
    ir[: int(0.018 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + len(ir)
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


mix = MUS + PUMP + LEAD + dl + SFX
mix[0] += reverb(SEND[0], 11) * 0.48
mix[1] += reverb(SEND[1], 13) * 0.48
for ch in range(2):
    mix[ch] = hp(hp(mix[ch], 28), 28)
mix = mix.T
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.18) / np.tanh(1.18)
fade = np.ones(N)
f0, f1 = int(fr(1380) * SR), N
fade[f0:f1] = np.linspace(1, 0, f1 - f0) ** 1.6
# 软开头：0–0.12s 再淡入一点，避免第一帧爆破
fade[: int(0.12 * SR)] *= np.linspace(0.15, 1, int(0.12 * SR))
mix *= fade[:, None]

root = os.path.dirname(os.path.abspath(__file__))
out_dir = os.path.normpath(os.path.join(root, '..', '..', '..', 'public', '011-claymorphism'))
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
