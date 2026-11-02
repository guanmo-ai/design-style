# 交接清单（给 Codex）

分工：Claude 负责设计与动效（风格选题、风格图、短片画面与配乐的创作）；下面这些工程 / 运维事项交给 Codex。做完一项就把它从这里删掉，并在提交信息里写清楚。

2026-10-27：部署核验、发布入口说明、依赖安全核验和 REST 同步兼容已完成。009 音量修订版经用户试听确认后发布为 [day-09-audio-v2](https://github.com/guanmo-ai/design-style/releases/tag/day-09-audio-v2)，画廊目录与中英文文档入口已切换到这一版；原 `day-09` 保留供回退。详见 [交接执行记录](reviews/HANDOFF_20261027.md)。本机其余未提交的创作内容继续保留。

2026-10-28：用户确认 014 液态玻璃第三版审片通过；直接采用 `review-renders` 分支的成片，未重新渲染或改动音画。已通过 `release-assets/day-14/` 发布 [day-14](https://github.com/guanmo-ai/design-style/releases/tag/day-14)，包含成片、完整项目源码包及 SHA256SUMS；画廊按首次上架顺序登记为「风格 009」，中英文目录与预览同步更新。

2026-10-28（工程）：标杆几期与 015 的通用部件已抽到 `src/lib/motion/` 和 `scripts/lib/`，原片改用适配层；`new_style.mjs` 起步脚本、复用文档与回归工具已完成。60 张原尺寸静帧逐像素、6 段完整 WAV 逐样本均零差异；40 项 Node 测试、4 项 Python 测试和类型检查通过。独立审查发现的边界问题已修复。2026-10-29 经 Claude 独立复核（结果见执行记录末尾）后合并到 `main`；使用说明见 [REUSE.md](REUSE.md)，证据和交付边界见 [工程执行记录](reviews/REUSE_20261028.md)。

2026-10-29：`claude/admiring-planck-2gmzzh` 已合并到 `main`；018 微缩景观直接采用主人确认的 30fps 审片成片，经 `release-assets/day-18/` 发布 [day-18](https://github.com/guanmo-ai/design-style/releases/tag/day-18)（成片 + 完整项目源码 ZIP + SHA256SUMS）。画廊按首次上架顺序登记为「风格 010」，中英文目录、指南链接与预览同步；019 继续等待主人审片确认。执行与核验证据见 [018 发布记录](reviews/PUBLISH_018_20261029.md)。

2026-10-30：按主人反馈修复 018 线上屋面闪烁（两层顶面共面）与重复电线。完整重渲 1080p / 30fps / 20 秒并复用原音轨，通过规范与需求两个轴的发布前审查、修复前后连续帧、全片解码和回归检查后发布 [day-18-flicker-v2](https://github.com/guanmo-ai/design-style/releases/tag/day-18-flicker-v2)。画廊继续登记为「风格 010」，切换修复版媒体哈希，并用哈希视频 URL 防止复用旧缓存；原 `day-18` 保留回退，019 继续待确认。详见 [修复与审查记录](reviews/018_FLICKER_20261030.md)。

2026-10-30：主人明确 019 低多边形已审片同意；直接采用 `review-renders` 的 60fps 成片，经 `release-assets/day-19/` 发布 [day-19](https://github.com/guanmo-ai/design-style/releases/tag/day-19)（成片 + 完整项目源码 ZIP + SHA256SUMS），音画字节与审片版一致。画廊登记为「风格 011」，中英文目录与预览同步，时间轴对齐 60fps / 1200 帧；本项交接关闭。详见 [019 发布记录](reviews/PUBLISH_019_20261030.md)。

## 待办

### 018 · 微缩景观第三版：主人审片通过后，显卡渲 60fps 正片并发布（2026-11-02）

主人反馈“音效和 BGM 不流畅、要丝滑；往电影感 / 顶尖动画电影靠；细节少、建筑僵硬、要圆润”。Claude 已在分支 `claude/diorama-audio-style-polish-cppqt4` 改完画面（圆角平滑造型、电影布光、桌面、几十件带二级动画的小道具、样条镜头、去掉倒带的结尾）和配乐（整首重写），并在云端用软件渲染出 30fps 审片版交给主人。改动说明见 `styles/018-diorama/PROCESS.md` 第 3.5 节。**Codex 只执行渲染和发布，不改设计：**

1. 等主人确认第三版审片通过（这里会更新）。
2. 在 Mac 上用显卡渲 60fps 正片（同一时间轴，每一帧是时间的纯函数）：
   `cd styles/018-diorama/video3d && npm i && node --test geometry.test.mjs`
   `ANGLE_BACKEND=metal PR=1 node render.cjs episode.html out 0 1199 1920 1080 60`
   `python3 ../audio/make_music.py out/events.json out/music.wav`
   `ffmpeg -framerate 60 -i out/f%04d.png -i out/music.wav -c:v libx264 -crf 16 -pix_fmt yuv420p -c:a aac -b:a 256k -shortest 018-diorama.mp4`
   画面与云端 30fps 审片版对比（同一秒数抽帧）；有差异记在这里，由 Claude 修代码。
3. 经 `release-assets/day-18-v3/` 发布新 Release `day-18-v3`（成片 + 完整项目源码 ZIP + SHA256SUMS），旧 `day-18-flicker-v2` 保留回退。
4. 画廊：`works.json` 里 018 的 `release`、`sha256` 换成新版本，期号仍是「风格 010」；`tokens.json` 的 `motion` / `video` 改成 60fps / 1200 帧，`process/timeline.json` 的帧号按 60fps 翻倍；README / PROCESS（中英）顶部的 Release 链接换成 `day-18-v3`；封面换成新版第 0 帧（`video3d/cover.jpg` 与 `video/cover.jpg` 字节一致）。


### 015 · 未来主义：审片通过后发布（2026-10-28）

这一期全片是 SVG、不需要显卡，正片由 Claude 在云端渲（`npm run render:015`，约十几分钟），推到 `review-renders` 分支的 `015/` 并自审。**Codex 只负责发布**：

1. 等主人看过 `review-renders/015/015-futurism-master.mp4` 并确认通过（这里会更新）。
2. 直接采用 `review-renders` 上的成片，不重新渲染、不改音画；按 014 的做法通过 `release-assets/day-15/` 发布 Release `day-15`（成片 + 完整项目源码包 + SHA256SUMS），画廊登记并同步中英文目录与预览。
3. 合并注意：另一个会话在做 016，`package.json`（新增 `music:015` / `render:015` / `render:015:gpu` / `preview:015` / `images:015`）和 `src/Root.tsx`（新增 `S015-Futurism` / `S015-Futurism-Preview`）可能和 016 冲突，两边的条目都保留。

## 设计侧留下的素材（不用动，供下次做新一期）

- `drafts/op-art`、`drafts/dither`：两套已完成三张风格图的候选风格，说明见 `drafts/README.md`（未来主义已做成 015）。
- 其他分支上在做的期号：007 极简、010 剪纸、011 粘土拟态、012 等距。新开一期前先看 `git branch -r`，避免撞期号。
