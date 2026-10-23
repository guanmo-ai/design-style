"""
Design Style · 布局 03 · Scrollytelling 滚动叙事 —— 配乐 v5（真乐器采样 × 代码编排）

v4 的配乐全是合成器，审片意见是“要能触动人心”。v5 换成真乐器：弦乐组（小提琴 / 中提琴 / 大提琴 / 低音提琴）、
立式钢琴、竖琴、钟琴、圆号、定音鼓、大鼓、吊镲、锣 —— 全部来自 VSCO 2 Community Edition（Versilian Studios，
CC0 公共领域，可自由使用，https://github.com/sgossner/VSCO-2-CE）。第一次运行时按需下载用到的那几十个文件到
.cache/vsco/（不进仓库）。编曲、混音、音效仍然全部是这份代码：每一个音在哪一帧响，都从 video/page.ts 读出来。

120 BPM（1 拍 = 30 帧 = 0.5 秒）· D 大调 · 15 秒。一条旋律贯穿全片：
  0–1s      开场：高音小提琴从无到有，钢琴两个弱起音 → 第 60 帧窗口落定：弦乐 D 大调铺开 + 竖琴上行
  1–5s      ① 并排：钢琴八分音符分解和弦；低音一步一步往下走（D → C# → B → G，卡农式）；
            每一步越过触发线 → 一个旋律音（F# → E → D → B），钟琴叠一个八度
  5–7s      X 光：弦乐换成颤弓（悬念）；三个半拍倒着滚 → 三个倒放的钢琴音被“吸”回去；一口气滚回来 → 竖琴上行刮奏
  7–9s      ② 覆盖：V → vi 的假终止落到 b 小调，最温柔的一段；旋律往上爬（F# → G → A → B）
  9–11.5s   ③ 逐帧：每拍一下大鼓，大提琴 / 小提琴跳弓八分音符推着走；每转一下 → 定音鼓 + 旋律再上一级
            （B → C# → D → E）；低音一路往上（E → G → A → B → C#）
  11.5–12.5 变手机：定音鼓滚奏、吊镲滚奏、颤弓一起渐强，憋到最高
  12.5s     过 768px 断点：全片最重的一击 —— 大鼓 + 定音鼓 + 锣 + 镲 + 圆号 + 全体弦乐，旋律到最高点 F#
  12.5–15s  旋律落下来（F# → E → D → E → F#），IV → I 的“阿门终止”，D 大调加九和弦长长的尾音
音效：每次滑动一声很轻的“咔哒”；滚动的风声按 Y(f) 的速度走；跨段快甩有倒放镲 + 落地重音。

用法：python3 layouts/03-scrollytelling/audio/make_music.py
输出：public/03-scrollytelling/music.wav（48 kHz 立体声，ffmpeg 两遍 loudnorm → -14 LUFS / -1 dBTP）
"""
import json
import os
import re
import shutil
import subprocess
import urllib.parse
import urllib.request
import wave

import numpy as np

SR = 48000
DUR = 15.0
N = int(SR * DUR)
RNG = np.random.default_rng(2026)
BEAT = 0.5


def tt(d):
    return np.arange(int(d * SR)) / SR


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ═════════════ 从 page.ts 读滚动曲线 ═════════════
ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.normpath(os.path.join(ROOT, '..', '..', '..'))
PAGE = open(os.path.join(ROOT, '..', 'video', 'page.ts'), encoding='utf-8').read()
BLOCK = PAGE[PAGE.index('export const FLICKS'):]
BLOCK = BLOCK[: BLOCK.index('];')]
FLICKS = [(int(a), float(b), int(c), (e or 'out')) for a, b, c, e in re.findall(r"\[(\d+),\s*(\d+),\s*(\d+)(?:,\s*'(\w+)')?\]", BLOCK)]
XRAY_IN = int(re.search(r'XRAY = \{in: (\d+)', PAGE).group(1))
XRAY_OUT = int(re.search(r'out: (\d+), outDur', PAGE).group(1))
M_AT, M_DUR = [int(v) for v in re.search(r'MORPH = \{at: (\d+), dur: (\d+)\}', PAGE).groups()]
STEP_FLICK_AT = [int(v) for v in re.findall(r'\[(\d+), \d, \d+\]', PAGE[PAGE.index('export const STEP_FLICKS'):])]


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


EASE = {'out': ease_of('out'), 'inOut': ease_of('inOut'), 'whip': ease_of('whip'), 'lin': lambda t: t}


def S(f):
    v = 0.0
    for at, to, d, e in FLICKS:
        if f < at:
            break
        v = v + (to - v) * EASE[e](min(1.0, (f - at) / d))
    return v


FINE = 4
SF = np.array([S(i / FINE) for i in range(900 * FINE + 1)])
SPEED = np.abs(np.gradient(SF)) * FINE  # px / 帧

# 每一步越过触发线（视口 50%）的帧：并排四步 + 覆盖三步（和 page.ts 的 CROSS 同一个算法）
CITY_LINES = [900 * (1.3 + 0.85 * i) - 450 for i in range(4)]
SNOW_LINES = [y - 450 for y in (5554, 6319, 7084)]


def first_cross(L, after=0):
    for i in range(int(after * FINE) + 1, len(SF)):
        if SF[i - 1] < L <= SF[i]:
            return i / FINE / 60
    return None


