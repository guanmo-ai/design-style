# 朋克复印机 · 视频源码

[第五版成片](https://github.com/guanmo-ai/design-style/releases/tag/day-31)为 1920 × 1080、60 fps、18 秒。Node.js 与 `@napi-rs/canvas` 按帧绘制，FFmpeg 编码。配乐《Dynamic Motion》由 Sonilo 生成，已与代码合成的音效混入成片。

在仓库根目录准备字体和依赖。需要 Node.js、npm 与 FFmpeg。将成片路径传给脚本，输出保存在 `styles/031-punk/video/out/punk-render.mp4`。脚本重新绘制画面，并沿用成片的混合音轨。

```bash
npm run fonts
npm ci --prefix styles/031-punk/video --ignore-scripts
bash styles/031-punk/video/make.sh ./031-punk.mp4
```

单帧、事件表及可独立合成的音效层：

```bash
cd styles/031-punk/video
node render.mjs still out 0
node render.mjs events events.json
python3 mix.py out/sfx.wav
```

音效合成还需要 Python 3 与 NumPy。字体从各开源项目下载，许可随对应字体项目提供，下载地址见 [字体脚本](../../../scripts/fetch_fonts.sh)。
