"""
Design Style · 风格 015 · 未来主义 Futurism —— 配乐与音效（第二版，纯代码合成，无外部音源）

144 BPM 直拍（1 拍 = 25 帧；全片不变速）· 20 秒 = 12 小节 · D 大调，轻快的律动
  D | A | Bm | G | D | A | Bm | G | Em | G | A | Asus4 → 回到 D
乐器：四踩底鼓、二四拍拍手、反拍开镲、十六分沙锤；八度弹跳的贝斯（被底鼓“压”一下 = 侧链）；
      反拍的钢琴和弦；一句钟琴主题（开场落地后、规则段各来一次）；温暖的铺底只在“定格”和天空段出现。
结构（帧 / 60 = 秒）：
  0—25      前奏：慢动作的“呜——”、横幅撕开、八个字母一个个贴上镜头 = 八个调好音的“咚”，一级级往上
  25        落地：底鼓、贝斯、镲片一起进来（车头灯亮一下）
  25—285    律动 A：赛车起步的引擎从远到近 → 橙色车身甩走的“嗖” → 狗的小碎步（按真实步态算的每一步）、
            太太的鞋跟、闻东西、狗绳“嘣”一声（弹拨弦）、被拽走、小碎步追上 → 推近鞋子的上扬 → 匹配剪辑“锵”
  285—300   定格：鼓和贝斯一下停住，只剩铺底和一声带混响的聚光灯“哐”
  300       底座 TUMB 落在小节线上，鼓回来；312 第二声 TUMB（−3.5 dB = ÷1.5）；330 起上扬，344 白纸一闪
  350—650   律动 B：书页（ZANG 爆裂）、城（落块、电梯）、火车（每半圈一声 TA，越来越慢）
  650—750   天空：鼓收成只剩底鼓，风声越来越高、飞机掠过（多普勒）→ 冲进屏幕
  750—850   今天：轻一点的律动，界面轻点、速度往上的滑音、滚动的棘轮、打字声
  850—1100  规则：律动 C，每张卡撞进来一声铁砧（A C D E G A）
  1100—1200 片尾：最后一个和弦；片尾卡冲走；夜路上引擎从远处冲过来，接回开头（余音折回第 0 帧，循环无缝）

用法：python3 styles/015-futurism/audio/make_music.py
输出：public/015-futurism/music.wav（响度 −14 LUFS，峰值 < −1.5 dBFS）
"""
import os
import sys
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / 'scripts'))
from lib.audio import AudioKit

audio = AudioKit(duration=20.0, seed=15)
SR, DUCK = audio.SR, audio.DUCK
BEAT = 25
fr = audio.fr
place = audio.place
sfx = audio.sfx
tt = audio.tt
midi = audio.midi
fft_filter = audio.fft_filter
sweep = audio.sweep
saw = audio.saw
env = audio.env
kick = audio.kick
clap = audio.clap
hat = audio.hat
shaker = audio.shaker
crash = audio.crash
bass = audio.bass
piano = audio.piano
bell = audio.bell
pad = audio.pad
pluck_string = audio.pluck_string
whoosh = audio.whoosh
riser = audio.riser
boom = audio.boom
thock = audio.thock
click = audio.click
heel = audio.heel
rip = audio.rip
screech = audio.screech
engine = audio.engine
slowmo = audio.slowmo
shimmer = audio.shimmer
clank = audio.clank
anvil = audio.anvil
tom = audio.tom
hiss = audio.hiss
glide = audio.glide

# ───────── 编排 ─────────
CH = {
    'D': (38, [62, 66, 69, 74]), 'A': (33, [61, 64, 69, 73]), 'Bm': (35, [62, 66, 71, 74]), 'G': (31, [62, 67, 71, 74]),
    'Em': (40, [64, 67, 71, 76]), 'Asus': (33, [62, 64, 69, 74]),
}
PROG = ['D', 'A', 'Bm', 'G', 'D', 'A', 'Bm', 'G', 'Em', 'G', 'A', 'Asus']

