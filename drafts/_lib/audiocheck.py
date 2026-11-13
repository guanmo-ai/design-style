"""配乐 / 音效的数字检查（Claude 听不见，只能量）。主人 2026-11-13：“BGM 音效一定要做好”。
python3 drafts/_lib/audiocheck.py <成片.mp4 或 .wav> [对照.mp4 ...]

量这几件事，并和对照片并排列出来：
- 响度（LUFS，ffmpeg ebur128）、峰值（dBFS）：目标 −14 左右、不削波。
- 噪音感：频谱平坦度（0 = 纯音，1 = 白噪声）的中位数，和 4—12 kHz 宽带能量占比。沙画第一版（主人：“甚至还有噪音的感觉”）是反例。
- 律动：起音强度的自相关，在一拍处有没有峰（有鼓 / 有拍子的歌这个数明显 > 0）。
- 空洞：0.5 秒窗口里响度比全片中位低 18 dB 以上的段落（除了片尾）。
它量不出“好不好听”，只能把明显的问题（噪音、没节奏、断掉）找出来。"""
import subprocess
import sys

import numpy as np

SR = 24000


def load(path):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-vn', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def lufs(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-vn', '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    for line in r.splitlines()[::-1]:
        if line.strip().startswith('I:'):
            return float(line.split()[1])
    return float('nan')


def stats(path):
    x = load(path)
    n, hop = 2048, 512
    w = np.hanning(n)
    frames = np.lib.stride_tricks.sliding_window_view(x, n)[::hop] * w
    S = np.abs(np.fft.rfft(frames, axis=1)) ** 2 + 1e-12
    fq = np.fft.rfftfreq(n, 1 / SR)
    band = (fq > 60) & (fq < 11000)
    flat = np.exp(np.mean(np.log(S[:, band]), axis=1)) / np.mean(S[:, band], axis=1)
    e = S.sum(axis=1)
    loud = e > np.percentile(e, 30)
    hi = S[:, (fq > 4000) & (fq < 12000)].sum(axis=1) / e
    # 起音强度（谱通量）→ 自相关找拍子
    flux = np.maximum(0, np.diff(np.log(S[:, band]), axis=0)).sum(axis=1)
    flux = flux - flux.mean()
    ac = np.correlate(flux, flux, 'full')[len(flux) - 1:]
    ac /= ac[0] + 1e-9
    lag = np.arange(len(ac)) * hop / SR
    rng = (lag > 0.25) & (lag < 1.0)
    bl = lag[rng][np.argmax(ac[rng])]
    beat_strength = ac[rng].max()
    # 空洞
    win = int(0.5 * SR)
    rms = np.array([np.sqrt(np.mean(x[i:i + win] ** 2)) + 1e-9 for i in range(0, len(x) - win, win // 2)])
    db = 20 * np.log10(rms)
    holes = [round(i * 0.25, 2) for i, v in enumerate(db[:-4]) if v < np.median(db) - 18]
    return dict(lufs=lufs(path), peak=20 * np.log10(np.abs(x).max() + 1e-9), flat=float(np.median(flat[loud])), hi=float(np.median(hi[loud])),
                beat=float(beat_strength), beat_s=float(bl), holes=holes, dur=len(x) / SR)


if __name__ == '__main__':
    print(f'{"文件":44s} {"LUFS":>6s} {"峰值":>6s} {"平坦度":>6s} {"高频占比":>7s} {"律动":>5s} {"拍长s":>6s}  空洞(秒)')
    for p in sys.argv[1:]:
        s = stats(p)
        name = p if len(p) <= 44 else '…' + p[-43:]
        print(f'{name:44s} {s["lufs"]:6.1f} {s["peak"]:6.1f} {s["flat"]:6.3f} {s["hi"]:7.3f} {s["beat"]:5.2f} {s["beat_s"]:6.3f}  {s["holes"][:8]}')
