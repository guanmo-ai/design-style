# 工程与发布记录

这里记录公开的工程验证、版本与发布入口。

2026-10-27：部署核验、发布入口说明、依赖安全核验和 REST 同步兼容已完成。009 音量修订版发布为 [day-09-audio-v2](https://github.com/guanmo-ai/design-style/releases/tag/day-09-audio-v2)，画廊目录与中英文文档入口已切换到这一版；原 `day-09` 保留供回退。详见 [交接执行记录](reviews/HANDOFF_20261027.md)。

2026-10-28：014 液态玻璃第三版直接采用 `review-renders` 分支的成片，未重新渲染或改动音画。已通过 `release-assets/day-14/` 发布 [day-14](https://github.com/guanmo-ai/design-style/releases/tag/day-14)，包含成片、完整项目源码包及 SHA256SUMS；画廊按首次上架顺序登记为「风格 009」，中英文目录与预览同步更新。

2026-10-28（工程）：标杆几期与 015 的通用部件已抽到 `src/lib/motion/` 和 `scripts/lib/`，原片改用适配层；`new_style.mjs` 起步脚本、复用文档与回归工具已完成。60 张原尺寸静帧逐像素、6 段完整 WAV 逐样本均零差异；40 项 Node 测试、4 项 Python 测试和类型检查通过。独立审查发现的边界问题已修复。2026-10-29 经 Claude 独立复核（结果见执行记录末尾）后合并到 `main`；使用说明见 [REUSE.md](REUSE.md)，证据和交付边界见 [工程执行记录](reviews/REUSE_20261028.md)。

2026-10-29：`claude/admiring-planck-2gmzzh` 已合并到 `main`；018 微缩景观直接采用 30fps 审片成片，经 `release-assets/day-18/` 发布 [day-18](https://github.com/guanmo-ai/design-style/releases/tag/day-18)（成片 + 完整项目源码 ZIP + SHA256SUMS）。画廊按首次上架顺序登记为「风格 010」，中英文目录、指南链接与预览同步；执行与核验证据见 [018 发布记录](reviews/PUBLISH_018_20261029.md)。

2026-10-30：修复 018 线上屋面闪烁（两层顶面共面）与重复电线。完整重渲 1080p / 30fps / 20 秒并复用原音轨，通过规范与需求两个轴的发布前审查、修复前后连续帧、全片解码和回归检查后发布 [day-18-flicker-v2](https://github.com/guanmo-ai/design-style/releases/tag/day-18-flicker-v2)。画廊继续登记为「风格 010」，切换修复版媒体哈希，并用哈希视频 URL 防止复用旧缓存。原 `day-18` 保留回退。详见 [修复与审查记录](reviews/018_FLICKER_20261030.md)。

2026-10-30：019 低多边形直接采用 `review-renders` 的 60fps 成片，经 `release-assets/day-19/` 发布 [day-19](https://github.com/guanmo-ai/design-style/releases/tag/day-19)（成片 + 完整项目源码 ZIP + SHA256SUMS），音画字节与审片版一致。画廊登记为「风格 011」，中英文目录与预览同步，时间轴对齐 60fps / 1200 帧；本项交接关闭。详见 [019 发布记录](reviews/PUBLISH_019_20261030.md)。

2026-11-02：完成 018 微缩景观第三版 1080p / 60fps / 1200 帧正片，设计与配乐代码保持 `1606f5c`；与 `review-renders` 提交 `430b92a` 的第三版审片同秒对照，云端与本机 WAV、事件表 SHA-256 完全一致。已通过 `release-assets/day-18-v3/` 发布 [day-18-v3](https://github.com/guanmo-ai/design-style/releases/tag/day-18-v3)（成片 + 完整项目源码 ZIP + SHA256SUMS），旧版保留回退；画廊维持「风格 010」，同步 60fps 时间轴、新封面、中英文入口和预览。本项交接关闭，部署与核验证据见 [第三版发布记录](reviews/PUBLISH_018_V3_20261102.md)。

2026-11-04：017 中世纪现代直接采用 `review-renders/017/` 的 1080p / 60fps / 900 帧成片，已发布 [day-17](https://github.com/guanmo-ai/design-style/releases/tag/day-17)（成片 + 完整项目源码 ZIP + SHA256SUMS），三项远端附件大小与 SHA-256 均通过。画廊登记为「风格 012」，同步中英文目录、预览及时间轴；发布记录与线上核验状态见 [017 发布记录](reviews/PUBLISH_017_20261104.md)。本项发布交接关闭。

2026-11-04：字符画与生成艺术发布版采用 `claude/vigilant-galileo-j1sfyr` 的 `ced34bf` 原片，补齐正式目录 `020-ascii-art` / `021-generative-art`、四张可编辑 SVG、中英文文档、来源与字体许可、时间轴和复现入口后，已发布 [day-20](https://github.com/guanmo-ai/design-style/releases/tag/day-20) / [day-21](https://github.com/guanmo-ai/design-style/releases/tag/day-21)（每期成片 + 完整项目源码 ZIP + SHA256SUMS），六项附件远端大小与 SHA-256 均一致。画廊按首次上架顺序登记为「风格 013 / 014」。发布与线上核验证据见 [020 / 021 发布记录](reviews/PUBLISH_020_021_20261104.md)。

2026-11-07：点云与液态金属分别发布 [day-22](https://github.com/guanmo-ai/design-style/releases/tag/day-22) / [day-23](https://github.com/guanmo-ai/design-style/releases/tag/day-23)（每期成片 + 完整项目源码ZIP + SHA256SUMS），六项附件远端digest与大小核对一致；正式目录022 / 023，网站风格015 / 016。画廊部署与线上验收见 [022 / 023 发布记录](reviews/PUBLISH_022_023_20261107.md)。

## 水墨发布（2026-11-09）

水墨已合入 `main` 的 `93303c9`，发布 `day-24` 并完成线上播放核验。沿用提交 `04f0aed` 的完整原片，正式目录为 `024-ink-wash`，网站顺序为「风格 017」。详见[发布记录](reviews/PUBLISH_024_20261109.md)。

## 维也纳分离派发布（2026-11-22）

画廊登记为「风格 023」，制作目录为 `030-secession`。成片、原片校验值和播放规格见[发布记录](reviews/PUBLISH_030_20261122.md)。

## 朋克复印机发布（2026-11-24）

画廊登记为「风格 024」，制作目录为 `styles/031-punk`。第五版成片、帧数与校验值见[发布记录](reviews/PUBLISH_031_20261124.md)。
