# 交接清单（给 Codex）

分工：Claude 负责设计与动效（风格选题、风格图、短片画面与配乐的创作）；下面这些工程 / 运维事项交给 Codex。做完一项就把它从这里删掉，并在提交信息里写清楚。

2026-10-27：部署核验、发布入口说明、依赖安全核验和 REST 同步兼容已完成。009 音量修订版经用户试听确认后发布为 [day-09-audio-v2](https://github.com/guanmo-ai/design-style/releases/tag/day-09-audio-v2)，画廊目录与中英文文档入口已切换到这一版；原 `day-09` 保留供回退。详见 [交接执行记录](reviews/HANDOFF_20261027.md)。本机其余未提交的创作内容继续保留。

2026-10-28：用户确认 014 液态玻璃第三版审片通过；直接采用 `review-renders` 分支的成片，未重新渲染或改动音画。已通过 `release-assets/day-14/` 发布 [day-14](https://github.com/guanmo-ai/design-style/releases/tag/day-14)，包含成片、完整项目源码包及 SHA256SUMS；画廊按首次上架顺序登记为「风格 009」，中英文目录与预览同步更新。

## 待办

### 015 · 未来主义：审片通过后发布（2026-10-28）

这一期全片是 SVG、不需要显卡，正片由 Claude 在云端渲（`npm run render:015`，约十几分钟），推到 `review-renders` 分支的 `015/` 并自审。**Codex 只负责发布**：

1. 等主人看过 `review-renders/015/015-futurism-master.mp4` 并确认通过（这里会更新）。
2. 直接采用 `review-renders` 上的成片，不重新渲染、不改音画；按 014 的做法通过 `release-assets/day-15/` 发布 Release `day-15`（成片 + 完整项目源码包 + SHA256SUMS），画廊登记并同步中英文目录与预览。
3. 合并注意：另一个会话在做 016，`package.json`（新增 `music:015` / `render:015` / `render:015:gpu` / `preview:015` / `images:015`）和 `src/Root.tsx`（新增 `S015-Futurism` / `S015-Futurism-Preview`）可能和 016 冲突，两边的条目都保留。

## 设计侧待办（下一个 Claude 会话做，不是 Codex）

- **把 015 的通用部件解耦出来**，放到共用的地方供后面每一期复用，并在 `DESIGN_NOTES.md` 的“复用”一节登记：
  - `styles/015-futurism/video/kit.tsx`：Echoes（按真实轨迹取样的残影）、Word（逐字排、wdth 跟速度走，配 `make_metrics.py` 生成的字宽表）、ForceLines、Rise（遮罩升起，不用 id）、camT / zoomLerp / mixHex
  - `motion.ts`：kin（分段匀加速）、path1（速度连续的轨迹）、springOf / leanOf（惯性前倾）、land / anticLand / wobble / follow
  - `Futurism.tsx` + `scenes.ts` + `hud.tsx`：按时间挂载各段、自适应运动模糊（按最快速度取子帧、不跨段）、step / blur / res 参数、右上角读数、底栏进度
  - `curves.ts` + `scripts/plot_probe.py`：probe(f) 式的剧本曲线
  - `audio/make_music.py`：鼓 / 贝斯 / 钢琴 / 钟琴 / 铺底 / 弹拨弦 / 各种音效、侧链、余音折回、−14 LUFS 母带——抽成乐器库，每期只写“哪一帧响什么”
  - 再加一个新一期起步脚本（生成 video/ 骨架、注册合成、加 render / preview 命令）
- 解耦时不要改 015 的成片画面；改完用 `npm run preview:015` 对比一遍。

## 设计侧留下的素材（不用动，供下次做新一期）

- `drafts/op-art`、`drafts/dither`：两套已完成三张风格图的候选风格，说明见 `drafts/README.md`（未来主义已做成 015）。
- 其他分支上在做的期号：007 极简、010 剪纸、011 粘土拟态、012 等距。新开一期前先看 `git branch -r`，避免撞期号。
