#!/usr/bin/env bash
# 下载本项目用到的开源字体到 public/fonts/
# 除 TeX Gyre Heros（GUST Font License，可免费商用、可再分发）外，全部是 SIL Open Font License 1.1
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/fonts && cd public/fonts
# 一个字体下不下来不该挡住其余的：每个文件重试 3 次（mirrors.ctan.org 每次跳到随机镜像，个别镜像的证书在云端会话里过不了），
# 还是失败就记下来接着下，最后一起报、并以非零状态退出。
FAILED=()
get() { curl -fsSL --retry 3 --retry-all-errors --retry-delay 1 -o "$1" "$2" || { echo "✗ 没下到 $1"; rm -f "$1"; FAILED+=("$1"); }; }
GF=https://raw.githubusercontent.com/google/fonts/main/ofl   # 不用 github.com/…/raw：云端会话里会 403
NOTO=https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/SC
get Jost.ttf          "$GF/jost/Jost%5Bwght%5D.ttf"                  # Futura 的开源替代
get JetBrainsMono.ttf "$GF/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf" # 标注用等宽
for w in Regular Medium Bold Black; do                                        # 中文：思源黑体 / Noto Sans SC
  get "NotoSansSC-$w.otf" "$NOTO/NotoSansSC-$w.otf"
done
# 风格 002 瑞士国际主义：TeX Gyre Heros（Helvetica 的开源替代，源自 URW Nimbus Sans；GUST Font License）
CTAN=https://mirrors.ctan.org/fonts/tex-gyre/opentype
get TeXGyreHeros-Regular.otf "$CTAN/texgyreheros-regular.otf"
get TeXGyreHeros-Bold.otf    "$CTAN/texgyreheros-bold.otf"
# 风格 003 构成主义：Oswald（可变字重 200—700，自带西里尔字母；OFL）
get Oswald.ttf        "$GF/oswald/Oswald%5Bwght%5D.ttf"
# 风格 004 孟菲斯：Fredoka（圆头几何无衬线，可变字重 300—700 / 字宽 75—125；OFL）
get Fredoka.ttf       "$GF/fredoka/Fredoka%5Bwdth,wght%5D.ttf"
# 风格 005 波普艺术：Bangers（漫画书拟声字风格的窄粗体，Vernon Adams 设计；OFL）
get Bangers-Regular.ttf "$GF/bangers/Bangers-Regular.ttf"
# 风格 008 孔版印刷：Archivo（可变字重 / 字宽，标题）+ Space Mono（印刷工单）；均为 OFL
get Archivo.ttf          "$GF/archivo/Archivo%5Bwdth,wght%5D.ttf"
get SpaceMono-Regular.ttf "$GF/spacemono/SpaceMono-Regular.ttf"
get SpaceMono-Bold.ttf    "$GF/spacemono/SpaceMono-Bold.ttf"
# 风格 009 新粗野主义：Space Grotesk（界面文字，可变字重 300—700；OFL）+ Tinos（“没写 CSS 的网页”里的浏览器默认字体，Times New Roman 的等宽开源替代；Apache 2.0）
get SpaceGrotesk.ttf  "$GF/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf"
FS=https://cdn.jsdelivr.net/npm/@fontsource/tinos@5.1.0/files
get Tinos-400.woff2   "$FS/tinos-latin-400-normal.woff2"
get Tinos-700.woff2   "$FS/tinos-latin-700-normal.woff2"
# 风格 013 装饰艺术：Poiret One（1920 年代海报式细线几何大写；OFL）+ Noto Serif SC（中文细宋，可变字重 200—900；OFL）
get PoiretOne-Regular.ttf "$GF/poiretone/PoiretOne-Regular.ttf"
get NotoSerifSC.ttf       "$GF/notoserifsc/NotoSerifSC%5Bwght%5D.ttf"
# 风格 017 中世纪现代：Anton（窄粗无衬线，被 cut.py 转成轮廓、剪成纸片大字；OFL）
get Anton-Regular.ttf  "$GF/anton/Anton-Regular.ttf"
# 风格 006 千禧未来主义：Unbounded（宽体几何标题，可变字重 200—900）+ Michroma（宽体“科技”小字）+ Silkscreen（像素字读数）；均为 OFL
get Unbounded.ttf          "$GF/unbounded/Unbounded%5Bwght%5D.ttf"
get Michroma-Regular.ttf   "$GF/michroma/Michroma-Regular.ttf"
get Silkscreen-Regular.ttf "$GF/silkscreen/Silkscreen-Regular.ttf"
get Silkscreen-Bold.ttf    "$GF/silkscreen/Silkscreen-Bold.ttf"
# 风格 018 微缩景观：Inter 可变字重（100—900），供 video3d 的 Inter.ttf 路径使用；OFL
get Inter.ttf "$GF/inter/Inter%5Bopsz,wght%5D.ttf"
# 第六轮候选 液态金属：站酷庆科黄油体（圆头粗体中文，被做成会滴落的镀铬字；OFL）
get ZCOOLQingKeHuangYou.ttf "$GF/zcoolqingkehuangyou/ZCOOLQingKeHuangYou-Regular.ttf"
# 布局 01 Bento Grid：Inter Display（标题）+ Inter（正文）+ Geist Mono（数字 / 标注）
TMP=$(mktemp -d)
get "$TMP/inter.zip" https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip
get "$TMP/geist.zip" https://github.com/vercel/geist-font/releases/download/v1.8.1/geist-font-v1.8.1.zip
if [ -s "$TMP/inter.zip" ]; then
unzip -qjo "$TMP/inter.zip" 'extras/ttf/InterDisplay-Medium.ttf' 'extras/ttf/InterDisplay-SemiBold.ttf' 'extras/ttf/InterDisplay-Bold.ttf' \
  'extras/ttf/Inter-Regular.ttf' 'extras/ttf/Inter-Medium.ttf' 'extras/ttf/Inter-SemiBold.ttf' -d .
