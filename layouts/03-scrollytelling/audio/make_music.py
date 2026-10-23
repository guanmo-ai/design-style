"""
Design Style · 布局 03 · Scrollytelling 滚动叙事 —— 配乐 v3（纯代码合成，无任何外部音源 / 采样）

方向：发布会开场片（keynote launch film）× 电影预告的混合 —— 低频冲击、铜管 braam、超锯齿弦乐 Pad、
四踩电子律动、带泛音失谐的钢琴、大空间混响。120 BPM（1 拍 = 30 帧 = 0.5 秒）· D 大调 / b 小调 · 15 秒

  0–1.5s    开场：次低频长音 + 倒放的混响钢琴往上涌 → 第 60 帧（屏幕亮起）冲击 + braam
  1.5–3.4s  01 定义：侧链压缩的八分音符贝斯、轻底鼓、拨弦琶音；每一行字过线 → 一个钢琴音（往上走）
  3.4–5.75s 02 结构：律动抽空，只剩弦乐与时钟般的细碎高音；第 240 帧倒着滚 → 整条音乐真的“倒带”；
            第 270 帧再滚一遍 → 钢琴上行；第 300 帧舞台松开 → 低音一击；随后上扫进下一章
  5.75–10s  03–05：完整律动（四踩底鼓、拍手、开镲）；Snow Fall 加风声与远处的钢琴；
            数据一章每一步一串拨弦；苹果一章 braam + 合唱“啊”铺满，转一圈的每一下滑动一声低鼓
  10–11.5s  06 四种排法：滤波慢慢打开，四块面板亮起 → 四声上行的钟；军鼓滚奏 + 上扫，攒到最高
  11.5–14s  07 五条规则：落地（Asus → A 解决）；匀速滚动里每点亮一条 → 一下铜管和弦 + 低鼓
  14–15s    片尾：最后一击 + D 大调加九和弦，长长的尾音
另外，整条片子“滚动的声音”来自 S(f) 本身：滚得越快，空气声越响、越亮。

滚动曲线 S(f) 直接从 video/page.ts 读出来重算（和画面同一份数据，改了滑动配乐自动跟上）。
用法：python3 layouts/03-scrollytelling/audio/make_music.py
输出：public/03-scrollytelling/music.wav（48 kHz 立体声，ffmpeg 两遍 loudnorm → -14 LUFS / -1 dBTP）
"""
import json
import os
import re
import shutil
import subprocess
import wave

import numpy as np

SR = 48000
DUR = 15.0
N = int(SR * DUR)
RNG = np.random.default_rng(2026)
BEAT = 0.5


def fr(frame):
    return frame / 60.0


def tt(d):
    return np.arange(int(d * SR)) / SR


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ═════════════ 从 page.ts 读滚动曲线 ═════════════
ROOT = os.path.dirname(os.path.abspath(__file__))
PAGE = open(os.path.join(ROOT, '..', 'video', 'page.ts'), encoding='utf-8').read()
BLOCK = PAGE[PAGE.index('export const FLICKS'):]
BLOCK = BLOCK[: BLOCK.index('];')]
FLICKS = [(int(a), float(b), int(c), (e or 'out')) for a, b, c, e in re.findall(r"\[(\d+),\s*(\d+),\s*(\d+)(?:,\s*'(\w+)')?\]", BLOCK)]


def arr(name):
    return [int(v) for v in re.search(name + r' = \[([\d, ]+)\]', PAGE).group(1).split(',')]


RULES_AT = arr('RULES_AT')
DEF_AT = arr('DEF_AT')
PATTERN_TH = arr('PATTERN_TH')
XRAY_IN = int(re.search(r'XRAY = \{in: (\d+)', PAGE).group(1))


def bezier(x1, y1, x2, y2):
    def f(x):
        lo, hi = 0.0, 1.0
        for _ in range(40):
            mid = (lo + hi) / 2
            bx = 3 * (1 - mid) ** 2 * mid * x1 + 3 * (1 - mid) * mid ** 2 * x2 + mid ** 3
            lo, hi = (mid, hi) if bx < x else (lo, mid)
        t = (lo + hi) / 2
        return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t ** 2 * y2 + t ** 3
    return f


def ease_of(name):
    m = re.search(name + r': Easing\.bezier\(([\d.]+), ([\d.]+), ([\d.]+), ([\d.]+)\)', PAGE)
    return bezier(*[float(v) for v in m.groups()])


EASE = {'out': ease_of('out'), 'inOut': ease_of('inOut'), 'lin': lambda t: t}


def S(f):
    v = 0.0
    for at, to, d, e in FLICKS:
        if f < at:
            break
        t = min(1.0, (f - at) / d)
        v = v + (to - v) * EASE[e](t)
    return v


FINE = 4
SF = np.array([S(i / FINE) for i in range(900 * FINE + 1)])
SPEED = np.abs(np.gradient(SF)) * FINE  # px / 帧


def frame_at(y, start=0):
    i = np.argmax(SF[start * FINE:] >= y)
    return start + i / FINE


PATTERNS_AT = [frame_at(y, 640) for y in PATTERN_TH]


