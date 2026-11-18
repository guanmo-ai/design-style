#!/usr/bin/env bash
# 下载候选图要用的 CC0 素材（ambientCG 材质、Poly Haven 天空），放到 drafts/supergraphics/blender/assets/（不入库）
set -euo pipefail
cd "$(dirname "$0")"; mkdir -p assets && cd assets
for m in Concrete034 Concrete042A PaintedPlaster017 Metal064 Plaster007 Planks037A; do
  [ -d "$m" ] && continue
  curl -fsSL -o "$m.zip" "https://ambientcg.com/get?file=${m}_2K-JPG.zip" && mkdir -p "$m" && (cd "$m" && unzip -q "../$m.zip") && rm "$m.zip"
done
[ -f sky.hdr ] || curl -fsSL -o sky.hdr "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/kloofendal_48d_partly_cloudy_puresky_2k.hdr"
ls
