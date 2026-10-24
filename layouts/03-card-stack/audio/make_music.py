"""
Design Style · 布局 03 · Card Stack v6 —— 配乐（纯 numpy，无外部采样）

22 秒 · 120 BPM · A 小调 / C 大调（对齐 Swiss 气质，不是产品发布会玻璃垫乐）
  0–1.5s    砸进：钟表嘀嗒 + 四记刊落
  1.5–5.3s  刊·抽：干底鼓、抽走时 swipe
  4.8–8.3s  层·提：垫乐变暗，提起时上行
  7.8–10.6s 样·压：打开，选定一记钟
  10.3–14.2s 拆解：低通变薄，规则上行钟琴
  13.8–17.8s 坏→好：闷响 → 铺平空 → 弹簧叠回
  17.8–22s  片尾：C 大和弦收束
时间点与 video/layout.ts 的 TRANS / BEATS 对齐（帧 / 60 = 秒）。

用法：python3 layouts/03-card-stack/audio/make_music.py
输出：public/03-card-stack/music.wav（ffmpeg loudnorm → −14 LUFS）
"""
import os
import shutil
import subprocess
import wave

import numpy as np

SR = 48000
DUR = 22.0
N = int(SR * DUR)
rng = np.random.default_rng(1960)

MUS = np.zeros((2, N))
SFX = np.zeros((2, N))
SEND = np.zeros((2, N))
PUMP = np.zeros((2, N))


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
    t = tt(0.32)
    f = 48 + 88 * np.exp(-t / 0.024)
    body = np.sin(glide(f)) * np.exp(-t / 0.14)
    click = hp(noise(0.32), 3200) * np.exp(-t / 0.003) * 0.16
    return np.tanh((body + click) * 1.3) * level


def hat(level=1.0, dec=0.024):
    t = tt(0.1)
    return hp(hp(noise(0.1), 7800), 7800) * np.minimum(1, t / 0.001) * np.exp(-t / dec) * level


def clap(level=1.0):
    t = tt(0.22)
    y = hp(noise(0.22), 1800) * np.exp(-t / 0.04)
    y += hp(noise(0.22), 4200) * np.exp(-t / 0.012) * 0.5
    return y / (np.abs(y).max() + 1e-9) * level


def bell(freq, level=1.0, dec=0.65):
    t = tt(dec * 3)
    index = 2.1 * np.exp(-t / 0.12)
    y = np.sin(2 * np.pi * freq * t + index * np.sin(2 * np.pi * freq * 3.2 * t))
    return y * np.minimum(1, t / 0.002) * np.exp(-t / dec) * level


def bass(freq, d=0.26, level=1.0):
    t = tt(d + 0.08)
    env = np.minimum(1, t / 0.006) * np.exp(-t / 0.32) * np.where(t < d, 1, np.exp(-(t - d) / 0.03))
    y = np.sin(2 * np.pi * freq * t) + 0.18 * np.sin(4 * np.pi * freq * t)
    return np.tanh(y * 1.2) * env * level


def pad(freqs, d, level=1.0, att=0.5, rel=0.7, bright=0.75):
    t = tt(d + rel)
    y = np.zeros_like(t)
    for fq in freqs:
        for det in (-0.004, 0.0, 0.004):
            ph0 = rng.random() * 6.28
            for h in range(1, 7):
                if fq * h > 6800:
                    break
                y += np.sin(2 * np.pi * fq * (1 + det) * h * t + ph0 * h) / h ** (1.85 / bright)
    env = np.minimum(1, t / att) * np.where(t < d, 1, np.exp(-(t - d) / (rel / 4)))
    return y / (len(freqs) * 5.4) * env * level


def whoosh(d=0.4, lo=260, hi=5000, level=1.0, rise=0.55):
    t = tt(d)
    x = t / d
    cut = lo + (hi - lo) * np.sin(np.pi * np.clip(x / (2 * rise), 0, 1)) ** 2
    y = onepole_lp(onepole_lp(noise(d), cut), cut)
    return y * np.sin(np.pi * x) ** 1.5 / (np.abs(y).max() + 1e-9) * level


def riser(d=0.45, level=1.0):
    t = tt(d)
    x = t / d
    cut = 360 + 8600 * x ** 2
    n = hp(onepole_lp(noise(d), cut), 260)
    tone = np.sin(glide(260 * 2 ** (1.5 * x))) * 0.18
    return (n / (np.abs(n).max() + 1e-9) + tone) * x ** 2.1 * level


def pluck(freq, level=1.0, dec=0.14):
    t = tt(dec * 4)
    y = np.sin(2 * np.pi * freq * t) * np.exp(-t / dec)
    y += 0.28 * np.sin(2 * np.pi * freq * 3 * t) * np.exp(-t / (dec * 0.22))
    return y * np.minimum(1, t / 0.0015) * level


