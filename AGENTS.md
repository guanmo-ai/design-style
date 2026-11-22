# design-style · 给 Codex

每天一个设计风格：一支 15—20 秒的动效短片 + 风格图 + 源码。主人是观默（@guanmo_ai）。

分工、交接和公开边界见 [`docs/COLLAB.md`](docs/COLLAB.md)。要点：

- **Codex 负责工程和上架**：正式目录、Release 附件与 `SHA256SUMS`、画廊登记（`docs/GALLERY.md`）、README 拼图、发布核验、工具、依赖、CI。往期做法见 `docs/HANDOFF.md` 和 `docs/reviews/`。
- **画面和声音是 Claude 做的**：上架时直接采用交接单 `drafts/<短名>/HANDOFF.md` 里的成片，不转码、不改音画。发现问题写进交接单的“上架时发现的问题”，交回 Claude 修改。
- **上架和发布要观默审片通过**：以私有仓库 `guanmo-ai/design-style-private` 的 `works/<短名>.md` 里的记录为准，或者观默直接交代。

## 公开内容的硬规则

提交说明、PR 标题和正文、评论、Release 正文、公开文档、代码注释只写改了什么、怎么做的、验证结果。

- 不引用、不转述主人的话，也不写审片结论、发布授权。
- 不写本机路径、备份位置、邮箱。
- 这些内容记到私有仓库。提交前跑 `npm run privacy:check -- --commits origin/main..HEAD` 和 `npm run privacy:check -- --diff origin/main`。CI 的 `privacy.yml` 也会检查。
