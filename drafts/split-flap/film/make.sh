#!/usr/bin/env bash
# 出片：出字和落定时间 → 配乐 → 逐帧渲染（已渲的帧会跳过，断了重跑就接着渲）→ 合成 mp4 → 量丝滑、查第一个画面 → 联系表。
# 在本目录运行：bash make.sh。一帧约 2.7 s（4 核软件渲染、8 个子帧），全片 960 帧约 45 分钟。
# 预览：PREVIEW=1 bash make.sh（每 2 帧一张、2 个子帧、半尺寸）。
# 如果仓库里 npm ci 装的 playwright 和云端预装的浏览器版本对不上：删掉 node_modules/playwright*，再 export NODE_PATH=/opt/node-tools/node_modules。
set -euo pipefail
cd "$(dirname "$0")"
NAME=split-flap
OUT=${TMPDIR:-/tmp}/$NAME-frames${PREVIEW:+-preview}
node ../../_lib/events.cjs film.html events.json
python3 audio.py "$OUT.wav"
if [ -n "${PREVIEW:-}" ]; then
  node ../../_lib/film-gl.cjs film.html "$OUT" 0 960 3 2 "S=2"
  ffmpeg -y -loglevel error -framerate 30 -pattern_type glob -i "$OUT/*.jpg" -i "$OUT.wav" -vf scale=960:540 -c:v libx264 -crf 24 -pix_fmt yuv420p -c:a aac -shortest "$NAME-preview.mp4"
  echo "wrote $NAME-preview.mp4"; exit 0
fi
node ../../_lib/film-gl.cjs film.html "$OUT" 0 960 2 1 "S=8"
ffmpeg -y -loglevel error -framerate 60 -i "$OUT/%04d.jpg" -i "$OUT.wav" -c:v libx264 -preset slow -crf 19 -tune grain -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 192k -movflags +faststart -shortest "$NAME-film.mp4"
echo "wrote $NAME-film.mp4"; ls -la "$NAME-film.mp4"
python3 ../../_lib/smooth.py "$NAME-film.mp4"
python3 ../../_lib/cover.py "$NAME-film.mp4"
mkdir -p "$OUT-contact" && for f in $(seq 0 30 959); do cp "$OUT/$(printf %04d $f).jpg" "$OUT-contact/"; done
python3 ../../_lib/contact.py "$OUT-contact" contact.jpg 8 320