# ═════════════ DSP 基础：FFT 滤波、STFT 时变滤波、混响 ═════════════
def fft_filter(x, gain_of_f):
    n = len(x)
    nfft = 1 << (n - 1).bit_length()
    X = np.fft.rfft(x, nfft)
    f = np.fft.rfftfreq(nfft, 1 / SR)
    return np.fft.irfft(X * gain_of_f(f), nfft)[:n]


def lp_gain(fc, order=2, q=0.0):
    def g(f):
        r = f / max(fc, 1.0)
        out = 1 / np.sqrt(1 + r ** (2 * order))
        if q:
            out = out * (1 + q * np.exp(-(np.log2(np.maximum(r, 1e-6)) ** 2) / (2 * 0.12 ** 2)))
        return out
    return g


def hp_gain(fc, order=2):
    return lambda f: 1 / np.sqrt(1 + (max(fc, 1.0) / np.maximum(f, 1e-3)) ** (2 * order))


def bp_gain(fc, bw_oct=1.0):
    return lambda f: np.exp(-(np.log2(np.maximum(f, 1e-3) / fc) ** 2) / (2 * (bw_oct / 2.355) ** 2))


def lp(x, fc, order=2, q=0.0):
    return fft_filter(x, lp_gain(fc, order, q))


def hp(x, fc, order=2):
    return fft_filter(x, hp_gain(fc, order))


def bp(x, fc, bw=1.0):
    return fft_filter(x, bp_gain(fc, bw))


NFFT = 2048
HOP = 256
WIN = np.hanning(NFFT + 1)[:-1]


def stft_filter(x, cutoff_at, order=2, q=0.0, mode='lp'):
    """时变滤波：cutoff_at(t 秒数组) → 截止频率；STFT 每帧一个滤波器，重叠相加"""
    n = len(x)
    pad = np.concatenate([np.zeros(NFFT), x, np.zeros(NFFT)])
    frames = 1 + (len(pad) - NFFT) // HOP
    idx = np.arange(NFFT)[None, :] + HOP * np.arange(frames)[:, None]
    X = np.fft.rfft(pad[idx] * WIN, axis=1)
    f = np.fft.rfftfreq(NFFT, 1 / SR)[None, :]
    tc = (np.arange(frames) * HOP + NFFT / 2 - NFFT) / SR
    fc = np.maximum(np.asarray(cutoff_at(tc), dtype=float), 20)[:, None]
    r = f / fc
    if mode == 'lp':
        g = 1 / np.sqrt(1 + r ** (2 * order))
    elif mode == 'hp':
        g = 1 / np.sqrt(1 + (1 / np.maximum(r, 1e-6)) ** (2 * order))
    else:  # 带通，order 当作带宽（倍频程）
        g = np.exp(-(np.log2(np.maximum(r, 1e-6)) ** 2) / (2 * (order / 2.355) ** 2))
    if q:
        g = g * (1 + q * np.exp(-(np.log2(np.maximum(r, 1e-6)) ** 2) / (2 * 0.12 ** 2)))
    y = np.fft.irfft(X * g, NFFT, axis=1) * WIN
    out = np.zeros(len(pad))
    np.add.at(out, idx, y)
    norm = np.zeros(len(pad))
    np.add.at(norm, idx, np.broadcast_to(WIN ** 2, y.shape))
    out /= np.maximum(norm, 1e-3)
    return out[NFFT: NFFT + n]


def conv(x, ir):
    n = len(x) + len(ir) - 1
    nfft = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nfft) * np.fft.rfft(ir, nfft), nfft)[: len(x)]


def make_ir(length, decay, seed, bright=7000, pre=0.012):
    """合成的立体声混响冲激响应：早期反射 + 高频衰减得更快的尾巴"""
    r = np.random.default_rng(seed)
    t = tt(length)
    irs = []
    for ch in range(2):
        nz = r.standard_normal(len(t))
        lo = lp(nz, 1200) * np.exp(-t / decay)
        hi_ = hp(nz, 1200) * np.exp(-t / (decay * 0.45))
        tail = lp(lo + hi_ * 0.8, bright)
        tail *= 1 - np.exp(-t / 0.03)  # 尾巴慢慢长出来
        er = np.zeros(len(t))
        for k in range(14):
            d = int((0.006 + r.random() * 0.07) * SR)
            er[d] += (0.6 - k * 0.03) * (1 if r.random() > 0.5 else -1)
        ir = np.concatenate([np.zeros(int(pre * SR)), (tail * 0.9 + er * 0.25)])[: len(t)]
        irs.append(ir / np.sqrt(np.sum(ir ** 2)))
    return irs


HALL = make_ir(3.6, 1.25, 1)
ROOM = make_ir(1.2, 0.32, 2, bright=9000, pre=0.004)


# ═════════════ 总线 ═════════════
def bus():
    return np.zeros((2, N))


B = {k: bus() for k in ['drum', 'bass', 'pad', 'keys', 'fx', 'hit', 'air']}
SEND_HALL = bus()
SEND_ROOM = bus()


