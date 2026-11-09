"""水墨 · 全片配乐（18.75 秒，纯代码合成，无外部音源）。
一整首歌：128 BPM · 4/4 · 10 小节（一小节 1.875 秒）· D 小调五声。乐队从头到尾是同一支：
古筝（Karplus-Strong）、笛子（正弦 + 气声 + 延迟颤音 + 倚音）、二胡（锯齿 + 颤音，只在副歌）、弦乐铺底、合唱、定音鼓。

  小节   时间            和弦          画面              音乐
  1–2    0.00–3.75      Dm  B♭        写“水”、墨滴       前奏：古筝刮奏、定音鼓、低音弦
  3–4    3.75–7.50      F   C         蝌蚪、虾、拉远      主歌：笛子第一句，古筝八分琶音
  5–6    7.50–11.25     Dm  B♭        落到界面            第二句，轻鼓 + 沙锤进来，渐强
  7–9    11.25–16.875   F C B♭→A      五条规则            副歌：笛子高八度 + 二胡对位 + 弦乐 + 合唱 + 大鼓
  10     16.875–18.75   Dm            片尾                回到主和弦：笛子长音、合唱、钟

每个画面动作仍有一个声音，但全部压在音乐下面（×0.55），有音高的都取当前和弦里的音。
用法：python3 audio.py out.wav"""
import json
import re
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[2] / 'scripts' / 'lib'))
from audio import AudioKit  # noqa: E402
from audio.orchestra import Orchestra  # noqa: E402

TL = json.loads(re.search(r'window\.TL = (\{.*\})', (HERE / 'timeline.js').read_text(), re.S).group(1))
BEAT = TL['beat']
BAR = BEAT * 4
b2t = lambda b: b * BEAT          # 拍 → 秒


class Kit(AudioKit, Orchestra):
    def dizi(self, m, d, level=1.0, grace=True):
        """笛子：基音 + 2、3、4 次泛音，带气声；颤音 0.25 秒后才出来；开头从低一点滑上来（倚音）"""
        t = self.tt(d + .25)
        f0 = self.midi(m)
        bend = 1 - (.055 * np.exp(-t / .035) if grace else 0)
        vib = 1 + .0065 * np.sin(2 * np.pi * 5.3 * t) * np.clip((t - .22) / .3, 0, 1)
        ph = 2 * np.pi * np.cumsum(f0 * bend * vib) / self.SR
        y = np.sin(ph) + .30 * np.sin(2 * ph) + .13 * np.sin(3 * ph) + .05 * np.sin(4 * ph)
        br = self.fft_filter(self.rng.standard_normal(len(t)), lo=f0 * 1.4, hi=f0 * 5) * .10
        env = np.minimum(1, t / .05) * np.where(t < d, 1 - .12 * (t / max(d, .01)), np.exp(-(t - d) / .16))
        return (y + br * (.6 + .4 * np.exp(-t / .15))) * env * level * .13

    def erhu(self, m, d, level=1.0):
        """二胡：锯齿（加法合成）+ 6 Hz 颤音 + 慢起弓"""
        t = self.tt(d + .3)
        f0 = self.midi(m) * (1 + .009 * np.sin(2 * np.pi * 6 * t) * np.clip((t - .15) / .3, 0, 1))
        ph = 2 * np.pi * np.cumsum(f0) / self.SR
        y = sum(np.sin(h * ph) / h for h in range(1, 18))
        y = self.fft_filter(y, lo=180, hi=3200)
        env = np.minimum(1, t / .12) * np.where(t < d, 1.0, np.exp(-(t - d) / .2))
        return y * env * level * .06


A = Kit(duration=TL['end'], fps=60, seed=1960, tail=3.0)
SFX = .38

