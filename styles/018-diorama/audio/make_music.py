"""018 微缩景观 · 电影感配乐（F 大调，120 BPM，20 秒 = 10 小节）。
python3 audio/make_music.py <events.json> <out.wav>

  1—2 小节  街角：马林巴 + 拨弦的八分音符律动，碎块砸下来是定音鼓滚奏，二层砸下那一拍一记冲击
  3—4       房间：钢琴主题进来，弦乐托着；墙一排排垒高，木头声一格格往上走
  5—6       模型铁路：弦乐断奏推着火车，移轴“咔”地打开时一声
  7         App：轻，钢片琴 + 拨弦
  8         入夜：鼓停，人声垫 + 八音盒，开灯的“咔哒”
  9         结尾：片名出来时 F 大调全奏 + 冲击，弦乐慢慢落下
  10        摇篮曲两个音；18.6 秒台灯“咔”地关掉，音乐跟着停；19—20 秒倒带：磁带往下掉的声音，尾巴折回开头
零件的声音来自时间轴导出的事件表（video3d/render.cjs 写的 events.json）。"""
import json
import math
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', '..', 'scripts', 'lib'))
from audio import AudioKit  # noqa: E402
from audio.orchestra import Orchestra  # noqa: E402


class Kit(AudioKit, Orchestra):
    pass


A = Kit(duration=20.0, seed=18, fps=30.0, tail=4.0)
BEAT, BAR = 0.5, 2.0
b = lambda bar, beat=0.0: (bar - 1) * BAR + beat * BEAT
CH = {1: (29, [65, 69, 72, 76]), 2: (26, [62, 65, 69, 72]), 3: (34, [62, 65, 70, 74]), 4: (36, [64, 67, 72, 76]),
      5: (33, [64, 69, 72, 76]), 6: (34, [65, 70, 74, 77]), 7: (29, [65, 69, 72, 77]), 8: (28, [64, 67, 72, 76]),
      9: (29, [65, 69, 72, 77]), 10: (34, [65, 69, 74, 77])}
LAMP_OFF, REW = 18.6, 19.0
cut = lambda t: t < LAMP_OFF

# ---------- 律动：马林巴 + 拨弦（1—2、5—7 小节） ----------
for bar in (1, 2, 5, 6, 7):
    lo, ch = CH[bar]
    for k in range(8):
        m = ch[[0, 2, 1, 3, 2, 1, 3, 2][k]] + 12
        A.place(A.marimba(m, 0.8 if k % 2 == 0 else 0.55), b(bar, k * 0.5), 0.8, pan=0.3 if k % 2 else -0.1, send=0.25)
        if k % 2 == 0:
            A.place(A.pizz(lo + 24, 1.0), b(bar, k * 0.5), 0.9, pan=-0.3, send=0.2)
# ---------- 钢琴主题（3—4、9—10 小节） ----------
MEL = {3: [(0, 74), (0.5, 77), (1, 81), (2, 79), (2.5, 77), (3, 74)],
       4: [(0, 76), (1, 79), (1.5, 81), (2, 84), (3, 79)],
       9: [(0.8, 81), (1.5, 84), (2, 89), (3, 88)],
       10: [(0, 86), (1, 84)]}
for bar, notes in MEL.items():
    for beat, m in notes:
        if cut(b(bar, beat)):
            A.place(A.grand(m, 2.2, 0.75), b(bar, beat), 0.9, pan=0.12, send=0.4)
for bar in (3, 4, 9, 10):
    lo, ch = CH[bar]
    if cut(b(bar)):
        A.place(A.grand(lo + 24, 2.4, 0.6), b(bar), 0.8, pan=-0.15, send=0.3)
# ---------- 弦乐 ----------
for bar, (lo, ch) in CH.items():
    if not cut(b(bar)):
        continue
    lvl = {1: 0.4, 2: 0.5, 3: 0.7, 4: 0.8, 5: 0.85, 6: 0.95, 7: 0.55, 8: 0.5, 9: 1.2, 10: 0.7}[bar]
    d = min(BAR + 0.1, LAMP_OFF - b(bar)) if bar == 10 else BAR + 0.1
    A.place(A.strings([m - 12 for m in ch[:3]], d, lvl, att=0.5, rel=0.9 if bar != 10 else 0.12), b(bar), 1.0, send=0.5)
    A.place(A.strings([lo + 12, lo + 24], d, lvl * 0.9, att=0.3, rel=0.8 if bar != 10 else 0.1, bright=900), b(bar), 1.0, send=0.3)
for bar in (5, 6):   # 模型铁路：低音弦乐断奏
    for k in range(8):
        A.place(A.strings([CH[bar][0] + 24], 0.16, 0.8, att=0.01, rel=0.08, bright=1500), b(bar, k * 0.5), 1.0, pan=-0.2, send=0.15)
