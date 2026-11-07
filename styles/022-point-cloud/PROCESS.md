# 点云：制作与上架

## 沿用已通过的原片

素材来自 `drafts/point-cloud/film/point-cloud-film.mp4`。本轮只补正式收录、图解和画廊入口，电影画面与音轨未重渲、未转码。

- SHA-256：`3ac674c0a002810a553aa7d3b4aeaa53d790d6abcccb0fd56d4dd49ab7ef78c4`
- 字节数：40610150
- 总帧数：1170，60fps

## 代码与声音

从项目根目录运行 `bash drafts/point-cloud/film/make.sh` 可调用既有逐帧渲染与配乐入口；所需浏览器、Python依赖、字体按仓库制作说明安装。正式目录的 `video/make.sh` 是复用入口。重新生成的结果依赖环境，不能替代此处哈希标记的审核原片。

## 四张图解

主视觉与界面图沿用既有 `drafts/point-cloud/png/cover.png` 和 `ui.png`；规则卡以可编辑SVG文字整理本片五条规则；分镜图从审核原片选取六帧，标签注明时间。SVG预览内嵌所需Noto Sans SC字形，已有渲染图和原片抽帧以图片嵌入。

## 分镜与规格

完整原分镜见 `process/STORYBOARD.md`，连续章节见 `process/timeline.json`。兔子取自Stanford Bunny网格，本片用网格采样点和预设动画演示对齐概念；街道、楼梯与盆景为代码构造。未实施实地扫描、ICP求解或照片训练的3D Gaussian Splatting。手机中的扫描和尺寸均为时间轴概念演示。

## 成片与校验

成片入口：[day-22](https://github.com/guanmo-ai/design-style/releases/tag/day-22)。附件名为 `022-point-cloud.mp4`，SHA-256与字节数应与上方审核原片一致。Release同时提供完整项目源码ZIP与SHA256SUMS。

[返回指南](README.md)
