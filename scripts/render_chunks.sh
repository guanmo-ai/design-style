#!/usr/bin/env bash
# 分段渲染（无显卡环境单次渲染太久时用）：bash scripts/render_chunks.sh <合成> <起始帧> <结束帧> <输出.mp4>
# 每段静音、同样的编码参数；全部渲完后用 scripts/concat_chunks.sh 拼起来、配上音乐。
set -euo pipefail
comp=$1; a=$2; b=$3; out=$4
npx remotion render src/index.ts "$comp" "$out" --frames="$a-$b" --muted --codec=h264 --crf=16 --color-space=bt709 \
  --gl=swangle --concurrency=4 --timeout=240000 ${BROWSER:+--browser-executable="$BROWSER"}
