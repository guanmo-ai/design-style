"""新浪潮第一版合成配乐，使用旧时间轴。第二版的配乐见 audio.py。
新浪潮全片配乐（一整首歌，20 秒）。128.57 BPM（一拍 = 28 帧）· A 小调 · 80 年代新浪潮合成器流行：
鼓机四拍 + 门限混响的军鼓（80 年代那一声“啪——”突然断掉）、十六分音符的八度贝斯、方波琶音、锯齿和弦、一句主旋律。
和弦 Am – F – C – G 每两拍换一个，从第一拍到最后一拍是同一首歌，换场只换力度和配器。
招牌声音：胶片滑过去的“唰”（扫频噪声）；叠出新颜色时一个和弦音；字落台阶一级一个下行音；印版对准的“咔”。
时间取自 timeline.js；文字的声音取自 events.json（node ../../_lib/events.cjs film.html events.json）。python3 audio.py out.wav"""
import json
import re
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from song import Song  # noqa: E402

TL = json.loads(re.sub(r'//[^\n]*', '', re.search(r'const TL = (\{.*?\});', (HERE / 'timeline.js').read_text(), re.S).group(1)))
B, END = TL['beat'], TL['end']
AM, FM, CM, GM = (33, [57, 60, 64]), (29, [57, 60, 65]), (36, [55, 60, 64]), (31, [55, 59, 62])
PROG = [AM, FM, CM, GM]
CH = [(b * B, *PROG[(b // 2) % 4]) for b in range(0, 42, 2)] + [(TL['snap'], *AM)]


class NewWave(Song):
    def gated_snare(self, level=1.0):
        """80 年代的门限混响军鼓：干的一下 + 一团很亮的混响尾巴，0.2 秒处突然被门切断"""
        t = self.tt(0.32)
        body = np.sin(2 * np.pi * np.cumsum(190 + 70 * np.exp(-t / 0.015)) / self.SR) * np.exp(-t / 0.045)
        crack = self.fft_filter(self.rng.standard_normal(len(t)), lo=1800, hi=9000) * np.exp(-t / 0.03)
        tail = self.fft_filter(self.rng.standard_normal(len(t)), lo=500, hi=7000) * (0.55 + 0.45 * np.exp(-t / 0.08))
        gate = np.where(t < 0.19, 1.0, np.exp(-(t - 0.19) / 0.012))
        return (body * 0.9 + crack * 0.7 + tail * 0.55 * gate) * np.minimum(1, t / 0.0005) * level * 0.42

    def tom(self, m, level=1.0):
        t = self.tt(0.4)
        f = self.midi(m) * (1 + 0.6 * np.exp(-t / 0.03))
        y = np.sin(2 * np.pi * np.cumsum(f) / self.SR) * np.exp(-t / 0.16)
        y += self.fft_filter(self.rng.standard_normal(len(t)), lo=300, hi=4000) * np.exp(-t / 0.02) * 0.3
        return np.tanh(y * 1.4) * level * 0.4

    def lead(self, m, d):
        """主旋律：两层失谐锯齿 + 低八度方波，带一点颤音——80 年代的合成器铜管"""
        a = self.synth(m, d, 'saw', 5200, 1800, 0.25, att=0.008, rel=0.12, det=0.007, vib=0.22)
        b = self.synth(m - 12, d, 'square', 2600, 1400, 0.3, att=0.008, rel=0.1)
        n = min(len(a), len(b))
        return a[:n] * 0.8 + b[:n] * 0.35

    def stab(self, ms, d=0.35, level=1.0):
        """和弦重拍（铜管齐奏的一下）"""
        y = sum(self.synth(m, d, 'saw', 6000, 900, 0.09, att=0.003, rel=0.18, det=0.008) for m in ms)
        return np.tanh(y * 0.9) * level

    def zip(self, m0, m1, d=0.18, level=1.0):
        """字距一开一合：滑音的“咻”"""
        t = self.tt(d)
        f = self.midi(m0) * (self.midi(m1) / self.midi(m0)) ** (t / d)
        y = np.sign(np.sin(2 * np.pi * np.cumsum(f) / self.SR)) * 0.5 + np.sin(2 * np.pi * np.cumsum(f) / self.SR)
        return self.fft_filter(y, hi=5000) * np.sin(np.pi * t / d) ** 0.6 * level * 0.18

    def clack(self, level=1.0):
        """印版 / 块吸到栏线上：很短的“咔”"""
        t = self.tt(0.06)
        y = self.fft_filter(self.rng.standard_normal(len(t)), lo=1500, hi=9000) * np.exp(-t / 0.006)
        y += np.sin(2 * np.pi * 1900 * t) * np.exp(-t / 0.01) * 0.4
        return y * level * 0.6


S = NewWave(END, CH, beat=B, seed=31)
fr = S.fr

# —— 结构：b0 整个乐队就在（X 静音自动播放，第一帧就要有劲）；b24 一拍空（黑屏的“落”），b35 起势，b36 砸；b41 最后一个和弦 ——
DROP = [(24 * B, 25 * B)]
BUILD = (35 * B, 36 * B)
FIN = TL['snap']

# 鼓：底鼓四拍；二四拍门限军鼓；十六分闭镲、反拍开镲
for b in range(0, FIN // B + 1):
    fm = b * B
    if any(a <= fm < z for a, z in DROP) or fm >= FIN:
        continue
    if BUILD[0] <= fm < BUILD[1]:
        continue
    S.place(S.kick(1.0), fr(fm), 1.0); S.kicks.append(fm)
    if b % 2 == 1:
        S.place(S.gated_snare(1.0), fr(fm), 0.85, 0.05, send=0.35)
        S.place(S.clap(1.0), fr(fm), 0.5, -0.05, send=0.2)
    S.place(S.hat(1.0, open_=True), fr(fm + B / 2), 1.1, 0.25)
    for s in (0, 0.25, 0.75):
        S.place(S.hat(1.0), fr(fm + s * B), 0.9 + (0.3 if s == 0.75 else 0), -0.3)
# 军鼓滚奏：换大场前一拍（钻进 O、落进网点、砸 NEW 之前），十六分越来越响
for at in (TL['zoomO'][1] - B, TL['dots4'][1] - B, TL['slam'] - B):
    for k in range(4):
        S.place(S.gated_snare(0.5 + 0.17 * k), fr(at + k * B / 4), 0.55, 0.2 * (k - 1.5), send=0.3)
for at in (TL['push1'][0] + 4, TL['push7'][0] + 4):   # 推场之前三声通鼓，往下走
    for k, m in enumerate((50, 45, 40)):
        S.place(S.tom(m, 1.0), fr(at - 21 + k * 7), 0.6, -0.4 + 0.4 * k, send=0.2)

# 贝斯：十六分音符，根音和高八度交替（新浪潮最典型的那条）
st = B / 4
for k, fm in enumerate(np.arange(0, FIN, st)):
    if any(a <= fm < z for a, z in DROP):
        continue
    r = S.chord(fm)[1]
    S.place(S.sbass(r + (12 if k % 2 else 0), 0.085, 1.0), fr(fm), 0.34 * (1.0 if k % 4 == 0 else 0.8), bus=S.PUMP)
# 铺底：锯齿和弦，每两拍一个；琶音：方波十六分，开头四拍滤波慢慢打开
S.pad(1.0, wave='saw', fc=2200)
for k, fm in enumerate(np.arange(0, FIN, st)):
    if any(a <= fm < z for a, z in DROP):
        continue
    m = S.tone(fm, (0, 1, 2, 3, 2, 1, 3, 4)[k % 8], 1)
    open_ = min(1.0, 0.35 + fm / (4 * B) * 0.65)
    sig = S.synth(m, 0.07, 'square', 1200 + 4800 * open_, 700, 0.04, dec=0.08, rel=0.03)
    S.place(sig, fr(fm), 0.05 * (1.0 if k % 4 == 0 else 0.7), 0.4 * (-1) ** k, send=0.2, bus=S.PUMP)

# 主旋律：八拍一句（E E D C · A C D E · G G D），后半句往上走；01—03 场、06、07 场唱，04—05 场让给音效
HOOK_A = [(0, 76, 2), (2, 76, 1), (3, 74, 1), (4, 72, 2), (6, 69, 1), (7, 72, 1), (8, 74, 2), (10, 76, 1), (11, 79, 1), (12, 79, 2), (14, 74, 2)]
HOOK_B = [(0, 81, 2), (2, 79, 1), (3, 76, 1), (4, 77, 2), (6, 76, 1), (7, 72, 1), (8, 74, 2), (10, 76, 1), (11, 79, 1), (12, 83, 3), (15, 81, 1)]
for b0, h in ((4, HOOK_A), (12, HOOK_B), (29, HOOK_A), (36, HOOK_B)):
    S.hook(b0 * B, [n for n in h if b0 * B + n[0] * B / 2 < FIN], 1.0, inst=S.lead)
S.hook(FIN, [(0, 81, 6)], 1.0, inst=S.lead)

# —— 00 封面：第一帧一记和弦重拍；四拍滤波打开；冲进青色圆片（风声往上 + 滑音）——
S.sfx(S.stab([57, 60, 64, 69], 0.4), 0, 0.55, send=0.3)
S.place(S.crash(1.0), 0, 0.7, 0.2, send=0.2)
S.sfx(S.riser(fr(TL['iris'][1] - TL['iris'][0]), 0.9, 300, 9000), fr(TL['iris'][0]), 0.5)
S.sfx(S.whistle(76, 88, 0.3), fr(TL['iris'][1] - 18), 0.16, 0.2)
S.place(S.crash(0.9), fr(TL['s1']), 0.75, -0.2, send=0.2)

# —— 01 叠：三张片子甩进来三声“唰”；每叠出一种颜色一个和弦音（钟琴，走和弦往上）——
for k, at in enumerate(TL['films']):
    S.sfx(S.whoosh(0.28, 400, 8000, 1.0, 0.6), fr(at - 8), 0.55, [-0.6, 0.6, 0.0][k], send=0.2)
    S.sfx(S.clack(0.8), fr(at + 10), 0.35, [-0.6, 0.6, 0.0][k])
for k, at in enumerate(TL['labels']):
    for j, m in enumerate(S.chord(at)[2]):
        S.sfx(S.bell(m + 12 + 12 * (k // 2), 0.9, 0.5), fr(at + j * 1.5), 0.32, -0.3 + 0.2 * k, send=0.4)
S.transition(TL['push1'][1] - 12, True, 0.8)

# —— 02 台阶：十个字落十级台阶，一级一个下行音（A 小调音阶往下走）+ 木块“咚”；最后全体一跳 ——
SCALE = [88, 86, 84, 83, 81, 79, 77, 76, 74, 72]
for i in range(10):
    at = TL['stairs0'] + i * TL['stairStep']
    S.sfx(S.thock(SCALE[i] - 12, 1.0), fr(at), 0.55, -0.6 + 0.13 * i, send=0.15)
    S.sfx(S.tink(SCALE[i], 0.8, 0.12), fr(at), 0.3, -0.6 + 0.13 * i, send=0.3)
S.sfx(S.whistle(84, 72, 0.22), fr(TL['stairWave']), 0.12)
S.sfx(S.riser(fr(TL['zoomO'][1] - TL['zoomO'][0]), 0.8, 500, 10000), fr(TL['zoomO'][0]), 0.5)
S.place(S.crash(1.0), fr(TL['zoomO'][1]), 0.8, 0.2, send=0.25)
S.sfx(S.stab([57, 60, 64, 69], 0.3), fr(TL['zoomO'][1]), 0.4, send=0.3)

# —— 03 字距：每一拍一开一合（撑开往上滑，挤紧往下滑）——
prev = -150
for at, v in zip(TL['track'], [0, 300, -150, 700]):
    up = v > prev
    S.sfx(S.zip(60 if up else 84, 84 if up else 60, 0.16), fr(at - 2), 0.7, 0.0)
    S.sfx(S.clack(0.6), fr(at + 8), 0.3, 0.3 if up else -0.3)
    prev = v
S.sfx(S.whoosh(0.4, 6000, 300, 0.9, 0.3), fr(TL['toGrid'][0]), 0.45)

# —— 04 网格：块一个个落进格子（咔咔咔）；打碎那一拍一记重拍 + 每块吸到栏线一声“咔”——
for i in range(8):
    S.sfx(S.clack(0.7), fr(TL['blocks0'] + i * 3 + 6), 0.35, -0.5 + 0.14 * i)
for t0 in (TL['break'], TL['break2']):
    S.sfx(S.stab(S.chord(t0)[2] + [S.chord(t0)[2][0] + 12], 0.25), fr(t0), 0.45, send=0.3)
    S.sfx(S.whoosh(0.2, 800, 6000, 0.8, 0.4), fr(t0 - 4), 0.35)
    for i in range(8):
        S.sfx(S.clack(0.9), fr(t0 + i * 2 + 9), 0.4, -0.6 + 0.17 * i)
# 网点长大连成黑：往上冲的风 → 一拍全空（只有低频的“嗡”）
S.sfx(S.riser(fr(TL['dots4'][1] - TL['dots4'][0]), 1.0, 300, 11000), fr(TL['dots4'][0]), 0.55)
S.sfx(S.boom(1.0, 90, 33, 1.2), fr(TL['s5']), 0.8, send=0.3)

# —— 05 网点：从一颗点里退出来（风声往下）；色阶一格一个音；光转过去一声长和弦 ——
S.sfx(S.whoosh(0.9, 9000, 200, 1.0, 0.15), fr(TL['s5']), 0.5)
for i in range(6):
    S.sfx(S.tink(69 + [0, 3, 7, 12, 15, 19][i], 0.8, 0.2), fr(TL['s5'] + 50 + i * 3), 0.35, -0.3 + 0.12 * i, send=0.35)
S.sfx(S.swell([57, 64, 69, 72], 1.2, 0.6), fr(TL['light'][0]), 0.25, send=0.5)
# 品红线网扫过去
S.sfx(S.whoosh(0.4, 300, 9000, 1.0, 0.7), fr(TL['lines'][0] - 6), 0.55)
S.place(S.crash(1.0), fr(TL['s6']), 0.8, 0.0, send=0.25)

# —— 06 用起来：一拍一推，每推一张一声“唰” + 一下和弦重拍 ——
for k, at in enumerate(TL['layouts'][1:]):
    S.sfx(S.whoosh(0.24, 500, 9000, 1.0, 0.7), fr(at - 12), 0.45, [-0.5, 0.0, 0.5, 0.0, -0.5][k])
    S.sfx(S.stab(S.chord(at)[2], 0.18), fr(at), 0.28, send=0.2)

# —— 07 收束：起势一拍（倒放的镲 + 风）→ NEW 砸下 → WAVE 走台阶 → 印版“咔”地对准 → 最后一砸 ——
S.sfx(S.whoosh(0.3, 400, 9000, 1.0, 0.7), fr(TL['push7'][0]), 0.55)
S.sfx(S.riser(fr(B), 0.9, 400, 12000), fr(BUILD[0]), 0.55)
for k in range(3):
    S.sfx(S.whoosh(0.22, 500, 7000, 0.8, 0.6), fr(TL['s7'] + 2 + 6 * k), 0.4, [-0.6, 0.6, 0.0][k])
S.place(S.crash(1.0), fr(TL['slam']), 0.9, 0.0, send=0.3)
S.sfx(S.stab([45, 57, 60, 64, 69], 0.5), fr(TL['slam']), 0.6, send=0.35)
for i in range(4):
    S.sfx(S.thock([81, 79, 76, 72][i] - 12, 1.0), fr(TL['wave'] + i * 7), 0.5, -0.5 + 0.33 * i)
S.sfx(S.clack(1.0), fr(TL['register']), 0.7)
S.sfx(S.stab([57, 60, 64], 0.2), fr(TL['register']), 0.35, send=0.3)
S.sfx(S.whoosh(0.25, 600, 8000, 0.8, 0.6), fr(TL['card'] + 4), 0.35, 0.6)
S.sfx(S.rev_cymbal(0.3, 1.0), fr(FIN) - 0.3, 0.6, send=0.3)
S.sfx(S.slam(33, 1.0), fr(FIN), 0.85, send=0.35)
S.sfx(S.stab([45, 57, 60, 64, 69, 76], 1.4), fr(FIN), 0.65, send=0.45)
S.place(S.crash(1.0), fr(FIN), 1.0, 0.0, send=0.4)
S.place(S.kick(1.2), fr(FIN), 1.0)

# —— 屏幕上每次出字一声（来自页面登记的 cue；第 0 帧之前已经在的字不出声）——
cues = [c for c in json.loads((HERE / 'events.json').read_text())['cues'] if c[0] >= 0]
S.text_cues(cues, 0.6)
S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'new-wave.wav'), loop=False)
