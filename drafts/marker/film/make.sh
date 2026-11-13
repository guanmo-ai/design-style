#!/usr/bin/env bash
# 出片：动作时刻 → 配乐 → 逐帧渲染（已渲的帧会跳过，断了重跑就接着渲）→ 合成 mp4 → 量一遍“丝滑”。在本目录运行：bash make.sh
# 预览：PREVIEW=1 bash make.sh（隔一帧渲一帧、不做运动模糊）
set -euo pipefail
cd "$(dirname "$0")"
NAME=marker
OUT=${TMPDIR:-/tmp}/$NAME-frames${PREVIEW:+-preview}
node ../../_lib/events.cjs film.html events.json
END=$(python3 -c "import json;print(json.load(open('events.json'))['end'])")
python3 audio.py "$OUT.wav"
if [ -n "${PREVIEW:-}" ]; then
  node ../../_lib/film-gl.cjs film.html "$OUT" 0 "$END" 3 2 "mb=1"
  ffmpeg -y -loglevel error -framerate 30 -pattern_type glob -i "$OUT/*.jpg" -i "$OUT.wav" -vf scale=960:540 -c:v libx264 -crf 24 -pix_fmt yuv420p -c:a aac -shortest "$NAME-preview.mp4"
  echo "wrote $NAME-preview.mp4"; python3 ../../_lib/smooth.py "$NAME-preview.mp4" 30; exit 0
fi
node ../../_lib/film-gl.cjs film.html "$OUT" 0 "$END" 3 1
ffmpeg -y -loglevel error -framerate 60 -i "$OUT/%04d.jpg" -i "$OUT.wav" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 192k -movflags +faststart -shortest "$NAME-film.mp4"
echo "wrote $NAME-film.mp4"
python3 ../../_lib/smooth.py "$NAME-film.mp4"