# 鼓怎么打：每一段一种密度
def drums_at(f):
    if f < 25 or 285 <= f < 300 or 344 <= f < 352 or f >= 1150:
        return 'none'
    if 650 <= f < 750:
        return 'kick'  # 天空：只剩底鼓
    if 750 <= f < 850:
        return 'light'
    return 'full'


for b in range(48):
    fb = b * BEAT
    for sub_ in range(4):
        f = fb + sub_ * 6.25
        mode = drums_at(f)
        if mode == 'none':
            continue
        if sub_ == 0:
            place(kick(), fr(f))
            audio.sidechain(f)
            if mode in ('full', 'light') and b % 2 == 1:
                place(clap(0.8 if mode == 'light' else 1.0), fr(f), send=0.15)
        if mode == 'full':
            if sub_ == 2:
                place(hat(1.0, open_=True), fr(f), pan=0.25, send=0.05)
            place(shaker(0.9 if sub_ % 2 else 0.6), fr(f), pan=-0.3)
        elif mode == 'light' and sub_ == 2:
            place(hat(0.8), fr(f), pan=0.25)

BASSPAT = [0, 12, 0, 12, 0, 12, 7, 12]
for bar, name in enumerate(PROG):
    root, tones = CH[name]
    f0 = bar * 100
    for k in range(8):
        f = f0 + k * 12.5
        mode = drums_at(f)
        if mode in ('none',) and not (285 <= f < 300):
            continue
        if 285 <= f < 300:
            continue
        lvl = 0.75 if mode == 'light' else 1.0
        place(bass(root + BASSPAT[k], 0.2, lvl), fr(f))
    for k in range(4):  # 反拍的钢琴和弦
        f = f0 + k * BEAT + 12.5
        if drums_at(f) in ('none',) or drums_at(f) == 'kick':
            continue
        place(piano([m + 12 for m in tones], 0.45, 0.9), fr(f), pan=0.2, send=0.3)

# 铺底：定格、天空、片尾
place(pad([62, 66, 69, 73], fr(18), 0.9), fr(285), send=0.5)
place(pad([59, 62, 66, 71], fr(100), 0.8, att=0.8), fr(650), send=0.5)
place(pad([62, 66, 69, 74], fr(60), 0.8, att=0.1), fr(1100), send=0.5)

# 钟琴主题：落地之后、规则段、片尾
MOTIF = [(0, 78), (12.5, 81), (25, 85), (37.5, 83), (50, 81), (62.5, 78), (75, 76), (87.5, 78)]
for base in (25, 850, 950):
    for dt, m in MOTIF:
        place(bell(m, 0.7), fr(base + dt), pan=-0.2, send=0.4)
place(bell(86, 0.8, 1.5), fr(1100), send=0.6)

# ───────── 音效（帧号来自 video/ 里的轨迹） ─────────
# 片尾—开场：引擎从远处冲过来（1150 起，越来越近），撞开横幅
t_ = tt(fr(52))
near = (t_ / t_[-1]) ** 3
sfx(engine(fr(52), 70, 150, 2.0, 1.0, near), fr(1150), pan=0.1)
sfx(riser(fr(50), 1.4), fr(1150))
sfx(rip(0.5, 1.0), fr(0), send=0.3)
sfx(boom(0.7, 90, 35, 1.0), fr(0))
sfx(slowmo(fr(24), 1.0), fr(0), send=0.3)
sfx(screech(fr(14), 96, 88, 1.0), fr(1), pan=0.1)
LETTERS = [14.5, 15.7, 17, 18.2, 19.5, 20.8, 22, 23.3]
for i, (f, m) in enumerate(zip(LETTERS, [62, 64, 66, 69, 71, 74, 76, 78])):
    sfx(thock(m, 0.9), fr(f), pan=-0.6 + i * 0.17)
