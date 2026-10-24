"""
Design Style · 布局 03 · Card Stack 卡片层叠 —— 配乐与音效（纯 numpy 合成，无外部采样）

120 BPM（1 拍 = 30 帧 = 0.5 秒）· F 大调 · 22 秒
气质：干净、轻、像产品发布会底乐——垫得住，不抢卡片。
  0–2.5s    钩子：四张卡弹进层叠，落地 + 主题垫上来
  2.5s      iOS Wallet：音色略亮，一声柔和和弦
  5.5s      Stripe / Linear：whoosh + 紫调和弦
  8.5s      扑克 / 名片：木击 + 钟
  11.5s     爆炸拆解：滤波器打开，空间变大
  14.5–18s  五条规则：鼓停、音乐变薄；每条规则一声上行钟
  18.0s     叠太多：一层层闷响
  18.9s     铺平：高频被拿掉
  19.5s     弹回正确：滤波器打开 + 落定
  20.0–22s  片尾：主题收束，最后一声极轻的玻璃
时间点与 video/layout.ts 的 TRANS / RULES_AT 对齐（帧 / 60 = 秒）。

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
rng = np.random.default_rng(2013)

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


def kick(level=1.0):
    t = tt(0.36)
    f = 44 + 96 * np.exp(-t / 0.028)
    body = np.sin(glide(f)) * np.exp(-t / 0.16)
    click = hp(noise(0.36), 2800) * np.exp(-t / 0.003) * 0.18
    return np.tanh((body + click) * 1.25) * level


def hat(level=1.0, dec=0.028):
    t = tt(0.12)
    return hp(hp(noise(0.12), 7200), 7200) * np.minimum(1, t / 0.001) * np.exp(-t / dec) * level


def epiano(freq, d=1.1, level=1.0):
    t = tt(d + 0.5)
    index = 1.15 * np.exp(-t / 0.28) + 0.12
    y = np.sin(2 * np.pi * freq * t + index * np.sin(2 * np.pi * freq * t))
    y += 0.12 * np.sin(2 * np.pi * freq * 12.0 * t) * np.exp(-t / 0.018)
    env = np.minimum(1, t / 0.004) * np.exp(-t / 1.05) * np.where(t < d, 1, np.exp(-(t - d) / 0.16))
    return y * env * level


def bell(freq, level=1.0, dec=0.7):
    t = tt(dec * 3)
    index = 2.0 * np.exp(-t / 0.14)
    y = np.sin(2 * np.pi * freq * t + index * np.sin(2 * np.pi * freq * 3.5 * t))
    return y * np.minimum(1, t / 0.002) * np.exp(-t / dec) * level


def bass(freq, d=0.28, level=1.0):
    t = tt(d + 0.08)
    env = np.minimum(1, t / 0.006) * np.exp(-t / 0.34) * np.where(t < d, 1, np.exp(-(t - d) / 0.03))
    y = np.sin(2 * np.pi * freq * t) + 0.2 * np.sin(4 * np.pi * freq * t)
    return np.tanh(y * 1.15) * env * level


def pad(freqs, d, level=1.0, att=0.5, rel=0.7, bright=0.9):
    t = tt(d + rel)
    y = np.zeros_like(t)
    for fq in freqs:
        for det in (-0.0035, 0.0, 0.0035):
            ph0 = rng.random() * 6.28
            for h in range(1, 8):
                if fq * h > 7500:
                    break
                y += np.sin(2 * np.pi * fq * (1 + det) * h * t + ph0 * h) / h ** (1.7 / bright)
    env = np.minimum(1, t / att) * np.where(t < d, 1, np.exp(-(t - d) / (rel / 4)))
    trem = 1 + 0.045 * np.sin(2 * np.pi * 0.55 * t)
    return y / (len(freqs) * 5.2) * env * trem * level


def whoosh(d=0.42, lo=280, hi=5200, level=1.0, rise=0.55):
    t = tt(d)
    x = t / d
    cut = lo + (hi - lo) * np.sin(np.pi * np.clip(x / (2 * rise), 0, 1)) ** 2
    y = onepole_lp(onepole_lp(noise(d), cut), cut)
    env = np.sin(np.pi * x) ** 1.6
    return y * env / (np.abs(y).max() + 1e-9) * level


def riser(d=0.45, level=1.0):
    t = tt(d)
    x = t / d
    cut = 400 + 9000 * x ** 2
    n = hp(onepole_lp(noise(d), cut), 280)
    tone = np.sin(glide(290 * 2 ** (1.6 * x))) * 0.2
    return (n / (np.abs(n).max() + 1e-9) + tone) * x ** 2.1 * level


def pluck(freq, level=1.0, dec=0.16):
    t = tt(dec * 4)
    y = np.sin(2 * np.pi * freq * t) * np.exp(-t / dec)
    y += 0.3 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-t / (dec * 0.24))
    y += 0.1 * np.sin(2 * np.pi * freq * 9 * t) * np.exp(-t / (dec * 0.07))
    return y * np.minimum(1, t / 0.0015) * level


def thock(level=1.0, f0=180, f1=68):
    t = tt(0.22)
    f = f1 + (f0 - f1) * np.exp(-t / 0.024)
    body = np.sin(glide(f)) * np.exp(-t / 0.07)
    wood = onepole_lp(hp(noise(0.22), 800), 3800) * np.exp(-t / 0.01) * 0.28
    return np.tanh((body + wood) * 1.25) * level


def glass(freq, level=1.0, dec=0.45):
    t = tt(dec * 3)
    y = np.zeros_like(t)
    for r, a, k in ((1, 1, 1), (2.71, 0.42, 1.4), (5.2, 0.18, 2.1), (8.4, 0.08, 3)):
        y += a * np.sin(2 * np.pi * freq * r * t) * np.exp(-t / (dec / k))
    return y * np.minimum(1, t / 0.0012) * level


def swipe(d=0.18, level=1.0):
    t = tt(d)
    x = t / d
    cut = 700 + 8500 * x
    y = onepole_lp(hp(noise(d), 500), cut)
    return y / (np.abs(y).max() + 1e-9) * np.sin(np.pi * x) ** 0.85 * level


# —— 与 layout.ts 对齐 ——
BEAT = 30
LAND, IOS, STRIPE, DECK = 60, 150, 330, 510
EXPLODE, RULES = 690, 870
PIT_CROWD, PIT_FLAT, RESTORE, END = 1080, 1134, 1170, 1200
RULES_AT = [888, 924, 960, 996, 1032]
HITS = [LAND, IOS, STRIPE, DECK, EXPLODE, RULES, PIT_CROWD, END]

CH = {
    'Fmaj9': (41, [53, 57, 60, 64]),  # F2 | F3 A3 C4 E4
    'Dm9': (38, [53, 57, 60, 62]),
    'Bbmaj9': (46, [53, 57, 58, 62]),
    'Csus': (48, [53, 55, 60, 65]),
    'Am9': (45, [52, 55, 60, 62]),
}
PROG = [
    (0, 'Fmaj9'),
    (150, 'Dm9'),
    (330, 'Bbmaj9'),
    (510, 'Csus'),
    (690, 'Am9'),
    (870, 'Dm9'),
    (1080, 'Csus'),
    (1170, 'Fmaj9'),
    (1200, 'Fmaj9'),
]


def chord_at(frame):
    cur = PROG[0][1]
    for s, n in PROG:
        if frame >= s:
            cur = n
    return CH[cur]


PENTA = [72, 74, 77, 79, 81, 84, 86, 89]  # F G Bb C D …

for k, (s, n) in enumerate(PROG):
    e = PROG[k + 1][0] if k + 1 < len(PROG) else 1320
    lvl = 0.42 if s < 1200 else 0.7
    att = 0.7 if s == 0 else 0.28
    place(pad([midi(m) for m in CH[n][1]], fr(e - s) + 0.08, lvl, att=att, rel=0.55, bright=0.95), fr(s), send=0.38)

# 开场：四张卡
for i in range(4):
    fm = 8 + i * 8 + 18
    sfx(glass(midi(PENTA[i + 2]), 0.22, 0.5), fr(fm), pan=-0.35 + 0.22 * i, send=0.55)
    sfx(pluck(midi(PENTA[i] - 12), 0.08, 0.12), fr(fm), pan=-0.3 + 0.2 * i, send=0.3)
place(bass(midi(41), 0.8, 0.35), 0.05)
sfx(riser(fr(48), 0.16), fr(10), send=0.18)

# 律动：克制，规则段和误区段把鼓拿掉
GROOVE = [(60, 870), (1170, 1200)]


def in_groove(fm):
    return any(a <= fm < b for a, b in GROOVE)


for b in range(0, 1320 // BEAT + 1):
    fm = b * BEAT
    root, notes = chord_at(fm)
    if in_groove(fm) and fm >= 60:
        place(kick(0.55 if fm < 510 else 0.48), fr(fm))
        place(hat(0.12), fr(fm + 15), pan=0.28)
        if 330 <= fm < 690:
            place(hat(0.07, 0.016), fr(fm + 7.5), pan=-0.2)
    if 60 <= fm < 1200:
        place(bass(midi(root), 0.22, 0.42 if fm % 60 == 0 else 0.28), fr(fm))
        if not (870 <= fm < 1170):
            for q in range(2):
                m = notes[(b + q) % len(notes)] + 12
                place(epiano(midi(m), 0.7, 0.11 if q else 0.16), fr(fm + q * 15), pan=0.22 * (1 if q else -1), send=0.32)

# 章节切点
for k, h in enumerate(HITS[:-1]):
    pan = 0.18 if k % 2 == 0 else -0.18
    sfx(whoosh(fr(28), 260, 5600, 0.22, 0.5), fr(h - 14), pan=pan)
    sfx(thock(0.38), fr(h), send=0.12)

# 世界切换的音色：iOS 玻璃、Stripe 钟、扑克木击、爆炸空间
sfx(bell(midi(81), 0.18, 0.85), fr(IOS), pan=-0.16, send=0.55)
sfx(glass(midi(89), 0.12, 0.55), fr(IOS + 6), pan=0.14, send=0.45)
sfx(bell(midi(77), 0.16, 0.7), fr(STRIPE), pan=0.18, send=0.5)
sfx(thock(0.4, 160, 58), fr(DECK), send=0.18)
sfx(bell(midi(84), 0.14, 0.7), fr(DECK + 4), pan=-0.12, send=0.5)
sfx(riser(fr(24), 0.18), fr(EXPLODE - 18), send=0.2)
sfx(glass(midi(86), 0.16, 0.7), fr(EXPLODE), pan=0.1, send=0.55)

# 规则：上行五声
for k, fm in enumerate(RULES_AT):
    sfx(bell(midi(PENTA[k] + 12), 0.22, 0.55), fr(fm), pan=-0.18 + 0.08 * k, send=0.5)
    sfx(pluck(midi(PENTA[k] + 24), 0.06, 0.06), fr(fm + 3), pan=0.1, send=0.25)

# 误区
for g in range(3):
    sfx(thock(0.22 + 0.04 * g, 150 - 10 * g, 50), fr(PIT_CROWD + 6 + g * 5), pan=-0.2 + 0.2 * g, send=0.15)
sfx(whoosh(fr(20), 800, 2400, 0.16, 0.4), fr(PIT_FLAT - 6), pan=0)
sfx(thock(0.55, 200, 55), fr(RESTORE), send=0.2)
sfx(bell(midi(84), 0.18, 0.7), fr(RESTORE + 2), pan=0.1, send=0.55)

# 片尾
sfx(riser(fr(28), 0.22), fr(END - 30), send=0.2)
place(kick(0.7), fr(END))
sfx(thock(0.7, 210, 48), fr(END), send=0.22)
for k, m in enumerate([77, 81, 84]):
    sfx(bell(midi(m), 0.16, 0.9), fr(END + 8 + k * 8), pan=-0.16 + 0.16 * k, send=0.62)
place(bass(midi(41), 1.8, 0.5), fr(END))
sfx(glass(midi(96), 0.1, 0.8), fr(1288), pan=0.18, send=0.75)

# 规则 + 误区：把音乐变薄
tsec = np.arange(N) / SR
c = np.full(N, 15000.0)
a, b = fr(860), fr(888)
c = np.where((tsec >= a) & (tsec < b), 15000 * (900 / 15000) ** np.clip((tsec - a) / (b - a), 0, 1), c)
c = np.where((tsec >= b) & (tsec < fr(1164)), 900, c)
a2, b2 = fr(1164), fr(1188)
c = np.where((tsec >= a2) & (tsec < b2), 900 * (15000 / 900) ** (np.clip((tsec - a2) / (b2 - a2), 0, 1) ** 2), c)
seg = slice(int(fr(850) * SR), int(fr(1192) * SR))
for ch in range(2):
    MUS[ch, seg] = onepole_lp(onepole_lp(MUS[ch, seg], c[seg]), c[seg])


def reverb(x, seed, dec=0.65, length=2.4):
    t = tt(length)
    ir = np.random.default_rng(seed).standard_normal(len(t)) * np.exp(-t / dec)
    ir = onepole_lp(ir, 6200)
    ir[: int(0.018 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + len(ir)
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


mix = MUS + SFX
mix[0] += reverb(SEND[0], 3) * 0.55
mix[1] += reverb(SEND[1], 4) * 0.55
mix = mix.T
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.08) / np.tanh(1.08)
fade = np.ones(N)
fo = int(0.7 * SR)
fade[-fo:] = np.linspace(1, 0, fo) ** 2
mix *= fade[:, None] * 0.9

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
