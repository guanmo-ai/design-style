"""
Design Style · 风格 010 · Paper Cut 剪纸层叠 —— 配乐与音效（纯代码合成，无外部音源）

24 秒 · 120 BPM（1 拍 = 0.5 秒 = 30 帧）· G 大调
暖的纸工艺：软垫、卡林巴式玻璃钟、轻底鼓 + 沙锤；音效是展开、撕开、揭层、剪刀、落纸。
和弦：C 民俗 6 · G 几何 7 · Em 纸板 6 · C 剪影 6 · G–Em 毛边 7 · D 字体 7 · G 片尾 9
时间点与 video/timeline.ts 对齐（帧 / 60 = 秒）。

用法：python3 styles/010-paper-cut/audio/make_music.py
输出：public/010-paper-cut/music.wav（响度 -14 LUFS，真峰值 < -1 dBTP）
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
BEAT = 0.5
rng = np.random.default_rng(2010)

MUS = np.zeros((2, N))
PUMP = np.zeros((2, N))
LEAD = np.zeros((2, N))
SFX = np.zeros((2, N))
SEND = np.zeros((2, N))


def fr(frame):
    return frame / 60.0


def tt(d):
    return np.arange(int(d * SR)) / SR


def place(sig, t, gain=1.0, pan=0.0, send=0.0, bus=None):
    bus = MUS if bus is None else bus
    i = int(round(t * SR))
    if i >= N or i < 0 or len(sig) == 0:
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


def fftf(x, resp):
    n = 1 << (len(x) - 1).bit_length()
    X = np.fft.rfft(x, n)
    X *= resp(np.fft.rfftfreq(n, 1 / SR))
    return np.fft.irfft(X, n)[: len(x)]


def lp(x, fc, order=2):
    return fftf(x, lambda f: 1 / np.sqrt(1 + (f / fc) ** (2 * order)))


def hp(x, fc, order=2):
    return fftf(x, lambda f: (f / fc) ** order / np.sqrt(1 + (f / fc) ** (2 * order)))


def bp(x, fc, q=2.0):
    return fftf(x, lambda f: 1 / (1 + q * q * (f / fc - fc / np.maximum(f, 1)) ** 2) ** 0.5)


def noise(d):
    return rng.standard_normal(int(d * SR))


def env(d, a=0.005, r=None, dec=None):
    t = tt(d)
    e = np.minimum(1, t / max(a, 1e-4))
    if dec is not None:
        e *= np.exp(-t / dec)
    if r:
        e *= np.clip((d - t) / r, 0, 1)
    return e


def note(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def sine(freq, d, dec=None):
    t = tt(d)
    return np.sin(2 * np.pi * freq * t) * env(d, 0.004, 0.04, dec)


def kalimba(f, d=1.1):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t)
    s += 0.28 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t / 0.18)
    s += 0.08 * np.sin(2 * np.pi * f * 4.7 * t) * np.exp(-t / 0.06)
    return s * env(d, 0.002, 0.08, 0.42)


def pad_tone(notes, d):
    out = np.zeros((2, int(d * SR)))
    t = tt(d)
    e = env(d, 0.08, 0.25)
    for n in notes:
        for k, det in enumerate((-0.08, 0.0, 0.09)):
            f = note(n) * 2 ** (det / 12)
            s = np.sin(2 * np.pi * f * t)
            s += 0.15 * np.sin(2 * np.pi * f * 2 * t)
            pan = (-0.6 + k * 0.6)
            out[0] += s * np.cos((pan + 1) * np.pi / 4)
            out[1] += s * np.sin((pan + 1) * np.pi / 4)
    return out * e / (len(notes) * 2.2)


def kick(d=0.38):
    t = tt(d)
    f = 48 + 90 * np.exp(-t / 0.03)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2)
    s += 0.25 * hp(noise(d), 2000) * np.exp(-t / 0.004)
    return np.tanh(s * 1.4)


def hat(d=0.05):
    return hp(noise(d), 7000, 3) * np.exp(-tt(d) / 0.016)


def shaker(d=0.07):
    return hp(noise(d), 4800, 2) * env(d, 0.01, None, 0.022)


def rustle(d=0.22):
    return bp(noise(d), 1400, 0.8) * env(d, 0.008, 0.04, 0.07)


def snip(d=0.08):
    t = tt(d)
    s = hp(noise(d), 4000, 2) * np.exp(-t / 0.012)
    s += 0.4 * np.sin(2 * np.pi * 2400 * t) * np.exp(-t / 0.018)
    return s


def tick(d=0.035):
    t = tt(d)
    s = hp(noise(d), 6200, 3) * np.exp(-t / 0.007)
    s += 0.18 * np.sin(2 * np.pi * 2100 * t) * np.exp(-t / 0.009)
    return s


def whoosh(d=0.4, f0=400, f1=2800):
    n = noise(d)
    out = np.zeros_like(n)
    seg = int(0.02 * SR)
    for i in range(0, len(n), seg):
        fc = f0 * (f1 / f0) ** (i / max(len(n), 1))
        out[i : i + seg] = bp(n[i : i + seg + 256], fc, 1.1)[: len(n[i : i + seg])]
    return out * np.sin(np.pi * tt(d) / d) ** 2


CH = {
    'G': [43, [67, 71, 74, 79]],
    'Em': [40, [64, 67, 71, 76]],
    'C': [36, [64, 67, 72, 76]],
    'D': [38, [66, 69, 74, 78]],
}
# 48 beats
PLAN = ['C'] * 6 + ['G'] * 7 + ['Em'] * 6 + ['C'] * 6 + ['G'] * 4 + ['Em'] * 3 + ['D'] * 7 + ['G'] * 9
NB = len(PLAN)

for b0 in range(0, NB, 2):
    c = PLAN[min(b0, NB - 1)]
    pad = pad_tone(CH[c][1], 2 * BEAT + 0.3)
    g = 0.13 if b0 >= 2 else 0.08
    for ch in range(2):
        place(lp(pad[ch], 3200 if b0 >= 4 else 1800), b0 * BEAT, g, -1 if ch == 0 else 1, 0.4, PUMP)

for b in range(1, NB):
    r = CH[PLAN[min(b, NB - 1)]][0]
    s = sine(note(r), 0.28, 0.18) * 0.7
    place(lp(s, 700), (b + 0.5) * BEAT, 0.28, 0, 0, PUMP)

for b in range(0, NB):
    t = b * BEAT
    if 1 <= b < NB - 1:
        place(kick(), t, 0.72)
    if b >= 2 and b < NB - 1:
        place(hat(), t + 0.25, 0.12, 0.3, 0.08)
    if b >= 4 and b < NB - 1:
        for s in range(4):
            place(shaker(), t + s * BEAT / 4, 0.08 if s % 2 else 0.05, -0.25, 0)

duck = np.ones(N)
for b in range(1, NB - 1):
    i = int(b * BEAT * SR)
    L = int(0.28 * SR)
    duck[i : i + L] = np.minimum(duck[i : i + L], 1 - 0.55 * np.exp(-np.arange(min(L, N - i)) / SR / 0.1))
PUMP *= duck

MEL = {
    6: [(0, 76, 0.5), (0.5, 79, 0.5), (1, 83, 1), (2.5, 79, 0.5), (3, 76, 1)],
    13: [(0, 74, 0.5), (0.5, 76, 0.5), (1, 79, 0.5), (1.5, 83, 0.5), (2, 86, 1.2)],
    20: [(0, 79, 0.5), (0.5, 83, 0.5), (1, 86, 1), (2.5, 83, 0.5), (3, 79, 1)],
    27: [(0, 74, 0.5), (1, 76, 0.5), (2, 79, 0.5), (3, 83, 1)],
    34: [(0, 79, 0.5), (0.5, 83, 0.5), (1, 86, 0.5), (1.5, 91, 1.2)],
    41: [(0, 74, 0.5), (0.5, 79, 0.5), (1, 83, 0.5), (1.5, 86, 1.6)],
}
for b0, ph in MEL.items():
    for rb, n, d in ph:
        place(kalimba(note(n), d * BEAT + 0.5), (b0 + rb) * BEAT, 0.18, 0.12, 0.35, LEAD)

dl = np.zeros_like(LEAD)
D = int(0.375 * SR)
mono = lp(LEAD.sum(axis=0) * 0.5, 2800)
for k, g in enumerate([0.36, 0.2, 0.1]):
    sh = D * (k + 1)
    dl[k % 2, sh:] += mono[: N - sh] * g

# 民俗：左右页错开落 + 花瓣/铜钱逐个砸拍
sfx(rustle(0.28), fr(8), 0.2, -0.2, 0.2)
sfx(whoosh(0.32, 280, 1600), fr(8), 0.12, 0, 0.15)
sfx(tick(), fr(16), 0.1, -0.3)
sfx(tick(), fr(20), 0.1, 0.3)
sfx(tick(), fr(30), 0.12, 0)
for i in range(12):
    sfx(snip(0.05), fr(34 + i * 3), 0.1, -0.4 + (i % 6) * 0.14)
    sfx(tick(), fr(34 + i * 3), 0.06, -0.3 + (i % 6) * 0.1)
for i in range(8):
    sfx(snip(0.045), fr(70 + i * 3), 0.09, -0.35 + i * 0.08)
# 撕开 → 几何层叠：6 层 3 帧一档，红日砸第 7 拍
sfx(whoosh(0.42, 400, 2400), fr(148), 0.2, 0, 0.22)
sfx(rustle(0.2), fr(168), 0.18, 0.1, 0.15)
for i in range(6):
    sfx(rustle(0.12), fr(192 + i * 3), 0.14, -0.45 + i * 0.15, 0.15)
    sfx(tick(), fr(192 + i * 3), 0.08, -0.4 + i * 0.14)
    sfx(kalimba(note(67 + [0, 2, 4, 7, 9, 12][i]), 0.35), fr(192 + i * 3), 0.06, -0.4 + i * 0.14, 0.16)
sfx(snip(0.07), fr(210), 0.16, 0.2)
# → 立体纸板：外壳/行/揭层逐个
sfx(whoosh(0.34, 350, 2000), fr(358), 0.18, -0.1, 0.2)
for i in range(6):
    sfx(tick(), fr(386 + i * 4), 0.08, -0.4 + i * 0.14)
    sfx(rustle(0.1), fr(406 + i * 4), 0.13, -0.4 + i * 0.14, 0.12)
# → 刀切剪影
sfx(whoosh(0.26, 1200, 3600), fr(538), 0.16, 0, 0.12)
sfx(snip(0.08), fr(570), 0.18, 0)
sfx(tick(), fr(576), 0.1, -0.25)
sfx(tick(), fr(580), 0.1, 0.25)
sfx(rustle(0.1), fr(630), 0.1, -0.2)
sfx(kalimba(note(74), 0.4), fr(666), 0.1, 0.15, 0.2)
# → 毛边 / App
sfx(whoosh(0.4, 500, 2200), fr(718), 0.2, 0.2, 0.2)
sfx(tick(), fr(738), 0.09, -0.3)
sfx(tick(), fr(760), 0.1, 0)
sfx(tick(), fr(780), 0.11, 0.1)
for i in range(6):
    sfx(shaker(0.05), fr(790 + i * 14), 0.07, 0.25)
# → 字体剪纸：三层纸 + 五字母逐个
sfx(whoosh(0.38, 300, 3800), fr(928), 0.2, 0, 0.22)
for i in range(3):
    sfx(tick(), fr(970 + i * 4), 0.08, -0.2 + i * 0.15)
    sfx(rustle(0.08), fr(970 + i * 4), 0.09, -0.2 + i * 0.15, 0.1)
for i in range(5):
    sfx(snip(0.07), fr(1000 + i * 4), 0.15, -0.35 + i * 0.16)
    sfx(tick(), fr(1000 + i * 4), 0.08, -0.3 + i * 0.14)
place(kalimba(note(86), 1.2), fr(1000), 0.14, 0.1, 0.35, LEAD)
sfx(rustle(0.14), fr(1074), 0.13, 0.1, 0.12)
for i in range(4):
    sfx(tick(), fr(1074 + i * 8), 0.06, -0.2 + i * 0.1)
# 片尾：窗花+门笺落下 → 镂空逐字 → 一句 → 底栏。不要砸章。
sfx(whoosh(0.36, 380, 1600), fr(1138), 0.14, 0, 0.18)
sfx(rustle(0.18), fr(1168), 0.16, 0, 0.16)
for i in range(8):
    sfx(tick(), fr(1178 + i * 3), 0.07, -0.35 + i * 0.08)
sfx(rustle(0.1), fr(1206), 0.11, 0.1, 0.12)
sfx(tick(), fr(1224), 0.09, 0)
place(kalimba(note(79), 0.9), fr(1224), 0.1, 0, 0.28, LEAD)
sfx(rustle(0.12), fr(1240), 0.12, 0, 0.14)
end = pad_tone([55, 67, 71, 74, 79], 2.4)
for ch in range(2):
    place(lp(end[ch], 2400), fr(1236), 0.2, -1 if ch == 0 else 1, 0.45, PUMP)


def reverb(x, seed, dec=0.8, length=2.4):
    t = tt(length)
    ir = np.random.default_rng(seed).standard_normal(len(t)) * np.exp(-t / dec)
    ir = lp(ir, 6000)
    ir[: int(0.018 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
    n = len(x) + len(ir)
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


mix = MUS + PUMP + LEAD + dl + SFX
mix[0] += reverb(SEND[0], 3) * 0.48
mix[1] += reverb(SEND[1], 5) * 0.48
for ch in range(2):
    mix[ch] = hp(mix[ch], 28)
mix = mix.T
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.25) / np.tanh(1.25)
fade = np.ones(N)
f0 = int(fr(1420) * SR)
fade[f0:] = np.linspace(1, 0, N - f0) ** 2
mix *= fade[:, None]

root = os.path.dirname(os.path.abspath(__file__))
out_dir = os.path.normpath(os.path.join(root, '..', '..', '..', 'public', '010-paper-cut'))
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
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    os.remove(tmp)
    js = r.stderr[r.stderr.rindex('{') : r.stderr.rindex('}') + 1]
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
