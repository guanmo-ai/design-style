"""018 微缩景观 · 配乐第三版：一条不断线的电影配乐（F 大调，120 BPM，20 秒 = 10 小节）。
python3 audio/make_music.py <events.json> <out.wav>

第二版的问题是“不流畅”：每两小节换一套乐器、定音鼓和冲击一记记砸、上百个零件音效各响各的、
结尾台灯一关音乐硬停、再接一段磁带倒带。第三版按动画电影配乐的思路重写：

  · 一条旋律从头唱到尾：毛毡钢琴 → 小提琴接过去 → 钢片琴 → 全奏，一直是同一个动机在长大；
  · 下面一直有一层竖琴分解和弦在流（八分音符，不断），这是“丝滑”的来源；
  · 弦乐垫按声部连写：和弦换了，相同的音不重新起奏，只有变的那个声部滑过去；
  · 鼓几乎不用：只留很轻的沙锤和拨弦低音给律动；
  · 零件的声音全部“调进和弦”：落地是闷的低音 + 和弦里的木琴音，开灯是和弦里的钢片琴音，
    同一类声音 90 毫秒内只响一次，整体比音乐低一截；
  · 入夜走一次 Bb → Bbm6（借来的小调四级，动画电影里“怀念”的那个和声），片名处回到 F 大调全奏；
  · 结尾不硬停：18.5 秒台灯关掉时只剩钢片琴两个音和一个长长的 F 大调和弦，混响自然散掉。

零件的声音来自时间轴导出的事件表（video3d/render.cjs 写的 events.json）。"""
import json
import os
import sys

import numpy as np
from scipy.signal import butter, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', '..', 'scripts', 'lib'))
from audio import AudioKit  # noqa: E402
from audio.orchestra import Orchestra  # noqa: E402


class Kit(AudioKit, Orchestra):
    def felt(self, m, d=2.4, vel=0.6):
        """毛毡钢琴：三角钢琴去掉高频、起音软一点，像隔着一层布弹。"""
        y = self.grand(m, d, vel)
        y = self._lp(y, 1900 + 900 * vel, 2)
        n = int(0.006 * self.SR)
        y[:n] *= np.linspace(0, 1, n)
        return y * 1.5

    def soft_thump(self, level=1.0, f0=95, f1=48):
        """落地：没有噪声的软低音，像东西落在铺了毛毡的桌上。"""
        t = self.tt(0.45)
        f = f1 + (f0 - f1) * np.exp(-t / 0.035)
        y = np.sin(2 * np.pi * np.cumsum(f) / self.SR) * np.exp(-t / 0.11) * np.minimum(1, t / 0.003)
        return y * level * 0.5

    def air(self, d=0.7, level=1.0, c0=500, c1=4000):
        """柔和的风声：滤过的噪声，起落都是正弦包络（没有棱角）。"""
        t = self.tt(d)
        y = self.sweep(self.rng.standard_normal(len(t)), c0, c1)
        return y * np.sin(np.pi * t / d) ** 2 * level * 0.22


SR = 48000
A = Kit(duration=20.0, seed=18, fps=30.0, tail=4.0)
BEAT, BAR = 0.5, 2.0
b = lambda bar, beat=0.0: (bar - 1) * BAR + beat * BEAT
LAMP_OFF = 18.5   # 和画面一致：第 10 小节第 2 拍

# ---------- 和声（每拍一个时间点；低音 + 四个声部） ----------
# F | C/E | Dm7 | Bb(add9) | F/A | Gm7 | Bbmaj7 | Bb → Bbm6 | F | Bb/F → F
CHORDS = [
    (b(1), 41, [53, 57, 60, 65]), (b(2), 40, [52, 55, 60, 67]), (b(3), 38, [53, 57, 60, 62]),
    (b(4), 34, [53, 58, 60, 62]), (b(5), 45, [53, 57, 60, 65]), (b(6), 43, [53, 58, 62, 65]),
    (b(7), 46, [53, 57, 58, 62]), (b(8), 46, [53, 58, 62, 65]), (b(8, 2), 46, [53, 58, 61, 67]),
    (b(9), 41, [53, 57, 60, 65]), (b(10), 41, [53, 58, 62, 65]), (b(10, 2), 41, [53, 57, 60, 65]),
]
END = 20.0


def chord_at(t):
    cur = CHORDS[0]
    for c in CHORDS:
        if c[0] <= t + 1e-6:
            cur = c
    return cur


def tones(t, lo=72, hi=96):
    """当前和弦在某个音区里的所有音（给零件音效挑音用）。"""
    _, bass, ch = chord_at(t)
    pcs = sorted({m % 12 for m in ch + [bass]})
    return [m for m in range(lo, hi) if m % 12 in pcs]


