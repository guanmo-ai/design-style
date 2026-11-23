"""朋克复印机 · 声音：代码合成的复印机声音层（扫描、胶带、贴纸、马克笔、旋钮、订书枪、标签机打字），
有配乐时（music/ 下的文件 + 环境变量 MUSIC_START=曲子第几秒对齐片子第 0 帧）把它压在配乐下面；没有配乐时单独出声音层。
python3 mix.py out.wav   （先 node render.mjs events events.json）"""
import json, os, subprocess, sys
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
EV = json.loads((HERE / 'events.json').read_text())
SR, FPS = 48000, 60
DUR = EV['end'] / FPS
N = int(DUR * SR)
rng = np.random.default_rng(76)
sfx = np.zeros((N, 2))
tt = lambda d: np.arange(int(d * SR)) / SR
def bp(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4) / np.sqrt(1 + (f / hi) ** 4), len(x))
def put(sig, frame, gain, pan=0.0):
    i = int(frame / FPS * SR)
    if i < 0: sig = sig[-i:]; i = 0
    if i >= N or len(sig) == 0: return
    sig = sig[:N - i]
    sfx[i:i + len(sig), 0] += sig * gain * np.cos((pan + 1) * np.pi / 4)
    sfx[i:i + len(sig), 1] += sig * gain * np.sin((pan + 1) * np.pi / 4)
def norm(y): return y / (np.abs(y).max() + 1e-9)
def env(t, d, a=0.01, r=0.05): return np.clip(t / a, 0, 1) * np.clip((d - t) / r, 0, 1)

def scan(d):            # 复印机扫一遍：电机嗡嗡 + 灯管扫过的气声（从左到右越来越亮），结尾“咔”一下归位
    t = tt(d + 0.25); y = np.zeros_like(t)
    hum = sum(np.sin(2 * np.pi * f * t * (1 + 0.004 * np.sin(2 * np.pi * 7 * t))) / (k + 1) for k, f in enumerate([98, 196, 294, 588]))
    y += 0.5 * hum * env(t, d, 0.04, 0.08)
    sweep = bp(rng.standard_normal(len(t)), 600, 7000) * (0.25 + 0.75 * np.clip(t / d, 0, 1)) * env(t, d, 0.05, 0.06)
    y += 0.55 * sweep
    k = (t > d) & (t < d + 0.25); tk = t[k] - d
    y[k] += 1.2 * (bp(rng.standard_normal(k.sum()), 900, 5000) * np.exp(-tk / 0.012) + 0.8 * np.sin(2 * np.pi * 120 * tk) * np.exp(-tk / 0.05))
    return norm(y)
def tape(d):            # 胶带拉出来：一串粘-脱的小爆裂
    t = tt(d); y = np.zeros_like(t)
    for _ in range(int(300 * d)):
        i = int(rng.random() * len(t) * 0.97); n = min(len(t) - i, int(0.003 * SR)); y[i:i + n] += rng.standard_normal(n) * np.exp(-np.arange(n) / (0.0006 * SR))
    return norm(bp(y, 1500, 9000) * np.sin(np.pi * t / d) ** 0.4)
def slap(w=1.0):        # 纸拍上去
    t = tt(0.16); return norm(bp(rng.standard_normal(len(t)), 400 / (0.6 + w), 6500) * np.exp(-t / 0.014) + 0.7 * min(w, 1.5) * np.sin(2 * np.pi * (140 - 40 * min(w, 1.4)) * t) * np.exp(-t / 0.045))
def marker(d):          # 马克笔：带一点音高的吱吱声
    t = tt(d); f = 2300 + 500 * np.sin(2 * np.pi * 5.3 * t) + 300 * np.sin(2 * np.pi * 1.7 * t)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 9 * t))) * 0.35 + bp(rng.standard_normal(len(t)), 2500, 8000)
    return norm(y * env(t, d, 0.02, 0.05))
def ratchet():          # 旋钮一格
    t = tt(0.018); return norm(bp(rng.standard_normal(len(t)), 2000, 9000) * np.exp(-t / 0.002) + 0.4 * np.sin(2 * np.pi * 3100 * t) * np.exp(-t / 0.003))
def whoosh(d, up=False):
    t = tt(d); x = rng.standard_normal(len(t)); y = bp(x, 300, 2500 if not up else 6000)
    shape = (t / d) ** 2.2 if up else np.sin(np.pi * t / d) ** 2
    return norm(y * shape)
