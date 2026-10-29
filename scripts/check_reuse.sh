#!/usr/bin/env bash
# 在同一环境记录重构前/后音画；比较用 compare_media.py，不以压缩文件哈希代替像素/样本。
set -euo pipefail
cd "$(dirname "$0")/.."
dest=${1:?用法：bash scripts/check_reuse.sh out/reuse-verification/before}
mkdir -p "$dest"
node scripts/stills_batch.mjs S003-Constructivism "$dest/003" 0 86 98 180 275 340 422 500 590 899
node scripts/stills_batch.mjs S004-Memphis "$dest/004" 0 32 86 115 232 320 418 506 645 899
node scripts/stills_batch.mjs S001-Bauhaus "$dest/001" 0 28 115 205 295 385 475 565 655 899
node scripts/stills_batch.mjs L02-Masonry "$dest/L02" 0 17 56 140 250 300 450 530 730 899
node scripts/stills_batch.mjs S005-PopArt "$dest/005" 0 90 140 278 350 510 546 700 810 1079
node scripts/stills_batch.mjs S015-Futurism "$dest/015" 0 92 100 187 250 350 550 650 850 1199
if [ "${REUSE_STILLS_ONLY:-0}" = 1 ]; then exit 0; fi
for id in 003 004 001 L02 005 015; do npm run "music:$id"; done
cp public/003-constructivism/music.wav "$dest/003/music.wav"
cp public/004-memphis/music.wav "$dest/004/music.wav"
cp public/001-bauhaus/music.wav "$dest/001/music.wav"
cp public/02-masonry/music.wav "$dest/L02/music.wav"
cp public/005-pop-art/music.wav "$dest/005/music.wav"
cp public/015-futurism/music.wav "$dest/015/music.wav"
printf '音画基线已记录：%s\n' "$dest"
