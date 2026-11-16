"""厚涂 · 第二版配乐：neo-soul / lo-fi。120 BPM 的半速律动（军鼓在第 3 拍），D 小调九和弦，7 小节 = 14 秒。
电钢琴（FM）铺和弦，立式贝斯 + 超低音，黑胶底噪；推到伞上那一下（第 3 小节第一拍）“落鼓”：弦乐吸进来、超低音、镲、钢琴旋律；
画活过来时雨声进；最后一笔红“啪”地拖过去，落在第 6 小节第一拍的 F 大九和弦上。
刷子的声音跟着“每一帧开始画几笔”走：大笔低沉、小笔细密；高光一下一下“嗒”。python3 audio.py out.wav"""
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / '_lib'))
from band import Band  # noqa: E402

EV = json.loads((HERE / 'events.json').read_text())
TL, END, BEAT = EV['TL'], EV['end'], 30
BAR = 120
Dm9, Bbm7, Gm9, Bbm9, A7, Fm9 = [50, 53, 57, 60, 64], [46, 50, 53, 57, 64], [43, 46, 50, 53, 57], [46, 50, 53, 57, 60], [45, 49, 55, 58, 61], [41, 45, 48, 52, 55]
BARS = [Dm9, Bbm7, Gm9, Bbm9, Gm9, A7, Fm9]
CH = [(i * BAR, c[0], c) for i, c in enumerate(BARS)]
S = Band(END, CH, beat=BEAT, seed=13, tail=3.5, swing=0.22)
fr = S.fr
DROP, UNDER = 3 * BEAT * 4, TL['under'] + 12          # 360：推到底；720：最后一笔落下
bar_of = lambda f: min(len(BARS) - 1, int(f // BAR))

# ───── 电钢琴：每小节第一拍一个和弦，第 2.5 拍切一下（切分）；最后一小节长音 ─────
for i, ch in enumerate(BARS):
    f0 = i * BAR
    voic = [m + 12 for m in ch[1:]]
    if i == len(BARS) - 1:
        continue
    S.put('keys', sum(S.rhodes(m, 1.6, 0.6) for m in voic), frame=f0, gain=0.6, pan=-0.15)
    S.put('keys', sum(S.rhodes(m, 0.5, 0.45) for m in voic[1:]), beat=i * 4 + 2.5, gain=0.45, pan=0.2)
    if i >= 1:
        S.put('keys', sum(S.rhodes(m, 0.3, 0.4) for m in voic[2:]), beat=i * 4 + 3.5, gain=0.35, pan=-0.3)

# ───── 鼓：半速。底鼓 1 和 2.75，军鼓在 3，镲是摇摆的八分 + 鬼音 ─────
for b in range(END // BEAT):
    bar, pos = divmod(b, 4)
    if bar == 0 and pos < 2:
        S.put('drums', S.hat2(0.5), beat=b + .5, gain=0.3, pan=0.4)
        continue
    if b * BEAT >= UNDER:
        break
    S.put('drums', S.hat2(0.8), beat=b, gain=0.42, pan=-0.35)
    S.put('drums', S.hat2(0.55), beat=b + .5, gain=0.32, pan=0.35)
    if pos == 0:
        S.kick_at(S.at(b), 0.9)
    if pos == 1 and bar >= 1:
        S.kick_at(S.at(b + .75), 0.7)
    if pos == 2:
        S.put('drums', S.snare2(0.9, tone=200, wire=0.9), beat=b, gain=0.6, pan=0.05)
        if bar >= 3:
            S.put('drums', S.clap2(0.8), beat=b, gain=0.35)
    if pos == 3 and bar >= 1:
        S.put('drums', S.snare2(0.25, wire=0.6), beat=b + .75, gain=0.18, pan=-0.1)         # 鬼音
S.put('drums', S.crash(1.0), frame=DROP, gain=0.5, pan=0.2)

# ───── 低音：立式贝斯（根音 + 五度 + 经过音），落鼓之后加超低音 ─────
for i, ch in enumerate(BARS[:-1]):
    f0, r = i * BAR, ch[0] - 12
    nxt = BARS[i + 1][0] - 12
    for beat, m, d in [(0, r, 1.4), (1.75, r + 7, .5), (2.5, r + 12, .4), (3.5, nxt + (1 if nxt < r else -1), .4)]:
        S.put('bass', S.upright(m, d * .45, 0.9, 0.45), beat=i * 4 + beat, gain=0.85)
    if f0 >= DROP:
        S.put('bass', S.sub(r - 12, BAR / 60 * .9, 0.8), frame=f0, gain=0.55)

# ───── 落鼓：弦乐、钢琴旋律 ─────
S.put('pad', S.strings([62, 69, 74, 77, 81], 1.2, 1.0, att=1.1, swell=True), frame=DROP - 66, gain=0.5)
for i in range(3, 6):
    S.put('pad', S.strings([m + 12 for m in BARS[i][:4]], BAR / 60 * 1.02, 0.9, att=0.4, rel=0.9, bright=2200), frame=i * BAR, gain=0.42)
MEL = {1: [(2.5, 74, .5), (3, 77, 1)], 2: [(2.5, 77, .5), (3, 81, 1)],
       3: [(0, 81, 1.5), (1.5, 79, .5), (2, 77, 1), (3, 76, 1)], 4: [(0, 74, 1), (1, 77, 1), (2, 81, 1.5), (3.5, 79, .5)], 5: [(0, 76, 2), (2, 73, 2)]}
for bar, notes in MEL.items():
    for o, m, d in notes:
        S.put('lead', S.grand(m, 1.2 + d * .5, 0.62), beat=bar * 4 + o, gain=0.55, pan=0.15)
        if bar >= 3:
            S.put('lead', S.glock(m + 12, 1.0, 0.5), beat=bar * 4 + o, gain=0.12, pan=0.3)

# ───── 收束：最后一笔红 → F 大九 ─────
S.sfx(S.rev_cymbal(0.6, 1.0), fr(UNDER) - 0.6, 0.4, 0, send=0.3)
S.sfx(S.brush(0.8, 0.22, True), fr(TL['under']), 0.8, -0.3, send=0.2)
S.sfx(S.poof(1.0, 0.3, 1200), fr(UNDER), 0.75, 0.2, send=0.3)
S.kick_at(UNDER, 1.0, 1.3)
S.put('keys', sum(S.rhodes(m, 4.0, 0.75) for m in [57, 60, 64, 67, 69, 76]), frame=UNDER, gain=0.65)
S.put('bass', S.upright(29, 2.5, 1.0, 0.4), frame=UNDER, gain=0.9)
S.put('bass', S.sub(29, 2.2, 0.8), frame=UNDER, gain=0.5)
S.put('pad', S.strings([53, 57, 60, 64, 69, 72], 3.2, 1.1, att=0.08, rel=2.0), frame=UNDER, gain=0.5)
S.put('lead', S.grand(81, 3.5, 0.7), frame=UNDER, gain=0.5)
S.put('lead', S.glock(93, 2.0, 0.6), frame=UNDER + 3, gain=0.15)

# ───── 黑胶 + 雨 ─────
n = int(fr(END) * S.SR); tsec = np.arange(n) / S.SR
vin = S.vinyl(n / S.SR, 1.0)
S.SFX[0, :n] += vin[:n] * 0.6; S.SFX[1, :n] += np.roll(vin[:n], 911) * 0.6
rain = S.fft_filter(S.rng.standard_normal(n), lo=1500, hi=11000) + 0.5 * S.fft_filter(S.rng.standard_normal(n), lo=300, hi=1500)
drops = np.zeros(n); idx = S.rng.integers(0, n, 7000); drops[idx] = S.rng.uniform(0.2, 1, len(idx))
drops = np.convolve(drops, np.exp(-np.arange(200) / 30), 'same')
renv = np.clip((tsec * 60 - TL['alive']) / 90, 0, 1) ** 1.5
S.SFX[0, :n] += (rain * 0.045 + drops * 0.02) * renv
S.SFX[1, :n] += (rain * 0.045 + np.roll(drops, 777) * 0.02) * renv

# ───── 刷子 ─────
def bed(counts, lo, hi, gain, smooth=7):
    c = np.convolve(np.array(counts, float), np.ones(smooth) / smooth, 'same'); c = c / max(1, c.max())
    env = np.interp(tsec * 60, np.arange(len(c)), np.clip(c, 0, 1)) ** .8
    noise = S.fft_filter(S.rng.standard_normal(n), lo=lo, hi=hi)
    wob = 1 + 0.35 * np.sin(2 * np.pi * 3.1 * tsec) * np.sin(2 * np.pi * 0.7 * tsec)
    pan = 0.5 * np.sin(tsec * 1.3)
    S.SFX[0, :n] += noise * env * wob * gain * (1 - pan); S.SFX[1, :n] += noise * env * wob * gain * (1 + pan)


bed(EV['big'], 250, 2400, 0.15); bed(EV['mid'], 600, 4800, 0.1); bed(EV['small'], 1800, 9000, 0.065); bed(EV['title'], 500, 5000, 0.12)
last = -9
for f, c in enumerate(EV['hi']):
    if c and f - last >= 3:
        S.sfx(S.bop(S.tone(f, int(f) % 5, 2), 0.5, 0.08), fr(f), 0.15, float(np.sin(f)) * 0.5, send=0.25); last = f
P0, P1 = TL['push']
S.sfx(S.riser2((DROP - P0) / 60, 0.5), fr(P0), 0.32, 0, send=0.3)
for k, f in enumerate(EV['palette']):
    S.sfx(S.poof(0.9, 0.2, 900), fr(f + 2), 0.35, -0.5 + 0.2 * k, send=0.3)
    S.put('keys', S.rhodes([69, 72, 74, 76, 79, 81][k], 0.6, 0.5), frame=f + 2, gain=0.3, pan=-0.5 + 0.2 * k)
S.text_cues(EV['cues'], 0.45)
S.mix(sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'music.wav'), levels=dict(keys=0.8, lead=0.7, pad=0.6, drums=0.9, bass=0.9), room=1.4, plate=0.9)
