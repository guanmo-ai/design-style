#!/usr/bin/env bash
# 出片（第二版）：动作事件 → 生成的配乐 + 一层纸声（mix.py）→ 逐帧渲染（Node + @napi-rs/canvas，5 个子帧运动模糊）→ mp4 → 量丝滑。
# 配乐 music/cut-and-paste.mp3（128.63 BPM）；片子第 0 帧 = 曲子 6.548 秒（第 14 拍），最后一击落在第 1012 帧。
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out
node render.mjs events events.json
python3 mix.py out/mix.wav
CRF=${CRF:-20} node render.mjs film dada-film.mp4 out/mix.wav
python3 ../../_lib/smooth.py dada-film.mp4
