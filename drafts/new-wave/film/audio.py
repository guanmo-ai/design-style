"""新浪潮全片配乐（第二版）。主体是主人用 AI 生成的 Minimalist Design Pulse（music/minimalist-design-pulse.m4a）：
D 大调、130.07 BPM、两架钢琴交错的极简脉冲 + 干净的电子节拍——本身就是“叠”和“错位”做成的音乐。
量出来的骨架：一拍 0.4613 秒（27.678 帧），第 0 拍在 0.066 秒；第 8 拍节拍整个进来，第 24 拍换段，第 39 拍最后一击、余音到 20 秒。
画面的时间轴（timeline.js）整个排在这张拍子网格上，所以这里不剪、不拉伸音乐，只在上面加很轻的音效。

主人说第一版“好像有噪音”（白噪声的镲、门限混响尾巴、扫频的“唰”），所以这一版的音效全是调好音的短音（D 大调），几乎不用噪声，
整体压在音乐下面：出字一声轻点、字落台阶一级一个木琴音、叠出颜色一个钟琴和弦、砸下时一记低频。
python3 audio.py out.wav"""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from song import Song  # noqa: E402

TL = json.loads(re.search(r'const TL = (\{.*?\});', (HERE / 'timeline.js').read_text(), re.S).group(1))
END = TL['end']
FB = lambda b: TL['off'] + b * TL['beat']          # noqa: E731  第 b 拍在第几帧
D, E, FS, G, A, B, CS = 62, 64, 66, 67, 69, 71, 73   # D 大调
DMAJ = [D, FS, A]
S = Song(END, [(0, 38, DMAJ)], beat=TL['beat'], seed=41, tail=0.5)
fr = S.fr


def music():
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', str(HERE / 'music' / 'minimalist-design-pulse.m4a'),
                          '-f', 'f32le', '-ac', '2', '-ar', str(S.SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).T.copy()


# —— 音色：都是短的、调好音的 ——
def tick(m, level=1.0):
    """出字：一下很轻的“嗒”（正弦 + 二次泛音，1 毫秒起音，25 毫秒衰减），没有噪声"""
    t = S.tt(0.06)
    f = S.midi(m)
    y = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t / 0.022) * np.minimum(1, t / 0.001)
    return y * level * 0.5


def mallet(m, level=1.0, dec=0.18):
    """木琴：基音 + 4 倍泛音（很快消失）"""
    t = S.tt(dec * 4)
    f = S.midi(m)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / dec) + 0.35 * np.sin(2 * np.pi * 3.93 * f * t) * np.exp(-t / (dec / 6))
    return y * np.minimum(1, t / 0.0015) * level * 0.5


def air(d=0.22, level=1.0, up=True):
    """胶片滑过去：一团很窄的低通气声 + 一个往上（或往下）滑的正弦，没有高频嘶声"""
    t = S.tt(d)
    e = np.sin(np.pi * t / d) ** 2
    n = S.fft_filter(S.rng.standard_normal(len(t)), lo=180, hi=1200) * 0.12
    f = 300 * (3 ** (t / d if up else 1 - t / d))
    g = np.sin(2 * np.pi * np.cumsum(f) / S.SR) * 0.25
    return (n + g) * e * level


def glide(m0, m1, d=0.16, level=1.0):
    t = S.tt(d)
    f = S.midi(m0) * (S.midi(m1) / S.midi(m0)) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / S.SR) * np.sin(np.pi * t / d) ** 0.7 * level * 0.35


def sub(level=1.0, f0=110, f1=40, d=0.7):
    t = S.tt(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.05)
    return np.sin(2 * np.pi * np.cumsum(f) / S.SR) * np.exp(-t / 0.28) * np.minimum(1, t / 0.002) * level * 0.7


SFX = []   # (信号, 帧, 增益, 声像, 混响)
add = lambda sig, f, g, pan=0.0, send=0.15: SFX.append((sig, f, g, pan, send))   # noqa: E731

# 00 封面 → 冲进青色圆片
add(air(0.5, 1.0, True), TL['iris'][0] + 8, 0.5)
# 01 叠：三张片子三声气，每叠出一种颜色一个钟琴和弦（往上走）
for k, at in enumerate(TL['films']):
    add(air(0.2, 1.0, True), at - 6, 0.45, [-0.6, 0.6, 0.0][k])