def place(sig, t, b='keys', gain=1.0, pan=0.0, hall=0.0, room=0.0):
    i = int(round(t * SR))
    if sig.ndim == 1:
        sig = np.vstack([sig, sig])
    if i < 0:
        sig = sig[:, -i:]
        i = 0
    if i >= N:
        return
    sig = sig[:, : N - i]
    L = sig.shape[1]
    gl = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2) * gain
    gr = np.sin((pan + 1) * np.pi / 4) * np.sqrt(2) * gain
    seg = np.vstack([sig[0] * gl, sig[1] * gr])
    B[b][:, i: i + L] += seg
    if hall:
        SEND_HALL[:, i: i + L] += seg * hall
    if room:
        SEND_ROOM[:, i: i + L] += seg * room


def env_adsr(n, a, d, s, r_, total):
    """n = 采样数；a/d/r 秒；total = 音符总长（秒，含释放）"""
    t = np.arange(n) / SR
    gate = total - r_
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = np.where(t > gate, np.exp(-(t - gate) / max(r_ / 4, 1e-4)), 1.0)
    return e * rel


# ═════════════ 振荡器 ═════════════
def polyblep(ph, dt):
    out = np.zeros_like(ph)
    m = ph < dt
    x = ph[m] / dt[m]
    out[m] = x + x - x * x - 1
    m2 = ph > 1 - dt
    x = (ph[m2] - 1) / dt[m2]
    out[m2] = x * x + x + x + 1
    return out


def saw(freq, n, phase0=0.0):
    freq = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    dt = freq / SR
    ph = (phase0 + np.cumsum(dt)) % 1.0
    return 2 * ph - 1 - polyblep(ph, dt)


def sine(freq, n, phase0=0.0):
    freq = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    return np.sin(2 * np.pi * (phase0 + np.cumsum(freq / SR)))


def supersaw(freq, n, voices=7, detune=0.18, seed=0):
    r = np.random.default_rng(seed)
    L = np.zeros(n)
    R = np.zeros(n)
    offs = np.linspace(-1, 1, voices)
    for k, o in enumerate(offs):
        cents = o * detune * 100 * (0.7 + 0.3 * r.random())
        f = freq * 2 ** (cents / 1200)
        v = saw(f, n, r.random())
        amp = 1.0 if k == voices // 2 else 0.62
        pan = o * 0.9
        L += v * amp * np.cos((pan + 1) * np.pi / 4)
        R += v * amp * np.sin((pan + 1) * np.pi / 4)
    return np.vstack([L, R]) / np.sqrt(voices)


# ═════════════ 乐器 ═════════════
def piano(freq, dur=2.5, vel=1.0, bright=1.0):
    """加法合成钢琴：三根弦微失谐、泛音带不和谐度 B、高次泛音衰减更快、两段式衰减"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    B_ = 0.00035 * (freq / 261.6) ** 0.5
    out = np.zeros(n)
    kmax = int(min(28, 16000 / freq))
    for k in range(1, kmax + 1):
        fk = k * freq * np.sqrt(1 + B_ * k * k)
        a = (1 / k ** 1.05) * np.exp(-((k - 1) / (6 + 6 * vel * bright)))
        d1 = 0.25 + 1.6 / (1 + 0.35 * k) * (220 / max(freq, 60)) ** 0.35
        d2 = d1 * 6
        e = 0.65 * np.exp(-t / d1) + 0.35 * np.exp(-t / d2)
        for dc in (-0.7, 0.0, 0.8):
            out += a * e * np.sin(2 * np.pi * fk * (1 + dc * 0.0004) * t + k * 1.3 + dc)
    ham = hp(RNG.standard_normal(n) * np.exp(-t / 0.004), 1500) * 0.05 * vel
    out = (out / 3 + ham) * vel
    out *= np.minimum(1, t / 0.002)
    out *= np.minimum(1, (dur - t) / 0.08)
    return out / 1.8


def pluck(freq, dur=0.45, bright=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, int(min(24, 15000 / freq)) + 1):
        out += (1 / k) * np.exp(-t * (6 + k * 2.4 / bright)) * np.sin(2 * np.pi * k * freq * t + k)
    return out * np.minimum(1, t / 0.0015) * np.minimum(1, (dur - t) / 0.03) * 0.6


def bell(freq, dur=2.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    parts = [(1, 1, 1.6), (2.0, 0.5, 1.0), (2.76, 0.36, 0.7), (5.4, 0.2, 0.35), (8.93, 0.12, 0.2), (0.5, 0.25, 2.0)]
    out = sum(a * np.exp(-t / d) * np.sin(2 * np.pi * freq * r * t) for r, a, d in parts)
    return out * np.minimum(1, t / 0.001) * 0.45


def kick(level=1.0, dec=0.3, f0=160, f1=52):
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.035)
    body = sine(f, n) * np.exp(-t / dec)
    click = hp(RNG.standard_normal(n) * np.exp(-t / 0.0025), 2500) * 0.35
    return np.tanh((body + click) * 1.6) * level * 0.8


def clap(level=1.0):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    e = np.zeros(n)
    for k, d in enumerate([0, 0.009, 0.019, 0.028]):
        m = t >= d
        e[m] += np.exp(-(t[m] - d) / (0.007 if k < 3 else 0.11))
    return bp(RNG.standard_normal(n), 1400, 1.6) * e * level * 0.9


def hat(level=1.0, dec=0.03):
    n = int((dec * 6 + 0.02) * SR)
    t = np.arange(n) / SR
    return hp(RNG.standard_normal(n), 7500, 3) * np.exp(-t / dec) * level * 0.5


def snare(level=1.0):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    tone = sine(185 + 40 * np.exp(-t / 0.02), n) * np.exp(-t / 0.06) * 0.5
    nz = bp(RNG.standard_normal(n), 4000, 2.5) * np.exp(-t / 0.09)
    return (tone + nz) * level * 0.7


def taiko(level=1.0, f0=95, f1=52):
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.07)
    body = sine(f, n) * np.exp(-t / 0.45)
    skin = lp(RNG.standard_normal(n), 900) * np.exp(-t / 0.03) * 0.8
    return np.tanh((body + skin) * 1.4) * level * 0.8


def boom(level=1.0, dur=3.0):
    """冲击：次低频下坠 + 噪声爆破"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 36 + 62 * np.exp(-t / 0.18)
    sub = sine(f, n) * np.exp(-t / 0.6) * np.minimum(1, t / 0.003)
    nz = lp(RNG.standard_normal(n), 2200) * np.exp(-t / 0.22) * 0.5
    crack = hp(RNG.standard_normal(n), 3000) * np.exp(-t / 0.012) * 0.4
    return np.tanh((sub * 1.2 + nz + crack) * 1.3) * level


