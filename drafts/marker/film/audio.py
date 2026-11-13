"""马克笔 · 配乐（一整首歌，18.5 秒）。144 BPM（一拍 = 25 帧，一小节 = 100 帧，第一小节的重拍在第 50 帧），G 大调，
G — D — Em — C 每小节一个和弦。明亮的放克流行：紧的底鼓、二四拍拍手、十六分闭镲、八度跳的贝斯、电钢琴反拍和弦，
主旋律 = 拨弦 + 马林巴 + 一点方波（记得住的四小节，后半段升八度再来一遍）。

招牌声音是**笔头擦纸**：每一笔一声，长短 = 这一笔画了多久，音量 = 笔速。它不是宽带噪声——
一道窄带（调到当前和弦音的高八度泛音）+ 一点点高频纤维声 + 落笔的“嗒”，压在鼓下面 8 dB 左右，和十六分闭镲是同一个格子。
其余：拔帽“啵”、倒带、换笔“嗖”、积墨那一下的“晕开”、白点“叮”、引擎一冲、扣帽“咔”。
时间全部来自页面（node ../../_lib/events.cjs film.html events.json）。python3 audio.py out.wav"""
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from song import Song  # noqa: E402
from softfx import SoftFX  # noqa: E402

EV = json.loads((HERE / 'events.json').read_text())
END, BEAT = EV['end'], EV['beat']
MK = EV['marks']
BAR = 4 * BEAT
G, D, EM, C = [67, 71, 74], [66, 69, 74], [64, 67, 71], [64, 67, 72]
PROG = [(43, G), (38, D), (40, EM), (36, C)]
CH = [(0, 43, G)] + [(50 + i * BAR, PROG[i % 4][0], PROG[i % 4][1]) for i in range(11)]


class MarkerSong(Song, SoftFX):
    def nib(self, d, level=1.0, m=79, bright=1.0, prof='press'):
        """笔头擦纸：窄带（调过音）+ 一点纤维声 + 落笔“嗒”；包络 = 笔速曲线"""
        d = max(d, 0.03)
        t = self.tt(d + 0.04)
        u = np.clip(t / d, 0, 1)
        v = 1 - 0.8 * np.cos(2 * np.pi * u) if prof == 'press' else 0.35 + 1.0 * np.sin(np.pi * u / 2)
        env = np.minimum(1, t / 0.006) * np.where(t < d, 1, np.exp(-(t - d) / 0.012)) * (0.45 + 0.55 * v / 1.8)
        n = self.rng.standard_normal(len(t))
        f0 = self.midi(m) * 4
        tone = self.fft_filter(n, lo=f0 * 0.97, hi=f0 * 1.03) * 3.2
        fib = self.fft_filter(n, lo=2600 * bright, hi=7500 * bright) * 0.45
        body = self.fft_filter(n, lo=500, hi=1400) * 0.25
        tick = self.fft_filter(self.rng.standard_normal(len(t)), lo=1200, hi=5000) * np.exp(-t / 0.003) * 1.4
        return ((tone + fib + body) * env + tick) * level

    def cap(self, level=1.0, pull=True):
        """笔帽：拔 = 吸着“啵”一声；扣 = 塑料“咔哒”两下"""
        if pull:
            return np.concatenate([self.bop(55, 1.0, 0.18) * 1.2, np.zeros(10)]) * level
        t = self.tt(0.12)
        a = self.fft_filter(self.rng.standard_normal(len(t)), lo=1500, hi=9000) * np.exp(-t / 0.0025)
        b = np.roll(a, int(0.028 * self.SR)) * 0.8
        body = np.sin(2 * np.pi * 1350 * t) * np.exp(-t / 0.018) * 0.5
        return (a + b + body) * level


S = MarkerSong(END, CH, beat=BEAT, seed=31)
fr = S.fr
rng = np.random.default_rng(4)
R3 = MK['T_RULE3']
REV, WHITE = MK['T_REV'], MK['T_WHITE']
CAPON = EV['capOn']

# ================= 乐队 =================
BRK = [(R3 + 4, R3 + 46), (CAPON - 50, CAPON)]          # 积墨那一下、扣帽前一小节：鼓停，只留贝斯和钢琴
S.drums(50, CAPON, skip=BRK, level=0.9)
for fm in np.arange(50, CAPON, BEAT / 4):                # 沙锤：十六分，和笔触是同一个格子
    if not any(a <= fm < z for a, z in BRK):
        S.place(S.shaker(0.8), fr(fm), 0.55 if (fm - 50) % (BEAT / 2) else 0.3, 0.35)
