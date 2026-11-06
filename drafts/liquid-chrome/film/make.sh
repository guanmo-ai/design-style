#!/usr/bin/env bash
# 出片：配乐 → 逐帧渲染（WebGL，两页并行，已渲的帧会跳过）→ 合成 mp4。在本目录运行：bash make.sh
set -euo pipefail
cd "$(dirname "$0")"
NAME=liquid-chrome
OUT=${TMPDIR:-/tmp}/$NAME-frames
node ../../_lib/events.cjs film.html events.json   # 文字出场的 cue（配乐里每个字一声）
python3 audio.py "$OUT.wav"
node ../../_lib/film-gl.cjs film.html "$OUT" 0 1080 2
ffmpeg -y -loglevel error -framerate 60 -i "$OUT/%04d.jpg" -i "$OUT.wav" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart -shortest "$NAME-film.mp4"
echo "wrote $NAME-film.mp4"
