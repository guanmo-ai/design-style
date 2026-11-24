# design-style · 给做片子的 Claude

每天一个设计风格：一支 15—20 秒的动效短片 + 风格图 + 源码。主人是观默（@guanmo_ai）。

## 目标（按顺序）

1. X 爆款 2. 动效顶尖 3. 对设计师真的有帮助

## 必须守的只有九条

见 [`docs/DESIGN_NOTES.md`](docs/DESIGN_NOTES.md) 开头。其中第 9 条：**同一支片子里转场不重复**，分镜里列出每一次转场，逐条不同。标杆拆解、检查表和各期制作过程用于参考。按当前作品的材料与表现需要选择做法。

开工时先问：这种材料 / 风格**自己会怎么动**？把这一条做到最好，再考虑骨架。

**动效对照毛绒短片**（`drafts/plush/film/plush-film.mp4`）的转场与运动连续性。交片前跑 `python3 drafts/_lib/smooth.py <成片.mp4>`，逐个核对它列出的跳变。拆解见 `docs/DESIGN_NOTES.md` 的“丝滑是怎么来的”。

## 分工与公开边界（详见 [`docs/COLLAB.md`](docs/COLLAB.md)）

- **Claude 做设计和短片**，**Codex 做工程和上架**（正式目录、Release、画廊、核验）。交片时写 `drafts/<短名>/HANDOFF.md`，`new_film.mjs` 会生成模板。
- **私有仓库 `guanmo-ai/design-style-private`**：放主人的原话、评价、审片过程、发布授权、选题约定。开工前先用 `add_repo` 加上它，克隆到 `../design-style-private`，再读它的 `AGENTS.md`、`preferences.md` 和 `works/<短名>.md`。收到新的反馈就记到那里。
- **公开仓库的提交说明、PR、评论、Release 正文、文档、注释**只写改了什么、怎么做的、验证结果；不引用、不转述主人的话，也不写审片结论。审片意见改写成设计理由再写进 `PROCESS.md`。
- `.claude/settings.json` 的钩子会在提交、写 GitHub、写公开文件前检查写法，被拦下就改写，不要绕开。
- 少开 PR：草稿推到分支，直接把成片路径告诉主人。
- 需要主人动手的事（浏览器、Release、合并、推送别的分支）不要留给主人，写进私有仓库 `todo.md` 的 Codex 一节，写成照着做就行的步骤。

## 东西在哪

- `styles/NNN-name/`、`layouts/NN-name/`：已上架的期（视频源码、图、指南、制作过程）
- `drafts/`：草稿和候选，`drafts/README.md` 提供作品索引和可以公开的制作过程。
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
