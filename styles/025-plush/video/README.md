# 毛绒 · 渲染源码入口

正式作品复用仓库中已经完成的毛绒渲染工程，保留原有路径与公共组件，不复制第二套渲染器。

- [全片页面](../../../drafts/plush/film/film.html)
- [形状、姿态与镜头](../../../drafts/plush/film/scenes.js)
- [时间轴](../../../drafts/plush/film/timeline.js)
- [配乐](../../../drafts/plush/film/audio.py)
- [逐帧出片脚本](../../../drafts/plush/film/make.sh)
- [毛绒渲染器](../../../drafts/_lib/fur/fur.js)
- [共用动画组件](../../../drafts/_lib/kit/README.md)

在仓库根目录准备依赖与字体后，运行 `bash styles/025-plush/video/make.sh`。脚本输出到原始工程；逐帧渲染可能需要较长时间。画廊使用已审成片，不以重渲结果替换它。
