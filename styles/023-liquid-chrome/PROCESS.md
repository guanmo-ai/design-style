# 液态金属：制作与上架

## 沿用已通过的原片

素材来自 `drafts/liquid-chrome/film/liquid-chrome-film.mp4`。本轮只补正式收录、图解和画廊入口，电影画面与音轨未重渲、未转码。

- SHA-256：`1fad71b9f8325852901b1d88b2de30a2ed12177d4ef541bd377e3031784478b7`
- 字节数：18344140
- 总帧数：1080，60fps

## 代码与声音

从项目根目录运行 `bash drafts/liquid-chrome/film/make.sh` 可调用既有逐帧渲染与配乐入口；所需浏览器、Python依赖、字体按仓库制作说明安装。正式目录的 `video/make.sh` 是复用入口。重新生成的结果依赖环境，不能替代此处哈希标记的审核原片。

## 四张图解

主视觉与界面图沿用既有 `drafts/liquid-chrome/png/cover.png` 和 `ui.png`；规则卡以可编辑SVG文字整理本片五条规则；分镜图从审核原片选取六帧，标签注明时间。SVG预览内嵌所需Noto Sans SC字形，已有渲染图和原片抽帧以图片嵌入。

## 分镜与规格

完整原分镜见 `process/STORYBOARD.md`，连续章节见 `process/timeline.json`。形体由距离场和时间轴参数控制，表现液滴融合、断开与回弹，不是科学级流体求解。颜色包含艺术调色；手机语音助手为预设概念动效，没有接入真实语音识别或日历。

## 成片与校验

成片入口：[day-23](https://github.com/guanmo-ai/design-style/releases/tag/day-23)。附件名为 `023-liquid-chrome.mp4`，SHA-256与字节数应与上方审核原片一致。Release同时提供完整项目源码ZIP与SHA256SUMS。

[返回指南](README.md)
