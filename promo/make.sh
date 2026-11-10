#!/usr/bin/env bash
# 宣传片出片：配乐 → 打包 → 画廊墙的 21 张小图 → 重新打包 → 分段渲染 → 拼接配乐（15 秒 · 1920×1080 · 60fps）
# 用法：bash promo/make.sh            正片 out/design-style-promo.mp4（母带 out/promo-master.mp4）
#       RESUME=1 bash promo/make.sh   接着上次渲到一半的分段继续（源码没改过才能用）
#       PREVIEW=1 bash promo/make.sh  半分辨率草稿 out/promo-preview.mp4
# 云端机器会被回收：正片按 150 帧一段渲，断了用 RESUME=1 接着渲（每一帧都是时间的纯函数，分段之间没有接缝）。
set -euo pipefail
cd "$(dirname "$0")/.."
export CHROMIUM_PATH="${CHROMIUM_PATH:-/opt/pw-browsers/chromium}"
BROWSER=(); [ -x "$CHROMIUM_PATH" ] && BROWSER=(--browser-executable="$CHROMIUM_PATH")
CH=out/promo-chunks
mkdir -p out public/promo
if [ -z "${RESUME:-}" ] || [ ! -d out/promo-bundle ]; then
  rm -rf "$CH"
  cp gallery/assets/fonts/Newsreader-latin.woff2 gallery/assets/fonts/DMSans-latin.woff2 public/promo/   # 画廊字标用的两款字体
  python3 promo/audio/make_music.py public/promo/music.wav
  npx remotion bundle src/index.ts --out-dir out/promo-bundle
  node promo/make_tiles.mjs out/promo-bundle
  npx remotion bundle src/index.ts --out-dir out/promo-bundle   # 小图进了 public/，再打一次包
fi
if [ -n "${PREVIEW:-}" ]; then
  npx remotion render out/promo-bundle Promo out/promo-preview.mp4 --scale=0.5 --codec=h264 --crf=20 --concurrency=4 --timeout=240000 "${BROWSER[@]}"
  exit 0
fi
mkdir -p "$CH"
CHUNKS=()
for a in 0 150 300 450 600 750; do
  f="$CH/c$(printf %03d "$a").mp4"
  if [ ! -f "$f" ]; then
    npx remotion render out/promo-bundle Promo "$CH/tmp.mp4" --frames="$a-$((a + 149))" --muted --codec=h264 --crf=15 --color-space=bt709 --concurrency=4 --timeout=240000 "${BROWSER[@]}"
    mv "$CH/tmp.mp4" "$f"
  fi
  CHUNKS+=("$f")
done
bash scripts/concat_chunks.sh public/promo/music.wav out/promo-master.mp4 "${CHUNKS[@]}"
# 母带约 47 Mbps（颗粒和网点很吃码率）；发布版再压一遍，约 25 MB
ffmpeg -v error -y -i out/promo-master.mp4 -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a copy -movflags +faststart out/design-style-promo.mp4
