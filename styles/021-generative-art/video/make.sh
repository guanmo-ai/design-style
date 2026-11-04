#!/usr/bin/env bash
# 可重复的源码渲染入口；发布沿用审核通过的原片。
set -euo pipefail
cd "$(dirname "$0")/../../.."
WORK=$(mktemp -d "${TMPDIR:-/tmp}/021-generative-art.XXXXXX")
trap 'rm -rf "$WORK"' EXIT
# 使用定稿事件表；字体或浏览器变化会影响遮罩取样，不在出片时改写。
python3 styles/021-generative-art/audio/make_music.py "$WORK/music.wav"
node scripts/canvas/film.cjs styles/021-generative-art/video/film.html "$WORK/frames" 0 1080 3
mkdir -p out
ffmpeg -y -loglevel error -framerate 60 -i "$WORK/frames/%04d.png" -i "$WORK/music.wav" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart out/021-generative-art.mp4
printf '已生成 out/021-generative-art.mp4\n'
