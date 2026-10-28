#!/usr/bin/env bash
# 拼接分段（编码参数一致，直接复制流）并配上音乐：bash scripts/concat_chunks.sh <音乐.wav> <输出.mp4> 段1.mp4 段2.mp4 ...
set -euo pipefail
music=$1; out=$2; shift 2
list=$(mktemp)
for f in "$@"; do echo "file '$(realpath "$f")'" >> "$list"; done
ffmpeg -v error -y -f concat -safe 0 -i "$list" -i "$music" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -shortest "$out"
rm "$list"
