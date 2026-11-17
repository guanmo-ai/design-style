"""铅笔原画 v3 配乐：老卡通片的大乐队摇摆（swing），F 大调，144 BPM（一拍 25 帧），40 拍 + 余音。
画面上的每个动作都“米老鼠化”（mickey-mousing）——声音和动作一一对上：
  A 透光台（0—4 拍）：第 0 帧一记铜管，第 1 拍落地
  B 原野（4—13.5 拍）：整个乐队进来——行走贝斯、刷子 + 骑镲的摇摆、钢琴反拍、单簧管唱主题；袋子每跳一下落在一拍上
  C 拖影帧（13.5—18 拍）：鼓撤掉，滑哨一路往下掉、军鼓滚奏，第 17 拍“啪”——全乐队齐奏 + 镲
  D 间距表（18—28 拍）：减半的律动，电钢琴 + 骑镲；刻度落下一个一声木琴，曲线一描一串上行，手柄一拉滑哨往上冲 + 弹簧
  E 一墙 24 张（28—34 拍）：每亮一张一声木琴（一秒 12 个音，正好是一秒 12 张）
  F 回到透光台（34—40 拍）：最后一跳第 36 拍落地，签名，“嗒—哒！”收尾
翻页：一串纸响 + 风声。python3 audio.py out.wav（动作时刻来自 node ../../_lib/events.cjs film.html events.json）"""
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from band import Band  # noqa: E402

