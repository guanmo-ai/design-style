#!/usr/bin/env bash
# 湿拓 · 出片：出字 / 滴落时间 → 配乐 → 逐帧渲染（WebGL，已渲的帧会跳过，断了重跑就接着渲）→ 合成 mp4 → 量丝滑、查第一个画面。在本目录运行：bash make.sh
# 云端（4 核、SwiftShader）全质量约 4—6 秒 / 帧（自适应 4× 抗锯齿），960 帧约 70—90 分钟；后台命令上限 2 小时，一次能渲完。
# 预览：PREVIEW=1 bash make.sh（半分辨率、不补抗锯齿、隔一帧，约 9 分钟）
set -euo pipefail
cd "$(dirname "$0")"
NAME=marbling
OUT=${TMPDIR:-/tmp}/$NAME-frames${PREVIEW:+-preview}
node events.cjs film.html events.json
python3 audio.py "$OUT.wav"
if [ -n "${PREVIEW:-}" ]; then
  node render.cjs film.html "$OUT" 0 960 1 2 preview
  ffmpeg -y -loglevel error -framerate 30 -start_number 0 -pattern_type glob -i "$OUT/*.jpg" -i "$OUT.wav" -vf scale=960:540 -c:v libx264 -crf 24 -pix_fmt yuv420p -c:a aac -shortest "$NAME-preview.mp4"
  echo "wrote $NAME-preview.mp4"; exit 0
fi
node render.cjs film.html "$OUT" 0 960 1
# 细羽纹很难压：两遍编码定码率（≤ 25 MB）
ffmpeg -y -loglevel error -framerate 60 -i "$OUT/%04d.jpg" -c:v libx264 -preset slow -b:v 11000k -pass 1 -passlogfile "$OUT.log" -pix_fmt yuv420p -an -f null /dev/null
ffmpeg -y -loglevel error -framerate 60 -i "$OUT/%04d.jpg" -i "$OUT.wav" -c:v libx264 -preset slow -b:v 11000k -pass 2 -passlogfile "$OUT.log" -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 192k -movflags +faststart -shortest "$NAME-film.mp4"
echo "wrote $NAME-film.mp4"
python3 ../../_lib/smooth.py "$NAME-film.mp4"
python3 ../../_lib/cover.py "$NAME-film.mp4"
rm -rf "$OUT-c30" && mkdir -p "$OUT-c30" && for i in $(seq 0 30 959); do cp "$OUT/$(printf %04d "$i").jpg" "$OUT-c30/"; done
python3 ../../_lib/contact.py "$OUT-c30" contact.jpg 8 320
