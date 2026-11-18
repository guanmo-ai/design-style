#!/usr/bin/env bash
# 出两张正式图（1920×1080，128 采样 + 降噪，云端 4 核每张约 10 分钟）
set -e; cd "$(dirname "$0")"; PY=${PY:-/home/user/bpyenv/bin/python}
mkdir -p ../png/v2
for m in hero reveal; do $PY hero.py $m ../png/v2/$m-raw.png 1920 1080 ${SPP:-128} 2>&1 | grep RENDER; done
