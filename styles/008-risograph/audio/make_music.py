"""
Design Style · 风格 008 · 孔版印刷 Risograph —— 配乐与音效（纯代码合成，无外部音源）

120 BPM（1 拍 = 0.5 秒 = 30 帧）· F 小调 / A♭ 大调
和弦：Fm（0–2s）| D♭（2–4s）| A♭（4–6s）| E♭（6–8s）| Fm（8–10s）| D♭ E♭ Fm D♭ E♭（每拍一个，10–12.25s）| A♭（12.5s 收束）
  0–0.5s    三张版飞来：齿轮嘀嗒 + 纸张呼啸，声像从左/上/右扫进来 → 0.5s 对版重击
  0.5–1.6s  RISOGRAPH 逐字母：每字一声轻拨；孔版印刷落下一记钟
  1.6–2s    钻进 O 的孔：上升 + 军鼓滚奏
  2–4s      孔版：热敏头高频扫描、烧孔的“滋”、油墨涌出的低频、揭版
  4–6s      分色：每过一色一声“咚 + 进纸”；扇开一声唰
  6–8s      叠印：三圆相撞，交叠处钟琴
  8–10s     小志：四张纸飞出，一页一记
  10–12.25s 五个词：每拍一切，和弦重音 + 八度钟琴
  12.25s    鼓停 0.25 秒 → 12.5s 海报落地，A♭ 大和弦
所有时间点与 video/*.tsx 的关键帧对齐（帧 / 60 = 秒）。

用法：python3 styles/008-risograph/audio/make_music.py
输出：public/008-risograph/music.wav（响度 −14 LUFS，真峰值 < −1 dBTP）
"""
import json
import os
import shutil
import subprocess
import wave

import numpy as np

SR = 48000
DUR = 15.0
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


def hat(level=1.0, dec=0.025):
    t = tt(0.12)
    return hp(hp(noise(0.12), 7000), 7000) * np.minimum(1, t / 0.001) * np.exp(-t / dec) * level


def snare(level=1.0):
    t = tt(0.25)
    body = np.sin(glide(185 + 70 * np.exp(-t / 0.01))) * np.exp(-t / 0.05)
    n = hp(onepole_lp(noise(0.25), 8000), 1200) * np.exp(-t / 0.07)
    return (0.55 * body + 0.8 * n) * level


def crash(d=2.2, level=1.0):
    t = tt(d)
    n = hp(hp(noise(d), 5000), 3000)
    env = np.minimum(1, t / 0.002) * (0.55 * np.exp(-t / 0.1) + 0.45 * np.exp(-t / 0.8))
    return n / (np.abs(n).max() + 1e-9) * env * level


def bell(freq, level=1.0, dec=0.8):
    t = tt(dec * 3)
    index = 2.2 * np.exp(-t / 0.12)
    y = np.sin(2 * np.pi * freq * t + index * np.sin(2 * np.pi * freq * 3.5 * t))
    return y * np.minimum(1, t / 0.002) * np.exp(-t / dec) * level


def pluck(freq, level=1.0, dec=0.18):
    t = tt(dec * 4)
    y = np.sin(2 * np.pi * freq * t) * np.exp(-t / dec)
    y += 0.35 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-t / (dec * 0.25))
    y += 0.12 * np.sin(2 * np.pi * freq * 10 * t) * np.exp(-t / (dec * 0.08))
    return y * np.minimum(1, t / 0.0015) * level


def thock(level=1.0, f0=190, f1=70):
    t = tt(0.25)
    f = f1 + (f0 - f1) * np.exp(-t / 0.025)
    body = np.sin(glide(f)) * np.exp(-t / 0.07)
    wood = onepole_lp(hp(noise(0.25), 900), 4000) * np.exp(-t / 0.01) * 0.35
    return np.tanh((body + wood) * 1.3) * level


def boom(level=1.0):
    t = tt(0.9)
    f = 38 + 90 * np.exp(-t / 0.05)
    body = np.sin(glide(f)) * np.exp(-t / 0.35)
    air = onepole_lp(noise(0.9), 900) * np.exp(-t / 0.08) * 0.4
    return np.tanh((body + air) * 1.6) * level


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