def staple():           # 订书枪：一声闷响 + 金属“咔”
    t = tt(0.3); thump = np.sin(2 * np.pi * np.cumsum(55 + 90 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.07)
    clank = bp(rng.standard_normal(len(t)), 2500, 12000) * np.exp(-t / 0.006) + 0.5 * np.sin(2 * np.pi * 4200 * t) * np.exp(-t / 0.02) + 0.3 * np.sin(2 * np.pi * 6100 * t) * np.exp(-t / 0.015)
    return norm(thump + 0.8 * clank)
def key():              # 标签机压一个字：咔嗒
    t = tt(0.04); return norm(bp(rng.standard_normal(len(t)), 1200, 7000) * np.exp(-t / 0.004) + 0.5 * np.sin(2 * np.pi * 900 * t) * np.exp(-t / 0.008))
def tick():
    t = tt(0.02); return norm(bp(rng.standard_normal(len(t)), 2500, 9000) * np.exp(-t / 0.003))
def boom():             # 最后一击
    t = tt(1.2); return norm(np.sin(2 * np.pi * np.cumsum(42 + 60 * np.exp(-t / 0.05)) / SR) * np.exp(-t / 0.35) + 0.3 * bp(rng.standard_normal(len(t)), 80, 900) * np.exp(-t / 0.08))

for i, s in enumerate(EV['scans']):
    put(scan(s['dur'] / FPS), s['f'], 0.22, -0.5 + (i % 3) * 0.25)
a, b = EV['tape']; put(tape((b - a) / FPS), a, 0.20, 0.4)
put(slap(1.0), EV['sticker'], 0.34, 0.1)
a, b = EV['marker']; put(marker((b - a) / FPS), a, 0.07, 0.5)
put(whoosh(1.2 * (EV['photoLand'] - EV['photo']) / FPS), EV['photo'], 0.20, 0.5); put(slap(1.4), EV['photoLand'], 0.4, 0.2)
for a, b in EV['knob']:
    for f in np.arange(a, b, 3.0): put(ratchet(), f, 0.10, 0.5)
a, b = EV['dive']; put(whoosh((b - a) / FPS, up=True), a, 0.28)
for f in EV['slaps']: put(slap(1.5), f, 0.42, 0.3 * rng.standard_normal())
for f in EV['staples']: put(staple(), f, 0.30, 0.3 * rng.standard_normal())
for e in EV['text']:
    if e['k'] == 'key': put(key(), e['f'], 0.12, -0.4)
    elif e['k'] == 'slip': put(slap(0.7), e['f'], 0.22, -0.2)
    else: put(tick(), e['f'], 0.10, 0.3)
put(boom(), EV['final'], 0.5)
put(slap(0.8), EV['pin'], 0.3, 0.3)
def zap(d):             # 灰照片被压成黑白：一声电流“嗞”
    t = tt(d); y = np.sign(np.sin(2 * np.pi * (120 + 400 * t / d) * t)) * 0.3 + bp(rng.standard_normal(len(t)), 1500, 9000)
    return norm(y * np.exp(-t / (d * 0.5)))
def crackle(d):         # 黑里裂开成网点：一串细碎的爆裂
    t = tt(d); y = np.zeros_like(t)
    for _ in range(int(500 * d)):
        i = int((rng.random() ** 0.6) * len(t) * 0.97); n = min(len(t) - i, int(0.002 * SR)); y[i:i + n] += rng.standard_normal(n) * np.exp(-np.arange(n) / (0.0004 * SR))
    return norm(bp(y, 2000, 12000))
put(zap(0.25), EV['crush'], 0.16, 0.2)
a_, b_ = EV['flood']; put(whoosh((b_ - a_) / FPS, up=True), a_, 0.22)
a_, b_ = EV['crack']; put(crackle((b_ - a_) / FPS), a_, 0.16)
a_, b_ = EV['out']; put(whoosh((b_ - a_) / FPS), a_, 0.22, -0.2)
for i, f in enumerate(EV['ejects']): put(whoosh(0.16), f - 9, 0.16, 0.6); put(slap(0.9), f, 0.22, 0.2)
a_, b_ = EV['tear']; put(tape((b_ - a_) / FPS * 0.6), a_, 0.30, 0.0)

music = None
mdir = HERE / 'music'
cands = sorted([p for p in mdir.glob('*') if p.suffix.lower() in ('.wav', '.mp3', '.m4a', '.flac')]) if mdir.exists() else []
if cands:
    START = float(os.environ.get('MUSIC_START', '0'))
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{START:.4f}', '-t', f'{DUR:.4f}', '-i', str(cands[0]), '-ar', str(SR), '-ac', '2', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    music = np.frombuffer(raw, '<f4').reshape(-1, 2).astype(np.float64)
    music = np.vstack([music, np.zeros((max(0, N - len(music)), 2))])[:N]
    music *= 0.8 / np.abs(music).max()
    k = int(0.15 * SR); music[-k:] *= np.linspace(1, 0, k)[:, None] ** 2
    sfx *= 10 ** (-10 / 20) * np.sqrt((music ** 2).mean()) / (np.sqrt((sfx ** 2).mean()) + 1e-9)   # 声音层压在配乐下 10 dB
    mix = music + sfx
else:
    mix = sfx
def lufs(y):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], input=y.astype('<f4').tobytes(), capture_output=True)
    s = r.stderr.decode(); return float(json.loads(s[s.rindex('{'):s.rindex('}') + 1])['input_i'])
target = -14.0 if music is not None else -16.0
g = 10 ** ((target - lufs(mix)) / 20); mix *= g
pk = np.abs(mix).max()
if pk > 0.97: mix = np.tanh(mix / pk * 1.6) / np.tanh(1.6) * 0.97
out = sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'out/mix.wav')
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s16le', out], input=mix.astype('<f4').tobytes(), check=True)
print('%s · %.2fs · %.1f LUFS · peak before limit %.2f' % ('配乐 + 声音层' if music is not None else '只有声音层（还没有配乐）', DUR, lufs(mix), pk))