def braam(root_midi, dur=2.4, level=1.0, bright=2600, seed=3):
    """电影铜管 braam：低八度叠五度的锯齿墙，滤波先猛开再慢慢合上，起音带一点往上的滑音"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    bend = 2 ** ((-0.6 * np.exp(-t / 0.06)) / 12)
    out = np.zeros((2, n))
    for k, iv in enumerate([0, 7, 12, 19, 24]):
        f = midi(root_midi + iv) * bend
        out += supersaw(f, n, voices=5, detune=0.12, seed=seed + k) * (1.0 if iv < 13 else 0.55)
    cut = lambda tc: 180 + bright * np.exp(-np.maximum(tc, 0) / 0.5) * np.minimum(1, np.maximum(tc, 0) / 0.05) + 380
    out = np.vstack([stft_filter(out[c], cut, order=2, q=0.6) for c in range(2)])
    e = np.minimum(1, t / 0.03) * np.exp(-t / (dur * 0.5)) * np.minimum(1, (dur - t) / 0.3)
    return np.tanh(out * e * 1.8) * level * 0.5


def choir(freqs, dur, level=1.0, att=0.6):
    """合唱“啊”：锯齿 → 共振峰（a：700 / 1220 / 2600 Hz）"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t)
    for i, f in enumerate(freqs):
        out += supersaw(f * vib, n, voices=5, detune=0.08, seed=40 + i)
    form = lambda f: (bp_gain(700, 0.7)(f) + 0.7 * bp_gain(1220, 0.6)(f) + 0.35 * bp_gain(2600, 0.5)(f)) + 0.05
    out = np.vstack([fft_filter(out[c], form) for c in range(2)])
    e = np.minimum(1, t / att) * np.minimum(1, (dur - t) / 0.5)
    return out * e * level * 0.35


def riser(dur, level=1.0, f0=300, f1=9000):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = RNG.standard_normal((2, n))
    cut = lambda tc: f0 * (f1 / f0) ** np.clip(tc / dur, 0, 1) ** 1.6
    y = np.vstack([stft_filter(x[c], cut, order=1.2, mode='bp') for c in range(2)])
    tone = saw(110 * 2 ** (3 * (t / dur) ** 2), n) * 0.08
    y = y + lp(tone, 3000)
    return y * (t / dur) ** 2.2 * level


def reverse_swell(sig_fn, dur, level=1.0):
    """把一个音加上大混响再倒放：从无到有地涌上来"""
    x = sig_fn()
    wet = conv(np.concatenate([x, np.zeros(int(dur * SR))]), HALL[0])
    rev = wet[::-1][-int(dur * SR):]
    rev = rev[::-1][::-1]
    return rev / (np.abs(rev).max() + 1e-9) * level


# ═════════════ 和声 ═════════════
# 每个和弦：(开始秒, 根音 MIDI, 和弦音)
CH = {
    'Bm': (35, [59, 62, 66, 69]),
    'G': (31, [55, 59, 62, 66]),
    'D': (38, [57, 62, 66, 69]),
    'A': (33, [57, 61, 64, 71]),
    'Asus': (33, [57, 62, 64, 69]),
    'Dadd9': (38, [57, 62, 64, 66, 69]),
}
PROG = [(0.0, 'D'), (1.5, 'Bm'), (2.5, 'G'), (3.5, 'D'), (4.5, 'A'), (5.5, 'Bm'), (6.5, 'G'), (7.5, 'D'), (8.5, 'A'),
        (9.5, 'Bm'), (10.5, 'G'), (11.0, 'Asus'), (11.5, 'A'), (12.0, 'Bm'), (12.5, 'G'), (13.0, 'D'), (13.5, 'A'), (14.0, 'Dadd9')]