Dm, Bb, F, C, Am = [50, 57, 62, 65, 69], [46, 53, 58, 62, 65], [53, 60, 65, 69, 72], [48, 55, 60, 64, 67], [45, 52, 57, 61, 64]
BARS = [Dm, Bb, F, C, Dm, Bb, F, C, None, Dm]           # 第 9 小节前两拍 B♭、后两拍 A
def chord_at(t):
    i = min(9, int(t // BAR))
    if i == 8:
        return Bb if (t - 8 * BAR) < 2 * BEAT else Am
    return BARS[i]
def ctone(t, k):
    """当前和弦的第 k 个音（往上翻八度）"""
    ch = chord_at(t)
    return ch[k % len(ch)] + 12 * (k // len(ch))


def zheng(m, t, g=1.0, pan=0.0, d=1.8):
    A.place(A.harp(m, d, 1.0), t, gain=g, pan=pan, send=.4)


def gliss(t, ch, g=.7, up=True, n=9):
    notes = [ch[k % len(ch)] + 12 * (k // len(ch)) + 12 for k in range(n)]
    if not up:
        notes = notes[::-1]
    for k, m in enumerate(notes):
        zheng(m, t + k * .028, g * (.6 + .4 * k / n), -.5 + k / n, 1.6)


# ═════════ 乐队 ═════════
# 弦乐铺底：每小节一个和弦，第 7 小节起更亮更满
for i in range(10):
    t0 = i * BAR
    for half in ((0, 2), (2, 2)) if i == 8 else ((0, 4),):
        ch = chord_at(t0 + half[0] * BEAT)
        lv = .45 if i < 2 else (.6 if i < 6 else (.95 if i < 9 else .8))
        A.place(A.strings(ch[1:4], b2t(half[1]) + .15, lv, .35, .9, 2000 if i < 6 else 2400), t0 + b2t(half[0]), gain=1.0, send=.45)
        # 低音：定音鼓调到和弦根音 + 钢琴低八度
        A.place(A.timpani(ch[0], .55 if i < 6 else .85, 1.6), t0 + b2t(half[0]), gain=.9, send=.2)
        A.place(A.grand(ch[0] - 12, b2t(half[1]) + .4, .45 if i < 6 else .6), t0 + b2t(half[0]), gain=.8, send=.25)
# 合唱：副歌和片尾
for i in range(6, 10):
    for half in ((0, 2), (2, 2)) if i == 8 else ((0, 4),):
        ch = chord_at(i * BAR + half[0] * BEAT)
        A.place(A.choir(ch[1:4], b2t(half[1]) + .2, .55 if i < 9 else .8), i * BAR + b2t(half[0]), gain=1.0, send=.5)

# 古筝：前奏刮奏；主歌起八分琶音；每段开头一个刮奏
gliss(0.0, Dm, .9)
gliss(3 * BAR - .25, F, .6)
gliss(6 * BAR - .25, F, .9)
gliss(9 * BAR - .25, Dm, .8, up=False)
PAT = [0, 2, 3, 4, 5, 4, 3, 2]
for e in range(int(2 * BAR / (BEAT / 2)), int(9 * BAR / (BEAT / 2))):
    t = e * BEAT / 2
    k = PAT[e % 8]
    acc = 1.0 if e % 2 == 0 else .75
    sect = .45 if t < 4 * BAR else (.55 if t < 6 * BAR else .7)
    zheng(ctone(t, k), t, sect * acc * .85, -.35 + .7 * ((e % 8) / 7), 1.2)

# 鼓：第 5–6 小节轻鼓 + 沙锤；第 7–9 小节大鼓（1、2.5、3 拍）+ 第 7 小节开头一记镲；片尾停
for b in range(int(4 * BAR / BEAT), int(9 * BAR / BEAT)):
    t = b2t(b)
    chorus = t >= 6 * BAR
    if b % 2 == 0:
        A.place(A.kick(.6 if not chorus else .9), t, gain=.8)
    if chorus and b % 4 == 1:
        A.place(A.kick(.7), t + BEAT / 2, gain=.6)
    for s in (.5,):
        A.place(A.shaker(.35 if not chorus else .5), t + s * BEAT, gain=.25, pan=.3)
    if chorus and b % 4 == 2:
        A.place(A.timpani(38, .8, 1.0), t, gain=.7, send=.2)
A.place(A.crash(.6), 6 * BAR, gain=.3, pan=.2, send=.3)
A.place(A.hit(.7, 26), 6 * BAR, gain=.45, send=.3)

# ═════════ 旋律 ═════════
MEL = [
    # 主歌（第 3–4 小节）
    (8, 72, 1.5), (9.5, 74, .5), (10, 77, 1), (11, 74, 1), (12, 72, 2), (14, 69, 1), (15, 67, 1),
    # 第二句（第 5–6 小节）
    (16, 69, 2), (18, 72, .5), (18.5, 74, .5), (19, 72, 1), (20, 65, 1.5), (21.5, 67, .5), (22, 69, 1), (23, 72, 1),
    # 副歌（第 7–9 小节，高八度）
    (24, 81, 2), (26, 79, .5), (26.5, 77, .5), (27, 79, 1),
    (28, 84, 1.5), (29.5, 81, .5), (30, 79, 1), (31, 77, 1),
    (32, 74, 1.5), (33.5, 77, .5), (34, 76, 1), (35, 73, 1),
    # 片尾长音
    (36, 74, 3.6),
]
for b, m, d in MEL:
    lv = 1.5 if b < 24 else (1.9 if b < 36 else 1.7)
    A.place(A.dizi(m, b2t(d) * .96, lv, grace=d >= 1), b2t(b), gain=1.0, pan=-.05, send=.45)
# 二胡对位（副歌 + 片尾）
for b, m, d in [(24, 69, 4), (28, 76, 4), (32, 70, 2), (34, 73, 2), (36, 69, 3.6)]:
    A.place(A.erhu(m, b2t(d) * .97, 1.0), b2t(b), gain=1.3, pan=.25, send=.4)
# 片尾的钟
A.place(A.bell(74, .8, 2.6), 9 * BAR, gain=.7, send=.55)
A.place(A.bell(81, .5, 2.2), 9 * BAR + b2t(2), gain=.5, send=.55)

# ═════════ 画面动作的声音（压在音乐下面）═════════
def S(sig, t, g=1.0, pan=0.0, send=.25):
    A.sfx(sig, t, gain=g * SFX, pan=pan, send=send)

strokes = [TL['s1'], TL['s2'], TL['s3'], TL['s4']]
for i, (t0, d) in enumerate(strokes):
    S(A.whoosh(max(d, .25), 400, 6000, .9, .45), max(t0, 0) if i else 0.0, 1.0, -.3 + .2 * i)
A.place(A.hit(.8, 26), 0.0, gain=.55, send=.35)
S(A.hiss(.5, .5), .02, .8)
S(A.hit(.8, 26), TL['seal'], 1.0); S(A.thock(50, 1.0), TL['seal'], 1.0)
S(A.glide(74, 86, TL['land'] - TL['launch'], .5), TL['launch'], .8, .3)
S(A.boom(.8, 110, 40, .7), TL['land'], 1.0)
S(A.hiss(.35, .6), TL['land'], .8, .1)
for k in range(TL['tadN']):
    t = TL['land'] + k * TL['tadStep']
    A.place(A.celesta(ctone(t, k % 5) + 12, .9, 1.0), t, gain=.6, pan=-.5 + k / 7, send=.4)
for k in range(8):
    t = TL['segStart'] + k * TL['tadStep']
    A.place(A.marimba(ctone(t, k % 5) + 12, 1.0), t, gain=.55, pan=.4 - k * .1, send=.2)
for j in range(4):
    S(A.whoosh(.16, 1500, 9000, .6, .3), TL['feelers'] + j * .035, .8, -.6 + .4 * j)
S(A.hit(.8, 31), TL['flick'], 1.0)
p0, p1 = TL['pull']
S(A.whoosh(p1 - p0 + .2, 200, 4000, 1.0, .55), p0 - .05, 1.2, 0, .4)
for t0 in (TL['mtn'], TL['mtn2'], TL['mtn3']):
    S(A.shimmer(.6, .5), t0, .8, 0, .5)
S(A.whoosh(TL['rows'] - TL['ui0'], 300, 6000, .9, .5), TL['ui0'], 1.0, 0, .3)
for k in range(6):
    t = TL['rows'] + (k * .06 if k < 2 else .14 + (k - 2) * BEAT / 2)
    A.place(A.celesta(ctone(t, k % 5) + 12, .7, 1.0), t, gain=.5, pan=-.3 + .12 * k, send=.35)
A.place(A.marimba(ctone(TL['tap'], 0) + 12, 1.1), TL['tap'], gain=.7)
S(A.boom(.6, 120, 50, .5), TL['tap'], .9)
S(A.whoosh(TL['detail'] - TL['wipeUI'], 200, 5000, 1.0, .6), TL['wipeUI'], 1.1, 0, .35)
S(A.hit(.7, 29), TL['seal2'], 1.0); S(A.thock(50, 1.0), TL['seal2'], .9)
for i in range(5):
    t = TL['rules0'] + i * TL['ruleStep']
    S(A.whoosh(.3, 200, 8000, 1.0, .5), t - .15, 1.1)
    if i == 0:
        for k in range(5):
            A.place(A.marimba(ctone(t, k) + 12, 1.0), t + .05 + k * .08, gain=.5, pan=-.5 + .25 * k)
    elif i == 2:
        for k in range(8):
            S(A.click(.7), t + .1 + k * .06, .6, .3)
    elif i == 3:
        S(A.thock(50, 1.0), t + .12, 1.0)
    elif i == 4:
        S(A.hiss(.5, .7), t + .05, .8)
e0 = TL['end0']
S(A.whoosh(.3, 200, 8000, 1.0, .5), e0 - .15, 1.1)
for i, (d0, dd) in enumerate(zip([0, .3, .56, .74], [.3, .26, .18, .3])):
    S(A.whoosh(max(dd, .25), 400, 6000, .9, .45), e0 + .12 + d0, 1.0)
S(A.hit(.9, 26), e0 + 1.2, 1.1); S(A.thock(50, 1.0), e0 + 1.2, .9)

A.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
