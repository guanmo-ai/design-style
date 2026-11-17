"""手绘动画 v3 配乐：夏天的管弦流行，F 大调，120 BPM（一拍 30 帧），34 拍 + 余音 ≈ 20 秒。
跟着场景走的五段（同一首歌，换段落不换乐队）：
  A 稻田（0—11 拍）：钢琴八分音符琶音 + 拨弦贝斯 + 钟琴唱主题；第 5 拍拆开七层纸，鼓撤掉，竖琴往上刷，每一张纸的标签一声钢片琴
  B 树林（11—17 拍）：第 11 拍横摇扫过 = 镲 + 定音鼓；鼓组进来，单簧管接主题
  C 云海（17—24 拍）：副歌——弦乐八度唱长句，铜管垫和声，定音鼓踩小节线
  D 夜（24—30 拍）：第 24 拍往下扎 = 冲击；乐队全撤，只剩钢片琴、弦乐和人声垫；路灯亮一声“叮——”，流星一道闪，帽子落下一声拨弦
  E 片尾（30—34 拍）：定音鼓滚奏 + 上行，第 32 拍署名落在主和弦上
python3 audio.py out.wav（动作时刻来自 node ../../_lib/events.cjs film.html events.json）"""
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from band import Band  # noqa: E402

EV = json.loads((HERE / 'events.json').read_text())
TL, SW, END, BEAT = EV['TL'], EV['SW'], EV['end'], EV['beat']
F_, C_, Dm, Bb, Gm7, C7, Csus, Am7, FA, CE = ([53, 57, 60, 65], [48, 55, 60, 64], [50, 57, 62, 65], [46, 53, 58, 62], [43, 55, 58, 62, 65], [48, 52, 58, 64],
                                             [48, 53, 55, 60], [45, 55, 60, 64], [45, 53, 60, 65], [40, 55, 60, 64])
PROG = [(0, F_), (2, C_), (4, Dm), (6, Bb), (8, Gm7), (10, Csus), (10.5, C7), (12, F_), (14, CE), (16, Bb), (17, Csus),
        (18, F_), (20, CE), (22, Dm), (23, Bb), (24, Bb), (26, FA), (28, Gm7), (30, Csus), (31, C7), (32, F_)]
CH = [(int(b * BEAT), c[0] - 12, c) for b, c in PROG]
S = Band(END, CH, beat=BEAT, seed=33, tail=4.0)
fr = S.fr
rng = np.random.default_rng(5)
chord_at = lambda b: [c for bb, c in PROG if bb <= b + 1e-6][-1]
hum = lambda: float(rng.uniform(-.25, .25))           # 人手的一点不准（± 4 毫秒）
B_WHIP, B_TILT, B_DIVE, B_END = SW['whip'] / BEAT, SW['tilt'] / BEAT, SW['dive'] / BEAT, 32
EXP0, EXP3 = TL['explode'][0] / BEAT, TL['explode'][3] / BEAT
sec = lambda b: 'A' if b < B_WHIP else 'B' if b < B_TILT else 'C' if b < B_DIVE else 'D' if b < 30 else 'E'
in_explode = lambda b: EXP0 <= b < B_WHIP

# ───── 钢琴：八分音符琶音（A、B、C 三段），力度跟着段落走
for k in range(int(30 * 2)):
    b = k / 2
    s = sec(b)
    if s in 'DE':
        continue
    ch = chord_at(b)
    pat = [ch[1] + 12, ch[2] + 12, ch[-1] + 12, ch[2] + 24, ch[-1] + 12, ch[2] + 12, ch[1] + 24, ch[2] + 12]
    m = pat[k % 8]
    vel = {'A': .5, 'B': .58, 'C': .62}[s] * (1.1 if k % 2 == 0 else .9) * (.6 if in_explode(b) else 1)
    S.put('keys', S.grand(m, 0.9, vel), frame=b * BEAT + hum(), gain=1.3, pan=-.25 + .1 * np.sin(k))
# 左手：每两拍一个低八度 + 五度
for bb, ch in PROG:
    if bb >= 24 or bb != int(bb):
        continue
    S.put('keys', S.grand(ch[0], 2.0, .55) + S.grand(ch[0] + 7, 2.0, .4), beat=bb, gain=.8, pan=-.1)

# ───── 拨弦贝斯（A 段后半和 B、C）
for b in range(0, 24):
    if in_explode(b):
        continue
    root = chord_at(b)[0] - 12
    S.put('bass', S.upright(root, .45, .9, .45), beat=b, gain=1.1)
    S.put('bass', S.sub(root, .42, .8), beat=b, gain=.9)
    if sec(b) in 'BC':
        S.put('bass', S.upright(root + 7, .3, .7, .45), beat=b + .5, gain=.55)

