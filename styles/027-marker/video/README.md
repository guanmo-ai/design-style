# 马克笔手绘 · v4 源码入口

发布视频沿用已审第四版，完整渲染工程保留在 `drafts/marker/film/`，不复制第二份。

- [全片页面](../../../drafts/marker/film/film.html)
- [墨迹渲染器](../../../drafts/marker/film/ink.js) · [笔画生成器](../../../drafts/marker/film/gen.js)
- [六个场景与物体动作](../../../drafts/marker/film/scenes.js)
- [配乐](../../../drafts/marker/film/audio.py) · [事件时间](../../../drafts/marker/film/events.json)
- [原始制作记录](../../../drafts/marker/PROCESS.md) · [分镜](../../../drafts/marker/film/STORYBOARD.md)

准备项目依赖与字体后，运行 `bash styles/027-marker/video/make.sh`。重渲需要 ffmpeg、Playwright、Python NumPy；画廊使用已审原片，不以重渲结果替换。
