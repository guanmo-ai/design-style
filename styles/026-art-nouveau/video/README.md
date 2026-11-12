# 新艺术运动 · 渲染源码入口

正式作品复用 `drafts/art-nouveau/film/` 里的渲染工程，不复制第二份。

- [全片页面（主循环、运动模糊、字幕）](../../../drafts/art-nouveau/film/film.html)
- [主线的几何](../../../drafts/art-nouveau/film/world.js) · [按曲率积分的路径构造器](../../../drafts/art-nouveau/film/path.js)
- [引擎：生长、梢头卷曲、枝条、镜头、出字](../../../drafts/art-nouveau/film/engine.js)
- [枝条、叶、花与镜头关键帧](../../../drafts/art-nouveau/film/scenes.js) · [各章的内容](../../../drafts/art-nouveau/film/chapters.js)
- [时间轴](../../../drafts/art-nouveau/film/timeline.js) · [配乐](../../../drafts/art-nouveau/film/audio.py) · [出片脚本](../../../drafts/art-nouveau/film/make.sh)
- [整张世界的布局预览](../../../drafts/art-nouveau/film/debug.html)

在仓库根目录准备依赖与字体（`npm run fonts`、`pip install -r requirements.txt`）后运行 `bash styles/026-art-nouveau/video/make.sh`，云端约 3 分钟。画廊使用已审成片，不以重渲结果替换它。