# 力度曲线：慢慢长大，第 7 小节（App）收一点，入夜暖，片名最满，关灯后散掉
def level(t):
    pts = [(0, 0.55), (4, 0.7), (8, 0.85), (12, 0.8), (12.3, 0.62), (14, 0.7), (16, 1.0), (18.4, 0.9), (20, 0.55)]
    xs, ys = zip(*pts)
    return float(np.interp(t, xs, ys))


# ---------- 弦乐垫：按声部连写，相同的音不重新起奏 ----------
for v in range(4):
    segs = []
    for i, (t0, _, ch) in enumerate(CHORDS):
        t1 = CHORDS[i + 1][0] if i + 1 < len(CHORDS) else END
        if segs and segs[-1][2] == ch[v]:
            segs[-1][1] = t1
        else:
            segs.append([t0, t1, ch[v]])
    for t0, t1, m in segs:
        A.place(A.strings([m], t1 - t0 + 0.25, 0.75 * level(t0), att=0.45, rel=1.1, bright=2000), max(0, t0 - 0.12), 1.0, pan=(v - 1.5) * 0.25, send=0.55)
# 大提琴 / 低音提琴：低音线，长音
for i, (t0, bass, _) in enumerate(CHORDS):
    t1 = CHORDS[i + 1][0] if i + 1 < len(CHORDS) else END
    if i and CHORDS[i - 1][1] == bass:
        continue
    j = i
    while j + 1 < len(CHORDS) and CHORDS[j + 1][1] == bass:
        j += 1
    t1 = CHORDS[j + 1][0] if j + 1 < len(CHORDS) else END
    A.place(A.strings([bass, bass + 12], t1 - t0 + 0.2, 0.7 * level(t0), att=0.25, rel=1.2, bright=700), max(0, t0 - 0.05), 1.0, pan=-0.1, send=0.35)

