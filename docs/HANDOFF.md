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

### 把标杆几期的可复用部件解耦成共用库（Codex）

按主人认可的排序取：**003 构成主义（最好）→ 004 孟菲斯 → 001 包豪斯、布局 02 瀑布流、005 波普**；015 的通用工具顺带收进来。它们各自好在哪见 [`BENCHMARKS.md`](BENCHMARKS.md)。

1. 新建共用库（建议 `src/lib/motion/`，按用途分文件），把下面这些从各期 `video/` 里抽出来、去掉对某一期 tokens 的硬依赖（颜色、字体、节拍改成参数）：
   - **003** `ui.tsx`：轴坐标 `on()`（主轴 / 副轴定位）、`wedge` / `bar` / `hull` / `arcPath`、盖章 `stamp` + `Scale`、网点 `halftone`、斜切转场 `slashPoly`、推镜 `cam` + 对数推进 `zoomIn`、署名牌 `Credit` / 提示牌 `Tip`
   - **004**：落地压扁回弹（以底边为原点）、“长出来代替淡入”、糖果色带波浪边的颜色接力转场、`circ` / `rect` / `tri` / `half` 形状路径、`Burst`
   - **001**：圆 / 方 / 三角带描边的擦除转场、背景色轮换
   - **布局 02**：同一批卡片在不同排法之间流动（被打断也从当前位置接着走）、落下（重力 + 4.5% 回弹）、算法读数（列高、最短列标红）
   - **005**：Slap（1.35 → 1，7 帧）、网点长满接力、丝网刮板、汤罐翻面（`|cos|` 横向缩放）
   - **015**：`kit.tsx` 的 Echoes（按真实轨迹取样的残影）/ Word（逐字排、wdth 跟速度，配 `make_metrics.py`）/ ForceLines / Rise；`motion.ts` 的 kin / path1 / springOf / leanOf / land / anticLand / wobble / follow；`Futurism.tsx` + `scenes.ts` 的自适应运动模糊（按最快速度取子帧、不跨段）和 step / blur / res 参数；`curves.ts` + `scripts/plot_probe.py`；`audio/make_music.py` 的乐器、音效、侧链、余音折回与 −14 LUFS 母带（抽成乐器库，每期只写“哪一帧响什么”）
2. 原来的几期改成从共用库引用，**画面和声音逐像素不变**：改之前先用 `scripts/stills_batch.mjs` 出每期 10 帧左右（含快动作段），改完再出一遍逐像素比对，再跑一次 `npm run music:NNN` 比对 wav；有差异就不要合并。
3. 写一份 `docs/REUSE.md`：每个部件一行——名字、出自哪一期、效果是什么、怎么调用（3—5 行示例），并在 `DESIGN_NOTES.md` 的“复用”一节链接过去。
4. 加一个新一期起步脚本（如 `node scripts/new_style.mjs 016-name`）：生成 `video/` 骨架（主合成 + 时间轴 + scenes 登记 + 外框 + 运动模糊 + step / blur / res）、在 `src/Root.tsx` 注册正片与草稿预览两个合成、在 `package.json` 加 `music / render / render:gpu / preview / images` 五条命令、复制配乐和文档模板。
5. 以后每做完一期，把新的通用部件补进共用库和 `REUSE.md`。

## 设计侧留下的素材（不用动，供下次做新一期）

- `drafts/op-art`、`drafts/dither`：两套已完成三张风格图的候选风格，说明见 `drafts/README.md`（未来主义已做成 015）。
- 其他分支上在做的期号：007 极简、010 剪纸、011 粘土拟态、012 等距。新开一期前先看 `git branch -r`，避免撞期号。
