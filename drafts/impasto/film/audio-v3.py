"""厚涂 v3 配乐：电影感的管弦，D 小调 → F 大调，120 BPM（一拍 30 帧），36 拍 + 余音。
四幅画 = 四段（同一首歌，换段落不换乐队），每一幅盖上来的那一拍一记冲击（低铜管 + 定音鼓 + 大刷子的“唰——”）：
  A 雨夜（0—6 拍）：低音钢琴八度 + 弦乐垫 + 雨声，钢琴唱四小节的动机
  B 麦田（6—14 拍）：暖起来——降 B / F / C / Dm，弦乐八分音符跳弓，单簧管接动机
  C 浪（14—22 拍）：最紧的一段——太鼓八分音符、弦乐十六分音符、圆号吹长音、人声垫
  D 雪山（22—29 拍）：副歌——高音弦乐唱完整的旋律，铜管和弦，定音鼓
  E 片尾（29—36 拍）：写字 → 第 32 拍署名落在 F 大调主和弦，第 33 拍一笔红
刷子的声音跟着同时在画的笔数走（大笔低、小笔高），压得比上一版低，不刺耳。
python3 audio.py out.wav（动作时刻来自 node ../../_lib/events.cjs film.html events.json）"""
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from band import Band  # noqa: E402

EV = json.loads((HERE / 'events.json').read_text())
TL, END, BEAT = EV['TL'], EV['end'], EV['beat']
ARR = [s for s in EV['scenes'][1:]]                           # 麦田 / 浪 / 雪山盖上来的帧
Dm, Bb, F_, C_, Gm, A7, Dm9, Fmaj = [38, 50, 57, 62, 65], [34, 50, 53, 58, 62], [41, 53, 57, 60, 65], [36, 52, 55, 60, 64], [43, 50, 55, 58, 62], [45, 49, 52, 55, 61], [38, 52, 57, 62, 65], [41, 53, 57, 60, 64, 69]
PROG = [(0, Dm), (4, Dm9), (6, Bb), (8, F_), (10, C_), (12, Dm), (14, Gm), (16, Dm), (18, A7), (20, Dm),
        (22, F_), (24, C_), (26, Dm), (28, Bb), (30, C_), (32, Fmaj)]
CH = [(int(b * BEAT), c[0], c[1:]) for b, c in PROG]
S = Band(END, CH, beat=BEAT, seed=44, tail=4.0)
fr = S.fr
rng = np.random.default_rng(9)
chord_at = lambda b: [c for bb, c in PROG if bb <= b + 1e-6][-1]
sec = lambda b: 'A' if b < 6 else 'B' if b < 14 else 'C' if b < 22 else 'D' if b < 29 else 'E'
hum = lambda: float(rng.uniform(-.2, .2))
NB = 36

# ───── 低音：钢琴八度（A、E）/ 弦乐低音 + 次低音（B—D）
for i, (bb, ch) in enumerate(PROG):
    nb = PROG[i + 1][0] if i + 1 < len(PROG) else NB
    d = (nb - bb) * BEAT / 60
    s = sec(bb)
    S.put('keys', S.grand(ch[0], min(4.0, d + 1.5), .75) + S.grand(ch[0] + 12, min(4.0, d + 1.5), .6), beat=bb, gain=1.2, pan=-.1)
    lvl = {'A': 1.1, 'B': .9, 'C': 1.1, 'D': 1.2, 'E': 1.1}[s]
    S.put('pad', S.strings([m + 12 for m in ch[1:]] + [ch[1]], d + .1, lvl, att=.4 if s == 'A' else .2, rel=.7, bright=2000 if s in 'AB' else 2800), beat=bb, gain=4.5)
    if s in 'BCD':
        S.put('bass', S.strings([ch[0], ch[0] + 12], d + .05, 1.0, att=.08, rel=.4, bright=900), beat=bb, gain=4.0)
        S.put('bass', S.sub(ch[0] + 12, d * .95, .7), beat=bb, gain=.8)
    if s in 'CD':
        S.put('pad', S.choir([m + 12 for m in ch[1:4]], d + .2, 1.0), beat=bb, gain=2.0 if s == 'C' else 2.6)
    if s == 'D':
        S.put('brass', S.brass([m + 12 for m in ch[1:]], d * .9, .7, scoop=False, bright=.6), beat=bb, gain=.5)