C_CITY = [first_cross(L) for L in CITY_LINES]
C_SNOW = [first_cross(L) for L in SNOW_LINES]


def eio(t):
    t = min(1.0, max(0.0, t))
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


# 窗口拉窄到 768px 以下的那一帧（规则 05 的那一下）
BREAK_AT = next(f for f in range(M_AT, M_AT + M_DUR) if round(1440 - 1050 * eio((f - M_AT) / M_DUR)) < 768)

# 关键时刻（秒）
sec = lambda f: f / 60.0
T_LAND = 1.0
OUTS = [sec(a) for a, _, _, e in FLICKS if e == 'out']
WHIPS = [(sec(a), sec(a + d)) for a, _, d, e in FLICKS if e == 'whip']
WHIP_ARR = [a + (b - a) * 0.72 for a, b in WHIPS]  # 快甩“到了”的那一刻（≈ 拍点）
SIDE = [sec(a) for a, _, _, e in FLICKS if a < XRAY_IN]
BACK = [sec(a) for a, to, _, e in FLICKS if XRAY_IN <= a < XRAY_OUT and e == 'out']
FWD = [sec(a) for a, _, _, e in FLICKS if XRAY_IN <= a < XRAY_OUT + 40 and e == 'inOut'][0]
SNOW_F = [sec(a) for a, to, _, e in FLICKS if e == 'out' and 5000 < to < 8000]
TURNS = [sec(a) for a, to, _, e in FLICKS if e == 'out' and to > 9000]
T_XIN = sec(XRAY_IN)
T_BREAK = sec(BREAK_AT)
T_PH = [sec(f) for f in STEP_FLICK_AT]
print('滑动', OUTS, '\n快甩', WHIPS, '\n过线', C_CITY, C_SNOW, '\n断点', T_BREAK, '手机', T_PH)


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
BUSES = ['str', 'keys', 'mel', 'perc', 'low', 'fx']
B = {k: np.zeros((2, N), dtype=np.float32) for k in BUSES}
SEND_HALL = np.zeros((2, N), dtype=np.float32)
SEND_ROOM = np.zeros((2, N), dtype=np.float32)


def db(v):
    return 10 ** (v / 20)


def place(sig, t, b='keys', gain=1.0, pan=0.0, hall=0.0, room=0.0):
    i = int(round(t * SR))
    if sig.ndim == 1:
        sig = np.vstack([sig, sig])
    if i < 0:
        sig = sig[:, -i:]
        i = 0
    if i >= N or sig.shape[1] == 0:
        return
    sig = sig[:, : N - i]
    L = sig.shape[1]
    # 等功率声像；立体声采样只做“偏移”，不压成单声道
    gl = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2) * gain
    gr = np.sin((pan + 1) * np.pi / 4) * np.sqrt(2) * gain
    seg = np.vstack([sig[0] * gl, sig[1] * gr]).astype(np.float32)
    B[b][:, i: i + L] += seg
    if hall:
        SEND_HALL[:, i: i + L] += seg * hall
    if room:
        SEND_ROOM[:, i: i + L] += seg * room


# ═════════════ 振荡器与合成音效（只用在“音效”上：低频冲击、风声、咔哒）═════════════
def sine(freq, n, phase0=0.0):
    freq = np.broadcast_to(np.asarray(freq, dtype=float), (n,))
    return np.sin(2 * np.pi * (phase0 + np.cumsum(freq / SR)))


def sub_boom(level=1.0, dur=2.4, f_hi=70, f_lo=34):
    """次低频下坠：给真鼓垫一层电影感的“地面”"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f_lo + (f_hi - f_lo) * np.exp(-t / 0.16)
    return np.tanh(sine(f, n) * np.exp(-t / 0.55) * np.minimum(1, t / 0.004) * 1.3) * level


def tick(level=1.0, f0=3400):
    """触控板“咔哒”：2 ms 的噪声脉冲 + 一个很短的高音"""
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    click = hp(RNG.standard_normal(n), 2500, 2) * np.exp(-t / 0.0012)
    ping = np.sin(2 * np.pi * f0 * t) * np.exp(-t / 0.006) * 0.5
    return (click * 0.6 + ping) * level


def noise_riser(dur, level=1.0, f0=400, f1=9000, curve=2.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = RNG.standard_normal((2, n))
    cut = lambda tc: f0 * (f1 / f0) ** np.clip(tc / dur, 0, 1) ** 1.4
    y = np.vstack([stft_filter(x[c], cut, order=1.3, mode='bp') for c in range(2)])
    return y * (t / dur) ** curve * level


def whoosh(dur=0.42, level=1.0, peak=0.7):
    """快甩的风声：先涨后落，滤波跟着扫上去再落下来"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    p = t / dur
    env = np.where(p < peak, (p / peak) ** 2.2, np.exp(-(p - peak) / 0.12))
    x = RNG.standard_normal((2, n))
    cut = lambda tc: 500 + 5500 * np.interp(tc / dur, [0, peak, 1], [0, 1, 0.3])
    y = np.vstack([stft_filter(x[c], cut, order=1.6, mode='bp') for c in range(2)])
    return y * env * level


# ═════════════ 采样器：VSCO 2 CE（CC0）═════════════
VSCO = os.environ.get('VSCO_DIR', os.path.join(REPO, '.cache', 'vsco'))
VSCO_URL = 'https://raw.githubusercontent.com/sgossner/VSCO-2-CE/master/'
PC = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11}


