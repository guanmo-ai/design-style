#!/usr/bin/env bash
# 出片：渲 150 帧（约 2 秒）→ 合成声音 → 最近邻放大 6 倍编码 → 量丝滑。
# 中间文件放在 $OUT（默认系统临时目录），成片写到本目录 pixel-sample.mp4。
set -euo pipefail
cd "$(dirname "$0")"
OUT="${OUT:-$(mktemp -d)}"
node film.mjs "$OUT"
python3 audio.py "$OUT/cues.json" "$OUT/sample.wav"
# 像素放大：只用最近邻；色度保留全分辨率（yuv444 会让部分播放器打不开，所以先放大再转 420，6 倍放大后色块边缘仍然干净）
ffmpeg -y -loglevel error -f rawvideo -pix_fmt rgba -s 320x180 -framerate 30 -i "$OUT/frames.rgba" -i "$OUT/sample.wav" \
  -vf "scale=1920:1080:flags=neighbor,format=yuv420p" -c:v libx264 -preset slow -crf 16 -tune animation \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 192k -movflags +faststart -shortest pixel-sample.mp4
python3 ../../_lib/smooth.py pixel-sample.mp4 30
sha256sum pixel-sample.mp4
