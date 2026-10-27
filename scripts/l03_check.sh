#!/usr/bin/env bash
# 用法：scripts/l03_check.sh 帧号… —— 打包、抽帧、拼联系表到 out/sheet.jpg（布局 03 的开发辅助）
set -e
cd "$(dirname "$0")/.."
export CHROMIUM_PATH=/opt/pw-browsers/chromium
[ -z "$NOBUNDLE" ] && npx remotion bundle src/index.ts --out-dir out/bundle >/dev/null 2>&1
rm -f out/check/*.png
COMP=L03-SplitScreen SCALE=${SCALE:-0.4} PROPS='{"blur":1,"music":false}' node scripts/stills.mjs out/bundle out/check "$@" 2>&1 | grep -E "^frame|rror" | tail -${TAILN:-3}
args=(); for fr in "$@"; do args+=("out/check/f$(printf %03d $fr).png|$fr"); done
python3 scripts/contact_sheet.py out/sheet.jpg --cols ${COLS:-4} --width ${CW:-480} "${args[@]}" | tail -1
