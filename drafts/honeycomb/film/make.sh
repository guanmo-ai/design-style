#!/usr/bin/env bash
# 出片：文字 cue → 配乐 → 逐帧渲染（已渲的帧会跳过，断了重跑就接着渲）→ 合成 mp4 → 量一遍“丝滑”。在本目录运行：bash make.sh
set -euo pipefail
cd "$(dirname "$0")"
NAME=honeycomb
END=870
OUT=${TMPDIR:-/tmp}/$NAME-frames
node ../../_lib/events.cjs film.html events.json
python3 audio.py "$OUT.wav"
node ../../_lib/film-gl.cjs film.html "$OUT" 0 "$END" 3 1
ffmpeg -y -loglevel error -framerate 60 -i "$OUT/%04d.jpg" -i "$OUT.wav" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 192k -movflags +faststart -shortest "$NAME-film.mp4"
echo "wrote $NAME-film.mp4"
python3 ../../_lib/smooth.py "$NAME-film.mp4"      # 逐个核对它列出的跳变是不是有意的