def nn(s):
    m = re.match(r'([A-G]#?)(-?\d)$', s)
    return (int(m.group(2)) + 1) * 12 + PC[m.group(1)]


def fetch(rel):
    p = os.path.join(VSCO, rel)
    if not os.path.exists(p):
        os.makedirs(os.path.dirname(p), exist_ok=True)
        print('  下载', rel)
        urllib.request.urlretrieve(VSCO_URL + urllib.parse.quote(rel), p + '.part')
        os.replace(p + '.part', p)
    return p


_WAV = {}


def wav(rel, norm='rms'):
    """读 16/24 位 wav → float32 立体声；去掉开头静音；按 RMS（持续音）或峰值（打击）归一"""
    if rel in _WAV:
        return _WAV[rel]
    w = wave.open(fetch(rel))
    sr, n, ch, sw = w.getframerate(), w.getnframes(), w.getnchannels(), w.getsampwidth()
    raw = w.readframes(n)
    if sw == 2:
        x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    elif sw == 3:
        b = np.frombuffer(raw, np.uint8).reshape(-1, 3).astype(np.int32)
        v = b[:, 0] | (b[:, 1] << 8) | (b[:, 2] << 16)
        x = (np.where(v >= 1 << 23, v - (1 << 24), v)).astype(np.float32) / (1 << 23)
    else:
        x = np.frombuffer(raw, np.int32).astype(np.float32) / 2 ** 31
    x = x.reshape(-1, ch).T
    if ch == 1:
        x = np.vstack([x, x])
    x = x[:2]
    a = np.abs(x).max(axis=0)
    on = int(np.argmax(a > a.max() * 10 ** (-48 / 20)))
    x = x[:, max(0, on - int(0.002 * sr)):]
    if norm == 'rms':
        seg = x[:, : int(1.5 * sr)]
        x = x / (np.sqrt((seg ** 2).mean()) + 1e-9) * db(-20)
    else:
        x = x / (np.abs(x).max() + 1e-9) * db(-3)
    _WAV[rel] = (x.astype(np.float32), sr)
    return _WAV[rel]


def render(rel, shift=0.0, dur=None, rel_t=0.3, att=0.0, offset=0.0, norm='rms'):
    """按半音移调（线性插值重采样到 48 kHz）；dur = 按住多久（之后 rel_t 秒余弦释放）"""
    x, sr = wav(rel, norm)
    ratio = 2 ** (shift / 12) * sr / SR
    ns = x.shape[1]
    o = int(offset * sr)
    avail = int((ns - 2 - o) / ratio)
    L = avail if dur is None else min(avail, int((dur + rel_t) * SR))
    pos = o + np.arange(L) * ratio
    i = pos.astype(np.int64)
    a = (pos - i).astype(np.float32)
    y = x[:, i] * (1 - a) + x[:, i + 1] * a
    t = np.arange(L) / SR
    env = np.ones(L, dtype=np.float32)
    if att > 0:
        env *= np.sin(np.clip(t / att, 0, 1) * np.pi / 2) ** 2
    if dur is not None:
        g = np.clip((t - dur) / max(rel_t, 1e-3), 0, 1)
        env *= np.cos(g * np.pi / 2) ** 2
    env[-min(L, 240):] *= np.linspace(1, 0, min(L, 240))
    return y * env


class Inst:
    """一件乐器：若干个采样根音（MIDI）× 力度层；弹某个音时挑最近的根音再移调"""

    def __init__(self, name, files, octave=0):
        self.name = name
        self.map = {}  # midi → [(layer, rel)]，layer 从弱到强
        for root, layer, rel in files:
            self.map.setdefault(nn(root) + octave if isinstance(root, str) else root, []).append((layer, rel))
        for k in self.map:
            self.map[k].sort()
        self.roots = np.array(sorted(self.map))

    def pick(self, m, vel):
        r = int(self.roots[np.argmin(np.abs(self.roots - m + 0.1))])
        lay = self.map[r]
        idx = min(len(lay) - 1, int(vel * len(lay))) if len(lay) > 1 else 0
        return lay[idx][1], m - r

    def play(self, m, t, dur=None, vel=0.7, b='str', gain_db=0.0, pan=0.0, hall=0.25, room=0.0, att=0.0, rel=0.35, offset=0.0, rev=False):
        rel_path, shift = self.pick(m, vel)
        y = render(rel_path, shift, dur, rel, att, offset)
        g = db(gain_db) * (0.35 + 0.65 * vel) ** 1.6
        if rev:
            # 倒放：先加大混响再倒过来，从无到有地“吸”进 t 这一刻
            wet = np.vstack([conv(np.concatenate([y[c], np.zeros(int(1.2 * SR))]), HALL[c]) for c in range(2)])
            y = (wet * 0.8 + np.pad(y, ((0, 0), (0, int(1.2 * SR)))) * 0.5)[:, ::-1]
            place(y, t - y.shape[1] / SR, b, g, pan, hall * 0.3, room)
            return
        place(y, t, b, g, pan, hall, room)


def files(fmt, notes, layers):
    return [(n, L, fmt.format(n=n, L=L)) for n in notes.split() for L in layers]


