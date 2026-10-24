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
# 风格 003 构成主义：Oswald（可变字重 200—700，自带西里尔字母；OFL）
curl -fsSL -o Oswald.ttf        "$GF/oswald/Oswald%5Bwght%5D.ttf"
# 风格 004 孟菲斯：Fredoka（圆头几何无衬线，可变字重 300—700 / 字宽 75—125；OFL）
curl -fsSL -o Fredoka.ttf       "$GF/fredoka/Fredoka%5Bwdth,wght%5D.ttf"
# 风格 005 波普艺术：Bangers（漫画书拟声字风格的窄粗体，Vernon Adams 设计；OFL）
curl -fsSL -o Bangers-Regular.ttf "$GF/bangers/Bangers-Regular.ttf"
# 风格 008 孔版印刷：Archivo（可变字重 / 字宽，标题）+ Space Mono（印刷工单）；均为 OFL
curl -fsSL -o Archivo.ttf          "$GF/archivo/Archivo%5Bwdth,wght%5D.ttf"
curl -fsSL -o SpaceMono-Regular.ttf "$GF/spacemono/SpaceMono-Regular.ttf"
curl -fsSL -o SpaceMono-Bold.ttf    "$GF/spacemono/SpaceMono-Bold.ttf"
# 风格 006 千禧未来主义：Unbounded（宽体几何标题，可变字重 200—900）+ Michroma（宽体“科技”小字）+ Silkscreen（像素字读数）；均为 OFL
curl -fsSL -o Unbounded.ttf          "$GF/unbounded/Unbounded%5Bwght%5D.ttf"
curl -fsSL -o Michroma-Regular.ttf   "$GF/michroma/Michroma-Regular.ttf"
curl -fsSL -o Silkscreen-Regular.ttf "$GF/silkscreen/Silkscreen-Regular.ttf"
curl -fsSL -o Silkscreen-Bold.ttf    "$GF/silkscreen/Silkscreen-Bold.ttf"
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
# 布局 02 Masonry：Instrument Serif（标题衬线，正体 + 斜体）
curl -fsSL -o InstrumentSerif-Regular.ttf "$GF/instrumentserif/InstrumentSerif-Regular.ttf"
curl -fsSL -o InstrumentSerif-Italic.ttf  "$GF/instrumentserif/InstrumentSerif-Italic.ttf"
rm -rf "$TMP"
ls -lh
echo "✓ 字体就绪。视频渲染时 Jost / JetBrains Mono / Noto Sans SC / TeX Gyre Heros / Oswald / Fredoka / Bangers / Unbounded / Michroma / Silkscreen / Archivo / Space Mono / Inter / Geist Mono / Selawik / Instrument Serif 自动加载，无需安装到系统。"
