#!/usr/bin/env bash
# 下载本项目用到的开源字体（全部 SIL Open Font License 1.1）到 public/fonts/
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/fonts && cd public/fonts
GF=https://github.com/google/fonts/raw/main/ofl
NOTO=https://github.com/notofonts/noto-cjk/raw/main/Sans/SubsetOTF/SC
curl -fsSL -o Jost.ttf          "$GF/jost/Jost%5Bwght%5D.ttf"                  # Futura 的开源替代
curl -fsSL -o JetBrainsMono.ttf "$GF/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf" # 标注用等宽
for w in Regular Medium Bold Black; do                                        # 中文：思源黑体 / Noto Sans SC
  curl -fsSL -o "NotoSansSC-$w.otf" "$NOTO/NotoSansSC-$w.otf"
done
ls -lh
echo "✓ 字体就绪。视频渲染时 Jost / JetBrains Mono / Noto Sans SC 自动加载，无需安装到系统。"
