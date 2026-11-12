#!/usr/bin/env bash
# 出果冻 / 充气的四张候选图（云端软件渲染约 25 分钟）。SPP=6 bash drafts/_lib/soft/stills.sh 是一两分钟一张的草稿
set -euo pipefail
cd "$(dirname "$0")/../../.."
SPP=${SPP:-48}
for x in "jelly/cover jelly/png/cover" "jelly/ui jelly/png/ui" "inflated/cover3d inflated/png/cover3d" "inflated/stages3d inflated/png/stages3d"; do
  set -- $x; mkdir -p "drafts/$(dirname "$2")"
  node drafts/_lib/shot-gl.cjs "drafts/$1.html" "drafts/$2.png" 1920 1080 1 "s=1&spp=$SPP" 2>&1 | grep -E "done|shot|rror" || true
done
