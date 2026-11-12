# 新艺术运动 · Release 与画廊上架

用户已认可视频，并明确要求「把新艺术运动发布 Release，上架画廊」。本轮以 `a1ad066` 为基线，使用既有隔离工作区；原主工作区中的其他未提交改动不纳入发布。

## Release 与原片

- [day-26](https://github.com/guanmo-ai/design-style/releases/tag/day-26) 于 `2026-11-12T14:22:55Z` 正式发布，标签指向已审源码提交 `a1ad066b7481f6d8a77e8eb61f844fe150c3f00a`。
- 附件：`026-art-nouveau.mp4` 和 `SHA256SUMS`；GitHub 自动源码归档包含正式风格目录、原始渲染工程及公共组件。
- 已审原片：`drafts/art-nouveau/film/art-nouveau-film.mp4`，24,565,469 字节；SHA-256：`eaa3209d1a7621a1e13aa45fa835052e70327ad20463cfe71f30cab005896d04`。
- 21 秒、1920×1080、60fps、1260 帧，H.264 + AAC 48kHz 立体声。远端附件的字节数、digest 与原片一致；没有重渲、转码或改动音轨。

## 画廊登记

- 网站上架期号「风格 019」；作品 ID、媒体名及 Release 保留制作编号 `026` / `day-26`。
- 条目已从 pending 移入 `gallery/data/works.json`，`publishedAt` 使用真实 Release 发布时间。
- 同步中英文 README 预览和制作目录，保留既有四张图解、中英文指南、制作过程及源码入口。
- [画廊作品](https://guanmo-ai.github.io/design-style/?lang=zh#work-026-art-nouveau) · [English](https://guanmo-ai.github.io/design-style/?lang=en#work-026-art-nouveau)。

## 本地验证

- `gallery:sync` 从正式 Release 下载新附件并核验 SHA-256；构建成片与已审原片再次比对一致。
- 33 项画廊测试全部通过，`git diff --check` 通过。
- `gallery:build` / `gallery:check` 通过：22 项作品、270 个发布文件、2,791 个站内引用、646.4 MiB。
- 独立内置浏览器确认视频实际播放（1920×1080，21 秒，无媒体错误）、四张图解已加载；中英文切换保留当前影片并更新指南与制作过程入口。

线上部署结果待完成后追加；本地验证不替代线上验收。