fi
if [ -s "$TMP/geist.zip" ]; then
unzip -qjo "$TMP/geist.zip" '*/GeistMono-Regular.ttf' '*/GeistMono-Medium.ttf' -d .
# 第六轮候选（液态金属 / 点云 / 热成像）：Geist 与 Geist Mono 的可变字重版，存成 Geist.ttf / GeistMono.ttf
unzip -qjo "$TMP/geist.zip" 'geist-font/Geist/variable/Geist\[wght\].ttf' 'geist-font/GeistMono/variable/GeistMono\[wght\].ttf' -d "$TMP/gv"
mv "$TMP/gv/Geist[wght].ttf" Geist.ttf; mv "$TMP/gv/GeistMono[wght].ttf" GeistMono.ttf
fi
# 布局 01 里的 Windows Phone 段：Selawik（微软开源的 Segoe UI 替代字体）
get "$TMP/selawik.zip" https://github.com/microsoft/Selawik/releases/download/1.01/Selawik_Release.zip
if [ -s "$TMP/selawik.zip" ]; then
unzip -qjo "$TMP/selawik.zip" '*selawk.ttf' '*selawksb.ttf' '*selawkb.ttf' '*selawkl.ttf' -d "$TMP/sel"
mv "$TMP/sel/selawk.ttf" Selawik.ttf; mv "$TMP/sel/selawksb.ttf" Selawik-Semibold.ttf
mv "$TMP/sel/selawkb.ttf" Selawik-Bold.ttf; mv "$TMP/sel/selawkl.ttf" Selawik-Light.ttf
fi
# 布局 02 Masonry：Instrument Serif（标题衬线，正体 + 斜体）
get InstrumentSerif-Regular.ttf "$GF/instrumentserif/InstrumentSerif-Regular.ttf"
get InstrumentSerif-Italic.ttf  "$GF/instrumentserif/InstrumentSerif-Italic.ttf"
rm -rf "$TMP"
ls -lh
if [ ${#FAILED[@]} -gt 0 ]; then echo "✗ 有 ${#FAILED[@]} 个文件没下到：${FAILED[*]}（重跑一次，或换个网络）"; exit 1; fi
echo "✓ 字体就绪。视频渲染时 Jost / JetBrains Mono / Noto Sans SC / TeX Gyre Heros / Oswald / Fredoka / Bangers / Unbounded / Michroma / Silkscreen / Archivo / Space Mono / Space Grotesk / Tinos / Inter / Geist Mono / Selawik / Instrument Serif / Poiret One / Noto Serif SC 自动加载，无需安装到系统。"
