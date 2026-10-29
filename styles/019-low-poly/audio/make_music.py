"""019 低多边形 · 电影感配乐（D 大调，120 BPM，20 秒 = 10 小节）。
python3 audio/make_music.py <out.wav>

结构（跟着画面走）：
  1—2 小节  山谷：钢琴主题 + 竖琴分解和弦 + 轻弦乐；三角形翻到位是纸声
  3—4       灯塔：三角形从天上砸下 —— 定音鼓 + 低音弦乐断奏推动；灯塔一节节弹上去，钢片琴往上走
  5—6       小星球：上升音效一路推到减面那两拍，每次减面一记电影冲击
  7—8       App：拨弦 + 钢片琴，轻快
  8—9       夜：八音盒 + 人声垫，鼓全部停
  9—10      结尾：弦乐渐强，18.4 秒片名出现时 D 大调全奏 + 冲击，最后钢琴独奏主题的前两个音，尾巴折回开头
所有音色在 scripts/lib/audio/orchestra.py；音效时间直接从各章脚本里取。"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..', '..')
sys.path.insert(0, os.path.join(ROOT, 'scripts', 'lib'))
sys.path.insert(0, os.path.join(HERE, '..', 'video'))
from audio import AudioKit  # noqa: E402
from audio.orchestra import Orchestra  # noqa: E402
import ch1_valley as C1  # noqa: E402
import ch2_lighthouse as C2  # noqa: E402
import ch3_planet as C3  # noqa: E402


class Kit(AudioKit, Orchestra):
    pass


A = Kit(duration=20.0, seed=19, fps=30.0, tail=4.0)
BEAT, BAR = 0.5, 2.0
b = lambda bar, beat=0.0: (bar - 1) * BAR + beat * BEAT   # 第几小节第几拍 → 秒

# 和弦（低音, [和弦音]）
CH = {1: (38, [62, 66, 69, 76]), 2: (35, [59, 62, 66, 69]), 3: (31, [59, 62, 67, 71]), 4: (33, [61, 64, 69, 73]),
      5: (35, [59, 62, 66, 71]), 6: (31, [62, 67, 71, 74]), 7: (38, [62, 66, 69, 74]), 8: (37, [61, 64, 69, 73]),
      9: (35, [59, 62, 66, 71]), 10: (33, [61, 64, 69, 76])}

# ---------- 钢琴主题 ----------
MEL = {1: [(0, 74), (0.5, 78), (1, 81), (1.5, 86), (2.5, 85), (3, 81)],
       2: [(0, 83), (1, 81), (1.5, 78), (2, 81), (3, 74)],
       3: [(0, 79), (0.5, 83), (1, 86), (2, 88), (3, 86)],
       4: [(0, 85), (1, 81), (2, 88), (2.5, 86), (3, 85)],
       7: [(0, 86), (0.5, 85), (1, 81), (2, 78), (3, 81)],
       9: [(0, 83), (2, 86)],
       10: [(0, 88), (1, 86), (1.5, 85)]}
for bar, notes in MEL.items():
    for beat, m in notes:
        A.place(A.grand(m, 2.2, 0.75), b(bar, beat), 0.9, pan=0.12, send=0.35)
# 结尾 19.4 秒起：主题前两个音，弱，接回开头
for beat, m in [(2.75, 74), (3.25, 78)]:
    A.place(A.grand(m, 2.0, 0.55), b(10, beat), 0.8, pan=0.12, send=0.45)

# 钢琴左手：每小节根音 + 五度
for bar, (lo, ch) in CH.items():
    if bar in (8,):
        continue
    A.place(A.grand(lo + 12, 2.4, 0.6), b(bar), 0.8, pan=-0.15, send=0.3)
    A.place(A.grand(lo + 19, 1.6, 0.45), b(bar, 2), 0.6, pan=-0.15, send=0.3)

# ---------- 竖琴分解和弦（山谷、App） ----------
for bar in (1, 2, 7):
    ch = CH[bar][1]
    for k in range(8):
        m = ch[[0, 1, 2, 3, 2, 1, 2, 3][k]] + (12 if k in (3, 4) else 0)
        A.place(A.harp(m, 1.6), b(bar, k * 0.5), 0.55, pan=0.35, send=0.4)

# ---------- 弦乐 ----------
for bar, (lo, ch) in CH.items():
    lvl = {1: 0.45, 2: 0.55, 3: 0.75, 4: 0.85, 5: 0.9, 6: 1.0, 7: 0.6, 8: 0.5, 9: 0.9, 10: 1.25}[bar]
    A.place(A.strings([m - 12 for m in ch[:3]], BAR + 0.1, lvl, att=0.5 if bar not in (9,) else 1.6, rel=0.9, swell=bar in (5, 9)), b(bar), 1.0, send=0.5)
    A.place(A.strings([lo, lo + 12], BAR + 0.1, lvl * 0.9, att=0.3, rel=0.8, bright=900), b(bar), 1.0, send=0.3)
# 灯塔章：低音弦乐八分音符断奏（推动“砸下来”）
for bar in (3, 4, 5, 6):
    lo = CH[bar][0] + 12
    for k in range(8):
        A.place(A.strings([lo], 0.16, 0.9, att=0.01, rel=0.08, bright=1500), b(bar, k * 0.5), 1.0, pan=-0.2, send=0.15)
# 结尾全奏：高八度旋律线 + 人声
A.place(A.strings([88, 86, 85][:1], 1.0, 0.8, att=0.3), b(10), 1.0, pan=0.2, send=0.6)
A.place(A.choir([62, 66, 69, 74], 3.5, 1.2, att=0.4, rel=2.0), 18.4, 1.0, send=0.6)
A.place(A.strings([62, 66, 69, 74, 78], 1.6, 1.1, att=0.08, rel=1.8, bright=3200), 18.4, 1.0, send=0.6)

# ---------- 夜：八音盒 + 人声垫，鼓停 ----------
A.place(A.choir([61, 64, 69], 2.6, 0.9, att=0.6), 15.0, 1.0, send=0.6)
for k, m in enumerate([88, 85, 81, 85, 90, 88, 85, 81]):
    A.place(A.celesta(m, 1.4), 15.05 + k * 0.29, 0.8, pan=0.3 * math.sin(k), send=0.6)

# ---------- 打击乐与冲击 ----------
for bar in (3, 4, 5, 6, 7):
    for k in range(4):
        A.place(A.kick(0.6 if k % 2 == 0 else 0.35), b(bar, k), 0.8)
        A.place(A.shaker(0.5), b(bar, k + 0.5), 0.6, pan=0.3)
    A.place(A.timpani(38 if bar % 2 else 33, 0.7), b(bar), 0.8, send=0.3)
for tt, lvl in ((4.5, 1.0), (8.0, 0.9), (8.0 + 1.75, 1.1), (8.0 + 2.25, 1.2), (18.4, 1.5)):
    A.place(A.hit(lvl), tt, 1.0, send=0.35)
# 换章：倒放膨胀落在下一章第一拍；减面前一路上升
for tt, bar in ((4.5, 3), (8.0, 5), (11.6, 7), (15.0, 8), (18.4, 10)):
    A.place(A.swell(CH[bar][1][:3], 1.0, 0.9), tt - 1.0, 1.0, send=0.2)
A.place(A.riser2(1.6, 1.0), 8.0 + 1.75 - 1.6, 1.0)
A.place(A.riser2(1.0, 0.8), 18.4 - 1.0, 1.0)

# ---------- 音效（跟画面同步，量化到十六分音符，避免太密） ----------
def paper(level=1.0):
    t = A.tt(0.05)
    return A._bp(A.rng.standard_normal(len(t)), 1500, 5500) * __import__('numpy').exp(-t / 0.012) * level * 0.12


seen = set()
for item in C1.TRIS:
    tt = item[2] + 0.5 * 0.82
    q = round(tt / 0.0625)
    if q in seen or not 0 <= tt < 4.5:
        continue
    seen.add(q)
    A.sfx(paper(0.7), q * 0.0625, pan=A.rng.uniform(-0.6, 0.6), send=0.1)
for (x, y, z, tpop, kind, col, s) in C1.TREES:
    A.sfx(A.marimba(CH[2][1][int(abs(x)) % 4] + 12, 0.6), tpop + 0.06, pan=max(-0.8, min(0.8, x / 30)), send=0.3)
for k in range(9):
    A.sfx(A.hiss(0.16, 0.6), 2.0 + k * 0.25, pan=0.2)
seen = set()
for (_, _, d, *_r) in C2.TRIS:                               # 灯塔章：三角形砸下来的“嗒”
    tt = 4.5 + d + 0.42 * 0.62
    q = round(tt / 0.0625)
    if q in seen or not 4.5 <= tt < 8.0:
        continue
    seen.add(q)
    A.sfx(A.thock(60 + (q % 5) * 2, 0.7), q * 0.0625, pan=A.rng.uniform(-0.5, 0.5), send=0.15)
for n in range(6):
    A.sfx(A.celesta(81 + [0, 2, 4, 7, 9, 12][n], 1.0), 4.5 + 1.15 + n * 0.06 + 0.12, 0.8, send=0.4)
for k in range(30):                                          # 星球的面飞回来：一串钢片琴碎音
    A.sfx(A.celesta(86 + [0, 2, 4, 7, 9][k % 5] + (12 if k % 3 == 0 else 0), 0.4), 8.0 + 0.05 + k * 0.025, 0.25, pan=A.rng.uniform(-0.7, 0.7), send=0.5)
for k in range(5):                                           # App：天气预报一格格弹出
    A.sfx(A.pizz(74 + [0, 2, 4, 7, 9][k], 1.0), 11.6 + 0.55 + k * 0.08 + 0.08, pan=-0.4 + k * 0.2, send=0.3)
for k in range(3):                                           # 夜：三档颜色
    A.sfx(A.celesta([88, 85, 81][k], 0.9), 15.0 + 0.8 + k * 0.12 + 0.08, send=0.5)
A.sfx(A.whoosh(1.0, 400, 5000, 0.7), 17.4, send=0.3)          # 山谷翻回一张纸

A.master(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'lowpoly.wav'))
