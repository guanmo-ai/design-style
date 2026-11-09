#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
DEST="out/024-ink-wash"
mkdir -p "$DEST/frames"
python3 drafts/ink-wash/opening/audio.py "$DEST/music.wav"
node drafts/_lib/film.cjs drafts/ink-wash/opening/index.html "$DEST/frames" 0 1125 3
ffmpeg -y -framerate 60 -i "$DEST/frames/%04d.png" -i "$DEST/music.wav" -c:v libx264 -crf 16 -pix_fmt yuv420p -c:a aac -b:a 256k -t 18.75 "$DEST/024-ink-wash.mp4"
