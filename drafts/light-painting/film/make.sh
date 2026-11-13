#!/usr/bin/env bash
# 出片：文字 cue → 配乐 → 逐帧渲染（已渲的帧会跳过，断了重跑就接着渲）→ 合成 mp4 → 量丝滑、查第一个画面。在本目录运行：bash make.sh
set -euo pipefail
cd "$(dirname "$0")"
NAME=light-painting
END=$(grep -o '"end": *[0-9]*' timeline.js | grep -o '[0-9]*$')
OUT=${TMPDIR:-/tmp}/$NAME-frames
NODE="node -r ./pw.cjs"
$NODE ../../_lib/events.cjs film.html events.json
python3 audio.py "$OUT.wav"
$NODE ../../_lib/film-gl.cjs film.html "$OUT" 0 "$END" 1 1
ffmpeg -y -loglevel error -framerate 60 -i "$OUT/%04d.jpg" -i "$OUT.wav" -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 192k -movflags +faststart -shortest "$NAME-film.mp4"
echo "wrote $NAME-film.mp4 ($(du -h $NAME-film.mp4 | cut -f1))"
rm -rf "$OUT-30" && mkdir -p "$OUT-30" && for f in $(seq 0 30 $((END-1))); do ln -s "$OUT/$(printf %04d $f).jpg" "$OUT-30/"; done
python3 ../../_lib/contact.py "$OUT-30" contact.jpg 8 320
python3 ../../_lib/smooth.py "$NAME-film.mp4"
python3 ../../_lib/cover.py "$NAME-film.mp4"
