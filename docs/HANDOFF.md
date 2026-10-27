# 交接清单（给 Codex）

分工：Claude 负责设计与动效（风格选题、风格图、短片画面与配乐的创作）；下面这些工程 / 运维事项交给 Codex。做完一项就把它从这里删掉，并在提交信息里写清楚。

## 待办

1. **核对 009 的 Pages 部署。** PR #14 合并后 `Deploy Design Style` 会自动跑。确认工作流成功，线上首页出现「新粗野主义」，视频能播放、阅读页能打开：<https://guanmo-ai.github.io/design-style/#work-009-neo-brutalism>
2. **发布工作流放在哪。** 目前 `.github/workflows/publish-release.yml` 只在 `release-assets` 分支上（推送该分支就会核对 SHA-256 并为新 tag 创建 Release，见 `docs/GALLERY.md`「添加下一期」第 2 步）。评估是否需要同步一份到 main 方便手动触发；不需要就在 GALLERY.md 里写明“只在 release-assets 分支”。
3. **009 配乐 4—5 秒混音（低优先级）。** 01 黑框后半音效太密、压住 BGM。在 `styles/009-neo-brutalism/audio/make_music.py` 的 `# ----- 01 黑框` 段把音效整体降 3—4 dB，或去掉每个框的 whoosh；改完要重新渲染、重新发布（新附件并更新 `works.json` 的 sha256）。动已发布的成片前先问主人。
4. **依赖安全。** PR #14 用 `overrides` 把 zod 固定到 4.6.7，修了 npm audit 高危告警（GHSA-mrhx-c7xc-m3w5）。Remotion 升级到自带 zod ≥ 4.6.6 的版本后，可以去掉这条 override。
5. **云端会话的已知限制。** Claude Code 云端会话不能直接创建 GitHub Release（API 返回 403），也不能用 `gh release download`（GraphQL 被禁）；`gallery:sync` 依赖后者。需要时可改用 REST：`gh api repos/{owner}/{repo}/releases/assets/{id} -H "Accept: application/octet-stream"`。
6. **布局 03 · 分屏 Split Screen 上架。** 源码、4 张图、文档都在 `layouts/03-split-screen/`（`npm run render:L03` 出母版，约 10 MB）。云端会话不能创建 Release：需要在 `release-assets` 分支的 `layout-03/` 里放成片 + `release.json` + `notes.md` + `SHA256SUMS`（格式同 `day-09/`），推送后由 `publish-release.yml` 发布 tag `layout-03`；然后把 `gallery/data/pending/03-split-screen.json` 补上 `publishedAt` 与 `sha256`，移到 `works.json`，跑 `npm run gallery:sync && npm test`，并核对线上。根 README 的表格里这一期现在写的是“视频待发布”，发布后换成视频链接。
7. **期号撞车：三条分支都叫“布局 03”。** 远端的 `layout-03-scrollytelling`（滚动叙事，`layouts/03-scrollytelling`）、`cursor/card-stack-layout-b8f6`（卡片堆叠，`layouts/03-card-stack`）和这一期（分屏，`layouts/03-split-screen`）都没合并、都占了 03，并且都用了 `music:L03 / render:L03 / images:L03` 三个 npm 脚本名。合并前由主人定号（比如 03 / 04 / 05），再改：目录名、`tokens.json` 的 `name` 与 `number`、npm 脚本后缀、`src/Root.tsx` 的 Composition id、`public/NN-*/music.wav` 路径、图和视频里的“布局 03”字样（视频里是 `intro.tsx` / `end.tsx`，改完要重新渲染）。

## 设计侧留下的素材（不用动，供下次做新一期）

- `drafts/art-deco`、`drafts/op-art`：两套已完成三张风格图的候选风格；`drafts/broken-grid`、`drafts/stacked-cards`：布局 03 三选一里落选的两个候选（各一张海报）。说明见 `drafts/README.md`。
- 其他分支上在做的期号：风格 007 极简、010 剪纸、011 粘土拟态、012 等距；布局 03 滚动叙事、03 卡片堆叠（见待办 7）。新开一期前先看 `git branch -r`，避免撞期号。