# ---------- 夜：人声垫 + 八音盒 ----------
A.place(A.choir([64, 67, 72], 2.4, 0.9, att=0.6), 14.2, 1.0, send=0.6)
for k, m in enumerate([84, 79, 76, 79, 84, 88, 84, 79]):
    A.place(A.celesta(m, 1.4), 14.25 + k * 0.27, 0.7, pan=0.3 * math.sin(k), send=0.6)
# 结尾全奏（片名 16.8）
A.place(A.choir([65, 69, 72, 77], 2.2, 1.1, att=0.3, rel=0.6), 16.8, 1.0, send=0.6)
A.place(A.strings([65, 69, 72, 77, 81], 1.8, 1.0, att=0.06, rel=1.0, bright=3200), 16.8, 1.0, send=0.6)
# ---------- 打击乐与冲击 ----------
for bar in (1, 2, 3, 4, 5, 6):
    for k in range(4):
        A.place(A.kick(0.55 if k % 2 == 0 else 0.3), b(bar, k), 0.8)
        A.place(A.shaker(0.45), b(bar, k + 0.5), 0.6, pan=0.3)
for tt, lvl in ((0.0, 0.9), (0.55 + 0.5 + 0.36, 1.0), (3.9 + 2.0 + 0.33, 0.9), (7.5 + 0.6, 0.9), (16.8, 1.4)):
    A.place(A.hit(lvl), tt, 1.0, send=0.35)
for tt, bar in ((4.2, 3), (7.8, 5), (11.2, 7), (14.2, 8), (16.8, 9)):
    A.place(A.swell(CH[bar][1][:3], 1.0, 0.85), tt - 1.0, 1.0, send=0.2)
# 底座碎块雨：定音鼓滚奏（第 0 帧之前就开始，折回到结尾 → 循环接得上）
for k in range(16):
    A.place(A.timpani(29 + (k % 2) * 5, 0.25 + 0.04 * k), -0.4 + k * 0.06, 0.7, send=0.25)

# ---------- 零件的声音 ----------
ev = json.load(open(sys.argv[1])) if len(sys.argv) > 1 and sys.argv[1].endswith('.json') else []
scale = [72, 74, 76, 77, 79, 81, 84, 86]
seen = set()
for e in ev:
    t, kind, pan = e['t'], e['kind'], max(-0.8, min(0.8, e.get('pan', 0)))
    if t < -0.5 or t >= LAMP_OFF:
        continue
    q = round(t / 0.0625)
    if (q, kind) in seen:
        continue
    seen.add((q, kind))
    note = scale[int(abs(pan * 13) + t * 3) % len(scale)]
    if kind in ('drop', 'spin'):
        A.sfx(A.thock(48 + int(abs(pan * 7)) % 5, 0.9), t, pan=pan, send=0.2)
        A.sfx(A.timpani(29, 0.25), t, pan=pan, send=0.2)
    elif kind == 'rumble':
        A.sfx(A.timpani(29, 0.5), t, send=0.25)
    elif kind == 'pop':
        A.sfx(A.marimba(note, 0.7), t, pan=pan, send=0.3)
    elif kind == 'rise':
        A.sfx(A.whoosh(0.35, 300, 3000, 0.4), t, pan=pan, send=0.2)
    elif kind in ('drawx', 'zip'):
        A.sfx(A.whoosh(0.4, 600, 8000, 0.5), t, pan=pan, send=0.2)
    elif kind == 'tick':
        A.sfx(A.thock(67 + q % 5, 0.35), t, pan=pan, send=0.15)
    elif kind.startswith('note'):
        A.sfx(A.celesta(scale[int(kind[4:]) % 8] + 12, 0.6), t, pan=pan, send=0.5)
# 移轴打开的“咔”、开灯的“咔哒”
A.sfx(A.click(1.2), 8.75, send=0.3)
for k in range(14):
    A.sfx(A.click(0.7, lo=1500, hi=6000), 14.45 + k * 0.065, pan=float(A.rng.uniform(-0.6, 0.6)), send=0.2)
# 结尾：台灯关掉 —— 一个开关声，钢片琴最后一个音
A.sfx(A.click(1.5, lo=900, hi=5000, d=0.01), LAMP_OFF, send=0.5)
A.place(A.celesta(77, 2.0), LAMP_OFF + 0.05, 0.8, send=0.8)
# 倒带：磁带往下掉 + 倒放膨胀，正好接回第 0 帧
A.place(A.tape_stop(1.0, 53, 1.2), REW, 1.0, send=0.2)
A.place(A.riser2(1.0, 0.6), REW, 1.0)

A.master(sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'diorama.wav'))
