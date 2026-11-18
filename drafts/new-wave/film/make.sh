#!/usr/bin/env bash
# 出片：文字 cue → 配乐 → 逐帧渲染（Canvas 2D，三页并行，已渲的帧会跳过，断了重跑就接着渲）→ 合成 mp4。在本目录运行：bash make.sh
# 音乐：music/minimalist-design-pulse.m4a（audio.py 在上面加音效）。云端（4 核、无显卡）约 0.05 秒 / 帧，1200 帧几分钟。预览：PREVIEW=1 bash make.sh（每 2 帧一张、半分辨率）
set -euo pipefail
cd "$(dirname "$0")"
NAME=new-wave
OUT=${TMPDIR:-/tmp}/$NAME-frames${PREVIEW:+-preview}
node ../../_lib/events.cjs film.html events.json
python3 audio.py "$OUT.wav"
if [ -n "${PREVIEW:-}" ]; then
  node ../../_lib/film-gl.cjs film.html "$OUT" 0 1200 3 2
  ffmpeg -y -loglevel error -framerate 30 -pattern_type glob -i "$OUT/*.jpg" -i "$OUT.wav" -vf scale=960:540 -c:v libx264 -crf 24 -pix_fmt yuv420p -c:a aac -shortest "$NAME-preview.mp4"
  echo "wrote $NAME-preview.mp4"; exit 0
fi
node ../../_lib/film-gl.cjs film.html "$OUT" 0 1200 3
ffmpeg -y -loglevel error -framerate 60 -i "$OUT/%04d.jpg" -i "$OUT.wav" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 192k -movflags +faststart -shortest "$NAME-film.mp4"
echo "wrote $NAME-film.mp4"
python3 ../../_lib/smooth.py "$NAME-film.mp4"