def thock(level=1.0, f0=170, f1=62):
    t = tt(0.2)
    f = f1 + (f0 - f1) * np.exp(-t / 0.022)
    body = np.sin(glide(f)) * np.exp(-t / 0.065)
    wood = onepole_lp(hp(noise(0.2), 900), 3400) * np.exp(-t / 0.01) * 0.26
    return np.tanh((body + wood) * 1.2) * level


def swipe(d=0.16, level=1.0):
    t = tt(d)
    x = t / d
    cut = 640 + 8200 * x
    y = onepole_lp(hp(noise(d), 480), cut)
    return y / (np.abs(y).max() + 1e-9) * np.sin(np.pi * x) ** 0.85 * level


def tick(level=1.0):
    t = tt(0.06)
    return hp(noise(0.06), 6000) * np.exp(-t / 0.008) * level


# —— 与 layout.ts BEATS 对齐 ——
BEAT = 30
SLAM, LIFT, COVER = 30, 60, 90
PULL1, LAND2, PULL2, LAND3 = 120, 150, 210, 240
LAYER, MARK, RISE, FRONT = 300, 330, 360, 390
FAN, PICK, PRESS = 480, 540, 570
EXPLODE, R1, R2, R3, R4 = 630, 690, 720, 750, 780
NOISE, FLAT, FIX, END = 840, 930, 960, 1080
HITS = [SLAM, COVER, PULL1, LAND2, PULL2, LAND3, LAYER, MARK, RISE, FAN, PICK, PRESS, EXPLODE, NOISE, FIX, END]
RULES_AT = [R1, R2, R3, R4]

CH = {
    'Am': (33, [57, 60, 64, 67]),
    'F': (29, [53, 57, 60, 65]),
    'C': (36, [55, 60, 64, 67]),
    'G': (31, [55, 59, 62, 67]),
    'Dm': (38, [53, 57, 60, 65]),
}
PROG = [
    (0, 'Am'),
    (90, 'F'),
    (288, 'Am'),
    (468, 'C'),
    (618, 'G'),
    (828, 'Dm'),
    (948, 'F'),
    (1068, 'C'),
]


def chord_at(frame):
    cur = PROG[0][1]
    for s, n in PROG:
        if frame >= s:
            cur = n
    return CH[cur]


PENTA = [69, 72, 76, 79, 81, 84, 88, 91]

for k, (s, n) in enumerate(PROG):
    e = PROG[k + 1][0] if k + 1 < len(PROG) else 1320
    lvl = 0.38 if s < 1068 else 0.62
    att = 0.65 if s == 0 else 0.24
    place(pad([midi(m) for m in CH[n][1]], fr(e - s) + 0.06, lvl, att=att, rel=0.5, bright=0.72), fr(s), send=0.42, bus=PUMP)

# 开场嘀嗒 + 四张刊
for i in range(8):
    sfx(tick(0.09), fr(2 + i * 3), pan=-0.4 + 0.1 * i, send=0.1)
for i in range(4):
    sfx(bell(midi(PENTA[i + 1]), 0.2, 0.55), fr(6 + i * 5), pan=-0.32 + 0.2 * i, send=0.58)
    sfx(thock(0.22 + 0.04 * i, 190 - 12 * i, 58), fr(8 + i * 5), send=0.12)
sfx(riser(fr(22), 0.14), fr(8), send=0.16)
place(kick(0.62), fr(SLAM))
sfx(thock(0.55, 200, 50), fr(SLAM), send=0.2)

GROOVE = [(60, 618), (960, 1068)]


def in_groove(fm):
    return any(a <= fm < b for a, b in GROOVE)


