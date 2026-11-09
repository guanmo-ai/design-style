# 水墨：制作与上架

用户明确水墨通过，并要求合入主干及在网页展示。本次仅收录水墨；同轮其余两项不收录。

## 沿用完整原片

来源：`drafts/ink-wash/opening/ink-full.mp4`，设计分支 `claude/loving-galileo-ivl8mr`，提交 `04f0aed`。

- SHA-256：`5ba83214af23c69ade13722b8ce1f214d8f81f623bf8fdbddf286a187940cc99`
- 字节数：3573483
- 1920×1080、60fps、1125 帧、18.75 秒；H.264 + AAC、48kHz 立体声。
- 发布仅更名为 `024-ink-wash.mp4`，不重渲、不转码、不改配乐。

## 画面、声音与图解

`drafts/ink-wash/opening/` 保留原有 `scene.js`、`brush.js`、`timeline.js`、`audio.py` 和页面入口。配乐为 128 BPM，由代码合成；笔触、墨滴、界面与规则卡共用时间轴。

四张图解由 `images/make_svgs.py` 从该原片抽帧生成，文字和布局可编辑，画面以 JPEG 嵌入；预览 SVG 内嵌 Noto Sans SC 字形子集及完整 OFL 许可。没有生成新的电影画面。章节入口按源时间轴四舍五入至 60fps 帧边界。

## 复现入口

详见 [源码入口](video/README.md)。重新生成依赖浏览器、字体和运行环境，不能替代上述哈希标记的审核原片。

成片与完整项目源码 ZIP：[day-24](https://github.com/guanmo-ai/design-style/releases/tag/day-24)，随附 SHA256SUMS。

[返回指南](README.md)