place(crash(1.0), fr(25), send=0.3)
sfx(shimmer(0.5, 1.0), fr(25), send=0.5)  # 车头灯亮一下
# 起步：往后一坐、轰油门、越来越近，车身盖满画面
sfx(engine(fr(36), 55, 220, 1.3, 1.5, np.minimum(1, (tt(fr(36)) / fr(36)) ** 1.5 + 0.2)), fr(56), pan=0.0)
sfx(whoosh(fr(22), 300, 9000, 0.9, 0.85), fr(76))
sfx(whoosh(fr(16), 6000, 300, 0.8, 0.2), fr(92), pan=-0.6)  # 橙色车身往左甩走

# 01 狗：真实步态的每一步、太太的鞋跟
PAWS = [104.9, 108.4, 111.9, 115.4, 118.9, 122.4, 125.9, 129.3, 132.8, 136.3, 139.8, 143.3, 146.8, 150.3, 153.8, 157.2, 160.7, 164.2, 167.7, 171.3,
        188.9, 190.6, 192.3, 193.8, 195.4, 196.9, 198.4, 199.9, 201.4, 202.9, 204.5, 206.1, 207.9, 209.7, 211.9, 214.4, 217.2, 220]
for i, f in enumerate(PAWS):
    sfx(click(0.55, 2500, 8000, 0.003), fr(f), pan=0.25 + 0.05 * (i % 2))
HEELS = [103.8, 115, 126.3, 137.5, 148.8, 160, 171.3, 182.5, 193.8, 205, 216.3, 227.5, 238.8]
for f in HEELS:
    sfx(heel(0.8), fr(f), pan=-0.3)
sfx(screech(fr(6), 90, 84, 0.5), fr(170), pan=0.2)  # 狗急刹
for f in (175, 179, 183):
    sfx(click(0.5, 600, 2500, 0.012), fr(f), pan=0.3)  # 闻
sfx(pluck_string(40, 0.7, 1.0, 0.55), fr(187), pan=0.1, send=0.2)  # 狗绳绷直“嘣”
sfx(whoosh(fr(10), 800, 5000, 0.6, 0.3), fr(188), pan=0.3)  # 被拽走
sfx(riser(fr(36), 0.6, 600, 7000), fr(214))  # 推近鞋子
sfx(heel(1.4), fr(250), pan=0.0, send=0.4)  # 鞋落地 = 铬银的脚落地
sfx(anvil(81, 0.6, 1.0), fr(250), send=0.5)

# 02 雕塑：跑步的落脚、定格、聚光灯、底座、TUMB
for k in range(1, 3):
    sfx(boom(0.25, 140, 60, 0.3), fr(285 - 16.13 * k), pan=0.1)
sfx(clank(1.0), fr(285), send=0.7)
sfx(shimmer(fr(15), 1.2), fr(285), send=0.6)
sfx(boom(1.0), fr(300), send=0.3)
place(crash(0.8), fr(300), send=0.3)
sfx(boom(10 ** (-3.5 / 20), 110, 40), fr(312), send=0.3)
sfx(riser(fr(14), 0.9), fr(330))
sfx(whoosh(fr(10), 2000, 9000, 0.6, 0.9), fr(340))

# 03—06：第一版的剧本整体往后挪 50 帧
S = 50
sfx(whoosh(fr(13), 1500, 9000, 0.6, 0.9), fr(312 + S), pan=-0.6)
sfx(boom(1.1, 140, 40), fr(325 + S), send=0.3)  # ZANG
place(crash(1.0), fr(325 + S), send=0.3)
for k, f in enumerate([331, 337]):
    sfx(tom(45 - 3 * k, 10 ** (-3.5 * (k + 1) / 20)), fr(f + S), pan=0.3 + 0.2 * k)
sfx(tom(47, 0.6), fr(348 + S), pan=-0.5)
sfx(glide(76, 52, fr(40), 1.4), fr(350 + S), pan=0.2)  # UUUUUUM 一路往下滑
sfx(whoosh(0.45, 400, 8000, 0.5), fr(374 + S), pan=-0.2)
for i in range(13):
    sfx(click(0.4, 2000, 7000), fr(384 + S + i * 1.4), pan=-0.6 + 0.1 * i)