# ───── 节奏：弦乐跳弓（B 八分、C 十六分），太鼓（C），定音鼓（D）
for k in range(6 * 4, 29 * 4):
    b = k / 4
    s = sec(b)
    if s == 'B' and k % 2:
        continue
    ch = chord_at(b)
    m = [ch[1], ch[2], ch[3], ch[2]][(k // (2 if s == 'B' else 1)) % 4] + 12
    acc = 1.0 if k % 4 == 0 else .7
    S.put('keys', S.strings([m], .09, acc, att=.006, rel=.06, bright=3200, vib=0), frame=b * BEAT + hum(), gain=3.2 if s == 'B' else 3.6, pan=-.4 + .8 * ((k % 4) / 3))
for b2 in range(14 * 2, 22 * 2):
    b = b2 / 2
    S.put('drums', S.tom(45 if b2 % 4 == 0 else 50, .9 if b2 % 2 == 0 else .6), beat=b, gain=.55, pan=-.3 + .6 * (b2 % 3) / 2)
    if b2 % 4 == 0:
        S.kick_at(b * BEAT, .9)
for b in range(22, 29):
    S.put('drums', S.timpani(chord_at(b)[0] + 12, .9 if b % 2 == 0 else .6), beat=b, gain=.6)
    if b % 2 == 0:
        S.kick_at(b * BEAT, .8)
for b in range(6, 14, 2):
    S.kick_at(b * BEAT, .6)
# 雨夜那段：一拍两下很轻的边击，像钟表
for b2 in range(0, 12):
    S.put('drums', S.rim(.5), beat=b2 / 2, gain=.12, pan=.3)

# ───── 旋律：A 钢琴 · B 单簧管 · C 圆号（铜管） · D 高音弦乐八度 + 钢琴
A_MEL = [(1, 69, .5), (1.5, 74, .5), (2, 76, 1), (3, 77, 1.5), (4.5, 76, .5), (5, 74, 1)]
B_MEL = [(6, 77, 1), (7, 79, .5), (7.5, 81, 1.5), (9, 79, .5), (9.5, 77, .5), (10, 76, 1), (11, 72, 1), (12, 74, 1.5), (13.5, 76, .5)]
C_MEL = [(14, 62, 2), (16, 65, 1), (17, 64, 1), (18, 61, 2), (20, 62, 2)]
D_MEL = [(22, 81, 1), (23, 84, 1), (24, 79, 1.5), (25.5, 77, .5), (26, 81, 1), (27, 77, 1), (28, 74, 1), (28.5, 77, .5)]
for o, m, d in A_MEL:
    S.put('lead', S.grand(m + 12, 2.0, .8), frame=o * BEAT + hum(), gain=2.0, pan=.15)
    S.put('lead', S.strings([m], d * BEAT / 60, .8, att=.1, rel=.5, bright=2600), beat=o, gain=2.0)
for o, m, d in B_MEL:
    S.put('lead', S.clarinet(m, d * BEAT / 60 * .95, 1.0), beat=o, gain=.75, pan=.1)
    S.put('lead', S.grand(m + 12, 1.2, .5), beat=o, gain=.6, pan=.2)
for o, m, d in C_MEL:
    S.put('brass', S.brass([m, m + 12], d * BEAT / 60, .9, scoop=True, bright=.7), beat=o, gain=.8)
for o, m, d in D_MEL:
    S.put('lead', S.strings([m, m - 12], d * BEAT / 60, 1.0, att=.04, rel=.5, bright=3600), beat=o, gain=3.2)
    S.put('lead', S.grand(m + 12, 1.5, .6), beat=o, gain=.6, pan=.2)

# ───── 每一幅画盖上来：前面一段吸进来（倒放钢琴 + 上行），正中一记（低铜管 + 定音鼓 + 底鼓）
for k, f in enumerate(ARR):
    S.put('pad', S.swell([m + 12 for m in chord_at(f / BEAT)[1:4]], .9, 1.0), frame=f - 54, gain=.5)
    S.sfx(S.riser2(1.0, 1.0), fr(f) - 1.0, .25, 0, send=.2)
    S.sfx(S.hit(1.0, chord_at(f / BEAT)[0] - 7), fr(f), .5 + .1 * k, 0, send=.25)
    S.put('brass', S.brass([chord_at(f / BEAT)[0], chord_at(f / BEAT)[0] + 12], 1.2, 1.0, scoop=False, bright=.5), frame=f, gain=.8)
    S.put('drums', S.crash(1.0), frame=f, gain=.16, pan=.2)
    S.kick_at(f, 1.0, 1.2)
    S.sfx(S.whoosh(1.1, 200, 3500, 1.0, .35), fr(f) - .2, .45, -.4 + .4 * k, send=.15)

# ───── 第 0 帧（封面）：一记低音 + 定音鼓 + 弦乐一下子进来
S.put('drums', S.timpani(38, 1.0, 2.5), frame=0, gain=.6)
S.kick_at(0, .9, 1.1)
S.put('brass', S.brass([38, 50], 1.4, .9, scoop=False, bright=.45), frame=0, gain=.7)
S.sfx(S.brush(.9, .4, True), fr(0), .5, .2, send=.2)

# ───── 片尾：写字的刷声，第 32 拍主和弦，第 33 拍一笔红
E = TL['sign']
S.put('drums', S.timpani(41, 1.2, 3.0), frame=E, gain=.8)
S.kick_at(E, 1.0, 1.3)
S.put('drums', S.crash(1.2), frame=E, gain=.22)
S.put('pad', S.strings([41, 53, 57, 60, 64, 69, 72], 3.5, 1.3, att=.03, rel=1.8, bright=3000), frame=E, gain=5.0)
S.put('brass', S.brass([53, 57, 60, 65], 1.6, 1.0, bright=.8), frame=E, gain=.7)
S.put('keys', sum(S.grand(m, 4.0, .8) for m in [29, 41, 53, 57, 60, 64, 69]), frame=E, gain=.8)
S.put('pad', S.choir([57, 60, 64, 69], 3.5, 1.0), frame=E, gain=2.2)
S.put('lead', S.grand(81, 3.0, .8) + S.grand(88, 3.0, .5), frame=TL['under'], gain=.9)
S.sfx(S.brush(.8, .22, True), fr(TL['under']), .5, -.3, send=.2)

# ───── 雨（只在第一幅）+ 刷子（跟着笔数）+ 高光一下一下“嗒”
n = int(fr(END) * S.SR); tsec = np.arange(n) / S.SR
rain = S.fft_filter(S.rng.standard_normal(n), lo=800, hi=7000) + .6 * S.fft_filter(S.rng.standard_normal(n), lo=200, hi=900)
drops = np.zeros(n); idx = S.rng.integers(0, n, 5000); drops[idx] = S.rng.uniform(.2, 1, len(idx)); drops = np.convolve(drops, np.exp(-np.arange(200) / 30), 'same')
renv = 1 - np.clip((tsec * 60 - ARR[0]) / 70, 0, 1)
S.SFX[0, :n] += (rain * .016 + drops * .01) * renv; S.SFX[1, :n] += (rain * .016 + np.roll(drops, 777) * .01) * renv


def bed(counts, lo, hi, gain, smooth=7):
    c = np.convolve(np.array(counts, float), np.ones(smooth) / smooth, 'same'); c = c / max(1, c.max())
    env = np.interp(tsec * 60, np.arange(len(c)), np.clip(c, 0, 1)) ** .8
    noise = S.fft_filter(S.rng.standard_normal(n), lo=lo, hi=hi)
    wob = 1 + .35 * np.sin(2 * np.pi * 3.1 * tsec) * np.sin(2 * np.pi * .7 * tsec)
    pan = .5 * np.sin(tsec * 1.3)
    S.SFX[0, :n] += noise * env * wob * gain * (1 - pan); S.SFX[1, :n] += noise * env * wob * gain * (1 + pan)


bed(EV['big'], 200, 1800, .14); bed(EV['mid'], 400, 3200, .08); bed(EV['small'], 1200, 5000, .04); bed(EV['title'], 400, 3500, .1)
last = -9
for f, c in enumerate(EV['hi']):
    if c and f - last >= 4:
        S.put('keys', S.celesta(S.tone(f, int(f) % 5, 2), .8, .5), frame=f, gain=.35, pan=float(np.sin(f)) * .5); last = f
for k, f in enumerate(EV['palette']):
    S.sfx(S.poof(.9, .2, 700), fr(f + 2), .3, -.5 + .3 * k, send=.3)
    S.put('keys', S.celesta([69, 72, 76, 81][k] + 12, 1.0, .8), frame=f + 2, gain=.6, pan=-.5 + .3 * k)
S.text_cues(EV['cues'], .4)
S.mix(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), levels=dict(keys=1.0, lead=.9, pad=1.2, drums=.7, bass=.85, brass=.75), room=1.4, plate=.9, air=.5)