def chord_at(t):
    c = PROG[0][1]
    for s_, name in PROG:
        if t >= s_:
            c = name
    return c


# ═════════════ 编曲 ═════════════
T_IMPACT = fr(60)
T_DEF = fr(90)
T_XR = fr(XRAY_IN)
T_REW = fr(240)
T_FWD = fr(270)
T_REL = fr(300)
T_GROOVE = fr(345)
T_RULES = fr(RULES_AT[0])
T_BUILD = T_RULES - 0.75
T_END = 14.0

# —— 开场：次低频长音 + 倒放混响钢琴涌上来 + 冲击 + braam ——
n0 = int(1.6 * SR)
t0 = np.arange(n0) / SR
drone = (sine(midi(26), n0) * 0.35 + lp(saw(midi(38), n0) + saw(midi(45) * 1.002, n0), 500) * 0.12) * np.minimum(1, t0 / 0.6)
place(drone * np.minimum(1, (1.6 - t0) / 0.5), 0.0, 'pad', 0.5)
sw = reverse_swell(lambda: sum(piano(midi(m), 1.2, 0.9) for m in [62, 66, 69, 74, 78]), 1.0)
place(sw, T_IMPACT - 1.0, 'fx', 0.5, hall=0.2)
place(riser(0.9, f0=200, f1=7000), T_IMPACT - 0.9, 'fx', 0.22)
place(boom(1.0, 3.0), T_IMPACT, 'hit', 0.9, hall=0.35)
place(braam(26, 2.6, 1.0, bright=3000), T_IMPACT, 'hit', 0.55, hall=0.3)
place(bell(midi(86), 2.5), T_IMPACT, 'keys', 0.12, pan=0.3, hall=0.6)
for m, pan in [(62, -0.3), (69, 0.3), (74, 0)]:
    place(piano(midi(m), 2.0, 0.85), T_IMPACT + 0.004, 'keys', 0.28, pan=pan, hall=0.5)

# —— 弦乐 / 超锯齿 Pad：整条贯穿，按段落开合 ——
pad = np.zeros((2, N))
for i, (s_, name) in enumerate(PROG):
    e_ = PROG[i + 1][0] if i + 1 < len(PROG) else DUR
    if s_ < 1.0:
        continue
    root, notes = CH[name]
    d = e_ - s_ + 0.35
    n = int(d * SR)
    t = np.arange(n) / SR
    sig = np.zeros((2, n))
    for k, m in enumerate(notes):
        sig += supersaw(midi(m), n, voices=7, detune=0.16, seed=100 + i * 10 + k) * 0.5
        sig += supersaw(midi(m - 12), n, voices=3, detune=0.1, seed=200 + i * 10 + k) * 0.25
    e = np.minimum(1, t / 0.08) * np.minimum(1, (d - t) / 0.3)
    i0 = int(s_ * SR)
    L = min(n, N - i0)
    pad[:, i0: i0 + L] += (sig * e)[:, :L]


def pad_cut(tc):
    tc = np.asarray(tc)
    c = np.full(tc.shape, 900.0)
    c = np.where(tc < T_XR, 900 + 700 * np.clip((tc - 1.0) / 2.4, 0, 1), c)
    c = np.where((tc >= T_XR) & (tc < T_GROOVE - 0.6), 700, c)
    c = np.where((tc >= T_GROOVE - 0.6) & (tc < T_GROOVE), 700 * (3200 / 700) ** ((tc - (T_GROOVE - 0.6)) / 0.6), c)
    c = np.where((tc >= T_GROOVE) & (tc < 9.9), 3200, c)
    c = np.where((tc >= 9.9) & (tc < T_RULES), 1500 * (9000 / 1500) ** np.clip((tc - 9.9) / (T_RULES - 9.9), 0, 1) ** 2, c)
    c = np.where(tc >= T_RULES, 4200, c)
    return c


pad = np.vstack([hp(stft_filter(pad[c], pad_cut, order=2, q=0.3), 110) for c in range(2)])
lvl = np.interp(np.arange(N) / SR, [0, 1.0, 1.4, T_XR, T_XR + 0.3, T_GROOVE, T_GROOVE + 0.1, T_RULES - 0.1, T_RULES, 13.95, 14.0, 15],
                [0, 0, 0.55, 0.6, 0.75, 0.8, 0.9, 1.0, 0.95, 0.95, 0, 0])
B['pad'] += pad * lvl * 0.3
SEND_HALL += pad * lvl * 0.3 * 0.35

# —— 苹果一章：合唱“啊” + braam；片尾 D 加九和弦 ——
place(choir([midi(m) for m in [62, 66, 69, 74]], 1.6, att=0.5), fr(504), 'pad', 0.55, hall=0.6)
place(braam(31, 2.0, 0.8, bright=2000, seed=9), fr(528), 'hit', 0.32, hall=0.3)
place(choir([midi(m) for m in [57, 61, 64, 69]], 1.2, att=0.3), fr(560), 'pad', 0.5, hall=0.6)