# ---------- 竖琴：八分音符的分解和弦，从头流到入夜，一直不断 ----------
PAT = [0, 1, 2, 3, 4, 3, 2, 1]
for k in range(int(16.0 / 0.25)):
    t = k * 0.25
    if t >= 16.0:
        break
    if k % 2:   # 八分音符上弹，十六分音符的位置留给装饰
        continue
    _, bass, ch = chord_at(t)
    arp = [bass + 24] + [m + 12 for m in ch]
    m = arp[PAT[(k // 2) % 8]]
    vel = (0.55 if (k // 2) % 4 == 0 else 0.4) * level(t)
    A.place(A.harp(m, 1.6, 1.0), t, vel, pan=0.35 * np.sin(k * 0.7), send=0.45)
# 片名处竖琴一个上行刮奏，接上全奏
for i, m in enumerate([65, 69, 72, 77, 81, 84, 89]):
    A.place(A.harp(m, 2.0, 1.0), b(8, 3) + i * 0.07, 0.5, pan=-0.4 + i * 0.12, send=0.6)

# ---------- 拨弦低音 + 很轻的沙锤：律动只给一点点 ----------
for bar in (1, 2, 3, 4, 5, 6, 7):
    for beat in (0, 2):
        t = b(bar, beat)
        _, bass, _ = chord_at(t)
        A.place(A.pizz(bass + 12, 1.0), t, 0.55 * level(t), pan=-0.25, send=0.25)
    for beat in (1, 3):
        A.place(A.pizz(chord_at(b(bar, beat))[2][2] + 12, 0.8), b(bar, beat), 0.32 * level(b(bar, beat)), pan=0.25, send=0.25)
    for k in range(8):
        A.place(A.shaker(0.18 if k % 2 else 0.1), b(bar, k * 0.5 + 0.25), 0.5, pan=0.4, send=0.1)

# ---------- 主旋律：一个动机从头唱到尾 ----------
# (小节, 拍, 音, 时值拍)
THEME = [
    (1, 0, 72, 1), (1, 1, 69, .5), (1, 1.5, 72, .5), (1, 2, 77, 1.5), (1, 3.5, 76, .5),
    (2, 0, 74, 1), (2, 1, 72, .5), (2, 1.5, 74, .5), (2, 2, 79, 2),
    (3, 0, 77, 1), (3, 1, 76, .5), (3, 1.5, 77, .5), (3, 2, 81, 1.5), (3, 3.5, 79, .5),
    (4, 0, 77, 1), (4, 1, 74, 1), (4, 2, 72, 2),
    (5, 0, 72, 1), (5, 1, 69, .5), (5, 1.5, 72, .5), (5, 2, 77, 1), (5, 3, 79, 1),
    (6, 0, 81, 1.5), (6, 1.5, 79, .5), (6, 2, 77, 1), (6, 3, 74, 1),
    (7, 0, 74, .5), (7, .5, 77, .5), (7, 1, 81, .5), (7, 1.5, 79, .5), (7, 2, 77, 1), (7, 3, 76, 1),
    (8, 0, 77, 2), (8, 2, 73, 2),
    (9, 0, 81, 1.5), (9, 1.5, 79, .5), (9, 2, 77, 1), (9, 3, 84, 1),
    (10, 0, 81, 2),
]
for bar, beat, m, dur in THEME:
    t, d = b(bar, beat), dur * BEAT
    lv = level(t)
    if bar <= 4 or bar >= 9:   # 毛毡钢琴唱开头和片名
        A.place(A.felt(m, d + 1.6, 0.55 + 0.25 * (bar >= 9)), t, 0.95 * lv, pan=0.1, send=0.5)
    if 5 <= bar <= 6:   # 钢琴退到后面轻轻托着
        A.place(A.felt(m - 12, d + 1.2, 0.45), t, 0.55 * lv, pan=-0.1, send=0.5)
    if 5 <= bar <= 6 or bar >= 9:   # 小提琴接过旋律（连奏，起音软）
        A.place(A.strings([m, m - 12] if bar <= 6 else [m], d + 0.05, (1.7 if bar <= 6 else 0.9) * lv, att=0.12, rel=0.5, bright=3400, vib=5.6), t - 0.03, 1.0, pan=0.15, send=0.5)
    if bar in (7, 8):   # App 和入夜：钢片琴 + 高八度的竖琴
        A.place(A.celesta(m + 12, 1.8, 1.0), t, 0.9 * lv, pan=0.2, send=0.6)
        A.place(A.harp(m, 1.8, 1.0), t, 0.45 * lv, pan=-0.2, send=0.5)

# 第 0 帧就有分量：低音钢琴八度 + 竖琴一个和弦
for m in (41, 53):
    A.place(A.felt(m, 3.0, 0.5), 0.0, 0.8, pan=-0.15, send=0.4)
for i, m in enumerate((65, 69, 72)):
    A.place(A.harp(m, 1.8, 1.0), i * 0.03, 0.45, pan=0.2, send=0.5)

# ---------- 入夜：人声垫；片名：全奏 ----------
A.place(A.choir([65, 70, 74], 2.1, 0.7, att=0.7, rel=1.0), b(8) - 0.1, 1.0, send=0.6)
A.place(A.choir([65, 70, 73], 2.0, 0.7, att=0.5, rel=1.2), b(8, 2) - 0.1, 1.0, send=0.6)
A.place(A.choir([65, 69, 72, 77], 3.6, 0.95, att=0.5, rel=1.6), b(9) - 0.15, 1.0, send=0.65)
A.place(A.strings([77, 81, 84, 89], 2.3, 0.75, att=0.35, rel=1.4, bright=3600), b(9) - 0.1, 1.0, send=0.6)
A.place(A.timpani(29, 0.55, 3.0), b(9), 0.7, send=0.4)   # 全片唯一一记定音鼓：片名落下
A.place(A.swell([65, 69, 72], 1.0, 0.6), b(9) - 1.0, 1.0, send=0.3)

# 结尾：台灯关掉 → 钢片琴两个音，F 大调长和弦慢慢散掉（不硬停）
A.place(A.celesta(84, 2.4, 1.0), LAMP_OFF + 0.03, 0.75, pan=0.2, send=0.85)
A.place(A.celesta(77, 3.0, 1.0), LAMP_OFF + 0.53, 0.7, pan=-0.2, send=0.85)
A.place(A.felt(53, 3.0, 0.4), LAMP_OFF + 0.03, 0.6, send=0.6)
A.place(A.felt(41, 3.0, 0.4), LAMP_OFF + 0.03, 0.6, send=0.5)

# ---------- 零件的声音：全部调进和弦，比音乐低一截 ----------
ev = json.load(open(sys.argv[1])) if len(sys.argv) > 1 and sys.argv[1].endswith('.json') else []
last = {}
GAP = {'drop': 0.12, 'spin': 0.12, 'rumble': 0.4, 'pop': 0.09, 'rise': 0.25, 'drawx': 0.3, 'zip': 0.3, 'tick': 0.11}
up = 0
for e in sorted(ev, key=lambda e: e['t']):
    t, kind, pan = e['t'], e['kind'], max(-0.7, min(0.7, e.get('pan', 0)))
    if t < 0 or t >= LAMP_OFF:
        continue
    fam = 'note' if kind.startswith('note') else kind
    if t - last.get(fam, -9) < GAP.get(fam, 0.09):
        continue
    last[fam] = t
    hi = tones(t, 74, 93)
    if fam in ('drop', 'spin'):
        A.sfx(A.soft_thump(0.9), t, pan=pan * 0.5, send=0.2)
        A.sfx(A.marimba(tones(t, 55, 67)[int(abs(pan) * 9 + t * 5) % len(tones(t, 55, 67))], 0.55), t, pan=pan, send=0.3)
    elif fam == 'rumble':
        A.sfx(A.soft_thump(0.7, 70, 40), t, send=0.3)
    elif fam == 'pop':
        A.sfx(A.harp(hi[int(abs(pan) * 13 + t * 7) % len(hi)], 1.0, 1.0), t, 0.6, pan=pan, send=0.45)
    elif fam == 'rise':
        A.sfx(A.air(0.55, 0.6, 400, 2500), t - 0.1, pan=pan, send=0.3)
    elif fam in ('drawx', 'zip'):
        A.sfx(A.air(0.7, 0.7, 700, 5000), t - 0.15, pan=pan, send=0.3)
    elif fam == 'tick':
        up = (up + 1) % len(hi)
        A.sfx(A.marimba(hi[up], 0.35), t, pan=pan, send=0.3)
    elif fam == 'note':
        k = int(kind[4:])
        A.sfx(A.celesta([77, 79, 81, 84, 86, 89, 91][k % 7], 1.2, 0.55), t, pan=pan, send=0.55)
# 移轴打开：一个柔和的“叮”（取代原来的机械咔哒）
A.sfx(A.celesta(89, 1.6, 0.6), 8.75, pan=0.1, send=0.6)
A.sfx(A.click(0.35, lo=1500, hi=5000, d=0.006), 8.75, send=0.3)
# 入夜开灯：一盏一个和弦里的钢片琴音，往上走
lit = tones(14.5, 79, 98)
for k in range(12):
    A.sfx(A.celesta(lit[k % len(lit)], 1.4, 0.38), 14.45 + k * 0.075, pan=float(np.sin(k * 1.7) * 0.6), send=0.6)
# 镜头“咚”：软低音
for tt in (0.55 + 0.5 + 0.36, 3.9 + 2.0 + 0.33, 7.5 + 0.6):
    A.sfx(A.soft_thump(0.8, 80, 42), tt, send=0.3)
# 台灯开关：轻轻一下
A.sfx(A.click(0.6, lo=900, hi=4000, d=0.008), LAMP_OFF, send=0.4)


# ---------- 混音：长混响、慢压缩“粘”在一起、平滑限幅，不做削波饱和 ----------
def lp(x, fc):
    return sosfilt(butter(2, fc, 'low', fs=SR, output='sos'), x)


def glue(y, thr_db=-18.0, ratio=2.0, att=0.03, rel=0.35):
    """立体声联动的 RMS 压缩：慢起慢放，不抽吸。"""
    env = np.sqrt(np.maximum(lp(np.mean(y ** 2, axis=0), 1 / (2 * np.pi * 0.05)), 0) + 1e-12)
    db = 20 * np.log10(env)
    gr = np.minimum(0, (thr_db - db) * (1 - 1 / ratio))
    g = 10 ** (gr / 20)
    out = np.empty_like(g)   # 起 / 放两种时间常数
    a_a, a_r, acc = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR)), 1.0
    for i in range(0, len(g), 64):
        tgt = g[i:i + 64].min()
        a = a_a if tgt < acc else a_r
        acc = tgt + (acc - tgt) * a ** 64
        out[i:i + 64] = acc
    return y * out


A.final = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'diorama.wav')
os.makedirs(os.path.dirname(os.path.abspath(A.final)), exist_ok=True)
mix = A.MUS + A.SFX * float(os.environ.get('SFX_GAIN', 0.5))   # SFX_GAIN=0 只听音乐（检查用）
for ch, seed in ((0, 11), (1, 12)):
    mix[ch] += A.reverb(A.SEND[ch], seed, dec=1.0, length=4.0) * 0.5
for ch in range(2):
    mix[ch] = A.fft_filter(mix[ch], lo=32, hi=15000)
mix = mix[:, :A.NV]
t = np.arange(A.NV) / SR
mix *= np.minimum(1, t / 0.02)                                  # 第 0 帧不爆音
mix *= np.where(t > 18.9, np.cos(np.clip((t - 18.9) / 1.1, 0, 1) * np.pi / 2) ** 1.5, 1)   # 余音在 20 秒内自然收尽
mix /= np.abs(mix).max() + 1e-9
mix = glue(mix * 0.5)
y = mix.T
for _ in range(3):
    i = A.loudness(y)
    y = A.limit(y * 10 ** ((-15.0 - i) / 20), ceil=0.89, win=0.02)
print('loudness %.2f LUFS' % A.loudness(y))
A.write(A.final, y)
print('wrote', A.final)