PIANO = Inst('piano', [(21 + 2 * i, L, f'Keys/Upright Piano/Player_dyn{L}_rr1_{i:03d}.wav') for i in range(6, 41, 2) for L in (1, 2)])
VLN = Inst('vln', files('Strings/Violin Section/susVib/VlnEns_susVib_{n}_v{L}.wav', 'A2 A3 B2 B4 C4 D3 D5 E4 F#3 G2 G4', (1, 2)), 12)
VLA = Inst('vla', files('Strings/Viola Section/susvib/ViolaEns_susvib_{n}_v{L}_1.wav', 'A3 B2 B4 C2 C4 D2 D3 D5 E2 E4 F3 G2 G4', (1, 2)), 12)
VC = Inst('vc', files('Strings/Cello Section/susvib/susvib_{n}_v{L}_1.wav', 'A2 B1 B3 C1 C3 D2 D4 E1 E3 F2 F4 G1 G3', (1, 3)), 12)
CB = Inst('cb', files('Strings/Solo Contrabass/SusNV/BKCtbss_SusNV_{n}_v{L}_rr1.wav', 'A#0 A1 C#2 C1 D1 E0 E1 E2 F#0 F#1 G#1 G0', (1,)), 12)
VLN_TR = Inst('vln_trem', files('Strings/Violin Section/Trem/VlnEns_Trem_{n}_v{L}.wav', 'A2 A3 B2 B4 C4 D3 D5 E4 G2 G4', (1, 2)), 12)
VC_TR = Inst('vc_trem', files('Strings/Cello Section/trem/trem_{n}_v{L}_1.wav', 'A2 B3 C3 D2 D4 E1 E3 F2 F4 G1 G3', (1, 2)), 12)
VLN_SP = Inst('vln_spic', files('Strings/Violin Section/Spic/VlnEns_Spic_{n}_v{L}_rr1.wav', 'A2 A3 B2 B4 C4 D3 D5 E4 F#3 G2 G4', (1, 2)), 12)
VC_SP = Inst('vc_spic', files('Strings/Cello Section/spic/spic_{n}_v{L}_RR1.wav', 'A2 B1 B3 C1 C3 D2 D4 E1 E3 F2 F4 G1 G3', (1, 2)), 12)
HORN = Inst('horn', files('Brass/F Horn/sus/MOHorn_sus_{n}_v{L}_1.wav', 'A#1 A2 C1 C3 D#1 D2 F2 G1', (1, 2, 3)), 12)
HARP = Inst('harp', [(n.split('_')[0], 1, f'Strings/Harp/KSHarp_{n}.wav') for n in 'A2_mf A4_mf A6_mf B1_mf B3_mf B5_mf B6_mf C3_mf C5_mf D2_mf D4_mf D6_mf D7_f E1_f E3_mf E5_mf F2_mf F4_mf F6_mf F7_f G1_mp G3_mf G5_mf'.split()])
GLOCK = Inst('glock', [(n, 1, f'Percussion/Glock/glock_medium_{n}.wav') for n in 'C5 C6 C7 G4 G5 G6'.split()], 12)

P = 'VSCO 1 Percussion/'
TIMP = 'Percussion/Timpani/Timpani1_Hit_v{L}_rr{R}_Sum.wav'  # 鼓 1 的音高 ≈ 89.7 Hz（F2 低 0.54 个半音）
TIMP_F0 = 41.46
TIMP_ROLL = 'Percussion/Timpani/Rolls/Timpani1_Roll_v5_rr1_Sum.wav'
CYM_CRESC = P + 'varMetal/Cymbals/susp/susp_hit_softmall_roll2_cresc.wav'
CYM_HIT = P + 'varMetal/Cymbals/susp/susp_hit_hardmall_f.wav'
CYM_SOFT = P + 'varMetal/Cymbals/susp/susp_hit_softmall_ff.wav'
GONG = P + 'varMetal/Gong/gong_hit_ff.wav'
GONG_MF = P + 'varMetal/Gong/gong_hit_mf.wav'
BD = {k: P + f'drums/bass/{k}.wav' for k in ['bdrum_fff_1', 'bdrum_ff_1', 'bdrum_f_1', 'bdrum_mp_1', 'bdrum_muted_ff_1', 'bdrum_muted_mf_1', 'bdrum_muted_mp_1']}


def hit(rel, t, gain_db=0.0, b='perc', pan=0.0, hall=0.15, room=0.2, shift=0.0, dur=None, rel_t=0.4, rev=False):
    y = render(rel, shift, dur, rel_t, norm='peak')
    if rev:
        wet = np.vstack([conv(np.concatenate([y[c], np.zeros(int(1.0 * SR))]), HALL[c]) for c in range(2)])
        y = (wet * 0.7 + np.pad(y, ((0, 0), (0, int(1.0 * SR)))))[:, ::-1]
        place(y, t - y.shape[1] / SR, b, db(gain_db), pan, 0, 0)
        return
    place(y, t, b, db(gain_db), pan, hall, room)


def timp(m, t, gain_db=0.0, loud=True, rr=1, dur=None):
    rel = TIMP.format(L=3 if loud else 1, R=rr)
    hit(rel, t, gain_db, shift=m - TIMP_F0, hall=0.25, room=0.15, dur=dur)


