# 交接清单（给 Codex）

分工：Claude 负责设计与动效（风格选题、风格图、短片画面与配乐的创作）；下面这些工程 / 运维事项交给 Codex。做完一项就把它从这里删掉，并在提交信息里写清楚。

2026-10-27：部署核验、发布入口说明、依赖安全核验和 REST 同步兼容已完成。009 音量修订版经用户试听确认后发布为 [day-09-audio-v2](https://github.com/guanmo-ai/design-style/releases/tag/day-09-audio-v2)，画廊目录与中英文文档入口已切换到这一版；原 `day-09` 保留供回退。详见 [交接执行记录](reviews/HANDOFF_20261027.md)。本机其余未提交的创作内容继续保留。

## 待办

### 014 · 液态玻璃：成片已渲好，不用重渲

- 第三版成片已在云端分段渲好，放在 `review-renders` 分支 `014/014-liquid-glass-master.mp4`（附 SHA256SUMS）。主人审片通过后直接用它发布；只有设计再改动时才需要重渲。
- 以后每期：Claude 推代码后，Codex 在 Mac 上 `npm run render:NNN:gpu`（`--gl=angle` 走显卡），把成片推到 `review-renders` 分支的 `NNN/`；渲染报错或画面和 Claude 的预览不一致时，不改设计代码，把报错 / 截图记在这里交给 Claude。

### 014 · 液态玻璃：发布（等主人审片通过后再做）

- [ ] 用审片通过的那一版成片（`review-renders` 分支 `014/`），改名 `014-liquid-glass.mp4`
- [ ] 发布 Release `day-14`：照 day-13 的方式放进 `release-assets` 分支的 `day-14/`（mp4 + 源码 zip + SHA256SUMS + release.json + notes.md）
- [ ] 封面 `styles/014-liquid-glass/video/cover.jpg` 已由设计侧从第 0 帧导出；若成片重渲染，核对仍与第 0 帧一致
- [ ] 画廊上架：`gallery/data/works.json` 加 `014-liquid-glass`（四张图：poster / cheatsheet / app-ui / steps），取下一个上架期号；跑 `npm run gallery:sync && npm test && npm run gallery:build && npm run gallery:check`
- [ ] 首页 `README.md` / `README.en.md` 目录表加 014 一行（一句话：玻璃不发光，只把后面的东西弯过来：折射量 = 边缘的坡度）

## 设计侧留下的素材（不用动，供下次做新一期）

- `drafts/op-art`、`drafts/dither`、`drafts/futurism`：三套已完成三张风格图的候选风格，说明见 `drafts/README.md`。
- 其他分支上在做的期号：007 极简、010 剪纸、011 粘土拟态、012 等距；014 液态玻璃在 `claude/amazing-carson-xe6qyo`。新开一期前先看 `git branch -r`，避免撞期号。