S.bassline(50, CAPON, skip=[(R3 + 4, R3 + 46)], level=1.0)
S.pad(0.9, wave='saw', fc=1500)


def epiano(ms, d=0.22):
    """电钢琴：正弦 + 二次谐波，带一点颤音的“铃”"""
    t = S.tt(d + 0.25)
    y = np.zeros_like(t)
    for m in ms:
        f = S.midi(m)
        y += (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.08) + 0.12 * np.sin(2 * np.pi * 7 * f * t) * np.exp(-t / 0.01))
    return y * np.minimum(1, t / 0.003) * np.where(t < d, np.exp(-t / 0.4), np.exp(-d / 0.4) * np.exp(-(t - d) / 0.06)) * 0.25


for fm in np.arange(50 + BEAT / 2, CAPON, BEAT):          # 反拍和弦
    if any(a <= fm < z for a, z in BRK[:1]):
        continue
    ch = S.chord(fm)[2]
    S.place(epiano([m - 12 for m in ch] + [ch[0]]), fr(fm), 0.55, 0.15 * (1 if int(fm / BEAT) % 2 else -1), send=0.2, bus=S.PUMP)


def lead(m, d):
    y = S.pizz(m, 1.0) * 1.1
    k = S.marimba(m, 1.0) * 0.9
    q = S.synth(m, d, 'square', 3000, 1800, 0.2, att=0.005, rel=0.05, det=0.003) * 0.35
    n = max(len(y), len(k), len(q))
    return sum(np.pad(a, (0, n - len(a))) for a in (y, k, q))


PH = [[(0, 74, 1), (1, 79, 1), (2, 78, 1), (3, 79, 1), (5, 83, 2), (7, 81, 1)],
      [(0, 81, 2), (2, 78, 1), (3, 74, 1), (4, 76, 2), (6, 78, 2)],
      [(0, 79, 1), (1, 83, 1), (2, 81, 1), (3, 79, 1), (5, 76, 2), (7, 74, 1)],
      [(0, 76, 3), (3, 72, 1), (4, 74, 2), (6, 79, 2)]]
for i in range(10):
    b0 = 50 + i * BAR
    if b0 + BAR > CAPON + 1:
        break
    if 0 < R3 - b0 < BAR or (b0 <= R3 < b0 + BAR):        # 积墨那一小节旋律让开
        notes = [n for n in PH[i % 4] if b0 + n[0] * BEAT / 2 < R3 - 6 or b0 + n[0] * BEAT / 2 > R3 + 46]
    else:
        notes = PH[i % 4]
    oct_ = 12 if i >= 8 else 0
    S.hook(b0, [(p, m + oct_, ln) for p, m, ln in notes], 1.0 if i < 8 else 1.1, inst=lead)

# ================= 开场：拔帽 → 倒带 → 第一拍 =================
S.sfx(S.cap(1.0, True), fr(EV['capOff']), 0.9, 0.3, send=0.2)
r0, r1 = EV['rew']
S.sfx(S.tape_stop(fr(r1 - r0) + 0.1, 62, 1.0)[::-1].copy(), fr(r0), 0.5, 0, send=0.3)       # 倒放的“磁带停转” = 往回卷
S.sfx(S.rev_cymbal(fr(r1 - r0), 1.0), fr(r0), 0.5, 0, send=0.3)
# 倒带时每一笔“嗖”地退回去：越来越密的细碎擦纸声（倒着排）
ks = sorted(EV['strokes'], key=lambda s: -s['t'])
TF = max(s['t'] + s['d'] for s in EV['strokes']) + 60
for k, s in enumerate(ks[::3]):
    u = 1 - (s['t'] - (r1 - 0.01)) / (TF - (r1 - 0.01))       # 这一笔在倒带里被收走的时刻（与 film.html 的 tau 一致：smootherstep）
    lo, hi = 0.0, 1.0
    for _ in range(20):
        mid = (lo + hi) / 2; e = mid ** 3 * (mid * (6 * mid - 15) + 10)
        lo, hi = (mid, hi) if e < u else (lo, mid)
    at = r0 + (r1 - r0) * lo
    S.sfx(S.nib(0.03, 1.0, S.tone(at, k % 3, 1), 1.2, 'flick')[::-1].copy(), fr(at), 0.10, float(rng.uniform(-0.6, 0.6)))
