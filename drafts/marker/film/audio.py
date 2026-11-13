"""马克笔 v3 · 配乐（一整首歌，约 19 秒，六个场景）。144 BPM（一拍 = 25 帧，一小节 = 100 帧，第一小节的重拍在第 50 帧），G 大调，
G — D — Em — C 每小节一个和弦。明亮的放克流行：紧的底鼓、二四拍拍手、十六分闭镲、八度跳的贝斯、电钢琴反拍和弦，
主旋律 = 拨弦 + 马林巴 + 一点方波（记得住的四小节，后半段升八度再来一遍）。

招牌声音是**笔头擦纸**：每一笔一声，长短 = 这一笔画了多久，音量 = 笔速。它不是宽带噪声——
一道窄带（调到当前和弦音的高八度泛音）+ 一点点高频纤维声 + 落笔的“嗒”，压在鼓下面 8 dB 左右，和十六分闭镲是同一个格子。
同一个 1/16 拍格子里同时起好几笔（网页里四张卡一起画）只出一声，音量随笔数加。
其余：拔帽“啵”、倒带、巨笔扫过（低音的擦纸 + 风 + 镲落在小节线上）、设备落到桌上“咚”、长按积墨（鼓停，一个和弦鼓起来）、
页面滚动、点色块“嗒 + 啵”、卡片滑走、开关、进度条灌满、白点“叮”、白色巨笔（钢片琴往上刮）、扣帽“咔哒”。
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
CAPON = EV['capOn']
DW, DWL = EV['dwell'], EV['dwellLen']
HITS = EV['hits']

# ================= 乐队 =================
BRK = [(CAPON - 50, CAPON)]          # 扣帽前半小节：鼓停（积墨那一下鼓不停了——主人：“第 5 秒好像有停顿”）
REVEAL = EV['opening']['reveal']                     # v5：开场是微距，鼓在镜头拉开、整辆车出现的那一拍（第 150 帧）才进
S.drums(REVEAL, CAPON, skip=BRK, level=0.9)
for fm in np.arange(REVEAL, CAPON, BEAT / 4):
    if not any(a <= fm < z for a, z in BRK):
        S.place(S.shaker(0.8), fr(fm), 0.55 if (fm - 50) % (BEAT / 2) else 0.3, 0.35)
S.bassline(REVEAL, CAPON, level=1.0)
S.pad(0.9, wave='saw', fc=1500)


def epiano(ms, d=0.22):
    t = S.tt(d + 0.25)
    y = np.zeros_like(t)
    for m in ms:
        f = S.midi(m)
        y += (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.08) + 0.12 * np.sin(2 * np.pi * 7 * f * t) * np.exp(-t / 0.01))
    return y * np.minimum(1, t / 0.003) * np.where(t < d, np.exp(-t / 0.4), np.exp(-d / 0.4) * np.exp(-(t - d) / 0.06)) * 0.25


for fm in np.arange(REVEAL + BEAT / 2, CAPON, BEAT):
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
for i in range(20):
    b0 = 50 + i * BAR
    if b0 < REVEAL:
        continue
    if b0 + BAR > CAPON + 1:
        break
    notes = PH[i % 4]
    oct_ = 12 if i >= 4 else 0
    S.hook(b0, [(p, m + oct_, ln) for p, m, ln in notes], 1.0, inst=lead)

# ================= 开场：海报 → 拔帽 → 第一组巨笔 =================
# ================= 开场（v5）：放大 40 倍的一笔 → 镜头往外拉 → 整辆车 =================
# 微距：很安静，笔头离开纸面一声湿的“啵”，积墨渗开是一个慢慢亮起来的和弦；字一个个出来
S.sfx(S.bop(52, 0.9, 0.25), fr(1), 0.55, 0.3, send=0.4)
S.sfx(S.strings([55, 62, 67, 71], 2.6, 1.0, att=0.04, rel=0.8, bright=2600), fr(0), 0.5, 0, send=0.5)
S.sfx(S.celesta(79, 2.0, 1.0), fr(0), 0.4, 0.1, send=0.6)
S.sfx(S.swell([55, 62, 67, 71], 2.2, 1.0), fr(0), 0.45, 0, send=0.6)
S.sfx(S.celesta(83, 2.0, 0.9), fr(10), 0.35, 0.2, send=0.6)
S.sfx(S.celesta(86, 2.0, 0.8), fr(34), 0.3, -0.2, send=0.6)
for k in range(11):
    S.sfx(S.type_tick(S.tone(6 + k * 1.8, k % 3, 2), 0.7), fr(6 + k * 1.8), 0.35, -0.4 + 0.08 * k, send=0.15)
# 拉开：风 + 上行的 riser，钢片琴越来越密，落在第 150 帧（小节线）全乐队 + 镲 + 底鼓
S.sfx(S.riser(fr(REVEAL - 50), 0.9, 300, 7000), fr(50), 0.45, 0, send=0.3)
S.sfx(S.whoosh(1.2, 200, 5000, 1.0, 0.75), fr(REVEAL - 72), 0.55, -0.3, send=0.3)
for k in range(10):
    S.sfx(S.celesta([67, 71, 74, 79, 83, 86, 91, 95, 98, 103][k], 0.6, 0.7), fr(REVEAL - 40 + k * 4), 0.22, -0.5 + 0.1 * k, send=0.4)
S.sfx(S.rev_cymbal(0.5, 1.0), fr(REVEAL) - 0.5, 0.55, 0, send=0.3)
S.place(S.crash(1.0), fr(REVEAL), 0.75, 0.1, send=0.4)
S.place(S.kick(1.3), fr(REVEAL), 1.0); S.kicks.append(REVEAL)
S.sfx(S.boom(0.9, 110, 40, 0.8), fr(REVEAL), 0.5)

# ================= 换场景：一组巨笔扫满屏幕（风 + 低音擦纸，扫完那一帧镲 + 底鼓）=================
for i, h in enumerate(HITS):
    if h <= 0:          # v5：第一个场景没有巨笔换场（开场是微距）
        continue
    S.sfx(S.whoosh(0.42, 220, 5200, 1.0, 0.7), fr(h - 22), 0.65, -0.5 + 0.2 * i, send=0.3)
    for j in range(3):
        S.sfx(S.nib(0.1, 1.0, S.tone(h, j, -1), 0.55, 'press'), fr(h - 16 + j * 5), 0.35, -0.4 + 0.4 * j, send=0.15)
    S.place(S.crash(1.0), fr(h), 0.7, 0.1, send=0.4)
    S.place(S.kick(1.25), fr(h), 1.0); S.kicks.append(h)
    S.sfx(S.boom(0.7, 120, 42, 0.5), fr(h), 0.4)

# ================= 笔触：同一个十六分音符格子只出一声 =================
TOOLV = {'marker': (0.17, 1.0), 'pencil': (0.11, 1.5), 'liner': (0.09, 1.7), 'white': (0.12, 1.8)}
slots = {}
for s in EV['strokes']:
    if s['layer'] == 'swipe':
        continue
    k = int(round((s['t'] - 50) / (BEAT / 4)))
    slots.setdefault(k, []).append(s)
for k, ss in sorted(slots.items()):
    at = min(s['t'] for s in ss)
    s = max(ss, key=lambda s: s['len'])
    lv, br = TOOLV.get(s['kind'], TOOLV['marker'])
    lv *= min(1.5, 0.75 + 0.18 * (len(ss) - 1)) * min(1.2, 0.7 + s['len'] / 900)
    d = fr(min(8, max(s['d'] for s in ss)))
    S.sfx(S.nib(d, 1.0, S.tone(at, k % 3, 1), br, 'press'), fr(at), lv, float(np.clip(np.sin(k * 0.7) * 0.5, -0.6, 0.6)), send=0.08)

# 02 规则 ③：笔停在鞋头上——鼓停，一个和弦慢慢鼓起来，墨晕开时一声铃
S.sfx(S.swell([67, 71, 74, 79], fr(DWL + 10), 1.0), fr(DW), 0.4, 0, send=0.6)
S.sfx(S.glide(55, 48, 0.35, 0.8), fr(DW + 2), 0.22, 0, send=0.4)
S.sfx(S.bell(86, 0.7, 1.4), fr(DW + DWL * 0.6), 0.32, 0.2, send=0.6)
# 03 规则 ①：灰笔一遍、两遍、三遍——马林巴往下走三个音（越来越深）
for j, m in enumerate([79, 74, 67]):
    S.sfx(S.marimba(m, 1.0), fr(EV['gray'] + 10 + j * 12), 0.45, -0.3 + 0.3 * j, send=0.3)
# 04 网页：点击 + 滚动 + 卡片弹出
S.sfx(S.click(1.0, lo=1500, hi=6000, d=0.006), fr(EV['click']), 0.6, 0.0)
S.sfx(S.bop(S.tone(EV['click'], 2, 1), 0.9, 0.18), fr(EV['click']), 0.45, 0.0, send=0.3)
S.sfx(S.whoosh(0.4, 400, 3000, 0.7, 0.5), fr(EV['scroll']), 0.35, 0.0, send=0.2)
for k, t in enumerate(EV['cards']):
    S.sfx(S.bop(S.tone(t, k, 1), 0.9, 0.18), fr(t - 4), 0.5, -0.5 + 0.33 * k, send=0.3)
# 05 App：点色块“嗒 + 啵”、卡片滑走、进度条灌满
for k, t in enumerate(EV['taps']):
    S.sfx(S.click(1.1, lo=1500, hi=6000, d=0.006), fr(t), 0.55, 0.3)
    S.sfx(S.bop(S.tone(t, k + 1, 1), 1.0, 0.18), fr(t), 0.5, 0.3, send=0.3)
    S.sfx(S.whoosh(0.22, 600, 4500, 0.7, 0.5), fr(t + 2), 0.25, -0.2)
S.sfx(S.riser(0.28, 0.6, 600, 5000), fr(EV['prog']), 0.3, 0.2)
# 06 白：一道一声高音，白点钢片琴往上
S.sfx(S.shimmer(0.8, 0.8), fr(EV['white']), 0.3, send=0.5)
for k, t in enumerate(EV['dots']):
    S.sfx(S.tink([95, 98, 103, 107][k % 4], 0.8, 0.2), fr(t), 0.22, -0.4 + 0.25 * (k % 4), send=0.4)

# ================= 画完的东西动起来 =================
# 车开走：先蹲（低音）→ 引擎一轰 + 风
dv = EV['drive']
S.sfx(S.engine(0.9, 60, 230, 1.0, 0.7), fr(dv - 5), 0.7, 0.2, send=0.15)
S.sfx(S.whoosh(0.45, 300, 6000, 1.0, 0.4), fr(dv + 2), 0.5, -0.5, send=0.2)
# 球鞋翻一圈：蹲 → 往上“咻” → 落地“咚”+ 弹簧
hp = EV['hop']
S.sfx(S.glide(55, 79, 0.3, 0.8), fr(hp), 0.35, 0, send=0.3)
S.sfx(S.whoosh(0.5, 400, 5000, 1.0, 0.5), fr(hp + 4), 0.45, 0.3, send=0.2)
S.sfx(S.thock(43, 1.0), fr(hp + 30), 0.6, 0, send=0.2)
S.sfx(S.boing(55, 0.9), fr(hp + 31), 0.45, 0, send=0.3)
# 窗户一层层亮：钢片琴往上走
for k, t in enumerate(EV['lights'][::2]):
    S.sfx(S.celesta([79, 83, 86, 88, 91, 95, 98][k % 7], 0.9, 0.8), fr(t), 0.3, -0.4 + 0.12 * k, send=0.5)
# 卡片里的东西：鞋翻、耳机弹、椅子摇、台灯晃
for k, (n, t) in enumerate(EV['cardAnim']):
    S.sfx(S.bop(S.tone(t, k, 1), 0.9, 0.2), fr(t), 0.45, -0.5 + 0.33 * k, send=0.3)
    if n in ('chair', 'lamp'):
        S.sfx(S.boing(60 + 3 * k, 0.6), fr(t + 2), 0.3, -0.5 + 0.33 * k)
# 大字一个个跳起来：马林巴往上走
for k in range(6):
    S.sfx(S.marimba([67, 71, 74, 79, 83, 86][k], 1.0), fr(EV['wave'] + k * 4), 0.45, -0.5 + 0.2 * k, send=0.3)
    S.sfx(S.thock(48 + k, 0.5), fr(EV['wave'] + k * 4 + 16), 0.22, -0.5 + 0.2 * k)

# ================= 收束：扣帽 =================
S.sfx(S.whoosh(0.4, 500, 4000, 0.8, 0.7), fr(CAPON - 46), 0.35, 0.5)
S.sfx(S.rev_cymbal(0.4, 1.0), fr(CAPON) - 0.4, 0.5, send=0.3)
S.sfx(S.cap(1.0, False), fr(CAPON), 1.0, 0.25, send=0.25)
S.place(S.kick(1.3), fr(CAPON), 1.0); S.kicks.append(CAPON)
S.place(S.sbass(31, 1.2), fr(CAPON), 0.5, bus=S.PUMP)
S.place(S.crash(1.0), fr(CAPON), 0.6, send=0.5)
S.place(epiano([55, 59, 62, 67, 71], 1.0), fr(CAPON), 0.9, 0, send=0.4)
for k, m in enumerate([79, 83, 86, 91]):
    S.sfx(S.celesta(m, 1.2, 0.9), fr(CAPON + 3 + k * 3), 0.45, -0.3 + 0.2 * k, send=0.5)

S.text_cues(EV['cues'], 0.7)
S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