for b in range(0, 1320 // BEAT + 1):
    fm = b * BEAT
    root, notes = chord_at(fm)
    if in_groove(fm) and fm >= 60:
        place(kick(0.5 if fm < 288 else 0.42), fr(fm))
        place(hat(0.1), fr(fm + 15), pan=0.3)
        if 468 <= fm < 618:
            place(clap(0.12), fr(fm + 15), pan=-0.1, send=0.08)
            place(hat(0.06, 0.014), fr(fm + 7.5), pan=-0.22)
    if 30 <= fm < 1320:
        place(bass(midi(root), 0.2, 0.4 if fm % 60 == 0 else 0.26), fr(fm))
        if not (618 <= fm < 960):
            for q in range(2):
                m = notes[(b + q) % len(notes)] + 12
                place(pluck(midi(m), 0.09 if q else 0.13, 0.12), fr(fm + q * 15), pan=0.2 * (1 if q else -1), send=0.28, bus=PUMP)

for k, h in enumerate(HITS):
    pan = 0.16 if k % 2 == 0 else -0.16
    sfx(whoosh(fr(22), 240, 5200, 0.2, 0.5), fr(max(0, h - 12)), pan=pan)
    sfx(thock(0.34), fr(h), send=0.12)

# 抽 / 提 / 压 音色
sfx(swipe(0.15, 0.24), fr(PULL1 - 2), pan=-0.22, send=0.2)
sfx(bell(midi(81), 0.16, 0.7), fr(LAND2), pan=0.12, send=0.5)
sfx(swipe(0.14, 0.22), fr(PULL2 - 2), pan=0.18, send=0.18)
sfx(bell(midi(76), 0.15, 0.65), fr(LAND3), pan=-0.1, send=0.48)
sfx(riser(fr(16), 0.12), fr(RISE - 12), send=0.14)
sfx(bell(midi(84), 0.18, 0.7), fr(RISE), pan=0.08, send=0.55)
sfx(whoosh(fr(18), 300, 4000, 0.16, 0.45), fr(FAN - 10), pan=0)
sfx(bell(midi(79), 0.16, 0.6), fr(PICK), pan=0.14, send=0.5)
sfx(thock(0.4, 160, 52), fr(PRESS), send=0.16)

for k, fm in enumerate(RULES_AT):
    sfx(bell(midi(PENTA[k] + 12), 0.2, 0.5), fr(fm), pan=-0.16 + 0.08 * k, send=0.52)
    sfx(pluck(midi(PENTA[k] + 24), 0.05, 0.05), fr(fm + 3), pan=0.12, send=0.2)

for g in range(4):
    sfx(thock(0.2 + 0.04 * g, 148 - 8 * g, 48), fr(NOISE + 4 + g * 5), pan=-0.24 + 0.16 * g, send=0.12)
sfx(whoosh(fr(18), 700, 2200, 0.14, 0.4), fr(FLAT - 8), pan=0)
sfx(thock(0.58, 210, 50), fr(FIX), send=0.22)
sfx(bell(midi(84), 0.18, 0.75), fr(FIX + 2), pan=0.08, send=0.55)

sfx(riser(fr(26), 0.2), fr(END - 28), send=0.18)
place(kick(0.72), fr(END))
sfx(thock(0.68, 220, 46), fr(END), send=0.24)
for k, m in enumerate([72, 76, 79, 84]):
    sfx(bell(midi(m), 0.15, 0.85), fr(END + 6 + k * 8), pan=-0.18 + 0.12 * k, send=0.6)
place(bass(midi(36), 1.6, 0.48), fr(END))

# 拆解 + 坏例：音乐变薄
tsec = np.arange(N) / SR
c = np.full(N, 14000.0)
a, b = fr(610), fr(650)
c = np.where((tsec >= a) & (tsec < b), 14000 * (800 / 14000) ** np.clip((tsec - a) / (b - a), 0, 1), c)
c = np.where((tsec >= b) & (tsec < fr(954)), 800, c)
a2, b2 = fr(954), fr(978)
c = np.where((tsec >= a2) & (tsec < b2), 800 * (14000 / 800) ** (np.clip((tsec - a2) / (b2 - a2), 0, 1) ** 2), c)
seg = slice(int(fr(600) * SR), int(fr(986) * SR))
for ch in range(2):
    MUS[ch, seg] = onepole_lp(onepole_lp(MUS[ch, seg], c[seg]), c[seg])
    PUMP[ch, seg] = onepole_lp(onepole_lp(PUMP[ch, seg], c[seg]), c[seg])


def reverb(x, seed, dec=0.62, length=2.2):
    t = tt(length)
    ir = np.random.default_rng(seed).standard_normal(len(t)) * np.exp(-t / dec)
    ir = onepole_lp(ir, 5800)
    ir[: int(0.016 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + len(ir)
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


# 轻侧链：底鼓处压一点 pad
pump = np.ones(N)
for b in range(0, 1320 // BEAT + 1):
    fm = b * BEAT
    if in_groove(fm) and fm >= 60:
        i0 = int(fr(fm) * SR)
        span = int(0.18 * SR)
        if i0 + span < N:
            pump[i0 : i0 + span] *= np.linspace(0.55, 1.0, span)
PUMP *= pump

mix = MUS + PUMP + SFX
mix[0] += reverb(SEND[0], 3) * 0.5
mix[1] += reverb(SEND[1], 4) * 0.5
mix = mix.T
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.06) / np.tanh(1.06)
fade = np.ones(N)
fo = int(0.75 * SR)
fade[-fo:] = np.linspace(1, 0, fo) ** 2
mix *= fade[:, None] * 0.88

root = os.path.dirname(os.path.abspath(__file__))
out_dir = os.path.normpath(os.path.join(root, '..', '..', '..', 'public', '03-card-stack'))
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