# ═════════════ 和声 ═════════════
# 每个和弦的配器：低音提琴 / 大提琴两音 / 中提琴两音 / 小提琴两音（MIDI）
V = {
    'Dsus2': (None, (), (), (76, 81)),
    'D': (38, (50, 57), (62, 66), (69, 74)),
    'A/C#': (37, (45, 52), (61, 64), (69, 73)),
    'Bm': (35, (47, 54), (62, 66), (71, 74)),
    'G': (31, (43, 50), (59, 62), (67, 71)),
    'Em7': (40, (47, 52), (55, 62), (67, 71)),
    'Asus4': (33, (45, 52), (62, 64), (69, 74)),
    'A': (33, (45, 52), (61, 64), (69, 73)),
    'D/F#': (42, (50, 57), (62, 66), (69, 74)),
    'Gmaj7': (31, (43, 50), (59, 66), (71, 74)),
    'Dadd9': (38, (50, 57), (64, 66), (69, 76)),
}
# 分解和弦用的音（钢琴）
ARP = {
    'D': [50, 57, 62, 66, 69, 66, 62, 57], 'A/C#': [49, 57, 61, 64, 69, 64, 61, 57], 'Bm': [47, 54, 59, 62, 66, 62, 59, 54],
    'G': [43, 50, 55, 59, 62, 59, 55, 50], 'Em7': [40, 47, 52, 55, 62, 55, 52, 47], 'A': [45, 52, 57, 61, 64, 61, 57, 52],
    'Asus4': [45, 52, 57, 62, 64, 62, 57, 52], 'D/F#': [42, 50, 54, 57, 62, 57, 54, 50], 'Gmaj7': [43, 50, 54, 59, 62, 59, 54, 50],
    'Dadd9': [38, 50, 57, 64, 66, 69, 74, 76],
}

# 和弦进行：时间点全部来自 page.ts 的滑动表（换和弦 = 画面里换一步）
X_END = sec(XRAY_OUT)
CHORDS = [
    (0.0, 'Dsus2', 0.22),
    (T_LAND, 'D', 0.42),
    (SIDE[1], 'A/C#', 0.45),
    (SIDE[2], 'Bm', 0.47),
    (SIDE[3], 'G', 0.5),
    (T_XIN, 'Em7', 0.38),
    (FWD, 'Asus4', 0.46),
    (WHIPS[0][0], 'A', 0.55),
    (WHIP_ARR[0], 'Bm', 0.5),     # V → vi：假终止，落到 b 小调（最温柔的一段）
    (SNOW_F[0], 'G', 0.52),
    (SNOW_F[1], 'D/F#', 0.56),
    (WHIP_ARR[1], 'Em7', 0.62),
    (TURNS[0], 'G', 0.68),
    (TURNS[1], 'A', 0.74),
    (TURNS[2], 'Bm', 0.8),
    (TURNS[2] + 0.75, 'A/C#', 0.84),  # 低音 E → G → A → B → C# 一路往上，顶到断点的 D
    (WHIP_ARR[2], 'Asus4', 0.5),
    (T_BREAK, 'D', 1.0),
    (T_PH[0], 'Gmaj7', 0.78),      # IV → I：阿门终止
    (T_PH[1], 'Dadd9', 0.72),
]
CH_T = [c[0] for c in CHORDS]


def chord_at(t):
    i = max(0, int(np.searchsorted(CH_T, t, side='right')) - 1)
    return CHORDS[i][1]


def strings(name, t0, t1, I, trem=False, hi=False, att=0.08, rel=0.45):
    cb, vc, vla, vln = V[name]
    d = t1 - t0
    vel = 0.25 + 0.7 * I
    vlnI, vcI = (VLN_TR, VC_TR) if trem else (VLN, VC)
    if cb is not None:
        CB.play(cb, t0, d, vel, 'low', -6, 0.0, 0.18, att=att, rel=rel)
        if I > 0.75:
            CB.play(cb + 12, t0, d, vel, 'low', -9, 0.1, 0.2, att=att, rel=rel)
    for k, m in enumerate(vc):
        vcI.play(m, t0, d, vel, 'str', -7 - 2 * k, 0.45, 0.32, att=att, rel=rel)
    for k, m in enumerate(vla):
        VLA.play(m, t0, d, vel, 'str', -9 - k, 0.12, 0.35, att=att, rel=rel)
    for k, m in enumerate(vln):
        vlnI.play(m, t0, d, vel, 'str', -8 - k, -0.4 + 0.15 * k, 0.4, att=att, rel=rel)
    if hi:
        VLN.play(vln[-1] + 12 if vln[-1] + 12 <= 90 else vln[-1], t0, d, vel, 'str', -10, -0.55, 0.5, att=att, rel=rel)


# ── 弦乐铺底（开场从无到有；X 光换颤弓；断点之后全体 + 高八度）──
for k, (t0, name, I) in enumerate(CHORDS):
    t1 = CHORDS[k + 1][0] if k + 1 < len(CHORDS) else DUR
    if k == len(CHORDS) - 1:
        t1 = DUR - 0.2
    trem = T_XIN <= t0 < FWD or (WHIP_ARR[2] <= t0 < T_BREAK)
    hi = t0 >= T_BREAK or (TURNS[1] <= t0 < T_BREAK)
    att = 0.85 if k == 0 else (0.05 if t0 >= WHIP_ARR[1] else 0.1)
    strings(name, t0, t1, I, trem=trem, hi=hi, att=att, rel=0.5 if k < len(CHORDS) - 1 else 1.2)