for k, at in enumerate(TL['labels']):
    for j, m in enumerate(DMAJ):
        add(S.bell(m + 12 + 5 * (k % 2) + 12 * (k // 3), 0.9, 0.45), at + j * 1.5, 0.22, -0.3 + 0.2 * k, 0.35)
add(air(0.3, 1.0, True), TL['push1'][0], 0.5)
# 02 台阶：十个字一级一个木琴音（D 大调音阶往下走）
SCALE = [86, 85, 83, 81, 79, 78, 76, 74, 73, 71]
for i in range(10):
    add(mallet(SCALE[i] - 12, 1.0), TL['stairs0'] + i * TL['stairStep'], 0.42, -0.6 + 0.13 * i, 0.2)
add(air(0.6, 1.0, True), TL['zoomO'][0] + 6, 0.5)
# 03 字距：一开一合的滑音
prev = -150
for at, v in zip(TL['track'], [0, 300, -150, 700]):
    add(glide(A, A + 12, 0.15) if v > prev else glide(A + 12, A, 0.15), at - 2, 0.45)
    prev = v
add(air(0.4, 1.0, False), TL['toGrid'][0], 0.4)
# 04 网格：块落进格子、打碎后吸到栏线，都是很轻的木块声
for i in range(8):
    add(mallet(DMAJ[i % 3] + 24, 0.8, 0.05), TL['blocks0'] + i * 3 + 6, 0.25, -0.5 + 0.14 * i)
for t0 in (TL['break'], TL['break2']):
    add(air(0.18, 1.0, True), t0 - 4, 0.35)
    for i in range(8):
        add(mallet([86, 90, 93][i % 3], 0.8, 0.04), t0 + i * 2 + 9, 0.22, -0.6 + 0.17 * i)
# 网点连成黑（第 24 拍音乐换段）：一记低频；从一颗点里退出来：往下的气；色阶一格一个钟琴音
add(sub(1.0, 100, 36, 0.9), TL['s5'], 0.7, 0.0, 0.1)
add(air(0.8, 1.0, False), TL['s5'] + 2, 0.4)
for i in range(6):
    add(S.bell([D, E, FS, A, B, D + 12][i] + 12, 0.8, 0.3), TL['s5'] + 50 + i * 3, 0.22, -0.3 + 0.12 * i, 0.35)
add(air(0.35, 1.0, True), TL['lines'][0], 0.45)
# 06 用起来：一拍一推，每推一张一声气
for k, at in enumerate(TL['layouts'][1:]):
    add(air(0.22, 1.0, k % 2 == 0), at - 10, 0.38, [-0.5, 0.0, 0.5, 0.0, -0.5][k])
# 07 收束：片子飞回来 → NEW 砸下（第 36 拍）→ WAVE 走台阶 → 印版对准 → 第 39 拍和音乐最后一击一起砸
add(air(0.3, 1.0, True), TL['push7'][0], 0.45)
for k in range(3):
    add(air(0.2, 0.8, True), TL['s7'] + 2 + 6 * k, 0.3, [-0.6, 0.6, 0.0][k])
add(sub(1.0, 120, 40, 0.8), TL['slam'], 0.75, 0.0, 0.15)
add(mallet(D, 1.0, 0.3), TL['slam'], 0.4)
for i in range(4):
    add(mallet([81, 78, 74, 69][i], 1.0), TL['wave'] + i * 7, 0.38, -0.5 + 0.33 * i, 0.2)
add(mallet(D + 24, 1.0, 0.05), TL['register'], 0.45)
add(air(0.25, 0.8, False), TL['card'] + 4, 0.3, 0.6)
add(sub(1.0, 110, 36, 1.2), TL['snap'], 0.8, 0.0, 0.2)

# 出字：每落定一个字一声轻点；同一时间最多每 3 帧一声，免得像机关枪
cues = [c for c in json.loads((HERE / 'events.json').read_text())['cues'] if c[0] >= 0]
last = -99
for f0, n, rate, kind in cues:
    step = max(rate, 3.0 if kind != 'title' else 2.5)
    for j in range(int(np.ceil(n * rate / step))):
        at = f0 + j * step
        if at - last < 2.5:
            continue
        last = at
        m = [D, FS, A, B][int(S.rng.integers(0, 4))] + (24 if kind != 'title' else 12)
        add(tick(m, 1.0) if kind != 'title' else mallet(m, 0.9, 0.06), at, 0.16 if kind == 'small' else 0.22 if kind == 'type' else 0.3, 0.4 * np.sin(j * 0.9 + f0), 0.08)

# —— 混音：音乐原样 + 音效（一点点混响）→ 响度 −14 LUFS，限幅，不做饱和 ——
mus = music()
n = int(round(END / 60 * S.SR))
mix = np.zeros((2, n))
mix[:, :min(n, mus.shape[1])] = mus[:, :n]
fx, send = np.zeros((2, n + S.SR)), np.zeros((2, n + S.SR))
for sig, f, g, pan, sd in SFX:
    i = int(fr(f) * S.SR)
    if i < 0 or i >= n:
        continue
    seg = sig[:n + S.SR - i]
    L, R = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    fx[0, i:i + len(seg)] += seg * g * L * 1.41; fx[1, i:i + len(seg)] += seg * g * R * 1.41
    send[0, i:i + len(seg)] += seg * g * sd; send[1, i:i + len(seg)] += seg * g * sd
fx[0] += S.reverb(send[0], 1, dec=0.5, length=1.6)[:fx.shape[1]] * 0.5
fx[1] += S.reverb(send[1], 2, dec=0.5, length=1.6)[:fx.shape[1]] * 0.5
mrms = np.sqrt((mus ** 2).mean())
mix += fx[:, :n] * mrms / 0.12 * 0.5          # 音效按音乐的响度定，整体低于音乐
mix[:, -int(0.15 * S.SR):] *= np.linspace(1, 0, int(0.15 * S.SR)) ** 2
out = sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'new-wave.wav')
S.final = out
y = mix.T * (0.5 / (np.abs(mix).max() + 1e-9))
for _ in range(3):
    y = S.limit(y * 10 ** ((-14.0 - S.loudness(y)) / 20))
print('loudness %.2f LUFS · peak %.3f' % (S.loudness(y), np.abs(y).max()))
S.write(out, y)
print('wrote', out)