# —— 贝斯：八分音符，侧链 ——
GROOVE_ON = [(T_DEF, T_XR), (T_GROOVE, T_BUILD), (T_RULES, T_END)]


def in_any(t, spans):
    return any(a <= t < b for a, b in spans)


bass = np.zeros(N)
t8 = 0.0
while t8 < DUR:
    if in_any(t8 + 1e-6, GROOVE_ON):
        root = CH[chord_at(t8 + 0.01)][0]
        f = midi(root + 12)
        n = int(0.24 * SR)
        t = np.arange(n) / SR
        osc = saw(f, n) * 0.6 + np.sign(sine(f, n)) * 0.25
        v = lp(osc, 650, 2) + lp(osc, 2600, 2) * np.exp(-t / 0.035) * 0.6 + sine(f / 2, n) * 0.45
        v *= np.minimum(1, t / 0.004) * np.exp(-t / 0.16) * np.minimum(1, (0.24 - t) / 0.02)
        i0 = int(t8 * SR)
        bass[i0: i0 + n] += v[: N - i0]
    t8 += BEAT / 2
bass = lp(bass, 1100)
# X 光一段：长音贝斯
for s_, name in PROG:
    if T_XR - 0.1 <= s_ < T_GROOVE - 0.3 or (s_ < T_XR and s_ + 1 > T_XR):
        st_ = max(s_, T_XR)
        d = min(s_ + 1.0, T_GROOVE) - st_
        n = int(d * SR)
        t = np.arange(n) / SR
        v = sine(midi(CH[name][0]), n) * 0.7 + lp(saw(midi(CH[name][0] + 12), n), 300) * 0.25
        v *= np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.08)
        i0 = int(st_ * SR)
        bass[i0: i0 + n] += v[: N - i0] * 0.6
B['bass'][0] += bass * 0.42
B['bass'][1] += bass * 0.42

# —— 鼓 ——
KICKS = []
tb = T_DEF
while tb < T_END - 1e-6:
    full = in_any(tb + 1e-6, [(T_GROOVE, T_BUILD), (T_RULES, T_END)])
    soft = in_any(tb + 1e-6, [(T_DEF, T_XR)])
    if full or soft:
        place(kick(1.0 if full else 0.6, dec=0.3 if full else 0.22), tb, 'drum', 0.85 if full else 0.6)
        KICKS.append(tb)
    if full and (round(tb / BEAT) % 2 == 1):
        place(clap(), tb, 'drum', 0.42, room=0.6, hall=0.15)
    tb += BEAT
# 鼓组：十六分音符踩镲 / 反拍开镲
t16 = T_DEF
k = 0
while t16 < T_END - 1e-6:
    if in_any(t16 + 1e-6, [(T_DEF, T_XR), (T_GROOVE, T_BUILD), (T_RULES, T_END)]):
        accent = 1.0 if k % 2 == 0 else 0.55
        place(hat(0.5 * accent, 0.02), t16, 'drum', 0.5, pan=0.25 if k % 2 else -0.15, room=0.2)
        if k % 4 == 2 and t16 >= T_GROOVE:
            place(hat(0.7, 0.12), t16, 'drum', 0.32, pan=0.1, room=0.3)
    elif T_XR <= t16 < T_GROOVE - 0.4 and k % 2 == 0:
        place(hat(0.35, 0.012), t16, 'drum', 0.35, pan=0.4 * np.sin(k), hall=0.3)  # 时钟般的细碎高音
    t16 += BEAT / 4
    k += 1
# 攒劲：军鼓滚奏（越滚越密）+ 上扫 + 倒放镲片
tr = T_BUILD
while tr < T_RULES - 0.02:
    p = (tr - T_BUILD) / (T_RULES - T_BUILD)
    place(snare(0.35 + 0.65 * p), tr, 'drum', 0.7, room=0.4, hall=0.15)
    tr += BEAT / (2 if p < 0.4 else 4 if p < 0.75 else 8)
place(riser(T_RULES - 10.4, 1.0), 10.4, 'fx', 0.5, hall=0.2)
place(riser(T_GROOVE - T_REL, 0.8, 400, 8000), T_REL, 'fx', 0.22, hall=0.2)

# —— 侧链 ——
sc = np.ones(N)
tg = np.arange(int(0.3 * SR)) / SR
duck = 1 - 0.62 * np.exp(-tg / 0.09) * np.minimum(1, tg / 0.004 + 0.4)
for kt in KICKS:
    i0 = int(kt * SR)
    L = min(len(duck), N - i0)
    sc[i0: i0 + L] = np.minimum(sc[i0: i0 + L], duck[:L])
B['pad'] *= sc
B['bass'] *= sc

