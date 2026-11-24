#!/usr/bin/env bash
set -euo pipefail

if [[ $# != 1 || ! -f "$1" ]]; then
  printf '用法：bash %s <成片 MP4>\n' "$0" >&2
  exit 1
fi
master="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
cd "$(dirname "$0")"
mkdir -p out

frames=$(node -e "import('./scene.mjs').then(scene => console.log(scene.END))")
step=$(( (frames + 3) / 4 ))
pids=()
: > out/segments.txt
for ((index = 0; index < 4; index++)); do
  start=$((index * step))
  end=$(( (index + 1) * step < frames ? (index + 1) * step : frames ))
  node render.mjs film "out/segment-$index.mp4" - "$start" "$end" > "out/segment-$index.log" 2>&1 &
  pids+=("$!")
  printf "file 'segment-%s.mp4'\n" "$index" >> out/segments.txt
done
for pid in "${pids[@]}"; do
  wait "$pid"
done

ffmpeg -v error -y -f concat -safe 0 -i out/segments.txt -i "$master" \
  -map 0:v:0 -map 1:a:0 -c copy -shortest -movflags +faststart out/punk-render.mp4
