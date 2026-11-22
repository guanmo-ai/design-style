# __TITLE__ · 交接单

Claude 交片时填写，Codex 上架时照着做。只写技术事实；审片意见和发布授权记在私有仓库 `works/__NAME__.md`（见 [`docs/COLLAB.md`](../../docs/COLLAB.md)）。

## 成片

| 项 | 值 |
|---|---|
| 文件 | `drafts/__NAME__/film/__NAME__-film.mp4` |
| 来源提交 | |
| SHA-256 / 字节 | |
| 规格 | 1920×1080 · 60fps · 帧数 · 秒数 |
| 音频 | 响度（LUFS）/ 峰值（dBTP） |
| `smooth.py` | 跳变 · 死区 · 最大 |

## 看过什么、没验证什么

- 看过：联系表、关键动作连续帧、第 0 帧和最后一帧全质量单帧。
- 没看过播放，没听过声音，要主人自己看和听。
- 其他没验证的：

## 上架还缺什么

- [ ] 四张风格图（可编辑 SVG + PNG）
- [ ] tokens 与时间轴
- [ ] 中英文风格指南 `README.md` / `README.en.md`
- [ ] 中英文制作过程 `PROCESS.md` / `PROCESS.en.md`
- [ ] 字体下载与许可
- [ ] 正式目录 `styles/NNN-__NAME__/`、Release 附件与 `SHA256SUMS`、画廊 `works.json` 条目

## 复现

```bash
bash drafts/__NAME__/film/make.sh
```

## 上架时发现的问题

（Codex 填写，交回 Claude）