# ───── 鼓：A 段只有沙锤和轻踩；B、C 段整套（底鼓 1、3，军鼓 2、4 偏刷子），C 段加定音鼓
for b in range(0, 24):
    s = sec(b)
    if in_explode(b):
        continue
    for q in range(4):
        S.put('drums', S.shaker2(.8 if q % 2 else .5), beat=b + q / 4, gain=.08 + (.04 if s != 'A' else 0), pan=.5)
    if s == 'A':
        if b % 2 == 0:
            S.kick_at(b * BEAT, .55)
        continue
    if b % 2 == 0 or (s == 'C' and b % 4 == 3):
        S.kick_at(b * BEAT, .9 if s == 'C' else .8)
    if b % 2 == 1:
        S.put('drums', S.snare2(.75, wire=.6), beat=b, gain=.32)
        S.put('drums', S.clap2(.7), beat=b, gain=.1, pan=.1)
    S.put('drums', S.hat2(.7), beat=b + .5, gain=.12, pan=-.4)
    if s == 'C' and b % 2 == 0:
        S.put('drums', S.timpani(41 if chord_at(b)[0] in (53, 41) else 36, .9), beat=b, gain=.5)

# ───── 主题：A 钟琴 + 长笛味的单簧管叠八度；B 单簧管；C 弦乐八度 + 钟琴
A_MEL = [(0, 72, .5), (.5, 77, .5), (1, 79, .5), (1.5, 81, 1.5), (3, 79, .5), (3.5, 77, .5), (4, 74, 1), (5, 72, 1)]
B_MEL = [(12, 77, .5), (12.5, 81, .5), (13, 84, 1), (14, 82, .5), (14.5, 81, .5), (15, 79, 1), (16, 77, .5), (16.5, 79, .5)]
C_MEL = [(18, 81, 1), (19, 84, .5), (19.5, 81, .5), (20, 79, 1.5), (21.5, 76, .5), (22, 77, .5), (22.5, 79, .5), (23, 81, .5), (23.5, 86, .5), (24, 84, 2)]
for o, m, d in A_MEL:
    S.put('lead', S.glock(m + 12, 1.4, 1.0), beat=o, gain=.6, pan=.2)
    S.put('lead', S.clarinet(m, d * BEAT / 60 * .95, .8), beat=o, gain=.45, pan=.15)
for o, m, d in B_MEL:
    S.put('lead', S.clarinet(m, d * BEAT / 60 * .95, 1.0), beat=o, gain=.7, pan=.15)
    S.put('lead', S.glock(m + 12, .8, .7), beat=o, gain=.25, pan=.25)
for o, m, d in C_MEL:
    S.put('lead', S.strings([m, m - 12], d * BEAT / 60, 1.0, att=.05, rel=.5, bright=3800), beat=o, gain=2.4, pan=0)
    S.put('lead', S.glock(m + 12, 1.0, .9), beat=o, gain=.35, pan=.3)
# 拆开七层纸：竖琴往上刷一下；每张纸的标签一声钢片琴（往上走的五声音阶）
pent = [65, 67, 69, 72, 74, 77, 79, 81, 84, 86]
for k, m in enumerate(pent):
    S.put('pad', S.harp(m, 2.0, .9), frame=TL['explode'][0] + k * 2.2, gain=.5, pan=-.5 + k * .1)
for k in range(7):
    S.put('keys', S.celesta(pent[k + 2] + 12, 1.6, 1.0), frame=TL['explode'][1] - 14 + k * 4, gain=.9, pan=-.6 + k * .2)
# 合上：倒放膨胀吸进横摇
S.put('pad', S.swell([m + 12 for m in C7], (SW['whip'] - TL['explode'][2]) / 60, 1.0), frame=TL['explode'][2], gain=.55)

# ───── 铺底：弦乐（每个和弦），C 段铜管垫，D 段人声垫
for i, (bb, ch) in enumerate(PROG):
    nb = PROG[i + 1][0] if i + 1 < len(PROG) else 36
    d = (nb - bb) * BEAT / 60
    s = sec(bb)
    lvl = {'A': .7, 'B': .8, 'C': 1.1, 'D': .9, 'E': 1.0}[s]
    S.put('pad', S.strings([m + 12 for m in ch[1:]] + [ch[0]], d + .1, lvl, att=.25 if s != 'D' else .6, rel=.6, bright=2200 if s != 'C' else 3000), beat=bb, gain=4.5)
    S.put('pad', S.strings([ch[0] - 12], d + .1, lvl, att=.2, rel=.6, bright=900), beat=bb, gain=3.0)
    if s == 'C':
        S.put('brass', S.brass([m + 12 for m in ch[1:]], d * .9, .55, scoop=False, bright=.55), beat=bb, gain=.35)
    if s == 'D':
        S.put('pad', S.choir([m + 12 for m in ch[1:]], d + .2, .9), beat=bb, gain=2.3)

