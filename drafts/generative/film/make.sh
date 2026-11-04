#!/usr/bin/env bash
# 出片：导出动作时间 → 配乐 → 逐帧截图（3 个页面并行，旧帧会被覆盖）→ 合成 mp4。在本目录运行：bash make.sh
set -euo pipefail
cd "$(dirname "$0")"
NAME=$(basename "$(dirname "$PWD")")
OUT=${TMPDIR:-/tmp}/$NAME-frames
node ../../_lib/events.cjs film.html events.json
python3 audio.py "$OUT.wav"
node ../../_lib/film.cjs film.html "$OUT" 0 480 3
ffmpeg -y -loglevel error -framerate 60 -i "$OUT/%04d.png" -i "$OUT.wav" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart "$NAME-sample.mp4"
echo "wrote $NAME-sample.mp4"
