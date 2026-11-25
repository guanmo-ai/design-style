#!/usr/bin/env bash
# 出片：渲 562 帧并按整数倍率放大到 1920 × 1080→ 合成声音 → 混流 → 量丝滑 → 封面和联系表。
# 中间文件放在 $OUT（默认系统临时目录），成片写到本目录 pixel-film.mp4。
set -euo pipefail
cd "$(dirname "$0")"
OUT="${OUT:-$(mktemp -d)}"
node film.mjs "$OUT"
python3 audio.py "$OUT/cues.json" "$OUT/film.wav"
ffmpeg -y -loglevel error -i "$OUT/video.mp4" -i "$OUT/film.wav" -c:v copy -c:a aac -b:a 192k -movflags +faststart -shortest pixel-film.mp4
python3 ../../_lib/smooth.py pixel-film.mp4 30
# 封面 = 第 0 帧；联系表每 12 帧（一拍）一张
ffmpeg -y -loglevel error -i pixel-film.mp4 -frames:v 1 -q:v 2 cover.jpg
mkdir -p "$OUT/contact"
ffmpeg -y -loglevel error -i pixel-film.mp4 -vf "select=not(mod(n\,12)),scale=640:360:flags=neighbor" -vsync vfr "$OUT/contact/%04d.png"
python3 ../../_lib/contact.py "$OUT/contact" contact.jpg 8 400
sha256sum pixel-film.mp4