# 变手机那一秒：颤弓渐强（大提琴 + 小提琴，A 的属音持续），憋到断点
for m, inst, g, pan in [(57, VC_TR, 5, 0.4), (69, VLN_TR, 4, -0.4), (76, VLN_TR, 1, -0.2), (81, VLN_TR, -2, -0.55), (45, VC_TR, 2, 0.5)]:
    y = render(inst.pick(m, 0.95)[0], inst.pick(m, 0.95)[1], T_BREAK - WHIP_ARR[2], 0.08)
    e = np.linspace(0.08, 1, y.shape[1]) ** 1.7
    place(y * e, WHIP_ARR[2], 'str', db(g), pan, 0.35)

# ── 钢琴：分解和弦 ──
def arp(t0, t1, step=0.25, vel=0.32, octave=0, every=1, gain=-16, hall=0.3, jitter=0.006):
    t = t0
    k = 0
    while t < t1 - 1e-6:
        name = chord_at(t + 1e-4)
        pat = ARP.get(name, ARP['D'])
        if k % every == 0:
            m = pat[k % len(pat)] + octave
            v = vel * (1.0 if k % 4 == 0 else 0.82) * (1 + RNG.uniform(-0.06, 0.06))
            PIANO.play(m, t + RNG.uniform(-jitter, jitter), 0.6, v, 'keys', gain, 0.15 * np.sin(k), hall)
        k += 1
        t += step


arp(SIDE[0], T_XIN, 0.25, 0.36, gain=-8)                     # ① 八分音符，轻轻的脉动
arp(WHIP_ARR[0], WHIPS[1][0], 0.5, 0.32, 12, gain=-9)       # ② 高音区四分音符，像落雪
arp(WHIP_ARR[1], WHIPS[2][0], 0.25, 0.45, 0, gain=-9)  # ③ 推着走
arp(T_BREAK, T_PH[1], 0.25, 0.5, 0, gain=-10)    # 断点之后
for k, m in enumerate([38, 50, 57, 64, 66, 69, 74, 76, 81]):  # 片尾：慢慢往上散开
    PIANO.play(m, T_PH[1] + 0.03 + k * 0.085, 1.6, 0.38 - k * 0.015, 'keys', -14, -0.3 + 0.08 * k, 0.45)

# ── 旋律：一条线贯穿全片（钢琴主奏 + 钟琴高八度点缀；断点之后小提琴唱）──
MEL = []
MEL += [(0.5, 69, 0.5, 0.35), (0.75, 74, 0.25, 0.38)]                                     # 弱起
MEL += [(C_CITY[i], m, 0.9, 0.55) for i, m in enumerate([78, 76, 74, 71])]                 # ① F# E D B（过线才响）
MEL += [(WHIP_ARR[0], 78, 0.5, 0.5), (SNOW_F[0], 79, 0.5, 0.52), (SNOW_F[1], 81, 0.5, 0.55), (SNOW_F[1] + 0.5, 83, 0.25, 0.45)]  # ② F# G A B
MEL += [(WHIP_ARR[1], 83, 0.5, 0.55), (TURNS[0], 85, 0.5, 0.58), (TURNS[1], 86, 0.5, 0.62), (TURNS[2], 88, 0.7, 0.66)]  # ③ B C# D E
for t, m, d, v in MEL:
    PIANO.play(m, t, d, v, 'mel', -3, -0.05, 0.38)
    GLOCK.play(m + 12 if m + 12 <= 103 else m, t, None, 0.6, 'mel', -15, 0.25, 0.45)

# 断点之后：小提琴唱出主题的最高点再落下来（F# → E → D → E → F#），钢琴高八度、圆号垫底
CLIMAX = [(T_BREAK, 78, 0.5), (T_BREAK + 0.5, 76, 0.25), (T_PH[0], 74, 0.5), (T_PH[0] + 0.5, 76, 0.25), (T_PH[1], 78, DUR - T_PH[1] - 0.3)]
for k, (t, m, d) in enumerate(CLIMAX):
    VLN.play(m, t, d, 0.95, 'mel', 0, -0.2, 0.45, att=0.03, rel=0.35)
    VLN.play(m - 12, t, d, 0.8, 'mel', -8, -0.45, 0.45, att=0.03, rel=0.35)
    PIANO.play(m + 12, t, max(d, 0.6), 0.6, 'mel', -8, 0.1, 0.4)
    if k in (0, 4):
        GLOCK.play(m + 12, t, None, 0.7, 'mel', -16, 0.3, 0.5)
for t0, t1, notes, v in [(T_BREAK, T_PH[0], (50, 54, 57), 0.9), (T_PH[0], T_PH[1], (50, 55, 59), 0.75), (T_PH[1], DUR - 0.3, (50, 54, 57), 0.6)]:
    for k, m in enumerate(notes):
        HORN.play(m, t0, t1 - t0, v, 'str', -9 - k, 0.25 - 0.2 * k, 0.45, att=0.04, rel=0.5)

# ── 竖琴：落定、往回滚完那一下、片尾，各一道刮奏 ──
D_MAJ = [2, 4, 6, 7, 9, 11, 13]


