"""
Design Style · 布局 03 · Card Stack v8 —— 配乐（纯 numpy，无外部采样）

22 秒 · 120 BPM · A 小调 / C 大调
主题（记忆点）：A4–C5–E5–D5–G4，全片只这一句，按抽/提/压变奏。
  0–2s     钩子：薄、紧、没有主题 —— 读不了
  2s       主题第一次完整出现：叠成可读
  抽        主题下行
  提        主题上行
  压        主题收束到 C
  落地      同一句变暖
  坏例      主题被拧断，低通
  片尾      主题干净再来一遍
时间点对齐 video/layout.ts 的 BEATS。

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
rng = np.random.default_rng(1984)

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
    t = tt(0.34)
    f = 47 + 96 * np.exp(-t / 0.022)
    body = np.sin(glide(f)) * np.exp(-t / 0.15)
    click = hp(noise(0.34), 3000) * np.exp(-t / 0.003) * 0.18
    return np.tanh((body + click) * 1.35) * level


def hat(level=1.0, dec=0.022):
    t = tt(0.1)
    return hp(hp(noise(0.1), 8000), 8000) * np.minimum(1, t / 0.001) * np.exp(-t / dec) * level


def clap(level=1.0):
    t = tt(0.2)
    y = hp(noise(0.2), 1700) * np.exp(-t / 0.038)
    y += hp(noise(0.2), 4000) * np.exp(-t / 0.01) * 0.45
    return y / (np.abs(y).max() + 1e-9) * level


def bell(freq, level=1.0, dec=0.7):
    t = tt(dec * 3)
    index = 2.4 * np.exp(-t / 0.11)
    y = np.sin(2 * np.pi * freq * t + index * np.sin(2 * np.pi * freq * 3.1 * t))
    return y * np.minimum(1, t / 0.002) * np.exp(-t / dec) * level


def bass(freq, d=0.28, level=1.0):
    t = tt(d + 0.08)
    env = np.minimum(1, t / 0.006) * np.exp(-t / 0.34) * np.where(t < d, 1, np.exp(-(t - d) / 0.03))
    y = np.sin(2 * np.pi * freq * t) + 0.2 * np.sin(4 * np.pi * freq * t)
    return np.tanh(y * 1.25) * env * level


def pad(freqs, d, level=1.0, att=0.5, rel=0.7, bright=0.72):
    t = tt(d + rel)
    y = np.zeros_like(t)
    for fq in freqs:
        for det in (-0.0035, 0.0, 0.0035):
            ph0 = rng.random() * 6.28
            for h in range(1, 6):
                if fq * h > 6400:
                    break
                y += np.sin(2 * np.pi * fq * (1 + det) * h * t + ph0 * h) / h ** (1.9 / bright)
    env = np.minimum(1, t / att) * np.where(t < d, 1, np.exp(-(t - d) / (rel / 4)))
    return y / (len(freqs) * 5.2) * env * level


def whoosh(d=0.36, lo=240, hi=4800, level=1.0, rise=0.55):
    t = tt(d)
    x = t / d
    cut = lo + (hi - lo) * np.sin(np.pi * np.clip(x / (2 * rise), 0, 1)) ** 2
    y = onepole_lp(onepole_lp(noise(d), cut), cut)
    return y * np.sin(np.pi * x) ** 1.5 / (np.abs(y).max() + 1e-9) * level


def riser(d=0.45, level=1.0):
    t = tt(d)
    x = t / d
    n = hp(onepole_lp(noise(d), 360 + 8200 * x ** 2), 240)
    tone = np.sin(glide(240 * 2 ** (1.4 * x))) * 0.16
    return (n / (np.abs(n).max() + 1e-9) + tone) * x ** 2.1 * level


def pluck(freq, level=1.0, dec=0.16):
    t = tt(dec * 4)
    y = np.sin(2 * np.pi * freq * t) * np.exp(-t / dec)
    y += 0.3 * np.sin(2 * np.pi * freq * 3 * t) * np.exp(-t / (dec * 0.2))
    return y * np.minimum(1, t / 0.0015) * level


def thock(level=1.0, f0=168, f1=60):
    t = tt(0.2)
    f = f1 + (f0 - f1) * np.exp(-t / 0.02)
    body = np.sin(glide(f)) * np.exp(-t / 0.06)
    wood = onepole_lp(hp(noise(0.2), 900), 3200) * np.exp(-t / 0.01) * 0.24
    return np.tanh((body + wood) * 1.2) * level


def swipe(d=0.16, level=1.0):
    t = tt(d)
    x = t / d
    y = onepole_lp(hp(noise(d), 500), 700 + 7800 * x)
    return y / (np.abs(y).max() + 1e-9) * np.sin(np.pi * x) ** 0.85 * level


def tick(level=1.0):
    t = tt(0.055)
    return hp(noise(0.055), 6200) * np.exp(-t / 0.007) * level


def lead(freq, d=0.42, level=1.0):
    t = tt(d)
    env = np.minimum(1, t / 0.012) * np.exp(-t / (d * 0.72))
    vib = 1 + 0.0035 * np.sin(2 * np.pi * 5.2 * t)
    y = np.sin(2 * np.pi * freq * vib * t)
    y += 0.16 * np.sin(4 * np.pi * freq * t) * np.exp(-t / 0.12)
    y += 0.05 * np.sin(6 * np.pi * freq * t) * np.exp(-t / 0.06)
    return np.tanh(y * 1.1) * env * level


BEAT = 30
STACK, PULL, LAND = 102, 186, 234
FLAT, LIFT = 342, 414
FAN, PRESS = 546, 666
FOLIO, FOLIO_PULL = 750, 834
BOARD, MOVE = 882, 966
PROOF, COMMIT = 1062, 1146
NOISE, FIX, END = 1182, 1218, 1254

CH = {
    'Am': (33, [57, 60, 64, 67]),
    'F': (29, [53, 57, 60, 65]),
    'C': (36, [55, 60, 64, 67]),
    'G': (31, [55, 59, 62, 67]),
    'Dm': (38, [53, 57, 60, 65]),
    'E': (28, [52, 56, 59, 64]),
}
PROG = [
    (0, 'Am'),
    (90, 'Am'),
    (174, 'F'),
    (330, 'C'),
    (534, 'G'),
    (654, 'C'),
    (738, 'F'),
    (870, 'Am'),
    (1050, 'G'),
    (1134, 'C'),
    (1170, 'Dm'),
    (1206, 'F'),
    (1242, 'C'),
]


def chord_at(frame):
    cur = PROG[0][1]
    for s, n in PROG:
        if frame >= s:
            cur = n
    return CH[cur]


# 主题：A4 C5 E5 D5 G4 —— 四张卡 + 落回
THEME = [69, 72, 76, 74, 67]
THEME_DOWN = [76, 74, 72, 69, 64]  # 抽
THEME_UP = [64, 67, 69, 72, 76]  # 提
THEME_CAD = [69, 72, 76, 79, 84]  # 压 / 收束


def play_theme(notes, start, step=7, level=0.22, dec=0.4):
    for k, m in enumerate(notes):
        place(lead(midi(m), dec + 0.08, level), fr(start + k * step), pan=-0.18 + k * 0.07, send=0.55, bus=LEAD)
        if k % 2 == 0:
            sfx(bell(midi(m), 0.06, 0.35), fr(start + k * step + 1), pan=0.2, send=0.4)


for k, (s, n) in enumerate(PROG):
    e = PROG[k + 1][0] if k + 1 < len(PROG) else 1320
    thin = 1170 <= s < 1206
    lvl = 0.22 if s < 90 else (0.28 if thin else 0.4)
    att = 0.7 if s == 0 else 0.22
    bright = 0.48 if s < 90 or thin else 0.74
    place(pad([midi(m) for m in CH[n][1]], fr(e - s) + 0.05, lvl, att=att, rel=0.55, bright=bright), fr(s), send=0.38, bus=PUMP)

# 钩子：只有嘀嗒，主题不出
for i in range(8):
    sfx(tick(0.07), fr(4 + i * 7), pan=-0.4 + i * 0.1, send=0.08)
sfx(riser(fr(18), 0.12), fr(72), send=0.14)

# 主题陈述
play_theme(THEME, STACK - 2, 6, 0.24, 0.48)
place(kick(0.7), fr(STACK))
sfx(thock(0.5, 200, 50), fr(STACK), send=0.18)

play_theme(THEME_DOWN, PULL - 2, 5, 0.2, 0.32)
sfx(swipe(0.16, 0.28), fr(PULL - 2), pan=-0.28, send=0.22)
sfx(thock(0.36), fr(PULL), send=0.12)
play_theme([72, 76], LAND, 8, 0.18, 0.5)
sfx(bell(midi(81), 0.16, 0.7), fr(LAND), pan=0.1, send=0.5)

sfx(whoosh(fr(16), 280, 3600, 0.12, 0.4), fr(FLAT - 8))
play_theme(THEME_UP, LIFT - 2, 5, 0.22, 0.36)
sfx(riser(fr(12), 0.12), fr(LIFT - 12), send=0.12)
sfx(bell(midi(84), 0.17, 0.6), fr(LIFT), pan=0.06, send=0.5)

sfx(whoosh(fr(14), 320, 4000, 0.14, 0.42), fr(FAN - 8))
play_theme(THEME_CAD, PRESS - 4, 6, 0.26, 0.55)
sfx(thock(0.48, 156, 48), fr(PRESS), send=0.18)
sfx(bell(midi(84), 0.18, 0.8), fr(PRESS + 2), pan=0.08, send=0.55)

play_theme(THEME, FOLIO, 7, 0.16, 0.4)
sfx(swipe(0.13, 0.18), fr(FOLIO_PULL - 2), pan=0.16)
sfx(thock(0.3), fr(FOLIO_PULL))

sfx(whoosh(fr(12), 400, 2800, 0.1, 0.4), fr(BOARD - 8))
sfx(swipe(0.12, 0.2), fr(MOVE - 2), pan=0.18)
sfx(thock(0.34, 170, 54), fr(MOVE), send=0.12)
place(pluck(midi(76), 0.12, 0.14), fr(MOVE), pan=-0.1, send=0.3, bus=LEAD)

sfx(whoosh(fr(14), 300, 3600, 0.12, 0.4), fr(PROOF - 8))
play_theme([72, 76, 79], COMMIT, 6, 0.18, 0.45)
sfx(thock(0.42, 160, 50), fr(COMMIT), send=0.16)

for g in range(4):
    sfx(thock(0.16 + 0.03 * g, 140 - 6 * g, 48), fr(NOISE + 3 + g * 4), pan=-0.28 + 0.14 * g, send=0.1)
sfx(whoosh(fr(14), 700, 2000, 0.12, 0.4), fr(FIX - 10))
sfx(thock(0.58, 210, 50), fr(FIX), send=0.2)
play_theme(THEME, END - 2, 8, 0.2, 0.7)
place(kick(0.72), fr(END))
sfx(thock(0.62, 220, 46), fr(END), send=0.22)
place(bass(midi(36), 1.6, 0.46), fr(END))

# 律动：钩子没有，原则之后进来，坏例变薄
for b in range(0, 1320 // BEAT + 1):
    fm = b * BEAT
    root, notes = chord_at(fm)
    if fm < 90 or 1170 <= fm < 1206:
        if 30 <= fm < 90:
            place(bass(midi(root), 0.16, 0.16), fr(fm))
        continue
    place(kick(0.46 if fm % 60 == 0 else 0.34), fr(fm))
    place(hat(0.09), fr(fm + 15), pan=0.28)
    if 330 <= fm < 1170 and fm % 60 == 30:
        place(clap(0.1), fr(fm + 15), pan=-0.08, send=0.08)
    place(bass(midi(root), 0.22, 0.38 if fm % 60 == 0 else 0.24), fr(fm))
    if fm < 1170:
        for q in range(2):
            m = notes[(b + q) % len(notes)] + 12
            place(pluck(midi(m), 0.08 if q else 0.12, 0.13), fr(fm + q * 15), pan=0.18 * (1 if q else -1), send=0.24, bus=PUMP)

for h, g in ((STACK, 0.2), (PULL, 0.18), (LIFT, 0.18), (PRESS, 0.2), (MOVE, 0.14), (COMMIT, 0.16), (FIX, 0.16)):
    sfx(whoosh(fr(16), 240, 5000, g, 0.5), fr(max(0, h - 10)))

# 坏例变薄
tsec = np.arange(N) / SR
c = np.full(N, 14000.0)
a, b = fr(1160), fr(1182)
c = np.where((tsec >= a) & (tsec < b), 14000 * (850 / 14000) ** np.clip((tsec - a) / (b - a), 0, 1), c)
c = np.where((tsec >= b) & (tsec < fr(1204)), 850, c)
a2, b2 = fr(1204), fr(1224)
c = np.where((tsec >= a2) & (tsec < b2), 850 * (14000 / 850) ** (np.clip((tsec - a2) / (b2 - a2), 0, 1) ** 2), c)
seg = slice(int(fr(1154) * SR), int(fr(1230) * SR))
for ch in range(2):
    MUS[ch, seg] = onepole_lp(onepole_lp(MUS[ch, seg], c[seg]), c[seg])
    PUMP[ch, seg] = onepole_lp(onepole_lp(PUMP[ch, seg], c[seg]), c[seg])


def reverb(x, seed, dec=0.68, length=2.3):
    t = tt(length)
    ir = np.random.default_rng(seed).standard_normal(len(t)) * np.exp(-t / dec)
    ir = onepole_lp(ir, 5600)
    ir[: int(0.014 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + len(ir)
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


def delay(x, ms=168, fb=0.32):
    k = int(ms * 0.001 * SR)
    y = np.zeros_like(x)
    y[k:] += x[:-k] * 0.55
    y[2 * k :] += x[: -2 * k] * fb
    return y


pump = np.ones(N)
for b in range(0, 1320 // BEAT + 1):
    fm = b * BEAT
    if fm >= 90 and not (1170 <= fm < 1206):
        i0 = int(fr(fm) * SR)
        span = int(0.17 * SR)
        if i0 + span < N:
            pump[i0 : i0 + span] *= np.linspace(0.52, 1.0, span)
PUMP *= pump

lead_mix = LEAD.copy()
lead_mix[0] += delay(LEAD[1], 172, 0.28)
lead_mix[1] += delay(LEAD[0], 148, 0.26)

mix = MUS + PUMP + SFX + lead_mix
mix[0] += reverb(SEND[0], 5) * 0.52
mix[1] += reverb(SEND[1], 6) * 0.52
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
