#!/usr/bin/env bash
# 出片：动作事件 → 声音层（有配乐就混进去，见 mix.py）→ 4 段并行逐帧渲染（Node + @napi-rs/canvas，3 个子帧运动模糊）→ 拼接 → 量丝滑。
# 换配乐后：BPM=<实测> OFF=<第 0 拍在第几帧> MUSIC_START=<曲子第几秒对齐第 0 帧> bash make.sh
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out
node render.mjs events events.json
python3 mix.py out/mix.wav
END=$(node -e "import('./scene.mjs').then(m=>console.log(m.END))")
N=4; STEP=$(( (END + N - 1) / N ))
for i in $(seq 0 $((N-1))); do
  A=$((i*STEP)); B=$(( (i+1)*STEP < END ? (i+1)*STEP : END ))
  CRF=${CRF:-17} node render.mjs film out/seg$i.mp4 - $A $B > out/seg$i.log 2>&1 &
done
wait
: > out/segs.txt; for i in $(seq 0 $((N-1))); do echo "file 'seg$i.mp4'" >> out/segs.txt; done
ffmpeg -y -loglevel error -f concat -safe 0 -i out/segs.txt -i out/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart punk-film.mp4
python3 ../../_lib/smooth.py punk-film.mp4
