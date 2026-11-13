# design-style · 给做片子的 Claude

每天一个设计风格：一支 15—20 秒的动效短片 + 风格图 + 源码。主人是观默（@guanmo_ai）。

## 目标（按顺序）

1. X 爆款 2. 动效顶尖 3. 对设计师真的有帮助

## 必须守的只有八条

见 [`docs/DESIGN_NOTES.md`](docs/DESIGN_NOTES.md) 开头。其余所有文档（标杆拆解、检查表、各期的制作过程）都是**参考**：记录的是“那一期为什么过 / 没过”，不是这一期必须怎么做。主人 2026-11-11：“不要让仓库限制了你以后的发挥。”

开工时先问：这种材料 / 风格**自己会怎么动**？把这一条做到最好，再考虑骨架。

**第 0 帧（封面）要让人停下来点赞收藏评论，做新片时先把第 0 帧单独交给主人看**（主人 2026-11-13 强调，见 `docs/DESIGN_NOTES.md` 第 2 条）。

**BGM 和音效必须做好，和画面同等重要**（主人 2026-11-13 强调，底线见 `docs/DESIGN_NOTES.md` 第 5 条）：一整首有鼓、贝斯、旋律的歌，每个大动作一个落在拍点上的声音，不要噪音感。

**动效的底线是毛绒那一期**（`drafts/plush/film/plush-film.mp4`，主人：“很丝滑”“以后至少达到这样的标准”，要“让人有惊艳的感觉”）。交片前跑 `python3 drafts/_lib/smooth.py <成片.mp4>`，逐个核对它列出的跳变；拆解见 `docs/DESIGN_NOTES.md` 的“丝滑是怎么来的”。

## 东西在哪

- `styles/NNN-name/`、`layouts/NN-name/`：已上架的期（视频源码、图、指南、制作过程）
- `drafts/`：没上架的草稿和候选；`drafts/README.md` 是每一轮主人说了什么的记录
- `drafts/_lib/kit/`：**做片子的组件**（动作、镜头 / 颜色接力 / 转场、舞台、HUD、撒点）和新片模板，从毛绒成片拆出来的；起新片：`node drafts/_lib/kit/new_film.mjs <短名> "<标题>"`，说明见 [`README.md`](drafts/_lib/kit/README.md)
- `drafts/_lib/fur/`：专用组件——毛绒渲染器（毛、草、毛线这类才用）
- `drafts/_lib/`：其余共用工具（逐帧截图、联系表、量丝滑、一整首歌的配乐骨架、软的音效、出字的声音）
- `.claude/skills/style-film/`：做一期新片的做法（skill）
- `drafts/plush/`：最近一期（毛绒），[`PROCESS.md`](drafts/plush/PROCESS.md) 是从一个词到成片的完整过程
- `src/`、`scripts/`：早期 Remotion 片子的入口和工具；`gallery/`：网页画廊
- `docs/GPU_MOTION.md`：没有显卡的云端怎么渲 WebGL（实测的坑和数字）

## 云端会话里要知道的

- 4 核、没有显卡，WebGL 走 SwiftShader。**先用一个最小页面测一帧多少秒，再决定画质**；后台命令最长 2 小时，渲染要能断点续渲（每帧是帧号的纯函数）。
- 准备环境：`npm run fonts`（下不到的字体会列出来，重跑即可）、`pip install -r requirements.txt`。Playwright 和 Chromium 已经装好，不要再装。
- 审片从便宜到贵：低密度全片联系表 → 关键动作的连续帧 → 全质量单帧 → 才渲正片。
- Claude 看不了播放、听不了声音。交付时说清楚哪些是看过静帧的、哪些要主人自己看和听。
- 上架、发布、画廊登记要主人审片通过；草稿成片放在 `drafts/<风格>/film/`。
