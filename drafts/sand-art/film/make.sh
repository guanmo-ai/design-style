#!/usr/bin/env bash
# 出片：文字 cue → 配乐 → 逐帧渲染（已渲的帧会跳过，断了重跑就接着渲）→ 合成 mp4 → 量一遍“丝滑”。在本目录运行：bash make.sh
# 预览：PREVIEW=1 bash make.sh（隔一帧渲一帧、半尺寸）。预览要更快就给页面加降画质的查询串：QUERY="rows=100&wmul=1.9" PREVIEW=1 bash make.sh
set -euo pipefail
cd "$(dirname "$0")"
NAME=sand
END=$(grep -o '"end": *[0-9]*' timeline.js | grep -o '[0-9]*$')
OUT=${TMPDIR:-/tmp}/$NAME-frames${PREVIEW:+-preview}
node ../../_lib/events.cjs film.html events.json
python3 audio.py "$OUT.wav"
if [ -n "${PREVIEW:-}" ]; then
  node ../../_lib/film-gl.cjs film.html "$OUT" 0 "$END" 3 2 "${QUERY:-}"
  ffmpeg -y -loglevel error -framerate 30 -pattern_type glob -i "$OUT/*.jpg" -i "$OUT.wav" -vf scale=960:540 -c:v libx264 -crf 24 -pix_fmt yuv420p -c:a aac -shortest "$NAME-preview.mp4"
  echo "wrote $NAME-preview.mp4"; python3 ../../_lib/smooth.py "$NAME-preview.mp4" 30; exit 0
fi
node ../../_lib/film-gl.cjs film.html "$OUT" 0 "$END" 3 1 "${QUERY:-}"
ffmpeg -y -loglevel error -framerate 60 -i "$OUT/%04d.jpg" -i "$OUT.wav" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 192k -movflags +faststart -shortest "$NAME-film.mp4"
echo "wrote $NAME-film.mp4"
python3 ../../_lib/smooth.py "$NAME-film.mp4"      # 逐个核对它列出的跳变是不是有意的