# —— 拨弦琶音（01 定义 & 04 数据）——
for a, b, lv, br in [(T_DEF, T_XR, 0.16, 1.0), (fr(414), fr(504), 0.22, 1.6), (fr(594), T_BUILD, 0.14, 1.2)]:
    t16 = a
    k = 0
    while t16 < b - 1e-6:
        notes = CH[chord_at(t16 + 0.01)][1]
        pat = [0, 1, 2, 3, 2, 1, 3, 2]
        m = notes[pat[k % 8] % len(notes)] + 12
        place(pluck(midi(m), 0.35, br), t16, 'keys', lv * (1.0 if k % 4 == 0 else 0.7), pan=0.5 * np.sin(k * 1.7), hall=0.25)
        t16 += BEAT / 4
        k += 1

# —— 钢琴：每一行字过线一个音（往上走）——
for f_, m in zip(DEF_AT and [90, 120, 150, 180], [78, 81, 83, 86]):
    place(piano(midi(m), 2.2, 0.8), fr(f_), 'keys', 0.3, pan=0.15, hall=0.55)
    place(piano(midi(m - 12), 2.2, 0.6), fr(f_), 'keys', 0.16, pan=-0.15, hall=0.55)
# X 光：再滚一遍 → 钢琴上行；舞台松开 → 低音一击
for k, m in enumerate([62, 66, 69, 74, 78]):
    place(piano(midi(m), 1.6, 0.7), T_FWD + k * 0.06, 'keys', 0.22, pan=-0.3 + k * 0.15, hall=0.6)
place(piano(midi(26), 3.0, 1.0) + piano(midi(38), 3.0, 0.8), T_REL, 'keys', 0.5, hall=0.6)
place(taiko(0.9), T_REL, 'hit', 0.5, hall=0.4)
# Snow Fall：风声 + 远处的钢琴
n = int((fr(420) - T_GROOVE + 0.6) * SR)
wind = RNG.standard_normal((2, n))
tw = np.arange(n) / SR
wcut = lambda tc: 500 + 400 * np.sin(2 * np.pi * 0.6 * tc) + 300 * np.sin(2 * np.pi * 1.3 * tc + 1)
wind = np.vstack([stft_filter(wind[c], wcut, order=1.0, mode='bp') for c in range(2)])
wind *= np.minimum(1, tw / 0.3) * np.minimum(1, (tw[-1] - tw) / 0.4)
place(wind, T_GROOVE - 0.2, 'fx', 0.12, hall=0.3)
for f_, m in [(345, 81), (372, 78), (396, 76), (404, 74)]:
    place(piano(midi(m), 2.5, 0.6, bright=0.7), fr(f_), 'keys', 0.26, pan=0.35, hall=0.9)
place(boom(0.7, 2.0), T_GROOVE, 'hit', 0.55, hall=0.3)
place(bell(midi(81), 2.0), T_GROOVE, 'keys', 0.08, hall=0.6)
# 数据：每一步一串快速上行的拨弦
for f_ in [438, 450, 480]:
    notes = CH[chord_at(fr(f_) + 0.01)][1]
    for k, m in enumerate(notes + [notes[0] + 12]):
        place(pluck(midi(m + 12), 0.5, 2.0), fr(f_) + k * 0.035, 'keys', 0.16, pan=-0.4 + k * 0.2, hall=0.4)
# 苹果：转一圈的每一下滑动一声低鼓
for f_ in [528, 540, 570]:
    place(taiko(0.8), fr(f_), 'hit', 0.5, hall=0.4)
# 06 四种排法：进章一声；四块面板 → 四声上行的钟
place(boom(0.5, 1.5), fr(594) + 0.25, 'hit', 0.35, hall=0.3)
for k, (f_, m) in enumerate(zip(PATTERNS_AT, [86, 90, 93, 98])):
    place(bell(midi(m), 1.8), fr(f_), 'keys', 0.14, pan=-0.45 + k * 0.3, hall=0.6)
# 07 规则：落地 + 每条规则点亮时一下铜管和弦 + 低鼓
place(boom(1.0, 2.5), T_RULES, 'hit', 0.85, hall=0.35)
place(braam(23, 1.6, 1.0, bright=2600, seed=21), T_RULES, 'hit', 0.4, hall=0.3)
for k, f_ in enumerate(RULES_AT):
    t_ = fr(f_)
    name = chord_at(t_ + 0.01)
    root, notes = CH[name]
    n = int(0.42 * SR)
    stab = np.zeros((2, n))
    for j, m in enumerate(notes):
        stab += supersaw(midi(m), n, voices=5, detune=0.14, seed=300 + k * 10 + j)
    tq = np.arange(n) / SR
    stab = np.vstack([stft_filter(stab[c], lambda tc: 600 + 5200 * np.exp(-np.maximum(tc, 0) / 0.08), order=2, q=0.4) for c in range(2)])
    stab *= np.minimum(1, tq / 0.004) * np.exp(-tq / 0.16)
    place(stab, t_, 'keys', 0.3, hall=0.35)
    place(taiko(0.9, 90 - k * 4, 50), t_, 'hit', 0.42, hall=0.35)