# ───── D 段：钢片琴琶音（一拍两个音）+ 小旋律
for k in range(int(24 * 2), int(30 * 2)):
    b = k / 2
    ch = chord_at(b)
    S.put('keys', S.celesta([ch[1], ch[2], ch[-1], ch[2]][k % 4] + 24, 1.4, .7), beat=b, gain=.95, pan=.4 * np.sin(k))
D_MEL = [(26, 81, 1), (27, 79, 1), (28, 77, 1), (29, 74, .5), (29.5, 76, .5)]
for o, m, d in D_MEL:
    S.put('lead', S.clarinet(m, d * BEAT / 60 * .95, .7), beat=o, gain=.5, pan=-.1)

# ───── 转场：横摇 / 往上摇 / 往下扎（前面一段上行，正中一记）
for key, up in (('whip', True), ('tilt', True), ('dive', False)):
    a, b = TL[key]
    mid = SW[key]
    S.sfx(S.whoosh((b - a) / 60, 300, 7000, 1.0, .5), fr(a), .55, -.3 if key == 'whip' else 0, send=.15)
    S.sfx(S.riser2((mid - a) / 60 + .3, 1.0), fr(mid) - (mid - a) / 60 - .3, .35, 0, send=.2)
    S.put('drums', S.crash(1.0), frame=mid, gain=.22, pan=.15)
    S.put('drums', S.timpani(41, 1.0), frame=mid, gain=.7)
    S.kick_at(mid, 1.0, 1.2)
S.sfx(S.hit(1.0, 29), fr(SW['dive']), .55, 0, send=.25)

# ───── 画面里的声音：帽子翻一张一声纸响（很轻）、路灯、流星、萤火、落在站牌上
paper = lambda: S.fft_filter(S.rng.standard_normal(int(.04 * S.SR)), lo=2500, hi=8000) * np.exp(-np.arange(int(.04 * S.SR)) / (.01 * S.SR))
for f in EV['hatFlips'][::2]:
    S.sfx(paper(), fr(f), .05, float(np.sin(f * .3)) * .5, send=.05)
L = TL['lamp']
for k, (df, lv) in enumerate(((0, 1), (9, .5), (16, 1))):
    S.sfx(S.fft_filter(S.rng.standard_normal(int(.03 * S.SR)), lo=3000, hi=9000) * .5, fr(L + df), .25 * lv, .4, send=.1)
S.put('keys', S.celesta(89, 2.4, 1.0) + S.celesta(96, 2.4, .6), frame=L + 16, gain=.9, pan=.4)
S.sfx(S.shimmer((TL['star'][1] - TL['star'][0]) / 60, 1.0), fr(TL['star'][0]), .35, -.3, send=.4)
for k in range(6):
    S.put('keys', S.celesta([84, 88, 91, 96, 91, 100][k], 1.2, .5), frame=TL['star'][0] + k * 4, gain=.4, pan=.5 - k * .2)
S.put('bass', S.pizz(41, 1.0), frame=TL['land'], gain=.9)
S.put('keys', S.harp(77, 2.0, 1.0) + S.harp(81, 2.0, .7), frame=TL['land'], gain=.6, pan=.3)

# ───── E：滚奏 + 上行 → 第 32 拍主和弦（署名）
for k in range(24):
    t = 30 * BEAT + k * (2 * BEAT / 24)
    S.put('drums', S.timpani(41, .25 + .03 * k, 1.0), frame=t, gain=.35)
S.sfx(S.riser2(2 * BEAT / 60, 1.0), fr(30 * BEAT), .4, 0, send=.25)
for k, m in enumerate([72, 74, 76, 77, 79, 81, 82, 84]):
    S.put('lead', S.glock(m + 12, .6, .8), beat=30 + k * .25, gain=.4, pan=-.4 + k * .1)
E = B_END * BEAT
S.put('drums', S.crash(1.2), frame=E, gain=.3)
S.put('drums', S.timpani(41, 1.2, 3.0), frame=E, gain=.8)
S.kick_at(E, 1.0, 1.3)
S.put('pad', S.strings([41, 53, 60, 65, 69, 72, 77], 3.5, 1.3, att=.03, rel=1.6, bright=3000), frame=E, gain=5.0)
S.put('brass', S.brass([65, 69, 72, 77], 1.6, 1.0, bright=.9), frame=E, gain=.7)
S.put('keys', sum(S.grand(m, 4.0, .8) for m in [29, 41, 53, 60, 65, 69, 72, 77]), frame=E, gain=.7)
S.put('lead', S.glock(89, 2.5, 1.0), frame=E, gain=.5)
S.put('pad', S.choir([65, 69, 72, 77], 3.5, 1.0), frame=E, gain=.6)

S.text_cues(EV['cues'], .4)
S.mix(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), levels=dict(drums=.62, bass=.75, keys=1.05, lead=.85, brass=.7, pad=1.25), room=1.3, plate=.9, air=.5)