EV = json.loads((HERE / 'events.json').read_text())
END, BEAT, FLIP, TC = EV['end'], EV['beat'], EV['FLIP'], EV['TC']
F6, D7, Gm7, C7, Bb6, F69, Am7 = [41, 57, 60, 62, 65], [38, 54, 57, 60, 62], [43, 58, 62, 65, 67], [36, 52, 55, 58, 62], [46, 55, 58, 62, 65], [41, 57, 60, 62, 67], [45, 55, 60, 64, 67]
# 两拍一个和弦（经典的 I–VI7–ii7–V7 转圈）
CYCLE = [F6, D7, Gm7, C7]
PROG = [(b, CYCLE[(b // 2) % 4]) for b in range(0, 40, 2)]
PROG[17] = (34, Bb6); PROG[18] = (36, F69); PROG[19] = (38, F69)
CH = [(b * BEAT, c[0], c[1:]) for b, c in PROG]
S = Band(END, CH, beat=BEAT, seed=27, tail=3.5, swing=.34)
fr = S.fr
rng = np.random.default_rng(3)
chord_at = lambda b: [c for bb, c in PROG if bb <= b + 1e-6][-1]
B_RUN, B_SMEAR, B_CHART, B_WALL, B_DESK = 4, (FLIP['b'][0] + FLIP['b'][1]) / 2 / BEAT, (FLIP['c'][0] + FLIP['c'][1]) / 2 / BEAT, (FLIP['d'][0] + FLIP['d'][1]) / 2 / BEAT, EV['ZOOM'][1] / BEAT
SPLAT = 425 / BEAT
sec = lambda b: 'A' if b < B_RUN else 'B' if b < B_SMEAR else 'C' if b < B_CHART else 'D' if b < B_WALL else 'E' if b < B_DESK else 'F'
LANDS = [l for l in EV['lands'] if l != 160]

# ───── 鼓：骑镲的摇摆（叮—叮嗒叮）+ 二四拍的刷子 / 军鼓 + 轻的底鼓
for b in range(0, 40):
    s = sec(b)
    if s == 'C' or b >= 38:
        continue
    half = s == 'D'
    S.put('drums', S.ride(.8, .8), beat=b, gain=.18, pan=.35)
    if not half or b % 2:
        S.put('drums', S.ride(.55, .5), beat=b + .5, gain=.12, pan=.35)
    if b % 2:
        S.put('drums', S.brush(.8, .2, False), beat=b, gain=.2, pan=-.1)
        if s in 'BEF':
            S.put('drums', S.snare2(.6, wire=.5), beat=b, gain=.2)
    if s in 'BEF' and b % 2 == 0:
        S.kick_at(b * BEAT, .65)
    S.put('drums', S.hat2(.5), beat=b + (1 if b % 2 else 0) * 0, gain=.06, pan=-.4)

# ───── 行走贝斯：一拍一个音（根音 → 和弦音 → 半音靠近下一个根音）
for b in range(0, 40):
    s = sec(b)
    if s == 'C' or b >= 38:
        continue
    ch = chord_at(b)
    root = ch[0] - 12 if ch[0] > 40 else ch[0]
    nxt = chord_at(b + 1)[0]
    nxt = nxt - 12 if nxt > 40 else nxt
    pos = b % 2
    m = root if pos == 0 else (nxt + (1 if nxt < root else -1))
    if s == 'D' and pos:
        continue
    S.put('bass', S.upright(m + 12, .38, 1.0, .5), beat=b, gain=1.1)
    S.put('bass', S.sub(m + 12, .3, .6), beat=b, gain=.5)

# ───── 钢琴：反拍的和弦（Charleston 节奏：1 和 2 的后半拍）；D 段换电钢琴长和弦
for b in range(0, 40, 2):
    s = sec(b)
    ch = chord_at(b)
    if s in 'BEF' and b < 38:
        S.put('keys', sum(S.grand(m + 12, .5, .55) for m in ch[1:]), beat=b, gain=.55, pan=-.35)
        S.put('keys', sum(S.grand(m + 12, .4, .45) for m in ch[1:]), beat=b + 1.5, gain=.45, pan=-.35)
    if s == 'D':
        S.put('keys', sum(S.rhodes(m + 12, 2.0, .55) for m in ch[1:]), beat=b, gain=.7, pan=-.2)
    if s in 'BDEF':
        S.put('pad', S.strings([m + 12 for m in ch[1:]], 2 * BEAT / 60 + .05, .8, att=.15, rel=.4, bright=2400), beat=b, gain=7.0)

# ───── 主题：单簧管（B 段、E 段）
B_MEL = [(4, 72, .5), (4.5, 74, .5), (5, 77, 1), (6, 81, .5), (6.5, 79, .5), (7, 77, 1), (8, 74, .5), (8.5, 77, .5), (9, 79, 1.5), (10.5, 76, .5),
         (11, 72, .5), (11.5, 74, .5), (12, 77, 1)]
E_MEL = [(28, 81, .5), (28.5, 84, .5), (29, 86, 1), (30, 84, .5), (30.5, 81, .5), (31, 79, 1), (32, 77, .5), (32.5, 79, .5), (33, 81, 1)]
for o, m, d in B_MEL + E_MEL:
    S.put('lead', S.clarinet(m, d * BEAT / 60 * .92, 1.0), beat=o, gain=.8, pan=.12)

# ───── 铜管：第 0 帧一记；每次落地砸一下（原野那几下轮流：铜管 / 钢琴）
S.put('brass', S.brass([m + 12 for m in F6[1:]] + [77], .3, 1.0), frame=0, gain=.85)
for k, L in enumerate(LANDS):
    b = L / BEAT
    ch = chord_at(b)
    if L in (425, 900):
        continue
    if sec(b) == 'B' and k % 2:
        S.put('keys', S.marimba(ch[2] + 24, 1.0) + S.marimba(ch[-1] + 24, .8), frame=L, gain=.8, pan=.3)
        continue
    S.put('brass', S.brass([m + 12 for m in ch[1:]], .14 if L != 25 else .3, .9, scoop=True, bright=.8), frame=L, gain=.6 if L != 25 else .8)
for L in LANDS:
    S.sfx(S.poof(1.0, .22, 600), fr(L), .35, 0, send=.1)
# 起跳：木琴往上刷
for t in EV['takes']:
    for k, m in enumerate([65, 69, 72, 77, 81, 84]):
        S.put('keys', S.marimba(m + 12, .7), frame=t + k * 1.2, gain=.35, pan=-.3 + k * .12)

# ───── C：拖影帧——滑哨往下掉 + 军鼓滚奏 → 第 17 拍“啪”
c0, L = FLIP['b'][1], 425
t = S.tt((L - c0) / 60); u = t / t[-1]; fq = 1800 * 2 ** (-2.2 * u ** 1.3)
S.sfx(np.sin(2 * np.pi * np.cumsum(fq) / S.SR) * np.sin(np.pi * np.minimum(1, u * 1.1)) ** .4 * .25, fr(c0), .5, 0, send=.3)
for k in range(20):
    S.put('drums', S.snare2(.3 + .035 * k, wire=1.0), frame=c0 + k * (L - c0) / 20, gain=.22 + .015 * k, pan=-.1)
S.put('pad', S.strings([48, 55, 58, 64, 70], (L - c0) / 60, 1.2, att=(L - c0) / 60 * .9, rel=.2, bright=3000, swell=True), frame=c0, gain=8.0)
for k in range(16):
    S.put('drums', S.timpani(36, .3 + .04 * k, .6), frame=c0 + k * (L - c0) / 16, gain=.35)
S.kick_at(L, 1.0, 1.4)
S.put('drums', S.crash(1.2), frame=L, gain=.35)
S.put('brass', S.brass([53, 57, 60, 65, 69, 72], .7, 1.0, bright=1.0), frame=L, gain=1.0)
S.put('bass', S.upright(29, 1.2, 1.0, .4), frame=L, gain=1.1)
S.put('keys', sum(S.grand(m, 2.0, .8) for m in [29, 41, 53, 57, 60, 65]), frame=L, gain=.6)
S.sfx(S.boing(53, .9, .6), fr(L + 6), .35, .2, send=.2)

# ───── D：刻度落下一个一声木琴，曲线一描一串上行，手柄一拉滑哨往上 + 弹簧
scale = [65, 67, 69, 72, 74, 77, 79, 81, 84]
for i in range(9):
    S.put('keys', S.marimba(scale[i] + 12, .9), frame=TC['slide'][0] + i * (TC['slide'][1] - TC['slide'][0]) / 9, gain=.5, pan=-.5 + i * .12)
    S.put('keys', S.glock(scale[i] + 12, .8, .8), frame=TC['drop'][0] + i * 2 + 10, gain=.25, pan=-.5 + i * .12)
for k in range(12):
    S.put('keys', S.glock(scale[k % 9] + 24, .5, .5), frame=TC['curve'][0] + k * 2.2, gain=.18, pan=-.4 + k * .07)
for k in range(28):
    S.sfx(S.type_tick(scale[k % 9] + 12, .7, 1.0), fr(TC['code'][0] + k * (TC['code'][1] - TC['code'][0]) / 28), .12, .3, send=.05)
d0, d1 = TC['drag']
t = S.tt((d1 - d0) / 60); u = t / t[-1]; fq = 500 * 2 ** (1.4 * u ** .8)
S.sfx(np.sin(2 * np.pi * np.cumsum(fq) / S.SR) * np.sin(np.pi * u) ** .5 * .25, fr(d0), .45, .2, send=.35)
S.sfx(S.boing(72, .9, .5), fr(d1), .35, .2, send=.25)
for k in range(9):
    S.put('keys', S.marimba(scale[k] + 12, .7), frame=TC['ride'][0] + k * 2.2, gain=.35, pan=-.4 + k * .1)

# ───── E：墙上亮一张一声木琴（一秒 12 个音）
for k, f in enumerate(EV['wall']):
    ch = chord_at(f / BEAT)
    m = [ch[1], ch[2], ch[3], ch[-1]][k % 4] + 24 + (12 if k >= 12 else 0)
    S.put('keys', S.marimba(m, .9), frame=f, gain=.55, pan=-.6 + 1.2 * (k % 6) / 5)

# ───── 翻页：一串纸响 + 风；墙推进透光台：风
paper = lambda d=.03: S.fft_filter(S.rng.standard_normal(int(d * S.SR)), lo=1500, hi=6500) * np.exp(-np.arange(int(d * S.SR)) / (.008 * S.SR))
for F in FLIP.values():
    a, b = F
    S.sfx(S.whoosh((b - a) / 60, 300, 4500, 1.0, .5), fr(a), .4, 0, send=.15)
    for k in range(10):
        S.sfx(paper(), fr(a + (b - a) * (k / 10) ** .7), .18, -.4 + k * .08, send=.05)
S.sfx(S.whoosh((EV['ZOOM'][1] - EV['ZOOM'][0]) / 60, 400, 6000, 1.0, .7), fr(EV['ZOOM'][0]), .4, 0, send=.2)
for f in EV['flips']:                                   # 一拍二：每换一张画，很轻的一声纸
    S.sfx(paper(.02), fr(f), .03, float(np.sin(f)) * .4, send=.02)

# ───── F：最后一跳，签名（铅笔沙沙），“嗒—哒！”
L = 900
S.kick_at(L, 1.0, 1.3)
S.put('brass', S.brass([53, 57, 60, 62, 67], .5, 1.0), frame=L, gain=.85)
S.put('drums', S.crash(1.0), frame=L, gain=.25)
n = int(fr(END) * S.SR); ts = np.arange(n) / S.SR
scratch = S.fft_filter(S.rng.standard_normal(n), lo=1500, hi=6000) * (1 + .7 * np.sin(2 * np.pi * 9 * ts) ** 2)
env = np.clip((ts * 60 - 904) / 3, 0, 1) * np.clip((934 - ts * 60) / 3, 0, 1)
S.SFX[0, :n] += scratch * env * .05; S.SFX[1, :n] += scratch * env * .045
E = 950
S.put('drums', S.snare2(.9, wire=.6), frame=E - 12, gain=.4)
S.kick_at(E, 1.0, 1.3)
S.put('drums', S.crash(1.2), frame=E, gain=.3)
S.put('brass', S.brass([53, 57, 60, 62, 67, 72, 77], 1.6, 1.0, bright=1.0), frame=E, gain=1.0)
S.put('bass', S.upright(29, 1.8, 1.0, .4), frame=E, gain=1.1)
S.put('keys', sum(S.grand(m, 3.0, .8) for m in [29, 41, 53, 57, 60, 62, 67, 72]), frame=E, gain=.6)
S.put('lead', S.clarinet(84, 1.4, 1.0), frame=E, gain=.6)
S.put('pad', S.strings([53, 57, 60, 62, 67, 72], 2.5, 1.2, att=.03, rel=1.4, bright=3000), frame=E, gain=3.5)

S.text_cues(EV['cues'], .4)
S.mix(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), levels=dict(drums=.75, bass=.9, keys=.9, lead=.85, brass=.85, pad=.9), room=1.1, plate=.8, air=.6)
