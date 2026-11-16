"""铅笔原画 · 第二版配乐：电子摇摆（electro swing），144 BPM，一拍 25 帧，一小节 100 帧，F 大调，9 小节 = 15 秒。
四拍底鼓 + 二四拍拍手 + 摇摆的镲，立式贝斯走低音线，钢琴和吉他在反拍“切”，单簧管唱主题，铜管齐奏砸在每一次落地上。
第 4—5 小节（画曲线）乐队撤成电钢琴 + 骑镲 + 钟琴；手柄一拉，滑哨往上冲；第 6 小节鼓回来；最后一跳前军鼓滚奏，落地“嗒—哒！”。
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
BAR = BEAT * 4
F6, D7, Gm7, C7, Am7, F69 = [53, 57, 60, 62], [50, 54, 57, 60], [55, 58, 62, 65], [48, 52, 55, 58], [57, 60, 64, 67], [53, 57, 60, 62, 67]
HALF = [F6, F6, D7, D7, Gm7, C7, F6, D7, Gm7, Gm7, C7, C7, Am7, D7, Gm7, C7, F69, F69]       # 每两拍一个和弦
CH = [(i * BEAT * 2, c[0] - 12, c) for i, c in enumerate(HALF)]
S = Band(END, CH, beat=BEAT, seed=21, tail=3.0, swing=0.34)
fr = S.fr
nbeats = END // BEAT
BREAK = (16, 24)                          # 第几拍到第几拍：撤掉鼓和贝斯
FINAL = EV['jumps'][-1]
beat_of = lambda f: f / BEAT
chord_at = lambda b: HALF[min(len(HALF) - 1, int(b // 2))]
in_break = lambda b: BREAK[0] <= b < BREAK[1]
stop_time = lambda b: b >= 32               # 最后一小节：停顿式

# ───── 鼓 ─────
for b in range(nbeats):
    if stop_time(b):
        continue
    if in_break(b):
        S.put('drums', S.ride(0.7), beat=b, gain=0.6, pan=0.3)
        S.put('drums', S.ride(0.45, 0.4), beat=b + .5, gain=0.5, pan=0.3)
        if b % 2:
            S.put('drums', S.rim(0.8), beat=b, gain=0.55, pan=-0.1)
        continue
    S.kick_at(S.at(b), 0.8)
    if b % 2:
        S.put('drums', S.clap2(1.0), beat=b, gain=0.55, pan=0.05)
        S.put('drums', S.snare2(0.7, wire=0.7), beat=b, gain=0.35)
    S.put('drums', S.hat2(1.0, open_=True), beat=b + .5, gain=0.7, pan=0.45)
    S.put('drums', S.hat2(0.7), beat=b, gain=0.55, pan=-0.45)
    S.put('drums', S.shaker2(1.0), beat=b + .25, gain=0.5, pan=0.6)
    S.put('drums', S.brush(0.8), beat=b + .5, gain=0.35, pan=-0.3)
for b in (8, 24):                                                          # 进段落的镲
    S.put('drums', S.crash(1.0), beat=b, gain=0.45, pan=0.2)

# ───── 立式贝斯：一拍一个音，走到下一个和弦（根音 → 三度 / 五度 → 半音靠近）─────
for b in range(nbeats):
    if stop_time(b):
        continue
    ch = chord_at(b)
    root = ch[0] - 24
    nxt = chord_at(b + 1)[0] - 24
    if in_break(b):
        if b % 2 == 0:
            S.put('bass', S.upright(root, 0.8, 0.9, 0.35), beat=b, gain=0.8)
        continue
    pos = b % 2
    m = root if pos == 0 else (root + 7 if nxt == root else nxt + (1 if nxt < root else -1))
    S.put('bass', S.upright(m, 0.42, 1.0, 0.55), beat=b, gain=0.95)

# ───── 反拍切音：钢琴（中音区）+ 吉他 ─────
for b in range(nbeats):
    if stop_time(b) or in_break(b):
        continue
    ch = chord_at(b)
    S.put('keys', sum(S.grand(m + 12, 0.22, 0.5)[:int(0.3 * S.SR)] for m in ch[1:]), beat=b + .5, gain=0.34, pan=-0.55)
    if b % 2:
        S.put('keys', sum(S.pluck(m + 12, 0.14, 1.0) for m in ch[:3]), beat=b + .5, gain=0.32, pan=0.6)
# 曲线那两小节：电钢琴的长和弦
for b in range(BREAK[0], BREAK[1], 2):
    S.put('pad', sum(S.rhodes(m + 12, 1.6, 0.55) for m in chord_at(b)), beat=b, gain=0.45)
S.put('pad', S.strings([m + 12 for m in Gm7], 3.2, 0.9, att=0.6, rel=0.8), beat=BREAK[0], gain=0.35)
S.put('pad', S.strings([m + 12 for m in C7], 3.2, 0.9, att=0.6, rel=0.8), beat=BREAK[0] + 4, gain=0.35)

# ───── 主题：单簧管 ─────
MEL = {1: [(0, 69, .5), (.5, 72, .5), (1, 74, 1), (2, 78, .5), (2.5, 76, .5), (3, 74, 1)],
       2: [(0, 77, .5), (.5, 74, .5), (1, 70, 1), (2, 76, 1.5), (3.5, 72, .5)],
       3: [(0, 72, 1.5), (1.5, 69, .5), (2, 74, 1), (3, 73, 1)],
       6: [(0, 76, .5), (.5, 79, .5), (1, 81, 1), (2, 78, .5), (2.5, 81, .5), (3, 84, 1)],
       7: [(0, 82, .5), (.5, 79, .5), (1, 74, 1), (2, 76, 1), (3, 77, .5), (3.5, 79, .5)]}
for bar, notes in MEL.items():
    for o, m, d in notes:
        S.put('lead', S.clarinet(m, d * BEAT / 60 * 0.92, 1.0), beat=bar * 4 + o, gain=0.75, pan=0.12)
# 开场的上行拾音
for k, m in enumerate([60, 62, 64, 65, 67]):
    S.put('lead', S.clarinet(m + 12, 0.08, 0.8, vib=False), beat=2 + k * 0.4, gain=0.6, pan=0.12)

# ───── 铜管：每一次落地砸一下，第 6—7 小节加反拍的小号句子 ─────
for J in EV['jumps']:
    lb = beat_of(J['land'])
    if J['land'] < 0 or J['land'] >= END:
        continue
    big = J['H'] >= 250
    ch = chord_at(lb)
    if J['land'] == FINAL['land']:
        continue
    S.put('brass', S.brass([m + 12 for m in ch] + ([ch[0] + 24] if big else []), 0.32 if big else 0.14, 1.0, scoop=True, bright=1.0 if big else 0.7), frame=J['land'], gain=0.9 if big else 0.55)
S.put('brass', S.brass([m + 12 for m in F6] + [77], 0.3, 1.0), frame=0, gain=0.85)          # 第 0 帧
for b in (24.5, 26.5, 27.5, 28.5):                                                      # 小号的反拍
    S.put('brass', S.brass([m + 12 for m in chord_at(b)], 0.12, 0.8, bright=0.8), beat=b, gain=0.45)
S.put('brass', S.brass([m + 12 for m in C7], 0.5, 1.0, fall=True), frame=TL['ride2'][1] - 4, gain=0.55)  # 冲过头：一声下滑

# ───── 最后一小节：滚奏 → 起跳 → “嗒—哒！” ─────
for k in range(16):
    t = FINAL['start'] + k * (FINAL['take'] - FINAL['start']) / 16
    S.put('drums', S.snare2(0.35 + 0.04 * k, wire=1.0), frame=t, gain=0.3 + 0.02 * k, pan=-0.1)
S.sfx(S.riser2((FINAL['take'] - FINAL['start']) / 60, 0.6), fr(FINAL['start']), 0.35, 0, send=0.2)
S.put('brass', S.brass([65, 69, 72], 0.1, 0.9), frame=FINAL['take'], gain=0.6)
L = FINAL['land']
S.kick_at(L, 1.0, 1.4)
S.put('drums', S.crash(1.2), frame=L, gain=0.6)
S.put('brass', S.brass([65, 69, 72, 74, 79, 81], 1.4, 1.0, bright=1.1), frame=L, gain=1.0)
S.put('bass', S.upright(29, 1.6, 1.0, 0.4), frame=L, gain=1.0)
S.put('keys', sum(S.grand(m, 3.0, 0.75) for m in [41, 53, 57, 60, 62, 67, 72]), frame=L, gain=0.5)
S.put('lead', S.clarinet(84, 1.2, 1.0), frame=L, gain=0.55)

# ───── 画面里的声音 ─────
paper = lambda: S.fft_filter(S.rng.standard_normal(int(0.05 * S.SR)), lo=1800, hi=7000) * np.exp(-np.arange(int(0.05 * S.SR)) / (0.012 * S.SR))
for f in EV['flips']:
    S.sfx(paper(), fr(f), 0.12, float(np.sin(f * .7)) * 0.4, send=0.03)
for J in EV['jumps']:
    if J['H'] >= 200 and 0 <= J['take'] < END:
        S.sfx(S.whoosh(0.3, 400, 5000, 1.0), fr(J['take']) - 0.05, 0.4, 0.1, send=0.1)
    if 0 <= J['land'] < END:
        S.sfx(S.poof(1.0, 0.22, 700), fr(J['land']), 0.45 if J['H'] >= 200 else 0.25, 0, send=0.1)
n = int(fr(END) * S.SR); tsec = np.arange(n) / S.SR
scratch = S.fft_filter(S.rng.standard_normal(n), lo=2500, hi=9000) * (1 + 0.7 * np.sin(2 * np.pi * 9 * tsec) ** 2)
env = np.zeros(n)
for a, b in EV['pencil']:
    env += np.clip((tsec * 60 - a) / 3, 0, 1) * np.clip((b - tsec * 60) / 3, 0, 1)
S.SFX[0, :n] += scratch * env * 0.05; S.SFX[1, :n] += scratch * env * 0.045
scale = [65, 67, 69, 72, 74, 77, 79, 81, 84, 86, 89, 91]
for k, f in enumerate(EV['ticks']):
    S.put('keys', S.glock(scale[k % len(scale)] + 12, 0.8, 1.0), frame=f, gain=0.22, pan=-0.5 + k / 11)
for k, f in enumerate(EV['fly']):
    S.sfx(S.bop(scale[k % len(scale)] + 12, 0.6, 0.08), fr(f), 0.18, 0.5, send=0.25)
for k, f in enumerate(EV['fly2'] + EV['snaps']):
    S.put('keys', S.glock(scale[k % len(scale)] + 24, 0.5, 0.7), frame=f, gain=0.13, pan=-0.3 + 0.05 * (k % 12))
for f in EV['keys']:
    S.sfx(S.brush(0.8, 0.16, True), fr(f), 0.35, 0.3, send=0.1)
for k, f in enumerate(EV['rides']):
    S.sfx(S.bop(scale[(k % 12)] + 12, 0.4, 0.06), fr(f), 0.12, -0.3 + 0.05 * (k % 12), send=0.2)
d0, d1 = TL['drag']                                                        # 手柄一拉：滑哨往上冲
t = S.tt((d1 - d0) / 60); u = t / t[-1]; fq = 520 * 2 ** (1.3 * u ** .8)
S.sfx(np.sin(2 * np.pi * np.cumsum(fq) / S.SR) * np.sin(np.pi * u) ** .5 * 0.3, fr(d0), 0.45, 0.2, send=0.35)
S.sfx(S.brush(0.6, 1.0, False), fr(TL['wipe'][0]), 0.45, 0, send=0.1)     # 橡皮擦
for i in range(4):                                                          # 标题四个字跳起来
    S.sfx(S.boing(72 + [0, 4, 7, 12][i], 0.6, 0.3), fr(L + 2 + i * 5), 0.22, -0.4 + 0.25 * i, send=0.2)
S.text_cues(EV['cues'], 0.45)
S.mix(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), levels=dict(drums=0.95, bass=0.95, keys=0.75, lead=0.8, brass=0.85, pad=0.6), room=1.0)
