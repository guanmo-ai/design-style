#!/usr/bin/env bash
# 出片：渲 126 帧并按整数倍率放大到 1920 × 1080（约 1 分钟）→ 合成声音 → 混流 → 量丝滑。
# 中间文件放在 $OUT（默认系统临时目录），成片写到本目录 pixel-sample.mp4。
set -euo pipefail
cd "$(dirname "$0")"
OUT="${OUT:-$(mktemp -d)}"
node film.mjs "$OUT"
python3 audio.py "$OUT/cues.json" "$OUT/sample.wav"
ffmpeg -y -loglevel error -i "$OUT/video.mp4" -i "$OUT/sample.wav" -c:v copy -c:a aac -b:a 192k -movflags +faststart -shortest pixel-sample.mp4
python3 ../../_lib/smooth.py pixel-sample.mp4 30
sha256sum pixel-sample.mp4