def tick(level=1.0, freq=2600, dec=0.012):
    t = tt(0.08)
    body = np.sin(2 * np.pi * freq * t) * np.exp(-t / dec)
    body += 0.5 * np.sin(2 * np.pi * freq * 1.51 * t) * np.exp(-t / (dec * 0.6))
    snap = hp(noise(0.08), 4000) * np.exp(-t / 0.0015) * 0.6
    return (body + snap) * np.minimum(1, t / 0.0005) * level


def click(level=1.0):
    t = tt(0.1)
    y = hp(noise(0.1), 3000) * np.exp(-t / 0.002) + 0.4 * np.sin(2 * np.pi * 2200 * t) * np.exp(-t / 0.006)
    return y * level


def pad(freqs, d, level=1.0, att=0.4, rel=0.6, bright=1.0):
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


def additive(freq, d, nh=24, kc0=12.0, kc1=2.0, kdec=0.08, att=0.003, dec=None, rel=0.04,
             voices=1, detune=0.0, odd=0.0, vib=0.0, level=1.0):
    t = tt(d + rel)
    kc = kc1 + (kc0 - kc1) * np.exp(-t / kdec)
    y = np.zeros_like(t)
    for v in range(voices):
        det = 0.0 if voices == 1 else (v / (voices - 1) - 0.5) * 2 * detune
        f0 = freq * (1 + det)
        ph = glide(f0 * (1 + vib * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.12) / 0.15, 0, 1))) if vib else 2 * np.pi * f0 * t
        p0 = rng.random() * 6.283
        for h in range(1, nh + 1):
            if f0 * h > 15000:
                break
            a = 1.0 / h * ((1 - odd) if h % 2 == 0 else 1.0)
            y += np.sin(h * (ph + p0)) * a * np.exp(-(h - 1) / kc)
    y /= voices
    env = np.minimum(1, t / att)
    if dec:
        env = env * np.exp(-t / dec)
    env = env * np.where(t < d, 1, np.exp(-(t - d) / (rel / 3)))
    return y * env * level


def buzz(d=0.8, f0=1800, level=1.0):
    """热敏头：窄带噪声 + 一点蜂鸣"""
    t = tt(d)
    n = onepole_lp(hp(noise(d), f0 * 0.6), f0 * 1.8)
    tone = np.sin(2 * np.pi * f0 * t) * 0.15 + np.sin(2 * np.pi * f0 * 1.01 * t) * 0.1
    env = np.minimum(1, t / 0.02) * np.where(t < d - 0.04, 1, np.exp(-(t - (d - 0.04)) / 0.02))
    return (n / (np.abs(n).max() + 1e-9) * 0.7 + tone) * env * level


def squelch(d=0.35, level=1.0):
    """油墨挤出来：低频咕噜"""
    t = tt(d)
    f = 90 + 40 * np.sin(2 * np.pi * 6 * t)
    y = np.sin(glide(f)) + 0.4 * onepole_lp(noise(d), 400)
    return np.tanh(y * 1.6) * np.minimum(1, t / 0.04) * np.exp(-t / 0.22) * level


KICK = kick(1.0)
CLAP = clap(1.0)
SNARE = snare(1.0)
CRASH = crash()
OHAT = hat(1.0, 0.07)
CHAT = hat(1.0, 0.02)
SHK = shaker(1.0, 0.03)
BOOM = boom(1.0)

BEAT, S16 = 30, 7.5
ROOT = {'Fm': 29, 'Db': 25, 'Ab': 32, 'Eb': 27}
PADV = {'Fm': [53, 56, 60, 63], 'Db': [49, 53, 56, 60], 'Ab': [51, 56, 60, 63], 'Eb': [51, 55, 58, 63]}
ARPV = {'Fm': [65, 68, 72, 75], 'Db': [61, 65, 68, 72], 'Ab': [63, 68, 72, 75], 'Eb': [63, 67, 70, 75]}
STABV = {'Fm': [53, 60, 65, 68, 72], 'Db': [49, 56, 61, 65, 68], 'Eb': [51, 58, 63, 67, 70], 'Ab': [44, 51, 56, 60, 63, 68]}
PROG = [(0, 'Fm'), (120, 'Db'), (240, 'Ab'), (360, 'Eb'), (480, 'Fm'),
        (600, 'Db'), (630, 'Eb'), (660, 'Fm'), (690, 'Db'), (720, 'Eb'), (750, 'Ab')]
