#!/usr/bin/env bash
# 下载本项目用到的开源字体到 public/fonts/
# 除 TeX Gyre Heros（GUST Font License，可免费商用、可再分发）外，全部是 SIL Open Font License 1.1
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
# 风格 002 瑞士国际主义：TeX Gyre Heros（Helvetica 的开源替代，源自 URW Nimbus Sans；GUST Font License）
CTAN=https://mirrors.ctan.org/fonts/tex-gyre/opentype
curl -fsSL -o TeXGyreHeros-Regular.otf "$CTAN/texgyreheros-regular.otf"
curl -fsSL -o TeXGyreHeros-Bold.otf    "$CTAN/texgyreheros-bold.otf"
# 布局 01 Bento Grid：Inter Display（标题）+ Inter（正文）+ Geist Mono（数字 / 标注）
TMP=$(mktemp -d)
curl -fsSL -o "$TMP/inter.zip" https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip
curl -fsSL -o "$TMP/geist.zip" https://github.com/vercel/geist-font/releases/download/v1.8.1/geist-font-v1.8.1.zip
unzip -qjo "$TMP/inter.zip" 'extras/ttf/InterDisplay-Medium.ttf' 'extras/ttf/InterDisplay-SemiBold.ttf' 'extras/ttf/InterDisplay-Bold.ttf' \
  'extras/ttf/Inter-Regular.ttf' 'extras/ttf/Inter-Medium.ttf' 'extras/ttf/Inter-SemiBold.ttf' -d .
unzip -qjo "$TMP/geist.zip" '*/GeistMono-Regular.ttf' '*/GeistMono-Medium.ttf' -d .
# 布局 01 里的 Windows Phone 段：Selawik（微软开源的 Segoe UI 替代字体）
curl -fsSL -o "$TMP/selawik.zip" https://github.com/microsoft/Selawik/releases/download/1.01/Selawik_Release.zip
unzip -qjo "$TMP/selawik.zip" '*selawk.ttf' '*selawksb.ttf' '*selawkb.ttf' '*selawkl.ttf' -d "$TMP/sel"
mv "$TMP/sel/selawk.ttf" Selawik.ttf; mv "$TMP/sel/selawksb.ttf" Selawik-Semibold.ttf
mv "$TMP/sel/selawkb.ttf" Selawik-Bold.ttf; mv "$TMP/sel/selawkl.ttf" Selawik-Light.ttf
rm -rf "$TMP"
ls -lh
echo "✓ 字体就绪。视频渲染时 Jost / JetBrains Mono / Noto Sans SC / TeX Gyre Heros / Inter / Geist Mono / Selawik 自动加载，无需安装到系统。"
