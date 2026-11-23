# 维也纳分离派 · 视频源码

[成片](https://github.com/guanmo-ai/design-style/releases/tag/day-30)为 1920 × 1080、60 fps、19.50 秒。渲染脚本使用 `notext` 参数，开场的金箔特写不叠加字幕，片头标题仍随原构图出现。

需要 Node.js、Chromium、Python 3 与 FFmpeg。先在仓库根目录安装依赖与字体，再把 Release 成片路径传给脚本。重渲单独计算画面，直接复用成片的混合音轨。

```bash
npm ci
npm run fonts
npx playwright install chromium
bash styles/030-secession/video/make.sh /path/to/030-secession.mp4
```

输出为 `drafts/secession/film/secession-render.mp4`。时间轴和场景绘制见 [Canvas 源码](../../../drafts/secession/film/film.html)。Jost、Noto Serif SC 和站酷庆科黄油体使用 SIL Open Font License，许可文本见 [fonts](../fonts/)。

从同一成片生成风格图和分镜 SVG。图解依赖 Python 的 `fonttools`。

```bash
python3 styles/030-secession/images/make_svgs.py /path/to/030-secession.mp4
```