S.place(S.crash(1.0), fr(50), 0.7, 0.1, send=0.3)

# ================= 每一笔一声 =================
TOOLV = {'black': (0.20, 0.9), 'blue': (0.18, 1.0), 'orange': (0.17, 1.0), 'pencil': (0.11, 1.5), 'liner': (0.09, 1.7), 'white': (0.12, 1.8)}
for k, s in enumerate(EV['strokes']):
    lv, br = TOOLV.get(s['tool'], (0.15, 1.0))
    d = fr(s['d'])
    lv *= min(1.25, 0.65 + s['len'] / 900)
    m = S.tone(s['t'], k % 3, 1)
    S.sfx(S.nib(d, 1.0, m, br, 'press'), fr(s['t']), lv, float(np.clip((s['t'] % 100 - 50) / 70, -0.6, 0.6)), send=0.08)

# 换笔：上一支走、下一支来的“嗖”
prev = None
for s in sorted(EV['strokes'], key=lambda s: s['t']):
    if s['tool'] != prev and prev is not None:
        S.sfx(S.whoosh(0.22, 600, 5000, 0.8, 0.5), fr(s['t'] - 14), 0.22, 0.4)
    prev = s['tool']

# 规则 ③：笔停在纸上，墨一圈圈晕开——一个慢慢鼓起来的和弦 + 下行的水声“咕”，起步那一下回到鼓上
S.sfx(S.swell([67, 71, 74, 79], fr(46), 1.0), fr(R3), 0.55, 0, send=0.6)
S.sfx(S.glide(55, 48, 0.35, 0.8), fr(R3 + 2), 0.25, 0, send=0.4)
S.sfx(S.bell(86, 0.7, 1.4), fr(R3 + 22), 0.35, 0.2, send=0.6)

# 批注的箭头：一笔“嗖”上去
for t in EV['arrows']:
    S.sfx(S.glide(72, 84, 0.12, 0.6), fr(t), 0.16, -0.3, send=0.3)

# 白：一笔一声高音的“叮”，白点是钢片琴往上走
for k, t in enumerate(EV['dots']):
    S.sfx(S.celesta([83, 86, 91, 95][k % 4], 1.4, 1.0), fr(t), 0.5, -0.4 + 0.25 * k, send=0.5)
    S.sfx(S.tink([95, 98, 103, 107][k % 4], 0.8, 0.25), fr(t), 0.3, -0.4 + 0.25 * k, send=0.4)
S.sfx(S.shimmer(0.9, 0.8), fr(WHITE + 6), 0.25, send=0.5)

# 车活过来：引擎一轰 + 镜头“咚” + 镲
S.sfx(S.engine(1.1, 55, 210, 1.0, 0.6), fr(REV - 4), 0.75, 0.0, send=0.15)
S.place(S.kick(1.3), fr(REV), 1.0); S.kicks.append(REV)
S.sfx(S.boom(0.9, 110, 40, 0.7), fr(REV + 6), 0.6)
S.place(S.crash(1.0), fr(REV), 0.6, -0.1, send=0.4)
S.sfx(S.whoosh(0.5, 300, 6000, 1.0, 0.35), fr(REV + 4), 0.45, 0.5, send=0.3)

# 收束：笔飞回来、扣帽“咔哒”，全乐队落在 G 上
S.sfx(S.whoosh(0.4, 500, 4000, 0.8, 0.7), fr(CAPON - 46), 0.35, 0.5)
S.sfx(S.rev_cymbal(0.4, 1.0), fr(CAPON) - 0.4, 0.5, send=0.3)
S.sfx(S.cap(1.0, False), fr(CAPON), 1.0, 0.25, send=0.25)
S.place(S.kick(1.3), fr(CAPON), 1.0); S.kicks.append(CAPON)
S.place(S.sbass(31, 1.2), fr(CAPON), 0.5, bus=S.PUMP)
S.place(S.crash(1.0), fr(CAPON), 0.6, send=0.5)
S.place(epiano([55, 59, 62, 67, 71], 1.0), fr(CAPON), 0.9, 0, send=0.4)
for k, m in enumerate([79, 83, 86, 91]):
    S.sfx(S.celesta(m, 1.2, 0.9), fr(CAPON + 3 + k * 3), 0.45, -0.3 + 0.2 * k, send=0.5)

# ================= 字：手写一个字一声 =================
S.text_cues(EV['cues'], 0.7)

S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
