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

## 主干与线上验收

- 上架提交：`f54850a9b99f3a1ea5446b578d2da54999682db8`，已推送 `main`。
- [Pages 构建与部署](https://github.com/guanmo-ai/design-style/actions/runs/43237421526)成功；[主干安全 CI](https://github.com/guanmo-ai/design-style/actions/runs/43237421460)成功，包含自动测试、TypeScript、Remotion bundle 与依赖审计。
- 正式首页显示 22 项作品，新艺术运动排在首位，标签「风格 019」。作品元数据与真实 Release 发布时间一致。
- 完整读取线上原片并计算 SHA-256：24,565,469 字节，与已审原片、Release 附件和本地构建一致。HTTP Range 实测返回 `206`，内容范围及前 64 字节与原片一致；线上媒体仅在内存中核验，未另存。
- 四个中英文阅读页、四张 SVG、封面和原片均 HTTP 200，字节与本地已通过检查的构建一致。
- 独立内置浏览器实际播放至 21 秒结束，1920×1080，无媒体错误；中英文切换正常、四张图解已加载。检查时控制台无错误或警告。
- 本轮未重新做主观画面、音效验收，沿用用户对同字节原片的认可；未测试实体手机或其他浏览器。
- 原主工作区的未提交文件本轮未写入。

截图：[正式首页](live-home.jpg) · [线上播放完成](live-art-nouveau.jpg)。

线上核验时间（UTC）：`2026-11-12T14:32:19.623429+00:00`。
