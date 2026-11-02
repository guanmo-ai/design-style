"""
Design Style · 风格 017 · 中世纪现代 Mid-Century Modern —— 配乐与音效（定稿，纯代码合成，无外部音源）

主人在两个候选里选了“明亮律动”（照 015 第二版的路子：大调、四拍底鼓、八度跳的贝斯、反拍钢琴、钟琴主旋律），
另一个候选是波萨诺瓦。之前两版（只有钢琴颤音琴、50 年代片头爵士）被评“太一般”“太急、难听”。

144 BPM（1 拍 = 25 帧）· F 大调 · 每小节 100 帧，从第 25 帧起，900 帧 = 9 小节，余音折回第 0 帧
和弦：F | C | Dm | B♭ | F | C | B♭ | C | F（规则段 B♭ → C 往上推，片尾落回 F）
  · 四拍底鼓（侧链压贝斯和钢琴）、二四拍拍手、反拍开镲、十六分沙锤
  · 八度跳的贝斯、反拍钢琴和弦
  · 钟琴主旋律：两小节一问一答，全片一直在唱
  · 换章：一下轻的“唰”（纸被拍进来）+ 钹 + 新和弦的铺底；落定都在小节第一拍（125 / 225 / 325 / 425 / 525）
  · 每块纸落下 = 一个落在当前和弦上的钟琴 / 木块音；年份和规则卡 = 一级级往上的“咚”；O / 唱片 / 手机 / 播放键 = 低频“咚”

用法：python3 styles/017-mid-century-modern/audio/make_music.py
输出：public/017-mid-century-modern/music.wav（响度 −14 LUFS，峰值 < −1.5 dBFS）
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'scripts'))
from lib.audio import AudioKit  # noqa: E402

DURATION = 900
audio = AudioKit(duration=DURATION / 60, seed=170, fps=60)
fr, place, sfx = audio.fr, audio.place, audio.sfx
BEAT, BAR0 = 25, 25

CH = {'F': (41, [65, 69, 72, 77]), 'C': (36, [64, 67, 72, 76]), 'Dm': (38, [65, 69, 74, 77]), 'Bb': (34, [65, 70, 74, 77])}
PROG = ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'C', 'F']


def chord_at(f):
    b = int((f - BAR0) // 100) % 9 if f >= BAR0 else 8
    return PROG[b]


def tone(f, k, octave=1):
    """当前和弦里的第 k 个音（往上数，跨八度）"""
    ts = CH[chord_at(f)][1]
    return ts[k % len(ts)] + 12 * (octave + k // len(ts))


# ───────── 节奏组 ─────────
for b in range(-1, 36):
    f = BAR0 + b * BEAT
    if f >= DURATION:
        break
    place(audio.kick(0.9), fr(f))
    audio.sidechain(f)
    if b % 2 == 1:
        place(audio.clap(0.75), fr(f), send=0.12)
    place(audio.hat(0.7, d=0.03, open_=True), fr(f + 12.5), pan=0.25)
    for s in range(4):
        place(audio.shaker(0.45 if s % 2 else 0.3), fr(f + s * 6.25), pan=-0.3)

BASSPAT = [0, 12, 0, 12, 0, 12, 7, 12]
for b in range(-1, 9):
    root, ts = CH[PROG[b % 9]]
    f0 = BAR0 + b * 100
    for k in range(8):
        place(audio.bass(root + BASSPAT[k], 0.2, 0.9), fr(f0 + k * 12.5))
    for k in range(4):
        place(audio.piano([m - 12 for m in ts], 0.4, 0.8), fr(f0 + k * BEAT + 12.5), pan=0.2, send=0.3)

# ───────── 钟琴主旋律：两小节一问一答 ─────────
CALL = [(0, 77), (12.5, 81), (25, 84), (37.5, 82), (50, 81), (62.5, 77), (75, 74), (87.5, 77)]
ANSWER = [(0, 79), (12.5, 77), (25, 74), (50, 72), (62.5, 74), (75, 77)]
for k, base in enumerate([125, 225, 325, 425, 525, 625, 725, 825]):
    for dt, m in (CALL if k % 2 == 0 else ANSWER):
        place(audio.bell(m, 0.6), fr(base + dt), pan=-0.2, send=0.4)

# ───────── 换章 ─────────
for t0 in (107, 207, 307, 407, 507, 632):
    sfx(audio.whoosh(fr(18), 400, 5000, 0.35, 0.6), fr(t0), pan=0.3)
for f in (125, 225, 325, 425, 525, 650):
    place(audio.crash(0.45), fr(f), send=0.3)
    place(audio.pad([m - 12 for m in CH[chord_at(f)][1]], fr(50), 0.6, att=0.3), fr(f), send=0.5)


def ping(f, k, level=0.35, pan=0.0):
    place(audio.bell(tone(f, k), level, 0.5), fr(f), pan=pan, send=0.3)


def thock(f, k, level=0.8, pan=0.0):
    sfx(audio.thock(tone(f, k, 0), level), fr(f), pan=pan)


def thud(f, level=0.6):
    sfx(audio.boom(level, 110, 40, 0.5), fr(f))


# ───────── 开场：海报 ─────────
for i in range(12):  # 12 颗球
    ping(2 + 2.5 * i, i, 0.35, -0.6 + 0.1 * i)
for i, f in enumerate([22 + 2 * k for k in range(4)] + [30 + 2 * k for k in range(7)]):  # MID- / CENTURY
    thock(f, i, 0.45, -0.4)
for k, f in enumerate([37.5, 43.75, 50, 56.25, 62.5]):  # MODERN
    thock(f, k + 2, 0.8)
thud(75, 0.7)  # O
place(audio.crash(0.6), fr(75), send=0.3)

# ───────── 各章 ─────────
for k in range(7):  # 01 手臂一节节落定
    ping(131 + 1.6 * k, k, 0.3, -0.5 + 0.15 * k)
for base in (169, 283, 377, 477, 581):  # 年份大字：1955 / 1953 / 1956 / 1960 / 2026
    for k in range(4):
        thock(base + 4 * k, k + 2, 0.6, 0.3)
for i in range(12):  # 02 钢丝
    ping(233 + 1.2 * i, i, 0.22, -0.5 + 0.09 * i)
for j in range(14):  # 02 球
    ping(247 + 2.5 * j, j, 0.3, -0.6 + 0.18 * (j % 7))
thud(341, 0.55)  # 03 唱片落定
for k in range(3):  # B O P
    thock(359 + 4 * k, k + 3, 0.8)
for k in range(6):  # 04 窗一盏盏亮
    ping(471 + 3.125 * k, k + 4, 0.3, 0.3 + 0.05 * k)
thud(539, 0.55)  # 05 手机落定
for k, f in enumerate([547, 553, 559] + [565 + 1.5 * i for i in range(6)]):  # 屏幕、封面、小唱片、ATOMIC
    ping(f, k + 2, 0.25)
thud(600, 0.6)  # 手按下播放键
place(audio.bell(84, 0.7, 1.0), fr(600), send=0.5)
for k, f in enumerate([675, 700, 725, 750, 775]):  # 五张规则卡
    thock(f, k + 1, 0.9)
for k in range(5):  # 卡片飞走
    ping(826 + 3 * k, 10 - k, 0.3, 0.5 - 0.2 * k)
sfx(audio.whoosh(fr(22), 5000, 400, 0.35, 0.4), fr(DURATION - 22), pan=0.5)  # 太阳从镜头上方落下

audio.master(ROOT / 'public/017-mid-century-modern/music.wav')