GROOVE_END = 735
FINAL = 750


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


# ================= 前奏 0–120 =================
for k in range(8):
    fm = k * 15
    sfx(tick(0.14 + 0.04 * k, 2400 if k % 2 == 0 else 1900), fr(fm), pan=-0.4 + 0.1 * k, send=0.1)
sfx(whoosh(fr(28), 200, 7000, 0.45, 0.55), 0.02, pan=-0.3, send=0.2)
sfx(whoosh(fr(26), 250, 6500, 0.4, 0.5), 0.04, pan=0.35, send=0.2)
sfx(whoosh(fr(24), 180, 5000, 0.35, 0.6), 0.08, pan=0.0, send=0.15)
for k, m in enumerate([65, 68, 72, 75, 77, 80, 84, 87]):
    sfx(bell(midi(m), 0.04 + 0.008 * k, 0.32), fr(k * 3.6), pan=-0.55 + k * 0.15, send=0.4)
sfx(riser(fr(30), 0.3), 0.0, send=0.25)
kick_at(30)
sfx(BOOM * 0.95, fr(30), send=0.35)
place(CRASH * 0.4, fr(30), send=0.3)
# 逐字母
for i, m in enumerate([53, 56, 60, 65, 68, 72, 75, 77, 80]):
    sfx(pluck(midi(m), 0.055, 0.13), fr(36 + 2.2 * i), pan=-0.35 + 0.08 * i, send=0.28)
for fm, lv in ((45, 0.75), (60, 1.0)):
    kick_at(fm, 0.85)
    place(CLAP * 0.45 * lv, fr(fm), send=0.2)
sfx(bell(midi(80), 0.16, 0.7), fr(58), send=0.45)
sfx(click(0.08), fr(70), pan=-0.3)
sfx(click(0.08), fr(76), pan=0.3)
# 钻进孔
sfx(riser(fr(24), 0.42), fr(96), send=0.3)
sfx(whoosh(fr(24), 200, 8000, 0.5, 0.8), fr(96))
for k in range(8):
    place(SNARE * (0.1 + 0.035 * k), fr(104 + k * 2), send=0.15)
sfx(BOOM * 0.8, fr(120), send=0.35)
place(CRASH * 0.55, fr(120), send=0.3)