for n in range(5):
    for j in range(2):
        sfx(boom(0.25, 150, 70, 0.3), fr(404 + S + n * 5 + j * 2.5), pan=-0.5 + 0.25 * n)
for n in range(3):
    sfx(glide(57, 69, 0.25, 0.7), fr(410 + S + n * 4), pan=-0.4 + 0.4 * n)
    for j in range(2):
        sfx(click(0.5), fr(428 + S + n * 3 + j * 2), pan=0.5 - j)
sfx(engine(fr(24), 120, 360, 0.6), fr(444 + S), pan=-0.2)  # 电梯上冲
sfx(click(0.8), fr(468 + S))
sfx(engine(fr(38), 300, 60, 0.6), fr(462 + S), pan=0.2)  # 往下冲
TAS = [502, 506.35, 511.1, 516.5, 522.9, 531.15, 547.25]
for i, f in enumerate(TAS):
    sfx(tom(50 - i, 0.7), fr(f + S), pan=0.4 - 0.1 * i)
    sfx(click(0.5, 3000, 11000), fr(f + S + 1), pan=0.3)
sfx(engine(fr(52), 80, 45, 0.7), fr(500 + S), pan=0.2)
sfx(screech(fr(24), 96, 86, 0.7), fr(528 + S), pan=0.2)
sfx(hiss(1.0, 1.0), fr(554 + S), pan=0.3, send=0.3)  # PSSSH
sfx(whoosh(fr(38), 300, 6000, 0.6, 0.8), fr(562 + S), send=0.2)
sfx(whoosh(0.5, 2000, 400, 0.6, 0.3), fr(612 + S), send=0.3)  # 破云
sfx(riser(fr(80), 1.0, 300, 8000), fr(614 + S))
t_ = tt(fr(70))
fpl = 140 * np.where(t_ < fr(54), 1.0 + 0.3 * t_ / fr(54), 1.3 * (0.55 ** ((t_ - fr(54)) / fr(16))))
plane = (saw(fpl) * 0.5 + saw(fpl * 1.5) * 0.3) * np.minimum(1, t_ / 0.2) * np.minimum(1, (t_[-1] - t_) / 0.1) * 0.1
sfx(fft_filter(plane, hi=2500), fr(616 + S))
sfx(whoosh(fr(18), 300, 9000, 0.7, 0.85), fr(686 + S))

# 07 今天
sfx(click(0.6), fr(770))
sfx(glide(57, 76, fr(24), 0.9), fr(770), pan=-0.4)
sfx(whoosh(0.2, 1500, 8000, 0.4, 0.4), fr(790), pan=-0.4)
sfx(click(1.0), fr(790), pan=-0.4)
sfx(boom(0.35, 140, 70, 0.3), fr(792), pan=0.5)
d_acc = last = 0.0
for f in np.arange(796, 818, 0.1):
    v = 4 * (f - 796) if f < 807 else max(0.0, 44 - 4 * (f - 807))
    d_acc += v * 0.1
    if d_acc - last >= 40:
        last = d_acc
        sfx(click(0.35, 3000, 6000), fr(f), pan=0.5)
for i in range(16):
    sfx(click(0.3, 4000, 9000), fr(818 + i * 1.9 + (i % 3) * 0.4), pan=0.4)

# 规则：每张卡撞进来一声铁砧
for i, m in enumerate([69, 72, 74, 76, 79, 81]):
    stop = 872 + 50 * i
    sfx(anvil(m, 0.8), fr(stop - 28 + 9), send=0.35)
    sfx(boom(0.4, 130, 50, 0.4), fr(stop - 28 + 9))
    sfx(whoosh(fr(26), 400, 7000, 0.3, 0.3), fr(stop - 28), pan=-0.4)
sfx(whoosh(fr(12), 300, 4000, 0.4, 0.5), fr(1128))  # 片尾卡撑满画面
sfx(whoosh(fr(26), 6000, 300, 0.8, 0.2), fr(1156), pan=0.6)  # 冲出右边


audio.master(Path(__file__).resolve().parents[3] / 'public/015-futurism/music.wav')
