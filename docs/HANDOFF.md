# 交接清单（给 Codex）

分工：Claude 负责设计与动效（风格选题、风格图、短片画面与配乐的创作）；下面这些工程 / 运维事项交给 Codex。做完一项就把它从这里删掉，并在提交信息里写清楚。

2026-10-27：部署核验、发布入口说明、依赖安全核验和 REST 同步兼容已完成。009 音量修订版经用户试听确认后发布为 [day-09-audio-v2](https://github.com/guanmo-ai/design-style/releases/tag/day-09-audio-v2)，画廊目录与中英文文档入口已切换到这一版；原 `day-09` 保留供回退。详见 [交接执行记录](reviews/HANDOFF_20261027.md)。本机其余未提交的创作内容继续保留。

2026-10-28：用户确认 014 液态玻璃第三版审片通过；直接采用 `review-renders` 分支的成片，未重新渲染或改动音画。已通过 `release-assets/day-14/` 发布 [day-14](https://github.com/guanmo-ai/design-style/releases/tag/day-14)，包含成片、完整项目源码包及 SHA256SUMS；画廊按首次上架顺序登记为「风格 009」，中英文目录与预览同步更新。

2026-10-28（工程）：标杆几期与 015 的通用部件已抽到 `src/lib/motion/` 和 `scripts/lib/`，原片改用适配层；`new_style.mjs` 起步脚本、复用文档与回归工具已完成。60 张原尺寸静帧逐像素、6 段完整 WAV 逐样本均零差异；40 项 Node 测试、4 项 Python 测试和类型检查通过。独立审查发现的边界问题已修复。2026-10-29 经 Claude 独立复核（结果见执行记录末尾）后合并到 `main`；使用说明见 [REUSE.md](REUSE.md)，证据和交付边界见 [工程执行记录](reviews/REUSE_20261028.md)。

## 待办

### 015 · 未来主义：审片通过后发布（2026-10-28）

这一期全片是 SVG、不需要显卡，正片由 Claude 在云端渲（`npm run render:015`，约十几分钟），推到 `review-renders` 分支的 `015/` 并自审。**Codex 只负责发布**：

1. 等主人看过 `review-renders/015/015-futurism-master.mp4` 并确认通过（这里会更新）。
2. 直接采用 `review-renders` 上的成片，不重新渲染、不改音画；按 014 的做法通过 `release-assets/day-15/` 发布 Release `day-15`（成片 + 完整项目源码包 + SHA256SUMS），画廊登记并同步中英文目录与预览。
3. 合并注意：另一个会话在做 016，`package.json`（新增 `music:015` / `render:015` / `render:015:gpu` / `preview:015` / `images:015`）和 `src/Root.tsx`（新增 `S015-Futurism` / `S015-Futurism-Preview`）可能和 016 冲突，两边的条目都保留。

## 设计侧留下的素材（不用动，供下次做新一期）

- `drafts/op-art`、`drafts/dither`：两套已完成三张风格图的候选风格，说明见 `drafts/README.md`（未来主义已做成 015）。
- 其他分支上在做的期号：007 极简、010 剪纸、011 粘土拟态、012 等距。新开一期前先看 `git branch -r`，避免撞期号。
- 017 中世纪现代（`claude/modest-einstein-xiiv18`）：四张风格图 + 动效分镜已做，等主人看图后做短片。016 留给另一个会话。
