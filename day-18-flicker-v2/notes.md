## 018 · 微缩景观 Diorama · 闪烁修复版

修复线上影片街角屋面的大片闪烁：奶油色基底与灰色屋面顶面原先完全共面，现留出 0.02 的高度间距；同时移除电线中的 1,152 个重复三角面。

完整重渲 1920×1080 · 30fps · 600 帧 · 20 秒，使用 Mac Metal；复用原 AAC 音轨，解码音频 SHA-256 前后一致。五章内容、镜头时间轴与配乐创作保持原样。原 [day-18](https://github.com/guanmo-ai/design-style/releases/tag/day-18) 保留供回退，画廊仍显示为「风格 010」。

发布前完成规范与需求两个轴的审查、修复前后六帧比较、完整解码、全片联系表、42 项项目测试、2 项几何回归与类型检查。详见 [修复与审查记录](https://github.com/guanmo-ai/design-style/blob/main/docs/reviews/018_FLICKER_20261030.md)。

附件：

- `018-diorama.mp4`：H.264 + AAC，1920×1080，30fps，20 秒，48kHz 立体声。
- `018-diorama-source.zip`：提交 `7f862dc35405b4f08253aa4cbaced1395e89b651` 的完整项目源码（799 个文件），包含共享库、渲染脚本、设计图、中英文文档、回归测试与其他已提交各期；不含 node_modules、生成音轨或本机未提交作品。分片仅用于 Git 分支保存，下载附件是一个完整 ZIP。
- `SHA256SUMS`：上述两项附件的校验值。

解压后按本期 README 第 10 节准备依赖与字体；Mac 可使用 `ANGLE_BACKEND=metal PR=1 node render.cjs episode.html out 0 599 1920 1080 30`，默认后端仍为 SwiftShader。

[线上画廊](https://guanmo-ai.github.io/design-style/?lang=zh#work-018-diorama) · [English guide](https://github.com/guanmo-ai/design-style/blob/main/styles/018-diorama/README.en.md)

```text
e424c9cef2b86d90b53d1669f4f73cc0dd03308bc66075af60339f6bed1bca18  018-diorama.mp4
b9293149327224dca5b8d5dced28d44c10bf772e2ac7c070c030b644defd71de  018-diorama-source.zip
```

by 观默 [@guanmo_ai](https://x.com/guanmo_ai)
