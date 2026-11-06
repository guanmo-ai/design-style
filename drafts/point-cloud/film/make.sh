#!/usr/bin/env bash
# 出片：配乐 → 逐帧渲染（WebGL，两页并行，已渲的帧会跳过）→ 合成 mp4。在本目录运行：bash make.sh
set -euo pipefail
cd "$(dirname "$0")"
NAME=point-cloud
OUT=${TMPDIR:-/tmp}/$NAME-frames
node ../../_lib/events.cjs film.html events.json   # 文字出场的 cue（配乐里每个字一声）
python3 audio.py "$OUT.wav"
node ../../_lib/film-gl.cjs film.html "$OUT" 0 1230 2
# 一百万个点每帧都在动，crf 18 会有 190 MB：两遍编码，17 Mbps ≈ 38 MB
ffmpeg -y -loglevel error -framerate 60 -i "$OUT/%04d.jpg" -c:v libx264 -preset slow -b:v 17M -pass 1 -passlogfile "$OUT-pass" -pix_fmt yuv420p -an -f null /dev/null
ffmpeg -y -loglevel error -framerate 60 -i "$OUT/%04d.jpg" -i "$OUT.wav" -c:v libx264 -preset slow -b:v 17M -maxrate 24M -bufsize 34M -pass 2 -passlogfile "$OUT-pass" \
  -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -shortest "$NAME-film.mp4"
echo "wrote $NAME-film.mp4"
