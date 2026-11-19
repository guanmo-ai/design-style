"""达达 · 第二版声音：配乐是生成的《Cut and Paste》（music/cut-and-paste.mp3，128.63 BPM），从它的第 14 拍起用到结尾；
画面的拍点就是按这首量出来的。这里只在上面叠一层很轻的纸声：落地“啪”、剪刀“咔嚓”、撕纸、摇袋子、打字。
python3 mix.py out.wav   （先 node render.mjs events events.json）"""
import json, subprocess, sys
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
EV = json.loads((HERE / 'events.json').read_text())
SR, FPS = 48000, 60
START = 0.038 + 14 * 60 / 128.63 - EV['off'] / FPS          # 片子第 0 帧对应配乐的第几秒
DUR = EV['end'] / FPS
N = int(DUR * SR)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{START:.4f}', '-t', f'{DUR:.4f}', '-i', str(HERE / 'music/cut-and-paste.mp3'), '-ar', str(SR), '-ac', '2', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
mus = np.frombuffer(raw, '<f4').reshape(-1, 2).astype(np.float64)
mus = np.vstack([mus, np.zeros((max(0, N - len(mus)), 2))])[:N]
mus *= 0.8 / np.abs(mus).max()
k = int(0.012 * SR); mus[:k] *= np.linspace(0, 1, k)[:, None]
k = int(0.12 * SR); mus[-k:] *= np.linspace(1, 0, k)[:, None] ** 2

rng = np.random.default_rng(16)
sfx = np.zeros((N, 2))
tt = lambda d: np.arange(int(d * SR)) / SR
def bp(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4) / np.sqrt(1 + (f / hi) ** 4), len(x))
def put(sig, frame, gain, pan=0.0):
    i = int(frame / FPS * SR)
    if i < 0 or i >= N: return
    sig = sig[:N - i]
    sfx[i:i + len(sig), 0] += sig * gain * np.cos((pan + 1) * np.pi / 4)
    sfx[i:i + len(sig), 1] += sig * gain * np.sin((pan + 1) * np.pi / 4)
def norm(y): return y / (np.abs(y).max() + 1e-9)
def paper(w):            # 纸拍在纸上：很干的一下，越大越沉
    t = tt(0.14); return norm(bp(rng.standard_normal(len(t)), 500 / (0.6 + w), 6500) * np.exp(-t / 0.013) + 0.6 * min(w, 1.5) * np.sin(2 * np.pi * (150 - 50 * min(w, 1.4)) * t) * np.exp(-t / 0.04))
def thud():
    t = tt(0.3); return norm(np.sin(2 * np.pi * np.cumsum(46 + 70 * np.exp(-t / 0.03)) / SR) * np.exp(-t / 0.09))
def snip():
    t = tt(0.1); return norm(bp(rng.standard_normal(len(t)), 3500, 11000) * (np.exp(-t / 0.005) + 0.7 * np.exp(-np.abs(t - 0.03) / 0.004)))
def rip(d):
    t = tt(d); y = np.zeros_like(t)
    for _ in range(int(140 * d)):
        i = int(rng.random() * len(t) * 0.95); n = min(len(t) - i, int(0.004 * SR)); y[i:i + n] += rng.standard_normal(n) * np.exp(-np.arange(n) / (0.001 * SR))
    return norm(bp(y, 1200, 9000) * np.sin(np.pi * t / d) ** 0.6)
def tick():
    t = tt(0.02); return norm(bp(rng.standard_normal(len(t)), 2500, 9000) * np.exp(-t / 0.003))
def shake():
    t = tt(0.07); return norm(bp(rng.standard_normal(len(t)), 4000, 12000) * np.sin(np.pi * t / 0.07) ** 2)
def whoosh(d):
    t = tt(d); return norm(bp(rng.standard_normal(len(t)), 300, 2500) * np.sin(np.pi * t / d) ** 2)

for L in EV['land']:
    put(paper(L['w']), L['f'], 0.10 + 0.07 * min(L['w'], 1.5), 0.6 * L['pan'])
    if L['thump']: put(thud(), L['f'], 0.16 * min(L['thump'], 1.6), 0.3 * L['pan'])
put(thud(), EV['cut']['shift'], 0.18)
for f in EV['snaps']: put(snip(), f, 0.17, 0.1)
put(rip((EV['cut']['b'] - EV['cut']['a']) / FPS), EV['cut']['a'], 0.10)
for f, d in EV['tears']: put(rip(d / FPS), f, 0.2); put(whoosh(d / FPS), f, 0.10)
for f in (EV['liftoff'], EV['toss']): put(whoosh(0.4), f, 0.12)
for i in range(int(EV['shake']['dur'] / 4.5)): put(shake(), EV['shake']['f'] + i * 4.5, 0.12, 0.3 * (-1) ** i)
for f0, n, rate, kind in EV['cues']:
    for i in range(n): put(tick(), f0 + (i + 1) * rate, 0.035 if kind == 'small' else 0.05, -0.5)

mix = mus + sfx
def lufs(y):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], input=y.astype('<f4').tobytes(), capture_output=True)
    s = r.stderr.decode(); return float(json.loads(s[s.rindex('{'):s.rindex('}') + 1])['input_i'])
g = 10 ** ((-14.0 - lufs(mix)) / 20); mix *= g
pk = np.abs(mix).max()
if pk > 0.97: mix = np.tanh(mix / pk * 1.6) / np.tanh(1.6) * 0.97          # 峰值超了就软削，不硬切
out = sys.argv[1] if len(sys.argv) > 1 else str(HERE / 'out/mix.wav')
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s16le', out], input=mix.astype('<f4').tobytes(), check=True)
print('music from %.3fs · %.2fs · gain %.2f · peak before limit %.2f · %.1f LUFS · sfx/music rms %.1f dB' % (START, DUR, g, pk, lufs(mix), 20 * np.log10(np.sqrt((sfx ** 2).mean()) / np.sqrt((mus ** 2).mean()))))
