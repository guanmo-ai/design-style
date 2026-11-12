"""新艺术运动 · 配乐：一支圆舞曲。3/4 拍，180 BPM（一拍 = 20 帧，一小节 = 60 帧 = 1 秒），D 大调，21 小节从头到尾不断。
“嘭—恰—恰”的拨弦和竖琴打底，钢片琴唱旋律；夜里换成弦乐；收在 D 大调主和弦上。
每个动作的时刻来自页面（node ../../_lib/events.cjs film.html events.json）：藤在长的沙沙声跟着主线的速度走，
光环的马赛克点、蒂芙尼的玻璃一块块“叮”出来，台灯亮起那一下全乐队落在小节线上。python3 audio.py out.wav"""
import json
import re
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
sys.path.insert(0, str(HERE.parents[2] / 'scripts' / 'lib'))
from song import Song  # noqa: E402
from softfx import SoftFX  # noqa: E402
from audio.orchestra import Orchestra  # noqa: E402

TL = json.loads(re.sub(r'//[^\n]*', '', re.search(r'const TL = (\{.*?\});', (HERE / 'timeline.js').read_text(), re.S).group(1)))
EV = json.loads((HERE / 'events.json').read_text())
END, BAR, BEAT = TL['end'], 60, 20

# 每小节一个和弦：(名字, 和弦音, 贝斯)
BARS = [([62, 66, 69], 38), ([62, 66, 69], 38), ([62, 67, 71], 43), ([61, 67, 69], 45),
        ([62, 66, 69], 38), ([62, 66, 71], 47), ([62, 67, 71], 43), ([61, 64, 69], 45),
        ([61, 66, 69], 42), ([62, 66, 71], 47), ([64, 67, 71], 40), ([61, 67, 69], 45),          # 黄昏：升 F 小调 → 属七
        ([62, 66, 71], 47), ([62, 66, 67, 71], 43), ([62, 64, 67, 71], 40), ([61, 64, 67, 69], 45),  # 夜：第 13 小节台灯亮 = Gmaj7
        ([62, 66, 69], 38), ([62, 67, 71], 43), ([62, 66, 71], 47), ([61, 64, 67, 71], 45), ([62, 66, 69, 74], 38)]
CH = [(i * BAR, b, c) for i, (c, b) in enumerate(BARS)]
MEL = [[(0, 74, 2), (2, 78, 1)], [(0, 81, 3)], [(0, 79, 1), (1, 78, 1), (2, 76, 1)], [(0, 76, 2), (2, 73, 1)],
       [(0, 74, 2), (2, 78, 1)], [(0, 83, 3)], [(0, 81, 1), (1, 79, 1), (2, 78, 1)], [(0, 76, 3)],
       [(0, 73, 2), (2, 76, 1)], [(0, 78, 2), (2, 74, 1)], [(0, 79, 2), (2, 76, 1)], [(0, 73, 3)],
       [(0, 74, 2), (2, 78, 1)], [(0, 83, 3)], [(0, 79, 1), (1, 78, 1), (2, 76, 1)], [(0, 76, 2), (2, 73, 1)],
       [(0, 74, 2), (2, 78, 1)], [(0, 81, 3)], [(0, 78, 2), (2, 74, 1)], [(0, 79, 1), (1, 76, 1), (2, 73, 1)], [(0, 74, 3)]]
SCALE = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83, 86, 88]       # D 大调五声


class Waltz(Song, SoftFX, Orchestra):
    pass


def add(*xs):
    n = max(len(x) for x in xs); y = np.zeros(n)
    for x in xs: y[:len(x)] += x
    return y


S = Waltz(END, CH, beat=BEAT, seed=11)
fr = S.fr
night = lambda f: 515 <= f < 860

# —— 圆舞曲伴奏：第一拍贝斯（拨弦 + 低音竖琴），二、三拍拨弦和弦 ——
for i, (ch, bass) in enumerate(BARS):
    f0 = i * BAR
    lv = 0.55 if i in (0,) else 0.8
    S.place(add(S.pizz(bass, 1.0), S.harp(bass + 12, 1.6, 0.5)), fr(f0), 0.9 * lv, -0.1)
    for k in (1, 2):
        sig = sum(S.pizz(m, 0.45) for m in ch[:3])
        S.place(sig, fr(f0 + k * BEAT), 0.55 * lv, 0.25 if k == 1 else -0.25, send=0.1)
    # 铺底：弦乐长音
    S.place(S.strings([m - 12 for m in ch] + [bass + 12], BAR / 60 * 1.02, 0.9 if night(f0) else 0.6, att=0.25, rel=0.6, bright=1800), fr(f0), 0.8, 0, send=0.3)
    # 旋律：白天钢片琴 + 竖琴，夜里弦乐独奏
    for beat, m, d in MEL[i]:
        t = f0 + beat * BEAT
        if night(t):
            S.place(S.strings([m], d * BEAT / 60, 1.4, att=0.08, rel=0.4, bright=3200), fr(t), 1.05, 0.15, send=0.4)
        else:
            S.place(add(S.celesta(m, 1.4, 1.0), S.harp(m - 12, 1.2, 0.5)), fr(t), 0.8, 0.15, send=0.35)