def gliss(t, lo, hi, dur, vel=0.6, gain=-12, up=True):
    notes = [m for m in range(lo, hi + 1) if (m % 12) in (2, 4, 6, 7, 9, 11, 1)]
    if not up:
        notes = notes[::-1]
    for k, m in enumerate(notes):
        p = k / max(1, len(notes) - 1)
        HARP.play(m, t + dur * p ** 1.15, None, vel, 'keys', gain - 4 * (1 - p) * (1 if up else 0), -0.5 + p, 0.45)


gliss(T_LAND, 50, 86, 0.34, 0.55, -13)
gliss(FWD, 50, 81, 0.36, 0.6, -12)
gliss(T_PH[1], 62, 93, 0.5, 0.5, -15)
gliss(WHIP_ARR[0] - 0.02, 62, 86, 0.22, 0.4, -18, up=False)  # 落进雪山：往下撒一把

# ── X 光：三个半拍倒着滚 → 三个倒放的钢琴音被“吸”回去 ──
for t, m in zip(BACK, [86, 83, 79]):
    PIANO.play(m, t + 0.012, 1.0, 0.6, 'keys', -9, 0.3, 0.2, rev=True)
    PIANO.play(m - 12, t, 0.3, 0.35, 'keys', -18, -0.2, 0.3)

# ═════════════ 打击乐 ═════════════
# 窗口落定：定音鼓 + 大鼓 + 低频，镲从倒放里涌上来
hit(CYM_SOFT, T_LAND, -9, rev=True)
timp(38, T_LAND, -4)
hit(BD['bdrum_ff_1'], T_LAND, -6)
place(sub_boom(0.8, 1.4), T_LAND, 'low', db(-16))

# ① 每一步：大鼓轻轻一下（心跳）
for t in SIDE:
    hit(BD['bdrum_muted_mp_1'], t, -12)
# X 光：镜头斜过来 —— 锣轻敲 + 低频下坠
hit(GONG_MF, T_XIN, -14)
place(sub_boom(0.7, 1.2, 60, 36), T_XIN, 'low', db(-20))
timp(40, T_XIN, -9, loud=False)
# 三个快甩：倒放镲涌上来，到达那一拍 定音鼓 + 大鼓 + 低频
for k, ((a, b), arr) in enumerate(zip(WHIPS, WHIP_ARR)):
    hit(CYM_SOFT if k < 2 else CYM_HIT, arr, -11, rev=True)
    place(whoosh(b - a + 0.1, 1.0, 0.68), a, 'fx', db(-16))
    timp([42, 40, 45][k], arr, -5, rr=1 + k % 2)  # F#2 / E2 / A2：落在和弦里
    hit(BD['bdrum_ff_1'], arr, -7)
# ② 两张卡片
for t in SNOW_F:
    hit(BD['bdrum_muted_mf_1'], t, -11)
    hit(CYM_SOFT, t, -24)
# ③ 每拍一下大鼓；每转一下定音鼓
t = WHIP_ARR[1]
k = 0
while t < WHIPS[2][0] - 0.01:
    hit(BD['bdrum_muted_ff_1'], t, -7 if k % 2 == 0 else -9)
    if k % 2 == 1:
        hit(BD['bdrum_muted_mp_1'], t + 0.25, -16)
    t += 0.5
    k += 1
for k, (t, m) in enumerate(zip(TURNS, [43, 45, 42])):  # G2 / A2 / F#2
    timp(m, t, -6, rr=1 + k % 2)
