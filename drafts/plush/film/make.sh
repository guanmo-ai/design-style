#!/usr/bin/env bash
# 出片：文字 cue → 配乐 → 逐帧渲染（WebGL，两页并行，已渲的帧会跳过，断了重跑就接着渲）→ 合成 mp4。在本目录运行：bash make.sh
# 云端（4 核、SwiftShader）约 3.8 秒 / 帧，1200 帧约 75 分钟；后台命令上限 2 小时，一次能渲完。预览：PREVIEW=1 bash make.sh（毛少四倍，约 3 分钟）
set -euo pipefail
cd "$(dirname "$0")"
NAME=plush
OUT=${TMPDIR:-/tmp}/$NAME-frames${PREVIEW:+-preview}
node ../../_lib/events.cjs film.html events.json
python3 audio.py "$OUT.wav"
if [ -n "${PREVIEW:-}" ]; then
  node ../../_lib/film-gl.cjs film.html "$OUT" 0 1200 3 2 "rows=100&wmul=1.9"
  ffmpeg -y -loglevel error -framerate 30 -start_number 0 -pattern_type glob -i "$OUT/*.jpg" -i "$OUT.wav" -vf scale=960:540 -c:v libx264 -crf 24 -pix_fmt yuv420p -c:a aac -shortest "$NAME-preview.mp4"
  echo "wrote $NAME-preview.mp4"; exit 0
fi
node ../../_lib/film-gl.cjs film.html "$OUT" 0 1200 2
# 四十万根毛每帧都在动，H.264 很难压：两遍编码定码率（约 24 MB）；要更清楚就改成 -crf 18（约 80 MB，不入库）
ffmpeg -y -loglevel error -framerate 60 -i "$OUT/%04d.jpg" -c:v libx264 -preset slow -b:v 9000k -pass 1 -passlogfile "$OUT.log" -pix_fmt yuv420p -an -f null /dev/null
ffmpeg -y -loglevel error -framerate 60 -i "$OUT/%04d.jpg" -i "$OUT.wav" -c:v libx264 -preset slow -b:v 9000k -pass 2 -passlogfile "$OUT.log" -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 192k -movflags +faststart -shortest "$NAME-film.mp4"
echo "wrote $NAME-film.mp4"
