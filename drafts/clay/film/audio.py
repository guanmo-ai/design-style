"""黏土 配乐（一整首歌）。120 BPM（一拍 = 30 帧）· F 大调，四个和弦一圈。时间取自 timeline.js；字的“嗒”取自 events.json。
每个对泥做的动作一个声音：按 = 圆底鼓 + 噗；钢丝 = 一声细的“嘶”+ 落刀的“咔”；片倒下 = 软的落地；印 = 啵 + 噗；倒带 = 反向镲；立成字 = 弹簧音；最后一砸 = 重击 + 镲。
python3 audio.py out.wav"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from song import Song  # noqa: E402
from softfx import SoftFX  # noqa: E402

TL = json.loads(re.sub(r'//[^\n]*', '', re.search(r'const TL = (\{.*?\});', (HERE / 'timeline.js').read_text(), re.S).group(1)))
F, DM, BB, C = [65, 69, 72], [62, 65, 69], [62, 65, 70], [60, 64, 67]
CH = [(0, 41, F), (60, 38, DM), (120, 34, BB), (180, 36, C), (240, 41, F), (300, 38, DM), (360, 34, BB), (420, 36, C),
      (480, 41, F), (540, 34, BB), (TL['final'], 41, F)]
END, FIN = TL['end'], TL['final']


class ClaySong(Song, SoftFX):
    pass


S = ClaySong(END, CH, seed=11)
fr = S.fr

# —— 乐队：从第一帧就进（快节奏），倒带那一拍抽掉鼓 ——
S.drums(0, FIN, level=0.8, skip=((TL['back'][0], TL['back'][0] + 30),))
S.bassline(0, FIN, level=0.85)
S.pad(0.9, wave='square', fc=1200)
S.arp(TL['cuts'][0], TL['back'][0], level=0.45, wave='square')
S.hook(0, [(0, 77, 1), (1, 74, 1), (2, 72, 2), (4, 77, 1), (5, 79, 1), (6, 81, 2)], 0.9, inst=lambda m, d: S.marimba(m, 1.0) * 1.4)
S.transition(TL['cuts'][0], True, 0.5)
S.transition(TL['form'][0], True, 0.5)

# —— 按 ——
for at in TL['press']:
    S.thump(at, 0.9)
# 塌成泥卷：一声往下的弹簧音
S.sfx(S.boing(45, 0.9, 0.7), fr(TL['slump'][0] + 6), 0.6)
# 滚：一把刷过去
S.sfx(S.brush(1.2, 0.7, up=True), fr(TL['roll'][0] + 10), 0.5)
# 切：钢丝下来的“嘶” + 落到底的“咔” + 片倒下的软落地
for k, at in enumerate(TL['cuts']):
    S.sfx(S.brush(0.15, 0.8, up=True), fr(at - 9), 0.45, 0.3)
    S.sfx(S.tink(S.tone(at, k + 2, 1), 0.8, 0.12), fr(at), 0.5, 0.2)
    S.sfx(S.poof(0.9, 0.3), fr(at + 19), 0.8, -0.2, send=0.2)
    S.place(S.kick(0.6), fr(at + 19), 0.6)
# 印：一个八分音符一下，音高沿和弦往上
for k, at in enumerate(TL['prints']):
    S.sfx(S.bop(S.tone(at, k, 1), 1.0), fr(at), 0.6, -0.3 + 0.2 * k, send=0.3)
    S.sfx(S.poof(0.6, 0.2), fr(at + 2), 0.5)
# 倒带
S.place(S.rev_cymbal(0.8, 0.9), fr(TL['back'][0]), 0.5)
S.sfx(S.brush(0.7, 0.8, up=False), fr(TL['back'][0] + 8), 0.5)
# 立成字
S.sfx(S.boing(53, 1.0, 0.6), fr(TL['form'][0] + 30), 0.55)
# 收束：一砸 + 镲
S.thump(FIN, 1.3)
S.place(S.crash(1.0), fr(FIN), 0.7, send=0.5)

# —— 文字：每个字落定一声“嗒”，大字砸下来一记 ——
S.text_cues(json.loads((HERE / 'events.json').read_text())['cues'], 0.7)

S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