# ③ 跳弓八分音符：大提琴根音 + 小提琴和弦音
t = WHIP_ARR[1]
k = 0
while t < WHIPS[2][0] - 0.01:
    name = chord_at(t + 1e-4)
    cb, vc, vla, vln = V[name]
    VC_SP.play(vc[0], t, None, 0.75 if k % 2 == 0 else 0.55, 'str', -6, 0.4, 0.2)
    VLN_SP.play(vln[(k // 2) % 2] + (12 if k % 4 == 3 else 0), t + 0.003, None, 0.6 if k % 2 == 0 else 0.45, 'str', -9, -0.4, 0.25)
    t += 0.25
    k += 1

# 变手机那一秒：定音鼓滚奏 + 吊镲滚奏渐强，到断点最响
roll_d = T_BREAK - WHIP_ARR[2]
y = render(TIMP_ROLL, 45 - TIMP_F0, roll_d, 0.05, norm='peak')  # A2：属音
place(y * np.linspace(0.05, 1, y.shape[1]) ** 1.8, WHIP_ARR[2], 'perc', db(0), 0.0, 0.2, 0.1)
cx, csr = wav(CYM_CRESC, 'peak')
env = np.convolve(np.abs(cx).max(0), np.ones(2000) / 2000, mode='same')
pk = int(np.argmax(env)) / csr
hit(CYM_CRESC, T_BREAK - pk, -2, dur=pk + 0.05, rel_t=0.05)
place(noise_riser(roll_d + 0.2, 1.0, 300, 8000, 2.4), T_BREAK - roll_d - 0.2, 'fx', db(-19))

# 断点：全片最重的一击
hit(BD['bdrum_fff_1'], T_BREAK, -2)
hit(BD['bdrum_ff_1'], T_BREAK + 0.003, -6)
timp(38, T_BREAK, -1)
timp(38, T_BREAK + 0.004, -6, rr=2)
hit(GONG, T_BREAK, -7)
hit(CYM_HIT, T_BREAK, -7)
place(sub_boom(1.0, 2.2, 80, 34), T_BREAK, 'low', db(-9))
place(tick(1.0, 5200), T_BREAK - 0.004, 'fx', db(-12))
# 断点之后：每拍一下大鼓，直到最后一下
t = T_BREAK + 0.5
while t < T_PH[1] - 0.01:
    hit(BD['bdrum_muted_ff_1'], t, -9)
    t += 0.5
# 手机里两下
hit(BD['bdrum_f_1'], T_PH[0], -8)
timp(43, T_PH[0], -8)
# 最后一下：温暖的落地（定音鼓 D + 大鼓 + 锣轻 + 镲轻）
timp(38, T_PH[1], -3)
hit(BD['bdrum_ff_1'], T_PH[1], -6)
hit(GONG_MF, T_PH[1], -12)
hit(CYM_SOFT, T_PH[1], -15)
place(sub_boom(0.7, 1.6, 70, 38), T_PH[1], 'low', db(-18))

# ═════════════ 音效：咔哒 ═════════════
for t in OUTS + T_PH:
    place(tick(1.0), t, 'fx', db(-27))
for t in [c for c in C_CITY + C_SNOW if c]:
    place(tick(1.0, 2600), t, 'fx', db(-30))


# ═════════════ 混音：混响、滚动风声、母带 ═════════════
print('混音…')
music = B['str'] + B['keys'] + B['mel'] + B['perc'] + B['low']
for c in range(2):
    music[c] += conv(SEND_HALL[c], HALL[c]) * 0.5 + conv(SEND_ROOM[c], ROOM[c]) * 0.35

# 滚动的风声：响度和亮度都跟着 Y(f) 的速度走（很轻，只是“手感”）
tA = np.arange(N) / SR
sp = np.interp(tA * 60 * FINE, np.arange(len(SPEED)), SPEED)
spn = np.clip(sp / 160, 0, 1.4)
air = RNG.standard_normal((2, N))
air = np.vstack([stft_filter(air[c], lambda tc: 500 + 4200 * np.clip(np.interp(tc * 60 * FINE, np.arange(len(SPEED)), SPEED) / 160, 0, 1.3), order=1.5, mode='bp') for c in range(2)])
air *= spn ** 1.1 * 0.025

mix = music + B['fx'] + air
# 断点前 0.1 秒“抽空”：所有声音一下子收掉，那一击才显得更重
gap = np.ones(N)
g0, g1 = int((T_BREAK - 0.11) * SR), int((T_BREAK - 0.004) * SR)
gap[g0:g1] = np.interp(np.arange(g0, g1), [g0, g0 + int(0.03 * SR), g1 - int(0.004 * SR), g1], [1, 0.22, 0.22, 1])
mix *= gap
for c in range(2):
    mix[c] += conv(B['fx'][c] * 0.25, HALL[c]) * 0.35
# 低切 25 Hz；120 Hz 附近收一点浑；10 kHz 以上加一点“空气”
eq = lambda f: hp_gain(25, 3)(f) * (1 - 0.18 * bp_gain(220, 1.2)(f)) * (1 + 0.18 * hp_gain(9000, 1)(f))
mix = np.vstack([fft_filter(mix[0], eq), fft_filter(mix[1], eq)])
# 总线胶水压缩（RMS 包络，2:1，慢起快放）+ 软削波
pw = (mix ** 2).mean(axis=0)
win = int(0.05 * SR)
rms = np.sqrt(np.convolve(pw, np.ones(win) / win, mode='same') + 1e-12)
ref = np.percentile(rms[int(1 * SR):int(14 * SR)], 80)
thr = ref * 0.8
gain = np.where(rms > thr, (thr / rms) ** (1 - 1 / 2.0), 1.0)
gain = np.convolve(gain, np.ones(int(0.02 * SR)) / int(0.02 * SR), mode='same')
mix *= gain
mix /= np.abs(mix).max() + 1e-9
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
fade = np.ones(N)
fo = int(0.6 * SR)
fade[-fo:] = np.linspace(1, 0, fo) ** 1.6
fade[:int(0.01 * SR)] = np.linspace(0, 1, int(0.01 * SR))
mix *= fade * 0.95

out_dir = os.path.normpath(os.path.join(REPO, 'public', '03-scrollytelling'))
os.makedirs(out_dir, exist_ok=True)
raw = os.path.join(out_dir, 'music.raw.wav')
final = os.path.join(out_dir, 'music.wav')
with wave.open(raw, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(mix.T, -1, 1) * 32767).astype('<i2').tobytes())
if os.environ.get('STEMS'):
    for k in BUSES:
        x = B[k] / (np.abs(mix).max() + 1e-9)
        with wave.open(os.path.join(out_dir, f'stem-{k}.wav'), 'wb') as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((np.clip(x.T, -1, 1) * 32767).astype('<i2').tobytes())

if shutil.which('ffmpeg'):
    # 两遍 loudnorm：先量，再线性地拉到 -14 LUFS（不改动态）
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', raw, '-af', 'loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    js = json.loads(r.stderr[r.stderr.rindex('{'): r.stderr.rindex('}') + 1])
    af = ('loudnorm=I=-14:TP=-1.0:LRA=11:linear=true:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}').format(**js)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', raw, '-af', af, '-ar', str(SR), final], check=True)
    os.remove(raw)
else:
    os.replace(raw, final)
print('→', final)
