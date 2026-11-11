"""__TITLE__ 配乐（一整首歌）。120 BPM（一拍 = 30 帧）· F 大调。从第一拍到最后一拍是同一首歌，换章只换和弦。
时间取自 timeline.js；每个字落定的“嗒”取自 events.json（node ../../_lib/events.cjs film.html events.json）。python3 audio.py out.wav
起步版只有鼓、贝斯、铺底、一句旋律和几个动作的声音——每个动作一个声音，时间直接写帧号。"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from song import Song  # noqa: E402
from softfx import SoftFX  # noqa: E402  “噗”“啵”、刷过去、弹簧音、软的落地（不合这一期的气质就换掉）

TL = json.loads(re.sub(r'//[^\n]*', '', re.search(r'const TL = (\{.*?\});', (HERE / 'timeline.js').read_text(), re.S).group(1)))
F, DM, BB, C = [65, 69, 72], [62, 65, 69], [62, 65, 70], [60, 64, 67]
CH = [(0, 41, F), (60, 34, BB), (TL['ch1'], 38, DM), (TL['ch1'] + 60, 36, C), (TL['swing'], 34, BB), (TL['swing'] + 60, 36, C), (TL['final'], 41, F)]   # (起始帧, 贝斯根音, 和弦)
END, FIN = TL['end'], TL['final']


class FilmSong(Song, SoftFX):
    pass


S = FilmSong(END, CH, seed=7)
fr = S.fr

# —— 乐队 ——
S.drums(60, FIN, level=0.85)
S.bassline(60, FIN, level=0.9)
S.pad(1.0, wave='square', fc=1100)
S.hook(60, [(0, 77, 1), (1, 74, 1), (2, 70, 2)], 1.0, inst=lambda m, d: S.marimba(m, 1.0) * 1.5)
S.transition(TL['ch1'], True, 0.6)

# —— 每个动作一个声音 ——
S.thump(TL['hit'], 1.2)                                                       # 第一下重击
for k, at in enumerate(TL['pops']):
    S.sfx(S.bop(S.tone(at, k, 1), 1.0), fr(at), 0.6, -0.5 + 0.2 * k, send=0.3)   # 小珠子一颗颗弹出来，音高沿和弦往上
S.sfx(S.brush(0.4, 0.9), fr(TL['swing']), 0.7)                                # 甩一下
S.place(S.kick(1.3), fr(FIN), 1.0); S.kicks.append(FIN)                      # 收束：一个动作 + 一个声音
S.place(S.crash(0.9), fr(FIN), 0.6, send=0.5)

# —— 文字：每个字落定一声“嗒”，标题是键帽声 ——
S.text_cues(json.loads((HERE / 'events.json').read_text())['cues'], 0.8)

S.master(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), loop=False)
