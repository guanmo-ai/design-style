#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ] || [ ! -f "$1" ]; then
  echo "用法：bash $0 <030-secession.mp4>" >&2
  exit 2
fi
MASTER="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
cd "$(dirname "$0")"
END=$(grep -o 'end: *[0-9]*' timeline.js | grep -o '[0-9]*$')
OUT="${TMPDIR:-/tmp}/secession-notext-frames"
[ -f assets/tile_goldsq.png ] || PYTHONHASHSEED=0 python3 assets.py
node ../../_lib/film-gl.cjs film.html "$OUT" 0 "$END" 3 1 'mb=4&notext'
ffmpeg -y -loglevel error -framerate 60 -i "$OUT/%04d.jpg" -i "$MASTER"   -map 0:v:0 -map 1:a:0 -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p   -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a copy -movflags +faststart   -shortest secession-render.mp4
