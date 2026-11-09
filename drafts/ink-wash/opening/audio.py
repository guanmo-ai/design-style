"""水墨 · 开场 8 秒配乐（纯代码合成，无外部音源）。128 BPM · D 小调五声（D F G A C）。
一整首：定音鼓 + 低音铺底从第一拍走到最后；古筝（竖琴的 Karplus-Strong）弹五声句子，换章只换句子。
每个零件一个声音，时间全部取自 timeline.js：
  每一笔：风声 + 一记鼓 · 盖章：电影冲击 + 铁砧 · 墨滴：上滑哨 → 落纸“噗” + 溅水沙沙
  小蝌蚪：每出来一只一个钢片琴音（五声往上爬）· 虾：头一记定音鼓，每一节一个木琴音，须四声快风，弹尾一记冲击
  拉远：长风声 + 弦乐渐强 → 镜头停下时一声钟 + 合唱 Dm · 山水：古筝十六分琶音 · 留白框：钟
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
S16 = BEAT / 4


class Kit(AudioKit, Orchestra):
    pass


A = Kit(duration=TL['end'], fps=60, seed=1960, tail=2.5)
PENT = [62, 65, 67, 69, 72, 74, 77, 79, 81, 84]     # D 小调五声，D4 起


def zheng(m, t, g=1.0, pan=0.0, d=1.6):
    A.place(A.harp(m, d, 1.0), t, gain=g, pan=pan, send=.35)


# —— 一整首的底：定音鼓 + 低音铺底 + 沙锤 ——
for k in range(int(TL['end'] / BEAT) + 1):
    t = k * BEAT
    A.place(A.timpani(38 if k % 2 == 0 else 45, .55 if k % 4 == 0 else .35, 1.4), t, gain=.9, send=.15)
    for j in (1, 3):
        A.place(A.shaker(.35), t + j * S16, gain=.5, pan=.3 * (1 if j == 1 else -1))
A.place(A.pad([38, 45, 50], TL['end'] + .5, .9, .6, 1.0), 0.0, gain=.9, send=.3)
A.place(A.strings([50, 57, 62], 4.0, .7, .8, 1.2), 4.2, gain=.8, send=.4)

# —— 00 · 写“水”：四笔四声风 + 鼓；古筝一句 ——
strokes = [TL['s1'], TL['s2'], TL['s3'], TL['s4']]
for i, (t0, d) in enumerate(strokes):
    A.sfx(A.whoosh(max(d, .25), 400, 6000, .9, .45), max(t0, 0) if i else 0.0, gain=1.0, pan=-.3 + .2 * i, send=.2)
    A.place(A.hit(.7 if i == 0 else .45, 31), max(t0, 0) + (d * .14 if i else 0), gain=.8, send=.3)
    zheng(PENT[[4, 3, 5, 6][i]], max(t0, 0) + d * .8, .9, -.2 + .15 * i)
A.place(A.hit(1.0, 29), 0.0, gain=1.1, send=.35)             # 第 0 帧重击
A.sfx(A.hiss(.5, .5), 0.02, gain=.5, send=.2)                 # 墨点飞溅
for k, m in enumerate([74, 77, 79, 81]):                      # 第 0 帧古筝扫上去
    zheng(m, .02 + k * .035, .7, .2)

# 盖章
A.place(A.hit(.9, 26), TL['seal'], gain=1.0, send=.3)
A.sfx(A.anvil(69, .6, .6), TL['seal'], gain=.6, send=.25)
A.sfx(A.thock(50, 1.0), TL['seal'], gain=.8)

# —— 墨滴：上滑哨 → 落纸 ——
A.sfx(A.glide(74, 86, TL['land'] - TL['launch'], .5), TL['launch'], gain=.55, pan=.3, send=.3)
A.place(A.boom(.8, 110, 40, .7), TL['land'], gain=.9, send=.2)
A.place(A.marimba(50, 1.2), TL['land'], gain=1.0)
A.sfx(A.hiss(.35, .6), TL['land'], gain=.55, pan=.1, send=.3)

# —— 01 · 小蝌蚪：每出来一只一个钢片琴音，五声往上爬；之后一句俏皮的拨弦 ——
for k in range(TL['tadN']):
    A.place(A.celesta(PENT[k % len(PENT)] + 12, 1.0, 1.0), TL['land'] + k * TL['tadStep'], gain=.8, pan=-.5 + k / 7, send=.35)
riff = [74, 77, 79, 77, 74, 72, 74, 69]
for k, m in enumerate(riff):
    A.place(A.pizz(m, 1.0), 3.28 + k * S16 * 2, gain=.9, pan=.2 * np.sin(k), send=.2)
for k, m in enumerate([62, 65, 67, 69]):
    zheng(m + 12, 3.28 + k * BEAT, .6, -.3)

# —— 02 · 虾 ——
A.place(A.timpani(43, 1.0, 1.6), TL['head'], gain=1.0, send=.25)
zheng(62, TL['head'], .9)
for k in range(8):
    A.place(A.marimba(PENT[k % len(PENT)] + 12, 1.0), TL['segStart'] + k * TL['tadStep'], gain=.9, pan=.4 - k * .1, send=.2)
for j in range(6):
    A.sfx(A.click(.6), TL['legs'] + j * .03, gain=.5, pan=.2)
for t0 in (TL['claw1'], TL['claw2']):
    A.sfx(A.thock(57, 1.0), t0 + .2, gain=.7)
for j in range(4):
    A.sfx(A.whoosh(.16, 1500, 9000, .6, .3), TL['feelers'] + j * .035, gain=.5, pan=-.6 + .4 * j)
A.place(A.hit(.9, 31), TL['flick'], gain=1.0, send=.35)

# —— 03 · 拉远：长风声 + 弦乐渐强 → 停下一声钟 + 合唱；古筝十六分琶音铺满山水 ——
p0, p1 = TL['pull']
A.sfx(A.whoosh(p1 - p0 + .2, 200, 4000, 1.0, .55), p0 - .05, gain=1.0, send=.4)
A.place(A.swell([50, 57, 62, 65], p1 - p0, .8), p0, gain=.8, send=.4)
A.place(A.bell(62, 1.0, 2.2), p1, gain=.9, send=.5)
A.place(A.bell(74, .6, 1.6), p1, gain=.6, send=.5)
A.place(A.choir([50, 57, 62, 65], TL['end'] - p1 + .6, .8), p1, gain=.8, send=.5)
arp = [62, 69, 74, 77, 79, 77, 74, 69, 65, 72, 77, 81, 84, 81, 77, 72]
for k, m in enumerate(arp):
    zheng(m, TL['rock'] + k * S16, .55 + .25 * (k % 4 == 0), -.6 + 1.2 * (k / 15), 1.2)
for t0 in (TL['mtn'], TL['mtn2'], TL['mtn3']):
    A.sfx(A.shimmer(.6, .5), t0, gain=.5, send=.5)
A.place(A.bell(81, .8, 2.0), TL['liubai'], gain=.7, send=.5)
A.place(A.timpani(38, .9, 1.6), TL['liubai'], gain=.9, send=.3)

A.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