# 片尾：最后一击 + D 加九和弦
place(boom(1.0, 1.2), T_END, 'hit', 0.95, hall=0.4)
place(braam(26, 1.2, 1.0, bright=3400, seed=31), T_END, 'hit', 0.45, hall=0.35)
for m, pan in [(50, -0.2), (57, 0.2), (62, -0.1), (66, 0.25), (69, -0.3), (76, 0.3), (74, 0)]:
    place(piano(midi(m), 1.2, 0.9), T_END + 0.006, 'keys', 0.22, pan=pan, hall=0.6)
place(bell(midi(90), 1.2), T_END, 'keys', 0.1, hall=0.6)
place(riser(T_END - fr(846) + 0.1, 0.7, 500, 9000), fr(846) - 0.1, 'fx', 0.2)

# ═════════════ 混音：混响、磁带倒转、滚动空气声、母带 ═════════════
music = B['drum'] + B['bass'] + B['pad'] + B['keys'] + B['hit']
music[0] += conv(SEND_HALL[0], HALL[0]) * 0.55 + conv(SEND_ROOM[0], ROOM[0]) * 0.4
music[1] += conv(SEND_HALL[1], HALL[1]) * 0.55 + conv(SEND_ROOM[1], ROOM[1]) * 0.4


def tape(x, t0, t1, rate_fn):
    """在 [t0, t1) 里按 rate_fn 播放（1 = 正常，负数 = 倒放）；之后从 t1 原位接上"""
    i0, i1 = int(t0 * SR), int(t1 * SR)
    n = i1 - i0
    tl = np.arange(n) / SR
    pos = i0 + np.cumsum(rate_fn(tl / (t1 - t0)))
    pos = np.clip(pos, 0, N - 2)
    j = pos.astype(int)
    a = pos - j
    seg = x[:, j] * (1 - a) + x[:, j + 1] * a
    fade = np.minimum(1, np.minimum(tl, (t1 - t0) - tl) / 0.008)
    y = x.copy()
    y[:, i0:i1] = seg * fade + x[:, i0:i1] * 0 * fade
    return y


# 02 结构：倒着滚（音乐真的倒带）
music = tape(music, T_REW, T_REW + fr(26), lambda p: 1 - 3.6 * np.sin(np.pi * np.clip(p * 1.0, 0, 1)) ** 0.7)

# 滚动的空气声：响度和亮度都跟着 S(f) 的速度走
tA = np.arange(N) / SR
sp = np.interp(tA * 60 * FINE, np.arange(len(SPEED)), SPEED)
spn = np.clip(sp / 140, 0, 1.6)
air = RNG.standard_normal((2, N))
air = np.vstack([stft_filter(air[c], lambda tc: 600 + 5200 * np.clip(np.interp(tc * 60 * FINE, np.arange(len(SPEED)), SPEED) / 140, 0, 1.4), order=1.4, mode='bp') for c in range(2)])
air *= spn ** 0.9 * 0.05

# 母带：总线胶水压缩（RMS 包络）+ 软削波
mix = music + B['fx'] + air
mix[0] += conv(B['fx'][0] * 0.3, HALL[0]) * 0.4
mix[1] += conv(B['fx'][1] * 0.3, HALL[1]) * 0.4
# 低频搁架：60 Hz 以下收 4 dB；3–10 kHz 提一点“空气”
shelf = lambda f: hp_gain(28, 3)(f) * (0.5 + 0.5 / np.sqrt(1 + (70 / np.maximum(f, 1)) ** 4)) * (1 + 0.25 * bp_gain(6000, 2.0)(f))
mix = np.vstack([fft_filter(mix[0], shelf), fft_filter(mix[1], shelf)])
pw = (mix ** 2).mean(axis=0)
win = int(0.03 * SR)
rms = np.sqrt(np.convolve(pw, np.ones(win) / win, mode='same') + 1e-12)
ref = np.percentile(rms[int(2 * SR):int(13 * SR)], 75)
thr = ref * 0.7
gain = np.where(rms > thr, (thr / rms) ** (1 - 1 / 2.5), 1.0)
gain = np.convolve(gain, np.ones(int(0.01 * SR)) / int(0.01 * SR), mode='same')
mix *= gain
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.35) / np.tanh(1.35)
fade = np.ones(N)
fo = int(0.45 * SR)
fade[-fo:] = np.linspace(1, 0, fo) ** 1.5
mix *= fade * 0.95

out_dir = os.path.normpath(os.path.join(ROOT, '..', '..', '..', 'public', '03-scrollytelling'))
os.makedirs(out_dir, exist_ok=True)
raw = os.path.join(out_dir, 'music.raw.wav')
final = os.path.join(out_dir, 'music.wav')
with wave.open(raw, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(mix.T, -1, 1) * 32767).astype('<i2').tobytes())

if shutil.which('ffmpeg'):
    # 两遍 loudnorm：先量，再线性地拉到 -14 LUFS（不改动态）
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    js = json.loads(r.stderr[r.stderr.rindex('{'): r.stderr.rindex('}') + 1])
    af = ('loudnorm=I=-14:TP=-1.0:LRA=11:linear=true:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}').format(**js)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', raw, '-af', af, '-ar', str(SR), final], check=True)
    os.remove(raw)
else:
    os.replace(raw, final)
print('wrote', final)