# ================= 律动 120–735 =================
for b in range(4, GROOVE_END // BEAT + 1):
    fm = b * BEAT
    if fm >= GROOVE_END:
        break
    kick_at(fm, 1.0)
    climax = fm >= 600
    if (fm - 120) % 60 == 30 or (climax and fm > 600):
        place(CLAP * (0.5 if not climax else 0.58), fr(fm), send=0.2)
    for s in range(4):
        t16 = fm + s * S16
        if t16 >= GROOVE_END:
            break
        if s == 2:
            place(OHAT * 0.2, fr(t16), pan=0.25, send=0.05)
        elif s == 0:
            place(CHAT * 0.11, fr(t16), pan=-0.2)
        else:
            place(SHK * (0.12 if s == 3 else 0.08), fr(t16), pan=-0.3 if s == 1 else 0.3)
for fm, lv in ((120, 0.55), (240, 0.55), (360, 0.55), (480, 0.5), (600, 0.72)):
    place(CRASH * lv, fr(fm), send=0.3)

for k in range(int((GROOVE_END - 30) / 15)):
    fm = 30 + k * 15
    if fm >= GROOVE_END:
        break
    r = ROOT[chord_at(fm)] + (12 if k % 2 else 0)
    y = additive(midi(r), 0.2, nh=18, kc0=8, kc1=2.2, kdec=0.06, voices=2, detune=0.003, dec=0.35, rel=0.03)
    place(np.tanh(y * 1.4) * 0.34, fr(fm), bus=PUMP)

for k, (s, n) in enumerate(PROG[:-1]):
    e = min(PROG[k + 1][0], GROOVE_END)
    if s >= GROOVE_END:
        break
    st = max(s, 30)
    for pan in (-0.55, 0.55):
        place(pad([midi(m) for m in PADV[n]], fr(e - st), 0.4 if s < 600 else 0.48, att=0.04 if st > 30 else 0.35,
                  rel=0.25, bright=0.9), fr(st), pan=pan, send=0.28, bus=PUMP)

ARP_PAT = [0, 2, 1, 3, 2, 3, 1, 2]
for k in range(int((GROOVE_END - 30) / S16)):
    fm = 30 + k * S16
    if fm >= GROOVE_END:
        break
    notes = ARPV[chord_at(fm)]
    m = notes[ARP_PAT[k % 8]]
    up = 12 if fm >= 600 else 0
    acc = 1.0 if k % 2 == 0 else 0.7
    y = additive(midi(m + up), 0.09, nh=20, kc0=10, kc1=2.2, kdec=0.04, dec=0.1, rel=0.04)
    place(y * 0.14 * acc, fr(fm), pan=-0.35 if k % 2 else 0.35, send=0.22, bus=PUMP)


def lead(m, d, level=1.0):
    y = additive(midi(m), d, nh=24, kc0=14, kc1=5, kdec=0.1, voices=2, detune=0.0035, odd=0.35, vib=0.003, dec=0.65, rel=0.05)
    b = bell(midi(m + 12), 0.2, 0.22)
    n = max(len(y), len(b))
    out = np.zeros(n)
    out[: len(y)] += y
    out[: len(b)] += b
    return out * level


POS, LEN = [0, 3, 6, 8, 10, 12, 14], [3, 3, 2, 2, 2, 2, 2]
HOOK = {120: [80, 77, 75, 72, 75, 68, 70],
        240: [77, 72, 70, 68, 70, 72, 77],
        360: [77, 80, 77, 70, 67, 70, 72],
        480: [72, 68, 65, 68, 72, 77, 80]}
for s, notes in HOOK.items():
    for p, l, m in zip(POS, LEN, notes):
        place(lead(m, l * 0.125 - 0.02, 0.18), fr(s + p * S16), send=0.24, bus=LEAD)

# 孔版音效
sfx(buzz(fr(50), 2100, 0.22), fr(120), pan=-0.15, send=0.15)
for k in range(24):
    sfx(tick(0.035 + 0.004 * (k % 4), 2800 + 40 * k, 0.005), fr(122 + k * 2.1), pan=-0.5 + (k % 8) * 0.12, send=0.08)
sfx(squelch(0.4, 0.55), fr(168), send=0.25)
sfx(whoosh(fr(20), 400, 3000, 0.22, 0.4), fr(168), pan=0.2)
sfx(whoosh(fr(34), 200, 4000, 0.35, 0.45), fr(198), pan=-0.1, send=0.15)
sfx(thock(0.4), fr(210), send=0.2)

# 分色
for fm, pn in ((240, -0.3), (270, 0.0), (300, 0.3)):
    sfx(thock(0.45), fr(fm), send=0.22)
    sfx(whoosh(fr(10), 500, 5000, 0.18, 0.7), fr(fm - 6), pan=pn)
    sfx(click(0.1), fr(fm + 2), pan=pn)
sfx(whoosh(fr(20), 300, 6000, 0.32, 0.5), fr(318), pan=0.25)

# 叠印
sfx(whoosh(fr(18), 250, 4500, 0.28, 0.5), fr(360), send=0.2)
for k, m in enumerate([68, 72, 75, 77, 80, 84, 87]):
    sfx(bell(midi(m), 0.09, 0.45), fr(388 + 6 * k), pan=-0.4 + k * 0.12, send=0.4)

# 小志
for i, fm in enumerate((488, 512, 536, 560)):
    sfx(whoosh(fr(12), 400, 7000, 0.2, 0.7), fr(fm - 4), pan=-0.35 + i * 0.22)
    sfx(thock(0.35), fr(fm), send=0.2)
    sfx(pluck(midi([65, 68, 72, 77][i]), 0.08, 0.16), fr(fm + 2), pan=-0.3 + i * 0.2, send=0.25)

# 五个词
CLIMB = [(600, 80), (630, 82), (660, 84), (690, 87), (720, 84)]
for fm, m in CLIMB:
    n = chord_at(fm)
    for v in STABV[n]:
        place(additive(midi(v), 0.2, nh=18, kc0=14, kc1=3, kdec=0.07, voices=4, detune=0.007, dec=0.24, rel=0.08, level=0.05),
              fr(fm), send=0.32)
    place(lead(m, 0.34, 0.22), fr(fm), send=0.28, bus=LEAD)
    sfx(bell(midi(m + 12), 0.14, 0.5), fr(fm), pan=0.25, send=0.48)
for k, fm in enumerate((620, 650, 680, 710)):
    sfx(whoosh(fr(11), 900, 9500, 0.18, 0.75), fr(fm), pan=0.4 if k % 2 == 0 else -0.1)
for k in range(4):
    place(SNARE * (0.16 + 0.05 * k), fr(720 + 2 + k * S16 / 2), send=0.18)

# 收束
rev = CRASH[: int(0.7 * SR)][::-1].copy()
sfx(rev * np.linspace(0, 1, len(rev)) ** 2 * 0.65, fr(FINAL) - 0.7, send=0.28)
kick_at(FINAL, 1.0)
sfx(BOOM * 1.0, fr(FINAL), send=0.4)
place(CRASH * 0.7, fr(FINAL), send=0.42)
for pan in (-0.55, 0.55):
    place(pad([midi(m) for m in [44, 51, 56, 60, 63, 68]], 1.9, 0.58, att=0.01, rel=1.0, bright=1.2), fr(FINAL), pan=pan, send=0.48)
place(lead(80, 0.55, 0.2), fr(FINAL), send=0.38, bus=LEAD)
sfx(bell(midi(92), 0.12, 1.1), fr(FINAL), send=0.55)
for fm, m in ((778, 72), (784, 75), (792, 80)):
    sfx(bell(midi(m), 0.18, 0.85), fr(fm), pan=(fm - 784) / 18, send=0.5)
for k, fm in enumerate(range(810, 871, 15)):
    sfx(tick(0.14 - 0.016 * k, 2400 if k % 2 == 0 else 1900), fr(fm), pan=0.12 if k % 2 == 0 else -0.12, send=0.12)

# 侧链 + 延迟
tsec = np.arange(N) / SR
ks = np.array(sorted(KICKS))
idx = np.searchsorted(ks, tsec, side='right') - 1
since = np.where(idx >= 0, tsec - ks[np.clip(idx, 0, None)], 9.0)
x = np.clip(since / 0.26, 0, 1)
duck = 1 - 0.62 * (1 - x) ** 2
duck = np.where(since < 0.004, 1 - 0.62 * since / 0.004, duck)
duck[tsec >= fr(FINAL)] = 1.0
PUMP *= duck[None, :]

d = int(0.375 * SR)
dl = np.zeros((2, N))
for k in range(1, 4):
    ch = k % 2
    src = LEAD[0] + LEAD[1]
    dl[ch, k * d:] += src[: N - k * d] * 0.5 * 0.42 ** k
for ch in range(2):
    dl[ch] = onepole_lp(dl[ch], 3500)
    SEND[ch] += dl[ch] * 0.28


def reverb(x, seed, dec=0.7, length=2.6):
    t = tt(length)
    ir = np.random.default_rng(seed).standard_normal(len(t)) * np.exp(-t / dec)
    ir = onepole_lp(ir, 6500)
    ir[: int(0.02 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    n = len(x) + len(ir)
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


mix = MUS + PUMP + LEAD + dl + SFX
mix[0] += reverb(SEND[0], 1) * 0.52
mix[1] += reverb(SEND[1], 2) * 0.52
for ch in range(2):
    mix[ch] = hp(hp(mix[ch], 32), 32)
mix = mix.T
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.28) / np.tanh(1.28)
fade = np.ones(N)
f0, f1 = int(fr(864) * SR), N
fade[f0:f1] = np.linspace(1, 0, f1 - f0) ** 2
mix *= fade[:, None]

root = os.path.dirname(os.path.abspath(__file__))
out_dir = os.path.normpath(os.path.join(root, '..', '..', '..', 'public', '008-risograph'))
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
