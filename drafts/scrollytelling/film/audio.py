"""滚动叙事小样 · 配乐（5 秒，120 BPM，一拍 30 帧，C 大调，Cmaj7 — Am7 — Fmaj7 — G）。
明亮、留白多的产品片配乐：铺底 + 马林巴琶音 + 很轻的鼓。
招牌声音是**甩一下**：每一甩一道“刷”，响度 = 这一甩滑多远，最响的一刻 = 松手那一帧（拍点）。
层分开 = 一声软“啵”（音高一层比一层高）；标注 / 说明块出字 = “嗒”；揭示 = 倒放镲 + 重拍 + 一个和弦鼓起来。
时间全部来自页面：node ../../_lib/events.cjs film.html events.json；python3 audio.py out.wav"""
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from song import Song  # noqa: E402
from softfx import SoftFX  # noqa: E402

EV = json.loads((HERE / 'events.json').read_text())
END, BEAT, RV = EV['end'], EV['beat'], EV['reveal']
CM, AM, FM, G = [60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]
CH = [(0, 36, CM), (60, 33, AM), (120, 29, FM), (180, 31, G), (RV, 36, CM)]


class ScrollSong(Song, SoftFX):
    pass


S = ScrollSong(END, CH, beat=BEAT, seed=23, tail=3.0)
fr = S.fr
S.pad(0.85, wave='saw', fc=1600)
S.bassline(0, END + 1, level=0.7)
for fm in np.arange(0, RV, BEAT / 2):
    S.place(S.hat(0.5), fr(fm), 0.12 if (fm / (BEAT / 2)) % 2 else 0.2, 0.25)
for fm in np.arange(0, RV, BEAT):
    if int(fm / BEAT) % 2 == 0:
        S.place(S.kick(0.8), fr(fm), 0.55); S.kicks.append(fm)
S.drums(RV, END + 1, level=0.8)
S.arp(0, END, level=0.55, pattern=(0, 1, 2, 3, 2, 1, 2, 3), octv=1, inst=lambda m: S.marimba(m, 1.0))

# 甩：最响的一刻落在松手那一帧
for fl in EV['flicks']:
    t0, d = fl['t'], fl['d']
    if t0 < 0:
        continue
    S.sfx(S.brush(0.42, 0.8 + 0.6 * d, True), fr(t0) - 0.16, 0.5 + 0.4 * d, 0.0, send=0.25)
# 层分开：一层一声软“啵”，越往上音越高
for k, e in enumerate(EV['sep']):
    S.sfx(S.bop(S.tone(e['t'], k, 1), 1.0, 0.18), fr(e['t']), 0.45, -0.3 + 0.15 * k, send=0.3)
# 出字
cues = [(e['t'], min(10, e['n']), 1.2, 'small') for e in EV['label']]
cues += [(e['t'], 8, 1.5, 'type') for e in EV['block']]
cues += [(RV + 4, 4, 3, 'title'), (RV + 10, 5, 2, 'title'), (RV + 16, 24, 1, 'small')]
S.text_cues(cues, 1.0)
# 揭示
S.sfx(S.rev_cymbal(0.45, 1.0), fr(RV) - 0.45, 0.6, 0, send=0.3)
S.place(S.crash(1.0), fr(RV), 0.7, 0.1, send=0.4)
S.place(S.kick(1.3), fr(RV), 1.0); S.kicks.append(RV)
S.sfx(S.swell([60, 64, 67, 72], fr(END - RV), 1.0), fr(RV), 0.4, 0, send=0.5)
S.master(sys.argv[1] if len(sys.argv) > 1 else 'scroll.wav')
