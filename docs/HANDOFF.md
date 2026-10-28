# 交接清单（给 Codex）

分工：Claude 负责设计与动效（风格选题、风格图、短片画面与配乐的创作）；下面这些工程 / 运维事项交给 Codex。做完一项就把它从这里删掉，并在提交信息里写清楚。

2026-10-27：部署核验、发布入口说明、依赖安全核验和 REST 同步兼容已完成。009 音量修订版经用户试听确认后发布为 [day-09-audio-v2](https://github.com/guanmo-ai/design-style/releases/tag/day-09-audio-v2)，画廊目录与中英文文档入口已切换到这一版；原 `day-09` 保留供回退。详见 [交接执行记录](reviews/HANDOFF_20261027.md)。本机其余未提交的创作内容继续保留。

2026-10-28：用户确认 014 液态玻璃第三版审片通过；直接采用 `review-renders` 分支的成片，未重新渲染或改动音画。已通过 `release-assets/day-14/` 发布 [day-14](https://github.com/guanmo-ai/design-style/releases/tag/day-14)，包含成片、完整项目源码包及 SHA256SUMS；画廊按首次上架顺序登记为「风格 009」，中英文目录与预览同步更新。

## 待办

### 015 · 未来主义：渲正片 → 推到 review-renders（2026-10-28，主人已看过第二版草稿预览，确认可以出正片）

分支：`claude/wizardly-heisenberg-76l3ue`（最新提交 `3c951c9` 起）。分工见 [设计笔记](DESIGN_NOTES.md#高效流程claude-设计--审片codex-用-mac-的显卡渲染正片014-之后执行)。

1. 拉这个分支，`npm ci`，`npm run fonts`（这一期用 Archivo 可变字体、Space Mono、Noto Sans SC）。
2. 渲正片：`npm run render:015:gpu`（会先跑 `music:015` 生成 `public/015-futurism/music.wav`），输出 `out/015-futurism-master.mp4`，1920×1080 · 60fps · 1200 帧 · 20 秒。
   - 这一期全片是 SVG，没有 WebGL 着色器，显卡不是必需的：`--gl=angle` 只是沿用；云端 4 核软件渲染估计约 10—15 分钟，Mac 上应更快。
   - 运动模糊按每帧最快的东西自动取 1—6 个子帧，正片用默认参数（`blur: 6, step: 1, res: 1`），不要改。
3. 自查：`ffprobe` 看时长 20.00 秒、1200 帧、带 AAC 音轨；抽第 0 帧和第 1199 帧对比（应该是同一个画面的相邻两帧：夜路上赛车正冲进横幅）。
4. 把成片推到 `review-renders` 分支的 `015/`：`015-futurism-master.mp4`，再附 `ffprobe` 输出（`015/ffprobe.txt`）。不要改设计代码；渲染报错或画面和草稿预览不一致，把现象和截图写在这里，由 Claude 修。
5. Claude 拉下成片审片（首尾接缝、每段联系表、关键动作连续帧、字幕、和草稿预览比对）；主人看过成片通过后，再按 014 的做法发布 Release `day-15`（成片 + 源码包 + SHA256SUMS）并上架画廊（中英文目录、预览）。
6. 合并注意：另一个会话在做 016，`package.json`（新增 `music:015` / `render:015` / `render:015:gpu` / `preview:015` / `images:015`）和 `src/Root.tsx`（新增 `S015-Futurism` / `S015-Futurism-Preview` 两个合成）可能和 016 的改动冲突，两边的条目都保留即可。

## 设计侧留下的素材（不用动，供下次做新一期）

- `drafts/op-art`、`drafts/dither`：两套已完成三张风格图的候选风格，说明见 `drafts/README.md`（未来主义已做成 015）。
- 其他分支上在做的期号：007 极简、010 剪纸、011 粘土拟态、012 等距。新开一期前先看 `git branch -r`，避免撞期号。