# —— 藤在长：沙沙的一层高频噪声，音量跟着主线的速度 ——
sp = np.array(EV['speed'])
sp = np.convolve(sp, np.ones(9) / 9, 'same')
n = int(fr(END) * S.SR)
noise = S.fft_filter(S.rng.standard_normal(n), lo=2500, hi=9000)
env = np.interp(np.arange(n) / S.SR * 60, np.arange(END), np.clip(sp / 40, 0, 1)) ** 1.3
pan = np.sin(np.arange(n) / S.SR * 0.7)
S.SFX[0, :n] += noise * env * 0.05 * (1 - 0.4 * pan)
S.SFX[1, :n] += noise * env * 0.05 * (1 + 0.4 * pan)


def gliss(f, notes, dt=1.2, lv=0.5, inst='harp'):
    for k, m in enumerate(notes):
        sig = S.harp(m, 1.4, 1.0) if inst == 'harp' else S.celesta(m, 1.0, 1.0)
        S.sfx(sig, fr(f + k * dt), lv, -0.6 + 1.2 * k / max(1, len(notes) - 1), send=0.4)


# —— 每个动作一个声音 ——
gliss(EV['halo'] - 10, SCALE[:10], 1.0, 0.45)                                  # 光环张开：竖琴往上刮
for k, t in enumerate(EV['dots']):                                              # 马赛克点：八音盒一颗颗
    S.sfx(S.celesta(SCALE[k % 9] + (12 if k % 18 >= 9 else 0), 0.6, 1.0), fr(t), 0.22, -0.7 + 1.4 * (k / 84), send=0.3)
gliss(EV['bloom'], [62, 66, 69, 74, 78, 81, 86], 2.5, 0.55)
S.sfx(add(S.marimba(50, 1.0), S.celesta(81, 0.8, 0.6)), fr(EV['sign']), 0.5, 0.2)  # 牌子垂下来
for k in (0, 1):                                                                # 两盏灯亮
    S.sfx(add(S.celesta(69 + 5 * k, 2.0, 1.0), S.strings([57 + 5 * k], 1.0, 0.8, att=0.2)), fr(TL['lamps'] + k * 6), 0.5, -0.4 + 0.8 * k, send=0.5)
rr = np.random.default_rng(3)
for t in EV['cells']:                                                           # 玻璃一块块嵌进去
    S.sfx(S.celesta(int(rr.choice(SCALE[4:])) + 12, 0.4, 0.8), fr(t), 0.12, float(rr.uniform(-0.6, 0.6)), send=0.4)
L0 = TL['light']                                                                 # 台灯亮：弦乐从弱到强吸进来，落在小节线上
S.place(S.strings([55, 62, 66, 71, 74], 1.2, 1.4, att=1.0, swell=True), fr(L0) - 1.0, 0.9, 0, send=0.4)
S.sfx(S.timpani(43, 0.8), fr(L0), 0.6, 0, send=0.3)
gliss(L0, [67, 71, 74, 78, 79, 83, 86, 90], 1.4, 0.5)
for t in EV['cards'] + EV['chips']:                                             # 界面元素弹出来
    S.sfx(S.bop(S.tone(t, int(t) % 4, 1), 0.8), fr(t), 0.35, 0.3, send=0.2)
for t in EV['flowers']:                                                         # 枝头的百合开
    S.sfx(S.harp(int(rr.choice(SCALE[3:9])), 1.2, 1.0), fr(t), 0.3, float(rr.uniform(-0.5, 0.5)), send=0.4)
# 收束：主线卷进去 —— 竖琴从低刮到高，定音鼓 + 全和弦落在第 19 小节
C = TL['curl']
gliss(C - 26, [50, 54, 57, 62, 66, 69, 74, 78, 81, 86], 2.6, 0.5)
S.place(S.timpani(38, 1.0), fr(C), 0.6, 0, send=0.3)
S.place(S.strings([50, 57, 62, 66, 69, 74], 2.6, 1.6, att=0.05, rel=1.6), fr(C), 0.55, 0, send=0.5)
S.place(add(S.celesta(86, 2.4, 1.0), S.celesta(81, 2.4, 0.7)), fr(C), 0.7, 0, send=0.5)

# —— 文字：每个字落定一声 ——
S.text_cues(EV['cues'], 0.6)
S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
