# 达达第二版 · 视频

成片为 17.87 秒、1920×1080、60 fps。[下载 Release 成片](https://github.com/guanmo-ai/design-style/releases/tag/day-29) · [逐帧渲染与混音源码](../../../drafts/dada/film/) · [原始分镜](../../../drafts/dada/film/STORYBOARD.md)

重渲需 Node.js、Bun、Python 3 和 FFmpeg。从仓库根目录运行 `npm run fonts`，按 `requirements.txt` 安装 Python 依赖，再执行下列命令。

```sh
(cd drafts/dada/film && bun install --frozen-lockfile)
bash styles/029-dada/video/make.sh
```

出片写到 `drafts/dada/film/dada-film.mp4`。生成四张 SVG 另运行 `python3 styles/029-dada/images/make_svgs.py`。
