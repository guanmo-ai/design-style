#!/usr/bin/env bash
# 风格图：从同一个渲染器里取整版的帧，存成无损 PNG（1920 × 1080，一个像素 = 6 × 6 的方块）。
# 每张都是对应段落里所有元素都已出场、没有闪白的那一帧。写到 ../images/。
set -euo pipefail
cd "$(dirname "$0")"
OUT="${OUT:-$(mktemp -d)}"
mkdir -p ../images
for pair in 561:poster 211:palette 296:integer-scale 380:hit-stop 470:weather-app; do
  f=${pair%%:*}; name=${pair#*:}
  node film.mjs "$OUT" --frames "$f-$f" 2>/dev/null
  cp "$OUT/preview/$(printf %04d "$f").png" "../images/$name.png"
done
ls -la ../images
